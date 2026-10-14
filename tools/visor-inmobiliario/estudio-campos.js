// Componentes de formulario enlazados al tour (con deshacer agrupado por campo).
import { app, h, cambiar, textoDe, fijarTexto, IDIOMAS } from "./estudio-nucleo.js";

let n = 0;
const uid = () => `c${++n}`;

/**
 * Campo de texto traducible (tipo Texto: cadena o {es, en}). obj: () => objeto actual del tour.
 */
export function campoTexto(obj, clave, { etiqueta, multilinea = false, placeholder = "", compacto = false, tipo = "datos", alCambiar, ayuda } = {}) {
  const idiomas = () => (app.tour.idiomas?.length ? app.tour.idiomas : ["es"]);
  let idioma = idiomas()[0];
  const id = uid();
  const input = h(multilinea ? "textarea" : "input", { id, placeholder, rows: multilinea ? 4 : null });
  const tabs = h("div", { class: "idiomas", role: "group", "aria-label": "Idioma" });
  const leer = () => {
    const t = obj()?.[clave];
    return t == null ? "" : typeof t === "string" ? (idioma === idiomas()[0] ? t : "") : t[idioma] ?? "";
  };
  const pintarTabs = () => {
    const ids = idiomas();
    tabs.hidden = ids.length < 2;
    tabs.replaceChildren(...ids.map((c) => {
      const t = obj()?.[clave];
      const vacio = !(typeof t === "string" ? c === ids[0] && t : t?.[c]);
      return h("button", { type: "button", text: c, title: IDIOMAS[c] ?? c, "aria-pressed": String(c === idioma), class: vacio ? "vacio" : "",
        onclick: () => { idioma = c; input.value = leer(); input.placeholder = c === ids[0] ? placeholder : textoDe(obj()?.[clave], ids[0]) || placeholder; pintarTabs(); input.focus(); } });
    }));
  };
  input.value = leer();
  input.addEventListener("input", () => {
    cambiar(() => {
      const o = obj();
      fijarTexto(o, clave, idioma, input.value);
    }, { clave: `${id}:${idioma}`, tipo, render: false });
    pintarTabs();
    alCambiar?.(input.value);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !multilinea) { e.preventDefault(); input.blur(); return; }
    if (e.altKey && /^[1-9]$/.test(e.key)) { const c = idiomas()[+e.key - 1]; if (c) { e.preventDefault(); tabs.querySelector(`button:nth-child(${e.key})`)?.click(); } }
  });
  pintarTabs();
  const envoltorio = h("div", { class: "campo texto-trad" },
    etiqueta && !compacto ? h("label", { for: id, class: "etq-campo", text: etiqueta }) : null,
    tabs, input, ayuda ? h("small", { text: ayuda }) : null);
  if (compacto) { envoltorio.classList.add("compacto"); input.setAttribute("aria-label", etiqueta ?? clave); }
  envoltorio.input = input;
  return envoltorio;
}

/** Campo simple: tipo text/number/url/email/tel/select/check/color/textarea. */
export function campo(obj, clave, { etiqueta, tipo = "text", placeholder = "", opciones, ayuda, min, max, paso, tipoCambio = "datos", clase = "", alCambiar, validar } = {}) {
  const id = uid();
  const leer = () => obj()?.[clave];
  const escribir = (v) => cambiar(() => {
    const o = obj();
    if (v === "" || v == null || (typeof v === "number" && Number.isNaN(v))) delete o[clave];
    else o[clave] = v;
  }, { clave: `${id}`, tipo: tipoCambio, render: false });
  let input;
  if (tipo === "check") {
    input = h("input", { type: "checkbox", id, checked: !!leer() });
    input.onchange = () => { escribir(input.checked ? true : false); alCambiar?.(input.checked); };
    return h("label", { class: `check ${clase}`, for: id }, input, h("span", { text: etiqueta }));
  }
  if (tipo === "select") {
    input = h("select", { id }, ...(opciones ?? []).map(([v, t]) => h("option", { value: v, text: t })));
    input.value = leer() ?? "";
    input.onchange = () => { escribir(input.value); alCambiar?.(input.value); };
  } else if (tipo === "textarea") {
    input = h("textarea", { id, placeholder, rows: 3 });
    input.value = leer() ?? "";
    input.oninput = () => { escribir(input.value); alCambiar?.(input.value); };
  } else {
    input = h("input", { id, type: tipo, placeholder, min, max, step: paso ?? (tipo === "number" ? "any" : null) });
    const v = leer();
    input.value = v ?? "";
    input.oninput = () => {
      const val = tipo === "number" ? (input.value === "" ? "" : Number(input.value)) : input.value;
      const err = validar?.(val);
      input.classList.toggle("invalido", !!err);
      input.title = err || "";
      escribir(val);
      alCambiar?.(val);
    };
    if (validar) { const err = validar(v ?? ""); input.classList.toggle("invalido", !!err && v != null && v !== ""); }
  }
  return h("div", { class: `campo ${clase}` }, h("label", { for: id, text: etiqueta }), input, ayuda ? h("small", { text: ayuda }) : null);
}

/** Campo booleano tri-estado (sí / no / sin indicar) como control segmentado. */
export function campoSiNo(obj, clave, etiqueta) {
  const g = h("div", { class: "segmentado", role: "group", "aria-label": etiqueta });
  const pintar = () => {
    const v = obj()?.[clave];
    g.replaceChildren(...[["", "—"], [true, "Sí"], [false, "No"]].map(([val, t]) => h("button", {
      type: "button", text: t, "aria-pressed": String(v === val || (val === "" && v == null)),
      onclick: () => { cambiar(() => { const o = obj(); if (val === "") delete o[clave]; else o[clave] = val; }, { tipo: "datos", render: false }); pintar(); },
    })));
  };
  pintar();
  return h("div", { class: "campo" }, h("span", { text: etiqueta }), g);
}
