# Centro de Mando Makers

Dashboard unificado de Angello Benavides y Makers: LinkedIn, webs, contenido, redes, embudo,
bandejas y cuentas conectadas en una sola página.

- **Fuente:** `dashboard/index.html`. HTML autónomo, sin build. Publicado en https://claude.ai/code/artifact/0c4e4052-4c4e-44df-a881-1548ce03cf06
- **Datos:** todo lo que muestra es real o está marcado «sin dato». Cada bloque lleva el sello de
  procedencia y la fecha de lectura. Nunca se rellenan cifras simuladas.
- **Actualizar:** Maverick regenera los bloques de datos (constantes al principio del `<script>`)
  cuando cambian `linkedin/*.md`, la hoja de leads o las bandejas, y vuelve a publicar.
- **Orden para retomarlo:** `Maverick, actualiza el Centro de Mando`.

Brief original y adaptaciones: `docs/pendientes/dashboard-unificado.md`.

## Estado de publicación (Pack offline)

El módulo «Pack offline» lleva un botón «Ya la publiqué» por pieza. El estado se guarda en la
base de datos compartida del artefacto (colección `piezas`, documento = fecha `AAAA-MM-DD`,
campos `estado` (`publicada` | `modificada`), `en`, `version`, `nota`) y, como respaldo, en el
navegador. Cuando vuelvan los créditos, Maverick lo lee con la acción `read_db` del artefacto
y actualiza `linkedin/calendario.md` y `05-metricas.md`. Si la base de datos no está
disponible, el botón «Copiar estado para Maverick» copia el JSON para pegarlo en el chat.
