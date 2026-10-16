#!/usr/bin/env node
// Puntos de corte del sistema (docs/diseno/sistema.md § Puntos de corte; tema.js → cre8Tema.MQ): ninguna @media de las
// páginas usa una medida de ancho o alto que no esté en la lista. Así no vuelven el 540, el 560, el 450, el 759 o el 1024,
// que hacían que el CSS y el JS no estuvieran de acuerdo en qué es un teléfono o una tablet.
//   node pruebas/puntos-corte.mjs
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ } from "./comun.mjs";

// Del sistema: teléfono (599.98/600), horizontal bajo (499.98/500), hoja (719.98), tablet en vertical (1100), horizontal
// estrecho (62em). Ajustes de contenido de cada página (no deciden «teléfono» ni «tablet»): columnas y barra del Estudio,
// el chevron de la tarjeta a 360 px, el título del visor con ratón en pantalla grande, los modos arriba en la tablet en
// vertical (46.25em, en em para seguir la letra del navegador) y la tira del monitor (1600px).
const PERMITIDAS = new Set(["599.98px", "600px", "499.98px", "500px", "719.98px", "1100px", "62em",
  "860px", "861px", "1101px", "1279.98px", "1280px", "1440px", "1441px", "46.25em", "1600px", "2200px", "80em", "68.75em", "53.75em", "47.4375em", "374.98px"]);
const ARCHIVOS = ["tema.css", "visor.css", "paneles.css", "estudio.css", "asistente-osmo.html", "tema.js", "visor.js", "paneles.js", "estudio.js"];

let fallos = 0;
for (const f of ARCHIVOS) {
  const texto = readFileSync(join(RAIZ, f), "utf8");
  const consultas = [...texto.matchAll(/@media([^{]*)\{/g)].map((m) => m[1])
    .concat([...texto.matchAll(/matchMedia\(\s*["'`]([^"'`]*)["'`]/g)].map((m) => m[1]))
    .concat([...texto.matchAll(/:\s*"(\([^"]*(?:width|height)[^"]*)"/g)].map((m) => m[1]));
  for (const q of consultas) {
    for (const [, medida] of q.matchAll(/(?:max|min)-(?:width|height)\s*:\s*([\d.]+(?:px|em|rem))/g)) {
      if (!PERMITIDAS.has(medida)) { fallos++; console.log(`✗ ${f}: «${q.trim()}» usa ${medida}, que no es un punto de corte del sistema`); }
    }
  }
}
// tema.js publica la tabla y la forma
const tema = readFileSync(join(RAIZ, "tema.js"), "utf8");
for (const k of ["telefono", "apaisado", "compacto", "vertical", "hoja", "estrecho"]) if (!new RegExp(`\\b${k}:`).test(tema)) { fallos++; console.log(`✗ tema.js no define MQ.${k}`); }
console.log(fallos ? `${fallos} fallo(s).` : "✓ Puntos de corte: todas las consultas usan los del sistema.");
process.exit(fallos ? 1 : 0);
