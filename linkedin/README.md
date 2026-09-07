# Sistema LinkedIn — Angello Benavides × Makers

Equipo de agentes de IA que produce el contenido de LinkedIn de principio a fin. Maverick
orquesta; los especialistas ejecutan.

## Cómo se pide una pieza

En una sesión de Claude Code en este repositorio:

```
Maverick, crea la pieza de mañana.
Maverick, escribe un post sobre por qué los briefings de 40 páginas no sirven.
Maverick, aquí están las métricas del post del lunes: 12.400 impresiones, 38 comentarios, 91 guardados, 47 clics a perfil, 2 mensajes.
Maverick, planifica el calendario de octubre.
```

Maverick lee las guías, activa a los agentes que hagan falta, aplica el control de calidad y
deja la pieza en `linkedin/cola/` con copy, parámetros de publicación y brief de diseño.

## El equipo

| Agente | Función |
| --- | --- |
| `maverick` | Orquesta, controla calidad, entrega y mantiene el calendario |
| `linkedin-strategist` | Briefs de pieza, calendario, ajustes de estrategia, auditoría de perfil |
| `linkedin-copywriter` | Texto del post y primer comentario, en la voz de Angello |
| `linkedin-designer` | Brief de producción visual: carrusel, imagen o vídeo, paso a paso |
| `linkedin-analyst` | Diagnóstico de métricas y actualización de aprendizajes |

Definiciones en `.claude/agents/`.

## Los documentos

| Archivo | Qué contiene |
| --- | --- |
| `06-modo-disruptivo.md` | **Línea editorial vigente.** Palancas de viralidad, ganchos y límites |
| `01-estrategia.md` | Posicionamiento, ICP, embudo, parámetros del algoritmo, cadencia, perfil |
| `02-tipos-de-contenido.md` | Catálogo de 12 tipos de pieza con estructura y métrica |
| `03-guia-copywriting.md` | Voz, anatomía del post, fórmulas de gancho, prohibiciones |
| `04-guia-diseno.md` | Medidas, tipografía, plantillas de carrusel y vídeo, exportación |
| `05-metricas.md` | Registro de resultados, aprendizajes vigentes, hipótesis |
| `calendario.md` | Tres semanas planificadas con estado por pieza |
| `cola/` | Piezas listas para publicar |
| `../docs/b2b-marketing-sales-rules.md` | Regla B2B que manda sobre todo lo comercial |

## Automatización diaria

Una Routine crea la pieza del día automáticamente: toma la primera fila `pendiente` de
`calendario.md`, ejecuta el pipeline completo, guarda el archivo en `cola/`, marca la fila
como `creada` y hace push. Angello solo publica y responde comentarios.

Ver `linkedin/07-automatizacion.md`.

## Lo que sigue haciendo Angello a mano

- Publicar (LinkedIn no permite publicación automática desde aquí sin su API de empresa).
- Responder comentarios en los primeros 60 minutos. Esto decide la distribución.
- Confirmar los `[DATO]` marcados: cifras de clientes y autorizaciones.
- Pegar las métricas a las 48 h y a los 7 días.
