# Análisis competitivo: software de recorridos virtuales (octubre 2026)

Leyenda de la tabla:

- **✔**: confirmado.
- **~**: parcial, de pago aparte o en un plan superior.
- **✘**: no existe o no se encontró.
- **?**: sin verificar.

Los precios son aproximados y cambian a menudo.

| Producto | Fotos 360 de consumo | Medición | Plano con medidas | Maqueta | Visita guiada | Staging / antes-después | Leads | Marca blanca | Exporta | Precio aprox. |
|---|---|---|---|---|---|---|---|---|---|---|
| Matterport | ~ Insta360 vía app | ✔ (Pro+) | ~ add-on | ✔ | ✔ | ✔ Defurnish | ~ | ~ | MatterPak, MP4 add-on; sin offline | $0–309/mes |
| Kuula | ✔ | ✘ | ~ | ✘ | ✔ | ✘ | ~ | ✔ Pro | ~ | $0–36/mes |
| 3DVista VT Pro | ✔ | ? | ✔ | ~ GLB/splats | ✔ | ~ | ✔ | ✔ | ✔ offline | ~€499 + hosting |
| Pano2VR 7 | ✔ | ✘ | ✔ | ~ | ✔ | ~ | ✘ | ✔ | ✔ HTML5 | ~€450–499 |
| CloudPano | ✔ | ✘ | ~ | ~ | ? | ✘ | ✔ | ~ | ✘ | $19–49/mes |
| Floorfy (ES) | ~ Insta360 | ✔ | ✔ auto | ✔ | ? | ✔ IA | ✔ | ✔ | Vídeo, fotos | A consultar |
| Ricoh360 Tours | ~ Theta | ✘ | ~ | ✘ | ✔ vídeo IA | ✔ IA | ? | ~ | Vídeo | $0–39+/mes |
| Zillow 3D Home | ✔ (con su app) | ~ | ✔ | ✘ | ✘ | ✘ | Zillow | ✘ | ✘ | Gratis (EE. UU.) |
| Giraffe360 | ✘ cámara propia | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Vídeo, fotos | £159+/mes |
| Panoee | ✔ | ✘ | ~ | ✘ | ✔ | ✘ | ~ | ✔ | ZIP de pago | $0–22/mes |
| Momento360 | ✔ | ✘ | ~ | ✘ | ✘ | ✘ | ✘ | ✔ Pro | ✘ | $0–42/mes |
| Nodalview | ~ | ✘ | ✔ 24 h | ✘ | ✔ vídeo | ✔ IA | ? | ✔ | Fotos, vídeo | ~$99–159/mes |
| Metareal Stage | ✔ | ✔ | ✔ | ✔ | ? | ✘ | ? | ? | ? | A consultar |
| SuperSplat | Splats | ✘ | ✘ | Splat, paseo | ✔ | ✘ | ✘ | ✘ | HTML publicado | Gratis |

**Osmo 360**: ningún fabricante lo cita oficialmente, pero un JPG equirectangular 2:1 funciona en cualquier herramienta
que admita subir panoramas. Ninguna herramienta de splatting entrena con una única foto 360. Hace falta vídeo 360 dividido
en vistas planas, que es lo que hace `extraer_fotogramas.py`.

## Lo que espera una inmobiliaria top

- **Imprescindible**:
  - Transiciones fluidas y precarga.
  - Rapidez en móvil.
  - Plano con posición.
  - Plano con medidas y m².
  - Medición.
  - Hotspots multimedia.
  - Enlace, iframe y QR.
  - Modo sin marca.
  - Marca blanca.
  - Leads por WhatsApp o formulario.
  - Pantalla completa y giroscopio.
  - Multi-idioma.
  - Analítica.
- **Diferenciador**:
  - Maqueta 3D.
  - Visita guiada.
  - Home staging con antes/después.
  - Día/noche.
  - Vídeo 9:16.
  - Exportación offline o autohospedada.
  - WebXR.
  - Visita en vivo con el agente.
  - Página SEO.
- **Opcional**:
  - Música.
  - Nube de puntos.
  - Inventario.

## Diferenciadores que casi nadie ofrece (incorporados o planificados en nuestro visor)

1. **Visor híbrido**: fotos 360 nítidas y paseo libre por gaussian splat en el mismo tour. ✔
2. **Medición sin LiDAR**: usa la altura conocida del trípode. ✔
3. **Antes/después con cortinilla** dentro del 360 (estilos, día/noche, pintura). ✔
4. **Estilos de decoración con IA** por estancia, más **cambio de color de paredes y suelos** con máscaras. ✔
5. **Exportación 100 % offline** gratis: un HTML autónomo y un ZIP autohospedado. ✔
6. **Vídeo 9:16 para redes** generado en el navegador. ✔
7. **Captación de leads por WhatsApp** con contexto (estancia y enlace a la vista exacta). ✔
8. **Accesibilidad** (teclado, lector de pantalla, movimiento reducido), algo inexistente en el sector. ✔
9. **Multi-idioma** sin servidor. ✔
10. **"¿Cabe mi sofá?"** (cajas con medidas reales) y **ruta del sol**. Pendiente.

## Quejas típicas a evitar

- Dependencia de suscripción: los enlaces mueren al cancelar (Matterport).
- Riesgo de plataforma: Zillow retiró los tours de Matterport el 20/10/2025.
- Alojamiento caro y curva de aprendizaje alta (3DVista).
- Funciones clave escondidas en planes caros.
- Exportaciones "falsas" que siguen dependiendo de un servidor.
- Hardware cautivo.
- Planos con 24 h de espera.
- Productos abandonados (Luma Flythroughs).
- Visores solo WebGPU que excluyen dispositivos antiguos.
- Formatos de splat incompatibles.

## Fuentes

- https://matterport.com/plans
- https://www.thefuture3d.com/blog-0/2026/3/1/matterport-pricing-guide-2026/
- https://europa.kuula.co/page/pro
- https://www.3dvista.com/en/virtual-tour-pro-enterprise/
- https://ggnome.com/?p=21657
- https://blog.floorfy.com/en/real-estate-marketing-software/what-is-floorfy-virtual-tours-real-estate-software
- https://www.zillow.com/z/3d-home/faq/
- https://giraffe360.com/pricing
- https://panoee.com/how-to-export-a-virtual-tour-with-panoee
- https://help.momento360.com/article/108-plans-pricing-and-features
- https://developer.playcanvas.com/user-manual/supersplat/publishing/
- https://radiancefields.com/luma-ai-to-sunset-flythroughs-on-january-1-2026
- https://github.com/joseluissaorin/360-video-to-gaussian-splatting
