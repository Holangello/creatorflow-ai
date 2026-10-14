// Visor inmobiliario: recorrido 360 (fotos equirectangulares) + modo libre 3D
// (Gaussian Splatting con Spark o modelo GLB) con controles tipo videojuego.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { crearPisoDemo, DEMO_TOUR } from "./demo.js";

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const esTactil = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
if (esTactil) document.body.classList.add("tactil");
const GRAD = Math.PI / 180;
const angDif = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const rumbo = (dx, dz) => Math.atan2(dx, -dz); // 0 = -Z, positivo hacia +X (sentido horario visto desde arriba)

// ---------------------------------------------------------------- render base
const lienzo = $("#lienzo");
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, esTactil ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const MAX_TEX = renderer.capabilities.maxTextureSize;

const camara = new THREE.PerspectiveCamera(75, 1, 0.05, 500);
camara.rotation.order = "YXZ";
const reloj = new THREE.Timer();

const estado = {
  modo: "tour",
  tour: null,
  nodos: new Map(),
  actual: null,
  rumbo: 0,
  cabeceo: 0,
  fovBase: 75,
  transicion: null,
  teclas: new Set(),
  giro: null,
  libre: { pos: new THREE.Vector3(), rumbo: 0, cabeceo: 0, listo: false, colisiones: [], suelo: false, limites: null },
  joy: { x: 0, y: 0, id: null },
};

function redimensionar() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camara.aspect = w / h;
  estado.fovBase = w < h ? 90 : 75;
  if (!estado.transicion) camara.fov = estado.fovBase * (estado.zoom ?? 1);
  camara.updateProjectionMatrix();
  dibujarMapa();
}
addEventListener("resize", redimensionar);

// ---------------------------------------------------------- escena 360
const escena360 = new THREE.Scene();
const matPano = new THREE.ShaderMaterial({
  uniforms: {
    texA: { value: null }, texB: { value: null },
    yawA: { value: 0 }, yawB: { value: 0 }, mezcla: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec3 vDir;
    void main() {
      vDir = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D texA; uniform sampler2D texB;
    uniform float yawA; uniform float yawB; uniform float mezcla;
    varying vec3 vDir;
    const float PI = 3.141592653589793;
    vec4 muestra(sampler2D t, vec3 d, float yaw) {
      float h = atan(d.x, -d.z) - yaw;
      float u = fract(0.5 + h / (2.0 * PI));
      float v = 0.5 + asin(clamp(d.y, -1.0, 1.0)) / PI;
      return texture2D(t, vec2(u, v));
    }
    void main() {
      vec3 d = normalize(vDir);
      vec4 c = muestra(texA, d, yawA);
      if (mezcla > 0.0) c = mix(c, muestra(texB, d, yawB), mezcla);
      gl_FragColor = vec4(c.rgb, 1.0);
      #include <colorspace_fragment>
    }`,
  side: THREE.BackSide,
  depthWrite: false,
});
escena360.add(new THREE.Mesh(new THREE.SphereGeometry(100, 96, 48), matPano));
const grupoFlechas = new THREE.Group();
escena360.add(grupoFlechas);

const cacheTex = new Map();
const cargadorTex = new THREE.TextureLoader();

function ajustarTextura(tex) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter; // sin mipmaps: evita la costura en el meridiano 180°
  tex.generateMipmaps = false;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 1;
  return tex;
}

function limitarImagen(img) {
  // Las fotos del Osmo 360 (15520 px) superan el límite de muchas GPU móviles.
  if (img.width <= MAX_TEX) return img;
  const c = document.createElement("canvas");
  c.width = MAX_TEX; c.height = MAX_TEX / 2;
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return c;
}

function texturaNodo(nodo) {
  if (cacheTex.has(nodo.id)) return cacheTex.get(nodo.id);
  let p;
  if (nodo.textura) p = Promise.resolve(nodo.textura);
  else {
    const url = (esTactil && nodo.imagen_movil) || nodo.imagen;
    p = new Promise((ok, mal) => cargadorTex.load(url, (t) => {
      t.image = limitarImagen(t.image);
      ok(ajustarTextura(t));
    }, undefined, () => mal(new Error(`No se pudo cargar ${url}`))));
  }
  cacheTex.set(nodo.id, p);
  p.catch(() => cacheTex.delete(nodo.id));
  return p;
}

// Flecha de suelo para cada enlace (equivalente a los "Auto Hotspots" de Chaos Cloud)
const geoAro = new THREE.RingGeometry(0.32, 0.42, 48).rotateX(-Math.PI / 2);
const geoDisco = new THREE.CircleGeometry(0.55, 32).rotateX(-Math.PI / 2);
const geoFlecha = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, -0.2); s.lineTo(0.16, 0.06); s.lineTo(0.06, 0.06); s.lineTo(0.06, 0.2);
  s.lineTo(-0.06, 0.2); s.lineTo(-0.06, 0.06); s.lineTo(-0.16, 0.06); s.closePath();
  return new THREE.ShapeGeometry(s).rotateX(-Math.PI / 2);
})();
const matAro = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthTest: false });
const matAroHover = new THREE.MeshBasicMaterial({ color: 0xffb547, transparent: true, opacity: 1, depthTest: false });
const matInvisible = new THREE.MeshBasicMaterial({ visible: false });

const etiquetas = $("#etiquetas");
let etiquetasActivas = [];

function construirPuntos() {
  grupoFlechas.clear();
  etiquetas.replaceChildren();
  etiquetasActivas = [];
  const n = estado.actual;
  const alt = estado.tour.altura_camara ?? 1.5;
  for (const destino of n.vecinos) {
    const dx = destino.x - n.x, dz = destino.z - n.z;
    const dist = Math.hypot(dx, dz);
    const r = THREE.MathUtils.clamp(dist * 0.6, 1.3, 3.2);
    const g = new THREE.Group();
    g.position.set((dx / dist) * r, -alt, (dz / dist) * r);
    g.rotation.y = -rumbo(dx, dz) + Math.PI; // la punta de la flecha mira al destino
    const aro = new THREE.Mesh(geoAro, matAro);
    const flecha = new THREE.Mesh(geoFlecha, matAro);
    const hit = new THREE.Mesh(geoDisco, matInvisible);
    aro.renderOrder = flecha.renderOrder = 2;
    g.add(aro, flecha, hit);
    g.userData = { destino, partes: [aro, flecha] };
    grupoFlechas.add(g);
    const etq = document.createElement("div");
    etq.className = "etq";
    etq.textContent = destino.nombre;
    etq.onclick = () => irA(destino);
    etiquetas.append(etq);
    etiquetasActivas.push({ el: etq, pos: new THREE.Vector3(g.position.x, g.position.y + 0.35, g.position.z) });
  }
  for (const p of n.puntos ?? []) {
    const h = (p.yaw ?? 0) * GRAD + (n.yaw ?? 0) * GRAD;
    const v = (p.pitch ?? 0) * GRAD;
    const el = document.createElement("div");
    el.className = "info";
    el.textContent = "i";
    el.title = p.titulo;
    el.onclick = () => mostrarFicha(p.titulo, p.texto);
    etiquetas.append(el);
    etiquetasActivas.push({ el, pos: new THREE.Vector3(Math.sin(h) * Math.cos(v) * 10, Math.sin(v) * 10, -Math.cos(h) * Math.cos(v) * 10) });
  }
}

const vTmp = new THREE.Vector3();
function actualizarEtiquetas() {
  const w = innerWidth, h = innerHeight;
  for (const e of etiquetasActivas) {
    vTmp.copy(e.pos).applyMatrix4(camara.matrixWorldInverse);
    if (vTmp.z > -0.1 || estado.transicion) { e.el.style.display = "none"; continue; }
    vTmp.applyMatrix4(camara.projectionMatrix);
    e.el.style.display = "";
    e.el.style.left = `${(vTmp.x * 0.5 + 0.5) * w}px`;
    e.el.style.top = `${(-vTmp.y * 0.5 + 0.5) * h}px`;
  }
}

async function irA(destino, { instantaneo = false } = {}) {
  if (!destino || destino === estado.actual || estado.transicion) return;
  const desde = estado.actual;
  mostrarCarga(true);
  let tex;
  try { tex = await texturaNodo(destino); }
  catch (e) { aviso(e.message); mostrarCarga(false); return; }
  mostrarCarga(false);
  ocultarFicha();
  if (!desde || instantaneo) {
    matPano.uniforms.texA.value = tex;
    matPano.uniforms.yawA.value = (destino.yaw ?? 0) * GRAD;
    llegar(destino);
    return;
  }
  // Transición: fundido cruzado + "paso" hacia delante (zoom) en la dirección del destino.
  const r = rumbo(destino.x - desde.x, destino.z - desde.z);
  matPano.uniforms.texB.value = tex;
  matPano.uniforms.yawB.value = (destino.yaw ?? 0) * GRAD;
  grupoFlechas.visible = false;
  estado.transicion = { t: 0, dur: 0.75, rumbo0: estado.rumbo, rumbo1: estado.rumbo + angDif(r, estado.rumbo) * 0.6, destino };
}

function llegar(nodo) {
  estado.actual = nodo;
  grupoFlechas.visible = true;
  construirPuntos();
  $("#estancia").textContent = nodo.nombre;
  document.querySelectorAll("#galeria button").forEach((b) => b.classList.toggle("activo", b.dataset.id === nodo.id));
  if (!params.has("demo")) history.replaceState(null, "", `#${encodeURIComponent(nodo.id)}`);
  for (const v of nodo.vecinos) texturaNodo(v).catch(() => {}); // precarga
  dibujarMapa();
  actualizarEditor();
}

function pasoTransicion(dt) {
  const tr = estado.transicion;
  if (!tr) return;
  tr.t = Math.min(1, tr.t + dt / tr.dur);
  const e = tr.t * tr.t * (3 - 2 * tr.t);
  matPano.uniforms.mezcla.value = e;
  estado.rumbo = tr.rumbo0 + (tr.rumbo1 - tr.rumbo0) * e;
  camara.fov = estado.fovBase * (estado.zoom ?? 1) * (1 - 0.28 * Math.sin(Math.PI * e));
  camara.updateProjectionMatrix();
  if (tr.t >= 1) {
    matPano.uniforms.texA.value = matPano.uniforms.texB.value;
    matPano.uniforms.yawA.value = matPano.uniforms.yawB.value;
    matPano.uniforms.mezcla.value = 0;
    estado.transicion = null;
    camara.fov = estado.fovBase * (estado.zoom ?? 1);
    camara.updateProjectionMatrix();
    llegar(tr.destino);
  }
}

// Avanzar con W/↑: el enlace más alineado con la mirada (como andar en un videojuego).
function avanzar(sentido = 1) {
  const n = estado.actual;
  if (!n) return;
  const objetivo = sentido > 0 ? estado.rumbo : estado.rumbo + Math.PI;
  let mejor = null, mejorAng = sentido > 0 ? 55 * GRAD : 70 * GRAD;
  for (const v of n.vecinos) {
    const a = Math.abs(angDif(rumbo(v.x - n.x, v.z - n.z), objetivo));
    if (a < mejorAng) { mejor = v; mejorAng = a; }
  }
  if (mejor) irA(mejor);
}

// ------------------------------------------------------------- modo libre 3D
const escenaLibre = new THREE.Scene();
escenaLibre.background = new THREE.Color(0x1b1e24);
const rayo = new THREE.Raycaster();
const ABAJO = new THREE.Vector3(0, -1, 0);

async function prepararLibre() {
  const L = estado.libre;
  if (L.listo || L.cargando) return L.cargando;
  const cfg = estado.tour.libre;
  L.cargando = (async () => {
    const alt = estado.tour.altura_camara ?? 1.5;
    if (cfg.tipo === "demo") {
      const piso = crearPisoDemo(THREE);
      escenaLibre.add(piso.grupo);
      L.colisiones = piso.colisiones;
    } else if (cfg.tipo === "glb") {
      const gltf = await new GLTFLoader().loadAsync(cfg.url);
      aplicarTransformacion(gltf.scene, cfg);
      escenaLibre.add(gltf.scene, new THREE.HemisphereLight(0xffffff, 0x444444, 2.5));
      L.colisiones = [gltf.scene];
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
    const ini = cfg.inicio ?? (estado.actual ? [estado.actual.x, estado.actual.z, estado.rumbo / GRAD] : [0, 0, 0]);
    L.pos.set(ini[0], (cfg.altura_suelo ?? 0) + alt, ini[1]);
    L.rumbo = (ini[2] ?? 0) * GRAD;
    L.listo = true;
  })();
  try { await L.cargando; } catch (e) { aviso(`Modo libre: ${e.message}`); L.cargando = null; throw e; }
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
  const malla = new mod.SplatMesh({
    ...fuente,
    onProgress: (e) => e.total && mostrarCarga(true, e.loaded / e.total),
  });
  malla.userData.esSplat = true;
  aplicarTransformacion(malla, cfg);
  escenaLibre.add(malla);
  try { await malla.initialized; } finally { mostrarCarga(false); }
  return malla;
}

const RADIO = 0.28;
function moverLibre(dt) {
  const L = estado.libre;
  if (!L.listo) return;
  const k = estado.teclas;
  const giro = ((k.has("ArrowRight") ? 1 : 0) - (k.has("ArrowLeft") ? 1 : 0)) * 1.8 * dt;
  L.rumbo += giro;
  let adelante = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
  let lado = (k.has("KeyD") ? 1 : 0) - (k.has("KeyA") ? 1 : 0);
  adelante -= estado.joy.y; lado += estado.joy.x;
  const mag = Math.hypot(adelante, lado);
  if (mag > 1) { adelante /= mag; lado /= mag; }
  const vel = (k.has("ShiftLeft") || k.has("ShiftRight") ? 3.4 : 1.6) * dt;
  const s = Math.sin(L.rumbo), c = Math.cos(L.rumbo);
  let mx = (s * adelante + c * lado) * vel;
  let mz = (-c * adelante + s * lado) * vel;
  if (L.colisiones.length && (mx || mz)) {
    // Colisión deslizante: si el paso completo choca, se prueba cada eje por separado.
    if (choca(L.pos, mx, mz)) {
      if (!choca(L.pos, mx, 0)) mz = 0;
      else if (!choca(L.pos, 0, mz)) mx = 0;
      else mx = mz = 0;
    }
  }
  L.pos.x += mx; L.pos.z += mz;
  const alt = estado.tour.altura_camara ?? 1.5;
  if (L.suelo) {
    rayo.set(vTmp.set(L.pos.x, L.pos.y + 0.3, L.pos.z), ABAJO);
    rayo.far = alt + 1.5;
    const h = rayo.intersectObjects(L.colisiones, true)[0];
    if (h) L.pos.y += (h.point.y + alt - L.pos.y) * Math.min(1, dt * 10);
  } else {
    L.pos.y += ((k.has("Space") ? 1 : 0) - (k.has("KeyC") ? 1 : 0)) * vel;
  }
  if (L.limites) {
    const [x0, z0, x1, z1] = L.limites;
    L.pos.x = THREE.MathUtils.clamp(L.pos.x, x0, x1);
    L.pos.z = THREE.MathUtils.clamp(L.pos.z, z0, z1);
  }
  camara.position.copy(L.pos);
  camara.rotation.set(L.cabeceo, -L.rumbo, 0);
  if (mx || mz || giro) dibujarMapaThrottle();
}

const dirTmp = new THREE.Vector3();
const DIRS = Array.from({ length: 8 }, (_, i) => new THREE.Vector3(Math.cos(i * Math.PI / 4), 0, Math.sin(i * Math.PI / 4)));
// ¿Queda la cápsula del visitante (radio RADIO, a la altura de rodillas y pecho) dentro de algo?
function choca(pos, mx, mz) {
  const d = Math.hypot(mx, mz);
  for (const dy of [-0.9, -0.2]) {
    const origen = vTmp.set(pos.x, pos.y + dy, pos.z);
    rayo.far = d + RADIO;
    rayo.set(origen, dirTmp.set(mx / d, 0, mz / d));
    if (rayo.intersectObjects(estado.libre.colisiones, true).length) return true;
    origen.x += mx; origen.z += mz;
    rayo.far = RADIO;
    for (const dir of DIRS) {
      rayo.set(origen, dir);
      if (rayo.intersectObjects(estado.libre.colisiones, true).length) return true;
    }
  }
  return false;
}

// ------------------------------------------------------------------ entrada
const punteros = new Map();
let arrastre = null;
let pellizco = null;

lienzo.addEventListener("pointerdown", (e) => {
  lienzo.setPointerCapture(e.pointerId);
  punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (punteros.size === 2) {
    const [a, b] = [...punteros.values()];
    pellizco = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: estado.zoom ?? 1 };
    arrastre = null;
  } else {
    arrastre = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, mov: 0 };
  }
});

lienzo.addEventListener("pointermove", (e) => {
  if (punteros.has(e.pointerId)) punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pellizco && punteros.size === 2) {
    const [a, b] = [...punteros.values()];
    if (estado.modo === "tour") fijarZoom(pellizco.zoom * pellizco.d / Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)));
    return;
  }
  if (document.pointerLockElement === lienzo) {
    mirar(e.movementX * 0.0022, e.movementY * 0.0022);
    return;
  }
  if (!arrastre || arrastre.id !== e.pointerId) { if (estado.modo === "tour") hover(e); return; }
  const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y;
  arrastre.x = e.clientX; arrastre.y = e.clientY;
  arrastre.mov += Math.abs(dx) + Math.abs(dy);
  if (estado.modo === "tour") {
    // Agarrar y arrastrar la imagen (convención Street View).
    const k = (camara.fov * GRAD) / innerHeight;
    if (estado.giro?.offset != null) estado.giro.offset -= dx * k;
    else { estado.rumbo -= dx * k; estado.cabeceo += dy * k; }
  } else {
    mirar(dx * 0.005, dy * 0.005); // convención videojuego: arrastrar a la derecha = mirar a la derecha
  }
});

const soltar = (e) => {
  punteros.delete(e.pointerId);
  if (punteros.size < 2) pellizco = null;
  if (arrastre && arrastre.id === e.pointerId) {
    if (arrastre.mov < 6 && e.type === "pointerup") clic(e);
    arrastre = null;
  }
};
lienzo.addEventListener("pointerup", soltar);
lienzo.addEventListener("pointercancel", soltar);

function mirar(dx, dy) {
  if (estado.modo === "tour") { estado.rumbo += dx; estado.cabeceo -= dy; return; }
  const L = estado.libre;
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
  if (e.pointerType === "touch") return;
  const g = apuntar(e);
  if (g === hoverActual) return;
  hoverActual?.userData.partes.forEach((m) => (m.material = matAro));
  g?.userData.partes.forEach((m) => (m.material = matAroHover));
  hoverActual = g;
  lienzo.style.cursor = g ? "pointer" : "";
}
function clic(e) {
  if (estado.modo === "tour") {
    const g = apuntar(e);
    if (g) irA(g.userData.destino);
  } else if (!esTactil && e.pointerType === "mouse" && !params.has("sinbloqueo")) {
    lienzo.requestPointerLock?.()?.catch?.(() => {});
  }
}

lienzo.addEventListener("wheel", (e) => {
  e.preventDefault();
  if (estado.modo === "tour") fijarZoom((estado.zoom ?? 1) * Math.exp(e.deltaY * 0.001));
}, { passive: false });

function fijarZoom(z) {
  estado.zoom = THREE.MathUtils.clamp(z, 0.4, 1.25);
  if (!estado.transicion) { camara.fov = estado.fovBase * estado.zoom; camara.updateProjectionMatrix(); }
}

addEventListener("keydown", (e) => {
  if (e.target.closest?.("input, textarea")) return;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
  estado.teclas.add(e.code);
  if (e.repeat) return;
  if (estado.modo === "tour") {
    if (e.code === "KeyW" || e.code === "ArrowUp") avanzar(1);
    if (e.code === "KeyS" || e.code === "ArrowDown") avanzar(-1);
    if (e.code === "Equal" || e.code === "NumpadAdd") fijarZoom((estado.zoom ?? 1) * 0.85);
    if (e.code === "Minus" || e.code === "NumpadSubtract") fijarZoom((estado.zoom ?? 1) / 0.85);
    if (estado.editor && (e.code === "BracketLeft" || e.code === "BracketRight")) ajustarYaw(e.code === "BracketLeft" ? -1 : 1, e.shiftKey);
  }
  if (e.code === "KeyM") $("#minimapa").classList.toggle("grande"), setTimeout(dibujarMapa, 260);
  if (e.code === "KeyH" || e.key === "?") alternar($("#ayuda"));
  if (e.code === "Tab" && estado.tour?.libre) { e.preventDefault(); cambiarModo(estado.modo === "tour" ? "libre" : "tour"); }
  if (e.code === "Escape") { $("#ayuda").hidden = true; ocultarFicha(); }
});
addEventListener("keyup", (e) => estado.teclas.delete(e.code));
addEventListener("blur", () => estado.teclas.clear());

function giroTeclado(dt) {
  if (estado.modo !== "tour") return;
  const k = estado.teclas;
  const g = ((k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) - (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0)) * 1.6 * dt;
  if (estado.giro?.offset != null) estado.giro.offset += g; else if (!estado.giro) estado.rumbo += g;
}

// Joystick virtual (móvil / tablet)
const joy = $("#joystick"), pomo = $("#joystick-pomo");
joy.addEventListener("pointerdown", (e) => { joy.setPointerCapture(e.pointerId); estado.joy.id = e.pointerId; moverJoy(e); });
joy.addEventListener("pointermove", (e) => e.pointerId === estado.joy.id && moverJoy(e));
const soltarJoy = (e) => {
  if (e.pointerId !== estado.joy.id) return;
  estado.joy = { x: 0, y: 0, id: null };
  pomo.style.transform = "";
};
joy.addEventListener("pointerup", soltarJoy);
joy.addEventListener("pointercancel", soltarJoy);
function moverJoy(e) {
  const r = joy.getBoundingClientRect();
  let x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
  let y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
  const m = Math.hypot(x, y);
  if (m > 1) { x /= m; y /= m; }
  estado.joy.x = Math.abs(x) < 0.12 ? 0 : x;
  estado.joy.y = Math.abs(y) < 0.12 ? 0 : y;
  pomo.style.transform = `translate(${x * 34}px, ${y * 34}px)`;
}

// Giroscopio (recorrido 360 en móvil): mueve la vista al mover el teléfono.
const qAux = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
const eAux = new THREE.Euler();
const qPantalla = new THREE.Quaternion();
const EJE_Z = new THREE.Vector3(0, 0, 1);
const EJE_Y = new THREE.Vector3(0, 1, 0);
function alOrientacion(ev) {
  if (ev.alpha == null || !estado.giro) return;
  eAux.set(ev.beta * GRAD, ev.alpha * GRAD, -ev.gamma * GRAD, "YXZ");
  const q = new THREE.Quaternion().setFromEuler(eAux).multiply(qAux);
  const orient = (screen.orientation?.angle ?? window.orientation ?? 0) * GRAD;
  q.multiply(qPantalla.setFromAxisAngle(EJE_Z, -orient));
  const f = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
  if (estado.giro.offset == null) estado.giro.offset = estado.rumbo - rumbo(f.x, f.z);
  estado.giro.q = new THREE.Quaternion().setFromAxisAngle(EJE_Y, -estado.giro.offset).multiply(q);
}
async function alternarGiro() {
  if (estado.giro) {
    removeEventListener("deviceorientation", alOrientacion);
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(camara.quaternion);
    estado.rumbo = rumbo(f.x, f.z); estado.cabeceo = Math.asin(THREE.MathUtils.clamp(f.y, -1, 1));
    estado.giro = null;
  } else {
    if (typeof DeviceOrientationEvent?.requestPermission === "function") {
      if ((await DeviceOrientationEvent.requestPermission().catch(() => "denied")) !== "granted") return aviso("Permiso de movimiento denegado");
    }
    estado.giro = { offset: null, q: null };
    addEventListener("deviceorientation", alOrientacion);
  }
  $("#btn-giro").classList.toggle("activo", !!estado.giro);
}

// ------------------------------------------------------------------ minimapa
const mapa = $("#mapa");
const ctxMapa = mapa.getContext("2d");
const imgPlano = new Image();
let marco = null;

function calcularMarco() {
  const t = estado.tour;
  let x0, z0, x1, z1;
  if (t.plano) { x0 = t.plano.origen?.[0] ?? 0; z0 = t.plano.origen?.[1] ?? 0; x1 = x0 + t.plano.ancho_m; z1 = z0 + t.plano.alto_m; }
  else {
    const pts = [...estado.nodos.values()].map((n) => [n.x, n.z]);
    for (const m of t.muros ?? []) pts.push([m[0], m[1]], [m[2], m[3]]);
    if (t.libre?.limites) pts.push(t.libre.limites.slice(0, 2), t.libre.limites.slice(2));
    if (!pts.length) pts.push([-5, -5], [5, 5]);
    x0 = Math.min(...pts.map((p) => p[0])) - 1; x1 = Math.max(...pts.map((p) => p[0])) + 1;
    z0 = Math.min(...pts.map((p) => p[1])) - 1; z1 = Math.max(...pts.map((p) => p[1])) + 1;
  }
  return { x0, z0, x1, z1 };
}

function aPantalla(x, z, W, H) {
  const { x0, z0, x1, z1 } = marco;
  const esc = Math.min((W - 16) / (x1 - x0), (H - 16) / (z1 - z0));
  const ox = (W - (x1 - x0) * esc) / 2, oz = (H - (z1 - z0) * esc) / 2;
  return [ox + (x - x0) * esc, oz + (z - z0) * esc, esc];
}

let ultimoMapa = 0;
function dibujarMapaThrottle() {
  const t = performance.now();
  if (t - ultimoMapa > 60) { ultimoMapa = t; dibujarMapa(); }
}

function dibujarMapa() {
  if (!estado.tour) return;
  marco ??= calcularMarco();
  const dpr = Math.min(devicePixelRatio, 2);
  const W = mapa.clientWidth, H = mapa.clientHeight;
  if (!W || !H) return;
  if (mapa.width !== Math.round(W * dpr)) { mapa.width = Math.round(W * dpr); mapa.height = Math.round(H * dpr); }
  const c = ctxMapa;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, W, H);
  const t = estado.tour;
  if (t.plano && imgPlano.complete && imgPlano.naturalWidth) {
    const [ax, az] = aPantalla(marco.x0, marco.z0, W, H);
    const [bx, bz] = aPantalla(marco.x1, marco.z1, W, H);
    c.globalAlpha = 0.9; c.drawImage(imgPlano, ax, az, bx - ax, bz - az); c.globalAlpha = 1;
  }
  if (t.muros) {
    c.strokeStyle = "#d9dde3"; c.lineWidth = 2.5; c.lineCap = "square";
    c.beginPath();
    for (const m of t.muros) {
      const [ax, az] = aPantalla(m[0], m[1], W, H), [bx, bz] = aPantalla(m[2], m[3], W, H);
      c.moveTo(ax, az); c.lineTo(bx, bz);
    }
    c.stroke();
  }
  // enlaces
  c.strokeStyle = "rgba(255,181,71,.35)"; c.lineWidth = 1.5; c.setLineDash([3, 3]);
  c.beginPath();
  for (const n of estado.nodos.values()) for (const v of n.vecinos) {
    if (v.id < n.id) continue;
    const [ax, az] = aPantalla(n.x, n.z, W, H), [bx, bz] = aPantalla(v.x, v.z, W, H);
    c.moveTo(ax, az); c.lineTo(bx, bz);
  }
  c.stroke(); c.setLineDash([]);
  for (const n of estado.nodos.values()) {
    const [x, z] = aPantalla(n.x, n.z, W, H);
    c.fillStyle = n === estado.actual && estado.modo === "tour" ? "#ffb547" : "#ffffff";
    c.beginPath(); c.arc(x, z, 5, 0, Math.PI * 2); c.fill();
  }
  // posición + cono de visión
  let px, pz, r;
  if (estado.modo === "libre" && estado.libre.listo) { px = estado.libre.pos.x; pz = estado.libre.pos.z; r = estado.libre.rumbo; }
  else if (estado.actual) {
    px = estado.actual.x; pz = estado.actual.z;
    const f = vTmp.set(0, 0, -1).applyQuaternion(camara.quaternion);
    r = rumbo(f.x, f.z);
  } else return;
  const [x, z] = aPantalla(px, pz, W, H);
  const media = (camara.fov * camara.aspect * GRAD) / 2;
  const grad = c.createRadialGradient(x, z, 0, x, z, 46);
  grad.addColorStop(0, "rgba(255,181,71,.55)"); grad.addColorStop(1, "rgba(255,181,71,0)");
  c.fillStyle = grad;
  c.beginPath(); c.moveTo(x, z);
  c.arc(x, z, 46, r - Math.PI / 2 - Math.min(media, 1.2), r - Math.PI / 2 + Math.min(media, 1.2));
  c.closePath(); c.fill();
  c.fillStyle = "#ffb547"; c.strokeStyle = "#1a1205"; c.lineWidth = 2;
  c.beginPath(); c.arc(x, z, 7, 0, Math.PI * 2); c.fill(); c.stroke();
}

mapa.addEventListener("pointerup", (e) => {
  const rect = mapa.getBoundingClientRect();
  const mx = e.clientX - rect.left, mz = e.clientY - rect.top;
  let mejor = null, d = 22;
  for (const n of estado.nodos.values()) {
    const [x, z] = aPantalla(n.x, n.z, rect.width, rect.height);
    const dd = Math.hypot(x - mx, z - mz);
    if (dd < d) { d = dd; mejor = n; }
  }
  if (!mejor) return;
  if (estado.modo === "tour") irA(mejor);
  else if (estado.libre.listo) { estado.libre.pos.x = mejor.x; estado.libre.pos.z = mejor.z; dibujarMapa(); }
});

// ---------------------------------------------------------------- interfaz
function mostrarCarga(si, frac) {
  $("#carga").hidden = !si;
  if (frac != null) $("#carga .barra div").style.width = `${Math.round(frac * 100)}%`;
}
let tAviso;
function aviso(txt, ms = 4500) {
  const el = $("#aviso");
  el.textContent = txt; el.hidden = false;
  clearTimeout(tAviso); tAviso = setTimeout(() => (el.hidden = true), ms);
}
function mostrarFicha(t, p) { const f = $("#ficha"); f.querySelector("h2").textContent = t ?? ""; f.querySelector("p").textContent = p ?? ""; f.hidden = false; }
function ocultarFicha() { $("#ficha").hidden = true; }
const alternar = (el) => (el.hidden = !el.hidden);
document.querySelectorAll(".cerrar").forEach((b) => (b.onclick = () => (b.parentElement.hidden = true)));
$("#btn-ayuda").onclick = () => alternar($("#ayuda"));
$("#btn-mapa").onclick = () => { $("#minimapa").classList.toggle("grande"); setTimeout(dibujarMapa, 260); };
$("#btn-pantalla").onclick = () => {
  const el = document.documentElement;
  if (document.fullscreenElement) document.exitFullscreen();
  else (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el);
};
$("#btn-giro").onclick = alternarGiro;
if (esTactil && "DeviceOrientationEvent" in window) $("#btn-giro").hidden = false;
document.querySelectorAll("#modos button").forEach((b) => (b.onclick = () => cambiarModo(b.dataset.modo)));

async function cambiarModo(modo) {
  if (modo === estado.modo) return;
  if (modo === "libre") {
    try { await prepararLibre(); } catch { return; }
    if (estado.actual && !estado.tour.libre.inicio && !estado.libre.visitado) {
      estado.libre.pos.x = estado.actual.x; estado.libre.pos.z = estado.actual.z; estado.libre.rumbo = estado.rumbo;
    }
    estado.libre.visitado = true;
  } else if (document.pointerLockElement) document.exitPointerLock();
  estado.modo = modo;
  document.body.classList.toggle("modo-libre", modo === "libre");
  document.querySelectorAll("#modos button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.modo === modo)));
  etiquetas.hidden = modo !== "tour";
  $("#estancia").hidden = modo !== "tour";
  $("#btn-giro").hidden = !(esTactil && modo === "tour" && "DeviceOrientationEvent" in window);
  camara.position.set(0, 0, 0);
  camara.fov = estado.fovBase * (modo === "tour" ? estado.zoom ?? 1 : 1);
  camara.updateProjectionMatrix();
  if (modo === "libre" && !estado.libre.ayudaMostrada) {
    estado.libre.ayudaMostrada = true;
    aviso(esTactil ? "Joystick a la izquierda para caminar · arrastra para mirar" : "Clic para capturar el ratón · WASD para caminar · Shift para correr");
  }
  dibujarMapa();
}

function construirGaleria() {
  const g = $("#galeria");
  g.replaceChildren();
  for (const n of estado.nodos.values()) {
    const b = document.createElement("button");
    b.dataset.id = n.id;
    b.setAttribute("role", "listitem");
    b.title = n.nombre;
    if (n.miniatura) { const img = new Image(); img.src = n.miniatura; img.alt = ""; img.loading = "lazy"; b.append(img); }
    const s = document.createElement("span"); s.textContent = n.nombre; b.append(s);
    b.onclick = () => { if (estado.modo !== "tour") cambiarModo("tour"); irA(n); };
    g.append(b);
  }
}

// Editor de orientación: ?editar=1. Con [ y ] se gira la foto hasta alinearla con el plano.
function ajustarYaw(signo, grueso) {
  const n = estado.actual;
  n.yaw = ((n.yaw ?? 0) + signo * (grueso ? 10 : 1) + 540) % 360 - 180;
  matPano.uniforms.yawA.value = n.yaw * GRAD;
  construirPuntos();
  actualizarEditor();
}
function actualizarEditor() {
  if (!estado.editor || !estado.actual) return;
  const ed = $("#editor");
  if (!ed.firstChild) {
    ed.hidden = false;
    ed.innerHTML = `<b>Editor de orientación</b><div class="datos"></div><button>Copiar tour.json</button>`;
    ed.querySelector("button").onclick = () => {
      const limpio = { ...estado.tour, panoramas: estado.tour.panoramas.map(({ textura, vecinos, miniatura, ...p }) => p) };
      navigator.clipboard?.writeText(JSON.stringify(limpio, null, 2)).then(() => aviso("tour.json copiado"), () => aviso("No se pudo copiar"));
    };
  }
  const f = vTmp.set(0, 0, -1).applyQuaternion(camara.quaternion);
  const n = estado.actual;
  const local = ((rumbo(f.x, f.z) / GRAD - (n.yaw ?? 0)) % 360 + 540) % 360 - 180;
  const cab = Math.asin(THREE.MathUtils.clamp(f.y, -1, 1)) / GRAD;
  ed.querySelector(".datos").textContent =
    `${n.id} · yaw del nodo: ${n.yaw ?? 0}° ([ / ], Shift = 10°) · mirada → "yaw": ${local.toFixed(0)}, "pitch": ${cab.toFixed(0)}`;
}

// Arrastrar y soltar un .spz/.ply/.splat/.sog/.glb para probarlo al instante.
addEventListener("dragover", (e) => e.preventDefault());
addEventListener("drop", async (e) => {
  e.preventDefault();
  const f = e.dataTransfer.files[0];
  if (!f) return;
  const bytes = new Uint8Array(await f.arrayBuffer());
  const cfg = estado.tour.libre ?? {};
  if (/\.(glb|gltf)$/i.test(f.name)) {
    const gltf = await new GLTFLoader().parseAsync(bytes.buffer, "");
    escenaLibre.add(gltf.scene, new THREE.HemisphereLight(0xffffff, 0x444444, 2.5));
  } else {
    await cargarSplat({ fileBytes: bytes, fileName: f.name }, { rotacion: cfg.rotacion ?? [180, 0, 0] });
  }
  estado.tour.libre ??= { tipo: "archivo" };
  $('#modos [data-modo="libre"]').hidden = false;
  Object.assign(estado.libre, { listo: true, suelo: false, colisiones: [], limites: null });
  estado.libre.pos.set(0, 0, 2);
  await cambiarModo("libre");
  aviso(`${f.name} cargado. Usa Espacio/C para subir y bajar.`);
});

// ------------------------------------------------------------------- arranque
async function cargarTour() {
  if (params.has("demo")) return structuredClone(DEMO_TOUR);
  const url = params.get("tour") ?? "tour.json";
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch {
    aviso("No se encontró tour.json (¿abriste el archivo sin servidor?). Mostrando la demo.", 6000);
    return structuredClone(DEMO_TOUR);
  }
}

function enlazar(t) {
  estado.nodos.clear();
  t.panoramas ??= [];
  for (const p of t.panoramas) { p.vecinos = []; estado.nodos.set(p.id, p); }
  const radio = t.radio_enlace_auto ?? 4.5;
  for (const p of t.panoramas) {
    if (p.enlaces) {
      for (const id of p.enlaces) {
        const v = estado.nodos.get(id);
        if (!v) { console.warn(`Enlace desconocido ${p.id} → ${id}`); continue; }
        if (!p.vecinos.includes(v)) p.vecinos.push(v);
        if (!v.vecinos.includes(p)) v.vecinos.push(p);
      }
    }
  }
  // Auto-enlaces: si un nodo no declara enlaces, se conecta a los cercanos.
  for (const p of t.panoramas) {
    if (p.enlaces) continue;
    for (const v of t.panoramas) {
      if (v !== p && Math.hypot(v.x - p.x, v.z - p.z) <= radio && !p.vecinos.includes(v)) { p.vecinos.push(v); v.vecinos.push(p); }
    }
  }
}

async function iniciar() {
  const t = await cargarTour();
  estado.tour = t;
  estado.editor = params.has("editar");
  $("#titulo").textContent = t.titulo ?? "Recorrido virtual";
  document.title = t.titulo ?? document.title;
  if (!t.libre) $('#modos [data-modo="libre"]').hidden = true;
  if (t.plano?.imagen) { imgPlano.onload = dibujarMapa; imgPlano.src = t.plano.imagen; }
  enlazar(t);
  if (t.demo) {
    mostrarCarga(true);
    const { generarPanoramas } = await import("./demo.js");
    generarPanoramas(THREE, renderer, t.panoramas, t.altura_camara ?? 1.5);
    mostrarCarga(false);
  }
  construirGaleria();
  redimensionar();
  if (!t.panoramas.length) {
    // Solo modo libre (p. ej. un splat sin fotos 360)
    $('#modos [data-modo="tour"]').hidden = true;
    renderer.setAnimationLoop(bucle);
    return cambiarModo("libre");
  }
  const hash = decodeURIComponent(location.hash.slice(1));
  const inicio = estado.nodos.get(hash) ?? estado.nodos.get(t.inicio) ?? t.panoramas[0];
  estado.rumbo = ((inicio.rumbo_inicial ?? inicio.yaw ?? 0) * GRAD);
  await irA(inicio, { instantaneo: true });
  if (params.get("modo") === "libre" && t.libre) cambiarModo("libre");
  renderer.setAnimationLoop(bucle);
}

let tMapa = 0;
function bucle() {
  reloj.update();
  const dt = Math.min(reloj.getDelta(), 0.1);
  if (estado.modo === "tour") {
    pasoTransicion(dt);
    giroTeclado(dt);
    estado.cabeceo = THREE.MathUtils.clamp(estado.cabeceo, -1.45, 1.45);
    if (estado.giro?.q) camara.quaternion.copy(estado.giro.q);
    else camara.rotation.set(estado.cabeceo, -estado.rumbo, 0);
    camara.updateMatrixWorld();
    renderer.render(escena360, camara);
    actualizarEtiquetas();
    tMapa += dt;
    if (tMapa > 0.1) { tMapa = 0; dibujarMapa(); actualizarEditor(); }
  } else {
    moverLibre(dt);
    camara.updateMatrixWorld();
    renderer.render(escenaLibre, camara);
  }
}

iniciar().catch((e) => { console.error(e); aviso(`Error: ${e.message}`, 10000); });
window.__visor = { estado, irA, cambiarModo, camara }; // útil para depurar / pruebas
