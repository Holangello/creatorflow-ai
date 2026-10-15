// «Mi inmobiliaria» (E1 · S-4): marca, agente, contacto (WhatsApp y privacidad) y CRM se escriben UNA vez y se usan en
// todos los recorridos. Se guarda en este navegador (localStorage «cre8eight:perfil»); el logo y la foto, reducidos, como
// data: URL. Cada proyecto lo copia en su tour (marca, agente y contacto) mientras está enlazado (tour._estudio.perfil
// !== false). «Cambiar solo en este inmueble» lo desenlaza y guarda un contacto propio en ese proyecto.
// Contingencias: sin almacenamiento, el perfil se aplica solo al proyecto abierto; con el perfil vacío (p. ej. una copia
// de seguridad restaurada en otro ordenador) nunca se borran los datos del proyecto.
// Color de marca: vacío = el champán del tema (claro u oscuro). El antiguo valor por defecto (#c8a24a) se lee como vacío.
// Traducciones (fase 4): el pie legal y el texto de privacidad se escriben en español aquí y se traducen en Datos →
// «Idiomas y traducciones»; las traducciones se guardan en perfil.traducciones.{pie_legal,texto_privacidad}.{en,fr,de}
// y valen para todos los recorridos mientras el texto en español no cambie.
import { slug } from "./estudio-util.js";
import { app, h, icono, cambiar, toast, dialogo, guardarArchivo, urlPermitida, textoDe, textoExacto, emitir, elegirArchivos, VIDRIO, COLOR_ANTIGUO, coloresTema } from "./estudio-nucleo.js";

const CLAVE = "cre8eight:perfil";
const CLAVE_AVISO = "cre8eight:perfil-aviso";
const MODOS = [["whatsapp", "WhatsApp"], ["webhook", "Mi CRM"], ["ambos", "Los dos"]];
const MUESTRAS = ["#1f6f5c", "#2b4c7e", "#b5473a", "#222222"]; // colores de marca de ejemplo (datos); la primera muestra es el champán del tema
const TRADUCIBLES = ["pie_legal", "texto_privacidad"];
const IDIOMAS_TRAD = ["en", "fr", "de"];

const vacio = () => ({
  marca: { nombre: "", web: "", color: "", logo: "", pie_legal: "" },
  agente: { nombre: "", telefono: "", email: "", foto: "" },
  contacto: { modo: "whatsapp", whatsapp: "", url_privacidad: "", texto_privacidad: "", webhook: "", webhook_formato: "multipart" },
  traducciones: { pie_legal: {}, texto_privacidad: {} },
});
const cad = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const imagenValida = (v) => (typeof v === "string" && v.length < 1_500_000 && /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(v) ? v : "");

/** Perfil validado: un dato corrupto, antiguo o hostil no rompe el Estudio. */
export function normalizarPerfil(p) {
  const r = vacio();
  if (!p || typeof p !== "object") return r;
  const M = p.marca ?? {}, A = p.agente ?? {}, C = p.contacto ?? {};
  const color = /^#[0-9a-f]{6}$/i.test(M.color ?? "") ? M.color.toLowerCase() : "";
  Object.assign(r.marca, { nombre: cad(M.nombre, 120), web: cad(M.web, 300), pie_legal: cad(M.pie_legal, 500), logo: imagenValida(M.logo),
    color: color === COLOR_ANTIGUO ? "" : color });
  Object.assign(r.agente, { nombre: cad(A.nombre, 120), telefono: cad(A.telefono, 40), email: cad(A.email, 160), foto: imagenValida(A.foto) });
  Object.assign(r.contacto, { modo: MODOS.some(([m]) => m === C.modo) ? C.modo : "whatsapp", whatsapp: cad(C.whatsapp, 40),
    url_privacidad: cad(C.url_privacidad, 300), texto_privacidad: cad(C.texto_privacidad, 2000), webhook: cad(C.webhook, 500),
    webhook_formato: C.webhook_formato === "json" ? "json" : "multipart" });
  for (const k of TRADUCIBLES) {
    const t = p.traducciones?.[k];
    r.traducciones[k] = Object.fromEntries(IDIOMAS_TRAD.map((l) => [l, cad(t?.[l], k === "pie_legal" ? 500 : 2000)]).filter(([, v]) => v));
  }
  return r;
}
export function leerPerfil() {
  try { return normalizarPerfil(JSON.parse(localStorage.getItem(CLAVE) ?? "null")); } catch { return vacio(); }
}
/** → true si se guardó (en modo privado o sin espacio, false). */
export function guardarPerfil(p) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ version: 1, actualizado: Date.now(), ...normalizarPerfil(p) }));
    return true;
  } catch (e) { console.warn("No se pudo guardar Mi inmobiliaria", e); return false; }
}
/** Nada escrito (ni marca, ni agente, ni contacto). */
export function perfilVacio(p = leerPerfil()) {
  const M = p.marca, A = p.agente, C = p.contacto;
  return ![M.nombre, M.web, M.logo, M.pie_legal, A.nombre, A.telefono, A.email, A.foto, C.whatsapp, C.url_privacidad, C.texto_privacidad, C.webhook].some(Boolean);
}
/** ¿El proyecto usa «Mi inmobiliaria»? */
export const enlazado = (t = app.tour) => t?._estudio?.perfil !== false;
const conContacto = (p) => !!(p.marca.nombre || p.contacto.whatsapp || p.contacto.webhook || p.contacto.url_privacidad);
/**
 * ¿Se puede copiar el perfil en el proyecto sin perder nada? Un perfil sin contacto (p. ej. solo con la web) nunca pisa
 * un proyecto que sí lo tiene (una copia de seguridad restaurada en otro ordenador, por ejemplo).
 */
export const perfilAplicable = (p, t = app.tour) => !perfilVacio(p) && (conContacto(p) || !tieneDatosPropios(t));
/** ¿El tour trae datos de contacto o marca propios? (proyectos anteriores al perfil, ZIP importados). */
export const tieneDatosPropios = (t) => !!(t?.marca?.nombre || t?.marca?.logo || t?.agente?.nombre || t?.contacto?.whatsapp || t?.contacto?.webhook || t?.contacto?.url_privacidad);

// ------------------------------------------------------------------ imágenes (data: URL ⇄ archivos del proyecto)
const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg" };
const aDataURL = (blob) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => ok(""); r.readAsDataURL(blob); });
function aBlob(dataUrl) {
  const coma = dataUrl.indexOf(",");
  const tipo = dataUrl.slice(5, dataUrl.indexOf(";"));
  const bin = atob(dataUrl.slice(coma + 1));
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return new Blob([u], { type: tipo });
}
/** Firma corta (FNV-1a) para no reescribir el logo en cada apertura del proyecto. */
function firma(s) { let x = 0x811c9dc5; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 0x01000193); } return (x >>> 0).toString(36) + s.length.toString(36); }
/** Reduce una imagen (logo: PNG transparente de 600 px; foto: JPEG de 320 px) y la devuelve como data: URL. */
export async function reducirImagen(blob, { lado = 600, foto = false } = {}) {
  if (blob.type === "image/svg+xml" || /\.svg$/i.test(blob.name ?? "")) {
    if (blob.size > 200 * 1024) throw new Error("el SVG pesa más de 200 KB: usa un PNG");
    const t = await blob.text();
    if (/<script|\son\w+\s*=|javascript:/i.test(t)) throw new Error("el SVG contiene código: expórtalo de nuevo o usa un PNG");
    return aDataURL(new Blob([t], { type: "image/svg+xml" }));
  }
  const bmp = await createImageBitmap(blob);
  const k = Math.min(1, lado / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k));
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  const comoBlob = (tipo, q) => new Promise((ok) => c.toBlob(ok, tipo, q));
  let b = await comoBlob(foto ? "image/jpeg" : "image/png", 0.86);
  if (!foto && b && b.size > 300 * 1024) b = await comoBlob("image/webp", 0.9);
  if (!b) throw new Error("no se pudo convertir la imagen");
  return aDataURL(b);
}

// ------------------------------------------------------------------ perfil ⇄ tour
/**
 * Texto traducible del perfil para el tour: el español del perfil, las traducciones que el proyecto ya tenía para ese
 * mismo texto y, encima, las del perfil. Si el español cambia, las traducciones antiguas ya no valen y no se copian.
 */
const textoPerfil = (antiguo, es, traducciones = {}) => {
  if (!es) return undefined;
  const r = antiguo && typeof antiguo === "object" && textoExacto(antiguo) === es ? { ...antiguo } : {};
  return { ...r, ...traducciones, es };
};
const sinVacios = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== ""));
/**
 * Copia el perfil en el tour del proyecto ABIERTO (marca, agente y contacto); el logo y la foto pasan a archivos del
 * proyecto (marca/logo.*, marca/agente.*). Conserva las traducciones de los textos que no cambian. → ¿ha cambiado algo?
 */
export function aplicarPerfil(t, p) {
  const firmas = (t._estudio.firmasPerfil ??= {});
  const antes = JSON.stringify([t.marca, t.agente, t.contacto, firmas]);
  const ruta = (dataUrl, base) => {
    if (!dataUrl) return undefined;
    const r = `${base}.${EXT[dataUrl.slice(5, dataUrl.indexOf(";"))] ?? "png"}`;
    const f = firma(dataUrl);
    if (!app.archivos.has(r) || firmas[r] !== f) { guardarArchivo(r, aBlob(dataUrl)); firmas[r] = f; }
    return r;
  };
  const M = p.marca, A = p.agente, C = p.contacto;
  const T = p.traducciones ?? {};
  t.marca = sinVacios({ nombre: M.nombre, color: M.color, web: M.web, logo: ruta(M.logo, "marca/logo"), pie_legal: textoPerfil(t.marca?.pie_legal, M.pie_legal, T.pie_legal) });
  t.agente = sinVacios({ nombre: A.nombre, telefono: A.telefono, email: A.email, foto: ruta(A.foto, "marca/agente") });
  t.contacto = sinVacios({ modo: C.modo, whatsapp: C.whatsapp, url_privacidad: C.url_privacidad,
    texto_privacidad: textoPerfil(t.contacto?.texto_privacidad, C.texto_privacidad, T.texto_privacidad), webhook: C.modo === "whatsapp" ? "" : C.webhook,
    webhook_formato: C.webhook_formato === "json" ? "json" : "" });
  return JSON.stringify([t.marca, t.agente, t.contacto, firmas]) !== antes;
}
/** Perfil con los datos que tiene el proyecto abierto (para el contacto propio o para crear el perfil desde él). */
export async function perfilDeTour(t = app.tour) {
  const M = t?.marca ?? {}, A = t?.agente ?? {}, C = t?.contacto ?? {};
  const img = async (ruta, foto) => { const b = ruta && app.archivos.get(ruta); if (!b) return ""; try { return await reducirImagen(b, { lado: foto ? 320 : 600, foto }); } catch { return ""; } };
  const traducciones = (v) => (v && typeof v === "object" ? Object.fromEntries(IDIOMAS_TRAD.map((l) => [l, v[l]])) : {});
  return normalizarPerfil({
    marca: { nombre: M.nombre, web: M.web, color: M.color, pie_legal: textoExacto(M.pie_legal), logo: await img(M.logo, false) },
    agente: { nombre: A.nombre, telefono: A.telefono, email: A.email, foto: await img(A.foto, true) },
    contacto: { modo: C.modo, whatsapp: C.whatsapp, url_privacidad: C.url_privacidad, texto_privacidad: textoExacto(C.texto_privacidad), webhook: C.webhook, webhook_formato: C.webhook_formato },
    traducciones: { pie_legal: traducciones(M.pie_legal), texto_privacidad: traducciones(C.texto_privacidad) },
  });
}
/**
 * Traducción de un texto del perfil (pie legal o privacidad) escrita en Datos → «Idiomas y traducciones» de un proyecto
 * que usa Mi inmobiliaria: se guarda también en el perfil, para los próximos recorridos (si el español es el mismo).
 */
export function traducirPerfil(grupo, clave, idioma, valor) {
  if (!enlazado() || !TRADUCIBLES.includes(clave) || !IDIOMAS_TRAD.includes(idioma)) return;
  const p = leerPerfil();
  if (!p[grupo]?.[clave] || p[grupo][clave] !== textoExacto(app.tour?.[grupo]?.[clave])) return;
  if (valor.trim()) p.traducciones[clave][idioma] = valor.trim(); else delete p.traducciones[clave][idioma];
  guardarPerfil(p);
}
/** Al abrir o crear un proyecto enlazado: copia «Mi inmobiliaria» si tiene algo. → ¿ha cambiado el proyecto? */
export function sincronizarAlAbrir() {
  if (!app.tour || !enlazado()) return false;
  const p = leerPerfil();
  return perfilAplicable(p) ? aplicarPerfil(app.tour, p) : false;
}
/** «Volver a usar Mi inmobiliaria» en este inmueble. */
export function usarPerfil() {
  const p = leerPerfil();
  if (!conContacto(p)) return abrirPerfil();
  cambiar((t) => { t._estudio.perfil = true; aplicarPerfil(t, p); }, { tipo: "datos" });
  toast("Este inmueble vuelve a usar Mi inmobiliaria", "ok");
  emitir("perfil");
}
/**
 * Cambia la web (Publicar → «Tu web»): es la de Mi inmobiliaria (E4), salvo que el proyecto tenga contacto propio o el
 * perfil no se pueda aplicar sin perder datos; entonces solo cambia en este proyecto.
 */
export function fijarWeb(v) {
  const p = leerPerfil();
  p.marca.web = v;
  if (app.tour && enlazado() && perfilAplicable(p)) {
    const guardado = guardarPerfil(p);
    cambiar((t) => { aplicarPerfil(t, p); }, { tipo: "datos" });
    if (!guardado) toast("Este navegador no permite guardar Mi inmobiliaria: la web se usa solo en este proyecto", "aviso", 5000);
    emitir("perfil");
  } else cambiar((t) => { t.marca ??= {}; if (v) t.marca.web = v; else delete t.marca.web; }, { tipo: "datos" });
}
/** Migra la web que antes se escribía en Publicar (localStorage «estudio:publicar».web) a Mi inmobiliaria. */
export function migrarWebAntigua(web) {
  if (!web || !(urlPermitida(web) && /^https?:\/\//i.test(web))) return true;
  const p = leerPerfil();
  if (p.marca.web) return true;
  p.marca.web = web;
  return guardarPerfil(p);
}
/** Abre lo que corresponde para corregir un dato de contacto («Antes de publicar» → Corregir). */
export const abrirContacto = (campo) => abrirPerfil({ modo: enlazado() ? "perfil" : "inmueble", foco: campo });

// ------------------------------------------------------------------ consulta de prueba al CRM
/** Misma forma que la consulta real del visor (paneles.js · datosConsulta). */
function consultaDePrueba(numFotos) {
  const p = app.tour?.panoramas[0];
  return {
    nombre: "Prueba de cre8eight Estudio", telefono: "+34 600 000 000", pregunta: "Mensaje de prueba: puedes borrarlo.",
    referencia: app.tour?.inmueble?.referencia || app.tour?._estudio?.ref || null,
    estancia: textoDe(p?.nombre) || "General", estancia_id: p?.id ?? "general", estancia_actual: textoDe(p?.nombre) || null,
    url: location.href.split("#")[0], fecha: new Date().toISOString(), idioma: app.tour?.idioma ?? "es", num_fotos: numFotos,
  };
}
/** La petición que hará el visor: sin fotos, JSON; con fotos, multipart o JSON (base64) según el formato. */
async function peticionDePrueba(formato, conFoto) {
  const p = app.tour?.panoramas[0];
  const blob = conFoto && p ? app.archivos.get(p.miniatura) ?? app.archivos.get(p.imagen_movil) : null;
  const d = consultaDePrueba(blob ? 1 : 0);
  if (!blob) return { simple: false, init: { body: JSON.stringify(d), headers: { "Content-Type": "application/json" } } };
  const archivo = new File([blob], `foto-1-${slug(textoDe(p.nombre) || p.id)}.jpg`, { type: blob.type || "image/jpeg" });
  const meta = [{ n: 1, estancia: textoDe(p.nombre) || p.id, nodo: p.id, enlace: location.href.split("#")[0] }];
  if (formato === "json") {
    const base64 = (await aDataURL(blob)).split(",")[1];
    return { simple: false, init: { body: JSON.stringify({ ...d, fotos: [{ ...meta[0], nombre: archivo.name, tipo: archivo.type, base64 }] }), headers: { "Content-Type": "application/json" } } };
  }
  const fd = new FormData();
  for (const [k, v] of Object.entries(d)) fd.append(k, v == null ? "" : String(v));
  fd.append("fotos", JSON.stringify(meta));
  fd.append("foto_1", archivo, archivo.name);
  return { simple: true, init: { body: fd } };
}
async function probarCRM(url, formato, conFoto, res) {
  const pinta = (texto, tipo) => { res.textContent = texto; res.dataset.tipo = tipo ?? ""; };
  if (!urlPermitida(url, { soloHttps: true })) return pinta("Escribe primero la dirección de conexión (empieza por https://).", "error");
  pinta("Enviando una consulta de prueba…");
  const { simple, init } = await peticionDePrueba(formato, conFoto);
  try {
    const r = await fetch(url, { method: "POST", ...init });
    if (r.ok) pinta(`Recibido: tu CRM ha aceptado la consulta de prueba (respuesta ${r.status}).`, "ok");
    else pinta(`Tu CRM ha rechazado la consulta (error ${r.status}). Revisa la dirección de conexión.`, "error");
  } catch {
    // La petición multipart sale igualmente; el navegador solo impide leer la respuesta.
    if (simple) return pinta("Enviado. No podemos confirmar que haya llegado: compruébalo en tu CRM.", "aviso");
    try {
      await fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: init.body });
      pinta("Enviado. No podemos confirmar que haya llegado: compruébalo en tu CRM. Si no llega, tu CRM no acepta envíos desde otras webs: elige «Con fotos adjuntas» o pide a tu proveedor que lo permita (lo llaman «CORS»).", "aviso");
    } catch { pinta("No se ha podido conectar con esa dirección. Comprueba que esté bien copiada y que tengas internet.", "error"); }
  }
}

// ------------------------------------------------------------------ formulario (sistema de diseño c8)
const RE_WA = /^\d{8,15}$/;
const validarWeb = (v) => (v && !(urlPermitida(v) && /^https?:\/\//i.test(v)) ? "Escribe la dirección completa, empezando por https://" : "");
const VALIDAR = {
  web: validarWeb,
  url_privacidad: validarWeb,
  whatsapp: (v) => (v && !RE_WA.test(v.replace(/[\s+()-]/g, "")) ? "Escribe el número con el prefijo del país, por ejemplo 34 600 111 222." : ""),
  webhook: (v) => (v && !urlPermitida(v, { soloHttps: true }) ? "La dirección debe empezar por https://" : ""),
  email: (v) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Escribe un email válido." : ""),
};

function formulario(perfil, foco) {
  const datos = structuredClone(perfil);
  const comprobaciones = [];
  let n = 0;
  const texto = (grupo, clave, etiqueta, { tipo = "text", placeholder = "", ayuda, largo = false, auto = "off", campo = clave, validar } = {}) => {
    const id = `perfil-${grupo}-${clave}-${++n}`;
    const input = h(largo ? "textarea" : "input", { id, type: largo ? null : tipo, placeholder, autocomplete: auto, rows: largo ? 3 : null, spellcheck: largo ? null : "false" });
    input.value = datos[grupo][clave] ?? "";
    const err = h("small", { class: "c8-error", id: `${id}-err`, "aria-live": "polite" });
    input.setAttribute("aria-describedby", [ayuda ? `${id}-ayuda` : null, `${id}-err`].filter(Boolean).join(" "));
    const comprobar = () => { const e = validar?.(input.value.trim()) || ""; err.textContent = e; input.setAttribute("aria-invalid", e ? "true" : "false"); return !e; };
    input.addEventListener("input", () => { datos[grupo][clave] = input.value; if (input.getAttribute("aria-invalid") === "true") comprobar(); });
    input.addEventListener("change", comprobar);
    if (validar) comprobaciones.push({ comprobar, input });
    return h("div", { class: "c8-campo", "data-campo": campo }, h("label", { for: id, text: etiqueta }), input, ayuda ? h("small", { class: "c8-ayuda", id: `${id}-ayuda`, text: ayuda }) : null, err);
  };
  const imagen = (grupo, clave, etiqueta, { foto = false, campo = clave } = {}) => {
    const cont = h("div", { class: "c8-campo campo-imagen", "data-campo": campo });
    const pintar = (msg = "") => {
      const v = datos[grupo][clave];
      cont.replaceChildren(h("span", { class: "c8-campo-etiqueta", text: etiqueta }), h("div", { class: "fila-imagen" },
        v ? h("img", { src: v, alt: "", class: foto ? "foto" : "logo" }) : h("span", { class: `hueco ${foto ? "foto" : "logo"}`, "aria-hidden": "true" }),
        h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", onclick: async () => {
          const [f] = await elegirArchivos({ aceptar: "image/png,image/jpeg,image/webp,image/svg+xml" });
          if (!f) return;
          try { datos[grupo][clave] = await reducirImagen(f, { lado: foto ? 320 : 600, foto }); pintar(); }
          catch (e) { pintar(`No se pudo usar la imagen: ${e.message}.`); }
        } }, icono("subir", 15), v ? "Cambiar" : "Subir"),
        v ? h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--s", onclick: () => { datos[grupo][clave] = ""; pintar(); } }, "Quitar") : null),
      ...(msg ? [h("small", { class: "c8-error", role: "status", text: msg })] : []));
    };
    pintar();
    return cont;
  };
  // Color de la marca: vacío = el champán del tema (se adapta a claro y oscuro). La primera muestra lo deja así.
  const color = () => {
    const sel = h("input", { type: "color", "aria-label": "Color de tu marca" });
    const hex = h("input", { type: "text", "aria-label": "Color en hexadecimal (vacío: el champán del tema)", class: "hex", spellcheck: "false", placeholder: "Champán" });
    const muestras = [
      h("button", { type: "button", class: "muestra tema", title: "Champán (del tema)", "aria-label": "Usar el champán del tema", "data-color": "", onclick: () => fijar("") }),
      ...MUESTRAS.map((c) => h("button", { type: "button", class: "muestra", style: { background: c }, title: c, "aria-label": `Usar ${c}`, "data-color": c, onclick: () => fijar(c) })),
    ];
    const pintarColor = () => {
      const c = datos.marca.color;
      const tema = coloresTema({ acento: "--c-acento" }).acento;
      sel.value = c || (/^#[0-9a-f]{6}$/i.test(tema) ? tema : "#000000");
      if (document.activeElement !== hex) hex.value = c;
      for (const b of muestras) b.setAttribute("aria-pressed", String(b.dataset.color === c));
    };
    const fijar = (v) => { v = v.trim().toLowerCase(); if (v === "" || /^#[0-9a-f]{6}$/.test(v)) { datos.marca.color = v; pintarColor(); } };
    sel.oninput = () => fijar(sel.value);
    hex.oninput = () => fijar(hex.value);
    hex.onchange = () => { hex.value = datos.marca.color; };
    pintarColor();
    return h("div", { class: "c8-campo", "data-campo": "color" }, h("span", { class: "c8-campo-etiqueta", text: "Color de tu marca" }),
      h("div", { class: "fila-color" }, sel, hex, ...muestras));
  };
  // Cómo llegan las consultas: WhatsApp, CRM o los dos
  const zonaWa = h("div");
  const crm = h("details", { class: "plegable-c8", "data-campo": "crm", open: datos.contacto.modo !== "whatsapp" || foco === "webhook" || foco === "webhook_formato" });
  const modo = h("div", { class: "c8-segmentado", role: "radiogroup", "aria-label": "Cómo recibes las consultas", "data-campo": "modo" },
    MODOS.map(([v, t]) => {
      const r = h("input", { type: "radio", name: `perfil-modo-${n}`, value: v, checked: datos.contacto.modo === v });
      r.onchange = () => { datos.contacto.modo = v; pintarModo(); };
      return h("label", {}, r, h("span", { text: t }));
    }));
  const campoWa = texto("contacto", "whatsapp", "WhatsApp de la empresa", { tipo: "tel", placeholder: "34 600 111 222", auto: "tel", ayuda: "Con el prefijo del país (34 en España). Aquí llegan las consultas de los clientes.", validar: VALIDAR.whatsapp });
  const pintarModo = () => {
    zonaWa.replaceChildren(datos.contacto.modo !== "webhook" ? campoWa : h("p", { class: "c8-sec", text: "Las consultas llegarán solo a tu CRM." }));
    if (datos.contacto.modo !== "whatsapp") crm.open = true;
  };
  pintarModo();
  const formato = h("select", { "aria-label": "Formato de envío" },
    h("option", { value: "multipart", text: "Con fotos adjuntas (recomendado)" }), h("option", { value: "json", text: "Todo en un mensaje JSON (fotos en base64)" }));
  formato.value = datos.contacto.webhook_formato;
  formato.onchange = () => { datos.contacto.webhook_formato = formato.value; };
  const conFoto = h("input", { type: "checkbox", checked: true });
  const res = h("p", { class: "resultado-crm c8-sec", role: "status" });
  crm.append(h("summary", { text: "Conectar con mi CRM (avanzado)" }), h("div", { class: "contenido-plegable" },
    texto("contacto", "webhook", "Dirección de conexión que te da tu CRM", { tipo: "url", placeholder: "https://hook.eu1.make.com/…",
      ayuda: "Make, Zapier, n8n o tu CRM te dan una dirección que empieza por https://. Ahí llegan el nombre, el teléfono, la pregunta, la estancia y las fotos.", validar: VALIDAR.webhook }),
    h("div", { class: "c8-campo", "data-campo": "webhook_formato" }, h("label", { text: "Formato de envío" }), formato),
    h("div", { class: "fila-prueba" },
      h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", onclick: () => probarCRM(datos.contacto.webhook.trim(), datos.contacto.webhook_formato, conFoto.checked, res) }, "Enviar una consulta de prueba"),
      h("label", { class: "check" }, conFoto, "con una foto")),
    res));

  const el = h("div", { class: "form-perfil" },
    h("section", {}, h("h3", { class: "c8-mayus", text: "Tu marca" }), h("div", { class: "rejilla-c8" },
      texto("marca", "nombre", "Nombre de la inmobiliaria", { placeholder: "Inmobiliaria Ejemplo", auto: "organization" }),
      texto("marca", "web", "Tu web", { tipo: "url", placeholder: "https://www.tu-inmobiliaria.com", auto: "url", ayuda: "Donde publicarás tus recorridos: se usa para el enlace, el QR y el código para incrustarlo.", validar: VALIDAR.web }),
      imagen("marca", "logo", "Logo (PNG transparente o SVG)"),
      color(),
      h("div", { class: "ancho-todo" }, texto("marca", "pie_legal", "Pie legal", { placeholder: "Agente inscrito en el registro AICAT nº 0000 · CIF B00000000", campo: "pie_legal" })))),
    h("section", {}, h("h3", { class: "c8-mayus", text: "Cómo te escriben los clientes" }),
      h("div", { class: "c8-campo" }, h("span", { class: "c8-campo-etiqueta", text: "Las consultas llegan por" }), modo),
      h("div", { class: "rejilla-c8" },
        zonaWa,
        texto("contacto", "url_privacidad", "Tu política de privacidad (dirección)", { tipo: "url", placeholder: "https://www.tu-inmobiliaria.com/privacidad", ayuda: "Obligatoria: el formulario recoge datos personales (RGPD).", validar: VALIDAR.url_privacidad }),
        h("div", { class: "ancho-todo" }, texto("contacto", "texto_privacidad", "Texto de privacidad junto al formulario (opcional)", { largo: true,
          placeholder: "Responsable: Inmobiliaria Ejemplo. Finalidad: atender tu consulta. Puedes ejercer tus derechos en…" }))),
      crm),
    h("section", {}, h("h3", { class: "c8-mayus", text: "Agente (opcional)" }), h("div", { class: "rejilla-c8" },
      texto("agente", "nombre", "Nombre", { placeholder: "Ana Pérez", auto: "name", campo: "agente_nombre" }),
      texto("agente", "telefono", "Teléfono", { tipo: "tel", placeholder: "+34 600 111 222", auto: "tel", campo: "agente_telefono" }),
      texto("agente", "email", "Email", { tipo: "email", placeholder: "ana@tu-inmobiliaria.com", auto: "email", campo: "agente_email", validar: VALIDAR.email }),
      imagen("agente", "foto", "Foto", { foto: true, campo: "agente_foto" }))));
  return {
    el,
    datos: () => datos,
    /** Comprueba todo; si algo está mal, lleva el foco al primero. → ¿se puede guardar? */
    validar: () => {
      const malos = comprobaciones.filter((c) => !c.comprobar());
      if (malos.length) { malos[0].input.closest("details")?.setAttribute("open", ""); malos[0].input.focus(); }
      return !malos.length;
    },
  };
}

/**
 * Diálogo «Mi inmobiliaria» (modo "perfil") o «Contacto de este inmueble» (modo "inmueble": desenlaza el proyecto).
 * foco: data-campo del dato que hay que corregir.
 */
export async function abrirPerfil({ modo = "perfil", foco } = {}) {
  const deInmueble = modo === "inmueble";
  let base = leerPerfil(), prellenado = false;
  if (deInmueble) base = await perfilDeTour();
  else if (perfilVacio(base) && app.tour && tieneDatosPropios(app.tour)) { base = await perfilDeTour(); prellenado = true; }
  const form = formulario(base, foco);
  const selFoco = foco ? `[data-campo="${foco}"] :is(input:not([type=radio]), textarea, select, button), [data-campo="${foco}"] input:checked` : null;
  const r = await dialogo({
    clase: "dialogo-perfil", ancho: "min(47.5rem, calc(100vw - 2rem))", foco: selFoco,
    titulo: deInmueble ? "Contacto de este inmueble" : "Mi inmobiliaria",
    texto: deInmueble ? "Solo para este inmueble: el resto de tus recorridos siguen usando Mi inmobiliaria."
      : "Se escribe una vez y se usa en todos tus recorridos: tu marca, cómo te escriben los clientes y tu política de privacidad.",
    cuerpo: h("div", {}, prellenado ? h("p", { class: "nota-c8", role: "note", text: "Rellenado con los datos de este proyecto. Revísalos y pulsa «Guardar»." }) : null, form.el),
    botones: [
      ...(deInmueble && !perfilVacio() ? [{ texto: "Volver a usar Mi inmobiliaria", valor: "perfil", izquierda: true }] : []),
      { texto: "Cancelar", valor: null },
      { texto: "Guardar", primario: true, mantener: true, valor: () => (form.validar() ? "guardar" : false) },
    ],
  });
  if (r === "perfil") return usarPerfil();
  if (r !== "guardar") return;
  const p = normalizarPerfil(form.datos());
  // Si cambia el texto en español, sus traducciones ya no corresponden.
  for (const [g, k] of [["marca", "pie_legal"], ["contacto", "texto_privacidad"]]) if (p[g][k] !== base[g][k]) p.traducciones[k] = {};
  if (deInmueble) {
    cambiar((t) => { aplicarPerfil(t, p); t._estudio.perfil = false; }, { tipo: "datos" });
    toast("Contacto propio guardado para este inmueble", "ok");
  } else {
    const guardado = guardarPerfil(p);
    if (app.tour && enlazado() && perfilAplicable(p)) cambiar((t) => { aplicarPerfil(t, p); }, { tipo: "datos" });
    toast(guardado ? "Mi inmobiliaria guardada: se usa en todos tus recorridos" : "Este navegador no permite guardar Mi inmobiliaria: se ha aplicado solo a este proyecto",
      guardado ? "ok" : "aviso", 5000);
  }
  emitir("perfil");
}

// ------------------------------------------------------------------ piezas para otras pantallas
const avisoDescartado = () => { try { return localStorage.getItem(CLAVE_AVISO) === "no"; } catch { return false; } };
/** Aviso de la primera visita (perfil vacío): «Completa Mi inmobiliaria (1 minuto)». null si no hace falta. */
export function avisoPerfil() {
  if (!perfilVacio() || avisoDescartado() || (app.tour && !enlazado())) return null;
  const el = h("div", { class: "aviso-c8", role: "note" },
    h("span", { class: "aviso-icono" }, icono("inmobiliaria", 20)),
    h("div", { class: "aviso-texto" }, h("b", { text: "Completa Mi inmobiliaria (1 minuto)" }), h("span", { text: "Tu marca, tu WhatsApp y tu política de privacidad. Se usan en todos tus recorridos." })),
    h("div", { class: "aviso-acciones" },
      h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", onclick: () => abrirPerfil() }, "Completar"),
      h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--s", onclick: () => { try { localStorage.setItem(CLAVE_AVISO, "no"); } catch {} el.remove(); } }, "Ahora no")));
  return el;
}
/** Tarjeta «Contacto» del paso Datos: usa Mi inmobiliaria · Cambiar solo en este inmueble. */
export function tarjetaContacto() {
  const t = app.tour, propio = !enlazado(t), vacioP = perfilVacio();
  const C = t.contacto ?? {}, M = t.marca ?? {};
  const wa = String(C.whatsapp ?? "").trim();
  const datosVisibles = [
    M.nombre ? h("li", {}, h("b", { text: M.nombre })) : null,
    (C.modo ?? "whatsapp") !== "webhook" ? h("li", { class: wa ? "" : "falta" }, wa ? `WhatsApp ${wa}` : "Falta el WhatsApp") : null,
    (C.modo ?? "whatsapp") !== "whatsapp" ? h("li", { class: C.webhook ? "" : "falta" }, C.webhook ? "Conectado con tu CRM" : "Falta la conexión con el CRM") : null,
    h("li", { class: C.url_privacidad ? "" : "falta" }, C.url_privacidad ? "Política de privacidad ✓" : "Falta la política de privacidad"),
  ].filter(Boolean);
  const boton = (texto, fn, primario = false) => h("button", { type: "button", class: `c8-boton ${primario ? "c8-boton--primario" : "c8-boton--secundario"} c8-boton--s`, onclick: fn }, texto);
  let titulo, texto, acciones;
  if (propio) {
    titulo = "Contacto propio de este inmueble";
    texto = "Este inmueble no usa Mi inmobiliaria.";
    acciones = [boton("Editar", () => abrirPerfil({ modo: "inmueble" })), boton("Volver a usar Mi inmobiliaria", usarPerfil)];
  } else if (vacioP && !tieneDatosPropios(t)) {
    titulo = "Contacto: completa Mi inmobiliaria";
    texto = "Marca, WhatsApp y privacidad se escriben una vez (1 minuto) y se usan en todos tus recorridos.";
    acciones = [boton("Completar Mi inmobiliaria", () => abrirPerfil())];
  } else if (vacioP) {
    titulo = "Contacto de este proyecto";
    texto = "Guárdalo como Mi inmobiliaria para no volver a escribirlo en los próximos recorridos.";
    acciones = [boton("Guardar como Mi inmobiliaria", () => abrirPerfil()), boton("Cambiar solo en este inmueble", () => abrirPerfil({ modo: "inmueble" }))];
  } else {
    titulo = "Contacto: usando Mi inmobiliaria";
    texto = "";
    acciones = [boton("Editar Mi inmobiliaria", () => abrirPerfil()), boton("Cambiar solo en este inmueble", () => abrirPerfil({ modo: "inmueble" }))];
  }
  return h("section", { class: `tarjeta-contacto ${VIDRIO}`, "data-campo": "contacto", "aria-label": titulo },
    h("div", { class: "cab-contacto" }, icono("inmobiliaria", 20), h("h2", { text: titulo })),
    texto ? h("p", { class: "c8-sec", text: texto }) : null,
    datosVisibles.length && (propio || !vacioP || tieneDatosPropios(t)) ? h("ul", { class: "datos-contacto" }, datosVisibles) : null,
    h("div", { class: "acciones-contacto" }, acciones));
}
