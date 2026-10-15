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
  "url_publica": "https://www.ejemplo.com/tours/calle-mayor/",  // dirección donde se publica el recorrido. Base de los
                                        // enlaces a una vista, del QR y de los mensajes. La escribe el Estudio al publicar.
                                        // Sin ella, en el HTML autónomo abierto desde el disco no se comparten enlaces
                                        // (nunca una ruta file://).
  "portada": true,                      // false: sin portada («Empezar visita»); el recorrido se abre al terminar la carga
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
  "norte": 20,                          // rumbo de brújula (grados, horario desde el norte) de la dirección «arriba» del plano.
                                        // La flecha del norte se dibuja girada −norte. Rumbo de brújula de una dirección del plano = norte + rumbo.
                                        // Con brújula: yaw de la foto = rumbo de brújula del centro de la foto − norte.
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
  "secciones": [                        // zonas para agrupar las estancias (tira, «Estancias y plano», contacto): opcional.
                                        // `estancias` admite ids de fotos (panoramas) o de estancias del plano
    { "id": "dia", "nombre": "Zona de día", "estancias": ["salon", "cocina"] },
    { "id": "noche", "nombre": "Zona de noche", "estancias": ["dormitorio", "bano"] },
    { "id": "exterior", "nombre": "Exterior y zonas comunes", "estancias": [] }
  ],

  "audio": {                            // música del proyecto (botón de sonido en el visor; también en los vídeos)
    "musica": { "archivo": "audio/musica.mp3", "volumen": 0.4, "bucle": true, "autoplay": true,
                "titulo": "Texto", "autor": "Nombre", "licencia": "CC BY 4.0 / licencia comercial nº…" }
  },

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
visor.estado                    // { modo, nodo, rumbo, cabeceo, fov, estilo, momento, pintura, comparar, midiendo, guionActivo, planta, idioma }
visor.listo                     // true tras el evento "listo"
visor.ir(idNodo)                // Promise
visor.modo("tour" | "libre" | "maqueta")
visor.fijarEstilo(id)  visor.fijarMomento(id)
visor.fijarPintura({ paredes: "#hex" | null, suelos: "#hex" | null })
visor.comparar(true|false)      // pantalla dividida: original (izq.) vs estilo/momento/pintura actual (der.)
visor.medir(true|false)         // herramienta de medición
visor.guion.iniciar() / .parar() // visita guiada; emite 'guion:fin'
visor.vista()                   // { nodo, rumbo, cabeceo, fov } (rumbo en grados de mundo)
visor.enlaceVista()             // URL absoluta que reabre la vista actual ("" sin dirección web)
visor.idioma(cod)               // cambia idioma de la interfaz
visor.t(texto)  visor.tr(clave, vars)   // resuelve un Texto ({es,en} | cadena) / un texto de la interfaz
visor.lienzo                    // <canvas> WebGL (para grabar vídeo)
visor.capturar({ ancho = 1600, tipo = "image/jpeg", calidad = 0.88, marca = true } = {})
                                // Promise<{ blob, nodo, estancia, enlace, vista }> captura de la vista actual (sin interfaz)
                                //   estancia = { id, nombre } de la foto que se ve (el nombre del título) en el recorrido,
                                //   o de la estancia del plano en el paseo libre
visor.sonido                    // { activo, disponible, volumen, alternar(), fijarVolumen(v 0-1) }
visor.pistaAudio(true|false)    // MediaStreamTrack de la música para grabar vídeo (independiente del silencio)
visor.tiempoReal(true|false)  visor.renderizar()  visor.tamanoCaptura(w, h | null)  visor.sello()   // grabación de vídeo
visor.estanciaActual()          // { id, nombre } de la estancia (polígono) en la que está el visitante, o null
visor.ajustes({ … })            // ajustes del visitante (se guardan); devuelve los vigentes:
                                //   sensibilidad, sensibilidadTactil, invertirY, fov,
                                //   atajos (true: atajos de una letra; WCAG 2.1.4),
                                //   modoJuegoWASD (true: W A S D entra en el modo juego con ratón),
                                //   capturaConClic (false: un clic en la escena del recorrido NO captura el ratón),
                                //   reducirMovimiento: alias (fase 4), ver «Movimiento» abajo
visor.on(evento, fn) / visor.off(evento, fn)

// Fase 3 (organización del visor)
visor.estanciasPlano(abrir?)    // abre (true), cierra (false) o alterna «Estancias y plano». Devuelve si queda abierto
visor.radar(modo?)              // compatibilidad: "radar" lo muestra, "oculto" lo oculta, "plano" abre «Estancias y plano»;
                                // sin argumento alterna. Devuelve si el radar queda visible
visor.modoJuego(si?)            // entra o sale del modo juego (ratón capturado); sin argumento alterna. Necesita un gesto
                                // del usuario (clic o tecla); si el navegador no deja, se sigue mirando arrastrando
visor.giroscopio(si?)           // «Mirar moviendo el móvil»; sin argumento alterna. Promise<boolean> (activo)
visor.ayuda(si?)                // abre o cierra «Ayuda y controles»
visor.portada                   // { visible } (solo lectura)
visor.empezar({ guiada? })      // cierra la portada como «Empezar visita» ({ guiada: true } = «▶ Visita guiada»)
visor.mas.agregar({ id, texto, icono, accion, orden = 50, donde = "siempre", marcado })
visor.mas.quitar(id)            // menú «Más» (lo pinta y gestiona el núcleo: teclado, Esc y foco)
visor.mas.abrir() / .cerrar()
```

**Movimiento (fase 4): una sola fuente de verdad.** «Reducir movimiento» lo guarda `tema.js` (`cre8eight:movimiento`, común
al visor, el Estudio y la Guía) y el visor lee `cre8Tema.efectivo.movimiento`, que ya incluye `prefers-reduced-motion`; lo
aplica en el momento (transiciones entre estancias, visita guiada, desplazamientos) y en CSS con `data-movimiento` en
`<html>`. `visor.ajustes({ reducirMovimiento: true|false })` sigue funcionando como alias de
`cre8Tema.fijar("movimiento", si ? "reducido" : "auto")` y ya no se guarda en `visor:ajustes`; `visor.ajustes()` devuelve
`reducirMovimiento` según el valor efectivo. Un `reducirMovimiento: true` guardado por la fase 3 se pasa a `tema.js` una vez.
Los ajustes de apariencia (tema, talla, transparencia, movimiento) se cambian con `cre8Tema.fijar` (paneles, Ajustes).

**Vidrio adaptativo (fase 4).** El núcleo mide la luz de la vista (32×18 píxeles, tras cada cambio de estancia, estilo o
momento y como mucho una vez por segundo con la vista quieta) y pone en `<html>` `data-luz-max` (`baja` | `media`; percentil
90 de la luminancia) y `data-luz-min` (`media` | `alta`; percentil 10), con histéresis de ±0,03. `tema.css` vuelve el vidrio
más transparente cuando la foto lo permite, siempre con AA. Sin atributos (no se pudo medir, sin WebGL, «Reducir
transparencia»), el vidrio es el del peor caso.

**Menú «Más».** Lo pinta el núcleo (`#btn-mas` en la barra de vista y `#menu-mas`, `role="menu"`); los paneles solo aportan
los elementos. Sin elementos visibles, el botón no se ve. Cada elemento se pinta al abrir el menú como un `button` con
`data-id` = su `id` (p. ej. `#menu-mas [data-id="pn-compartir"]`).

| Campo | Qué es |
|---|---|
| `id` | Único. Agregar con un `id` que ya existe lo sustituye (conserva su posición) |
| `texto` | Cadena o función que la devuelve (se evalúa al abrir: así sigue al idioma). Dos elementos con el mismo texto se muestran una vez |
| `icono` | Nombre que el núcleo conoce (`compartir`, `idioma`/`globo`, `ajustes`, `guiada`/`play`, `medir`/`regla`, `pantalla`, `giroscopio`/`movil`, `plano`, `camara`, `estilo`/`pincel`, `ayuda`) o un SVG en texto (se descarta si trae scripts o manejadores) |
| `accion({ origen })` | Se llama tras cerrar el menú. `origen` es `#btn-mas`, para devolverle el foco al cerrar un diálogo |
| `orden` | Menor arriba (por defecto 50) |
| `donde` | `"siempre"`, `"movil"`, `"escritorio"` o una función. «Móvil» es la disposición móvil de los paneles: ancho ≤ 720, vertical hasta 1024 o alto ≤ 500 en horizontal |
| `marcado` | Opcional: función → booleano. El elemento pasa a `menuitemcheckbox` con su marca |

**Controles.**

- **Recorrido 360:**
  - Arrastrar mira (como Street View). Un clic o toque en una flecha del suelo, en su nombre o en el suelo va a esa estancia.
    Un clic en el vacío no hace nada (con `capturaConClic`, captura el ratón como antes de la fase 3).
  - W/↑ adelante, S/↓ atrás, A/← y D/→ a los lados (ir a la estancia de ese lado; mantener W sigue avanzando), Q/E girar,
    RePág/AvPág mirar arriba y abajo, rueda o pellizco: zoom, +/− zoom, 1–9 ir a esa estancia (sin anunciar).
- **Modo juego (ratón capturado, como en Minecraft):** se entra con **W A S D** (las letras; las flechas nunca capturan) si hay
  ratón (`pointer: fine`), los atajos están activos y `modoJuegoWASD` no es `false`; con el botón 🎮 «Modo juego» de la barra
  de vista; o, en el paseo libre, con un clic (tarjeta «Haz clic para caminar…»). Mientras dura: el ratón mira, el clic actúa
  sobre la mira (avanza hacia la flecha o la estancia que hay debajo), aviso fijo «Modo juego · Esc para salir» (se atenúa al
  40 % a los 3 s), `body.raton-capturado` y solo quedan a la vista el radar y el aviso (los paneles se ocultan: un elemento suyo
  puede volver con `visibility: visible`). Se sale con Esc; la primera salida avisa «Has salido del modo juego · W A S D o 🎮
  para volver». No existe en táctil ni con `?embed`.
- **Paseo libre:** W A S D o flechas caminar, Shift correr, Espacio saltar (con suelo) o subir (sin suelo), C bajar, Q/E girar;
  en táctil, pulgar izquierdo (joystick) para caminar y arrastrar a la derecha para mirar.
- **Teclas globales** (con los atajos activos; no con el foco en un campo de texto, un diálogo o un menú):
  **R** muestra u oculta el radar · **M** abre o cierra «Estancias y plano» · **V** cambia de modo · **H** o **?** ayuda ·
  **Esc** cierra la nota abierta o la medición. Con un diálogo abierto, su misma tecla (M o H) lo cierra.
- **Distribución del teclado:** W A S D y Q E van por su posición (`e.code`; en AZERTY son Z Q S D y A E, y los textos lo
  dicen si el navegador conoce la distribución con `navigator.keyboard.getLayoutMap`); R, M, V y H van por la letra que
  pone la tecla (con alfabetos no latinos, por su posición).

**Organización de la pantalla (contrato con los paneles, `docs/auditorias/fase3-plan.md` §3).**

| Elemento | Qué es |
|---|---|
| `#lugar` | Botón con el logo, el título y «Estancia · Planta» (o «Estancia · m²» con una sola planta). Abre «Estancias y plano» |
| `#radar` | Arriba a la izquierda, bajo `#lugar`, en todos los tamaños: `canvas#mapa` (gira con la mirada) y `#btn-ampliar`. Oculto por defecto si ninguna planta tiene imagen o muros y no hay estancias dibujadas (se puede mostrar con R o el botón); oculto en la maqueta |
| `#modos` | «Recorrido · Paseo libre · Maqueta» (radios; nombres largos en `aria-label`), solo con 2 modos o más. Arriba en el centro; abajo en vertical (hasta 1024 px). La maqueta solo existe con muros o modelo 3D |
| `#barra-vista` | Radar · Modo juego\* · Música\* · Ayuda · Pantalla completa\* · Más. Fila; columna en el teléfono en vertical. Pulsado (dorado) = función activada. En el teléfono la pantalla completa sale de la barra (la ofrecen los paneles en «Más») |
| `#galeria` | Tira de estancias (escritorio y tablet) agrupada por zonas (`secciones`) o plantas, con separador. En vertical empieza con «▶ Visita guiada». Oculta en el teléfono |
| `#estancias-plano` | `<dialog>` modal (hoja en el teléfono, ventana en escritorio, siempre por encima de todo): plano con el norte arriba y pestañas de planta, «▶ Visita guiada» y estancias con miniatura agrupadas por zonas o plantas |
| `#guion-barra` | Único control de la visita guiada en curso (pausa, n/total, progreso y ✕). Ocupa el sitio de `#modos` mientras dura |
| `#portada` | Agencia, título, precio y 3 datos, progreso real, «Empezar visita» (gesto que deja sonar la música), «▶ Visita guiada» (con 3 estancias o más) e idiomas (con 2 o más). Sin portada con `?embed`; `tour.portada: false` entra directo al terminar la carga |
| `#aviso-juego`, `#tarjeta-juego` | Aviso fijo del modo juego y tarjeta «Haz clic para caminar…» del paseo libre |
| `#precio-juego` | N-14: el precio (el de la portada), discreto bajo el radar, solo en el modo juego (los paneles se ocultan). Sin precio, oculto |
| `#estado-vista` | Bajo la barra superior: el sello legal de la imagen (`#sello-ia`) y la carga (`#carga`), apilados sin taparse |
| `#medir-barra` | Barra de vidrio de la medición, abajo en el centro (la tira se oculta mientras se mide); abajo a la izquierda en el teléfono en horizontal |
| `#paneles` | Donde montan los paneles. Publican `--reserva-inferior` (alto ocupado abajo) y `--ancho-dock` (ancho a la derecha) |

Clases de `body` que pone el núcleo: `tactil`, `embed`, `con-portada`, `ui-inactiva` (3,5 s sin interacción: se ocultan
`#lugar`, `#modos`, `#barra-vista` y `#galeria`; quedan el radar y la tarjeta), `raton-capturado`, `modo-libre`,
`modo-maqueta`, `guion-activo`, `midiendo`, `sin-webgl`, `vista-vacia` (vista previa del Estudio sin fotos: sin lienzo).
Variable `--alto-tira`: alto de la tira de estancias (0 si no se ve).

Todo lo que flota sobre la foto es vidrio de `tema.css` (`.c8-vidrio`; `--texto` si lleva texto, `--denso` en menús y
diálogos), en claro y en oscuro: HUD, nombres de las flechas, puntos «i» y su nota, subtítulos, medición, comparador,
sello, carga, rótulo de la estancia, portada y error. El radar y el plano dibujan con los tokens (`plano.js` los relee con
`cre8:tema`) y la maqueta flota sobre el fondo del tema.

Eventos (`visor.on`), también emitidos como `CustomEvent("visor:<evento>")` en `window` y enviados a
`window.dataLayer` si existe (analítica):
`listo`, `tour` (tras cada carga, también `visor:cargar`), `nodo` ({id}), `modo`, `estilo`, `momento`, `pintura`, `medida` ({metros, tipo}),
`medir` ({activo}), `comparar` ({activo}), `contacto` ({canal}), `guion:inicio`, `guion:paso` ({paso, nodo, texto}), `guion:pausa`,
`guion:fin`, `idioma`, `sonido` ({activo, volumen}; al silenciar/activar, al cambiar el volumen y con `disponible: false` si la
música no se puede cargar), `modojuego` ({activo}), `giroscopio` ({activo}), `empezar` ({guiada, automatica}: al cerrar la
portada; `automatica` con `tour.portada: false`).

## 3. Mensajes `postMessage` (Estudio ↔ visor en `<iframe src="index.html?embed">`)

Estudio → visor:
- `{ tipo: "visor:cargar", tour }`: carga un tour (las imágenes pueden ser URLs `blob:` del mismo origen)
- `{ tipo: "visor:ir", nodo }`
- `{ tipo: "visor:yaw", nodo, yaw }`: cambia el yaw de un nodo en caliente

Visor → Estudio (`window.parent`):
- `{ tipo: "visor:listo" }`
- `{ tipo: "visor:vista", nodo, rumbo, cabeceo, fov, yawLocal, pitchLocal }` (rumbo/cabeceo de mundo; yawLocal/pitchLocal
  relativos a la imagen, para colocar `puntos`). No se envía mientras se va a otra estancia (llega al terminar el viaje)
- `{ tipo: "visor:clic", nodo, yawLocal, pitchLocal }`

## 4. Tour embebido (archivo HTML autónomo)
Si existe `window.TOUR_EMBEBIDO` (objeto tour con imágenes en `data:`), el visor lo usa en lugar de `fetch(tour.json)`.

## 5. Exportación pública vs copia de seguridad
`exportarZIP(tour, archivos)` y `exportarHTMLAutonomo()` publican solo lo público (`soloPublico()`): sin `documentacion`
con `publico: false`, sin la carpeta `estudio/` ni claves internas `_*`. La copia de seguridad del proyecto usa
`exportarZIP(tour, archivos, { copiaSeguridad: true })`.

## 6. Datos internos del Estudio (`_estudio`, nunca se publican)
El Estudio guarda en `tour._estudio` lo que necesita para trabajar; `soloPublico()` lo quita al exportar.

| Campo | Para qué |
|---|---|
| `meta` | Datos técnicos de cada foto (`panos/<id>.jpg` → ancho, alto, archivo, bytes, brújula…) |
| `manuales` · `quitados` | Conexiones entre fotos añadidas o quitadas a mano (`"idA\|idB"`) |
| `calibrado` | Plantas con la escala del plano calibrada |
| `norteFijado` | El norte del plano se fijó a mano |
| `musicaLicencia` | Casilla «Tengo licencia para usar esta música…»; «Antes de publicar» avisa si falta |
| `ref` | Referencia automática (`C8-XXXXX`), solo en proyectos nuevos sin fotos |
| `perfil` | `true`: el contacto viene de «Mi inmobiliaria»; `false`: el inmueble tiene contacto propio y el perfil no lo pisa |
| `firmasPerfil` | Huellas del logo y de la foto del perfil ya copiados (`marca/logo.*`, `marca/agente.*`), para no reescribirlos |
| `nocheSimulada` | «Ofrecer vista de noche simulada» sin foto real de noche |
| `estiloTodo` | «Mostrar todo» en Estilo y luz (si no, solo lo que corresponde a `estado_obra`) |
| `sinZonas` | «No usar zonas»: no se proponen `secciones` automáticas |
| `nombresGuia` | Nombres de estancias de la lista que llegó de la Guía y aún no tienen foto |

- **Zonas automáticas:** si no hay `secciones` ni `sinZonas`, el Estudio las propone y las publica cuando salen dos o más y hay una sola planta.
- **Anclas:** `estudio.html#fotos`, `#plano`, `#datos`, `#publicar` (alias `#revisar` y `#exportar`), `#orientacion`, `#estilo` y `#extras`. Las antiguas `#orientar`, `#variantes` y `#material` siguen funcionando. La Guía abre `estudio.html#fotos&estancias=…&tomas=…`.
- **Proyectos antiguos:** se borra `_estudio.modo` (ya no hay modos Rápido y Completo) y el paso guardado `revisar` o `exportar` pasa a `publicar`.
