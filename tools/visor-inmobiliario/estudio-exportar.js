// Paso 4 · Publicar (S-1 · S-7 · E4): «Antes de publicar» (lo que antes era Revisar) y las descargas por destino:
//   1 · Tu web (ZIP, enlace, QR y código para incrustarlo) · 2 · Portales y redes (fotos 360, vídeo, plano con medidas)
//   · 3 · Para tus clientes (dossier, recorrido en un solo archivo y QR) · Avanzado (tour.json).
// La copia de seguridad está en «Proyecto ▾». La web es la de «Mi inmobiliaria»; con web se escribe `url_publica`.
import { slug, norm360, zipAlmacenado } from "./estudio-util.js";
import { app, h, icono, emitir, on, toast, textoDe, colocado, calcularEnlaces, tourParaExportar, archivosParaExportar, rutasUsadas,
  fmtMB, archivosFaltantes, urlsNoValidas, urlPermitida, MENSAJE_URL, tienePlano, textosTraducibles, textoExacto, referenciaDe } from "./estudio-nucleo.js";
import { problemaVariante, nombreEstilo, origenDe } from "./estudio-variantes.js";
import { fijarWeb, migrarWebAntigua } from "./estudio-perfil.js";

// ------------------------------------------------------------------ exportar.js (otro módulo; puede no existir aún)
let EXP = null, errorExp = null, QR = null;
import("./exportar.js").then((m) => { EXP = m; emitir("exportar-listo"); }).catch((e) => { errorExp = e; console.warn("exportar.js no disponible", e); emitir("exportar-listo"); });
import("./vendor/qr.js").then((m) => { QR = m; emitir("exportar-listo"); }).catch(() => {});

// ------------------------------------------------------------------ «Antes de publicar»
const nombreDe = (p) => textoDe(p?.nombre) || p?.id || "";
const lista = (xs, n = 4) => xs.slice(0, n).join(", ") + (xs.length > n ? ` y ${xs.length - n} más` : "");
const RE_WA = /^\d{8,15}$/;

/**
 * Comprobaciones → [{id, nivel: "error" | "aviso" | "ok", titulo, detalle, ir}] («aviso» = sugerencia).
 * ir: { seccion, campo } lleva al campo exacto; { perfil: campo } abre Mi inmobiliaria (o el contacto propio) en ese campo.
 * Solo se sugiere lo que el Estudio pide (E6/E7): el título y la referencia son automáticos y, sin plano, no se pide orientar.
 */
export function comprobar() {
  const t = app.tour;
  if (!t) return [];
  const r = [];
  const add = (id, nivel, titulo, detalle, ir) => r.push({ id, nivel, titulo, detalle, ir });
  const ps = t.panoramas, meta = t._estudio.meta;
  const I = t.inmueble ?? {}, CE = I.certificado_energetico ?? {}, C = t.contacto ?? {};
  // Fotos
  if (!ps.length) add("fotos", "error", "Aún no hay fotos 360", "Sube al menos una foto panorámica.", { seccion: "fotos" });
  else add("fotos", "ok", `${ps.length} ${ps.length === 1 ? "foto 360" : "fotos 360"}`, "", { seccion: "fotos" });
  const raras = ps.filter((p) => { const m = meta[p.imagen]; return m && Math.abs(m.w / m.h - 2) > 0.02; });
  if (raras.length) add("ratio", "aviso", "Fotos que no parecen 360 completas", `${lista(raras.map(nombreDe))}. Expórtalas desde DJI Mimo como “Foto panorámica 360”.`, { seccion: "fotos" });
  const faltan = archivosFaltantes(t);
  if (faltan.length) add("archivos", "error", `Faltan ${faltan.length} archivo(s) del proyecto`, `No se encuentran: ${lista(faltan.map((f) => f.donde), 3)}. Vuelve a subirlos o restaura una copia de seguridad.`, { seccion: "fotos" });
  // Plano (opcional) y conexiones: sin colocar, las fotos se conectan en el orden de la lista.
  const colocadas = ps.filter(colocado), sinPos = ps.filter((p) => !colocado(p));
  const conPlano = colocadas.length > 0;
  if (ps.length) {
    if (!conPlano) add("posicion", "ok", "Sin plano: las fotos se conectan en el orden de la lista", "", { seccion: "plano" });
    else if (!sinPos.length) add("posicion", "ok", "Todas las fotos están en el plano", "", { seccion: "plano" });
    else add("posicion", "aviso", `${sinPos.length} ${sinPos.length === 1 ? "foto sin colocar" : "fotos sin colocar"} en el plano`, `Se conectarán en el orden de la lista: ${lista(sinPos.map(nombreDe))}.`, { seccion: "plano" });
  }
  const sinCal = t.plantas.filter((pl) => pl.plano?.imagen && !t._estudio.calibrado?.[pl.id]);
  if (sinCal.length) add("calibrar", "aviso", "Plano sin calibrar", `Las medidas y los m² no serán reales: ${lista(sinCal.map((p) => textoDe(p.nombre)))}.`, { seccion: "plano" });
  if (ps.length > 1) {
    const { vecinos } = calcularEnlaces();
    const aisl = ps.filter((p) => !(vecinos.get(p.id)?.length));
    if (aisl.length) add("aislados", "error", `${aisl.length} ${aisl.length === 1 ? "foto sin conectar" : "fotos sin conectar"}`, `No se puede llegar a: ${lista(aisl.map(nombreDe))}. Acércalas a otra foto en el plano o usa «Conectar».`, { seccion: "plano" });
    else {
      const ini = t.inicio && vecinos.has(t.inicio) ? t.inicio : ps[0].id;
      const vistos = new Set([ini]); const cola = [ini];
      while (cola.length) for (const v of vecinos.get(cola.shift()) ?? []) if (!vistos.has(v)) { vistos.add(v); cola.push(v); }
      const fuera = ps.filter((p) => !vistos.has(p.id));
      if (fuera.length) add("conexo", "aviso", "Hay zonas que no se conectan con el inicio", `No se llega a: ${lista(fuera.map(nombreDe))}. Falta una conexión (p. ej. la escalera entre plantas).`, { seccion: "plano" });
      else if (conPlano) add("aislados", "ok", "Todas las fotos están conectadas", "", { seccion: "plano" });
    }
    if (conPlano) { // sin plano no se sugiere orientar (E7)
      const brujula = (p) => meta[p.imagen]?.brujula != null;
      const sinDir = colocadas.filter((p) => !p.yaw && !brujula(p));
      if (sinDir.length) add("yaw", "aviso", `${sinDir.length} ${sinDir.length === 1 ? "foto sin orientar" : "fotos sin orientar"}`,
        `Las flechas del suelo pueden no coincidir con las puertas: ${lista(sinDir.map(nombreDe))}. Usa «Alinear con una puerta».`, { seccion: "orientacion", nodo: sinDir[0].id });
      const porRevisar = colocadas.filter((p) => brujula(p) && !meta[p.imagen]?.brujulaRevisada);
      if (porRevisar.length) add("brujula", "aviso", "Orientación por brújula sin revisar", `Comprueba que las flechas coinciden con las puertas: ${lista(porRevisar.map(nombreDe))}.`, { seccion: "orientacion", nodo: porRevisar[0].id });
    }
  }
  const sinTit = ps.flatMap((p) => (p.puntos ?? []).filter((pt) => !textoDe(pt.titulo).trim()).map(() => p));
  if (sinTit.length) add("puntos", "aviso", "Notas sin título", lista([...new Set(sinTit.map(nombreDe))]), { seccion: "orientacion", nodo: sinTit[0].id });
  // Datos y obligaciones legales
  if (!I.precio) add("precio", "aviso", "Falta el precio", "", { seccion: "datos", campo: "precio" });
  if (CE.en_tramite) add("ce", "ok", "Certificado energético: en trámite", "", { seccion: "datos", campo: "certificado" });
  else if (!CE.consumo_letra || !CE.emisiones_letra) add("ce", "error", "Falta el certificado energético", "Es obligatorio en los anuncios de venta y alquiler en España: letra de consumo y de emisiones, o «en trámite».", { seccion: "datos", campo: "certificado" });
  else add("ce", "ok", `Certificado energético ${CE.consumo_letra} / ${CE.emisiones_letra}`, "", { seccion: "datos", campo: "certificado" });
  const modo = C.modo ?? "whatsapp";
  const faltaWa = modo !== "webhook" && !RE_WA.test(String(C.whatsapp ?? "").replace(/[\s+()-]/g, ""));
  const faltaHook = modo !== "whatsapp" && !urlPermitida(C.webhook ?? "x", { soloHttps: true });
  if (faltaWa || faltaHook) add("contacto", "error", "Falta el contacto", faltaWa ? "Escribe el WhatsApp de la empresa (con el prefijo 34) en Mi inmobiliaria." : "Escribe la dirección de conexión de tu CRM (empieza por https://).",
    { perfil: faltaWa ? "whatsapp" : "webhook" });
  else add("contacto", "ok", modo === "ambos" ? "Contacto por WhatsApp y CRM" : modo === "webhook" ? "Contacto por tu CRM" : "Contacto por WhatsApp", "", { perfil: "whatsapp" });
  if (!C.url_privacidad) add("privacidad", modo === "whatsapp" ? "aviso" : "error", "Falta la política de privacidad", "El formulario recoge datos personales (RGPD): enlaza tu política de privacidad.", { perfil: "url_privacidad" });
  const malas = urlsNoValidas(t);
  if (malas.length) add("urls", "error", `${malas.length} ${malas.length === 1 ? "dirección web no válida" : "direcciones web no válidas"}`, `${lista(malas.map((m) => m.donde), 3)}. ${MENSAJE_URL}`, malas[0].ir);
  if (!t.marca?.nombre) add("marca", "aviso", "Falta el nombre de tu inmobiliaria", "Sale en la portada del recorrido y en el dossier.", { perfil: "nombre" });
  if (!webPublica()) add("web", "aviso", "Falta la dirección de tu web", "Sin ella no hay enlace, QR ni código para incrustar el recorrido.", { seccion: "publicar", campo: "web" });
  // Estilo y luz: versiones, renders e IA
  const problemas = [];
  for (const p of ps) for (const v of p.variantes ?? []) { const pr = problemaVariante(p, v); if (pr) problemas.push({ ...pr, p }); }
  if (problemas.length) add("variantes", problemas.some((x) => x.nivel === "error") ? "error" : "aviso",
    problemas.length === 1 ? "Una versión no encaja con su foto original" : `${problemas.length} versiones no encajan con su foto original`, problemas[0].texto, { seccion: "estilo", nodo: problemas[0].p.id });
  const nIA = ps.reduce((s, p) => s + (p.variantes ?? []).filter((v) => origenDe(v) === "ia").length, 0);
  const nRender = (t.galeria ?? []).filter((g) => g.tipo === "render").length + ps.filter((p) => p.origen === "render" || meta[p.imagen]?.render).length
    + ps.reduce((s, p) => s + (p.variantes ?? []).filter((v) => origenDe(v) === "render").length, 0);
  if ((nIA || nRender) && !textoDe(I.aviso_legal).trim()) {
    const que = [nRender ? `${nRender} render(s)` : null, nIA ? `${nIA} imagen(es) con IA` : null].filter(Boolean).join(" y ");
    add("aviso_legal", "error", "Falta el rótulo legal de las imágenes", `Hay ${que}. Indica que son imágenes orientativas (no contractuales).`, { seccion: "estilo", campo: "aviso_legal" });
  }
  if (ps.some((p) => p.mascara)) {
    const sinM = ps.flatMap((p) => (p.mascara ? (p.variantes ?? []).filter((v) => v.estilo && v.estilo !== "original" && !v.mascara).map((v) => `${nombreDe(p)} · ${nombreEstilo(v.estilo)}`) : []));
    if (sinM.length) add("mascaras", "aviso", "Estilos sin zonas de color: en ellos no se podrá cambiar el color", lista(sinM, 3), { seccion: "estilo" });
    if (!(t.personalizacion?.paredes?.length || t.personalizacion?.suelos?.length)) add("paleta", "aviso", "Hay zonas de color pero ningún color en las paletas", "", { seccion: "estilo", campo: "paletas" });
  }
  // Extras
  if (t.audio?.musica?.archivo && !t._estudio.musicaLicencia) add("musica", "error", "Falta confirmar la licencia de la música", "Marca «Tengo licencia para usar esta música en la web y en anuncios» o quita la música.", { seccion: "extras", campo: "musica" });
  // Traducciones (solo de los idiomas activados)
  const extra = (t.idiomas ?? []).filter((c) => c !== "es");
  if (extra.length) {
    const textos = textosTraducibles(t);
    const sinTrad = extra.reduce((n, c) => n + textos.filter(({ obj, clave }) => !textoExacto(obj()?.[clave], c).trim()).length, 0);
    if (sinTrad) add("trad", "aviso", `${sinTrad} ${sinTrad === 1 ? "texto sin traducir" : "textos sin traducir"}`, "Se mostrarán en español.", { seccion: "datos", campo: "idiomas" });
  }
  if (app.guardado === "error") add("guardado", "aviso", "El navegador no está guardando el proyecto", "Descarga una copia de seguridad (Proyecto ▾ → Copia de seguridad) para no perder el trabajo.", { menu: "proyecto" });
  return agruparPerfil(r, t);
}
/**
 * Si faltan varios datos de Mi inmobiliaria (contacto, privacidad, nombre, web), se piden en una sola línea con un solo
 * «Corregir» que abre el perfil en el primero: es una tarea, no cuatro.
 */
const DE_PERFIL = { contacto: "el WhatsApp o el CRM", privacidad: "la política de privacidad", marca: "el nombre de tu inmobiliaria", web: "la dirección de tu web" };
function agruparPerfil(r, t) {
  const faltan = r.filter((c) => c.id in DE_PERFIL && c.nivel !== "ok");
  if (faltan.length < 2) return r;
  const enlazado = t._estudio?.perfil !== false;
  const nombres = faltan.map((c) => DE_PERFIL[c.id]);
  const resto = r.filter((c) => !faltan.includes(c));
  const primero = faltan[0].ir?.perfil ?? (faltan[0].id === "web" ? "web" : "nombre");
  resto.push({ id: "perfil", nivel: faltan.some((c) => c.nivel === "error") ? "error" : "aviso",
    titulo: enlazado ? "Completa Mi inmobiliaria" : "Completa el contacto de este inmueble",
    detalle: `Falta ${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}.${enlazado ? " Se escribe una vez y vale para todos tus recorridos." : ""}`,
    ir: { perfil: primero } });
  return resto;
}
/** Resumen para la barra lateral: { errores, avisos }. */
export function pendientes() {
  if (!app.tour?.panoramas.length) return { errores: 0, avisos: 0 };
  const r = comprobar();
  return { errores: r.filter((x) => x.nivel === "error").length, avisos: r.filter((x) => x.nivel === "aviso").length };
}

function antesDePublicar() {
  const r = comprobar();
  const vacio = !app.tour.panoramas.length;
  const errores = r.filter((x) => x.nivel === "error"), avisos = r.filter((x) => x.nivel === "aviso"), oks = r.filter((x) => x.nivel === "ok");
  const nE = errores.length, nA = avisos.length;
  const estado = vacio || nE ? "error" : nA ? "aviso" : "ok";
  const resumen = vacio ? "Añade las fotos 360 para empezar."
    : nE ? `${nE} ${nE === 1 ? "cosa por corregir" : "cosas por corregir"}${nA ? ` · ${nA} ${nA === 1 ? "sugerencia" : "sugerencias"}` : ""}. Puedes descargar igualmente, pero corrígelas antes de publicar.`
      : nA ? `Listo para publicar · ${nA} ${nA === 1 ? "sugerencia" : "sugerencias"} para pulirlo.` : "Listo para publicar: todo está en orden.";
  const fila = (c) => h("li", { class: `comprobacion ${c.nivel}` },
    icono(c.nivel === "ok" ? "ok" : c.nivel === "error" ? "error" : "aviso", 20),
    h("div", {}, h("b", { text: c.titulo }), c.detalle ? h("p", { text: c.detalle }) : null),
    c.nivel !== "ok" && c.ir ? h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", onclick: () => emitir("ir", c.ir) }, c.nivel === "error" ? "Corregir" : "Ver") : h("span"));
  return h("section", { class: `antes-publicar ${estado}`, id: "antes-de-publicar", tabindex: "-1", "aria-labelledby": "titulo-antes", "data-campo": "revisar" },
    h("div", { class: "cab-antes" }, icono(estado === "ok" ? "ok" : estado === "error" ? "error" : "aviso", 22),
      h("div", {}, h("h2", { id: "titulo-antes", text: "Antes de publicar" }), h("p", { role: "status", text: resumen }))),
    [...errores, ...avisos].length ? h("ul", { class: "comprobaciones" }, [...errores, ...avisos].map(fila)) : null,
    oks.length ? h("details", { class: "correctos" }, h("summary", { text: `${oks.length} ${oks.length === 1 ? "correcto" : "correctos"}` }), h("ul", { class: "comprobaciones" }, oks.map(fila))) : null);
}

// ------------------------------------------------------------------ Publicar
let raizE = null;
const prefs = (() => { try { return JSON.parse(localStorage.getItem("estudio:publicar") ?? "{}"); } catch { return {}; } })();
const guardarPrefs = () => { try { localStorage.setItem("estudio:publicar", JSON.stringify(prefs)); } catch {} };
// La web de Publicar es la de Mi inmobiliaria (E4): la que se escribía aquí antes (prefs.web) pasa al perfil.
if ("web" in prefs && migrarWebAntigua(String(prefs.web ?? "").trim())) { delete prefs.web; guardarPrefs(); }
/** Carpeta del recorrido en la web: /tours/<referencia>/ (estable: la referencia automática no cambia con los datos). */
function nombreBase() { return slug(referenciaDe() || textoDe(app.tour.titulo) || "recorrido") || "recorrido"; }
/** La web de la inmobiliaria (validada) o null. */
function webPublica() {
  const w = String(app.tour?.marca?.web ?? "").trim();
  return w && urlPermitida(w) && /^https?:\/\/[^/\s]+/i.test(w) ? w.replace(/\/+$/, "") : null;
}
/** Dirección del recorrido publicado (url_publica) o null si aún no hay web: nunca un dominio de ejemplo (E4). */
const urlPublica = () => { const w = webPublica(); return w ? `${w}/tours/${nombreBase()}/` : null; };
function descargar(blob, nombre) {
  if (EXP?.descargar) return EXP.descargar(blob, nombre);
  const a = h("a", { href: URL.createObjectURL(blob), download: nombre });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}
/** Lo que se publica: sin documentación privada ni la carpeta estudio/ (C1), con url_publica si hay web. */
function datosPublicos() {
  const t = tourParaExportar(app.tour, { publico: true, urlPublica: urlPublica() });
  return { t, archivos: archivosParaExportar(t) };
}

/** Botón con progreso y mensaje de estado. accion(prog, estadoEl) → texto final. */
function accion({ boton, necesita, fn, primario = true }) {
  const barra = h("div");
  const prog = h("div", { class: "progreso", hidden: true }, barra);
  const estado = h("span", { class: "tenue", role: "status", style: { fontSize: "12.5px" } });
  const disponible = !necesita || (EXP && necesita.every((f) => typeof EXP[f] === "function"));
  const motivo = !disponible ? (errorExp || EXP ? "Esta opción no está disponible en esta versión." : "Cargando…") : "";
  const b = h("button", { class: `btn ${primario ? "primario" : ""}`, disabled: !disponible, title: motivo }, boton);
  b.onclick = async () => {
    b.disabled = true; prog.hidden = false; barra.style.width = "4%"; estado.textContent = "Preparando…"; estado.style.color = "";
    try {
      const r = await fn((f) => { barra.style.width = `${Math.round(Math.max(0.04, f) * 100)}%`; }, estado);
      barra.style.width = "100%";
      estado.textContent = r ?? "Listo"; estado.style.color = "var(--ok)";
    } catch (e) {
      console.error(e);
      estado.textContent = e?.name === "AbortError" ? "Cancelado" : `No se pudo completar: ${e.message}`; estado.style.color = "var(--error)";
    } finally { b.disabled = false; setTimeout(() => { prog.hidden = true; }, 1500); }
  };
  return { b, prog, estado, disponible, motivo };
}
function tarjeta({ ic, titulo, texto, controles = [], boton, fn, necesita, extra, primario = false }) {
  const a = accion({ boton, necesita, fn, primario });
  return h("div", { class: "exporte" }, h("h3", {}, icono(ic, 18), titulo), h("p", { text: texto }), ...controles,
    h("div", { class: "fila" }, a.b, !a.disponible ? h("span", { class: "tenue", style: { fontSize: "12px" }, text: a.motivo }) : null), a.prog, a.estado, extra ?? null);
}
function sel(opciones, valor, onch, etq) {
  const s = h("select", { "aria-label": etq }, opciones.map(([v, t]) => h("option", { value: v, text: t })));
  s.value = valor; s.onchange = () => onch(s.value);
  return s;
}
const casilla = (texto, valor, onch, { disabled = false, title } = {}) => {
  const c = h("input", { type: "checkbox", checked: valor, disabled });
  c.onchange = () => onch(c.checked);
  return h("label", { class: "check", title }, c, texto);
};


function renderExportar(cont, op = {}) {
  raizE = h("section", { class: "seccion seccion-publicar" });
  cont.append(raizE);
  pintarExportar();
  if (op.foco === "revisar") requestAnimationFrame(() => raizE?.querySelector("#antes-de-publicar")?.focus({ preventScroll: true }));
}
const destino = (n, titulo, texto, ...contenido) => h("section", { class: "destino", "aria-labelledby": `destino-${n}` },
  h("div", { class: "cab-destino" }, h("span", { class: "num-destino", "aria-hidden": "true", text: n }),
    h("div", {}, h("h2", { id: `destino-${n}`, text: titulo }), texto ? h("p", { class: "c8-sec", text: texto }) : null)),
  ...contenido);

let pintando = false;
/** Pinta Publicar. Protegido contra repintados anidados (un «change» al perder el foco) y conserva el foco. */
function pintarExportar() {
  if (!raizE || pintando) return;
  pintando = true;
  const foco = raizE.contains(document.activeElement) ? document.activeElement.id : "";
  try { pintarPublicar(); } finally { pintando = false; }
  if (foco) document.getElementById(foco)?.focus({ preventScroll: true });
}
function pintarPublicar() {
  const t = app.tour;
  const ref = nombreBase();
  const url = urlPublica();
  const op = { calidad: prefs.calidad ?? "movil", planta: t.plantas.find((pl) => pl.plano?.imagen || pl.muros?.length)?.id ?? t.plantas[0]?.id, medidas: true };
  const copiar = (txt) => async () => { try { await navigator.clipboard.writeText(txt); toast("Copiado", "ok"); } catch { toast("No se pudo copiar: selecciónalo y usa Ctrl+C", "aviso"); } };
  const qrSVG = (margen) => QR.qrSVG(url, { margen, color: "#000000", fondo: "#ffffff" });

  // 1 · Tu web
  const zipWeb = accion({ boton: "Descargar mi recorrido (ZIP)", necesita: ["exportarZIP"], fn: async (prog) => {
    const { t: tt, archivos } = datosPublicos();
    const z = await EXP.exportarZIP(tt, archivos, { incluirVisor: true, onProgreso: prog });
    descargar(z, `${ref}.zip`);
    return z.avisos?.length ? `Descargado (${fmtMB(z.size)}). Aviso: ${z.avisos[0]}` : `Descargado (${fmtMB(z.size)})`;
  } });
  const web = h("input", { type: "url", id: "web-publicar", value: t.marca?.web ?? "", placeholder: "https://www.tu-inmobiliaria.com", autocomplete: "url", "aria-describedby": "web-publicar-err" });
  const errWeb = h("small", { class: "c8-error", id: "web-publicar-err", "aria-live": "polite" });
  web.onchange = () => {
    const v = web.value.trim().replace(/\/+$/, "");
    if (v && !(urlPermitida(v) && /^https?:\/\/[^/\s]+/i.test(v))) { errWeb.textContent = "Escribe la dirección completa de tu web, empezando por https://"; web.setAttribute("aria-invalid", "true"); return; }
    errWeb.textContent = ""; web.setAttribute("aria-invalid", "false");
    if (v !== String(t.marca?.web ?? "").trim()) fijarWeb(v); // repinta Publicar (evento «perfil» o cambio del proyecto)
    pintarExportar();
  };
  let enlace;
  if (url) {
    const qr = h("div", { class: "qr", "aria-label": `Código QR del enlace ${url}`, role: "img" });
    if (QR?.qrSVG) qr.innerHTML = qrSVG(2);
    const codigo = `<iframe src="${url}" width="100%" height="600" style="border:0;border-radius:12px" allow="fullscreen; gyroscope; accelerometer; xr-spatial-tracking" allowfullscreen loading="lazy" title="Recorrido virtual ${ref}"></iframe>`;
    enlace = h("div", { class: "pasos-publicar" },
      h("div", { style: { display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 } },
        h("div", { class: "codigo" }, h("code", { text: url }), h("button", { class: "btn peq icono-btn", "aria-label": "Copiar enlace", title: "Copiar enlace", onclick: copiar(url) }, icono("copiar", 14))),
        h("details", {}, h("summary", { class: "suave", style: { cursor: "pointer" }, text: "Código para incrustarlo en tu web (WordPress, Wix…)" }),
          h("div", { class: "codigo", style: { marginTop: "6px" } }, h("code", { text: codigo }), h("button", { class: "btn peq icono-btn", "aria-label": "Copiar código", onclick: copiar(codigo) }, icono("copiar", 14))))),
      qr);
  } else enlace = h("p", { class: "nota-c8", role: "note", text: "Escribe tu web para ver el enlace y el QR." });
  const tuWeb = destino("1", "Tu web", "Tres pasos para tenerlo en tu web y compartir el enlace.",
    h("ol", { class: "pasos-web" },
      h("li", {}, h("b", { text: "Descarga tu recorrido. " }), "Es una carpeta comprimida lista para tu web (sin los documentos privados del proyecto).",
        h("div", { class: "fila", style: { marginTop: "8px" } }, zipWeb.b), zipWeb.prog, zipWeb.estado),
      h("li", {}, h("b", { text: "Súbelo a tu web. " }), "Descomprímelo y súbelo con el gestor de archivos de tu hosting (o por FTP) a la carpeta ", h("code", { text: `/tours/${ref}/` }), ". Dentro deben quedar index.html, tour.json y la carpeta panos."),
      h("li", {}, h("b", { text: "Comparte el enlace." }),
        h("div", { class: "c8-campo campo-web", "data-campo": "web" }, h("label", { for: "web-publicar", text: "Tu web (la de Mi inmobiliaria)" }), web, errWeb),
        enlace)));

  // 2 · Portales y redes
  const tieneMusica = !!t.audio?.musica?.archivo;
  const opVideo = { formato: prefs.formato ?? "16:9", conMarca: true, conMusica: tieneMusica };
  const fotos360 = tarjeta({ ic: "fotos", titulo: "Fotos 360", texto: "Fotos que Facebook, Google e idealista muestran en 360. Se ajustan a menos de 8 MB por foto.",
    boton: "Descargar fotos 360 (ZIP)", necesita: ["jpegConGPano"], fn: async (prog) => {
      const ps = t.panoramas, ent = [];
      const conBrujula = t._estudio.norteFijado || ps.some((p) => t._estudio.meta[p.imagen]?.brujula != null);
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i], b = app.archivos.get(p.imagen);
        if (!b) continue;
        const rumboInicial = p.rumbo_inicial != null ? norm360(p.rumbo_inicial - (p.yaw ?? 0)) : 0;
        // Rumbo de brújula del centro de la foto: yaw (en el plano) + norte (rumbo de «arriba del plano»).
        const rumboNorte = conBrujula ? norm360((p.yaw ?? 0) + (t.norte ?? 0)) : undefined;
        const j = await EXP.jpegConGPano(b, { rumboInicial, maxMB: 7.5, rumboNorte });
        ent.push({ ruta: `${String(i + 1).padStart(2, "0")}-${slug(nombreDe(p))}.jpg`, datos: new Uint8Array(await j.arrayBuffer()) });
        prog((i + 1) / ps.length);
      }
      let zip;
      try { const { zipSync } = await import("./vendor/fflate.js"); zip = new Blob([zipSync(Object.fromEntries(ent.map((e) => [e.ruta, [e.datos, { level: 0 }]])))], { type: "application/zip" }); }
      catch { zip = zipAlmacenado(ent); }
      descargar(zip, `${ref}-fotos-360.zip`);
      return `${ent.length} fotos (${fmtMB(zip.size)})`;
    } });
  // Sin plano (ninguna imagen, muro ni estancia) no hay «Plano con medidas» (E4): saldría un documento engañoso.
  const plano = tienePlano(t) ? tarjeta({ ic: "plano", titulo: "Plano con medidas", texto: "Imagen del plano a escala con estancias, m², norte y tu marca. Para el anuncio y el dossier.",
    controles: [h("div", { class: "fila" },
      t.plantas.length > 1 ? sel(t.plantas.map((p) => [p.id, textoDe(p.nombre)]), op.planta, (v) => { op.planta = v; }, "Planta") : null,
      casilla("Con medidas", true, (v) => { op.medidas = v; }))],
    boton: "Descargar plano", necesita: ["exportarPlano"], fn: async () => {
      const { t: tt, archivos } = datosPublicos();
      const b = await EXP.exportarPlano(tt, op.planta, { px: 2400, medidas: op.medidas, archivos });
      descargar(b, `${ref}-plano${t.plantas.length > 1 ? "-" + op.planta : ""}.png`);
      return `Descargado (${fmtMB(b.size)})`;
    } }) : null;
  const tablaPortales = h("details", { class: "avanzado", style: { marginTop: "12px" } }, h("summary", { text: "¿Qué subo a cada portal?" }),
    h("div", { class: "contenido" }, h("table", { class: "tabla-portales" },
      h("thead", {}, h("tr", {}, h("th", { text: "Dónde" }), h("th", { text: "Qué subir" }))),
      h("tbody", {},
        h("tr", {}, h("td", {}, h("b", { text: "idealista" })), h("td", { text: `El vídeo (16:9) en la sección de vídeo${tienePlano(t) ? ", el plano en «planos»" : ""} y las fotos 360 si tu plan incluye visita virtual. El enlace del recorrido solo si idealista admite tu proveedor.` })),
        h("tr", {}, h("td", {}, h("b", { text: "Fotocasa / habitaclia" })), h("td", { text: `Vídeo${tienePlano(t) ? ", plano" : ""} y fotos 360. El campo «visita virtual» solo acepta proveedores homologados: compruébalo en tu panel antes de pegar el enlace.` })),
        h("tr", {}, h("td", {}, h("b", { text: "Tu web y Google" })), h("td", { text: "El enlace o el código para incrustar (1 · Tu web). En tu ficha de Google, las fotos 360." })),
        h("tr", {}, h("td", {}, h("b", { text: "Instagram, TikTok, Reels" })), h("td", { text: "El vídeo vertical 9:16 con tu marca. En Facebook, además, las fotos 360 (se ven interactivas)." })),
        h("tr", {}, h("td", {}, h("b", { text: "WhatsApp y email" })), h("td", { text: "El enlace del recorrido o, si el cliente no tiene buena conexión, el «Recorrido en un solo archivo» (3 · Para tus clientes)." }))))));
  const portales = destino("2", "Portales y redes", "", h("div", { class: "exportes" }, fotos360, tarjetaVideo(opVideo, tieneMusica), plano), tablaPortales);

  // 3 · Para tus clientes
  const dossier = tarjeta({ ic: "datos", titulo: "Dossier en PDF", texto: `Ficha A4 con portada, datos${tienePlano(t) ? ", plano" : ""}, certificado energético${url ? " y código QR" : ""}. Se abre en una pestaña: usa «Guardar como PDF».`,
    boton: "Abrir dossier", necesita: ["abrirFichaImprimible"], fn: async () => {
      const { t: tt, archivos } = datosPublicos();
      // Captura de portada con tope de 1,5 s: la ventana debe abrirse aún dentro del gesto del usuario (si no, se bloquea).
      let portada;
      const cap = app.vistaPrevia.ventana()?.visor?.capturar?.();
      if (cap?.then) {
        try { const b = await Promise.race([cap, new Promise((res) => setTimeout(res, 1500))]); if (b instanceof Blob) { archivos.set("portada.png", b); portada = "portada.png"; } } catch {}
      }
      EXP.abrirFichaImprimible(tt, { enlace: urlPublica() ?? undefined, archivos, portada });
      return "Abierto en una pestaña nueva";
    } });
  const unArchivo = tarjeta({ ic: "abrir", titulo: "Recorrido en un solo archivo", texto: "Se abre con doble clic, sin internet. Para enviarlo por email o WeTransfer, o enseñarlo en la oficina.",
    controles: [sel([["movil", "Calidad estándar (4K, recomendado)"], ["alta", "Alta calidad (8K, archivo grande)"]], op.calidad, (v) => { prefs.calidad = v; guardarPrefs(); }, "Calidad")],
    boton: "Crear el archivo", necesita: ["exportarHTMLAutonomo"], fn: async (prog) => {
      const { t: tt, archivos } = datosPublicos();
      const b = await EXP.exportarHTMLAutonomo(tt, archivos, { calidad: prefs.calidad ?? "movil", onProgreso: prog });
      descargar(b, `${ref}.html`);
      return b.superaLimite ? `Descargado, pero pesa ${fmtMB(b.tamano ?? b.size)}: puede ir lento. Prueba la calidad estándar.` : `Descargado (${fmtMB(b.tamano ?? b.size)})`;
    } });
  const qrCliente = h("div", { class: "exporte" }, h("h3", {}, icono("descargar", 18), "Código QR del recorrido"),
    h("p", { text: url ? "Para carteles, escaparates y folletos. Lleva al enlace de tu web." : "Escribe tu web en «1 · Tu web» para crear el QR (nunca se genera uno de ejemplo)." }),
    h("div", { class: "fila" }, h("button", { class: "btn", disabled: !url || !QR, onclick: () => descargar(new Blob([qrSVG(4)], { type: "image/svg+xml" }), `${ref}-qr.svg`) }, icono("descargar", 14), "Descargar QR")));
  const clientes = destino("3", "Para tus clientes", "", h("div", { class: "exportes" }, dossier, unArchivo, qrCliente));

  // Avanzado
  const avanzado = h("details", { class: "avanzado", open: !!prefs.avanzadoAbierto }, h("summary", { text: "Avanzado" }),
    h("div", { class: "contenido" }, h("div", { class: "exportes" },
      tarjeta({ ic: "descargar", titulo: "Archivo de configuración (tour.json)", texto: "Solo tour.json, sin fotos. Útil si un técnico ya tiene las imágenes publicadas.",
        boton: "Descargar tour.json", fn: async () => { const { t: tt } = datosPublicos(); descargar(new Blob([JSON.stringify(tt, null, 2)], { type: "application/json" }), "tour.json"); return "Descargado"; } }))));
  avanzado.addEventListener("toggle", () => { prefs.avanzadoAbierto = avanzado.open; guardarPrefs(); });

  raizE.replaceChildren(...[
    h("div", { class: "cab-seccion" }, h("div", {}, h("h1", { text: "Publicar" }),
      h("p", { text: "Primero, tu web. Después, lo que necesites para los portales, las redes y tus clientes. Todo se prepara en tu ordenador." }))),
    antesDePublicar(),
    !EXP && errorExp ? h("div", { class: "comprobacion aviso", style: { marginBottom: "16px" } }, icono("aviso", 20), h("div", {}, h("b", { text: "Algunas descargas no están disponibles" }), h("p", { text: "Recarga la página. Mientras tanto puedes descargar la copia de seguridad (Proyecto ▾) y el archivo de configuración." })), h("span")) : null,
    tuWeb, portales, clientes, avanzado,
  ].filter(Boolean));
}

/** Copia de seguridad: tour.json completo + estudio/proyecto.json (proyecto de trabajo íntegro) + todos sus archivos. */
export async function copiaDeSeguridad(prog = () => {}) {
  const tExp = tourParaExportar(app.tour, { publico: false });
  const archivos = new Map();
  for (const r of rutasUsadas(app.tour)) archivos.set(r, app.archivos.get(r));
  const proyecto = { app: "cre8eight Estudio", version: 2, fecha: new Date().toISOString(), nombre: app.proyecto?.nombre ?? "", tour: app.tour };
  archivos.set("estudio/proyecto.json", new Blob([JSON.stringify(proyecto)], { type: "application/json" }));
  const fecha = new Date().toISOString().slice(0, 10);
  let zip;
  if (EXP?.exportarZIP) zip = await EXP.exportarZIP(tExp, archivos, { copiaSeguridad: true, incluirVisor: false, onProgreso: prog });
  else {
    const enc = new TextEncoder();
    const ent = [{ ruta: "tour.json", datos: enc.encode(JSON.stringify(tExp, null, 2)) }];
    for (const [ruta, b] of archivos) ent.push({ ruta, datos: new Uint8Array(await b.arrayBuffer()) });
    zip = zipAlmacenado(ent);
  }
  descargar(zip, `${nombreBase()}-copia-de-seguridad-${fecha}.zip`);
  return `Descargada (${fmtMB(zip.size)}). Guárdala fuera de este ordenador.`;
}

function tarjetaVideo(op, tieneMusica) {
  let control = null;
  return tarjeta({
    ic: "video", titulo: "Vídeo de la visita",
    texto: "Graba la visita guiada desde la vista previa: 16:9 para portales y YouTube, 9:16 para Reels, TikTok y Stories. Tarda lo mismo que la visita.",
    controles: [h("div", { class: "fila" },
      sel([["16:9", "Horizontal 16:9"], ["9:16", "Vertical 9:16"], ["1:1", "Cuadrado 1:1"]], op.formato, (v) => { op.formato = v; prefs.formato = v; guardarPrefs(); }, "Formato"),
      casilla("Con marca y precio", true, (v) => { op.conMarca = v; }),
      casilla("Incluir música", tieneMusica, (v) => { op.conMusica = v; }, { disabled: !tieneMusica, title: tieneMusica ? "" : "Añade música en «Más herramientas → Extras»" }))],
    boton: "Grabar vídeo", necesita: ["grabarVideo"],
    fn: async (prog) => {
      const w = app.vistaPrevia.ventana();
      const visor = w?.visor;
      if (!visor) throw new Error("la vista previa todavía se está cargando");
      control = new AbortController();
      const [rw, rh] = { "16:9": [16, 9], "9:16": [9, 16], "1:1": [1, 1] }[op.formato];
      const alto = 1080;
      const Wv = rw >= rh ? Math.round((alto * rw) / rh) : alto, Hv = rw >= rh ? alto : Math.round((alto * rh) / rw);
      const ifr = app.vistaPrevia.iframe;
      const dpr = w.devicePixelRatio || 1;
      // El iframe adopta la proporción del vídeo (a su resolución) y se escala para que quepa en pantalla.
      const cw = Wv / dpr, ch = Hv / dpr;
      const k = Math.min((innerWidth - 40) / cw, (innerHeight - 120) / ch, 1);
      document.body.classList.add("grabando");
      Object.assign(ifr.style, { width: `${cw}px`, height: `${ch}px`, transform: `scale(${k})` });
      const cancelar = h("button", { class: "btn peligro", style: { position: "fixed", top: "16px", right: "16px", zIndex: 41 }, onclick: () => control.abort() }, "Cancelar grabación");
      const rotulo = h("div", { class: "vista-modo", style: { position: "fixed", zIndex: 41 }, text: `Grabando ${op.formato}…` });
      document.body.append(cancelar, rotulo);
      try {
        await new Promise((r) => setTimeout(r, 600));
        const r = await EXP.grabarVideo(visor, { formato: op.formato, fps: 30, alto, conMarca: op.conMarca, conMusica: op.conMusica,
          onProgreso: (f) => { prog(f); rotulo.textContent = `Grabando ${op.formato}… ${Math.round(f * 100)} %`; }, senal: control.signal });
        descargar(r.blob, `${nombreBase()}-${op.formato.replace(":", "x")}.${r.extension}`);
        return `Vídeo ${r.extension.toUpperCase()} ${r.ancho ?? ""}×${r.alto ?? ""} (${fmtMB(r.blob.size)})`;
      } finally {
        document.body.classList.remove("grabando");
        Object.assign(ifr.style, { width: "", height: "", transform: "" });
        cancelar.remove(); rotulo.remove();
      }
    },
  });
}
export const seccionPublicar = {
  id: "publicar", titulo: "Publicar", corto: "Publicar",
  resumen: () => {
    const { errores, avisos } = pendientes();
    return { texto: !app.tour.panoramas.length ? "Tu web, portales y redes" : errores ? `${errores} por corregir` : avisos ? `Listo · ${avisos} ${avisos === 1 ? "sugerencia" : "sugerencias"}` : "Listo para publicar", hecho: app.tour.panoramas.length > 0 && !errores };
  },
  render: renderExportar,
  actualizar: () => { if (!raizE?.contains(document.activeElement) || /^(BUTTON|SUMMARY)$/.test(document.activeElement?.tagName)) pintarExportar(); },
  salir: () => { raizE = null; },
};
on("exportar-listo", () => pintarExportar());
on("perfil", () => pintarExportar());
