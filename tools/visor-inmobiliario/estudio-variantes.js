// Paso 4 · Variantes por estancia (estilos IA, día/atardecer/noche) y máscara de superficies para cambiar colores.
import { dimensiones } from "./estudio-util.js";
import { app, h, icono, cambiar, emitir, on, toast, confirmar, pedir, guardarArchivo, urlDe, rutaLibre, elegirArchivos, dialogo,
  textoDe, pano, ESTILOS_IA, MOMENTOS } from "./estudio-nucleo.js";
import { procesar } from "./estudio-fotos.js";

let raiz = null;
const nombreDe = (p) => textoDe(p?.nombre) || p?.id || "";
const actual = () => pano(app.nodo) ?? app.tour.panoramas[0];

const PISTAS_ESTILO = [
  ["nordico", /n[oó]rdic|nordic|scandi/i], ["mediterraneo", /mediterr/i], ["industrial", /industr/i],
  ["contemporaneo_minimalista", /contempor|minimal/i], ["clasico", /cl[aá]sic|classic/i],
];
const PISTAS_MOMENTO = [["noche", /noche|night/i], ["atardecer", /atardecer|sunset|dusk|golden/i], ["dia", /d[ií]a|day/i]];
function adivinar(nombre, p) {
  let estilo = PISTAS_ESTILO.find(([, r]) => r.test(nombre))?.[0] ?? app.tour.estilos?.find((e) => e.id !== "original" && new RegExp(e.id, "i").test(nombre))?.id ?? null;
  const momento = PISTAS_MOMENTO.find(([, r]) => r.test(nombre))?.[0] ?? null;
  // Sin pistas en el nombre: se asigna el siguiente estilo IA que falte en esta estancia (se puede cambiar después).
  if (!estilo && !momento) estilo = ESTILOS_IA.map((e) => e.id).find((id) => !(p.variantes ?? []).some((v) => v.estilo === id)) ?? null;
  return { estilo, momento: momento ?? "dia" };
}
export const nombreEstilo = (id) => textoDe(app.tour.estilos?.find((e) => e.id === id)?.nombre) || ESTILOS_IA.find((e) => e.id === id)?.nombre.es || id;

/** Comprueba una variante frente a la imagen base. → {nivel, texto} | null */
export function problemaVariante(p, v) {
  const mb = app.tour._estudio.meta[p.imagen], mv = app.tour._estudio.meta[v.imagen];
  if (!mb || !mv) return null;
  if (Math.abs(mv.w / mv.h - mb.w / mb.h) > 0.01) return { nivel: "error", texto: `Proporción distinta (${mv.w}×${mv.h})` };
  if (mv.w !== mb.w || mv.h !== mb.h) return { nivel: "aviso", texto: `Tamaño distinto: ${mv.w}×${mv.h} (base ${mb.w}×${mb.h})` };
  return null;
}

export async function subirVariantes(pid, archivos, { estilo: estiloFijo, momento: momentoFijo, render = false } = {}) {
  const p = pano(pid);
  if (!p) return;
  const fotos = archivos.filter((f) => /^image\//.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name));
  if (!fotos.length) return;
  const base = app.archivos.get(p.imagen);
  const dBase = base ? await dimensiones(base) : null;
  const dMovil = app.archivos.get(p.imagen_movil) ? await dimensiones(app.archivos.get(p.imagen_movil)) : null;
  const tamanos = [dBase?.w ?? 8192, dMovil?.w ?? 4096];
  const capa = h("div", { class: "cargando-global" });
  const txt = h("span"), barra = h("div");
  capa.append(h("div", {}, txt, h("div", { class: "progreso" }, barra)));
  document.body.append(capa);
  try {
    for (let i = 0; i < fotos.length; i++) {
      const f = fotos[i];
      txt.textContent = `Procesando variante ${i + 1} de ${fotos.length}: ${f.name}`;
      const dim = await dimensiones(f).catch(() => null);
      const r = await procesar(f, { tamanos, calidad: 0.85 }, (v) => { barra.style.width = `${Math.round(((i + v) / fotos.length) * 100)}%`; });
      const adiv = adivinar(f.name, pano(pid));
      const estilo = estiloFijo === undefined ? adiv.estilo : estiloFijo, momento = momentoFijo ?? adiv.momento;
      const nombre = `${p.id}-${estilo ?? "base"}-${momento ?? "dia"}`;
      const ruta = rutaLibre(`panos/variantes/${nombre}`, "jpg");
      const rutaM = ruta.replace("panos/variantes/", "panos/variantes/movil/");
      await guardarArchivo(ruta, r.salidas[0].blob);
      await guardarArchivo(rutaM, r.salidas[1].blob);
      cambiar((t) => {
        const q = t.panoramas.find((x) => x.id === pid);
        q.variantes ??= [];
        const v = { imagen: ruta, imagen_movil: rutaM };
        if (estilo) v.estilo = estilo;
        if (momento) v.momento = momento;
        q.variantes.push(v);
        t._estudio.meta[ruta] = { w: dim?.w ?? r.original.w, h: dim?.h ?? r.original.h, archivo: f.name, ...(render ? { render: true } : {}) };
        if (estilo && !t.estilos.some((e) => e.id === estilo)) t.estilos.push({ id: estilo, nombre: { es: nombreEstilo(estilo) } });
      });
    }
    toast(fotos.length === 1 ? "Variante añadida. Revisa su estilo y momento." : `${fotos.length} variantes añadidas. Revisa sus etiquetas.`, "ok");
  } catch (e) {
    console.error(e); toast(`Error al procesar: ${e.message}`, "error", 6000);
  } finally { capa.remove(); }
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
    if (!visor?.fijarEstilo) return toast("La vista previa aún no admite estilos (falta window.visor.fijarEstilo)", "aviso", 5000);
    if (app.nodo !== actual()?.id) { app.nodo = actual().id; emitir("nodo", {}); }
    visor.fijarEstilo(v.estilo ?? "original");
    visor.fijarMomento?.(v.momento ?? "dia");
  } catch (e) { toast(`No se pudo aplicar en la vista previa: ${e.message}`, "aviso"); }
}

function render(cont) {
  raiz = h("section", { class: "seccion" });
  cont.append(raiz);
  pintar();
}
function pintar() {
  if (!raiz) return;
  const t = app.tour, p = actual();
  const cab = h("div", { class: "cab-seccion" }, h("div", {}, h("h1", { text: "Variantes y colores" }),
    h("p", { text: "Sube versiones de cada foto con otro estilo de decoración (generadas con IA) o en otro momento del día, y prepara la máscara de paredes y suelo para que el cliente pruebe colores." })));
  if (!p) {
    raiz.replaceChildren(cab, h("div", { class: "vacio-grande" }, icono("variantes", 40), h("h3", { text: "Primero añade fotos" }),
      h("button", { class: "btn primario", onclick: () => emitir("ir", { seccion: "fotos" }) }, "Ir a Fotos 360")));
    return;
  }
  const selector = h("div", { class: "selector-nodos", role: "group", "aria-label": "Estancia" }, t.panoramas.map((q) => h("button", {
    "aria-pressed": String(q.id === p.id), onclick: () => { app.nodo = q.id; emitir("nodo", {}); },
  }, h("img", { src: urlDe(q.miniatura), alt: "" }), h("span", {}, h("span", { text: nombreDe(q), style: { overflow: "hidden", textOverflow: "ellipsis" } }),
    h("span", { class: "tenue", text: `${q.variantes?.length ?? 0}${q.mascara ? " · M" : ""}` })))));

  const usados = new Map();
  for (const v of p.variantes ?? []) { const k = `${v.estilo ?? "original"}|${v.momento ?? "dia"}`; usados.set(k, (usados.get(k) ?? 0) + 1); }
  const opcionesEstilo = () => {
    const ids = new Set(["original", ...ESTILOS_IA.map((e) => e.id), ...(t.estilos ?? []).map((e) => e.id)]);
    return [...ids].map((id) => [id, id === "original" ? "Original" : nombreEstilo(id)]);
  };
  const tarjetas = (p.variantes ?? []).map((v, j) => {
    const prob = problemaVariante(p, v);
    const dup = usados.get(`${v.estilo ?? "original"}|${v.momento ?? "dia"}`) > 1;
    const selE = h("select", { "aria-label": "Estilo" }, [...opcionesEstilo().map(([id, n]) => h("option", { value: id, text: n })), h("option", { value: "__otro", text: "Otro estilo…" })]);
    selE.value = v.estilo ?? "original";
    selE.onchange = async () => {
      let val = selE.value;
      if (val === "__otro") {
        const n = await pedir("Nuevo estilo", "Nombre del estilo", "", { ayuda: "Ej.: Japandi, Rústico, Boho…" });
        if (!n) { selE.value = v.estilo ?? "original"; return; }
        val = n.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "estilo";
        cambiar((tt) => { if (!tt.estilos.some((e) => e.id === val)) tt.estilos.push({ id: val, nombre: { es: n } }); }, { render: false });
      }
      cambiar(() => { const w = pano(p.id).variantes[j]; if (val === "original") delete w.estilo; else w.estilo = val; });
    };
    const selM = h("select", { "aria-label": "Momento" }, MOMENTOS.map((m) => h("option", { value: m.id, text: m.nombre })));
    selM.value = v.momento ?? "dia";
    selM.onchange = () => cambiar(() => { pano(p.id).variantes[j].momento = selM.value; });
    return h("div", { class: "variante" },
      h("img", { src: urlDe(v.imagen_movil ?? v.imagen), alt: "", loading: "lazy" }),
      h("div", { class: "cuerpo" },
        h("div", { class: "fila" }, selE, selM),
        h("div", { class: "fila", style: { flexWrap: "wrap", gap: "6px" } },
          prob ? h("span", { class: `chip ${prob.nivel}`, text: prob.texto }) : h("span", { class: "chip ok", text: "Mismo encuadre y tamaño" }),
          dup ? h("span", { class: "chip aviso", text: "Repetida" }) : null,
          t._estudio.meta[v.imagen]?.render ? h("span", { class: "chip acento", text: "Render" }) : null,
          v.estilo && v.estilo !== "original"
            ? (v.mascara ? h("span", { class: "chip ok", text: "Máscara propia" }) : h("span", { class: "chip aviso", text: "Sin máscara: no se podrá cambiar el color", title: "Un estilo con otro mobiliario necesita su propia máscara" }))
            : (p.mascara ? h("span", { class: "chip", text: "Usa la máscara base" }) : null)),
        v.estilo && v.estilo !== "original" ? h("div", { class: "fila" },
          h("button", { class: "btn peq", onclick: async () => { const { abrirEditorMascara } = await import("./estudio-mascara.js"); abrirEditorMascara(p.id, j); } }, icono("varita", 14), v.mascara ? "Editar máscara" : "Crear máscara"),
          h("button", { class: "btn peq fantasma", onclick: () => subirMascara(p.id, j) }, "Subir PNG"),
          v.mascara ? h("button", { class: "btn peq fantasma", onclick: () => cambiar(() => { delete pano(p.id).variantes[j].mascara; }) }, "Quitar") : null) : null,
        h("div", { class: "fila" },
          h("button", { class: "btn peq", onclick: () => probarEnVista(v) }, icono("ojo", 14), "Ver en la vista previa"),
          h("div", { style: { flex: 1 } }),
          h("button", { class: "btn peq fantasma icono-btn", title: "Eliminar variante", "aria-label": "Eliminar variante", onclick: async () => {
            if (await confirmar("Eliminar variante", "¿Quitar esta imagen alternativa?")) cambiar(() => { pano(p.id).variantes.splice(j, 1); });
          } }, icono("basura", 15)))));
  });
  const elegir = async () => subirVariantes(p.id, await elegirArchivos({ aceptar: "image/jpeg,image/png,image/webp", multiple: true }));
  const variantes = h("div", { class: "tarjeta" },
    h("div", { class: "fila", style: { marginBottom: "12px" } },
      h("div", { style: { flex: 1 } }, h("h2", { class: "sub", style: { margin: 0 }, text: `Variantes de ${nombreDe(p)}` }),
        h("div", { class: "tenue", style: { fontSize: "12.5px", marginTop: "4px" }, text: "Mismo punto, misma orientación y mismo tamaño que la foto original. El estilo y el momento se deducen del nombre del archivo (p. ej. salon-nordico.jpg, salon-noche.jpg)." })),
      h("button", { class: "btn primario", onclick: elegir }, icono("subir", 16), "Subir variantes")),
    tarjetas.length ? h("div", { class: "lista-variantes" }, tarjetas) :
      h("div", { class: "zona-soltar", style: { margin: 0 } }, icono("variantes", 22), h("div", { class: "relleno" },
        h("b", { text: "Sin variantes" }), h("div", { class: "tenue", text: "Genera fuera (con IA) los estilos Nórdico, Mediterráneo, Industrial, Contemporáneo minimalista y Clásico y súbelos aquí; o fotos de atardecer y noche." }))));

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
  const mascara = h("div", { class: "tarjeta" },
    h("h2", { class: "sub", style: { marginTop: 0 }, text: "Máscara de superficies (cambiar color de paredes y suelo)" }),
    h("p", { class: "suave", style: { marginTop: 0 } }, "Marca qué es pared y qué es suelo en la foto. En el visor, el cliente podrá probar los colores de tu paleta. ",
      h("span", { class: "tenue", text: "Rojo = paredes, verde = suelo." })),
    prev,
    h("div", { class: "fila", style: { marginTop: "12px" } },
      h("button", { class: "btn primario", onclick: async () => { const { abrirEditorMascara } = await import("./estudio-mascara.js"); abrirEditorMascara(p.id); } },
        icono("varita", 16), p.mascara ? "Editar máscara" : "Crear máscara"),
      h("button", { class: "btn", onclick: () => subirMascara(p.id) }, icono("subir", 16), "Subir PNG"),
      p.mascara ? h("button", { class: "btn fantasma", onclick: async () => { if (await confirmar("Quitar máscara", "Se quitará la máscara de esta estancia.", "Quitar")) cambiar(() => { delete pano(p.id).mascara; }); } }, "Quitar") : null,
      h("div", { style: { flex: 1 } }),
      h("button", { class: "btn fantasma", onclick: () => emitir("ir", { seccion: "datos", pestana: "personalizacion" }) }, "Editar paletas de colores")));
  raiz.replaceChildren(cab, selector, variantes, mascara);
}

export const seccionVariantes = {
  id: "variantes", titulo: "Variantes y colores", corto: "Variantes",
  resumen: () => {
    const ps = app.tour.panoramas;
    const n = ps.reduce((s, p) => s + (p.variantes?.length ?? 0), 0), m = ps.filter((p) => p.mascara).length;
    return { texto: n || m ? `${n} variantes · ${m} máscaras` : "Estilos IA, noche, colores", hecho: n > 0 || m > 0 };
  },
  render, actualizar: pintar, alCambiarNodo: pintar, salir: () => { raiz = null; },
  soltar: async (lista) => {
    const p = actual();
    const fotos = lista.filter(({ archivo }) => /\.(jpe?g|png|webp)$/i.test(archivo.name));
    if (!p || !fotos.length) return false;
    const r = await dialogo({ titulo: "¿Qué son estas imágenes?", texto: `Has soltado ${fotos.length} imagen(es) en Variantes.`,
      botones: [{ texto: "Cancelar", valor: null }, { texto: "Fotos 360 nuevas", valor: "fotos" }, { texto: `Variantes de ${nombreDe(p)}`, valor: "var", primario: true }] });
    if (r === "var") { await subirVariantes(p.id, fotos.map((f) => f.archivo)); return true; }
    return r !== "fotos";
  },
};
on("mascara", () => pintar());
