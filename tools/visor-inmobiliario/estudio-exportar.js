// Revisar (lista de comprobación) y Publicar (web, portales y redes, avanzado).
import { slug, norm360, zipAlmacenado } from "./estudio-util.js";
import { app, h, icono, emitir, on, toast, textoDe, colocado, calcularEnlaces, tourParaExportar, archivosParaExportar, rutasUsadas,
  fmtMB, esRapido, archivosFaltantes, urlsNoValidas, urlPermitida, MENSAJE_URL } from "./estudio-nucleo.js";
import { problemaVariante, nombreEstilo, origenDe } from "./estudio-variantes.js";

// ------------------------------------------------------------------ exportar.js (otro módulo; puede no existir aún)
let EXP = null, errorExp = null, QR = null;
import("./exportar.js").then((m) => { EXP = m; emitir("exportar-listo"); }).catch((e) => { errorExp = e; console.warn("exportar.js no disponible", e); emitir("exportar-listo"); });
import("./vendor/qr.js").then((m) => { QR = m; emitir("exportar-listo"); }).catch(() => {});

// ------------------------------------------------------------------ validación
const nombreDe = (p) => textoDe(p?.nombre) || p?.id || "";
const lista = (xs, n = 4) => xs.slice(0, n).join(", ") + (xs.length > n ? ` y ${xs.length - n} más` : "");

/** → [{id, nivel: "error" | "aviso" | "ok", titulo, detalle, ir: {seccion, pestana}}]  ("aviso" = sugerencia) */
export function comprobar() {
  const t = app.tour;
  if (!t) return [];
  const r = [];
  const add = (id, nivel, titulo, detalle, ir) => r.push({ id, nivel, titulo, detalle, ir });
  const ps = t.panoramas, rapido = esRapido(), meta = t._estudio.meta;
  const I = t.inmueble ?? {}, CE = I.certificado_energetico ?? {}, C = t.contacto ?? {};
  // Fotos
  if (!ps.length) add("fotos", "error", "Aún no hay fotos 360", "Sube al menos una foto panorámica.", { seccion: "fotos" });
  else add("fotos", "ok", `${ps.length} fotos 360`, "", { seccion: "fotos" });
  const raras = ps.filter((p) => { const m = meta[p.imagen]; return m && Math.abs(m.w / m.h - 2) > 0.02; });
  if (raras.length) add("ratio", "aviso", "Fotos que no parecen 360 completas", `${lista(raras.map(nombreDe))}. Expórtalas desde DJI Mimo como “Foto panorámica 360”.`, { seccion: "fotos" });
  const faltan = archivosFaltantes(t);
  if (faltan.length) add("archivos", "error", `Faltan ${faltan.length} archivo(s) del proyecto`, `No se encuentran: ${lista(faltan.map((f) => f.donde), 3)}. Vuelve a subirlos o restaura una copia de seguridad.`, { seccion: "fotos" });
  // Plano
  const sinPos = ps.filter((p) => !colocado(p));
  if (ps.length) {
    if (!sinPos.length) add("posicion", "ok", "Todas las fotos están en el plano", "", { seccion: "plano" });
    else if (rapido && sinPos.length === ps.length) add("posicion", "ok", "Sin plano: las fotos se conectan en el orden de la lista", "", { seccion: "plano" });
    else add("posicion", rapido ? "aviso" : "error", `${sinPos.length} foto(s) sin colocar en el plano`,
      rapido ? `Se conectarán en el orden de la lista: ${lista(sinPos.map(nombreDe))}.` : lista(sinPos.map(nombreDe)), { seccion: "plano" });
  }
  const sinCal = t.plantas.filter((pl) => pl.plano?.imagen && !t._estudio.calibrado?.[pl.id]);
  if (sinCal.length) add("calibrar", "aviso", "Plano sin calibrar", `Las medidas y los m² no serán reales: ${lista(sinCal.map((p) => textoDe(p.nombre)))}.`, { seccion: "plano" });
  // Conexiones y dirección
  if (ps.length > 1) {
    const { vecinos } = calcularEnlaces();
    const aisl = ps.filter((p) => !(vecinos.get(p.id)?.length));
    if (aisl.length) add("aislados", "error", `${aisl.length} foto(s) sin conectar`, `No se puede llegar a: ${lista(aisl.map(nombreDe))}. Acércalas a otra foto en el plano o usa «Conectar».`, { seccion: "plano" });
    else {
      const ini = t.inicio && vecinos.has(t.inicio) ? t.inicio : ps[0].id;
      const vistos = new Set([ini]); const cola = [ini];
      while (cola.length) for (const v of vecinos.get(cola.shift()) ?? []) if (!vistos.has(v)) { vistos.add(v); cola.push(v); }
      const fuera = ps.filter((p) => !vistos.has(p.id));
      if (fuera.length) add("conexo", "aviso", "Hay zonas que no se conectan con el inicio", `No se llega a: ${lista(fuera.map(nombreDe))}. Falta una conexión (p. ej. la escalera entre plantas).`, { seccion: "plano" });
      else add("aislados", "ok", "Todas las fotos están conectadas", "", { seccion: "plano" });
    }
    const brujula = (p) => meta[p.imagen]?.brujula != null;
    const sinDir = ps.filter((p) => !p.yaw && !brujula(p));
    if (sinDir.length) add("yaw", "aviso", `${sinDir.length} ${sinDir.length === 1 ? "foto sin orientar" : "fotos sin orientar"}`,
      `Las flechas del suelo pueden no coincidir con las puertas: ${lista(sinDir.map(nombreDe))}. Usa el asistente de «Dirección y notas».`, { seccion: "orientar" });
    const porRevisar = rapido ? [] : ps.filter((p) => brujula(p) && !meta[p.imagen]?.brujulaRevisada);
    if (porRevisar.length) add("brujula", "aviso", "Dirección por brújula sin revisar", `Comprueba que las flechas coinciden con las puertas: ${lista(porRevisar.map(nombreDe))}.`, { seccion: "orientar" });
  }
  const sinTit = ps.flatMap((p) => (p.puntos ?? []).filter((pt) => !textoDe(pt.titulo).trim()).map(() => nombreDe(p)));
  if (sinTit.length) add("puntos", "aviso", "Notas sin título", lista([...new Set(sinTit)]), { seccion: "orientar" });
  // Datos legales
  if (CE.en_tramite) add("ce", "ok", "Certificado energético: en trámite", "", { seccion: "datos", pestana: "inmueble" });
  else if (!CE.consumo_letra || !CE.emisiones_letra) add("ce", "error", "Falta el certificado energético", "Es obligatorio en los anuncios de venta y alquiler en España: letra de consumo y de emisiones, o «en trámite».", { seccion: "datos", pestana: "inmueble" });
  else add("ce", "ok", `Certificado energético ${CE.consumo_letra} / ${CE.emisiones_letra}`, "", { seccion: "datos", pestana: "inmueble" });
  const modo = C.modo ?? "whatsapp";
  const faltaWa = modo !== "webhook" && !/^\d{8,15}$/.test(String(C.whatsapp ?? "").replace(/[\s+()-]/g, ""));
  const faltaHook = modo !== "whatsapp" && !urlPermitida(C.webhook ?? "x", { soloHttps: true });
  if (faltaWa || faltaHook) add("contacto", "error", "Falta el contacto", faltaWa ? "Escribe el WhatsApp de la empresa (con el prefijo 34)." : "Escribe la dirección de conexión de tu CRM (empieza por https://).", { seccion: "datos", pestana: "contacto" });
  else add("contacto", "ok", modo === "ambos" ? "Contacto por WhatsApp y CRM" : modo === "webhook" ? "Contacto por tu CRM" : "Contacto por WhatsApp", "", { seccion: "datos", pestana: "contacto" });
  if (!C.url_privacidad) add("privacidad", modo === "whatsapp" ? "aviso" : "error", "Falta la política de privacidad", "El formulario recoge datos personales (RGPD): enlaza tu política de privacidad.", { seccion: "datos", pestana: "contacto" });
  const malas = urlsNoValidas(t);
  if (malas.length) add("urls", "error", `${malas.length} dirección(es) web no válidas`, `${lista(malas.map((m) => m.donde), 3)}. ${MENSAJE_URL}`, { seccion: "datos", pestana: "contacto" });
  // Variantes, renders e IA
  const problemas = [];
  for (const p of ps) for (const v of p.variantes ?? []) { const pr = problemaVariante(p, v); if (pr) problemas.push(pr); }
  if (problemas.length) add("variantes", problemas.some((x) => x.nivel === "error") ? "error" : "aviso",
    problemas.length === 1 ? "Una versión no encaja con su foto original" : `${problemas.length} versiones no encajan con su foto original`, problemas[0].texto, { seccion: "variantes" });
  const nIA = ps.reduce((s, p) => s + (p.variantes ?? []).filter((v) => origenDe(v) === "ia").length, 0);
  const nRender = (t.galeria ?? []).filter((g) => g.tipo === "render").length + ps.filter((p) => p.origen === "render" || meta[p.imagen]?.render).length
    + ps.reduce((s, p) => s + (p.variantes ?? []).filter((v) => origenDe(v) === "render").length, 0);
  if ((nIA || nRender) && !textoDe(I.aviso_legal).trim()) {
    const que = [nRender ? `${nRender} render(s)` : null, nIA ? `${nIA} imagen(es) con IA` : null].filter(Boolean).join(" y ");
    add("aviso_legal", "error", "Falta el rótulo legal de las imágenes", `Hay ${que}. Indica que son imágenes orientativas (no contractuales).`, { seccion: "datos", pestana: "personalizacion" });
  }
  if (ps.some((p) => p.mascara)) {
    const sinM = ps.flatMap((p) => (p.mascara ? (p.variantes ?? []).filter((v) => v.estilo && v.estilo !== "original" && !v.mascara).map((v) => `${nombreDe(p)} · ${nombreEstilo(v.estilo)}`) : []));
    if (sinM.length) add("mascaras", "aviso", "Estilos sin máscara: en ellos no se podrá cambiar el color", lista(sinM, 3), { seccion: "variantes" });
    if (!(t.personalizacion?.paredes?.length || t.personalizacion?.suelos?.length)) add("paleta", "aviso", "Hay máscaras pero ningún color en la paleta", "", { seccion: "datos", pestana: "personalizacion" });
  }
  // Música
  if (t.audio?.musica?.archivo && !t._estudio.musicaLicencia) add("musica", "error", "Falta confirmar la licencia de la música", "Marca «Tengo licencia para usar esta música en la web y en anuncios» o quita la música.", { seccion: "datos", pestana: "musica" });
  // Recomendados
  if (!textoDe(t.titulo).trim()) add("titulo", "aviso", "Falta el título del anuncio", "", { seccion: "datos", pestana: "inmueble" });
  if (!I.precio) add("precio", "aviso", "Falta el precio", "", { seccion: "datos", pestana: "inmueble" });
  if (!I.referencia) add("ref", "aviso", "Falta la referencia", "Se usa para la carpeta de publicación (/tours/<referencia>/).", { seccion: "datos", pestana: "inmueble" });
  if (!rapido && !t.marca?.nombre) add("marca", "aviso", "Falta el nombre de la inmobiliaria", "", { seccion: "datos", pestana: "contacto" });
  if (!rapido && (t.idiomas ?? []).includes("en")) {
    const sinEn = [t.titulo, I.descripcion].filter((x) => textoDe(x, "es").trim() && !(typeof x === "object" && x?.en?.trim())).length
      + ps.filter((p) => !(typeof p.nombre === "object" && p.nombre?.en?.trim())).length;
    if (sinEn) add("trad", "aviso", `${sinEn} texto(s) sin traducir al inglés`, "Se mostrarán en español.", { seccion: "datos", pestana: "textos" });
  }
  if (app.guardado === "error") add("guardado", "aviso", "El navegador no está guardando el proyecto", "Descarga una copia de seguridad (Publicar → Avanzado) para no perder el trabajo.", { seccion: "exportar" });
  return r;
}

// ------------------------------------------------------------------ Revisar
let raizR = null;
function renderRevisar(cont) {
  raizR = h("section", { class: "seccion" });
  cont.append(raizR);
  pintarRevisar();
}
function pintarRevisar() {
  if (!raizR) return;
  const r = comprobar();
  const orden = { error: 0, aviso: 1, ok: 2 };
  r.sort((a, b) => orden[a.nivel] - orden[b.nivel]);
  const nE = r.filter((x) => x.nivel === "error").length, nA = r.filter((x) => x.nivel === "aviso").length, nO = r.filter((x) => x.nivel === "ok").length;
  const vacio = !app.tour.panoramas.length;
  const titulo = vacio ? "Revisar antes de publicar" : nE ? `${nE} ${nE === 1 ? "cosa por corregir" : "cosas por corregir"} antes de publicar` : `Listo para publicar · ${nA} ${nA === 1 ? "sugerencia" : "sugerencias"}`;
  const texto = vacio ? "Añade las fotos 360 para empezar." : nE ? "Lo marcado en rojo afecta a la experiencia del cliente o a la ley." : nA ? "Puedes publicar ya. Las sugerencias ayudan a pulir el recorrido." : "Todo está en orden.";
  raizR.replaceChildren(
    h("div", { class: "cab-seccion" }, h("div", {}, h("h1", { text: titulo }), h("p", { text: texto }))),
    h("div", { class: "resumen-val" },
      h("div", { class: "caja" }, h("b", { text: nE, style: { color: nE ? "var(--error)" : "var(--texto)" } }), h("span", { text: nE === 1 ? "por corregir" : "por corregir" })),
      h("div", { class: "caja" }, h("b", { text: nA, style: { color: nA ? "var(--aviso)" : "var(--texto)" } }), h("span", { text: nA === 1 ? "sugerencia" : "sugerencias" })),
      h("div", { class: "caja" }, h("b", { text: nO, style: { color: "var(--ok)" } }), h("span", { text: "correctos" }))),
    h("div", { class: "comprobaciones" }, r.map((c) => h("div", { class: `comprobacion ${c.nivel}` },
      icono(c.nivel === "ok" ? "ok" : c.nivel === "error" ? "error" : "aviso", 20),
      h("div", {}, h("b", { text: c.titulo }), c.detalle ? h("p", { text: c.detalle }) : null),
      c.nivel !== "ok" && c.ir ? h("button", { class: "btn peq", onclick: () => emitir("ir", c.ir) }, c.nivel === "error" ? "Corregir" : "Ver") : h("span")))));
}
export const seccionRevisar = {
  id: "revisar", titulo: "Revisar", corto: "Revisar",
  resumen: () => {
    if (!app.tour.panoramas.length) return { texto: "Antes de publicar" };
    const r = comprobar(); const e = r.filter((x) => x.nivel === "error").length, a = r.filter((x) => x.nivel === "aviso").length;
    return { texto: e ? `${e} por corregir` : `Listo · ${a} ${a === 1 ? "sugerencia" : "sugerencias"}`, hecho: !e };
  },
  render: renderRevisar, actualizar: pintarRevisar, salir: () => { raizR = null; },
};

// ------------------------------------------------------------------ Publicar
let raizE = null;
const prefs = (() => { try { return JSON.parse(localStorage.getItem("estudio:publicar") ?? "{}"); } catch { return {}; } })();
const guardarPrefs = () => { try { localStorage.setItem("estudio:publicar", JSON.stringify(prefs)); } catch {} };
function nombreBase() { return slug(app.tour.inmueble?.referencia || textoDe(app.tour.titulo) || "recorrido"); }
function webBase() {
  const w = (prefs.web || app.tour.marca?.web || "").trim();
  return urlPermitida(w) && /^https?:\/\//i.test(w) ? w.replace(/\/+$/, "") : "https://www.tu-inmobiliaria.com";
}
const urlPublica = () => `${webBase()}/tours/${nombreBase()}/`;
function descargar(blob, nombre) {
  if (EXP?.descargar) return EXP.descargar(blob, nombre);
  const a = h("a", { href: URL.createObjectURL(blob), download: nombre });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}
/** Lo que se publica: sin documentación privada ni la carpeta estudio/ (C1). */
function datosPublicos() {
  const t = tourParaExportar(app.tour, { publico: true });
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

function renderExportar(cont) {
  raizE = h("section", { class: "seccion" });
  cont.append(raizE);
  pintarExportar();
}
function pintarExportar() {
  if (!raizE) return;
  const t = app.tour;
  const val = comprobar();
  const nE = val.filter((x) => x.nivel === "error").length;
  const ref = nombreBase();
  const op = { calidad: prefs.calidad ?? "movil", planta: t.plantas[0]?.id, medidas: true };
  const url = urlPublica();
  const copiar = (txt) => async () => { try { await navigator.clipboard.writeText(txt); toast("Copiado", "ok"); } catch { toast("No se pudo copiar: selecciónalo y usa Ctrl+C", "aviso"); } };

  // 1 · Publicar mi recorrido (lo principal)
  const zipWeb = accion({ boton: "Descargar mi recorrido (ZIP)", necesita: ["exportarZIP"], fn: async (prog) => {
    const { t: tt, archivos } = datosPublicos();
    const z = await EXP.exportarZIP(tt, archivos, { incluirVisor: true, onProgreso: prog });
    descargar(z, `${ref}.zip`);
    return z.avisos?.length ? `Descargado (${fmtMB(z.size)}). Aviso: ${z.avisos[0]}` : `Descargado (${fmtMB(z.size)})`;
  } });
  const web = h("input", { type: "url", value: prefs.web || t.marca?.web || "", placeholder: "https://www.tu-inmobiliaria.com", "aria-label": "Dirección de tu web", autocomplete: "url" });
  const errWeb = h("small", { class: "error-campo", hidden: true });
  web.onchange = () => {
    const v = web.value.trim();
    if (v && !(urlPermitida(v) && /^https?:\/\//i.test(v))) { errWeb.hidden = false; errWeb.textContent = "Escribe la dirección completa de tu web, empezando por https://"; return; }
    errWeb.hidden = true; prefs.web = v; guardarPrefs(); pintarExportar();
  };
  const qr = h("div", { class: "qr", "aria-label": `Código QR del enlace ${url}`, role: "img" });
  if (QR?.qrSVG) qr.innerHTML = QR.qrSVG(url, { margen: 2, color: "#000000", fondo: "#ffffff" });
  const codigo = `<iframe src="${url}" width="100%" height="600" style="border:0;border-radius:12px" allow="fullscreen; gyroscope; accelerometer; xr-spatial-tracking" allowfullscreen loading="lazy" title="Recorrido virtual ${ref}"></iframe>`;
  const principal = h("div", { class: "tarjeta tarjeta-principal publicar" },
    h("h2", { style: { margin: "0 0 4px", font: "500 20px/1.25 var(--serif)" }, text: "Publicar mi recorrido" }),
    h("p", { class: "suave", style: { margin: "0 0 8px" }, text: "Tres pasos para tenerlo en tu web y compartir el enlace." }),
    h("ol", {},
      h("li", {}, h("b", { text: "Descarga tu recorrido. " }), "Es una carpeta comprimida lista para tu web (sin los documentos privados del proyecto).",
        h("div", { class: "fila", style: { marginTop: "8px" } }, zipWeb.b), zipWeb.prog, zipWeb.estado),
      h("li", {}, h("b", { text: "Súbelo a tu web. " }), "Descomprímelo y súbelo con el gestor de archivos de tu hosting (o por FTP) a la carpeta ", h("code", { text: `/tours/${ref}/` }), ". Dentro deben quedar index.html, tour.json y la carpeta panos."),
      h("li", {}, h("b", { text: "Comparte el enlace. " }), "Escribe la dirección de tu web para ver el enlace final y su código QR:",
        h("div", { class: "pasos-publicar", style: { marginTop: "8px" } },
          h("div", { style: { display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 } },
            h("div", { class: "campo" }, h("span", { text: "Dirección de tu web" }), web, errWeb),
            h("div", { class: "codigo" }, h("code", { text: url }), h("button", { class: "btn peq icono-btn", "aria-label": "Copiar enlace", title: "Copiar enlace", onclick: copiar(url) }, icono("copiar", 14))),
            h("details", {}, h("summary", { class: "suave", style: { cursor: "pointer" }, text: "Código para incrustarlo en tu web (WordPress, Wix…)" }),
              h("div", { class: "codigo", style: { marginTop: "6px" } }, h("code", { text: codigo }), h("button", { class: "btn peq icono-btn", "aria-label": "Copiar código", onclick: copiar(codigo) }, icono("copiar", 14))))),
          h("div", { style: { display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" } }, qr,
            h("button", { class: "btn peq", disabled: !QR, onclick: () => descargar(new Blob([QR.qrSVG(url, { margen: 4, color: "#000000", fondo: "#ffffff" })], { type: "image/svg+xml" }), `${ref}-qr.svg`) }, icono("descargar", 14), "Descargar QR"))))));

  // 2 · Para portales y redes
  const tieneMusica = !!t.audio?.musica?.archivo;
  const opVideo = { formato: prefs.formato ?? "16:9", conMarca: true, conMusica: tieneMusica };
  const portales = h("div", { class: "exportes" },
    tarjeta({ ic: "fotos", titulo: "Fotos 360", texto: "Fotos que Facebook, Google e idealista muestran en 360. Se ajustan a menos de 8 MB por foto.",
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
      } }),
    tarjetaVideo(opVideo, tieneMusica),
    tarjeta({ ic: "plano", titulo: "Plano con medidas", texto: "Imagen del plano a escala con estancias, m², norte y tu marca. Para el anuncio y el dossier.",
      controles: [h("div", { class: "fila" },
        t.plantas.length > 1 ? sel(t.plantas.map((p) => [p.id, textoDe(p.nombre)]), op.planta, (v) => { op.planta = v; }, "Planta") : null,
        casilla("Con medidas", true, (v) => { op.medidas = v; }))],
      boton: "Descargar plano", necesita: ["exportarPlano"], fn: async () => {
        const { t: tt, archivos } = datosPublicos();
        const b = await EXP.exportarPlano(tt, op.planta, { px: 2400, medidas: op.medidas, archivos });
        descargar(b, `${ref}-plano${t.plantas.length > 1 ? "-" + op.planta : ""}.png`);
        return `Descargado (${fmtMB(b.size)})`;
      } }),
    tarjeta({ ic: "datos", titulo: "Dossier en PDF", texto: "Ficha A4 con portada, datos, plano, certificado energético y código QR. Se abre en una pestaña: usa «Guardar como PDF».",
      boton: "Abrir dossier", necesita: ["abrirFichaImprimible"], fn: async () => {
        const { t: tt, archivos } = datosPublicos();
        // Captura de portada con tope de 1,5 s: la ventana debe abrirse aún dentro del gesto del usuario (si no, se bloquea).
        let portada;
        const cap = app.vistaPrevia.ventana()?.visor?.capturar?.();
        if (cap?.then) {
          try { const b = await Promise.race([cap, new Promise((res) => setTimeout(res, 1500))]); if (b instanceof Blob) { archivos.set("portada.png", b); portada = "portada.png"; } } catch {}
        }
        EXP.abrirFichaImprimible(tt, { enlace: urlPublica(), archivos, portada });
        return "Abierto en una pestaña nueva";
      } }));
  const tablaPortales = h("details", { class: "avanzado", style: { marginTop: "12px" } }, h("summary", { text: "¿Qué subo a cada portal?" }),
    h("div", { class: "contenido" }, h("table", { class: "tabla-portales" },
      h("thead", {}, h("tr", {}, h("th", { text: "Dónde" }), h("th", { text: "Qué subir" }))),
      h("tbody", {},
        h("tr", {}, h("td", {}, h("b", { text: "idealista" })), h("td", { text: "El vídeo MP4 (16:9) en la sección de vídeo, el plano en «planos» y las fotos 360 si tu plan incluye visita virtual. El enlace del recorrido solo si idealista admite tu proveedor." })),
        h("tr", {}, h("td", {}, h("b", { text: "Fotocasa / habitaclia" })), h("td", { text: "Vídeo MP4, plano y fotos 360. El campo «visita virtual» solo acepta proveedores homologados: compruébalo en tu panel antes de pegar el enlace." })),
        h("tr", {}, h("td", {}, h("b", { text: "Tu web y Google" })), h("td", { text: "El enlace o el código para incrustar. En tu ficha de Google, las fotos 360." })),
        h("tr", {}, h("td", {}, h("b", { text: "Instagram, TikTok, Reels" })), h("td", { text: "El vídeo vertical 9:16 con tu marca. En Facebook, además, las fotos 360 (se ven interactivas)." })),
        h("tr", {}, h("td", {}, h("b", { text: "WhatsApp y email" })), h("td", { text: "El enlace del recorrido o, si el cliente no tiene buena conexión, el archivo HTML autónomo (en Avanzado)." }))))));

  // 3 · Avanzado
  const avanzado = h("details", { class: "avanzado", open: !!prefs.avanzadoAbierto }, h("summary", { text: "Avanzado" }),
    h("div", { class: "contenido" }, h("div", { class: "exportes" },
      tarjeta({ ic: "abrir", titulo: "Copia de seguridad del proyecto", texto: "Todo el proyecto (fotos, plano, material privado y ajustes) en un ZIP para guardarlo o abrirlo en otro ordenador con «Abrir → Restaurar copia de seguridad». No es para publicar.",
        boton: "Descargar copia de seguridad", fn: copiaDeSeguridad }),
      tarjeta({ ic: "abrir", titulo: "Archivo HTML autónomo", texto: "Un solo archivo que se abre con doble clic, sin internet. Para enviarlo por email o WeTransfer, o enseñarlo en la oficina.",
        controles: [sel([["movil", "Calidad estándar (4K, recomendado)"], ["alta", "Alta calidad (8K, archivo grande)"]], op.calidad, (v) => { prefs.calidad = v; guardarPrefs(); }, "Calidad")],
        boton: "Crear archivo HTML", necesita: ["exportarHTMLAutonomo"], fn: async (prog) => {
          const { t: tt, archivos } = datosPublicos();
          const b = await EXP.exportarHTMLAutonomo(tt, archivos, { calidad: prefs.calidad ?? "movil", onProgreso: prog });
          descargar(b, `${ref}.html`);
          return b.superaLimite ? `Descargado, pero pesa ${fmtMB(b.tamano ?? b.size)}: puede ir lento. Prueba la calidad estándar.` : `Descargado (${fmtMB(b.tamano ?? b.size)})`;
        } }),
      tarjeta({ ic: "descargar", titulo: "Archivo de configuración (para técnicos)", texto: "Solo tour.json, sin fotos. Útil si un técnico ya tiene las imágenes publicadas.",
        boton: "Descargar tour.json", fn: async () => { const { t: tt } = datosPublicos(); descargar(new Blob([JSON.stringify(tt, null, 2)], { type: "application/json" }), "tour.json"); return "Descargado"; } }))));
  avanzado.addEventListener("toggle", () => { prefs.avanzadoAbierto = avanzado.open; guardarPrefs(); });

  raizE.replaceChildren(...[
    h("div", { class: "cab-seccion" }, h("div", {}, h("h1", { text: "Publicar" }),
      h("p", { text: "Primero, publica el recorrido en tu web. Después, descarga lo que necesites para los portales y las redes. Todo se prepara en tu ordenador." }))),
    nE ? h("div", { class: "comprobacion error", style: { marginBottom: "16px" } }, icono("error", 20),
      h("div", {}, h("b", { text: `Hay ${nE} ${nE === 1 ? "cosa" : "cosas"} por corregir` }), h("p", { text: "Puedes descargar igualmente, pero revísalas antes de publicar." })),
      h("button", { class: "btn peq", onclick: () => emitir("ir", { seccion: "revisar" }) }, "Revisar")) : null,
    !EXP && errorExp ? h("div", { class: "comprobacion aviso", style: { marginBottom: "16px" } }, icono("aviso", 20), h("div", {}, h("b", { text: "Algunas descargas no están disponibles" }), h("p", { text: "Recarga la página. Mientras tanto puedes descargar la copia de seguridad y el archivo de configuración." })), h("span")) : null,
    principal,
    h("h2", { class: "sub", text: "Para portales y redes" }),
    portales, tablaPortales,
    h("div", { style: { height: "18px" } }),
    avanzado,
  ].filter(Boolean));
}

/** Copia de seguridad: tour.json completo + estudio/proyecto.json (proyecto de trabajo íntegro) + todos sus archivos. */
async function copiaDeSeguridad(prog) {
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
      casilla("Incluir música", tieneMusica, (v) => { op.conMusica = v; }, { disabled: !tieneMusica, title: tieneMusica ? "" : "Añade música en Material o en Datos → Avanzado" }))],
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
export const seccionExportar = {
  id: "exportar", titulo: "Publicar", corto: "Publicar",
  resumen: () => ({ texto: "Tu web, portales y redes" }),
  render: renderExportar, actualizar: () => { if (!raizE?.contains(document.activeElement) || document.activeElement?.tagName === "BUTTON") pintarExportar(); },
  salir: () => { raizE = null; },
};
on("exportar-listo", () => pintarExportar());
