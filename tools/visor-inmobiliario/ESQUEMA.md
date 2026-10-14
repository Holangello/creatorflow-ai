# Contrato técnico de cre8eight (v2)

**cre8eight** es el nombre del software: visor 3D (index.html), Estudio de creación (estudio.html) y exportadores.

Este documento es la fuente de verdad compartida por el visor (`visor.js`), los paneles de interfaz (`paneles.js`),
el Estudio de creación (`estudio.html`) y los exportadores (`exportar.js`).

## 1. `tour.json` (versión 2)

Todos los campos son opcionales salvo `panoramas[].id`, `x`, `z` e `imagen` (o `textura` en la demo).
Coordenadas en **metros** sobre el plano: `x` → derecha, `z` → abajo. Ángulos en **grados**; rumbo 0 = arriba del plano,
positivo en sentido horario. Los textos pueden ser `"cadena"` o `{ "es": "...", "en": "..." }` (tipo **Texto**).

```jsonc
{
  "version": 2,
  "titulo": "Texto",
  "idioma": "es",                       // idioma por defecto
  "idiomas": ["es", "en"],              // idiomas ofrecidos en la interfaz

  "marca": {
    "nombre": "Inmobiliaria Ejemplo",
    "logo": "marca/logo.svg",
    "color": "#c8a24a",                 // color de acento (botones, flechas, plano)
    "web": "https://www.ejemplo.com",
    "pie_legal": "Texto"                // p. ej. nº de registro de agente (AICAT…)
  },
  "agente": { "nombre": "Ana Pérez", "telefono": "+34 600 111 222", "email": "ana@ejemplo.com", "foto": "marca/ana.jpg" },
  "contacto": {
    "modo": "whatsapp",                 // "whatsapp" (abre wa.me con el mensaje) | "webhook" (POST JSON) | "ambos"
    "whatsapp": "34600111222",          // número de la empresa en formato internacional sin '+'
    "webhook": "https://hook.eu1.make.com/xxxx",   // recibe {nombre, telefono, pregunta, referencia, estancia, estancia_id, url, fecha, idioma}
    "webhook_formato": "multipart",     // "multipart" (por defecto; con fotos foto_1..n) | "json" (fotos en base64). El servidor debe permitir CORS
    "url_privacidad": "https://www.ejemplo.com/privacidad",
    "texto_privacidad": "Texto"
  },

  "inmueble": {
    "referencia": "REF-1234",
    "operacion": "venta",               // "venta" | "alquiler"
    "tipo": "piso",                     // piso | casa | chalet | atico | duplex | estudio | local | oficina | terreno | …
    "estado_obra": "construido",        // "construido" | "proyecto" (obra nueva / terreno con proyecto)
    "precio": 349000, "moneda": "EUR",
    "gastos_comunidad_mes": 85, "ibi_anual": 420,
    "superficie_construida": 112, "superficie_util": 96, "superficie_parcela": null,
    "habitaciones": 3, "banos": 2, "planta": "3ª", "ascensor": true,
    "orientacion": "Sur", "ano_construccion": 1998, "estado": "Reformado",
    "calefaccion": "Aerotermia", "aire_acondicionado": true,
    "garaje": true, "trastero": false, "terraza": 8, "piscina": false, "jardin": false,
    "certificado_energetico": {
      "consumo_letra": "C", "consumo_valor": 95.3,     // kWh/m²·año
      "emisiones_letra": "C", "emisiones_valor": 20.1, // kg CO₂/m²·año
      "en_tramite": false
    },
    "caracteristicas": ["Texto", "…"],
    "descripcion": "Texto",
    "direccion": "Calle Mayor 12, Madrid",
    "mostrar_direccion_exacta": false,
    "ubicacion": { "lat": 40.4168, "lng": -3.7038 },
    "documentos": [{ "nombre": "Memoria de calidades", "url": "docs/memoria.pdf" }],
    "aviso_legal": "Texto"              // p. ej. "Imágenes de estilos generadas con IA, orientativas"
  },

  "altura_camara": 1.5,
  "radio_enlace_auto": 4.5,
  "inicio": "salon",

  "plantas": [                          // si falta: una única planta con `plano`/`muros` de nivel superior (v1)
    { "id": "p0", "nombre": "Texto",
      "plano": { "imagen": "plano.png", "ancho_m": 11.5, "alto_m": 8.2, "origen": [0, 0] },
      "muros": [[0, 0, 10, 0]] }
  ],
  "estancias": [                        // polígonos para áreas (m²) y etiquetas en el plano
    { "id": "salon", "nombre": "Texto", "planta": "p0", "poligono": [[0,0],[6,0],[6,5],[0,5]], "altura_techo": 2.6 }
  ],

  "estilos": [                          // selector de estilos (proyectos): 'original' = imagen base
    { "id": "original", "nombre": "Texto" },
    { "id": "nordico", "nombre": "Texto" }
  ],
  "momentos": ["dia", "atardecer", "noche"],
  "personalizacion": {                  // cambio de colores (viviendas construidas; necesita `mascara`)
    "paredes": [{ "nombre": "Texto", "color": "#efe9df" }],
    "suelos":  [{ "nombre": "Texto", "color": "#8a6a4a" }]
  },

  "panoramas": [
    {
      "id": "salon", "nombre": "Texto", "planta": "p0",
      "imagen": "panos/salon.jpg", "imagen_movil": "panos/movil/salon.jpg", "miniatura": "panos/mini/salon.jpg",
      "x": 3, "z": 2.5, "yaw": 0, "rumbo_inicial": 110, "altura_camara": 1.5,
      "origen": "foto",                   // "foto" (por defecto) | "render" (render 360 de arquitecto/renderista) | "ia"
      "enlaces": ["cocina"],
      "puntos": [{ "yaw": -90, "pitch": 5, "titulo": "Texto", "texto": "Texto", "imagen": "fotos/x.jpg", "video": "https://…", "enlace": "https://…" }],
      "variantes": [                    // imágenes alternativas del mismo punto (misma orientación/encuadre)
        { "estilo": "nordico", "momento": "dia", "imagen": "panos/salon-nordico.jpg", "imagen_movil": "…" },
        { "momento": "noche", "imagen": "panos/salon-noche.jpg", "origen": "foto" },   // origen: "foto" | "render" | "ia"
        { "estilo": "industrial", "imagen": "panos/salon-industrial.jpg", "mascara": "panos/mascaras/salon-industrial.png" }
      ],
      "mascara": "panos/mascaras/salon.png"   // equirectangular; canal R = paredes, G = suelo (blanco = superficie)
    }
  ],

  "galeria": [                          // renders y fotos fijas (p. ej. renders de Corona/V-Ray/Lumion del arquitecto)
    { "imagen": "renders/salon-noche.jpg", "titulo": "Texto", "estancia": "salon", "tipo": "render" | "foto" | "plano",
      "autor": "Estudio de arquitectura X" }
  ],
  "documentacion": [                    // material de origen adjuntado en el Estudio (no se muestra salvo `publico: true`)
    { "nombre": "Plano de planta (arquitecto)", "archivo": "docs/plano.pdf", "tipo": "plano" | "render" | "modelo" | "memoria" | "otro", "publico": false }
  ],
  "secciones": [                        // categorías para agrupar estancias (contacto, galería): opcional
    { "id": "dia", "nombre": "Zona de día", "estancias": ["salon", "cocina"] },
    { "id": "noche", "nombre": "Zona de noche", "estancias": ["dormitorio", "bano"] },
    { "id": "exterior", "nombre": "Exterior y zonas comunes", "estancias": [] }
  ],

  "guion": [                            // visita guiada / vídeo. Si falta, se recorren los panoramas en orden.
    { "nodo": "salon", "rumbo": 110, "segundos": 6, "texto": "Texto" }
  ],

  "libre": { "tipo": "splat", "url": "escena.sog", "rotacion": [180, 0, 0], "posicion": [0, 0, 0], "escala": 1,
             "colisionador": "colisionador.glb", "inicio": [3, 2.5, 90], "limites": [0, 0, 10, 8] }
}
```

### Resolución de variantes
Estado global `{ estilo, momento }` (por defecto `original` / `dia`). Para cada panorama se elige, por orden:
1. variante con `estilo` y `momento` iguales;
2. variante con el mismo `estilo` y sin `momento` (o `dia`) → si el momento pedido es noche/atardecer se aplica **simulación**;
3. variante sin `estilo` (o `original`) con el `momento` pedido;
4. imagen base (+ simulación de momento si no es `dia`).

Máscara de pintura: la variante usa su propia `mascara` si la trae; si no la trae y cambia de estilo (otro mobiliario),
la pintura se desactiva en esa vista (`visor.estado.pinturaDisponible = false`); las variantes solo de momento reutilizan
la máscara base (mismo encuadre y mismos muebles).

`origen` (por defecto "ia" en variantes de estilo y "foto" en las de solo momento) muestra un sello legal en el visor
("Recreación virtual · IA", "Render / infografía" o "Iluminación simulada") y se incrusta en capturas y vídeos.

Si `estilo` no está disponible en un panorama, se muestra la base y el panel avisa ("estilo no disponible en esta estancia").

## 2. API JavaScript del visor (`window.visor`)

```js
visor.tour                      // objeto tour normalizado
visor.estado                    // { modo, nodo, rumbo, cabeceo, fov, estilo, momento, pintura, comparar, planta, idioma }
visor.ir(idNodo)                // Promise
visor.modo("tour" | "libre" | "maqueta")
visor.fijarEstilo(id)  visor.fijarMomento(id)
visor.fijarPintura({ paredes: "#hex" | null, suelos: "#hex" | null })
visor.comparar(true|false)      // pantalla dividida: original (izq.) vs estilo/momento/pintura actual (der.)
visor.medir(true|false)         // herramienta de medición
visor.guion.iniciar() / .parar() // visita guiada; emite 'guion:fin'
visor.vista()                   // { nodo, rumbo, cabeceo, fov } (rumbo en grados de mundo)
visor.enlaceVista()             // URL absoluta que reabre la vista actual
visor.idioma(cod)               // cambia idioma de la interfaz
visor.t(texto)                  // resuelve un Texto ({es,en} | cadena) al idioma actual
visor.lienzo                    // <canvas> WebGL (para grabar vídeo)
visor.capturar({ ancho = 1600, tipo = "image/jpeg", calidad = 0.85 } = {})
                                // Promise<{ blob, nodo, estancia, enlace, vista }> captura de la vista actual (sin interfaz)
visor.radar(modo)               // "radar" (gira con la vista, centrado) | "plano" (norte arriba) | "oculto"
visor.estanciaActual()          // { id, nombre } de la estancia (polígono) en la que está el visitante, o null
visor.on(evento, fn) / visor.off(evento, fn)
```

Controles (estilo Minecraft): clic en el lienzo (escritorio) captura el ratón; el ratón mira (sin arrastrar); W/↑ adelante,
S/↓ atrás, A/← y D/→ lateral (en el recorrido 360: ir a la estancia de ese lado), Q/E girar, Espacio saltar (modo libre
con suelo) o subir (sin suelo), C bajar, Shift correr, Esc soltar el ratón. En el recorrido 360 con el ratón capturado,
el clic avanza hacia la flecha o la estancia que hay bajo la mira.

Eventos (`visor.on`), también emitidos como `CustomEvent("visor:<evento>")` en `window` y enviados a
`window.dataLayer` si existe (analítica):
`listo`, `tour` (tras cada carga, también `visor:cargar`), `nodo` ({id}), `modo`, `estilo`, `momento`, `pintura`, `medida` ({metros, tipo}), `contacto` ({canal}),
`guion:inicio`, `guion:fin`, `idioma`.

## 3. Mensajes `postMessage` (Estudio ↔ visor en `<iframe src="index.html?embed">`)

Estudio → visor:
- `{ tipo: "visor:cargar", tour }`: carga un tour (las imágenes pueden ser URLs `blob:` del mismo origen)
- `{ tipo: "visor:ir", nodo }`
- `{ tipo: "visor:yaw", nodo, yaw }`: cambia el yaw de un nodo en caliente

Visor → Estudio (`window.parent`):
- `{ tipo: "visor:listo" }`
- `{ tipo: "visor:vista", nodo, rumbo, cabeceo, fov, yawLocal, pitchLocal }` (rumbo/cabeceo de mundo; yawLocal/pitchLocal
  relativos a la imagen, para colocar `puntos`)
- `{ tipo: "visor:clic", nodo, yawLocal, pitchLocal }`

## 4. Tour embebido (archivo HTML autónomo)
Si existe `window.TOUR_EMBEBIDO` (objeto tour con imágenes en `data:`), el visor lo usa en lugar de `fetch(tour.json)`.

## 5. Exportación pública vs copia de seguridad
`exportarZIP(tour, archivos)` y `exportarHTMLAutonomo()` publican solo lo público (`soloPublico()`): sin `documentacion`
con `publico: false`, sin la carpeta `estudio/` ni claves internas `_*`. La copia de seguridad del proyecto usa
`exportarZIP(tour, archivos, { copiaSeguridad: true })`.
