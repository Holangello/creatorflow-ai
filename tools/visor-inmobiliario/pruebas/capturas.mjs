#!/usr/bin/env node
// Matriz de capturas de cre8eight: páginas × tema (claro/oscuro) × talla (S/M/L) × tamaños de pantalla,
// con una hoja de contactos (indice.html) para revisarlas de un vistazo.
//   cd tools/visor-inmobiliario
//   node pruebas/capturas.mjs                                   # matriz completa
//   node pruebas/capturas.mjs --paginas "index.html?demo" --temas oscuro --tallas m --tamanos 390x844,1280x800
//   node pruebas/capturas.mjs --salida /ruta/carpeta
// El tema y la talla se fijan con ?tema= y ?talla= (los lee tema.js) y con prefers-color-scheme.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { servir, lanzar, contexto, abrir } from "./comun.mjs";

const arg = (nombre, def) => { const i = process.argv.indexOf(`--${nombre}`); return i > 0 ? process.argv[i + 1] : def; };
const lista = (v) => v.split(",").map((x) => x.trim()).filter(Boolean);
const PAGINAS = lista(arg("paginas", "index.html?demo,estudio.html,asistente-osmo.html,tema-muestra.html"));
const TEMAS = lista(arg("temas", "oscuro,claro"));
const TALLAS = lista(arg("tallas", "m"));
const TAMANOS = lista(arg("tamanos", "360x640,390x844,844x390,820x1180,1024x768,1280x800,1440x900,1920x1080,2560x1440,3440x1440,3840x2160"));
const SALIDA = arg("salida", join(tmpdir(), `cre8eight-capturas-${Date.now()}`));
mkdirSync(SALIDA, { recursive: true });

const { base, cerrar } = await servir();
const navegador = await lanzar();
const filas = [];
let fallos = 0;
for (const pagina of PAGINAS) {
  for (const tema of TEMAS) for (const talla of TALLAS) for (const tam of TAMANOS) {
    const [ancho, alto] = tam.split("x").map(Number);
    const movil = Math.min(ancho, alto) < 600 || (ancho === 820 && alto === 1180);
    const ctx = await contexto(navegador, { ancho, alto, movil, esquema: tema === "claro" ? "light" : "dark" });
    const sep = pagina.includes("?") ? "&" : "?";
    const url = `${base}${pagina}${sep}tema=${tema}&talla=${talla}`;
    const nombre = `${pagina.replace(/[^a-z0-9]+/gi, "-")}_${tema}_${talla}_${tam}.png`;
    try {
      const p = await abrir(ctx, url);
      if (pagina.startsWith("index.html")) await p.waitForFunction(() => window.visor?.listo, null, { timeout: 90000 });
      await p.waitForTimeout(1200);
      // Visor con portada (fase 3): primero la portada y, tras «Empezar visita», la interfaz del visor.
      if (await p.$("#portada")) {
        const nPortada = nombre.replace(/\.png$/, "_portada.png");
        await p.screenshot({ path: join(SALIDA, nPortada) });
        filas.push({ pagina, tema, talla, tam: `${tam} · portada`, nombre: nPortada, errores: [] });
        await p.evaluate(() => window.visor.empezar?.());
        await p.waitForTimeout(1200);
      }
      await p.screenshot({ path: join(SALIDA, nombre) });
      filas.push({ pagina, tema, talla, tam, nombre, errores: p.errores });
      if (p.errores.length) fallos++;
      console.log(`${p.errores.length ? "✗" : "✓"} ${nombre}${p.errores.length ? "  " + p.errores.slice(0, 2).join(" | ") : ""}`);
    } catch (e) {
      fallos++;
      filas.push({ pagina, tema, talla, tam, nombre: null, errores: [e.message] });
      console.log(`✗ ${nombre}  ${e.message}`);
    }
    await ctx.close();
  }
}
await navegador.close();
cerrar();

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
writeFileSync(join(SALIDA, "indice.html"), `<!doctype html><meta charset="utf-8"><title>cre8eight · capturas</title>
<style>body{font:14px system-ui;background:#111;color:#eee;margin:16px}h2{margin:28px 0 8px}div{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start}
figure{margin:0;background:#1b1b1f;padding:8px;border-radius:10px}figure img{display:block;max-width:420px;max-height:320px;border-radius:6px}figcaption{margin-top:6px;font-size:12px;color:#aaa}.err{color:#ff8a80}</style>
${PAGINAS.map((pg) => `<h2>${esc(pg)}</h2><div>${filas.filter((f) => f.pagina === pg).map((f) => `<figure>${f.nombre ? `<a href="${esc(f.nombre)}"><img src="${esc(f.nombre)}" loading="lazy"></a>` : ""}<figcaption>${esc(`${f.tema} · ${f.talla.toUpperCase()} · ${f.tam}`)}${f.errores.length ? `<br><span class="err">${esc(f.errores.slice(0, 2).join(" | "))}</span>` : ""}</figcaption></figure>`).join("")}</div>`).join("")}`);
console.log(`\n${filas.length} capturas en ${SALIDA} (abre indice.html). ${fallos ? fallos + " con errores." : "Sin errores."}`);
process.exit(fallos ? 1 : 0);
