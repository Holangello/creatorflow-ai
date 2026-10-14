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
export const IDIOMAS = { es: "Español", en: "English", fr: "Français", de: "Deutsch", it: "Italiano", pt: "Português", ca: "Català" };

/** modo: "rapido" (5 pasos, plano opcional) | "completo" (todas las herramientas). */
export function tourNuevo(modo = "rapido") {
  return {
    version: 2,
    titulo: { es: "" },
    idioma: "es",
    idiomas: ["es", "en"],
    marca: { nombre: "", color: "#c8a24a" },
    agente: {},
    contacto: { modo: "whatsapp" },
    inmueble: { operacion: "venta", tipo: "piso", estado_obra: "construido", moneda: "EUR", certificado_energetico: {}, caracteristicas: [] },
    altura_camara: 1.5,
    radio_enlace_auto: 4.5,
    norte: 0,
    plantas: [{ id: "p0", nombre: { es: "Planta principal", en: "Main floor" } }],
    estancias: [],
    estilos: [{ id: "original", nombre: { es: "Original", en: "Original" } }, ...structuredClone(ESTILOS_IA)],
    momentos: ["dia", "atardecer", "noche"],
    personalizacion: { paredes: structuredClone(PAREDES_DEF), suelos: structuredClone(SUELOS_DEF) },
    panoramas: [],
    _estudio: { manuales: [], quitados: [], meta: {}, modo },
  };
}

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
export const esRapido = () => app.tour?._estudio?.modo === "rapido";
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
        "Tu trabajo sigue abierto, pero descarga una copia de seguridad (Publicar → Avanzado → Copia de seguridad) antes de cerrar la pestaña para no perderlo. " +
        "En modo incógnito o con el almacenamiento bloqueado el navegador no permite guardar.",
      botones: [{ texto: "Entendido", primario: true }],
    });
  }
}
export function nombreProyecto() {
  return textoDe(app.tour?.titulo) || app.tour?.inmueble?.referencia || app.proyecto?.nombre || "Proyecto sin título";
}

// ------------------------------------------------------------------ textos traducibles
export function textoDe(t, idioma = "es") {
  if (t == null) return "";
  if (typeof t === "string") return t;
  return t[idioma] || t.es || Object.values(t).find(Boolean) || "";
}
export function fijarTexto(obj, clave, idioma, valor) {
  let t = obj[clave];
  if (t == null || typeof t === "string") t = { es: t ?? "" };
  t[idioma] = valor;
  obj[clave] = t;
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
  // Modo rápido sin plano: las fotos sin colocar se conectan en el orden de la lista (1 ↔ 2 ↔ 3…).
  const lineales = new Set();
  if (t._estudio?.modo === "rapido") {
    for (let i = 0; i + 1 < t.panoramas.length; i++) {
      const a = t.panoramas[i], b = t.panoramas[i + 1];
      if (!colocado(a) || !colocado(b)) { const k = claveEnlace(a.id, b.id); lineales.add(k); efectivos.add(k); }
    }
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
/** Campos de URL del tour → [{obj, clave, opciones, donde}] */
function camposUrl(t) {
  const r = [];
  const add = (obj, clave, donde, opciones = {}) => { if (obj && obj[clave] != null && obj[clave] !== "") r.push({ obj, clave, donde, opciones }); };
  add(t.marca, "web", "Web de la marca");
  add(t.contacto, "url_privacidad", "Política de privacidad");
  add(t.contacto, "webhook", "Conexión con el CRM", { soloHttps: true });
  for (const d of t.inmueble?.documentos ?? []) add(d, "url", `Documento «${textoDe(d.nombre) || "sin nombre"}»`, { interna: true });
  for (const d of t.documentacion ?? []) add(d, "archivo", `Material «${textoDe(d.nombre) || "sin nombre"}»`, { interna: true });
  for (const p of t.panoramas ?? []) for (const pt of p.puntos ?? []) {
    add(pt, "enlace", `Nota «${textoDe(pt.titulo) || "sin título"}» de ${textoDe(p.nombre) || p.id}`);
    add(pt, "video", `Vídeo de la nota «${textoDe(pt.titulo) || "sin título"}»`);
  }
  return r;
}
/** URLs no permitidas (javascript:, data:, etc.) → [{donde, valor}] */
export function urlsNoValidas(t = app.tour) {
  return camposUrl(t).filter(({ obj, clave, opciones }) => !urlPermitida(obj[clave], opciones)).map(({ obj, clave, donde }) => ({ donde, valor: String(obj[clave]) }));
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
  return r;
}

/**
 * Tour listo para publicar (sin campos internos, textos normalizados, enlaces explícitos).
 * publico: sin documentación privada (publico:false). mapaRutas: sustituye rutas por URLs (vista previa).
 */
export function tourParaExportar(t = app.tour, { mapaRutas = null, publico = true } = {}) {
  const c = structuredClone(t);
  const { vecinos } = calcularEnlaces(t);
  const idiomas = c.idiomas?.length ? c.idiomas : ["es"];
  c.version = 2;
  c.idioma = idiomas.includes(c.idioma) ? c.idioma : idiomas[0];
  // Fotos sin colocar: en fila, a 2,5 m de la anterior (así las flechas apuntan "adelante" y "atrás").
  let ultimo = null;
  for (const p of c.panoramas) {
    if (!colocado(p)) { p.x = ultimo ? ultimo[0] + 2.5 : 0; p.z = ultimo ? ultimo[1] : 0; }
    ultimo = [p.x, p.z];
  }
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
  if (c.secciones) {
    const ids = new Set(c.panoramas.map((p) => p.id));
    c.secciones = c.secciones.map((s) => ({ ...s, estancias: (s.estancias ?? []).filter((x) => ids.has(x)) }));
  }
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
};
export function icono(n, tam = 18) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", tam); s.setAttribute("height", tam);
  s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "1.7");
  s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round"); s.setAttribute("aria-hidden", "true");
  s.classList.add("ico");
  s.innerHTML = ICONOS[n] ?? "";
  return s;
}

export function toast(msg, tipo = "info", ms = 2600) {
  let cont = $("#toasts");
  const t = h("div", { class: `toast ${tipo}`, role: "status" }, icono(tipo === "error" ? "error" : tipo === "ok" ? "ok" : tipo === "aviso" ? "aviso" : "info", 16), h("span", { text: msg }));
  cont.append(t);
  setTimeout(() => { t.classList.add("sale"); setTimeout(() => t.remove(), 300); }, ms);
}

/** Diálogo modal. botones: [{texto, valor, primario, peligro}] → Promise<valor>. */
export function dialogo({ titulo, texto, cuerpo, botones = [{ texto: "Aceptar", valor: true, primario: true }], ancho }) {
  return new Promise((ok) => {
    const d = h("dialog", { class: "dialogo", style: ancho ? { width: ancho } : null });
    const cerrar = (v) => { ok(v); if (d.open) d.close(); d.remove(); };
    d.addEventListener("close", () => { ok(undefined); d.remove(); });
    d.append(...[
      h("h2", { text: titulo }),
      texto ? h("p", { class: "suave", text: texto }) : null,
      cuerpo ?? null,
      h("div", { class: "botones" }, botones.map((b) => h("button", {
        class: `btn ${b.primario ? "primario" : ""} ${b.peligro ? "peligro" : ""}`, text: b.texto,
        onclick: () => cerrar(typeof b.valor === "function" ? b.valor() : b.valor),
      }))),
    ].filter(Boolean));
    d.addEventListener("cancel", (e) => { e.preventDefault(); cerrar(undefined); });
    document.body.append(d);
    d.showModal();
    const foco = d.querySelector("input, textarea, select") ?? d.querySelector(".btn.primario");
    foco?.focus(); foco?.select?.();
  });
}
export async function pedir(titulo, etiqueta, valor = "", { tipo = "text", ayuda } = {}) {
  // Los números se piden como texto (inputmode decimal) para aceptar la coma decimal española.
  const inp = h("input", { type: tipo === "number" ? "text" : tipo, inputmode: tipo === "number" ? "decimal" : null, value: valor, autocomplete: "off" });
  const cuerpo = h("label", { class: "campo" }, h("span", { text: etiqueta }), inp, ayuda ? h("small", { text: ayuda }) : null);
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); inp.closest("dialog").querySelector(".btn.primario").click(); } });
  return dialogo({ titulo, cuerpo, botones: [{ texto: "Cancelar", valor: null }, { texto: "Aceptar", primario: true, valor: () => inp.value }] });
}
export const confirmar = (titulo, texto, si = "Eliminar") =>
  dialogo({ titulo, texto, botones: [{ texto: "Cancelar", valor: false }, { texto: si, valor: true, primario: true, peligro: si === "Eliminar" }] });

export function elegirArchivos({ aceptar = "image/*", multiple = false, carpeta = false } = {}) {
  return new Promise((ok) => {
    const i = h("input", { type: "file", accept: aceptar, multiple, style: { display: "none" } });
    if (carpeta) i.webkitdirectory = true;
    i.onchange = () => { ok([...i.files]); i.remove(); };
    i.oncancel = () => { ok([]); i.remove(); };
    document.body.append(i);
    i.click();
  });
}
export const fmtM2 = (v) => `${v.toLocaleString("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} m²`;
export const fmtMB = (b) => `${(b / 1048576).toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB`;
export const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
