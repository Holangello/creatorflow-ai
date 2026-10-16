# cre8eight · Auditoría del cristal · A · Realismo del material

Fecha: 16/10/2026. Encargo: `docs/auditorias/cristal-encargos.md` § A. Método de la skill `design:design-critique` (primera impresión → usabilidad → jerarquía → consistencia → accesibilidad), aplicado al material.

**Qué se ha medido.** Capturas de `cristal/v2` (tintado) y `cristal/v3` (transparente) en escritorio 1440×900 a 1× y móvil 390×844, el Estudio, y cinco estados más capturados para esta auditoría (reposo largo, menú «Más», diálogo de ayuda, «Estancias y plano», hover sobre la pastilla y sobre «Contactar»), con un volcado de los valores reales de cada vidrio (`--vidrio-a`, `data-vidrio-aspecto`, fondo, borde, sombra, filtro) y un muestreo del aspecto cada 150 ms durante 4,5 s. Recortes ×3 (OpenCV, vecino más próximo, sin suavizar) de cada borde, canto, sombra y gota, montados junto al recorte equivalente de las tres referencias; perfiles de luminancia de 1 px a través de los bordes. Todo está en `<SCRATCH>/cristal/realismo/` (`01-…13-*.png`, `14-menu-ayuda.png`, `15-hover-contactar.png`, `estados/*`). `<SCRATCH>` = `/tmp/claude-0/-home-user-creatorflow-ai/9aa10f93-9bbe-52c5-91f2-e21dabbb4196/scratchpad`.

Referencias del cliente (`/root/.claude/uploads/9aa10f93-9bbe-52c5-91f2-e21dabbb4196/`): **R1** `6d22db80` (domótica, vidrio blanco esmerilado), **R2** `6b8003af` (app oscura, cantos finos y relieve), **R3** `debaa802` (barra transparente sobre plantas).

---

## 1 · Primera impresión: por qué no parece cristal

Visto a tamaño real, el visor no se lee como vidrio sino como **tarjetas de color crema (claro) o marrón (oscuro) pintadas encima de la foto**. Seis causas, todas medidas, por orden de impacto:

1. **El vidrio toma el color de la foto.** La tarjeta en claro mide `rgb(238,204,156)`, saturación 34 %; la foto que hay fuera de ella mide `rgb(238,204,153)`, 36 %. Es decir: **la tarjeta tiene el mismo color que la pared**. El vidrio blanco de R1 mide saturación 3–4 % (`rgb(135,134,131)` y `rgb(167,163,160)`); el oscuro de R2, 1 %. En oscuro la nuestra es `rgb(95,78,55)`, 43 % (marrón). Causa: `saturate(170%)` en el `backdrop-filter` (la documentación dice 100 %) más un tinte que se queda en el suelo (`--vidrio-a` = 0,30 en todas las piezas en claro) y no neutraliza nada.
2. **No hay canto.** El canto especular (`.c8-vidrio::before`, `inset: -1px`) **queda recortado por `overflow`** en la tarjeta, los diálogos, el menú, la tira de estancias y el radar: en el diálogo oscuro el borde superior mide 72→65→52 (ninguna luz); en el claro solo queda el `inset 0 1px 0` del volumen (+9). Donde sí se ve (título, barra del sol), es +12 de luminancia en 1 px; en R1 es +58 con un bisel de 3 px, en R2 +41 con un relieve oscuro de 2–3 px por dentro.
3. **Nada flota.** Bajo el pie de la tarjeta en claro la foto se oscurece 10–20 puntos y se recupera en 3 px; bajo la de R1 hay una sombra de contacto de −70 en 12 px y una ambiente más larga. En oscuro, ninguna sombra apreciable sobre la foto clara. Un menú abierto sobre la tarjeta (ambos crema) apenas se separa.
4. **El relleno es plano.** Tinte uniforme sin luz de arriba abajo ni grano. R1 y R2 tienen un degradado vertical suave (+6–8 % arriba) y un grano fino muy visible en R2 que da «materia».
5. **Un solo desenfoque (28 px) para piezas de 30 px y de 370 px.** En un rótulo de 30 px de alto, 28 px de desenfoque convierten lo de detrás en una mancha uniforme; en R3 (barra de 110 px) se ven las hojas como formas a través de ~8–10 px de desenfoque. En el panel grande de R1 el desenfoque sí es fuerte, pero la pieza mide 600 px.
6. **Las «gotas» llevan un aro oscuro.** La opción elegida del segmentado, el pomo y los pines son cápsulas casi blancas (245) con un anillo oscuro (143) de 1 px: parecen un botón de plástico con contorno. En R3 la pestaña elegida es un vidrio +40 más claro con un borde que se funde en 2–3 px y sin contorno oscuro.

Lo que **sí** funciona y hay que conservar: la decisión de medir la foto por pieza (`--vidrio-a`), la lectura AA garantizada, el canto a dos luces como idea (solo falta que se vea), el pomo blanco del sol, el verde iOS de los interruptores y el dorado reservado a una sola acción.

---

## 2 · Medidas (resumen)

| Medida | Nuestro visor | Referencias | Recorte |
|---|---|---|---|
| Saturación del vidrio vacío, claro | **34 %** (`rgb(238,204,156)`) | R1: 3–4 % | `01-esquinas-canto.png` |
| Saturación del vidrio vacío, oscuro | **43 %** (`rgb(95,78,55)`) | R2: 1 % (`rgb(44,44,44)`) | `01` |
| Saturación, transparente (claro y oscuro) | 40 % | R3: 33 % (sobre plantas verdes; la pieza va al tono del fondo, correcto) | `12` |
| `--vidrio-a` real en claro (todas las piezas) | **0,300 = el suelo** (`estados/claro-tinte-valores.json`) | — | — |
| `--vidrio-a` real en oscuro | 0,22 – 0,48 (tarjeta 0,447, modos 0,484, pastilla 0,22) | — | — |
| Canto superior (Δ luminancia, 1 px) | tarjeta claro +12 · diálogo oscuro **0** · título +13 | R1 **+58** + bisel 3 px · R2 +41 + relieve oscuro 2–3 px | `01`, `09`, `14` |
| Canto lateral | +13 (claro) · +17 (oscuro) | R2: +55 (claro fuera) y −25 (relieve dentro) · R3: +28 | `01` |
| Sombra bajo el pie | claro −20 en 1 px, −10 a 12 px · oscuro ≈ 0 | R1 −70 a 2–12 px (contacto) + −10 a 30 px (ambiente) | `02-sombras.png` |
| Aro de la gota elegida | anillo oscuro 143 sobre 245 | R3: sin anillo, transición de 3 px | `04-gotas-segmentado.png` |
| Hover «Contactar» | +12 de luminancia, sin halo | R2: anillo blanco + halo de 10–14 px | `15-hover-contactar.png` |
| Interruptor apagado | rosa salmón (`color-mix(off 22%)` + aro 30 %) sobre crema | R1: gris neutro, pomo con sombra | `07-interruptores.png` |
| Tarjeta del Estudio, claro | 221 sobre fondo 235: **más oscura que el fondo** | R1: siempre más clara que lo de detrás | `11-estudio.png` |

---

## 3 · Hallazgos

Formato: **ID · prioridad** (P1 se nota a simple vista, P2 al fijarse, P3 pulido) · recorte · lo que se ve · causa · corrección.

### 3.1 · Material base (afecta a todas las piezas)

**A1 · P1 · El vidrio coge el color de la foto** · `01-esquinas-canto.png`, `09-dialogo.png`
Lo que se ve: tarjeta, título, barra del sol y diálogos son del mismo crema que la pared en claro y de un marrón oliva en oscuro. No hay «vidrio blanco» ni «vidrio ahumado»: hay foto saturada con un velo.
Causa: `tema.css :root { --vidrio-saturacion: 170% }` (el comentario del sistema, `sistema.md § Vidrio adaptativo`, dice «saturación natural, del 100 %»; el token se quedó en 170), combinado con `contrast(0.62) brightness(1.16)` que aplana la foto hacia un crema uniforme y con unos suelos (`--vidrio-a-suelo: .3`) en los que caen **todas** las piezas en claro. Con un tinte al 30 % y una saturación ×1,7, lo que domina es la foto.
Corrección (tema.css):
```css
:root {
  --vidrio-desenfoque: 24px;
  --vidrio-saturacion: 108%;        /* era 170 %: el cristal no revive el color de la foto */
  --vidrio-contraste: 0.74;         /* era .62: lo de detrás se ve «a través», no lavado */
  --vidrio-aclarado-claro: 1.08;    /* era 1.16 */
  --vidrio-aclarado-oscuro: 0.72;   /* era .8: el ahumado oscurece más, como R2 */
}
:root, :root[data-tema="oscuro"] {
  --vidrio-tinte: 24 26 30;         /* grafito un punto más claro: en R2 el vidrio es gris, no negro */
  --vidrio-a-suelo: 0.40; --vidrio-a-suelo-icono: 0.32; --vidrio-a-suelo-denso: 0.48;
}
:root[data-tema="claro"] {
  --vidrio-tinte: 250 251 253;      /* blanco un punto frío: compensa las fotos cálidas sin verse azul */
  --vidrio-a-suelo: 0.44; --vidrio-a-suelo-icono: 0.36; --vidrio-a-suelo-denso: 0.52;
}
```
Subir los suelos no toca el cálculo AA (más alfa = más contraste); `tema.js › cre8Tema.vidrio` usa `contrast/aclarado` de estos tokens, así que la holgura se recalcula sola. El objetivo medible: saturación del vidrio vacío ≤ 12 % en claro y ≤ 10 % en oscuro (hoy 34/43).

**A2 · P1 · El canto especular está recortado en las piezas grandes** · `01`, `09-dialogo.png`, `14-menu-ayuda.png`
Lo que se ve: tarjeta, diálogos (ayuda, estancias, ajustes), menú «Más», tira de estancias y radar no tienen canto; el borde es `rgba(0,0,0,.08)`/`rgba(255,255,255,.12)`, invisible. Solo el título, el sol, los modos, la pastilla y los rótulos lo conservan (y débil).
Causa: `tema.css .c8-vidrio::before { inset: calc(-1 * var(--filo)); padding: 1px; mask … exclude }` dibuja el anillo **fuera de la caja de contenido**, y estas piezas recortan: `paneles.css .pn-tarjeta { overflow: hidden }`, `.pn-dialogo { overflow: hidden }`, `tema.css .c8-dialogo { overflow: auto }`, `visor.css #menu-mas { overflow-y: auto }`, `#galeria { overflow-x: auto }`, `#radar .disco { overflow: hidden }`, `#estancias-plano { overflow: hidden }`.
Corrección: pintar el canto **dentro de la caja del borde** con el truco de borde degradado (`background-clip`), que no depende de pseudoelementos ni de `overflow` y funciona con `backdrop-filter`:
```css
.c8-vidrio {
  border: var(--filo) solid transparent;
  background:
    var(--vidrio-grano) padding-box,                       /* grano (A5) */
    var(--vidrio-luz-vertical) padding-box,                /* luz de arriba abajo (A5) */
    linear-gradient(var(--vidrio-relleno), var(--vidrio-relleno)) padding-box,
    var(--vidrio-canto) border-box;                        /* el canto, en el borde */
  --vidrio-relleno: var(--vidrio);
}
.c8-vidrio.c8-vidrio--texto { --vidrio-relleno: var(--vidrio-texto); }
.c8-vidrio.c8-vidrio--denso { --vidrio-relleno: var(--vidrio-denso); }
.c8-vidrio::before { display: none; }   /* o dejarlo solo para la luz del puntero en las piezas sin overflow */
```
Y las reglas que hoy pisan `background` en un vidrio pasan a fijar `--vidrio-relleno`: `tema.css .c8-segmentado.c8-vidrio { background: var(--vidrio-texto) }` → `--vidrio-relleno: var(--vidrio-texto)`; `visor.css #radar .disco.c8-vidrio[data-sin-rotulos] { background: var(--vidrio) }` → `--vidrio-relleno`; `.etq.c8-vidrio:hover / .info.c8-vidrio:hover { background: var(--c-texto) }` → `--vidrio-relleno: var(--c-texto)`; `tema.css .c8-boton.c8-vidrio { --b-fondo: var(--vidrio) }` y `.c8-boton { background: var(--b-fondo) }` → en `.c8-boton.c8-vidrio`, `--vidrio-relleno: var(--b-fondo)`; `paneles.css :where(.pn-tarjeta, .pn-dialogo…) { background: var(--vidrio-denso …) }` (respaldo) queda por debajo de `.c8-vidrio` y no molesta. El plan de contingencia `@supports not (mask-composite…)` ya no hace falta.

**A3 · P1 · El canto es demasiado débil, solo en dos esquinas y sin relieve interior** · `01`, `03`, `14`
Lo que se ve: donde el canto existe, mide +12/+13 de luminancia y desaparece en los lados derecho-arriba e izquierdo-abajo (`transparent 32%–62%` del degradado a 135°). En R1 los cuatro lados tienen un filo claro (+58 arriba, +15 en los lados) y un bisel de 3 px; en R2 hay un filo claro de 1 px por fuera y una sombra interior de 2–3 px (−25) que da **grosor**.
Causa: `tema.css --vidrio-canto: linear-gradient(135deg, reflejo-1 0%, transparent 32%, transparent 62%, reflejo-2 100%)`, `--vidrio-reflejo-1: rgba(255,255,255,.55)` (oscuro) / `.95` (claro) sobre un fondo que ya es casi blanco, y `--vidrio-volumen: inset 0 1px 0 brillo, inset 0 0 1rem brillo` con `--vidrio-brillo: .06` en oscuro (invisible).
Corrección:
```css
:root, :root[data-tema="oscuro"] {
  --vidrio-reflejo-1: rgba(255, 255, 255, 0.62);  /* arriba */
  --vidrio-reflejo-2: rgba(255, 255, 255, 0.28);  /* abajo: luz reflejada */
  --vidrio-reflejo-lado: rgba(255, 255, 255, 0.18);
  --vidrio-relieve: rgba(0, 0, 0, 0.28);          /* sombra interior bajo el filo (R2) */
  --vidrio-brillo: rgba(255, 255, 255, 0.10);
}
:root[data-tema="claro"] {
  --vidrio-reflejo-1: rgba(255, 255, 255, 1);
  --vidrio-reflejo-2: rgba(255, 255, 255, 0.7);
  --vidrio-reflejo-lado: rgba(255, 255, 255, 0.55);
  --vidrio-relieve: rgba(20, 24, 32, 0.07);       /* en el vidrio blanco el relieve es un gris muy leve */
  --vidrio-brillo: rgba(255, 255, 255, 0.45);
}
:root {
  /* los cuatro lados, la luz entra arriba y rebota abajo; las esquinas superiores, más vivas */
  --vidrio-canto:
    radial-gradient(60% 40% at 50% 0%, var(--vidrio-reflejo-1), transparent 100%),
    linear-gradient(180deg, var(--vidrio-reflejo-1) 0%, var(--vidrio-reflejo-lado) 28%, var(--vidrio-reflejo-lado) 70%, var(--vidrio-reflejo-2) 100%);
  /* grosor: filo de 1 px claro por dentro, sombra de 2 px bajo él y un brillo suave en todo el canto */
  --vidrio-volumen:
    inset 0 1px 0 var(--vidrio-reflejo-1),
    inset 0 -1px 0 var(--vidrio-reflejo-2),
    inset 0 2px 3px -1px var(--vidrio-relieve),
    inset 0 0 0 1px var(--vidrio-brillo),
    inset 0 0 1.25rem var(--vidrio-brillo);
}
```
Objetivo medible: Δ del borde superior ≥ +40 (oscuro) / ≥ +25 sobre el relleno (claro), lados ≥ +15, y un escalón de −10 a −20 en los 2 px interiores en oscuro.

**A4 · P1 · Las sombras no hacen flotar nada** · `02-sombras.png`, `14-menu-ayuda.png`
Lo que se ve: bajo la tarjeta en claro la foto se oscurece 10–20 puntos; en oscuro, nada (sombra `rgba(0,0,0,.26)` difuminada 48 px sobre una foto de luminancia 200 apenas resta). El menú «Más» abierto sobre la tarjeta no se separa de ella. R1 tiene una **sombra de contacto** corta y densa (−70 en 12 px) y una ambiente amplia; R2, un escalón claro al pie (la cara inferior del vidrio).
Causa: `tema.css --sombra-1/2/3`: dos capas con la de contacto casi nula (`0 1px 2px .05` en claro, `.14` en oscuro) y la ambiente muy difusa.
Corrección (tres capas: contacto, cercana, ambiente; `-spread` negativo para que no engorde la pieza):
```css
:root, :root[data-tema="oscuro"] {
  --sombra-1: 0 1px 1px rgba(0,0,0,.30), 0 4px 10px -2px rgba(0,0,0,.34), 0 16px 36px -8px rgba(0,0,0,.42);
  --sombra-2: 0 1px 2px rgba(0,0,0,.34), 0 8px 18px -4px rgba(0,0,0,.40), 0 28px 60px -12px rgba(0,0,0,.50);
  --sombra-3: 0 2px 3px rgba(0,0,0,.36), 0 14px 28px -6px rgba(0,0,0,.44), 0 44px 90px -16px rgba(0,0,0,.56);
}
:root[data-tema="claro"] {
  --sombra-1: 0 1px 1px rgba(15,20,30,.10), 0 4px 10px -2px rgba(15,20,30,.12), 0 16px 36px -8px rgba(15,20,30,.14);
  --sombra-2: 0 1px 2px rgba(15,20,30,.12), 0 8px 18px -4px rgba(15,20,30,.14), 0 28px 60px -12px rgba(15,20,30,.18);
  --sombra-3: 0 2px 3px rgba(15,20,30,.14), 0 14px 28px -6px rgba(15,20,30,.18), 0 44px 90px -16px rgba(15,20,30,.24);
}
```
Objetivo: bajo el pie de un panel, −35 a −50 en los primeros 4 px en claro y ≥ −40 en oscuro sobre una foto clara.

**A5 · P2 · Relleno plano: sin luz de arriba abajo ni grano** · `09-dialogo.png`, `03-boton-principal.png`
Lo que se ve: el diálogo de ayuda (690×680 px) es una superficie de un solo tono; R1 tiene una luz suave arriba, R2 un grano fino en todo el vidrio que lo hace «materia» y no «capa».
Causa: `.c8-vidrio { background: var(--vidrio) }` (color plano). `::after` está reservado a los componentes (`sistema.md § Hacer y evitar`), así que el grano no puede ir en un pseudoelemento: va como **capa de `background-image`** (ver A2).
Corrección:
```css
:root {
  --vidrio-luz-vertical: linear-gradient(180deg, rgba(255,255,255,.14) 0%, rgba(255,255,255,.04) 38%, rgba(255,255,255,0) 60%, rgba(0,0,0,.035) 100%);
  /* grano: ruido fractal gris, 160 px en mosaico, alfa 6 % (oscuro 8 %); mezcla overlay no hace falta: a esta alfa suma «textura», no color */
  --vidrio-grano: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/><feComponentTransfer><feFuncA type='linear' slope='0.06'/></feComponentTransfer></filter><rect width='100%' height='100%' filter='url(%23g)'/></svg>") 0 0 / 160px 160px;
}
:root[data-tema="claro"] { --vidrio-luz-vertical: linear-gradient(180deg, rgba(255,255,255,.55) 0%, rgba(255,255,255,.18) 40%, rgba(255,255,255,0) 62%, rgba(20,24,32,.03) 100%); }
:root[data-tema="oscuro"] { --vidrio-grano: url("…slope='0.08'…") 0 0 / 160px 160px; }
:root[data-transparencia="reducida"] .c8-vidrio { --vidrio-grano: none; }
```
El grano pesa 0 (un SVG de 400 bytes en caché); si en un móvil modesto se nota al desplazar un diálogo largo, limitar `--vidrio-grano` a `.c8-vidrio--denso` y `.pn-tarjeta`.

**A6 · P2 · Un solo desenfoque para todos los tamaños: las piezas pequeñas son una mancha** · `10-tira-rotulos-suelo.png` («Dormitorio», «i»), `06-pastilla-radar.png`
Lo que se ve: en un rótulo de 30 px de alto, 28 px de desenfoque y `contrast(.62)` dejan detrás un color uniforme: el rótulo parece una pegatina. R3 (barra de 110 px) deja ver las hojas; el panel de R1 (600 px) se permite un desenfoque mayor.
Causa: `--vidrio-desenfoque: 28px` único, en `--vidrio-filtro`.
Corrección (tres tallas de material, por clase; sin cambiar el HTML se aplican por selector):
```css
:root { --vidrio-desenfoque-s: 10px; --vidrio-desenfoque-m: 18px; --vidrio-desenfoque-l: 28px; --vidrio-desenfoque: var(--vidrio-desenfoque-l); }
:root[data-cristal="transparente"] { --vidrio-desenfoque-s: 6px; --vidrio-desenfoque-m: 10px; --vidrio-desenfoque-l: 16px; }
/* visor.css */
.etq, .info, #precio-juego, #sello-ia, .c8-etiqueta.c8-vidrio, #btn-ampliar { --vidrio-desenfoque: var(--vidrio-desenfoque-s); }
#lugar, #sol, #modos, #barra-vista, #guion-barra, #galeria, #rotulo, #subtitulo, #radar .disco { --vidrio-desenfoque: var(--vidrio-desenfoque-m); }
/* paneles y diálogos siguen con -l */
```
(`--vidrio-filtro` se define en `:root, .c8-vidrio`, así que la variable por pieza entra sola.)

**A7 · P2 · Lo de detrás se ve «lavado», no «a través de un vidrio grueso»** · `09-dialogo.png` (`claro · dialogo lado izq`)
Lo que se ve: junto al borde del diálogo la foto pasa de contraste normal a un crema sin sombras: el efecto es el de una capa semiopaca, no el de un cristal (en R1 el salón sigue teniendo sus oscuros, más suaves).
Causa: `contrast(0.62)` + `brightness(1.16)`. Ya corregido en A1 (`.74` / `1.08`); se lista aparte porque hay que repasar `pruebas/contraste.mjs` con los nuevos valores (la alfa medida subirá un poco en las piezas sobre fotos oscuras: aceptable, el suelo nuevo ya es mayor).

### 3.2 · Pieza por pieza

**B1 · P1 · La tira de estancias es la única pieza oscura en el tema claro** · `estados/claro-tinte-0-reposo-largo.png`, `10-tira-rotulos-suelo.png`
Lo que se ve: en claro tintado, título, sol, radar, modos, pastilla y tarjeta son crema y la tira del pie es marrón oscuro: dos materiales en la misma pantalla. El volcado lo confirma: `#galeria` → `data-vidrio-aspecto="oscuro"`, `--vidrio-a: 0.300`, fondo `rgba(20,22,26,.3)`; el resto, blanco.
Causa: `visor.js › aplicarAlfas()`: `cambia = alfaOtro + 0.06 < alfa || (… z.p90 < 0.16 …)`; la tira está sobre el suelo oscuro y el umbral de 0,06 la cambia aunque sea la pieza más grande del HUD y la única que cambia. El criterio «piezas vecinas sobre la misma zona» no existe: la tira no tiene vecinas.
Corrección (visor.js): excluir de la inversión las piezas anchas y las que no tienen vecinas en su zona, y subir el umbral:
```js
const grande = z.el.matches(".pn-disp-lateral .pn-tarjeta, #galeria, #rotulo, #subtitulo") || z.el.getBoundingClientRect().width > 320;
if (claro && !denso && !grande) {
  …
  const cambia = alfaOtro + 0.16 < alfa || (oscura ? z.p90 > 0.24 && alfaOtro <= alfa + 0.02 : z.p90 < 0.10 && alfaOtro <= alfa + 0.001);
```
Y documentarlo en `sistema.md § Vidrio adaptativo › Aspecto oscuro`: «solo piezas pequeñas (≤ 320 px) y nunca la tira ni los rótulos».

**B2 · P2 · El cambio de aspecto llega tarde y se ve como un fantasma desenfocado** · `cristal/v2/escritorio-claro-tinte-1-recorrido.png` (tira borrosa), `cristal/v3/escritorio-oscuro-transparente-1-recorrido.png` (título ilegible), `estados/*-oscilacion.json`
Lo que se ve: en dos de las capturas originales hay piezas con el contenido desenfocado (miniaturas y nombres de la tira; el título entero en oscuro transparente). El muestreo lo explica: el aspecto de la tira cambia a los 450 ms de llegar; `.etq/.info` cambian de alfa a 1200 y 1350 ms; en oscuro transparente, el título, el sol, el radar, los modos y la pastilla cambian a «claro» **a los 3,75 s**, y cada cambio anima `filter: blur(3px)→0` (280 ms). Un visitante que mira la tarjeta en ese momento ve el texto emborronarse.
Causa: `visor.js › cambiarAspecto()`: `el.animate([{ filter: "blur(3px)" }, { filter: "blur(0px)" }], 280)`, y la medida se hace en varias vueltas («se calcula al terminar», reintento a 260 ms) sin una decisión única al llegar a una estancia.
Corrección: (1) quitar el `blur` del fundido y cruzar solo color y fondo (`transition: background-color var(--d-3), color var(--d-3), border-color var(--d-3)` en `.c8-vidrio`; la animación JS pasa a `[{ opacity: .85 }, { opacity: 1 }]` o se elimina); (2) decidir el aspecto de todas las piezas en la **misma** vuelta al llegar (`ir()`), con la medida del fotograma final, y a partir de ahí solo con histéresis y no antes de 1,5 s desde la última decisión.

**B3 · P1 · Las gotas (elegido, pomo, pines) llevan contorno oscuro y son casi opacas** · `04-gotas-segmentado.png`, `05-pomo-pines.png`, `08-segmentado-dialogo.png`
Lo que se ve: «Recorrido» elegido en claro es una cápsula de 245 con un anillo de 143; en móvil, blanco puro; el pomo «11:30» y los pines igual. Parecen botones de plástico. En R3 la pestaña elegida es +40 más clara que su carril y el borde se funde en 3 px; en R1, «Living Room» es una cápsula blanca con una sombra corta y **sin** contorno; en R2, «Image» es un gris más claro con un filo claro arriba.
Causa: `tema.css .c8-segmentado.c8-vidrio::after { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c-texto) 72%, transparent) … }` y `.c8-segmentado::after { inset 0 0 0 1px color-mix(… 55%) }` (el aro 1.4.11); `--vidrio-gota: linear-gradient(180deg, gota-brillo, transparent 78%), rgb(tinte / 0.64)` (64 % de tinte: casi opaco); `--vidrio-gota-sombra: … 0 0 0 0.5px var(--vidrio-borde), 0 4px 14px rgba(0,0,0,.18)` (el `0.5px` oscuro, en claro, es el contorno).
Corrección: la gota es vidrio más claro con filo de luz y una sombra corta; el estado lo dan el escalón de luminancia (≥ +40), el peso de la letra y una sombra de contacto, y el aro queda muy tenue (si `pruebas/contraste.mjs` exige 3:1 para 1.4.11, subir `--vidrio-gota-aro` a 0,4, nunca a 0,72):
```css
:root, :root[data-tema="oscuro"] {
  --vidrio-gota-brillo: rgba(255,255,255,.26);
  --vidrio-gota-aro: color-mix(in srgb, var(--c-texto) 22%, transparent);
  --vidrio-gota: linear-gradient(180deg, var(--vidrio-gota-brillo), rgba(255,255,255,.06) 55%, rgba(255,255,255,0) 100%), rgba(255,255,255,.16);
  --vidrio-gota-sombra: inset 0 1px 0 rgba(255,255,255,.55), inset 0 -1px 0 rgba(255,255,255,.14), inset 0 0 0 1px var(--vidrio-gota-aro), 0 1px 2px rgba(0,0,0,.28), 0 6px 14px -4px rgba(0,0,0,.35);
}
:root[data-tema="claro"] {
  --vidrio-gota-brillo: rgba(255,255,255,.9);
  --vidrio-gota-aro: color-mix(in srgb, var(--c-texto) 14%, transparent);
  --vidrio-gota: linear-gradient(180deg, var(--vidrio-gota-brillo), rgba(255,255,255,.35) 60%, rgba(255,255,255,.2) 100%), rgba(255,255,255,.42);
  --vidrio-gota-sombra: inset 0 1px 0 #fff, inset 0 -1px 0 rgba(255,255,255,.6), inset 0 0 0 1px var(--vidrio-gota-aro), 0 1px 2px rgba(15,20,30,.14), 0 6px 14px -4px rgba(15,20,30,.18);
}
.c8-segmentado::after, .c8-segmentado.c8-vidrio::after { background: var(--vidrio-gota); box-shadow: var(--vidrio-gota-sombra); }
```
El pomo del sol (`visor.css #sol .pomo`) y los pines (`.maq-pin`) ya usan `--vidrio-gota`/`--vidrio-gota-sombra`: heredan la corrección.

**B4 · P2 · Pomo, pines y botón principal llevan su propio desenfoque con saturación ×1,6: los pines se vuelven verdes sobre el césped** · `05-pomo-pines.png`
Lo que se ve: «Terraza · 204 m²» sobre el jardín es una cápsula verde pálido; en oscuro, oliva. No es el mismo material que el resto.
Causa: `visor.css .maq-pin { backdrop-filter: blur(16px) saturate(1.6) }`, `#sol .pomo { blur(16px) saturate(1.6) }`, `tema.css .c8-boton--primario { blur(18px) saturate(1.6) }`, `.c8-boton--whatsapp` igual.
Corrección: un único filtro de gota, derivado del material:
```css
:root { --vidrio-filtro-gota: blur(var(--vidrio-desenfoque-s)) saturate(var(--vidrio-saturacion)) contrast(0.9); }
.maq-pin, #sol .pomo, .c8-boton--primario, .c8-boton--whatsapp { -webkit-backdrop-filter: var(--vidrio-filtro-gota); backdrop-filter: var(--vidrio-filtro-gota); }
```

**B5 · P1 · El botón principal no es cristal dorado: es un degradado plano sin halo** · `03-boton-principal.png`, `15-hover-contactar.png`
Lo que se ve: «Contactar» es un rectángulo dorado mate con un filo claro arriba; el hover suma +12 de luminancia y nada más. En R2 el botón principal tiene un anillo blanco de 1 px, un halo de 10–14 px y un degradado radial (más claro en el centro-arriba); el de «enviar», lo mismo en pequeño. Es la única acción con color: debería ser la pieza más «de cristal» de la pantalla.
Causa: `tema.css .c8-boton--primario { --b-fondo: linear-gradient(180deg, rgba(255,255,255,.3), transparent 62%), color-mix(acento 72%, transparent); box-shadow: inset 0 1px 0 rgba(255,255,255,.5), inset 0 -1px 0 rgba(0,0,0,.08), 0 6px 18px color-mix(acento 32%, transparent) }`: el «halo» es una sombra de color desplazada 6 px (sobre una foto ámbar no se ve) y no hay anillo.
Corrección:
```css
.c8-boton--primario {
  --b-fondo:
    radial-gradient(120% 90% at 50% -20%, rgba(255,255,255,.55), rgba(255,255,255,0) 60%),
    linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,0) 50%, rgba(0,0,0,.10) 100%),
    color-mix(in srgb, var(--c-acento) 68%, transparent);
  --b-borde: color-mix(in srgb, var(--c-acento) 40%, rgba(255,255,255,.75));
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.85),                                  /* filo de luz */
    inset 0 -1px 0 rgba(0,0,0,.12),                                       /* cara inferior */
    inset 0 0 0 1px rgba(255,255,255,.22),                                /* grosor */
    0 0 0 1px color-mix(in srgb, var(--c-acento) 45%, transparent),       /* anillo (R2) */
    0 0 18px 2px color-mix(in srgb, var(--c-acento) 38%, transparent),    /* halo */
    0 8px 20px -6px rgba(0,0,0,.35);                                      /* sombra */
  transition: box-shadow var(--d-2) var(--suave), filter var(--d-1) var(--suave), transform var(--d-3) var(--muelle);
}
@media (hover: hover) and (pointer: fine) {
  .c8-boton--primario:hover {
    filter: brightness(1.06) saturate(1.05);
    box-shadow: inset 0 1px 0 #fff, inset 0 -1px 0 rgba(0,0,0,.12), inset 0 0 0 1px rgba(255,255,255,.3),
      0 0 0 1px color-mix(in srgb, var(--c-acento) 60%, transparent), 0 0 26px 4px color-mix(in srgb, var(--c-acento) 48%, transparent), 0 10px 24px -6px rgba(0,0,0,.4);
  }
}
.c8-boton--primario:active { filter: brightness(.97); }
```
En oscuro el halo es más visible (fondo marrón); en claro sobre crema, lo que lo separa es el anillo y la sombra de contacto. El `--sombra-texto` no entra en el botón (bien).

**B6 · P2 · Interruptor apagado rosa; pista sin profundidad; pomo sin sombra** · `07-interruptores.png`
Lo que se ve: apagado = cápsula salmón con aro rojo (R1: gris neutro); el «muy sutil» del cliente no se cumple sobre un vidrio crema (el rojo al 22 % sobre crema da rosa). El pomo blanco se funde con el carril claro (sombra `0 2px 6px .25` apenas se ve a 1×). Encendido correcto, pero la pista es plana: R1 tiene una sombra interior arriba.
Causa: `tema.css .c8-interruptor { background: color-mix(in srgb, var(--c-off) 22%, var(--c-pista)); box-shadow: inset 0 0 0 1px color-mix(off 30%, var(--c-borde)), inset 0 1px 1px rgba(0,0,0,.08) }`.
Corrección:
```css
.c8-interruptor {
  background: color-mix(in srgb, var(--c-off) 9%, var(--c-pista));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c-off) 16%, var(--c-borde)), inset 0 1px 2px rgba(0,0,0,.22), inset 0 -1px 0 rgba(255,255,255,.12);
}
.c8-interruptor:checked { background: color-mix(in srgb, var(--c-on) 84%, var(--c-pista)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c-on) 55%, transparent), inset 0 1px 2px rgba(0,0,0,.22), inset 0 -1px 0 rgba(255,255,255,.18); }
.c8-interruptor::after {
  background: linear-gradient(180deg, #fff, #f1f2f4);
  box-shadow: 0 1px 1px rgba(0,0,0,.22), 0 3px 6px rgba(0,0,0,.28), 0 0 0 .5px rgba(0,0,0,.10), inset 0 -1px 0 rgba(0,0,0,.08);
}
```
(El Estudio tiene el mismo interruptor sobre blanco: el rosa se ve aún más; la corrección es común.)

**B7 · P2 · Pastilla: el pulsado no se lee como gota y el aro verde está pegado al borde** · `06-pastilla-radar.png`, `13-movil.png`
Lo que se ve: radar y sonido encendidos son un anillo verde de 1 px dentro de una cápsula que, en claro, es **más oscura** (`--c-capa-activa: rgba(0,0,0,.09)`): justo lo contrario de una gota. En R1 los anillos verdes miden ~2 px, con aire entre el anillo y el icono, sobre un disco blanco.
Causa: `tema.css .c8-pastilla .c8-boton[aria-pressed="true"] { --b-fondo: var(--c-capa-activa); box-shadow: inset 0 0 0 1px color-mix(on 62%, transparent) }`.
Corrección:
```css
.c8-pastilla .c8-boton[aria-pressed="true"] {
  --b-fondo: var(--vidrio-gota);
  box-shadow: var(--vidrio-gota-sombra), inset 0 0 0 1.5px color-mix(in srgb, var(--c-on) 72%, transparent);
}
```
(`--vidrio-gota` es un `background` con degradado: `.c8-boton { background: var(--b-fondo) }` lo admite.)

**B8 · P2 · Radar: un disco plano en tintado y una mancha en transparente** · `06-pastilla-radar.png`
Lo que se ve: en claro tintado el radar es un disco crema con trazos negros, sin borde ni lente; en oscuro transparente es un círculo desenfocado sin canto (`a: 0.302`, velo 0,28 blanco, borde 0,28): «una mancha más clara». La lupa de R3 tiene un filo claro nítido y refracción en el borde.
Causa: A2 (el canto del `.disco` queda recortado por `overflow: hidden`) + A6 (desenfoque 28 px en 142 px) + `--vidrio-borde` débil.
Corrección: además de A2/A6, un anillo de lente propio (en el `.disco`, no en `#radar`, para que gire con la máscara circular):
```css
#radar .disco.c8-vidrio {
  box-shadow: var(--vidrio-volumen), inset 0 0 0 1.5px rgba(255,255,255,.55), inset 0 0 14px rgba(255,255,255,.22), var(--sombra-2);
}
:root[data-tema="claro"] #radar .disco.c8-vidrio { box-shadow: var(--vidrio-volumen), inset 0 0 0 1.5px rgba(255,255,255,.95), inset 0 0 16px rgba(255,255,255,.5), var(--sombra-2); }
```

**B9 · P2 · Rótulos («Dormitorio», «i»): pegatinas sin contacto** · `10-tira-rotulos-suelo.png`
Lo que se ve: el rótulo es una cápsula crema opaca-mate sin sombra de contacto; el punto «i» tiene un halo de 5 px blanco al 24 % que lo convierte en un botón con borde grueso.
Causa: A1, A4, A6 y `visor.css .info.c8-vidrio { box-shadow: …, 0 0 0 0.3125rem rgba(255,255,255,.24), … }`.
Corrección: con A1–A6 el rótulo ya es vidrio; para el «i», sustituir el halo sólido por una luz difusa: `0 0 0 0.3125rem rgba(255,255,255,.24)` → `0 0 0 3px rgba(255,255,255,.12), 0 0 14px 4px rgba(255,255,255,.28)`.

**B10 · P2 · Diálogos y menú: superficie grande sin canto, borde invisible, mismo tono que la tarjeta** · `09-dialogo.png`, `14-menu-ayuda.png`, `estados/*-3-ayuda.png`
Lo que se ve: el diálogo de ayuda (claro) es crema uniforme; el menú «Más» se abre sobre la tarjeta del mismo crema y se distingue solo por el texto. En oscuro, el diálogo es gris-marrón plano. Es el peor caso del «plano» porque son las piezas más grandes.
Causa: A2 (canto recortado), A4 (sombra), A5 (relleno), `--vidrio-a-denso: .6/.62` con `saturate(1.7)`.
Corrección: A1–A5 lo resuelven; añadir para lo denso una luz superior algo más marcada y una sombra 3 en el menú (hoy `--sombra-3` solo en `--denso`, correcto, pero el menú está en `#menu-mas` que es `--denso`: bien). Comprobar tras A2 que `.c8-dialogo` (`overflow: auto`) muestra el canto a lo largo de todo el borde también con barra de desplazamiento: con `background-clip: border-box` sí.

**B11 · P3 · Disco del suelo (WebGL): un plato gris mate, no una lente** · `10-tira-rotulos-suelo.png`
Lo que se ve: elipse gris uniforme con un filo blanco fino y un chevrón; no deja ver el suelo ni tiene sombra de contacto. Es un sombreador (`sistema.md § Marcas del suelo`), no CSS. Sugerencia para quien lo toque: alfa del centro 0,22 (hoy ≈ 0,45), filo frontal 1,5 px al 0,9, filo trasero 0,5, sombra de contacto de 6 px al 0,25 bajo el borde cercano y un brillo radial en el tercio superior. Mismo lenguaje que el radar (B8).

**B12 · P2 · Estudio en claro: las tarjetas son más oscuras que el fondo** · `11-estudio.png`
Lo que se ve: tarjeta `rgb(221,221,222)` sobre fondo `rgb(235,235,236)`: un vidrio blanco que oscurece lo que tiene detrás no es vidrio, es cartulina gris. En oscuro sí es más claro (52 sobre 12), correcto.
Causa: `--vidrio-filtro` aplica `contrast(0.62)` también sobre el ambiente (casi blanco): el contraste tira hacia el gris medio y el tinte `--vidrio-ambiente: rgba(255,255,255,.42)` no lo compensa.
Corrección (tema.css, sección Ambiente):
```css
.c8-base .c8-vidrio, [data-ambiente] .c8-vidrio {   /* el Estudio y la Guía: fondo conocido, sin foto */
  --vidrio-contraste: 1; --vidrio-saturacion: 100%; --vidrio-aclarado: 1;
}
:root[data-tema="claro"] { --vidrio-ambiente: rgba(255,255,255,.62); }
:root[data-tema="oscuro"] { --vidrio-ambiente: rgba(28,30,34,.55); }
```
Objetivo: tarjeta ≥ +8 de luminancia sobre su fondo en claro.

**B13 · P3 · Hover de «Contactar» sin respuesta de material** · `15-hover-contactar.png` — cubierto en B5 (halo que crece, filo que se enciende).

### 3.3 · Modo transparente

**C1 · P2 · En oscuro transparente, todo pasa a aspecto claro: el tema oscuro desaparece** · `estados/oscuro-transparente-0-reposo-largo.png`, `estados/oscuro-transparente-valores.json`
Lo que se ve: con el tema oscuro y cristal transparente, título, sol, radar, modos, pastilla, rótulos y **la tarjeta grande** llevan `data-vidrio-aspecto="claro"` (velo blanco 0,28, texto oscuro con halo blanco): la pantalla es idéntica a «claro transparente». Es coherente con la foto (clara) y legible, pero el visitante que eligió oscuro no ve nada oscuro. En R3 (foto media) el vidrio es neutro y el texto blanco con sombra.
Causa: `visor.js › aplicarAlfas()` rama `transparente`: `media > 0.5 → "claro"` sin excluir la tarjeta grande (la exclusión `.pn-disp-lateral .pn-tarjeta` solo está en la rama tintada); `tema.css :root[data-cristal="transparente"] .c8-vidrio[data-vidrio-aspecto="claro"] { --vidrio: rgba(255,255,255,.24) … }`.
Corrección: excluir también aquí la tarjeta grande y la tira (mismo `grande` de B1) y, para las piezas pequeñas, subir el umbral a `media > 0.6` (la foto de la finca ronda 0,55: hoy cambia casi siempre). La tarjeta grande en oscuro transparente lleva entonces un velo neutro oscuro y texto blanco con sombra, como R3:
```css
:root[data-cristal="transparente"][data-tema="oscuro"] .c8-vidrio:is(.pn-disp-lateral .pn-tarjeta, #galeria) {
  --vidrio-relleno: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,0) 50%), rgba(20,22,26,.30);
}
```

**C2 · P2 · El halo blanco del texto se nota como truco** · `12-transparente-texto.png` (`claro transp · titulo`)
Lo que se ve: alrededor de «Finca señorial con jardín» hay manchas blancas de 8 px: el texto parece recortado y pegado. R3 usa texto blanco con una sombra oscura corta (`0 1px 2px`, ~35 %) y nada más.
Causa: `tema.css :root[data-cristal="transparente"][data-tema="claro"] { --sombra-texto: 0 0 2px rgba(255,255,255,.95), 0 1px 8px rgba(255,255,255,.8) }` y lo mismo en `[data-vidrio-aspecto="claro"]`.
Corrección: menos halo y un poco más de velo, que es lo que en realidad hace legible el texto oscuro:
```css
:root[data-cristal="transparente"][data-tema="claro"], :root .c8-vidrio[data-vidrio-aspecto="claro"] {
  --sombra-texto: 0 0 1px rgba(255,255,255,.55), 0 1px 2px rgba(255,255,255,.35);
  --sombra-icono: drop-shadow(0 0 1px rgba(255,255,255,.6));
}
:root[data-cristal="transparente"] .c8-vidrio { --vidrio: rgba(255,255,255,.14); --vidrio-texto: rgba(255,255,255,.20); --vidrio-denso: rgba(255,255,255,.26); }
:root[data-cristal="transparente"] .c8-vidrio[data-vidrio-aspecto="claro"] { --vidrio: rgba(255,255,255,.30); --vidrio-texto: rgba(255,255,255,.34); }
```
Para el texto blanco (oscuro transparente sin inversión) la sombra actual `0 1px 2px .55, 0 0 10px .35` es la de R3: correcta.

**C3 · P2 · Cuándo se lee como vidrio y cuándo como «nada»** · `12`, `06` (`oscuro transp · radar`)
Lo que se ve: las piezas con texto se leen como vidrio gracias al canto 0,28/0,6 y a la sombra del texto; el radar y la zona vacía de la tarjeta se leen como «nada» (una zona algo más borrosa). Con A3 (canto en cuatro lados), A4 (sombra), A5 (luz vertical + grano) y B8 (lente) el transparente se sostiene aunque el velo sea del 14–20 %; es justo el caso de R3: canto + sombra + desenfoque corto, sin tinte.

**C4 · P3 · Botón principal en transparente** · `03` — el 58 % de dorado con velo se ve bien; con B5 gana el anillo y el halo.

### 3.4 · Coherencia entre piezas (dónde se rompe el «mismo material»)

| Pieza | Filtro | Tinte / alfa real | Canto visible | Sombra | Rompe |
|---|---|---|---|---|---|
| Título `#lugar`, sol `#sol`, modos, pastilla | material (28 px, sat 170 %) | suelo 0,30 (claro) · 0,22–0,48 (oscuro) | débil, dos esquinas | 1/2 | A1, A3 |
| Tarjeta `.pn-tarjeta` | material | 0,30 / 0,447 | **ninguno** (overflow) | 2, no se ve | A2, A4 |
| Diálogos, menú «Más» | material | 0,62 / 0,6 | **ninguno** | 3, no se ve | A2, A4, A5 |
| Tira `#galeria` | material | **aspecto oscuro en claro** | ninguno | 2 | B1, A2 |
| Radar `.disco` | material | 0,30 / 0,32 | ninguno | 1 | A2, B8 |
| Rótulos `.etq`, `.info` | material (28 px en 30 px) | 0,30 / 0,28 | débil | 2 + halo sólido | A6, B9 |
| Pomo, pines | **propio** `blur(16) saturate(1.6)` | gota 64 % | aro oscuro | corta | B3, B4 |
| Botón principal | **propio** `blur(18) saturate(1.6)` | dorado 72 % | filo arriba | color desplazado | B4, B5 |
| Interruptores | — | pista + rojo 22 % | aro rojo | — | B6 |
| Disco del suelo | WebGL | gris ≈ 45 % | filo blanco | ninguna | B11 |
| Estudio: tarjetas | material sobre ambiente | 0,42 blanco → más oscuro que el fondo | ninguno | 1 | B12 |

Con A1–A6 + B3/B4 todas las piezas comparten filtro (tres tallas de un mismo token), tinte, canto, volumen y sombra; solo cambia la alfa por pieza (medida) y la talla del desenfoque.

### 3.5 · Accesibilidad (lo que cambia con estas correcciones)

- Subir los suelos de alfa (A1) y bajar `saturate` solo mejora el contraste texto/vidrio; `contrast .74` y `brightness 1.08` lo reducen un poco sobre fotos oscuras en claro: la alfa medida subirá en esas piezas (correcto por diseño). Repasar `npm run contraste` con los nuevos tokens.
- El aro de la gota al 14–22 % (B3) puede no llegar a 3:1 (WCAG 1.4.11): si `pruebas/contraste.mjs` lo exige, usar 0,40 y mantener el escalón de luminancia de la gota ≥ +40 sobre el carril, que es lo que de verdad identifica el estado.
- Nada de lo propuesto añade animación infinita (M3) ni `backdrop-filter` anidado.
- «Reducir transparencia» sigue ganando: con `background` en capas, la regla `@supports not (backdrop-filter)` y `[data-transparencia="reducida"]` deben fijar `--vidrio-relleno` opaco y `--vidrio-grano: none`.

---

## 4 · Modelo de material completo (tokens y capas, listo para `tema.css`)

Orden de capas de toda pieza `.c8-vidrio`, de atrás adelante:

1. **Esmerilado** (`backdrop-filter`): desenfoque por talla (S 10 · M 18 · L 28 px; transparente 6 · 10 · 16), saturación 108 %, contraste 0,74, brillo 1,08 (claro) / 0,72 (oscuro). Sobre ambiente (Estudio, Guía): sin contraste ni saturación.
2. **Tinte** (`--vidrio-relleno`): `rgb(tinte / alfa)`, alfa medida por pieza entre el suelo (0,44 / 0,36 / 0,52 en claro; 0,40 / 0,32 / 0,48 en oscuro) y el peor caso; tinte 250 251 253 (claro) / 24 26 30 (oscuro).
3. **Luz vertical** (`--vidrio-luz-vertical`): más luz arriba, un leve oscurecido abajo.
4. **Grano** (`--vidrio-grano`): ruido fractal al 6 % (8 % oscuro), mosaico de 160 px.
5. **Canto** (`--vidrio-canto`, en el borde, `background-clip: border-box`): cuatro lados, luz arriba (1,0 / 0,62), lados (0,55 / 0,18), reflejo abajo (0,7 / 0,28), más vivo en las esquinas superiores.
6. **Grosor** (`--vidrio-volumen`, `box-shadow: inset`): filo de 1 px arriba, filo tenue abajo, relieve oscuro de 2 px bajo el filo, brillo de 1 px y de 1,25 rem en todo el contorno.
7. **Sombra** (`--sombra-1/2/3`): contacto (1–2 px), cercana (4–14 px, spread −2…−6) y ambiente (16–44 px, spread −8…−16).
8. **Gota** (lo elegido, pomo, pines, pulsado de la pastilla): vidrio más claro (+40), filo de luz, aro muy tenue, sombra de contacto corta; mismo esmerilado en talla S.
9. **Acción principal**: dorado 68 % + luz radial + anillo + halo (18 px, 26 px en hover) + sombra.
10. **Luz del puntero** (solo ratón): `::before` donde no hay `overflow`; opcional.

```css
/* ================================================================== Tokens del material (sustituyen a los actuales) */
:root {
  --vidrio-desenfoque-s: 10px; --vidrio-desenfoque-m: 18px; --vidrio-desenfoque-l: 28px;
  --vidrio-desenfoque: var(--vidrio-desenfoque-l);
  --vidrio-saturacion: 108%;
  --vidrio-contraste: 0.74;
  --vidrio-aclarado-claro: 1.08;
  --vidrio-aclarado-oscuro: 0.72;
  --filo: 1px;
  --vidrio-luz-vertical: linear-gradient(180deg, rgba(255,255,255,.14) 0%, rgba(255,255,255,.04) 38%, rgba(255,255,255,0) 60%, rgba(0,0,0,.035) 100%);
  --vidrio-grano: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/><feComponentTransfer><feFuncA type='linear' slope='0.06'/></feComponentTransfer></filter><rect width='100%' height='100%' filter='url(%23g)'/></svg>") 0 0 / 160px 160px;
  --vidrio-canto:
    radial-gradient(60% 40% at 50% 0%, var(--vidrio-reflejo-1), transparent 100%),
    linear-gradient(180deg, var(--vidrio-reflejo-1) 0%, var(--vidrio-reflejo-lado) 28%, var(--vidrio-reflejo-lado) 70%, var(--vidrio-reflejo-2) 100%);
  --vidrio-volumen:
    inset 0 1px 0 var(--vidrio-reflejo-1), inset 0 -1px 0 var(--vidrio-reflejo-2),
    inset 0 2px 3px -1px var(--vidrio-relieve), inset 0 0 0 1px var(--vidrio-brillo), inset 0 0 1.25rem var(--vidrio-brillo);
  --vidrio-filtro: blur(var(--vidrio-desenfoque)) saturate(var(--vidrio-saturacion)) contrast(var(--vidrio-contraste)) brightness(var(--vidrio-aclarado));
  --vidrio-filtro-gota: blur(var(--vidrio-desenfoque-s)) saturate(var(--vidrio-saturacion)) contrast(0.9);
}
@media (min-resolution: 2dppx) { :root { --filo: 0.5px; } }

:root, :root[data-tema="oscuro"] {
  --vidrio-tinte: 24 26 30;
  --vidrio-a-icono: 0.46; --vidrio-a-texto: 0.56; --vidrio-a-denso: 0.62;
  --vidrio-a-suelo: 0.40; --vidrio-a-suelo-icono: 0.32; --vidrio-a-suelo-denso: 0.48;
  --vidrio-aclarado: var(--vidrio-aclarado-oscuro);
  --vidrio-ambiente: rgba(28, 30, 34, 0.55);
  --vidrio-borde: rgba(255, 255, 255, 0.14);
  --vidrio-reflejo-1: rgba(255, 255, 255, 0.62); --vidrio-reflejo-2: rgba(255, 255, 255, 0.28); --vidrio-reflejo-lado: rgba(255, 255, 255, 0.18);
  --vidrio-relieve: rgba(0, 0, 0, 0.28); --vidrio-brillo: rgba(255, 255, 255, 0.10); --vidrio-luz: rgba(255, 255, 255, 0.35);
  --vidrio-grano: url("…slope='0.08'…") 0 0 / 160px 160px;
  --vidrio-gota-brillo: rgba(255, 255, 255, 0.26);
  --vidrio-gota-aro: color-mix(in srgb, var(--c-texto) 22%, transparent);
  --vidrio-gota: linear-gradient(180deg, var(--vidrio-gota-brillo), rgba(255,255,255,.06) 55%, rgba(255,255,255,0) 100%), rgba(255, 255, 255, 0.16);
  --vidrio-gota-sombra: inset 0 1px 0 rgba(255,255,255,.55), inset 0 -1px 0 rgba(255,255,255,.14), inset 0 0 0 1px var(--vidrio-gota-aro), 0 1px 2px rgba(0,0,0,.28), 0 6px 14px -4px rgba(0,0,0,.35);
  --sombra-1: 0 1px 1px rgba(0,0,0,.30), 0 4px 10px -2px rgba(0,0,0,.34), 0 16px 36px -8px rgba(0,0,0,.42);
  --sombra-2: 0 1px 2px rgba(0,0,0,.34), 0 8px 18px -4px rgba(0,0,0,.40), 0 28px 60px -12px rgba(0,0,0,.50);
  --sombra-3: 0 2px 3px rgba(0,0,0,.36), 0 14px 28px -6px rgba(0,0,0,.44), 0 44px 90px -16px rgba(0,0,0,.56);
  --sombra-texto: 0 1px 2px rgba(0, 0, 0, 0.45);
}
:root[data-tema="claro"] {
  --vidrio-tinte: 250 251 253;
  --vidrio-a-icono: 0.45; --vidrio-a-texto: 0.6; --vidrio-a-denso: 0.64;
  --vidrio-a-suelo: 0.44; --vidrio-a-suelo-icono: 0.36; --vidrio-a-suelo-denso: 0.52;
  --vidrio-aclarado: var(--vidrio-aclarado-claro);
  --vidrio-ambiente: rgba(255, 255, 255, 0.62);
  --vidrio-borde: rgba(20, 24, 32, 0.10);
  --vidrio-reflejo-1: rgba(255, 255, 255, 1); --vidrio-reflejo-2: rgba(255, 255, 255, 0.7); --vidrio-reflejo-lado: rgba(255, 255, 255, 0.55);
  --vidrio-relieve: rgba(20, 24, 32, 0.07); --vidrio-brillo: rgba(255, 255, 255, 0.45); --vidrio-luz: rgba(255, 255, 255, 0.7);
  --vidrio-luz-vertical: linear-gradient(180deg, rgba(255,255,255,.55) 0%, rgba(255,255,255,.18) 40%, rgba(255,255,255,0) 62%, rgba(20,24,32,.03) 100%);
  --vidrio-gota-brillo: rgba(255, 255, 255, 0.9);
  --vidrio-gota-aro: color-mix(in srgb, var(--c-texto) 14%, transparent);
  --vidrio-gota: linear-gradient(180deg, var(--vidrio-gota-brillo), rgba(255,255,255,.35) 60%, rgba(255,255,255,.2) 100%), rgba(255, 255, 255, 0.42);
  --vidrio-gota-sombra: inset 0 1px 0 #fff, inset 0 -1px 0 rgba(255,255,255,.6), inset 0 0 0 1px var(--vidrio-gota-aro), 0 1px 2px rgba(15,20,30,.14), 0 6px 14px -4px rgba(15,20,30,.18);
  --sombra-1: 0 1px 1px rgba(15,20,30,.10), 0 4px 10px -2px rgba(15,20,30,.12), 0 16px 36px -8px rgba(15,20,30,.14);
  --sombra-2: 0 1px 2px rgba(15,20,30,.12), 0 8px 18px -4px rgba(15,20,30,.14), 0 28px 60px -12px rgba(15,20,30,.18);
  --sombra-3: 0 2px 3px rgba(15,20,30,.14), 0 14px 28px -6px rgba(15,20,30,.18), 0 44px 90px -16px rgba(15,20,30,.24);
  --sombra-texto: none;
}
/* Transparente: sin tinte, desenfoque corto, canto marcado, sombra del texto como en R3 */
:root[data-cristal="transparente"] {
  --vidrio-desenfoque-s: 6px; --vidrio-desenfoque-m: 10px; --vidrio-desenfoque-l: 16px;
  --vidrio-saturacion: 104%; --vidrio-contraste: 0.94; --vidrio-aclarado: 1;
  --vidrio-borde: rgba(255, 255, 255, 0.3);
  --vidrio-reflejo-1: rgba(255, 255, 255, 0.85); --vidrio-reflejo-2: rgba(255, 255, 255, 0.4); --vidrio-reflejo-lado: rgba(255, 255, 255, 0.3);
  --vidrio-relieve: rgba(0, 0, 0, 0.12); --vidrio-brillo: rgba(255, 255, 255, 0.12);
  --vidrio-luz-vertical: linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,0) 55%);
  --sombra-texto: 0 1px 2px rgba(0, 0, 0, 0.55), 0 0 10px rgba(0, 0, 0, 0.35);
  --sombra-icono: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
}
:root[data-cristal="transparente"][data-tema="claro"], :root .c8-vidrio[data-vidrio-aspecto="claro"] {
  --sombra-texto: 0 0 1px rgba(255,255,255,.55), 0 1px 2px rgba(255,255,255,.35);
  --sombra-icono: drop-shadow(0 0 1px rgba(255,255,255,.6));
  --vidrio-borde: rgba(255, 255, 255, 0.6);
}
:root[data-cristal="transparente"] .c8-vidrio {
  --vidrio: rgba(255,255,255,.14); --vidrio-texto: rgba(255,255,255,.20); --vidrio-denso: rgba(255,255,255,.26);
  --vidrio-gota: linear-gradient(180deg, rgba(255,255,255,.5), rgba(255,255,255,.1) 60%), rgba(255,255,255,.22);
  --c-segmento: rgba(255,255,255,.26);
  text-shadow: var(--sombra-texto);
}
:root[data-cristal="transparente"] .c8-vidrio[data-vidrio-aspecto="claro"] { --vidrio: rgba(255,255,255,.30); --vidrio-texto: rgba(255,255,255,.34); }
:root[data-cristal="transparente"][data-tema="oscuro"] .c8-vidrio:is(.pn-disp-lateral .pn-tarjeta, #galeria) {
  --vidrio-relleno: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,0) 50%), rgba(20,22,26,.30);
}

/* ================================================================== Material (sustituye a .c8-vidrio y a ::before) */
:where(.c8-vidrio) { position: relative; }
.c8-vidrio {
  --c-texto-2: var(--c-texto-2-vidrio); --c-texto-3: var(--c-texto-3-vidrio);
  --vidrio-relleno: var(--vidrio);
  isolation: isolate;
  border: var(--filo) solid transparent;
  background:
    var(--vidrio-grano) padding-box,
    var(--vidrio-luz-vertical) padding-box,
    linear-gradient(var(--vidrio-relleno), var(--vidrio-relleno)) padding-box,
    var(--vidrio-canto) border-box;
  -webkit-backdrop-filter: var(--vidrio-filtro); backdrop-filter: var(--vidrio-filtro);
  box-shadow: var(--vidrio-volumen), var(--sombra-1);
  transition: background-color var(--d-3) var(--suave), color var(--d-3) var(--suave), box-shadow var(--d-2) var(--suave);
}
.c8-vidrio.c8-vidrio--texto { --vidrio-relleno: var(--vidrio-texto); box-shadow: var(--vidrio-volumen), var(--sombra-2); }
.c8-vidrio.c8-vidrio--denso { --vidrio-relleno: var(--vidrio-denso); box-shadow: var(--vidrio-volumen), var(--sombra-3); }
.c8-vidrio.c8-vidrio--barra { border-radius: 0; border-width: 0; background: var(--vidrio-grano), var(--vidrio-luz-vertical), linear-gradient(var(--vidrio-relleno), var(--vidrio-relleno)); }
/* Tallas del esmerilado (visor.css / paneles.css) */
.etq, .info, #precio-juego, #sello-ia, .c8-etiqueta.c8-vidrio, #btn-ampliar { --vidrio-desenfoque: var(--vidrio-desenfoque-s); }
#lugar, #sol, #modos, #barra-vista, #guion-barra, #galeria, #rotulo, #subtitulo, #radar .disco { --vidrio-desenfoque: var(--vidrio-desenfoque-m); }
/* Luz del puntero: solo con ratón y solo donde no hay overflow (el canto ya no vive aquí) */
@media (hover: hover) and (pointer: fine) {
  :is(#lugar, #sol, #modos, #barra-vista, .etq, .info).c8-vidrio::before {
    content: ""; position: absolute; inset: calc(-1 * var(--filo)); z-index: -1; border-radius: inherit; padding: 1px; pointer-events: none;
    background: radial-gradient(14rem circle at var(--luz-x) var(--luz-y), var(--vidrio-luz), transparent 70%) fixed;
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor;
    mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  }
}
/* Gota (segmentado, pomo, pines, pulsado) · Botón principal · Interruptor · Radar: ver B3, B5, B6, B7, B8 */
/* Ambiente (Estudio, Guía): sin contraste ni saturación, tinte más denso: ver B12 */
/* Contingencias */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .c8-vidrio { --vidrio-relleno: rgb(var(--vidrio-tinte) / 0.94); --vidrio-grano: none; }
}
:root[data-transparencia="reducida"] .c8-vidrio { -webkit-backdrop-filter: none; backdrop-filter: none; will-change: backdrop-filter; --vidrio-relleno: rgb(var(--vidrio-tinte) / 0.96); --vidrio-grano: none; }
```

Reglas de `visor.css`/`paneles.css` que deben pasar de `background:` a `--vidrio-relleno:` al adoptar este modelo: `.c8-segmentado.c8-vidrio`, `#radar .disco.c8-vidrio[data-sin-rotulos]`, `.etq.c8-vidrio:is(:hover, :focus-visible, .resaltada)`, `.info.c8-vidrio:is(:hover, :focus-visible)`, `.c8-boton.c8-vidrio` (`--vidrio-relleno: var(--b-fondo)`), `#cortinilla::before/::after` (que ya replica el vidrio a mano: usar el mismo apilado).

**Comprobación de aceptación (mismas medidas de § 2, tras aplicar):** saturación del vidrio vacío ≤ 12 % (claro) / ≤ 10 % (oscuro); canto superior ≥ +25/+40; relieve interior −10…−20 en oscuro; sombra bajo el pie ≤ −35 en 4 px; gota ≥ +40 sobre su carril sin anillo < 60 % de luminancia; tarjeta del Estudio ≥ +8 sobre su fondo; cero cambios de aspecto después de 1,5 s en reposo.
