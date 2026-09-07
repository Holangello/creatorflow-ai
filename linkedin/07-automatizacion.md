# Automatización del sistema

## Qué se puede automatizar y qué no

| Paso | Automatizable | Cómo |
| --- | --- | --- |
| Elegir la pieza del día | Sí | Routine diaria lee `calendario.md` |
| Escribir estrategia, copy y brief de diseño | Sí | Maverick + agentes |
| Guardar, versionar y hacer push | Sí | Routine |
| Producir el carrusel o el vídeo | No | Requiere Figma/Premiere y material propio |
| Publicar en LinkedIn | No | La API de LinkedIn solo permite publicar en Páginas de empresa con app aprobada, no en perfil personal |
| Responder comentarios | No | Es lo que decide la distribución. Lo hace Angello |
| Registrar métricas | Parcial | Angello pega las cifras; el analyst las procesa |

## Routine diaria (recomendada)

- **Cuándo:** todos los días laborables a las 06:00 hora de Madrid, para que la pieza esté
  lista antes de la hora de publicación.
- **Qué hace:** abre una sesión nueva en este repositorio, invoca a Maverick en modo
  automático, crea la pieza siguiente, la commitea y la sube a la rama de trabajo.
- **Cómo se crea:** pídelo en una sesión ("activa la rutina diaria de LinkedIn") o créala
  desde la lista de Routines. Prompt de la rutina:

```
Repositorio creatorflow-ai, rama claude/linkedin-angello-strategy-myu9oo.

Actúa como Maverick (.claude/agents/maverick.md) en modo automático:
1. Lee linkedin/06-modo-disruptivo.md, linkedin/01-estrategia.md y linkedin/calendario.md.
2. Toma la primera fila con estado "pendiente".
3. Ejecuta el pipeline: strategist -> copywriter -> designer -> QA Maverick.
4. Guarda la pieza en linkedin/cola/AAAA-MM-DD-slug.md con el formato oficial.
5. Marca la fila como "creada" con la ruta del archivo.
6. Si quedan menos de 5 filas pendientes, activa al strategist para planificar dos semanas más.
7. Commit y push a la rama indicada.
8. Resume en dos líneas qué pieza has creado y qué [DATO] necesita confirmación.
```

## Alternativa de publicación programada

Para que la publicación también sea automática, dos vías, ambas de pago y externas:

1. **Herramienta de programación** (Buffer, Publer, Taplio): Angello pega el copy y el
   archivo una vez a la semana y la herramienta publica a la hora fijada. Es lo más rápido
   de montar y respeta los términos de LinkedIn.
2. **Publicación nativa manual.** Sigue siendo la que mejor rinde en alcance. Recomendada
   mientras el volumen sea de 5 piezas semanales.

No se recomienda ninguna automatización que publique desde el perfil personal sin la API
oficial: LinkedIn restringe cuentas por ello.

## Ritmo de revisión

- **Semanal:** Angello pega las métricas de las 5 piezas. El analyst actualiza `05-metricas.md`.
- **Mensual:** el strategist rehace el calendario del mes siguiente con los aprendizajes vigentes.
- **Cuando cambie el algoritmo:** Angello lo comparte, Maverick actualiza la sección 5 de
  `01-estrategia.md` con fecha.
