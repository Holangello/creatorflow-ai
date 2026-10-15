// El sol de la vivienda: posición exacta, horas del día y la luz que corresponde (barra del sol del visor, la demo 3D y
// la maqueta). Petición del cliente: «el movimiento correcto y exacto del sol según se registre en las fotografías de la
// Osmo 360». El Estudio guarda en el tour la fecha, la hora y la posición (redondeada a ~1 km) de las fotos: `tour.sol`.
// Sin dependencias; pruebas/sol.mjs lo comprueba con posiciones y horas conocidas.

const RAD = Math.PI / 180;
const MIN = 60000;
/** Madrid: si el tour no dice dónde está la vivienda (cre8eight trabaja en España). */
const POR_DEFECTO = { lat: 40.4168, lng: -3.7038 };

/** Posición del sol en un instante (ms) y un lugar: azimut en grados desde el norte en sentido horario y elevación sobre
    el horizonte, sin refracción. Algoritmo de baja precisión del Almanaque Astronómico (el de la NOAA): error < 0,1°
    entre 1950 y 2050, de sobra para la luz. */
export function posicionSol(ms, lat, lng) {
  const n = ms / 86400000 + 2440587.5 - 2451545.0; // días desde J2000,0
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * RAD;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const eps = (23.439 - 0.0000004 * n) * RAD;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const gmst = (280.46061837 + 360.98564736629 * n) % 360;
  const H = (gmst + lng) * RAD - ra; // ángulo horario
  const phi = lat * RAD;
  const elev = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  const az = Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(phi) - Math.sin(phi) * Math.cos(H));
  return { azimut: ((az / RAD) % 360 + 360) % 360, elevacion: elev / RAD };
}

/** Salida y puesta del sol (el borde del disco con la refracción: −0,833°) y mediodía solar del día local que empieza en
    `inicio` (ms de las 00:00 locales). Sin salida o sin puesta (sol de medianoche, noche polar): null. */
export function diaSolar(inicio, lat, lng) {
  const alt = (t) => posicionSol(t, lat, lng).elevacion + 0.833;
  const paso = 10 * MIN, fin = inicio + 24 * 60 * MIN;
  let salida = null, puesta = null, mediodia = inicio, maxima = -Infinity;
  for (let t = inicio; t < fin; t += paso) {
    const a = alt(t), b = alt(t + paso);
    if (a - 0.833 > maxima) { maxima = a - 0.833; mediodia = t; }
    if ((a < 0) !== (b < 0)) {
      let x = t, y = t + paso; // bisección hasta el minuto
      while (y - x > 20000) { const m = (x + y) / 2; if ((alt(m) < 0) === (a < 0)) x = m; else y = m; }
      if (a < 0 && salida == null) salida = (x + y) / 2;
      else if (a >= 0) puesta = (x + y) / 2;
    }
  }
  // el mediodía solar, afinado al minuto alrededor del máximo encontrado
  for (let t = mediodia - paso; t <= mediodia + paso; t += MIN) {
    const e = posicionSol(t, lat, lng).elevacion;
    if (e > maxima) { maxima = e; mediodia = t; }
  }
  return { salida, puesta, mediodia, maxima };
}

/** Dónde y cuándo para el sol de un tour: `tour.sol` ({ lat, lng, fecha ISO con su desfase, desfase en minutos }), si no
    la ubicación del inmueble y hoy; sin nada, Madrid. → { lat, lng, inicio (00:00 locales en ms), desfase (min) }. */
export function lugarSol(tour, ahora = Date.now()) {
  const s = tour?.sol ?? {}, u = tour?.inmueble?.ubicacion ?? {};
  const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const lat = num(s.lat) ?? num(u.lat) ?? POR_DEFECTO.lat, lng = num(s.lng) ?? num(u.lng) ?? POR_DEFECTO.lng;
  let ms = Date.parse(s.fecha ?? "");
  if (!Number.isFinite(ms)) ms = ahora;
  // desfase de la hora local: el guardado, el de la propia fecha ISO o el de este dispositivo en esa fecha
  const iso = /([+-])(\d{2}):?(\d{2})$/.exec(s.fecha ?? "");
  const desfase = num(s.desfase) ?? (iso ? (iso[1] === "-" ? -1 : 1) * (+iso[2] * 60 + +iso[3]) : -new Date(ms).getTimezoneOffset());
  const local = new Date(ms + desfase * MIN);
  const inicio = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - desfase * MIN;
  return { lat, lng, inicio, desfase, fecha: ms };
}

/** Recorrido de la barra del sol para ese día: del alba (salida − 40 min) a la noche cerrada (puesta + 75 min), y las
    paradas de los cuatro iconos: amanecer (salida + 20 min), día (mediodía solar), atardecer (puesta − 35 min) y noche
    (puesta + 60 min). Sin salida o sin puesta, el día entero con las paradas a las 7, 13, 19 y 22 h. */
export function recorridoSol(lugar) {
  const d = diaSolar(lugar.inicio, lugar.lat, lugar.lng), h = (x) => lugar.inicio + x * 60 * MIN;
  if (d.salida == null || d.puesta == null) {
    return { ini: lugar.inicio, fin: lugar.inicio + 24 * 60 * MIN, paradas: { amanecer: h(7), dia: h(13), atardecer: h(19), noche: h(22) }, dia: d };
  }
  return {
    ini: d.salida - 40 * MIN, fin: d.puesta + 75 * MIN, dia: d,
    paradas: { amanecer: d.salida + 20 * MIN, dia: d.mediodia, atardecer: d.puesta - 35 * MIN, noche: d.puesta + 60 * MIN },
  };
}

/** Momento con nombre (fotos de variante, panel «Estilo y luz» y API): noche con el sol por debajo de −4°; amanecer o
    atardecer por debajo de 10°, según sea antes o después del mediodía solar; día, el resto. */
export function momentoDe(elevacion, tarde) {
  if (elevacion < -4) return "noche";
  if (elevacion < 10) return tarde ? "atardecer" : "amanecer";
  return "dia";
}

/** Hora local «hh:mm» de un instante. */
export function horaLocal(ms, desfase) {
  const d = new Date(ms + desfase * MIN);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

/** Dirección hacia el sol en el mundo del recorrido (x a la derecha del plano, z hacia abajo, y hacia arriba). El rumbo
    del plano es el azimut menos el norte del plano (ESQUEMA.md, «norte»; util.js: rumbo = atan2(dx, −dz)). */
export function direccionSol(azimut, elevacion, norte = 0) {
  const r = (azimut - norte) * RAD, e = elevacion * RAD;
  return [Math.sin(r) * Math.cos(e), Math.sin(e), -Math.cos(r) * Math.cos(e)];
}

// Fotogramas de luz por elevación del sol (grados). Colores en sRGB 0-1; intensidades para los materiales Lambert de la
// demo y la maqueta. «cálido» y «noche» son los pesos de la simulación sobre las fotos reales (sombreador del visor).
const CLAVES = [
  { e: -12, sol: [0, 0, 0], fuerza: 0, cielo: [0.05, 0.09, 0.19], suelo: [0.05, 0.05, 0.07], ambiente: 0.18, lamparas: 1, calido: 0, noche: 1 },
  { e: -4, sol: [0, 0, 0], fuerza: 0, cielo: [0.16, 0.22, 0.4], suelo: [0.09, 0.08, 0.1], ambiente: 0.32, lamparas: 0.85, calido: 0.25, noche: 0.75 },
  { e: 1, sol: [1, 0.55, 0.28], fuerza: 1.1, cielo: [1, 0.7, 0.5], suelo: [0.35, 0.25, 0.19], ambiente: 0.62, lamparas: 0.45, calido: 1, noche: 0.1 },
  { e: 8, sol: [1, 0.74, 0.48], fuerza: 2.2, cielo: [1, 0.86, 0.7], suelo: [0.4, 0.33, 0.26], ambiente: 1.05, lamparas: 0.15, calido: 0.6, noche: 0 },
  { e: 25, sol: [1, 0.93, 0.82], fuerza: 2.9, cielo: [0.92, 0.95, 1], suelo: [0.42, 0.35, 0.28], ambiente: 1.4, lamparas: 0, calido: 0.12, noche: 0 },
  { e: 60, sol: [1, 0.97, 0.92], fuerza: 3.2, cielo: [0.85, 0.92, 1], suelo: [0.42, 0.35, 0.28], ambiente: 1.5, lamparas: 0, calido: 0, noche: 0 },
];

/** La luz de la escena con el sol a `elevacion` grados, interpolada entre los fotogramas de arriba. Al amanecer, el sol y
    el cielo algo más rosados y fríos que al atardecer. */
export function luzSol(elevacion, tarde = true) {
  const e = Math.max(CLAVES[0].e, Math.min(CLAVES.at(-1).e, elevacion));
  let i = 0;
  while (i < CLAVES.length - 2 && e > CLAVES[i + 1].e) i++;
  const a = CLAVES[i], b = CLAVES[i + 1], t = (e - a.e) / (b.e - a.e);
  const mix = (x, y) => (Array.isArray(x) ? x.map((v, k) => v + (y[k] - v) * t) : x + (y - x) * t);
  const r = {};
  for (const k of Object.keys(a)) if (k !== "e") r[k] = mix(a[k], b[k]);
  if (!tarde && e < 12) {
    const w = 1 - Math.max(0, e) / 12; // alba: un punto rosado en el sol y frío en el cielo
    r.sol = [r.sol[0], r.sol[1] * (1 - 0.06 * w), Math.min(1, r.sol[2] + 0.12 * w)];
    r.cielo = [r.cielo[0] * (1 - 0.1 * w), r.cielo[1], Math.min(1, r.cielo[2] + 0.12 * w)];
  }
  return r;
}

/** Todo junto para un instante: posición, momento, dirección en el mundo del recorrido y la luz. */
export function estadoSol(ms, lugar, recorrido, norte = 0) {
  const p = posicionSol(ms, lugar.lat, lugar.lng);
  const tarde = ms > recorrido.dia.mediodia;
  return { ...p, ms, tarde, hora: horaLocal(ms, lugar.desfase), momento: momentoDe(p.elevacion, tarde),
    direccion: direccionSol(p.azimut, p.elevacion, norte), luz: luzSol(p.elevacion, tarde) };
}
