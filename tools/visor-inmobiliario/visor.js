// Visor inmobiliario 3D (núcleo). Contrato: ESQUEMA.md
// Recorrido 360 (fotos equirectangulares) + modo libre (gaussian splat / GLB) + maqueta 3D,
// con estilos, día/noche, pintura de paredes, medición, visita guiada y API pública.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GRAD, angDif, rumbo, Emisor, almacen, hexALineal, areaPoligono, puntoEnPoligono, formatoMetros } from "./util.js";
import { crearPlano } from "./plano.js";
import { crearMedicion } from "./medicion.js";
import { crearMaqueta } from "./maqueta.js";
import { crearGuion } from "./guion.js";

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const EMBED = params.has("embed");
const esTactil = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
const prefiereReducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (esTactil) document.body.classList.add("tactil");
if (EMBED) document.body.classList.add("embed");

// ------------------------------------------------------------------ textos
const FALLBACK = {
  "modo.tour": "Recorrido 360", "modo.libre": "Modo libre 3D", "modo.maqueta": "Maqueta 3D",
  "ayuda.titulo": "Controles", "ayuda.mirar": "Arrastra para mirar alrededor", "ayuda.avanzar": "W A S D o flechas: ir a la estancia de delante, detrás o a los lados",
  "ayuda.volver": "Mantén W para seguir avanzando · Q E girar", "ayuda.girar": "Clic: capturar el ratón y mirar como en un videojuego (Esc para soltar)", "ayuda.zoom": "Rueda o pellizco: zoom",
  "ayuda.flechas": "Toca las flechas del suelo, el plano o la galería", "ayuda.caminar": "W A S D o flechas para caminar · ratón para mirar", "ayuda.correr": "Shift correr · Espacio saltar · Q E girar",
  "ayuda.subir": "Sin suelo (splat): Espacio subir · C bajar", "ayuda.capturar": "Clic para capturar el ratón (Esc para soltar)",
  "ayuda.joystick": "Móvil: pulgar izquierdo para caminar, arrastra a la derecha para mirar", "ayuda.plano": "M mostrar/ocultar mapa · R radar o plano · V cambiar modo · 1-9 estancias · H ayuda",
  "aviso.cargando": "Cargando…", "aviso.error_carga": "No se pudo cargar {x}", "aviso.sin_tour": "No se encontró tour.json. Mostrando la demo.",
  "aviso.sin_webgl": "Tu dispositivo no admite el recorrido 3D", "aviso.contexto_perdido": "Se perdió el contexto gráfico", "aviso.reintentar": "Reintentar",
  "aviso.clic_explorar": "Haz clic para explorar", "aviso.libre_tactil": "Pulgar izquierdo para caminar · arrastra a la derecha para mirar",
  "aviso.libre_raton": "WASD o flechas para caminar · ratón para mirar · Espacio saltar · Shift correr", "aviso.arrastra": "Arrastra para mirar",
  "aviso.estilo_no_disponible": "Este estilo no está disponible en esta estancia",
  "medir.titulo": "Medir", "medir.distancia": "Distancia", "medir.altura": "Altura", "medir.marcar": "Marcar punto", "medir.deshacer": "Deshacer",
  "medir.borrar": "Borrar", "medir.cerrar": "Cerrar", "medir.ayuda_a": "Apunta al suelo y marca el punto A", "medir.ayuda_b": "Ahora marca el punto B",
  "medir.ayuda_altura_a": "Marca la base de la pared (en el suelo)", "medir.ayuda_altura_b": "Ahora marca el punto superior",
  "medir.precision": "Medida orientativa (±3 %)", "medir.suelo": "Apunta al suelo",
  "plano.planta": "Planta", "plano.ampliar": "Ampliar plano", "guion.iniciar": "Visita guiada", "guion.parar": "Detener visita",
  "estilo.original": "Actual", "estilo.nordico": "Nórdico", "estilo.mediterraneo": "Mediterráneo", "estilo.industrial": "Industrial",
  "estilo.contemporaneo_minimalista": "Contemporáneo", "estilo.clasico": "Clásico",
  "momento.dia": "Día", "momento.atardecer": "Atardecer", "momento.noche": "Noche", "momento.simulado": "(simulación)",
  "nav.ir_a": "Ir a {x}", "nav.metros": "{x} m", "galeria.titulo": "Estancias",
};
let i18n = null;
function tr(k, vars) {
  let s = i18n?.tr ? i18n.tr(k, vars) : null;
  if (!s || s === k) {
    s = FALLBACK[k] ?? k;
    if (vars) s = s.replace(/\{(\w+)\}/g, (_, n) => vars[n] ?? "");
  }
  return s;
}
function texto(v) {
  if (v == null) return "";
  if (i18n?.resolverTexto) return i18n.resolverTexto(v) ?? "";
  if (typeof v === "object") return v[estado.idioma] ?? v.es ?? Object.values(v)[0] ?? "";
  return String(v);
}
const metros = (m) => formatoMetros(m, estado.idioma);

// ------------------------------------------------------------------ API y estado
const visor = new Emisor();
const emitirBase = visor.emitir.bind(visor);
visor.emitir = (ev, datos = {}) => {
  emitirBase(ev, datos);
  dispatchEvent(new CustomEvent(`visor:${ev}`, { detail: datos }));
  try { window.dataLayer?.push({ event: `visor_${ev.replace(":", "_")}`, ...datos }); } catch {}
};
window.visor = visor;

const estado = {
  modo: "tour", nodo: null, rumbo: 0, cabeceo: 0, fov: 75, estilo: "original", momento: "dia", momentoSimulado: false,
  pintura: { paredes: null, suelos: null }, pinturaDisponible: false, estiloDisponible: true, comparar: false,
  midiendo: false, guionActivo: false, planta: null, idioma: "es",
};
visor.estado = estado;

const AJUSTES_DEF = { sensibilidad: 1, sensibilidadTactil: 1, invertirY: false, reducirMovimiento: prefiereReducido };
const int = {
  tour: null, nodos: new Map(), actual: null, transicion: null, teclas: new Set(), giro: null,
  zoom: 1, fovBase: 75, ajustes: { ...AJUSTES_DEF, ...almacen.leer("visor:ajustes", {}) },
  libre: { pos: new THREE.Vector3(), vel: new THREE.Vector3(), rumbo: 0, cabeceo: 0, listo: false, colisiones: [], suelo: false, limites: null, modelo: null },
  joy: { x: 0, y: 0, id: null }, ultimaInteraccion: performance.now(), fuenteActual: null,
};
const reducido = () => int.ajustes.reducirMovimiento;

// ------------------------------------------------------------------ render base
const lienzo = $("#lienzo");
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: false, powerPreference: "high-performance" });
} catch (e) {
  console.error(e);
}
const camara = new THREE.PerspectiveCamera(75, 1, 0.05, 500);
camara.rotation.order = "YXZ";
const reloj = new THREE.Timer();
const MAX_TEX = renderer?.capabilities.maxTextureSize ?? 4096;
const ratioBase = Math.min(devicePixelRatio, esTactil ? 1.5 : 2);
if (renderer) {
  renderer.setPixelRatio(ratioBase);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}
visor.lienzo = lienzo;
Object.defineProperty(visor, "_debug", { get: () => ({ texturas: renderer?.info.memory.textures, cache: cache.size }) });

// ------------------------------------------------------------------ escena 360
const escena360 = new THREE.Scene();
const blanco = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
blanco.needsUpdate = true;
const U = {
  texA: { value: blanco }, texB: { value: blanco }, texC: { value: blanco },
  yawA: { value: 0 }, yawB: { value: 0 }, yawC: { value: 0 }, mezcla: { value: 0 },
  mascA: { value: blanco }, mascB: { value: blanco }, hayMascA: { value: 0 }, hayMascB: { value: 0 },
  luzA: { value: new THREE.Vector2(0.5, 0.5) }, luzB: { value: new THREE.Vector2(0.5, 0.5) },
  simA: { value: new THREE.Vector2() }, simB: { value: new THREE.Vector2() },
  pinturaPared: { value: new THREE.Vector3(1, 1, 1) }, pinturaSuelo: { value: new THREE.Vector3(1, 1, 1) },
  activaPared: { value: 0 }, activaSuelo: { value: 0 },
  corte: { value: -1 }, resolucion: { value: new THREE.Vector2(1, 1) },
};
const matPano = new THREE.ShaderMaterial({
  uniforms: U,
  vertexShader: /* glsl */ `
    varying vec3 vDir;
    void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D texA, texB, texC, mascA, mascB;
    uniform float yawA, yawB, yawC, mezcla, hayMascA, hayMascB, activaPared, activaSuelo, corte;
    uniform vec2 luzA, luzB, simA, simB, resolucion;
    uniform vec3 pinturaPared, pinturaSuelo;
    varying vec3 vDir;
    const float PI = 3.141592653589793;
    const vec3 LUM = vec3(0.2126, 0.7152, 0.0722);
    vec2 uvDe(vec3 d, float yaw) {
      float h = atan(d.x, -d.z) - yaw;
      return vec2(fract(0.5 + h / (2.0 * PI)), 0.5 + asin(clamp(d.y, -1.0, 1.0)) / PI);
    }
    vec3 procesar(vec3 c, vec2 uv, sampler2D masc, float hayMasc, vec2 luz, vec2 sim) {
      float L = dot(c, LUM);
      if (hayMasc > 0.5 && activaPared + activaSuelo > 0.0) {
        vec3 m = texture2D(masc, uv).rgb;
        if (activaPared > 0.5) c = mix(c, pinturaPared * (L / max(luz.x, 0.03)), m.r);
        if (activaSuelo > 0.5) c = mix(c, pinturaSuelo * (L / max(luz.y, 0.03)), m.g);
        L = dot(c, LUM);
      }
      if (sim.x > 0.0) c = mix(c, c * vec3(1.06, 0.80, 0.60) * 0.78, sim.x);
      if (sim.y > 0.0) {
        vec3 noche = c * vec3(0.13, 0.14, 0.22) + smoothstep(0.6, 1.0, L) * vec3(1.0, 0.72, 0.42) * 0.85;
        c = mix(c, noche, sim.y);
      }
      return c;
    }
    void main() {
      vec3 d = normalize(vDir);
      vec3 c;
      if (corte >= 0.0 && gl_FragCoord.x / resolucion.x < corte) {
        c = texture2D(texC, uvDe(d, yawC)).rgb;
      } else {
        vec2 uvA = uvDe(d, yawA);
        c = procesar(texture2D(texA, uvA).rgb, uvA, mascA, hayMascA, luzA, simA);
        if (mezcla > 0.0) {
          vec2 uvB = uvDe(d, yawB);
          c = mix(c, procesar(texture2D(texB, uvB).rgb, uvB, mascB, hayMascB, luzB, simB), mezcla);
        }
      }
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
    }`,
  side: THREE.BackSide,
  depthWrite: false,
});
escena360.add(new THREE.Mesh(new THREE.SphereGeometry(100, 96, 48), matPano));
const grupoFlechas = new THREE.Group();
escena360.add(grupoFlechas);

// ------------------------------------------------------------------ texturas (caché LRU)
const cache = new Map();
const LIMITE_TEX = esTactil ? 4 : 14; // móvil: una textura 4096×2048 ≈ 32 MB de GPU
const cargadorTex = new THREE.TextureLoader();

function ajustarTextura(tex, color = true) {
  if (color) tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter; // sin mipmaps: evita la costura en el meridiano 180°
  tex.generateMipmaps = false;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

function limitarImagen(img) {
  // Las fotos del Osmo 360 (15520 px) superan el límite de textura de muchas GPU móviles.
  if (img.width <= MAX_TEX) return img;
  const c = document.createElement("canvas");
  c.width = MAX_TEX; c.height = MAX_TEX / 2;
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return c;
}

function cargarImagen(url, color = true, intentos = 2) {
  return new Promise((ok, mal) => cargadorTex.load(url, (t) => { t.image = limitarImagen(t.image); ok(ajustarTextura(t, color)); }, undefined,
    () => (intentos > 1 ? setTimeout(() => cargarImagen(url, color, intentos - 1).then(ok, mal), 600) : mal(new Error(tr("aviso.error_carga", { x: url }))))));
}

function cargarTex(clave, crear, fija = false) {
  let e = cache.get(clave);
  if (!e) {
    e = { usado: 0, fija, tex: null, reservas: 0 };
    e.promesa = Promise.resolve().then(crear).then((t) => (e.tex = t));
    e.promesa.catch(() => cache.delete(clave));
    cache.set(clave, e);
  }
  e.usado = performance.now();
  e.reservas++; // protegida hasta que se asigne (ver liberarReservas)
  setTimeout(() => { e.reservas = Math.max(0, e.reservas - 1); podar(); }, 4000);
  podar();
  return e.promesa;
}

/** Libera una textura de la GPU; las de render target (demo) liberan su render target completo. */
function liberarTex(t) { (t.userData?.rt ?? t).dispose(); }

function podar() {
  const podables = [...cache.entries()].filter(([, e]) => !e.fija); // las fijas (base de la demo) no cuentan
  if (podables.length <= LIMITE_TEX) return;
  const enUso = new Set([U.texA.value, U.texB.value, U.texC.value, U.mascA.value, U.mascB.value]);
  const libres = podables.filter(([, e]) => e.tex && !e.reservas && !enUso.has(e.tex)).sort((a, b) => a[1].usado - b[1].usado);
  let sobran = podables.length - LIMITE_TEX;
  while (sobran-- > 0 && libres.length) {
    const [k, e] = libres.shift();
    liberarTex(e.tex);
    cache.delete(k);
    for (const kl of [...luces.keys()]) if (kl === k) luces.delete(kl);
  }
}

const urlNodo = (n) => (esTactil && n.imagen_movil) || n.imagen;
const urlVar = (v) => (esTactil && v.imagen_movil) || v.imagen;

/** Elige la imagen del panorama según estilo y momento (ver ESQUEMA.md § Resolución de variantes). */
function fuenteDe(n, estilo = estado.estilo, momento = estado.momento) {
  const vs = n.variantes ?? [];
  const deEstilo = (v) => (v.estilo ?? "original") === estilo;
  const deMomento = (m) => (v) => (v.momento ?? "dia") === m;
  let v = vs.find((x) => deEstilo(x) && deMomento(momento)(x));
  let sim = null;
  if (!v && estilo !== "original") {
    v = vs.find((x) => deEstilo(x) && deMomento("dia")(x));
    if (v && momento !== "dia") sim = momento;
  }
  if (!v && momento !== "dia" && !vs.some(deEstilo)) {
    v = vs.find((x) => (x.estilo ?? "original") === "original" && deMomento(momento)(x));
  }
  const estiloOk = estilo === "original" || vs.some(deEstilo);
  if (!v) {
    if (momento !== "dia") sim = momento;
    return {
      clave: `${n.id}|base`, estiloOk, sim,
      cargar: () => cargarTex(`${n.id}|base`, () => n.textura ?? cargarImagen(urlNodo(n)), !!n.textura),
      cargarMini: n.miniatura && !n.textura ? () => cargarTex(`${n.id}|mini`, () => cargarImagen(n.miniatura)) : null,
    };
  }
  const clave = `${n.id}|${v.estilo ?? "original"}|${v.momento ?? "dia"}`;
  return { clave, estiloOk, sim, variante: v, cargar: () => cargarTex(clave, () => v.textura ?? (v.generar ? v.generar() : cargarImagen(urlVar(v)))) };
}

const fuenteBase = (n) => fuenteDe(n, "original", "dia");

/** Máscara de superficies: la de la variante si la trae; la base solo si la variante no cambia el mobiliario. */
function mascaraDe(n, v) {
  if (v && (v.mascaraTextura || v.mascara || v.generarMascara)) {
    const clave = `${n.id}|mascara|${v.estilo ?? "original"}|${v.momento ?? "dia"}`;
    return cargarTex(clave, () => v.mascaraTextura ?? (v.generarMascara ? v.generarMascara() : cargarImagen(v.mascara, false)));
  }
  if (v && (v.estilo ?? "original") !== "original") return Promise.resolve(null);
  if (n.mascaraTextura) return cargarTex(`${n.id}|mascara`, () => n.mascaraTextura, true);
  if (n.mascara) return cargarTex(`${n.id}|mascara`, () => cargarImagen(n.mascara, false));
  return Promise.resolve(null);
}

// Luminancia media de paredes y suelo (para conservar las sombras al repintar).
const luces = new Map();
let pasoLuz = null;
function luzDe(clave, tex, masc) {
  if (!masc || !renderer) return new THREE.Vector2(0.5, 0.5);
  if (luces.has(clave)) return luces.get(clave);
  if (!pasoLuz) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { base: { value: null }, masc: { value: null } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: `uniform sampler2D base, masc; varying vec2 vUv;
        void main(){ float L = dot(texture2D(base, vUv).rgb, vec3(0.2126, 0.7152, 0.0722)); vec3 m = texture2D(masc, vUv).rgb;
        gl_FragColor = vec4(L * m.r, m.r, L * m.g, m.g); }`,
    });
    const esc = new THREE.Scene();
    esc.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    pasoLuz = { mat, esc, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), rt: new THREE.WebGLRenderTarget(128, 64), px: new Uint8Array(128 * 64 * 4) };
  }
  pasoLuz.mat.uniforms.base.value = tex;
  pasoLuz.mat.uniforms.masc.value = masc;
  const previo = renderer.getRenderTarget();
  renderer.setRenderTarget(pasoLuz.rt);
  renderer.render(pasoLuz.esc, pasoLuz.cam);
  renderer.setRenderTarget(previo);
  renderer.readRenderTargetPixels(pasoLuz.rt, 0, 0, 128, 64, pasoLuz.px);
  let a = 0, b = 0, c = 0, d = 0;
  const px = pasoLuz.px;
  for (let i = 0; i < px.length; i += 4) { a += px[i]; b += px[i + 1]; c += px[i + 2]; d += px[i + 3]; }
  const r = new THREE.Vector2(b > 0 ? a / b : 0.5, d > 0 ? c / d : 0.5);
  luces.set(clave, r);
  return r;
}

const simVec = (sim) => new THREE.Vector2(sim === "atardecer" ? 1 : 0, sim === "noche" ? 1 : 0);

/** Prepara texturas, máscara y luces de un nodo para el slot A o B. */
async function prepararSlot(n) {
  const f = fuenteDe(n);
  let tex;
  if (f.cargarMini && !cache.get(f.clave)?.tex) {
    // Carga progresiva: la miniatura aparece al instante si la foto grande tarda.
    const grande = f.cargar();
    const primera = await Promise.race([grande, new Promise((r) => setTimeout(() => r(null), 350))]);
    if (primera) tex = primera;
    else {
      tex = (await f.cargarMini().catch(() => null)) ?? (await grande);
      grande.then((t) => { if (int.actual === n && int.fuenteActual?.clave === f.clave && !int.transicion) U.texA.value = t; }).catch(() => {});
    }
  } else tex = await f.cargar();
  const masc = await mascaraDe(n, f.variante).catch(() => null);
  return { f, tex, masc, luz: luzDe(f.clave, tex, masc), yaw: (n.yaw ?? 0) * GRAD };
}

function asignar(slot, s) {
  U[`tex${slot}`].value = s.tex;
  U[`yaw${slot}`].value = s.yaw;
  U[`masc${slot}`].value = s.masc ?? blanco;
  U[`hayMasc${slot}`].value = s.masc ? 1 : 0;
  U[`luz${slot}`].value = s.luz;
  U[`sim${slot}`].value = simVec(s.f.sim);
}

// ------------------------------------------------------------------ puntos de salto (auto hotspots)
const geoAro = new THREE.RingGeometry(0.32, 0.42, 48).rotateX(-Math.PI / 2);
const geoDisco = new THREE.CircleGeometry(0.6, 32).rotateX(-Math.PI / 2);
const geoHalo = new THREE.RingGeometry(0.28, 0.47, 48).rotateX(-Math.PI / 2); // contorno oscuro: contraste ≥ 3:1 sobre suelos claros
const matHalo = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthTest: false });
const geoFlecha = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, -0.2); s.lineTo(0.16, 0.06); s.lineTo(0.06, 0.06); s.lineTo(0.06, 0.2);
  s.lineTo(-0.06, 0.2); s.lineTo(-0.06, 0.06); s.lineTo(-0.16, 0.06); s.closePath();
  return new THREE.ShapeGeometry(s).rotateX(-Math.PI / 2);
})();
const matAro = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthTest: false });
const matAroHover = new THREE.MeshBasicMaterial({ color: 0xffb547, transparent: true, opacity: 1, depthTest: false });
const matInvisible = new THREE.MeshBasicMaterial({ visible: false });

const etiquetas = $("#etiquetas");
let etiquetasActivas = [];
const alturaNodo = (n = int.actual) => n?.altura_camara ?? int.tour?.altura_camara ?? 1.5;
const plantaPorId = (id) => int.tour?.plantas?.find((p) => p.id === id);

function construirPuntos() {
  grupoFlechas.clear();
  etiquetas.replaceChildren();
  etiquetasActivas = [];
  const n = int.actual;
  const alt = alturaNodo(n);
  for (const destino of n.vecinos) {
    let dx = destino.x - n.x, dz = destino.z - n.z;
    let dist = Math.hypot(dx, dz);
    const vertical = dist < 0.3; // escalera: mismo punto en otra planta → flecha al frente (o al rumbo indicado)
    if (vertical) {
      const r = ((n.rumbo_enlaces?.[destino.id] ?? n.rumbo_inicial ?? n.yaw ?? 0) * GRAD);
      dx = Math.sin(r); dz = -Math.cos(r); dist = 1;
    }
    const r = THREE.MathUtils.clamp(dist * 0.6, 1.3, 3.2);
    const g = new THREE.Group();
    g.position.set((dx / dist) * r, -alt, (dz / dist) * r);
    g.rotation.y = -rumbo(dx, dz) + Math.PI;
    const halo = new THREE.Mesh(geoHalo, matHalo);
    halo.renderOrder = 1;
    g.add(halo);
    const aro = new THREE.Mesh(geoAro, matAro);
    const flecha = new THREE.Mesh(geoFlecha, matAro);
    const hit = new THREE.Mesh(geoDisco, matInvisible);
    aro.renderOrder = flecha.renderOrder = 2;
    g.add(aro, flecha, hit);
    g.userData = { destino, partes: [aro, flecha] };
    grupoFlechas.add(g);
    const etq = document.createElement("button");
    etq.type = "button";
    etq.className = "etq";
    const otraPlanta = destino.planta !== n.planta ? ` · ${texto(plantaPorId(destino.planta)?.nombre) || tr("plano.planta")}` : "";
    etq.textContent = texto(destino.nombre) + otraPlanta;
    etq.setAttribute("aria-label", vertical ? tr("nav.ir_a", { x: texto(destino.nombre) + otraPlanta }) : `${tr("nav.ir_a", { x: texto(destino.nombre) })}, ${tr("nav.metros", { x: metros(dist) })}`);
    etq.onclick = () => irA(destino);
    etiquetas.append(etq);
    etiquetasActivas.push({ el: etq, pos: new THREE.Vector3(g.position.x, g.position.y + 0.35, g.position.z) });
  }
  for (const p of n.puntos ?? []) {
    const h = (p.yaw ?? 0) * GRAD + (n.yaw ?? 0) * GRAD;
    const v = (p.pitch ?? 0) * GRAD;
    const el = document.createElement("button");
    el.type = "button";
    el.className = "info";
    el.textContent = "i";
    el.setAttribute("aria-label", texto(p.titulo));
    el.title = texto(p.titulo);
    el.onclick = () => mostrarFicha(p);
    etiquetas.append(el);
    etiquetasActivas.push({ el, pos: new THREE.Vector3(Math.sin(h) * Math.cos(v) * 10, Math.sin(v) * 10, -Math.cos(h) * Math.cos(v) * 10) });
  }
}

const vTmp = new THREE.Vector3();
function actualizarEtiquetas() {
  const w = innerWidth, h = innerHeight;
  for (const e of etiquetasActivas) {
    vTmp.copy(e.pos).applyMatrix4(camara.matrixWorldInverse);
    if (vTmp.z > -0.1 || int.transicion) { e.el.style.display = "none"; continue; }
    vTmp.applyMatrix4(camara.projectionMatrix);
    e.el.style.display = "";
    e.el.style.left = `${(vTmp.x * 0.5 + 0.5) * w}px`;
    e.el.style.top = `${(-vTmp.y * 0.5 + 0.5) * h}px`;
  }
}

// ------------------------------------------------------------------ navegación entre panoramas
async function irA(destino, { instantaneo = false } = {}) {
  if (typeof destino === "string") destino = int.nodos.get(destino);
  if (!destino || !renderer) return;
  if (destino === int.actual && !int.transicion) return;
  // Ficha de petición: si llega otra navegación mientras esta carga, gana la última.
  const ficha = (int.navFicha = (int.navFicha ?? 0) + 1);
  mostrarCarga(true);
  let slot;
  try { slot = await prepararSlot(destino); }
  catch (e) {
    if (ficha === int.navFicha) { aviso(e.message, 6000, { reintentar: () => irA(destino) }); mostrarCarga(false); }
    return;
  }
  if (ficha !== int.navFicha) return;
  while (int.transicion) await int.transicion.promesa;
  if (ficha !== int.navFicha) return;
  mostrarCarga(false);
  if (destino === int.actual) return;
  const desde = int.actual;
  ocultarFicha();
  if (!desde || instantaneo || estado.modo !== "tour") {
    asignar("A", slot);
    int.fuenteActual = slot.f;
    llegar(destino);
    return;
  }
  // Transición: fundido cruzado + leve avance hacia el destino. Sin giro forzado de cámara.
  asignar("B", slot);
  grupoFlechas.visible = false;
  let resolver;
  const promesa = new Promise((r) => (resolver = r));
  int.transicion = { t: 0, dur: reducido() ? 0.25 : 0.8, tipo: "salto", destino, slot, resolver, promesa };
  return promesa;
}

function llegar(nodo) {
  const anterior = int.actual;
  int.actual = nodo;
  estado.nodo = nodo.id;
  estado.planta = nodo.planta;
  estado.momentoSimulado = !!int.fuenteActual?.sim;
  estado.estiloDisponible = int.fuenteActual?.estiloOk ?? true;
  estado.pinturaDisponible = U.hayMascA.value > 0;
  grupoFlechas.visible = true;
  construirPuntos();
  anunciarEstancia(nodo);
  actualizarSello();
  document.querySelectorAll("#galeria button").forEach((b) => b.setAttribute("aria-current", String(b.dataset.id === nodo.id)));
  $('#galeria button[aria-current="true"]')?.scrollIntoView?.({ block: "nearest", inline: "center", behavior: reducido() ? "auto" : "smooth" });
  if (!EMBED && int.tour && !int.tour.demo) history.replaceState(null, "", `#${encodeURIComponent(nodo.id)}`);
  precargarVecinos(nodo);
  // Mantener W/↑ pulsada encadena estancias, como caminar en un videojuego.
  setTimeout(() => {
    const k = int.teclas;
    if (estado.modo === "tour" && int.actual === nodo && (k.has("KeyW") || k.has("ArrowUp"))) avanzar(0);
  }, 180);
  if (estado.comparar) actualizarComparacion();
  if (anterior?.planta !== nodo.planta) dibujarPlantas();
  medicion?.cambioNodo();
  if (!estado.estiloDisponible) aviso(tr("aviso.estilo_no_disponible"), 3500);
  dibujarMapa();
  visor.emitir("nodo", { id: nodo.id });
  enviarPadre({ tipo: "visor:vista", ...vistaParaPadre() });
}

/** Precarga: en escritorio todas las vecinas; en móvil solo la que queda delante (memoria de GPU limitada). */
function precargarVecinos(nodo) {
  let lista = nodo.vecinos;
  if (esTactil && lista.length > 1) {
    lista = [...lista].sort((a, b) => Math.abs(angDif(rumbo(a.x - nodo.x, a.z - nodo.z), estado.rumbo)) - Math.abs(angDif(rumbo(b.x - nodo.x, b.z - nodo.z), estado.rumbo))).slice(0, 1);
  }
  for (const v of lista) fuenteDe(v).cargar().catch(() => {});
}

/** Origen de la imagen visible: "foto" real, "render" o "ia" (estilos), y si la luz es simulada. */
function origenVisible() {
  const v = int.fuenteActual?.variante;
  const origen = v ? v.origen ?? (v.estilo && v.estilo !== "original" ? "ia" : "foto") : "foto";
  return { origen, simulado: !!int.fuenteActual?.sim };
}
function actualizarSello() {
  const { origen, simulado } = origenVisible();
  const el = $("#sello-ia");
  const txt = origen === "ia" ? "Recreación virtual · IA" : origen === "render" ? "Render / infografía" : simulado ? "Iluminación simulada" : "";
  el.textContent = txt;
  el.hidden = !txt || estado.modo !== "tour";
  return txt;
}

function anunciarEstancia(n) {
  const est = estanciaDe(n);
  const partes = [texto(n.nombre)];
  if (est) partes.push(`${metros(areaPoligono(est.poligono))} m²`);
  $("#estancia").textContent = partes.join(" · ");
  // Rótulo elegante al entrar en una estancia (se desvanece solo).
  const r = $("#rotulo");
  r.querySelector("b").textContent = texto(n.nombre);
  r.querySelector("span").textContent = est ? `${metros(areaPoligono(est.poligono))} m²` : "";
  r.classList.remove("visible"); void r.offsetWidth; r.classList.add("visible");
}

function estanciaDe(n) {
  return (int.tour.estancias ?? []).find((e) => e.planta === n.planta && e.poligono?.length > 2 && puntoEnPoligono([n.x, n.z], e.poligono));
}

function pasoTransicion(dt) {
  const tr_ = int.transicion;
  if (!tr_) return;
  tr_.t = Math.min(1, tr_.t + dt / tr_.dur);
  const e = tr_.t < 0.5 ? 4 * tr_.t ** 3 : 1 - (-2 * tr_.t + 2) ** 3 / 2; // ease-in-out cúbico
  U.mezcla.value = e;
  if (tr_.tipo === "salto" && !reducido()) {
    camara.fov = int.fovBase * int.zoom * (1 - 0.12 * Math.sin(Math.PI * e));
    camara.updateProjectionMatrix();
  }
  if (tr_.t >= 1) {
    asignar("A", tr_.slot);
    U.mezcla.value = 0;
    int.fuenteActual = tr_.slot.f;
    int.transicion = null;
    camara.fov = int.fovBase * int.zoom;
    camara.updateProjectionMatrix();
    if (tr_.tipo === "salto") llegar(tr_.destino);
    else {
      estado.momentoSimulado = !!tr_.slot.f.sim;
      estado.estiloDisponible = tr_.slot.f.estiloOk;
      estado.pinturaDisponible = U.hayMascA.value > 0;
      if (!estado.estiloDisponible) aviso(tr("aviso.estilo_no_disponible"), 3500);
      if (estado.comparar) actualizarComparacion();
      actualizarSello();
    }
    tr_.resolver();
  }
}

/** Fundido en la misma estancia (cambio de estilo o momento). */
async function refrescarAmbiente(evento, anterior) {
  aplicarAmbienteLibre();
  if (!int.actual || !renderer) return visor.emitir(evento, { id: estado[evento] });
  const ficha = (int.ambFicha = (int.ambFicha ?? 0) + 1);
  while (int.transicion) await int.transicion.promesa;
  if (ficha !== int.ambFicha) return;
  const nodo = int.actual;
  mostrarCarga(true);
  let slot;
  try { slot = await prepararSlot(nodo); }
  catch (e) {
    // Imagen rota: se vuelve al estilo/momento anterior para que el estado refleje lo que se ve.
    if (ficha === int.ambFicha) { aviso(e.message); mostrarCarga(false); estado[evento] = anterior; aplicarAmbienteLibre(); visor.emitir(evento, { id: anterior }); }
    return;
  }
  if (ficha !== int.ambFicha) return;
  while (int.transicion) await int.transicion.promesa;
  if (ficha !== int.ambFicha) return;
  mostrarCarga(false);
  // Si mientras tanto se cambió de estancia, la llegada ya aplicó el estilo/momento nuevo.
  if (int.actual !== nodo) return visor.emitir(evento, { id: estado[evento] });
  if (slot.f.clave === int.fuenteActual?.clave || estado.modo !== "tour") {
    asignar("A", slot);
    int.fuenteActual = slot.f;
    estado.momentoSimulado = !!slot.f.sim;
    estado.estiloDisponible = slot.f.estiloOk;
    estado.pinturaDisponible = U.hayMascA.value > 0;
    actualizarSello();
  } else {
    asignar("B", slot);
    let resolver;
    const promesa = new Promise((r) => (resolver = r));
    int.transicion = { t: 0, dur: reducido() ? 0.2 : evento === "momento" ? 1.4 : 0.9, tipo: "fundido", slot, resolver, promesa };
    await promesa;
  }
  precargarVecinos(int.actual);
  visor.emitir(evento, { id: estado[evento] });
}

/** Ir a la estancia vecina en una dirección relativa a la mirada: 0 delante, π detrás, ±π/2 lados. */
function avanzar(desvio = 0) {
  const n = int.actual;
  if (!n) return;
  const objetivo = estado.rumbo + desvio;
  let mejor = null, mejorAng = desvio === 0 ? 55 * GRAD : 70 * GRAD;
  for (const v of n.vecinos) {
    const a = Math.abs(angDif(rumbo(v.x - n.x, v.z - n.z), objetivo));
    if (a < mejorAng) { mejor = v; mejorAng = a; }
  }
  if (mejor) irA(mejor);
}

// ------------------------------------------------------------------ comparación antes / después
const cortinilla = $("#cortinilla");
async function actualizarComparacion() {
  if (!int.actual) return;
  const base = await fuenteBase(int.actual).cargar().catch(() => null);
  if (!base || !estado.comparar) return;
  U.texC.value = base;
  U.yawC.value = (int.actual.yaw ?? 0) * GRAD;
}
function fijarCorte(f) {
  f = THREE.MathUtils.clamp(f, 0.02, 0.98);
  U.corte.value = f;
  cortinilla.style.left = `${f * 100}%`;
  cortinilla.querySelector("button").setAttribute("aria-valuenow", String(Math.round(f * 100)));
}
cortinilla.querySelector("button").addEventListener("pointerdown", (e) => {
  e.stopPropagation();
  const b = e.currentTarget;
  b.setPointerCapture(e.pointerId);
  const mover = (ev) => fijarCorte(ev.clientX / innerWidth);
  const fin = () => { b.removeEventListener("pointermove", mover); b.removeEventListener("pointerup", fin); };
  b.addEventListener("pointermove", mover);
  b.addEventListener("pointerup", fin);
});
cortinilla.querySelector("button").addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); fijarCorte(U.corte.value + (e.key === "ArrowLeft" ? -0.05 : 0.05)); }
});

// ------------------------------------------------------------------ modo libre 3D
const escenaLibre = new THREE.Scene();
escenaLibre.background = new THREE.Color(0x1b1e24);
const rayo = new THREE.Raycaster();
const ABAJO = new THREE.Vector3(0, -1, 0);
let pisoDemo = null;

async function prepararLibre() {
  const L = int.libre;
  const cfg = int.tour.libre;
  if (!cfg) throw new Error("Sin modo libre");
  if (L.listo) return;
  if (L.cargando) return L.cargando;
  L.cargando = (async () => {
    const alt = int.tour.altura_camara ?? 1.5;
    if (cfg.tipo === "demo") {
      const { crearPisoDemo } = await import("./demo.js");
      pisoDemo = crearPisoDemo();
      escenaLibre.add(pisoDemo.grupo);
      L.colisiones = pisoDemo.colisiones;
      L.modelo = pisoDemo.grupo;
      aplicarAmbienteLibre();
    } else if (cfg.tipo === "glb") {
      const gltf = await new GLTFLoader().loadAsync(cfg.url);
      aplicarTransformacion(gltf.scene, cfg);
      escenaLibre.add(gltf.scene, new THREE.HemisphereLight(0xffffff, 0x444444, 2.5));
      L.colisiones = [gltf.scene];
      L.modelo = gltf.scene;
    } else if (cfg.tipo === "splat") {
      await cargarSplat({ url: cfg.url }, cfg);
    }
    if (cfg.colisionador) {
      const gltf = await new GLTFLoader().loadAsync(cfg.colisionador);
      aplicarTransformacion(gltf.scene, cfg);
      gltf.scene.traverse((o) => { if (o.isMesh) o.material = matInvisible; });
      escenaLibre.add(gltf.scene);
      L.colisiones = [gltf.scene];
    }
    escenaLibre.updateMatrixWorld(true);
    L.suelo = L.colisiones.length > 0;
    L.limites = cfg.limites ?? null;
    const ini = cfg.inicio ?? (int.actual ? [int.actual.x, int.actual.z, estado.rumbo / GRAD] : [0, 0, 0]);
    L.pos.set(ini[0], (cfg.altura_suelo ?? 0) + alt, ini[1]);
    L.rumbo = (ini[2] ?? 0) * GRAD;
    L.listo = true;
  })();
  try { await L.cargando; }
  catch (e) { aviso(`${tr("modo.libre")}: ${e.message}`, 6000); L.cargando = null; throw e; }
}

function aplicarAmbienteLibre() {
  if (!pisoDemo) return;
  pisoDemo.aplicar({ estilo: estado.estilo, momento: estado.momento, pintura: estado.pintura });
  escenaLibre.background = new THREE.Color(estado.momento === "noche" ? 0x0d1830 : 0x1b1e24);
}

function aplicarTransformacion(obj, cfg) {
  const r = cfg.rotacion ?? [0, 0, 0];
  obj.rotation.set(r[0] * GRAD, r[1] * GRAD, r[2] * GRAD);
  if (cfg.posicion) obj.position.fromArray(cfg.posicion);
  if (cfg.escala) obj.scale.setScalar(cfg.escala);
}

let spark = null;
async function cargarSplat(fuente, cfg) {
  const mod = await import("@sparkjsdev/spark");
  if (!spark) { spark = new mod.SparkRenderer({ renderer }); escenaLibre.add(spark); }
  escenaLibre.children.filter((o) => o.userData.esSplat).forEach((o) => { escenaLibre.remove(o); o.dispose?.(); });
  mostrarCarga(true, 0);
  const malla = new mod.SplatMesh({ ...fuente, onProgress: (e) => e.total && mostrarCarga(true, e.loaded / e.total) });
  malla.userData.esSplat = true;
  aplicarTransformacion(malla, cfg);
  escenaLibre.add(malla);
  try { await malla.initialized; } finally { mostrarCarga(false); }
  return malla;
}

const RADIO = 0.28;
const velObjetivo = new THREE.Vector3();
function moverLibre(dt) {
  const L = int.libre;
  if (!L.listo) return;
  const k = int.teclas;
  // Controles estilo Minecraft: WASD y flechas mueven (← → lateral), el ratón mira, Q/E giran.
  const giro = ((k.has("KeyE") ? 1 : 0) - (k.has("KeyQ") ? 1 : 0)) * 1.8 * dt;
  L.rumbo += giro;
  let adelante = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
  let lado = (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) - (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0);
  adelante -= int.joy.y; lado += int.joy.x;
  const mag = Math.hypot(adelante, lado);
  if (mag > 1) { adelante /= mag; lado /= mag; }
  const rapidez = k.has("ShiftLeft") || k.has("ShiftRight") ? 3.2 : 1.4;
  const s = Math.sin(L.rumbo), c = Math.cos(L.rumbo);
  velObjetivo.set((s * adelante + c * lado) * rapidez, 0, (-c * adelante + s * lado) * rapidez);
  const tau = velObjetivo.lengthSq() ? 0.07 : 0.05; // respuesta seca, como en Minecraft
  L.vel.lerp(velObjetivo, 1 - Math.exp(-dt / tau));
  let mx = L.vel.x * dt, mz = L.vel.z * dt;
  if (Math.abs(mx) < 1e-5 && Math.abs(mz) < 1e-5) mx = mz = 0;
  if (L.colisiones.length && (mx || mz)) {
    if (choca(L.pos, mx, mz)) {
      if (!choca(L.pos, mx, 0)) mz = 0;
      else if (!choca(L.pos, 0, mz)) mx = 0;
      else mx = mz = 0;
      if (!mx) L.vel.x = 0;
      if (!mz) L.vel.z = 0;
    }
  }
  const alt = int.tour.altura_camara ?? 1.5;
  if (L.suelo && (mx || mz) && L.enSuelo !== false) {
    // Escalón máximo de 0,3 m: no se puede "subir" a camas, mesas o encimeras.
    rayo.set(vTmp.set(L.pos.x + mx, L.pos.y + 0.3, L.pos.z + mz), ABAJO);
    rayo.far = alt + 6;
    const h = rayo.intersectObjects(L.colisiones, true)[0];
    if (h && h.point.y + alt - L.pos.y > 0.3) { mx = mz = 0; L.vel.set(0, 0, 0); }
  }
  L.pos.x += mx; L.pos.z += mz;
  if (L.suelo) {
    // Gravedad y salto (Espacio). En el suelo se sigue la altura con suavidad (escalones, rampas).
    rayo.set(vTmp.set(L.pos.x, L.pos.y + 0.3, L.pos.z), ABAJO);
    rayo.far = alt + 6;
    const h = rayo.intersectObjects(L.colisiones, true)[0];
    const objetivo = h ? h.point.y + alt : null;
    L.vy = L.vy ?? 0;
    if (L.saltar && L.enSuelo) { L.vy = 4.2; L.enSuelo = false; }
    L.saltar = false;
    if (objetivo == null) L.vy = 0;
    else if (L.enSuelo !== false && L.vy === 0 && L.pos.y - objetivo < 0.45) {
      L.pos.y += (objetivo - L.pos.y) * Math.min(1, dt * 12);
      L.enSuelo = true;
    } else {
      L.vy -= 9.8 * dt;
      L.pos.y += L.vy * dt;
      if (L.pos.y <= objetivo) { L.pos.y = objetivo; L.vy = 0; L.enSuelo = true; }
    }
  } else {
    L.pos.y += ((k.has("Space") ? 1 : 0) - (k.has("KeyC") ? 1 : 0)) * rapidez * dt;
  }
  if (L.limites) {
    const [x0, z0, x1, z1] = L.limites;
    L.pos.x = THREE.MathUtils.clamp(L.pos.x, x0, x1);
    L.pos.z = THREE.MathUtils.clamp(L.pos.z, z0, z1);
  }
  camara.position.copy(L.pos);
  camara.rotation.set(L.cabeceo, -L.rumbo, 0);
  dibujarMapaThrottle();
}

const dirTmp = new THREE.Vector3();
const DIRS = Array.from({ length: 8 }, (_, i) => new THREE.Vector3(Math.cos((i * Math.PI) / 4), 0, Math.sin((i * Math.PI) / 4)));
function choca(pos, mx, mz) {
  const d = Math.hypot(mx, mz);
  for (const dy of [-0.9, -0.2]) {
    const origen = vTmp.set(pos.x, pos.y + dy, pos.z);
    rayo.far = d + RADIO;
    rayo.set(origen, dirTmp.set(mx / d, 0, mz / d));
    if (rayo.intersectObjects(int.libre.colisiones, true).length) return true;
    origen.x += mx; origen.z += mz;
    rayo.far = RADIO;
    for (const dir of DIRS) {
      rayo.set(origen, dir);
      if (rayo.intersectObjects(int.libre.colisiones, true).length) return true;
    }
  }
  return false;
}

// ------------------------------------------------------------------ submódulos
const contenedor = $("#app");
const medicion = renderer && crearMedicion({
  contenedor, camara, escena360, escenaLibre, tr,
  modo: () => estado.modo,
  alturaCamara: () => alturaNodo(),
  objetivosLibre: () => [...int.libre.colisiones, ...escenaLibre.children.filter((o) => o.userData.esSplat)],
  formato: metros,
  aviso: (t, ms) => aviso(t, ms),
  emitir: (ev, d) => visor.emitir(ev, d),
  desactivar: () => visor.medir(false),
});

const maqueta = renderer && crearMaqueta({
  lienzo, contenedor, tr, texto, formato: metros,
  tour: () => int.tour,
  nodos: () => [...int.nodos.values()],
  escenaLibre,
  modeloLibre: () => (["demo", "glb"].includes(int.tour.libre?.tipo) ? int.libre.modelo : null),
  ocultarTecho: (si) => escenaLibre.traverse((o) => { if (o.userData.superficie === "techo") o.visible = !si; }),
  alElegirNodo: async (n) => { await cambiarModo("tour"); irA(n); },
});

const guion = crearGuion({
  tour: () => int.tour,
  nodos: () => [...int.nodos.values()],
  ir: (n) => irA(n),
  rumbo: () => estado.rumbo,
  fijarRumbo: (r) => { estado.rumbo = r; },
  reducido,
  subtitulo: (t) => {
    const el = $("#subtitulo");
    el.textContent = t ? texto(t) : "";
    el.hidden = !t;
  },
  emitir: (ev, d) => {
    if (ev === "guion:inicio" || ev === "guion:fin") {
      estado.guionActivo = ev === "guion:inicio";
      document.body.classList.toggle("guion-activo", estado.guionActivo);
    }
    visor.emitir(ev, d);
  },
  asegurarModoTour: () => { if (estado.modo !== "tour") cambiarModo("tour"); },
});

// Barra de la visita guiada: pausa, parada actual y progreso (WCAG 2.2.2).
const barraGuion = $("#guion-barra");
barraGuion.querySelector(".pausa").onclick = () => guion.alternarPausa();
barraGuion.querySelector(".parar").onclick = () => guion.parar();
function actualizarBarraGuion() {
  const p = guion.progreso();
  barraGuion.hidden = !p;
  if (!p) return;
  barraGuion.querySelector(".n").textContent = `${p.actual}/${p.total}`;
  barraGuion.querySelector(".progreso div").style.width = `${(p.progreso * 100).toFixed(1)}%`;
  const b = barraGuion.querySelector(".pausa");
  const txt = guion.pausado ? "▶" : "❚❚";
  if (b.textContent !== txt) { b.textContent = txt; b.setAttribute("aria-label", guion.pausado ? "Reanudar" : "Pausa"); }
}

// ------------------------------------------------------------------ entrada
const punteros = new Map();
let arrastre = null;
let pellizco = null;

function interaccion(ev) {
  // Con el ratón capturado, mover el ratón es "jugar", no pedir la interfaz (como en un videojuego).
  if (ev?.type === "pointermove" && document.pointerLockElement === lienzo) return;
  int.ultimaInteraccion = performance.now();
  int.yaInteractuo = true;
  if (document.body.classList.contains("ui-inactiva")) document.body.classList.remove("ui-inactiva");
}
["pointermove", "pointerdown", "keydown", "wheel", "touchstart"].forEach((ev) => addEventListener(ev, interaccion, { passive: true }));

lienzo.addEventListener("pointerdown", (e) => {
  if (guion.activo && !guion.pausado) guion.alternarPausa(); // tocar la escena pausa la visita (no la cancela)
  if (document.pointerLockElement !== lienzo) { try { lienzo.setPointerCapture(e.pointerId); } catch {} }
  punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  ocultarPista("arrastra");
  // Joystick flotante: pulgar en la mitad izquierda en modo libre táctil.
  if (estado.modo === "libre" && e.pointerType === "touch" && e.clientX < innerWidth * 0.45 && int.joy.id == null) {
    int.joy = { x: 0, y: 0, id: e.pointerId, cx: e.clientX, cy: e.clientY };
    const j = $("#joystick");
    j.style.left = `${e.clientX - 60}px`; j.style.top = `${e.clientY - 60}px`;
    j.classList.add("activo");
    ocultarPista("libre");
    return;
  }
  if (punteros.size === 2 && int.joy.id == null) {
    const [a, b] = [...punteros.values()];
    pellizco = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: int.zoom };
    arrastre = null;
  } else {
    arrastre = { id: e.pointerId, x: e.clientX, y: e.clientY, mov: 0, tipo: e.pointerType };
  }
});

lienzo.addEventListener("pointermove", (e) => {
  if (punteros.has(e.pointerId)) punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (e.pointerId === int.joy.id) {
    let x = (e.clientX - int.joy.cx) / 60, y = (e.clientY - int.joy.cy) / 60;
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    int.joy.x = Math.abs(x) < 0.12 ? 0 : x;
    int.joy.y = Math.abs(y) < 0.12 ? 0 : y;
    $("#joystick-pomo").style.transform = `translate(${x * 34}px, ${y * 34}px)`;
    return;
  }
  if (pellizco && punteros.size === 2) {
    const [a, b] = [...punteros.values()];
    if (estado.modo === "tour") fijarZoom((pellizco.zoom * pellizco.d) / Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)));
    return;
  }
  if (document.pointerLockElement === lienzo) {
    // Ratón capturado (como en Minecraft): sin suavizado; en 360 la sensibilidad se adapta al zoom.
    const s = 0.0022 * int.ajustes.sensibilidad * (estado.modo === "tour" ? camara.fov / 72 : 1);
    mirar(e.movementX * s, e.movementY * s * (int.ajustes.invertirY ? -1 : 1));
    return;
  }
  medicion?.mover(e.clientX, e.clientY);
  if (!arrastre || arrastre.id !== e.pointerId) { if (estado.modo === "tour") hover(e); return; }
  const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y;
  arrastre.x = e.clientX; arrastre.y = e.clientY;
  arrastre.mov += Math.abs(dx) + Math.abs(dy);
  if (estado.modo === "tour") {
    // Agarrar y arrastrar la imagen (convención Street View).
    const sens = arrastre.tipo === "touch" ? int.ajustes.sensibilidadTactil : int.ajustes.sensibilidad;
    const k = ((camara.fov * GRAD) / innerHeight) * sens;
    const inv = int.ajustes.invertirY ? -1 : 1;
    if (int.giro?.offset != null) int.giro.offset -= dx * k;
    else { estado.rumbo -= dx * k; estado.cabeceo += dy * k * inv; }
  } else if (estado.modo === "libre") {
    const sens = (arrastre.tipo === "touch" ? int.ajustes.sensibilidadTactil : int.ajustes.sensibilidad) * 0.005;
    mirar(dx * sens, dy * sens * (int.ajustes.invertirY ? -1 : 1));
  }
});

const soltar = (e) => {
  punteros.delete(e.pointerId);
  if (e.pointerId === int.joy.id) {
    int.joy = { x: 0, y: 0, id: null };
    $("#joystick-pomo").style.transform = "";
    $("#joystick").classList.remove("activo");
    return;
  }
  if (punteros.size < 2) pellizco = null;
  if (arrastre && arrastre.id === e.pointerId) {
    if (arrastre.mov < 8 && e.type === "pointerup") clic(e);
    arrastre = null;
  }
};
lienzo.addEventListener("pointerup", soltar);
lienzo.addEventListener("pointercancel", soltar);

function mirar(dx, dy) {
  if (estado.modo === "tour") {
    if (int.giro?.offset != null) int.giro.offset += dx;
    else { estado.rumbo += dx; estado.cabeceo -= dy; }
    return;
  }
  const L = int.libre;
  L.rumbo += dx;
  L.cabeceo = THREE.MathUtils.clamp(L.cabeceo - dy, -1.45, 1.45);
}

const ndc = new THREE.Vector2();
function apuntar(e) {
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  rayo.setFromCamera(ndc, camara);
  rayo.far = Infinity;
  const h = rayo.intersectObjects(grupoFlechas.children, true)[0];
  let g = h?.object;
  while (g && !g.userData.destino) g = g.parent;
  return g;
}
let hoverActual = null;
function hover(e) {
  if (e.pointerType === "touch" || estado.midiendo) return;
  const g = apuntar(e);
  if (g === hoverActual) return;
  hoverActual?.userData.partes.forEach((m) => (m.material = matAro));
  g?.userData.partes.forEach((m) => (m.material = matAroHover));
  hoverActual = g;
  lienzo.style.cursor = g ? "pointer" : "";
}
function capturarRaton() {
  if (esTactil || EMBED || estado.midiendo || document.pointerLockElement === lienzo) return;
  const p = lienzo.requestPointerLock?.({ unadjustedMovement: true });
  if (p?.catch) p.catch(() => lienzo.requestPointerLock?.()?.catch?.(() => {}));
}
document.addEventListener("pointerlockchange", () => {
  const si = document.pointerLockElement === lienzo;
  document.body.classList.toggle("raton-capturado", si);
  if (si) ocultarPista(estado.modo === "libre" ? "libre" : "captura");
  else if (estado.modo !== "maqueta" && !estado.midiendo) {
    const el = $("#pista");
    el.textContent = tr("aviso.clic_explorar");
    el.dataset.id = "volver";
    el.hidden = false;
    setTimeout(() => { if (el.dataset.id === "volver") el.hidden = true; }, 2500);
  }
});

function clic(e) {
  const capturado = document.pointerLockElement === lienzo;
  if (capturado) e = { clientX: innerWidth / 2, clientY: innerHeight / 2, pointerType: "mouse" }; // se actúa sobre la mira
  if (medicion?.clic(e.clientX, e.clientY)) return;
  if (estado.modo === "tour") {
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    rayo.setFromCamera(ndc, camara);
    const d = rayo.ray.direction.clone();
    if (EMBED) enviarPadre({ tipo: "visor:clic", nodo: estado.nodo, ...localDeDir(d) });
    const g = apuntar(e);
    if (g) return irA(g.userData.destino);
    // Tocar el suelo: ir a la estancia en esa dirección.
    if (d.y < -0.15 && int.actual) {
      const r = rumbo(d.x, d.z);
      let mejor = null, ang = 30 * GRAD;
      for (const v of int.actual.vecinos) {
        const a = Math.abs(angDif(rumbo(v.x - int.actual.x, v.z - int.actual.z), r));
        if (a < ang) { ang = a; mejor = v; }
      }
      if (mejor) return irA(mejor);
    }
    if (capturado) return avanzar(0);
    if (e.pointerType === "mouse") capturarRaton();
  } else if (estado.modo === "libre" && e.pointerType === "mouse") {
    capturarRaton();
  }
}

lienzo.addEventListener("wheel", (e) => {
  if (estado.modo !== "tour") return;
  e.preventDefault();
  fijarZoom(int.zoom * Math.exp(e.deltaY * 0.001));
}, { passive: false });

function fijarZoom(z) {
  int.zoom = THREE.MathUtils.clamp(z, 0.45, 1.2);
  if (!int.transicion) { camara.fov = int.fovBase * int.zoom; camara.updateProjectionMatrix(); }
}

addEventListener("keydown", (e) => {
  if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
  const enUI = e.target !== document.body && e.target !== lienzo && e.target.closest?.("button, a, [role=dialog], [role=slider]");
  if (enUI && ["Enter", "Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.code)) return;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "PageUp", "PageDown"].includes(e.code)) e.preventDefault();
  if (guion.activo && e.code === "Space" && !enUI) { e.preventDefault(); guion.alternarPausa(); return; }
  if (guion.activo && e.code === "Escape") guion.parar();
  else if (guion.activo && !guion.pausado && !["ShiftLeft", "ShiftRight", "KeyH", "KeyM", "KeyR"].includes(e.code)) guion.alternarPausa();
  int.teclas.add(e.code);
  if (e.repeat) return;
  const atajos = int.ajustes.atajos !== false && !enUI; // WCAG 2.1.4: atajos de una letra desactivables y no en botones
  if (estado.modo === "tour" && (atajos || !/^(Key[A-Z]|Digit\d)$/.test(e.code) || ["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE"].includes(e.code))) {
    const dir = { KeyW: 0, ArrowUp: 0, Enter: 0, KeyS: Math.PI, ArrowDown: Math.PI, KeyA: -Math.PI / 2, ArrowLeft: -Math.PI / 2, KeyD: Math.PI / 2, ArrowRight: Math.PI / 2 }[e.code];
    if (dir !== undefined) avanzar(dir);
    if (e.code === "Equal" || e.code === "NumpadAdd") fijarZoom(int.zoom * 0.85);
    if (e.code === "Minus" || e.code === "NumpadSubtract") fijarZoom(int.zoom / 0.85);
    if (/^Digit[1-9]$/.test(e.code)) { const n = [...int.nodos.values()][+e.code.slice(5) - 1]; if (n) irA(n); }
    if (e.code === "KeyN") { const lista = [...int.nodos.values()]; irA(lista[(lista.indexOf(int.actual) + 1) % lista.length]); }
  }
  if (estado.modo === "libre" && e.code === "Space") int.libre.saltar = true;
  if (!atajos) return;
  if (e.code === "KeyM") alternarRadarVisible();
  if (e.code === "KeyR") cambiarRadar();
  if (e.code === "KeyH" || e.key === "?") alternarAyuda();
  if (e.code === "KeyV") { const ms = modosDisponibles(); cambiarModo(ms[(ms.indexOf(estado.modo) + 1) % ms.length]); }
  if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ" && estado.midiendo) medicion.deshacer();
  if (e.code === "Escape") { $("#ayuda").hidden = true; ocultarFicha(); if (estado.midiendo) visor.medir(false); }
});
addEventListener("keyup", (e) => int.teclas.delete(e.code));
addEventListener("blur", () => int.teclas.clear());

/** Mirar arriba/abajo con teclado (RePág/AvPág), en todos los modos. */
function cabeceoTeclado(dt) {
  const k = int.teclas;
  const v = ((k.has("PageUp") ? 1 : 0) - (k.has("PageDown") ? 1 : 0)) * 1.2 * dt;
  if (!v) return;
  if (estado.modo === "tour") estado.cabeceo += v;
  else if (estado.modo === "libre") int.libre.cabeceo = THREE.MathUtils.clamp(int.libre.cabeceo + v, -1.45, 1.45);
}

function giroTeclado(dt) {
  if (estado.modo !== "tour") return;
  const k = int.teclas;
  const g = ((k.has("KeyE") ? 1 : 0) - (k.has("KeyQ") ? 1 : 0)) * 1.6 * dt;
  if (g) {
    if (int.giro?.offset != null) int.giro.offset += g;
    else if (!int.giro) estado.rumbo += g;
  }
}

// Giroscopio (recorrido 360 en móvil)
const qAux = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
const eAux = new THREE.Euler();
const qPantalla = new THREE.Quaternion();
const EJE_Z = new THREE.Vector3(0, 0, 1);
const EJE_Y = new THREE.Vector3(0, 1, 0);
function alOrientacion(ev) {
  if (ev.alpha == null || !int.giro) return;
  eAux.set(ev.beta * GRAD, ev.alpha * GRAD, -ev.gamma * GRAD, "YXZ");
  const q = new THREE.Quaternion().setFromEuler(eAux).multiply(qAux);
  const orient = (screen.orientation?.angle ?? window.orientation ?? 0) * GRAD;
  q.multiply(qPantalla.setFromAxisAngle(EJE_Z, -orient));
  const f = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
  if (int.giro.offset == null) int.giro.offset = estado.rumbo - rumbo(f.x, f.z);
  const nueva = new THREE.Quaternion().setFromAxisAngle(EJE_Y, -int.giro.offset).multiply(q);
  int.giro.q = int.giro.q ? int.giro.q.slerp(nueva, 0.35) : nueva; // suavizado
}
async function alternarGiro() {
  if (int.giro) {
    removeEventListener("deviceorientation", alOrientacion);
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(camara.quaternion);
    estado.rumbo = rumbo(f.x, f.z);
    estado.cabeceo = Math.asin(THREE.MathUtils.clamp(f.y, -1, 1));
    int.giro = null;
  } else {
    if (typeof DeviceOrientationEvent?.requestPermission === "function") {
      if ((await DeviceOrientationEvent.requestPermission().catch(() => "denied")) !== "granted") return aviso("Permiso de movimiento denegado");
    }
    int.giro = { offset: null, q: null };
    addEventListener("deviceorientation", alOrientacion);
  }
  $("#btn-giro").setAttribute("aria-pressed", String(!!int.giro));
}

// ------------------------------------------------------------------ plano / minimapa
const plano = crearPlano($("#mapa"), {
  tour: () => int.tour,
  planta: () => plantaPorId(estado.planta) ?? int.tour?.plantas?.[0],
  nodos: () => [...int.nodos.values()],
  nodoActual: () => (estado.modo === "tour" ? int.actual : null),
  posicion: () => {
    const fovH = 2 * Math.atan(Math.tan((camara.fov * GRAD) / 2) * camara.aspect);
    if (estado.modo === "libre" && int.libre.listo) return { x: int.libre.pos.x, z: int.libre.pos.z, rumbo: int.libre.rumbo, fovH, planta: estado.planta };
    if (estado.modo === "tour" && int.actual) {
      const f = vTmp.set(0, 0, -1).applyQuaternion(camara.quaternion);
      return { x: int.actual.x, z: int.actual.z, rumbo: rumbo(f.x, f.z), fovH, planta: int.actual.planta };
    }
    return null;
  },
  acento: () => getComputedStyle(document.documentElement).getPropertyValue("--acento").trim() || "#ffb547",
  modoMapa: () => ($("#minimapa").classList.contains("grande") ? "plano" : int.radar),
  texto, formato: metros,
  alElegirNodo: (n) => {
    if (estado.modo === "tour") irA(n);
    else if (estado.modo === "libre" && int.libre.listo) { int.libre.pos.x = n.x; int.libre.pos.z = n.z; dibujarMapa(); }
    else cambiarModo("tour").then(() => irA(n));
  },
  alElegirPunto: (x, z) => { if (estado.modo === "libre" && int.libre.listo && !int.libre.colisiones.length) { int.libre.pos.x = x; int.libre.pos.z = z; } },
});
const dibujarMapa = () => int.tour && plano.dibujar();
let ultimoMapa = 0;
function dibujarMapaThrottle() {
  const t = performance.now();
  if (t - ultimoMapa > (int.radar === "radar" ? 33 : 60)) { ultimoMapa = t; dibujarMapa(); }
}
// Radar (gira con la vista) ⇄ plano completo; botón para ocultarlo y tener una vista limpia. Se recuerda.
int.radar = almacen.leer("visor:radar", "radar");
int.radarVisible = almacen.leer("visor:radarVisible", true);
function aplicarRadar() {
  const m = $("#minimapa");
  m.classList.toggle("radar", int.radar === "radar");
  m.classList.toggle("oculto", !int.radarVisible);
  $("#btn-radar").setAttribute("aria-pressed", String(int.radarVisible));
  setTimeout(dibujarMapa, 30);
}
function alternarRadarVisible() {
  int.radarVisible = !int.radarVisible;
  almacen.guardar("visor:radarVisible", int.radarVisible);
  aplicarRadar();
}
function cambiarRadar() {
  int.radar = int.radar === "radar" ? "plano" : "radar";
  almacen.guardar("visor:radar", int.radar);
  if (!int.radarVisible) { int.radarVisible = true; almacen.guardar("visor:radarVisible", true); }
  aplicarRadar();
}
function alternarMapa() {
  const m = $("#minimapa");
  m.classList.toggle("grande");
  $("#btn-mapa").setAttribute("aria-expanded", String(m.classList.contains("grande")));
  setTimeout(dibujarMapa, 260);
}
function dibujarPlantas() {
  const cont = $("#plantas");
  const ps = int.tour.plantas ?? [];
  cont.hidden = ps.length < 2;
  cont.replaceChildren(...ps.map((p) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = texto(p.nombre) || p.id;
    b.setAttribute("aria-pressed", String(p.id === estado.planta));
    b.onclick = () => {
      estado.planta = p.id;
      const n = [...int.nodos.values()].find((x) => x.planta === p.id);
      if (estado.modo === "tour" && n) irA(n);
      dibujarPlantas(); dibujarMapa();
    };
    return b;
  }));
}

// ------------------------------------------------------------------ interfaz del núcleo
function mostrarCarga(si, frac) {
  $("#carga").hidden = !si;
  if (frac != null) $("#carga .barra div").style.width = `${Math.round(frac * 100)}%`;
}
let tAviso;
function aviso(txt, ms = 4500, { reintentar } = {}) {
  const el = $("#aviso");
  el.replaceChildren(document.createTextNode(txt));
  if (reintentar) {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = tr("aviso.reintentar");
    b.onclick = () => { el.hidden = true; reintentar(); };
    el.append(" ", b);
  }
  el.hidden = false;
  clearTimeout(tAviso);
  tAviso = setTimeout(() => (el.hidden = true), ms);
}
const urlSegura = (u) => (typeof u === "string" && /^(https?:|mailto:|tel:|\.{0,2}\/|[\w-]+\.[\w]+)/i.test(u.trim()) && !/^\s*javascript:/i.test(u) ? u : null);
function mostrarFicha(p) {
  const f = $("#ficha");
  f.querySelector("h2").textContent = texto(p.titulo);
  f.querySelector("p").textContent = texto(p.texto);
  const media = f.querySelector(".media");
  media.replaceChildren();
  if (p.imagen) { const i = new Image(); i.src = p.imagen; i.alt = texto(p.titulo); media.append(i); }
  if (urlSegura(p.video)) { const a = document.createElement("a"); a.href = urlSegura(p.video); a.target = "_blank"; a.rel = "noopener"; a.textContent = "▶ Vídeo"; media.append(a); }
  if (urlSegura(p.enlace)) { const a = document.createElement("a"); a.href = urlSegura(p.enlace); a.target = "_blank"; a.rel = "noopener"; a.textContent = "↗ Más información"; media.append(a); }
  f.hidden = false;
  f.querySelector(".cerrar").focus({ preventScroll: true });
}
function ocultarFicha() { $("#ficha").hidden = true; }
function alternarAyuda() {
  const a = $("#ayuda");
  a.hidden = !a.hidden;
  if (!a.hidden) { renderAyuda(); a.querySelector(".cerrar").focus(); }
}
function renderAyuda() {
  const a = $("#ayuda");
  a.querySelector("h2").textContent = tr("ayuda.titulo");
  // Teclas entre corchetes → <kbd>. En táctil solo se muestran los gestos.
  const li = (k) => `<li>${escapar(tr(k)).replace(/\b(W A S D|WASD|Shift|Espacio|Space|Esc|PgUp|PgDn|RePág|AvPág|[A-Z]|[1-9]-[1-9]|←|→|↑|↓)\b/g, "<kbd>$1</kbd>")}</li>`;
  a.querySelector(".cols").innerHTML = `
    <section><h3>${escapar(tr("modo.tour"))}</h3><ul>${(esTactil ? ["ayuda.mirar", "ayuda.zoom", "ayuda.flechas"] : ["ayuda.girar", "ayuda.mirar", "ayuda.avanzar", "ayuda.volver", "ayuda.zoom", "ayuda.flechas"]).map(li).join("")}</ul></section>
    <section><h3>${escapar(tr("modo.libre"))}</h3><ul>${(esTactil ? ["ayuda.joystick"] : ["ayuda.capturar", "ayuda.caminar", "ayuda.correr", "ayuda.subir", "ayuda.plano"]).map(li).join("")}</ul></section>`;
}
const escapar = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
document.querySelectorAll(".cerrar").forEach((b) => (b.onclick = () => {
  const d = b.closest("[role=dialog]");
  d.hidden = true;
  if (d.id === "ayuda") $("#btn-ayuda").focus();
}));
addEventListener("pointerdown", (e) => { const a = $("#ayuda"); if (!a.hidden && !a.contains(e.target) && !e.target.closest("#btn-ayuda")) a.hidden = true; });
$("#btn-ayuda").onclick = alternarAyuda;
$("#btn-mapa").onclick = alternarMapa;
$("#btn-radar").onclick = alternarRadarVisible;
$("#btn-vista-mapa").onclick = cambiarRadar;
aplicarRadar();
$("#btn-pantalla").onclick = () => {
  const el = document.documentElement;
  if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen ?? document.webkitExitFullscreen)?.call(document);
  else (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el);
};
$("#btn-giro").onclick = alternarGiro;
document.querySelectorAll("#modos button").forEach((b) => (b.onclick = () => cambiarModo(b.dataset.modo)));

// Pistas de primer uso (se recuerdan en localStorage)
const pistasVistas = new Set(almacen.leer("visor:pistas", []));
function mostrarPista(id, txt) {
  if (pistasVistas.has(id) || EMBED) return;
  const el = $("#pista");
  el.textContent = txt;
  el.dataset.id = id;
  el.hidden = false;
  setTimeout(() => ocultarPista(id), 9000);
}
function ocultarPista(id) {
  const el = $("#pista");
  if (el.dataset.id !== id) return;
  el.hidden = true;
  pistasVistas.add(id);
  almacen.guardar("visor:pistas", [...pistasVistas]);
}

function modosDisponibles() {
  const ms = [];
  if (int.nodos.size) ms.push("tour");
  if (int.tour.libre) ms.push("libre");
  if (maqueta?.disponible() || ["demo", "glb"].includes(int.tour.libre?.tipo)) ms.push("maqueta");
  return ms;
}

async function cambiarModo(modo) {
  int.modoPedido = modo;
  if (modo === estado.modo || !renderer) return;
  if (!modosDisponibles().includes(modo)) return;
  if (modo === "libre" || (modo === "maqueta" && ["demo", "glb"].includes(int.tour.libre?.tipo))) {
    try { await prepararLibre(); } catch { return; }
    if (int.modoPedido !== modo) return; // se pidió otro modo mientras cargaba
  }
  $("#pista").hidden = true;
  if (modo === "libre") {
    if (int.actual && !int.tour.libre.inicio && !int.libre.visitado) {
      int.libre.pos.x = int.actual.x; int.libre.pos.z = int.actual.z; int.libre.rumbo = estado.rumbo;
    }
    int.libre.visitado = true;
    mostrarPista("libre", esTactil ? tr("aviso.libre_tactil") : `${tr("aviso.clic_explorar")} · ${tr("aviso.libre_raton")}`);
  } else if (document.pointerLockElement) document.exitPointerLock();
  if (estado.midiendo && modo === "maqueta") visor.medir(false);
  if (guion.activo && modo !== "tour") guion.parar();
  const anterior = estado.modo;
  estado.modo = modo;
  maqueta?.activar(modo === "maqueta");
  if (anterior === "maqueta" && pisoDemo) aplicarAmbienteLibre();
  document.body.classList.toggle("modo-libre", modo === "libre");
  document.body.classList.toggle("modo-maqueta", modo === "maqueta");
  document.querySelectorAll("#modos button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.modo === modo)));
  etiquetas.hidden = modo !== "tour";
  cortinilla.hidden = !(estado.comparar && modo === "tour");
  actualizarSello();
  $("#btn-giro").hidden = !(esTactil && modo === "tour" && "DeviceOrientationEvent" in window);
  camara.position.set(0, 0, 0);
  camara.fov = int.fovBase * (modo === "tour" ? int.zoom : 1);
  camara.updateProjectionMatrix();
  dibujarMapa();
  visor.emitir("modo", { modo });
}

function construirGaleria() {
  const g = $("#galeria");
  g.setAttribute("aria-label", tr("galeria.titulo"));
  g.replaceChildren();
  for (const n of int.nodos.values()) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.id = n.id;
    b.title = texto(n.nombre);
    b.setAttribute("aria-label", tr("nav.ir_a", { x: texto(n.nombre) }));
    if (n.miniatura) { const img = new Image(); img.src = n.miniatura; img.alt = ""; img.loading = "lazy"; img.decoding = "async"; b.append(img); }
    const s = document.createElement("span"); s.textContent = texto(n.nombre); b.append(s);
    b.onclick = async () => { if (estado.modo !== "tour") await cambiarModo("tour"); irA(n); };
    g.append(b);
  }
  if (estado.nodo) g.querySelector(`[data-id="${CSS.escape(estado.nodo)}"]`)?.setAttribute("aria-current", "true");
}

function construirModos() {
  const ms = modosDisponibles();
  document.querySelectorAll("#modos button").forEach((b) => {
    b.hidden = !ms.includes(b.dataset.modo);
    b.textContent = tr(`modo.${b.dataset.modo}`);
  });
  $("#modos").hidden = ms.length < 2;
}

function aplicarMarca() {
  const m = int.tour.marca ?? {};
  if (m.color) document.documentElement.style.setProperty("--acento", m.color);
  const logo = $("#logo");
  if (m.logo) { logo.src = m.logo; logo.alt = texto(m.nombre); logo.hidden = false; } else logo.hidden = true;
  const titulo = texto(int.tour.titulo) || "Recorrido virtual";
  $("#titulo").textContent = titulo;
  document.title = `${titulo} · ${texto(m.nombre) || "cre8eight"}`;
}

function refrescarTextos() {
  aplicarMarca();
  construirModos();
  construirGaleria();
  dibujarPlantas();
  if (int.actual) { construirPuntos(); anunciarEstancia(int.actual); }
  maqueta?.reiniciar();
  if (estado.modo === "maqueta") maqueta.activar(true);
  medicion?.refrescarTextos();
  $("#btn-ayuda").setAttribute("aria-label", tr("ayuda.titulo"));
  $("#btn-mapa").setAttribute("aria-label", tr("plano.ampliar"));
  lienzo.setAttribute("aria-label", `${texto(int.tour.titulo)} · ${tr("aviso.arrastra")}`);
  if (!$("#ayuda").hidden) renderAyuda();
  dibujarMapa();
}

// ------------------------------------------------------------------ API pública (ESQUEMA.md § 2)
Object.defineProperty(visor, "tour", { get: () => int.tour });
Object.assign(visor, {
  ir: (id) => irA(id),
  modo: (m) => cambiarModo(m),
  t: (v) => texto(v),
  tr,
  fijarEstilo(id) { if (estado.estilo === id) return; const ant = estado.estilo; estado.estilo = id; return refrescarAmbiente("estilo", ant); },
  fijarMomento(id) { if (estado.momento === id) return; const ant = estado.momento; estado.momento = id; return refrescarAmbiente("momento", ant); },
  fijarPintura({ paredes = null, suelos = null } = {}) {
    estado.pintura = { paredes, suelos };
    const p = hexALineal(paredes), s = hexALineal(suelos);
    U.activaPared.value = p ? 1 : 0; U.activaSuelo.value = s ? 1 : 0;
    if (p) U.pinturaPared.value.set(...p);
    if (s) U.pinturaSuelo.value.set(...s);
    aplicarAmbienteLibre();
    visor.emitir("pintura", { ...estado.pintura });
  },
  comparar(si) {
    estado.comparar = !!si;
    cortinilla.hidden = !(si && estado.modo === "tour");
    if (si) { fijarCorte(0.5); actualizarComparacion(); $("#pista").hidden = true; } else { U.corte.value = -1; U.texC.value = blanco; }
    visor.emitir("comparar", { activo: estado.comparar });
  },
  medir(si) {
    if (!medicion) return;
    if (si && estado.modo === "maqueta") return;
    estado.midiendo = !!si;
    medicion.activar(estado.midiendo);
    if (si) {
      $("#pista").hidden = true;
      if (document.pointerLockElement) document.exitPointerLock();
      if (estado.modo === "tour" && estado.cabeceo > -0.3) estado.cabeceo = -0.42; // mirar al suelo para medir
    }
    visor.emitir("medir", { activo: estado.midiendo });
  },
  guion: { iniciar: () => guion.iniciar(), parar: () => guion.parar(), get activo() { return guion.activo; } },
  vista() {
    return { nodo: estado.nodo, rumbo: +(estado.rumbo / GRAD).toFixed(1), cabeceo: +(estado.cabeceo / GRAD).toFixed(1), fov: +camara.fov.toFixed(1) };
  },
  enlaceVista() {
    const v = visor.vista();
    const base = int.tour?.url_publica || (location.protocol.startsWith("http") && !EMBED ? location.href.split("#")[0] : null);
    if (!base) return "";
    return `${base}#v=${encodeURIComponent(v.nodo ?? "")},${v.rumbo},${v.cabeceo},${v.fov}`;
  },
  idioma(cod) {
    estado.idioma = cod;
    i18n?.fijarIdioma?.(cod);
    document.documentElement.lang = cod;
    refrescarTextos();
    visor.emitir("idioma", { idioma: cod });
  },
  ajustes(obj = {}) {
    Object.assign(int.ajustes, obj);
    // Solo se guardan las preferencias que el usuario ha cambiado (no se congela prefers-reduced-motion).
    almacen.guardar("visor:ajustes", { ...almacen.leer("visor:ajustes", {}), ...obj });
    if ("fov" in obj) redimensionar();
    return { ...int.ajustes };
  },
  /** Captura de la vista actual (sin interfaz), con una franja de marca y la estancia. */
  capturar({ ancho = 1600, tipo = "image/jpeg", calidad = 0.88, marca = true } = {}) {
    renderizar();
    const alto = Math.round((ancho * lienzo.height) / lienzo.width);
    const c = document.createElement("canvas");
    c.width = ancho; c.height = alto;
    const g = c.getContext("2d");
    g.drawImage(lienzo, 0, 0, ancho, alto);
    const est = visor.estanciaActual();
    if (marca) {
      const h = Math.round(alto * 0.07);
      g.fillStyle = "rgba(0,0,0,.55)"; g.fillRect(0, alto - h, ancho, h);
      g.fillStyle = "#fff"; g.font = `600 ${Math.round(h * 0.42)}px system-ui, sans-serif`; g.textBaseline = "middle";
      const izq = [texto(int.tour.marca?.nombre) || "cre8eight", int.tour.inmueble?.referencia, est && texto(est.nombre)].filter(Boolean).join(" · ");
      g.fillText(izq, h * 0.4, alto - h / 2);
    }
    // Aviso legal incrustado si la imagen no es una foto real (publicidad no engañosa).
    const sello = estado.modo === "tour" ? actualizarSello() : "";
    if (sello) {
      const t = Math.round(alto * 0.03);
      g.font = `600 ${t}px system-ui, sans-serif`;
      const w = g.measureText(sello).width + t * 1.4;
      g.fillStyle = "rgba(0,0,0,.6)"; g.fillRect(ancho - w - t, t, w, t * 1.9);
      g.fillStyle = "#fff"; g.textBaseline = "middle"; g.fillText(sello, ancho - w - t + t * 0.7, t * 1.95);
    }
    const vista = visor.vista();
    const enlace = visor.enlaceVista();
    return new Promise((ok) => c.toBlob((blob) => ok({ blob, nodo: estado.nodo, estancia: est, enlace, vista }), tipo, calidad));
  },
  /** Estancia (polígono del plano) donde está el visitante; si no hay polígonos, la foto 360 actual. */
  estanciaActual() {
    const pl = estado.planta;
    let x, z;
    if (estado.modo === "libre" && int.libre.listo) { x = int.libre.pos.x; z = int.libre.pos.z; }
    else if (int.actual) { x = int.actual.x; z = int.actual.z; }
    else return null;
    const e = (int.tour.estancias ?? []).find((s) => s.planta === pl && s.poligono?.length > 2 && puntoEnPoligono([x, z], s.poligono));
    if (e) return { id: e.id, nombre: e.nombre };
    return int.actual ? { id: int.actual.id, nombre: int.actual.nombre } : null;
  },
  /** Texto del aviso legal de la vista actual ("" si es una foto real). */
  sello: () => (estado.modo === "tour" ? actualizarSello() : ""),
  radar(modo) {
    if (modo === "oculto") { int.radarVisible = false; }
    else if (modo === "radar" || modo === "plano") { int.radar = modo; int.radarVisible = true; }
    almacen.guardar("visor:radar", int.radar); almacen.guardar("visor:radarVisible", int.radarVisible);
    aplicarRadar();
  },
  renderizar: () => renderizar(),
  /** Fija el tamaño interno del lienzo para grabar vídeo (p. ej. 1080×1920); null restaura. */
  tamanoCaptura(w, h) {
    int.captura = w && h ? { w, h } : null;
    if (!int.captura) renderer?.setPixelRatio(ratioBase);
    redimensionar();
  },
});

// ------------------------------------------------------------------ Estudio (postMessage) y enlaces profundos
function localDeDir(d) {
  const n = int.actual;
  const yawLocal = ((((rumbo(d.x, d.z) / GRAD - (n?.yaw ?? 0)) % 360) + 540) % 360) - 180;
  return { yawLocal: +yawLocal.toFixed(1), pitchLocal: +(Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)) / GRAD).toFixed(1) };
}
function vistaParaPadre() {
  const f = new THREE.Vector3(0, 0, -1).applyQuaternion(camara.quaternion);
  return { ...visor.vista(), ...localDeDir(f) };
}
function enviarPadre(msg) {
  if (EMBED && window.parent !== window) window.parent.postMessage(msg, location.origin === "null" ? "*" : location.origin);
}
addEventListener("message", async (e) => {
  if (!EMBED || e.source !== window.parent || window.parent === window) return;
  if (location.origin !== "null" && e.origin !== location.origin) return;
  const m = e.data ?? {};
  if (m.tipo === "visor:cargar" && m.tour) await cargarEnVisor(structuredClone(m.tour), { mantenerVista: true });
  if (m.tipo === "visor:ir") irA(m.nodo);
  if (m.tipo === "visor:yaw") {
    const n = int.nodos.get(m.nodo);
    if (n) { n.yaw = m.yaw; if (n === int.actual) { U.yawA.value = m.yaw * GRAD; construirPuntos(); } }
  }
});

function leerHash() {
  const dec = (x) => { try { return decodeURIComponent(x); } catch { return null; } };
  const crudo = location.hash.slice(1);
  if (crudo.startsWith("v=")) {
    const [nodo, r, c, f] = crudo.slice(2).split(","); // se separa antes de decodificar (ids con comas codificadas)
    return { nodo: dec(nodo), rumbo: +r * GRAD, cabeceo: +c * GRAD, fov: +f };
  }
  const h = dec(crudo);
  return h ? { nodo: h } : null;
}

// ------------------------------------------------------------------ carga del tour
async function obtenerTour() {
  if (window.TOUR_EMBEBIDO) return window.TOUR_EMBEBIDO;
  if (params.has("demo") || (EMBED && params.has("estudio"))) {
    const { DEMO_TOUR } = await import("./demo.js");
    return structuredClone(DEMO_TOUR);
  }
  const url = params.get("tour") ?? "tour.json";
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch (e) {
    // En producción nunca se muestra una vivienda falsa: pantalla de error con reintento.
    $("#portada")?.remove();
    const el = document.createElement("div");
    el.id = "error-carga";
    el.setAttribute("role", "alert");
    el.innerHTML = `<div class="marca-cre8">cre8<span>eight</span></div><p></p><button type="button"></button>`;
    el.querySelector("p").textContent = `${tr("aviso.error_carga", { x: url })}`;
    el.querySelector("button").textContent = tr("aviso.reintentar");
    el.querySelector("button").onclick = () => location.reload();
    document.body.append(el);
    throw e;
  }
}

/** Única puerta de entrada de datos: limpia y valida el tour para que un dato roto no tumbe el visor. */
function normalizar(t) {
  const fin = (n) => Number.isFinite(+n);
  const punto = (v) => Array.isArray(v) && v.length >= 2 && fin(v[0]) && fin(v[1]);
  const avisar = (m) => console.warn(`[cre8eight] ${m}`);
  t.panoramas = (Array.isArray(t.panoramas) ? t.panoramas : []).filter((p) => {
    const ok = p && p.id != null && (p.imagen || p.textura || t.demo);
    if (!ok) avisar(`panorama descartado (sin id o sin imagen): ${JSON.stringify(p)?.slice(0, 80)}`);
    return ok;
  });
  const vistos = new Set();
  for (const p of t.panoramas) {
    p.id = String(p.id);
    if (vistos.has(p.id)) { avisar(`id repetido "${p.id}"`); p.id = `${p.id}-${vistos.size}`; }
    vistos.add(p.id);
    p.x = fin(p.x) ? +p.x : 0; p.z = fin(p.z) ? +p.z : 0;
    if (p.enlaces != null && !Array.isArray(p.enlaces)) delete p.enlaces;
    if (p.puntos != null && !Array.isArray(p.puntos)) p.puntos = [];
    if (p.variantes != null && !Array.isArray(p.variantes)) p.variantes = [];
  }
  if (!Array.isArray(t.plantas) || !t.plantas.length) t.plantas = [{ id: "p0", nombre: "", plano: t.plano, muros: t.muros }];
  for (const pl of t.plantas) pl.muros = (Array.isArray(pl.muros) ? pl.muros : []).filter((m) => Array.isArray(m) && m.length === 4 && m.every(fin));
  const p0 = t.plantas[0].id;
  for (const p of t.panoramas) p.planta ??= p0;
  t.estancias = (Array.isArray(t.estancias) ? t.estancias : [])
    .map((e) => ({ ...e, planta: e.planta ?? p0, poligono: Array.isArray(e.poligono) ? e.poligono.filter(punto).map((v) => [+v[0], +v[1]]) : [] }))
    .filter((e) => { if (e.poligono.length < 3) avisar(`estancia "${e.id ?? "?"}" sin polígono válido: se ignora en el plano`); return true; });
  if (!t.estilos?.length) {
    const ids = [...new Set(t.panoramas.flatMap((p) => (p.variantes ?? []).map((v) => v.estilo).filter(Boolean)))];
    t.estilos = ids.length ? [{ id: "original" }, ...ids.map((id) => ({ id }))] : [];
  }
  if (!t.momentos?.length) {
    const hay = t.panoramas.some((p) => (p.variantes ?? []).some((v) => v.momento && v.momento !== "dia"));
    t.momentos = hay ? ["dia", "atardecer", "noche"] : [];
  }
  return t;
}

function enlazar(t) {
  int.nodos.clear();
  for (const p of t.panoramas) { p.vecinos = []; int.nodos.set(p.id, p); }
  const radio = t.radio_enlace_auto ?? 4.5;
  for (const p of t.panoramas) {
    for (const id of p.enlaces ?? []) {
      const v = int.nodos.get(id);
      if (!v || v === p) { if (!v) console.warn(`Enlace desconocido ${p.id} → ${id}`); continue; }
      if (!p.vecinos.includes(v)) p.vecinos.push(v);
      if (!v.vecinos.includes(p)) v.vecinos.push(p);
    }
  }
  // Auto-enlaces (como los Auto Hotspots de Chaos): nodos sin enlaces declarados, misma planta y cerca.
  for (const p of t.panoramas) {
    if (p.enlaces) continue;
    for (const v of t.panoramas) {
      if (v !== p && !v.enlaces && v.planta === p.planta && Math.hypot(v.x - p.x, v.z - p.z) <= radio && !p.vecinos.includes(v)) { p.vecinos.push(v); v.vecinos.push(p); }
    }
  }
}

async function cargarEnVisor(t, { mantenerVista = false } = {}) {
  const vistaPrevia = mantenerVista && int.actual ? { nodo: int.actual.id, rumbo: estado.rumbo, cabeceo: estado.cabeceo } : null;
  if (int.transicion) { int.transicion.resolver(); int.transicion = null; }
  for (const [, e] of cache) if (e.tex && !e.fija) liberarTex(e.tex);
  cache.clear(); luces.clear();
  int.actual = null; int.fuenteActual = null;
  U.mezcla.value = 0;
  int.tour = normalizar(t);
  enlazar(int.tour);
  plano.invalidar();
  maqueta?.reiniciar();
  if (t.demo && renderer) {
    mostrarCarga(true);
    const { generarPanoramas } = await import("./demo.js");
    generarPanoramas(THREE, renderer, t.panoramas, t.altura_camara ?? 1.5);
    mostrarCarga(false);
  }
  const pedido = params.get("lang") ?? i18n?.idiomaActual?.() ?? t.idioma ?? "es";
  estado.idioma = (t.idiomas ?? [t.idioma ?? "es"]).includes(pedido) ? pedido : t.idioma ?? "es";
  i18n?.fijarIdioma?.(estado.idioma);
  document.documentElement.lang = estado.idioma;
  refrescarTextos();
  redimensionar();
  if (!int.nodos.size) {
    estado.planta = t.plantas[0].id;
    if (t.libre) await cambiarModo("libre");
    else aviso(tr("aviso.error_carga", { x: texto(t.titulo) || "tour" }), 600000, { reintentar: () => location.reload() });
    return;
  }
  const h = vistaPrevia ?? leerHash();
  const inicio = int.nodos.get(h?.nodo) ?? int.nodos.get(t.inicio) ?? t.panoramas[0];
  estado.planta = inicio.planta;
  estado.rumbo = h?.rumbo != null && !isNaN(h.rumbo) && int.nodos.has(h?.nodo) ? h.rumbo : (inicio.rumbo_inicial ?? inicio.yaw ?? 0) * GRAD;
  if (h?.cabeceo != null && !isNaN(h.cabeceo)) estado.cabeceo = h.cabeceo;
  if (renderer) await irA(inicio, { instantaneo: true });
  if (h?.fov && !isNaN(h.fov)) fijarZoom(h.fov / int.fovBase);
  else { int.actual = inicio; estado.nodo = inicio.id; }
  dibujarPlantas();
}

// ------------------------------------------------------------------ bucle y arranque
function redimensionar() {
  const w = int.captura?.w ?? innerWidth, h = int.captura?.h ?? innerHeight;
  if (int.captura) renderer?.setPixelRatio(1);
  renderer?.setSize(w, h, false);
  camara.aspect = w / h;
  int.fovBase = int.ajustes.fov ? +int.ajustes.fov : w < h ? 80 : 72;
  if (!int.transicion) camara.fov = int.fovBase * (estado.modo === "tour" ? int.zoom : 1);
  camara.updateProjectionMatrix();
  maqueta?.redimensionar(w / h);
  const pr = renderer?.getPixelRatio() ?? 1;
  U.resolucion.value.set(w * pr, h * pr);
  dibujarMapa();
}
addEventListener("resize", redimensionar);

let tMapa = 0, tVista = 0, ultimaVista = "";
const fps = { t: 0, n: 0 };
function renderizar() {
  if (!renderer) return;
  if (estado.modo === "maqueta") renderer.render(maqueta.escena(), maqueta.camara);
  else renderer.render(estado.modo === "libre" ? escenaLibre : escena360, camara);
  emitirBase("frame"); // sin CustomEvent: se emite en cada fotograma (grabación de vídeo)
}

function bucle() {
  reloj.update();
  const dt = Math.min(reloj.getDelta(), 0.1);
  if (estado.modo === "tour") {
    pasoTransicion(dt);
    guion.paso(dt);
    giroTeclado(dt);
    cabeceoTeclado(dt);
    actualizarBarraGuion();
    estado.cabeceo = THREE.MathUtils.clamp(estado.cabeceo, -1.45, 1.45);
    if (int.giro?.q) camara.quaternion.copy(int.giro.q);
    else camara.rotation.set(estado.cabeceo, -estado.rumbo, 0);
    estado.fov = camara.fov;
    camara.updateMatrixWorld();
    renderizar();
    actualizarEtiquetas();
    tMapa += dt;
    if (tMapa > (int.radar === "radar" ? 0.033 : 0.1)) { tMapa = 0; dibujarMapa(); }
    tVista += dt;
    if (EMBED && tVista > 0.15) {
      tVista = 0;
      const v = vistaParaPadre();
      const k = JSON.stringify(v);
      if (k !== ultimaVista) { ultimaVista = k; enviarPadre({ tipo: "visor:vista", ...v }); }
    }
  } else if (estado.modo === "libre") {
    pasoTransicion(dt);
    cabeceoTeclado(dt);
    moverLibre(dt);
    camara.updateMatrixWorld();
    renderizar();
  } else {
    maqueta.cuadro();
    renderizar();
  }
  medicion?.cuadro();
  // Interfaz que se oculta tras 3 s sin interacción (vuelve al mover el ratón o tocar).
  const inactiva = int.yaInteractuo && performance.now() - int.ultimaInteraccion > 3500 && estado.modo !== "maqueta" && !estado.midiendo && !EMBED
    && !document.querySelector("#paneles [aria-expanded=true], #paneles .pn-abierto, #minimapa.grande")
    && !document.activeElement?.closest?.("#barra, #modos, #iconos, #galeria, #minimapa, #paneles, #guion-barra");
  if (inactiva !== document.body.classList.contains("ui-inactiva")) document.body.classList.toggle("ui-inactiva", inactiva);
  // Calidad adaptativa: si los FPS caen por debajo de 28, se baja la resolución interna.
  fps.t += dt; fps.n++;
  if (fps.t > 2) {
    const media = fps.n / fps.t;
    if (media < 28 && renderer.getPixelRatio() > 1) { renderer.setPixelRatio(Math.max(1, renderer.getPixelRatio() - 0.25)); redimensionar(); }
    fps.t = 0; fps.n = 0;
  }
}

lienzo.addEventListener("webglcontextlost", (e) => {
  e.preventDefault();
  aviso(tr("aviso.contexto_perdido"), 600000, { reintentar: () => location.reload() });
});

async function iniciar() {
  i18n = await import("./i18n.js").catch(() => null);
  const t = await obtenerTour();
  if (!renderer) { document.body.classList.add("sin-webgl"); aviso(tr("aviso.sin_webgl"), 600000); }
  await cargarEnVisor(t);
  const modoPedido = params.get("modo");
  if (modoPedido && modosDisponibles().includes(modoPedido)) await cambiarModo(modoPedido);
  if (renderer) renderer.setAnimationLoop(bucle);
  if (estado.modo === "tour" && renderer) mostrarPista("arrastra", esTactil ? tr("aviso.arrastra") : `${tr("aviso.arrastra")} · ${tr("aviso.clic_explorar")}`);
  import("./paneles.js").then((m) => m.iniciarPaneles?.(visor)).catch((e) => console.info("Paneles no disponibles:", e.message));
  visor.listo = true;
  $("#portada").classList.add("fuera");
  setTimeout(() => $("#portada").remove(), 700);
  visor.emitir("listo", {});
  enviarPadre({ tipo: "visor:listo" });
}

iniciar().catch((e) => { console.error(e); $("#portada")?.remove(); if (!$("#error-carga")) aviso(`Error: ${e.message}`, 10000); });

// Arrastrar y soltar un .spz/.ply/.splat/.sog/.glb para probarlo al instante.
addEventListener("dragover", (e) => { if (!EMBED) e.preventDefault(); });
addEventListener("drop", async (e) => {
  if (EMBED || !renderer) return;
  e.preventDefault();
  const f = e.dataTransfer.files[0];
  if (!f) return;
  const bytes = new Uint8Array(await f.arrayBuffer());
  const cfg = int.tour.libre ?? {};
  try {
    if (/\.(glb|gltf)$/i.test(f.name)) {
      const gltf = await new GLTFLoader().parseAsync(bytes.buffer, "");
      escenaLibre.add(gltf.scene, new THREE.HemisphereLight(0xffffff, 0x444444, 2.5));
    } else {
      await cargarSplat({ fileBytes: bytes, fileName: f.name }, { rotacion: cfg.rotacion ?? [180, 0, 0] });
    }
  } catch (err) { return aviso(err.message, 6000); }
  int.tour.libre ??= { tipo: "archivo" };
  Object.assign(int.libre, { listo: true, suelo: false, colisiones: [], limites: null });
  int.libre.pos.set(0, 0, 2);
  construirModos();
  await cambiarModo("libre");
  aviso(`${f.name} ✓`);
});
