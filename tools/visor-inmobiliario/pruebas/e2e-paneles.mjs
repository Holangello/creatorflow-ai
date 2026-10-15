#!/usr/bin/env node
// Pruebas de extremo a extremo de los paneles del visor (paneles.js): ficha, contacto con fotos y WhatsApp, galería,
// compartir, personalizar, música, idiomas, teclado y objetivos táctiles.
//   cd tools/visor-inmobiliario && node pruebas/e2e-paneles.mjs
// La mayoría usa un visor SIMULADO (pruebas/fixtures/paneles.html, API de ESQUEMA.md sin WebGL: rápido y determinista);
// el último bloque usa el núcleo REAL (index.html?demo): interfaz inactiva, pantalla completa y barra de captura.
// Lo que se comprueba es comportamiento (qué llega al CRM o a WhatsApp, qué guarda, a dónde va el foco, qué cabe en
// pantalla); los selectores están agrupados en SEL para adaptarlos cuando cambie el diseño. Sale con código 1 si algo falla.
import { servir, lanzar, contexto, abrir } from "./comun.mjs";
import { crearInforme, erroresDe, esperar } from "./e2e-util.mjs";

const SEL = {
  raiz: ".pn-raiz",
  ficha: "[data-k='pestana']", peek: "[data-k='peek-precio']", panel: ".pn-panel", cuerpoPanel: ".pn-panel-cuerpo", energia: ".pn-sec-energia",
  contacto: ["[data-k='contacto-dock']", "[data-k='contacto-peek']"], contactoBotones: "[data-k^='contacto-']", whatsappDirecto: ".pn-dock-wa", dock: ".pn-dock",
  personalizar: [".pn-rail [data-k='personalizar']", "[data-k='personalizar-peek']"],
  estilo: (id) => `[data-k='estilo-${id}']`, momento: (id) => `[data-k='momento-${id}']`, pared: (c) => `[data-k='paredes-${c}']`, comparar: "[data-k='comparar']",
  compartir: [".pn-rail [data-k='compartir']", ".pn-fila-herr [data-k='compartir']"], qr: ".pn-qr-img svg",
  ajustes: [".pn-rail [data-k='ajustes']", ".pn-fila-herr [data-k='ajustes']"], invertirY: "[data-k='aj-invertirY']",
  musica: "[data-k='aj-musica']", volumen: "[data-k='aj-volumen']", volumenTxt: "[data-k='aj-vol-txt']", creditoMusica: ".pn-musica-credito", creditoApp: ".pn-credito",
  idioma: "[data-k='idioma']", idiomaX: (c) => `[data-k='idioma-${c}']`, botonDock: ".pn-dock-btn",
  guiada: "[data-k='guiada']", medir: "[data-k='medir']", hipoteca: ".pn-hip", precioCabecera: ".pn-cabecera .pn-precio", titulo: ".pn-titulo", marca: ".pn-marca-nombre",
  dialogo: ".pn-dialogo:not([hidden])", cerrarDialogo: "[data-k='cerrar-dlg']", tituloDialogo: "pn-dlg-tit", cuerpoDialogo: ".pn-dlg-cuerpo",
  zona: "[data-k='c-zona']", nombre: "[data-k='c-nombre']", telefono: "[data-k='c-telefono']", pregunta: "[data-k='c-pregunta']", privacidad: "[data-k='c-priv']",
  sugerencia: "[data-k='sug-contacto.sug_visita']", enviar: "[data-k='enviar']", reintentar: "[data-k='reintentar']", enviarWhatsApp: "[data-k='enviar-wa']",
  exito: ".pn-estado-ok", error: ".pn-error", invalidos: ".pn-dialogo [aria-invalid='true']",
  hacerFoto: "[data-k='hacer-foto']", capturar: "[data-k='capturar']", capturaListo: "[data-k='captura-listo']", quitarFoto: (i) => `[data-k='quitar-${i}']`, tira: ".pn-tira li",
  barraCaptura: ".pn-barra-captura", ayudaCaptura: ".pn-bc-texto", numCaptura: ".pn-bc-num",
  pasosWhatsApp: ".pn-pasos li", principal: ".pn-dialogo .pn-btn-acento", abrirWhatsApp: "[data-k='abrir-wa']", copiarSiguiente: "[data-k='copiar-siguiente']", terminado: "[data-k='terminado']",
  galeriaTipo: (t) => `[data-k='gal-tipo:${t}']`, galeriaTodo: "[data-k='gal-todo']", galeriaItem: (i) => `[data-k='gal-item-${i}']`, galeria: ".pn-galeria li",
  lightbox: ".pn-lb", lightboxNum: ".pn-lb-n", documentos: ".pn-sec-docs",
  nucleoRail: ".pn-rail", nucleoGaleria: "#galeria", nucleoPantalla: "#btn-pantalla",
  portadaEmpezar: "#portada .empezar", // portada de la fase 3: «Empezar visita» es el primer gesto
};

const SD = JSON.parse(JSON.stringify(SEL)); // SEL sin las funciones, para pasarlo a page.evaluate
// Testigos: piezas de la interfaz actual que la fase 3 rehace (tarjeta del inmueble, contacto en 4 toques, menú «Más»).
// Si faltan, el bloque queda «pendiente de la interfaz nueva» en vez de fallar.
const PIEZAS = {
  contacto: { "botón de contacto (dock u hoja)": SEL.contacto },
  ficha: { "pestaña de la ficha u hoja": [SEL.ficha, SEL.peek] },
  herramientas: { "personalizar": SEL.personalizar, "compartir": SEL.compartir, "ajustes": SEL.ajustes },
};
const piezas = (...nombres) => Object.assign({}, ...nombres.map((n) => PIEZAS[n]));
const inf = crearInforme("e2e · Paneles del visor");
const { base, cerrar } = await servir();
const navegador = await lanzar();

/** Visor simulado con la red de WhatsApp y del CRM interceptada. red: { wa: [url], hook: [cuerpo], falla } */
async function simulado({ ancho = 1280, alto = 800, tactil = false, query = "", init = null, permisos = [] } = {}) {
  const ctx = await contexto(navegador, { ancho, alto, movil: tactil, escala: tactil ? 2 : 1 });
  inf.cerrarAlFinal.push(ctx);
  if (permisos.length) await ctx.grantPermissions(permisos);
  if (init) await ctx.addInitScript(init);
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
const abrirContacto = async (p) => { await pulsar(p, SEL.contacto); await p.waitForSelector(SEL.dialogo); await estable(p); };
const rellenar = async (p, pregunta = "¿Se puede tirar esta pared?") => {
  await p.fill(SEL.nombre, "Lucía Martín"); await p.fill(SEL.telefono, "612 345 678"); await p.fill(SEL.pregunta, pregunta); await p.check(SEL.privacidad);
};
const foco = (p) => p.evaluate(() => document.activeElement?.dataset?.k ?? document.activeElement?.className ?? "");
const enFoco = (p, k) => esperar(p, (k) => document.activeElement?.dataset?.k === k, k, 3000).then(() => true, () => false);
const IGNORAR = [/status of 500/];
/** Objetivos táctiles visibles de menos de 44 px dentro de los paneles. */
const objetivosPequenos = (p) => p.evaluate(() => {
  const malos = [];
  for (const el of document.querySelectorAll("#paneles :is(button, a[href], input, select, textarea, summary, [role=switch], [role=radio])")) {
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    if (!r.width || !r.height || s.visibility === "hidden" || el.closest("[inert]") || el.closest(".pn-capturando > :not(.pn-barra-captura)")) continue;
    if (el.matches("input[type=checkbox], input[type=color]")) continue; // la etiqueta o la muestra es el objetivo
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
      const botones = await p.$$eval(SEL.contactoBotones, (bs) => bs.filter((b) => b.getBoundingClientRect().width && /^contacto-/.test(b.dataset.k)).map((b) => b.textContent.trim()));
      inf.ok(botones.length >= 1 && botones.every((t) => t === "Contactar"), `${n}: botón «Contactar» siempre visible`, botones);
      inf.ok(!!(await p.$(SEL.whatsappDirecto)) === (disp === "lateral"), `${n}: acceso directo a WhatsApp solo en escritorio`);
      if (disp === "hoja") inf.ok(parseFloat(await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--reserva-inferior"))) > 50, `${n}: la hoja reserva su alto para que el núcleo no quede debajo (--reserva-inferior)`);
      await abrirContacto(p);
      const v = await p.evaluate((S) => {
        const d = document.querySelector(S.dialogo), f = document.querySelector(S.hacerFoto), z = document.querySelector(S.zona), cuerpo = d.querySelector(S.cuerpoDialogo).getBoundingClientRect();
        const rd = d.getBoundingClientRect(), rf = f.getBoundingClientRect(), dock = document.querySelector(S.dock);
        return { dock: !!dock && dock.getBoundingClientRect().width > 0 && getComputedStyle(dock).display !== "none",
          foto: rf.top >= cuerpo.top - 1 && rf.bottom <= cuerpo.bottom + 1 && rf.bottom <= innerHeight, orden: !!(z.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING),
          dentro: rd.left >= -1 && rd.right <= innerWidth + 1 && rd.top >= -1 && rd.bottom <= innerHeight + 1, foco: document.activeElement?.dataset?.k ?? document.activeElement?.className };
      }, SD);
      inf.ok(v.dentro, `${n}: el diálogo de contacto cabe en pantalla`, v);
      inf.ok(!v.dock, `${n}: con el diálogo abierto el botón de contacto se oculta`, v);
      inf.ok(v.foto && v.orden, `${n}: «Hacer foto» justo bajo la estancia y visible sin desplazar`);
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
        for (const [k, sel] of [["personalizar", SEL.personalizar], ["compartir", SEL.compartir], ["ajustes", SEL.ajustes]]) {
          if (disp === "hoja" && k !== "personalizar") await abrirHoja(p);
          if (![sel].flat().some(Boolean) || !(await p.$([sel].flat().join(", ")))) continue; // esa herramienta no existe en esta disposición
          await pulsar(p, sel, 3000, true);
          await p.waitForSelector(SEL.dialogo);
          await estable(p);
          const pq = await objetivosPequenos(p);
          inf.ok(!pq.length, `${n}: objetivos táctiles ≥ 44 px en ${k}`, pq.join(", "));
          await cerrarDialogo(p);
          if (disp === "hoja") { await p.keyboard.press("Escape"); await estable(p); }
        }
      }
      const err = erroresDe(p, IGNORAR);
      inf.ok(!err.length, `${n}: sin errores de consola`, err.slice(0, 3).join(" | "));
    });
  }

  // ================================================================== 2 · personalizar, compartir y envío
  for (const [n, opciones] of [["escritorio", {}], ["móvil", { ancho: 390, alto: 844, tactil: true }]]) {
    await inf.bloque(`Personalizar, compartir y consulta completa (${n})`, async () => {
      const { p, red } = await simulado(opciones);
      if (!(await inf.requiere(p, piezas("contacto", "herramientas"), "personalizar, compartir y contacto"))) return;
      await pulsar(p, SEL.personalizar);
      await p.click(SEL.estilo("nordico")); await p.click(SEL.momento("noche")); await p.click(SEL.pared("#a9b5a0"));
      const est = await p.evaluate(() => ({ ...window.visor.estado }));
      inf.ok(est.estilo === "nordico" && est.momento === "noche" && est.pintura.paredes === "#a9b5a0", "Personalizar aplica estilo, momento y color de paredes en el visor");
      await p.click(SEL.comparar);
      inf.ok(await p.evaluate(() => window.visor.estado.comparar === true), "«Comparar» activa la vista antes/después");
      await p.keyboard.press("Escape");
      if (!(await visible(p, SEL.compartir))) await abrirHoja(p);
      await pulsar(p, SEL.compartir, 3000, true);
      inf.ok(!!(await p.waitForSelector(SEL.qr, { timeout: 5000 }).catch(() => null)), "Compartir genera el código QR del enlace a la vista");
      await p.keyboard.press("Escape");
      if (n === "móvil") await p.keyboard.press("Escape");
      await abrirContacto(p);
      await p.click(SEL.enviar);
      inf.ok((await p.$$(SEL.invalidos)).length === 4, "enviar el formulario vacío marca los 4 campos obligatorios");
      await p.fill(SEL.nombre, "Lucía Martín"); await p.fill(SEL.telefono, "612 345 678");
      await p.click(SEL.sugerencia); await p.check(SEL.privacidad);
      await p.click(SEL.enviar);
      await p.waitForSelector(SEL.exito, { timeout: 5000 });
      const h = red.hook[0] ?? {};
      inf.ok(red.hook.length === 1 && h.nombre === "Lucía Martín" && h.referencia === "REF-1234" && h.estancia === "Salón" && h.pregunta?.length > 5, "el CRM recibe nombre, referencia, estancia y la pregunta sugerida", h);
      inf.ok(await p.evaluate(() => window.__registro.some(([e, d]) => e === "contacto" && d.canal === "webhook")), "se emite el evento «contacto» (canal webhook) para la analítica");
    });
  }

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
    await esperar(p, () => true);
    for (let i = 0; i < 30 && !red.wa.length; i++) await p.waitForTimeout(100); // la ventana de wa.me se intercepta en la red
    const url = decodeURIComponent(red.wa[0] ?? "");
    inf.ok(url.includes("wa.me/34600111222") && url.includes("Lucía") && url.includes("REF-1234") && url.includes("Salón"), "WhatsApp alternativo con el mensaje completo (nombre, referencia, estancia)", url.slice(0, 120));
    inf.ok((await p.evaluate(() => localStorage.getItem("visor:contacto")))?.includes("Lucía"), "nombre y teléfono se recuerdan para la próxima consulta");
  });

  // ================================================================== 5 · WhatsApp, alquiler, idioma y herramientas
  await inf.bloque("Modo WhatsApp, alquiler, idioma y herramientas", async () => {
    const { p, red } = await simulado({ query: "?modo=whatsapp&op=alquiler" });
    if (!(await inf.requiere(p, { ...piezas("contacto", "ficha", "herramientas"), idioma: SEL.idioma, "visita guiada": SEL.guiada, medir: SEL.medir }, "WhatsApp, idioma y herramientas"))) return;
    await p.click(SEL.ficha);
    await p.waitForSelector(SEL.precioCabecera);
    inf.ok(!(await p.$(SEL.hipoteca)), "en alquiler no hay calculadora de hipoteca");
    await p.keyboard.press("Escape");
    await abrirContacto(p);
    await p.fill(SEL.nombre, "Pedro Gil"); await p.fill(SEL.telefono, "+34 655 444 333"); await p.fill(SEL.pregunta, "¿Admite mascotas?"); await p.check(SEL.privacidad);
    await p.click(SEL.enviar);
    for (let i = 0; i < 30 && !red.wa.length; i++) await p.waitForTimeout(100);
    inf.ok(red.wa.length === 1 && red.hook.length === 0, "en modo WhatsApp la consulta abre wa.me y no usa el CRM");
    await p.keyboard.press("Escape");
    await p.click(SEL.idioma); await p.click(SEL.idiomaX("en"));
    inf.ok(await esperar(p, (s) => document.documentElement.lang === "en" && document.querySelector(s)?.textContent.trim() === "Contact", SEL.botonDock, 3000).then(() => true, () => false)
      && await p.evaluate(() => window.__registro.some(([e, c]) => e === "idioma" && c === "en")), "cambiar a inglés traduce la interfaz y avisa al visor (visor.idioma)");
    await p.keyboard.press("Escape");
    await p.click(SEL.guiada);
    inf.ok(await p.evaluate((s) => window.visor.estado.guionActivo && document.querySelector(s).getAttribute("aria-pressed") === "true", SEL.guiada), "la visita guiada se inicia y el botón queda pulsado");
    await p.click(SEL.guiada);
    inf.ok(await p.evaluate(() => !window.visor.estado.guionActivo), "y se detiene");
    await p.click(SEL.medir);
    inf.ok(await p.evaluate(() => window.visor.estado.midiendo === true), "«Medir» activa la medición");
    await pulsar(p, SEL.ajustes);
    await p.check(SEL.invertirY);
    inf.ok(await p.evaluate(() => JSON.parse(localStorage.getItem("visor:ajustes") ?? "{}").invertirY === true), "los ajustes (invertir eje Y) se guardan");
  });

  // ================================================================== 6 · francés, trámite y hoja táctil
  await inf.bloque("Francés, certificado en trámite y hoja táctil", async () => {
    const { p, ctx } = await simulado({ ancho: 390, alto: 844, tactil: true, query: "?lang=fr&tramite" });
    if (!(await inf.requiere(p, { personalizar: SEL.personalizar, "hoja del móvil": SEL.peek }, "hoja táctil y personalizar en francés"))) return;
    await p.evaluate(() => window.visor.ir("cocina"));
    await pulsar(p, SEL.personalizar);
    inf.ok((await p.textContent(SEL.dialogo)).includes("Non disponible dans cette pièce"), "en una estancia sin máscara se avisa (en francés) de que no se puede pintar");
    await p.keyboard.press("Escape");
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
      await p.selectOption(SEL.zona, "cocina");
      await p.click(SEL.hacerFoto);
      inf.ok(await enFoco(p, "capturar"), "al entrar en modo captura el foco va a «Capturar»");
      for (let k = 0; k < 3; k++) { await p.click(SEL.capturar); await esperar(p, ([s, n]) => document.querySelector(s)?.textContent?.startsWith(String(n)), [SEL.numCaptura, k + 1], 5000); }
      await p.evaluate(() => window.visor.ir("cocina"));
      await p.click(SEL.capturar);
      await esperar(p, ([s, n]) => document.querySelector(s)?.textContent?.startsWith(String(n)), [SEL.numCaptura, 4], 5000);
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
      await abrirContacto(p);
      await p.click(SEL.hacerFoto); await p.click(SEL.capturar);
      await esperar(p, (s) => document.querySelector(s)?.textContent?.startsWith("1"), SEL.numCaptura, 5000);
      await p.click(SEL.capturaListo); await rellenar(p); await p.click(SEL.enviar);
      await p.waitForSelector(SEL.exito, { timeout: 5000 });
      const h = red.hook[0] ?? {};
      inf.ok(Array.isArray(h.fotos) && h.fotos[0]?.base64?.length > 1000 && h.fotos[0].tipo === "image/jpeg" && !!h.fotos[0].enlace, "con webhook_formato «json» las fotos van en base64 con su enlace");
    }
  });

  // ================================================================== 8 · WhatsApp con fotos
  await inf.bloque("WhatsApp con fotos: escritorio (portapapeles) y móvil (compartir archivos)", async () => {
    {
      const { p, red } = await simulado({ query: "?modo=whatsapp", permisos: ["clipboard-read", "clipboard-write"] });
      if (!(await inf.requiere(p, piezas("contacto"), "WhatsApp con fotos"))) return;
      await abrirContacto(p); await p.click(SEL.hacerFoto);
      for (let k = 1; k <= 2; k++) { await p.click(SEL.capturar); await esperar(p, ([s, n]) => document.querySelector(s)?.textContent?.startsWith(String(n)), [SEL.numCaptura, k], 5000); }
      await p.click(SEL.capturaListo); await rellenar(p);
      await p.click(SEL.enviar);
      await p.waitForSelector(SEL.abrirWhatsApp);
      const pre = await p.evaluate((S) => ({ pasos: [...document.querySelectorAll(S.pasosWhatsApp)].map((l) => l.textContent), principales: document.querySelectorAll(S.principal).length, foco: document.activeElement?.dataset.k }), SD);
      inf.ok(red.wa.length === 0 && pre.pasos.length === 3 && /Ctrl\+V|⌘V/.test(pre.pasos[2]) && pre.principales === 1 && pre.foco === "abrir-wa",
        "antes de abrir WhatsApp se explican 3 pasos y hay un único botón principal con el foco", pre);
      await p.click(SEL.abrirWhatsApp);
      for (let i = 0; i < 30 && !red.wa.length; i++) await p.waitForTimeout(100);
      await p.bringToFront();
      let tipos = [];
      for (let i = 0; i < 30 && !tipos.includes("image/png"); i++) { // la foto se copia de forma asíncrona tras abrir WhatsApp
        tipos = await p.evaluate(async () => { try { return (await navigator.clipboard.read()).flatMap((i) => i.types); } catch (e) { return ["ERR " + e.message]; } });
        if (!tipos.includes("image/png")) await p.waitForTimeout(100);
      }
      const msg = decodeURIComponent(red.wa[0] ?? "");
      inf.ok(/Foto 1 – Salón: http/.test(msg) && /Foto 2 – Salón: http/.test(msg) && /Estancia de interés:\* Salón/.test(msg), "el mensaje lleva una línea con el enlace de cada foto");
      inf.ok(tipos.includes("image/png"), `la primera foto queda en el portapapeles para pegarla (${tipos})`);
      await p.click(SEL.copiarSiguiente);
      inf.ok(await esperar(p, (S) => /Foto 2 de 2 copiada/.test(document.querySelector(S.dialogo).innerText) && document.activeElement?.dataset.k === "terminado", SD, 5000).then(() => true, () => false),
        "«Copiar siguiente foto» copia la última y deja el foco en «Ya lo he enviado»");
      await p.click(SEL.terminado);
      inf.ok(/Te responderemos por WhatsApp/.test(await p.textContent(SEL.dialogo)), "confirmación final");
    }
    {
      const init = () => { navigator.canShare = (d) => !!d?.files?.length; navigator.share = async (d) => { window.__compartido = { n: d.files.length, texto: d.text }; }; };
      const { p, red } = await simulado({ ancho: 390, alto: 844, tactil: true, query: "?modo=whatsapp", init });
      await abrirContacto(p); await p.click(SEL.hacerFoto); await p.click(SEL.capturar);
      await esperar(p, (s) => document.querySelector(s)?.textContent?.startsWith("1"), SEL.numCaptura, 5000);
      await p.click(SEL.capturaListo); await rellenar(p); await p.click(SEL.enviar);
      const c = await esperar(p, () => window.__compartido, null, 5000).then(() => p.evaluate(() => window.__compartido), () => null);
      inf.ok(c?.n === 1 && /Foto 1/.test(c.texto) && red.wa.length === 0, "en el móvil la foto se comparte como archivo (navigator.share) junto al mensaje", c);
    }
    {
      const init = () => { try { delete Navigator.prototype.canShare; } catch {} navigator.canShare = undefined; };
      const { p } = await simulado({ ancho: 390, alto: 844, tactil: true, query: "?modo=whatsapp", init, permisos: ["clipboard-read", "clipboard-write"] });
      await abrirContacto(p); await p.click(SEL.hacerFoto); await p.click(SEL.capturar);
      await esperar(p, (s) => document.querySelector(s)?.textContent?.startsWith("1"), SEL.numCaptura, 5000);
      await p.click(SEL.capturaListo); await rellenar(p); await p.click(SEL.enviar);
      await p.waitForSelector(SEL.abrirWhatsApp);
      const t = await p.textContent(SEL.dialogo);
      inf.ok(/mantén pulsado el cuadro de mensaje y toca Pegar/.test(t) && !/Ctrl\+V|⌘V/.test(t), "en táctil sin compartir archivos se explica «mantén pulsado… Pegar» (nunca Ctrl+V)");
    }
  });

  // ================================================================== 9 · galería y documentos
  await inf.bloque("Galería, visor de imágenes, documentos y crédito", async () => {
    const { p } = await simulado();
    if (!(await inf.requiere(p, { "pestaña de la ficha": SEL.ficha }, "galería de la ficha"))) return;
    await p.click(SEL.ficha);
    await p.click(SEL.galeriaTipo("render"));
    inf.ok((await p.$$(SEL.galeria)).length === 2, "el filtro por tipo muestra solo los 2 renders");
    await p.click(SEL.galeriaTodo);
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
    if (!(await inf.requiere(p, { "pestaña de la ficha": SEL.ficha }, "ficha tras cambiar de tour"))) return;
    await p.click(SEL.ficha);
    await p.evaluate(() => window.__cambiarTour({ version: 2, titulo: "Chalet del Estudio", idiomas: ["es", "en"], marca: { nombre: "Otra Inmo", color: "#2f6f9f" },
      inmueble: { referencia: "EST-9", operacion: "venta", tipo: "chalet", superficie_construida: 210, habitaciones: 5 }, panoramas: [{ id: "a", nombre: "Entrada", x: 0, z: 0, imagen: "a.jpg" }] }));
    const r = await p.evaluate((S) => ({ titulo: document.querySelector(S.titulo)?.textContent, precio: document.querySelector(S.precioCabecera)?.textContent, hip: !!document.querySelector(S.hipoteca),
      acento: getComputedStyle(document.documentElement).getPropertyValue("--acento").trim(), marca: document.querySelector(S.marca)?.textContent, viejo: document.body.innerText.includes("Chamberí") }), SD);
    inf.ok(r.titulo === "Chalet del Estudio" && r.marca === "Otra Inmo" && !r.viejo, "el evento «tour» repinta los paneles con los datos nuevos (nada del tour anterior)", r);
    inf.ok(r.precio === "Precio a consultar" && !r.hip && r.acento === "#2f6f9f", "sin precio: «Precio a consultar», sin hipoteca y con el color de la marca nueva", r);
    await p.evaluate(() => { window.visor.tour = { ...window.visor.tour, titulo: "Sin evento", inmueble: { precio: 125000, operacion: "venta" } }; window.visor.emitir("nodo", { id: "a" }); });
    inf.ok(await esperar(p, (S) => document.querySelector(S.titulo)?.textContent === "Sin evento" && document.querySelector(S.precioCabecera)?.textContent.includes("125.000"), SD, 3000).then(() => true, () => false),
      "si visor.tour cambia sin evento, se detecta en el siguiente repintado");
  });

  // ================================================================== 11 · música
  await inf.bloque("Música del proyecto", async () => {
    {
      const { p } = await simulado();
      if (!(await inf.requiere(p, { ajustes: SEL.ajustes, "pestaña de la ficha": SEL.ficha }, "música en Ajustes y en la ficha"))) return;
      await pulsar(p, SEL.ajustes);
      const a = await p.evaluate((S) => ({ sw: document.querySelector(S.musica)?.getAttribute("aria-checked"), vol: document.querySelector(S.volumen)?.value, txt: document.querySelector(S.volumenTxt)?.textContent }), SD);
      inf.ok(a.sw === "true" && a.vol === "40" && /40/.test(a.txt), "Ajustes muestra la música activa al volumen del proyecto (40 %)", a);
      await p.click(SEL.musica);
      inf.ok(await p.evaluate((s) => window.visor.sonido.activo === false && document.querySelector(s).getAttribute("aria-checked") === "false", SEL.musica), "el interruptor silencia la música");
      await p.evaluate(() => { window.visor.sonido.volumen = 0.7; window.visor.sonido.alternar(); });
      inf.ok(await esperar(p, (S) => document.querySelector(S.musica).getAttribute("aria-checked") === "true" && document.querySelector(S.volumen).value === "70", SD, 3000).then(() => true, () => false),
        "se sincroniza con el evento «sonido» del núcleo");
      await p.fill(SEL.volumen, "25");
      inf.ok(await p.evaluate(() => Math.abs(window.visor.sonido.volumen - 0.25) < 0.001), "el deslizador fija el volumen del visor");
      await p.keyboard.press("Escape");
      await p.click(SEL.ficha);
      inf.ok((await p.textContent(SEL.creditoMusica)) === "Música: Brisa de tarde · Laura Gómez (CC BY 4.0)", "la ficha acredita la música (título, autor y licencia)");
    }
    {
      const { p } = await simulado({ query: "?sonido=no" });
      await pulsar(p, SEL.ajustes);
      inf.ok(!(await p.$(SEL.musica)), "sin música disponible no aparece la fila de música");
    }
  });

  // ================================================================== 12 · teclado
  await inf.bloque("Uso solo con teclado", async () => {
    const { p } = await simulado();
    if (!(await inf.requiere(p, { "pestaña de la ficha": SEL.ficha, "botón de contacto": SEL.contacto[0] }, "uso con teclado"))) return;
    await p.focus(SEL.ficha); await p.keyboard.press("Enter");
    inf.ok(await esperar(p, (s) => document.querySelector(s).classList.contains("pn-abierto"), SEL.raiz, 3000).then(() => true, () => false), "Enter abre la ficha");
    await p.keyboard.press("Escape");
    inf.ok(await enFoco(p, "pestana"), "Escape la cierra y devuelve el foco a su botón");
    await p.focus(SEL.contacto[0]); await p.keyboard.press("Enter");
    inf.ok(await enFoco(p, "c-zona"), "Enter abre el contacto con el foco en la estancia");
    await p.keyboard.press("Tab");
    inf.ok(await enFoco(p, "hacer-foto"), "Tab lleva a «Hacer foto de esta vista»");
    await p.keyboard.press("Enter");
    inf.ok(await enFoco(p, "capturar"), "Enter entra en modo captura con el foco en «Capturar»");
    await p.keyboard.press("Enter");
    await esperar(p, (s) => document.querySelector(s)?.textContent?.startsWith("1"), SEL.numCaptura, 5000);
    await p.keyboard.press("Escape");
    inf.ok(await enFoco(p, "hacer-foto") && (await p.$$(SEL.tira)).length === 1, "Escape vuelve al formulario con la foto hecha");
    await p.keyboard.press("Escape");
    inf.ok(await enFoco(p, "contacto-dock"), "Escape cierra el contacto y devuelve el foco al botón");
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
    const r = await p.evaluate((s) => ({ cambios: window.__cambiosSoloBody, body: document.body.className, rail: document.querySelector(s) ? getComputedStyle(document.querySelector(s)).opacity : "1" }), SEL.nucleoRail);
    inf.ok(r.cambios === 0 && !r.body.includes("ui-inactiva") && r.rail === "1", `sin tocar nada, la interfaz no parpadea: 0 cambios de clase del body en 1 s (antes «${antes}»)`, r);
    await p.waitForTimeout(3000); // y tampoco se oculta pasado el plazo de inactividad (3,5 s) si nadie ha interactuado
    inf.ok(await p.evaluate(() => !document.body.classList.contains("ui-inactiva") && window.__cambiosSoloBody === 0), "antes de la primera interacción la interfaz no se oculta");
    if (await p.$(SEL.portadaEmpezar)) await p.click(SEL.portadaEmpezar); // con portada, el primer gesto es empezar la visita
    await p.mouse.move(640, 300); await p.keyboard.press("ArrowRight");
    const oculta = await esperar(p, () => document.body.classList.contains("ui-inactiva"), null, 8000).then(() => true, () => false);
    inf.ok(oculta, "tras interactuar y 3,5 s de inactividad, la interfaz se oculta (ui-inactiva)");
    if (await inf.requiere(p, { "dock de contacto": SEL.dock }, "botón de contacto visible con la interfaz oculta")) {
      const tras = await p.evaluate((S) => ({ raiz: document.querySelector(S.raiz).className, dock: getComputedStyle(document.querySelector(S.dock)).opacity }), SD);
      inf.ok(tras.raiz.includes("pn-interactuado") && tras.dock === "1", "con la interfaz oculta, el botón de contacto sigue visible", tras);
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

  await inf.bloque("Núcleo real: barra de captura sin tapar la galería (3 tamaños)", async () => {
    for (const [n, ancho, alto, tactil] of [["1280×800", 1280, 800, false], ["390×844", 390, 844, true], ["844×390", 844, 390, true]]) {
      const ctx = await contexto(navegador, { ancho, alto, movil: tactil, escala: tactil ? 2 : 1 });
      inf.cerrarAlFinal.push(ctx);
      const p = await abrir(ctx, `${base}index.html?demo`);
      await esperar(p, (s) => window.visor?.listo === true && document.querySelector(s), SEL.raiz, 90000);
      if (await p.$(SEL.portadaEmpezar)) await p.click(SEL.portadaEmpezar);
      if (!(await inf.requiere(p, { ...piezas("contacto"), "galería del núcleo": SEL.nucleoGaleria }, `${n}: barra de captura sobre el núcleo real`))) { await ctx.close(); continue; }
      await pulsar(p, SEL.contacto);
      await p.click(SEL.hacerFoto);
      await p.click(SEL.capturar);
      await p.click(SEL.capturar).catch(() => {}); // una segunda pulsación durante la captura se ignora
      await esperar(p, (s) => /^[12]/.test(document.querySelector(s)?.textContent ?? ""), SEL.numCaptura, 15000);
      const bc = await p.evaluate((S) => {
        const r = document.querySelector(S.barraCaptura)?.getBoundingClientRect(), g = document.querySelector(S.nucleoGaleria)?.getBoundingClientRect();
        const cruza = r && g && g.width && r.left < g.right - 1 && g.left < r.right - 1 && r.top < g.bottom - 1 && g.top < r.bottom - 1;
        return { dentro: !!r && r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, cruza: !!cruza, n: document.querySelector(S.numCaptura)?.textContent };
      }, SD);
      inf.ok(bc.dentro && !bc.cruza, `${n}: la barra de captura cabe en pantalla y no tapa la galería de estancias del núcleo`, bc);
      await p.click(SEL.capturaListo);
      const err = erroresDe(p);
      inf.ok(!err.length, `${n}: sin errores de consola`, err.slice(0, 3).join(" | "));
      await ctx.close();
    }
  });
} catch (e) {
  inf.ok(false, "excepción no controlada", e.message);
} finally {
  await navegador.close();
  cerrar();
}
process.exit(inf.fin());
