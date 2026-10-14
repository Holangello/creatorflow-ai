// Exportadores del visor inmobiliario: lo que el cliente descarga para subir a idealista, Fotocasa, su web, redes…
//
//   exportarZIP()            carpeta autohospedable (tour.json + fotos + visor) → subir a un hosting y compartir el enlace
//   exportarHTMLAutonomo()   UN archivo .html que funciona offline con doble clic (fotos incrustadas en data:)
//   grabarVideo()            vídeo MP4/WebM de la visita guiada (16:9, 9:16 Reels/TikTok/Shorts, 1:1) con marca
//   jpegConGPano()           foto 360 con metadatos GPano → Facebook, Google y portales la muestran como 360
//   exportarPlano()          plano PNG a escala de impresión: estancias, m², cotas, escala, norte, marca
//   abrirFichaImprimible()   dossier A4 (guardar como PDF con Imprimir) con plano, datos, certificado energético y QR
//   descargar()              utilidad para forzar la descarga de un Blob
//
// Contrato de datos: ESQUEMA.md (tour.json v2, API window.visor). Todas las funciones aceptan en `opciones`:
//   base     URL base para resolver rutas relativas del tour (por defecto location.href)
//   archivos Map<rutaRelativa, Blob> con recursos que aún no están publicados (p. ej. desde el Estudio); tienen
//            prioridad sobre la red. Las rutas del tour también pueden ser URLs blob: o data:.
// Sin dependencias de CDN en tiempo de ejecución: fflate y el generador de QR están en vendor/.
import { qrSVG } from "./vendor/qr.js";

const MODULO = import.meta.url;
const MB = 1024 * 1024;

// ======================================================================= utilidades comunes

/** Resuelve un Texto ("cadena" | {es, en, …}) a un idioma. */
export function texto(v, idioma = "es") {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object") return v[idioma] ?? v.es ?? Object.values(v).find((x) => typeof x === "string") ?? "";
  return String(v);
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const esURLAbsoluta = (r) => /^[a-z][a-z0-9+.-]*:/i.test(r); // http:, https:, blob:, data:, file:…
const esBlobOData = (r) => /^(blob|data):/i.test(r);
const baseDe = (o) => o?.base ?? (typeof location !== "undefined" ? location.href : MODULO);
const normalizar = (r) => r.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "").split("/").filter((s) => s && s !== "." && s !== "..").join("/");

function resolverURL(ruta, base) {
  if (esURLAbsoluta(ruta)) return ruta;
  return new URL(ruta, base).href;
}

/** Obtiene un recurso del tour como Blob: Map `archivos` → blob:/data: → fetch relativo a `base`. */
export async function obtenerBlob(ruta, { archivos, base } = {}) {
  if (ruta instanceof Blob) return ruta;
  if (archivos) {
    if (archivos.has(ruta)) return archivos.get(ruta);
    const n = normalizar(ruta);
    if (archivos.has(n)) return archivos.get(n);
    if (archivos.has("./" + n)) return archivos.get("./" + n);
  }
  const url = resolverURL(ruta, base ?? baseDe());
  const r = await fetch(url);
  if (!r.ok) throw new Error(`No se pudo obtener ${ruta} (HTTP ${r.status})`);
  return r.blob();
}

/** Copia "limpia" (JSON) del tour: quita referencias circulares y objetos de runtime (vecinos, texturas…). */
function limpiarTour(tour) {
  const vistos = new WeakSet();
  return JSON.parse(JSON.stringify(tour, function (k, v) {
    if (k === "vecinos" || k === "textura" || k.startsWith("_")) return undefined;
    if (v && typeof v === "object") {
      if (v.isTexture || v.isObject3D || v.isMaterial || (typeof HTMLElement !== "undefined" && v instanceof HTMLElement)) return undefined;
      if (vistos.has(v)) return undefined;
      vistos.add(v);
    }
    return v;
  }));
}

/**
 * Copia del tour y de los archivos sin nada privado: documentación con `publico: false`, la carpeta `estudio/`
 * (proyecto de trabajo) ni metadatos internos (claves que empiezan por "_").
 */
export function soloPublico(tour, archivos = new Map()) {
  const t = limpiarTour(tour);
  const privadas = new Set((t.documentacion ?? []).filter((d) => !d.publico).map((d) => normalizar(d.archivo ?? "")).filter(Boolean));
  t.documentacion = (t.documentacion ?? []).filter((d) => d.publico);
  if (!t.documentacion.length) delete t.documentacion;
  const filtrados = new Map();
  for (const [ruta, blob] of archivos ?? []) {
    const r = normalizar(ruta);
    if (r.startsWith("estudio/") || privadas.has(r)) continue;
    filtrados.set(ruta, blob);
  }
  return { tour: t, archivos: filtrados };
}

/** Lista de referencias a archivos dentro del tour: { obj, clave, tipo, ruta }. */
function referencias(t) {
  const refs = [];
  const add = (obj, clave, tipo) => { if (obj && typeof obj[clave] === "string" && obj[clave]) refs.push({ obj, clave, tipo, ruta: obj[clave] }); };
  add(t.marca, "logo", "logo");
  add(t.agente, "foto", "foto");
  add(t.plano, "imagen", "plano");
  for (const pl of t.plantas ?? []) add(pl.plano, "imagen", "plano");
  for (const p of t.panoramas ?? []) {
    add(p, "imagen", "pano"); add(p, "imagen_movil", "pano_movil"); add(p, "miniatura", "mini"); add(p, "mascara", "mascara");
    for (const pt of p.puntos ?? []) { add(pt, "imagen", "foto"); }
    for (const v of p.variantes ?? []) { add(v, "imagen", "pano"); add(v, "imagen_movil", "pano_movil"); add(v, "mascara", "mascara"); }
  }
  for (const d of t.inmueble?.documentos ?? []) add(d, "url", "doc");
  for (const g of t.galeria ?? []) add(g, "imagen", "foto");
  add(t.audio?.musica, "archivo", "audio");
  for (const d of t.documentacion ?? []) if (d.publico) add(d, "archivo", "doc");
  add(t.libre, "url", "libre");
  add(t.libre, "colisionador", "libre");
  return refs;
}

const EXT_POR_TIPO = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif", "image/svg+xml": "svg",
  "application/pdf": "pdf", "model/gltf-binary": "glb", "video/mp4": "mp4", "video/webm": "webm",
  "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/aac": "aac", "audio/ogg": "ogg", "audio/wav": "wav", "audio/x-wav": "wav", "audio/webm": "weba",
};
const extDe = (blob, ruta = "") => EXT_POR_TIPO[blob.type?.split(";")[0]] ?? (ruta.match(/\.([a-z0-9]{2,5})(?:[?#]|$)/i)?.[1]?.toLowerCase() ?? "bin");

function blobADataURL(blob) {
  return new Promise((ok, mal) => {
    const fr = new FileReader();
    fr.onload = () => ok(fr.result);
    fr.onerror = () => mal(fr.error);
    fr.readAsDataURL(blob);
  });
}

/** Carga una imagen (también SVG) como HTMLImageElement decodificado. */
async function cargarImagen(ruta, opciones) {
  const blob = await obtenerBlob(ruta, opciones);
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
}

function lienzo(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}
const aBlob = (c, tipo = "image/png", calidad) => new Promise((ok, mal) => c.toBlob((b) => (b ? ok(b) : mal(new Error("No se pudo codificar la imagen"))), tipo, calidad));

/**
 * Reescala una imagen para que su lado mayor sea ≤ maxLado. Devuelve el Blob original si no hace falta tocarla.
 * `tipo`: "auto" mantiene PNG/WebP con transparencia como PNG y el resto pasa a JPEG.
 */
async function reescalar(blob, maxLado, { tipo = "auto", calidad = 0.86 } = {}) {
  if (blob.type === "image/svg+xml") return blob;
  let bmp;
  try { bmp = await createImageBitmap(blob); } catch { return blob; }
  const { width: w, height: h } = bmp;
  const k = Math.min(1, maxLado / Math.max(w, h));
  const destino = tipo === "auto" ? (blob.type === "image/png" || blob.type === "image/gif" ? "image/png" : "image/jpeg") : tipo;
  if (k === 1 && (blob.type === destino || (destino === "image/jpeg" && blob.type === "image/webp"))) { bmp.close?.(); return blob; }
  const W = Math.max(1, Math.round(w * k)), H = Math.max(1, Math.round(h * k));
  const c = lienzo(W, H);
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(bmp, 0, 0, W, H);
  bmp.close?.();
  return aBlob(c, destino, destino === "image/jpeg" ? calidad : undefined);
}

function formatoPrecio(n, moneda = "EUR", idioma = "es") {
  if (n == null || n === "") return "";
  try { return new Intl.NumberFormat(idioma === "es" ? "es-ES" : idioma, { style: "currency", currency: moneda, maximumFractionDigits: 0 }).format(n); }
  catch { return `${n} ${moneda}`; }
}
const num = (n, dec = 0, idioma = "es") => new Intl.NumberFormat(idioma === "es" ? "es-ES" : idioma, { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);

/** Precio con sufijo /mes en alquiler. */
function precioTexto(t, idioma) {
  const i = t.inmueble ?? {};
  if (i.precio == null) return "";
  return formatoPrecio(i.precio, i.moneda ?? "EUR", idioma) + (i.operacion === "alquiler" ? (idioma === "es" ? "/mes" : "/month") : "");
}

/** Área (m²) de un polígono [[x,z],…] con la fórmula del lazo (shoelace). */
export function areaPoligono(pol) {
  let s = 0;
  for (let i = 0; i < pol.length; i++) {
    const [x1, z1] = pol[i], [x2, z2] = pol[(i + 1) % pol.length];
    s += x1 * z2 - x2 * z1;
  }
  return Math.abs(s) / 2;
}

// ======================================================================= descargar

/** Fuerza la descarga de un Blob con el nombre indicado. */
export function descargar(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ======================================================================= ZIP autohospedable

const ARCHIVOS_VISOR = [
  "index.html", "visor.js", "visor.css", "paneles.js", "paneles.css", "i18n.js", "demo.js", "exportar.js", "vendor/qr.js", "vendor/fflate.js",
  "util.js", "plano.js", "guion.js", "medicion.js", "maqueta.js",
];
const SIN_COMPRIMIR = /\.(jpe?g|png|webp|avif|gif|mp4|webm|mov|sog|spz|ksplat|glb|zip|pdf|woff2?|mp3|m4a|aac|ogg|opus)$/i;

function leeme(t, idioma) {
  const titulo = texto(t.titulo, idioma) || "Recorrido virtual";
  return `RECORRIDO VIRTUAL 3D · ${titulo}
${"=".repeat(Math.min(78, 22 + titulo.length))}

Esta carpeta es un recorrido virtual completo listo para publicar en tu web.
Contenido:
  index.html, visor.js, visor.css…   el visor (no hace falta instalar nada)
  tour.json                          los datos del recorrido (estancias, textos, precio, contacto…)
  panos/, marca/, recursos/…         fotos 360, logotipo, plano y documentos

1) SUBIRLO A TU HOSTING
   - Descomprime el ZIP y sube la carpeta COMPLETA (respetando las subcarpetas) a tu hosting:
     por FTP (FileZilla), con el administrador de archivos de cPanel/Plesk, o arrastrándola a
     Netlify Drop (https://app.netlify.com/drop), Cloudflare Pages o GitHub Pages.
   - Ejemplo: si la subes como "tours/calle-mayor-12", el enlace será
       https://www.tu-dominio.com/tours/calle-mayor-12/
   - Usa HTTPS: sin él, el giroscopio del móvil y el modo pantalla completa no funcionan.
   - Importante: index.html NO funciona con doble clic desde el ordenador (el navegador bloquea la
     lectura de tour.json fuera de un servidor). Para enviar el recorrido como un único archivo que
     se abre con doble clic, usa la opción "HTML autónomo" del exportador.
   - Para probarlo en local: en esta carpeta ejecuta  python3 -m http.server 8000
     y abre http://localhost:8000/

2) COMPARTIR EL ENLACE
   - Comparte la URL por WhatsApp, email o redes. Puedes abrir una estancia concreta añadiendo
     #id-de-la-estancia al final (p. ej. .../calle-mayor-12/#cocina) o el paseo libre con ?modo=libre

3) INSERTARLO EN TU WEB (iframe)
   Pega este código en la ficha del inmueble (WordPress: bloque "HTML personalizado"):

   <iframe src="https://www.tu-dominio.com/tours/calle-mayor-12/?embed"
           width="100%" height="600" style="border:0;max-width:100%"
           allow="fullscreen; gyroscope; accelerometer; xr-spatial-tracking; clipboard-write"
           allowfullscreen loading="lazy" title="${esc(titulo)}"></iframe>

4) PORTALES (idealista, Fotocasa, habitaclia, pisos.com…)
   - Si el portal tiene un campo de "visita virtual" / "tour virtual" que acepta enlaces, pega la URL
     pública del recorrido (según el portal y tu plan, puede que solo admita ciertos proveedores).
   - Además puedes subir:
       · el VÍDEO de la visita guiada (MP4, opción "Grabar vídeo"; 9:16 para Reels/TikTok/Shorts),
       · las FOTOS 360 en JPG con metadatos GPano (Facebook y Google las muestran como 360),
       · el PLANO en PNG y la FICHA en PDF.

5) ACTUALIZAR
   Para cambiar textos, precio o fotos, edita tour.json (o vuelve a exportar desde el Estudio) y
   sustituye los archivos en el hosting. El enlace no cambia.

Generado el ${new Date().toLocaleString("es-ES")}.
`;
}

/**
 * ZIP autohospedable: tour.json + recursos + (opcional) los archivos del visor + LEEME.txt.
 * @param {object} tour
 * @param {Map<string, Blob>} [archivos] recursos por ruta relativa (prioridad sobre la red)
 * @param {{incluirVisor?: boolean, base?: string, onProgreso?: (f:number)=>void}} [opciones]
 * @returns {Promise<Blob>} application/zip; propiedad extra `avisos: string[]`
 */
export async function exportarZIP(tour, archivos = new Map(), { incluirVisor = true, base, onProgreso, copiaSeguridad = false } = {}) {
  const { zipSync, strToU8 } = await import("./vendor/fflate.js");
  base ??= baseDe();
  archivos ??= new Map();
  // Publicar ≠ copia de seguridad: en lo público nunca van documentos privados ni datos internos del Estudio.
  if (!copiaSeguridad) ({ tour, archivos } = soloPublico(tour, archivos));
  const avisos = [];
  const salida = {}; // ruta → [Uint8Array, opciones]
  const poner = async (ruta, blob) => {
    const datos = new Uint8Array(await blob.arrayBuffer());
    salida[ruta] = [datos, { level: SIN_COMPRIMIR.test(ruta) ? 0 : 6 }];
  };
  const t = limpiarTour(tour);

  // 1) archivos aportados explícitamente (aunque el tour no los nombre)
  for (const [ruta, blob] of archivos) if (!esURLAbsoluta(ruta)) await poner(normalizar(ruta), blob);

  // 2) recursos referenciados por el tour
  const refs = referencias(t);
  let n = 0, hechos = 0;
  const yaBajados = new Map(); // url → ruta en el ZIP
  for (const r of refs) {
    hechos++;
    onProgreso?.(0.8 * hechos / refs.length);
    const enMapa = archivos.has(r.ruta) ? r.ruta : null;
    if (enMapa && !esURLAbsoluta(enMapa)) { r.obj[r.clave] = normalizar(enMapa); continue; }
    if (/^https?:/i.test(r.ruta) && !enMapa) continue; // recurso externo: se mantiene la URL
    try {
      if (yaBajados.has(r.ruta)) { r.obj[r.clave] = yaBajados.get(r.ruta); continue; }
      const blob = await obtenerBlob(r.ruta, { archivos, base });
      let ruta;
      if (esBlobOData(r.ruta) || enMapa) ruta = `recursos/${r.tipo}-${++n}.${extDe(blob)}`;
      else ruta = normalizar(r.ruta.split(/[?#]/)[0]);
      if (!salida[ruta]) await poner(ruta, blob);
      yaBajados.set(r.ruta, ruta);
      r.obj[r.clave] = ruta;
    } catch (e) {
      avisos.push(`No se incluyó ${r.ruta.slice(0, 80)}: ${e.message}`);
      if (!esURLAbsoluta(r.ruta)) r.obj[r.clave] = r.ruta; // se deja la ruta tal cual
    }
  }
  salida["tour.json"] = [strToU8(JSON.stringify(t, null, 2)), { level: 6 }];

  // 3) visor
  if (incluirVisor) {
    // Lista base + módulos locales que el build detectó (dist/visor-autonomo.json), p. ej. util.js o plano.js.
    const lista = new Set(ARCHIVOS_VISOR);
    try {
      const m = await (await fetch(new URL("dist/visor-autonomo.json", MODULO))).json();
      for (const f of [...(m.modulos_locales ?? []), ...(m.hojas ?? [])]) if (!f.startsWith("..") && !f.startsWith("/")) lista.add(f);
    } catch { /* sin build: solo la lista base */ }
    for (const f of lista) {
      try {
        const r = await fetch(new URL(f, MODULO));
        if (!r.ok) continue; // p. ej. paneles.js aún no existe: se ignora
        await poner(f, await r.blob());
      } catch { /* sin red / file:// */ }
    }
    if (!salida["index.html"]) avisos.push("No se pudo incluir index.html del visor (¿exportando desde file://?)");
  }
  salida["LEEME.txt"] = [strToU8(leeme(t, t.idioma ?? "es")), { level: 6 }];
  onProgreso?.(0.9);
  const zip = zipSync(salida, { mtime: new Date() });
  onProgreso?.(1);
  const blob = new Blob([zip], { type: "application/zip" });
  blob.avisos = avisos;
  if (avisos.length) console.warn("[exportarZIP]", avisos);
  return blob;
}

// ======================================================================= HTML autónomo (offline, doble clic)

const LIMITE_HTML = 50 * MB;
const LADO_POR_TIPO = { mini: 512, logo: 1024, foto: 2048, plano: 4096 };

/**
 * Un solo .html que funciona offline sin servidor: CSS en línea + dist/visor-autonomo.js en línea +
 * window.TOUR_EMBEBIDO con todas las imágenes como data:. Requiere haber ejecutado `npm run build`.
 * @param {"movil"|"alta"} [opciones.calidad] movil: imagen_movil o la base reducida a ≤4096 px (recomendado);
 *        alta: la base reducida a ≤8192 px (archivo mucho mayor; algunos móviles no cargan texturas de 8K)
 * @param {boolean} [opciones.incluirLibre=false] incrusta también el splat/GLB del modo libre (suele pesar mucho)
 * @returns {Promise<Blob>} text/html; propiedades extra `tamano` (bytes), `superaLimite` (>50 MB) y `avisos`
 */
export async function exportarHTMLAutonomo(tour, archivos = new Map(), { calidad = "movil", base, incluirLibre = false, onProgreso } = {}) {
  base ??= baseDe();
  archivos ??= new Map();
  ({ tour, archivos } = soloPublico(tour, archivos));
  const avisos = [];
  const traer = async (f) => {
    const r = await fetch(new URL(f, MODULO));
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.text();
  };
  let js, css;
  try { [js, css] = await Promise.all([traer("dist/visor-autonomo.js"), traer("dist/visor-autonomo.css")]); }
  catch (e) { throw new Error(`Falta el visor compilado (dist/visor-autonomo.js): ejecuta "npm install && npm run build" en tools/visor-inmobiliario (${e.message})`); }
  // Un build antiguo no sabe leer el tour incrustado y mostraría la demo: mejor un error claro.
  if (!js.includes("TOUR_EMBEBIDO")) throw new Error('El visor compilado (dist/) está desactualizado: ejecuta "npm run build" en tools/visor-inmobiliario y vuelve a exportar.');
  let cuerpo = "", lang = "es", tituloDoc = "Recorrido virtual";
  try {
    const html = await traer("index.html");
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("script, link[rel=stylesheet]").forEach((s) => s.remove());
    cuerpo = doc.body.innerHTML;
    lang = doc.documentElement.lang || lang;
  } catch { avisos.push("No se pudo leer index.html: se usa un contenedor mínimo"); }
  if (!cuerpo.trim()) cuerpo = '<div id="app"><canvas id="lienzo"></canvas></div>';

  const t = limpiarTour(tour);
  const idioma = t.idioma ?? "es";
  tituloDoc = texto(t.titulo, idioma) || tituloDoc;
  const maxPano = calidad === "alta" ? 8192 : 4096;
  const cache = new Map(); // ruta|lado → dataURL
  const comoData = async (ruta, lado, tipo = "auto") => {
    const clave = `${ruta}|${lado}|${tipo}`;
    if (!cache.has(clave)) {
      cache.set(clave, (async () => {
        const blob = await obtenerBlob(ruta, { archivos, base });
        return blobADataURL(lado ? await reescalar(blob, lado, { tipo }) : blob);
      })());
    }
    return cache.get(clave);
  };

  const refs = referencias(t);
  let hechos = 0;
  for (const r of refs) {
    onProgreso?.(0.9 * ++hechos / refs.length);
    try {
      switch (r.tipo) {
        case "pano": {
          // variante/panorama: elegir fuente y dejar UNA sola imagen (imagen_movil se elimina)
          const fuente = calidad === "movil" && typeof r.obj.imagen_movil === "string" ? r.obj.imagen_movil : r.obj.imagen;
          r.obj.imagen = await comoData(fuente, maxPano, "image/jpeg");
          delete r.obj.imagen_movil;
          break;
        }
        case "pano_movil":
          break; // ya resuelto con "pano" (o el objeto solo tenía imagen_movil)
        case "mascara":
          r.obj[r.clave] = await comoData(r.ruta, maxPano, "image/png"); // PNG: los canales deben ser exactos
          break;
        case "doc":
        case "audio":
        case "libre": {
          if (r.tipo === "libre" && !incluirLibre) break;
          const blob = await obtenerBlob(r.ruta, { archivos, base }).catch(() => null);
          if (blob && blob.size < ({ libre: 40, audio: 15 }[r.tipo] ?? 8) * MB) r.obj[r.clave] = await blobADataURL(blob);
          else if (!esURLAbsoluta(r.ruta)) { r.obj[r.clave] = resolverURL(r.ruta, base); avisos.push(`${r.ruta} no se incrustó (demasiado grande o inaccesible): queda como enlace`); }
          break;
        }
        default:
          r.obj[r.clave] = await comoData(r.ruta, LADO_POR_TIPO[r.tipo] ?? 2048);
      }
    } catch (e) {
      avisos.push(`No se pudo incrustar ${r.ruta.slice(0, 80)}: ${e.message}`);
      if (!esURLAbsoluta(r.ruta)) r.obj[r.clave] = resolverURL(r.ruta, base);
    }
  }
  // un objeto que solo tenía imagen_movil (sin imagen) → usarla como imagen
  for (const p of [...(t.panoramas ?? []), ...(t.panoramas ?? []).flatMap((p) => p.variantes ?? [])]) {
    if (!p.imagen && typeof p.imagen_movil === "string") { p.imagen = p.imagen_movil.startsWith("data:") ? p.imagen_movil : await comoData(p.imagen_movil, maxPano, "image/jpeg").catch(() => p.imagen_movil); delete p.imagen_movil; }
  }
  if (t.libre && !incluirLibre && t.libre.tipo !== "demo") { delete t.libre; avisos.push("El modo libre 3D (splat/GLB) no se incluye en el HTML autónomo (usa incluirLibre: true si es pequeño)"); }

  const json = JSON.stringify(t).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  const seguroJS = js.replace(/<\/script/gi, "<\\/script");
  const seguroCSS = css.replace(/<\/style/gi, "<\\/style");
  const partes = [
    `<!doctype html>\n<html lang="${esc(lang)}">\n<head>\n<meta charset="utf-8">\n`,
    `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n`,
    `<meta name="generator" content="visor-inmobiliario · exportarHTMLAutonomo">\n`,
    `<title>${esc(tituloDoc)}</title>\n<style>\n`, seguroCSS, `\n</style>\n</head>\n<body>\n`, cuerpo,
    `\n<script>window.TOUR_EMBEBIDO = `, json, `;</script>\n<script type="module">\n`, seguroJS, `\n</script>\n</body>\n</html>\n`,
  ];
  const blob = new Blob(partes, { type: "text/html;charset=utf-8" });
  blob.tamano = blob.size;
  blob.superaLimite = blob.size > LIMITE_HTML;
  if (blob.superaLimite) avisos.push(`El archivo ocupa ${(blob.size / MB).toFixed(1)} MB (> 50 MB): muchos correos y WhatsApp no lo aceptarán; usa calidad "movil", menos variantes o comparte el ZIP/enlace`);
  blob.avisos = avisos;
  if (avisos.length) console.warn("[exportarHTMLAutonomo]", avisos);
  onProgreso?.(1);
  return blob;
}

// ======================================================================= vídeo de la visita guiada

/*
 * Formatos: MediaRecorder graba MP4 (H.264) en Chrome/Edge ≥ 126 y Safari; Firefox y Chromium sin códecs
 * propietarios solo graban WebM (VP9/VP8). idealista, Fotocasa y la mayoría de portales y redes aceptan MP4;
 * un WebM se convierte con ffmpeg:
 *     ffmpeg -i in.webm -c:v libx264 -pix_fmt yuv420p out.mp4
 * (añade  -movflags +faststart  para que empiece a reproducirse antes de descargarse entero).
 */
const TIPOS_VIDEO_AUDIO = [
  ["video/mp4;codecs=avc1.640028,mp4a.40.2", "mp4"], ["video/mp4;codecs=avc1,mp4a.40.2", "mp4"],
  ["video/webm;codecs=vp9,opus", "webm"], ["video/webm;codecs=vp8,opus", "webm"],
];
const TIPOS_VIDEO = [
  ["video/mp4;codecs=avc1.640028", "mp4"], ["video/mp4;codecs=avc1.4d0028", "mp4"], ["video/mp4;codecs=avc1", "mp4"],
  ["video/webm;codecs=vp9", "webm"], ["video/webm;codecs=vp8", "webm"], ["video/webm", "webm"], ["video/mp4", "mp4"],
];

function rectRedondeado(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

function textoAjustado(g, s, maxAncho) {
  if (g.measureText(s).width <= maxAncho) return s;
  while (s.length > 1 && g.measureText(s + "…").width > maxAncho) s = s.slice(0, -1);
  return s + "…";
}

/**
 * Graba la visita guiada (visor.guion.iniciar() → evento "guion:fin") a vídeo con marca.
 * @param {object} visor window.visor (ESQUEMA.md §2): usa visor.lienzo, visor.guion, visor.on/off, visor.tour, visor.estado, visor.t
 *        y, si existen (opcionales): evento "frame" tras cada render, visor.renderizar() (render síncrono),
 *        evento "guion:paso" ({paso}) para subtítulos y visor.tamanoCaptura(w, h | null) para renderizar al aspecto del vídeo
 * @param {object} [o]
 * @param {"16:9"|"9:16"|"1:1"} [o.formato="16:9"]
 * @param {number} [o.fps=30]
 * @param {number} [o.alto=1080] resolución del LADO CORTO: 1080 → 1920×1080, 1080×1920 o 1080×1080
 * @param {boolean} [o.conMarca=true] logo, título/precio, barra con estancia y contacto, subtítulos del guion
 * @param {(f:number)=>void} [o.onProgreso] fracción 0…1 estimada con la duración del guion
 * @param {AbortSignal} [o.senal] para cancelar
 * @param {number} [o.maxSegundos] tope de seguridad si nunca llega "guion:fin" (por defecto duración del guion + 60 s)
 * @returns {Promise<{blob: Blob, extension: "mp4"|"webm", mimeType: string, ancho: number, alto: number, segundos: number}>}
 */
export async function grabarVideo(visor, { formato = "16:9", fps = 30, alto = 1080, conMarca = true, conMusica = true, onProgreso, senal, maxSegundos, bitrate, maxMB = 90 } = {}) {
  if (!visor?.lienzo) throw new Error("grabarVideo: falta visor.lienzo (canvas WebGL)");
  if (!visor.guion?.iniciar) throw new Error("grabarVideo: el visor no tiene visita guiada (visor.guion.iniciar)");
  if (typeof MediaRecorder === "undefined") throw new Error("Este navegador no puede grabar vídeo (MediaRecorder)");
  const [rw, rh] = { "16:9": [16, 9], "9:16": [9, 16], "1:1": [1, 1] }[formato] ?? [16, 9];
  const par = (x) => Math.round(x / 2) * 2;
  const W = rw >= rh ? par(alto * rw / rh) : par(alto);
  const H = rw >= rh ? par(alto) : par(alto * rh / rw);
  // Música del proyecto en el vídeo (pista independiente del botón de silencio del visitante).
  const pistaAudio = conMusica && typeof visor.pistaAudio === "function" ? await visor.pistaAudio(true).catch(() => null) : null;
  const candidatos = pistaAudio ? [...TIPOS_VIDEO_AUDIO, ...TIPOS_VIDEO] : TIPOS_VIDEO;
  const [mimeType, extension] = candidatos.find(([m]) => MediaRecorder.isTypeSupported(m)) ?? ["", "webm"];

  const tour = visor.tour ?? {};
  const idioma = visor.estado?.idioma ?? tour.idioma ?? "es";
  const t = (v) => (typeof visor.t === "function" ? visor.t(v) : texto(v, idioma));
  const acento = tour.marca?.color ?? "#c8a24a";
  const titulo = t(tour.titulo);
  const precio = precioTexto(tour, idioma);
  const contacto = [t(tour.agente?.nombre), tour.agente?.telefono ?? (tour.contacto?.whatsapp ? "+" + tour.contacto.whatsapp : null), !tour.agente?.telefono && tour.marca?.web ? tour.marca.web.replace(/^https?:\/\//, "") : null].filter(Boolean).join(" · ");
  let logo = null;
  if (conMarca && tour.marca?.logo) logo = await cargarImagen(tour.marca.logo, {}).catch(() => null);
  const guion = Array.isArray(tour.guion) && tour.guion.length ? tour.guion : (tour.panoramas ?? []).map((p) => ({ nodo: p.id, segundos: 5 }));
  const duracionEstimada = guion.reduce((s, p) => s + (p.segundos ?? 5) + 1.2, 0) || 30;

  let nodoActual = visor.estado?.nodo ?? null;
  let pasoTexto = "";
  const nombreNodo = (id) => t((tour.panoramas ?? []).find((p) => p.id === id)?.nombre) || "";
  // El núcleo emite "guion:paso" con { paso (índice), nodo, texto }: es la fuente de los subtítulos.
  const alNodo = (e) => { nodoActual = e?.id ?? nodoActual; };
  const alPaso = (e) => { pasoTexto = e?.texto ? t(e.texto) : ""; if (e?.nodo) nodoActual = e.nodo; };

  const c = lienzo(W, H);
  const g = c.getContext("2d", { alpha: false });
  const u = Math.min(W, H) / 1080;
  const fuente = (peso, px) => `${peso} ${Math.round(px * u)}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;

  function componer() {
    const src = visor.lienzo;
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);
    const sw = src.width, sh = src.height;
    if (sw && sh) {
      const a = W / H;
      let cw = sw, ch = sh, cx = 0, cy = 0;
      if (sw / sh > a) { cw = sh * a; cx = (sw - cw) / 2; } else { ch = sw / a; cy = (sh - ch) / 2; }
      g.imageSmoothingQuality = "high";
      g.drawImage(src, cx, cy, cw, ch, 0, 0, W, H);
    }
    if (!conMarca) return;
    // franja superior: logo + título + precio
    const sup = 170 * u;
    let grad = g.createLinearGradient(0, 0, 0, sup * 1.4);
    grad.addColorStop(0, "rgba(0,0,0,.62)"); grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad; g.fillRect(0, 0, W, sup * 1.4);
    let x = 48 * u;
    const y = 44 * u;
    if (logo) {
      const lh = 84 * u, lw = Math.min(260 * u, lh * (logo.naturalWidth / logo.naturalHeight || 1));
      g.drawImage(logo, x, y, lw, lh);
      x += lw + 28 * u;
    } else if (tour.marca?.nombre) {
      g.font = fuente(700, 30); g.fillStyle = acento; g.textBaseline = "top";
      g.fillText(textoAjustado(g, t(tour.marca.nombre).toUpperCase(), W * 0.4), x, y);
    }
    g.textBaseline = "top"; g.fillStyle = "#fff";
    g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 8 * u;
    const anchoTexto = W - x - 48 * u;
    const yT = logo || !tour.marca?.nombre ? y : y + 42 * u;
    g.font = fuente(700, 44); g.fillText(textoAjustado(g, titulo, anchoTexto), x, yT);
    if (precio) { g.font = fuente(800, 40); g.fillStyle = acento; g.fillText(precio, x, yT + 56 * u); }
    g.shadowBlur = 0;
    // subtítulo del guion
    const barra = 112 * u;
    if (pasoTexto) {
      g.font = fuente(600, 36);
      const s = textoAjustado(g, pasoTexto, W - 140 * u);
      const tw = g.measureText(s).width + 48 * u;
      rectRedondeado(g, (W - tw) / 2, H - barra - 96 * u, tw, 64 * u, 14 * u);
      g.fillStyle = "rgba(0,0,0,.55)"; g.fill();
      g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(s, W / 2, H - barra - 64 * u);
      g.textAlign = "left";
    }
    // aviso legal incrustado si la vista es una recreación (IA / render) o la iluminación es simulada
    const sello = typeof visor.sello === "function" ? visor.sello() : "";
    if (sello) {
      g.font = fuente(700, 26);
      const sw2 = g.measureText(sello).width + 36 * u;
      rectRedondeado(g, W - sw2 - 40 * u, sup * 1.05, sw2, 46 * u, 23 * u);
      g.fillStyle = "rgba(0,0,0,.6)"; g.fill();
      g.fillStyle = "#fff"; g.textBaseline = "middle"; g.fillText(sello, W - sw2 - 22 * u, sup * 1.05 + 23 * u);
    }
    // barra inferior: estancia + contacto
    g.fillStyle = "rgba(12,14,18,.78)"; g.fillRect(0, H - barra, W, barra);
    g.fillStyle = acento; g.fillRect(0, H - barra, W, 6 * u);
    g.textBaseline = "middle"; g.fillStyle = "#fff";
    const vertical = W < H;
    const estancia = nombreNodo(nodoActual);
    if (vertical) {
      g.font = fuente(700, 38); g.fillText(textoAjustado(g, estancia, W - 96 * u), 48 * u, H - barra * 0.64);
      g.font = fuente(500, 28); g.fillStyle = "rgba(255,255,255,.85)"; g.fillText(textoAjustado(g, contacto, W - 96 * u), 48 * u, H - barra * 0.26);
    } else {
      g.font = fuente(700, 40); g.fillText(textoAjustado(g, estancia, W * 0.45), 48 * u, H - barra / 2 + 3 * u);
      g.font = fuente(500, 30); g.fillStyle = "rgba(255,255,255,.88)"; g.textAlign = "right";
      g.fillText(textoAjustado(g, contacto, W * 0.48), W - 48 * u, H - barra / 2 + 3 * u); g.textAlign = "left";
    }
  }

  // Sincronización con el render WebGL: el lienzo del visor (sin preserveDrawingBuffer) solo es legible justo
  // después de renderizar. Orden de preferencia: evento "frame" del núcleo → visor.renderizar() → rAF.
  let ultimoFrame = 0;
  let cancelado = false;
  const alFrame = () => { ultimoFrame = performance.now(); componer(); };
  // Una sola suscripción por evento: visor.on si existe (si no, el CustomEvent de window).
  const on = (ev, fn) => {
    if (typeof visor.on === "function") { visor.on(ev, fn); return () => visor.off?.(ev, fn); }
    const w = (e) => fn(e.detail); addEventListener(`visor:${ev}`, w); return () => removeEventListener(`visor:${ev}`, w);
  };
  const quitar = [on("frame", alFrame), on("nodo", alNodo), on("guion:paso", alPaso)];
  let raf = 0;
  const bucle = () => {
    raf = requestAnimationFrame(bucle);
    if (performance.now() - ultimoFrame < 120) return; // el núcleo ya nos avisa en cada frame
    if (typeof visor.renderizar === "function") visor.renderizar();
    componer();
  };

  const stream = c.captureStream(fps);
  if (pistaAudio) stream.addTrack(pistaAudio);
  // idealista admite vídeos de hasta 100 MB: se limita el bitrate para no pasar de `maxMB` según la duración prevista.
  const bitrateTope = Math.round((maxMB * 8e6) / (duracionEstimada + 8) * 0.9);
  const rec = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: bitrate ?? Math.min(Math.round(Math.min(16e6, W * H * fps * 0.12)), bitrateTope) });
  const trozos = [];
  rec.ondataavailable = (e) => { if (e.data?.size) trozos.push(e.data); };
  const parado = new Promise((ok) => { rec.onstop = ok; });

  // Opcional: el núcleo puede renderizar a la resolución/aspecto del vídeo mientras se graba (mejor que recortar).
  const conTamano = typeof visor.tamanoCaptura === "function";
  if (conTamano) visor.tamanoCaptura(W, H);
  quitar.push(() => { if (conTamano) visor.tamanoCaptura(null); });
  // La visita avanza por reloj real (no por fotogramas): el vídeo dura lo mismo en un equipo lento o rápido.
  visor.tiempoReal?.(true);
  quitar.push(() => visor.tiempoReal?.(false));
  componer();
  bucle();
  rec.start(1000);
  const t0 = performance.now();
  const progreso = setInterval(() => onProgreso?.(Math.min(0.99, (performance.now() - t0) / 1000 / duracionEstimada)), 250);
  try {
    await new Promise((ok, mal) => {
      const fin = on("guion:fin", () => { fin(); if (!cancelado) ok(); });
      quitar.push(fin);
      const tope = setTimeout(() => { console.warn("[grabarVideo] no llegó guion:fin: se corta por tiempo"); ok(); }, (maxSegundos ?? duracionEstimada + 60) * 1000);
      quitar.push(() => clearTimeout(tope));
      // Primero se rechaza y luego se para la visita: parar() emite "guion:fin" de forma síncrona.
      senal?.addEventListener("abort", () => { cancelado = true; mal(new DOMException("Grabación cancelada", "AbortError")); visor.guion.parar?.(); }, { once: true });
      Promise.resolve(visor.guion.iniciar()).catch(mal);
    });
    await new Promise((r) => setTimeout(r, 400)); // último fotograma
  } finally {
    clearInterval(progreso);
    cancelAnimationFrame(raf);
    quitar.forEach((f) => f());
    if (pistaAudio) await visor.pistaAudio(false);
    if (rec.state !== "inactive") rec.stop();
    await parado;
    stream.getTracks().forEach((tr) => tr.stop());
  }
  onProgreso?.(1);
  const tipo = (mimeType || trozos[0]?.type || `video/${extension}`).split(";")[0];
  const segundos = (performance.now() - t0) / 1000;
  let blob = new Blob(trozos, { type: tipo });
  // MediaRecorder no escribe la duración en los WebM: sin ella los portales muestran 0:00 o lo rechazan.
  if (extension === "webm") {
    try { const { default: arreglar } = await import("./vendor/fix-webm-duration.js"); blob = await arreglar(blob, Math.round(segundos * 1000), { logger: false }); } catch (e) { console.warn("[grabarVideo] duración WebM", e); }
  }
  return { blob, extension, mimeType: mimeType || tipo, ancho: W, alto: H, segundos };
}

// ======================================================================= JPEG 360 con GPano (XMP)

const XMP_NS = "http://ns.adobe.com/xap/1.0/\0";
const XMP_EXT_NS = "http://ns.adobe.com/xmp/extension/\0";

function empiezaPor(bytes, ini, cadena) {
  for (let i = 0; i < cadena.length; i++) if (bytes[ini + i] !== cadena.charCodeAt(i)) return false;
  return true;
}

/** Segmentos JPEG hasta SOS: [{ marcador, ini, fin, datos: ini de la carga útil }]. */
function segmentosJPEG(b) {
  if (b[0] !== 0xff || b[1] !== 0xd8) throw new Error("No es un JPEG");
  const segs = [];
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) throw new Error(`JPEG corrupto en el byte ${i}`);
    while (b[i] === 0xff) i++; // bytes de relleno
    const m = b[i];
    const ini = i - 1;
    if (m === 0xd9 || m === 0xda) { segs.push({ marcador: m, ini, fin: b.length }); break; }
    if (m >= 0xd0 && m <= 0xd7) { i++; continue; }
    const largo = (b[i + 1] << 8) | b[i + 2];
    segs.push({ marcador: m, ini, fin: i + 1 + largo, datos: i + 3 });
    i = i + 1 + largo;
  }
  return segs;
}

/**
 * Inserta metadatos XMP GPano (foto esférica equirectangular) en un JPEG, reemplazando cualquier XMP previo.
 * Facebook, Google Fotos/Maps, Kuula y muchos portales detectan así la foto como 360.
 * Si `blob` no es JPEG (PNG/WebP), se convierte a JPEG (calidad 0.92).
 * @param {Blob} blob
 * @param {{ancho?: number, alto?: number, rumboInicial?: number, cabeceoInicial?: number, fovInicial?: number, rumboNorte?: number}} [o]
 *        ancho/alto por defecto los del JPEG. Si alto < ancho/2 se declara como panorama recortado (centrado).
 * @returns {Promise<Blob>} image/jpeg
 */
/**
 * Re-comprime un JPEG hasta que pese menos de `maxMB` (idealista: 8 MB por foto), bajando calidad y, si hace falta, tamaño.
 * @returns {Promise<Blob>}
 */
export async function jpegParaPortal(blob, { maxMB = 7.5, ladoMax = 8192 } = {}) {
  const limite = maxMB * 1024 * 1024;
  if (blob.size <= limite && blob.type === "image/jpeg") return blob;
  const bmp = await createImageBitmap(blob);
  let w = Math.min(bmp.width, ladoMax), h = Math.round((bmp.height * w) / bmp.width);
  let calidad = 0.9, salida = null;
  for (let i = 0; i < 8; i++) {
    const c = lienzo(w, h);
    c.getContext("2d").drawImage(bmp, 0, 0, w, h);
    salida = await aBlob(c, "image/jpeg", calidad);
    if (salida.size <= limite) break;
    if (calidad > 0.72) calidad -= 0.06; else { w = Math.round(w * 0.85); h = Math.round(h * 0.85); }
  }
  bmp.close?.();
  return salida;
}

export async function jpegConGPano(blob, { ancho, alto, rumboInicial = 0, cabeceoInicial = 0, fovInicial = 90, rumboNorte, maxMB } = {}) {
  if (maxMB) blob = await jpegParaPortal(blob, { maxMB });
  let b = new Uint8Array(await blob.arrayBuffer());
  if (!(b[0] === 0xff && b[1] === 0xd8)) {
    const bmp = await createImageBitmap(blob);
    const c = lienzo(bmp.width, bmp.height);
    c.getContext("2d").drawImage(bmp, 0, 0);
    b = new Uint8Array(await (await aBlob(c, "image/jpeg", 0.92)).arrayBuffer());
  }
  const segs = segmentosJPEG(b);
  const sof = segs.find((s) => s.marcador >= 0xc0 && s.marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(s.marcador));
  const altoImg = sof ? (b[sof.datos + 1] << 8) | b[sof.datos + 2] : 0;
  const anchoImg = sof ? (b[sof.datos + 3] << 8) | b[sof.datos + 4] : 0;
  const W = Math.round(ancho ?? anchoImg), H = Math.round(alto ?? altoImg);
  if (!W || !H) throw new Error("No se pudieron leer las dimensiones del JPEG");
  const fullW = W, fullH = Math.max(H, Math.round(W / 2));
  const top = Math.round((fullH - H) / 2);
  const grados = (x) => (((x % 360) + 360) % 360).toFixed(1).replace(/\.0$/, "");
  const atributos = {
    UsePanoramaViewer: "True",
    ProjectionType: "equirectangular",
    CroppedAreaImageWidthPixels: W, CroppedAreaImageHeightPixels: H,
    FullPanoWidthPixels: fullW, FullPanoHeightPixels: fullH,
    CroppedAreaLeftPixels: 0, CroppedAreaTopPixels: top,
    InitialViewHeadingDegrees: grados(rumboInicial),
    InitialViewPitchDegrees: Math.round(cabeceoInicial),
    InitialViewRollDegrees: 0,
    InitialHorizontalFOVDegrees: Math.round(fovInicial),
    ...(rumboNorte != null ? { PoseHeadingDegrees: grados(rumboNorte) } : {}),
    StitchingSoftware: "cre8eight",
  };
  const xmp = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="cre8eight">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="" xmlns:GPano="http://ns.google.com/photos/1.0/panorama/"
${Object.entries(atributos).map(([k, v]) => `   GPano:${k}="${esc(v)}"`).join("\n")}/>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
  const carga = new TextEncoder().encode(XMP_NS + xmp);
  const largo = carga.length + 2;
  if (largo > 0xffff) throw new Error("XMP demasiado grande");
  const app1 = new Uint8Array(4 + carga.length);
  app1.set([0xff, 0xe1, largo >> 8, largo & 0xff]);
  app1.set(carga, 4);

  // quitar XMP existentes (estándar y extendido)
  const quitar = segs.filter((s) => s.marcador === 0xe1 && (empiezaPor(b, s.datos, XMP_NS) || empiezaPor(b, s.datos, XMP_EXT_NS)));
  // insertar tras SOI y tras los APP0 (JFIF) / APP1 (Exif) iniciales, para no romper esos formatos
  let pos = 2;
  for (const s of segs) {
    if (quitar.includes(s)) continue;
    if (s.marcador === 0xe0 || (s.marcador === 0xe1 && empiezaPor(b, s.datos, "Exif\0"))) pos = s.fin; else break;
  }
  const partes = [];
  let cursor = 0;
  const cortes = [...quitar.map((s) => [s.ini, s.fin])].sort((a, z) => a[0] - z[0]);
  const trozo = (a, z) => { if (z > a) partes.push(b.subarray(a, z)); };
  // reconstruir: [0,pos) sin XMP + APP1 nuevo + [pos, fin) sin XMP
  const copiarSin = (a, z) => {
    let c0 = a;
    for (const [i0, i1] of cortes) {
      if (i1 <= c0 || i0 >= z) continue;
      trozo(c0, Math.max(c0, i0));
      c0 = Math.min(z, i1);
    }
    trozo(c0, z);
  };
  copiarSin(cursor, pos);
  partes.push(app1);
  copiarSin(pos, b.length);
  return new Blob(partes, { type: "image/jpeg" });
}

/** Lee los atributos GPano de un JPEG (para comprobar). Devuelve {} si no hay. */
export async function leerGPano(blob) {
  const b = new Uint8Array(await blob.arrayBuffer());
  const r = {};
  for (const s of segmentosJPEG(b)) {
    if (s.marcador !== 0xe1 || !empiezaPor(b, s.datos, XMP_NS)) continue;
    const xmp = new TextDecoder().decode(b.subarray(s.datos + XMP_NS.length, s.fin));
    for (const m of xmp.matchAll(/GPano:(\w+)\s*=\s*"([^"]*)"/g)) r[m[1]] = m[2];
    for (const m of xmp.matchAll(/<GPano:(\w+)>([^<]*)<\/GPano:\1>/g)) r[m[1]] = m[2];
  }
  return r;
}

// ======================================================================= plano PNG

const RELLENOS = ["#f4e3c1", "#dcebdc", "#dde6f3", "#f3dde0", "#e8e0f2", "#f2ecd5", "#d9eeee", "#f1e1d2"];

function plantaDe(t, plantaId) {
  const plantas = t.plantas?.length ? t.plantas : [{ id: plantaId ?? "p0", nombre: null, plano: t.plano, muros: t.muros }];
  const planta = plantas.find((p) => p.id === plantaId) ?? plantas[0];
  const primera = planta === plantas[0];
  const enPlanta = (o) => (o.planta == null ? primera : o.planta === planta.id);
  return {
    planta, plantas,
    plano: planta.plano ?? (plantas.length === 1 ? t.plano : null),
    muros: planta.muros ?? (plantas.length === 1 ? t.muros : null) ?? [],
    estancias: (t.estancias ?? []).filter((e) => Array.isArray(e.poligono) && e.poligono.length >= 3 && enPlanta(e)),
    fotos: (t.panoramas ?? []).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.z) && enPlanta(p)),
  };
}

function centroide(pol) {
  let a = 0, cx = 0, cz = 0;
  for (let i = 0; i < pol.length; i++) {
    const [x1, z1] = pol[i], [x2, z2] = pol[(i + 1) % pol.length];
    const f = x1 * z2 - x2 * z1;
    a += f; cx += (x1 + x2) * f; cz += (z1 + z2) * f;
  }
  if (Math.abs(a) < 1e-9) return [pol.reduce((s, p) => s + p[0], 0) / pol.length, pol.reduce((s, p) => s + p[1], 0) / pol.length];
  return [cx / (3 * a), cz / (3 * a)];
}
function dentro([x, z], pol) {
  let d = false;
  for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) {
    const [xi, zi] = pol[i], [xj, zj] = pol[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) d = !d;
  }
  return d;
}
/** Punto interior para la etiqueta: centroide si cae dentro; si no (forma en L/U), el mejor de una rejilla. */
function puntoEtiqueta(pol) {
  const c = centroide(pol);
  if (dentro(c, pol)) return c;
  const xs = pol.map((p) => p[0]), zs = pol.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  let mejor = c, md = -1;
  for (let i = 1; i < 12; i++) for (let j = 1; j < 12; j++) {
    const p = [x0 + ((x1 - x0) * i) / 12, z0 + ((z1 - z0) * j) / 12];
    if (!dentro(p, pol)) continue;
    let d = Infinity;
    for (let k = 0; k < pol.length; k++) {
      const [ax, az] = pol[k], [bx, bz] = pol[(k + 1) % pol.length];
      const L2 = (bx - ax) ** 2 + (bz - az) ** 2 || 1;
      const tt = Math.max(0, Math.min(1, ((p[0] - ax) * (bx - ax) + (p[1] - az) * (bz - az)) / L2));
      d = Math.min(d, Math.hypot(p[0] - ax - tt * (bx - ax), p[1] - az - tt * (bz - az)));
    }
    if (d > md) { md = d; mejor = p; }
  }
  return mejor;
}

/**
 * Plano PNG de una planta para imprimir o subir a portales.
 * @param {object} tour
 * @param {string} [plantaId] id de `tour.plantas` (por defecto la primera)
 * @param {{px?: number, medidas?: boolean, fondo?: string, fotos?: boolean, idioma?: string, base?: string, archivos?: Map}} [o]
 *        px = ancho de la imagen (2400 px ≈ A4 a 290 ppp en el ancho útil)
 * @returns {Promise<Blob>} image/png
 */
export async function exportarPlano(tour, plantaId, { px = 2400, medidas = true, fondo = "#ffffff", fotos = true, idioma, base, archivos } = {}) {
  const t = tour;
  idioma ??= t.idioma ?? "es";
  const tx = (v) => texto(v, idioma);
  const { planta, plantas, plano, muros, estancias, fotos: puntos } = plantaDe(t, plantaId);
  const acento = t.marca?.color ?? "#c8a24a";
  const [imgPlano, imgLogo] = await Promise.all([
    plano?.imagen ? cargarImagen(plano.imagen, { base, archivos }).catch(() => null) : null,
    t.marca?.logo ? cargarImagen(t.marca.logo, { base, archivos }).catch(() => null) : null,
  ]);

  // extensión en metros
  const pts = [];
  if (plano && imgPlano && plano.ancho_m && plano.alto_m) {
    const [ox, oz] = plano.origen ?? [0, 0];
    pts.push([ox, oz], [ox + plano.ancho_m, oz + plano.alto_m]);
  }
  for (const m of muros) pts.push([m[0], m[1]], [m[2], m[3]]);
  for (const e of estancias) pts.push(...e.poligono);
  if (fotos) for (const p of puntos) pts.push([p.x, p.z]);
  if (!pts.length) pts.push([0, 0], [10, 8]);
  const margenM = medidas ? 0.7 : 0.4;
  let x0 = Math.min(...pts.map((p) => p[0])) - margenM, x1 = Math.max(...pts.map((p) => p[0])) + margenM;
  let z0 = Math.min(...pts.map((p) => p[1])) - margenM, z1 = Math.max(...pts.map((p) => p[1])) + margenM;
  const bw = Math.max(1, x1 - x0), bh = Math.max(1, z1 - z0);

  const W = Math.round(px);
  const u = W / 2400; // unidad de diseño
  const margen = 90 * u, cab = 250 * u, pie = 250 * u;
  const anchoUtil = W - 2 * margen;
  const s = anchoUtil / bw; // px por metro
  const altoPlano = bh * s;
  const H = Math.round(cab + altoPlano + pie);
  const c = lienzo(W, H);
  const g = c.getContext("2d");
  g.fillStyle = fondo; g.fillRect(0, 0, W, H);
  const X = (x) => margen + (x - x0) * s;
  const Y = (z) => cab + (z - z0) * s;
  const F = (peso, tam) => `${peso} ${Math.round(tam)}px "Helvetica Neue", Arial, system-ui, sans-serif`;

  // --- cabecera
  let xc = margen;
  if (imgLogo) {
    const lh = 110 * u, lw = Math.min(420 * u, lh * (imgLogo.naturalWidth / imgLogo.naturalHeight || 1));
    g.drawImage(imgLogo, xc, 60 * u, lw, lh);
    xc += lw + 40 * u;
  }
  g.textBaseline = "alphabetic"; g.fillStyle = "#1d1f24";
  const titulo = tx(t.titulo);
  if (!imgLogo && t.marca?.nombre) { g.font = F(700, 34 * u); g.fillStyle = acento; g.fillText(tx(t.marca.nombre).toUpperCase(), xc, 88 * u); g.fillStyle = "#1d1f24"; }
  g.font = F(700, 54 * u);
  g.fillText(textoAjustado(g, titulo || "Plano", W - xc - margen - 500 * u), xc, imgLogo || !t.marca?.nombre ? 120 * u : 150 * u);
  const sub = [plantas.length > 1 || planta.nombre ? tx(planta.nombre) : "", t.inmueble?.direccion && t.inmueble?.mostrar_direccion_exacta ? t.inmueble.direccion : ""].filter(Boolean).join(" · ");
  if (sub) { g.font = F(400, 34 * u); g.fillStyle = "#555b66"; g.fillText(textoAjustado(g, sub, W - xc - margen - 500 * u), xc, (imgLogo || !t.marca?.nombre ? 120 : 150) * u + 50 * u); }
  g.textAlign = "right"; g.fillStyle = "#555b66"; g.font = F(400, 30 * u);
  if (t.inmueble?.referencia) g.fillText(`Ref. ${t.inmueble.referencia}`, W - margen, 100 * u);
  const totalArea = estancias.reduce((a, e) => a + areaPoligono(e.poligono), 0);
  if (totalArea) g.fillText(`${idioma === "es" ? "Superficie estancias" : "Rooms area"}: ${num(totalArea, 1, idioma)} m²`, W - margen, 145 * u);
  g.textAlign = "left";
  g.fillStyle = acento; g.fillRect(margen, 215 * u, anchoUtil, 5 * u);

  // --- imagen del plano (a escala con origen/ancho_m/alto_m)
  if (imgPlano && plano?.ancho_m && plano?.alto_m) {
    const [ox, oz] = plano.origen ?? [0, 0];
    g.globalAlpha = estancias.length || muros.length ? 0.9 : 1;
    g.drawImage(imgPlano, X(ox), Y(oz), plano.ancho_m * s, plano.alto_m * s);
    g.globalAlpha = 1;
  }

  // --- estancias: relleno suave
  estancias.forEach((e, i) => {
    g.beginPath();
    e.poligono.forEach(([x, z], k) => (k ? g.lineTo(X(x), Y(z)) : g.moveTo(X(x), Y(z))));
    g.closePath();
    g.fillStyle = RELLENOS[i % RELLENOS.length];
    g.globalAlpha = imgPlano ? 0.45 : 0.85; g.fill(); g.globalAlpha = 1;
    g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = Math.max(1, 2 * u); g.stroke();
  });

  // --- muros
  if (muros.length) {
    g.strokeStyle = "#22252b"; g.lineCap = "square"; g.lineWidth = Math.max(3, 0.12 * s);
    g.beginPath();
    for (const [a, b, cc, d] of muros) { g.moveTo(X(a), Y(b)); g.lineTo(X(cc), Y(d)); }
    g.stroke();
  }

  // --- cotas (una por lado; los lados compartidos entre estancias se acotan una vez)
  if (medidas) {
    const hechos = new Set();
    const clave = (a, b) => [a, b].map((p) => p.map((v) => v.toFixed(2)).join(",")).sort().join("|");
    const tam = Math.max(16 * u, Math.min(30 * u, 0.2 * s));
    g.font = F(500, tam);
    for (const e of estancias) {
      const pol = e.poligono;
      let area2 = 0;
      for (let k = 0; k < pol.length; k++) { const [a, b] = pol[k], [cc, d] = pol[(k + 1) % pol.length]; area2 += a * d - cc * b; }
      const sentido = Math.sign(area2) || 1; // en pantalla (z abajo) area2>0 → horario
      for (let k = 0; k < pol.length; k++) {
        const A = pol[k], B = pol[(k + 1) % pol.length];
        const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
        if (L < 0.4) continue;
        const kk = clave(A, B);
        if (hechos.has(kk)) continue;
        hechos.add(kk);
        // normal hacia el interior de la estancia
        let nx = -(B[1] - A[1]) / L, nz = (B[0] - A[0]) / L;
        nx *= sentido; nz *= sentido;
        const off = 0.32; // m hacia dentro
        const ex_ = (B[0] - A[0]) / L, ez_ = (B[1] - A[1]) / L; // dirección del lado
        const ins = Math.min(off, L * 0.2); // la cota no llega a las esquinas: no se cruza con las perpendiculares
        const ax = X(A[0] + nx * off + ex_ * ins), az = Y(A[1] + nz * off + ez_ * ins);
        const bx = X(B[0] + nx * off - ex_ * ins), bz = Y(B[1] + nz * off - ez_ * ins);
        g.strokeStyle = "#6b7280"; g.lineWidth = Math.max(1, 1.6 * u);
        g.beginPath();
        g.moveTo(ax, az); g.lineTo(bx, bz);
        const m = 9 * u; // marcas a 45° en los extremos
        for (const [qx, qz] of [[ax, az], [bx, bz]]) {
          g.moveTo(qx - m * (ex_ - nx), qz - m * (ez_ - nz)); g.lineTo(qx + m * (ex_ - nx), qz + m * (ez_ - nz));
          g.moveTo(qx - nx * m * 1.2, qz - nz * m * 1.2); g.lineTo(qx + nx * m * 1.2, qz + nz * m * 1.2);
        }
        g.stroke();
        // texto paralelo al lado, derecho
        let ang = Math.atan2(bz - az, bx - ax);
        if (ang > Math.PI / 2 || ang <= -Math.PI / 2) ang += Math.PI;
        const etiqueta = `${num(L, 2, idioma)} m`;
        const tw = g.measureText(etiqueta).width;
        if (tw > L * s * 0.9) continue;
        g.save();
        g.translate((ax + bx) / 2 + nx * tam * 0.75, (az + bz) / 2 + nz * tam * 0.75);
        g.rotate(ang);
        g.fillStyle = fondo; g.globalAlpha = 0.85; g.fillRect(-tw / 2 - 4 * u, -tam * 0.62, tw + 8 * u, tam * 1.24); g.globalAlpha = 1;
        g.fillStyle = "#374151"; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(etiqueta, 0, 0);
        g.restore();
      }
    }
  }

  // --- fotos 360
  if (fotos) {
    const r = Math.max(9 * u, Math.min(18 * u, 0.13 * s));
    for (const p of puntos) {
      g.beginPath(); g.arc(X(p.x), Y(p.z), r * 1.9, 0, Math.PI * 2);
      g.fillStyle = acento; g.globalAlpha = 0.22; g.fill(); g.globalAlpha = 1;
      g.beginPath(); g.arc(X(p.x), Y(p.z), r, 0, Math.PI * 2);
      g.fillStyle = acento; g.fill(); g.lineWidth = 3 * u; g.strokeStyle = "#fff"; g.stroke();
    }
  }

  // --- nombres y áreas
  for (const e of estancias) {
    let [cx, cz] = puntoEtiqueta(e.poligono);
    // Busca cerca del centro un hueco libre de fotos 360 y de la franja de cotas junto a las paredes.
    const pol = e.poligono;
    const distBorde = (q) => {
      let d = Infinity;
      for (let k = 0; k < pol.length; k++) {
        const [ax, az] = pol[k], [bx, bz] = pol[(k + 1) % pol.length];
        const L2 = (bx - ax) ** 2 + (bz - az) ** 2 || 1;
        const tt = Math.max(0, Math.min(1, ((q[0] - ax) * (bx - ax) + (q[1] - az) * (bz - az)) / L2));
        d = Math.min(d, Math.hypot(q[0] - ax - tt * (bx - ax), q[1] - az - tt * (bz - az)));
      }
      return d;
    };
    const puntuar = (q) => {
      if (!dentro(q, pol)) return -Infinity;
      const dFoto = fotos && puntos.length ? Math.min(...puntos.map((p) => Math.hypot(p.x - q[0], (p.z - q[1]) * 1.6))) : 9;
      return Math.min(distBorde(q) - (medidas ? 0.75 : 0.4), dFoto - 0.7, 0.4) - 0.05 * Math.hypot(q[0] - cx, q[1] - cz);
    };
    let mejor = [cx, cz], pm = puntuar(mejor);
    for (const dz of [0, -0.4, 0.4, -0.7, 0.7, -1, 1, -1.4, 1.4]) for (const dx of [0, -0.5, 0.5, -1, 1]) {
      const q = [cx + dx, cz + dz], v = puntuar(q);
      if (v > pm + 1e-6) { pm = v; mejor = q; }
    }
    [cx, cz] = mejor;
    const area = areaPoligono(e.poligono);
    const xs = e.poligono.map((p) => p[0]);
    const anchoMax = (Math.max(...xs) - Math.min(...xs)) * s * 0.85;
    let tam = Math.max(20 * u, Math.min(46 * u, 0.32 * s));
    const nombre = tx(e.nombre) || e.id;
    g.font = F(700, tam);
    while (g.measureText(nombre).width > anchoMax && tam > 14 * u) { tam -= 2 * u; g.font = F(700, tam); }
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#1d1f24";
    g.lineJoin = "round"; g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 6 * u;
    g.strokeText(nombre, X(cx), Y(cz) - tam * 0.55); g.fillText(nombre, X(cx), Y(cz) - tam * 0.55);
    g.font = F(400, tam * 0.82); g.fillStyle = "#4b5563";
    g.strokeText(`${num(area, 1, idioma)} m²`, X(cx), Y(cz) + tam * 0.6); g.fillText(`${num(area, 1, idioma)} m²`, X(cx), Y(cz) + tam * 0.6);
  }
  g.textAlign = "left";

  // --- pie: barra de escala, norte, leyenda, aviso
  const yPie = cab + altoPlano + 70 * u;
  const objetivo = anchoUtil * 0.22 / s;
  const L = [0.5, 1, 2, 5, 10, 20, 50, 100].reduce((m, v) => (Math.abs(v - objetivo) < Math.abs(m - objetivo) ? v : m), 1);
  const segs = L <= 1 ? 2 : L <= 5 ? L : 5;
  const largo = L * s;
  g.lineWidth = 2 * u; g.strokeStyle = "#1d1f24";
  for (let i = 0; i < segs; i++) {
    g.fillStyle = i % 2 ? "#ffffff" : "#1d1f24";
    g.fillRect(margen + (largo / segs) * i, yPie, largo / segs, 16 * u);
  }
  g.strokeRect(margen, yPie, largo, 16 * u);
  g.fillStyle = "#1d1f24"; g.font = F(500, 28 * u); g.textBaseline = "top";
  g.fillText("0", margen - 6 * u, yPie + 26 * u);
  g.textAlign = "center"; g.fillText(`${num(L, L < 1 ? 1 : 0, idioma)} m`, margen + largo, yPie + 26 * u); g.textAlign = "left";

  if (fotos && puntos.length) {
    const lx = margen + largo + 110 * u;
    g.beginPath(); g.arc(lx, yPie + 8 * u, 13 * u, 0, Math.PI * 2); g.fillStyle = acento; g.fill();
    g.lineWidth = 3 * u; g.strokeStyle = "#fff"; g.stroke();
    g.fillStyle = "#374151"; g.font = F(400, 28 * u); g.textBaseline = "middle";
    g.fillText(idioma === "es" ? "Foto 360°" : "360° photo", lx + 26 * u, yPie + 8 * u);
  }

  if (t.norte != null && Number.isFinite(Number(t.norte))) {
    const nx = W - margen - 60 * u, nz = yPie + 40 * u, R = 52 * u;
    g.save(); g.translate(nx, nz); g.rotate((Number(t.norte) * Math.PI) / 180);
    g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.lineWidth = 2.5 * u; g.strokeStyle = "#1d1f24"; g.stroke();
    g.beginPath(); g.moveTo(0, -R * 0.85); g.lineTo(R * 0.32, R * 0.45); g.lineTo(0, R * 0.22); g.lineTo(-R * 0.32, R * 0.45); g.closePath();
    g.fillStyle = "#1d1f24"; g.fill();
    g.font = F(700, 30 * u); g.textAlign = "center"; g.textBaseline = "bottom";
    g.fillText("N", 0, -R - 6 * u);
    g.restore();
  }
  g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillStyle = "#6b7280"; g.font = F(400, 24 * u);
  const aviso = idioma === "es"
    ? "Plano orientativo sin valor contractual. Medidas y superficies aproximadas."
    : "Indicative plan, not contractual. Approximate dimensions and areas.";
  g.fillText([aviso, t.marca?.nombre, tx(t.marca?.pie_legal)].filter(Boolean).join("  ·  ").slice(0, 220), margen, H - 50 * u);
  return aBlob(c, "image/png");
}

// ======================================================================= ficha imprimible (A4 → PDF)

const COLORES_CEE = { A: "#00a651", B: "#4cb848", C: "#bed630", D: "#fff200", E: "#fdb913", F: "#f37021", G: "#ed1c24" };

function escalaEnergetica(cee, idioma) {
  const es = idioma === "es";
  if (!cee || (cee.en_tramite && !cee.consumo_letra)) return `<p class="cee-tramite">${es ? "Certificado energético en trámite" : "Energy certificate in progress"}</p>`;
  const fila = (L, i) => {
    const marca = (letra, valor, u) => (letra === L ? `<span class="cee-flecha" style="--c:${COLORES_CEE[L]}">${L}${valor != null ? ` <small>${num(valor, 1, idioma)} ${u}</small>` : ""}</span>` : "");
    return `<div class="cee-fila"><span class="cee-barra" style="width:${34 + i * 9}%;background:${COLORES_CEE[L]}">${L}</span>
      <span class="cee-col">${marca(cee.consumo_letra, cee.consumo_valor, "kWh/m²·año")}</span>
      <span class="cee-col">${marca(cee.emisiones_letra, cee.emisiones_valor, "kg CO₂/m²·año")}</span></div>`;
  };
  return `<div class="cee"><div class="cee-fila cee-cab"><span></span><span class="cee-col">${es ? "Consumo" : "Consumption"}</span><span class="cee-col">${es ? "Emisiones" : "Emissions"}</span></div>
    ${"ABCDEFG".split("").map(fila).join("")}</div>${cee.en_tramite ? `<p class="cee-tramite">${es ? "En trámite" : "In progress"}</p>` : ""}`;
}

function datosClave(t, idioma) {
  const i = t.inmueble ?? {};
  const es = idioma === "es";
  const si = (v) => (v === true ? (es ? "Sí" : "Yes") : v === false ? "No" : v);
  const m2 = (v) => (v ? `${num(v, 0, idioma)} m²` : null);
  const filas = [
    [es ? "Operación" : "Operation", i.operacion && (es ? { venta: "Venta", alquiler: "Alquiler" }[i.operacion] ?? i.operacion : i.operacion)],
    [es ? "Tipo" : "Type", i.tipo && i.tipo[0].toUpperCase() + i.tipo.slice(1)],
    [es ? "Sup. construida" : "Built area", m2(i.superficie_construida)],
    [es ? "Sup. útil" : "Usable area", m2(i.superficie_util)],
    [es ? "Parcela" : "Plot", m2(i.superficie_parcela)],
    [es ? "Habitaciones" : "Bedrooms", i.habitaciones],
    [es ? "Baños" : "Bathrooms", i.banos],
    [es ? "Planta" : "Floor", i.planta],
    [es ? "Ascensor" : "Lift", si(i.ascensor)],
    [es ? "Orientación" : "Orientation", i.orientacion],
    [es ? "Año de construcción" : "Year built", i.ano_construccion],
    [es ? "Estado" : "Condition", texto(i.estado, idioma)],
    [es ? "Calefacción" : "Heating", texto(i.calefaccion, idioma)],
    [es ? "Aire acondicionado" : "Air conditioning", si(i.aire_acondicionado)],
    [es ? "Garaje" : "Parking", si(i.garaje)],
    [es ? "Trastero" : "Storage room", si(i.trastero)],
    [es ? "Terraza" : "Terrace", typeof i.terraza === "number" ? (i.terraza > 0 ? `${i.terraza} m²` : "No") : si(i.terraza)],
    [es ? "Piscina" : "Pool", si(i.piscina)],
    [es ? "Jardín" : "Garden", si(i.jardin)],
    [es ? "Comunidad" : "Community fees", i.gastos_comunidad_mes != null && `${formatoPrecio(i.gastos_comunidad_mes, i.moneda, idioma)}/${es ? "mes" : "month"}`],
    ["IBI", i.ibi_anual != null && `${formatoPrecio(i.ibi_anual, i.moneda, idioma)}/${es ? "año" : "year"}`],
    [es ? "Precio/m²" : "Price/m²", i.precio && i.operacion !== "alquiler" && (i.superficie_construida || i.superficie_util) && formatoPrecio(Math.round(i.precio / (i.superficie_construida || i.superficie_util)), i.moneda, idioma) + "/m²"],
  ];
  return filas.filter(([, v]) => v != null && v !== false && v !== "").map(([k, v]) => `<div class="dato"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
}

/**
 * Abre una ventana con un dossier A4 imprimible (Imprimir → Guardar como PDF).
 * Llamar desde un gesto del usuario (clic) para que el navegador no bloquee la ventana.
 * @param {object} tour
 * @param {{enlace?: string, idioma?: string, base?: string, archivos?: Map, portada?: Blob|string, autoImprimir?: boolean}} [o]
 *        enlace: URL pública del recorrido (genera el QR). portada: imagen para la cabecera (p. ej. await visor.capturar()).
 * @returns {Window}
 */
export function abrirFichaImprimible(tour, { enlace, idioma, base, archivos, portada, autoImprimir = false } = {}) {
  const w = window.open("", "_blank");
  if (!w) throw new Error("El navegador bloqueó la ventana emergente: permite las ventanas emergentes para este sitio");
  w.document.write('<!doctype html><meta charset="utf-8"><title>Preparando ficha…</title><p style="font:16px system-ui;padding:2em">Preparando la ficha…</p>');
  w.document.close();
  base ??= baseDe();
  const t = limpiarTour(tour);
  idioma ??= t.idioma ?? "es";
  const tx = (v) => texto(v, idioma);
  const es = idioma === "es";
  const urlsTemporales = [];
  const urlDe = async (ruta) => {
    if (!ruta) return null;
    if (ruta.blob instanceof Blob) ruta = ruta.blob; // resultado de visor.capturar()
    if (ruta instanceof Blob) { const u = URL.createObjectURL(ruta); urlsTemporales.push(u); return u; }
    if (archivos?.has(ruta) || archivos?.has(normalizar(ruta))) return urlDe(await obtenerBlob(ruta, { archivos, base }));
    return resolverURL(ruta, base);
  };

  (async () => {
    const i = t.inmueble ?? {};
    const acento = t.marca?.color ?? "#c8a24a";
    let planoURL = null;
    const plantas = t.plantas?.length ? t.plantas : [{ id: undefined }];
    const planos = [];
    for (const p of plantas) {
      const datos = plantaDe(t, p.id);
      if (!datos.muros.length && !datos.estancias.length && !datos.plano?.imagen) continue;
      try { planos.push({ nombre: tx(p.nombre), url: await urlDe(await exportarPlano(t, p.id, { px: 2000, idioma, base, archivos })) }); } catch (e) { console.warn("[ficha] plano", e); }
    }
    planoURL = planos[0]?.url;
    const fotos = [];
    for (const p of t.panoramas ?? []) {
      const src = p.miniatura ?? p.imagen_movil ?? p.imagen;
      if (typeof src !== "string") continue;
      fotos.push({ nombre: tx(p.nombre) || p.id, url: await urlDe(src) });
      if (fotos.length >= 9) break;
    }
    const portadaURL = portada ? await urlDe(portada) : null;
    const logoURL = t.marca?.logo ? await urlDe(t.marca.logo) : null;
    const qr = enlace ? qrSVG(enlace, { margen: 2 }) : "";
    const direccion = i.direccion ? (i.mostrar_direccion_exacta ? i.direccion : i.direccion.split(",").slice(-1)[0].trim()) : "";
    const caracteristicas = (i.caracteristicas ?? []).map((c) => `<li>${esc(tx(c))}</li>`).join("");
    const avisos = [tx(i.aviso_legal), es
      ? "La información de esta ficha es orientativa y no tiene carácter contractual. Superficies y medidas aproximadas. Precio sin impuestos ni gastos de compraventa salvo indicación."
      : "This information is indicative and not contractual. Approximate areas and dimensions. Price excludes taxes and purchase costs unless stated.", tx(t.marca?.pie_legal)].filter(Boolean);

    const html = `<!doctype html>
<html lang="${esc(idioma)}"><head><meta charset="utf-8">
<title>${esc(tx(t.titulo) || "Ficha")}${i.referencia ? " · " + esc(i.referencia) : ""}</title>
<style>
  @page { size: A4; margin: 12mm 12mm 14mm; }
  :root { --acento: ${/^#[0-9a-f]{3,8}$/i.test(acento) ? acento : "#c8a24a"}; --tinta: #1d1f24; --gris: #5b6270; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 10.5pt/1.45 "Helvetica Neue", Arial, system-ui, sans-serif; color: var(--tinta); background: #e9ebef; }
  .hoja { width: 210mm; margin: 12px auto; background: #fff; padding: 12mm; box-shadow: 0 2px 14px rgba(0,0,0,.15); }
  @media print { body { background: #fff; } .hoja { width: auto; margin: 0; padding: 0; box-shadow: none; } .no-imprimir { display: none !important; } }
  .barra-imp { position: sticky; top: 0; display: flex; gap: 8px; justify-content: center; padding: 10px; background: #1d1f24; color: #fff; font: 14px system-ui; z-index: 2; }
  .barra-imp button { font: 600 14px system-ui; padding: 8px 18px; border: 0; border-radius: 6px; background: var(--acento); color: #111; cursor: pointer; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 3px solid var(--acento); padding-bottom: 4mm; margin-bottom: 5mm; }
  header img { max-height: 16mm; max-width: 60mm; object-fit: contain; }
  header .marca { font-weight: 700; font-size: 14pt; color: var(--acento); letter-spacing: .04em; text-transform: uppercase; }
  header .ref { color: var(--gris); font-size: 9.5pt; text-align: right; }
  h1 { font-size: 19pt; line-height: 1.15; margin: 0 0 1.5mm; }
  .direccion { color: var(--gris); margin: 0 0 3mm; }
  .precio { font-size: 22pt; font-weight: 800; color: var(--tinta); margin: 0 0 4mm; }
  .precio small { font-size: 11pt; color: var(--gris); font-weight: 400; }
  .portada { width: 100%; height: 78mm; object-fit: cover; border-radius: 2mm; margin-bottom: 5mm; display: block; }
  .dos { display: grid; grid-template-columns: 1.25fr 1fr; gap: 7mm; }
  h2 { font-size: 11.5pt; text-transform: uppercase; letter-spacing: .06em; color: var(--gris); border-bottom: 1px solid #dde1e7; padding-bottom: 1.5mm; margin: 5mm 0 3mm; }
  dl { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2mm 6mm; margin: 0; }
  .dato { display: flex; justify-content: space-between; border-bottom: 1px dotted #d3d7de; padding: .6mm 0; }
  dt { color: var(--gris); } dd { margin: 0; font-weight: 600; text-align: right; }
  .cee { font-size: 8.5pt; }
  .cee-fila { display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; height: 5.2mm; margin-bottom: .7mm; }
  .cee-cab { color: var(--gris); font-weight: 600; height: auto; }
  .cee-barra { display: block; height: 100%; color: #fff; font-weight: 800; padding-left: 2mm; line-height: 5.2mm; clip-path: polygon(0 0, calc(100% - 2.6mm) 0, 100% 50%, calc(100% - 2.6mm) 100%, 0 100%); -webkit-print-color-adjust: exact; print-color-adjust: exact; text-shadow: 0 0 2px rgba(0,0,0,.45); }
  .cee-col { text-align: center; }
  .cee-flecha { display: inline-block; background: var(--c); color: #fff; font-weight: 800; padding: 0 2.5mm 0 3.5mm; line-height: 5.2mm; clip-path: polygon(2.4mm 0, 100% 0, 100% 100%, 2.4mm 100%, 0 50%); -webkit-print-color-adjust: exact; print-color-adjust: exact; text-shadow: 0 0 2px rgba(0,0,0,.45); white-space: nowrap; }
  .cee-flecha small { font-weight: 600; font-size: 7pt; }
  .cee-tramite { font-weight: 600; }
  ul.caract { columns: 2; padding-left: 4mm; margin: 0; } ul.caract li { margin-bottom: 1mm; break-inside: avoid; }
  .descripcion { white-space: pre-line; text-align: justify; }
  .salto { break-before: page; page-break-before: always; }
  .plano { width: 100%; border: 1px solid #e3e6eb; border-radius: 2mm; display: block; }
  .plano-nombre { font-weight: 600; margin: 3mm 0 1mm; }
  .fotos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }
  .fotos figure { margin: 0; break-inside: avoid; } .fotos img { width: 100%; aspect-ratio: 2 / 1; object-fit: cover; border-radius: 1.5mm; display: block; }
  .fotos figcaption { font-size: 8.5pt; color: var(--gris); margin-top: .8mm; }
  .contacto { display: grid; grid-template-columns: 1fr 34mm; gap: 6mm; align-items: center; background: #f5f6f8; border-left: 4px solid var(--acento); padding: 4mm 5mm; margin-top: 6mm; break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .contacto .qr svg { width: 34mm; height: 34mm; display: block; }
  .contacto p { margin: .5mm 0; } .contacto .enlace { font-size: 8.5pt; color: var(--gris); word-break: break-all; }
  .legal { font-size: 7.5pt; color: var(--gris); margin-top: 5mm; border-top: 1px solid #dde1e7; padding-top: 2mm; }
  .legal p { margin: .6mm 0; }
</style></head>
<body>
<div class="barra-imp no-imprimir">${es ? "Para guardar en PDF: Imprimir → Destino «Guardar como PDF»" : "To save as PDF: Print → Destination “Save as PDF”"} <button onclick="print()">${es ? "Imprimir / Guardar PDF" : "Print / Save PDF"}</button></div>
<div class="hoja">
  <header>
    ${logoURL ? `<img src="${esc(logoURL)}" alt="${esc(t.marca?.nombre ?? "")}">` : `<span class="marca">${esc(t.marca?.nombre ?? "")}</span>`}
    <div class="ref">${i.referencia ? `Ref. <strong>${esc(i.referencia)}</strong><br>` : ""}${esc(new Date().toLocaleDateString(es ? "es-ES" : idioma))}</div>
  </header>
  ${portadaURL ? `<img class="portada" src="${esc(portadaURL)}" alt="">` : ""}
  <h1>${esc(tx(t.titulo))}</h1>
  ${direccion ? `<p class="direccion">${esc(direccion)}</p>` : ""}
  ${i.precio != null ? `<p class="precio">${esc(precioTexto(t, idioma))}${i.estado_obra === "proyecto" ? ` <small>· ${es ? "obra nueva / proyecto" : "new build / project"}</small>` : ""}</p>` : ""}
  <div class="dos">
    <section><h2>${es ? "Datos principales" : "Key facts"}</h2><dl>${datosClave(t, idioma)}</dl></section>
    <section><h2>${es ? "Certificado energético" : "Energy certificate"}</h2>${escalaEnergetica(i.certificado_energetico, idioma)}</section>
  </div>
  ${caracteristicas ? `<h2>${es ? "Características" : "Features"}</h2><ul class="caract">${caracteristicas}</ul>` : ""}
  ${i.descripcion ? `<h2>${es ? "Descripción" : "Description"}</h2><div class="descripcion">${esc(tx(i.descripcion))}</div>` : ""}
  ${planos.length ? `<div class="salto"></div><h2>${es ? "Plano" : "Floor plan"}</h2>${planos.map((p) => `${planos.length > 1 && p.nombre ? `<p class="plano-nombre">${esc(p.nombre)}</p>` : ""}<img class="plano" src="${esc(p.url)}" alt="${es ? "Plano" : "Floor plan"}">`).join("")}` : ""}
  ${fotos.length ? `<h2>${es ? "Estancias" : "Rooms"}</h2><div class="fotos">${fotos.map((f) => `<figure><img src="${esc(f.url)}" alt=""><figcaption>${esc(f.nombre)}</figcaption></figure>`).join("")}</div>` : ""}
  <div class="contacto">
    <div>
      <p><strong>${es ? "Visita virtual 3D" : "3D virtual tour"}</strong>${enlace ? (es ? " · escanea el código QR" : " · scan the QR code") : ""}</p>
      ${t.agente?.nombre ? `<p>${esc(tx(t.agente.nombre))}${t.marca?.nombre ? ` · ${esc(tx(t.marca.nombre))}` : ""}</p>` : t.marca?.nombre ? `<p>${esc(tx(t.marca.nombre))}</p>` : ""}
      ${t.agente?.telefono ? `<p>☎ ${esc(t.agente.telefono)}</p>` : ""}
      ${t.agente?.email ? `<p>✉ ${esc(t.agente.email)}</p>` : ""}
      ${t.marca?.web ? `<p>${esc(t.marca.web.replace(/^https?:\/\//, ""))}</p>` : ""}
      ${enlace ? `<p class="enlace">${esc(enlace)}</p>` : ""}
    </div>
    <div class="qr">${qr}</div>
  </div>
  <div class="legal">${avisos.map((a) => `<p>${esc(a)}</p>`).join("")}</div>
</div>
${autoImprimir ? "<script>addEventListener('load', () => setTimeout(print, 300));<\/script>" : ""}
</body></html>`;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.addEventListener("beforeunload", () => urlsTemporales.forEach((u) => URL.revokeObjectURL(u)));
  })().catch((e) => {
    console.error(e);
    w.document.body.textContent = `No se pudo generar la ficha: ${e.message}`;
  });
  return w;
}
