// La demo «finca» como página para publicar (Artifact): el HTML autónomo del visor (exportarHTMLAutonomo) con el tour
// apuntando a las fotos, máscaras y música como archivos junto a la página (rutas relativas), sin incrustarlas: así la
// página pesa poco y cada foto va en su resolución completa (4096 px).
//   node exportar.mjs <salida.html>
import { readFileSync, writeFileSync } from "node:fs";
import { servir, lanzar, contexto, abrir } from "../../pruebas/comun.mjs";

const SITIO = new URL("./sitio/", import.meta.url).pathname;
const salida = process.argv[2];
const tour = JSON.parse(readFileSync(`${SITIO}tour.json`, "utf8"));
const srv = await servir({ fixture: SITIO });
const nav = await lanzar();
try {
  const ctx = await contexto(nav, { ancho: 1280, alto: 800 });
  const p = await abrir(ctx, `${srv.base}index.html?embed&estudio`);
  await p.waitForFunction(() => window.visor?.listo === true, null, { timeout: 120000 });
  // Un tour mínimo para que el exportador no incruste las fotos (se sustituye abajo por el de verdad)
  const html = await p.evaluate(async (t) => {
    const X = await import("/exportar.js");
    const vacio = { ...t, panoramas: [], audio: undefined };
    const b = await X.exportarHTMLAutonomo(vacio);
    return { texto: await b.text(), avisos: b.avisos ?? [] };
  }, tour);
  let s = html.texto;
  const ini = s.indexOf("window.TOUR_EMBEBIDO = ") + "window.TOUR_EMBEBIDO = ".length;
  const fin = s.indexOf(";</script>", ini);
  if (ini < 30 || fin < 0) throw new Error("No se encontró TOUR_EMBEBIDO");
  const json = JSON.stringify(tour).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  s = s.slice(0, ini) + json + s.slice(fin);
  writeFileSync(salida, s);
  console.log(`✓ ${salida}: ${(Buffer.byteLength(s) / 1048576).toFixed(2)} MB`, html.avisos.length ? `avisos: ${html.avisos.join(" | ")}` : "");
  if (p.errores.length) console.log("errores:", p.errores.slice(0, 3));
} finally {
  await nav.close();
  srv.cerrar();
}
