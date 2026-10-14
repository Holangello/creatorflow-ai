// Componentes de formulario enlazados al tour (con deshacer agrupado por campo).
import { app, h, cambiar, textoDe, fijarTexto, IDIOMAS, urlPermitida, MENSAJE_URL } from "./estudio-nucleo.js";

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
export function campo(obj, clave, { etiqueta, tipo = "text", placeholder = "", opciones, ayuda, min, max, paso, tipoCambio = "datos", clase = "", alCambiar, validar, urlInterna = false } = {}) {
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
    return h("div", { class: `campo ${clase}` }, h("label", { for: id, text: etiqueta }), input, errorEl, ayuda ? h("small", { text: ayuda }) : null);
  }
  return h("div", { class: `campo ${clase}` }, h("label", { for: id, text: etiqueta }), input, ayuda ? h("small", { text: ayuda }) : null);
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

/** Campo booleano tri-estado «Sin indicar · Sí · No» como grupo de opciones (radiogroup accesible con flechas). */
export function campoSiNo(obj, clave, etiqueta) {
  const id = uid();
  const g = h("div", { class: "segmentado", role: "radiogroup", "aria-labelledby": `${id}-l` });
  const opciones = [["", "Sin indicar"], [true, "Sí"], [false, "No"]];
  const elegir = (val, foco) => {
    cambiar(() => { const o = obj(); if (val === "") delete o[clave]; else o[clave] = val; }, { tipo: "datos", render: false });
    pintar(foco);
  };
  const pintar = (foco = false) => {
    const v = obj()?.[clave];
    const actual = opciones.findIndex(([val]) => v === val || (val === "" && v == null));
    g.replaceChildren(...opciones.map(([val, t], i) => {
      const b = h("button", {
        type: "button", role: "radio", text: t, "aria-checked": String(i === actual), tabindex: i === actual ? "0" : "-1",
        onclick: () => elegir(val, true),
      });
      b.addEventListener("keydown", (e) => {
        const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (!d) return;
        e.preventDefault(); e.stopPropagation();
        elegir(opciones[(i + d + opciones.length) % opciones.length][0], true);
      });
      return b;
    }));
    if (foco) g.querySelector('[aria-checked="true"]')?.focus();
  };
  pintar();
  return h("div", { class: "campo" }, h("span", { id: `${id}-l`, text: etiqueta }), g);
}
