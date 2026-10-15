# Fase 3 · Arquitectura de información y organización de cre8eight

- **Fecha:** 15/10/2026. Rama `ccr-40d07831-qbgzrt`, código auditado en `d036709` más los cambios en curso de `visor.js` e `index.html` (música e importmap), que no afectan a la organización. Este informe no cambia el código del proyecto.
- **Encargo del cliente:** «auditar que la organización de todos los apartados esté perfectamente hecha para la mejor experiencia de usuario». Aquí se decide **dónde va cada cosa, cómo se agrupa, en qué orden y cómo se llama**, en el visor, el Estudio y la Guía Osmo 360 (hoy «Asistente»). Los colores y el estilo visual son de la fase 4.
- **Método:**
  - Lectura del código: `index.html`, `visor.js`, `visor.css`, `paneles.*`, `i18n.js`, `estudio*`, `asistente-osmo.html` y `tema-muestra.html`.
  - Recorridos reales con Playwright 1.56.1 (Chromium con WebGL por software) en 390×844 y 844×390 (móvil táctil), 820×1180 (iPad táctil), 1280×800 y 1920×1080.
  - Visor con la demo (`index.html?demo`). Estudio con un proyecto de 5 fotos 2:1 sintéticas, en Rápido y en Completo. Guía de principio a fin, incluidas sus anclas al Estudio.
  - Tres perfiles: comprador en el móvil, agente inmobiliario no técnico y fotógrafo con la Osmo 360 (§4).
- **Capturas y scripts:** carpeta `/tmp/claude-0/-home-user-creatorflow-ai/9aa10f93-9bbe-52c5-91f2-e21dabbb4196/scratchpad/fase3/ia/`. Las 240 capturas están en su subcarpeta `capturas/` y aquí se citan por el nombre del archivo.
  - **Prefijos:** `v-` primera impresión del visor, `c-` comprador táctil, `e-` comprador con ratón, `l-` paseo libre y maqueta, `s-` Estudio, `a-` Guía, `t-` HUD de `tema-muestra.html`.
  - **Tamaños:** `movil` 390×844, `movilH` 844×390, `ipad` 820×1180, `portatil` 1280×800, `escritorio` 1920×1080.
- **Relación con `fase3-esencialista.md`:** el esencialista decide **qué se queda**; este informe, **dónde va y cómo se llama**. Donde coinciden se cita su identificador (por ejemplo, «= N1» o «= PA1»). Las diferencias están en §9.5.

## 1. Resumen

1. **El visor cumple todos los requisitos, pero no tiene una regla de organización.**
   - Reparte los controles en cuatro zonas que no siguen una lógica común: iconos del núcleo arriba a la derecha, raíl de paneles, pestaña de la ficha y dock de contacto.
   - Cambia las cosas de sitio según el tamaño:
     - El radar ocupa tres esquinas distintas.
     - Los modos van arriba o abajo.
     - «Compartir» es un icono en horizontal y un chip escondido dentro de la ficha en vertical.
   - En el móvil en horizontal **no se ve el precio**.
2. **Propuesta: cinco grupos, con el mismo orden y los mismos nombres en todos los tamaños.**
   - **Lugar:** título y «Salón · Planta 1 ▾».
   - **Moverse:** flechas, radar, modos y estancias.
   - **Inmueble:** una sola tarjeta con precio → ficha, «Contactar», «Foto de la vista» y «Estilo y luz».
   - **Vista:** una sola barra con radar, modo juego, música, ayuda, pantalla completa y «Más».
   - **Más:** idioma, ajustes y lo que no quepa.
   - Tres niveles: siempre visible, a un toque y en «Más». Al autoocultarse la interfaz quedan siempre el radar, el precio y «Contactar».
3. **Modo juego.** Recomiendo que **un clic deje de capturar el ratón** en el recorrido:
   - Se entra pulsando **W A S D** (las letras, no las flechas) o con un botón visible **«Modo juego»**.
   - En el **paseo libre**, una tarjeta «Haz clic para caminar».
   - Mientras dura, un aviso fijo: «Modo juego · Esc para salir».
   - Así se conserva la sensación de videojuego para quien juega, sin sorprender a quien no (§6). Comprobado: Chromium permite capturar el ratón desde la pulsación de una tecla.
4. **Un solo vocabulario** en el visor, el Estudio y la Guía (§7):
   - «Recorrido · Paseo libre · Maqueta».
   - «Radar» para el pequeño y «Plano» para el grande.
   - «Estilo y luz», en lugar de «Personalizar» (visor) y «Variantes» (Estudio).
   - «Luz: Día · Atardecer · Noche» para la vivienda y «Apariencia: Automática · Clara · Oscura» para la interfaz. Nunca «modo día/noche».
   - Además: «Foto de la vista», «Orientación», «Extras», «Publicar» y «Guía Osmo 360».
5. **Estudio:**
   - **4 pasos:** Fotos · Plano (opcional) · Datos · Publicar, con Revisar como cabecera de Publicar.
   - **Un grupo plegable «Más herramientas»:** Orientación · Estilo y luz · Extras. Sustituye a los modos Rápido y Completo.
   - **Cada apartado en un solo sitio, según para qué sirve.** Hoy la música, los documentos, los planos, los renders 360 y los colores están en dos o tres sitios a la vez.
6. **De la Guía al Estudio.** Las anclas (`estudio.html#fotos`, etc.) funcionan, pero el paso falla en tres puntos:
   - La Guía nombra menús que no existen («Exportar → ZIP para web»).
   - En el móvil abre el Estudio, que ahí no funciona.
   - Su lista de estancias solo llega al Estudio si los dos se usan en el mismo navegador.

   Propuesta: el botón «Enviar mi lista al ordenador», que manda un enlace con las estancias, y los mismos nombres que usa el Estudio.

**Gravedad alta (6 de 38 problemas, §8):**

- **V-01.** El HUD alterna entre pulsable y no pulsable en cada fotograma hasta la primera interacción: en 7 de 12 muestras no se podía pulsar.
- **V-02.** Un clic captura el ratón y deja «Contactar» a la vista, pero sin servir: el clic hace avanzar.
- **V-03.** No hay precio en el móvil en horizontal, y en escritorio se oculta con la interfaz.
- **V-04.** En el móvil en horizontal, el plano ampliado no se puede cerrar.
- **V-05.** En el móvil en vertical, la interfaz tapa el 34 % de la pantalla.
- **G-01.** La Guía nombra menús que no existen.

**P1, en resumen (§9):**

- **Núcleo:** parpadeo, modo juego explícito, barra de vista única (en columna en vertical), «Estancias y plano» y portada del inmueble.
- **Paneles:** tarjeta única con el precio siempre visible, «Foto de la vista» en primer nivel con el contacto en 4 toques, y herramientas fuera de la ficha.
- **Estudio:** 4 pasos más «Más herramientas», Datos del paso rápido coherentes con Revisar, un solo botón principal al empezar y perfil «Mi inmobiliaria».
- **Guía:** los nombres del Estudio y «Enviar mi lista al ordenador».

## 2. Cifras clave

| Medida (demo, interfaz en reposo) | 390×844 | 844×390 | 820×1180 | 1280×800 | 1920×1080 |
|---|---|---|---|---|---|
| Pantalla tapada por la interfaz (objetivo de `ux-visor-3d.md`: 10–15 %) | **34 %** | **30 %** | 18 % | 20 % | 10 % |
| Precio visible sin tocar nada | Sí (hoja) | **No** (icono de documento) | Sí (hoja) | Sí (pestaña) | Sí (pestaña) |
| Precio tras 3,5 s sin interacción | Sí | **No** | Sí | **No** | **No** |
| Dónde está el radar | Arriba dcha. | Arriba izq. | Arriba dcha. | Abajo izq. | Abajo izq. |
| Dónde están los modos | Abajo | Arriba centro | Abajo | Arriba centro | Arriba centro |
| «Compartir» | Dentro de la ficha, fuera de pantalla | Icono | Dentro de la ficha | Icono sin texto | Icono sin texto |
| «Foto de la vista» | Solo dentro de «Contactar» | Ídem | Ídem | Ídem | Ídem |

- **Preguntar con una foto:**
  - Hoy son **8 clics y 2 campos** en todos los tamaños: Contactar, Hacer foto, Capturar, Listo, sugerencia, privacidad, Enviar y Abrir WhatsApp, más nombre y teléfono. Coincide con el esencialista.
  - Propuesta: **4 toques** (§5.5).
- **Estudio en Rápido:**
  - Promete 5 pasos, pero la barra lateral enseña **8 entradas** y un control de modo.
  - En la primera pantalla hay **3 botones del color principal**.
  - El Completo tiene 8 pasos, 3 pestañas en Datos y **7 apartados en Datos → Avanzado**, varios de ellos repetidos en otros pasos.
- **Guía:** **11 pestañas**, del «Paso 0» al 9, más «Problemas y soluciones».

## 3. Mapa actual

### 3.1 Visor: dónde está cada cosa hoy

| Apartado (nombre en pantalla) | Móvil vertical 390×844 | Móvil horizontal 844×390 | iPad vertical 820×1180 | Escritorio 1280×800 y 1920×1080 |
|---|---|---|---|---|
| Título y estancia («Demo · Piso…», «Salón · 30,00 m²») | Arriba izq., **cortado** («…de 2») | Arriba izq., cortado | Arriba izq. | Arriba izq. |
| Modos («Recorrido 360 · Modo libre 3D · Maqueta 3D») | Abajo, sobre las miniaturas | Arriba centro | Abajo, sobre las miniaturas | Arriba centro |
| Iconos del núcleo: Giroscopio\*, Radar, Música\*, «Controles» y Pantalla completa | Arriba dcha., en fila | Arriba dcha. | Arriba dcha. | Arriba dcha. |
| Radar, con «Cambiar entre radar y plano completo» y «Ampliar plano» | Arriba dcha., bajo los iconos | Arriba izq., bajo el título | Arriba dcha. | **Abajo izq.** |
| Estancias (miniaturas) | Abajo, sobre la hoja | Abajo izq. | Abajo, sobre la hoja | Abajo centro |
| Precio y ficha | Hoja inferior: «349.000 € · 2 habitaciones · 1 baño…» | **Icono de documento sin precio** (raíl) | Hoja inferior | Pestaña «Ficha · precio» a la dcha. |
| «Personalizar» (estilos, momento, colores, comparar) | Pincel en la hoja + chip dentro de la ficha | Icono del raíl | Pincel + chip | Icono del raíl |
| Medir · Visita guiada | Chips dentro de la ficha | Chips dentro de la ficha | Chips dentro de la ficha | Iconos del raíl, sin texto |
| Compartir | Chip dentro de la ficha (fuera de pantalla) | Icono del raíl | Chip dentro de la ficha | Icono del raíl |
| Idioma | Chip dentro de la ficha | Dentro de Ajustes | Chip dentro de la ficha | Icono del raíl |
| Ajustes | Chip dentro de la ficha | Icono del raíl | Chip dentro de la ficha | Icono del raíl |
| Contactar | Botón en la hoja | Botón abajo dcha. | Botón en la hoja | Botón abajo dcha. + icono de WhatsApp directo |
| Foto de la vista | Solo dentro de «Contactar» | Ídem | Ídem | Ídem |
| Ayuda («Controles») | Icono arriba | Icono arriba | Icono arriba | Icono arriba |
| Visita guiada en curso | Barra arriba centro (pausa, n/total, ✕) | Ídem | Ídem | Ídem, y el icono del raíl cambia a «pausa» |
| Pistas | «Arrastra para mirar», en el centro, 9 s | Ídem | Ídem | «Arrastra para mirar · Haz clic para explorar» |
| Lo que queda tras 3,5 s sin interacción | Radar + hoja con precio | Radar + Contactar (`c-movilH-20-inactiva.png`) | Radar + hoja | Radar + Contactar + WhatsApp (`e-escritorio-04-inactiva.png`) |

Capturas: `v-movil-02-a-los-6s.png`, `v-movilH-02-a-los-6s.png`, `v-ipad-02-a-los-6s.png`, `v-portatil-02-a-los-6s.png` y `v-escritorio-02-a-los-6s.png`.

### 3.2 Visor: contenido de cada apartado hoy

- **Ficha, en este orden:**
  1. Marca.
  2. Fila de herramientas (solo móvil y horizontal).
  3. Cabecera: tipo, título, **precio otra vez**, €/m² y referencia.
  4. Datos clave (hasta 17 tarjetas).
  5. Certificado energético.
  6. Características.
  7. Descripción.
  8. Gastos.
  9. Superficies por estancia.
  10. Hipoteca.
  11. **Ubicación**.
  12. Tu agente.
  13. Avisos legales: dos que dicen casi lo mismo (`c-movil-04-ficha-final.png`).
  14. «Creado con cre8eight».
- **Contacto («Pregunta por esta vivienda»):**
  1. Agente.
  2. «¿Sobre qué estancia o zona es tu pregunta?».
  3. «Fotos de la vista»: «Hacer foto de esta vista» abre la barra «Encuadra la vista y pulsa Capturar» (Capturar / Listo).
  4. «Tu pregunta», con 3 sugerencias.
  5. Nombre y teléfono.
  6. Privacidad.
  7. «Enviar por WhatsApp», que lleva a una pantalla de 3 pasos y después a «Último paso: pega la foto».
- **«Personalizar»:** Estilo de decoración (6) · Momento del día (Día · Atardecer · Noche) · Colores (Paredes, Suelos, color libre, Restablecer) · Comparar antes / después. Es un diálogo que en el móvil tapa el 60 % de la escena (`c-movil-12-personalizar.png`).
- **Compartir:** enlace a esta vista y Copiar · WhatsApp · Email · Más opciones · Código QR y Descargar QR.
- **Ajustes:** sensibilidad del ratón · sensibilidad táctil (también en escritorio) · invertir eje vertical · reducir movimiento · música (otra vez) · idioma (solo en horizontal) · Restablecer.
- **Ayuda («Controles»):** columnas «Recorrido 360» y «Modo libre 3D». Las teclas globales (M, R, V, 1-9, H) aparecen bajo «Modo libre 3D» (`e-portatil-10-ayuda.png`).
- **Música:**
  - El icono silencia o activa. El volumen aparece al pasar el ratón o con una pulsación larga.
  - En táctil, el deslizador queda abierto encima del radar (`c-movil-17-sonido.png`).
  - El volumen se repite en Ajustes.
- **Radar:**
  - Tres botones: mostrar u ocultar (arriba), radar ⇄ plano y ampliar (en la esquina).
  - Dos teclas: M (mostrar u ocultar) y R (radar o plano).
  - Cuatro nombres: «mapa», «radar», «plano» y «minimapa» (este último, en el Estudio).
- **Portada:** «cre8eight» y una barra de carga animada (no muestra el progreso real). Ni la inmobiliaria ni la vivienda (`v-movil-00-portada.png`).

### 3.3 Estudio hoy

| Zona | 1280×800 y 1920×1080 | iPad vertical 820×1180 | Móvil 390×844 |
|---|---|---|---|
| Barra superior | Logo · nombre del proyecto (abre «Proyectos») · Guardado · Deshacer · Rehacer · «Guía Osmo 360» · atajos (icono de teclado) · **Abrir** (abre el mismo «Proyectos») · **Publicar** (principal siempre) | Igual, pero «Guía», «Abrir» y «Publicar» se quedan en iconos sin texto; aparece «Vista previa» | 7 iconos sin texto; el nombre se corta («Proyec…») |
| Barra lateral en Rápido | 1 Fotos · 2 Plano · *Dirección · Variantes · Material* (opcionales, intercalados) · 3 Datos · 4 Revisar · 5 Publicar · control de modo (botón «Rápido» o enlace «ver todas las herramientas», según el ancho) | Ídem, iconos y nombre corto | Ídem, estrecha |
| Barra lateral en Completo | 1 Fotos · **2 Material** · 3 Plano · 4 Dirección · 5 Variantes · 6 Datos · 7 Revisar · 8 Publicar | Ídem | Ídem |
| Vista previa | Fija a la derecha (460 px) | Cajón que tapa el 70 % (`s-ipad-11-vista-previa.png`) | Cajón |
| Contenido | Bien | Bien | **Roto:** nombres tapados y botones solapados (`s-movil-02-fotos.png`) |

**Contenido de cada paso hoy:**

| Paso | Contiene | Repetido en |
|---|---|---|
| Fotos | Subir y ordenar (↑↓, arrastrar); ★ estancia inicial; borrar; nombre con pestañas ES/EN; datos técnicos; «¿Primera vez? Abre el Asistente Osmo 360» | Renders 360 en Material; la Guía en la barra |
| Plano | Plantas · Subir plano · Seleccionar, Calibrar, Estancia, Muro, Conectar · «El plano es opcional» · fotos sin colocar («Colocar») · estancias · norte | Planos de arquitecto en Material; secciones y altura de cámara en Datos → Avanzado |
| Dirección y notas | Giro ±1/±10 y deslizador · asistente de alineación · vista inicial · notas | ±1/±10 otra vez bajo la vista previa |
| Variantes y colores | Variantes por foto (estilo, momento, origen) · máscara de superficies · «Editar paletas de colores» (lleva a Datos) | Paletas, estilos, momentos y aviso legal en Datos → Avanzado |
| Material del proyecto | Planos de arquitecto · renders 360 · renders fijos · modelo 3D · música · documentos | Plano, Fotos, Variantes y Datos → Avanzado |
| Datos del anuncio | Rápido: 8 datos, letras del certificado, WhatsApp y privacidad. Completo: Inmueble · Contacto y marca · **Avanzado**: idiomas, colores y estilos con aviso legal, secciones, visita guiada, documentos, música y ajustes de las fotos | Música y documentos en Material; colores en Variantes |
| Revisar | Por corregir · sugerencias · correctos. En Rápido pide **título y referencia**, que no están en sus Datos | — |
| Publicar | «Publicar mi recorrido» (ZIP, web, enlace, QR, código) · «Para portales y redes» (Fotos 360, Vídeo, Plano con medidas, Dossier) · «¿Qué subo a cada portal?» · Avanzado (**copia de seguridad**, HTML autónomo y tour.json) | La copia de seguridad es gestión del proyecto, no publicación |

### 3.4 Guía Osmo 360 hoy («Asistente»)

- **Cabecera:** «cre8eight · Asistente · DJI Osmo 360». Sin enlace al Estudio.
- **11 pastillas:**
  - Empezar (Paso 0).
  - Preparar la vivienda.
  - Configurar la cámara.
  - Planificar los puntos.
  - Disparar.
  - Vídeo para paseo libre (opcional).
  - Pasar las fotos.
  - Crear en el Estudio.
  - Revisar la calidad.
  - Publicar.
  - Problemas y soluciones.
- **Navegación:** pie con Anterior y Siguiente. El progreso se guarda en el dispositivo.
- **Enlaces al Estudio:** solo en el paso 7, en la misma pestaña: `#fotos`, `#plano`, `#datos`, `#revisar` y `#exportar`. Abren el paso correcto (verificado).
- **Sin anclas propias:** el Estudio no puede enlazar a un paso concreto de la Guía.

## 4. Evaluación con tres perfiles

### 4.1 Comprador en el móvil (llega desde idealista o WhatsApp)

| Tarea | Lo que hace hoy | Qué falla | Evidencia |
|---|---|---|---|
| Primeros 5 segundos | Portada «cre8eight» (6–13 s en la demo con WebGL por software). Luego, de golpe, 17 controles, la pista y el rótulo «Salón» | No ve la inmobiliaria, la vivienda ni el precio hasta que termina la carga; el título se corta | `v-movil-00-portada.png`, `v-movil-01-listo.png` |
| Entender la casa | Rótulo de estancia, flechas con nombre y metros, radar, plano ampliado y maqueta | La visita guiada, lo más fácil para quien no juega, está escondida dentro de la ficha. La maqueta da dos nombres a una estancia («Salón» y «Salón-comedor») | `c-movil-14-plano-grande.png`, `c-movil-19-maqueta.png` |
| Moverse | Tocar la etiqueta «Dormitorio» lleva allí en un toque | Antes del primer gesto, el HUD cambia `pointer-events` en cada fotograma: el primer toque en una miniatura o un modo puede caer en la escena | Medido con `primer-toque.mjs` (5/12) |
| Precio y datos | En vertical, en la hoja. En horizontal no hay precio: solo un icono de documento, que además se oculta | Ficha con el precio repetido, herramientas mezcladas con los datos y la ubicación casi al final | `c-movil-02-ficha-abierta.png`, `c-movilH-01b-ui-oculta-tras-moverse.png` |
| Preguntar con una foto | Funciona: 8 clics y 2 campos, en los 3 tamaños táctiles | Nada fuera del formulario anuncia que se puede preguntar con una foto, el diferenciador del producto | `c-movil-05-contacto.png` … `c-movil-10-paso-whatsapp.png` |
| Imaginar (estilo, luz, colores) | Pincel → diálogo | El diálogo tapa el 60 % de la escena y no se ve el cambio | `c-movil-12-personalizar.png` |
| Música | Suena tras el primer toque | No se avisa. Al tocar el icono, el volumen queda abierto sobre el radar | `c-movil-17-sonido.png` |

**Conclusión:** en vertical completa todas las tareas. En horizontal no ve el precio y se puede quedar atascado con el plano ampliado (`c-movilH-14-plano-grande.png`).

### 4.2 Agente inmobiliario no técnico, con el Estudio

1. **Primera visita** (`s-portatil-01-primera-visita.png`):
   - El proyecto se crea solo, en Rápido.
   - Hay **tres botones del color principal**: «Elegir fotos», «Continuar → Plano» (sin fotos) y «Publicar».
   - La barra lateral enseña 8 entradas.
2. **«Elegir fotos»** (5 fotos): los nombres salen de los archivos («Salón», «Cocina»…), pero cada uno lleva pestañas ES/EN (`s-portatil-02-fotos.png`).
3. **«Continuar → Plano»:**
   - Herramientas de experto: Calibrar, Estancia, Muro, Conectar y norte.
   - Dos botones para seguir: «Continuar → Datos» arriba y «Continuar sin plano → Datos» en el panel (`s-portatil-04-plano.png`).
4. **Datos:** 8 campos y las letras del certificado (`s-portatil-05-datos.png`).
5. **Revisar:**
   - «2 cosas por corregir».
   - Sugiere el título y la referencia, que **no están en el paso Datos** del Rápido.
   - «Ver» abre todos los datos, pero no lleva al campo (`s-portatil-07-revisar.png`, `s-revisar-ver-anuncio.png`).
6. **Publicar:** bien ordenado (`s-portatil-08-publicar.png` a `-10`).
7. **En Completo** (`s-portatil-13-material.png`, `s-portatil-14-datos-avanzado.png`):
   - Material repite planos (Plano), renders 360 (Fotos y Variantes), música y documentos (Datos).
   - Datos → Avanzado guarda 7 apartados que pertenecen a otros pasos.
8. **Por tamaño:**
   - En iPad funciona, pero la barra pierde los textos (`s-ipad-02-fotos.png`).
   - En el móvil la lista se rompe (`s-movil-02-fotos.png`).

**Conclusión:** publica en unos 8 clics y 7 campos. Lo que le hace dudar es dónde está cada cosa (duplicados) y que Revisar pida lo que el paso rápido no enseña.

### 4.3 Fotógrafo con la Osmo 360, siguiendo la Guía en el móvil

1. **En la vivienda, bien.** Las listas y el «Control de tomas» funcionan y se guardan (`a-movil-00-inicio.png`, `a-movil-05-paso-4.png`).
2. **11 pastillas que empiezan en «Paso 0»**, sin agrupar por momento (antes, en la vivienda, en el ordenador). En el móvil solo se ven 2 o 3 (`a-movil-00-inicio.png`).
3. **Paso 7, «Crear en el Estudio»:**
   - Los enlaces abren el paso correcto, pero en la misma pestaña y **en el móvil, donde el Estudio no funciona** (`a-movil-08-paso-7.png`, `s-movil-02-fotos.png`).
   - Presenta el plano como obligatorio («calíbralo… dibuja las estancias»), cuando en Rápido es opcional.
4. **La lista de estancias se queda en el navegador del móvil** (`cre8eight:asistente`). Solo nombra las fotos si el Estudio se abre en el mismo navegador, y no se avisa de ello.
5. **Paso 9:** nombra «Exportar → ZIP para web», «Exportar → Fotos para portales», «Vídeo MP4» y «Plano PNG», que no existen con esos nombres (`a-movil-10-paso-9.png`, = esencialista §4.12).
6. **Pasos 8 y 9:** duplican Revisar y Publicar del Estudio.

**Conclusión:** la parte de campo es buena. El fotógrafo se pierde al pasar al Estudio.

## 5. Organización propuesta

### 5.1 Principios

1. **Una regla de agrupación para todo el producto.** Cada control pertenece a uno de estos grupos:
   - **Lugar:** dónde estoy.
   - **Moverse:** ir a otra estancia o cambiar de modo.
   - **Inmueble:** precio, ficha, contactar, foto de la vista, estilo y luz, compartir.
   - **Vista:** cómo miro y oigo.
   - **Más:** idioma y ajustes.
2. **El mismo sitio relativo y el mismo nombre en todos los tamaños.** Solo cambia la forma: fila ↔ columna, tarjeta ↔ hoja.
3. **Tres niveles:**
   - **N1, siempre visible.** Al autoocultarse quedan **radar, precio y «Contactar»**.
   - **N2, a un toque.**
   - **N3, en «Más».**
4. **Lo que no se puede usar no se ve:**
   - Pantalla completa en el iPhone.
   - Modos cuando solo hay uno.
   - Radar sin plano (= N4).
   - «Estilo y luz» sin contenido.
5. **El Estudio se ordena por lo que verá el cliente, no por quién entregó el material.** Cada apartado vive en un solo sitio.
6. **El mismo vocabulario en el visor, el Estudio y la Guía** (§7).

### 5.2 Visor: nivel de cada control por tamaño

| Grupo | Control | Móvil vertical | Móvil horizontal | Tablet vertical | Escritorio y tablet horizontal |
|---|---|---|---|---|---|
| Lugar | Título y «Salón · Planta 1 ▾» (abre «Estancias y plano») | N1 | N1 | N1 | N1 |
| Moverse | Flechas del suelo con nombre | N1 | N1 | N1 | N1 |
| Moverse | Radar (esquina) y su «Ampliar» → «Estancias y plano» | N1 | N1 | N1 | N1 |
| Moverse | Estancias en miniatura | N2 (en «Estancias y plano») | N2 | N1 (tira) | N1 (tira) |
| Moverse | Modos «Recorrido · Paseo libre · Maqueta» (solo con 2 o más) | N1 | N1 | N1 | N1 |
| Moverse | Visita guiada | N2 (portada, «Estancias y plano», «Más») | N2 | N1 (al principio de la tira) | N1 (acción con texto) |
| Inmueble | Precio y 3 datos → ficha | N1 (no se oculta) | N1 (píldora) | N1 | N1 (tarjeta) |
| Inmueble | Contactar | N1 (no se oculta) | N1 | N1 | N1 |
| Inmueble | Foto de la vista | N1 | N1 | N1 | N1 |
| Inmueble | Estilo y luz (si hay contenido) | N1 | N1 | N1 | N1 (acción con texto) |
| Inmueble | Medir | N3 («Más») | N3 | N2 («Más») | N1 (acción con texto) |
| Inmueble | Compartir | N2 (cabecera de la ficha) y N3 | N2 / N3 | N2 / N3 | N2 / N3 |
| Vista | Radar sí/no | N1 | N1 | N1 | N1 |
| Vista | Música (si hay) | N1 | N1 | N1 | N1 |
| Vista | Ayuda | N1 | N1 | N1 | N1 |
| Vista | Modo juego (solo con ratón) | — | — | — | N1 |
| Vista | Pantalla completa (si el navegador la tiene) | N3 | N3 | N1 | N1 |
| Vista | Mirar moviendo el móvil (giroscopio) | N3 | N3 | N3 | — |
| Más | Idioma (también en la portada) | N3 | N3 | N3 | N3 |
| Más | Ajustes | N3 | N3 | N3 | N3 |

### 5.3 Visor: mapa propuesto por zona

```
MÓVIL VERTICAL (390×844)
  Arriba izq.   Título · «Salón · Planta 1 ▾»   y el radar debajo (como en Counter-Strike)
  Arriba dcha.  Barra de vista en COLUMNA: Radar · Música · Ayuda · Más
  Centro        Escena, flechas con nombre, una sola pista a la vez
  Abajo         [Recorrido | Paseo libre | Maqueta]   (solo con 2 modos o más)
                Tarjeta en UNA fila: [349.000 € · 2 hab · 92 m² ›] [Foto] [Estilo y luz] [Contactar]
  En reposo     Radar y tarjeta (≈ 13 % de la pantalla)

MÓVIL HORIZONTAL (844×390)
  Arriba izq.   Título · «Salón ▾» y el radar debajo (pequeño)
  Arriba centro Modos (compactos, solo con 2 o más)
  Arriba dcha.  Barra de vista en FILA: Radar · Música · Ayuda · Más
  Abajo dcha.   [349.000 € ›] [Foto] [Estilo y luz] [Contactar]   ← el precio vuelve a verse
  Ficha         Panel lateral derecho (como hoy). El plano ampliado se pone por encima de todo

TABLET VERTICAL (820×1180)
  Como el móvil vertical, más:
  - la tira de estancias encima de la tarjeta, con «▶ Visita guiada» al principio;
  - Pantalla completa en la barra de vista (en iPad sí funciona).

ESCRITORIO Y TABLET HORIZONTAL (≥ 1024 de ancho)
  Arriba izq.   Logo · Título · «Salón · Planta 1 ▾»   y el radar debajo
  Arriba centro Modos
  Arriba dcha.  Barra de vista en FILA: Radar · Modo juego · Música · Ayuda · Pantalla completa · Más
  Derecha       Tarjeta del inmueble: tipo y operación · 349.000 € · 2 hab · 1 baño · 92 m² · C
                [Contactar] [Foto de la vista] · «Ver ficha ›»
                Debajo, acciones CON TEXTO: Estilo y luz · Visita guiada · Medir
  Abajo centro  Estancias en miniatura, agrupadas por planta o zona
  En reposo     Radar y la tarjeta reducida a «349.000 € · Contactar»
```

- **«Más» en el móvil:** Visita guiada · Medir · Compartir · Idioma · Ajustes · Pantalla completa\* · Mirar moviendo el móvil\*. En escritorio: Compartir · Idioma · Ajustes.
- **«Estancias y plano»** es una sola hoja (móvil) o ventana (escritorio) que junta tres piezas que hoy están separadas: el plano ampliado (norte arriba, con pestañas de planta), la galería de estancias y las plantas.
  - **Contenido:** plano, «▶ Visita guiada» y la lista de estancias con miniatura, agrupada por zona («Zona de día», «Zona de noche», «Exterior») o por planta. Así la vivienda se ve organizada por secciones, como pide el cliente; hoy las secciones solo se usan en el selector del contacto.
  - **Se abre con:** el título «Salón ▾», el «Ampliar» del radar y la tecla M.
- **Ajustes de `tema-muestra.html`:** su HUD (`t-movil-hud-propuesto.png`, `t-portatil-hud-propuesto.png`) es la base correcta. Necesita cinco cambios:
  1. Quitar de la barra el sol y la luna de «Apariencia» (va a Ajustes). Se confunde con el día y la noche de la vivienda (§7).
  2. Poner «Modo juego» en escritorio.
  3. Radar arriba a la izquierda también en escritorio.
  4. En el móvil, la tarjeta en una sola fila con botones pequeños, no dos botones grandes, para que la escena respire.
  5. Añadir «Más» y «Salón ▾», que la muestra no tiene.

### 5.4 Ficha propuesta (orden)

1. **Cabecera:** tipo · operación, título, precio, €/m², referencia e icono «Compartir». En la hoja abierta, la tarjeta hace de cabecera, sin repetir el precio dos veces en pantalla.
2. **Datos clave**, como mucho 6: m² construidos · m² útiles · habitaciones · baños · planta y ascensor · **letra energética** (obligatoria en la publicidad). Debajo, una línea de gastos (comunidad e IBI) (= PA10).
3. **Descripción**, 3 líneas y «Leer más».
4. **Ubicación**, con un solo «Ver en el mapa» (= PA9). Para quien compra es de lo primero que mira, y hoy va la undécima.
5. **Renders y planos** (galería).
6. **Características:** el resto de los datos (orientación, año, estado, calefacción, aire, garaje, trastero, terraza, piscina, jardín) más la lista libre.
7. **Superficies por estancia**, plegada.
8. **Certificado energético** con la escala completa.
9. **Calculadora de hipoteca**, plegada.
10. **Documentos.**
11. **Tu agente**, con llamar y email.
12. **Avisos legales sin duplicar**, crédito de la música y «Creado con cre8eight».

**Sale de la ficha** la fila de herramientas (Personalizar, Medir, Visita guiada, Compartir, Idioma y Ajustes), que pasa al HUD o a «Más».

### 5.5 Preguntar con una foto (flujo propuesto, coherente con PA1 y PA2)

1. **«Foto de la vista»**, opcional y repetible, desde la tarjeta:
   - Hace la foto al momento, sin abrir nada.
   - Da un destello, el aviso «Foto 1 añadida a tu consulta · Deshacer» y un contador en «Contactar» («Contactar · 2»).
   - El visitante puede seguir paseando y hacer hasta 6.
2. **«Contactar»:** si no hay fotos, la vista actual se adjunta sola como foto 1, con ✕. La estancia viene preseleccionada. «Añadir otra vista» abre la barra de captura de hoy.
3. **Pregunta:** una sugerencia o texto libre. Nombre y teléfono se recuerdan.
4. **Privacidad.**
5. **«Enviar por WhatsApp»:** en el mismo gesto copia la foto y abre el chat. Después, una única pantalla: «Pega la foto y envía».

**Total:** 4 toques y 2 campos la primera vez; 4 toques y 0 campos después.

**Nombres:** «Foto de la vista» (botón), «Añadir otra vista» (formulario), «Hacer foto» y «Listo» (barra de captura).

### 5.6 Portada y primeros 5 segundos

- **Mientras carga:**
  - Logo y nombre **de la inmobiliaria**.
  - Título del inmueble, precio y «2 hab · 1 baño · 92 m²».
  - De fondo, la miniatura de la estancia inicial difuminada.
  - Progreso real.
  - «Creado con cre8eight», pequeño, abajo.
- **Cuando está lista:**
  - **«Empezar visita»** (principal).
  - **«▶ Visita guiada»** (secundario, con 3 estancias o más).
  - Idiomas «ES · EN · FR · DE», si hay 2 o más.
  - «♪ Con música», si el tour tiene música. El toque en «Empezar» es el gesto que permite sonar.
  - Una línea de controles según el aparato:
    - **Táctil:** «Arrastra para mirar · toca las flechas para avanzar».
    - **Ratón:** «Arrastra para mirar · W A S D para moverte».
- **Después:** la escena con el HUD ya reducido (§5.3) y la pista solo 6 s. La pista se recuerda en `localStorage`.
- **Sin portada:** con `?embed` (vista previa del Estudio). Un enlace a una vista concreta (`#v=`) sí la muestra, pero «Empezar» lleva a esa vista.

### 5.7 Estudio propuesto

```
BARRA SUPERIOR
  [c8 Estudio] [Proyecto: Ático en Chamberí ▾] [● Guardado]      [↶][↷] [Vista previa*] [Guía Osmo 360] [?] [Mi inmobiliaria] [Publicar]
   «Proyecto ▾» = Mis proyectos · Proyecto nuevo · Copia de seguridad · Restaurar copia · Importar carpeta (avanzado)
   «?» = Ayuda y atajos de teclado (sustituye al icono de teclado)
   «Publicar»: secundario hasta que haya fotos; principal después

BARRA LATERAL (igual en todos los anchos; sin «Rápido/Completo»)
   1 Fotos               5 fotos
   2 Plano (opcional)    Sin plano · «Saltar»
   3 Datos               Precio, m², certificado…
   4 Publicar            2 por corregir      ← Revisar es su cabecera «Antes de publicar»
   ─────────────
   Más herramientas ▸    (se abre y se cierra; se recuerda)
      Orientación y notas
      Estilo y luz
      Extras
```

| Apartado | Va en (propuesto) | Hoy está en |
|---|---|---|
| Fotos 360 y renders 360 como estancias; orden (= orden de la visita guiada); estancia inicial; nombres de la Guía | **1 Fotos** | Fotos y Material (renders 360) |
| Plano del arquitecto (PDF, DXF o imagen), calibrar, colocar las fotos, estancias, plantas, **zonas** («secciones») | **2 Plano** | Plano, Material (planos) y Datos → Avanzado (secciones) |
| Muros, norte, conexiones a mano y radio, coordenadas, altura de la cámara | **2 Plano → Avanzado** (plegado, = E15) | Plano y Datos → Avanzado |
| Inmueble (con operación, estado de la obra, título y referencia automáticos y editables) | **3 Datos → Inmueble** | Datos |
| Contacto y marca | **Mi inmobiliaria** (perfil, = E1); en el paso queda «Contacto: usando Mi inmobiliaria · Cambiar solo en este inmueble» | Datos → Contacto y marca |
| Idiomas y traducciones (las pestañas ES/EN solo aquí, = E11) | **3 Datos → Idiomas** | Datos → Avanzado y cada campo |
| Revisar | **4 Publicar → «Antes de publicar»** (`#revisar` sigue funcionando) | Paso propio |
| Giro de la foto, alineación con una puerta (también sin plano, = E7), vista inicial, notas | **Más herramientas → Orientación y notas** | «Dirección y notas» |
| Estilos IA (proyectos), zonas de color y paletas (construidas), luz (día, atardecer, noche), aviso legal, antes y después | **Más herramientas → Estilo y luz** (lo que se ve depende del estado de la obra, = E9) | Variantes y Datos → Avanzado |
| Renders e imágenes para la galería, modelo 3D (paseo libre y maqueta), documentos (una sola lista con «Público»), música de fondo, visita guiada (paradas y textos) | **Más herramientas → Extras** | Material y Datos → Avanzado |
| Copia de seguridad (descargar y restaurar juntas) | **Barra → Proyecto ▾** | Publicar → Avanzado (descargar) y «Abrir» (restaurar) |

**Por tamaño:**

- **≥ 1280:** como hoy, con la vista previa fija.
- **820–1279:** vista previa en cajón. La barra superior conserva textos cortos («Guía», «Publicar»).
- **Menos de 760 (móvil):** pantalla «El Estudio necesita un ordenador o un iPad», con «Enviarme el enlace» (compartir, WhatsApp o email), «Abrir la Guía Osmo 360» y «Seguir aquí de todos modos».

**Primera visita:**

- Un solo botón principal, «Elegir fotos», y el enlace «¿Aún no tienes las fotos? Guía Osmo 360». Será la única entrada a la Guía dentro de Fotos (= E10).
- Si el perfil está vacío, un aviso: «Completa Mi inmobiliaria (1 minuto): se usa en todos tus recorridos».
- «Continuar» no aparece hasta que haya fotos.

### 5.8 Publicar propuesto (exportaciones, ordenadas por destino)

| Bloque | Contenido | Hoy |
|---|---|---|
| **Antes de publicar** | Por corregir y sugerencias. Cada una lleva al campo exacto | Paso «Revisar» y aviso en Publicar |
| **1 · Tu web** | «Descargar mi recorrido (ZIP)» → súbelo → enlace, QR y «Código para incrustarlo». La web sale de Mi inmobiliaria; sin web, no hay QR de ejemplo (= E4) | «Publicar mi recorrido» |
| **2 · Portales y redes** | Fotos 360 · Vídeo de la visita (16:9, 9:16, 1:1) · Plano con medidas (solo con plano, = E4) · «¿Qué subo a cada portal?» | «Para portales y redes» |
| **3 · Para tus clientes** | Dossier en PDF · **«Recorrido en un solo archivo»** (abre sin internet; hoy «Archivo HTML autónomo») · Descargar QR | Repartido entre «Para portales y redes» y «Avanzado» |
| **Avanzado** | tour.json, si se mantiene (el esencialista propone quitarlo, E14) | Avanzado |
| (sale) | Copia de seguridad → «Proyecto ▾» | Avanzado |

### 5.9 Guía propuesta y paso al Estudio

| Fase | Paso | Contenido | Viene de |
|---|---|---|---|
| Antes de ir | **1 · Material y estancias** | Material (resumido) y lista de estancias, con **«Enviar mi lista al ordenador»** | Paso 0 |
| En la vivienda | **2 · Preparar la vivienda** | Igual | Paso 1 |
| En la vivienda | **3 · Configurar la cámara** | Igual | Paso 2 |
| En la vivienda | **4 · Hacer las fotos** | Dónde poner la cámara, disparar, revisar cada toma, control de tomas (+ y −) y toma de noche (= A6) | Pasos 3, 4 y parte del 8 |
| En el ordenador | **5 · Pasar al Estudio** | Pasar las fotos y los 4 pasos del Estudio con sus enlaces, «Plano (opcional)» | Pasos 6 y 7 |
| En el ordenador | **6 · Publicar** | Resumen con los nombres del Estudio: Tu web · Portales y redes · Para tus clientes | Paso 9 |
| Apéndice | **Paseo libre (vídeo, opcional)** | Plegado | Paso 5 |
| Apéndice | **Problemas frecuentes** | También con el «?» de la cabecera | Problemas y soluciones |

- **Navegación:**
  - Cabecera «Guía Osmo 360», con «Abrir el Estudio» y «?».
  - Encabezado «Paso 4 de 6 · Hacer las fotos ▾», que abre la lista de pasos agrupada por fase, con barra de progreso. Sustituye a las 11 pastillas.
  - Numeración desde 1.
  - Anclas por paso (`#camara`, `#fotos`, `#estudio`, `#problemas`) para que el Estudio enlace al paso que haga falta. Por ejemplo, el aviso de «costura» de Revisar lleva a `#problemas`.
- **Paso al Estudio, en tres casos:**
  1. **En el mismo dispositivo y con pantalla grande:** «Abrir el Estudio» (`estudio.html#fotos`).
  2. **En el móvil:** el botón pasa a ser **«Ábrelo en tu ordenador»**, con «Copiar enlace» y «Enviármelo» (WhatsApp o email). El enlace lleva la lista: `estudio.html#fotos&estancias=Entrada,Salón,Cocina…&tomas=…`.
  3. **El Estudio recibe la lista**, la enseña («Nombres de tu Guía: Entrada, Salón (2)… · Usar · No usar») y la borra al usarla (= E12). Hoy solo funciona sin avisar y en el mismo navegador.

## 6. Captura del ratón («modo juego»): decisión

**Lo que pasa hoy** (`visor.js`, `clic` → `capturarRaton`), verificado en 1280×800 y 1920×1080:

1. Un **clic simple** en una zona sin flecha ni suelo captura el ratón. Desaparecen el cursor, la barra, los modos, los iconos y la galería (`e-portatil-01-tras-clic.png`).
2. A los 4 s también se ocultan la ficha y las herramientas. Solo quedan el radar, una mira de 6 px y **«Contactar», que se ve pero no se puede pulsar** (`e-portatil-02-modo-juego-a-los-4s.png`).
3. Si el visitante intenta llegar a «Contactar», la cámara gira (no hay cursor) y **el clic le hace avanzar**. En la prueba, pasó del salón al recibidor.
4. **No hay ningún aviso propio de cómo salir.** El navegador enseña su aviso de Esc unos segundos y desaparece.
5. Al salir con Esc aparece «Haz clic para explorar», que **invita a volver a capturarlo** (`e-portatil-03-tras-esc.png`).
6. La pista inicial, «Arrastra para mirar · Haz clic para explorar», no dice que el clic esconde el cursor.

**Alternativas evaluadas** (todas conservan el requisito «tipo Minecraft»: ratón rápido para mirar, W A S D y flechas):

| Opción | Cómo se entra | A favor | En contra | Valoración |
|---|---|---|---|---|
| A · Hoy | Un clic en la escena | Inmediato para quien juega | Sorprende a quien no juega; «Contactar» deja de funcionar; el clic más natural («a ver qué pasa») esconde el cursor | No |
| B · Doble clic | Doble clic en la escena | No se dispara sin querer | No se descubre. Quien no juega hace doble clic cuando «algo no responde». El primer clic ya hace su propia acción (avanzar) | No |
| C · Solo un botón «Modo juego» | Botón 🎮 | Explícito, cero sorpresas | Quien juega espera entrar con W A S D, no buscando un botón | Insuficiente sola |
| **D · W A S D + botón «Modo juego» + clic en el paseo libre** | Pulsar **W, A, S o D** (letras, no flechas) con el ratón sobre la escena; o el botón 🎮; en el **paseo libre**, la tarjeta «Haz clic para caminar» | Quien juega entra con su gesto natural. Quien no juega nunca lo activa por error (arrastra y toca flechas). Las flechas siguen siendo el camino accesible | Cambia un hábito ya documentado en ESQUEMA | **Recomendada** |
| E · D + preferencia | Además, en Ajustes: «Capturar el ratón con un clic» (desactivado por defecto) | Quien quiera el comportamiento de hoy lo recupera | Un ajuste más | Recomendada como complemento |

**Cómo funciona la opción recomendada (D + E):**

- **Recorrido (360):**
  - Arrastrar mira, como en Street View. Un clic en una flecha o en el suelo avanza. Un clic en el vacío no hace nada.
  - W A S D y las flechas mueven entre estancias, como hoy. **W A S D además entra en el modo juego** si hay ratón (`pointer: fine`) y los atajos están activos (WCAG 2.1.4). **Las flechas nunca capturan.**
- **Paseo libre:**
  - Al entrar, la tarjeta «Haz clic para caminar · W A S D · ratón para mirar · Esc para salir», al estilo del «Click to play» de Minecraft.
  - Aquí el clic sí captura: es lo que se espera en un modo de videojuego elegido a propósito.
  - Arrastrar también mira.
- **Mientras dura:**
  - Un aviso fijo arriba en el centro: **«Modo juego · Esc para salir»**. Se atenúa al 40 % tras 3 s, pero no desaparece.
  - Queda visible el radar, como en Counter-Strike.
  - Se ocultan los botones que no se pueden pulsar, incluido «Contactar». El precio puede seguir como texto no pulsable (P3).
- **Al salir:** el aviso, una sola vez, «Has salido del modo juego · W A S D o 🎮 para volver». Nunca «Haz clic para explorar».
- **Botón:** 🎮 «Modo juego» en la barra de vista, solo en escritorio con ratón, con `aria-pressed` y la ayuda «Mira con el ratón como en un videojuego (Esc para salir)».
- **Ajustes → Controles:**
  - «Velocidad de giro».
  - «Entrar en modo juego con W A S D» (sí por defecto).
  - «Capturar el ratón con un clic» (no por defecto).
  - «Atajos de teclado».
- **Táctil:** sin cambios. Arrastrar, flechas del suelo y joystick en el paseo libre.
- **Pistas:**
  - **Ratón:** «Arrastra para mirar · W A S D para moverte».
  - **Táctil:** «Arrastra para mirar · toca las flechas para avanzar».
- **Viabilidad, comprobada:** en Chromium, `requestPointerLock()` funciona dentro del `keydown` de la W, sin clic previo (`prueba-wasd.mjs`, resultado `capturado: "lienzo"`). Pulsar una tecla cuenta como gesto del usuario. Si el navegador lo rechaza, se sigue mirando con el arrastre (plan de contingencia de `docs/calidad.md`).
- **Para la ronda de decisiones del cliente:** proponer D + E como recomendada, A (como hoy) y C (solo botón).

## 7. Vocabulario unificado

| Concepto | Hoy (dónde) | Propuesto (visor, Estudio y Guía) |
|---|---|---|
| El producto | «recorrido virtual» (visor y Estudio), «recorrido 3D» (Guía), «tour» (archivos) | **recorrido virtual**. «tour» solo en el código |
| Modo 360 | «Recorrido 360» | **Recorrido** (en `aria-label`, «Recorrido 360») |
| Modo libre | «Modo libre 3D» (visor), «paseo libre» (Estudio), «paseo libre 3D» (Guía) | **Paseo libre** |
| Modo maqueta | «Maqueta 3D» | **Maqueta** (en `aria-label`, «Maqueta 3D») |
| Captura del ratón | Sin nombre: «capturar el ratón» (ayuda), «Haz clic para explorar» (pista) | **Modo juego** · «Esc para salir» |
| Mapa pequeño | «Mostrar u ocultar el mapa», «Cambiar entre radar y plano completo», «Plano» (`aria`), «minimapa» (Estudio) | **Radar** · «Mostrar radar / Ocultar radar» |
| Mapa grande | «Ampliar plano», «plano completo» | **Plano**, dentro de **«Estancias y plano»** |
| Mapa de la zona | — | **Mapa** solo para la ubicación («Ver en el mapa») |
| Teclas del mapa | M (mostrar u ocultar), R (radar o plano) | **R** radar sí/no · **M** «Estancias y plano» (convención de videojuego) |
| Navegar por estancias | «Estancias» (`aria`) y miniaturas | **Estancias** (título «Salón ▾» y tira) |
| Grupos de estancias | «Secciones de la vivienda» (Estudio) | **Zonas** («Zona de día», «Zona de noche», «Exterior»). El campo sigue llamándose `secciones` |
| Galería de imágenes | «Renders y planos» | **Renders y planos** (se queda) |
| Ficha | «Ficha · precio» (pestaña), «Abrir ficha del inmueble», «Ficha del inmueble» | El **precio** abre la **Ficha** («Ver ficha ›») |
| Datos (Estudio) | «Datos del anuncio» | **Datos**, con el subtítulo «Lo que verá el cliente en la ficha» |
| Contacto | «Contactar», «Pregunta por esta vivienda», «Escribir por WhatsApp», «Enviar consulta», «Enviar por WhatsApp» | Botón **Contactar** · título «Pregunta por esta vivienda» · **Enviar por WhatsApp** |
| Foto | «Fotos de la vista», «Hacer foto de esta vista», «Capturar», «Encuadra la vista y pulsa Capturar» | Botón **Foto de la vista** · «Añadir otra vista» · barra «Hacer foto» / «Listo» |
| Personalización | «Personalizar» (visor), «Variantes y colores» / «Variantes» (Estudio), «Colores, estilos y aviso legal» (Datos → Avanzado) | **Estilo y luz**, igual en el visor y en el Estudio |
| Estilos | «Estilo de decoración», «Estilos IA», «Recreación con IA» | **Estilo** (en el panel) · sello «Recreación virtual · IA» |
| Día y noche de la vivienda | «Momento del día», «Momentos del día», «ambiente de día y de noche» (cliente) | **Luz: Día · Atardecer · Noche** |
| Claro u oscuro de la interfaz | «Modo día y noche» (requisito de la fase 4), «Aspecto para el visitante» (ronda 1, B) | **Apariencia: Automática · Clara · Oscura**. Solo en Ajustes y con un icono que no sea un sol ni una luna |
| Colores | «Colores» (paredes y suelos), «Máscara de superficies», «paletas» | **Colores** (visor) · **Zonas de color** y **Paletas** (Estudio) |
| Comparar | «Comparar antes / después» | **Antes y después** |
| Visita guiada | «Visita guiada», «Detener visita», «Vídeo de la visita» (Estudio), «Vídeo de la visita guiada» (Guía) | **Visita guiada** (▶ / ❚❚ / ✕ «Salir de la visita») · **Vídeo de la visita** |
| Ayuda | «Controles» (visor), «Atajos de teclado» (Estudio), «Problemas y soluciones» y «Ayuda» (Guía) | **Ayuda** (visor: «Ayuda y controles»; Estudio: «Ayuda y atajos»; Guía: «Problemas frecuentes») |
| Ajustes | «Ajustes» (visor), «Ajustes de las fotos» (Estudio) | **Ajustes** (visor) · «Altura de la cámara» (Estudio, en Plano → Avanzado) |
| Idioma | «Idioma» | **Idioma · Language** |
| Música | «Silenciar música · título», «Activar música», «Música», «Volumen de la música», «Música de fondo» (Estudio) | Botón **Música** (activar o silenciar) · el volumen en Ajustes · **Música de fondo** (Estudio, en Extras) |
| Orientación de las fotos | «Dirección y notas», «Dirección», «Orientar», «Giro de la foto», «Alinear», «sin orientar» | **Orientación y notas** (corto: «Orientación»), con «Girar la foto» y «Alinear con una puerta». «Dirección» se confunde con la dirección postal y la de la web |
| Material del arquitecto | «Material del proyecto» | **Extras** («Renders, 3D, documentos, música y visita guiada») |
| Modos del Estudio | «Rápido (recomendado)», «Completo», «Modo rápido · ver todas las herramientas» | Desaparecen: **«Más herramientas»** plegable |
| Publicar | «Publicar» (Estudio), ancla `#exportar`, «Exportar → ZIP para web» (Guía), «Publicar y descargar» (`title`) | **Publicar** en todas partes. Ancla `#publicar` (`#exportar` queda como alias) |
| ZIP de la web | «Descargar mi recorrido (ZIP)», «ZIP para web» (Guía) | **Descargar mi recorrido (ZIP)** |
| HTML autónomo | «Archivo HTML autónomo», «Crear archivo HTML» | **Recorrido en un solo archivo** (abre sin internet) |
| Revisar | «Revisar» (Estudio), «Revisar la calidad» (Guía) | **Antes de publicar** (Estudio) · «Revisa cada toma» (Guía, en «Hacer las fotos») |
| Proyectos | «Abrir», el nombre del proyecto y el diálogo «Proyectos» | **Proyecto ▾**, el nombre como menú |
| Perfil | No existe | **Mi inmobiliaria** |
| Guía de captura | «Guía Osmo 360» (barra del Estudio), «Asistente Osmo 360» (Fotos), «Asistente · DJI Osmo 360» (cabecera) | **Guía Osmo 360** |
| Estancia y punto de foto | La foto «Salón» y la estancia «Salón-comedor» con nombres distintos | **Estancia**: un solo nombre. La foto toma el de la estancia donde está colocada |

## 8. Problemas encontrados

Las capturas están en la carpeta `…/scratchpad/fase3/ia/capturas/` (ruta completa en la cabecera).

| ID | Gravedad | Dónde | Problema | Evidencia |
|---|---|---|---|---|
| V-01 | **Alta** | Visor, todos | Hasta la primera interacción, `body.ui-inactiva` se alterna **en cada fotograma** (`classList.toggle(…, undefined)`): barra, modos, iconos y miniaturas cambian de `pointer-events` sin parar. El primer toque o clic sobre ellos puede caer en la escena (en escritorio, captura el ratón) (= esencialista §4.1) | `primer-toque.mjs`: la galería solo recibía el toque en 5 de 12 muestras |
| V-02 | **Alta** | Visor, escritorio | Un clic captura el ratón: desaparecen el cursor y casi toda la interfaz; «Contactar» se ve pero no funciona (el clic hace avanzar); no hay un aviso propio de cómo salir; al salir se invita a volver a hacer clic (§6) | `e-portatil-01-tras-clic.png`, `e-portatil-02-modo-juego-a-los-4s.png`, `e-portatil-03-tras-esc.png` |
| V-03 | **Alta** | Visor, móvil horizontal y escritorio | En horizontal no se ve el precio, solo un icono de documento sin texto. En horizontal y en escritorio, el precio desaparece al autoocultarse la interfaz | `v-movilH-02-a-los-6s.png`, `c-movilH-20-inactiva.png`, `e-escritorio-04-inactiva.png` |
| V-04 | **Alta** | Visor, móvil horizontal | El plano ampliado queda debajo del raíl y de «Contactar»; su botón «Reducir» no se puede pulsar | `c-movilH-14-plano-grande.png` |
| V-05 | **Alta** | Visor, móvil vertical | La interfaz tapa el **34 %** de la pantalla: 3 capas abajo (modos, miniaturas y hoja) y 4 iconos con el radar arriba. El título se corta («…de 2») | `v-movil-02-a-los-6s.png` |
| G-01 | **Alta** | Guía, pasos 7 y 9 | Nombra menús que no existen («Exportar → ZIP para web», «Exportar → Fotos para portales», «Vídeo MP4», «Plano PNG») y presenta el plano como obligatorio (= esencialista §4.12) | `a-movil-10-paso-9.png`, `a-movil-08-paso-7.png` |
| V-06 | Media | Visor, portada | La portada solo muestra «cre8eight». Ni la inmobiliaria, ni la vivienda, ni el precio. Al acabar la carga aparece todo el HUD de golpe (17 a 25 controles) | `v-movil-00-portada.png`, `v-movil-01-listo.png`, `v-portatil-01-listo.png` |
| V-07 | Media | Visor, escritorio | Cuatro zonas de controles: iconos del núcleo arriba, un raíl de 6 iconos sin texto a la derecha, la pestaña «Ficha · precio» y el dock. Son dos barras de iconos con lógicas distintas | `v-portatil-02-a-los-6s.png` |
| V-08 | Media | Visor, vertical | Las herramientas viven dentro de la hoja de la ficha. «Compartir», «Idioma» y «Ajustes» quedan fuera de la pantalla (desplazamiento horizontal) y solo se ven al abrir la ficha. «Personalizar» sale dos veces | `c-movil-02-ficha-abierta.png`, `c-ipad-02-ficha-abierta.png` |
| V-09 | Media | Visor, todos | «Foto de la vista», el diferenciador del producto, solo existe dentro del formulario. Nada en la primera pantalla invita a preguntar con una foto | `c-movil-05-contacto.png` |
| V-10 | Media | Visor | La visita guiada y W A S D no se descubren. La visita es un ▶ sin texto (escritorio) o un chip escondido en la ficha (móvil). W A S D solo aparece en la ayuda: ningún texto visible lo menciona | `v-portatil-02-a-los-6s.png`, `e-portatil-10-ayuda.png` |
| V-11 | Media | Visor, móvil | «Personalizar» tapa el 60 % de la escena: no se ve el estilo, la luz o el color que se prueba | `c-movil-12-personalizar.png` |
| V-12 | Media | Visor y fase 4 | Choque de nombres: la vivienda tiene «Momento del día: Día/Atardecer/Noche» y la fase 4 añade el «modo día y noche» de la interfaz. `tema-muestra.html` pone un sol y una luna en la barra principal, justo donde el comprador buscaría la luz de la vivienda | `t-movil-hud-propuesto.png`, `c-movil-13-noche.png` |
| V-13 | Media | Visor, ficha | La ubicación va la undécima, detrás de la hipoteca. El precio aparece dos veces en pantalla. Hay hasta 17 «datos clave» (ascensor, trastero, aire… como tarjetas) y dos avisos legales casi iguales | `c-movil-03-ficha-desplazada.png`, `c-movil-04-ficha-final.png`, `e-portatil-05-ficha.png` |
| V-14 | Media | Visor | Las secciones («zona de día, de noche…») solo se usan en el selector del contacto; la galería no agrupa por zonas ni por plantas. El requisito «vivienda organizada por secciones y estancias» casi no se ve | `c-movil-05-contacto.png` frente a `v-portatil-02-a-los-6s.png` |
| V-15 | Media | Visor, táctil | El volumen de la música se queda abierto (`:hover` pegajoso en táctil) y tapa el radar. El dorado de «pulsado» significa «silenciado» en la música y «visible» en el radar | `c-movil-17-sonido.png` |
| E-01 | Media | Estudio, Rápido | Promete 5 pasos y la barra enseña 8 entradas: los opcionales van intercalados entre Plano y Datos, y en otro orden que en Completo (allí Material es el segundo) | `s-portatil-02-fotos.png`, `s-portatil-12-completo.png` |
| E-02 | Media | Estudio, Rápido | Revisar sugiere el título y la referencia, que no están en el paso Datos del Rápido. «Ver» abre todos los datos sin llevar al campo | `s-portatil-05-datos.png`, `s-portatil-07-revisar.png`, `s-revisar-ver-anuncio.png` |
| E-03 | Media | Estudio | El mismo apartado en dos o tres sitios: música, documentos, planos, renders 360, colores y estilos, Guía (barra y Fotos), y «Abrir» junto al nombre del proyecto | `s-portatil-13-material.png`, `s-portatil-14-datos-avanzado.png`, `s-portatil-13-variantes.png` |
| E-04 | Media | Estudio | Datos → Avanzado es un cajón de sastre: 7 apartados que pertenecen a Plano, Estilo y luz o Extras | `s-portatil-14-datos-avanzado.png` |
| E-05 | Media | Estudio, primera visita | Tres botones del color principal a la vez: «Elegir fotos», «Continuar → Plano» (sin fotos) y «Publicar» (sin nada que publicar) | `s-portatil-01-primera-visita.png` |
| E-06 | Media | Estudio, Plano (Rápido) | Herramientas de experto a la vista (Calibrar, Estancia, Muro, Conectar y norte) y dos «Continuar» distintos | `s-portatil-04-plano.png` |
| E-07 | Media | Estudio, móvil | La lista de fotos y el plano se rompen en 390 px, y la Guía enlaza ahí desde el móvil | `s-movil-02-fotos.png`, `s-movil-04-plano.png` |
| G-02 | Media | Guía → Estudio | La lista de estancias solo llega al Estudio en el mismo navegador. En el flujo real (Guía en el móvil, Estudio en el ordenador) se pierde sin avisar, y la de un inmueble anterior nombra las fotos del siguiente (= esencialista §4.16) | `a-movil-01-estancias.png` |
| G-03 | Media | Guía | 11 pastillas que empiezan en «Paso 0», sin fases. En el móvil se ven 2 o 3. «Revisar la calidad» y «Publicar» duplican pasos del Estudio | `a-movil-00-inicio.png`, `a-portatil-00-inicio.png` |
| V-16 | Baja | Visor | El radar tiene cuatro nombres (mapa, radar, plano, minimapa) y las teclas M y R se confunden | `e-portatil-10-ayuda.png` |
| V-17 | Baja | Visor, ayuda | Se llama «Controles». Las teclas globales aparecen bajo «Modo libre 3D». No explica el radar, la foto de la vista ni el estilo y la luz | `e-portatil-10-ayuda.png` |
| V-18 | Baja | Visor | La visita guiada tiene dos controles a la vez: el icono del raíl, que pasa a «pausa» pero en realidad detiene, y la barra superior | `e-portatil-09-guiada.png` |
| V-19 | Baja | Visor, Ajustes | «Sensibilidad táctil» también en escritorio. El idioma solo está en Ajustes en horizontal. La música está duplicada con su botón | `e-portatil-07-ajustes.png` |
| V-20 | Baja | Visor | Dos nombres por estancia según la vista: «Salón» en las flechas y la galería, «Salón-comedor» en el plano, la maqueta y el contacto | `c-movil-19-maqueta.png`, `e-portatil-14-contacto.png` |
| V-21 | Baja | Visor, iPhone | «Pantalla completa» visible donde no funciona (= esencialista §4.17) | — |
| V-22 | Baja | Visor, maqueta | El radar se queda en la maqueta, que ya es un plano | `l-portatil-03-maqueta.png` |
| E-08 | Baja | Estudio | La copia de seguridad está en «Publicar → Avanzado», pero «Proyectos» solo restaura. «Abrir» y el nombre del proyecto abren lo mismo | `s-portatil-10-publicar-avanzado.png`, `s-portatil-15-abrir.png` |
| E-09 | Baja | Estudio | «Dirección y notas»: «Dirección» se confunde con la dirección postal y la de la web. Los botones ±1/±10 están repetidos bajo la vista previa | `s-portatil-13-orientar.png` |
| E-10 | Baja | Estudio, Fotos | Pestañas ES/EN junto al nombre de cada foto | `s-portatil-02-fotos.png` |
| E-11 | Baja | Estudio | Dos controles distintos para cambiar entre Rápido y Completo según el ancho. El diálogo «¿Cómo quieres trabajar?» solo sale al crear el segundo proyecto | `s-portatil-01-primera-visita.png`, `s-escritorio-02-fotos.png` |
| G-04 | Baja | Guía | Tres nombres («Guía Osmo 360», «Asistente Osmo 360», «Asistente · DJI Osmo 360»). No hay enlace fijo al Estudio ni anclas propias | `a-portatil-00-inicio.png`, `s-portatil-01-primera-visita.png` |
| T-01 | Baja | Visor, iPad | La galería asoma por detrás de la hoja y la pista se ve detrás | `c-ipad-02-ficha-abierta.png` |

## 9. Plan priorizado

**Reparto:** el núcleo (`visor.js`, `visor.css`, `index.html`) y la Guía, el orquestador. `paneles.*` e `i18n.js`, un agente. `estudio*`, otro agente. Ningún requisito del cliente se elimina (§9.6).

### 9.1 Núcleo (`visor.js`, `visor.css`, `index.html`)

**P1:**

- **N-1. Parpadeo (= N1).** En `bucle()`, `const inactiva = !!int.yaInteractuo && …` (o `yaInteractuo: false` en `int`). Prueba: 0 cambios de clase antes de interactuar.
- **N-2. Modo juego explícito (§6).**
  - `clic()`: quitar `capturarRaton()` del clic en el vacío del recorrido. En el paseo libre se mantiene.
  - `keydown`: con `KeyW/A/S/D`, `pointer: fine`, `atajos` y `ajustes.modoJuegoWASD !== false`, llamar a `capturarRaton()`. Las flechas nunca capturan.
  - Nuevo `#btn-juego` en `#iconos`: oculto en táctil y en `embed`, con `aria-pressed` igual al estado de captura.
  - Nuevo aviso fijo `#aviso-juego`: «Modo juego · Esc para salir».
  - En `pointerlockchange`, al salir, el aviso único «Has salido del modo juego · W A S D o 🎮 para volver», en lugar de `aviso.clic_explorar`.
  - En el paseo libre, la tarjeta «Haz clic para caminar» (puede reutilizar `#pista` como botón).
  - `ajustes.capturaConClic` (falso por defecto) recupera el comportamiento de hoy.
  - Textos nuevos en `FALLBACK` e `i18n.js`. Actualizar los controles en ESQUEMA §2.
  - `visor.css`: `body.raton-capturado` oculta también lo pulsable de `#paneles` y deja el radar y el aviso.
- **N-3. Barra de vista única.**
  - `#iconos` en este orden: Radar · Modo juego\* · Música\* · Ayuda · Pantalla completa\* · «Más».
  - «Más» es una ranura (`#ranura-mas`) que rellena paneles, con un contrato sencillo, por ejemplo un evento `visor.on("mas")` o un `<div>` vacío documentado en ESQUEMA.
  - En «hoja» (vertical), columna a la derecha, como en `tema-muestra.html`.
  - `#btn-pantalla`, oculto sin `document.fullscreenEnabled || webkitFullscreenEnabled` (= N13) y, en el móvil, dentro de «Más».
  - El giroscopio, a «Más». Para ello hay que exponer `visor.giroscopio(sí/no)`.
- **N-4. «Estancias y plano».**
  - `#barra` pasa a ser un botón («Salón · Planta 1 ▾», con `aria-haspopup="dialog"`).
  - Abre una hoja (móvil) o ventana (escritorio) con:
    - el plano con el norte arriba (reutilizando `#minimapa.grande` y `#plantas`);
    - «▶ Visita guiada»;
    - la lista de estancias con miniatura, agrupada por `tour.secciones` o por plantas.
  - El «Ampliar» del radar y la tecla M abren lo mismo.
  - En el móvil (vertical y horizontal) se oculta `#galeria`.
  - Se quita `#btn-vista-mapa` (= N8).
- **N-5. Móvil horizontal.** El plano ampliado o «Estancias y plano» quedan siempre por encima del raíl y del dock (o estos se ocultan mientras está abierto). Corrige V-04.
- **N-6. Radar arriba a la izquierda en todos los tamaños**, bajo el título, como en Counter-Strike. Modos solo con 2 o más (ya es así) y radar oculto en la maqueta.
- **N-7. Portada del inmueble, versión mínima.**
  - Logo y nombre de la agencia (`marca`), título, precio y 3 datos (`inmueble`), progreso y «Empezar visita».
  - «Creado con cre8eight», pequeño.
  - Sin portada en `?embed`.

**P2:**

- **N-8. Portada completa:**
  - Miniatura de la estancia inicial de fondo.
  - «▶ Visita guiada».
  - Idiomas.
  - «♪ Con música», con la música arrancando en ese toque.
  - Una línea de controles según el aparato.
- **N-9. Nombres:**
  - Modos «Recorrido · Paseo libre · Maqueta», con los nombres largos en `aria-label`.
  - «Mostrar radar / Ocultar radar».
  - Teclas: R para el radar, M para «Estancias y plano».
  - `index.html`: «Antes/Después» → `data-*` traducibles.
- **N-10. Música (= N9):**
  - El icono solo silencia o activa.
  - Si queda un deslizador, dentro de `@media (hover: hover)` (corrige V-15).
  - El dorado de «pulsado» solo para funciones activadas, con el mismo significado en todos los iconos.
- **N-11. Ayuda «Ayuda y controles» (= N7).**
  - Secciones: Moverte · Mirar · Modo juego · Radar y plano · Preguntar con foto · Estilo y luz.
  - Solo los modos disponibles.
  - Las teclas globales, aparte.
- **N-12. Visita guiada: un solo control**, la barra superior. El botón de acciones la inicia y no cambia a «pausa».
- **N-13. La tira de estancias (escritorio y tablet), agrupada por zona o planta**, con un separador y su nombre.

**P3:**

- **N-14.** El precio como texto no pulsable durante el modo juego, a modo de HUD.
- **N-15.** Quitar el contorno dorado de foco del lienzo tras usar el teclado (fase 4).

### 9.2 Paneles (`paneles.js`, `paneles.css`, `i18n.js`)

**P1:**

- **P-1. Una sola «tarjeta del inmueble».** `peek()`, la pestaña de `rail()` y `dockContacto()` pasan a ser `tarjetaInmueble()`.
  - **Contenido:** precio y «2 hab · 1 baño · 92 m² · C» (abre la ficha), «Contactar» (principal), «Foto de la vista» y, en el móvil, «Estilo y luz».
  - **Forma:** una fila en el móvil (vertical y horizontal); tarjeta bajo la barra de vista en escritorio.
  - **Nunca se oculta del todo:** se reduce a «349.000 € · Contactar». Corrige V-03.
  - El WhatsApp directo pasa al diálogo de contacto (= PA2).
- **P-2. «Foto de la vista» en primer nivel y contacto en 4 toques (= PA1).**
  - Desde la tarjeta: `tomarCaptura()` sin `entrarCaptura()`, con destello, aviso con «Deshacer» y contador en «Contactar».
  - `dlgContacto()`: sin fotos, adjunta la vista actual. «Añadir otra vista» abre la barra de captura actual.
  - Se quitan `pantallaPreparar()` y la pantalla intermedia: «Enviar por WhatsApp» copia y abre en el mismo gesto.
- **P-3. Herramientas fuera de la ficha (PA5 adaptado).**
  - Se quita `filaHerramientas()` de `panel()`.
  - **Escritorio:** acciones con texto bajo la tarjeta (Estilo y luz · Visita guiada · Medir).
  - **«Más»** (rellena `#ranura-mas`):
    - En escritorio: Compartir · Idioma · Ajustes.
    - En el móvil: Visita guiada · Medir · Compartir · Idioma · Ajustes · Pantalla completa\* · Mirar moviendo el móvil\*.
  - «Compartir» también en la cabecera de la ficha.
- **P-4. Ajustes reordenados (= PA4):**
  1. Idioma · Language.
  2. Apariencia y Tamaño (fase 4).
  3. Música, con su volumen.
  4. Controles: Velocidad de giro, Entrar en modo juego con W A S D, Capturar el ratón con un clic, Atajos de teclado. Todo esto solo en escritorio.
  5. Accesibilidad: Reducir movimiento y Reducir transparencia.

**P2:**

- **P-5. «Estilo y luz»** (renombra `dlgPersonalizar`):
  - **Forma:** hoja compacta de 40 % de alto como máximo en el móvil, o ventana junto a su botón en escritorio, sin tapar el centro.
  - **Contenido:** filas Estilo (proyectos) / Colores (construidas) / Luz / Antes y después, según `estado_obra` (= PA3).
- **P-6. Ficha en el orden de §5.4.**
  - `datosClave()` con 6 datos como mucho, la letra energética y los gastos.
  - El resto, a Características.
  - `avisoLegal()` no añade `ficha.aviso_ia` si ya hay un `aviso_legal`.
  - Sin repetir el precio de la tarjeta en la cabecera.
- **P-7. i18n según la tabla de §7.**
  - Por ejemplo: `personalizar.titulo` → «Estilo y luz», `momento.titulo` → «Luz», `comparar.titulo` → «Antes y después», `ayuda.titulo` → «Ayuda y controles», `contacto.hacer_foto` → «Foto de la vista», `contacto.capturar` → «Hacer foto».
  - Quitar `ficha.pestana`.
  - Con las 4 lenguas.

**P3:**

- **P-8.** «Compartir…» nativo en el móvil (= PA8).
- **P-9.** «Renders y planos» también accesible desde «Estancias y plano» (pestaña «Planos»).

### 9.3 Estudio (`estudio.html`, `estudio*.js`, `estudio.css`)

**P1:**

- **S-1. Barra lateral.**
  - `ORDEN_RAPIDO` y `ORDEN_COMPLETO` pasan a un solo orden: Fotos · Plano (opcional) · Datos · Publicar, más el grupo plegable «Más herramientas» (Orientación y notas · Estilo y luz · Extras), igual en todos los anchos.
  - Se quitan el control de modo (`estudio.js:73-77`) y `elegirModo()` (= E3).
  - Revisar pasa a ser la cabecera «Antes de publicar» de Publicar. `#revisar` abre Publicar en esa cabecera, `#publicar` funciona y `#exportar` queda como alias.
- **S-2. Datos del paso rápido coherentes con Revisar** (= E6 y E7):
  - Añadir «Venta | Alquiler».
  - Título y referencia automáticos y editables, o que Revisar no los sugiera en el paso rápido.
  - «Ver» y «Corregir» enfocan el campo exacto.
- **S-3. Primera pantalla** (= E10 y E13):
  - Un solo botón principal: «Elegir fotos».
  - `#btn-exportar` en secundario y `pieContinuar()` oculto mientras no haya fotos.
  - Una sola entrada a la Guía en Fotos: «¿Aún no tienes las fotos? Guía Osmo 360».
  - Se quita el botón de atajos (pasa a «?»).
- **S-4. «Mi inmobiliaria» (= E1)** en la barra superior, con un aviso la primera vez.

**P2:**

- **S-5. Cada apartado en su sitio** (tabla de §5.7, = E10):
  - Música, documentos y visita guiada → **Extras**.
  - Paletas, estilos, momentos y aviso legal → **Estilo y luz**.
  - Zonas (secciones) y altura de la cámara → **Plano** (en Avanzado).
  - Planos del arquitecto → **Plano**.
  - Renders 360 → **Fotos** o **Estilo y luz** según se suban.
  - Datos se queda con Inmueble · Contacto (excepciones al perfil) · Idiomas.
- **S-6. Nombres:**
  - «Orientación y notas», «Estilo y luz» y «Extras».
  - **«Proyecto ▾»** en el nombre del proyecto, que sustituye a «Abrir».
  - «Recorrido en un solo archivo» y «Antes de publicar».
- **S-7. Publicar por destino** (§5.8). La copia de seguridad pasa a «Proyecto ▾», donde se puede descargar y restaurar.
- **S-8. «Estilo y luz» según el estado de la obra** (= E9), con «Mostrar todo».
- **S-9. Estudio en el móvil:** la pantalla «Necesita un ordenador o un iPad», con «Enviarme el enlace» y «Seguir aquí».
- **S-10. Leer la lista de la Guía desde el enlace** (`#fotos&estancias=…&tomas=…`), mostrarla y borrarla al usarla (= E12).

**P3:**

- **S-11.** Datos técnicos de las fotos solo si hay error (= E17). Las pestañas ES/EN solo en Idiomas (= E11).
- **S-12.** Vista previa con el conmutador «Móvil / Ordenador».
- **S-13.** Enlaces a pasos concretos de la Guía (por ejemplo, el aviso de costura → Guía `#problemas`).

### 9.4 Guía (`asistente-osmo.html`)

**P1:**

- **G-P1. Los nombres del Estudio** (= A1):
  - «Publicar → Descargar mi recorrido (ZIP)».
  - «Fotos 360».
  - «Vídeo de la visita (MP4, o WebM en Chrome)».
  - «Plano con medidas (si has subido el plano)».
  - «Dossier en PDF».
  - «Plano (opcional)».
  - «recorrido virtual».
- **G-P2. «Enviar mi lista al ordenador».**
  - Copiar o compartir el enlace con estancias y tomas.
  - En pantallas de menos de 760 px, «Abrir el Estudio» pasa a «Ábrelo en tu ordenador», con copiar o enviar el enlace.

**P2:**

- **G-P3. 6 pasos en 3 fases, más 2 apéndices** (§5.9; = A2 adaptado):
  - Numeración desde 1.
  - Encabezado «Paso n de 6 ▾» en lugar de las 11 pastillas.
  - «Problemas frecuentes» también en el «?» de la cabecera.
- **G-P4. Cabecera «Guía Osmo 360»**, con «Abrir el Estudio» y anclas por paso.
- **G-P5.** «Nuevo inmueble» y el botón «−» en el control de tomas (= A3 y A4).

**P3:**

- **G-P6.** La toma de noche (= A6) y menos casillas (= A5).

### 9.5 Coincidencias y diferencias con el esencialista, y decisiones para la ronda del cliente

- **Coinciden:**
  - Parpadeo (N1).
  - Modo juego explícito (N5); aquí se concreta en W A S D sin flechas y sin doble clic.
  - Radar con un solo «Ampliar» (N8).
  - Pantalla completa en el iPhone (N13).
  - Contacto en 4 toques y un solo botón (PA1 y PA2).
  - Herramientas con «Más» (PA5).
  - Estilo y luz según `estado_obra` (PA3 y E9).
  - Perfil (E1).
  - Revisar dentro de Publicar (E6).
  - Duplicados (E10).
  - Guía en menos pasos y con los nombres corregidos (A1 y A2).
- **Diferencias, para conciliar:**
  1. **Plano en el Estudio.** El esencialista (E6) lo lleva a «Más herramientas». Aquí se mantiene como **paso 2, opcional y con «Saltar»**, por tres razones:
     - El radar y las medidas, dos requisitos del cliente, solo existen con plano.
     - La Guía prepara el plano en la obra («dibuja los puntos en el plano»).
     - Esconderlo haría que casi ningún recorrido rápido tuviera radar.
  2. **Doble clic y flechas para el modo juego.** El esencialista (N5) los incluye. Aquí se descartan:
     - El doble clic no se descubre y choca con el clic de avanzar.
     - Las flechas son el camino de quien no juega y del teclado accesible.
  3. **«Ayuda».** El esencialista (PA5) la mete en «Más». Aquí se queda visible en la barra de vista, porque es la red de seguridad de quien no juega y `tema-muestra.html` también la tiene a la vista.
- **Para la ronda «distribución de los controles y modo juego»** (PENDIENTE.md):
  1. **Modo juego:** D + E (recomendada), A (como hoy) o C (solo botón).
  2. **Estancias en el móvil:** «Salón ▾» con «Estancias y plano» (recomendada) o tira de miniaturas fija.
  3. **Entrada:** portada con «Empezar visita» (recomendada) o directa.
  4. **Radar:** arriba a la izquierda en todos los tamaños (recomendada) o abajo a la izquierda en escritorio.
  5. **Estudio:** Plano visible como paso opcional (esta auditoría) o dentro de «Más herramientas» (esencialista).

### 9.6 Requisitos del cliente: dónde quedan (ninguno se elimina)

| Requisito | Dónde queda |
|---|---|
| Recorridos propios con la Osmo 360 | Visor, Estudio (paso Fotos) y Guía Osmo 360 |
| Navegación de videojuego (ratón rápido, W A S D y flechas) | W A S D y flechas siempre; «Modo juego» con W A S D, botón 🎮 o clic en el paseo libre; «Velocidad de giro» en Ajustes |
| Responsive en móvil y tablet | §5.3: la misma lógica en los cuatro formatos |
| Radar activable | Arriba a la izquierda en todos los tamaños; «Radar» en la barra de vista y tecla R |
| Contacto con nombre, teléfono y pregunta por WhatsApp | «Contactar» siempre visible; 4 toques |
| Foto de la vista y varias capturas | «Foto de la vista» en la tarjeta (N1), hasta 6, y «Añadir otra vista» |
| Estancia o sección de la pregunta; vivienda por secciones | Selector preseleccionado; zonas en «Estancias y plano» y en la tira |
| ≥ 5 estilos IA en proyectos | «Estilo y luz → Estilo» (proyectos) |
| Colores de paredes y suelo en construidas | «Estilo y luz → Colores» (construidas) |
| Día y noche con luces | «Estilo y luz → Luz» |
| Medidas, ficha, planos y renders | «Medir» (acción en escritorio, «Más» en el móvil), ficha reordenada, «Estancias y plano», «Renders y planos» |
| Portales, web propia y descargable | Publicar por destino: Tu web · Portales y redes · Para tus clientes |
| Nombre cre8eight | «Creado con cre8eight» en la portada y en la ficha; la marca del Estudio |
| Guía paso a paso con consejos | Guía Osmo 360 en 6 pasos y 2 apéndices |
| Botón de sonido y música por proyecto | «Música» en la barra de vista y el volumen en Ajustes; «Música de fondo» en Extras |
| Modo claro u oscuro (fase 4) | «Apariencia» en Ajustes (visor y Estudio), con su propio nombre e icono |

## Anexo · Scripts para reproducir

Carpeta: `/tmp/claude-0/-home-user-creatorflow-ai/9aa10f93-9bbe-52c5-91f2-e21dabbb4196/scratchpad/fase3/ia/`. El servidor debe estar en `http://localhost:8765/`, lanzado desde `tools/visor-inmobiliario`.

| Script | Qué hace |
|---|---|
| `comun.mjs` | Lanza Chromium con WebGL por software, redirige jsdelivr a `node_modules`, guarda capturas y cuenta los controles visibles |
| `visor-inicio.mjs` | Portada, «listo» y estado a los 6 s en los 5 tamaños |
| `medir-hud.mjs` | Controles visibles y porcentaje de pantalla tapado |
| `comprador-movil.mjs [movil\|movilH\|ipad]` | Perfil A en táctil: moverse, ficha, contacto con foto, personalizar, radar, ayuda, música, modos e inactividad |
| `comprador-escritorio.mjs [portatil\|escritorio]` | Perfil A con ratón: arrastrar, clic (captura), W A S D, inactividad, ficha, herramientas y contacto |
| `primer-toque.mjs` | Muestras de `pointer-events` del HUD antes de interactuar (V-01) |
| `prueba-wasd.mjs` | Captura del ratón desde un `keydown` de la W (viabilidad de §6) |
| `libre-escritorio.mjs` | Paseo libre y maqueta en escritorio |
| `generar-fotos.mjs` | 5 fotos 2:1 de 4096 px en `fotos/` |
| `agente-estudio.mjs [portatil\|escritorio\|ipad\|movil\|movilH]` | Perfil B: primera visita, fotos, plano, datos, revisar, publicar, modo completo, datos avanzados y proyectos |
| `revisar-ver.mjs` | A dónde llevan los «Ver» de Revisar en el modo rápido |
| `fotografo-asistente.mjs [movil\|portatil]` | Perfil C: los 11 pasos, el control de tomas, las anclas al Estudio y los nombres del paso 9 |
| `tema.mjs` | Capturas del HUD propuesto en `tema-muestra.html` |
