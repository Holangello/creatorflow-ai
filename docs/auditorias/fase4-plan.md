# cre8eight · Plan de la fase 4: diseño premium «minimal liquid glass», claro y oscuro, tallas S/M/L

Manda este documento. El encargo original está en `tools/visor-inmobiliario/PENDIENTE.md` («Encargo de la fase 4») y el sistema de diseño en `docs/diseno/sistema.md` (tokens, componentes `c8-*`, tabla de migración).

## 0. Decisiones que se aplican

El cliente no ha guardado elecciones en la página de decisiones, así que se aplican las recomendadas. Cada una se puede cambiar después sin rehacer nada.

| Clave | Decisión |
|---|---|
| A | **Champán**: un solo acento en el visor, el Estudio, la Guía, el dossier y la pantalla de error. Fuera el naranja `#ffb547` del Estudio y el `#c8a24a` suelto del visor: todo sale de `--c-acento` y sus variantes |
| B | **Automático**: se quita `cre8Tema.porDefecto({ tema: "oscuro" })` del visor y del Estudio. Manda el dispositivo; cada visitante lo cambia en Ajustes |
| C | **Sin remates**: fuera `--serif` y `--fuente-editorial` del precio, los títulos, los rótulos 3D y el logotipo de texto «cre8eight». Todo con `--fuente` y `--fuente-titular` |
| D | **Vidrio equilibrado** (ya en `tema.css`) |
| E–J | Las recomendadas, ya construidas en la fase 3 (J: la barra de la visita guiada abajo) |

## 1. Contrato común (lo cumplen todos)

1. **Todo sale de `tema.css`**: color, radio, sombra, espaciado, tipografía y duración.
   - En CSS no quedan hex ni `rgba()` fijos, salvo: los valores de reserva dentro de `var(--x, reserva)`, los colores que son datos (letras de energía A–G, verde de WhatsApp, rojo de error) y los degradados de oscurecimiento sobre la foto.
   - `px` → `rem`, salvo bordes de 1 px, sombras finas, medidas de lienzo y `@media`.
2. **Claro y oscuro de verdad.** Cada pantalla se revisa con Playwright en los dos temas antes de darla por hecha. Lo que va sobre la foto 360 usa `.c8-vidrio` en los dos temas; el tinte del vidrio garantiza el contraste.
3. **Lienzos (`<canvas>`)**: los colores se leen de las variables CSS con `getComputedStyle(document.documentElement)` y se repinta al recibir el evento `cre8:tema` en `document`. Nada de colores fijos en JS salvo los de datos.
4. **Ajustes compartidos** con `window.cre8Tema.fijar(clave, valor)`; las preferencias viven en `cre8eight:tema|talla|transparencia|movimiento` y valen para las tres páginas.
   - «Apariencia: Automático · Claro · Oscuro», con un icono que **no** sea un sol ni una luna (no se confunde con la luz de la vivienda): un círculo mitad lleno.
   - «Tamaño: S · M · L».
   - «Reducir transparencia» y «Reducir movimiento».
   - **Una sola fuente de verdad para el movimiento:** el visor deja de guardar su propio `reducirMovimiento` y lee `cre8Tema.efectivo().movimiento` (incluye `prefers-reduced-motion`). `visor.ajustes({ reducirMovimiento })` sigue funcionando como alias que llama a `cre8Tema.fijar("movimiento", …)`.
5. **Iconos animados**: el trazo SVG se dibuja al aparecer (`stroke-dashoffset`), el cambio de estado se anima (como el icono de sonido) y hay una microinteracción al pulsar. Con movimiento reducido, nada se anima.
6. **Sin dependencias nuevas.** Lo nuevo con componentes `c8-*`; si falta un componente o un token, se pide al orquestador (`tema.css` es suyo) y mientras tanto se resuelve en el CSS propio con un comentario `TODO tema`.
7. **Pruebas**: cada paquete deja en verde su parte de `npm run prueba:todo`. Lo que cambie por diseño se adapta, nunca se borra una comprobación. Nada de `playwright install`. Las pruebas pesadas, de una en una (la máquina tiene 4 núcleos y trabajan tres agentes).
8. **Nada de commits**: el orquestador los hace.

## 2. Paquetes de trabajo

### 2.1 Núcleo del visor (`index.html`, `visor.css`, `visor.js`, `plano.js`, `maqueta.js`, `medicion.js`, `guion.js`)

| Prioridad | Tarea |
|---|---|
| P1 | Quitar el tema oscuro fijo (B). `theme-color` ya lo actualiza `tema.js` |
| P1 | Migrar a tokens y `rem` las piezas antiguas que siguen en oscuro fijo: `#ficha`, barra de medir y sus rótulos, etiquetas 3D y de la maqueta, notas y puntos de interés, cortinilla y carga, subtítulos de la visita guiada, comparador «Antes y después», sello «Recreación virtual · IA», pantalla de error y `#vacio`, aviso sin WebGL |
| P1 | Radar y «Estancias y plano» (`plano.js`) con colores de tokens y repintado con `cre8:tema` |
| P1 | C: fuera `--serif` (rótulos de estancia y títulos) |
| P1 | Movimiento: una sola fuente de verdad (contrato 4) |
| P2 | Iconos animados de la barra de vista (radar, juego, música, ayuda, pantalla completa, más) |
| P2 | Revisión del HUD en claro sobre fotos claras y oscuras: el texto se lee siempre (AA) |
| P3 | N-14: precio discreto en el modo juego |
| P3 | Refracción «liquid glass» con `feDisplacementMap`, solo en Chromium de escritorio, solo en piezas grandes y nunca con transparencia reducida. Solo se queda si el recorrido sigue a ≥ 55 fps en 1920×1080; si no, se descarta y se documenta |

### 2.2 Paneles (`paneles.css`, `paneles.js`, `i18n.js`)

| Prioridad | Tarea |
|---|---|
| P1 | Tokens y `rem` en todo `paneles.css` (contrato 1) |
| P1 | Ajustes: Apariencia, Tamaño, Reducir transparencia y Reducir movimiento (contrato 4), en es, en, fr y de |
| P1 | Claro y oscuro revisados en los 5 tamaños: tarjeta, ficha, contacto, WhatsApp, «Estilo y luz», «Más», Ajustes, Compartir, galería y visor de imágenes |
| P2 | Iconos animados de los paneles (contactar, foto de la vista, compartir…) |
| P2 | Pruebas: Apariencia y Tamaño en `e2e-paneles` (se aplica, se guarda y se comparte la clave) |

### 2.3 Estudio (`estudio.html`, `estudio.css`, `estudio*.js`)

| Prioridad | Tarea |
|---|---|
| P1 | Quitar el tema oscuro fijo (B) y migrar `estudio.css` a tokens y `rem`, con el acento champán (A) |
| P1 | E18: revisión completa de `estudio.css`; fuera el CSS muerto |
| P1 | Lienzo del plano, orientación y editor de máscara con colores de tokens y repintado con `cre8:tema` |
| P1 | Apariencia, Tamaño y Reducir transparencia en el Estudio (un lugar discreto de la barra superior) |
| P2 | Textos del perfil traducibles (pie legal y privacidad); borrar las traducciones automáticas de una zona al renombrarla; aviso al cerrar la pestaña solo mientras se importan fotos (compatible con las recargas de las pruebas) |
| P2 | Pasar a `e2e-estudio.mjs` lo esencial de las pruebas propias de la fase 3: 44 px y sin desbordes en 5 tamaños, migraciones de proyectos antiguos y enlace de la Guía, con los imports de `comun.mjs` y `e2e-util.mjs` |

### 2.4 Orquestador

- `tema-muestra.html`: sin sol ni luna en el HUD de muestra.
- Dossier imprimible (`exportar.js`) con el lenguaje del sistema: Inter, champán y claro para imprimir.
- Guía (`asistente-osmo.html`): revisar en claro y oscuro.
- `pruebas/contraste.mjs`: contraste AA de los pares de tokens en los dos temas.
- `pruebas/capturas.mjs`: matriz completa, con 1440×900 y las tallas S, M y L.
- `tema.css`: tokens o componentes que pidan los paquetes.
- Al terminar los paquetes: auditorías visual/UI, de accesibilidad y Maverick, en paralelo, y sus correcciones.

## 3. Al terminar (regla del cliente)

1. **Compactar**: CSS muerto, variables antiguas, reglas duplicadas entre `visor.css`, `paneles.css` y `estudio.css` que ya cubre `tema.css`.
2. **Medir**: `npm run medir` (CSS y JS no deben crecer sin motivo; la pantalla tapada en reposo sigue ≤ 15 % en el teléfono).
3. **Probar**: `npm run prueba:todo`, `node pruebas/contraste.mjs` y la matriz de capturas revisada.
4. **Contingencias** en `docs/calidad.md`.
5. **Enseñar al cliente** el resultado en claro y oscuro.
