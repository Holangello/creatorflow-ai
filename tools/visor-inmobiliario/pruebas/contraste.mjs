#!/usr/bin/env node
// Contraste WCAG de los pares de tokens de tema.css, en claro y en oscuro.
//   cd tools/visor-inmobiliario && node pruebas/contraste.mjs
// Texto: 4,5:1 (AA). Iconos, bordes de foco y controles: 3:1 (WCAG 1.4.11).
// El vidrio se compone sobre el peor fondo posible de la foto 360 (blanco puro y negro puro). Además se prueban
// colores de marca típicos, porque el visor pone el color de la inmobiliaria en --c-acento y de él salen los demás.
// Vidrio adaptativo por pieza: con piezas de muestra (texto principal, secundario, terciario, enlace de acento, iconos,
// segmentado) en los dos temas y en el aspecto oscuro del tema claro, la alfa que calcula cre8Tema.vidrio para cada fondo
// (luminancia de 0 a 1, y fondos mezclados) se aplica a la pieza y se comprueba con el lienzo, sin la holgura del cálculo.
// Sale con código 1 si algún par no llega.
import { servir, lanzar, contexto, abrir } from "./comun.mjs";

const TEXTO = 4.5, NO_TEXTO = 3;
const OPACOS = ["--c-fondo", "--c-sup-1", "--c-sup-2", "--c-sup-3"];
/** [primer plano, fondo, mínimo, sobre qué se compone el fondo si es translúcido] */
const PARES = [
  ...OPACOS.map((f) => ["--c-texto", f, TEXTO]),
  ...OPACOS.map((f) => ["--c-texto-2", f, TEXTO]),
  ...OPACOS.map((f) => ["--c-texto-3", f, TEXTO]),
  ...["--c-fondo", "--c-sup-1", "--c-sup-2"].map((f) => ["--c-acento-texto", f, TEXTO]),
  ["--c-sobre-acento", "--c-acento", TEXTO],
  ...["--c-fondo", "--c-sup-1"].map((f) => ["--c-foco", f, NO_TEXTO]),
  ...["--c-ok", "--c-aviso", "--c-error", "--c-info"].flatMap((c) => [[c, "--c-fondo", TEXTO], [c, "--c-sup-1", TEXTO]]),
  ["--c-error", "--c-error-fondo", TEXTO, "--c-sup-1"],
  ["--c-sobre-foto", "--velo-foto", TEXTO, "#ffffff"], // nombre sobre una miniatura blanca, en la parte con velo
  ...["ok", "aviso", "error", "info"].flatMap((e) => [[`--c-${e}-texto`, `--c-${e}-fondo`, TEXTO, "--c-sup-1"], [`--c-${e}-texto`, `--c-${e}-fondo`, TEXTO, "--c-fondo"]]),
  // Bordes de campos y casillas (WCAG 1.4.11), por fuera y por dentro del campo
  ...["--c-fondo", "--c-sup-1", "--c-sup-2"].map((f) => ["--c-borde-campo", f, NO_TEXTO]),
  ["--c-borde-campo", "--c-campo", NO_TEXTO, "--c-sup-1"],
  // Paneles del Estudio y la Guía sobre el ambiente: en su punto más intenso (--prueba-ambiente) y sobre el fondo liso
  ...["--prueba-ambiente", "--c-fondo"].flatMap((sobre) => ["--c-texto", "--c-texto-2", "--c-texto-3", "--c-acento-texto"].map((t) => [t, "--vidrio-ambiente", TEXTO, sobre])),
  // Vidrio sobre la foto: el peor caso es una pared blanca o una zona negra
  ...["#ffffff", "#000000"].flatMap((foto) => [
    ["--c-texto", "--vidrio-texto", TEXTO, foto],
    ["--c-texto-2-vidrio", "--vidrio-texto", TEXTO, foto],
    ["--c-texto-3-vidrio", "--vidrio-texto", TEXTO, foto],
    ["--c-acento-texto", "--vidrio-texto", TEXTO, foto],
    ["--c-texto", "--vidrio", NO_TEXTO, foto],
    ["--c-texto", "--vidrio-denso", TEXTO, foto],
  ]),
];
/** Fondos (percentiles 10 y 90 de la luminancia detrás de la pieza) con los que se prueba la alfa adaptativa. */
const FONDOS = [0, 0.01, 0.03, 0.06, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((l) => [l, l])
  .concat([[0, 1], [0.02, 0.4], [0.05, 0.6], [0.1, 0.9], [0.3, 0.7], [0.5, 1]]);
const MARCAS = { champán: null, rojo: "#e30613", azul: "#004b93", verde: "#00a19a", amarillo: "#ffd400", negro: "#1d1d1f", blanco: "#f4f4f4" };
const PARES_MARCA = [["--c-acento-texto", "--c-fondo", TEXTO], ["--c-acento-texto", "--c-sup-1", TEXTO], ["--c-foco", "--c-fondo", NO_TEXTO]];

const { base, cerrar } = await servir();
const navegador = await lanzar();
let fallos = 0;
try {
  const p = await abrir(await contexto(navegador, { ancho: 800, alto: 600 }), `${base}tema-muestra.html`);
  await p.waitForFunction(() => window.cre8Tema);
  for (const tema of ["oscuro", "claro"]) {
    const casos = Object.entries(MARCAS).map(([marca, color]) => ({ marca, color, pares: color ? PARES_MARCA : PARES }));
    for (const { marca, color, pares } of casos) {
      const r = await p.evaluate(({ tema, color, pares }) => {
        cre8Tema.fijar("tema", tema);
        document.documentElement.style.removeProperty("--c-acento");
        if (color) document.documentElement.style.setProperty("--c-acento", color);
        document.documentElement.style.setProperty("--prueba-ambiente", "color-mix(in srgb, var(--c-acento) var(--ambiente-acento), var(--c-fondo))");
        const lienzo = document.createElement("canvas"); lienzo.width = lienzo.height = 1;
        const g = lienzo.getContext("2d", { willReadFrequently: true });
        /** Color CSS (con alfa, color-mix…) compuesto sobre `sobre` → [r, g, b]. */
        const pintar = (css, sobre = "#808080") => { g.fillStyle = sobre; g.fillRect(0, 0, 1, 1); g.fillStyle = css; g.fillRect(0, 0, 1, 1); return [...g.getImageData(0, 0, 1, 1).data.slice(0, 3)]; };
        const resolver = (v) => { if (v.startsWith("#")) return v; const e = document.createElement("i"); e.style.color = `var(${v})`; document.body.append(e); const c = getComputedStyle(e).color; e.remove(); return c; };
        const lum = ([r, gg, b]) => [r, gg, b].map((x) => { x /= 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }).reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0);
        const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
        return pares.map(([fg, bg, min, sobre]) => {
          const fondo = pintar(resolver(bg), sobre ? resolver(sobre) : "#808080");
          const frente = pintar(resolver(fg), `rgb(${fondo})`);
          return { fg, bg: sobre ? `${bg} sobre ${sobre}` : bg, min, r: Math.round(ratio(frente, fondo) * 100) / 100 };
        });
      }, { tema, color, pares });
      const malos = r.filter((x) => x.r < x.min);
      fallos += malos.length;
      if (!color) {
        console.log(`\n${tema.toUpperCase()} · champán`);
        for (const x of r) console.log(`${x.r >= x.min ? "✓" : "✗"} ${x.r.toFixed(2).padStart(5)}:1 ≥ ${x.min}  ${x.fg} sobre ${x.bg}`);
      } else console.log(`${malos.length ? "✗" : "✓"} ${tema} · marca ${marca} (${color}): ${r.map((x) => `${x.fg.replace("--c-", "")}/${x.bg.replace("--c-", "")} ${x.r.toFixed(2)}`).join(" · ")}`);
    }
    // Vidrio adaptativo por pieza (tema.js): la alfa calculada, aplicada a la pieza y medida con el lienzo
    for (const [aspecto, marca] of [[null, null], ...(tema === "claro" ? [["oscuro", null]] : []), [null, "#004b93"], [null, "#ffd400"]]) {
      const r = await p.evaluate(({ tema, aspecto, marca, FONDOS }) => {
        cre8Tema.fijar("tema", tema);
        document.documentElement.style.removeProperty("--c-acento");
        if (marca) document.documentElement.style.setProperty("--c-acento", marca);
        const V = cre8Tema.vidrio;
        const lienzo = document.createElement("canvas"); lienzo.width = lienzo.height = 1;
        const g = lienzo.getContext("2d", { willReadFrequently: true });
        const pintar = (css, sobre) => { g.fillStyle = sobre; g.fillRect(0, 0, 1, 1); g.fillStyle = css; g.fillRect(0, 0, 1, 1); return [...g.getImageData(0, 0, 1, 1).data.slice(0, 3)]; };
        const lum = ([r, gg, b]) => [r, gg, b].map((x) => { x /= 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }).reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0);
        const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
        const gris = (l) => { const c = Math.round(255 * Math.min(1, Math.max(0, l <= 0.0031308 ? 12.92 * l : 1.055 * l ** (1 / 2.4) - 0.055))); return `rgb(${c}, ${c}, ${c})`; };
        const caja = document.createElement("div");
        caja.style.cssText = "position: fixed; left: 0; top: 0; display: grid; gap: 8px; padding: 8px";
        caja.innerHTML = `
          <div class="c8-vidrio c8-vidrio--texto" data-p="texto" style="padding: 8px"><b>Principal</b> <span class="c8-sec">Secundario</span>
            <span style="color: var(--c-texto-3)">Terciario</span> <a href="#">Enlace</a></div>
          <div class="c8-pastilla c8-vidrio" data-p="iconos"><button class="c8-boton c8-boton--icono" type="button"><svg class="c8-icono" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg></button>
            <button class="c8-boton c8-boton--icono" type="button" aria-pressed="true"><svg class="c8-icono" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg></button></div>
          <div class="c8-segmentado c8-vidrio" data-p="segmentado"><label><input type="radio" name="s" checked><span>Uno</span></label><label><input type="radio" name="s"><span>Dos</span></label></div>`;
        document.body.append(caja);
        const fallos = [], peor = {};
        for (const pieza of caja.querySelectorAll("[data-p]")) if (aspecto) pieza.dataset.vidrioAspecto = aspecto;
        for (const a of document.getAnimations()) { try { a.finish(); } catch { /* infinita */ } } // colores ya en su valor final
        for (const pieza of caja.querySelectorAll("[data-p]")) {
          const cs = getComputedStyle(pieza), lista = V.exigencias(pieza);
          const tinte = V.aRgb(`rgb(${cs.getPropertyValue("--vidrio-tinte").trim()})`);
          // como el visor: el techo es el peor caso del vidrio con texto (también para los iconos de acento)
          const conTexto = lista.some((x) => x.minimo > 3), techo = parseFloat(cs.getPropertyValue("--vidrio-a-texto"));
          for (const [l10, l90] of FONDOS) {
            const a = V.alfa(lista, tinte, l10, l90, conTexto ? 0.24 : 0.2, techo);
            pieza.style.setProperty("--vidrio-a", String(a));
            const fondoCss = getComputedStyle(pieza).backgroundColor;
            for (const l of [l10, l90]) {
              const fondo = pintar(fondoCss, gris(l));
              for (const x of lista) {
                let bajo = fondo;
                for (const c of x.capas) bajo = pintar(`rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3]})`, `rgb(${bajo})`);
                const r = ratio(pintar(`rgba(${x.color[0]}, ${x.color[1]}, ${x.color[2]}, ${x.color[3]})`, `rgb(${bajo})`), bajo);
                const clave = `${pieza.dataset.p} ${x.minimo}`;
                peor[clave] = Math.min(peor[clave] ?? 99, r);
                if (r < x.minimo) fallos.push(`${pieza.dataset.p}: ${x.color.slice(0, 3).join(",")} ${r.toFixed(2)}:1 < ${x.minimo} con fondo ${l} (alfa ${a.toFixed(2)})`);
              }
            }
          }
        }
        caja.remove();
        document.documentElement.style.removeProperty("--c-acento");
        return { fallos, peor };
      }, { tema, aspecto, marca, FONDOS });
      fallos += r.fallos.length;
      console.log(`${r.fallos.length ? "✗" : "✓"} ${tema}${aspecto ? ` (aspecto ${aspecto})` : ""}${marca ? ` · marca ${marca}` : ""} · vidrio por pieza en ${FONDOS.length} fondos: ${Object.entries(r.peor).map(([k, v]) => `${k} ≥ ${v.toFixed(2)}`).join(" · ")}`);
      for (const f of r.fallos.slice(0, 6)) console.log(`   ✗ ${f}`);
    }
  }
} finally {
  await navegador.close();
  cerrar();
}
console.log(fallos ? `\n✗ ${fallos} par(es) por debajo del mínimo` : "\n✓ Todos los pares cumplen AA");
process.exit(fallos ? 1 : 0);
