/* cre8eight · tema.js — apariencia común (claro/oscuro), talla S/M/L, transparencia, movimiento y sonidos.
   Script clásico y SÍNCRONO en <head>, antes de las hojas de estilo: así la página se pinta ya con el tema correcto.
   Preferencias en localStorage, compartidas por el visor, el Estudio y el Asistente (mismo origen):
     cre8eight:tema           auto | claro | oscuro
     cre8eight:talla          s | m | l
     cre8eight:transparencia  auto | normal | reducida
     cre8eight:movimiento     auto | normal | reducido
     cre8eight:sonidos        si | no    (efectos de sonido de la interfaz: sonidos.js)
   Prioridad: ?tema= / ?talla= en la URL (p. ej. al incrustar en la web de la agencia) > lo que eligió el visitante
   > lo que propone el tour (cre8Tema.porDefecto) > automático.
   API: window.cre8Tema = { MQ, forma(), preferencias, efectivo, fijar(clave, valor), porDefecto({…}), alCambiar(fn) → quitar, deslizador(el), segmentados(raíz), OPCIONES }
   y el evento "cre8:tema" en document. */
(function () {
  "use strict";
  var raiz = document.documentElement;
  var OPCIONES = {
    tema: ["auto", "claro", "oscuro"],
    talla: ["s", "m", "l"],
    transparencia: ["auto", "normal", "reducida"],
    movimiento: ["auto", "normal", "reducido"],
    sonidos: ["si", "no"],
  };
  var PREDETERMINADO = { tema: "auto", talla: "m", transparencia: "auto", movimiento: "auto", sonidos: "si" };
  var COLOR_BARRA = { claro: "#f5f5f7", oscuro: "#0a0b0d" };
  var consulta = function (q) { try { return window.matchMedia(q); } catch (e) { return { matches: false }; } };
  var mOscuro = consulta("(prefers-color-scheme: dark)");
  var mTransparencia = consulta("(prefers-reduced-transparency: reduce)");
  var mContraste = consulta("(prefers-contrast: more)"); // «Más contraste» también quita la transparencia, como en macOS
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
      transparencia: p.transparencia === "auto" ? (mTransparencia.matches || mContraste.matches ? "reducida" : "normal") : p.transparencia,
      movimiento: p.movimiento === "auto" ? (mMovimiento.matches ? "reducido" : "normal") : p.movimiento,
      sonidos: p.sonidos,
    };
  }

  function aplicar() {
    var e = efectivo();
    raiz.setAttribute("data-tema", e.tema);
    raiz.setAttribute("data-talla", e.talla);
    raiz.setAttribute("data-transparencia", e.transparencia);
    raiz.setAttribute("data-movimiento", e.movimiento);
    raiz.setAttribute("data-sonidos", e.sonidos);
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
  escuchar(mOscuro); escuchar(mTransparencia); escuchar(mContraste); escuchar(mMovimiento);
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

  // Contingencia: sin :has() (navegadores antiguos) el control segmentado no sabría qué opción está elegida.
  // Ahí lo marca este código (clase .c8-elegido y --i/--n en línea). Con :has() no hace nada: lo resuelve el CSS,
  // también cuando una opción cambia por código.
  var conHas = false;
  try { conHas = CSS.supports("selector(:has(*))"); } catch (e) { conHas = false; }
  function marcarSegmentado(grupo) {
    if (conHas || !grupo) return;
    var etiquetas = Array.prototype.filter.call(grupo.children, function (n) { return n.tagName === "LABEL"; });
    var elegido = 0;
    etiquetas.forEach(function (l, i) { var r = l.querySelector("input"); var si = !!(r && r.checked); l.classList.toggle("c8-elegido", si); if (si) elegido = i; });
    grupo.style.setProperty("--n", String(etiquetas.length || 1));
    grupo.style.setProperty("--i", String(elegido));
  }
  function marcarTodos(raizDom) { if (!conHas) (raizDom || document).querySelectorAll(".c8-segmentado").forEach(marcarSegmentado); }
  if (!conHas) {
    document.addEventListener("change", function (ev) { var g = ev.target && ev.target.closest && ev.target.closest(".c8-segmentado"); if (g) marcarSegmentado(g); }, true);
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { marcarTodos(); });
    else marcarTodos();
  }

  // ---------------------------------------------------------------- Vidrio adaptativo por pieza (tema.css)
  // Una página que mide la foto que hay detrás de una pieza de vidrio (el visor: percentiles 10 y 90 de la luminancia
  // bajo la pieza) le pone su propia alfa (--vidrio-a). Aquí se calcula: la mínima para que todo lo que se lee en la
  // pieza cumpla (4,5:1 el texto; 3:1 los iconos y el texto grande) con un 10 % de holgura, porque la medida es de pocos
  // píxeles y el fondo se aproxima como un gris. La mezcla es en sRGB, como la hace el navegador.
  var HOLGURA = 1.1;
  var canal = function (c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  var luminancia = function (c) { return 0.2126 * canal(c[0]) + 0.7152 * canal(c[1]) + 0.0722 * canal(c[2]); };
  var razon = function (a, b) { var x = luminancia(a), y = luminancia(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  var mezclar = function (arriba, alfa, abajo) { return [0, 1, 2].map(function (i) { return alfa * arriba[i] + (1 - alfa) * abajo[i]; }); };
  var gris = function (l) { var c = l <= 0.0031308 ? 12.92 * l : 1.055 * Math.pow(l, 1 / 2.4) - 0.055; c = Math.max(0, Math.min(255, c * 255)); return [c, c, c]; };
  var lienzoColor = null, colores = {};
  /** Cualquier color CSS (rgb, oklch, color-mix…) → [r, g, b, a] en sRGB 0-255; null si no hay lienzo. */
  function aRgb(css) {
    if (colores[css]) return colores[css];
    if (!lienzoColor) { try { var cv = document.createElement("canvas"); cv.width = cv.height = 1; lienzoColor = cv.getContext("2d", { willReadFrequently: true }); } catch (e) { return null; } }
    if (!lienzoColor) return null;
    lienzoColor.clearRect(0, 0, 1, 1); lienzoColor.fillStyle = "#000"; lienzoColor.fillStyle = css; lienzoColor.fillRect(0, 0, 1, 1);
    var d = lienzoColor.getImageData(0, 0, 1, 1).data;
    return (colores[css] = [d[0], d[1], d[2], d[3] / 255]);
  }
  var analisis = typeof WeakMap === "function" ? new WeakMap() : null;
  /** Lo que tiene que leerse sobre el vidrio de una pieza: el color de cada texto y de cada icono que va directamente
      sobre él (no sobre un relleno opaco, como un botón de color, que ya contrasta por sí mismo), con su mínimo y las capas
      translúcidas que haya entre medias (el relleno de un botón al pasar, la opción elegida de un segmentado…). Cuenta
      también lo oculto solo a la vista (en reposo) y la ficha plegada: al volver a verse, la alfa ya vale. */
  function exigencias(pieza) {
    var cs0 = getComputedStyle(pieza);
    var firma = [raiz.getAttribute("data-tema"), pieza.getAttribute("data-vidrio-aspecto"), cs0.getPropertyValue("--c-acento"), pieza.className, pieza.childElementCount,
      pieza.textContent.length, pieza.hasAttribute("data-sin-rotulos")].join("|");
    var previo = analisis && analisis.get(pieza);
    if (previo && previo.firma === firma) return previo.lista;
    // un color que aún está cambiando (transición tras cambiar de tema o de aspecto) daría el valor de en medio: null,
    // y quien llama lo vuelve a intentar al acabar
    try {
      if (pieza.getAnimations && pieza.getAnimations({ subtree: true }).some(function (a) {
        return a.playState === "running" && /^(color|fill|stroke|all)$/.test(a.transitionProperty || "");
      })) return null;
    } catch (e) { /* sin getAnimations: se analiza igual */ }
    var lista = [], vistos = {};
    var anadir = function (css, minimo, capas) {
      var c = aRgb(css); if (!c || c[3] < 0.05) return;
      var k = c.join(",") + "|" + minimo + "|" + capas.map(function (x) { return x.join(","); }).join(";");
      if (!vistos[k]) { vistos[k] = 1; lista.push({ color: c, minimo: minimo, capas: capas }); }
    };
    var capasHasta = function (el) {
      var capas = [];
      for (var n = el; n && n !== pieza; n = n.parentElement) {
        var f = aRgb(getComputedStyle(n).backgroundColor);
        if (f && f[3] >= 0.9) return null;          // relleno opaco: su texto contrasta con él, no con el vidrio
        if (f && f[3] > 0.02) capas.unshift(f);
      }
      return capas;
    };
    var elegida = function (el) { // la opción elegida de un segmentado se pinta con su ::after debajo
      var l = el.closest && el.closest(".c8-segmentado > label");
      if (!l || !(l.classList.contains("c8-elegido") || (l.querySelector("input") || {}).checked)) return [];
      var f = aRgb(getComputedStyle(l.parentElement, "::after").backgroundColor);
      return f && f[3] > 0.02 ? [f] : [];
    };
    // un lienzo (el radar) dibuja sus trazos y rótulos con el color de la pieza; data-sin-rotulos: solo trazos
    if (pieza.querySelector("canvas")) anadir(cs0.color, pieza.hasAttribute("data-sin-rotulos") ? 3 : 4.5, []);
    (function recorrer(el) {
      if (el.hidden || el.tagName === "TEMPLATE" || el.tagName === "CANVAS") return;
      var cs = getComputedStyle(el);
      if (cs.display === "none") return;
      var nombre = el.tagName.toLowerCase();
      if (nombre === "svg") { var ci = capasHasta(el); if (ci) anadir(cs.color, 3, ci.concat(elegida(el))); return; }
      var texto = nombre === "textarea" || nombre === "select" || (nombre === "input" && !/^(radio|checkbox|range|hidden|color|file|image|submit|button|reset)$/.test(el.type));
      for (var h = el.firstChild; !texto && h; h = h.nextSibling) if (h.nodeType === 3 && /\S/.test(h.nodeValue)) texto = true;
      if (texto && cs.visibility !== "hidden") {
        var ct = capasHasta(el);
        if (ct) {
          var tam = parseFloat(cs.fontSize) || 16, peso = parseFloat(cs.fontWeight) || 400;
          anadir(cs.color, tam >= 24 || (tam >= 18.66 && peso >= 700) ? 3 : 4.5, ct.concat(elegida(el)));
        }
      }
      for (var k = el.firstElementChild; k; k = k.nextElementSibling) recorrer(k);
    })(pieza);
    if (analisis) analisis.set(pieza, { firma: firma, lista: lista });
    return lista;
  }
  /** Lo que el cristal esmerilado hace con lo que tiene detrás (backdrop-filter de tema.css): contrast() y brightness(),
      en sRGB, como los aplican los navegadores (pruebas/contraste.mjs lo comprueba). */
  function esmerilar(c, filtro) {
    var k = filtro && filtro.contraste > 0 ? filtro.contraste : 1, b = filtro && filtro.aclarado > 0 ? filtro.aclarado : 1;
    return c.map(function (v) { return Math.max(0, Math.min(255, ((v / 255 - 0.5) * k + 0.5) * b * 255)); });
  }
  /** Alfa mínima del tinte (entre suelo y techo) para que todo lo de `lista` se lea con un fondo de luminancia l10 (lo
      más oscuro detrás de la pieza) y l90 (lo más claro), ya esmerilado (`filtro`: { contraste, aclarado }). Si ni el
      techo (el peor caso de tema.css) basta, el techo. */
  function alfaVidrio(lista, tinte, l10, l90, suelo, techo, filtro) {
    var fondos = [esmerilar(gris(l10), filtro), esmerilar(gris(l90), filtro)];
    var cumple = function (a) {
      return lista.every(function (t) {
        return fondos.every(function (f) {
          var c = mezclar(tinte, a, f);
          t.capas.forEach(function (capa) { c = mezclar(capa, capa[3], c); });
          var letra = t.color[3] < 1 ? mezclar(t.color, t.color[3], c) : t.color;
          return razon(letra, c) >= t.minimo * HOLGURA;
        });
      });
    };
    if (!lista.length || cumple(suelo)) return suelo;
    if (!cumple(techo)) return techo;
    var bajo = suelo, alto = techo;
    for (var i = 0; i < 12; i++) { var m = (bajo + alto) / 2; if (cumple(m)) alto = m; else bajo = m; }
    return alto;
  }

  // ---------------------------------------------------------------- puntos de corte del sistema
  // docs/diseno/sistema.md § Puntos de corte. Los mismos literales en el CSS (visor.css, paneles.css, estudio.css y la
  // Guía); pruebas/puntos-corte.mjs rechaza cualquier otro. Topes en .98 y mínimos enteros: sin huecos con el zoom.
  var MQ = {
    telefono: "(max-width: 599.98px)",                                   // teléfono en vertical (el mayor mide 430)
    apaisado: "(orientation: landscape) and (max-height: 499.98px)",     // teléfono en horizontal y ventanas muy bajas
    compacto: "(max-width: 599.98px), (orientation: landscape) and (max-height: 499.98px)",
    vertical: "(orientation: portrait) and (max-width: 1100px)",         // tablet en vertical (iPad Pro de 13" incluido)
    hoja: "(max-width: 719.98px) and (min-height: 500px), (orientation: portrait) and (max-width: 1100px)",
    estrecho: "(orientation: landscape) and (max-width: 62em) and (min-height: 500px)",
    tactil: "(pointer: coarse)", raton: "(hover: hover) and (pointer: fine)", algunTactil: "(any-pointer: coarse)",
  };
  function forma() {
    return consulta(MQ.apaisado).matches ? "apaisado" : consulta(MQ.telefono).matches ? "telefono"
      : consulta(MQ.vertical).matches ? "vertical" : consulta(MQ.estrecho).matches ? "estrecho" : "escritorio";
  }
  function marcarForma() { document.documentElement.setAttribute("data-forma", forma()); }
  marcarForma();
  ["apaisado", "telefono", "vertical", "estrecho"].forEach(function (k) { var m = consulta(MQ[k]); if (m.addEventListener) m.addEventListener("change", marcarForma); });

  // ---------------------------------------------------------------- teclado del móvil
  // El alto que tapa el teclado (--teclado) y el alto visible (--alto-visible), y html[data-teclado] mientras está abierto:
  // los diálogos y hojas se colocan encima en vez de quedar debajo.
  var vv = window.visualViewport;
  if (vv) {
    var alTeclado = function () {
      var r = document.documentElement, tapa = Math.max(0, Math.round(r.clientHeight - vv.height - vv.offsetTop));
      r.style.setProperty("--teclado", (tapa > 80 ? tapa : 0) + "px");
      r.style.setProperty("--alto-visible", Math.round(vv.height) + "px");
      if (tapa > 80) r.setAttribute("data-teclado", ""); else r.removeAttribute("data-teclado");
    };
    vv.addEventListener("resize", alTeclado); vv.addEventListener("scroll", alTeclado); alTeclado();
  }

  window.cre8Tema = {
    OPCIONES: OPCIONES,
    /** Puntos de corte con nombre (los mismos literales que el CSS) y la forma actual: telefono|apaisado|vertical|estrecho|escritorio. */
    MQ: MQ, forma: forma,
    /** Vidrio adaptativo por pieza: exigencias(pieza) → lista; alfa(lista, tinte, l10, l90, suelo, techo, filtro) → alfa. */
    vidrio: { exigencias: exigencias, alfa: alfaVidrio, esmerilar: esmerilar, aRgb: aRgb, razon: razon, HOLGURA: HOLGURA },
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
    /** Tras pintar controles segmentados por código (solo hace algo en navegadores sin :has()). */
    segmentados: function (raizDom) { marcarTodos(raizDom); },
    alCambiar: function (fn) {
      oyentes.push(fn);
      return function () { var i = oyentes.indexOf(fn); if (i >= 0) oyentes.splice(i, 1); };
    },
  };

  cargarUsuario();
  aplicar();
})();
