// Estudio: aplicación de creación de recorridos (sin backend, sin compilación).
import { app, on, emitir, h, $, $$, icono, toast, deshacer, rehacer, puedeDeshacer, puedeRehacer, guardarAhora,
  nombreProyecto, tourParaExportar, urlDe, pano, dialogo } from "./estudio-nucleo.js";
import { iniciarProyecto, dialogoAbrir, importarArchivosSoltados, leerSoltado } from "./estudio-proyecto.js";
import { seccionFotos } from "./estudio-fotos.js";
import { seccionPlano } from "./estudio-plano.js";
import { seccionOrientar } from "./estudio-orientar.js";
import { seccionVariantes } from "./estudio-variantes.js";
import { seccionDatos } from "./estudio-datos.js";
import { seccionRevisar, seccionExportar, comprobar } from "./estudio-exportar.js";

const SECCIONES = [seccionFotos, seccionPlano, seccionOrientar, seccionVariantes, seccionDatos, seccionRevisar, seccionExportar];
const porId = Object.fromEntries(SECCIONES.map((s) => [s.id, s]));
const trabajo = $("#trabajo");
let actual = null;

// ------------------------------------------------------------------ navegación
function pintarPasos() {
  const nav = $("#pasos");
  const val = comprobar();
  nav.replaceChildren(
    ...SECCIONES.map((s, i) => {
      const r = s.resumen?.() ?? {};
      let insignia = null;
      if (s.id === "revisar") {
        const nE = val.filter((c) => c.nivel === "error").length, nA = val.filter((c) => c.nivel === "aviso").length;
        if (nE) insignia = h("span", { class: "insignia", text: nE, title: `${nE} problemas` });
        else if (nA) insignia = h("span", { class: "insignia aviso", text: nA, title: `${nA} avisos` });
      }
      return [
        s.id === "revisar" ? h("div", { class: "separador" }) : null,
        h("button", {
          class: r.hecho ? "hecho" : "", "aria-current": s.id === app.seccion ? "page" : null, title: `${s.titulo} (${i + 1})`,
          onclick: () => irSeccion(s.id),
        },
        h("span", { class: "num" }, r.hecho ? "✓" : String(i + 1)),
        h("span", { class: "etq" }, h("b", { text: s.corto ?? s.titulo }), h("small", { text: r.texto ?? s.subtitulo ?? "" })),
        insignia),
      ];
    }),
    h("div", { class: "pie-pasos" }, "Todo se guarda solo en este navegador. ", h("kbd", { text: "?" }), " atajos"),
  );
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
  pintarPasos();
  pintarPieVista();
  try { localStorage.setItem("estudio:seccion", id); } catch {}
}
on("ir", ({ seccion, ...op }) => irSeccion(seccion, op));

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
  e.title = app.guardado === "error" ? "El navegador no permite guardar. Exporta un ZIP para no perder el trabajo." : "Autoguardado en este navegador";
}
$("#btn-deshacer").append(icono("deshacer"));
$("#btn-rehacer").append(icono("rehacer"));
$("#btn-atajos").append(icono("teclado"));
$("#btn-abrir").append(icono("abrir"), h("span", { text: "Abrir" }));
$("#btn-exportar").append(icono("exportar"), h("span", { text: "Exportar" }));
$("#btn-deshacer").onclick = deshacer;
$("#btn-rehacer").onclick = rehacer;
$("#btn-abrir").onclick = () => dialogoAbrir();
$("#nombre-proyecto").onclick = () => dialogoAbrir();
$("#btn-exportar").onclick = () => irSeccion("exportar");
$("#btn-atajos").onclick = mostrarAtajos;

// ------------------------------------------------------------------ vista previa (iframe del visor real)
const iframe = $("#iframe-visor");
const vp = { listo: false, tCarga: 0, enviado: false, cargaIframe: false };
addEventListener("message", (e) => {
  if (e.source !== iframe.contentWindow || e.origin !== location.origin) return;
  const d = e.data;
  if (!d || typeof d.tipo !== "string") return;
  if (d.tipo === "visor:listo") { vp.listo = true; enviarTour(); }
  else if (d.tipo === "visor:vista") {
    app.vista = d;
    if (d.nodo && d.nodo !== app.nodo && pano(d.nodo)) { app.nodo = d.nodo; emitir("nodo", { origen: "visor" }); }
    emitir("vista", d);
  } else if (d.tipo === "visor:clic") emitir("clic", d);
});
iframe.addEventListener("load", () => {
  vp.listo = false; vp.cargaIframe = true;
  // Si el visor no anuncia "visor:listo" (versión antigua), se envía igualmente tras un margen.
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
  const t = tourParaExportar(app.tour, { mapaRutas: urlDe });
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
$("#vista-recargar").onclick = () => { vp.listo = false; iframe.src = "index.html?embed"; };
$("#vista-plegar").onclick = () => {
  if (matchMedia("(max-width: 860px)").matches) document.body.classList.toggle("vista-abierta");
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

// ------------------------------------------------------------------ teclado
function enCampo(e) {
  const t = e.target;
  return t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
}
addEventListener("keydown", (e) => {
  if (document.querySelector("dialog[open], .editor-mascara")) {
    if (document.querySelector(".editor-mascara") && !document.querySelector("dialog[open]")) return; // lo gestiona el editor de máscaras
    return;
  }
  const mod = e.ctrlKey || e.metaKey;
  const k = e.key.toLowerCase();
  if (mod && k === "z" && !enCampo(e)) { e.preventDefault(); e.shiftKey ? rehacer() : deshacer(); return; }
  if (mod && k === "y" && !enCampo(e)) { e.preventDefault(); rehacer(); return; }
  if (mod && k === "s") { e.preventDefault(); guardarAhora().then(() => toast(app.guardado === "error" ? "No se pudo guardar" : "Proyecto guardado", app.guardado === "error" ? "error" : "ok")); return; }
  if (mod && k === "o") { e.preventDefault(); dialogoAbrir(); return; }
  if (mod && k === "e") { e.preventDefault(); irSeccion("exportar"); return; }
  if (enCampo(e) || mod || e.altKey) return;
  if (/^[1-7]$/.test(e.key)) { irSeccion(SECCIONES[+e.key - 1].id); e.preventDefault(); return; }
  if (e.key === "?") { mostrarAtajos(); return; }
  if (actual?.teclas?.(e)) e.preventDefault();
});

function mostrarAtajos() {
  const f = (teclas, txt) => [h("span", {}, ...teclas.map((t) => h("kbd", { text: t }))), h("span", { text: txt })];
  dialogo({
    titulo: "Atajos de teclado", ancho: "min(560px, calc(100vw - 32px))",
    cuerpo: h("div", { class: "atajos" },
      h("h4", { text: "General" }),
      f(["Ctrl", "Z"], "Deshacer"), f(["Ctrl", "Shift", "Z"], "Rehacer"), f(["Ctrl", "S"], "Guardar ahora"),
      f(["Ctrl", "O"], "Abrir proyecto, ZIP o carpeta"), f(["Ctrl", "E"], "Exportar"), f(["1", "…", "7"], "Ir a cada paso"),
      h("h4", { text: "Plano" }),
      f(["V"], "Seleccionar y mover"), f(["K"], "Calibrar escala"), f(["E"], "Dibujar estancia"), f(["M"], "Dibujar muros"),
      f(["L"], "Enlazar fotos"), f(["Enter"], "Cerrar polígono"), f(["Supr"], "Borrar selección"), f(["Esc"], "Cancelar"),
      f(["Rueda"], "Zoom"), f(["Espacio", "arrastrar"], "Desplazar"), f(["0"], "Encuadrar todo"),
      h("h4", { text: "Orientar y puntos" }),
      f(["[", "]"], "Girar la foto 1°"), f(["Shift", "[", "]"], "Girar 10°"), f(["A"], "Alinear con la estancia elegida"),
      f(["P"], "Añadir punto de información"), f(["N", "B"], "Estancia siguiente / anterior"),
      h("h4", { text: "Editor de máscara" }),
      f(["W"], "Varita"), f(["B"], "Pincel"), f(["E"], "Goma"), f(["1", "2"], "Paredes / suelo"), f(["Alt", "clic"], "Restar con la varita"),
    ),
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
await iniciarProyecto();
