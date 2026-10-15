// Más herramientas · Extras (S-5 · E10): lo que enriquece el recorrido sin ser imprescindible. Renders e imágenes para la
// galería, documentos (una sola lista con «Público»), música de fondo, visita guiada y, en «Avanzado», el modelo 3D
// (paseo libre y maqueta). Los planos del arquitecto están en Plano y los renders 360 en Fotos o en Estilo y luz.
import { slug, dimensiones } from "./estudio-util.js";
import { app, h, icono, cambiar, emitir, on, toast, confirmar, pedir, guardarArchivo, guardarDocumento, urlDe, rutaLibre, elegirArchivos,
  textoDe, fmtMB, urlPermitida, VIDRIO, coloresTema, alCambiarTema } from "./estudio-nucleo.js";
import { campoTexto, campo } from "./estudio-campos.js";
import { bloqueMusica } from "./estudio-musica.js";

const TIPOS_DOC = [["memoria", "Memoria de calidades"], ["plano", "Plano"], ["render", "Render"], ["nota", "Nota simple"], ["licencia", "Licencia / cédula"], ["modelo", "Modelo 3D"], ["otro", "Otro"]];
let raiz = null;
const nombreDe = (p) => textoDe(p?.nombre) || p?.id || "";
const ext = (n) => (n.split(".").pop() || "").toLowerCase();
const tipoDoc = (nombre) => (/calidad/i.test(nombre) ? "memoria" : /nota/i.test(nombre) ? "nota" : /licen|c[eé]dula/i.test(nombre) ? "licencia" : /plano/i.test(nombre) ? "plano" : "otro");
const externo = (ruta) => /^https?:\/\//i.test(ruta ?? "");

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
    cont.replaceChildren(h("div", { class: "vista-modelo-vacia" },
      h("p", { text: L?.tipo === "splat" ? "Para ver el escaneo 3D, abre «Modo libre 3D» en la vista previa." : "Sin modelo" })));
    return;
  }
  cont.replaceChildren(h("div", { class: "vista-modelo-vacia", text: "Cargando modelo…" }));
  try {
    const THREE = await import("three");
    const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
    const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
    // Fondo transparente (el del tema, por CSS) y rejilla con los colores del tema, que se rehace al cambiarlo.
    const c = h("canvas", { class: "vista-modelo" });
    cont.replaceChildren(c);
    const r = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    const esc = new THREE.Scene();
    esc.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2.2));
    const dl = new THREE.DirectionalLight(0xffffff, 1.5); dl.position.set(5, 10, 4); esc.add(dl);
    let rej = null;
    const rejilla = () => {
      if (rej) { esc.remove(rej); rej.dispose(); }
      const { fuerte, suave } = coloresTema({ fuerte: "--c-borde-2", suave: "--c-borde" });
      const opaco = (col) => { const k = new THREE.Color(); try { k.setStyle(col); } catch { k.set(0x808080); } return k; };
      rej = new THREE.GridHelper(40, 40, opaco(fuerte), opaco(suave)); esc.add(rej);
    };
    rejilla();
    const dejarTema = alCambiarTema(rejilla);
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
    vista3d = { aplicar, parar: () => { cancelAnimationFrame(raf); dejarTema(); r.dispose(); ctl.dispose(); } };
  } catch (e) {
    console.warn(e);
    cont.replaceChildren(h("div", { class: "vista-modelo-vacia", text: `No se pudo previsualizar el modelo (${e.message}). Pruébalo en «Modo libre 3D» de la vista previa.` }));
  }
}

// ------------------------------------------------------------------ visita guiada
function visitaGuiada() {
  const t = app.tour;
  const personalizado = Array.isArray(t.guion);
  const paradas = personalizado ? t.guion : t.panoramas.map((p) => ({ nodo: p.id, segundos: 5 }));
  const materializar = () => { if (!Array.isArray(app.tour.guion)) app.tour.guion = app.tour.panoramas.map((p) => ({ nodo: p.id, segundos: 5 })); };
  const lista = h("div", { class: "lista-guion" }, paradas.map((g, i) => {
    const sel = h("select", { "aria-label": "Estancia" }, t.panoramas.map((p) => h("option", { value: p.id, text: textoDe(p.nombre) || p.id })));
    sel.value = g.nodo;
    sel.onchange = () => { cambiar(() => { materializar(); app.tour.guion[i].nodo = sel.value; }, { tipo: "datos" }); };
    const seg = h("input", { type: "number", min: 2, max: 30, step: 1, value: g.segundos ?? 5, "aria-label": "Segundos" });
    seg.oninput = () => cambiar(() => { materializar(); app.tour.guion[i].segundos = Number(seg.value) || 5; }, { clave: `seg${i}`, tipo: "datos", render: false });
    const rumbo = h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", title: "Usar la dirección actual de la vista previa", onclick: () => {
      const v = app.vista;
      if (!v || v.nodo !== g.nodo) { app.nodo = g.nodo; emitir("nodo", {}); return toast("Gira la vista previa hacia donde quieres mirar y vuelve a pulsar", "info"); }
      cambiar(() => { materializar(); app.tour.guion[i].rumbo = Math.round(((v.rumbo % 360) + 360) % 360); }, { tipo: "datos" });
    } }, g.rumbo != null ? `${Math.round(g.rumbo)}°` : "Mirar…");
    return h("div", {},
      h("div", { class: "parada" },
        h("span", { class: "n", text: i + 1 }),
        h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--icono c8-boton--s", title: "Subir", "aria-label": "Subir", disabled: i === 0, onclick: () => cambiar(() => { materializar(); const a = app.tour.guion; [a[i - 1], a[i]] = [a[i], a[i - 1]]; }, { tipo: "datos" }) }, h("span", { text: "↑" })),
        sel, h("label", { class: "fila segundos" }, seg, h("span", { class: "tenue", text: "s" })), rumbo,
        h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--icono c8-boton--s", "aria-label": "Quitar parada", onclick: () => cambiar(() => { materializar(); app.tour.guion.splice(i, 1); }, { tipo: "datos" }) }, icono("basura", 14))),
      personalizado ? h("div", { class: "texto-parada" }, campoTexto(() => app.tour.guion[i], "texto", { etiqueta: "Texto en pantalla", compacto: true, tipo: "datos", placeholder: "Texto opcional que aparece en esta parada" })) : null);
  }));
  return h("div", {},
    h("div", { class: "fila cab-tarjeta" },
      personalizado ? h("span", { class: "chip acento", text: "Guion personalizado" }) : h("span", { class: "chip", text: "Por defecto: orden de las fotos" }),
      h("div", { class: "relleno" }),
      h("button", { type: "button", class: "c8-boton c8-boton--secundario c8-boton--s", disabled: !t.panoramas.length, onclick: () => cambiar(() => { materializar(); app.tour.guion.push({ nodo: app.nodo ?? app.tour.panoramas[0].id, segundos: 5 }); }, { tipo: "datos" }) }, icono("mas", 14), "Añadir parada"),
      personalizado ? h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--s", onclick: () => cambiar(() => { delete app.tour.guion; }, { tipo: "datos" }) }, "Volver al orden de las fotos") : null),
    t.panoramas.length ? lista : h("p", { class: "texto-sec", text: "Añade fotos para preparar la visita guiada." }));
}


// ------------------------------------------------------------------ documentos (una sola lista, E10)
/** Documento que está en otra web (Drive, la web de la agencia…): se pide y se valida antes de añadirlo. */
async function anadirEnlace() {
  const v = await pedir("Añadir un enlace", "Dirección del documento", "https://", { tipo: "url", ayuda: "Por ejemplo, la memoria de calidades en tu web o en Google Drive." });
  if (v == null) return;
  const u = v.trim();
  if (!(urlPermitida(u) && /^https?:\/\/[^/]+/i.test(u))) return toast("Escribe la dirección completa, empezando por https://", "aviso", 5000);
  let nombre = "";
  try { const x = new URL(u); nombre = decodeURIComponent(x.pathname.split("/").filter(Boolean).pop() ?? "").replace(/\.[^.]+$/, "") || x.hostname; } catch { nombre = u; }
  cambiar((t) => { t.documentacion ??= []; t.documentacion.push({ nombre: { es: nombre }, archivo: u, tipo: "otro", publico: true }); }, { tipo: "datos" });
}
function listaDocumentos() {
  const docs = app.tour.documentacion ?? [];
  if (!docs.length) return h("p", { class: "texto-sec", text: "Sin documentos." });
  return h("div", { class: "lista-docs" }, docs.map((d, i) => {
    const get = () => app.tour.documentacion[i];
    const pub = h("input", { type: "checkbox", checked: !!d.publico });
    pub.onchange = () => cambiar(() => { get().publico = pub.checked; }, { tipo: "datos" });
    const archivo = !externo(d.archivo) && app.archivos.get(d.archivo);
    return h("div", { class: "fila-doc" },
      h("div", { class: "doc-nombre" }, campoTexto(get, "nombre", { etiqueta: "Nombre", tipo: "datos" })),
      externo(d.archivo) ? h("div", { class: "doc-enlace" }, campo(get, "archivo", { etiqueta: "Enlace", tipo: "url", urlInterna: true, placeholder: "https://…" }))
        : h("div", { class: "doc-tipo" }, campo(get, "tipo", { etiqueta: "Tipo", tipo: "select", opciones: TIPOS_DOC })),
      h("label", { class: "check", title: "Los documentos públicos se ofrecen en la ficha del visor; los demás solo se guardan en el proyecto y en la copia de seguridad" }, pub, "Público"),
      archivo ? h("a", { class: "c8-boton c8-boton--fantasma c8-boton--icono c8-boton--s", href: urlDe(d.archivo), download: d.archivo.split("/").pop(), title: `Descargar (${fmtMB(archivo.size)})`, "aria-label": "Descargar" }, icono("descargar", 15)) : null,
      h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--icono c8-boton--s", "aria-label": "Quitar documento", onclick: () => cambiar(() => {
        const dd = app.tour.documentacion.splice(i, 1)[0];
        if (dd?.tipo === "modelo" && app.tour.libre?.url === dd.archivo) delete app.tour.libre;
      }) }, icono("basura", 15)));
  }));
}

// ------------------------------------------------------------------ interfaz
function render(cont, op = {}) {
  raiz = h("section", { class: "seccion" });
  cont.append(raiz);
  if (op.campo === "modelo") modeloAbierto = true;
  pintar();
}
let modeloAbierto = false;
/** Tarjeta de vidrio de Extras: icono, título, explicación y acciones; debajo, su contenido (rellenos, nunca otro vidrio). */
function bloque(ic, titulo, texto, acciones, contenido, campoId, { vidrio = true } = {}) {
  return h("div", { class: `tarjeta bloque${vidrio ? ` ${VIDRIO}` : ""}`, "data-campo": campoId },
    h("div", { class: "fila cab-bloque" }, icono(ic, 22),
      h("div", { class: "texto-sec" }, h("h3", { text: titulo }), texto),
      acciones.length ? h("div", { class: "fila" }, acciones) : null),
    contenido ?? null);
}
function pintar() {
  if (!raiz) return;
  vista3d?.parar(); vista3d = null;
  const t = app.tour;
  // Galería
  const gal = t.galeria ?? [];
  const galeria = gal.length ? h("div", { class: "lista-variantes" }, gal.map((g, i) => {
    const get = () => app.tour.galeria[i];
    return h("div", { class: "variante" },
      h("img", { class: "foto-galeria", src: urlDe(g.imagen), alt: "" }),
      h("div", { class: "cuerpo" },
        campoTexto(get, "titulo", { etiqueta: "Título", tipo: "datos" }),
        h("div", { class: "fila" },
          campo(get, "tipo", { etiqueta: "Tipo", tipo: "select", opciones: [["render", "Render / infografía"], ["foto", "Foto"], ["plano", "Plano"]], tipoCambio: "datos" }),
          campo(get, "estancia", { etiqueta: "Estancia", tipo: "select", opciones: [["", "—"], ...t.panoramas.map((p) => [p.id, nombreDe(p)])] })),
        campo(get, "autor", { etiqueta: "Autor", placeholder: "Estudio de arquitectura…" }),
        h("div", { class: "fila" }, g.tipo === "render" ? h("span", { class: "chip acento", text: "Se rotula «Render / infografía»" }) : h("span"), h("div", { class: "relleno" }),
          h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--icono c8-boton--s", "aria-label": "Quitar imagen", onclick: () => cambiar(() => { app.tour.galeria.splice(i, 1); }) }, icono("basura", 15)))));
  })) : null;
  // Modelo 3D (avanzado)
  const L = t.libre;
  const vec = (clave, i, etq, paso) => {
    const inp = h("input", { type: "number", step: paso, value: L?.[clave]?.[i] ?? 0, "aria-label": etq });
    inp.oninput = () => { cambiar(() => { const l = app.tour.libre; l[clave] ??= [0, 0, 0]; l[clave][i] = Number(inp.value) || 0; }, { clave: `libre-${clave}-${i}`, tipo: "datos", render: false }); vista3d?.aplicar(); };
    return h("label", { class: "campo modelo-vector" }, h("span", { text: etq }), inp);
  };
  const vistaModelo = h("div");
  const ajustesModelo = L ? h("div", { class: "pila" },
    h("div", { class: "fila cab-tarjeta" },
      h("span", { class: "chip acento", text: L.tipo === "glb" ? "Modelo 3D (GLB)" : "Escaneo 3D" }), h("span", { class: "tenue", text: L.url }),
      h("div", { class: "relleno" }),
      h("button", { type: "button", class: "c8-boton c8-boton--fantasma c8-boton--s", onclick: async () => { if (await confirmar("Quitar modelo 3D", "El visor dejará de ofrecer el paseo libre.", "Quitar")) cambiar(() => { delete app.tour.libre; }); } }, "Quitar")),
    h("div", { class: "fila abajo" },
      vec("rotacion", 0, "Rot. X°", 90), vec("rotacion", 1, "Rot. Y°", 15), vec("rotacion", 2, "Rot. Z°", 90),
      (() => { const i = h("input", { type: "number", step: 0.01, min: 0.001, value: L.escala ?? 1 }); i.oninput = () => { cambiar(() => { app.tour.libre.escala = Number(i.value) || 1; }, { clave: "libre-esc", tipo: "datos", render: false }); vista3d?.aplicar(); }; return h("label", { class: "campo modelo-vector" }, h("span", { text: "Escala" }), i); })(),
      vec("posicion", 0, "Pos. X (m)", 0.1), vec("posicion", 1, "Pos. Y (m)", 0.1), vec("posicion", 2, "Pos. Z (m)", 0.1)),
    h("p", { class: "texto-pie nota-modelo", text: "Ajusta hasta que el suelo quede horizontal y en Y = 0 y el modelo coincida con el plano (1 unidad = 1 metro). SketchUp/Revit suelen necesitar Rot. X = −90°." }),
    vistaModelo) : null;
  const modelo = h("details", { class: "avanzado", open: modeloAbierto || !!L, "data-campo": "modelo" }, h("summary", { text: "Avanzado: modelo 3D (paseo libre y maqueta)" }),
    h("div", { class: "contenido" }, bloque("variantes", "Modelo 3D", "Lo prepara tu arquitecto o renderista. Activa el paseo libre y la maqueta. Formatos: GLB (SketchUp, Revit, Blender, Twinmotion) o escaneo 3D (.spz, .ply, .sog).",
      [h("button", { type: "button", class: "c8-boton c8-boton--secundario", onclick: subirModelo }, icono("subir", 16), L ? "Reemplazar" : "Subir modelo")], ajustesModelo)));
  modelo.addEventListener("toggle", () => { modeloAbierto = modelo.open; });

  raiz.replaceChildren(
    h("div", { class: "cab-seccion" }, h("div", {}, h("h1", { text: "Extras" }),
      h("p", { text: "Opcional: renders e imágenes para la galería, documentos, música de fondo y la visita guiada. Los planos del arquitecto se suben en Plano." }))),
    bloque("fotos", "Renders e imágenes para la galería", "Infografías y fotos fijas que el cliente verá en «Renders y planos». Los renders se rotulan «Render / infografía».",
      [h("button", { type: "button", class: "c8-boton c8-boton--secundario", onclick: async () => subirGaleria(await elegirArchivos({ aceptar: "image/*", multiple: true })) }, icono("subir", 16), "Subir imágenes")], galeria, "galeria"),
    bloque("datos", "Documentos", "Memoria de calidades, nota simple, licencias… Los marcados como «Público» se ofrecen en la ficha; los demás solo se guardan en el proyecto y en la copia de seguridad.",
      [h("button", { type: "button", class: "c8-boton c8-boton--secundario", onclick: async () => { const fs = await elegirArchivos({ aceptar: "", multiple: true }); for (const f of fs) await guardarDocumento(f, tipoDoc(f.name)); } }, icono("subir", 16), "Subir documentos"),
        h("button", { type: "button", class: "c8-boton c8-boton--fantasma", onclick: anadirEnlace }, icono("enlace", 16), "Añadir enlace")],
      listaDocumentos(), "documentos"),
    bloque("video", "Música de fondo", "Suena con el botón de sonido del visor y en los vídeos. Usa música libre de derechos o con licencia comercial.", [], bloqueMusica(), "musica"),
    bloque("orientar", "Visita guiada", "Recorrido automático de la visita guiada y del vídeo. Paradas de 4–6 s con giros lentos se ven mejor.", [], visitaGuiada(), "guion"),
    modelo);
  if (L && modelo.open) previsualizar(vistaModelo);
}

export const seccionExtras = {
  id: "extras", titulo: "Extras", corto: "Extras", icono: "extras",
  resumen: () => {
    const t = app.tour;
    const n = (t.documentacion?.length ?? 0) + (t.galeria?.length ?? 0) + (t.libre ? 1 : 0) + (t.audio?.musica ? 1 : 0);
    return { texto: n ? `${n} ${n === 1 ? "elemento" : "elementos"}` : "Galería, documentos, música" };
  },
  render, actualizar: () => { if (!raiz?.contains(document.activeElement) || document.activeElement?.tagName === "BUTTON") pintar(); },
  salir: () => { vista3d?.parar(); vista3d = null; raiz = null; },
  soltar: async (lista) => {
    const fs = lista.map((x) => x.archivo);
    const modelos = fs.filter((f) => /\.(glb|gltf|spz|ply|sog|splat|ksplat)$/i.test(f.name));
    if (modelos.length) { toast("Usa «Avanzado → Subir modelo» para el modelo 3D", "info"); return true; }
    const imgs = fs.filter((f) => /\.(jpe?g|png|webp)$/i.test(f.name));
    if (imgs.length === fs.length) {
      // Las 360 (2:1) son estancias: van a Fotos. Las demás, a la galería.
      const dims = await Promise.all(imgs.map((f) => dimensiones(f).catch(() => null)));
      const planas = imgs.filter((f, i) => !(dims[i] && Math.abs(dims[i].w / dims[i].h - 2) < 0.02));
      if (planas.length < imgs.length) return false;
      await subirGaleria(planas);
      return true;
    }
    for (const f of fs) await guardarDocumento(f, tipoDoc(f.name));
    return true;
  },
};
on("proyecto", () => { vista3d?.parar(); vista3d = null; });
