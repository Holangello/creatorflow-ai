# cre8eight · Cierre de la fase 4: conciliación de las auditorías finales

Informes:
- [visual](fase4-visual.md): P1 0 · P2 7 · P3 11;
- [accesibilidad](fase4-accesibilidad.md): P1 2 · P2 12 · P3 9;
- [Maverick](fase4-maverick.md): P1 2 · P2 9 · P3 9.

Este documento **manda**: dice qué se aplica, quién lo hace y qué pasa a la hoja de ruta.

## 0. Ya hecho (commit `d17a58c`)

| Id | Qué |
|---|---|
| M1 | Sin WhatsApp, CRM ni email no se ofrece «Contactar»; el Estudio pide confirmación al publicar sin contacto |
| M2 | three.js dentro del ZIP publicado; aviso de la portada si el visor no arranca |
| A1 | Atajos de una letra apagados de verdad (solo con el foco en el lienzo o en el modo juego); interruptor también en táctil |
| A2 | «Acercar» y «Alejar» en «Más» en táctil; la maqueta con flechas y + − |
| M9, M13, M14 | Punto de millar; teléfono opcional por WhatsApp o email; el campo enfocado vuelve a verse al cambiar de talla |

## 1. Sistema de diseño (orquestador, ya en `tema.css` y `tema.js`)

| Id | Qué |
|---|---|
| V1 | Suelo de 11–12 px para `--t-micro`, `--t-pie` y `--t-sec` |
| V2, V3 | `--ambiente` común (más presente en claro) y `--vidrio-ambiente` para paneles sobre ese ambiente |
| V11 | `.logo-e` en `tema.css` (Estudio y Guía) |
| A3 | `.c8-boton.c8-vidrio` conserva el vidrio («Ampliar» del radar) |
| A7 | Aro en el estado pulsado (claro) y en la opción elegida del segmentado |
| A14 | `--c-borde-campo` ≥ 3:1 en campos (`.c8-campo`, `.c8-entrada`) |
| A20 | `prefers-contrast: more` → transparencia reducida; colores forzados en el estado pulsado |
| M4 | «Reducir transparencia» sin `backdrop-filter` |
| Esencialismo | Fuera `--fuente-editorial`, `.c8-editorial`, `.c8-tarjeta`, `.c8-entrar` y `.c8-pastilla--vertical` (sin uso) |

**Además, el orquestador:**
- Exportación:
  - `leeme()` con `url_publica` y el mismo código para incrustar que el Estudio (M6, M7);
  - el dossier no dice «en trámite» sin datos;
  - plano y vídeo exportados en Inter (V18).
- Pares nuevos en `pruebas/contraste.mjs` y documentación.

## 2. Paquetes en paralelo

### 2.1 Núcleo: `visor.js`, `visor.css`, `maqueta.js`, `plano.js`, `index.html`

| Id | Qué |
|---|---|
| M3 | Ondas de la música sin animación infinita: quietas mientras suena, con un latido corto al empezar y al pasar el ratón |
| M5 | Marca de color extremo: relleno del acento acotado por tema (no blanco sobre vidrio claro ni negro sobre oscuro), con `--c-sobre-acento` recalculado |
| M7 | `enviarPadre()` solo con un padre del mismo origen |
| M10 | Nombres de agencia larguísimos en la portada del móvil |
| M11 | Pista sin «moverte» con una sola foto; la pista se oculta al abrir un diálogo o la hoja |
| M12 | La portada no repite los datos si el título ya los lleva |
| M15 | Caché de texturas más prudente en escritorio |
| A6 | Anillo de foco que se ve sobre la foto: `#lugar`, «Ampliar», etiquetas, «i» y lienzo |
| A10 | El foco no se pierde al cambiar de estancia con una etiqueta 3D, y vuelve al «i» al cerrar su nota |
| A12 | Con la letra al 200 %, los modos no se montan con la barra de vista |
| A13 | Nombre accesible de `#lugar` con el título visible |
| A16, A17 | Anuncios por regiones fijas; «Reintentar» no se va con el foco encima |
| A18 | Los modos sin texto duplicado para el lector, y `h1` oculto con el título |
| A21 | «Ampliar» ≥ 36 px (44 px en táctil) y filas de «Estancias y plano» de 44 px |
| A23 | Volver a medir el vidrio al abrir un diálogo o menú de los paneles |
| V4 | Maqueta encuadrada según la proporción de la pantalla, y al girar |
| V8 | Barra de vista con el mismo material que el título y los modos |
| V9 | Comparador por debajo del HUD |
| V11 | Marca de la pantalla de error: `cre<span>8</span>eight` |
| V12 | La foto de la vista sin las flechas del suelo |
| V14 | Superficies sin decimales; en el plano, los enlaces antes que los rótulos |

### 2.2 Paneles: `paneles.js`, `paneles.css`, `i18n.js`

| Id | Qué |
|---|---|
| A4, V12 | Nombre de la foto adjunta arriba de la miniatura y con velo completo |
| A8 | Hojas del teléfono modales de verdad: `aria-modal` e `inert` |
| A11 | En reposo, los botones de la tarjeta se ocultan solo a la vista |
| A12 | La etiqueta de la tarjeta pasa a dos líneas con espaciado aumentado |
| A16, A17 | Confirmación del contacto anunciada; «Deshacer» no se va con el foco encima |
| A18 | «S, pequeño…»; notas de los interruptores con `aria-describedby` |
| A21 | Opciones de tamaño y «Ver ficha» de 44 px en S |
| M10 | Tabla de superficies con nombres larguísimos |
| V5 | «Estilo y luz» más ancho en escritorio; nombres que se parten |
| V10 | Un solo dibujo por gesto: compartir y ajustes con los trazos del núcleo |
| V13 | Galería sin imagen huérfana |

### 2.3 Estudio y Guía: `estudio*.js`, `estudio.css`, `asistente-osmo.html`

| Id | Qué |
|---|---|
| V2 | Paneles sobre el ambiente con `--vidrio-ambiente` (sin volver a poner el desenfoque) |
| V3 | Guía con fondo de ambiente y la marca «c8» |
| V6 | Barra superior con margen en el iPad |
| V7 | Iconos en rem, que siguen la talla |
| V10 | La Guía sin glifos «?» ni «✕»: iconos SVG |
| V15 | Cabecera y pie de la Guía alineados |
| V16 | Vista previa más ancha en ultrapanorámico y 4K |
| V17 | «Ej.: 349.000» en los marcadores |
| A5 | Letras del certificado legibles y de 44 px |
| A6 | Foco del menú «Proyecto» |
| A9 | Cajón de la vista previa cerrado e inerte |
| A12 | Barra superior con la letra al 200 %; el aviso del móvil solo en táctil |
| A14 | Casillas de la Guía con `--c-borde-campo` |
| A15 | Plantas con `tablist` |
| A18 | Nombre de «Más herramientas» |
| A19 | La Guía anuncia el paso nuevo |
| A21 | Enlace «¿Aún no tienes las fotos?» de 44 px en el iPad |
| M6 | «Dirección final del recorrido» editable en Publicar |
| M7 | El código para incrustar sin `?embed` y con `clipboard-write; web-share` |
| M12 | Título automático con la zona en vez de repetir los datos |

## 3. Decisiones (se enseñan al cliente)

- **M16 · «Modo juego» en la barra del escritorio: se queda.** La navegación tipo Minecraft es un requisito del cliente y el botón la hace descubrible. W A S D también entra.
- **M17 · Marca blanca (ocultar «Creado con cre8eight»): la decide el cliente** según cómo venda cre8eight. Se deja preparado para la fase 5 si lo pide.
- **Vidrio adaptativo por pieza en vez de por página:** no. El plan eligió la regla del peor caso a propósito (siempre AA).

## 4. Hoja de ruta (no son correcciones de esta fase)

- M8: demo con fotos 360 reales (fase 5, si hay fotos con licencia).
- M18: publicar con un clic o alojamiento propio.
- M19: estadísticas para el propietario.
- M20: ser proveedor compatible en idealista y en Adevinta (Fotocasa, habitaclia).
- A22: dibujar el plano con el teclado.
- Vidrio ligero automático en móviles lentos (M4, parte automática).
