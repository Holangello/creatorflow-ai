// Utilidades del Estudio sin DOM (se usan también desde el Web Worker).

/** Lee ancho y alto de un JPEG/PNG/WebP sin decodificarlo (solo cabeceras). */
export async function dimensiones(blob) {
  const cab = new Uint8Array(await blob.slice(0, 32).arrayBuffer());
  // PNG
  if (cab[0] === 0x89 && cab[1] === 0x50) {
    const dv = new DataView(cab.buffer);
    return { w: dv.getUint32(16), h: dv.getUint32(20) };
  }
  // WebP (VP8X / VP8 / VP8L)
  if (cab[0] === 0x52 && cab[8] === 0x57) {
    const b = new Uint8Array(await blob.slice(0, 40).arrayBuffer());
    const tipo = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (tipo === "VP8X") return { w: 1 + (b[24] | b[25] << 8 | b[26] << 16), h: 1 + (b[27] | b[28] << 8 | b[29] << 16) };
    if (tipo === "VP8 ") return { w: (b[26] | b[27] << 8) & 0x3fff, h: (b[28] | b[29] << 8) & 0x3fff };
    if (tipo === "VP8L") { const v = b[21] | b[22] << 8 | b[23] << 16 | b[24] << 24; return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
  }
  // JPEG: recorre los marcadores hasta el SOFn (puede haber un EXIF/XMP grande antes).
  if (cab[0] === 0xff && cab[1] === 0xd8) {
    let pos = 2;
    const tam = blob.size;
    while (pos < tam) {
      const m = new Uint8Array(await blob.slice(pos, pos + 10).arrayBuffer());
      if (m[0] !== 0xff) { pos++; continue; }
      const marca = m[1];
      if (marca === 0xff) { pos++; continue; }
      if (marca === 0xd8 || marca === 0x01 || (marca >= 0xd0 && marca <= 0xd7)) { pos += 2; continue; }
      const largo = (m[2] << 8) | m[3];
      if ((marca >= 0xc0 && marca <= 0xcf) && marca !== 0xc4 && marca !== 0xc8 && marca !== 0xcc) {
        return { w: (m[7] << 8) | m[8], h: (m[5] << 8) | m[6] };
      }
      pos += 2 + largo;
    }
  }
  return null;
}

// ------------------------------------------------------------------ CRC32 + ZIP
let tablaCRC;
export function crc32(datos, crc = 0) {
  if (!tablaCRC) {
    tablaCRC = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; tablaCRC[n] = c >>> 0; }
  }
  crc = ~crc;
  for (let i = 0; i < datos.length; i++) crc = tablaCRC[(crc ^ datos[i]) & 0xff] ^ (crc >>> 8);
  return ~crc >>> 0;
}

/** ZIP sin compresión (las JPG ya están comprimidas). entradas: [{ruta, datos: Uint8Array}] */
export function zipAlmacenado(entradas) {
  const enc = new TextEncoder();
  const partes = [], central = [];
  let desp = 0;
  for (const { ruta, datos } of entradas) {
    const nombre = enc.encode(ruta);
    const crc = crc32(datos);
    const loc = new DataView(new ArrayBuffer(30));
    loc.setUint32(0, 0x04034b50, true); loc.setUint16(4, 20, true); loc.setUint16(6, 0x0800, true);
    loc.setUint32(14, crc, true); loc.setUint32(18, datos.length, true); loc.setUint32(22, datos.length, true);
    loc.setUint16(26, nombre.length, true);
    partes.push(new Uint8Array(loc.buffer), nombre, datos);
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true);
    cen.setUint32(16, crc, true); cen.setUint32(20, datos.length, true); cen.setUint32(24, datos.length, true);
    cen.setUint16(28, nombre.length, true); cen.setUint32(42, desp, true);
    central.push(new Uint8Array(cen.buffer), nombre);
    desp += 30 + nombre.length + datos.length;
  }
  const tamCentral = central.reduce((s, p) => s + p.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, entradas.length, true); fin.setUint16(10, entradas.length, true);
  fin.setUint32(12, tamCentral, true); fin.setUint32(16, desp, true);
  return new Blob([...partes, ...central, new Uint8Array(fin.buffer)], { type: "application/zip" });
}

/** Lee un ZIP (File/Blob) entrada a entrada sin cargarlo entero en memoria. → Map<ruta, Blob> */
export async function leerZip(archivo) {
  const tam = archivo.size;
  const colaLen = Math.min(tam, 65557);
  const cola = new DataView(await archivo.slice(tam - colaLen).arrayBuffer());
  let eocd = -1;
  for (let i = colaLen - 22; i >= 0; i--) if (cola.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("El archivo no es un ZIP válido");
  let n = cola.getUint16(eocd + 10, true);
  let tamCen = cola.getUint32(eocd + 12, true);
  let despCen = cola.getUint32(eocd + 16, true);
  if (despCen === 0xffffffff || n === 0xffff) {
    // ZIP64
    const loc = cola.getUint32(eocd - 20, true) === 0x07064b50 ? Number(cola.getBigUint64(eocd - 12, true)) : -1;
    if (loc < 0) throw new Error("ZIP64 no soportado");
    const z = new DataView(await archivo.slice(loc, loc + 56).arrayBuffer());
    n = Number(z.getBigUint64(32, true)); tamCen = Number(z.getBigUint64(40, true)); despCen = Number(z.getBigUint64(48, true));
  }
  const cen = new DataView(await archivo.slice(despCen, despCen + tamCen).arrayBuffer());
  const dec = new TextDecoder();
  const salida = new Map();
  let p = 0;
  for (let i = 0; i < n; i++) {
    if (cen.getUint32(p, true) !== 0x02014b50) break;
    const metodo = cen.getUint16(p + 10, true);
    let comp = cen.getUint32(p + 20, true);
    let local = cen.getUint32(p + 42, true);
    const ln = cen.getUint16(p + 28, true), le = cen.getUint16(p + 30, true), lc = cen.getUint16(p + 32, true);
    const ruta = dec.decode(new Uint8Array(cen.buffer, p + 46, ln));
    // campo extra ZIP64
    let e = p + 46 + ln;
    const finExtra = e + le;
    while (e < finExtra) {
      const idx = cen.getUint16(e, true), lx = cen.getUint16(e + 2, true);
      if (idx === 1) {
        let q = e + 4;
        if (cen.getUint32(p + 24, true) === 0xffffffff) q += 8;
        if (comp === 0xffffffff) { comp = Number(cen.getBigUint64(q, true)); q += 8; }
        if (local === 0xffffffff) local = Number(cen.getBigUint64(q, true));
      }
      e += 4 + lx;
    }
    p += 46 + ln + le + lc;
    if (ruta.endsWith("/")) continue;
    const cabLocal = new DataView(await archivo.slice(local, local + 30).arrayBuffer());
    const ini = local + 30 + cabLocal.getUint16(26, true) + cabLocal.getUint16(28, true);
    const trozo = archivo.slice(ini, ini + comp);
    let blob;
    if (metodo === 0) blob = trozo;
    else if (metodo === 8) blob = await new Response(trozo.stream().pipeThrough(new DecompressionStream("deflate-raw"))).blob();
    else throw new Error(`Compresión no soportada en ${ruta}`);
    salida.set(ruta, new Blob([blob], { type: tipoMime(ruta) }));
  }
  return salida;
}

export function tipoMime(ruta) {
  const ext = ruta.split(".").pop().toLowerCase();
  return { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", svg: "image/svg+xml", json: "application/json",
    pdf: "application/pdf", mp4: "video/mp4", webm: "video/webm", glb: "model/gltf-binary", html: "text/html", js: "text/javascript", css: "text/css" }[ext] ?? "application/octet-stream";
}

export function slug(texto) {
  return String(texto ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "pano";
}

/** Rumbo en grados (0 = arriba del plano, horario) de un vector (dx, dz). */
export const rumboDe = (dx, dz) => Math.atan2(dx, -dz) * 180 / Math.PI;
export const norm180 = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
export const norm360 = (a) => ((a % 360) + 360) % 360;

/** Área (m²) de un polígono [[x,z],…] (fórmula del cordón de zapato). */
export function area(pol) {
  let s = 0;
  for (let i = 0; i < pol.length; i++) { const [x1, z1] = pol[i], [x2, z2] = pol[(i + 1) % pol.length]; s += x1 * z2 - x2 * z1; }
  return Math.abs(s) / 2;
}
export function centroide(pol) {
  let a = 0, cx = 0, cz = 0;
  for (let i = 0; i < pol.length; i++) {
    const [x1, z1] = pol[i], [x2, z2] = pol[(i + 1) % pol.length];
    const f = x1 * z2 - x2 * z1; a += f; cx += (x1 + x2) * f; cz += (z1 + z2) * f;
  }
  if (Math.abs(a) < 1e-9) return pol.reduce((s, [x, z]) => [s[0] + x / pol.length, s[1] + z / pol.length], [0, 0]);
  return [cx / (3 * a), cz / (3 * a)];
}
export function dentro([x, z], pol) {
  let c = false;
  for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) {
    const [xi, zi] = pol[i], [xj, zj] = pol[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}
export const redondear = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
