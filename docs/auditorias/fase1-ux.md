# Auditoría fase 1 · UI/UX y accesibilidad (resumen y estado)

| # | Hallazgo | Estado |
|---|---|---|
| 1 | El radar desaparecía al jugar y la interfaz parpadeaba con el ratón capturado | Corregido |
| 2 | En móvil, el selector de modos quedaba tapado y la galería pisaba el dock | Corregido (`--reserva-inferior`, `--ancho-dock`) |
| 3 | El foco de teclado podía quedar invisible por la ocultación automática | Corregido (`:focus-within`) |
| 4 | La ayuda no coincidía con los controles | Corregido (4 idiomas, ayuda distinta para táctil y teclado) |
| 5 | No se podía mirar arriba/abajo con el teclado | Corregido (RePág/AvPág) |
| 6 | Los botones del radar salían recortados | Corregido |
| 7 | Un `tour.json` que fallaba mostraba la demo | Corregido (pantalla de error) |
| 8 | La pista tapaba el comparador, que además no tenía rótulos | Corregido |
| 9 | La barra de medición tapaba el suelo | Corregido (barra arriba y cámara inclinada) |
| 10 | La visita guiada no se podía pausar ni mostraba progreso | Corregido |
| 11 | El movimiento se sentía "flotante" | Corregido (τ 0,07/0,05, correr a 3,2 m/s, FOV ajustable) |
| 12–13 | Contraste insuficiente en las flechas del suelo y la galería | Corregido |
| 14 | El título y los modos se tocaban a 1024 px | Corregido |
| 15 | El foco no volvía tras cerrar la ayuda | Corregido (y se cierra al hacer clic fuera) |
| 16 | Atajos de una sola letra | Corregido (desactivables y sin efecto con el foco en botones) |
| 17 | Orden de foco y uso de tablist | Parcial: los modos usan `aria-pressed` |
| 18 | Tamaño de los objetivos táctiles | Corregido (plantas, botones del mapa) |
| 19 | La animación de la pista era infinita | Corregido (2 repeticiones) |
| 20 | Sin pista para volver tras pulsar Esc | Corregido |

Mejoras premium ya incluidas:

- Rótulo de estancia al entrar.
- Radar con borde de acento.
- Halo en las flechas del suelo.
- Barra de la visita guiada.

Pendientes:

- Teclas WASD en pantalla.
- "Ping" del radar.
- Tipografía de autor.
