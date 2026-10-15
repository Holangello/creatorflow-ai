#!/usr/bin/env node
// Contraste WCAG de los pares de tokens de tema.css, en claro y en oscuro.
//   cd tools/visor-inmobiliario && node pruebas/contraste.mjs
// Texto: 4,5:1 (AA). Iconos, bordes de foco y controles: 3:1 (WCAG 1.4.11).
// El vidrio se compone sobre el peor fondo posible de la foto 360 (blanco puro y negro puro). Además se prueban
// colores de marca típicos, porque el visor pone el color de la inmobiliaria en --c-acento y de él salen los demás.
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
/** Vidrio adaptativo: cada nivel se prueba sobre su peor fondo (el límite del nivel). */
const NIVELES = {
  oscuro: [["luzMax", "media", "#a0a0a0"], ["luzMax", "baja", "#595959"]],
  claro: [["luzMin", "media", "#767676"], ["luzMin", "alta", "#b3b3b3"]],
};
const paresVidrio = (foto) => [
  ["--c-texto", "--vidrio-texto", TEXTO, foto], ["--c-texto-2-vidrio", "--vidrio-texto", TEXTO, foto], ["--c-texto-3-vidrio", "--vidrio-texto", TEXTO, foto],
  ["--c-acento-texto", "--vidrio-texto", TEXTO, foto], ["--c-texto", "--vidrio", NO_TEXTO, foto], ["--c-texto", "--vidrio-denso", TEXTO, foto],
];
const MARCAS = { champán: null, rojo: "#e30613", azul: "#004b93", verde: "#00a19a", amarillo: "#ffd400", negro: "#1d1d1f", blanco: "#f4f4f4" };
const PARES_MARCA = [["--c-acento-texto", "--c-fondo", TEXTO], ["--c-acento-texto", "--c-sup-1", TEXTO], ["--c-foco", "--c-fondo", NO_TEXTO]];

const { base, cerrar } = await servir();
const navegador = await lanzar();
let fallos = 0;
try {
  const p = await abrir(await contexto(navegador, { ancho: 800, alto: 600 }), `${base}tema-muestra.html`);
  await p.waitForFunction(() => window.cre8Tema);
  for (const tema of ["oscuro", "claro"]) {
    const casos = [...Object.entries(MARCAS).map(([marca, color]) => ({ marca, color, pares: color ? PARES_MARCA : PARES })),
      ...NIVELES[tema].map(([clave, valor, foto]) => ({ marca: `vidrio ${clave}=${valor}`, nivel: [clave, valor], pares: paresVidrio(foto) }))];
    for (const { marca, color, nivel, pares } of casos) {
      const r = await p.evaluate(({ tema, color, nivel, pares }) => {
        cre8Tema.fijar("tema", tema);
        document.documentElement.style.removeProperty("--c-acento");
        delete document.documentElement.dataset.luzMax; delete document.documentElement.dataset.luzMin;
        if (color) document.documentElement.style.setProperty("--c-acento", color);
        if (nivel) document.documentElement.dataset[nivel[0]] = nivel[1];
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
      }, { tema, color, nivel, pares });
      const malos = r.filter((x) => x.r < x.min);
      fallos += malos.length;
      if (!color && !nivel) {
        console.log(`\n${tema.toUpperCase()} · champán`);
        for (const x of r) console.log(`${x.r >= x.min ? "✓" : "✗"} ${x.r.toFixed(2).padStart(5)}:1 ≥ ${x.min}  ${x.fg} sobre ${x.bg}`);
      } else console.log(`${malos.length ? "✗" : "✓"} ${tema} · ${nivel ? marca : `marca ${marca} (${color})`}: ${r.map((x) => `${x.fg.replace("--c-", "")}/${x.bg.replace("--c-", "").replace(/ sobre .*/, "")} ${x.r.toFixed(2)}`).join(" · ")}`);
    }
  }
} finally {
  await navegador.close();
  cerrar();
}
console.log(fallos ? `\n✗ ${fallos} par(es) por debajo del mínimo` : "\n✓ Todos los pares cumplen AA");
process.exit(fallos ? 1 : 0);
