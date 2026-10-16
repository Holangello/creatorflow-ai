# cre8eight · Encargos de la revisión de adaptación (móvil, tablet y escritorio)

Petición del cliente (16/10):
> «Que todos los botones, espacios, banners y todos los elementos del software estén perfectamente adaptados para tablet, móvil y desktop. Y en qué partes vayan cada uno de los elementos del software, que lo vuelvan a revisar los agentes de IA de software, de edición de páginas web y aplicaciones, y el de UX/UI, para que vean todos los puntos de mejora y se apliquen.»

Se lanzan **tres revisiones en paralelo** que **no editan código**. Cada una entrega un informe en `docs/auditorias/` con hallazgos priorizados:
- **P1:** se ve roto o no se puede usar en algún tamaño.
- **P2:** conviene.
- **P3:** pulido.

Cada hallazgo indica:
- página, estado y tamaños afectados;
- la captura que lo prueba;
- la causa en el código (archivo y selector o función);
- la corrección concreta (CSS o JS propuesto, listo para aplicar).

El orquestador concilia los tres informes, aplica las correcciones y las verifica.

## Material común

- Código en `tools/visor-inmobiliario`, rama `ccr-40d07831-qbgzrt`. Hay tres páginas:
  - el visor (`index.html`), con la tarjeta, la ficha, el contacto y los ajustes en `paneles.js`/`paneles.css`;
  - el Estudio (`estudio.html`, `estudio*.js`, `estudio.css`);
  - la Guía Osmo 360 (`asistente-osmo.html`).
- El sistema de diseño es `tema.css`/`tema.js`, documentado en `docs/diseno/sistema.md`.
- **Capturas y métricas ya hechas**, con la finca de lujo real (`demos/finca`), en `<AUDITORIA>/v1/`:
  - Nombre de archivo: `pagina-estado-tamaño.png`.
  - Tamaños: `movil-s` 360×740, `movil` 390×844, `movil-xl` 430×932, `movil-h` 844×390, `tablet-s` 768×1024, `tablet` 820×1180, `tablet-h` 1180×820, `tablet-pro-h` 1366×1024, `portatil` 1280×800, `escritorio` 1440×900 y `escritorio-xl` 1920×1080.
  - Hay captura en 7 de esos tamaños y métricas en los 11.
  - Estados del visor: portada, recorrido, menú «Más», ajustes, ficha, contacto, plano, maqueta y compartir.
  - Estados del Estudio: inicio y sus 7 pasos con el proyecto de la finca importado.
  - Estados de la Guía: inicio y página completa.
- `<AUDITORIA>/v1/metricas.json` recoge, por página, estado y tamaño:
  - `desbordeX`: desborde horizontal;
  - `fuera`: controles fuera de pantalla;
  - `tapados`: el centro del control lo tapa otro elemento;
  - `pequenos`: controles de menos de 44 px en táctil o de 24 px con ratón;
  - `recortes`: textos cortados o con elipsis;
  - `letraPeque`: letra de menos de 12 px;
  - `solapes`: bloques flotantes que se pisan.
- Las métricas son una ayuda, no la verdad: hay falsos positivos, como un control tapado a propósito por un diálogo modal. Confírmalas con la captura o con el código.
- Script de capturas: `<AUDITORIA>/auditar.mjs`. Uso: `node auditar.mjs <salida> [visor|estudio|guia] --tam 390x844,...`, ejecutado desde `tools/visor-inmobiliario`.
  - Úsalo solo si necesitas otro estado o tamaño.
  - Lanza un tamaño cada vez: trabajan tres revisores en 4 núcleos y la WebGL es por software.
  - Escribe en tu propia carpeta de salida.
  - Las capturas se revisan con la herramienta Read.

## Decisiones del cliente que no se discuten

Son el punto de partida. Se pueden mejorar su colocación o su tamaño, pero no quitarlas:
- Barra del sol arriba a la izquierda: es el único control de luz.
- Radar al estilo Counter-Strike.
- WASD y modo juego.
- Recorrido y Maqueta.
- Contacto por WhatsApp con capturas.
- Estilos IA solo en proyectos.
- Colores de pared.
- Música con volumen y sonidos de la interfaz.
- Claro y oscuro.
- Tallas S/M/L.
- Vidrio de estilo iOS en todo, sin rellenos sólidos.
- «Compacto y esencial»: no añadir paneles ni botones nuevos sin quitar otros.

Lee las auditorías anteriores (`fase3-organizacion.md`, `fase4-visual.md`, `fase4-accesibilidad.md`, `fase4-cierre.md`) para no repetir lo ya resuelto ni proponer lo que el cliente ya descartó.

## A · Ingeniería de software front-end

Informe en `docs/auditorias/adaptacion-ingenieria.md`.

Revisa la arquitectura de la adaptación:
- **Media queries:** puntos de corte de `tema.css`, `visor.css`, `paneles.css` y `estudio.css`, y si son coherentes entre archivos, si se solapan o si dejan huecos (por ejemplo, la tablet en vertical que cae como móvil o como escritorio).
- **Criterios de detección:** uso de `pointer`/`hover` frente al ancho, y de la orientación y `max-height` (el teléfono en horizontal).
- **Alto de pantalla y zonas seguras:** unidades `dvh`/`svh`, `env(safe-area-inset-*)` en todos los bordes fijos (notch, isla dinámica, barra de inicio, teléfono en horizontal), y `viewport-fit=cover` en las tres páginas.
- **Teclado del móvil:** su comportamiento sobre los formularios del contacto y del Estudio (`visualViewport`).
- **Capas:** `z-index` y apilamiento entre la barra del sol, el radar, la tarjeta, los modos, las etiquetas 3D, los diálogos y los avisos.
- **Desbordes y recortes:** los de `metricas.json`, con su causa en el código.
- **Escala y talla:** si la talla S/M/L y la escala de tipos siguen funcionando en 1920 y en 360 (`clamp`).
- **Reacción a cambios de tamaño:** que la interfaz se adapte al girar la tablet o el teléfono y al redimensionar la ventana del escritorio, en el visor (JS que lee `innerWidth`) y en el Estudio.
- **Imágenes y lienzos:** `devicePixelRatio` y el tamaño del canvas en tablet.

## B · Edición de páginas web y aplicaciones: colocación de cada elemento

Informe en `docs/auditorias/adaptacion-maquetacion.md`.

Por cada página y cada tipo de dispositivo (móvil vertical, móvil horizontal, tablet vertical, tablet horizontal, portátil y monitor grande), dibuja el **mapa de zonas** actual: qué elemento va en cada esquina o borde, y qué tapa de la foto. Después propone el mapa ideal.

Preguntas que debe responder:
- **Alcance del pulgar:** en móvil y tablet, ¿están las acciones frecuentes (cambiar de estancia, modos, contacto) en la zona del pulgar, y las de consulta (título, sol, radar) arriba?
- **Escritorio:**
  - ¿Se aprovecha el ancho sin dejar piezas diminutas flotando en un monitor de 1920?
  - ¿Quedan la tarjeta y la ficha a una distancia de lectura cómoda?
- **Tablet:**
  - ¿Tiene su propio diseño o hereda el del móvil estirado o el del escritorio encogido?
  - ¿Cómo debería ser en vertical y en horizontal?
- **Móvil en horizontal:** con 390 px de alto, ¿qué sobra y qué se esconde?
- **Ritmo:** márgenes laterales, distancia a los bordes, alineaciones entre piezas (la barra del sol con el radar, la tarjeta con los modos) y espaciado coherente.
- **Estudio:**
  - Colocación de navegación, contenido y acciones en tablet y en portátil.
  - El aviso en el teléfono.
  - El paso del plano en tablet táctil.
- **Guía Osmo:** lectura cómoda en móvil (es para usarla en la visita, con la cámara en la mano).

## C · UX/UI

Informe en `docs/auditorias/adaptacion-ux-ui.md`. Carga las skills `design:design-critique` y `design:accessibility-review`.

Revisa por dispositivo:
- **Jerarquía visual:** ¿qué se ve primero?, ¿es lo que importa en cada contexto?
- **Objetivos táctiles:** 44 px en táctil, y la distancia entre objetivos.
- **Escala tipográfica:** legible a la distancia de uso de cada dispositivo, sin letra de menos de 12 px.
- **Iconos, densidad y respiración.**
- **Coherencia** de radios, sombras y vidrio entre el visor, el Estudio y la Guía.
- **Interacción:** estados (pulsado, seleccionado, foco), gestos (arrastrar la hoja, pellizcar) y hover solo donde hay ratón.
- **Primer uso:** ¿se entiende qué hacer en 3 segundos en el móvil?
- **Dónde se pierde el usuario.**
- **Nivel iOS:** compara con las apps de Apple, como Fotos, Mapas y Casa en iPhone y iPad.
- **Mejoras:** propone las que más suban la calidad percibida, siempre dentro de «compacto y esencial».
