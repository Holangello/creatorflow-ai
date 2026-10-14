// Proyectos: nuevo, abrir (IndexedDB), importar ZIP / carpeta, soltar archivos.
import { db } from "./estudio-db.js";
import { leerZip, tipoMime } from "./estudio-util.js";
import { app, emitir, h, icono, toast, dialogo, confirmar, tourNuevo, importarEnlaces, reiniciarHistorial, limpiarUrls,
  guardarAhora, guardarArchivo, elegirArchivos, rutasUsadas, textoDe } from "./estudio-nucleo.js";
import { anadirFotos, generarDerivadosFaltantes } from "./estudio-fotos.js";

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
  reiniciarHistorial();
  recordar(proyecto.id);
  emitir("proyecto");
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
  await nuevoProyecto({ silencioso: true });
}

export async function nuevoProyecto({ silencioso = false } = {}) {
  if (app.proyecto) await guardarAhora();
  activar({ id: nuevoId(), nombre: "Proyecto sin título" }, tourNuevo(), new Map());
  await guardarAhora();
  if (!silencioso) toast("Proyecto nuevo creado", "ok");
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
  return true;
}

/** Completa un tour (importado o antiguo) con la estructura que espera el Estudio. */
export function normalizarTour(t) {
  const base = tourNuevo();
  t.version = 2;
  t.panoramas ??= [];
  for (const k of ["idioma", "idiomas", "marca", "agente", "contacto", "inmueble", "altura_camara", "radio_enlace_auto", "norte", "estilos", "momentos", "personalizacion", "estancias"]) {
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
  t._estudio.meta ??= {};
  t._estudio.manuales ??= []; t._estudio.quitados ??= [];
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
    const fotos = rutas.filter((r) => /\.(jpe?g|png|webp)$/i.test(r)).map((r) => mapa.get(r));
    if (fotos.length) return anadirFotos(fotos.map((b, i) => (b instanceof File ? b : new File([b], rutas[i].split("/").pop(), { type: b.type }))));
    throw new Error("no contiene tour.json ni fotos");
  }
  const prefijo = rutaTour.slice(0, rutaTour.length - "tour.json".length);
  let tour;
  try { tour = JSON.parse(await mapa.get(rutaTour).text()); }
  catch { throw new Error("tour.json no es un JSON válido"); }
  if (tour.demo) throw new Error("es el tour de demostración");
  const meta = mapa.get(prefijo + "estudio/proyecto.json");
  if (meta) {
    try {
      const m = JSON.parse(await meta.text());
      if (m?.estudio) { tour._estudio = m.estudio; for (const p of tour.panoramas ?? []) delete p.enlaces; }
    } catch { /* metadatos dañados: se reconstruyen */ }
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
  let errores = 0;
  for (const [r, b] of finales) {
    try { await db.guardarArchivo(proyecto.id, r, b); } catch { errores++; }
  }
  await guardarAhora();
  if (errores) toast("Algunas imágenes no se pudieron guardar en el navegador. Exporta un ZIP al terminar.", "aviso", 7000);
  toast(`Importado: ${proyecto.nombre} (${tour.panoramas.length} fotos)`, "ok", 4000);
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
  const fotos = lista.filter(({ archivo }) => /^image\/(jpeg|png|webp)$/.test(archivo.type) || /\.(jpe?g|png|webp)$/i.test(archivo.name));
  if (fotos.length) {
    emitir("ir", { seccion: "fotos" });
    return anadirFotos(fotos.map((f) => f.archivo));
  }
  toast("Formato no reconocido. Suelta fotos JPG, un ZIP exportado o una carpeta con tour.json.", "aviso", 5000);
}

// ------------------------------------------------------------------ diálogo Abrir
export async function dialogoAbrir() {
  let lista = [];
  let errorDb = null;
  try { await guardarAhora(); lista = await db.listar(); } catch (e) { errorDb = e; }
  const urls = [];
  const cont = h("div", { class: "lista-proyectos" });
  const pintar = () => {
    cont.replaceChildren(...(lista.length ? lista.map((p) => {
      let img = h("div", { class: "ph" });
      if (p.miniatura instanceof Blob) { const u = URL.createObjectURL(p.miniatura); urls.push(u); img = h("img", { src: u, alt: "" }); }
      const fila = h("div", { class: `proyecto-fila ${p.id === app.proyecto?.id ? "actual" : ""}`, role: "button", tabindex: 0 },
        img,
        h("div", {}, h("div", { text: p.nombre || "Sin título" }), h("small", { text: `${p.nFotos ?? 0} fotos · ${new Date(p.actualizado).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}${p.id === app.proyecto?.id ? " · abierto" : ""}` })),
        h("button", { class: "btn fantasma peq icono-btn", title: "Eliminar proyecto", "aria-label": "Eliminar proyecto", onclick: async (e) => {
          e.stopPropagation();
          if (!(await confirmar("Eliminar proyecto", `Se borrará «${p.nombre}» y sus imágenes de este navegador. No se puede deshacer.`))) return;
          await db.borrarProyecto(p.id).catch(() => {});
          lista = lista.filter((x) => x.id !== p.id);
          if (p.id === app.proyecto?.id) { await nuevoProyecto({ silencioso: true }); lista = await db.listar().catch(() => []); }
          pintar();
        } }, icono("basura", 16)));
      const abrir = async () => { cerrar(); if (p.id !== app.proyecto?.id) await cargarProyecto(p.id); };
      fila.onclick = abrir;
      fila.onkeydown = (e) => { if (e.key === "Enter") abrir(); };
      return fila;
    }) : [h("p", { class: "suave", text: errorDb ? "Este navegador no permite guardar proyectos (almacenamiento bloqueado o modo privado)." : "Aún no hay proyectos guardados." })]));
  };
  pintar();
  let cerrar;
  const opciones = h("div", { class: "opciones-abrir" },
    h("button", { class: "btn", onclick: async () => { cerrar(); await nuevoProyecto(); } }, icono("nuevo", 22), "Proyecto nuevo"),
    h("button", { class: "btn", onclick: async () => { const [f] = await elegirArchivos({ aceptar: ".zip,application/zip" }); if (f) { cerrar(); importarZip(f); } } }, icono("subir", 22), "Importar ZIP exportado"),
    h("button", { class: "btn", onclick: async () => {
      const fs = await elegirArchivos({ aceptar: "", carpeta: true, multiple: true });
      if (fs.length) { cerrar(); importarCarpeta(fs.map((f) => ({ archivo: f, ruta: f.webkitRelativePath || f.name }))); }
    } }, icono("abrir", 22), "Importar carpeta con tour.json"),
  );
  const p = dialogo({
    titulo: "Proyectos", ancho: "min(620px, calc(100vw - 32px))",
    cuerpo: h("div", {}, h("p", { class: "suave", style: { margin: "0 0 10px" }, text: "Los proyectos se guardan automáticamente en este navegador." }), cont, opciones),
    botones: [{ texto: "Cerrar", valor: null }],
  });
  cerrar = () => { const d = document.querySelector("dialog.dialogo[open]"); d?.close(); d?.remove(); };
  await p;
  urls.forEach((u) => URL.revokeObjectURL(u));
}

export function cargando(texto) {
  const barra = h("div", { class: "progreso" }, h("div", { style: { width: "100%" } }));
  const capa = h("div", { class: "cargando-global" }, h("div", {}, h("span", { text: texto }), barra));
  document.body.append(capa);
  return capa;
}
