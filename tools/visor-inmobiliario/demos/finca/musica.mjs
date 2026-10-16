// La música de ambiente de la demo (generada por código en demo.js) como archivo, para la finca.
import { writeFileSync } from "node:fs";
import { servir, lanzar, contexto, abrir } from "../../pruebas/comun.mjs";
const { base, cerrar } = await servir();
const nav = await lanzar();
try {
  const ctx = await contexto(nav);
  const p = await abrir(ctx, `${base}index.html?embed&estudio`);
  const b64 = await p.evaluate(async () => {
    const { musicaDemo } = await import("/demo.js");
    const r = await musicaDemo();
    const blob = typeof r === "string" ? await (await fetch(r)).blob() : r;
    const buf = new Uint8Array(await blob.arrayBuffer());
    let s = ""; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return btoa(s);
  });
  writeFileSync(process.argv[2], Buffer.from(b64, "base64"));
  console.log("ok", Buffer.from(b64, "base64").length);
} finally { await nav.close(); cerrar(); }
