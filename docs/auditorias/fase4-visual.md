# cre8eight · Auditoría visual y de interfaz (UI) de la fase 4

Auditor: visual/UI (A). Encargo: `docs/auditorias/fase4-encargos-auditoria.md` § A. Rama `ccr-40d07831-qbgzrt`, 15/10/2026.
El código revisado es el de `c021fa0`; después solo ha cambiado el README (`2c5065e`).
Skills cargadas: `design:design-critique` y `design:design-system`.

## Resumen y veredicto

- **El visor cumple el «glass UI» en claro y en oscuro.**
  - Todo lo que flota sobre la foto es vidrio, con desenfoque, canto especular y sombra.
  - Se lee sobre fotos de día y de noche.
  - La portada, la tarjeta y los diálogos tienen una jerarquía de producto premium.
  - Las 210 capturas de la matriz no tienen errores de consola.
  - Las 244 capturas de estados del visor, el Estudio y la Guía no tienen desbordes horizontales (comprobado en el DOM).
- **Fuera del visor el vidrio apenas se nota.** La Guía no tiene fondo de ambiente, y el Estudio se ve como tarjetas blancas en claro y grises en oscuro (V2, V3). Es lo que más se aleja de lo que pidió el cliente.
- **En el teléfono, los textos pequeños se quedan en 9,6–10,5 px con la talla M y bajan a 8,4 px con la S** (V1).
- **Cortes y desbordes:**
  - la maqueta sale cortada en vertical (V4);
  - «Contemporáneo» no cabe en su ficha de «Estilo y luz» (V5);
  - la barra superior del Estudio toca los bordes en el iPad (V6).
- **Casi no queda estilo antiguo.** Solo la marca de la pantalla de error, los glifos de texto de la Guía y las letras del plano y del vídeo exportados (V10, V11, V18).
- **Veredicto: se puede entregar, porque no hay ningún P1.** Antes de enseñárselo al cliente conviene aplicar las 7 P2, que son cambios pequeños de CSS y JS. Las P3 son pulido.

**Recuento: P1 0 · P2 7 · P3 11.** El «Ampliar» del radar coincide con A3 de accesibilidad y no se cuenta aquí (ver «Coincidencias»).

## Cómo se ha revisado

**Carpeta de trabajo:** `/tmp/claude-0/-home-user-creatorflow-ai/9aa10f93-9bbe-52c5-91f2-e21dabbb4196/scratchpad/auditoria-f4/visual/`. Los nombres de archivo de abajo son relativos a esa carpeta.

| Qué | Dónde | Capturas |
|---|---|---|
| Matriz con `pruebas/capturas.mjs`: 4 páginas × claro y oscuro × M × 11 tamaños, más la portada | `matriz/` (con `indice.html`) | 110, sin errores |
| Tallas S y L en 360×640, 390×844, 1280×800, 1920×1080 y 3840×2160 | `matriz-sl/` | 100, sin errores |
| Visor a 390×844 y 1440×900 en claro y en oscuro (`estados-visor.mjs`): portada, reposo, «Más», Ajustes, ficha, galería y visor de fotos, contacto con foto y WhatsApp, «Estancias y plano», radar, «Estilo y luz», compartir con QR, ayuda, visita guiada, medir, comparador, maqueta, día y noche, y error | `visor/` | 124 |
| Estudio a 1440×900 y 390×844 en los dos temas (`estados-estudio.mjs`): los 4 pasos, «Más herramientas», «Mi inmobiliaria», Apariencia, «Proyecto ▾», ayuda, dossier y aviso del móvil | `estudio/` | 80 |
| Guía a 1440×900 y 390×844 en los dos temas (`estados-guia.mjs`): pasos 1, 3, 4 y 6, problemas, menú de pasos y «Enviar al ordenador» | `guia/` | 40 |
| Paseo libre, «Reducir transparencia», sin WebGL, iPad (visor y Estudio) y editor de máscara | `extra/` | 15 |
| Comprobaciones en el DOM (`verificar.mjs`, `verificar2.mjs`) | `verificar.log`, `verificar2.log`, `verif/` | — |
| Recortes ampliados | `recortes/` | — |

Las animaciones a medias no se cuentan como hallazgo. Lo que podía parecerlo, como los iconos de la barra a 4K con la talla L, se repitió con más espera y estaba bien (`verif/visor_3840x2160_l.png`).

## Hallazgos

| ID | P | Pantalla | Qué |
|---|---|---|---|
| V1 | P2 | Visor, Estudio y Guía en el teléfono | Textos de 9,6–10,5 px (M) y 8,4–9,2 px (S) |
| V2 | P2 | Estudio | El vidrio se lee como tarjeta blanca (claro) o gris (oscuro) |
| V3 | P2 | Guía | Sin fondo de ambiente: las barras de vidrio parecen barras planas |
| V4 | P2 | Visor · maqueta en vertical | La casa sale cortada |
| V5 | P2 | Visor · «Estilo y luz» en escritorio | «Contemporáneo» no cabe en su ficha |
| V6 | P2 | Estudio en iPad y móvil | La barra superior toca los bordes de la pantalla |
| V7 | P2 | Estudio | Iconos de tamaño fijo que no siguen la talla ni la pantalla |
| V8 | P3 | Visor · HUD en claro | La barra de vista usa otro material que el título y los modos |
| V9 | P3 | Visor · comparador | La línea pasa por encima de los modos y de la tira |
| V10 | P3 | Visor y Guía | El mismo gesto con dos iconos; la Guía usa glifos de texto |
| V11 | P3 | Pantalla de error y Guía | La marca «cre8eight» se escribe de dos maneras |
| V12 | P3 | Visor · «Foto de la vista» | La foto lleva las flechas del suelo y el nombre tapa la franja |
| V13 | P3 | Visor · galería de renders | Con 4 imágenes, una se queda huérfana |
| V14 | P3 | Visor · plano, maqueta y título | m² con dos decimales; los enlaces tachan los rótulos |
| V15 | P3 | Guía en escritorio | Cabecera y pie desalineados 16 px con el contenido |
| V16 | P3 | Estudio en ultrapanorámico y 4K | La columna de trabajo queda pegada a la izquierda |
| V17 | P3 | Estudio · Datos | Los ejemplos («349.000») parecen valores ya escritos |
| V18 | P3 | Plano y vídeo exportados | Letras Helvetica/Arial o del sistema en vez de la del producto |

### V1 · P2 · En el teléfono los textos pequeños bajan de 11 px

- **Dónde:** visor, ficha, Ajustes, Estudio y Guía a 360 y 390 px de ancho. Claro y oscuro. Tallas S y M.
- **Captura:** `recortes/tallas_360_claro.png` (S, M y L a 360×640), `visor/390x844_claro_m_ficha-fin.png` y `visor/390x844_oscuro_m_ajustes.png`.
- **Medida:** `verificar.log` y `visor/registro.jsonl`. La raíz es de 14 px en el teléfono con M, y de 12,25 px con S.

  | Talla | Textos visibles | Ejemplos |
  |---|---|---|
  | M | 9,6 px (`--t-micro`) y 10,5 px (`--t-pie`) | «2 hab. · 92 m²», «Salón · 30,00 m²», «DATOS CLAVE», «IDIOMA», «Texto y botones», «Creado con cre8eight» |
  | S | 8,4 px y 9,2 px | Los mismos |
  | L | 11,4 px | — |

- **Qué pasa y por qué importa:**
  - Los tokens de 11 y 12 px del sistema se multiplican por 14/16 en el móvil y por 0,875 con la talla S.
  - En el dispositivo principal del comprador, los datos de la tarjeta y los títulos de sección quedan por debajo de los 11 pt que Apple usa como mínimo.
  - Con S, la Guía y la tarjeta se leen mal en la calle.
- **Propuesta:**
  - En `tema.css`, poner un suelo a los tamaños pequeños: `--t-micro: max(0.6875rem, 11px); --t-pie: max(0.75rem, 11px);` y, si hace falta, `--t-sec: max(0.8125rem, 12px)`. Se respeta igual la letra del navegador, porque manda el `rem` si es mayor.
  - Después, volver a pasar la matriz. La fila de la tarjeta ya pasa a dos líneas si no cabe.

### V2 · P2 · Estudio: el vidrio se lee como tarjeta (blanca en claro, gris en oscuro)

- **Dónde:** Estudio, en todos los pasos (barra lateral, tarjetas y vista previa acoplada). 1024 px y más. Claro y oscuro. Todas las tallas.
- **Captura:** `recortes/estudio_tarjetas_claro_oscuro.png`, `estudio/1440x900_claro_m_fotos-vacio.png` y `estudio/1440x900_oscuro_m_datos.png`.
- **Medida:** píxeles de `matriz/estudio-html_*_m_1440x900.png`.

  | Tema | Paneles | Ambiente alrededor |
  |---|---|---|
  | Claro | (253, 253, 253) | de (221, 221, 220) a (242, 240, 237) |
  | Oscuro | de (18, 19, 23) a (18, 20, 23) | de (9, 10, 12) a (14, 14, 13) |

- **Qué pasa:** se suman tres cosas.
  - `#pasos`, `#vista` y las tarjetas usan `--vidrio-texto` (0,78), pensado para el peor caso de una foto.
  - Sobre el ambiente se quitó el desenfoque a propósito, por rendimiento: `estudio.css`, línea 131.
  - El ambiente (`--ambiente`) es muy tenue.
- **Por qué importa:**
  - El panel no toma el color de lo que tiene detrás.
  - En claro son tarjetas blancas con sombra; el contrato §1.0 pide justo lo contrario («no tarjetas blancas planas»).
  - El cliente pidió el aspecto glass en todo.
  - Las barras, los menús y los diálogos sí son vidrio de verdad (`estudio/1440x900_claro_m_perfil.png`).
- **Propuesta (sin volver a poner el desenfoque):**
  - Un token `--vidrio-ambiente` en `tema.css`: `rgba(255,255,255,.55)` en claro y `rgba(20,22,26,.55)` en oscuro. Se usa en `#pasos`, en `#vista` acoplada y en las tarjetas de `#trabajo` que no van sobre foto ni lienzo.
  - El contraste se calcula contra el ambiente, que es conocido: el texto queda por encima de 7:1. Añadir el par a `pruebas/contraste.mjs`.
  - En claro, dar más presencia a las manchas de `--ambiente`: acento del 24 al 34 % e info del 16 al 24 %. Así el canto especular y el tinte se notan.

### V3 · P2 · Guía Osmo 360 sin fondo de ambiente

- **Dónde:** Guía, todos los pasos. 390×844 y 1440×900. Claro y oscuro. Todas las tallas.
- **Captura:** `guia/1440x900_claro_m_paso1.png`, `guia/1440x900_oscuro_m_paso1-lista.png` y `matriz/asistente-osmo-html_*`.
- **Medida:** `verificar.log` → `guía fondo: {"guia":"none","color":"rgb(245, 245, 247)"}`. El Estudio sí tiene el degradado de ambiente.
- **Qué pasa:**
  - La cabecera y el pie son `.c8-vidrio--barra` sobre `--c-fondo` liso.
  - Se ven como una barra blanca (claro) o negra (oscuro) de página web normal.
  - Las listas son rellenos grises sobre el mismo fondo plano.
- **Por qué importa:**
  - El contrato §1.0 dice: «Estudio y Guía: barras y menús de vidrio sobre un fondo de ambiente».
  - La Guía es lo primero que ve el fotógrafo y hoy parece de otra aplicación distinta al Estudio.
- **Propuesta:**
  - Mover `--ambiente` de `estudio.css` a `tema.css` como token común.
  - En el `<style>` de `asistente-osmo.html`: `body { background: var(--ambiente) fixed, var(--c-fondo); }`.
  - La cabecera ya tiene desenfoque: tomará el tinte y desenfocará el contenido al desplazarse.
  - El mismo fondo serviría para la pantalla de error del visor y para la de sin WebGL.

### V4 · P2 · Maqueta: en el móvil en vertical la casa sale cortada

- **Dónde:** visor, modo «Maqueta». 390×844 (y cualquier vertical). Claro y oscuro. M.
- **Captura:** `recortes/maqueta_390_vs_1440.png` (a la izquierda, 390; a la derecha, 1440) y `visor/390x844_claro_m_maqueta.png`.
- **Qué pasa:**
  - A 390 solo se ven el salón y el baño. La cocina y el recibidor quedan fuera, y el dormitorio sale cortado («Dorm…», «Dormitorio 16,…»).
  - Debajo queda un gran hueco gris.
  - A 1440 la casa se ve entera.
- **Por qué importa:** la maqueta es la vista de conjunto, y en el teléfono, que es donde más se usa, la primera imagen está mal encuadrada.
- **Causa:** `maqueta.js`, `encuadrar()`, coloca la cámara a una distancia fija según el tamaño de la casa y no tiene en cuenta la proporción de la pantalla. `redimensionar()` solo cambia `aspect`.
- **Propuesta:**
  - En `encuadrar()`, calcular la distancia con la esfera que envuelve la casa, el FOV vertical y el horizontal (`2·atan(tan(fov/2)·aspect)`), y usar el menor.
  - Llamar a `encuadrar()` desde `redimensionar()` mientras el visitante no haya movido la maqueta.
  - Opcional: descontar la hoja de abajo (`--reserva-inferior`) con `camara.setViewOffset`.

### V5 · P2 · «Estilo y luz»: «Contemporáneo» no cabe en su ficha

- **Dónde:** visor, diálogo «Estilo y luz» en escritorio y tablet en horizontal, de 1024 a 1440 px. Claro y oscuro. M y L. En el teléfono no pasa, porque la fila se desliza.
- **Captura:** `recortes/estilo_tiles.png` (visor real, 1440 oscuro M) y `verif/estilo_1440x900_l_claro.png`.
- **Medida:** `verificar.log`. El texto mide de 87 a 109 px en fichas de 90 a 114 px. Sobresale 1 px por la derecha y la muestra de color pierde el margen derecho.
- **Qué pasa y por qué importa:**
  - El texto y la tira de colores tocan el borde de la ficha. Se nota mucho en un diálogo pensado para vender estilos.
  - En inglés «Mediterranean» y en alemán «Zeitgenössisch» desbordan más.
- **Propuesta (`paneles.css`):**
  - Dar a «Estilo y luz» el ancho de Ajustes en escritorio: `.pn-disp-lateral .pn-dialogo-estilo { width: min(24rem, calc(100vw - var(--pn-columna, 25rem) - 2 * var(--pn-margen))); }`.
  - Como red, para otros idiomas: `.pn-estilo { min-width: 0; } .pn-estilo-nombre { overflow-wrap: anywhere; hyphens: auto; }`.

### V6 · P2 · Estudio en iPad y móvil: la barra superior toca los bordes

- **Dónde:** Estudio, barra superior. 820×1180 (iPad en vertical) y 390×844 tras «Seguir aquí». Claro y oscuro. M y L.
- **Captura:** `recortes/estudio_claro_820_izq.png` (el «c8» pegado a la izquierda), `recortes/estudio_claro_820_der.png` («Publicar» pegado a la derecha), `extra/estudio_820x1180_oscuro_fotos.png` y `estudio/390x844_claro_m_fotos.png`.
- **Medida:** `verificar.log` da 0 px de margen a cada lado a 820. Es de 11 px a 1024 y de 13 px a 1280.
- **Qué pasa:** en `estudio.css`, `@media (max-width: 860px) { #barra-sup { gap: var(--e-1); padding: 0; } }`. El logo y el botón principal tocan el borde de la pantalla.
- **Por qué importa:** el iPad es uno de los dos dispositivos que el Estudio recomienda, y el botón principal parece cortado.
- **Propuesta:**
  - `padding: 0 var(--e-2)` en ese `@media`.
  - Para recuperar el sitio, dejar «Vista previa» y «Guía» solo con icono por debajo de 860 px, igual que ya se hace con «Vista previa» por debajo de 600.

### V7 · P2 · Estudio: los iconos no siguen la talla ni el tamaño de pantalla

- **Dónde:** Estudio: barra superior, pasos, botones y menús. Se nota en 2560, 3440 y 3840 y con las tallas S y L. Claro y oscuro.
- **Captura:** `recortes/estudio_claro_4k_barra_der.png` y `matriz/estudio-html_oscuro_m_3440x1440.png`.
- **Medida (`verificar.log`):** a 3840×2160 con M, el texto de «Publicar» mide 21 px y su icono 16 px (los de la barra, 18 px). En el visor, el icono equivalente mide 30 px (`--icono` = 1,25 rem).
- **Qué pasa:**
  - `icono(n, tam)` (`estudio-nucleo.js`, línea 670) pone `width` y `height` en px.
  - Con 4K o con L los iconos quedan diminutos junto al texto; con S, más grandes que el texto.
- **Por qué importa:** el cliente pidió tres tallas «de botones, iconos y textos». En el visor ya se cumple; en el Estudio no.
- **Propuesta:** en `icono()`, `s.style.width = s.style.height = \`${tam / 16}rem\`` en lugar de los atributos. Las reglas que ya fijan tamaño (`.vacio-grande > .ico`, `#pasos .ico-paso .ico`) siguen mandando.

### V8 · P3 · HUD en claro: la barra de vista usa otro material que el título y los modos

- **Dónde:** visor, barra superior. 390 y 1440. Claro; en oscuro se nota menos. M.
- **Captura:** `visor/1440x900_claro_m_visor.png` y `visor/1440x900_claro_m_mas.png`.
- **Medida (píxeles):** `#lugar` (220, 215, 209) y `#modos` (221, 216, 209) frente a `#barra-vista` (174, 162, 148), en la misma franja. En oscuro: 47 frente a 62.
- **Qué pasa:**
  - `#barra-vista` es `.c8-vidrio` (`--vidrio`, 0,5).
  - `#lugar` y `#modos` llevan texto y usan `--vidrio-texto` (0,78).
  - En claro, la barra se ve gris parduzca junto a dos pastillas blancas.
- **Propuesta:** un solo material para las tres piezas de arriba, con `#barra-vista { background: var(--vidrio-texto); }` en `visor.css`. De paso, los iconos ganan contraste.

### V9 · P3 · El comparador «Antes y después» pasa por encima del HUD

- **Dónde:** visor, comparador activo. 390 y 1440. Claro y oscuro.
- **Captura:** `recortes/comparar_arriba_1440.png` (cruza «Paseo libre») y `recortes/comparar_abajo_1440.png` (cruza la miniatura «Dormitorio»). Salen de `visor/1440x900_oscuro_m_comparar.png`.
- **Qué pasa:** `#cortinilla` tiene `z-index: calc(var(--z-hud) + 3)`. La línea blanca se dibuja encima de los modos y de la tira de estancias.
- **Propuesta:** `#cortinilla { z-index: calc(var(--z-hud) - 1); }` en `visor.css`. Queda bajo el HUD y por encima de las etiquetas 3D. El tirador está en el centro y no lo tapa nada.

### V10 · P3 · Iconos: el mismo gesto con dos dibujos, y glifos de texto en la Guía

- **Dónde:** visor, menú «Más» frente a sus diálogos (todas las pantallas y temas), y cabecera y menú de pasos de la Guía.
- **Captura:** `recortes/iconos_mas_vs_dialogo.png`, `guia/1440x900_claro_m_paso1.png` y `guia/390x844_claro_m_menu-pasos.png`.
- **Qué pasa:**

  | Gesto | En «Más» (núcleo, `visor.js` 1783) | En el diálogo (paneles, `paneles.js` 37–39) |
  |---|---|---|
  | Compartir | Caja con flecha | Tres nodos |
  | Ajustes | Dos deslizadores | Tres deslizadores |

  En la Guía, la ayuda es un «?» de texto suelto y el cierre del menú de pasos es «✕» de texto, no el SVG de la ayuda y del cierre del visor y del Estudio.
- **Propuesta:**
  - Un solo dibujo por gesto: que `paneles.js` use para `compartir` y `ajustes` los trazos del núcleo, o al revés.
  - En `asistente-osmo.html`, cambiar «?» y «✕» por `<svg class="c8-icono">` con el círculo de la ayuda y la X del resto.

### V11 · P3 · La marca «cre8eight» se escribe de dos maneras

- **Dónde:** pantalla de error del visor (todas las pantallas y temas) y cabecera de la Guía.
- **Captura:** `visor/390x844_claro_m_error.png` frente a `guia/390x844_claro_m_paso1.png` y `estudio/1440x900_claro_m_fotos.png`.
- **Qué pasa:**
  - El error pinta «cre8» en el color del texto y «eight» en champán (`visor.js`, línea 2626).
  - El Estudio, la Guía y la muestra pintan «cre**8**eight», con solo el 8 en champán.
  - Además, la Guía no lleva el cuadrado «c8» del Estudio.
- **Propuesta:**
  - `cre<span>8</span>eight` en el `innerHTML` de `#error-carga`. `.marca-cre8 span` ya usa `--c-acento-texto`.
  - Pasar `.logo-e` a `tema.css` y ponerlo también en la cabecera de la Guía.

### V12 · P3 · «Foto de la vista»: lleva las flechas del suelo y el nombre tapa la franja

- **Dónde:** visor, diálogo de contacto (miniatura de la foto adjunta) y pantalla «Pega la foto y envía». Todas las pantallas y temas.
- **Captura:** `recortes/contacto_miniatura_claro.png` (de `visor/1440x900_claro_m_contacto.png`) y `visor/1440x900_oscuro_m_whatsapp.png`.
- **Qué pasa:**
  - `visor.capturar()` pinta la escena con `grupoFlechas` visible: la foto que recibe la agencia lleva los aros de navegación.
  - En la miniatura, la etiqueta «Salón» (`.pn-tira-et`, abajo) se monta sobre la franja de marca que la captura graba también abajo.
- **Propuesta:**
  - En `capturar()` (`visor.js`, línea 2454), ocultar `grupoFlechas` mientras se pinta la captura y restaurarlo después con `tocarEscena()`.
  - En `paneles.css`, subir `.pn-tira-et` a la parte de arriba de la miniatura, con el degradado invertido.

### V13 · P3 · Galería de renders: con 4 imágenes, una se queda huérfana

- **Dónde:** visor, ficha → «Renders y planos». Escritorio. Claro y oscuro. Con 4 imágenes, como en un tour real de arquitecto.
- **Captura:** `visor/1440x900_claro_m_galeria.png` («Terraza» sola en la segunda fila).
- **Qué pasa:** la rejilla es de 3 columnas y la variante destacada solo se aplica con 3, 6 o 9 imágenes (`paneles.js`, línea 1726).
- **Propuesta:** que la huérfana ocupe la fila entera (`paneles.css`):
  `.pn-galeria li:last-child:nth-child(3n + 1) { grid-column: 1 / -1; }`
  `.pn-galeria li:last-child:nth-child(3n + 1) .pn-gal-btn { aspect-ratio: 3 / 1; }`

### V14 · P3 · Superficies con dos decimales y enlaces que tachan los rótulos del plano

- **Dónde:** visor: «Estancias y plano», radar, maqueta y título de `#lugar`. Todas las pantallas y temas.
- **Captura:** `visor/390x844_claro_m_estancias.png`, `visor/390x844_claro_m_maqueta.png` y `visor/1440x900_claro_m_visor.png`.
- **Qué pasa:**
  - El plano, la maqueta y el título dicen «30,00 m²» con `metros()`, que da 2 decimales.
  - La lista del mismo diálogo dice «30 m²» (`m2Corto`).
  - En el plano, las líneas de los enlaces se dibujan después de los rótulos, así que cruzan «9,00 m²» (Recibidor) y «16,00 m²» (Dormitorio). Los rótulos ya tienen halo (`plano.js`, línea 188), pero no sirve porque la línea va encima.
- **Propuesta:**
  - Un formato de superficie sin decimales para las áreas en `visor.js` 616, `plano.js` 201 y `maqueta.js` 94. `metros()` con 2 decimales queda solo para las medidas.
  - En `plano.js`, pintar primero los enlaces, después los rótulos y al final los puntos de las fotos.

### V15 · P3 · Guía: cabecera y pie desalineados con el contenido

- **Dónde:** Guía, de 760 px en adelante (aquí 1440×900). Claro y oscuro.
- **Captura:** `guia/1440x900_claro_m_paso1.png`. La marca y «← Anterior» empiezan en x = 358; el selector de paso y el texto, en x = 374.
- **Qué pasa:** `.cabecera` y `.pie .dentro` alinean con el borde de la columna de 46 rem, pero el texto lleva además el relleno de `.marco` (`--e-4`).
- **Propuesta (`asistente-osmo.html`):**
  - `.cabecera { padding-inline: max(var(--e-4), calc(50vw - 23rem + var(--e-4))); }`
  - `.pie .dentro { width: min(calc(46rem - 2 * var(--e-4)), 100%); }`

### V16 · P3 · Estudio en ultrapanorámico y 4K: la columna de trabajo queda pegada a la izquierda

- **Dónde:** Estudio, todos los pasos. 3440×1440 y 3840×2160. Claro y oscuro. M.
- **Captura:** `matriz/estudio-html_oscuro_m_3440x1440.png` (unos 1.100 px vacíos entre el trabajo y la vista previa) y `matriz/estudio-html_claro_m_3840x2160.png`.
- **Qué pasa:** `.seccion` tiene un máximo de 62 rem y va alineada a la izquierda, y la vista previa se queda en 40 rem.
- **Propuesta:** en `estudio.css`, `@media (min-width: 2200px) { :root { --ancho-vista: clamp(22rem, 45vw, 75rem); } }`. La vista previa es el producto y gana sitio. O, como mínimo, `.seccion { margin-inline: auto; }`.

### V17 · P3 · Estudio, Datos: los ejemplos parecen valores ya escritos

- **Dónde:** Estudio → Datos (precio, título y referencia). 1440 y 390. Claro y oscuro.
- **Captura:** `estudio/1440x900_claro_m_datos.png`, `recortes/datos_precio.png` y `estudio/1440x900_claro_m_publicar.png`, que avisa «Falta el precio».
- **Qué pasa:** el marcador de posición «349.000», con un proyecto sin precio, se lee como un precio ya puesto. Lo mismo pasa con «C8-7ZXHD» y «Piso en venta · 3 hab. · 112 m²».
- **Propuesta:** en `estudio-datos.js` 66, `placeholder: "Ej.: 349.000"` (y «Ej.: 1.200»), como hace la Guía («Ej.: Salón»).

### V18 · P3 · El plano y el vídeo exportados usan otra letra

- **Dónde:** plano PNG y el del dossier (`exportar.js` 1007: `"Helvetica Neue", Arial`), y los rótulos del vídeo (`exportar.js` 646: `system-ui…`).
- **Captura:** `estudio/1440x900_claro_m_dossier.png`, bloque «Plano»: la cabecera y la leyenda no van en Inter, como el resto del dossier.
- **Propuesta:**
  - Usar la pila de `--fuente`, leída con `getComputedStyle(document.documentElement)`.
  - Antes de dibujar, `await document.fonts.load('600 20px "Inter Variable"')`, para que el lienzo use Inter donde no hay SF.

## Coincidencias con las otras auditorías

- **«Ampliar» del radar sin vidrio (A3 de accesibilidad): lo veo también.**
  - Captura: `recortes/ampliar_claro_390.png`.
  - Causa: en `tema.css`, `.c8-boton` va detrás de `.c8-vidrio` con la misma especificidad, y su `background: var(--b-fondo)` (capa del 5–8 %) pisa el tinte del vidrio. Fondo calculado: `rgba(0,0,0,.05)` en claro y `rgba(255,255,255,.08)` en oscuro (`visor/registro.jsonl`).
  - Es la única pieza con `c8-boton c8-vidrio` a la vez. La propuesta de A3 (`.c8-boton.c8-vidrio { --b-fondo: var(--vidrio) }`) es la correcta.
- **El resto de lo que ya han señalado** (el estado «pulsado» en claro, las ondas de la música y la marca blanca en claro): no lo he visto en mis capturas o no lo he probado, así que no lo repito.

## Vidrio adaptativo: día y noche

Medido en `verificar2.log`, a 1440×900 con la demo. Capturas en `verif/luz_*.png`.

| Tema | Día y atardecer | Noche |
|---|---|---|
| Oscuro | `data-luz-max="media"`: tarjeta 0,64 y barra 0,44 | Peor caso: 0,78 y 0,56, porque las lámparas encendidas quedan bajo el HUD |
| Claro | `data-luz-min` no se activa nunca con la demo: siempre el peor caso (0,78 y 0,5), porque el techo oscuro queda bajo el HUD y manda la pieza más exigente | Igual |

- Después de la maqueta vuelve a medir sin mover la vista.
- Los cambios de nivel son suaves y no parpadean.
- **Visualmente funciona:** en los dos temas y con las dos luces se ve vidrio (tinte cálido de la foto y desenfoque) y el texto se lee.
- **Observación, no hallazgo:** como manda la pieza más exigente, en claro el vidrio casi nunca se aligera. Si se quiere más «liquid», el nivel se podría aplicar por pieza en lugar de en `<html>`. No bloquea nada y el plan eligió esta regla a propósito.

## Lo que está bien y no hay que tocar

- **El vidrio del visor en claro y en oscuro:**
  - HUD, tarjeta, ficha, diálogos, menú «Más», etiquetas 3D, sello, subtítulos y barra de medir.
  - En reposo solo quedan el radar y la píldora «349.000 € · Contactar».
- **La portada:** tarjeta de vidrio sobre la foto desenfocada, con la jerarquía agencia → título → precio → datos → «Empezar visita».
- **Ajustes:** Apariencia con el círculo, nunca sol ni luna. Tamaño S·M·L.
- **El resto de pantallas del visor**, limpias y coherentes en los dos temas:
  - «Estancias y plano», ayuda, visita guiada y medir;
  - compartir con QR;
  - la pantalla de WhatsApp;
  - el visor de fotos.
- **Tallas:**
  - con L, la tarjeta pasa a dos filas sin cortar el precio;
  - 3440×1440 y 3840×2160 bien repartidos en el visor;
  - iPad con la hoja.
- **Otros estados:**
  - «Reducir transparencia» deja paneles sólidos y limpios;
  - el paseo libre y la pantalla sin WebGL siguen el sistema.
- **Estudio:**
  - acento champán único, sin rastro del naranja `#ffb547` ni del `#c8a24a`;
  - menús, «Mi inmobiliaria», ayuda y editor de máscara de vidrio, con tokens;
  - aviso del móvil sobre el ambiente;
  - dossier en claro con Inter y champán.
- **Sin estilo antiguo** en CSS: no hay hex sueltos salvo datos (letras de energía, rojo de «grabar») ni serif. La muestra (`tema-muestra.html`) no tiene sol ni luna.

## Otros (fuera de lo visual)

- **Dossier:** dice «Certificado energético en trámite» cuando el proyecto no tiene ningún dato de certificado (`exportar.js`, línea 1207: `if (!cee || …)`). Puede tener consecuencias legales en un anuncio. Para QA y Maverick.
