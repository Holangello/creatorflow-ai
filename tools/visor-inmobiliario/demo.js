// Piso de demostración generado por código: permite probar el visor sin fotos.
// Las "fotos 360" de la demo se renderizan desde este modelo con una CubeCamera,
// igual que Corona/V-Ray renderizan panoramas esféricos desde un modelo 3D.
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
  { x0: 0, z0: 0, x1: 6, z1: 5, color: "#b98b5e", veta: true },   // salón
  { x0: 6, z0: 0, x1: 10, z1: 4, color: "#d8d4cc", veta: false },  // cocina
  { x0: 6, z0: 4, x1: 10, z1: 8, color: "#a77a52", veta: true },   // dormitorio
  { x0: 0, z0: 5, x1: 3, z1: 8, color: "#b98b5e", veta: true },    // pasillo
  { x0: 3, z0: 5, x1: 6, z1: 8, color: "#e6eef0", veta: false },   // baño
];

export const DEMO_TOUR = {
  demo: true,
  titulo: "Demo · Piso de 3 estancias (generado por código)",
  altura_camara: 1.5,
  inicio: "salon",
  muros: MUROS,
  panoramas: [
    { id: "salon", nombre: "Salón", x: 3, z: 2.5, yaw: 0, rumbo_inicial: 110, enlaces: ["cocina", "dormitorio", "pasillo"],
      puntos: [{ yaw: -90, pitch: 5, titulo: "Ventanal orientación oeste", texto: "Carpintería de aluminio con rotura de puente térmico y doble acristalamiento." }] },
    { id: "cocina", nombre: "Cocina", x: 8, z: 2, yaw: 0, enlaces: ["salon"],
      puntos: [{ yaw: 0, pitch: -15, titulo: "Cocina equipada", texto: "Encimera de cuarzo, placa de inducción y horno integrado." }] },
    { id: "dormitorio", nombre: "Dormitorio", x: 8, z: 6, yaw: 0, enlaces: ["salon"] },
    { id: "pasillo", nombre: "Pasillo", x: 1.2, z: 6.6, yaw: 0, enlaces: ["salon", "bano"] },
    { id: "bano", nombre: "Baño", x: 4.5, z: 6.5, yaw: 0, enlaces: ["pasillo"] },
  ],
  libre: { tipo: "demo" },
};

function texturaSuelo(color, veta) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = color; g.fillRect(0, 0, 256, 256);
  if (veta) {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = `rgba(0,0,0,${0.04 + (i % 3) * 0.03})`;
      g.fillRect(0, i * 32, 256, 31);
      g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(0, i * 32 + 31, 256, 1);
      g.fillRect(((i * 97) % 256), i * 32, 1, 32);
    }
  } else {
    g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = 2;
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
  const matMuro = new THREE.MeshLambertMaterial({ color: 0xf1ede6 });
  const matTecho = new THREE.MeshLambertMaterial({ color: 0xfafafa, side: THREE.BackSide });

  for (const e of ESTANCIAS) {
    const w = e.x1 - e.x0, d = e.z1 - e.z0;
    const tex = texturaSuelo(e.color, e.veta);
    tex.repeat.set(w / 1.5, d / 1.5);
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: tex }));
    suelo.position.set(e.x0 + w / 2, 0, e.z0 + d / 2);
    grupo.add(suelo);
    colisiones.push(suelo);
  }
  const techo = new THREE.Mesh(new THREE.PlaneGeometry(10, 8).rotateX(-Math.PI / 2), matTecho);
  techo.position.set(5, ALTO, 4);
  grupo.add(techo);

  for (const [x1, z1, x2, z2] of MUROS) {
    const largo = Math.hypot(x2 - x1, z2 - z1) + GROSOR;
    const m = new THREE.Mesh(new THREE.BoxGeometry(largo, ALTO, GROSOR), matMuro);
    m.position.set((x1 + x2) / 2, ALTO / 2, (z1 + z2) / 2);
    m.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    grupo.add(m);
    colisiones.push(m);
  }

  // Ventanas (paneles luminosos) y luces
  const matCielo = new THREE.MeshBasicMaterial({ color: 0xcfe6ff });
  const ventanas = [[0.07, 2.5, Math.PI / 2, 2.4], [8, 0.07, 0, 1.6], [9.93, 6, -Math.PI / 2, 1.8], [4.5, 7.93, Math.PI, 0.8]];
  for (const [x, z, ry, ancho] of ventanas) {
    const v = new THREE.Mesh(new THREE.PlaneGeometry(ancho, 1.4), matCielo);
    v.position.set(x, 1.5, z); v.rotation.y = ry;
    grupo.add(v);
  }
  grupo.add(new THREE.HemisphereLight(0xfff6e8, 0x6b5a48, 1.4));
  for (const [x, z, i] of [[3, 2.5, 9], [8, 2, 6], [8, 6, 6], [1.5, 6.5, 3], [4.5, 6.5, 4]]) {
    const l = new THREE.PointLight(0xffe2b8, i, 9, 1.6);
    l.position.set(x, ALTO - 0.3, z);
    grupo.add(l);
  }

  // Mobiliario básico (también hace de colisión)
  const caja = (x, z, w, h, d, color) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
    m.position.set(x, h / 2, z);
    grupo.add(m); colisiones.push(m);
    return m;
  };
  caja(1.2, 2.5, 0.9, 0.75, 2.2, 0x5b6b7a);   // sofá
  caja(2.4, 2.5, 0.6, 0.4, 1.0, 0x3d2f25);    // mesa baja
  caja(4.6, 0.35, 1.8, 1.1, 0.4, 0x2c2c2c);   // mueble TV
  caja(4.4, 3.8, 1.6, 0.76, 0.9, 0x8a6a4a);   // mesa comedor
  caja(9.6, 2, 0.6, 0.9, 3.6, 0xe9e4da);      // bancada cocina
  caja(7.5, 0.35, 2.6, 0.9, 0.6, 0xe9e4da);   // bancada cocina 2
  caja(8.4, 6.6, 1.6, 0.55, 2.0, 0xd7d2ea);   // cama
  caja(9.75, 4.9, 0.5, 2.2, 1.6, 0x9b7b5b);   // armario
  caja(5.6, 7.2, 0.7, 0.6, 1.4, 0xffffff);    // bañera
  caja(3.4, 5.4, 0.5, 0.85, 0.7, 0xffffff);   // lavabo

  return { grupo, colisiones };
}

// Renderiza un panorama equirectangular (2:1) por nodo desde el modelo demo.
export function generarPanoramas(_THREE, renderer, nodos, altura) {
  const escena = new THREE.Scene();
  escena.background = new THREE.Color(0xcfe6ff);
  escena.add(crearPisoDemo().grupo);
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
  const rtMini = new THREE.WebGLRenderTarget(256, 128);
  const px = new Uint8Array(256 * 128 * 4);

  for (const n of nodos) {
    cubo.position.set(n.x, altura, n.z);
    cubo.update(renderer, escena);
    const rt = new THREE.WebGLRenderTarget(2048, 1024, { type: THREE.HalfFloatType, generateMipmaps: false, minFilter: THREE.LinearFilter });
    rt.texture.wrapS = THREE.RepeatWrapping;
    quad.material.uniforms.srgb.value = 0;
    renderer.setRenderTarget(rt);
    renderer.render(escenaQuad, ortho);

    // miniatura para la galería
    quad.material.uniforms.srgb.value = 1;
    renderer.setRenderTarget(rtMini);
    renderer.render(escenaQuad, ortho);
    renderer.readRenderTargetPixels(rtMini, 0, 0, 256, 128, px);
    const c = document.createElement("canvas");
    c.width = 256; c.height = 128;
    const img = c.getContext("2d").createImageData(256, 128);
    for (let y = 0; y < 128; y++) img.data.set(px.subarray((127 - y) * 1024, (128 - y) * 1024), y * 1024);
    c.getContext("2d").putImageData(img, 0, 0);
    n.miniatura = c.toDataURL("image/jpeg", 0.8);
    n.textura = rt.texture;
  }
  renderer.setRenderTarget(null);
  rtCubo.dispose();
  rtMini.dispose();
}
