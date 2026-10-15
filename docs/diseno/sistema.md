# cre8eight · Sistema de diseño «minimal liquid glass»

Base común del visor, el Estudio y el Asistente. Archivos fuente:

- `tools/visor-inmobiliario/tema.css`: tokens y componentes.
- `tools/visor-inmobiliario/tema.js`: apariencia, talla y accesibilidad.
- Muestra viva: `tools/visor-inmobiliario/tema-muestra.html`. Enseña cada componente en claro y oscuro, en las tres tallas y sobre tres tipos de foto: día, noche y contraluz.

## Principios

1. **La vivienda es la protagonista.** Los controles flotan sobre la imagen como piezas de vidrio y no tapan más de lo necesario.
2. **Legible sobre cualquier foto.** Cada pieza de vidrio mide lo que tiene detrás y toma la opacidad justa para que su texto cumpla AA; sin medida, la del peor caso (vidrio oscuro sobre pared blanca, vidrio claro sobre ventana de noche).
3. **Vidrio sin color.** El cristal es neutro, como el de iOS: deja ver la foto desenfocada, pero no toma su color. El color se reserva para la acción principal («Contactar», «Empezar visita») y para la marca.
4. **Un solo acento.** Champán `#cfad66` en oscuro y `#c9a55a` en claro. El color de marca del tour (`marca.color`) lo sustituye, y las variantes derivadas se calculan con `color-mix()`.
5. **Movimiento con inercia.** Muelles en vez de curvas lineales. Con «Reducir movimiento» todo es instantáneo.
6. **Todo en variables.** Ningún componente usa colores fijos y los tamaños van en `rem`.

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
- «Ampliar» del radar: 36 px con ratón y 44 px en táctil (ocupa el cuarto trasero derecho del radar, que también se toca para ir a una estancia).

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
| `--c-foco` | acento | acento oscuro | anillo de foco (≥3:1). Sobre la foto (título, «Ampliar», etiquetas, «i», lienzo) el anillo es doble: `--c-foco` y un borde de `--c-fondo`, para que se vea sobre cualquier imagen (técnica C40 de WCAG) |
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
| `--vidrio-tinte` | `20 22 26` (grafito, un punto frío) | `255 255 255` | color del cristal (rgb sin alfa) |
| `--vidrio-a-icono` · `--vidrio-a-texto` · `--vidrio-a-denso` | `.46` · `.56` · `.6` | `.45` · `.6` · `.62` | alfas del peor fondo (blanco o negro, ya esmerilado): las usa la pieza que no se ha medido |
| `--vidrio-a-suelo` · `--vidrio-a-suelo-icono` · `--vidrio-a-suelo-denso` | `.28` · `.22` · `.34` | `.3` · `.24` · `.36` | alfa mínima de una pieza medida: por debajo, el vidrio dejaría de leerse como vidrio |
| `--vidrio` · `--vidrio-texto` · `--vidrio-denso` | — | — | el tinte con la alfa de la pieza (`--vidrio-a`, la medida) o la del peor caso: controles solo con icono, paneles con texto, menús y diálogos |
| `--vidrio-ambiente` | `rgba(20,22,26,.4)` | `rgba(255,255,255,.42)` | paneles sobre el ambiente conocido (Estudio, Guía): el texto sigue ≥ 4,5:1 |
| `--vidrio-desenfoque` · `--vidrio-saturacion` · `--vidrio-contraste` | `24px` · `100%` · `.62` | — | esmerilado (`--vidrio-filtro`): desenfoca y baja el contraste de lo que hay detrás, como un cristal esmerilado de verdad |
| `--vidrio-aclarado` | `.8` (`--vidrio-aclarado-oscuro`) | `1.16` (`--vidrio-aclarado-claro`) | brillo de lo de detrás, siempre a favor del texto |
| `--c-acento-texto-vidrio` | acento con luminosidad OKLCH ≥ 0,9 | ≤ 0,34 | enlaces sobre el vidrio: dejan el vidrio transparente (sin color relativo, el color del texto) |
| `--vidrio-reflejo-1/2` · `--vidrio-brillo` · `--vidrio-luz` | — | — | canto especular a dos lados (`--vidrio-canto`), volumen del cristal (`--vidrio-volumen`) y luz del puntero |
| `--c-sobre-texto` | `#121418` | `#ffffff` | icono o texto sobre un relleno del color del texto (estado activo) |

Dentro de `.c8-vidrio`, `--c-texto-2` y `--c-texto-3` pasan a versiones más claras u oscuras (`--c-texto-2-vidrio`). Así se mantienen en AA sobre cualquier foto.

**Ambiente.** Donde no hay foto detrás (Estudio, Guía, pantallas de error), el fondo es `var(--ambiente), var(--c-fondo)`: luces suaves y neutras (`--ambiente-luz`, blanca), como un estudio fotográfico. Es lo que hace que el vidrio se note sin desenfocar nada. Sin color, como el vidrio; el acento queda para las acciones principales y la marca.

**Campos y casillas.** Borde `--c-borde-campo` (≥ 3:1 por dentro y por fuera, WCAG 1.4.11): `rgba(255,255,255,.42)` en oscuro y `rgba(0,0,0,.45)` en claro.

**Estado pulsado y opción elegida.** Sobre el vidrio, sin color:
- el botón pulsado de una pastilla (radar, música) es una cápsula de vidrio algo más clara (`--c-capa-activa`) y su símbolo pasa a la variante rellena, como los «.fill» de SF Symbols: las partes con `.relleno` se rellenan, y con `.relleno.c8-trazo` conservan además el trazo. El estado lo dice el símbolo, que contrasta con el vidrio como su texto (1.4.11);
- la opción elegida de un segmentado sobre la foto es una cápsula de vidrio más clara (`--c-segmento`) con un canto del color del texto al 72 % (≥ 3:1);
- el rótulo de una flecha señalada y el punto «i» al pasar, en negativo; el disco de la flecha se ilumina (más blanco).

**Marcas del suelo.** Como los puntos de Look Around (Apple Maps) o de Matterport, no como las flechas de un videojuego:
- un disco de cristal esmerilado apoyado en el suelo, más blanco hacia el canto, como una lente;
- un filo de luz más vivo delante y detrás que en los lados, y un segundo filo tenue (la cara de abajo) que le da grosor;
- un brillo especular en el canto del fondo y un chevrón fino como el de SF Symbols;
- una sombra de contacto suave.

Los filos, el chevrón y la sombra miden lo mismo en px CSS en cualquier pantalla y a cualquier distancia (`uPx`, sombreador con distancias con signo). Con «Reducir transparencia», disco blanco opaco con chevrón oscuro y contorno nítido.

Fuera del vidrio (Estudio, diálogos), el pulsado sigue siendo de acento con su aro. En colores forzados (Windows), el pulsado usa `Highlight`.

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

## Vidrio adaptativo por pieza («liquid glass» neutro)

La interfaz es de vidrio en claro y en oscuro: es el material base, lo pidió el cliente. Tras ver la primera versión pidió
que fuera «más realista, verdadero glass UI, sin color, como el propio iOS». De ahí salen las reglas del material:

- **Sin color.**
  - Saturación natural, del 100 %. iOS la sube; aquí, al 190 %, una foto cálida volvía el vidrio marrón.
  - Tinte neutro: grafito un punto frío en oscuro y blanco en claro.
  - Ningún relleno de acento sobre la foto, salvo la acción principal.
- **Esmerilado de verdad** (tras «las ventanas siguen muy blancas»).
  - Como un cristal esmerilado, el material desenfoca lo de detrás y además le baja el contraste (`contrast(.62)`). Luego lo aclara (×1,16, vidrio claro) u oscurece (×0,8, vidrio oscuro).
  - Detrás de un vidrio claro, lo más negro queda en gris medio. Así el tinte puede ser muy transparente (paneles y diálogos al 36–62 % en vez del 90 %) y se ve la vivienda a través, con el texto en AA.
  - Los textos secundario y terciario del vidrio están más cerca del principal, y los enlaces llevan su propio acento (`--c-acento-texto-vidrio`): ninguno obliga a hacer el vidrio más opaco.
  - `contrast()` y `brightness()` se aplican en sRGB (especificación de Filter Effects). `npm run contraste` comprueba que Chromium pinta lo mismo que el cálculo.
- **Realista.**
  - Desenfoque medio (24 px), que deja ver formas detrás.
  - Canto especular a dos lados (la luz entra arriba a la izquierda y se refleja abajo a la derecha).
  - Un filo de 1 px arriba y luz en el grosor del cristal junto a los bordes (`--vidrio-volumen`).
  - Sombra suave y amplia: flota.
- **Por pieza.**
  - El visor mide la vista en 32×18 píxeles: tras cada cambio, cada 0,7 s mientras se mueve y al pararse.
  - Para cada pieza (HUD, rótulos, tarjeta, diálogos) toma los percentiles 10 y 90 de la luminancia que tiene detrás.
  - `cre8Tema.vidrio` (tema.js) calcula la alfa mínima para que todo lo que se lee en ella cumpla AA, con un 10 % de holgura, entre su suelo y el peor caso. Calcula con el fondo ya esmerilado (`esmerilar`) y guarda la alfa en `--vidrio-a`.
  - Oscurecer es inmediato; aclarar, despacio y solo si compensa.
- **Aspecto oscuro en el tema claro (como iOS 26).**
  - Una pieza pequeña sobre una zona oscura de la foto pasa a vidrio oscuro con texto claro (`data-vidrio-aspecto="oscuro"`, con histéresis) si así es claramente más transparente.
  - Menús, diálogos y la tarjeta grande del escritorio siguen el tema.
- **Brillo de lo de detrás (`--vidrio-aclarado`).**
  - En claro, ×1,16: más luz bajo el texto oscuro. En oscuro y en el aspecto oscuro, ×0,8.
  - Entra en el cálculo, junto con el contraste.
- **Sin medida** (otra página, paseo libre, maqueta, sin WebGL, un fallo): el peor caso de `--vidrio-a-*`, que siempre cumple.
- **«Reducir transparencia»:** superficies opacas, sin `backdrop-filter`.

`npm run contraste` aplica la alfa calculada a piezas de muestra (texto principal, secundario, terciario, enlace de acento, iconos, pulsado, segmentado) sobre 21 fondos, en los dos temas, en el aspecto oscuro y con colores de marca extremos, y la mide con el lienzo sin la holgura.

**Refracción en los cantos (como iOS 26): descartada.** Solo Chrome admite un filtro SVG en `backdrop-filter`. Safari en el iPhone, el móvil de la mayoría de los compradores, no lo admite. Además costaría rendimiento en móviles modestos. El canto especular y la luz en el grosor dan la misma lectura en todos los navegadores.

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

### Dibujo de los iconos

Al estilo de SF Symbols, con dibujos propios:
- rejilla de 24×24 y trazo de `--trazo-icono` (1,6), con las puntas y las juntas redondas;
- esquinas redondeadas (radio 2–2,5) en todo rectángulo: tarjeta, documento, sobre, cámara, regla, copiar…;
- el bocadillo de los mensajes de iOS para «Contactar».

Nada de rectángulos con esquinas vivas ni de flechas de bloque: parecían de videojuego (petición del cliente, 15/10). La variante pulsada rellena las partes `.relleno`.

### Iconos animados (patrón)

- **Sonido:** ondas quietas mientras suena (dos latidos al empezar a sonar y al pasar el ratón); tachado cuando está silenciado.
- **Nada infinito sobre el vidrio:** una animación que no acaba obliga a recomponer cada `backdrop-filter` 60 veces por segundo aunque nadie toque nada (batería y calor en el móvil). Solo los indicadores de carga giran sin fin, y mientras cargan.
- **Pantalla completa:** las esquinas se separan al pasar el ratón.
- **Apariencia (claro u oscuro de la interfaz):** un círculo que se llena ¼ en Claro, ½ en Automático y ¾ en Oscuro, con un muelle. **Nunca sol ni luna**, que se confundirían con la luz de la vivienda (día, atardecer, noche).
- **Contacto:** puntos de «escribiendo».
- **Radar:** barrido giratorio.
- **Confirmaciones:** ✓ que se dibuja con `--dibujar`.

### Barra del sol (visor)

Petición del cliente (15/10): «una barra arriba, que no tape nada, con un punto que se mueva adelante y atrás del amanecer
al anochecer… el movimiento exacto del sol según las fotos de la Osmo 360… amanecer, día soleado, atardecer y noche».

- **Dónde:** bajo el título (`#lugar`), encima del radar: es contexto del lugar («dónde y cuándo»). No ocupa el centro de la
  foto ni la fila de la barra de vista; en reposo (`ui-inactiva`) se aparta como el título, y en el modo juego, la visita
  guiada y la medición desaparece.
- **Forma:** una cápsula de vidrio neutro (`.c8-vidrio--texto`) con «▶ Reproducir el día» y una pista: arriba los cuatro
  iconos (amanecer, día, atardecer y noche, al estilo de SF Symbols, con su variante rellena en el momento actual) y debajo
  un riel fino con lo recorrido más marcado y el punto, que es una cápsula blanca con la hora (el pomo de los deslizadores de
  iOS: blanco también en oscuro). Una muesca en el riel marca la hora de las fotos: la luz real.
- **Paradas a la misma distancia:** las cuatro paradas están equiespaciadas y entre ellas el tiempo es lineal; así el alba y
  el ocaso, donde más cambia la luz, ocupan más barra que el mediodía. La hora exacta va en el punto.
- **Gestos:** arrastrar el punto (imán suave de 5 px en las paradas y un toque háptico en Android al cambiar de momento);
  tocar un icono lleva a su parada como un pequeño timelapse (0,6–1,1 s, por reloj, no por fotogramas); «Reproducir el día»
  recorre la barra en 14 s. Con «Reducir movimiento», sin animaciones.
- **Accesibilidad:** toda la pista es un solo `role="slider"` («Luz del sol») de 44 px de alto en táctil, con
  `aria-valuetext` «19:12, Atardecer, sol a 5° sobre el horizonte, hacia el oeste» (y «luz real de la foto» a su hora);
  ← → 15 min (Mayús, una hora), RePág/AvPág la parada siguiente o anterior, Inicio/Fin los extremos. Las flechas no
  navegan ni RePág mueve la cámara mientras la barra tiene el foco.
- **Coherencia:** el sol y la luna solo se usan para la luz de la vivienda (por eso el icono de Apariencia no los usa), y
  las paradas de la barra son las mismas que «Luz» en «Estilo y luz».

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

Hecho en la fase 4 (estaba pendiente para el rediseño):

- **Superficies:** sin decimales en el plano, la maqueta, el título y la lista («30 m²»); las medidas de la herramienta de medir sí llevan dos.
- **Color de marca:** `visor.js` fija `--c-acento` con `marca.color`, acotado para el tema vigente (luminancia ≤ 0,55 en claro y ≥ 0,06 en oscuro: una marca blanca o negra no desaparece sobre el vidrio), y calcula `--c-sobre-acento` para ese relleno; se recalcula al cambiar de tema. El dossier, el plano y el vídeo exportados usan los mismos topes. El champán por defecto no cambia. `--c-acento-texto` y `--c-foco` salen de `--c-acento` con color relativo (`oklch(from …)`), acotando la luminosidad para que cualquier marca se lea; sin color relativo, con `color-mix()`.
- **Empaquetado:** el HTML autónomo (`build.mjs`) debe incrustar las fuentes de `vendor/fonts/` (cargador `dataurl` de esbuild para `.woff2`), y el ZIP web debe incluirlas.
- **Vidrio adaptativo:** por pieza, con la vista medida en 32×18 píxeles (ver «Vidrio adaptativo por pieza»).
