# cre8eight · Cierre de la revisión de adaptación (móvil, tablet y escritorio)

Encargo: [adaptacion-encargos.md](adaptacion-encargos.md).

Informes:
- [ingeniería front-end](adaptacion-ingenieria.md): 22 hallazgos (P1 2 · P2 11 · P3 9);
- [maquetación y colocación](adaptacion-maquetacion.md): 17 hallazgos (P1 1 · P2 9 · P3 7);
- [UX/UI](adaptacion-ux-ui.md): 19 hallazgos (P2 9 · P3 10).

Capturas y métricas de partida: visor (la finca), Estudio (la finca importada) y Guía en 11 tamaños, de 360×740 a 1920×1080, 133 capturas. Ninguna página tenía desborde horizontal en ningún tamaño.

## Base: un solo sistema de puntos de corte (ING §0, ING-1, ING-3)

Antes había cuatro definiciones de «teléfono» que no coincidían:
- 540 en `visor.css`;
- 500 y 720 calculados con `innerWidth` en `paneles.js`;
- 450, 560 y 599 en `paneles.css`;
- 759 en el Estudio y 760 en la Guía.

Ahora las consultas tienen nombre y los mismos literales en el CSS y en el JS. Las definen `tema.js` → `cre8Tema.MQ`, `cre8Tema.forma()` y `html[data-forma]`:

| Nombre | Consulta | Qué es |
|---|---|---|
| `telefono` | `(max-width: 599.98px)` | Teléfono en vertical |
| `apaisado` | `(orientation: landscape) and (max-height: 499.98px)` | Teléfono en horizontal |
| `compacto` | `telefono` o `apaisado` | Sin tira ni pantalla completa; el Estudio avisa |
| `vertical` | `(orientation: portrait) and (max-width: 1100px)` | Tablet en vertical, iPad Pro de 13" incluido |
| `hoja` | `(max-width: 719.98px) and (min-height: 500px), vertical` | La tarjeta como hoja inferior |
| `estrecho` | `(orientation: landscape) and (max-width: 62em) and (min-height: 500px)` | Horizontal estrecho: modos abajo |

- `paneles.js` decide la disposición con `matchMedia`, no con aritmética.
- El Estudio y la Guía tratan el iPad mini (744 px) como un iPad, no como un teléfono.
- `pruebas/puntos-corte.mjs` (`npm run puntos-corte`, dentro de `prueba:todo`) rechaza cualquier medida que no esté en la lista. Las únicas excepciones son los ajustes de contenido documentados en la prueba.

## Aplicado

### Letra y objetivos táctiles (UX-1, UX-2, UX-4, ING-11)

- **Suelos de letra:** nada por debajo de 12 px en ninguna talla.
  - `--t-micro`, `--t-pie` y `--t-sec` a 12 px.
  - `--t-ui` a 12,5 px y `--t-cuerpo` a 14 px.
  - `<small>`, la insignia de los pasos y los rótulos del lienzo del radar y del plano también.
- **Escala en táctil (`pointer: coarse`):** la de iOS, que sigue a la talla: botones a 15 px, texto a 16 y subtítulos a 17.
- **`--toque-principal: 48px`:** «Empezar visita» y las acciones `c8-boton--l`.
- **Zonas táctiles de 44 px:** la «i», los pines de la maqueta y los `summary` y enlaces del Estudio en táctil.

### Táctil de verdad (UX-3, ING-15, UX-10)

- **Sin hover pegajoso:** los 55 `:hover` que no estaban protegidos van ahora dentro de `@media (hover: hover) and (pointer: fine)`, en el mismo sitio, sin cambiar el orden de la cascada. Las reglas que mezclaban hover y foco se han partido en dos, para que el foco de teclado siga en táctil.
- **Sin anillo de foco al cargar:** ni en la portada del visor ni en el aviso del Estudio en el teléfono.

### Capas, teclado y giro (ING-4, ING-5, ING-20)

- **Capas:** `.pn-raiz` ya no crea un contexto de apilamiento propio. Las piezas de los paneles se apilan en la escala común `--z-*`. En el teléfono, el aviso del núcleo sube arriba si hay una hoja abierta.
- **Teclado del móvil:** `tema.js` publica `--teclado`, `--alto-visible` y `html[data-teclado]` en las tres páginas.
  - El contacto y los diálogos se colocan encima del teclado.
  - Con el teclado abierto, el pie del contacto queda en lo imprescindible.
  - Si el teclado encoge la ventana, el diálogo ya no se rehace (antes perdía el foco y cerraba el teclado).
- **Giro:** al girar, la ficha abierta se conserva.

### Visor: colocación por dispositivo (MAQ-4, MAQ-5, MAQ-6, MAQ-7, MAQ-12, MAQ-14, ING-9, ING-21, UX-11, UX-18, UX-19, UX-12)

- **Teléfono en vertical:**
  - «Ampliar» del radar, tangente por fuera del disco;
  - «Ficha» escrito junto al precio;
  - con la ficha abierta, el sol y el radar se apartan;
  - «Datos clave» en 2×2 si hay cuatro.
- **Teléfono en horizontal:**
  - los modos, abajo a la izquierda (pulgar izquierdo), frente a la tarjeta (pulgar derecho);
  - «Más» en dos columnas;
  - el radar sube de 73 a 87 px.
- **Tablet en vertical:** los modos vuelven arriba al centro, y abajo quedan la tira y la tarjeta. Con la talla L o la letra al 200 % siguen abajo.
- **Tablet en horizontal, con el dedo:** la tarjeta se apoya abajo, con «Contactar» en la última fila, y los diálogos crecen hacia arriba.
- **Tira de estancias y modos:** se centran en el hueco libre, no en la pantalla. Con la ficha abierta, la tira ya no se queda en nada.
- **Escritorio:** el nombre del inmueble con peso de titular. A partir de 1600 px, miniaturas de la tira más grandes.

### Maqueta (UX-5, ING-10, ING-17, MAQ-11)

- Un solo rótulo por estancia: el pin de la foto lleva el nombre y los m².
- La casa se encuadra en el hueco que deja libre el HUD, con `setViewOffset` y los márgenes que da el núcleo (`ctx.margenes`).
- Pines de 44 px en táctil.

### Estudio (MAQ-1, MAQ-2, MAQ-8, MAQ-9, MAQ-10, MAQ-13, MAQ-15, MAQ-17, UX-6, ING-6, UX-7, ING-18, UX-8, ING-13, ING-2, UX-9, UX-17, ING-12, ING-14, ING-19)

- **Teléfono:**
  - los textos ya no se parten palabra a palabra (`.fila > .estirar { flex: 1 1 14rem }`);
  - los pasos van abajo, como pestañas;
  - el aviso deja los botones en la zona del pulgar;
  - en horizontal, el plano y su panel van lado a lado.
- **iPad:**
  - el plano se maneja con el dedo: zonas de toque ×2,4, las herramientas de dibujo actúan al levantar el dedo, el pellizco no dibuja y el doble toque cierra la estancia o termina el muro;
  - las pistas hablan del dedo y van en dos líneas, sin cortar;
  - «Vista previa» y «Guía» con nombre en la barra.
- **Portátil de 1280:** la barra de pasos conserva los nombres.
- **Paso Plano hasta 1440 px:** la vista previa pasa a un cajón y el lienzo gana el ancho.
- **Vista previa «Ordenador»:** una pantalla virtual de 1280×800 escalada (antes enseñaba la interfaz del teléfono), en un marco de 16:10.
- **Sin fotos:** no se muestra la columna de vista previa vacía.
- **«Continuar»:** siempre a la vista, abajo.
- **Dorado:** una sola acción dorada por pantalla. Lo elegido se marca sin color, como en iOS. «Publicar» se pone dorado cuando no quedan pasos por corregir.
- **Música:** el título ya no sale como «[object Object]».
- **Zonas seguras:** también en el `body` y en los avisos.
- **Alto de pantalla:** `svh` en lugar de `vh`.

### Guía (UX-14, UX-16, MAQ-16)

- En el teléfono en horizontal, la cabecera ya no se queda fija y el pie adelgaza.
- La fase ya no se repite encima del título.
- «Abrir el Estudio» sale donde el Estudio funciona: ratón o tablet.

### Resolución (ING-8)

- La calidad adaptativa solo cuenta los fotogramas pintados.
- La resolución vuelve a subir cuando sobran fotogramas. Antes, un tirón al descodificar una foto la bajaba para siempre.

## Pendiente (no se ha aplicado ahora)

- **MAQ-3:** apariencia y ayuda dentro del menú «Proyecto» en el teléfono, para dar más sitio al nombre. Hace falta JS en el menú, y el Estudio en el teléfono es secundario.
- **ING-7:** detección táctil dinámica (portátiles táctiles, iPad con trackpad) y `navigator.deviceMemory` para las imágenes. Hay que medirlo en dispositivos reales.
- **ING-14 (visor):** variable `--ancho-util` para los topes de ancho de los avisos y barras con la muesca en horizontal.
- **ING-16:** proyecciones con el tamaño del lienzo en lugar de `innerWidth`, para el zoom de página de iOS.
- **UX-14 («Idioma» en «Más»):** se mantiene, porque las pruebas y el teclado lo usan. Se revisará con el rediseño de cristal.
- **UX-15:** gesto completo de la hoja inferior (arrastrar el contenido, velocidad de los últimos 100 ms y resistencia).
- **UX-13:** cápsula del segmentado en claro. Pasa al rediseño de cristal (tarea 17, con las referencias del cliente del 16/10: claro, oscuro y transparente; verde lo encendido y rojo lo apagado).
