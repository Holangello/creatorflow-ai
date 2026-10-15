#!/usr/bin/env node
// Métricas de cre8eight para la regla «compactar» de docs/calidad.md: peso de la carga inicial, tiempo hasta
// visor.listo y cuánto tapa la interfaz del visor (demo, en el teléfono y en el portátil).
//   cd tools/visor-inmobiliario
//   node pruebas/medir.mjs                 # tabla en la consola
//   node pruebas/medir.mjs --json m.json   # además, en JSON para comparar entre fases
// Objetivo: en el teléfono, la interfaz en reposo tapa ≤ 15 % de la pantalla. Sale con código 1 si no se cumple.
import { writeFileSync } from "node:fs";
import { servir, lanzar, contexto, abrir } from "./comun.mjs";

const TAMANOS = { telefono: [390, 844, true], portatil: [1280, 800, false] };
const OBJETIVO_TAPADO = 15;
const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : undefined; };

/** Controles visibles y % de pantalla tapada por la interfaz (método de la auditoría de organización). */
const MEDIR_INTERFAZ = () => {
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) return false;
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.05) return false; }
    if (getComputedStyle(el).pointerEvents === "none" || el.closest("[inert]")) return false;
    const top = document.elementFromPoint(Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2)));
    return !(top && top !== el && !el.contains(top) && !top.contains(el));
  };
  const controles = [...document.querySelectorAll("button, a[href], input, select, textarea, [role=button], canvas#mapa")].filter(vis);
  const sel = "#lugar, #radar .disco, #modos, #barra-vista, #galeria, #guion-barra, .pn-rail, .pn-pestana, .pn-dock, .pn-panel, .pn-peek, .pn-tarjeta, .pn-card, .pn-raiz > :not(.pn-toast)";
  const W = innerWidth, H = innerHeight, paso = 4;
  const rects = [...document.querySelectorAll(sel)].filter((e) => { const cs = getComputedStyle(e), r = e.getBoundingClientRect(); return cs.display !== "none" && cs.visibility !== "hidden" && parseFloat(cs.opacity) > 0.05 && r.width > 0 && r.height > 0; })
    .map((e) => e.getBoundingClientRect()).map((r) => ({ l: Math.max(0, r.left), t: Math.max(0, r.top), r: Math.min(W, r.right), b: Math.min(H, r.bottom) }));
  let ocupado = 0, total = 0;
  for (let y = 0; y < H; y += paso) for (let x = 0; x < W; x += paso) { total++; if (rects.some((q) => x >= q.l && x < q.r && y >= q.t && y < q.b)) ocupado++; }
  return { controles: controles.length, tapado: Math.round((ocupado / total) * 1000) / 10 };
};

const { base, cerrar } = await servir();
const navegador = await lanzar();
const resultado = {};
let fallo = false;
try {
  for (const [nombre, [ancho, alto, movil]] of Object.entries(TAMANOS)) {
    const ctx = await contexto(navegador, { ancho, alto, movil });
    const kb = { js_propio: 0, js_dependencias: 0, css: 0, fuentes: 0 };
    let contando = true;
    const origen = new URL(base).host;
    ctx.on("response", async (r) => {
      if (!contando) return;
      const tipo = r.request().resourceType();
      const n = (await r.body().catch(() => Buffer.alloc(0))).length / 1024;
      if (tipo === "script") kb[new URL(r.url()).host === origen ? "js_propio" : "js_dependencias"] += n;
      else if (tipo === "stylesheet") kb.css += n;
      else if (tipo === "font") kb.fuentes += n;
    });
    const t0 = Date.now();
    const p = await abrir(ctx, `${base}index.html?demo`);
    await p.waitForFunction(() => window.visor?.listo, null, { timeout: 90000 });
    const listo = Date.now() - t0;
    contando = false;
    if (await p.$("#portada .empezar")) await p.click("#portada .empezar");
    await p.waitForTimeout(800);
    const despierta = await p.evaluate(MEDIR_INTERFAZ);
    await p.waitForFunction(() => document.body.classList.contains("ui-inactiva"), null, { timeout: 15000 }).catch(() => {});
    const reposo = await p.evaluate(MEDIR_INTERFAZ);
    resultado[nombre] = {
      "listo (s)": +(listo / 1000).toFixed(1),
      "JS propio (KB)": Math.round(kb.js_propio), "JS dependencias (KB)": Math.round(kb.js_dependencias), "CSS (KB)": Math.round(kb.css), "fuentes (KB)": Math.round(kb.fuentes),
      "controles": despierta.controles, "tapado %": despierta.tapado, "controles en reposo": reposo.controles, "tapado en reposo %": reposo.tapado,
      errores: p.errores.length,
    };
    if (nombre === "telefono" && reposo.tapado > OBJETIVO_TAPADO) fallo = true;
    if (p.errores.length) fallo = true;
    await ctx.close();
  }
} finally {
  await navegador.close();
  cerrar();
}
console.table(resultado);
const salida = arg("json");
if (salida) writeFileSync(salida, JSON.stringify({ fecha: new Date().toISOString(), ...resultado }, null, 2));
console.log(fallo ? `✗ Fuera de objetivo (tapado en reposo > ${OBJETIVO_TAPADO} % en el teléfono, o errores de consola)` : "✓ Dentro de objetivo");
process.exit(fallo ? 1 : 0);
