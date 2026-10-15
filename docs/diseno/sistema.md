# cre8eight · Sistema de diseño «minimal liquid glass»

Base común del visor, el Estudio y el Asistente. Archivos fuente:

- `tools/visor-inmobiliario/tema.css`: tokens y componentes.
- `tools/visor-inmobiliario/tema.js`: apariencia, talla y accesibilidad.
- Muestra viva: `tools/visor-inmobiliario/tema-muestra.html`. Enseña cada componente en claro y oscuro, en las tres tallas y sobre tres tipos de foto: día, noche y contraluz.

## Principios

1. **La vivienda es la protagonista.** Los controles flotan sobre la imagen como piezas de vidrio y no tapan más de lo necesario.
2. **Legible sobre cualquier foto.** La opacidad del vidrio está calculada para el peor caso: vidrio oscuro sobre pared blanca y vidrio claro sobre ventana de noche.
3. **Un solo acento.** Champán `#cfad66` en oscuro y `#c9a55a` en claro. El color de marca del tour (`marca.color`) lo sustituye, y las variantes derivadas se calculan con `color-mix()`.
4. **Movimiento con inercia.** Muelles en vez de curvas lineales. Con «Reducir movimiento» todo es instantáneo.
5. **Todo en variables.** Ningún componente usa colores fijos y los tamaños van en `rem`.

## Uso en una página

```html
<head>
  <script src="tema.js"></script>            <!-- síncrono: evita el destello del tema equivocado -->
  <link rel="stylesheet" href="tema.css">     <!-- antes del CSS propio -->
</head>
<body class="c8-base">                        <!-- opcional: tipografía y colores base -->
```

`tema.js` pone estos atributos en `<html>`:

| Atributo | Valores |
|---|---|
| `data-tema` | `claro` · `oscuro` |
| `data-talla` | `s` · `m` · `l` |
| `data-transparencia` | `normal` · `reducida` |
| `data-movimiento` | `normal` · `reducido` |

### Preferencias

Cada preferencia se guarda en `localStorage` (`cre8eight:tema|talla|transparencia|movimiento`) y se comparte entre las tres páginas, también entre pestañas abiertas.

Prioridad, de mayor a menor:

1. La URL (`?tema=claro&talla=l`), útil al incrustar el tour en la web de la agencia.
2. Lo que elige el visitante.
3. Lo que propone el tour (`cre8Tema.porDefecto({ tema })`).
4. Automático (el ajuste del sistema).

```js
cre8Tema.fijar("tema", "oscuro");          // auto | claro | oscuro
cre8Tema.fijar("talla", "l");              // s | m | l
cre8Tema.fijar("transparencia", "reducida");
cre8Tema.efectivo;                         // { tema: "oscuro", talla: "l", … } (lo aplicado)
const quitar = cre8Tema.alCambiar(({ efectivo }) => …);   // o el evento "cre8:tema" en document
cre8Tema.deslizador(input);                // rellena un .c8-deslizador tras cambiarlo por código
```

En «Automático», la transparencia se reduce si el sistema pide `prefers-reduced-transparency` **o** `prefers-contrast: more` (como macOS con «Aumentar contraste»). Con la transparencia reducida, el vidrio es opaco y **sin `backdrop-filter`**: un `blur(0)` seguía leyendo el fondo en cada fotograma y no aligeraba nada.

## Tokens

### Escala (fluida × talla)

El tamaño de letra de la raíz crece con la pantalla y respeta el tamaño de letra del navegador. Todo lo demás va en `rem`.

| Pantalla | Base (M) |
|---|---|
| Móvil | 14 px |
| 1280×800 | 15 px |
| 1920×1080 | 17 px |
| 2560×1440 | 20 px |
| 4K al 100 % | 24 px |

La talla multiplica la base: **S** 0,875, **M** 1, **L** 1,18. En pantallas táctiles los controles nunca bajan de 44 px (WCAG 2.5.5), sea cual sea la talla:
- `--alto-control` y `--alto-control-s` valen 44 px como mínimo.
- Cada opción del segmentado alcanza el relleno del control con un `::before` invisible, sin cambiar el dibujo.
- El deslizador mide 44 px de alto, con la misma pista y el mismo tirador.
- Única excepción: el botón «Ampliar» del radar se queda en 36 px para no tapar el radar, que también se toca para ir a una estancia.

### Color

| Token | Oscuro | Claro | Uso |
|---|---|---|---|
| `--c-fondo` | `#0a0b0d` | `#f5f5f7` | fondo de página |
| `--c-sup-1…3` | `#121418` → `#22262c` | `#fff` → `#e8e8ed` | superficies sólidas (Estudio) |
| `--c-texto` | `#f5f5f7` (18:1) | `#1d1d1f` (15:1) | texto |
| `--c-texto-2` | `#a9adb5` (8,7:1) | `#55555c` (6,8:1) | secundario |
| `--c-texto-3` | `#8b9099` (≥4,7:1) | `#636369` (≥4,6:1) | pies, marcadores de posición |
| `--c-acento` | `#cfad66` | `#c9a55a` | relleno de botones principales, estados activos |
| `--c-sobre-acento` | `#15110a` (8,8:1) | `#1a1408` (7,9:1) | texto **sobre** el acento |
| `--c-acento-texto` | acento con luminosidad OKLCH ≥ 0,8 | acento con luminosidad OKLCH ≤ 0,44 | texto **de color** acento (enlaces) y anillo de foco (`--c-foco`). Con cualquier color de marca cumple AA sobre el fondo y sobre el vidrio en el peor caso (`npm run contraste`) |
| `--c-foco` | acento | acento oscuro | anillo de foco (≥3:1) |
| `--c-ok` · `--c-aviso` · `--c-error` · `--c-info` | — | — | estados AA en ambos temas |
| `--c-whatsapp` | `#15803d` | `#15803d` | botón de WhatsApp (5:1 con texto blanco) |
| `--c-capa-hover` · `--c-capa-activa` | — | — | rellenos al pasar el ratón y al pulsar |
| `--c-pista` · `--c-segmento` | — | — | interruptores, deslizadores y segmentado |

> ⚠️ **Trampa de nombres:**
> - En el `visor.css` actual, `--acento-texto` significa «texto *sobre* el acento». En el sistema nuevo eso es `--c-sobre-acento`.
> - `--c-acento-texto` significa «texto *de color* acento».

### Vidrio

| Token | Oscuro | Claro | Uso |
|---|---|---|---|
| `--vidrio` | `rgba(22,24,28,.56)` | `rgba(255,255,255,.5)` | controles solo con icono (≥3:1 sobre el peor fondo) |
| `--vidrio-texto` | `rgba(20,22,26,.78)` | `rgba(255,255,255,.78)` | paneles con texto (AA sobre el peor fondo, también el texto secundario) |
| `--vidrio-denso` | `.9` | `.9` | menús y diálogos |
| `--vidrio-ambiente` | `rgba(20,22,26,.55)` | `rgba(255,255,255,.55)` | paneles sobre el ambiente conocido (Estudio, Guía): toman su color y el texto sigue ≥ 4,9:1 |
| `--vidrio-desenfoque` · `--vidrio-saturacion` | `22px` · `170%` | — | material |
| `--vidrio-reflejo-1/2` · `--vidrio-brillo` · `--vidrio-luz` | — | — | canto especular y luz del puntero |

Dentro de `.c8-vidrio`, `--c-texto-2` y `--c-texto-3` pasan a versiones más claras u oscuras (`--c-texto-2-vidrio`). Así se mantienen en AA sobre cualquier foto.

**Ambiente.** Donde no hay foto detrás (Estudio, Guía, pantallas de error), el fondo es `var(--ambiente), var(--c-fondo)`: luces suaves de acento e información, más presentes en claro. Es lo que hace que el vidrio se note sin desenfocar nada.

**Campos y casillas.** Borde `--c-borde-campo` (≥ 3:1 por dentro y por fuera, WCAG 1.4.11): `rgba(255,255,255,.42)` en oscuro y `rgba(0,0,0,.45)` en claro.

**Estado pulsado y opción elegida.** El botón pulsado se rellena de acento y, en claro, lleva además un aro de 1,5 px en `--c-acento-texto`; la opción elegida de un segmentado, un aro de 1 px. Así el estado no depende solo del matiz (1.4.11). En colores forzados (Windows), el pulsado usa `Highlight`.

**Botón de vidrio.** Un `.c8-boton` que además es `.c8-vidrio` (p. ej. «Ampliar» del radar) conserva el material: su `--b-fondo` es `--vidrio`.

### Tipografía, espaciado, radios y movimiento

- **Familias:**
  - `--fuente` y `--fuente-titular`: SF Pro en Apple, e Inter Variable autoalojada con tamaño óptico en el resto.
  - `--fuente-mono`.
- **Tamaños de texto:**

  | Token | Tamaño |
  |---|---|
  | `--t-micro` | 11 (nunca menos de 11 px) |
  | `--t-pie` | 12 (nunca menos de 11 px) |
  | `--t-sec` | 13 (nunca menos de 12 px) |
  | `--t-ui` | 14 |
  | `--t-cuerpo` | 16 |
  | `--t-destacado` | 18 |
  | `--t-titulo` | 22 |
  | `--t-titulo-g` | 28 |
  | `--t-display` | 36 (precio) |
  | `--t-heroe` | 48 |

  Los tres pequeños llevan suelo (`max(rem, px)`): en el teléfono la raíz baja a 14 px, y a 12,25 px con la talla S. Manda el rem si es mayor, así que la letra grande del navegador se respeta.

- **Pesos:**
  - `--peso-normal` 400
  - `--peso-medio` 510
  - `--peso-semi` 590
  - `--peso-fuerte` 680
- **Espaciado entre letras:**
  - Titulares: −0,022em.
  - Interfaz: −0,006em.
  - Mayúsculas: +0,08em.
- **Espaciado:** `--e-1…9` (0,25 → 3 rem).
- **Radios:** `--r-1…5` (6 → 28 px) y `--r-pastilla`. Regla concéntrica: radio interior = radio exterior − separación.
- **Sombras:** `--sombra-1` (controles), `--sombra-2` (paneles), `--sombra-3` (diálogos).
- **Movimiento:**
  - Muelles:
    - `--muelle`: amortiguación 0,78, 2 % de rebote, para paneles y pulgares.
    - `--muelle-rebote`: 0,6, 9,5 %, para iconos.
  - Curvas:
    - `--salida`: expo out.
    - `--entrada`.
    - `--suave`.
  - Duraciones: `--d-1…4` (120 → 620 ms).
  - Sin soporte de `linear()`, los muelles pasan a curvas cúbicas.
- **Capas:** `--z-hud` < `--z-panel` < `--z-menu` < `--z-dialogo` < `--z-aviso` < `--z-carga`.

## Estados (ok, aviso, error, info)

- Para chips y avisos tintados: `--c-<estado>-fondo` y, encima, `--c-<estado>-texto`. Cumplen AA en los dos temas sobre `--c-fondo` y `--c-sup-1` (`npm run contraste`).
- `--c-<estado>` a secas es para iconos y bordes.

## Texto sobre una foto

Para un nombre sobre una miniatura: `--c-sobre-foto` (blanco en los dos temas) sobre `--velo-foto` entero bajo el texto, nunca sobre la parte que se desvanece: así llega a 6,2:1 incluso sobre una foto blanca. En la tira de estancias del núcleo el nombre va abajo; en las fotos de la consulta, arriba, para no tapar la franja de marca que la captura lleva abajo. `pruebas/contraste.mjs` lo comprueba con `--velo-foto` sobre blanco.

## Vidrio adaptativo («liquid glass»)

La interfaz es de vidrio en claro y en oscuro: es el material base, lo pidió el cliente.

- Las alfas de `--vidrio`, `--vidrio-texto` y `--vidrio-denso` están calculadas para el peor fondo de la foto: una pared blanca en oscuro y una zona negra en claro.
- Si la página mide la foto que hay detrás, el vidrio se vuelve más transparente sin bajar nunca de AA. El visor lo hace con el fotograma y lo indica en `<html>`:
  - `data-luz-max`: luminancia de las zonas más claras (percentil 90). `baja` si es ≤ 0,10; `media` si es ≤ 0,35. Manda en el tema oscuro.
  - `data-luz-min`: luminancia de las zonas más oscuras (percentil 10). `alta` si es ≥ 0,45; `media` si es ≥ 0,18. Manda en el tema claro.
  - Sin atributos, se aplica el peor caso. «Reducir transparencia» siempre gana.

| Nivel | Oscuro: `--vidrio` / `--vidrio-texto` / `--vidrio-denso` | Claro: `--vidrio` / `--vidrio-texto` / `--vidrio-denso` |
|---|---|---|
| Peor caso (sin medir) | 0,56 / 0,78 / 0,9 | 0,5 / 0,78 / 0,9 |
| Media | 0,44 / 0,64 / 0,8 | 0,4 / 0,62 / 0,8 |
| Más transparente (`luz-max=baja` / `luz-min=alta`) | 0,32 / 0,42 / 0,62 | 0,3 / 0,44 / 0,62 |

`npm run contraste` comprueba cada nivel sobre el fondo límite de su intervalo.

## Componentes

| Clase | Variantes y modificadores | Estados | Accesibilidad |
|---|---|---|---|
| `.c8-vidrio` | `--texto`, `--denso`, `--barra` (cabecera o pie a todo el ancho: sin radio ni canto, que sin bordes laterales sobresaldría 1 px) | luz al pasar (solo ratón) | Usa `--texto` siempre que haya texto sobre la foto |
| `.c8-boton` | `--primario`, `--secundario`, `--fantasma`, `--peligro`, `--whatsapp`, `--icono`, `--s`, `--l` (acción principal de una pantalla), `--bloque` | `:hover`, `:active` (pulsación con muelle), `:disabled`, `aria-pressed`, `aria-busy` (indicador de carga), `:focus-visible` | Los botones de icono necesitan `aria-label` |
| `.c8-pastilla` | `--vertical` (móvil en vertical) | — | `role="toolbar"` + `aria-label` |
| `.c8-segmentado` | sobre vidrio con `.c8-vidrio` | pulgar deslizante con muelle | `role="radiogroup"` con radios reales |
| `.c8-interruptor` | — | `:checked`, `:active`, `:disabled` | `<input type="checkbox" role="switch">` |
| `.c8-deslizador` | — | pista rellena hasta el valor | `<input type="range">` + `aria-label` |
| `.c8-campo` / `.c8-entrada` | `.c8-ayuda`, `.c8-error` | `[aria-invalid="true"]`, foco | `aria-describedby` hacia el error |
| `.c8-lista` | `.c8-fila`, `.c8-fila-texto` | — | Filas de ajustes |
| `.c8-etiqueta` | `--acento`, sobre vidrio | — | Sellos («Recreación virtual · IA») |
| `.c8-aviso` | `data-tipo="ok\|error"` | entra con muelle, `.c8-saliendo` | `role="status"` en una zona `aria-live` |
| `.c8-dialogo` | junto a `.c8-vidrio--denso` | entra con muelle, velo desenfocado | `<dialog>` nativo + `aria-labelledby` |
| `.c8-cargando` | — | giro | `role="progressbar"` + `aria-label` |
| `.c8-icono` | `--dibujar` (se dibuja al aparecer; `pathLength="1"`) | — | `aria-hidden` si hay etiqueta |

### Iconos animados (patrón)

- **Sonido:** ondas quietas mientras suena (un latido corto al empezar y al pasar el ratón); tachado cuando está silenciado.
- **Nada infinito sobre el vidrio:** una animación que no acaba obliga a recomponer cada `backdrop-filter` 60 veces por segundo aunque nadie toque nada (batería y calor en el móvil). Solo los indicadores de carga giran sin fin, y mientras cargan.
- **Pantalla completa:** las esquinas se separan al pasar el ratón.
- **Apariencia (claro u oscuro de la interfaz):** un círculo que se llena ¼ en Claro, ½ en Automático y ¾ en Oscuro, con un muelle. **Nunca sol ni luna**, que se confundirían con la luz de la vivienda (día, atardecer, noche).
- **Contacto:** puntos de «escribiendo».
- **Radar:** barrido giratorio.
- **Confirmaciones:** ✓ que se dibuja con `--dibujar`.

### Hacer y evitar

| ✅ Hacer | ❌ Evitar |
|---|---|
| `.c8-vidrio--texto` en todo vidrio con texto sobre la foto | Texto gris sobre vidrio claro encima de una foto oscura |
| Relleno dentro de un panel de vidrio (`--c-capa-hover`) | Vidrio dentro de vidrio: solo desenfoca al padre |
| Pseudo-elemento `::after` en componentes que pueden ser vidrio | `::before`: el vidrio lo usa para el canto especular |
| `:where(.c8-vidrio)` da `position: relative` sin pisar `fixed` | `.c8-vidrio` en un elemento con hijos `fixed` (backdrop-filter pasa a ser su contenedor) |
| Icono + texto en las acciones principales | Icono solo sin `aria-label` |

## Migración desde los estilos actuales

La ruta más rápida es **apuntar las variables antiguas a los tokens nuevos** al principio de cada hoja existente. Así el modo claro funciona enseguida, y luego se sustituyen `px` → `rem` y los colores fijos → tokens poco a poco.

| Actual | Nuevo |
|---|---|
| `visor.css` `--fondo` / `--panel` / `--panel-solido` | `--c-fondo` / `--vidrio-texto` / `--c-sup-1` |
| `visor.css` `--borde` / `--texto` / `--texto-suave` | `--vidrio-borde` / `--c-texto` / `--c-texto-2` |
| `visor.css` `--acento` / **`--acento-texto`** | `--c-acento` / **`--c-sobre-acento`** |
| `visor.css` `--radio` / `--serif` | `--r-3` / `--fuente-titular` (la letra con remates se descartó: decisión C) |
| `paneles.css` `--pn-vidrio` / `--pn-vidrio-2` / `--pn-hover` | `--vidrio-texto` / `--c-capa-hover` / `--c-capa-hover` |
| `paneles.css` `--pn-campo` / `--pn-borde` / `--pn-texto` / `--pn-suave` | `--c-campo` / `--c-borde` / `--c-texto` / `--c-texto-2` |
| `paneles.css` `--pn-acento` / `--pn-acento-t` | `--c-acento` / `--c-sobre-acento` |
| `paneles.css` `--pn-ok` / `--pn-error` / `--pn-wa` / `--pn-velo` | `--c-ok` / `--c-error` / `--c-whatsapp` / `--velo` |
| `paneles.css` `--pn-t` / `--pn-curva` | `--d-2` / `--salida` (o `--muelle`) |
| `estudio.css` `--fondo` / `--sup1-3` / `--borde` / `--borde2` | `--c-fondo` / `--c-sup-1…3` / `--c-borde` / `--c-borde-2` |
| `estudio.css` `--suave` / `--tenue` / `--campo` | `--c-texto-2` / `--c-texto-3` / `--c-campo` |
| `estudio.css` `--acento` **#ffb547** / `--acento-osc` / `--acento-sua` | `--c-acento` (champán) / `--c-sobre-acento` / `--c-acento-suave` |
| `estudio.css` `--ok` / `--aviso` / `--error` / `--azul` | `--c-ok` / `--c-aviso` / `--c-error` / `--c-info` |
| `estudio.css` `--toque` / `--velo` / `--qr-fondo` / `--ce-*` | `--toque-minimo` / `--velo` / `--c-qr-fondo` / `--ce-*` |
| `asistente-osmo.html` `--vidrio` / `--vidrio-2` | `--vidrio-texto` / `--c-capa-hover` |

Pendiente para el rediseño (fase 4):

- **Color de marca:** `visor.js` fija `--c-acento` con `marca.color` y calcula `--c-sobre-acento` según su luminancia. `--c-acento-texto` y `--c-foco` salen de `--c-acento` con color relativo (`oklch(from …)`), acotando la luminosidad para que cualquier marca se lea; sin color relativo, con `color-mix()`.
- **Empaquetado:** el HTML autónomo (`build.mjs`) debe incrustar las fuentes de `vendor/fonts/` (cargador `dataurl` de esbuild para `.woff2`), y el ZIP web debe incluirlas.
- **Vidrio adaptativo (opcional):** muestrear el brillo medio de la vista (un lienzo pequeño cada ~500 ms) y ajustar el tinte del HUD, como hace Apple.
