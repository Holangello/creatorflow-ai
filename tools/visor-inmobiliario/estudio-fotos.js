// Paso 1 · Fotos 360: subida, procesado en Web Worker (8192 / 4096 / 512), nombres y orden de la visita.
import { dimensiones } from "./estudio-util.js";
import { app, h, $, icono, cambiar, emitir, on, toast, dialogo, confirmar, guardarArchivo, urlDe, idLibre, elegirArchivos,
  textoDe, colocado, pano, fmtMB, calcularEnlaces } from "./estudio-nucleo.js";
import { campoTexto } from "./estudio-campos.js";

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

export function nombreSugerido(archivo, i) {
  const base = archivo.replace(/\.[^.]+$/, "");
  if (/^(dji|img|pano|dsc|osmo|vid|r00|pxl|gopr|insp|lrv|cam)[\W_]*\d/i.test(base) || /^[\d\W_]+$/.test(base)) return `Estancia ${i}`;
  const t = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").replace(/^\d+\s+/, "").trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : `Estancia ${i}`;
}

/** Añade fotos 360 al proyecto (validación 2:1 y procesado). */
export async function anadirFotos(archivos, { render = false } = {}) {
  const fotos = archivos.filter((f) => /^image\//.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name));
  if (!fotos.length) return;
  const info = await Promise.all(fotos.map(async (f) => ({ f, dim: await dimensiones(f).catch(() => null) })));
  const raras = info.filter(({ dim }) => dim && Math.abs(dim.w / dim.h - 2) > 0.02);
  let aceptadas = info;
  if (raras.length) {
    const lista = h("ul", {}, raras.map(({ f, dim }) => h("li", {}, `${f.name}: ${dim.w}×${dim.h} (relación ${(dim.w / dim.h).toFixed(2)}:1)`)));
    const r = await dialogo({
      titulo: raras.length === 1 ? "Esta foto no parece 360°" : `${raras.length} fotos no parecen 360°`,
      texto: "Las fotos 360 equirectangulares tienen proporción 2:1 (p. ej. 15520×7760 en el Osmo 360). Si es una foto normal o un panorama recortado, el visor la deformará.",
      cuerpo: lista,
      botones: [{ texto: "Omitir esas fotos", valor: "omitir", primario: true }, { texto: "Añadir igualmente", valor: "todas" }],
    });
    if (!r) return;
    if (r === "omitir") aceptadas = info.filter((x) => !raras.includes(x));
  }
  for (const { f, dim } of aceptadas) {
    const n = app.tour.panoramas.length + cola.filter((x) => x.estado === "espera" || x.estado === "procesando").length + 1;
    const nombre = nombreSugerido(f.name, n);
    encolar({
      nombre: f.name, estado: "espera", progreso: 0, fase: "En cola",
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
          t.panoramas.push({
            id, nombre: { es: nombre }, planta: app.planta ?? t.plantas[0]?.id,
            imagen: `panos/${id}.jpg`, imagen_movil: rutaMovil, miniatura: `panos/mini/${id}.jpg`, yaw: 0,
          });
          t._estudio.meta[`panos/${id}.jpg`] = { w: r.original.w, h: r.original.h, archivo: f.name, bytes: f.size, ...(render ? { render: true } : {}) };
          if (!t.inicio) t.inicio = id;
        });
        if (!app.nodo) { app.nodo = id; emitir("nodo", {}); }
      },
    });
    void dim;
  }
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
  const elegir = async () => anadirFotos(await elegirArchivos({ aceptar: "image/jpeg,image/png,image/webp", multiple: true }));
  const cab = h("div", { class: "cab-seccion" },
    h("div", {}, h("h1", { text: "Fotos 360" }),
      h("p", { text: "Arrastra las fotos equirectangulares del Osmo 360 (JPG 2:1). Se optimizan en tu ordenador y se les quita la ubicación GPS. El orden de la lista es el de la visita guiada." })),
    t.panoramas.length ? h("div", { class: "acciones" }, h("button", { class: "btn primario", onclick: elegir }, icono("mas", 16), "Añadir fotos")) : null);
  const zonaSoltar = (el) => {
    el.addEventListener("dragover", (e) => { if ([...e.dataTransfer.types].includes("Files")) { e.preventDefault(); el.classList.add("sobre"); } });
    el.addEventListener("dragleave", () => el.classList.remove("sobre"));
    el.addEventListener("drop", () => el.classList.remove("sobre"));
    return el;
  };
  const partes = [cab];
  if (!t.panoramas.length && !cola.length) {
    partes.push(zonaSoltar(h("div", { class: "vacio-grande" },
      icono("fotos", 42),
      h("h3", { text: "Empieza con las fotos 360 del inmueble" }),
      h("p", { text: "Una foto por estancia, tomada a 1,5 m de altura en el centro de cada espacio. Puedes soltar aquí varias a la vez, un ZIP exportado antes o una carpeta con tour.json." }),
      h("div", { class: "fila", style: { justifyContent: "center" } },
        h("button", { class: "btn primario grande", onclick: elegir }, icono("subir", 18), "Elegir fotos"),
        h("button", { class: "btn grande", onclick: () => emitir("abrir") }, icono("abrir", 18), "Abrir proyecto")),
      h("small", { class: "tenue", text: "Se generan 3 tamaños: 8192 px (ordenador), 4096 px (móvil) y 512 px (galería). Hasta 120 MP por foto." }),
    )));
  } else {
    partes.push(zonaSoltar(h("div", { class: "zona-soltar" }, icono("subir", 22),
      h("div", { class: "relleno" }, h("b", { text: "Suelta más fotos aquí" }), h("div", { class: "tenue", text: "Arrastra las filas para cambiar el orden de la visita." })),
      h("button", { class: "btn", onclick: elegir }, "Elegir…"))));
  }
  partes.push(pintarCola());
  if (t.panoramas.length) partes.push(pintarLista());
  raiz.replaceChildren(...partes);
}
function pintarCola() {
  const c = h("div", { class: "cola", id: "cola-fotos" });
  for (const x of cola) {
    const barra = h("div", {}, null);
    barra.style.width = `${Math.round((x.progreso ?? 0) * 100)}%`;
    x.el = barra;
    x.elFase = h("span", { class: x.estado === "error" ? "chip error" : "tenue", text: x.estado === "error" ? `Error: ${x.error}` : x.estado === "hecho" ? "Listo" : x.fase ?? "" });
    c.append(h("div", { class: "item-cola" }, h("span", { text: x.nombre }), x.elFase, h("div", { class: "progreso" }, barra)));
  }
  return c;
}
on("cola", () => { if (app.seccion === "fotos") { const c = $("#cola-fotos"); if (c) c.replaceWith(pintarCola()); } });
on("progreso", (t) => { if (t.el) t.el.style.width = `${Math.round(t.progreso * 100)}%`; if (t.elFase) t.elFase.textContent = t.fase ?? ""; });

function pintarLista() {
  const t = app.tour;
  const { vecinos } = calcularEnlaces();
  const lista = h("div", { class: "lista-fotos", role: "list" });
  let arrastrado = null;
  t.panoramas.forEach((p, i) => {
    const meta = t._estudio.meta[p.imagen];
    const ratio = meta ? meta.w / meta.h : 2;
    const planta = t.plantas.find((x) => x.id === p.planta);
    const chips = [
      h("span", { class: "chip", text: `#${i + 1}` }),
      meta ? h("span", { class: `chip ${Math.abs(ratio - 2) > 0.02 ? "error" : ""}`, text: `${meta.w}×${meta.h}${meta.bytes ? " · " + fmtMB(meta.bytes) : ""}`, title: Math.abs(ratio - 2) > 0.02 ? "No es 2:1" : "Equirectangular 2:1" }) : null,
      colocado(p) ? h("span", { class: "chip ok", text: t.plantas.length > 1 ? `En plano · ${textoDe(planta?.nombre)}` : "En plano" })
        : h("button", { class: "chip aviso", style: { border: 0, cursor: "pointer" }, text: "Sin colocar en el plano", onclick: () => emitir("ir", { seccion: "plano" }) }),
      colocado(p) && !(vecinos.get(p.id)?.length) && t.panoramas.length > 1 ? h("span", { class: "chip error", text: "Sin enlaces" }) : null,
      p.variantes?.length ? h("span", { class: "chip acento", text: `${p.variantes.length} variantes` }) : null,
      p.puntos?.length ? h("span", { class: "chip", text: `${p.puntos.length} puntos` }) : null,
      meta?.render ? h("span", { class: "chip acento", text: "Render 360" }) : null,
    ];
    const inicio = (t.inicio ?? t.panoramas[0].id) === p.id;
    const fila = h("div", { class: `foto ${p.id === app.nodo ? "sel" : ""}`, role: "listitem", draggable: "true", dataset: { id: p.id } },
      h("span", { class: "asa", title: "Arrastra para reordenar" }, icono("arrastrar", 16)),
      h("img", { class: "mini", src: urlDe(p.miniatura || p.imagen_movil || p.imagen), alt: "", loading: "lazy", draggable: "false",
        title: "Ver en la vista previa", onclick: () => { app.nodo = p.id; emitir("nodo", {}); marcarSel(); } }),
      h("div", { class: "info" },
        campoTexto(() => pano(p.id), "nombre", { etiqueta: `Nombre de la estancia ${i + 1}`, compacto: true, tipo: "datos", placeholder: "Nombre de la estancia",
          alCambiar: () => emitir("nombres") }),
        h("div", { class: "meta" }, chips)),
      h("div", { class: "acc" },
        h("button", { class: `btn fantasma icono-btn btn-estrella ${inicio ? "activo" : ""}`, title: inicio ? "Estancia inicial del recorrido" : "Empezar el recorrido aquí", "aria-label": "Estancia inicial", "aria-pressed": String(inicio),
          onclick: () => cambiar((tt) => { tt.inicio = p.id; }) }, icono("estrella", 17)),
        h("button", { class: "btn fantasma icono-btn", title: "Eliminar foto", "aria-label": "Eliminar foto", onclick: async () => {
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
  return h("div", {}, lista, h("p", { class: "tenue", style: { fontSize: "12.5px", marginTop: "10px" } }, "Consejo: con el cursor en un nombre, ", h("kbd", { text: "Alt" }), " + ", h("kbd", { text: "↑" }), h("kbd", { text: "↓" }), " mueve la foto."));
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
    const fotos = lista.filter(({ archivo }) => /\.(jpe?g|png|webp)$/i.test(archivo.name));
    if (fotos.length && fotos.length === lista.length) { await anadirFotos(fotos.map((f) => f.archivo)); return true; }
    return false;
  },
};
