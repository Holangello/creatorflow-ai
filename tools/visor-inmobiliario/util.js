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

/** Centroide de área del polígono (si es degenerado, la media de los vértices). */
export function centroide(p) {
  let a = 0, cx = 0, cz = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, z1] = p[i], [x2, z2] = p[(i + 1) % p.length];
    const f = x1 * z2 - x2 * z1;
    a += f; cx += (x1 + x2) * f; cz += (z1 + z2) * f;
  }
  if (Math.abs(a) < 1e-9) { const n = p.length || 1; return [p.reduce((s, v) => s + v[0], 0) / n, p.reduce((s, v) => s + v[1], 0) / n]; }
  return [cx / (3 * a), cz / (3 * a)];
}

export function puntoEnPoligono([x, z], p) {
  let dentro = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, zi] = p[i], [xj, zj] = p[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) dentro = !dentro;
  }
  return dentro;
}

/** Punto interior para rotular una estancia: el centroide si cae dentro; si no (forma en L o en U), el punto de una
 *  rejilla de 11 × 11 más alejado de las paredes. */
export function puntoEtiqueta(p) {
  const c = centroide(p);
  if (puntoEnPoligono(c, p)) return c;
  const xs = p.map((v) => v[0]), zs = p.map((v) => v[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  let mejor = c, md = -1;
  for (let i = 1; i < 12; i++) for (let j = 1; j < 12; j++) {
    const q = [x0 + ((x1 - x0) * i) / 12, z0 + ((z1 - z0) * j) / 12];
    if (!puntoEnPoligono(q, p)) continue;
    let d = Infinity;
    for (let k = 0; k < p.length; k++) {
      const [ax, az] = p[k], [bx, bz] = p[(k + 1) % p.length];
      const L2 = (bx - ax) ** 2 + (bz - az) ** 2 || 1;
      const t = Math.max(0, Math.min(1, ((q[0] - ax) * (bx - ax) + (q[1] - az) * (bz - az)) / L2));
      d = Math.min(d, Math.hypot(q[0] - ax - t * (bx - ax), q[1] - az - t * (bz - az)));
    }
    if (d > md) { md = d; mejor = q; }
  }
  return mejor;
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

/** "Salón-comedor 2" → "salon-comedor-2" (ids y nombres de archivo: solo a-z, 0-9 y guiones). */
export const slug = (t, defecto = "vista") =>
  String(t ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || defecto;

/**
 * Enlace o recurso que viene del tour (dato no fiable) → la URL recortada, o null si no es segura.
 * Admite http(s), mailto, tel y rutas relativas. Con { descarga: true }, además blob: del mismo origen (vista previa del
 * Estudio) y data: de PDF o imagen (tour autónomo); con { imagen: true }, blob: del mismo origen y cualquier data:image.
 * Nunca javascript:, vbscript: ni otros esquemas, ni caracteres de control (con un tabulador se disfraza «java\tscript:»).
 * Con { base }, una ruta relativa se devuelve absoluta respecto a esa dirección (p. ej. url_publica).
 */
export function urlSegura(url, { descarga = false, imagen = false, base } = {}) {
  if (typeof url !== "string") return null;
  const s = url.trim();
  if (!s || /[\u0000-\u001f\u007f]/.test(s)) return null;
  if (/^(https?:|mailto:|tel:)/i.test(s)) return s;
  const origen = typeof location === "undefined" ? null : location.origin;
  if ((descarga || imagen) && /^blob:/i.test(s)) return origen && s.startsWith(`blob:${origen}/`) ? s : null;
  if (descarga && /^data:(application\/pdf|image\/(png|jpe?g|webp|gif|avif))[;,]/i.test(s)) return s;
  if (imagen && /^data:image\//i.test(s)) return s;
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return null;
  if (base == null) return s;
  try { return new URL(s, base).href; } catch { return null; }
}
