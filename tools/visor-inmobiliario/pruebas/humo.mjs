#!/usr/bin/env node
// Prueba de humo de cre8eight: visor (demo), Estudio y Asistente en Chromium sin cabeza.
//   cd tools/visor-inmobiliario && npm install && npm run prueba
// Servidor propio y cdn.jsdelivr.net redirigido a node_modules (pruebas/comun.mjs): funciona sin red.
// Matriz de capturas claro/oscuro × S/M/L × pantallas: node pruebas/capturas.mjs
// Sale con código 1 si algo falla.
import { servir, lanzar, contexto, abrir } from "./comun.mjs";

const { base: BASE, cerrar } = await servir();
const navegador = await lanzar();
const fallos = [];
const ok = (cond, msg) => { console.log(`${cond ? "✓" : "✗"} ${msg}`); if (!cond) fallos.push(msg); };
const pagina = async (url, { ancho = 1280, alto = 800, movil = false } = {}) => abrir(await contexto(navegador, { ancho, alto, movil }), BASE + url);

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
  ok(await a.evaluate(() => document.querySelectorAll("#pasos > section.paso").length === 8), "guía: 6 pasos y 2 apéndices");
  const enlace = await a.evaluate(() => { document.querySelector("#sugerir").click(); document.querySelector("[data-ancla='estudio'] [data-accion='enviar']").click(); return document.querySelector("#enlace-estudio")?.value ?? ""; });
  ok(/estudio\.html#fotos&estancias=Entrada,Sal%C3%B3n,/.test(enlace), `guía: enlace al Estudio con la lista (${enlace.split("#")[1]?.slice(0, 50)}…)`);
  ok(a.errores.length === 0, `asistente: sin errores ${a.errores.slice(0, 2).join(" | ")}`);
  const anchoGuia = await a.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  ok(anchoGuia[0] <= anchoGuia[1], `guía: sin desplazamiento horizontal en el móvil (${anchoGuia.join(" ≤ ")} px)`);
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
  cerrar();
}
console.log(fallos.length ? `\n${fallos.length} fallo(s).` : "\nTodo correcto.");
process.exit(fallos.length ? 1 : 0);
