# cre8eight · Adaptación: revisión de ingeniería front-end

Parte A del [encargo](adaptacion-encargos.md). Revisa el visor (`index.html`, `visor.*`, `paneles.*`, `maqueta.js`), el Estudio (`estudio*.{html,css,js}`) y la Guía Osmo 360 (`asistente-osmo.html`), con `tema.css`/`tema.js`. No se ha tocado código.

**Material:**
- `<AUDITORIA>/v1/`: capturas y `metricas.json` comunes.
- `<AUDITORIA>/ing/`: capturas propias, hechas con `ing/auditar-ing.mjs`, que es una copia del script que admite tamaños libres (`TAMS=nombre:AxB`) y `?talla=` (`QS=`):
  - `c1`: 900×700, ratón;
  - `c2`: iPad mini en vertical, 744×1133, táctil;
  - `c3`: ventana de 1280×520, ratón;
  - `c4`: teléfono en horizontal, 844×390, talla L;
  - `c5`: 360×740, talla S.

**Números de línea:** son los de `HEAD` (`6a649d2`, rama `ccr-40d07831-qbgzrt`).
- Durante la revisión, otro proceso modificó el árbol de trabajo:
  - `tema.css`: suelos de letra y `:hover` dentro de `@media (hover)`;
  - `visor.css`, `paneles.css` y `estudio.css`: `:hover`;
  - `estudio.js`: el foco del aviso del teléfono;
  - `plano.js`: la letra mínima del radar.
- Por eso las líneas pueden haberse movido unas pocas posiciones.
- ING-11 (escala) e ING-15 (`:hover`) pueden estar ya cubiertos en parte por esos cambios. El orquestador debe conciliarlos.

**Resumen:** P1 2 · P2 11 · P3 9.

Lo más importante:
1. Hay **cuatro definiciones de «teléfono»** que no coinciden entre el CSS y el JS. Se propone un sistema único (§0).
2. El **Estudio trata el iPad mini como un teléfono** (ING-1).
3. **El plano del Estudio no se puede editar con el dedo** (ING-2).
4. El **teclado del móvil** no se gestiona en ningún sitio (ING-5).
5. La **vista previa «Ordenador»** del Estudio enseña el diseño del teléfono (ING-6).

---

## 0. Propuesta: sistema único de puntos de corte

### 0.1 Lo que hay hoy

| Qué decide | Dónde | Consulta o cálculo |
|---|---|---|
| Teléfono en vertical (CSS) | `visor.css:458`, `:470`, `:499` | `(max-width: 540px)` |
| Teléfono en horizontal (CSS) | `visor.css:481`, `:499`, `:506` | `(max-height: 540px) and (orientation: landscape)` |
| Tablet en vertical, con los modos abajo | `visor.css:447`, `:452` | `(orientation: portrait) and (max-width: 1024px)`, `(orientation: landscape) and (max-width: 62em) and (min-height: 541px)` |
| Diseño móvil (JS del núcleo) | `visor.js:21` `MQ_MOVIL` | `(max-width: 720px), (orientation: portrait) and (max-width: 1024px), (max-height: 500px) and (orientation: landscape)` |
| Sello en el teléfono (JS) | `visor.js:849` `MQ_SELLO` | `(max-width: 540px) and (orientation: portrait)` |
| Disposición de los paneles (JS) | `paneles.js:301` `calcularDisposicion()` | Aritmética con `innerWidth` e `innerHeight`: `h ≤ 500 && w > h` → compacta; `w ≤ 720 \|\| (h > w && w ≤ 1024)` → hoja |
| Paneles (CSS) | `paneles.css:98`, `:172`, `:596`, `:601`, `:639` | 599 y 600, 560, `max-height: 450px`, 720 |
| Estudio en el teléfono (CSS) | `estudio.css:731` | `(max-width: 759px)` |
| Barra del Estudio (CSS, en `em`) | `estudio.css:68–76` | 80em, 68.75em, 53.75em y 47.4375em (1280, 1100, 860 y 759 px) |
| Columnas del Estudio | `estudio.css:685`, `:699`, `:715`, `:146`, `:147`, `:307`, `:20` | 1280, 1100, 860, 861, 1101, 1600 y 2200 px |
| Aviso del Estudio en el teléfono (JS) | `estudio.js:476` | `(pointer: coarse) and (max-width: 759px), (pointer: coarse) and (max-height: 479px)` |
| Guía: «Abrir el Estudio» o «Necesita un ordenador» | `asistente-osmo.html:87` | `(min-width: 760px)` |
| Detección táctil | `visor.js:18–19`, `paneles.js:168` | `pointer: coarse` o `"ontouchstart" in window` (estática en el núcleo); `pointer: fine` (estática) |

**Consecuencias medidas:**
- **Altos de 501 a 540 en horizontal.**
  - El CSS los trata como un teléfono: quita la tira de estancias y la pantalla completa.
  - El JS los trata como escritorio: tarjeta lateral, y la pantalla completa no pasa a «Más».
  - Resultado: no hay tira ni pantalla completa en ningún sitio. Captura: `ing/c3/visor-1-recorrido-escritorio-bajo.png`, a 1280×520 (ING-3).
- **iPad mini en vertical (744 px).**
  - El Estudio lo trata como un teléfono: aviso y diseño móvil.
  - La Guía le dice «El Estudio necesita un ordenador o un iPad».
  - Captura: `ing/c2/estudio-0-inicio-ipad-mini.png` (ING-1).
- **Pantalla cuadrada.**
  - El CSS dice `portrait` cuando el alto es mayor o igual que el ancho; `paneles.js` exige `h > w`.
  - A 1000×1000 el CSS monta la tablet en vertical y los paneles el escritorio.
- **iPad Pro de 13" (2024) en vertical, 1032×1376.** Pasa el tope de 1024 y recibe el diseño de escritorio. Los demás iPad en vertical reciben el de la tablet.
- **Mismo criterio, distinto motor.**
  - `paneles.js` calcula con `innerWidth`/`innerHeight` y el CSS con `matchMedia`.
  - Con el zoom de página, que deja anchos fraccionarios, o con el teclado en un WebView, las dos respuestas pueden no coincidir.

### 0.2 Tabla canónica

Son 6 consultas con nombre más 3 de entrada. El resto son ajustes de contenido de cada página: las columnas del Estudio y la barra en `em`.

| Nombre | Consulta (literal, igual en CSS y JS) | Qué es |
|---|---|---|
| `telefono` | `(max-width: 599.98px)` | Teléfono en vertical. El mayor mide 430 px. Las tablets de 7" empiezan en 600 |
| `apaisado` | `(orientation: landscape) and (max-height: 499.98px)` | Teléfono en horizontal (430 px de alto como mucho) y ventanas muy bajas |
| `compacto` | `(max-width: 599.98px), (orientation: landscape) and (max-height: 499.98px)` | `telefono` o `apaisado`: sin tira ni pantalla completa; el Estudio avisa |
| `vertical` | `(orientation: portrait) and (max-width: 1100px)` | Tablet en vertical, iPad Pro de 13" incluido: modos abajo, tira a lo ancho |
| `hoja` | `(max-width: 719.98px) and (min-height: 500px), (orientation: portrait) and (max-width: 1100px)` | La tarjeta como hoja inferior: teléfono y tablet en vertical, y ventanas estrechas |
| `estrecho` | `(orientation: landscape) and (max-width: 62em) and (min-height: 500px)` | Horizontal estrecho: modos abajo. Va en `em` para seguir la letra del navegador (A12) |
| `tactil` | `(pointer: coarse)` | Objetivos de 44 px y campos de 16 px |
| `raton` | `(hover: hover) and (pointer: fine)` | `:hover`, modo juego |
| `algun-tactil` | `(any-pointer: coarse)` | Gestos táctiles disponibles: portátil táctil, iPad con trackpad |

**Reglas:**
- **Prioridad de la disposición de los paneles:**
  - `apaisado` → compacta;
  - si no, `hoja` → hoja;
  - si no → lateral.
  - `hoja` excluye el alto menor de 500 para no solaparse con `apaisado` (un móvil de 640×360 es `apaisado`).
- Los topes van en `.98px` (`599.98`) y los mínimos en número entero (`600`): con el zoom no quedan huecos fraccionarios.
- **Ajustes de contenido de cada página:**
  - Estudio:
    - columnas en px: 1280, 1100 y 860, con sus complementarias 1101 y 861;
    - 1600 y 2200;
    - la barra en `em`. Lo ideal es pasar la barra a `@container`, porque depende del ancho de la barra y no del dispositivo.
  - Contenedores con `@container`.
  - Ninguno de estos ajustes decide «teléfono» ni «tablet».

### 0.3 Dónde vive

- **`tema.js`**, que ya se carga el primero en las tres páginas y en el HTML exportado (`exportar.js:527`), es la única fuente para el JS:

```js
// tema.js — puntos de corte del sistema (docs/diseno/sistema.md § Puntos de corte). Los mismos literales en el CSS.
var MQ = {
  telefono: "(max-width: 599.98px)",
  apaisado: "(orientation: landscape) and (max-height: 499.98px)",
  compacto: "(max-width: 599.98px), (orientation: landscape) and (max-height: 499.98px)",
  vertical: "(orientation: portrait) and (max-width: 1100px)",
  hoja: "(max-width: 719.98px) and (min-height: 500px), (orientation: portrait) and (max-width: 1100px)",
  estrecho: "(orientation: landscape) and (max-width: 62em) and (min-height: 500px)",
  tactil: "(pointer: coarse)", raton: "(hover: hover) and (pointer: fine)", algunTactil: "(any-pointer: coarse)",
};
function forma() { // una palabra para el <html> y para quien la pida
  return consulta(MQ.apaisado).matches ? "apaisado" : consulta(MQ.telefono).matches ? "telefono"
    : consulta(MQ.vertical).matches ? "vertical" : consulta(MQ.estrecho).matches ? "estrecho" : "escritorio";
}
function marcarForma() { document.documentElement.setAttribute("data-forma", forma()); }
marcarForma();
Object.keys(MQ).forEach(function (k) { var m = consulta(MQ[k]); m.addEventListener && m.addEventListener("change", marcarForma); });
// en el objeto público:  window.cre8Tema.MQ = MQ; window.cre8Tema.forma = forma;
```

- **El CSS** usa los mismos literales en `@media`. Los atributos `data-forma` quedan para depurar y para las pruebas: si `tema.js` no cargara, el CSS seguiría bien.
- **Prueba que bloquea los números sueltos.** Nuevo `pruebas/puntos-corte.mjs`:
  - extrae todas las `@media` de `visor.css`, `paneles.css`, `estudio.css` y `asistente-osmo.html`;
  - falla si aparece una medida de ancho o alto que no esté en la lista: `599.98px 600px 499.98px 500px 719.98px 1100px 62em 860px 861px 1101px 1280px 1600px 2200px 80em 68.75em 53.75em 47.4375em`.
  - Así no vuelven el 540, el 560, el 450, el 479, el 759, el 760 ni el 1024.
- **`docs/diseno/sistema.md`:** sección «Puntos de corte» con la tabla 0.2 y la matriz 0.5.

### 0.4 Cambios por archivo

**`tema.js`**
- Añadir `MQ`, `forma()` y `data-forma`, como en 0.3.

**`visor.css`**

| Línea | Hoy | Pasa a |
|---|---|---|
| 447 | `(orientation: portrait) and (max-width: 1024px), (orientation: landscape) and (max-width: 62em) and (min-height: 541px)` | `(orientation: portrait) and (max-width: 1100px), (orientation: landscape) and (max-width: 62em) and (min-height: 500px)` (`vertical` o `estrecho`) |
| 452 | `(orientation: portrait) and (max-width: 1024px)` | `(orientation: portrait) and (max-width: 1100px)` (`vertical`) |
| 458 | `(max-width: 540px)` | `(max-width: 599.98px)` (`telefono`). Ningún teléfono real cambia; queda alineado con los paneles |
| 470 | `(max-width: 540px) and (orientation: portrait)` | `(max-width: 599.98px) and (orientation: portrait)` |
| 481 y 506 | `(max-height: 540px) and (orientation: landscape)` | `(orientation: landscape) and (max-height: 499.98px)` (`apaisado`) |
| 499 | `(max-width: 540px), (max-height: 540px) and (orientation: landscape)` | `(max-width: 599.98px), (orientation: landscape) and (max-height: 499.98px)` (`compacto`) |
| 440–446 (comentario) | «Teléfono = 540…» | Remite a `sistema.md § Puntos de corte` |

- `:hover` sueltos: ver ING-15.

**`paneles.css`**

| Línea | Hoy | Pasa a |
|---|---|---|
| 98 | `(max-width: 599px)` | `(max-width: 599.98px)` |
| 172 | `(min-width: 600px)` | Sin cambio |
| 596 | `(max-width: 560px)` | `(max-width: 599.98px)` |
| 601 | `(max-height: 450px)` | `(orientation: landscape) and (max-height: 499.98px)` |
| 639 | `(max-width: 720px)` | `(max-width: 719.98px)` |
| 18, 86, 420, 464, 467, 559, 574, 579 y 621 | `z-index` numéricos dentro de un contexto propio | Tokens, ver ING-4 |

**`estudio.css`**

| Línea | Hoy | Pasa a |
|---|---|---|
| 731 | `(max-width: 759px)` | `(max-width: 599.98px), (orientation: landscape) and (max-height: 499.98px)` (`compacto`). El iPad mini pasa al diseño de iPad en vertical (`:715`) |
| 76 | `(max-width: 47.4375em)` (barra) | Se queda: es un ajuste de la barra. O mejor, `#barra-sup { container: barra / inline-size }` y `@container barra (max-width: 47.4375em)` |
| 68–70, 685, 699, 715, 146, 147, 307 y 20 | Columnas | Sin cambio, documentadas como ajustes del Estudio |
| Nueva | — | Bloque `apaisado` para el plano (ING-13) |
| 739 | `(pointer: coarse)` | Sin cambio (`tactil`) |

**`asistente-osmo.html`**
- Línea 87: `@media (min-width: 760px)` pasa a `@media (min-width: 600px) and (min-height: 500px), (pointer: fine)`.
  - Coincide con el aviso del Estudio: «Abrir el Estudio» en el iPad mini; «Necesita un ordenador» en el teléfono, también en horizontal.
- Bloque nuevo `apaisado`, con la cabecera sin `sticky` (P3, ING-3):

```css
@media (orientation: landscape) and (max-height: 499.98px) { .cabecera { position: static; } .pie { padding-block: var(--e-2) calc(var(--e-2) + env(safe-area-inset-bottom, 0px)); } }
```

**`visor.js`**

```js
// 18–21
const MQ = globalThis.cre8Tema?.MQ ?? { compacto: "(max-width: 599.98px), (orientation: landscape) and (max-height: 499.98px)",
  hoja: "(max-width: 719.98px) and (min-height: 500px), (orientation: portrait) and (max-width: 1100px)",
  telefono: "(max-width: 599.98px)", tactil: "(pointer: coarse)", algunTactil: "(any-pointer: coarse)", raton: "(hover: hover) and (pointer: fine)" };
const MQ_MOVIL = matchMedia(`${MQ.hoja}, ${MQ.apaisado ?? "(orientation: landscape) and (max-height: 499.98px)"}`); // = disposición no lateral
// 849
const MQ_SELLO = matchMedia(`${MQ.telefono} and (orientation: portrait)`);
```

- `esTactil` y `conRaton`: ver ING-7.

**`paneles.js`**
- Líneas 301–305: la disposición sale de `matchMedia` con los mismos literales, no de aritmética.

```js
const MQP = globalThis.cre8Tema?.MQ ?? { apaisado: "(orientation: landscape) and (max-height: 499.98px)",
  hoja: "(max-width: 719.98px) and (min-height: 500px), (orientation: portrait) and (max-width: 1100px)" };
function calcularDisposicion() {
  if (matchMedia(MQP.apaisado).matches) return "compacta";
  if (matchMedia(MQP.hoja).matches) return "hoja";
  return "lateral";
}
```

- Líneas 237–240: el cambio de disposición escucha el `change` de esas dos consultas, con la protección del teclado de ING-5. El `resize` queda solo para `colocar()`.

**`estudio.js`**
- Línea 476:

```js
const MQ = globalThis.cre8Tema?.MQ;
const pequena = matchMedia(`(pointer: coarse) and (max-width: 599.98px), (pointer: coarse) and (orientation: landscape) and (max-height: 499.98px)`).matches;
```

### 0.5 Matriz de dispositivos: hoy y con el sistema

| Pantalla (px CSS) | `visor.css` hoy | Paneles hoy | `MQ_MOVIL` hoy | Estudio hoy | Con el sistema |
|---|---|---|---|---|---|
| iPhone 390×844 | teléfono | hoja | móvil | aviso | `telefono` · hoja · aviso |
| iPhone en horizontal, 844×390 | horizontal | compacta | móvil | aviso | `apaisado` · compacta · aviso |
| iPad mini en vertical, 744×1133 | tablet vertical | hoja | móvil | **aviso y diseño móvil** | `vertical` · hoja · Estudio de iPad |
| iPad en vertical, 820×1180 | tablet vertical | hoja | móvil | iPad vertical | Igual |
| iPad Pro 13" en vertical, 1032×1376 | **escritorio** | **lateral** | escritorio | iPad (≤1100) | `vertical` · hoja |
| iPad en horizontal, 1180×820 | escritorio | lateral | escritorio | ≤1280 | Igual |
| Ventana de 1280×520 | **teléfono horizontal** | **lateral** | escritorio | — | `escritorio` en los dos (tira y pantalla completa) |
| Ventana de 1000×1000 | tablet vertical | **lateral** | móvil | — | `vertical` · hoja en los dos |
| Ventana de 900×700 | estrecho | lateral | escritorio | — | Igual (y ING-9) |

---

## 1. P1: se ve roto o no se puede usar

### ING-1 · El Estudio trata el iPad mini y las tablets de 7–8" como un teléfono
- **Prioridad:** P1.
- **Dónde:** Estudio, al abrir y en todos los pasos.
  - iPad mini en vertical (744×1133) y tablets Android de 600 a 759 px en vertical.
  - De rebote, la Guía.
- **Evidencia:**
  - `ing/c2/estudio-0-inicio-ipad-mini.png`: en un iPad sale «El Estudio necesita un ordenador o un iPad».
  - Tras «Seguir aquí», `ing/c2/estudio-2-plano-ipad-mini.png`: el diseño de teléfono, con el lienzo a `60vh` y la barra mínima.
  - La Guía a 744 enseña el texto `.solo-movil`: «El Estudio necesita un ordenador o un iPad».
  - A 844×390, en cambio, enseña el botón «Abrir el Estudio» (`v1/guia-0-inicio-movil-h.png`), que lleva al aviso.
- **Causa:**
  - `estudio.js:476`: `(pointer: coarse) and (max-width: 759px)`.
  - `estudio.css:731`: `(max-width: 759px)`.
  - `asistente-osmo.html:87`: `(min-width: 760px)`.
  - El tope de 759 cae por encima de los 744 del iPad mini.
- **Corrección:** las tres consultas de §0.4 (`compacto` y táctil para el aviso; `compacto` para el diseño; `600 y alto ≥ 500, o ratón` para la Guía).

### ING-2 · Plano del Estudio: con el dedo no se aciertan esquinas, bordes ni conexiones, y pellizcar dibuja
- **Prioridad:** P1. El Estudio es «para ordenador o iPad», y el plano es el paso que más se toca.
- **Dónde:** Estudio, paso «Plano», todas las herramientas, en tablets táctiles (iPad 820×1180 y 1180×820, Android).
- **Evidencia:**
  - En el código, la detección de lo que hay bajo el dedo usa radios fijos en píxeles de pantalla:

    | Elemento | Radio | Dónde |
    |---|---|---|
    | Vértice | 9 px | `estudio-plano.js:830` |
    | Borde | 7 px | `:847` |
    | Conexión | 6 px | `:861` |
    | Muro | 6 px | `:842` |
    | Foto | 15 px | `:816` |
    | Cerrar el contorno | 10 px | `:906` |

  - Un dedo cubre unos 44 px (`--toque-minimo`).
  - En `v1/estudio-2-plano-tablet.png` los vértices miden unos 6 px.
  - **Al pellizcar:**
    - El primer dedo ya ejecuta la herramienta en `pointerdown` (`:880–936`):
      - en «Estancia» añade un vértice (`S.borrador.push`);
      - en «Muro» empieza un muro;
      - en «Seleccionar» puede empezar a arrastrar un vértice o una foto.
    - El segundo dedo cambia a «pellizco» (`:886`), pero lo hecho con el primero se queda.
- **Causa:** la detección no tiene en cuenta `e.pointerType`, y la acción no espera a saber si es un toque o un gesto.
- **Corrección:**

```js
// estudio-plano.js — tolerancia según el puntero (también sigue la talla: el lienzo no)
const tolerancia = (px) => px * (S.puntero === "touch" ? 2.4 : S.puntero === "pen" ? 1.4 : 1);
// nodoEn: d = tolerancia(15) · verticeEn: < tolerancia(9) · bordeEn: < tolerancia(7) · enlaceEn: < tolerancia(6)
// muroEn: Math.max(tolerancia(6), 0.08 * S.esc) · cerrar contorno: < tolerancia(10)

c.addEventListener("pointerdown", (e) => {
  S.puntero = e.pointerType;
  // …
  if (S.punteros.size === 2) {
    if (S.arrastre?.clave) deshacerClave(S.arrastre.clave); // lo empezado con el primer dedo no cuenta (cambiar() con esa clave)
    S.pendiente = null;
    S.arrastre = { tipo: "pellizco", /* … */ }; return;
  }
  // Con el dedo, las herramientas de dibujo actúan al levantarlo (si no llegó un segundo dedo ni se movió)
  if (e.pointerType === "touch" && S.herr !== "sel") { S.pendiente = { id: e.pointerId, sx, sy, mundo }; return; }
  // … (igual que hoy)
});
const fin = (e) => {
  const p = S.pendiente; S.pendiente = null;
  if (p?.id === e.pointerId) { const [sx, sy] = posEvento(e); if (Math.hypot(sx - p.sx, sy - p.sy) < 10) accionHerramienta(p.mundo, p.sx, p.sy); }
  // … (igual que hoy)
};
```

- `accionHerramienta()` es el bloque actual de `else if (S.herr === "estancia" | "muro" | "calibrar" | "enlace")`, sacado a una función.
- **Con el dedo, en «Seleccionar»:** elegir lo más cercano entre el vértice y la foto, en vez de dar siempre preferencia al vértice. Con radios grandes, una foto pegada a una esquina deja de poder cogerse.
- **Cerrar el contorno y terminar un muro sin doble clic:** en iPad el `dblclick` no llega con `touch-action: none`.
  - Hace falta un botón «Cerrar» o «Terminar» en la pista mientras hay borrador. Si no existe, se crea.
  - Es un control contextual: no es un panel nuevo.

---

## 2. P2: conviene

### ING-3 · Puntos de corte divergentes entre el CSS y el JS
- **Prioridad:** P2.
- **Dónde:**
  - Visor, en ventanas de 501 a 540 de alto en horizontal, en pantallas cuadradas y en el iPad Pro de 13" en vertical.
  - Paneles, Estudio y Guía, en las pantallas de la matriz §0.5.
- **Evidencia:**
  - `ing/c3/visor-1-recorrido-escritorio-bajo.png` y `ing/c3/visor-4-ficha-escritorio-bajo.png` (1280×520, ratón): no hay tira de estancias ni botón de pantalla completa en la barra.
  - «Más» tampoco ofrece la pantalla completa, porque `elementosMas()` solo la añade con `ui.disp !== "lateral"` (`paneles.js:817`).
- **Causa:** la tabla §0.1.
- **Corrección:** §0 completo.

### ING-4 · Capas: los paneles se apilan en una escala aparte, y el aviso del núcleo tapa sus hojas
- **Prioridad:** P2.
- **Dónde:**
  - Visor, en todas las disposiciones.
  - Visible en el teléfono en vertical con la hoja «Estilo y luz» abierta cuando salta `aviso.estilo_no_disponible` (`visor.js:712`, `:785`).
- **Evidencia:** por código.
  - `#paneles` está dentro de `#app` (`index.html:182`), y los dos crean contexto de apilamiento:
    - `#app` porque es `position: fixed`;
    - `.pn-raiz` porque es `position: fixed; z-index: 30` (`paneles.css:18`).
  - Así, los `z-index` 31 a 60 de los paneles son locales. Fuera valen 30:
    - `.pn-tarjeta` 31;
    - `.pn-velo` 35;
    - `.pn-dialogo` 40;
    - `.pn-menu` 42;
    - `.pn-destello` 44;
    - `.pn-barra-captura` 45;
    - `.pn-toast` 50;
    - `.pn-lb` 60.
  - En consecuencia:
    - `#aviso` (`--z-aviso`, 50) y `#menu-mas` (`--z-menu` + 5) quedan **encima** de los diálogos, del visor de imágenes y del velo de los paneles.
    - En el teléfono, `#aviso` va abajo (`visor.css:466`, a unos 150 px del borde) y cae dentro de la hoja «Estilo y luz» (`40dvh`), por encima de las opciones.
- **Causa:** dos escalas de `z-index` (los tokens de `tema.css:114–119` y los números de `paneles.css`) y un contexto de apilamiento que no hace falta, porque todas las piezas de los paneles son `fixed`.
- **Corrección:**

```css
/* paneles.css */
.pn-raiz { position: static; z-index: auto; /* sin contexto propio: cada pieza fija se apila en la escala común */ }
.pn-tarjeta       { z-index: calc(var(--z-panel, 20) + 2); }   /* sobre el HUD, el sello y la nota «i» */
.pn-menu          { z-index: calc(var(--z-menu, 30) + 5); }    /* como #menu-mas */
.pn-velo          { z-index: calc(var(--z-dialogo, 40) - 1); }
.pn-dialogo       { z-index: var(--z-dialogo, 40); }
.pn-destello      { z-index: calc(var(--z-dialogo, 40) + 4); }
.pn-barra-captura { z-index: calc(var(--z-dialogo, 40) + 5); }
.pn-lb            { z-index: calc(var(--z-dialogo, 40) + 8); }
.pn-toast         { z-index: var(--z-aviso, 50); }
/* visor.css: con una hoja de los paneles abierta, el aviso del núcleo sube arriba en el teléfono */
@media (max-width: 599.98px) { body:has(#paneles .pn-dialogo) #aviso { top: var(--arriba); bottom: auto; } }
```

- **Orden resultante:**
  - lienzo y etiquetas (0);
  - HUD (10–16);
  - nota «i» (20);
  - tarjeta (22);
  - menús (35);
  - velo y diálogos (39–48);
  - avisos (50);
  - portada y carga (60);
  - los `<dialog>` nativos, en la capa superior.
- Documentarlo en `sistema.md § Capas`.

### ING-5 · Teclado del móvil: no se gestiona en ninguna página
- **Prioridad:** P2.
- **Dónde:**
  - Contacto (`.pn-dialogo-contacto`): en la hoja (teléfono y tablet en vertical) y en la compacta (teléfono en horizontal).
  - Diálogos `c8-dialogo` del Estudio con campos.
- **Evidencia:**
  - En el código no hay `visualViewport` (búsqueda en todo el proyecto).
  - En la hoja, el pie con la privacidad y «Enviar por WhatsApp» (`.pn-form-pie`, `paneles.css:362`) va pegado abajo y queda debajo del teclado mientras se escribe.
  - En horizontal, el diálogo ocupa de arriba abajo (`paneles.css:451`, capturas `v1/visor-5-contacto-movil-h.png` y `ing/c4/visor-5-contacto-movil-h-L.png`). Con el teclado quedan unos 150 px visibles, y el área de texto ya sale cortada sin él.
  - **Riesgo de reconstrucción del diálogo:** en WebViews que redimensionan al abrir el teclado (Instagram o Facebook en Android) y en teléfonos pequeños (360×640 → 360×350 con el teclado):
    - `calcularDisposicion()` pasa de «hoja» a «compacta» (`paneles.js:303`);
    - el `resize` llama a `renderizar()` (`:238`), que rehace el diálogo con `replaceChildren`;
    - el campo pierde el foco, el teclado se cierra y la disposición vuelve atrás.
- **Corrección:**

```js
// paneles.js, en iniciarPaneles(): el alto que tapa el teclado, publicado como variables
const vv = globalThis.visualViewport;
if (vv) {
  const alTeclado = () => {
    const tapa = Math.max(0, Math.round(document.documentElement.clientHeight - vv.height - vv.offsetTop));
    const s = document.documentElement.style;
    s.setProperty("--teclado", `${tapa > 80 ? tapa : 0}px`);
    s.setProperty("--alto-visible", `${Math.round(vv.height)}px`);
    raiz?.classList.toggle("pn-con-teclado", tapa > 80);
  };
  escuchar(vv, "resize", alTeclado); escuchar(vv, "scroll", alTeclado); alTeclado();
}
// y en el cambio de disposición: con un campo de los paneles enfocado y el mismo ancho, es el teclado: no se rehace nada
let anchoAntes = innerWidth;
const alCambiarForma = () => {
  const campo = document.activeElement?.matches?.("input, textarea, select") && raiz?.contains(document.activeElement);
  if (campo && innerWidth === anchoAntes) { colocar(); return; }
  anchoAntes = innerWidth;
  const d = calcularDisposicion();
  if (d !== ui.disp) { /* como hoy */ } else { colocar(); sincronizarMas(); }
};
```

```css
/* paneles.css */
.pn-disp-hoja .pn-dialogo { bottom: calc(var(--pn-margen) + max(var(--pn-inf), var(--teclado, 0px)));
  max-height: calc(min(88dvh, var(--alto-visible, 100dvh)) - 2 * var(--pn-margen) - var(--pn-sup)); }
.pn-disp-compacta .pn-dialogo { bottom: calc(var(--e-2) + max(var(--pn-inf), var(--teclado, 0px))); }
/* con el teclado, el pie se reduce a lo imprescindible: la casilla y «Enviar» */
.pn-con-teclado :is(.pn-rgpd, .pn-directo) { display: none; }
/* tema.css (Estudio y núcleo): los diálogos nativos tampoco quedan bajo el teclado */
.c8-dialogo { max-height: min(85dvh, 48rem, calc(var(--alto-visible, 100dvh) - 2rem)); }
```

- El aviso de los paneles ya se coloca sobre la hoja (`colocarAviso`). Con `bottom` del diálogo recalculado, sigue funcionando.
- Mantener `scrollIntoView({ block: "nearest" })` (`paneles.js:359`) también tras `alTeclado`.

### ING-6 · Estudio: la vista previa «Ordenador» enseña el diseño del teléfono
- **Prioridad:** P2. Engaña al agente sobre lo que verá el comprador en el portátil.
- **Dónde:** Estudio, todos los pasos, panel «Vista previa» en modo «Ordenador», en el portátil, el escritorio, la tablet en horizontal y la pantalla de 1920.
- **Evidencia:**
  - `v1/estudio-1-fotos-escritorio.png`, `v1/estudio-3-datos-escritorio.png` y `v1/estudio-2-plano-tablet-h.png`.
  - Dentro de la vista previa salen:
    - la barra de vista en vertical (la regla `max-width: 540px`);
    - la tarjeta como hoja;
    - ninguna tira de estancias.
- **Causa:**
  - `#iframe-visor` ocupa el panel: unos 500 px de ancho, `--ancho-vista: clamp(22rem, 36vw, 40rem)`.
  - El visor decide su disposición por el *viewport* del iframe.
  - El modo «Móvil» sí tiene tamaño propio (`estudio.css:410`); «Ordenador» no.
- **Corrección:** iframe con un *viewport* lógico de 1280×800, escalado para caber, en formato carta.

```css
/* estudio.css */
.vista-marco { overflow: hidden; }
body:not(.vista-movil):not(.grabando) #iframe-visor { inset: 0 auto auto 0; width: 1280px; height: 800px;
  transform: translate(var(--vista-x, 0px), var(--vista-y, 0px)) scale(var(--vista-k, 1)); transform-origin: 0 0; }
```

```js
// estudio.js, junto a fijarDispositivo()
const marco = $("#vista .vista-marco");
new ResizeObserver(([e]) => {
  const { width: w, height: hh } = e.contentRect, k = Math.min(w / 1280, hh / 800, 1);
  marco.style.setProperty("--vista-k", k);
  marco.style.setProperty("--vista-x", `${Math.round((w - 1280 * k) / 2)}px`);
  marco.style.setProperty("--vista-y", `${Math.round((hh - 800 * k) / 2)}px`);
}).observe(marco);
```

- El texto queda pequeño en el panel de 500 px, que es lo honesto para «Ordenador».
- El botón ⤢ (`vista-grande`) ya amplía la vista.
- Los punteros funcionan dentro de un iframe transformado.

### ING-7 · La detección táctil es estática y usa `ontouchstart`: los portátiles táctiles reciben las imágenes del móvil
- **Prioridad:** P2.
- **Dónde:** visor en portátiles y monitores con pantalla táctil (Windows, Chromebook) y en el iPad con trackpad.
- **Evidencia:** por código.
  - En `visor.js:18`, `esTactil = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window`. Con Chrome en un portátil táctil es `true` aunque el puntero principal sea el ratón. De ahí:
    - `urlNodo` (`:349`) carga `imagen_movil`, a 4096 px. A 1920 px con un campo de visión de 72°, eso es unos 820 px de textura para 1920 px de pantalla, frente a 1640 px con la de 8192.
    - `ratioBase` (`:177`) se limita a 1,5.
    - `LIMITE_TEX` (`:266`) baja a 4.
    - La precarga queda en una sola vecina (`:721`).
  - `conRaton` (`:19`) se calcula una vez. Un iPad al que se conecta un trackpad, o un portátil que se pliega, no activa ni desactiva el modo juego.
- **Causa:** se mezclan dos preguntas: «¿qué memoria de GPU hay?» y «¿cómo se maneja?». Y no se escuchan los cambios.
- **Corrección:**

```js
// visor.js 18–19
const mqTactil = matchMedia("(pointer: coarse)"), mqAlgunTactil = matchMedia("(any-pointer: coarse)"), mqRaton = matchMedia("(any-pointer: fine) and (any-hover: hover)");
const movilGPU = mqTactil.matches || (navigator.deviceMemory ?? 8) <= 4;   // memoria: decide imágenes, caché y resolución
let esTactil = mqAlgunTactil.matches;                                      // gestos y «Acercar/Alejar» en «Más»
let conRaton = mqRaton.matches;                                            // modo juego
mqAlgunTactil.addEventListener("change", () => { esTactil = mqAlgunTactil.matches; document.body.classList.toggle("tactil", esTactil); actualizarBtnMas(); });
mqRaton.addEventListener("change", () => { conRaton = mqRaton.matches; pintarBotonJuego?.(); });
// :177, :266, :349–350, :721 → movilGPU en lugar de esTactil
```

- **CSS:** los 44 px van con `pointer: coarse` (el puntero principal). En el portátil táctil conviene `any-pointer: coarse`, en `tema.css:164` y `:802`:

```css
@media (pointer: coarse), (any-pointer: coarse) and (hover: none) { … }
```

### ING-8 · Resolución del lienzo: la calidad adaptativa mide lo que no debe y nunca recupera
- **Prioridad:** P2. En la tablet el recorrido queda con DPR 1, borroso.
- **Dónde:** visor, recorrido, paseo libre y maqueta, en tablets y móviles. También el Estudio, en la vista previa.
- **Evidencia:** por código.
  - `visor.js:3593–3598` cuenta las iteraciones de `requestAnimationFrame`, también las que no pintan (se pinta bajo demanda, `:3500`), con `fps.n / fps.t`.
  - Si la media de 2 s baja de 28, resta 0,25 al *pixel ratio*, y **nunca lo vuelve a subir**.
  - Una descodificación de una foto de 8K en el hilo principal, al cambiar de estancia, basta para bajar un escalón para siempre.
  - Además, `ratioBase` (`:177`) no sigue los cambios de `devicePixelRatio`: una ventana que pasa del portátil (2×) a un monitor (1×), o al revés. Tampoco el lienzo del plano del Estudio (`estudio-plano.js:538`, que solo se redimensiona con `ResizeObserver`).
- **Corrección:**

```js
// visor.js
let ratioBase = calcRatio();
function calcRatio() { return Math.min(devicePixelRatio, movilGPU ? 1.5 : 2); }
(function vigilarDPR() {
  matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener("change", () => {
    ratioBase = calcRatio(); if (!int.captura) renderer?.setPixelRatio(ratioBase); redimensionar(); vigilarDPR();
  }, { once: true });
})();
// bucle(): contar solo los fotogramas pintados (pintado = true en las ramas que llaman a renderizar())
if (pintado) { fps.t += dt; fps.n++; }
if (fps.t > 2) {
  const media = fps.n / fps.t, pr = renderer.getPixelRatio();
  if (media < 28 && pr > 1 && !int.navDestino) { renderer.setPixelRatio(Math.max(1, pr - 0.25)); redimensionar(); fps.bien = 0; }
  else if (media > 50 && pr < ratioBase && ++fps.bien >= 3) { renderer.setPixelRatio(Math.min(ratioBase, pr + 0.25)); redimensionar(); fps.bien = 0; }
  fps.t = 0; fps.n = 0;
}
```

- En `estudio-plano.js`: llamar a `dimensionar()` también desde el mismo `matchMedia(resolution)`.

### ING-9 · Tira de estancias: la reserva para la tarjeta es simétrica y la tira se queda en nada
- **Prioridad:** P2.
- **Dónde:**
  - Visor, ficha abierta, disposición lateral, de 900 a 1280 de ancho (portátil pequeño, ventanas, tablet en horizontal con la ficha).
  - Por cálculo, también los modos en el horizontal `estrecho` de 720 a 992.
- **Evidencia:** `ing/c1/visor-4-ficha-escritorio-estrecho.png` (900×700): solo se ven 2 de las 4 estancias (Terraza y Jardín), en una tira de unos 186 px centrada en la pantalla, mientras a la izquierda sobran unos 300 px.
- **Causa:**
  - `visor.css:183–185`: `left: 50%; translateX(-50%); max-width: calc(100vw - 2 * (var(--ancho-dock) + var(--hud)))`.
  - Reserva el ancho de la tarjeta **a los dos lados**.
  - `#modos` (`:118` y `:449`) se centra en la pantalla sin tener en cuenta el dock. A 760 px de ancho, con la tarjeta de unos 345 px, los modos centrados pisan la tarjeta.
- **Corrección:** centrar en el hueco libre.

```css
/* visor.css: sustituye left/transform/max-width de #galeria (183–185) */
#galeria { left: calc(var(--hud) + var(--seg-izq)); right: calc(var(--ancho-dock, 0px) + var(--hud) + var(--seg-der));
  transform: none; width: fit-content; max-width: none; margin-inline: auto; }
/* modos y visita guiada abajo (vertical o estrecho): el mismo hueco */
@media (orientation: portrait) and (max-width: 1100px), (orientation: landscape) and (max-width: 62em) and (min-height: 500px) {
  #modos, #guion-barra { left: calc(var(--hud) + var(--seg-izq)); right: calc(var(--ancho-dock, 0px) + var(--hud) + var(--seg-der));
    transform: none; width: fit-content; margin-inline: auto; }
}
```

- `--ancho-dock` ya lo publica `paneles.js:685` cuando la tarjeta baja hasta abajo.

### ING-10 · Maqueta: el encuadre no descuenta el HUD ni los rótulos
- **Prioridad:** P2.
- **Dónde:** visor, maqueta, sobre todo en el teléfono en vertical y en horizontal.
- **Evidencia:** `v1/visor-7-maqueta-movil.png`:
  - el rótulo «Dormitorio 31 m²» empieza en x = 0 y sale cortado;
  - la casa queda centrada en la pantalla entera, no en el hueco entre la columna del título, el sol y el radar arriba y los modos y la tarjeta abajo.
- **Causa:** `maqueta.js:235–255`, `encuadrar()`, ajusta la caja 3D al campo de visión completo con un margen del 10 % (`d * 1.1`). No sabe qué tapa el HUD, y los rótulos HTML (centrados en la estancia) sobresalen de la caja.
- **Corrección:**

```js
// maqueta.js, encuadrar(): hueco libre en px (lo da el núcleo por ctx: alto de #esquina/#barra-vista arriba,
// --reserva-inferior + modos abajo, --ancho-dock a la derecha) y medio rótulo de margen a cada lado
const m = ctx.margenes?.() ?? { arriba: 0, abajo: 0, izq: 0, der: 0 }, W = innerWidth, H = innerHeight, rot = 60;
const fx = Math.max(0.4, 1 - (m.izq + m.der + 2 * rot) / W), fy = Math.max(0.4, 1 - (m.arriba + m.abajo + rot) / H);
// en el bucle de las 8 esquinas: … / (th * fx) y … / (tv * fy)
camara.setViewOffset(W, H, (m.der - m.izq) / 2, (m.abajo - m.arriba) / 2, W, H); // la casa, centrada en el hueco
camara.updateProjectionMatrix();
```

- `ctx.margenes` sale de `visor.js`:

```js
margenes: () => ({
  arriba: $("#esquina").getBoundingClientRect().bottom,
  abajo: innerHeight - Math.min($("#modos").getBoundingClientRect().top, innerHeight - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--reserva-inferior")) || 0)),
  izq: 0,
  der: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ancho-dock")) || 0,
})
```

- Volver a encuadrar en `redimensionar` mientras no se haya movido (ya lo hace, `:341`).

### ING-11 · Escala: con la talla S en el teléfono, botones, título y descripción a 10,7 px, por debajo del texto secundario
- **Prioridad:** P2.
- **Dónde:** visor, en todos los estados, a 360–430 de ancho con la talla S. También el Estudio y la Guía en el teléfono con S.
- **Evidencia:** `ing/c5/metricas.json` (360×740, `?talla=s`):

  | Texto | Tamaño |
  |---|---|
  | `#titulo` | 10,7 px |
  | «Contactar» | 10,7 px |
  | Elementos de «Más» | 10,7 px |
  | Descripción de la ficha (`p`) | 10,7 px |
  | «He leído y acepto…» | 10,7 px |
  | `.pn-dato-e` (con suelo) | 11 px |
  | `--t-sec` (con suelo) | 12 px |

  - La jerarquía queda al revés: lo secundario es más grande que los botones.
- **Causa:**
  - `tema.css:161`: la raíz es `clamp(14px, …) × 0,875` = 12,25 px.
  - `--t-micro`, `--t-pie` y `--t-sec` tienen suelo en px (V1 de la fase 4).
  - `--t-ui` (0.875rem = 10,7 px) y `--t-cuerpo` (1rem = 12,25 px), no.
  - A 1920×1080 la escala está bien: raíz de 17,1 px, y 20,2 px con la L.
- **Corrección:**

```css
/* tema.css 53–62 */
--t-ui: max(0.875rem, 12px);
--t-cuerpo: max(1rem, 13px);
--t-destacado: max(1.125rem, 15px);
/* (decisión del cliente «sin letra de menos de 12 px»: --t-pie: max(0.75rem, 12px); --t-micro solo para mayúsculas, documentado) */
```

- S sigue siendo menor que M (M en el teléfono: 12,25, 14 y 15,75 px). Solo deja de bajar de lo legible.

### ING-12 · Estudio, «Extras»: el título de la música sale como «[object Object]»
- **Prioridad:** P2. Es un fallo de datos que se ve en todos los tamaños; la métrica `recortes` lo destapó.
- **Dónde:** Estudio, paso «Extras», «Música de fondo», todos los tamaños, con la finca, que trae un título en varios idiomas.
- **Evidencia:** `v1/estudio-6-extras-movil.png`, con «[object …» junto a 1,3 MB. Métrica `.estirar.cortar «[object Object]»` en `estudio@6-extras`.
- **Causa:** `estudio-musica.js:63`, `text: m.titulo || …`, cuando `titulo` es `{ es, en }` (el `tour.json` de la finca).
- **Corrección:**

```js
import { textoDe } from "./estudio-nucleo.js";
h("b", { class: "estirar cortar", text: textoDe(m.titulo) || m.archivo.split("/").pop() })
```

### ING-13 · Estudio en el teléfono en horizontal (tras «Seguir aquí»): el plano mide unos 80 px de alto
- **Prioridad:** P2 bajo. El Estudio no es para el teléfono, pero se ofrece «Seguir aquí».
- **Dónde:** Estudio, paso «Plano», a 844×390.
- **Evidencia:** `v1/estudio-2-plano-movil-h.png`. También pisa la pista con el zoom (métrica `solapes`).
- **Causa:**
  - A 844 de ancho no entra la regla de 759 (`estudio.css:731`), sino la de 860 (`:715`): el plano y el panel van apilados en `100%` de un alto de 390 menos la barra.
  - El panel se lleva `38vh` y el lienzo, lo que sobra.
- **Corrección:** con `compacto` (§0.4), el lienzo pasa a un alto propio y el panel va debajo. Además, en horizontal, mejor lado a lado:

```css
@media (orientation: landscape) and (max-height: 499.98px) {
  .seccion.completa, .editor-plano { height: 100%; }
  .editor-plano { grid-template-columns: minmax(0, 1fr) 15rem; grid-template-rows: none; }
  .lienzo-plano { height: auto; flex: 1; }
  .plano-lado { max-height: none; }
}
```

---

## 3. P3: pulido

### ING-14 · Zonas seguras incompletas
- **Prioridad:** P3.
- **Dónde:**
  - Estudio en el iPad (indicador de inicio) y en el iPhone en horizontal tras «Seguir aquí» (muesca a 47 px).
  - Visor en el teléfono en horizontal.
- **Evidencia:** por código. Las tres páginas tienen `viewport-fit=cover` (bien), y el visor cubre los cuatro bordes en el HUD (`visor.css:10–16`) y en los paneles (`paneles.css:12–15`). Pero:
  - Estudio: `body.c8-base` (`estudio.css:22`) y `#toasts` (`:667`) no usan `env()`. Solo el aviso del teléfono (`:661`) lo hace.
  - Visor: los `max-width: calc(100vw - 2 * var(--hud))` de `#modos` (`:118`), `#pista` y `#tarjeta-juego` (`:234`), `#subtitulo` (`:393`), `#rotulo` (`:413`) y `#medir-barra` (`:374`) no descuentan `--seg-izq` ni `--seg-der`.
  - `#menu-mas`: `colocarMas()` (`visor.js:2547`) no descuenta la zona segura inferior.
  - Paneles: `.pn-toast` (`paneles.css:560`) y la píldora en reposo (`:204`, `:211`) usan `100vw - 2 * margen`.
- **Corrección:**

```css
/* estudio.css */
body.c8-base { padding: 0 env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px); }
#toasts { bottom: calc(var(--e-5) + env(safe-area-inset-bottom, 0px)); }
/* visor.css: una variable para el ancho útil */
:root { --ancho-util: calc(100vw - 2 * var(--hud) - var(--seg-izq) - var(--seg-der)); }
#modos, #pista, #tarjeta-juego, #subtitulo, #rotulo, #medir-barra, #menu-mas { max-width: min(var(--max, 100vw), var(--ancho-util)); }
#menu-mas { max-height: calc(100dvh - var(--arriba) - var(--hud) - var(--seg-inf) - var(--alto-control)); }
/* paneles.css */
.pn-toast { max-width: min(32rem, calc(100vw - 2rem - var(--pn-izq) - var(--pn-der))); }
```

- En `#pista` y `#subtitulo`, poner `--max` a su tope actual (30rem y 42rem).

### ING-15 · `:hover` sin `@media (hover: hover)`: el efecto se queda pegado al tocar
- **Prioridad:** P3.
- **Dónde:** visor y Estudio en táctil, en todos los tamaños táctiles.
- **Evidencia:** por código.
  - Los paneles ya lo hacen bien (`paneles.css:76`).
  - En el visor no:
    - `#lugar:hover` (`visor.css:59`);
    - `#galeria .estancia:hover` sube la miniatura (`:195`);
    - `#btn-pantalla:hover` separa las esquinas (`:166–171`);
    - `.maq-pin:hover` (`:368`);
    - `#cortinilla button:hover` (`:401`);
    - `.etq:hover` y `.info:hover` (`:325`, `:333`).
  - En el Estudio: `.foto:hover` y `#pasos button:hover`, entre otros.
- **Corrección:** meter esas reglas en `@media (hover: hover) and (pointer: fine) { … }`. Para `.etq` e `.info`, dejar fuera `:focus-visible` y `.resaltada`.

### ING-16 · Proyección y selección con `innerWidth` e `innerHeight` en vez del tamaño del lienzo
- **Prioridad:** P3.
- **Dónde:**
  - visor: etiquetas de la maqueta, medidas y selección con el puntero;
  - iOS con el teclado abierto o con zoom de página;
  - la vista previa del Estudio durante una grabación.
- **Evidencia:** por código:
  - `maqueta.js:290–297`;
  - `medicion.js:91`, `:156`, `:199–200`;
  - `visor.js:637`, `:1606`, `:1714–1717`, `:2211–2213`, `:3481`.
  - En iOS, `innerWidth` e `innerHeight` siguen al *viewport* visual (teclado o zoom), y el lienzo ocupa el `#app`, que es `100dvh`.
- **Corrección:**
  - Guardar el tamaño en `redimensionar()`:

```js
int.vista = { w: lienzo.clientWidth, h: lienzo.clientHeight };
```

  - Usarlo en todas las proyecciones, también en `renderer.setSize`.
  - Pasarlo a la maqueta y a la medición con `ctx.tamano()`.

### ING-17 · Maqueta: los rótulos de las estancias se pisan con los pines de las fotos
- **Prioridad:** P3.
- **Dónde:** visor, maqueta, en todos los tamaños.
- **Evidencia:** métrica `solapes` `.maq-estancia` / `.maq-pin` en los 11 tamaños; captura `v1/visor-7-maqueta-movil.png` (Dormitorio).
- **Causa:** `maqueta.js:283–293`. El rótulo se centra en el centro de la estancia y el pin en la foto, que suele estar cerca.
- **Corrección:** después de colocarlos en `cuadro()`, si el rectángulo de un rótulo corta el de un pin, bajar el rótulo bajo el pin.

```js
el.style.translate = "-50% 0.375rem"
```

  - Si sigue chocando, ocultar los m² en ese fotograma.

### ING-18 · Pista del plano del Estudio: una línea con elipsis, y con el texto del ratón en táctil
- **Prioridad:** P3.
- **Dónde:** Estudio, «Plano», en todos los tamaños.
- **Evidencia:** métrica `recortes` `.pista «Arrastra fotos y esquinas para a…»` en los 11 tamaños; en táctil dice «Rueda = zoom».
- **Causa:** `estudio.css:314` (`white-space: nowrap; text-overflow: ellipsis`) y `estudio-plano.js:12`.
- **Corrección:**

```css
.lienzo-plano .pista { white-space: normal; text-wrap: balance; max-width: min(36rem, calc(100% - 7.5rem)); }
```

```js
pista: matchMedia("(pointer: coarse)").matches
  ? "Arrastra fotos y esquinas para ajustarlas. Pellizca para acercar; arrastra el fondo para moverte."
  : "Arrastra fotos y esquinas para ajustarlas. Rueda = zoom; arrastra el fondo para moverte. Supr borra lo seleccionado."
```

### ING-19 · `vh` en el Estudio
- **Prioridad:** P3.
- **Dónde:** Estudio en tablet y teléfono, con la barra del navegador visible.
- **Evidencia:**
  - `estudio.css:735`: `.lienzo-plano { height: 60vh }`.
  - `:725`: `.plano-lado { max-height: 38vh }`.
  - `:367` y `:612`: `max-height: 50vh`.
  - `vh` es el *viewport* grande: con la barra del navegador a la vista sobra alto y aparece una barra de desplazamiento doble.
- **Corrección:** `svh` (`60svh`, `38svh`, `50svh`). El resto del proyecto ya usa `dvh` bien: `#app`, el `body` del Estudio, las hojas y los diálogos.

### ING-20 · Al girar el teléfono o la tablet con la ficha abierta, la ficha se cierra
- **Prioridad:** P3.
- **Dónde:** visor, ficha abierta, al pasar de hoja a compacta o lateral y al revés.
- **Causa:** `paneles.js:239`: `ui.altura = "peek"; ui.ficha = false` al cambiar de disposición. El contacto, en cambio, se conserva (`ui.dialogo`).
- **Corrección:**

```js
const f = ui.ficha;
ui.disp = d;
ui.menu = false;
ui.ficha = f;
ui.altura = f ? "alto" : "peek";
renderizar();
```

### ING-21 · Radar de 73 px en el teléfono en horizontal, con «Ampliar» tapando el 40 %
- **Prioridad:** P3.
- **Dónde:** visor, recorrido, a 844×390.
- **Evidencia:** recorte `ing/rec-movil-h-esquina.png` de `v1/visor-1-recorrido-movil-h.png`; métrica `solapes` disco/`#btn-ampliar` de 1640 px² en todos los tamaños.
- **Causa:**
  - `visor.css:482`: `--radar: 5.25rem`, que son 73 px a 14 px de raíz.
  - `#btn-ampliar` mide 44 px en táctil y va a `-0.25rem` (`:110`).
- **Corrección:** en `apaisado`, `--radar: 6.25rem` y separar el botón.

```css
#btn-ampliar { right: -0.75rem; bottom: -0.75rem; }
```

  - El alto lo permite: unos 210 px de 390 para la columna.
  - Es el radar del cliente: se mejora su tamaño, no se quita.

---

## 4. Métricas: falsos positivos y lo que ya está bien

**Falsos positivos de `metricas.json`:**
- **Estudio · `2-plano` · `fuera`** (tablet en horizontal, tablet Pro, portátil, escritorio y 1920): son los controles de «Avanzado», que está plegado (`<details>`), con el deslizador de conexión, «Ver o cambiar zonas…» y «Dibujar muros». Se miden aunque no se vean.
- **Estudio · `3-datos` · `tapados`:** son los campos del plegable cerrado «Más datos del inmueble», debajo de la tarjeta «Contacto propio».
- **Guía · `tapados` bajo `.pie`:** el pie es fijo y el contenido pasa por debajo con `padding-bottom: 7rem`. Con desplazar basta.
- **Visor · `4-ficha` · `#modos` y `#galeria` bajo `#pn-tarjeta`:** la hoja tapa a propósito. La tira sigue en el orden de tabulación detrás de la hoja (no modal en vertical), pero ese asunto es de accesibilidad.
- **Visor · `6-plano`, `3-ajustes`, `5-contacto` y `8-compartir` · `tapados`:** diálogos modales.
- **Estudio · `#nombre-proyecto` con elipsis en el teléfono:** está previsto (`estudio.css:53`).

**Lo que está bien:**
- **Sin desbordes:** `desbordeX = 0` en las 3 páginas, en los 11 tamaños y en mis 5 tamaños extra.
- **Alto de pantalla:** `#app` y el Estudio usan `100dvh`; las hojas, `dvh`; `html` y `body` tienen `overflow: hidden` y `overscroll-behavior: none`.
- **Teclados virtuales:** el contacto tiene `type="tel"`, `inputmode` y `autocomplete="name"`/`"tel"`. Los campos de 16 px en táctil evitan el zoom de iOS (`paneles.css:666`, `estudio.css:740`).
- **Reacción al girar y redimensionar:**
  - `visor.js:3497` reajusta el *renderer*, el campo de visión (80° en vertical y 72° en horizontal), las flechas, el radar, «Más» y la tira.
  - `MQ_SELLO` y el `ResizeObserver` de la esquina.
  - `paneles.js` recalcula la disposición.
  - La maqueta vuelve a encuadrar mientras no se haya tocado.
  - El Estudio es todo CSS, con `ResizeObserver` en el plano y en la máscara.
  - Falta lo de ING-5, ING-8 e ING-20.
- **La escala fluida en `vmin`** (`tema.css:161`) no cambia al girar: el teléfono tiene 14 px de raíz en los dos sentidos, y el iPad 15,2.
- **Lienzos con `devicePixelRatio` acotado:**
  - radar y plano a 2 como mucho (`plano.js:132`, `estudio-plano.js:538`);
  - modelo del Estudio (`estudio-material.js:79`);
  - visor a 1,5 en el móvil.
  - Un iPad de 13" en horizontal a 1,5 son unos 2050×1540 px de lienzo: razonable.

---

## 5. Orden de aplicación propuesto

1. **§0** (`tema.js` y literales en CSS y JS) con la prueba `pruebas/puntos-corte.mjs`. Cierra ING-1 (la parte del aviso y el diseño), ING-3 y parte de ING-13.
2. **ING-4:** capas, solo CSS.
3. **ING-9, ING-11 e ING-12:** CSS y una línea de JS.
4. **ING-2:** plano táctil.
5. **ING-5:** teclado.
6. **ING-6:** vista previa.
7. **ING-7 e ING-8:** detección y resolución. Volver a medir en el iPad y en un portátil táctil.
8. **ING-10:** maqueta.
9. **P3.**

**Verificación:** repetir `auditar.mjs` en los 11 tamaños, más 744×1133, 900×700, 1280×520 y 1032×1376, y `?talla=s` a 360.
