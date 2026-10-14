/*
 * Generador de códigos QR (ES module, sin dependencias).
 *
 * Port simplificado (solo modo byte UTF-8, corrección de errores nivel M, versiones 1–40 automáticas) de
 * "QR Code generator library" de Project Nayuki — https://www.nayuki.io/page/qr-code-generator-library
 *
 * Copyright (c) Project Nayuki. (MIT License)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 *
 * Uso:
 *   import { qrSVG, qrMatriz } from "./vendor/qr.js";
 *   el.innerHTML = qrSVG("https://www.ejemplo.com/tour/?ref=1234", { margen: 4 });
 *   const m = qrMatriz("hola"); // boolean[][]: m[y][x] === true → módulo oscuro
 */

// Tablas para el nivel M (índice = versión; el 0 no se usa).
const ECC_POR_BLOQUE_M = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28];
const BLOQUES_M = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49];
const FORMATO_M = 0; // bits de formato del nivel M

const bit = (x, i) => ((x >>> i) & 1) !== 0;

function modulosDatosBrutos(ver) {
  let r = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const n = Math.floor(ver / 7) + 2;
    r -= (25 * n - 10) * n - 55;
    if (ver >= 7) r -= 36;
  }
  return r;
}
const palabrasDatos = (ver) => Math.floor(modulosDatosBrutos(ver) / 8) - ECC_POR_BLOQUE_M[ver] * BLOQUES_M[ver];

// ---------------------------------------------------------------- Reed–Solomon sobre GF(2^8) / 0x11D
function rsMul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}
function rsDivisor(grado) {
  const r = new Array(grado).fill(0);
  r[grado - 1] = 1;
  let raiz = 1;
  for (let i = 0; i < grado; i++) {
    for (let j = 0; j < r.length; j++) {
      r[j] = rsMul(r[j], raiz);
      if (j + 1 < r.length) r[j] ^= r[j + 1];
    }
    raiz = rsMul(raiz, 0x02);
  }
  return r;
}
function rsResto(datos, divisor) {
  const r = divisor.map(() => 0);
  for (const b of datos) {
    const f = b ^ r.shift();
    r.push(0);
    divisor.forEach((c, i) => { r[i] ^= rsMul(c, f); });
  }
  return r;
}

// ---------------------------------------------------------------- codificación
function codificar(texto) {
  const bytes = new TextEncoder().encode(String(texto));
  let ver = 1;
  for (; ver <= 40; ver++) {
    const bitsCuenta = ver < 10 ? 8 : 16;
    if (4 + bitsCuenta + bytes.length * 8 <= palabrasDatos(ver) * 8) break;
  }
  if (ver > 40) throw new RangeError(`Texto demasiado largo para un QR (${bytes.length} bytes; máx. 2331 con nivel M)`);

  const bits = [];
  const poner = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  poner(0x4, 4); // modo byte
  poner(bytes.length, ver < 10 ? 8 : 16);
  for (const b of bytes) poner(b, 8);
  const capacidad = palabrasDatos(ver) * 8;
  poner(0, Math.min(4, capacidad - bits.length));
  poner(0, (8 - (bits.length % 8)) % 8);
  for (let relleno = 0xec; bits.length < capacidad; relleno ^= 0xec ^ 0x11) poner(relleno, 8);
  const datos = new Array(bits.length / 8).fill(0);
  bits.forEach((b, i) => { datos[i >>> 3] |= b << (7 - (i & 7)); });
  return { ver, datos };
}

function intercalarConECC(ver, datos) {
  const nBloques = BLOQUES_M[ver];
  const largoEcc = ECC_POR_BLOQUE_M[ver];
  const brutas = Math.floor(modulosDatosBrutos(ver) / 8);
  const nCortos = nBloques - (brutas % nBloques);
  const largoCorto = Math.floor(brutas / nBloques);
  const divisor = rsDivisor(largoEcc);
  const bloques = [];
  for (let i = 0, k = 0; i < nBloques; i++) {
    const dat = datos.slice(k, k + largoCorto - largoEcc + (i < nCortos ? 0 : 1));
    k += dat.length;
    const ecc = rsResto(dat, divisor);
    if (i < nCortos) dat.push(0);
    bloques.push(dat.concat(ecc));
  }
  const r = [];
  for (let i = 0; i < bloques[0].length; i++) {
    bloques.forEach((b, j) => { if (i !== largoCorto - largoEcc || j >= nCortos) r.push(b[i]); });
  }
  return r;
}

function posicionesAlineacion(ver, tam) {
  if (ver === 1) return [];
  const n = Math.floor(ver / 7) + 2;
  const paso = Math.floor((ver * 8 + n * 3 + 5) / (n * 4 - 4)) * 2;
  const r = [];
  for (let p = tam - 7; r.length < n - 1; p -= paso) r.unshift(p);
  r.unshift(6);
  return r;
}

// ---------------------------------------------------------------- matriz
class Matriz {
  constructor(ver) {
    this.ver = ver;
    this.tam = ver * 4 + 17;
    this.m = Array.from({ length: this.tam }, () => new Array(this.tam).fill(false));
    this.fn = Array.from({ length: this.tam }, () => new Array(this.tam).fill(false));
  }
  fijar(x, y, oscuro) { this.m[y][x] = oscuro; this.fn[y][x] = true; }

  patronesFuncion() {
    const t = this.tam;
    for (let i = 0; i < t; i++) { this.fijar(6, i, i % 2 === 0); this.fijar(i, 6, i % 2 === 0); }
    this.buscador(3, 3); this.buscador(t - 4, 3); this.buscador(3, t - 4);
    const al = posicionesAlineacion(this.ver, t);
    const n = al.length;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        this.fijar(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
    this.formato(0);
    this.version();
  }
  buscador(x, y) {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy)), xx = x + dx, yy = y + dy;
      if (xx >= 0 && xx < this.tam && yy >= 0 && yy < this.tam) this.fijar(xx, yy, d !== 2 && d !== 4);
    }
  }
  formato(mascara) {
    const dato = (FORMATO_M << 3) | mascara;
    let rem = dato;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const b = ((dato << 10) | rem) ^ 0x5412;
    const t = this.tam;
    for (let i = 0; i <= 5; i++) this.fijar(8, i, bit(b, i));
    this.fijar(8, 7, bit(b, 6)); this.fijar(8, 8, bit(b, 7)); this.fijar(7, 8, bit(b, 8));
    for (let i = 9; i < 15; i++) this.fijar(14 - i, 8, bit(b, i));
    for (let i = 0; i < 8; i++) this.fijar(t - 1 - i, 8, bit(b, i));
    for (let i = 8; i < 15; i++) this.fijar(8, t - 15 + i, bit(b, i));
    this.fijar(8, t - 8, true);
  }
  version() {
    if (this.ver < 7) return;
    let rem = this.ver;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const b = (this.ver << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const a = this.tam - 11 + (i % 3), c = Math.floor(i / 3);
      this.fijar(a, c, bit(b, i)); this.fijar(c, a, bit(b, i));
    }
  }
  palabras(datos) {
    const t = this.tam;
    let i = 0;
    for (let der = t - 1; der >= 1; der -= 2) {
      if (der === 6) der = 5;
      for (let v = 0; v < t; v++) for (let j = 0; j < 2; j++) {
        const x = der - j;
        const y = ((der + 1) & 2) === 0 ? t - 1 - v : v;
        if (!this.fn[y][x] && i < datos.length * 8) { this.m[y][x] = bit(datos[i >>> 3], 7 - (i & 7)); i++; }
      }
    }
  }
  mascara(k) {
    for (let y = 0; y < this.tam; y++) for (let x = 0; x < this.tam; x++) {
      let inv;
      switch (k) {
        case 0: inv = (x + y) % 2 === 0; break;
        case 1: inv = y % 2 === 0; break;
        case 2: inv = x % 3 === 0; break;
        case 3: inv = (x + y) % 3 === 0; break;
        case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
        case 5: inv = ((x * y) % 2) + ((x * y) % 3) === 0; break;
        case 6: inv = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
        default: inv = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
      }
      if (inv && !this.fn[y][x]) this.m[y][x] = !this.m[y][x];
    }
  }
  // Penalización (ISO/IEC 18004 §7.8.3): solo influye en la máscara elegida, no en la validez.
  penalizacion() {
    const t = this.tam, m = this.m;
    let p = 0, oscuros = 0;
    const lineas = (get) => {
      for (let a = 0; a < t; a++) {
        let run = 1;
        for (let b = 1; b <= t; b++) {
          if (b < t && get(a, b) === get(a, b - 1)) { run++; continue; }
          if (run >= 5) p += 3 + (run - 5);
          run = 1;
        }
        // patrón tipo buscador 1:1:3:1:1 con 4 claros a un lado
        for (let b = 0; b + 11 <= t; b++) {
          let ok1 = true, ok2 = true;
          const P = [1, 0, 1, 1, 1, 0, 1];
          for (let k = 0; k < 7; k++) {
            if (get(a, b + k) !== !!P[k]) ok1 = false;
            if (get(a, b + 4 + k) !== !!P[k]) ok2 = false;
          }
          if (ok1) for (let k = 7; k < 11; k++) if (get(a, b + k)) ok1 = false;
          if (ok2) for (let k = 0; k < 4; k++) if (get(a, b + k)) ok2 = false;
          if (ok1) p += 40;
          if (ok2) p += 40;
        }
      }
    };
    lineas((a, b) => m[a][b]);
    lineas((a, b) => m[b][a]);
    for (let y = 0; y < t - 1; y++) for (let x = 0; x < t - 1; x++) {
      const c = m[y][x];
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3;
    }
    for (const fila of m) for (const c of fila) if (c) oscuros++;
    const total = t * t;
    const k = Math.ceil(Math.abs(oscuros * 20 - total * 10) / total) - 1;
    p += Math.max(0, k) * 10;
    return p;
  }
}

/** Matriz del QR (nivel M, modo byte UTF-8, versión automática). `m[y][x] === true` → módulo oscuro. Sin margen. */
export function qrMatriz(texto) {
  const { ver, datos } = codificar(texto);
  const q = new Matriz(ver);
  q.patronesFuncion();
  q.palabras(intercalarConECC(ver, datos));
  let mejor = 0, minP = Infinity;
  for (let k = 0; k < 8; k++) {
    q.mascara(k); q.formato(k);
    const p = q.penalizacion();
    if (p < minP) { minP = p; mejor = k; }
    q.mascara(k); // deshace (XOR)
  }
  q.mascara(mejor); q.formato(mejor);
  return q.m.map((f) => f.slice());
}

const escAttr = (s) => String(s).replace(/[&"<>]/g, (c) => ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" })[c]);

/** SVG del QR como cadena. `margen` en módulos (la norma recomienda 4; 2 suele bastar en pantalla). */
export function qrSVG(texto, { margen = 2, color = "#000", fondo = "#fff" } = {}) {
  const m = qrMatriz(texto);
  const t = m.length, total = t + margen * 2;
  let d = "";
  for (let y = 0; y < t; y++) {
    for (let x = 0; x < t; x++) {
      if (!m[y][x]) continue;
      let w = 1;
      while (x + w < t && m[y][x + w]) w++;
      d += `M${x + margen} ${y + margen}h${w}v1h-${w}z`;
      x += w - 1;
    }
  }
  const bg = fondo && fondo !== "transparent" && fondo !== "none" ? `<rect width="${total}" height="${total}" fill="${escAttr(fondo)}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" role="img" aria-label="Código QR">${bg}<path d="${d}" fill="${escAttr(color)}"/></svg>`;
}
