# cre8eight · Auditoría visual del cristal: realismo y detalle

Petición del cliente (16/10): «Que todo se vea mucho más realista. Tiene un poco de irrealidad la calidad. Audita bien con el agente de diseño web para que todo dé perfectamente en cuanto a detalle visual, que no se te escape nada.»

Las referencias del cliente (tres imágenes) están en `/root/.claude/uploads/9aa10f93-9bbe-52c5-91f2-e21dabbb4196/`:
- `6d22db80-image.jpg`: panel de domótica en cristal blanco esmerilado sobre un salón; tarjetas con bordes muy suaves, sombra difusa, anillos verdes; interruptores verdes.
- `6b8003af-image.jpg`: app en cristal oscuro ahumado; píldoras y tarjetas con cantos claros muy finos, relieve sutil, botón principal con halo.
- `debaa802-image.jpg`: barra de pestañas transparente sobre plantas; solo desenfoque, canto claro fino, la pestaña elegida es una gota más clara, texto blanco con sombra.

Material de partida:
- Capturas actuales del visor con la finca en claro, oscuro y transparente, móvil y escritorio: `<SCRATCH>/cristal/v2/` (tintado) y `<SCRATCH>/cristal/v3/` (transparente); el Estudio en `<SCRATCH>/cristal/v2/estudio-*.png`.
- Script para capturar más estados: `<SCRATCH>/cristal/capturar.mjs <salida> [filtro]` (se ejecuta desde `tools/visor-inmobiliario`; un tamaño cada vez: hay otro revisor trabajando).
- Para recortes ampliados: `<SCRATCH>/finca/venv/bin/python -I` con OpenCV (`cv2`).
- El sistema de vidrio: `tools/visor-inmobiliario/tema.css` (secciones «Vidrio», «Vidrio adaptativo», «Cristal transparente», «Botón», «Segmentado», «Interruptor»), `docs/diseno/sistema.md § Cristal`, y las piezas en `visor.css` (`#sol .pomo`, `.maq-pin`, `#esquina`, `#modos`, `#galeria`) y `paneles.css` (`.pn-tarjeta`, `.pn-dialogo`).
- `<SCRATCH>` = `/tmp/claude-0/-home-user-creatorflow-ai/9aa10f93-9bbe-52c5-91f2-e21dabbb4196/scratchpad`.

Reglas comunes:
- No se edita código. Cada informe trae hallazgos con prioridad (P1 se nota a simple vista, P2 se nota al fijarse, P3 pulido), captura o recorte que lo prueba, causa en el código (archivo y selector) y la corrección CSS/JS concreta, con valores.
- Mide, no supongas: recorta y amplía (×3) los bordes, cantos, sombras y textos; compara lado a lado con el recorte equivalente de la referencia.
- Decisiones del cliente que no se tocan: tres modos (claro, oscuro, transparente), sin rellenos sólidos, verde encendido y rojo apagado muy sutiles, minimalismo iOS, una sola acción dorada.

## A · Realismo del material (cristal como objeto físico)

Informe en `docs/auditorias/cristal-realismo.md`. Carga la skill `design:design-critique`.

Revisa, pieza por pieza y en los tres modos, por qué el cristal «no parece real» frente a las referencias:
- **Desenfoque y refracción:** radio del desenfoque frente al tamaño de la pieza; si lo de detrás se ve como a través de un vidrio grueso (referencia 1) o como una mancha; saturación y brillo del fondo.
- **Canto y grosor:** el canto especular (dónde está la luz, cuánto mide, si se ve en los cuatro lados o solo arriba a la izquierda), el borde interior frente al exterior, el «grosor» aparente del vidrio en las esquinas redondeadas (referencia 2: canto claro de 1 px por fuera y relieve oscuro por dentro).
- **Sombras:** si flotan de verdad (distancia, difusión, color), si hay sombra de contacto; el halo del botón principal.
- **Rellenos:** tinte, alfa y gradientes (la luz de arriba abajo); si el blanco/negro es «plano» o tiene volumen; el ruido/grano fino que da materialidad en las referencias.
- **Gotas** (lo elegido, el pomo, los pines): si se ven como una pieza de cristal encima del carril o como una mancha más clara.
- **Interruptores y botones:** pomo, pista, el verde/rojo, el dorado como cristal.
- **Coherencia entre piezas:** que la barra del sol, el radar, la tarjeta, los modos, la tira de estancias, el menú y los diálogos parezcan el mismo material; dónde se rompe.
- **Modo transparente:** cuándo se lee como vidrio y cuándo como «nada»; el canto; la sombra del texto (si se nota como truco).
- Propón un **modelo de material** completo (tokens de tema.css con valores) y, si hace falta, nuevas capas (p. ej. `::after` con ruido SVG, segundo canto interior, `box-shadow` multicapa), con el CSS listo.

## B · Detalle visual pixel a pixel (acabado)

Informe en `docs/auditorias/cristal-detalle.md`. Carga las skills `design:design-critique` y `design:design-system`.

Pasa todas las capturas (y recortes ×3) con lupa:
- **Alineaciones** entre piezas vecinas (barra del sol y título, radar, columna de iconos, modos, tarjeta): ejes, márgenes iguales, centrados ópticos de iconos y textos dentro de píldoras.
- **Radios:** coherencia (píldora, `--r-4`, `--r-5`), radios concéntricos (contenedor y botones dentro: radio interior = exterior − relleno), esquinas que se ven «aplastadas».
- **Bordes y cantos:** dobles bordes, bordes de 1 px que se ven de 2 en pantallas 1×, bordes que desaparecen sobre fondos claros u oscuros, cantos cortados por `overflow`.
- **Tipografía:** pesos, interletrado, line-height en píldoras (texto descentrado verticalmente), números tabulares, mayúsculas con tracking, sombras de texto que emborronan.
- **Iconos:** grosor de trazo coherente, tamaño óptico igual entre iconos, centrado en el botón, el aro verde de los encendidos (grosor, color, si se ve pegado al borde).
- **Interruptores, deslizadores, segmentados, pomo del sol, pines, miniaturas de la tira:** estado por estado.
- **Sombras:** dobles sombras, sombras que se cortan, sombras demasiado densas en claro.
- **Espaciado:** ritmo entre bloques en Ajustes y en la ficha; separadores.
- **Estudio y Guía:** lo mismo en sus tarjetas, barra, pasos y menús.
- Lista **todo** lo que encuentres, aunque sea de 1 px: el cliente pide que no se escape nada. Propón la corrección exacta.
