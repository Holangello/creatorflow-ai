#!/usr/bin/env node
// Ejecuta las pruebas de extremo a extremo EN SERIE y resume el resultado de cada una.
//   npm run prueba:e2e                       # todas
//   node pruebas/e2e.mjs estudio seguridad   # solo esas (por nombre: estudio, paneles, exportar, seguridad)
// Sale con código 1 si alguna falla. Variables útiles: E2E_SOLO="texto" (solo los bloques cuyo nombre lo contiene) y
// E2E_CAPTURAS=carpeta (capturas de pantalla al fallar un bloque).
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const TODAS = ["estudio", "paneles", "exportar", "seguridad"];
const pedidas = process.argv.slice(2).filter((a) => TODAS.includes(a));
const lista = pedidas.length ? pedidas : TODAS;
const resultados = [];
const t0 = Date.now();
for (const nombre of lista) {
  const t = Date.now();
  const r = spawnSync(process.execPath, [join(DIR, `e2e-${nombre}.mjs`)], { stdio: ["ignore", "pipe", "inherit"], encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  process.stdout.write(r.stdout ?? "");
  const resumen = (r.stdout ?? "").split("\n").reverse().find((l) => / comprobaciones · /.test(l)) ?? "";
  resultados.push({ nombre, ok: r.status === 0, s: ((Date.now() - t) / 1000).toFixed(0), resumen: resumen.replace(/^.*?: /, "") });
}
console.log("\n================ Resumen de las pruebas e2e");
for (const x of resultados) console.log(`${x.ok ? "✓" : "✗"} e2e-${x.nombre}.mjs (${x.s} s) · ${x.resumen}`);
const fallidas = resultados.filter((x) => !x.ok);
console.log(`${fallidas.length ? `${fallidas.length} prueba(s) con fallos` : "Todas correctas"} · ${((Date.now() - t0) / 1000).toFixed(0)} s en total`);
process.exit(fallidas.length ? 1 : 0);
