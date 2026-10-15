// Paneles de negocio del visor: marca, ficha del inmueble, contacto, hipoteca, compartir/QR,
// personalización (estilos, momento, pintura, comparar), herramientas, idioma y ajustes.
// Uso: import("./paneles.js").then((m) => m.iniciarPaneles(window.visor))
// Se programa contra la API de ESQUEMA.md de forma defensiva: cada método se comprueba antes de usarlo.

import { tr, fijarIdioma, idiomaActual, resolverTexto, detectarIdioma, localeActual, nombreIdioma, alCambiarIdioma, diccionario } from "./i18n.js";

const R = resolverTexto;
const CLAVE_AJUSTES = "visor:ajustes";
const CLAVE_CONTACTO = "visor:contacto";
const ESTILOS_POR_DEFECTO = ["original", "nordico", "mediterraneo", "industrial", "contemporaneo_minimalista", "clasico"];
const MOMENTOS = ["dia", "atardecer", "noche"];
// Escala oficial del certificado energético (letra siempre visible en texto)
const ENERGIA = { A: "#00a651", B: "#4cb848", C: "#bed62f", D: "#fff200", E: "#fdb913", F: "#f37021", G: "#ed1c24" };
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
  ascensor: "M5 3h14v18H5zM9 10l2-2.5 2 2.5M9 14l2 2.5 2-2.5M16 6v12",
  brujula: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM15.5 8.5l-2 5-5 2 2-5z",
  calendario: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  estrella: "M12 3l2.2 5.6 6 .7-4.5 3.9 1.4 5.8L12 16l-5.1 3 1.4-5.8-4.5-3.9 6-.7z",
  coche: "M5 16v3M19 16v3M3 16h18v-4l-2-5H5l-2 5zM3 12h18M7 14h.01M17 14h.01",
  caja: "M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10",
  sombrilla: "M12 3a9 9 0 0 1 9 8H3a9 9 0 0 1 9-8zM12 11v9M8 20h8",
  olas: "M3 17c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 3-1.2 4.5 0M3 21c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 3-1.2 4.5 0M8 14V5.5a2 2 0 0 1 4 0M16 14V5.5a2 2 0 0 0-4 0M8 9h8",
  arbol: "M12 21v-7M12 14a5 5 0 0 0 5-5 5 5 0 0 0-10 0 5 5 0 0 0 5 5zM8 21h8",
  llama: "M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .3 1.5 1 2.5 2.5 3 0-3-1-5 0-8z",
  copo: "M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5",
  pincel: "M18.4 2.6a2 2 0 0 1 2.9 2.9L13 13.8 10.2 11zM9 14.5c-2 0-3.5 1.5-3.5 3.5 0 1-.8 2-2.5 2 1 1 2.5 1.5 4 1.5 2.5 0 4.5-2 4.5-4.5",
  regla: "M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2",
  play: "M8 5l11 7-11 7z",
  pausa: "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z",
  compartir: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4",
  globo: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z",
  ajustes: "M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4",
  whatsapp: "M3.5 20.5l1.3-4.3A8.5 8.5 0 1 1 8 19.4zM9 8.6c0 3.4 3 6.4 6.4 6.4l1-1.5-2-1-1 .9a5 5 0 0 1-2.8-2.8l.9-1-1-2z",
  chat: "M4 5h16v11H9l-5 4z",
  cerrar: "M6 6l12 12M18 6L6 18",
  der: "M9 6l6 6-6 6", izq: "M15 6l-6 6 6 6", arriba: "M6 15l6-6 6 6",
  copiar: "M9 9h11v11H9zM5 15H4V4h11v1",
  correo: "M3 5h18v14H3zM3 6l9 7 9-7",
  descargar: "M12 4v12M7 11l5 5 5-5M5 20h14",
  sol: "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  atardecer: "M3 18h18M7 18a5 5 0 0 1 10 0M12 3v4M4.9 9.9l1.4 1.4M19.1 9.9l-1.4 1.4M2 14h2M20 14h2M6 21h12",
  luna: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z",
  pin: "M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  doc: "M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6",
  tel: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  calc: "M6 3h12v18H6zM9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01",
  info: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM12 11v5M12 8h.01",
  ok: "M5 12.5l4.5 4.5L19 7.5",
  alerta: "M12 3l10 18H2zM12 10v4M12 17h.01",
  comparar: "M12 3v18M4 6h5v12H4zM15 6h5v12h-5z",
  enlace: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  externo: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  casa: "M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6",
  ficha: "M5 3h14v18H5zM9 8h6M9 12h6M9 16h4",
  camara: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  musica: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
};
const RELLENO = new Set(["play", "pausa"]);

function ic(nombre, clase = "pn-ic") {
  const ns = "http://www.w3.org/2000/svg";
  const s = document.createElementNS(ns, "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
  s.setAttribute("class", clase);
  const p = document.createElementNS(ns, "path");
  p.setAttribute("d", P[nombre] ?? P.info);
  if (RELLENO.has(nombre)) { p.setAttribute("fill", "currentColor"); p.setAttribute("stroke", "none"); }
  s.append(p);
  return s;
}

// ------------------------------------------------------------------ utilidades DOM
const PROPS = new Set(["value", "checked", "disabled", "hidden", "selected", "open", "textContent", "htmlFor"]);
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

function leerLS(clave) { try { return JSON.parse(localStorage.getItem(clave) ?? "null"); } catch { return null; } }
function guardarLS(clave, v) { try { localStorage.setItem(clave, JSON.stringify(v)); } catch {} }

// ------------------------------------------------------------------ formato
const fmtNum = (n, d = 0) => new Intl.NumberFormat(localeActual(), { maximumFractionDigits: d, minimumFractionDigits: 0 }).format(n);
function fmtMoneda(n, d = 0) {
  const moneda = T?.inmueble?.moneda ?? "EUR";
  try { return new Intl.NumberFormat(localeActual(), { style: "currency", currency: moneda, maximumFractionDigits: d, minimumFractionDigits: d }).format(n); }
  catch { return `${fmtNum(n, d)} ${moneda}`; }
}
const m2 = (n) => `${fmtNum(n, n < 100 ? 1 : 0)} m²`;

function colorTexto(hex) {
  // Elige texto oscuro o claro según el contraste WCAG con el acento
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex ?? "").trim());
  if (!m) return null;
  let c = m[1]; if (c.length === 3) c = [...c].map((x) => x + x).join("");
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin(parseInt(c.slice(0, 2), 16)) + 0.7152 * lin(parseInt(c.slice(2, 4), 16)) + 0.0722 * lin(parseInt(c.slice(4, 6), 16));
  const conOscuro = (L + 0.05) / (0.0134 + 0.05), conClaro = 1.05 / (L + 0.05);
  return conOscuro >= conClaro ? "#14110b" : "#ffffff";
}

const areaPoligono = (p) => Math.abs(p.reduce((s, [x, z], i) => { const [x2, z2] = p[(i + 1) % p.length]; return s + x * z2 - x2 * z; }, 0)) / 2;

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

// Enlaces que vienen del tour: solo http(s), mailto, tel o rutas relativas; nunca javascript: ni otros esquemas.
// En descargas se admiten además blob: del propio origen (vista previa del Estudio) y data: de PDF o imagen (tour autónomo).
const CON_ESQUEMA = /^[a-z][a-z0-9+.-]*:/i;
export function urlSegura(u, { descarga = false } = {}) {
  if (typeof u !== "string") return null;
  const s = u.trim();
  if (!s || /[\u0000-\u001f\u007f]/.test(s)) return null;
  if (/^(https?:|mailto:|tel:)/i.test(s)) return s;
  if (descarga && s.startsWith(`blob:${location.origin}/`)) return s;
  if (descarga && /^data:(application\/pdf|image\/(png|jpe?g|webp|gif|avif))[;,]/i.test(s)) return s;
  return CON_ESQUEMA.test(s) ? null : s;
}
// Imágenes del tour (logo, fotos, renders): http(s), blob:, data:image o rutas relativas
function srcSegura(u) {
  if (typeof u !== "string" || !u.trim()) return null;
  const s = u.trim();
  if (/^(https?:|blob:)/i.test(s) || /^data:image\//i.test(s)) return s;
  return CON_ESQUEMA.test(s) ? null : s;
}
const emailValido = (e) => typeof e === "string" && /^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[^\s@<>()"',;:]+$/.test(e.trim());
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
  disp: "lateral", abierto: false, altura: "peek", dialogo: null, opener: null,
  borrador: { nombre: "", telefono: "", pregunta: "", privacidad: false },
  envio: { estado: "inactivo", error: "" },
  hip: null, descripcionAbierta: false, midiendo: false, guiada: false,
  capturas: [], capturando: false, tomando: false, zonaManual: false, filtroGaleria: "todo", lightbox: null,
  tocados: new Set(), interactuado: false, acentoPropio: false,
};
const EVENTOS_INTERACCION = ["pointerdown", "keydown", "wheel", "touchstart"];
const limpiezas = [];
let mo = null;

const est = () => V?.estado ?? {};
const tiene = (fn) => typeof fn === "function";

// ------------------------------------------------------------------ inicio
export function iniciarPaneles(visor) {
  destruir();
  V = visor ?? window.visor ?? {};
  T = V.tour ?? {};

  raiz = document.getElementById("paneles");
  if (!raiz) { raiz = h("div", { id: "paneles" }); document.body.append(raiz); }
  raiz.classList.add("pn-raiz");

  let param = null; try { param = new URLSearchParams(location.search).get("lang"); } catch {}
  const idioma = !param && est().idioma && diccionario[est().idioma] ? est().idioma : detectarIdioma(T);
  fijarIdioma(idioma);
  try { document.documentElement.lang = idiomaActual(); } catch {}

  aplicarMarca();
  const guardado = leerLS(CLAVE_CONTACTO);
  if (guardado) { ui.borrador.nombre = guardado.nombre ?? ""; ui.borrador.telefono = guardado.telefono ?? ""; }
  aplicarAjustes(cargarAjustes(), false);

  ui.disp = calcularDisposicion();
  renderizar();

  // Eventos del visor
  const on = (ev, fn) => { if (tiene(V.on)) { V.on(ev, fn); limpiezas.push(() => V.off?.(ev, fn)); } };
  on("nodo", () => refrescar());
  on("estilo", () => refrescar());
  on("momento", () => refrescar());
  on("pintura", () => refrescar());
  on("modo", () => refrescar());
  on("idioma", (d) => { const c = typeof d === "string" ? d : d?.idioma ?? d?.cod; if (c && c !== idiomaActual()) fijarIdioma(c); });
  on("guion:inicio", () => { ui.guiada = true; refrescar(); });
  on("guion:fin", () => { ui.guiada = false; refrescar(); });
  on("medir", (d) => { ui.midiendo = typeof d === "boolean" ? d : !!(d?.activo ?? est().midiendo); refrescar(); });
  // Un tour nuevo (carga inicial, recarga o «visor:cargar» del Estudio) rehace todo lo que dependía del anterior
  const alTour = () => { cambiarTour(V.tour ?? T); renderizar(); };
  on("tour", alTour);
  on("listo", alTour);
  on("sonido", () => pintarSonido());
  limpiezas.push(alCambiarIdioma(() => renderizar()));
  // La interfaz no se autooculta hasta que el visitante ha interactuado de verdad (un movimiento sintético no cuenta)
  if (!ui.interactuado) {
    const marcar = (e) => {
      if (e.isTrusted === false) return;
      ui.interactuado = true; raiz?.classList.add("pn-interactuado");
      for (const ev of EVENTOS_INTERACCION) removeEventListener(ev, marcar, true);
    };
    for (const ev of EVENTOS_INTERACCION) addEventListener(ev, marcar, { capture: true, passive: true });
    limpiezas.push(() => { for (const ev of EVENTOS_INTERACCION) removeEventListener(ev, marcar, true); });
  }

  const alRedimensionar = () => {
    const d = calcularDisposicion();
    if (d !== ui.disp) { ui.disp = d; ui.altura = "peek"; renderizar(); } else colocarHoja(false);
  };
  addEventListener("resize", alRedimensionar);
  limpiezas.push(() => removeEventListener("resize", alRedimensionar));
  const alTecla = (e) => { if (e.key === "Escape") escape(e); };
  document.addEventListener("keydown", alTecla);
  limpiezas.push(() => document.removeEventListener("keydown", alTecla));
  // body.modo-libre / ui-inactiva los pone el núcleo
  mo = new MutationObserver(() => colocarHoja(false));
  mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  return { renderizar, abrirFicha: () => abrirPanel(true), abrirContacto: () => abrirDialogo("contacto"), cerrar: cerrarDialogo, destruir };
}

export function destruir() {
  while (limpiezas.length) { try { limpiezas.pop()(); } catch {} }
  mo?.disconnect(); mo = null;
  if (raiz) { raiz.replaceChildren(); raiz.className = ""; }
  try { document.documentElement.style.removeProperty("--reserva-inferior"); } catch {}
}

function cambiarTour(nuevo) {
  T = nuevo ?? {};
  ui.hip = null; ui.filtroGaleria = "todo"; ui.lightbox = null; ui.descripcionAbierta = false;
  ui.capturando = false; vaciarCapturas();
  ui.envio = { estado: "inactivo", error: "" }; ui.tocados = new Set();
  ui.zonaManual = false; ui.borrador.zona = ui.dialogo === "contacto" ? zonaPorDefecto() : undefined;
  aplicarMarca();
  if (T.idiomas?.length && !T.idiomas.includes(idiomaActual())) fijarIdioma(detectarIdioma(T));
}
// Por si el núcleo sustituye visor.tour sin avisar: cualquier repintado lo detecta
function sincronizarTour() {
  const t = V?.tour;
  if (!t || t === T) return false;
  cambiarTour(t);
  return true;
}
function clasesRaiz() {
  return ["pn-raiz", `pn-disp-${ui.disp}`, ui.abierto && "pn-abierto", ui.dialogo && `pn-con-dialogo pn-dlg-${ui.dialogo}`,
    ui.capturando && "pn-capturando pn-abierto", ui.interactuado && "pn-interactuado"].filter(Boolean).join(" ");
}

function calcularDisposicion() {
  const w = innerWidth, hh = innerHeight;
  if (hh <= 500 && w > hh) return "compacta";          // móvil en horizontal
  if (w <= 720 || (hh > w && w <= 1024)) return "hoja"; // móvil y tablet en vertical
  return "lateral";
}

// ------------------------------------------------------------------ marca y ajustes
function aplicarMarca() {
  const estilo = document.documentElement.style;
  const color = typeof T.marca?.color === "string" ? T.marca.color.trim() : null;
  const txt = colorTexto(color);
  if (txt) { estilo.setProperty("--acento", color); estilo.setProperty("--acento-texto", txt); ui.acentoPropio = true; }
  else if (ui.acentoPropio) { estilo.removeProperty("--acento"); estilo.removeProperty("--acento-texto"); ui.acentoPropio = false; }
}

const AJUSTES_BASE = () => ({
  sensibilidad: 1, sensibilidadTactil: 1, invertirY: false,
  reducirMovimiento: !!matchMedia?.("(prefers-reduced-motion: reduce)").matches,
});
function cargarAjustes() { return { ...AJUSTES_BASE(), ...(leerLS(CLAVE_AJUSTES) ?? {}) }; }
function aplicarAjustes(a, guardar = true) {
  ui.ajustes = a;
  if (guardar) guardarLS(CLAVE_AJUSTES, a);
  document.documentElement.classList.toggle("pn-sin-movimiento", !!a.reducirMovimiento);
  try { if (tiene(V.ajustes)) V.ajustes({ ...a }); } catch (e) { console.warn(e); }
}

// ------------------------------------------------------------------ datos derivados
const inm = () => T.inmueble ?? {};
const panoramas = () => T.panoramas ?? [];
function nodoActual() { const id = est().nodo; return panoramas().find((p) => p.id === id) ?? null; }
const nombreEstancia = () => R(nodoActual()?.nombre) || "";
// Enlace a la vista actual. Vacío si el recorrido no tiene dirección web (HTML autónomo abierto desde el disco sin
// url_publica): nunca se comparte una ruta file://, que revelaría la carpeta del ordenador del visitante.
const enlaceVista = () => {
  try { if (tiene(V.enlaceVista)) return V.enlaceVista() || ""; } catch { return ""; }
  return /^https?:$/.test(location.protocol) ? location.href : "";
};
const titulo = () => R(T.titulo) || R(inm().tipo ? tr(`tipo.${inm().tipo}`) : "") || document.title;

function hayVariantesEstilo() { return panoramas().some((p) => (p.variantes ?? []).some((v) => v.estilo && v.estilo !== "original")); }
function listaEstilos() {
  const proyecto = inm().estado_obra === "proyecto";
  if (!hayVariantesEstilo() && !(proyecto && T.estilos?.length)) return [];
  let lista = T.estilos?.length ? T.estilos.map((e) => (typeof e === "string" ? { id: e } : e)) : null;
  if (!lista) {
    const ids = new Set(panoramas().flatMap((p) => (p.variantes ?? []).map((v) => v.estilo).filter(Boolean)));
    lista = [...ESTILOS_POR_DEFECTO.filter((id) => ids.has(id)), ...[...ids].filter((id) => !ESTILOS_POR_DEFECTO.includes(id))].map((id) => ({ id }));
  }
  if (!lista.some((e) => e.id === "original")) lista.unshift({ id: "original" });
  return lista;
}
function nombreEstilo(e) {
  if (e.nombre) return R(e.nombre);
  if (e.id === "original") return inm().estado_obra === "proyecto" ? tr("estilo.original") : tr("estilo.actual");
  const k = `estilo.${e.id}`; const t = tr(k);
  return t === k ? e.id.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()) : t;
}
function estiloDisponible(id = est().estilo) {
  if (!id || id === "original") return true;
  if (typeof est().estiloDisponible === "boolean" && id === est().estilo) return est().estiloDisponible;
  const n = nodoActual(); if (!n) return true;
  return (n.variantes ?? []).some((v) => v.estilo === id);
}
function listaMomentos() {
  const conVariantes = panoramas().some((p) => (p.variantes ?? []).some((v) => v.momento && v.momento !== "dia"));
  const m = T.momentos?.length ? T.momentos : conVariantes ? MOMENTOS : [];
  return m.length > 1 ? m : [];
}
const hayPintura = () => !!(T.personalizacion && ((T.personalizacion.paredes?.length) || (T.personalizacion.suelos?.length)));
const hayPersonalizar = () => (listaEstilos().length > 1 && tiene(V.fijarEstilo)) || (listaMomentos().length > 0 && tiene(V.fijarMomento)) || (hayPintura() && tiene(V.fijarPintura));
const idiomasOfrecidos = () => (T.idiomas?.length ? T.idiomas : [idiomaActual()]).filter((c) => diccionario[c]);

const precioNum = () => { const n = numero(inm().precio); return n && n > 0 ? n : null; };
function textoPrecio() {
  const precio = precioNum();
  if (!precio) return tr("ficha.precio_consultar");
  return fmtMoneda(precio) + (inm().operacion === "alquiler" ? tr("ficha.mes") : "");
}
function resumenCorto() {
  const i = inm(), partes = [];
  if (i.habitaciones) partes.push(`${i.habitaciones} ${(i.habitaciones === 1 ? tr("ficha.habitacion") : tr("ficha.habitaciones")).toLowerCase()}`);
  if (i.banos) partes.push(`${i.banos} ${(i.banos === 1 ? tr("ficha.bano") : tr("ficha.banos")).toLowerCase()}`);
  if (i.superficie_construida) partes.push(m2(i.superficie_construida));
  return partes.join(" · ");
}

// ------------------------------------------------------------------ render principal
function renderizar() {
  if (!raiz) return;
  sincronizarTour();
  const foco = document.activeElement?.dataset?.k;
  raiz.className = clasesRaiz();
  raiz.replaceChildren(...[
    ui.disp === "hoja" ? null : rail(),
    panel(),
    ui.disp === "hoja" ? null : dockContacto(),
    h("div", { class: "pn-velo", hidden: !(ui.dialogo && ui.disp !== "lateral" && ui.dialogo !== "personalizar"), onclick: cerrarDialogo }),
    dialogo(),
    ui.capturando ? barraCaptura() : null,
    ui.lightbox ? lightbox() : null,
    h("div", { class: "pn-toast", role: "status", "aria-live": "polite" }),
  ].filter(Boolean));
  colocarHoja(false);
  if (foco) raiz.querySelector(`[data-k="${CSS.escape(foco)}"]`)?.focus({ preventScroll: true });
}

// Actualiza solo lo que depende del estado del visor sin perder el foco
function refrescar() {
  if (!raiz) return;
  if (sincronizarTour()) { renderizar(); return; }
  ui.midiendo = typeof est().midiendo === "boolean" ? est().midiendo : ui.midiendo;
  ui.guiada = typeof est().guionActivo === "boolean" ? est().guionActivo : ui.guiada;
  for (const b of raiz.querySelectorAll("[data-k='medir']")) b.setAttribute("aria-pressed", String(ui.midiendo));
  for (const b of raiz.querySelectorAll("[data-k='guiada']")) actualizarBotonGuiada(b);
  if (ui.dialogo === "personalizar" || ui.dialogo === "contacto") rehacerDialogo();
}

function rehacerDialogo() {
  const viejo = raiz.querySelector(".pn-dialogo");
  if (!viejo) return;
  const teniaFoco = viejo.contains(document.activeElement);
  const foco = document.activeElement?.dataset?.k;
  const scroll = viejo.querySelector(".pn-dlg-cuerpo")?.scrollTop ?? 0;
  const nuevo = dialogo();
  viejo.replaceWith(nuevo);
  const c = nuevo.querySelector(".pn-dlg-cuerpo"); if (c) c.scrollTop = scroll;
  if (foco) nuevo.querySelector(`[data-k="${CSS.escape(foco)}"]`)?.focus({ preventScroll: true });
  // si el control que tenía el foco ya no existe (cambio de pantalla), pasa al botón principal o al título
  if (teniaFoco && !nuevo.contains(document.activeElement)) (nuevo.querySelector("[autofocus]") ?? nuevo.querySelector(".pn-dlg-tit"))?.focus({ preventScroll: true });
}

function aviso(texto) {
  const t = raiz?.querySelector(".pn-toast"); if (!t) return;
  t.textContent = texto; t.classList.add("pn-visible");
  clearTimeout(aviso.t); aviso.t = setTimeout(() => t.classList.remove("pn-visible"), 2600);
}

// ------------------------------------------------------------------ raíl de herramientas (escritorio / horizontal)
function botonIcono({ k, icono, etiqueta, onclick, pulsado, extra = {} }) {
  return h("button", { type: "button", class: "pn-btn-ic", "data-k": k, "aria-label": etiqueta, "data-tip": etiqueta, "aria-pressed": pulsado == null ? null : String(pulsado), onclick, ...extra }, ic(icono));
}

function herramientas({ compacto = false } = {}) {
  const lista = [];
  if (hayPersonalizar()) lista.push({ k: "personalizar", icono: "pincel", etiqueta: tr("personalizar.titulo"), onclick: (e) => alternarDialogo("personalizar", e.currentTarget), extra: { "aria-haspopup": "dialog", "aria-expanded": String(ui.dialogo === "personalizar") } });
  if (tiene(V.medir)) lista.push({ k: "medir", icono: "regla", etiqueta: tr("medir.titulo"), pulsado: ui.midiendo, onclick: alternarMedir });
  if (tiene(V.guion?.iniciar)) lista.push({ k: "guiada", icono: ui.guiada ? "pausa" : "play", etiqueta: ui.guiada ? tr("guion.parar") : tr("guion.iniciar"), pulsado: ui.guiada, onclick: alternarGuiada });
  lista.push({ k: "compartir", icono: "compartir", etiqueta: tr("compartir.titulo"), onclick: (e) => alternarDialogo("compartir", e.currentTarget), extra: { "aria-haspopup": "dialog" } });
  if (idiomasOfrecidos().length > 1 && !compacto) lista.push({ k: "idioma", icono: "globo", etiqueta: tr("idioma.titulo"), onclick: (e) => alternarDialogo("idioma", e.currentTarget), extra: { "aria-haspopup": "dialog" } });
  lista.push({ k: "ajustes", icono: "ajustes", etiqueta: tr("ajustes.titulo"), onclick: (e) => alternarDialogo("ajustes", e.currentTarget), extra: { "aria-haspopup": "dialog" } });
  return lista;
}

function rail() {
  const compacta = ui.disp === "compacta";
  const items = herramientas({ compacto: compacta }).filter((b) => !compacta || ["personalizar", "compartir", "ajustes"].includes(b.k));
  return h("nav", { class: "pn-rail", "aria-label": tr("herramientas.titulo") },
    compacta
      ? botonIcono({ k: "pestana", icono: "ficha", etiqueta: tr("ficha.abrir"), onclick: () => abrirPanel(!ui.abierto), extra: { "aria-expanded": String(ui.abierto), "aria-controls": "pn-panel" } })
      : h("button", { type: "button", class: "pn-pestana", "data-k": "pestana", "aria-label": `${tr("ficha.pestana")}: ${textoPrecio()}`, "aria-expanded": String(ui.abierto), "aria-controls": "pn-panel", onclick: () => abrirPanel(!ui.abierto) },
          h("span", { class: "pn-pestana-et" }, tr("ficha.pestana")),
          h("span", { class: "pn-pestana-precio" }, textoPrecio()),
          ic(ui.abierto ? "der" : "izq", "pn-ic pn-ic-s")),
    h("div", { class: "pn-rail-grupo" }, items.map(botonIcono)),
  );
}

function botonContacto(k, clase = "") {
  return h("button", { type: "button", class: `pn-btn pn-btn-acento pn-contactar ${clase}`.trim(), "data-k": k, "aria-haspopup": "dialog",
    "aria-expanded": String(ui.dialogo === "contacto"), onclick: (e) => alternarDialogo("contacto", e.currentTarget) },
    ic("chat"), h("span", {}, tr("contacto.corto")));
}

function actualizarBotonGuiada(b) {
  b.setAttribute("aria-pressed", String(ui.guiada));
  const et = ui.guiada ? tr("guion.parar") : tr("guion.iniciar");
  if (b.classList.contains("pn-btn-ic")) { b.setAttribute("aria-label", et); b.dataset.tip = et; b.replaceChildren(ic(ui.guiada ? "pausa" : "play")); }
  else b.replaceChildren(ic(ui.guiada ? "pausa" : "play"), h("span", {}, et));
}

function alternarMedir() {
  ui.midiendo = !ui.midiendo;
  try { V.medir?.(ui.midiendo); } catch (e) { console.warn(e); }
  if (ui.midiendo) { cerrarDialogo(); if (ui.disp !== "lateral") abrirPanel(false); else if (ui.disp === "hoja") fijarAltura("peek"); }
  refrescar();
}
function alternarGuiada() {
  try { if (ui.guiada) V.guion?.parar?.(); else { V.guion?.iniciar?.(); cerrarDialogo(); if (ui.disp !== "lateral") abrirPanel(false); } } catch (e) { console.warn(e); }
  ui.guiada = !ui.guiada; // los eventos guion:inicio / guion:fin lo confirman
  refrescar();
}

// ------------------------------------------------------------------ panel lateral / hoja inferior
function abrirPanel(si) {
  if (ui.disp === "hoja") { fijarAltura(si ? "medio" : "peek"); return; }
  ui.abierto = si;
  raiz.classList.toggle("pn-abierto", si);
  for (const b of raiz.querySelectorAll("[data-k='pestana']")) b.setAttribute("aria-expanded", String(si));
  const pest = raiz.querySelector(".pn-pestana .pn-ic-s"); if (pest) pest.replaceWith(ic(si ? "der" : "izq", "pn-ic pn-ic-s"));
  const p = raiz.querySelector(".pn-panel");
  p.inert = !si;
  if (si) setTimeout(() => p.querySelector(".pn-panel-cab button, .pn-panel-cuerpo")?.focus({ preventScroll: true }), 30);
  colocarHoja(false);
}

function panel() {
  const hoja = ui.disp === "hoja";
  const p = h("aside", { class: "pn-panel", id: "pn-panel", "aria-label": tr("ficha.titulo"), tabindex: "-1" },
    hoja ? peek() : null,
    hoja ? null : h("div", { class: "pn-panel-cab" },
      cabeceraMarca(),
      h("button", { type: "button", class: "pn-btn-ic pn-cerrar", "data-k": "cerrar-panel", "aria-label": tr("ficha.cerrar"), onclick: () => { abrirPanel(false); raiz.querySelector("[data-k='pestana']")?.focus(); } }, ic("cerrar"))),
    h("div", { class: "pn-panel-cuerpo", tabindex: "-1" },
      hoja ? cabeceraMarca() : null,
      ui.disp !== "lateral" ? filaHerramientas() : null,
      ...ficha()),
    ui.disp === "compacta" ? h("div", { class: "pn-panel-pie" }, botonContacto("contacto-panel", "pn-btn-ancho")) : null,
  );
  if (!hoja && !ui.abierto) p.inert = true;
  if (hoja) prepararArrastre(p);
  return p;
}

function cabeceraMarca() {
  const m = T.marca ?? {};
  if (!m.nombre && !m.logo) return null;
  const src = srcSegura(m.logo), web = urlSegura(m.web);
  const logo = src ? h("img", { class: "pn-logo", src, alt: m.nombre ? R(m.nombre) : "", decoding: "async", onerror: (e) => e.currentTarget.remove() }) : null;
  const nombre = m.nombre ? h("span", { class: "pn-marca-nombre" }, R(m.nombre)) : null;
  return h("div", { class: "pn-marca" },
    web ? h("a", { href: web, target: "_blank", rel: "noopener noreferrer", class: "pn-marca-enlace", title: tr("marca.web") }, logo, nombre) : [logo, nombre]);
}

function filaHerramientas() {
  const items = herramientas();
  return h("div", { class: "pn-fila-herr", role: "toolbar", "aria-label": tr("herramientas.titulo") },
    items.map((b) => h("button", { type: "button", class: "pn-chip", "data-k": b.k, "aria-pressed": b.pulsado == null ? null : String(b.pulsado), onclick: b.onclick, ...b.extra }, ic(b.icono), h("span", {}, b.etiqueta))));
}

function peek() {
  const i = inm();
  const verPrecio = h("button", { type: "button", class: "pn-peek-precio", "data-k": "peek-precio", "aria-controls": "pn-panel", "aria-expanded": String(ui.altura !== "peek"), "aria-label": `${tr("ficha.abrir")}: ${textoPrecio()}`, onclick: () => fijarAltura(ui.altura === "peek" ? "medio" : "peek") },
    h("span", { class: "pn-precio pn-precio-s" }, textoPrecio()),
    h("span", { class: "pn-peek-sub" }, resumenCorto() || (i.referencia ? tr("ficha.referencia", { x: i.referencia }) : tr("ficha.pestana"))));
  return h("div", { class: "pn-peek" },
    h("span", { class: "pn-asa", "data-k": "asa", "aria-hidden": "true" }, h("span")),
    verPrecio,
    h("div", { class: "pn-peek-acc" },
      hayPersonalizar() ? botonIcono({ k: "personalizar-peek", icono: "pincel", etiqueta: tr("personalizar.titulo"), onclick: (e) => alternarDialogo("personalizar", e.currentTarget), extra: { "aria-haspopup": "dialog" } }) : null,
      botonContacto("contacto-peek", "pn-peek-contacto")));
}

// --- hoja inferior: alturas, arrastre y reserva para el núcleo
const ALTURAS = { peek: 0, medio: 0.5, alto: 0.9 };
function segInf() {
  const s = raiz?.querySelector(".pn-peek"); if (!s) return 0;
  return Math.max(0, (parseFloat(getComputedStyle(s).paddingBottom) || 0) - 10); // padding = 10px + safe area
}
function alturaVisible(nombre) {
  const peekPx = (raiz.querySelector(".pn-peek")?.offsetHeight ?? 64);
  if (nombre === "peek") return peekPx;
  return Math.max(peekPx, Math.round(innerHeight * ALTURAS[nombre]));
}
function fijarAltura(nombre) {
  if (ui.disp !== "hoja") { abrirPanel(nombre !== "peek"); return; }
  ui.altura = nombre;
  colocarHoja(true);
  for (const b of raiz.querySelectorAll("[data-k='peek-precio']")) b.setAttribute("aria-expanded", String(nombre !== "peek"));
}
function colocarHoja(animar) {
  if (!raiz) return;
  const raizDoc = document.documentElement.style;
  const p = raiz.querySelector(".pn-panel");
  if (ui.disp !== "hoja" || !p) {
    raizDoc.removeProperty("--reserva-inferior");
    raizDoc.setProperty("--pn-ocupado-der", ui.abierto ? "380px" : "0px");
    // Ancho ocupado abajo a la derecha (dock + contacto) para que la galería del núcleo no lo pise.
    requestAnimationFrame(() => {
      let izq = innerWidth;
      for (const el of raiz?.querySelectorAll(".pn-dock, .pn-rail, .pn-barra-captura") ?? []) {
        if (getComputedStyle(el).visibility === "hidden") continue;
        const r = el.getBoundingClientRect();
        if (r.width && r.bottom > innerHeight - 140) izq = Math.min(izq, r.left);
      }
      raizDoc.setProperty("--ancho-dock", `${Math.max(0, Math.round(innerWidth - izq))}px`);
    });
    return;
  }
  const libre = document.body.classList.contains("modo-libre");
  raiz.classList.toggle("pn-libre", libre);
  if (libre && ui.altura !== "peek") ui.altura = "peek";
  const total = p.offsetHeight || Math.round(innerHeight * 0.9);
  const vis = Math.min(total, alturaVisible(ui.altura));
  p.classList.toggle("pn-sin-anim", !animar);
  p.style.setProperty("--pn-desp", `${total - vis}px`);
  p.style.setProperty("--pn-oculto", `${total - vis}px`);
  p.dataset.altura = ui.altura;
  const cuerpo = p.querySelector(".pn-panel-cuerpo");
  if (cuerpo) cuerpo.inert = ui.altura === "peek";
  const peekPx = raiz.querySelector(".pn-peek")?.offsetHeight ?? 64;
  // en modo libre la hoja se reduce a una píldora a la derecha: no hace falta reservar todo el ancho
  let reserva = libre ? 0 : Math.max(0, peekPx - segInf());
  // en modo captura la barra flotante ocupa el sitio del peek: el núcleo sube su galería por encima
  const barra = ui.capturando && raiz.querySelector(".pn-barra-captura");
  if (barra) reserva = barra.offsetHeight + 10;
  raizDoc.setProperty("--reserva-inferior", `${reserva}px`);
}

function prepararArrastre(p) {
  let ini = null;
  const zona = (e) => e.target.closest(".pn-peek") && !e.target.closest(".pn-peek-acc");
  p.addEventListener("pointerdown", (e) => {
    if (!zona(e) || e.button > 0) return;
    const total = p.offsetHeight;
    ini = { y: e.clientY, t: performance.now(), desp: parseFloat(p.style.getPropertyValue("--pn-desp")) || 0, total, movido: false, id: e.pointerId };
  });
  p.addEventListener("pointermove", (e) => {
    if (!ini || e.pointerId !== ini.id) return;
    const dy = e.clientY - ini.y;
    if (!ini.movido && Math.abs(dy) < 6) return;
    if (!ini.movido) { ini.movido = true; p.setPointerCapture(e.pointerId); p.classList.add("pn-sin-anim"); }
    const peekPx = alturaVisible("peek");
    const d = Math.min(ini.total - peekPx, Math.max(0, ini.desp + dy));
    p.style.setProperty("--pn-desp", `${d}px`);
  });
  const fin = (e) => {
    if (!ini || e.pointerId !== ini.id) return;
    const datos = ini; ini = null;
    // un toque (sin arrastre) en el fondo del peek o en el asa abre o cierra la hoja; los botones se gestionan solos
    if (!datos.movido) { if (!e.target.closest("button, a, input, select, textarea")) fijarAltura(ui.altura === "peek" ? "medio" : "peek"); return; }
    e.preventDefault();
    const vel = (e.clientY - datos.y) / Math.max(1, performance.now() - datos.t); // px/ms, + hacia abajo
    const vis = datos.total - (parseFloat(p.style.getPropertyValue("--pn-desp")) || 0) - vel * 180;
    const opciones = Object.keys(ALTURAS).map((n) => [n, Math.abs(alturaVisible(n) - vis)]).sort((a, b) => a[1] - b[1]);
    const tragar = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
    p.addEventListener("click", tragar, { capture: true, once: true });
    setTimeout(() => p.removeEventListener("click", tragar, { capture: true }), 0);
    fijarAltura(opciones[0][0]);
  };
  p.addEventListener("pointerup", fin);
  p.addEventListener("pointercancel", fin);
}

// ------------------------------------------------------------------ ficha del inmueble
function seccion(clave, titulo, ...hijos) {
  const id = nuevoId(clave);
  return h("section", { class: `pn-sec pn-sec-${clave}`, "aria-labelledby": id }, h("h3", { id, class: "pn-sec-tit" }, titulo), ...hijos);
}

function ficha() {
  const i = inm();
  const tipo = i.tipo ? tr(`tipo.${i.tipo}`) : "";
  const op = i.operacion === "alquiler" ? tr("ficha.alquiler") : i.operacion === "venta" ? tr("ficha.venta") : "";
  const sup = numero(i.superficie_construida) || numero(i.superficie_util), precio = precioNum();
  let pm2 = null;
  if (precio && sup) pm2 = tr("ficha.precio_m2", { x: fmtMoneda(precio / sup, i.operacion === "alquiler" ? 1 : 0) }) + (i.operacion === "alquiler" ? tr("ficha.mes") : "");
  const etiquetaTipo = [tipo !== `tipo.${i.tipo}` ? tipo : R(i.tipo), op].filter(Boolean).join(" · ");

  const partes = [
    h("header", { class: "pn-cabecera" },
      etiquetaTipo ? h("p", { class: "pn-sobretitulo" }, etiquetaTipo) : null,
      h("h2", { class: "pn-titulo" }, titulo()),
      h("p", { class: "pn-precio" }, textoPrecio()),
      h("p", { class: "pn-precio-meta" }, pm2, pm2 && i.referencia ? h("span", { class: "pn-sep", "aria-hidden": "true" }, "·") : null, i.referencia ? tr("ficha.referencia", { x: R(i.referencia) }) : null)),
    galeriaRenders(),
    datosClave(),
    certificado(),
    vacio(i.caracteristicas) ? null : seccion("caract", tr("ficha.caracteristicas"),
      h("ul", { class: "pn-caract" }, i.caracteristicas.map((c) => h("li", {}, ic("ok", "pn-ic pn-ic-s"), R(c))))),
    descripcion(),
    gastos(),
    superficies(),
    i.operacion !== "alquiler" && precio ? hipoteca() : null,
    ubicacion(),
    documentos(),
    agente(),
    avisoLegal(),
    credito(),
  ];
  return partes.filter(Boolean);
}

function datosClave() {
  const i = inm(), d = [];
  const si = (v) => v === true;
  const add = (icono, etiqueta, valor) => d.push(h("li", { class: "pn-dato" }, ic(icono), h("span", { class: "pn-dato-v" }, valor), h("span", { class: "pn-dato-e" }, etiqueta)));
  if (i.superficie_construida) add("superficie", tr("ficha.sup_construida"), m2(i.superficie_construida));
  if (i.superficie_util) add("util", tr("ficha.sup_util"), m2(i.superficie_util));
  if (i.superficie_parcela) add("parcela", tr("ficha.sup_parcela"), m2(i.superficie_parcela));
  if (i.habitaciones != null) add("cama", tr("ficha.habitaciones"), fmtNum(i.habitaciones));
  if (i.banos != null) add("bano", tr("ficha.banos"), fmtNum(i.banos));
  if (!vacio(i.planta)) add("planta", tr("ficha.planta"), R(i.planta));
  if (i.ascensor != null) add("ascensor", i.ascensor ? tr("ficha.ascensor") : tr("ficha.sin_ascensor"), i.ascensor ? tr("comun.si") : tr("comun.no"));
  if (!vacio(i.orientacion)) add("brujula", tr("ficha.orientacion"), R(i.orientacion));
  if (i.ano_construccion) add("calendario", tr("ficha.ano"), String(i.ano_construccion));
  if (!vacio(i.estado)) add("estrella", tr("ficha.estado"), R(i.estado));
  if (si(i.garaje) || typeof i.garaje === "number") add("coche", tr("ficha.garaje"), typeof i.garaje === "number" ? fmtNum(i.garaje) : tr("ficha.incluido"));
  if (si(i.trastero)) add("caja", tr("ficha.trastero"), tr("ficha.incluido"));
  if (i.terraza) add("sombrilla", tr("ficha.terraza"), typeof i.terraza === "number" ? m2(i.terraza) : tr("ficha.incluido"));
  if (i.piscina) add("olas", tr("ficha.piscina"), typeof i.piscina === "string" || typeof i.piscina === "object" ? R(i.piscina) : tr("ficha.incluido"));
  if (i.jardin) add("arbol", tr("ficha.jardin"), typeof i.jardin === "number" ? m2(i.jardin) : tr("ficha.incluido"));
  if (!vacio(i.calefaccion)) add("llama", tr("ficha.calefaccion"), R(i.calefaccion));
  if (i.aire_acondicionado) add("copo", tr("ficha.aire"), typeof i.aire_acondicionado === "boolean" ? tr("ficha.incluido") : R(i.aire_acondicionado));
  if (!d.length) return null;
  return seccion("datos", tr("ficha.datos"), h("ul", { class: "pn-datos" }, d));
}

function certificado() {
  const c = inm().certificado_energetico;
  if (!c) return null;
  const cl = (c.consumo_letra ?? "").toUpperCase(), el = (c.emisiones_letra ?? "").toUpperCase();
  const tramite = !!c.en_tramite || (!cl && !el);
  const letras = Object.keys(ENERGIA);
  const resumen = tramite ? tr("energia.en_tramite") : [
    cl && `${tr("energia.consumo")}: ${cl}${c.consumo_valor != null ? ` (${fmtNum(c.consumo_valor, 1)} ${tr("energia.unidad_consumo")})` : ""}`,
    el && `${tr("energia.emisiones")}: ${el}${c.emisiones_valor != null ? ` (${fmtNum(c.emisiones_valor, 1)} ${tr("energia.unidad_emisiones")})` : ""}`,
  ].filter(Boolean).join(". ");
  const marca = (letra, val, valor) => letra === val
    ? h("span", { class: "pn-ee-flecha" }, h("b", {}, letra), valor != null ? h("small", {}, fmtNum(valor, 1)) : null)
    : null;
  const escala = h("div", { class: "pn-ee-escala" + (tramite ? " pn-ee-tramite" : ""), "aria-hidden": "true" },
    h("span", { class: "pn-ee-cab" }), h("span", { class: "pn-ee-cab" }, tr("energia.consumo")), h("span", { class: "pn-ee-cab" }, tr("energia.emisiones")),
    letras.map((L, k) => [
      h("span", { class: "pn-ee-barra", style: `--c:${ENERGIA[L]};--w:${42 + k * 9.5}%;color:${ENERGIA_OSCURO.has(L) ? "#1b1b1b" : "#fff"}` }, h("b", {}, L)),
      h("span", { class: "pn-ee-celda" }, tramite ? null : marca(L, cl, c.consumo_valor)),
      h("span", { class: "pn-ee-celda" }, tramite ? null : marca(L, el, c.emisiones_valor)),
    ]));
  const leyenda = h("div", { class: "pn-ee-leyenda" },
    tramite ? h("p", { class: "pn-ee-badge" }, ic("info", "pn-ic pn-ic-s"), tr("energia.en_tramite")) : [
      cl ? h("p", {}, h("span", { class: "pn-ee-letra", style: `background:${ENERGIA[cl] ?? "#888"};color:${ENERGIA_OSCURO.has(cl) ? "#1b1b1b" : "#fff"}` }, cl),
        h("span", {}, tr("energia.consumo")), c.consumo_valor != null ? h("span", { class: "pn-suave" }, `${fmtNum(c.consumo_valor, 1)} ${tr("energia.unidad_consumo")}`) : null) : null,
      el ? h("p", {}, h("span", { class: "pn-ee-letra", style: `background:${ENERGIA[el] ?? "#888"};color:${ENERGIA_OSCURO.has(el) ? "#1b1b1b" : "#fff"}` }, el),
        h("span", {}, tr("energia.emisiones")), c.emisiones_valor != null ? h("span", { class: "pn-suave" }, `${fmtNum(c.emisiones_valor, 1)} ${tr("energia.unidad_emisiones")}`) : null) : null,
    ]);
  return seccion("energia", tr("energia.titulo"), h("figure", { class: "pn-ee", role: "img", "aria-label": `${tr("energia.titulo")}. ${resumen}` }, escala), leyenda);
}

function descripcion() {
  const txt = R(inm().descripcion);
  if (!txt) return null;
  const largo = txt.length > 320;
  const p = h("div", { class: "pn-desc" + (largo && !ui.descripcionAbierta ? " pn-desc-corta" : ""), id: nuevoId("desc") }, txt.split(/\n{2,}/).map((t) => h("p", {}, t)));
  const btn = largo ? h("button", { type: "button", class: "pn-enlace-btn", "data-k": "leer-mas", "aria-expanded": String(ui.descripcionAbierta), "aria-controls": p.id, onclick: (e) => {
    ui.descripcionAbierta = !ui.descripcionAbierta;
    p.classList.toggle("pn-desc-corta", !ui.descripcionAbierta);
    e.currentTarget.textContent = ui.descripcionAbierta ? tr("ficha.leer_menos") : tr("ficha.leer_mas");
    e.currentTarget.setAttribute("aria-expanded", String(ui.descripcionAbierta));
  } }, ui.descripcionAbierta ? tr("ficha.leer_menos") : tr("ficha.leer_mas")) : null;
  return seccion("desc", tr("ficha.descripcion"), p, btn);
}

function gastos() {
  const i = inm(), filas = [];
  if (i.gastos_comunidad_mes) filas.push([tr("ficha.comunidad"), tr("ficha.al_mes", { x: fmtMoneda(i.gastos_comunidad_mes) })]);
  if (i.ibi_anual) filas.push([tr("ficha.ibi"), tr("ficha.al_ano", { x: fmtMoneda(i.ibi_anual) })]);
  if (!filas.length) return null;
  return seccion("gastos", tr("ficha.gastos"), h("dl", { class: "pn-tabla" }, filas.map(([a, b]) => [h("dt", {}, a), h("dd", {}, b)])));
}

function superficies() {
  const est_ = (T.estancias ?? []).filter((e) => Array.isArray(e.poligono) && e.poligono.length >= 3);
  if (!est_.length) return null;
  const varias = new Set(est_.map((e) => e.planta)).size > 1;
  const nombrePlanta = (id) => R((T.plantas ?? []).find((p) => p.id === id)?.nombre) || id;
  let total = 0;
  const filas = est_.map((e) => {
    const a = areaPoligono(e.poligono); total += a;
    return [h("dt", {}, R(e.nombre) || e.id, varias && e.planta ? h("span", { class: "pn-suave" }, ` · ${nombrePlanta(e.planta)}`) : null), h("dd", {}, `${fmtNum(a, 1)} m²`)];
  });
  return seccion("sup", tr("ficha.superficies"),
    h("dl", { class: "pn-tabla" }, filas, h("dt", { class: "pn-total" }, tr("ficha.total_estancias")), h("dd", { class: "pn-total" }, `${fmtNum(total, 1)} m²`)),
    h("p", { class: "pn-nota" }, tr("ficha.superficie_nota")));
}

function ubicacion() {
  const i = inm();
  const exacta = i.mostrar_direccion_exacta === true;
  const dir = R(i.direccion);
  const zona = R(i.zona) || (dir ? dir.split(",").slice(-1)[0].trim() : "");
  const texto = exacta ? dir : zona;
  const lat0 = numero(i.ubicacion?.lat), lng0 = numero(i.ubicacion?.lng);
  const coord = lat0 != null && lng0 != null && Math.abs(lat0) <= 90 && Math.abs(lng0) <= 180;
  if (!texto && !coord) return null;
  let osm, google;
  if (coord) {
    const lat = exacta ? lat0 : Math.round(lat0 * 100) / 100, lng = exacta ? lng0 : Math.round(lng0 * 100) / 100;
    osm = exacta ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}` : `https://www.openstreetmap.org/#map=15/${lat}/${lng}`;
    google = exacta ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : `https://www.google.com/maps/@${lat},${lng},15z`;
  } else {
    osm = `https://www.openstreetmap.org/search?query=${encodeURIComponent(texto)}`;
    google = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(texto)}`;
  }
  const enlace = (href, txt) => h("a", { class: "pn-btn pn-btn-sec", href, target: "_blank", rel: "noopener noreferrer", "aria-label": `${tr("ficha.ver_mapa")}: ${txt} (${tr("comun.abrir_nueva")})` }, ic("externo", "pn-ic pn-ic-s"), txt);
  return seccion("ubic", tr("ficha.ubicacion"),
    h("p", { class: "pn-ubic" }, ic("pin"), h("span", {}, texto || tr("ficha.zona_aprox"), !exacta ? h("small", { class: "pn-suave pn-bloque" }, tr("ficha.zona_aprox")) : null)),
    h("div", { class: "pn-fila" }, enlace(osm, tr("ficha.osm")), enlace(google, tr("ficha.google"))));
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
  return seccion("agente", tr("ficha.agente"), h("div", { class: "pn-agente" },
    srcSegura(a.foto) ? h("img", { src: srcSegura(a.foto), alt: "", class: "pn-agente-foto", onerror: (e) => e.currentTarget.remove() }) : h("span", { class: "pn-agente-foto pn-agente-ini", "aria-hidden": "true" }, R(a.nombre).split(/\s+/).map((x) => x[0]).slice(0, 2).join("")),
    h("div", {}, h("p", { class: "pn-agente-nombre" }, R(a.nombre)), T.marca?.nombre ? h("p", { class: "pn-suave" }, R(T.marca.nombre)) : null),
    h("div", { class: "pn-agente-acc" },
      telefonoValido(a.telefono) ? h("a", { class: "pn-btn-ic", href: `tel:${String(a.telefono).replace(/[^\d+]/g, "")}`, "aria-label": `${tr("ficha.llamar")} ${a.telefono}`, "data-tip": tr("ficha.llamar") }, ic("tel")) : null,
      emailValido(a.email) ? h("a", { class: "pn-btn-ic", href: `mailto:${a.email.trim()}?subject=${encodeURIComponent(`${R(inm().referencia ?? "")} ${titulo()}`.trim())}`, "aria-label": `${tr("ficha.email")} ${a.email}`, "data-tip": tr("ficha.email") }, ic("correo")) : null)));
}

function avisoLegal() {
  const i = inm(), textos = [];
  if (i.aviso_legal) textos.push(R(i.aviso_legal));
  if (i.estado_obra === "proyecto" && !i.aviso_legal) textos.push(tr("ficha.aviso_proyecto"));
  if ((i.estado_obra === "proyecto" || hayVariantesEstilo()) && !textos.some((t) => /IA|AI|KI/.test(t))) textos.push(tr("ficha.aviso_ia"));
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

// ------------------------------------------------------------------ hipoteca
function hipoteca() {
  const i = inm();
  ui.hip ??= { precio: precioNum(), entrada: 20, interes: numero(i.hipoteca_interes) ?? 3, anos: 30 };
  const s = ui.hip;
  const ids = { p: nuevoId("h"), e: nuevoId("h"), i: nuevoId("h"), a: nuevoId("h") };
  const salida = h("div", { class: "pn-hip-res", "aria-live": "polite" });
  const pintar = () => {
    const financiado = Math.max(0, s.precio * (1 - s.entrada / 100));
    const cuota = cuotaHipoteca(financiado, s.interes, s.anos);
    salida.replaceChildren(
      h("p", { class: "pn-hip-cuota" }, h("span", { class: "pn-suave" }, tr("hipoteca.cuota")), h("strong", { class: "pn-precio pn-precio-m" }, fmtMoneda(cuota) + tr("ficha.mes"))),
      h("dl", { class: "pn-tabla" },
        h("dt", {}, tr("hipoteca.entrada")), h("dd", {}, fmtMoneda(s.precio - financiado)),
        h("dt", {}, tr("hipoteca.financiado")), h("dd", {}, fmtMoneda(financiado)),
        h("dt", {}, tr("hipoteca.intereses")), h("dd", {}, fmtMoneda(Math.max(0, cuota * s.anos * 12 - financiado)))),
      h("p", { class: "pn-nota" }, tr("hipoteca.gastos", { x: fmtMoneda(s.precio * 0.1) })));
    eOut.textContent = `${fmtNum(s.entrada)} %`; aOut.textContent = tr("hipoteca.anos_valor", { x: s.anos });
  };
  const num = (k, v) => { const n = parseFloat(String(v).replace(",", ".")); if (Number.isFinite(n)) { s[k] = n; pintar(); } };
  const eOut = h("output", { for: ids.e, class: "pn-salida" }), aOut = h("output", { for: ids.a, class: "pn-salida" });
  const det = h("details", { class: "pn-hip", "data-k": "hip" },
    h("summary", { "data-k": "hip-sum" }, ic("calc"), h("span", {}, tr("hipoteca.titulo")), ic("der", "pn-ic pn-ic-s pn-chev")),
    h("div", { class: "pn-hip-form" },
      h("label", { for: ids.p }, tr("hipoteca.precio")),
      h("input", { id: ids.p, type: "number", inputmode: "numeric", min: "0", step: "1000", value: String(s.precio), "data-k": "hip-precio", oninput: (e) => num("precio", e.target.value) }),
      h("div", { class: "pn-et-fila" }, h("label", { for: ids.e }, tr("hipoteca.entrada")), eOut),
      h("input", { id: ids.e, type: "range", min: "0", max: "80", step: "1", value: String(s.entrada), "data-k": "hip-entrada", oninput: (e) => num("entrada", e.target.value) }),
      h("label", { for: ids.i }, `${tr("hipoteca.interes")} (%)`),
      h("input", { id: ids.i, type: "number", inputmode: "decimal", min: "0", max: "20", step: "0.05", value: String(s.interes), "data-k": "hip-interes", oninput: (e) => num("interes", e.target.value) }),
      h("div", { class: "pn-et-fila" }, h("label", { for: ids.a }, tr("hipoteca.anos")), aOut),
      h("input", { id: ids.a, type: "range", min: "5", max: "40", step: "1", value: String(s.anos), "data-k": "hip-anos", oninput: (e) => num("anos", e.target.value) })),
    salida);
  pintar();
  return h("section", { class: "pn-sec pn-sec-hip", "aria-label": tr("hipoteca.titulo") }, det);
}

// ------------------------------------------------------------------ contacto: dock (escritorio) y FAB (móvil horizontal)
function urlWebhook() {
  const u = urlSegura(T.contacto?.webhook);
  return u && !/^(mailto|tel):/i.test(u) ? u : null;
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
  let n = String(crudo).trim();
  n = n.replace(/^00/, "+");
  const intl = n.startsWith("+");
  n = n.replace(/\D/g, "");
  if (!intl && n.length === 9 && /^[6789]/.test(n)) n = "34" + n; // número español sin prefijo
  return n.length >= 8 ? n : null;
}

function dockContacto() {
  const wa = ui.disp === "lateral" ? numeroWhatsApp() : null;
  return h("div", { class: "pn-dock" },
    botonContacto("contacto-dock", "pn-dock-btn"),
    wa ? h("a", { class: "pn-btn-ic pn-dock-wa", href: `https://wa.me/${wa}?text=${encodeURIComponent(mensajeRapido())}`, target: "_blank", rel: "noopener noreferrer", "aria-label": `${tr("contacto.whatsapp")} (${tr("comun.abrir_nueva")})`, "data-tip": tr("contacto.whatsapp"), onclick: () => emitirContacto("whatsapp_directo") }, ic("whatsapp")) : null);
}

function mensajeRapido() {
  const i = inm(), marca = R(T.marca?.nombre);
  return [marca ? tr("contacto.msg_saludo", { x: marca }) : null, tr("contacto.msg_interes", { x: i.referencia != null ? R(i.referencia) : titulo() }), enlaceVista()].filter(Boolean).join("\n");
}

// ------------------------------------------------------------------ diálogos
function alternarDialogo(tipo, opener) { if (ui.dialogo === tipo) cerrarDialogo(); else abrirDialogo(tipo, opener); }

function abrirDialogo(tipo, opener) {
  ui.opener = opener ?? document.activeElement;
  ui.dialogo = tipo;
  if (tipo === "contacto") {
    if (!["enviando", "exito", "pegar"].includes(ui.envio.estado)) ui.envio = { estado: "inactivo", error: "" };
    if (!ui.zonaManual || !ui.borrador.zona) ui.borrador.zona = zonaPorDefecto();
  }
  if (ui.disp === "compacta" && tipo !== "personalizar") ui.abierto = false;
  renderizar();
  const d = raiz.querySelector(".pn-dialogo");
  requestAnimationFrame(() => (d?.querySelector("[autofocus]") ?? d?.querySelector(".pn-dlg-tit"))?.focus({ preventScroll: true }));
  if (tipo === "compartir") pintarQR();
}

function cerrarDialogo() {
  if (!ui.dialogo) return;
  const k = ui.opener?.dataset?.k;
  ui.dialogo = null;
  renderizar();
  const destino = (k && raiz.querySelector(`[data-k="${CSS.escape(k)}"]`)) || null;
  destino?.focus({ preventScroll: true });
}

function escape(e) {
  if (!raiz) return;
  if (ui.lightbox) { e.preventDefault(); cerrarLightbox(); return; }
  if (ui.capturando) { e.preventDefault(); salirCaptura(); return; }
  if (ui.dialogo) { e.preventDefault(); cerrarDialogo(); return; }
  const dentro = raiz.contains(document.activeElement);
  if (ui.disp === "hoja" && ui.altura !== "peek" && dentro) { fijarAltura("peek"); raiz.querySelector("[data-k='peek-precio']")?.focus(); return; }
  if (ui.disp !== "hoja" && ui.abierto && dentro) { abrirPanel(false); raiz.querySelector("[data-k='pestana']")?.focus(); }
}

function dialogo() {
  if (!ui.dialogo) return h("div", { class: "pn-dialogo", hidden: true });
  const titId = nuevoId("dlg");
  const cont = { contacto: dlgContacto, compartir: dlgCompartir, personalizar: dlgPersonalizar, ajustes: dlgAjustes, idioma: dlgIdioma }[ui.dialogo];
  const { titulo: tit, cuerpo, icono } = cont();
  return h("section", { class: `pn-dialogo pn-dialogo-${ui.dialogo}`, role: "dialog", "aria-modal": "false", "aria-labelledby": titId },
    h("header", { class: "pn-dlg-cab" },
      icono ? ic(icono) : null,
      h("h2", { id: titId, class: "pn-dlg-tit", tabindex: "-1" }, tit),
      h("button", { type: "button", class: "pn-btn-ic pn-cerrar", "data-k": "cerrar-dlg", "aria-label": tr("comun.cerrar"), onclick: cerrarDialogo }, ic("cerrar"))),
    h("div", { class: "pn-dlg-cuerpo" }, cuerpo));
}

// --- contacto
const MAX_FOTOS = 6;

// Estancias agrupadas para el selector "¿Sobre qué estancia…?": por tour.secciones, si no por planta
function opcionesZona() {
  const nombres = new Map();
  for (const e of T.estancias ?? []) if (e?.id) nombres.set(e.id, { nombre: R(e.nombre) || e.id, planta: e.planta });
  for (const p of panoramas()) if (p?.id && !nombres.has(p.id)) nombres.set(p.id, { nombre: R(p.nombre) || p.id, planta: p.planta });
  const usados = new Set(), nombresUsados = new Set(), grupos = [];
  const opc = (id) => {
    const n = nombres.get(id);
    if (!n || usados.has(id) || nombresUsados.has(n.nombre)) return null;
    usados.add(id); nombresUsados.add(n.nombre);
    return { id, nombre: n.nombre };
  };
  if (T.secciones?.length) {
    for (const s of T.secciones) {
      const o = (s.estancias ?? []).map(opc).filter(Boolean);
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
const slug = (t) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "vista";
function archivosCapturas() {
  return ui.capturas.map((c, i) => new File([c.blob], `foto-${i + 1}-${slug(c.estancia)}.${extension(c.blob.type)}`, { type: c.blob.type || "image/jpeg" }));
}
function puedeCompartirArchivos() {
  try { return ui.capturas.length > 0 && tiene(navigator.canShare) && tiene(navigator.share) && navigator.canShare({ files: archivosCapturas() }); }
  catch { return false; }
}
const puedeCopiarImagen = () => !!(navigator.clipboard?.write && typeof ClipboardItem !== "undefined");
const atajoPegar = () => (esMac() ? "⌘V" : "Ctrl+V");

// --- modo captura: se ocultan los paneles y queda una barra "Encuadra la vista y pulsa Capturar"
function entrarCaptura() {
  ui.capturando = true;
  renderizar();
  requestAnimationFrame(() => raiz.querySelector("[data-k='capturar']")?.focus({ preventScroll: true }));
}
function salirCaptura() {
  ui.capturando = false;
  renderizar();
  requestAnimationFrame(() => raiz.querySelector(".pn-dialogo [data-k='hacer-foto']")?.focus({ preventScroll: true }));
}
const textoNumFotos = (n) => (n === 1 ? tr("contacto.una_foto") : tr("contacto.n_fotos", { x: n }));
function barraCaptura() {
  const n = ui.capturas.length;
  return h("section", { class: "pn-barra-captura", role: "region", "aria-label": tr("contacto.hacer_foto"), "aria-describedby": "pn-bc-ayuda" },
    h("p", { class: "pn-bc-texto", id: "pn-bc-ayuda" }, ic("camara"), h("span", {}, tr("contacto.encuadra"))),
    h("span", { class: "pn-bc-num", "aria-live": "polite" }, textoNumFotos(n)),
    h("div", { class: "pn-bc-botones" },
      h("button", { type: "button", class: "pn-btn pn-bc-capturar", "data-k": "capturar", disabled: n >= MAX_FOTOS, onclick: tomarCaptura },
        h("span", { class: "pn-punto", "aria-hidden": "true" }), tr("contacto.capturar")),
      h("button", { type: "button", class: "pn-btn pn-btn-acento", "data-k": "captura-listo", onclick: salirCaptura }, ic("ok"), tr("contacto.listo"))));
}
// La barra se actualiza en su sitio: sustituirla rompía los clics en curso (p. ej. en «Listo») y repetía la animación
function actualizarBarraCaptura() {
  const barra = raiz?.querySelector(".pn-barra-captura"); if (!barra) return;
  const n = ui.capturas.length;
  barra.querySelector(".pn-bc-num").textContent = textoNumFotos(n);
  const b = barra.querySelector("[data-k='capturar']");
  if (!b) return;
  b.disabled = n >= MAX_FOTOS;
  b.setAttribute("aria-disabled", String(!!ui.tomando));
}

async function tomarCaptura() {
  if (ui.tomando) return;
  if (ui.capturas.length >= MAX_FOTOS) { aviso(tr("contacto.max_fotos", { x: MAX_FOTOS })); return; }
  ui.tomando = true; actualizarBarraCaptura();
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
    ui.capturas.push({ blob: r.blob, url: URL.createObjectURL(r.blob), nodo: r.nodo ?? est().nodo ?? null, estancia: String(estancia), enlace: r.enlace ?? enlaceVista() });
    destello();
    aviso(tr("contacto.capturada", { x: ui.capturas.length }));
  } catch (e) {
    console.warn("Captura", e);
    aviso(tr("contacto.err_captura"));
  } finally { ui.tomando = false; }
  if (ui.capturando) {
    actualizarBarraCaptura();
    colocarHoja(false);
    if (ui.capturas.length >= MAX_FOTOS) raiz.querySelector("[data-k='captura-listo']")?.focus({ preventScroll: true });
  }
}
function destello() {
  const d = h("div", { class: "pn-destello", "aria-hidden": "true" });
  raiz.append(d); setTimeout(() => d.remove(), 450);
}
function quitarFoto(i) {
  const [c] = ui.capturas.splice(i, 1);
  if (c) URL.revokeObjectURL(c.url);
  rehacerDialogo();
  raiz.querySelector(`.pn-dialogo [data-k='quitar-${Math.min(i, ui.capturas.length - 1)}']`)?.focus() ?? raiz.querySelector(".pn-dialogo [data-k='hacer-foto']")?.focus();
}
function vaciarCapturas() { for (const c of ui.capturas) URL.revokeObjectURL(c.url); ui.capturas = []; }

function descargarFotos() {
  ui.capturas.forEach((c, i) => setTimeout(() => {
    const a = h("a", { href: c.url, download: `${slug(R(inm().referencia) || "vista")}-foto-${i + 1}-${slug(c.estancia)}.${extension(c.blob.type)}` });
    document.body.append(a); a.click(); a.remove();
  }, i * 250));
}

async function aPNG(blob) {
  if (blob.type === "image/png") return blob;
  const bmp = await createImageBitmap(blob);
  const c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height;
  c.getContext("2d").drawImage(bmp, 0, 0);
  bmp.close?.();
  return await new Promise((ok, mal) => c.toBlob((b) => (b ? ok(b) : mal(new Error("PNG"))), "image/png"));
}
// Se llama dentro del gesto del usuario: ClipboardItem acepta la promesa del PNG
function copiarFoto(i) {
  const c = ui.capturas[i];
  if (!c || !puedeCopiarImagen()) return Promise.reject(new Error("portapapeles no disponible"));
  return navigator.clipboard.write([new ClipboardItem({ "image/png": aPNG(c.blob) })]);
}
function copiarYMarcar(i) {
  ui.envio = { ...ui.envio, estado: "pegar", indice: i, copiaOk: null, descargadas: false };
  copiarFoto(i).then(() => { ui.envio.copiaOk = true; aviso(tr("contacto.copiada")); }, (e) => { console.warn("Copiar foto", e); ui.envio.copiaOk = false; })
    .finally(() => { if (ui.dialogo === "contacto" && ui.envio.estado === "pegar") rehacerDialogo(); });
}

// Paso intermedio antes de abrir WhatsApp con fotos (wa.me no admite adjuntos): se explica qué va a pasar
function abrirWhatsAppConFotos() {
  const d = datosConsulta();
  if (puedeCopiarImagen()) copiarYMarcar(0);   // antes de abrir la pestaña: aún dentro del gesto del usuario
  else { descargarFotos(); ui.envio = { estado: "pegar", indice: ui.capturas.length - 1, copiaOk: false, descargadas: true }; }
  abrirWhatsApp(d);
  emitirContacto("whatsapp");
  rehacerDialogo();
}

function tiraFotos(actual) {
  return h("ul", { class: "pn-tira pn-tira-s" }, ui.capturas.map((c, i) =>
    h("li", { class: actual < 0 ? "pn-todas" : i === actual ? "pn-actual" : "" }, h("img", { src: c.url, alt: tr("contacto.foto_alt", { n: i + 1, x: c.estancia }) }))));
}

function pantallaExito() {
  const b = ui.borrador, env = ui.envio, nombre = b.nombre.trim().split(/\s+/)[0] ?? "";
  const texto = env.porWhatsapp === "confirmado" ? tr("contacto.exito_wa", { x: nombre })
    : env.porWhatsapp && canalContacto() === "whatsapp" ? tr("contacto.exito_whatsapp") : tr("contacto.exito", { x: nombre });
  return { titulo: tr("contacto.titulo"), icono: "chat", cuerpo: h("div", { class: "pn-estado pn-estado-ok", role: "status" },
    h("span", { class: "pn-estado-ic" }, ic("ok")), h("p", {}, texto), botonOtra()) };
}
function botonOtra() {
  return h("button", { type: "button", class: "pn-btn pn-btn-sec", "data-k": "otra", autofocus: true, onclick: () => {
    ui.envio = { estado: "inactivo" }; ui.borrador.pregunta = ""; ui.tocados = new Set(); vaciarCapturas(); rehacerDialogo();
    raiz.querySelector(".pn-dialogo [data-k='c-pregunta']")?.focus();
  } }, tr("contacto.otra"));
}

function pantallaPreparar() {
  const total = ui.capturas.length, copiar = puedeCopiarImagen();
  const marca = R(T.marca?.nombre) || R(T.agente?.nombre) || "WhatsApp";
  const paso3 = !copiar ? tr("contacto.wa_paso3_adjuntar") : esTactil() ? tr("contacto.wa_paso3_tactil") : tr("contacto.wa_paso3_teclado", { x: atajoPegar() });
  return { titulo: tr("contacto.wa_titulo"), icono: "whatsapp", cuerpo: h("div", { class: "pn-estado pn-estado-pegar" },
    tiraFotos(-1),
    h("ol", { class: "pn-pasos", "aria-label": tr("contacto.pasos") },
      h("li", {}, !copiar ? tr("contacto.wa_paso1_descarga") : total > 1 ? tr("contacto.wa_paso1_varias", { x: total }) : tr("contacto.wa_paso1")),
      h("li", {}, tr("contacto.wa_paso2", { x: marca })),
      h("li", {}, paso3)),
    copiar && total > 1 ? h("p", { class: "pn-nota" }, tr("contacto.wa_mas_fotos")) : null,
    h("button", { type: "button", class: "pn-btn pn-btn-acento pn-btn-ancho", "data-k": "abrir-wa", autofocus: true, onclick: abrirWhatsAppConFotos }, ic("whatsapp"), tr("contacto.wa_abrir")),
    h("button", { type: "button", class: "pn-enlace-btn", "data-k": "volver-form", onclick: () => {
      ui.envio = { estado: "inactivo" }; rehacerDialogo(); raiz.querySelector(".pn-dialogo [data-k='enviar']")?.focus();
    } }, tr("contacto.volver_form"))) };
}

function pantallaPegar() {
  const env = ui.envio, total = ui.capturas.length, n = env.indice + 1;
  const fallo = env.copiaOk === false && !env.descargadas;
  const estado = env.descargadas ? tr("contacto.descargadas") : fallo ? tr("contacto.copia_fallida")
    : env.copiaOk ? tr("contacto.copiada_n", { n, total }) : tr("contacto.copiando");
  const instruccion = esTactil() ? tr("contacto.wa_paso3_tactil") : tr("contacto.wa_paso3_teclado", { x: atajoPegar() });
  const boton = (k, primario, icono, texto, onclick) => h("button", { type: "button", "data-k": k, autofocus: primario || null, onclick,
    class: primario ? "pn-btn pn-btn-acento pn-btn-ancho" : "pn-btn pn-btn-sec" }, ic(icono), texto);
  const terminar = (primario) => boton("terminado", primario, "ok", tr("contacto.terminado"), () => {
    ui.envio = { estado: "exito", porWhatsapp: "confirmado" }; rehacerDialogo();
  });
  const descargar = (primario) => boton("descargar-fotos", primario, "descargar", tr("contacto.descargar_fotos"), descargarFotos);
  const reabrir = boton("reabrir-wa", false, "whatsapp", tr("contacto.abrir_whatsapp"), () => abrirWhatsApp(datosConsulta()));
  // Un solo botón principal por pantalla
  let principal, otros;
  if (fallo) { principal = descargar(true); otros = [reabrir, terminar(false)]; }
  else if (!env.descargadas && n < total) {
    principal = boton("copiar-siguiente", true, "copiar", tr("contacto.copiar_siguiente", { n: n + 1, total }), () => copiarYMarcar(env.indice + 1));
    otros = [reabrir, descargar(false)];
  } else { principal = terminar(true); otros = [reabrir, env.descargadas ? null : descargar(false)]; }
  return { titulo: tr("contacto.pegar_titulo"), icono: "whatsapp", cuerpo: h("div", { class: "pn-estado pn-estado-pegar" },
    tiraFotos(env.descargadas ? -1 : env.indice),
    h("p", { class: fallo ? "pn-aviso" : "pn-guia", role: "status" }, ic(fallo ? "alerta" : env.copiaOk || env.descargadas ? "ok" : "info", "pn-ic pn-ic-s"), h("span", {}, estado)),
    fallo || env.descargadas ? null : h("p", { class: "pn-guia" }, ic("info", "pn-ic pn-ic-s"), h("span", {}, instruccion)),
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
    if (!p) { p = h("p", { class: "pn-error", id: idErr }); caja.append(p); }
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
  if (env.estado === "preparar") return pantallaPreparar();
  if (env.estado === "pegar") return pantallaPegar();
  const b = ui.borrador, canal = canalContacto();
  const marca = R(T.marca?.nombre) || R(T.agente?.nombre) || "—";
  const ids = { n: nuevoId("c"), t: nuevoId("c"), p: nuevoId("c"), v: nuevoId("c"), rg: nuevoId("c"), z: nuevoId("c"), f: nuevoId("c") };
  const err = env.campos ?? {};
  const desc = (id, k, extra) => [extra, err[k] ? `${id}-e` : null].filter(Boolean).join(" ") || null;
  const campo = (k, id, etiqueta, control, clase = "") => h("div", { class: `pn-campo ${clase}`.trim() + (err[k] ? " pn-invalido" : "") },
    h("label", { for: id }, etiqueta), control,
    err[k] ? h("p", { class: "pn-error", id: `${id}-e` }, ic("alerta", "pn-ic pn-ic-s"), err[k]) : null);
  const enviando = env.estado === "enviando";
  const fino = !esTactil();
  // 1) estancia o zona (con la actual preseleccionada)
  const grupos = opcionesZona();
  const zona = h("span", { class: "pn-select" }, h("select", { id: ids.z, name: "zona", "data-k": "c-zona", autofocus: fino || null,
    onchange: (e) => { ui.borrador.zona = e.target.value; ui.zonaManual = true; } },
    h("option", { value: "general", selected: b.zona === "general" }, tr("contacto.zona_general")),
    grupos.map((g) => {
      const ops = g.opciones.map((o) => h("option", { value: o.id, selected: b.zona === o.id }, o.nombre));
      return g.nombre ? h("optgroup", { label: g.nombre }, ops) : ops;
    })));
  // 2) fotos de la vista, justo debajo (visibles sin desplazar)
  const nf = ui.capturas.length;
  const fotos = h("div", { class: "pn-campo pn-fotos", role: "group", "aria-labelledby": ids.f },
    h("div", { class: "pn-et-fila" }, h("span", { class: "pn-et", id: ids.f }, tr("contacto.fotos")), nf ? h("span", { class: "pn-salida" }, textoNumFotos(nf)) : null),
    nf ? h("ul", { class: "pn-tira" }, ui.capturas.map((c, i) => h("li", {},
      h("img", { src: c.url, alt: tr("contacto.foto_alt", { n: i + 1, x: c.estancia }) }),
      h("span", { class: "pn-tira-et", "aria-hidden": "true" }, c.estancia),
      h("button", { type: "button", class: "pn-quitar", "data-k": `quitar-${i}`, "aria-label": tr("contacto.quitar_foto", { x: `${i + 1} (${c.estancia})` }), onclick: () => quitarFoto(i) }, ic("cerrar", "pn-ic pn-ic-s"))))) : null,
    h("button", { type: "button", class: "pn-btn pn-btn-sec", "data-k": "hacer-foto", disabled: nf >= MAX_FOTOS || !(tiene(V.capturar) || V.lienzo?.toBlob), onclick: entrarCaptura }, ic("camara"), tr("contacto.hacer_foto")),
    nf ? null : h("p", { class: "pn-nota" }, tr("contacto.fotos_nota")));
  // 3) pregunta con sugerencias
  const pregunta = h("textarea", { id: ids.p, name: "pregunta", rows: "3", "data-k": "c-pregunta", placeholder: tr("contacto.pregunta_ph"), required: true, value: b.pregunta,
    "aria-invalid": err.pregunta ? "true" : null, "aria-describedby": desc(ids.p, "pregunta"), oninput: alEscribir("pregunta"), onblur: alSalir("pregunta") });
  const chips = ["contacto.sug_disponible", "contacto.sug_visita", "contacto.sug_financiacion"].map((k) =>
    h("button", { type: "button", class: "pn-chip pn-chip-s", "data-k": `sug-${k}`, onclick: () => {
      const t = tr(k); const actual = pregunta.value.trim();
      pregunta.value = actual.includes(t) ? actual : actual ? `${actual} ${t}` : t;
      ui.borrador.pregunta = pregunta.value; ui.tocados.add("pregunta");
      if (ui.envio.campos?.pregunta) errorCampo("pregunta", null);
      pregunta.focus();
    } }, tr(k)));
  // 4) datos de contacto
  const nombre = h("input", { id: ids.n, name: "nombre", type: "text", autocomplete: "name", required: true, "data-k": "c-nombre", value: b.nombre,
    "aria-invalid": err.nombre ? "true" : null, "aria-describedby": desc(ids.n, "nombre"), oninput: alEscribir("nombre"), onblur: alSalir("nombre") });
  const telefono = h("input", { id: ids.t, name: "telefono", type: "tel", inputmode: "tel", autocomplete: "tel", required: true, "data-k": "c-telefono", placeholder: "+34 600 123 456", value: b.telefono,
    "aria-invalid": err.telefono ? "true" : null, "aria-describedby": desc(ids.t, "telefono"), oninput: alEscribir("telefono"), onblur: alSalir("telefono") });
  const urlPriv = urlSegura(T.contacto?.url_privacidad);
  const viaWhatsApp = canal === "whatsapp";
  const form = h("form", { class: "pn-form", novalidate: true, onsubmit: (e) => { e.preventDefault(); enviarContacto(e.currentTarget); } },
    campo("zona", ids.z, tr("contacto.zona"), zona),
    fotos,
    campo("pregunta", ids.p, tr("contacto.pregunta"), [h("div", { class: "pn-chips", role: "group", "aria-label": tr("contacto.sugerencias") }, chips), pregunta]),
    h("div", { class: "pn-fila-datos" },
      campo("nombre", ids.n, tr("contacto.nombre"), nombre),
      campo("telefono", ids.t, tr("contacto.telefono"), telefono)),
    h("div", { class: "pn-campo pn-check" + (err.privacidad ? " pn-invalido" : "") },
      h("input", { id: ids.v, name: "privacidad", type: "checkbox", required: true, checked: b.privacidad, "data-k": "c-priv",
        "aria-describedby": desc(ids.v, "privacidad", ids.rg), "aria-invalid": err.privacidad ? "true" : null,
        onchange: (e) => {
          ui.borrador.privacidad = e.target.checked; ui.tocados.add("privacidad");
          errorCampo("privacidad", e.target.checked || !ui.envio.intentado ? null : VALIDAR.privacidad(false));
        } }),
      h("label", { for: ids.v }, tr("contacto.acepto"), " ",
        urlPriv ? h("a", { href: urlPriv, target: "_blank", rel: "noopener noreferrer" }, tr("contacto.politica")) : tr("contacto.politica")),
      err.privacidad ? h("p", { class: "pn-error", id: `${ids.v}-e` }, ic("alerta", "pn-ic pn-ic-s"), err.privacidad) : null),
    h("p", { class: "pn-rgpd", id: ids.rg }, R(T.contacto?.texto_privacidad) || tr("contacto.rgpd", { x: marca })),
    env.estado === "error" ? h("div", { class: "pn-estado pn-estado-error", role: "alert" },
      h("p", {}, ic("alerta", "pn-ic pn-ic-s"), env.error),
      numeroWhatsApp() ? h("p", { class: "pn-suave" }, tr("contacto.alternativa")) : null,
      h("div", { class: "pn-fila" },
        h("button", { type: "submit", class: "pn-btn pn-btn-sec", "data-k": "reintentar" }, tr("comun.reintentar")),
        numeroWhatsApp() ? h("button", { type: "button", class: "pn-btn pn-btn-wa", "data-k": "enviar-wa", onclick: (e) => enviarContacto(e.currentTarget.form, "whatsapp") }, ic("whatsapp"), tr("contacto.enviar_whatsapp")) : null)) : null,
    viaWhatsApp && nf && puedeCompartirArchivos() ? h("p", { class: "pn-nota pn-guia" }, ic("info", "pn-ic pn-ic-s"), h("span", {}, tr("contacto.elige_chat", { x: marca }))) : null,
    env.estado === "error" ? null : h("button", { type: "submit", class: "pn-btn pn-btn-acento pn-btn-ancho", "data-k": "enviar", disabled: enviando, "aria-busy": enviando ? "true" : null },
      enviando ? h("span", { class: "pn-giro", "aria-hidden": "true" }) : ic(viaWhatsApp ? "whatsapp" : "chat"),
      enviando ? tr("contacto.enviando") : viaWhatsApp ? tr("contacto.enviar_whatsapp") : tr("contacto.enviar")),
    h("p", { class: "pn-nota pn-centro" }, tr("contacto.subtitulo")),
  );
  return { titulo: tr("contacto.titulo"), icono: "chat", cuerpo: [agenteMini(), form] };
}

function agenteMini() {
  const a = T.agente; if (!a?.nombre) return null;
  const foto = srcSegura(a.foto);
  return h("div", { class: "pn-agente pn-agente-mini" },
    foto ? h("img", { src: foto, alt: "", class: "pn-agente-foto", onerror: (e) => e.currentTarget.remove() }) : null,
    h("div", {}, h("p", { class: "pn-agente-nombre" }, R(a.nombre)), h("p", { class: "pn-suave" }, [R(T.marca?.nombre), inm().referencia ? tr("ficha.referencia", { x: R(inm().referencia) }) : null].filter(Boolean).join(" · "))));
}

function datosConsulta() {
  const b = ui.borrador;
  return {
    nombre: b.nombre.trim(), telefono: b.telefono.trim(), pregunta: b.pregunta.trim(),
    referencia: inm().referencia != null ? R(inm().referencia) : null,
    estancia: nombreZona(b.zona), estancia_id: b.zona ?? "general", estancia_actual: nombreEstancia() || est().nodo || null,
    url: enlaceVista(), fecha: new Date().toISOString(), idioma: idiomaActual(), num_fotos: ui.capturas.length,
  };
}

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
    ...ui.capturas.map((c, i) => `${tr("contacto.msg_foto", { n: i + 1, x: c.estancia })}: ${c.enlace}`),
    `*${tr("contacto.msg_vista")}:* ${d.url}`,
  ].filter((x) => x != null).join("\n");
}

function abrirWhatsApp(d) {
  const n = numeroWhatsApp(); if (!n) return false;
  window.open(`https://wa.me/${n}?text=${encodeURIComponent(mensajeWhatsApp(d))}`, "_blank", "noopener");
  return true;
}

function emitirContacto(canal) {
  const detalle = { canal, referencia: inm().referencia != null ? R(inm().referencia) : null, estancia: est().nodo ?? null, fotos: ui.capturas.length };
  // Sin datos personales: este evento puede acabar en window.dataLayer (analítica)
  if (tiene(V.emitir)) { try { V.emitir("contacto", detalle); } catch (e) { console.warn(e); } }
  else window.dispatchEvent(new CustomEvent("visor:contacto", { detail: detalle }));
}

// WhatsApp con fotos: (a) hoja de compartir del sistema con los archivos; (b) paso intermedio + foto en el portapapeles
function enviarWhatsApp(d) {
  if (ui.capturas.length && puedeCompartirArchivos()) {
    navigator.share({ files: archivosCapturas(), text: mensajeWhatsApp(d) }).then(() => {
      emitirContacto("whatsapp_compartir");
      ui.envio = { estado: "exito", porWhatsapp: true }; rehacerDialogo();
    }, (e) => {
      if (e?.name === "AbortError") return; // el usuario cerró la hoja de compartir
      console.warn("share", e);
      ui.envio = { estado: "preparar" }; rehacerDialogo();
    });
    return;
  }
  if (ui.capturas.length) { ui.envio = { estado: "preparar" }; rehacerDialogo(); return; }
  abrirWhatsApp(d); emitirContacto("whatsapp");
  ui.envio = { estado: "exito", porWhatsapp: true }; rehacerDialogo();
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
  guardarLS(CLAVE_CONTACTO, { nombre: ui.borrador.nombre.trim(), telefono: ui.borrador.telefono.trim() });
  const d = datosConsulta();
  const canal = forzar ?? canalContacto();

  // Todo lo que abre ventanas, comparte o copia va antes del primer await (gesto del usuario)
  if (canal === "whatsapp") { enviarWhatsApp(d); return; }
  if (canal === "email") {
    const a = T.agente?.email;
    location.href = `mailto:${a}?subject=${encodeURIComponent(tr("contacto.titulo") + (d.referencia ? ` · ${d.referencia}` : ""))}&body=${encodeURIComponent(mensajeWhatsApp(d).replace(/\*/g, ""))}`;
    emitirContacto("email"); ui.envio = { estado: "exito" }; rehacerDialogo(); return;
  }
  // "ambos": WhatsApp se abre ya con el texto (las fotos llegan por el webhook)
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
  } catch (e) {
    console.warn("Contacto: error en el webhook", e);
    ui.envio = { estado: "error", error: navigator.onLine === false ? tr("contacto.sin_conexion") : tr("contacto.error") };
  } finally { clearTimeout(temporizador); }
  if (ui.dialogo === "contacto") {
    rehacerDialogo();
    raiz.querySelector(ui.envio.estado === "exito" ? ".pn-dialogo [data-k='otra']" : ".pn-dialogo [data-k='reintentar']")?.focus();
  }
}

// --- galería de renders y planos (lightbox)
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
      h("button", { type: "button", class: "pn-chip pn-chip-s", "data-k": `gal-${k}`, "aria-pressed": String(k === f), onclick: () => {
        ui.filtroGaleria = k; const nueva = galeriaRenders(); sec.replaceWith(nueva); nueva.querySelector(`[data-k="gal-${CSS.escape(k)}"]`)?.focus();
      } }, et))) : null,
    h("ul", { class: "pn-galeria" + (visibles.length >= 3 && (visibles.length - 3) % 3 === 0 ? " pn-galeria-destacada" : "") }, visibles.map((g, i) => h("li", {},
      h("button", { type: "button", class: "pn-gal-btn", "data-k": `gal-item-${i}`, "aria-label": tr("galeria.ampliar", { x: R(g.titulo) || nombreTipo(g.tipo) || String(i + 1) }), onclick: (e) => abrirLightbox(visibles, i, e.currentTarget) },
        h("img", { src: srcSegura(g.miniatura) ?? srcSegura(g.imagen), alt: "", loading: "lazy", decoding: "async" }),
        g.tipo === "render" ? h("span", { class: "pn-gal-tipo", "aria-hidden": "true" }, "Render") : null)))));
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
  const caja = h("div", { class: "pn-lb", role: "dialog", "aria-modal": "true", "aria-label": tr("galeria.visor"), "aria-describedby": titId,
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
    varias ? h("button", { type: "button", class: "pn-btn-ic pn-lb-ant", "data-k": "lb-ant", "aria-label": tr("galeria.anterior"), onclick: () => moverLightbox(-1) }, ic("izq")) : null,
    varias ? h("button", { type: "button", class: "pn-btn-ic pn-lb-sig", "data-k": "lb-sig", "aria-label": tr("galeria.siguiente"), onclick: () => moverLightbox(1) }, ic("der")) : null,
    h("button", { type: "button", class: "pn-btn-ic pn-lb-cerrar", "data-k": "lb-cerrar", "aria-label": tr("comun.cerrar"), onclick: cerrarLightbox }, ic("cerrar")));
  return caja;
}

// --- compartir
function dlgCompartir() {
  const url = enlaceVista();
  const msg = tr("compartir.mensaje", { x: titulo() });
  if (!url) return { titulo: tr("compartir.titulo"), icono: "compartir", cuerpo: [h("p", { class: "pn-suave", "data-k": "sh-sin-web" }, tr("compartir.sin_web"))] };
  const idInput = nuevoId("enl");
  const copiar = async (e) => {
    const btn = e.currentTarget;
    let ok = false;
    try { await navigator.clipboard.writeText(url); ok = true; } catch {
      const inp = raiz.querySelector(`#${idInput}`); inp?.select(); try { ok = document.execCommand("copy"); } catch {}
    }
    if (ok) { aviso(tr("compartir.copiado")); btn.classList.add("pn-hecho"); btn.querySelector("span").textContent = tr("compartir.copiado"); }
  };
  const botones = [
    h("a", { class: "pn-btn pn-btn-sec", "data-k": "sh-wa", href: `https://wa.me/?text=${encodeURIComponent(`${msg}\n${url}`)}`, target: "_blank", rel: "noopener" }, ic("whatsapp"), h("span", {}, tr("compartir.whatsapp"))),
    h("a", { class: "pn-btn pn-btn-sec", "data-k": "sh-mail", href: `mailto:?subject=${encodeURIComponent(titulo())}&body=${encodeURIComponent(`${msg}\n${url}`)}` }, ic("correo"), h("span", {}, tr("compartir.email"))),
    tiene(navigator.share) ? h("button", { type: "button", class: "pn-btn pn-btn-sec", "data-k": "sh-mas", onclick: () => navigator.share({ title: titulo(), text: msg, url }).catch(() => {}) }, ic("compartir"), h("span", {}, tr("compartir.mas"))) : null,
  ];
  return { titulo: tr("compartir.titulo"), icono: "compartir", cuerpo: [
    h("label", { for: idInput, class: "pn-et" }, tr("compartir.enlace")),
    h("div", { class: "pn-copiar" },
      h("input", { id: idInput, type: "text", readonly: true, value: url, onfocus: (e) => e.target.select() }),
      h("button", { type: "button", class: "pn-btn pn-btn-acento", "data-k": "copiar", autofocus: true, onclick: copiar }, ic("copiar"), h("span", {}, tr("compartir.copiar")))),
    h("div", { class: "pn-fila pn-fila-sh" }, botones),
    h("div", { class: "pn-qr", "data-url": url },
      h("div", { class: "pn-qr-img", role: "img", "aria-label": tr("compartir.qr_alt") }, h("span", { class: "pn-giro", "aria-hidden": "true" })),
      h("div", { class: "pn-qr-txt" }, h("p", { class: "pn-qr-tit" }, ic("ficha", "pn-ic pn-ic-s"), tr("compartir.qr")), h("p", { class: "pn-suave" }, tr("compartir.qr_nota")),
        h("a", { class: "pn-btn pn-btn-sec", "data-k": "qr-desc", hidden: true, download: `qr-${slug(R(inm().referencia) || "vista")}.svg` }, ic("descargar"), h("span", {}, tr("compartir.descargar_qr"))))),
  ] };
}

let moduloQR = null;
async function pintarQR() {
  const caja = raiz.querySelector(".pn-qr"); if (!caja) return;
  const url = caja.dataset.url;
  try {
    moduloQR ??= import(new URL("./vendor/qr.js", import.meta.url).href);
    const { qrSVG } = await moduloQR;
    const svg = qrSVG(url, { margen: 2 });
    if (typeof svg !== "string" || !svg.includes("<svg")) throw new Error("QR vacío");
    const img = caja.querySelector(".pn-qr-img");
    const tpl = document.createElement("template"); tpl.innerHTML = svg.trim();
    const el = tpl.content.querySelector("svg"); el?.setAttribute("aria-hidden", "true");
    img.replaceChildren(el ?? "");
    const a = caja.querySelector("[data-k='qr-desc']");
    if (a) { URL.revokeObjectURL(a.href); a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); a.hidden = false; }
  } catch (e) {
    console.warn("QR no disponible", e);
    moduloQR = null;
    caja.hidden = true; // solo queda el enlace
  }
}

// --- personalizar
function dlgPersonalizar() {
  const e = est(), partes = [];
  const estilos = listaEstilos();
  if (estilos.length > 1) {
    const actual = e.estilo ?? "original";
    const disp = estiloDisponible(actual);
    partes.push(h("fieldset", { class: "pn-grupo" },
      h("legend", {}, tr("estilos.titulo")),
      h("div", { class: "pn-estilos" }, estilos.map((st) => {
        const enNodo = st.id === "original" || !nodoActual() || (nodoActual().variantes ?? []).some((v) => v.estilo === st.id);
        const muestras = MUESTRAS_ESTILO[st.id] ?? ["#ccc", "#888", "#444"];
        return h("button", { type: "button", class: "pn-estilo" + (enNodo ? "" : " pn-no-aqui"), "data-k": `estilo-${st.id}`, "aria-pressed": String(actual === st.id),
          title: enNodo ? null : tr("estilos.no_disponible"),
          onclick: () => { try { V.fijarEstilo?.(st.id); } catch (er) { console.warn(er); } if (!V.on) { V.estado && (V.estado.estilo = st.id); refrescar(); } } },
          srcSegura(st.miniatura) ? h("img", { src: srcSegura(st.miniatura), alt: "", class: "pn-estilo-mini" }) : h("span", { class: "pn-estilo-muestra", "aria-hidden": "true" }, muestras.map((c) => h("i", { style: `background:${c}` }))),
          h("span", { class: "pn-estilo-nombre" }, nombreEstilo(st)));
      })),
      !disp ? h("p", { class: "pn-aviso", role: "status" }, ic("info", "pn-ic pn-ic-s"), tr("estilos.no_disponible")) : null,
      actual !== "original" && disp ? h("p", { class: "pn-nota" }, tr("ficha.aviso_ia")) : null));
  }
  const momentos = listaMomentos();
  if (momentos.length && tiene(V.fijarMomento)) {
    const actual = e.momento ?? "dia";
    const iconos = { dia: "sol", atardecer: "atardecer", noche: "luna" };
    partes.push(h("fieldset", { class: "pn-grupo" },
      h("legend", {}, tr("momento.titulo"), e.momentoSimulado === true && actual !== "dia" ? h("span", { class: "pn-suave" }, ` ${tr("momento.simulado")}`) : null),
      h("div", { class: "pn-segmentado", role: "radiogroup", "aria-label": tr("momento.titulo") }, momentos.map((m) =>
        h("button", { type: "button", role: "radio", "aria-checked": String(actual === m), tabindex: actual === m ? "0" : "-1", "data-k": `momento-${m}`,
          onclick: () => { try { V.fijarMomento(m); } catch (er) { console.warn(er); } },
          onkeydown: (ev) => moverRadio(ev, momentos.map((x) => `momento-${x}`)) },
          ic(iconos[m] ?? "sol"), h("span", {}, tr(`momento.${m}`)))))));
  }
  if (hayPintura() && tiene(V.fijarPintura)) {
    const pint = e.pintura ?? {};
    const dispo = e.pinturaDisponible !== false;
    const grupo = (k, etiqueta) => {
      const lista = T.personalizacion[k] ?? [];
      if (!lista.length) return null;
      const idColor = nuevoId("col");
      const fijar = (color) => { try { V.fijarPintura({ ...pint, [k]: color }); } catch (er) { console.warn(er); } };
      return h("div", { class: "pn-pintura" },
        h("p", { class: "pn-et", id: `${idColor}-t` }, etiqueta),
        h("div", { class: "pn-muestras", role: "group", "aria-labelledby": `${idColor}-t` },
          lista.map((m) => h("button", { type: "button", class: "pn-muestra", "data-k": `${k}-${m.color}`, style: `--m:${m.color}`, disabled: !dispo,
            "aria-pressed": String((pint[k] ?? "").toLowerCase() === m.color.toLowerCase()), "aria-label": R(m.nombre) || m.color, "data-tip": R(m.nombre) || m.color, onclick: () => fijar(m.color) })),
          h("label", { class: "pn-muestra pn-muestra-libre", title: tr("pintura.libre") },
            h("span", { class: "pn-sr" }, `${tr("pintura.libre")} (${etiqueta})`),
            h("input", { type: "color", "data-k": `${k}-libre`, disabled: !dispo, value: /^#[0-9a-f]{6}$/i.test(pint[k] ?? "") ? pint[k] : lista[0].color, onchange: (ev) => fijar(ev.target.value) }))));
    };
    partes.push(h("fieldset", { class: "pn-grupo", disabled: !dispo },
      h("legend", {}, tr("pintura.titulo")),
      !dispo ? h("p", { class: "pn-aviso", role: "status" }, ic("info", "pn-ic pn-ic-s"), tr("pintura.no_disponible")) : null,
      grupo("paredes", tr("pintura.paredes")), grupo("suelos", tr("pintura.suelos")),
      h("button", { type: "button", class: "pn-enlace-btn", "data-k": "pintura-reset", disabled: !dispo || (!pint.paredes && !pint.suelos), onclick: () => { try { V.fijarPintura({ paredes: null, suelos: null }); } catch (er) { console.warn(er); } } }, tr("pintura.restablecer"))));
  }
  if (tiene(V.comparar) && partes.length) {
    const on = !!e.comparar;
    partes.push(h("div", { class: "pn-grupo pn-interruptor-fila" },
      h("button", { type: "button", role: "switch", class: "pn-interruptor", "aria-checked": String(on), "data-k": "comparar", "aria-describedby": "pn-comparar-nota",
        onclick: () => { try { V.comparar(!on); } catch (er) { console.warn(er); } if (V.estado) V.estado.comparar = !on; rehacerDialogo(); } },
        h("span", { class: "pn-int-pista", "aria-hidden": "true" }, h("span")), ic("comparar"), h("span", {}, tr("comparar.titulo"))),
      h("p", { class: "pn-nota", id: "pn-comparar-nota" }, tr("comparar.nota"))));
  }
  return { titulo: tr("personalizar.titulo"), icono: "pincel", cuerpo: partes };
}

function moverRadio(ev, claves) {
  const i = claves.indexOf(ev.currentTarget.dataset.k);
  const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
  if (d == null) return;
  ev.preventDefault();
  const sig = raiz.querySelector(`[data-k="${claves[(i + d + claves.length) % claves.length]}"]`);
  sig?.focus(); sig?.click();
}

// --- ajustes
function dlgAjustes() {
  const a = ui.ajustes ?? cargarAjustes();
  const ids = { r: nuevoId("a"), t: nuevoId("a"), i: nuevoId("a"), m: nuevoId("a") };
  const cambiar = (k, v) => { aplicarAjustes({ ...ui.ajustes, [k]: v }); };
  const deslizador = (k, id, etiqueta) => {
    const out = h("output", { for: id, class: "pn-salida" }, `${fmtNum(a[k], 1)}×`);
    return h("div", { class: "pn-campo" },
      h("div", { class: "pn-et-fila" }, h("label", { for: id }, etiqueta), out),
      h("input", { id, type: "range", min: "0.5", max: "2", step: "0.1", value: String(a[k]), "data-k": `aj-${k}`, oninput: (e) => { out.textContent = `${fmtNum(+e.target.value, 1)}×`; cambiar(k, +e.target.value); } }));
  };
  const casilla = (k, id, etiqueta, nota) => h("div", { class: "pn-campo pn-check" },
    h("input", { id, type: "checkbox", checked: !!a[k], "data-k": `aj-${k}`, onchange: (e) => cambiar(k, e.target.checked) }),
    h("label", { for: id }, etiqueta, nota ? h("small", { class: "pn-suave pn-bloque" }, nota) : null));
  return { titulo: tr("ajustes.titulo"), icono: "ajustes", cuerpo: [
    deslizador("sensibilidad", ids.r, tr("ajustes.sens_raton")),
    deslizador("sensibilidadTactil", ids.t, tr("ajustes.sens_tactil")),
    casilla("invertirY", ids.i, tr("ajustes.invertir_y")),
    casilla("reducirMovimiento", ids.m, tr("ajustes.reducir_movimiento"), tr("ajustes.reducir_nota")),
    filaMusica(),
    ui.disp === "compacta" && idiomasOfrecidos().length > 1 ? selectorIdioma() : null,
    h("button", { type: "button", class: "pn-enlace-btn", "data-k": "aj-reset", onclick: () => { aplicarAjustes(AJUSTES_BASE()); rehacerDialogo(); } }, tr("ajustes.restablecer")),
  ] };
}

// Música del proyecto (visor.sonido): interruptor y volumen, sincronizados con el botón del núcleo
function filaMusica() {
  const s = V?.sonido;
  if (!s?.disponible) return null;
  const id = nuevoId("vol"), vol = Math.round((Number(s.volumen) || 0) * 100);
  return h("div", { class: "pn-grupo pn-musica" },
    h("button", { type: "button", role: "switch", class: "pn-interruptor", "aria-checked": String(!!s.activo), "data-k": "aj-musica",
      onclick: () => { try { V.sonido.alternar(); } catch (e) { console.warn(e); } pintarSonido(); } },
      h("span", { class: "pn-int-pista", "aria-hidden": "true" }, h("span")), ic("musica"), h("span", {}, tr("sonido.musica"))),
    h("div", { class: "pn-campo" },
      h("div", { class: "pn-et-fila" }, h("label", { for: id }, tr("sonido.volumen")), h("output", { for: id, class: "pn-salida", "data-k": "aj-vol-txt" }, `${fmtNum(vol)} %`)),
      h("input", { id, type: "range", min: "0", max: "100", step: "5", value: String(vol), "data-k": "aj-volumen",
        oninput: (e) => { try { V.sonido.fijarVolumen(+e.target.value / 100); } catch (er) { console.warn(er); } pintarSonido(); } })));
}
function pintarSonido() {
  const s = V?.sonido;
  if (!raiz || !s || ui.dialogo !== "ajustes") return;
  const sw = raiz.querySelector("[data-k='aj-musica']");
  if (!sw) { if (s.disponible) rehacerDialogo(); return; } // la música terminó de cargar con Ajustes abierto
  sw.setAttribute("aria-checked", String(!!s.activo));
  const r = raiz.querySelector("[data-k='aj-volumen']"), txt = raiz.querySelector("[data-k='aj-vol-txt']");
  const vol = document.activeElement === r ? +r.value : Math.round((Number(s.volumen) || 0) * 100);
  if (r && document.activeElement !== r) r.value = String(vol);
  if (txt) txt.textContent = `${fmtNum(vol)} %`;
}

// --- idioma
function selectorIdioma() {
  const lista = idiomasOfrecidos();
  return h("fieldset", { class: "pn-grupo" }, h("legend", {}, tr("idioma.titulo")),
    h("div", { class: "pn-idiomas", role: "radiogroup", "aria-label": tr("idioma.titulo") }, lista.map((c) =>
      h("button", { type: "button", role: "radio", lang: c, "aria-checked": String(c === idiomaActual()), tabindex: c === idiomaActual() ? "0" : "-1", "data-k": `idioma-${c}`,
        onkeydown: (ev) => moverRadio(ev, lista.map((x) => `idioma-${x}`)),
        onclick: () => cambiarIdioma(c) }, h("span", { class: "pn-idioma-cod", "aria-hidden": "true" }, c.toUpperCase()), nombreIdioma(c)))));
}
function dlgIdioma() { return { titulo: tr("idioma.titulo"), icono: "globo", cuerpo: selectorIdioma() }; }

function cambiarIdioma(c) {
  if (c === idiomaActual()) return;
  fijarIdioma(c); // dispara renderizar() vía alCambiarIdioma
  try { V.idioma?.(c); } catch (e) { console.warn(e); }
  raiz.querySelector(`[data-k="idioma-${c}"]`)?.focus();
}
