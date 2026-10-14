/* cre8eight · tema.js — apariencia común (claro/oscuro), talla S/M/L, transparencia y movimiento.
   Script clásico y SÍNCRONO en <head>, antes de las hojas de estilo: así la página se pinta ya con el tema correcto.
   Preferencias en localStorage, compartidas por el visor, el Estudio y el Asistente (mismo origen):
     cre8eight:tema           auto | claro | oscuro
     cre8eight:talla          s | m | l
     cre8eight:transparencia  auto | normal | reducida
     cre8eight:movimiento     auto | normal | reducido
   Prioridad: ?tema= / ?talla= en la URL (p. ej. al incrustar en la web de la agencia) > lo que eligió el visitante
   > lo que propone el tour (cre8Tema.porDefecto) > automático.
   API: window.cre8Tema = { preferencias, efectivo, fijar(clave, valor), porDefecto({…}), alCambiar(fn) → quitar, deslizador(el), OPCIONES }
   y el evento "cre8:tema" en document. */
(function () {
  "use strict";
  var raiz = document.documentElement;
  var OPCIONES = {
    tema: ["auto", "claro", "oscuro"],
    talla: ["s", "m", "l"],
    transparencia: ["auto", "normal", "reducida"],
    movimiento: ["auto", "normal", "reducido"],
  };
  var PREDETERMINADO = { tema: "auto", talla: "m", transparencia: "auto", movimiento: "auto" };
  var COLOR_BARRA = { claro: "#f5f5f7", oscuro: "#0a0b0d" };
  var consulta = function (q) { try { return window.matchMedia(q); } catch (e) { return { matches: false }; } };
  var mOscuro = consulta("(prefers-color-scheme: dark)");
  var mTransparencia = consulta("(prefers-reduced-transparency: reduce)");
  var mMovimiento = consulta("(prefers-reduced-motion: reduce)");

  var valido = function (clave, v) { return OPCIONES[clave].indexOf(v) >= 0 ? v : null; };
  var leer = function (clave) { try { return valido(clave, localStorage.getItem("cre8eight:" + clave)); } catch (e) { return null; } };
  var guardar = function (clave, v) { try { localStorage.setItem("cre8eight:" + clave, v); } catch (e) { /* modo privado */ } };

  var url = {};
  try {
    var q = new URLSearchParams(location.search);
    ["tema", "talla"].forEach(function (k) { var v = valido(k, (q.get(k) || "").toLowerCase()); if (v) url[k] = v; });
  } catch (e) { /* sin URL */ }

  var usuario = {}, propuesto = {}, oyentes = [];
  function cargarUsuario() { Object.keys(OPCIONES).forEach(function (k) { var v = leer(k); if (v) usuario[k] = v; else delete usuario[k]; }); }

  function preferencias() {
    var p = {};
    Object.keys(OPCIONES).forEach(function (k) { p[k] = url[k] || usuario[k] || propuesto[k] || PREDETERMINADO[k]; });
    return p;
  }
  function efectivo() {
    var p = preferencias();
    return {
      tema: p.tema === "auto" ? (mOscuro.matches ? "oscuro" : "claro") : p.tema,
      talla: p.talla,
      transparencia: p.transparencia === "auto" ? (mTransparencia.matches ? "reducida" : "normal") : p.transparencia,
      movimiento: p.movimiento === "auto" ? (mMovimiento.matches ? "reducido" : "normal") : p.movimiento,
    };
  }

  function aplicar() {
    var e = efectivo();
    raiz.setAttribute("data-tema", e.tema);
    raiz.setAttribute("data-talla", e.talla);
    raiz.setAttribute("data-transparencia", e.transparencia);
    raiz.setAttribute("data-movimiento", e.movimiento);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta && document.head) { meta = document.createElement("meta"); meta.name = "theme-color"; document.head.appendChild(meta); }
    if (meta) meta.setAttribute("content", COLOR_BARRA[e.tema]);
    var detalle = { preferencias: preferencias(), efectivo: e };
    oyentes.slice().forEach(function (fn) { try { fn(detalle); } catch (err) { console.error(err); } });
    try { document.dispatchEvent(new CustomEvent("cre8:tema", { detail: detalle })); } catch (err) { /* navegadores antiguos */ }
  }

  function escuchar(m) {
    if (m && m.addEventListener) m.addEventListener("change", aplicar);
    else if (m && m.addListener) m.addListener(aplicar);
  }
  escuchar(mOscuro); escuchar(mTransparencia); escuchar(mMovimiento);
  window.addEventListener("storage", function (ev) {
    if (ev.key && ev.key.indexOf("cre8eight:") === 0) { cargarUsuario(); aplicar(); }
  });

  // Luz especular del vidrio: sigue al puntero (solo ratón; nunca con el ratón capturado del modo juego).
  var pendiente = false, lx = 0, ly = 0;
  function moverLuz() {
    pendiente = false;
    raiz.style.setProperty("--luz-x", lx + "px");
    raiz.style.setProperty("--luz-y", ly + "px");
  }
  if (consulta("(hover: hover) and (pointer: fine)").matches) {
    window.addEventListener("pointermove", function (ev) {
      if (document.pointerLockElement || ev.pointerType !== "mouse") return;
      lx = Math.round(ev.clientX); ly = Math.round(ev.clientY);
      if (!pendiente) { pendiente = true; requestAnimationFrame(moverLuz); }
    }, { passive: true });
  }

  // Deslizadores .c8-deslizador: la pista se rellena hasta el valor (--valor), también los creados después.
  function rellenar(el) {
    if (!el || !el.classList || !el.classList.contains("c8-deslizador")) return;
    var min = el.min === "" ? 0 : +el.min, max = el.max === "" ? 100 : +el.max;
    var p = max > min ? ((+el.value - min) / (max - min)) * 100 : 0;
    el.style.setProperty("--valor", Math.max(0, Math.min(100, p)) + "%");
  }
  document.addEventListener("input", function (ev) { rellenar(ev.target); }, true);
  function rellenarTodos(raizDom) { (raizDom || document).querySelectorAll(".c8-deslizador").forEach(rellenar); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { rellenarTodos(); });
  else rellenarTodos();

  window.cre8Tema = {
    OPCIONES: OPCIONES,
    get preferencias() { return preferencias(); },
    get efectivo() { return efectivo(); },
    /** Lo elige el visitante: se guarda y se aplica en todas las páginas abiertas. */
    fijar: function (clave, valor) {
      if (!OPCIONES[clave] || !valido(clave, valor)) return false;
      usuario[clave] = valor; guardar(clave, valor);
      delete url[clave];   // la elección explícita gana a la URL a partir de ahora
      aplicar();
      return true;
    },
    /** Lo propone el tour o la página (p. ej. marca.tema); no pisa lo que haya elegido el visitante. */
    porDefecto: function (obj) {
      Object.keys(obj || {}).forEach(function (k) { if (OPCIONES[k] && valido(k, obj[k])) propuesto[k] = obj[k]; });
      aplicar();
    },
    /** Rellena la pista de un deslizador (o de todos los de un contenedor) tras cambiar su valor por código. */
    deslizador: function (el) { if (el && el.classList && el.classList.contains("c8-deslizador")) rellenar(el); else rellenarTodos(el); },
    alCambiar: function (fn) {
      oyentes.push(fn);
      return function () { var i = oyentes.indexOf(fn); if (i >= 0) oyentes.splice(i, 1); };
    },
  };

  cargarUsuario();
  aplicar();
})();
