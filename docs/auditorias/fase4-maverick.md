# cre8eight · Auditoría Maverick de la fase 4 (abogado del diablo)

Auditor: Maverick (C). Encargo: `docs/auditorias/fase4-encargos-auditoria.md` § C. Rama `ccr-40d07831-qbgzrt`, 15/10/2026.

## Resumen y veredicto

- **El flujo completo funciona de punta a punta y sin errores de consola.** Guía en el móvil → enlace → Estudio, que pone los nombres de la lista a las fotos → ZIP y HTML autónomo → visor publicado → WhatsApp con la foto en el portapapeles y el enlace a la vista exacta. Las fotos del tamaño de la Osmo 360 (120 MP, unos 30 MB) entran a unos 8 s por foto.
- **Cambiar en caliente el tema, la talla o la transparencia, o girar el teléfono, con un diálogo abierto no pierde nada:** ni lo escrito, ni el foco, ni el diálogo.
- **El pintado bajo demanda cumple:** 0 fotogramas de WebGL en reposo en las 48 medidas. Pero la animación infinita de las ondas de la música obliga a recomponer el vidrio 60 veces por segundo sin que nadie toque nada:
  - la GPU trabaja al 69–115 % de un núcleo, frente al 0–1 % con la música en silencio;
  - con la ficha abierta, el navegador cae a 10–14 fps.
- **«Reducir transparencia» no aligera:** el `backdrop-filter` se queda puesto, con `blur(0px)`.
- **Hay dos fallos de contingencia que bloquean la entrega:**
  - Sin canal de contacto, el visor dice «Foto copiada, pega en WhatsApp» sin haber abierto nada. La consulta se pierde.
  - El ZIP publicado depende de `cdn.jsdelivr.net`. Si el CDN cae, el recorrido se queda cargando para siempre y no dice nada.
- **Negocio:** el sistema de diseño es premium, pero la demo no lo es. Lo que más falta para el día a día de una inmobiliaria española es alojar y publicar con un clic, las estadísticas para el propietario y entrar en idealista.

**Veredicto: se puede entregar después de corregir M1 y M2,** que son cambios pequeños. Antes de enseñarlo como «premium» conviene resolver de M3 a M8.

## Cómo se ha probado

**Dónde está todo.** Los scripts, las capturas y las medidas están en `/tmp/claude-0/-home-user-creatorflow-ai/9aa10f93-9bbe-52c5-91f2-e21dabbb4196/scratchpad/auditoria-f4/maverick/`. Más abajo los nombres de archivo son relativos a esa carpeta.

**Scripts:**

| Script | Qué hace |
|---|---|
| `flujo.mjs` | Guía → Estudio → ZIP y HTML autónomo → visor → WhatsApp. El ZIP se sirve solo, sin el repositorio detrás |
| `rendimiento.mjs` | Rendimiento en el portátil y en el teléfono, con CPU ×1, ×4 y ×6 |
| `experimento.mjs` | Ondas paradas, `backdrop-filter: none` y CDN caído |
| `raros.mjs`, `portada-larga.mjs`, `ficha-larga.mjs` | Datos raros |
| `caliente.mjs` | Cambios en caliente |
| `foto120.mjs`, `foto120b.mjs`, `genera120.py` | Tres JPG de 15520×7760 y unos 30 MB |
| `iframe.mjs` | Recorrido incrustado en una web de otro origen |
| `controles.mjs` | Controles de la primera pantalla |

**Condiciones de medida:**
- WebGL por software (SwiftShader) en una máquina de 4 núcleos compartida con otros dos auditores; la carga media estaba entre 4 y 8.
- Los fps absolutos no valen como referencia de un portátil real. Se comparan variantes en la misma sesión, repitiendo de 2 a 3 veces en orden alterno, y se dan rangos.
- La CPU de la GPU (SwiftShader: WebGL más composición del desenfoque) se lee de `/proc` del proceso `gpu-process`.

## Hallazgos

### P1 · Bloquean la entrega

#### M1 · Recorrido sin canal de contacto: falsa confirmación y consulta perdida

- **Dónde:** visor, diálogo «Pregunta por esta vivienda». Visto a 1280×800 en claro y a 390×844 en oscuro, talla M. Tours `sin-contacto` y `una-foto`: ni `contacto.whatsapp`, ni `webhook`, ni `agente`.
- **Pruebas:**
  - Capturas: `raros/sin-contacto-1280x800-claro-4-contacto.png`, `…-5-enviado.png` y `raros/sin-contacto-390x844-oscuro-5-enviado.png`.
  - Medida: en `raros/resultado.json`, `envio.wa = []` y una sola página abierta en los cuatro casos.
- **Qué pasa:**
  - El botón dice «Enviar por WhatsApp». Al pulsarlo no se abre nada.
  - Aun así, la pantalla dice «Foto 1 de 1 copiada · Pega la foto con Ctrl+V y pulsa enviar · Ya lo he enviado». «Abrir WhatsApp de nuevo» tampoco hace nada.
  - Por qué: `canalContacto()` (`paneles.js:1576`) devuelve `"whatsapp"` aunque no haya número, y `enviarWhatsApp()` (`:1640`) pasa a «pegar» sin comprobar que `abrirWhatsApp()` devolvió `false`.
  - El Estudio marca «Falta el contacto» como error, pero deja descargar el ZIP y el HTML: «Puedes descargar igualmente» (`estudio-exportar.js:150`).
- **Por qué importa:** es la función que vende. El visitante cree que ha preguntado y la agencia no recibe nada. Una pantalla que miente es peor que un error.
- **Propuesta:**
  - En `paneles.js`, que `canalContacto()` devuelva `"ninguno"` cuando no haya WhatsApp, CRM ni email.
  - Con `"ninguno"`, «Contactar» no se pinta o abre un aviso honesto: «Esta inmobiliaria aún no ha configurado el contacto», con `marca.web` si existe.
  - Nunca pasar a `pantallaPegar()` si no se abrió WhatsApp.
  - En el Estudio, que el ZIP y el HTML pidan confirmación explícita con «Falta el contacto».
  - Añadir una prueba en `e2e-paneles` y la fila de contingencia en `docs/calidad.md`.

#### M2 · El recorrido publicado (ZIP) depende de cdn.jsdelivr.net sin plan B

- **Dónde:** el ZIP de «Tu web» servido solo, en un teléfono de 390×844, con `cdn.jsdelivr.net` caído.
- **Pruebas:** captura `experimento/c-cdn-caido-20s.png`; en `experimento/resultado.json`, `listo: false` a los 20 s.
- **Qué pasa:**
  - El `index.html` del ZIP carga `three`, `three/addons` y `@sparkjsdev/spark` desde jsDelivr (importmap).
  - Si el CDN no responde (caída, red de empresa o filtro), el módulo no se evalúa. Queda para siempre la tarjeta de la portada vacía, con la barra de progreso al 5 % y «Creado con cre8eight»:
    - sin mensaje ni «Reintentar»;
    - sin la ficha ni el contacto.
  - `docs/calidad.md` no tiene esta fila.
  - El HTML autónomo no tiene el problema: lleva three.js dentro, y en `flujo/resultado.json` sale `red: []`.
  - Además, cada visita envía la IP del visitante a un tercero.
- **Por qué importa:**
  - Es un punto único de fallo para todos los recorridos de todas las agencias a la vez, y la regla del cliente pide un plan de contingencia para cualquier fallo.
  - Arreglarlo cuesta poco: `three.module.min.js` (365 kB) más `three.core.min.js` (385 kB) son unos 188 kB comprimidos.
- **Propuesta:**
  - En `exportar.js` (`ARCHIVOS_VISOR`, línea 304), copiar en `vendor/three/` el núcleo y los complementos que use el visor (OrbitControls y GLTFLoader), y Spark solo si hay paseo libre. Reescribir el importmap del `index.html` exportado a rutas locales. Otra opción es publicar con `dist/visor-autonomo-ligero.js`.
  - Plan B en `index.html`: un guardián con un script clásico en línea. Si a los 20 s `window.visor?.listo` no es `true`, se cambia la barra por «No se ha podido cargar el recorrido · Reintentar» y, si `tour.json` se puede leer, un enlace a WhatsApp.
  - Añadir la fila en `docs/calidad.md`.

### P2 · Conviene

#### M3 · Las ondas de la música son infinitas: el vidrio se recompone a 60 Hz en reposo

- **Dónde:** visor con música, que es lo normal: `autoplay` viene activado por defecto en el Estudio y suena tras «Empezar visita». Visto a 1280×800 en oscuro y en claro con la ficha abierta, y a 390×844 en claro con CPU ×1, ×4 y ×6. La interfaz ya estaba en reposo (`ui-inactiva`).
- **Pruebas:** `rendimiento/resultado-portatil.json`, `rendimiento/resultado-movil.json`, `rendimiento/log-*.txt` y `experimento/resultado.json`.

  | Reposo, 4 s | Con música (ondas) | Sin música |
  |---|---|---|
  | Portátil 1280×800: CPU del proceso GPU | 85–115 % | 0–1 % |
  | Portátil con la ficha abierta: fps de rAF / GPU | **9,7–14,2 fps** / 156–224 % | 59,6–60,1 fps / 1 % |
  | Teléfono 390×844 (×1, ×4, ×6): GPU | 69–115 % | 1 % |
  | Fotogramas WebGL del visor | 0 | 0 |

  Experimento con la ficha abierta, en la misma sesión:

  | Variante | rAF | GPU |
  |---|---|---|
  | Normal | 5,8–6,5 fps | 120–123 % |
  | Solo se paran las ondas por CSS | 41–45,5 fps | 41–43 % |

- **Qué pasa:**
  - `#btn-sonido.sonando .onda { animation: onda 1.6s … infinite }` (`visor.css:111`) anima la opacidad de dos trazos SVG dentro de `#barra-vista`, que es vidrio.
  - Sigue animando cuando la barra está oculta (`opacity: 0` con `ui-inactiva`). Cada fotograma invalida la pintura y obliga a recomponer los `backdrop-filter`.
  - El visor deja de pintar la escena, pero el compositor no descansa nunca.
- **Por qué importa:** en un móvil real el coste es menor que con SwiftShader, pero es trabajo continuo de la GPU, que gasta batería y calienta el teléfono. Anula el objetivo del pintado bajo demanda, y con la ficha abierta en un portátil modesto se nota en la fluidez.
- **Propuesta:**
  - Ondas quietas mientras suena, con el estado en ondas frente a tachado, y un latido finito: 2–3 ciclos al empezar a sonar y al pasar el ratón.
  - Como mínimo, pausarlas en reposo (`body.ui-inactiva #btn-sonido .onda { animation-play-state: paused }`) y mientras haya un diálogo o la ficha abiertos.
  - Añadir a `docs/diseno/sistema.md` la regla «nada infinito sobre el vidrio» y corregir el patrón «Sonido: ondas que laten».

#### M4 · «Reducir transparencia» no quita el desenfoque, y no hay vidrio ligero para móviles lentos

- **Dónde:** cualquier pantalla del visor con «Reducir transparencia».
- **Pruebas:** en `experimento/resultado.json`, `getComputedStyle(.pn-tarjeta).backdropFilter` vale:
  - `blur(22px) saturate(1.7)` en normal;
  - **`blur(0px) saturate(1)`** en reducida.

  Con la ficha abierta y la música en marcha:

  | Variante | rAF en reposo | GPU en reposo | fps del visor arrastrando |
  |---|---|---|---|
  | Reducida | 9,0–9,2 fps | 122–130 % | 2,1 |
  | Reducida con `backdrop-filter: none` | **41–50 fps** | 44–51 % | 2,6–2,9 |

  Sin la ficha abierta, «Reducir transparencia» solo pasó de 3,1–4,1 a 4,5 fps arrastrando en el portátil, y en el teléfono la diferencia quedó dentro del ruido (`rendimiento/`).
- **Qué pasa:**
  - `tema.css:321` pone `--vidrio-desenfoque: 0px`, pero `.c8-vidrio` mantiene `backdrop-filter`. Chromium sigue creando la superficie de fondo y leyéndola, con el mismo coste y sin desenfoque visible.
  - La «calidad adaptativa» (`visor.js:2864`) solo baja la resolución interna cuando los fps caen de 28; nunca quita el vidrio.
- **Por qué importa:** un teléfono modesto que sufra con el vidrio no tiene escapatoria, ni manual (el interruptor no aligera) ni automática. Es la contingencia natural del encargo: «desenfoque en móviles modestos».
- **Propuesta:**
  - En `tema.css`: `:root[data-transparencia="reducida"] .c8-vidrio { -webkit-backdrop-filter: none; backdrop-filter: none; }`. La apariencia no cambia, porque el fondo ya es opaco.
  - En `visor.js`: si con la resolución ya en 1 la media sigue por debajo de 28 fps, aplicar en la sesión un «vidrio ligero» (`data-vidrio="ligero"`, sin `backdrop-filter`, con las alfas de `--vidrio-denso`).
  - Documentarlo en `docs/calidad.md`: «Si el móvil no puede con el desenfoque → vidrio sin desenfoque».

#### M5 · Colores de marca extremos: el botón principal y los estados «pulsado» desaparecen

- **Dónde:** portada, tarjeta, barra de vista, idiomas y radar, a 390×844 y 1280×800, talla M:
  - `marca.color` blanco `#ffffff` en tema claro;
  - negro `#000000` y azul marino `#1f2a44` en tema oscuro.
- **Pruebas:**
  - Capturas: `raros/marca-blanco-1280x800-claro-2-visor.png`, `raros/marca-blanco-390x844-claro-1-portada.png` y `raros/marca-negro-1280x800-oscuro-2-visor.png`.
  - Contraste del relleno de acento frente al vidrio, en `raros/resultado.json` (`botonContraVidrio`):

    | Marca y tema | Contraste |
    |---|---|
    | Blanco en claro | 1,0–1,7 : 1 |
    | Amarillo `#ffff00` en claro | 1,07–1,57 : 1 |
    | Azul marino en oscuro | 1,04–1,59 : 1 |
    | Negro en oscuro | 1,1–2,3 : 1 |

  - El texto sobre el botón sí cumple: de 14 a 21 : 1.
- **Qué pasa:**
  - `aplicarMarca()` (`visor.js:2203`) pone `--c-acento` igual en los dos temas.
  - El texto de acento y el foco se corrigen con `oklch(from …)` (`tema.css:284`), pero el relleno no.
  - Con una marca blanca en claro, «Contactar» es una píldora blanca sobre vidrio blanco, menos visible que «Foto de la vista». Los botones pulsados (radar, música) y el idioma elegido no se distinguen, por debajo del 3:1 que pide WCAG 1.4.11 para el estado.
  - Muchas inmobiliarias usan el blanco o el negro como color corporativo.
- **Propuesta:**
  - Un `--c-acento-relleno` por tema, acotado como `--c-acento-texto`: luminosidad máxima en claro y mínima en oscuro para llegar a 3:1 frente a `--vidrio-texto`. `--c-sobre-acento` se recalcula para ese relleno en `visor.js`.
  - Ampliar `pruebas/contraste.mjs`, que ya prueba seis marcas, para comprobar también el relleno.
  - En «Mi inmobiliaria», avisar: «Este color casi no se ve en el tema claro: se usará una versión más oscura».

#### M6 · El enlace y el QR quedan atados a `/tours/<ref>/` y el LEEME es genérico: enlaces de WhatsApp y QR rotos si se sube a otra carpeta

- **Dónde:** Estudio, Publicar → «Tu web» (1440×900, claro); `LEEME.txt` del ZIP.
- **Pruebas:** `flujo/B5-publicar.png` y `flujo/publicado-zip/LEEME.txt`.
- **Qué pasa:**
  - `url_publica` se fija a `web + /tours/<referencia>/` (`estudio-exportar.js:177`) y no se puede editar.
  - Todo lleva esa dirección dentro: cada mensaje de WhatsApp (`#v=…`), el QR del escaparate y el dossier.
  - Publicar sí lo dice («a la carpeta `/tours/c8-cqun9/`»). Pero el `LEEME.txt` que viaja en el ZIP, que es lo que lee quien sube los archivos, da otro ejemplo, `tours/calle-mayor-12`, un iframe con `tu-dominio.com` y propone Netlify Drop o GitHub Pages, que dan otra dirección (`exportar.js:314`).
- **Por qué importa:**
  - Muchas agencias tienen la web de su CRM y alojan los recorridos en un subdominio o en Netlify.
  - Si la carpeta no coincide, todos los enlaces de las consultas y los QR impresos dan 404, y nadie lo nota hasta que un cliente se queja.
- **Propuesta:**
  - En Publicar, un campo «Dirección final del recorrido», con `web/tours/ref/` por defecto y editable si se aloja en otro sitio. `url_publica` sale de ese campo.
  - `leeme()` usa `t.url_publica` cuando existe: la carpeta exacta, el enlace exacto y el mismo iframe que el Estudio. Además avisa: «Si lo subes a otra dirección, cámbiala en el Estudio y vuelve a descargar: el enlace y el QR la llevan dentro».

#### M7 · Código para incrustar: el del Estudio no copia la foto en otro dominio y el del LEEME (`?embed`) cambia el visor

- **Dónde:** el recorrido publicado dentro de la web de la agencia, en otro origen (como una web de CRM), a 1280×800, en claro.
- **Pruebas:** `iframe/estudio.png`, `iframe/leeme.png` e `iframe/resultado.json`.
- **Qué pasa:**
  - **Con el código del Estudio** (`estudio-exportar.js:276`):
    - `allow` no incluye `clipboard-write`.
    - WhatsApp se abre, pero la foto no se copia («No se ha podido copiar la foto: descárgala y adjúntala en el chat»).
    - En la consola: «Permissions policy violation: The Clipboard API has been blocked…».
    - Tampoco lleva `web-share`, que necesita Compartir en un iframe de otro origen.
  - **Con el código del LEEME** (con `clipboard-write` y `?embed`):
    - La foto sí se copia.
    - Pero `?embed` es el modo de la vista previa del Estudio: no hay portada (el gesto que arranca la música) y la interfaz nunca se oculta (`&& !EMBED`, `visor.js:2860`).
    - Además manda `postMessage` al padre con su propio origen (`visor.js:2581`), lo que llena la consola de la web de la agencia de «Failed to execute 'postMessage'… target origin».
- **Por qué importa:** la foto en WhatsApp de un gesto es el diferenciador, e incrustar en la ficha de la web propia es el caso principal. Hoy hay dos códigos distintos y ninguno está bien.
- **Propuesta:**
  - Un solo código en los dos sitios: `src` sin `?embed` y `allow="fullscreen; gyroscope; accelerometer; xr-spatial-tracking; clipboard-write; web-share"`.
  - En `visor.js`, `?embed` sin `estudio` conserva el reposo de la interfaz, y `enviarPadre()` solo envía con `?estudio` o con un padre del mismo origen.

#### M8 · La demo no transmite premium

- **Dónde:** `index.html?demo`, a 1280×800, en oscuro y en claro. Es lo primero que verán el cliente y los prospectos: el enlace «Ver el recorrido de demostración» de la Guía y la demo pública de la fase 5.
- **Pruebas:** `rendimiento/portatil-1280x800-normal.png` y `rendimiento/portatil-ficha-1280x800-normal.png`.
- **Qué pasa:**
  - Las escenas generadas por código parecen un videojuego de bloques: paredes planas, cajas grises, una ventana azul plana.
  - El vidrio adaptativo y la tipografía lucen sobre fotos reales y aquí no se aprecian.
- **Propuesta:**
  - Para enseñar el diseño al cliente (paso 5 del plan) y para la demo pública de la fase 5, usar 4–6 fotos 360 reales: de la propia Osmo del cliente o con licencia CC0.
  - Se pueden servir aparte, como el HTML autónomo de la demo, sin binarios en el repositorio.
  - `demo.js` se queda para las pruebas.

### P3 · Pulido

#### M9 · Precios y €/m² de cuatro cifras sin punto de millar

- **Dónde:** ficha y tarjeta. Ejemplos: «3116 €/m²» en `raros/una-foto-390x844-claro-3-ficha.png` y «3793 €/m²» en `rendimiento/portatil-ficha-1280x800-normal.png`. Un alquiler de 1.200 € saldría «1200 €».
- **Qué pasa:** `Intl.NumberFormat("es-ES")` no agrupa con cuatro cifras (norma CLDR), mientras que «349.000 €» sí lleva el punto. idealista y Fotocasa muestran «1.200 €/mes».
- **Propuesta:** `useGrouping: "always"` en `fmtNum` y en el formato de moneda (`paneles.js:131` y `:134`), en `precioPortada` (`visor.js:2238`) y en el dossier (`exportar.js:208` y `:211`). Los navegadores antiguos lo ignoran sin romper nada.

#### M10 · Palabras largas sin espacios: portada del móvil y tabla de superficies

- **Pruebas:** `raros/largo-marca-390x844-portada.png`, `raros/largo-390x844-superficies.png`, `raros/largo-1280x800-superficies.png` y `raros/ficha-larga.json`.
- **Portada del móvil:** un nombre de inmobiliaria de más de 80 letras sin espacios saca la tarjeta de la pantalla (de 70 a 546 px en 390). «Visita guiada» y los idiomas quedan fuera.
  - El título largo sí se parte, gracias a `overflow-wrap: anywhere` (`raros/largo-titulo-390x844-portada.png`).
  - Causa: `width: min(34rem, 100%)` dentro de una pista `auto` (`visor.css:243`), y `.marca .nombre` no se parte.
- **Tabla de superficies:** «Superficies por estancia» empuja **todas** las cifras de m² fuera del panel con un solo nombre largo (`.pn-tabla { grid-template-columns: 1fr auto }`, `paneles.css:268`).
- **Propuesta:**
  - `#portada { grid-template-columns: minmax(0, 1fr) }` y `overflow-wrap: anywhere` en `.marca .nombre`.
  - `.pn-tabla { grid-template-columns: minmax(0, 1fr) auto }` y `.pn-tabla dt { overflow-wrap: anywhere }`.

#### M11 · La pista de movimiento no tiene sentido con una sola foto y asoma tras la hoja

- **Pruebas:** `raros/una-foto-1280x800-oscuro-2-visor.png` y `raros/una-foto-390x844-claro-3-ficha.png`.
- **Qué pasa:**
  - Con una sola foto, la pista dice «Arrastra para mirar · W A S D para moverte» (o «toca las flechas para avanzar»), pero no hay adónde ir. `pistaInicial()` (`visor.js:2108`) no mira cuántas fotos hay.
  - En el móvil, la pista sigue detrás de la hoja de la ficha y asoma cortada por encima.
- **Propuesta:**
  - Con una foto, solo «Arrastra para mirar».
  - Ocultar la pista al abrir la ficha o cualquier diálogo.

#### M12 · El título automático repite los datos

- **Pruebas:** `flujo/C1-movil-portada.png` y `flujo/C2-movil-visor.png`.
- **Qué pasa:** con el título que propone el Estudio («Piso en venta · 3 hab. · 112 m²»), la portada repite debajo «3 habitaciones · 2 baños · 112 m²». En el teléfono, «3 hab. · 112 m²» aparece tres veces en la misma pantalla.
- **Propuesta:** que el título automático use la zona («Piso en venta en Calle Mayor, Madrid», sacado de `inmueble.direccion` sin el número). Si no hay dirección, que la portada omita la línea de datos cuando el título ya los lleva.

#### M13 · El teléfono es obligatorio también al enviar por WhatsApp

- **Pruebas:** `flujo/C3-movil-contacto.png`; validación en `paneles.js:1444`.
- **Qué pasa:** en modo WhatsApp, la agencia ya recibe el número de quien escribe, y el formulario lo pide igualmente y lo copia en el mensaje.
- **Por qué importa:** es un campo y unos toques de más en el móvil, y datos personales que sobran (RGPD, art. 5.1.c, minimización).
- **Propuesta:** en modo `whatsapp`, quitar el teléfono u ocultarlo como opcional. Se mantiene en los modos CRM y email.

#### M14 · Al cambiar la talla con un campo enfocado, el campo queda bajo el pie fijo

- **Dónde:** contacto en el móvil, 390×844, oscuro, al pasar de la talla M a la L.
- **Pruebas:** `caliente/visor-movil-0-inicio.png` (talla M, «Lucía» visible) frente a `caliente/visor-movil-1-talla-l.png` (en L, el campo queda bajo el pie).
- **Qué pasa:** lo escrito y el foco se conservan, pero el campo deja de verse.
- **Propuesta:** en `alCambiarTema()` (`paneles.js:349`), después de `colocar()`, ejecutar `document.activeElement?.scrollIntoView({ block: "nearest" })` si el foco está dentro del diálogo.

#### M15 · Texturas de 8192 px en el escritorio: memoria y decodificación en el hilo principal

- **Pruebas:**
  - Código: `LIMITE_TEX = 14` (`visor.js:244`) y la precarga de **todas** las vecinas en el escritorio (`:590`).
  - Medida: en `foto120b/resultado.json`, al recibir cada foto la vista previa del Estudio hace fotogramas de 5,1 s y 2,8 s dentro del bucle de `three.module.min.js`. Lo más probable es que sea la subida de la textura de 8192×4096 (`texImage2D`) en el hilo principal. Es SwiftShader: en un portátil real será bastante menos, pero será un tirón.
- **Cálculo:** cada textura de 8192×4096 en RGBA sin mipmaps ocupa 128 MiB. 14 en caché son unos 1,75 GiB de GPU.
- **Por qué importa:** es mucho para un portátil con gráfica integrada y 8 GB. Además, `powerPreference: "high-performance"` (`visor.js:155`) despierta la gráfica dedicada solo para ver fotos 360, y gasta batería.
- **Propuesta:**
  - Escritorio: precargar las vecinas en 4096 y subir a 8192 solo la actual, con `LIMITE_TEX` en unas 6.
  - Decodificar con `createImageBitmap` o `ImageBitmapLoader`, fuera del hilo principal.
  - `powerPreference: "default"` en el recorrido; `"high-performance"` solo en el paseo libre.
  - Confirmar en un portátil real con `visor._debug`.

#### M16 · «Modo juego» en la barra principal sobra (WASD ya entra solo)

- **Dónde:** primera pantalla del portátil, a 1280×800, en oscuro.
- **Pruebas:** `controles.mjs`. Hay 21 controles a la vista más los tres modos, frente a 11 en el teléfono.
- **Qué pasa:** el 🎮 es ruido para la mayoría de compradores. El requisito (navegación tipo Minecraft) ya se cumple: W A S D entra en el modo juego y la pista lo enseña.
- **Propuesta:** llevar «Modo juego» al menú «Más» en el escritorio. El requisito se refina, no se elimina.

#### M17 · «Creado con cre8eight» sin opción de marca blanca

- **Pruebas:** `flujo/C1-movil-portada.png`. El crédito sale en la portada (`visor.js:2291`) y en la ficha (`paneles.js:1046`).
- **Qué pasa:** la investigación (`docs/investigacion/competencia.md`) pone la marca blanca entre lo **imprescindible** para una inmobiliaria top. Kuula solo la ofrece en su plan Pro.
- **Propuesta:** `marca.ocultar_credito` (o un plan «sin marca»), decidido por el cliente según cómo vaya a vender cre8eight.

## Mirada de negocio

### ¿Es de verdad premium?

**En el sistema, sí:**
- Inter, champán único y vidrio adaptativo que se mide sobre la foto.
- Claro y oscuro reales, tallas y muelles.
- El Estudio es limpio y rápido. En la prueba, de la lista de la Guía al ZIP descargado hubo unos 30 s de máquina con tres fotos de 4096 px; con fotos de 120 MP son unos 8 s más por foto.
- El contacto por WhatsApp con la foto de la vista, el nombre de la estancia y el enlace a la vista exacta es mejor que el de la competencia.

**En lo que se ve primero, todavía no:**
- La demo (M8).
- Las marcas blancas o negras (M5).
- El título repetido (M12).
- «1200 €/mes» (M9).
- El crédito de cre8eight en cada portada (M17).

**Y en lo que no se ve:** la batería del teléfono (M3) y un recorrido que no carga sin decir nada (M2).

### ¿Qué sobra? (sin tocar los requisitos)

- El teléfono en el modo WhatsApp (M13).
- «Modo juego» en la barra del escritorio (M16).
- La animación infinita del sonido (M3).
- Dos códigos para incrustar que no coinciden (M7).

El resto ya pasó por la auditoría esencialista: el teléfono en reposo tapa menos del 10 % y las tallas y los ajustes están recogidos en «Ajustes».

### ¿Qué falta para competir con Matterport, Kuula o CloudPano en España? (hoja de ruta, no son correcciones de esta fase)

#### M18 · P2 · Alojamiento y «publicar con un clic»

- **El problema:**
  - Hoy hay que descomprimir el ZIP y subirlo por FTP a `/tours/<ref>/`.
  - Muchas agencias españolas usan la web que les da su CRM (Inmovilla, Witei, eGO…). Ahí se pega un enlace o un iframe, pero no se sube una carpeta.
  - Kuula, CloudPano y Matterport dan el enlace al momento. Es lo que más frena la adopción.
- **Opciones ligeras, sin servidor propio:**
  - Desplegar desde el Estudio en Netlify o Cloudflare Pages con el token de la agencia, que devuelve la dirección final y la escribe en `url_publica` (ver M6).
  - O un alojamiento opcional de cre8eight.

#### M19 · P2 · Estadísticas para el propietario

- La investigación pone la analítica entre lo imprescindible.
- El visor ya emite eventos (`dataLayer`), pero no hay contador ni panel.
- En la captación, enseñar al propietario «tu recorrido tuvo 1.240 visitas y 9 consultas» es un argumento que las plataformas alojadas (Matterport, Kuula, CloudPano) ya dan.
- Propuesta mínima: un contador sin cookies (Plausible o Umami de la agencia, o un webhook de visitas) y un resumen en el dossier.

#### M20 · P2 · Gestión comercial · idealista y Fotocasa

- idealista solo enlaza tours de proveedores compatibles: Matterport, Kuula, Floorfy, Giraffe360… (`docs/investigacion/portales-y-legal-espana.md`).
- Hoy la agencia tendría que pagar Kuula para tener tour en idealista.
- El camino de vídeo MP4 más fotos 360 GPano (menos de 7,5 MB: medidas 5,6 MB con fotos de 120 MP) está bien resuelto y explicado.
- El salto es comercial: solicitar ser proveedor compatible en idealista y en Adevinta (Fotocasa y habitaclia).

**Ventajas que hay que mantener y vender:**
- Sin suscripción: los enlaces no mueren.
- HTML que funciona sin conexión.
- WhatsApp con la foto.
- Ficha legal española completa: certificado energético y pie AICAT.
- Guía de la Osmo 360.
- Estilos con rótulo de IA.

## Lo que está bien y no hay que tocar

- **Flujo de extremo a extremo** sin errores de consola:
  - La lista de la Guía viaja por el enlace y el Estudio la ofrece con «Usar · No usar».
  - El ZIP no pide al servidor ningún archivo que falte, salvo el CDN de M2.
  - El HTML autónomo funciona sin red.
  - El mensaje de WhatsApp lleva la referencia, la estancia, las fotos por nombre y un solo enlace a la vista.
- **Pintado bajo demanda:** 0 fotogramas de WebGL en reposo en las 48 medidas, con y sin limitar la CPU. El hilo principal no es el cuello de botella con la CPU ×6 (alrededor de 1 ms de estilos por fotograma).
- **Cambios en caliente:** tema, talla y transparencia con el contacto abierto, el giro del teléfono y Ajustes cambiando su propia apariencia (`caliente/`). Se conserva el texto, el foco y el diálogo, el plano se repinta con los colores nuevos (`plano-repintado: cambia`), y el Estudio y la Guía sincronizan entre pestañas.
- **Fotos de 120 MP (15520×7760, unos 30 MB, como las de la Osmo 360):**
  - Se procesan en el worker, con salidas de 8192, 4096 y 512 px.
  - El pico del renderer fue de 1,5–1,6 GB.
  - Las fotos para portales salen por debajo de 7,5 MB.
- **Texto de acento y foco con marcas extremas:** el ajuste OKLCH funciona; solo falta el relleno (M5).
- **Contingencias del contacto:** si el portapapeles falla, aparecen «Copiar la foto otra vez» y «Descargar fotos» (`iframe/estudio.png`), y hay alternativa por WhatsApp si cae el CRM.
