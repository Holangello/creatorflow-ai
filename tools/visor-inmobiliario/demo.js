// Piso de demostración generado por código: permite probar TODO el visor sin fotos.
// Las "fotos 360" se renderizan desde este modelo con una CubeCamera (igual que Corona
// renderiza panoramas esféricos), incluidas 5 variantes de estilo, día/atardecer/noche
// y las máscaras de paredes/suelo para cambiar colores.
import * as THREE from "three";

const ALTO = 2.6;
const GROSOR = 0.12;

// [x1, z1, x2, z2] en metros. Plano de 10 × 8 m.
const MUROS = [
  [0, 0, 10, 0], [10, 0, 10, 8], [10, 8, 0, 8], [0, 8, 0, 0],
  [6, 0, 6, 1.5], [6, 2.5, 6, 4.1], [6, 4.9, 6, 8],
  [6, 4, 10, 4],
  [0, 5, 1, 5], [2, 5, 6, 5],
  [3, 5, 3, 6], [3, 7, 3, 8],
];

const ESTANCIAS = [
  { id: "salon", nombre: { es: "Salón-comedor", en: "Living-dining room" }, poligono: [[0, 0], [6, 0], [6, 5], [0, 5]], madera: true },
  { id: "cocina", nombre: { es: "Cocina", en: "Kitchen" }, poligono: [[6, 0], [10, 0], [10, 4], [6, 4]], madera: false },
  { id: "dormitorio", nombre: { es: "Dormitorio", en: "Bedroom" }, poligono: [[6, 4], [10, 4], [10, 8], [6, 8]], madera: true },
  { id: "pasillo", nombre: { es: "Recibidor", en: "Hall" }, poligono: [[0, 5], [3, 5], [3, 8], [0, 8]], madera: true },
  { id: "bano", nombre: { es: "Baño", en: "Bathroom" }, poligono: [[3, 5], [6, 5], [6, 8], [3, 8]], madera: false },
];

// Paleta por estilo: pared, suelo de madera, suelo cerámico y mobiliario.
const ESTILOS = {
  original: { pared: "#f1ede6", madera: "#b98b5e", ceramica: "#d8d4cc", sofa: "#5b6b7a", madera_mueble: "#3d2f25", tv: "#2c2c2c", textil: "#d7d2ea", alfombra: null, metal: "#888888" },
  nordico: { pared: "#f6f4f0", madera: "#dcc7a3", ceramica: "#ecebe7", sofa: "#c9c8c2", madera_mueble: "#d9c29c", tv: "#f2f2f2", textil: "#e9e4da", alfombra: "#e7e0d2", metal: "#d0d0d0", plantas: true },
  mediterraneo: { pared: "#f8efe0", madera: "#c27a52", ceramica: "#d9c7a6", sofa: "#e9dcc4", madera_mueble: "#8b5e3c", tv: "#f3ead9", textil: "#2f5f8a", alfombra: "#c9b48a", metal: "#a77d4c", plantas: true },
  industrial: { pared: "#8f8a83", madera: "#4b3a2d", ceramica: "#5a5753", sofa: "#6b3f24", madera_mueble: "#5c4630", tv: "#1d1d1d", textil: "#4d4a46", alfombra: "#3b3632", metal: "#1f1f1f" },
  contemporaneo_minimalista: { pared: "#ececec", madera: "#b9b7b2", ceramica: "#c9c7c3", sofa: "#3a3d42", madera_mueble: "#f4f4f4", tv: "#ffffff", textil: "#9ea3a8", alfombra: "#d8d8d8", metal: "#cfcfcf" },
  clasico: { pared: "#e8dac2", madera: "#6e4a2f", ceramica: "#e3dccd", sofa: "#5a2e2e", madera_mueble: "#4a2f1d", tv: "#3b2a1c", textil: "#b08d57", alfombra: "#7a3b2e", metal: "#b08d57", plantas: true },
};

const MOMENTOS = {
  dia: { hemi: [0xfff6e8, 0x6b5a48, 1.5], ventana: "#d6ebff", luces: 1.2, bombilla: "#d8d3c8", fondo: "#cfe6ff" },
  atardecer: { hemi: [0xffc48a, 0x5a4030, 0.75], ventana: "#ffb070", luces: 4, bombilla: "#ffd9a0", fondo: "#ffb070" },
  noche: { hemi: [0x2a3550, 0x0c0c12, 0.18], ventana: "#0d1830", luces: 9, bombilla: "#fff1c9", fondo: "#0d1830" },
};

export const DEMO_TOUR = {
  version: 2,
  demo: true,
  titulo: { es: "Demo · Piso reformado de 2 habitaciones", en: "Demo · Renovated 2-bedroom flat" },
  idioma: "es",
  idiomas: ["es", "en"],
  marca: { nombre: "Inmobiliaria Demo", color: "#c8a24a", web: "https://example.com", pie_legal: { es: "Demo generada por código. Registro de agentes: AICAT 0000", en: "Code-generated demo. Agent registry: AICAT 0000" } },
  agente: { nombre: "Ana Pérez", telefono: "+34 600 111 222", email: "ana@example.com" },
  contacto: { modo: "whatsapp", whatsapp: "34600111222", url_privacidad: "https://example.com/privacidad" },
  inmueble: {
    referencia: "DEMO-001", operacion: "venta", tipo: "piso", estado_obra: "proyecto",
    precio: 349000, moneda: "EUR", gastos_comunidad_mes: 85, ibi_anual: 420,
    superficie_construida: 92, superficie_util: 78, habitaciones: 2, banos: 1, planta: "3ª", ascensor: true,
    orientacion: "Sur-Oeste", ano_construccion: 1998, estado: { es: "Reformado", en: "Renovated" },
    calefaccion: "Aerotermia", aire_acondicionado: true, garaje: false, trastero: true, terraza: 0, piscina: false,
    certificado_energetico: { consumo_letra: "C", consumo_valor: 95.3, emisiones_letra: "C", emisiones_valor: 20.1, en_tramite: false },
    caracteristicas: [
      { es: "Carpintería con rotura de puente térmico", en: "Thermal-break window frames" },
      { es: "Cocina equipada", en: "Fitted kitchen" },
      { es: "Suelo de madera natural", en: "Natural wood flooring" },
    ],
    descripcion: {
      es: "Piso exterior totalmente reformado, luminoso y con distribución eficiente. Salón-comedor con ventanal, cocina independiente equipada, dormitorio amplio con armario y baño completo.",
      en: "Fully renovated, bright exterior flat with an efficient layout. Living-dining room with large window, fitted kitchen, spacious bedroom with wardrobe and full bathroom.",
    },
    direccion: "Calle Ejemplo, Madrid", mostrar_direccion_exacta: false, ubicacion: { lat: 40.4168, lng: -3.7038 },
    aviso_legal: { es: "Estilos de decoración e iluminación generados por ordenador: imágenes orientativas.", en: "Decoration styles and lighting are computer generated: indicative images only." },
  },
  altura_camara: 1.5,
  inicio: "salon",
  norte: 0,
  plantas: [{ id: "p0", nombre: { es: "Planta única", en: "Single floor" }, muros: MUROS }],
  estancias: ESTANCIAS.map(({ id, nombre, poligono }) => ({ id, nombre, planta: "p0", poligono, altura_techo: ALTO })),
  estilos: Object.keys(ESTILOS).map((id) => ({ id })),
  momentos: ["dia", "atardecer", "noche"],
  personalizacion: {
    paredes: [
      { nombre: { es: "Blanco roto", en: "Off-white" }, color: "#efe9df" },
      { nombre: { es: "Gris perla", en: "Pearl grey" }, color: "#d9d9d6" },
      { nombre: { es: "Greige", en: "Greige" }, color: "#cbbfae" },
      { nombre: { es: "Verde salvia", en: "Sage green" }, color: "#a9b8a0" },
      { nombre: { es: "Azul niebla", en: "Mist blue" }, color: "#a8b8c8" },
      { nombre: { es: "Terracota suave", en: "Soft terracotta" }, color: "#d39a7c" },
    ],
    suelos: [
      { nombre: { es: "Roble claro", en: "Light oak" }, color: "#cfb48c" },
      { nombre: { es: "Nogal", en: "Walnut" }, color: "#6e4a2f" },
      { nombre: { es: "Gris cemento", en: "Concrete grey" }, color: "#9b9893" },
    ],
  },
  panoramas: [
    { id: "salon", nombre: { es: "Salón", en: "Living room" }, planta: "p0", x: 3, z: 2.5, yaw: 0, rumbo_inicial: 110, enlaces: ["cocina", "dormitorio", "pasillo"],
      puntos: [{ yaw: -90, pitch: 5, titulo: { es: "Ventanal oeste", en: "West window" }, texto: { es: "Carpintería de aluminio con rotura de puente térmico y doble acristalamiento.", en: "Thermal-break aluminium frames with double glazing." } }] },
    { id: "cocina", nombre: { es: "Cocina", en: "Kitchen" }, planta: "p0", x: 8, z: 2, yaw: 0, enlaces: ["salon"],
      puntos: [{ yaw: 0, pitch: -15, titulo: { es: "Cocina equipada", en: "Fitted kitchen" }, texto: { es: "Encimera de cuarzo, placa de inducción y horno integrado.", en: "Quartz worktop, induction hob and built-in oven." } }] },
    { id: "dormitorio", nombre: { es: "Dormitorio", en: "Bedroom" }, planta: "p0", x: 8, z: 6, yaw: 0, enlaces: ["salon"] },
    { id: "pasillo", nombre: { es: "Recibidor", en: "Hall" }, planta: "p0", x: 1.2, z: 6.6, yaw: 0, enlaces: ["salon", "bano"] },
    { id: "bano", nombre: { es: "Baño", en: "Bathroom" }, planta: "p0", x: 4.5, z: 6.5, yaw: 0, enlaces: ["pasillo"] },
  ],
  guion: [
    { nodo: "salon", rumbo: 250, segundos: 6, texto: { es: "Salón-comedor de 30 m² con ventanal al oeste", en: "30 m² living-dining room with west-facing window" } },
    { nodo: "cocina", rumbo: 60, segundos: 5, texto: { es: "Cocina independiente totalmente equipada", en: "Separate, fully fitted kitchen" } },
    { nodo: "dormitorio", rumbo: 150, segundos: 5, texto: { es: "Dormitorio de 16 m² con armario empotrado", en: "16 m² bedroom with built-in wardrobe" } },
    { nodo: "pasillo", rumbo: 90, segundos: 3 },
    { nodo: "bano", rumbo: 130, segundos: 4, texto: { es: "Baño completo con bañera", en: "Full bathroom with bathtub" } },
  ],
  libre: { tipo: "demo" },
};

function texturaSuelo(color, madera) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = color; g.fillRect(0, 0, 256, 256);
  if (madera) {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = `rgba(0,0,0,${0.03 + (i % 3) * 0.03})`;
      g.fillRect(0, i * 32, 256, 31);
      g.fillStyle = "rgba(0,0,0,.22)"; g.fillRect(0, i * 32 + 31, 256, 1);
      g.fillRect((i * 97) % 256, i * 32, 1, 32);
    }
  } else {
    g.strokeStyle = "rgba(0,0,0,.16)"; g.lineWidth = 2;
    for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function crearPisoDemo() {
  const grupo = new THREE.Group();
  const colisiones = [];
  const roles = {}; // rol → [materiales]
  const mat = (rol, color, extra = {}) => {
    const m = new THREE.MeshLambertMaterial({ color, ...extra });
    (roles[rol] ??= []).push(m);
    return m;
  };
  const marcar = (obj, superficie) => { obj.userData.superficie = superficie; return obj; };

  const suelos = [];
  for (const e of ESTANCIAS) {
    const xs = e.poligono.map((p) => p[0]), zs = e.poligono.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    const w = x1 - x0, d = z1 - z0;
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial());
    suelo.position.set(x0 + w / 2, 0, z0 + d / 2);
    suelo.userData.estancia = e;
    suelos.push(suelo);
    grupo.add(marcar(suelo, "suelo"));
    colisiones.push(suelo);
  }
  const techo = new THREE.Mesh(new THREE.PlaneGeometry(10, 8).rotateX(-Math.PI / 2), mat("techo", 0xfafafa, { side: THREE.BackSide }));
  techo.position.set(5, ALTO, 4);
  grupo.add(marcar(techo, "techo"));

  const matMuro = mat("pared", 0xf1ede6);
  for (const [x1, z1, x2, z2] of MUROS) {
    const largo = Math.hypot(x2 - x1, z2 - z1) + GROSOR;
    const m = new THREE.Mesh(new THREE.BoxGeometry(largo, ALTO, GROSOR), matMuro);
    m.position.set((x1 + x2) / 2, ALTO / 2, (z1 + z2) / 2);
    m.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    grupo.add(marcar(m, "pared"));
    colisiones.push(m);
  }

  // Ventanas (paneles luminosos)
  const matVentana = new THREE.MeshBasicMaterial({ color: 0xd6ebff });
  for (const [x, z, ry, ancho] of [[0.07, 2.5, Math.PI / 2, 2.4], [8, 0.07, 0, 1.6], [9.93, 6, -Math.PI / 2, 1.8], [4.5, 7.93, Math.PI, 0.8]]) {
    const v = new THREE.Mesh(new THREE.PlaneGeometry(ancho, 1.4), matVentana);
    v.position.set(x, 1.5, z); v.rotation.y = ry;
    grupo.add(marcar(v, "ventana"));
  }

  const hemi = new THREE.HemisphereLight(0xfff6e8, 0x6b5a48, 1.5);
  grupo.add(hemi);
  const luces = [];
  const matBombilla = new THREE.MeshBasicMaterial({ color: 0xd8d3c8 });
  for (const [x, z, i] of [[3, 2.5, 1], [8, 2, 0.7], [8, 6, 0.7], [1.5, 6.5, 0.35], [4.5, 6.5, 0.45]]) {
    const l = new THREE.PointLight(0xffd7a8, i, 9, 1.6);
    l.position.set(x, ALTO - 0.35, z);
    l.userData.base = i;
    luces.push(l);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 8), matBombilla);
    b.position.set(x, ALTO - 0.25, z);
    grupo.add(l, marcar(b, "lampara"));
  }

  // Mobiliario (también colisiona)
  const caja = (x, z, w, h, d, rol, y = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(rol, 0xffffff));
    m.position.set(x, y + h / 2, z);
    grupo.add(marcar(m, "mueble"));
    if (y === 0) colisiones.push(m);
    return m;
  };
  caja(1.2, 2.5, 0.9, 0.75, 2.2, "sofa");
  caja(2.4, 2.5, 0.6, 0.4, 1.0, "madera_mueble");
  caja(4.6, 0.35, 1.8, 0.55, 0.4, "tv");
  caja(4.4, 3.8, 1.6, 0.76, 0.9, "madera_mueble");
  caja(9.6, 2, 0.6, 0.9, 3.6, "tv");
  caja(7.5, 0.35, 2.6, 0.9, 0.6, "tv");
  caja(8.4, 6.6, 1.6, 0.5, 2.0, "textil");
  caja(9.75, 4.9, 0.5, 2.2, 1.6, "madera_mueble");
  caja(5.6, 7.2, 0.7, 0.6, 1.4, "ceramica_blanca");
  caja(3.4, 5.4, 0.5, 0.85, 0.7, "ceramica_blanca");
  const alfombras = [caja(2.1, 2.5, 2.0, 0.01, 2.6, "alfombra"), caja(8.4, 6.4, 2.4, 0.01, 2.6, "alfombra")];
  // Plantas
  const plantas = new THREE.Group();
  for (const [x, z] of [[0.4, 0.4], [5.6, 4.5], [6.5, 7.6]]) {
    const maceta = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.35, 16), mat("metal", 0xffffff));
    maceta.position.set(x, 0.175, z);
    const hojas = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), mat("planta", 0x4f7a45));
    hojas.position.set(x, 0.75, z);
    plantas.add(maceta, hojas);
  }
  grupo.add(plantas);
  plantas.traverse((o) => marcar(o, "mueble"));

  const texturas = new Map();
  const tex = (color, madera) => {
    const k = color + madera;
    if (!texturas.has(k)) texturas.set(k, texturaSuelo(color, madera));
    return texturas.get(k);
  };

  /** Aplica estilo, momento y pintura al modelo (lo usan los panoramas y el modo libre). */
  function aplicar({ estilo = "original", momento = "dia", pintura = {} } = {}) {
    const e = ESTILOS[estilo] ?? ESTILOS.original;
    const m = MOMENTOS[momento] ?? MOMENTOS.dia;
    matMuro.color.set(pintura.paredes || e.pared);
    for (const s of suelos) {
      const madera = s.userData.estancia.madera;
      const color = madera ? (pintura.suelos || e.madera) : e.ceramica;
      const t = tex(color, madera);
      const w = s.geometry.parameters.width, d = s.geometry.parameters.height;
      s.material.map = t; t.repeat.set(w / 1.5, d / 1.5); s.material.needsUpdate = true;
    }
    for (const [rol, mats] of Object.entries(roles)) {
      const c = rol === "ceramica_blanca" ? "#f5f5f5" : rol === "planta" ? "#4f7a45" : rol === "techo" ? "#fafafa" : rol === "pared" ? null : e[rol];
      if (c) mats.forEach((x) => x.color.set(c));
    }
    alfombras.forEach((a) => (a.visible = !!e.alfombra));
    plantas.visible = !!e.plantas;
    hemi.color.setHex(m.hemi[0]); hemi.groundColor.setHex(m.hemi[1]); hemi.intensity = m.hemi[2];
    luces.forEach((l) => (l.intensity = l.userData.base * m.luces));
    matVentana.color.set(m.ventana);
    matBombilla.color.set(m.bombilla);
    return m;
  }
  aplicar();
  return { grupo, colisiones, aplicar };
}

/**
 * Prepara los panoramas de la demo: imagen base, miniatura, máscara y variantes perezosas
 * (`variantes[].generar()` renderiza bajo demanda para no hacer 90 renders al arrancar).
 */
export function generarPanoramas(_THREE, renderer, nodos, altura) {
  const escena = new THREE.Scene();
  const piso = crearPisoDemo();
  escena.add(piso.grupo);
  const rtCubo = new THREE.WebGLCubeRenderTarget(1024, { type: THREE.HalfFloatType });
  const cubo = new THREE.CubeCamera(0.05, 60, rtCubo);
  escena.add(cubo);

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { cubo: { value: rtCubo.texture }, srgb: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: /* glsl */ `
      uniform samplerCube cubo; uniform float srgb; varying vec2 vUv;
      const float PI = 3.141592653589793;
      void main() {
        float lon = (vUv.x - 0.5) * 2.0 * PI;
        float lat = (vUv.y - 0.5) * PI;
        vec3 d = vec3(sin(lon) * cos(lat), sin(lat), -cos(lon) * cos(lat));
        vec3 c = textureCube(cubo, d).rgb;
        if (srgb > 0.5) c = pow(c, vec3(1.0 / 2.2));
        gl_FragColor = vec4(c, 1.0);
      }`,
    depthTest: false,
  }));
  const escenaQuad = new THREE.Scene();
  escenaQuad.add(quad);
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const matMascara = { pared: new THREE.MeshBasicMaterial({ color: 0xff0000 }), suelo: new THREE.MeshBasicMaterial({ color: 0x00ff00 }), otro: new THREE.MeshBasicMaterial({ color: 0x000000 }) };

  function renderEquirect(n, { ancho = 2048, srgb = false, tipo = THREE.HalfFloatType } = {}) {
    cubo.position.set(n.x, altura, n.z);
    cubo.update(renderer, escena);
    const rt = new THREE.WebGLRenderTarget(ancho, ancho / 2, { type: tipo, generateMipmaps: false, minFilter: THREE.LinearFilter, depthBuffer: false });
    rt.texture.wrapS = THREE.RepeatWrapping;
    rt.texture.userData.rt = rt; // para liberar el render target completo (no solo la textura)
    quad.material.uniforms.srgb.value = srgb ? 1 : 0;
    const previo = renderer.getRenderTarget();
    renderer.setRenderTarget(rt);
    renderer.render(escenaQuad, ortho);
    renderer.setRenderTarget(previo);
    return rt;
  }

  function miniatura(n) {
    const rt = renderEquirect(n, { ancho: 256, srgb: true, tipo: THREE.UnsignedByteType });
    const px = new Uint8Array(256 * 128 * 4);
    renderer.readRenderTargetPixels(rt, 0, 0, 256, 128, px);
    rt.dispose();
    const c = document.createElement("canvas");
    c.width = 256; c.height = 128;
    const g = c.getContext("2d");
    const img = g.createImageData(256, 128);
    for (let y = 0; y < 128; y++) img.data.set(px.subarray((127 - y) * 1024, (128 - y) * 1024), y * 1024);
    g.putImageData(img, 0, 0);
    return c.toDataURL("image/jpeg", 0.8);
  }

  function mascara(n) {
    const originales = [];
    escena.background = new THREE.Color(0x000000);
    piso.grupo.traverse((o) => {
      if (!o.isMesh) return;
      originales.push([o, o.material]);
      const s = o.userData.superficie;
      o.material = s === "pared" ? matMascara.pared : s === "suelo" ? matMascara.suelo : matMascara.otro;
    });
    const rt = renderEquirect(n, { ancho: 1024, tipo: THREE.UnsignedByteType });
    for (const [o, m] of originales) o.material = m;
    return rt.texture;
  }

  const estado = { clave: "" };
  function ambiente(estilo, momento) {
    const clave = `${estilo}/${momento}`;
    if (estado.clave !== clave) {
      const m = piso.aplicar({ estilo, momento });
      escena.background = new THREE.Color(m.fondo);
      estado.clave = clave;
    }
  }

  for (const n of nodos) {
    ambiente("original", "dia");
    n.miniatura = miniatura(n);
    n.textura = renderEquirect(n).texture;
    n.mascaraTextura = mascara(n);
    estado.clave = "";
    n.variantes = [];
    for (const estilo of Object.keys(ESTILOS)) {
      for (const momento of Object.keys(MOMENTOS)) {
        if (estilo === "original" && momento === "dia") continue;
        const v = {
          estilo: estilo === "original" ? undefined : estilo,
          momento,
          generar: () => { ambiente(estilo, momento); return renderEquirect(n).texture; },
        };
        // Otro mobiliario → otra máscara de paredes/suelo.
        if (estilo !== "original") v.generarMascara = () => { ambiente(estilo, "dia"); const t = mascara(n); estado.clave = ""; return t; };
        n.variantes.push(v);
      }
    }
  }
  ambiente("original", "dia");
}

/**
 * Música ambiental de la demo, sintetizada en el navegador (sin archivos ni derechos de autor):
 * 4 acordes suaves (Cmaj7 · Am9 · Fmaj7 · G6sus) de 4 s en bucle. Devuelve una URL blob: de un WAV.
 */
let musicaCache = null;
export function musicaDemo() {
  musicaCache ??= (async () => {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) return null;
    const sr = 22050, dur = 16;
    const ctx = new OAC(2, sr * dur, sr);
    const filtro = ctx.createBiquadFilter();
    filtro.type = "lowpass"; filtro.frequency.value = 1500; filtro.Q.value = 0.4;
    const maestro = ctx.createGain();
    maestro.gain.value = 0.22;
    filtro.connect(maestro).connect(ctx.destination);
    const nota = (m) => 440 * 2 ** ((m - 69) / 12);
    const acordes = [[48, 55, 59, 64, 67], [45, 52, 59, 60, 64], [41, 48, 57, 60, 64], [43, 50, 57, 60, 62]];
    acordes.forEach((acorde, i) => {
      const t0 = i * 4;
      acorde.forEach((m, j) => {
        for (const [tipo, desafino, vol] of [["sine", 0, 0.5], ["triangle", 6, 0.18]]) {
          const o = ctx.createOscillator();
          o.type = tipo;
          o.frequency.value = nota(m);
          o.detune.value = desafino * (j % 2 ? 1 : -1);
          const g = ctx.createGain();
          const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
          g.gain.setValueAtTime(0, t0);
          g.gain.linearRampToValueAtTime(vol / acorde.length, t0 + 1.4);
          g.gain.setValueAtTime(vol / acorde.length, t0 + 3.6);
          g.gain.linearRampToValueAtTime(0, t0 + 5.2); // se solapa con el acorde siguiente
          if (pan) { pan.pan.value = (j / (acorde.length - 1)) * 1.2 - 0.6; o.connect(g).connect(pan).connect(filtro); }
          else o.connect(g).connect(filtro);
          o.start(t0); o.stop(Math.min(dur, t0 + 5.3));
        }
      });
    });
    // El final del último acorde vuelve a entrar al principio: bucle sin corte.
    const buf = await ctx.startRendering();
    return URL.createObjectURL(wav(buf));
  })();
  return musicaCache;
}

function wav(buf) {
  const canales = buf.numberOfChannels, n = buf.length, sr = buf.sampleRate;
  const datos = new DataView(new ArrayBuffer(44 + n * canales * 2));
  const txt = (o, s) => [...s].forEach((c, i) => datos.setUint8(o + i, c.charCodeAt(0)));
  txt(0, "RIFF"); datos.setUint32(4, 36 + n * canales * 2, true); txt(8, "WAVEfmt ");
  datos.setUint32(16, 16, true); datos.setUint16(20, 1, true); datos.setUint16(22, canales, true);
  datos.setUint32(24, sr, true); datos.setUint32(28, sr * canales * 2, true); datos.setUint16(32, canales * 2, true); datos.setUint16(34, 16, true);
  txt(36, "data"); datos.setUint32(40, n * canales * 2, true);
  const ch = [...Array(canales)].map((_, c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < canales; c++) { datos.setInt16(o, Math.max(-1, Math.min(1, ch[c][i])) * 0x7fff, true); o += 2; }
  return new Blob([datos], { type: "audio/wav" });
}
