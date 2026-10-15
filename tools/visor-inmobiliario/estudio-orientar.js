// Orientación y notas: giro (yaw) de cada foto con «Alinear con una puerta», vista inicial y notas (puntos de información).
// Alinear funciona también sin plano (E7): usa la posición que tendrá cada foto en el recorrido publicado (en fila).
import { redondear, norm180, norm360, rumboDe } from "./estudio-util.js";
import { app, h, icono, cambiar, emitir, on, toast, confirmar, guardarArchivo, urlDe, rutaLibre, elegirArchivos,
  textoDe, pano, calcularEnlaces, posiciones, VIDRIO, coloresTema, fuenteLienzo, alCambiarTema, deslizador, conAlfa } from "./estudio-nucleo.js";
import { campoTexto, campo } from "./estudio-campos.js";

const S = { objetivo: null, modoPunto: false, abierto: null };
let raiz = null;
const nombreDe = (p) => textoDe(p?.nombre) || p?.id || "";

function actual() { return pano(app.nodo) ?? app.tour.panoramas[0]; }

export function girar(delta) {
  const p = actual(); if (!p) return;
  cambiar((t) => { const q = pano(p.id); q.yaw = redondear(norm180((q.yaw ?? 0) + delta), 1); revisada(t, q); }, { clave: "yaw:" + p.id, tipo: "yaw", render: false });
  pintarYaw();
}
function fijarYaw(v) {
  const p = actual(); if (!p) return;
  cambiar((t) => { const q = pano(p.id); q.yaw = redondear(norm180(v), 1); revisada(t, q); }, { clave: "yaw:" + p.id, tipo: "yaw", render: false });
  pintarYaw();
}
const revisada = (t, q) => { const m = t._estudio.meta[q.imagen]; if (m?.brujula != null) m.brujulaRevisada = true; };
function yawLocalVista() {
  const v = app.vista, p = actual();
  if (!v || !p || v.nodo !== p.id) return null;
  if (Number.isFinite(v.yawLocal)) return v.yawLocal;
  if (Number.isFinite(v.rumbo)) return norm180(v.rumbo - (p.yaw ?? 0));
  return null;
}
export function alinear() {
  const p = actual(), x = pano(S.objetivo);
  if (!p || !x) return toast("Elige primero hacia qué estancia estás mirando", "aviso");
  const yl = yawLocalVista();
  if (yl == null) return toast("La vista previa se está cargando. Espera un segundo y pulsa Alinear otra vez.", "info", 4000);
  // Posiciones del recorrido publicado: las del plano o, sin plano, la fila en el orden de la lista.
  const pos = posiciones();
  const [px, pz] = pos.get(p.id), [xx, xz] = pos.get(x.id);
  const esperado = rumboDe(xx - px, xz - pz);
  // yaw = rumboEsperadoHaciaX − (rumboVistaActual − yawActual) = rumboEsperado − yawLocal
  fijarYaw(esperado - yl);
  const inf = raiz?.querySelector("#info-alinear");
  if (inf) inf.textContent = `Hecho: la flecha hacia ${nombreDe(x)} ya coincide con la puerta.`;
  toast(`Orientación ajustada: la flecha hacia ${nombreDe(x)} coincide con la puerta.`, "ok", 3500);
}
function usarVistaInicial() {
  const p = actual(), v = app.vista;
  if (!p || !v || v.nodo !== p.id || !Number.isFinite(v.rumbo)) return toast("La vista previa se está cargando. Espera un segundo y vuelve a pulsar.", "info");
  cambiar(() => { pano(p.id).rumbo_inicial = redondear(norm360(v.rumbo), 1); }, { tipo: "local" });
  toast("Vista inicial guardada para esta estancia", "ok");
  pintar();
}

function alternarModoPunto(forzar) {
  S.modoPunto = forzar ?? !S.modoPunto;
  const m = document.getElementById("vista-modo");
  if (m) { m.hidden = !S.modoPunto; m.textContent = "Toca la vista previa donde quieras la nota · Esc para cancelar"; }
  pintarPie();
  raiz?.querySelector("#btn-punto")?.setAttribute("aria-pressed", String(S.modoPunto));
}
on("clic", (d) => {
  if (!S.modoPunto || app.seccion !== "orientacion") return;
  const p = pano(d.nodo) ?? actual();
  if (!p) return;
  let yaw = d.yawLocal, pitch = d.pitchLocal;
  if (!Number.isFinite(yaw) && Number.isFinite(d.rumbo)) yaw = norm180(d.rumbo - (p.yaw ?? 0));
  if (!Number.isFinite(pitch)) pitch = d.cabeceo ?? 0;
  if (!Number.isFinite(yaw)) return toast("El visor no envió la posición del clic", "error");
  cambiar(() => { const q = pano(p.id); q.puntos ??= []; q.puntos.push({ yaw: redondear(yaw, 1), pitch: redondear(pitch, 1), titulo: { es: "Nueva nota" } }); });
  S.abierto = `${p.id}:${pano(p.id).puntos.length - 1}`;
  alternarModoPunto(false);
  pintar();
  requestAnimationFrame(() => { const i = raiz?.querySelector(".punto[open] input"); i?.focus(); i?.select(); });
});

// ------------------------------------------------------------------ interfaz
function render(cont) {
  raiz = h("section", { class: "seccion" });
  cont.append(raiz);
  pintar();
}
function pintar() {
  if (!raiz) return;
  const t = app.tour, p = actual();
  if (!p) {
    raiz.replaceChildren(h("div", { class: "cab-seccion" }, h("div", {}, h("h1", { text: "Orientación y notas" }))),
      h("div", { class: `vacio-grande ${VIDRIO}` }, icono("orientar", 40), h("h3", { text: "Primero añade fotos" }), h("p", { text: "Cuando tengas fotos podrás ajustar hacia dónde mira cada una y añadir notas sobre la vista previa." }),
        h("button", { type: "button", class: "c8-boton c8-boton--primario", onclick: () => emitir("ir", { seccion: "fotos" }) }, "Ir a Fotos 360")));
    return;
  }
  const i = t.panoramas.indexOf(p);
  const { vecinos } = calcularEnlaces();
  const cand = (vecinos.get(p.id) ?? []).map(pano).filter(Boolean);
  if (!cand.some((x) => x.id === S.objetivo)) S.objetivo = cand[0]?.id ?? null;
  const objetivo = pano(S.objetivo);

  const nav = h("div", { class: `tarjeta ${VIDRIO} nodo-actual` },
    h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--icono", title: "Anterior (B)", "aria-label": "Estancia anterior", onclick: () => saltar(-1) }, icono("izquierda", 18)),
    h("img", { src: urlDe(p.miniatura), alt: "" }),
    h("div", { class: "estirar" }, h("div", { class: "texto-sec", text: `Estancia ${i + 1} de ${t.panoramas.length}` }), h("b", { text: nombreDe(p) })),
    h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--icono", title: "Siguiente (N)", "aria-label": "Estancia siguiente", onclick: () => saltar(1) }, icono("derecha", 18)));

  const slider = deslizador({ min: -180, max: 180, step: 1, value: p.yaw ?? 0, "aria-label": "Girar la foto", "aria-valuetext": `${Math.round(p.yaw ?? 0)} grados`, id: "yaw-slider" });
  slider.oninput = () => fijarYaw(Number(slider.value));
  const orient = h("div", { class: `tarjeta ${VIDRIO}` },
    h("h2", { class: "sub", text: "Girar la foto" }),
    h("p", { class: "texto-sec", text: "Las flechas del suelo (y el radar) tienen que coincidir con las puertas reales. Lo más fácil es «Alinear con una puerta», abajo; si no, gira la foto a mano." }),
    h("div", { class: "yaw-ctl" },
      ...[[-10, "Shift + ["], [-1, "["]].map(([d, k]) => h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", onclick: () => girar(d), title: k }, `${d < 0 ? "−" : "+"}${Math.abs(d)}°`)),
      h("span", { class: "yaw-valor", id: "yaw-valor", text: `${Math.round(p.yaw ?? 0)}°` }),
      ...[[1, "]"], [10, "Shift + ]"]].map(([d, k]) => h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", onclick: () => girar(d), title: k }, `+${d}°`))),
    h("div", { class: "pila" }, slider,
      h("div", { class: "texto-pie" }, "Con el teclado: 1° con ", h("kbd", { text: "[" }), h("kbd", { text: "]" }), ", 10° con ", h("kbd", { text: "Shift" }), ".")));

  const sel = h("select", { "aria-label": "Estancia hacia la que miras", disabled: !cand.length },
    ...(cand.length ? cand.map((x) => h("option", { value: x.id, text: nombreDe(x), selected: x.id === S.objetivo })) : [h("option", { text: "No hay estancias conectadas" })]));
  sel.onchange = () => { S.objetivo = sel.value; dibujarMini(); actualizarAlinear(); };
  const asistente = h("div", { class: `tarjeta ${VIDRIO}` },
    h("h2", { class: "sub", text: "Alinear con una puerta" }),
    h("ol", { class: "pasos-asistente" },
      h("li", {}, h("div", { class: "campo" }, h("span", { text: "¿Hacia qué estancia vas a mirar?" }), sel)),
      h("li", {}, h("div", {}, "En la vista previa, gira la cámara hasta que la ", h("b", { text: `puerta o el paso hacia ${objetivo ? nombreDe(objetivo) : "esa estancia"}` }), " quede justo en el centro.")),
      h("li", {}, h("div", { class: "fila" },
        h("button", { type: "button", class: "c8-boton c8-boton--primario", id: "btn-alinear", onclick: alinear }, icono("orientar", 16), "Alinear", app.atajos ? h("kbd", { text: "A" }) : null),
        h("span", { class: "texto-pie", id: "info-alinear", role: "status" })))),
    h("canvas", { id: "mini-orientar", class: "mini-orientar", width: 520, height: 220, hidden: !cand.length, "aria-hidden": "true" }));

  const inicial = h("div", { class: `tarjeta ${VIDRIO}` },
    h("h2", { class: "sub", text: "Vista inicial" }),
    h("div", { class: "fila" },
      h("span", { class: "suave estirar" }, p.rumbo_inicial != null ? "Al entrar en esta estancia se verá la vista que guardaste." : "Al entrar se mira hacia donde venía el visitante (o al centro de la foto)."),
      h("button", { type: "button", class: "c8-boton c8-boton--secundario", onclick: usarVistaInicial }, icono("ojo", 16), "Usar la vista actual"),
      p.rumbo_inicial != null ? h("button", { type: "button", class: "c8-boton c8-boton--fantasma", onclick: () => { cambiar(() => { delete pano(p.id).rumbo_inicial; }, { tipo: "local" }); pintar(); } }, "Quitar") : null));

  const puntos = h("div", { class: `tarjeta ${VIDRIO}` },
    h("div", { class: "fila cab-tarjeta" },
      h("h2", { class: "sub estirar", text: `Notas (${p.puntos?.length ?? 0})` }),
      h("button", { type: "button", class: `c8-boton ${S.modoPunto ? "c8-boton--secundario" : "c8-boton--primario"}`, "aria-pressed": String(S.modoPunto), id: "btn-punto", onclick: () => alternarModoPunto() }, icono("info", 16), S.modoPunto ? "Toca la vista previa…" : "Añadir nota", app.atajos ? h("kbd", { text: "P" }) : null)),
    p.puntos?.length ? h("div", { class: "lista-puntos" }, p.puntos.map((pt, j) => fichaPunto(p.id, j))) :
      h("p", { class: "suave", text: "Destaca lo que vende: ventanales, calidades, electrodomésticos, vistas… Pulsa «Añadir nota» y toca ese lugar en la vista previa." }));

  raiz.replaceChildren(
    h("div", { class: "cab-seccion" }, h("div", {}, h("h1", { text: "Orientación y notas" }), h("p", { text: "Que las flechas del suelo coincidan con las puertas, la vista con la que se entra en cada estancia y notas sobre lo que vende." }))),
    nav, orient, asistente, inicial, puntos);
  actualizarAlinear();
  dibujarMini();
  pintarPie();
}
/** Estado del botón Alinear: activo solo cuando la vista previa ya muestra esta foto (P4). Un único mensaje, sin repetir. */
function actualizarAlinear() {
  const b = raiz?.querySelector("#btn-alinear"), inf = raiz?.querySelector("#info-alinear");
  if (!b || !inf) return;
  const p = actual(), x = pano(S.objetivo);
  const lista = yawLocalVista() != null;
  let msg = "";
  if (!x) msg = "Esta foto no está conectada con ninguna otra.";
  else if (!lista) msg = "La vista previa se está cargando. Espera un segundo y pulsa Alinear otra vez.";
  else msg = `Cuando la puerta hacia ${nombreDe(x)} esté en el centro, pulsa Alinear.`;
  const activo = !!x && lista;
  b.disabled = !activo;
  if (inf.textContent !== msg && !inf.textContent.startsWith("Hecho:")) inf.textContent = msg;
}
function pintarYaw() {
  const p = actual(); if (!p || !raiz) return;
  const v = raiz.querySelector("#yaw-valor"); if (v) v.textContent = `${Math.round(p.yaw ?? 0)}°`;
  const s = raiz.querySelector("#yaw-slider"); if (s) { if (document.activeElement !== s) s.value = p.yaw ?? 0; s.setAttribute("aria-valuetext", `${Math.round(p.yaw ?? 0)} grados`); window.cre8Tema?.deslizador(s); }
  dibujarMini(); pintarPie();
}
// Colores del mini-plano: tokens de tema.css, releídos al cambiar de tema o de talla («cre8:tema»).
let PAL = null;
function pal() {
  if (PAL) return PAL;
  PAL = coloresTema({ acento: "--c-acento", acentoTexto: "--c-acento-texto", texto: "--c-texto", texto2: "--c-texto-2", texto3: "--c-texto-3", borde: "--c-borde-2", info: "--c-info" });
  PAL.claro = document.documentElement.dataset.tema === "claro";
  PAL.f = { rotulo: fuenteLienzo(600, 0.8), pie: fuenteLienzo(400, 0.75) };
  return PAL;
}
alCambiarTema(() => { PAL = null; dibujarMini(); });
function dibujarMini() {
  const c = raiz?.querySelector("#mini-orientar");
  const p = actual();
  if (!c || !p) return;
  const P = pal(), linea = P.claro ? P.acentoTexto : P.acento;
  const g = c.getContext("2d");
  const W = c.width, H = c.height;
  g.clearRect(0, 0, W, H);
  const { vecinos } = calcularEnlaces();
  const pos = posiciones();
  const [px, pz] = pos.get(p.id);
  const vs = (vecinos.get(p.id) ?? []).map(pano).filter(Boolean);
  const R = Math.max(2, ...vs.map((x) => Math.hypot(pos.get(x.id)[0] - px, pos.get(x.id)[1] - pz)));
  const esc = (Math.min(W, H) / 2 - 34) / R;
  const cx = W / 2, cy = H / 2;
  const Pp = (x, z) => [cx + (x - px) * esc, cy + (z - pz) * esc];
  g.font = P.f.rotulo; g.textAlign = "center"; g.textBaseline = "middle";
  for (const v of vs) {
    const [x, y] = Pp(...pos.get(v.id));
    const obj = v.id === S.objetivo;
    g.strokeStyle = obj ? linea : P.borde; g.lineWidth = obj ? 2.5 : 1.5; g.setLineDash(obj ? [] : [5, 4]);
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke(); g.setLineDash([]);
    g.fillStyle = obj ? P.acento : P.texto3; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill();
    g.fillStyle = obj ? P.acentoTexto : P.texto2; g.fillText(nombreDe(v), x, y - 16);
  }
  // vista actual (cono) y centro de la foto (yaw)
  const yl = yawLocalVista();
  if (yl != null) {
    const r = ((yl + (p.yaw ?? 0)) * Math.PI) / 180, ap = ((app.vista?.fov ?? 75) * Math.PI) / 360;
    const grad = g.createRadialGradient(cx, cy, 4, cx, cy, 70);
    grad.addColorStop(0, conAlfa(P.info, 0.55)); grad.addColorStop(1, conAlfa(P.info, 0));
    g.fillStyle = grad; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 70, r - Math.PI / 2 - ap, r - Math.PI / 2 + ap); g.closePath(); g.fill();
  }
  const yaw = ((p.yaw ?? 0) * Math.PI) / 180;
  g.strokeStyle = P.texto; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(yaw) * 26, cy - Math.cos(yaw) * 26); g.stroke();
  g.fillStyle = P.acento; g.beginPath(); g.arc(cx, cy, 9, 0, 7); g.fill();
  g.textAlign = "left"; g.fillStyle = P.texto2; g.font = P.f.pie;
  g.fillText("Azul: lo que ves ahora · Línea: centro de la foto", 10, H - 12);
}

function fichaPunto(id, j) {
  const p = pano(id), pt = p.puntos[j];
  const clave = `${id}:${j}`;
  const get = () => pano(id)?.puntos?.[j];
  const det = h("details", { class: "punto", open: S.abierto === clave });
  det.addEventListener("toggle", () => { if (det.open) S.abierto = clave; });
  const subirImg = async () => {
    const [f] = await elegirArchivos({ aceptar: "image/*" });
    if (!f) return;
    let blob = f;
    try {
      const bmp = await createImageBitmap(f);
      const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      const cv = new OffscreenCanvas(Math.round(bmp.width * k), Math.round(bmp.height * k));
      cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height); bmp.close();
      blob = await cv.convertToBlob({ type: "image/jpeg", quality: 0.85 });
    } catch {}
    const ruta = rutaLibre(`fotos/${id}-punto-${j + 1}`, "jpg");
    await guardarArchivo(ruta, blob);
    cambiar(() => { get().imagen = ruta; });
    S.abierto = clave; pintar();
  };
  det.append(
    h("summary", {}, h("span", { class: "i", text: "i" }), h("span", { class: "nom", text: textoDe(pt.titulo) || "Sin título" }),
      h("span", { class: "texto-pie", text: `${Math.round(pt.yaw)}° · ${Math.round(pt.pitch ?? 0)}°` })),
    h("div", { class: "cuerpo" },
      campoTexto(get, "titulo", { etiqueta: "Título", tipo: "datos", alCambiar: (v) => { det.querySelector("summary .nom").textContent = v || "Sin título"; } }),
      campoTexto(get, "texto", { etiqueta: "Texto", multilinea: true, tipo: "datos", placeholder: "Ej.: Ventanal orientado al sur con carpintería de aluminio y rotura de puente térmico." }),
      h("div", { class: "fila" },
        campo(get, "enlace", { etiqueta: "Enlace (opcional)", tipo: "url", placeholder: "https://…" }),
        campo(get, "video", { etiqueta: "Vídeo (opcional)", tipo: "url", placeholder: "https://youtube.com/…" })),
      h("div", { class: "fila" },
        pt.imagen ? h("img", { src: urlDe(pt.imagen), alt: "" }) : null,
        h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", onclick: subirImg }, icono("subir", 14), pt.imagen ? "Cambiar imagen" : "Añadir imagen"),
        pt.imagen ? h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--s", onclick: () => { cambiar(() => { delete get().imagen; }); S.abierto = clave; pintar(); } }, "Quitar imagen") : null,
        h("div", { class: "relleno" }),
        h("button", { type: "button", class: "c8-boton c8-boton--peligro c8-boton--s", onclick: async () => {
          if (await confirmar("Eliminar nota", "¿Eliminar esta nota?")) { cambiar(() => { pano(id).puntos.splice(j, 1); }); pintar(); }
        } }, icono("basura", 14), "Eliminar"))));
  return det;
}

/** Pie de la vista previa: solo «Nota aquí» (el giro está en su tarjeta, E10). */
function pintarPie() {
  const pie = document.getElementById("vista-pie");
  if (!pie || app.seccion !== "orientacion") return;
  const p = actual();
  if (!p) { pie.replaceChildren(); return; }
  pie.replaceChildren(
    h("span", {}, `${nombreDe(p)} · girada `, h("b", { text: `${Math.round(p.yaw ?? 0)}°` })),
    h("div", { class: "relleno" }),
    h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", "aria-pressed": String(S.modoPunto), onclick: () => alternarModoPunto() }, icono("info", 14), S.modoPunto ? "Cancelar nota" : "Nota aquí"));
}
function saltar(d) {
  const ps = app.tour.panoramas;
  if (!ps.length) return;
  const i = ps.indexOf(actual());
  app.nodo = ps[(i + d + ps.length) % ps.length].id;
  emitir("nodo", {});
}

export const seccionOrientar = {
  id: "orientacion", titulo: "Orientación y notas", corto: "Orientación", icono: "orientar",
  resumen: () => {
    const ps = app.tour.panoramas;
    const n = ps.reduce((s, p) => s + (p.puntos?.length ?? 0), 0);
    return { texto: n ? `${n} ${n === 1 ? "nota" : "notas"}` : "Flechas y notas" };
  },
  render,
  actualizar: () => { if (!raiz?.contains(document.activeElement) || document.activeElement?.type === "range" || document.activeElement?.tagName === "BUTTON") pintar(); else pintarYaw(); },
  alCambiarNodo: () => { S.abierto = null; const inf = raiz?.querySelector("#info-alinear"); if (inf) inf.textContent = ""; pintar(); },
  pieVista: () => pintarPie(),
  salir: () => { alternarModoPunto(false); raiz = null; },
  teclas: (e) => {
    if (e.key === "[" || e.key === "{") { girar(e.shiftKey || e.key === "{" ? -10 : -1); return true; }
    if (e.key === "]" || e.key === "}") { girar(e.shiftKey || e.key === "}" ? 10 : 1); return true; }
    const k = e.key.toLowerCase();
    if (k === "a") { alinear(); return true; }
    if (k === "p") { alternarModoPunto(); return true; }
    if (k === "n") { saltar(1); return true; }
    if (k === "b") { saltar(-1); return true; }
    if (e.key === "Escape" && S.modoPunto) { alternarModoPunto(false); return true; }
    return false;
  },
};
on("vista", () => {
  if (!raiz) return;
  actualizarAlinear();
  dibujarMini();
});
