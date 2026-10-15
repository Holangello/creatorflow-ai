// Proyectos: nuevo, abrir (IndexedDB), importar ZIP / carpeta, soltar archivos y migración de proyectos antiguos.
import { db } from "./estudio-db.js";
import { leerZip, tipoMime } from "./estudio-util.js";
import { app, emitir, h, icono, toast, dialogo, confirmar, tourNuevo, importarEnlaces, reiniciarHistorial, limpiarUrls, cargando,
  guardarAhora, guardarArchivo, rutasUsadas, textoDe, reiniciarGuardado, archivosSinGuardar, IDIOMAS, referenciaNueva, cerrarDialogo, COLOR_ANTIGUO } from "./estudio-nucleo.js";
import { anadirFotos, generarDerivadosFaltantes } from "./estudio-fotos.js";
import { sincronizarAlAbrir, tieneDatosPropios } from "./estudio-perfil.js";

const nuevoId = () => (crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2));
const recordar = (id) => { try { localStorage.setItem("estudio:ultimo", id); } catch {} };

function activar(proyecto, tour, archivos) {
  limpiarUrls();
  app.proyecto = proyecto;
  app.tour = tour;
  app.archivos = archivos;
  app.nodo = tour.panoramas[0]?.id ?? null;
  app.planta = tour.plantas?.[0]?.id ?? "p0";
  app.vista = null;
  // «Mi inmobiliaria»: un proyecto enlazado toma los datos del perfil al abrirse (si el perfil cambió entretanto).
  let cambio = false;
  try { cambio = sincronizarAlAbrir(); } catch (e) { console.warn("No se pudo aplicar Mi inmobiliaria", e); }
  reiniciarHistorial();
  reiniciarGuardado();
  recordar(proyecto.id);
  emitir("proyecto");
  if (cambio) guardarAhora();
}

export async function iniciarProyecto() {
  db.persistir();
  let id = null;
  try { id = localStorage.getItem("estudio:ultimo"); } catch {}
  try {
    if (!id) id = (await db.listar())[0]?.id;
    if (id && (await cargarProyecto(id, { silencioso: true }))) return;
  } catch (e) {
    console.warn("IndexedDB no disponible", e);
  }
  // Primera vez: proyecto nuevo (toma Mi inmobiliaria si ya existe).
  await nuevoProyecto({ silencioso: true });
}

export async function nuevoProyecto({ silencioso = false } = {}) {
  if (app.proyecto) await guardarAhora();
  if (!silencioso) app.seccion = "fotos";
  activar({ id: nuevoId(), nombre: "Proyecto sin título" }, tourNuevo(), new Map());
  await guardarAhora();
  if (!silencioso) toast("Proyecto nuevo", "ok");
}

export async function cargarProyecto(id, { silencioso = false } = {}) {
  const p = await db.cargarProyecto(id);
  if (!p) return false;
  const archivos = await db.archivos(id);
  normalizarTour(p.tour);
  activar({ id: p.id, nombre: p.nombre }, p.tour, archivos);
  // Limpieza de archivos huérfanos (fotos borradas en sesiones anteriores).
  const usados = rutasUsadas(p.tour);
  for (const r of archivos.keys()) if (!usados.has(r)) { archivos.delete(r); db.borrarArchivo(id, r).catch(() => {}); }
  if (!silencioso) toast(`Abierto: ${p.nombre}`, "ok");
  // Si falta alguna versión móvil o miniatura (p. ej. un guardado que falló), se vuelve a generar.
  generarDerivadosFaltantes();
  return true;
}

/**
 * Completa un tour (importado o antiguo) con la estructura que espera el Estudio y migra los proyectos de antes de la
 * fase 3: sin modo Rápido/Completo, solo es/en/fr/de, «noche simulada» explícita, una sola lista de documentos y
 * «Mi inmobiliaria». Es idempotente: se puede aplicar a un proyecto ya migrado.
 */
export function normalizarTour(t) {
  const base = tourNuevo();
  t.version = 2;
  t.panoramas ??= [];
  for (const k of ["idioma", "idiomas", "marca", "agente", "contacto", "inmueble", "altura_camara", "radio_enlace_auto", "norte", "estilos", "personalizacion", "estancias"]) {
    if (t[k] == null) t[k] = base[k];
  }
  if (t.titulo == null) t.titulo = { es: "" };
  t.inmueble.certificado_energetico ??= {};
  t.inmueble.caracteristicas ??= [];
  if (!t.plantas?.length) {
    t.plantas = [{ id: "p0", nombre: { es: "Planta principal", en: "Main floor" } }];
    if (t.plano) t.plantas[0].plano = t.plano;
    if (t.muros) t.plantas[0].muros = t.muros;
  }
  delete t.plano; delete t.muros;
  for (const pl of t.plantas) if (pl.plano) pl.plano.origen ??= [0, 0];
  for (const p of t.panoramas) {
    p.planta ??= t.plantas[0].id;
    if (!t.estilos.some((e) => e.id === "original")) t.estilos.unshift({ id: "original", nombre: { es: "Original", en: "Original" } });
  }
  if (!t._estudio) importarEnlaces(t);
  const e = t._estudio;
  e.meta ??= {};
  e.manuales ??= []; e.quitados ??= [];
  // Sin modos Rápido/Completo (E3): las fotos sin colocar se conectan siempre en orden, así que el modo ya no cambia nada.
  delete e.modo;
  // Idiomas (E2): solo los que tiene el visor; el español siempre.
  t.idiomas = (Array.isArray(t.idiomas) ? t.idiomas : []).filter((c, i, a) => c in IDIOMAS && a.indexOf(c) === i);
  if (!t.idiomas.includes("es")) t.idiomas.unshift("es");
  if (!t.idiomas.includes(t.idioma)) t.idioma = "es";
  // Luz (E8): la lista de momentos que se guardaba por defecto no la eligió el agente. Si eligió noche sin foto, era simulada.
  if (typeof e.nocheSimulada !== "boolean") {
    const m = Array.isArray(t.momentos) ? t.momentos : [];
    const porDefecto = m.length === 3 && ["dia", "atardecer", "noche"].every((x) => m.includes(x));
    const conFoto = t.panoramas.some((p) => (p.variantes ?? []).some((v) => v.momento === "noche"));
    e.nocheSimulada = m.includes("noche") && !porDefecto && !conFoto;
  }
  delete t.momentos;
  // Documentos (E10): una sola lista (documentacion) con «Público». Los «documentos para la ficha» ya eran públicos.
  if (Array.isArray(t.inmueble.documentos)) {
    t.documentacion = Array.isArray(t.documentacion) ? t.documentacion : [];
    for (const d of t.inmueble.documentos) {
      const archivo = typeof d?.url === "string" ? d.url.trim() : "";
      if (!archivo) continue;
      const ya = t.documentacion.find((x) => x.archivo === archivo);
      if (ya) ya.publico = true;
      else t.documentacion.push({ nombre: d.nombre ?? "", archivo, tipo: "otro", publico: true });
    }
    delete t.inmueble.documentos;
  }
  // Mi inmobiliaria (E1): los proyectos con contacto propio lo conservan; los vacíos usan el perfil.
  if (typeof e.perfil !== "boolean") e.perfil = !tieneDatosPropios(t);
  // Referencia automática: solo en proyectos aún sin fotos (los ya publicados conservan su carpeta /tours/…/).
  if (!e.ref && !t.panoramas.length) e.ref = referenciaNueva();
  // Color de marca (fase 4, decisión A): el antiguo valor por defecto no lo eligió nadie; sin color, el visor usa el champán del tema.
  if (String(t.marca?.color ?? "").toLowerCase() === COLOR_ANTIGUO) delete t.marca.color;
  return t;
}

// ------------------------------------------------------------------ importar
export async function importarZip(archivo) {
  const capa = cargando(`Leyendo ${archivo.name}…`);
  try {
    const mapa = await leerZip(archivo);
    await importarMapa(mapa, archivo.name.replace(/\.zip$/i, ""));
  } catch (e) {
    console.error(e);
    toast(`No se pudo importar el ZIP: ${e.message}`, "error", 6000);
  } finally { capa.remove(); }
}

/** archivos: [{archivo: File, ruta}] de una carpeta. */
export async function importarCarpeta(lista) {
  const mapa = new Map(lista.map(({ archivo, ruta }) => [ruta, archivo]));
  const capa = cargando("Importando carpeta…");
  try { await importarMapa(mapa, lista[0]?.ruta.split("/")[0] ?? "Proyecto"); }
  catch (e) { console.error(e); toast(`No se pudo importar la carpeta: ${e.message}`, "error", 6000); }
  finally { capa.remove(); }
}

async function importarMapa(mapa, nombre) {
  const rutas = [...mapa.keys()].filter((r) => !r.startsWith("__MACOSX/"));
  const rutaTour = rutas.filter((r) => /(^|\/)tour\.json$/i.test(r)).sort((a, b) => a.length - b.length)[0];
  if (!rutaTour) {
    // Sin tour.json: si son fotos, se añaden al proyecto actual.
    const rutasFotos = rutas.filter((r) => /\.(jpe?g|png|webp)$/i.test(r));
    if (rutasFotos.length) return anadirFotos(rutasFotos.map((r) => { const b = mapa.get(r); return b instanceof File ? b : new File([b], r.split("/").pop(), { type: b.type || tipoMime(r) }); }));
    throw new Error("no contiene tour.json ni fotos");
  }
  const prefijo = rutaTour.slice(0, rutaTour.length - "tour.json".length);
  let tour;
  try { tour = JSON.parse(await mapa.get(rutaTour).text()); }
  catch { throw new Error("tour.json no es un JSON válido"); }
  if (tour.demo) throw new Error("es el tour de demostración");
  const meta = mapa.get(prefijo + "estudio/proyecto.json");
  let deCopia = false;
  if (meta) {
    try {
      const m = JSON.parse(await meta.text());
      if (m?.tour && typeof m.tour === "object" && Array.isArray(m.tour.panoramas)) { tour = m.tour; deCopia = true; } // copia de seguridad: proyecto de trabajo completo
      else if (m?.estudio) { tour._estudio = m.estudio; for (const p of tour.panoramas ?? []) delete p.enlaces; }
    } catch { /* metadatos dañados: se reconstruyen desde tour.json */ }
  }
  normalizarTour(tour);
  const archivos = new Map();
  for (const r of rutas) {
    if (!r.startsWith(prefijo) || r === rutaTour) continue;
    const rel = r.slice(prefijo.length);
    const b = mapa.get(r);
    archivos.set(rel, b.type ? b : new Blob([b], { type: tipoMime(rel) }));
  }
  // Solo se guardan los archivos que usa el tour (no el visor, ni vídeos, etc.).
  const antes = app.archivos;
  app.archivos = archivos;
  const usados = rutasUsadas(tour);
  app.archivos = antes;
  const faltan = [];
  (function rec(v, k) {
    if (Array.isArray(v)) v.forEach((x) => rec(x, k));
    else if (v && typeof v === "object") for (const [kk, x] of Object.entries(v)) rec(x, kk);
    else if (typeof v === "string" && /^(imagen|imagen_movil|miniatura|mascara|logo|foto)$/.test(k) && !/^(https?:|data:|blob:)/.test(v) && !archivos.has(v)) faltan.push(v);
  })(tour);
  const proyecto = { id: nuevoId(), nombre: textoDe(tour.titulo) || tour.inmueble?.referencia || nombre };
  if (app.proyecto) await guardarAhora();
  const finales = new Map([...archivos].filter(([r]) => usados.has(r)));
  activar(proyecto, tour, finales);
  for (const [r, b] of finales) await guardarArchivo(r, b);
  await guardarAhora();
  if (archivosSinGuardar()) toast("Algunos archivos no se pudieron guardar en el navegador. Descarga una copia de seguridad al terminar.", "aviso", 7000);
  toast(deCopia ? `Copia de seguridad restaurada: ${proyecto.nombre}` : `Importado: ${proyecto.nombre} (${tour.panoramas.length} fotos)`, "ok", 4000);
  if (faltan.length) toast(`Faltan ${faltan.length} archivos referenciados (p. ej. ${faltan[0]})`, "aviso", 8000);
  generarDerivadosFaltantes();
}

// ------------------------------------------------------------------ soltar
/** Lee lo soltado (archivos y carpetas) → [{archivo, ruta}]. Debe llamarse dentro del evento drop. */
export function leerSoltado(dt) {
  const entradas = [...(dt.items ?? [])].map((i) => i.webkitGetAsEntry?.()).filter(Boolean);
  if (!entradas.length) return Promise.resolve([...dt.files].map((f) => ({ archivo: f, ruta: f.name })));
  const salida = [];
  const leerEntrada = (en, ruta) => new Promise((ok) => {
    if (en.isFile) en.file((f) => { salida.push({ archivo: f, ruta: ruta + f.name }); ok(); }, () => ok());
    else if (en.isDirectory) {
      const lector = en.createReader();
      const todas = [];
      const lote = () => lector.readEntries(async (es) => {
        if (es.length) { todas.push(...es); lote(); }
        else { for (const x of todas) await leerEntrada(x, ruta + en.name + "/"); ok(); }
      }, () => ok());
      lote();
    } else ok();
  });
  return Promise.all(entradas.map((en) => leerEntrada(en, ""))).then(() => salida);
}

export async function importarArchivosSoltados(lista) {
  const zip = lista.find(({ archivo }) => /\.zip$/i.test(archivo.name));
  if (zip) return importarZip(zip.archivo);
  if (lista.some(({ ruta }) => /(^|\/)tour\.json$/i.test(ruta))) {
    const ok = await confirmar("Abrir como proyecto nuevo", "Has soltado una carpeta con tour.json. Se creará un proyecto nuevo con su contenido (el actual queda guardado).", "Importar");
    if (ok) return importarCarpeta(lista);
    return;
  }
  const fotos = lista.filter(({ archivo }) => /^image\/(jpeg|png|webp)$/.test(archivo.type) || /\.(jpe?g|png|webp|osv|insv|mp4|mov|m4v)$/i.test(archivo.name));
  if (fotos.length) {
    emitir("ir", { seccion: "fotos" });
    return anadirFotos(fotos.map((f) => f.archivo));
  }
  toast("Formato no reconocido. Suelta fotos JPG, un ZIP exportado o una carpeta con tour.json.", "aviso", 5000);
}

// ------------------------------------------------------------------ «Mis proyectos» (Proyecto ▾ → Mis proyectos, Ctrl+O)
/** Lista de proyectos guardados en este navegador: abrir o eliminar. Lo demás (nuevo, copia, restaurar) está en «Proyecto ▾». */
export async function dialogoProyectos() {
  let lista = [];
  let errorDb = null;
  try { await guardarAhora(); lista = await db.listar(); } catch (e) { errorDb = e; }
  const urls = [];
  const cont = h("div", { class: "lista-proyectos", role: "list" });
  const pintar = () => {
    cont.replaceChildren(...(lista.length ? lista.map((p) => {
      let img = h("div", { class: "ph" });
      if (p.miniatura instanceof Blob) { const u = URL.createObjectURL(p.miniatura); urls.push(u); img = h("img", { src: u, alt: "" }); }
      const actual = p.id === app.proyecto?.id;
      const abrir = async () => { cerrarDialogo(); if (!actual) await cargarProyecto(p.id); };
      return h("div", { class: `proyecto-fila ${actual ? "actual" : ""}`, role: "listitem" },
        h("button", { type: "button", class: "abrir-proyecto", onclick: abrir, "aria-label": `Abrir ${p.nombre || "Sin título"}` }, img,
          h("span", { class: "datos" }, h("span", { class: "nombre", text: p.nombre || "Sin título" }),
            h("small", { text: `${p.nFotos ?? 0} fotos · ${new Date(p.actualizado).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}${actual ? " · abierto" : ""}` }))),
        h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--icono c8-boton--s", title: "Eliminar proyecto", "aria-label": `Eliminar ${p.nombre || "proyecto"}`, onclick: async () => {
          if (!(await confirmar("Eliminar proyecto", `Se borrará «${p.nombre}» y sus imágenes de este navegador. No se puede deshacer.`))) return;
          await db.borrarProyecto(p.id).catch(() => {});
          lista = lista.filter((x) => x.id !== p.id);
          if (actual) { await nuevoProyecto({ silencioso: true }); lista = await db.listar().catch(() => []); }
          pintar();
        } }, icono("basura", 16)));
    }) : [h("p", { class: "c8-sec", text: errorDb ? "Este navegador no permite guardar proyectos (almacenamiento bloqueado o modo privado)." : "Aún no hay proyectos guardados." })]));
  };
  pintar();
  await dialogo({
    titulo: "Mis proyectos", ancho: "min(38.75rem, calc(100vw - 2rem))",
    texto: "Se guardan solos en este ordenador. Para llevarlos a otro, usa «Proyecto ▾ → Copia de seguridad».",
    cuerpo: cont, botones: [{ texto: "Cerrar", valor: null }],
  });
  urls.forEach((u) => URL.revokeObjectURL(u));
}
