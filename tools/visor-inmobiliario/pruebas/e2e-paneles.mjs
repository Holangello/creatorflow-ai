#!/usr/bin/env node
// Pruebas de extremo a extremo de los paneles del visor (paneles.js): tarjeta del inmueble, ficha, contacto con fotos y
// WhatsApp, galería, compartir, «Estilo y luz», «Más», Ajustes, música, idiomas, teclado y objetivos táctiles.
//   cd tools/visor-inmobiliario && node pruebas/e2e-paneles.mjs
// La mayoría usa un visor SIMULADO (pruebas/fixtures/paneles.html, API de ESQUEMA.md sin WebGL: rápido y determinista);
// los dos últimos bloques usan el núcleo REAL (index.html?demo): interfaz inactiva, pantalla completa y barra de captura.
// Lo que se comprueba es comportamiento (qué llega al CRM o a WhatsApp, qué guarda, a dónde va el foco, qué cabe en
// pantalla); los selectores están agrupados en SEL para adaptarlos cuando cambie el diseño. Sale con código 1 si algo falla.
// Fase 3 (fase3-plan.md §3.3 y §4.2): la tarjeta del inmueble sustituye a la pestaña, la hoja de vista previa y el dock;
// «Contactar» adjunta sola la vista actual (PA1) y «Enviar por WhatsApp» copia la foto y abre el chat en el mismo gesto;
// Compartir, Idioma y Ajustes van en «Más»; «Estilo y luz» depende de estado_obra (PA3).
// Fase 4 (fase4-plan.md §1.4 y §2.2): Apariencia, Tamaño y Reducir transparencia en Ajustes con las preferencias comunes de
// tema.js (cre8eight:*, compartidas con el Estudio y la Guía); el movimiento tiene una sola fuente de verdad; contraste del
// vidrio en claro y oscuro; sin desplazamiento horizontal; iconos que se dibujan y nada animado con movimiento reducido.
import { servir, lanzar, contexto, abrir } from "./comun.mjs";
import { crearInforme, erroresDe, esperar } from "./e2e-util.mjs";

const SEL = {
  raiz: ".pn-raiz",
  // tarjeta del inmueble: el resumen «precio · datos» abre la ficha; en el móvil la tarjeta es la hoja que se arrastra
  tarjeta: ".pn-tarjeta", ficha: ".pn-tarjeta [data-k='ficha']", peek: ".pn-tarjeta [data-k='ficha']", panel: ".pn-tarjeta", cuerpoPanel: ".pn-panel-cuerpo", energia: ".pn-sec-energia",
  contacto: ".pn-tarjeta [data-k='contactar']", contactoTexto: ".pn-tarjeta [data-k='contactar'] > span:not(.pn-num)",
  whatsappDirecto: "[data-k='wa-directo']", // enlace secundario dentro del diálogo de contacto (PA2)
  personalizar: ".pn-tarjeta [data-k='estilo-luz']",
  estilo: (id) => `[data-k='estilo-${id}']`, momento: (id) => `[data-k='momento-${id}']`, pared: (c) => `[data-k='paredes-${c}']`, comparar: "[data-k='comparar']",
  // «Más»: el menú del núcleo (#btn-mas → #menu-mas) o, sin visor.mas (como en el visor simulado), el propio de los paneles
  mas: ["#btn-mas", ".pn-tarjeta [data-k='mas']"], masItem: (id) => `#menu-mas [data-id='${id}'], .pn-menu [data-k='mas-${id}']`,
  compartirFicha: "[data-k='compartir-ficha']", qr: ".pn-qr-img svg", compartirNativo: "[data-k='sh-nativo']", compartirWa: "[data-k='sh-wa']", copiarEnlace: "[data-k='copiar']",
  musica: "[data-k='aj-musica']", volumen: "[data-k='aj-volumen']", volumenTxt: "[data-k='aj-vol-txt']", movimiento: "[data-k='aj-movimiento']",
  // Ajustes de la fase 4: «Apariencia: Automático · Claro · Oscuro», «Tamaño: S · M · L» y «Reducir transparencia»
  apariencia: (v) => `[data-k='aj-tema-${v}']`, talla: (v) => `[data-k='aj-talla-${v}']`, transparencia: "[data-k='aj-transparencia']",
  iconoApariencia: ".pn-ic-apariencia", restablecer: "[data-k='aj-reset']", dialogoAjustes: ".pn-dialogo-ajustes",
  creditoMusica: ".pn-musica-credito", creditoApp: ".pn-credito",
  idiomaX: (c) => `[data-k='idioma-${c}']`,
  guiada: "[data-k='guiada']", medir: "[data-k='medir']", hipoteca: ".pn-hip", precioCabecera: ".pn-t-precio", titulo: ".pn-titulo", marca: ".pn-marca-nombre",
  dialogo: ".pn-dialogo:not([hidden])", cerrarDialogo: "[data-k='cerrar-dlg']", tituloDialogo: "pn-dlg-tit", cuerpoDialogo: ".pn-dlg-cuerpo",
  zona: "[data-k='c-zona']", nombre: "[data-k='c-nombre']", telefono: "[data-k='c-telefono']", pregunta: "[data-k='c-pregunta']", privacidad: "[data-k='c-priv']",
  sugerencia: "[data-k='sug-contacto.sug_visita']", enviar: "[data-k='enviar']", reintentar: "[data-k='reintentar']", enviarWhatsApp: "[data-k='enviar-wa']",
  exito: ".pn-estado-ok", error: ".pn-error", invalidos: ".pn-dialogo [aria-invalid='true']",
  hacerFoto: "[data-k='hacer-foto']", capturar: "[data-k='capturar']", capturaListo: "[data-k='captura-listo']", quitarFoto: (i) => `[data-k='quitar-${i}']`, tira: ".pn-dialogo .pn-tira li:has(img)",
  barraCaptura: ".pn-barra-captura", ayudaCaptura: ".pn-bc-texto", numCaptura: ".pn-bc-num",
  // tras «Enviar por WhatsApp», una sola pantalla «Pega la foto y envía»
  pasosWhatsApp: ".pn-pasos li", principal: ".pn-dialogo .c8-boton--primario", pegar: "[data-k='terminado'], [data-k='copiar-siguiente'], [data-k='copiar-otra-vez'], [data-k='descargar-fotos']",
  copiarSiguiente: "[data-k='copiar-siguiente']", terminado: "[data-k='terminado']",
  galeriaTipo: (t) => `[data-k='gal-tipo:${t}']`, galeriaTodo: "[data-k='gal-todo']", galeriaItem: (i) => `[data-k='gal-item-${i}']`, galeria: ".pn-galeria li",
  lightbox: ".pn-lb", lightboxNum: ".pn-lb-n", documentos: ".pn-sec-docs",
  nucleoGaleria: "#galeria", nucleoPantalla: "#btn-pantalla",
  portadaEmpezar: "#portada .empezar", // portada de la fase 3: «Empezar visita» es el primer gesto
};

const SD = JSON.parse(JSON.stringify(SEL)); // SEL sin las funciones, para pasarlo a page.evaluate
// Testigos: piezas de la interfaz de las que dependen los bloques. Si faltan, el bloque queda «pendiente de la interfaz
// nueva» en vez de fallar (hay que adaptar SEL).
const PIEZAS = {
  contacto: { "«Contactar» de la tarjeta": SEL.contacto },
  ficha: { "resumen de la tarjeta (abre la ficha)": SEL.ficha },
  herramientas: { "«Estilo y luz»": SEL.personalizar, "«Más»": SEL.mas },
};
const piezas = (...nombres) => Object.assign({}, ...nombres.map((n) => PIEZAS[n]));
const inf = crearInforme("e2e · Paneles del visor");
const { base, cerrar } = await servir();
const navegador = await lanzar();

/** Visor simulado con la red de WhatsApp y del CRM interceptada. red: { wa: [url], hook: [cuerpo], falla }.
 *  sinTema: sin tema.js (página antigua o que no lo carga): los paneles deben seguir funcionando con sus reservas. */
async function simulado({ ancho = 1280, alto = 800, tactil = false, query = "", init = null, permisos = [], sinTema = false } = {}) {
  const ctx = await contexto(navegador, { ancho, alto, movil: tactil, escala: tactil ? 2 : 1 });
  inf.cerrarAlFinal.push(ctx);
  if (permisos.length) await ctx.grantPermissions(permisos);
  if (init) await ctx.addInitScript(init);
  if (sinTema) await ctx.route(/\/tema\.js(\?|$)/, (r) => r.fulfill({ status: 404, body: "" }));
  const red = { wa: [], hook: [], falla: false };
  await ctx.route(/wa\.me/, (r) => { red.wa.push(r.request().url()); r.fulfill({ body: "<h1>wa</h1>", contentType: "text/html" }); });
  await ctx.route(/hook\.example\.com/, async (r) => {
    const cuerpo = r.request().postData() ?? "{}";
    try { red.hook.push(JSON.parse(cuerpo)); } catch { red.hook.push({ crudo: cuerpo, tipo: r.request().headers()["content-type"] }); }
    if (red.falla) return r.fulfill({ status: 500, body: "x" });
    r.fulfill({ status: 200, body: "{}", contentType: "application/json", headers: { "access-control-allow-origin": "*" } });
  });
  const p = await abrir(ctx, `${base}pruebas/fixtures/paneles.html${query}`);
  await p.waitForSelector(SEL.raiz);
  return { p, ctx, red };
}
/** Primer selector cuyo elemento está visible DENTRO de la pantalla (no basta con existir: la hoja plegada lo deja debajo). */
const visible = async (p, selectores, desplazar = false) => {
  const vp = p.viewportSize();
  for (const s of [selectores].flat()) {
    const e = await p.$(s);
    if (e && desplazar) await e.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => {}); // dentro de la hoja, que tiene scroll propio
    const b = e && (await e.isVisible()) ? await e.boundingBox() : null;
    if (b && b.width && b.x >= 0 && b.y >= 0 && b.x + b.width <= vp.width + 1 && b.y + b.height <= vp.height + 1) return s;
  }
  return null;
};
const pulsar = async (p, selectores, ms = 3000, desplazar = false) => {
  let s = null;
  for (const t0 = Date.now(); !(s = await visible(p, selectores, desplazar)) && Date.now() - t0 < ms;) await p.waitForTimeout(100);
  if (!s) throw new Error(`no hay ningún botón visible: ${[selectores].flat().join(" | ")}`);
  await p.click(s);
};
/** Espera a que terminen las animaciones y transiciones en curso (las infinitas, como un indicador de carga, no cuentan). */
const estable = (p, ms = 3000) => esperar(p, () => document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getTiming?.().iterations === Infinity), null, ms).catch(() => {});
/** Cierra el diálogo abierto con Escape y espera a que desaparezca. */
const cerrarDialogo = async (p) => { await p.keyboard.press("Escape"); await esperar(p, (s) => !document.querySelector(s), SEL.dialogo, 3000).catch(() => {}); await estable(p); };
/** Abre la hoja (móvil) y espera a que deje de estar plegada. */
const abrirHoja = async (p) => {
  const antes = await p.evaluate((S) => ({ altura: document.querySelector(S.panel)?.dataset.altura, dialogo: !!document.querySelector(S.dialogo), foco: document.activeElement?.dataset?.k }), SD);
  if (antes.altura !== "peek") return; // ya está abierta (pulsar el precio la cerraría)
  await pulsar(p, SEL.peek);
  const ok = await esperar(p, (s) => document.querySelector(s)?.dataset.altura !== "peek", SEL.panel, 3000).then(() => true, () => false);
  if (!ok) throw new Error(`la hoja no se abre al pulsar el precio (antes: ${JSON.stringify(antes)})`);
  await estable(p);
};
/** «Contactar» abre el diálogo y adjunta sola la vista actual como foto 1 (PA1): se espera a que esté en la tira. */
const abrirContacto = async (p) => {
  await pulsar(p, SEL.contacto); await p.waitForSelector(SEL.dialogo);
  await esperar(p, (s) => document.querySelectorAll(s).length >= 1, SEL.tira, 8000).catch(() => {});
  await estable(p);
};
/** Abre «Más» (el menú del núcleo o el propio) y elige un elemento por su id (pn-compartir, pn-idioma, pn-ajustes…). */
const elegirMas = async (p, id) => { await pulsar(p, SEL.mas); await p.waitForSelector(SEL.masItem(id)); await p.click(SEL.masItem(id)); await estable(p); };
const rellenar = async (p, pregunta = "¿Se puede tirar esta pared?") => {
  await p.fill(SEL.nombre, "Lucía Martín"); await p.fill(SEL.telefono, "612 345 678"); await p.fill(SEL.pregunta, pregunta); await p.check(SEL.privacidad);
};
/** Espera a que la barra de captura cuente n fotos («n fotos»). */
const fotosEnBarra = (p, n, ms = 5000) => esperar(p, ([s, n]) => document.querySelector(s)?.textContent?.startsWith(String(n)), [SEL.numCaptura, n], ms);
const foco = (p) => p.evaluate(() => document.activeElement?.dataset?.k ?? document.activeElement?.className ?? "");
const enFoco = (p, k) => esperar(p, (k) => document.activeElement?.dataset?.k === k, k, 3000).then(() => true, () => false);
const IGNORAR = [/status of 500/];
/** Sin desplazamiento horizontal de la página (un vidrio de borde a borde no debe sobresalir). */
const sinDesbordeX = (p) => p.evaluate(() => ({ ok: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  scroll: document.documentElement.scrollWidth, ancho: document.documentElement.clientWidth }));
/**
 * Contraste WCAG del texto de una pieza de vidrio en el PEOR caso: su fondo translúcido compuesto sobre una foto blanca
 * pura y sobre una negra pura (con el vidrio adaptativo sin medir, como aquí, el núcleo aplica ese peor caso).
 * Los colores se pasan por un lienzo: así valen también los que el navegador da en oklch() o color().
 * → { [selector]: contraste mínimo }
 */
const contrasteVidrio = (p, vidrio, selectores) => p.evaluate(([vidrio, selectores]) => {
  const lienzo = document.createElement("canvas"); lienzo.width = lienzo.height = 1;
  const g = lienzo.getContext("2d", { willReadFrequently: true });
  const rgba = (css) => { g.clearRect(0, 0, 1, 1); g.fillStyle = "#000"; g.fillStyle = css; g.fillRect(0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; return { c: [d[0], d[1], d[2]], a: d[3] / 255 }; };
  const sobre = (f, fondo) => f.c.map((v, i) => v * f.a + fondo[i] * (1 - f.a));
  const lum = (c) => c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const fondo = rgba(getComputedStyle(document.querySelector(vidrio)).backgroundColor);
  const r = {};
  for (const s of selectores) {
    const el = document.querySelector(s); if (!el) { r[s] = 0; continue; }
    const texto = rgba(getComputedStyle(el).color);
    r[s] = Math.round(Math.min(...[[255, 255, 255], [0, 0, 0]].map((foto) => { const bajo = sobre(fondo, foto); return ratio(sobre(texto, bajo), bajo); })) * 100) / 100;
  }
  return r;
}, [vidrio, selectores]);
/** Objetivos táctiles visibles de menos de 44 px dentro de los paneles (y del menú «Más» del núcleo). */
const objetivosPequenos = (p) => p.evaluate(() => {
  const malos = [];
  for (const el of document.querySelectorAll("#paneles :is(button, a[href], input, select, textarea, summary, [role=switch], [role=radio], label[data-k]), #menu-mas:not([hidden]) button")) {
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    if (!r.width || !r.height || s.visibility === "hidden" || el.closest("[inert]") || el.closest(".pn-capturando > :not(.pn-barra-captura)")) continue;
    if (el.matches("input[type=checkbox], input[type=radio], input[type=color]")) continue; // la etiqueta o la muestra es el objetivo
    if (el.matches("a") && el.closest("p, label") && getComputedStyle(el).display === "inline") continue; // enlace dentro de una frase
    if (r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) continue;
    if (Math.min(r.width, r.height) < 43.5) malos.push(`${el.dataset.k ?? el.className ?? el.tagName} ${Math.round(r.width)}×${Math.round(r.height)}`);
  }
  return malos;
});

try {
  // ================================================================== 1 · tamaños de pantalla
  for (const [n, ancho, alto, tactil, disp] of [["1280×800", 1280, 800, false, "lateral"], ["1024×768", 1024, 768, false, "lateral"], ["768×1024", 768, 1024, true, "hoja"], ["390×844", 390, 844, true, "hoja"], ["844×390", 844, 390, true, "compacta"]]) {
    await inf.bloque(`Disposición, contacto y foto a ${n}${tactil ? " (táctil)" : ""}`, async () => {
      const { p, red } = await simulado({ ancho, alto, tactil });
      if (!(await inf.requiere(p, piezas("contacto", "ficha"), `${n}: disposición y contacto`))) return;
      const clase = await p.getAttribute(SEL.raiz, "class");
      inf.ok(clase.includes(`pn-disp-${disp}`), `${n}: disposición «${disp}»`, clase);
      // un solo botón de contacto en todos los tamaños (PA2): el «Contactar» de la tarjeta, dentro de la pantalla
      const botones = await p.$$eval("#paneles [data-k='contactar']", (bs) => bs.filter((b) => { const r = b.getBoundingClientRect(); return r.width && r.left >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; })
        .map((b) => b.textContent.trim()));
      inf.ok(botones.length === 1 && botones[0] === "Contactar", `${n}: botón «Contactar» siempre visible (uno solo)`, botones);
      // el acceso directo a WhatsApp ya no está fuera: es un enlace secundario dentro del diálogo de contacto (PA2)
      inf.ok(!(await p.$("#paneles a[href*='wa.me']")), `${n}: sin acceso directo a WhatsApp fuera del diálogo de contacto`);
      if (disp === "hoja") inf.ok(parseFloat(await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--reserva-inferior"))) > 50, `${n}: la hoja reserva su alto para que el núcleo no quede debajo (--reserva-inferior)`);
      const dx0 = await sinDesbordeX(p);
      inf.ok(dx0.ok, `${n}: sin desplazamiento horizontal con la tarjeta`, dx0);
      await abrirContacto(p);
      const dx1 = await sinDesbordeX(p);
      inf.ok(dx1.ok, `${n}: sin desplazamiento horizontal con el diálogo de contacto abierto`, dx1);
      const v = await p.evaluate((S) => {
        const d = document.querySelector(S.dialogo), f = document.querySelector(S.hacerFoto), z = document.querySelector(S.zona), cuerpo = d.querySelector(S.cuerpoDialogo).getBoundingClientRect();
        const rd = d.getBoundingClientRect(), rf = f.getBoundingClientRect(), c = document.querySelector(S.contacto).getBoundingClientRect();
        const encima = document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2);
        return { tapado: !!encima && d.contains(encima), separado: c.right <= rd.left + 1 || c.left >= rd.right - 1 || c.bottom <= rd.top + 1 || c.top >= rd.bottom - 1,
          foto: rf.top >= cuerpo.top - 1 && rf.bottom <= cuerpo.bottom + 1 && rf.bottom <= innerHeight, orden: !!(f.compareDocumentPosition(z) & Node.DOCUMENT_POSITION_FOLLOWING),
          adjunta: document.querySelectorAll(S.tira).length, directo: !!d.querySelector(S.whatsappDirecto),
          dentro: rd.left >= -1 && rd.right <= innerWidth + 1 && rd.top >= -1 && rd.bottom <= innerHeight + 1, foco: document.activeElement?.dataset?.k ?? document.activeElement?.className };
      }, SD);
      inf.ok(v.dentro, `${n}: el diálogo de contacto cabe en pantalla`, v);
      inf.ok(disp === "lateral" ? v.separado : v.tapado, `${n}: con el diálogo abierto, «Contactar» ${disp === "lateral" ? "queda al lado: el diálogo no tapa la tarjeta" : "queda debajo del diálogo"}`, v);
      inf.ok(v.adjunta === 1, `${n}: «Contactar» adjunta sola la vista actual como foto 1`, v);
      inf.ok(v.foto && v.orden, `${n}: «Añadir otra vista» junto a las fotos, antes de la estancia y visible sin desplazar`, v);
      inf.ok(v.directo, `${n}: el WhatsApp directo es un enlace secundario dentro del diálogo`);
      inf.ok(tactil ? v.foco === SEL.tituloDialogo : v.foco === "c-zona", `${n}: foco inicial ${tactil ? "en el título (no abre el teclado)" : "en la estancia"} (${v.foco})`);
      await p.click(SEL.hacerFoto);
      await p.click(SEL.capturar);
      await p.click(SEL.capturar).catch(() => {});
      await p.click(SEL.capturaListo, { timeout: 3000 }).catch(() => {});
      inf.ok(await esperar(p, (s) => !document.querySelector(s), SEL.barraCaptura, 3000).then(() => true, () => false), `${n}: «Listo» funciona aunque la captura siga en curso`);
      await p.click(SEL.hacerFoto);
      const bc = await p.evaluate((S) => {
        const r = document.querySelector(S.barraCaptura).getBoundingClientRect(), l = document.querySelector(S.capturaListo).getBoundingClientRect();
        return { dentro: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight && r.top >= 0, listo: l.right <= innerWidth && l.bottom <= innerHeight && l.width > 40, ayuda: getComputedStyle(document.querySelector(S.ayudaCaptura)).display };
      }, SD);
      inf.ok(bc.dentro && bc.listo && (alto >= 450 || bc.ayuda === "none"), `${n}: la barra de captura y «Listo» caben en pantalla${alto < 450 ? " (sin texto de ayuda con poco alto)" : ""}`, bc);
      await p.click(SEL.capturaListo);
      await rellenar(p);
      await p.click(SEL.enviar);
      await esperar(p, (s) => !!document.querySelector(s), SEL.exito, 5000).catch(() => {});
      inf.ok(red.hook.length === 1 && /name="foto_1"/.test(red.hook[0].crudo ?? ""), `${n}: la consulta llega al CRM con la foto (multipart)`);
      if (tactil) {
        await cerrarDialogo(p);
        if (disp === "hoja") await abrirHoja(p); else { await pulsar(p, SEL.ficha); await p.waitForSelector(SEL.cuerpoPanel); await estable(p); }
        const peq = await objetivosPequenos(p);
        inf.ok(!peq.length, `${n}: objetivos táctiles ≥ 44 px en la ficha`, peq.join(", "));
        await p.keyboard.press("Escape");
        await estable(p);
        // «Estilo y luz» está en la tarjeta; Compartir y Ajustes, en «Más» (fase 3)
        for (const [k, abrirla] of [["«Estilo y luz»", () => pulsar(p, SEL.personalizar)], ["«Más»", () => pulsar(p, SEL.mas)],
          ["Compartir", () => elegirMas(p, "pn-compartir")], ["Ajustes", () => elegirMas(p, "pn-ajustes")]]) {
          await abrirla();
          if (k !== "«Más»") await p.waitForSelector(SEL.dialogo);
          await estable(p);
          const pq = await objetivosPequenos(p);
          inf.ok(!pq.length, `${n}: objetivos táctiles ≥ 44 px en ${k}`, pq.join(", "));
          await cerrarDialogo(p);
        }
      }
      const err = erroresDe(p, IGNORAR);
      inf.ok(!err.length, `${n}: sin errores de consola`, err.slice(0, 3).join(" | "));
    });
  }

  // ================================================================== 2 · Estilo y luz, compartir y envío
  for (const [n, opciones] of [["escritorio", {}], ["móvil", { ancho: 390, alto: 844, tactil: true }]]) {
    await inf.bloque(`Estilo y luz, compartir y consulta completa (${n})`, async () => {
      const { p, red } = await simulado(opciones);
      if (!(await inf.requiere(p, piezas("contacto", "herramientas"), "Estilo y luz, compartir y contacto"))) return;
      await pulsar(p, SEL.personalizar);
      await p.waitForSelector(SEL.dialogo);
      // vivienda construida (el visor simulado): Colores y Luz, sin estilos IA (PA3; los estilos se prueban en el bloque 2 b)
      inf.ok(!(await p.$(SEL.estilo("nordico"))), "en una vivienda construida «Estilo y luz» no ofrece estilos IA");
      await p.click(SEL.momento("noche")); await p.click(SEL.pared("#a9b5a0"));
      const est = await p.evaluate(() => ({ ...window.visor.estado }));
      inf.ok(est.momento === "noche" && est.pintura.paredes === "#a9b5a0", "«Estilo y luz» aplica la luz y el color de paredes en el visor", est);
      await p.click(SEL.comparar);
      inf.ok(await p.evaluate(() => window.visor.estado.comparar === true), "«Antes y después» activa la vista comparada");
      await p.keyboard.press("Escape");
      await elegirMas(p, "pn-compartir");
      if (n === "escritorio") inf.ok(!!(await p.waitForSelector(SEL.qr, { timeout: 5000 }).catch(() => null)), "Compartir genera el código QR del enlace a la vista");
      else {
        const sh = await p.evaluate((S) => ({ qr: !!document.querySelector(S.qr), compartir: !!document.querySelector(S.compartirNativo) || !!document.querySelector(S.compartirWa), copiar: !!document.querySelector(`${S.dialogo} ${S.copiarEnlace}`) }), SD);
        inf.ok(!sh.qr && sh.compartir && sh.copiar, "en el móvil, Compartir ofrece compartir y copiar el enlace (sin QR: no se escanea la pantalla que se tiene en la mano)", sh);
      }
      await p.keyboard.press("Escape");
      await abrirContacto(p);
      // se quita la vista adjunta (✕) para que la consulta vaya en JSON; las fotos se prueban en el bloque 7
      await p.click(SEL.quitarFoto(0));
      await p.click(SEL.enviar);
      inf.ok((await p.$$(SEL.invalidos)).length === 4, "enviar el formulario vacío marca los 4 campos obligatorios");
      await p.fill(SEL.nombre, "Lucía Martín"); await p.fill(SEL.telefono, "612 345 678");
      await p.click(SEL.sugerencia); await p.check(SEL.privacidad);
      await p.click(SEL.enviar);
      await p.waitForSelector(SEL.exito, { timeout: 5000 });
      inf.ok(await esperar(p, (s) => !!document.activeElement?.closest(s) && /^Gracias, Lucía/.test(document.activeElement.textContent), SEL.exito, 3000).then(() => true, () => false),
        `${n}: la confirmación («Gracias, Lucía…») recibe el foco, así el lector de pantalla la anuncia seguro (A16)`, await foco(p));
      const h = red.hook[0] ?? {};
      inf.ok(red.hook.length === 1 && h.nombre === "Lucía Martín" && h.referencia === "REF-1234" && h.estancia === "Salón" && h.pregunta?.length > 5, "el CRM recibe nombre, referencia, estancia y la pregunta sugerida", h);
      inf.ok(await p.evaluate(() => window.__registro.some(([e, d]) => e === "contacto" && d.canal === "webhook")), "se emite el evento «contacto» (canal webhook) para la analítica");
    });
  }

  // ================================================================== 2 b · Estilo y luz en un proyecto
  await inf.bloque("Estilo y luz en un proyecto: estilos IA (y colores si el tour los trae)", async () => {
    const { p } = await simulado({ query: "?obra=proyecto" });
    if (!(await inf.requiere(p, { "«Estilo y luz»": SEL.personalizar }, "Estilo y luz en un proyecto"))) return;
    await pulsar(p, SEL.personalizar);
    await p.waitForSelector(SEL.dialogo);
    await p.click(SEL.estilo("nordico")); await p.click(SEL.momento("noche"));
    const est = await p.evaluate(() => ({ ...window.visor.estado }));
    inf.ok(est.estilo === "nordico" && est.momento === "noche", "en un proyecto, «Estilo y luz» aplica el estilo (recreación con IA) y la luz en el visor", est);
    inf.ok(!!(await p.$(SEL.pared("#a9b5a0"))), "si el proyecto trae también colores, se ven los dos (PA3)");
  });

  // ================================================================== 3 · validación
  await inf.bloque("Validación del formulario de contacto", async () => {
    const { p } = await simulado();
    if (!(await inf.requiere(p, piezas("contacto"), "formulario de contacto"))) return;
    await p.evaluate(() => localStorage.clear());
    await abrirContacto(p);
    await p.focus(SEL.nombre); await p.focus(SEL.telefono);
    inf.ok(!(await p.$(`${SEL.dialogo} ${SEL.error}`)), "salir de un campo sin tocarlo no da error");
    await p.fill(SEL.telefono, "123"); await p.focus(SEL.pregunta);
    inf.ok(await p.evaluate((s) => document.querySelector(s).getAttribute("aria-invalid") === "true", SEL.telefono), "un teléfono inválido avisa al salir del campo");
    await p.focus(SEL.telefono); await p.keyboard.type("4");
    inf.ok(await p.evaluate((s) => !document.querySelector(s).hasAttribute("aria-invalid") && document.activeElement === document.querySelector(s) && document.activeElement.value === "1234", SEL.telefono),
      "el error se borra al escribir sin perder el foco ni el cursor");
    await p.fill(SEL.telefono, "612 345 678"); await p.focus(SEL.pregunta);
    await p.click(SEL.enviar);
    inf.ok((await p.$$(SEL.invalidos)).length === 3, "al enviar se marcan los campos que faltan (nombre, pregunta, privacidad)");
    await p.fill(SEL.nombre, "Ana"); await p.fill(SEL.pregunta, "Hola"); await p.check(SEL.privacidad);
    inf.ok((await p.$$(`${SEL.dialogo} ${SEL.error}`)).length === 0, "corregir cada campo borra su error");
    await p.uncheck(SEL.privacidad);
    const priv = await p.evaluate((s) => ({ inv: document.querySelector(s).getAttribute("aria-invalid"), desc: document.querySelector(s).getAttribute("aria-describedby") }), SEL.privacidad);
    inf.ok(priv.inv === "true" && priv.desc.split(" ").length === 2, "desmarcar la privacidad vuelve a avisar y conserva la descripción RGPD junto al error", priv);
  });

  // ================================================================== 4 · CRM caído
  await inf.bloque("CRM caído: reintentar y alternativa por WhatsApp", async () => {
    const { p, red } = await simulado();
    if (!(await inf.requiere(p, piezas("contacto"), "contacto con el CRM caído"))) return;
    red.falla = true;
    await abrirContacto(p);
    await p.fill(SEL.nombre, "Lucía"); await p.fill(SEL.telefono, "+44 7700 900123"); await p.fill(SEL.pregunta, "¿Tiene trastero?"); await p.check(SEL.privacidad);
    await p.click(SEL.enviar);
    await p.waitForSelector(SEL.reintentar, { timeout: 5000 });
    inf.ok(!!(await p.$(SEL.enviarWhatsApp)), "si el CRM falla se ofrecen «Reintentar» y enviar por WhatsApp");
    await p.click(SEL.enviarWhatsApp);
    for (let i = 0; i < 30 && !red.wa.length; i++) await p.waitForTimeout(100); // la ventana de wa.me se intercepta en la red
    const url = decodeURIComponent(red.wa[0] ?? "");
    inf.ok(url.includes("wa.me/34600111222") && url.includes("Lucía") && url.includes("REF-1234") && url.includes("Salón"), "WhatsApp alternativo con el mensaje completo (nombre, referencia, estancia)", url.slice(0, 120));
    inf.ok((await p.evaluate(() => localStorage.getItem("visor:contacto")))?.includes("Lucía"), "nombre y teléfono se recuerdan para la próxima consulta");
  });

  // ================================================================== 5 · WhatsApp, alquiler, idioma y herramientas
  await inf.bloque("Modo WhatsApp, alquiler, idioma y herramientas", async () => {
    const { p, red } = await simulado({ query: "?modo=whatsapp&op=alquiler" });
    if (!(await inf.requiere(p, { ...piezas("contacto", "ficha", "herramientas"), "visita guiada": SEL.guiada, medir: SEL.medir }, "WhatsApp, idioma y herramientas"))) return;
    await p.click(SEL.ficha);
    await p.waitForSelector(SEL.cuerpoPanel);
    inf.ok(!(await p.$(SEL.hipoteca)), "en alquiler no hay calculadora de hipoteca");
    await p.keyboard.press("Escape");
    await abrirContacto(p);
    await p.fill(SEL.nombre, "Pedro Gil"); await p.fill(SEL.telefono, "+34 655 444 333"); await p.fill(SEL.pregunta, "¿Admite mascotas?"); await p.check(SEL.privacidad);
    await p.click(SEL.enviar);
    for (let i = 0; i < 30 && !red.wa.length; i++) await p.waitForTimeout(100);
    inf.ok(red.wa.length === 1 && red.hook.length === 0, "en modo WhatsApp la consulta abre wa.me y no usa el CRM");
    await cerrarDialogo(p);
    await elegirMas(p, "pn-idioma"); await p.click(SEL.idiomaX("en"));
    inf.ok(await esperar(p, (s) => document.documentElement.lang === "en" && document.querySelector(s)?.textContent.trim() === "Contact", SEL.contactoTexto, 3000).then(() => true, () => false)
      && await p.evaluate(() => window.__registro.some(([e, c]) => e === "idioma" && c === "en")), "cambiar a inglés traduce la interfaz y avisa al visor (visor.idioma)");
    await cerrarDialogo(p);
    await p.click(SEL.guiada);
    inf.ok(await p.evaluate((s) => window.visor.estado.guionActivo && document.querySelector(s).getAttribute("aria-pressed") === "true", SEL.guiada), "la visita guiada se inicia y el botón queda pulsado");
    await p.click(SEL.guiada);
    inf.ok(await p.evaluate(() => !window.visor.estado.guionActivo), "y se detiene");
    await p.click(SEL.medir);
    inf.ok(await p.evaluate(() => window.visor.estado.midiendo === true), "«Medir» activa la medición");
    // fuera «Invertir eje» (P-4). Fase 4: el movimiento tiene una sola fuente de verdad, la preferencia común de tema.js
    // (cre8eight:movimiento), que el núcleo lee; visor.ajustes({ reducirMovimiento }) queda como alias (bloque 14)
    await elegirMas(p, "pn-ajustes");
    await p.click(SEL.movimiento);
    const mov = await p.evaluate(() => ({ guardado: localStorage.getItem("cre8eight:movimiento"), html: document.documentElement.dataset.movimiento,
      nucleo: window.visor.ajustes({}).reducirMovimiento }));
    inf.ok(mov.guardado === "reducido" && mov.html === "reducido" && mov.nucleo === true,
      "los ajustes («Reducir movimiento») llegan al núcleo: se guardan en la preferencia común (cre8eight:movimiento) que el visor lee", mov);
  });

  // ================================================================== 6 · francés, trámite y hoja táctil
  await inf.bloque("Francés, certificado en trámite y hoja táctil", async () => {
    const { p, ctx } = await simulado({ ancho: 390, alto: 844, tactil: true, query: "?lang=fr&tramite" });
    if (!(await inf.requiere(p, { "«Estilo y luz»": SEL.personalizar, "hoja del móvil": SEL.peek }, "hoja táctil y «Estilo y luz» en francés"))) return;
    await p.evaluate(() => window.visor.ir("cocina"));
    await pulsar(p, SEL.personalizar);
    inf.ok((await p.textContent(SEL.dialogo)).includes("Non disponible dans cette pièce"), "en una estancia sin máscara se avisa (en francés) de que no se puede pintar");
    await cerrarDialogo(p);
    const caja = await p.locator(SEL.peek).boundingBox();
    const cdp = await ctx.newCDPSession(p);
    const punto = (y) => [{ x: caja.x + 40, y }];
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: punto(caja.y + 10) });
    for (let k = 1; k <= 8; k++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: punto(caja.y + 10 - k * 40) });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    inf.ok(await esperar(p, (s) => document.querySelector(s).dataset.altura !== "peek", SEL.panel, 3000).then(() => true, () => false), "arrastrar la hoja hacia arriba la abre");
    inf.ok(await p.evaluate((s) => /en cours/i.test(document.querySelector(s)?.textContent ?? ""), SEL.energia), "certificado energético «en trámite» traducido");
  });

  // ================================================================== 7 · fotos en la consulta
  await inf.bloque("Fotos en la consulta: estancia, captura, quitar y envío multipart / JSON", async () => {
    {
      const { p, red } = await simulado();
      if (!(await inf.requiere(p, piezas("contacto"), "fotos en la consulta"))) return;
      await abrirContacto(p);
      inf.ok(await p.evaluate((s) => document.querySelector(s).value === "salon", SEL.zona), "la estancia de interés empieza en la estancia que se está viendo");
      const grupos = await p.evaluate((s) => [...document.querySelectorAll(`${s} optgroup`)].map((g) => g.label).join(), SEL.zona);
      inf.ok(grupos === "Zona de día,Zona de noche", `las estancias se agrupan por secciones (${grupos})`);
      // la vista que se adjuntó sola se quita con ✕ (aquí, para contar solo las fotos hechas a mano)
      await p.click(SEL.quitarFoto(0));
      inf.ok((await p.$$(SEL.tira)).length === 0 && await enFoco(p, "hacer-foto"), "la vista adjunta se quita con ✕ y el foco pasa a «Añadir otra vista»");
      await p.selectOption(SEL.zona, "cocina");
      await p.click(SEL.hacerFoto);
      inf.ok(await enFoco(p, "capturar"), "al entrar en modo captura el foco va a «Hacer foto»");
      for (let k = 0; k < 3; k++) { await p.click(SEL.capturar); await fotosEnBarra(p, k + 1); }
      await p.evaluate(() => window.visor.ir("cocina"));
      await p.click(SEL.capturar);
      await fotosEnBarra(p, 4);
      await p.keyboard.press("Escape");
      inf.ok(await enFoco(p, "hacer-foto") && (await p.$$(SEL.tira)).length === 4, "Escape vuelve al formulario con las 4 fotos");
      await p.click(SEL.quitarFoto(1)); await p.click(SEL.quitarFoto(1));
      inf.ok((await p.$$(SEL.tira)).length === 2 && await p.evaluate((s) => document.querySelector(s).value === "cocina", SEL.zona), "quitar fotos no cambia la estancia elegida");
      await rellenar(p);
      await p.click(SEL.enviar);
      await p.waitForSelector(SEL.exito, { timeout: 5000 });
      const h = red.hook[0] ?? {};
      inf.ok(h.tipo?.startsWith("multipart/form-data") && /name="foto_1"/.test(h.crudo) && /name="foto_2"/.test(h.crudo) && !/name="foto_3"/.test(h.crudo), "el CRM recibe un multipart con exactamente las 2 fotos");
      inf.ok(/name="estancia"\r\n\r\nCocina/.test(h.crudo) && /name="estancia_actual"/.test(h.crudo), "y la estancia de interés (Cocina) y la que se estaba viendo");
    }
    {
      const { p, red } = await simulado({ query: "?formato=json" });
      await abrirContacto(p); // la vista actual ya va como foto 1
      await p.click(SEL.hacerFoto); await p.click(SEL.capturar);
      await fotosEnBarra(p, 2);
      await p.click(SEL.capturaListo); await rellenar(p); await p.click(SEL.enviar);
      await p.waitForSelector(SEL.exito, { timeout: 5000 });
      const h = red.hook[0] ?? {};
      inf.ok(Array.isArray(h.fotos) && h.fotos.length === 2 && h.fotos.every((f) => f.base64?.length > 1000 && f.tipo === "image/jpeg" && !!f.enlace),
        "con webhook_formato «json» las fotos (la vista adjunta y la hecha) van en base64 con su enlace");
    }
  });

  // ================================================================== 8 · WhatsApp con fotos
  await inf.bloque("WhatsApp con fotos: en el mismo gesto se copia la foto y se abre el chat (escritorio y móvil)", async () => {
    {
      const { p, red } = await simulado({ query: "?modo=whatsapp", permisos: ["clipboard-read", "clipboard-write"] });
      if (!(await inf.requiere(p, piezas("contacto"), "WhatsApp con fotos"))) return;
      await abrirContacto(p); // foto 1: la vista actual
      await p.click(SEL.hacerFoto);
      await p.click(SEL.capturar); await fotosEnBarra(p, 2);
      await p.click(SEL.capturaListo); await rellenar(p);
      await p.click(SEL.enviar);
      for (let i = 0; i < 30 && !red.wa.length; i++) await p.waitForTimeout(100);
      await p.waitForSelector(SEL.pegar);
      const pre = await p.evaluate((S) => ({ titulo: document.querySelector(`${S.dialogo} .${S.tituloDialogo}`)?.textContent, pasos: document.querySelectorAll(S.pasosWhatsApp).length,
        principales: document.querySelectorAll(S.principal).length, foco: document.activeElement?.dataset.k }), SD);
      inf.ok(red.wa.length === 1 && pre.titulo === "Pega la foto y envía" && !pre.pasos && pre.principales === 1 && pre.foco === "copiar-siguiente",
        "«Enviar por WhatsApp» abre el chat en el mismo gesto (sin pantalla de pasos) y queda una sola pantalla «Pega la foto y envía» con un único botón principal, con el foco", pre);
      await p.bringToFront();
      let tipos = [];
      for (let i = 0; i < 30 && !tipos.includes("image/png"); i++) { // la copia termina de forma asíncrona tras abrir WhatsApp
        tipos = await p.evaluate(async () => { try { return (await navigator.clipboard.read()).flatMap((i) => i.types); } catch (e) { return ["ERR " + e.message]; } });
        if (!tipos.includes("image/png")) await p.waitForTimeout(100);
      }
      const msg = decodeURIComponent(red.wa[0] ?? "");
      const enlaces = msg.replace(/^https:\/\/wa\.me\/\d+\?text=/, "").match(/https?:\/\/\S+/g) ?? [];
      inf.ok(/\*Fotos:\* 1 · Salón, 2 · Salón/.test(msg) && enlaces.length === 1 && /Estancia de interés:\* Salón/.test(msg), "el mensaje nombra cada foto por su estancia y lleva un solo enlace (a la vista)", msg.replace(/\n/g, " ⏎ "));
      inf.ok(tipos.includes("image/png"), `la primera foto queda en el portapapeles para pegarla (${tipos})`);
      await p.click(SEL.copiarSiguiente);
      inf.ok(await esperar(p, (S) => /Foto 2 de 2 copiada/.test(document.querySelector(S.dialogo).innerText) && document.activeElement?.dataset.k === "terminado", SD, 5000).then(() => true, () => false),
        "«Copiar siguiente foto» copia la última y deja el foco en «Ya lo he enviado»");
      await p.click(SEL.terminado);
      inf.ok(/Te responderemos por WhatsApp/.test(await p.textContent(SEL.dialogo)), "confirmación final");
      inf.ok(await enFoco(p, "exito"), "y la confirmación recibe el foco, para que se anuncie (A16)", await foco(p));
    }
    {
      // aunque el móvil pueda compartir archivos, se abre el chat de la agencia (wa.me): la hoja de compartir no sabe a quién enviar
      const init = () => { navigator.canShare = (d) => !!d?.files?.length; navigator.share = async (d) => { window.__compartido = { n: d.files?.length ?? 0, texto: d.text }; }; };
      const { p, red } = await simulado({ ancho: 390, alto: 844, tactil: true, query: "?modo=whatsapp", init });
      await abrirContacto(p); await p.click(SEL.hacerFoto); await p.click(SEL.capturar);
      await fotosEnBarra(p, 2);
      await p.click(SEL.capturaListo); await rellenar(p); await p.click(SEL.enviar);
      for (let i = 0; i < 30 && !red.wa.length; i++) await p.waitForTimeout(100);
      const c = await p.evaluate(() => window.__compartido ?? null);
      inf.ok(red.wa.length === 1 && !c, "en el móvil «Enviar por WhatsApp» abre en el mismo gesto el chat de la agencia (wa.me), no la hoja de compartir del sistema", { wa: red.wa.length, c });
    }
    {
      const init = () => { try { delete Navigator.prototype.canShare; } catch {} navigator.canShare = undefined; };
      const { p } = await simulado({ ancho: 390, alto: 844, tactil: true, query: "?modo=whatsapp", init, permisos: ["clipboard-read", "clipboard-write"] });
      await abrirContacto(p); await p.click(SEL.hacerFoto); await p.click(SEL.capturar);
      await fotosEnBarra(p, 2);
      await p.click(SEL.capturaListo); await rellenar(p); await p.click(SEL.enviar);
      await p.waitForSelector(SEL.pegar);
      const t = await p.textContent(SEL.dialogo);
      inf.ok(/mantén pulsado el cuadro de mensaje y toca Pegar/.test(t) && !/Ctrl\+V|⌘V/.test(t), "en táctil se explica «mantén pulsado… Pegar» (nunca Ctrl+V)");
    }
  });

  // ================================================================== 9 · galería y documentos
  await inf.bloque("Galería, visor de imágenes, documentos y crédito", async () => {
    const { p } = await simulado();
    if (!(await inf.requiere(p, piezas("ficha"), "galería de la ficha"))) return;
    await p.click(SEL.ficha);
    await p.click(SEL.galeriaTipo("render"));
    inf.ok((await p.$$(SEL.galeria)).length === 2, "el filtro por tipo muestra solo los 2 renders");
    await p.click(SEL.galeriaTodo);
    const gal = await p.evaluate((s) => {
      const li = [...document.querySelectorAll(s)], w = (e) => Math.round(e?.getBoundingClientRect().width ?? 0);
      return { n: li.length, fila: w(li[0]?.parentElement), ultima: w(li.at(-1)), primera: w(li[0]) };
    }, SEL.galeria);
    inf.ok(gal.n === 4 && Math.abs(gal.ultima - gal.fila) <= 1 && gal.primera < gal.fila / 2, "con 4 imágenes la última ocupa la fila entera: ninguna queda huérfana (V13)", gal);
    await p.click(SEL.galeriaItem(0));
    await esperar(p, (s) => !!document.activeElement?.closest(s), SEL.lightbox, 3000);
    await p.keyboard.press("ArrowRight");
    inf.ok((await p.textContent(SEL.lightboxNum)) === "2 de 4", "la flecha derecha pasa a la siguiente imagen");
    for (let k = 0; k < 4; k++) await p.keyboard.press("Tab");
    inf.ok(await p.evaluate((s) => !!document.activeElement?.closest(s), SEL.lightbox), "el foco queda atrapado en el visor de imágenes");
    await p.keyboard.press("Escape");
    inf.ok(!(await p.$(SEL.lightbox)) && await enFoco(p, "gal-item-0"), "Escape lo cierra y devuelve el foco a la miniatura");
    const docs = await p.textContent(SEL.documentos);
    inf.ok(docs.includes("Certificado energético (PDF)") && !docs.includes("Modelo del arquitecto"), "se lista la documentación pública y no la privada");
    inf.ok((await p.textContent(SEL.creditoApp)) === "Creado con cre8eight", "crédito «Creado con cre8eight»");
  });

  // ================================================================== 10 · cambio de tour
  await inf.bloque("Cambio de tour (vista previa del Estudio)", async () => {
    const { p } = await simulado();
    if (!(await inf.requiere(p, piezas("ficha"), "ficha tras cambiar de tour"))) return;
    await p.click(SEL.ficha);
    await p.evaluate(() => window.__cambiarTour({ version: 2, titulo: "Chalet del Estudio", idiomas: ["es", "en"], marca: { nombre: "Otra Inmo", color: "#2f6f9f" },
      contacto: { whatsapp: "34600111222" },
      inmueble: { referencia: "EST-9", operacion: "venta", tipo: "chalet", superficie_construida: 210, habitaciones: 5 }, panoramas: [{ id: "a", nombre: "Entrada", x: 0, z: 0, imagen: "a.jpg" }] }));
    // el color de marca lo fija el núcleo (--c-acento); los paneles lo usan en su botón principal
    const r = await p.evaluate((S) => ({ titulo: document.querySelector(S.titulo)?.textContent, precio: document.querySelector(S.precioCabecera)?.textContent, hip: !!document.querySelector(S.hipoteca),
      acento: getComputedStyle(document.querySelector(S.contacto)).backgroundColor, marca: document.querySelector(S.marca)?.textContent, viejo: document.body.innerText.includes("Chamberí") }), SD);
    inf.ok(r.titulo === "Chalet del Estudio" && r.marca === "Otra Inmo" && !r.viejo, "el evento «tour» repinta los paneles con los datos nuevos (nada del tour anterior)", r);
    inf.ok(r.precio === "Precio a consultar" && !r.hip && r.acento === "rgb(47, 111, 159)", "sin precio: «Precio a consultar», sin hipoteca y «Contactar» con el color de la marca nueva", r);
    await p.evaluate(() => { window.visor.tour = { ...window.visor.tour, titulo: "Sin evento", inmueble: { precio: 125000, operacion: "venta" } }; window.visor.emitir("nodo", { id: "a" }); });
    inf.ok(await esperar(p, (S) => document.querySelector(S.titulo)?.textContent === "Sin evento" && document.querySelector(S.precioCabecera)?.textContent.includes("125.000"), SD, 3000).then(() => true, () => false),
      "si visor.tour cambia sin evento, se detecta en el siguiente repintado");
    // Sin WhatsApp, CRM ni email no se ofrece contactar: una consulta que no llega a nadie no se puede «enviar» (M1)
    await p.evaluate(() => window.__cambiarTour({ version: 2, titulo: "Sin contacto", inmueble: { precio: 99000, operacion: "venta" },
      panoramas: [{ id: "a", nombre: "Entrada", x: 0, z: 0, imagen: "a.jpg" }] }));
    const sc = await esperar(p, (S) => document.querySelector(S.titulo)?.textContent === "Sin contacto", SD, 3000)
      .then(() => p.evaluate((S) => ({ contactar: !!document.querySelector(S.contacto), foto: !!document.querySelector("[data-k='foto-vista']") }), SD), () => null);
    inf.ok(sc && !sc.contactar && !sc.foto, "sin WhatsApp, CRM ni email no se ofrecen «Contactar» ni «Foto de la vista» (nunca una confirmación falsa)", sc);
  });

  // ================================================================== 11 · música
  await inf.bloque("Música del proyecto", async () => {
    {
      const { p } = await simulado();
      if (!(await inf.requiere(p, { "«Más»": SEL.mas, ...piezas("ficha") }, "música en Ajustes y en la ficha"))) return;
      await elegirMas(p, "pn-ajustes");
      const a = await p.evaluate((S) => ({ sw: document.querySelector(S.musica)?.checked, vol: document.querySelector(S.volumen)?.value, txt: document.querySelector(S.volumenTxt)?.textContent }), SD);
      inf.ok(a.sw === true && a.vol === "40" && /40/.test(a.txt), "Ajustes muestra la música activa al volumen del proyecto (40 %)", a);
      await p.click(SEL.musica);
      inf.ok(await p.evaluate((s) => window.visor.sonido.activo === false && document.querySelector(s).checked === false, SEL.musica), "el interruptor silencia la música");
      await p.evaluate(() => { window.visor.sonido.volumen = 0.7; window.visor.sonido.alternar(); });
      inf.ok(await esperar(p, (S) => document.querySelector(S.musica).checked === true && document.querySelector(S.volumen).value === "70", SD, 3000).then(() => true, () => false),
        "se sincroniza con el evento «sonido» del núcleo");
      await p.fill(SEL.volumen, "25");
      inf.ok(await p.evaluate(() => Math.abs(window.visor.sonido.volumen - 0.25) < 0.001), "el deslizador fija el volumen del visor");
      await cerrarDialogo(p);
      await p.click(SEL.ficha);
      inf.ok((await p.textContent(SEL.creditoMusica)) === "Música: Brisa de tarde · Laura Gómez (CC BY 4.0)", "la ficha acredita la música (título, autor y licencia)");
    }
    {
      const { p } = await simulado({ query: "?sonido=no" });
      await elegirMas(p, "pn-ajustes");
      inf.ok(!(await p.$(SEL.musica)), "sin música disponible no aparece la fila de música");
    }
  });

  // ================================================================== 12 · teclado
  await inf.bloque("Uso solo con teclado", async () => {
    const { p } = await simulado();
    if (!(await inf.requiere(p, piezas("contacto", "ficha"), "uso con teclado"))) return;
    await p.focus(SEL.ficha); await p.keyboard.press("Enter");
    inf.ok(await esperar(p, (s) => document.querySelector(s)?.getAttribute("aria-expanded") === "true", SEL.ficha, 3000).then(() => true, () => false), "Enter abre la ficha");
    await p.keyboard.press("Escape");
    inf.ok(await enFoco(p, "ficha"), "Escape la cierra y devuelve el foco a su botón");
    await p.focus(SEL.contacto); await p.keyboard.press("Enter");
    inf.ok(await enFoco(p, "c-zona"), "Enter abre el contacto con el foco en la estancia");
    await esperar(p, (s) => document.querySelectorAll(s).length === 1, SEL.tira, 8000).catch(() => {}); // la vista adjunta
    await p.keyboard.press("Shift+Tab");
    inf.ok(await enFoco(p, "hacer-foto"), "Mayús+Tab lleva a «Añadir otra vista» (las fotos van antes de la estancia)");
    await p.keyboard.press("Enter");
    inf.ok(await enFoco(p, "capturar"), "Enter entra en modo captura con el foco en «Hacer foto»");
    await p.keyboard.press("Enter");
    await fotosEnBarra(p, 2);
    await p.keyboard.press("Escape");
    inf.ok(await enFoco(p, "hacer-foto") && (await p.$$(SEL.tira)).length === 2, "Escape vuelve al formulario con la foto hecha (junto a la vista adjunta)");
    await p.keyboard.press("Escape");
    inf.ok(await enFoco(p, "contactar"), "Escape cierra el contacto y devuelve el foco al botón");
  });

  // ================================================================== 12 b · Apariencia y Tamaño (fase 4)
  await inf.bloque("Apariencia, Tamaño y Reducir transparencia: se aplican, se guardan, se comparten y se respetan al recargar", async () => {
    const { p, ctx } = await simulado({ permisos: ["clipboard-read", "clipboard-write"] });
    if (!(await inf.requiere(p, { "«Más»": SEL.mas }, "Apariencia y Tamaño en Ajustes"))) return;
    const html = () => p.evaluate(() => ({ ...document.documentElement.dataset, letra: parseFloat(getComputedStyle(document.documentElement).fontSize) }));
    const guardado = () => p.evaluate(() => Object.fromEntries(["tema", "talla", "transparencia", "movimiento"].map((k) => [k, localStorage.getItem(`cre8eight:${k}`)])));
    const marcados = () => p.evaluate((S) => [...document.querySelectorAll(`${S.dialogoAjustes} [data-pref] input:checked`)].map((r) => r.value).join(","), SD);
    const ini = await html();
    inf.ok(ini.tema === "oscuro" && ini.talla === "m", "sin preferencias guardadas: «Automático» sigue al dispositivo (aquí, oscuro) y la talla es M", ini);
    // contraste del texto principal y secundario de la tarjeta en el peor fondo (oscuro)
    const cOscuro = await contrasteVidrio(p, SEL.tarjeta, [".pn-t-precio", ".pn-t-datos", ".pn-t-sobre"]);
    inf.ok(Object.values(cOscuro).every((x) => x >= 4.5), "oscuro: precio, datos y tipo de la tarjeta con contraste AA (≥ 4,5:1) sobre una foto blanca o negra", cOscuro);
    await elegirMas(p, "pn-ajustes");
    if (!(await inf.requiere(p, { "«Apariencia»": SEL.apariencia("claro"), "«Tamaño»": SEL.talla("l"), "«Reducir transparencia»": SEL.transparencia }, "controles de Apariencia y Tamaño"))) return;
    inf.ok(await marcados() === "auto,m" && await p.getAttribute(SEL.iconoApariencia, "data-v") === "auto", "Ajustes muestra «Automático» y «M» elegidos, con el icono de círculo a medio llenar");
    const a18 = { talla: await p.getByRole("radio", { name: "S, pequeño", exact: true }).count(), atajos: await p.getByRole("switch", { name: "Atajos de teclado", exact: true }).count(),
      nota: await p.evaluate(() => document.getElementById(document.querySelector("[data-k='aj-atajos']")?.getAttribute("aria-describedby"))?.textContent) };
    inf.ok(a18.talla === 1 && a18.atajos === 1 && /una sola letra/.test(a18.nota ?? ""),
      "«S, pequeño» lleva en su nombre la letra que se ve, y la nota de cada interruptor es su descripción, no parte del nombre (A18)", a18);
    // el dialogo no se repinta al cambiar la apariencia: se marca el nodo para comprobar que sigue siendo el mismo
    await p.evaluate((s) => { document.querySelector(s).__mismo = true; }, SEL.dialogoAjustes);
    await p.click(SEL.apariencia("claro"));
    await esperar(p, () => document.documentElement.dataset.tema === "claro", null, 3000).catch(() => {});
    const claro = { html: await html(), guardado: await guardado(), icono: await p.getAttribute(SEL.iconoApariencia, "data-v") };
    inf.ok(claro.html.tema === "claro" && claro.guardado.tema === "claro" && claro.icono === "claro", "«Claro» se aplica (data-tema en <html>) y se guarda en cre8eight:tema", claro);
    const cClaro = await contrasteVidrio(p, SEL.tarjeta, [".pn-t-precio", ".pn-t-datos", ".pn-t-sobre"]);
    inf.ok(Object.values(cClaro).every((x) => x >= 4.5), "claro: precio, datos y tipo de la tarjeta con contraste AA (≥ 4,5:1) sobre una foto blanca o negra", cClaro);
    const cDlg = await contrasteVidrio(p, SEL.dialogoAjustes, [`${SEL.dialogoAjustes} .pn-dlg-tit`, `${SEL.dialogoAjustes} .pn-sec-tit`, `${SEL.dialogoAjustes} .pn-fila-texto small`]);
    inf.ok(Object.values(cDlg).every((x) => x >= 4.5), "claro: título, encabezados y notas de Ajustes con contraste AA sobre una foto blanca o negra", cDlg);
    await p.click(SEL.talla("l"));
    await esperar(p, () => document.documentElement.dataset.talla === "l", null, 3000).catch(() => {});
    const grande = { html: await html(), guardado: await guardado() };
    inf.ok(grande.html.talla === "l" && grande.guardado.talla === "l" && grande.html.letra > ini.letra * 1.12, `«L» se aplica (data-talla), se guarda (cre8eight:talla) y agranda la interfaz (${ini.letra} → ${grande.html.letra} px)`, grande);
    await p.click(SEL.transparencia);
    const opaco = await p.evaluate((S) => ({ html: document.documentElement.dataset.transparencia, guardado: localStorage.getItem("cre8eight:transparencia"),
      fondo: getComputedStyle(document.querySelector(S.tarjeta)).backgroundColor }), SD);
    inf.ok(opaco.html === "reducida" && opaco.guardado === "reducida" && !/rgba\(.*,\s*0?\.\d+\)$/.test(opaco.fondo), "«Reducir transparencia» se aplica (paneles opacos) y se guarda en cre8eight:transparencia", opaco);
    await p.click(SEL.transparencia);
    inf.ok(await p.evaluate((S) => document.querySelector(S.dialogoAjustes)?.__mismo === true && !!document.activeElement?.closest(S.dialogoAjustes), SD),
      "cambiar la apariencia no repinta Ajustes ni le quita el foco");
    // se respeta al recargar
    await p.reload(); await p.waitForSelector(SEL.raiz);
    const tras = await html();
    inf.ok(tras.tema === "claro" && tras.talla === "l" && tras.transparencia === "normal", "al recargar se respetan Claro y L", tras);
    await elegirMas(p, "pn-ajustes");
    inf.ok(await marcados() === "claro,l", "y Ajustes los muestra elegidos");
    // la clave es común: otra página del producto (misma web) la aplica, y un cambio allí llega aquí en vivo
    const otra = await ctx.newPage();
    await otra.goto(`${base}tema-muestra.html`);
    const enOtra = await otra.evaluate(() => ({ ...document.documentElement.dataset }));
    inf.ok(enOtra.tema === "claro" && enOtra.talla === "l", "la preferencia es común: otra página del producto se abre ya en claro y en L", enOtra);
    await p.evaluate((s) => { document.querySelector(s).__mismo = true; }, SEL.dialogoAjustes);
    await otra.evaluate(() => { window.cre8Tema.fijar("tema", "oscuro"); window.cre8Tema.fijar("talla", "s"); });
    const vivo = await esperar(p, (S) => document.documentElement.dataset.tema === "oscuro" && document.documentElement.dataset.talla === "s"
      && [...document.querySelectorAll(`${S.dialogoAjustes} [data-pref] input:checked`)].map((r) => r.value).join() === "oscuro,s"
      && document.querySelector(S.iconoApariencia)?.dataset.v === "oscuro" && document.querySelector(S.dialogoAjustes).__mismo === true, SD, 5000).then(() => true, () => false);
    inf.ok(vivo, "un cambio hecho en otra pestaña se refleja en vivo: <html> y los controles de Ajustes, sin repintarlo");
    await otra.close();
    // ?tema= y ?talla= en la URL (p. ej. al incrustar el tour) mandan sobre lo guardado y Ajustes lo refleja
    const q = await ctx.newPage();
    await q.goto(`${base}pruebas/fixtures/paneles.html?tema=claro&talla=m`); await q.waitForSelector(SEL.raiz);
    await elegirMas(q, "pn-ajustes");
    const url = await q.evaluate((S) => ({ tema: document.documentElement.dataset.tema, talla: document.documentElement.dataset.talla,
      marcados: [...document.querySelectorAll(`${S.dialogoAjustes} [data-pref] input:checked`)].map((r) => r.value).join() }), SD);
    inf.ok(url.tema === "claro" && url.talla === "m" && url.marcados === "claro,m", "?tema=claro&talla=m en la URL mandan sobre lo guardado y Ajustes lo muestra", url);
    // «Restablecer» vuelve a lo de fábrica: Automático, M, transparencia y movimiento automáticos
    await q.click(SEL.restablecer);
    const fabrica = await q.evaluate(() => Object.fromEntries(["tema", "talla", "transparencia", "movimiento"].map((k) => [k, localStorage.getItem(`cre8eight:${k}`)])));
    inf.ok(fabrica.tema === "auto" && fabrica.talla === "m" && fabrica.transparencia === "auto" && fabrica.movimiento === "auto", "«Restablecer» devuelve Apariencia, Tamaño, transparencia y movimiento a automático y M", fabrica);
    await q.close();
    // en el móvil, «Ver ficha» y las opciones de Apariencia y Tamaño son objetivos de 44 px, también con la talla S (A21)
    for (const talla of ["m", "s"]) {
      const m = await simulado({ ancho: 390, alto: 844, tactil: true, query: `?talla=${talla}` });
      const tarjeta = await objetivosPequenos(m.p); // antes de abrir: con la hoja abierta la tarjeta queda inerte (A8)
      await elegirMas(m.p, "pn-ajustes");
      await estable(m.p);
      const peq = [...tarjeta, ...(await objetivosPequenos(m.p))];
      inf.ok(!peq.length, `390×844, talla ${talla.toUpperCase()}: objetivos ≥ 44 px en la tarjeta («Ver ficha»), Apariencia y Tamaño`, peq.join(", "));
      const dx = await sinDesbordeX(m.p);
      inf.ok(dx.ok, `390×844, talla ${talla.toUpperCase()}: sin desplazamiento horizontal con Ajustes abierto`, dx);
    }
    // el aviso de «Enlace copiado» es solo texto (antes un aviso sin botón añadía «null») y el icono pasa a una marca
    await elegirMas(p, "pn-compartir");
    await p.click(SEL.copiarEnlace);
    const copiado = await esperar(p, () => document.querySelector(".pn-toast.pn-visible")?.textContent === "Enlace copiado", null, 3000).then(() => true, () => false);
    inf.ok(copiado && !!(await p.$(".pn-dialogo [data-k='copiar'] .pn-dibujar")), "«Copiar enlace»: aviso «Enlace copiado» (sin «null») y el icono pasa a una marca que se dibuja",
      await p.evaluate(() => document.querySelector(".pn-toast")?.textContent));
    const err = erroresDe(p, IGNORAR);
    inf.ok(!err.length, "sin errores de consola", err.slice(0, 3).join(" | "));
  });

  // ================================================================== 12 c · sin tema.js: reservas
  await inf.bloque("Sin tema.js: Ajustes sin Apariencia y «Reducir movimiento» por el alias del núcleo (visor.ajustes)", async () => {
    const { p } = await simulado({ sinTema: true });
    if (!(await inf.requiere(p, { "«Más»": SEL.mas }, "Ajustes sin tema.js"))) return;
    await elegirMas(p, "pn-ajustes");
    await p.waitForSelector(SEL.movimiento);
    inf.ok(await p.evaluate(([a, t]) => !window.cre8Tema && !document.querySelector(a) && !document.querySelector(t), [SEL.apariencia("auto"), SEL.transparencia]),
      "sin tema.js no se ofrecen Apariencia, Tamaño ni Reducir transparencia (no harían nada)");
    await p.click(SEL.movimiento);
    const r = await p.evaluate(() => ({ alias: window.__registro.some(([e, o]) => e === "ajustes" && o?.reducirMovimiento === true), clase: document.documentElement.classList.contains("pn-sin-movimiento") }));
    inf.ok(r.alias && r.clase, "los ajustes («Reducir movimiento») se envían al núcleo para guardarse (visor.ajustes) y los paneles dejan de animarse", r);
  });

  // ================================================================== 12 d · iconos animados y movimiento reducido
  await inf.bloque("Iconos animados: se dibujan al aparecer y, con «Reducir movimiento», nada se anima", async () => {
    const { p } = await simulado({ query: "?modo=whatsapp" });
    if (!(await inf.requiere(p, piezas("contacto"), "iconos animados"))) return;
    await p.evaluate(() => localStorage.removeItem("cre8eight:movimiento"));
    await pulsar(p, SEL.contacto); await p.waitForSelector(SEL.dialogo);
    const dibujo = await p.evaluate(() => {
      const trazo = document.querySelector(".pn-dialogo .pn-dlg-cab .pn-ic.pn-dibujar path");
      return { animacion: trazo ? getComputedStyle(trazo).animationName : null, largo: trazo?.getAttribute("pathLength") };
    });
    inf.ok(dibujo.animacion === "pn-dibujar" && dibujo.largo === "1", "al abrir un diálogo, el trazo de su icono se dibuja (pathLength 1)", dibujo);
    await cerrarDialogo(p);
    await elegirMas(p, "pn-ajustes");
    await p.click(SEL.movimiento);
    await cerrarDialogo(p);
    await pulsar(p, SEL.contacto); await p.waitForSelector(SEL.dialogo);
    const largas = await p.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.closest?.("#paneles") && a.animationName !== "pn-giro")
      .map((a) => { const t = a.effect.getComputedTiming(); return [a.animationName ?? a.transitionProperty, t.duration, t.delay]; }).filter(([, d, e]) => d > 1 || e > 0));
    inf.ok(!largas.length, "con «Reducir movimiento», ninguna animación de los paneles dura más de 1 ms ni espera su turno (dibujo, entrada, latido…)", largas);
  });

  // ================================================================== 12 e · hojas modales en el teléfono (A8)
  await inf.bloque("Hojas modales en el teléfono: Tab no sale de la hoja y lo de detrás queda inerte solo mientras está abierta (A8)", async () => {
    const { p } = await simulado({ ancho: 390, alto: 844, tactil: true });
    if (!(await inf.requiere(p, { ...piezas("contacto"), "«Más»": SEL.mas }, "hojas modales en el teléfono"))) return;
    // (la ficha plegada ya es inerte por sí misma: no cuenta)
    const inertes = () => p.evaluate(() => [...document.querySelectorAll("[inert]:not(.pn-panel)")].map((e) => e.id || e.className || e.tagName));
    await abrirContacto(p);
    const fuera = new Set();
    for (let i = 0; i < 40; i++) {
      await p.keyboard.press("Tab");
      const f = await p.evaluate((s) => { const a = document.activeElement; return !a || a === document.body || a.closest(s) ? "" : a.dataset?.k || a.id || a.className || a.tagName; }, SEL.dialogo);
      if (f) fuera.add(f);
    }
    const m = await p.evaluate((S) => ({ modal: document.querySelector(S.dialogo)?.getAttribute("aria-modal"), tarjeta: document.querySelector(S.tarjeta)?.inert,
      tostada: document.querySelector(".pn-toast")?.inert, velo: document.querySelector(".pn-velo")?.inert }), SD);
    inf.ok(!fuera.size && m.modal === "true" && m.tarjeta && !m.tostada && !m.velo,
      "con la hoja de contacto abierta, Tab no sale de ella: es modal y lo de detrás queda inerte (no la tostada, que se sigue anunciando, ni el velo)", { fuera: [...fuera], ...m });
    await cerrarDialogo(p);
    const cerrada = { inertes: await inertes(), foco: await foco(p) };
    inf.ok(!cerrada.inertes.length && cerrada.foco === "contactar", "al cerrarla no queda nada inerte y el foco vuelve a «Contactar»", cerrada);
    // con Ajustes abierto, el teléfono pasa a una pantalla de escritorio: otra disposición, el diálogo deja de ser modal
    await elegirMas(p, "pn-ajustes");
    const enHoja = (await inertes()).length;
    await p.setViewportSize({ width: 1280, height: 800 });
    await esperar(p, (s) => document.querySelector(s)?.classList.contains("pn-disp-lateral"), SEL.raiz, 3000).catch(() => {});
    const lateral = { enHoja, inertes: await inertes(), modal: await p.evaluate((s) => document.querySelector(s)?.getAttribute("aria-modal"), SEL.dialogo) };
    inf.ok(lateral.enHoja > 0 && !lateral.inertes.length && lateral.modal === "false", "al cambiar de disposición con Ajustes abierto deja de ser modal y no queda nada inerte", lateral);
    await cerrarDialogo(p);
    // con Idioma abierto llega un tour con un solo idioma (vista previa del Estudio): la hoja se cierra y nada queda inerte
    await p.setViewportSize({ width: 390, height: 844 });
    await esperar(p, (s) => document.querySelector(s)?.classList.contains("pn-disp-hoja"), SEL.raiz, 3000).catch(() => {});
    await elegirMas(p, "pn-idioma");
    const conIdioma = (await inertes()).length;
    await p.evaluate(() => window.__cambiarTour({ version: 2, titulo: "Un solo idioma", idiomas: ["es"], contacto: { whatsapp: "34600111222" },
      inmueble: { precio: 99000, operacion: "venta" }, panoramas: [{ id: "a", nombre: "Entrada", x: 0, z: 0, imagen: "a.jpg" }] }));
    const tour = { conIdioma, dialogo: !!(await p.$(SEL.dialogo)), inertes: await inertes() };
    inf.ok(tour.conIdioma > 0 && !tour.dialogo && !tour.inertes.length, "al cambiar de tour con una hoja abierta que ya no tiene sentido, se cierra y nada queda inerte", tour);
    const err = erroresDe(p, IGNORAR);
    inf.ok(!err.length, "sin errores de consola", err.slice(0, 3).join(" | "));
  });

  // ================================================================== 12 f · tarjeta en reposo, espaciado de texto y «Deshacer»
  await inf.bloque("Tarjeta: en reposo se recoge solo a la vista (A11), con el espaciado aumentado no corta nombres (A12) y «Deshacer» espera (A17)", async () => {
    for (const [n, opciones, nombres] of [["1280×800", {}, ["Foto de la vista", "Estilo y luz", "Visita guiada", "Medir"]],
      ["390×844", { ancho: 390, alto: 844, tactil: true }, ["Foto de la vista", "Estilo y luz"]]]) {
      const { p } = await simulado(opciones);
      if (!(await inf.requiere(p, piezas("contacto", "herramientas"), `${n}: tarjeta en reposo`))) return;
      if (n === "1280×800") {
        // espaciado de texto de WCAG 1.4.12: «Foto de la vista» pasa a dos líneas dentro de su botón, sin puntos suspensivos
        const estilo = await p.addStyleTag({ content: "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }" });
        const et = await p.evaluate((s) => {
          const e = document.querySelector(`${s} [data-k='foto-vista'] .pn-t-et`), r = e.getBoundingClientRect(), b = e.closest("button").getBoundingClientRect();
          return { cabe: e.scrollWidth <= e.clientWidth + 1 && r.left >= b.left - 1 && r.right <= b.right + 1 && r.bottom <= b.bottom + 1, texto: [r.width, r.height].map(Math.round), boton: [b.width, b.height].map(Math.round) };
        }, SEL.tarjeta);
        inf.ok(et.cabe, `${n}: con el espaciado de texto aumentado, «Foto de la vista» cabe en su botón sin cortarse (pasa a dos líneas)`, et);
        await estilo.evaluate((e) => e.remove());
      }
      const ancho = () => p.evaluate((s) => Math.round(document.querySelector(s).getBoundingClientRect().width), SEL.tarjeta);
      const antes = await ancho();
      await p.evaluate(() => { document.activeElement?.blur(); document.body.classList.add("ui-inactiva"); }); // como el núcleo tras 3,5 s
      await estable(p);
      const arbol = await p.locator(SEL.tarjeta).ariaSnapshot();
      const r = await p.evaluate(([s, nombres]) => nombres.map((x) => {
        const b = [...document.querySelectorAll(`${s} button`)].find((e) => (e.getAttribute("aria-label") ?? e.textContent).trim() === x);
        const c = b?.getBoundingClientRect(), dentro = c && document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2);
        return [x, !b ? "no está" : b.contains(dentro) ? "se ve" : "oculto a la vista"];
      }), [SEL.tarjeta, nombres]);
      const despues = await ancho();
      inf.ok(r.every(([, v]) => v === "oculto a la vista") && nombres.every((x) => arbol.includes(`button "${x}"`)) && (n !== "1280×800" || despues < antes),
        `${n}: en reposo la tarjeta se recoge, pero ${nombres.join(", ")} se ocultan solo a la vista: siguen en el árbol de accesibilidad`, { r, antes, despues });
      if (n !== "1280×800") continue;
      // «Deshacer» de «Foto de la vista» no se va mientras tiene el foco; al salir, sí
      await p.evaluate(() => document.body.classList.remove("ui-inactiva"));
      await p.click(`${SEL.tarjeta} [data-k='foto-vista']`);
      await p.waitForSelector(".pn-toast.pn-visible [data-k='aviso-accion']");
      await p.focus("[data-k='aviso-accion']");
      await p.waitForTimeout(6800);
      const sigue = await p.evaluate(() => document.querySelector(".pn-toast")?.classList.contains("pn-visible"));
      await p.focus(SEL.ficha);
      const sale = await esperar(p, () => !document.querySelector(".pn-toast")?.classList.contains("pn-visible"), null, 3000).then(() => true, () => false);
      inf.ok(sigue && sale, "«Deshacer» no desaparece mientras tiene el foco (pasados sus 6 s) y se va al salir de él", { sigue, sale });
    }
  });

  // ================================================================== 13 · núcleo real
  await inf.bloque("Núcleo real: interfaz inactiva y pantalla completa (index.html?demo)", async () => {
    const ctx = await contexto(navegador, { ancho: 1280, alto: 800 });
    inf.cerrarAlFinal.push(ctx);
    const p = await abrir(ctx, `${base}index.html?demo`);
    await esperar(p, (s) => window.visor?.listo === true && document.querySelector(s), SEL.raiz, 90000);
    await p.waitForTimeout(500); // que terminen los cambios de clase del arranque (portada, paneles)
    const antes = await p.evaluate(() => { const b = document.body; window.__cambiosSoloBody = 0; new MutationObserver((m) => { window.__cambiosSoloBody += m.length; }).observe(b, { attributes: true, attributeFilter: ["class"] }); return b.className; });
    await p.waitForTimeout(1000); // se comprueba que NO cambia nada sin tocar
    const r = await p.evaluate((s) => ({ cambios: window.__cambiosSoloBody, body: document.body.className, tarjeta: document.querySelector(s) ? getComputedStyle(document.querySelector(s)).opacity : "1" }), SEL.tarjeta);
    inf.ok(r.cambios === 0 && !r.body.includes("ui-inactiva") && r.tarjeta === "1", `sin tocar nada, la interfaz no parpadea: 0 cambios de clase del body en 1 s (antes «${antes}»)`, r);
    await p.waitForTimeout(3000); // y tampoco se oculta pasado el plazo de inactividad (3,5 s) si nadie ha interactuado
    inf.ok(await p.evaluate(() => !document.body.classList.contains("ui-inactiva") && window.__cambiosSoloBody === 0), "antes de la primera interacción la interfaz no se oculta");
    if (await p.$(SEL.portadaEmpezar)) await p.click(SEL.portadaEmpezar); // con portada, el primer gesto es empezar la visita
    await p.mouse.move(640, 300); await p.keyboard.press("ArrowRight");
    const oculta = await esperar(p, () => document.body.classList.contains("ui-inactiva"), null, 8000).then(() => true, () => false);
    inf.ok(oculta, "tras interactuar y 3,5 s de inactividad, la interfaz se oculta (ui-inactiva)");
    if (await inf.requiere(p, { "tarjeta del inmueble": SEL.tarjeta, ...piezas("contacto") }, "tarjeta visible con la interfaz oculta")) {
      // la tarjeta nunca desaparece: en reposo queda en «349.000 € · Contactar»
      const tras = await p.evaluate((S) => {
        const vis = (s) => { const e = document.querySelector(s); if (!e?.getClientRects().length) return false; for (let n = e; n && n !== document.body; n = n.parentElement) if (+getComputedStyle(n).opacity < 0.5 || getComputedStyle(n).visibility === "hidden") return false; return true; };
        return { precio: vis(S.precioCabecera), contactar: vis(S.contacto), body: document.body.className };
      }, SD);
      inf.ok(tras.precio && tras.contactar && tras.body.includes("ui-inactiva"), "con la interfaz oculta, la tarjeta sigue con el precio y «Contactar»", tras);
    }
    const conPantalla = await inf.requiere(p, { "botón de pantalla completa": SEL.nucleoPantalla }, "botón de pantalla completa");
    if (conPantalla) inf.ok(await p.evaluate((s) => !document.querySelector(s).hidden, SEL.nucleoPantalla), "con la API de pantalla completa el botón está visible");
    const err = erroresDe(p);
    inf.ok(!err.length, "sin errores de consola", err.slice(0, 3).join(" | "));

    const ctx2 = await contexto(navegador, { ancho: 1280, alto: 800 });
    inf.cerrarAlFinal.push(ctx2);
    await ctx2.addInitScript(() => {
      for (const k of ["fullscreenEnabled", "webkitFullscreenEnabled"]) Object.defineProperty(Document.prototype, k, { get: () => false, configurable: true });
    });
    if (conPantalla) {
      const q = await abrir(ctx2, `${base}index.html?demo`);
      await esperar(q, () => window.visor?.listo === true, null, 90000);
      inf.ok(await q.evaluate((s) => document.querySelector(s).hidden, SEL.nucleoPantalla), "sin la API de pantalla completa (p. ej. iPhone) el botón se oculta");
    }
  });

  await inf.bloque("Núcleo real: atajos de una letra apagados (WCAG 2.1.4) y zoom sin pellizco (2.5.1)", async () => {
    const ctx = await contexto(navegador, { ancho: 1280, alto: 800 });
    inf.cerrarAlFinal.push(ctx);
    const p = await abrir(ctx, `${base}index.html?demo`);
    await esperar(p, () => window.visor?.listo === true, null, 90000);
    if (await p.$(SEL.portadaEmpezar)) await p.click(SEL.portadaEmpezar);
    await p.evaluate(() => window.visor.ajustes({ atajos: false }));
    const vista = (q) => q.evaluate(() => ({ nodo: window.visor.estado.nodo, rumbo: Math.round(window.visor.vista().rumbo), fov: window.visor.vista().fov }));
    const mantener = async (q, tecla) => { await q.keyboard.down(tecla); await q.waitForTimeout(900); await q.keyboard.up(tecla); await q.waitForTimeout(600); };
    const v0 = await vista(p);
    await p.focus("#btn-radar");
    await p.keyboard.press("s"); await mantener(p, "e");
    const v1 = await vista(p);
    inf.ok(v1.nodo === v0.nodo && v1.rumbo === v0.rumbo, "con los atajos apagados, S y E no mueven nada con el foco en un botón", { v0, v1 });
    await p.focus("#lienzo"); await mantener(p, "e");
    const v2 = await vista(p);
    inf.ok(v2.rumbo !== v1.rumbo, "con el foco en el lienzo (role=application) las letras sí giran la vista", { v1, v2 });
    // La maqueta también con el teclado (WCAG 2.1.1): flechas para girar, + y − para acercar
    await p.evaluate(() => window.visor.modo("maqueta"));
    await p.waitForTimeout(2500);
    await p.focus("#lienzo");
    const camaraMaqueta = () => p.evaluate(() => String(window.visor._debug.maqueta));
    let antesMaqueta = await camaraMaqueta();
    for (let i = 0; i < 10; i++) { await p.waitForTimeout(500); const c = await camaraMaqueta(); if (c === antesMaqueta) break; antesMaqueta = c; } // que se pare el encuadre inicial
    for (const k of ["ArrowLeft", "ArrowLeft", "ArrowLeft", "Equal", "Equal"]) await p.keyboard.press(k);
    await p.waitForTimeout(1200);
    const trasMaqueta = await camaraMaqueta();
    inf.ok(trasMaqueta !== antesMaqueta, "la maqueta gira y se acerca con el teclado (flechas y +)", { antesMaqueta, trasMaqueta });

    const ctxT = await contexto(navegador, { ancho: 390, alto: 844, movil: true, escala: 2 });
    inf.cerrarAlFinal.push(ctxT);
    const q = await abrir(ctxT, `${base}index.html?demo`);
    await esperar(q, () => window.visor?.listo === true, null, 90000);
    if (await q.$(SEL.portadaEmpezar)) await q.click(SEL.portadaEmpezar);
    const f0 = (await vista(q)).fov;
    await q.evaluate(() => { dispatchEvent(new PointerEvent("pointermove")); window.visor.mas.abrir(); });
    await q.click("#menu-mas [data-id='zoom-acercar']");
    const f1 = (await vista(q)).fov;
    inf.ok(f1 < f0, "en táctil, «Acercar» de «Más» acerca la vista sin pellizcar", { f0, f1 });
    await q.evaluate(() => { dispatchEvent(new PointerEvent("pointermove")); window.visor.mas.abrir(); });
    await q.click("#menu-mas [data-id='pn-ajustes']");
    inf.ok(!!(await q.waitForSelector("[data-k='aj-atajos']", { timeout: 5000 }).catch(() => null)), "en táctil, Ajustes ofrece desactivar los atajos de una letra (un iPad con teclado los recibe)");
  });

  await inf.bloque("Núcleo real: barra de captura sin tapar la galería (3 tamaños)", async () => {
    for (const [n, ancho, alto, tactil] of [["1280×800", 1280, 800, false], ["390×844", 390, 844, true], ["844×390", 844, 390, true]]) {
      const ctx = await contexto(navegador, { ancho, alto, movil: tactil, escala: tactil ? 2 : 1 });
      inf.cerrarAlFinal.push(ctx);
      const p = await abrir(ctx, `${base}index.html?demo`);
      await esperar(p, (s) => window.visor?.listo === true && document.querySelector(s), SEL.raiz, 90000);
      if (await p.$(SEL.portadaEmpezar)) await p.click(SEL.portadaEmpezar);
      if (!(await inf.requiere(p, { ...piezas("contacto"), "galería del núcleo": SEL.nucleoGaleria }, `${n}: barra de captura sobre el núcleo real`))) { await ctx.close(); continue; }
      await pulsar(p, SEL.contacto);
      await esperar(p, (s) => document.querySelectorAll(s).length === 1, SEL.tira, 15000).catch(() => {}); // la vista adjunta (foto 1)
      await p.click(SEL.hacerFoto);
      await p.click(SEL.capturar);
      await p.click(SEL.capturar).catch(() => {}); // una segunda pulsación durante la captura se ignora
      await esperar(p, (s) => /^[23]/.test(document.querySelector(s)?.textContent ?? ""), SEL.numCaptura, 15000);
      const bc = await p.evaluate((S) => {
        const r = document.querySelector(S.barraCaptura)?.getBoundingClientRect(), g = document.querySelector(S.nucleoGaleria)?.getBoundingClientRect();
        const cruza = r && g && g.width && r.left < g.right - 1 && g.left < r.right - 1 && r.top < g.bottom - 1 && g.top < r.bottom - 1;
        return { dentro: !!r && r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, cruza: !!cruza, n: document.querySelector(S.numCaptura)?.textContent };
      }, SD);
      inf.ok(bc.dentro && !bc.cruza, `${n}: la barra de captura cabe en pantalla y no tapa la galería de estancias del núcleo`, bc);
      // al terminar las fotos la tira del núcleo no se mueve debajo de la barra (fase 4: antes, en el escritorio, cada foto
      // publicaba la reserva de la hoja del móvil y el núcleo subía la tira)
      await esperar(p, () => !document.querySelector("[data-k='capturar'][aria-disabled='true']"), null, 15000).catch(() => {});
      await p.waitForTimeout(800);
      const bc2 = await p.evaluate((S) => {
        const r = document.querySelector(S.barraCaptura)?.getBoundingClientRect(), g = document.querySelector(S.nucleoGaleria)?.getBoundingClientRect();
        return { cruza: !!(r && g && g.width && r.left < g.right - 1 && g.left < r.right - 1 && r.top < g.bottom - 1 && g.top < r.bottom - 1),
          reserva: getComputedStyle(document.documentElement).getPropertyValue("--reserva-inferior").trim() };
      }, SD);
      inf.ok(!bc2.cruza, `${n}: al terminar las fotos la barra sigue sin tapar la galería`, bc2);
      await p.click(SEL.capturaListo);
      const err = erroresDe(p);
      inf.ok(!err.length, `${n}: sin errores de consola`, err.slice(0, 3).join(" | "));
      await ctx.close();
    }
  });

  // ================================================================== 14 · núcleo real: cierre de la fase 4 (fase4-cierre.md §2.1)
  await inf.bloque("Núcleo real: portada, marca de color extremo, nombres, foco, vidrio y captura sin flechas (cierre de la fase 4)", async () => {
    const ctx = await contexto(navegador, { ancho: 1280, alto: 800 });
    inf.cerrarAlFinal.push(ctx);
    const p = await abrir(ctx, `${base}index.html?demo`);
    await esperar(p, () => window.visor?.listo === true, null, 90000);
    // M12: con el título automático del Estudio, que ya dice la superficie, la portada no repite los datos
    const portada = await p.evaluate(() => {
      const v = window.visor, datos = () => !document.querySelector("#portada .datos").hidden, titulo = v.tour.titulo;
      const antes = datos();
      v.tour.titulo = "Piso en venta · 2 hab. · 92 m²"; v.idioma(v.estado.idioma);
      const despues = datos();
      v.tour.titulo = titulo; v.idioma(v.estado.idioma);
      return { antes, despues };
    });
    inf.ok(portada.antes && !portada.despues, "la portada no repite «2 habitaciones · 1 baño · 92 m²» si el título ya dice la superficie (M12)", portada);
    if (await p.$(SEL.portadaEmpezar)) await p.click(SEL.portadaEmpezar);
    // M3: las ondas de la música laten al empezar y se quedan quietas (sin fin, recomponían el vidrio en cada fotograma)
    await esperar(p, () => document.querySelector("#btn-sonido.sonando"), null, 15000).catch(() => {});
    const infinitas = await p.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.closest?.("#barra-vista") && a.effect.getComputedTiming().iterations === Infinity).map((a) => a.animationName));
    inf.ok(!infinitas.length, "nada infinito en la barra de vista: las ondas de la música no laten sin fin (M3)", infinitas);
    // M5: un color de marca extremo se acota por tema, con su texto recalculado; sin marca vuelve el champán
    const marca = await p.evaluate(() => {
      const Y = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }).reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0); };
      const leer = () => { const cs = getComputedStyle(document.documentElement), a = cs.getPropertyValue("--c-acento").trim(), s = cs.getPropertyValue("--c-sobre-acento").trim();
        const [x, y] = [Y(a), Y(s)].sort((m, n) => n - m); return { a, Y: +Y(a).toFixed(3), texto: +((x + 0.05) / (y + 0.05)).toFixed(1) }; };
      const poner = (color) => { window.visor.tour.marca.color = color; window.visor.idioma(window.visor.estado.idioma); };
      window.cre8Tema.fijar("tema", "claro"); poner("#ffffff"); const blancoClaro = leer();
      window.cre8Tema.fijar("tema", "oscuro"); const blancoOscuro = leer();
      poner("#000000"); const negroOscuro = leer();
      poner(undefined);
      return { blancoClaro, blancoOscuro, negroOscuro, sinMarca: document.documentElement.style.getPropertyValue("--c-acento") };
    });
    inf.ok(marca.blancoClaro.Y <= 0.56 && marca.blancoOscuro.a === "#ffffff" && marca.negroOscuro.Y >= 0.059 && marca.blancoClaro.texto >= 4.5 && marca.negroOscuro.texto >= 4.5 && !marca.sinMarca,
      "marca blanca o negra: el relleno del acento se acota por tema (blanco → gris en claro, negro → gris oscuro en oscuro), con texto ≥ 4,5:1, al cambiar de tema y sin marca vuelve el champán (M5)", marca);
    // A13, A16, A18, A21, V8, V9 y V14: nombres, regiones, tamaños y material
    const dom = await p.evaluate(() => {
      const cs = (s) => getComputedStyle(document.querySelector(s)), lugar = document.querySelector("#lugar"), titulo = document.querySelector("#titulo").textContent;
      return {
        lugar: !lugar.hasAttribute("aria-label") && lugar.textContent.includes(titulo) && lugar.textContent.trim().endsWith(window.visor.tr("ep.titulo")),
        h1: document.querySelector("h1#titulo-recorrido")?.textContent === titulo,
        modos: [...document.querySelectorAll("#modos label > span")].every((s) => s.getAttribute("aria-hidden") === "true"),
        avisos: document.querySelector("#avisos")?.getAttribute("role") === "status" && ["pista", "aviso", "aviso-juego"].every((id) => document.getElementById(id).parentElement.id === "avisos"),
        ampliar: Math.round(document.querySelector("#btn-ampliar").getBoundingClientRect().width),
        // con el vidrio por pieza, la alfa de cada una sale de lo que tiene detrás: se compara el material (filtro, filo y
        // tinte), no el color resultante
        material: ["backdropFilter", "borderTopColor"].every((k) => cs("#barra-vista")[k] === cs("#lugar")[k])
          && cs("#barra-vista").getPropertyValue("--vidrio-tinte") === cs("#lugar").getPropertyValue("--vidrio-tinte"),
        cortinilla: +cs("#cortinilla").zIndex < +cs("#barra-vista").zIndex,
        estancia: document.querySelector("#estancia").textContent,
      };
    });
    inf.ok(dom.lugar && dom.h1 && dom.modos && dom.avisos, "nombres y regiones: #lugar se llama como lo que se ve (A13), h1 oculto con el título y modos sin texto repetido (A18), avisos en una región viva fija (A16)", dom);
    inf.ok(dom.ampliar >= 36 && dom.material && dom.cortinilla && /\d m²$/.test(dom.estancia) && !/[.,]\d+ m²/.test(dom.estancia),
      "«Ampliar» ≥ 36 px (A21), barra de vista del material del título (V8), comparador bajo el HUD (V9) y superficie sin decimales (V14)", dom);
    // V12: la foto de la vista que recibe la agencia no lleva los aros del suelo; la pantalla los conserva
    await p.evaluate(() => { const v = window.visor, n = v.tour.panoramas.find((x) => x.id === v.estado.nodo), d = n.vecinos[0]; v.estado.rumbo = Math.atan2(d.x - n.x, -(d.z - n.z)); v.estado.cabeceo = -0.45; });
    await p.waitForTimeout(500);
    const v12 = await p.evaluate(async () => {
      const v = window.visor, W = 320, H = 200;
      const pixeles = (fuente) => { const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d"); g.drawImage(fuente, 0, 0, W, H); return g.getImageData(0, 0, W, H).data; };
      const pantalla = () => { v.renderizar(); return pixeles(v.lienzo); };
      const distintos = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 30) n++; return n; };
      const antes = pantalla();
      const foto = pixeles(await createImageBitmap((await v.capturar({ ancho: W, marca: false, tipo: "image/png" })).blob));
      return { sinFlechas: distintos(antes, foto), pantalla: distintos(antes, pantalla()) };
    });
    inf.ok(v12.sinFlechas > 100 && v12.pantalla === 0, "«Foto de la vista» sin las flechas del suelo, y la pantalla las conserva (V12)", v12);
    // A6 y A10: con el teclado, anillo de foco doble sobre la foto; Intro en una etiqueta 3D lleva a esa estancia y el foco
    // queda en el lienzo (antes se perdía en <body>)
    await p.keyboard.press("Tab");
    const etq = await p.evaluate(() => {
      const e = [...document.querySelectorAll(".etq")].find((x) => x.style.display !== "none");
      if (!e) return null;
      e.focus();
      const cs = getComputedStyle(e);
      return { nodo: window.visor.estado.nodo, anillo: e.matches(":focus-visible") && cs.outlineStyle === "solid" && /\b6px\b/.test(cs.boxShadow) };
    });
    await p.keyboard.press("Enter");
    const llega = await esperar(p, (n) => window.visor.estado.nodo !== n, etq?.nodo, 30000).then(() => true, () => false);
    await p.waitForTimeout(500);
    const foco = await p.evaluate(() => document.activeElement?.id);
    inf.ok(etq?.anillo && llega && foco === "lienzo", "anillo de foco doble sobre la foto (A6); Intro en una etiqueta 3D va a la estancia y el foco queda en el lienzo (A10)", { etq, llega, foco });
    // A23: un diálogo de los paneles es vidrio nuevo sobre la foto: el vidrio adaptativo vuelve a medir sin mover la vista
    const medidas = () => p.evaluate(() => window.visor._debug.luz.n);
    let n0 = -1;
    for (let i = 0; i < 12; i++) { const n = await medidas(); if (n === n0) break; n0 = n; await p.waitForTimeout(700); }
    await pulsar(p, SEL.contacto); await p.waitForSelector(SEL.dialogo);
    inf.ok(await esperar(p, (n) => window.visor._debug.luz.n > n, n0, 6000).then(() => true, () => false), "al abrir un diálogo de los paneles, el vidrio adaptativo vuelve a medir (A23)");
    const err = erroresDe(p);
    inf.ok(!err.length, "sin errores de consola", err.slice(0, 3).join(" | "));
  });

  await inf.bloque("Núcleo real: una sola foto, agencia de nombre larguísimo, «Reintentar» que espera y maqueta en vertical (cierre de la fase 4)", async () => {
    const { panoramaPNG } = await import("./e2e-util.mjs");
    const foto = panoramaPNG(512);
    const ctx = await contexto(navegador, { ancho: 390, alto: 844, movil: true, escala: 2 });
    inf.cerrarAlFinal.push(ctx);
    const tours = {
      una: { version: 2, titulo: "Estudio en el centro", marca: { nombre: "InmobiliariaConUnNombreLarguisimoSinEspaciosQueNoCabeEnLaPantallaDelMovil" },
        inmueble: { precio: 150000, operacion: "venta", superficie_construida: 40 }, contacto: { modo: "whatsapp", whatsapp: "34600111222" },
        panoramas: [{ id: "a", nombre: "Estudio", x: 0, z: 0, imagen: "foto.png" }] },
      rota: { version: 2, titulo: "Dos estancias", portada: false,
        panoramas: [{ id: "a", nombre: "Entrada", x: 0, z: 0, imagen: "foto.png", enlaces: ["b"] }, { id: "b", nombre: "Salón", x: 3, z: 0, imagen: "no-existe.png", enlaces: ["a"] }] },
    };
    await ctx.route(/\/tour-(una|rota)\.json$/, (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify(tours[r.request().url().match(/tour-(\w+)\.json$/)[1]]) }));
    await ctx.route(/\/foto\.png$/, (r) => r.fulfill({ contentType: "image/png", body: foto }));
    const p = await abrir(ctx, `${base}index.html?tour=tour-una.json`);
    await esperar(p, () => window.visor?.listo === true, null, 60000);
    const tarjeta = await p.evaluate(() => { const r = document.querySelector("#portada .contenido").getBoundingClientRect(); return { izq: Math.round(r.left), der: Math.round(r.right), ancho: innerWidth }; });
    inf.ok(tarjeta.izq >= 0 && tarjeta.der <= tarjeta.ancho, "390×844: un nombre de agencia larguísimo sin espacios no saca la tarjeta de la portada (M10)", tarjeta);
    await p.click(SEL.portadaEmpezar);
    const pista = await esperar(p, () => !document.querySelector("#pista").hidden, null, 8000).then(() => p.evaluate(() => document.querySelector("#pista").textContent), () => null);
    inf.ok(pista === (await p.evaluate(() => window.visor.tr("aviso.arrastra"))), "con una sola foto la pista dice solo «Arrastra para mirar», sin «moverte» (M11)", pista);
    await abrirHoja(p);
    const tapada = await p.evaluate(() => { const e = document.querySelector("#pista"), oculta = e.hidden; e.hidden = false; const d = getComputedStyle(e).display; e.hidden = oculta; return d; });
    inf.ok(tapada === "none", "con la hoja de la ficha abierta, la pista no asoma por detrás (M11)", tapada);
    // A17: el aviso de una foto que no carga no se va mientras «Reintentar» tiene el foco; al salir, sí
    await p.goto(`${base}index.html?tour=tour-rota.json`);
    await esperar(p, () => window.visor?.listo === true, null, 60000);
    await p.evaluate(() => window.visor.ir("b"));
    await p.waitForSelector("#aviso:not([hidden]) button", { timeout: 20000 });
    await p.focus("#aviso button");
    await p.waitForTimeout(7000); // un aviso de error dura 6 s
    const conFoco = await p.evaluate(() => !document.querySelector("#aviso").hidden);
    await p.focus("#lienzo");
    const seVa = await esperar(p, () => document.querySelector("#aviso").hidden, null, 9000).then(() => true, () => false);
    inf.ok(conFoco && seVa, "«Reintentar» no se va con el foco encima, y el aviso se oculta al salir (A17)", { conFoco, seVa });
    // V4 y A21: en el teléfono, «Ampliar» de 44 px y la maqueta entera en vertical y al girar
    await p.goto(`${base}index.html?demo`);
    await esperar(p, () => window.visor?.listo === true, null, 90000);
    if (await p.$(SEL.portadaEmpezar)) await p.click(SEL.portadaEmpezar);
    inf.ok(await p.evaluate(() => document.querySelector("#btn-ampliar").getBoundingClientRect().width >= 43.5), "en táctil, «Ampliar» del radar mide 44 px (A21)");
    await p.evaluate(() => window.visor.modo("maqueta"));
    await esperar(p, () => document.querySelectorAll(".maq-estancia").length > 0, null, 30000);
    const dentro = () => p.evaluate(() => [...document.querySelectorAll(".maq-estancia, .maq-pin")].filter((e) => { const r = e.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth || r.top < 0 || r.bottom > innerHeight; }).map((e) => e.textContent));
    await p.waitForTimeout(1200);
    const vertical = await dentro();
    await p.setViewportSize({ width: 844, height: 390 });
    await p.waitForTimeout(1200);
    const girado = await dentro();
    inf.ok(!vertical.length && !girado.length, "maqueta: la casa entera en vertical (antes salía cortada) y otra vez encuadrada al girar el teléfono (V4)", { vertical, girado });
    const err = erroresDe(p);
    inf.ok(!err.length, "sin errores de consola", err.slice(0, 3).join(" | "));
  });

  await inf.bloque("Núcleo real: letra del navegador al 200 % y recorrido incrustado en la web de otro (cierre de la fase 4)", async () => {
    const ctx = await contexto(navegador, { ancho: 1280, alto: 800 });
    inf.cerrarAlFinal.push(ctx);
    const p = await ctx.newPage();
    p.errores = [];
    p.on("pageerror", (e) => p.errores.push(e.message));
    const cdp = await ctx.newCDPSession(p);
    await cdp.send("Page.enable");
    await cdp.send("Page.setFontSizes", { fontSizes: { standard: 32, fixed: 26 } });
    await p.goto(`${base}index.html?demo`);
    await esperar(p, () => window.visor?.listo === true, null, 90000);
    if (await p.$(SEL.portadaEmpezar)) await p.click(SEL.portadaEmpezar);
    const fila = await p.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect(), m = r("#modos"), b = r("#barra-vista"), l = r("#lugar");
      const cruza = (a, c) => a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom;
      return { raiz: parseFloat(getComputedStyle(document.documentElement).fontSize), modosBarra: cruza(m, b), lugarBarra: cruza(l, b), modosAbajo: m.top > innerHeight / 2 };
    });
    inf.ok(fila.raiz > 20 && !fila.modosBarra && !fila.lugarBarra && fila.modosAbajo, "con la letra del navegador al 200 %, los modos bajan y no se montan con la barra de vista (A12)", fila);
    // M7: incrustado en la web de otro origen (la de la agencia), el visor no le manda mensajes: su consola se llenaba de
    // avisos de «target origin»
    const q = await ctx.newPage();
    const consola = [];
    q.on("console", (m) => { if (/postMessage|target origin/i.test(m.text())) consola.push(m.text()); });
    await q.goto(`${base.replace("localhost", "127.0.0.1")}pruebas/fixtures/paneles.html`);
    await q.evaluate((src) => { window.__mensajes = 0; addEventListener("message", () => window.__mensajes++); document.body.innerHTML = `<iframe src="${src}" style="width:800px;height:500px"></iframe>`; }, `${base}index.html?demo&embed`);
    const marco = await (await q.waitForSelector("iframe")).contentFrame();
    await marco.waitForFunction(() => window.visor?.listo === true, null, { timeout: 90000 });
    await marco.evaluate(() => window.visor.ir("cocina"));
    await q.waitForTimeout(2500);
    const r7 = { mensajes: await q.evaluate(() => window.__mensajes), consola };
    inf.ok(!r7.mensajes && !r7.consola.length, "incrustado en la web de otro origen, no le envía mensajes ni le llena la consola (M7)", r7);
    const err = erroresDe(p);
    inf.ok(!err.length, "sin errores de consola", err.slice(0, 3).join(" | "));
  });
} catch (e) {
  inf.ok(false, "excepción no controlada", e.message);
} finally {
  await navegador.close();
  cerrar();
}
process.exit(inf.fin());
