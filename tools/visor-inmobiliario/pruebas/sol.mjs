#!/usr/bin/env node
// El sol de sol.js frente a valores conocidos (NOAA / timeanddate): elevación al mediodía solar, salida y puesta, azimut.
//   cd tools/visor-inmobiliario && node pruebas/sol.mjs
import { posicionSol, diaSolar, lugarSol, recorridoSol, estadoSol, momentoDe, horaLocal, direccionSol } from "../sol.js";

let fallos = 0;
const ok = (cond, txt, extra = "") => { if (!cond) fallos++; console.log(`${cond ? "✓" : "✗"} ${txt}${extra ? `  (${extra})` : ""}`); };
const cerca = (a, b, tol) => Math.abs(a - b) <= tol;
const utc = (s) => Date.parse(s);
const min = (ms) => new Date(ms).toISOString().slice(11, 16);

const MADRID = { lat: 40.4168, lng: -3.7038 };
// Solsticio de verano en Madrid: salida 06:44 y puesta 21:48 (CEST), mediodía solar ≈ 14:16, altura máxima 73,0°
let d = diaSolar(utc("2026-06-20T22:00:00Z"), MADRID.lat, MADRID.lng);
ok(cerca(d.maxima, 73.02, 0.3), "Madrid, 21 de junio: altura máxima del sol 73,0°", d.maxima.toFixed(2));
ok(cerca(d.salida, utc("2026-06-21T04:44:00Z"), 3 * 60000), "Madrid, 21 de junio: salida a las 06:44 (hora local)", min(d.salida) + " UTC");
ok(cerca(d.puesta, utc("2026-06-21T19:48:00Z"), 3 * 60000), "Madrid, 21 de junio: puesta a las 21:48 (hora local)", min(d.puesta) + " UTC");
ok(cerca(d.mediodia, utc("2026-06-21T12:16:00Z"), 3 * 60000), "Madrid, 21 de junio: mediodía solar a las 14:16 (hora local)", min(d.mediodia) + " UTC");
const salida = posicionSol(d.salida, MADRID.lat, MADRID.lng), puesta = posicionSol(d.puesta, MADRID.lat, MADRID.lng);
ok(cerca(salida.azimut, 58, 2) && cerca(puesta.azimut, 302, 2), "Madrid, 21 de junio: sale por el noreste (58°) y se pone por el noroeste (302°)", `${salida.azimut.toFixed(1)}° · ${puesta.azimut.toFixed(1)}°`);
// Solsticio de invierno: salida 08:33 y puesta 17:51 (CET), altura máxima 26,1°
d = diaSolar(utc("2026-12-20T23:00:00Z"), MADRID.lat, MADRID.lng);
ok(cerca(d.maxima, 26.14, 0.3), "Madrid, 21 de diciembre: altura máxima 26,1°", d.maxima.toFixed(2));
ok(cerca(d.salida, utc("2026-12-21T07:33:00Z"), 3 * 60000) && cerca(d.puesta, utc("2026-12-21T16:51:00Z"), 3 * 60000), "Madrid, 21 de diciembre: salida 08:33 y puesta 17:51", `${min(d.salida)}–${min(d.puesta)} UTC`);
// Hemisferio sur: Sídney en diciembre, el sol al mediodía hacia el norte y a 79,6°
const sid = diaSolar(utc("2026-12-20T13:00:00Z"), -33.8688, 151.2093);
const pSid = posicionSol(sid.mediodia, -33.8688, 151.2093);
ok(cerca(sid.maxima, 79.57, 0.4) && (pSid.azimut < 3 || pSid.azimut > 357), "Sídney, 21 de diciembre: al mediodía, al norte y a 79,6°", `${sid.maxima.toFixed(2)}° · azimut ${pSid.azimut.toFixed(1)}°`);
// Sol de medianoche: sin salida ni puesta, la barra cubre el día entero
const polar = recorridoSol({ lat: 78.22, lng: 15.65, inicio: utc("2026-06-20T22:00:00Z"), desfase: 120 });
ok(polar.dia.salida == null && polar.fin - polar.ini === 24 * 3600000, "Svalbard en junio (sol de medianoche): la barra cubre las 24 h");

// Lugar y hora del tour
const l = lugarSol({ sol: { lat: 40.42, lng: -3.7, fecha: "2026-10-15T12:00:00+02:00" } });
ok(l.desfase === 120 && min(l.inicio) === "22:00", "tour.sol: el desfase sale de la fecha ISO y el día local empieza a las 00:00", `${l.desfase} min · ${new Date(l.inicio).toISOString()}`);
const sinNada = lugarSol({}, utc("2026-10-15T10:00:00Z"));
ok(sinNada.lat === 40.4168 && sinNada.lng === -3.7038, "sin tour.sol ni ubicación: Madrid");
const conUbicacion = lugarSol({ inmueble: { ubicacion: { lat: 41.39, lng: 2.17 } } }, utc("2026-10-15T10:00:00Z"));
ok(conUbicacion.lat === 41.39, "sin tour.sol: la ubicación del inmueble");
const r = recorridoSol(l);
const p = r.paradas;
ok(r.ini < p.amanecer && p.amanecer < p.dia && p.dia < p.atardecer && p.atardecer < p.noche && p.noche < r.fin, "las cuatro paradas, en orden y dentro del recorrido", Object.values(p).map((x) => horaLocal(x, l.desfase)).join(" · "));
ok(momentoDe(estadoSol(p.amanecer, l, r).elevacion, false) === "amanecer" && estadoSol(p.dia, l, r).momento === "dia"
  && estadoSol(p.atardecer, l, r).momento === "atardecer" && estadoSol(p.noche, l, r).momento === "noche", "cada parada da su momento: amanecer, día, atardecer y noche");
// Dirección: el sol al oeste (270°) con el norte del plano a 0° → hacia −x; con el norte a 90°, hacia +z (abajo del plano)
const oeste = direccionSol(270, 0, 0), conNorte = direccionSol(270, 0, 90);
ok(cerca(oeste[0], -1, 1e-9) && cerca(oeste[2], 0, 1e-9) && cerca(conNorte[2], 1, 1e-9), "dirección en el mundo del recorrido según el norte del plano");
const noche = estadoSol(p.noche, l, r).luz, mediodia = estadoSol(p.dia, l, r).luz;
ok(noche.fuerza === 0 && noche.lamparas > 0.8 && mediodia.fuerza > 2.5 && mediodia.lamparas === 0, "de noche, sin sol y con las lámparas; a mediodía, sol fuerte y lámparas apagadas");

console.log(fallos ? `\n✗ ${fallos} comprobación(es) fallida(s)` : "\n✓ El sol cuadra");
process.exit(fallos ? 1 : 0);
