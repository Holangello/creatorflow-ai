// cre8eight Estudio: aplicación de creación de recorridos (sin backend, sin compilación).
// Organización (fase 3, S-1): 4 pasos — Fotos · Plano (opcional) · Datos · Publicar — y «Más herramientas» plegable
// (Orientación y notas · Estilo y luz · Extras). Sin modos: lo que se publica no depende de la interfaz.
import { app, on, emitir, h, $, icono, toast, deshacer, rehacer, puedeDeshacer, puedeRehacer, guardarAhora,
  nombreProyecto, tourParaExportar, urlDe, pano, dialogo, cargando, elegirArchivos, enfocarCampo } from "./estudio-nucleo.js";
import { iniciarProyecto, dialogoProyectos, nuevoProyecto, importarZip, importarCarpeta, importarArchivosSoltados, leerSoltado } from "./estudio-proyecto.js";
import { seccionFotos } from "./estudio-fotos.js";
import { seccionPlano } from "./estudio-plano.js";
import { seccionExtras } from "./estudio-material.js";
import { seccionOrientar } from "./estudio-orientar.js";
import { seccionEstilo } from "./estudio-variantes.js";
import { seccionDatos } from "./estudio-datos.js";
import { seccionPublicar, pendientes, copiaDeSeguridad } from "./estudio-exportar.js";
import { abrirPerfil, abrirContacto, perfilVacio } from "./estudio-perfil.js";

const SECCIONES = [seccionFotos, seccionPlano, seccionDatos, seccionPublicar, seccionOrientar, seccionEstilo, seccionExtras];
const porId = Object.fromEntries(SECCIONES.map((s) => [s.id, s]));
/** Pasos (atajos 1-4). El plano es el paso 2, opcional (ronda 2, decisión I: moverlo a «Más herramientas» es cambiar esta lista). */
const ORDEN = ["fotos", "plano", "datos", "publicar"];
const HERRAMIENTAS = ["orientacion", "estilo", "extras"];
/** Anclas antiguas → sección actual: la Guía, los marcadores y los proyectos guardados siguen funcionando. */
const ALIAS = { exportar: ["publicar"], revisar: ["publicar", { foco: "revisar" }], orientar: ["orientacion"], direccion: ["orientacion"],
  variantes: ["estilo"], material: ["extras"] };
const resolver = (id) => (porId[id] ? [id, {}] : ALIAS[id] ? [ALIAS[id][0], { ...(ALIAS[id][1] ?? {}) }] : [null, {}]);
const pasoDelHash = () => location.hash.replace(/^#/, "").split("&")[0];
const trabajo = $("#trabajo");
let actual = null;
let opcionesIniciales = {};

// ------------------------------------------------------------------ atajos de una tecla (se pueden desactivar)
app.atajos = (() => { try { return localStorage.getItem("estudio:atajos") !== "no"; } catch { return true; } })();

// ------------------------------------------------------------------ navegación
/** Siguiente paso: el de la lista; desde «Más herramientas», Publicar. */
app.pasoSiguiente = (id = app.seccion) => {
  const i = ORDEN.indexOf(id);
  const sig = i >= 0 ? ORDEN[i + 1] : "publicar";
  return sig && sig !== id ? { id: sig, titulo: porId[sig].corto } : null;
};
app.pasoAnterior = (id = app.seccion) => {
  const i = ORDEN.indexOf(id);
  return i > 0 ? { id: ORDEN[i - 1], titulo: porId[ORDEN[i - 1]].corto } : null;
};

let masAbierto = (() => { try { return localStorage.getItem("estudio:mas-herramientas") === "si"; } catch { return false; } })();
function botonPaso(s, n) {
  const r = s.resumen?.() ?? {};
  const herramienta = !n;
  let insignia = null;
  if (s.id === "publicar" && app.tour?.panoramas.length) {
    const { errores, avisos } = pendientes();
    if (errores) insignia = h("span", { class: "insignia", text: errores, title: `${errores} por corregir` });
    else if (avisos) insignia = h("span", { class: "insignia aviso", text: avisos, title: `${avisos} ${avisos === 1 ? "sugerencia" : "sugerencias"}` });
  }
  return h("button", {
    type: "button", class: `${r.hecho ? "hecho" : ""} ${herramienta ? "herramienta" : ""}`, "aria-current": s.id === app.seccion ? "page" : null,
    title: `${s.titulo}${app.atajos && n ? ` (${n})` : ""}`, "data-seccion": s.id, onclick: () => irSeccion(s.id),
  },
  herramienta ? h("span", { class: "num ico-paso" }, icono(s.icono ?? s.id, 15)) : h("span", { class: "num" }, r.hecho ? "✓" : String(n)),
  h("span", { class: "etq" }, h("b", { text: s.corto ?? s.titulo }), h("small", { text: r.texto ?? "" })),
  insignia);
}
function pintarPasos() {
  const nav = $("#pasos");
  if (!app.tour) return;
  nav.replaceChildren(
    ...ORDEN.map((id, i) => botonPaso(porId[id], i + 1)),
    h("div", { class: "separador", role: "presentation" }),
    // aria-label: el nombre no suma el rótulo corto «Más» que se pinta con ::after en pantallas medianas
    h("button", { type: "button", class: "mas-herramientas", "aria-expanded": String(masAbierto), "aria-controls": "lista-herramientas", "aria-label": "Más herramientas", title: "Más herramientas: orientación y notas, estilo y luz, extras",
      onclick: () => { masAbierto = !masAbierto; try { localStorage.setItem("estudio:mas-herramientas", masAbierto ? "si" : "no"); } catch {} pintarPasos(); } },
      h("span", { class: "num ico-paso" }, icono("herramientas", 15)),
      h("span", { class: "etq" }, h("b", { text: "Más herramientas", "data-corto": "Más" }), h("small", { text: "Orientación, estilo, extras" })),
      h("span", { class: "flecha", "aria-hidden": "true" }, icono(masAbierto ? "abajo" : "derecha", 14))),
    h("div", { id: "lista-herramientas", class: "grupo-herramientas", hidden: !masAbierto }, HERRAMIENTAS.map((id) => botonPaso(porId[id], 0))),
    h("div", { class: "pie-pasos" }, h("p", { text: "Se guarda solo en este ordenador. Para llevarlo a otro: Proyecto ▾ → Copia de seguridad." })));
}

function pieContinuar() {
  const sig = app.pasoSiguiente(), ant = app.pasoAnterior();
  const conFotos = app.tour.panoramas.length > 0; // S-3: «Continuar» no aparece hasta que haya fotos
  if (!(sig && conFotos) && !ant) return null;
  return h("div", { class: "seccion pie-paso" },
    ant ? h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--l", onclick: () => irSeccion(ant.id) }, `← ${ant.titulo}`) : h("span"),
    sig && conFotos ? h("button", { type: "button", class: "c8-boton c8-boton--primario c8-boton--l", onclick: () => irSeccion(sig.id), "data-continuar": sig.id }, `Continuar → ${sig.titulo}`) : null);
}

/** El pie cambia con el proyecto (p. ej. al llegar las primeras fotos aparece «Continuar»). */
function actualizarPie() {
  if (!actual || actual.sinPie) return;
  const viejo = trabajo.querySelector(":scope > .pie-paso"), nuevo = pieContinuar();
  if (viejo && nuevo) viejo.replaceWith(nuevo);
  else if (viejo) viejo.remove();
  else if (nuevo) trabajo.append(nuevo);
}
/** Cambia el paso del hash conservando la lista de la Guía mientras no se haya decidido («Usar» / «No usar»). */
function fijarHash(id) {
  const [paso, ...resto] = location.hash.replace(/^#/, "").split("&");
  const extra = resto.filter((x) => /^(estancias|tomas)=/.test(x));
  if (paso === id && resto.length === extra.length) return;
  history.replaceState(null, "", `${location.pathname}${location.search}#${[id, ...extra].join("&")}`);
}
export function irSeccion(id, opciones = {}) {
  const [sec, op] = resolver(id);
  const s = porId[sec];
  if (!s) return;
  opciones = { ...op, ...opciones };
  actual?.salir?.();
  app.seccion = sec;
  actual = s;
  if (HERRAMIENTAS.includes(sec)) masAbierto = true;
  document.body.className = document.body.className.replace(/\bseccion-\S+/g, "").trim() + ` seccion-${sec}`;
  trabajo.replaceChildren();
  trabajo.scrollTop = 0;
  s.render(trabajo, opciones);
  actualizarPie();
  pintarPasos();
  pintarPieVista();
  pintarBarra();
  try { localStorage.setItem("estudio:seccion", sec); } catch {}
  fijarHash(sec);
  // «Ver» y «Corregir» de «Antes de publicar» llevan al campo exacto.
  if (opciones.campo) requestAnimationFrame(() => { if (!enfocarCampo(trabajo, opciones.campo)) trabajo.focus({ preventScroll: true }); });
}
on("ir", (d = {}) => {
  if (d.perfil) return abrirContacto(d.perfil);
  if (d.menu === "proyecto") return menuProyecto();
  if (d.nodo && pano(d.nodo) && app.nodo !== d.nodo) { app.nodo = d.nodo; emitir("nodo", {}); }
  if (d.seccion === app.seccion && d.campo) { if (enfocarCampo(trabajo, d.campo)) return; }
  irSeccion(d.seccion, d);
});
addEventListener("hashchange", () => {
  const [id, op] = resolver(pasoDelHash());
  if (id && id !== app.seccion) irSeccion(id, op);
  else {
    if (id) fijarHash(id); // un alias (#exportar, #revisar) se normaliza
    if (op.foco === "revisar") $("#antes-de-publicar")?.focus();
    emitir("hash");
  }
});

// ------------------------------------------------------------------ barra superior
function pintarBarra() {
  if (!app.tour) return;
  $("#nombre-proyecto").textContent = nombreProyecto();
  $("#btn-deshacer").disabled = !puedeDeshacer();
  $("#btn-rehacer").disabled = !puedeRehacer();
  // «Publicar»: secundario hasta que haya fotos (S-3), principal después; dentro de Publicar, el principal es la descarga.
  const enPublicar = app.seccion === "publicar", principal = app.tour.panoramas.length > 0 && !enPublicar;
  const bp = $("#btn-publicar");
  bp.classList.toggle("c8-boton--primario", principal);
  bp.classList.toggle("c8-boton--secundario", !principal);
  if (enPublicar) bp.setAttribute("aria-current", "page"); else bp.removeAttribute("aria-current");
  const vacio = perfilVacio();
  $("#btn-perfil").classList.toggle("con-aviso", vacio);
  $("#btn-perfil").title = vacio ? "Mi inmobiliaria: aún sin completar (marca, WhatsApp y privacidad, una sola vez)" : "Mi inmobiliaria: marca, contacto y privacidad de todos tus recorridos";
  $("#btn-perfil").setAttribute("aria-label", vacio ? "Mi inmobiliaria (sin completar)" : "Mi inmobiliaria");
}
function pintarGuardado() {
  const e = $("#estado-guardado");
  e.className = "estado-guardado " + (app.guardado === "ok" ? "" : app.guardado === "error" ? "error" : "pendiente");
  e.replaceChildren(h("span", { text: app.guardado === "ok" ? "Guardado" : app.guardado === "error" ? "Sin guardar" : "Guardando…" }));
  e.title = app.guardado === "error" ? "El navegador no permite guardar. Descarga una copia de seguridad (Proyecto ▾ → Copia de seguridad)." : "Guardado automático en este ordenador";
}
$("#btn-deshacer").append(icono("deshacer"));
$("#btn-rehacer").append(icono("rehacer"));
$("#btn-proyecto").append(icono("abajo", 14));
$("#btn-guia").prepend(icono("guia", 16));
$("#btn-ayuda").append(icono("ayuda"));
$("#btn-apariencia").append(icono("apariencia"));
$("#btn-perfil").prepend(icono("inmobiliaria", 17));
$("#btn-vista").prepend(icono("ojo", 16));
$("#btn-publicar").prepend(icono("exportar", 16));
$("#btn-deshacer").onclick = deshacer;
$("#btn-rehacer").onclick = rehacer;
$("#btn-proyecto").onclick = () => menuProyecto();
$("#btn-ayuda").onclick = mostrarAyuda;
$("#btn-apariencia").onclick = () => menuApariencia();
$("#btn-perfil").onclick = () => abrirPerfil();
$("#btn-publicar").onclick = () => irSeccion("publicar");
$("#btn-vista").onclick = () => {
  const abierta = document.body.classList.toggle("vista-abierta");
  $("#btn-vista").setAttribute("aria-pressed", String(abierta));
};

// ------------------------------------------------------------------ «Proyecto ▾» (S-6 · S-7)
async function hacerCopia() {
  const capa = cargando("Preparando la copia de seguridad…");
  try { toast(await copiaDeSeguridad(), "ok", 6000); }
  catch (e) { console.error(e); toast(`No se pudo crear la copia de seguridad: ${e.message}`, "error", 7000); }
  finally { capa.remove(); }
}
function cerrarMenu({ foco = true } = {}) {
  const m = document.querySelector(".menu-proyecto");
  if (!m) return;
  m.remove();
  $("#btn-proyecto").setAttribute("aria-expanded", "false");
  removeEventListener("pointerdown", fueraDelMenu, true);
  if (foco) $("#btn-proyecto").focus();
}
function fueraDelMenu(e) { if (!e.target.closest(".menu-proyecto, #btn-proyecto")) cerrarMenu({ foco: false }); }
function menuProyecto() {
  if (document.querySelector(".menu-proyecto")) return cerrarMenu();
  const boton = $("#btn-proyecto");
  const opciones = [
    ["Mis proyectos…", "abrir", () => dialogoProyectos(), "Ctrl+O"],
    ["Proyecto nuevo", "nuevo", () => nuevoProyecto()],
    null,
    ["Copia de seguridad", "descargar", hacerCopia, "Todo el proyecto en un ZIP"],
    ["Restaurar copia…", "subir", async () => { const [f] = await elegirArchivos({ aceptar: ".zip,application/zip" }); if (f) importarZip(f); }],
    ["Importar carpeta (avanzado)…", "abrir", async () => {
      const fs = await elegirArchivos({ aceptar: "", carpeta: true, multiple: true });
      if (fs.length) importarCarpeta(fs.map((f) => ({ archivo: f, ruta: f.webkitRelativePath || f.name })));
    }, "Una carpeta con tour.json"],
  ];
  const menu = h("div", { class: "menu-proyecto c8-vidrio c8-vidrio--denso", role: "menu", "aria-label": "Proyecto" },
    opciones.map((o) => (o ? h("button", { type: "button", role: "menuitem", class: "item-menu", tabindex: "-1",
      onclick: () => { cerrarMenu({ foco: false }); o[2](); } }, icono(o[1], 17), h("span", { class: "texto" }, o[0]), o[3] ? h("small", { text: o[3] }) : null)
      : h("div", { class: "separador-menu", role: "separator" }))));
  const r = boton.getBoundingClientRect();
  Object.assign(menu.style, { top: `${Math.round(r.bottom + 6)}px`, left: `${Math.round(Math.max(8, Math.min(r.left, innerWidth - 300)))}px` });
  const items = () => [...menu.querySelectorAll("[role=menuitem]")];
  menu.addEventListener("keydown", (e) => {
    const xs = items(), i = xs.indexOf(document.activeElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); xs[(i + (e.key === "ArrowDown" ? 1 : -1) + xs.length) % xs.length].focus(); }
    else if (e.key === "Home" || e.key === "End") { e.preventDefault(); xs[e.key === "Home" ? 0 : xs.length - 1].focus(); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cerrarMenu(); }
    else if (e.key === "Tab") cerrarMenu({ foco: false });
  });
  document.body.append(menu);
  boton.setAttribute("aria-expanded", "true");
  items()[0].focus();
  addEventListener("pointerdown", fueraDelMenu, true);
}

// ------------------------------------------------------------------ Apariencia, tamaño y transparencia (decisión B: automático)
// Las preferencias son las de tema.js (cre8eight:tema|talla|transparencia): valen también para el visor y la Guía.
function cerrarApariencia({ foco = true } = {}) {
  const m = document.querySelector(".menu-apariencia");
  if (!m) return;
  m.quitar?.();
  m.remove();
  $("#btn-apariencia").setAttribute("aria-expanded", "false");
  removeEventListener("pointerdown", fueraApariencia, true);
  if (foco) $("#btn-apariencia").focus();
}
function fueraApariencia(e) { if (!e.target.closest(".menu-apariencia, #btn-apariencia")) cerrarApariencia({ foco: false }); }
function menuApariencia() {
  if (document.querySelector(".menu-apariencia")) return cerrarApariencia();
  const T = window.cre8Tema, boton = $("#btn-apariencia");
  if (!T) return toast("No se ha podido cargar la apariencia (tema.js): el Estudio sigue con el tema oscuro", "aviso");
  const grupo = (clave, etiqueta, opciones) => h("div", { class: "grupo" }, h("span", { class: "c8-mayus", id: `ap-${clave}`, text: etiqueta }),
    h("div", { class: "c8-segmentado", role: "radiogroup", "aria-labelledby": `ap-${clave}`, "data-pref": clave }, opciones.map(([v, t, titulo]) => {
      const r = h("input", { type: "radio", name: `ap-${clave}`, value: v });
      r.onchange = () => { if (r.checked) T.fijar(clave, v); };
      return h("label", { title: titulo }, r, h("span", { text: t }));
    })));
  const transparencia = h("input", { type: "checkbox", role: "switch", class: "c8-interruptor", id: "ap-transparencia" });
  transparencia.onchange = () => T.fijar("transparencia", transparencia.checked ? "reducida" : "normal");
  const sonidos = h("input", { type: "checkbox", role: "switch", class: "c8-interruptor", id: "ap-sonidos" });
  sonidos.onchange = () => T.fijar("sonidos", sonidos.checked ? "si" : "no");
  const menu = h("div", { class: "menu-apariencia c8-vidrio c8-vidrio--denso", role: "dialog", "aria-label": "Apariencia y tamaño" },
    grupo("tema", "Apariencia", [["auto", "Automático", "Como el sistema (claro de día, oscuro de noche)"], ["claro", "Claro"], ["oscuro", "Oscuro"]]),
    grupo("talla", "Tamaño", [["s", "S", "Pequeño"], ["m", "M", "Mediano"], ["l", "L", "Grande"]]),
    h("label", { class: "fila-interruptor", for: "ap-transparencia" }, transparencia,
      h("span", {}, h("b", { text: "Reducir transparencia" }), h("small", { class: "tenue", text: "Paneles opacos en lugar de vidrio." }))),
    window.cre8Sonidos ? h("label", { class: "fila-interruptor", for: "ap-sonidos" }, sonidos,
      h("span", {}, h("b", { text: "Sonidos de la interfaz" }), h("small", { class: "tenue", text: "Un sonido distinto para cada acción." }))) : null,
    h("p", { class: "nota", text: "Vale también para el visor y la Guía en este navegador." }));
  // Refleja los cambios hechos en otra pestaña, en el visor o en la Guía mientras está abierto.
  const sincronizar = () => {
    const pref = T.preferencias;
    for (const g of menu.querySelectorAll("[data-pref]")) for (const r of g.querySelectorAll("input")) r.checked = r.value === pref[g.dataset.pref];
    transparencia.checked = T.efectivo.transparencia === "reducida";
    sonidos.checked = T.efectivo.sonidos !== "no";
    T.segmentados(menu);
  };
  sincronizar();
  menu.quitar = T.alCambiar(sincronizar);
  menu.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cerrarApariencia(); } });
  menu.addEventListener("focusout", (e) => { if (e.relatedTarget && !menu.contains(e.relatedTarget) && e.relatedTarget !== boton) cerrarApariencia({ foco: false }); });
  document.body.append(menu);
  const r = boton.getBoundingClientRect();
  Object.assign(menu.style, { top: `${Math.round(r.bottom + 6)}px`, left: `${Math.round(Math.max(8, Math.min(r.right - menu.offsetWidth, innerWidth - menu.offsetWidth - 8)))}px` });
  boton.setAttribute("aria-expanded", "true");
  (menu.querySelector("input:checked") ?? menu.querySelector("input"))?.focus();
  addEventListener("pointerdown", fueraApariencia, true);
}

// ------------------------------------------------------------------ vista previa (iframe del visor real)
const iframe = $("#iframe-visor");
// Con ?tema= o ?talla= en la dirección del Estudio (capturas, pruebas), la vista previa se abre igual.
const SRC_VISTA = `index.html?embed&estudio${["tema", "talla"].map((k) => [k, new URLSearchParams(location.search).get(k)]).filter(([, v]) => v).map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join("")}`;
if (!iframe.src.endsWith(SRC_VISTA)) iframe.src = SRC_VISTA;
const vp = { listo: false, tCarga: 0, tAviso: 0, enviado: false, pedido: null, nodos: new Set() };
// Estancia que el Estudio ha pedido a la vista previa, hasta que el visor confirma que ha llegado (3 s como mucho). Mientras
// tanto no se recarga la vista previa y, si el visor vuelve a anunciar la estancia de antes (una recarga cruzada con la
// elección), no se adopta: se le repite la petición.
const pedidoVivo = () => vp.pedido && performance.now() - vp.pedido.t < 3000;
addEventListener("message", (e) => {
  if (e.source !== iframe.contentWindow || e.origin !== location.origin) return;
  const d = e.data;
  if (!d || typeof d.tipo !== "string") return;
  if (d.tipo === "visor:listo") { vp.listo = true; clearTimeout(vp.tAviso); $("#vista-error").hidden = true; enviarTour(); emitir("vistaLista"); }
  else if (d.tipo === "visor:vista") {
    if (pedidoVivo() && d.nodo !== vp.pedido.nodo && d.nodo === vp.pedido.desde) {
      if (vp.pedido.reintentos++ < 2) postVisor({ tipo: "visor:ir", nodo: vp.pedido.nodo });
      return;
    }
    if (d.nodo === vp.pedido?.nodo) vp.pedido = null;
    app.vista = d;
    if (d.nodo && d.nodo !== app.nodo && pano(d.nodo)) { app.nodo = d.nodo; emitir("nodo", { origen: "visor" }); }
    emitir("vista", d);
  } else if (d.tipo === "visor:clic") emitir("clic", d);
});
/** Contingencia (E5): sin «Recargar» fijo; si el visor no responde, se ofrece recargarlo. */
function vigilarVista() {
  clearTimeout(vp.tAviso);
  vp.tAviso = setTimeout(() => { if (!vp.listo) $("#vista-error").hidden = false; }, 12000);
}
iframe.addEventListener("load", () => {
  vp.listo = false; vp.pedido = null; app.vista = null; emitir("vista", null);
  // Si el visor no anuncia "visor:listo", se envía igualmente tras un margen.
  setTimeout(() => { if (!vp.listo) enviarTour(); }, 2500);
  vigilarVista();
});
vigilarVista();
$("#vista-reintentar").onclick = () => { $("#vista-error").hidden = true; vp.listo = false; iframe.src = SRC_VISTA; vigilarVista(); };
function postVisor(msg) {
  try { iframe.contentWindow?.postMessage(msg, location.origin); } catch (e) { console.warn(e); }
}
export function enviarTour() {
  clearTimeout(vp.tCarga);
  const vacio = !app.tour?.panoramas.length;
  $("#vista-vacia").hidden = !vacio;
  $("#vista").classList.toggle("sin-fotos", vacio);
  if (vacio) return;
  if (pedidoVivo()) { vp.tCarga = setTimeout(enviarTour, 250); return; } // sin recargar a mitad de un cambio de estancia
  // La vista previa muestra lo mismo que se publicará (sin documentación privada).
  const t = tourParaExportar(app.tour, { mapaRutas: urlDe, publico: true });
  vp.nodos = new Set(t.panoramas.map((x) => x.id));
  if (app.nodo && pano(app.nodo)) t.inicio = app.nodo;
  if (t.audio?.musica) t.audio.musica.autoplay = false; // en el Estudio la música solo suena si se pulsa el botón de sonido
  postVisor({ tipo: "visor:cargar", tour: t });
  if (app.nodo) postVisor({ tipo: "visor:ir", nodo: app.nodo });
  vp.enviado = true;
}
function programarCarga(ms) { clearTimeout(vp.tCarga); vp.tCarga = setTimeout(enviarTour, ms); }
export function visorIr(id) {
  const desde = app.vista?.nodo;
  vp.pedido = vp.nodos.has(id) && desde && desde !== id ? { nodo: id, desde, t: performance.now(), reintentos: 0 } : null;
  postVisor({ tipo: "visor:ir", nodo: id });
}
export function visorYaw(id, yaw) { postVisor({ tipo: "visor:yaw", nodo: id, yaw }); }
export const visorVentana = () => iframe.contentWindow;
app.vistaPrevia = { ir: visorIr, yaw: visorYaw, ventana: visorVentana, enviar: enviarTour, iframe, estado: vp };

function pintarSelectorVista() {
  const s = $("#vista-nodo");
  s.replaceChildren(...app.tour.panoramas.map((p) => h("option", { value: p.id, text: textoNombre(p), selected: p.id === app.nodo })));
  s.disabled = !app.tour.panoramas.length;
}
const textoNombre = (p) => (typeof p.nombre === "string" ? p.nombre : p.nombre?.es) || p.id;
// S-12: la vista previa como en un móvil (390 px de ancho) o en un ordenador; se recuerda en este navegador.
function fijarDispositivo(d) {
  document.body.classList.toggle("vista-movil", d === "movil");
  for (const i of document.querySelectorAll("#vista-dispositivo input")) i.checked = i.value === d;
  try { localStorage.setItem("estudio:vista-dispositivo", d); } catch {}
}
try { if (localStorage.getItem("estudio:vista-dispositivo") === "movil") fijarDispositivo("movil"); } catch {}
$("#vista-dispositivo").addEventListener("change", (e) => fijarDispositivo(e.target.value));
$("#vista-nodo").onchange = (e) => { app.nodo = e.target.value; emitir("nodo", { origen: "selector" }); };
$("#vista-plegar").append(icono("ampliar", 16));
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
  actualizarPie();
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
on("perfil", () => { pintarBarra(); pintarPasos(); });
on("proyecto", () => {
  pintarBarra(); pintarGuardado(); pintarSelectorVista();
  irSeccion(app.seccion, opcionesIniciales);
  opcionesIniciales = {};
  enviarTour();
});
on("pieVista", pintarPieVista);
on("abrir", () => dialogoProyectos());

// ------------------------------------------------------------------ teclado
function enCampo(e) {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return false;
  if (t.tagName === "INPUT") return !/^(checkbox|radio|range|color|button|submit|file)$/.test(t.type);
  return t.isContentEditable || /^(TEXTAREA|SELECT)$/.test(t.tagName);
}
addEventListener("keydown", (e) => {
  if (document.querySelector("dialog[open], .editor-mascara, .menu-proyecto, .menu-apariencia")) return; // los diálogos, los menús y el editor gestionan su teclado
  const mod = e.ctrlKey || e.metaKey;
  const k = e.key.toLowerCase();
  if (mod && k === "z" && !enCampo(e)) { e.preventDefault(); e.shiftKey ? rehacer() : deshacer(); return; }
  if (mod && k === "y" && !enCampo(e)) { e.preventDefault(); rehacer(); return; }
  if (mod && k === "s") { e.preventDefault(); guardarAhora().then(() => toast(app.guardado === "error" ? "No se pudo guardar" : "Proyecto guardado", app.guardado === "error" ? "error" : "ok")); return; }
  if (mod && k === "o") { e.preventDefault(); dialogoProyectos(); return; }
  if (mod && k === "e") { e.preventDefault(); irSeccion("publicar"); return; }
  // Atajos de una tecla: nunca dentro de un campo de texto, y se pueden desactivar en «Ayuda y atajos».
  if (enCampo(e) || mod || e.altKey) return;
  if (!app.atajos && e.key.length === 1) return; // desactivados: solo se ignoran las teclas de carácter (Esc, Enter, Supr… siguen)
  if (/^[1-9]$/.test(e.key) && +e.key <= ORDEN.length) { irSeccion(ORDEN[+e.key - 1]); e.preventDefault(); return; }
  if (e.key === "?") { mostrarAyuda(); return; }
  if (actual?.teclas?.(e)) e.preventDefault();
});

/** «?» · Ayuda y atajos (S-3): la Guía, los problemas frecuentes y los atajos de teclado. */
function mostrarAyuda() {
  const f = (teclas, txt) => [h("span", {}, ...teclas.map((t) => h("kbd", { text: t }))), h("span", { text: txt })];
  const interruptor = h("input", { type: "checkbox", role: "switch", class: "c8-interruptor", checked: app.atajos, id: "interruptor-atajos" });
  interruptor.onchange = () => {
    app.atajos = interruptor.checked;
    try { localStorage.setItem("estudio:atajos", app.atajos ? "si" : "no"); } catch {}
    pintarPasos();
    toast(app.atajos ? "Atajos de una tecla activados" : "Atajos de una tecla desactivados (Ctrl+Z, Ctrl+S… siguen funcionando)", "info", 3500);
  };
  dialogo({
    titulo: "Ayuda y atajos", ancho: "min(37.5rem, calc(100vw - 2rem))", clase: "dialogo-ayuda", foco: ".enlaces-ayuda a",
    cuerpo: h("div", {},
      h("div", { class: "enlaces-ayuda" },
        h("a", { class: "c8-boton c8-boton--secundario", href: "asistente-osmo.html", target: "_blank", rel: "noopener" }, icono("guia", 16), "Guía Osmo 360"),
        h("a", { class: "c8-boton c8-boton--secundario", href: "asistente-osmo.html#problemas", target: "_blank", rel: "noopener" }, icono("ayuda", 16), "Problemas frecuentes")),
      h("label", { class: "fila-interruptor", for: "interruptor-atajos" }, interruptor,
        h("span", {}, h("b", { text: "Atajos de una tecla" }), h("small", { class: "tenue", text: "Números para cambiar de paso y letras en el plano. Desactívalos si usas un lector de pantalla o el control por voz." }))),
      h("div", { class: "atajos" },
        h("h4", { text: "General" }),
        f(["Ctrl", "Z"], "Deshacer"), f(["Ctrl", "Shift", "Z"], "Rehacer"), f(["Ctrl", "S"], "Guardar ahora"),
        f(["Ctrl", "O"], "Mis proyectos"), f(["Ctrl", "E"], "Publicar"), f(["1", "…", String(ORDEN.length)], "Ir a cada paso"), f(["?"], "Ayuda y atajos"),
        h("h4", { text: "Plano" }),
        f(["V"], "Seleccionar y mover"), f(["K"], "Calibrar escala (con plano)"), f(["E"], "Dibujar estancia"), f(["L"], "Conectar fotos"),
        f(["M"], "Dibujar muros"), f(["Enter"], "Cerrar el contorno"), f(["Supr"], "Borrar selección"), f(["Esc"], "Cancelar"),
        f(["Rueda"], "Zoom"), f(["Espacio", "arrastrar"], "Desplazar"), f(["0"], "Encuadrar todo"),
        h("h4", { text: "Orientación y notas" }),
        f(["[", "]"], "Girar la foto 1°"), f(["Shift", "[", "]"], "Girar la foto 10°"), f(["A"], "Alinear con la puerta elegida"),
        f(["P"], "Añadir una nota"), f(["N", "B"], "Estancia siguiente / anterior"),
        h("h4", { text: "Zonas de color (Estilo y luz)" }),
        f(["W"], "Varita"), f(["B"], "Pincel"), f(["E"], "Goma"), f(["1", "2"], "Paredes / suelo"), f(["Alt", "clic"], "Quitar con la varita"))),
    botones: [{ texto: "Cerrar", primario: true }],
  });
}

// ------------------------------------------------------------------ móvil (S-9): el Estudio necesita un ordenador o un iPad
// Solo en pantallas táctiles: un ordenador con el zoom al 200 % (o una ventana estrecha) sigue en el Estudio.
function avisoMovil() {
  const pequena = matchMedia("(pointer: coarse) and (max-width: 759px), (pointer: coarse) and (max-height: 479px)").matches;
  let seguir = false;
  try { seguir = sessionStorage.getItem("estudio:seguir-movil") === "si"; } catch {}
  if (!pequena || seguir) return;
  const enlace = location.href;
  const asunto = "Abrir el Estudio de cre8eight en el ordenador";
  const opciones = h("div", { class: "opciones-enviar", hidden: true },
    h("a", { class: "c8-boton c8-boton--secundario c8-boton--bloque", href: `https://wa.me/?text=${encodeURIComponent(`${asunto}: ${enlace}`)}`, target: "_blank", rel: "noopener" }, icono("chat", 18), "WhatsApp"),
    h("a", { class: "c8-boton c8-boton--secundario c8-boton--bloque", href: `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(enlace)}` }, icono("correo", 18), "Email"),
    h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--bloque", onclick: async (e) => {
      try { await navigator.clipboard.writeText(enlace); e.currentTarget.textContent = "Enlace copiado"; } catch { toast("Copia la dirección de la barra del navegador", "aviso"); }
    } }, icono("copiar", 18), "Copiar enlace"));
  const d = h("dialog", { class: "aviso-movil c8-base", "aria-labelledby": "aviso-movil-titulo", "aria-describedby": "aviso-movil-texto" },
    h("div", { class: "aviso-movil-contenido" },
      h("span", { class: "logo-e grande", "aria-hidden": "true", text: "c8" }),
      h("h1", { id: "aviso-movil-titulo", text: "El Estudio necesita un ordenador o un iPad" }),
      h("p", { id: "aviso-movil-texto", text: "Aquí se preparan las fotos 360, el plano y la publicación: en una pantalla tan pequeña cuesta mucho. Envíate el enlace y ábrelo en el ordenador." }),
      h("button", { type: "button", class: "c8-boton c8-boton--primario c8-boton--bloque", onclick: async () => {
        if (navigator.share) { try { await navigator.share({ title: asunto, url: enlace }); return; } catch (e) { if (e?.name === "AbortError") return; } }
        opciones.hidden = false; opciones.querySelector("a, button")?.focus();
      } }, icono("movil", 18), "Enviarme el enlace"),
      opciones,
      h("a", { class: "c8-boton c8-boton--secundario c8-boton--bloque", href: "asistente-osmo.html" }, icono("guia", 18), "Abrir la Guía Osmo 360"),
      h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--bloque", onclick: () => d.close() }, "Seguir aquí de todos modos")));
  d.addEventListener("close", () => { try { sessionStorage.setItem("estudio:seguir-movil", "si"); } catch {} d.remove(); });
  document.body.append(d);
  d.showModal();
}

// ------------------------------------------------------------------ soltar archivos en cualquier parte
let contArrastre = 0;
const capa = $("#arrastre");
const conArchivos = (e) => [...(e.dataTransfer?.types ?? [])].includes("Files");
addEventListener("dragenter", (e) => { if (!conArchivos(e)) return; contArrastre++; capa.hidden = false; });
addEventListener("dragleave", (e) => { if (!conArchivos(e)) return; if (--contArrastre <= 0) { contArrastre = 0; capa.hidden = true; } });
addEventListener("dragover", (e) => { if (conArchivos(e)) e.preventDefault(); });
addEventListener("drop", async (e) => {
  if (e.dataTransfer?.files?.length) window.cre8Sonidos?.tocar("soltar");
  if (!conArchivos(e)) return;
  e.preventDefault();
  contArrastre = 0; capa.hidden = true;
  const archivos = await leerSoltado(e.dataTransfer);
  if (!archivos.length) return;
  if (actual?.soltar && (await actual.soltar(archivos, e))) return;
  importarArchivosSoltados(archivos);
});

// ------------------------------------------------------------------ arranque
// Al cerrar o recargar se guarda. Solo mientras se importan fotos el navegador pregunta antes de salir (se perderían);
// el resto del tiempo no molesta (tampoco a las recargas de las pruebas, que esperan a que termine la importación).
addEventListener("beforeunload", (e) => {
  guardarAhora();
  if (app.importando?.()) { e.preventDefault(); e.returnValue = ""; }
});
try { const [s] = resolver(localStorage.getItem("estudio:seccion")); if (s) app.seccion = s; } catch {}
{ const [s, op] = resolver(pasoDelHash()); if (s) { app.seccion = s; opcionesIniciales = op; } } // enlaces de la Guía: estudio.html#plano
window.__estudio = app; // para depurar y para las pruebas automáticas
avisoMovil();
await iniciarProyecto();
