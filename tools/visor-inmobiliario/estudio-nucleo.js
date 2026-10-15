// Núcleo del Estudio: estado del proyecto, deshacer/rehacer, archivos (blobs), autoguardado y utilidades de interfaz.
import { db } from "./estudio-db.js";
import { slug, rumboDe, redondear } from "./estudio-util.js";

export const ESTILOS_IA = [
  { id: "nordico", nombre: { es: "Nórdico", en: "Nordic" } },
  { id: "mediterraneo", nombre: { es: "Mediterráneo", en: "Mediterranean" } },
  { id: "industrial", nombre: { es: "Industrial", en: "Industrial" } },
  { id: "contemporaneo_minimalista", nombre: { es: "Contemporáneo minimalista", en: "Contemporary minimalist" } },
  { id: "clasico", nombre: { es: "Clásico", en: "Classic" } },
];
export const MOMENTOS = [
  { id: "dia", nombre: "Día" }, { id: "atardecer", nombre: "Atardecer" }, { id: "noche", nombre: "Noche" },
];
export const PAREDES_DEF = [
  ["Blanco roto", "Off-white", "#f2eee6"], ["Gris perla", "Pearl grey", "#d9d8d3"], ["Beige arena", "Sand beige", "#d8c9ae"],
  ["Greige", "Greige", "#bdb5a6"], ["Verde salvia", "Sage green", "#a8b5a0"], ["Azul niebla", "Mist blue", "#a9b8c2"],
  ["Terracota suave", "Soft terracotta", "#c98b6b"], ["Antracita", "Anthracite", "#3e4247"],
].map(([es, en, color]) => ({ nombre: { es, en }, color }));
export const SUELOS_DEF = [
  ["Roble natural", "Natural oak", "#b48a5e"], ["Roble claro", "Light oak", "#d2b48c"], ["Nogal", "Walnut", "#6b4a32"],
  ["Gris cemento", "Cement grey", "#9a9a96"], ["Blanco nórdico", "Nordic white", "#e6e0d4"],
].map(([es, en, color]) => ({ nombre: { es, en }, color }));
/** Idiomas que tiene el visor (i18n.js): el Estudio no ofrece otros. El español es la base y no se puede quitar. */
export const IDIOMAS = { es: "Español", en: "English", fr: "Français", de: "Deutsch" };
/** Clases del material de vidrio para tarjetas y paneles con texto (tema.css). Dentro de un vidrio, rellenos: nunca otro vidrio. */
export const VIDRIO = "c8-vidrio c8-vidrio--texto";
/** Color de marca que el Estudio ponía por defecto hasta la fase 3. Ahora, sin color, el visor usa el champán del tema. */
export const COLOR_ANTIGUO = "#c8a24a";

// Referencia automática y estable (la carpeta de publicación /tours/<referencia>/ no debe cambiar al editar los datos).
const ALFABETO_REF = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // sin 0/O ni 1/I/L, que se confunden al dictarla
export function referenciaNueva() {
  const a = new Uint8Array(5);
  try { crypto.getRandomValues(a); } catch { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); }
  return "C8-" + [...a].map((b) => ALFABETO_REF[b % ALFABETO_REF.length]).join("");
}

/** Proyecto vacío. Marca, agente y contacto salen de «Mi inmobiliaria» al crearlo (estudio-perfil.js). */
export function tourNuevo() {
  return {
    version: 2,
    titulo: { es: "" },
    idioma: "es",
    idiomas: ["es"],
    marca: { nombre: "" },                   // sin color: el visor usa el champán del tema (claro u oscuro)
    agente: {},
    contacto: { modo: "whatsapp" },
    inmueble: { operacion: "venta", tipo: "piso", estado_obra: "construido", moneda: "EUR", certificado_energetico: {}, caracteristicas: [] },
    altura_camara: 1.5,
    radio_enlace_auto: 4.5,
    norte: 0,
    plantas: [{ id: "p0", nombre: { es: "Planta principal", en: "Main floor" } }],
    estancias: [],
    estilos: [{ id: "original", nombre: { es: "Original", en: "Original" } }, ...structuredClone(ESTILOS_IA)],
    personalizacion: { paredes: structuredClone(PAREDES_DEF), suelos: structuredClone(SUELOS_DEF) },
    panoramas: [],
    // perfil: usa «Mi inmobiliaria» (false = contacto propio de este inmueble). nocheSimulada: E8 (solo si el agente la activa).
    _estudio: { manuales: [], quitados: [], meta: {}, ref: referenciaNueva(), perfil: true, nocheSimulada: false },
  };
}

// ------------------------------------------------------------------ título automático (es, en, fr, de)
const TIPOS_TXT = {
  piso: ["Piso", "Flat", "Appartement", "Wohnung"], casa: ["Casa", "House", "Maison", "Haus"],
  chalet: ["Chalet", "Detached house", "Villa", "Einfamilienhaus"], adosado: ["Adosado", "Terraced house", "Maison mitoyenne", "Reihenhaus"],
  atico: ["Ático", "Penthouse", "Penthouse", "Penthouse"], duplex: ["Dúplex", "Duplex", "Duplex", "Maisonette"],
  estudio: ["Estudio", "Studio", "Studio", "Studio"], loft: ["Loft", "Loft", "Loft", "Loft"],
  local: ["Local", "Commercial premises", "Local commercial", "Ladenlokal"], oficina: ["Oficina", "Office", "Bureau", "Büro"],
  nave: ["Nave", "Warehouse", "Entrepôt", "Lagerhalle"], garaje: ["Garaje", "Garage", "Garage", "Garage"],
  terreno: ["Terreno", "Plot", "Terrain", "Grundstück"],
};
const OPERACION_TXT = { venta: ["en venta", "for sale", "à vendre", "zu verkaufen"], alquiler: ["en alquiler", "for rent", "à louer", "zu vermieten"] };
const HAB_TXT = ["hab.", "bed", "ch.", "Zi."];
const EN_TXT = ["en", "in", "à", "in"];
const LOCALES = { es: "es-ES", en: "en-GB", fr: "fr-FR", de: "de-DE" };
const posIdioma = (idioma) => Math.max(0, Object.keys(IDIOMAS).indexOf(idioma));
/**
 * Zona del inmueble para el título, sin número de portal, piso ni código postal. Sin «Mostrar la dirección exacta», solo el
 * último tramo de la dirección, lo mismo que enseña el visor («Calle Mayor 12, 28013 Madrid» → «Madrid»); con ella, la calle
 * y la ciudad («Calle Mayor, Madrid»).
 */
function zonaTitulo(I) {
  const dir = String(textoDe(I.direccion)).trim().split(",");
  return (I.mostrar_direccion_exacta === true ? dir : dir.slice(-1))
    .map((p) => p.replace(/\b\d{5}\b/g, "").replace(/(\s+(?:[-–]|s\/n|(?:n[º°o.]*|núm\.?)?\s*\d\S*))+$/i, "").trim())
    .filter((p, i) => p && (i === 0 || !/\d/.test(p))).join(", ");
}
/**
 * «Piso en venta en Madrid» (con dirección) o «Piso en venta · 3 hab. · 112 m²»: título del anuncio si el agente no escribe
 * otro (también en en, fr y de). Con la zona no repite los datos, que la portada y la ficha ya enseñan. Vacío mientras no
 * haya ningún dato (dirección, habitaciones, superficie o precio).
 */
export function tituloAuto(t = app.tour, idioma = "es") {
  const I = t?.inmueble ?? {};
  const hab = Number(I.habitaciones), m2 = Number(I.superficie_construida || I.superficie_util), precio = Number(I.precio);
  const zona = zonaTitulo(I);
  if (!zona && !(hab > 0) && !(m2 > 0) && !(precio > 0)) return "";
  const k = posIdioma(idioma);
  const tipo = TIPOS_TXT[I.tipo]?.[k] ?? (I.tipo ? String(I.tipo).charAt(0).toUpperCase() + String(I.tipo).slice(1) : TIPOS_TXT.piso[k]);
  const partes = [`${tipo} ${OPERACION_TXT[I.operacion === "alquiler" ? "alquiler" : "venta"][k]}`];
  if (zona) return `${partes[0]} ${EN_TXT[k]} ${zona}`;
  if (hab > 0) partes.push(`${hab} ${HAB_TXT[k]}`);
  if (m2 > 0) partes.push(`${m2.toLocaleString(LOCALES[idioma] ?? "es-ES", { maximumFractionDigits: 1, useGrouping: "always" })} m²`);
  return partes.join(" · ");
}
/** Referencia del anuncio: la que escribió el agente o la automática del proyecto. */
export const referenciaDe = (t = app.tour) => String(t?.inmueble?.referencia ?? "").trim() || t?._estudio?.ref || "";

// ------------------------------------------------------------------ estado
export const app = {
  proyecto: null,        // { id, nombre }
  tour: null,
  archivos: new Map(),   // ruta → Blob
  nodo: null,            // id del panorama seleccionado
  planta: "p0",
  seccion: "fotos",
  vista: null,           // última vista recibida del visor
  guardado: "ok",        // ok | pendiente | error
};
const oyentes = new Map();
export function on(ev, fn) { if (!oyentes.has(ev)) oyentes.set(ev, new Set()); oyentes.get(ev).add(fn); }
export function emitir(ev, d) { for (const fn of oyentes.get(ev) ?? []) { try { fn(d); } catch (e) { console.error(e); } } }

// ------------------------------------------------------------------ deshacer / rehacer
const hist = { pasado: [], futuro: [], ultimaClave: null, ultimaHora: 0 };
/**
 * Aplica un cambio al tour con soporte de deshacer.
 * clave: cambios consecutivos con la misma clave (p. ej. escribir en un campo) se agrupan en un solo paso.
 * tipo: "todo" (recarga vista previa), "datos" (recarga con más retardo), "yaw" (solo envía visor:yaw), "local" (sin vista previa)
 */
export function cambiar(fn, { clave = null, tipo = "todo", render = true } = {}) {
  const ahora = performance.now();
  const agrupar = clave && clave === hist.ultimaClave && ahora - hist.ultimaHora < 1500;
  if (!agrupar) {
    hist.pasado.push(JSON.stringify(app.tour));
    if (hist.pasado.length > 150) hist.pasado.shift();
  }
  hist.futuro.length = 0;
  hist.ultimaClave = clave; hist.ultimaHora = ahora;
  fn(app.tour);
  tocado(tipo, render);
}
function tocado(tipo, render = true) {
  programarGuardado();
  emitir("cambio", { tipo, render });
  emitir("historial");
}
export function deshacer() {
  if (!hist.pasado.length) return;
  hist.futuro.push(JSON.stringify(app.tour));
  app.tour = JSON.parse(hist.pasado.pop());
  hist.ultimaClave = null;
  validarSeleccion();
  tocado("todo");
  toast("Deshecho");
}
export function rehacer() {
  if (!hist.futuro.length) return;
  hist.pasado.push(JSON.stringify(app.tour));
  app.tour = JSON.parse(hist.futuro.pop());
  hist.ultimaClave = null;
  validarSeleccion();
  tocado("todo");
  toast("Rehecho");
}
export const puedeDeshacer = () => hist.pasado.length > 0;
export const puedeRehacer = () => hist.futuro.length > 0;
export function reiniciarHistorial() { hist.pasado.length = 0; hist.futuro.length = 0; hist.ultimaClave = null; emitir("historial"); }
function validarSeleccion() {
  if (!app.tour.panoramas.some((p) => p.id === app.nodo)) app.nodo = app.tour.panoramas[0]?.id ?? null;
  if (!app.tour.plantas.some((p) => p.id === app.planta)) app.planta = app.tour.plantas[0]?.id;
}

// ------------------------------------------------------------------ archivos
const urls = new Map();
export function urlDe(ruta) {
  if (!ruta) return "";
  const b = app.archivos.get(ruta);
  if (!b) return ruta;
  let u = urls.get(ruta);
  if (!u || u.blob !== b) {
    if (u) URL.revokeObjectURL(u.url);
    u = { blob: b, url: URL.createObjectURL(b) };
    urls.set(ruta, u);
  }
  return u.url;
}
// Estado de guardado: "Guardado" solo cuando el proyecto Y todos sus archivos están en IndexedDB.
const enCurso = new Set();      // rutas guardándose ahora
const fallidos = new Set();     // rutas que no se pudieron guardar (se reintentan en el siguiente guardado)
let errorProyecto = false;
function recalcularEstado() {
  const antes = app.guardado;
  app.guardado = errorProyecto || fallidos.size ? "error" : enCurso.size || tGuardar ? "pendiente" : "ok";
  if (antes !== app.guardado) emitir("guardado");
}
export async function guardarArchivo(ruta, blob) {
  app.archivos.set(ruta, blob);
  if (!app.proyecto) return;
  enCurso.add(ruta); recalcularEstado();
  try {
    await db.guardarArchivo(app.proyecto.id, ruta, blob);
    fallidos.delete(ruta);
  } catch (e) {
    fallidos.add(ruta);
    errorGuardado(e);
  } finally {
    enCurso.delete(ruta);
    recalcularEstado();
  }
}
export function reiniciarGuardado() { enCurso.clear(); fallidos.clear(); errorProyecto = false; recalcularEstado(); }
export const archivosSinGuardar = () => fallidos.size;
export function rutaLibre(base, ext) {
  let r = `${base}.${ext}`, i = 2;
  while (app.archivos.has(r)) r = `${base}-${i++}.${ext}`;
  return r;
}
export function idLibre(base, existentes) {
  const s = new Set(existentes);
  let id = slug(base), i = 2;
  const b = id;
  while (s.has(id)) id = `${b}-${i++}`;
  return id;
}
export function limpiarUrls() { for (const u of urls.values()) URL.revokeObjectURL(u.url); urls.clear(); }

// ------------------------------------------------------------------ autoguardado
let tGuardar = 0;
function programarGuardado() {
  clearTimeout(tGuardar);
  tGuardar = setTimeout(guardarAhora, 700);
  recalcularEstado();
}
export async function guardarAhora() {
  clearTimeout(tGuardar); tGuardar = 0;
  if (!app.proyecto) return;
  try {
    const mini = app.tour.panoramas[0]?.miniatura;
    await db.guardarProyecto({
      id: app.proyecto.id, nombre: nombreProyecto(), actualizado: Date.now(), tour: app.tour,
      miniatura: mini ? app.archivos.get(mini) ?? null : null, nFotos: app.tour.panoramas.length,
    });
    errorProyecto = false;
  } catch (e) { errorProyecto = true; errorGuardado(e); }
  // Reintenta los archivos que fallaron (p. ej. tras liberar espacio).
  for (const ruta of [...fallidos]) {
    const b = app.archivos.get(ruta);
    if (!b) { fallidos.delete(ruta); continue; }
    try { await db.guardarArchivo(app.proyecto.id, ruta, b); fallidos.delete(ruta); } catch { break; }
  }
  recalcularEstado();
}
let avisadoError = false;
function errorGuardado(e) {
  console.error("Error de almacenamiento", e);
  recalcularEstado();
  if (!avisadoError) {
    avisadoError = true;
    const motivo = e?.name === "QuotaExceededError" ? "no queda espacio en el navegador" : e?.message || e?.name || String(e);
    dialogo({
      titulo: "No se puede guardar en este navegador",
      texto: `El autoguardado ha fallado (${motivo}). ` +
        "Tu trabajo sigue abierto, pero descarga una copia de seguridad (Proyecto ▾ → Copia de seguridad) antes de cerrar la pestaña para no perderlo. " +
        "En modo incógnito o con el almacenamiento bloqueado el navegador no permite guardar.",
      botones: [{ texto: "Entendido", primario: true }],
    });
  }
}
export function nombreProyecto() {
  return textoDe(app.tour?.titulo) || tituloAuto(app.tour) || app.tour?.inmueble?.referencia || app.proyecto?.nombre || "Proyecto sin título";
}

// ------------------------------------------------------------------ textos traducibles
export function textoDe(t, idioma = "es") {
  if (t == null) return "";
  if (typeof t === "string") return t;
  return t[idioma] || t.es || Object.values(t).find(Boolean) || "";
}
/** Solo el texto de ese idioma (para editarlo; sin recurrir a otro idioma). */
export const textoExacto = (t, idioma = "es") => (t == null ? "" : typeof t === "string" ? (idioma === "es" ? t : "") : t[idioma] ?? "");
export function fijarTexto(obj, clave, idioma, valor) {
  let t = obj[clave];
  if (t == null || typeof t === "string") t = { es: t ?? "" };
  // Al renombrar en español un texto que traía traducciones automáticas («Zona de día» → «Living area»…), estas se borran:
  // ya no corresponden. Las que escribió el agente se quedan.
  const auto = idioma === "es" && t.es !== valor ? AUTOMATICAS.get(t.es) : null;
  if (auto) for (const [k, v] of Object.entries(auto)) if (k !== "es" && t[k] === v) delete t[k];
  t[idioma] = valor;
  obj[clave] = t;
}
/** Textos que el Estudio crea ya traducidos (zonas, estilos, colores, planta por defecto): español → { en, fr, de }. */
const AUTOMATICAS = new Map();
const registrarAutomaticas = (...listas) => { for (const n of listas.flat()) if (n?.es) AUTOMATICAS.set(n.es, n); };
registrarAutomaticas(ESTILOS_IA.map((e) => e.nombre), PAREDES_DEF.map((c) => c.nombre), SUELOS_DEF.map((c) => c.nombre),
  { es: "Original", en: "Original" }, { es: "Planta principal", en: "Main floor" }, { es: "Proyecto", en: "Design" });

/**
 * Todos los textos que el visitante puede leer y que se traducen en Datos → «Idiomas y traducciones» (E11: el único
 * sitio con idiomas). → [{ grupo, etiqueta, obj: () => objeto actual, clave, largo }]. Solo los que tienen texto en español.
 */
export function textosTraducibles(t = app.tour) {
  const r = [];
  const add = (grupo, etiqueta, obj, clave, largo = false, extra = {}) => { if (textoExacto(obj()?.[clave]).trim()) r.push({ grupo, etiqueta, obj, clave, largo, ...extra }); };
  const I = () => app.tour.inmueble;
  add("Anuncio", "Título", () => app.tour, "titulo");
  add("Anuncio", "Descripción", I, "descripcion", true);
  add("Anuncio", "Aviso legal de las imágenes", I, "aviso_legal", true);
  // De «Mi inmobiliaria»: la traducción se guarda también en el perfil (vale para todos los recorridos).
  add("Mi inmobiliaria", "Pie legal", () => app.tour.marca, "pie_legal", true, { perfil: "marca" });
  add("Mi inmobiliaria", "Texto de privacidad", () => app.tour.contacto, "texto_privacidad", true, { perfil: "contacto" });
  t.panoramas.forEach((p, i) => add("Estancias", `Foto ${i + 1}`, () => app.tour.panoramas.find((x) => x.id === p.id), "nombre"));
  (t.estancias ?? []).forEach((e) => add("Estancias", "Estancia del plano", () => app.tour.estancias.find((x) => x.id === e.id), "nombre"));
  (t.plantas ?? []).forEach((pl) => add("Estancias", "Planta", () => app.tour.plantas.find((x) => x.id === pl.id), "nombre"));
  (t.secciones ?? []).forEach((s, i) => add("Estancias", "Zona", () => app.tour.secciones?.[i], "nombre"));
  for (const p of t.panoramas) (p.puntos ?? []).forEach((pt, j) => {
    const g = () => app.tour.panoramas.find((x) => x.id === p.id)?.puntos?.[j];
    add("Notas", `Nota de ${textoDe(p.nombre) || p.id}`, g, "titulo");
    add("Notas", "Texto de la nota", g, "texto", true);
  });
  const usados = new Set(t.panoramas.flatMap((p) => (p.variantes ?? []).map((v) => v.estilo)));
  (t.estilos ?? []).forEach((e, i) => { if (e.id !== "original" && usados.has(e.id)) add("Estilo y luz", "Estilo", () => app.tour.estilos[i], "nombre"); });
  if (t.panoramas.some((p) => p.mascara || p.variantes?.some((v) => v.mascara))) {
    for (const k of ["paredes", "suelos"]) (t.personalizacion?.[k] ?? []).forEach((c, i) => add("Estilo y luz", k === "paredes" ? "Color de pared" : "Tono de suelo", () => app.tour.personalizacion[k][i], "nombre"));
  }
  (t.galeria ?? []).forEach((g, i) => add("Extras", "Imagen de la galería", () => app.tour.galeria[i], "titulo"));
  (t.documentacion ?? []).forEach((d, i) => { if (d.publico) add("Extras", "Documento", () => app.tour.documentacion[i], "nombre"); });
  (Array.isArray(t.guion) ? t.guion : []).forEach((g, i) => add("Extras", "Texto de la visita guiada", () => app.tour.guion[i], "texto"));
  return r;
}

// ------------------------------------------------------------------ enlaces
export const claveEnlace = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
export const colocado = (p) => Number.isFinite(p?.x) && Number.isFinite(p?.z);
export function calcularEnlaces(t = app.tour) {
  const radio = t.radio_enlace_auto ?? 4.5;
  const ps = t.panoramas.filter(colocado);
  const auto = new Set();
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    const a = ps[i], b = ps[j];
    if ((a.planta ?? "p0") !== (b.planta ?? "p0")) continue;
    if (Math.hypot(a.x - b.x, a.z - b.z) <= radio) auto.add(claveEnlace(a.id, b.id));
  }
  const ids = new Set(t.panoramas.map((p) => p.id));
  const manual = new Set((t._estudio?.manuales ?? []).filter((k) => k.split("|").every((i) => ids.has(i))));
  const quitados = new Set(t._estudio?.quitados ?? []);
  const efectivos = new Set([...auto].filter((k) => !quitados.has(k)));
  for (const k of manual) efectivos.add(k);
  // Las fotos sin colocar en el plano se conectan siempre en el orden de la lista (1 ↔ 2 ↔ 3…): con plano o sin él (E3).
  const lineales = new Set();
  for (let i = 0; i + 1 < t.panoramas.length; i++) {
    const a = t.panoramas[i], b = t.panoramas[i + 1];
    if (!colocado(a) || !colocado(b)) { const k = claveEnlace(a.id, b.id); lineales.add(k); efectivos.add(k); }
  }
  const vecinos = new Map(t.panoramas.map((p) => [p.id, []]));
  for (const k of efectivos) { const [a, b] = k.split("|"); vecinos.get(a)?.push(b); vecinos.get(b)?.push(a); }
  return { auto, manual, quitados, efectivos, vecinos, lineales };
}
export function alternarEnlace(a, b) {
  if (a === b) return;
  const k = claveEnlace(a, b);
  const { auto, efectivos } = calcularEnlaces();
  cambiar((t) => {
    const e = t._estudio;
    if (efectivos.has(k)) {
      if (e.manuales.includes(k)) e.manuales = e.manuales.filter((x) => x !== k);
      if (auto.has(k) && !e.quitados.includes(k)) e.quitados.push(k);
    } else {
      e.quitados = e.quitados.filter((x) => x !== k);
      if (!auto.has(k)) e.manuales.push(k);
    }
  });
}
/** Posición de cada foto en el tour publicado: las colocadas, donde están; las demás, en fila a 2,5 m de la anterior. */
export function posiciones(t = app.tour) {
  const r = new Map();
  let ultimo = null;
  for (const p of t.panoramas) {
    const pos = colocado(p) ? [p.x, p.z] : ultimo ? [ultimo[0] + 2.5, ultimo[1]] : [0, 0];
    r.set(p.id, pos);
    ultimo = pos;
  }
  return r;
}
/** ¿Hay plano? (alguna imagen de planta, muro o estancia dibujada). Sin plano no se ofrece «Plano con medidas» (E4). */
export const tienePlano = (t = app.tour) => (t?.plantas ?? []).some((pl) => pl.plano?.imagen || pl.muros?.length) || (t?.estancias ?? []).length > 0;

/** Convierte los `enlaces` de un tour importado al modelo del Estudio (automáticos + manuales − quitados). */
export function importarEnlaces(t) {
  t._estudio ??= { manuales: [], quitados: [], meta: {} };
  t._estudio.manuales ??= []; t._estudio.quitados ??= []; t._estudio.meta ??= {};
  // Algoritmo del visor: enlaces declarados (simétricos) + automáticos para nodos sin `enlaces`.
  const radio = t.radio_enlace_auto ?? 4.5;
  const ef = new Set();
  for (const p of t.panoramas) for (const id of p.enlaces ?? []) if (t.panoramas.some((q) => q.id === id)) ef.add(claveEnlace(p.id, id));
  for (const p of t.panoramas) {
    if (p.enlaces) continue;
    for (const q of t.panoramas) if (q !== p && Math.hypot(q.x - p.x, q.z - p.z) <= radio) ef.add(claveEnlace(p.id, q.id));
  }
  for (const p of t.panoramas) delete p.enlaces;
  const { auto } = calcularEnlaces({ ...t, _estudio: { manuales: [], quitados: [] } });
  t._estudio.manuales = [...ef].filter((k) => !auto.has(k));
  t._estudio.quitados = [...auto].filter((k) => !ef.has(k));
}

// ------------------------------------------------------------------ exportación del tour
const esTexto = (v) => v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length > 0 &&
  Object.keys(v).every((k) => /^[a-z]{2}$/.test(k)) && Object.values(v).every((x) => typeof x === "string");

function limpiar(v, idiomas, clave) {
  if (Array.isArray(v)) {
    const r = v.map((x) => limpiar(x, idiomas)).filter((x) => x !== undefined);
    return r.length || clave === "enlaces" || clave === "estancias" ? r : undefined;
  }
  if (esTexto(v)) {
    let ent = Object.entries(v).filter(([k, s]) => s.trim() && idiomas.includes(k));
    if (!ent.length) ent = Object.entries(v).filter(([, s]) => s.trim()).slice(0, 1);
    if (!ent.length) return undefined;
    if (ent.length === 1 || idiomas.length === 1) return (v[idiomas[0]] || ent[0][1]).trim();
    return Object.fromEntries(ent.map(([k, s]) => [k, s.trim()]));
  }
  if (v && typeof v === "object") {
    const r = {};
    for (const [k, x] of Object.entries(v)) {
      if (k.startsWith("_")) continue;
      const y = limpiar(x, idiomas, k);
      if (y !== undefined) r[k] = y;
    }
    return Object.keys(r).length ? r : undefined;
  }
  if (v === null || v === "" || (typeof v === "number" && !Number.isFinite(v))) return undefined;
  return v;
}

// ------------------------------------------------------------------ enlaces seguros (A5)
export const MENSAJE_URL = "Solo se admiten direcciones que empiecen por https://, http://, mailto: o tel:.";
/** ¿Es una URL que se puede publicar? interna: también rutas relativas de archivos del proyecto (docs/x.pdf). */
export function urlPermitida(v, { interna = false, soloHttps = false } = {}) {
  if (v == null || v === "") return true;
  const s = String(v).trim();
  if (soloHttps) return /^https:\/\/[^\s]+$/i.test(s);
  if (/^https?:\/\/[^\s]+$/i.test(s) || /^mailto:[^\s]+$/i.test(s) || /^tel:[+\d\s().-]+$/i.test(s)) return true;
  if (interna && !/^[a-z][a-z0-9+.-]*:/i.test(s) && !s.startsWith("//")) return true; // ruta relativa
  return false;
}
/** Campos de URL del tour → [{obj, clave, opciones, donde, ir}] (ir: dónde se corrige, para «Antes de publicar»). */
function camposUrl(t) {
  const r = [];
  const add = (obj, clave, donde, ir, opciones = {}) => { if (obj && obj[clave] != null && obj[clave] !== "") r.push({ obj, clave, donde, ir, opciones }); };
  add(t.marca, "web", "Web de la marca", { perfil: "web" });
  add(t.contacto, "url_privacidad", "Política de privacidad", { perfil: "url_privacidad" });
  add(t.contacto, "webhook", "Conexión con el CRM", { perfil: "webhook" }, { soloHttps: true });
  for (const d of t.inmueble?.documentos ?? []) add(d, "url", `Documento «${textoDe(d.nombre) || "sin nombre"}»`, { seccion: "extras", campo: "documentos" }, { interna: true });
  for (const d of t.documentacion ?? []) add(d, "archivo", `Documento «${textoDe(d.nombre) || "sin nombre"}»`, { seccion: "extras", campo: "documentos" }, { interna: true });
  for (const p of t.panoramas ?? []) for (const pt of p.puntos ?? []) {
    add(pt, "enlace", `Nota «${textoDe(pt.titulo) || "sin título"}» de ${textoDe(p.nombre) || p.id}`, { seccion: "orientacion", nodo: p.id });
    add(pt, "video", `Vídeo de la nota «${textoDe(pt.titulo) || "sin título"}»`, { seccion: "orientacion", nodo: p.id });
  }
  return r;
}
/** URLs no permitidas (javascript:, data:, etc.) → [{donde, valor, ir}] */
export function urlsNoValidas(t = app.tour) {
  return camposUrl(t).filter(({ obj, clave, opciones }) => !urlPermitida(obj[clave], opciones)).map(({ obj, clave, donde, ir }) => ({ donde, valor: String(obj[clave]), ir }));
}

/** Archivos que el tour referencia y no están en el proyecto (ni son URLs externas) → [{ruta, donde}] */
export function archivosFaltantes(t = app.tour) {
  const r = [];
  const ver = (ruta, donde) => { if (typeof ruta === "string" && ruta && !/^(https?:|blob:|data:)/i.test(ruta) && !app.archivos.has(ruta)) r.push({ ruta, donde }); };
  for (const p of t.panoramas ?? []) {
    const n = textoDe(p.nombre) || p.id;
    ver(p.imagen, `foto ${n}`); ver(p.imagen_movil, `versión móvil de ${n}`); ver(p.miniatura, `miniatura de ${n}`); ver(p.mascara, `máscara de ${n}`);
    for (const v of p.variantes ?? []) { ver(v.imagen, `variante de ${n}`); ver(v.imagen_movil, `variante móvil de ${n}`); ver(v.mascara, `máscara de una variante de ${n}`); }
    for (const pt of p.puntos ?? []) ver(pt.imagen, `imagen de una nota de ${n}`);
  }
  for (const pl of t.plantas ?? []) ver(pl.plano?.imagen, `plano de ${textoDe(pl.nombre) || pl.id}`);
  ver(t.marca?.logo, "logo"); ver(t.agente?.foto, "foto del agente");
  for (const g of t.galeria ?? []) ver(g.imagen, "imagen de la galería");
  for (const d of t.documentacion ?? []) ver(d.archivo, `documento ${textoDe(d.nombre)}`);
  ver(t.libre?.url, "modelo 3D"); ver(t.libre?.colisionador, "colisionador del modelo 3D");
  ver(t.audio?.musica?.archivo, "música de fondo");
  return r;
}

/**
 * Tour listo para publicar (sin campos internos, textos normalizados, enlaces explícitos).
 * publico: sin documentación privada (publico:false). mapaRutas: sustituye rutas por URLs (vista previa).
 * urlPublica: dirección donde se publica (url_publica), base de los enlaces, del QR y de los mensajes.
 */
// ------------------------------------------------------------------ zonas de la vivienda (tour.secciones)
// E16: automáticas según los nombres de las estancias mientras el agente no las edite (tour.secciones) ni las quite
// (_estudio.sinZonas). Con varias plantas, el visor ya agrupa por planta: ahí solo se publican si el agente las edita.
const ZONAS_DEF = [
  ["dia", { es: "Zona de día", en: "Living area", fr: "Espace jour", de: "Wohnbereich" }, /sal[oó]n|estar|comedor|cocina|office|recibidor|entrada|hall|living|kitchen|dining/i],
  ["noche", { es: "Zona de noche", en: "Sleeping area", fr: "Espace nuit", de: "Schlafbereich" }, /dormitorio|habitaci[oó]n|suite|ba[nñ]o|aseo|vestidor|bedroom|bath/i],
  ["exterior", { es: "Exterior y zonas comunes", en: "Outdoor & common areas", fr: "Extérieur et parties communes", de: "Außen- und Gemeinschaftsbereiche" },
    /terraza|jard[ií]n|piscina|balc[oó]n|patio|garaje|trastero|fachada|comunidad|portal|azotea|exterior|terrace|garden|pool/i],
];
registrarAutomaticas(ZONAS_DEF.map(([, nombre]) => nombre));
export function zonasSugeridas(t = app.tour) {
  const r = ZONAS_DEF.map(([id, nombre]) => ({ id, nombre: structuredClone(nombre), estancias: [] }));
  for (const p of t.panoramas) {
    const i = ZONAS_DEF.findIndex(([, , re]) => re.test(`${textoDe(p.nombre)} ${p.id}`));
    r[i >= 0 ? i : 0].estancias.push(p.id);
  }
  return r;
}
/** "editadas" | "automaticas" | "plantas" (varias plantas, sin editar) | "ninguna" (quitadas por el agente). */
export const modoZonas = (t = app.tour) => (Array.isArray(t.secciones) ? "editadas" : t._estudio?.sinZonas ? "ninguna" : (t.plantas?.length ?? 0) > 1 ? "plantas" : "automaticas");
/** Zonas que verá el cliente: las editadas o las automáticas (si salen 2 o más con estancias); si no, null. */
export function zonasPublicadas(t = app.tour) {
  const modo = modoZonas(t);
  if (modo === "editadas") return t.secciones;
  if (modo !== "automaticas") return null;
  const z = zonasSugeridas(t).filter((s) => s.estancias.length);
  return z.length >= 2 ? z : null;
}

export function tourParaExportar(t = app.tour, { mapaRutas = null, publico = true, urlPublica = null } = {}) {
  const c = structuredClone(t);
  const { vecinos } = calcularEnlaces(t);
  const idiomas = (c.idiomas?.length ? c.idiomas : ["es"]).filter((x) => x in IDIOMAS);
  if (!idiomas.length) idiomas.push("es");
  c.idiomas = idiomas;
  c.version = 2;
  c.idioma = idiomas.includes(c.idioma) ? c.idioma : idiomas[0];
  // Fotos sin colocar: en fila, a 2,5 m de la anterior (así las flechas apuntan "adelante" y "atrás").
  const pos = posiciones(t);
  for (const p of c.panoramas) [p.x, p.z] = pos.get(p.id);
  // Título y referencia automáticos si el agente no escribe otros (E6).
  if (!textoDe(c.titulo).trim()) {
    const auto = Object.fromEntries(idiomas.map((l) => [l, tituloAuto(t, l)]).filter(([, v]) => v));
    if (Object.keys(auto).length) c.titulo = auto;
  }
  if (c.inmueble && !String(c.inmueble.referencia ?? "").trim() && t._estudio?.ref) c.inmueble.referencia = t._estudio.ref;
  // Luz (E8): solo los momentos con foto real; la noche simulada, solo si el agente la ofrece. Atardecer, solo con foto.
  const reales = new Set(c.panoramas.flatMap((p) => (p.variantes ?? []).map((v) => v.momento)).filter((m) => m && m !== "dia"));
  const momentos = ["dia", ...(reales.has("atardecer") ? ["atardecer"] : []), ...(reales.has("noche") || t._estudio?.nocheSimulada ? ["noche"] : [])];
  if (momentos.length > 1) c.momentos = momentos; else delete c.momentos;
  if (urlPublica && /^https?:\/\/[^\s]+$/i.test(urlPublica)) c.url_publica = urlPublica; else delete c.url_publica;
  for (const p of c.panoramas) {
    p.x = redondear(p.x); p.z = redondear(p.z);
    p.yaw = redondear(p.yaw ?? 0, 1);
    p.enlaces = vecinos.get(p.id) ?? [];
    if (p.rumbo_inicial != null) p.rumbo_inicial = redondear(p.rumbo_inicial, 1);
    for (const pt of p.puntos ?? []) { pt.yaw = redondear(pt.yaw, 1); pt.pitch = redondear(pt.pitch, 1); }
  }
  for (const e of c.estancias ?? []) e.poligono = e.poligono.map(([x, z]) => [redondear(x), redondear(z)]);
  for (const pl of c.plantas ?? []) {
    if (pl.plano && !pl.plano.imagen) delete pl.plano;
    if (pl.plano) { pl.plano.ancho_m = redondear(pl.plano.ancho_m); pl.plano.alto_m = redondear(pl.plano.alto_m); pl.plano.origen ??= [0, 0]; }
    if (pl.muros) pl.muros = pl.muros.map((m) => m.map((v) => redondear(v)));
  }
  // Estilos: solo los que tienen imágenes en alguna estancia.
  const usados = new Set(c.panoramas.flatMap((p) => (p.variantes ?? []).map((v) => v.estilo).filter(Boolean)));
  c.estilos = (c.estilos ?? []).filter((e) => e.id === "original" || usados.has(e.id));
  for (const id of usados) if (!c.estilos.some((e) => e.id === id)) c.estilos.push({ id, nombre: id });
  if (c.estilos.length <= 1) delete c.estilos;
  if (!c.panoramas.some((p) => p.mascara || p.variantes?.some((v) => v.mascara))) delete c.personalizacion;
  if (!c.inicio || !c.panoramas.some((p) => p.id === c.inicio)) c.inicio = c.panoramas[0]?.id;
  if (c.inmueble) {
    const ce = c.inmueble.certificado_energetico;
    if (ce?.en_tramite) { delete ce.consumo_letra; delete ce.emisiones_letra; delete ce.consumo_valor; delete ce.emisiones_valor; }
    if (ce && !ce.en_tramite) delete ce.en_tramite;
  }
  // Documentación privada (publico:false): nunca sale en lo que se publica.
  if (publico && c.documentacion) c.documentacion = c.documentacion.filter((d) => d.publico);
  // Enlaces no permitidos (javascript:, data:…): se descartan.
  for (const { obj, clave, opciones } of camposUrl(c)) if (!urlPermitida(obj[clave], opciones)) delete obj[clave];
  const zonas = zonasPublicadas(t);
  if (zonas) {
    const ids = new Set(c.panoramas.map((p) => p.id));
    c.secciones = structuredClone(zonas).map((s) => ({ ...s, estancias: (s.estancias ?? []).filter((x) => ids.has(x)) }));
  } else delete c.secciones;
  if (c.contacto?.modo === "whatsapp") delete c.contacto.webhook;
  if (c.contacto?.modo === "webhook") delete c.contacto.whatsapp;
  if (c.contacto?.whatsapp) c.contacto.whatsapp = String(c.contacto.whatsapp).replace(/\D/g, "");
  let r = limpiar(c, idiomas) ?? {};
  r = { version: 2, ...r };
  if (mapaRutas) r = sustituirRutas(r, mapaRutas);
  return r;
}
function sustituirRutas(v, fn) {
  if (Array.isArray(v)) return v.map((x) => sustituirRutas(x, fn));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, sustituirRutas(x, fn)]));
  if (typeof v === "string" && app.archivos.has(v)) return fn(v);
  return v;
}
/** Rutas de archivos usadas por el tour. */
export function rutasUsadas(t = app.tour) {
  const s = new Set();
  (function rec(v) {
    if (Array.isArray(v)) v.forEach(rec);
    else if (v && typeof v === "object") Object.values(v).forEach(rec);
    else if (typeof v === "string" && app.archivos.has(v)) s.add(v);
  })(t);
  return s;
}
export function archivosParaExportar(tExp) {
  const m = new Map();
  for (const r of rutasUsadas(tExp)) m.set(r, app.archivos.get(r));
  return m;
}

// ------------------------------------------------------------------ geometría
export { rumboDe };
export function pano(id) { return app.tour.panoramas.find((p) => p.id === id); }

// ------------------------------------------------------------------ interfaz
export function h(tag, props = {}, ...hijos) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "text") e.textContent = v;
    else if (k === "html") e.innerHTML = v;
    else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
    else if (k === "dataset") Object.assign(e.dataset, v);
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (k in e && typeof v !== "string") e[k] = v;
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const x of hijos.flat(Infinity)) if (x != null && x !== false) e.append(x instanceof Node ? x : document.createTextNode(String(x)));
  return e;
}
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const ICONOS = {
  fotos: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3.2"/><path d="M8 5l1.5-2h5L16 5"/>',
  plano: '<path d="M3 4h18v16H3z"/><path d="M3 12h7v8M14 4v6h7"/>',
  orientar: '<circle cx="12" cy="12" r="9"/><path d="M12 7l2.5 5-2.5 5-2.5-5z"/>',
  variantes: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><path d="M14 17h6M17 14v6"/>',
  datos: '<path d="M5 3h10l4 4v14H5z"/><path d="M9 10h6M9 14h6M9 18h4"/>',
  revisar: '<path d="M4 12l5 5L20 6"/>',
  exportar: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M4 15v5h16v-5"/>',
  deshacer: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>',
  rehacer: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 000 12h3"/>',
  abrir: '<path d="M3 7h6l2 2h10v10H3z"/>',
  nuevo: '<path d="M12 5v14M5 12h14"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  menos: '<path d="M5 12h14"/>',
  basura: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  arrastrar: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke-width="3"/>',
  estrella: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  cursor: '<path d="M5 3l14 8-6 2-2 6z"/>',
  regla: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
  poligono: '<path d="M5 8l7-5 7 5-3 11H8z"/>',
  muro: '<path d="M3 20V6h18v14"/><path d="M3 11h18M3 16h18M9 6v5M15 11v5M9 16v4"/>',
  enlace: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  ajustar: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  recargar: '<path d="M20 11a8 8 0 10-2.3 5.7"/><path d="M20 4v7h-7"/>',
  ojo: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  subir: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>',
  pincel: '<path d="M14 4l6 6-9 9H5v-6z"/>',
  goma: '<path d="M8 20h12M4 15l9-9 6 6-7 7H8z"/>',
  varita: '<path d="M4 20L15 9M17 3v4M15 5h4M20 9v2M19 10h2M11 3v2M10 4h2"/>',
  cerrar: '<path d="M6 6l12 12M18 6L6 18"/>',
  aviso: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  ok: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  error: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  descargar: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/>',
  copiar: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
  teclado: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  norte: '<path d="M12 2l4 10h-8z"/><path d="M12 22V12"/>',
  ampliar: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  lapiz: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  ayuda: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 014.8.9c0 1.7-2.4 2.2-2.4 3.6M12 17v.5"/>',
  inmobiliaria: '<path d="M4 21V9l8-5 8 5v12"/><path d="M9 21v-6h6v6M3 21h18"/>',
  abajo: '<path d="M6 9l6 6 6-6"/>',
  derecha: '<path d="M9 6l6 6-6 6"/>',
  izquierda: '<path d="M15 6l-6 6 6 6"/>',
  luz: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/>',
  extras: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5h8v2M3 12h18"/>',
  guia: '<path d="M5 4.5A1.5 1.5 0 016.5 3H19v15H6.5A1.5 1.5 0 005 19.5z"/><path d="M5 19.5A1.5 1.5 0 006.5 21H19v-3M9 7h6"/>',
  movil: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/>',
  chat: '<path d="M4 20l1.3-3.9A8 8 0 1112 20a8 8 0 01-4.2-1.2z"/>',
  correo: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  herramientas: '<path d="M14.5 5.5a4 4 0 00-5 5L4 16l4 4 5.5-5.5a4 4 0 005-5l-2.5 2.5-2.5-.5-.5-2.5z"/>',
  apariencia: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 010 17z" fill="currentColor" stroke="none"/>',
};
/** Icono de trazo. tam: px con la letra a 16 px; se aplica en rem (--ico, estudio.css), así sigue a la talla y a la pantalla. */
export function icono(n, tam = 18) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.style.setProperty("--ico", `${tam / 16}rem`);
  s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "1.7");
  s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round"); s.setAttribute("aria-hidden", "true");
  s.classList.add("ico");
  s.innerHTML = ICONOS[n] ?? "";
  return s;
}

/** Aviso flotante de vidrio (#toasts es la zona aria-live). tipo: info | ok | aviso | error */
export function toast(msg, tipo = "info", ms = 2600) {
  const t = h("div", { class: "toast c8-aviso c8-vidrio c8-vidrio--denso", "data-tipo": tipo },
    icono(tipo === "error" ? "error" : tipo === "ok" ? "ok" : tipo === "aviso" ? "aviso" : "info", 18), h("span", { text: msg }));
  $("#toasts").append(t);
  setTimeout(() => { t.classList.add("c8-saliendo"); setTimeout(() => t.remove(), 260); }, ms);
}

/**
 * Diálogo modal de vidrio (tema.css). botones: [{texto, valor, primario, peligro, izquierda}] → Promise<valor>.
 * Si `valor` es una función y devuelve `false`, el diálogo no se cierra (p. ej. hay un campo que corregir).
 * El contenido se desplaza dentro y los botones quedan siempre a la vista.
 */
export function dialogo({ titulo, texto, cuerpo, botones = [{ texto: "Aceptar", valor: true, primario: true }], ancho, clase = "", foco: focoInicial }) {
  return new Promise((ok) => {
    const id = titulo ? `dlg-titulo-${++nDialogo}` : null;
    const d = h("dialog", { class: `dialogo c8-dialogo c8-vidrio c8-vidrio--denso ${clase}`, style: ancho ? { width: ancho } : null, "aria-labelledby": id });
    const cerrar = (v) => { ok(v); if (d.open) d.close(); d.remove(); };
    d.addEventListener("close", () => { ok(undefined); d.remove(); });
    // Una acción destructiva («Eliminar») va en rojo aunque sea la principal.
    const tipo = (b) => (b.peligro ? "c8-boton--peligro" : b.primario ? "c8-boton--primario" : "c8-boton--secundario");
    d.append(
      h("div", { class: "dialogo-contenido" },
        titulo ? h("h2", { class: "c8-panel-titulo", id, text: titulo }) : null,
        texto ? h("p", { class: "c8-sec dialogo-texto", text: texto }) : null,
        cuerpo ?? null),
      botones.length ? h("div", { class: "botones" }, botones.map((b) => h("button", {
        type: "button", class: `c8-boton ${tipo(b)}${b.izquierda ? " izquierda" : ""}`, text: b.texto, "data-principal": b.primario ? "" : null,
        onclick: async () => {
          const v = typeof b.valor === "function" ? await b.valor() : b.valor;
          if (v !== false || !b.mantener) cerrar(v);
        },
      }))) : null);
    d.addEventListener("cancel", (e) => { e.preventDefault(); cerrar(undefined); });
    document.body.append(d);
    d.showModal();
    const foco = (focoInicial && d.querySelector(focoInicial)) ?? d.querySelector("input:not([type=checkbox]):not([type=radio]), textarea, select") ?? d.querySelector("[data-principal]");
    foco?.focus(); if (foco?.select && foco.value) foco.select();
  });
}
let nDialogo = 0;
/** Cierra el diálogo abierto (el último) sin valor. */
export function cerrarDialogo() { const d = [...document.querySelectorAll("dialog.dialogo[open]")].at(-1); d?.close(); }
export async function pedir(titulo, etiqueta, valor = "", { tipo = "text", ayuda } = {}) {
  // Los números se piden como texto (inputmode decimal) para aceptar la coma decimal española.
  const inp = h("input", { type: tipo === "number" ? "text" : tipo, inputmode: tipo === "number" ? "decimal" : null, value: valor, autocomplete: "off" });
  const cuerpo = h("label", { class: "campo" }, h("span", { text: etiqueta }), inp, ayuda ? h("small", { text: ayuda }) : null);
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); inp.closest("dialog").querySelector("[data-principal]").click(); } });
  return dialogo({ titulo, cuerpo, botones: [{ texto: "Cancelar", valor: null }, { texto: "Aceptar", primario: true, valor: () => inp.value }] });
}
export const confirmar = (titulo, texto, si = "Eliminar") =>
  dialogo({ titulo, texto, botones: [{ texto: "Cancelar", valor: false }, { texto: si, valor: true, primario: true, peligro: si === "Eliminar" }] });

export function elegirArchivos({ aceptar = "image/*", multiple = false, carpeta = false } = {}) {
  return new Promise((ok) => {
    const i = h("input", { type: "file", accept: aceptar, multiple, hidden: true });
    if (carpeta) i.webkitdirectory = true;
    i.onchange = () => { ok([...i.files]); i.remove(); };
    i.oncancel = () => { ok([]); i.remove(); };
    document.body.append(i);
    i.click();
  });
}
export const fmtM2 = (v) => `${v.toLocaleString("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 1, useGrouping: "always" })} m²`;
export const fmtMB = (b) => `${(b / 1048576).toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB`;

/** Capa «trabajando…» a pantalla completa (procesar un PDF, una copia de seguridad…). Se quita con .remove(). */
export function cargando(texto) {
  const capa = h("div", { class: "cargando-global", role: "status" },
    h("div", { class: "c8-vidrio c8-vidrio--denso" }, h("span", { text: texto }), h("div", { class: "progreso indeterminado" }, h("div"))));
  document.body.append(capa);
  return capa;
}

// ------------------------------------------------------------------ colores de los lienzos (tokens de tema.css)
let sonda = null, prueba = null;
/**
 * Colores del tema actual para pintar en un <canvas>: { nombre: "--c-acento" } (o ["--c-acento", reserva]) → { nombre: color }.
 * El navegador resuelve el token (claro u oscuro, color-mix, color relativo…); si el lienzo no entiende el resultado
 * (navegadores antiguos), se usa la reserva: gris neutro si no se indica otra. Se vuelven a leer con «cre8:tema» (alCambiarTema).
 */
export function coloresTema(tokens) {
  if (!sonda) {
    sonda = h("span", { hidden: true, "aria-hidden": "true" });
    document.body.append(sonda);
    prueba = document.createElement("canvas").getContext("2d");
  }
  const r = {};
  for (const [k, def] of Object.entries(tokens)) {
    const [token, reserva = "gray"] = [].concat(def);
    sonda.style.color = `var(${token})`;
    const c = getComputedStyle(sonda).color;
    prueba.fillStyle = "#010203";
    prueba.fillStyle = c;
    r[k] = c && prueba.fillStyle !== "#010203" ? prueba.fillStyle : reserva;
  }
  return r;
}
/** Color hexadecimal con transparencia (degradados de los lienzos); los tokens de color base son hexadecimales. */
export const conAlfa = (color, a) => (/^#[0-9a-f]{6}$/i.test(color) ? `rgba(${[1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)).join(", ")}, ${a})` : color);
/** Tipografía de la interfaz para un lienzo, en rem (sigue a la pantalla y a la talla S/M/L): fuenteLienzo(600, 0.8). */
export function fuenteLienzo(peso, rem) {
  const raiz = getComputedStyle(document.documentElement);
  return `${peso} ${Math.round(rem * parseFloat(raiz.fontSize) * 10) / 10}px ${raiz.getPropertyValue("--fuente").trim() || "system-ui, sans-serif"}`;
}
/** Avisa cuando cambian el tema, la talla o la transparencia (evento «cre8:tema» de tema.js). → función para dejar de escuchar. */
export function alCambiarTema(fn) {
  document.addEventListener("cre8:tema", fn);
  return () => document.removeEventListener("cre8:tema", fn);
}
/** Deslizador del sistema de diseño (.c8-deslizador) con la pista ya rellena hasta su valor. */
export function deslizador(props) {
  const r = h("input", { type: "range", class: "c8-deslizador", ...props });
  const min = Number(props.min ?? 0), max = Number(props.max ?? 100);
  r.style.setProperty("--valor", `${max > min ? ((Number(props.value) - min) / (max - min)) * 100 : 0}%`);
  return r;
}
/** Guarda un archivo como documento del proyecto (documentacion). Privado salvo que se marque «Público». */
export async function guardarDocumento(f, tipo, { publico = false, nombre } = {}) {
  const ext = (f.name.split(".").pop() || "bin").toLowerCase();
  const ruta = rutaLibre(`docs/${slug(f.name.replace(/\.[^.]+$/, "")) || "documento"}`, ext);
  await guardarArchivo(ruta, f);
  cambiar((t) => { t.documentacion ??= []; t.documentacion.push({ nombre: nombre ?? f.name.replace(/\.[^.]+$/, ""), archivo: ruta, tipo, publico }); }, { tipo: "datos" });
  return ruta;
}

/**
 * Lleva al usuario a un campo concreto dentro de `raiz`: abre los plegables que lo contienen, lo centra, le da el foco
 * y lo resalta un momento («Ver» y «Corregir» de «Antes de publicar»). → ¿lo ha encontrado?
 */
export function enfocarCampo(raiz, campo) {
  const el = campo && raiz?.querySelector(`[data-campo="${CSS.escape(campo)}"]`);
  if (!el) return false;
  for (let d = el.closest("details"); d; d = d.parentElement?.closest("details")) d.open = true;
  el.scrollIntoView({ block: "center", behavior: "instant" });
  const foco = el.matches("input, select, textarea, button") ? el : el.querySelector("input:not([type=hidden]), select, textarea, button");
  foco?.focus({ preventScroll: true });
  el.classList.remove("destacado");
  void el.offsetWidth; // reinicia la animación si se pide dos veces seguidas
  el.classList.add("destacado");
  setTimeout(() => el.classList.remove("destacado"), 2200);
  return true;
}
