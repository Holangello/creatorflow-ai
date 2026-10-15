#!/usr/bin/env node
// Pruebas de extremo a extremo de la exportación (exportar.js) y del visor autónomo, sobre todo por API y por el
// CONTENIDO de lo que se publica (ZIP, HTML, JPEG, PNG, vídeo), para que no dependan de la interfaz.
//   cd tools/visor-inmobiliario && node pruebas/e2e-exportar.mjs
// 1. Build: bundle ligero (sin Spark ni la demo) y completo.        2. ZIP público y copia de seguridad.
// 3. JPEG 360 con GPano.   4. Plano PNG.   5. HTML autónomo: bundle ligero/completo, abierto con file:// sin red,
//    enlaces sin url_publica (nunca file://) y con url_publica.   6. Dossier en francés.
// 7. Demo en vivo: exportar el tour con texturas de three.js, vídeo 16:9 y 9:16 (con imagen y duración) y la demo
//    como HTML autónomo sin red.
// Sale con código 1 si algo falla.
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { servir, lanzar, contexto, abrir, RAIZ } from "./comun.mjs";
import { crearInforme, erroresDe, esperar, leerZip, jsonDe, textoDe, asegurarBuild, glbMinimo } from "./e2e-util.mjs";

// Selectores de la interfaz (agrupados para adaptarlos fácilmente cuando cambie el diseño).
const SEL = {
  compartir: "[data-k='compartir']",                 // botón Compartir de los paneles
  mas: "#btn-mas", compartirMas: "#menu-mas [data-id='pn-compartir']", // fase 3: Compartir está en el menú «Más» del núcleo
  compartirSinWeb: "[data-k='sh-sin-web']",          // aviso «sin dirección web» del diálogo Compartir
  compartirEnlace: ".pn-dialogo input[readonly], .pn-dialogo input[type=url], .pn-dialogo input[type=text]",
  qr: ".pn-qr-img svg", cajaQr: ".pn-qr",
  contacto: ".pn-tarjeta [data-k='contactar']",      // «Contactar» de la tarjeta: adjunta sola la vista actual como foto 1
  hacerFoto: "[data-k='hacer-foto']", capturar: "[data-k='capturar']", capturaListo: "[data-k='captura-listo']", numCaptura: ".pn-bc-num",
  nombre: "[data-k='c-nombre']", telefono: "[data-k='c-telefono']", pregunta: "[data-k='c-pregunta']", privacidad: "[data-k='c-priv']",
  enviar: "[data-k='enviar']",                       // «Enviar por WhatsApp»: copia la foto y abre el chat en el mismo gesto
  paneles: "#paneles",                               // contenedor de los paneles en index.html
  portadaEmpezar: "#portada .empezar",               // portada de la fase 3: «Empezar visita» antes de tocar la interfaz
  // dossier imprimible (documento exportado)
  hoja: ".hoja", hojaTitulos: ".hoja h2", hojaPrecio: ".precio", hojaQr: ".qr svg", hojaPlano: "img.plano", hojaLogo: "header img",
};

const inf = crearInforme("e2e · Exportación");
const { base, cerrar } = await servir();
const navegador = await lanzar();
const TMP = mkdtempSync(join(tmpdir(), "cre8eight-e2e-"));
const MB = 1048576;
const mb = (n) => (n / MB).toFixed(2);
/** Bytes del visor en línea (último <script type="module">) de un HTML autónomo. */
const bytesJS = (html) => { const i = html.lastIndexOf('<script type="module">'), j = html.indexOf("</script>", i); return i < 0 || j < 0 ? 0 : Buffer.byteLength(html.slice(i, j)); };

/** Página con exportar.js y la demo (pruebas/fixtures/exportar.html). */
async function paginaExportar() {
  const ctx = await contexto(navegador, { ancho: 1000, alto: 700 });
  inf.cerrarAlFinal.push(ctx);
  const p = await abrir(ctx, `${base}pruebas/fixtures/exportar.html`);
  await esperar(p, () => window.listo === true);
  return { ctx, p };
}
/** Abre «Compartir»: el botón de los paneles o, desde la fase 3, su elemento del menú «Más» del núcleo. */
async function abrirCompartir(f) {
  if (await f.$(SEL.compartir)) return f.click(SEL.compartir);
  await f.click(SEL.mas);
  await f.click(SEL.compartirMas);
}
/** Abre un HTML autónomo desde el disco (file://). Toda petición http(s) se registra y se aborta (salvo wa.me). */
async function abrirArchivo(ruta, opciones = {}) {
  const ctx = await contexto(navegador, { ancho: 1280, alto: 800, ...opciones });
  inf.cerrarAlFinal.push(ctx);
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"]);
  const red = [], wa = [];
  await ctx.route(/^https?:\/\//, (r) => {
    const u = r.request().url();
    if (/^https:\/\/wa\.me\//.test(u)) { wa.push(u); return r.fulfill({ body: "<h1>wa</h1>", contentType: "text/html" }); }
    red.push(u); return r.abort();
  });
  const p = await abrir(ctx, pathToFileURL(ruta).href);
  p.avisos = [];
  p.on("console", (m) => { if (m.type() === "warning") p.avisos.push(m.text()); });
  p.dialogos = [];
  p.on("dialog", (d) => { p.dialogos.push(d.message()); d.dismiss(); });
  return { ctx, p, red, wa };
}

try {
  // ================================================================== 1 · build
  await inf.bloque("Visor autónomo compilado (npm run build)", async () => {
    const b = asegurarBuild();
    inf.ok(b.ok, `dist/ al día con el código actual${b.recompilado ? " (recompilado)" : ""}`, b.error);
    const completo = readFileSync(join(RAIZ, "dist/visor-autonomo.js"), "utf8"), ligero = readFileSync(join(RAIZ, "dist/visor-autonomo-ligero.js"), "utf8");
    inf.ok(ligero.length < 2.5 * MB && completo.length > 2 * ligero.length, `bundle ligero de ${mb(ligero.length)} MB (< 2,5 MB) frente al completo de ${mb(completo.length)} MB`);
    inf.ok(ligero.includes("TOUR_EMBEBIDO") && !ligero.includes("DEMO-001") && completo.includes("DEMO-001"), "el ligero lee el tour incrustado y no lleva la demo; el completo sí la lleva");
  });

  // ================================================================== 2 · ZIP
  await inf.bloque("ZIP público y copia de seguridad (exportarZIP)", async () => {
    const { p } = await paginaExportar();
    const r = await p.evaluate(async () => {
      const { t, archivos } = await tourSintetico();
      const z = await X.exportarZIP(t, archivos);
      const c = await X.exportarZIP(t, archivos, { copiaSeguridad: true, incluirVisor: false });
      return { zip: await b64(z), avisos: z.avisos, copia: await b64(c) };
    });
    const z = leerZip(Buffer.from(r.zip, "base64")), rutas = Object.keys(z), tz = jsonDe(z["tour.json"]);
    const visor = ["index.html", "visor.js", "visor.css", "paneles.js", "paneles.css", "i18n.js", "util.js", "plano.js", "guion.js", "medicion.js", "maqueta.js", "vendor/qr.js"];
    inf.ok(visor.every((f) => rutas.includes(f)), "el ZIP lleva el visor completo para publicarlo tal cual", visor.filter((f) => !rutas.includes(f)).join(", "));
    const diseno = ["tema.js", "tema.css", "vendor/fonts/inter/inter-latin-opsz-normal.woff2", "vendor/fonts/inter/inter-latin-ext-opsz-normal.woff2", "vendor/fonts/inter/OFL.txt"];
    inf.ok(diseno.every((f) => rutas.includes(f)), "el ZIP lleva el sistema de diseño (tema.js, tema.css y la fuente Inter con su licencia)", diseno.filter((f) => !rutas.includes(f)).join(", "));
    const sobran = ["demo.js", "exportar.js", "vendor/fflate.js", "vendor/fix-webm-duration.js"].filter((f) => rutas.includes(f));
    inf.ok(!sobran.length, "el ZIP NO lleva la demo ni las herramientas de exportación (demo.js, exportar.js, fflate, fix-webm-duration)", sobran.join(", "));
    inf.ok(tz.panoramas.every((x) => rutas.includes(x.imagen) && rutas.includes(x.miniatura)) && rutas.includes("marca/logo.svg"), "las fotos, miniaturas y el logo viajan en el ZIP con sus rutas");
    inf.ok(/^recursos\//.test(tz.panoramas[0].imagen_movil) && rutas.includes(tz.panoramas[0].imagen_movil) && /^recursos\//.test(tz.panoramas[1].puntos[0].imagen),
      "las imágenes blob: y data: se guardan como archivos en recursos/ y el tour.json apunta a ellos");
    inf.ok(!rutas.some((x) => x.startsWith("estudio/") || x.includes("nota-simple")) && !("documentacion" in tz) && !("_estudio" in tz),
      "lo publicado no incluye material privado, la carpeta estudio/ ni datos internos");
    inf.ok(r.avisos.some((a) => a.includes("docs/no-existe.pdf")), "un documento que no existe se avisa en vez de romper la exportación", r.avisos);
    inf.ok(rutas.includes("LEEME.txt") && textoDe(z["LEEME.txt"]).includes("SUBIRLO A TU HOSTING"), "incluye LEEME.txt con las instrucciones de publicación");
    const c = leerZip(Buffer.from(r.copia, "base64")), tc = jsonDe(c["tour.json"]);
    inf.ok("docs/nota-simple.pdf" in c && "estudio/proyecto.json" in c && tc.documentacion?.[0]?.publico === false && !("index.html" in c),
      "la copia de seguridad sí guarda lo privado y el proyecto de trabajo (y no el visor)");
  });

  // ================================================================== 3 · GPano
  await inf.bloque("Fotos 360 con metadatos GPano (jpegConGPano / leerGPano)", async () => {
    const { p } = await paginaExportar();
    const g = await p.evaluate(async () => {
      const jpg = await panoSintetico("GPANO", 2048);
      const con = await X.jpegConGPano(jpg, { rumboInicial: 370 });
      const doble = await X.jpegConGPano(con, { rumboInicial: 90 });
      const bytes = new TextDecoder("latin1").decode(new Uint8Array(await doble.arrayBuffer()));
      const recorte = await X.jpegConGPano(jpg, { alto: 800 });
      const dePNG = await X.jpegConGPano(await panoSintetico("PNG", 1024, "image/png"));
      const norte = await X.jpegConGPano(jpg, { rumboInicial: 30, rumboNorte: 100 });
      const ligero = await X.jpegParaPortal(jpg, { maxMB: 0.03 });
      return { a: await X.leerGPano(con), b: await X.leerGPano(doble), xmps: (bytes.match(/GPano:ProjectionType/g) ?? []).length, c: await X.leerGPano(recorte),
        d: await X.leerGPano(dePNG), dTipo: dePNG.type, n: await X.leerGPano(norte), original: jpg.size, portal: ligero.size, portalTipo: ligero.type };
    });
    inf.ok(g.a.ProjectionType === "equirectangular" && g.a.UsePanoramaViewer === "True" && g.a.FullPanoWidthPixels === "2048" && g.a.FullPanoHeightPixels === "1024" && g.a.InitialViewHeadingDegrees === "10",
      "XMP GPano completo y rumbo inicial normalizado (370° → 10°)", g.a);
    inf.ok(g.b.InitialViewHeadingDegrees === "90" && g.xmps === 1, "volver a escribir GPano sustituye el XMP anterior (no lo duplica)");
    inf.ok(g.c.CroppedAreaImageHeightPixels === "800" && g.c.FullPanoHeightPixels === "1024" && g.c.CroppedAreaTopPixels === "112", "un panorama recortado se declara centrado en la esfera completa", g.c);
    inf.ok(g.dTipo === "image/jpeg" && g.d.FullPanoWidthPixels === "1024", "un PNG se convierte a JPEG con GPano");
    inf.ok(g.n.PoseHeadingDegrees === "100" && g.n.InitialViewHeadingDegrees === "130", "con brújula: PoseHeadingDegrees y vista inicial como rumbo de brújula", g.n);
    inf.ok(g.portal <= 0.03 * MB && g.portal < g.original && g.portalTipo === "image/jpeg", `jpegParaPortal reduce la foto por debajo del límite (${(g.original / 1024).toFixed(0)} → ${(g.portal / 1024).toFixed(0)} KB)`);
  });

  // ================================================================== 4 · plano
  await inf.bloque("Plano PNG (exportarPlano)", async () => {
    const { p } = await paginaExportar();
    const r = await p.evaluate(async () => {
      const medir = async (b) => {
        const bm = await createImageBitmap(b); const c = new OffscreenCanvas(bm.width, bm.height); const g = c.getContext("2d"); g.drawImage(bm, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data; let tinta = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] < 600) tinta++;
        return { w: bm.width, h: bm.height, tinta: tinta / (d.length / 4), tipo: b.type };
      };
      return { a: await medir(await X.exportarPlano(DEMO_TOUR, "p0")), b: await medir(await X.exportarPlano(DEMO_TOUR, "p0", { px: 1200, medidas: false, idioma: "de" })) };
    });
    inf.ok(r.a.tipo === "image/png" && r.a.w === 2400 && r.a.tinta > 0.02, `plano de 2400 px con muros, estancias y medidas (${Math.round(r.a.tinta * 100)} % de trazo)`);
    inf.ok(r.b.w === 1200 && r.b.tinta > 0.01 && r.b.tinta < r.a.tinta * 1.5, "el tamaño y las opciones (sin medidas, otro idioma) se respetan");
  });

  // ================================================================== 5 · HTML autónomo
  await inf.bloque("HTML autónomo: bundle ligero, sin red desde file:// y enlaces", async () => {
    const { p } = await paginaExportar();
    const glb = glbMinimo().toString("base64");
    const r = await p.evaluate(async (glb) => {
      const { t, archivos } = await tourSintetico();
      const jsDe = (html) => { const i = html.lastIndexOf('<script type="module">'), j = html.indexOf("</script>", i); return new Blob([html.slice(i, j)]).size; };
      const sin = await X.exportarHTMLAutonomo(t, archivos);
      const t2 = structuredClone(t); t2.url_publica = "https://ejemplo.com/tour/";
      const con = await X.exportarHTMLAutonomo(t2, archivos);
      const t3 = structuredClone(t); t3.libre = { tipo: "glb", url: "modelo/modelo.glb" };
      const a3 = new Map(archivos); a3.set("modelo/modelo.glb", new Blob([Uint8Array.from(atob(glb), (c) => c.charCodeAt(0))], { type: "model/gltf-binary" }));
      const libre = await (await X.exportarHTMLAutonomo(t3, a3, { incluirLibre: true })).text();
      const sinLibre = await (await X.exportarHTMLAutonomo(t3, a3)).text();
      return { sin: await sin.text(), con: await con.text(), libreJS: jsDe(libre), libreGLB: libre.includes("data:model/gltf-binary"), sinLibreJS: jsDe(sinLibre), sinLibreGLB: sinLibre.includes("data:model/gltf-binary"), avisos: sin.avisos };
    }, glb);
    const js = bytesJS(r.sin);
    inf.ok(js > 0 && js < 2.5 * MB && r.sin.includes("window.TOUR_EMBEBIDO"), `sin modo libre usa el visor ligero: ${mb(js)} MB de JS (< 2,5 MB) en un HTML de ${mb(Buffer.byteLength(r.sin))} MB`);
    inf.ok(!r.sin.includes("nota-simple") && !r.sin.includes('"_estudio"') && !r.sin.includes("estudio/proyecto.json"), "el HTML autónomo no incrusta material privado ni datos internos");
    inf.ok(r.libreJS > 4 * MB && r.libreGLB, `con incluirLibre y modo libre se usa el visor completo (${mb(r.libreJS)} MB) y el GLB va incrustado`);
    inf.ok(r.sinLibreJS < 2.5 * MB && !r.sinLibreGLB, "un tour con modo libre exportado sin incluirLibre sigue siendo ligero y no incrusta el modelo");

    for (const [nombre, html] of [["sin-web.html", r.sin], ["con-web.html", r.con]]) writeFileSync(join(TMP, nombre), html);
    // --- sin url_publica: nunca se comparte una ruta file://
    {
      const { p: f, red, wa } = await abrirArchivo(join(TMP, "sin-web.html"));
      await esperar(f, (s) => window.visor?.listo === true && document.querySelector(`${s} *`), SEL.paneles, 60000);
      if (await f.$(SEL.portadaEmpezar)) await f.click(SEL.portadaEmpezar); // con portada, lo de detrás está inerte hasta empezar
      inf.ok(f.errores.length === 0 && f.dialogos.length === 0, "abierto con doble clic (file://) llega a visor.listo sin errores", f.errores.slice(0, 3).join(" | "));
      const tema = await f.evaluate(() => ({ api: typeof window.cre8Tema?.fijar === "function", tema: document.documentElement.dataset.tema ?? "", fuente: [...document.fonts].some((x) => /Inter/i.test(x.family)) }));
      inf.ok(tema.api && tema.tema && tema.fuente && r.sin.includes("data:font/woff2"), "el HTML autónomo lleva el sistema de diseño en línea: tema.js aplica el tema y la fuente Inter va incrustada", tema);
      inf.ok(red.length === 0, "funciona sin conexión: ninguna petición a la red", red.slice(0, 3).join(" | "));
      inf.ok(await f.evaluate(() => window.visor.enlaceVista() === ""), "sin url_publica, visor.enlaceVista() devuelve \"\" (no la ruta del disco)");
      if (await inf.requiere(f, { compartir: [SEL.compartir, SEL.mas], contacto: SEL.contacto }, "Compartir y contacto en el HTML autónomo sin web")) {
        await abrirCompartir(f);
        await f.waitForSelector(SEL.compartirSinWeb);
        inf.ok(!(await f.$(SEL.qr)), "Compartir explica que no hay dirección web («sh-sin-web») y no genera QR");
        // Contacto por WhatsApp con una foto: ningún enlace file:// en el mensaje
        await f.keyboard.press("Escape");
        await f.locator(SEL.contacto).first().click();
        await f.click(SEL.hacerFoto);
        await f.click(SEL.capturar);
        await esperar(f, (s) => document.querySelector(s)?.textContent?.startsWith("2"), SEL.numCaptura, 15000).catch(() => {}); // la vista adjunta y la hecha
        await f.click(SEL.capturaListo);
        await f.fill(SEL.nombre, "Lucía Martín"); await f.fill(SEL.telefono, "612 345 678"); await f.fill(SEL.pregunta, "¿Se puede visitar el sábado?");
        await f.check(SEL.privacidad);
        await f.click(SEL.enviar);
        for (let i = 0; i < 50 && !wa.length; i++) await f.waitForTimeout(100); // la ventana de wa.me se intercepta en la red
        const msg = decodeURIComponent(wa[0] ?? "");
        if (process.env.E2E_DEPURAR) console.log(msg);
        inf.ok(wa.length === 1 && msg.includes("Lucía Martín") && !/file:/i.test(msg), "el mensaje de WhatsApp lleva la consulta y ninguna ruta file://", msg.replace(/\n/g, " ⏎ ").slice(0, 200));
        // Sin web no hay enlace que poner: el mensaje no deja líneas colgando («📷 Foto N – estancia:» ni «*Vista:*» vacías).
        const vacias = msg.split("\n").map((l) => l.trim()).filter((l) => /^📷.*:$/u.test(l) || /^\*[^*]+:\*$/.test(l));
        inf.ok(wa.length === 1 && !vacias.length, "sin dirección web, el mensaje de WhatsApp no deja líneas sin enlace («Foto 1 – …:» ni «Vista:» vacías)", vacias);
      }
      const fuga = await f.evaluate((s) => [...document.querySelectorAll("[href], [src]")].map((e) => e.getAttribute("href") ?? e.getAttribute("src")).filter((u) => /^file:/i.test(u ?? "")).concat(/file:\/\//.test(document.querySelector(s)?.innerText ?? "") ? ["texto de los paneles"] : []), SEL.paneles);
      inf.ok(!fuga.length, "ningún enlace, imagen ni texto de la interfaz contiene una ruta file://", fuga.slice(0, 3).join(" | "));
    }
    // --- con url_publica: los enlaces apuntan a la web publicada
    {
      const { p: f } = await abrirArchivo(join(TMP, "con-web.html"));
      await esperar(f, (s) => window.visor?.listo === true && document.querySelector(`${s} *`), SEL.paneles, 60000);
      if (await f.$(SEL.portadaEmpezar)) await f.click(SEL.portadaEmpezar); // con portada, lo de detrás está inerte hasta empezar
      const enlace = await f.evaluate(() => window.visor.enlaceVista());
      inf.ok(enlace.startsWith("https://ejemplo.com/tour/#v="), `con url_publica el enlace a la vista empieza por esa dirección (${enlace.slice(0, 48)}…)`);
      if (await inf.requiere(f, { compartir: [SEL.compartir, SEL.mas] }, "Compartir con url_publica en el HTML autónomo")) {
        await abrirCompartir(f);
        await esperar(f, (s) => [...document.querySelectorAll(s)].some((i) => i.value.includes("https://ejemplo.com/tour/")), SEL.compartirEnlace, 10000);
        inf.ok(!(await f.$(SEL.compartirSinWeb)), "Compartir ofrece ese enlace para copiar, por WhatsApp o por email");
        const qr = await esperar(f, ([s, caja]) => !!document.querySelector(s) || document.querySelector(caja)?.hidden, [SEL.qr, SEL.cajaQr], 8000).then(() => f.$(SEL.qr)).then((e) => !!e, () => false);
        // pintarQR() importa «./vendor/qr.js» con la ruta literal: esbuild lo incluye en el bundle y funciona desde file://
        inf.ok(qr, "con url_publica, Compartir muestra también el código QR en el HTML autónomo", f.avisos.filter((a) => /QR/.test(a)).join(" | "));
      }
    }
  });

  // ================================================================== 6 · dossier
  await inf.bloque("Dossier imprimible en francés (abrirFichaImprimible)", async () => {
    const { ctx, p } = await paginaExportar();
    const [pop] = await Promise.all([ctx.waitForEvent("page"), p.evaluate(() => {
      const t = structuredClone(DEMO_TOUR); t.marca.logo = URL.createObjectURL(logoSVG());
      X.abrirFichaImprimible(t, { enlace: "https://www.ejemplo.com/tours/atico/?ref=DEMO-001#salon", idioma: "fr" });
    })]);
    await pop.waitForSelector(SEL.hoja, { timeout: 30000 });
    const f = await pop.evaluate((S) => ({ lang: document.documentElement.lang, h2: [...document.querySelectorAll(S.hojaTitulos)].map((x) => x.textContent),
      precio: document.querySelector(S.hojaPrecio)?.textContent ?? "", qr: !!document.querySelector(S.hojaQr), plano: !!document.querySelector(S.hojaPlano), logo: !!document.querySelector(S.hojaLogo), titulo: document.title }), SEL);
    inf.ok(f.lang === "fr" && ["Informations clés", "Certificat énergétique", "Caractéristiques", "Description", "Plan"].every((x) => f.h2.includes(x)), "dossier con todos los rótulos en francés", f.h2);
    inf.ok(!f.h2.some((x) => ["Key facts", "Energy certificate", "Features", "Floor plan"].includes(x)), "ningún rótulo cae al inglés");
    inf.ok(/349/.test(f.precio) && f.qr && f.plano && f.logo && f.titulo.includes("DEMO-001"), "precio, QR del enlace, plano, logo y referencia en el título");
  });

  // ================================================================== 7 · demo en vivo
  await inf.bloque("Demo en vivo: exportar con texturas de three.js, vídeo y HTML de la demo", async () => {
    const ctx = await contexto(navegador, { ancho: 1280, alto: 720 });
    inf.cerrarAlFinal.push(ctx);
    const p = await abrir(ctx, `${base}index.html?demo`);
    await esperar(p, () => window.visor?.listo === true, null, 90000);
    const r = await p.evaluate(async () => {
      const X = await import("/exportar.js");
      const t0 = performance.now();
      const z = await X.exportarZIP(visor.tour, new Map(), { incluirVisor: false });
      const plano = await X.exportarPlano(visor.tour, undefined, { px: 1200, idioma: "fr" });
      const html = await X.exportarHTMLAutonomo(visor.tour);
      const b = new Uint8Array(await z.arrayBuffer()); let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
      return { zip: btoa(s), ms: Math.round(performance.now() - t0), plano: plano.size, html: await html.text() };
    });
    const tz = jsonDe(leerZip(Buffer.from(r.zip, "base64"))["tour.json"]);
    const tjs = JSON.stringify(tz);
    inf.ok(tz.panoramas?.length === 5 && tjs.length < 200000 && !/isTexture|"uuid"/.test(tjs) && r.plano > 10000,
      `exportar el tour vivo de la demo (con texturas de three.js) no se cuelga: ${r.ms} ms, tour.json de ${(tjs.length / 1024).toFixed(0)} KB`);
    await p.evaluate(async () => { window.__X = await import("/exportar.js"); });
    const [pop] = await Promise.all([ctx.waitForEvent("page"), p.evaluate(() => { window.__X.abrirFichaImprimible(visor.tour, { idioma: "fr" }); })]);
    await pop.waitForSelector(SEL.hoja, { timeout: 30000 });
    inf.ok(!p.isClosed() && await p.evaluate(() => window.visor.listo === true), "el dossier de la demo se genera sin colgar la página");
    await pop.close();

    for (const [formato, w, h] of [["16:9", 1280, 720], ["9:16", 720, 1280]]) {
      const v = await p.evaluate(async (formato) => {
        const X = await import("/exportar.js");
        visor.tour.guion = [{ nodo: "salon", segundos: 1.5, texto: "Salón" }, { nodo: "cocina", segundos: 1.5 }];
        const prog = [];
        const r = await X.grabarVideo(visor, { formato, alto: 720, onProgreso: (f) => prog.push(f) });
        const vid = document.createElement("video");
        vid.muted = true; vid.src = URL.createObjectURL(r.blob);
        await new Promise((ok, mal) => { vid.onloadeddata = ok; vid.onerror = () => mal(new Error("el vídeo no se puede reproducir")); });
        vid.currentTime = 1.2;
        await new Promise((ok) => { vid.onseeked = ok; setTimeout(ok, 3000); });
        const c = document.createElement("canvas"); c.width = vid.videoWidth; c.height = vid.videoHeight;
        const g = c.getContext("2d"); g.drawImage(vid, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data;
        let s = 0, s2 = 0, n = 0;
        for (let i = 0; i < d.length; i += 4 * 61) { const y = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; s += y; s2 += y * y; n++; }
        return { ext: r.extension, mime: r.mimeType, ancho: r.ancho, alto: r.alto, seg: r.segundos, bytes: r.blob.size, prog: prog.at(-1), vw: vid.videoWidth, vh: vid.videoHeight,
          duracion: vid.duration, media: s / n, desv: Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2)) };
      }, formato);
      inf.ok(v.ancho === w && v.alto === h && v.vw === w && v.vh === h && v.prog === 1 && v.bytes > 20000,
        `vídeo ${formato} de la visita guiada: ${v.ext.toUpperCase()} ${v.vw}×${v.vh}, ${(v.bytes / 1024).toFixed(0)} KB`);
      inf.ok(Number.isFinite(v.duracion) && v.duracion > 2 && v.media > 15 && v.desv > 8,
        `el ${formato} tiene duración en la cabecera (${Number.isFinite(v.duracion) ? v.duracion.toFixed(1) : v.duracion} s) e imagen (luminancia ${v.media.toFixed(0)} ± ${v.desv.toFixed(0)})`);
    }
    const err = erroresDe(p);
    inf.ok(!err.length, "la demo no da errores de consola", err.slice(0, 3).join(" | "));

    // La demo como HTML autónomo (un solo archivo para enseñarla sin conexión)
    inf.ok(bytesJS(r.html) > 4 * MB, `la demo usa el visor completo en el HTML autónomo (${mb(bytesJS(r.html))} MB de JS)`);
    writeFileSync(join(TMP, "demo.html"), r.html);
    const { p: f, red } = await abrirArchivo(join(TMP, "demo.html"));
    await esperar(f, () => window.visor?.listo === true, null, 90000);
    inf.ok(f.errores.length === 0 && red.length === 0 && await f.evaluate(() => window.visor.tour.panoramas.length === 5),
      "la demo en HTML autónomo arranca desde file:// sin red y sin errores", [...f.errores, ...red].slice(0, 3).join(" | "));
  });
} catch (e) {
  inf.ok(false, "excepción no controlada", e.message);
} finally {
  await navegador.close();
  cerrar();
  rmSync(TMP, { recursive: true, force: true });
}
process.exit(inf.fin());
