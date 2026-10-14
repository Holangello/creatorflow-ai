# Auditoría fase 1 · Maverick (crítica de producto)

## Veredicto

Hoy cre8eight serviría como piloto con 3–5 inmuebles propios, pero no para lanzarlo como "producto TOP". El visor está
bien hecho y la ficha con el certificado energético cumple la normativa. El problema es que la demo, generada por código,
funciona mejor que el flujo real con fotos.

- **Lo que impresiona al comprador:** la cortinilla antes/después, el radar y WhatsApp con la captura de la vista.
- **Lo que impresiona al propietario:** ver su salón en 3 estilos y de noche durante la visita de captación, y recibir
  el material en 24 h.

## Puntos débiles

1. **"Como Minecraft" con fotos 360 no es caminar.** En las fotos 360, W salta de foto en foto. Caminar de verdad
   necesita un splat, así que conviene reservarlo para inmuebles premium y simular profundidad en las transiciones.
2. **Rendimiento en móvil.** La foto de 4096 px se ve blanda en pantalla y consume mucha memoria de la tarjeta gráfica.
   Propuesta: dividir la foto 360 en caras de cubo cargadas por resolución, usar KTX2 y precargar menos.
3. **Fotos de 120 MP en el Estudio.** Ocupan unos 480 MB en memoria; en el iPad el canvas no pasa de unos 16,7 MP.
   Propuesta: disparar en HDR a 30 MP y redimensionar en un worker.
4. **La interfaz tapa un 45 % de la pantalla en móvil.** Propuesta: autoocultar más elementos, hacer el radar más pequeño
   y llevar el selector de modos a la hoja inferior.
5. **Fricción en el contacto.** Propuesta: un WhatsApp de un toque, con captura y enlace a la vista.
6. **Los estilos de IA no se generan dentro del producto.** Propuesta: IA integrada (img2img que conserve la
   profundidad) y máscaras automáticas por segmentación.
7. **Riesgo legal con la IA.** Propuesta: marca de agua "Recreación virtual · IA" incrustada en todo lo que se exporte.
8. **Idealista.** cre8eight no es proveedor compatible, así que el tour propio no se puede enlazar allí. Además:
   - El vídeo no tiene tope, puede pasar de 100 MB y en algunos navegadores sale en WebM.
   - Las fotos pueden pasar de 8 MB.

   Propuesta: ajustar el bitrate a la duración, forzar MP4 y comprimir las fotos hasta quedar por debajo de 7,5 MB.
9. **Sin nube ni trabajo en equipo.** El proyecto vive en IndexedDB y la publicación es manual. Propuesta: publicar con
   un clic.
10. **Pulido.**
    - Aparece un "null" en la pantalla Exportar.
    - La maqueta no lleva texturas.
    - No hay panel de analítica.
    - Las dependencias se cargan desde un CDN.

## Funcionalidades únicas, por impacto y esfuerzo

1. WhatsApp de un toque con captura y enlace a la vista.
2. Vídeo 9:16 automático de menos de 100 MB.
3. Estilos de IA dentro del Estudio.
4. Máscara automática por segmentación.
5. Maqueta texturizada con las fotos 360.
6. "¿Cabe mi sofá?"
7. Recorrido del sol según latitud y orientación.
8. Visita en vivo sincronizada con el agente.
9. Página SEO del inmueble con schema.org y Open Graph.
10. Splat exprés en la nube.

## Día real: objetivo de unas 2 h 20 min (hoy, 5–6 h)

Lo que falta para llegar al objetivo:

- Colocación automática de las tomas.
- Estilos de IA integrados.
- Publicar con un clic.
- Importación desde el CRM.
- Panel de visitas para el propietario.

## Riesgos

- **Dependencia de idealista:** el tour vive fuera de la plataforma donde está el comprador.
- **Legal por la IA.**
- **Privacidad:** difuminar caras en las fotos.
- **Coste operativo:** conviene ofrecer niveles de servicio Básico, Plus y Premium.
- **Deuda técnica:** faltan pruebas E2E.
- **Comoditización:** el foso no es el visor, es la velocidad, la marca y los datos.
