// Paso 2 · Plano (opcional): plano del arquitecto (PDF, DXF o imagen), calibración de escala, colocación de fotos,
// estancias (polígonos) y conexiones. En «Avanzado»: norte, radio de conexión, altura de la cámara, zonas y muros.
// Coordenadas en metros: x → derecha, z → abajo; rumbo 0 = arriba, horario.
import { area, centroide, dentro, redondear, norm360, rumboDe, dimensiones } from "./estudio-util.js";
import { app, h, $, icono, cambiar, emitir, on, toast, pedir, confirmar, dialogo, guardarArchivo, guardarDocumento, urlDe, rutaLibre, idLibre,
  elegirArchivos, cargando, textoDe, fijarTexto, colocado, pano, calcularEnlaces, alternarEnlace, claveEnlace, fmtM2, zonasSugeridas, zonasPublicadas, modoZonas,
  coloresTema, fuenteLienzo, alCambiarTema, deslizador, VIDRIO } from "./estudio-nucleo.js";
import { campoTexto, campo } from "./estudio-campos.js";
import { leerDxf, sugerirUnidades, extension, aMetros, renderizar, FACTOR } from "./estudio-dxf.js";

const HERRAMIENTAS = [
  { id: "sel", nombre: "Seleccionar", tecla: "V", icono: "cursor", pista: "Arrastra fotos y esquinas para ajustarlas. Rueda = zoom; arrastra el fondo para moverte. Supr borra lo seleccionado." },
  { id: "calibrar", nombre: "Calibrar", tecla: "K", icono: "regla", pista: "Haz clic en los dos extremos de una medida que conozcas (p. ej. una pared) del plano." },
  { id: "estancia", nombre: "Estancia", tecla: "E", icono: "poligono", pista: "Clic en cada esquina. Doble clic, Enter o clic en el primer punto para cerrar. Retroceso quita el último punto." },
  { id: "muro", nombre: "Muro", tecla: "M", icono: "muro", pista: "Clic para empezar y en cada esquina. Se ajusta a 90° (Shift para ángulo libre). Esc o doble clic para terminar." },
  { id: "enlace", nombre: "Conectar", tecla: "L", icono: "enlace", pista: "Toca una foto y luego otra para conectarlas (o desconectarlas). Shift para encadenar." },
];
/** Colores de categoría de las estancias (datos): paleta validada (azul, naranja, aguamarina, amarillo, magenta, verde, violeta,
 *  rojo), con su versión para el tema oscuro. Solo distinguen una estancia de otra: el nombre y los m² van siempre rotulados. */
const COLORES_EST = {
  claro: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"],
  oscuro: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
};

const S = {
  esc: 40, ox: 40, oy: 40, ajustado: false,
  herr: "sel", sel: null, borrador: [], calib: [], enlaceDesde: null, raton: null, espacio: false, colocando: null,
  arrastre: null, punteros: new Map(), imgs: new Map(), lienzo: null, ctx: null, sucio: true, ro: null, raf: 0,
};
let raiz = null, lado = null, pista = null, avisoEscala = null;
window.__plano = S; // pruebas automáticas

const planta = () => app.tour.plantas.find((p) => p.id === app.planta) ?? app.tour.plantas[0];
const enPlanta = (p) => (p.planta ?? app.tour.plantas[0]?.id) === planta()?.id;
const aPantalla = (x, z) => [S.ox + x * S.esc, S.oy + z * S.esc];
const aMundo = (sx, sy) => [(sx - S.ox) / S.esc, (sy - S.oy) / S.esc];
const nombreDe = (p) => textoDe(p?.nombre) || p?.id || "";
const estanciasPlanta = () => (app.tour.estancias ?? []).filter((e) => (e.planta ?? app.tour.plantas[0]?.id) === planta()?.id);

function imagen(ruta) {
  if (!ruta) return null;
  let im = S.imgs.get(ruta);
  const url = urlDe(ruta);
  if (!im || im.dataset.url !== url) {
    im = new Image();
    im.dataset.url = url;
    im.onload = () => { if (!S.ajustado) ajustar(); marcar(); };
    im.src = url;
    S.imgs.set(ruta, im);
  }
  return im.complete && im.naturalWidth ? im : null;
}

// ------------------------------------------------------------------ render de la sección
function render(cont) {
  S.ajustado = false; S.sel = null; S.borrador = []; S.calib = []; S.enlaceDesde = null;
  raiz = h("section", { class: "seccion completa" });
  cont.append(raiz);
  const lienzoCont = h("div", { class: "lienzo-plano" });
  S.lienzo = h("canvas", { tabindex: 0, "aria-label": "Plano editable" });
  S.ctx = S.lienzo.getContext("2d");
  pista = h("div", { class: "pista c8-vidrio c8-vidrio--texto" });
  avisoEscala = h("div", { class: "aviso-escala c8-vidrio c8-vidrio--texto", hidden: true });
  const bz = (titulo, fn, ...hijos) => h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--icono c8-boton--s", title: titulo, "aria-label": titulo.replace(/ \(0\)$/, ""), onclick: fn }, ...hijos);
  lienzoCont.append(S.lienzo, pista, avisoEscala, h("div", { class: "zoom c8-vidrio" },
    bz("Acercar", () => zoom(1.25), icono("mas", 16)), bz("Alejar", () => zoom(0.8), icono("menos", 16)), bz("Encuadrar todo (0)", ajustar, icono("ajustar", 16))));
  lado = h("aside", { class: "plano-lado" });
  raiz.append(h("div", { class: `editor-plano ${VIDRIO}` },
    h("div", { class: "plano-centro" }, h("div", { class: "barra-plantas", id: "barra-plantas" }), h("div", { class: "herramientas", id: "herramientas" }), lienzoCont),
    lado));
  S.ro = new ResizeObserver(() => { dimensionar(); if (!S.ajustado) ajustar(); marcar(); });
  S.ro.observe(lienzoCont);
  eventosLienzo();
  pintarUI();
  bucle();
}
function pintarUI() {
  if (!raiz) return;
  pintarPlantas();
  pintarHerramientas();
  pintarLado();
  marcar();
}
function pintarPlantas() {
  const b = $("#barra-plantas");
  if (!b) return;
  b.replaceChildren(...[
    ...app.tour.plantas.map((pl) => h("button", {
      class: "pestana", role: "tab", "aria-selected": String(pl.id === planta().id), text: textoDe(pl.nombre) || pl.id,
      title: "Doble clic para renombrar",
      onclick: () => { app.planta = pl.id; S.sel = null; S.ajustado = false; pintarUI(); ajustar(); },
      ondblclick: () => renombrarPlanta(pl.id),
    })),
    h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--s", title: "Añadir planta", onclick: anadirPlanta }, icono("mas", 15), "Planta"),
    h("div", { class: "relleno" }),
    h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", onclick: subirPlano, title: "Plano del arquitecto: PDF, DXF (AutoCAD, Revit, ArchiCAD), PNG o JPG" }, icono("subir", 15), planta()?.plano?.imagen ? "Cambiar plano" : "Subir plano"),
    (() => {
      // Un solo botón para seguir: «Saltar» mientras no se use el plano; «Continuar» en cuanto se use.
      const sig = app.pasoSiguiente?.("plano");
      if (!sig || !app.tour.panoramas.length) return null;
      const usado = app.tour.panoramas.some(colocado) || app.tour.plantas.some((pl) => pl.plano?.imagen);
      return h("button", { type: "button", class: `c8-boton c8-boton--s ${usado ? "c8-boton--primario" : "c8-boton--secundario"}`, "data-continuar": sig.id, onclick: () => emitir("ir", { seccion: sig.id }) },
        usado ? `Continuar → ${sig.titulo}` : `Saltar → ${sig.titulo}`);
    })(),
  ].filter(Boolean));
}
/** Herramientas a la vista: Calibrar solo con imagen de plano; Muro (solo para la maqueta) en «Avanzado» salvo que ya haya muros. */
const herramientaVisible = (t) => (t.id === "calibrar" ? !!planta()?.plano?.imagen : t.id === "muro" ? S.herr === "muro" || !!planta()?.muros?.length : true);
function pintarHerramientas() {
  const b = $("#herramientas");
  if (!b) return;
  b.replaceChildren(...HERRAMIENTAS.filter(herramientaVisible).map((t) => h("button", {
    type: "button", class: "c8-boton c8-boton--fantasma c8-boton--s", "aria-pressed": String(S.herr === t.id),
    title: `${t.nombre}${app.atajos ? ` (${t.tecla})` : ""}`, onclick: () => fijarHerramienta(t.id),
  }, icono(t.icono, 16), h("span", { text: t.nombre }), h("kbd", { text: t.tecla }))));
  const herr = HERRAMIENTAS.find((t) => t.id === S.herr);
  const hayPorColocar = app.tour.panoramas.some((p) => !colocado(p));
  pista.textContent = S.colocando ? `Toca en el plano el punto donde pusiste la cámara para «${nombreDe(pano(S.colocando))}» (Esc para cancelar).`
    : S.herr === "enlace" && S.enlaceDesde ? `Ahora toca la foto que quieres conectar con «${nombreDe(pano(S.enlaceDesde))}» (Esc para cancelar).`
      : S.herr === "sel" && hayPorColocar ? "Arrastra cada foto al punto del plano donde pusiste la cámara." : herr.pista;
  const pl = planta();
  avisoEscala.hidden = !(pl?.plano?.imagen && !app.tour._estudio.calibrado?.[pl.id]) || S.herr === "calibrar";
  avisoEscala.replaceChildren(icono("regla", 18), h("span", { class: "estirar" }, "Escala sin calibrar: haz clic en «Calibrar» y marca una medida conocida para que las distancias y los m² sean reales."),
    h("button", { type: "button", class: "c8-boton c8-boton--primario c8-boton--s", onclick: () => fijarHerramienta("calibrar") }, "Calibrar"));
}
export function fijarHerramienta(id) {
  S.herr = id; S.borrador = []; S.calib = []; S.enlaceDesde = null;
  if (id !== "sel") S.sel = null;
  pintarHerramientas(); pintarLado(); marcar();
  S.lienzo?.focus();
}

// ------------------------------------------------------------------ panel lateral
function pintarLado() {
  if (!lado) return;
  const t = app.tour, pl = planta();
  const { vecinos } = calcularEnlaces();
  const partes = [];
  if (!t.panoramas.some(colocado) && !pl?.plano?.imagen) {
    partes.push(h("div", { class: "panel-sel inicio" },
      h("b", { text: "El plano es opcional" }),
      h("span", { class: "texto-sec", text: "Sin plano, las fotos se conectan en el orden de la lista (1 → 2 → 3…). Con plano, el cliente ve dónde está (radar) y los m² de cada estancia." })));
  }
  const sel = S.sel;
  // Selección
  if (sel?.tipo === "nodo" && pano(sel.id)) {
    const p = pano(sel.id);
    partes.push(h("h3", { text: "Foto seleccionada" }), h("div", { class: "panel-sel" },
      h("div", { class: "fila sin-salto" }, h("img", { class: "mini", src: urlDe(p.miniatura), alt: "" }), h("b", { class: "cortar", text: nombreDe(p) })),
      h("div", { class: "texto-sec" }, `Conectada con: ${(vecinos.get(p.id) ?? []).map((id) => nombreDe(pano(id))).join(", ") || "ninguna"}`),
      h("details", { class: "posicion-exacta" }, h("summary", { text: "Posición exacta" }), h("div", { class: "fila" },
        campo(() => pano(sel.id), "x", { etiqueta: "x (m)", tipo: "number", paso: 0.05, tipoCambio: "todo", alCambiar: marcar }),
        campo(() => pano(sel.id), "z", { etiqueta: "z (m)", tipo: "number", paso: 0.05, tipoCambio: "todo", alCambiar: marcar }))),
      h("div", { class: "fila" },
        h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", onclick: () => emitir("ir", { seccion: "orientacion" }) }, icono("orientar", 14), "Orientar"),
        h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", onclick: () => { cambiar(() => { const q = pano(sel.id); delete q.x; delete q.z; }); S.sel = null; pintarLado(); } }, "Quitar del plano"))));
  } else if (sel?.tipo === "estancia") {
    const e = t.estancias.find((x) => x.id === sel.id);
    if (e) {
      partes.push(h("h3", { text: "Estancia seleccionada" }), h("div", { class: "panel-sel" },
        campoTexto(() => app.tour.estancias.find((x) => x.id === sel.id), "nombre", { etiqueta: "Nombre", tipo: "todo", alCambiar: marcar }),
        h("div", { class: "campo" }, h("span", { text: "Superficie" }), h("b", { class: "superficie", text: fmtM2(area(e.poligono)) })),
        h("small", { class: "tenue", text: "Arrastra los vértices para ajustar. Doble clic en un borde añade un vértice; Alt+clic en un vértice lo quita." }),
        h("button", { type: "button", class: "c8-boton c8-boton--peligro c8-boton--s", onclick: borrarSeleccion }, icono("basura", 14), "Borrar estancia")));
    }
  } else if (sel?.tipo === "muro") {
    partes.push(h("h3", { text: "Muro seleccionado" }), h("div", { class: "panel-sel" },
      h("div", { class: "suave", text: `Longitud: ${redondear(longMuro(sel.i), 2)} m` }),
      h("button", { type: "button", class: "c8-boton c8-boton--peligro c8-boton--s", onclick: borrarSeleccion }, icono("basura", 14), "Borrar muro")));
  }

  // Fotos sin colocar
  const sinColocar = t.panoramas.filter((p) => !colocado(p));
  partes.push(h("h3", { text: `Fotos sin colocar (${sinColocar.length})` }));
  if (!t.panoramas.length) partes.push(h("p", { class: "texto-sec", text: "Primero sube las fotos 360 en el paso 1." }));
  else if (!sinColocar.length) partes.push(h("p", { class: "texto-sec", text: "Todas las fotos están en el plano." }));
  else {
    for (const p of sinColocar) {
      const f = h("div", { class: "ficha-arrastre", title: "Arrastra al plano" }, h("img", { src: urlDe(p.miniatura), alt: "", draggable: "false" }), h("span", { text: nombreDe(p) }),
        h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", "aria-pressed": String(S.colocando === p.id), title: "Colocar sin arrastrar: pulsa y luego toca el plano",
          onpointerdown: (e) => e.stopPropagation(),
          onclick: () => { S.colocando = S.colocando === p.id ? null : p.id; if (S.herr !== "sel") fijarHerramienta("sel"); pintarLado(); pintarHerramientas(); S.lienzo?.focus(); } },
        S.colocando === p.id ? "Toca el plano…" : "Colocar"));
      f.addEventListener("pointerdown", (e) => iniciarArrastreFicha(e, p.id));
      partes.push(f);
    }
  }
  // Fotos en la planta
  const aqui = t.panoramas.filter((p) => colocado(p) && enPlanta(p));
  if (aqui.length) {
    partes.push(h("h3", { text: `En esta planta (${aqui.length})` }));
    for (const p of aqui) {
      const aislado = t.panoramas.length > 1 && !(vecinos.get(p.id)?.length);
      partes.push(h("div", { class: `fila-lista ${S.sel?.id === p.id ? "sel" : ""}`, onclick: () => { seleccionarNodo(p.id); centrarEn(p.x, p.z); } },
        h("span", { class: "nom", text: nombreDe(p) }), aislado ? h("span", { class: "chip error", text: "sin conectar" }) : h("span", { class: "val", text: `Conectada con ${(vecinos.get(p.id) ?? []).length}` })));
    }
  }
  // Estancias
  const ests = estanciasPlanta();
  partes.push(h("h3", { text: "Estancias" }));
  if (!ests.length) partes.push(h("p", { class: "texto-sec" }, "Dibuja el contorno de cada estancia con la herramienta ", h("b", { text: "Estancia" }), " para mostrar sus m² en el visor."));
  else {
    let total = 0;
    for (const e of ests) {
      const a = area(e.poligono); total += a;
      partes.push(h("div", { class: `fila-lista ${S.sel?.id === e.id ? "sel" : ""}`, onclick: () => { S.sel = { tipo: "estancia", id: e.id }; fijarHerramienta("sel"); S.sel = { tipo: "estancia", id: e.id }; pintarLado(); marcar(); } },
        h("span", { class: "muestra", style: { background: colorEst(e) } }),
        h("span", { class: "nom", text: textoDe(e.nombre) || "Sin nombre" }), h("span", { class: "val", text: fmtM2(a) })));
    }
    partes.push(h("div", { class: "fila-lista total" },
      h("span", { class: "nom", text: "Total útil aprox." }), h("b", { class: "val", text: fmtM2(total) })));
  }
  // Imagen del plano
  if (pl?.plano?.imagen) {
    partes.push(h("h3", { text: "Imagen del plano" }),
      h("div", { class: "texto-sec" }, `${redondear(pl.plano.ancho_m, 2)} × ${redondear(pl.plano.alto_m, 2)} m · `,
        app.tour._estudio.calibrado?.[pl.id] ? h("span", { class: "chip ok", text: "calibrado" }) : h("span", { class: "chip aviso", text: "sin calibrar" })),
      h("div", { class: "fila" },
        h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", onclick: () => fijarHerramienta("calibrar") }, icono("regla", 14), "Calibrar"),
        h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--s", onclick: async () => { if (await confirmar("Quitar imagen del plano", "Las fotos, estancias y muros se mantienen.", "Quitar")) cambiar(() => { delete planta().plano; }); } }, "Quitar")));
  }
  if (app.tour.plantas.length > 1) partes.push(h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--s eliminar-planta", onclick: borrarPlanta }, icono("basura", 14), "Eliminar esta planta"));
  partes.push(panelAvanzado());
  lado.replaceChildren(...partes);
}
let avanzadoAbierto = (() => { try { return localStorage.getItem("estudio:plano-avanzado") === "si"; } catch { return false; } })();
/** «Avanzado» del plano: lo que solo hace falta a veces (norte, radio de conexión, altura de la cámara, zonas y muros). */
function panelAvanzado() {
  const t = app.tour;
  const det = h("details", { class: "avanzado-plano", open: avanzadoAbierto, "data-campo": "plano-avanzado" }, h("summary", { text: "Avanzado" }));
  det.addEventListener("toggle", () => { avanzadoAbierto = det.open; try { localStorage.setItem("estudio:plano-avanzado", det.open ? "si" : "no"); } catch {} });
  // Norte
  const aguja = anguloNorte();
  const dial = h("div", { class: "dial-norte", title: "Arrastra la flecha hacia el norte del plano", role: "slider", "aria-label": "Dirección del norte en el plano", "aria-valuemin": 0, "aria-valuemax": 359, "aria-valuenow": aguja, "aria-valuetext": `${aguja} grados`, tabindex: 0 },
    h("div", { class: "aguja", style: { transform: `rotate(${aguja}deg)` } }), h("div", { class: "centro" }));
  eventosDial(dial);
  const inpNorte = h("input", { type: "text", inputmode: "numeric", value: aguja, class: "corto", "aria-label": "Norte en grados" });
  inpNorte.oninput = () => { const v = Number(String(inpNorte.value).replace(",", ".")); if (Number.isFinite(v)) fijarNorte(v, false); };
  // Conexiones automáticas
  const radio = deslizador({ min: 1, max: 10, step: 0.5, value: t.radio_enlace_auto ?? 4.5, "aria-label": "Distancia para conectar fotos automáticamente" });
  const metros = (v) => `${String(v).replace(".", ",")} m`;
  const radioVal = h("b", { text: metros(t.radio_enlace_auto ?? 4.5) });
  radio.setAttribute("aria-valuetext", metros(t.radio_enlace_auto ?? 4.5));
  radio.oninput = () => { radioVal.textContent = metros(radio.value); radio.setAttribute("aria-valuetext", metros(radio.value)); cambiar((tt) => { tt.radio_enlace_auto = Number(radio.value); }, { clave: "radio", render: false }); marcar(); };
  radio.onchange = () => pintarLado();
  const linea = (clase, texto) => h("span", {}, h("i", { class: clase, "aria-hidden": "true" }), texto);
  const modo = modoZonas(t), nZonas = zonasPublicadas(t)?.length ?? 0;
  const textoZonas = modo === "editadas" ? `${nZonas} zonas a tu medida.` : modo === "ninguna" ? "Sin zonas: las estancias se ven en una sola lista."
    : modo === "plantas" ? "Con varias plantas, el cliente ve las estancias agrupadas por planta."
    : nZonas ? `Automáticas: ${nZonas} zonas según los nombres de las estancias.` : "Automáticas: aparecen en cuanto haya estancias de día y de noche (o exteriores).";
  det.append(h("div", { class: "contenido-avanzado" },
    h("h3", { text: "Norte" }),
    h("div", { class: "fila sin-salto" }, dial,
      h("div", { class: "campo" }, h("span", { text: "Hacia dónde está el norte (°, 0 = arriba)" }), inpNorte, h("small", { text: "Para la orientación (sur, etc.) y la luz." }))),
    h("h3", { text: "Conexiones entre fotos" }),
    h("div", { class: "campo" }, h("span", {}, "Conectar fotos a menos de ", radioVal), radio),
    h("div", { class: "leyenda-enlaces" },
      linea("", "automática (por distancia)"), linea("manual", "manual (herramienta Conectar)"), linea("quitado", "automática quitada")),
    h("h3", { text: "Altura de la cámara" }),
    campo(() => app.tour, "altura_camara", { etiqueta: "Altura del trípode (m)", tipo: "number", min: 0.5, max: 3, paso: 0.05, tipoCambio: "todo", ayuda: "La Guía Osmo 360 recomienda 1,5 m." }),
    h("h3", { text: "Zonas de la vivienda" }),
    h("p", { class: "texto-sec", text: textoZonas }),
    h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", "data-campo": "zonas", onclick: dialogoZonas }, "Ver o cambiar zonas…"),
    h("h3", { text: "Muros (para la maqueta 3D)" }),
    h("p", { class: "texto-sec", text: planta()?.muros?.length ? `${planta().muros.length} tramos en esta planta.` : "Un DXF ya los trae. A mano: clic en cada esquina." }),
    h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", onclick: () => fijarHerramienta("muro") }, icono("muro", 14), "Dibujar muros")));
  return det;
}

// ------------------------------------------------------------------ zonas de la vivienda (secciones del tour)
/** Zonas (E16): automáticas según los nombres; cambiar la zona de una estancia o un nombre las convierte en «a tu medida». */
function dialogoZonas() {
  const cont = h("div", { class: "editor-zonas" });
  const pintarZ = () => {
    const t = app.tour, modo = modoZonas(t), activo = modo === "editadas";
    const lista = activo ? t.secciones : zonasSugeridas(t);
    const materializar = () => { if (!Array.isArray(app.tour.secciones)) app.tour.secciones = zonasSugeridas(app.tour); delete app.tour._estudio.sinZonas; };
    const de = (pid) => lista.findIndex((s) => (s.estancias ?? []).includes(pid));
    const accion = (texto, fn) => h("button", { type: "button", class: "c8-boton c8-boton--s c8-boton--secundario", onclick: () => { cambiar(fn, { tipo: "datos" }); pintarZ(); } }, texto);
    const estado = { editadas: ["chip acento", "A tu medida"], automaticas: ["chip acento", "Automáticas"], plantas: ["chip", "Por plantas"], ninguna: ["chip", "Sin zonas"] }[modo];
    const nota = { editadas: "Las zonas que has ajustado. «Volver a automáticas» las recalcula con los nombres de las estancias.",
      automaticas: zonasPublicadas(t) ? "Se calculan solas con los nombres de las estancias. Cambia la zona de una estancia si no encaja."
        : "Se calculan solas con los nombres de las estancias. Ahora todas caen en la misma zona, así que el cliente las ve en una sola lista.",
      plantas: "Con varias plantas, el cliente ve las estancias agrupadas por planta. Cambia la zona de una estancia para agruparlas por zonas.",
      ninguna: "El cliente ve todas las estancias en una sola lista." }[modo];
    cont.replaceChildren(
      h("div", { class: "fila" },
        h("span", { class: estado[0], text: estado[1] }),
        h("div", { class: "relleno" }),
        activo ? accion("Añadir zona", () => { app.tour.secciones.push({ id: `zona-${app.tour.secciones.length + 1}`, nombre: { es: "Nueva zona" }, estancias: [] }); }) : null,
        activo ? accion("Volver a automáticas", () => { delete app.tour.secciones; }) : null,
        modo === "ninguna" ? accion("Usar zonas automáticas", () => { delete app.tour._estudio.sinZonas; })
          : accion("No usar zonas", () => { delete app.tour.secciones; app.tour._estudio.sinZonas = true; })),
      h("p", { class: "c8-sec", text: nota }),
      activo ? h("div", { class: "lista-zonas" }, t.secciones.map((z, i) => h("div", { class: "fila sin-salto" },
        h("div", { class: "estirar" }, campoTexto(() => app.tour.secciones[i], "nombre", { etiqueta: "Nombre de la zona", compacto: true, tipo: "datos" })),
        h("span", { class: "chip", text: `${z.estancias?.length ?? 0} estancias` }),
        h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--icono c8-boton--s", "aria-label": "Quitar zona", onclick: () => { cambiar(() => { app.tour.secciones.splice(i, 1); }, { tipo: "datos" }); pintarZ(); } }, icono("basura", 15))))) : null,
      t.panoramas.length ? h("div", { class: "lista-zonas" }, t.panoramas.map((p) => {
        const sel = h("select", { "aria-label": `Zona de ${textoDe(p.nombre)}` }, h("option", { value: "-1", text: "— Sin zona —" }), lista.map((z, i) => h("option", { value: String(i), text: textoDe(z.nombre) })));
        sel.value = String(de(p.id));
        sel.onchange = () => { cambiar(() => { materializar(); for (const z of app.tour.secciones) z.estancias = (z.estancias ?? []).filter((x) => x !== p.id); const j = Number(sel.value); if (j >= 0) app.tour.secciones[j].estancias.push(p.id); }, { tipo: "datos" }); pintarZ(); };
        return h("div", { class: "fila sin-salto" },
          h("img", { class: "mini", src: urlDe(p.miniatura), alt: "" }),
          h("span", { class: "estirar", text: textoDe(p.nombre) || p.id }), sel);
      })) : h("p", { class: "c8-sec", text: "Añade fotos para agruparlas." }));
  };
  pintarZ();
  dialogo({ titulo: "Zonas de la vivienda", ancho: "min(40rem, calc(100vw - 2rem))", texto: "El cliente encuentra las estancias agrupadas en el visor y al preguntar por una zona.",
    cuerpo: cont, botones: [{ texto: "Hecho", primario: true, valor: null }] }).then(() => pintarLado());
}

const colorEst = (e) => { const l = COLORES_EST[document.documentElement.dataset.tema === "claro" ? "claro" : "oscuro"]; return l[Math.abs([...e.id].reduce((s, c) => s * 31 + c.charCodeAt(0), 7)) % l.length]; };
function longMuro(i) { const m = planta().muros?.[i]; return m ? Math.hypot(m[2] - m[0], m[3] - m[1]) : 0; }

// ------------------------------------------------------------------ plantas
async function anadirPlanta() {
  const n = app.tour.plantas.length;
  const sug = ["Planta baja", "Planta primera", "Planta segunda", "Sótano", "Buhardilla"][n] ?? `Planta ${n + 1}`;
  const nombre = await pedir("Nueva planta", "Nombre", sug);
  if (!nombre) return;
  const id = idLibre(`p${n}`, app.tour.plantas.map((p) => p.id));
  cambiar((t) => { t.plantas.push({ id, nombre: { es: nombre } }); });
  app.planta = id; S.ajustado = false;
  pintarUI(); ajustar();
}
async function renombrarPlanta(id) {
  const pl = app.tour.plantas.find((p) => p.id === id);
  const nombre = await pedir("Renombrar planta", "Nombre", textoDe(pl.nombre));
  if (nombre) cambiar(() => fijarTexto(app.tour.plantas.find((x) => x.id === id), "nombre", "es", nombre));
}
async function borrarPlanta() {
  const pl = planta();
  if (!(await confirmar("Eliminar planta", `Se eliminará «${textoDe(pl.nombre)}» con su plano, estancias y muros. Sus fotos quedarán sin colocar.`))) return;
  cambiar((t) => {
    t.plantas = t.plantas.filter((p) => p.id !== pl.id);
    t.estancias = t.estancias.filter((e) => e.planta !== pl.id);
    for (const p of t.panoramas) if (p.planta === pl.id) { delete p.x; delete p.z; p.planta = t.plantas[0].id; }
  });
  app.planta = app.tour.plantas[0].id;
  pintarUI(); ajustar();
}
// ------------------------------------------------------------------ planos de arquitecto
const extDe = (n) => (n.split(".").pop() || "").toLowerCase();
/** Plano del arquitecto: PDF (elige la página), DXF (a escala, con muros) o imagen. El original queda como documento privado. */
export async function importarPlanoArquitecto(f, plantaId = app.planta) {
  const e = extDe(f.name);
  if (e === "dwg") {
    return dialogo({ titulo: "DWG no se puede leer en el navegador", texto: "Pide al arquitecto el plano exportado a DXF (AutoCAD: Guardar como → DXF; Revit/ArchiCAD: Exportar → DXF) o a PDF, y súbelo aquí.", botones: [{ texto: "Entendido", primario: true }] });
  }
  if (e === "pdf" || f.type === "application/pdf") return importarPdf(f, plantaId);
  if (e === "dxf") return importarDxf(f, plantaId);
  if (/^image\//.test(f.type) || /^(png|jpe?g|webp|svg)$/.test(e)) return ponerImagenPlano(plantaId, f);
  toast("Formato de plano no reconocido (usa PDF, DXF, PNG o JPG)", "aviso");
}

let pdfjs = null;
async function cargarPdfjs() {
  if (pdfjs) return pdfjs;
  pdfjs = await import("./vendor/pdfjs/pdf.min.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdfjs/pdf.worker.min.mjs", import.meta.url).href;
  return pdfjs;
}
async function importarPdf(f, plantaId) {
  const capa = cargando("Leyendo el PDF…");
  try {
    const lib = await cargarPdfjs();
    const doc = await lib.getDocument({ data: new Uint8Array(await f.arrayBuffer()), standardFontDataUrl: new URL("./vendor/pdfjs/standard_fonts/", import.meta.url).href }).promise;
    let num = 1;
    capa.remove();
    if (doc.numPages > 1) {
      // Miniaturas de las páginas para elegir
      const cont = h("div", { class: "paginas-pdf" });
      let elegida = 1;
      const botones = [];
      for (let i = 1; i <= Math.min(doc.numPages, 24); i++) {
        const pg = await doc.getPage(i);
        const vp = pg.getViewport({ scale: 1 });
        const k = 160 / Math.max(vp.width, vp.height);
        const c = h("canvas", { width: Math.round(vp.width * k), height: Math.round(vp.height * k) });
        const gc = c.getContext("2d");
        gc.fillStyle = PAPEL; gc.fillRect(0, 0, c.width, c.height);
        await pg.render({ canvasContext: gc, viewport: pg.getViewport({ scale: k }) }).promise;
        const b = h("button", { type: "button", class: "c8-boton c8-boton--secundario", "aria-pressed": String(i === 1), onclick: () => { elegida = i; botones.forEach((x, j) => x.setAttribute("aria-pressed", String(j + 1 === i))); } }, c, `Página ${i}`);
        botones.push(b); cont.append(b);
      }
      const r = await dialogo({ titulo: "¿Qué página es el plano de esta planta?", cuerpo: cont, ancho: "min(45rem, calc(100vw - 2rem))",
        botones: [{ texto: "Cancelar", valor: null }, { texto: "Usar esta página", primario: true, valor: () => elegida }] });
      if (!r) return;
      num = r;
    }
    const c2 = cargando(`Convirtiendo la página ${num} en imagen…`);
    try {
      const pg = await doc.getPage(num);
      const vp = pg.getViewport({ scale: 1 });
      const k = Math.min(4000 / Math.max(vp.width, vp.height), 8);
      const v2 = pg.getViewport({ scale: k });
      const c = new OffscreenCanvas(Math.round(v2.width), Math.round(v2.height));
      const g = c.getContext("2d");
      g.fillStyle = PAPEL; g.fillRect(0, 0, c.width, c.height);
      await pg.render({ canvasContext: g, viewport: v2 }).promise;
      const png = await c.convertToBlob({ type: "image/png" });
      await guardarDocumento(f, "plano", { nombre: `${f.name.replace(/\.[^.]+$/, "")}${doc.numPages > 1 ? ` (pág. ${num})` : ""}` });
      await ponerImagenPlano(plantaId, png);
      emitir("ir", { seccion: "plano" });
    } finally { c2.remove(); }
  } catch (e) {
    console.error(e);
    toast(`No se pudo leer el PDF: ${e.message}`, "error", 6000);
  } finally { capa.remove(); }
}

async function importarDxf(f, plantaId) {
  let dxf;
  try { dxf = leerDxf(await f.text()); } catch (e) { return toast(`No se pudo leer el DXF: ${e.message}`, "error", 6000); }
  if (!dxf.segs.length) return toast("El DXF no tiene líneas en el espacio modelo (¿están dentro de bloques?). Explota los bloques y vuelve a exportar.", "aviso", 7000);
  const capas = [...dxf.capas.entries()].sort((a, b) => b[1] - a[1]);
  const esMuro = (c) => /mur|wall|tabiq|cerram|fachad|a-wall|partition|m-|muro/i.test(c);
  const marcadas = new Set(capas.filter(([c]) => esMuro(c)).map(([c]) => c));
  if (!marcadas.size) capas.forEach(([c]) => marcadas.add(c));
  let unidad = dxf.unidades ?? sugerirUnidades(dxf.segs);
  const selU = h("select", { "aria-label": "Unidades" }, Object.keys(FACTOR).map((u) => h("option", { value: u, text: { mm: "Milímetros", cm: "Centímetros", dm: "Decímetros", m: "Metros", in: "Pulgadas", ft: "Pies" }[u] })));
  selU.value = unidad;
  const info = h("small", { class: "texto-pie" });
  const prev = h("canvas", { class: "vista-dxf", width: 640, height: 360 });
  const usarImagen = h("input", { type: "checkbox", checked: true });
  const pintarPrev = () => {
    unidad = selU.value;
    const e = extension(dxf.segs);
    info.textContent = `${dxf.unidades ? `Unidades del archivo: ${dxf.unidades}. ` : "El archivo no indica unidades. "}Tamaño: ${redondear(e.w * FACTOR[unidad], 2)} × ${redondear(e.h * FACTOR[unidad], 2)} m`;
    const g = prev.getContext("2d"); g.fillStyle = PAPEL; g.fillRect(0, 0, prev.width, prev.height);
    const k = Math.min((prev.width - 20) / e.w, (prev.height - 20) / e.h);
    for (const s of dxf.segs) {
      const sel = marcadas.has(s.capa);
      g.strokeStyle = sel ? TINTA : TINTA_SUAVE; g.lineWidth = sel ? 1.6 : 0.8; // dibujo del arquitecto (dato): muros en tinta negra, el resto gris
      g.beginPath(); g.moveTo(10 + (s.x1 - e.x0) * k, 10 + (e.y1 - s.y1) * k); g.lineTo(10 + (s.x2 - e.x0) * k, 10 + (e.y1 - s.y2) * k); g.stroke();
    }
  };
  selU.onchange = pintarPrev;
  const listaCapas = h("div", { class: "capas-dxf" },
    capas.map(([c, n]) => {
      const i = h("input", { type: "checkbox", checked: marcadas.has(c) });
      i.onchange = () => { i.checked ? marcadas.add(c) : marcadas.delete(c); pintarPrev(); };
      return h("label", { class: "check" }, i, h("span", { class: "estirar", text: c }), h("span", { class: "tenue", text: `${n}` }));
    }));
  const cuerpo = h("div", { class: "pila" },
    h("div", { class: "fila" }, h("div", { class: "campo" }, h("span", { text: "Unidades del dibujo" }), selU), info),
    h("div", { class: "campo" }, h("span", { text: "Capas que son muros (se dibujan en el visor)" }), listaCapas),
    prev,
    h("label", { class: "check" }, usarImagen, "Usar el dibujo completo como imagen del plano (ya a escala)"));
  setTimeout(pintarPrev, 0);
  const ok = await dialogo({ titulo: `Importar ${f.name}`, cuerpo, ancho: "min(45rem, calc(100vw - 2rem))", botones: [{ texto: "Cancelar", valor: false }, { texto: "Importar plano", primario: true, valor: true }] });
  if (!ok) return;
  const factor = FACTOR[unidad];
  const e = extension(dxf.segs);
  const todos = aMetros(dxf.segs, factor, e);
  const muros = aMetros(dxf.segs.filter((s) => marcadas.has(s.capa)), factor, e);
  const anchoM = e.w * factor, altoM = e.h * factor;
  if (anchoM > 400 || anchoM < 1) {
    if (!(await confirmar("¿Unidades correctas?", `Con «${unidad}» el plano mediría ${redondear(anchoM, 1)} m de ancho. ¿Continuar?`, "Continuar"))) return;
  }
  await guardarDocumento(f, "plano");
  if (usarImagen.checked) {
    const png = await renderizar(todos, anchoM, altoM, { px: 3000, resaltar: muros });
    await ponerImagenPlano(plantaId, png, { ancho_m: anchoM, calibrado: true, silencioso: true });
  }
  cambiar((t) => {
    const pl = t.plantas.find((x) => x.id === plantaId);
    pl.muros = muros;
    if (!usarImagen.checked) { t._estudio.calibrado ??= {}; t._estudio.calibrado[plantaId] = true; }
  });
  toast(`Plano DXF importado a escala: ${redondear(anchoM, 2)} × ${redondear(altoM, 2)} m, ${muros.length} tramos de muro`, "ok", 5000);
  if (muros.length > 4000) toast("Hay muchos tramos de muro: el visor puede ir más lento. Desmarca capas de detalle (mobiliario, cotas, sombreados).", "aviso", 7000);
  emitir("ir", { seccion: "plano" });
}

async function subirPlano(archivoDado) {
  const [f] = archivoDado instanceof File ? [archivoDado] : await elegirArchivos({ aceptar: "image/png,image/jpeg,image/webp,image/svg+xml,application/pdf,.pdf,.dxf,.dwg" });
  if (!f) return;
  await importarPlanoArquitecto(f, planta().id);
}

/** Pone una imagen como plano de una planta. opciones: {ancho_m, calibrado} (p. ej. desde un DXF a escala). */
export async function ponerImagenPlano(plantaId, f, { ancho_m = null, calibrado = false, silencioso = false } = {}) {
  let blob = f, dim = await dimensiones(f).catch(() => null);
  if (f.type === "image/svg+xml") dim = null;
  try {
    const bmp = await createImageBitmap(f);
    dim = { w: bmp.width, h: bmp.height };
    if (bmp.width > 6000 || bmp.height > 6000) {
      const k = 4096 / Math.max(bmp.width, bmp.height);
      const c = new OffscreenCanvas(Math.round(bmp.width * k), Math.round(bmp.height * k));
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      blob = await c.convertToBlob({ type: "image/png" });
      dim = { w: c.width, h: c.height };
    }
    bmp.close();
  } catch { /* SVG u otros: se usa tal cual */ }
  const ext = blob.type === "image/png" ? "png" : blob.type === "image/svg+xml" ? "svg" : blob.type === "image/webp" ? "webp" : "jpg";
  const ruta = rutaLibre(`plantas/${plantaId}`, ext);
  await guardarArchivo(ruta, blob);
  const aspecto = dim ? dim.h / dim.w : 0.75;
  cambiar((t) => {
    const p = t.plantas.find((x) => x.id === plantaId);
    const ancho = ancho_m ?? p.plano?.ancho_m ?? 12;
    p.plano = { imagen: ruta, ancho_m: redondear(ancho, 3), alto_m: redondear(ancho * aspecto, 3), origen: p.plano?.origen ?? [0, 0] };
    t._estudio.calibrado ??= {};
    if (calibrado) t._estudio.calibrado[p.id] = true;
    else if (!t._estudio.calibrado[p.id]) t._estudio.calibrado[p.id] = false;
  });
  app.planta = plantaId;
  S.ajustado = false;
  if (raiz) { pintarUI(); ajustar(); }
  if (!silencioso && !calibrado) {
    toast("Plano añadido. Ahora calibra la escala con una medida conocida.", "ok", 4000);
    if (raiz) fijarHerramienta("calibrar");
  }
}

// ------------------------------------------------------------------ vista (zoom/encuadre)
function dimensionar() {
  const c = S.lienzo; if (!c) return;
  const r = c.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = Math.max(1, Math.round(r.width * dpr)); c.height = Math.max(1, Math.round(r.height * dpr));
  S.dpr = dpr; S.w = r.width; S.h = r.height;
}
function limites() {
  const pl = planta();
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  const inc = (x, z) => { x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); };
  if (pl?.plano?.imagen) { const [ox, oz] = pl.plano.origen ?? [0, 0]; inc(ox, oz); inc(ox + pl.plano.ancho_m, oz + pl.plano.alto_m); }
  for (const p of app.tour.panoramas) if (colocado(p) && enPlanta(p)) inc(p.x, p.z);
  for (const e of estanciasPlanta()) for (const [x, z] of e.poligono) inc(x, z);
  for (const m of pl?.muros ?? []) { inc(m[0], m[1]); inc(m[2], m[3]); }
  if (!Number.isFinite(x0)) { x0 = 0; z0 = 0; x1 = 12; z1 = 9; }
  if (x1 - x0 < 4) { x0 -= 2; x1 += 2; }
  if (z1 - z0 < 4) { z0 -= 2; z1 += 2; }
  return { x0, z0, x1, z1 };
}
function ajustar() {
  if (!S.w) return;
  const { x0, z0, x1, z1 } = limites();
  const m = 48;
  S.esc = Math.min((S.w - 2 * m) / (x1 - x0), (S.h - 2 * m - 30) / (z1 - z0));
  S.esc = Math.max(4, Math.min(S.esc, 400));
  S.ox = (S.w - (x1 - x0) * S.esc) / 2 - x0 * S.esc;
  S.oy = (S.h - 30 - (z1 - z0) * S.esc) / 2 - z0 * S.esc;
  S.ajustado = true;
  marcar();
}
function zoom(f, cx = S.w / 2, cy = S.h / 2) {
  const nueva = Math.max(3, Math.min(S.esc * f, 600));
  const k = nueva / S.esc;
  S.ox = cx - (cx - S.ox) * k; S.oy = cy - (cy - S.oy) * k; S.esc = nueva;
  marcar();
}
function centrarEn(x, z) { S.ox = S.w / 2 - x * S.esc; S.oy = S.h / 2 - z * S.esc; marcar(); }

// ------------------------------------------------------------------ dibujo
function marcar() { S.sucio = true; }
function bucle() {
  if (!raiz) return;
  if (S.sucio) { S.sucio = false; dibujar(); }
  S.raf = requestAnimationFrame(bucle);
}
// Colores del lienzo: tokens de tema.css, releídos al cambiar de tema o de talla («cre8:tema»). El texto va siempre en los
// colores del texto sobre un rótulo de vidrio denso (legible sobre el papel del plano y sobre el fondo, en los dos temas).
let PAL = null;
function pal() {
  if (PAL) return PAL;
  const c = coloresTema({ acento: "--c-acento", sobreAcento: "--c-sobre-acento", acentoTexto: "--c-acento-texto", texto: "--c-texto", texto2: "--c-texto-2",
    rejilla: "--c-borde", marco: "--c-borde-2", rotulo: "--vidrio-denso", sup3: "--c-sup-3", fondo: "--c-fondo", error: "--c-error", info: "--c-info" });
  const claro = document.documentElement.dataset.tema === "claro";
  PAL = { ...c, claro,
    linea: claro ? c.acentoTexto : c.acento,          // conexiones y trazos de acento (en claro, el champán oscuro: se ve sobre el papel)
    nodo: claro ? c.texto : c.sup3, numNodo: claro ? c.fondo : c.texto, // las fotos, disco oscuro con número claro en los dos temas
    papel: claro ? 1 : 0.84,                          // en oscuro el papel del plano se atenúa para no deslumbrar
    f: { nombre: fuenteLienzo(600, 0.78), dato: fuenteLienzo(500, 0.75), num: fuenteLienzo(700, 0.69), rotulo: fuenteLienzo(600, 0.75),
      etiqueta: fuenteLienzo(700, 0.81), peq: fuenteLienzo(600, 0.72), norte: fuenteLienzo(700, 0.63) } };
  return PAL;
}
alCambiarTema(() => { PAL = null; if (raiz) { pintarLado(); marcar(); } });
/** Papel y tinta del plano del arquitecto (datos: el dibujo es negro sobre blanco), bajo la imagen por si es transparente. */
const PAPEL = "#ffffff", TINTA = "#14161a", TINTA_SUAVE = "#c5c9cf";
/** Color con transparencia (para los degradados); los tokens del acento son hexadecimales. */
const alfa = (color, a) => (/^#[0-9a-f]{6}$/i.test(color) ? `rgba(${[1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)).join(", ")}, ${a})` : color);
/** Trazo con halo: legible sobre el papel claro y sobre el fondo oscuro. */
function trazoConHalo(g, color, ancho, dibujarTrazo) {
  const P = pal();
  g.strokeStyle = P.rotulo; g.lineWidth = ancho + 2.5; dibujarTrazo(); g.stroke();
  g.strokeStyle = color; g.lineWidth = ancho; dibujarTrazo(); g.stroke();
}
function dibujar() {
  const c = S.lienzo, g = S.ctx;
  if (!c || !S.w) return;
  const P = pal();
  g.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  g.clearRect(0, 0, S.w, S.h);
  const pl = planta(), t = app.tour;
  // Plano
  if (pl?.plano?.imagen) {
    const im = imagen(pl.plano.imagen);
    const [ox, oz] = pl.plano.origen ?? [0, 0];
    const [sx, sy] = aPantalla(ox, oz);
    const w = pl.plano.ancho_m * S.esc, hh = pl.plano.alto_m * S.esc;
    g.globalAlpha = P.papel;
    g.fillStyle = PAPEL; g.fillRect(sx, sy, w, hh);
    if (im) { g.imageSmoothingQuality = "high"; g.drawImage(im, sx, sy, w, hh); }
    g.globalAlpha = 1;
    g.strokeStyle = P.marco; g.lineWidth = 1; g.strokeRect(sx + 0.5, sy + 0.5, w, hh);
  }
  // Rejilla métrica (cada 5 m, más marcada)
  const paso = S.esc > 60 ? 0.5 : S.esc > 18 ? 1 : 5;
  const [mx0, mz0] = aMundo(0, 0), [mx1, mz1] = aMundo(S.w, S.h);
  g.lineWidth = 1; g.strokeStyle = P.rejilla;
  for (let x = Math.floor(mx0 / paso) * paso; x <= mx1; x += paso) {
    const sx = Math.round(S.ox + x * S.esc) + 0.5;
    g.globalAlpha = Math.abs(x % 5) < 1e-6 ? 1 : 0.4;
    g.beginPath(); g.moveTo(sx, 0); g.lineTo(sx, S.h); g.stroke();
  }
  for (let z = Math.floor(mz0 / paso) * paso; z <= mz1; z += paso) {
    const sy = Math.round(S.oy + z * S.esc) + 0.5;
    g.globalAlpha = Math.abs(z % 5) < 1e-6 ? 1 : 0.4;
    g.beginPath(); g.moveTo(0, sy); g.lineTo(S.w, sy); g.stroke();
  }
  g.globalAlpha = 1;
  // Estancias: el color (dato) las distingue; el nombre y los m², en los colores del texto
  g.textAlign = "center"; g.textBaseline = "middle";
  for (const e of estanciasPlanta()) {
    const col = colorEst(e);
    const selE = S.sel?.tipo === "estancia" && S.sel.id === e.id;
    g.beginPath();
    e.poligono.forEach(([x, z], i) => { const [sx, sy] = aPantalla(x, z); i ? g.lineTo(sx, sy) : g.moveTo(sx, sy); });
    g.closePath();
    g.fillStyle = col + (selE ? "40" : "22"); g.fill();
    g.strokeStyle = col + (selE ? "ff" : "b0"); g.lineWidth = selE ? 2.5 : 1.5; g.stroke();
    const [cx, cz] = centroide(e.poligono);
    let [sx, sy] = aPantalla(cx, cz);
    // Si una foto cae cerca del centro, la etiqueta sube para no taparla.
    if (app.tour.panoramas.some((p) => colocado(p) && enPlanta(p) && Math.hypot(...aPantalla(p.x, p.z).map((v, k) => v - [sx, sy][k])) < 46)) {
      const top = Math.min(...e.poligono.map(([, z]) => aPantalla(0, z)[1]));
      sy = Math.max(top + 24, sy - 48);
    }
    const nom = textoDe(e.nombre) || "Estancia", ar = fmtM2(area(e.poligono));
    g.font = P.f.nombre; const wn = g.measureText(nom).width;
    g.font = P.f.dato; const wa = g.measureText(ar).width;
    const ancho = Math.max(wn, wa) + 16;
    g.fillStyle = P.rotulo; redondo(g, sx - ancho / 2, sy - 19, ancho, 38, 8); g.fill();
    g.fillStyle = P.texto2; g.fillText(ar, sx, sy + 8);
    g.font = P.f.nombre; g.fillStyle = P.texto; g.fillText(nom, sx, sy - 7);
    if (selE) for (const [x, z] of e.poligono) { const [vx, vy] = aPantalla(x, z); g.fillStyle = P.rotulo; g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.arc(vx, vy, 5.5, 0, 7); g.fill(); g.stroke(); }
  }
  // Muros
  g.lineCap = "round";
  (pl?.muros ?? []).forEach((m, i) => {
    const [a, b] = [aPantalla(m[0], m[1]), aPantalla(m[2], m[3])];
    const selM = S.sel?.tipo === "muro" && S.sel.i === i;
    g.strokeStyle = selM ? P.linea : P.texto2; g.lineWidth = Math.max(3, 0.12 * S.esc);
    g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke();
  });
  // Enlaces
  const { auto, manual, quitados, efectivos } = calcularEnlaces();
  const linea = (k, estilo) => {
    const [a, b] = k.split("|").map(pano);
    if (!a || !b || !colocado(a) || !colocado(b) || !enPlanta(a) || !enPlanta(b)) return;
    const [x1, y1] = aPantalla(a.x, a.z), [x2, y2] = aPantalla(b.x, b.z);
    g.setLineDash(estilo.dash ?? []); g.strokeStyle = estilo.color; g.lineWidth = estilo.ancho; g.globalAlpha = estilo.alfa ?? 1;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
  };
  if (S.herr === "enlace") for (const k of quitados) if (auto.has(k)) linea(k, { color: P.error, alfa: 0.6, ancho: 1.5, dash: [5, 5] });
  for (const k of efectivos) linea(k, manual.has(k) ? { color: P.linea, ancho: 2.5 } : { color: P.linea, alfa: 0.8, ancho: 1.8, dash: [7, 5] });
  // Radio de enlace (al arrastrar una foto)
  if (S.arrastre?.tipo === "nodo") {
    const p = pano(S.arrastre.id);
    if (p) { const [sx, sy] = aPantalla(p.x, p.z); g.strokeStyle = P.linea; g.globalAlpha = 0.45; g.setLineDash([4, 6]); g.beginPath(); g.arc(sx, sy, (t.radio_enlace_auto ?? 4.5) * S.esc, 0, 7); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; }
  }
  // Fotos (nodos)
  const { vecinos } = calcularEnlaces();
  t.panoramas.forEach((p, i) => {
    if (!colocado(p) || !enPlanta(p)) return;
    const [sx, sy] = aPantalla(p.x, p.z);
    const actual = p.id === app.nodo, selN = S.sel?.tipo === "nodo" && S.sel.id === p.id;
    const aislado = t.panoramas.length > 1 && !(vecinos.get(p.id)?.length);
    // Cono de la vista actual de la vista previa
    if (actual && app.vista && app.vista.nodo === p.id && Number.isFinite(app.vista.rumbo)) {
      const r = (app.vista.rumbo * Math.PI) / 180, ap = ((app.vista.fov ?? 75) * Math.PI) / 360;
      const grad = g.createRadialGradient(sx, sy, 4, sx, sy, 60);
      grad.addColorStop(0, alfa(P.acento, 0.55)); grad.addColorStop(1, alfa(P.acento, 0));
      g.fillStyle = grad; g.beginPath(); g.moveTo(sx, sy);
      g.arc(sx, sy, 60, r - Math.PI / 2 - ap, r - Math.PI / 2 + ap); g.closePath(); g.fill();
    }
    // Dirección del centro de la foto (yaw)
    const yaw = ((p.yaw ?? 0) * Math.PI) / 180;
    trazoConHalo(g, P.texto, 2, () => { g.beginPath(); g.moveTo(sx + Math.sin(yaw) * 11, sy - Math.cos(yaw) * 11); g.lineTo(sx + Math.sin(yaw) * 21, sy - Math.cos(yaw) * 21); });
    g.beginPath(); g.arc(sx, sy, 11, 0, 7);
    g.fillStyle = aislado ? P.error : actual ? P.acento : P.nodo; g.fill();
    const marcada = selN || S.enlaceDesde === p.id;
    g.lineWidth = marcada ? 3 : 1.5; g.strokeStyle = marcada || actual ? P.texto : P.acento; g.stroke();
    g.fillStyle = actual ? P.sobreAcento : aislado ? P.fondo : P.numNodo; g.font = P.f.num; g.fillText(String(i + 1), sx, sy + 0.5);
    g.font = P.f.rotulo;
    const nom = nombreDe(p); const wn = g.measureText(nom).width + 12;
    g.fillStyle = P.rotulo; redondo(g, sx - wn / 2, sy + 15, wn, 20, 7); g.fill();
    g.fillStyle = P.texto; g.fillText(nom, sx, sy + 25.5);
  });
  // Borrador de estancia / muro
  const raton = S.raton;
  if (S.herr === "estancia" && S.borrador.length) {
    const pts = [...S.borrador, ...(raton ? [ajustarPunto(raton, true)] : [])];
    g.beginPath(); pts.forEach(([x, z], i) => { const [sx, sy] = aPantalla(x, z); i ? g.lineTo(sx, sy) : g.moveTo(sx, sy); });
    g.closePath(); g.globalAlpha = 0.15; g.fillStyle = P.acento; g.fill(); g.globalAlpha = 1;
    g.strokeStyle = P.linea; g.lineWidth = 2; g.setLineDash([6, 4]); g.stroke(); g.setLineDash([]);
    S.borrador.forEach(([x, z], i) => { const [sx, sy] = aPantalla(x, z); g.fillStyle = i === 0 ? P.acento : P.texto; g.strokeStyle = P.rotulo; g.lineWidth = 1.5; g.beginPath(); g.arc(sx, sy, i === 0 ? 6.5 : 4.5, 0, 7); g.fill(); g.stroke(); });
    if (pts.length >= 3) {
      const [cx, cz] = centroide(pts); const [sx, sy] = aPantalla(cx, cz);
      etiqueta(g, fmtM2(area(pts)), sx, sy);
    }
    if (raton && S.borrador.length) { const u = S.borrador.at(-1), r = ajustarPunto(raton, true); etiqueta(g, `${redondear(Math.hypot(r[0] - u[0], r[1] - u[1]), 2)} m`, ...aPantalla((u[0] + r[0]) / 2, (u[1] + r[1]) / 2), true); }
  }
  if (S.herr === "muro" && S.borrador.length && raton) {
    const a = S.borrador[0], b = ajustarMuro(a, raton);
    g.strokeStyle = P.linea; g.lineWidth = Math.max(3, 0.12 * S.esc); g.lineCap = "round";
    g.beginPath(); g.moveTo(...aPantalla(...a)); g.lineTo(...aPantalla(...b)); g.stroke();
    etiqueta(g, `${redondear(Math.hypot(b[0] - a[0], b[1] - a[1]), 2)} m`, ...aPantalla((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), true);
  }
  if (S.herr === "calibrar" && S.calib.length) {
    const pts = [...S.calib, ...(S.calib.length === 1 && raton ? [raton] : [])];
    const trazo = () => {
      g.beginPath(); pts.forEach(([x, z], i) => { const [sx, sy] = aPantalla(x, z); i ? g.lineTo(sx, sy) : g.moveTo(sx, sy); });
      for (const [x, z] of pts) { const [sx, sy] = aPantalla(x, z); g.moveTo(sx - 8, sy); g.lineTo(sx + 8, sy); g.moveTo(sx, sy - 8); g.lineTo(sx, sy + 8); }
    };
    trazoConHalo(g, P.info, 2, trazo);
  }
  if (S.herr === "enlace" && S.enlaceDesde && raton) {
    const a = pano(S.enlaceDesde);
    if (a) { g.strokeStyle = P.linea; g.setLineDash([3, 4]); g.lineWidth = 2; g.beginPath(); g.moveTo(...aPantalla(a.x, a.z)); g.lineTo(...aPantalla(...raton)); g.stroke(); g.setLineDash([]); }
  }
  // Rosa de los vientos y escala
  const norte = (-(t.norte ?? 0) * Math.PI) / 180; // el norte del plano está a −tour.norte
  const nx = S.w - 34, ny = 34;
  g.save(); g.translate(nx, ny); g.rotate(norte);
  g.fillStyle = P.rotulo; g.beginPath(); g.arc(0, 0, 22, 0, 7); g.fill();
  g.strokeStyle = P.marco; g.lineWidth = 1; g.stroke();
  g.fillStyle = P.acento; g.beginPath(); g.moveTo(0, -16); g.lineTo(6, 4); g.lineTo(0, 0); g.lineTo(-6, 4); g.closePath(); g.fill();
  g.fillStyle = P.texto; g.font = P.f.norte; g.fillText("N", 0, 11);
  g.restore();
  const metros = [0.5, 1, 2, 5, 10, 20].find((m) => m * S.esc >= 70) ?? 50;
  const bx = 16, by = S.h - 54;
  trazoConHalo(g, P.texto, 2, () => { g.beginPath(); g.moveTo(bx, by - 5); g.lineTo(bx, by); g.lineTo(bx + metros * S.esc, by); g.lineTo(bx + metros * S.esc, by - 5); });
  g.textAlign = "left"; g.font = P.f.peq; g.lineJoin = "round";
  g.strokeStyle = P.rotulo; g.lineWidth = 3; g.strokeText(`${metros} m`, bx + 4, by - 10);
  g.fillStyle = P.texto; g.fillText(`${metros} m`, bx + 4, by - 10);
  g.textAlign = "center";
}
function redondo(g, x, y, w, hh, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, hh, r) : g.rect(x, y, w, hh); }
/** Medida sobre el lienzo (m² del borrador, longitudes): rótulo de vidrio denso con texto. */
function etiqueta(g, txt, x, y, peq) {
  const P = pal();
  g.font = peq ? P.f.peq : P.f.etiqueta;
  const w = g.measureText(txt).width + 14;
  g.fillStyle = P.rotulo; redondo(g, x - w / 2, y - 11, w, 22, 7); g.fill();
  g.fillStyle = P.texto; g.fillText(txt, x, y + 0.5);
}

// ------------------------------------------------------------------ ajuste (snap)
function verticesCercanos(pt, excluir) {
  let mejor = null, d = 9 / S.esc;
  const cand = [];
  for (const e of estanciasPlanta()) e.poligono.forEach((v, i) => { if (!(excluir && excluir.id === e.id && excluir.i === i)) cand.push(v); });
  for (const m of planta()?.muros ?? []) cand.push([m[0], m[1]], [m[2], m[3]]);
  if (S.herr === "estancia") cand.push(...S.borrador.slice(1));
  for (const v of cand) { const dd = Math.hypot(v[0] - pt[0], v[1] - pt[1]); if (dd < d) { d = dd; mejor = v; } }
  return mejor;
}
function ajustarPunto(pt, conOrto, excluir) {
  if (S.shift) return pt;
  const v = verticesCercanos(pt, excluir);
  if (v) return [...v];
  if (conOrto && S.borrador.length) {
    const u = S.borrador.at(-1); const tol = 8 / S.esc;
    const r = [...pt];
    if (Math.abs(r[0] - u[0]) < tol) r[0] = u[0];
    if (Math.abs(r[1] - u[1]) < tol) r[1] = u[1];
    if (S.borrador.length > 1) { const f = S.borrador[0]; if (Math.abs(r[0] - f[0]) < tol) r[0] = f[0]; if (Math.abs(r[1] - f[1]) < tol) r[1] = f[1]; }
    return r;
  }
  return pt;
}
function ajustarMuro(a, pt) {
  const v = !S.shift && verticesCercanos(pt);
  if (v) return [...v];
  if (S.shift) return pt;
  const dx = pt[0] - a[0], dz = pt[1] - a[1];
  const ang = Math.atan2(dz, dx), paso = Math.PI / 4;
  const ajust = Math.round(ang / paso) * paso;
  if (Math.abs(ang - ajust) < (8 * Math.PI) / 180) { const l = Math.hypot(dx, dz); return [a[0] + Math.cos(ajust) * l, a[1] + Math.sin(ajust) * l]; }
  return pt;
}

// ------------------------------------------------------------------ hit test
function nodoEn(sx, sy) {
  let mejor = null, d = 15;
  for (const p of app.tour.panoramas) {
    if (!colocado(p) || !enPlanta(p)) continue;
    const [px, py] = aPantalla(p.x, p.z);
    const dd = Math.hypot(px - sx, py - sy);
    if (dd < d) { d = dd; mejor = p; }
  }
  return mejor;
}
function verticeEn(sx, sy, soloSel) {
  for (const e of estanciasPlanta()) {
    if (soloSel && !(S.sel?.tipo === "estancia" && S.sel.id === e.id)) continue;
    for (let i = 0; i < e.poligono.length; i++) {
      const [vx, vy] = aPantalla(...e.poligono[i]);
      if (Math.hypot(vx - sx, vy - sy) < 9) return { id: e.id, i };
    }
  }
  return null;
}
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = Math.max(0, Math.min(1, t));
  return { d: Math.hypot(px - (ax + t * dx), py - (ay + t * dy)), t };
}
function muroEn(sx, sy) {
  const ms = planta()?.muros ?? [];
  for (let i = ms.length - 1; i >= 0; i--) { const [a, b] = [aPantalla(ms[i][0], ms[i][1]), aPantalla(ms[i][2], ms[i][3])]; if (distSeg(sx, sy, ...a, ...b).d < Math.max(6, 0.08 * S.esc)) return i; }
  return -1;
}
function bordeEn(sx, sy, e) {
  for (let i = 0; i < e.poligono.length; i++) {
    const a = aPantalla(...e.poligono[i]), b = aPantalla(...e.poligono[(i + 1) % e.poligono.length]);
    const r = distSeg(sx, sy, ...a, ...b);
    if (r.d < 7) return { i, t: r.t };
  }
  return null;
}
function estanciaEn(x, z) { const l = estanciasPlanta(); for (let i = l.length - 1; i >= 0; i--) if (dentro([x, z], l[i].poligono)) return l[i]; return null; }
function enlaceEn(sx, sy) {
  const { efectivos } = calcularEnlaces();
  for (const k of efectivos) {
    const [a, b] = k.split("|").map(pano);
    if (!a || !b || !colocado(a) || !colocado(b) || !enPlanta(a) || !enPlanta(b)) continue;
    const r = distSeg(sx, sy, ...aPantalla(a.x, a.z), ...aPantalla(b.x, b.z));
    if (r.d < 6 && r.t > 0.15 && r.t < 0.85) return [a.id, b.id];
  }
  return null;
}

// ------------------------------------------------------------------ eventos
function posEvento(e) { const r = S.lienzo.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
function seleccionarNodo(id) {
  S.sel = { tipo: "nodo", id };
  if (app.nodo !== id) { app.nodo = id; emitir("nodo", {}); }
  pintarLado(); marcar();
}
function eventosLienzo() {
  const c = S.lienzo;
  c.addEventListener("wheel", (e) => {
    e.preventDefault();
    const [sx, sy] = posEvento(e);
    if (e.ctrlKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX)) zoom(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), sx, sy);
    else { S.ox -= e.deltaX; marcar(); }
  }, { passive: false });
  c.addEventListener("pointerdown", (e) => {
    c.focus({ preventScroll: true });
    c.setPointerCapture(e.pointerId);
    const [sx, sy] = posEvento(e);
    S.punteros.set(e.pointerId, [sx, sy]);
    S.shift = e.shiftKey;
    if (S.punteros.size === 2) { // pellizco
      const [a, b] = [...S.punteros.values()];
      S.arrastre = { tipo: "pellizco", d: Math.hypot(a[0] - b[0], a[1] - b[1]), c: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] };
      return;
    }
    const mundo = aMundo(sx, sy);
    if (e.button === 1 || S.espacio || e.button === 2) { S.arrastre = { tipo: "pan", sx, sy, ox: S.ox, oy: S.oy }; c.style.cursor = "grabbing"; return; }
    if (S.colocando) { colocarEn(S.colocando, mundo); return; } // alternativa sin arrastre (WCAG 2.5.7)
    const clave = "arr" + performance.now();
    if (S.herr === "sel") {
      const v = verticeEn(sx, sy, true) ?? verticeEn(sx, sy, false);
      if (v) {
        if (e.altKey) { borrarVertice(v); return; }
        S.sel = { tipo: "estancia", id: v.id }; pintarLado();
        S.arrastre = { tipo: "vertice", ...v, clave }; return;
      }
      const n = nodoEn(sx, sy);
      if (n) { seleccionarNodo(n.id); S.arrastre = { tipo: "nodo", id: n.id, clave, sx, sy, movido: false, dx: n.x - mundo[0], dz: n.z - mundo[1] }; return; }
      const m = muroEn(sx, sy);
      if (m >= 0) { S.sel = { tipo: "muro", i: m }; pintarLado(); marcar(); return; }
      const est = estanciaEn(...mundo);
      if (est) { S.sel = { tipo: "estancia", id: est.id }; pintarLado(); marcar(); S.arrastre = { tipo: "estancia", id: est.id, clave, ini: mundo, orig: structuredClone(est.poligono), movido: false }; return; }
      S.sel = null; pintarLado(); marcar();
      S.arrastre = { tipo: "pan", sx, sy, ox: S.ox, oy: S.oy }; c.style.cursor = "grabbing";
    } else if (S.herr === "estancia") {
      const pt = ajustarPunto(mundo, true);
      if (S.borrador.length >= 3) {
        const [fx, fy] = aPantalla(...S.borrador[0]);
        if (Math.hypot(fx - sx, fy - sy) < 10) { cerrarEstancia(); return; }
      }
      const u = S.borrador.at(-1);
      if (u && Math.hypot(u[0] - pt[0], u[1] - pt[1]) * S.esc < 4) return;
      S.borrador.push(pt); marcar();
    } else if (S.herr === "muro") {
      if (!S.borrador.length) { S.borrador = [ajustarPunto(mundo)]; marcar(); return; }
      const a = S.borrador[0], b = ajustarMuro(a, mundo);
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) * S.esc < 4) { S.borrador = []; marcar(); return; }
      cambiar(() => { const pl = planta(); pl.muros ??= []; pl.muros.push([redondear(a[0], 3), redondear(a[1], 3), redondear(b[0], 3), redondear(b[1], 3)]); }, { tipo: "todo", render: false });
      S.borrador = [b]; marcar();
    } else if (S.herr === "calibrar") {
      S.calib.push(mundo); marcar();
      if (S.calib.length === 2) calibrar();
    } else if (S.herr === "enlace") {
      const n = nodoEn(sx, sy);
      if (!n) {
        const l = enlaceEn(sx, sy);
        if (l) { alternarEnlace(...l); toast("Conexión quitada", "info"); }
        else { S.enlaceDesde = null; pintarHerramientas(); }
        marcar(); return;
      }
      if (!S.enlaceDesde) { S.enlaceDesde = n.id; pintarHerramientas(); marcar(); return; }
      if (S.enlaceDesde === n.id) { S.enlaceDesde = null; pintarHerramientas(); marcar(); return; }
      const ya = calcularEnlaces().efectivos.has(claveEnlace(S.enlaceDesde, n.id));
      alternarEnlace(S.enlaceDesde, n.id);
      toast(ya ? `Desconectadas: ${nombreDe(pano(S.enlaceDesde))} ↔ ${nombreDe(n)}` : `Conectadas: ${nombreDe(pano(S.enlaceDesde))} ↔ ${nombreDe(n)}`, ya ? "info" : "ok");
      S.enlaceDesde = e.shiftKey ? n.id : null;
      pintarHerramientas(); pintarLado(); marcar();
    }
  });
  c.addEventListener("pointermove", (e) => {
    const [sx, sy] = posEvento(e);
    S.shift = e.shiftKey;
    if (S.punteros.has(e.pointerId)) S.punteros.set(e.pointerId, [sx, sy]);
    S.raton = aMundo(sx, sy);
    const A = S.arrastre;
    if (A?.tipo === "pellizco" && S.punteros.size === 2) {
      const [a, b] = [...S.punteros.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]); const cc = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      S.ox += cc[0] - A.c[0]; S.oy += cc[1] - A.c[1];
      zoom(d / A.d, cc[0], cc[1]); A.d = d; A.c = cc; return;
    }
    if (A?.tipo === "pan") { S.ox = A.ox + sx - A.sx; S.oy = A.oy + sy - A.sy; marcar(); return; }
    if (A?.tipo === "nodo") {
      if (!A.movido && Math.hypot(sx - A.sx, sy - A.sy) < 3) return;
      A.movido = true;
      const [x, z] = aMundo(sx, sy);
      cambiar(() => { const p = pano(A.id); p.x = redondear(x + A.dx, 3); p.z = redondear(z + A.dz, 3); }, { clave: A.clave, tipo: "local", render: false });
      marcar(); return;
    }
    if (A?.tipo === "vertice") {
      const pt = ajustarPunto(aMundo(sx, sy), false, A);
      cambiar(() => { const est = app.tour.estancias.find((x) => x.id === A.id); est.poligono[A.i] = [redondear(pt[0], 3), redondear(pt[1], 3)]; }, { clave: A.clave, tipo: "local", render: false });
      marcar(); return;
    }
    if (A?.tipo === "estancia") {
      const [x, z] = aMundo(sx, sy); const dx = x - A.ini[0], dz = z - A.ini[1];
      if (!A.movido && Math.hypot(dx, dz) * S.esc < 4) return;
      A.movido = true;
      cambiar(() => { const est = app.tour.estancias.find((q) => q.id === A.id); est.poligono = A.orig.map(([px, pz]) => [redondear(px + dx, 3), redondear(pz + dz, 3)]); }, { clave: A.clave, tipo: "local", render: false });
      marcar(); return;
    }
    // cursor
    if (S.herr === "sel") c.style.cursor = S.espacio ? "grab" : verticeEn(sx, sy) ? "move" : nodoEn(sx, sy) ? "pointer" : muroEn(sx, sy) >= 0 ? "pointer" : "default";
    else if (S.herr === "enlace") c.style.cursor = nodoEn(sx, sy) || enlaceEn(sx, sy) ? "pointer" : "default";
    else c.style.cursor = "crosshair";
    if (S.herr !== "sel") marcar();
  });
  const fin = (e) => {
    S.punteros.delete(e.pointerId);
    const A = S.arrastre;
    S.arrastre = null;
    c.style.cursor = "";
    if (!A) return;
    if ((A.tipo === "nodo" || A.tipo === "estancia") && A.movido) { cambiar(() => {}, { clave: A.clave }); pintarLado(); }
    if (A.tipo === "vertice") { cambiar(() => {}, { clave: A.clave }); pintarLado(); }
    marcar();
  };
  c.addEventListener("pointerup", fin);
  c.addEventListener("pointercancel", fin);
  c.addEventListener("pointerleave", () => { S.raton = null; marcar(); });
  c.addEventListener("contextmenu", (e) => e.preventDefault());
  c.addEventListener("dblclick", (e) => {
    const [sx, sy] = posEvento(e);
    if (S.herr === "estancia" && S.borrador.length >= 3) { cerrarEstancia(); return; }
    if (S.herr === "muro") { S.borrador = []; marcar(); return; }
    if (S.herr === "sel" && S.sel?.tipo === "estancia") {
      const est = app.tour.estancias.find((x) => x.id === S.sel.id);
      const b = est && bordeEn(sx, sy, est);
      if (b) {
        const pt = aMundo(sx, sy);
        cambiar(() => { const q = app.tour.estancias.find((x) => x.id === S.sel.id); q.poligono.splice(b.i + 1, 0, [redondear(pt[0], 3), redondear(pt[1], 3)]); });
        return;
      }
    }
    if (S.herr === "sel") { const n = nodoEn(sx, sy); if (n) emitir("ir", { seccion: "orientar" }); }
  });
}
function borrarVertice(v) {
  const est = app.tour.estancias.find((x) => x.id === v.id);
  if (!est || est.poligono.length <= 3) return toast("Una estancia necesita al menos 3 vértices", "aviso");
  cambiar(() => { app.tour.estancias.find((x) => x.id === v.id).poligono.splice(v.i, 1); });
}

function cerrarEstancia() {
  let pts = S.borrador;
  // Elimina puntos duplicados (doble clic)
  pts = pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) * S.esc > 3);
  if (pts.length < 3) { toast("Marca al menos 3 esquinas", "aviso"); return; }
  const pol = pts.map(([x, z]) => [redondear(x, 3), redondear(z, 3)]);
  // Nombre sugerido: la foto colocada dentro del polígono
  const dentroDe = app.tour.panoramas.find((p) => colocado(p) && enPlanta(p) && dentro([p.x, p.z], pol));
  const n = (app.tour.estancias ?? []).length + 1;
  const nombre = dentroDe ? textoDe(dentroDe.nombre) : `Estancia ${n}`;
  const id = idLibre(nombre, app.tour.estancias.map((e) => e.id));
  cambiar((t) => {
    t.estancias.push({ id, nombre: dentroDe && typeof dentroDe.nombre === "object" ? structuredClone(dentroDe.nombre) : { es: nombre }, planta: planta().id, poligono: pol });
  });
  S.borrador = [];
  S.sel = { tipo: "estancia", id };
  pintarLado(); marcar();
  toast(`${nombre}: ${fmtM2(area(pol))}`, "ok");
  requestAnimationFrame(() => { const i = lado.querySelector(".panel-sel input"); i?.focus(); i?.select(); });
}

async function calibrar() {
  const [a, b] = S.calib;
  const actual = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (actual * S.esc < 10) { S.calib = []; return toast("Los puntos están demasiado juntos", "aviso"); }
  const v = await pedir("Calibrar escala", "¿Cuántos metros mide esa línea en la realidad?", "", { tipo: "number", ayuda: "Usa una medida fiable y larga: una pared exterior, la fachada o una cota del plano. Ej.: 4,35" });
  S.calib = [];
  const real = Number(String(v ?? "").replace(",", "."));
  if (!real || real <= 0) { marcar(); return; }
  const f = real / actual;
  const pl = planta();
  const [ox, oz] = pl.plano?.origen ?? [0, 0];
  const esc = (x, z) => [redondear(ox + (x - ox) * f, 3), redondear(oz + (z - oz) * f, 3)];
  cambiar((t) => {
    const p = t.plantas.find((x) => x.id === pl.id);
    if (p.plano) { p.plano.ancho_m = redondear(p.plano.ancho_m * f, 3); p.plano.alto_m = redondear(p.plano.alto_m * f, 3); }
    for (const q of t.panoramas) if (colocado(q) && (q.planta ?? t.plantas[0].id) === pl.id) [q.x, q.z] = esc(q.x, q.z);
    for (const e of t.estancias) if ((e.planta ?? t.plantas[0].id) === pl.id) e.poligono = e.poligono.map(([x, z]) => esc(x, z));
    if (p.muros) p.muros = p.muros.map(([x1, z1, x2, z2]) => [...esc(x1, z1), ...esc(x2, z2)]);
    t._estudio.calibrado ??= {};
    t._estudio.calibrado[pl.id] = true;
  });
  // Mantiene el plano en el mismo sitio de la pantalla
  const sxo = S.ox + ox * S.esc, syo = S.oy + oz * S.esc;
  S.esc /= f; S.ox = sxo - ox * S.esc; S.oy = syo - oz * S.esc;
  toast(`Escala calibrada: el plano mide ${redondear(pl.plano.ancho_m, 2)} × ${redondear(pl.plano.alto_m, 2)} m`, "ok", 4000);
  fijarHerramienta("sel");
  pintarUI();
}

function borrarSeleccion() {
  const s = S.sel;
  if (!s) return;
  if (s.tipo === "estancia") cambiar((t) => { t.estancias = t.estancias.filter((e) => e.id !== s.id); });
  else if (s.tipo === "muro") cambiar(() => { planta().muros.splice(s.i, 1); });
  else if (s.tipo === "nodo") cambiar(() => { const p = pano(s.id); delete p.x; delete p.z; });
  S.sel = null; pintarLado(); marcar();
}

/** Coloca una foto en un punto del plano (desde el arrastre o desde «Colocar» + toque). */
function colocarEn(id, [x, z]) {
  S.colocando = null;
  cambiar(() => { const p = pano(id); p.x = redondear(x, 3); p.z = redondear(z, 3); p.planta = planta().id; });
  seleccionarNodo(id);
  pintarHerramientas();
  const { vecinos } = calcularEnlaces();
  const v = vecinos.get(id) ?? [];
  toast(v.length ? `${nombreDe(pano(id))} colocada · conectada con ${v.map((x2) => nombreDe(pano(x2))).join(", ")}` : `${nombreDe(pano(id))} colocada (sin conectar: acércala a otra foto o usa «Conectar»)`, v.length ? "ok" : "aviso", 3500);
  // Siguiente foto pendiente: se puede seguir colocando sin volver a la lista.
  const sig = app.tour.panoramas.find((p) => !colocado(p));
  if (sig && lado?.querySelector(".ficha-arrastre")) requestAnimationFrame(() => lado?.querySelector(".ficha-arrastre .btn")?.focus());
}

// Arrastrar una foto desde la lista lateral hasta el plano
function iniciarArrastreFicha(e, id) {
  e.preventDefault();
  const fantasma = h("div", { class: "fantasma-arrastre", text: nombreDe(pano(id)) });
  document.body.append(fantasma);
  const mover = (ev) => { fantasma.style.left = ev.clientX + "px"; fantasma.style.top = ev.clientY + "px"; };
  mover(e);
  const soltar = (ev) => {
    removeEventListener("pointermove", mover); removeEventListener("pointerup", soltar);
    fantasma.remove();
    const r = S.lienzo.getBoundingClientRect();
    if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) return;
    colocarEn(id, aMundo(ev.clientX - r.left, ev.clientY - r.top));
  };
  addEventListener("pointermove", mover);
  addEventListener("pointerup", soltar);
}

/**
 * `tour.norte` = rumbo de brújula de «arriba del plano» (como el minimapa del visor y la brújula de las fotos:
 * yaw = rumbo − norte). En el plano el norte aparece por tanto a −norte grados; la aguja muestra esa dirección.
 */
const anguloNorte = () => Math.round(norm360(-(app.tour.norte ?? 0)));
function fijarNorte(aguja, conRender = true) {
  cambiar((t) => { t.norte = Math.round(norm360(-aguja)); t._estudio.norteFijado = true; }, { clave: "norte", tipo: "datos", render: false });
  const a = anguloNorte();
  const dial = lado?.querySelector(".dial-norte");
  if (dial) { dial.querySelector(".aguja").style.transform = `rotate(${a}deg)`; dial.setAttribute("aria-valuenow", a); dial.setAttribute("aria-valuetext", `${a} grados`); }
  if (conRender) { const i = lado?.querySelector('input[aria-label="Norte en grados"]'); if (i) i.value = a; }
  marcar();
}
function eventosDial(dial) {
  const ang = (e) => { const r = dial.getBoundingClientRect(); return rumboDe(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)); };
  dial.addEventListener("pointerdown", (e) => {
    dial.setPointerCapture(e.pointerId);
    const mv = (ev) => { let a = ang(ev); if (!ev.shiftKey) a = Math.round(a / 5) * 5; fijarNorte(a); };
    mv(e);
    dial.onpointermove = mv;
    dial.onpointerup = () => { dial.onpointermove = null; };
  });
  dial.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); fijarNorte(anguloNorte() + (e.key === "ArrowRight" ? 1 : -1) * (e.shiftKey ? 10 : 1)); }
  });
}

// ------------------------------------------------------------------ teclado
function teclas(e) {
  const k = e.key;
  if (k === " " && !S.espacio) { S.espacio = true; addEventListener("keyup", (ev) => { if (ev.key === " ") S.espacio = false; }, { once: true }); return true; }
  const t = HERRAMIENTAS.find((x) => x.tecla.toLowerCase() === k.toLowerCase());
  if (t && !(t.id === "calibrar" && !planta()?.plano?.imagen)) { fijarHerramienta(t.id); return true; }
  if (S.colocando && k === "Escape") { S.colocando = null; pintarLado(); pintarHerramientas(); return true; }
  if (S.colocando && k === "Enter" && document.activeElement === S.lienzo) { colocarEn(S.colocando, aMundo(S.w / 2, S.h / 2)); return true; } // teclado: en el centro de la vista
  if (k === "Escape") {
    if (S.borrador.length || S.calib.length || S.enlaceDesde) { S.borrador = []; S.calib = []; S.enlaceDesde = null; pintarHerramientas(); }
    else if (S.herr !== "sel") fijarHerramienta("sel");
    else { S.sel = null; pintarLado(); }
    marcar(); return true;
  }
  if (k === "Enter" && S.herr === "estancia" && S.borrador.length >= 3) { cerrarEstancia(); return true; }
  if (k === "Enter" && S.herr === "muro") { S.borrador = []; marcar(); return true; }
  if (k === "Backspace" && S.herr === "estancia" && S.borrador.length) { S.borrador.pop(); marcar(); return true; }
  if ((k === "Delete" || k === "Backspace") && S.sel) { borrarSeleccion(); return true; }
  if (k === "0") { ajustar(); return true; }
  if (k === "+" || k === "=") { zoom(1.25); return true; }
  if (k === "-") { zoom(0.8); return true; }
  if (S.sel?.tipo === "nodo" && k.startsWith("Arrow")) {
    const paso = e.shiftKey ? 0.5 : 0.05;
    const d = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] }[k];
    cambiar(() => { const p = pano(S.sel.id); p.x = redondear(p.x + d[0], 3); p.z = redondear(p.z + d[1], 3); }, { clave: "flechas" + S.sel.id });
    return true;
  }
  return false;
}

export const seccionPlano = {
  id: "plano", titulo: "Plano (opcional)", corto: "Plano", sinPie: true,
  resumen: () => {
    const t = app.tour, n = t.panoramas.length, c = t.panoramas.filter(colocado).length;
    if (!c) return { texto: "Opcional", hecho: false, opcional: true };
    return { texto: `${c} de ${n} colocadas`, hecho: n > 0 && c === n };
  },
  render,
  actualizar: () => { if (raiz) { pintarPlantas(); pintarHerramientas(); if (!lado?.contains(document.activeElement)) pintarLado(); marcar(); } },
  alCambiarNodo: () => { marcar(); if (S.sel?.tipo === "nodo" && S.sel.id !== app.nodo && pano(app.nodo) && colocado(pano(app.nodo))) { S.sel = { tipo: "nodo", id: app.nodo }; pintarLado(); } },
  salir: () => { S.ro?.disconnect(); cancelAnimationFrame(S.raf); raiz = null; lado = null; S.lienzo = null; },
  teclas,
  soltar: async (lista) => {
    if (lista.length === 1 && /\.(pdf|dxf|dwg)$/i.test(lista[0].archivo.name)) { await subirPlano(lista[0].archivo); return true; }
    if (lista.length === 1 && /\.(png|jpe?g|webp|svg)$/i.test(lista[0].archivo.name)) {
      const f = lista[0].archivo;
      const d = await dimensiones(f).catch(() => null);
      if (d && Math.abs(d.w / d.h - 2) < 0.02 && d.w >= 3000) return false; // parece una foto 360
      await subirPlano(f);
      return true;
    }
    return false;
  },
};
on("vista", () => { if (raiz) marcar(); });
on("nombres", () => { if (raiz) marcar(); });
