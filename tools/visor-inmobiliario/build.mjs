#!/usr/bin/env node
// Build del visor autónomo: genera UN solo archivo JavaScript con el visor y todas sus dependencias
// (three, three/addons, @sparkjsdev/spark, paneles.js, i18n.js, demo.js… incluidos los import() dinámicos)
// para incrustarlo en el HTML offline que crea `exportarHTMLAutonomo()` de exportar.js.
//
//   cd tools/visor-inmobiliario
//   npm install && npm run build          # dist/visor-autonomo.js + dist/visor-autonomo.css
//   npm run build:dev                     # igual, sin minificar (para depurar)
//
// Los puntos de entrada se leen de index.html (cada <script type="module" src> o en línea, en orden), así el bundle
// arranca exactamente lo mismo que la página normal. Los imports "bare" se resuelven a node_modules (las mismas
// versiones fijadas que el importmap de index.html). Si un módulo local importado aún no existe (p. ej. paneles.js o
// i18n.js mientras se desarrollan), se sustituye por un módulo vacío y se avisa, en vez de fallar el build.
import * as esbuild from "esbuild";
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = dirname(fileURLToPath(import.meta.url));
const DIST = join(RAIZ, "dist");
const MINIFICAR = !process.argv.includes("--sin-minificar");
const avisos = [];
const avisar = (m) => { avisos.push(m); console.warn(`⚠  ${m}`); };

if (!existsSync(join(RAIZ, "node_modules", "three")) || !existsSync(join(RAIZ, "node_modules", "@sparkjsdev", "spark"))) {
  console.error("Faltan dependencias. Ejecuta primero:  npm install");
  process.exit(1);
}

// ------------------------------------------------------------ entradas desde index.html
const html = existsSync(join(RAIZ, "index.html")) ? readFileSync(join(RAIZ, "index.html"), "utf8") : "";
const entradas = []; // { src } | { codigo }
for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  const attrs = m[1];
  if (!/type\s*=\s*["']?module/i.test(attrs)) continue;
  const src = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
  if (src) {
    if (/^(https?:)?\/\//.test(src)) { avisar(`index.html carga ${src} desde la red: no se incluye en el bundle`); continue; }
    entradas.push({ src: "./" + src.replace(/^\.\//, "").split(/[?#]/)[0] });
  } else if (m[2].trim()) entradas.push({ codigo: m[2] });
}
if (!entradas.length) entradas.push({ src: "./visor.js" });
const hojas = [...html.matchAll(/<link\b[^>]*rel\s*=\s*["']?stylesheet[^>]*>/gi)]
  .map((m) => m[0].match(/href\s*=\s*["']([^"']+)["']/i)?.[1])
  .filter((h) => h && !/^(https?:)?\/\//.test(h))
  .map((h) => h.split(/[?#]/)[0]);
for (const css of ["visor.css", "paneles.css"]) if (!hojas.includes(css)) hojas.push(css);

const codigoEntrada = entradas.map((e, i) => (e.src ? `import ${JSON.stringify(e.src)};` : `import "virtual:en-linea-${i}";`)).join("\n");

// ------------------------------------------------------------ plugin: entrada virtual + módulos opcionales
const faltantes = new Set();
const plugin = {
  name: "visor-autonomo",
  setup(b) {
    b.onResolve({ filter: /^virtual:entrada$/ }, () => ({ path: "entrada", namespace: "virtual" }));
    b.onResolve({ filter: /^virtual:en-linea-\d+$/ }, (a) => ({ path: a.path, namespace: "virtual" }));
    b.onLoad({ filter: /.*/, namespace: "virtual" }, (a) => {
      if (a.path === "entrada") return { contents: codigoEntrada, resolveDir: RAIZ, loader: "js" };
      const i = Number(a.path.split("-").pop());
      return { contents: entradas[i].codigo, resolveDir: RAIZ, loader: "js" };
    });
    // Imports relativos a archivos que todavía no existen → módulo vacío (con aviso).
    b.onResolve({ filter: /^\.\.?\// }, (a) => {
      const ruta = resolve(a.resolveDir || RAIZ, a.path.split(/[?#]/)[0]);
      if (existsSync(ruta)) return undefined;
      const rel = relative(RAIZ, ruta);
      if (!faltantes.has(rel)) { faltantes.add(rel); avisar(`Falta el módulo opcional ${rel} (importado desde ${relative(RAIZ, a.importer) || "index.html"}): se sustituye por un módulo vacío`); }
      return { path: rel, namespace: "faltante" };
    });
    b.onLoad({ filter: /.*/, namespace: "faltante" }, (a) => ({
      // CommonJS vacío: los imports con nombre quedan `undefined` en vez de romper el build.
      contents: `console.warn("[visor-autonomo] módulo ausente en el build: ${a.path}"); module.exports = {};`,
      loader: "js",
    }));
  },
};

mkdirSync(DIST, { recursive: true });
const t0 = Date.now();
const res = await esbuild.build({
  absWorkingDir: RAIZ,
  entryPoints: { "visor-autonomo": "virtual:entrada" },
  bundle: true,
  splitting: false, // los import() dinámicos (Spark, demo.js…) se incluyen en el mismo archivo
  format: "esm", // funciona dentro de <script type="module"> en línea, también desde file://
  platform: "browser",
  target: ["es2022", "chrome100", "safari16", "firefox110"],
  minify: MINIFICAR,
  charset: "utf8",
  legalComments: "eof", // conserva los avisos de licencia (MIT) de three, Spark…
  outdir: DIST,
  write: false,
  metafile: true,
  logLevel: "warning",
  plugins: [plugin],
  define: { "process.env.NODE_ENV": '"production"' },
});

let js = res.outputFiles.find((f) => f.path.endsWith(".js")).text;
// Al ir en línea dentro de <script>, "</script" cerraría la etiqueta: se escapa ("<\/" equivale a "</" en JS).
js = js.replace(/<\/script/gi, "<\\/script");
if (/<!--/.test(js)) avisar('El bundle contiene "<!--"; si el HTML autónomo no arranca, revisa esa cadena');
const cabecera = `/* visor-autonomo.js · generado por build.mjs el ${new Date().toISOString()} · no editar a mano */\n`;
writeFileSync(join(DIST, "visor-autonomo.js"), cabecera + js);

// ------------------------------------------------------------ CSS: visor.css + paneles.css (+ hojas de index.html)
const existentes = hojas.filter((h) => existsSync(join(RAIZ, h)));
for (const h of hojas) if (!existentes.includes(h)) avisar(`Falta la hoja de estilos opcional ${h}`);
const resCss = await esbuild.build({
  absWorkingDir: RAIZ,
  stdin: { contents: existentes.map((h) => `@import ${JSON.stringify("./" + h)};`).join("\n"), resolveDir: RAIZ, loader: "css" },
  bundle: true,
  minify: MINIFICAR,
  write: false,
  outfile: join(DIST, "visor-autonomo.css"),
  external: ["http:*", "https:*", "data:*"],
  // Imágenes y fuentes referenciadas con url() se incrustan (el HTML autónomo no tiene carpeta al lado).
  loader: { ".png": "dataurl", ".jpg": "dataurl", ".jpeg": "dataurl", ".webp": "dataurl", ".svg": "dataurl", ".gif": "dataurl", ".woff": "dataurl", ".woff2": "dataurl", ".ttf": "dataurl" },
  logLevel: "warning",
});
writeFileSync(join(DIST, "visor-autonomo.css"), resCss.outputFiles[0].text.replace(/<\/style/gi, "<\\/style"));

// ------------------------------------------------------------ resumen
const kb = (f) => (statSync(join(DIST, f)).size / 1024).toFixed(0) + " KB";
const incluidos = Object.keys(res.metafile.inputs);
const paquetes = [...new Set(incluidos.filter((p) => p.includes("node_modules/")).map((p) => p.split("node_modules/")[1].split("/").slice(0, p.includes("node_modules/@") ? 2 : 1).join("/")))];
const locales = incluidos.filter((p) => !p.includes("node_modules/") && !p.includes(":"));
const leerVersion = (p) => { try { return JSON.parse(readFileSync(join(RAIZ, "node_modules", p, "package.json"), "utf8")).version; } catch { return "?"; } };
const manifiesto = {
  generado: new Date().toISOString(),
  minificado: MINIFICAR,
  entradas: entradas.map((e) => e.src ?? "(script en línea)"),
  modulos_locales: locales,
  paquetes: Object.fromEntries(paquetes.map((p) => [p, leerVersion(p)])),
  hojas: existentes,
  faltantes: [...faltantes],
  avisos,
  bytes: { js: statSync(join(DIST, "visor-autonomo.js")).size, css: statSync(join(DIST, "visor-autonomo.css")).size },
};
writeFileSync(join(DIST, "visor-autonomo.json"), JSON.stringify(manifiesto, null, 2));
console.log(`\n✔ dist/visor-autonomo.js   ${kb("visor-autonomo.js")}  (${Date.now() - t0} ms)`);
console.log(`✔ dist/visor-autonomo.css  ${kb("visor-autonomo.css")}`);
console.log(`  módulos locales: ${locales.join(", ")}`);
console.log(`  paquetes: ${paquetes.map((p) => `${p}@${manifiesto.paquetes[p]}`).join(", ")}`);
if (avisos.length) console.log(`  ${avisos.length} aviso(s), ver arriba`);
