# Fase 3 · Auditoría esencialista de cre8eight

- **Fecha:** 15/10/2026. Rama `ccr-40d07831-qbgzrt`, commit `c2e29af`. Este informe no cambia el código del proyecto.
- **Alcance:** visor (núcleo y paneles), Estudio en Modo Rápido y Completo, exportaciones, Asistente Osmo 360 y scripts.
- **Método:**
  - Lectura completa del código.
  - Pruebas con Playwright 1.56.1: Chromium con WebGL por software y jsdelivr redirigido a `node_modules`.
  - Un recorrido real creado de punta a punta en el Modo Rápido: 3 fotos 360 sintéticas de 4096 px, sin plano. Después se exportó y se abrió.
- **Pregunta de cada función:** ¿ayuda a decidir la compra, a contactar o a publicar más rápido? ¿Qué cuesta en interfaz, código, mantenimiento y riesgo?
- **Fuera de alcance:** la estética («minimal liquid glass», fase 4).
- **Números de línea:** son los del árbol de trabajo tras `c2e29af`. Mientras se auditaba, se modificaban `visor.js` y `exportar.js` en paralelo, así que pueden moverse unas líneas. Por eso cada referencia lleva también el nombre de la función.

## 1. Resumen

1. El producto cumple los requisitos del cliente, pero arrastra ruido. Hay ajustes de videojuego que nadie tocará, tres botones para el mapa, música y documentos duplicados, un 9,5 % de claves i18n huérfanas, y la demo y Spark viajan donde no hacen falta.
2. Hay funciones que fallan o engañan:
   - La interfaz del visor parpadea en cada fotograma hasta la primera interacción.
   - El Estudio genera la demo entera, oculta (13 s), cada vez que se abre.
   - En el Modo Rápido sin plano se publican un radar y un «plano con medidas» ficticios.
   - Pasar de Rápido a Completo deja las fotos sin conectar.
   - El Estudio ofrece italiano, portugués y catalán, que el visor ignora.
   - Publicar enseña un QR del dominio de ejemplo.
3. El diferenciador más valioso es el contacto por WhatsApp con la foto de la vista y la estancia, que nadie más tiene. Hoy cuesta **8 clics y 2 campos**; con los cambios propuestos baja a **4**.
4. Para publicar más rápido, la mejor palanca es un **perfil de la inmobiliaria**: marca, agente, WhatsApp, privacidad y web se escriben una vez y no en cada inmueble.
5. Carga inicial: **544 kB gzip** de JS. El 74 % es three.js **sin minificar**. Con la versión `.min` y la carga diferida de GLTFLoader y OrbitControls baja a **~277 kB (−49 %)**.
6. **Prioridades:**
   - **P1** (13 cambios): corregir los fallos anteriores, el contacto en 4 toques, el perfil, three.js minificado y los textos del Asistente.
   - **P2:** fusionar duplicados y adaptar Personalizar a `estado_obra`.
   - **P3:** limpieza.
   - Ningún requisito del cliente se elimina (ver §7.5).

## 2. Métricas medidas

| Métrica | Medida actual | Objetivo tras P1 y P2 |
|---|---|---|
| Controles visibles en la primera pantalla. **Demo** (todas las funciones) | 1280×800: **25** · 390×844: **18** · 844×390: **21** | 19 · 15 · 16 |
| Lo mismo, sin miniaturas de la galería ni etiquetas de las flechas | 1280×800: **18** · 390×844: **12** · 844×390: **14** | 12 · 9 · 10 |
| Controles visibles en la primera pantalla. **Recorrido típico del Modo Rápido** (3 fotos, sin plano) | 1280×800: **17** · 390×844: **11** | 10 · 7 (radar oculto sin plano, sin «Personalizar» vacío y con el raíl de 3 herramientas más «Más») |
| Pantalla tapada por la interfaz en reposo (demo / Rápido) | Escritorio 20 % / 16 % · móvil vertical **35 % / 25 %** · móvil horizontal 30 % / 21 % | ≤ 15 % en todas. Es la cifra propia de `ux-visor-3d.md` |
| Controles tras la autoocultación (demo) | 4 en escritorio · 6 en móvil | Igual |
| **Clics o toques para enviar una consulta con 1 foto de la vista** (WhatsApp) | **8 clics + 2 campos** (nombre y teléfono), igual en escritorio y móvil. Después hay que pegar la foto en WhatsApp. Ver el detalle debajo de la tabla | **4 clics + 2 campos** (0 campos en la segunda consulta: nombre y teléfono ya se recuerdan) |
| Diálogo de contacto | 105 palabras · 32 controles (escritorio) / 27 (móvil) · el mensaje de WhatsApp repite el mismo enlace dos veces | ≤ 70 palabras · 1 enlace |
| **Modo Rápido del Estudio** hasta publicar el ZIP | **5 pasos** (Fotos, Plano opcional, Datos, Revisar, Publicar). La barra lateral muestra 8 entradas y 2 controles de modo. Ver el detalle debajo de la tabla | 4 pasos (Revisar dentro de Publicar) · **6 clics + 5 campos** desde el segundo inmueble |
| Pantalla «Datos» del Modo Rápido | 8 campos, 14 botones de letra y 1 casilla | 5 campos de texto, Venta/Alquiler y las letras (WhatsApp y privacidad salen del perfil) |
| Revisar con los datos mínimos | «Listo para publicar · 3 sugerencias»: fotos sin orientar (no se puede hacer sin plano), falta el título y falta la referencia | 0 sugerencias que no se puedan atender en el Modo Rápido |
| Modo Completo | 8 pasos · **61 campos** en Datos (28 Inmueble + 14 Contacto y marca + 19 Avanzado) | ~40 campos (−21 que pasan al perfil o desaparecen) |
| **Peso de la carga inicial del visor** | **JS:** 15 archivos, 2.548 kB sin comprimir, **544 kB gzip**, 422 kB brotli. three.core.js y three.module.js **sin minificar** suman 2.043 kB, el 80 %. **CSS:** 2 archivos, 68 kB, 16 kB gzip | JS ~1.040 kB / **~277 kB gzip** · CSS igual (en la fase 4 se añadirá `tema.css`) |
| **Tiempo hasta `visor.listo` en la demo** | **5,8 s** (móvil) – **6,7 s** (escritorio) con WebGL por software. Con la máquina cargada por otros agentes, 12,8–17,2 s. El 95 % es la generación procedimental de la demo | No aplica: es la demo |
| Tiempo hasta `visor.listo` de un recorrido real (Rápido, servidor local) | 0,32 s (móvil emulado) · 0,77 s (escritorio) | Igual o menos |
| Vista previa del Estudio con un proyecto vacío | Genera la demo entera, oculta: **13,2 s** de CPU/GPU en cada apertura o «Recargar» | 0 s |
| HTML autónomo | 6,05 MB de JS por archivo; Spark ≈ 4,8 MB, aunque se quita el modo libre | ≈ 1,2 MB de JS |
| ZIP web público | Incluye `demo.js`, `exportar.js` y `vendor/fflate.js` (193 kB que el visor publicado no usa) | Sin esos archivos |
| Asistente | 11 secciones · 41 casillas · ~1.960 palabras | 7 secciones · ~20 casillas |
| i18n | 306 claves por idioma; **29 huérfanas** (116 cadenas en los 4 idiomas); 10 textos fijos sin traducir (6 en `visor.js`, 3 en `index.html` y 1 en `paneles.js`) | 0 huérfanas · 0 textos fijos |

**Clics del contacto, uno a uno:**

1. Contactar.
2. Hacer foto.
3. Capturar.
4. Listo.
5. Sugerencia de pregunta.
6. Privacidad.
7. Enviar por WhatsApp.
8. Abrir WhatsApp.

**Clics del Modo Rápido, uno a uno:**

1. Elegir fotos (más el diálogo del sistema).
2. Continuar.
3. Continuar sin plano.
4. Letra de consumo.
5. Letra de emisiones.
6. Continuar.
7. Continuar.
8. Descargar.

Además hay **7 campos de texto**: precio, m² construidos, m² útiles, habitaciones, baños, WhatsApp y URL de privacidad.

## 3. Inventario y decisiones

- **Leyenda:** **[R]** marca un requisito del cliente, que no se elimina.
- **Valor:** **A** alto, **M** medio, **B** bajo. Entre paréntesis, si ayuda a decidir, a contactar o a publicar.
- **Coste:** interfaz, código, mantenimiento y riesgo.

### 3.1 Visor · núcleo (`visor.js`, `index.html`, `visor.css`, `plano.js`, `medicion.js`, `maqueta.js`, `guion.js`)

| Función | Dónde | Usuario | Valor | Coste | Decisión | Justificación |
|---|---|---|---|---|---|---|
| Recorrido 360: flechas en el suelo, fundido y precarga de las vecinas [R] | `irA`, `construirPuntos` | Comprador | A (decidir) | Medio | MANTENER | Es el producto |
| Nombre y distancia sobre cada flecha | `construirPuntos` | Comprador | A | Bajo | MANTENER | Orienta sin plano |
| Galería de estancias (miniaturas) | `#galeria`, `construirGaleria` | Comprador | A | Bajo | MANTENER | Navegación sin aprendizaje. En los recorridos sin plano es la única fiable |
| WASD/flechas entre estancias, Q/E girar, RePág/AvPág, +/− [R] | `keydown` | Comprador (escritorio) | M | Bajo | MANTENER | Requisito «tipo Minecraft» |
| Atajos 1–9 y N | `keydown` | Comprador | B | Bajo | SIMPLIFICAR | Quitar N y dejar 1–9 sin anunciarlo en la ayuda; nadie los descubre y la galería ya lo hace |
| Captura del ratón con **un clic** en la escena [R] | `clic`, `capturarRaton` (999) | Comprador (escritorio) | M | Medio (confunde) | SIMPLIFICAR | Se mantiene el «modo juego» pedido, pero se activa con doble clic, W A S D o un botón «Modo juego». Decisión del cliente en la ronda «modo juego». Coordinar con la auditoría B |
| Ir a la estancia tocando el suelo | `clic` | Comprador | M | Bajo | MANTENER | Alternativa sin aprendizaje |
| Zoom (rueda y pellizco) | `fijarZoom` | Comprador | M | Bajo | MANTENER | Esperado |
| Giroscopio (móvil) | `#btn-giro`, `alternarGiro` | Comprador móvil | B-M | Bajo | MANTENER | Barato y solo en táctil |
| Pantalla completa | `#btn-pantalla` (1425) | Comprador | M | Bajo | SIMPLIFICAR | Ocultarlo sin `fullscreenEnabled`: en el iPhone la API no existe y el botón no hace nada |
| Ayuda «Controles» (H, ?) | `renderAyuda` (1404) | Comprador | M | Bajo | SIMPLIFICAR | Hoy enseña «Modo libre 3D» aunque el recorrido no lo tenga, y mete las teclas globales (M, R, V, 1-9, H) bajo ese título |
| Pistas de primer uso | `mostrarPista` | Comprador | M | Bajo | SIMPLIFICAR | Una sola pista. Si el clic deja de capturar el ratón, «Haz clic para explorar» sobra |
| Rótulo de la estancia al entrar | `#rotulo` | Comprador | M | Bajo | MANTENER | Da contexto y se desvanece solo |
| Tarjeta de título y estancia | `#barra`, `aplicarMarca` (1541) | Comprador | A | Bajo | SIMPLIFICAR | Sin título muestra «Recorrido virtual». Mejor un título automático: tipo, operación, habitaciones y m² |
| Ocultación automática de la interfaz | `bucle` (1947) | Comprador | M | Bajo | SIMPLIFICAR (arreglar) | Hoy alterna la clase en cada fotograma antes de la primera interacción (§4.1) |
| Radar tipo Counter-Strike [R] | `#minimapa`, `plano.js` | Comprador | A | Medio | MANTENER | Requisito y diferenciador |
| Mostrar u ocultar el mapa (botón y M) [R] | `#btn-radar` (index 44) | Comprador | M | Bajo | MANTENER | Requisito «activar y desactivar» |
| Alternar radar ⇄ plano en la esquina (botón y R) | `#btn-vista-mapa` (index 71), `cambiarRadar` | Comprador | B | Bajo | FUSIONAR con «Ampliar plano» | La esquina siempre es el radar y el plano completo, con el norte arriba, es la vista ampliada. Los botones del mapa pasan de 3 a 2 |
| Ampliar plano | `#btn-mapa` (index 74) | Comprador | M | Bajo | MANTENER | — |
| Radar sin plano (fotos «en fila» inventadas) | `plano.js` + Estudio | Comprador | **Negativo** | — | SIMPLIFICAR | Sin imagen, muros ni estancias, el radar empieza oculto (sigue activable) |
| Plantas | `#plantas` | Comprador | M | Bajo | MANTENER | Solo aparece con 2 plantas o más |
| Selector de modos (Recorrido, Libre, Maqueta) | `#modos` | Comprador | M | Bajo | MANTENER | Solo aparece con 2 modos o más |
| Modo libre 3D con splat o GLB, colisiones, correr y joystick [R] | `moverLibre`, Spark | Comprador | M (premium) | Alto | MANTENER (si hay modelo) | Cargar `GLTFLoader` (`import` estático en la línea 5) y Spark solo al entrar |
| Salto (Espacio) en el modo libre | `moverLibre` | Comprador | B | Bajo | ELIMINAR | No ayuda a decidir y ocupa ayuda. Subir y bajar sin suelo (Espacio/C en splats) se mantiene |
| Maqueta 3D (casa de muñecas) | `maqueta.js` | Comprador | M | Medio | SIMPLIFICAR | Ofrecerla solo con muros o modelo: con solo polígonos son manchas planas. `OrbitControls` (`import` estático, `maqueta.js:5`) en diferido |
| Medición sin LiDAR, distancia y altura [R] | `medicion.js` | Comprador | A (decidir) | Medio | MANTENER | Requisito y diferenciador |
| Visita guiada con barra de pausa | `guion.js`, `#guion-barra` | Comprador | M | Bajo | MANTENER | También genera el vídeo. Falta traducir «Pausa/Reanudar» |
| Notas (puntos «i») con imagen, vídeo y enlace | `mostrarFicha` (1386) | Comprador | M | Bajo | MANTENER | Faltan por traducir «▶ Vídeo» y «↗ Más información» |
| Estilos IA, noche y pintura con máscara (shader) [R] | `matPano`, `fuenteDe` | Comprador | A | Alto | MANTENER | Requisitos. Lo que cambia es cómo se presentan (ver paneles) |
| Atardecer o noche **simulados** sin foto | `procesar` (shader), `normalizar` (1809) | Comprador | B-M | Bajo | SIMPLIFICAR | «Noche» solo con foto real o si el agente activa la simulación. «Atardecer» solo con foto real |
| Comparar antes y después (cortinilla) | `#cortinilla` | Comprador | A (efecto «wow») | Bajo | MANTENER | Falta traducir «Antes/Después» (index 89) |
| Sello «Recreación virtual · IA», «Render» o «Iluminación simulada» | `#sello-ia` | Comprador / legal | A (legal) | Bajo | MANTENER | Publicidad no engañosa |
| Música: botón, volumen al pasar el ratón y pulsación larga [R] | `sonido` (1220), long-press (1351), index 55 | Comprador | B-M | Medio (~140 líneas) | SIMPLIFICAR | El icono solo silencia o activa; el volumen pasa a Ajustes. Hoy hay dos controles de volumen (§5.2) |
| Captura de la vista (`visor.capturar`) | API | Comprador → contacto | A | Bajo | MANTENER | Base del contacto con foto |
| Enlace a la vista exacta (`#v=`) | `enlaceVista`, `leerHash` | Comprador y agente | A | Bajo | MANTENER | Necesita `url_publica` (§4.10) |
| Calidad adaptativa y caché de texturas | `bucle`, `podar` | — | A (móvil) | Bajo | MANTENER | Plan de contingencia |
| Eventos y `dataLayer` | `visor.emitir` | Agente | M | Bajo | MANTENER | Invisible y barato |
| API `window.visor` y postMessage | — | Estudio | A | Medio | MANTENER | — |
| **Soltar un .spz/.glb sobre el visor** | `drop` (1985) | Desarrollador | Nulo para el comprador | Bajo | ELIMINAR en producción (solo con `?dev`) | Es una herramienta de pruebas abierta en cada recorrido publicado |
| Demo procedimental (`?demo`) | `demo.js` | Agente (ventas) | M | Medio | MANTENER (solo con `?demo`) | Que no se cargue en el Estudio (§4.2) ni se publique en el ZIP (§4.11) |
| Portada y barra de carga | `#portada`, `#carga` | Comprador | B | Bajo | MANTENER | — |
| Errores: sin WebGL, contexto perdido, `tour.json` roto | `obtenerTour`, eventos | Comprador | A (contingencia) | Bajo | MANTENER | Regla de contingencia del cliente |
| Textos de respaldo (`FALLBACK`, línea 21) | `visor.js` | — | Contingencia | Bajo | MANTENER | Duplica ~70 claves de i18n, pero es el plan B si `i18n.js` no carga |

### 3.2 Visor · paneles (`paneles.js`, `paneles.css`, `i18n.js`)

| Función | Dónde | Usuario | Valor | Coste | Decisión | Justificación |
|---|---|---|---|---|---|---|
| Ficha: precio, datos clave, características y descripción [R] | `ficha` | Comprador | A (decidir) | Medio | MANTENER | — |
| Certificado energético con la letra siempre visible | `certificado` | Comprador | A (ley) | Bajo | MANTENER | Obligatorio en los anuncios |
| Gastos (comunidad e IBI) | `gastos` | Comprador | M | Bajo | FUSIONAR con «Datos clave» | Dos filas no justifican una sección propia |
| Superficies por estancia [R medidas] | `superficies` | Comprador | M | Bajo | MANTENER (plegada) | Solo aparece con estancias |
| Calculadora de hipoteca | `hipoteca` (848) | Comprador | M-A | Bajo | MANTENER (plegada) | Ayuda a decidir |
| Ubicación con dos botones (OSM y Google) | `ubicacion` (766) | Comprador | M | Bajo | SIMPLIFICAR | Un solo «Ver en el mapa» |
| Documentos públicos [R planos] | `documentos` (800) | Comprador | M | Bajo | MANTENER | — |
| «Tu agente»: llamar y email | `agente` | Comprador | M | Bajo | MANTENER | — |
| Aviso legal, crédito musical y pie legal | `avisoLegal` (829) | Legal | A | Bajo | MANTENER | — |
| «Creado con cre8eight» | `credito` | — | B | Bajo | MANTENER | Es el nombre pedido por el cliente |
| Galería de renders y planos con visor ampliado y filtros [R renders] | `galeriaRenders` (1453) | Comprador | M-A | Medio | MANTENER | Falta traducir la etiqueta fija «Render» (1471) |
| Pestaña «Ficha · precio» (escritorio) y hoja inferior de 3 alturas (móvil) | `rail`, `peek` | Comprador | A | Medio | MANTENER | — |
| **Contacto**: nombre, teléfono, pregunta y estancia al WhatsApp de la empresa [R] | `dlgContacto` (1242), ~480 líneas | Comprador | **A (contactar)** | Alto | SIMPLIFICAR | Pasa de 8 clics a 4. La vista actual se adjunta sola como foto 1 (miniatura con ✕). «Enviar» copia la foto y abre WhatsApp en el mismo gesto. El mensaje lleva un solo enlace |
| Varias fotos de la vista (hasta 6) [R] | `entrarCaptura`, `barraCaptura` | Comprador | A | Medio | MANTENER como «Añadir otra vista» | — |
| Pantallas «preparar» y «pegar» de WhatsApp | `pantallaPreparar` (1156), `pantallaPegar` (1173) | Comprador | M | Medio | FUSIONAR | Los pasos se explican en el propio formulario. Queda una pantalla final, «Pega la foto y envía», con «Copiar siguiente» si hay varias |
| Sugerencias de pregunta (3) | `dlgContacto` | Comprador | M | Bajo | MANTENER | — |
| Casilla de privacidad y texto RGPD de 37 palabras | `dlgContacto` | Legal | A (ley) | Bajo | SIMPLIFICAR | La primera capa se pliega en «Información de privacidad». La casilla se queda. Fuera «Te respondemos lo antes posible.» |
| WhatsApp directo junto a «Contactar» (escritorio) | `dockContacto` (910) | Comprador | M | Bajo | FUSIONAR en el diálogo de contacto | Compite con el formulario pedido y no recoge nombre ni teléfono. Debe haber un solo botón principal |
| Webhook al CRM (JSON o multipart, modo «ambos») | `enviarContacto` (1408) | Agente | M | Medio | MANTENER (invisible para el comprador) | — |
| Email como último recurso | `canalContacto` | Comprador | B | Bajo | MANTENER | Plan de contingencia |
| Personalizar: estilos, momento, colores y comparar [R] | `dlgPersonalizar` (1579) | Comprador | A | Medio | SIMPLIFICAR | Según `estado_obra`: en proyectos, estilos IA; en construidos, colores; día/noche como interruptor. Hoy salen estilos también en construidos (§4.13) y, sin variantes, solo «Día/Atardecer/Noche» simulados que el agente no pidió |
| Color libre (selector) además de la paleta | `dlgPersonalizar` | Comprador | B | Bajo | ELIMINAR (P3) | La paleta del agente basta; un color libre no se puede pedir ni presupuestar |
| Compartir: copiar, WhatsApp, email, «Más», QR y «Descargar QR» | `dlgCompartir` (1526) | Comprador | M | Bajo | SIMPLIFICAR | Móvil: «Compartir…» nativo y copiar. Escritorio: copiar, WhatsApp y QR. «Descargar QR» es para el agente y ya está en el Estudio |
| Idioma (es, en, fr, de) | `dlgIdioma` | Comprador extranjero | M | Bajo | MANTENER | Solo aparece con 2 idiomas o más |
| Ajustes: sensibilidad de ratón y táctil, invertir eje, reducir movimiento, música y restablecer | `dlgAjustes` (1655) | Comprador | B | Bajo | SIMPLIFICAR | Una sola «Velocidad de giro», la del dispositivo. Fuera «Invertir eje». La música (volumen) solo aquí. Añadir «Atajos de teclado»: el núcleo ya lo admite pero no tiene interfaz (§4.9). En la fase 4, Apariencia y Tamaño |
| Raíl con 6 iconos (Personalizar, Medir, Visita, Compartir, Idioma, Ajustes) | `herramientas` (434) | Comprador | M | Bajo | SIMPLIFICAR | 3 a la vista (Personalizar, Medir, Visita) y «Más» con Compartir, Idioma, Ajustes y Ayuda |
| Evento de contacto sin datos personales | `emitirContacto` | Agente | M | Bajo | MANTENER | — |

### 3.3 Estudio (`estudio.html`, `estudio*.js`, `estudio.css`)

| Función | Dónde | Usuario | Valor | Coste | Decisión | Justificación |
|---|---|---|---|---|---|---|
| Modo Rápido o Completo | `estudio.js`, `estudio-proyecto.js` | Agente | A (publicar) | Medio | SIMPLIFICAR | El modo debe cambiar solo la interfaz. Hoy cambia lo que se publica (§4.4). Tiene dos controles para lo mismo (`estudio.js:73` y `:77`) |
| Barra lateral con subpasos opcionales | `pintarPasos` | Agente | A | Bajo | SIMPLIFICAR | El Modo Rápido promete 5 pasos y enseña 8 entradas. Los opcionales irían plegados en «Más herramientas» |
| «Continuar» al pie de cada paso | `pieContinuar` | Agente | A | Bajo | MANTENER | — |
| Proyectos: lista, abrir, eliminar y nuevo | `dialogoAbrir` | Agente | A | Bajo | MANTENER | — |
| Nombre del proyecto y botón «Abrir», que abren el mismo diálogo | `estudio.js:136-137` | Agente | — | Bajo | FUSIONAR | Dos controles para una acción |
| Restaurar copia de seguridad o ZIP | `importarZip` | Agente | A | Bajo | MANTENER | — |
| Importar una carpeta con `tour.json` | `importarCarpeta` | Técnico | B | Bajo | MOVER A «AVANZADO» | — |
| Autoguardado en IndexedDB y estado | `estudio-nucleo.js` | Agente | A | Medio | MANTENER | — |
| Deshacer y rehacer | `cambiar`, `deshacer` | Agente | A | Bajo | MANTENER | — |
| Botón de atajos de teclado en la barra superior | `estudio.html:32`, `mostrarAtajos` | Agente experto | B | Bajo | MOVER al «?» | Un teclado en la barra principal no ayuda al agente no técnico |
| «Guía Osmo 360» en la barra y «¿Primera vez?» en Fotos | `estudio.html:31`, `estudio-fotos.js:230` | Agente o fotógrafo | A | Bajo | FUSIONAR | Basta un acceso |
| Vista previa: iframe del visor real, selector, «Recargar» y ampliar | `estudio.js` | Agente | A | Medio | SIMPLIFICAR | Sin la demo oculta (§4.2). «Recargar» sobra, porque se recarga sola con cada cambio |
| Fotos: worker 8192/4096/512, sin GPS, orden por hora de disparo [R Osmo] | `estudio-fotos.js` | Agente | A | Medio | MANTENER | — |
| Fotos: EXIF/XMP de la Osmo, brújula, aviso 2:1 y aviso .OSV [R] | `estudio-fotos.js`, `estudio-util.js` | Agente | A | Medio | MANTENER | — |
| Fotos: nombres tomados del Asistente | `nombresAsistente` (75) | Agente | M | Bajo | SIMPLIFICAR | La lista es global y nunca se borra: nombra las fotos de cualquier inmueble posterior |
| Fotos: «Añadir fotos», «Elegir…» y zona para soltar | `estudio-fotos.js:235`, `:256` | Agente | — | Bajo | FUSIONAR | Un botón más la zona |
| Fotos: datos técnicos (n.º, resolución y MB) | `estudio-fotos.js:294` | Agente | B | Bajo | SIMPLIFICAR | Mostrar solo los problemas |
| Pestañas ES/EN en cada campo de texto | `campoTexto` | Agente | B | Medio | SIMPLIFICAR | Traducir en un solo sitio, «Idiomas y traducciones». Hoy salen hasta en el nombre de cada foto del paso 1 |
| Fotos: reordenar, estancia inicial (★) y borrar | `estudio-fotos.js` | Agente | A | Bajo | MANTENER | — |
| Plano: PDF, DXF o imagen, calibrar, colocar fotos y estancias con m² [R planos y medidas] | `estudio-plano.js` (~940 líneas), `estudio-dxf.js`, pdf.js | Agente | A | Alto | MANTENER | — |
| Plano: dibujar muros | `estudio-plano.js` | Agente | B-M | Medio | MOVER A «AVANZADO» | Solo sirven a la maqueta, y el DXF ya los trae |
| Plano: conectar fotos a mano y radio de conexión automática | `estudio-plano.js:225` | Agente | M | Medio | MANTENER (el radio, en avanzado) | — |
| Plano: dial del norte | `pintarLado` | Agente | B-M | Bajo | MOVER A «AVANZADO» | Útil solo con la brújula |
| Plano: coordenadas x y z numéricas de una foto | `estudio-plano.js:143` | Técnico | B | Bajo | MOVER A «AVANZADO» | — |
| **Plano: altura de techo de cada estancia** | `estudio-plano.js:156` | Agente | **Nulo** | Bajo | ELIMINAR | El visor no lee `altura_techo` |
| Plano: varias plantas | `estudio-plano.js` | Agente | M | Medio | MANTENER | — |
| Dirección: giro de la foto (±1/±10, deslizador y teclas), asistente de alineación y vista inicial | `estudio-orientar.js` | Agente | A (que las flechas coincidan con las puertas) | Medio | SIMPLIFICAR | Los botones ±1/±10 están repetidos en el pie de la vista previa (`pintarPie`, 250). Hace falta un «La puerta hacia X está aquí» que funcione también sin plano (§4.6) |
| Notas: título, texto, imagen, enlace y vídeo | `estudio-orientar.js` | Agente | M | Medio | MANTENER | — |
| Variantes: estilo, momento y origen, y «Ver en la vista previa» [R] | `estudio-variantes.js` | Agente | A | Medio | SIMPLIFICAR | Estilos IA solo en proyectos y máscara/colores solo en construidos, con la opción de verlo todo |
| Editor de máscara (varita, pincel y goma) y subida de PNG [R colores] | `estudio-mascara.js` | Agente | A (construidos) | Alto | MANTENER (subir PNG, en avanzado) | — |
| Material: planos de arquitecto | `estudio-material.js:354` | Agente | M | Bajo | FUSIONAR con el paso Plano | Usa el mismo importador que «Subir plano» |
| Material: renders 360 | `estudio-material.js:355` | Agente | M | Medio | FUSIONAR con Fotos y Variantes | Ya hay tres entradas para la misma imagen 360. Fotos ya admite el origen render y Variantes tiene el selector de origen |
| Material: renders fijos para la galería [R renders] | `subirGaleria` | Agente | M-A | Bajo | MANTENER | — |
| Material: modelo 3D GLB o splat con rotación, escala, posición y vista 3D [R] | `subirModelo`, `previsualizar` | Agente o renderista | M (premium) | Alto | MOVER A «AVANZADO» (dentro de Material) | — |
| Música, en Material y en Datos → Avanzado [R] | `estudio-material.js:361`, `estudio-datos.js:362` | Agente | B-M | Bajo | FUSIONAR (en un solo sitio) | Es el mismo bloque dos veces |
| Documentos: «Documentación» de Material (con «Público») y «Documentos para la ficha (enlaces)» de Datos | `estudio-material.js:362`, `estudio-datos.js:361` | Agente | M | Medio | FUSIONAR | Dos modelos de datos (`documentacion` e `inmueble.documentos`) para lo mismo |
| Datos del Modo Rápido: 8 datos | `pintarRapido` (56) | Agente | A | Bajo | SIMPLIFICAR | Añadir Venta/Alquiler, que hoy no se puede indicar: un alquiler sale sin «/mes». WhatsApp y privacidad vendrían del perfil |
| Datos del Modo Completo · Inmueble (28 campos) | `inmueble` | Agente | A (portales) | Medio | SIMPLIFICAR | Fuera latitud y longitud (149): la dirección basta para el mapa |
| Contacto y marca: modo, WhatsApp, privacidad, texto, CRM, marca, color, logo, pie legal y agente | `contactoMarca` (281), `marca` (226) | Agente | A, pero repetido | Medio | MOVER a un «Perfil de la inmobiliaria» | Se teclea igual en cada inmueble. En el proyecto solo quedan las excepciones |
| Idiomas y traducciones (7 idiomas) | `textos` (368), `IDIOMAS` (`estudio-nucleo.js:24`) | Agente | M | Medio | SIMPLIFICAR | Solo es, en, fr y de. Italiano, portugués y catalán no hacen nada en el visor (§4.5) |
| Colores, estilos y aviso legal | `personalizacion` | Agente | M | Medio | SIMPLIFICAR | El aviso legal está repetido (386 y 445). Las paletas por defecto bastan |
| Secciones (zona de día, de noche…) [R] | `secciones` (464) | Agente | M | Bajo | SIMPLIFICAR | Aplicar las sugeridas sin pulsar «Usar secciones» |
| Visita guiada personalizada | `guion` (495) | Agente | M (vídeo) | Bajo | MANTENER (avanzado) | — |
| Altura de la cámara | `avanzado` | Técnico | B | Bajo | MANTENER (avanzado) | Coincide con el Asistente (1,5 m) |
| Revisar | `comprobar` | Agente | A | Medio | SIMPLIFICAR | En el Modo Rápido sin plano no debe sugerir «fotos sin orientar» (`estudio-exportar.js:56`). Puede ir como cabecera de Publicar (el aviso ya existe) |
| Publicar: ZIP web, 3 pasos, dirección web, enlace, iframe y QR [R] | `renderExportar` | Agente | A | Medio | SIMPLIFICAR | Sin web no se enseña el enlace ni el QR de ejemplo (§4.8). La dirección web se pide en un solo sitio (§5.2) |
| Publicar: fotos 360 con GPano [R portales] | `jpegConGPano` | Agente | A | Bajo | MANTENER | — |
| Publicar: vídeo 16:9, 9:16 y 1:1 con marca y música [R] | `tarjetaVideo` | Agente | A | Medio | MANTENER | — |
| Publicar: plano con medidas | `estudio-exportar.js:278` | Agente | A con plano / **nulo sin plano** | Bajo | SIMPLIFICAR | Ocultarlo si no hay plano: hoy exporta tres puntos en fila con escala y norte (§4.7) |
| Publicar: dossier en PDF | `abrirFichaImprimible` | Agente | M-A | Bajo | MANTENER | — |
| Publicar: tabla «¿Qué subo a cada portal?» | — | Agente | M | Bajo | MANTENER (plegada) | — |
| Publicar: copia de seguridad | `copiaDeSeguridad` | Agente | A | Bajo | MANTENER (avanzado) | — |
| Publicar: HTML autónomo [R descargable] | `exportarHTMLAutonomo` | Agente | M | Medio | MANTENER y aligerar | Ver §3.4 |
| Publicar: «Archivo de configuración (para técnicos)» | `estudio-exportar.js:323` | Técnico | B | Bajo | ELIMINAR | `tour.json` ya va en el ZIP y en la copia de seguridad |

### 3.4 Exportaciones (`exportar.js`, `build.mjs`, `dist/`)

| Función | Dónde | Usuario | Valor | Coste | Decisión | Justificación |
|---|---|---|---|---|---|---|
| ZIP para la web (público) [R] | `exportarZIP`, `ARCHIVOS_VISOR` (296) | Agente | A | Medio | SIMPLIFICAR | Fuera `demo.js`, `exportar.js` y `vendor/fflate.js`: el visor publicado no los usa (193 kB) |
| HTML autónomo [R] | `exportarHTMLAutonomo`, `build.mjs` | Agente | M | Alto (6 MB de JS) | SIMPLIFICAR | Un segundo bundle sin Spark ni demo cuando no se incluye el modo libre: ≈ −4,8 MB por archivo |
| Vídeo | `grabarVideo` | Agente | A | Medio | MANTENER | — |
| JPEG con GPano y recompresión por debajo de 7,5 MB | `jpegConGPano`, `jpegParaPortal` | Agente | A | Medio | MANTENER | — |
| Lectura de GPano | `leerGPano` (909) | — | Nulo | Bajo | ELIMINAR | No se usa |
| Plano PNG | `exportarPlano` | Agente | A con plano | Medio | MANTENER (solo con plano) | — |
| Dossier | `abrirFichaImprimible` | Agente | M-A | Medio | MANTENER | — |

### 3.5 Asistente (`asistente-osmo.html`) y scripts

| Función | Dónde | Usuario | Valor | Coste | Decisión | Justificación |
|---|---|---|---|---|---|---|
| Paso 0: material (6 casillas) y lista de estancias que usa el Estudio | Paso 0 | Fotógrafo | A | Bajo | SIMPLIFICAR | La lista se queda, porque nombra las fotos. Las casillas obvias, fuera |
| Paso 1: preparar la vivienda (8 casillas) | Paso 1 | Fotógrafo | A | Bajo | MANTENER | — |
| Paso 2: modos y ajustes de la Osmo 360 [R] | Paso 2 | Fotógrafo | A | Bajo | MANTENER | — |
| Paso 3: planificar los puntos | Paso 3 (169) | Fotógrafo | M | Bajo | FUSIONAR con «Disparar» | — |
| Paso 4: disparar y control de tomas | Paso 4 | Fotógrafo | A | Bajo | MANTENER | Añadir «−»: hoy un toque de más no se puede deshacer |
| Paso 5: vídeo para el paseo libre | Paso 5 (216) | Fotógrafo (premium) | B | Bajo | MOVER A «AVANZADO» (apéndice plegado) | Necesita DJI Studio, un script y Postshot o Brush |
| Paso 6: pasar las fotos | Paso 6 (231) | Fotógrafo | M | Bajo | FUSIONAR con «Crear en el Estudio» | — |
| Paso 7: crear en el Estudio | Paso 7 (253) | Agente | A | Bajo | SIMPLIFICAR | Que refleje el Modo Rápido real: plano opcional |
| Paso 8: revisar la calidad (7 casillas) | Paso 8 (262) | Fotógrafo | M | Bajo | FUSIONAR | La revisión de cada toma va en «Disparar» y el resto lo comprueba Revisar del Estudio. La casilla de la línea 271 no pide nada al fotógrafo: el aviso sale solo |
| Paso 9: publicar | Paso 9 (282-292) | Agente | A | Bajo | SIMPLIFICAR y corregir | Cita menús que no existen (§4.12) |
| Problemas y soluciones | Ayuda | Fotógrafo | A | Bajo | MANTENER | — |
| Progreso guardado en el dispositivo | script | Fotógrafo | M | Bajo | SIMPLIFICAR | Añadir «Nuevo inmueble» para reiniciar: hoy el segundo piso empieza con todo marcado |
| `preparar_panos.py` | raíz | Técnico | Nulo (lo hace el Estudio) | Bajo | ELIMINAR (o pasarlo a `docs/herramientas`) | Duplica el procesado y crea un `tour.json` v1 |
| `extraer_fotogramas.py` | raíz | Técnico (splat) | B | Bajo | MOVER A «AVANZADO» (documentación del modo libre) | — |

## 4. Funciones que fallan o están a medias (verificado con Playwright)

### 4.1 La interfaz parpadea hasta la primera interacción

- **Dónde:** `visor.js:1947`, en `bucle()`.
- **Causa:** `int.yaInteractuo` empieza `undefined`. Entonces `inactiva` vale `undefined`, `undefined !== false` es cierto y `classList.toggle("ui-inactiva", undefined)` alterna la clase en **cada fotograma**.
- **Medida:** 7 cambios en 7 fotogramas (escritorio) y 15 en 15 (móvil), antes de tocar nada.
- **Efecto:**
  - En cada fotograma se recalculan los estilos y se repinta el `backdrop-filter` de 4 paneles (batería en móvil).
  - Los botones del núcleo cambian de `pointer-events` en cada fotograma.
- **Solución:** una línea: `const inactiva = !!int.yaInteractuo && …`, o `yaInteractuo: false` en `int`.

### 4.2 El Estudio genera la demo oculta

- **Dónde:** `visor.js:1754`.
- **Causa:** el iframe `index.html?embed&estudio` carga `DEMO_TOUR`, renderiza 5 panoramas y sintetiza música aunque el proyecto esté vacío y la vista previa tapada.
- **Medida:** 13,2 s cada vez que se abre el Estudio o se pulsa «Recargar». Con fotos, se genera igualmente antes de recibir el tour real.
- **Solución:** en modo embebido, arrancar con un tour vacío, sin aviso de error, y esperar a `visor:cargar`.

### 4.3 Radar y maqueta sin plano

- En el Modo Rápido sin plano, `tourParaExportar` coloca las fotos en fila, a 2,5 m.
- El radar enseña esa geometría inventada como si fuera la vivienda (captura `tour-rapido-escritorio.png`).
- Con solo polígonos, la maqueta son manchas planas.

### 4.4 Rápido y Completo publican cosas distintas

- **Dónde:** `estudio-nucleo.js:248`.
- **Causa:** las conexiones en orden de las fotos sin colocar solo se calculan en el Modo Rápido.
- **Efecto:** el mismo proyecto pasado a Completo da en Revisar «3 foto(s) sin conectar» como error y se publicaría **sin flechas**.
- **Solución:** que el modo cambie solo la interfaz.

### 4.5 Idiomas que no existen en el visor

- **Dónde:** `estudio-nucleo.js:24`.
- **Causa:** el Estudio ofrece italiano, portugués y catalán, pero el visor solo tiene diccionarios es, en, fr y de y los filtra.
- **Prueba:** un tour con `idiomas: ["es","it"]` e `idioma: "it"`, abierto en un navegador italiano, muestra el contenido en español y sin selector de idioma.
- **Restos en `i18n.js:767-768`:** `LOCALES` y `NOMBRES` declaran además it, pt, ca y nl.

### 4.6 «Fotos sin orientar» sin forma de orientarlas

- En el Modo Rápido sin plano, Revisar sugiere «3 fotos sin orientar».
- El asistente de alineación exige fotos colocadas en el plano: «Coloca las dos fotos en el plano…». Solo queda el deslizador manual.
- Mientras tanto, las flechas apuntan a direcciones arbitrarias.

### 4.7 «Plano con medidas» sin plano

- Sin plano se puede descargar igual.
- El PNG muestra «Plano · Planta principal» con tres puntos en fila, una escala de 1 m y el norte (captura `plano-exportado-rapido.png`).
- Es un documento engañoso que va directo a idealista.

### 4.8 QR y enlace de ejemplo

- Si no se ha escrito la web, Publicar muestra y deja descargar un QR de `https://www.tu-inmobiliaria.com/tours/recorrido/` (captura `estudio-rapido-5-publicar.png`).
- Un agente puede imprimirlo en un cartel.

### 4.9 Ajustes sin interfaz y campos sin efecto

- **Atajos (`visor.js:1066`):** el núcleo los admite («WCAG 2.1.4: atajos desactivables»), pero Ajustes no tiene el interruptor. El visitante no puede desactivarlos.
- **`fov`** (1620 y 1889): tampoco tiene interfaz.
- **`altura_techo`:** el Estudio lo recoge y el visor no lo usa.

### 4.10 `url_publica` se lee pero nunca se escribe

- **Dónde:** `visor.js` → `enlaceVista`.
- **Causa:** el Estudio conoce la web (Publicar, paso 3) pero no la guarda en `tour.json`, y ESQUEMA no la documenta.
- **Efecto en el HTML autónomo:** el enlace de la vista, el QR de Compartir y los enlaces del mensaje de WhatsApp acaban como `file:///…`, la ruta del disco del cliente, porque `paneles.js` recurre a `location.href`.

### 4.11 Peso muerto en los exportables

- **ZIP público:** lleva `demo.js`, `exportar.js` y `fflate.js` (`exportar.js:297`).
- **HTML autónomo:** incrusta `dist/visor-autonomo.js` (6,05 MB) con Spark y la demo, aunque el modo libre se descarta por defecto.

### 4.12 El Asistente cita menús que no existen

- «Estudio → Exportar → ZIP para web» (282): en el Estudio se llama «Publicar → Descargar mi recorrido».
- «Exportar → Fotos para portales» con «encuadres de las 360» (291): **esa exportación no existe**. Solo hay «Fotos 360» con GPano.
- «Vídeo MP4» (290): en Chromium sale WebM.
- «Plano PNG» (292): no sirve en los recorridos sin plano.

### 4.13 El requisito «estilos IA solo en proyectos» no se aplica

- `listaEstilos()` (`paneles.js:332`) muestra los estilos siempre que haya variantes, sea cual sea `estado_obra`.
- El Estudio deja subir estilos IA en viviendas construidas.

### 4.14 Lo que publica el Modo Rápido por defecto

- **Momentos (`estudio-nucleo.js:43`):** un proyecto sin variantes publica `momentos: ["dia","atardecer","noche"]`. El visor ofrece entonces «Personalizar» con día, atardecer y noche simulados, que el agente nunca eligió.
- **Título:** el visor dice «Recorrido virtual» y el dossier sale con el título vacío («Ficha»).

### 4.15 Textos fijos sin traducir

- **`visor.js`:**
  - «Pausa/Reanudar» (868).
  - «Permiso de movimiento denegado» (1132).
  - «▶ Vídeo» y «↗ Más información» (1393-1394).
  - «Recorrido virtual» (1541).
  - «Error: …» (1982).
- **`index.html`:** «Antes/Después» (89), «Pausa» (83) y «Detener visita» (86).
- **`paneles.js`:** «Render» (1471).
- Ya existen claves para varios de ellos (`guion.pausar`, `guion.reanudar`, `aviso.giroscopio_denegado`), pero están huérfanas.

### 4.16 La lista de estancias del Asistente no se vacía

- Se lee con `nombresAsistente()` y nunca se borra.
- El siguiente proyecto recibe los nombres del inmueble anterior.

### 4.17 Pantalla completa en el iPhone

- El botón llama a una API que el iPhone no tiene para las páginas, así que no hace nada.
- Es una limitación conocida de Safari en iOS; no se puede probar en Chromium.

Funciona bien (comprobado):

- En el recorrido Rápido: medir (1,08 m), visita guiada, QR, cambio a inglés, W para avanzar y las teclas R y M.
- La captura y el contacto por WhatsApp, en escritorio y móvil.
- La exportación ZIP de punta a punta.
- Sin errores de consola en ninguna de las pruebas.

## 5. Código muerto, duplicado y textos

### 5.1 Código muerto

**Funciones sin uso:**

- `util.js:65` `esperar`.
- `estudio-nucleo.js:575` `esperar`.
- `exportar.js:909` `leerGPano`.

**Interfaz sin efecto:**

- `estudio-plano.js:156`: campo «Altura techo (m)».

**API sin interfaz:**

- `visor.js:1066` `int.ajustes.atajos`.
- `visor.js:1620/1889` `int.ajustes.fov`.

**Campos sin documentar:** `rumbo_enlaces`, `altura_suelo` y `elevacion` (`visor.js:373`, `687`; `maqueta.js:35`) no están en ESQUEMA y el Estudio no los escribe. Basta con documentarlos o quitarlos (P3).

**CSS sin uso** (`visor.css` y `paneles.css` están limpios):

- `estudio.css:50-51` y `423` `body.vista-oculta`.
- `estudio.css:215` `.herramientas .sep`.
- `estudio.css:485` `.badge-whatsapp`.

**Claves i18n huérfanas** (29 de 306, ×4 idiomas; líneas del bloque `es` de `i18n.js`):

| Grupo | Claves (línea) |
|---|---|
| `comun.*` | `volver` (39), `pantalla_completa` (40), `giroscopio` (40), `recentrar` (40), `ayuda` (41) |
| `modo.*` y `ayuda.*` | `modo.titulo` (43), `ayuda.tocar_suelo` (52) |
| `aviso.*` | `sin_conexion` (61), `giroscopio_denegado` (61), `cargando_modelo` (62), `libre_no_disponible` (62) |
| `medir.*` | `punto_a` (69), `salir` (69) |
| `plano.*` y `plantas.*` | `plano.titulo` (71), `plano.reducir` (71), `plantas.titulo` (72), `plantas.cambiar` (72) |
| `guion.*` | `pausar` (74), `reanudar` (75), `paso` (75), `saltar` (75) |
| Otras | `estilos.ia` (82), `ficha.herramientas` (108) |
| `energia.*` | `letra` (116), `mas` (116), `menos` (116) |
| `contacto.*` | `boton` (118), `msg_estancia` (136), `pegar` (172) |

- Se reutilizan las que corresponden a textos fijos (§4.15) y se borran las demás.
- `i18n.js:767-768`: fuera it, pt, ca y nl.

**Desarrollo en producción:**

- Soltar archivos en el visor (`visor.js:1985-2007`).
- Los ganchos `window.__estudio` y `__plano` se pueden quedar, porque los usan las pruebas.

### 5.2 Mismo ajuste u opción en dos sitios

| Duplicado | Sitio 1 | Sitio 2 | Quedarse con |
|---|---|---|---|
| Volumen de la música (visor) | Icono con deslizador al pasar el ratón y pulsación larga (`visor.js:1351`, `index.html:55-58`) | Ajustes, «Música» con interruptor y volumen (`paneles.js:1680`) | El icono silencia; el volumen, en Ajustes |
| Contacto | «Contactar» | WhatsApp directo (`paneles.js:910`) | Un CTA; el directo, dentro del diálogo |
| Vista del mapa | Botón radar ⇄ plano y R (`index.html:71`) | «Ampliar plano» (`index.html:74`) | Ampliar = plano completo |
| Personalizar (móvil) | En la parte visible de la hoja (`peek`) | En la fila de herramientas de la hoja | El de la hoja visible |
| Música (Estudio) | Material (`estudio-material.js:361`) | Datos → Avanzado (`estudio-datos.js:362`) | Material |
| Documentos (Estudio) | Material → `documentacion` con «Público» | Datos → Avanzado → `inmueble.documentos` | Una lista con «Público» |
| Aviso legal | Datos → Idiomas y traducciones (`estudio-datos.js:386`) | Datos → Colores, estilos y aviso legal (`:445`) | Un campo |
| Dirección web | Datos → Marca → Web (`marca.web`) | Publicar → «Dirección de tu web» (`prefs.web`, `estudio-exportar.js:150`) | El perfil, y escribir `url_publica` |
| Abrir proyecto | Nombre del proyecto (`estudio.js:137`) | Botón «Abrir» (`estudio.js:136`) | Uno |
| Elegir fotos | «Añadir fotos» (`estudio-fotos.js:235`) | «Elegir…» (`:256`) | Uno |
| Cambiar de modo | Botón «Rápido/Completo» (`estudio.js:73`) | Enlace «ver todas las herramientas» (`:77`) | Uno |
| Giro ±1/±10 | Tarjeta de Dirección | Pie de la vista previa (`estudio-orientar.js:250`) | La tarjeta |
| Subir el plano | Paso Plano | Material → Planos | Plano |
| Renders 360 | Material | Fotos (origen render) y Variantes (selector de origen) | Fotos y Variantes |
| Guía Osmo 360 | Barra superior (`estudio.html:31`) | «¿Primera vez?» en Fotos (`estudio-fotos.js:230`) | Uno |
| Traducción | Pestañas de idioma en cada campo (`campoTexto`) | «Idiomas y traducciones» | Esta última |

### 5.3 Utilidades duplicadas (riesgo de divergencia)

| Utilidad | Copias |
|---|---|
| Área de un polígono | `util.js:11` · `paneles.js:135` · `exportar.js:269` · `estudio-util.js:151` |
| Centroide | `util.js:21` · `exportar.js:939` · `estudio-util.js:156` |
| Punto dentro de un polígono | `util.js:26` · `exportar.js:949` · `estudio-util.js:165` |
| `urlSegura` | `visor.js:1385` · `paneles.js:154`. **Son reglas distintas**: la del núcleo acepta `dominio.ext` sin esquema |
| Color de texto sobre el acento | `paneles.js:124` `colorTexto` · `visor.js:1523` `textoSobreColor` (recién añadida) |
| Ajustes por defecto | `visor.js:79` `AJUSTES_DEF` · `paneles.js:311` `AJUSTES_BASE` |
| Almacenamiento local | `util.js` `almacen` · `paneles.js:112-113` `leerLS`/`guardarLS` |
| `slug` | `paneles.js:1015` · `estudio-util.js:140` |
| `aBase64` | `paneles.js:1391` · `estudio-datos.js:260` |
| Ayudante DOM `h()` | `paneles.js:90` · `estudio-nucleo.js:454` |
| Colores de la etiqueta energética | `paneles.js:14` (C = `#bed62f`) · `exportar.js:1221` (C = `#bed630`) |

Propuesta: llevar al `util.js` común lo que comparten el visor y la exportación, y dejar el Estudio con `estudio-util.js`.

### 5.4 Textos redundantes o largos

- **Mensaje de WhatsApp** (`paneles.js:1345`): repite el enlace («Foto 1 – Salón: URL» y «Vista: URL», la misma dirección).
- **RGPD del formulario:** 37 palabras siempre visibles.
- **«Te respondemos lo antes posible.»:** relleno.
- **Asistente:** 1.960 palabras en 11 secciones.
- **Pistas del Estudio:** se repiten en cada paso, como «Arrastra cada foto al punto del plano…», que sale dos veces en Plano (la pista del lienzo y el panel lateral).
- **README.md:** documenta `?editar`, que ya no existe (líneas 32 y 53), y teclas antiguas (Tab, «M = plano»). Se actualiza en la fase 5.

## 6. Comparación con la competencia (`docs/investigacion/competencia.md`)

**Lo que tenemos de más y no aporta:**

- Ajustes de videojuego: sensibilidad táctil, invertir eje y salto. No aparecen en ninguno de los competidores analizados y un comprador no los echará de menos.
- Tres botones para el mapa.
- Atardecer simulado y «Descargar QR» para el comprador.
- Siete idiomas en el Estudio, de los que funcionan cuatro.
- Dos sistemas de documentos.
- La demo dentro del ZIP y Spark dentro de cada HTML autónomo.
- Un `preparar_panos.py` que repite el Estudio.

**Lo que tenemos al nivel de lo imprescindible del sector** (mantener, sin crecer):

- Plano con posición y m².
- Medición.
- Puntos de información.
- Enlace, iframe y QR.
- Pantalla completa y giroscopio.
- Varios idiomas.
- Captación por WhatsApp.
- Analítica (`dataLayer`).

**Lo que nos diferencia y hay que potenciar:**

1. **WhatsApp con la foto de la vista, la estancia y el enlace a esa vista.** Nadie lo tiene. Hay que dejarlo en 4 toques (P1).
2. **Sin suscripción:** ZIP autohospedado y HTML que funciona sin conexión. Matterport cobra cada mes y sus enlaces mueren al cancelar. Hace falta un ZIP limpio, un HTML ligero y `url_publica` para que el QR y los enlaces funcionen también sin conexión.
3. **Velocidad con la Osmo 360:** EXIF, brújula, Asistente y Modo Rápido de unos 5 minutos. Maverick: «el foso es la velocidad, la marca y los datos». El perfil de la inmobiliaria es la palanca.
4. **Antes y después dentro del 360:** estilos IA en proyectos, colores en construidos y noche. Floorfy y Ricoh hacen el *home staging* con IA, pero no la cortinilla dentro del 360.
5. **Navegación de videojuego y radar tipo Counter-Strike:** es única. Hay que hacerla descubrible sin que capture el ratón por sorpresa.
6. **Vídeo 9:16 generado en el navegador**, y la **accesibilidad**: nadie en el sector la cuida.

**No añadir ahora:**

- Planos automáticos, como Matterport o Floorfy.
- Visitas en directo con el agente.
- Generación de estilos IA dentro del producto.

Son valiosos, pero contradicen el encargo de compactar. Quedan para una fase posterior.

## 7. Plan priorizado

Cada tarea indica la decisión de §3 y el archivo. El reparto sigue PENDIENTE.md:

- **Núcleo y exportación:** el orquestador.
- **Paneles:** un agente.
- **Estudio:** otro agente.
- **Asistente:** el orquestador.

### 7.1 Núcleo (`visor.js`, `visor.css`, `index.html`) y exportación (`exportar.js`, `build.mjs`)

**P1, imprescindible:**

- **N1. Arreglar el parpadeo de `ui-inactiva`** (`visor.js:1947`): `!!int.yaInteractuo` o `yaInteractuo: false` en `int` (84). Con prueba: 0 cambios de clase antes de interactuar.
- **N2. Embebido en el Estudio sin demo.**
  - Hoy `obtenerTour` (1754) devuelve `DEMO_TOUR` con `embed&estudio`.
  - Propuesta: un tour vacío (`{panoramas: []}`), sin el aviso de error de `cargarEnVisor` en el modo embebido, y esperar a `visor:cargar`.
  - Ahorra 13 s de CPU/GPU por apertura, sobre todo en el iPad.
- **N3. three.js minificado** (`index.html:15`): `three.module.min.js` en el importmap (incluye `three.core.min.js`). Ahorra 219 kB gzip y 1,3 MB de análisis de JS.
- **N4. Recorridos sin plano:**
  - Si ninguna planta tiene imagen, muros ni estancias, el radar empieza oculto (`aplicarRadar`, 1174). Sigue activable con M o el botón: requisito.
  - Sin muros ni modelo, `modosDisponibles` (1451) no ofrece la maqueta.
- **N5. «Modo juego» explícito:**
  - Un clic simple ya no llama a `capturarRaton()` (`clic`, 1017-1043).
  - Se captura con doble clic, al pulsar W A S D o flechas, o con un botón «Modo juego». Se sale con Esc.
  - La pista pasa a ser «Arrastra para mirar · WASD para moverte».
  - Pendiente de la elección del cliente (ronda «modo juego»). Conciliar con la auditoría B.

**P2, recomendable:**

- **N6.** `GLTFLoader` (`visor.js:5`) y `OrbitControls` (`maqueta.js:5`) en `import()` diferido: −43 kB gzip al inicio. Con N3, el JS inicial baja de 544 a ~277 kB gzip.
- **N7.** Ayuda contextual (`renderAyuda`, 1404):
  - Solo los modos disponibles.
  - Las teclas globales, en su propia sección.
  - Sin «1-9» ni «N».
- **N8.** Mapa con dos botones:
  - Quitar `#btn-vista-mapa` y la tecla R (`cambiarRadar`). La esquina siempre es el radar y «Ampliar» es el plano con el norte arriba.
  - Quitar la clave `visor:radar` de `localStorage`.
- **N9.** Música:
  - Quitar el deslizador al pasar el ratón y la pulsación larga (`visor.js:1351-1357`, `index.html:55-58` y su CSS).
  - El icono solo silencia; el volumen, en Ajustes (paneles).
- **N10.** Quitar el soltar archivos en el visor (`visor.js:1985-2007`), o dejarlo solo con `?dev`.
- **N11.** «Noche» y «atardecer»: `normalizar` (1809) no inventa momentos. Solo se ofrecen con variantes reales o con `momentos` explícito del Estudio.
- **N12.** Textos fijos a i18n (§4.15), reutilizando las claves huérfanas que correspondan.
- **N13.** Ocultar `#btn-pantalla` sin `document.fullscreenEnabled` ni `webkitFullscreenEnabled` (iPhone).
- **X1.** `ARCHIVOS_VISOR` (`exportar.js:296`) sin `demo.js`, `exportar.js` ni `vendor/fflate.js`. En la fase 4 se añaden `tema.*` y las fuentes.
- **X2.** `build.mjs`: un segundo bundle `visor-autonomo-ligero.js` con `@sparkjsdev/spark` y `demo.js` sustituidos por módulos vacíos. `exportarHTMLAutonomo` lo usa cuando `incluirLibre` es falso. Ahorra ≈ 4,8 MB por archivo.
- **X3.** `url_publica`: documentarla en ESQUEMA (§1) y usarla en el HTML autónomo (ya la lee `enlaceVista`). La escribe el Estudio (E4).

**P3, opcional:**

- **N14.** Quitar el salto del modo libre (`moverLibre`, la parte de `L.saltar`).
- **N15.** Quitar `int.ajustes.fov` o exponerlo.
- **N16.** Documentar o quitar `rumbo_enlaces`, `altura_suelo` y `elevacion`.
- **X4.** Borrar `leerGPano`, `esperar` (`util.js`) y unificar los colores del certificado energético con paneles.
- **X5.** Utilidades compartidas en `util.js` (§5.3). Empezar por `urlSegura`: hoy hay **dos reglas distintas**.

### 7.2 Paneles (`paneles.js`, `paneles.css`, `i18n.js`)

**P1, imprescindible:**

- **PA1. Contacto en 4 toques:**
  1. «Contactar». La vista actual ya va adjunta como foto 1, con ✕ y «Añadir otra vista», que abre el modo captura.
  2. Elegir una sugerencia o escribir la pregunta. Nombre y teléfono se rellenan con lo guardado.
  3. Marcar la privacidad.
  4. «Enviar por WhatsApp»: en el mismo gesto copia la foto, abre `wa.me` y pasa a la única pantalla «Pega la foto y envía».

  Cambios en el código:
  - Quitar `pantallaPreparar` (1156) y simplificar `pantallaPegar` (1173) y `enviarWhatsApp` (1374).
  - `mensajeWhatsApp` (1345) con un solo enlace.
  - Mantener el selector de estancia (requisito), preseleccionado.
- **PA2. Un único botón de contacto:**
  - El enlace directo de `dockContacto` (910) se convierte en un enlace secundario dentro del diálogo («¿Prefieres escribir sin formulario?»).
  - Mismo botón en todos los tamaños.

**P2, recomendable:**

- **PA3. Personalizar según `estado_obra`** (`listaEstilos` 332, `listaMomentos` 355, `dlgPersonalizar` 1579):
  - En `proyecto`: estilos IA y comparar.
  - En `construido`: colores y comparar.
  - «Día ⇄ Noche» como interruptor, con «Atardecer» solo si hay foto real.
  - Si el agente sube los dos tipos, se ven ambos (un aviso en el Estudio lo explica).
  - Así se cumple el requisito «estilos IA solo en proyectos».
- **PA4. Ajustes** (`dlgAjustes` 1655):
  - «Velocidad de giro»: una sola, la de ratón o la táctil según el dispositivo.
  - Música, con volumen.
  - Reducir movimiento.
  - «Atajos de teclado», solo en escritorio y llamando a `V.ajustes({atajos})`.
  - Fuera «Invertir eje vertical».
  - En la fase 4: Apariencia, Tamaño y Reducir transparencia.
- **PA5. Raíl con 3 herramientas y «Más»:** Personalizar, Medir y Visita guiada, más «Más» con Compartir, Idioma, Ajustes y Ayuda (`herramientas` 434). En móvil, Personalizar solo en la parte visible de la hoja.
- **PA6. i18n** (`i18n.js`):
  - Borrar las claves huérfanas que no se reutilicen (§5.1).
  - Quitar it, pt, ca y nl de `LOCALES` y `NOMBRES`.
  - Añadir las claves de los textos fijos del núcleo y de «Render».
- **PA7. RGPD:** primera capa plegable y sin la frase de relleno.

**P3, opcional:**

- **PA8.** Compartir: «Compartir…» nativo en móvil y sin «Descargar QR».
- **PA9.** Ubicación con un solo botón.
- **PA10.** «Gastos» dentro de «Datos clave».
- **PA11.** Quitar el color libre de Personalizar.

### 7.3 Estudio (`estudio.html`, `estudio*.js`, `estudio.css`)

**P1, imprescindible:**

- **E1. «Perfil de la inmobiliaria»** (IndexedDB o `localStorage` `cre8eight:perfil`):
  - **Contenido:** marca (nombre, logo, color, web y pie legal), agente, WhatsApp, URL y texto de privacidad, y CRM.
  - **Cuándo se edita:** al crear el primer proyecto o desde «Abrir → Perfil».
  - **Uso:** `tourNuevo` (`estudio-nucleo.js:27`) lo copia en cada proyecto nuevo. «Contacto y marca» pasa a mostrar «Usando el perfil · Cambiar solo en este inmueble».
  - **Resultado:** los 61 campos del Modo Completo bajan a ~40. El Modo Rápido pide WhatsApp y privacidad solo la primera vez.
- **E2. Idiomas:** `IDIOMAS` (`estudio-nucleo.js:24`) solo con es, en, fr y de.
- **E3. El modo solo cambia la interfaz:** `calcularEnlaces` (232-248) conecta en orden las fotos sin colocar en ambos modos. Un único control para cambiar de modo (`estudio.js:73-77`).
- **E4. Publicar** (`estudio-exportar.js`):
  - Sin plano (ninguna imagen, muro ni estancia), se oculta la tarjeta «Plano con medidas» (278).
  - Sin web, no se dibuja el enlace ni el QR de ejemplo (233). Se ve primero el campo con «Escribe tu web para ver el enlace y el QR».
  - Con web, se escribe `url_publica` en el tour exportado (`tourParaExportar`).
  - La dirección web sale del perfil (`marca.web`) y desaparece `prefs.web`.
- **E5. Vista previa sin demo** (depende de N2): quitar «Recargar» (`#vista-recargar`) si ya no hace falta.

**P2, recomendable:**

- **E6. Modo Rápido en 4 pasos:**
  - **Pasos:** Fotos → Datos → Publicar, con Revisar como cabecera de Publicar. El plano pasa a «Más herramientas (opcional)», junto a Dirección, Variantes y Material.
  - **Datos:** añadir «Venta | Alquiler».
  - **Título automático** si está vacío: «Piso en venta · 3 hab. · 112 m²», en `tourParaExportar` y como respaldo en el visor.
  - **Referencia:** no se pide si se puede deducir del título.
- **E7. Revisar:**
  - En el Modo Rápido sin plano no sugiere «fotos sin orientar» (`estudio-exportar.js:56`).
  - Se añade a Dirección un «La puerta hacia [siguiente] está aquí» que funcione sin plano (rumbo de la foto siguiente en la fila).
- **E8. Momentos por defecto** (`estudio-nucleo.js:43`):
  - Sin variantes de noche no se publica `momentos`, salvo que el agente active «Ofrecer vista de noche simulada» en Variantes.
  - «Atardecer», solo con foto.
- **E9. Variantes según `estado_obra`:**
  - En proyectos: estilos IA.
  - En construidos: máscara y colores.
  - Con «Mostrar todo» para casos mixtos.
- **E10. Fusionar duplicados (§5.2):**
  - Música, solo en Material.
  - Documentos: una lista con «Público», con migración de `inmueble.documentos` a `documentacion`.
  - Aviso legal: un campo.
  - Abrir: uno.
  - Elegir fotos: uno.
  - Guía Osmo: una.
  - ±1/±10: solo en la tarjeta.
  - Planos y renders 360 en Material pasan a enlaces a Plano, Fotos o Variantes.
- **E11. Traducción en un solo sitio:**
  - `campoTexto` sin pestañas de idioma salvo en «Idiomas y traducciones».
  - Proyecto nuevo con `idiomas: ["es"]`; inglés al activarlo.
- **E12. Asistente → Estudio:** borrar la lista de estancias al usarla, o guardarla con la referencia del inmueble (`nombresAsistente`, `estudio-fotos.js:75`).
- **E13. Barra superior:**
  - Fuera el botón de atajos (va en «?»).
  - Nombre del proyecto y «Abrir», unificados.
  - Quedan: nombre (abre Proyectos), estado, deshacer, rehacer, vista previa, guía y Publicar.

**P3, opcional:**

- **E14.** Quitar «Altura techo» (`estudio-plano.js:156`), latitud y longitud (`estudio-datos.js:149`) y la tarjeta `tour.json` (`estudio-exportar.js:323`).
- **E15.** A «Avanzado»: muros, norte, x/z numéricos, radio de conexión, subir máscara PNG, importar carpeta y el ajuste del modelo 3D.
- **E16.** Secciones automáticas, sin el botón «Usar secciones».
- **E17.** Fotos sin datos técnicos salvo error.
- **E18.** Borrar el CSS muerto (§5.1).

### 7.4 Asistente (`asistente-osmo.html`)

**P1, imprescindible:**

- **A1. Corregir el paso 9 (282-292) y el 7 (253):**
  - «Publicar → Descargar mi recorrido (ZIP)».
  - «Fotos 360 (con GPano)» en lugar de «Fotos para portales (encuadres)», que no existe.
  - «Vídeo (MP4, o WebM en Chrome)».
  - «Plano con medidas, si has subido el plano».
  - En el paso 7, «el plano es opcional».

**P2, recomendable:**

- **A2. 11 secciones → 7:**
  1. Antes de ir: material y estancias.
  2. Preparar.
  3. Cámara.
  4. Disparar: planificar los puntos y revisar cada toma.
  5. Al Estudio: pasar las fotos y crear.
  6. Publicar.
  7. Problemas.

  «Vídeo para paseo libre» pasa a un apéndice plegado «Avanzado». Fuera la casilla de la línea 271.
- **A3.** Botón «Nuevo inmueble»: reinicia casillas, estancias y tomas, con confirmación.
- **A4.** Botón «−» en el control de tomas (413).

**P3, opcional:**

- **A5.** Recortar las casillas obvias (de 41 a ~20).
- **A6.** Añadir una línea para la toma de noche (requisito día/noche con luces): repetir al anochecer, mismo punto, misma orientación y luces encendidas.
- **S1.** `preparar_panos.py` fuera, o a `docs/herramientas/`; `extraer_fotogramas.py` a la documentación del modo libre.
- **S2.** README en la fase 5.

### 7.5 Requisitos del cliente después de la simplificación

| Requisito | Función que lo cubre (se mantiene) |
|---|---|
| Recorridos propios con la Osmo 360 | Visor 360, Estudio (Fotos, EXIF/XMP, brújula) y Asistente |
| Navegación tipo Minecraft (ratón rápido, WASD y flechas) | WASD/flechas, Q/E, RePág/AvPág, «modo juego» con el ratón capturado (activado de forma explícita) y modo libre con colisiones |
| Responsive en móvil y tablet | Hoja inferior, joystick y gestos (la distribución, en la fase 4) |
| Radar tipo Counter-Strike, activable | Radar en la esquina, botón y tecla M (ampliar = plano) |
| Contacto con nombre, teléfono y pregunta al WhatsApp de la empresa | Formulario de contacto en 4 toques |
| Foto de la vista y varias capturas | Vista actual adjunta y «Añadir otra vista» (hasta 6) |
| Selector de estancia o sección | Selector preseleccionado y secciones automáticas |
| ≥ 5 estilos IA, solo en proyectos | Variantes y Personalizar en proyectos (ahora sí, aplicado por `estado_obra`) |
| Colores de paredes y suelo en construidos | Máscara y paleta en construidos |
| Día y noche con luces | Interruptor Día ⇄ Noche: foto real, o simulación si el agente la activa |
| Medidas, ficha, planos y renders | Medición, ficha, superficies, plano (PDF, DXF o imagen), galería y documentos |
| Portales, web propia y descargable | Fotos 360 con GPano, vídeo, ZIP con `url_publica`, iframe, QR y HTML autónomo ligero |
| Nombre cre8eight | Portada y crédito |
| Sonido y música por proyecto | Botón de sonido y volumen en Ajustes. Música en Material |
| Tallas S/M/L y modo claro u oscuro | Fase 4: Ajustes «Apariencia» y «Tamaño», ya previstos en PA4 |
| Agente esencialista | Este informe |

## Anexo · reproducir las mediciones

Los scripts y las capturas están en `/tmp/claude-0/-home-user-creatorflow-ai/9aa10f93-9bbe-52c5-91f2-e21dabbb4196/scratchpad/fase3/esencial/`. Usan el servidor del puerto 8765 y Playwright de `node_modules`.

| Script | Qué mide |
|---|---|
| `medir-visor.mjs` | Controles, peso JS/CSS y tiempo hasta `listo` en la demo, a 1280×800, 390×844 y 844×390 |
| `medir-contacto.mjs` | Clics del contacto con foto, en escritorio y móvil |
| `medir-estudio.mjs` | Modo Rápido de punta a punta, ZIP descargado y recuento del Modo Completo |
| `medir-tour-real.mjs` | El recorrido Rápido exportado, servido en el puerto 8790 |
| `ocupacion.mjs` | Porcentaje de pantalla tapado por la interfaz |
| `parpadeo.mjs` | §4.1 |
| `estudio-iframe.mjs` | §4.2 |
| `plano-rapido.mjs` | §4.7 |
| `idioma-it.mjs` | §4.5 |
| `funciones-rapido.mjs` | Medir, visita guiada, QR, idioma, teclado y radar |
| `tiempos-demo.mjs` | Desglose del tiempo de la demo |
| `claves.mjs` | i18n huérfanas |
| `css-sin-uso.mjs` | Selectores CSS sin uso |
| `medir-asistente.mjs` | Secciones, casillas y palabras del Asistente |
