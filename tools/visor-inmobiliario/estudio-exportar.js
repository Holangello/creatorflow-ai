// Pasos 6 y 7 · Revisar (lista de comprobación) y Exportar / Publicar.
import { slug, norm360, zipAlmacenado } from "./estudio-util.js";
import { app, h, icono, emitir, on, toast, textoDe, colocado, calcularEnlaces, tourParaExportar, archivosParaExportar,
  fmtMB, urlDe } from "./estudio-nucleo.js";
import { problemaVariante, nombreEstilo } from "./estudio-variantes.js";

// ------------------------------------------------------------------ exportar.js (otro módulo; puede no existir aún)
let EXP = null, errorExp = null;
const cargaExp = import("./exportar.js").then((m) => { EXP = m; emitir("exportar-listo"); }).catch((e) => { errorExp = e; console.warn("exportar.js no disponible", e); emitir("exportar-listo"); });
void cargaExp;

// ------------------------------------------------------------------ validación
const nombreDe = (p) => textoDe(p?.nombre) || p?.id || "";
const lista = (xs, n = 4) => xs.slice(0, n).join(", ") + (xs.length > n ? ` y ${xs.length - n} más` : "");

/** → [{id, nivel: "error"|"aviso"|"ok", titulo, detalle, ir: {seccion, pestana}, accion}] */
export function comprobar() {
  const t = app.tour;
  if (!t) return [];
  const r = [];
  const add = (id, nivel, titulo, detalle, ir) => r.push({ id, nivel, titulo, detalle, ir });
  const ps = t.panoramas;
  const I = t.inmueble ?? {}, CE = I.certificado_energetico ?? {}, C = t.contacto ?? {};
  // Fotos
  if (!ps.length) add("fotos", "error", "No hay fotos 360", "Sube al menos una foto equirectangular.", { seccion: "fotos" });
  else add("fotos", "ok", `${ps.length} fotos 360`, "", { seccion: "fotos" });
  const raras = ps.filter((p) => { const m = t._estudio.meta[p.imagen]; return m && Math.abs(m.w / m.h - 2) > 0.02; });
  if (raras.length) add("ratio", "aviso", "Fotos que no son 2:1", lista(raras.map(nombreDe)), { seccion: "fotos" });
  // Plano
  const sinPos = ps.filter((p) => !colocado(p));
  if (ps.length) {
    if (sinPos.length) add("posicion", "error", `${sinPos.length} foto(s) sin colocar en el plano`, lista(sinPos.map(nombreDe)), { seccion: "plano" });
    else add("posicion", "ok", "Todas las fotos están colocadas en el plano", "", { seccion: "plano" });
  }
  const sinCal = t.plantas.filter((pl) => pl.plano?.imagen && !t._estudio.calibrado?.[pl.id]);
  if (sinCal.length) add("calibrar", "aviso", "Plano sin calibrar", `Las medidas y los m² no serán reales: ${lista(sinCal.map((p) => textoDe(p.nombre)))}`, { seccion: "plano" });
  // Enlaces
  if (ps.length > 1) {
    const { vecinos } = calcularEnlaces();
    const aisl = ps.filter((p) => !(vecinos.get(p.id)?.length));
    if (aisl.length) add("aislados", "error", `${aisl.length} foto(s) sin enlaces`, `No se puede llegar a: ${lista(aisl.map(nombreDe))}. Acércalas o usa «Enlazar».`, { seccion: "plano" });
    else {
      // Conectividad (¿se llega a todas desde el inicio?)
      const ini = t.inicio && vecinos.has(t.inicio) ? t.inicio : ps[0].id;
      const vistos = new Set([ini]); const cola = [ini];
      while (cola.length) for (const v of vecinos.get(cola.shift()) ?? []) if (!vistos.has(v)) { vistos.add(v); cola.push(v); }
      const fuera = ps.filter((p) => !vistos.has(p.id));
      if (fuera.length) add("conexo", "aviso", "Hay zonas que no se conectan con el inicio", `Inalcanzables: ${lista(fuera.map(nombreDe))}. Falta un enlace (p. ej. la escalera entre plantas).`, { seccion: "plano" });
      else add("aislados", "ok", "Todas las fotos están enlazadas", "", { seccion: "plano" });
    }
    const sinOrientar = ps.filter((p) => !p.yaw);
    if (sinOrientar.length === ps.length) add("yaw", "aviso", "Ninguna foto está orientada", "Las flechas pueden no coincidir con las puertas. Usa el asistente de alineación.", { seccion: "orientar" });
  }
  const sinTit = ps.flatMap((p) => (p.puntos ?? []).filter((pt) => !textoDe(pt.titulo).trim()).map(() => nombreDe(p)));
  if (sinTit.length) add("puntos", "aviso", "Puntos de información sin título", lista([...new Set(sinTit)]), { seccion: "orientar" });
  // Datos legales
  if (CE.en_tramite) add("ce", "ok", "Certificado energético: en trámite", "", { seccion: "datos", pestana: "inmueble" });
  else if (!CE.consumo_letra || !CE.emisiones_letra) add("ce", "error", "Falta el certificado energético", "Es obligatorio en anuncios de venta y alquiler en España (letra de consumo y de emisiones, o «en trámite»).", { seccion: "datos", pestana: "inmueble" });
  else add("ce", "ok", `Certificado energético ${CE.consumo_letra} / ${CE.emisiones_letra}`, "", { seccion: "datos", pestana: "inmueble" });
  const modo = C.modo ?? "whatsapp";
  const faltaWa = modo !== "webhook" && !/^\d{8,15}$/.test(String(C.whatsapp ?? "").replace(/[\s+]/g, ""));
  const faltaHook = modo !== "whatsapp" && !/^https:\/\//.test(C.webhook ?? "");
  if (faltaWa || faltaHook) add("contacto", "error", "Falta el contacto", faltaWa ? "Indica el número de WhatsApp de la empresa." : "Indica la URL https:// del webhook.", { seccion: "datos", pestana: "contacto" });
  else add("contacto", "ok", modo === "ambos" ? "Contacto por WhatsApp y formulario" : modo === "webhook" ? "Contacto por formulario" : "Contacto por WhatsApp", "", { seccion: "datos", pestana: "contacto" });
  if (!C.url_privacidad) add("privacidad", modo === "whatsapp" ? "aviso" : "error", "Falta la política de privacidad", "El formulario recoge datos personales (RGPD): enlaza tu política de privacidad.", { seccion: "datos", pestana: "contacto" });
  // Variantes
  const malas = [];
  for (const p of ps) for (const v of p.variantes ?? []) { const pr = problemaVariante(p, v); if (pr) malas.push({ p, pr }); }
  if (malas.length) add("variantes", malas.some((m) => m.pr.nivel === "error") ? "error" : "aviso", "Variantes con tamaño o proporción distintos a la foto base", lista(malas.map((m) => `${nombreDe(m.p)} (${m.pr.texto})`), 3), { seccion: "variantes" });
  const conEstilo = ps.some((p) => (p.variantes ?? []).some((v) => v.estilo && v.estilo !== "original"));
  if (conEstilo && !textoDe(I.aviso_legal).trim()) add("aviso_ia", "error", "Estilos con IA sin aviso legal", "Indica que las imágenes de estilos son orientativas y generadas con IA.", { seccion: "datos", pestana: "personalizacion" });
  const meta = t._estudio.meta;
  const renders = (t.galeria ?? []).filter((g) => g.tipo === "render").length + ps.filter((p) => meta[p.imagen]?.render).length
    + ps.reduce((s, p) => s + (p.variantes ?? []).filter((v) => meta[v.imagen]?.render).length, 0);
  if (renders && !textoDe(I.aviso_legal).trim()) add("aviso_render", "error", `${renders} render(s) sin rótulo legal`, "Las infografías deben indicar que son imágenes orientativas (p. ej. «Imágenes no contractuales»). Añade el aviso legal.", { seccion: "datos", pestana: "personalizacion" });
  if (ps.some((p) => p.mascara)) {
    const sinM = ps.flatMap((p) => (p.mascara ? (p.variantes ?? []).filter((v) => v.estilo && v.estilo !== "original" && !v.mascara).map((v) => `${nombreDe(p)} · ${nombreEstilo(v.estilo)}`) : []));
    if (sinM.length) add("mascaras", "aviso", "Estilos sin máscara: no se podrá cambiar el color en ellos", lista(sinM, 3), { seccion: "variantes" });
    if (!(t.personalizacion?.paredes?.length || t.personalizacion?.suelos?.length)) add("paleta", "aviso", "Hay máscaras pero no hay colores en la paleta", "", { seccion: "datos", pestana: "personalizacion" });
  }
  // Recomendados
  if (!textoDe(t.titulo).trim()) add("titulo", "aviso", "Falta el título del anuncio", "", { seccion: "datos", pestana: "inmueble" });
  if (!I.precio) add("precio", "aviso", "Falta el precio", "", { seccion: "datos", pestana: "inmueble" });
  if (!I.referencia) add("ref", "aviso", "Falta la referencia", "Se usa para la carpeta de publicación (/tours/<referencia>/).", { seccion: "datos", pestana: "inmueble" });
  if (!t.marca?.nombre) add("marca", "aviso", "Falta el nombre de la inmobiliaria", "", { seccion: "datos", pestana: "marca" });
  if ((t.idiomas ?? []).includes("en")) {
    const sinEn = [t.titulo, I.descripcion].filter((x) => textoDe(x, "es").trim() && !(typeof x === "object" && x?.en?.trim())).length
      + ps.filter((p) => !(typeof p.nombre === "object" && p.nombre?.en?.trim())).length;
    if (sinEn) add("trad", "aviso", `${sinEn} texto(s) sin traducir al inglés`, "Se mostrarán en español.", { seccion: "datos", pestana: "textos" });
  }
  if (!app.archivos.size) {} // nada
  if (app.guardado === "error") add("guardado", "aviso", "El navegador no está guardando el proyecto", "Exporta un ZIP para no perder el trabajo.", { seccion: "exportar" });
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
  raizR.replaceChildren(
    h("div", { class: "cab-seccion" }, h("div", {}, h("h1", { text: "Revisar antes de publicar" }),
      h("p", { text: nE ? "Corrige los problemas marcados en rojo: afectan a la experiencia del cliente o a la ley." : nA ? "Todo lo imprescindible está listo. Revisa los avisos si quieres pulir el recorrido." : "¡Listo para publicar!" })),
      h("div", { class: "acciones" }, h("button", { class: `btn ${nE ? "" : "primario"}`, onclick: () => emitir("ir", { seccion: "exportar" }) }, icono("exportar", 16), "Ir a Exportar"))),
    h("div", { class: "resumen-val" },
      h("div", { class: "caja" }, h("b", { text: nE, style: { color: nE ? "var(--error)" : "var(--texto)" } }), h("span", { text: "problemas" })),
      h("div", { class: "caja" }, h("b", { text: nA, style: { color: nA ? "var(--aviso)" : "var(--texto)" } }), h("span", { text: "avisos" })),
      h("div", { class: "caja" }, h("b", { text: nO, style: { color: "var(--ok)" } }), h("span", { text: "correctos" }))),
    h("div", { class: "comprobaciones" }, r.map((c) => h("div", { class: `comprobacion ${c.nivel}` },
      icono(c.nivel === "ok" ? "ok" : c.nivel === "error" ? "error" : "aviso", 20),
      h("div", {}, h("b", { text: c.titulo }), c.detalle ? h("p", { text: c.detalle }) : null),
      c.nivel !== "ok" && c.ir ? h("button", { class: "btn peq", onclick: () => emitir("ir", c.ir) }, "Corregir") : h("span")))));
}
export const seccionRevisar = {
  id: "revisar", titulo: "Revisar", corto: "Revisar",
  resumen: () => { const r = comprobar(); const e = r.filter((x) => x.nivel === "error").length; return { texto: e ? `${e} por corregir` : "Todo correcto", hecho: !e && app.tour.panoramas.length > 0 }; },
  render: renderRevisar, actualizar: pintarRevisar, salir: () => { raizR = null; },
};

// ------------------------------------------------------------------ Exportar
let raizE = null;
const prefs = (() => { try { return JSON.parse(localStorage.getItem("estudio:publicar") ?? "{}"); } catch { return {}; } })();
const guardarPrefs = () => { try { localStorage.setItem("estudio:publicar", JSON.stringify(prefs)); } catch {} };
function nombreBase() { return slug(app.tour.inmueble?.referencia || textoDe(app.tour.titulo) || "recorrido"); }
function urlPublica() {
  const web = (prefs.web || app.tour.marca?.web || "https://www.tu-inmobiliaria.com").replace(/\/+$/, "");
  return `${web}/tours/${nombreBase()}/`;
}
function descargar(blob, nombre) {
  if (EXP?.descargar) return EXP.descargar(blob, nombre);
  const a = h("a", { href: URL.createObjectURL(blob), download: nombre });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}
function datosExport() {
  const t = tourParaExportar();
  return { t, archivos: archivosParaExportar(t) };
}
function tarjeta({ ic, titulo, texto, controles = [], boton, accion, necesita, extra }) {
  const barra = h("div");
  const prog = h("div", { class: "progreso", hidden: true }, barra);
  const estado = h("span", { class: "tenue", style: { fontSize: "12.5px" } });
  const disponible = !necesita || (EXP && necesita.every((f) => typeof EXP[f] === "function"));
  const motivo = !disponible ? (errorExp || EXP ? `Pendiente: exportar.js no ofrece ${necesita.join(", ")}` : "Cargando exportar.js…") : "";
  const b = h("button", { class: "btn primario", disabled: !disponible, title: motivo }, boton);
  b.onclick = async () => {
    b.disabled = true; prog.hidden = false; barra.style.width = "4%"; estado.textContent = "Preparando…"; estado.style.color = "";
    try {
      const r = await accion((f) => { barra.style.width = `${Math.round(Math.max(0.04, f) * 100)}%`; }, estado);
      barra.style.width = "100%";
      estado.textContent = r ?? "Listo"; estado.style.color = "var(--ok)";
    } catch (e) {
      console.error(e);
      estado.textContent = `Error: ${e.message}`; estado.style.color = "var(--error)";
    } finally { b.disabled = false; setTimeout(() => { prog.hidden = true; }, 1500); }
  };
  return h("div", { class: "exporte" }, h("h3", {}, icono(ic, 18), titulo), h("p", { text: texto }), ...controles,
    h("div", { class: "fila" }, b, !disponible ? h("span", { class: "tenue", style: { fontSize: "12px" }, text: motivo }) : null), prog, estado, extra ?? null);
}
function sel(opciones, valor, onch, etq) {
  const s = h("select", { "aria-label": etq }, opciones.map(([v, t]) => h("option", { value: v, text: t })));
  s.value = valor; s.onchange = () => onch(s.value);
  return s;
}

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
  const tamTotal = [...archivosParaExportar(tourParaExportar()).values()].reduce((s, b) => s + (b?.size ?? 0), 0);
  const ref = nombreBase();
  const op = { formato: prefs.formato ?? "16:9", calidad: prefs.calidad ?? "movil", planta: t.plantas[0]?.id, medidas: true, conMarca: true };

  const aviso = nE ? h("div", { class: "comprobacion error", style: { marginBottom: "16px" } }, icono("error", 20),
    h("div", {}, h("b", { text: `Hay ${nE} problema(s) por corregir` }), h("p", { text: "Puedes exportar igualmente, pero revisa la lista antes de publicar." })),
    h("button", { class: "btn peq", onclick: () => emitir("ir", { seccion: "revisar" }) }, "Revisar")) : null;

  const tarjetas = [
    tarjeta({ ic: "descargar", titulo: "tour.json", texto: "Solo el archivo de configuración (para quien ya tiene las fotos publicadas o para editarlo a mano).", boton: "Descargar tour.json",
      accion: async () => { const { t: tt } = datosExport(); descargar(new Blob([JSON.stringify(tt, null, 2)], { type: "application/json" }), "tour.json"); return "Descargado"; } }),
    tarjeta({ ic: "exportar", titulo: "ZIP para tu web", texto: `Carpeta lista para subir a tu hosting con el visor incluido (${fmtMB(tamTotal)} en imágenes). Sirve también como copia de seguridad del proyecto: se puede volver a abrir en el Estudio.`,
      boton: "Descargar ZIP", necesita: ["exportarZIP"],
      accion: async (prog) => {
        const { t: tt, archivos } = datosExport();
        const z = await EXP.exportarZIP(tt, archivos, { incluirVisor: true, onProgreso: prog });
        descargar(z, `${ref}.zip`);
        return z.avisos?.length ? `Descargado (${fmtMB(z.size)}) con ${z.avisos.length} aviso(s): ${z.avisos[0]}` : `Descargado (${fmtMB(z.size)})`;
      } }),
    tarjeta({ ic: "abrir", titulo: "Archivo HTML autónomo", texto: "Un solo archivo que se abre con doble clic, sin internet. Ideal para enviar por email o WeTransfer, o para enseñarlo en la oficina.",
      controles: [sel([["movil", "Calidad estándar (4K, recomendado)"], ["alta", "Alta calidad (8K, archivo grande)"]], op.calidad, (v) => { prefs.calidad = v; guardarPrefs(); }, "Calidad")],
      boton: "Crear HTML", necesita: ["exportarHTMLAutonomo"],
      accion: async (prog) => {
        const { t: tt, archivos } = datosExport();
        const b = await EXP.exportarHTMLAutonomo(tt, archivos, { calidad: prefs.calidad ?? "movil", onProgreso: prog });
        descargar(b, `${ref}.html`);
        return b.superaLimite ? `Descargado, pero pesa ${fmtMB(b.tamano ?? b.size)}: puede ir lento. Prueba la calidad estándar.` : `Descargado (${fmtMB(b.tamano ?? b.size)})`;
      } }),
    tarjeta({ ic: "fotos", titulo: "Fotos 360 para portales y redes", texto: "JPG con metadatos 360 (GPano): Facebook, Google y la mayoría de portales las muestran como foto esférica interactiva.",
      boton: "Descargar fotos 360 (ZIP)", necesita: ["jpegConGPano"],
      accion: async (prog) => {
        const ps = t.panoramas, ent = [];
        for (let i = 0; i < ps.length; i++) {
          const p = ps[i], b = app.archivos.get(p.imagen);
          if (!b) continue;
          const ini = p.rumbo_inicial != null ? norm360(p.rumbo_inicial - (p.yaw ?? 0)) : 0;
          const j = await EXP.jpegConGPano(b, { rumboInicial: ini });
          ent.push({ ruta: `${String(i + 1).padStart(2, "0")}-${slug(nombreDe(p))}.jpg`, datos: new Uint8Array(await j.arrayBuffer()) });
          prog((i + 1) / ps.length);
        }
        let zip;
        try { const { zipSync } = await import("./vendor/fflate.js"); zip = new Blob([zipSync(Object.fromEntries(ent.map((e) => [e.ruta, [e.datos, { level: 0 }]])))], { type: "application/zip" }); }
        catch { zip = zipAlmacenado(ent); }
        descargar(zip, `${ref}-fotos-360.zip`);
        return `${ent.length} fotos (${fmtMB(zip.size)})`;
      } }),
    tarjeta({ ic: "plano", titulo: "Plano con medidas (PNG)", texto: "Plano a escala con estancias, m², norte y tu marca. Para el anuncio y el dossier.",
      controles: [h("div", { class: "fila" },
        t.plantas.length > 1 ? sel(t.plantas.map((p) => [p.id, textoDe(p.nombre)]), op.planta, (v) => { op.planta = v; }, "Planta") : null,
        (() => { const c = h("input", { type: "checkbox", checked: true }); c.onchange = () => { op.medidas = c.checked; }; return h("label", { class: "check" }, c, "Con medidas"); })())],
      boton: "Descargar plano", necesita: ["exportarPlano"],
      accion: async () => {
        const { t: tt, archivos } = datosExport();
        const b = await EXP.exportarPlano(tt, op.planta, { px: 2400, medidas: op.medidas, archivos });
        descargar(b, `${ref}-plano${t.plantas.length > 1 ? "-" + op.planta : ""}.png`);
        return `Descargado (${fmtMB(b.size)})`;
      } }),
    tarjeta({ ic: "datos", titulo: "Dossier PDF", texto: "Ficha A4 con portada, datos, plano, certificado energético y código QR al recorrido. Se abre en una pestaña: usa «Guardar como PDF».",
      boton: "Abrir dossier", necesita: ["abrirFichaImprimible"],
      accion: async () => {
        const { t: tt, archivos } = datosExport();
        let portada;
        try { portada = await app.vistaPrevia.ventana()?.visor?.capturar?.(); } catch {}
        EXP.abrirFichaImprimible(tt, { enlace: urlPublica(), archivos, portada });
        return "Abierto en una pestaña nueva";
      } }),
    tarjetaVideo(op),
  ];

  const url = urlPublica();
  const codigo = `<iframe src="${url}" width="100%" height="600" style="border:0;border-radius:12px" allow="fullscreen; gyroscope; accelerometer; xr-spatial-tracking" allowfullscreen loading="lazy" title="Recorrido virtual ${ref}"></iframe>`;
  const copiar = (txt) => async () => { try { await navigator.clipboard.writeText(txt); toast("Copiado", "ok"); } catch { toast("No se pudo copiar: selecciónalo y usa Ctrl+C", "aviso"); } };
  const web = h("input", { type: "url", value: prefs.web || t.marca?.web || "", placeholder: "https://www.tu-inmobiliaria.com", "aria-label": "Dirección de tu web" });
  web.onchange = () => { prefs.web = web.value.trim(); guardarPrefs(); pintarExportar(); };
  const publicar = h("div", { class: "tarjeta publicar" },
    h("ol", {},
      h("li", {}, "Descarga el ", h("b", { text: "ZIP para tu web" }), " y descomprímelo."),
      h("li", {}, "Súbelo por FTP o desde el panel de tu hosting a la carpeta ", h("code", { text: `/tours/${ref}/` }), " (que dentro quede index.html, tour.json y la carpeta panos)."),
      h("li", {}, "Tu enlace final será:", h("div", { class: "fila", style: { marginTop: "6px", flexWrap: "nowrap" } },
        h("div", { class: "campo", style: { flex: "0 1 280px" } }, h("span", { text: "Dirección de tu web" }), web),
        h("div", { class: "codigo", style: { flex: 1, alignSelf: "flex-end" } }, h("code", { text: url }), h("button", { class: "btn peq icono-btn", "aria-label": "Copiar enlace", onclick: copiar(url) }, icono("copiar", 14))))),
      h("li", {}, "Para incrustarlo en la ficha de tu web (WordPress, Wix…), pega este código:",
        h("div", { class: "codigo", style: { marginTop: "6px" } }, h("code", { text: codigo }), h("button", { class: "btn peq icono-btn", "aria-label": "Copiar código", onclick: copiar(codigo) }, icono("copiar", 14))))),
    h("h3", { style: { margin: "18px 0 8px", fontSize: "14px" }, text: "Qué subir a cada portal" }),
    h("table", { class: "tabla-portales" },
      h("thead", {}, h("tr", {}, h("th", { text: "Portal" }), h("th", { text: "Qué subir" }))),
      h("tbody", {},
        h("tr", {}, h("td", {}, h("b", { text: "idealista" })), h("td", { text: "Vídeo MP4 (16:9) en la sección de vídeo, el plano PNG en «planos» y las fotos 360 si tu plan incluye tour virtual. El enlace del recorrido solo si idealista admite el proveedor; si no, ponlo en tu web y en la descripción no se permiten enlaces." })),
        h("tr", {}, h("td", {}, h("b", { text: "Fotocasa / habitaclia" })), h("td", { text: "Vídeo MP4, plano PNG y fotos 360 (GPano). El campo de «visita virtual» solo acepta proveedores homologados: compruébalo en tu panel antes de pegar el enlace." })),
        h("tr", {}, h("td", {}, h("b", { text: "Tu web / Google Business" })), h("td", { text: "El enlace o el iframe del recorrido. En Google Business, las fotos 360 con GPano." })),
        h("tr", {}, h("td", {}, h("b", { text: "Instagram, TikTok, Reels" })), h("td", { text: "Vídeo vertical 9:16 con marca. Facebook: fotos 360 (se ven interactivas) y el vídeo." })),
        h("tr", {}, h("td", {}, h("b", { text: "WhatsApp / email" })), h("td", { text: "El enlace del recorrido, o el archivo HTML autónomo si el cliente no tiene buena conexión." })))));

  raizE.replaceChildren(...[
    h("div", { class: "cab-seccion" }, h("div", {}, h("h1", { text: "Exportar y publicar" }),
      h("p", { text: "Descarga lo que necesitas para tu web, los portales y las redes. Todo se genera en tu ordenador." }))),
    aviso,
    !EXP && errorExp ? h("div", { class: "comprobacion aviso", style: { marginBottom: "16px" } }, icono("aviso", 20), h("div", {}, h("b", { text: "Exportadores no disponibles" }), h("p", { text: "No se pudo cargar exportar.js. Mientras tanto puedes descargar tour.json." })), h("span")) : null,
    h("div", { class: "exportes" }, tarjetas),
    h("h2", { class: "sub", text: "Publicar en tu web" }),
    publicar].filter(Boolean));
}
const nombreDeP = (p) => textoDe(p?.nombre) || p?.id;
function tarjetaVideo(op) {
  let control = null;
  const estado = { formato: prefs.formato ?? "16:9" };
  const t = tarjeta({
    ic: "video", titulo: "Vídeo de la visita",
    texto: "Graba la visita guiada desde la vista previa: 16:9 para portales y YouTube, 9:16 para Reels, TikTok y Stories. Tarda lo mismo que la visita.",
    controles: [h("div", { class: "fila" },
      sel([["16:9", "Horizontal 16:9"], ["9:16", "Vertical 9:16"], ["1:1", "Cuadrado 1:1"]], estado.formato, (v) => { estado.formato = v; prefs.formato = v; guardarPrefs(); }, "Formato"),
      (() => { const c = h("input", { type: "checkbox", checked: true }); c.onchange = () => { op.conMarca = c.checked; }; return h("label", { class: "check" }, c, "Con marca y precio"); })())],
    boton: "Grabar vídeo", necesita: ["grabarVideo"],
    accion: async (prog, est) => {
      const w = app.vistaPrevia.ventana();
      const visor = w?.visor;
      if (!visor) throw new Error("La vista previa no expone window.visor");
      control = new AbortController();
      const [rw, rh] = { "16:9": [16, 9], "9:16": [9, 16], "1:1": [1, 1] }[estado.formato];
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
      const rotulo = h("div", { class: "vista-modo", style: { position: "fixed", zIndex: 41 }, text: `Grabando ${estado.formato}…` });
      document.body.append(cancelar, rotulo);
      try {
        await new Promise((r) => setTimeout(r, 600));
        const r = await EXP.grabarVideo(visor, { formato: estado.formato, fps: 30, alto, conMarca: op.conMarca, onProgreso: (f) => { prog(f); rotulo.textContent = `Grabando ${estado.formato}… ${Math.round(f * 100)} %`; }, senal: control.signal });
        descargar(r.blob, `${nombreBase()}-${estado.formato.replace(":", "x")}.${r.extension}`);
        return `Vídeo ${r.extension.toUpperCase()} ${r.ancho ?? ""}×${r.alto ?? ""} (${fmtMB(r.blob.size)})`;
      } finally {
        document.body.classList.remove("grabando");
        Object.assign(ifr.style, { width: "", height: "", transform: "" });
        cancelar.remove(); rotulo.remove();
        void est;
      }
    },
  });
  return t;
}
export const seccionExportar = {
  id: "exportar", titulo: "Exportar y publicar", corto: "Exportar",
  resumen: () => ({ texto: "Web, portales, vídeo, PDF" }),
  render: renderExportar, actualizar: () => { if (!raizE?.contains(document.activeElement) || document.activeElement?.tagName === "BUTTON") pintarExportar(); },
  salir: () => { raizE = null; },
};
on("exportar-listo", () => pintarExportar());
void urlDe; void nombreDeP;
