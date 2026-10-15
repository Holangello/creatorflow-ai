// Componentes de formulario enlazados al tour (con deshacer agrupado por campo).
import { h, cambiar, textoExacto, fijarTexto, urlPermitida, MENSAJE_URL } from "./estudio-nucleo.js";

let n = 0;
const uid = () => `c${++n}`;

/**
 * Campo de texto traducible (tipo Texto: cadena o {es, en}). obj: () => objeto actual del tour.
 * Edita el español; las traducciones se escriben solo en Datos → «Idiomas y traducciones» (E11), que pasa `idioma`.
 * campo: identificador para «Ver» / «Corregir» (data-campo; por defecto, la clave).
 */
export function campoTexto(obj, clave, { etiqueta, multilinea = false, placeholder = "", compacto = false, tipo = "datos", alCambiar, ayuda, idioma = "es", campo: dc } = {}) {
  const id = uid();
  const input = h(multilinea ? "textarea" : "input", { id, placeholder, rows: multilinea ? 4 : null });
  if (idioma !== "es") input.lang = idioma;
  input.value = textoExacto(obj()?.[clave], idioma);
  input.addEventListener("input", () => {
    cambiar(() => fijarTexto(obj(), clave, idioma, input.value), { clave: `${id}:${idioma}`, tipo, render: false });
    alCambiar?.(input.value);
  });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !multilinea) { e.preventDefault(); input.blur(); } });
  const envoltorio = h("div", { class: "campo", "data-campo": dc ?? clave },
    etiqueta && !compacto ? h("label", { for: id, class: "etq-campo", text: etiqueta }) : null,
    input, ayuda ? h("small", { text: ayuda }) : null);
  if (compacto) { envoltorio.classList.add("compacto"); input.setAttribute("aria-label", etiqueta ?? clave); }
  envoltorio.input = input;
  return envoltorio;
}

/** Campo simple: tipo text/number/url/email/tel/select/check/color/textarea. */
export function campo(obj, clave, { etiqueta, tipo = "text", placeholder = "", opciones, ayuda, min, max, paso, tipoCambio = "datos", clase = "", alCambiar, validar, urlInterna = false, campo: dc } = {}) {
  const id = uid();
  const marca = dc ?? clave; // data-campo: «Ver» y «Corregir» llevan aquí
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
    return h("label", { class: `check ${clase}`, for: id, "data-campo": marca }, input, h("span", { text: etiqueta }));
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
    // Números como texto con teclado decimal: se acepta la coma española (6,5) y el punto de miles (349.000).
    const esNum = tipo === "number";
    const entero = esNum && paso != null && Number.isInteger(paso) && paso >= 1;
    input = h("input", { id, type: esNum ? "text" : tipo, inputmode: esNum ? (entero ? "numeric" : "decimal") : null, placeholder, autocomplete: "off" });
    const errorEl = h("small", { class: "error-campo", "aria-live": "polite", hidden: true });
    input.setAttribute("aria-describedby", `${id}-err`); errorEl.id = `${id}-err`;
    const v = leer();
    input.value = v == null ? "" : esNum ? String(v).replace(".", ",") : v;
    const comprobar = (texto) => {
      if (esNum) {
        if (texto.trim() === "") return { val: "" };
        const n = numeroES(texto);
        if (n == null) return { err: "Escribe un número (por ejemplo 6,5 o 349000)." };
        if (min != null && n < min) return { err: `Debe ser como mínimo ${String(min).replace(".", ",")}.` };
        if (max != null && n > max) return { err: `Debe ser como máximo ${String(max).replace(".", ",")}.` };
        const e2 = validar?.(n);
        return e2 ? { err: e2 } : { val: n };
      }
      if (tipo === "url" && texto.trim() && !urlPermitida(texto, { interna: urlInterna })) return { err: MENSAJE_URL };
      const e3 = validar?.(texto);
      return e3 ? { err: e3, val: texto, guardar: true } : { val: texto };
    };
    const mostrar = (err) => {
      input.classList.toggle("invalido", !!err);
      input.setAttribute("aria-invalid", err ? "true" : "false");
      errorEl.hidden = !err; errorEl.textContent = err || "";
    };
    input.oninput = () => {
      const r = comprobar(input.value);
      mostrar(r.err);
      if (r.err && !r.guardar) return; // no se guarda un valor inválido (p. ej. "javascript:")
      escribir(r.val);
      alCambiar?.(r.val);
    };
    if (v != null && v !== "") mostrar(comprobar(input.value).err);
    return h("div", { class: `campo ${clase}`, "data-campo": marca }, h("label", { for: id, text: etiqueta }), input, errorEl, ayuda ? h("small", { text: ayuda }) : null);
  }
  return h("div", { class: `campo ${clase}`, "data-campo": marca }, h("label", { for: id, text: etiqueta }), input, ayuda ? h("small", { text: ayuda }) : null);
}

/** "6,5" → 6.5 · "349.000" → 349000 · "1.234,5" → 1234.5 · "abc" → null */
export function numeroES(texto) {
  let t = String(texto ?? "").trim().replace(/\s|€|m²|m2/gi, "");
  if (!t) return null;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Campo booleano tri-estado «Sin indicar · Sí · No»: control segmentado del sistema de diseño (radios reales: flechas y Tab). */
export function campoSiNo(obj, clave, etiqueta) {
  const id = uid();
  const actual = () => { const v = obj()?.[clave]; return v === true ? "si" : v === false ? "no" : ""; };
  const g = h("div", { class: "c8-segmentado", role: "radiogroup", "aria-labelledby": `${id}-l` }, [["", "Sin indicar"], ["si", "Sí"], ["no", "No"]].map(([v, t]) => {
    const r = h("input", { type: "radio", name: id, value: v, checked: actual() === v });
    r.onchange = () => { if (r.checked) cambiar(() => { const o = obj(); if (v === "") delete o[clave]; else o[clave] = v === "si"; }, { tipo: "datos", render: false }); };
    return h("label", {}, r, h("span", { text: t }));
  }));
  return h("div", { class: "campo", "data-campo": clave }, h("span", { id: `${id}-l`, text: etiqueta }), g);
}
