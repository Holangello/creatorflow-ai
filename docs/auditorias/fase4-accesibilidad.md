# cre8eight · Fase 4 · Auditoría de accesibilidad (WCAG 2.1 AA)

- **Fecha:** 15/10/2026. Rama `ccr-40d07831-qbgzrt`, commit `2c5065e`. Este informe no cambia el código.
- **Encargo:** sección B de `fase4-encargos-auditoria.md`. He cargado la skill `design:accessibility-review` y he seguido su orden: primero contraste y teclado, después lector de pantalla, objetivos táctiles y zoom. Su plantilla se adapta aquí al formato pedido.
- **Alcance:**
  - Páginas: el visor (`index.html?demo`) con sus paneles, el Estudio y la Guía Osmo 360.
  - Pantallas:
    - Escritorio 1280×800.
    - Teléfono 390×844 táctil, en las tallas S, M y L.
    - iPad 820×1180 táctil.
  - Zoom:
    - 640×400, que equivale al 200 %.
    - 320×640, que equivale al 400 %.
    - Letra del navegador al doble.
    - Espaciado de texto aumentado.
  - Temas claro y oscuro.
- **Herramientas:**
  - Playwright 1.56.1 y Chromium con WebGL por software, con los ayudantes de `pruebas/comun.mjs`.
  - Los scripts, los datos (`.json`) y 372 capturas (`capturas/`) están en `/tmp/claude-0/-home-user-creatorflow-ai/9aa10f93-9bbe-52c5-91f2-e21dabbb4196/scratchpad/auditoria-f4/accesibilidad/`. Cada hallazgo cita los archivos por su nombre dentro de esa carpeta.
- **Contraste real:**
  - Cómo se mide: el texto se oculta un momento (`color: transparent`) y se captura el vidrio con la foto detrás. Bajo cada texto e icono se toma el píxel de fondo más desfavorable. En el texto sobre fotos, además, se mide bajo los propios glifos.
  - Qué se ha medido:
    - 100 vistas: 66 en escritorio y 34 en teléfono.
    - De día y de noche, en dos estancias, con 4 a 8 rumbos cada una.
    - En claro y en oscuro, con el vidrio adaptativo activo y con «Reducir transparencia».
    - En total: 1.802 textos y 1.164 iconos.
- **Teclado:**
  - Tabulador con captura del foco y contraste del anillo (captura con foco menos captura sin foco).
  - Diálogos, menús y atajos.
- **Lector de pantalla:**
  - Árbol de nombres y roles: `ariaSnapshot` y el árbol de accesibilidad real de Chromium (CDP `Accessibility.getFullAXTree`).
  - Regiones vivas observadas con `MutationObserver`.
  - axe-core 4.10.2, copiado en el scratchpad, con las reglas A y AA de WCAG 2.0 y 2.1.
- **Objetivos táctiles:** se mide la caja y la zona que de verdad recibe el toque, sondeando con `elementFromPoint` desde el centro. Así cuentan los `::before`/`::after` y lo que tape el control.
- **Límites:**
  - No he usado un lector de pantalla real (NVDA o VoiceOver) ni dispositivos reales, y solo he probado en Chromium.
  - El tour es el de demostración. Con sus fotos, el vidrio claro nunca llegó a aclararse: `data-luz-min` se quedó siempre en el peor caso, también con los estilos más claros.
  - La máquina iba muy cargada (carga de 13 a 15). Por eso repetí las medidas sensibles al tiempo.

## 1. Resumen y veredicto

1. **La base es sólida.**
   - El texto sobre el vidrio cumple AA en las 100 vistas medidas: el mínimo es 4,59:1, también con el vidrio adaptativo y con «Reducir transparencia».
   - Funcionan bien:
     - los diálogos del núcleo y el menú «Más»;
     - el formulario de contacto;
     - «Reducir movimiento» y «Reducir transparencia»;
     - el reflujo de la Guía.
   - axe no encuentra ningún incumplimiento ni en el visor ni en la Guía.
2. **Dos fallos de nivel A bloquean la entrega (P1):**
   - Los atajos de una letra no se apagan del todo: W, S, Q y E siguen actuando, y en táctil no hay interruptor.
   - Hay funciones que solo se manejan con gestos: el zoom con pellizco y la maqueta, que no se puede girar con el teclado.
3. **12 hallazgos P2**, muchos de una o dos líneas:
   - el icono de «Ampliar» del radar, a 1,06:1;
   - los nombres sobre las fotos de la consulta, a 1,5:1;
   - las letras del certificado energético en el Estudio;
   - un anillo de foco débil sobre la foto;
   - el estado pulsado, casi invisible en claro;
   - las hojas del teléfono, que no retienen el foco;
   - el cajón oculto del Estudio, que recibe el foco;
   - el foco que se pierde al navegar;
   - botones que desaparecen del árbol de accesibilidad en reposo;
   - el texto al 200 %;
   - el nombre de `#lugar`;
   - los bordes de campos y casillas.
4. **9 hallazgos P3** de pulido.
5. **Veredicto:** se puede entregar en cuanto se corrijan los dos P1, que son medio día con sus pruebas. Para poder declarar «WCAG 2.1 AA» hay que cerrar también los P2. Casi todos son cambios de CSS o de una función.

## 2. Hallazgos

### P1 · Bloquean la entrega

#### A1 · Los atajos de una letra no se pueden desactivar del todo

- **Criterio:** 2.1.4 Atajos de teclado de un carácter (A).
- **Dónde:**
  - Visor en el recorrido y en el paseo libre, a 1280×800, en oscuro y talla M (no depende del tema).
  - Ajustes en táctil: comprobado en el teléfono; el iPad cumple la misma condición (`pointer: coarse`).
- **Medida:** `04-teclado-visor.json` (bloques `atajos_off` y `atajos_off_en_boton`), `12-casos.json` (`libre_atajos_off`) y la captura `capturas/07-tactil-390-s-ajustes.png`.
  - Con `visor.ajustes({ atajos: false })`:
    - **E** y **Q** giran la vista.
    - **W** y **S** cambian de estancia (A y D también, si hay estancia a ese lado).
    - R, M, H, V y 1–9 sí se apagan.
  - Con el foco en un botón del HUD (`#btn-radar`), **E** sigue girando la vista.
  - En el paseo libre, **W** y **S** siguen caminando: cambia el 12 % y el 18 % de los píxeles, lo mismo que con ↑.
  - En pantallas táctiles, Ajustes no ofrece «Atajos de teclado», porque está dentro de `if (!esTactil())`. Pero un iPad con teclado recibe todas las letras.
  - Con los atajos apagados, la pista («W A S D para moverte») y la Ayuda siguen anunciando W A S D.
- **Por qué importa:**
  - Quien usa control por voz, o tiene temblor, cambia de estancia y gira la vista sin querer.
  - El interruptor promete lo contrario («Teclas de una sola letra, como W A S D»), y `ESQUEMA.md` da el criterio por cumplido.
- **Propuesta:**
  - `visor.js:1214`: con los atajos apagados, las letras solo funcionan con el foco en el lienzo (`role="application"`). Es la excepción «activo solo con el foco» de 2.1.4.
    - Añadir `const letras = atajos || e.target === lienzo;`.
    - Usar `(letras || !/^(Key[A-Z]|Digit\d)$/.test(e.code))` en la condición y quitar la lista `KeyW…KeyE`.
  - `visor.js:1210`: no añadir la letra a `int.teclas` si `!letras` (afecta al paseo libre).
  - `paneles.js:1925`: sacar `ajuste("atajos", …)` del bloque `if (!esTactil())`.
  - Pista y Ayuda: hablar de W A S D solo con los atajos activos.
  - Prueba nueva en `e2e-paneles.mjs`: con `atajos: false`, `s` y `e` no tienen efecto.

#### A2 · Funciones que solo se manejan con gestos: zoom con pellizco y maqueta sin teclado

- **Criterio:** 2.5.1 Gestos del puntero (A) y 2.1.1 Teclado (A).
- **Dónde:** el visor en táctil (recorrido y maqueta) y la maqueta en escritorio. Todos los temas y tallas.
- **Medida:**
  - **Recorrido en táctil:**
    - El zoom solo existe con dos dedos (`visor.js:1039–1041`). La Ayuda lo dice: «Pellizca para acercar y alejar».
    - No hay botones de zoom. «Más» trae Visita guiada, Medir, Compartir, Idioma, Ajustes, Pantalla completa y Mirar moviendo el móvil (`07-tactil-visor-390.json`).
  - **Maqueta** (`18-maqueta.json`):
    - Con el foco en el lienzo, ←, →, ↑, +, −, Q, E y RePág cambian el **0 %** de los píxeles. Arrastrar con el ratón cambia el **71 %**.
    - `maqueta.js:24` crea `OrbitControls` sin `listenToKeyEvents`.
    - Las etiquetas de las estancias sí funcionan con el teclado.
- **Por qué importa:**
  - Quien maneja el móvil con un dedo, un puntero de cabeza o un conmutador no puede acercar la foto.
  - Quien usa el teclado no puede girar ni acercar la maqueta, aunque sí puede entrar en las estancias.
- **Propuesta:**
  - **Zoom:** «Acercar» y «Alejar» en «Más» en táctil (`visor.mas.agregar` con `donde: "movil"`, que llama a `fijarZoom`). No añade nada fijo en pantalla.
  - **Maqueta:**
    - `controles.listenToKeyEvents(ctx.lienzo)` en `maqueta.js`: las flechas desplazan y Mayús+flechas giran.
    - + y − acercan y alejan (`dollyIn`/`dollyOut`). Actualizar la Ayuda.
    - En táctil, los mismos «Acercar» y «Alejar» de «Más» sirven para la maqueta.

### P2 · Conviene

#### A3 · El botón «Ampliar» del radar pierde el vidrio

- **Criterio:** 1.4.11 Contraste no textual (AA).
- **Dónde:** el visor en todos los tamaños y tallas, en claro y en oscuro. También con «Reducir transparencia».
- **Medida:** `12-casos.json` y las capturas `capturas/12-ampliar-claro-noche.png`, `capturas/12-ampliar-oscuro-dia.png` y `capturas/12-ampliar-claro-reducida.png`.
  - El fondo computado es `rgba(0,0,0,.05)` en claro y `rgba(255,255,255,.08)` en oscuro: es el `--b-fondo` de `.c8-boton`, no `--vidrio`.
  - Contraste del icono con lo que tiene detrás:
    - 1,06:1 en claro, de noche, con una ventana oscura detrás.
    - 1,55:1 en oscuro, de día, con una ventana clara.
    - Entre 1,06:1 y 1,58:1 con «Reducir transparencia», porque el botón sigue translúcido. Es lo único que no se vuelve opaco (`09-movimiento-transparencia.json`).
- **Por qué importa:**
  - `.c8-boton { background: var(--b-fondo) }` (`tema.css:464`) va después de `.c8-vidrio` (`tema.css:392`) con la misma especificidad, así que gana.
  - El botón tiene un equivalente (`#lugar`), pero no se ve y cae justo sobre el radar.
- **Propuesta:** en `tema.css`, después del bloque del botón, añadir `.c8-boton.c8-vidrio { --b-fondo: var(--vidrio); }` y `.c8-boton.c8-vidrio:hover { --b-fondo: var(--vidrio-texto); }`. Sirve también para cualquier botón de vidrio futuro.

#### A4 · Los nombres sobre las fotos de la consulta no se leen con fotos claras

- **Criterio:** 1.4.3 Contraste mínimo (AA).
- **Dónde:** el visor, en la tira de fotos adjuntas de «Pregunta por esta vivienda» (`paneles.js:1370`). En claro y en oscuro, en todas las tallas. El nombre está oculto para el lector de pantalla, que lee el `alt` («Foto 1: Salón»), pero quien ve la pantalla depende de él.
- **Medida:**
  - Con una miniatura blanca (`16-texto-sobre-foto.json`, `capturas/16-tira-consulta-blanca-oscuro.png`):
    - bajo los glifos de «Salón», el contraste va de 1,5:1 arriba a 2,5:1 abajo;
    - la mediana es 2,1:1.
  - Con la foto real de la demo: 3,9:1 (`13-dialogos-vidrio.json`).
  - Referencia: la tira de estancias del núcleo da 6,19:1 en todos los glifos.
- **Por qué importa:**
  - `.pn-tira-et` (`paneles.css:380`) usa `--degradado-foto` (`tema.css:128`), que va de 0,62 abajo a transparente al 70 % de la altura. A la altura del texto apenas oscurece.
  - `sistema.md` promete 6,2:1 «incluso sobre una foto blanca», pero eso solo se cumple en el borde inferior.
- **Propuesta:**
  - Usar el mismo velo que la tira del núcleo, que llega a su opacidad completa a los 6 px: `.pn-tira-et { background-image: linear-gradient(transparent, var(--velo-foto) 0.5rem); }`.
  - O corregir el token: `--degradado-foto: linear-gradient(to top, var(--velo-foto) 60%, transparent)`.
  - Corregir también la frase de `sistema.md`.

#### A5 · Estudio: letras del certificado energético ilegibles cuando no están elegidas, y estrechas en el iPad

- **Criterio:** 1.4.3 (AA) y la regla del proyecto de 44 px (2.5.5, que en WCAG 2.1 es AAA).
- **Dónde:** el Estudio, paso «Datos», «Consumo» y «Emisiones». En claro y en oscuro, en escritorio y en iPad.
- **Medida:** `10-estudio-guia-estudio-guia.json` y las capturas `capturas/10-estudio-oscuro-datos.png` y `capturas/10-estudio-ipad-m-datos.png`.
  - Las letras no elegidas tienen `opacity: .45` (`estudio.css:470`). Su texto queda entre 1,64:1 y 3,32:1 en oscuro, y entre 1,21:1 y 2,73:1 en claro.
  - En el iPad táctil no se cumple la regla `.letras-ce button { width: var(--toque-minimo) }` (`estudio.css:736`): el contenedor flexible encoge los botones a 21 px de ancho en S y a 28 px en M.
- **Por qué importa:** es un dato obligatorio en los anuncios, y las letras A, B, F y G casi no se leen.
- **Propuesta:**
  - Quitar la opacidad al botón y atenuar solo el fondo, con el texto a contraste pleno. Por ejemplo, `background: color-mix(in srgb, var(--ce-x) 40%, var(--c-sup-2))`.
  - O dejar las letras a todo color y marcar la elegida solo con el contorno que ya existe.
  - Poner `flex-wrap: wrap` en `.letras-ce` y `flex: none` en los botones.

#### A6 · El anillo de foco se ve poco sobre la foto

- **Criterio:** 2.4.7 Foco visible (AA) y 1.4.11 (AA).
- **Dónde:**
  - Visor, en las piezas que flotan sobre la foto: `#lugar`, «Ampliar» y el lienzo. Las etiquetas 3D usan el mismo anillo, pero además se rellenan de champán al recibir el foco.
  - Estudio, en el menú «Proyecto».
  - En claro y en oscuro, en escritorio (1280×800), talla M.
- **Medida:**
  - Se mide el contraste del anillo con lo que había debajo, restando una captura sin foco de otra con foco.
  - Datos: `02-tabulador-oscuro-claro.json`, `12-casos.json` y `10-estudio-guia-estudio-guia.json`.
  - Capturas: `capturas/12-foco-lugar-oscuro-dia-225.png`, `capturas/02-foco-claro-21.png` y `capturas/10-estudio-menu-proyecto-foco.png`.
  - Resultados por pieza:
    - **`#lugar`:** la mediana va de 1,7:1 a 2,4:1 en 5 de 8 vistas. En las otras 3 va de 3,9:1 a 4,8:1, pero una cuarta parte del contorno se queda entre 1,3:1 y 1,5:1.
    - **«Ampliar»:** de 2,0:1 a 2,3:1.
    - **Lienzo en claro** (marco interior de 3 px): mediana de 2,2:1, y una cuarta parte del marco a 1,2:1.
    - **Menú «Proyecto» del Estudio:** el foco solo cambia el relleno, a 1,5:1 (`estudio.css:87`).
  - Lo que sí está bien:
    - los botones de la barra de vista, con una mediana de 3 a 4,9:1, porque el anillo cae sobre la píldora;
    - la tira de estancias, de 4,8 a 9,6:1;
    - la tarjeta, de 5,5 a 6,2:1;
    - la mayoría de controles del Estudio y la Guía, de 7 a 10:1. En los botones champán la medida sale más baja porque el anillo cae sobre su brillo, pero en la captura se ve bien.
- **Por qué importa:** el anillo de 2 px en `--c-foco`, separado 2 px, se dibuja sobre la foto, que puede tener el mismo tono. Quien navega con el teclado y ve poco lo pierde.
- **Propuesta:**
  - En las piezas de vidrio que flotan (`#lugar`, `.etq`, `.info`, `.c8-boton.c8-vidrio`), poner `outline-offset: -3px`. Así el anillo queda dentro del vidrio, que ya garantiza el contraste.
  - O usar un anillo de dos colores (técnica C40 de WCAG): `outline: 2px solid var(--c-foco)` más `box-shadow: 0 0 0 4px var(--c-fondo)`.
  - Lienzo: `box-shadow: inset 0 0 0 3px var(--c-foco), inset 0 0 0 5px var(--c-fondo)`.
  - Estudio: `.menu-proyecto .item-menu:focus-visible { box-shadow: inset 0 0 0 2px var(--c-foco); }`, igual que el menú «Más» del visor.

#### A7 · En claro, el estado «pulsado» y la opción elegida apenas se distinguen

- **Criterio:** 1.4.11 (AA). En claro, el estado pulsado roza además 1.4.1 Uso del color (A).
- **Dónde:** la barra de vista (Radar y Música) en claro, y los controles segmentados (modos, Ajustes y Estudio) en los dos temas; 1280×800, talla M.
- **Medida:** píxeles leídos con PIL en `capturas/06-1280x800-m-claro-*-fondo.png` y `capturas/06-1280x800-m-oscuro-*-fondo.png`.
  - **Botón pulsado en claro:** el relleno champán frente al vidrio de la barra da entre 1,03:1 y 1,17:1 (en oscuro, 5,8:1). El icono es del mismo tono oscuro esté pulsado o no, así que en claro el estado solo se distingue por el matiz.
  - **Opción elegida del segmentado:** el resalte frente al carril da entre 1,28:1 y 1,43:1 en claro, y entre 1,65:1 y 1,67:1 en oscuro.
- **Por qué importa:** quien distingue mal los colores o ve poco no sabe si el radar o la música están activos, ni qué modo está elegido. Música y Pantalla completa cambian también el dibujo del icono; el Radar no.
- **Propuesta:**
  - En claro, añadir un aro de 1,5 px en `--c-acento-texto` (≥ 4,5:1 sobre el vidrio) a `.c8-pastilla .c8-boton[aria-pressed="true"]`.
  - Poner el mismo aro en el resalte `::after` del segmentado.
  - En colores forzados, ver A20.

#### A8 · En el teléfono, las hojas de los paneles parecen modales, pero el foco se escapa detrás

- **Criterio:** 2.4.3 Orden del foco (A), 2.4.7 (AA) y 4.1.2 Nombre, función y valor (A).
- **Dónde:**
  - Visor en las disposiciones «hoja» (teléfono en vertical, 390×844) y «compacta» (en horizontal).
  - Diálogos afectados: Contactar, Compartir, Ajustes e Idioma. «Estilo y luz» no lleva velo.
  - Probado en oscuro, talla M.
- **Medida:** `11-telefono-visor.json` (`tab_tras_dialogo` y `ax_con_dialogo`) y la captura `capturas/11-hoja-contacto-foco-detras.png`.
  - Con la hoja abierta y el velo puesto, el Tab sale del último control de la hoja y llega al lienzo, a las etiquetas 3D, a `#lugar` y a «Ampliar». Todos están tapados y el anillo queda bajo la hoja.
  - El árbol de accesibilidad sigue mostrando Radar, Más, Recorrido o «Ir a Cocina», así que con VoiceOver se puede salir de la hoja deslizando el dedo.
  - El diálogo tiene `aria-modal="false"` (`paneles.js:1185`). En escritorio no hay velo, y ahí un diálogo no modal es correcto.
- **Por qué importa:** pasa en el contacto, el flujo que convierte. Quien usa teclado, conmutador o lector de pantalla acaba en controles que no ve.
- **Propuesta:**
  - En `dialogo()` (`paneles.js:1185`), cuando `ui.disp !== "lateral"`:
    - poner `aria-modal="true"`;
    - poner `inert` en todo lo demás: `#app > :not(#paneles)` y los hermanos del diálogo dentro de `.pn-raiz`;
    - quitar ese `inert` al cerrar.
  - Otra opción: retener el Tab dentro de la hoja, como ya hace el visor de imágenes (`paneles.js:1771`).

#### A9 · Estudio en pantalla estrecha: el cajón de la vista previa, fuera de la pantalla, recibe el foco

- **Criterio:** 2.4.7 (AA) y 2.4.3 (A).
- **Dónde:** el Estudio a 860 px o menos, en oscuro, talla M. Es el iPad en vertical (820×1180) o un ordenador con zoom del 150 % o más; probado también a 640×400.
- **Medida:** `17-estudio-estrecho.json`.
  - Cada vuelta del tabulador tiene 2 paradas invisibles, fuera del borde derecho: la opción «Ordenador» (x = 996 a 640 px de ancho, x = 1205 a 820 px) y «Ampliar vista previa» (x = 1101 y x = 1319).
  - La prueba es con un proyecto vacío. Con fotos se añadirían el selector de estancia y el visor del iframe; eso no lo he medido.
- **Por qué importa:** el cajón se oculta solo con `transform` (`estudio.css:703`), sin `visibility` ni `inert`. Quien usa el teclado pierde el foco fuera de la pantalla.
- **Propuesta:**
  - Cajón cerrado con `visibility: hidden` y `transition: transform var(--d-3), visibility 0s var(--d-3)`.
  - Al abrirlo: `body.vista-abierta #vista { visibility: visible; }`.
  - O bien `#vista.inert = !abierta` en `estudio.js:181` y `estudio.js:369`.

#### A10 · El foco se pierde al cambiar de estancia con una etiqueta 3D

- **Criterio:** 2.4.3 Orden del foco (A).
- **Dónde:** el visor en escritorio (1280×800), en el recorrido, en claro y en oscuro, talla M.
- **Medida:** `04-teclado-visor.json` (`nav_etiqueta`) y `12-casos.json`.
  - Intro sobre «Ir a Cocina»: se llega a la Cocina y el foco pasa a `body`.
  - En la tira de estancias y en «Estancias y plano», el foco se conserva.
  - Al cerrar con Esc la nota de un punto «i», el foco va al lienzo en vez de volver al «i».
- **Por qué importa:** `construirPuntos()` (`visor.js:457`) rehace las etiquetas y borra el botón que tenía el foco. Con un lector de pantalla, la lectura vuelve al principio de la página.
- **Propuesta:**
  - En `construirPuntos()`: antes de `replaceChildren()`, guardar si el foco estaba dentro (`etiquetas.contains(document.activeElement)`). Si lo estaba, llamar después a `lienzo.focus({ preventScroll: true })`. El nombre de la estancia ya se anuncia por `#anuncio`.
  - En `mostrarFicha()`: guardar el elemento de origen y devolverle el foco en `ocultarFicha()` (`visor.js:1705–1707`).

#### A11 · En reposo, la tarjeta saca botones del árbol de accesibilidad

- **Criterio:** 4.1.2 (A) y 1.3.1 Información y relaciones (A).
- **Dónde:** el visor con la interfaz en reposo, tras 3,5 s sin tocarlo, en escritorio (1280×800) y en teléfono (390×844), oscuro, talla M; no depende del tema.
- **Medida:** `11-telefono-visor.json` (árbol real de Chromium leído por CDP).
  - En el teléfono desaparecen «Foto de la vista» y «Estilo y luz».
  - En escritorio desaparecen también «Visita guiada» y «Medir».
  - Los controles del HUD siguen en el árbol, porque solo se atenúan con `opacity`.
- **Por qué importa:**
  - `paneles.css:186` los pone en `display: none`.
  - VoiceOver al deslizar el dedo y NVDA en modo de exploración no generan los eventos que despiertan la interfaz. Para esos usuarios, los botones dejan de existir.
- **Propuesta:** en esa regla, ocultarlos solo a la vista, con la misma técnica que `.pn-sr` (`position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%)`), en lugar de `display: none`. La píldora «349.000 € · Contactar» encoge igual y no se quita nada del árbol.

#### A12 · Texto al 200 % y espaciado aumentado

- **Criterio:** 1.4.4 Cambio de tamaño del texto (AA), 1.4.10 Reflujo (AA) y 1.4.12 Espaciado del texto (AA).
- **Dónde:** el visor y el Estudio, en oscuro, talla M, en tres situaciones: a 1280×800 con la letra del navegador a 32 px (`Page.setFontSizes`), a 640×400 (zoom al 200 %) y con el espaciado de texto aumentado.
- **Medida:** `08-reflujo-visor-estudio-guia.json` y `17-estudio-estrecho.json`. Capturas: `capturas/08-visor-1280-800-fuente2x.png`, `capturas/17-estudio-fuente2x.png` y `capturas/08-visor-640-400.png`.
  - **Visor con la letra al doble:** la barra de vista tapa la opción «Maqueta» (70×60 px de solape; queda encima el botón «Radar») y también la pista. A 640×400 el solape es de 11 px.
  - **Estudio con la letra al doble:**
    - «Mi inmobiliaria» y «Publicar» se salen por la derecha (hasta x = 1479 en una pantalla de 1280). No hay barra de desplazamiento porque `body` tiene `overflow: hidden`.
    - Del nombre del proyecto solo queda la flecha.
    - «Publicar» sigue disponible en el paso 4 y con Ctrl+E.
  - **Estudio a 640×400:** un ordenador con zoom al 200 % recibe el aviso «El Estudio necesita un ordenador o un iPad» (`estudio.js:469`, `max-width: 759px`).
  - **Espaciado aumentado:** en la tarjeta de escritorio, «Foto de la vista» se corta con puntos suspensivos.
  - Lo que sí está bien:
    - el visor no se desplaza en horizontal ni a 320 ni a 640 px;
    - la Guía no tiene ningún problema en ningún caso;
    - el contacto cabe a 320×640.
- **Propuesta:**
  - Visor: cuando no quepa, llevar `#modos` abajo, como en vertical. Usar una consulta en `em` que siga a la letra, por ejemplo `@media (max-width: 62em)`.
  - Estudio: `flex-wrap: wrap` en `#barra-sup`, o un menú para lo que no quepa.
  - Mostrar el aviso de pantalla pequeña solo con `(pointer: coarse)`.
  - Tarjeta: que `.pn-t-et` pueda pasar a dos líneas.

#### A13 · El nombre accesible de `#lugar` no contiene lo que se ve

- **Criterio:** 2.5.3 Etiqueta en el nombre (A).
- **Dónde:** el visor, en el botón del título, arriba a la izquierda, en todos los tamaños, temas y tallas.
- **Medida:** en `01-aria-visor-oscuro-1280.txt` el botón se llama `button "Salón · Estancias y plano"`. En pantalla se lee «Demo · Piso reformado de 2 habitaciones · Salón · 30,00 m²».
- **Por qué importa:** con control por voz, decir «pulsa Demo» o «pulsa Piso reformado» no funciona.
- **Propuesta:**
  - En `visor.js:2028`, quitar `aria-label` y añadir dentro del botón `<span class="c8-visualmente-oculto"> · Abrir estancias y plano</span>`.
  - O componer el `aria-label` como «título · estancia · Estancias y plano».

#### A14 · Los bordes de los campos y las casillas no llegan a 3:1

- **Criterio:** 1.4.11 (AA).
- **Dónde:** el contacto del visor y «Datos» del Estudio (1280×800) y la Guía (390×844), en claro y en oscuro, talla M.
- **Medida:** `14-bordes.json` y las capturas `capturas/14-contacto-oscuro.png` y `capturas/10-guia-oscuro-390.png`.
  - **Campos de texto:** el borde frente al fondo da entre 1,05:1 y 1,62:1, y el relleno entre 1,02:1 y 1,17:1.
  - **Casillas sin marcar de la Guía:** 1,79:1 en oscuro y 1,44:1 en claro.
  - Lo que sí está bien: la casilla nativa de privacidad del contacto llega a 3,7–4:1, y un campo con el foco a 6,3–7,5:1.
- **Por qué importa:** en la Guía, la casilla es lo único que indica que la fila se puede marcar. En los campos la etiqueta ayuda, pero el contorno casi no se ve.
- **Propuesta:**
  - Crear un token `--c-borde-campo` de al menos 3:1, por ejemplo `rgba(255,255,255,.42)` en oscuro y `rgba(0,0,0,.45)` en claro.
  - Aplicarlo a `.c8-campo`, a `.c8-entrada` y a las casillas `ul.check input` de la Guía.
  - Si el cliente prefiere los campos sutiles, aplicarlo al menos a las casillas.

### P3 · Pulido

#### A15 · Estudio: pestañas de planta sin contenedor `tablist`

- **Criterio:** 4.1.2 (A).
- **Dónde:** Estudio, paso «Plano», 1280×800, claro, talla M.
- **Qué pasa:** axe marca `aria-required-parent` como crítico en `estudio-plano.js:90`: hay botones con `role="tab"` sin un contenedor con `role="tablist"` (`15-axe.json`).
- **Propuesta:** poner `role="tablist"` y `aria-label="Plantas"` en el contenedor y moverse con las flechas, o usar botones con `aria-pressed`.

#### A16 · Anuncios que pueden no leerse

- **Criterio:** 4.1.3 Mensajes de estado (AA).
- **Dónde:** contacto del visor (probado con el visor simulado de `pruebas/fixtures/paneles.html`, 1280×800, oscuro); avisos del núcleo y de la Guía en cualquier tamaño y tema.
- **Qué pasa:** es un riesgo que depende del lector de pantalla.
  - La confirmación del contacto («Gracias, Lucía…») aparece dentro de una región `role="status"` recién creada, en el mismo momento en que el foco salta a «Hacer otra pregunta» (`05-contacto.json`, `exito_vivo`).
  - `#aviso` del núcleo (`visor.js:1660`) y el de la Guía reciben el texto mientras están ocultos, y luego se muestran.
- **Lo que está bien:**
  - El error del CRM usa `role="alert"` y lleva el foco a «Reintentar».
  - La tostada de los paneles (`.pn-toast`) y los `#toasts` del Estudio son regiones fijas.
- **Propuesta:** anunciar a través de esas regiones fijas, cambiando solo su texto, o enfocar el párrafo de confirmación (`tabindex="-1"`).

#### A17 · Avisos con acción que desaparecen solos

- **Criterio:** 2.2.1 Tiempo ajustable (A).
- **Dónde:** visor, cualquier tamaño, tema y talla (comprobado en el código).
- **Qué pasa:** «Deshacer» (`paneles.js:520`, 6 s) y «Reintentar» (`visor.js:1671`, de 4,5 a 6 s) se ocultan aunque tengan el foco. Como hay otras formas de hacer lo mismo, el impacto es bajo.
- **Propuesta:** pausar el temporizador con `focusin` y `pointerenter`, y reanudarlo al salir.

#### A18 · Nombres y estructura mejorables

- **Criterio:** 2.5.3 (A) y 1.3.1 (A).
- **Dónde:** visor y Estudio, 1280×800, oscuro, talla M.
- **Qué pasa** (`01-aria-visor-oscuro-1280.txt`, `04-teclado-visor.json`, `10-aria-estudio-oscuro.txt`):
  - En Ajustes del visor, el tamaño se ve como «S·M·L» pero las opciones se llaman «Pequeño», «Mediano» y «Grande». Mejor «S, pequeño».
  - En los modos, el lector dice «Recorrido 360, radio» y después «Recorrido», porque el texto visible no tiene `aria-hidden`.
  - En el Estudio, un botón se lee «Más herramientasMás»: son dos textos sin espacio.
  - Los interruptores de Ajustes llevan la nota dentro del nombre. Mejor con `aria-describedby`.
  - La vista principal del visor no tiene `h1` ni `main` (axe lo deja «por revisar» en *bypass*).
- **Propuesta:** corregir esos nombres y añadir un `h1` visualmente oculto con el título.

#### A19 · Guía: el paso nuevo no se anuncia

- **Criterio:** 2.4.3 (A) y 4.1.3 (AA).
- **Dónde:** Guía, 390×844 táctil, claro y oscuro (igual en escritorio).
- **Qué pasa:** «Siguiente →» cambia el paso, pero el foco se queda en el pie y `#titulo-actual` no es una región viva (`10-estudio-guia-estudio-guia.json`).
- **Propuesta:** enfocar el `h1` del paso (con `tabindex="-1"`) o poner `aria-live="polite"` en el título.

#### A20 · Preferencias del sistema

- **Criterio:** buena práctica; no lo exige WCAG 2.1 AA.
- **Dónde:** visor, 1280×800, oscuro, talla M (`prefers-contrast` y `forced-colors` emulados por CDP).
- **Qué pasa:**
  - `prefers-contrast: more` no cambia nada (`09-movimiento-transparencia.json`).
  - En colores forzados, el estado pulsado de la barra de vista no se distingue (`capturas/09-visor-forced-colors.png`).
- **Propuesta:**
  - En `tema.js`, tratar `prefers-contrast: more` como «Reducir transparencia», que es lo que hace macOS.
  - Añadir `@media (forced-colors: active) { .c8-boton[aria-pressed="true"] { forced-color-adjust: none; background: Highlight; color: HighlightText; } }`.

#### A21 · Objetivos táctiles por debajo de 44 px

- **Criterio:** la regla de 44 px es del proyecto. En WCAG 2.1, el 2.5.5 es AAA; el 2.5.8 de WCAG 2.2 (AA) pide 24 px.
- **Dónde:** visor en el teléfono (390×844 táctil, oscuro, tallas S, M y L) y Estudio en el iPad (820×1180 táctil, oscuro, tallas S y M).
- **Qué pasa** (`07-tactil-visor-390.json` y `10-estudio-guia-estudio-guia.json`):
  - En el teléfono, talla S:
    - Las opciones S y M del tamaño en Ajustes miden 43 px.
    - Las filas de «Estancias y plano» miden 42 px, porque usan `min-height: 3.25rem` en vez de `--toque-minimo`.
    - El resumen «Ver ficha» mide 41 px de alto.
  - «Ampliar» del radar mide 28 px en S, 32 en M y 37 en L, mientras `sistema.md` dice 36. Tiene un equivalente: `#lugar`.
  - «Escribir por WhatsApp» en el contacto mide entre 12 y 16 px de alto. Al estar dentro de una frase está exento, pero es el canal alternativo.
  - El enlace «¿Aún no tienes las fotos?» del Estudio mide entre 17 y 19 px en el iPad.
- **Lo que está bien:** los segmentados y los deslizadores llegan a 44 px también tocando en los bordes, comprobado con `elementFromPoint`.

#### A22 · Estudio: el plano solo se dibuja con el ratón

- **Criterio:** 2.1.1 (A). Es un paso opcional.
- **Dónde:** Estudio, paso «Plano», en escritorio, con cualquier tema (comprobado en el código).
- **Qué pasa:** calibrar y dibujar estancias o muros piden clics; Intro solo cierra el contorno (`estudio-plano.js:1125`). «Colocar» sí funciona con el teclado.
- **Propuesta:** que Intro añada un vértice en el centro de la vista y que las flechas la desplacen.

#### A23 · El vidrio adaptativo no vuelve a medir al abrir un diálogo

- **Criterio:** 1.4.3. Es un riesgo; hoy no falla.
- **Dónde:** visor, 1280×800, claro y oscuro, talla M.
- **Qué pasa:** al abrir un diálogo no se toma una medida nueva; al mover la vista, sí (`13-dialogos-vidrio.json`). Forcé el nivel más transparente con el diálogo sobre una zona de tono contrario, y «Estilo y luz» siguió cumpliendo AA (4,83:1).
- **Propuesta:** poner `luz.pendiente = true` cuando aparezca una pieza `.c8-vidrio`; por ejemplo, con un evento de los paneles al abrir un diálogo o un menú.

## 3. Lo que está bien (no tocar)

- **Contraste real sobre el vidrio:**
  - Textos: 1.802 medidas, todas ≥ 4,5:1. El mínimo es 4,59:1, el «i» en claro de noche; en el teléfono es 4,86:1.
  - Iconos: 1.164 medidas sin contar «Ampliar» (A3), todas ≥ 3:1. El mínimo es 4,85:1.
  - Incluye 18 vistas en oscuro con el vidrio adaptativo aclarado (`data-luz-max="media"`), las vistas de noche y «Reducir transparencia».
  - Peores márgenes: «Visita guiada» a 4,94:1 en oscuro y «Ver ficha» a 4,97:1 en claro.
  - Los diálogos Ajustes, Estilo y luz, Contactar y Compartir también cumplen.
- **Teclado:**
  - Ayuda y «Estancias y plano» son `<dialog>` modales: el foco entra, Esc los cierra y el foco vuelve a su botón, o al lienzo si se abrieron con M.
  - La portada es modal: lo de detrás queda `inert` y el foco va a «Empezar visita».
  - El menú «Más» cumple el patrón de menú:
    - `role="menu"` y `menuitem`;
    - las flechas recorren los elementos y dan la vuelta;
    - Inicio y Fin funcionan;
    - Esc devuelve el foco y Tab cierra el menú.
  - Los paneles en escritorio (Ajustes, Contactar) devuelven el foco al botón que los abrió, y la ficha se cierra con Esc.
  - El visor de imágenes retiene el foco (según el código, `paneles.js:1771`; no lo he probado).
  - En el Estudio y la Guía, los menús y diálogos (Proyecto, Apariencia, Ayuda, Mi inmobiliaria, Pasos) cumplen lo mismo.
  - Los atajos de una tecla del Estudio se pueden desactivar, también en el editor de máscaras.
- **Lector de pantalla y formularios:**
  - El contacto tiene etiquetas, `autocomplete` (name, tel), `aria-invalid` y `aria-describedby` con el texto del error, y el foco va al primer error.
  - El cambio de estancia se anuncia en `#anuncio` («Cocina, 16,00 m²»), y los subtítulos de la visita guiada se leen en vivo.
  - `lang` y `<title>` se mantienen al día.
  - Ningún control sin nombre en el visor, el Estudio ni la Guía.
  - El aviso «sin completar» de «Mi inmobiliaria» también está en su nombre accesible.
  - Con la hoja plegada, la ficha queda fuera del árbol de accesibilidad.
- **Movimiento reducido:**
  - Se activa tanto por el sistema como por el interruptor.
  - No queda ninguna animación en curso al cambiar de estancia, al abrir diálogos ni en reposo, en el visor, el Estudio y la Guía.
  - El rótulo de la estancia no sale.
  - La música y la visita guiada se pueden parar.
- **Transparencia reducida:**
  - Se activa por el interruptor y por `prefers-reduced-transparency` (comprobado por CDP).
  - Todo queda opaco y sin desenfoque, salvo «Ampliar» (A3), también en el Estudio y la Guía.
- **Reflujo:**
  - El visor no se desplaza en horizontal a 320 ni a 640 px, y el contacto cabe a 320×640.
  - La Guía no tiene ningún problema con zoom, letra al doble ni espaciado aumentado.
- **Objetivos táctiles:** casi todo mide 44 px o más en las tallas S, M y L.
- **axe-core:**
  - 0 incumplimientos en el visor, en 8 estados: vista principal, Estancias y plano, Ayuda, Contactar, Estilo y luz, Ajustes, ficha y teléfono.
  - 0 en la Guía.
  - 1 en el Estudio (A15).

## 4. Tabla resumen

| Id | P | Criterio WCAG 2.1 | Dónde | Arreglo |
|---|---|---|---|---|
| A1 | P1 | 2.1.4 (A) | Visor, teclado | Letras solo con el foco en el lienzo si los atajos están apagados; interruptor también en táctil |
| A2 | P1 | 2.5.1, 2.1.1 (A) | Visor táctil, maqueta | «Acercar/Alejar» en «Más»; `listenToKeyEvents` y +/− en la maqueta |
| A3 | P2 | 1.4.11 (AA) | «Ampliar» del radar | `.c8-boton.c8-vidrio { --b-fondo: var(--vidrio) }` |
| A4 | P2 | 1.4.3 (AA) | Fotos de la consulta | Velo completo bajo el texto (`--degradado-foto`) |
| A5 | P2 | 1.4.3 (AA), 44 px | Estudio · Datos | Letras A–G sin `opacity` y sin encoger |
| A6 | P2 | 2.4.7, 1.4.11 (AA) | Visor sobre la foto; menú del Estudio | Anillo dentro del vidrio o de dos colores |
| A7 | P2 | 1.4.11 (AA) | Barra de vista en claro; segmentados | Aro de `--c-acento-texto` en pulsado y elegido |
| A8 | P2 | 2.4.3, 2.4.7, 4.1.2 | Hojas del teléfono | `aria-modal` + `inert` o retener el foco |
| A9 | P2 | 2.4.7, 2.4.3 | Estudio ≤ 860 px | Cajón cerrado con `visibility: hidden` o `inert` |
| A10 | P2 | 2.4.3 (A) | Etiquetas 3D y nota «i» | Devolver el foco al lienzo o al origen |
| A11 | P2 | 4.1.2, 1.3.1 (A) | Tarjeta en reposo | Ocultar solo a la vista, sin `display: none` |
| A12 | P2 | 1.4.4, 1.4.10, 1.4.12 | Visor y Estudio al 200 % | Modos abajo; barra del Estudio que se reparte; aviso solo táctil |
| A13 | P2 | 2.5.3 (A) | `#lugar` | Nombre con el título visible |
| A14 | P2 | 1.4.11 (AA) | Campos y casillas | `--c-borde-campo` ≥ 3:1 |
| A15–A23 | P3 | Varios | Ver arriba | Pulido |

**Recuento:** P1: 2 · P2: 12 · P3: 9.
