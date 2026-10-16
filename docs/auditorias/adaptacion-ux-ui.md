# cre8eight · Revisión de adaptación · C · UX/UI

- **Fecha:** 16/10/2026. Rama `ccr-40d07831-qbgzrt`. Este informe no cambia el código.
- **Encargo:** sección C de [adaptacion-encargos.md](adaptacion-encargos.md). He cargado las skills `design:design-critique` y `design:accessibility-review` y he seguido su orden: primera impresión, usabilidad, jerarquía, coherencia y accesibilidad (objetivos táctiles, texto, foco). Su plantilla se adapta aquí al formato del encargo (id, prioridad, dónde, captura, por qué, causa, corrección).
- **Usuarios de referencia:**
  - el **comprador**, en el visor desde el teléfono (llega desde un portal o WhatsApp);
  - el **agente inmobiliario**, en el Estudio con el portátil o el iPad;
  - el **fotógrafo**, con la Guía Osmo 360 en el teléfono y la cámara en la otra mano.
- **Material:**
  - `<AUDITORIA>` = `/tmp/claude-0/-home-user-creatorflow-ai/9aa10f93-9bbe-52c5-91f2-e21dabbb4196/scratchpad/auditoria`.
  - Capturas y métricas comunes: `<AUDITORIA>/v1/` (visor en oscuro; Estudio y Guía en claro).
  - **Capturas nuevas mías** (visor en **claro**, primer uso con la pista, ficha y maqueta), un tamaño cada vez: `<AUDITORIA>/ux/cap/390x844-light-*.png` y `<AUDITORIA>/ux/cap/820x1180-light-*.png`. Script: `<AUDITORIA>/ux/ux.mjs`. Medidas del DOM de la Guía: `<AUDITORIA>/ux/medir-guia.mjs`.
  - Recortes ampliados: `<AUDITORIA>/ux/recortes/`.
- **Lo ya resuelto en la fase 4** (V1 suelo de 11 px, A21 objetivos, V4 maqueta, A7 estado pulsado, M16 modo juego…) no se repite: solo se cita cuando el arreglo se ha quedado corto en algún tamaño.

## 1. Resumen y veredicto

1. **No hay ningún P1 de UX.** Las tres páginas se entienden y se usan en los 11 tamaños. El vidrio, la tarjeta del inmueble y el flujo de contacto están a un nivel de producto premium.
2. **El problema de fondo es la letra en las pantallas táctiles (UX-1).** La raíz baja a 14 px en el teléfono (12,25 px con la talla S), así que:
   - los botones («Contactar», «Recorrido», «Siguiente» de la Guía, el menú «Más») quedan en **12,25 px** y el cuerpo de texto en **14 px**, cuando iOS usa 15–17 pt;
   - con la talla S, los botones bajan a **10,7 px**;
   - los tres tokens pequeños tienen suelo en 11 px, por debajo de los 12 px que pide el encargo (58 textos distintos de 11–11,8 px en `metricas.json`, 1.760 apariciones entre estados y tamaños).
3. **Faltan cuatro cosas de «táctil de verdad»:**
   - hover pegajoso en ~60 reglas sin `@media (hover: hover)` (UX-3);
   - cuatro objetivos por debajo de 44 px (UX-4);
   - la pista del plano del Estudio habla de «Rueda», «Supr» y «clic» en el iPad y además sale cortada (UX-7);
   - el anillo de foco se enciende solo al cargar (UX-10).
4. **El agente puede llevarse una sorpresa en el Estudio.** La vista previa «Ordenador» enseña en realidad la interfaz del teléfono o de la tablet, porque el iframe mide 460–690 px (UX-6).
5. **La maqueta, que es la vista de conjunto,** rotula cada estancia dos veces, sale pequeña y descentrada, y corta rótulos contra el borde en el teléfono y en la tablet (UX-5).

**Recuento: P1 0 · P2 9 · P3 10.**

## 2. Falsos positivos de `metricas.json` (confirmados con captura o código)

| Métrica | Caso | Por qué no es un fallo |
|---|---|---|
| `tapados` | Visor «6-plano», «2-menu-mas», «5-contacto»; Estudio «0-inicio» en el teléfono | Lo tapa un diálogo, un menú o el aviso del móvil, que es modal a propósito |
| `tapados` / `fuera` | Estudio «3-datos» (#c27…#c34) y «2-plano» («Ver o cambiar zonas…», «Dibujar muros», #c18/#c22) | Son controles dentro de un `<details>` cerrado («Más datos del inmueble», «Avanzado»): no se ven ni se pueden tocar |
| `tapados` | Visor «4-ficha» y «5-contacto» en tablet (`.estancia «Ir a …»` bajo la hoja) | La hoja abierta tapa la tira a propósito (`visor-4-ficha-tablet.png`) |
| `solapes` | `.disco` con `#btn-ampliar` en todos los tamaños | Diseño: «Ampliar» monta sobre el radar. Ver UX-11 para el móvil |
| `pequenos` | Interruptores de Ajustes (44×27, 48×29) y del Estudio (`#barra-sol`, `#estilo-todo`) | La fila entera es un `<label>` de ≥ 44 px (`paneles.js:1926`, `.pn-fila-ajuste`) |
| `pequenos` | Casillas de 16–24 px (contacto `c-priv`, Estudio, Guía) | La etiqueta entera es la zona de toque (`.pn-check label` de 44 px; `ul.check label` de la Guía) |
| `pequenos` | «Copiar enlace», «Cerrar» y «WhatsApp» de 44 px en «8-compartir@tablet-h» | El diálogo aún escalaba (`c8-aparecer`, `scale(0.97)`) al medir |
| `pequenos` | Enlaces en una frase («Añádelos como estancias», «Cambiar» con ratón) | WCAG 2.5.8 exime los enlaces dentro de una línea de texto (en táctil «Cambiar» sí cuenta: UX-4) |
| captura | Botones de la Guía de ~28 px en `guia-1-completa-movil.png` | La captura a página completa no refleja el táctil: en el DOM miden 44 px (`ux/medir-guia.mjs`: `#sugerir` 172×44, `#anadir-estancia` 69×44) |
| captura | Anillo dorado en «Contactar» y en el precio (maqueta) | El script cerró el diálogo anterior con Esc: el foco vuelve con anillo, como debe |
| captura | Círculo sobre «Recorrido · Maqueta» en `visor-1-recorrido-escritorio.png` | Es el florón del techo de la foto (`ux/recortes/top-centro-escritorio.png`) |
| captura | «03/22/2018, 11:30 AM» en Estilo y luz | Es el idioma del Chromium de la prueba (`en-US`); en un navegador en español sale dd/mm |
| `letraPeque` | Los textos de 11–11,8 px | **No son falsos positivos:** el encargo pide ≥ 12 px y los tokens tienen suelo en 11 (UX-1). Los de menos de 11 px están en UX-2 |

## 3. Hallazgos

| Id | P | Página · tamaños | Qué |
|---|---|---|---|
| UX-1 | P2 | Visor, Estudio y Guía · táctil (y S en todos) | Escala corta en el teléfono: botones de 12,25 px, cuerpo de 14 px y suelo de 11 px |
| UX-2 | P2 | Visor y Estudio · todos | Textos de 8,75–10,2 px fuera de los tokens (insignia, `small`, lienzos) |
| UX-3 | P2 | Las tres · táctil | Hover pegajoso: el último botón tocado se queda «iluminado» |
| UX-4 | P2 | Visor y Estudio · táctil | Objetivos de menos de 44 px: botón de la portada, «i», pines de la maqueta y resúmenes del Estudio |
| UX-5 | P2 | Visor · maqueta · teléfono y tablet | Cada estancia rotulada dos veces; casa pequeña, descentrada y rótulos cortados por el borde |
| UX-6 | P2 | Estudio · vista previa «Ordenador» · todos | Enseña la interfaz del teléfono o de la tablet |
| UX-7 | P2 | Estudio · Plano · iPad y escritorio | La pista habla de ratón y teclado en táctil, y sale cortada siempre |
| UX-8 | P2 | Estudio · Plano · teléfono en horizontal | Lienzo de 80 px de alto: el plano no se puede editar |
| UX-9 | P2 | Estudio (y compartir del visor) | El dorado marca a la vez la acción principal y los estados elegidos: hasta 3 «principales» a la vez |
| UX-10 | P3 | Visor · portada; Estudio · aviso del móvil | Anillo de foco encendido al cargar, sin teclado |
| UX-11 | P3 | Visor · radar · teléfono (sobre todo en horizontal) | «Ampliar» tapa el 30–40 % del disco |
| UX-12 | P3 | Visor · ficha · teléfono y tablet | «Baños» huérfano en «Datos clave» (4 datos en rejilla de 3) |
| UX-13 | P3 | Visor y Estudio | Estados elegidos y pulsados de tres maneras distintas; el pulsado del radar casi no se ve en claro |
| UX-14 | P3 | Visor y Guía | Duplicados que cuestan sitio: «Idioma» en 3 lugares, «ANTES DE IR» 2 veces |
| UX-15 | P3 | Visor · hoja · teléfono y tablet vertical | La hoja solo se arrastra por la cabecera y no se cierra tirando del contenido |
| UX-16 | P3 | Guía · teléfono en horizontal | Cabecera y pie se comen el 32 % del alto; «Abrir el Estudio» lleva al aviso del móvil |
| UX-17 | P3 | Estudio · iPad | Cinco iconos sin nombre en la barra; selector de estancia de la vista previa cortado («Te ▾») |
| UX-18 | P3 | Visor · escritorio | El nombre del inmueble a 13–15 px, frente a un precio de 28 px |
| UX-19 | P3 | Visor · tarjeta · teléfono y tablet vertical | La entrada a la ficha es un chevron de 12 px; en escritorio dice «Ver ficha» |

---

### UX-1 · P2 · En táctil la escala entera es un punto o dos más pequeña que la de iOS, y nada llega a 12 px

- **Dónde:** visor, Estudio y Guía, en `movil-s`, `movil`, `movil-xl`, `movil-h`, `tablet-s` y `tablet` (raíz de 14 a 15,15 px). Con la talla S, en todos los tamaños. Claro y oscuro.
- **Captura:**
  - `v1/visor-1-recorrido-movil.png` («Contactar», «Recorrido», «Maqueta» a 12,25 px);
  - `v1/guia-0-inicio-movil.png` («Siguiente» a 12,25 px);
  - `v1/visor-4-ficha-movil.png` («DATOS CLAVE», «Construidos», «Finca · En venta» a 11 px).
- **Medida:**
  - `ux/medir-guia.mjs`: raíz de 14 px; `#siguiente` y `#anadir-estancia` a 12,25 px; `#sugerir` a 12 px.
  - `metricas.json`: 58 textos distintos de 11 a 11,8 px (1.760 apariciones) en el visor, el Estudio y la Guía. En `tablet-pro-h` y `escritorio-xl` quedan menos, porque allí la raíz ya pasa de 16 px.
- **Por qué importa:**
  - El comprador lee la tarjeta, la ficha y el contacto en el teléfono, con una mano y a veces en la calle. Los botones del visor quedan a 12,25 px y la descripción de la ficha a 14 px, cuando Fotos, Mapas o Casa usan 15–17 pt.
  - El fotógrafo usa la Guía con la cámara en la otra mano: «Siguiente» a 12,25 px es pequeño para leerlo de un vistazo.
  - El encargo pide que ninguna letra baje de 12 px, y los tokens tienen el suelo en 11 px. Con la talla S, los botones bajan a 10,7 px y el cuerpo a 12,25 px.
- **Causa:**
  - `tema.css`, `html { font-size: calc(clamp(0.875em, 0.75vmin + 0.5625em, 1.5em) * var(--talla)) }`: en el teléfono la raíz es de 14 px (12,25 px con S).
  - `--t-ui: 0.875rem` y `--t-cuerpo: 1rem` no tienen suelo. `--t-micro`, `--t-pie` y `--t-sec` lo tienen en 11 y 12 px.
- **Corrección** (`tema.css`, en «Escala tipográfica»; la tabla completa está en el § 4):

```css
  /* Suelos: nada por debajo de 12 px (encargo de adaptación). Manda el rem si es mayor: se respeta la letra del navegador. */
  --t-micro: max(0.6875rem, 12px);   /* 11 → 12 · etiquetas en mayúsculas */
  --t-pie: max(0.75rem, 12px);       /* 12 · pies, sellos */
  --t-sec: max(0.8125rem, 12px);     /* 13 · texto secundario */
  --t-ui: max(0.875rem, 12.5px);     /* 14 · botones (con S en un portátil no baja de 12,5) */
  --t-cuerpo: max(1rem, 14px);       /* 16 · texto */
```

y, después de la regla de `html[data-talla]`:

```css
/* Táctil: la letra de iOS (subtítulo 15 pt, texto 16–17 pt). El suelo sigue a la talla (S 13,1 · M 15 · L 17,7 en los
   botones) y nunca baja de los suelos generales. La pantalla grande (raíz > suelo) no cambia. */
@media (pointer: coarse) {
  :root {
    --t-sec: max(0.8125rem, 12px, calc(13px * var(--talla)));
    --t-ui: max(0.875rem, 12.5px, calc(15px * var(--talla)));
    --t-cuerpo: max(1rem, 14px, calc(16px * var(--talla)));
    --t-destacado: max(1.125rem, calc(17px * var(--talla)));
  }
}
```

  - Después, hay que volver a pasar `auditar.mjs` en `movil-s` y `movil-h`. La tarjeta de la hoja ya pasa los botones a una segunda fila si no caben (`paneles.css`, `:is(.pn-disp-hoja, .pn-disp-compacta) .pn-t-cab { flex-wrap: wrap }`), y «Recorrido · Maqueta» y el menú «Más» tienen sitio a 360 px.
  - Si alguna prueba de `pruebas/` fija los 11 px de V1, hay que actualizarla.

### UX-2 · P2 · Textos de 8,75 a 10,2 px que no salen de los tokens

- **Dónde y medida** (`metricas.json`, `letraPeque` por debajo de 11 px):

  | Texto | Tamaño | Página · tamaños | Causa |
  |---|---|---|---|
  | Insignia «2» de «Publicar» en la barra de pasos | 8,75–9,5 px | Estudio, ≤ 1280 px (teléfono, iPad, portátil) | `estudio.css` (≤ 1280 px): `#pasos .insignia { … font-size: 0.625rem; }` |
  | «Zona aproximada» bajo la ubicación de la ficha | 10,2–11,5 px | Visor · ficha, todos | `paneles.js:1041`: un `<small class="pn-suave pn-bloque">` sin tamaño (el navegador lo pone a `smaller`) |
  | «Título», «Descripción», «Pie legal» en «Idiomas y traducciones» | 10–10,7 px | Estudio · Datos, todos | `estudio-datos.js:201`: `small.tenue` dentro de `.fila-trad .original` (que va a `--t-sec`) |
  | «N» del radar | 9,4 px | Visor · radar, todos | `plano.js:278`: `letra(C.fuerte, C.micro * 0.85)` |
  | m² del plano y del radar | ~10,1 px | Visor · «Estancias y plano» en el teléfono | `plano.js:204`: `m2 = grande ? C.pie : C.micro * 0.92` |
  | «N» de la flecha del norte | 9 px × escala | Visor · plano grande | `plano.js:251`: `letra(C.semi, 9)` |

- **Por qué importa:** son datos que el comprador busca (el norte, los m², si la ubicación es exacta) y avisos que el agente tiene que ver («2 por corregir»).
- **Corrección:**

```css
/* tema.css, en «Base»: <small> nunca por debajo del suelo (vale para paneles, Estudio y Guía) */
:where(small) { font-size: max(0.8333em, var(--t-pie)); }
```

```css
/* estudio.css, @media (max-width: 1280px) */
#pasos .insignia { … min-width: 1.125rem; height: 1.125rem; font-size: var(--t-micro); }   /* antes 0.625rem */
```

```js
// plano.js: ningún rótulo del lienzo por debajo de 12 px (CSS px, antes de la escala del dispositivo)
const letra = (peso, px) => `${peso} ${Math.round(Math.max(px, 12) * 10) / 10}px ${C.fuente}`;   // línea 137
```

  Con el suelo en `letra()`, la «N» del radar (`C.micro * 0.85`), la del plano (9) y los m² (`C.micro * 0.92`) suben a 12 px. El radar ya rotula solo lo que cabe en el disco (`plano.js:222-224`), así que no se monta nada.

### UX-3 · P2 · Hover pegajoso en táctil: lo último que se tocó se queda iluminado

- **Dónde:** las tres páginas, en todos los tamaños táctiles. Se ve sobre todo:
  - en la tira de estancias (la miniatura tocada se queda levantada);
  - en las etiquetas 3D y la «i» (se quedan en negativo y al 108 %);
  - en las acciones de la tarjeta y en los botones de la barra de vista.
- **Captura:** `v1/visor-3-ajustes-tablet-h.png`. «Medir» se queda con el relleno de hover después de que el dedo tocara esa zona para abrir «Más → Ajustes».
- **Por qué importa:**
  - En el iPhone y el iPad, `:hover` se queda puesto en el último elemento tocado hasta que se toca otro.
  - El comprador ve un botón «encendido» que no está activo, y lo confunde con el estado pulsado. Es justo lo que el encargo pide evitar: «hover solo donde hay ratón».
- **Causa:** `:hover` sin `@media (hover: hover)`:
  - `tema.css`: 10 reglas (una protegida);
  - `visor.css`: 16 (ninguna protegida);
  - `paneles.css`: 15 (una protegida);
  - `estudio.css`: 19 (ninguna protegida).
- **Corrección:** mover cada `:hover` a un bloque `@media (hover: hover) and (pointer: fine)` al final de su archivo. El dedo ya tiene su respuesta en `:active` (`scale(0.96)`, `.etq:active`, `.info:active`).

  | Archivo | Reglas que se mueven tal cual |
  |---|---|
  | `tema.css` | `.c8-boton:hover`, `.c8-boton--primario:hover`, `.c8-boton--whatsapp:hover` (con su `filter`), `.c8-boton--fantasma:hover`, `.c8-boton--peligro:hover`, `.c8-boton.c8-vidrio:hover`, `.c8-pastilla .c8-boton:hover`, `.c8-pastilla .c8-boton[aria-pressed="true"]:hover`, `.c8-campo … :hover` |
  | `visor.css` | `#lugar:hover`, `#galeria .estancia:hover`, `.info.c8-vidrio:is(:hover, …)`, `.etq.c8-vidrio:is(:hover, …)`, `.maq-pin:hover`, `#cortinilla button:hover`, `#menu-mas button:hover`, `.ep-estancia:hover`, `#btn-pantalla:hover …`, `#tarjeta-juego:hover` |
  | `paneles.css` | `.pn-t-resumen:hover`, `.pn-accion:hover`, `.pn-docs a:hover`, y los de diálogos, galería y estilos |
  | `estudio.css` | `#pasos button:hover`, `.nombre-proyecto:hover`, `.barra-plantas .pestana:hover`, `.lienzo-plano .zoom .c8-boton:hover`, `.enlace-guia:hover`… |

  Las reglas que juntan hover y foco se parten en dos, para que el foco de teclado siga funcionando en táctil:

```css
/* visor.css: antes .etq.c8-vidrio:is(:hover, :focus-visible, .resaltada) { … } */
.etq.c8-vidrio:is(:focus-visible, .resaltada) { background: var(--c-texto); color: var(--c-sobre-texto); border-color: transparent; }
.info.c8-vidrio:focus-visible { background: var(--c-texto); color: var(--c-sobre-texto); scale: 1.08; }
@media (hover: hover) and (pointer: fine) {
  .etq.c8-vidrio:hover { background: var(--c-texto); color: var(--c-sobre-texto); border-color: transparent; }
  .info.c8-vidrio:hover { background: var(--c-texto); color: var(--c-sobre-texto); scale: 1.08; }
  #galeria .estancia:hover { transform: translateY(-0.125rem); }
  .maq-pin:hover { scale: 1.06; }
  #lugar:hover { border-color: var(--c-borde-2); }
  /* … resto de la tabla */
}
```

### UX-4 · P2 · Cuatro objetivos táctiles por debajo de 44 px

| Objetivo | Tamaño real | Página · tamaños | Causa | Corrección |
|---|---|---|---|---|
| «Empezar visita» y «Visita guiada» de la portada | 142×**42** y 154×**42** | Visor · portada · teléfono | `visor.css`: `#portada .acciones .c8-boton { min-height: 3rem }` (3 × 14 = 42) pisa el mínimo de 44 | `min-height: max(3rem, 48px);` es la acción principal del primer uso (§ 4) |
| Punto de interés «i» | 32–38 px, con su `::after` **42 px** | Visor · recorrido · teléfono y tablet | `.info { width: 2.25rem }` y `.info::after { inset: -0.375rem }` | `@media (pointer: coarse) { .info::after { inset: min(-0.375rem, calc((2.25rem - var(--toque-minimo)) / 2)); } }` |
| Pines de la maqueta | 65–92 × **26**, con su `::after` **40 px** | Visor · maqueta · teléfono y tablet | `.maq-pin { min-height: 1.875rem }`, `::after { inset: -0.5rem }` | `@media (pointer: coarse) { .maq-pin::after { inset: calc((1.875rem - var(--toque-minimo)) / 2) -0.5rem; } }` (con UX-5 el pin queda en uno solo y crece) |
| Resúmenes y enlaces del Estudio | «Avanzado» 193×**14**; «4 correctos» 678×**18**; «Código para incrustarlo…» 519×**19**; enlace «Cambiar» 48×**18** | Estudio · Plano, Publicar y Estilo y luz · iPad | La lista táctil de `estudio.css` (`@media (pointer: coarse)`) tiene `.avanzado > summary`, pero no `.avanzado-plano > summary`, `.correctos > summary`, `.codigo-incrustar > summary` ni `.enlace` | Añadirlos a esa lista. Ver abajo |

```css
/* estudio.css, dentro de @media (pointer: coarse) */
:is(.avanzado-plano, .correctos, .codigo-incrustar) > summary { min-height: var(--toque-minimo); display: flex; align-items: center; }
.enlace { display: inline-flex; align-items: center; min-height: var(--toque-minimo); }
```

- **Por qué importa:** la portada es el primer toque del comprador, y la «i» y los pines son las únicas puertas a su contenido. Con 40–42 px fallan en el borde. El iPad es el dispositivo táctil del agente.
- **Captura:** `v1/visor-0-portada-movil.png`, `v1/visor-7-maqueta-movil.png` y `v1/estudio-2-plano-tablet-h.png` («▸ AVANZADO»).

### UX-5 · P2 · Maqueta: cada estancia rotulada dos veces, casa pequeña y rótulos contra el borde

- **Dónde:** visor, modo «Maqueta». Teléfono y tablet en vertical (sobre todo); en escritorio, solo el doble rótulo. Claro y oscuro.
- **Captura:**
  - `ux/cap/390x844-light-maqueta.png` y `v1/visor-7-maqueta-movil.png`: la casa ocupa un 35 % del ancho, arriba a la izquierda, y «Dormitorio 31 m²» empieza en x = 0;
  - `ux/cap/820x1180-light-maqueta.png`: medio iPad vacío por debajo;
  - `v1/visor-7-maqueta-escritorio.png`: «Terraza» y, justo debajo, «Terraza 204 m²».
- **Medida:** `solapes` `.maq-estancia` con `.maq-pin` en «7-maqueta@movil-s» y «@movil».
- **Por qué importa:**
  - La maqueta es la vista de conjunto: el comprador la abre para entender la casa.
  - Ocho rótulos para cuatro estancias es ruido, justo lo contrario de «compacto y esencial».
  - La casa pequeña y descentrada, con un rótulo cortado, parece un error.
- **Causa:**
  - `maqueta.js` crea por cada estancia un rótulo de vidrio (`.maq-estancia`, nombre y m²) y un pin (`.maq-pin`, nombre) en el mismo sitio.
  - `encuadrar()` ajusta la caja alineada con los ejes y la centra en su centro. Con una planta en L, media caja está vacía, y no se descuentan el HUD de arriba (título, sol y modos) ni el de abajo (modos y tarjeta).
- **Corrección:**
  1. **Un solo rótulo por estancia:** el pin lleva nombre y m² («◯ Terraza · 204 m²»), y `.maq-estancia` solo sale en las estancias sin foto 360, que no tienen pin. Así quedan 4 rótulos en vez de 8.

```css
/* visor.css */
.maq-pin .m2 { font-weight: var(--peso-normal); opacity: 0.72; font-variant-numeric: tabular-nums; }
.maq-pin .m2::before { content: "· "; }
```

     En `maqueta.js`, al crear el pin: `pin.append(h("span", { class: "m2", text: sup }))`, y no crear `.maq-estancia` cuando la estancia tiene nodo.
  2. **Encuadre sobre lo que se ve y en la zona libre** (`maqueta.js`, `encuadrar()`):
     - proyectar las esquinas reales de las superficies (no las 8 de la caja) para calcular la distancia;
     - centrar en la zona libre con `setViewOffset`, desplazando el centro óptico la mitad de la diferencia entre lo que tapan arriba y abajo:

```js
// tras calcular d con las esquinas de cada superficie (s.geometry.boundingBox → 8 puntos por superficie):
const css = getComputedStyle(document.documentElement);
const arriba = parseFloat(css.getPropertyValue("--bajo-modos")) || 0;          // título, sol y modos
const abajo = (parseFloat(css.getPropertyValue("--reserva-inferior")) || 0) + 64; // tarjeta y modos abajo
const W = innerWidth, H = innerHeight, dy = (arriba - abajo) / 2;
camara.setViewOffset(W, H, 0, -dy, W, H);                                        // el centro baja o sube a la zona libre
const libre = (H - arriba - abajo) / H;                                         // y la distancia tiene en cuenta ese alto
camara.position.copy(centro).addScaledVector(DIR, (d / Math.max(0.5, libre)) * 1.04);
```

     `redimensionar()` ya vuelve a encuadrar al girar mientras el visitante no haya movido la maqueta. Hay que llamar a `camara.clearViewOffset()` al salir del modo.

### UX-6 · P2 · Estudio: la vista previa «Ordenador» enseña la interfaz del teléfono o de la tablet

- **Dónde:** Estudio, panel «Vista previa» con «Ordenador» elegido (es el valor por defecto). Portátil, escritorio y escritorio XL; también la tablet en horizontal.
- **Captura:**
  - `v1/estudio-1-fotos-escritorio.png`: a 1440 px, la vista previa es la hoja del teléfono (radar, columna de iconos, «Recorrido · Maqueta» abajo y tarjeta con lápiz);
  - `v1/estudio-3-datos-escritorio-xl.png`: a 1920 px, es la interfaz de tablet en vertical (tira con «Visita guiada»).
- **Por qué importa:**
  - El agente revisa «como lo verán sus clientes en el ordenador» antes de publicar y ve otra cosa: no ve la tarjeta lateral con «Ver ficha», la barra superior con el modo juego ni la tira.
  - Puede publicar sin haber visto nunca la versión de escritorio, o pensar que «en el ordenador sale como en el móvil».
- **Causa:**
  - `estudio.css`: `#iframe-visor { position: absolute; inset: 0; width: 100%; … }` con `--ancho-vista: clamp(22rem, 36vw, 40rem)`. El iframe mide 460–690 px de ancho y es vertical.
  - Dentro, `visor.css` aplica sus tramos: vertical de ≤ 540 px es el teléfono, y vertical de ≤ 1024 px es la tablet.
- **Corrección:** con «Ordenador», el iframe se dibuja a un tamaño de pantalla virtual de 1440×900 y se escala para caber, como el modo de diseño adaptable de Safari. Las consultas `@media` del visor ven 1440 px de ancho y eligen la disposición lateral.

```css
/* estudio.css */
body:not(.vista-movil):not(.grabando) #iframe-visor { inset: auto; left: 50%; top: 50%; width: 1440px; height: 900px;
  transform: translate(-50%, -50%) scale(var(--escala-vista, 0.4)); transform-origin: 50% 50%;
  border-radius: calc(var(--r-3) / var(--escala-vista, 0.4)); box-shadow: 0 0 0 calc(1px / var(--escala-vista, 0.4)) var(--c-borde-2); }
```

```js
// estudio.js, junto a S-12 (vista previa móvil/ordenador)
const marcoVista = $(".vista-marco");
new ResizeObserver(([e]) => {
  const { width: W, height: H } = e.contentRect;
  marcoVista.style.setProperty("--escala-vista", String(Math.min((W - 16) / 1440, (H - 16) / 900)));
}).observe(marcoVista);
```

  - A 1440 px de pantalla la escala es de ~0,35. Se lee como una miniatura fiel, que es lo que se le promete al agente.
  - «⤢ Ampliar» (`#vista-plegar`, `body.vista-grande`) la sube a ~0,55.
  - Si se prefiere no escalar, la alternativa honesta es renombrar la opción como «Tablet» cuando el panel mida menos de 1025 px.

### UX-7 · P2 · Estudio · Plano: en el iPad la pista habla de ratón y teclado, y en todos los tamaños sale cortada

- **Dónde:** Estudio, paso «Plano», herramienta «Seleccionar» (y Estancia, Muro y Calibrar). iPad vertical y horizontal; el corte también en portátil y escritorio.
- **Captura:**
  - `v1/estudio-2-plano-tablet-h.png`: «Arrastra fotos y esquinas para ajustarlas. Rueda = zoom; arrastra el f…»;
  - `v1/estudio-2-plano-tablet.png`: «… Supr borra …».
- **Medida:** `recortes` `.pista.c8-vidrio` con elipsis en «2-plano» de todos los tamaños, y `fuera`/`solapes` con `.zoom` en `movil-h`.
- **Por qué importa:**
  - En el iPad no hay rueda, ni Supr, ni Shift, ni doble clic fiable.
  - El agente lee instrucciones que no puede cumplir, y la parte que le sirve («arrastra el fondo para moverte») está justo en lo que se corta.
  - En el plano es donde más se pierde el agente no técnico (fase 3, § 4.2).
- **Causa:**
  - `estudio-plano.js:11-17` (`HERRAMIENTAS[].pista`) solo trae textos de ratón.
  - `estudio.css`: `.lienzo-plano .pista { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: calc(100% - 7.5rem) }`.
- **Corrección:**

```js
// estudio-plano.js
const TACTIL = matchMedia("(pointer: coarse)");
const HERRAMIENTAS = [
  { id: "sel", …, pista: "Arrastra fotos y esquinas para ajustarlas. Rueda = zoom; arrastra el fondo para moverte. Supr borra lo seleccionado.",
    pistaTactil: "Arrastra fotos y esquinas para ajustarlas. Pellizca para acercar y arrastra el fondo para moverte." },
  { id: "calibrar", …, pistaTactil: "Toca los dos extremos de una medida que conozcas (p. ej. una pared)." },
  { id: "estancia", …, pistaTactil: "Toca cada esquina. Toca el primer punto para cerrar la estancia." },
  { id: "muro", …, pistaTactil: "Toca para empezar y en cada esquina. Se ajusta a 90°. Toca dos veces para terminar." },
  { id: "enlace", …, pistaTactil: "Toca una foto y luego otra para conectarlas o desconectarlas." },
];
// línea 134: … : (TACTIL.matches && herr.pistaTactil) || herr.pista;
// y en el aviso de «colocar»: TACTIL.matches ? "… (toca «Cancelar»)" : "… (Esc para cancelar)"
```

```css
/* estudio.css: hasta dos líneas, sin cortar */
.lienzo-plano .pista { white-space: normal; text-wrap: balance; text-align: center; border-radius: var(--r-4);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; max-width: min(36rem, calc(100% - 7.5rem)); }
```

  Lo de borrar en táctil ya lo resuelven los botones «Borrar estancia» y «Borrar muro» del panel (`estudio-plano.js:178,183`). La pista no tiene que nombrar la tecla.

### UX-8 · P2 · Estudio · Plano en el teléfono en horizontal: el lienzo mide 80 px

- **Dónde:** Estudio, paso «Plano», `movil-h` (844×390), después de «Seguir aquí de todos modos».
- **Captura:** `v1/estudio-2-plano-movil-h.png`. Entre la barra de herramientas y «Fotos sin colocar» queda una franja de unos 80 px de plano, y la pista y el zoom se pisan.
- **Por qué importa:**
  - El plano no se puede editar.
  - El Estudio avisa de que en el teléfono cuesta (decisión del cliente, S-9), pero si deja seguir, lo que se ve tiene que funcionar.
  - Si el cliente quiere el Estudio usable en el teléfono, este hallazgo es un P1.
- **Causa:**
  - `estudio.css`, `@media (max-width: 759px)`, da al lienzo `height: 60vh` y deja la página desplazarse. El teléfono en horizontal mide 844 px de ancho, así que no entra en ese tramo.
  - `.seccion.completa { height: 100% }` y `.lienzo-plano { flex: 1 }` lo aplastan.
- **Corrección:**

```css
/* estudio.css: el teléfono en horizontal, como el vertical: el lienzo a la altura visible y el panel debajo */
@media (max-height: 540px) and (orientation: landscape) {
  .seccion.completa, .editor-plano { height: auto; }
  .lienzo-plano { flex: none; height: calc(100dvh - var(--alto-barra) - 1rem); }
  .plano-lado { max-height: none; }
}
```

### UX-9 · P2 · El dorado compite consigo mismo: estados elegidos con el color de la acción principal

- **Dónde:**
  - Estudio, paso «Plano» (iPad y escritorio): «Seleccionar» (herramienta elegida), «Continuar → Datos» y «Publicar» de la barra, los tres dorados.
  - Pasos «Fotos» y «Datos»: «Publicar» y «Continuar → …».
  - Visor, «Compartir» en escritorio: «Copiar enlace» dorado junto a «Contactar», también dorado.
- **Captura:** `v1/estudio-2-plano-tablet.png`, `v1/estudio-2-plano-tablet-h.png`, `v1/estudio-1-fotos-tablet.png` y `v1/visor-8-compartir-tablet-h.png`.
- **Por qué importa:**
  - El dorado es «lo siguiente que debes hacer». Con tres a la vez, el agente no sabe si toca «Continuar» o «Publicar» (con «2 por corregir» pendientes).
  - En el visor, el sistema ya marca lo elegido sin color, como iOS (`tema.css`, `.c8-pastilla .c8-boton[aria-pressed="true"]`). El Estudio no lo hace.
- **Causa:**
  - `tema.css`: `.c8-boton[aria-pressed="true"] { --b-fondo: var(--c-acento); … }` es el pulsado por defecto fuera de una pastilla. Lo usan las herramientas del plano (`estudio-plano.js:127`), «Colocar» (`:194`) y las páginas del dossier (`estudio-exportar.js:398`).
  - `estudio.js:149`: «Publicar» es principal en cuanto hay fotos (S-3).
  - `paneles.js:1844`: «Copiar enlace» es `c8-boton--primario` en escritorio.
- **Corrección:**

```css
/* tema.css: el pulsado por defecto es neutro (como en la pastilla); el acento queda para la acción principal */
.c8-boton[aria-pressed="true"] { --b-fondo: var(--c-capa-activa); --b-texto: var(--c-texto); --b-borde: var(--c-borde-2); font-weight: var(--peso-semi); }
```

```js
// estudio.js:149 · «Publicar» dorado solo cuando el recorrido está listo (sin insignias de error) o no hay «Continuar» en pantalla
const listo = !document.querySelector("#pasos .insignia:not(.aviso)");
const principal = app.tour.panoramas.length > 0 && !enPublicar && listo;
// paneles.js:1844 · «Copiar enlace» como secundario: en el visor solo «Contactar» es dorado
const botonCopiar = h("button", { type: "button", class: "c8-boton c8-boton--secundario", … });
```

  El paso sigue avanzando con «Continuar → …», que es la única acción dorada de cada paso hasta que el recorrido está listo.

### UX-10 · P3 · Anillo de foco encendido al cargar, sin teclado

- **Dónde:**
  - Visor, portada: «Empezar visita» con el aro dorado doble en todos los tamaños.
  - Estudio, aviso del móvil: «Enviarme el enlace».
  - Visor, «Compartir» en escritorio: «Copiar enlace» con `autofocus`.
- **Captura:** `v1/visor-0-portada-movil.png`, `v1/visor-0-portada-escritorio.png` y `v1/estudio-0-inicio-movil.png`.
- **Por qué importa:**
  - En la primera pantalla, el botón parece «ya pulsado» o con un borde raro.
  - En Chrome para Android, el foco por programa sin interacción previa enciende `:focus-visible`.
  - iOS nunca muestra ese aro si no hay teclado.
- **Causa:** `visor.js:3004`, `portada.querySelector(".empezar").focus({ preventScroll: true })`, y `showModal()` del aviso del Estudio (`estudio.js:488`), que enfoca el primer botón.
- **Corrección** (el visor ya sabe si se llegó con el tabulador: `body.foco-tab`, `visor.js:1499`):

```css
/* visor.css */
body:not(.foco-tab) #portada .empezar:focus-visible { outline: none; }
```

```js
// estudio.js, aviso del móvil: el foco al título (se lee primero y no enciende ningún botón)
h("h1", { id: "aviso-movil-titulo", tabindex: "-1", autofocus: true, text: "El Estudio necesita un ordenador o un iPad" }),
```

```css
/* estudio.css */
.aviso-movil-contenido h1:focus { outline: none; }
```

### UX-11 · P3 · Radar en el teléfono: «Ampliar» tapa un tercio del disco

- **Dónde:** visor, recorrido. Teléfono vertical (radar de 87,5 px) y sobre todo horizontal (73,5 px).
- **Captura:**
  - `ux/recortes/radar-movil-h.png`: el botón de 44 px tapa el cuadrante inferior derecho y roza el punto del visitante;
  - `v1/visor-1-recorrido-movil.png`.
- **Por qué importa:** el radar es una decisión del cliente (estilo Counter-Strike). En el teléfono, el botón tapa la parte del disco que el comprador mira para orientarse. «Ampliar» abre lo mismo que tocar el título (`visor.js:2685-2686`).
- **Causa:** `visor.css`, `#btn-ampliar { position: absolute; right: -0.25rem; bottom: -0.25rem }` con 44 px en táctil, sobre un disco de `--radar: 6.25rem` o `5.25rem`.
- **Corrección:** sacarlo del disco en el teléfono, tangente por fuera, con la misma zona de 44 px:

```css
/* visor.css */
@media (max-width: 540px), (max-height: 540px) and (orientation: landscape) {
  #btn-ampliar { right: calc(-1 * var(--alto-control-s) + 0.875rem); bottom: -0.375rem; }
}
```

  `#esquina` es una columna con sitio a la derecha del radar, porque la barra del sol es más ancha. Se mantiene el gesto de ampliar del radar, como en Mapas, donde la brújula y el minimapa no se tapan entre sí.

### UX-12 · P3 · Ficha: «Baños» huérfano en «Datos clave»

- **Dónde:** visor, ficha, teléfono y tablet vertical (en escritorio caben 2×2 en la tarjeta lateral).
- **Captura:** `v1/visor-4-ficha-movil.png` y `v1/visor-4-ficha-tablet.png`.
- **Por qué importa:** con 4 datos (los más habituales: construidos, parcela, habitaciones, baños), la rejilla de 3 deja uno solo en la segunda fila, que parece suelto. Es el primer bloque que lee el comprador.
- **Causa:** `paneles.css`, `.pn-datos { grid-template-columns: repeat(3, minmax(0, 1fr)) }`.
- **Corrección:**

```css
/* paneles.css: 4 datos → 2×2 en la hoja estrecha y 4 en fila si caben (tablet) */
.pn-datos:has(> :nth-child(4):last-child) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
@container (min-width: 34rem) { .pn-datos:has(> :nth-child(4):last-child) { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.pn-panel-cuerpo { container-type: inline-size; }
```

### UX-13 · P3 · Lo elegido y lo pulsado, de tres maneras distintas (y el radar pulsado casi no se ve en claro)

- **Dónde:** visor y Estudio, en claro y en oscuro.
- **Captura:**
  - `v1/visor-3-ajustes-movil.png`: «ES», «Automático» y «M» con aro dorado;
  - `v1/visor-1-recorrido-movil.png`: «Recorrido» con aro neutro;
  - `ux/recortes/columna-claro-movil.png`: el radar pulsado es un disco gris al 9 % con una cuña al 45 %;
  - `ux/cap/390x844-light-recorrido.png`: «Recorrido» elegido es una cápsula blanca opaca.
- **Por qué importa:**
  - El comprador aprende un «así se ve lo elegido», y en la pantalla de al lado cambia.
  - En claro no se distingue a simple vista si el radar está encendido.
  - La cápsula blanca opaca es un relleno sólido sobre el vidrio (el cliente lo pidió «sin rellenos sólidos»).
- **Causa:**
  - `tema.css`: `.c8-segmentado::after { box-shadow: inset 0 0 0 1px var(--c-acento-texto), … }` (aro dorado) frente a `.c8-segmentado.c8-vidrio::after` (aro del color del texto).
  - `--c-segmento: #ffffff` en claro.
  - `index.html:70`: `.ic-radar .relleno` con `opacity=".45"`.
- **Corrección:** un solo lenguaje, el de iOS 26: cápsula de vidrio más clara con canto del color del texto. El dorado queda solo para la acción principal.

```css
/* tema.css */
.c8-segmentado::after { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c-texto) 55%, transparent), var(--sombra-1); }
:root[data-tema="claro"] { --c-segmento: rgba(255, 255, 255, 0.78); }
.c8-pastilla .c8-boton[aria-pressed="true"] .ic-radar .relleno { opacity: 1; }
```

  Hay que comprobar en `pruebas/contraste.mjs` que el aro al 55 % sigue por encima de 3:1 sobre la cápsula (WCAG 1.4.11). Si no llega, se usa el 72 % que ya lleva hoy el segmentado sobre la foto.

### UX-14 · P3 · Duplicados que cuestan sitio («compacto y esencial»)

- **Visor · «Idioma» en tres sitios:** la portada (ES/EN), el menú «Más → Idioma» y «Ajustes → Idioma».
  - En el teléfono, «Más» tiene 9 entradas (`v1/visor-2-menu-mas-movil.png`).
  - Corrección: en `paneles.js:823`, no añadir `pn-idioma` al menú cuando «Ajustes» está en él, que es siempre. Se queda la portada para el primer uso y Ajustes para después.
- **Guía · «ANTES DE IR» dos veces seguidas:** en el selector de paso y como antetítulo de la sección (`v1/guia-0-inicio-movil.png`).
  - Corrección: `section.paso .fase { display: none; }` en el `<style>` de `asistente-osmo.html`. El selector ya lo dice, y en el móvil se ganan ~30 px.

### UX-15 · P3 · Hoja inferior: se arrastra solo por la cabecera y el gesto no es el de iOS

- **Dónde:** visor, ficha en la hoja (teléfono y tablet en vertical).
- **Por qué importa:** en Mapas o Fotos, la hoja se baja tirando del contenido cuando ya está arriba del todo, y un golpe rápido decide el tamaño. Aquí:
  1. solo responde la cabecera de precio y botones: ni la fila «Inmobiliaria Demo ↑ ✕» ni el contenido;
  2. la velocidad es la media de todo el gesto, así que un arrastre lento que acaba en golpe no salta de tamaño;
  3. no hay resistencia al pasar de los topes.
- **Causa:** `paneles.js:743-770` (`prepararArrastre`): `zona = e.target.closest(".pn-t-cab")`, `vel = (e.clientY - d.y) / (performance.now() - d.t)`, y un `Math.min/Math.max` duro.
- **Corrección:**

```js
// zona: también la cabecera del panel
const zona = (e) => e.target.closest(".pn-t-cab, .pn-panel-cab") && !e.target.closest("button:not([data-k='ficha'])");
// velocidad: solo los últimos 100 ms
ini.muestras = [[e.clientY, performance.now()]];                       // en pointerdown
ini.muestras.push([e.clientY, performance.now()]); ini.muestras = ini.muestras.filter(([, t]) => performance.now() - t < 100); // en pointermove
const [y0, t0] = d.muestras[0]; const vel = (e.clientY - y0) / Math.max(1, performance.now() - t0);  // en fin
// resistencia fuera de los topes (como UIScrollView): 1/3 del exceso
const crudo = ini.desp + dy, max = ini.total - alturaVisible("peek");
const desp = crudo < 0 ? crudo / 3 : crudo > max ? max + (crudo - max) / 3 : crudo;
```

  Tirar del contenido con `scrollTop === 0` (pull-to-dismiss) necesita `touchmove` no pasivo en `.pn-panel-cuerpo`. Va como mejora aparte si se quiere el gesto completo de iOS.

### UX-16 · P3 · Guía en el teléfono en horizontal: cabecera y pie se comen un tercio de la pantalla

- **Dónde:** Guía, `movil-h` (844×390).
- **Captura:** `v1/guia-0-inicio-movil-h.png`. La cabecera pegajosa mide 58 px, el pie 66 px y queda ~265 px de lectura. Además sale «Abrir el Estudio».
- **Por qué importa:**
  - El fotógrafo gira el teléfono para leer con la cámara en la mano y ve tres o cuatro líneas.
  - «Abrir el Estudio» en un teléfono lleva al aviso «El Estudio necesita un ordenador o un iPad».
- **Causa:** `asistente-osmo.html`, `.cabecera { position: sticky }` y `.pie` con relleno `--e-3` por arriba y por abajo; `.solo-grande` se decide por el ancho (`@media (min-width: 760px)`).
- **Corrección:**

```css
/* asistente-osmo.html */
@media (max-height: 540px) and (orientation: landscape) {
  .cabecera { position: static; }
  .pie { padding-block: var(--e-1) calc(var(--e-1) + env(safe-area-inset-bottom, 0px)); }
}
/* «Abrir el Estudio» solo donde el Estudio funciona: ratón, o tablet */
.solo-grande { display: none; }
@media (min-width: 760px) and (hover: hover) and (pointer: fine), (min-width: 760px) and (min-height: 600px) { .solo-grande { display: inline-flex; } .solo-movil { display: none; } }
```

### UX-17 · P3 · Estudio en el iPad: la barra son iconos sin nombre y el selector de estancia se corta

- **Dónde:** Estudio, `tablet` (820×1180) y `tablet-h` (1180×820).
- **Captura:**
  - `v1/estudio-1-fotos-tablet.png`: ojo, libro, contraste, «?» y casa, sin texto;
  - `v1/estudio-2-plano-tablet-h.png`: el selector de estancia queda en «Te ▾».
- **Por qué importa:**
  - El agente no técnico no sabe que el ojo es «Vista previa» ni que el libro es «Guía Osmo 360». En el iPad no hay `title` que se vea al pasar el ratón.
  - El selector cortado no dice en qué estancia está la vista previa.
- **Causa:**
  - `estudio.css`, `@media (max-width: 53.75em)` (`#btn-vista .texto, #btn-guia .corto { display: none }`).
  - `@container (max-width: 21rem)`: el segmentado «Móvil · Ordenador» con texto deja al `<select>` 5,5 rem.
- **Corrección:**
  - Barra: en táctil, mantener el nombre corto de «Vista previa» («Vista») y de la Guía («Guía»). Caben en 820 px, porque el nombre del proyecto ya se recorta.

```css
@media (max-width: 53.75em) and (pointer: coarse) { #btn-vista .texto, #btn-guia .corto { display: inline; } #btn-vista, #btn-guia { width: auto; padding: 0 var(--e-3); } }
```

  - Vista previa: en contenedores estrechos, el selector de estancia pasa a su propia fila, a todo el ancho, y el segmentado se queda con la fila de arriba. No se recorta nada y no hacen falta iconos nuevos.

```css
/* estudio.css: sustituye a la regla de @container (max-width: 21rem) para el <select> */
@container (max-width: 21rem) {
  .vista-cab { flex-wrap: wrap; }
  .vista-cab select { order: 3; flex: 1 1 100%; max-width: none; }
}
```

### UX-18 · P3 · Escritorio: el nombre del inmueble es lo más pequeño de la pantalla

- **Dónde:** visor, recorrido. Portátil, escritorio y escritorio XL.
- **Captura:** `v1/visor-1-recorrido-escritorio.png` y `v1/visor-1-recorrido-escritorio-xl.png`. «Finca señorial con jardín» va a 13–15 px arriba a la izquierda, y el precio a 28 px arriba a la derecha.
- **Por qué importa:**
  - En una finca de 1,95 M€ el nombre es parte de la marca del anuncio.
  - En escritorio hay sitio de sobra, y el comprador ve primero el precio y luego la foto, pero no sabe «qué casa es» sin buscarlo.
  - En Fotos o Casa de macOS, el título de la ventana es el texto más claro de la barra.
- **Causa:** `visor.css`, `#titulo { font: var(--peso-semi) var(--t-ui) / 1.25 … }` en todos los tamaños.
- **Corrección:**

```css
/* visor.css: con ratón y pantalla grande, el título con el peso de un titular de panel (la píldora crece 4–6 px) */
@media (hover: hover) and (pointer: fine) and (min-width: 1280px) {
  #titulo { font-size: var(--t-destacado); }
  #estancia { font-size: var(--t-sec); }
}
```

### UX-19 · P3 · En la hoja, la entrada a la ficha es un chevron de 12 px

- **Dónde:** visor, tarjeta plegada, en el teléfono y la tablet vertical («6 hab. · 480 m² ⌃»).
- **Captura:** `v1/visor-1-recorrido-movil.png` y `ux/cap/820x1180-light-recorrido.png`.
- **Por qué importa:**
  - La ficha (descripción, certificado, hipoteca, documentos) es el contenido de más valor para el comprador después de la foto.
  - En escritorio la tarjeta dice «Ver ficha ›» en el color de acento. En el teléfono solo hay un chevron gris del tamaño de la letra y el asa de la hoja.
  - La mayoría no descubre que el precio es un botón.
- **Causa:** `paneles.js:588` solo pinta `.pn-t-ver` («Ver ficha») con `lateral`.
- **Corrección:** pintar también «Ficha» en la hoja, en el color de acento, junto al chevron. Ocupa ~40 px y, si no cabe, la fila ya pasa los botones abajo:

```js
// paneles.js:588
h("span", { class: "pn-t-ver" }, tr(lateral ? "ficha.ver" : "ficha.corto")),   // clave nueva en i18n.js: «Ficha» / «Details»
```

```css
/* paneles.css */
:is(.pn-disp-hoja, .pn-disp-compacta) .pn-t-ver { margin-left: var(--e-1); font-size: var(--t-sec); }
@media (max-width: 374px) { :is(.pn-disp-hoja, .pn-disp-compacta) .pn-t-ver { display: none; } }   /* 360 px: solo el chevron */
```

---

## 4. Propuesta: escala tipográfica y objetivos táctiles por dispositivo

Se apoya en los tokens actuales de `tema.css`: raíz fluida × talla, `--t-*`, `--alto-control*` y `--toque-minimo`. No añade tokens de color ni de material. Los valores son de la talla M; con S se multiplican por 0,875 y con L por 1,18, sin bajar nunca de los suelos.

### 4.1 Raíz actual (M)

| Dispositivo | Tamaños | Raíz |
|---|---|---|
| Teléfono | 360–430 × 740–932 y 844×390 | 14 px |
| Tablet vertical | 768×1024 y 820×1180 | 14,8–15,2 px |
| iPad Pro horizontal | 1366×1024 | 16,7 px |
| Tablet horizontal | 1180×820 | 15,2 px |
| Portátil | 1280×800 | 15 px |
| Escritorio | 1440×900 | 15,75 px |
| Escritorio XL | 1920×1080 | 17,1 px |

### 4.2 Escala tipográfica

| Token (uso) | Hoy: teléfono | Hoy: tablet 820 | Hoy: escritorio 1440 | **Propuesta: teléfono** | **Propuesta: tablet** | **Propuesta: escritorio** | Equivalente en iOS |
|---|---|---|---|---|---|---|---|
| `--t-micro` (mayúsculas: «DATOS CLAVE», «ZONA DE DÍA») | 11 | 11 | 11 | **12** | **12** | **12** (12,8 a 1920) | Caption 2 (11) → 12 por el encargo |
| `--t-pie` (pies, m² de la tarjeta, sellos) | 11 | 11,4 | 11,8 | **12** | **12** | **12–12,8** | Caption 1 (12) |
| `--t-sec` (secundario, etiquetas de campo) | 12 | 12,3 | 12,8 | **13** | **13** | **12,8–13,9** | Footnote (13) |
| `--t-ui` (botones, menús, modos) | **12,25** | 13,3 | 13,8 | **15** | **15** | **13,1–15** | Subheadline (15) en táctil; 13 en macOS |
| `--t-cuerpo` (descripción, formularios, portada) | **14** | 15,2 | 15,75 | **16** | **16** | **15–17** | Callout/Body (16–17) |
| `--t-destacado` (precio de la hoja, subtítulos) | 15,75 | 17 | 17,7 | **17** | **17** | **17,7–19** | Headline/Title 3 (17–20) |
| `--t-titulo` (títulos de panel) | 19,25 | 20,8 | 21,7 | 19,25 (igual) | 20,8 | 21,7 | Title 2 (22) |
| `--t-titulo-g` (precio lateral, H1 del Estudio y de la Guía) | 24,5 | 26,5 | 27,6 | igual | igual | igual | Title 1 (28) |
| `--t-display` (precio de la portada) | 31,5 | 34 | 35,4 | igual | igual | igual | Large Title (34) |

- **Implementación:** son los dos bloques de UX-1. El primero (suelos) vale para todos los dispositivos y el segundo (`@media (pointer: coarse)`) sube la letra de controles y texto en el teléfono y la tablet.
- **Distancia de uso:**
  - Teléfono (25–35 cm) y tablet (35–45 cm): la letra se queda como en iOS y iPadOS, que usan la misma escala en los dos.
  - Escritorio (50–70 cm): ya escala con la raíz fluida; solo necesita los suelos.
- **Interlineado:** sin cambios (`--lh-ui` 1,3 y `--lh-texto` 1,5). La descripción de la ficha usa 1,6 y está bien.
- **Comprobación:** el contraste no cambia (los colores no se tocan). Hay que repetir la matriz de `auditar.mjs` en `movil-s`, `movil-h`, `tablet` y `portatil` con las tallas S y L, y comprobar que `letraPeque` queda vacía.

### 4.3 Objetivos táctiles

| | Teléfono | Tablet | Escritorio (ratón) |
|---|---|---|---|
| Mínimo de cualquier control | **44×44** (`--toque-minimo`, ya en `@media (pointer: coarse)`) | **44×44** | **24×24** (WCAG 2.5.8); 32 recomendado en iconos |
| Control habitual (`--alto-control`) | 44 (ya: `max(2.75rem, 44px)`) | 44–46 (ya) | 37,5–42,75 (`2.5rem`, ya) |
| Control pequeño (`--alto-control-s`) | 44 (ya) | 44 (ya) | 30–34 (`2rem`); «Ampliar» del radar, ≥ 36 (ya, A21) |
| **Acción principal** («Empezar visita», «Contactar», «Enviar por WhatsApp», «Siguiente» de la Guía, «Continuar» del Estudio) | **48** | **48** | 40–46 (`.c8-boton--l`, `2.875rem`) |
| Zona invisible de los objetivos dibujados pequeños («i», pines, etiquetas 3D, «Ampliar») | `::after` hasta **44** | **44** | Sin ampliar (el puntero es preciso) |
| Separación entre objetivos distintos | ≥ **8 px**; 4 px dentro de una misma pastilla de botones de 44 | ≥ 8 px | ≥ 4 px |
| Borde de pantalla | ≥ 10–12 px (`--hud`) más `env(safe-area-inset-*)` | igual | igual |

Para la acción principal propongo un solo token y su uso:

```css
/* tema.css, en «Controles» */
--toque-principal: 48px;   /* acción principal en táctil (Apple: 44 pt mínimo; Material: 48 dp) */
/* tema.css, @media (pointer: coarse) */
.c8-boton--l { min-height: max(2.875rem, var(--toque-principal)); }
/* visor.css */
#portada .acciones .c8-boton { min-height: max(3rem, var(--toque-principal)); }
/* paneles.css, @media (pointer: coarse) */
.pn-t-contactar { min-height: var(--toque-principal); }   /* «Enviar por WhatsApp» (.pn-enviar) ya es .c8-boton--l */
/* asistente-osmo.html */
@media (pointer: coarse) { .pie .c8-boton { min-height: var(--toque-principal); } }
```

## 5. Revisión por dispositivo

### 5.1 Teléfono · comprador en el visor

- **Primera impresión (3 segundos):** buena. La portada dice qué es, cuánto cuesta y qué hacer («Empezar visita» en dorado). Después:
  - la pista «Arrastra para mirar · toca las flechas para avanzar» late dos veces;
  - la «i» tiene halo;
  - «Contactar» está en la zona del pulgar.

  Capturas: `ux/cap/390x844-light-portada.png` y `ux/cap/390x844-light-primer-uso.png`.
- **Jerarquía:** se ve primero la foto, luego el precio y «Contactar», y después el título. Es lo correcto.
  - El HUD de arriba (título, sol y radar a la izquierda; columna de 4 iconos a la derecha) ocupa ~210 px. Arriba solo hay consulta, como pide el encargo, y en reposo se aparta.
  - El icono del radar (un círculo con barrido) se lee como un velocímetro. Es poco importante porque el radar está a la vista.
- **Dónde se pierde:**
  - la ficha, porque su entrada no dice «ficha» (UX-19);
  - «Visita guiada», que en el teléfono está en «Más» y en la portada, en la tablet vertical en la tira, y en la tablet horizontal y el escritorio en la tarjeta (coordinar con B);
  - la maqueta, con su doble rótulo (UX-5).
- **Interacción:** el pellizco del visor funciona y «Acercar» y «Alejar» están en «Más» (A2). Faltan:
  - el hover pegajoso (UX-3);
  - el gesto de la hoja (UX-15).

### 5.2 Tablet · comprador (iPad) y agente (Estudio)

- **Visor en vertical:** tiene diseño propio (modos sobre la tira, la tira con «Visita guiada» y la tarjeta ancha).
  - Hereda del teléfono el tamaño de la esquina superior izquierda y de la letra: título a 13,3 px y estancia a 11,4 px.
  - Con UX-1 (15 y 12 px) queda a la altura de iPadOS. En Mapas para iPad la tarjeta flota a un lado también en vertical (coordinar con B).
- **Visor en horizontal:** es la disposición de escritorio con objetivos de 44 px. Está bien. Solo falla el hover pegajoso.
- **Estudio:**
  - los pasos en carril de iconos con nombre de 11 px (12 con UX-1);
  - barra de iconos sin nombre (UX-17);
  - pista del plano con lenguaje de ratón (UX-7);
  - «Avanzado» de 14 px (UX-4);
  - tres dorados a la vez (UX-9).

  El plano en sí se maneja bien con el dedo: hay pellizco (`estudio-plano.js:886`) y botones de borrar.

### 5.3 Escritorio y portátil · comprador y agente

- **Visor:** buena distancia de lectura. La tarjeta lateral es de 23,5 rem: 370 px a 1440 y 402 px a 1920. Hay jerarquía clara: precio de 28 px, «Contactar» en dorado y luego «Foto de la vista».
  - El título es demasiado discreto (UX-18).
  - El hover del vidrio con luz especular está bien acotado al ratón (`tema.css`, `@media (hover: hover) and (pointer: fine)`).
- **Estudio:** el estado vacío del paso Fotos es ejemplar (icono, título, una acción y el enlace a la Guía). La vista previa «Ordenador» engaña (UX-6).
  - A 1280 px los pasos pasan a carril de iconos y se pierden los subtítulos («2 por corregir»), aunque la insignia queda. Es un portátil muy común, así que conviene revisar el punto de corte con B: `@media (max-width: 1280px)` podría ser `(max-width: 1279px)`.
- **Guía:** columna de 46 rem bien centrada y legible. En escritorio, el botón «Abrir el Estudio» de la cabecera es un `c8-boton--s` de 30 px. Es correcto con ratón.

### 5.4 Coherencia entre el visor, el Estudio y la Guía

| Aspecto | Estado | Nota |
|---|---|---|
| Radios | Bien | Pastillas en controles; `--r-4` en paneles flotantes y tarjetas; `--r-5` en tarjeta y diálogos. Única diferencia: el menú «Proyecto ▾» del Estudio usa `--r-3` y «Más» del visor `--r-4` → `.menu-proyecto { border-radius: var(--r-4); }` |
| Sombras y vidrio | Bien | `--vidrio-ambiente` en el Estudio y la Guía, y vidrio adaptativo en el visor. Excepción: la cápsula blanca opaca del segmentado en claro (UX-13) |
| Estado elegido | A unificar | Aro dorado, aro neutro y relleno dorado (UX-9, UX-13) |
| Iconos | Bien | Trazo de 1,6, estilo SF Symbols y en rem en los tres (V7) |
| Letra | A subir en táctil | UX-1 |
| Acción principal | Bien en el visor | El dorado se reparte en el Estudio (UX-9) |

### 5.5 Nivel iOS (Fotos, Mapas y Casa en iPhone y iPad)

| Patrón de Apple | cre8eight hoy | Distancia |
|---|---|---|
| Botones flotantes agrupados en una cápsula de vidrio (Mapas) | Columna de 4 en el teléfono y barra en la tablet y el escritorio | ✓ Igual |
| Hoja con asa y tres alturas (Mapas, Buscar) | Asa y alturas peek, 50 % y 90 % | Falta el gesto completo (UX-15) |
| Cromo que se aparta con la foto (Fotos) | `ui-inactiva` a los 3,5 s: quedan el radar y la píldora «precio · Contactar» | ✓ Mejor que Fotos para vender |
| Letra: texto de 17 pt y botones de 15–17 pt | 14 px y 12,25 px | ✗ (UX-1) |
| Pulsado con encogimiento y muelle; sin hover en táctil | `scale(0.96)` con muelle ✓; hover pegajoso ✗ | UX-3 |
| Elegido sin color (pestaña de vidrio más clara) | Así en la foto, pero con aro dorado en los paneles | UX-13 |
| Una sola acción principal por pantalla | Así en el visor, pero hasta 3 en el Estudio | UX-9 |
| Foco de teclado solo con teclado | Anillo al cargar | UX-10 |

## 6. Accesibilidad (WCAG 2.1 AA, lo que toca a la adaptación)

La auditoría completa es [fase4-accesibilidad.md](fase4-accesibilidad.md). Aquí está solo lo que cambia con el tamaño.

| Criterio | Estado | Hallazgo |
|---|---|---|
| 1.4.4 Cambio de tamaño del texto / talla S | Con S, botones de 10,7 px en el teléfono | UX-1 |
| 1.4.11 Contraste de lo no textual (estado elegido) | Cumple; el radar pulsado es débil en claro | UX-13 |
| 2.4.7 Foco visible | Cumple; sobra al cargar | UX-10 |
| 2.5.5 / 2.5.8 Tamaño del objetivo | 4 objetivos táctiles de menos de 44 px; «Avanzado» de 14 px también con ratón (< 24) | UX-4 |
| 1.3.4 Orientación | Cumple en el visor y la Guía; el plano del Estudio en horizontal no se puede usar | UX-8 |
| 3.3.2 Instrucciones | La pista del plano no sirve en táctil | UX-7 |

## 7. Lo que funciona bien (no tocar)

- **La tarjeta del inmueble** se adapta a cada dispositivo: lateral en escritorio, hoja en vertical, fila en el teléfono horizontal y píldora en reposo. «Contactar» es siempre lo más visible y está donde llega el pulgar.
- **El contacto por WhatsApp en el teléfono horizontal** pasa a dos columnas en vez de una hoja interminable (`v1/visor-5-contacto-movil-h.png`).
- **«Estancias y plano» como hoja en el teléfono**: plano arriba, lista con miniaturas de 44 px y la estancia actual marcada.
- **El vidrio adaptativo:** se lee sobre la terraza blanca y sobre el salón oscuro, en claro y en oscuro.
- **El Estudio vacío:** una sola acción y el camino a la Guía si aún no hay fotos.
- **La Guía:** casillas con toda la fila tocable, «Siguiente» abajo a la derecha y el progreso visible.

## 8. Las 5 mejoras que más suben la calidad percibida (todas dentro de «compacto y esencial»: no añaden piezas)

1. **Letra a la medida del dedo (UX-1 y UX-2):** botones a 15 px, texto a 16 px y nada por debajo de 12 px en el teléfono y la tablet. Es lo que más separa hoy el visor de una app de Apple, y son 10 líneas de `tema.css`.
2. **Una sola maqueta limpia (UX-5):** un rótulo por estancia y la casa centrada en la zona libre. Es la vista de conjunto que el comprador enseña a su pareja, y hoy parece un borrador.
3. **Táctil de verdad (UX-3, UX-4 y UX-10):** sin hover pegajoso, todos los objetivos de 44 px, la acción principal de 48 y sin anillos al cargar. Son detalles que el usuario no nombra pero nota como «se siente barato».
4. **Una sola acción dorada por pantalla y lo elegido sin color (UX-9 y UX-13).** El agente sabe siempre qué toca después, y el visor y el Estudio hablan el mismo idioma visual de iOS 26.
5. **Vista previa honesta en el Estudio (UX-6),** con la pista del plano en el idioma del dedo (UX-7). El agente ve lo que verán sus clientes y no tropieza en el paso donde más se pierde.

## 9. Coincidencias probables con A y B

- **UX-8** (plano del Estudio en el teléfono horizontal) y **UX-16** (Guía en horizontal) son también de maquetación (B) y de ingeniería (A, `max-height` y orientación).
- **UX-6** toca la arquitectura de la vista previa (A).
- La posición de «Visita guiada» por dispositivo (§ 5.1) y el carril de pasos a 1280 px (§ 5.3) son de B: aquí solo se señalan.
- **UX-1** cambia medidas de las que dependen los mapas de zonas de B: conviene aplicarlo antes de verificar sus propuestas.
