# Guía de diseño LinkedIn — sistema visual

Todo lo visual sale de la identidad de Makers (ver `MAKERS_Brand_Book.pdf` en Drive). Aquí se
fijan medidas y reglas de producción para que cualquier pieza se pueda ejecutar sin preguntar.

## Formatos y medidas

| Formato | Medida | Uso |
| --- | --- | --- |
| Carrusel PDF | 1080 × 1350 px (4:5), 6-10 páginas, < 10 MB | Casos, métodos, procesos |
| Imagen única | 1200 × 1500 px (4:5) | Antes/después, cita, dato |
| Vídeo nativo | 1080 × 1350 px (4:5), 45-90 s, MP4 H.264, subtítulos quemados | Decisiones creativas, detrás del proceso |
| Foto propia | 4:5, sin filtro, luz natural o de set | Piezas humanas |

## Sistema tipográfico
- **Titulares:** sans grotesca pesada (la del Brand Book de Makers). 96-120 px en portada de carrusel.
- **Cuerpo de slide:** misma familia, regular, 44-52 px. Máximo 25 palabras por slide.
- **Interlineado:** 1,15 en titulares, 1,3 en cuerpo.
- **Alineación:** izquierda. Nunca centrado en bloques de más de dos líneas.

## Color
- Fondo dominante: negro o blanco roto, según Brand Book. Un solo acento de marca por pieza.
- Regla de contraste: texto sobre fondo con ratio mínimo 7:1.
- Acento solo para: cifras, palabra clave del gancho, CTA.

## Estructura de carrusel (plantilla)
1. **Portada:** gancho en 8-12 palabras, cifra o palabra clave en acento. Sin logo grande.
2. **Problema:** una frase, la más dura del post.
3-8. **Desarrollo:** una idea por slide. Numeración visible "03/10" en esquina inferior.
9. **Resultado / tesis:** frase citable, tipografía grande.
10. **Cierre:** CTA + "Angello Benavides · Makers" + flecha "desliza y guarda".

## Estructura de vídeo nativo (plantilla)
- 0-3 s: texto en pantalla con el gancho, plano a cámara o plano de set.
- 3-15 s: contexto del proyecto o problema.
- 15-60 s: la decisión y el porqué, con B-roll propio si existe.
- Últimos 5 s: tesis en pantalla + CTA hablado.
- Subtítulos siempre, tamaño mínimo 60 px, caja opaca.
- Miniatura: primer frame con el gancho legible.

## Imagen única (plantilla)
- Cita o dato en 10-14 palabras, tipografía grande, acento en la cifra.
- Firma pequeña en esquina inferior derecha.

## Herramientas y exportación
- Carrusel e imagen: Figma o Canva → exportar PDF (calidad "impresión") o PNG.
- Vídeo: Premiere / DaVinci → 1080×1350, 25 fps, bitrate 10-15 Mbps, audio -14 LUFS.
- Nombre de archivo: `linkedin_AAAA-MM-DD_slug.[pdf|png|mp4]`.

## Prohibido
- Fotos de banco de imágenes.
- Más de un acento de color.
- Slides con más de 25 palabras.
- Logos de clientes sin autorización escrita.
- Vídeo sin subtítulos.

## Color en el panel de mando (interfaz interna, no las piezas)

Esta sección solo rige la interfaz del centro de mando. **En las piezas
publicadas sigue mandando la regla de arriba: un solo acento de color.**

Regla única: **el color señala lo que exige una acción hoy; el texto clasifica.**

### Estado de una pieza — manda el color

Es lo único accionable de un vistazo, así que se lleva el canal más visible de
la tarjeta (el filo superior) y el punto de la matriz semanal.

| Estado | Color | Refuerzo sin color |
|---|---|---|
| Retrasada | rojo `#ff2d1a` | late (animación) |
| Lista por publicar | blanco | — |
| Bloqueada por datos | ámbar | trazo discontinuo |
| Publicada | verde | opacidad al 55 % |
| Planificada / sin pieza | gris | — |

Los dos extremos van doblemente codificados: no dependen del tono.

### Pilares editoriales — solo en agregados etiquetados

El pilar de una pieza ya está decidido y va escrito en su tarjeta, así que no
gasta color ahí. Solo se colorea donde la pregunta es de reparto y hay leyenda
al lado: la dona de "Estado del sistema" y las barras de mezcla.

| Pilar | Token | Hex |
|---|---|---|
| Autoridad | `--pil-aut` | `#8ef9ff` |
| Prueba | `--pil-pru` | `#4fceff` |
| Actualidad | `--pil-act` | `#51a2f8` |
| Oferta | `--pil-ofe` | `#6e74e6` |
| Humano | `--pil-hum` | `#835cbe` |

Rampa fría monótona en luminancia, de cian pálido a violeta. Ninguno cae cerca
del rojo, el ámbar ni el verde de estado. La distinción entre ellos no descansa
en el tono sino en la luminancia (cada peldaño ~1,5× el siguiente), y el tono
solo se mueve por el eje azul-amarillo: un daltonismo rojo-verde los separa
igual. Ordenados por peso estratégico descendente, así que una desviación del
reparto se ve como una rampa rota.

Los valores viven en `daily-command-center/static/v2/estilos.css` (`:root`).
No se duplican en ningún otro fichero.
