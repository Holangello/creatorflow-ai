// Lector mínimo de DXF (ASCII) para planos de AutoCAD / Revit / ArchiCAD: LINE, LWPOLYLINE, POLYLINE/VERTEX, ARC y CIRCLE
// (los arcos se aproximan con segmentos). Devuelve segmentos por capa y las unidades ($INSUNITS).
const UNIDADES = { 1: ["in", 0.0254], 2: ["ft", 0.3048], 4: ["mm", 0.001], 5: ["cm", 0.01], 6: ["m", 1], 14: ["dm", 0.1] };
export const FACTOR = { mm: 0.001, cm: 0.01, dm: 0.1, m: 1, in: 0.0254, ft: 0.3048 };

export function leerDxf(texto) {
  if (/^AutoCAD Binary DXF/.test(texto.slice(0, 22))) throw new Error("DXF binario no soportado: expórtalo como DXF ASCII");
  const l = texto.split(/\r?\n/);
  const pares = [];
  for (let i = 0; i + 1 < l.length; i += 2) pares.push([parseInt(l[i].trim(), 10), l[i + 1].trim()]);
  let unidades = null;
  const segs = []; // {capa, x1, y1, x2, y2}
  let seccion = null, i = 0;
  const leerEntidad = () => {
    const tipo = pares[i][1];
    const datos = []; i++;
    while (i < pares.length && pares[i][0] !== 0) { datos.push(pares[i]); i++; }
    return { tipo, datos };
  };
  const val = (d, c, def = 0) => { const p = d.find(([k]) => k === c); return p ? parseFloat(p[1]) : def; };
  const capa = (d) => d.find(([k]) => k === 8)?.[1] ?? "0";
  const arco = (cx, cy, r, a0, a1, c) => {
    if (a1 < a0) a1 += 360;
    const n = Math.max(4, Math.ceil((a1 - a0) / 15));
    let px = cx + r * Math.cos((a0 * Math.PI) / 180), py = cy + r * Math.sin((a0 * Math.PI) / 180);
    for (let k = 1; k <= n; k++) {
      const a = ((a0 + ((a1 - a0) * k) / n) * Math.PI) / 180;
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      segs.push({ capa: c, x1: px, y1: py, x2: x, y2: y }); px = x; py = y;
    }
  };
  while (i < pares.length) {
    const [c, v] = pares[i];
    if (c === 0 && v === "SECTION") { seccion = pares[i + 1]?.[1]; i += 2; continue; }
    if (c === 0 && v === "ENDSEC") { seccion = null; i++; continue; }
    if (seccion === "HEADER" && c === 9 && v === "$INSUNITS") { unidades = UNIDADES[parseInt(pares[i + 1]?.[1], 10)]?.[0] ?? null; i += 2; continue; }
    if (seccion === "ENTITIES" && c === 0) {
      const e = leerEntidad();
      const d = e.datos;
      if (e.tipo === "LINE") segs.push({ capa: capa(d), x1: val(d, 10), y1: val(d, 20), x2: val(d, 11), y2: val(d, 21) });
      else if (e.tipo === "LWPOLYLINE") {
        const pts = []; let x = null;
        for (const [k, s] of d) { if (k === 10) x = parseFloat(s); else if (k === 20 && x != null) { pts.push([x, parseFloat(s)]); x = null; } }
        const cerrada = (val(d, 70) & 1) === 1;
        for (let j = 0; j + 1 < pts.length; j++) segs.push({ capa: capa(d), x1: pts[j][0], y1: pts[j][1], x2: pts[j + 1][0], y2: pts[j + 1][1] });
        if (cerrada && pts.length > 2) segs.push({ capa: capa(d), x1: pts.at(-1)[0], y1: pts.at(-1)[1], x2: pts[0][0], y2: pts[0][1] });
      } else if (e.tipo === "POLYLINE") {
        const c0 = capa(d), cerrada = (val(d, 70) & 1) === 1, pts = [];
        while (i < pares.length && pares[i][1] === "VERTEX") { const vtx = leerEntidad(); pts.push([val(vtx.datos, 10), val(vtx.datos, 20)]); }
        if (pares[i]?.[1] === "SEQEND") leerEntidad();
        for (let j = 0; j + 1 < pts.length; j++) segs.push({ capa: c0, x1: pts[j][0], y1: pts[j][1], x2: pts[j + 1][0], y2: pts[j + 1][1] });
        if (cerrada && pts.length > 2) segs.push({ capa: c0, x1: pts.at(-1)[0], y1: pts.at(-1)[1], x2: pts[0][0], y2: pts[0][1] });
      } else if (e.tipo === "ARC") arco(val(d, 10), val(d, 20), val(d, 40), val(d, 50), val(d, 51), capa(d));
      else if (e.tipo === "CIRCLE") arco(val(d, 10), val(d, 20), val(d, 40), 0, 360, capa(d));
      continue;
    }
    i++;
  }
  const capas = new Map();
  for (const s of segs) capas.set(s.capa, (capas.get(s.capa) ?? 0) + 1);
  return { segs, capas, unidades };
}

/** Sugerencia de unidades por el tamaño del dibujo (una vivienda mide 5–40 m). */
export function sugerirUnidades(segs) {
  const { w, h } = extension(segs);
  const lado = Math.max(w, h);
  if (lado > 2000) return "mm";
  if (lado > 200) return "cm";
  return "m";
}
export function extension(segs) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const s of segs) { x0 = Math.min(x0, s.x1, s.x2); x1 = Math.max(x1, s.x1, s.x2); y0 = Math.min(y0, s.y1, s.y2); y1 = Math.max(y1, s.y1, s.y2); }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}
/** Convierte a metros del plano (x → derecha, z → abajo, origen en la esquina superior izquierda). */
export function aMetros(segs, factor, ext = extension(segs)) {
  const r = (v) => Math.round(v * 1000) / 1000;
  return segs.map((s) => [r((s.x1 - ext.x0) * factor), r((ext.y1 - s.y1) * factor), r((s.x2 - ext.x0) * factor), r((ext.y1 - s.y2) * factor)])
    .filter(([a, b, c, d]) => Math.hypot(c - a, d - b) > 0.01);
}
/** Dibuja los segmentos (todas las capas) como imagen PNG del plano. */
export async function renderizar(segsM, anchoM, altoM, { px = 3000, resaltar = null } = {}) {
  const esc = px / Math.max(anchoM, 0.01), m = 0;
  const W = Math.max(64, Math.round(anchoM * esc) + m * 2), H = Math.max(64, Math.round(altoM * esc) + m * 2);
  const c = new OffscreenCanvas(W, H), g = c.getContext("2d");
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, H);
  g.lineCap = "round";
  const pintar = (lista, color, ancho) => {
    g.strokeStyle = color; g.lineWidth = ancho; g.beginPath();
    for (const [a, b, cc, d] of lista) { g.moveTo(m + a * esc, m + b * esc); g.lineTo(m + cc * esc, m + d * esc); }
    g.stroke();
  };
  pintar(segsM, "#8a8f98", Math.max(1, px / 1500));
  if (resaltar) pintar(resaltar, "#1d2026", Math.max(2, px / 600));
  return c.convertToBlob({ type: "image/png" });
}
