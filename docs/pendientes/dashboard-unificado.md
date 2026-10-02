# Pendiente · Dashboard unificado Makers

**Estado:** construido el 8 de septiembre de 2026 en `dashboard/index.html`. Este documento queda como brief de referencia para futuras iteraciones.
**Anotado:** 2026-09-08

## Qué se quiere

Un solo dashboard, externo y muy pulido (estilo shadcn/ui o Linear), que unifique todo lo que ya
existe disperso:

- El sistema LinkedIn de este repositorio: calendario, banco de posts, radar, decisiones y métricas.
- El panel de ventas y el embudo B2B (`docs/b2b-marketing-sales-rules.md`).
- Los dashboards previos construidos en otras sesiones (auditoría del dashboard, panel de
  fotógrafos y videógrafos de bodas) y las webs: agenciamakers.com, angellobenavides.com,
  moixandco.com, creatribe.
- Datos reales cuando haya conector: LinkedIn orgánico, GA4, Search Console, Gmail e inbox de
  Hostinger, hoja "Leads MAKERS Wedding" en Drive.

Nivel exigido: superprofesional en lo gráfico, en lo complementario y en el detalle. Botones,
accesibilidad, microinteracciones, todo.

## Directrices de referencia (copia literal de Angello)

Actúa como un diseñador UX/UI experto y un desarrollador Full Stack senior especializado en
dashboards SaaS para agencias y negocios digitales.

Quiero que crees un dashboard operativo y analítico integral para gestionar un ecosistema digital
multi-marca/multi-canal. Debe ser interactivo, moderno, visualmente impecable (estilo shadcn/ui o
Linear) y construirse como un componente interactivo de React (listo para visualizarse en un
Artifact de Claude usando Tailwind CSS y Lucide Icons, o en un archivo HTML independiente
interactivo).

### 1. Navegación y filtros globales
- Sidebar con navegación por módulos: Visión General (Executive Hub) · Sitios Web & Tráfico ·
  Blog & Contenido Editorial · Redes Sociales (Social Suite) · Funnels de Venta & Conversión ·
  Email Marketing & Bandejas de Entrada · Ajustes / Cuentas Conectadas.
- Header: selector "Todos los proyectos" o web concreta; selector de rango de fechas; búsqueda;
  notificaciones activas.

### 2. Módulos
- **A. Executive Hub:** 4 KPIs (ingresos del funnel, visitantes únicos, conversión global,
  suscriptores netos); gráfico ingresos vs tráfico a 30 días; feed de alertas.
- **B. Sitios Web & Blogs:** estado por sitio (dominio, visitas, rebote, velocidad, SSL); pipeline
  de contenido tipo kanban (borrador, programado, publicado) con web de destino, fecha, autor y
  visitas orgánicas.
- **C. Redes Sociales:** métricas por plataforma (Instagram, TikTok, YouTube, LinkedIn, X):
  seguidores, crecimiento semanal, engagement, clics salientes; top publicaciones a 7 días.
- **D. Funnels:** etapas tráfico frío → leads → oportunidades → clientes; conversión por fase, AOV,
  CPA; tabla de funnels con estado (activo, en optimización, pausado).
- **E. Email:** open rate, CTR, bajas, envíos mensuales; monitor de bandejas conectadas (soporte,
  ventas, newsletter) con no leídos y tiempo de respuesta; secuencias activas.

### 3. Interactividad
- Vistas del sidebar como pestañas dentro del mismo artefacto.
- Datos simulados realistas, coherentes entre módulos, en español.
- Tooltips, etiquetas de estado por color, estados hover en tablas y botones.

## Adaptaciones que se harán al construirlo

El prompt es genérico. Al ejecutarlo se adapta a Makers:

1. Las marcas y webs reales sustituyen a "Web A / Web B / Web C".
2. El módulo de redes se construye alrededor de LinkedIn como canal número uno, con el calendario,
   el banco de posts y las métricas de `linkedin/05-metricas.md` integrados, no simulados.
3. El funnel refleja el embudo B2B real: atracción → conversación → captación → diagnóstico →
   propuesta (tres opciones) → retainer.
4. Donde haya conector disponible, datos reales; donde no, mock marcado como tal.
5. Identidad visual de Makers (Brand Book), no la plantilla shadcn por defecto.
6. Accesibilidad de verdad: foco visible, contraste 7:1, navegación por teclado, `prefers-reduced-motion`.

## Cómo retomarlo

```
Maverick, retomamos el dashboard unificado: docs/pendientes/dashboard-unificado.md
```
