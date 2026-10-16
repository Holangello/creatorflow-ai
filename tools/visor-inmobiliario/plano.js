// Radar y plano 2D: plantas, estancias con m², muros, enlaces, fotos y cono de visión.
// modoMapa() "radar": centrado en el visitante y girando con su mirada (esquina); "plano": norte arriba («Estancias y plano»).
// Colores, letra y tamaños salen de los tokens de tema.css, leídos del propio lienzo (está dentro de un vidrio, así que
// el texto secundario es su versión para vidrio). Se releen y se repinta con el evento "cre8:tema" (tema, talla) y con
// retema() (aspecto del vidrio). En claro, tinta oscura sobre vidrio claro; en oscuro, al revés. Sin color, como el vidrio:
// la posición del visitante va en negativo (relleno del color del texto con su contorno).
import { areaPoligono, puntoEtiqueta, puntoEnPoligono } from "./util.js";

// Uso en el dibujo → token
const TOKENS = {
  texto: "--c-texto",              // nombres, muros, norte y puntos de las fotos
  texto2: "--c-texto-2",           // m²
  capa: "--c-capa-hover",          // relleno de las estancias
  capaActiva: "--c-capa-activa",   // estancia bajo el puntero
  separador: "--c-separador",      // anillos de distancia del radar
  borde: "--c-borde-2",            // aro del radar
  sobreTexto: "--c-sobre-texto",   // contorno de la posición (en negativo: sin color, como el resto del vidrio)
  contorno: "--c-fondo",           // contorno de los demás puntos
};
// Contingencia: sin tema.css (o con un color que el lienzo no entienda), los valores del tema oscuro.
const RESERVA = { texto: [245, 245, 247, 1], texto2: [195, 199, 205, 1], capa: [255, 255, 255, 0.08], capaActiva: [255, 255, 255, 0.14],
  separador: [255, 255, 255, 0.08], borde: [255, 255, 255, 0.18], sobreTexto: [18, 20, 24, 1], contorno: [10, 11, 13, 1] };

/** Color CSS (hex, rgb(), color-mix(), oklch(from …)…) → [r, g, b, a] en sRGB, pintando un píxel. null si no se entiende. */
let pixel = null;
function rgbaDe(valor) {
  if (!valor) return null;
  if (!pixel) {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    pixel = c.getContext("2d", { willReadFrequently: true });
  }
  if (!pixel) return null;
  pixel.fillStyle = "#010203";
  pixel.fillStyle = valor;
  if (pixel.fillStyle === "#010203" && !/^#010203$/i.test(valor)) return null;
  pixel.clearRect(0, 0, 1, 1);
  pixel.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = pixel.getImageData(0, 0, 1, 1).data;
  return [r, g, b, Math.round((a / 255) * 1000) / 1000];
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} ctx  { tour(), planta(), nodos(), nodoActual(), posicion(), modoMapa(), texto(v), superficie(m²), alElegirNodo(n), alElegirPunto(x, z) }
 */
export function crearPlano(canvas, ctx) {
  const g = canvas.getContext("2d");
  const imagenes = new Map();
  const marcos = new Map();
  let hover = null;
  let paleta = null;

  /** Tokens del tema vigente (en caché hasta el próximo cambio de tema, talla o color de marca). */
  function leerPaleta() {
    const cs = getComputedStyle(canvas);
    const raiz = getComputedStyle(document.documentElement);
    const p = {};
    for (const [k, v] of Object.entries(TOKENS)) p[k] = rgbaDe(cs.getPropertyValue(v).trim()) ?? RESERVA[k];
    const rem = parseFloat(raiz.fontSize) || 16;
    const tam = (token, reserva) => { const v = raiz.getPropertyValue(token).trim(); const n = parseFloat(v); return n > 0 ? (v.endsWith("rem") ? n * rem : n) : reserva * rem; };
    p.fuente = raiz.getPropertyValue("--fuente").trim() || "system-ui, sans-serif";
    p.normal = raiz.getPropertyValue("--peso-normal").trim() || "400";
    p.semi = raiz.getPropertyValue("--peso-semi").trim() || "600";
    p.fuerte = raiz.getPropertyValue("--peso-fuerte").trim() || "700";
    p.micro = tam("--t-micro", 0.6875);
    p.pie = tam("--t-pie", 0.75);
    p.sec = tam("--t-sec", 0.8125);
    p.u = Math.min(1.6, Math.max(0.75, rem / 16)); // escala de puntos y cono (talla S/M/L)
    return p;
  }
  const css = ([r, gr, b, a], alfa = 1) => `rgba(${r},${gr},${b},${Math.round(a * alfa * 1000) / 1000})`;

  function imagenPlanta(p) {
    const src = p?.plano?.imagen;
    if (!src) return null;
    if (!imagenes.has(src)) {
      if (imagenes.size > 12) imagenes.delete(imagenes.keys().next().value);
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
      for (const e of ctx.tour().estancias ?? []) if (e.planta === p.id && Array.isArray(e.poligono)) pts.push(...e.poligono);
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
    const C = (paleta ??= leerPaleta());
    const letra = (peso, px) => `${peso} ${Math.round(Math.max(px, 12) * 10) / 10}px ${C.fuente}`; // nunca por debajo de 12 px
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const T = transform(p, W, H);
    const grande = W > 300;
    const u = C.u;

    if (T.radar) {
      // El fondo es el vidrio del disco (CSS); aquí solo los anillos de distancia, cada 2 m.
      g.save();
      g.beginPath(); g.arc(T.cx, T.cz, Math.min(W, H) / 2 - 2, 0, Math.PI * 2); g.clip();
      g.strokeStyle = css(C.separador); g.lineWidth = 1;
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
      g.fillStyle = css(e === hover ? C.capaActiva : C.capa);
      g.fill();
    }

    if (p.muros?.length) {
      // muros finos con las juntas redondas, como los planos de Apple Maps
      g.strokeStyle = css(C.texto, 0.85); g.lineWidth = Math.max(1.5, T.esc * 0.085); g.lineCap = "round"; g.lineJoin = "round";
      g.beginPath();
      for (const m of p.muros) { const [ax, az] = T.a(m[0], m[1]), [bx, bz] = T.a(m[2], m[3]); g.moveTo(ax, az); g.lineTo(bx, bz); }
      g.stroke();
    }

    // Enlaces entre las fotos, bajo los rótulos: el halo del rótulo tapa la línea que lo cruza (V14)
    const nodos = ctx.nodos().filter((n) => n.planta === p.id);
    g.strokeStyle = css(C.texto, 0.32); g.lineWidth = 1.25; g.lineCap = "round";
    g.beginPath();
    for (const n of nodos) for (const v of n.vecinos) {
      if (v.planta !== p.id || v.id < n.id) continue;
      const [ax, az] = T.a(n.x, n.z), [bx, bz] = T.a(v.x, v.z);
      g.moveTo(ax, az); g.lineTo(bx, bz);
    }
    g.stroke();

    // Etiquetas de estancias cuando hay espacio: nombre y m² en el plano; en el radar solo el nombre, y solo si es grande.
    const rotulos = T.radar ? Math.min(W, H) >= 130 : grande || T.esc > 22;
    if (T.radar) canvas.parentElement?.toggleAttribute("data-sin-rotulos", !rotulos); // visor.css: sin rótulos, vidrio de icono
    if (rotulos) {
      g.textAlign = "center"; g.textBaseline = "middle";
      // Halo del color de fondo: el rótulo se lee aunque lo crucen un enlace o un muro
      g.lineJoin = "round"; g.lineWidth = 3; g.strokeStyle = css(C.contorno, 0.75);
      const rotular = (txt, x, y) => { g.strokeText(txt, x, y); g.fillText(txt, x, y); };
      const pos0 = T.radar ? ctx.posicion() : null;
      const nombre = T.radar ? C.micro : grande ? C.sec : C.micro, m2 = grande ? C.pie : C.micro * 0.92;
      // Puntos de las fotos 360 de esta planta: si uno cae sobre el rótulo (la foto suele estar en el centro de la
      // estancia), el rótulo sube por encima del punto en vez de quedar tapado por él.
      const radio = (grande ? 6 : 5) * u;
      const puntos = nodos.map((n) => T.a(n.x, n.z));
      for (const e of estancias) {
        // En el radar no se rotula la estancia donde está el visitante (ya figura en la tarjeta superior).
        if (pos0 && puntoEnPoligono([pos0.x, pos0.z], e.poligono)) continue;
        const [cx, cz] = T.a(...puntoEtiqueta(e.poligono));
        const txt = ctx.texto(e.nombre), sup = ctx.superficie(areaPoligono(e.poligono));
        g.font = letra(C.semi, nombre);
        const ancho = g.measureText(txt).width / 2 + radio;
        const arriba = T.radar ? nombre * 0.6 : nombre * 1.1, abajo = T.radar ? nombre * 0.6 : m2 * 1.2;
        const punto = puntos.find(([x, z]) => Math.abs(x - cx) < ancho && z > cz - arriba - radio && z < cz + abajo + radio);
        // Línea del nombre y de los m²: centradas en la estancia o, si hay un punto, justo encima de él
        const base = punto ? punto[1] - radio - 2 * u : null;
        const yNombre = T.radar ? (punto ? base - nombre * 0.55 : cz) : punto ? base - m2 * 1.15 - nombre * 0.55 : cz - nombre * 0.55;
        const yM2 = punto ? base - m2 * 0.55 : cz + m2 * 0.7;
        if (T.radar) {
          // En el radar, solo si el nombre cabe entero dentro del disco (cortado por el borde no se lee)
          const R = Math.min(W, H) / 2 - 3 * u, dx = ancho - radio, dy = nombre * 0.6;
          if ([[-dx, -dy], [dx, -dy], [-dx, dy], [dx, dy]].some(([a, b]) => Math.hypot(cx + a - T.cx, yNombre + b - T.cz) > R)) continue;
        }
        g.fillStyle = css(C.texto);
        rotular(txt, cx, yNombre);
        if (T.radar) continue;
        g.font = letra(C.normal, m2);
        g.fillStyle = css(C.texto2);
        rotular(sup, cx, yM2);
      }
    }

    // Fotos 360, encima de todo
    const actual = ctx.nodoActual();
    for (const n of nodos) {
      const [x, z] = T.a(n.x, n.z);
      const es = n === actual;
      g.fillStyle = css(C.texto);
      g.beginPath(); g.arc(x, z, (grande ? 6 : 5) * u, 0, Math.PI * 2); g.fill();
      g.strokeStyle = css(es ? C.sobreTexto : C.contorno, es ? 1 : 0.85); g.lineWidth = es ? 2 : 1.5; g.stroke();
    }

    // Norte (solo si se conoce): flecha en la esquina del plano; en el radar, una «N» en el borde que gira con la vista.
    const norte = ctx.tour().norte;
    if (norte != null && !T.radar) {
      g.save(); g.translate(W - 18 * u, 20 * u); g.rotate((-norte * Math.PI) / 180); g.scale(u, u);
      g.fillStyle = css(C.texto, 0.9); g.beginPath(); g.moveTo(0, -9); g.lineTo(5, 5); g.lineTo(0, 2); g.lineTo(-5, 5); g.closePath(); g.fill();
      g.font = letra(C.semi, 9); g.textAlign = "center"; g.textBaseline = "alphabetic"; g.fillText("N", 0, -12);
      g.restore();
    }

    // Posición y cono de visión
    const pos = ctx.posicion();
    if (pos && pos.planta === p.id) {
      const [x, z] = T.a(pos.x, pos.z);
      const media = Math.min(pos.fovH / 2, 1.2);
      const dirPantalla = T.radar ? 0 : pos.rumbo; // en radar, la mirada siempre apunta arriba
      const rad = (grande ? 70 : 46) * u;
      const grd = g.createRadialGradient(x, z, 0, x, z, rad);
      grd.addColorStop(0, css(C.texto, 0.42)); grd.addColorStop(1, css(C.texto, 0));
      g.fillStyle = grd;
      g.beginPath(); g.moveTo(x, z); g.arc(x, z, rad, dirPantalla - Math.PI / 2 - media, dirPantalla - Math.PI / 2 + media); g.closePath(); g.fill();
      // posición: un punto con su contorno y una sombra suave, como la de Mapas
      g.save(); g.shadowColor = "rgba(0, 0, 0, 0.35)"; g.shadowBlur = 4 * u; g.shadowOffsetY = 1 * u;
      g.fillStyle = css(C.sobreTexto); g.beginPath(); g.arc(x, z, 7.5 * u, 0, Math.PI * 2); g.fill();
      g.restore();
      g.fillStyle = css(C.texto); g.beginPath(); g.arc(x, z, 5 * u, 0, Math.PI * 2); g.fill();
    }
    if (T.radar) {
      g.restore();
      g.strokeStyle = css(C.borde); g.lineWidth = 1.5;
      g.beginPath(); g.arc(T.cx, T.cz, Math.min(W, H) / 2 - 2, 0, Math.PI * 2); g.stroke();
      if (norte != null) {
        const a = T.rot - (norte * Math.PI) / 180, r = Math.min(W, H) / 2 - C.micro * 0.9;
        g.font = letra(C.fuerte, C.micro * 0.85); g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = css(C.texto);
        g.fillText("N", T.cx + r * Math.sin(a), T.cz - r * Math.cos(a));
      }
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

  // Solo un toque elige (no el final de un arrastre o de un desplazamiento).
  let inicio = null;
  canvas.addEventListener("pointerdown", (e) => { inicio = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener("pointerup", (e) => {
    if (!inicio || Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > 8) { inicio = null; return; }
    inicio = null;
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
  // Tema, talla o transparencia nuevos: otros colores y otra letra.
  document.addEventListener("cre8:tema", () => { paleta = null; dibujar(); });

  return {
    dibujar,
    invalidar: () => marcos.clear(),
    /** Tras cambiar el aspecto del vidrio que lo contiene (o el color de marca): relee los colores en el próximo dibujo. */
    retema: () => { paleta = null; },
    /** Colores vigentes (pruebas y depuración). */
    get paleta() { return (paleta ??= leerPaleta()); },
  };
}
