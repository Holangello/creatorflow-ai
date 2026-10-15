#!/usr/bin/env node
// Pruebas de seguridad y privacidad de extremo a extremo con datos hostiles.
//   cd tools/visor-inmobiliario && node pruebas/e2e-seguridad.mjs
// El tour hostil (pruebas/fixtures/hostil/tour.json: HTML en los nombres, javascript: en los enlaces, material privado)
// se sirve junto al código ACTUAL del visor; sus imágenes, PDF y GLB se generan al vuelo.
// 1. Visor (escritorio y móvil): ningún enlace javascript:, ningún alert, el HTML de los nombres se ve como texto,
//    documentos sin duplicar y sin los privados.   2. Enlaces peligrosos en los paneles (visor simulado).
// 3. Estudio: un proyecto importado con esos datos se marca en Revisar y lo publicado sale limpio.
// 4. Exportadores (HTML autónomo y dossier) con los datos hostiles.   5. Arrastrar y soltar modelos solo con ?dev.
// Sale con código 1 si algo falla.
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { zipSync } from "fflate";
import { servir, lanzar, contexto, abrir, RAIZ } from "./comun.mjs";
import { crearInforme, erroresDe, esperar, subir, descargar, archivo, asegurarBuild, panoramaPNG, pdfMinimo, glbMinimo, dxfMinimo } from "./e2e-util.mjs";

// Selectores de la interfaz (agrupados para adaptarlos fácilmente cuando cambie el diseño).
const SEL = {
  raiz: ".pn-raiz", paneles: "#paneles",                 // paneles montados / su contenedor en index.html
  ficha: "[data-k='pestana'], [data-k='peek-precio']",   // abrir la ficha (escritorio / móvil)
  cuerpoFicha: ".pn-panel-cuerpo", precio: ".pn-cabecera .pn-precio", mailto: "#paneles a[href^='mailto:']",
  contacto: "[data-k='contacto-dock'], [data-k='contacto-peek']",
  zonas: "[data-k='c-zona'] option",
  documentos: ".pn-docs a",
  tituloPaneles: ".pn-titulo",
  tituloNucleo: "#titulo, #lugar",                       // título del núcleo (la fase 3 lo lleva al botón #lugar)
  puntoInfo: "#etiquetas .info",                         // botón «i» de una nota en la vista 360
  fichaPunto: "#ficha h2",                               // título de la nota abierta
  hoja: ".hoja",
  estudioPasos: "#pasos button", estudioVistaPrevia: "#iframe-visor", estudioAbrir: "#btn-abrir", estudioRestaurar: "dialog[open] >> text=Restaurar copia de seguridad o ZIP",
  estudioErrores: ".comprobacion.error b",
  estudioAvanzado: "details.avanzado", estudioTourJson: "text=Descargar tour.json",
};
const XSS = ["__xss", "__xssweb", "__xsspriv"];
const HOSTIL = join(RAIZ, "pruebas", "fixtures", "hostil");
const tourHostil = JSON.parse(readFileSync(join(HOSTIL, "tour.json"), "utf8"));
const idSalon = tourHostil.panoramas.find((p) => /^salon/.test(p.id)).id;

// Recursos del tour hostil generados al vuelo (no se guardan binarios en el repositorio).
const generados = new Map();
function generar(ruta) {
  if (/\.(jpe?g|png|webp)$/i.test(ruta)) {
    if (!generados.has(ruta)) generados.set(ruta, panoramaPNG(/mini\//.test(ruta) ? 256 : 1024, /noche/.test(ruta) ? { pared: "#3a3f55", suelo: "#2a2018" } : {}));
    return { tipo: "image/png", cuerpo: generados.get(ruta) };
  }
  if (/\.pdf$/i.test(ruta)) return { tipo: "application/pdf", cuerpo: pdfMinimo(1) };
  if (/\.glb$/i.test(ruta)) return { tipo: "model/gltf-binary", cuerpo: glbMinimo() };
  if (/\.dxf$/i.test(ruta)) return { tipo: "application/dxf", cuerpo: dxfMinimo() };
  return null;
}

const inf = crearInforme("e2e · Seguridad y privacidad");
const { base, cerrar } = await servir({ fixture: HOSTIL, generar });
const navegador = await lanzar();
const TMP = mkdtempSync(join(tmpdir(), "cre8eight-seg-"));

/** Página con registro de diálogos nativos (alert/confirm/prompt). */
async function pagina(url, opciones = {}) {
  const ctx = await contexto(navegador, { ancho: 1280, alto: 800, ...opciones });
  inf.cerrarAlFinal.push(ctx);
  await ctx.route(/wa\.me|hook\.ejemplo\.test/, (r) => r.fulfill({ status: 200, body: "{}", contentType: "application/json", headers: { "access-control-allow-origin": "*" } }));
  const p = await abrir(ctx, url);
  p.dialogos = [];
  p.on("dialog", (d) => { p.dialogos.push(d.message()); d.dismiss(); });
  return { ctx, p };
}
/** Paso del Estudio por su #ancla (la fase 3 junta Revisar y Publicar en #publicar; #revisar y #exportar quedan como alias). */
async function paso(p, ancla) {
  await p.evaluate((a) => { location.hash = `#${a}`; }, ancla);
  await esperar(p, (ok) => ok.includes(window.__estudio.seccion), [ancla, "publicar"]);
}
/** Comprobaciones comunes sobre un documento con datos hostiles. */
const auditar = (p) => p.evaluate((xss) => ({
  xss: xss.filter((k) => window[k] !== undefined),
  peligrosos: [...document.querySelectorAll("[href], [src]")].map((e) => e.getAttribute("href") ?? e.getAttribute("src"))
    .filter((u) => /^\s*(javascript|vbscript|data:text\/html)/i.test(u ?? "") || /\t|\n/.test(u ?? "")),
  inyectados: document.querySelectorAll("img[src='x'], [onerror], [onload]:not(body)").length,
  scripts: [...document.querySelectorAll("body script")].filter((s) => /alert|__xss/.test(s.textContent)).length,
}), XSS);

try {
  // ================================================================== 1 · tour hostil en el visor
  for (const [nombre, opciones] of [["escritorio 1280×800", {}], ["móvil 390×844", { ancho: 390, alto: 844, movil: true, escala: 2 }]]) {
    await inf.bloque(`Tour hostil con el código actual (${nombre})`, async () => {
      const { p } = await pagina(`${base}index.html`, opciones);
      await esperar(p, (s) => window.visor?.listo === true && document.querySelector(s), SEL.raiz, 60000);
      const conPaneles = await inf.requiere(p, { ficha: SEL.ficha, contacto: SEL.contacto }, "ficha y contacto con datos hostiles");
      let docs = [], textoFicha = "", zonas = [];
      if (conPaneles) {
        await p.locator(SEL.ficha).first().click();
        await p.evaluate((s) => document.querySelector(s)?.scrollTo(0, 99999), SEL.cuerpoFicha);
        docs = await p.$$eval(SEL.documentos, (as) => as.map((a) => `${a.textContent.trim()} → ${a.getAttribute("href")}`));
        textoFicha = await p.evaluate((s) => document.querySelector(s)?.innerText ?? "", SEL.paneles);
        await p.keyboard.press("Escape");
        await p.locator(SEL.contacto).first().click();
        await p.waitForSelector(SEL.zonas, { state: "attached" });
        zonas = await p.$$eval(SEL.zonas, (os) => os.map((o) => o.textContent));
        await p.keyboard.press("Escape");
      }
      await p.evaluate((id) => window.visor.ir(id), idSalon);
      await esperar(p, (id) => window.visor.estado.nodo === id, idSalon, 30000);
      await p.evaluate((s) => document.querySelector(s)?.click(), SEL.puntoInfo); // abre la nota con <script> en el título
      const r = await auditar(p);
      const textos = await p.evaluate((s) => ({ nucleo: document.querySelector(s.tituloNucleo)?.textContent ?? "", paneles: document.querySelector(s.tituloPaneles)?.textContent ?? "",
        punto: document.querySelector(s.puntoInfo)?.getAttribute("aria-label") ?? "", nota: document.querySelector(s.fichaPunto)?.textContent ?? "" }), SEL);
      inf.ok(!p.dialogos.length && !r.xss.length && !r.scripts, "ningún alert() ni código del tour se ejecuta", [...p.dialogos, ...r.xss]);
      inf.ok(!r.peligrosos.length, "ningún enlace ni recurso javascript:, vbscript: o data:text/html", r.peligrosos);
      inf.ok(!r.inyectados, "el HTML de los nombres no crea elementos (ninguna <img src=x onerror>)");
      inf.ok(textos.nucleo.includes("<img src=x") && (!conPaneles || textos.paneles.includes("<img src=x")), "el título con HTML se muestra como texto en el núcleo y en los paneles", textos);
      if (conPaneles) inf.ok(zonas.some((z) => z.includes("Salón <img src=x")), "las estancias con HTML se listan como texto en el contacto", zonas);
      inf.ok(textos.punto === "Ventanal <script>alert(2)</script>" && textos.nota === textos.punto, "una nota con <script> en el título se abre y se lee como texto en la vista 360", textos);
      if (conPaneles) {
        const memoria = docs.filter((d) => /memoria/i.test(d));
        inf.ok(memoria.length === 1 && docs.length === 1, `documentos sin duplicar: «memoria» una sola vez (${docs.join(" ; ")})`);
        inf.ok(!/nota_simple_PRIVADA|planta_mm|plano_arquitecto/.test(textoFicha) && !docs.some((d) => /privada|dxf|modelo/i.test(d)), "la documentación privada (nota simple, DXF, plano del arquitecto) no aparece");
      }
      const err = erroresDe(p);
      inf.ok(!err.length, "sin errores de consola", err.slice(0, 3).join(" | "));
    });
  }

  // ================================================================== 2 · enlaces peligrosos en los paneles
  await inf.bloque("Enlaces peligrosos y documentos duplicados (paneles con visor simulado)", async () => {
    const { p } = await pagina(`${base}pruebas/fixtures/paneles.html`);
    await p.waitForSelector(SEL.raiz);
    if (!(await inf.requiere(p, { ficha: SEL.ficha, contacto: SEL.contacto }, "enlaces de la ficha y del contacto"))) return;
    await p.evaluate(() => window.__cambiarTour({ version: 2, titulo: "Prueba de enlaces", marca: { nombre: "Inmo", web: "javascript:window.__xss=1", logo: "javascript:alert(1)" },
      agente: { nombre: "Ana", telefono: "javascript:alert(1)", email: "x@y.com?body=<b>" },
      contacto: { modo: "webhook", webhook: "javascript:alert(1)", url_privacidad: "  JaVaScRiPt:alert(1)", whatsapp: "34600111222" },
      inmueble: { precio: "349.000", operacion: "venta",
        documentos: [{ nombre: "Memoria", url: "docs/memoria.pdf" }, { nombre: "Memoria otra vez", url: "./docs/memoria.pdf" }, { nombre: "Malo", url: "javascript:alert(1)" },
          { nombre: "Tab", url: "java\tscript:alert(1)" }, { nombre: "Data PDF", url: "data:application/pdf;base64,JVBERi0=" }, { nombre: "Data HTML", url: "data:text/html,<script>alert(1)</script>" }] },
      documentacion: [{ nombre: "Memoria (Estudio)", archivo: "docs/memoria.pdf", publico: true }, { nombre: "Plano", archivo: "docs/plano.pdf", publico: true }, { nombre: "Privado", archivo: "docs/privado.pdf", publico: false }],
      panoramas: [{ id: "a", nombre: "Entrada", x: 0, z: 0, imagen: "a.jpg" }] }));
    await p.locator(SEL.ficha).first().click();
    await p.locator(SEL.contacto).first().click();
    const r = await auditar(p);
    const d = await p.evaluate((S) => ({ docs: [...document.querySelectorAll(S.documentos)].map((a) => a.textContent.trim()), precio: document.querySelector(S.precio)?.textContent ?? "",
      mailto: [...document.querySelectorAll(S.mailto)].map((a) => a.getAttribute("href")) }), SEL);
    inf.ok(!r.peligrosos.length && !r.xss.length && !p.dialogos.length, "ningún href/src peligroso (también con mayúsculas, espacios o tabuladores) y nada se ejecuta", r.peligrosos);
    inf.ok(d.docs.join("|") === "Memoria|Data PDF|Plano", `documentos sin duplicados ni enlaces peligrosos: ${d.docs.join(" | ")}`);
    inf.ok(!d.mailto.some((h) => h.includes("?body")), "un email con parámetros no se convierte en enlace mailto:", d.mailto);
    inf.ok(/349\.000/.test(d.precio), `un precio escrito como texto («349.000») se interpreta (${d.precio})`);
  });

  // ================================================================== 3 · Estudio
  await inf.bloque("Estudio: importar el proyecto hostil, Revisar lo marca y lo publicado sale limpio", async () => {
    const zip = { "tour.json": [new Uint8Array(readFileSync(join(HOSTIL, "tour.json"))), { level: 6 }] };
    (function rec(v) {
      if (Array.isArray(v)) v.forEach(rec);
      else if (v && typeof v === "object") Object.values(v).forEach(rec);
      else if (typeof v === "string" && !(v in zip)) { const g = generar(v); if (g && /^(panos|plantas|renders|docs|modelo)\//.test(v)) zip[v] = [new Uint8Array(g.cuerpo), { level: 0 }]; }
    })(tourHostil);
    const { p } = await pagina(`${base}estudio.html`, { ancho: 1440, alto: 900 });
    await esperar(p, (s) => window.__estudio?.tour && document.querySelector(s), SEL.estudioPasos);
    await p.click(await inf.pieza(p, SEL.estudioAbrir, "menú «Abrir» del Estudio"));
    await subir(p, await inf.pieza(p, SEL.estudioRestaurar, "«Restaurar copia de seguridad o ZIP»"), [archivo("hostil.zip", Buffer.from(zipSync(zip)))]);
    await esperar(p, () => window.__estudio.tour.panoramas.length === 4 && window.__estudio.guardado === "ok", null, 60000);
    await paso(p, "revisar");
    const errores = await p.$$eval(SEL.estudioErrores, (bs) => bs.map((b) => b.textContent));
    inf.ok(errores.some((e) => /dirección\(es\) web no válidas/.test(e)), "Revisar marca como error las direcciones javascript: del proyecto", errores);
    await paso(p, "exportar");
    await p.evaluate((s) => { for (const d of document.querySelectorAll(s)) if (d.querySelector("summary")?.textContent === "Avanzado") d.open = true; }, SEL.estudioAvanzado);
    const tj = (await descargar(p, SEL.estudioTourJson)).datos.toString("utf8");
    const pub = JSON.parse(tj);
    inf.ok(!/javascript:/i.test(tj), "el tour.json publicado no contiene ningún enlace javascript:");
    inf.ok(pub.documentacion?.length === 1 && pub.documentacion[0].publico === true && !/nota_simple_PRIVADA|planta-mm|plano-arquitecto/.test(tj), "lo publicado solo lleva la documentación pública");
    const r = await auditar(p);
    const marco = await p.evaluate(([xss, s]) => { const w = document.querySelector(s).contentWindow; return { xss: xss.filter((k) => w[k] !== undefined), inyectados: w.document.querySelectorAll("img[src='x']").length }; }, [XSS, SEL.estudioVistaPrevia]);
    inf.ok(!p.dialogos.length && !r.xss.length && !r.inyectados && !marco.xss.length && !marco.inyectados, "ni el Estudio ni su vista previa ejecutan el HTML de los nombres", [...p.dialogos, ...r.xss, ...marco.xss]);
    const err = erroresDe(p);
    inf.ok(!err.length, "sin errores de consola", err.slice(0, 3).join(" | "));
  });

  // ================================================================== 4 · exportadores
  await inf.bloque("Exportadores con datos hostiles: HTML autónomo y dossier", async () => {
    const b = asegurarBuild();
    inf.ok(b.ok, "visor autónomo compilado al día", b.error);
    const { ctx, p } = await pagina(`${base}pruebas/fixtures/exportar.html`, { ancho: 1000, alto: 700 });
    await esperar(p, () => window.listo === true);
    const html = await p.evaluate(async () => {
      const t = await (await fetch("/tour.json")).json();
      return (await X.exportarHTMLAutonomo(t, new Map(), { base: location.origin + "/" })).text();
    });
    const scripts = html.match(/<script\b/gi)?.length ?? 0;
    inf.ok(!html.includes("<script>alert(2)") && !/<img src=x onerror/i.test(html.slice(0, html.indexOf("window.TOUR_EMBEBIDO"))) && scripts === 2,
      "el tour incrustado escapa «<» (\\u003c): los nombres no pueden cerrar el <script> ni inyectar etiquetas");
    inf.ok(!/nota-simple-privada|planta-mm\.dxf|plano-arquitecto\.pdf/.test(html), "el HTML autónomo no incrusta los documentos privados del proyecto");
    writeFileSync(join(TMP, "hostil.html"), html);
    const ctxF = await contexto(navegador, { ancho: 1280, alto: 800 });
    inf.cerrarAlFinal.push(ctxF);
    await ctxF.route(/^https?:\/\//, (r) => r.abort());
    const f = await abrir(ctxF, pathToFileURL(join(TMP, "hostil.html")).href);
    f.dialogos = [];
    f.on("dialog", (d) => { f.dialogos.push(d.message()); d.dismiss(); });
    await esperar(f, () => window.visor?.listo === true, null, 60000);
    if (await f.$(SEL.ficha)) await f.locator(SEL.ficha).first().click();
    const r = await auditar(f);
    inf.ok(!f.dialogos.length && !r.xss.length && !r.peligrosos.length && !r.inyectados && (await f.textContent(SEL.tituloNucleo)).includes("<img src=x"),
      "abierto desde el disco: nada se ejecuta, ningún enlace javascript: y el HTML se ve como texto", [...f.dialogos, ...r.xss, ...r.peligrosos]);

    const [pop] = await Promise.all([ctx.waitForEvent("page"), p.evaluate(async () => { const t = await (await fetch("/tour.json")).json(); window.__t = t; }).then(() => p.evaluate(() => { X.abrirFichaImprimible(window.__t, { enlace: "https://www.ejemplo.com/tour/" }); }))]);
    const dialogosPop = [];
    pop.on("dialog", (d) => { dialogosPop.push(d.message()); d.dismiss(); });
    await pop.waitForSelector(SEL.hoja, { timeout: 30000 });
    const ficha = await pop.evaluate((xss) => ({ h1: document.querySelector("h1")?.textContent ?? "", inyectados: document.querySelectorAll("img[src='x'], [onerror]").length, xss: xss.filter((k) => window[k] !== undefined || window.opener?.[k] !== undefined),
      javascript: [...document.querySelectorAll("[href], [src]")].filter((e) => /^\s*javascript:/i.test(e.getAttribute("href") ?? e.getAttribute("src") ?? "")).length }), XSS);
    inf.ok(ficha.h1.includes("<img src=x") && !ficha.inyectados && !ficha.xss.length && !ficha.javascript && !dialogosPop.length, "el dossier escapa el HTML del título y de la marca", ficha);
  });

  // ================================================================== 5 · arrastrar y soltar
  await inf.bloque("Arrastrar y soltar modelos 3D solo en desarrollo (?dev)", async () => {
    const prueba = async (url) => {
      const { p } = await pagina(url);
      await esperar(p, () => window.visor?.listo === true, null, 60000);
      return p.evaluate(() => {
        const dt = new DataTransfer();
        dt.items.add(new File([new Uint8Array(16)], "modelo.glb", { type: "model/gltf-binary" }));
        const ev = new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt });
        document.body.dispatchEvent(ev);
        return ev.defaultPrevented;
      });
    };
    inf.ok(!(await prueba(`${base}index.html`)), "en un recorrido publicado soltar un archivo no se acepta (dragover sin preventDefault)");
    inf.ok(await prueba(`${base}index.html?dev`), "con ?dev sí se acepta soltar un modelo para probarlo");
  });
} catch (e) {
  inf.ok(false, "excepción no controlada", e.message);
} finally {
  await navegador.close();
  cerrar();
  rmSync(TMP, { recursive: true, force: true });
}
process.exit(inf.fin());
