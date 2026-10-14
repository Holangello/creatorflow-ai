// Utilidades compartidas del visor.
export const GRAD = Math.PI / 180;

/** Diferencia angular en (-π, π]. */
export const angDif = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

/** Rumbo de un vector del plano: 0 = arriba (-z), positivo en sentido horario. */
export const rumbo = (dx, dz) => Math.atan2(dx, -dz);

/** Área (m²) de un polígono [[x, z], …] con la fórmula del lazo. */
export function areaPoligono(p) {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, z1] = p[i], [x2, z2] = p[(i + 1) % p.length];
    a += x1 * z2 - x2 * z1;
  }
  return Math.abs(a) / 2;
}

/** Centroide aproximado (media de vértices, suficiente para etiquetas). */
export function centroide(p) {
  const n = p.length || 1;
  return [p.reduce((s, v) => s + v[0], 0) / n, p.reduce((s, v) => s + v[1], 0) / n];
}

export function puntoEnPoligono([x, z], p) {
  let dentro = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, zi] = p[i], [xj, zj] = p[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) dentro = !dentro;
  }
  return dentro;
}

export const formatoMetros = (m, idioma = "es") =>
  new Intl.NumberFormat(idioma, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(m);

/** Emisor de eventos mínimo. */
export class Emisor {
  #oyentes = new Map();
  on(ev, fn) { (this.#oyentes.get(ev) ?? this.#oyentes.set(ev, new Set()).get(ev)).add(fn); return () => this.off(ev, fn); }
  off(ev, fn) { this.#oyentes.get(ev)?.delete(fn); }
  emitir(ev, datos) {
    for (const fn of this.#oyentes.get(ev) ?? []) { try { fn(datos); } catch (e) { console.error(e); } }
  }
}

export const almacen = {
  leer(clave, defecto) { try { const v = localStorage.getItem(clave); return v == null ? defecto : JSON.parse(v); } catch { return defecto; } },
  guardar(clave, valor) { try { localStorage.setItem(clave, JSON.stringify(valor)); } catch {} },
};

/** Convierte "#rrggbb" a [r, g, b] lineales (0-1). */
export function hexALineal(hex) {
  let m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
}

export const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
