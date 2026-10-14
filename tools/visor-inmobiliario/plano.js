// Minimapa / plano 2D: plantas, estancias con m², muros, enlaces, fotos y cono de visión.
import { areaPoligono, centroide, puntoEnPoligono } from "./util.js";

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} ctx  { tour(), planta(), nodos(), nodoActual(), posicion(), acento(), texto(v), formato(n), alElegirNodo(n), alElegirPunto(x, z) }
 */
export function crearPlano(canvas, ctx) {
  const g = canvas.getContext("2d");
  const imagenes = new Map();
  const marcos = new Map();
  let hover = null;

  function imagenPlanta(p) {
    const src = p?.plano?.imagen;
    if (!src) return null;
    if (!imagenes.has(src)) {
      const img = new Image();
      img.onload = () => dibujar();
      img.src = src;
      imagenes.set(src, img);
    }
    const img = imagenes.get(src);
    return img.complete && img.naturalWidth ? img : null;
  }

  function marco(p) {
    if (marcos.has(p.id)) return marcos.get(p.id);
    let m;
    if (p.plano?.ancho_m) {
      const [x0, z0] = p.plano.origen ?? [0, 0];
      m = { x0, z0, x1: x0 + p.plano.ancho_m, z1: z0 + p.plano.alto_m };
    } else {
      const pts = ctx.nodos().filter((n) => n.planta === p.id).map((n) => [n.x, n.z]);
      for (const mu of p.muros ?? []) pts.push([mu[0], mu[1]], [mu[2], mu[3]]);
      for (const e of ctx.tour().estancias ?? []) if (e.planta === p.id) pts.push(...e.poligono);
      const lim = ctx.tour().libre?.limites;
      if (lim) pts.push([lim[0], lim[1]], [lim[2], lim[3]]);
      if (!pts.length) pts.push([-5, -5], [5, 5]);
      m = {
        x0: Math.min(...pts.map((v) => v[0])) - 0.6, x1: Math.max(...pts.map((v) => v[0])) + 0.6,
        z0: Math.min(...pts.map((v) => v[1])) - 0.6, z1: Math.max(...pts.map((v) => v[1])) + 0.6,
      };
    }
    marcos.set(p.id, m);
    return m;
  }

  // Modo "plano": norte arriba y vivienda completa. Modo "radar" (estilo Counter-Strike): centrado en el
  // visitante y girando con su mirada, de modo que "delante" siempre queda arriba.
  function transform(p, W, H) {
    const m = marco(p);
    const pos = ctx.posicion();
    if (ctx.modoMapa?.() === "radar" && pos && pos.planta === p.id) {
      const esc = Math.min(W, H) / 9; // ~9 m de diámetro visible
      const cx = W / 2, cz = H / 2, c = Math.cos(-pos.rumbo), s = Math.sin(-pos.rumbo);
      return {
        esc, radar: true, rot: -pos.rumbo, cx, cz, px: pos.x, pz: pos.z,
        a: (x, z) => { const dx = x - pos.x, dz = z - pos.z; return [cx + (dx * c - dz * s) * esc, cz + (dx * s + dz * c) * esc]; },
        de: (qx, qz) => { const dx = (qx - cx) / esc, dz = (qz - cz) / esc; return [pos.x + dx * c + dz * s, pos.z - dx * s + dz * c]; },
      };
    }
    const esc = Math.min((W - 16) / (m.x1 - m.x0), (H - 16) / (m.z1 - m.z0));
    const ox = (W - (m.x1 - m.x0) * esc) / 2, oz = (H - (m.z1 - m.z0) * esc) / 2;
    return { esc, a: (x, z) => [ox + (x - m.x0) * esc, oz + (z - m.z0) * esc], de: (px, pz) => [(px - ox) / esc + m.x0, (pz - oz) / esc + m.z0] };
  }

  function dibujar() {
    const p = ctx.planta();
    if (!p) return;
    const dpr = Math.min(devicePixelRatio, 2);
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (!W || !H) return;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const T = transform(p, W, H);
    const acento = ctx.acento();
    const grande = W > 300;

    if (T.radar) {
      g.save();
      g.beginPath(); g.arc(T.cx, T.cz, Math.min(W, H) / 2 - 2, 0, Math.PI * 2); g.clip();
      g.fillStyle = "rgba(10,12,16,.55)"; g.fillRect(0, 0, W, H);
      // anillos de distancia (cada 2 m)
      g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 1;
      for (let r = 2; r * T.esc < Math.max(W, H); r += 2) { g.beginPath(); g.arc(T.cx, T.cz, r * T.esc, 0, Math.PI * 2); g.stroke(); }
    }
    const img = imagenPlanta(p);
    if (img) {
      const m = marco(p);
      g.globalAlpha = 0.92;
      if (T.radar) {
        g.save(); g.translate(T.cx, T.cz); g.rotate(T.rot); g.scale(T.esc, T.esc); g.translate(-T.px, -T.pz);
        g.drawImage(img, m.x0, m.z0, m.x1 - m.x0, m.z1 - m.z0);
        g.restore();
      } else {
        const [ax, az] = T.a(m.x0, m.z0), [bx, bz] = T.a(m.x1, m.z1);
        g.drawImage(img, ax, az, bx - ax, bz - az);
      }
      g.globalAlpha = 1;
    }

    // Estancias
    const estancias = (ctx.tour().estancias ?? []).filter((e) => e.planta === p.id && e.poligono?.length > 2);
    for (const e of estancias) {
      g.beginPath();
      e.poligono.forEach(([x, z], i) => { const [px, pz] = T.a(x, z); i ? g.lineTo(px, pz) : g.moveTo(px, pz); });
      g.closePath();
      g.fillStyle = e === hover ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.05)";
      g.fill();
    }

    if (p.muros?.length) {
      g.strokeStyle = "#e3e6ea"; g.lineWidth = Math.max(2, T.esc * 0.12); g.lineCap = "square";
      g.beginPath();
      for (const m of p.muros) { const [ax, az] = T.a(m[0], m[1]), [bx, bz] = T.a(m[2], m[3]); g.moveTo(ax, az); g.lineTo(bx, bz); }
      g.stroke();
    }

    // Etiquetas de estancias (nombre + m²) cuando hay espacio
    if (grande || T.esc > 22 || T.radar) {
      g.textAlign = "center"; g.textBaseline = "middle";
      const pos0 = T.radar ? ctx.posicion() : null;
      for (const e of estancias) {
        // En el radar no se rotula la estancia donde está el visitante (ya figura en la tarjeta superior).
        if (pos0 && puntoEnPoligono([pos0.x, pos0.z], e.poligono)) continue;
        const [cx, cz] = T.a(...centroide(e.poligono));
        g.font = `600 ${grande ? 13 : 10}px system-ui, sans-serif`;
        g.fillStyle = "rgba(255,255,255,.85)";
        g.fillText(ctx.texto(e.nombre), cx, cz - 7);
        g.font = `${grande ? 12 : 9}px system-ui, sans-serif`;
        g.fillStyle = "rgba(255,255,255,.6)";
        g.fillText(`${ctx.formato(areaPoligono(e.poligono))} m²`, cx, cz + 8);
      }
    }

    // Enlaces y nodos
    const nodos = ctx.nodos().filter((n) => n.planta === p.id);
    g.strokeStyle = hexAlfa(acento, 0.4); g.lineWidth = 1.5; g.setLineDash([3, 3]);
    g.beginPath();
    for (const n of nodos) for (const v of n.vecinos) {
      if (v.planta !== p.id || v.id < n.id) continue;
      const [ax, az] = T.a(n.x, n.z), [bx, bz] = T.a(v.x, v.z);
      g.moveTo(ax, az); g.lineTo(bx, bz);
    }
    g.stroke(); g.setLineDash([]);
    const actual = ctx.nodoActual();
    for (const n of nodos) {
      const [x, z] = T.a(n.x, n.z);
      g.fillStyle = n === actual ? acento : "#ffffff";
      g.beginPath(); g.arc(x, z, grande ? 6 : 5, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 1; g.stroke();
    }

    // Norte
    const norte = ctx.tour().norte;
    if (norte != null || T.radar) {
      g.save(); g.translate(W - 18, 18); g.rotate((-(norte ?? 0) * Math.PI) / 180 + (T.radar ? T.rot : 0));
      g.fillStyle = "rgba(255,255,255,.85)"; g.beginPath(); g.moveTo(0, -9); g.lineTo(5, 5); g.lineTo(0, 2); g.lineTo(-5, 5); g.closePath(); g.fill();
      g.font = "600 9px system-ui"; g.textAlign = "center"; g.fillText("N", 0, -12);
      g.restore();
    }

    // Posición y cono de visión
    const pos = ctx.posicion();
    if (pos && pos.planta === p.id) {
      const [x, z] = T.a(pos.x, pos.z);
      const media = Math.min(pos.fovH / 2, 1.2);
      const dirPantalla = T.radar ? 0 : pos.rumbo; // en radar, la mirada siempre apunta arriba
      const rad = grande ? 70 : 46;
      const grd = g.createRadialGradient(x, z, 0, x, z, rad);
      grd.addColorStop(0, hexAlfa(acento, 0.55)); grd.addColorStop(1, hexAlfa(acento, 0));
      g.fillStyle = grd;
      g.beginPath(); g.moveTo(x, z); g.arc(x, z, rad, dirPantalla - Math.PI / 2 - media, dirPantalla - Math.PI / 2 + media); g.closePath(); g.fill();
      g.fillStyle = acento; g.strokeStyle = "#111"; g.lineWidth = 2;
      g.beginPath(); g.arc(x, z, 7, 0, Math.PI * 2); g.fill(); g.stroke();
    }
    if (T.radar) {
      g.restore();
      g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1.5;
      g.beginPath(); g.arc(T.cx, T.cz, Math.min(W, H) / 2 - 2, 0, Math.PI * 2); g.stroke();
    }
  }

  function elegir(px, pz) {
    const p = ctx.planta();
    const W = canvas.clientWidth, H = canvas.clientHeight;
    const T = transform(p, W, H);
    let mejor = null, d = 24;
    for (const n of ctx.nodos()) {
      if (n.planta !== p.id) continue;
      const [x, z] = T.a(n.x, n.z);
      const dd = Math.hypot(x - px, z - pz);
      if (dd < d) { d = dd; mejor = n; }
    }
    if (mejor) return ctx.alElegirNodo(mejor);
    const [x, z] = T.de(px, pz);
    ctx.alElegirPunto?.(x, z);
  }

  canvas.addEventListener("pointerup", (e) => {
    const r = canvas.getBoundingClientRect();
    elegir(e.clientX - r.left, e.clientY - r.top);
  });
  canvas.addEventListener("pointermove", (e) => {
    const p = ctx.planta();
    if (!p || e.pointerType === "touch") return;
    const r = canvas.getBoundingClientRect();
    const [x, z] = transform(p, r.width, r.height).de(e.clientX - r.left, e.clientY - r.top);
    const h = (ctx.tour().estancias ?? []).find((s) => s.planta === p.id && s.poligono?.length > 2 && puntoEnPoligono([x, z], s.poligono)) ?? null;
    if (h !== hover) { hover = h; dibujar(); }
  });
  canvas.addEventListener("pointerleave", () => { if (hover) { hover = null; dibujar(); } });

  return { dibujar, invalidar: () => marcos.clear() };
}

function hexAlfa(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) return `rgba(255,181,71,${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
