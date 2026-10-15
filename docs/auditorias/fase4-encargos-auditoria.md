# cre8eight · Encargos de las auditorías finales de la fase 4

Se lanzan **en paralelo** cuando los tres paquetes de `fase4-plan.md` (núcleo, paneles y Estudio) estén integrados y `npm run prueba:todo` esté en verde. Ninguna auditoría edita código: entregan un informe en `docs/auditorias/` con hallazgos priorizados (P1 bloquea la entrega, P2 conviene, P3 pulido), cada uno con pantalla, tamaño, tema, captura y propuesta concreta. El orquestador concilia los tres informes y reparte las correcciones.

Contexto común para los tres:
- Código en `tools/visor-inmobiliario` (rama `ccr-40d07831-qbgzrt`). Producto: visor 3D de recorridos inmobiliarios con fotos 360 de la DJI Osmo 360 (`index.html?demo`), su Estudio (`estudio.html`) y la Guía Osmo 360 (`asistente-osmo.html`).
- Diseño pedido por el cliente: premium al estilo Apple, **«minimal liquid glass» (glass UI) en claro y en oscuro**, tallas S/M/L, de 360×640 a 3840×2160 y 3440×1440.
- Documentos: `docs/diseno/sistema.md` (tokens, componentes, vidrio adaptativo), `docs/auditorias/fase4-plan.md`, `docs/auditorias/fase3-organizacion.md`, `docs/calidad.md`.
- Herramientas: Playwright con Chromium ya instalado (no ejecutar `playwright install`); `node pruebas/capturas.mjs`, `npm run contraste`, `npm run medir`, ayudantes en `pruebas/comun.mjs`. Revisar las capturas con la herramienta Read.
- Lanzar las pruebas pesadas de una en una (trabajan tres auditores a la vez en 4 núcleos).

## A · Auditoría visual y de interfaz (UI)

Carga la skill `design:design-critique` (y `design:design-system` para la coherencia de tokens).

- Matriz completa de capturas: visor, Estudio y Guía × claro/oscuro × S/M/L × 360×640, 390×844, 844×390, 820×1180, 1024×768, 1280×800, 1440×900, 1920×1080, 2560×1440, 3440×1440 y 3840×2160.
- Revisar:
  - ¿Se ve vidrio en los dos temas? ¿Es coherente con el sistema (radios, sombras, espaciado, tipografía, iconos)?
  - Jerarquía, alineaciones, desbordes y textos cortados.
  - El vidrio adaptativo sobre fotos de día y de noche.
  - Las piezas que queden con el estilo antiguo.
- Entrega `docs/auditorias/fase4-visual.md`.

## B · Auditoría de accesibilidad (WCAG 2.1 AA)

Carga la skill `design:accessibility-review`.

- Contraste real en pantalla, no solo de tokens: texto sobre vidrio con fotos claras y oscuras, en claro y en oscuro, con el vidrio adaptativo activo.
- Teclado: orden, foco visible, atajos de una letra desactivables y diálogos.
- Lectores de pantalla: roles, nombres y anuncios.
- Objetivos táctiles de 44 px.
- «Reducir movimiento» y «Reducir transparencia».
- Zoom al 200 % y `prefers-contrast`.
- Visor, paneles, Estudio y Guía.
- Entrega `docs/auditorias/fase4-accesibilidad.md`.

## C · Maverick (abogado del diablo)

Rompe el producto como lo haría un cliente exigente, una inmobiliaria con prisa o un visitante con un móvil antiguo:
- Recorre el flujo completo: Guía → Estudio → publicar → visor → contacto por WhatsApp.
- Rendimiento con el vidrio: fps en un portátil normal y desenfoque en móviles modestos (CPU limitada con `page.emulate` o throttling de CDP).
- Datos raros: marcas de colores extremos, títulos larguísimos, tour sin plano o sin música, una sola foto.
- Prueba los cambios de tema a mitad de un diálogo.
- Responde con criterio: ¿esto es de verdad premium? ¿Qué sobra? ¿Qué falta para competir con Matterport, Kuula o CloudPano en el día a día de una inmobiliaria española?
- Entrega `docs/auditorias/fase4-maverick.md`.
