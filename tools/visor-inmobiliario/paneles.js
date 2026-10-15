// Paneles de negocio del visor: la tarjeta del inmueble (precio → ficha, Contactar, Foto de la vista, Estilo y luz),
// el contacto por WhatsApp o CRM con fotos de la vista, compartir, idioma, ajustes y los elementos del menú «Más».
// Uso: import("./paneles.js").then((m) => m.iniciarPaneles(window.visor))
// Se programa contra la API de ESQUEMA.md de forma defensiva: cada método del núcleo se comprueba antes de usarlo, y lo
// que aún no exista (p. ej. visor.mas o visor.giroscopio) tiene una alternativa propia o simplemente no se ofrece.

import { tr, fijarIdioma, idiomaActual, resolverTexto, detectarIdioma, localeActual, nombreIdioma, alCambiarIdioma, diccionario } from "./i18n.js";
import { urlSegura, almacen, areaPoligono, slug } from "./util.js";

const R = resolverTexto;
const CLAVE_CONTACTO = "visor:contacto";
const MAX_FOTOS = 6;
const ESTILOS_POR_DEFECTO = ["original", "nordico", "mediterraneo", "industrial", "contemporaneo_minimalista", "clasico"];
const MOMENTOS = ["dia", "atardecer", "noche"];
// Escala oficial del certificado energético (los tokens --ce-* de tema.css; aquí el respaldo)
const ENERGIA = { A: "#00a651", B: "#4cb848", C: "#bfd730", D: "#e8d900", E: "#fdb913", F: "#f37021", G: "#ed1c24" };
const ENERGIA_OSCURO = new Set(["C", "D", "E"]);
// Muestras decorativas de cada estilo (solo ambientación del selector)
const MUESTRAS_ESTILO = {
  original: ["#d9d4cc", "#8c8478", "#3a3631"], nordico: ["#f2efe9", "#d8c3a5", "#9aa5a0"],
  mediterraneo: ["#f7f4ee", "#2f6f9f", "#c96a3d"], industrial: ["#5b5b5b", "#2b2b2b", "#a2523a"],
  contemporaneo_minimalista: ["#ece8e1", "#b9ab97", "#1e1e1e"], clasico: ["#efe6d2", "#8a6d3b", "#4a2f27"],
};

// ------------------------------------------------------------------ iconos (SVG 24×24, trazo)
const P = {
  cama: "M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 15h18M6 10V7.5a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1V10M12.5 10V7.5a1 1 0 0 1 1-1H17a1 1 0 0 1 1 1V10M3 18v2M21 18v2",
  bano: "M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM6 12V6a2 2 0 0 1 3.6-1.2M7 19l-1 2M17 19l1 2",
  superficie: "M4 4h16v16H4zM4 9h3M4 14h3M9 4v3M14 4v3",
  util: "M3.5 3.5h17v17h-17zM8 8h8v8H8z",
  parcela: "M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3zM9 4v13M15 7v13",
  planta: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
  energia: "M13 2.5L5 13.5h6l-1 8 8-11h-6z",
  pincel: "M18.4 2.6a2 2 0 0 1 2.9 2.9L13 13.8 10.2 11zM9 14.5c-2 0-3.5 1.5-3.5 3.5 0 1-.8 2-2.5 2 1 1 2.5 1.5 4 1.5 2.5 0 4.5-2 4.5-4.5",
  regla: "M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2",
  play: "M8 5l11 7-11 7z",
  compartir: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4",
  globo: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z",
  ajustes: "M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4",
  whatsapp: "M3.5 20.5l1.3-4.3A8.5 8.5 0 1 1 8 19.4zM9 8.6c0 3.4 3 6.4 6.4 6.4l1-1.5-2-1-1 .9a5 5 0 0 1-2.8-2.8l.9-1-1-2z",
  chat: "M4 5h16v11H9l-5 4z",
  cerrar: "M6 6l12 12M18 6L6 18",
  der: "M9 6l6 6-6 6", izq: "M15 6l-6 6 6 6", arriba: "M6 15l6-6 6 6",
  copiar: "M9 9h11v11H9zM5 15H4V4h11v1",
  descargar: "M12 4v12M7 11l5 5 5-5M5 20h14",
  sol: "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  atardecer: "M3 18h18M7 18a5 5 0 0 1 10 0M12 3v4M4.9 9.9l1.4 1.4M19.1 9.9l-1.4 1.4M2 14h2M20 14h2M6 21h12",
  luna: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z",
  pin: "M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  doc: "M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6",
  tel: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  correo: "M3 5h18v14H3zM3 6l9 7 9-7",
  calc: "M6 3h12v18H6zM9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01",
  info: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM12 11v5M12 8h.01",
  ok: "M5 12.5l4.5 4.5L19 7.5",
  alerta: "M12 3l10 18H2zM12 10v4M12 17h.01",
  comparar: "M12 3v18M4 6h5v12H4zM15 6h5v12h-5z",
  externo: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  ficha: "M5 3h14v18H5zM9 8h6M9 12h6M9 16h4",
  camara: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  musica: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  mas: "M4.5 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0M10.5 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0M16.5 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0",
  pantalla: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  movil: "M9.5 2.5h5A2.5 2.5 0 0 1 17 5v14a2.5 2.5 0 0 1-2.5 2.5h-5A2.5 2.5 0 0 1 7 19V5a2.5 2.5 0 0 1 2.5-2.5zM3 9a10 10 0 0 0 0 6M21 9a10 10 0 0 1 0 6",
};
const RELLENO = new Set(["play", "mas"]);

// Iconos animados (fase 4): pathLength="1" deja que el trazo se dibuje al aparecer (clase pn-dibujar, en paneles.css)
const NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}
function ic(nombre, clase = "pn-ic") {
  const s = svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false", class: clase });
  const p = svgEl("path", { d: P[nombre] ?? P.info });
  if (RELLENO.has(nombre)) { p.setAttribute("fill", "currentColor"); p.setAttribute("stroke", "none"); }
  else p.setAttribute("pathLength", "1");
  s.append(p);
  return s;
}
// «Apariencia»: un círculo a medio llenar; lo oscuro crece según lo elegido (claro ¼ · automático ½ · oscuro ¾). Nunca un
// sol ni una luna, que son la luz de la vivienda (fase3-organizacion.md §7). El relleno se desliza con muelle (CSS).
function icApariencia(valor) {
  const id = nuevoId("ap");
  const s = svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false", class: "pn-ic pn-ic-apariencia", "data-v": valor });
  const recorte = svgEl("clipPath", { id }), defs = svgEl("defs"), relleno = svgEl("g", { "clip-path": `url(#${id})` });
  recorte.append(svgEl("circle", { cx: 12, cy: 12, r: 8.25 }));
  defs.append(recorte);
  relleno.append(svgEl("rect", { class: "pn-ap-relleno", x: 3.75, y: 3.75, width: 16.5, height: 16.5, fill: "currentColor", stroke: "none" }));
  s.append(defs, svgEl("circle", { cx: 12, cy: 12, r: 8.25, pathLength: 1 }), relleno);
  return s;
}
// Reinicia una animación de CSS (clase de un solo uso: latido del contador, obturador de «Foto de la vista»…)
function animar(el, clase, ms = 700) {
  if (!el?.classList) return;
  el.classList.remove(clase);
  void el.getBoundingClientRect(); // fuerza el estilo: la misma clase vuelve a empezar
  el.classList.add(clase);
  clearTimeout(el._pnAnim); el._pnAnim = setTimeout(() => el.classList.remove(clase), ms);
}
// Iconos del menú «Más»: el núcleo los conoce por su nombre; el menú propio (sin visor.mas) usa estos
const ICONO_MAS = { compartir: "compartir", idioma: "globo", ajustes: "ajustes", guiada: "play", medir: "regla", pantalla: "pantalla", giroscopio: "movil" };

// ------------------------------------------------------------------ utilidades DOM
const PROPS = new Set(["value", "checked", "disabled", "hidden", "selected", "open", "textContent", "htmlFor", "inert"]);
function h(tag, props, ...hijos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (PROPS.has(k)) el[k] = v;
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  agregar(el, hijos);
  return el;
}
function agregar(el, hijos) {
  for (const c of hijos.flat(Infinity)) {
    if (c == null || c === false || c === "") continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}
const vacio = (v) => v == null || v === "" || (Array.isArray(v) && !v.length);
let uid = 0;
const nuevoId = (p) => `pn-${p}-${++uid}`;

// ------------------------------------------------------------------ formato y validación
const fmtNum = (n, d = 0) => new Intl.NumberFormat(localeActual(), { maximumFractionDigits: d, minimumFractionDigits: 0 }).format(n);
function fmtMoneda(n, d = 0) {
  const moneda = T?.inmueble?.moneda ?? "EUR";
  try { return new Intl.NumberFormat(localeActual(), { style: "currency", currency: moneda, maximumFractionDigits: d, minimumFractionDigits: d }).format(n); }
  catch { return `${fmtNum(n, d)} ${moneda}`; }
}
const m2 = (n) => `${fmtNum(n, n < 100 ? 1 : 0)} m²`;

export function cuotaHipoteca(capital, interesAnual, anos) {
  const n = Math.round(anos * 12), r = interesAnual / 100 / 12;
  if (capital <= 0 || n <= 0) return 0;
  return r === 0 ? capital / n : (capital * r) / (1 - (1 + r) ** -n);
}

export function telefonoValido(t) {
  const s = String(t ?? "").replace(/[\s\-().]/g, "");
  if (!/^(\+|00)?\d{9,15}$/.test(s)) return false;
  const internacional = s.startsWith("+") || s.startsWith("00");
  if (!internacional && s.length === 9) return /^[6789]/.test(s); // España sin prefijo
  return internacional || s.length >= 10;
}

// Imágenes del tour (logo, fotos, renders): las mismas reglas que los enlaces, más blob: y data:image
const srcSegura = (u) => urlSegura(u, { imagen: true });
const emailValido = (e) => typeof e === "string" && /^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[^\s@<>()"',;:]+$/.test(e.trim());
// Colores del tour que acaban en un atributo style: solo #rgb / #rrggbb (nada de CSS arbitrario)
const colorValido = (c) => (typeof c === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c.trim()) ? c.trim() : null);
// Números del tour: 349000, "349000" o "349.000,50"
function numero(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string" || !v.trim()) return null;
  let t = v.replace(/\s|€|\$|£|EUR/gi, "");
  t = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t) ? t.replace(/\./g, "").replace(",", ".") : t.replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
const esTactil = () => !!globalThis.matchMedia?.("(pointer: coarse)").matches;
const esMac = () => /Mac|iPhone|iPad|iPod/i.test(navigator.userAgentData?.platform ?? navigator.platform ?? navigator.userAgent ?? "");

// ------------------------------------------------------------------ estado del módulo
let V = null, T = {}, raiz = null;
const ui = {
  disp: "lateral", ficha: false, altura: "peek", dialogo: null, opener: null, menu: false,
  borrador: { nombre: "", telefono: "", pregunta: "", privacidad: false, zona: undefined },
  envio: { estado: "inactivo" },
  hip: null, descripcionAbierta: false, midiendo: false, guiada: false, ajustes: null,
  capturas: [], capturando: false, tomando: false, zonaManual: false, autoQuitada: false,
  filtroGaleria: "todo", lightbox: null, tocados: new Set(), giro: false, giroPedido: false,
};
const limpiezas = [];
let toast = null, masIds = [], masFirma = "";

const est = () => V?.estado ?? {};
const tiene = (fn) => typeof fn === "function";
const masDelNucleo = () => tiene(V?.mas?.agregar);

// ------------------------------------------------------------------ inicio
export function iniciarPaneles(visor) {
  destruir();
  V = visor ?? window.visor ?? {};
  T = V.tour ?? {};
  raiz = document.getElementById("paneles");
  if (!raiz) { raiz = h("div", { id: "paneles" }); document.body.append(raiz); }
  toast = h("div", { class: "pn-toast c8-vidrio c8-vidrio--texto", role: "status", "aria-live": "polite" });

  let param = null; try { param = new URLSearchParams(location.search).get("lang"); } catch {}
  fijarIdioma(!param && est().idioma && diccionario[est().idioma] ? est().idioma : detectarIdioma(T));
  try { document.documentElement.lang = idiomaActual(); } catch {}

  const guardado = almacen.leer(CLAVE_CONTACTO, null);
  if (guardado) { ui.borrador.nombre = guardado.nombre ?? ""; ui.borrador.telefono = guardado.telefono ?? ""; }
  if (!temaApi()) marcarMovimiento(ajustesActuales().reducirMovimiento); // sin tema.js: la clase propia de los paneles

  ui.disp = calcularDisposicion();
  renderizar();
  // Los iconos de la tarjeta se dibujan al aparecer: ya, o al cerrar la portada del núcleo («empezar»)
  if (!V.portada?.visible) requestAnimationFrame(dibujarTarjeta);
  // Apariencia, talla, transparencia o movimiento cambiados aquí, en otra pestaña o por el sistema
  const api = temaApi();
  if (tiene(api?.alCambiar)) limpiezas.push(api.alCambiar(alCambiarTema));

  const on = (ev, fn) => { if (tiene(V.on)) { V.on(ev, fn); limpiezas.push(() => V.off?.(ev, fn)); } };
  for (const ev of ["nodo", "estilo", "momento", "pintura", "comparar"]) on(ev, () => refrescar(ev));
  on("modo", () => renderizar());
  on("idioma", (d) => { const c = typeof d === "string" ? d : d?.idioma ?? d?.cod; if (c && c !== idiomaActual()) fijarIdioma(c); });
  on("guion:inicio", () => { ui.guiada = true; refrescar(); });
  on("guion:fin", () => { ui.guiada = false; refrescar(); });
  on("medir", (d) => { ui.midiendo = typeof d === "boolean" ? d : !!(d?.activo ?? est().midiendo); refrescar(); });
  // Un tour nuevo (carga inicial, recarga o «visor:cargar» del Estudio) rehace todo lo que dependía del anterior
  const alTour = () => { cambiarTour(V.tour ?? T); renderizar(); };
  on("tour", alTour);
  on("listo", alTour);
  on("sonido", () => pintarSonido());
  on("empezar", () => { colocar(); dibujarTarjeta(); });
  // Modo juego: ningún botón queda a la vista; lo abierto se cierra
  on("modojuego", (d) => { if (d?.activo) cerrarTodo(); });
  on("giroscopio", (d) => {
    ui.giro = !!d?.activo;
    if (ui.giroPedido) aviso(tr(ui.giro ? "aviso.giroscopio_on" : "aviso.giroscopio_off"));
    ui.giroPedido = false;
    sincronizarMas(true);
  });
  limpiezas.push(alCambiarIdioma(() => renderizar()));

  const escuchar = (obj, ev, fn, op) => { obj.addEventListener(ev, fn, op); limpiezas.push(() => obj.removeEventListener(ev, fn, op)); };
  escuchar(window, "resize", () => {
    const d = calcularDisposicion();
    if (d !== ui.disp) { ui.disp = d; ui.altura = "peek"; ui.ficha = false; ui.menu = false; renderizar(); } else { colocar(); sincronizarMas(); }
  });
  escuchar(document, "keydown", (e) => { if (e.key === "Escape") escape(e); });
  escuchar(document, "fullscreenchange", () => sincronizarMas());
  escuchar(document, "webkitfullscreenchange", () => sincronizarMas());
  // El menú «Más» propio se cierra al pulsar fuera
  escuchar(document, "pointerdown", (e) => { if (ui.menu && !e.target.closest?.(".pn-menu, [data-k='mas']")) cerrarMenu(false); }, true);
  // body.modo-libre, ui-inactiva y raton-capturado los pone el núcleo
  let capturado = document.body.classList.contains("raton-capturado");
  const mo = new MutationObserver(() => {
    const c = document.body.classList.contains("raton-capturado");
    if (c && !capturado) cerrarTodo();
    capturado = c;
    colocar();
  });
  mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  limpiezas.push(() => mo.disconnect());
  if (typeof ResizeObserver === "function") {
    const ro = new ResizeObserver(() => colocar());
    const barra = barraNucleo();
    if (barra) ro.observe(barra);
    let vista = null;
    limpiezas.push(() => ro.disconnect());
    observarTarjeta = (t) => { if (t === vista) return; if (vista) ro.unobserve(vista); vista = t; if (t) ro.observe(t); };
    observarTarjeta(raiz.querySelector(".pn-tarjeta"));
  }

  return { renderizar, abrirFicha: () => abrirFicha(true), abrirContacto: () => abrirDialogo("contacto"), cerrar: cerrarDialogo, destruir };
}
let observarTarjeta = () => {};

export function destruir() {
  while (limpiezas.length) { try { limpiezas.pop()(); } catch {} }
  for (const id of masIds) { try { V?.mas?.quitar?.(id); } catch {} }
  masIds = []; masFirma = "";
  observarTarjeta = () => {};
  if (raiz) { raiz.replaceChildren(); raiz.className = ""; }
  for (const v of ["--reserva-inferior", "--ancho-dock"]) { try { document.documentElement.style.removeProperty(v); } catch {} }
}

function cambiarTour(nuevo) {
  T = nuevo ?? {};
  ui.hip = null; ui.filtroGaleria = "todo"; ui.lightbox = null; ui.descripcionAbierta = false;
  ui.capturando = false; vaciarCapturas(); ui.autoQuitada = false;
  ui.envio = { estado: "inactivo" }; ui.tocados = new Set();
  ui.zonaManual = false; ui.borrador.zona = ui.dialogo === "contacto" ? zonaPorDefecto() : undefined;
  if (T.idiomas?.length && !T.idiomas.includes(idiomaActual())) fijarIdioma(detectarIdioma(T));
}
// Por si el núcleo sustituye visor.tour sin avisar: cualquier repintado lo detecta
function sincronizarTour() {
  const t = V?.tour;
  if (!t || t === T) return false;
  cambiarTour(t);
  return true;
}

function calcularDisposicion() {
  const w = innerWidth, hh = innerHeight;
  if (hh <= 500 && w > hh) return "compacta";          // móvil en horizontal
  if (w <= 720 || (hh > w && w <= 1024)) return "hoja"; // móvil y tablet en vertical
  return "lateral";                                     // escritorio y tablet en horizontal
}
function clasesRaiz() {
  return ["pn-raiz", `pn-disp-${ui.disp}`, ui.ficha && "pn-ficha-abierta", ui.dialogo && `pn-con-dialogo pn-dlg-${ui.dialogo}`,
    ui.capturando && "pn-capturando", ui.menu && "pn-con-menu"].filter(Boolean).join(" ");
}

// ------------------------------------------------------------------ apariencia común (tema.js: window.cre8Tema)
// Apariencia, Tamaño, Reducir transparencia y Reducir movimiento son preferencias del visitante que comparten el visor,
// el Estudio y la Guía (localStorage cre8eight:tema|talla|transparencia|movimiento). Sin tema.js solo queda «Reducir
// movimiento», que entonces guarda el núcleo (visor.ajustes, alias de la fase 4).
const temaApi = () => (tiene(globalThis.cre8Tema?.fijar) ? globalThis.cre8Tema : null);
function temaLeer(que) { // "efectivo" (lo aplicado) | "preferencias" (lo elegido, con "auto")
  const t = temaApi(); if (!t) return null;
  try { const v = t[que]; return (tiene(v) ? v.call(t) : v) ?? null; } catch { return null; }
}
const fijarTema = (clave, valor) => { try { return temaApi()?.fijar(clave, valor) === true; } catch { return false; } };
const PREF_DEF = { tema: "auto", talla: "m", transparencia: "auto", movimiento: "auto" };

// ------------------------------------------------------------------ ajustes del visor (los guarda el núcleo: visor.ajustes)
const AJUSTES_DEF = () => ({ sensibilidad: 1, modoJuegoWASD: true, capturaConClic: false, atajos: true,
  reducirMovimiento: !!globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches });
function ajustesActuales() {
  let a = null;
  try { if (tiene(V?.ajustes)) a = V.ajustes({}); } catch {}
  const r = { ...AJUSTES_DEF(), ...(ui.ajustes ?? {}), ...(a && typeof a === "object" ? a : {}) };
  const ef = temaLeer("efectivo");
  if (ef?.movimiento) r.reducirMovimiento = ef.movimiento === "reducido"; // una sola fuente de verdad (contrato 4)
  return r;
}
function cambiarAjuste(obj) {
  const { reducirMovimiento, ...resto } = obj;
  ui.ajustes = { ...(ui.ajustes ?? {}), ...resto };
  if (Object.keys(resto).length) { try { if (tiene(V.ajustes)) V.ajustes(resto); } catch (e) { console.warn(e); } }
  if (typeof reducirMovimiento === "boolean") fijarMovimiento(reducirMovimiento ? "reducido" : "normal");
}
// Movimiento: la preferencia común de tema.js (el núcleo la lee de ahí); sin tema.js, el alias visor.ajustes y la clase propia
function fijarMovimiento(valor) { // "reducido" | "normal" | "auto"
  if (fijarTema("movimiento", valor)) return;
  const si = valor === "auto" ? AJUSTES_DEF().reducirMovimiento : valor === "reducido";
  ui.ajustes = { ...(ui.ajustes ?? {}), reducirMovimiento: si };
  try { if (tiene(V.ajustes)) V.ajustes({ reducirMovimiento: si }); } catch (e) { console.warn(e); }
  marcarMovimiento(si);
}
const marcarMovimiento = (si) => document.documentElement.classList.toggle("pn-sin-movimiento", !!si);
// Cambió la apariencia (aquí, en otra pestaña, por ?tema= o por el sistema): Ajustes lo refleja sin repintarse y, como
// la talla cambia los tamaños, se recolocan la hoja, los diálogos y el menú
function alCambiarTema() {
  if (!raiz) return;
  pintarApariencia();
  requestAnimationFrame(() => colocar());
}

// ------------------------------------------------------------------ datos derivados
const inm = () => T.inmueble ?? {};
const panoramas = () => (Array.isArray(T.panoramas) ? T.panoramas : []);
const esProyecto = () => inm().estado_obra === "proyecto";
function nodoActual() { const id = est().nodo; return panoramas().find((p) => p.id === id) ?? null; }
const nombreEstancia = () => R(nodoActual()?.nombre) || "";
// Enlace a la vista actual. Vacío si el recorrido no tiene dirección web (HTML autónomo abierto desde el disco sin
// url_publica, o la vista previa del Estudio): nunca se comparte una ruta file://.
const enlaceVista = () => {
  try { if (tiene(V.enlaceVista)) return V.enlaceVista() || ""; } catch { return ""; }
  return /^https?:$/.test(location.protocol) ? location.href : "";
};
const titulo = () => R(T.titulo) || R(inm().tipo ? tr(`tipo.${inm().tipo}`) : "") || document.title;

// Estilo y luz (PA3): estilos IA solo en proyectos; colores donde el tour los traiga (lo normal, en viviendas construidas;
// si un proyecto trae los dos, se ven ambos); luz y antes/después en todos
function listaEstilos() {
  if (!esProyecto()) return [];
  const conVariantes = panoramas().some((p) => (p.variantes ?? []).some((v) => v.estilo && v.estilo !== "original"));
  if (!conVariantes && !T.estilos?.length) return [];
  let lista = T.estilos?.length ? T.estilos.map((e) => (typeof e === "string" ? { id: e } : e)).filter((e) => e?.id) : null;
  if (!lista?.length) {
    const ids = new Set(panoramas().flatMap((p) => (p.variantes ?? []).map((v) => v.estilo).filter(Boolean)));
    lista = [...ESTILOS_POR_DEFECTO.filter((id) => ids.has(id)), ...[...ids].filter((id) => !ESTILOS_POR_DEFECTO.includes(id))].map((id) => ({ id }));
  }
  if (!lista.some((e) => e.id === "original")) lista.unshift({ id: "original" });
  return lista.length > 1 && tiene(V.fijarEstilo) ? lista : [];
}
function nombreEstilo(e) {
  if (e.nombre) return R(e.nombre);
  const k = `estilo.${e.id}`, t = tr(k);
  return t === k ? String(e.id).replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()) : t;
}
function estiloDisponible(id = est().estilo) {
  if (!id || id === "original") return true;
  if (typeof est().estiloDisponible === "boolean" && id === est().estilo) return est().estiloDisponible;
  const n = nodoActual(); if (!n) return true;
  return (n.variantes ?? []).some((v) => v.estilo === id);
}
// Solo los momentos que existen: los del tour (el núcleo ya los normaliza) o los que tienen foto
function listaMomentos() {
  let m = T.momentos?.length ? T.momentos : null;
  if (!m) {
    const reales = new Set(panoramas().flatMap((p) => (p.variantes ?? []).map((v) => v.momento)).filter((x) => x && x !== "dia"));
    m = reales.size ? ["dia", ...MOMENTOS.filter((x) => reales.has(x))] : [];
  }
  m = m.filter((x) => MOMENTOS.includes(x));
  return m.length > 1 && tiene(V.fijarMomento) ? m : [];
}
const hayPintura = () => tiene(V.fijarPintura) && panoramas().some((p) => p.mascara || (p.variantes ?? []).some((v) => v.mascara))
  && [...(T.personalizacion?.paredes ?? []), ...(T.personalizacion?.suelos ?? [])].some((m) => colorValido(m?.color));
const hayEstiloLuz = () => listaEstilos().length > 0 || hayPintura() || listaMomentos().length > 0;
// Visita guiada con 3 estancias o más (o un guion de 2 paradas), como en la portada y en «Estancias y plano» del núcleo
const hayGuiada = () => tiene(V.guion?.iniciar) && ((Array.isArray(T.guion) ? T.guion.length : 0) >= 2 || panoramas().length >= 3);
// En la tablet en vertical el núcleo la pone al principio de su tira de estancias: entonces no se repite en «Más»
const guiadaEnTira = () => !!document.querySelector("#galeria .guiada")?.getClientRects().length;
const hayMedir = () => tiene(V.medir) && est().modo !== "maqueta";
const puedeCapturar = () => tiene(V.capturar) || tiene(V.lienzo?.toBlob);
const idiomasOfrecidos = () => (T.idiomas?.length ? T.idiomas : [idiomaActual()]).filter((c) => diccionario[c]);

const precioNum = () => { const n = numero(inm().precio); return n && n > 0 ? n : null; };
function textoPrecio() {
  const precio = precioNum();
  if (!precio) return tr("ficha.precio_consultar");
  return fmtMoneda(precio) + (inm().operacion === "alquiler" ? tr("ficha.mes") : "");
}
function etiquetaTipo() {
  const i = inm(), tipo = i.tipo ? tr(`tipo.${i.tipo}`) : "";
  const op = i.operacion === "alquiler" ? tr("ficha.alquiler") : i.operacion === "venta" ? tr("ficha.venta") : "";
  return [tipo && tipo !== `tipo.${i.tipo}` ? tipo : R(i.tipo), op].filter(Boolean).join(" · ");
}
// Letra del certificado energético (la de consumo, o la de emisiones), o null si está en trámite o falta
function letraEnergia() {
  const c = inm().certificado_energetico;
  if (!c || c.en_tramite) return null;
  const l = String(c.consumo_letra || c.emisiones_letra || "").trim().toUpperCase();
  return ENERGIA[l] ? l : null;
}
const insigniaEnergia = (l, clase = "pn-ee-mini") => h("span", { class: clase, style: `--c:var(--ce-${l.toLowerCase()}, ${ENERGIA[l]})`, "data-oscuro": ENERGIA_OSCURO.has(l) ? "" : null }, l);
// «3 hab · 2 baños · 112 m²» (corto, para la tarjeta) y su versión completa para lectores de pantalla
// (en el teléfono, el CSS deja solo habitaciones y metros: los baños están en la ficha)
function datosTarjeta() {
  const i = inm(), corto = [], largo = [];
  const hab = numero(i.habitaciones), ban = numero(i.banos), sup = numero(i.superficie_construida) || numero(i.superficie_util);
  if (hab != null) { corto.push(["hab", tr("tarjeta.hab", { x: fmtNum(hab) })]); largo.push(`${fmtNum(hab)} ${(hab === 1 ? tr("ficha.habitacion") : tr("ficha.habitaciones")).toLowerCase()}`); }
  if (ban != null) { corto.push(["banos", tr(ban === 1 ? "tarjeta.bano" : "tarjeta.banos", { x: fmtNum(ban) })]); largo.push(`${fmtNum(ban)} ${(ban === 1 ? tr("ficha.bano") : tr("ficha.banos")).toLowerCase()}`); }
  if (sup) { corto.push(["sup", m2(sup)]); largo.push(m2(sup)); }
  const l = letraEnergia();
  if (l) largo.push(tr("energia.letra", { x: l }));
  return { corto, largo, letra: l };
}

// ------------------------------------------------------------------ render principal
function renderizar() {
  if (!raiz) return;
  sincronizarTour();
  if (ui.dialogo === "estilo" && !hayEstiloLuz()) ui.dialogo = null;
  if (ui.dialogo === "idioma" && idiomasOfrecidos().length < 2) ui.dialogo = null;
  const foco = raiz.contains(document.activeElement) ? document.activeElement?.dataset?.k : null;
  raiz.className = clasesRaiz();
  const t = tarjeta();
  raiz.replaceChildren(...[
    t,
    h("div", { class: "pn-velo", hidden: !(ui.dialogo && ui.disp !== "lateral" && ui.dialogo !== "estilo"), onclick: cerrarDialogo }),
    dialogo(),
    ui.menu ? menuPropio() : null,
    ui.capturando ? barraCaptura() : null,
    ui.lightbox ? lightbox() : null,
    toast,
  ].filter(Boolean));
  observarTarjeta(t);
  aplicarEstadoFicha();
  pintarContador();
  colocar();
  sincronizarMas();
  if (ui.dialogo === "compartir") pintarQR();
  if (foco) raiz.querySelector(`[data-k="${CSS.escape(foco)}"]`)?.focus({ preventScroll: true });
}

// Actualiza solo lo que depende del estado del visor, sin perder el foco
function refrescar(ev) {
  if (!raiz) return;
  if (sincronizarTour()) { renderizar(); return; }
  ui.midiendo = typeof est().midiendo === "boolean" ? est().midiendo : ui.midiendo;
  ui.guiada = typeof est().guionActivo === "boolean" ? est().guionActivo : ui.guiada;
  for (const b of raiz.querySelectorAll("[data-k='medir']")) b.setAttribute("aria-pressed", String(ui.midiendo));
  for (const b of raiz.querySelectorAll("[data-k='guiada']")) b.setAttribute("aria-pressed", String(ui.guiada));
  if (ui.dialogo === "estilo") { if (ev === "nodo") rehacerDialogo(); else pintarEstilo(); }
  if (ui.dialogo === "contacto" && ev === "nodo" && !ui.zonaManual && ui.envio.estado === "inactivo") {
    ui.borrador.zona = zonaPorDefecto();
    const sel = raiz.querySelector(".pn-dialogo [data-k='c-zona']");
    if (sel && document.activeElement !== sel) sel.value = ui.borrador.zona;
  }
  sincronizarMas();
}

function rehacerDialogo() {
  const viejo = raiz?.querySelector(".pn-dialogo");
  if (!viejo) return;
  const teniaFoco = viejo.contains(document.activeElement);
  const foco = document.activeElement?.dataset?.k;
  // lo que se desplaza: el cuerpo o, en el contacto, sus campos (el pie no se mueve)
  const DESPLAZA = ".pn-dlg-cuerpo, .pn-form-campos";
  const scroll = [...viejo.querySelectorAll(DESPLAZA)].map((e) => e.scrollTop);
  const nuevo = dialogo();
  if (!nuevo) { viejo.remove(); return; }
  viejo.replaceWith(nuevo);
  colocarDialogo();
  if (ui.dialogo === "compartir") pintarQR();
  nuevo.querySelectorAll(DESPLAZA).forEach((e, i) => { e.scrollTop = scroll[i] ?? 0; });
  if (foco) nuevo.querySelector(`[data-k="${CSS.escape(foco)}"]`)?.focus({ preventScroll: true });
  // si el control que tenía el foco ya no existe (cambio de pantalla), pasa al botón principal o al título
  if (teniaFoco && !nuevo.contains(document.activeElement)) (nuevo.querySelector("[autofocus]") ?? nuevo.querySelector(".pn-dlg-tit"))?.focus({ preventScroll: true });
}

// Aviso flotante; con { accion, alPulsar } lleva un botón (p. ej. «Deshacer») y dura más
function aviso(texto, { accion, alPulsar } = {}) {
  if (!toast) return;
  // (replaceChildren convertiría un null en el texto «null»: agregar() se salta los vacíos)
  toast.replaceChildren();
  agregar(toast, [h("span", {}, texto),
    accion ? h("button", { type: "button", class: "c8-boton c8-boton--s c8-boton--fantasma pn-toast-accion", "data-k": "aviso-accion",
      onclick: () => { ocultarAviso(); alPulsar?.(); } }, accion) : null]);
  colocarAviso();
  toast.classList.add("pn-visible");
  clearTimeout(aviso.t); aviso.t = setTimeout(ocultarAviso, accion ? 6000 : 2600);
}
const ocultarAviso = () => toast?.classList.remove("pn-visible");
// El aviso nunca tapa un diálogo abierto: en el móvil sube por encima de la hoja; en el escritorio y en el móvil en
// horizontal, si cae encima, se centra en la escena libre que queda a la izquierda del diálogo
function colocarAviso() {
  if (!toast || !raiz) return;
  toast.style.removeProperty("--pn-aviso-abajo"); toast.style.removeProperty("--pn-aviso-x");
  const d = raiz.querySelector(".pn-dialogo")?.getBoundingClientRect();
  if (!d?.height) return;
  if (ui.disp === "hoja") { toast.style.setProperty("--pn-aviso-abajo", `${Math.round(innerHeight - d.top + 12)}px`); return; }
  const t = toast.getBoundingClientRect();
  const cruza = t.width && t.left < d.right && d.left < t.right && t.top < d.bottom && d.top < t.bottom;
  if (cruza && d.left > t.width + 24) toast.style.setProperty("--pn-aviso-x", `${Math.round(d.left / 2)}px`);
}

function destello() {
  const d = h("div", { class: "pn-destello", "aria-hidden": "true" });
  raiz.append(d); setTimeout(() => d.remove(), 450);
}

// Modo juego (ratón capturado): se cierra todo lo que se pueda pulsar
function cerrarTodo() {
  if (!raiz) return;
  ui.menu = false; ui.lightbox = null; ui.dialogo = null;
  if (ui.disp === "hoja") ui.altura = "peek";
  ui.ficha = false;
  renderizar();
}

// ------------------------------------------------------------------ tarjeta del inmueble
// Una sola pieza en todos los tamaños: precio y datos (abren la ficha), «Contactar», «Foto de la vista» y, según el
// tamaño, «Estilo y luz» o las acciones con texto. La ficha se despliega desde la propia tarjeta, que hace de cabecera.
function tarjeta() {
  const lateral = ui.disp === "lateral";
  const fotoVista = botonIconoTexto("foto-vista", "camara", tr("contacto.hacer_foto"), fotoDeLaVista, { oculto: !puedeCapturar() });
  const t = h("aside", { class: "pn-tarjeta c8-vidrio c8-vidrio--texto", id: "pn-tarjeta", "aria-label": tr("tarjeta.titulo") },
    h("div", { class: "pn-t-cab" },
      ui.disp === "hoja" ? h("span", { class: "pn-asa", "aria-hidden": "true" }, h("span")) : null,
      botonResumen(),
      // escritorio: «Contactar» y «Foto de la vista» en dos columnas; móvil: una fila de botones que, si con la talla
      // elegida no cabe junto al precio, pasa entera a una segunda fila (paneles.css)
      lateral ? [botonContactar(), fotoVista] : h("div", { class: "pn-t-botones" },
        fotoVista,
        hayEstiloLuz() ? botonIconoTexto("estilo-luz", "pincel", tr("personalizar.titulo"), (e) => alternarDialogo("estilo", e.currentTarget),
          { "aria-haspopup": "dialog", "aria-expanded": String(ui.dialogo === "estilo") }) : null,
        botonContactar(),
        masDelNucleo() ? null : botonIconoTexto("mas", "mas", tr("mas.titulo"), (e) => alternarMenu(e.currentTarget), { "aria-haspopup": "menu", "aria-expanded": String(ui.menu) }))),
    lateral ? acciones() : null,
    panel());
  if (ui.disp === "hoja") prepararArrastre(t);
  return t;
}

function botonResumen() {
  const lateral = ui.disp === "lateral", { corto, largo, letra } = datosTarjeta(), sobre = lateral ? etiquetaTipo() : "";
  return h("button", { type: "button", class: "pn-t-resumen", "data-k": "ficha", "aria-controls": "pn-ficha", "aria-expanded": String(ui.ficha),
    "aria-label": `${tr("ficha.ver")}: ${[textoPrecio(), ...largo].join(", ")}`, onclick: () => abrirFicha(!ui.ficha) },
    sobre ? h("span", { class: "pn-t-sobre" }, sobre) : null,
    h("span", { class: "pn-t-precio" }, textoPrecio()),
    h("span", { class: "pn-t-datos" },
      corto.length ? h("span", { class: "pn-t-datos-txt" }, corto.map(([k, t], n) => h("span", { class: `pn-t-dato pn-t-dato-${k}` }, n ? ` · ${t}` : t))) : null,
      letra ? insigniaEnergia(letra) : null,
      lateral ? h("span", { class: "pn-t-ver" }, tr("ficha.ver")) : null,
      ic(lateral ? "der" : "arriba", "pn-ic pn-ic-s pn-chev")));
}

function botonContactar() {
  const n = ui.capturas.length;
  // el bocadillo enseña los puntos de «escribiendo» al pasar el ratón (paneles.css)
  const bocadillo = ic("chat");
  for (const cx of [8.5, 12, 15.5]) bocadillo.append(svgEl("circle", { class: "pn-escribe", cx, cy: 10.5, r: 1 }));
  return h("button", { type: "button", class: "c8-boton c8-boton--primario pn-t-contactar", "data-k": "contactar", "aria-haspopup": "dialog",
    "aria-expanded": String(ui.dialogo === "contacto"), "aria-label": n ? tr("contacto.con_fotos", { x: textoNumFotos(n) }) : null,
    onclick: (e) => alternarDialogo("contacto", e.currentTarget) },
    bocadillo, h("span", {}, tr("contacto.corto")), h("span", { class: "pn-num", "aria-hidden": "true", hidden: !n }, n ? String(n) : ""));
}
// El contador de «Contactar · 2» y el estado de «Foto de la vista», sin repintar (no se pierde el foco). El número late
// cuando sube (cambio de estado animado).
let ultimoNum = 0;
function pintarContador() {
  const n = ui.capturas.length;
  for (const b of raiz?.querySelectorAll("[data-k='contactar']") ?? []) {
    const num = b.querySelector(".pn-num");
    if (num) { num.textContent = n ? String(n) : ""; num.hidden = !n; if (n > ultimoNum) animar(num, "pn-latido"); }
    if (n) b.setAttribute("aria-label", tr("contacto.con_fotos", { x: textoNumFotos(n) })); else b.removeAttribute("aria-label");
  }
  ultimoNum = n;
  for (const b of raiz?.querySelectorAll("[data-k='foto-vista']") ?? []) b.setAttribute("aria-disabled", String(n >= MAX_FOTOS || ui.tomando));
}
// Los iconos de la tarjeta se dibujan una vez al aparecer (no en cada repintado por idioma, tamaño o tour)
function dibujarTarjeta() { animar(raiz?.querySelector(".pn-tarjeta"), "pn-dibujar", 1200); }

// Botón de icono con su nombre (visible o no según el tamaño: lo decide el CSS)
function botonIconoTexto(k, icono, texto, onclick, extra = {}) {
  const { oculto, ...attrs } = extra;
  if (oculto) return null;
  return h("button", { type: "button", class: `c8-boton c8-boton--secundario pn-t-boton pn-t-${k}`, "data-k": k, "aria-label": texto, onclick, ...attrs },
    ic(icono), h("span", { class: "pn-t-et" }, texto));
}

// Escritorio: acciones con el texto debajo (Estilo y luz · Visita guiada · Medir), y «Más» si el núcleo no lo tiene
function acciones() {
  const l = [];
  const accion = (k, icono, texto, onclick, extra) => l.push(h("button", { type: "button", class: "pn-accion", "data-k": k, onclick, ...extra }, ic(icono), h("span", {}, texto)));
  if (hayEstiloLuz()) accion("estilo-luz", "pincel", tr("personalizar.titulo"), (e) => alternarDialogo("estilo", e.currentTarget), { "aria-haspopup": "dialog", "aria-expanded": String(ui.dialogo === "estilo") });
  if (hayGuiada()) accion("guiada", "play", tr("guion.iniciar"), alternarGuiada, { "aria-pressed": String(ui.guiada) });
  if (hayMedir()) accion("medir", "regla", tr("medir.titulo"), alternarMedir, { "aria-pressed": String(ui.midiendo) });
  if (!masDelNucleo()) accion("mas", "mas", tr("mas.titulo"), (e) => alternarMenu(e.currentTarget), { "aria-haspopup": "menu", "aria-expanded": String(ui.menu) });
  return l.length ? h("div", { class: "pn-t-acciones", role: "group", "aria-label": tr("herramientas.titulo") }, l) : null;
}

function alternarMedir() {
  ui.midiendo = !ui.midiendo;
  try { V.medir?.(ui.midiendo); } catch (e) { console.warn(e); }
  if (ui.midiendo) { cerrarDialogo(); if (ui.disp !== "lateral") abrirFicha(false); }
  refrescar();
}
function alternarGuiada() {
  try { if (ui.guiada) V.guion?.parar?.(); else { V.guion?.iniciar?.(); cerrarDialogo(); if (ui.disp !== "lateral") abrirFicha(false); } } catch (e) { console.warn(e); }
  ui.guiada = !ui.guiada; // los eventos guion:inicio / guion:fin lo confirman
  refrescar();
}

// --- la ficha se abre desde la tarjeta: en el escritorio crece hacia abajo; en el móvil es una hoja que sube
function abrirFicha(si) {
  if (!raiz) return;
  if (ui.disp === "hoja") { fijarAltura(si ? "medio" : "peek"); return; }
  ui.ficha = !!si;
  if (si) ui.menu = false;
  aplicarEstadoFicha();
  colocar();
}
function aplicarEstadoFicha() {
  if (!raiz) return;
  raiz.classList.toggle("pn-ficha-abierta", ui.ficha);
  raiz.querySelector(".pn-tarjeta")?.classList.toggle("pn-abierto", ui.ficha);
  for (const b of raiz.querySelectorAll("[data-k='ficha']")) b.setAttribute("aria-expanded", String(ui.ficha));
  const p = raiz.querySelector(".pn-panel");
  if (p) { p.hidden = ui.disp !== "hoja" && !ui.ficha; p.inert = !ui.ficha; }
}
const enfocarResumen = () => raiz?.querySelector("[data-k='ficha']")?.focus({ preventScroll: true });

// ------------------------------------------------------------------ colocación y espacio que se publica al núcleo
const barraNucleo = () => document.getElementById("barra-vista") ?? document.getElementById("iconos");
function colocar(animar = false) {
  if (!raiz) return;
  const doc = document.documentElement.style;
  // La tarjeta (escritorio) y la ficha abierta (móvil en horizontal) empiezan bajo la barra de vista del núcleo
  const rb = barraNucleo()?.getBoundingClientRect();
  raiz.style.setProperty("--pn-arriba", `${rb && rb.height && rb.bottom < innerHeight / 2 ? Math.round(rb.bottom + 8) : 64}px`);
  if (ui.disp === "hoja") { doc.setProperty("--ancho-dock", "0px"); colocarHoja(animar); }
  else {
    doc.setProperty("--reserva-inferior", "0px");
    // Ancho que la tarjeta ocupa abajo a la derecha, para que la tira de estancias del núcleo no quede debajo. En reposo
    // la tarjeta se reduce: se mantiene el último valor para que el núcleo no se mueva.
    const t = raiz.querySelector(".pn-tarjeta"), r = t?.getBoundingClientRect();
    if (r?.width && !document.body.classList.contains("ui-inactiva")) {
      const ancho = Math.max(0, Math.round(innerWidth - r.left));
      raiz.style.setProperty("--pn-columna", `${ancho}px`); // los diálogos del escritorio se abren a su izquierda
      doc.setProperty("--ancho-dock", `${r.bottom > innerHeight - 160 ? ancho : 0}px`);
    }
  }
  colocarDialogo(); colocarMenu(); colocarBarra(); colocarAviso();
}

// --- hoja inferior (móvil y tablet en vertical): alturas, arrastre y reserva para el núcleo
const ALTURAS = { peek: 0, medio: 0.5, alto: 0.9 };
// alto desde el borde de arriba de la tarjeta hasta el final de su cabecera (con el borde del vidrio y sin redondeos)
function altoCab() {
  const c = raiz?.querySelector(".pn-t-cab"); if (!c) return 64;
  return Math.ceil(c.getBoundingClientRect().bottom - c.closest(".pn-tarjeta").getBoundingClientRect().top);
}
function segInf() {
  const c = raiz?.querySelector(".pn-t-cab"); if (!c) return 0;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return Math.max(0, (parseFloat(getComputedStyle(c).paddingBottom) || 0) - 0.625 * rem); // padding = 0,625rem + zona segura
}
function alturaVisible(nombre) {
  const c = altoCab();
  return nombre === "peek" ? c : Math.max(c, Math.round(innerHeight * ALTURAS[nombre]));
}
function fijarAltura(nombre) {
  if (ui.disp !== "hoja") { abrirFicha(nombre !== "peek"); return; }
  ui.altura = nombre; ui.ficha = nombre !== "peek";
  aplicarEstadoFicha();
  colocarHoja(true);
}
function colocarHoja(animar) {
  const t = raiz?.querySelector(".pn-tarjeta"); if (!t) return;
  const libre = document.body.classList.contains("modo-libre");
  raiz.classList.toggle("pn-libre", libre);
  if (libre && ui.altura !== "peek") { ui.altura = "peek"; ui.ficha = false; aplicarEstadoFicha(); }
  const total = t.getBoundingClientRect().height || innerHeight * 0.9;
  const vis = Math.min(total, alturaVisible(ui.altura));
  t.classList.toggle("pn-sin-anim", !animar);
  t.style.setProperty("--pn-desp", `${total - vis}px`);
  t.style.setProperty("--pn-oculto", `${total - vis}px`);
  t.dataset.altura = ui.altura;
  // en el modo libre la tarjeta es una píldora a la derecha: no hace falta reservar todo el ancho
  let reserva = libre ? 0 : Math.max(0, altoCab() - segInf());
  // en modo captura la barra flotante ocupa el sitio de la tarjeta
  const barra = ui.capturando && raiz.querySelector(".pn-barra-captura");
  if (barra) reserva = barra.offsetHeight + 10;
  document.documentElement.style.setProperty("--reserva-inferior", `${reserva}px`);
}
function prepararArrastre(t) {
  let ini = null;
  const zona = (e) => e.target.closest(".pn-t-cab") && !e.target.closest("button:not([data-k='ficha'])");
  t.addEventListener("pointerdown", (e) => {
    if (!zona(e) || e.button > 0) return;
    ini = { y: e.clientY, t: performance.now(), desp: parseFloat(t.style.getPropertyValue("--pn-desp")) || 0, total: t.getBoundingClientRect().height, movido: false, id: e.pointerId };
  });
  t.addEventListener("pointermove", (e) => {
    if (!ini || e.pointerId !== ini.id) return;
    const dy = e.clientY - ini.y;
    if (!ini.movido && Math.abs(dy) < 6) return;
    if (!ini.movido) { ini.movido = true; t.setPointerCapture(e.pointerId); t.classList.add("pn-sin-anim"); }
    t.style.setProperty("--pn-desp", `${Math.min(ini.total - alturaVisible("peek"), Math.max(0, ini.desp + dy))}px`);
  });
  const fin = (e) => {
    if (!ini || e.pointerId !== ini.id) return;
    const d = ini; ini = null;
    if (!d.movido) return; // un toque: lo gestiona el propio botón
    e.preventDefault();
    const vel = (e.clientY - d.y) / Math.max(1, performance.now() - d.t); // px/ms, + hacia abajo
    const vis = d.total - (parseFloat(t.style.getPropertyValue("--pn-desp")) || 0) - vel * 180;
    const opciones = Object.keys(ALTURAS).map((n) => [n, Math.abs(alturaVisible(n) - vis)]).sort((a, b) => a[1] - b[1]);
    const tragar = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
    t.addEventListener("click", tragar, { capture: true, once: true });
    setTimeout(() => t.removeEventListener("click", tragar, { capture: true }), 0);
    fijarAltura(opciones[0][0]);
  };
  t.addEventListener("pointerup", fin);
  t.addEventListener("pointercancel", fin);
}

// --- diálogos, menú y barra de captura: junto a su botón en el escritorio
function colocarDialogo() {
  const d = raiz?.querySelector(".pn-dialogo"); if (!d) return;
  let arriba = null;
  const k = ui.opener?.dataset?.k, op = k && raiz.querySelector(`.pn-tarjeta [data-k="${CSS.escape(k)}"]`);
  if (ui.disp === "lateral" && op && ui.dialogo === "estilo") {
    const r = op.getBoundingClientRect();
    arriba = Math.round(Math.max(r.top - 12, parseFloat(raiz.style.getPropertyValue("--pn-arriba")) || 64));
  }
  if (arriba == null) d.style.removeProperty("--pn-dlg-arriba"); else d.style.setProperty("--pn-dlg-arriba", `${arriba}px`);
}
function colocarMenu() {
  const m = raiz?.querySelector(".pn-menu"), b = raiz?.querySelector(".pn-tarjeta [data-k='mas']");
  if (!m || !b) return;
  const r = b.getBoundingClientRect();
  m.style.right = `${Math.max(8, Math.round(innerWidth - r.right))}px`;
  if (ui.disp === "lateral") { m.style.top = `${Math.round(r.bottom + 6)}px`; m.style.bottom = ""; }
  else { m.style.bottom = `${Math.round(innerHeight - r.top + 6)}px`; m.style.top = ""; }
}
// La barra de captura, encima de la tira de estancias del núcleo si está a la vista
function colocarBarra() {
  const b = raiz?.querySelector(".pn-barra-captura"); if (!b || ui.disp === "hoja") return;
  const g = document.getElementById("galeria")?.getBoundingClientRect();
  const sobre = g && g.width && g.height && g.top > innerHeight / 2 ? Math.round(innerHeight - g.top + 10) : null;
  if (sobre == null) b.style.removeProperty("--pn-bc-abajo"); else b.style.setProperty("--pn-bc-abajo", `${sobre}px`);
}

// ------------------------------------------------------------------ menú «Más» (lo pinta el núcleo; aquí sus elementos)
const btnMasNucleo = () => document.getElementById("btn-mas");
function pantallaEnMas() {
  if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled) || document.body.classList.contains("embed")) return false;
  const b = document.getElementById("btn-pantalla");
  return !b || b.hidden || !b.getClientRects().length; // solo si el núcleo no lo tiene ya en su barra
}
const giroEnMas = () => tiene(V.giroscopio) && esTactil() && "DeviceOrientationEvent" in window && est().modo !== "libre" && est().modo !== "maqueta";
function alternarPantalla() {
  const d = document, el = d.documentElement;
  try {
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen ?? d.webkitExitFullscreen)?.call(d);
    else { const r = (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el); r?.catch?.(() => {}); }
  } catch {}
}
// Escritorio: Compartir · Idioma · Ajustes. Móvil, además: Visita guiada · Medir · Pantalla completa · Mirar moviendo el móvil
// marcado: casilla en el menú (función: se evalúa al pintarlo). accion recibe { origen } (el botón «Más»).
function elementosMas() {
  const movil = ui.disp !== "lateral", l = [];
  const abrir = (tipo) => (o) => abrirDialogo(tipo, o?.origen ?? btnMasNucleo() ?? raiz?.querySelector("[data-k='mas']"));
  if (movil && hayGuiada() && !guiadaEnTira()) l.push({ id: "pn-guiada", texto: tr("guion.iniciar"), icono: "guiada", accion: alternarGuiada, orden: 10, marcado: () => ui.guiada });
  if (movil && hayMedir()) l.push({ id: "pn-medir", texto: tr("medir.titulo"), icono: "medir", accion: alternarMedir, orden: 20, marcado: () => ui.midiendo });
  l.push({ id: "pn-compartir", texto: tr("compartir.titulo"), icono: "compartir", accion: abrir("compartir"), orden: 30 });
  if (idiomasOfrecidos().length > 1) l.push({ id: "pn-idioma", texto: tr("idioma.titulo"), icono: "idioma", accion: abrir("idioma"), orden: 40 });
  l.push({ id: "pn-ajustes", texto: tr("ajustes.titulo"), icono: "ajustes", accion: abrir("ajustes"), orden: 50 });
  if (movil && pantallaEnMas()) l.push({ id: "pn-pantalla", texto: tr("comun.pantalla_completa"), icono: "pantalla", accion: alternarPantalla, orden: 60,
    marcado: () => !!(document.fullscreenElement || document.webkitFullscreenElement) });
  if (movil && giroEnMas()) l.push({ id: "pn-giroscopio", texto: tr("comun.giroscopio"), icono: "giroscopio", orden: 70, marcado: () => ui.giro,
    accion: () => { ui.giroPedido = true; try { V.giroscopio(); } catch (e) { console.warn(e); } } });
  return l;
}
// Registra los elementos en visor.mas solo cuando cambian (idioma, tamaño, tour, estado de la visita…)
function sincronizarMas(forzar = false) {
  if (!masDelNucleo()) return;
  const items = elementosMas();
  const firma = JSON.stringify(items.map((i) => [i.id, i.texto, i.orden]));
  if (!forzar && firma === masFirma) return;
  for (const id of masIds) { try { V.mas.quitar?.(id); } catch {} }
  masIds = [];
  for (const it of items) {
    try { V.mas.agregar({ ...it, donde: "siempre" }); masIds.push(it.id); }
    catch (e) { console.warn("Más:", e); }
  }
  masFirma = firma;
}

// --- alternativa propia mientras el núcleo no tenga visor.mas: un botón «Más» en la tarjeta y su menú
function alternarMenu(opener) { if (ui.menu) cerrarMenu(true); else { ui.menu = true; ui.opener = opener; renderizar(); raiz.querySelector(".pn-menu [role=menuitem]")?.focus(); } }
function cerrarMenu(devolverFoco) {
  if (!ui.menu) return;
  ui.menu = false;
  raiz.querySelector(".pn-menu")?.remove();
  raiz.classList.remove("pn-con-menu");
  for (const b of raiz.querySelectorAll("[data-k='mas']")) b.setAttribute("aria-expanded", "false");
  if (devolverFoco) raiz.querySelector("[data-k='mas']")?.focus();
}
function menuPropio() {
  const items = elementosMas();
  const mover = (e) => {
    const bs = [...e.currentTarget.querySelectorAll("[role=menuitem]")], i = bs.indexOf(document.activeElement);
    const d = { ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (d) { e.preventDefault(); bs[(i + d + bs.length) % bs.length]?.focus(); }
    else if (e.key === "Home" || e.key === "End") { e.preventDefault(); bs[e.key === "Home" ? 0 : bs.length - 1]?.focus(); }
    else if (e.key === "Tab") cerrarMenu(false);
  };
  return h("div", { class: "pn-menu c8-vidrio c8-vidrio--denso pn-abierto", role: "menu", "aria-label": tr("mas.titulo"), onkeydown: mover },
    items.map((it) => {
      const marcado = it.marcado ? !!it.marcado() : undefined;
      return h("button", { type: "button", role: marcado === undefined ? "menuitem" : "menuitemcheckbox", "aria-checked": marcado === undefined ? null : String(marcado),
        class: "pn-menu-item", "data-k": `mas-${it.id}`, tabindex: "-1", onclick: () => { const origen = raiz.querySelector("[data-k='mas']"); cerrarMenu(false); it.accion({ origen }); } },
        ic(ICONO_MAS[it.icono] ?? it.icono), h("span", {}, it.texto), marcado ? ic("ok", "pn-ic pn-ic-s pn-menu-ok") : null);
    }));
}

// ------------------------------------------------------------------ ficha del inmueble
function panel() {
  return h("div", { class: "pn-panel", id: "pn-ficha", role: "region", "aria-label": tr("ficha.titulo") },
    h("div", { class: "pn-panel-cab" },
      cabeceraMarca(),
      h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--icono pn-btn-ic", "data-k": "compartir-ficha", "aria-label": tr("compartir.titulo"),
        "aria-haspopup": "dialog", onclick: (e) => abrirDialogo("compartir", e.currentTarget) }, ic("compartir")),
      h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--icono pn-btn-ic", "data-k": "cerrar-ficha", "aria-label": tr("ficha.cerrar"),
        onclick: () => { abrirFicha(false); enfocarResumen(); } }, ic("cerrar"))),
    h("div", { class: "pn-panel-cuerpo", tabindex: "-1" }, ...ficha()));
}

function cabeceraMarca() {
  const m = T.marca ?? {};
  if (!m.nombre && !m.logo) return h("span", { class: "pn-marca" });
  const src = srcSegura(m.logo), web = urlSegura(m.web);
  const logo = src ? h("img", { class: "pn-logo", src, alt: m.nombre ? R(m.nombre) : "", decoding: "async", onerror: (e) => e.currentTarget.remove() }) : null;
  const nombre = m.nombre ? h("span", { class: "pn-marca-nombre" }, R(m.nombre)) : null;
  return h("div", { class: "pn-marca" },
    web && /^https?:/i.test(web) ? h("a", { href: web, target: "_blank", rel: "noopener noreferrer", class: "pn-marca-enlace", title: tr("marca.web") }, logo, nombre) : [logo, nombre]);
}

function seccion(clave, tituloSec, ...hijos) {
  const id = nuevoId(clave);
  return h("section", { class: `pn-sec pn-sec-${clave}`, "aria-labelledby": id }, h("h3", { id, class: "pn-sec-tit" }, tituloSec), ...hijos);
}
// Bloque plegado (superficies, hipoteca): el resumen es el título
function plegable(clave, icono, tituloSec, extra, ...hijos) {
  return h("section", { class: `pn-sec pn-sec-${clave}` },
    h("details", { class: "pn-plegable", "data-k": clave },
      h("summary", { "data-k": `${clave}-sum` }, ic(icono), h("span", { class: "pn-plegable-tit" }, tituloSec), extra ? h("span", { class: "pn-suave" }, extra) : null, ic("der", "pn-ic pn-ic-s pn-chev")),
      ...hijos));
}

// Orden pensado para quien compra: lo esencial y la ubicación primero; lo plegable y lo legal al final
function ficha() {
  const { seccion: datos, mostrados } = datosClave();
  return [
    cabeceraFicha(), datos, descripcion(), ubicacion(), galeriaRenders(), caracteristicas(mostrados), superficies(),
    certificado(), inm().operacion !== "alquiler" && precioNum() ? hipoteca() : null, documentos(), agente(), avisoLegal(), credito(),
  ].filter(Boolean);
}

// El precio ya está en la tarjeta, que hace de cabecera: aquí no se repite
function cabeceraFicha() {
  const i = inm(), et = etiquetaTipo(), precio = precioNum();
  const sup = numero(i.superficie_construida) || numero(i.superficie_util);
  const pm2 = precio && sup ? tr("ficha.precio_m2", { x: fmtMoneda(precio / sup, i.operacion === "alquiler" ? 1 : 0) }) + (i.operacion === "alquiler" ? tr("ficha.mes") : "") : null;
  const ref = !vacio(i.referencia) ? tr("ficha.referencia", { x: R(i.referencia) }) : null;
  return h("header", { class: "pn-cabecera" },
    et ? h("p", { class: "pn-sobretitulo" }, et) : null,
    h("h2", { class: "pn-titulo" }, titulo()),
    pm2 || ref ? h("p", { class: "pn-precio-meta" }, [pm2, ref].filter(Boolean).join(" · ")) : null);
}

// Como mucho 6 datos: superficies, habitaciones, baños, planta y ascensor, y la letra energética (obligatoria en la
// publicidad). Debajo, una línea con los gastos. Lo demás va a «Características».
function datosClave() {
  const i = inm(), d = [], mostrados = new Set();
  const add = (k, icono, etiqueta, valor) => { if (d.length >= 6) return; mostrados.add(k); d.push(h("li", { class: "pn-dato" }, ic(icono), h("span", { class: "pn-dato-v" }, valor), h("span", { class: "pn-dato-e" }, etiqueta))); };
  const sc = numero(i.superficie_construida), su = numero(i.superficie_util), sp = numero(i.superficie_parcela);
  if (sc) add("construida", "superficie", tr("ficha.sup_construida"), m2(sc));
  if (su) add("util", "util", tr("ficha.sup_util"), m2(su));
  else if (sp) add("parcela", "parcela", tr("ficha.sup_parcela"), m2(sp));
  const hab = numero(i.habitaciones), ban = numero(i.banos);
  if (hab != null) add("habitaciones", "cama", tr("ficha.habitaciones"), fmtNum(hab));
  if (ban != null) add("banos", "bano", tr("ficha.banos"), fmtNum(ban));
  if (!vacio(i.planta)) {
    const asc = i.ascensor === true ? tr("ficha.con_ascensor") : i.ascensor === false ? tr("ficha.sin_ascensor") : null;
    add("planta", "planta", [tr("ficha.planta"), asc].filter(Boolean).join(" · "), R(i.planta));
    if (asc) mostrados.add("ascensor");
  }
  const c = i.certificado_energetico;
  if (c) {
    const l = letraEnergia();
    add("energia", "energia", tr("ficha.energia"), l ? h("span", { class: "pn-dato-letra" }, insigniaEnergia(l, "pn-ee-letra"), h("span", { class: "pn-sr" }, tr("energia.letra", { x: l })))
      : c.en_tramite ? tr("energia.en_tramite") : "—");
  }
  const g = [];
  if (numero(i.gastos_comunidad_mes)) g.push(`${tr("ficha.comunidad")} ${tr("ficha.al_mes", { x: fmtMoneda(numero(i.gastos_comunidad_mes)) })}`);
  if (numero(i.ibi_anual)) g.push(`${tr("ficha.ibi")} ${tr("ficha.al_ano", { x: fmtMoneda(numero(i.ibi_anual)) })}`);
  if (!d.length && !g.length) return { seccion: null, mostrados };
  return { mostrados, seccion: seccion("datos", tr("ficha.datos"),
    d.length ? h("ul", { class: "pn-datos" }, d) : null,
    g.length ? h("p", { class: "pn-gastos" }, h("span", { class: "pn-suave" }, `${tr("ficha.gastos")}: `), g.join(" · ")) : null) };
}

function caracteristicas(mostrados) {
  const i = inm(), filas = [], lista = [];
  const sp = numero(i.superficie_parcela);
  if (sp && !mostrados.has("parcela")) filas.push([tr("ficha.sup_parcela"), m2(sp)]);
  if (!vacio(i.orientacion)) filas.push([tr("ficha.orientacion"), R(i.orientacion)]);
  if (i.ano_construccion) filas.push([tr("ficha.ano"), String(i.ano_construccion)]);
  if (!vacio(i.estado)) filas.push([tr("ficha.estado"), R(i.estado)]);
  if (!vacio(i.calefaccion)) filas.push([tr("ficha.calefaccion"), R(i.calefaccion)]);
  const con = (etiqueta, v) => (typeof v === "number" ? `${etiqueta} · ${m2(v)}` : typeof v === "string" || (v && typeof v === "object") ? `${etiqueta} · ${R(v)}` : etiqueta);
  if (i.ascensor === true && !mostrados.has("ascensor")) lista.push(tr("ficha.ascensor"));
  const garaje = numero(i.garaje);
  if (i.garaje === true || garaje > 0) lista.push(garaje > 1 ? `${tr("ficha.garaje")} · ${fmtNum(garaje)}` : tr("ficha.garaje"));
  if (i.trastero === true) lista.push(tr("ficha.trastero"));
  if (i.terraza) lista.push(con(tr("ficha.terraza"), i.terraza === true ? null : i.terraza));
  if (i.piscina) lista.push(con(tr("ficha.piscina"), i.piscina === true ? null : i.piscina));
  if (i.jardin) lista.push(con(tr("ficha.jardin"), i.jardin === true ? null : i.jardin));
  if (i.aire_acondicionado) lista.push(con(tr("ficha.aire"), i.aire_acondicionado === true ? null : i.aire_acondicionado));
  for (const c of Array.isArray(i.caracteristicas) ? i.caracteristicas : []) if (!vacio(R(c))) lista.push(R(c));
  if (!filas.length && !lista.length) return null;
  return seccion("caract", tr("ficha.caracteristicas"),
    filas.length ? h("dl", { class: "pn-tabla" }, filas.map(([a, b]) => [h("dt", {}, a), h("dd", {}, b)])) : null,
    lista.length ? h("ul", { class: "pn-caract" }, lista.map((c) => h("li", {}, ic("ok", "pn-ic pn-ic-s"), c))) : null);
}

function certificado() {
  const c = inm().certificado_energetico;
  if (!c) return null;
  const letra = (v) => { const l = String(v ?? "").trim().toUpperCase(); return ENERGIA[l] ? l : ""; };
  const cl = letra(c.consumo_letra), el = letra(c.emisiones_letra);
  const tramite = !!c.en_tramite || (!cl && !el);
  const resumen = tramite ? tr("energia.en_tramite") : [
    cl && `${tr("energia.consumo")}: ${cl}${c.consumo_valor != null ? ` (${fmtNum(c.consumo_valor, 1)} ${tr("energia.unidad_consumo")})` : ""}`,
    el && `${tr("energia.emisiones")}: ${el}${c.emisiones_valor != null ? ` (${fmtNum(c.emisiones_valor, 1)} ${tr("energia.unidad_emisiones")})` : ""}`,
  ].filter(Boolean).join(". ");
  const marca = (L, val, valor) => (L === val ? h("span", { class: "pn-ee-flecha" }, h("b", {}, L), valor != null ? h("small", {}, fmtNum(valor, 1)) : null) : null);
  const escala = h("div", { class: "pn-ee-escala" + (tramite ? " pn-ee-tramite" : ""), "aria-hidden": "true" },
    h("span", { class: "pn-ee-cab" }), h("span", { class: "pn-ee-cab" }, tr("energia.consumo")), h("span", { class: "pn-ee-cab" }, tr("energia.emisiones")),
    Object.keys(ENERGIA).map((L, k) => [
      h("span", { class: "pn-ee-barra", style: `--c:var(--ce-${L.toLowerCase()}, ${ENERGIA[L]});--w:${42 + k * 9.5}%`, "data-oscuro": ENERGIA_OSCURO.has(L) ? "" : null }, h("b", {}, L)),
      h("span", { class: "pn-ee-celda" }, tramite ? null : marca(L, cl, c.consumo_valor)),
      h("span", { class: "pn-ee-celda" }, tramite ? null : marca(L, el, c.emisiones_valor)),
    ]));
  const fila = (L, nombre, valor, unidad) => (L ? h("p", {}, insigniaEnergia(L, "pn-ee-letra"), h("span", {}, nombre), valor != null ? h("span", { class: "pn-suave" }, `${fmtNum(valor, 1)} ${unidad}`) : null) : null);
  const leyenda = h("div", { class: "pn-ee-leyenda" },
    tramite ? h("p", { class: "pn-ee-badge" }, ic("info", "pn-ic pn-ic-s"), tr("energia.en_tramite"))
      : [fila(cl, tr("energia.consumo"), c.consumo_valor, tr("energia.unidad_consumo")), fila(el, tr("energia.emisiones"), c.emisiones_valor, tr("energia.unidad_emisiones"))]);
  return seccion("energia", tr("energia.titulo"), h("figure", { class: "pn-ee", role: "img", "aria-label": `${tr("energia.titulo")}. ${resumen}` }, escala), leyenda);
}

// Tres líneas y «Leer más»
function descripcion() {
  const txt = R(inm().descripcion);
  if (!txt) return null;
  const largo = txt.length > 160 || /\n\s*\n/.test(txt);
  const p = h("div", { class: "pn-desc" + (largo && !ui.descripcionAbierta ? " pn-desc-corta" : ""), id: nuevoId("desc") }, txt.split(/\n{2,}/).map((t) => h("p", {}, t)));
  const btn = largo ? h("button", { type: "button", class: "pn-enlace-btn", "data-k": "leer-mas", "aria-expanded": String(ui.descripcionAbierta), "aria-controls": p.id, onclick: (e) => {
    ui.descripcionAbierta = !ui.descripcionAbierta;
    p.classList.toggle("pn-desc-corta", !ui.descripcionAbierta);
    e.currentTarget.textContent = ui.descripcionAbierta ? tr("ficha.leer_menos") : tr("ficha.leer_mas");
    e.currentTarget.setAttribute("aria-expanded", String(ui.descripcionAbierta));
  } }, ui.descripcionAbierta ? tr("ficha.leer_menos") : tr("ficha.leer_mas")) : null;
  return seccion("desc", tr("ficha.descripcion"), p, btn);
}

// Un solo «Ver en el mapa». Sin permiso para la dirección exacta, la zona y unas coordenadas redondeadas
function ubicacion() {
  const i = inm();
  const exacta = i.mostrar_direccion_exacta === true;
  const dir = R(i.direccion);
  const zona = R(i.zona) || (dir ? dir.split(",").slice(-1)[0].trim() : "");
  const texto = exacta ? dir : zona;
  const lat0 = numero(i.ubicacion?.lat), lng0 = numero(i.ubicacion?.lng);
  const coord = lat0 != null && lng0 != null && Math.abs(lat0) <= 90 && Math.abs(lng0) <= 180;
  if (!texto && !coord) return null;
  let href;
  if (coord) {
    const lat = exacta ? lat0 : Math.round(lat0 * 100) / 100, lng = exacta ? lng0 : Math.round(lng0 * 100) / 100;
    href = exacta ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : `https://www.google.com/maps/@${lat},${lng},15z`;
  } else href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(texto)}`;
  return seccion("ubic", tr("ficha.ubicacion"),
    h("p", { class: "pn-ubic" }, ic("pin"), h("span", {}, texto || tr("ficha.zona_aprox"), !exacta ? h("small", { class: "pn-suave pn-bloque" }, tr("ficha.zona_aprox")) : null)),
    h("a", { class: "c8-boton c8-boton--secundario pn-mapa", "data-k": "mapa", href, target: "_blank", rel: "noopener noreferrer",
      "aria-label": `${tr("ficha.ver_mapa")} (${tr("comun.abrir_nueva")})` }, ic("externo", "pn-ic pn-ic-s"), tr("ficha.ver_mapa")));
}

function superficies() {
  const lista = (Array.isArray(T.estancias) ? T.estancias : []).filter((e) => Array.isArray(e.poligono) && e.poligono.length >= 3);
  if (!lista.length) return null;
  const varias = new Set(lista.map((e) => e.planta)).size > 1;
  const nombrePlanta = (id) => R((T.plantas ?? []).find((p) => p.id === id)?.nombre) || id;
  let total = 0;
  const filas = lista.map((e) => {
    const a = areaPoligono(e.poligono); total += a;
    return [h("dt", {}, R(e.nombre) || e.id, varias && e.planta ? h("span", { class: "pn-suave" }, ` · ${nombrePlanta(e.planta)}`) : null), h("dd", {}, `${fmtNum(a, 1)} m²`)];
  });
  return plegable("sup", "superficie", tr("ficha.superficies"), `${fmtNum(total, 1)} m²`,
    h("div", { class: "pn-plegable-cuerpo" },
      h("dl", { class: "pn-tabla" }, filas, h("dt", { class: "pn-total" }, tr("ficha.total_estancias")), h("dd", { class: "pn-total" }, `${fmtNum(total, 1)} m²`)),
      h("p", { class: "pn-nota" }, tr("ficha.superficie_nota"))));
}

function credito() {
  const [antes, despues] = tr("marca.creado_con", { x: "\u0000" }).split("\u0000");
  return h("p", { class: "pn-credito" }, antes, h("span", { class: "pn-credito-marca" }, "cre8eight"), despues);
}

function nombreArchivo(url) {
  if (/^(data|blob):/i.test(url)) return "";
  const ultimo = url.split(/[?#]/)[0].split("/").pop() ?? "";
  try { return decodeURIComponent(ultimo); } catch { return ultimo; }
}
function documentos() {
  const lista = (v) => (Array.isArray(v) ? v : []);
  const fuentes = [...lista(inm().documentos), ...lista(T.documentacion).filter((d) => d?.publico === true)];
  const vistos = new Set(), docs = [];
  for (const d of fuentes) {
    const url = urlSegura(d?.url ?? d?.archivo, { descarga: true });
    if (!url) continue;
    let clave = url;
    try { clave = new URL(url, location.href).href; } catch {}
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    docs.push({ nombre: R(d.nombre) || nombreArchivo(url) || tr("ficha.documentos"), url });
  }
  if (!docs.length) return null;
  return seccion("docs", tr("ficha.documentos"), h("ul", { class: "pn-docs" }, docs.map((d) =>
    h("li", {}, h("a", { href: d.url, target: "_blank", rel: "noopener noreferrer", download: "" }, ic("doc"), h("span", {}, d.nombre), ic("descargar", "pn-ic pn-ic-s"))))));
}

function agente() {
  const a = T.agente;
  if (!a?.nombre) return null;
  const foto = srcSegura(a.foto);
  return seccion("agente", tr("ficha.agente"), h("div", { class: "pn-agente" },
    foto ? h("img", { src: foto, alt: "", class: "pn-agente-foto", onerror: (e) => e.currentTarget.remove() }) : h("span", { class: "pn-agente-foto pn-agente-ini", "aria-hidden": "true" }, R(a.nombre).split(/\s+/).map((x) => x[0]).slice(0, 2).join("")),
    h("div", {}, h("p", { class: "pn-agente-nombre" }, R(a.nombre)), T.marca?.nombre ? h("p", { class: "pn-suave" }, R(T.marca.nombre)) : null),
    h("div", { class: "pn-agente-acc" },
      telefonoValido(a.telefono) ? h("a", { class: "c8-boton c8-boton--secundario c8-boton--icono pn-btn-ic", href: `tel:${String(a.telefono).replace(/[^\d+]/g, "")}`, "aria-label": `${tr("ficha.llamar")} ${a.telefono}` }, ic("tel")) : null,
      emailValido(a.email) ? h("a", { class: "c8-boton c8-boton--secundario c8-boton--icono pn-btn-ic", href: `mailto:${a.email.trim()}?subject=${encodeURIComponent(`${R(inm().referencia ?? "")} ${titulo()}`.trim())}`, "aria-label": `${tr("ficha.email")} ${a.email}` }, ic("correo")) : null)));
}

// Un solo aviso: el del agente si lo hay; si no, el de proyecto (con IA si se ofrecen estilos)
function avisoLegal() {
  const i = inm(), textos = [];
  if (!vacio(i.aviso_legal)) textos.push(R(i.aviso_legal));
  else if (esProyecto()) textos.push(tr(listaEstilos().length ? "ficha.aviso_proyecto_ia" : "ficha.aviso_proyecto"));
  const pie = R(T.marca?.pie_legal), musica = creditoMusica();
  if (!textos.length && !pie && !musica) return null;
  return h("footer", { class: "pn-legal" }, textos.map((t) => h("p", {}, ic("info", "pn-ic pn-ic-s"), t)), musica, pie ? h("p", { class: "pn-pie" }, pie) : null);
}
// «Música: título · autor (licencia)» cuando el tour declara autor o licencia
function creditoMusica() {
  const m = T.audio?.musica;
  if (!m || (!m.autor && !m.licencia)) return null;
  const obra = [R(m.titulo), R(m.autor)].filter(Boolean).join(" · "), lic = R(m.licencia);
  const x = obra && lic ? `${obra} (${lic})` : obra || lic;
  return h("p", { class: "pn-musica-credito" }, ic("musica", "pn-ic pn-ic-s"), h("span", {}, tr("sonido.credito", { x })));
}

// --- hipoteca (plegada)
function hipoteca() {
  ui.hip ??= { precio: precioNum(), entrada: 20, interes: numero(inm().hipoteca_interes) ?? 3, anos: 30 };
  const s = ui.hip;
  const ids = { p: nuevoId("h"), e: nuevoId("h"), i: nuevoId("h"), a: nuevoId("h") };
  const salida = h("div", { class: "pn-hip-res", "aria-live": "polite" });
  const eOut = h("output", { for: ids.e, class: "pn-salida" }), aOut = h("output", { for: ids.a, class: "pn-salida" });
  const pintar = () => {
    const financiado = Math.max(0, s.precio * (1 - s.entrada / 100));
    const cuota = cuotaHipoteca(financiado, s.interes, s.anos);
    salida.replaceChildren(
      h("p", { class: "pn-hip-cuota" }, h("span", { class: "pn-suave" }, tr("hipoteca.cuota")), h("strong", { class: "pn-hip-importe" }, fmtMoneda(cuota) + tr("ficha.mes"))),
      h("dl", { class: "pn-tabla" },
        h("dt", {}, tr("hipoteca.entrada")), h("dd", {}, fmtMoneda(s.precio - financiado)),
        h("dt", {}, tr("hipoteca.financiado")), h("dd", {}, fmtMoneda(financiado)),
        h("dt", {}, tr("hipoteca.intereses")), h("dd", {}, fmtMoneda(Math.max(0, cuota * s.anos * 12 - financiado)))),
      h("p", { class: "pn-nota" }, tr("hipoteca.gastos", { x: fmtMoneda(s.precio * 0.1) })));
    eOut.textContent = `${fmtNum(s.entrada)} %`; aOut.textContent = tr("hipoteca.anos_valor", { x: s.anos });
  };
  const num = (k, v) => { const n = parseFloat(String(v).replace(",", ".")); if (Number.isFinite(n)) { s[k] = n; pintar(); } };
  const rango = (id, k, min, max, out) => h("input", { id, type: "range", class: "c8-deslizador", min, max, step: "1", value: String(s[k]), "data-k": `hip-${k}`,
    style: `--valor:${((s[k] - min) / (max - min)) * 100}%`, oninput: (e) => num(k, e.target.value) });
  const det = plegable("hip", "calc", tr("hipoteca.titulo"), null,
    h("div", { class: "pn-hip-form c8-campo" },
      h("label", { for: ids.p }, tr("hipoteca.precio")),
      h("input", { id: ids.p, type: "number", inputmode: "numeric", min: "0", step: "1000", value: String(s.precio), "data-k": "hip-precio", oninput: (e) => num("precio", e.target.value) }),
      h("div", { class: "pn-et-fila" }, h("label", { for: ids.e }, tr("hipoteca.entrada")), eOut), rango(ids.e, "entrada", 0, 80),
      h("label", { for: ids.i }, `${tr("hipoteca.interes")} (%)`),
      h("input", { id: ids.i, type: "number", inputmode: "decimal", min: "0", max: "20", step: "0.05", value: String(s.interes), "data-k": "hip-interes", oninput: (e) => num("interes", e.target.value) }),
      h("div", { class: "pn-et-fila" }, h("label", { for: ids.a }, tr("hipoteca.anos")), aOut), rango(ids.a, "anos", 5, 40)),
    salida);
  pintar();
  return det;
}

// ------------------------------------------------------------------ diálogos
function alternarDialogo(tipo, opener) { if (ui.dialogo === tipo) cerrarDialogo(); else abrirDialogo(tipo, opener); }

function abrirDialogo(tipo, opener) {
  if (!raiz) return;
  ui.opener = opener ?? document.activeElement;
  ui.dialogo = tipo; ui.menu = false; ui.entrada = true; // la animación de entrada, solo al abrir (no en cada repintado)
  if (tipo === "contacto") {
    if (ui.envio.estado === "exito") terminarConsulta();
    if (!["enviando", "pegar"].includes(ui.envio.estado)) ui.envio = { estado: "inactivo" };
    if (!ui.zonaManual || !ui.borrador.zona) ui.borrador.zona = zonaPorDefecto();
  }
  renderizar();
  const d = raiz.querySelector(".pn-dialogo");
  requestAnimationFrame(() => (d?.querySelector("[autofocus]") ?? d?.querySelector(".pn-dlg-tit"))?.focus({ preventScroll: true }));
  // «Contactar» sin fotos adjunta la vista actual como foto 1 (se puede quitar)
  if (tipo === "contacto" && ui.envio.estado === "inactivo" && !ui.capturas.length && !ui.autoQuitada && puedeCapturar()) tomarCaptura({ auto: true });
}

function cerrarDialogo() {
  if (!ui.dialogo || !raiz) return;
  // la vista que se adjuntó sola al abrir «Contactar» no se queda si se cierra sin enviar: la próxima vez se adjunta la de ese momento
  if (ui.dialogo === "contacto" && ui.envio.estado !== "pegar" && ui.capturas.length === 1 && ui.capturas[0].auto) { vaciarCapturas(); pintarContador(); }
  const op = ui.opener, k = op?.dataset?.k;
  ui.dialogo = null; ui.opener = null;
  renderizar();
  const destino = (k && raiz.querySelector(`[data-k="${CSS.escape(k)}"]`)) || (op?.isConnected && !raiz.contains(op) ? op : null);
  destino?.focus?.({ preventScroll: true });
}

function escape(e) {
  if (!raiz) return;
  if (ui.lightbox) { e.preventDefault(); cerrarLightbox(); return; }
  if (ui.menu) { e.preventDefault(); cerrarMenu(true); return; }
  if (ui.capturando) { e.preventDefault(); salirCaptura(); return; }
  if (ui.dialogo) { e.preventDefault(); cerrarDialogo(); return; }
  if (ui.ficha && raiz.contains(document.activeElement)) { e.preventDefault(); abrirFicha(false); enfocarResumen(); }
}

function dialogo() {
  const cont = { contacto: dlgContacto, compartir: dlgCompartir, estilo: dlgEstilo, ajustes: dlgAjustes, idioma: dlgIdioma }[ui.dialogo];
  if (!cont) return null;
  const titId = nuevoId("dlg");
  const { titulo: tit, cuerpo, icono, claseCuerpo } = cont();
  const entra = ui.entrada; ui.entrada = false;
  // al abrirse, el icono de la cabecera se dibuja (en los repintados, no)
  return h("section", { class: `pn-dialogo pn-dialogo-${ui.dialogo} pn-abierto c8-vidrio c8-vidrio--denso${entra ? " pn-entra" : ""}`, role: "dialog", "aria-modal": "false", "aria-labelledby": titId },
    h("header", { class: "pn-dlg-cab" },
      icono ? ic(icono, entra ? "pn-ic pn-dibujar" : "pn-ic") : null,
      h("h2", { id: titId, class: "pn-dlg-tit", tabindex: "-1" }, tit),
      h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--icono pn-btn-ic", "data-k": "cerrar-dlg", "aria-label": tr("comun.cerrar"), onclick: cerrarDialogo }, ic("cerrar"))),
    h("div", { class: `pn-dlg-cuerpo ${claseCuerpo ?? ""}`.trim() }, cuerpo));
}

// ------------------------------------------------------------------ contacto
// Estancias agrupadas para el selector «¿Sobre qué estancia…?»: por tour.secciones (zonas) o, si no, por planta
function opcionesZona() {
  const nombres = new Map();
  for (const e of Array.isArray(T.estancias) ? T.estancias : []) if (e?.id) nombres.set(e.id, { nombre: R(e.nombre) || e.id, planta: e.planta });
  for (const p of panoramas()) if (p?.id && !nombres.has(p.id)) nombres.set(p.id, { nombre: R(p.nombre) || p.id, planta: p.planta });
  const usados = new Set(), nombresUsados = new Set(), grupos = [];
  const opc = (id) => {
    const n = nombres.get(id);
    if (!n || usados.has(id) || nombresUsados.has(n.nombre)) return null;
    usados.add(id); nombresUsados.add(n.nombre);
    return { id, nombre: n.nombre };
  };
  if (Array.isArray(T.secciones) && T.secciones.length) {
    for (const s of T.secciones) {
      const o = (Array.isArray(s?.estancias) ? s.estancias : []).map(opc).filter(Boolean);
      if (o.length) grupos.push({ nombre: R(s.nombre) || s.id, opciones: o });
    }
  } else if ((T.plantas?.length ?? 0) > 1) {
    for (const pl of T.plantas) {
      const o = [...nombres.keys()].filter((id) => nombres.get(id).planta === pl.id).map(opc).filter(Boolean);
      if (o.length) grupos.push({ nombre: R(pl.nombre) || pl.id, opciones: o });
    }
  }
  const resto = [...nombres.keys()].map(opc).filter(Boolean);
  if (resto.length) grupos.push({ nombre: grupos.length ? tr("contacto.zona_otras") : null, opciones: resto });
  return grupos;
}
function zonaPorDefecto() {
  const todas = opcionesZona().flatMap((g) => g.opciones);
  let actual = null;
  try { actual = V.estanciaActual?.() ?? null; } catch {}
  for (const id of [actual?.id, est().nodo]) if (id && todas.some((o) => o.id === id)) return id;
  const porNombre = todas.find((o) => o.nombre === (R(actual?.nombre) || nombreEstancia()));
  return porNombre?.id ?? "general";
}
function nombreZona(id) {
  if (!id || id === "general") return tr("contacto.zona_general");
  return opcionesZona().flatMap((g) => g.opciones).find((o) => o.id === id)?.nombre ?? id;
}

const extension = (tipo) => ({ "image/png": "png", "image/webp": "webp" })[tipo] ?? "jpg";
function archivosCapturas() {
  return ui.capturas.map((c, i) => new File([c.blob], `foto-${i + 1}-${slug(c.estancia)}.${extension(c.blob.type)}`, { type: c.blob.type || "image/jpeg" }));
}
const puedeCopiarImagen = () => !!(navigator.clipboard?.write && typeof ClipboardItem !== "undefined");
const atajoPegar = () => (esMac() ? "⌘V" : "Ctrl+V");
const textoNumFotos = (n) => (n === 1 ? tr("contacto.una_foto") : tr("contacto.n_fotos", { x: n }));

// --- «Foto de la vista»: la foto se hace al momento, sin abrir nada; se puede deshacer y seguir paseando
async function fotoDeLaVista(e) {
  animar(e?.currentTarget, "pn-disparo", 600); // el icono hace de obturador al pulsar
  if (ui.capturas.length >= MAX_FOTOS) { aviso(tr("contacto.max_fotos", { x: MAX_FOTOS })); return; }
  const c = await tomarCaptura();
  if (!c) return;
  destello();
  aviso(tr("contacto.foto_anadida", { x: ui.capturas.length }), { accion: tr("comun.deshacer"), alPulsar: () => quitarCaptura(c) });
}

async function tomarCaptura({ auto = false } = {}) {
  if (ui.tomando || ui.capturas.length >= MAX_FOTOS) return null;
  ui.tomando = true; actualizarBarraCaptura(); pintarFotos(); pintarContador();
  let c = null;
  try {
    let r = null;
    if (tiene(V.capturar)) r = await V.capturar({ ancho: 1600 });
    else if (V.lienzo?.toBlob) {
      try { V.renderizar?.(); } catch {}
      r = { blob: await new Promise((ok) => V.lienzo.toBlob(ok, "image/jpeg", 0.85)) };
    }
    if (!r?.blob) throw new Error("captura vacía");
    let estancia = r.estancia;
    if (estancia && typeof estancia === "object") estancia = R(estancia.nombre) || estancia.id;
    if (!estancia) { try { const e = V.estanciaActual?.(); estancia = e ? R(e.nombre) || e.id : ""; } catch {} }
    estancia ||= nombreEstancia() || est().nodo || "";
    // (si el contacto se cerró antes de terminar la captura automática, no se adjunta)
    if (!auto || ui.dialogo === "contacto") {
      c = { blob: r.blob, url: URL.createObjectURL(r.blob), nodo: r.nodo ?? est().nodo ?? null, estancia: String(estancia), enlace: r.enlace ?? enlaceVista(), auto };
      ui.capturas.push(c);
      prepararPNG();
    }
  } catch (e) {
    console.warn("Captura", e);
    if (!auto) aviso(tr("contacto.err_captura"));
  } finally { ui.tomando = false; }
  actualizarBarraCaptura(); pintarFotos(); pintarContador();
  if (ui.capturando) { colocarHoja(false); if (ui.capturas.length >= MAX_FOTOS) raiz.querySelector("[data-k='captura-listo']")?.focus({ preventScroll: true }); }
  return c;
}
function quitarCaptura(c) {
  const i = ui.capturas.indexOf(c);
  if (i < 0) return;
  ui.capturas.splice(i, 1);
  URL.revokeObjectURL(c.url);
  if (c.auto) ui.autoQuitada = true;
  prepararPNG(); pintarFotos(); pintarContador();
}
function quitarFoto(i) {
  quitarCaptura(ui.capturas[i]);
  (raiz.querySelector(`.pn-dialogo [data-k='quitar-${Math.min(i, ui.capturas.length - 1)}']`) ?? raiz.querySelector(".pn-dialogo [data-k='hacer-foto']"))?.focus();
}
function vaciarCapturas() { for (const c of ui.capturas) URL.revokeObjectURL(c.url); ui.capturas = []; }

// La primera foto, ya convertida a PNG: al enviar se copia sin esperar (antes de que WhatsApp se lleve el foco)
function prepararPNG() { const c = ui.capturas[0]; if (c && puedeCopiarImagen()) pngDe(c); }
const pngDe = (c) => (c.png ??= aPNG(c.blob).catch(() => null));
async function aPNG(blob) {
  if (blob.type === "image/png") return blob;
  const bmp = await createImageBitmap(blob);
  const cv = document.createElement("canvas"); cv.width = bmp.width; cv.height = bmp.height;
  cv.getContext("2d").drawImage(bmp, 0, 0);
  bmp.close?.();
  return await new Promise((ok, mal) => cv.toBlob((b) => (b ? ok(b) : mal(new Error("PNG"))), "image/png"));
}
// Se llama dentro del gesto del usuario: ClipboardItem acepta la promesa del PNG
function copiarFoto(i) {
  const c = ui.capturas[i];
  if (!c || !puedeCopiarImagen()) return Promise.reject(new Error("portapapeles no disponible"));
  return navigator.clipboard.write([new ClipboardItem({ "image/png": pngDe(c).then((b) => b ?? Promise.reject(new Error("PNG"))) })]);
}
// Si el portapapeles no responde en 5 s se da por fallido: la pantalla ofrece copiar otra vez o descargar las fotos
function copiarYMarcar(i) {
  const env = ui.envio = { ...ui.envio, estado: "pegar", indice: i, copiaOk: null, descargadas: false };
  const limite = new Promise((_, mal) => setTimeout(() => mal(new Error("el portapapeles no responde")), 5000));
  Promise.race([copiarFoto(i), limite]).then(() => { env.copiaOk = true; aviso(tr("contacto.copiada")); }, (e) => { console.warn("Copiar foto", e); env.copiaOk = false; })
    .finally(() => { if (ui.envio === env && ui.dialogo === "contacto") rehacerDialogo(); });
}
function descargarFotos() {
  ui.capturas.forEach((c, i) => setTimeout(() => {
    const a = h("a", { href: c.url, download: `${slug(R(inm().referencia) || "vista")}-foto-${i + 1}-${slug(c.estancia)}.${extension(c.blob.type)}` });
    document.body.append(a); a.click(); a.remove();
  }, i * 250));
}

// --- «Añadir otra vista»: barra de captura con «Hacer foto» y «Listo»; se ocultan los paneles para encuadrar
function entrarCaptura() {
  ui.capturando = true; ui.menu = false;
  renderizar();
  requestAnimationFrame(() => raiz.querySelector("[data-k='capturar']")?.focus({ preventScroll: true }));
}
function salirCaptura() {
  ui.capturando = false;
  renderizar();
  requestAnimationFrame(() => raiz.querySelector(".pn-dialogo [data-k='hacer-foto']")?.focus({ preventScroll: true }));
}
function barraCaptura() {
  const n = ui.capturas.length;
  return h("section", { class: "pn-barra-captura pn-abierto c8-vidrio c8-vidrio--texto", role: "region", "aria-label": tr("contacto.otra_vista"), "aria-describedby": "pn-bc-ayuda" },
    h("p", { class: "pn-bc-texto", id: "pn-bc-ayuda" }, ic("camara"), h("span", {}, tr("contacto.encuadra"))),
    h("span", { class: "pn-bc-num", "aria-live": "polite" }, textoNumFotos(n)),
    h("div", { class: "pn-bc-botones" },
      h("button", { type: "button", class: "c8-boton pn-bc-capturar", "data-k": "capturar", disabled: n >= MAX_FOTOS, onclick: () => tomarCaptura().then((c) => { if (c) destello(); }) },
        h("span", { class: "pn-punto", "aria-hidden": "true" }), tr("contacto.capturar")),
      h("button", { type: "button", class: "c8-boton c8-boton--primario", "data-k": "captura-listo", onclick: salirCaptura }, ic("ok"), tr("contacto.listo"))));
}
// La barra se actualiza en su sitio: sustituirla rompía los clics en curso (p. ej. en «Listo») y repetía la animación
function actualizarBarraCaptura() {
  const barra = raiz?.querySelector(".pn-barra-captura"); if (!barra) return;
  const n = ui.capturas.length;
  barra.querySelector(".pn-bc-num").textContent = textoNumFotos(n);
  const b = barra.querySelector("[data-k='capturar']");
  if (b) { b.disabled = n >= MAX_FOTOS; b.setAttribute("aria-disabled", String(!!ui.tomando)); }
}

// --- bloque de fotos del formulario (se repinta en su sitio, sin tocar los campos)
function bloqueFotos() {
  const id = nuevoId("f");
  return h("div", { class: "pn-campo pn-fotos", role: "group", "aria-labelledby": id, "data-id": id }, contenidoFotos(id));
}
function contenidoFotos(id) {
  const nf = ui.capturas.length;
  return [
    h("div", { class: "pn-et-fila" }, h("span", { class: "pn-et", id }, tr("contacto.fotos")), nf ? h("span", { class: "pn-salida" }, textoNumFotos(nf)) : null),
    h("ul", { class: "pn-tira" }, ui.capturas.map((c, i) => h("li", {},
      h("img", { src: c.url, alt: tr("contacto.foto_alt", { n: i + 1, x: c.estancia }) }),
      h("span", { class: "pn-tira-et", "aria-hidden": "true" }, c.estancia),
      h("button", { type: "button", class: "pn-quitar", "data-k": `quitar-${i}`, "aria-label": tr("contacto.quitar_foto", { x: `${i + 1} (${c.estancia})` }), onclick: () => quitarFoto(i) }, ic("cerrar", "pn-ic pn-ic-s")))),
      ui.tomando ? h("li", { class: "pn-tira-cargando", role: "status", "aria-label": tr("contacto.adjuntando") }, h("span", { class: "pn-giro", "aria-hidden": "true" })) : null,
      nf < MAX_FOTOS && puedeCapturar() ? h("li", { class: "pn-tira-mas" }, h("button", { type: "button", "data-k": "hacer-foto", onclick: entrarCaptura }, ic("camara"), h("span", {}, tr("contacto.otra_vista")))) : null),
    nf ? null : h("p", { class: "pn-nota" }, tr("contacto.fotos_nota")),
  ];
}
function pintarFotos() {
  const b = raiz?.querySelector(".pn-dialogo .pn-fotos"); if (!b) return;
  const foco = b.contains(document.activeElement) ? document.activeElement?.dataset?.k : null;
  b.replaceChildren(...contenidoFotos(b.dataset.id).filter(Boolean));
  if (foco) (b.querySelector(`[data-k="${CSS.escape(foco)}"]`) ?? b.querySelector("[data-k='hacer-foto']"))?.focus({ preventScroll: true });
}

function tiraFotos(actual) {
  return h("ul", { class: "pn-tira pn-tira-s" }, ui.capturas.map((c, i) =>
    h("li", { class: actual < 0 ? "pn-todas" : i === actual ? "pn-actual" : "" }, h("img", { src: c.url, alt: tr("contacto.foto_alt", { n: i + 1, x: c.estancia }) }))));
}

// La consulta terminó: la próxima empieza limpia (nombre y teléfono se recuerdan)
function terminarConsulta() {
  vaciarCapturas(); ui.autoQuitada = false;
  ui.borrador.pregunta = ""; ui.borrador.privacidad = false; ui.tocados = new Set();
  ui.envio = { estado: "inactivo" };
  pintarContador();
}
function pantallaExito() {
  const b = ui.borrador, env = ui.envio, nombre = b.nombre.trim().split(/\s+/)[0] ?? "";
  const texto = env.email ? tr("contacto.exito_email") : env.porWhatsapp === "confirmado" ? tr("contacto.exito_wa", { x: nombre })
    : env.porWhatsapp && canalContacto() === "whatsapp" ? tr("contacto.exito_whatsapp") : tr("contacto.exito", { x: nombre });
  return { titulo: tr("contacto.titulo"), icono: "chat", cuerpo: h("div", { class: "pn-estado pn-estado-ok", role: "status" },
    h("span", { class: "pn-estado-ic" }, ic("ok", "pn-ic pn-dibujar")), h("p", {}, texto),
    h("button", { type: "button", class: "c8-boton c8-boton--secundario", "data-k": "otra", autofocus: true, onclick: () => {
      terminarConsulta(); rehacerDialogo();
      raiz.querySelector(".pn-dialogo [data-k='c-pregunta']")?.focus();
      if (puedeCapturar()) tomarCaptura({ auto: true });
    } }, tr("contacto.otra"))) };
}

// Única pantalla tras abrir WhatsApp: «Pega la foto y envía» (y «Copiar siguiente» si hay varias)
function pantallaPegar() {
  const env = ui.envio, total = ui.capturas.length, n = env.indice + 1;
  const fallo = env.copiaOk === false && !env.descargadas;
  const estado = env.descargadas ? tr("contacto.descargadas") : fallo ? tr("contacto.copia_fallida")
    : env.copiaOk ? tr("contacto.copiada_n", { n, total }) : tr("contacto.copiando");
  const instruccion = esTactil() ? tr("contacto.wa_paso3_tactil") : tr("contacto.wa_paso3_teclado", { x: atajoPegar() });
  const boton = (k, primario, icono, texto, onclick) => h("button", { type: "button", "data-k": k, autofocus: primario || null, onclick,
    class: primario ? "c8-boton c8-boton--primario c8-boton--l c8-boton--bloque" : "c8-boton c8-boton--secundario" }, ic(icono), texto);
  const terminar = (primario) => boton("terminado", primario, "ok", tr("contacto.terminado"), () => {
    ui.envio = { estado: "exito", porWhatsapp: "confirmado" }; rehacerDialogo(); vaciarCapturas(); pintarContador();
  });
  const descargar = (primario) => boton("descargar-fotos", primario, "descargar", tr("contacto.descargar_fotos"), descargarFotos);
  const reabrir = boton("reabrir-wa", false, "whatsapp", tr("contacto.abrir_whatsapp"), () => abrirWhatsApp(datosConsulta()));
  // Un solo botón principal por pantalla
  let principal, otros;
  if (fallo) {
    principal = puedeCopiarImagen() ? boton("copiar-otra-vez", true, "copiar", tr("contacto.copiar_otra_vez"), () => { copiarYMarcar(env.indice); rehacerDialogo(); }) : descargar(true);
    otros = [puedeCopiarImagen() ? descargar(false) : null, reabrir, terminar(false)];
  } else if (!env.descargadas && n < total) {
    principal = boton("copiar-siguiente", true, "copiar", tr("contacto.copiar_siguiente", { n: n + 1, total }), () => { copiarYMarcar(env.indice + 1); rehacerDialogo(); });
    otros = [reabrir, descargar(false)];
  } else { principal = terminar(true); otros = [reabrir, env.descargadas ? null : descargar(false)]; }
  return { titulo: tr("contacto.pegar_titulo"), icono: "whatsapp", cuerpo: h("div", { class: "pn-estado pn-estado-pegar" },
    tiraFotos(env.descargadas ? -1 : env.indice),
    h("p", { class: fallo ? "pn-aviso" : "pn-guia", role: "status" },
      ic(fallo ? "alerta" : env.copiaOk || env.descargadas ? "ok" : "info", `pn-ic pn-ic-s${env.copiaOk || env.descargadas ? " pn-dibujar" : ""}`), h("span", {}, estado)),
    fallo ? null : h("p", { class: "pn-guia" }, ic("info", "pn-ic pn-ic-s"), h("span", {}, env.descargadas ? tr("contacto.wa_paso3_adjuntar") : instruccion)),
    principal,
    h("div", { class: "pn-fila" }, otros)) };
}

// Validación: el error de un campo se borra al escribir y se comprueba al salir del campo
const VALIDAR = {
  nombre: (v) => (String(v ?? "").trim() ? null : tr("contacto.err_nombre")),
  telefono: (v) => (telefonoValido(v) ? null : tr("contacto.err_telefono")),
  pregunta: (v) => (String(v ?? "").trim() ? null : tr("contacto.err_pregunta")),
  privacidad: (v) => (v ? null : tr("contacto.err_privacidad")),
};
function validar() {
  const e = {};
  for (const [k, f] of Object.entries(VALIDAR)) { const m = f(ui.borrador[k]); if (m) e[k] = m; }
  return e;
}
// Pinta o quita el error de un campo sin rehacer el formulario (no se pierden el foco ni el cursor)
function errorCampo(k, mensaje) {
  const campos = (ui.envio.campos ??= {});
  if (mensaje) campos[k] = mensaje; else delete campos[k];
  const control = raiz?.querySelector(`.pn-dialogo [name="${k}"]`);
  const caja = control?.closest(".pn-campo"); if (!caja) return;
  const idErr = `${control.id}-e`;
  let p = caja.querySelector(".pn-error");
  caja.classList.toggle("pn-invalido", !!mensaje);
  if (mensaje) {
    if (!p) { p = h("p", { class: "pn-error c8-error", id: idErr }); caja.append(p); }
    p.replaceChildren(ic("alerta", "pn-ic pn-ic-s"), mensaje);
    control.setAttribute("aria-invalid", "true");
  } else { p?.remove(); control.removeAttribute("aria-invalid"); }
  const refs = new Set((control.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
  if (mensaje) refs.add(idErr); else refs.delete(idErr);
  if (refs.size) control.setAttribute("aria-describedby", [...refs].join(" ")); else control.removeAttribute("aria-describedby");
}
const alEscribir = (k) => (e) => {
  ui.borrador[k] = e.target.value;
  ui.tocados.add(k);
  if (ui.envio.campos?.[k]) errorCampo(k, null);
};
const alSalir = (k) => (e) => {
  if (!e.target.isConnected) return; // el formulario se está rehaciendo
  const v = ui.borrador[k];
  if (ui.tocados.has(k) || ui.envio.intentado || String(v ?? "").trim()) errorCampo(k, VALIDAR[k](v));
};

function dlgContacto() {
  const env = ui.envio;
  if (env.estado === "exito") return pantallaExito();
  if (env.estado === "pegar") return pantallaPegar();
  const b = ui.borrador, canal = canalContacto();
  const marca = R(T.marca?.nombre) || R(T.agente?.nombre) || "—";
  const ids = { n: nuevoId("c"), t: nuevoId("c"), p: nuevoId("c"), v: nuevoId("c"), rg: nuevoId("c"), z: nuevoId("c") };
  const err = env.campos ?? {};
  const desc = (id, k, extra) => [extra, err[k] ? `${id}-e` : null].filter(Boolean).join(" ") || null;
  const campo = (k, id, etiqueta, control, clase = "") => h("div", { class: `pn-campo c8-campo ${clase}`.trim() + (err[k] ? " pn-invalido" : "") },
    h("label", { for: id }, etiqueta), control,
    err[k] ? h("p", { class: "pn-error c8-error", id: `${id}-e` }, ic("alerta", "pn-ic pn-ic-s"), err[k]) : null);
  const enviando = env.estado === "enviando";
  // 1) estancia o zona, con la actual preseleccionada
  const grupos = opcionesZona();
  const zona = h("span", { class: "pn-select" }, h("select", { id: ids.z, name: "zona", "data-k": "c-zona", autofocus: !esTactil() || null,
    onchange: (e) => { ui.borrador.zona = e.target.value; ui.zonaManual = true; } },
    h("option", { value: "general", selected: b.zona === "general" }, tr("contacto.zona_general")),
    grupos.map((g) => {
      const ops = g.opciones.map((o) => h("option", { value: o.id, selected: b.zona === o.id }, o.nombre));
      return g.nombre ? h("optgroup", { label: g.nombre }, ops) : ops;
    })));
  // 2) pregunta con sugerencias
  const pregunta = h("textarea", { id: ids.p, name: "pregunta", rows: "3", "data-k": "c-pregunta", placeholder: tr("contacto.pregunta_ph"), required: true, value: b.pregunta,
    "aria-invalid": err.pregunta ? "true" : null, "aria-describedby": desc(ids.p, "pregunta"), oninput: alEscribir("pregunta"), onblur: alSalir("pregunta") });
  const chips = ["contacto.sug_disponible", "contacto.sug_visita", "contacto.sug_financiacion"].map((k) =>
    h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s pn-chip", "data-k": `sug-${k}`, onclick: () => {
      const t = tr(k), actual = pregunta.value.trim();
      pregunta.value = actual.includes(t) ? actual : actual ? `${actual} ${t}` : t;
      ui.borrador.pregunta = pregunta.value; ui.tocados.add("pregunta");
      if (ui.envio.campos?.pregunta) errorCampo("pregunta", null);
      pregunta.focus();
    } }, tr(k)));
  // 3) datos de contacto (se recuerdan para la próxima vez)
  const nombre = h("input", { id: ids.n, name: "nombre", type: "text", autocomplete: "name", required: true, "data-k": "c-nombre", value: b.nombre,
    "aria-invalid": err.nombre ? "true" : null, "aria-describedby": desc(ids.n, "nombre"), oninput: alEscribir("nombre"), onblur: alSalir("nombre") });
  const telefono = h("input", { id: ids.t, name: "telefono", type: "tel", inputmode: "tel", autocomplete: "tel", required: true, "data-k": "c-telefono", placeholder: "+34 600 123 456", value: b.telefono,
    "aria-invalid": err.telefono ? "true" : null, "aria-describedby": desc(ids.t, "telefono"), oninput: alEscribir("telefono"), onblur: alSalir("telefono") });
  const urlPriv = urlSegura(T.contacto?.url_privacidad);
  const viaWhatsApp = canal === "whatsapp", wa = numeroWhatsApp();
  // Los campos se desplazan; el pie (privacidad, envío y WhatsApp directo) queda siempre a la vista, dentro del mismo
  // vidrio y sin fondo propio (nada opaco sobre la foto). En el móvil en horizontal, a dos columnas (paneles.css).
  const form = h("form", { class: "pn-form", novalidate: true, onsubmit: (e) => { e.preventDefault(); enviarContacto(e.currentTarget); } },
    h("div", { class: "pn-form-campos" },
      agenteMini(),
      bloqueFotos(),
      campo("zona", ids.z, tr("contacto.zona"), zona),
      campo("pregunta", ids.p, tr("contacto.pregunta"), [h("div", { class: "pn-chips", role: "group", "aria-label": tr("contacto.sugerencias") }, chips), pregunta]),
      h("div", { class: "pn-fila-datos" },
        campo("nombre", ids.n, tr("contacto.nombre"), nombre),
        campo("telefono", ids.t, tr("contacto.telefono"), telefono))),
    // 4) pie fijo: privacidad con su primera capa plegada, envío y WhatsApp directo
    h("div", { class: "pn-form-pie" },
    h("div", { class: "pn-campo pn-check" + (err.privacidad ? " pn-invalido" : "") },
      h("input", { id: ids.v, name: "privacidad", type: "checkbox", required: true, checked: b.privacidad, "data-k": "c-priv",
        "aria-describedby": desc(ids.v, "privacidad", ids.rg), "aria-invalid": err.privacidad ? "true" : null,
        onchange: (e) => {
          ui.borrador.privacidad = e.target.checked; ui.tocados.add("privacidad");
          errorCampo("privacidad", e.target.checked || !ui.envio.intentado ? null : VALIDAR.privacidad(false));
        } }),
      h("label", { for: ids.v }, tr("contacto.acepto"), " ",
        urlPriv ? h("a", { href: urlPriv, target: "_blank", rel: "noopener noreferrer" }, tr("contacto.politica")) : tr("contacto.politica")),
      err.privacidad ? h("p", { class: "pn-error c8-error", id: `${ids.v}-e` }, ic("alerta", "pn-ic pn-ic-s"), err.privacidad) : null),
    h("details", { class: "pn-rgpd" }, h("summary", { "data-k": "c-rgpd" }, tr("contacto.info_privacidad")),
      h("p", { id: ids.rg }, R(T.contacto?.texto_privacidad) || tr("contacto.rgpd", { x: marca }))),
    env.estado === "error" ? h("div", { class: "pn-estado pn-estado-error", role: "alert" },
      h("p", {}, ic("alerta", "pn-ic pn-ic-s"), env.error),
      wa ? h("p", { class: "pn-suave" }, tr("contacto.alternativa")) : null,
      h("div", { class: "pn-fila" },
        h("button", { type: "submit", class: "c8-boton c8-boton--secundario", "data-k": "reintentar" }, tr("comun.reintentar")),
        wa ? h("button", { type: "button", class: "c8-boton c8-boton--whatsapp", "data-k": "enviar-wa", onclick: (e) => enviarContacto(e.currentTarget.form, "whatsapp") }, ic("whatsapp"), tr("contacto.enviar_whatsapp")) : null)) : null,
    env.estado === "error" ? null : h("button", { type: "submit", class: `c8-boton ${viaWhatsApp ? "c8-boton--whatsapp" : "c8-boton--primario"} c8-boton--l c8-boton--bloque pn-enviar`, "data-k": "enviar", disabled: enviando, "aria-busy": enviando ? "true" : null },
      ic(viaWhatsApp ? "whatsapp" : "chat"), enviando ? tr("contacto.enviando") : viaWhatsApp ? tr("contacto.enviar_whatsapp") : tr("contacto.enviar")),
    // WhatsApp directo, sin formulario: enlace secundario
    wa && env.estado !== "error" ? h("p", { class: "pn-nota pn-centro pn-directo" }, tr("contacto.directo"), " ",
      h("a", { href: `https://wa.me/${wa}?text=${encodeURIComponent(mensajeRapido())}`, target: "_blank", rel: "noopener noreferrer", "data-k": "wa-directo",
        onclick: () => emitirContacto("whatsapp_directo") }, tr("contacto.whatsapp"))) : null),
  );
  return { titulo: tr("contacto.titulo"), icono: "chat", cuerpo: form, claseCuerpo: "pn-dlg-form" };
}

// Quién responde, en una línea: «Ana Pérez · Inmobiliaria · Ref. 123»
function agenteMini() {
  const a = T.agente; if (!a?.nombre) return null;
  const foto = srcSegura(a.foto);
  return h("p", { class: "pn-agente-mini" },
    foto ? h("img", { src: foto, alt: "", class: "pn-agente-foto", onerror: (e) => e.currentTarget.remove() }) : null,
    h("span", {}, h("b", {}, R(a.nombre)), [R(T.marca?.nombre), !vacio(inm().referencia) ? tr("ficha.referencia", { x: R(inm().referencia) }) : null].filter(Boolean).map((x) => ` · ${x}`)));
}

function urlWebhook() {
  const u = urlSegura(T.contacto?.webhook);
  return u && /^https?:/i.test(u) ? u : null;
}
function canalContacto() {
  const c = T.contacto ?? {};
  const wa = !!numeroWhatsApp(), hook = !!urlWebhook(), mail = emailValido(T.agente?.email);
  let modo = ["whatsapp", "webhook", "ambos"].includes(c.modo) ? c.modo : hook ? "webhook" : "whatsapp";
  if (modo === "ambos" && !hook) modo = "whatsapp";
  if (modo === "ambos" && !wa) modo = "webhook";
  if (modo === "whatsapp" && !wa) modo = hook ? "webhook" : mail ? "email" : "whatsapp";
  if (modo === "webhook" && !hook) modo = wa ? "whatsapp" : mail ? "email" : "whatsapp";
  return modo;
}
function numeroWhatsApp() {
  const crudo = T.contacto?.whatsapp ?? T.agente?.telefono;
  if (!crudo) return null;
  let n = String(crudo).trim().replace(/^00/, "+");
  const intl = n.startsWith("+");
  n = n.replace(/\D/g, "");
  if (!intl && n.length === 9 && /^[6789]/.test(n)) n = "34" + n; // número español sin prefijo
  return n.length >= 8 && n.length <= 15 ? n : null;
}

// El enlace de la consulta: el de la primera foto (lo que se pregunta) o el de la vista actual. "" si no hay web.
const enlaceConsulta = () => ui.capturas[0]?.enlace || enlaceVista();
function datosConsulta() {
  const b = ui.borrador;
  return {
    nombre: b.nombre.trim(), telefono: b.telefono.trim(), pregunta: b.pregunta.trim(),
    referencia: !vacio(inm().referencia) ? R(inm().referencia) : null,
    estancia: nombreZona(b.zona), estancia_id: b.zona ?? "general", estancia_actual: nombreEstancia() || est().nodo || null,
    url: enlaceConsulta(), fecha: new Date().toISOString(), idioma: idiomaActual(), num_fotos: ui.capturas.length,
  };
}
// Un solo enlace; sin dirección web (archivo abierto desde el disco, vista previa) la línea no se escribe
function mensajeWhatsApp(d) {
  const marca = R(T.marca?.nombre);
  return [
    marca ? tr("contacto.msg_saludo", { x: marca }) : null,
    tr("contacto.msg_interes", { x: [d.referencia, titulo()].filter(Boolean).join(" – ") }),
    "",
    `*${tr("contacto.msg_nombre")}:* ${d.nombre}`,
    `*${tr("contacto.msg_telefono")}:* ${d.telefono}`,
    `*${tr("contacto.msg_zona")}:* ${d.estancia}`,
    `*${tr("contacto.msg_pregunta")}:* ${d.pregunta}`,
    ui.capturas.length ? `*${tr("contacto.msg_fotos")}:* ${ui.capturas.map((c, i) => `${i + 1} · ${c.estancia}`).join(", ")}` : null,
    d.url ? `*${tr("contacto.msg_vista")}:* ${d.url}` : null,
  ].filter((x) => x != null).join("\n");
}
function mensajeRapido() {
  const i = inm(), marca = R(T.marca?.nombre);
  return [marca ? tr("contacto.msg_saludo", { x: marca }) : null, tr("contacto.msg_interes", { x: !vacio(i.referencia) ? R(i.referencia) : titulo() }), enlaceVista()].filter(Boolean).join("\n");
}
function abrirWhatsApp(d) {
  const n = numeroWhatsApp(); if (!n) return false;
  window.open(`https://wa.me/${n}?text=${encodeURIComponent(mensajeWhatsApp(d))}`, "_blank", "noopener");
  return true;
}
function emitirContacto(canal) {
  const detalle = { canal, referencia: !vacio(inm().referencia) ? R(inm().referencia) : null, estancia: est().nodo ?? null, fotos: ui.capturas.length };
  // Sin datos personales: este evento puede acabar en window.dataLayer (analítica)
  if (tiene(V.emitir)) { try { V.emitir("contacto", detalle); } catch (e) { console.warn(e); } }
  else window.dispatchEvent(new CustomEvent("visor:contacto", { detail: detalle }));
}

// «Enviar por WhatsApp», en el mismo gesto: copia la primera foto y abre el chat con el mensaje. Sin portapapeles de
// imágenes, las fotos se descargan para adjuntarlas con el clip.
function enviarWhatsApp(d) {
  const n = ui.capturas.length;
  if (n && puedeCopiarImagen()) copiarYMarcar(0); // antes de abrir la pestaña: aún dentro del gesto del usuario
  else if (n) { descargarFotos(); ui.envio = { estado: "pegar", indice: n - 1, copiaOk: false, descargadas: true }; }
  abrirWhatsApp(d);
  emitirContacto("whatsapp");
  if (!n) ui.envio = { estado: "exito", porWhatsapp: true };
  rehacerDialogo();
}

const aBase64 = (blob) => new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1]); r.onerror = mal; r.readAsDataURL(blob); });
async function peticionWebhook(d) {
  if (!ui.capturas.length) return { body: JSON.stringify(d), headers: { "Content-Type": "application/json" }, keepalive: true };
  const meta = ui.capturas.map((c, i) => ({ n: i + 1, estancia: c.estancia, nodo: c.nodo, enlace: c.enlace }));
  const archivos = archivosCapturas();
  if (T.contacto?.webhook_formato === "json") {
    const fotos = await Promise.all(ui.capturas.map(async (c, i) => ({ ...meta[i], nombre: archivos[i].name, tipo: archivos[i].type, base64: await aBase64(c.blob) })));
    return { body: JSON.stringify({ ...d, fotos }), headers: { "Content-Type": "application/json" } };
  }
  const fd = new FormData();
  for (const [k, v] of Object.entries(d)) fd.append(k, v == null ? "" : String(v));
  fd.append("fotos", JSON.stringify(meta));
  archivos.forEach((f, i) => fd.append(`foto_${i + 1}`, f, f.name));
  return { body: fd };
}

async function enviarContacto(form, forzar) {
  if (ui.envio.estado === "enviando") return;
  // sincroniza por si el navegador autocompletó sin disparar input
  if (form) for (const k of ["nombre", "telefono", "pregunta", "zona"]) if (form.elements[k]) ui.borrador[k] = form.elements[k].value;
  if (form?.elements.privacidad) ui.borrador.privacidad = form.elements.privacidad.checked;
  const errores = validar();
  if (Object.keys(errores).length) {
    ui.envio = { estado: "inactivo", campos: errores, intentado: true };
    rehacerDialogo();
    raiz.querySelector(".pn-dialogo [aria-invalid='true']")?.focus();
    return;
  }
  almacen.guardar(CLAVE_CONTACTO, { nombre: ui.borrador.nombre.trim(), telefono: ui.borrador.telefono.trim() });
  const d = datosConsulta();
  const canal = forzar ?? canalContacto();
  // Todo lo que abre ventanas o copia va antes del primer await (gesto del usuario)
  if (canal === "whatsapp") { enviarWhatsApp(d); return; }
  if (canal === "email") {
    location.href = `mailto:${T.agente.email.trim()}?subject=${encodeURIComponent(tr("contacto.titulo") + (d.referencia ? ` · ${d.referencia}` : ""))}&body=${encodeURIComponent(mensajeWhatsApp(d).replace(/\*/g, ""))}`;
    if (ui.capturas.length) descargarFotos();
    emitirContacto("email"); ui.envio = { estado: "exito", email: true }; rehacerDialogo(); return;
  }
  // «ambos»: WhatsApp se abre ya con el texto (las fotos llegan por el webhook)
  if (canal === "ambos") abrirWhatsApp(d);
  if (navigator.onLine === false) { ui.envio = { estado: "error", error: tr("contacto.sin_conexion") }; rehacerDialogo(); return; }
  ui.envio = { estado: "enviando" }; rehacerDialogo();
  const ctrl = new AbortController(); const temporizador = setTimeout(() => ctrl.abort(), 30000);
  try {
    const peticion = await peticionWebhook(d);
    const r = await fetch(urlWebhook(), { method: "POST", ...peticion, signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    emitirContacto(canal === "ambos" ? "ambos" : "webhook");
    ui.envio = { estado: "exito", porWhatsapp: canal === "ambos" };
    vaciarCapturas(); pintarContador();
  } catch (e) {
    console.warn("Contacto: error en el webhook", e);
    ui.envio = { estado: "error", error: navigator.onLine === false ? tr("contacto.sin_conexion") : tr("contacto.error") };
  } finally { clearTimeout(temporizador); }
  if (ui.dialogo === "contacto") {
    rehacerDialogo();
    raiz.querySelector(ui.envio.estado === "exito" ? ".pn-dialogo [data-k='otra']" : ".pn-dialogo [data-k='reintentar']")?.focus();
  }
}

// ------------------------------------------------------------------ galería de renders y planos (visor de imágenes)
function galeriaRenders() {
  const items = (Array.isArray(T.galeria) ? T.galeria : []).filter((g) => srcSegura(g?.imagen));
  if (!items.length) return null;
  const tipos = [...new Set(items.map((g) => g.tipo).filter(Boolean))];
  const estancias = [...new Set(items.map((g) => g.estancia).filter(Boolean))];
  const filtros = [["todo", tr("galeria.todo")],
    ...(tipos.length > 1 ? tipos.map((t) => [`tipo:${t}`, nombreTipo(t)]) : []),
    ...(estancias.length > 1 ? estancias.map((e) => [`est:${e}`, nombreZona(e)]) : [])];
  const f = filtros.some(([k]) => k === ui.filtroGaleria) ? ui.filtroGaleria : "todo";
  const visibles = items.filter((g) => f === "todo" || (f.startsWith("tipo:") ? g.tipo === f.slice(5) : g.estancia === f.slice(4)));
  const sec = seccion("galeria", tr("galeria.renders"),
    filtros.length > 2 ? h("div", { class: "pn-chips pn-filtros", role: "group", "aria-label": tr("galeria.filtro") }, filtros.map(([k, et]) =>
      h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s pn-chip", "data-k": `gal-${k}`, "aria-pressed": String(k === f), onclick: () => {
        ui.filtroGaleria = k; const nueva = galeriaRenders(); sec.replaceWith(nueva); nueva.querySelector(`[data-k="${CSS.escape(`gal-${k}`)}"]`)?.focus();
      } }, et))) : null,
    h("ul", { class: "pn-galeria" + (visibles.length >= 3 && (visibles.length - 3) % 3 === 0 ? " pn-galeria-destacada" : "") }, visibles.map((g, i) => h("li", {},
      h("button", { type: "button", class: "pn-gal-btn", "data-k": `gal-item-${i}`, "aria-label": tr("galeria.ampliar", { x: R(g.titulo) || nombreTipo(g.tipo) || String(i + 1) }), onclick: (e) => abrirLightbox(visibles, i, e.currentTarget) },
        h("img", { src: srcSegura(g.miniatura) ?? srcSegura(g.imagen), alt: "", loading: "lazy", decoding: "async" }),
        g.tipo === "render" ? h("span", { class: "pn-gal-tipo", "aria-hidden": "true" }, tr("galeria.etiqueta_render")) : null)))));
  return sec;
}
const nombreTipo = (t) => (t ? (tr(`galeria.tipo_${t}`) !== `galeria.tipo_${t}` ? tr(`galeria.tipo_${t}`) : t) : "");

function abrirLightbox(lista, i, opener) {
  ui.lightbox = { lista, i, opener: opener?.dataset?.k };
  raiz.querySelector(".pn-lb")?.remove();
  raiz.append(lightbox());
  requestAnimationFrame(() => raiz.querySelector(".pn-lb [data-k='lb-cerrar']")?.focus());
}
function cerrarLightbox() {
  const k = ui.lightbox?.opener; ui.lightbox = null;
  raiz.querySelector(".pn-lb")?.remove();
  if (k) raiz.querySelector(`[data-k="${CSS.escape(k)}"]`)?.focus();
}
function moverLightbox(d) {
  const lb = ui.lightbox; if (!lb) return;
  lb.i = (lb.i + d + lb.lista.length) % lb.lista.length;
  const foco = document.activeElement?.dataset?.k;
  raiz.querySelector(".pn-lb")?.replaceWith(lightbox());
  raiz.querySelector(`.pn-lb [data-k="${foco ?? "lb-cerrar"}"]`)?.focus();
}
function lightbox() {
  const { lista, i } = ui.lightbox, g = lista[i], varias = lista.length > 1;
  const titId = nuevoId("lb");
  let x0 = null;
  const fig = h("figure", { class: "pn-lb-fig",
    onpointerdown: (e) => { x0 = e.clientX; },
    onpointerup: (e) => { if (x0 != null && varias && Math.abs(e.clientX - x0) > 50) moverLightbox(e.clientX < x0 ? 1 : -1); x0 = null; } },
    h("img", { src: srcSegura(g.imagen), alt: R(g.titulo) || nombreTipo(g.tipo), draggable: "false" }),
    h("figcaption", { id: titId },
      g.tipo === "render" ? h("span", { class: "pn-lb-tipo" }, tr("galeria.tipo_render")) : g.tipo ? h("span", { class: "pn-lb-tipo pn-lb-tipo-sec" }, nombreTipo(g.tipo)) : null,
      h("span", { class: "pn-lb-tit" }, R(g.titulo) || (g.estancia ? nombreZona(g.estancia) : "")),
      g.estancia && R(g.titulo) ? h("span", { class: "pn-suave" }, nombreZona(g.estancia)) : null,
      g.autor ? h("span", { class: "pn-suave" }, tr("galeria.autor", { x: R(g.autor) })) : null,
      varias ? h("span", { class: "pn-lb-n" }, tr("galeria.n_de", { n: i + 1, total: lista.length })) : null));
  // vidrio denso a pantalla completa (sigue al tema): la foto manda y la escena queda desenfocada detrás
  const caja = h("div", { class: "pn-lb c8-vidrio c8-vidrio--denso c8-vidrio--barra", role: "dialog", "aria-modal": "true", "aria-label": tr("galeria.visor"), "aria-describedby": titId,
    onkeydown: (e) => {
      if (e.key === "ArrowRight" && varias) { e.preventDefault(); moverLightbox(1); }
      else if (e.key === "ArrowLeft" && varias) { e.preventDefault(); moverLightbox(-1); }
      else if (e.key === "Tab") { // foco atrapado
        const f = [...caja.querySelectorAll("button")]; const a = f.indexOf(document.activeElement);
        e.preventDefault(); f[(a + (e.shiftKey ? -1 : 1) + f.length) % f.length]?.focus();
      }
    },
    onclick: (e) => { if (e.target === caja) cerrarLightbox(); } },
    fig,
    varias ? h("button", { type: "button", class: "c8-boton c8-boton--icono pn-btn-ic pn-lb-ant", "data-k": "lb-ant", "aria-label": tr("galeria.anterior"), onclick: () => moverLightbox(-1) }, ic("izq")) : null,
    varias ? h("button", { type: "button", class: "c8-boton c8-boton--icono pn-btn-ic pn-lb-sig", "data-k": "lb-sig", "aria-label": tr("galeria.siguiente"), onclick: () => moverLightbox(1) }, ic("der")) : null,
    h("button", { type: "button", class: "c8-boton c8-boton--icono pn-btn-ic pn-lb-cerrar", "data-k": "lb-cerrar", "aria-label": tr("comun.cerrar"), onclick: cerrarLightbox }, ic("cerrar")));
  return caja;
}

// ------------------------------------------------------------------ compartir
// Móvil: «Compartir…» del sistema y copiar. Escritorio (o sin Web Share): copiar y WhatsApp; QR solo con ratón.
function dlgCompartir() {
  const url = enlaceVista();
  const msg = tr("compartir.mensaje", { x: titulo() });
  if (!url) return { titulo: tr("compartir.titulo"), icono: "compartir", cuerpo: [h("p", { class: "pn-suave", "data-k": "sh-sin-web" }, tr("compartir.sin_web"))] };
  const idInput = nuevoId("enl"), tactil = esTactil(), nativo = tactil && tiene(navigator.share);
  const copiar = async (e) => {
    const btn = e.currentTarget;
    let ok = false;
    try { await navigator.clipboard.writeText(url); ok = true; } catch {
      const inp = raiz.querySelector(`#${idInput}`); inp?.select(); try { ok = document.execCommand("copy"); } catch {}
    }
    // cambio de estado animado: el icono de copiar pasa a una marca que se dibuja
    if (ok) { aviso(tr("compartir.copiado")); btn.querySelector("span").textContent = tr("compartir.copiado"); btn.querySelector("svg")?.replaceWith(ic("ok", "pn-ic pn-dibujar")); }
  };
  const botonCopiar = h("button", { type: "button", class: `c8-boton ${nativo ? "c8-boton--secundario" : "c8-boton--primario"}`, "data-k": "copiar", autofocus: !nativo || null, onclick: copiar },
    ic("copiar"), h("span", {}, tr("compartir.copiar")));
  return { titulo: tr("compartir.titulo"), icono: "compartir", cuerpo: [
    nativo ? h("button", { type: "button", class: "c8-boton c8-boton--primario c8-boton--bloque", "data-k": "sh-nativo", autofocus: true,
      onclick: () => navigator.share({ title: titulo(), text: msg, url }).catch(() => {}) }, ic("compartir"), tr("compartir.nativo")) : null,
    h("div", { class: "pn-campo c8-campo" }, h("label", { for: idInput }, tr("compartir.enlace")),
      h("div", { class: "pn-copiar" }, h("input", { id: idInput, type: "text", readonly: true, value: url, onfocus: (e) => e.target.select() }), botonCopiar)),
    nativo ? null : h("a", { class: "c8-boton c8-boton--secundario", "data-k": "sh-wa", href: `https://wa.me/?text=${encodeURIComponent(`${msg}\n${url}`)}`, target: "_blank", rel: "noopener noreferrer" },
      ic("whatsapp"), h("span", {}, tr("compartir.whatsapp"))),
    tactil ? null : h("div", { class: "pn-qr", "data-url": url },
      h("div", { class: "pn-qr-img", role: "img", "aria-label": tr("compartir.qr_alt") }, h("span", { class: "pn-giro", "aria-hidden": "true" })),
      h("div", { class: "pn-qr-txt" }, h("p", { class: "pn-qr-tit" }, tr("compartir.qr")), h("p", { class: "pn-suave" }, tr("compartir.qr_nota")))),
  ] };
}

let moduloQR = null;
async function pintarQR() {
  const caja = raiz?.querySelector(".pn-qr"); if (!caja) return;
  try {
    moduloQR ??= import("./vendor/qr.js"); // ruta fija: el HTML autónomo lo lleva dentro
    const { qrSVG } = await moduloQR;
    const svg = qrSVG(caja.dataset.url, { margen: 2 });
    if (typeof svg !== "string" || !svg.includes("<svg")) throw new Error("QR vacío");
    const tpl = document.createElement("template"); tpl.innerHTML = svg.trim();
    const el = tpl.content.querySelector("svg"); el?.setAttribute("aria-hidden", "true");
    caja.querySelector(".pn-qr-img").replaceChildren(el ?? "");
  } catch (e) {
    console.warn("QR no disponible", e);
    moduloQR = null;
    caja.hidden = true; // solo queda el enlace
  }
}

// ------------------------------------------------------------------ estilo y luz
// Proyectos: Estilo (recreaciones con IA). Colores si el tour los trae (viviendas construidas). En todos: Luz y «Antes y después».
// En el móvil es una hoja baja (la escena se sigue viendo); en el escritorio, una ventana junto a su botón.
function dlgEstilo() {
  const e = est(), partes = [];
  const estilos = listaEstilos();
  if (estilos.length) {
    const actual = e.estilo ?? "original", disp = estiloDisponible(actual), n = nodoActual();
    partes.push(h("fieldset", { class: "pn-grupo" }, h("legend", {}, tr("estilos.titulo")),
      h("div", { class: "pn-estilos" }, estilos.map((st) => {
        const enNodo = st.id === "original" || !n || (n.variantes ?? []).some((v) => v.estilo === st.id);
        const muestras = MUESTRAS_ESTILO[st.id] ?? ["#ccc", "#888", "#444"];
        return h("button", { type: "button", class: "pn-estilo" + (enNodo ? "" : " pn-no-aqui"), "data-k": `estilo-${st.id}`, "aria-pressed": String(actual === st.id),
          title: enNodo ? null : tr("estilos.no_disponible"), onclick: () => { try { V.fijarEstilo(st.id); } catch (er) { console.warn(er); } } },
          srcSegura(st.miniatura) ? h("img", { src: srcSegura(st.miniatura), alt: "", class: "pn-estilo-mini" }) : h("span", { class: "pn-estilo-muestra", "aria-hidden": "true" }, muestras.map((c) => h("i", { style: `background:${c}` }))),
          h("span", { class: "pn-estilo-nombre" }, nombreEstilo(st)));
      })),
      h("p", { class: "pn-aviso", role: "status", "data-k": "estilo-aviso", hidden: disp }, ic("info", "pn-ic pn-ic-s"), tr("estilos.no_disponible")),
      h("p", { class: "pn-nota", "data-k": "estilo-ia", hidden: !(actual !== "original" && disp) }, tr("ficha.aviso_ia"))));
  }
  if (hayPintura()) {
    const pint = e.pintura ?? {}, dispo = e.pinturaDisponible !== false;
    const grupo = (k, etiqueta) => {
      const lista = (T.personalizacion[k] ?? []).filter((m) => colorValido(m?.color));
      if (!lista.length) return null;
      const id = nuevoId("col");
      return h("div", { class: "pn-pintura" }, h("p", { class: "pn-et", id }, etiqueta),
        h("div", { class: "pn-muestras", role: "group", "aria-labelledby": id }, lista.map((m) => {
          const c = colorValido(m.color);
          return h("button", { type: "button", class: "pn-muestra", "data-k": `${k}-${c}`, style: `--m:${c}`, disabled: !dispo, "data-color": c.toLowerCase(),
            "aria-pressed": String((pint[k] ?? "").toLowerCase() === c.toLowerCase()), "aria-label": R(m.nombre) || c, title: R(m.nombre) || c,
            onclick: () => { try { V.fijarPintura({ ...(est().pintura ?? {}), [k]: c }); } catch (er) { console.warn(er); } } });
        })));
    };
    partes.push(h("fieldset", { class: "pn-grupo", disabled: !dispo }, h("legend", {}, tr("pintura.titulo")),
      !dispo ? h("p", { class: "pn-aviso", role: "status" }, ic("info", "pn-ic pn-ic-s"), tr("pintura.no_disponible")) : null,
      grupo("paredes", tr("pintura.paredes")), grupo("suelos", tr("pintura.suelos")),
      h("button", { type: "button", class: "pn-enlace-btn", "data-k": "pintura-reset", disabled: !dispo || (!pint.paredes && !pint.suelos),
        onclick: () => { try { V.fijarPintura({ paredes: null, suelos: null }); } catch (er) { console.warn(er); } } }, tr("pintura.restablecer"))));
  }
  const momentos = listaMomentos();
  if (momentos.length) {
    const actual = e.momento ?? "dia", nombreGrupo = nuevoId("luz");
    const iconos = { dia: "sol", atardecer: "atardecer", noche: "luna" };
    partes.push(h("fieldset", { class: "pn-grupo" },
      h("legend", {}, tr("momento.titulo"), h("span", { class: "pn-suave", "data-k": "luz-simulada", hidden: !(e.momentoSimulado === true && actual !== "dia") }, ` ${tr("momento.simulado")}`)),
      h("div", { class: "c8-segmentado pn-segmentado", role: "radiogroup", "aria-label": tr("momento.titulo") }, momentos.map((m) =>
        h("label", { "data-k": `momento-${m}` },
          h("input", { type: "radio", name: nombreGrupo, value: m, checked: actual === m, onchange: () => { try { V.fijarMomento(m); } catch (er) { console.warn(er); } } }),
          h("span", {}, ic(iconos[m] ?? "sol", "pn-ic pn-ic-s"), tr(`momento.${m}`)))))));
  }
  if (tiene(V.comparar) && partes.length) {
    partes.push(h("label", { class: "pn-fila-ajuste pn-grupo" },
      h("span", { class: "pn-fila-texto" }, tr("comparar.titulo"), h("small", {}, tr("comparar.nota"))),
      h("input", { type: "checkbox", role: "switch", class: "c8-interruptor", "data-k": "comparar", checked: !!e.comparar,
        onchange: (ev) => { try { V.comparar(ev.target.checked); } catch (er) { console.warn(er); } if (V.estado) V.estado.comparar = ev.target.checked; } })));
  }
  return { titulo: tr("personalizar.titulo"), icono: "pincel", cuerpo: partes };
}
// Al cambiar estilo, luz, color o comparación, solo cambian las marcas (sin repintar: no salta el control segmentado)
function pintarEstilo() {
  const d = raiz?.querySelector(".pn-dialogo-estilo"); if (!d) return;
  const e = est(), actual = e.estilo ?? "original", disp = estiloDisponible(actual);
  for (const b of d.querySelectorAll("[data-k^='estilo-']")) if (b.classList.contains("pn-estilo")) b.setAttribute("aria-pressed", String(b.dataset.k === `estilo-${actual}`));
  const av = d.querySelector("[data-k='estilo-aviso']"); if (av) av.hidden = disp;
  const ia = d.querySelector("[data-k='estilo-ia']"); if (ia) ia.hidden = !(actual !== "original" && disp);
  for (const r of d.querySelectorAll(".pn-segmentado input")) r.checked = r.value === (e.momento ?? "dia");
  const sim = d.querySelector("[data-k='luz-simulada']"); if (sim) sim.hidden = !(e.momentoSimulado === true && (e.momento ?? "dia") !== "dia");
  for (const b of d.querySelectorAll(".pn-muestra")) {
    const k = b.dataset.k.split("-")[0];
    b.setAttribute("aria-pressed", String((e.pintura?.[k] ?? "").toLowerCase() === b.dataset.color));
  }
  const reset = d.querySelector("[data-k='pintura-reset']"); if (reset) reset.disabled = e.pinturaDisponible === false || (!e.pintura?.paredes && !e.pintura?.suelos);
  const cmp = d.querySelector("[data-k='comparar']"); if (cmp) cmp.checked = !!e.comparar;
  try { window.cre8Tema?.segmentados?.(d); } catch {}
}

// ------------------------------------------------------------------ ajustes
// Idioma · Apariencia y Tamaño · Música · Controles (solo con ratón) · Accesibilidad (fase3-organizacion.md, P-4).
// Cada control llama al núcleo (visor.ajustes, visor.sonido…) o a la preferencia común (cre8Tema.fijar).
function dlgAjustes() {
  const a = ajustesActuales(), ef = temaLeer("efectivo") ?? {}, partes = [];
  const grupo = (titulo, ...hijos) => h("section", { class: "pn-grupo-ajustes" }, titulo ? h("h3", { class: "pn-sec-tit" }, titulo) : null, ...hijos);
  const interruptor = (k, texto, nota, marcado, alCambiar) => h("label", { class: "pn-fila-ajuste" },
    h("span", { class: "pn-fila-texto" }, texto, nota ? h("small", {}, nota) : null),
    h("input", { type: "checkbox", role: "switch", class: "c8-interruptor", "data-k": `aj-${k}`, checked: !!marcado, onchange: (e) => alCambiar(e.target.checked) }));
  const ajuste = (k, texto, nota, clave = k) => interruptor(k, texto, nota, a[clave], (si) => cambiarAjuste({ [clave]: si }));
  if (idiomasOfrecidos().length > 1) partes.push(grupo(tr("idioma.titulo"), selectorIdioma(true)));
  const apariencia = grupoApariencia();
  if (apariencia) partes.push(apariencia);
  const musica = filaMusica();
  if (musica) partes.push(grupo(tr("sonido.musica"), musica));
  if (!esTactil()) {
    const id = nuevoId("vel"), v = Number(a.sensibilidad) || 1;
    const out = h("output", { for: id, class: "pn-salida" }, `${fmtNum(v, 1)}×`);
    const juego = tiene(V.modoJuego);
    partes.push(grupo(tr("ajustes.controles"),
      h("div", { class: "pn-fila-ajuste pn-fila-rango" }, h("label", { for: id }, tr("ajustes.velocidad")), out),
      h("input", { id, type: "range", class: "c8-deslizador", min: "0.5", max: "2", step: "0.1", value: String(v), "data-k": "aj-velocidad", style: `--valor:${((v - 0.5) / 1.5) * 100}%`,
        oninput: (e) => { const x = +e.target.value; out.textContent = `${fmtNum(x, 1)}×`; cambiarAjuste({ sensibilidad: x, sensibilidadTactil: x }); } }),
      juego ? ajuste("wasd", tr("ajustes.modo_juego_wasd"), tr("ajustes.modo_juego_nota"), "modoJuegoWASD") : null,
      juego ? ajuste("clic", tr("ajustes.captura_clic"), null, "capturaConClic") : null,
      ajuste("atajos", tr("ajustes.atajos"), tr("ajustes.atajos_nota"))));
  }
  partes.push(grupo(tr("ajustes.accesibilidad"),
    ajuste("movimiento", tr("ajustes.reducir_movimiento"), tr("ajustes.reducir_nota"), "reducirMovimiento"),
    temaApi() ? interruptor("transparencia", tr("ajustes.reducir_transparencia"), tr("ajustes.transparencia_nota"), ef.transparencia === "reducida",
      (si) => fijarTema("transparencia", si ? "reducida" : "normal")) : null));
  // Restablecer: los ajustes del visor y la apariencia vuelven a lo de fábrica (automático, talla M)
  partes.push(h("button", { type: "button", class: "pn-enlace-btn", "data-k": "aj-reset", onclick: () => {
    const def = AJUSTES_DEF();
    cambiarAjuste({ sensibilidad: def.sensibilidad, sensibilidadTactil: def.sensibilidad, modoJuegoWASD: def.modoJuegoWASD, capturaConClic: def.capturaConClic, atajos: def.atajos });
    if (temaApi()) for (const [k, v] of Object.entries(PREF_DEF)) fijarTema(k, v);
    else fijarMovimiento("auto");
    rehacerDialogo();
  } }, tr("ajustes.restablecer")));
  return { titulo: tr("ajustes.titulo"), icono: "ajustes", cuerpo: partes };
}

// «Apariencia: Automático · Claro · Oscuro» y «Tamaño: S · M · L» (preferencias comunes de tema.js). El icono es un
// círculo que se llena según lo elegido; nunca un sol ni una luna (son la luz de la vivienda, en «Estilo y luz»).
function grupoApariencia() {
  if (!temaApi()) return null;
  const pref = { ...PREF_DEF, ...(temaLeer("preferencias") ?? {}) }, idAp = nuevoId("ap"), idTa = nuevoId("ta");
  const opciones = (clave, valores, { etiqueta, texto, nombre, clase = "" }) => {
    const grupoRadio = nuevoId(clave);
    return h("div", { class: `c8-segmentado pn-segmentado ${clase}`.trim(), role: "radiogroup", "aria-labelledby": etiqueta, "data-pref": clave },
      valores.map((v) => h("label", { "data-k": `aj-${clave}-${v}`, title: nombre?.(v) },
        h("input", { type: "radio", name: grupoRadio, value: v, checked: pref[clave] === v, "aria-label": nombre?.(v), onchange: () => fijarTema(clave, v) }),
        h("span", { "aria-hidden": nombre ? "true" : null }, texto(v)))));
  };
  return h("section", { class: "pn-grupo-ajustes pn-apariencia" },
    h("h3", { class: "pn-sec-tit pn-tit-ic", id: idAp }, icApariencia(pref.tema), tr("ajustes.apariencia")),
    opciones("tema", ["auto", "claro", "oscuro"], { etiqueta: idAp, texto: (v) => tr(`ajustes.tema_${v}`) }),
    h("p", { class: "pn-nota" }, tr("ajustes.tema_nota")),
    h("div", { class: "pn-fila-ajuste" },
      h("span", { class: "pn-fila-texto", id: idTa }, tr("ajustes.tamano"), h("small", {}, tr("ajustes.tamano_nota"))),
      opciones("talla", ["s", "m", "l"], { etiqueta: idTa, texto: (v) => v.toUpperCase(), nombre: (v) => tr(`ajustes.talla_${v}`), clase: "pn-seg-talla" })));
}
// Refleja en Ajustes (si está abierto) la apariencia vigente, sin repintar: no se pierde el foco
function pintarApariencia() {
  const d = raiz?.querySelector(".pn-dialogo-ajustes"); if (!d || !temaApi()) return;
  const pref = { ...PREF_DEF, ...(temaLeer("preferencias") ?? {}) }, ef = temaLeer("efectivo") ?? {};
  for (const r of d.querySelectorAll("[data-pref] input[type=radio]")) r.checked = r.value === pref[r.closest("[data-pref]").dataset.pref];
  const icono = d.querySelector(".pn-ic-apariencia"); if (icono) icono.dataset.v = pref.tema;
  const t = d.querySelector("[data-k='aj-transparencia']"); if (t) t.checked = ef.transparencia === "reducida";
  const m = d.querySelector("[data-k='aj-movimiento']"); if (m) m.checked = ef.movimiento === "reducido";
  try { temaApi().segmentados?.(d); } catch {}
}

// Música del proyecto (visor.sonido): interruptor y volumen. El botón del núcleo solo silencia.
function filaMusica() {
  const s = V?.sonido;
  if (!s?.disponible) return null;
  const id = nuevoId("vol"), vol = Math.round((Number(s.volumen) || 0) * 100);
  return h("div", { class: "pn-musica" },
    h("label", { class: "pn-fila-ajuste" }, h("span", { class: "pn-fila-texto" }, tr("sonido.musica")),
      h("input", { type: "checkbox", role: "switch", class: "c8-interruptor", "data-k": "aj-musica", checked: !!s.activo,
        onchange: () => { try { V.sonido.alternar(); } catch (e) { console.warn(e); } pintarSonido(); } })),
    h("div", { class: "pn-fila-ajuste pn-fila-rango" }, h("label", { for: id }, tr("sonido.volumen")), h("output", { for: id, class: "pn-salida", "data-k": "aj-vol-txt" }, `${fmtNum(vol)} %`)),
    h("input", { id, type: "range", class: "c8-deslizador", min: "0", max: "100", step: "5", value: String(vol), "data-k": "aj-volumen", style: `--valor:${vol}%`,
      oninput: (e) => { try { V.sonido.fijarVolumen(+e.target.value / 100); } catch (er) { console.warn(er); } pintarSonido(); } }));
}
function pintarSonido() {
  const s = V?.sonido;
  if (!raiz || !s || ui.dialogo !== "ajustes") return;
  const sw = raiz.querySelector("[data-k='aj-musica']");
  if (!sw) { if (s.disponible) rehacerDialogo(); return; } // la música terminó de cargar con Ajustes abierto
  sw.checked = !!s.activo;
  const r = raiz.querySelector("[data-k='aj-volumen']"), txt = raiz.querySelector("[data-k='aj-vol-txt']");
  const vol = document.activeElement === r ? +r.value : Math.round((Number(s.volumen) || 0) * 100);
  if (r && document.activeElement !== r) { r.value = String(vol); r.style.setProperty("--valor", `${vol}%`); }
  if (txt) txt.textContent = `${fmtNum(vol)} %`;
}

// ------------------------------------------------------------------ idioma
// En Ajustes, control segmentado (ES · EN · FR · DE); en su propio diálogo, la lista con el nombre de cada idioma
function selectorIdioma(compacto = false) {
  const lista = idiomasOfrecidos(), nombre = nuevoId("idioma");
  if (compacto) return h("div", { class: "c8-segmentado pn-segmentado", role: "radiogroup", "aria-label": tr("idioma.titulo") }, lista.map((c) =>
    h("label", { "data-k": `idioma-${c}`, lang: c, title: nombreIdioma(c) },
      h("input", { type: "radio", name: nombre, value: c, checked: c === idiomaActual(), "aria-label": nombreIdioma(c), onchange: () => cambiarIdioma(c) }),
      h("span", { "aria-hidden": "true" }, c.toUpperCase()))));
  return h("div", { class: "pn-idiomas", role: "radiogroup", "aria-label": tr("idioma.titulo") }, lista.map((c) =>
    h("label", { class: "pn-idioma" + (c === idiomaActual() ? " pn-elegido" : ""), "data-k": `idioma-${c}`, lang: c },
      h("input", { type: "radio", name: nombre, value: c, checked: c === idiomaActual(), onchange: () => cambiarIdioma(c) }),
      h("span", { class: "pn-idioma-cod", "aria-hidden": "true" }, c.toUpperCase()), h("span", {}, nombreIdioma(c)))));
}
function dlgIdioma() { return { titulo: tr("idioma.titulo"), icono: "globo", cuerpo: selectorIdioma() }; }

function cambiarIdioma(c) {
  if (c === idiomaActual()) return;
  fijarIdioma(c); // dispara renderizar() vía alCambiarIdioma
  try { V.idioma?.(c); } catch (e) { console.warn(e); }
  raiz.querySelector(`[data-k="idioma-${c}"] input`)?.focus();
}
