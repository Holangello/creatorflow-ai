// Utilidades de las pruebas de extremo a extremo (e2e-*.mjs): informe ✓/✗, esperas por condición, subidas y
// descargas, ZIP y medios de prueba GENERADOS en tiempo de ejecución (no hay binarios en el repositorio).
import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { deflateSync } from "node:zlib";
import { unzipSync, strFromU8 } from "fflate";
import { RAIZ } from "./comun.mjs";

/**
 * El HTML autónomo incrusta dist/visor-autonomo.js (npm run build, carpeta ignorada por git). Si falta o es más antiguo
 * que el código del visor, se recompila para probar el código ACTUAL. → { ok, recompilado, error }
 */
export function asegurarBuild() {
  const dist = join(RAIZ, "dist", "visor-autonomo.js");
  let fuentes = ["index.html", "build.mjs", "visor.js", "visor.css", "paneles.js", "paneles.css", "i18n.js"];
  try {
    const m = JSON.parse(readFileSync(join(RAIZ, "dist", "visor-autonomo.json"), "utf8"));
    fuentes = [...new Set([...fuentes, ...(m.modulos_locales ?? []), ...(m.hojas ?? [])])];
  } catch { /* sin build previo */ }
  const ligero = join(RAIZ, "dist", "visor-autonomo-ligero.js");
  const t = existsSync(dist) && existsSync(ligero) ? Math.min(statSync(dist).mtimeMs, statSync(ligero).mtimeMs) : 0;
  if (t && !fuentes.some((f) => existsSync(join(RAIZ, f)) && statSync(join(RAIZ, f)).mtimeMs > t)) return { ok: true, recompilado: false };
  const r = spawnSync(process.execPath, [join(RAIZ, "build.mjs")], { cwd: RAIZ, encoding: "utf8" });
  return { ok: r.status === 0, recompilado: true, error: r.status === 0 ? null : `${r.stderr || r.stdout}`.slice(-400) };
}

// ------------------------------------------------------------------ informe
/**
 * Lleva la cuenta de las comprobaciones. ok() imprime ✓/✗; pendiente() marca un fallo REAL y conocido del producto
 * (se imprime ⚠ y no hace fallar la prueba; si un día pasa, avisa de que ya se puede convertir en ok()).
 * bloque() aísla cada parte: una excepción se cuenta como ✗ y la prueba sigue con el bloque siguiente.
 */
export function crearInforme(titulo) {
  const t0 = Date.now();
  const fallos = [], pendientes = [];
  let total = 0;
  console.log(`\n▶ ${titulo}`);
  const inf = {
    ok(cond, msg, detalle) {
      total++;
      const bien = !!cond;
      const extra = !bien && detalle != null && detalle !== "" ? `  → ${typeof detalle === "string" ? detalle : JSON.stringify(detalle)}` : "";
      console.log(`${bien ? "✓" : "✗"} ${msg}${extra}`);
      if (!bien) fallos.push(msg);
      return bien;
    },
    pendiente(cond, msg, motivo) {
      total++;
      if (cond) { console.log(`✓ ${msg}  (estaba marcada como pendiente: «${motivo}». Ya funciona: cámbiala a ok())`); return true; }
      console.log(`⚠ PENDIENTE ${msg} — ${motivo}`);
      pendientes.push(`${msg} — ${motivo}`);
      return false;
    },
    /** Ejecuta un bloque; cierra después los contextos que se registren en `cerrarAlFinal` (aunque falle). */
    async bloque(nombre, fn) {
      console.log(`\n· ${nombre}`);
      const t = Date.now();
      try { await fn(); } catch (e) { inf.ok(false, `${nombre}: se interrumpió`, String(e?.message ?? e).split("\n")[0]); }
      for (const c of inf.cerrarAlFinal.splice(0)) await c.close().catch(() => {});
      console.log(`  (${((Date.now() - t) / 1000).toFixed(1)} s)`);
    },
    cerrarAlFinal: [],
    /** Imprime el resumen y devuelve el código de salida (1 si algo falló). */
    fin() {
      const s = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`\n${titulo}: ${total} comprobaciones · ${total - fallos.length - pendientes.length} ✓ · ${fallos.length} ✗ · ${pendientes.length} pendiente(s) · ${s} s`);
      for (const f of fallos) console.log(`  ✗ ${f}`);
      for (const f of pendientes) console.log(`  ⚠ ${f}`);
      console.log(fallos.length ? `${fallos.length} fallo(s).` : "Todo correcto.");
      return fallos.length ? 1 : 0;
    },
  };
  return inf;
}

/** Errores de consola de una página (abrir() de comun.mjs) quitando los esperados. */
export const erroresDe = (p, ignorar = []) => p.errores.filter((e) => !ignorar.some((r) => r.test(e)));

// ------------------------------------------------------------------ esperas e interacción
/** Espera a que fn(arg) sea verdadera en la página (sondeo cada 100 ms). */
export const esperar = (p, fn, arg, ms = 30000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 100 });

/** Abre el selector de archivos con `disparar` (selector o función) y entrega `archivos` ([{name, mimeType, buffer}]). */
export async function subir(p, disparar, archivos) {
  const [fc] = await Promise.all([p.waitForEvent("filechooser", { timeout: 15000 }), typeof disparar === "string" ? p.click(disparar) : disparar()]);
  await fc.setFiles(archivos);
}

/** Lanza una descarga y devuelve { nombre, datos: Buffer }. */
export async function descargar(p, disparar, ms = 90000) {
  const [d] = await Promise.all([p.waitForEvent("download", { timeout: ms }), typeof disparar === "string" ? p.click(disparar) : disparar()]);
  return { nombre: d.suggestedFilename(), datos: readFileSync(await d.path()) };
}

/** ZIP → { ruta: Uint8Array } */
export const leerZip = (buf) => unzipSync(new Uint8Array(buf));
export const jsonDe = (u8) => JSON.parse(strFromU8(u8));
export const textoDe = (u8) => strFromU8(u8);

// ------------------------------------------------------------------ medios generados en Node
const TABLA_CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = TABLA_CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function trozoPNG(tipo, datos) {
  const largo = Buffer.alloc(4); largo.writeUInt32BE(datos.length);
  const td = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([largo, td, crc]);
}
/** PNG RGB de ancho×alto con color(x, y) → [r, g, b]. */
export function png(ancho, alto, color) {
  const fila = ancho * 3 + 1;
  const crudo = Buffer.alloc(fila * alto);
  for (let y = 0; y < alto; y++) for (let x = 0; x < ancho; x++) { const [r, g, b] = color(x, y); const i = y * fila + 1 + x * 3; crudo[i] = r; crudo[i + 1] = g; crudo[i + 2] = b; }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(ancho, 0); ihdr.writeUInt32BE(alto, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), trozoPNG("IHDR", ihdr), trozoPNG("IDAT", deflateSync(crudo)), trozoPNG("IEND", Buffer.alloc(0))]);
}
const hexARgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** Panorama 2:1 en PNG: pared arriba, suelo abajo y rejilla cada 10° (para distinguir hacia dónde se mira). */
export function panoramaPNG(ancho = 1024, { pared = "#e6dccb", suelo = "#8a6a48" } = {}) {
  const alto = ancho / 2, hz = Math.round(alto * 0.58), P = hexARgb(pared), S = hexARgb(suelo), paso = ancho / 36;
  return png(ancho, alto, (x, y) => {
    const base = y < hz ? P : S;
    return x % paso < 1 || y % (alto / 18) < 1 ? base.map((v) => v * 0.8) : base;
  });
}

/** PDF mínimo válido (vectorial, sin fuentes) con `paginas` planos distintos (más tabiques en cada página). */
export function pdfMinimo(paginas = 1) {
  const objetos = [[1, "<< /Type /Catalog /Pages 2 0 R >>"]];
  const hijos = [];
  let n = 3;
  for (let i = 0; i < paginas; i++) {
    const pag = n++, cont = n++;
    hijos.push(`${pag} 0 R`);
    let s = "1 1 1 rg 0 0 595 842 re f 0.1 0.1 0.1 RG 6 w 80 220 435 400 re S 3 w";
    for (let k = 0; k <= i; k++) { const x = (80 + (435 * (k + 1)) / (i + 2)).toFixed(1); s += ` ${x} 220 m ${x} 620 l S`; }
    s += " 80 420 m 300 420 l S";
    objetos.push([pag, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${cont} 0 R /Resources << >> >>`]);
    objetos.push([cont, `<< /Length ${s.length} >>\nstream\n${s}\nendstream`]);
  }
  objetos.splice(1, 0, [2, `<< /Type /Pages /Kids [${hijos.join(" ")}] /Count ${paginas} >>`]);
  let pdf = "%PDF-1.4\n";
  const pos = [];
  for (const [id, cuerpo] of objetos.sort((a, b) => a[0] - b[0])) { pos[id] = pdf.length; pdf += `${id} 0 obj\n${cuerpo}\nendobj\n`; }
  const xref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= objetos.length; id++) pdf += `${String(pos[id]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

/** DXF de una planta de 11,5 × 8,2 m en milímetros: 7 tramos en la capa de muros y mobiliario aparte. */
export function dxfMinimo() {
  const L = [];
  const g = (...pares) => { for (let i = 0; i < pares.length; i += 2) L.push(String(pares[i]), String(pares[i + 1])); };
  const linea = (capa, x1, y1, x2, y2) => g(0, "LINE", 8, capa, 10, x1, 20, y1, 30, 0, 11, x2, 21, y2, 31, 0);
  g(0, "SECTION", 2, "HEADER", 9, "$INSUNITS", 70, 4, 0, "ENDSEC", 0, "SECTION", 2, "ENTITIES");
  g(0, "LWPOLYLINE", 8, "A-MUROS", 90, 4, 70, 1, 10, 0, 20, 0, 10, 11500, 20, 0, 10, 11500, 20, 8200, 10, 0, 20, 8200);
  linea("A-MUROS", 6000, 0, 6000, 4500); linea("A-MUROS", 0, 4500, 11500, 4500); linea("A-MUROS", 4000, 4500, 4000, 8200);
  g(0, "LWPOLYLINE", 8, "MOBILIARIO", 90, 4, 70, 1, 10, 1000, 20, 1000, 10, 3000, 20, 1000, 10, 3000, 20, 1900, 10, 1000, 20, 1900);
  g(0, "CIRCLE", 8, "MOBILIARIO", 10, 8000, 20, 2000, 40, 500);
  g(0, "ENDSEC", 0, "EOF");
  return Buffer.from(L.join("\n") + "\n");
}

/** GLB mínimo válido: un suelo de 10 × 8 m (dos triángulos). */
export function glbMinimo() {
  const bin = Buffer.from(new Float32Array([0, 0, 0, 0, 0, 8, 10, 0, 8, 0, 0, 0, 10, 0, 8, 10, 0, 0]).buffer);
  const gltf = { asset: { version: "2.0", generator: "cre8eight pruebas" }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0, name: "suelo" }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }], buffers: [{ byteLength: bin.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: bin.length }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 6, type: "VEC3", min: [0, 0, 0], max: [10, 0, 8] }] };
  let j = Buffer.from(JSON.stringify(gltf));
  j = Buffer.concat([j, Buffer.alloc((4 - (j.length % 4)) % 4, 0x20)]);
  const cab = Buffer.alloc(12); cab.writeUInt32LE(0x46546c67, 0); cab.writeUInt32LE(2, 4); cab.writeUInt32LE(12 + 8 + j.length + 8 + bin.length, 8);
  const cj = Buffer.alloc(8); cj.writeUInt32LE(j.length, 0); cj.writeUInt32LE(0x4e4f534a, 4);
  const cb = Buffer.alloc(8); cb.writeUInt32LE(bin.length, 0); cb.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([cab, cj, j, cb, bin]);
}

/** WAV PCM 16 bits mono con un tono de 440 Hz. */
export function wavMinimo(segundos = 1, hz = 22050) {
  const n = Math.round(segundos * hz), datos = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) datos.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / hz) * 8000 * Math.min(1, i / 500, (n - i) / 500)), i * 2);
  const c = Buffer.alloc(44);
  c.write("RIFF", 0); c.writeUInt32LE(36 + datos.length, 4); c.write("WAVE", 8); c.write("fmt ", 12); c.writeUInt32LE(16, 16);
  c.writeUInt16LE(1, 20); c.writeUInt16LE(1, 22); c.writeUInt32LE(hz, 24); c.writeUInt32LE(hz * 2, 28); c.writeUInt16LE(2, 32); c.writeUInt16LE(16, 34);
  c.write("data", 36); c.writeUInt32LE(datos.length, 40);
  return Buffer.concat([c, datos]);
}

// ------------------------------------------------------------------ medios generados con canvas (JPEG reales)
/**
 * Dibuja imágenes en una página en blanco y las devuelve como Buffer. especificaciones: { nombre: {tipo, ...} }
 *   tipo "pano": 2:1 con pared/suelo de color uniforme (la varita de máscaras debe poder seleccionarlos),
 *     ventana, puerta, rejilla suave cada 10° y el rótulo de la estancia hacia los cuatro lados.
 *   tipo "foto": foto normal (ancho × alto). tipo "plano": plano de arquitecto en PNG (líneas negras sobre blanco).
 */
export async function dibujar(navegador, especificaciones) {
  const ctx = await navegador.newContext();
  const p = await ctx.newPage();
  const b64 = await p.evaluate(async (specs) => {
    const aB64 = async (b) => { const u = new Uint8Array(await b.arrayBuffer()); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
    const salida = {};
    for (const [nombre, e] of Object.entries(specs)) {
      const c = document.createElement("canvas");
      const g = c.getContext("2d");
      if (e.tipo === "pano") {
        c.width = e.ancho ?? 2048; c.height = c.width / 2;
        const W = c.width, H = c.height, hz = Math.round(H * 0.58);
        g.fillStyle = e.pared; g.fillRect(0, 0, W, hz);
        g.fillStyle = e.suelo; g.fillRect(0, hz, W, H - hz);
        g.fillStyle = "#cfe6ff"; g.fillRect(W * 0.2, H * 0.22, W * 0.08, H * 0.2); // ventana
        g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(W * 0.7, H * 0.25, W * 0.05, H * 0.33); // puerta
        g.strokeStyle = "rgba(0,0,0,.06)"; g.lineWidth = Math.max(1, W / 2048);
        for (let i = 0; i <= 36; i++) { const x = (i * W) / 36; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
        for (let j = 1; j < 18; j++) { const y = (j * H) / 18; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
        g.fillStyle = "rgba(20,20,20,.75)"; g.font = `bold ${Math.round(H / 16)}px sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
        ["N", "E", "S", "O"].forEach((d, k) => g.fillText(`${e.rotulo} · ${d}`, ((k + 0.5) * W) / 4, H * 0.1));
      } else if (e.tipo === "plano") {
        c.width = e.ancho; c.height = e.alto;
        g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
        g.strokeStyle = "#111"; g.lineWidth = 10; g.strokeRect(50, 50, 1100, 760);
        g.lineWidth = 6; g.beginPath(); g.moveTo(700, 50); g.lineTo(700, 480); g.moveTo(50, 480); g.lineTo(1150, 480); g.moveTo(450, 480); g.lineTo(450, 810); g.stroke();
        g.fillStyle = "#444"; g.font = "28px sans-serif"; g.fillText("SALÓN", 300, 260); g.fillText("COCINA", 880, 260); g.fillText("DORMITORIO", 700, 650);
      } else {
        c.width = e.ancho; c.height = e.alto;
        const gr = g.createLinearGradient(0, 0, c.width, c.height); gr.addColorStop(0, e.color ?? "#d9cdb8"); gr.addColorStop(1, "#5b4a3a");
        g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = "#fff"; g.font = `bold ${Math.round(c.height / 10)}px sans-serif`; g.fillText(e.rotulo ?? nombre, c.width * 0.08, c.height * 0.55);
      }
      const tipo = e.formato ?? (e.tipo === "plano" ? "image/png" : "image/jpeg");
      salida[nombre] = await aB64(await new Promise((ok) => c.toBlob(ok, tipo, 0.88)));
    }
    return salida;
  }, especificaciones);
  await ctx.close();
  return Object.fromEntries(Object.entries(b64).map(([k, v]) => [k, Buffer.from(v, "base64")]));
}

/** Archivo para setFiles(). */
export const archivo = (name, buffer, mimeType) => ({ name, buffer, mimeType: mimeType ?? tipoDe(name) });
const tipoDe = (n) => ({ jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", pdf: "application/pdf", glb: "model/gltf-binary", wav: "audio/wav", zip: "application/zip", dxf: "image/vnd.dxf" })[n.split(".").pop().toLowerCase()] ?? "application/octet-stream";

/** Medios habituales de las pruebas del Estudio (fotos 360, variantes, foto normal, render, plano y material). */
export async function mediosEstudio(navegador) {
  const pano = (rotulo, pared, suelo, ancho = 2048) => ({ tipo: "pano", rotulo, pared, suelo, ancho });
  const img = await dibujar(navegador, {
    "salon.jpg": pano("SALÓN", "#e9dcc6", "#8a6a48"),
    "cocina.jpg": pano("COCINA", "#d5e2ea", "#9a9a96"),
    "pasillo.jpg": pano("PASILLO", "#efe6d6", "#7d5c3e"),
    "DJI_20250314_0001.jpg": pano("DJI 0001", "#e4e4e4", "#6b4a32"),
    "dormitorio-grande.jpg": pano("DORMITORIO", "#e3d6ea", "#b48a5e", 4400), // > 4096 px: genera versión móvil
    "salon-nordico.jpg": pano("NÓRDICO", "#f6f4f0", "#dcc7a3"),
    "salon-noche.jpg": pano("NOCHE", "#3a3f55", "#2a2018"),
    "salon-industrial.jpg": pano("INDUSTRIAL", "#8f8a83", "#4b3a2d"),
    "normal.jpg": { tipo: "foto", ancho: 1600, alto: 1200, rotulo: "FOTO 4:3" },
    "render-salon.jpg": { tipo: "foto", ancho: 1920, alto: 1080, rotulo: "RENDER SALÓN", color: "#c9b48a" },
    "plano.png": { tipo: "plano", ancho: 1200, alto: 860 },
  });
  return {
    ...Object.fromEntries(Object.entries(img).map(([k, v]) => [k, archivo(k, v)])),
    "planta.dxf": archivo("planta.dxf", dxfMinimo()),
    "planos.pdf": archivo("planos.pdf", pdfMinimo(2)),
    "memoria-calidades.pdf": archivo("memoria-calidades.pdf", pdfMinimo(1)),
    "nota-simple-privada.pdf": archivo("nota-simple-privada.pdf", pdfMinimo(1)),
    "modelo.glb": archivo("modelo.glb", glbMinimo()),
    "musica-prueba.wav": archivo("musica-prueba.wav", wavMinimo(1)),
  };
}
