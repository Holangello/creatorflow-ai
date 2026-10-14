// cre8eight Estudio: aplicación de creación de recorridos (sin backend, sin compilación).
import { app, on, emitir, h, $, icono, toast, deshacer, rehacer, puedeDeshacer, puedeRehacer, guardarAhora,
  nombreProyecto, tourParaExportar, urlDe, pano, dialogo, cambiar, esRapido } from "./estudio-nucleo.js";
import { iniciarProyecto, dialogoAbrir, importarArchivosSoltados, leerSoltado } from "./estudio-proyecto.js";
import { seccionFotos } from "./estudio-fotos.js";
import { seccionPlano } from "./estudio-plano.js";
import { seccionMaterial } from "./estudio-material.js";
import { seccionOrientar } from "./estudio-orientar.js";
import { seccionVariantes } from "./estudio-variantes.js";
import { seccionDatos } from "./estudio-datos.js";
import { seccionRevisar, seccionExportar, comprobar } from "./estudio-exportar.js";

const SECCIONES = [seccionFotos, seccionMaterial, seccionPlano, seccionOrientar, seccionVariantes, seccionDatos, seccionRevisar, seccionExportar];
const porId = Object.fromEntries(SECCIONES.map((s) => [s.id, s]));
// Modo completo: las 8 herramientas. Modo rápido: 5 pasos; Material, Orientar y Variantes son tareas opcionales de Plano.
const ORDEN_COMPLETO = ["fotos", "material", "plano", "orientar", "variantes", "datos", "revisar", "exportar"];
const ORDEN_RAPIDO = ["fotos", "plano", "datos", "revisar", "exportar"];
const OPCIONALES_RAPIDO = ["orientar", "variantes", "material"];
const pasos = () => (esRapido() ? ORDEN_RAPIDO : ORDEN_COMPLETO);
const trabajo = $("#trabajo");
let actual = null;

// ------------------------------------------------------------------ atajos de una tecla (se pueden desactivar)
app.atajos = (() => { try { return localStorage.getItem("estudio:atajos") !== "no"; } catch { return true; } })();

// ------------------------------------------------------------------ navegación
/** Paso siguiente en el flujo del modo actual (los opcionales del modo rápido continúan tras Plano). */
app.pasoSiguiente = (id = app.seccion) => {
  const orden = pasos();
  let i = orden.indexOf(id);
  if (i < 0) i = orden.indexOf(esRapido() && OPCIONALES_RAPIDO.includes(id) ? "plano" : "fotos");
  const sig = orden[i + 1];
  return sig ? { id: sig, titulo: porId[sig].corto ?? porId[sig].titulo } : null;
};
app.pasoAnterior = (id = app.seccion) => {
  const orden = pasos();
  const i = orden.indexOf(id);
  if (i < 0) return esRapido() && OPCIONALES_RAPIDO.includes(id) ? { id: "plano", titulo: porId.plano.corto } : null;
  const ant = orden[i - 1];
  return ant ? { id: ant, titulo: porId[ant].corto ?? porId[ant].titulo } : null;
};

function botonPaso(s, n, { sub = false } = {}) {
  const r = s.resumen?.() ?? {};
  let insignia = null;
  if (s.id === "revisar" && app.tour?.panoramas.length) {
    const val = comprobar();
    const nE = val.filter((c) => c.nivel === "error").length, nA = val.filter((c) => c.nivel === "aviso").length;
    if (nE) insignia = h("span", { class: "insignia", text: nE, title: `${nE} por corregir` });
    else if (nA) insignia = h("span", { class: "insignia aviso", text: nA, title: `${nA} sugerencias` });
  }
  return h("button", {
    class: `${r.hecho ? "hecho" : ""} ${sub ? "subpaso" : ""}`, "aria-current": s.id === app.seccion ? "page" : null,
    title: sub ? `${s.titulo} (opcional)` : `${s.titulo}${app.atajos ? ` (${n})` : ""}`,
    onclick: () => irSeccion(s.id),
  },
  sub ? h("span", { class: "num sub" }, icono(s.id === "material" ? "abrir" : s.id, 13)) : h("span", { class: "num" }, r.hecho ? "✓" : String(n)),
  h("span", { class: "etq" }, h("b", { text: s.corto ?? s.titulo }), h("small", { text: sub ? "Opcional" : r.texto ?? "" })),
  insignia);
}
function pintarPasos() {
  const nav = $("#pasos");
  if (!app.tour) return;
  const orden = pasos();
  const items = [];
  orden.forEach((id, i) => {
    if (id === "revisar") items.push(h("div", { class: "separador" }));
    items.push(botonPaso(porId[id], i + 1));
    if (id === "plano" && esRapido()) for (const o of OPCIONALES_RAPIDO) items.push(botonPaso(porId[o], 0, { sub: true }));
  });
  const otroModo = esRapido() ? "completo" : "rapido";
  nav.replaceChildren(...items,
    h("div", { class: "pie-pasos" },
      h("div", { class: "modo-actual" }, h("b", { text: esRapido() ? "Modo rápido" : "Modo completo" }), " · ",
        h("button", { class: "enlace", onclick: () => cambiarModo(otroModo) }, esRapido() ? "ver todas las herramientas" : "volver al modo rápido")),
      h("p", { text: "Guardado en este ordenador. Para llevarlo a otro, usa Publicar → Copia de seguridad." }),
      app.atajos ? h("p", {}, h("kbd", { text: "?" }), " atajos de teclado") : null));
}
export function cambiarModo(modo) {
  cambiar((t) => { t._estudio.modo = modo; }, { tipo: "todo" });
  toast(modo === "rapido" ? "Modo rápido: 5 pasos. El resto de herramientas siguen en «Opcional»." : "Modo completo: todas las herramientas a la vista.", "info", 4000);
  irSeccion(app.seccion);
}
on("modo", ({ modo }) => cambiarModo(modo));

function pieContinuar() {
  const sig = app.pasoSiguiente(), ant = app.pasoAnterior();
  if (!sig && !ant) return null;
  return h("div", { class: "seccion pie-paso" },
    ant ? h("button", { class: "btn grande fantasma", onclick: () => irSeccion(ant.id) }, `← ${ant.titulo}`) : h("span"),
    sig ? h("button", { class: "btn grande primario", onclick: () => irSeccion(sig.id), "data-continuar": sig.id }, `Continuar → ${sig.titulo}`) : null);
}

export function irSeccion(id, opciones = {}) {
  const s = porId[id];
  if (!s) return;
  actual?.salir?.();
  app.seccion = id;
  actual = s;
  document.body.className = document.body.className.replace(/\bseccion-\S+/g, "").trim() + ` seccion-${id}`;
  trabajo.replaceChildren();
  trabajo.scrollTop = 0;
  s.render(trabajo, opciones);
  if (!s.sinPie) { const pie = pieContinuar(); if (pie) trabajo.append(pie); }
  pintarPasos();
  pintarPieVista();
  try { localStorage.setItem("estudio:seccion", id); } catch {}
  if (location.hash.slice(1) !== id) history.replaceState(null, "", `#${id}`);
}
on("ir", ({ seccion, ...op }) => irSeccion(seccion, op));
addEventListener("hashchange", () => { const id = location.hash.slice(1); if (porId[id] && id !== app.seccion) irSeccion(id); });

// ------------------------------------------------------------------ barra superior
function pintarBarra() {
  $("#nombre-proyecto").textContent = nombreProyecto();
  $("#btn-deshacer").disabled = !puedeDeshacer();
  $("#btn-rehacer").disabled = !puedeRehacer();
}
function pintarGuardado() {
  const e = $("#estado-guardado");
  e.className = "estado-guardado " + (app.guardado === "ok" ? "" : app.guardado === "error" ? "error" : "pendiente");
  e.replaceChildren(h("span", { text: app.guardado === "ok" ? "Guardado" : app.guardado === "error" ? "Sin guardar" : "Guardando…" }));
  e.title = app.guardado === "error" ? "El navegador no permite guardar. Descarga una copia de seguridad (Publicar → Avanzado)." : "Guardado automático en este ordenador";
}
$("#btn-deshacer").append(icono("deshacer"));
$("#btn-rehacer").append(icono("rehacer"));
$("#btn-atajos").append(icono("teclado"));
$("#btn-guia").prepend(icono("info", 16));
$("#btn-vista").append(icono("ojo", 16), h("span", { text: "Vista previa" }));
$("#btn-abrir").append(icono("abrir"), h("span", { text: "Abrir" }));
$("#btn-exportar").append(icono("exportar"), h("span", { text: "Publicar" }));
$("#btn-deshacer").onclick = deshacer;
$("#btn-rehacer").onclick = rehacer;
$("#btn-abrir").onclick = () => dialogoAbrir();
$("#nombre-proyecto").onclick = () => dialogoAbrir();
$("#btn-exportar").onclick = () => irSeccion("exportar");
$("#btn-atajos").onclick = mostrarAtajos;
$("#btn-vista").onclick = () => {
  const abierta = document.body.classList.toggle("vista-abierta");
  $("#btn-vista").setAttribute("aria-pressed", String(abierta));
};

// ------------------------------------------------------------------ vista previa (iframe del visor real)
const iframe = $("#iframe-visor");
const vp = { listo: false, tCarga: 0, enviado: false };
addEventListener("message", (e) => {
  if (e.source !== iframe.contentWindow || e.origin !== location.origin) return;
  const d = e.data;
  if (!d || typeof d.tipo !== "string") return;
  if (d.tipo === "visor:listo") { vp.listo = true; enviarTour(); emitir("vistaLista"); }
  else if (d.tipo === "visor:vista") {
    app.vista = d;
    if (d.nodo && d.nodo !== app.nodo && pano(d.nodo)) { app.nodo = d.nodo; emitir("nodo", { origen: "visor" }); }
    emitir("vista", d);
  } else if (d.tipo === "visor:clic") emitir("clic", d);
});
iframe.addEventListener("load", () => {
  vp.listo = false; app.vista = null; emitir("vista", null);
  // Si el visor no anuncia "visor:listo", se envía igualmente tras un margen.
  setTimeout(() => { if (!vp.listo) enviarTour(); }, 2500);
});
function postVisor(msg) {
  try { iframe.contentWindow?.postMessage(msg, location.origin); } catch (e) { console.warn(e); }
}
export function enviarTour() {
  clearTimeout(vp.tCarga);
  const vacio = !app.tour?.panoramas.length;
  $("#vista-vacia").hidden = !vacio;
  if (vacio) return;
  // La vista previa muestra lo mismo que se publicará (sin documentación privada).
  const t = tourParaExportar(app.tour, { mapaRutas: urlDe, publico: true });
  if (app.nodo && pano(app.nodo)) t.inicio = app.nodo;
  postVisor({ tipo: "visor:cargar", tour: t });
  if (app.nodo) postVisor({ tipo: "visor:ir", nodo: app.nodo });
  vp.enviado = true;
}
function programarCarga(ms) { clearTimeout(vp.tCarga); vp.tCarga = setTimeout(enviarTour, ms); }
export function visorIr(id) { postVisor({ tipo: "visor:ir", nodo: id }); }
export function visorYaw(id, yaw) { postVisor({ tipo: "visor:yaw", nodo: id, yaw }); }
export const visorVentana = () => iframe.contentWindow;
app.vistaPrevia = { ir: visorIr, yaw: visorYaw, ventana: visorVentana, enviar: enviarTour, iframe, estado: vp };

function pintarSelectorVista() {
  const s = $("#vista-nodo");
  s.replaceChildren(...app.tour.panoramas.map((p) => h("option", { value: p.id, text: textoNombre(p), selected: p.id === app.nodo })));
  s.disabled = !app.tour.panoramas.length;
}
const textoNombre = (p) => (typeof p.nombre === "string" ? p.nombre : p.nombre?.es) || p.id;
$("#vista-nodo").onchange = (e) => { app.nodo = e.target.value; emitir("nodo", { origen: "selector" }); };
$("#vista-recargar").append(icono("recargar", 16));
$("#vista-plegar").append(icono("ampliar", 16));
$("#vista-recargar").onclick = () => { vp.listo = false; iframe.src = "index.html?embed&estudio"; };
$("#vista-plegar").onclick = () => {
  if (getComputedStyle($("#vista")).position === "fixed") { document.body.classList.remove("vista-abierta"); $("#btn-vista").setAttribute("aria-pressed", "false"); }
  else document.body.classList.toggle("vista-grande");
};
function pintarPieVista() {
  const pie = $("#vista-pie");
  pie.replaceChildren();
  actual?.pieVista?.(pie);
}

// ------------------------------------------------------------------ reacciones a cambios
on("cambio", ({ tipo, render }) => {
  pintarBarra();
  pintarPasos();
  pintarSelectorVista();
  if (tipo === "yaw") {
    const p = pano(app.nodo);
    if (p) visorYaw(p.id, p.yaw ?? 0);
  } else if (tipo === "datos") programarCarga(1200);
  else if (tipo !== "local") programarCarga(450);
  if (render !== false) actual?.actualizar?.();
});
on("nodo", ({ origen } = {}) => {
  pintarSelectorVista();
  if (origen !== "visor") visorIr(app.nodo);
  actual?.alCambiarNodo?.();
});
on("historial", pintarBarra);
on("guardado", pintarGuardado);
on("proyecto", () => {
  pintarBarra(); pintarGuardado(); pintarSelectorVista();
  irSeccion(app.seccion);
  enviarTour();
});
on("pieVista", pintarPieVista);
on("abrir", () => dialogoAbrir());

// ------------------------------------------------------------------ teclado
function enCampo(e) {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return false;
  if (t.tagName === "INPUT") return !/^(checkbox|radio|range|color|button|submit|file)$/.test(t.type);
  return t.isContentEditable || /^(TEXTAREA|SELECT)$/.test(t.tagName);
}
addEventListener("keydown", (e) => {
  if (document.querySelector("dialog[open], .editor-mascara")) return; // los diálogos y el editor de máscaras gestionan su teclado
  const mod = e.ctrlKey || e.metaKey;
  const k = e.key.toLowerCase();
  if (mod && k === "z" && !enCampo(e)) { e.preventDefault(); e.shiftKey ? rehacer() : deshacer(); return; }
  if (mod && k === "y" && !enCampo(e)) { e.preventDefault(); rehacer(); return; }
  if (mod && k === "s") { e.preventDefault(); guardarAhora().then(() => toast(app.guardado === "error" ? "No se pudo guardar" : "Proyecto guardado", app.guardado === "error" ? "error" : "ok")); return; }
  if (mod && k === "o") { e.preventDefault(); dialogoAbrir(); return; }
  if (mod && k === "e") { e.preventDefault(); irSeccion("exportar"); return; }
  // Atajos de una tecla: nunca dentro de un campo de texto, y se pueden desactivar en el diálogo "?".
  if (enCampo(e) || mod || e.altKey || !app.atajos) return;
  const orden = pasos();
  if (/^[1-9]$/.test(e.key) && +e.key <= orden.length) { irSeccion(orden[+e.key - 1]); e.preventDefault(); return; }
  if (e.key === "?") { mostrarAtajos(); return; }
  if (actual?.teclas?.(e)) e.preventDefault();
});

function mostrarAtajos() {
  const f = (teclas, txt) => [h("span", {}, ...teclas.map((t) => h("kbd", { text: t }))), h("span", { text: txt })];
  const interruptor = h("input", { type: "checkbox", role: "switch", checked: app.atajos, id: "interruptor-atajos" });
  interruptor.onchange = () => {
    app.atajos = interruptor.checked;
    try { localStorage.setItem("estudio:atajos", app.atajos ? "si" : "no"); } catch {}
    pintarPasos();
    toast(app.atajos ? "Atajos de una tecla activados" : "Atajos de una tecla desactivados (Ctrl+Z, Ctrl+S… siguen funcionando)", "info", 3500);
  };
  const n = pasos().length;
  dialogo({
    titulo: "Atajos de teclado", ancho: "min(580px, calc(100vw - 32px))",
    cuerpo: h("div", {},
      h("label", { class: "check interruptor", for: "interruptor-atajos" }, interruptor,
        h("span", {}, h("b", { text: "Atajos de una tecla" }), h("small", { class: "tenue", style: { display: "block" }, text: "Números para cambiar de paso y letras en el plano. Desactívalos si usas un lector de pantalla o el control por voz." }))),
      h("div", { class: "atajos" },
        h("h4", { text: "General" }),
        f(["Ctrl", "Z"], "Deshacer"), f(["Ctrl", "Shift", "Z"], "Rehacer"), f(["Ctrl", "S"], "Guardar ahora"),
        f(["Ctrl", "O"], "Abrir proyecto, ZIP o carpeta"), f(["Ctrl", "E"], "Publicar"), f(["1", "…", String(n)], "Ir a cada paso"),
        h("h4", { text: "Plano" }),
        f(["V"], "Seleccionar y mover"), f(["K"], "Calibrar escala"), f(["E"], "Dibujar estancia"), f(["M"], "Dibujar muros"),
        f(["L"], "Conectar fotos"), f(["Enter"], "Cerrar el contorno"), f(["Supr"], "Borrar selección"), f(["Esc"], "Cancelar"),
        f(["Rueda"], "Zoom"), f(["Espacio", "arrastrar"], "Desplazar"), f(["0"], "Encuadrar todo"),
        h("h4", { text: "Dirección y notas" }),
        f(["[", "]"], "Giro de la foto: 1°"), f(["Shift", "[", "]"], "Giro de la foto: 10°"), f(["A"], "Alinear con la estancia elegida"),
        f(["P"], "Añadir una nota"), f(["N", "B"], "Estancia siguiente / anterior"),
        h("h4", { text: "Editor de máscara" }),
        f(["W"], "Varita"), f(["B"], "Pincel"), f(["E"], "Goma"), f(["1", "2"], "Paredes / suelo"), f(["Alt", "clic"], "Quitar con la varita"))),
    botones: [{ texto: "Cerrar", primario: true }],
  });
}

// ------------------------------------------------------------------ soltar archivos en cualquier parte
let contArrastre = 0;
const capa = $("#arrastre");
const conArchivos = (e) => [...(e.dataTransfer?.types ?? [])].includes("Files");
addEventListener("dragenter", (e) => { if (!conArchivos(e)) return; contArrastre++; capa.hidden = false; });
addEventListener("dragleave", (e) => { if (!conArchivos(e)) return; if (--contArrastre <= 0) { contArrastre = 0; capa.hidden = true; } });
addEventListener("dragover", (e) => { if (conArchivos(e)) e.preventDefault(); });
addEventListener("drop", async (e) => {
  if (!conArchivos(e)) return;
  e.preventDefault();
  contArrastre = 0; capa.hidden = true;
  const archivos = await leerSoltado(e.dataTransfer);
  if (!archivos.length) return;
  if (actual?.soltar && (await actual.soltar(archivos, e))) return;
  importarArchivosSoltados(archivos);
});

// ------------------------------------------------------------------ arranque
addEventListener("beforeunload", () => { guardarAhora(); });
try { const s = localStorage.getItem("estudio:seccion"); if (porId[s]) app.seccion = s; } catch {}
{ const h0 = location.hash.slice(1); if (porId[h0]) app.seccion = h0; } // enlaces del Asistente: estudio.html#plano
window.__estudio = app; // para depurar y para las pruebas automáticas
await iniciarProyecto();
