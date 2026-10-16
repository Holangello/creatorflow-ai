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

## Protocolo de ruptura

Una noticia que cambia el trabajo del cliente ideal manda sobre el calendario. Los tres niveles,
los cuatro criterios y los guardarraíles están en `08-actualidad-newsjacking.md`. Resumen
operativo: dos barridos automáticos al día (06:00 y 13:00), Angello puede activarlo a cualquier
hora escribiendo «Maverick, ruptura: [enlace]», y una pieza de nivel 3 sale en menos de tres
horas sustituyendo a la del día, nunca sumándose.

## Routine diaria: radar + posts de mañana (activa)

- **Cuándo:** de lunes a viernes a las 06:00 hora de Madrid.
- **Dónde:** se ejecuta dentro de la sesión de trabajo de Angello, no en una sesión nueva.
  Una sesión nueva nace sin el repositorio ni credenciales de push: la primera versión de esta
  rutina se probó así y no pudo subir nada. Atada a la sesión, tiene repositorio, agentes y
  contexto del sistema.
- **Qué hace:** (1) radar de noticias verificadas a `radar.md`; (2) toma la fila del próximo
  día laborable del calendario, o la noticia si es lo bastante grande, y activa al copywriter
  para escribir **tres alternativas completas** del post con su primer comentario; (3) pide
  brief visual al designer si la pieza lleva carrusel, vídeo o foto; (4) pasa el control de
  calidad; (5) actualiza el artefacto de vista previa; (6) guarda en `cola/`, marca el
  calendario y hace push.
- **Lo que sigue siendo de Angello:** elegir versión, corregir, publicar y responder comentarios.
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

---

## El último metro, resuelto en lo que se podía resolver · 15-10-2026

**El cuello de este sistema no es producir: es que publicar dependa de hora y media diaria de Angello.**
Queda escrito el 14-10 en `decisiones.md`. La única palanca que no depende de su disciplina diaria es una
herramienta de programación, y aquí está lo que se ha preparado para que darla de alta cueste minutos y no
una tarde.

**Lo que se ha construido:** `tools/exportar_programador.py`. Lee `linkedin/banco-posts.json`, se queda con
las piezas publicables y emite dos ficheros en `salida/`:

- `programador-posts.csv` — una fila por pieza: fecha, hora, cuerpo, pilar, versión elegida, caracteres.
- `programador-comentarios.md` — el primer comentario de cada pieza, en el mismo orden.

**Son dos ficheros y no uno porque ninguna herramienta hace las dos cosas.** Comprobado el 15-10:

| Herramienta | Importación CSV | Primer comentario en LinkedIn | Veredicto |
| --- | --- | --- | --- |
| **Buffer** | Sí, por canal, y documentada en su centro de ayuda. Límite de 10 filas por canal en el plan gratuito y 100 en los de pago; si el fichero pasa del límite, carga hasta el tope y **omite el resto sin avisar** | Sí, en planes de pago, **pero NO por CSV**: se añade en el compositor, pieza a pieza | **La opción con la que se ha diseñado el export.** La importación es fiable y el primer comentario es una sentada de media hora |
| **Publer** | Contradictoria entre fuentes: una dice que no hay CSV, otra documenta hasta 500 posts por importación | Sí, incluidos posts de documento (carruseles) | Si su CSV admite el primer comentario, es mejor que Buffer. **Hay que comprobarlo en su documentación antes de pagar** |
| **Taplio** | Sin fuente | Sin fuente | No se puede recomendar ni descartar |

**Limitación declarada, y es importante:** ninguna de las tres webs se ha podido abrir desde esta sesión
—la política de red las rechaza, como a los seis dominios del radar—, así que **esta tabla sale de prensa
secundaria y no de la documentación de los fabricantes.** Por eso el CSV se emite con nombres de columna
genéricos: al importar hay que mapearlos a los de la herramienta, es un minuto, y es preferible a inventar
un esquema que luego falle a mitad de carga.

**Dos cosas que el script hace y conviene no deshacer:**

1. **Excluye las piezas cuya franja ya pasó**, con el motivo escrito. Programar en diciembre una pieza que
   quizá salió en octubre la duplica. Si alguna no se publicó, se recupera con `--incluir-pendientes`.
2. **Avisa de lo que no se puede cargar todavía:** una pieza que caduca antes de su turno, una que pasa el
   techo de caracteres, y una que espera una palabra de Angello.

**Y el aviso que evita el error más caro:** el CSV **sustituye** las filas del calendario a partir de su
fecha de arranque, no las suma. A dos piezas por semana las fechas no coinciden con el calendario de cinco
franjas. Cargar el CSV y seguir además el calendario publica dos veces la misma pieza.

**Lo que sigue necesitando a Angello, y es lo único:** darse de alta, conectar su perfil y pagar. Ningún
agente de este sistema puede hacerlo, y `07-automatizacion.md` ya explicaba arriba por qué la API de
LinkedIn no es una vía: solo permite publicar en Páginas de empresa con app aprobada, nunca en perfil
personal.
