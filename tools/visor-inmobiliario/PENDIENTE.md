# cre8eight · Plan de continuidad

Este archivo es la **fuente de verdad** para retomar el trabajo si se corta la sesión (créditos agotados, contenedor nuevo, resumen de contexto). Actualízalo al cerrar cada fase.

- **Rama:** `ccr-40d07831-qbgzrt` (solo esta). Push con `git push -u origin ccr-40d07831-qbgzrt`. **No crear PR** salvo que el usuario lo pida.
- **Pie de cada commit:**
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01DCs2M5EPDi1niEcZDrP6PF
  ```
- **Tarea programada:** «cre8eight: continuar trabajo pendiente» reactiva la sesión cada 2 horas para seguir con lo pendiente. Cuando todo esté terminado, se borra (`delete_trigger`) y se avisa al usuario.
- **Idioma:** el usuario escribe en español; responde en español.

## Cómo retomar (5 minutos)

1. `git fetch origin ccr-40d07831-qbgzrt && git checkout ccr-40d07831-qbgzrt && git pull origin ccr-40d07831-qbgzrt`
2. `cd tools/visor-inmobiliario && npm install && npm run prueba`. Debe terminar en «Todo correcto».
   - Playwright 1.56.1 usa el Chromium preinstalado en `/opt/pw-browsers`. **No ejecutes** `playwright install`.
   - `cdn.jsdelivr.net` está bloqueado en el contenedor. La prueba lo redirige a `node_modules`; copia esa función `route` en cualquier prueba nueva.
3. Si había agentes en segundo plano, comprueba si siguen vivos. Si murieron, sus cambios a medias están en `git diff`. Relánzalos con el encargo de [docs/auditorias/fase2-encargos.md](../../docs/auditorias/fase2-encargos.md), pidiéndoles que comprueben primero lo que ya está hecho.
4. Sigue con la primera casilla sin marcar de «Estado». Haz commit y push al terminar cada bloque (y antes de esperas largas).
5. Pruebas manuales:
   - Ejecuta `python3 -m http.server 8765` en esta carpeta.
   - Abre `index.html?demo` (visor con demo generada), `estudio.html` y `asistente-osmo.html`.
   - En el contenedor, abre las páginas con Playwright y la misma redirección de jsdelivr.

## Estado

- [x] **Fase 0 · Investigación.** Corona, competencia, portales, legal y UX: `docs/investigacion/*`, `docs/recorridos-3d-inmobiliaria.md` y `docs/guia-osmo360.md`.
- [x] **Fase 1 · Construcción y primera auditoría.**
  - Construido: visor, paneles, exportación, Estudio y Asistente Osmo 360.
  - Auditorías: QA, UX y Maverick (`docs/auditorias/fase1-*.md`), con sus correcciones.
- [ ] **Fase 2 · Auditoría QA E2E + UX del Estudio, y correcciones.**
  - [x] Núcleo del visor, `exportar.js`, asistente y ESQUEMA (commit d2373d7).
  - [x] Música por proyecto: botón de sonido y volumen en el visor; ZIP, HTML autónomo y vídeo con música (commit bfa85a1).
  - [ ] Estudio: encargo completo en `fase2-encargos.md § Estudio`. Lo hace el agente «Build tour creation Studio».
    - Puntos QA: C1, A3, A4, A5, M1–M4, M6 y los de severidad baja.
    - Puntos UX: P3–P8, P13–P15 y los 20 textos.
    - Además: Continuar, Modo Rápido, alternativa sin arrastre, anclas `#paso`, subida de música y licencia, «Incluir música» en vídeo, y solo variables CSS.
  - [ ] Paneles: encargo completo en `fase2-encargos.md § Paneles`. Lo hace el agente «Build viewer UI panels».
    - Evento `tour`, validación de URLs, documentos sin duplicar.
    - Puntos UX: P9–P12 y P15.
    - No autoocultar antes de interactuar.
    - i18n de `sello.*` y `sonido.*`, fila «Música» en Ajustes, crédito musical en la ficha.
  - [ ] Verificar cada punto de ambos encargos con `npm run prueba` y con pruebas dirigidas. Después: commit, push y marcar esta fase.
- [ ] **Fase 3 · Esencialismo y organización** (ver «Encargos de la fase 3»).
- [ ] **Fase 4 · Diseño premium «minimal liquid glass»** con tema claro/oscuro y tallas S/M/L (ver «Encargo de la fase 4»).
- [ ] **Fase 5 · Entrega** (ver «Pasos de la fase 5»).

## Requisitos del cliente (no se pueden eliminar, solo refinar)

| Requisito | Estado |
|---|---|
| Recorridos 3D propios a partir de fotos DJI Osmo 360, sin depender de Matterport | ✅ visor + Estudio |
| Navegación de videojuego tipo Minecraft: ratón muy rápido (mirar arriba, abajo y alrededor), W A S D y flechas | ✅ pointer lock y teclado; modo libre 3D con colisiones, salto y carrera. Revisar en fase 3 si capturar el ratón con un clic confunde |
| Responsive en móvil y tablet | ✅ joystick táctil y gestos; zonas por tamaño. Repetir pruebas en fase 4 |
| Radar tipo Counter-Strike en una esquina, que se pueda activar y desactivar | ✅ radar ⇄ plano ⇄ oculto (teclas R y M) |
| Contacto con nombre, teléfono y pregunta enviados al WhatsApp de la empresa | ✅ wa.me, más webhook a CRM opcional |
| Botón de foto de la vista actual, varias capturas adjuntas al mensaje | ✅ mejorado en fase 2 (P10, P12) |
| Selector de la estancia o sección de la pregunta; vivienda organizada por secciones y estancias | ✅ |
| Al menos 5 estilos de diseño generados con IA, solo en terrenos o proyectos (`estado_obra: proyecto`) | ✅ original + 5; sello «Recreación virtual · IA» |
| Viviendas ya construidas: cambiar color de paredes y suelo, pequeños detalles | ✅ máscaras por foto (editor en el Estudio) |
| Ambiente de día y de noche, con las luces encendidas de noche | ✅ día, atardecer y noche (foto real o simulada) |
| Medidas, información del inmueble, planos de arquitecto y renders de software conocido | ✅ medición, ficha, certificado energético, plano (imagen, PDF, DXF), variantes de render 360, modelo GLB o splat |
| Publicar en idealista y portales; enlace para la web propia; descargable como archivo | ✅ fotos 360 GPano ≤ 7,5 MB, vídeo 16:9, 9:16 y 1:1, ZIP web, HTML autónomo, plano PNG, dossier, QR. idealista solo admite tours de proveedores homologados: publicar fotos 360 y vídeo, y enlazar el tour |
| Nombre: **cre8eight** | ✅ |
| Software adaptado a la Osmo 360 y guía paso a paso muy fácil, con consejos | ✅ `asistente-osmo.html`, detección EXIF/XMP de la Osmo y `docs/guia-osmo360.md` |
| Botón de sonido (silenciar y volumen) y música por proyecto | ✅ en el visor; en el Estudio, fase 2 |
| Auditorías tras cada fase (código, visual, UX/UI, Maverick) y análisis de la competencia | ✅ fases 1 y 2; seguir en fases 3 y 4 |
| Agente «esencialista»: quitar lo que no suma, que todo funcione perfecto | ⏳ fase 3 |
| Auditoría de la organización de todos los apartados para la mejor UX | ⏳ fase 3 |
| Diseño premium estilo Apple: transparencias, minimalista, purista, lujo | ⏳ fase 4 |
| Estilo «minimal liquid glass» de los Pinterest del usuario: fuentes, iconos en movimiento, animaciones | ⏳ fase 4. Pinterest está bloqueado por la red del entorno: pedir capturas, o que permita `pin.it`, `pinterest.com` e `i.pinimg.com` |
| Tres tallas S, M y L de botones, iconos y textos, adaptables a cualquier resolución | ⏳ fase 4 (aún no existe) |
| Modo día y noche (claro y oscuro) en toda la interfaz | ⏳ fase 4 (aún no existe) |
| Usar las skills que hagan falta | ⏳ fase 4: `design:design-system`, `design:design-critique`, `design:accessibility-review` (comprobar nombres en la lista de skills) |

## Encargos de la fase 3 (lanzar dos agentes en paralelo; ninguno edita código)

**A · Esencialista.**

- Audita el visor (`index.html`, `visor.js`, `paneles.js`), el Estudio (`estudio.html`, `estudio-*.js`), el Asistente y las exportaciones.
- Para cada función responde:
  - ¿Quién la usa: el comprador o el agente?
  - ¿Ayuda a decidir la compra o a contactar?
  - ¿Cuánta complejidad cuesta (interfaz, código, mantenimiento)?
- Clasifícala en MANTENER, SIMPLIFICAR, FUSIONAR, MOVER A «AVANZADO» o ELIMINAR, siempre con una justificación.
- Busca código muerto, opciones duplicadas, ajustes que nadie tocará, textos redundantes y pasos innecesarios.
- Mide:
  - Controles visibles en la primera pantalla del visor, en móvil y en escritorio.
  - Clics para enviar una consulta con foto.
  - Pasos del Modo Rápido del Estudio.
- Los requisitos de la tabla anterior **no se eliminan**; solo se refinan.
- Entrega: `docs/auditorias/fase3-esencialista.md`.

**B · Arquitectura de información y organización.**

- Mapea todos los apartados:
  - Visor: barra, modos, iconos, radar, galería, contacto, ficha, personalizar, compartir, ajustes, idioma, ayuda y sonido.
  - Estudio: 8 pasos más el Modo Rápido.
  - Asistente: 10 pasos.
  - Exportaciones.
- Evalúalos con tres perfiles: comprador en móvil, agente inmobiliario no técnico y fotógrafo con la Osmo 360.
- Propón agrupación, orden, nombres y posición para móvil vertical y horizontal, tablet y escritorio, coherentes entre visor, Estudio y Asistente.
- Revisa en especial:
  - Que en el tour **un clic en el lienzo captura el ratón**, lo que puede confundir a quien no juega. Valorar arrastrar para mirar por defecto, y capturar el ratón con un botón o tecla «Modo juego», con doble clic o al pulsar WASD.
  - Si se descubren WASD, el radar y el contacto con foto.
- Haz capturas con Playwright (usa `pruebas/humo.mjs` como base) a 390×844, 844×390, 820×1180, 1280×800 y 1920×1080.
- Entrega: `docs/auditorias/fase3-organizacion.md`, con mapa actual → mapa propuesto y cambios priorizados.

**Después:**

1. Concilia los dos informes en un plan único.
2. Reparte la aplicación por archivos:
   - Núcleo (`visor.js`, `visor.css`, `index.html`) y Asistente: tú.
   - `paneles.*` e `i18n.js`: un agente.
   - `estudio*`: otro agente.
3. Pide una QA E2E rápida (agente de auditoría) y corrige lo que encuentre.
4. Ejecuta `npm run prueba`, haz commit y push.

## Encargo de la fase 4 (diseño)

Antes de diseñar, carga las skills de diseño disponibles.

- **`tema.css` común**, enlazado desde `index.html`, `estudio.html` y `asistente-osmo.html`, y aplicado también al dossier imprimible y a la pantalla de error:
  - **Tokens de color:** claro y oscuro con `data-tema="auto|claro|oscuro"` en `<html>` y `prefers-color-scheme`.
  - **Acento único:** hoy el visor usa `#c8a24a` y el Estudio `#ffb547`. Elige uno con variantes que cumplan AA en los dos temas.
  - **Materiales de vidrio:**
    - `backdrop-filter: blur() saturate()`.
    - Brillo especular con `inset box-shadow`.
    - Refracción con `feDisplacementMap` en Chromium, con alternativa en el resto.
    - Una capa de tinte que garantice el contraste AA sobre cualquier panorama.
  - **Forma y espacio:** radios, sombras y espaciado.
  - **Tipografía:** Inter Variable autoalojada en `vendor/fonts/`, con `-apple-system`/SF como respaldo.
  - **Movimiento:** curvas «spring» con `linear()` y alternativa `cubic-bezier`.
  - **Tallas S, M y L:** `data-talla="s|m|l"` con escala ≈ 0,875 / 1 / 1,125, combinada con `clamp()` fluido por viewport. Deben ir bien de 360×640 a 3840×2160 y en ultrapanorámico 3440×1440.
  - **Accesibilidad:** «Reducir transparencia» (`prefers-reduced-transparency` y un interruptor) y «Reducir movimiento».
- **Ajustes:**
  - «Apariencia: Automático / Claro / Oscuro» y «Tamaño: S / M / L» en los Ajustes del visor y en el Estudio.
  - Se guardan en `localStorage` como `cre8eight:tema` y `cre8eight:talla`, compartidos entre las tres páginas.
- **Iconos animados:** trazos SVG que se dibujan con `stroke-dashoffset`, transformaciones al cambiar de estado (como el icono de sonido) y micro-interacciones al pulsar.
- **Pantallas a revisar** con Playwright en claro, oscuro y las tres tallas:
  - Resoluciones: 360×640, 390×844, 844×390, 820×1180, 1024×768, 1280×800, 1440×900, 1920×1080, 2560×1440, 3440×1440 y 3840×2160.
  - Script que compruebe el contraste AA de los pares de tokens.
- **Auditorías finales:** visual/UI, accesibilidad y Maverick, con sus correcciones.

## Pasos de la fase 5 (entrega)

1. Ejecuta `npm run build` (genera `dist/visor-autonomo.js`, que necesita el HTML autónomo).
   - Hoy `dist/` está ignorado por el `.gitignore` raíz; el workflow de Pages lo compila.
   - Si se quiere que funcione al clonar, añade `!dist/` en un `.gitignore` local.
2. Actualiza `README.md` y `docs/` (guía de uso del visor y del Estudio, publicación en idealista y en la web propia).
3. Publica una demo navegable como Artifact (carga antes la skill `artifact-design`). La opción más sencilla es el HTML autónomo de la demo, que ocupa un solo archivo de menos de 16 MB.
4. Prueba final completa, commit y push.
5. Recuerda al usuario:
   - GitHub Pages despliega **solo desde `main`** (`.github/workflows/visor-pages.yml`). Hay que fusionar la rama y activar Settings → Pages → Source: GitHub Actions.
   - Para Pinterest o capturas de referencia, que las suba si quiere un ajuste más fiel.
6. Borra la tarea programada y avisa al usuario con un resumen final.

## Limitaciones conocidas (documentar o resolver)

- El dossier y el plano en francés y alemán caen al inglés en algunos textos.
- El vídeo se graba en WebM en Chromium (MP4 donde MediaRecorder lo soporte). Para idealista conviene convertirlo a MP4 o subirlo como WebM si lo acepta.
- El ZIP no tiene ZIP64: no admite más de 4 GB.
- Dos pestañas del Estudio a la vez sobre el mismo proyecto. Exportar mientras se procesan fotos.
- `enlaceVista` está vacío en `file://`.
- La Osmo 360 no ofrece RAW ni bracketing a 120 MP (el HDR es de 30 MP). Ver `docs/guia-osmo360.md`.

## Mapa rápido del código

| Archivo | Qué es |
|---|---|
| `ESQUEMA.md` | Contrato de `tour.json`, API `window.visor`, eventos, postMessage y exportación pública o de copia de seguridad |
| `visor.js`, `visor.css`, `index.html` | Núcleo three.js: shader equirectangular, variantes, máscaras, modo libre (splat/GLB), radar, maqueta, guion, música, captura |
| `paneles.js`, `paneles.css`, `i18n.js` | Ficha, contacto con WhatsApp y fotos, hipoteca, compartir y QR, personalizar, galería, ajustes, idiomas es/en/fr/de |
| `exportar.js` | ZIP, HTML autónomo, vídeo, JPEG GPano, plano PNG, dossier |
| `estudio.html`, `estudio.css`, `estudio*.js` | Estudio de creación en 8 pasos (IndexedDB, worker de imágenes, PDF, DXF, máscaras, música) |
| `asistente-osmo.html` | Guía interactiva de captura con la Osmo 360 |
| `plano.js`, `medicion.js`, `maqueta.js`, `guion.js`, `demo.js`, `util.js` | Módulos del visor |
| `preparar_panos.py`, `extraer_fotogramas.py` | Scripts opcionales de línea de comandos |
| `pruebas/humo.mjs` | Prueba de humo (`npm run prueba`) |
