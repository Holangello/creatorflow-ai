// Paso 5 · Datos: inmueble, marca y agente, contacto, idiomas y textos, colores y estilos, visita guiada.
import { app, h, icono, cambiar, emitir, toast, confirmar, guardarArchivo, urlDe, rutaLibre, elegirArchivos,
  textoDe, pano, IDIOMAS, PAREDES_DEF, SUELOS_DEF, ESTILOS_IA, MOMENTOS } from "./estudio-nucleo.js";
import { slug } from "./estudio-util.js";
import { campoTexto, campo, campoSiNo } from "./estudio-campos.js";

const PESTANAS = [
  ["inmueble", "Inmueble"], ["marca", "Marca y agente"], ["contacto", "Contacto"], ["textos", "Idiomas"],
  ["personalizacion", "Colores y estilos"], ["secciones", "Secciones"], ["guion", "Visita guiada"],
];
const LETRAS = { A: "#00a651", B: "#4cb848", C: "#bfd730", D: "#e8d900", E: "#fdb913", F: "#f37021", G: "#ed1c24" };
const SUGERENCIAS = ["Exterior", "Luminoso", "Armarios empotrados", "Cocina equipada", "Suelo radiante", "Ventanas con doble acristalamiento",
  "Puerta blindada", "Videoportero", "Zonas comunes", "Accesible", "Amueblado", "Vistas despejadas", "Balcón", "Lavadero"];

let raiz = null, pestana = "inmueble";
const T = () => app.tour;
const ob = (ruta) => () => { let o = app.tour; for (const k of ruta) { o[k] ??= {}; o = o[k]; } return o; };

function render(cont, op = {}) {
  if (op.pestana) pestana = op.pestana;
  raiz = h("section", { class: "seccion" });
  cont.append(raiz);
  pintar();
}
function pintar() {
  if (!raiz) return;
  const tabs = h("div", { class: "pestanas", role: "tablist" }, PESTANAS.map(([id, n]) => h("button", {
    role: "tab", "aria-selected": String(id === pestana), text: n, onclick: () => { pestana = id; pintar(); },
  })));
  const cuerpo = { inmueble, marca, contacto, textos, personalizacion, secciones, guion }[pestana]();
  raiz.replaceChildren(
    h("div", { class: "cab-seccion" }, h("div", {}, h("h1", { text: "Datos del anuncio" }),
      h("p", { text: "Lo que verá el cliente en la ficha del visor y en el dossier. Todo es opcional salvo lo que exige la ley (certificado energético)." }))),
    tabs, cuerpo);
}

// ------------------------------------------------------------------ inmueble
function inmueble() {
  const I = ob(["inmueble"]);
  const CE = ob(["inmueble", "certificado_energetico"]);
  const letras = (clave, etq) => {
    const g = h("div", { class: "letras-ce", role: "group", "aria-label": etq });
    const pintarL = () => g.replaceChildren(...Object.entries(LETRAS).map(([l, c]) => h("button", {
      type: "button", text: l, style: { background: c }, "aria-pressed": String(CE()[clave] === l), title: `${etq}: ${l}`,
      onclick: () => { cambiar(() => { const o = CE(); if (o[clave] === l) delete o[clave]; else { o[clave] = l; delete o.en_tramite; } }, { tipo: "datos", render: false }); pintarL(); trami.querySelector("input").checked = !!CE().en_tramite; },
    })));
    pintarL();
    return h("div", { class: "campo" }, h("span", { text: etq }), g);
  };
  const trami = campo(CE, "en_tramite", { etiqueta: "Certificado en trámite", tipo: "check", alCambiar: () => pintar() });
  const tipos = [["piso", "Piso"], ["casa", "Casa"], ["chalet", "Chalet"], ["adosado", "Adosado"], ["atico", "Ático"], ["duplex", "Dúplex"], ["estudio", "Estudio"],
    ["loft", "Loft"], ["local", "Local"], ["oficina", "Oficina"], ["nave", "Nave"], ["garaje", "Garaje"], ["terreno", "Terreno"]];
  return h("div", {},
    h("div", { class: "tarjeta" },
      h("div", { class: "rejilla" },
        h("div", { class: "ancho-todo" }, campoTexto(() => app.tour, "titulo", { etiqueta: "Título del anuncio", placeholder: "Piso reformado con terraza en Chamberí", tipo: "datos", alCambiar: () => emitir("historial") })),
        campo(I, "referencia", { etiqueta: "Referencia", placeholder: "REF-1234", ayuda: "Se usa en la ruta de publicación" }),
        campo(I, "operacion", { etiqueta: "Operación", tipo: "select", opciones: [["venta", "Venta"], ["alquiler", "Alquiler"]] }),
        campo(I, "tipo", { etiqueta: "Tipo", tipo: "select", opciones: tipos }),
        campo(I, "estado_obra", { etiqueta: "Situación", tipo: "select", opciones: [["construido", "Construido"], ["proyecto", "Obra nueva / proyecto"]] }),
        campo(I, "precio", { etiqueta: "Precio (€)", tipo: "number", min: 0, paso: 1000, placeholder: "349000" }),
        campo(I, "gastos_comunidad_mes", { etiqueta: "Comunidad (€/mes)", tipo: "number", min: 0 }),
        campo(I, "ibi_anual", { etiqueta: "IBI (€/año)", tipo: "number", min: 0 }),
        campo(I, "superficie_construida", { etiqueta: "Sup. construida (m²)", tipo: "number", min: 0 }),
        campo(I, "superficie_util", { etiqueta: "Sup. útil (m²)", tipo: "number", min: 0 }),
        campo(I, "superficie_parcela", { etiqueta: "Parcela (m²)", tipo: "number", min: 0 }),
        campo(I, "habitaciones", { etiqueta: "Habitaciones", tipo: "number", min: 0, paso: 1 }),
        campo(I, "banos", { etiqueta: "Baños", tipo: "number", min: 0, paso: 1 }),
        campo(I, "planta", { etiqueta: "Planta", placeholder: "3ª, bajo, ático…" }),
        campo(I, "orientacion", { etiqueta: "Orientación", tipo: "select", opciones: [["", "—"], ...["Norte", "Noreste", "Este", "Sureste", "Sur", "Suroeste", "Oeste", "Noroeste"].map((o) => [o, o])] }),
        campo(I, "ano_construccion", { etiqueta: "Año de construcción", tipo: "number", min: 1800, max: 2100, paso: 1 }),
        campo(I, "estado", { etiqueta: "Estado", tipo: "select", opciones: [["", "—"], ["A estrenar", "A estrenar"], ["Reformado", "Reformado"], ["Buen estado", "Buen estado"], ["A reformar", "A reformar"]] }),
        campo(I, "calefaccion", { etiqueta: "Calefacción", placeholder: "Aerotermia, gas natural…" }),
        campo(I, "terraza", { etiqueta: "Terraza (m²)", tipo: "number", min: 0 }),
      ),
      h("h2", { class: "sub", text: "Equipamiento" }),
      h("div", { class: "rejilla" },
        campoSiNo(I, "ascensor", "Ascensor"), campoSiNo(I, "aire_acondicionado", "Aire acondicionado"), campoSiNo(I, "garaje", "Garaje"),
        campoSiNo(I, "trastero", "Trastero"), campoSiNo(I, "piscina", "Piscina"), campoSiNo(I, "jardin", "Jardín"))),
    h("h2", { class: "sub", text: "Certificado energético (obligatorio en anuncios)" }),
    h("div", { class: "tarjeta" },
      CE().en_tramite ? h("p", { class: "suave", style: { marginTop: 0 }, text: "Se mostrará «Certificado energético en trámite»." }) : h("div", { class: "rejilla" },
        letras("consumo_letra", "Consumo"), campo(CE, "consumo_valor", { etiqueta: "kWh/m²·año", tipo: "number", min: 0 }),
        letras("emisiones_letra", "Emisiones"), campo(CE, "emisiones_valor", { etiqueta: "kg CO₂/m²·año", tipo: "number", min: 0 })),
      h("div", { style: { marginTop: "8px" } }, trami)),
    h("h2", { class: "sub", text: "Descripción y características" }),
    h("div", { class: "tarjeta" },
      campoTexto(I, "descripcion", { etiqueta: "Descripción", multilinea: true, tipo: "datos", placeholder: "Describe el inmueble: distribución, calidades, entorno…" }),
      h("div", { style: { height: "14px" } }),
      chips(),
      h("div", { style: { height: "14px" } }),
      h("div", { class: "rejilla" },
        h("div", { class: "ancho-2" }, campo(I, "direccion", { etiqueta: "Dirección", placeholder: "Calle Mayor 12, Madrid" })),
        campo(ob(["inmueble", "ubicacion"]), "lat", { etiqueta: "Latitud", tipo: "number", paso: 0.0001 }),
        campo(ob(["inmueble", "ubicacion"]), "lng", { etiqueta: "Longitud", tipo: "number", paso: 0.0001 }),
        h("div", { class: "ancho-todo" }, campo(I, "mostrar_direccion_exacta", { etiqueta: "Mostrar la dirección exacta (si no, solo la zona)", tipo: "check" })))),
    h("h2", { class: "sub", text: "Documentos" }), documentos(),
    h("h2", { class: "sub", text: "Ajustes de las fotos" }),
    h("div", { class: "tarjeta" }, h("div", { class: "rejilla" },
      campo(() => app.tour, "altura_camara", { etiqueta: "Altura de la cámara (m)", tipo: "number", min: 0.5, max: 3, paso: 0.05, ayuda: "Altura del trípode al hacer las fotos", tipoCambio: "todo" }))),
  );
}
function chips() {
  const I = ob(["inmueble"]);
  const cont = h("div", { class: "chips" });
  const sug = h("div", { class: "sugerencias" });
  const input = h("input", { placeholder: "Escribe y pulsa Enter (p. ej. Exterior)", "aria-label": "Nueva característica" });
  const lista = () => I().caracteristicas ?? [];
  const pintarC = () => {
    cont.replaceChildren(...lista().map((c, i) => h("span", { class: "chip" }, textoDe(c),
      h("button", { type: "button", "aria-label": `Quitar ${textoDe(c)}`, text: "×", onclick: () => { cambiar(() => { I().caracteristicas.splice(i, 1); }, { tipo: "datos", render: false }); pintarC(); } }))), input);
    const ya = new Set(lista().map((c) => textoDe(c).toLowerCase()));
    sug.replaceChildren(...SUGERENCIAS.filter((s) => !ya.has(s.toLowerCase())).slice(0, 10).map((s) => h("button", { type: "button", text: `+ ${s}`, onclick: () => anadir(s) })));
  };
  const anadir = (v) => {
    v = v.trim(); if (!v) return;
    cambiar(() => { const o = I(); o.caracteristicas ??= []; o.caracteristicas.push(v); }, { tipo: "datos", render: false });
    input.value = ""; pintarC(); input.focus();
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); anadir(input.value); }
    if (e.key === "Backspace" && !input.value && lista().length) { cambiar(() => { I().caracteristicas.pop(); }, { tipo: "datos", render: false }); pintarC(); }
  });
  pintarC();
  return h("div", { class: "campo" }, h("span", { text: "Características" }), cont, sug);
}
function documentos() {
  const I = ob(["inmueble"]);
  const cont = h("div", { class: "tarjeta" });
  const pintarD = () => {
    const docs = I().documentos ?? [];
    cont.replaceChildren(
      ...docs.map((d, i) => h("div", { class: "fila", style: { marginBottom: "8px", flexWrap: "nowrap" } },
        campo(() => I().documentos[i], "nombre", { etiqueta: "Nombre" }),
        campo(() => I().documentos[i], "url", { etiqueta: "Archivo o enlace" }),
        h("button", { class: "btn fantasma icono-btn", style: { alignSelf: "flex-end" }, "aria-label": "Quitar documento", onclick: () => { cambiar(() => { I().documentos.splice(i, 1); }, { tipo: "datos", render: false }); pintarD(); } }, icono("basura", 16)))),
      h("div", { class: "fila" },
        h("button", { class: "btn peq", onclick: async () => {
          const [f] = await elegirArchivos({ aceptar: "application/pdf,image/*" });
          if (!f) return;
          const ext = (f.name.split(".").pop() || "pdf").toLowerCase();
          const ruta = rutaLibre(`docs/${slug(f.name.replace(/\.[^.]+$/, ""))}`, ext);
          await guardarArchivo(ruta, f);
          cambiar(() => { const o = I(); o.documentos ??= []; o.documentos.push({ nombre: f.name.replace(/\.[^.]+$/, ""), url: ruta }); }, { tipo: "datos", render: false });
          pintarD();
        } }, icono("subir", 14), "Subir PDF"),
        h("button", { class: "btn peq fantasma", onclick: () => { cambiar(() => { const o = I(); o.documentos ??= []; o.documentos.push({ nombre: "", url: "" }); }, { tipo: "datos", render: false }); pintarD(); } }, icono("mas", 14), "Añadir enlace"),
        h("span", { class: "tenue", style: { fontSize: "12.5px" }, text: "Memoria de calidades, nota simple, planos…" })));
  };
  pintarD();
  return cont;
}

// ------------------------------------------------------------------ marca y agente
function subidaImagen(obj, clave, carpeta, nombre, etiqueta) {
  const cont = h("div", { class: "campo" });
  const pintarS = () => {
    const ruta = obj()[clave];
    cont.replaceChildren(h("span", { text: etiqueta }), h("div", { class: "fila" },
      ruta ? h("img", { src: urlDe(ruta), alt: "", style: { height: "44px", maxWidth: "140px", objectFit: "contain", background: "#fff1", borderRadius: "6px", padding: "4px" } }) : null,
      h("button", { class: "btn peq", onclick: async () => {
        const [f] = await elegirArchivos({ aceptar: "image/png,image/jpeg,image/svg+xml,image/webp" });
        if (!f) return;
        const ext = f.type === "image/svg+xml" ? "svg" : f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
        const r = rutaLibre(`${carpeta}/${nombre}`, ext);
        await guardarArchivo(r, f);
        cambiar(() => { obj()[clave] = r; }, { tipo: "datos", render: false });
        pintarS();
      } }, icono("subir", 14), ruta ? "Cambiar" : "Subir"),
      ruta ? h("button", { class: "btn peq fantasma", onclick: () => { cambiar(() => { delete obj()[clave]; }, { tipo: "datos", render: false }); pintarS(); } }, "Quitar") : null));
  };
  pintarS();
  return cont;
}
function marca() {
  const M = ob(["marca"]), A = ob(["agente"]);
  const color = h("input", { type: "color", value: M().color ?? "#c8a24a", "aria-label": "Color de marca" });
  const hex = h("input", { type: "text", value: M().color ?? "#c8a24a", style: { width: "110px" }, "aria-label": "Color hexadecimal" });
  const fijar = (v) => { if (/^#[0-9a-f]{6}$/i.test(v)) { cambiar(() => { M().color = v.toLowerCase(); }, { clave: "color-marca", tipo: "datos", render: false }); color.value = v; hex.value = v; } };
  color.oninput = () => fijar(color.value);
  hex.oninput = () => fijar(hex.value);
  return h("div", {},
    h("div", { class: "tarjeta" }, h("div", { class: "rejilla" },
      campo(M, "nombre", { etiqueta: "Nombre de la inmobiliaria", placeholder: "Inmobiliaria Ejemplo" }),
      campo(M, "web", { etiqueta: "Web", tipo: "url", placeholder: "https://www.ejemplo.com" }),
      h("div", { class: "campo" }, h("span", { text: "Color de acento" }), h("div", { class: "fila", style: { flexWrap: "nowrap" } }, color, hex,
        h("div", { class: "fila", style: { gap: "4px" } }, ["#c8a24a", "#1f6f5c", "#2b4c7e", "#b5473a", "#222222"].map((c) => h("button", { type: "button", class: "muestra", style: { background: c, cursor: "pointer" }, title: c, "aria-label": `Usar ${c}`, onclick: () => fijar(c) }))))),
      subidaImagen(M, "logo", "marca", "logo", "Logo (SVG o PNG transparente)"),
      h("div", { class: "ancho-todo" }, campoTexto(M, "pie_legal", { etiqueta: "Pie legal", placeholder: "Agente inscrito en el registro AICAT nº 0000 · CIF B00000000", tipo: "datos" })))),
    h("h2", { class: "sub", text: "Agente" }),
    h("div", { class: "tarjeta" }, h("div", { class: "rejilla" },
      campo(A, "nombre", { etiqueta: "Nombre", placeholder: "Ana Pérez" }),
      campo(A, "telefono", { etiqueta: "Teléfono", tipo: "tel", placeholder: "+34 600 111 222" }),
      campo(A, "email", { etiqueta: "Email", tipo: "email", placeholder: "ana@ejemplo.com" }),
      subidaImagen(A, "foto", "marca", "agente", "Foto"))));
}

// ------------------------------------------------------------------ contacto
function contacto() {
  const C = ob(["contacto"]);
  const modo = h("div", { class: "segmentado", role: "group", "aria-label": "Modo de contacto" });
  const pintarModo = () => modo.replaceChildren(...[["whatsapp", "WhatsApp"], ["webhook", "Formulario (webhook)"], ["ambos", "Ambos"]].map(([v, t]) => h("button", {
    type: "button", text: t, "aria-pressed": String((C().modo ?? "whatsapp") === v), onclick: () => { cambiar(() => { C().modo = v; }, { tipo: "datos", render: false }); pintar(); },
  })));
  pintarModo();
  const m = C().modo ?? "whatsapp";
  const res = h("span", { class: "tenue", style: { fontSize: "12.5px" } });
  const probar = async () => {
    const url = C().webhook;
    if (!/^https:\/\//.test(url ?? "")) return toast("Introduce una URL https:// válida", "aviso");
    const datos = { nombre: "Prueba del Estudio", telefono: "+34 600 000 000", pregunta: "Mensaje de prueba", referencia: T().inmueble?.referencia ?? "",
      estancia: "", url: location.href, fecha: new Date().toISOString(), idioma: "es", prueba: true };
    res.textContent = "Enviando…";
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) });
      res.textContent = r.ok ? `✓ Recibido (HTTP ${r.status})` : `✗ El servidor respondió ${r.status}`;
      res.style.color = r.ok ? "var(--ok)" : "var(--error)";
    } catch {
      try {
        await fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(datos) });
        res.textContent = "Enviado, pero el servidor no permite confirmar la respuesta (CORS). Revisa que haya llegado en Make/Zapier/n8n.";
        res.style.color = "var(--aviso)";
      } catch (e) { res.textContent = `✗ No se pudo enviar: ${e.message}`; res.style.color = "var(--error)"; }
    }
  };
  return h("div", {},
    h("div", { class: "tarjeta" },
      h("div", { class: "campo" }, h("span", { text: "¿Cómo quieres recibir los contactos?" }), modo),
      h("div", { class: "rejilla", style: { marginTop: "14px" } },
        m !== "webhook" ? campo(C, "whatsapp", { etiqueta: "Número de WhatsApp de la empresa", tipo: "tel", placeholder: "34600111222", ayuda: "Formato internacional sin + ni espacios",
          validar: (v) => (v && !/^\d{8,15}$/.test(String(v).replace(/[\s+]/g, "")) ? "Número no válido" : "") }) : null,
        m !== "whatsapp" ? h("div", { class: "ancho-2" }, campo(C, "webhook", { etiqueta: "URL del webhook (Make, Zapier, n8n, CRM)", tipo: "url", placeholder: "https://hook.eu1.make.com/…",
          ayuda: "Recibe un POST JSON con nombre, teléfono, pregunta, referencia, estancia, url, fecha e idioma", validar: (v) => (v && !/^https:\/\//.test(v) ? "Debe empezar por https://" : "") }),
          h("div", { class: "fila", style: { marginTop: "6px" } }, h("button", { class: "btn peq", onclick: probar }, "Probar webhook"), res)) : null)),
    h("h2", { class: "sub", text: "Privacidad (RGPD)" }),
    h("div", { class: "tarjeta" }, h("div", { class: "rejilla" },
      h("div", { class: "ancho-2" }, campo(C, "url_privacidad", { etiqueta: "URL de la política de privacidad", tipo: "url", placeholder: "https://www.ejemplo.com/privacidad" })),
      h("div", { class: "ancho-todo" }, campoTexto(C, "texto_privacidad", { etiqueta: "Texto junto al formulario", tipo: "datos",
        placeholder: "Responsable: Inmobiliaria Ejemplo. Finalidad: atender tu consulta. Puedes ejercer tus derechos en…" })))));
}

// ------------------------------------------------------------------ idiomas y textos
function textos() {
  const t = T();
  const marcas = h("div", { class: "fila" }, Object.entries(IDIOMAS).map(([c, n]) => {
    const i = h("input", { type: "checkbox", checked: (t.idiomas ?? ["es"]).includes(c), disabled: c === "es" });
    i.onchange = () => { cambiar((tt) => { const s = new Set(tt.idiomas ?? ["es"]); i.checked ? s.add(c) : s.delete(c); tt.idiomas = Object.keys(IDIOMAS).filter((x) => s.has(x)); if (!tt.idiomas.includes(tt.idioma)) tt.idioma = "es"; }, { tipo: "datos" }); pintar(); };
    return h("label", { class: "check" }, i, n);
  }));
  const fila = (etq, el) => h("div", { class: "fila", style: { alignItems: "flex-start", flexWrap: "nowrap", marginBottom: "8px" } }, h("span", { class: "suave", text: etq, style: { width: "170px", flex: "0 0 auto", paddingTop: "8px", fontSize: "13px" } }), h("div", { style: { flex: 1, minWidth: 0 } }, el));
  return h("div", {},
    h("div", { class: "tarjeta" },
      h("div", { class: "campo" }, h("span", { text: "Idiomas del visor" }), marcas),
      h("div", { class: "rejilla", style: { marginTop: "12px" } },
        campo(() => app.tour, "idioma", { etiqueta: "Idioma por defecto", tipo: "select", opciones: (t.idiomas ?? ["es"]).map((c) => [c, IDIOMAS[c] ?? c]) })),
      h("p", { class: "tenue", style: { fontSize: "12.5px", marginBottom: 0 } }, "Cada texto traducible tiene pestañas de idioma (", h("kbd", { text: "Alt" }), "+", h("kbd", { text: "1" }), h("kbd", { text: "2" }), "). Un punto amarillo indica que falta la traducción; si falta, se muestra el español.")),
    h("h2", { class: "sub", text: "Textos principales" }),
    h("div", { class: "tarjeta" },
      fila("Título", campoTexto(() => app.tour, "titulo", { etiqueta: "Título", compacto: true, tipo: "datos" })),
      fila("Descripción", campoTexto(ob(["inmueble"]), "descripcion", { etiqueta: "Descripción", compacto: true, multilinea: true, tipo: "datos" })),
      fila("Aviso legal", campoTexto(ob(["inmueble"]), "aviso_legal", { etiqueta: "Aviso legal", compacto: true, tipo: "datos" }))),
    h("h2", { class: "sub", text: "Nombres de las estancias (fotos)" }),
    h("div", { class: "tarjeta" }, t.panoramas.length ? t.panoramas.map((p, i) => fila(`${i + 1}. ${textoDe(p.nombre) || p.id}`, campoTexto(() => pano(p.id), "nombre", { etiqueta: "Nombre", compacto: true, tipo: "datos" })))
      : h("p", { class: "tenue", style: { margin: 0 }, text: "Aún no hay fotos." })),
    t.estancias?.length ? [h("h2", { class: "sub", text: "Estancias del plano" }),
      h("div", { class: "tarjeta" }, t.estancias.map((e) => fila(textoDe(e.nombre) || e.id, campoTexto(() => app.tour.estancias.find((x) => x.id === e.id), "nombre", { etiqueta: "Nombre", compacto: true, tipo: "datos" }))))] : null,
    h("h2", { class: "sub", text: "Plantas" }),
    h("div", { class: "tarjeta" }, t.plantas.map((pl) => fila(textoDe(pl.nombre) || pl.id, campoTexto(() => app.tour.plantas.find((x) => x.id === pl.id), "nombre", { etiqueta: "Nombre", compacto: true, tipo: "datos" })))));
}

// ------------------------------------------------------------------ colores y estilos
function paleta(clave, titulo, defecto) {
  const lista = () => (app.tour.personalizacion ??= { paredes: [], suelos: [] })[clave] ??= [];
  const cont = h("div", { class: "paleta" });
  const pintarP = () => {
    cont.replaceChildren(...lista().map((c, i) => {
      const col = h("input", { type: "color", value: c.color, "aria-label": `Color ${textoDe(c.nombre)}` });
      col.oninput = () => cambiar(() => { lista()[i].color = col.value; }, { clave: `pal-${clave}-${i}`, tipo: "datos", render: false });
      return h("div", { class: "fila" }, col,
        h("div", { style: { flex: 1, minWidth: 0 } }, campoTexto(() => lista()[i], "nombre", { etiqueta: "Nombre del color", compacto: true, tipo: "datos" })),
        h("button", { class: "btn fantasma icono-btn", "aria-label": "Quitar color", onclick: () => { cambiar(() => { lista().splice(i, 1); }, { tipo: "datos", render: false }); pintarP(); } }, icono("basura", 15)));
    }),
    h("div", { class: "fila" },
      h("button", { class: "btn peq", onclick: () => { cambiar(() => { lista().push({ nombre: { es: "Nuevo color" }, color: "#cccccc" }); }, { tipo: "datos", render: false }); pintarP(); } }, icono("mas", 14), "Añadir color"),
      h("button", { class: "btn peq fantasma", onclick: async () => { if (await confirmar("Restaurar paleta", `Se recuperarán los ${defecto.length} colores por defecto.`, "Restaurar")) { cambiar((t) => { t.personalizacion[clave] = structuredClone(defecto); }, { tipo: "datos", render: false }); pintarP(); } } }, "Restaurar por defecto")));
  };
  pintarP();
  return h("div", { class: "tarjeta" }, h("h3", { style: { margin: "0 0 10px", fontSize: "14px" }, text: titulo }), cont);
}
function personalizacion() {
  const t = T();
  const conMascara = t.panoramas.filter((p) => p.mascara).length;
  const estilos = h("div", { class: "tarjeta" });
  const pintarE = () => {
    const usados = new Set(t.panoramas.flatMap((p) => (p.variantes ?? []).map((v) => v.estilo)));
    estilos.replaceChildren(
      h("p", { class: "suave", style: { marginTop: 0 }, text: "Estilos que puede elegir el cliente. Solo se publican los que tienen imágenes en alguna estancia." }),
      ...(app.tour.estilos ?? []).map((e, i) => h("div", { class: "fila", style: { marginBottom: "6px", flexWrap: "nowrap" } },
        h("span", { class: `chip ${e.id === "original" ? "" : usados.has(e.id) ? "ok" : ""}`, style: { width: "120px", justifyContent: "center" }, text: e.id === "original" ? "base" : usados.has(e.id) ? "con imágenes" : "sin imágenes" }),
        h("div", { style: { flex: 1, minWidth: 0 } }, campoTexto(() => app.tour.estilos[i], "nombre", { etiqueta: "Nombre del estilo", compacto: true, tipo: "datos" })),
        e.id !== "original" ? h("button", { class: "btn fantasma icono-btn", "aria-label": "Quitar estilo", onclick: () => { cambiar(() => { app.tour.estilos.splice(i, 1); }, { tipo: "datos", render: false }); pintarE(); } }, icono("basura", 15)) : h("span", { style: { width: "34px" } }))),
      h("button", { class: "btn peq fantasma", onclick: () => { cambiar((tt) => { for (const e of ESTILOS_IA) if (!tt.estilos.some((x) => x.id === e.id)) tt.estilos.push(structuredClone(e)); }, { tipo: "datos", render: false }); pintarE(); } }, "Restaurar los 5 estilos"));
  };
  pintarE();
  const momentos = h("div", { class: "fila" }, MOMENTOS.map((m) => {
    const i = h("input", { type: "checkbox", checked: (t.momentos ?? []).includes(m.id), disabled: m.id === "dia" });
    i.onchange = () => cambiar((tt) => { const s = new Set(tt.momentos ?? ["dia"]); i.checked ? s.add(m.id) : s.delete(m.id); tt.momentos = MOMENTOS.map((x) => x.id).filter((x) => s.has(x)); }, { tipo: "datos", render: false });
    return h("label", { class: "check" }, i, m.nombre);
  }));
  return h("div", {},
    h("p", { class: "suave", style: { marginTop: 0 } }, conMascara ? `${conMascara} estancia(s) tienen máscara: el cliente podrá probar estos colores.` : "Para que el cliente pueda cambiar colores, crea la máscara de paredes y suelo en el paso Variantes.",
      " ", h("a", { href: "#", onclick: (e) => { e.preventDefault(); emitir("ir", { seccion: "variantes" }); } }, "Ir a Variantes")),
    h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "12px" } },
      paleta("paredes", "Colores de pared", PAREDES_DEF), paleta("suelos", "Tonos de suelo", SUELOS_DEF)),
    h("h2", { class: "sub", text: "Estilos de decoración" }), estilos,
    h("h2", { class: "sub", text: "Momentos del día" }),
    h("div", { class: "tarjeta" }, momentos, h("p", { class: "tenue", style: { fontSize: "12.5px", marginBottom: 0 }, text: "Si no subes fotos de atardecer o noche, el visor las simula sobre la foto de día." })),
    h("h2", { class: "sub", text: "Aviso legal de imágenes" }),
    h("div", { class: "tarjeta" },
      campoTexto(ob(["inmueble"]), "aviso_legal", { etiqueta: "Aviso que se muestra con los estilos", tipo: "datos", placeholder: "Imágenes de estilos generadas con IA, con fines orientativos. El mobiliario no está incluido." }),
      h("button", { class: "btn peq fantasma", style: { marginTop: "8px" }, onclick: () => { cambiar(() => { ob(["inmueble"])().aviso_legal = { es: "Imágenes no contractuales. Los renders y los estilos de decoración (generados con inteligencia artificial) son orientativos; el mobiliario y la decoración no están incluidos.", en: "Images are for illustrative purposes only. Renders and decoration styles (AI-generated) are indicative; furniture and decoration are not included." }; }, { tipo: "datos" }); pintar(); } }, "Usar texto recomendado")));
}

// ------------------------------------------------------------------ secciones (agrupar estancias)
const SECCIONES_DEF = [
  ["dia", { es: "Zona de día", en: "Living area" }, /sal[oó]n|estar|comedor|cocina|office|recibidor|entrada|hall|living|kitchen|dining/i],
  ["noche", { es: "Zona de noche", en: "Sleeping area" }, /dormitorio|habitaci[oó]n|suite|ba[nñ]o|aseo|vestidor|bedroom|bath/i],
  ["exterior", { es: "Exterior y zonas comunes", en: "Outdoor & common areas" }, /terraza|jard[ií]n|piscina|balc[oó]n|patio|garaje|trastero|fachada|comunidad|portal|azotea|exterior|terrace|garden|pool/i],
];
export function seccionesSugeridas(t) {
  const r = SECCIONES_DEF.map(([id, nombre]) => ({ id, nombre: structuredClone(nombre), estancias: [] }));
  for (const p of t.panoramas) {
    const n = textoDe(p.nombre) + " " + p.id;
    const i = SECCIONES_DEF.findIndex(([, , re]) => re.test(n));
    r[i >= 0 ? i : 0].estancias.push(p.id);
  }
  return r;
}
function secciones() {
  const t = T();
  const activo = Array.isArray(t.secciones);
  const lista = activo ? t.secciones : seccionesSugeridas(t);
  const materializar = () => { if (!Array.isArray(app.tour.secciones)) app.tour.secciones = seccionesSugeridas(app.tour); };
  const de = (pid) => lista.findIndex((s) => (s.estancias ?? []).includes(pid));
  return h("div", {},
    h("p", { class: "suave", style: { marginTop: 0 }, text: "Agrupa las estancias para que el cliente las encuentre en la galería y en el formulario de contacto. Se proponen grupos según los nombres." }),
    h("div", { class: "fila", style: { marginBottom: "12px" } },
      activo ? h("span", { class: "chip acento", text: "Secciones activas" }) : h("span", { class: "chip", text: "Sugerencia (aún sin activar)" }),
      h("div", { style: { flex: 1 } }),
      !activo ? h("button", { class: "btn peq primario", onclick: () => { cambiar(materializar, { tipo: "datos" }); pintar(); } }, "Usar secciones") : null,
      activo ? h("button", { class: "btn peq", onclick: () => { cambiar(() => { app.tour.secciones.push({ id: `seccion-${app.tour.secciones.length + 1}`, nombre: { es: "Nueva sección" }, estancias: [] }); }, { tipo: "datos" }); pintar(); } }, icono("mas", 14), "Añadir sección") : null,
      activo ? h("button", { class: "btn peq fantasma", onclick: () => { cambiar(() => { app.tour.secciones = seccionesSugeridas(app.tour); }, { tipo: "datos" }); pintar(); } }, "Volver a sugerir") : null,
      activo ? h("button", { class: "btn peq fantasma", onclick: () => { cambiar(() => { delete app.tour.secciones; }, { tipo: "datos" }); pintar(); } }, "No usar secciones") : null),
    h("div", { class: "tarjeta" },
      activo ? h("div", { style: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" } }, t.secciones.map((s, i) => h("div", { class: "fila", style: { flexWrap: "nowrap" } },
        h("div", { style: { flex: 1 } }, campoTexto(() => app.tour.secciones[i], "nombre", { etiqueta: "Nombre de la sección", compacto: true, tipo: "datos" })),
        h("span", { class: "chip", text: `${s.estancias?.length ?? 0} estancias` }),
        h("button", { class: "btn fantasma icono-btn", "aria-label": "Quitar sección", onclick: () => { cambiar(() => { app.tour.secciones.splice(i, 1); }, { tipo: "datos" }); pintar(); } }, icono("basura", 15))))) : null,
      t.panoramas.length ? t.panoramas.map((p) => {
        const sel = h("select", { "aria-label": `Sección de ${textoDe(p.nombre)}`, disabled: !activo }, h("option", { value: "-1", text: "— Sin sección —" }), lista.map((s, i) => h("option", { value: String(i), text: textoDe(s.nombre) })));
        sel.value = String(de(p.id));
        sel.onchange = () => { cambiar(() => { materializar(); for (const s of app.tour.secciones) s.estancias = (s.estancias ?? []).filter((x) => x !== p.id); const j = Number(sel.value); if (j >= 0) app.tour.secciones[j].estancias.push(p.id); }, { tipo: "datos" }); };
        return h("div", { class: "fila", style: { flexWrap: "nowrap", marginBottom: "6px" } },
          h("img", { src: urlDe(p.miniatura), alt: "", style: { width: "64px", height: "32px", objectFit: "cover", borderRadius: "4px" } }),
          h("span", { style: { flex: 1 }, text: textoDe(p.nombre) || p.id }), h("div", { style: { width: "240px" } }, sel));
      }) : h("p", { class: "tenue", style: { margin: 0 }, text: "Añade fotos para agruparlas." })));
}

// ------------------------------------------------------------------ visita guiada
function guion() {
  const t = T();
  const personalizado = Array.isArray(t.guion);
  const paradas = personalizado ? t.guion : t.panoramas.map((p) => ({ nodo: p.id, segundos: 5 }));
  const materializar = () => { if (!Array.isArray(app.tour.guion)) app.tour.guion = app.tour.panoramas.map((p) => ({ nodo: p.id, segundos: 5 })); };
  const lista = h("div", { class: "lista-guion" }, paradas.map((g, i) => {
    const sel = h("select", { "aria-label": "Estancia" }, t.panoramas.map((p) => h("option", { value: p.id, text: textoDe(p.nombre) || p.id })));
    sel.value = g.nodo;
    sel.onchange = () => { cambiar(() => { materializar(); app.tour.guion[i].nodo = sel.value; }, { tipo: "datos" }); };
    const seg = h("input", { type: "number", min: 2, max: 30, step: 1, value: g.segundos ?? 5, "aria-label": "Segundos" });
    seg.oninput = () => cambiar(() => { materializar(); app.tour.guion[i].segundos = Number(seg.value) || 5; }, { clave: `seg${i}`, tipo: "datos", render: false });
    const rumbo = h("button", { class: "btn peq", title: "Usar la dirección actual de la vista previa", onclick: () => {
      const v = app.vista;
      if (!v || v.nodo !== g.nodo) { app.nodo = g.nodo; emitir("nodo", {}); return toast("Gira la vista previa hacia donde quieres mirar y vuelve a pulsar", "info"); }
      cambiar(() => { materializar(); app.tour.guion[i].rumbo = Math.round(((v.rumbo % 360) + 360) % 360); }, { tipo: "datos" });
    } }, g.rumbo != null ? `${Math.round(g.rumbo)}°` : "Mirar…");
    return h("div", {},
      h("div", { class: "parada" },
        h("span", { class: "n", text: i + 1 }),
        h("button", { class: "btn fantasma peq icono-btn", title: "Subir", "aria-label": "Subir", disabled: i === 0, onclick: () => cambiar(() => { materializar(); const a = app.tour.guion; [a[i - 1], a[i]] = [a[i], a[i - 1]]; }, { tipo: "datos" }) }, h("span", { text: "↑" })),
        sel, h("label", { class: "fila", style: { gap: "4px", flexWrap: "nowrap" } }, seg, h("span", { class: "tenue", text: "s" })), rumbo,
        h("button", { class: "btn fantasma peq icono-btn", "aria-label": "Quitar parada", onclick: () => cambiar(() => { materializar(); app.tour.guion.splice(i, 1); }, { tipo: "datos" }) }, icono("basura", 14))),
      personalizado ? h("div", { style: { padding: "6px 0 4px 60px" } }, campoTexto(() => app.tour.guion[i], "texto", { etiqueta: "Texto en pantalla", compacto: true, tipo: "datos", placeholder: "Texto opcional que aparece en esta parada" })) : null);
  }));
  return h("div", {},
    h("p", { class: "suave", style: { marginTop: 0 }, text: "Recorrido automático para la visita guiada y para el vídeo. Paradas de 4–6 s con giros lentos se ven mejor." }),
    h("div", { class: "fila", style: { marginBottom: "12px" } },
      personalizado ? h("span", { class: "chip acento", text: "Guion personalizado" }) : h("span", { class: "chip", text: "Por defecto: orden de las fotos" }),
      h("div", { style: { flex: 1 } }),
      h("button", { class: "btn peq", disabled: !t.panoramas.length, onclick: () => cambiar(() => { materializar(); app.tour.guion.push({ nodo: app.nodo ?? app.tour.panoramas[0].id, segundos: 5 }); }, { tipo: "datos" }) }, icono("mas", 14), "Añadir parada"),
      personalizado ? h("button", { class: "btn peq fantasma", onclick: () => cambiar(() => { delete app.tour.guion; }, { tipo: "datos" }) }, "Volver al orden de las fotos") : null),
    t.panoramas.length ? lista : h("p", { class: "tenue", text: "Añade fotos para preparar la visita guiada." }));
}

export const seccionDatos = {
  id: "datos", titulo: "Datos del anuncio", corto: "Datos",
  resumen: () => {
    const i = app.tour.inmueble ?? {};
    const ok = !!(i.precio && (i.certificado_energetico?.consumo_letra || i.certificado_energetico?.en_tramite) && (app.tour.contacto?.whatsapp || app.tour.contacto?.webhook));
    return { texto: "Inmueble, marca, contacto", hecho: ok };
  },
  render: (c, op) => render(c, op),
  actualizar: () => { if (!raiz?.contains(document.activeElement) || document.activeElement?.tagName === "BUTTON") pintar(); },
  salir: () => { raiz = null; },
};
