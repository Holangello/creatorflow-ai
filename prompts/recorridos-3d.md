# Prompts: recorridos 3D inmobiliarios

Prompts para acompañar el flujo de [`docs/recorridos-3d-inmobiliaria.md`](../docs/recorridos-3d-inmobiliaria.md).

## 1. Generar el `tour.json` a partir del plano (Claude u otro LLM con visión)

```
Eres un asistente de producción de tours virtuales. Te adjunto el plano de la vivienda (escala: el ancho total
mide {ANCHO} m) y la lista de fotos 360 tomadas con un DJI Osmo 360 a 1,5 m de altura:
{LISTA: nombre_archivo → estancia y punto aproximado donde se tomó}

Devuelve SOLO un JSON válido con este formato:
{"titulo": "...", "altura_camara": 1.5, "plano": {"imagen": "plano.png", "ancho_m": N, "alto_m": N},
 "inicio": "id", "panoramas": [{"id": "...", "nombre": "...", "imagen": "panos/ID.jpg",
 "imagen_movil": "panos/movil/ID.jpg", "miniatura": "panos/mini/ID.jpg", "x": N, "z": N, "yaw": 0,
 "enlaces": ["..."]}]}

Reglas: x crece hacia la derecha del plano y z hacia abajo, en metros, desde la esquina superior izquierda.
Enlaza solo estancias conectadas por una puerta o un paso abierto, nunca a través de un muro. Usa ids en
minúsculas, sin tildes y con guiones.
```

## 2. Puntos de información (`puntos`) para cada estancia

```
Para la estancia "{ESTANCIA}" de este inmueble ({DATOS: superficie, calidades, orientación, reforma, año}),
redacta de 2 a 4 puntos de interés para un tour 360. Para cada uno: "titulo" (máx. 5 palabras) y "texto"
(máx. 160 caracteres, tono profesional, sin exagerar, sin datos que no te haya dado). Devuélvelo como un array
JSON de objetos {"titulo","texto","yaw":0,"pitch":0}. Luego ajustaré yaw y pitch con el editor.
```

## 3. Home staging virtual / mundo 3D con IA (World Labs Marble u otro generador)

Usa como entrada la foto 360 de la estancia vacía:

```
Panorama 360 del mismo salón, conservando exactamente la arquitectura: paredes, ventanas, puertas, suelo,
techo y proporciones. Amueblado en estilo {nórdico / mediterráneo contemporáneo / industrial}: sofá de 3 plazas
en lino {color} frente a la ventana, alfombra de yute, mesa de centro de roble, estantería baja, plantas de
interior, iluminación cálida de 2700 K y luz natural de tarde entrando por la ventana. Fotorrealista, sin
personas, sin texto ni logotipos, sin cambiar las vistas exteriores.
```

Variante para obra nueva desde un render en blanco:

```
Vivienda de obra nueva, cocina abierta al salón, suelo de porcelánico gran formato gris claro, carpintería
negra, techos de 2,70 m, armarios lacados blancos sin tiradores, encimera de cuarzo blanco, iluminación lineal
empotrada. Estilo fotografía de arquitectura, luz diurna suave, render tipo Corona Renderer, nitidez alta.
```

> Rotula siempre el resultado como "Recreación virtual orientativa" en el anuncio.

## 4. Texto del anuncio con el tour

```
Escribe la descripción para idealista de este inmueble ({DATOS}). Máximo 900 caracteres, en español, con
párrafos cortos. Menciona al final que dispone de visita virtual 360 y de recorrido 3D interactivo en
{URL_WEB}. No uses mayúsculas sostenidas ni emojis. Añade una versión en inglés de 600 caracteres.
```
