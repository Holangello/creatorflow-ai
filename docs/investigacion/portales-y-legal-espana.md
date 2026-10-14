# Portales inmobiliarios y requisitos legales en España (octubre 2026)

Investigación hecha con búsquedas web. Cada dato lleva una etiqueta:

- **[V]**: verificado con fuente oficial o primaria.
- **[S]**: viene de una fuente secundaria.
- **[NV]**: no verificado; hay que confirmarlo antes de usarlo.

## 1. Qué acepta cada portal

| Portal | Fotos | Vídeo | Tour 360/3D | Enlace a la web propia |
|---|---|---|---|---|
| **idealista** | Hasta 200 fotos de 8 MB cada una [V] | Hasta 6 vídeos de 100 MB (mp4, mov, avi, wmv…) [V]. No admite YouTube ni Vimeo [S] | Solo como "enlace multimedia" de **proveedores compatibles**: Matterport, Kuula, Floorfy, Giraffe360… [V]. Kuula requiere convertir su enlace a un formato "compatible con idealista" [S]. Idealista vende su propio tour 360 [V] | No [NV] |
| **Fotocasa / Habitaclia** | Límites no publicados [NV] | Sí [NV] | Enlace de tour [NV]. Tienen "Express Visit" [S] | No [NV] |
| **Kyero** | Máximo 50 por feed XML [S] | Sí [S] | Campo "Virtual Tour URL" [S] | Sin datos |
| **Rightmove Overseas** | Sin datos | YouTube/Vimeo [S] | Enlace externo o por feed [S] | Sin datos |
| **pisos.com, Yaencontre, Milanuncios, ThinkSpain, Green-Acres, Spain-Houses** | Sin datos verificados | Sin datos verificados | Sin datos verificados | Sin datos verificados |

### Consecuencia para nuestro software

Ningún portal deja **subir** un recorrido propio como archivo. Lo que sí podemos entregarles:

1. **Vídeo MP4** de la visita guiada (≤ 100 MB; nuestra exportación sale en 16:9 y 9:16).
2. **Fotos** JPG ≤ 8 MB, más **fotos 360 con metadatos GPano** (las aceptan Kuula, Facebook y Google).
3. **Plano** PNG con medidas y m².
4. **Enlace del tour**, solo en los portales que acepten tours de terceros (Kyero, Rightmove). En idealista, el camino es
   publicar una copia de las fotos 360 en un proveedor compatible (por ejemplo, Kuula) y pegar su enlace.
5. El **tour completo**, con ficha, contacto por WhatsApp, estilos, día/noche, medición y paseo libre, vive en la **web
   propia**: se comparte por enlace, QR, redes y Google Business.

## 2. Checklist legal del visor y de los anuncios

- **Certificado de eficiencia energética** (RD 390/2021, art. 15) en todo anuncio de venta o alquiler: letra y valor de
  consumo (kWh/m²·año) y de emisiones (kg CO₂/m²·año), escala A–G y tipo de certificado (proyecto, terminado o existente).
  El visor lo muestra en la ficha y en el dossier.
- **No inducir a error** (RD 515/1989): precio total, forma de pago y superficie útil y construida sin confundirlas. Lo
  publicitado es exigible al vendedor.
- **Ley 12/2023, art. 31**: identidad del vendedor y del intermediario, precio y conceptos, superficie útil y construida,
  antigüedad, certificado energético, cargas y cuotas.
- **Publicidad engañosa** (Ley 34/1988, Ley 3/1991, TRLGDCU): las imágenes con IA (estilos, home staging) deben rotularse
  como *recreación virtual orientativa*. El visor muestra el aviso y ofrece el comparador con la foto real.
- **RGPD / LOPDGDD** en el formulario de contacto: información por capas (responsable, finalidad, base jurídica, derechos,
  enlace a la política) y casilla **no premarcada**.
- **Cookies** (LSSI art. 22.2): si se añade analítica con cookies, banner con "Rechazar" al mismo nivel que "Aceptar". El
  visor no instala cookies por sí mismo.
- **Imagen y privacidad** en las fotos 360:
  - Retirar objetos personales y difuminar caras y matrículas.
  - Pedir el consentimiento escrito del propietario.
  - Eliminar el EXIF y el GPS. Los scripts y el Estudio ya lo hacen.
- **Normativa autonómica**:
  - **Andalucía** (Decreto 218/2005): Documento Informativo Abreviado.
  - **Cataluña** (Llei 18/2007, art. 59, modificado por la Llei 11/2026): nº AICAT en la publicidad.
  - **Comunitat Valenciana** (Decreto 98/2022): registro RAI.

  El campo `marca.pie_legal` sirve para estos datos.

## 3. Campos de la ficha que espera un comprador

Referencia, operación, tipología, precio y €/m², gastos de comunidad, IBI, superficie construida/útil/parcela,
habitaciones, baños, planta, exterior, ascensor, orientación, estado, año de construcción y de reforma, calefacción, aire
acondicionado, garaje, trastero, terraza, balcón, jardín, piscina, amueblado, accesibilidad, certificado energético,
ocupación, cargas, zona aproximada, descripción multi-idioma, vídeo, tour y plano.

## Fuentes

- idealista, centro de ayuda (Multimedia):
  - https://www.idealista.com/tools/centrodeayuda/articulos/multimedia/
  - https://www.idealista.com/tools/centrodeayuda/articulos/proveedores-multimedia-compatibles/
- Kuula aprobado por idealista: https://blog.kuula.co/idealista-approves-kuula
- Kyero (Giraffe360): https://docs.giraffe360.com/en/articles/9271383-how-to-add-your-virtual-tour-on-kyero
- Rightmove: https://hub.rightmove.co.uk/how-to-share-a-virtual-tour-or-video-on-your-rightmove-listing/
- RD 390/2021: https://www.miteco.gob.es/ca/energia/eficiencia/certificacion-energetica/real-decreto-390-2021.html
- RD 515/1989: https://www.boe.es/eli/es/rd/1989/04/21/515/con/19890517
- Ley 12/2023, art. 31: https://blog.sepin.es/requisitos-informacion-compraventa-arrendamiento-ley-derecho-vivienda
- Cataluña, Llei 11/2026:
  https://www.idealista.com/ca/news/immobiliari/2026/07/17/906367-la-generalitat-rectifica-elimina-l-obligacio-de-publicar-les-dades-de-la-cedula-d
- Andalucía, Decreto 218/2005:
  https://www.consumoresponde.es/art%C3%ADculos/campana-inspeccion-informacion-compraventa-arrendamiento-viviendas-2024
- Home staging virtual:
  https://www.nar.realtor/magazine/real-estate-news/technology/the-worst-offenses-in-virtually-staged-photos
