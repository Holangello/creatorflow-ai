/* cre8eight · sonidos.js — efectos de sonido de la interfaz (visor, Estudio y Guía).
   Script clásico, tras tema.js. Cada tipo de acción suena distinto para reconocerla sin mirar: un toque, encender y
   apagar, abrir y cerrar, ir a otra estancia, cambiar de modo, elegir una opción, la hora de la barra del sol, una foto,
   un envío correcto, un error… Todo sintetizado con Web Audio (sin archivos: suena al instante y no pesa) y suave, a la
   manera de iOS. Se activan con la preferencia común «sonidos» de tema.js (Ajustes · Sonidos de la interfaz).
   - Los clics se reconocen solos (delegación): si el botón abre o cierra algo (aria-expanded, un <dialog>), si enciende
     o apaga (aria-pressed, aria-checked, una casilla), si elige (radio) o, si no, un toque. data-sfx="nombre" en un
     elemento o en un antepasado fuerza el sonido; data-sfx="no" lo calla.
   - Las acciones que no son un clic (llegar a otra estancia, la barra del sol, una foto…) las pide el código con
     cre8Sonidos.tocar(nombre). Un sonido pedido así durante un clic sustituye al que le tocaría al clic.
   API: window.cre8Sonidos = { tocar(nombre, { pan }), NOMBRES, activos (bool), registro (los últimos, para las pruebas) }. */
(function () {
  "use strict";
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, salida = null, sala = null, ultimo = 0, registro = [];
  var activos = function () {
    try { var e = window.cre8Tema && window.cre8Tema.efectivo; return !e || e.sonidos !== "no"; } catch (x) { return true; }
  };

  // El contexto de audio solo puede nacer con un gesto del visitante (política de reproducción automática)
  function preparar() {
    if (ctx || !AC) return ctx;
    try {
      ctx = new AC({ latencyHint: "interactive" });
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 4;
      salida = ctx.createGain(); salida.gain.value = 0.42;
      salida.connect(comp); comp.connect(ctx.destination);
      // Un poco de sala (eco corto y difuso): el brillo «de cristal»
      sala = ctx.createConvolver();
      var n = Math.floor(ctx.sampleRate * 0.45), ir = ctx.createBuffer(2, n, ctx.sampleRate);
      for (var c = 0; c < 2; c++) { var d = ir.getChannelData(c); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
      sala.buffer = ir;
      var humedo = ctx.createGain(); humedo.gain.value = 0.16;
      sala.connect(humedo); humedo.connect(salida);
    } catch (e) { ctx = null; }
    return ctx;
  }
  ["pointerdown", "keydown", "touchstart"].forEach(function (t) {
    addEventListener(t, function () { if (preparar() && ctx.state === "suspended") ctx.resume().catch(function () {}); }, { capture: true, passive: true });
  });

  var ruido = null;
  function bufRuido() {
    if (ruido) return ruido;
    ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var d = ruido.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ruido;
  }
  // Salida de una voz: panorama y, si se pide, algo de sala
  function destino(pan, conSala) {
    var p = ctx.createStereoPanner ? ctx.createStereoPanner() : null, g = ctx.createGain();
    if (p) { p.pan.value = Math.max(-1, Math.min(1, pan || 0)); g.connect(p); p.connect(salida); if (conSala) p.connect(sala); }
    else { g.connect(salida); if (conSala) g.connect(sala); }
    return g;
  }
  /** Nota: tipo de onda, frecuencia (con glissando a f1), inicio, duración, volumen; ataque y caída exponencial. */
  function tono(o) {
    var t = ctx.currentTime + (o.t || 0), d = o.d || 0.1, osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.tipo || "sine";
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + d * (o.glis || 0.9));
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.v || 0.2, t + (o.ataque || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.connect(g); g.connect(destino(o.pan, o.sala));
    osc.start(t); osc.stop(t + d + 0.02);
  }
  /** Soplo de ruido filtrado: filtro paso banda o paso bajo que barre de f a f1 (con panorama de pan a pan1). */
  function soplo(o) {
    var t = ctx.currentTime + (o.t || 0), d = o.d || 0.15, src = ctx.createBufferSource(), fil = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = bufRuido();
    fil.type = o.filtro || "bandpass"; fil.Q.value = o.q || 1.2;
    fil.frequency.setValueAtTime(o.f, t); fil.frequency.exponentialRampToValueAtTime(o.f1 || o.f, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.v || 0.1, t + (o.ataque || d * 0.4));
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    var p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    src.connect(fil); fil.connect(g);
    if (p) { p.pan.setValueAtTime(o.pan || 0, t); if (o.pan1 != null) p.pan.linearRampToValueAtTime(o.pan1, t + d); g.connect(p); p.connect(salida); if (o.sala) p.connect(sala); }
    else g.connect(salida);
    src.start(t, Math.random() * 0.5); src.stop(t + d + 0.02);
  }
  // Campana de cristal: fundamental y parciales que caen antes (suena a vaso, no a pitido)
  function cristal(f, t, v, pan) {
    tono({ f: f, t: t, d: 0.5, v: v, pan: pan, sala: true });
    tono({ f: f * 2.76, t: t, d: 0.18, v: v * 0.35, pan: pan, sala: true });
    tono({ f: f * 5.4, t: t, d: 0.06, v: v * 0.15, pan: pan });
  }
  // Marimba: seno con el tercer armónico, ataque seco
  function marimba(f, t, v) { tono({ f: f, t: t, d: 0.32, v: v, sala: true }); tono({ f: f * 4, t: t, d: 0.05, v: v * 0.3 }); }

  var SONIDOS = {
    toque: function () { tono({ f: 1850, f1: 1500, d: 0.035, v: 0.09 }); soplo({ f: 4200, d: 0.012, v: 0.05, ataque: 0.002, q: 0.7 }); },
    elegir: function () { tono({ tipo: "triangle", f: 1046, d: 0.07, v: 0.11 }); soplo({ f: 2200, d: 0.02, v: 0.05, ataque: 0.002, q: 2 }); },
    activar: function () { tono({ f: 880, d: 0.09, v: 0.1 }); tono({ f: 1318, t: 0.06, d: 0.14, v: 0.11, sala: true }); },
    desactivar: function () { tono({ f: 1318, d: 0.08, v: 0.08 }); tono({ f: 880, t: 0.055, d: 0.12, v: 0.08 }); },
    abrir: function () { soplo({ f: 500, f1: 2800, d: 0.17, v: 0.09, q: 1.4, sala: true }); tono({ tipo: "triangle", f: 660, f1: 990, d: 0.16, v: 0.05, t: 0.03 }); },
    cerrar: function () { soplo({ f: 2600, f1: 600, d: 0.13, v: 0.07, q: 1.4 }); tono({ tipo: "triangle", f: 880, f1: 600, d: 0.11, v: 0.04 }); },
    navegar: function (o) {
      var p = (o && o.pan) || 0;
      soplo({ filtro: "lowpass", f: 260, f1: 1900, d: 0.22, v: 0.16, q: 0.9, pan: -0.6 * (p || 1), pan1: 0.2 });
      soplo({ filtro: "lowpass", f: 1900, f1: 300, d: 0.24, t: 0.2, v: 0.11, q: 0.9, pan: 0.2, pan1: 0.6 * (p || 1), sala: true });
      tono({ f: 150, f1: 105, d: 0.18, v: 0.16 });
    },
    modo: function (o) { var sube = !(o && o.baja); marimba(sube ? 392 : 587, 0, 0.14); marimba(sube ? 587 : 392, 0.075, 0.13); },
    tic: function () { tono({ f: 2600, d: 0.012, v: 0.05, ataque: 0.001 }); },
    parada: function () { cristal(1568, 0, 0.09); cristal(2349, 0.03, 0.05); },
    reproducir: function () { [523, 659, 784].forEach(function (f, i) { tono({ f: f, t: i * 0.07, d: 0.22, v: 0.08, sala: true }); }); },
    pausa: function () { [784, 523].forEach(function (f, i) { tono({ f: f, t: i * 0.07, d: 0.18, v: 0.07 }); }); },
    foto: function () {
      soplo({ filtro: "highpass", f: 1800, d: 0.03, v: 0.22, ataque: 0.002, q: 0.5 });
      tono({ tipo: "square", f: 110, d: 0.025, v: 0.05 });
      soplo({ filtro: "highpass", f: 2400, d: 0.05, v: 0.16, ataque: 0.002, t: 0.085, q: 0.5 });
    },
    exito: function () { [1046, 1318, 1568].forEach(function (f, i) { cristal(f, i * 0.085, 0.07); }); },
    error: function () { tono({ tipo: "triangle", f: 233, d: 0.12, v: 0.14 }); tono({ tipo: "triangle", f: 185, t: 0.13, d: 0.18, v: 0.14 }); },
    aviso: function () { cristal(1046, 0, 0.06); },
    copiar: function () { tono({ f: 520, f1: 1500, d: 0.07, v: 0.11, glis: 0.6 }); },
    medir: function () { tono({ f: 1396, d: 0.04, v: 0.08 }); },
    medida: function () { tono({ f: 988, d: 0.12, v: 0.08 }); tono({ f: 1318, t: 0.08, d: 0.2, v: 0.09, sala: true }); },
    guia: function () { soplo({ f: 300, f1: 1200, d: 0.5, v: 0.06, q: 0.8, sala: true }); [392, 523, 659, 784].forEach(function (f, i) { tono({ f: f, t: 0.1 + i * 0.09, d: 0.4, v: 0.06, sala: true }); }); },
    fin: function () { [784, 659, 523].forEach(function (f, i) { tono({ f: f, t: i * 0.1, d: 0.4, v: 0.06, sala: true }); }); },
    soltar: function () { tono({ f: 180, f1: 120, d: 0.1, v: 0.14 }); tono({ f: 900, f1: 1300, d: 0.06, v: 0.07, t: 0.06 }); },
    borrar: function () { soplo({ filtro: "lowpass", f: 1400, f1: 200, d: 0.2, v: 0.12, q: 0.8 }); tono({ f: 300, f1: 160, d: 0.14, v: 0.08 }); },
  };
  var VIBRA = { toque: 6, elegir: 6, activar: 10, desactivar: 8, navegar: 12, modo: 10, parada: 8, foto: [10, 40, 10], exito: [8, 50, 8], error: [20, 40, 20] };

  function tocar(nombre, o) {
    if (!SONIDOS[nombre]) return false;
    ultimo = performance.now();
    registro.push(nombre); if (registro.length > 40) registro.shift();
    if (!activos() || document.hidden) return false;
    try { if (VIBRA[nombre] && navigator.vibrate && matchMedia("(pointer: coarse)").matches) navigator.vibrate(VIBRA[nombre]); } catch (e) { /* sin vibración */ }
    if (!preparar() || ctx.state !== "running") { if (ctx && ctx.state === "suspended") ctx.resume().catch(function () {}); if (!ctx || ctx.state !== "running") return false; }
    try { SONIDOS[nombre](o || {}); } catch (e) { return false; }
    return true;
  }

  // ---------------------------------------------------------------- delegación: cada clic con su sonido
  var SEL = "button, [role=button], [role=menuitem], [role=menuitemcheckbox], [role=menuitemradio], [role=tab], [role=option], [role=switch], a[href], summary, label, input[type=checkbox], input[type=radio]";
  var estado = function (el) {
    var i = el.matches("input") ? el : el.querySelector && el.querySelector(":scope > input[type=checkbox], :scope > input[type=radio]");
    return {
      exp: el.getAttribute("aria-expanded"), pres: el.getAttribute("aria-pressed"), chk: el.getAttribute("aria-checked"),
      input: i, marcado: i ? i.checked : null, dialogos: document.querySelectorAll("dialog[open], [role=dialog]:not([hidden])").length,
    };
  };
  var claveDe = function (el) {
    if (el.id) return "#" + CSS.escape(el.id);
    var k = el.getAttribute("data-k");
    if (!k) return null;
    var cont = el.parentElement && el.parentElement.closest("[id], [class]");
    var pre = cont && cont.classList.length ? "." + CSS.escape(cont.classList[0]) + " " : "";
    return pre + "[data-k='" + k.replace(/'/g, "\\'") + "']";
  };
  var abiertos = function () { return document.querySelectorAll("dialog[open], [role=dialog]:not([hidden]), [role=menu]:not([hidden])").length; };
  // Esc cierra diálogos, hojas y menús que no son <dialog>: se compara lo abierto antes y después
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape") return;
    var antes = abiertos(), t0 = performance.now();
    setTimeout(function () { if (ultimo < t0 && abiertos() < antes) tocar("cerrar"); }, 30);
  }, true);
  document.addEventListener("click", function (ev) {
    var el = ev.target && ev.target.closest && ev.target.closest(SEL);
    if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return;
    var forzado = el.closest("[data-sfx]");
    if (forzado) { var n = forzado.getAttribute("data-sfx"); if (n === "no") return; if (SONIDOS[n]) { tocar(n); return; } }
    var antes = estado(el), t0 = performance.now(), clave = claveDe(el);
    // tras la acción del clic (el código del botón ya ha cambiado su estado o abierto un diálogo)
    setTimeout(function () {
      if (ultimo >= t0) return; // el código ya pidió un sonido propio (ir a una estancia, una foto…)
      // si la interfaz se volvió a pintar, el botón es otro nodo con la misma clave: se lee el nuevo
      if (!el.isConnected && clave) el = document.querySelector(clave) || el;
      var d = estado(el), n = "toque";
      if (antes.exp !== d.exp && d.exp != null) n = d.exp === "true" ? "abrir" : "cerrar";
      else if (d.dialogos !== antes.dialogos) n = d.dialogos > antes.dialogos ? "abrir" : "cerrar";
      else if (antes.pres !== d.pres && d.pres != null) n = d.pres === "true" ? "activar" : "desactivar";
      else if (antes.chk !== d.chk && d.chk != null) n = d.chk === "true" ? "activar" : "desactivar";
      else if (d.input && d.input.type === "checkbox" && antes.marcado !== d.marcado) n = d.marcado ? "activar" : "desactivar";
      else if (d.input && d.input.type === "radio") n = "elegir";
      else if (el.matches("[role=option], [role=tab], [role=menuitemradio]")) n = "elegir";
      tocar(n);
    }, 30);
  }, true);
  // Cerrar con Esc o desde el propio diálogo (el evento close no burbujea: se escucha en la captura)
  document.addEventListener("close", function (ev) { if (ev.target && ev.target.matches && ev.target.matches("dialog") && performance.now() - ultimo > 150) tocar("cerrar"); }, true);
  // Deslizadores: un tic suave al moverlos (como la rueda de un selector de iOS), como mucho cada 45 ms
  var ultimoTic = 0;
  document.addEventListener("input", function (ev) {
    var el = ev.target;
    if (!el || el.type !== "range" || el.closest("[data-sfx=no]")) return;
    var ahora = performance.now(); if (ahora - ultimoTic < 45) return;
    ultimoTic = ahora; tocar("tic");
  }, true);
  document.addEventListener("change", function (ev) { var el = ev.target; if (el && el.matches && el.matches("select") && !el.closest("[data-sfx=no]")) tocar("elegir"); }, true);

  window.cre8Sonidos = {
    tocar: tocar,
    NOMBRES: Object.keys(SONIDOS),
    get activos() { return activos(); },
    get registro() { return registro.slice(); },
  };
})();
