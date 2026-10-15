// Paso 1 · Fotos 360: subida, procesado en Web Worker (8192 / 4096 / 512), nombres (también los de la Guía Osmo 360)
// y orden de la visita.
import { dimensiones, leerMetadatos, describirCamara, fechaExif, norm180 } from "./estudio-util.js";
import { app, h, $, icono, cambiar, emitir, on, toast, dialogo, confirmar, guardarArchivo, urlDe, idLibre, elegirArchivos,
  textoDe, fijarTexto, colocado, pano, fmtMB, calcularEnlaces, tienePlano, VIDRIO } from "./estudio-nucleo.js";
import { campoTexto } from "./estudio-campos.js";
import { avisoPerfil } from "./estudio-perfil.js";

// ------------------------------------------------------------------ procesado (Worker con alternativa en el hilo principal)
let worker = null, sinWorker = false, seq = 0;
const pendientes = new Map();
function obtenerWorker() {
  if (worker || sinWorker) return worker;
  try {
    worker = new Worker(new URL("./estudio-worker.js", import.meta.url), { type: "module" });
    worker.onmessage = ({ data }) => {
      const p = pendientes.get(data.id);
      if (!p) return;
      if (data.progreso != null) return p.progreso?.(data.progreso, data.fase);
      pendientes.delete(data.id);
      data.ok ? p.ok(data.resultado) : p.mal(new Error(data.error));
    };
    worker.onerror = (e) => { console.warn("Worker no disponible", e); sinWorker = true; worker = null; for (const p of pendientes.values()) p.reintentar(); pendientes.clear(); };
  } catch { sinWorker = true; }
  return worker;
}
/** Procesa una imagen → { original: {w,h}, salidas: [{ancho, alto, blob}] } */
export function procesar(blob, opciones, progreso) {
  const enHilo = async () => {
    const { procesarImagen } = await import("./estudio-worker.js");
    return procesarImagen(blob, opciones, progreso);
  };
  const w = typeof OffscreenCanvas !== "undefined" ? obtenerWorker() : null;
  if (!w) return enHilo();
  return new Promise((ok, mal) => {
    const id = ++seq;
    pendientes.set(id, { ok, mal, progreso, reintentar: () => enHilo().then(ok, mal) });
    w.postMessage({ id, blob, opciones });
  });
}

// Cola secuencial: las fotos de 120 MP se procesan de una en una para no agotar la memoria.
const cola = [];
let procesando = false;
app.cola = cola;
/** ¿Se están importando fotos (o versiones de una foto)? Mientras tanto, cerrar la pestaña pregunta antes (estudio.js). */
app.importando = () => cola.some((x) => x.foto && (x.estado === "espera" || x.estado === "procesando")) || (app.procesandoVariantes ?? 0) > 0;
function encolar(tarea) {
  cola.push(tarea);
  emitir("cola");
  if (!procesando) siguiente();
}
async function siguiente() {
  const t = cola.find((x) => x.estado === "espera");
  if (!t) { procesando = false; if (cola.every((x) => x.estado !== "espera")) setTimeout(() => { if (!procesando) { cola.splice(0, cola.length, ...cola.filter((x) => x.estado === "error")); emitir("cola"); } }, 1500); return; }
  procesando = true;
  t.estado = "procesando";
  emitir("cola");
  try { await t.ejecutar((v, fase) => { t.progreso = v; t.fase = fase; emitir("progreso", t); }); t.estado = "hecho"; t.progreso = 1; }
  catch (e) { console.error(e); t.estado = "error"; t.error = e.message; toast(`${t.nombre}: ${e.message}`, "error", 6000); }
  emitir("cola");
  siguiente();
}

// Palabras habituales que los nombres de archivo pierden sin tilde (salon.jpg → «Salón»).
const TILDES = { salon: "salón", salones: "salones", bano: "baño", banos: "baños", habitacion: "habitación", habitaciones: "habitaciones",
  jardin: "jardín", atico: "ático", balcon: "balcón", galeria: "galería", solarium: "solárium", sotano: "sótano", almacen: "almacén",
  comun: "común", comunes: "comunes", dia: "día", lavanderia: "lavandería", recepcion: "recepción", porteria: "portería", calefaccion: "calefacción",
  cocina: "cocina", dormitorio: "dormitorio", vestibulo: "vestíbulo", cubierta: "cubierta", estudio: "estudio", minimo: "mínimo", camara: "cámara" };
export function nombreSugerido(archivo, i) {
  const base = archivo.replace(/\.[^.]+$/, "");
  if (/^(dji|img|pano|dsc|osmo|vid|r00|pxl|gopr|insp|lrv|cam)[\W_]*\d/i.test(base) || /^[\d\W_]+$/.test(base)) return `Estancia ${i}`;
  const t = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").replace(/^\d+\s+/, "").trim()
    .split(" ").map((w) => TILDES[w.toLowerCase()] ?? w).join(" ");
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : `Estancia ${i}`;
}

// ------------------------------------------------------------------ nombres de la Guía Osmo 360 (S-10 · E12)
// La Guía envía su lista por enlace: estudio.html#fotos&estancias=<n1>,<n2>…&tomas=<n1>:<k1>,… (cada nombre con
// encodeURIComponent; las comas separan). Respaldo: la lista guardada por la Guía en este navegador
// (localStorage «cre8eight:asistente»). El Estudio la enseña («Usar · No usar») y la consume: deja de ofrecerla al decidir.
const MAX_ESTANCIAS = 60, MAX_TOMAS = 20, MAX_NOMBRE = 80;
const CLAVE_GUIA = "cre8eight:asistente", CLAVE_USADA = "cre8eight:guia-usada";
const decodificar = (s) => { try { return decodeURIComponent(s).replace(/\s+/g, " ").trim().slice(0, MAX_NOMBRE); } catch { return ""; } };
const unicos = (xs) => [...new Set(xs.filter(Boolean))].slice(0, MAX_ESTANCIAS);

/** Lista del enlace de la Guía → { estancias: [...], tomas: { nombre: n } } | null (lo raro se ignora sin romper nada). */
export function listaDeEnlace(hash = location.hash) {
  const partes = String(hash).replace(/^#/, "").split("&").slice(1);
  const param = (k) => partes.find((x) => x.startsWith(`${k}=`))?.slice(k.length + 1);
  const crudo = param("estancias");
  if (crudo == null) return null;
  const estancias = unicos(crudo.split(",").map(decodificar));
  if (!estancias.length) return null;
  const tomas = {};
  for (const par of (param("tomas") ?? "").split(",")) {
    const i = par.lastIndexOf(":");
    if (i <= 0) continue;
    const nombre = decodificar(par.slice(0, i)), k = Number(par.slice(i + 1));
    if (estancias.includes(nombre) && Number.isInteger(k) && k >= 1) tomas[nombre] = Math.min(k, MAX_TOMAS);
  }
  return { estancias, tomas };
}
function listaLocal() {
  let a;
  try { a = JSON.parse(localStorage.getItem(CLAVE_GUIA) ?? "null"); } catch { return null; }
  if (!a || typeof a !== "object" || !Array.isArray(a.estancias)) return null;
  const estancias = unicos(a.estancias.map((x) => (typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, MAX_NOMBRE) : "")));
  if (!estancias.length) return null;
  const t0 = a.tomas && typeof a.tomas === "object" && !Array.isArray(a.tomas) ? a.tomas : {};
  const tomas = {};
  for (const n of estancias) if (Number.isInteger(t0[n]) && t0[n] >= 1) tomas[n] = Math.min(t0[n], MAX_TOMAS);
  return { estancias, tomas };
}
/** { estancias: ["Salón", "Cocina"], tomas: { Cocina: 2 } } → ["Salón", "Cocina", "Cocina 2"] (orden de disparo). */
export function expandirLista({ estancias, tomas }) {
  const r = [];
  for (const n of estancias) for (let i = 1; i <= (tomas[n] ?? 1); i++) r.push(i === 1 ? n : `${n} ${i}`);
  return r;
}
const firmaLista = (l) => JSON.stringify([l.estancias, l.tomas]);
const usada = (l) => { try { return localStorage.getItem(CLAVE_USADA) === firmaLista(l); } catch { return false; } };
// La lista guardada en el navegador solo se ofrece a un proyecto que estaba vacío al abrirlo (también después de subir
// sus primeras fotos, p. ej. si la Guía se terminó en otra pestaña): nunca a un inmueble antiguo que ya tenía fotos.
let vacioAlAbrir = null;
on("proyecto", () => { vacioAlAbrir = app.tour.panoramas.length ? null : app.proyecto?.id; });
addEventListener("storage", (e) => { if (e.key === CLAVE_GUIA && app.tour && app.seccion === "fotos") pintar(); });
/** Lista que hay que ofrecer ahora: la del enlace o, si no hay, la guardada por la Guía en este navegador. */
function ofertaGuia() {
  const enlace = listaDeEnlace();
  if (enlace) return { lista: enlace, origen: "enlace" };
  const local = listaLocal();
  const nuevo = !app.tour.panoramas.length || (vacioAlAbrir != null && vacioAlAbrir === app.proyecto?.id);
  return local && nuevo && !usada(local) && !app.tour._estudio.nombresGuia?.length ? { lista: local, origen: "local" } : null;
}
/** Tras «Usar» o «No usar»: no se vuelve a ofrecer (ni al recargar ni en el siguiente proyecto). */
function resolverOferta(oferta) {
  try { localStorage.setItem(CLAVE_USADA, firmaLista(oferta.lista)); } catch { /* modo privado: basta con limpiar el enlace */ }
  const [paso, ...resto] = location.hash.replace(/^#/, "").split("&");
  const quedan = resto.filter((x) => !/^(estancias|tomas)=/.test(x));
  history.replaceState(null, "", `${location.pathname}${location.search}#${[paso || app.seccion, ...quedan].join("&")}`);
}
function usarLista(oferta) {
  const nombres = expandirLista(oferta.lista);
  const n = Math.min(app.tour.panoramas.length, nombres.length);
  cambiar((t) => {
    for (let i = 0; i < n; i++) fijarTexto(t.panoramas[i], "nombre", "es", nombres[i]);
    const resto = nombres.slice(n);
    if (resto.length) t._estudio.nombresGuia = resto; else delete t._estudio.nombresGuia;
  });
  resolverOferta(oferta);
  toast(n ? `Nombres de la Guía puestos a ${n} ${n === 1 ? "foto" : "fotos"}, en el orden de la lista. Puedes cambiarlos (o deshacerlo con Ctrl+Z).`
    : "Las fotos que añadas tomarán estos nombres, en orden de disparo. Puedes cambiarlos después.", "ok", 6000);
  emitir("nombres");
  pintar();
}
function avisoGuia() {
  const oferta = ofertaGuia();
  if (!oferta) return null;
  const nombres = expandirLista(oferta.lista);
  const resumen = oferta.lista.estancias.slice(0, 8).map((n) => (oferta.lista.tomas[n] > 1 ? `${n} (${oferta.lista.tomas[n]})` : n)).join(", ")
    + (oferta.lista.estancias.length > 8 ? `… (${nombres.length} en total)` : "");
  const conFotos = app.tour.panoramas.length, tus = (k) => (k === 1 ? "tu foto" : `tus ${k} fotos`);
  const nota = !conFotos ? "Se pondrán a las fotos que añadas, en orden de disparo."
    : nombres.length > conFotos ? `Se pondrán a ${tus(conFotos)} en orden; el resto, a las fotos que añadas.`
    : nombres.length === conFotos ? `Se pondrán a ${tus(conFotos)}, en el orden de la lista.`
    : `Se pondrán a ${nombres.length === 1 ? "la primera foto" : `las ${nombres.length} primeras fotos`}, en el orden de la lista.`;
  return h("div", { class: "aviso-c8 aviso-guia", role: "region", "aria-label": "Nombres de tu Guía" },
    h("span", { class: "aviso-icono" }, icono("guia", 20)),
    h("div", { class: "aviso-texto" }, h("b", { text: "Nombres de tu Guía: " }), h("span", { text: resumen }),
      h("small", { class: "c8-sec", text: nota })),
    h("div", { class: "aviso-acciones" },
      h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", onclick: () => usarLista(oferta) }, "Usar"),
      h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--s", onclick: () => { resolverOferta(oferta); pintar(); } }, "No usar")));
}
on("hash", () => { if (app.seccion === "fotos") pintar(); });
const EXT_VIDEO = /\.(osv|insv|mp4|mov|m4v|lrv)$/i;

export function avisoVideo(nombres) {
  return dialogo({
    titulo: "Esto es vídeo 360",
    texto: `${nombres.slice(0, 3).join(", ")}${nombres.length > 3 ? "…" : ""}: los archivos .OSV de la Osmo 360 (y los MP4/MOV) son vídeo, no fotos.`,
    cuerpo: h("div", { class: "suave" },
      h("ol", { class: "dialogo-lista" },
        h("li", {}, "Ábrelo en ", h("b", { text: "DJI Studio" }), " (ordenador) o ", h("b", { text: "DJI Mimo" }), " (móvil)."),
        h("li", {}, "Expórtalo como ", h("b", { text: "MP4 equirectangular 8K" }), " (proyección 360, sin reencuadre)."),
        h("li", {}, "Úsalo para entrenar un Gaussian Splat del paseo libre (Postshot, Brush, RealityScan) o extrae fotogramas con extraer_fotogramas.py.")),
      h("p", { class: "texto-sec" }, "Para el recorrido 360 usa el modo ", h("b", { text: "Foto panorámica" }), " de la cámara (JPG 15520×7760). ", h("a", { href: "asistente-osmo.html#paseo-libre", target: "_blank", rel: "noopener", text: "Guía Osmo 360" }))),
    botones: [{ texto: "Entendido", primario: true }],
  });
}

/** Añade fotos 360 al proyecto: lee EXIF/XMP (Osmo 360), valida 2:1, ordena por hora de disparo y procesa. */
export async function anadirFotos(archivos, { render = false } = {}) {
  const videos = archivos.filter((f) => EXT_VIDEO.test(f.name) || /^video\//.test(f.type));
  if (videos.length) await avisoVideo(videos.map((f) => f.name));
  const fotos = archivos.filter((f) => !EXT_VIDEO.test(f.name) && (/^image\//.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name)));
  if (!fotos.length) return;
  const info = await Promise.all(fotos.map(async (f) => ({ f, dim: await dimensiones(f).catch(() => null), exif: await leerMetadatos(f).catch(() => null) })));
  // Orden de disparo (EXIF DateTimeOriginal) = orden de la visita guiada; sin fecha, por nombre.
  info.sort((a, b) => (fechaExif(a.exif?.fecha) ?? Infinity) - (fechaExif(b.exif?.fecha) ?? Infinity) || a.f.name.localeCompare(b.f.name, "es", { numeric: true }));
  const raras = info.filter(({ dim }) => dim && Math.abs(dim.w / dim.h - 2) > 0.02);
  let aceptadas = info;
  if (raras.length) {
    const lista = h("ul", { class: "dialogo-lista" }, raras.map(({ f, dim, exif }) => h("li", {}, `${f.name}: ${dim.w}×${dim.h} (relación ${(dim.w / dim.h).toFixed(2)}:1)${/dji/i.test(exif?.marca ?? "") ? " · DJI" : ""}`)));
    const r = await dialogo({
      titulo: raras.length === 1 ? "Esta foto no parece una 360 completa" : `${raras.length} fotos no parecen 360 completas`,
      texto: "Esta foto no parece una 360 completa. Expórtala desde DJI Mimo como “Foto panorámica 360”. Si la añades así, el visor la deformará.",
      cuerpo: h("div", {}, lista, h("div", { class: "texto-sec" },
        h("p", { class: "texto-sec" }, h("b", { text: "¿Cómo exportarla bien desde la Osmo 360?" })),
        h("ul", { class: "dialogo-lista" },
          h("li", { text: "Si ves dos círculos (ojo de pez doble), está sin coser: ábrela en DJI Mimo o DJI Studio y exporta «Foto panorámica 360» (equirectangular)." }),
          h("li", { text: "Si es una foto recortada o con efecto “planeta”, vuelve a exportarla desde DJI Mimo como “Foto panorámica 360”, sin reencuadrar." }),
          h("li", { text: "Una foto normal (móvil, réflex) súbela a la galería en «Más herramientas → Extras», no como estancia 360." })),
        h("p", { class: "texto-sec" }, h("a", { href: "asistente-osmo.html#problemas", target: "_blank", rel: "noopener", text: "Problemas frecuentes en la Guía Osmo 360" })))),
      botones: [{ texto: "Omitir esas fotos", valor: "omitir", primario: true }, { texto: "Añadir igualmente", valor: "todas" }],
      ancho: "min(35rem, calc(100vw - 2rem))",
    });
    if (!r) return;
    if (r === "omitir") aceptadas = info.filter((x) => !raras.includes(x));
  }
  // Nombres de la Guía que el agente decidió usar (se consumen en orden de disparo).
  const deGuia = [...(app.tour._estudio.nombresGuia ?? [])];
  const conGuia = deGuia.length > 0;
  let conBrujula = 0;
  for (const { f, dim, exif } of aceptadas) {
    const n = app.tour.panoramas.length + cola.filter((x) => x.estado === "espera" || x.estado === "procesando").length + 1;
    const nombre = deGuia.length ? deGuia.shift() : nombreSugerido(f.name, n);
    const camara = describirCamara(exif, dim);
    const rumbo = Number.isFinite(exif?.rumbo) ? exif.rumbo : null;
    if (rumbo != null) conBrujula++;
    encolar({
      nombre: f.name, estado: "espera", progreso: 0, fase: "En cola", foto: true,
      ejecutar: async (progreso) => {
        const r = await procesar(f, { tamanos: [8192, 4096, 512], calidad: 0.85 }, progreso);
        const id = idLibre(nombre, [...app.tour.panoramas.map((p) => p.id), ...app.archivos.keys()].map((x) => x));
        const [g, m, mini] = r.salidas;
        await guardarArchivo(`panos/${id}.jpg`, g.blob);
        // Si la foto ya es ≤ 4096 px, la versión móvil es la misma imagen: no se duplica.
        const rutaMovil = m.ancho === g.ancho ? `panos/${id}.jpg` : `panos/movil/${id}.jpg`;
        if (m.ancho !== g.ancho) await guardarArchivo(rutaMovil, m.blob);
        await guardarArchivo(`panos/mini/${id}.jpg`, mini.blob);
        cambiar((t) => {
          // Orientación automática por brújula: yaw = rumbo de la cámara − norte del plano.
          const yaw = rumbo != null ? Math.round(norm180(rumbo - (t.norte ?? 0)) * 10) / 10 : 0;
          t.panoramas.push({
            id, nombre: { es: nombre }, planta: app.planta ?? t.plantas[0]?.id,
            imagen: `panos/${id}.jpg`, imagen_movil: rutaMovil, miniatura: `panos/mini/${id}.jpg`, yaw,
            ...(render ? { origen: "render" } : {}),
          });
          t._estudio.meta[`panos/${id}.jpg`] = { w: r.original.w, h: r.original.h, archivo: f.name, bytes: f.size,
            ...(render ? { render: true } : {}), ...(camara ? { camara } : {}), ...(exif?.fecha ? { fecha: exif.fecha } : {}),
            ...(rumbo != null ? { brujula: rumbo, brujulaFuente: exif.rumboFuente } : {}), ...(r.limitado ? { limitado: true } : {}) };
          if (!t.inicio) t.inicio = id;
        });
        if (!app.nodo) { app.nodo = id; emitir("nodo", {}); }
        if (r.limitado) toast("Este dispositivo limita el tamaño de imagen: la foto se guardó a menor resolución. Prepárala en un ordenador para 8K.", "aviso", 7000);
      },
    });
    void dim;
  }
  if (conGuia && aceptadas.length) {
    cambiar((t) => { if (deGuia.length) t._estudio.nombresGuia = deGuia; else delete t._estudio.nombresGuia; }, { tipo: "local" });
    toast("Nombres tomados de tu Guía Osmo 360 (en orden de disparo). Puedes cambiarlos.", "info", 5000);
  }
  if (conBrujula) toast(`Orientación automática por brújula en ${conBrujula} ${conBrujula === 1 ? "foto" : "fotos"}.`, "info", 5000);
}

/** Para tours importados: genera miniatura / versión móvil si faltan y guarda dimensiones. */
export async function generarDerivadosFaltantes() {
  for (const p of app.tour.panoramas) {
    const b = app.archivos.get(p.imagen);
    if (!b) continue;
    const faltaMini = !p.miniatura || !app.archivos.has(p.miniatura);
    const faltaMovil = !p.imagen_movil || !app.archivos.has(p.imagen_movil);
    if (!app.tour._estudio.meta[p.imagen]) {
      const d = await dimensiones(b).catch(() => null);
      if (d) app.tour._estudio.meta[p.imagen] = { w: d.w, h: d.h };
    }
    if (!faltaMini && !faltaMovil) continue;
    const id = p.id;
    encolar({
      nombre: `${textoDe(p.nombre) || id} (miniaturas)`, estado: "espera", progreso: 0, fase: "En cola",
      ejecutar: async (progreso) => {
        const tam = faltaMovil ? [4096, 512] : [512];
        const r = await procesar(b, { tamanos: tam, calidad: 0.85 }, progreso);
        const cambios = {};
        if (faltaMovil) { cambios.imagen_movil = `panos/movil/${id}.jpg`; await guardarArchivo(cambios.imagen_movil, r.salidas[0].blob); }
        cambios.miniatura = `panos/mini/${id}.jpg`;
        await guardarArchivo(cambios.miniatura, r.salidas.at(-1).blob);
        cambiar(() => { const q = pano(id); if (q) Object.assign(q, cambios); }, { tipo: "local" });
      },
    });
  }
}

// ------------------------------------------------------------------ sección
function borrarFoto(id) {
  cambiar((t) => {
    t.panoramas = t.panoramas.filter((p) => p.id !== id);
    t._estudio.manuales = t._estudio.manuales.filter((k) => !k.split("|").includes(id));
    t._estudio.quitados = t._estudio.quitados.filter((k) => !k.split("|").includes(id));
    if (t.guion) t.guion = t.guion.filter((g) => g.nodo !== id);
    if (t.inicio === id) t.inicio = t.panoramas[0]?.id;
  });
  if (app.nodo === id) { app.nodo = app.tour.panoramas[0]?.id ?? null; emitir("nodo", {}); }
}

let raiz = null;
function render(cont) {
  raiz = h("section", { class: "seccion" });
  cont.append(raiz);
  pintar();
}
function pintar() {
  if (!raiz) return;
  const t = app.tour;
  const elegir = async () => anadirFotos(await elegirArchivos({ aceptar: "image/jpeg,image/png,image/webp,.osv,.insv,video/*", multiple: true }));
  const vacio = !t.panoramas.length && !cola.length;
  const cab = h("div", { class: "cab-seccion" },
    h("div", {}, h("h1", { text: "Fotos 360" }),
      h("p", { text: vacio ? "Las fotos panorámicas de la DJI Osmo 360 (JPG 2:1). Se optimizan en tu ordenador, se les quita la ubicación GPS y se ordenan por hora de disparo."
        : "El orden de la lista es el de la visita guiada. Cámbialo con ↑ ↓ o arrastrando las filas." })),
    t.panoramas.length ? h("div", { class: "acciones" }, h("button", { type: "button", class: "c8-boton c8-boton--secundario", onclick: elegir }, icono("mas", 16), "Añadir fotos")) : null);
  const zonaSoltar = (el) => {
    el.addEventListener("dragover", (e) => { if ([...e.dataTransfer.types].includes("Files")) { e.preventDefault(); el.classList.add("sobre"); } });
    el.addEventListener("dragleave", () => el.classList.remove("sobre"));
    el.addEventListener("drop", () => el.classList.remove("sobre"));
    return el;
  };
  const partes = [cab, avisoGuia()];
  if (vacio) {
    // Primera visita (S-3): un solo botón principal y una sola entrada a la Guía.
    partes.push(zonaSoltar(h("div", { class: `vacio-grande ${VIDRIO}` },
      icono("fotos", 42),
      h("h3", { text: "Empieza con las fotos 360 del inmueble" }),
      h("p", { text: "Una foto por estancia, a 1,5 m de altura en el centro de cada espacio. Puedes soltar aquí varias a la vez (o una copia de seguridad en ZIP)." }),
      h("button", { type: "button", class: "c8-boton c8-boton--primario c8-boton--l", onclick: elegir }, icono("subir", 18), "Elegir fotos"),
      h("a", { class: "enlace-guia", href: "asistente-osmo.html", target: "_blank", rel: "noopener" }, icono("guia", 16), "¿Aún no tienes las fotos? Guía Osmo 360"))),
    avisoPerfil());
  } else {
    partes.push(zonaSoltar(h("div", { class: "zona-soltar" }, icono("subir", 22),
      h("div", { class: "relleno" }, h("b", { text: "Suelta más fotos aquí" }), h("div", { class: "texto-sec", text: "También una copia de seguridad (ZIP)." })))));
  }
  partes.push(pintarCola());
  if (t.panoramas.length) partes.push(pintarLista());
  const pendientes = t._estudio.nombresGuia ?? [];
  if (pendientes.length) partes.push(h("p", { class: "nota-fotos" }, h("b", { text: "Nombres de tu Guía para las próximas fotos: " }),
    pendientes.slice(0, 6).join(", ") + (pendientes.length > 6 ? `… (${pendientes.length})` : ""), " · ",
    h("button", { class: "enlace", onclick: () => cambiar((tt) => { delete tt._estudio.nombresGuia; }, { tipo: "local" }) }, "No usarlos")));
  if (!vacio) partes.push(h("p", { class: "nota-fotos" }, "¿Tienes renders 360 del arquitecto (obra nueva)? ",
    h("button", { class: "enlace", onclick: async () => anadirFotos(await elegirArchivos({ aceptar: "image/jpeg,image/png,image/webp", multiple: true }), { render: true }) }, "Añádelos como estancias"),
    ". Como estilo de una foto, en «Más herramientas → Estilo y luz»."));
  raiz.replaceChildren(...partes.filter(Boolean));
}
function pintarCola() {
  const c = h("div", { class: "cola", id: "cola-fotos" });
  for (const x of cola) {
    const barra = h("div", {}, null);
    barra.style.width = `${Math.round((x.progreso ?? 0) * 100)}%`;
    x.el = barra;
    x.elFase = h("span", { class: x.estado === "error" ? "chip error" : "texto-pie", text: x.estado === "error" ? `Error: ${x.error}` : x.estado === "hecho" ? "Listo" : x.fase ?? "" });
    c.append(h("div", { class: "item-cola" }, h("span", { text: x.nombre }), x.elFase, h("div", { class: "progreso" }, barra)));
  }
  return c;
}
on("cola", () => { if (app.seccion === "fotos") { const c = $("#cola-fotos"); if (c) c.replaceWith(pintarCola()); } });
on("progreso", (t) => { if (t.el) t.el.style.width = `${Math.round(t.progreso * 100)}%`; if (t.elFase) t.elFase.textContent = t.fase ?? ""; });

function pintarLista() {
  const t = app.tour;
  const { vecinos } = calcularEnlaces();
  const lista = h("div", { class: `lista-fotos ${VIDRIO}`, role: "list" });
  let arrastrado = null;
  const conPlano = t.panoramas.some(colocado) || tienePlano(t);
  const subirBajar = (p, i, d) => {
    const j = i + d;
    if (j < 0 || j >= t.panoramas.length) return;
    mover(p.id, t.panoramas[j].id, d > 0);
    requestAnimationFrame(() => raiz?.querySelector(`.foto[data-id="${p.id}"] [data-orden="${d > 0 ? "bajar" : "subir"}"]`)?.focus());
  };
  t.panoramas.forEach((p, i) => {
    const meta = t._estudio.meta[p.imagen];
    const ratio = meta ? meta.w / meta.h : 2;
    const planta = t.plantas.find((x) => x.id === p.planta);
    const no2a1 = meta && Math.abs(ratio - 2) > 0.02;
    const chips = [
      h("span", { class: "chip", text: `#${i + 1}` }),
      no2a1 ? h("span", { class: "chip error", text: `No es 360 completa (${meta.w}×${meta.h})`, title: "Las fotos 360 son el doble de anchas que de altas (2:1)" }) : null,
      !conPlano ? null : colocado(p) ? h("span", { class: "chip ok", text: t.plantas.length > 1 ? `En el plano · ${textoDe(planta?.nombre)}` : "En el plano" })
        : h("button", { type: "button", class: "chip aviso", text: "Sin colocar en el plano", onclick: () => emitir("ir", { seccion: "plano" }) }),
      colocado(p) && !(vecinos.get(p.id)?.length) && t.panoramas.length > 1 ? h("span", { class: "chip error", text: "Sin conectar" }) : null,
      p.variantes?.length ? h("span", { class: "chip acento", text: `${p.variantes.length} ${p.variantes.length === 1 ? "variante" : "variantes"}` }) : null,
      p.puntos?.length ? h("span", { class: "chip", text: `${p.puntos.length} ${p.puntos.length === 1 ? "nota" : "notas"}` }) : null,
      meta?.render || p.origen === "render" ? h("span", { class: "chip acento", text: "Render 360" }) : null,
      conPlano && meta?.brujula != null && !meta.brujulaRevisada ? h("button", { type: "button", class: "chip aviso", text: "Orientación por brújula: revísala",
        title: `${meta.brujulaFuente ?? "XMP"} = ${meta.brujula}°`, onclick: () => { app.nodo = p.id; emitir("nodo", {}); emitir("ir", { seccion: "orientacion" }); } }) : null,
    ];
    const tecnico = meta ? [meta.camara, `${meta.w}×${meta.h}`, meta.bytes ? fmtMB(meta.bytes) : null, meta.fecha ? `disparada el ${meta.fecha}` : null].filter(Boolean).join(" · ") : "";
    const inicio = (t.inicio ?? t.panoramas[0].id) === p.id;
    const fila = h("div", { class: `foto ${p.id === app.nodo ? "sel" : ""}`, role: "listitem", draggable: "true", dataset: { id: p.id } },
      h("span", { class: "asa", title: "Arrastra para reordenar" }, icono("arrastrar", 16)),
      h("img", { class: "mini", src: urlDe(p.miniatura || p.imagen_movil || p.imagen), alt: "", loading: "lazy", draggable: "false",
        title: `Ver en la vista previa${tecnico ? `\n${tecnico}` : ""}`, onclick: () => { app.nodo = p.id; emitir("nodo", {}); marcarSel(); } }),
      h("div", { class: "info" },
        campoTexto(() => pano(p.id), "nombre", { etiqueta: `Nombre de la estancia ${i + 1}`, compacto: true, tipo: "datos", placeholder: "Nombre de la estancia",
          alCambiar: () => emitir("nombres") }),
        h("div", { class: "meta" }, chips)),
      h("div", { class: "acc" },
        h("div", { class: "orden-btns" },
          h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--s", "data-orden": "subir", title: "Subir en el orden de la visita", "aria-label": `Subir ${textoDe(p.nombre) || p.id}`, disabled: i === 0, onclick: () => subirBajar(p, i, -1) }, "↑"),
          h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--s", "data-orden": "bajar", title: "Bajar en el orden de la visita", "aria-label": `Bajar ${textoDe(p.nombre) || p.id}`, disabled: i === t.panoramas.length - 1, onclick: () => subirBajar(p, i, 1) }, "↓")),
        h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--icono btn-estrella", title: inicio ? "Estancia inicial del recorrido" : "Empezar el recorrido aquí", "aria-label": "Estancia inicial", "aria-pressed": String(inicio),
          onclick: () => cambiar((tt) => { tt.inicio = p.id; }) }, icono("estrella", 17)),
        h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--icono", title: "Eliminar foto", "aria-label": "Eliminar foto", onclick: async () => {
          if (await confirmar("Eliminar foto", `Se quitará «${textoDe(p.nombre) || p.id}» del recorrido (puedes deshacerlo con Ctrl+Z).`)) borrarFoto(p.id);
        } }, icono("basura", 17))));
    fila.addEventListener("dragstart", (e) => { arrastrado = p.id; fila.classList.add("arrastrando"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/x-foto", p.id); });
    fila.addEventListener("dragend", () => { arrastrado = null; fila.classList.remove("arrastrando"); lista.querySelectorAll(".foto").forEach((x) => x.classList.remove("destino-arriba", "destino-abajo")); });
    fila.addEventListener("dragover", (e) => {
      if (!arrastrado) return;
      e.preventDefault();
      const r = fila.getBoundingClientRect();
      const arriba = e.clientY < r.top + r.height / 2;
      fila.classList.toggle("destino-arriba", arriba); fila.classList.toggle("destino-abajo", !arriba);
    });
    fila.addEventListener("dragleave", () => fila.classList.remove("destino-arriba", "destino-abajo"));
    fila.addEventListener("drop", (e) => {
      if (!arrastrado) return;
      e.preventDefault(); e.stopPropagation();
      const r = fila.getBoundingClientRect();
      mover(arrastrado, p.id, e.clientY >= r.top + r.height / 2);
    });
    fila.addEventListener("keydown", (e) => {
      if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        const j = i + (e.key === "ArrowUp" ? -1 : 1);
        if (j < 0 || j >= t.panoramas.length) return;
        mover(p.id, t.panoramas[j].id, e.key === "ArrowDown");
        requestAnimationFrame(() => raiz.querySelector(`.foto[data-id="${p.id}"] input`)?.focus());
      }
    });
    lista.append(fila);
  });
  return h("div", {}, lista, h("p", { class: "nota-fotos" }, "Con el teclado: ", h("kbd", { text: "Alt" }), " + ", h("kbd", { text: "↑" }), h("kbd", { text: "↓" }), " desde un nombre."));
}
function mover(id, destino, despues) {
  if (id === destino) return;
  cambiar((t) => {
    const p = t.panoramas.find((x) => x.id === id);
    t.panoramas = t.panoramas.filter((x) => x.id !== id);
    let j = t.panoramas.findIndex((x) => x.id === destino);
    if (despues) j++;
    t.panoramas.splice(j, 0, p);
  });
}
function marcarSel() { raiz?.querySelectorAll(".foto").forEach((f) => f.classList.toggle("sel", f.dataset.id === app.nodo)); }

export const seccionFotos = {
  id: "fotos", titulo: "Fotos 360", corto: "Fotos",
  resumen: () => { const n = app.tour.panoramas.length; return { texto: n ? `${n} ${n === 1 ? "foto" : "fotos"}` : "Sube las fotos", hecho: n > 0 }; },
  render,
  actualizar: () => { if (!document.activeElement?.closest?.(".foto .info")) pintar(); },
  alCambiarNodo: marcarSel,
  salir: () => { raiz = null; },
  soltar: async (lista) => {
    const fotos = lista.filter(({ archivo }) => /\.(jpe?g|png|webp|osv|insv|mp4|mov|m4v)$/i.test(archivo.name));
    if (fotos.length && fotos.length === lista.length) { await anadirFotos(fotos.map((f) => f.archivo)); return true; }
    return false;
  },
};
