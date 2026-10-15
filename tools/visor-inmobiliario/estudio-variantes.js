// Más herramientas · Estilo y luz (S-5 · S-8 · E8 · E9): lo que el cliente puede probar en el visor.
//   Luz: fotos de noche o atardecer de cada estancia y, si el agente quiere, «noche simulada» (E8).
//   Obra nueva o proyecto: estilos de decoración generados con IA (requisito: solo en proyectos).
//   Vivienda construida: zonas de color (máscara de paredes y suelo) y paletas.
//   «Mostrar todo» para casos mixtos (el visor ofrece lo que haya). Aviso legal de las imágenes: un solo campo.
import { dimensiones } from "./estudio-util.js";
import { app, h, icono, cambiar, emitir, on, toast, confirmar, pedir, guardarArchivo, urlDe, rutaLibre, elegirArchivos, dialogo,
  textoDe, pano, ESTILOS_IA, MOMENTOS, PAREDES_DEF, SUELOS_DEF, VIDRIO } from "./estudio-nucleo.js";
import { procesar } from "./estudio-fotos.js";
import { campoTexto } from "./estudio-campos.js";

let raiz = null;
const nombreDe = (p) => textoDe(p?.nombre) || p?.id || "";
const actual = () => pano(app.nodo) ?? app.tour.panoramas[0];

const PISTAS_ESTILO = [
  ["nordico", /n[oó]rdic|nordic|scandi/i], ["mediterraneo", /mediterr/i], ["industrial", /industr/i],
  ["purista", /purist|all[-_ ]?white|todo[-_ ]?blanco/i], // antes que «minimal»: «purista-minimal» es purista
  ["contemporaneo_minimalista", /contempor|minimal/i], ["clasico", /cl[aá]sic|classic/i],
];
const PISTAS_MOMENTO = [["noche", /noche|night/i], ["atardecer", /atardecer|sunset|dusk|golden/i], ["dia", /d[ií]a|day/i]];
function adivinar(nombre, p) {
  let estilo = PISTAS_ESTILO.find(([, r]) => r.test(nombre))?.[0] ?? app.tour.estilos?.find((e) => e.id !== "original" && new RegExp(e.id, "i").test(nombre))?.id ?? null;
  const momento = PISTAS_MOMENTO.find(([, r]) => r.test(nombre))?.[0] ?? null;
  // Sin pistas en el nombre: se asigna el siguiente estilo IA que falte en esta estancia (se puede cambiar después).
  if (!estilo && !momento) estilo = ESTILOS_IA.map((e) => e.id).find((id) => !(p.variantes ?? []).some((v) => v.estilo === id)) ?? null;
  return { estilo, momento };
}
export const nombreEstilo = (id) => textoDe(app.tour.estilos?.find((e) => e.id === id)?.nombre) || ESTILOS_IA.find((e) => e.id === id)?.nombre.es || id;

/** Comprueba una variante frente a la imagen base. → {nivel, texto} | null */
export const nombreVariante = (v) => [v.estilo && v.estilo !== "original" ? nombreEstilo(v.estilo) : null, MOMENTOS.find((m) => m.id === (v.momento ?? "dia"))?.nombre]
  .filter(Boolean).join(" · ") || "Original";
export function problemaVariante(p, v) {
  const mb = app.tour._estudio.meta[p.imagen], mv = app.tour._estudio.meta[v.imagen];
  if (!mb || !mv) return null;
  const texto = `La versión “${nombreVariante(v)}” de ${nombreDe(p)} no encaja con la foto original. Vuelve a generarla con el mismo tamaño.`;
  const detalle = `${mv.w}×${mv.h} (original ${mb.w}×${mb.h})`;
  if (Math.abs(mv.w / mv.h - mb.w / mb.h) > 0.01) return { nivel: "error", texto, detalle, corto: "No encaja con la original" };
  if (mv.w !== mb.w || mv.h !== mb.h) return { nivel: "aviso", texto, detalle, corto: "Tamaño distinto a la original" };
  return null;
}
const ORIGENES = [["foto", "Foto real"], ["render", "Render"], ["ia", "IA"]];
/** Origen por defecto según ESQUEMA: estilo → "ia"; solo momento → "foto". */
export const origenDe = (v) => v.origen ?? (v.estilo && v.estilo !== "original" ? "ia" : "foto");

/** Sube versiones de una foto. estilo: null = sin estilo (Luz); undefined = deducirlo del nombre. momentoDefecto: si el nombre no lo dice. */
export async function subirVariantes(pid, archivos, { estilo: estiloFijo, momento: momentoFijo, momentoDefecto = "dia", render = false } = {}) {
  const p = pano(pid);
  if (!p) return;
  const fotos = archivos.filter((f) => /^image\//.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name));
  if (!fotos.length) return;
  const base = app.archivos.get(p.imagen);
  const dBase = base ? await dimensiones(base) : null;
  const dMovil = app.archivos.get(p.imagen_movil) ? await dimensiones(app.archivos.get(p.imagen_movil)) : null;
  const tamanos = [dBase?.w ?? 8192, dMovil?.w ?? 4096];
  const capa = h("div", { class: "cargando-global", role: "status" });
  const txt = h("span"), barra = h("div");
  capa.append(h("div", { class: "c8-vidrio c8-vidrio--denso" }, txt, h("div", { class: "progreso" }, barra)));
  document.body.append(capa);
  app.procesandoVariantes = (app.procesandoVariantes ?? 0) + 1; // mientras tanto, cerrar la pestaña pregunta antes
  try {
    for (let i = 0; i < fotos.length; i++) {
      const f = fotos[i];
      txt.textContent = `Procesando variante ${i + 1} de ${fotos.length}: ${f.name}`;
      const dim = await dimensiones(f).catch(() => null);
      const r = await procesar(f, { tamanos, calidad: 0.85 }, (v) => { barra.style.width = `${Math.round(((i + v) / fotos.length) * 100)}%`; });
      const adiv = adivinar(f.name, pano(pid));
      const estilo = estiloFijo === undefined ? adiv.estilo : estiloFijo, momento = momentoFijo ?? adiv.momento ?? momentoDefecto;
      const nombre = `${p.id}-${estilo ?? "base"}-${momento ?? "dia"}`;
      const ruta = rutaLibre(`panos/variantes/${nombre}`, "jpg");
      const rutaM = ruta.replace("panos/variantes/", "panos/variantes/movil/");
      await guardarArchivo(ruta, r.salidas[0].blob);
      // Si la variante ya es ≤ 4096 px, la versión móvil es la misma imagen: no se duplica.
      const movilIgual = r.salidas[1].ancho === r.salidas[0].ancho;
      if (!movilIgual) await guardarArchivo(rutaM, r.salidas[1].blob);
      cambiar((t) => {
        const q = t.panoramas.find((x) => x.id === pid);
        q.variantes ??= [];
        const v = { imagen: ruta, imagen_movil: movilIgual ? ruta : rutaM };
        if (estilo) v.estilo = estilo;
        if (momento) v.momento = momento;
        v.origen = render ? "render" : estilo && estilo !== "original" ? "ia" : "foto";
        q.variantes.push(v);
        t._estudio.meta[ruta] = { w: dim?.w ?? r.original.w, h: dim?.h ?? r.original.h, archivo: f.name, ...(render ? { render: true } : {}) };
        if (estilo && !t.estilos.some((e) => e.id === estilo)) t.estilos.push({ id: estilo, nombre: { es: nombreEstilo(estilo) } });
      });
    }
    toast(fotos.length === 1 ? "Versión añadida. Revisa su estilo y su luz." : `${fotos.length} versiones añadidas. Revisa sus etiquetas.`, "ok");
  } catch (e) {
    console.error(e); toast(`Error al procesar: ${e.message}`, "error", 6000);
  } finally { capa.remove(); app.procesandoVariantes--; }
}

async function subirMascara(pid, vi = null) {
  const [f] = await elegirArchivos({ aceptar: "image/png" });
  if (!f) return;
  const d = await dimensiones(f).catch(() => null);
  if (!d || Math.abs(d.w / d.h - 2) > 0.02) return toast("La máscara debe ser un PNG 2:1 (p. ej. 2048×1024) alineado con la foto", "error", 5000);
  const v = vi != null ? pano(pid).variantes[vi] : null;
  const ruta = rutaLibre(`panos/mascaras/${v ? `${pid}-${v.estilo ?? "base"}-${v.momento ?? "dia"}` : pid}`, "png");
  await guardarArchivo(ruta, f);
  cambiar(() => { if (vi != null) pano(pid).variantes[vi].mascara = ruta; else pano(pid).mascara = ruta; });
  toast("Máscara añadida", "ok");
}

function probarEnVista(v) {
  try {
    const w = app.vistaPrevia.ventana();
    const visor = w?.visor;
    if (!visor?.fijarEstilo) return toast("La vista previa aún no puede mostrar estilos. Espera a que cargue y vuelve a probar.", "aviso", 5000);
    if (app.nodo !== actual()?.id) { app.nodo = actual().id; emitir("nodo", {}); }
    visor.fijarEstilo(v.estilo ?? "original");
    visor.fijarMomento?.(v.momento ?? "dia");
  } catch (e) { toast(`No se pudo aplicar en la vista previa: ${e.message}`, "aviso"); }
}

const AVISO_RECOMENDADO = { es: "Imágenes no contractuales. Los renders y los estilos de decoración (generados con inteligencia artificial) son orientativos; el mobiliario y la decoración no están incluidos.",
  en: "Images are for illustrative purposes only. Renders and decoration styles (AI-generated) are indicative; furniture and decoration are not included." };
const esEstilo = (v) => !!v.estilo && v.estilo !== "original";
const hayIAoRender = (t) => t.panoramas.some((p) => p.origen === "render" || (p.variantes ?? []).some((v) => origenDe(v) !== "foto")) || (t.galeria ?? []).some((g) => g.tipo === "render");
const abiertos = new Set(["aviso"]);

function render(cont, op = {}) {
  raiz = h("section", { class: "seccion" });
  cont.append(raiz);
  if (op.campo === "paletas") abiertos.add("paletas");
  pintar();
}
/** Tarjeta de una versión (variante) de la foto p. */
function tarjetaVariante(p, v, j, { conEstilo, conMascara }) {
  const prob = problemaVariante(p, v);
  const repetida = (p.variantes ?? []).filter((w) => (w.estilo ?? "original") === (v.estilo ?? "original") && (w.momento ?? "dia") === (v.momento ?? "dia")).length > 1;
  const opcionesEstilo = () => {
    const ids = new Set(["original", ...ESTILOS_IA.map((e) => e.id), ...(app.tour.estilos ?? []).map((e) => e.id)]);
    return [...ids].map((id) => [id, id === "original" ? "Sin estilo" : nombreEstilo(id)]);
  };
  const selE = h("select", { "aria-label": "Estilo" }, [...opcionesEstilo().map(([id, n]) => h("option", { value: id, text: n })),
    !ids(app.tour).has("proyecto") ? h("option", { value: "__proyecto", text: "Proyecto (render del arquitecto)" }) : null, h("option", { value: "__otro", text: "Otro estilo…" })]);
  selE.value = v.estilo ?? "original";
  selE.onchange = async () => {
    let val = selE.value;
    if (val === "__proyecto") {
      val = "proyecto";
      cambiar((tt) => { if (!tt.estilos.some((e) => e.id === val)) tt.estilos.push({ id: val, nombre: { es: "Proyecto", en: "Design" } }); }, { render: false });
    } else if (val === "__otro") {
      const n = await pedir("Nuevo estilo", "Nombre del estilo", "", { ayuda: "Ej.: Japandi, Rústico, Boho…" });
      if (!n) { selE.value = v.estilo ?? "original"; return; }
      val = n.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "estilo";
      cambiar((tt) => { if (!tt.estilos.some((e) => e.id === val)) tt.estilos.push({ id: val, nombre: { es: n } }); }, { render: false });
    }
    cambiar(() => { const w = pano(p.id).variantes[j]; if (val === "original") delete w.estilo; else w.estilo = val; });
  };
  const selM = h("select", { "aria-label": "Luz" }, MOMENTOS.map((m) => h("option", { value: m.id, text: m.nombre })));
  selM.value = v.momento ?? "dia";
  selM.onchange = () => cambiar(() => { pano(p.id).variantes[j].momento = selM.value; });
  const selO = h("select", { "aria-label": "Origen de la imagen", title: "El visor muestra un sello: «Recreación virtual · IA», «Render / infografía»…" }, ORIGENES.map(([id, n]) => h("option", { value: id, text: n })));
  selO.value = origenDe(v);
  selO.onchange = () => cambiar(() => { pano(p.id).variantes[j].origen = selO.value; });
  return h("div", { class: "variante" },
    h("img", { src: urlDe(v.imagen_movil ?? v.imagen), alt: "", loading: "lazy" }),
    h("div", { class: "cuerpo" },
      h("div", { class: "fila" }, conEstilo ? selE : null, selM),
      h("label", { class: "campo" }, h("span", { text: "Origen" }), selO),
      h("div", { class: "fila envolver" },
        prob ? h("span", { class: `chip ${prob.nivel}`, text: prob.corto, title: `${prob.texto} ${prob.detalle}` }) : h("span", { class: "chip ok", text: "Encaja con la original" }),
        repetida ? h("span", { class: "chip aviso", text: "Repetida" }) : null,
        conMascara && esEstilo(v) ? (v.mascara ? h("span", { class: "chip ok", text: "Zonas de color propias" }) : h("span", { class: "chip aviso", text: "Sin zonas de color", title: "Un estilo con otro mobiliario necesita sus propias zonas de color" })) : null),
      prob ? h("small", { class: prob.nivel === "error" ? "error-campo" : "suave", text: prob.texto }) : null,
      conMascara && esEstilo(v) ? h("div", { class: "fila" },
        h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", onclick: async () => { const { abrirEditorMascara } = await import("./estudio-mascara.js"); abrirEditorMascara(p.id, j); } }, icono("varita", 14), v.mascara ? "Editar zonas de color" : "Marcar zonas de color"),
        h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--s", title: "Subir una máscara PNG hecha por tu renderista (rojo = paredes, verde = suelo)", onclick: () => subirMascara(p.id, j) }, "Máscara PNG"),
        v.mascara ? h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--s", onclick: () => cambiar(() => { delete pano(p.id).variantes[j].mascara; }) }, "Quitar") : null) : null,
      h("div", { class: "fila" },
        h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", onclick: () => probarEnVista(v) }, icono("ojo", 14), "Ver en la vista previa"),
        h("div", { class: "relleno" }),
        h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--icono c8-boton--s", title: "Eliminar", "aria-label": "Eliminar esta versión", onclick: async () => {
          if (await confirmar("Eliminar versión", "¿Quitar esta imagen alternativa?")) cambiar(() => { pano(p.id).variantes.splice(j, 1); });
        } }, icono("basura", 15)))));
}
const ids = (t) => new Set((t.estilos ?? []).map((e) => e.id));

function paleta(clave, titulo, defecto) {
  const lista = () => (app.tour.personalizacion ??= { paredes: [], suelos: [] })[clave] ??= [];
  const cont = h("div", { class: "paleta" });
  const pintarP = () => {
    cont.replaceChildren(...lista().map((c, i) => {
      const col = h("input", { type: "color", value: c.color, "aria-label": `Color ${textoDe(c.nombre)}` });
      col.oninput = () => cambiar(() => { lista()[i].color = col.value; }, { clave: `pal-${clave}-${i}`, tipo: "datos", render: false });
      return h("div", { class: "fila" }, col,
        h("div", { class: "estirar" }, campoTexto(() => lista()[i], "nombre", { etiqueta: "Nombre del color", compacto: true, tipo: "datos" })),
        h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--icono c8-boton--s", "aria-label": "Quitar color", onclick: () => { cambiar(() => { lista().splice(i, 1); }, { tipo: "datos", render: false }); pintarP(); } }, icono("basura", 15)));
    }),
    h("div", { class: "fila" },
      h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", onclick: () => { cambiar(() => { lista().push({ nombre: { es: "Nuevo color" }, color: "#cccccc" }); }, { tipo: "datos", render: false }); pintarP(); } }, icono("mas", 14), "Añadir color"),
      h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--s", onclick: async () => { if (await confirmar("Restaurar paleta", `Se recuperarán los ${defecto.length} colores por defecto.`, "Restaurar")) { cambiar((t) => { t.personalizacion[clave] = structuredClone(defecto); }, { tipo: "datos", render: false }); pintarP(); } } }, "Restaurar por defecto")));
  };
  pintarP();
  return h("div", { class: "subtarjeta" }, h("h3", { text: titulo }), cont);
}
function nombresEstilos() {
  const t = app.tour;
  const cont = h("div", { class: "nombres-estilos pila" });
  const pintarE = () => {
    const usados = new Set(t.panoramas.flatMap((p) => (p.variantes ?? []).map((v) => v.estilo)));
    cont.replaceChildren(
      h("p", { class: "texto-sec", text: "Los nombres que verá el cliente. Solo se publican los estilos con imágenes en alguna estancia." }),
      ...(app.tour.estilos ?? []).map((e, i) => e.id === "original" ? null : h("div", { class: "fila sin-salto" },
        h("span", { class: `chip ${usados.has(e.id) ? "ok" : ""}`, text: usados.has(e.id) ? "con imágenes" : "sin imágenes" }),
        h("div", { class: "estirar" }, campoTexto(() => app.tour.estilos[i], "nombre", { etiqueta: "Nombre del estilo", compacto: true, tipo: "datos" })),
        h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--icono c8-boton--s", "aria-label": "Quitar estilo", onclick: () => { cambiar(() => { app.tour.estilos.splice(i, 1); }, { tipo: "datos", render: false }); pintarE(); } }, icono("basura", 15)))),
      h("div", {}, h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--s", onclick: () => { cambiar((tt) => { for (const e of ESTILOS_IA) if (!tt.estilos.some((x) => x.id === e.id)) tt.estilos.push(structuredClone(e)); }, { tipo: "datos", render: false }); pintarE(); } }, "Restaurar los 5 estilos")));
  };
  pintarE();
  return cont;
}
function avisoLegal() {
  const I = () => (app.tour.inmueble ??= {});
  return h("div", { class: "pila" },
    campoTexto(I, "aviso_legal", { etiqueta: "Aviso que acompaña a los renders y a los estilos (IA)", tipo: "datos", multilinea: true,
      placeholder: "Imágenes no contractuales. Los renders y los estilos generados con IA son orientativos; el mobiliario no está incluido." }),
    h("div", {}, h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--s", onclick: () => { cambiar(() => { I().aviso_legal = structuredClone(AVISO_RECOMENDADO); }, { tipo: "datos" }); pintar(); } }, "Usar texto recomendado")));
}
/** Plegable recordado dentro de la sección: un vidrio con su contenido (dentro, rellenos). */
function plegable(id, titulo, cuerpo, campo) {
  const d = h("details", { class: `avanzado plegable-estilo ${VIDRIO}`, open: abiertos.has(id), "data-campo": campo ?? id }, h("summary", { text: titulo }), h("div", { class: "contenido" }, cuerpo));
  d.addEventListener("toggle", () => { if (d.open) abiertos.add(id); else abiertos.delete(id); });
  return d;
}

function pintar() {
  if (!raiz) return;
  const t = app.tour, p = actual();
  const proyecto = t.inmueble?.estado_obra === "proyecto";
  const todo = !!t._estudio.estiloTodo;
  const verEstilos = proyecto || todo, verColores = !proyecto || todo;
  const nEstilos = t.panoramas.reduce((s, q) => s + (q.variantes ?? []).filter(esEstilo).length, 0);
  const nMascaras = t.panoramas.filter((q) => q.mascara).length;
  const cab = h("div", { class: "cab-seccion" }, h("div", {}, h("h1", { text: "Estilo y luz" }),
    h("p", { text: "Lo que el cliente podrá probar en el visor: la luz de día y de noche y, según la vivienda, estilos de decoración o colores de paredes y suelo." })));
  // Según la obra (E9): lo que no corresponde no se ve, salvo con «Mostrar todo».
  const todoInput = h("input", { type: "checkbox", class: "c8-interruptor", role: "switch", checked: todo, id: "estilo-todo" });
  todoInput.onchange = () => cambiar((tt) => { if (todoInput.checked) tt._estudio.estiloTodo = true; else delete tt._estudio.estiloTodo; }, { tipo: "local" });
  const ocultos = proyecto ? (!todo && nMascaras ? `${nMascaras} zonas de color` : "") : (!todo && nEstilos ? `${nEstilos} estilos IA` : "");
  const tipo = h("div", { class: `tarjeta ${VIDRIO} tipo-vivienda`, "data-campo": "estado_obra" },
    h("div", { class: "fila arriba" },
      h("div", { class: "estirar" },
        h("b", { text: proyecto ? "Obra nueva o proyecto: estilos de decoración (IA)" : "Vivienda construida: colores de paredes y suelo" }),
        h("div", { class: "texto-sec" }, "Según «Situación» en Datos. ",
          h("button", { type: "button", class: "enlace", onclick: () => emitir("ir", { seccion: "datos", campo: "estado_obra" }) }, "Cambiar"))),
      h("label", { class: "check", for: "estilo-todo" }, todoInput, h("span", { text: "Mostrar todo (estilos y colores)" }))),
    ocultos ? h("p", { class: "nota-c8", role: "note", text: `Este proyecto tiene ${ocultos} que aquí no se muestran. El visor ofrece todo lo que haya: actívalo con «Mostrar todo» para revisarlo.` }) : null,
    todo && nEstilos && nMascaras ? h("p", { class: "nota-c8", text: "Hay estilos y zonas de color: el visor ofrecerá las dos cosas." }) : null);
  if (!p) {
    raiz.replaceChildren(cab, tipo, h("div", { class: `vacio-grande ${VIDRIO}` }, icono("luz", 40), h("h3", { text: "Primero añade fotos" }),
      h("button", { type: "button", class: "c8-boton c8-boton--primario", onclick: () => emitir("ir", { seccion: "fotos" }) }, "Ir a Fotos 360")));
    return;
  }
  const selector = h("div", { class: "selector-nodos", role: "group", "aria-label": "Estancia" }, t.panoramas.map((q) => h("button", {
    "aria-pressed": String(q.id === p.id), onclick: () => { app.nodo = q.id; emitir("nodo", {}); },
  }, h("img", { src: urlDe(q.miniatura), alt: "" }), h("span", {}, h("span", { text: nombreDe(q) }),
    h("span", { class: "tenue", text: `${q.variantes?.length ?? 0}${q.mascara ? " · M" : ""}` })))));
  const elegirImgs = () => elegirArchivos({ aceptar: "image/jpeg,image/png,image/webp", multiple: true });
  const lista = (filtro, opciones) => {
    const xs = (p.variantes ?? []).map((v, j) => [v, j]).filter(([v]) => filtro(v));
    return xs.length ? h("div", { class: "lista-variantes" }, xs.map(([v, j]) => tarjetaVariante(p, v, j, opciones))) : null;
  };
  // Luz (E8)
  const noche = h("input", { type: "checkbox", class: "c8-interruptor", role: "switch", checked: !!t._estudio.nocheSimulada, id: "noche-simulada" });
  noche.onchange = () => cambiar((tt) => { tt._estudio.nocheSimulada = noche.checked; }, { tipo: "datos" });
  const conNoche = t.panoramas.some((q) => (q.variantes ?? []).some((v) => v.momento === "noche"));
  const luces = lista((v) => !esEstilo(v), { conEstilo: false, conMascara: false });
  const luz = h("div", { class: `tarjeta ${VIDRIO}`, "data-campo": "luz" },
    h("div", { class: "fila cab-tarjeta" },
      h("div", { class: "estirar" }, h("h2", { class: "sub", text: `Luz · ${nombreDe(p)}` }),
        h("div", { class: "texto-sec", text: "Fotos de noche (con las luces encendidas) o de atardecer, desde el mismo punto y con la misma orientación que la de día." })),
      h("button", { type: "button", class: "c8-boton c8-boton--secundario", onclick: async () => subirVariantes(p.id, await elegirImgs(), { estilo: null, momentoDefecto: "noche" }) }, icono("subir", 16), "Subir foto de noche o atardecer")),
    luces ?? h("p", { class: "texto-sec", text: "Sin fotos de noche en esta estancia." }),
    // Con la barra del sol, el visor ya ofrece los cuatro momentos (simulados fuera de la hora de las fotos): sobra
    h("label", { class: "fila-interruptor", for: "noche-simulada", hidden: solActiva(t) }, noche,
      h("span", {}, h("b", { text: "Ofrecer vista de noche simulada" }),
        h("small", { class: "tenue", text: conNoche ? "Para las estancias sin foto de noche, el visor la simula oscureciendo la de día." : "Sin fotos de noche, el visor puede simular la noche oscureciendo la foto de día. El atardecer solo se ofrece con foto." }))),
    bloqueSol(t));
  // Estilos (proyectos)
  const estilos = verEstilos ? h("div", { class: `tarjeta ${VIDRIO}`, "data-campo": "estilos" },
    h("div", { class: "fila cab-tarjeta" },
      h("div", { class: "estirar" }, h("h2", { class: "sub", text: `Estilos de decoración (IA) · ${nombreDe(p)}` }),
        h("div", { class: "texto-sec", text: "Genera fuera (con IA) los estilos Nórdico, Mediterráneo, Industrial, Contemporáneo minimalista, Purista (all white) y Clásico con el mismo encuadre y súbelos aquí. El estilo se deduce del nombre del archivo (salon-nordico.jpg, salon-all-white.jpg)." })),
      h("button", { type: "button", class: "c8-boton c8-boton--primario", onclick: async () => subirVariantes(p.id, await elegirImgs()) }, icono("subir", 16), "Subir estilos")),
    lista(esEstilo, { conEstilo: true, conMascara: verColores }) ?? h("p", { class: "texto-sec", text: "Sin estilos en esta estancia." })) : null;
  // Zonas de color (construidas)
  let zonas = null;
  if (verColores) {
    const prev = h("div", { class: "mascara-prev" }, h("img", { src: urlDe(p.imagen_movil ?? p.imagen), alt: "" }));
    if (p.mascara) {
      const cv = h("canvas", { width: 1024, height: 512 });
      prev.append(cv);
      const im = new Image();
      im.onload = () => {
        const g = cv.getContext("2d");
        g.drawImage(im, 0, 0, 1024, 512);
        const d = g.getImageData(0, 0, 1024, 512), a = d.data;
        for (let i = 0; i < a.length; i += 4) {
          const r = a[i] > 127, gg = a[i + 1] > 127;
          a[i] = r ? 255 : 40; a[i + 1] = gg ? 220 : 40; a[i + 2] = r ? 70 : gg ? 110 : 40; a[i + 3] = r || gg ? 120 : 0;
        }
        g.putImageData(d, 0, 0);
      };
      im.src = urlDe(p.mascara);
    }
    zonas = h("div", { class: `tarjeta ${VIDRIO} pila`, "data-campo": "zonas-color" },
      h("h2", { class: "sub", text: `Zonas de color · ${nombreDe(p)}` }),
      h("p", { class: "texto-sec" }, "Marca qué es pared y qué es suelo: en el visor, el cliente probará los colores de tus paletas. Rojo = paredes, verde = suelo."),
      prev,
      h("div", { class: "fila" },
        h("button", { type: "button", class: "c8-boton c8-boton--primario", onclick: async () => { const { abrirEditorMascara } = await import("./estudio-mascara.js"); abrirEditorMascara(p.id); } },
          icono("varita", 16), p.mascara ? "Editar zonas de color" : "Marcar zonas de color"),
        p.mascara ? h("button", { type: "button", class: "c8-boton c8-boton--fantasma", onclick: async () => { if (await confirmar("Quitar zonas de color", "Se quitarán las zonas de color de esta estancia.", "Quitar")) cambiar(() => { delete pano(p.id).mascara; }); } }, "Quitar") : null),
      h("details", { class: "avanzado" }, h("summary", { text: "Avanzado: máscara PNG" }),
        h("div", { class: "contenido pila" },
          h("p", { class: "texto-sec", text: "Si tu renderista te da una máscara del mismo tamaño que la foto (rojo = paredes, verde = suelo), súbela en lugar de marcarla." }),
          h("div", {}, h("button", { type: "button", class: "c8-boton c8-boton--secundario", onclick: () => subirMascara(p.id) }, icono("subir", 16), "Subir máscara PNG")))));
  }
  const ajustes = [
    verColores ? plegable("paletas", "Paletas de colores (paredes y suelos)", h("div", { class: "rejilla-paletas" }, paleta("paredes", "Colores de pared", PAREDES_DEF), paleta("suelos", "Tonos de suelo", SUELOS_DEF))) : null,
    verEstilos ? plegable("estilos", "Nombres de los estilos", nombresEstilos(), "nombres-estilos") : null,
    verEstilos || hayIAoRender(t) || textoDe(t.inmueble?.aviso_legal) ? plegable("aviso", "Aviso legal de las imágenes", avisoLegal(), "aviso_legal") : null,
  ];
  raiz.replaceChildren(...[cab, tipo, selector, luz, estilos, zonas, ...ajustes].filter(Boolean));
}

export const seccionEstilo = {
  id: "estilo", titulo: "Estilo y luz", corto: "Estilo y luz", icono: "luz",
  resumen: () => {
    const ps = app.tour.panoramas;
    const n = ps.reduce((s, p) => s + (p.variantes?.length ?? 0), 0), m = ps.filter((p) => p.mascara).length;
    return { texto: n || m ? [n ? `${n} ${n === 1 ? "versión" : "versiones"}` : null, m ? `${m} con colores` : null].filter(Boolean).join(" · ") : "Noche, estilos, colores" };
  },
  render, actualizar: () => { if (!raiz?.contains(document.activeElement) || document.activeElement?.tagName === "BUTTON" || document.activeElement?.type === "checkbox") pintar(); },
  alCambiarNodo: pintar, salir: () => { raiz = null; },
  soltar: async (lista) => {
    const p = actual();
    const fotos = lista.filter(({ archivo }) => /\.(jpe?g|png|webp)$/i.test(archivo.name));
    if (!p || !fotos.length) return false;
    const r = await dialogo({ titulo: "¿Qué son estas imágenes?", texto: `Has soltado ${fotos.length} imagen(es) en «Estilo y luz».`,
      botones: [{ texto: "Cancelar", valor: null }, { texto: "Fotos 360 nuevas", valor: "fotos" }, { texto: `Versiones de ${nombreDe(p)}`, valor: "var", primario: true }] });
    if (r === "var") { await subirVariantes(p.id, fotos.map((f) => f.archivo)); return true; }
    return r !== "fotos";
  },
};
on("mascara", () => pintar());

/**
 * Barra del sol del visor (amanecer → noche con la posición exacta del sol): la fecha, la hora y el lugar salen del EXIF
 * de la primera foto (tour.sol, al añadirla); aquí se ven, se corrigen o se apaga la barra.
 */
const solActiva = (t) => !t._estudio.sinSol && (!!t.sol?.fecha || !!t._estudio.conSol);
function bloqueSol(t) {
  const conFecha = !!t.sol?.fecha;
  const activa = solActiva(t);
  const sw = h("input", { type: "checkbox", class: "c8-interruptor", role: "switch", checked: activa, id: "barra-sol" });
  sw.onchange = () => cambiar((tt) => {
    if (sw.checked) { delete tt._estudio.sinSol; if (!tt.sol?.fecha) tt._estudio.conSol = true; }
    else { tt._estudio.sinSol = true; delete tt._estudio.conSol; }
  }, { tipo: "datos" });
  const u = t.inmueble?.ubicacion;
  const lugar = Number.isFinite(t.sol?.lat) ? ` en ${t.sol.lat.toLocaleString("es-ES")}, ${t.sol.lng.toLocaleString("es-ES")} (GPS de la foto, a ~1 km)`
    : Number.isFinite(u?.lat) ? " en la ubicación del inmueble" : " (sin ubicación: Madrid)";
  let resumen = "Las fotos no traen fecha: el visor usará el día de hoy. Indica cuándo se hicieron para que la luz real sea la suya.";
  if (conFecha) {
    const dia = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${t.sol.fecha.slice(0, 10)}T12:00:00Z`));
    resumen = `Fotos del ${dia} a las ${t.sol.fecha.slice(11, 16)}${lugar}. El visor mueve el sol con su posición exacta de ese día; fuera de esa hora la luz es simulada y se avisa con un sello.`;
  }
  const fecha = h("input", { type: "datetime-local", id: "sol-fecha", value: conFecha ? t.sol.fecha.slice(0, 16) : "", step: 60 });
  fecha.onchange = () => cambiar((tt) => {
    if (!fecha.value) { if (tt.sol) delete tt.sol.fecha; return; }
    const [d, hm] = fecha.value.split("T"), [a, m, dd] = d.split("-").map(Number), [hh, mi] = hm.split(":").map(Number);
    const desfase = Number.isFinite(tt.sol?.desfase) ? tt.sol.desfase : -new Date(a, m - 1, dd, hh, mi).getTimezoneOffset() || 0;
    const dos = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0");
    tt.sol = { ...(tt.sol ?? {}), fecha: `${fecha.value}:00${desfase < 0 ? "-" : "+"}${dos(desfase / 60)}:${dos(Math.abs(desfase) % 60)}`, desfase };
  }, { tipo: "datos" });
  return h("div", { class: "bloque-sol" },
    h("label", { class: "fila-interruptor", for: "barra-sol" }, sw,
      h("span", {}, h("b", { text: "Barra del sol: amanecer, día, atardecer y noche" }), h("small", { class: "tenue", text: resumen }))),
    h("label", { class: "campo", for: "sol-fecha" }, h("span", { class: "texto-sec", text: "Fecha y hora de las fotos" }), fecha));
}
