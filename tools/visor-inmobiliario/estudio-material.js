// Paso 2 · Material del proyecto: lo que aportan arquitectos y renderistas (planos PDF/DXF, renders 360 y fijos,
// modelo 3D GLB o splat, documentos). Todo se guarda en el proyecto y entra en el ZIP.
import { slug, dimensiones, redondear } from "./estudio-util.js";
import { app, h, icono, cambiar, emitir, on, toast, dialogo, confirmar, guardarArchivo, urlDe, rutaLibre, elegirArchivos,
  textoDe, pano, fmtMB } from "./estudio-nucleo.js";
import { campoTexto, campo } from "./estudio-campos.js";
import { anadirFotos } from "./estudio-fotos.js";
import { subirVariantes, nombreEstilo } from "./estudio-variantes.js";
import { ponerImagenPlano } from "./estudio-plano.js";
import { leerDxf, sugerirUnidades, extension, aMetros, renderizar, FACTOR } from "./estudio-dxf.js";
import { bloqueMusica } from "./estudio-musica.js";

const TIPOS_DOC = [["plano", "Plano"], ["render", "Render"], ["modelo", "Modelo 3D"], ["memoria", "Memoria de calidades"], ["licencia", "Licencia / cédula"], ["nota", "Nota simple"], ["otro", "Otro"]];
let raiz = null;
const nombreDe = (p) => textoDe(p?.nombre) || p?.id || "";
const ext = (n) => (n.split(".").pop() || "").toLowerCase();

async function guardarDocumento(f, tipo, { publico = false, nombre } = {}) {
  const ruta = rutaLibre(`docs/${slug(f.name.replace(/\.[^.]+$/, ""))}`, ext(f.name) || "bin");
  await guardarArchivo(ruta, f);
  cambiar((t) => { t.documentacion ??= []; t.documentacion.push({ nombre: nombre ?? f.name.replace(/\.[^.]+$/, ""), archivo: ruta, tipo, publico }); }, { tipo: "datos" });
  return ruta;
}

// ------------------------------------------------------------------ planos de arquitecto
export async function importarPlanoArquitecto(f, plantaId = app.planta) {
  const e = ext(f.name);
  if (e === "dwg") {
    return dialogo({ titulo: "DWG no se puede leer en el navegador", texto: "Pide al arquitecto el plano exportado a DXF (AutoCAD: Guardar como → DXF; Revit/ArchiCAD: Exportar → DXF) o a PDF, y súbelo aquí.", botones: [{ texto: "Entendido", primario: true }] });
  }
  if (e === "pdf" || f.type === "application/pdf") return importarPdf(f, plantaId);
  if (e === "dxf") return importarDxf(f, plantaId);
  if (/^image\//.test(f.type) || /^(png|jpe?g|webp|svg)$/.test(e)) return ponerImagenPlano(plantaId, f);
  toast("Formato de plano no reconocido (usa PDF, DXF, PNG o JPG)", "aviso");
}

let pdfjs = null;
async function cargarPdfjs() {
  if (pdfjs) return pdfjs;
  pdfjs = await import("./vendor/pdfjs/pdf.min.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdfjs/pdf.worker.min.mjs", import.meta.url).href;
  return pdfjs;
}
async function importarPdf(f, plantaId) {
  const capa = cargando("Leyendo el PDF…");
  try {
    const lib = await cargarPdfjs();
    const doc = await lib.getDocument({ data: new Uint8Array(await f.arrayBuffer()), standardFontDataUrl: new URL("./vendor/pdfjs/standard_fonts/", import.meta.url).href }).promise;
    let num = 1;
    capa.remove();
    if (doc.numPages > 1) {
      // Miniaturas de las páginas para elegir
      const cont = h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "8px", maxHeight: "50vh", overflow: "auto" } });
      let elegida = 1;
      const botones = [];
      for (let i = 1; i <= Math.min(doc.numPages, 24); i++) {
        const pg = await doc.getPage(i);
        const vp = pg.getViewport({ scale: 1 });
        const k = 160 / Math.max(vp.width, vp.height);
        const c = h("canvas", { width: Math.round(vp.width * k), height: Math.round(vp.height * k), style: { width: "100%", background: "#fff", borderRadius: "4px" } });
        await pg.render({ canvasContext: c.getContext("2d"), viewport: pg.getViewport({ scale: k }) }).promise;
        const b = h("button", { class: "btn", style: { flexDirection: "column", padding: "6px", height: "auto" }, "aria-pressed": String(i === 1), onclick: () => { elegida = i; botones.forEach((x, j) => x.classList.toggle("activo", j + 1 === i)); } }, c, `Página ${i}`);
        if (i === 1) b.classList.add("activo");
        botones.push(b); cont.append(b);
      }
      const r = await dialogo({ titulo: "¿Qué página es el plano de esta planta?", cuerpo: cont, ancho: "min(720px, calc(100vw - 32px))",
        botones: [{ texto: "Cancelar", valor: null }, { texto: "Usar esta página", primario: true, valor: () => elegida }] });
      if (!r) return;
      num = r;
    }
    const c2 = cargando(`Convirtiendo la página ${num} en imagen…`);
    try {
      const pg = await doc.getPage(num);
      const vp = pg.getViewport({ scale: 1 });
      const k = Math.min(4000 / Math.max(vp.width, vp.height), 8);
      const v2 = pg.getViewport({ scale: k });
      const c = new OffscreenCanvas(Math.round(v2.width), Math.round(v2.height));
      const g = c.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
      await pg.render({ canvasContext: g, viewport: v2 }).promise;
      const png = await c.convertToBlob({ type: "image/png" });
      await guardarDocumento(f, "plano", { nombre: `${f.name.replace(/\.[^.]+$/, "")}${doc.numPages > 1 ? ` (pág. ${num})` : ""}` });
      await ponerImagenPlano(plantaId, png);
      emitir("ir", { seccion: "plano" });
    } finally { c2.remove(); }
  } catch (e) {
    console.error(e);
    toast(`No se pudo leer el PDF: ${e.message}`, "error", 6000);
  } finally { capa.remove(); }
}

async function importarDxf(f, plantaId) {
  let dxf;
  try { dxf = leerDxf(await f.text()); } catch (e) { return toast(`No se pudo leer el DXF: ${e.message}`, "error", 6000); }
  if (!dxf.segs.length) return toast("El DXF no tiene líneas en el espacio modelo (¿están dentro de bloques?). Explota los bloques y vuelve a exportar.", "aviso", 7000);
  const capas = [...dxf.capas.entries()].sort((a, b) => b[1] - a[1]);
  const esMuro = (c) => /mur|wall|tabiq|cerram|fachad|a-wall|partition|m-|muro/i.test(c);
  const marcadas = new Set(capas.filter(([c]) => esMuro(c)).map(([c]) => c));
  if (!marcadas.size) capas.forEach(([c]) => marcadas.add(c));
  let unidad = dxf.unidades ?? sugerirUnidades(dxf.segs);
  const selU = h("select", { "aria-label": "Unidades" }, Object.keys(FACTOR).map((u) => h("option", { value: u, text: { mm: "Milímetros", cm: "Centímetros", dm: "Decímetros", m: "Metros", in: "Pulgadas", ft: "Pies" }[u] })));
  selU.value = unidad;
  const info = h("small", { class: "tenue" });
  const prev = h("canvas", { width: 640, height: 360, style: { width: "100%", background: "#fff", borderRadius: "8px", marginTop: "10px" } });
  const usarImagen = h("input", { type: "checkbox", checked: true });
  const pintarPrev = () => {
    unidad = selU.value;
    const e = extension(dxf.segs);
    info.textContent = `${dxf.unidades ? `Unidades del archivo: ${dxf.unidades}. ` : "El archivo no indica unidades. "}Tamaño: ${redondear(e.w * FACTOR[unidad], 2)} × ${redondear(e.h * FACTOR[unidad], 2)} m`;
    const g = prev.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, prev.width, prev.height);
    const k = Math.min((prev.width - 20) / e.w, (prev.height - 20) / e.h);
    for (const s of dxf.segs) {
      const sel = marcadas.has(s.capa);
      g.strokeStyle = sel ? "#14161a" : "#c5c9cf"; g.lineWidth = sel ? 1.6 : 0.8;
      g.beginPath(); g.moveTo(10 + (s.x1 - e.x0) * k, 10 + (e.y1 - s.y1) * k); g.lineTo(10 + (s.x2 - e.x0) * k, 10 + (e.y1 - s.y2) * k); g.stroke();
    }
  };
  selU.onchange = pintarPrev;
  const listaCapas = h("div", { style: { maxHeight: "180px", overflow: "auto", display: "flex", flexDirection: "column", gap: "2px", border: "1px solid var(--borde2)", borderRadius: "8px", padding: "6px 10px" } },
    capas.map(([c, n]) => {
      const i = h("input", { type: "checkbox", checked: marcadas.has(c) });
      i.onchange = () => { i.checked ? marcadas.add(c) : marcadas.delete(c); pintarPrev(); };
      return h("label", { class: "check", style: { minHeight: "26px" } }, i, h("span", { style: { flex: 1 }, text: c }), h("span", { class: "tenue", text: `${n}` }));
    }));
  const cuerpo = h("div", {},
    h("div", { class: "fila" }, h("div", { class: "campo" }, h("span", { text: "Unidades del dibujo" }), selU), info),
    h("div", { class: "campo", style: { marginTop: "10px" } }, h("span", { text: "Capas que son muros (se dibujan en el visor)" }), listaCapas),
    prev,
    h("label", { class: "check", style: { marginTop: "8px" } }, usarImagen, "Usar el dibujo completo como imagen del plano (ya a escala)"));
  setTimeout(pintarPrev, 0);
  const ok = await dialogo({ titulo: `Importar ${f.name}`, cuerpo, ancho: "min(720px, calc(100vw - 32px))", botones: [{ texto: "Cancelar", valor: false }, { texto: "Importar plano", primario: true, valor: true }] });
  if (!ok) return;
  const factor = FACTOR[unidad];
  const e = extension(dxf.segs);
  const todos = aMetros(dxf.segs, factor, e);
  const muros = aMetros(dxf.segs.filter((s) => marcadas.has(s.capa)), factor, e);
  const anchoM = e.w * factor, altoM = e.h * factor;
  if (anchoM > 400 || anchoM < 1) {
    if (!(await confirmar("¿Unidades correctas?", `Con «${unidad}» el plano mediría ${redondear(anchoM, 1)} m de ancho. ¿Continuar?`, "Continuar"))) return;
  }
  await guardarDocumento(f, "plano");
  if (usarImagen.checked) {
    const png = await renderizar(todos, anchoM, altoM, { px: 3000, resaltar: muros });
    await ponerImagenPlano(plantaId, png, { ancho_m: anchoM, calibrado: true, silencioso: true });
  }
  cambiar((t) => {
    const pl = t.plantas.find((x) => x.id === plantaId);
    pl.muros = muros;
    if (!usarImagen.checked) { t._estudio.calibrado ??= {}; t._estudio.calibrado[plantaId] = true; }
  });
  toast(`Plano DXF importado a escala: ${redondear(anchoM, 2)} × ${redondear(altoM, 2)} m, ${muros.length} tramos de muro`, "ok", 5000);
  if (muros.length > 4000) toast("Hay muchos tramos de muro: el visor puede ir más lento. Desmarca capas de detalle (mobiliario, cotas, sombreados).", "aviso", 7000);
  emitir("ir", { seccion: "plano" });
}

// ------------------------------------------------------------------ renders 360
async function subirRenders360(archivos) {
  const fotos = archivos.filter((f) => /\.(jpe?g|png|webp)$/i.test(f.name));
  if (!fotos.length) return;
  const ps = app.tour.panoramas;
  const modo = h("select", { "aria-label": "Uso" }, h("option", { value: "nueva", text: "Estancias nuevas del recorrido (obra nueva / proyecto)" }), ps.length ? h("option", { value: "variante", text: "Variante de estilo de una foto existente" }) : null);
  const selP = h("select", { "aria-label": "Foto" }, ps.map((p) => h("option", { value: p.id, text: nombreDe(p) })));
  const estilos = [...new Set(["nordico", "mediterraneo", "industrial", "contemporaneo_minimalista", "clasico", ...(app.tour.estilos ?? []).map((e) => e.id).filter((x) => x !== "original")])];
  const selE = h("select", { "aria-label": "Estilo" }, h("option", { value: "", text: "Deducir del nombre del archivo" }), h("option", { value: "proyecto", text: "Proyecto (render del arquitecto)" }), estilos.map((id) => h("option", { value: id, text: nombreEstilo(id) })));
  const extra = h("div", { class: "fila", hidden: true, style: { marginTop: "10px" } }, h("div", { class: "campo" }, h("span", { text: "Foto real" }), selP), h("div", { class: "campo" }, h("span", { text: "Estilo" }), selE));
  modo.onchange = () => { extra.hidden = modo.value !== "variante"; };
  const r = await dialogo({ titulo: `${fotos.length} render(s) 360`, texto: "Renders equirectangulares 2:1 de Corona, V-Ray, Lumion, Enscape, D5…",
    cuerpo: h("div", {}, h("div", { class: "campo" }, h("span", { text: "¿Cómo se usan?" }), modo), extra),
    botones: [{ texto: "Cancelar", valor: null }, { texto: "Añadir", primario: true, valor: () => modo.value }] });
  if (!r) return;
  if (r === "nueva") { emitir("ir", { seccion: "fotos" }); await anadirFotos(fotos, { render: true }); }
  else {
    const est = selE.value;
    if (est === "proyecto") cambiar((t) => { if (!t.estilos.some((e) => e.id === "proyecto")) t.estilos.push({ id: "proyecto", nombre: { es: "Proyecto", en: "Design" } }); }, { render: false });
    await subirVariantes(selP.value, fotos, { estilo: est || undefined, render: true });
    app.nodo = selP.value; emitir("nodo", {});
  }
}

// ------------------------------------------------------------------ galería (renders fijos e imágenes)
async function subirGaleria(archivos, tipo = "render") {
  const fotos = archivos.filter((f) => /^image\//.test(f.type));
  for (const f of fotos) {
    let blob = f;
    try {
      const bmp = await createImageBitmap(f);
      const k = Math.min(1, 2560 / Math.max(bmp.width, bmp.height));
      const c = new OffscreenCanvas(Math.round(bmp.width * k), Math.round(bmp.height * k));
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height); bmp.close();
      blob = await c.convertToBlob({ type: "image/jpeg", quality: 0.88 });
    } catch {}
    const ruta = rutaLibre(`renders/${slug(f.name.replace(/\.[^.]+$/, ""))}`, "jpg");
    await guardarArchivo(ruta, blob);
    const titulo = f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
    const est = app.tour.panoramas.find((p) => new RegExp(slug(nombreDe(p)).split("-")[0], "i").test(slug(titulo)));
    cambiar((t) => { t.galeria ??= []; t.galeria.push({ imagen: ruta, titulo: { es: titulo.charAt(0).toUpperCase() + titulo.slice(1) }, tipo, ...(est ? { estancia: est.id } : {}) }); });
  }
  if (fotos.length) toast(`${fotos.length} imagen(es) añadidas a la galería`, "ok");
}

// ------------------------------------------------------------------ modelo 3D
async function subirModelo() {
  const [f] = await elegirArchivos({ aceptar: ".glb,.gltf,.spz,.ply,.sog,.splat,.ksplat" });
  if (!f) return;
  const e = ext(f.name);
  if (e === "gltf") {
    const txt = await f.text();
    if (/"uri"\s*:\s*"(?!data:)/.test(txt)) return toast("Este .gltf usa archivos externos (.bin, texturas). Expórtalo como GLB (un solo archivo).", "aviso", 7000);
  }
  if (f.size > 300 * 1048576) toast(`El modelo pesa ${fmtMB(f.size)}: tardará en cargar en móviles. Intenta reducirlo (Draco, texturas 2K).`, "aviso", 7000);
  const tipo = /^(glb|gltf)$/.test(e) ? "glb" : "splat";
  const ruta = rutaLibre(`modelo/${slug(f.name.replace(/\.[^.]+$/, ""))}`, e);
  await guardarArchivo(ruta, f);
  cambiar((t) => {
    const ant = t.libre ?? {};
    t.libre = { tipo, url: ruta, rotacion: ant.rotacion ?? (tipo === "splat" ? [180, 0, 0] : [0, 0, 0]), posicion: ant.posicion ?? [0, 0, 0], escala: ant.escala ?? 1,
      ...(ant.inicio ? { inicio: ant.inicio } : {}), ...(ant.colisionador ? { colisionador: ant.colisionador } : {}) };
    t.documentacion ??= [];
    t.documentacion.push({ nombre: f.name, archivo: ruta, tipo: "modelo", publico: false });
  });
  toast(tipo === "glb" ? "Modelo 3D añadido: el visor tendrá paseo libre y maqueta" : "Escaneo 3D añadido: el visor tendrá paseo libre", "ok", 4500);
}

let vista3d = null;
async function previsualizar(cont) {
  vista3d?.parar();
  const L = app.tour.libre;
  if (!L || L.tipo !== "glb" || !app.archivos.get(L.url)) {
    cont.replaceChildren(h("div", { class: "vista-vacia", style: { position: "static", minHeight: "220px", borderRadius: "8px" } },
      h("p", { text: L?.tipo === "splat" ? "Para ver el escaneo 3D, abre «Modo libre 3D» en la vista previa." : "Sin modelo" })));
    return;
  }
  cont.replaceChildren(h("div", { class: "tenue", style: { padding: "20px" }, text: "Cargando modelo…" }));
  try {
    const THREE = await import("three");
    const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
    const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
    const c = h("canvas", { style: { width: "100%", height: "300px", display: "block", borderRadius: "8px", background: "#0c0e11", touchAction: "none" } });
    cont.replaceChildren(c);
    const r = new THREE.WebGLRenderer({ canvas: c, antialias: true });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    const esc = new THREE.Scene();
    esc.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2.2));
    const dl = new THREE.DirectionalLight(0xffffff, 1.5); dl.position.set(5, 10, 4); esc.add(dl);
    const rej = new THREE.GridHelper(40, 40, 0x444b55, 0x22262c); esc.add(rej);
    const cam = new THREE.PerspectiveCamera(50, 2, 0.05, 2000);
    const ctl = new OrbitControls(cam, c);
    const gltf = await new GLTFLoader().loadAsync(urlDe(L.url));
    const modelo = gltf.scene;
    const grupo = new THREE.Group(); grupo.add(modelo); esc.add(grupo);
    const aplicar = () => {
      const l = app.tour.libre; if (!l) return;
      const [rx, ry, rz] = (l.rotacion ?? [0, 0, 0]).map((x) => (x * Math.PI) / 180);
      grupo.rotation.set(rx, ry, rz);
      grupo.scale.setScalar(l.escala ?? 1);
      grupo.position.set(...(l.posicion ?? [0, 0, 0]));
    };
    aplicar();
    const caja = new THREE.Box3().setFromObject(grupo);
    const tam = caja.getSize(new THREE.Vector3()).length() || 10, centro = caja.getCenter(new THREE.Vector3());
    cam.position.copy(centro).add(new THREE.Vector3(tam * 0.6, tam * 0.7, tam * 0.6)); ctl.target.copy(centro); ctl.update();
    let raf;
    const bucle = () => {
      const w = c.clientWidth, hh = c.clientHeight;
      if (c.width !== Math.round(w * r.getPixelRatio())) { r.setSize(w, hh, false); cam.aspect = w / hh; cam.updateProjectionMatrix(); }
      r.render(esc, cam); raf = requestAnimationFrame(bucle);
    };
    bucle();
    vista3d = { aplicar, parar: () => { cancelAnimationFrame(raf); r.dispose(); ctl.dispose(); } };
  } catch (e) {
    console.warn(e);
    cont.replaceChildren(h("div", { class: "tenue", style: { padding: "16px" }, text: `No se pudo previsualizar el modelo (${e.message}). Pruébalo en «Modo libre 3D» de la vista previa.` }));
  }
}

// ------------------------------------------------------------------ interfaz
function render(cont) {
  raiz = h("section", { class: "seccion" });
  cont.append(raiz);
  pintar();
}
function bloque(ic, titulo, texto, acciones, contenido) {
  return h("div", { class: "tarjeta", style: { marginBottom: "12px" } },
    h("div", { class: "fila", style: { alignItems: "flex-start", flexWrap: "nowrap", marginBottom: contenido ? "12px" : 0 } },
      h("span", { style: { color: "var(--acento)", paddingTop: "2px" } }, icono(ic, 22)),
      h("div", { style: { flex: 1, minWidth: 0 } }, h("h3", { style: { margin: "0 0 3px", fontSize: "15px" }, text: titulo }), h("div", { class: "suave", style: { fontSize: "13px" }, text: texto })),
      h("div", { class: "fila", style: { flexShrink: 0 } }, acciones)),
    contenido ?? null);
}
function pintar() {
  if (!raiz) return;
  vista3d?.parar(); vista3d = null;
  const t = app.tour;
  const docs = t.documentacion ?? [];
  // Planos
  const planos = h("div", { style: { display: "flex", flexDirection: "column", gap: "6px" } }, t.plantas.map((pl) => h("div", { class: "fila", style: { flexWrap: "nowrap" } },
    pl.plano?.imagen ? h("img", { src: urlDe(pl.plano.imagen), alt: "", style: { width: "72px", height: "48px", objectFit: "contain", background: "#fff", borderRadius: "5px" } }) : h("div", { style: { width: "72px", height: "48px", borderRadius: "5px", border: "1px dashed var(--borde2)" } }),
    h("div", { style: { flex: 1, minWidth: 0 } }, h("b", { text: textoDe(pl.nombre) || pl.id }),
      h("div", { class: "tenue", style: { fontSize: "12.5px" }, text: pl.plano?.imagen ? `${redondear(pl.plano.ancho_m, 2)} × ${redondear(pl.plano.alto_m, 2)} m · ${t._estudio.calibrado?.[pl.id] ? "a escala" : "sin calibrar"}${pl.muros?.length ? ` · ${pl.muros.length} muros` : ""}` : "Sin plano" })),
    h("button", { class: "btn peq", onclick: async () => { const [f] = await elegirArchivos({ aceptar: ".pdf,.dxf,.dwg,image/png,image/jpeg,image/webp,image/svg+xml" }); if (f) importarPlanoArquitecto(f, pl.id); } }, icono("subir", 14), pl.plano?.imagen ? "Reemplazar" : "Subir plano"))));
  // Galería
  const gal = t.galeria ?? [];
  const galeria = gal.length ? h("div", { class: "lista-variantes" }, gal.map((g, i) => {
    const get = () => app.tour.galeria[i];
    return h("div", { class: "variante" },
      h("img", { src: urlDe(g.imagen), alt: "", style: { aspectRatio: "16 / 10" } }),
      h("div", { class: "cuerpo" },
        campoTexto(get, "titulo", { etiqueta: "Título", tipo: "datos" }),
        h("div", { class: "fila" },
          campo(get, "tipo", { etiqueta: "Tipo", tipo: "select", opciones: [["render", "Render / infografía"], ["foto", "Foto"], ["plano", "Plano"]], tipoCambio: "datos" }),
          campo(get, "estancia", { etiqueta: "Estancia", tipo: "select", opciones: [["", "—"], ...t.panoramas.map((p) => [p.id, nombreDe(p)])] })),
        campo(get, "autor", { etiqueta: "Autor", placeholder: "Estudio de arquitectura…" }),
        h("div", { class: "fila" }, g.tipo === "render" ? h("span", { class: "chip acento", text: "Se rotula «Render / infografía»" }) : h("span"), h("div", { style: { flex: 1 } }),
          h("button", { class: "btn peq fantasma icono-btn", "aria-label": "Quitar imagen", onclick: () => cambiar(() => { app.tour.galeria.splice(i, 1); }) }, icono("basura", 15)))));
  })) : null;
  // Modelo
  const L = t.libre;
  const vec = (clave, i, etq, paso) => {
    const inp = h("input", { type: "number", step: paso, value: L?.[clave]?.[i] ?? 0, "aria-label": etq, style: { width: "84px" } });
    inp.oninput = () => { cambiar(() => { const l = app.tour.libre; l[clave] ??= [0, 0, 0]; l[clave][i] = Number(inp.value) || 0; }, { clave: `libre-${clave}-${i}`, tipo: "datos", render: false }); vista3d?.aplicar(); };
    return h("label", { class: "campo", style: { flex: "0 0 auto" } }, h("span", { text: etq }), inp);
  };
  const vistaModelo = h("div");
  const modelo = L ? h("div", {},
    h("div", { class: "fila", style: { marginBottom: "10px" } },
      h("span", { class: "chip acento", text: L.tipo === "glb" ? "Modelo 3D (GLB)" : "Escaneo 3D" }), h("span", { class: "tenue", text: L.url }),
      h("div", { style: { flex: 1 } }),
      h("button", { class: "btn peq fantasma", onclick: async () => { if (await confirmar("Quitar modelo 3D", "El visor dejará de ofrecer el paseo libre.", "Quitar")) cambiar(() => { delete app.tour.libre; }); } }, "Quitar")),
    h("div", { class: "fila", style: { alignItems: "flex-end" } },
      vec("rotacion", 0, "Rot. X°", 90), vec("rotacion", 1, "Rot. Y°", 15), vec("rotacion", 2, "Rot. Z°", 90),
      (() => { const i = h("input", { type: "number", step: 0.01, min: 0.001, value: L.escala ?? 1, style: { width: "84px" } }); i.oninput = () => { cambiar(() => { app.tour.libre.escala = Number(i.value) || 1; }, { clave: "libre-esc", tipo: "datos", render: false }); vista3d?.aplicar(); }; return h("label", { class: "campo", style: { flex: "0 0 auto" } }, h("span", { text: "Escala" }), i); })(),
      vec("posicion", 0, "Pos. X (m)", 0.1), vec("posicion", 1, "Pos. Y (m)", 0.1), vec("posicion", 2, "Pos. Z (m)", 0.1)),
    h("small", { class: "tenue", style: { display: "block", margin: "8px 0" }, text: "Ajusta hasta que el suelo quede horizontal y en Y = 0 y el modelo coincida con el plano (1 unidad = 1 metro). SketchUp/Revit suelen necesitar Rot. X = −90°." }),
    vistaModelo) : null;
  // Documentos
  const documentos = docs.length ? h("div", { style: { display: "flex", flexDirection: "column", gap: "6px" } }, docs.map((d, i) => {
    const get = () => app.tour.documentacion[i];
    const pub = h("input", { type: "checkbox", checked: !!d.publico });
    pub.onchange = () => cambiar(() => { get().publico = pub.checked; }, { tipo: "datos", render: false });
    return h("div", { class: "fila", style: { flexWrap: "nowrap", padding: "6px 8px", borderRadius: "8px", background: "var(--sup2)" } },
      h("div", { style: { flex: 1, minWidth: 0 } }, campo(get, "nombre", { etiqueta: "Nombre" })),
      h("div", { style: { width: "170px" } }, campo(get, "tipo", { etiqueta: "Tipo", tipo: "select", opciones: TIPOS_DOC })),
      h("label", { class: "check", style: { alignSelf: "flex-end", minHeight: "36px" }, title: "Los documentos públicos se ofrecen en la ficha del visor" }, pub, "Público"),
      h("a", { class: "btn peq fantasma icono-btn", style: { alignSelf: "flex-end" }, href: urlDe(d.archivo), download: d.archivo.split("/").pop(), title: `Descargar (${fmtMB(app.archivos.get(d.archivo)?.size ?? 0)})`, "aria-label": "Descargar" }, icono("descargar", 15)),
      h("button", { class: "btn peq fantasma icono-btn", style: { alignSelf: "flex-end" }, "aria-label": "Quitar documento", onclick: () => cambiar(() => {
        const dd = app.tour.documentacion.splice(i, 1)[0];
        if (dd?.tipo === "modelo" && app.tour.libre?.url === dd.archivo) delete app.tour.libre;
      }) }, icono("basura", 15)));
  })) : null;

  raiz.replaceChildren(
    h("div", { class: "cab-seccion" }, h("div", {}, h("h1", { text: "Material del proyecto" }),
      h("p", { text: "Opcional. Adjunta lo que te pasen el arquitecto y el renderista: los planos se convierten en el plano a escala, los renders en estancias o estilos y el modelo 3D en el paseo libre. Aquí también puedes añadir música." }))),
    bloque("plano", "Planos de arquitecto", "PDF, DXF (AutoCAD, Revit, ArchiCAD) o imagen. Un DXF ya viene a escala y trae los muros. El DWG hay que exportarlo a DXF.", [], planos),
    bloque("orientar", "Renders 360", "Equirectangulares 2:1 de Corona, V-Ray, Lumion, Enscape o D5: como estancias de obra nueva o como estilo de una foto real.",
      [h("button", { class: "btn primario", onclick: async () => subirRenders360(await elegirArchivos({ aceptar: "image/jpeg,image/png,image/webp", multiple: true })) }, icono("subir", 16), "Subir renders 360")]),
    bloque("fotos", "Renders fijos e imágenes", "Infografías y fotos para la galería del visor. Los renders se rotulan «Render / infografía».",
      [h("button", { class: "btn", onclick: async () => subirGaleria(await elegirArchivos({ aceptar: "image/*", multiple: true })) }, icono("subir", 16), "Subir imágenes")], galeria),
    bloque("variantes", "Modelo 3D (opcional)", "Modelo 3D (opcional). Lo prepara tu arquitecto o renderista: un archivo GLB de SketchUp, Revit, Blender o Twinmotion, o un escaneo 3D (.spz, .ply, .sog). Activa el paseo libre y la maqueta.",
      [h("button", { class: "btn", onclick: subirModelo }, icono("subir", 16), L ? "Reemplazar" : "Subir modelo")], modelo),
    bloque("video", "Música de fondo", "Opcional. Suena en el visor (botón de sonido) y en los vídeos.", [], bloqueMusica()),
    bloque("datos", "Documentos", "Memoria de calidades, licencias, nota simple… Marca «Público» para ofrecerlos en la ficha; el resto solo se guarda en el proyecto y en la copia de seguridad (no se publica).",
      [h("button", { class: "btn", onclick: async () => { const fs = await elegirArchivos({ aceptar: "", multiple: true }); for (const f of fs) await guardarDocumento(f, /calidad/i.test(f.name) ? "memoria" : /nota/i.test(f.name) ? "nota" : /licen|c[eé]dula/i.test(f.name) ? "licencia" : "otro"); } }, icono("subir", 16), "Subir documentos")], documentos),
  );
  if (L) previsualizar(vistaModelo);
}

export const seccionMaterial = {
  id: "material", titulo: "Material del proyecto", corto: "Material",
  resumen: () => {
    const t = app.tour;
    const n = (t.documentacion?.length ?? 0) + (t.galeria?.length ?? 0) + (t.libre ? 1 : 0);
    return { texto: n ? `${n} elementos` : "Planos, renders, 3D", hecho: n > 0 };
  },
  render, actualizar: () => { if (!raiz?.contains(document.activeElement) || document.activeElement?.tagName === "BUTTON") pintar(); },
  salir: () => { vista3d?.parar(); vista3d = null; raiz = null; },
  soltar: async (lista) => {
    const fs = lista.map((x) => x.archivo);
    const planos = fs.filter((f) => /\.(pdf|dxf|dwg)$/i.test(f.name));
    if (planos.length) { for (const f of planos) await importarPlanoArquitecto(f, app.planta); return true; }
    const modelos = fs.filter((f) => /\.(glb|gltf|spz|ply|sog|splat|ksplat)$/i.test(f.name));
    if (modelos.length) { toast("Usa el botón «Subir modelo» para el modelo 3D", "info"); return true; }
    const imgs = fs.filter((f) => /\.(jpe?g|png|webp)$/i.test(f.name));
    if (imgs.length) {
      const dims = await Promise.all(imgs.map((f) => dimensiones(f).catch(() => null)));
      const esfericas = imgs.filter((f, i) => dims[i] && Math.abs(dims[i].w / dims[i].h - 2) < 0.02);
      const planas = imgs.filter((f) => !esfericas.includes(f));
      if (esfericas.length) await subirRenders360(esfericas);
      if (planas.length) await subirGaleria(planas);
      return true;
    }
    return false;
  },
};

function cargando(texto) {
  const capa = h("div", { class: "cargando-global" }, h("div", {}, h("span", { text: texto }), h("div", { class: "progreso" }, h("div", { style: { width: "100%" } }))));
  document.body.append(capa);
  return capa;
}
on("proyecto", () => { vista3d?.parar(); vista3d = null; });
void pano;
