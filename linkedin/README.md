# Sistema LinkedIn — Angello Benavides × Makers

Equipo de agentes de IA que produce el contenido de LinkedIn de principio a fin. Maverick
orquesta; los especialistas ejecutan.

## Cómo se pide una pieza

En una sesión de Claude Code en este repositorio:

```
Maverick, escribe la pieza del 15 de septiembre.
Maverick, redacta la pieza de actualidad de hoy sobre [noticia].
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
| `08-actualidad-newsjacking.md` | Pilar de actualidad: fuentes, ángulos, verificación y protocolo de ruptura |
| `radar.md` | Noticias candidatas detectadas por la rutina diaria |
| `09-perfil.md` | Titular, «Acerca de», destacados y ajustes del perfil, listos para pegar |
| `01-estrategia.md` | Posicionamiento, ICP, embudo, parámetros del algoritmo, cadencia, perfil |
| `02-tipos-de-contenido.md` | Catálogo de 12 tipos de pieza con estructura y métrica |
| `03-guia-copywriting.md` | Voz, anatomía del post, fórmulas de gancho, prohibiciones |
| `04-guia-diseno.md` | Medidas, tipografía, plantillas de carrusel y vídeo, exportación |
| `05-metricas.md` | Registro de resultados, aprendizajes vigentes, hipótesis |
| `calendario.md` | Cuatro semanas planificadas con estado por pieza |
| `decisiones.md` | Qué versión se eligió cada día y con qué criterio |
| `cola/` | Piezas listas para publicar |
| `../docs/b2b-marketing-sales-rules.md` | Regla B2B que manda sobre todo lo comercial |

## Fase actual: estructura y planning

El calendario define título, descripción y ángulo de cada publicación. **Las piezas no se
redactan hasta que Angello las pide.** `cola/` está vacía a propósito.

## Automatización diaria

Una Routine se ejecuta de lunes a viernes a las 06:00 (Madrid) y hace de radar: busca noticias
de IA y audiovisual, las verifica contra su fuente primaria, las apunta en `radar.md`, ocupa el
hueco de actualidad del calendario y replanifica cuando quedan menos de dos semanas. No escribe
posts.

Ver `linkedin/07-automatizacion.md`.

## Lo que sigue haciendo Angello a mano

- Publicar (LinkedIn no permite publicación automática desde aquí sin su API de empresa).
- Responder comentarios en los primeros 60 minutos. Esto decide la distribución.
- Confirmar los `[DATO]` marcados: cifras de clientes y autorizaciones.
- Pegar las métricas a las 48 h y a los 7 días.
