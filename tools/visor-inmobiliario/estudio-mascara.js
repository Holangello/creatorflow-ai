// Editor de máscara de superficies sobre la foto equirectangular (vista plana con zoom y desplazamiento).
// Canal R = paredes, canal G = suelo (blanco = superficie). Varita mágica por tolerancia, pincel y goma, deshacer.
// Los colores de la capa (rojo = paredes, verde = suelo) son datos; el marco y el cursor salen de los tokens del tema.
import { app, h, icono, cambiar, emitir, toast, confirmar, guardarArchivo, rutaLibre, textoDe, pano, coloresTema, alCambiarTema, deslizador } from "./estudio-nucleo.js";

const W = 2048, H = 1024;

/** Abre el editor. vi = índice de variante (opcional): edita la máscara de esa variante de estilo. */
export async function abrirEditorMascara(pid, vi = null) {
  const p = pano(pid);
  if (!p) return;
  const v = vi != null ? p.variantes?.[vi] : null;
  const fuente = v ? v.imagen_movil ?? v.imagen : p.imagen_movil ?? p.imagen;
  const rutaMascara = v ? v.mascara : p.mascara;
  const blob = app.archivos.get(fuente);
  if (!blob) return toast("No se encuentra la imagen de la foto", "error");

  // --- datos
  const base = new OffscreenCanvas(W, H);
  const gb = base.getContext("2d", { willReadFrequently: true });
  try {
    const bmp = await createImageBitmap(blob, { resizeWidth: W, resizeHeight: H, resizeQuality: "high" });
    gb.drawImage(bmp, 0, 0); bmp.close();
  } catch (e) { return toast(`No se pudo leer la imagen: ${e.message}`, "error"); }
  const px = gb.getImageData(0, 0, W, H).data;
  // Copia suavizada (caja 3×3) para que la varita no se corte con el ruido de la foto.
  const suave = new Uint8ClampedArray(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let dy = -1; dy <= 1; dy++) {
      const yy = y + dy; if (yy < 0 || yy >= H) continue;
      for (let dx = -1; dx <= 1; dx++) { const xx = (x + dx + W) % W; const i = (yy * W + xx) * 4; r += px[i]; g += px[i + 1]; b += px[i + 2]; n++; }
    }
    const o = (y * W + x) * 3; suave[o] = r / n; suave[o + 1] = g / n; suave[o + 2] = b / n;
  }
  const mascaras = { paredes: new Uint8Array(W * H), suelo: new Uint8Array(W * H) };
  const mBlob = rutaMascara && app.archivos.get(rutaMascara);
  if (mBlob) {
    try {
      const bm = await createImageBitmap(mBlob, { resizeWidth: W, resizeHeight: H, resizeQuality: "pixelated" });
      const c = new OffscreenCanvas(W, H), g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(bm, 0, 0); bm.close();
      const d = g.getImageData(0, 0, W, H).data;
      for (let i = 0; i < W * H; i++) { mascaras.paredes[i] = d[i * 4] > 127 ? 1 : 0; mascaras.suelo[i] = !mascaras.paredes[i] && d[i * 4 + 1] > 127 ? 1 : 0; }
    } catch {}
  }

  // --- estado
  let sucio = true, raf = 0, dpr = 1, ancho = 0, alto = 0, ro = null;
  const marcar = () => { sucio = true; };
  const S = { herr: "varita", canal: "paredes", tol: 26, tam: 28, opac: 0.55, contiguo: true, esc: 1, ox: 0, oy: 0, espacio: false,
    hist: [], futuro: [], cambiado: false, raton: null, pinta: null };
  const capa = new OffscreenCanvas(W, H);
  const gc = capa.getContext("2d");
  const imgCapa = gc.createImageData(W, H);
  function repintarCapa() {
    const a = imgCapa.data, P = mascaras.paredes, F = mascaras.suelo;
    for (let i = 0, j = 0; i < W * H; i++, j += 4) {
      if (P[i]) { a[j] = 255; a[j + 1] = 64; a[j + 2] = 64; a[j + 3] = 255; }
      else if (F[i]) { a[j] = 40; a[j + 1] = 220; a[j + 2] = 110; a[j + 3] = 255; }
      else a[j + 3] = 0;
    }
    gc.putImageData(imgCapa, 0, 0);
    marcar();
  }
  const guardarHist = () => { S.hist.push([mascaras.paredes.slice(), mascaras.suelo.slice()]); if (S.hist.length > 15) S.hist.shift(); S.futuro.length = 0; S.cambiado = true; };
  const deshacer = () => { if (!S.hist.length) return; S.futuro.push([mascaras.paredes, mascaras.suelo]); [mascaras.paredes, mascaras.suelo] = S.hist.pop(); repintarCapa(); };
  const rehacer = () => { if (!S.futuro.length) return; S.hist.push([mascaras.paredes, mascaras.suelo]); [mascaras.paredes, mascaras.suelo] = S.futuro.pop(); repintarCapa(); };

  // --- operaciones
  function varita(x, y, restar) {
    guardarHist();
    const act = mascaras[S.canal], otra = mascaras[S.canal === "paredes" ? "suelo" : "paredes"];
    const o = (y * W + x) * 3, r0 = suave[o], g0 = suave[o + 1], b0 = suave[o + 2];
    const tol2 = (S.tol * 2.2) ** 2;
    const parecido = (i) => { const k = i * 3, dr = suave[k] - r0, dg = suave[k + 1] - g0, db = suave[k + 2] - b0; return dr * dr + dg * dg + db * db <= tol2; };
    const aplicar = (i) => { if (restar) act[i] = 0; else { act[i] = 1; otra[i] = 0; } };
    if (!S.contiguo) { for (let i = 0; i < W * H; i++) if (parecido(i)) aplicar(i); repintarCapa(); return; }
    const visto = new Uint8Array(W * H);
    const pila = new Int32Array(W * H);
    let n = 0; pila[n++] = y * W + x; visto[y * W + x] = 1;
    while (n) {
      const i = pila[--n];
      aplicar(i);
      const cx = i % W, cy = (i - cx) / W;
      const vec = [cy * W + ((cx + 1) % W), cy * W + ((cx - 1 + W) % W), cy > 0 ? i - W : -1, cy < H - 1 ? i + W : -1];
      for (const j of vec) if (j >= 0 && !visto[j]) { visto[j] = 1; if (parecido(j)) pila[n++] = j; }
    }
    repintarCapa();
  }
  function pincel(x0, y0, x1, y1, borrar) {
    const act = mascaras[S.canal], otra = mascaras[S.canal === "paredes" ? "suelo" : "paredes"];
    const r = S.tam / 2, pasos = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / Math.max(1, r / 3)));
    for (let s = 0; s <= pasos; s++) {
      const cx = x0 + ((x1 - x0) * s) / pasos, cy = y0 + ((y1 - y0) * s) / pasos;
      for (let dy = -Math.ceil(r); dy <= r; dy++) {
        const yy = Math.round(cy + dy); if (yy < 0 || yy >= H) continue;
        const ancho = Math.sqrt(Math.max(0, r * r - dy * dy));
        for (let dx = -Math.floor(ancho); dx <= ancho; dx++) {
          const i = yy * W + ((Math.round(cx + dx) % W) + W) % W;
          if (borrar) act[i] = 0; else { act[i] = 1; otra[i] = 0; }
        }
      }
    }
    repintarCapa();
  }

  // --- interfaz
  const lienzo = h("canvas", { "aria-label": "Foto con máscara" });
  const ctx = lienzo.getContext("2d");
  const zona = h("div", { class: "lienzo" }, lienzo);
  const bHerr = {}, rCanal = {};
  let bBorrar = null;
  // Marco y cursor del pincel: tokens (se releen al cambiar de tema). El cursor lleva halo: se ve sobre cualquier foto.
  let P = null;
  const pal = () => (P ??= coloresTema({ marco: "--c-borde-2", cursor: "--c-texto", halo: "--vidrio-denso" }));
  const dejarTema = alCambiarTema(() => { P = null; marcar(); });
  const herrBtn = (id, ic, txt, tecla) => (bHerr[id] = h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--s", "aria-pressed": "false", onclick: () => fijarHerr(id), title: `${txt} (${tecla})` }, icono(ic, 16), txt, h("kbd", { text: tecla })));
  const canalRadio = (id, txt, tecla) => {
    const r = (rCanal[id] = h("input", { type: "radio", name: "canal-mascara", value: id }));
    r.onchange = () => { if (r.checked) fijarCanal(id); };
    return h("label", { class: `canal canal-${id}`, title: `${txt} (${tecla})` }, r, h("span", {}, h("i", { "aria-hidden": "true" }), txt));
  };
  const rango = (min, max, val, fn, etq) => { const r = deslizador({ min, max, value: val, "aria-label": etq }); const out = h("b", { text: val }); r.oninput = () => { out.textContent = r.value; fn(Number(r.value)); }; return h("label", {}, etq, r, out); };
  const cerrar = async (guardar) => {
    if (!guardar && S.cambiado && !(await confirmar("Descartar cambios", "Hay cambios sin guardar en la máscara.", "Descartar"))) return;
    if (guardar) await guardarMascara();
    cancelAnimationFrame(raf); ro?.disconnect(); dejarTema(); removeEventListener("keydown", teclas, true); editor.remove();
  };
  const titulo = `Máscara · ${textoDe(p.nombre) || p.id}${v ? ` · variante ${v.estilo ?? ""} ${v.momento ?? ""}` : ""}`;
  const editor = h("div", { class: "editor-mascara", role: "dialog", "aria-label": titulo },
    h("div", { class: "cab c8-vidrio c8-vidrio--barra" }, h("h2", { text: titulo }),
      h("div", { class: "c8-segmentado", role: "radiogroup", "aria-label": "Superficie" }, canalRadio("paredes", "Paredes", "1"), canalRadio("suelo", "Suelo", "2")),
      h("div", { class: "relleno" }),
      h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--icono", title: "Deshacer (Ctrl+Z)", "aria-label": "Deshacer", onclick: deshacer }, icono("deshacer", 16)),
      h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--icono", title: "Rehacer (Ctrl+Shift+Z)", "aria-label": "Rehacer", onclick: rehacer }, icono("rehacer", 16)),
      h("button", { type: "button", class: "c8-boton c8-boton--secundario", onclick: () => cerrar(false) }, "Cancelar"),
      h("button", { type: "button", class: "c8-boton c8-boton--primario", onclick: () => cerrar(true) }, "Guardar máscara")),
    zona,
    h("div", { class: "barra c8-vidrio c8-vidrio--barra" },
      herrBtn("varita", "varita", "Varita", "W"), herrBtn("pincel", "pincel", "Pincel", "B"), herrBtn("goma", "goma", "Goma", "E"),
      rango(4, 80, 84 - S.tol, (x) => { S.tol = 84 - x; }, "Precisión"), // más precisión = la varita coge colores más parecidos
      (() => { const c = h("input", { type: "checkbox", checked: true }); c.onchange = () => { S.contiguo = c.checked; }; return h("label", { class: "check" }, c, "Solo zona continua"); })(),
      rango(2, 160, S.tam, (x) => { S.tam = x; marcar(); }, "Pincel"),
      rango(10, 90, Math.round(S.opac * 100), (x) => { S.opac = x / 100; marcar(); }, "Opacidad"),
      (bBorrar = h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--s", onclick: () => { guardarHist(); mascaras[S.canal].fill(0); repintarCapa(); } }, "Borrar paredes")),
      h("span", { class: "ayuda-teclas" }, h("kbd", { text: "Alt" }), "+clic resta · rueda = zoom · ", h("kbd", { text: "Espacio" }), "+arrastrar = mover")));
  document.body.append(editor);
  function fijarHerr(id) { S.herr = id; for (const [k, b] of Object.entries(bHerr)) b.setAttribute("aria-pressed", String(k === id)); marcar(); }
  function fijarCanal(id) {
    S.canal = id;
    for (const [k, r] of Object.entries(rCanal)) r.checked = k === id;
    window.cre8Tema?.segmentados(editor);
    if (bBorrar) bBorrar.textContent = id === "paredes" ? "Borrar paredes" : "Borrar suelo";
  }
  fijarHerr("varita"); fijarCanal("paredes");

  function ajustar() { S.esc = Math.min(ancho / W, alto / H) * 0.98; S.ox = (ancho - W * S.esc) / 2; S.oy = (alto - H * S.esc) / 2; marcar(); }
  ro = new ResizeObserver(() => {
    const r = zona.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2);
    const primera = !ancho; ancho = r.width; alto = r.height;
    lienzo.width = Math.round(ancho * dpr); lienzo.height = Math.round(alto * dpr);
    if (primera) ajustar(); marcar();
  });
  ro.observe(zona);
  function dibujar() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, ancho, alto);
    ctx.imageSmoothingEnabled = S.esc < 2;
    ctx.drawImage(base, S.ox, S.oy, W * S.esc, H * S.esc);
    ctx.globalAlpha = S.opac; ctx.drawImage(capa, S.ox, S.oy, W * S.esc, H * S.esc); ctx.globalAlpha = 1;
    const c = pal();
    ctx.strokeStyle = c.marco; ctx.lineWidth = 1; ctx.strokeRect(S.ox, S.oy, W * S.esc, H * S.esc);
    if (S.raton && S.herr !== "varita") {
      const radio = Math.max(2, (S.tam / 2) * S.esc);
      for (const [color, ancho] of [[c.halo, 3.5], [c.cursor, 1.5]]) { ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.beginPath(); ctx.arc(S.raton[0], S.raton[1], radio, 0, 7); ctx.stroke(); }
    }
  }
  (function bucle() { if (sucio) { sucio = false; dibujar(); } raf = requestAnimationFrame(bucle); })();
  repintarCapa();

  const aImagen = (sx, sy) => [Math.floor((sx - S.ox) / S.esc), Math.floor((sy - S.oy) / S.esc)];
  const pos = (e) => { const r = lienzo.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  lienzo.addEventListener("wheel", (e) => {
    e.preventDefault();
    const [sx, sy] = pos(e);
    const k = Math.exp(-e.deltaY * 0.0015), nueva = Math.max(0.1, Math.min(S.esc * k, 16)), f = nueva / S.esc;
    S.ox = sx - (sx - S.ox) * f; S.oy = sy - (sy - S.oy) * f; S.esc = nueva; marcar();
  }, { passive: false });
  lienzo.addEventListener("pointerdown", (e) => {
    lienzo.setPointerCapture(e.pointerId);
    const [sx, sy] = pos(e);
    if (S.espacio || e.button === 1 || e.button === 2) { S.pinta = { pan: true, sx, sy, ox: S.ox, oy: S.oy }; return; }
    const [x, y] = aImagen(sx, sy);
    if (y < 0 || y >= H) return;
    const xx = ((x % W) + W) % W;
    if (S.herr === "varita") varita(xx, y, e.altKey);
    else { guardarHist(); S.pinta = { x: xx, y }; pincel(xx, y, xx, y, S.herr === "goma"); }
  });
  lienzo.addEventListener("pointermove", (e) => {
    const [sx, sy] = pos(e);
    S.raton = [sx, sy];
    const A = S.pinta;
    if (A?.pan) { S.ox = A.ox + sx - A.sx; S.oy = A.oy + sy - A.sy; marcar(); return; }
    if (A) { const [x, y] = aImagen(sx, sy); pincel(A.x, A.y, x, y, S.herr === "goma"); A.x = x; A.y = y; return; }
    marcar();
  });
  const fin = () => { S.pinta = null; };
  lienzo.addEventListener("pointerup", fin); lienzo.addEventListener("pointercancel", fin);
  lienzo.addEventListener("pointerleave", () => { S.raton = null; marcar(); });
  lienzo.addEventListener("contextmenu", (e) => e.preventDefault());
  lienzo.style.cursor = "crosshair";

  function teclas(e) {
    if (document.querySelector("dialog[open]")) return;
    const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    let ok = true;
    if (mod && k === "z") e.shiftKey ? rehacer() : deshacer();
    else if (mod && k === "y") rehacer();
    else if (mod && k === "s") cerrar(true);
    else if (mod) ok = false;
    else if (!app.atajos && e.key.length === 1) ok = false; // atajos de una tecla desactivados
    else if (k === "w") fijarHerr("varita");
    else if (k === "b") fijarHerr("pincel");
    else if (k === "e") fijarHerr("goma");
    else if (k === "1") fijarCanal("paredes");
    else if (k === "2") fijarCanal("suelo");
    else if (k === "0") ajustar();
    else if (e.key === "Escape") cerrar(false);
    else if (e.key === " ") { if (!S.espacio) { S.espacio = true; lienzo.style.cursor = "grab"; addEventListener("keyup", (ev) => { if (ev.key === " ") { S.espacio = false; lienzo.style.cursor = "crosshair"; } }, { once: true }); } }
    else if (e.key === "[") { S.tam = Math.max(2, S.tam - 4); marcar(); }
    else if (e.key === "]") { S.tam = Math.min(160, S.tam + 4); marcar(); }
    else ok = false;
    if (ok) { e.preventDefault(); e.stopPropagation(); }
  }
  addEventListener("keydown", teclas, true);

  async function guardarMascara() {
    const c = new OffscreenCanvas(W, H), g = c.getContext("2d");
    const d = g.createImageData(W, H), a = d.data;
    for (let i = 0, j = 0; i < W * H; i++, j += 4) { a[j] = mascaras.paredes[i] ? 255 : 0; a[j + 1] = mascaras.suelo[i] ? 255 : 0; a[j + 2] = 0; a[j + 3] = 255; }
    g.putImageData(d, 0, 0);
    const png = await c.convertToBlob({ type: "image/png" });
    const nombre = v ? `${pid}-${v.estilo ?? "base"}-${v.momento ?? "dia"}` : pid;
    const ruta = rutaLibre(`panos/mascaras/${nombre}`, "png");
    await guardarArchivo(ruta, png);
    cambiar(() => {
      const q = pano(pid);
      if (vi != null) q.variantes[vi].mascara = ruta; else q.mascara = ruta;
    });
    const pp = mascaras.paredes.reduce((s, x) => s + x, 0) / (W * H), ps = mascaras.suelo.reduce((s, x) => s + x, 0) / (W * H);
    toast(`Máscara guardada (paredes ${Math.round(pp * 100)} %, suelo ${Math.round(ps * 100)} %)`, "ok");
    emitir("mascara");
  }
}
