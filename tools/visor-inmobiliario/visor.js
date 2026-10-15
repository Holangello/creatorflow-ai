// Visor inmobiliario 3D (núcleo). Contrato: ESQUEMA.md
// Recorrido 360 (fotos equirectangulares) + modo libre (gaussian splat / GLB) + maqueta 3D,
// con estilos, día/noche, pintura de paredes, medición, visita guiada y API pública.
import * as THREE from "three";
import { GRAD, angDif, rumbo, Emisor, almacen, hexALineal, areaPoligono, puntoEnPoligono, formatoMetros, urlSegura } from "./util.js";
import { crearPlano } from "./plano.js";
import { crearMedicion } from "./medicion.js";
import { crearMaqueta } from "./maqueta.js";
import { crearGuion } from "./guion.js";

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const EMBED = params.has("embed");
const esTactil = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
const conRaton = matchMedia("(pointer: fine)").matches; // modo juego: solo con ratón
// «donde: "movil"» del menú «Más»: la disposición móvil de los paneles (teléfono y tablet en vertical).
const MQ_MOVIL = matchMedia("(max-width: 720px), (orientation: portrait) and (max-width: 1024px), (max-height: 500px) and (orientation: landscape)");
const API_PANTALLA = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
if (esTactil) document.body.classList.add("tactil");
if (EMBED) { document.body.classList.add("embed"); $("#portada")?.remove(); }
// Apariencia automática (decisión B de la fase 4): manda el dispositivo; el visitante la cambia en Ajustes (tema.js).

// ------------------------------------------------------------------ textos
const FALLBACK = {
  "modo.titulo": "Modo de visita", "modo.tour": "Recorrido 360", "modo.libre": "Paseo libre 3D", "modo.maqueta": "Maqueta 3D",
  "modo.tour_corto": "Recorrido", "modo.libre_corto": "Paseo libre", "modo.maqueta_corto": "Maqueta",
  // Ayuda y controles: [tecla] se muestra como <kbd>
  "ayuda.titulo": "Ayuda y controles", "ayuda.sec_moverte": "Moverte", "ayuda.sec_mirar": "Mirar", "ayuda.sec_juego": "Modo juego",
  "ayuda.sec_radar": "Radar y plano", "ayuda.sec_estancias": "Estancias", "ayuda.sec_foto": "Preguntar con foto", "ayuda.sec_estilo": "Estilo y luz", "ayuda.sec_teclas": "Teclas",
  "ayuda.ir_raton": "Haz clic en una flecha del suelo, o en el suelo, para ir allí", "ayuda.ir_tactil": "Toca una flecha del suelo, o el suelo, para ir allí",
  "ayuda.wasd": "[W] [A] [S] [D] o las flechas: ir a la estancia de delante, de detrás o de los lados · mantén [W] para seguir avanzando",
  "ayuda.libre_raton": "Paseo libre: [W] [A] [S] [D] o las flechas para caminar · [Shift] para correr",
  "ayuda.libre_tactil": "Paseo libre: pulgar izquierdo para caminar, arrastra a la derecha para mirar",
  "ayuda.maqueta": "Maqueta: arrastra (o usa las flechas y + −) para girarla y acercarla; toca una etiqueta para entrar en esa estancia",
  "ayuda.mirar": "Arrastra para mirar alrededor", "ayuda.zoom_raton": "Rueda del ratón: acercar y alejar", "ayuda.zoom_tactil": "Pellizca para acercar y alejar, o usa «Acercar» y «Alejar» en «Más»",
  "ayuda.girar_teclas": "[Q] [E] girar · [RePág] [AvPág] mirar arriba y abajo", "ayuda.giroscopio": "«Mirar moviendo el móvil» está en «Más»",
  "ayuda.juego_entrar": "Pulsa [W] [A] [S] [D] o 🎮 para mirar con el ratón, como en un videojuego",
  "ayuda.juego_boton": "Pulsa 🎮 para mirar con el ratón, como en un videojuego",
  "ayuda.juego_salir": "[Esc] para salir del modo juego", "ayuda.juego_libre": "En el paseo libre, haz clic para caminar",
  "ayuda.radar_raton": "[R] o el botón Radar muestran u ocultan el radar", "ayuda.radar_tactil": "El botón Radar lo muestra u oculta",
  "ayuda.plano_raton": "[M] o el título de arriba abren «{x}»", "ayuda.plano_tactil": "El título de arriba abre «{x}»",
  "ayuda.foto": "«{x}» añade lo que ves a tu consulta", "ayuda.contactar": "«{x}» envía tu pregunta, con las fotos, a la agencia",
  "ayuda.estilo": "«{x}» cambia la decoración, los colores o la luz (día, atardecer, noche)", "ayuda.antes_despues": "«{x}» compara con la foto original",
  "ayuda.teclas": "[R] radar · [M] «{x}» · [H] ayuda · [Esc] cerrar", "ayuda.tecla_modo": "[V] cambiar de modo",
  // nombres de piezas de los paneles que cita la ayuda (por si i18n.js no carga)
  "contacto.hacer_foto": "Foto de la vista", "contacto.corto": "Contactar", "personalizar.titulo": "Estilo y luz", "comparar.titulo": "Antes y después",
  "aviso.error_carga": "No se pudo cargar {x}",
  "aviso.sin_webgl": "Tu dispositivo no admite el recorrido 3D", "aviso.vista_vacia": "La vista previa aparecerá aquí cuando añadas fotos 360.",
  "aviso.giroscopio_denegado": "Permiso de movimiento denegado", "aviso.error": "Error: {x}", "titulo.defecto": "Recorrido virtual",
  "punto.video": "Vídeo", "punto.mas_info": "Más información", "comparar.antes": "Antes", "comparar.despues": "Después",
  "guion.pausar": "Pausar visita guiada", "guion.reanudar": "Reanudar", "aviso.contexto_perdido": "Se perdió el contexto gráfico", "aviso.reintentar": "Reintentar",
  "aviso.libre_tactil": "Pulgar izquierdo para caminar · arrastra a la derecha para mirar", "aviso.arrastra": "Arrastra para mirar",
  "pista.raton": "Arrastra para mirar · W A S D para moverte", "pista.tactil": "Arrastra para mirar · toca las flechas para avanzar",
  "aviso.estilo_no_disponible": "Este estilo no está disponible en esta estancia",
  // Barra de vista, menú «Más», modo juego, radar y «Estancias y plano»
  "vista.titulo": "Vista", "mas.titulo": "Más", "comun.cerrar": "Cerrar", "comun.pantalla_completa": "Pantalla completa", "comun.acercar": "Acercar", "comun.alejar": "Alejar",
  "radar.titulo": "Radar", "radar.mostrar": "Mostrar radar", "radar.ocultar": "Ocultar radar",
  "juego.titulo": "Modo juego", "juego.ayuda": "Mira con el ratón como en un videojuego (Esc para salir)", "juego.aviso": "Modo juego · Esc para salir",
  "juego.salida": "Has salido del modo juego · W A S D o 🎮 para volver", "juego.tarjeta": "Haz clic para caminar · W A S D · ratón para mirar · Esc para salir",
  "ep.titulo": "Estancias y plano", "ep.abrir": "Ver estancias y plano", "plantas.titulo": "Plantas", "contacto.zona_otras": "Otras estancias",
  // Portada
  "portada.cargando": "Cargando el recorrido…", "portada.empezar": "Empezar visita", "idioma.titulo": "Idioma", "marca.creado_con": "Creado con {x}",
  "ficha.mes": "/mes", "ficha.habitacion": "habitación", "ficha.habitaciones": "Habitaciones",
  "ficha.bano": "baño", "ficha.banos": "Baños",
  "medir.titulo": "Medir", "medir.distancia": "Distancia", "medir.altura": "Altura", "medir.marcar": "Marcar punto", "medir.deshacer": "Deshacer",
  "medir.borrar": "Borrar", "medir.cerrar": "Cerrar", "medir.ayuda_a": "Apunta al suelo y marca el punto A", "medir.ayuda_b": "Ahora marca el punto B",
  "medir.ayuda_altura_a": "Marca la base de la pared (en el suelo)", "medir.ayuda_altura_b": "Ahora marca el punto superior",
  "medir.precision": "Medida orientativa (±3 %)", "medir.suelo": "Apunta al suelo",
  "plano.planta": "Planta", "guion.iniciar": "Visita guiada", "guion.parar": "Detener visita",
  "nav.ir_a": "Ir a {x}", "nav.metros": "{x} m", "galeria.titulo": "Estancias",
  "sonido.musica": "Música", "sonido.activar": "Activar música", "sonido.silenciar": "Silenciar música",
  "sello.ia": "Recreación virtual · IA", "sello.render": "Render / infografía", "sello.simulado": "Iluminación simulada",
};
let i18n = null;
function tr(k, vars) {
  let s = i18n?.tr ? i18n.tr(k, vars) : null;
  if (!s || s === k) {
    s = FALLBACK[k] ?? k;
    if (vars) s = s.replace(/\{(\w+)\}/g, (_, n) => vars[n] ?? "");
  }
  return rotular(s);
}
// W A S D y Q E se pulsan por su posición (e.code). En AZERTY esas teclas dicen Z Q S D y A E: si el navegador conoce la
// distribución (Chromium), los textos muestran lo que pone en el teclado. Sin la API, W A S D.
const ROTULOS = {};
try {
  navigator.keyboard?.getLayoutMap?.().then((m) => {
    for (const k of "WASDQE") { const l = m.get(`Key${k}`)?.toUpperCase(); if (l && /^\p{L}$/u.test(l) && l !== k) ROTULOS[k] = l; }
  }).catch(() => {});
} catch { /* sin la API (o en un iframe) */ }
function rotular(s) {
  if (!Object.keys(ROTULOS).length) return s;
  return s.replace(/\[([WASDQE])\]/g, (_, k) => `[${ROTULOS[k] ?? k}]`).replace(/\bW A S D\b/g, () => [..."WASD"].map((k) => ROTULOS[k] ?? k).join(" "));
}
/** Atajos con nombre (R, M, H, V): por la letra de la tecla (en AZERTY la M no está donde en QWERTY); con otros alfabetos, por su posición. */
const letra = (e) => (/^[a-z]$/i.test(e.key ?? "") ? e.key.toLowerCase() : e.code?.startsWith("Key") ? e.code.slice(3).toLowerCase() : "");
function texto(v) {
  if (v == null) return "";
  if (i18n?.resolverTexto) return i18n.resolverTexto(v) ?? "";
  if (typeof v === "object") return v[estado.idioma] ?? v.es ?? Object.values(v)[0] ?? "";
  return String(v);
}
const metros = (m) => formatoMetros(m, estado.idioma); // medidas y distancias, con dos decimales
const localeActual = () => i18n?.localeActual?.() ?? estado.idioma;
/** Superficies: sin decimales y con punto de millar («1.200 m²»), en el título, el plano, la maqueta y las listas (V14). */
const m2Corto = (a) => `${new Intl.NumberFormat(localeActual(), { maximumFractionDigits: 0, useGrouping: "always" }).format(a)} m²`;

// ------------------------------------------------------------------ API y estado
const visor = new Emisor();
const emitirBase = visor.emitir.bind(visor);
visor.emitir = (ev, datos = {}) => {
  emitirBase(ev, datos);
  dispatchEvent(new CustomEvent(`visor:${ev}`, { detail: datos }));
  try { window.dataLayer?.push({ event: `visor_${ev.replace(":", "_")}`, ...datos }); } catch {}
};
window.visor = visor;
document.querySelector(".fallo-carga")?.remove(); // el aviso de «tarda más de lo normal» de index.html

const estado = {
  modo: "tour", nodo: null, rumbo: 0, cabeceo: 0, fov: 75, estilo: "original", momento: "dia", momentoSimulado: false,
  pintura: { paredes: null, suelos: null }, pinturaDisponible: false, estiloDisponible: true, comparar: false,
  midiendo: false, guionActivo: false, planta: null, idioma: "es",
};
visor.estado = estado;

// modoJuegoWASD: W A S D entra en el modo juego (con ratón). capturaConClic: un clic en la escena también (antes de la fase 3).
// «Reducir movimiento» ya no es un ajuste del visor: lo guarda tema.js (cre8eight:movimiento), común a las tres páginas.
const AJUSTES_DEF = { sensibilidad: 1, sensibilidadTactil: 1, invertirY: false, atajos: true, modoJuegoWASD: true, capturaConClic: false };
// Migración (fase 4): quien activó «Reducir movimiento» en el visor de la fase 3 (visor:ajustes) lo conserva en tema.js.
{
  const viejos = almacen.leer("visor:ajustes", {});
  if (viejos && typeof viejos === "object" && "reducirMovimiento" in viejos) {
    let propio = null;
    try { propio = localStorage.getItem("cre8eight:movimiento"); } catch { /* sin almacenamiento */ }
    if (viejos.reducirMovimiento === true && !propio) window.cre8Tema?.fijar?.("movimiento", "reducido");
    delete viejos.reducirMovimiento;
    almacen.guardar("visor:ajustes", viejos);
  }
}
const int = {
  tour: null, nodos: new Map(), actual: null, transicion: null, teclas: new Set(), giro: null,
  zoom: 1, fovBase: 75, ajustes: { ...AJUSTES_DEF, ...almacen.leer("visor:ajustes", {}) },
  libre: { pos: new THREE.Vector3(), vel: new THREE.Vector3(), rumbo: 0, cabeceo: 0, listo: false, colisiones: [], suelo: false, limites: null, modelo: null },
  joy: { x: 0, y: 0, id: null }, ultimaInteraccion: performance.now(), fuenteActual: null,
  portada: !!$("#portada"), progreso: 0, radarVisible: false, plantaVista: null, // sin portada con ?embed (se quitó arriba)
};
/** Movimiento reducido: una sola fuente de verdad, la de tema.js (lo que eligió el visitante o prefers-reduced-motion).
    Contingencia: sin tema.js, lo último pedido con visor.ajustes({ reducirMovimiento }) o el ajuste del sistema. */
let movimientoSinTema = null;
const reducido = () => {
  const m = window.cre8Tema?.efectivo?.movimiento;
  return m ? m === "reducido" : (movimientoSinTema ?? matchMedia("(prefers-reduced-motion: reduce)").matches);
};

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
Object.defineProperty(visor, "_debug", { get: () => ({ texturas: renderer?.info.memory.textures, cache: cache.size, maqueta: maqueta?.camara.position.toArray().map((x) => +x.toFixed(2)), programas: renderer?.info.programs?.map((x) => String(x.cacheKey)) ?? [],
  luz: { ...luz.medida, max: luz.max, min: luz.min, ms: luz.ms, n: luz.n,
    detalle: luz.zonas?.map((z) => [z.el ? z.el.id || z.el.className.split(" ")[0] : "vista", +z.p10.toFixed(3), +z.p90.toFixed(3)]) } }) });

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
// Móvil: una textura 4096×2048 ≈ 32 MB de GPU. Escritorio: una de 8192×4096 ≈ 128 MB; con 8 (la actual, sus vecinas y
// alguna variante) el tope ronda 1 GB, no 1,75 (M15)
const LIMITE_TEX = esTactil ? 4 : 8;
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
  // La primera foto, con la portada delante, se descarga con fetch para enseñar el progreso real (bytes).
  // Contingencia: si fetch falla (CORS, sin red, sin cuerpo legible) se carga como siempre.
  const alProgreso = int.alProgresoCarga;
  int.alProgresoCarga = null;
  if (alProgreso) {
    return descargarConProgreso(url, alProgreso)
      .then((local) => cargarImagen(local, color, 1).finally(() => URL.revokeObjectURL(local)))
      .catch(() => cargarImagen(url, color, intentos));
  }
  return new Promise((ok, mal) => cargadorTex.load(url, (t) => { t.image = limitarImagen(t.image); ok(ajustarTextura(t, color)); }, undefined,
    () => (intentos > 1 ? setTimeout(() => cargarImagen(url, color, intentos - 1).then(ok, mal), 600) : mal(new Error(tr("aviso.error_carga", { x: url }))))));
}

async function descargarConProgreso(url, alProgreso) {
  const r = await fetch(url);
  if (!r.ok || !r.body) throw new Error(String(r.status));
  const total = +r.headers.get("content-length") || 0;
  const lector = r.body.getReader();
  const trozos = [];
  let n = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    trozos.push(value);
    n += value.length;
    if (total) alProgreso(Math.min(1, n / total));
  }
  return URL.createObjectURL(new Blob(trozos, { type: r.headers.get("content-type") || "image/jpeg" }));
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
      grande.then((t) => { if (int.actual === n && int.fuenteActual?.clave === f.clave && !int.transicion) { U.texA.value = t; tocarEscena(); } }).catch(() => {});
    }
  } else tex = await f.cargar();
  const masc = await mascaraDe(n, f.variante).catch(() => null);
  return { f, tex, masc, luz: luzDe(f.clave, tex, masc), yaw: (n.yaw ?? 0) * GRAD };
}

function asignar(slot, s) {
  tocarEscena();
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
const matAroHover = new THREE.MeshBasicMaterial({ color: 0xcfad66, transparent: true, opacity: 1, depthTest: false }); // color: --c-acento (colorearTema)
const matInvisible = new THREE.MeshBasicMaterial({ visible: false });

const etiquetas = $("#etiquetas");
let etiquetasActivas = [];
/** Las etiquetas se ocultan al ir a otra estancia y se rehacen al llegar: si una tenía el foco, pasa al lienzo (A10). */
const focoAlLienzo = () => { if (etiquetas.contains(document.activeElement)) lienzo.focus({ preventScroll: true }); };
const alturaNodo = (n = int.actual) => n?.altura_camara ?? int.tour?.altura_camara ?? 1.5;
const plantaPorId = (id) => int.tour?.plantas?.find((p) => p.id === id);

function construirPuntos() {
  tocarEscena();
  grupoFlechas.clear();
  focoAlLienzo();
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
    etq.className = "etq c8-vidrio c8-vidrio--texto";
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
    el.className = "info c8-vidrio c8-vidrio--texto";
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
  focoAlLienzo();
  // Ficha de petición: si llega otra navegación mientras esta carga, gana la última.
  const ficha = (int.navFicha = (int.navFicha ?? 0) + 1);
  int.navDestino = destino; // si el Estudio recarga el tour a mitad de camino, se conserva el destino (cargarEnVisor)
  mostrarCarga(true);
  let slot;
  try { slot = await prepararSlot(destino); }
  catch (e) {
    if (ficha === int.navFicha) { int.navDestino = null; aviso(e.message, 6000, { reintentar: () => irA(destino) }); mostrarCarga(false); }
    return;
  }
  if (ficha !== int.navFicha) return;
  while (int.transicion) await int.transicion.promesa;
  if (ficha !== int.navFicha) return;
  mostrarCarga(false);
  if (destino === int.actual) { int.navDestino = null; return; }
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
  int.actual = nodo;
  luz.pendiente = true;
  if (int.navDestino === nodo) int.navDestino = null;
  estado.nodo = nodo.id;
  estado.planta = nodo.planta;
  estado.momentoSimulado = !!int.fuenteActual?.sim;
  estado.estiloDisponible = int.fuenteActual?.estiloOk ?? true;
  estado.pinturaDisponible = U.hayMascA.value > 0;
  grupoFlechas.visible = true;
  construirPuntos();
  anunciarEstancia(nodo);
  actualizarSello();
  document.querySelectorAll("#galeria .estancia, #estancias-plano .ep-estancia").forEach((b) => b.setAttribute("aria-current", String(b.dataset.id === nodo.id)));
  const enTira = $('#galeria .estancia[aria-current="true"]');
  if (enTira && $("#galeria").offsetParent) enTira.scrollIntoView?.({ block: "nearest", inline: "center", behavior: reducido() ? "auto" : "smooth" });
  if (!EMBED && int.tour && !int.tour.demo) history.replaceState(null, "", `#${encodeURIComponent(nodo.id)}`);
  precargarVecinos(nodo);
  // Mantener W/↑ pulsada encadena estancias, como caminar en un videojuego.
  setTimeout(() => {
    const k = int.teclas;
    if (estado.modo === "tour" && int.actual === nodo && (k.has("KeyW") || k.has("ArrowUp"))) avanzar(0);
  }, 180);
  if (estado.comparar) actualizarComparacion();
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
  const origen = v ? v.origen ?? (v.estilo && v.estilo !== "original" ? "ia" : "foto") : int.actual?.origen ?? "foto";
  return { origen, simulado: !!int.fuenteActual?.sim };
}
function actualizarSello() {
  const { origen, simulado } = origenVisible();
  const el = $("#sello-ia");
  const txt = origen === "ia" ? tr("sello.ia") : origen === "render" ? tr("sello.render") : simulado ? tr("sello.simulado") : "";
  el.textContent = txt;
  el.hidden = !txt || estado.modo !== "tour";
  return txt;
}

/** «Salón · Planta 1» con varias plantas; si no, «Salón · 30 m²» (en #lugar y para el lector de pantalla). */
function anunciarEstancia(n) {
  const est = estanciaDe(n);
  const m2 = est ? m2Corto(areaPoligono(est.poligono)) : "";
  const planta = (int.tour.plantas?.length ?? 0) > 1 ? texto(plantaPorId(n.planta)?.nombre) : "";
  const nombre = texto(n.nombre);
  $("#estancia").textContent = [nombre, planta || m2].filter(Boolean).join(" · ");
  $("#anuncio").textContent = [nombre, planta, m2].filter(Boolean).join(", ");
  actualizarLugar();
  // Rótulo elegante al entrar en una estancia (se desvanece solo).
  const r = $("#rotulo");
  r.querySelector("b").textContent = nombre;
  r.querySelector("span").textContent = m2;
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
  luz.pendiente = true;
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
  tocarEscena();
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

/** GLTFLoader bajo demanda: solo lo necesitan el modo libre con GLB y el colisionador. */
let promesaGLTF = null;
const cargadorGLTF = () => (promesaGLTF ??= import("three/addons/loaders/GLTFLoader.js").then((m) => m.GLTFLoader));

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
      const gltf = await new (await cargadorGLTF())().loadAsync(cfg.url);
      aplicarTransformacion(gltf.scene, cfg);
      escenaLibre.add(gltf.scene, new THREE.HemisphereLight(0xffffff, 0x444444, 2.5));
      L.colisiones = [gltf.scene];
      L.modelo = gltf.scene;
    } else if (cfg.tipo === "splat") {
      await cargarSplat({ url: cfg.url }, cfg);
    }
    if (cfg.colisionador) {
      const gltf = await new (await cargadorGLTF())().loadAsync(cfg.colisionador);
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
  if (estado.modo !== "maqueta") escenaLibre.background = new THREE.Color(estado.momento === "noche" ? 0x0d1830 : 0x1b1e24);
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
  lienzo, contenedor, tr, texto, superficie: m2Corto,
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
    el.textContent = t ? sinCortes(texto(t)) : "";
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
  if (b.classList.contains("pausado") !== guion.pausado) { b.classList.toggle("pausado", guion.pausado); b.setAttribute("aria-label", tr(guion.pausado ? "guion.reanudar" : "guion.pausar")); }
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
  // Primer gesto real (no un simple movimiento): ya se puede reproducir sonido. Con portada, lo arranca «Empezar visita».
  if (!int.portada && !sonido.iniciado && sonido.activo && sonido.el && ev && ev.type !== "pointermove" && ev.type !== "wheel"
      && int.tour?.audio?.musica?.autoplay !== false && !(ev.target instanceof Node && btnSonido.contains(ev.target))) arrancarSonido(); // el destino puede ser window
  if (document.body.classList.contains("ui-inactiva")) document.body.classList.remove("ui-inactiva");
}
["pointermove", "pointerdown", "keydown", "wheel", "touchstart"].forEach((ev) => addEventListener(ev, interaccion, { passive: true }));
// El marco de foco del lienzo solo se enciende al llegar con el tabulador.
addEventListener("keydown", (e) => { if (e.key === "Tab") document.body.classList.add("foco-tab"); }, true);
addEventListener("pointerdown", () => document.body.classList.remove("foco-tab"), true);

lienzo.addEventListener("pointerdown", (e) => {
  if (guion.activo && !guion.pausado) guion.alternarPausa(); // tocar la escena pausa la visita (no la cancela)
  if (document.pointerLockElement !== lienzo) { try { lienzo.setPointerCapture(e.pointerId); } catch {} }
  punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  ocultarPista("inicio");
  // Joystick flotante: pulgar en la mitad izquierda en modo libre táctil.
  if (estado.modo === "libre" && e.pointerType === "touch" && e.clientX < innerWidth * 0.45 && int.joy.id == null) {
    const j = $("#joystick");
    j.classList.add("activo");
    const r = j.offsetWidth / 2 || 60, pomo = $("#joystick-pomo").offsetWidth / 2 || 26;
    int.joy = { x: 0, y: 0, id: e.pointerId, cx: e.clientX, cy: e.clientY, r, recorrido: r - pomo };
    j.style.left = `${e.clientX - r}px`; j.style.top = `${e.clientY - r}px`;
    ocultarPista("libre");
    return;
  }
  if (punteros.size === 2 && int.joy.id == null) {
    const [a, b] = [...punteros.values()];
    pellizco = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: int.zoom };
    arrastre = null;
  } else {
    // Con la interfaz oculta, un toque donde estaba un control solo la despierta: no navega por sorpresa.
    arrastre = { id: e.pointerId, x: e.clientX, y: e.clientY, mov: 0, tipo: e.pointerType, despertar: enHudOculto(e.clientX, e.clientY) };
  }
});

function enHudOculto(x, y) {
  if (!document.body.classList.contains("ui-inactiva")) return false;
  return [...document.querySelectorAll("#lugar, #modos, #barra-vista, #galeria")].some((c) => {
    const r = c.getBoundingClientRect();
    return r.width && x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 6 && y <= r.bottom + 6;
  });
}

lienzo.addEventListener("pointermove", (e) => {
  if (punteros.has(e.pointerId)) punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (e.pointerId === int.joy.id) {
    let x = (e.clientX - int.joy.cx) / int.joy.r, y = (e.clientY - int.joy.cy) / int.joy.r;
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    int.joy.x = Math.abs(x) < 0.12 ? 0 : x;
    int.joy.y = Math.abs(y) < 0.12 ? 0 : y;
    $("#joystick-pomo").style.transform = `translate(${x * int.joy.recorrido}px, ${y * int.joy.recorrido}px)`;
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
  if (arrastre.mov > 8) tarjetaJuego(false); // quien prefiere arrastrar no necesita la tarjeta del paseo libre
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
    if (arrastre.mov < 8 && e.type === "pointerup" && !arrastre.despertar) clic(e);
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
  tocarEscena();
  lienzo.style.cursor = g ? "pointer" : "";
}
// ---- modo juego (ratón capturado, como en Minecraft): W A S D, el botón 🎮 o un clic en el paseo libre.
// Contingencia: si el navegador no deja capturar el ratón, se sigue mirando arrastrando (sin aviso de error).
const juegoPosible = () => conRaton && !EMBED && !!renderer && !int.portada && (estado.modo === "tour" || estado.modo === "libre");
function capturarRaton() {
  if (!juegoPosible() || estado.midiendo || document.pointerLockElement === lienzo) return;
  try {
    const p = lienzo.requestPointerLock?.({ unadjustedMovement: true });
    if (p?.catch) p.catch(() => lienzo.requestPointerLock?.()?.catch?.(() => {}));
  } catch { /* sin Pointer Lock */ }
}
/** Sale del modo juego sin el aviso de salida (al abrir un diálogo, medir, entrar en la maqueta…). */
function salirJuego() {
  if (document.pointerLockElement !== lienzo) return;
  int.salidaSilenciosa = true;
  document.exitPointerLock?.();
}
document.addEventListener("pointerlockchange", () => {
  const si = document.pointerLockElement === lienzo;
  if (si === !!int.enJuego) return;
  int.enJuego = si;
  document.body.classList.toggle("raton-capturado", si);
  $("#btn-juego").setAttribute("aria-pressed", String(si));
  const av = $("#aviso-juego");
  av.textContent = tr("juego.aviso");
  av.hidden = !si; // al mostrarse vuelve a empezar su animación: se atenúa al 40 % a los 3 s
  if (si) { $("#pista").hidden = true; tarjetaJuego(false); cerrarMas(); }
  else if (!int.salidaSilenciosa) {
    if (estado.modo === "libre") tarjetaJuego(true);
    else if (!int.salidaAvisada) { int.salidaAvisada = true; aviso(tr("juego.salida"), 4500); }
  }
  int.salidaSilenciosa = false;
  visor.emitir("modojuego", { activo: si });
});
/** Tarjeta «Haz clic para caminar…» del paseo libre (solo con ratón). */
function tarjetaJuego(si) {
  const t = $("#tarjeta-juego");
  const ver = !!si && juegoPosible() && estado.modo === "libre" && !estado.midiendo && document.pointerLockElement !== lienzo;
  if (ver) t.textContent = sinCortes(tr("juego.tarjeta"));
  t.hidden = !ver;
}
$("#tarjeta-juego").onclick = () => capturarRaton();

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
    // Un clic en el vacío ya no captura el ratón (salvo con el ajuste «Capturar el ratón con un clic»).
    if (e.pointerType === "mouse" && int.ajustes.capturaConClic) capturarRaton();
  } else if (estado.modo === "libre" && e.pointerType === "mouse") {
    capturarRaton(); // en el paseo libre, el clic es «Haz clic para caminar»
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
  // Con la portada, un diálogo o un menú abiertos, las teclas son suyas: la escena de detrás no se mueve.
  if (int.portada || e.target.closest?.("dialog, [role=dialog], [role=menu]")) return;
  const enUI = e.target !== document.body && e.target !== lienzo && e.target.closest?.("button, a, [role=slider]");
  if (enUI && ["Enter", "Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.code)) return;
  // WCAG 2.1.4: con los atajos de una letra apagados (Ajustes), las letras solo actúan con el foco en el lienzo
  // (role="application") o en el modo juego: ni un botón con el foco ni el control por voz mueven la vista sin querer.
  const atajos = int.ajustes.atajos !== false;
  if (!atajos && e.target !== lienzo && document.pointerLockElement !== lienzo && /^(Key[A-Z]|Digit\d)$/.test(e.code)) return;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "PageUp", "PageDown"].includes(e.code)) e.preventDefault();
  if (guion.activo && e.code === "Space" && !enUI) { e.preventDefault(); guion.alternarPausa(); return; }
  if (guion.activo && e.code === "Escape") guion.parar();
  else if (guion.activo && !guion.pausado && !e.code.startsWith("Shift") && !["h", "m", "r"].includes(letra(e))) guion.alternarPausa();
  int.teclas.add(e.code);
  if (e.repeat) return;
  const modificador = e.ctrlKey || e.metaKey || e.altKey;
  if (estado.modo === "tour" && !modificador) {
    const dir = { KeyW: 0, ArrowUp: 0, Enter: 0, KeyS: Math.PI, ArrowDown: Math.PI, KeyA: -Math.PI / 2, ArrowLeft: -Math.PI / 2, KeyD: Math.PI / 2, ArrowRight: Math.PI / 2 }[e.code];
    if (dir !== undefined) avanzar(dir);
    if (e.code === "Equal" || e.code === "NumpadAdd") fijarZoom(int.zoom * 0.85);
    if (e.code === "Minus" || e.code === "NumpadSubtract") fijarZoom(int.zoom / 0.85);
    if (/^Digit[1-9]$/.test(e.code)) { const n = [...int.nodos.values()][+e.code.slice(5) - 1]; if (n) irA(n); }
  }
  // Modo juego con las letras W A S D (nunca con las flechas, que son el camino del teclado accesible).
  if (atajos && !modificador && /^Key[WASD]$/.test(e.code) && int.ajustes.modoJuegoWASD !== false) capturarRaton();
  if (estado.modo === "libre" && e.code === "Space") int.libre.saltar = true;
  if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ" && estado.midiendo) medicion.deshacer();
  if (e.code === "Escape") { ocultarFicha(); if (estado.midiendo) visor.medir(false); }
  if (!atajos || modificador) return;
  const l = letra(e);
  if (l === "r") alternarRadar();
  if (l === "m") estanciasPlano();
  if (l === "h" || e.key === "?") alternarAyuda();
  if (l === "v") { const ms = modosDisponibles(); cambiarModo(ms[(ms.indexOf(estado.modo) + 1) % ms.length]); }
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
const hayGiroscopio = () => esTactil && "DeviceOrientationEvent" in window;
/** «Mirar moviendo el móvil» (recorrido 360). Contingencia: sin permiso se avisa y se sigue arrastrando. */
async function fijarGiro(si = !int.giro) {
  if (!!si === !!int.giro || (si && !hayGiroscopio())) return !!int.giro;
  if (!si) {
    removeEventListener("deviceorientation", alOrientacion);
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(camara.quaternion);
    estado.rumbo = rumbo(f.x, f.z);
    estado.cabeceo = Math.asin(THREE.MathUtils.clamp(f.y, -1, 1));
    int.giro = null;
  } else {
    if (typeof DeviceOrientationEvent?.requestPermission === "function") {
      if ((await DeviceOrientationEvent.requestPermission().catch(() => "denied")) !== "granted") { aviso(tr("aviso.giroscopio_denegado")); return false; }
    }
    int.giro = { offset: null, q: null };
    addEventListener("deviceorientation", alOrientacion);
  }
  visor.emitir("giroscopio", { activo: !!int.giro });
  return !!int.giro;
}

// ------------------------------------------------------------------ radar y plano
// Dos vistas del mismo plano (plano.js): el radar de la esquina (gira con la mirada, como en Counter-Strike) y el plano
// grande de «Estancias y plano» (norte arriba, con pestañas de planta).
function posicionVisitante() {
  const fovH = 2 * Math.atan(Math.tan((camara.fov * GRAD) / 2) * camara.aspect);
  if (estado.modo === "libre" && int.libre.listo) return { x: int.libre.pos.x, z: int.libre.pos.z, rumbo: int.libre.rumbo, fovH, planta: estado.planta };
  if (estado.modo === "tour" && int.actual) {
    const f = vTmp.set(0, 0, -1).applyQuaternion(camara.quaternion);
    return { x: int.actual.x, z: int.actual.z, rumbo: rumbo(f.x, f.z), fovH, planta: int.actual.planta };
  }
  return null;
}
const ctxPlano = {
  tour: () => int.tour,
  nodos: () => [...int.nodos.values()],
  nodoActual: () => (estado.modo === "tour" ? int.actual : null),
  posicion: posicionVisitante,
  texto, superficie: m2Corto,
};
const radar = crearPlano($("#mapa"), {
  ...ctxPlano,
  planta: () => plantaPorId(estado.planta) ?? int.tour?.plantas?.[0],
  modoMapa: () => "radar",
  alElegirNodo: (n) => {
    if (estado.modo === "tour") irA(n);
    else if (estado.modo === "libre" && int.libre.listo) { int.libre.pos.x = n.x; int.libre.pos.z = n.z; dibujarRadar(); }
    else cambiarModo("tour").then(() => irA(n));
  },
  alElegirPunto: (x, z) => { if (estado.modo === "libre" && int.libre.listo && !int.libre.colisiones.length) { int.libre.pos.x = x; int.libre.pos.z = z; } },
});
const planoGrande = crearPlano($("#plano-grande"), {
  ...ctxPlano,
  planta: () => plantaPorId(int.plantaVista ?? estado.planta) ?? int.tour?.plantas?.[0],
  modoMapa: () => "plano",
  alElegirNodo: (n) => irDesdeLista(n),
});
const dibujarRadar = () => { if (int.tour && !$("#radar").hidden) radar.dibujar(); };
const dibujarMapa = () => { dibujarRadar(); if (int.tour && abierto($("#estancias-plano"))) planoGrande.dibujar(); };
let ultimoMapa = 0;
function dibujarMapaThrottle() {
  const t = performance.now();
  if (t - ultimoMapa > 33) { ultimoMapa = t; dibujarRadar(); }
}
/** Hay plano de verdad si alguna planta tiene imagen o muros, o hay estancias dibujadas (sin él, el radar empieza oculto). */
const hayPlano = (t = int.tour) => !!t && ((t.plantas ?? []).some((p) => p.plano?.imagen || p.muros?.length) || (t.estancias ?? []).some((e) => e.poligono?.length > 2));
function aplicarRadar() {
  const ver = int.radarVisible && !!int.tour && estado.modo !== "maqueta";
  $("#radar").hidden = !ver;
  const b = $("#btn-radar");
  b.setAttribute("aria-pressed", String(int.radarVisible));
  b.setAttribute("aria-label", tr("radar.titulo"));
  b.title = `${tr(int.radarVisible ? "radar.ocultar" : "radar.mostrar")}${conRaton ? " (R)" : ""}`;
  if (ver) requestAnimationFrame(dibujarRadar);
}
function alternarRadar(si = !int.radarVisible) {
  int.radarVisible = !!si;
  if (hayPlano()) almacen.guardar("visor:radarVisible", int.radarVisible); // sin plano no se recuerda: vuelve a empezar oculto
  aplicarRadar();
}

// ------------------------------------------------------------------ sonido (música del proyecto)
// Web Audio (GainNode): en iPhone/iPad el volumen de <audio> no se puede cambiar por código.
// Los navegadores no dejan sonar nada antes de la primera interacción: la música arranca entonces, con fundido.
const sonido = {
  el: null, src: null, ctx: null, ganancia: null, gananciaGrab: null, destinoGrab: null,
  activo: almacen.leer("visor:sonido", true), volumen: almacen.leer("visor:volumen", null), base: 0.5, iniciado: false, grabando: false,
};
const btnSonido = $("#btn-sonido"); // el icono solo silencia o activa; el volumen está en Ajustes (paneles: visor.sonido.fijarVolumen)

function configurarSonido() {
  const m = int.tour?.audio?.musica;
  if (!m?.archivo) {
    btnSonido.hidden = true;
    if (sonido.el) { sonido.el.pause(); try { sonido.fuente?.disconnect(); } catch {} }
    sonido.el = null; sonido.src = null; sonido.fuente = null;
    return;
  }
  btnSonido.hidden = false;
  sonido.base = THREE.MathUtils.clamp(+(m.volumen ?? 0.5) || 0.5, 0, 1);
  if (sonido.src !== m.archivo) {
    if (sonido.el) { // la pista anterior se corta del todo (no solo se silencia)
      sonido.el.pause();
      try { sonido.fuente?.disconnect(); } catch {}
      sonido.el.removeAttribute("src");
      sonido.el.load();
    }
    const el = new Audio();
    el.preload = "auto";
    el.loop = m.bucle !== false;
    el.crossOrigin = "anonymous";
    // Contingencia: si la música no se puede cargar (archivo ausente, formato no admitido), el botón desaparece
    // en vez de quedarse sin hacer nada; el resto del recorrido sigue igual.
    el.addEventListener("error", () => {
      if (sonido.el !== el) return;
      console.warn("[sonido] no se pudo cargar la música:", m.archivo);
      try { sonido.fuente?.disconnect(); } catch {}
      sonido.el = null; sonido.src = null; sonido.fuente = null; sonido.iniciado = false;   // src null: se reintenta si el tour se vuelve a cargar
      btnSonido.hidden = true;
      visor.emitir("sonido", { activo: sonido.activo, volumen: volumenObjetivo(true), disponible: false });
    });
    el.src = m.archivo;
    sonido.el = el; sonido.src = m.archivo; sonido.fuente = null;
    sonido.iniciado = false;
  }
  pintarSonido();
  if (sonido.activo && int.yaInteractuo && !int.portada && m.autoplay !== false) arrancarSonido();
}

function volumenObjetivo(ignorarMudo = false) {
  const v = sonido.volumen ?? sonido.base;
  return ignorarMudo || sonido.activo ? v : 0;
}

function asegurarGrafo() {
  if (sonido.ctx || !sonido.el) return !!sonido.ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  sonido.ctx = new AC();
  sonido.ganancia = sonido.ctx.createGain();
  sonido.ganancia.gain.value = 0;
  sonido.ganancia.connect(sonido.ctx.destination);
  return true;
}
function conectarFuente() {
  if (!sonido.el || !asegurarGrafo() || sonido.fuente?.mediaElement === sonido.el) return;
  sonido.fuente = sonido.ctx.createMediaElementSource(sonido.el);
  sonido.fuente.connect(sonido.ganancia);
  if (sonido.gananciaGrab) sonido.fuente.connect(sonido.gananciaGrab);
}

function fundido(valor, segundos = 0.8) {
  if (!sonido.ganancia) return;
  const g = sonido.ganancia.gain, t = sonido.ctx.currentTime;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(valor, t + segundos);
}

async function arrancarSonido() {
  if (!sonido.el) return;
  conectarFuente();
  try {
    await sonido.ctx?.resume();
    await sonido.el.play();
    sonido.iniciado = true;
    fundido(volumenObjetivo(), 2);
  } catch { /* sin gesto del usuario todavía: se reintenta en la siguiente interacción */ }
  pintarSonido();
}

function pararSonido() {
  if (!sonido.el) return;
  fundido(0, 0.3);
  const el = sonido.el;
  setTimeout(() => { if (sonido.el !== el || (sonido.activo && !document.hidden) || sonido.grabando) return; el.pause(); pintarSonido(); }, 350);
}

function alternarSonido() {
  sonido.activo = !sonido.activo;
  almacen.guardar("visor:sonido", sonido.activo);
  if (sonido.activo) { if (sonido.el?.paused) arrancarSonido(); else fundido(volumenObjetivo(), 0.5); }
  else { fundido(0, 0.5); setTimeout(() => { if (!sonido.activo && !sonido.grabando) sonido.el?.pause(); pintarSonido(); }, 600); }
  pintarSonido();
  visor.emitir("sonido", { activo: sonido.activo, volumen: volumenObjetivo(true) });
}

function fijarVolumen(v) {
  sonido.volumen = THREE.MathUtils.clamp(v, 0, 1);
  almacen.guardar("visor:volumen", sonido.volumen);
  if (sonido.volumen > 0 && !sonido.activo) return alternarSonido();
  fundido(volumenObjetivo(), 0.15);
  visor.emitir("sonido", { activo: sonido.activo, volumen: sonido.volumen });
}

/** Pulsado (dorado) = música activada, el mismo significado que en el radar y el modo juego. */
function pintarSonido() {
  const sonando = !!sonido.el && !sonido.el.paused && sonido.activo;
  btnSonido.classList.toggle("sonando", sonando);
  btnSonido.classList.toggle("silenciado", !sonido.activo);
  btnSonido.setAttribute("aria-pressed", String(sonido.activo));
  const m = int.tour?.audio?.musica;
  btnSonido.setAttribute("aria-label", tr("sonido.musica") + (m?.titulo ? ` · ${texto(m.titulo)}` : ""));
  btnSonido.title = tr(sonido.activo ? "sonido.silenciar" : "sonido.activar");
}

btnSonido.addEventListener("click", alternarSonido);
document.addEventListener("visibilitychange", () => {
  if (!sonido.el || sonido.grabando) return;
  if (document.hidden) pararSonido();
  else if (sonido.activo && sonido.iniciado) arrancarSonido();
});

// ------------------------------------------------------------------ tema: colores de la escena y vidrio adaptativo
const transparenciaReducida = () => document.documentElement.dataset.transparencia === "reducida";
/** Colores de la escena que salen de los tokens: el realce de las flechas del suelo (acento) y el fondo sin foto. */
function colorearTema() {
  tocarEscena();
  const cs = getComputedStyle(document.documentElement);
  const hex = (v) => { const x = cs.getPropertyValue(v).trim(); return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(x) ? x : null; };
  const acento = hex("--c-acento"), fondo = hex("--c-fondo");
  if (acento) matAroHover.color.set(acento);
  if (fondo) renderer?.setClearColor(fondo);
}
document.addEventListener("cre8:tema", () => {
  pintarAcento(); // el relleno del color de marca depende del tema
  dibujarMapa();
  if (transparenciaReducida()) quitarLuz(); else luz.pendiente = true;
});

// Vidrio adaptativo (tema.css, «Vidrio adaptativo»): el vidrio se vuelve más transparente cuando la foto lo permite.
// En el recorrido 360, tras cada cambio de estancia, estilo o momento, y como mucho una vez por segundo si la vista se
// movió y ya está quieta, se mide la luminancia relativa de la vista en 32×18 píxeles, solo donde hay vidrio encima: cada
// pieza de vidrio (HUD, rótulos de las flechas, puntos «i», tarjeta de los paneles…) es una zona con sus percentiles y
// manda la más exigente. Percentil 90 → data-luz-max (manda en oscuro: lo difícil es una zona clara detrás del vidrio);
// percentil 10 → data-luz-min (manda en claro). Así el vidrio se aclara si detrás del vidrio hay pared clara aunque en el
// centro haya un sofá oscuro. Histéresis de ±0,03 para que no parpadee. Con «Reducir transparencia» no se mide.
// La escena no se copia del lienzo (drawImage del WebGL espera a la GPU y lee el fotograma entero: 180-560 ms en esta
// máquina): se vuelve a pintar igual en 32×18 y se lee sin esperar (PBO + fence, readRenderTargetPixelsAsync). La foto
// de la portada, que es una imagen, sí se copia a 32×18. En el paseo libre y la maqueta (modelos 3D, no la foto) no se
// mide: medir estrenaría allí otros programas (≈1 s de bloqueo con WebGL por software) y vale el peor caso.
// Contingencia: si la lectura falla, se quitan los atributos y queda el peor caso, que siempre cumple AA.
const LINEAL = Float32Array.from({ length: 256 }, (_, i) => { const c = i / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
const luz = { g: null, rt: null, px: new Uint8Array(32 * 18 * 4), leyendo: false, max: null, min: null, medida: null, zonas: null, ms: 0, n: 0,
  pendiente: true, movida: false, quietaDesde: 0, ultima: -1e9, vista: new Float64Array(17) };
/** Cuántos umbrales (de menor a mayor) supera v, con histéresis respecto al nivel actual. */
function nivelLuz(v, actual, umbrales, h = 0.03) {
  let n = 0;
  umbrales.forEach((u, i) => { if (v > u + (actual == null ? 0 : actual > i ? -h : h)) n = i + 1; });
  return n;
}
function quitarLuz() {
  const d = document.documentElement.dataset;
  delete d.luzMax; delete d.luzMin;
  luz.max = luz.min = luz.medida = luz.zonas = null;
}
/** Zonas con vidrio encima: para cada pieza `.c8-vidrio` que se ve sobre `marco` (el rectángulo de la pantalla que ocupa
    la rejilla de 32×18), las celdas cuyo centro tapa (la del centro de la pieza si es más pequeña que una celda). Las
    piezas ocultas por inactividad cuentan: vuelven a verse sin que la vista cambie. Sin piezas, toda la vista. */
function zonasVidrio(marco) {
  const zonas = [];
  if (!marco.width || !marco.height) return zonas;
  const sx = 32 / marco.width, sy = 18 / marco.height;
  for (const el of document.querySelectorAll(".c8-vidrio")) {
    if (el.id === "rotulo" && !el.classList.contains("visible")) continue; // transparente mientras no se anuncia una estancia
    if (!int.portada && portada?.contains(el)) continue; // la portada que se va (se desvanece 0,7 s) ya no cuenta
    const q = el.getBoundingClientRect();
    if (!q.width || !q.height) continue; // display: none (atributo hidden, diálogo cerrado)
    const x0 = (q.left - marco.left) * sx, x1 = (q.right - marco.left) * sx, y0 = (q.top - marco.top) * sy, y1 = (q.bottom - marco.top) * sy;
    if (x1 <= 0 || y1 <= 0 || x0 >= 32 || y0 >= 18) continue; // fuera de la vista
    const celdas = [];
    for (let y = Math.max(0, Math.ceil(y0 - 0.5)); y <= Math.min(17, Math.floor(y1 - 0.5)); y++) {
      for (let x = Math.max(0, Math.ceil(x0 - 0.5)); x <= Math.min(31, Math.floor(x1 - 0.5)); x++) celdas.push(y * 32 + x);
    }
    if (!celdas.length) celdas.push(Math.min(17, Math.max(0, Math.floor((y0 + y1) / 2))) * 32 + Math.min(31, Math.max(0, Math.floor((x0 + x1) / 2))));
    zonas.push({ el, celdas });
  }
  return zonas;
}
/** Percentiles 90 y 10 de la luminancia de 32×18 píxeles RGBA (lineales y de abajo arriba si vienen del render; sRGB y
    de arriba abajo si de una imagen), por zona de vidrio: manda el p90 más alto y el p10 más bajo. */
function calcularLuz(px, lineal, zonas = []) {
  if (!px[3]) throw new Error("sin imagen"); // contexto gráfico perdido: transparente
  const L = new Float32Array(32 * 18);
  for (let y = 0; y < 18; y++) {
    for (let x = 0, i = ((lineal ? 17 - y : y) * 32) * 4; x < 32; x++, i += 4) {
      L[y * 32 + x] = lineal ? (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255 : 0.2126 * LINEAL[px[i]] + 0.7152 * LINEAL[px[i + 1]] + 0.0722 * LINEAL[px[i + 2]];
    }
  }
  const pct = (v, p) => v[Math.round(p * (v.length - 1))];
  let p90 = 0, p10 = 1;
  luz.zonas = (zonas.length ? zonas : [{ el: null, celdas: L.map((_, j) => j) }]).map(({ el, celdas }) => {
    const v = Float32Array.from(celdas, (j) => L[j]).sort(), z = { el, p90: pct(v, 0.9), p10: pct(v, 0.1) };
    p90 = Math.max(p90, z.p90);
    p10 = Math.min(p10, z.p10);
    return z;
  });
  luz.max = nivelLuz(p90, luz.max, [0.1, 0.35]);
  luz.min = nivelLuz(p10, luz.min, [0.18, 0.45]);
  const d = document.documentElement.dataset, max = ["baja", "media"][luz.max], min = [null, "media", "alta"][luz.min];
  if (max) d.luzMax = max; else delete d.luzMax;
  if (min) d.luzMin = min; else delete d.luzMin;
  luz.medida = { p90: +p90.toFixed(3), p10: +p10.toFixed(3), zonas: zonas.length };
  luz.n++;
}
/** Imagen o lienzo 2D (la foto de la portada): se copia a 32×18 la parte que se ve y se mide. */
function medirImagen(fuente) {
  const t0 = performance.now();
  try {
    if (!luz.g) { const c = document.createElement("canvas"); c.width = 32; c.height = 18; luz.g = c.getContext("2d", { willReadFrequently: true }); }
    // #portada .fondo: object-fit: cover en el 112 % de la pantalla, centrado (se ve la parte central)
    const w = fuente.naturalWidth || fuente.width, h = fuente.naturalHeight || fuente.height, pantalla = { left: 0, top: 0, width: innerWidth, height: innerHeight };
    let sw = w, sh = h;
    if (w / h > innerWidth / innerHeight) sw = (h * innerWidth) / innerHeight; else sh = (w * innerHeight) / innerWidth;
    sw /= 1.12; sh /= 1.12;
    luz.g.drawImage(fuente, (w - sw) / 2, (h - sh) / 2, sw, sh, 0, 0, 32, 18);
    calcularLuz(luz.g.getImageData(0, 0, 32, 18).data, false, zonasVidrio(pantalla));
  } catch {
    quitarLuz(); // p. ej. una miniatura de otro dominio sin CORS
  }
  luz.ms = Math.round((performance.now() - t0) * 100) / 100;
}
/** La vista del recorrido: se pinta igual en 32×18 y se lee sin esperar a la GPU. */
function medirEscena() {
  if (estado.modo !== "tour") return quitarLuz();
  const t0 = performance.now(), previo = renderer.getRenderTarget(), ancho = U.resolucion.value.x, alto = U.resolucion.value.y;
  try {
    luz.rt ??= new THREE.WebGLRenderTarget(32, 18);
    U.resolucion.value.set(32, 18); // el corte del comparador, en píxeles del lienzo pequeño
    renderer.setRenderTarget(luz.rt);
    pintarEscena();
  } catch {
    return quitarLuz();
  } finally {
    renderer.setRenderTarget(previo); // pase lo que pase, el siguiente fotograma vuelve a la pantalla
    U.resolucion.value.set(ancho, alto);
  }
  luz.leyendo = true;
  const sincrono = performance.now() - t0;
  renderer.readRenderTargetPixelsAsync(luz.rt, 0, 0, 32, 18, luz.px)
    .then((px) => {
      if (transparenciaReducida()) return;
      const t1 = performance.now();
      calcularLuz(px, true, zonasVidrio(lienzo.getBoundingClientRect()));
      luz.ms = Math.round((sincrono + performance.now() - t1) * 100) / 100;
    })
    .catch(() => quitarLuz())
    .finally(() => { luz.leyendo = false; });
}
/** Con la portada delante, pinta una vez la escena entera (sin descartar lo que queda fuera del encuadre, como las flechas
    del suelo) en la pantalla y en el lienzo de la medición de la luz: los programas se compilan y se estrenan ya, y el
    primer fotograma tras «Empezar visita» no se para a compilar (aquí, con WebGL por software, eran ~0,6 s de bloqueo). */
function precompilar() {
  const fuera = [];
  escena360.traverse((o) => { if (o.isMesh && o.frustumCulled) { fuera.push(o); o.frustumCulled = false; } });
  try {
    luz.rt ??= new THREE.WebGLRenderTarget(32, 18);
    renderer.setRenderTarget(luz.rt);
    renderer.render(escena360, camara);
    renderer.setRenderTarget(null);
    renderer.render(escena360, camara);
  } catch { /* se compilarán al pintar */ } finally {
    renderer.setRenderTarget(null);
    for (const o of fuera) o.frustumCulled = true;
  }
}
// Una pieza de vidrio que aparece o se va en los paneles (un diálogo, un menú, la barra de captura) cambia las zonas: se
// vuelve a medir sin esperar a que se mueva la vista (A23). Lo mismo al abrir el menú «Más» (abrirMas).
if ($("#paneles")) new MutationObserver((cambios) => {
  const vidrio = (n) => n.nodeType === 1 && (n.matches(".c8-vidrio") || !!n.querySelector(".c8-vidrio"));
  if (cambios.some((c) => [...c.addedNodes, ...c.removedNodes].some(vidrio))) luz.pendiente = true;
}).observe($("#paneles"), { childList: true, subtree: true });
/** Tras pintar: mide si hay un cambio pendiente o si la vista se movió y lleva quieta un momento. */
function quizaMedirLuz() {
  if (estado.modo !== "tour" || luz.leyendo || int.transicion || int.captura || transparenciaReducida()) return;
  const m = camara.matrixWorld.elements, v = luz.vista, ahora = performance.now();
  let quieta = Math.abs(camara.fov - v[16]) < 1e-3;
  for (let i = 0; i < 16; i++) { if (Math.abs(m[i] - v[i]) > 1e-4) quieta = false; v[i] = m[i]; }
  v[16] = camara.fov;
  if (!quieta) { luz.movida = true; luz.quietaDesde = ahora; }
  if (luz.pendiente || (luz.movida && ahora - luz.quietaDesde > 250 && ahora - luz.ultima > 1000)) {
    luz.pendiente = luz.movida = false;
    luz.ultima = ahora;
    medirEscena();
  }
}

// ------------------------------------------------------------------ interfaz del núcleo
function mostrarCarga(si, frac) {
  const c = $("#carga");
  c.hidden = !si;
  c.classList.toggle("determinado", frac != null);
  c.querySelector(".barra div").style.width = frac != null ? `${Math.round(frac * 100)}%` : "";
}
// Aviso flotante, dentro de la región viva fija #avisos (se anuncia al aparecer · A16). WCAG 2.2.1: con el foco o el
// puntero encima («Reintentar») no se va; al salir vuelve a contar (A17).
const avisoEl = $("#aviso");
let tAviso, msAviso = 4500;
const contarAviso = () => { clearTimeout(tAviso); tAviso = setTimeout(() => (avisoEl.hidden = true), msAviso); };
avisoEl.addEventListener("focusin", () => clearTimeout(tAviso));
avisoEl.addEventListener("pointerenter", () => clearTimeout(tAviso));
avisoEl.addEventListener("focusout", (e) => { if (!avisoEl.contains(e.relatedTarget) && !avisoEl.matches(":hover")) contarAviso(); });
avisoEl.addEventListener("pointerleave", () => { if (!avisoEl.contains(document.activeElement)) contarAviso(); });
function aviso(txt, ms = 4500, { reintentar } = {}) {
  avisoEl.replaceChildren(document.createTextNode(txt));
  if (reintentar) {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = tr("aviso.reintentar");
    b.onclick = () => { avisoEl.hidden = true; lienzo.focus({ preventScroll: true }); reintentar(); };
    avisoEl.append(" ", b);
  }
  avisoEl.hidden = false;
  msAviso = ms;
  contarAviso();
}
/** Imágenes del tour (logo, miniaturas, notas): las reglas comunes de util.js (http(s), blob: del mismo origen, data:image
    o rutas relativas; nunca otro esquema). Los enlaces usan urlSegura(u) a secas. */
const srcSegura = (u) => urlSegura(u, { imagen: true });
const escapar = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function elem(etiqueta, clase, txt) {
  const e = document.createElement(etiqueta);
  if (clase) e.className = clase;
  if (txt != null) e.textContent = txt;
  return e;
}
function boton(txt, clase) { const b = elem("button", clase, txt); b.type = "button"; return b; }

let origenFicha = null;
function mostrarFicha(p) {
  origenFicha = document.activeElement; // el «i» que la abre: al cerrar, el foco vuelve a él (A10)
  const f = $("#ficha");
  f.querySelector("h2").textContent = texto(p.titulo);
  f.querySelector("p").textContent = texto(p.texto);
  const media = f.querySelector(".media");
  media.replaceChildren();
  const img = srcSegura(p.imagen);
  if (img) { const i = new Image(); i.src = img; i.alt = texto(p.titulo); media.append(i); }
  for (const [u, txt] of [[p.video, `▶ ${tr("punto.video")}`], [p.enlace, `↗ ${tr("punto.mas_info")}`]]) {
    if (!urlSegura(u)) continue;
    const a = document.createElement("a");
    a.href = urlSegura(u); a.target = "_blank"; a.rel = "noopener"; a.textContent = txt;
    a.className = "c8-boton c8-boton--secundario c8-boton--s";
    media.append(a);
  }
  f.hidden = false;
  f.querySelector(".cerrar").focus({ preventScroll: true });
}
function ocultarFicha() { $("#ficha").hidden = true; }
/** Cierra la nota y devuelve el foco al «i» que la abrió; si ya no está (otra estancia), al lienzo. */
function cerrarFicha() {
  ocultarFicha();
  origenFicha?.focus?.({ preventScroll: true });
  if (document.activeElement !== origenFicha) lienzo.focus({ preventScroll: true });
}
$("#ficha .cerrar").onclick = cerrarFicha;
$("#ficha").addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); cerrarFicha(); } });

// ---- diálogos del núcleo (<dialog> modal: foco atrapado, Esc, por encima de todo, también en el móvil en horizontal)
// Contingencia: sin <dialog> (navegadores antiguos) se abren con el atributo open, sin velo.
const abierto = (d) => d.hasAttribute("open");
function abrirDialogo(d) {
  salirJuego();
  cerrarMas(false);
  if (abierto(d)) return;
  if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
}
function cerrarDialogo(d) {
  if (!abierto(d)) return;
  if (typeof d.close === "function") d.close(); else d.removeAttribute("open");
}
for (const d of document.querySelectorAll("#ayuda, #estancias-plano")) {
  d.querySelector(".cerrar-dlg").onclick = () => cerrarDialogo(d);
  d.addEventListener("click", (e) => { // clic en el velo, fuera de la ventana
    if (e.target !== d) return;
    const r = d.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) cerrarDialogo(d);
  });
}
// La misma tecla que lo abre lo cierra (M para «Estancias y plano», H para la ayuda), como en los videojuegos.
const teclaCierra = (d, tecla) => d.addEventListener("keydown", (e) => {
  if (letra(e) === tecla && !e.ctrlKey && !e.metaKey && !e.altKey && !e.target.closest("input, textarea, select")) { e.preventDefault(); cerrarDialogo(d); }
});
teclaCierra($("#estancias-plano"), "m");
teclaCierra($("#ayuda"), "h");

// ---- «Ayuda y controles»: solo lo que se puede usar aquí (modos disponibles, ratón o táctil); [tecla] → <kbd>
const hayEstiloYLuz = () => { const t = int.tour ?? {}; return (t.estilos?.length ?? 0) > 1 || (t.momentos?.length ?? 0) > 1 || !!(t.personalizacion?.paredes?.length || t.personalizacion?.suelos?.length); };
function alternarAyuda(si) {
  const a = $("#ayuda");
  if (si === undefined) si = !abierto(a);
  if (si) { renderAyuda(); abrirDialogo(a); } else cerrarDialogo(a);
}
function renderAyuda() {
  const a = $("#ayuda");
  a.querySelector("h2").textContent = tr("ayuda.titulo");
  a.querySelector(".cerrar-dlg").setAttribute("aria-label", tr("comun.cerrar"));
  const ms = int.tour ? modosDisponibles() : ["tour"];
  const r = conRaton, tour = ms.includes("tour"), libre = ms.includes("libre");
  const atajos = int.ajustes.atajos !== false, plano = hayPlano();
  const que = { x: tr(plano ? "ep.titulo" : "galeria.titulo") };
  const x = (k) => ({ x: tr(k) });
  const secciones = [];
  const moverte = [];
  if (tour) moverte.push(r ? "ayuda.ir_raton" : "ayuda.ir_tactil");
  if (tour && r) moverte.push("ayuda.wasd");
  if (libre) moverte.push(r ? "ayuda.libre_raton" : "ayuda.libre_tactil");
  if (ms.includes("maqueta")) moverte.push("ayuda.maqueta");
  secciones.push(["ayuda.sec_moverte", moverte]);
  const mirar = ["ayuda.mirar"];
  if (tour) mirar.push(r ? "ayuda.zoom_raton" : "ayuda.zoom_tactil");
  if (tour && r) mirar.push("ayuda.girar_teclas");
  if (listaMas().some((it) => ["giroscopio", "movil"].includes(it.icono))) mirar.push("ayuda.giroscopio"); // solo si está en «Más»
  secciones.push(["ayuda.sec_mirar", mirar]);
  if (r && !EMBED && renderer && (tour || libre)) {
    const wasd = atajos && int.ajustes.modoJuegoWASD !== false;
    secciones.push(["ayuda.sec_juego", [wasd ? "ayuda.juego_entrar" : "ayuda.juego_boton", "ayuda.juego_salir", ...(libre ? ["ayuda.juego_libre"] : [])]]);
  }
  secciones.push([plano ? "ayuda.sec_radar" : "ayuda.sec_estancias",
    [...(plano ? [r && atajos ? "ayuda.radar_raton" : "ayuda.radar_tactil"] : []), [r && atajos ? "ayuda.plano_raton" : "ayuda.plano_tactil", que]]]);
  if (!EMBED && $("#paneles [data-k='contactar']")) { // sin canal de contacto, los paneles no ofrecen «Contactar»
    secciones.push(["ayuda.sec_foto", [["ayuda.foto", x("contacto.hacer_foto")], ["ayuda.contactar", x("contacto.corto")]]]);
  }
  if (hayEstiloYLuz()) secciones.push(["ayuda.sec_estilo", [["ayuda.estilo", x("personalizar.titulo")], ["ayuda.antes_despues", x("comparar.titulo")]]]);
  if (r && atajos) secciones.push(["ayuda.sec_teclas", [["ayuda.teclas", que], ...(ms.length > 1 ? ["ayuda.tecla_modo"] : [])]]);
  const li = (k) => { const [c, v] = Array.isArray(k) ? k : [k]; return `<li>${escapar(tr(c, v)).replace(/\[([^\]]+)\]/g, "<kbd>$1</kbd>")}</li>`; };
  a.querySelector(".secciones").innerHTML = secciones.map(([s, ls]) => `<section><h3>${escapar(tr(s))}</h3><ul>${ls.map(li).join("")}</ul></section>`).join("");
}

// ---- iconos que el núcleo conoce por su nombre (menú «Más»)
const NS_SVG = "http://www.w3.org/2000/svg";
const ICONOS = {
  compartir: '<path d="M12 15V4"/><path d="m8 8 4-4 4 4"/><path d="M6 12v6.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V12"/>',
  idioma: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  ajustes: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  guiada: '<path d="M8 5.5v13l10.5-6.5z"/>',
  medir: '<path d="M3.5 15.5 15.5 3.5l5 5-12 12z"/><path d="m7 12 2 2M10 9l2 2M13 6l2 2"/>',
  pantalla: '<path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15"/>',
  giroscopio: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M3 9a10 10 0 0 0 0 6M21 9a10 10 0 0 1 0 6"/>',
  plano: '<path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z"/><path d="M9 4v13.5M15 6.5V20"/>',
  camara: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.4-2h6.2l1.4 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.5"/>',
  estilo: '<path d="M14.5 4.5 19.5 9.5 11 18l-5-5z"/><path d="M6 13c-2 1-2.5 3-2.5 6.5C7 19.5 9 19 10 17"/>',
  ayuda: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6M12 17h.01"/>',
  acercar: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M7.5 10.5h6M10.5 7.5v6"/>',
  alejar: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M7.5 10.5h6"/>',
  ok: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
};
const ALIAS_ICONOS = { globo: "idioma", play: "guiada", regla: "medir", pincel: "estilo", foto: "camara", mapa: "plano", estancias: "plano", movil: "giroscopio" };
/** Icono por nombre o SVG en texto (de los paneles; se descarta si trae scripts o manejadores). */
function iconoSVG(icono) {
  let svg = null;
  if (typeof icono === "string" && /^\s*<svg[\s>]/i.test(icono)) {
    try {
      const r = new DOMParser().parseFromString(icono, "image/svg+xml").documentElement;
      const malo = r.nodeName !== "svg" || r.querySelector("script, foreignObject, parsererror")
        || [r, ...r.querySelectorAll("*")].some((n) => [...n.attributes].some((a) => /^on/i.test(a.name) || /javascript:/i.test(a.value)));
      if (!malo) svg = document.importNode(r, true);
    } catch { /* icono no válido: el elemento se queda sin icono */ }
  } else if (ICONOS[ALIAS_ICONOS[icono] ?? icono]) {
    svg = document.createElementNS(NS_SVG, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.innerHTML = ICONOS[ALIAS_ICONOS[icono] ?? icono];
  }
  if (svg) { svg.setAttribute("class", "c8-icono"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false"); }
  return svg;
}

// ---- barra de vista: Radar · Modo juego · Música · Ayuda · Pantalla completa · Más
$("#btn-radar").onclick = () => alternarRadar();
$("#btn-ayuda").onclick = () => alternarAyuda();
$("#btn-juego").onclick = () => capturarRaton();
function pintarJuego() {
  const b = $("#btn-juego");
  b.hidden = !(conRaton && !EMBED && renderer && estado.modo !== "maqueta");
  b.setAttribute("aria-label", tr("juego.titulo"));
  b.title = tr("juego.ayuda");
}
const enPantallaCompleta = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function alternarPantalla() {
  const raiz = document.documentElement;
  try {
    if (enPantallaCompleta()) (document.exitFullscreen ?? document.webkitExitFullscreen)?.call(document);
    else (raiz.requestFullscreen ?? raiz.webkitRequestFullscreen)?.call(raiz)?.catch?.(() => {});
  } catch { /* el navegador no la permite: no pasa nada */ }
}
$("#btn-pantalla").hidden = !API_PANTALLA || EMBED; // N13: en el iPhone no existe para las páginas
$("#btn-pantalla").onclick = alternarPantalla;
for (const ev of ["fullscreenchange", "webkitfullscreenchange"]) document.addEventListener(ev, () => $("#btn-pantalla").setAttribute("aria-pressed", String(enPantallaCompleta())));

// ---- menú «Más»: lo pinta el núcleo; los paneles aportan los elementos (visor.mas.agregar / quitar)
const itemsMas = new Map();
let nMas = 0;
const DONDE = { siempre: () => true, movil: () => MQ_MOVIL.matches, escritorio: () => !MQ_MOVIL.matches };
const evaluar = (v) => { try { return typeof v === "function" ? v() : v; } catch { return undefined; } };
function listaMas() {
  const vistos = new Set();
  return [...itemsMas.values()]
    .filter((it) => (typeof it.donde === "function" ? !!evaluar(it.donde) : (DONDE[it.donde] ?? DONDE.siempre)()))
    .sort((a, b) => a.orden - b.orden || a.n - b.n)
    .filter((it) => { const t = String(evaluar(it.texto) ?? "").trim(); if (!t || vistos.has(t.toLowerCase())) return false; vistos.add(t.toLowerCase()); return true; });
}
function agregarMas({ id, texto: txt, icono, accion, orden = 50, donde = "siempre", marcado } = {}) {
  if (id == null || typeof accion !== "function") return false;
  const previo = itemsMas.get(String(id));
  itemsMas.set(String(id), { id: String(id), texto: txt, icono, accion, orden: Number.isFinite(+orden) ? +orden : 50, donde, marcado, n: previo?.n ?? nMas++ });
  actualizarBtnMas();
  return true;
}
function quitarMas(id) { const ok = itemsMas.delete(String(id)); actualizarBtnMas(); return ok; }
// WCAG 2.5.1: en táctil el zoom no depende solo del pellizco: «Acercar» y «Alejar» en «Más» (recorrido y maqueta)
if (esTactil) {
  const conZoom = () => estado.modo === "tour" || estado.modo === "maqueta";
  const zoom = (si) => () => { if (estado.modo === "maqueta") maqueta?.acercar(si); else fijarZoom(int.zoom * (si ? 0.8 : 1.25)); };
  agregarMas({ id: "zoom-acercar", texto: () => tr("comun.acercar"), icono: "acercar", accion: zoom(true), orden: 25, donde: conZoom });
  agregarMas({ id: "zoom-alejar", texto: () => tr("comun.alejar"), icono: "alejar", accion: zoom(false), orden: 26, donde: conZoom });
}
function actualizarBtnMas() {
  const b = $("#btn-mas");
  b.hidden = !listaMas().length; // sin elementos, sin botón
  b.setAttribute("aria-label", tr("mas.titulo"));
  b.title = tr("mas.titulo");
  if (b.hidden) cerrarMas(false);
  else if (!$("#menu-mas").hidden) { pintarMas(); colocarMas(); }
}
function pintarMas() {
  const menu = $("#menu-mas");
  const foco = document.activeElement?.closest?.("#menu-mas button")?.dataset.id;
  menu.replaceChildren(...listaMas().map((it) => {
    const b = boton(null, "");
    b.tabIndex = -1;
    b.dataset.id = it.id;
    const marcado = typeof it.marcado === "function" ? evaluar(it.marcado) : undefined;
    b.setAttribute("role", marcado === undefined ? "menuitem" : "menuitemcheckbox");
    if (marcado !== undefined) b.setAttribute("aria-checked", String(!!marcado));
    const ic = iconoSVG(it.icono);
    if (ic) b.append(ic);
    b.append(elem("span", "", String(evaluar(it.texto))));
    if (marcado !== undefined) { const ok = iconoSVG("ok"); ok.classList.add("marca-ok"); b.append(ok); }
    b.onclick = () => { cerrarMas(); try { it.accion({ origen: $("#btn-mas") }); } catch (e) { console.error(e); } };
    return b;
  }));
  if (foco) menu.querySelector(`[data-id="${CSS.escape(foco)}"]`)?.focus({ preventScroll: true });
}
function colocarMas() {
  const menu = $("#menu-mas"), r = $("#btn-mas").getBoundingClientRect();
  const abajo = innerHeight - r.bottom - 16, arriba = r.top - 16;
  menu.style.right = `${Math.max(8, innerWidth - r.right)}px`;
  const debajo = abajo >= Math.min(menu.scrollHeight, 260) || abajo >= arriba;
  menu.style.top = debajo ? `${r.bottom + 8}px` : "auto";
  menu.style.bottom = debajo ? "auto" : `${innerHeight - r.top + 8}px`;
  menu.style.maxHeight = `${Math.max(120, debajo ? abajo : arriba)}px`;
}
function abrirMas() {
  if (!listaMas().length) return;
  salirJuego();
  pintarMas();
  const menu = $("#menu-mas");
  menu.hidden = false;
  colocarMas();
  luz.pendiente = true; // el menú es vidrio sobre la foto (A23)
  $("#btn-mas").setAttribute("aria-expanded", "true");
  menu.querySelector("button")?.focus({ preventScroll: true });
}
function cerrarMas(devolverFoco = true) {
  const menu = $("#menu-mas");
  if (menu.hidden) return;
  const dentro = menu.contains(document.activeElement);
  menu.hidden = true;
  $("#btn-mas").setAttribute("aria-expanded", "false");
  if (dentro && devolverFoco) $("#btn-mas").focus({ preventScroll: true });
}
$("#btn-mas").addEventListener("click", () => ($("#menu-mas").hidden ? abrirMas() : cerrarMas()));
$("#btn-mas").addEventListener("keydown", (e) => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); abrirMas(); } });
$("#menu-mas").addEventListener("keydown", (e) => {
  const items = [...e.currentTarget.querySelectorAll("button")];
  const i = items.indexOf(document.activeElement);
  const ir = (j) => items[(j + items.length) % items.length]?.focus();
  if (e.key === "ArrowDown") { e.preventDefault(); ir(i + 1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); ir(i - 1); }
  else if (e.key === "Home") { e.preventDefault(); ir(0); }
  else if (e.key === "End") { e.preventDefault(); ir(items.length - 1); }
  else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cerrarMas(); }
  else if (e.key === "Tab") cerrarMas(false);
});
addEventListener("pointerdown", (e) => { if (!$("#menu-mas").hidden && !e.target.closest?.("#menu-mas, #btn-mas")) cerrarMas(false); }, true);
// Los elementos los aportan los paneles (contrato §3.3), también «Pantalla completa» en el teléfono (el núcleo la quita
// de su barra con CSS) y «Mirar moviendo el móvil» (visor.giroscopio). Sin elementos, el botón «Más» no se ve.

// ---- «Estancias y plano»: plano grande (norte arriba, pestañas de planta), visita guiada y estancias por zonas o plantas
/** Grupos de estancias: por zonas (tour.secciones, con ids de fotos o de estancias del plano), si no por plantas (2 o más). */
function gruposEstancias() {
  const t = int.tour, nodos = [...int.nodos.values()], grupos = [];
  if (t.secciones?.length) {
    const usados = new Set();
    for (const s of t.secciones) {
      const ids = new Set(Array.isArray(s.estancias) ? s.estancias : []);
      const pols = (t.estancias ?? []).filter((e) => ids.has(e.id) && e.poligono?.length > 2);
      const lista = nodos.filter((n) => !usados.has(n) && (ids.has(n.id) || pols.some((e) => e.planta === n.planta && puntoEnPoligono([n.x, n.z], e.poligono))));
      lista.forEach((n) => usados.add(n));
      if (lista.length) grupos.push({ nombre: texto(s.nombre) || String(s.id ?? ""), nodos: lista });
    }
    const resto = nodos.filter((n) => !usados.has(n));
    if (resto.length) grupos.push({ nombre: grupos.length ? tr("contacto.zona_otras") : "", nodos: resto });
  } else if ((t.plantas?.length ?? 0) > 1) {
    for (const p of t.plantas) {
      const lista = nodos.filter((n) => n.planta === p.id);
      if (lista.length) grupos.push({ nombre: texto(p.nombre) || p.id, nodos: lista });
    }
  }
  if (!grupos.length && nodos.length) grupos.push({ nombre: "", nodos });
  return grupos;
}
const hayVisitaGuiada = () => !!renderer && !!int.tour && ((int.tour.guion?.length ?? 0) >= 2 || int.nodos.size >= 3);
function miniaturaDe(n, clase) {
  const src = srcSegura(n.miniatura);
  if (!src) return elem("span", clase);
  const img = new Image();
  img.className = clase; img.src = src; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
  return img;
}
async function irDesdeLista(n) {
  cerrarDialogo($("#estancias-plano"));
  if (estado.modo !== "tour") await cambiarModo("tour");
  irA(n);
}
function pintarEstanciasPlano() {
  const d = $("#estancias-plano");
  const conPlano = hayPlano();
  d.classList.toggle("sin-plano", !conPlano);
  d.querySelector("#ep-titulo").textContent = tr(conPlano ? "ep.titulo" : "galeria.titulo");
  d.querySelector(".cerrar-dlg").setAttribute("aria-label", tr("comun.cerrar"));
  d.querySelector(".ep-plano").hidden = !conPlano;
  const ps = int.tour.plantas ?? [];
  const pestanas = d.querySelector(".ep-plantas");
  pestanas.hidden = !conPlano || ps.length < 2;
  pestanas.setAttribute("aria-label", tr("plantas.titulo"));
  pestanas.replaceChildren(...(pestanas.hidden ? [] : ps.map((p) => {
    const b = boton(texto(p.nombre) || p.id, "c8-boton c8-boton--s");
    b.setAttribute("aria-pressed", String(p.id === int.plantaVista));
    b.onclick = () => {
      int.plantaVista = p.id;
      pestanas.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      planoGrande.dibujar();
    };
    return b;
  })));
  const guiada = d.querySelector(".ep-guiada");
  guiada.hidden = !hayVisitaGuiada();
  guiada.querySelector("span").textContent = tr("guion.iniciar");
  d.querySelector(".ep-grupos").replaceChildren(...gruposEstancias().flatMap((g) => {
    const ul = elem("ul");
    ul.append(...g.nodos.map((n) => {
      const b = boton(null, "ep-estancia");
      b.dataset.id = n.id;
      b.setAttribute("aria-current", String(n.id === estado.nodo));
      const est = estanciaDe(n);
      b.append(miniaturaDe(n, "mini"), elem("span", "nombre", texto(n.nombre)), elem("span", "m2", est ? m2Corto(areaPoligono(est.poligono)) : ""));
      b.onclick = () => irDesdeLista(n);
      const li = elem("li");
      li.append(b);
      return li;
    }));
    return g.nombre ? [elem("h3", "", g.nombre), ul] : [ul];
  }));
}
/** Abre (true), cierra (false) o alterna «Estancias y plano». Devuelve si queda abierto. */
function estanciasPlano(abrir) {
  const d = $("#estancias-plano");
  if (abrir === undefined) abrir = !abierto(d);
  if (!int.tour || !!abrir === abierto(d)) return abierto(d);
  if (abrir) {
    int.plantaVista = estado.planta;
    pintarEstanciasPlano();
    abrirDialogo(d);
    $("#lugar").setAttribute("aria-expanded", "true");
    d.querySelector('.ep-estancia[aria-current="true"]')?.focus();
    requestAnimationFrame(() => planoGrande.dibujar());
  } else cerrarDialogo(d);
  return abierto(d);
}
$("#estancias-plano").addEventListener("close", () => $("#lugar").setAttribute("aria-expanded", "false"));
$("#estancias-plano .ep-guiada").onclick = () => { cerrarDialogo($("#estancias-plano")); guion.iniciar(); };
$("#lugar").onclick = () => estanciasPlano(true);
$("#btn-ampliar").onclick = () => estanciasPlano(true);
function actualizarLugar() {
  const l = $("#lugar");
  const que = tr(hayPlano() ? "ep.titulo" : "galeria.titulo");
  // El nombre es lo que se ve (logo, título y estancia) y, oculto, lo que abre: el control por voz lo encuentra (A13)
  $("#lugar-abre").textContent = ` · ${que}`;
  l.title = `${tr("ep.abrir")}${conRaton ? " (M)" : ""}`;
  const a = $("#btn-ampliar");
  a.setAttribute("aria-label", que);
  a.title = a.getAttribute("aria-label");
}

// ---- tira de estancias (escritorio y tablet): agrupada por zonas o plantas, con su nombre y un separador
function construirGaleria() {
  const g = $("#galeria");
  g.setAttribute("aria-label", tr("galeria.titulo"));
  const grupos = gruposEstancias();
  const varios = grupos.length > 1;
  const piezas = [];
  if (hayVisitaGuiada()) { // solo se ve en vertical (tablet): en escritorio la visita guiada está entre las acciones de los paneles
    const b = boton(null, "c8-boton c8-boton--secundario c8-boton--s guiada");
    b.append(iconoSVG("guiada"), elem("span", "", tr("guion.iniciar")));
    b.onclick = () => guion.iniciar();
    piezas.push(b);
  }
  grupos.forEach((gr, i) => {
    if (i) piezas.push(elem("span", "sep"));
    const cont = elem("div", varios && gr.nombre ? "grupo con-nombre" : "grupo");
    if (varios && gr.nombre) {
      cont.setAttribute("role", "group");
      cont.setAttribute("aria-label", gr.nombre);
      const nombre = elem("span", "grupo-nombre", gr.nombre);
      nombre.setAttribute("aria-hidden", "true");
      cont.append(nombre);
    }
    cont.append(...gr.nodos.map((n) => {
      const b = boton(null, "estancia");
      b.dataset.id = n.id;
      b.title = texto(n.nombre);
      b.setAttribute("aria-label", tr("nav.ir_a", { x: texto(n.nombre) }));
      b.setAttribute("aria-current", String(n.id === estado.nodo));
      if (srcSegura(n.miniatura)) b.append(miniaturaDe(n, ""));
      b.append(elem("span", "", texto(n.nombre)));
      b.onclick = async () => { if (estado.modo !== "tour") await cambiarModo("tour"); irA(n); };
      return b;
    }));
    piezas.push(cont);
  });
  g.replaceChildren(...piezas);
  medirTira();
}
/** Alto de la tira para colocar encima los modos, los subtítulos y las notas (0 si no se ve). */
function medirTira() {
  requestAnimationFrame(() => {
    const g = $("#galeria");
    const h = g.getClientRects().length && getComputedStyle(g).display !== "none" ? Math.round(g.offsetHeight + 8) : 0;
    document.documentElement.style.setProperty("--alto-tira", `${h}px`);
  });
}

// Pistas de primer uso (se recuerdan en localStorage)
const pistasVistas = new Set(almacen.leer("visor:pistas", []));
/** Textos centrados en dos líneas (pistas, tarjeta del paseo libre, subtítulos): «·» no empieza una línea, «W A S D» no
    se parte y un número no se separa de su unidad («30 m²», «2 hab.», «349.000 €»): espacios de no separación. */
function sinCortes(t) {
  return String(t).replace(/ · /g, "\u00A0· ").replace(/\b([A-Z]) (?=[A-Z]\b)/g, "$1\u00A0")
    .replace(/(\d) (?=(?:m²|m2|m|cm|km|ha|€|%|hab\.?|h|min)(?![\p{L}\d]))/gu, "$1\u00A0");
}
function mostrarPista(id, txt) {
  if (pistasVistas.has(id) || EMBED || int.portada) return;
  const p = $("#pista");
  p.textContent = sinCortes(txt);
  p.dataset.id = id;
  p.hidden = false;
  setTimeout(() => ocultarPista(id), 6000);
}
function ocultarPista(id) {
  const p = $("#pista");
  if (p.dataset.id !== id) return;
  p.hidden = true;
  pistasVistas.add(id);
  almacen.guardar("visor:pistas", [...pistasVistas]);
}
/** Paseo libre: con ratón, la tarjeta «Haz clic para caminar»; en táctil, la pista del joystick. */
function ayudaLibre() { if (conRaton) tarjetaJuego(true); else mostrarPista("libre", tr("aviso.libre_tactil")); }
function pistaInicial() {
  if (!renderer) return;
  if (estado.modo === "libre") ayudaLibre();
  // sin estancias a las que ir desde aquí (una sola foto), solo «Arrastra para mirar» (M11)
  else if (estado.modo === "tour") mostrarPista("inicio", tr(!int.actual?.vecinos.length ? "aviso.arrastra" : conRaton ? "pista.raton" : "pista.tactil"));
}

function modosDisponibles() {
  const ms = [];
  if (int.nodos.size) ms.push("tour");
  if (int.tour.libre) ms.push("libre");
  if (maqueta?.disponible() || ["demo", "glb"].includes(int.tour.libre?.tipo)) ms.push("maqueta"); // N4: solo con muros o modelo
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
  if (modo === "maqueta" && maqueta) {
    try { await maqueta.prepararControles(); } catch (e) { aviso(e.message, 6000); return; }
    if (int.modoPedido !== modo) return;
  }
  $("#pista").hidden = true;
  tarjetaJuego(false);
  if (modo === "libre") {
    if (int.actual && !int.tour.libre.inicio && !int.libre.visitado) {
      int.libre.pos.x = int.actual.x; int.libre.pos.z = int.actual.z; int.libre.rumbo = estado.rumbo;
    }
    int.libre.visitado = true;
  } else if (modo === "maqueta") salirJuego();
  if (estado.midiendo && modo === "maqueta") visor.medir(false);
  if (guion.activo && modo !== "tour") guion.parar();
  const anterior = estado.modo;
  estado.modo = modo;
  tocarEscena();
  if (modo === "tour") luz.pendiente = true; else quitarLuz(); // la luz se mide en la foto 360
  maqueta?.activar(modo === "maqueta");
  if (anterior === "maqueta" && pisoDemo) aplicarAmbienteLibre();
  document.body.classList.toggle("modo-libre", modo === "libre");
  document.body.classList.toggle("modo-maqueta", modo === "maqueta");
  marcarModo();
  etiquetas.hidden = modo !== "tour";
  cortinilla.hidden = !(estado.comparar && modo === "tour");
  actualizarSello();
  aplicarRadar();
  pintarJuego();
  actualizarBtnMas();
  medirTira();
  if (modo === "libre" && !int.portada) ayudaLibre();
  camara.position.set(0, 0, 0);
  camara.fov = int.fovBase * (modo === "tour" ? int.zoom : 1);
  camara.updateProjectionMatrix();
  dibujarMapa();
  visor.emitir("modo", { modo });
}

/** «Recorrido · Paseo libre · Maqueta» (solo con 2 modos o más; los nombres largos, en aria-label). */
function construirModos() {
  const ms = modosDisponibles();
  const g = $("#modos");
  g.hidden = ms.length < 2;
  g.setAttribute("aria-label", tr("modo.titulo"));
  g.replaceChildren(...ms.map((m) => {
    const l = elem("label");
    const r = document.createElement("input");
    r.type = "radio"; r.name = "modo"; r.value = m; r.checked = m === estado.modo;
    r.setAttribute("aria-label", tr(`modo.${m}`));
    const corto = elem("span", "", tr(`modo.${m}_corto`));
    corto.setAttribute("aria-hidden", "true"); // ya está en el nombre largo: el lector no lo repite (A18)
    l.append(r, corto);
    return l;
  }));
  window.cre8Tema?.segmentados?.(g);
}
function marcarModo() {
  for (const r of document.querySelectorAll("#modos input")) r.checked = r.value === estado.modo;
  window.cre8Tema?.segmentados?.($("#modos"));
}
$("#modos").addEventListener("change", (e) => { if (e.target.name === "modo") cambiarModo(e.target.value).finally(marcarModo); });

/** Relleno del acento con el color de marca y su texto (M5). El relleno se acota por tema para que se vea sobre el vidrio:
    en claro, como mucho Y = 0,55 (un blanco de marca queda gris); en oscuro, como poco Y = 0,06 (el negro o el azul marino
    se aclaran). Se escala en luz lineal, que conserva el tono (ningún canal pasa de 1: el azul pesa 0,0722 en Y); el negro,
    que no se puede escalar, pasa a gris. Encima, texto oscuro o blanco, el que más contraste dé (WCAG). Siempre un hex
    normal, que leen los lienzos (plano, radar) y las flechas del suelo. → { relleno: "#rrggbb", sobre } o null. */
function acentoDeMarca(hex, oscuro) {
  let c = hexALineal(hex);
  if (!c) return null;
  let Y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const tope = oscuro ? 0.06 : 0.55;
  if (oscuro ? Y < tope : Y > tope) { c = Y ? c.map((v) => (v * tope) / Y) : [tope, tope, tope]; Y = tope; }
  const srgb = (v) => Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)).toString(16).padStart(2, "0");
  return { relleno: `#${c.map(srgb).join("")}`, sobre: (Y + 0.05) / 0.05 >= 1.05 / (Y + 0.05) ? "#15110a" : "#ffffff" };
}
/** El color de marca del tour en el acento, con el relleno del tema vigente (se repite con «cre8:tema»). Sin marca, o al
    cambiar a un tour sin ella (Estudio), se quita y vuelve el champán de tema.css. */
function pintarAcento() {
  const raiz = document.documentElement.style;
  const a = acentoDeMarca(int.tour?.marca?.color, document.documentElement.dataset.tema !== "claro");
  if (a) { raiz.setProperty("--c-acento", a.relleno); raiz.setProperty("--c-sobre-acento", a.sobre); }
  else for (const v of ["--c-acento", "--c-sobre-acento"]) raiz.removeProperty(v);
  colorearTema();
  radar.retema(); planoGrande.retema(); // el radar y el plano releen el acento en el próximo dibujo
}

function aplicarMarca() {
  const m = int.tour.marca ?? {};
  pintarAcento();
  const logo = $("#logo"), src = srcSegura(m.logo);
  logo.onerror = () => { logo.hidden = true; };
  if (src) { logo.src = src; logo.alt = texto(m.nombre); logo.hidden = false; } else { logo.removeAttribute("src"); logo.hidden = true; }
  const titulo = texto(int.tour.titulo) || tr("titulo.defecto");
  $("#titulo").textContent = titulo;
  $("#titulo-recorrido").textContent = titulo; // h1 oculto: el lector salta a él con «encabezados» (A18)
  document.title = `${titulo} · ${texto(m.nombre) || "cre8eight"}`;
}

// ------------------------------------------------------------------ portada (N-7/N-8)
// Mientras carga: agencia, inmueble, precio y 3 datos sobre la estancia inicial difuminada, con el progreso real.
// Lista: «Empezar visita» (su toque es el gesto que deja sonar la música), «▶ Visita guiada» e idiomas.
// Sin portada con ?embed; tour.portada === false entra directo (alternativa G de la ronda 2).
const portada = $("#portada");
if (portada) {
  document.body.classList.add("con-portada");
  for (const hijo of $("#app").children) if (hijo !== portada) hijo.inert = true; // el teclado no llega a lo de detrás
  portada.querySelector(".empezar").onclick = () => empezar();
  portada.querySelector(".guiada").onclick = () => empezar({ guiada: true });
}
function progresoPortada(f) {
  const v = Math.round(THREE.MathUtils.clamp(f, 0, 1) * 100);
  if (!portada || v <= int.progreso) return; // nunca retrocede
  int.progreso = v;
  portada.querySelector(".progreso div").style.width = `${v}%`;
  portada.querySelector(".progreso").setAttribute("aria-valuenow", String(v));
}
function precioPortada(i) {
  let n = i.precio;
  if (typeof n === "string") n = Number(n.replace(/[^\d,.]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
  if (!(n > 0)) return "";
  let s;
  try { s = new Intl.NumberFormat(localeActual(), { style: "currency", currency: i.moneda || "EUR", maximumFractionDigits: 0, useGrouping: "always" }).format(n); }
  catch { s = `${Math.round(n).toLocaleString()} €`; }
  return s + (i.operacion === "alquiler" ? tr("ficha.mes") : "");
}
/** «3 habitaciones · 2 baños · 112 m²». Vacío si el título ya dice la superficie, como el automático del Estudio («Piso en
    venta · 3 hab. · 112 m²»): la portada no repite los datos (M12). Se comparan las cifras: vale «1.200 m²» o «1 200 m2». */
function datosPortada(i, titulo = "") {
  const n = (v) => (Number(v) > 0 ? Number(v) : 0);
  const min = (s) => (estado.idioma === "de" ? s : s.toLowerCase()); // en alemán los sustantivos van en mayúscula
  const sup = n(i.superficie_construida) || n(i.superficie_util), cifras = (x) => String(x).replace(/\D/g, "");
  if (sup && [...titulo.matchAll(/(\d+(?:[.,\u00a0\u202f ]\d+)*)\s?m[²2]/g)].some(([, x]) => cifras(x) === cifras(+sup.toFixed(1)))) return "";
  const partes = [];
  if (n(i.habitaciones)) partes.push(`${n(i.habitaciones)} ${min(tr(n(i.habitaciones) === 1 ? "ficha.habitacion" : "ficha.habitaciones"))}`);
  if (n(i.banos)) partes.push(`${n(i.banos)} ${min(tr(n(i.banos) === 1 ? "ficha.bano" : "ficha.banos"))}`);
  if (sup) partes.push(m2Corto(sup));
  return partes.join(" · ");
}
/** Fondo: la miniatura de la estancia inicial mientras carga y, al terminar, la propia vista (vale también para la demo). */
function fondoPortada(fuente) {
  const c = portada?.querySelector(".fondo");
  const w = fuente?.naturalWidth || fuente?.width, h = fuente?.naturalHeight || fuente?.height;
  if (!c || !w || !h) return;
  c.width = 320; c.height = Math.max(1, Math.round((320 * h) / w));
  try { c.getContext("2d").drawImage(fuente, 0, 0, c.width, c.height); c.classList.add("visible"); } catch { return; /* sin fondo */ }
  if (transparenciaReducida()) return;
  if (fuente === lienzo) medirEscena(); else medirImagen(c);
}
function fondoMiniatura(n) {
  const src = n && srcSegura(n.miniatura);
  if (!src || !portada) return;
  const img = new Image();
  img.decoding = "async";
  img.onload = () => { if (int.portada && !portada.classList.contains("lista")) fondoPortada(img); };
  img.src = src;
}
function rellenarPortada() {
  if (!portada?.isConnected || !int.tour) return;
  const t = int.tour, m = t.marca ?? {}, i = t.inmueble ?? {};
  const marca = portada.querySelector(".marca"), logo = marca.querySelector("img"), src = srcSegura(m.logo);
  logo.onerror = () => { logo.hidden = true; };
  if (src && logo.getAttribute("src") !== src) logo.src = src;
  logo.hidden = !src;
  marca.querySelector(".nombre").textContent = texto(m.nombre);
  marca.hidden = !src && !texto(m.nombre);
  const titulo = texto(t.titulo);
  portada.querySelector(".titulo").textContent = titulo;
  for (const [sel, txt] of [[".precio", precioPortada(i)], [".datos", datosPortada(i, titulo)]]) {
    const p = portada.querySelector(sel);
    p.textContent = txt;
    p.hidden = !txt;
  }
  portada.setAttribute("aria-label", titulo || tr("titulo.defecto"));
  portada.querySelector(".progreso").setAttribute("aria-label", tr("portada.cargando"));
  portada.querySelector(".empezar").textContent = tr("portada.empezar");
  portada.querySelector(".guiada span").textContent = tr("guion.iniciar");
  portada.querySelector(".guiada").hidden = !hayVisitaGuiada();
  const [antes, despues = ""] = tr("marca.creado_con", { x: "\u0001" }).split("\u0001");
  portada.querySelector(".credito").replaceChildren(antes, elem("b", "", "cre8eight"), despues);
  // Idiomas (con 2 o más que el visor sepa mostrar)
  const cont = portada.querySelector(".idiomas");
  const idiomas = [...new Set(t.idiomas ?? [])].filter((c) => i18n?.diccionario?.[c]);
  const foco = document.activeElement?.closest?.(".idiomas button")?.lang;
  cont.hidden = idiomas.length < 2;
  cont.setAttribute("aria-label", tr("idioma.titulo"));
  cont.replaceChildren(...(cont.hidden ? [] : idiomas.map((c) => {
    const b = boton(c.toUpperCase(), "c8-boton c8-boton--s c8-boton--fantasma");
    b.lang = c;
    b.setAttribute("aria-label", i18n?.nombreIdioma?.(c) ?? c);
    b.setAttribute("aria-pressed", String(c === estado.idioma));
    b.onclick = () => visor.idioma(c);
    return b;
  })));
  if (foco) cont.querySelector(`[lang="${CSS.escape(foco)}"]`)?.focus({ preventScroll: true });
}
function portadaLista() {
  if (!int.portada || !portada) return;
  if (renderer && int.actual) precompilar();
  if (int.tour?.portada === false) { empezar({ automatica: true }); return; }
  if (renderer && int.actual) { renderizar(); fondoPortada(lienzo); }
  progresoPortada(1);
  rellenarPortada();
  portada.classList.add("lista");
  portada.removeAttribute("aria-busy");
  portada.querySelector(".acciones").hidden = false;
  portada.querySelector(".empezar").focus({ preventScroll: true });
}
/** Quita la portada (con fundido o, si falla la carga, de golpe) y devuelve el teclado a la escena. */
function soltarPortada(animar = true) {
  if (!int.portada) return false;
  int.portada = false;
  luz.pendiente = true;
  tocarEscena();
  document.body.classList.remove("con-portada");
  for (const hijo of $("#app").children) hijo.inert = false;
  if (portada) {
    portada.inert = true;
    if (animar) { portada.classList.add("fuera"); setTimeout(() => portada.remove(), 700); } else portada.remove();
  }
  return true;
}
/** Cierra la portada y empieza la visita (o la visita guiada). Devuelve false si no había portada. */
function empezar({ guiada = false, automatica = false } = {}) {
  if (!soltarPortada()) return false;
  // El toque en «Empezar visita» es el gesto del usuario que permite arrancar la música.
  if (!automatica && sonido.el && sonido.activo && int.tour?.audio?.musica?.autoplay !== false) arrancarSonido();
  if (guiada && hayVisitaGuiada()) guion.iniciar();
  else pistaInicial();
  visor.emitir("empezar", { guiada: !!guiada, automatica: !!automatica });
  return true;
}

function refrescarTextos() {
  aplicarMarca();
  construirModos();
  construirGaleria();
  if (int.actual) { construirPuntos(); anunciarEstancia(int.actual); } else actualizarLugar();
  maqueta?.reiniciar();
  if (estado.modo === "maqueta") maqueta.activar(true);
  medicion?.refrescarTextos();
  $("#barra-vista").setAttribute("aria-label", tr("vista.titulo"));
  $("#btn-ayuda").setAttribute("aria-label", tr("ayuda.titulo"));
  $("#btn-ayuda").title = `${tr("ayuda.titulo")}${conRaton ? " (H)" : ""}`;
  $("#btn-pantalla").setAttribute("aria-label", tr("comun.pantalla_completa"));
  $("#btn-pantalla").title = tr("comun.pantalla_completa");
  aplicarRadar();
  pintarJuego();
  pintarSonido();
  actualizarBtnMas();
  $("#aviso-juego").textContent = tr("juego.aviso");
  if (!$("#tarjeta-juego").hidden) $("#tarjeta-juego").textContent = sinCortes(tr("juego.tarjeta"));
  // N-14: el precio, discreto, bajo el radar mientras dura el modo juego (los paneles se ocultan)
  const precio = int.tour.inmueble ? precioPortada(int.tour.inmueble) : "";
  $("#precio-juego").textContent = precio;
  $("#precio-juego").hidden = !precio;
  $("#ficha .cerrar").setAttribute("aria-label", tr("comun.cerrar"));
  lienzo.setAttribute("aria-label", `${texto(int.tour.titulo) || tr("titulo.defecto")} · ${tr("aviso.arrastra")}`);
  cortinilla.dataset.antes = tr("comparar.antes");
  cortinilla.dataset.despues = tr("comparar.despues");
  barraGuion.querySelector(".pausa").setAttribute("aria-label", tr(guion.pausado ? "guion.reanudar" : "guion.pausar"));
  barraGuion.querySelector(".parar").setAttribute("aria-label", tr("guion.parar"));
  barraGuion.setAttribute("aria-label", tr("guion.iniciar"));
  if (abierto($("#ayuda"))) renderAyuda();
  if (abierto($("#estancias-plano"))) pintarEstanciasPlano();
  rellenarPortada();
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
    tocarEscena();
    estado.pintura = { paredes, suelos };
    const p = hexALineal(paredes), s = hexALineal(suelos);
    U.activaPared.value = p ? 1 : 0; U.activaSuelo.value = s ? 1 : 0;
    if (p) U.pinturaPared.value.set(...p);
    if (s) U.pinturaSuelo.value.set(...s);
    aplicarAmbienteLibre();
    visor.emitir("pintura", { ...estado.pintura });
  },
  comparar(si) {
    tocarEscena();
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
    tocarEscena(); // al cerrar, las marcas de la medición desaparecen
    medirTira();
    if (si) {
      $("#pista").hidden = true;
      tarjetaJuego(false);
      salirJuego();
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
    const { reducirMovimiento, ...resto } = obj ?? {};
    // Alias de la fase 3: el movimiento lo guarda tema.js (una sola fuente de verdad para el visor, el Estudio y la Guía).
    if (reducirMovimiento !== undefined) {
      if (window.cre8Tema?.fijar) window.cre8Tema.fijar("movimiento", reducirMovimiento ? "reducido" : "auto");
      else movimientoSinTema = !!reducirMovimiento;
    }
    Object.assign(int.ajustes, resto);
    // Solo se guardan las preferencias que el usuario ha cambiado.
    if (Object.keys(resto).length) almacen.guardar("visor:ajustes", { ...almacen.leer("visor:ajustes", {}), ...resto });
    if ("fov" in resto) redimensionar();
    return { ...int.ajustes, reducirMovimiento: reducido() };
  },
  /** Captura de la vista actual (sin interfaz), con una franja de marca y la estancia. */
  capturar({ ancho = 1600, tipo = "image/jpeg", calidad = 0.88, marca = true } = {}) {
    // La foto que recibe la agencia, sin los aros del suelo (V12): se pinta sin ellos, se copia y se vuelve a pintar con
    // ellos en el mismo instante (la pantalla no llega a parpadear).
    const flechas = grupoFlechas.visible;
    grupoFlechas.visible = false;
    renderizar();
    const alto = Math.round((ancho * lienzo.height) / lienzo.width);
    const c = document.createElement("canvas");
    c.width = ancho; c.height = alto;
    const g = c.getContext("2d");
    g.drawImage(lienzo, 0, 0, ancho, alto);
    grupoFlechas.visible = flechas;
    if (renderer) pintarEscena();
    // Nombre para el visitante: en el recorrido, el de la foto que ve (el mismo del título, aunque esté dentro de una
    // estancia mayor del plano, p. ej. «Salón» dentro de «Salón-comedor»); en el paseo libre, la estancia del plano.
    const est = estado.modo === "tour" && int.actual ? { id: int.actual.id, nombre: int.actual.nombre } : visor.estanciaActual();
    // Franja y sello sobre la foto: blanco sobre el velo de tema.css (igual en los dos temas), con la letra del sistema.
    const cs = getComputedStyle(document.documentElement);
    const velo = cs.getPropertyValue("--velo-foto").trim() || "rgba(0,0,0,.62)", tinta = cs.getPropertyValue("--c-sobre-foto").trim() || "#fff";
    const fuente = cs.getPropertyValue("--fuente").trim() || "system-ui, sans-serif";
    if (marca) {
      const h = Math.round(alto * 0.07);
      g.fillStyle = velo; g.fillRect(0, alto - h, ancho, h);
      g.fillStyle = tinta; g.font = `600 ${Math.round(h * 0.42)}px ${fuente}`; g.textBaseline = "middle";
      const izq = [texto(int.tour.marca?.nombre) || "cre8eight", int.tour.inmueble?.referencia, est && texto(est.nombre)].filter(Boolean).join(" · ");
      g.fillText(izq, h * 0.4, alto - h / 2);
    }
    // Aviso legal incrustado si la imagen no es una foto real (publicidad no engañosa).
    const sello = estado.modo === "tour" ? actualizarSello() : "";
    if (sello) {
      const t = Math.round(alto * 0.03);
      g.font = `600 ${t}px ${fuente}`;
      const w = g.measureText(sello).width + t * 1.4;
      g.fillStyle = velo; g.fillRect(ancho - w - t, t, w, t * 1.9);
      g.fillStyle = tinta; g.textBaseline = "middle"; g.fillText(sello, ancho - w - t + t * 0.7, t * 1.95);
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
  /** Música: estado y control. */
  sonido: {
    get activo() { return sonido.activo; },
    get disponible() { return !!sonido.el; },
    get volumen() { return sonido.volumen ?? sonido.base; },
    alternar: () => alternarSonido(),
    fijarVolumen: (v) => fijarVolumen(v),
  },
  /**
   * Pista de audio de la música para grabar vídeo (independiente del botón de silencio del visitante).
   * pistaAudio(true) → MediaStreamTrack | null (arranca la música desde el principio); pistaAudio(false) la libera.
   */
  async pistaAudio(si) {
    if (!sonido.el) return null;
    if (!si) {
      sonido.grabando = false;
      if (sonido.gananciaGrab) { const g = sonido.gananciaGrab.gain, t = sonido.ctx.currentTime; g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0, t + 0.4); }
      if (!sonido.activo) setTimeout(() => sonido.el?.pause(), 450);
      return null;
    }
    if (!asegurarGrafo()) return null;
    if (!sonido.destinoGrab) {
      sonido.destinoGrab = sonido.ctx.createMediaStreamDestination();
      sonido.gananciaGrab = sonido.ctx.createGain();
      sonido.gananciaGrab.connect(sonido.destinoGrab);
      sonido.fuente?.connect(sonido.gananciaGrab);
    }
    conectarFuente();
    sonido.grabando = true;
    sonido.gananciaGrab.gain.value = sonido.base;
    try { await sonido.ctx.resume(); sonido.el.currentTime = 0; await sonido.el.play(); } catch (e) { console.warn("[sonido] grabación", e); }
    return sonido.destinoGrab.stream.getAudioTracks()[0] ?? null;
  },
  /** Durante la grabación de vídeo, la visita guiada y las transiciones avanzan por reloj real. */
  tiempoReal(si) { int.tiempoReal = !!si; },
  /** Texto del aviso legal de la vista actual ("" si es una foto real). */
  sello: () => (estado.modo === "tour" ? actualizarSello() : ""),
  /** Compatibilidad: "radar" lo muestra, "oculto" lo oculta y "plano" abre «Estancias y plano». Sin argumento, alterna. */
  radar(modo) {
    if (modo === "plano") return estanciasPlano(true);
    alternarRadar(modo === undefined ? undefined : modo !== "oculto");
    return int.radarVisible;
  },
  /** Menú «Más» del núcleo: los paneles aportan elementos. donde: "siempre" | "movil" | "escritorio" | () => boolean. */
  mas: {
    agregar: (item) => agregarMas(item),
    quitar: (id) => quitarMas(id),
    abrir: () => abrirMas(),
    cerrar: () => cerrarMas(),
  },
  estanciasPlano: (abrir) => estanciasPlano(abrir),
  ayuda: (si) => alternarAyuda(si),
  /** Modo juego (ratón capturado). Sin argumento alterna. Necesita un gesto del usuario; emite "modojuego" { activo }. */
  modoJuego(si) {
    if (si === undefined) si = document.pointerLockElement !== lienzo;
    if (si) capturarRaton(); else salirJuego();
  },
  /** «Mirar moviendo el móvil». Sin argumento alterna. Promise<boolean>; emite "giroscopio" { activo }. */
  giroscopio: (si) => fijarGiro(si),
  portada: { get visible() { return !!int.portada; } },
  /** Cierra la portada como «Empezar visita» ({ guiada: true } = «▶ Visita guiada»). Emite "empezar". */
  empezar: (o) => empezar(o),
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
/** Mensajes a la página que contiene el visor (la vista previa del Estudio), solo si es del mismo origen: incrustado en la
    web de otro no se envía nada, que llenaba su consola de errores de «target origin» (M7). */
function enviarPadre(msg) {
  if (!EMBED || window.parent === window) return;
  try { if (window.parent.location.origin !== location.origin) return; } catch { return; } // otro origen: no se puede leer
  window.parent.postMessage(msg, "/");
}
addEventListener("message", async (e) => {
  if (!EMBED || e.source !== window.parent || window.parent === window) return;
  if (location.origin !== "null" && e.origin !== location.origin) return;
  const m = e.data ?? {};
  if (m.tipo === "visor:cargar" && m.tour) await cargarEnVisor(structuredClone(m.tour), { mantenerVista: true });
  if (m.tipo === "visor:ir") irA(m.nodo);
  if (m.tipo === "visor:yaw") {
    const n = int.nodos.get(m.nodo);
    if (n) { n.yaw = m.yaw; if (n === int.actual) { U.yawA.value = m.yaw * GRAD; construirPuntos(); } } // construirPuntos repinta
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
  if (params.has("demo")) {
    const { DEMO_TOUR } = await import("./demo.js");
    return structuredClone(DEMO_TOUR);
  }
  // Vista previa del Estudio: arranca vacía (sin generar la demo, que costaba ~13 s) y espera «visor:cargar».
  if (EMBED && params.has("estudio")) return { titulo: "", panoramas: [] };
  const url = params.get("tour") ?? "tour.json";
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch (e) {
    // En producción nunca se muestra una vivienda falsa: pantalla de error con reintento.
    soltarPortada(false);
    const el = document.createElement("div");
    el.id = "error-carga";
    el.setAttribute("role", "alert");
    el.innerHTML = `<div class="tarjeta c8-vidrio c8-vidrio--texto"><div class="marca-cre8">cre<span>8</span>eight</div><p></p><button type="button" class="c8-boton c8-boton--primario"></button></div>`;
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
    // Sin «momentos» explícitos solo se ofrecen los que tienen foto real; el Estudio activa la simulación escribiéndolos.
    const reales = new Set(t.panoramas.flatMap((p) => (p.variantes ?? []).map((v) => v.momento)).filter((m) => m && m !== "dia"));
    t.momentos = reales.size ? ["dia", ...["atardecer", "noche"].filter((m) => reales.has(m))] : [];
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
  // Si se estaba yendo a otra estancia (p. ej. elegida en la vista previa del Estudio), se conserva ese destino.
  const previo = int.navDestino ?? int.actual;
  const vistaPrevia = mantenerVista && previo ? { nodo: previo.id, rumbo: estado.rumbo, cabeceo: estado.cabeceo } : null;
  int.navDestino = null;
  if (int.transicion) { int.transicion.resolver(); int.transicion = null; }
  for (const [, e] of cache) if (e.tex && !e.fija) liberarTex(e.tex);
  cache.clear(); luces.clear();
  int.actual = null; int.fuenteActual = null;
  U.mezcla.value = 0;
  $("#vacio")?.remove();
  document.body.classList.remove("vista-vacia");
  int.tour = normalizar(t);
  enlazar(int.tour);
  radar.invalidar();
  planoGrande.invalidar();
  maqueta?.reiniciar();
  const h = int.nodos.size ? vistaPrevia ?? leerHash() : null;
  const inicio = int.nodos.size ? int.nodos.get(h?.nodo) ?? int.nodos.get(t.inicio) ?? t.panoramas[0] : null;
  if (int.portada) { progresoPortada(0.3); rellenarPortada(); fondoMiniatura(inicio); }
  if (t.demo && renderer) {
    mostrarCarga(!int.portada);
    const { generarPanoramas, musicaDemo } = await import("./demo.js");
    generarPanoramas(THREE, renderer, t.panoramas, t.altura_camara ?? 1.5);
    progresoPortada(0.75);
    if (!t.audio?.musica?.archivo) {
      const archivo = await musicaDemo().catch(() => null);
      if (archivo) t.audio = { musica: { archivo, volumen: 0.35, bucle: true, titulo: { es: "Ambiente (demo)", en: "Ambient (demo)" }, autor: "cre8eight", licencia: "Generada por código" } };
    }
    mostrarCarga(false);
  }
  const pedido = params.get("lang") ?? i18n?.idiomaActual?.() ?? t.idioma ?? "es";
  estado.idioma = (t.idiomas ?? [t.idioma ?? "es"]).includes(pedido) ? pedido : t.idioma ?? "es";
  i18n?.fijarIdioma?.(estado.idioma);
  document.documentElement.lang = estado.idioma;
  refrescarTextos();
  configurarSonido();
  redimensionar();
  // N4: sin plano de verdad (imagen, muros o estancias) el radar empieza oculto; sigue activable con R o su botón.
  int.radarVisible = hayPlano() && almacen.leer("visor:radarVisible", true) !== false;
  aplicarRadar();
  if (!int.nodos.size) {
    estado.planta = t.plantas[0].id;
    if (t.libre) await cambiarModo("libre");
    else if (EMBED && params.has("estudio")) {
      const el = document.createElement("p");
      el.id = "vacio";
      el.textContent = tr("aviso.vista_vacia");
      $("#app").append(el);
      document.body.classList.add("vista-vacia");
    } else aviso(tr("aviso.error_carga", { x: texto(t.titulo) || "tour" }), 600000, { reintentar: () => location.reload() });
    visor.emitir("tour", {});
    return;
  }
  estado.planta = inicio.planta;
  estado.rumbo = h?.rumbo != null && !isNaN(h.rumbo) && int.nodos.has(h?.nodo) ? h.rumbo : (inicio.rumbo_inicial ?? inicio.yaw ?? 0) * GRAD;
  if (h?.cabeceo != null && !isNaN(h.cabeceo)) estado.cabeceo = h.cabeceo;
  if (renderer) {
    if (int.portada) int.alProgresoCarga = (f) => progresoPortada(0.3 + 0.6 * f); // bytes reales de la primera foto
    await irA(inicio, { instantaneo: true });
    int.alProgresoCarga = null;
  } else { int.actual = inicio; estado.nodo = inicio.id; anunciarEstancia(inicio); }
  progresoPortada(0.92);
  if (h?.fov && !isNaN(h.fov)) fijarZoom(h.fov / int.fovBase);
  visor.emitir("tour", {}); // los paneles se repintan con los datos nuevos (p. ej. vista previa del Estudio)
}

// ------------------------------------------------------------------ bucle y arranque
function redimensionar() {
  tocarEscena();
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
  actualizarBtnMas(); // «donde» depende del tamaño
  if (!$("#menu-mas").hidden) colocarMas();
  medirTira();
}
addEventListener("resize", redimensionar);

let tMapa = 0, tVista = 0, ultimaVista = "";
// Pintar bajo demanda (fase 4): en el recorrido 360, con la vista quieta no se pinta (la GPU descansa: batería en el
// móvil y una vista previa del Estudio más ligera). Se pinta si se mueve la cámara (también el zoom o el giroscopio), hay
// una transición, la visita guiada, la medición o una grabación de vídeo, se mantiene una tecla, o algo avisó con
// tocarEscena() (texturas, flechas, corte del comparador, pintura, tamaño, tema). El paseo libre y la maqueta pintan
// siempre (amortiguación de la órbita, joystick, splats).
const pinta = { firma: new Float64Array(32), marcos: 2, radar: true };
/** La imagen cambió sin mover la cámara: pintar los próximos fotogramas (por fotogramas, no por tiempo: con fotogramas
    lentos un plazo en ms caducaría antes de pintar; el segundo cubre una textura que tarde uno en subir). */
function tocarEscena(n = 2) { pinta.marcos = Math.max(pinta.marcos, n); pinta.radar = true; }
function hayQuePintar() {
  const a = camara.matrixWorld.elements, b = camara.projectionMatrix.elements, f = pinta.firma;
  let mueve = false;
  for (let i = 0; i < 16; i++) {
    if (f[i] !== a[i]) { f[i] = a[i]; mueve = true; }
    if (f[16 + i] !== b[i]) { f[16 + i] = b[i]; mueve = true; }
  }
  if (mueve) pinta.radar = true;
  const avisado = pinta.marcos > 0;
  if (avisado) pinta.marcos--;
  return mueve || avisado || !!int.transicion || guion.activo || estado.midiendo || estado.comparar
    || int.tiempoReal || !!int.captura || int.teclas.size > 0 || !!int.giro;
}
const fps = { t: 0, n: 0 };
/** Pinta la escena del modo actual (sin foto todavía: el fondo del tema, no la esfera blanca de la textura vacía). */
function pintarEscena() {
  if (estado.modo === "maqueta") renderer.render(maqueta.escena(), maqueta.camara);
  else if (estado.modo === "tour" && !int.actual) renderer.clear();
  else renderer.render(estado.modo === "libre" ? escenaLibre : escena360, camara);
}
function renderizar() {
  if (!renderer) return;
  pintarEscena();
  emitirBase("frame"); // sin CustomEvent: se emite en cada fotograma (grabación de vídeo)
}

function bucle() {
  reloj.update();
  const dtReal = reloj.getDelta();
  const dt = Math.min(dtReal, 0.1);
  const dtGuion = int.tiempoReal ? Math.min(dtReal, 1) : dt; // grabando: la visita sigue el reloj real
  // Con la portada delante no se pinta (la GPU descansa); las transiciones y la visita guiada siguen (API, grabación).
  const pintar = !int.portada || int.tiempoReal;
  if (estado.modo === "tour") {
    pasoTransicion(dtGuion);
    guion.paso(dtGuion);
    giroTeclado(dt);
    cabeceoTeclado(dt);
    actualizarBarraGuion();
    estado.cabeceo = THREE.MathUtils.clamp(estado.cabeceo, -1.45, 1.45);
    if (int.giro?.q) camara.quaternion.copy(int.giro.q);
    else camara.rotation.set(estado.cabeceo, -estado.rumbo, 0);
    estado.fov = camara.fov;
    camara.updateMatrixWorld();
    if (pintar && hayQuePintar()) { renderizar(); actualizarEtiquetas(); }
    if (pintar) quizaMedirLuz(); // pinta su propio lienzo de 32×18: no necesita el fotograma
    tMapa += dt;
    if (pintar && pinta.radar && tMapa > 0.033) { tMapa = 0; pinta.radar = false; dibujarRadar(); }
    tVista += dt;
    // Mientras se va a otra estancia no se informa al Estudio (estado.nodo aún es la anterior): lo hace llegar().
    if (EMBED && tVista > 0.15 && !int.navDestino && !int.transicion) {
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
    if (pintar) renderizar();
  } else {
    maqueta.cuadro();
    if (pintar) renderizar();
  }
  medicion?.cuadro();
  // Interfaz que se oculta tras 3,5 s sin interacción (vuelve al mover el ratón o tocar). Quedan el radar y la tarjeta.
  const inactiva = !!int.yaInteractuo && !int.portada && performance.now() - int.ultimaInteraccion > 3500 && estado.modo !== "maqueta" && !estado.midiendo && !EMBED
    && $("#menu-mas").hidden && !document.querySelector("dialog[open], #paneles [aria-expanded=true], #paneles .pn-abierto")
    && !document.activeElement?.closest?.("#esquina, #modos, #barra-vista, #galeria, #paneles, #guion-barra");
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
  progresoPortada(0.1);
  i18n = await import("./i18n.js").catch(() => null);
  progresoPortada(0.18);
  const t = await obtenerTour();
  if (!renderer) { document.body.classList.add("sin-webgl"); aviso(tr("aviso.sin_webgl"), 600000); }
  await cargarEnVisor(t);
  const modoPedido = params.get("modo");
  if (modoPedido && modosDisponibles().includes(modoPedido)) await cambiarModo(modoPedido);
  if (renderer && int.actual && !int.portada) precompilar(); // sin portada (?embed): antes del primer fotograma
  if (renderer) renderer.setAnimationLoop(bucle);
  import("./paneles.js").then((m) => m.iniciarPaneles?.(visor)).catch((e) => console.info("Paneles no disponibles:", e.message));
  visor.listo = true;
  if (int.portada) portadaLista(); else pistaInicial();
  visor.emitir("listo", {});
  enviarPadre({ tipo: "visor:listo" });
}

iniciar().catch((e) => { console.error(e); soltarPortada(false); if (!$("#error-carga")) aviso(tr("aviso.error", { x: e.message }), 10000); });

// Desarrollo (?dev): arrastrar y soltar un .spz/.ply/.splat/.sog/.glb para probarlo al instante.
// En los recorridos publicados no se activa.
if (params.has("dev")) addEventListener("dragover", (e) => { if (!EMBED) e.preventDefault(); });
if (params.has("dev")) addEventListener("drop", async (e) => {
  if (EMBED || !renderer) return;
  e.preventDefault();
  const f = e.dataTransfer.files[0];
  if (!f) return;
  const bytes = new Uint8Array(await f.arrayBuffer());
  const cfg = int.tour.libre ?? {};
  try {
    if (/\.(glb|gltf)$/i.test(f.name)) {
      const gltf = await new (await cargadorGLTF())().parseAsync(bytes.buffer, "");
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
