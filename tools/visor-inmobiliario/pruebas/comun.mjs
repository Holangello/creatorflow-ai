// Utilidades comunes de las pruebas de cre8eight: servidor estático propio y navegador con jsdelivr redirigido
// a node_modules (funciona sin red y con las mismas versiones fijadas que el importmap).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const NM = join(RAIZ, "node_modules");
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".wasm": "application/wasm", ".woff2": "font/woff2",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".pdf": "application/pdf", ".glb": "model/gltf-binary", ".zip": "application/zip" };

/**
 * Sirve la carpeta del visor en un puerto libre. Devuelve { base, cerrar }.
 * opciones.fixture: carpeta que tiene prioridad sobre la raíz (p. ej. el tour.json de un tour de prueba servido
 *   junto al código ACTUAL del visor). opciones.generar(ruta): contenido para rutas que no existen en disco
 *   → { cuerpo, tipo } | null (imágenes, PDF… generados al vuelo para no guardar binarios en el repositorio).
 */
export async function servir({ fixture, generar } = {}) {
  const raices = fixture ? [fixture, RAIZ] : [RAIZ];
  const servidor = createServer(async (req, res) => {
    try {
      const ruta = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
      for (const raiz of raices) {
        let f = join(raiz, ruta || "index.html");
        if (!f.startsWith(raiz)) continue; // nada fuera de la carpeta servida
        try {
          if ((await stat(f)).isDirectory()) f = join(f, "index.html");
          const cuerpo = await readFile(f);
          res.writeHead(200, { "content-type": TIPOS[extname(f)] ?? "application/octet-stream" });
          return res.end(cuerpo);
        } catch { /* no está en esta raíz */ }
      }
      const g = await generar?.(ruta);
      if (g) { res.writeHead(200, { "content-type": g.tipo }); return res.end(g.cuerpo); }
      res.writeHead(404); res.end("no encontrado");
    } catch { res.writeHead(404); res.end("no encontrado"); }
  });
  await new Promise((ok) => servidor.listen(0, ok));
  return { base: `http://localhost:${servidor.address().port}/`, cerrar: () => servidor.close() };
}

/** Chromium sin cabeza con WebGL por software. */
export const lanzar = () => chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"],
});

/** Contexto con jsdelivr → node_modules. opciones: { ancho, alto, movil, escala, esquema } */
export async function contexto(navegador, { ancho = 1280, alto = 800, movil = false, escala = 1, esquema = "dark" } = {}) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, isMobile: movil, hasTouch: movil, deviceScaleFactor: escala, colorScheme: esquema });
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/(.+?)@[\d.]+\/(.*)/, async (r) => {
    const [, paquete, resto] = r.request().url().match(/cdn\.jsdelivr\.net\/npm\/(.+?)@[\d.]+\/(.*)/);
    const f = join(NM, paquete, resto);
    if (!existsSync(f)) return r.fulfill({ status: 404 });
    r.fulfill({ body: await readFile(f), contentType: "text/javascript" });
  });
  return ctx;
}

/** Abre una página y recoge sus errores en p.errores. */
export async function abrir(ctx, url) {
  const p = await ctx.newPage();
  p.errores = [];
  p.on("pageerror", (e) => p.errores.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/favicon|404|ERR_TUNNEL|ERR_NAME/.test(m.text())) p.errores.push(m.text()); });
  await p.goto(url);
  return p;
}
