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
import { areaPoligono, puntoEnPoligono, puntoEtiqueta, hexALineal } from "./util.js";

const MODULO = import.meta.url;
/** URL absoluta de la fuente Inter autoalojada (el dossier se escribe en una ventana nueva, sin base propia). */
const fuenteInter = (sub) => new URL(`vendor/fonts/inter/inter-${sub}-opsz-normal.woff2`, MODULO).href;
/** Champán del sistema (tema.css): relleno sobre claro y sobre oscuro. */
const CHAMPAN_CLARO = "#c9a55a", CHAMPAN_OSCURO = "#cfad66";
const esHex = (c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c ?? "");
const luminancia = (hex) => { const l = hexALineal(hex); return l ? 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2] : 0.5; };
/** Mezcla `hex` con negro (fondo claro) o con blanco (fondo oscuro) lo justo para que cumpla `ok(color)`. */
function mezclarHasta(hex, fondo, ok) {
  const h = hex.length === 4 ? hex.replace(/[0-9a-f]/gi, (c) => c + c) : hex;
  const rgb = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), destino = luminancia(fondo) > 0.5 ? 0 : 255;
  for (let t = 0; t <= 1; t += 0.05) {
    const c = "#" + rgb.map((v) => Math.round(v + (destino - v) * t).toString(16).padStart(2, "0")).join("");
    if (ok(c)) return c;
  }
  return destino ? "#ffffff" : "#000000";
}
/** Variante del color de acento que se lee (≥ 4,5:1) sobre `fondo`. */
function acentoLegible(hex, fondo) {
  const contraste = (a) => { const [x, y] = [luminancia(a), luminancia(fondo)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  return mezclarHasta(hex, fondo, (c) => contraste(c) >= 4.5);
}
/** Relleno de acento que se ve sobre `fondo`, con los mismos topes que aplicarMarca() del visor: una marca blanca no se
 *  pierde en el papel (luminancia ≤ 0,55) ni una negra en el vídeo (≥ 0,06). El champán no cambia. */
function acentoRelleno(hex, fondo) {
  const claro = luminancia(fondo) > 0.5;
  return mezclarHasta(hex, fondo, (c) => (claro ? luminancia(c) <= 0.55 : luminancia(c) >= 0.06));
}
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
  // Copia profunda con la semántica de JSON, pero descartando las piezas de three.js ANTES de serializarlas
  // (JSON.stringify llamaría a Texture.toJSON, que intenta volcar las imágenes y agota la memoria con la demo).
  // Solo se cortan los ciclos: un mismo objeto referenciado desde dos sitios se copia en ambos.
  const ruta = new WeakSet();
  const copiar = (v) => {
    if (v === null || typeof v !== "object") {
      if (typeof v === "number") return Number.isFinite(v) ? v : null;
      return typeof v === "function" || typeof v === "symbol" || typeof v === "bigint" ? undefined : v;
    }
    if (v.isTexture || v.isObject3D || v.isMaterial || v.isWebGLRenderTarget || v.isBufferGeometry ||
        (typeof HTMLElement !== "undefined" && v instanceof HTMLElement) || ruta.has(v)) return undefined;
    if (typeof v.toJSON === "function" && !Array.isArray(v)) return copiar(v.toJSON());
    ruta.add(v);
    let r;
    if (Array.isArray(v)) r = v.map((x) => copiar(x) ?? null);
    else {
      r = {};
      for (const [k, x] of Object.entries(v)) {
        if (k === "vecinos" || k === "textura" || k.startsWith("_")) continue;
        const c = copiar(x);
        if (c !== undefined) r[k] = c;
      }
    }
    ruta.delete(v);
    return r;
  };
  return copiar(tour) ?? {};
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
  try { return new Intl.NumberFormat(idioma === "es" ? "es-ES" : idioma, { style: "currency", currency: moneda, maximumFractionDigits: 0, useGrouping: "always" }).format(n); }
  catch { return `${n} ${moneda}`; }
}
const num = (n, dec = 0, idioma = "es") => new Intl.NumberFormat(idioma === "es" ? "es-ES" : idioma, { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: "always" }).format(n);

// Textos del plano y del dossier en los idiomas del visor (si falta uno, inglés).
const ROTULOS = {
  plano: { es: "Plano", en: "Floor plan", fr: "Plan", de: "Grundriss" },
  sup_estancias: { es: "Superficie estancias", en: "Rooms area", fr: "Surface des pièces", de: "Fläche der Räume" },
  foto360: { es: "Foto 360°", en: "360° photo", fr: "Photo 360°", de: "360°-Foto" },
  aviso_plano: {
    es: "Plano orientativo sin valor contractual. Medidas y superficies aproximadas.",
    en: "Indicative plan, not contractual. Approximate dimensions and areas.",
    fr: "Plan indicatif sans valeur contractuelle. Dimensions et surfaces approximatives.",
    de: "Unverbindlicher Grundriss. Maße und Flächen sind ca.-Angaben.",
  },
  mes: { es: "mes", en: "month", fr: "mois", de: "Monat" },
  ano: { es: "año", en: "year", fr: "an", de: "Jahr" },
  si: { es: "Sí", en: "Yes", fr: "Oui", de: "Ja" },
  no: { es: "No", en: "No", fr: "Non", de: "Nein" },
  cee_tramite: { es: "Certificado energético en trámite", en: "Energy certificate in progress", fr: "Certificat énergétique en cours", de: "Energieausweis in Bearbeitung" },
  consumo: { es: "Consumo", en: "Consumption", fr: "Consommation", de: "Verbrauch" },
  emisiones: { es: "Emisiones", en: "Emissions", fr: "Émissions", de: "Emissionen" },
  en_tramite: { es: "En trámite", en: "In progress", fr: "En cours", de: "In Bearbeitung" },
  operacion: { es: "Operación", en: "Operation", fr: "Transaction", de: "Angebot" },
  venta: { es: "Venta", en: "Sale", fr: "Vente", de: "Kauf" },
  alquiler: { es: "Alquiler", en: "Rent", fr: "Location", de: "Miete" },
  tipo: { es: "Tipo", en: "Type", fr: "Type", de: "Typ" },
  sup_construida: { es: "Sup. construida", en: "Built area", fr: "Surface construite", de: "Bruttofläche" },
  sup_util: { es: "Sup. útil", en: "Usable area", fr: "Surface habitable", de: "Wohnfläche" },
  parcela: { es: "Parcela", en: "Plot", fr: "Terrain", de: "Grundstück" },
  habitaciones: { es: "Habitaciones", en: "Bedrooms", fr: "Chambres", de: "Schlafzimmer" },
  banos: { es: "Baños", en: "Bathrooms", fr: "Salles de bain", de: "Badezimmer" },
  planta: { es: "Planta", en: "Floor", fr: "Étage", de: "Etage" },
  ascensor: { es: "Ascensor", en: "Lift", fr: "Ascenseur", de: "Aufzug" },
  orientacion: { es: "Orientación", en: "Orientation", fr: "Orientation", de: "Ausrichtung" },
  ano_construccion: { es: "Año de construcción", en: "Year built", fr: "Année de construction", de: "Baujahr" },
  estado: { es: "Estado", en: "Condition", fr: "État", de: "Zustand" },
  calefaccion: { es: "Calefacción", en: "Heating", fr: "Chauffage", de: "Heizung" },
  aire: { es: "Aire acondicionado", en: "Air conditioning", fr: "Climatisation", de: "Klimaanlage" },
  garaje: { es: "Garaje", en: "Parking", fr: "Parking", de: "Stellplatz" },
  trastero: { es: "Trastero", en: "Storage room", fr: "Cave", de: "Abstellraum" },
  terraza: { es: "Terraza", en: "Terrace", fr: "Terrasse", de: "Terrasse" },
  piscina: { es: "Piscina", en: "Pool", fr: "Piscine", de: "Pool" },
  jardin: { es: "Jardín", en: "Garden", fr: "Jardin", de: "Garten" },
  comunidad: { es: "Comunidad", en: "Community fees", fr: "Charges de copropriété", de: "Hausgeld" },
  precio_m2: { es: "Precio/m²", en: "Price/m²", fr: "Prix/m²", de: "Preis/m²" },
  aviso_ficha: {
    es: "La información de esta ficha es orientativa y no tiene carácter contractual. Superficies y medidas aproximadas. Precio sin impuestos ni gastos de compraventa salvo indicación.",
    en: "This information is indicative and not contractual. Approximate areas and dimensions. Price excludes taxes and purchase costs unless stated.",
    fr: "Les informations de cette fiche sont indicatives et non contractuelles. Surfaces et dimensions approximatives. Prix hors taxes et frais d’acquisition sauf mention contraire.",
    de: "Die Angaben in diesem Exposé sind unverbindlich. Flächen und Maße sind ca.-Angaben. Preis zzgl. Steuern und Erwerbsnebenkosten, sofern nicht anders angegeben.",
  },
  barra_pdf: {
    es: "Para guardar en PDF: Imprimir → Destino «Guardar como PDF»",
    en: "To save as PDF: Print → Destination “Save as PDF”",
    fr: "Pour enregistrer en PDF : Imprimer → Destination « Enregistrer au format PDF »",
    de: "Als PDF speichern: Drucken → Ziel „Als PDF speichern“",
  },
  imprimir: { es: "Imprimir / Guardar PDF", en: "Print / Save PDF", fr: "Imprimer / Enregistrer en PDF", de: "Drucken / Als PDF speichern" },
  obra_nueva: { es: "obra nueva / proyecto", en: "new build / project", fr: "neuf / sur plan", de: "Neubau / Projekt" },
  datos_principales: { es: "Datos principales", en: "Key facts", fr: "Informations clés", de: "Eckdaten" },
  certificado: { es: "Certificado energético", en: "Energy certificate", fr: "Certificat énergétique", de: "Energieausweis" },
  caracteristicas: { es: "Características", en: "Features", fr: "Caractéristiques", de: "Ausstattung" },
  descripcion: { es: "Descripción", en: "Description", fr: "Description", de: "Beschreibung" },
  estancias: { es: "Estancias", en: "Rooms", fr: "Pièces", de: "Räume" },
  visita: { es: "Visita virtual 3D", en: "3D virtual tour", fr: "Visite virtuelle 3D", de: "Virtueller 3D-Rundgang" },
  escanea: { es: "escanea el código QR", en: "scan the QR code", fr: "scannez le code QR", de: "QR-Code scannen" },
};
const rotulo = (idioma, clave) => ROTULOS[clave]?.[idioma] ?? ROTULOS[clave]?.en ?? clave;

/** Precio con sufijo /mes en alquiler. */
function precioTexto(t, idioma) {
  const i = t.inmueble ?? {};
  if (i.precio == null) return "";
  return formatoPrecio(i.precio, i.moneda ?? "EUR", idioma) + (i.operacion === "alquiler" ? `/${rotulo(idioma, "mes")}` : "");
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
  "index.html", "visor.js", "visor.css", "paneles.js", "paneles.css", "i18n.js", "vendor/qr.js",
  "util.js", "plano.js", "guion.js", "medicion.js", "maqueta.js",
  // Sistema de diseño: sin él, el visor publicado sale sin estilos en la interfaz nueva.
  "tema.js", "tema.css", "vendor/fonts/inter/inter-latin-opsz-normal.woff2", "vendor/fonts/inter/inter-latin-ext-opsz-normal.woff2", "vendor/fonts/inter/OFL.txt",
];
// El recorrido publicado nunca usa la demo ni las herramientas de exportación: no viajan en el ZIP (≈ 193 kB).
const NO_PUBLICAR = new Set(["demo.js", "exportar.js", "vendor/fflate.js", "vendor/fix-webm-duration.js"]);
const SIN_COMPRIMIR = /\.(jpe?g|png|webp|avif|gif|mp4|webm|mov|sog|spz|ksplat|glb|zip|pdf|woff2?|mp3|m4a|aac|ogg|opus)$/i;

/**
 * three.js (y Spark si hay un splat) viajan en el ZIP: el recorrido publicado no depende de un CDN ni manda la IP de cada
 * visitante a un tercero (M2). Se copian de las mismas direcciones fijas del importmap de index.html y el importmap pasa a
 * rutas locales. Si no se pueden traer, index.html se queda con el CDN y se avisa.
 */
async function sinCDN(html, t, poner, avisos) {
  const m = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
  let mapa;
  try { mapa = JSON.parse(m?.[1] ?? ""); } catch { return html; }
  const im = mapa.imports ?? {}, abs = (u) => new URL(u, MODULO).href;
  if (!im.three || !im["three/addons/"]) return html;
  const libre = t.libre ?? {}, splat = libre.tipo === "splat" && !!im["@sparkjsdev/spark"], glb = libre.tipo === "glb" || (splat && !!libre.colisionador);
  const jsm = ["controls/OrbitControls.js", ...(glb ? ["loaders/GLTFLoader.js", "utils/BufferGeometryUtils.js", "utils/SkeletonUtils.js"] : []), ...(splat ? ["postprocessing/Pass.js"] : [])];
  const lista = [["vendor/three/build/three.module.min.js", abs(im.three)], ["vendor/three/build/three.core.min.js", new URL("three.core.min.js", abs(im.three)).href],
    ...jsm.map((f) => [`vendor/three/examples/jsm/${f}`, abs(im["three/addons/"] + f)]), ...(splat ? [["vendor/spark/spark.module.js", abs(im["@sparkjsdev/spark"])]] : [])];
  try {
    const bajados = await Promise.all(lista.map(async ([ruta, url]) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return [ruta, await r.blob()];
    }));
    for (const [ruta, blob] of bajados) await poner(ruta, blob);
  } catch (e) {
    avisos.push(`No se pudo incluir three.js (${e.message}): el recorrido lo cargará de internet (cdn.jsdelivr.net)`);
    return html;
  }
  const imports = { ...im, three: "./vendor/three/build/three.module.min.js", "three/addons/": "./vendor/three/examples/jsm/" };
  if (splat) imports["@sparkjsdev/spark"] = "./vendor/spark/spark.module.js";
  return html.replace(m[1], () => `\n    ${JSON.stringify({ ...mapa, imports }, null, 2).replace(/\n/g, "\n    ")}\n  `);
}

/** Código para incrustar el recorrido en otra web: el mismo en el Estudio y en el LEEME (M7). Sin ?embed (es el modo
 * de la vista previa del Estudio) y con clipboard-write (copiar la foto de la consulta) y web-share (Compartir). */
export const codigoIncrustar = (url, titulo) => `<iframe src="${esc(url)}" width="100%" height="600" style="border:0;border-radius:12px" ` +
  `allow="fullscreen; gyroscope; accelerometer; xr-spatial-tracking; clipboard-write; web-share" allowfullscreen loading="lazy" title="${esc(titulo)}"></iframe>`;

function leeme(t, idioma) {
  const titulo = texto(t.titulo, idioma) || "Recorrido virtual";
  // Con url_publica, todo apunta a esa dirección exacta: es la que llevan dentro el enlace de cada consulta, el QR y el
  // dossier (M6). Sin ella, instrucciones genéricas.
  const url = /^https?:\/\/\S+$/i.test(t.url_publica ?? "") ? t.url_publica : null;
  const subir = url
    ? `   - Descomprime el ZIP y sube su contenido, respetando las subcarpetas, para que quede en esta dirección exacta:
       ${url}
     por FTP (FileZilla) o con el administrador de archivos de tu hosting (cPanel, Plesk…).
   - Esa dirección va dentro del recorrido: el enlace de cada consulta por WhatsApp, el código QR y el
     dossier la usan. Si lo subes a otra dirección, cámbiala en el Estudio (Publicar → Tu web) y vuelve
     a descargar el ZIP; si no, esos enlaces no funcionarán.`
    : `   - Descomprime el ZIP y sube la carpeta COMPLETA (respetando las subcarpetas) a tu hosting, por FTP
     (FileZilla) o con el administrador de archivos (cPanel, Plesk…).
   - Escribe tu web en el Estudio (Publicar → Tu web) y vuelve a descargar: así el recorrido sabrá su
     dirección y tendrá enlace para compartir, código QR y fotos con enlace en las consultas.`;
  return `RECORRIDO VIRTUAL 3D · ${titulo}
${"=".repeat(Math.min(78, 22 + titulo.length))}

Esta carpeta es un recorrido virtual completo listo para publicar en tu web.
Contenido:
  index.html, visor.js, visor.css…   el visor (no hace falta instalar nada; three.js va incluido)
  tour.json                          los datos del recorrido (estancias, textos, precio, contacto…)
  panos/, marca/, recursos/…         fotos 360, logotipo, plano y documentos

1) SUBIRLO A TU HOSTING
${subir}
   - Usa HTTPS: sin él, el giroscopio del móvil y el modo pantalla completa no funcionan.
   - index.html NO funciona con doble clic desde el ordenador (el navegador bloquea la lectura de
     tour.json fuera de un servidor). Para enviar el recorrido como un único archivo que se abre con
     doble clic, usa «Recorrido en un solo archivo» en el Estudio.
   - Para probarlo en local: en esta carpeta ejecuta  python3 -m http.server 8000
     y abre http://localhost:8000/

2) COMPARTIR EL ENLACE
   - Comparte ${url ?? "la dirección del recorrido"} por WhatsApp, email o redes. Puedes abrir una estancia
     concreta añadiendo #id-de-la-estancia al final, o el paseo libre con ?modo=libre

3) INSERTARLO EN TU WEB (iframe)
   Pega este código en la ficha del inmueble (WordPress: bloque "HTML personalizado"):

   ${codigoIncrustar(url ?? "https://DIRECCIÓN-DEL-RECORRIDO/", titulo)}

4) PORTALES (idealista, Fotocasa, habitaclia, pisos.com…)
   - idealista y Fotocasa solo aceptan en «visita virtual» enlaces de proveedores homologados: compruébalo
     en tu panel antes de pegar la dirección del recorrido.
   - Sube además (desde el Estudio, Publicar → Portales y redes):
       · el VÍDEO de la visita guiada (16:9; 9:16 para Reels, TikTok y Shorts),
       · las FOTOS 360 en JPG con metadatos GPano (Facebook y Google las muestran como 360),
       · el PLANO con medidas y el DOSSIER en PDF.

5) ACTUALIZAR
   Para cambiar textos, precio o fotos, vuelve a exportar desde el Estudio y sustituye los archivos en el
   hosting. Mientras la dirección sea la misma, el enlace y el QR siguen valiendo.

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
      for (const f of [...(m.modulos_locales ?? []), ...(m.hojas ?? [])]) if (!f.startsWith("..") && !f.startsWith("/") && !NO_PUBLICAR.has(f)) lista.add(f);
    } catch { /* sin build: solo la lista base */ }
    for (const f of lista) {
      try {
        const r = await fetch(new URL(f, MODULO));
        if (!r.ok) continue; // p. ej. paneles.js aún no existe: se ignora
        await poner(f, await r.blob());
      } catch { /* sin red / file:// */ }
    }
    if (!salida["index.html"]) avisos.push("No se pudo incluir index.html del visor (¿exportando desde file://?)");
    else salida["index.html"] = [strToU8(await sinCDN(new TextDecoder().decode(salida["index.html"][0]), t, poner, avisos)), { level: 6 }];
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
  // Sin modo libre se usa el bundle ligero (sin Spark ni la demo): ≈ 4,8 MB menos por archivo.
  const completo = (incluirLibre && tour?.libre) || tour?.demo || tour?.libre?.tipo === "demo";
  try { [js, css] = await Promise.all([traer(completo ? "dist/visor-autonomo.js" : "dist/visor-autonomo-ligero.js").catch(() => traer("dist/visor-autonomo.js")), traer("dist/visor-autonomo.css")]); }
  catch (e) { throw new Error(`Falta el visor compilado (dist/visor-autonomo.js): ejecuta "npm install && npm run build" en tools/visor-inmobiliario (${e.message})`); }
  // Un build antiguo no sabe leer el tour incrustado y mostraría la demo: mejor un error claro.
  if (!js.includes("TOUR_EMBEBIDO")) throw new Error('El visor compilado (dist/) está desactualizado: ejecuta "npm run build" en tools/visor-inmobiliario y vuelve a exportar.');
  // tema.js es un script clásico (no entra en el bundle): va en línea en <head>, antes del CSS, como en index.html.
  // Sin él, el visor arranca igual con el tema oscuro por defecto de tema.css.
  const temaJS = await traer("tema.js").catch(() => { avisos.push("No se pudo incluir tema.js: se usa el tema oscuro por defecto"); return ""; });
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
    `<title>${esc(tituloDoc)}</title>\n`,
    temaJS ? `<script>\n${temaJS.replace(/<\/script/gi, "<\\/script")}\n</script>\n` : "",
    `<style>\n`, seguroCSS, `\n</style>\n</head>\n<body>\n`, cuerpo,
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

/** Letra del producto para lo que se dibuja en un lienzo (plano, vídeo): la pila de --fuente, con Inter ya cargada. */
async function fuenteProducto() {
  try { await document.fonts?.load?.('600 20px "Inter Variable"'); } catch { /* sin Inter: la del sistema */ }
  return getComputedStyle(document.documentElement).getPropertyValue("--fuente").trim() || "system-ui, sans-serif";
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
  const acento = acentoRelleno(esHex(tour.marca?.color) ? tour.marca.color : CHAMPAN_OSCURO, "#000000");
  const acentoTexto = acentoLegible(acento, "#000000"); // el texto de color va sobre franjas oscuras
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
  const pila = await fuenteProducto();
  const fuente = (peso, px) => `${peso} ${Math.round(px * u)}px ${pila}`;

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
      g.font = fuente(700, 30); g.fillStyle = acentoTexto; g.textBaseline = "top";
      g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 8 * u;
      g.fillText(textoAjustado(g, t(tour.marca.nombre).toUpperCase(), W * 0.4), x, y);
    }
    g.textBaseline = "top"; g.fillStyle = "#fff";
    g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 8 * u;
    const anchoTexto = W - x - 48 * u;
    const yT = logo || !tour.marca?.nombre ? y : y + 42 * u;
    g.font = fuente(700, 44); g.fillText(textoAjustado(g, titulo, anchoTexto), x, yT);
    if (precio) { g.font = fuente(800, 40); g.fillStyle = acentoTexto; g.fillText(precio, x, yT + 56 * u); }
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

/**
 * Inserta metadatos XMP GPano (foto esférica equirectangular) en un JPEG, reemplazando cualquier XMP previo.
 * Facebook, Google Fotos/Maps, Kuula y muchos portales detectan así la foto como 360.
 * Si `blob` no es JPEG (PNG/WebP), se convierte a JPEG (calidad 0.92).
 * @param {Blob} blob
 * @param {{ancho?: number, alto?: number, rumboInicial?: number, cabeceoInicial?: number, fovInicial?: number, rumboNorte?: number, maxMB?: number}} [o]
 *        ancho/alto: por defecto los del JPEG. Si alto < ancho/2 se declara como panorama recortado (centrado).
 *        rumboInicial: dirección de la vista inicial en grados, RELATIVA al centro de la foto (horario).
 *        rumboNorte: rumbo de brújula del centro de la foto (PoseHeadingDegrees), si se conoce.
 * @returns {Promise<Blob>} image/jpeg
 */
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
    // GPano mide la vista inicial en el mismo marco que PoseHeadingDegrees: con el norte conocido es un rumbo de
    // brújula (así la leen Google y Photo Sphere Viewer); sin él, es relativa al centro de la foto.
    InitialViewHeadingDegrees: grados(rumboNorte != null ? rumboNorte + rumboInicial : rumboInicial),
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
  const papel = fondo === "transparent" || !esHex(fondo) ? "#ffffff" : fondo;
  const acento = acentoRelleno(esHex(t.marca?.color) ? t.marca.color : CHAMPAN_CLARO, papel);
  const acentoTexto = acentoLegible(acento, papel);
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
  const pila = await fuenteProducto();
  const F = (peso, tam) => `${peso} ${Math.round(tam)}px ${pila}`;

  // --- cabecera
  let xc = margen;
  if (imgLogo) {
    const lh = 110 * u, lw = Math.min(420 * u, lh * (imgLogo.naturalWidth / imgLogo.naturalHeight || 1));
    g.drawImage(imgLogo, xc, 60 * u, lw, lh);
    xc += lw + 40 * u;
  }
  g.textBaseline = "alphabetic"; g.fillStyle = "#1d1f24";
  const titulo = tx(t.titulo);
  if (!imgLogo && t.marca?.nombre) { g.font = F(700, 34 * u); g.fillStyle = acentoTexto; g.fillText(tx(t.marca.nombre).toUpperCase(), xc, 88 * u); g.fillStyle = "#1d1f24"; }
  g.font = F(700, 54 * u);
  g.fillText(textoAjustado(g, titulo || rotulo(idioma, "plano"), W - xc - margen - 500 * u), xc, imgLogo || !t.marca?.nombre ? 120 * u : 150 * u);
  const sub = [plantas.length > 1 || planta.nombre ? tx(planta.nombre) : "", t.inmueble?.direccion && t.inmueble?.mostrar_direccion_exacta ? t.inmueble.direccion : ""].filter(Boolean).join(" · ");
  if (sub) { g.font = F(400, 34 * u); g.fillStyle = "#555b66"; g.fillText(textoAjustado(g, sub, W - xc - margen - 500 * u), xc, (imgLogo || !t.marca?.nombre ? 120 : 150) * u + 50 * u); }
  g.textAlign = "right"; g.fillStyle = "#555b66"; g.font = F(400, 30 * u);
  if (t.inmueble?.referencia) g.fillText(`Ref. ${t.inmueble.referencia}`, W - margen, 100 * u);
  const totalArea = estancias.reduce((a, e) => a + areaPoligono(e.poligono), 0);
  if (totalArea) g.fillText(`${rotulo(idioma, "sup_estancias")}: ${num(totalArea, 1, idioma)} m²`, W - margen, 145 * u);
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
      if (!puntoEnPoligono(q, pol)) return -Infinity;
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
    g.fillText(rotulo(idioma, "foto360"), lx + 26 * u, yPie + 8 * u);
  }

  if (t.norte != null && Number.isFinite(Number(t.norte))) {
    const nx = W - margen - 60 * u, nz = yPie + 40 * u, R = 52 * u;
    // `norte` es el rumbo de brújula de «arriba» del plano: el norte queda girado −norte (igual que el minimapa).
    g.save(); g.translate(nx, nz); g.rotate((-Number(t.norte) * Math.PI) / 180);
    g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.lineWidth = 2.5 * u; g.strokeStyle = "#1d1f24"; g.stroke();
    g.beginPath(); g.moveTo(0, -R * 0.85); g.lineTo(R * 0.32, R * 0.45); g.lineTo(0, R * 0.22); g.lineTo(-R * 0.32, R * 0.45); g.closePath();
    g.fillStyle = "#1d1f24"; g.fill();
    g.font = F(700, 30 * u); g.textAlign = "center"; g.textBaseline = "bottom";
    g.fillText("N", 0, -R - 6 * u);
    g.restore();
  }
  g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillStyle = "#6b7280"; g.font = F(400, 24 * u);
  const aviso = rotulo(idioma, "aviso_plano");
  g.fillText([aviso, t.marca?.nombre, tx(t.marca?.pie_legal)].filter(Boolean).join("  ·  ").slice(0, 220), margen, H - 50 * u);
  return aBlob(c, "image/png");
}

// ======================================================================= ficha imprimible (A4 → PDF)

const COLORES_CEE = { A: "#00a651", B: "#4cb848", C: "#bed630", D: "#fff200", E: "#fdb913", F: "#f37021", G: "#ed1c24" };

function escalaEnergetica(cee, idioma) {
  const r = (k) => rotulo(idioma, k);
  if (cee?.en_tramite && !cee.consumo_letra) return `<p class="cee-tramite">${r("cee_tramite")}</p>`;
  if (!cee?.consumo_letra && !cee?.emisiones_letra) return ""; // sin datos no se afirma nada (ni «en trámite»)
  const fila = (L, i) => {
    const marca = (letra, valor, u) => (letra === L ? `<span class="cee-flecha" style="--c:${COLORES_CEE[L]}">${L}${valor != null ? ` <small>${num(valor, 1, idioma)} ${u}</small>` : ""}</span>` : "");
    return `<div class="cee-fila"><span class="cee-barra" style="width:${34 + i * 9}%;background:${COLORES_CEE[L]}">${L}</span>
      <span class="cee-col">${marca(cee.consumo_letra, cee.consumo_valor, "kWh/m²·año")}</span>
      <span class="cee-col">${marca(cee.emisiones_letra, cee.emisiones_valor, "kg CO₂/m²·año")}</span></div>`;
  };
  return `<div class="cee"><div class="cee-fila cee-cab"><span></span><span class="cee-col">${r("consumo")}</span><span class="cee-col">${r("emisiones")}</span></div>
    ${"ABCDEFG".split("").map(fila).join("")}</div>${cee.en_tramite ? `<p class="cee-tramite">${r("en_tramite")}</p>` : ""}`;
}

function datosClave(t, idioma) {
  const i = t.inmueble ?? {};
  const r = (k) => rotulo(idioma, k);
  const si = (v) => (v === true ? r("si") : v === false ? r("no") : v);
  const m2 = (v) => (v ? `${num(v, 0, idioma)} m²` : null);
  const filas = [
    [r("operacion"), i.operacion && ({ venta: r("venta"), alquiler: r("alquiler") }[i.operacion] ?? i.operacion)],
    [r("tipo"), i.tipo && i.tipo[0].toUpperCase() + i.tipo.slice(1)],
    [r("sup_construida"), m2(i.superficie_construida)],
    [r("sup_util"), m2(i.superficie_util)],
    [r("parcela"), m2(i.superficie_parcela)],
    [r("habitaciones"), i.habitaciones],
    [r("banos"), i.banos],
    [r("planta"), i.planta],
    [r("ascensor"), si(i.ascensor)],
    [r("orientacion"), i.orientacion],
    [r("ano_construccion"), i.ano_construccion],
    [r("estado"), texto(i.estado, idioma)],
    [r("calefaccion"), texto(i.calefaccion, idioma)],
    [r("aire"), si(i.aire_acondicionado)],
    [r("garaje"), si(i.garaje)],
    [r("trastero"), si(i.trastero)],
    [r("terraza"), typeof i.terraza === "number" ? (i.terraza > 0 ? `${i.terraza} m²` : r("no")) : si(i.terraza)],
    [r("piscina"), si(i.piscina)],
    [r("jardin"), si(i.jardin)],
    [r("comunidad"), i.gastos_comunidad_mes != null && `${formatoPrecio(i.gastos_comunidad_mes, i.moneda, idioma)}/${r("mes")}`],
    ["IBI", i.ibi_anual != null && `${formatoPrecio(i.ibi_anual, i.moneda, idioma)}/${r("ano")}`],
    [r("precio_m2"), i.precio && i.operacion !== "alquiler" && (i.superficie_construida || i.superficie_util) && formatoPrecio(Math.round(i.precio / (i.superficie_construida || i.superficie_util)), i.moneda, idioma) + "/m²"],
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
  const r = (k) => rotulo(idioma, k);
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
    // Champán del tema claro, o el color de la marca; el texto del botón, el de más contraste (negro cálido o blanco).
    const acento = acentoRelleno(esHex(t.marca?.color) ? t.marca.color : CHAMPAN_CLARO, "#ffffff");
    const sobreAcento = (luminancia(acento) + 0.05) / (luminancia("#1a1408") + 0.05) >= 1.05 / (luminancia(acento) + 0.05) ? "#1a1408" : "#ffffff";
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
    const avisos = [tx(i.aviso_legal), r("aviso_ficha"), tx(t.marca?.pie_legal)].filter(Boolean);

    const html = `<!doctype html>
<html lang="${esc(idioma)}"><head><meta charset="utf-8">
<title>${esc(tx(t.titulo) || "Ficha")}${i.referencia ? " · " + esc(i.referencia) : ""}</title>
<style>
  /* Mismo lenguaje que tema.css (tema claro, para imprimir): SF o Inter, champán (o el color de la marca), sin remates. */
  @font-face { font-family: "Inter Variable"; font-weight: 100 900; font-display: swap; src: url(${esc(fuenteInter("latin"))}) format("woff2");
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
  @font-face { font-family: "Inter Variable"; font-weight: 100 900; font-display: swap; src: url(${esc(fuenteInter("latin-ext"))}) format("woff2");
    unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+1EF2-1EFF, U+20A0-20AB, U+20AD-20C0, U+2C60-2C7F, U+A720-A7FF; }
  @page { size: A4; margin: 12mm 12mm 14mm; }
  :root { --acento: ${acento}; --sobre-acento: ${sobreAcento}; --acento-texto: color-mix(in oklab, var(--acento) 62%, black);
    --tinta: #1d1d1f; --gris: #55555c; --linea: #e3e3e8; --fondo: #f5f5f7; }
  @supports (color: oklch(from red l c h)) { :root { --acento-texto: oklch(from var(--acento) min(l, 0.44) c h); } }
  * { box-sizing: border-box; }
  body { margin: 0; font: 10.5pt/1.45 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter Variable", "Helvetica Neue", Arial, sans-serif;
    color: var(--tinta); background: var(--fondo); -webkit-font-smoothing: antialiased; }
  .hoja { width: 210mm; margin: 16px auto; background: #fff; padding: 12mm; border-radius: 4mm; box-shadow: 0 0 0 .5px rgba(0,0,0,.06), 0 16px 44px rgba(15,20,30,.12); }
  @media print { body { background: #fff; } .hoja { width: auto; margin: 0; padding: 0; border-radius: 0; box-shadow: none; } .no-imprimir { display: none !important; } }
  .barra-imp { position: sticky; top: 0; display: flex; gap: 12px; align-items: center; justify-content: center; padding: 10px; background: rgba(29,29,31,.92); color: #f5f5f7; font: 500 14px -apple-system, "Inter Variable", system-ui, sans-serif; z-index: 2; backdrop-filter: blur(16px); }
  .barra-imp button { font: 600 14px/1 -apple-system, "Inter Variable", system-ui, sans-serif; padding: 9px 20px; border: 0; border-radius: 999px; background: var(--acento); color: var(--sobre-acento); cursor: pointer; }
  .barra-imp button:focus-visible { outline: 2px solid #f5f5f7; outline-offset: 2px; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 4mm; margin-bottom: 5mm; border-bottom: 1px solid var(--linea); }
  header img { max-height: 15mm; max-width: 60mm; object-fit: contain; }
  header .marca { font-weight: 650; font-size: 13pt; color: var(--acento-texto); letter-spacing: -.01em; }
  header .ref { color: var(--gris); font-size: 9pt; text-align: right; font-variant-numeric: tabular-nums; }
  h1 { font-size: 20pt; line-height: 1.12; font-weight: 650; letter-spacing: -.02em; margin: 0 0 1.5mm; }
  .direccion { color: var(--gris); margin: 0 0 3mm; }
  .precio { font-size: 22pt; font-weight: 700; letter-spacing: -.02em; color: var(--tinta); margin: 0 0 4mm; font-variant-numeric: tabular-nums; }
  .precio small { font-size: 10.5pt; color: var(--gris); font-weight: 500; letter-spacing: 0; }
  .portada { width: 100%; height: 78mm; object-fit: cover; border-radius: 3mm; margin-bottom: 5mm; display: block; }
  .dos { display: grid; grid-template-columns: 1.25fr 1fr; gap: 7mm; }
  h2 { font-size: 8.5pt; font-weight: 650; text-transform: uppercase; letter-spacing: .08em; color: var(--gris); border-bottom: 1px solid var(--linea); padding-bottom: 1.5mm; margin: 5mm 0 3mm; }
  dl { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2mm 6mm; margin: 0; }
  .dato { display: flex; justify-content: space-between; gap: 2mm; border-bottom: 1px solid var(--linea); padding: .8mm 0; }
  dt { color: var(--gris); } dd { margin: 0; font-weight: 600; text-align: right; font-variant-numeric: tabular-nums; }
  .cee { font-size: 8.5pt; }
  .cee-fila { display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; height: 5.2mm; margin-bottom: .7mm; }
  .cee-cab { color: var(--gris); font-weight: 600; height: auto; }
  .cee-barra { display: block; height: 100%; color: #fff; font-weight: 800; padding-left: 2mm; line-height: 5.2mm; clip-path: polygon(0 0, calc(100% - 2.6mm) 0, 100% 50%, calc(100% - 2.6mm) 100%, 0 100%); -webkit-print-color-adjust: exact; print-color-adjust: exact; text-shadow: 0 0 2px rgba(0,0,0,.45); }
  .cee-col { text-align: center; }
  .cee-flecha { display: inline-block; background: var(--c); color: #fff; font-weight: 800; padding: 0 2.5mm 0 3.5mm; line-height: 5.2mm; clip-path: polygon(2.4mm 0, 100% 0, 100% 100%, 2.4mm 100%, 0 50%); -webkit-print-color-adjust: exact; print-color-adjust: exact; text-shadow: 0 0 2px rgba(0,0,0,.45); white-space: nowrap; }
  .cee-flecha small { font-weight: 600; font-size: 7pt; }
  .cee-tramite { font-weight: 600; }
  ul.caract { columns: 2; padding-left: 4mm; margin: 0; } ul.caract li { margin-bottom: 1mm; break-inside: avoid; }
  ul.caract li::marker { color: var(--acento-texto); }
  .descripcion { white-space: pre-line; text-align: justify; hyphens: auto; }
  .salto { break-before: page; page-break-before: always; }
  .plano { width: 100%; border: 1px solid var(--linea); border-radius: 3mm; display: block; }
  .plano-nombre { font-weight: 600; margin: 3mm 0 1mm; }
  .fotos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }
  .fotos figure { margin: 0; break-inside: avoid; } .fotos img { width: 100%; aspect-ratio: 2 / 1; object-fit: cover; border-radius: 2mm; display: block; }
  .fotos figcaption { font-size: 8.5pt; color: var(--gris); margin-top: .8mm; }
  .contacto { display: grid; grid-template-columns: 1fr 34mm; gap: 6mm; align-items: center; background: var(--fondo); border-radius: 3mm; padding: 4mm 5mm; margin-top: 6mm; break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .contacto strong { color: var(--acento-texto); }
  .contacto .qr svg { width: 34mm; height: 34mm; display: block; }
  .contacto p { margin: .5mm 0; } .contacto .enlace { font-size: 8.5pt; color: var(--gris); word-break: break-all; }
  .legal { font-size: 7.5pt; color: var(--gris); margin-top: 5mm; border-top: 1px solid var(--linea); padding-top: 2mm; }
  .legal p { margin: .6mm 0; }
</style></head>
<body>
<div class="barra-imp no-imprimir">${r("barra_pdf")} <button onclick="print()">${r("imprimir")}</button></div>
<div class="hoja">
  <header>
    ${logoURL ? `<img src="${esc(logoURL)}" alt="${esc(t.marca?.nombre ?? "")}">` : `<span class="marca">${esc(t.marca?.nombre ?? "")}</span>`}
    <div class="ref">${i.referencia ? `Ref. <strong>${esc(i.referencia)}</strong><br>` : ""}${esc(new Date().toLocaleDateString(idioma === "es" ? "es-ES" : idioma))}</div>
  </header>
  ${portadaURL ? `<img class="portada" src="${esc(portadaURL)}" alt="">` : ""}
  <h1>${esc(tx(t.titulo))}</h1>
  ${direccion ? `<p class="direccion">${esc(direccion)}</p>` : ""}
  ${i.precio != null ? `<p class="precio">${esc(precioTexto(t, idioma))}${i.estado_obra === "proyecto" ? ` <small>· ${r("obra_nueva")}</small>` : ""}</p>` : ""}
  <div class="dos">
    <section><h2>${r("datos_principales")}</h2><dl>${datosClave(t, idioma)}</dl></section>
    ${(() => { const e = escalaEnergetica(i.certificado_energetico, idioma); return e ? `<section><h2>${r("certificado")}</h2>${e}</section>` : ""; })()}
  </div>
  ${caracteristicas ? `<h2>${r("caracteristicas")}</h2><ul class="caract">${caracteristicas}</ul>` : ""}
  ${i.descripcion ? `<h2>${r("descripcion")}</h2><div class="descripcion">${esc(tx(i.descripcion))}</div>` : ""}
  ${planos.length ? `<div class="salto"></div><h2>${r("plano")}</h2>${planos.map((p) => `${planos.length > 1 && p.nombre ? `<p class="plano-nombre">${esc(p.nombre)}</p>` : ""}<img class="plano" src="${esc(p.url)}" alt="${r("plano")}">`).join("")}` : ""}
  ${fotos.length ? `<h2>${r("estancias")}</h2><div class="fotos">${fotos.map((f) => `<figure><img src="${esc(f.url)}" alt=""><figcaption>${esc(f.nombre)}</figcaption></figure>`).join("")}</div>` : ""}
  <div class="contacto">
    <div>
      <p><strong>${r("visita")}</strong>${enlace ? ` · ${r("escanea")}` : ""}</p>
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
