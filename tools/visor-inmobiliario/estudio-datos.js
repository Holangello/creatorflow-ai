// Paso 3 · Datos: lo que verá el cliente en la ficha del visor y en el dossier (S-2 · S-5 · E6 · E11).
//   Inmueble: lo esencial a la vista (venta o alquiler, precio, superficies, habitaciones, baños y certificado energético),
//   con el título y la referencia automáticos y editables; el resto, plegado en «Más datos del inmueble».
//   Contacto: sale de «Mi inmobiliaria» (o, como excepción, uno propio de este inmueble).
//   Idiomas y traducciones: el único sitio donde se traducen los textos (E11). Solo es, en, fr y de (E2).
import { app, h, cambiar, emitir, on, textoDe, textoExacto, IDIOMAS, tituloAuto, textosTraducibles, VIDRIO } from "./estudio-nucleo.js";
import { campoTexto, campo, campoSiNo } from "./estudio-campos.js";
import { tarjetaContacto, traducirPerfil } from "./estudio-perfil.js";

const LETRAS = ["A", "B", "C", "D", "E", "F", "G"]; // colores oficiales de la etiqueta energética: variables --ce-a … --ce-g
const SUGERENCIAS = ["Exterior", "Luminoso", "Armarios empotrados", "Cocina equipada", "Suelo radiante", "Ventanas con doble acristalamiento",
  "Puerta blindada", "Videoportero", "Zonas comunes", "Accesible", "Amueblado", "Vistas despejadas", "Balcón", "Lavadero"];
const TIPOS = [["piso", "Piso"], ["casa", "Casa"], ["chalet", "Chalet"], ["finca", "Finca"], ["adosado", "Adosado"], ["atico", "Ático"], ["duplex", "Dúplex"], ["estudio", "Estudio"],
  ["loft", "Loft"], ["local", "Local"], ["oficina", "Oficina"], ["nave", "Nave"], ["garaje", "Garaje"], ["terreno", "Terreno"]];

let raiz = null, idiomaTrad = null;
const abiertas = new Set();
const ob = (ruta) => () => { let o = app.tour; for (const k of ruta) { o[k] ??= {}; o = o[k]; } return o; };
/** Marcador del título: el automático (lo que se publicará si se deja vacío) o, sin datos aún, un ejemplo. */
const marcadorTitulo = () => tituloAuto() || (app.tour.inmueble?.operacion === "alquiler" ? "Ej.: Piso en alquiler · 2 hab. · 80 m²" : "Ej.: Piso en venta · 3 hab. · 112 m²");
// El título automático cambia con los datos (también con la dirección): se refresca en el marcador mientras se escribe.
const refrescarTitulo = () => { const i = raiz?.querySelector('[data-campo="titulo"] input'); if (i) i.placeholder = marcadorTitulo(); };

function render(cont, op = {}) {
  raiz = h("section", { class: "seccion seccion-datos" });
  cont.append(raiz);
  if (op.campo === "idiomas" || op.campo === "traducciones") abiertas.add("idiomas");
  pintar();
}
function pintar() {
  if (!raiz) return;
  raiz.replaceChildren(
    h("div", { class: "cab-seccion" }, h("div", {}, h("h1", { text: "Datos" }),
      h("p", { text: "Lo que verá el cliente en la ficha del visor y en el dossier. Lo imprescindible está a la vista; el resto es opcional." }))),
    esencial(),
    plegable("mas", "Más datos del inmueble (opcional)", masDatos, "mas-datos"),
    tarjetaContacto(),
    plegable("idiomas", "Idiomas y traducciones", idiomas, "idiomas"));
}
function plegable(id, titulo, fn, campoId) {
  const d = h("details", { class: `avanzado plegable-datos ${VIDRIO}`, open: abiertas.has(id), "data-campo": campoId }, h("summary", { text: titulo }), h("div", { class: "contenido" }, fn()));
  d.addEventListener("toggle", () => { if (d.open) abiertas.add(id); else abiertas.delete(id); });
  return d;
}

// ------------------------------------------------------------------ lo esencial
/** Control segmentado del sistema de diseño (radios reales). */
function segmentado(nombre, opciones, valor, alElegir, etiqueta) {
  return h("div", { class: "c8-segmentado", role: "radiogroup", "aria-label": etiqueta, "data-campo": nombre }, opciones.map(([v, t]) => {
    const r = h("input", { type: "radio", name: `seg-${nombre}`, value: v, checked: valor === v });
    r.onchange = () => { if (r.checked) alElegir(v); };
    return h("label", {}, r, h("span", { text: t }));
  }));
}
function esencial() {
  const I = ob(["inmueble"]);
  const alquiler = I().operacion === "alquiler";
  const num = (clave, etiqueta, extra = {}) => campo(I, clave, { etiqueta, tipo: "number", min: 0, alCambiar: refrescarTitulo, ...extra });
  const ref = app.tour._estudio.ref;
  return h("div", { class: `tarjeta ${VIDRIO} tarjeta-esencial` },
    h("div", { class: "fila-operacion" },
      segmentado("operacion", [["venta", "Venta"], ["alquiler", "Alquiler"]], alquiler ? "alquiler" : "venta",
        (v) => { cambiar(() => { I().operacion = v; }, { tipo: "datos" }); pintar(); }, "Operación"),
      campo(I, "tipo", { etiqueta: "Tipo", tipo: "select", opciones: TIPOS, alCambiar: refrescarTitulo }),
      campo(I, "estado_obra", { etiqueta: "Situación", tipo: "select", opciones: [["construido", "Construida"], ["proyecto", "Obra nueva o proyecto"]] })),
    h("div", { class: "mini-datos" },
      num("precio", alquiler ? "Alquiler (€/mes)" : "Precio (€)", { paso: alquiler ? 50 : 1000, placeholder: alquiler ? "Ej.: 1.200" : "Ej.: 349.000" }),
      num("superficie_construida", "m² construidos"),
      num("superficie_util", "m² útiles"),
      num("habitaciones", "Habitaciones", { paso: 1 }),
      num("banos", "Baños", { paso: 1 })),
    h("h2", { class: "sub", text: "Certificado energético (obligatorio en los anuncios)" }),
    certificado(),
    h("div", { class: "rejilla rejilla-auto" },
      h("div", { class: "ancho-2" }, campoTexto(() => app.tour, "titulo", { etiqueta: "Título del anuncio", placeholder: marcadorTitulo(), tipo: "datos",
        ayuda: "Automático si lo dejas vacío (también en los otros idiomas).", alCambiar: () => emitir("historial") })),
      campo(I, "referencia", { etiqueta: "Referencia", placeholder: ref || "Ej.: REF-1234",
        ayuda: ref ? "Automática si la dejas vacía. Va en los mensajes de WhatsApp y en la dirección de tu web." : "Va en los mensajes de WhatsApp y en la dirección de tu web." })));
}

/** Etiqueta energética: letras de consumo y emisiones + «en trámite» (los valores, en «Más datos»). */
function certificado() {
  const CE = ob(["inmueble", "certificado_energetico"]);
  const cont = h("div", { class: "pila" });
  const pintarCE = () => {
    const letras = (clave, etq) => {
      const g = h("div", { class: "letras-ce", role: "group", "aria-label": etq });
      const pintarL = () => g.replaceChildren(...LETRAS.map((l) => h("button", {
        type: "button", text: l, "data-l": l, style: `--ce: var(--ce-${l.toLowerCase()})`, "aria-pressed": String(CE()[clave] === l), "aria-label": `${etq}: letra ${l}`,
        onclick: () => { cambiar(() => { const o = CE(); if (o[clave] === l) delete o[clave]; else { o[clave] = l; delete o.en_tramite; } }, { tipo: "datos", render: false }); pintarL(); },
      })));
      pintarL();
      return h("div", { class: "campo" }, h("span", { text: etq }), g);
    };
    const trami = campo(CE, "en_tramite", { etiqueta: "Certificado en trámite", tipo: "check", alCambiar: () => pintarCE() });
    cont.replaceChildren(
      CE().en_tramite ? h("p", { class: "texto-sec", text: "Se mostrará «Certificado energético en trámite»." }) : h("div", { class: "rejilla" },
        letras("consumo_letra", "Consumo"), letras("emisiones_letra", "Emisiones")),
      h("div", {}, trami));
  };
  pintarCE();
  cont.dataset.campo = "certificado";
  return cont;
}

// ------------------------------------------------------------------ más datos (plegado)
function masDatos() {
  const I = ob(["inmueble"]);
  const CE = ob(["inmueble", "certificado_energetico"]);
  return h("div", {},
    h("div", { class: "rejilla" },
      campo(I, "gastos_comunidad_mes", { etiqueta: "Comunidad (€/mes)", tipo: "number", min: 0 }),
      campo(I, "ibi_anual", { etiqueta: "IBI (€/año)", tipo: "number", min: 0 }),
      campo(I, "planta", { etiqueta: "Planta", placeholder: "3ª, bajo, ático…" }),
      campo(I, "orientacion", { etiqueta: "Orientación", tipo: "select", opciones: [["", "—"], ...["Norte", "Noreste", "Este", "Sureste", "Sur", "Suroeste", "Oeste", "Noroeste"].map((o) => [o, o])] }),
      campo(I, "ano_construccion", { etiqueta: "Año de construcción", tipo: "number", min: 1800, max: 2100, paso: 1 }),
      campo(I, "estado", { etiqueta: "Estado", tipo: "select", opciones: [["", "—"], ["A estrenar", "A estrenar"], ["Reformado", "Reformado"], ["Buen estado", "Buen estado"], ["A reformar", "A reformar"]] }),
      campo(I, "calefaccion", { etiqueta: "Calefacción", placeholder: "Aerotermia, gas natural…" }),
      campo(I, "terraza", { etiqueta: "Terraza (m²)", tipo: "number", min: 0 }),
      campo(I, "superficie_parcela", { etiqueta: "Parcela (m²)", tipo: "number", min: 0 })),
    h("h2", { class: "sub", text: "Equipamiento" }),
    h("div", { class: "rejilla rejilla-sino" },
      campoSiNo(I, "ascensor", "Ascensor"), campoSiNo(I, "aire_acondicionado", "Aire acondicionado"), campoSiNo(I, "garaje", "Garaje"),
      campoSiNo(I, "trastero", "Trastero"), campoSiNo(I, "piscina", "Piscina"), campoSiNo(I, "jardin", "Jardín")),
    h("h2", { class: "sub", text: "Valores del certificado energético" }),
    h("div", { class: "rejilla" },
      campo(CE, "consumo_valor", { etiqueta: "Consumo (kWh/m²·año)", tipo: "number", min: 0 }),
      campo(CE, "emisiones_valor", { etiqueta: "Emisiones (kg CO₂/m²·año)", tipo: "number", min: 0 })),
    h("h2", { class: "sub", text: "Descripción y características" }),
    h("div", { class: "pila" },
      campoTexto(I, "descripcion", { etiqueta: "Descripción", multilinea: true, tipo: "datos", placeholder: "Describe el inmueble: distribución, calidades, entorno…" }),
      chips()),
    h("h2", { class: "sub", text: "Ubicación" }),
    h("div", { class: "rejilla" },
      h("div", { class: "ancho-2" }, campo(I, "direccion", { etiqueta: "Dirección", placeholder: "Ej.: Calle Mayor 12, Madrid", alCambiar: refrescarTitulo })),
      h("div", { class: "ancho-todo" }, campo(I, "mostrar_direccion_exacta", { etiqueta: "Mostrar la dirección exacta (si no, solo la zona)", tipo: "check", alCambiar: refrescarTitulo }))));
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

// ------------------------------------------------------------------ idiomas y traducciones (E11: el único sitio con idiomas)
function idiomas() {
  const t = app.tour;
  const activos = t.idiomas?.length ? t.idiomas : ["es"];
  const marcas = h("div", { class: "fila" }, Object.entries(IDIOMAS).map(([c, n]) => {
    const i = h("input", { type: "checkbox", checked: activos.includes(c), disabled: c === "es" });
    i.onchange = () => {
      cambiar((tt) => {
        const s = new Set(tt.idiomas ?? ["es"]);
        if (i.checked) s.add(c); else s.delete(c);
        tt.idiomas = Object.keys(IDIOMAS).filter((x) => s.has(x));
        if (!tt.idiomas.includes(tt.idioma)) tt.idioma = "es";
      }, { tipo: "datos" });
      if (i.checked) idiomaTrad = c;
      pintar();
    };
    return h("label", { class: "check" }, i, n);
  }));
  const extra = activos.filter((c) => c !== "es");
  if (!extra.includes(idiomaTrad)) idiomaTrad = extra[0] ?? null;
  const textos = textosTraducibles(t);
  const faltan = (c) => textos.filter(({ obj, clave }) => !textoExacto(obj()?.[clave], c).trim()).length;
  let traducciones = null;
  if (idiomaTrad) {
    const grupos = new Map();
    for (const x of textos) { if (!grupos.has(x.grupo)) grupos.set(x.grupo, []); grupos.get(x.grupo).push(x); }
    traducciones = h("div", { class: "traducciones" },
      extra.length > 1 ? segmentado("idioma-trad", extra.map((c) => [c, `${IDIOMAS[c]}${faltan(c) ? ` (${faltan(c)})` : ""}`]), idiomaTrad, (v) => { idiomaTrad = v; pintar(); }, "Idioma que traduces") : null,
      h("p", { class: "texto-pie nota-trad", text: faltan(idiomaTrad)
        ? `${faltan(idiomaTrad)} ${faltan(idiomaTrad) === 1 ? "texto sin traducir" : "textos sin traducir"} al ${IDIOMAS[idiomaTrad].toLowerCase()}: si falta la traducción, el visor muestra el español.`
        : `Todo traducido al ${IDIOMAS[idiomaTrad].toLowerCase()}.` }),
      textos.length ? [...grupos].map(([grupo, xs]) => h("div", { class: "grupo-trad" }, h("h3", { class: "c8-mayus", text: grupo }),
        xs.map((x) => {
          const idioma = idiomaTrad;
          const c = campoTexto(x.obj, x.clave, { etiqueta: `${x.etiqueta} (${IDIOMAS[idioma]})`, compacto: true, multilinea: x.largo, idioma, tipo: "datos" });
          // Textos de Mi inmobiliaria (pie legal, privacidad): la traducción vale también para los próximos recorridos.
          if (x.perfil) c.input.addEventListener("change", () => traducirPerfil(x.perfil, x.clave, idioma, c.input.value));
          return h("div", { class: "fila-trad" },
            h("div", { class: "original" }, h("small", { class: "tenue", text: x.etiqueta }), h("span", { text: textoExacto(x.obj()?.[x.clave]) })), c);
        })))
        : h("p", { class: "tenue", text: "Aún no hay textos que traducir." }));
  }
  return h("div", { class: "pila" },
    h("div", { class: "campo" }, h("span", { text: "Idiomas del visor" }), marcas),
    extra.length ? h("div", { class: "rejilla" },
      campo(() => app.tour, "idioma", { etiqueta: "Idioma con el que se abre", tipo: "select", opciones: activos.map((c) => [c, IDIOMAS[c] ?? c]) })) : null,
    h("p", { class: "texto-pie", text: extra.length ? "El título se traduce solo si es el automático. El resto de textos, aquí:" : "Activa otro idioma para traducir el título, la descripción, los nombres de las estancias y las notas." }),
    traducciones);
}

export const seccionDatos = {
  id: "datos", titulo: "Datos", corto: "Datos",
  resumen: () => {
    const i = app.tour.inmueble ?? {}, ce = i.certificado_energetico ?? {}, c = app.tour.contacto ?? {};
    const ok = !!(i.precio && ((ce.consumo_letra && ce.emisiones_letra) || ce.en_tramite) && (c.whatsapp || c.webhook));
    return { texto: "Precio, m², certificado…", hecho: ok };
  },
  render: (c, op) => render(c, op),
  actualizar: () => { if (!raiz?.contains(document.activeElement) || /^(BUTTON|SUMMARY)$/.test(document.activeElement?.tagName) || document.activeElement?.type === "radio") pintar(); },
  salir: () => { raiz = null; },
};
on("perfil", () => pintar());
