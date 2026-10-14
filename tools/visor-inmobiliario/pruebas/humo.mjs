#!/usr/bin/env node
// Prueba de humo de cre8eight: visor (demo), Estudio y Asistente en Chromium sin cabeza.
//   cd tools/visor-inmobiliario && npm install && npm run prueba
// Sirve la carpeta con un servidor propio y redirige cdn.jsdelivr.net a node_modules (funciona sin red).
// Sale con código 1 si algo falla.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const NM = join(RAIZ, "node_modules");
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".wasm": "application/wasm", ".woff2": "font/woff2" };

const servidor = createServer(async (req, res) => {
  try {
    const ruta = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
    let f = join(RAIZ, ruta || "index.html");
    if ((await stat(f)).isDirectory()) f = join(f, "index.html");
    res.writeHead(200, { "content-type": TIPOS[extname(f)] ?? "application/octet-stream" });
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end("no encontrado"); }
});
await new Promise((ok) => servidor.listen(0, ok));
const BASE = `http://localhost:${servidor.address().port}/`;

const navegador = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
const fallos = [];
const ok = (cond, msg) => { console.log(`${cond ? "✓" : "✗"} ${msg}`); if (!cond) fallos.push(msg); };

async function pagina(url, { ancho = 1280, alto = 800, movil = false } = {}) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, isMobile: movil, hasTouch: movil });
  const p = await ctx.newPage();
  p.errores = [];
  p.on("pageerror", (e) => p.errores.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/favicon|404/.test(m.text())) p.errores.push(m.text()); });
  await p.route(/cdn\.jsdelivr\.net\/npm\/(.+?)@[\d.]+\/(.*)/, async (r) => {
    const [, paquete, resto] = r.request().url().match(/cdn\.jsdelivr\.net\/npm\/(.+?)@[\d.]+\/(.*)/);
    const f = join(NM, paquete, resto);
    if (!existsSync(f)) return r.fulfill({ status: 404 });
    r.fulfill({ body: await readFile(f), contentType: "text/javascript" });
  });
  await p.goto(BASE + url);
  return p;
}

try {
  // ---------------------------------------------------------------- visor
  const v = await pagina("index.html?demo");
  await v.waitForFunction(() => window.visor?.listo, null, { timeout: 90000 });
  ok(true, "visor: la demo carga");
  ok(await v.evaluate(() => visor.estado.nodo === "salon"), "visor: empieza en el salón");
  await v.evaluate(() => visor.ir("cocina"));
  await v.waitForFunction(() => visor.estado.nodo === "cocina", null, { timeout: 20000 });
  ok(true, "visor: navega a la cocina");
  await v.evaluate(() => visor.fijarEstilo("nordico"));
  await v.waitForTimeout(2500);
  ok(await v.evaluate(() => visor.estado.estilo === "nordico" && visor.estado.estiloDisponible), "visor: estilo nórdico");
  await v.evaluate(() => visor.fijarMomento("noche"));
  await v.waitForTimeout(2500);
  ok(await v.evaluate(() => visor.estado.momento === "noche"), "visor: modo noche de la vivienda");
  await v.evaluate(() => visor.modo("libre"));
  await v.waitForFunction(() => visor.estado.modo === "libre", null, { timeout: 30000 });
  ok(true, "visor: modo libre 3D");
  await v.evaluate(() => visor.modo("maqueta"));
  await v.waitForFunction(() => visor.estado.modo === "maqueta", null, { timeout: 30000 });
  ok(true, "visor: maqueta 3D");
  await v.evaluate(() => visor.modo("tour"));
  ok(await v.evaluate(() => visor.sonido.disponible), "visor: música de la demo disponible");
  const cap = await v.evaluate(async () => { const r = await visor.capturar({ ancho: 800 }); return r.blob.size > 1000 && !!r.estancia; });
  ok(cap, "visor: captura de la vista para el contacto");
  ok(await v.evaluate(() => !!document.querySelector("#paneles *")), "visor: paneles montados");
  ok(v.errores.length === 0, `visor: sin errores de consola ${v.errores.length ? "→ " + v.errores.slice(0, 3).join(" | ") : ""}`);

  // ---------------------------------------------------------------- móvil
  const m = await pagina("index.html?demo", { ancho: 390, alto: 844, movil: true });
  await m.waitForFunction(() => window.visor?.listo, null, { timeout: 90000 });
  ok(m.errores.length === 0, `móvil: sin errores ${m.errores.slice(0, 2).join(" | ")}`);

  // ---------------------------------------------------------------- Estudio y Asistente
  const e = await pagina("estudio.html");
  await e.waitForTimeout(4000);
  ok(await e.evaluate(() => document.body.innerText.includes("cre8eight")), "estudio: carga con la marca");
  ok(e.errores.length === 0, `estudio: sin errores ${e.errores.slice(0, 3).join(" | ")}`);
  const a = await pagina("asistente-osmo.html", { ancho: 390, alto: 844, movil: true });
  await a.waitForTimeout(800);
  ok(await a.evaluate(() => document.querySelectorAll("#pasos > section").length >= 10), "asistente: pasos presentes");
  ok(a.errores.length === 0, `asistente: sin errores ${a.errores.slice(0, 2).join(" | ")}`);
  const t = await pagina("tema-muestra.html", { ancho: 390, alto: 844, movil: true });
  await t.waitForTimeout(500);
  const tema = await t.evaluate(() => { cre8Tema.fijar("tema", "claro"); cre8Tema.fijar("talla", "l");
    const r = [document.documentElement.dataset.tema, document.documentElement.dataset.talla, getComputedStyle(document.body).backgroundColor];
    cre8Tema.fijar("tema", "auto"); cre8Tema.fijar("talla", "m"); return r; });
  ok(tema[0] === "claro" && tema[1] === "l" && tema[2] === "rgb(245, 245, 247)", `tema: claro y talla L se aplican (${tema.join(", ")})`);
  ok(t.errores.length === 0, `tema: sin errores ${t.errores.slice(0, 2).join(" | ")}`);
} catch (err) {
  ok(false, `excepción: ${err.message}`);
} finally {
  await navegador.close();
  servidor.close();
}
console.log(fallos.length ? `\n${fallos.length} fallo(s).` : "\nTodo correcto.");
process.exit(fallos.length ? 1 : 0);
