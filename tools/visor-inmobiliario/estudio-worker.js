// Web Worker del Estudio: redimensiona fotos 360 (hasta 15520×7760, 120 MP) sin bloquear la interfaz.
// Re-codificar a JPEG elimina todos los metadatos EXIF/XMP (incluido el GPS).
import { dimensiones } from "./estudio-util.js";

const LIMITE_IOS = 16777216; // 4096 × 4096
export async function procesarImagen(blob, { tamanos = [8192, 4096, 512], calidad = 0.85, forzar2a1 = true } = {}, progreso = () => {}) {
  progreso(0.02, "Leyendo cabecera");
  let maxArea = Infinity;
  let dim = await dimensiones(blob);
  if (!dim) {
    // Formato sin cabecera conocida: decodificar entero (más memoria).
    const b = await createImageBitmap(blob);
    dim = { w: b.width, h: b.height };
    b.close();
  }
  const salidas = [];
  let fuente = blob;          // la primera pasada decodifica el archivo; las siguientes, el bitmap anterior (más rápido)
  let anterior = null;
  let limitado = false;
  for (let i = 0; i < tamanos.length; i++) {
    let w = Math.min(tamanos[i], dim.w) & ~1;
    if (w * w / 2 > maxArea) { w = Math.floor(Math.sqrt(maxArea * 2)) & ~15; limitado = true; }
    const h = forzar2a1 ? w / 2 : Math.round((w * dim.h) / dim.w);
    progreso(0.05 + (i / tamanos.length) * 0.9, i === 0 ? "Decodificando" : "Reduciendo");
    // createImageBitmap con resizeWidth reduce al decodificar: nunca se crea un lienzo de 120 MP.
    const bmp = await createImageBitmap(fuente, { resizeWidth: w, resizeHeight: h, resizeQuality: "high" });
    let jpg;
    try {
      const lienzo = new OffscreenCanvas(w, h);
      const ctx = lienzo.getContext("2d");
      if (!ctx) throw new Error("lienzo demasiado grande");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bmp, 0, 0, w, h); // con tamaño explícito: algunos navegadores ignoran resizeWidth
      progreso(0.05 + ((i + 0.6) / tamanos.length) * 0.9, "Comprimiendo");
      jpg = await lienzo.convertToBlob({ type: "image/jpeg", quality: calidad });
      lienzo.width = lienzo.height = 1; // libera la memoria del lienzo
    } catch (e) {
      // iPad/iPhone limitan cada lienzo a ~16,7 MP: se repite este tamaño con el máximo permitido.
      bmp.close();
      if (maxArea > LIMITE_IOS) { maxArea = LIMITE_IOS; i--; continue; }
      throw e;
    }
    salidas.push({ ancho: w, alto: h, blob: jpg });
    if (anterior) anterior.close();
    anterior = bmp;
    fuente = bmp;
  }
  anterior?.close();
  progreso(1, "Listo");
  return { original: dim, salidas, limitado };
}

if (typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope) {
  self.onmessage = async ({ data }) => {
    const { id, blob, opciones } = data;
    try {
      const r = await procesarImagen(blob, opciones, (v, fase) => self.postMessage({ id, progreso: v, fase }));
      self.postMessage({ id, ok: true, resultado: r });
    } catch (e) {
      self.postMessage({ id, ok: false, error: e?.message ?? String(e) });
    }
  };
}
