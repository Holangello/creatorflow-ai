# cre8eight · Revisión de adaptación B: maquetación y colocación de cada elemento

Revisor: edición de páginas web y aplicaciones (maquetación). Encargo: [adaptacion-encargos.md](adaptacion-encargos.md) § B. Rama `ccr-40d07831-qbgzrt`, 16/10/2026.
Código revisado: `6a649d2` (el de las capturas `v1`). Mientras escribía, el árbol de trabajo tenía cambios sin confirmar (z-index de los paneles, teclado, maqueta, Estudio). Cuando uno de esos cambios ya cubre un punto, el hallazgo lo dice («en curso»). Los selectores citados existen en los dos estados.

## Resumen y veredicto

- **El visor tiene un mapa de zonas sólido y coherente en los seis tipos de pantalla.**
  - Arriba a la izquierda, la columna de consulta: título, barra del sol y radar, al estilo de Counter-Strike.
  - Arriba a la derecha, la barra de vista.
  - Abajo, o a la derecha en escritorio, la tarjeta con «Contactar».
  - Los bordes están alineados: lugar, sol y radar a 11 px del borde izquierdo; la barra de vista y la tarjeta comparten el borde derecho; los modos tienen el mismo ancho que la tarjeta en el móvil.
  - La interfaz tapa el 24 % de la foto en el móvil, el 15 % en 1440 y el 11 % en 1920. En reposo solo quedan el radar y la píldora con el precio.
- **Pantallas que heredan un diseño ajeno:**
  - **La tablet en horizontal hereda el escritorio.** «Contactar» queda arriba a la derecha, lejos de los pulgares (MAQ-4).
  - **La tablet en vertical hereda el móvil estirado.** Abajo se apilan tres piezas de anchos distintos: 209, 584 y 720 px (MAQ-5).
  - **El móvil en horizontal desaprovecha la esquina de abajo a la izquierda.** Los modos van arriba, en el centro, fuera del alcance del pulgar (MAQ-6). El menú «Más» se abre encima de la tarjeta y sale cortado (MAQ-7).
- **Estudio:**
  - En el teléfono (tras «Seguir aquí»), los textos se parten palabra a palabra y un botón queda encima del texto (MAQ-1, **P1**). La barra lateral se come el 17 % del ancho (MAQ-2).
  - En el portátil de 1280 la barra de pasos se queda en iconos de tablet (MAQ-9).
  - El paso Plano tiene cuatro columnas hasta 1440, y el lienzo queda en 430–560 px (MAQ-8).
  - La vista previa «Ordenador» del árbol de trabajo sale como una miniatura de 16:10 perdida en una columna alta (MAQ-10).
- **Guía:** lectura cómoda en el móvil, con la navegación abajo, al alcance del pulgar. Solo el teléfono en horizontal va justo de alto (MAQ-16).
- **Veredicto: 1 P1 (el Estudio en el teléfono) y 9 P2 de colocación.** No cambian las decisiones del cliente y no añaden piezas: mueven las que hay. Las P3 son pulido.

**Recuento: P1 1 · P2 9 · P3 7.**

## Cómo se ha revisado

**Carpeta de trabajo:** `/tmp/claude-0/-home-user-creatorflow-ai/9aa10f93-9bbe-52c5-91f2-e21dabbb4196/scratchpad/auditoria/`. Las rutas de abajo son relativas a ella.

| Qué | Dónde |
|---|---|
| Las 133 capturas de `v1/` (visor 9 estados × 7, Estudio 8 × 7, Guía 2 × 7), leídas una a una y en montajes por tamaño | `v1/`, `maq/mont/*.png` |
| Recortes ampliados (radar, modos, ficha en horizontal) | `maq/rec/` |
| Rectángulos medidos en el DOM de cada pieza del visor en 390×844, 844×390, 820×1180, 1180×820 (táctil), 1440×900 y 1920×1080 | `maq/medir.mjs` y `maq/medidas-*.json` |
| Estudio a 1280×800, que no tenía captura (con el árbol de trabajo de las 06:45) | `maq/v2/estudio-*-portatil.png` y `maq/mont/est-portatil.png` |
| `metricas.json`, `metricas-a/b/c.json` | Confirmados con la captura o con el código. Falsos positivos descartados: controles «tapados» por una hoja o un diálogo abiertos a propósito, el «Ampliar» que pisa el disco del radar a propósito y los campos tapados por el pie fijo de la Guía al desplazarse |

### Medidas del visor en reposo activo (px: x, y, ancho, alto)

| Pieza | 390×844 | 844×390 | 820×1180 | 1180×820 | 1440×900 | 1920×1080 |
|---|---|---|---|---|---|---|
| `#lugar` | 11,11 · 179×51 | 11,11 · 222×44 | 11,11 · 225×52 | 11,11 · 225×52 | 12,12 · 213×47 | 13,13 · 231×51 |
| `#sol` | 11,69 · 179×50 | 11,58 · 222×50 | 11,70 · 225×50 | 11,70 · 225×50 | 12,67 · 213×50 | 13,73 · 231×53 |
| `#radar` | 11,125 · 88 | 11,111 · 74 | 11,128 · 121 | 11,128 · 136 | 12,125 · 142 | 13,134 · 154 |
| `#modos` | 11,715 · 369×46 | 327,11 · 190×43 | 306,949 · 209×46 | 486,11 · 209×46 | 620,12 · 200×41 | 852,13 · 216×45 |
| `#barra-vista` | 327,11 · 53×196 (columna) | 638,11 · 196×53 | 564,11 · 245×54 | 924,11 · 245×54 | 1162,12 · 266×49 | 1619,13 · 288×53 |
| `#galeria` (tira) | — | — | 118,1011 · 584×90 | 367,719 · 446×90 | 492,795 · 456×93 | 720,968 · 480×99 |
| `.pn-tarjeta` | 11,768 · 369×66 (hoja) | 473,323 · 364×60 (compacta) | 50,1101 · 720×68 (hoja) | 813,73 · 356×230 (lateral) | 1058,69 · 370×231 | 1505,74 · 402×249 |
| **Foto tapada (activo)** | **24 %** | **20 %** | **17 %** | **19 %** | **15 %** | **11 %** |

La raíz mide 14 px en el móvil, 15,15 en la tablet, 15,75 en 1440 y 17,1 en 1920. Las piezas crecen con la pantalla, como prevé `tema.css`.

---

## 1. Respuestas a las preguntas del encargo

### Alcance del pulgar (móvil y tablet)

- **Móvil en vertical: bien resuelto.**
  - En la zona del pulgar (los 120 px de abajo) están «Contactar», «Foto de la vista», los modos y la ficha, que se abre arrastrando la tarjeta.
  - Arriba quedan las piezas de consulta: título, sol, radar y la barra de vista.
  - Lo único frecuente fuera del pulgar es abrir «Estancias y plano» (el título o el «Ampliar» del radar, arriba a la izquierda). Se compensa porque el cambio de estancia más habitual son las flechas del suelo con su nombre, en el centro de la foto.
  - No propongo moverlo: el radar arriba a la izquierda es una decisión del cliente, y un botón más rompería «compacto y esencial».
- **Móvil en horizontal: a medias.**
  - «Contactar» está abajo a la derecha (pulgar derecho), pero los modos están arriba, en el centro, donde no llega ningún pulgar.
  - La esquina de abajo a la izquierda, la del pulgar izquierdo, está vacía. Ver MAQ-6.
- **Tablet en vertical:** las acciones quedan abajo, al alcance, pero apiladas en tres filas (MAQ-5).
- **Tablet en horizontal: mal.**
  - Se coge con las dos manos por los lados, y los pulgares cubren el tercio inferior de cada borde.
  - Toda la tarjeta, con «Contactar», está arriba a la derecha (y = 73–303 de 820) (MAQ-4).

### Escritorio

- **¿Se aprovecha el ancho en 1920?** Sí, sin piezas diminutas.
  - La raíz sube a 17,1 px: la tarjeta mide 402 px, el radar 154 y la tira 480.
  - Las esquinas de abajo quedan libres a propósito: la foto manda. Solo la tira se queda algo corta para un monitor (miniaturas de 98 × 64 px) (MAQ-14, P3).
- **¿La tarjeta y la ficha están a una distancia de lectura cómoda?** Sí.
  - La ficha se despliega en la misma columna derecha, de 370–402 px, con unas 55 letras por línea.
  - Los diálogos (contacto, ajustes, estilo) se abren a su izquierda, alineados por arriba, como los inspectores de macOS.
  - No conviene centrarla: taparía la foto, y el modelo de «columna inspector» es el correcto.

### Tablet

- **Hoy no tiene un diseño propio.**
  - **En vertical** (`.pn-disp-hoja` hasta 1024 px) es el móvil con más aire.
    - Mejora: la barra de vista pasa a fila, los botones de la tarjeta llevan nombre y aparece la tira con «Visita guiada».
    - Problema: abajo se apilan modos, tira y tarjeta con tres anchos distintos (220 px de pila).
  - **En horizontal** (`.pn-disp-lateral`) es el escritorio tal cual, pensado para el ratón.
- **Cómo debería ser:**
  - **Vertical:** los modos suben arriba, al centro, porque caben entre el título y la barra de vista (328 px libres). Abajo quedan solo la tira y la tarjeta, del mismo ancho y centradas (MAQ-5).
  - **Horizontal táctil:** la columna derecha se ancla abajo, con «Contactar» en la última fila y las acciones encima. La ficha y los diálogos crecen hacia arriba. Con ratón (iPad con trackpad o portátil) se queda como hoy (MAQ-4).

### Móvil en horizontal (390 px de alto)

- **Qué hay hoy:** la columna izquierda (título 44 + sol 50 + radar 74 = 174 px, el 45 % del alto), los modos arriba en el centro, la barra de vista arriba a la derecha y la tarjeta compacta abajo a la derecha.
- **Qué sobra:** nada que se pueda quitar sin tocar decisiones del cliente (el sol y el radar se quedan).
  - Ya se esconden bien: la tira de estancias, el botón de pantalla completa (pasa a «Más»), los baños de la tarjeta, el agente en el contacto y la frase de la barra de captura.
- **Qué se mueve:**
  - Los modos, abajo a la izquierda (MAQ-6).
  - «Más», en dos columnas para que no se corte ni tape la tarjeta (MAQ-7).

### Ritmo

- **Lo que está bien:**
  - Márgenes laterales iguales en el visor: `--hud` = `max(10px, .75rem)` = `--pn-margen` (11–13 px).
  - Alineaciones correctas: la columna izquierda (lugar, sol y radar) en x = 11; el sol con el mismo ancho que el título; la barra de vista y la tarjeta con el mismo borde derecho; la tarjeta a 8 px bajo la barra de vista (`--pn-arriba`). En el móvil, los modos tienen el mismo ancho y los mismos bordes que la tarjeta.
- **Desajustes:**
  - En la tablet en vertical, los modos (209), la tira (584) y la tarjeta (720) no comparten ejes (MAQ-5).
  - En escritorio, la tarjeta empieza en y = 69 y la barra del sol en y = 67: 2 px de diferencia, imperceptible.
  - En el Estudio, el `--hueco` de 8 px entre paneles frente a los 16 px del relleno de `.seccion` está bien. La barra superior tiene su margen (V6, ya resuelto).

### Estudio

- **Tablet en vertical (820): la mejor de todas.** Barra de pasos de iconos, trabajo a todo el ancho y vista previa en cajón con «Vista previa» en la barra.
- **Tablet en horizontal (1180) y portátil (1280):**
  - Tres columnas, con la de iconos de tablet incluso a 1280 (MAQ-9).
  - El paso Plano tiene cuatro columnas (MAQ-8).
  - La vista previa es estrecha para «Ordenador» (MAQ-10).
- **Las acciones del paso cambian de sitio** (MAQ-15):
  - «Continuar → Datos» va arriba a la derecha en Plano.
  - En los demás pasos, «Continuar» va al final del contenido, fuera de la vista en las listas largas.
- **Aviso en el teléfono:**
  - Bien pensado: tres salidas claras y «Seguir aquí» discreto.
  - Los botones quedan a media pantalla. En iOS van abajo, en la zona del pulgar (MAQ-17).
- **Paso Plano en la tablet táctil:**
  - En vertical está bien: herramientas arriba, lienzo de 730 × 550 px, lista debajo (38 % del alto) y zoom abajo a la derecha, al alcance del pulgar.
  - En horizontal, el lienzo pierde la mitad del ancho por la vista previa acoplada (MAQ-8).
  - En el teléfono en horizontal lo arregla el árbol de trabajo: plano y panel lado a lado.

### Guía Osmo

- **En el móvil, lectura cómoda.**
  - Columna a todo el ancho, con 16 px de margen, letra de 16 px y unas 45 letras por línea.
  - Las casillas son filas enteras pulsables.
  - «Anterior / Siguiente» van en un pie fijo abajo, a medias, en la zona del pulgar.
  - El selector de paso va arriba, que es consulta.
- **En la tablet y el escritorio:** columna de 46 rem centrada y pie alineado con ella (V15, ya resuelto). En 1920 sobra margen a los lados, y es lo correcto para leer.
- **En el teléfono en horizontal:** la cabecera fija y el pie fijo dejan unos 290 px de texto (MAQ-16).

---

## 2. Mapas de zonas

Notación: **actual** → **ideal**. «Tapa» es la parte de la foto que cubre la interfaz activa.

### 2.1 Visor · móvil en vertical (360–430 × 740–932)

Capturas: `visor-*-movil.png`, `visor-*-movil-s.png`.

| Zona | Actual | Ideal |
|---|---|---|
| Arriba izq. | `#esquina`: título (179×51) · barra del sol (179×50) · radar (88) con «Ampliar» | Igual |
| Arriba dcha. | `#barra-vista` en columna (53×196): Radar · Música · Ayuda · Más | Igual |
| Centro | Foto, flechas con nombre, «i» y pista | Igual |
| Abajo | `#modos` a todo el ancho (369×46) sobre la tarjeta (369×66): precio · [Foto] [Estilo] [Contactar] | Igual |
| Hoja abierta (ficha a media altura) | Tapa la mitad de abajo; la columna de arriba sigue: quedan unos 220 px de foto | Con la ficha abierta se apartan el sol y el radar, como en reposo (MAQ-12) |
| Diálogos | Hojas abajo, hasta el 88 % del alto («Estilo y luz» hasta el 40 %) | Igual |
| En reposo | Radar + píldora «1.950.000 € · Contactar» | Igual |
| Tapa | 24 % activo · ~4 % en reposo | — |

### 2.2 Visor · móvil en horizontal (844×390)

Capturas: `visor-*-movil-h.png`, `maq/rec/radar-movil-h.png`.

| Zona | Actual | Ideal |
|---|---|---|
| Arriba izq. | Título (222×44) · sol (222×50) · radar (74) | Igual |
| Arriba centro | `#modos` (190×43) | Vacía (la ocupan el sello legal o la visita guiada si hacen falta) |
| Arriba dcha. | `#barra-vista` en fila (196×53) | Igual |
| Abajo izq. | Vacía | **`#modos`**, al alcance del pulgar izquierdo (MAQ-6) |
| Abajo dcha. | Tarjeta compacta (364×60): precio · Foto · Contactar | Igual (pulgar derecho) |
| «Más» | Columna de 9 opciones hacia abajo, encima de la tarjeta, cortada en «Ajustes» | Dos columnas de 5 filas, sin cortar ni tapar la tarjeta (MAQ-7) |
| Ficha y diálogos | Panel derecho de arriba abajo; el contacto, a dos columnas | Igual |
| Tapa | 20 % | 20 % |

### 2.3 Visor · tablet en vertical (768–1024 de ancho)

Capturas: `visor-*-tablet.png`.

| Zona | Actual | Ideal |
|---|---|---|
| Arriba izq. | Título (225×52) · sol · radar (121) | Igual |
| Arriba centro | Vacía | **`#modos`** (209×46) (MAQ-5) |
| Arriba dcha. | `#barra-vista` en fila (245×54), con pantalla completa | Igual |
| Abajo | Tres filas centradas: modos (209), tira con «Visita guiada» (584) y tarjeta (720, con nombres) | Dos filas: tira y tarjeta, centradas en el mismo eje y con el mismo ancho máximo (47,5 rem) |
| Diálogos | Hojas abajo, de 720 px como máximo | Igual (iPadOS usa hojas o popovers: las hojas valen) |
| Tapa | 17 % | ~16 % |

### 2.4 Visor · tablet en horizontal (1024–1366 de ancho, táctil)

Capturas: `visor-*-tablet-h.png`.

| Zona | Actual | Ideal (solo con `pointer: coarse`) |
|---|---|---|
| Arriba izq. | Título · sol · radar (136) | Igual |
| Arriba centro | `#modos` | Igual |
| Arriba dcha. | `#barra-vista` y, debajo, **la tarjeta** (356×230) con «Contactar» y las acciones | Solo `#barra-vista` |
| Abajo dcha. | Vacía | **La tarjeta anclada abajo**: acciones arriba y precio con «Contactar» abajo; la ficha crece hacia arriba (MAQ-4) |
| Abajo centro | Tira (446) | Tira centrada en el hueco libre (`--ancho-dock` ya existe; el árbol de trabajo ya la centra) |
| Diálogos | A la izquierda de la columna, alineados arriba | A la izquierda de la columna, alineados abajo |
| Tapa | 19 % | 19 % |

### 2.5 Visor · portátil y escritorio (1280–1440)

Capturas: `visor-*-escritorio.png` (en 1280 solo hay métricas, y la disposición es la misma).

| Zona | Actual | Ideal |
|---|---|---|
| Arriba izq. | Título · sol · radar (142) | Igual |
| Arriba centro | Modos | Igual |
| Arriba dcha. | Barra de vista (Radar · Juego · Música · Ayuda · Pantalla · Más) | Igual |
| Dcha. | Tarjeta inspector (370): tipo, precio, datos, «Ver ficha», [Contactar] [Foto], y Estilo · Visita guiada · Medir. La ficha se abre en la misma columna | Igual |
| Abajo centro | Tira agrupada por zonas (456) | Igual |
| Tapa | 15 % | — |

### 2.6 Visor · monitor grande (1920×1080 y más)

Capturas: `visor-*-escritorio-xl.png`.

Como el 2.5, escalado: tarjeta de 402, radar de 154 y tira de 480. Tapa el 11 %. Solo cambia la tira: miniaturas de 7 × 4,5 rem a partir de 1600 px (MAQ-14).

### 2.7 Estudio

Capturas: `estudio-*-{movil,movil-s,movil-h,tablet,tablet-h,escritorio,escritorio-xl}.png` y `maq/v2/estudio-*-portatil.png`.

| Dispositivo | Actual | Ideal |
|---|---|---|
| Teléfono, vertical (aviso) | Aviso a pantalla completa: logo, título y texto; botones centrados a media altura | Título arriba y botones abajo, en la zona del pulgar (MAQ-17) |
| Teléfono, vertical (tras «Seguir aquí») | Barra superior de 8 iconos y el nombre en 4 letras («Finc…»). Barra lateral de iconos de 66 px. Contenido de 290 px: textos palabra a palabra (MAQ-1) | Barra superior: nombre legible (MAQ-3). **Pasos abajo, como barra de pestañas** (Fotos · Plano · Datos · Publicar · Más) y contenido a todo el ancho (MAQ-2) |
| Teléfono, horizontal | Barra con textos, lateral con nombres y contenido de unos 750 px; Plano apilado (lo arregla el árbol de trabajo) | Igual, con el Plano a dos columnas (árbol de trabajo) |
| Tablet vertical (768–860) | Barra superior completa en iconos · lateral de iconos · trabajo · vista previa en cajón | Igual |
| Tablet horizontal (1024–1180) | Lateral de iconos · trabajo (630) · vista previa acoplada (415) · Plano en 4 columnas | Plano con la vista previa en cajón (MAQ-8); vista previa «Ordenador» legible (MAQ-10) |
| Portátil (1280) | **Lateral de iconos** (sin nombres ni resumen) · trabajo (~640) · vista previa (460) · Plano en 4 columnas | Lateral con nombres (MAQ-9) · Plano en cajón (MAQ-8) |
| Escritorio (1440) | Lateral con nombres (200) · trabajo (660) · vista previa (500) · Plano en 4 columnas | Plano en cajón hasta 1440 (MAQ-8) |
| Monitor (1920) | Lateral · trabajo (~950) · vista previa (684); sin fotos, vista previa vacía de 684 px | Sin fotos, sin columna de vista previa (MAQ-13) |

### 2.8 Guía Osmo 360

Capturas: `guia-*.png` y `maq/mont/guia-*.png`.

| Dispositivo | Actual | Ideal |
|---|---|---|
| Teléfono, vertical | Cabecera fija (marca + «?») · selector de paso con barra de progreso · contenido a todo el ancho · pie fijo (Anterior / Siguiente a medias) | Igual |
| Teléfono, horizontal | Igual. La cabecera fija (44) y el pie fijo (55) dejan unos 290 px de lectura | Cabecera que se desplaza con el contenido y pie más bajo (MAQ-16) |
| Tablet y escritorio | Columna de 46 rem centrada; «Abrir el Estudio» en la cabecera; pie alineado con la columna | Igual |

---

## 3. Hallazgos

| ID | P | Página · tamaño | Qué |
|---|---|---|---|
| MAQ-1 | P1 | Estudio · teléfono (360–430) | Textos partidos palabra a palabra y botón encima del texto |
| MAQ-2 | P2 | Estudio · teléfono | La barra lateral de 66 px se come el 17 % del ancho: pasos abajo como pestañas |
| MAQ-4 | P2 | Visor · tablet horizontal táctil | La tarjeta y «Contactar» arriba a la derecha, fuera del pulgar |
| MAQ-5 | P2 | Visor · tablet vertical | Tres filas abajo de anchos distintos; los modos pueden ir arriba |
| MAQ-6 | P2 | Visor · móvil horizontal | Modos arriba en el centro; la esquina del pulgar izquierdo, vacía |
| MAQ-7 | P2 | Visor · móvil horizontal | «Más» tapa la tarjeta y sale cortado |
| MAQ-8 | P2 | Estudio · Plano · 1101–1440 | Cuatro columnas: el lienzo se queda en 430–560 px |
| MAQ-9 | P2 | Estudio · portátil 1280 | La barra de pasos se queda en iconos de tablet |
| MAQ-10 | P2 | Estudio · vista previa «Ordenador» · 1024–1440 | Miniatura de 16:10 perdida en una columna alta (árbol de trabajo) |
| MAQ-11 | P2 | Visor · maqueta en el móvil | Casa descentrada, «Dormitorio» en el borde y rótulos duplicados (en curso) |
| MAQ-3 | P3 | Estudio · teléfono | El nombre del proyecto se ve en 4 letras |
| MAQ-12 | P3 | Visor · móvil vertical, ficha abierta | El sol y el radar siguen encima de la poca foto que queda |
| MAQ-13 | P3 | Estudio · ≥ 861 sin fotos | Columna de vista previa vacía |
| MAQ-14 | P3 | Visor · ≥ 1600 | Miniaturas de la tira pequeñas para un monitor |
| MAQ-15 | P3 | Estudio · todos | «Continuar» cambia de sitio según el paso y se pierde al final |
| MAQ-16 | P3 | Guía · teléfono horizontal | Cabecera y pie fijos dejan 290 px de lectura |
| MAQ-17 | P3 | Estudio · aviso del teléfono | Los botones a media pantalla, no en la zona del pulgar |

### MAQ-1 · P1 · Estudio en el teléfono: textos palabra a palabra y un botón encima del texto

- **Dónde:** Estudio tras «Seguir aquí de todos modos», de 360 a 430 px.
  - «Estilo y luz»: tarjeta «Vivienda construida: colores de paredes y suelo» y tarjeta «Luz · Terraza».
  - Orientación: «Estancia 1 de 4».
  - Publicar: los avisos de «Antes de publicar», en columnas de unos 100 px.
  - Ocurre igual en la tablet con la talla L en las columnas estrechas.
- **Captura:**
  - `v1/estudio-5-estilo-movil.png`: «Vivienda / const / colores / de / paredes / y / suelo», y «Subir foto de noche o atardecer» pintado encima de «atardecer, desde el».
  - `v1/estudio-5-estilo-movil-s.png`.
  - `v1/estudio-4-orientacion-movil-s.png`: «Estancia / 1 / de / 4».
  - `v1/estudio-7-publicar-movil.png`.
  - Montaje: `maq/mont/est-movil-1.png`.
- **Causa:**
  - `estudio.css`: `.estirar { flex: 1; min-width: 0; }`. Con base 0 % el bloque de texto «cabe» en la fila aunque mida 30 px, así que `.fila { flex-wrap: wrap }` nunca pasa el botón a otra línea.
  - `estudio.css`: `.tipo-vivienda .check { flex: none; }` fija el interruptor «Mostrar todo (estilos y colores)» a unos 260 px.
  - `.nodo-actual`, en `estudio-orientar.js` 98: miniatura fija de 7,5 rem más dos botones de 44 px.
  - Encima, la barra lateral de 66 px (MAQ-2).
- **Corrección (`estudio.css`):**
  ```css
  /* el texto pide 14 rem antes de compartir fila: si no caben, el botón o el interruptor pasan debajo */
  .fila > .estirar { flex: 1 1 14rem; }
  .tipo-vivienda .check { flex: 0 1 auto; }
  @media (max-width: 599.98px) {
    .nodo-actual img { width: clamp(3.5rem, 18vw, 7.5rem); height: auto; aspect-ratio: 2 / 1; }
    .nodo-actual .estirar { flex: 1 1 0; min-width: 5rem; }
  }
  ```
  Volver a pasar las 8 capturas del Estudio en `movil-s`. En escritorio no cambia nada: a esos anchos ya cabían 14 rem.

### MAQ-2 · P2 · Estudio en el teléfono: los pasos, abajo como barra de pestañas

- **Dónde:** Estudio por debajo de 600 px, en vertical.
- **Captura:** `v1/estudio-1-fotos-movil.png` y `maq/mont/est-movil-0.png`. La columna de 66 px se queda en 4 pasos, y el contenido en unos 290 px.
- **Causa:** `estudio.css`, `@media (max-width: 1280px) { :root { --ancho-pasos: 4.75rem } }`. La rejilla de `body.c8-base` mantiene la columna lateral en todos los anchos.
- **Corrección:** no añade nada: la misma barra cambia de sitio, como las pestañas de las apps de iOS.
  ```css
  @media (max-width: 599.98px) and (orientation: portrait) {
    body.c8-base, body.seccion-orientacion, body.vista-grande, body.seccion-plano {
      grid-template-columns: minmax(0, 1fr); grid-template-rows: var(--alto-barra) minmax(0, 1fr) auto;
      grid-template-areas: "sup" "trabajo" "pasos"; }
    #trabajo { grid-column: 1; grid-row: 1 / 3; }
    #pasos { grid-area: pasos; flex-direction: row; gap: 0; margin: 0; overflow-x: auto; border-radius: 0; border-width: 1px 0 0;
      padding: var(--e-1) var(--e-2) calc(var(--e-1) + env(safe-area-inset-bottom, 0px)); }
    #pasos button, #pasos .grupo-herramientas button.herramienta { flex: 1 0 4.25rem; }
    #pasos .grupo-herramientas { display: contents; }
    #pasos :is(.separador, .pie-pasos) { display: none; }
  }
  ```
  - Así el contenido gana 66 px (+23 %).
  - Con «Más herramientas» abierto, la barra se desplaza en horizontal.

### MAQ-3 · P3 · Estudio en el teléfono: el nombre del proyecto en 4 letras

- **Captura:** `v1/estudio-*-movil.png` («Finc… ⌄»).
- **Causa:** `estudio.css`, `@media (max-width: 47.4375em)`. Quedan 8 iconos en la barra, y `.nombre-proyecto` se lleva lo que sobra (unos 60 px).
- **Corrección:**
  - Por debajo de 600 px, `#btn-apariencia, #btn-ayuda { display: none; }`.
  - Sus dos entradas, «Apariencia y tamaño» y «Ayuda y atajos», pasan al menú «Proyecto ▾» (`estudio-proyecto.js`, donde se construye `.menu-proyecto`), solo en ese ancho.
  - Son los mismos controles en otro sitio. El nombre gana unos 88 px: «Finca señorial…».

### MAQ-4 · P2 · Visor en la tablet en horizontal táctil: la tarjeta y «Contactar», fuera del alcance de los pulgares

- **Dónde:** visor de 1024 a 1366 px de ancho en horizontal, con `pointer: coarse` (iPad, Galaxy Tab). Todos los estados con la tarjeta.
- **Captura:** `v1/visor-1-recorrido-tablet-h.png` y `maq/mont/visor-tablet-h-0.png`.
  - Medidas: `.pn-tarjeta` en 813,73 · 356×230, con «Contactar» hacia y = 190 de 820.
  - Las esquinas de abajo (y > 520), donde están los pulgares, están vacías.
- **Causa:**
  - `paneles.js`, `calcularDisposicion()`: todo lo que no es teléfono ni vertical es `lateral`, venga del ratón o del dedo.
  - `paneles.css`, `.pn-disp-lateral .pn-tarjeta { top: var(--pn-arriba) }`.
- **Corrección (`paneles.css`):**
  ```css
  /* Tablet en horizontal con el dedo: la columna inspector se apoya abajo, donde están los pulgares; «Contactar», en la última fila */
  @media (pointer: coarse) {
    .pn-disp-lateral .pn-tarjeta:not(.pn-abierto) { top: auto; bottom: calc(var(--pn-margen) + var(--pn-inf)); flex-direction: column-reverse; }
    .pn-disp-lateral .pn-tarjeta:not(.pn-abierto) .pn-t-acciones { border-top: 0; border-bottom: 1px solid var(--c-separador, rgba(255, 255, 255, 0.08)); }
    .pn-disp-lateral .pn-dialogo { top: auto; bottom: calc(var(--pn-margen) + var(--pn-inf)); }
  }
  ```
  - **Con la ficha abierta** (`.pn-abierto`) la columna ocupa de arriba abajo, como hoy.
  - **La tira de estancias:** `colocar()` ya publica `--ancho-dock` cuando la tarjeta baja de `innerHeight - 160`, así que la tira no queda debajo. Con el cambio del árbol de trabajo, además, se centra en el hueco libre.
  - **El diálogo de «Estilo y luz»:** en `colocarDialogo()` (`paneles.js` 778) se alinea con su botón por arriba. Con `pointer: coarse` hay que alinearlo por abajo: `bottom = innerHeight - r.bottom`.

### MAQ-5 · P2 · Visor en la tablet en vertical: los modos arriba y dos filas abajo del mismo ancho

- **Dónde:** visor en vertical de 740 a 1024 px (iPad mini, Air y Pro 11).
- **Captura:** `v1/visor-1-recorrido-tablet.png` y `maq/mont/visor-tablet-0.png`.
  - Abajo, de y = 949 a 1169, se apilan `#modos` (209), `#galeria` (584) y la tarjeta (720): tres anchos sin eje común.
  - Arriba, entre el título (acaba en x = 236) y la barra de vista (empieza en x = 564), quedan 328 px libres.
- **Causa:** `visor.css`. `@media (orientation: portrait) and (max-width: 1024px), …` baja los modos para todo lo que esté en vertical, también la tablet.
- **Corrección (`visor.css`, después de ese bloque):**
  ```css
  /* Tablet en vertical: los modos vuelven arriba al centro (caben entre el título y la barra de vista) y abajo quedan la tira
     y la tarjeta, centradas en el mismo eje. En em: con la letra del navegador al 200 % no entra y siguen abajo (A12). */
  @media (orientation: portrait) and (min-width: 46.25em) and (max-width: 1024px) {
    html:not([data-talla="l"]) #modos { top: var(--arriba); bottom: auto; left: 50%; right: auto; transform: translateX(-50%); width: max-content; }
    html:not([data-talla="l"]) :is(#subtitulo, #ficha) { bottom: calc(var(--abajo) + var(--alto-tira, 0px) + var(--e-3)); }
    html:not([data-talla="l"]) #estado-vista { top: var(--bajo-modos); }
    #galeria { max-width: min(47.5rem, calc(100vw - 2 * var(--hud))); }
  }
  ```
  - Las cuentas a 768 px con la talla M: 225 + 209 + 245 + 4 × 11 = 723 px. Con la L no caben, y por eso se excluye.
  - `#guion-barra` se queda abajo: es el control de la visita en curso.

### MAQ-6 · P2 · Visor en el móvil en horizontal: los modos, abajo a la izquierda

- **Dónde:** visor en horizontal con un alto de 540 px o menos (teléfonos de 667 a 932 de ancho).
- **Captura:** `v1/visor-1-recorrido-movil-h.png` y `maq/mont/visor-movil-h-0.png`. Medidas: modos en 327,11; tarjeta en 473,323; la franja de abajo a la izquierda (x 11–460, y 330–380) está libre.
- **Causa:** `visor.css`. Por el bloque de A12, el teléfono en horizontal deja `#modos` en `top: var(--arriba); left: 50%`.
- **Corrección (`visor.css`, dentro de `@media (max-height: 540px) and (orientation: landscape)`):**
  ```css
  /* Pulgar izquierdo: los modos; pulgar derecho: la tarjeta. Arriba al centro queda libre para el sello y la visita guiada. */
  #modos { top: auto; bottom: calc(var(--hud) + var(--seg-inf)); left: calc(var(--hud) + var(--seg-izq)); transform: none; }
  ```
  - A 667 px, los modos (11–201) no tocan la tarjeta (empieza en 272).
  - Mientras se mide, los modos ya se ocultan (`body.midiendo #modos`), así que no chocan con `#medir-barra`, que va abajo a la izquierda.

### MAQ-7 · P2 · Visor en el móvil en horizontal: «Más» tapa la tarjeta y sale cortado

- **Captura:** `v1/visor-2-menu-mas-movil-h.png` y `maq/mont/visor-movil-h-0.png`.
  - Nueve opciones en columna, desde y = 72: «Ajustes» queda medio fuera y hay que desplazar el menú.
  - `metricas.json`: «Foto de la vista» y «Contactar», tapados por «Ajustes».
- **Causa:** `visor.css`, `#menu-mas { display: grid; }` en una columna, y `colocarMas()` (`visor.js` 2546) le da un `maxHeight` de 310 px.
- **Corrección (`visor.css`):**
  ```css
  @media (max-height: 540px) and (orientation: landscape) {
    #menu-mas { grid-template-columns: repeat(2, minmax(11rem, 1fr)); }
  }
  ```
  Quedan cinco filas de 44 px (unos 230 px): cabe entero bajo la barra de vista y no baja hasta la tarjeta.

### MAQ-8 · P2 · Estudio, paso Plano de 1101 a 1440 px: cuatro columnas y el lienzo, estrecho

- **Dónde:** Estudio → Plano en la tablet en horizontal (1180), el portátil (1280) y el escritorio (1440).
- **Captura:**
  - `v1/estudio-2-plano-tablet-h.png`: pasos 71, lienzo 560, panel 215 y vista previa 290.
  - `maq/v2/estudio-2-plano-portatil.png`: lienzo de unos 430 px.
  - `v1/estudio-2-plano-escritorio.png`.
- **Causa:** `estudio.css`. La vista previa del paso Plano solo pasa a cajón con `@media (max-width: 1100px)` (`body.seccion-plano #vista { position: fixed … }`).
- **Corrección (`estudio.css`):**
  - Sacar de `@media (max-width: 1100px)` las reglas `body.seccion-plano …` y ponerlas en un bloque `@media (max-width: 1440px)`.
  - Cambiar la regla del vidrio sin desenfoque para que no se aplique al cajón:
    - `@media (min-width: 1101px) { #vista { … } }` → `@media (min-width: 1441px) { #vista { … } }`;
    - y añadir `@media (min-width: 861px) and (max-width: 1440px) { body:not(.seccion-plano) #vista { background: var(--vidrio-ambiente); -webkit-backdrop-filter: none; backdrop-filter: none; } }`.
  - Resultado: el lienzo pasa a unos 880 px a 1180 y a unos 1000 a 1440. La vista previa sigue a un toque, con «Vista previa» en la barra.

### MAQ-9 · P2 · Estudio en el portátil de 1280: la barra de pasos, en iconos de tablet

- **Captura:** `maq/v2/estudio-1-fotos-portatil.png` y `maq/mont/est-portatil.png`. La barra de pasos queda sin nombres ni resúmenes («4 fotos», «2 por corregir») en el ordenador más común.
- **Causa:** `estudio.css`, `@media (max-width: 1280px) { :root { --ancho-pasos: 4.75rem } … }`. El 1280 incluye el portátil.
- **Corrección:** `@media (max-width: 1279.98px)`.
  - Cuentas a 1280 (raíz 15 px): pasos 202 + vista previa 461 + huecos 24 → trabajo de unos 590 px.
  - Es lo mismo que la tablet en horizontal, y con MAQ-8 el Plano ya no comparte ese ancho.

### MAQ-10 · P2 · Estudio: la vista previa «Ordenador», una miniatura perdida en una columna alta (árbol de trabajo)

- **Dónde:** Estudio de 1024 a 1440, en todos los pasos con vista previa acoplada. Es un cambio sin confirmar del árbol de trabajo: el visor se dibuja en una pantalla virtual de 1280×800, escalada con `--vista-k`.
- **Captura:**
  - `maq/v2/estudio-1-fotos-portatil.png`, `-5-estilo-portatil.png` y `maq/mont/est-portatil.png`: una imagen de 16:10 de unos 440 × 275 px con unos 250 px vacíos encima y debajo. La tarjeta y el HUD no se leen.
  - Antes, en `v1/estudio-*-tablet-h.png` con «Ordenador» marcado, salía la disposición del teléfono (lo que corrige ese cambio).
- **Causa:** la columna `#vista` es alta y estrecha (`--ancho-vista: clamp(22rem, 36vw, 40rem)`), y una pantalla de ordenador no cabe en ella.
- **Corrección:**
  - En `fijarDispositivo()` (`estudio.js` 365), al elegir «Ordenador» con la vista previa acoplada y `#vista` de menos de 34 rem de ancho, poner también `body.vista-grande`. Esa regla ya existe y da a la vista 1,6 fr: la miniatura pasa a unos 680 px de ancho.
  - Y en `estudio.css`: `body:not(.vista-movil) .vista-marco { flex: none; aspect-ratio: 16 / 10; }` mientras la vista está acoplada. El sobrante queda para `.vista-pie`, sin franjas vacías.

### MAQ-11 · P2 · Visor, maqueta en el móvil: casa descentrada y rótulos duplicados (en curso)

- **Captura:** `v1/visor-7-maqueta-movil.png` y `-movil-s.png`.
  - La casa está a la izquierda y «Dormitorio 31 m²» toca el borde (x ≈ 0).
  - Cada estancia tiene un pin («○ Terraza») y, debajo, otro rótulo («Terraza 204 m²») que se pisan (`metricas`: solape de `.maq-estancia` con `.maq-pin`).
  - Los pines miden 26 px de alto en táctil.
- **Causa (en `6a649d2`):**
  - `maqueta.js`, `encuadrar()`, no descuenta lo que tapan la columna izquierda (213 px) ni la parte de abajo (130).
  - El rótulo de vidrio solo se omitía cuando la superficie llevaba foto.
- **Estado:** el árbol de trabajo ya trae `hueco()` con `setViewOffset`, el m² dentro del pin y el área táctil del pin ampliada.
- **Qué falta:**
  - Volver a capturar `7-maqueta` en 390, 360 y 844×390, y comprobar que `ctx.margenes()` recibe el pie de `#esquina` y `--reserva-inferior` + `#modos`.
  - En `visor.css`, que `.maq-pin` mida 44 px en táctil: `@media (pointer: coarse) { .maq-pin { min-height: 2.25rem; } }`, más el `::after` ya ampliado.

### MAQ-12 · P3 · Visor en el móvil en vertical: con la ficha abierta, el sol y el radar se quedan encima

- **Captura:** `v1/visor-4-ficha-movil.png`. La hoja ocupa desde y = 437; arriba siguen el título, el sol y el radar (hasta y = 213). Quedan unos 220 px de foto.
- **Corrección (`visor.css`):**
  ```css
  body:has(#paneles .pn-disp-hoja.pn-ficha-abierta) :is(#sol, #radar) { opacity: 0; pointer-events: none; }
  ```
  - Es lo mismo que ya hace el reposo (`body.ui-inactiva`).
  - El título se queda, para que se sepa dónde se está.
  - El sol vuelve al cerrar la ficha: no se quita el control (decisión del cliente).

### MAQ-13 · P3 · Estudio sin fotos: una columna de vista previa vacía

- **Captura:** `v1/estudio-0-inicio-escritorio.png` y `-escritorio-xl.png`. Un panel de 500–684 px con «Añade fotos 360 para ver aquí el recorrido».
- **Corrección (`estudio.css`):**
  ```css
  @media (min-width: 861px) {
    body.c8-base:has(#vista.sin-fotos) { grid-template-columns: var(--ancho-pasos) minmax(0, 1fr); grid-template-areas: "sup sup" "pasos trabajo"; }
    body:has(#vista.sin-fotos) #vista { display: none; }
    body:has(#vista.sin-fotos) .seccion { margin-inline: auto; }
  }
  ```
  El primer paso queda centrado, con un solo botón principal, «Elegir fotos».

### MAQ-14 · P3 · Visor en un monitor: miniaturas de la tira pequeñas

- **Captura:** `v1/visor-1-recorrido-escritorio-xl.png`. Miniaturas de 98 × 64 px en 1920.
- **Corrección (`visor.css`):**
  ```css
  @media (min-width: 1600px) and (pointer: fine) { #galeria .estancia { width: 7rem; height: 4.5rem; } }
  ```
  `medirTira()` ya publica el nuevo alto.

### MAQ-15 · P3 · Estudio: «Continuar» cambia de sitio según el paso

- **Captura:**
  - `v1/estudio-2-plano-tablet.png`: «Continuar → Datos» arriba a la derecha.
  - `v1/estudio-1-fotos-tablet.png`: «Continuar → Plano» al final de la lista.
  - Con 12 fotos o en Datos, el botón queda fuera de la vista.
- **Corrección (`estudio.css`):**
  ```css
  .pie-paso { position: sticky; bottom: var(--e-3); z-index: 1; pointer-events: none; }
  .pie-paso > * { pointer-events: auto; }
  ```
  - El botón principal es champán macizo (lo permite el contrato: es la acción principal). Flota abajo a la derecha del área de trabajo en todos los pasos.
  - En Plano, que es `.seccion.completa`, se queda en su barra.

### MAQ-16 · P3 · Guía en el teléfono en horizontal: 290 px de lectura

- **Captura:** `v1/guia-0-inicio-movil-h.png` y `maq/mont/guia-ini-y.png`.
- **Causa:** en `asistente-osmo.html`, `.cabecera { position: sticky }` y `.pie { position: fixed }`, con el mismo relleno en todos los altos.
- **Corrección (`<style>` de la Guía):**
  ```css
  @media (orientation: landscape) and (max-height: 499.98px) {
    .cabecera { position: static; }
    .pie { padding-block: var(--e-1) calc(var(--e-1) + env(safe-area-inset-bottom, 0px)); }
  }
  ```
  - Los botones siguen en 44 px.
  - Se gana la cabecera: unos 44 px, el 15 % del alto.

### MAQ-17 · P3 · Estudio, aviso del teléfono: los botones a media pantalla

- **Captura:** `v1/estudio-0-inicio-movil.png` y `-movil-s.png`.
- **Corrección (`estudio.css`):**
  ```css
  .aviso-movil-contenido { justify-content: flex-start; }
  .aviso-movil-contenido > .c8-boton--primario { margin-top: auto; }
  ```
  - Logo, título y texto arriba; «Enviarme el enlace», «Abrir la Guía» y «Seguir aquí» abajo, en la zona del pulgar, como las hojas de bienvenida de iOS.
  - En el teléfono en horizontal, el contenido sigue desplazándose como hoy.

---

## 4. Lo que está bien y no hay que tocar

- **Visor, columna de consulta arriba a la izquierda** (título, sol y radar): el mismo sitio y el mismo orden en los seis tipos de pantalla, alineada en x = 11–13. Respeta el radar de Counter-Strike y el sol como único control de luz.
- **Barra de vista:** en columna en el teléfono en vertical y en fila en el resto, con «Más» siempre al final.
- **Tarjeta del inmueble:** una sola pieza con tres formas (hoja, píldora compacta e inspector). En reposo se queda en «precio · Contactar». En el móvil la ficha sale de la propia tarjeta.
- **Diálogos del teléfono:** hojas abajo, separadas de los bordes, con «Estilo y luz» limitado al 40 % del alto para ver la escena.
- **Portada:** tarjeta centrada en todos los tamaños. En horizontal se compacta sin perder «Empezar visita».
- **Estudio en la tablet en vertical:** el mejor reparto (lateral de iconos, trabajo a todo el ancho y vista previa en cajón).
- **Guía:** columna de 46 rem, pie con la navegación al alcance del pulgar y selector de paso arriba.

## 5. Coincidencias y límites con los otros dos informes

- **Puntos de corte:** visor.css usa 540 px, paneles.js 500/720/1024, `cre8Tema.MQ` 500/600/1100 y estudio.css 759/860/1100/1280 (el árbol de trabajo ya unifica algunos en 599,98/499,98). Es materia de ingeniería (A); aquí solo se usan para colocar.
- **Objetivos táctiles y letra:** son de UX/UI (C). Solo se citan cuando cambian la colocación (pines de la maqueta, MAQ-11).
