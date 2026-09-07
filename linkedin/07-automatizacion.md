# Automatización del sistema

## Qué se puede automatizar y qué no

| Paso | Automatizable | Cómo |
| --- | --- | --- |
| Elegir la pieza del día | Sí | Routine diaria lee `calendario.md` |
| Vigilar noticias de IA y audiovisual | Sí | Radar diario, alimenta `radar.md` |
| Planificar el calendario | Sí | Strategist, a demanda o cuando quedan menos de 2 semanas |
| Escribir estrategia, copy y brief de diseño | Solo a petición | Maverick + agentes, cuando Angello lo pide |
| Guardar, versionar y hacer push | Sí | Routine |
| Producir el carrusel o el vídeo | No | Requiere Figma/Premiere y material propio |
| Publicar en LinkedIn | No | La API de LinkedIn solo permite publicar en Páginas de empresa con app aprobada, no en perfil personal |
| Responder comentarios | No | Es lo que decide la distribución. Lo hace Angello |
| Registrar métricas | Parcial | Angello pega las cifras; el analyst las procesa |

## Routine diaria: radar de actualidad (activa)

Fase actual del sistema: estructura y planning. La rutina **no redacta piezas**. Vigila
noticias y mantiene el calendario poblado.

- **Cuándo:** de lunes a viernes a las 06:00 hora de Madrid.
- **Qué hace:** busca noticias de IA y audiovisual de las últimas 24-48 horas, las verifica
  contra su fuente primaria, añade hasta 3 candidatos a `radar.md`, actualiza el hueco de
  actualidad del calendario si alguna lo merece, replanifica si quedan menos de dos semanas,
  y hace push.
- **Lo que no hace:** escribir posts. Eso se pide a mano.
- **Prompt de la rutina:**

```
Repositorio Holangello/creatorflow-ai, rama claude/linkedin-angello-strategy-myu9oo.

Actúa como Maverick (.claude/agents/maverick.md) en modo automático: radar de actualidad.
NO redactes ninguna pieza.

1. Lee linkedin/08-actualidad-newsjacking.md, linkedin/06-modo-disruptivo.md,
   linkedin/01-estrategia.md, linkedin/calendario.md y linkedin/radar.md.
2. Busca en la web noticias de las últimas 24-48 horas en las fuentes del pilar de actualidad
   (IA aplicada a vídeo, imagen y voz; regulación europea; cámaras y flujos de trabajo;
   cambios de formato en plataformas; industria audiovisual en España).
3. Selecciona un máximo de 3 con lectura clara para un director de marketing.
4. Verifica cada una contra su fuente primaria. Sin fuente primaria, se descarta.
5. Añade cada candidato a linkedin/radar.md con titular propuesto, ángulo, por qué le importa
   al ICP, enlace y caducidad. Archiva las entradas de más de 72 horas.
6. Si alguna merece el hueco de actualidad de esta semana, actualiza esa fila de
   linkedin/calendario.md con el título y la descripción. Déjala en estado "planificada".
7. Si quedan menos de dos semanas planificadas, activa a linkedin-strategist para añadir dos
   semanas más (título y descripción, sin redactar).
8. Commit y push a la rama indicada. No abras pull request.
9. Resume en dos líneas: qué has detectado y qué recomiendas publicar.
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
