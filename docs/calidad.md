# cre8eight · Calidad, pruebas y planes de contingencia

El cliente lo pidió así: un software bien hecho, probado y ligero, con todo lo esencial, sin descuidar la calidad y con pruebas y planes de contingencia para cualquier fallo.

## Regla al cerrar cada apartado o fase

1. **Compactar.** Quitar lo que no suma: código muerto, opciones duplicadas, dependencias y textos sobrantes. Medir el peso (JS/CSS de carga inicial y tiempo hasta `visor.listo`) y no dejarlo crecer sin motivo.
2. **Probar.**
   - `npm run prueba` debe salir en verde, igual que las pruebas de extremo a extremo.
   - Si cambia la interfaz, se revisa la matriz de capturas en claro y oscuro, S/M/L y las pantallas de 360 px a 4K.
   - Un fallo real se arregla. Nunca se borra la prueba.
3. **Contingencia.** Toda función nueva trae su plan B en la tabla de abajo: qué pasa si el navegador, la red o el archivo fallan.
4. **Enseñar las decisiones de diseño al cliente** en la página «Decisiones de diseño cre8eight» (https://claude.ai/artifact/LfohhX4VRP6Gwa2zy96PUc).
   - Sus elecciones se guardan en la base de datos de esa página: colección `elecciones`, documento `actual`.
   - Las leo al retomar con `ArtifactData get`.

## Pruebas

| Comando | Qué cubre |
|---|---|
| `npm run prueba` | Humo: el visor carga la demo; navegación, estilo, noche, modo libre, maqueta, música y captura; móvil, Estudio, Asistente y el tema (claro + talla L) |
| `npm run prueba:e2e` · `npm run prueba:todo` | Extremo a extremo, 489 comprobaciones en unos 11 min (cierre de la fase 4): Estudio (160), paneles y núcleo real (245: atajos, zoom sin gestos, hojas modales, foco…), exportación (50: ZIP con three.js dentro y el CDN caído, HTML autónomo sin red, GPano, plano, dossier, vídeo) y seguridad (34: tour hostil, escapes, sin `file://`). Se elige con `node pruebas/e2e.mjs estudio seguridad`; el detalle está en `pruebas/LEEME.md`. Lo que depende de una interfaz en obras sale como «pendiente» en vez de fallar (al cerrar la fase 3, ninguno) |
| `node pruebas/capturas.mjs` | Matriz visual: páginas × claro/oscuro × S/M/L × de 360×640 a 3840×2160 y 3440×1440, con hoja de contactos |
| `npm run contraste` | Contraste WCAG de los pares de tokens de `tema.css` en claro y oscuro: texto 4,5:1, foco e iconos 3:1, el vidrio sobre el peor fondo de la foto (blanco y negro puros) y seis colores de marca típicos (rojo, azul marino, verde, amarillo, negro y blanco). Entra en `npm run prueba:todo` |
| `npm run medir` | Métricas para compactar, en el teléfono y el portátil: JS propio y de dependencias, CSS y fuentes hasta `visor.listo`; tiempo hasta `listo`; controles visibles y % de pantalla tapada, con la interfaz despierta y en reposo. Falla si en el teléfono la interfaz en reposo tapa más del 15 %. Los tiempos dependen de la máquina: se comparan en la misma. En este contenedor las fuentes dan 0 KB porque Inter ya está instalada en el sistema |
| Auditorías por fase | QA, UX/UI, Maverick, esencialista, organización, visual y accesibilidad WCAG 2.1 AA (`docs/auditorias/`). Al cerrar la fase 4: `npm run medir` da 9,8 % de pantalla tapada en reposo en el teléfono y 3,3 % en el portátil; con el vidrio neutro y las marcas del suelo de cristal, 6,4 % y 3,3 % |

## Planes de contingencia (si falla… → entonces…)

### Visor

| Si falla… | Entonces… |
|---|---|
| El dispositivo no tiene WebGL | Se avisa y se muestra la galería de fotos; la ficha y el contacto siguen funcionando |
| Se pierde el contexto gráfico (GPU) | Aviso con «Reintentar» (recarga) |
| `tour.json` no existe o está mal | Pantalla de error con la marca; nunca se muestra la demo por error |
| Una foto 360 no carga | Aviso con «Reintentar»; si era un estilo o un momento, se vuelve al anterior para que lo que se ve coincida con lo elegido |
| Poca memoria gráfica (móviles) | Caché de texturas limitada (4 en táctil, 8 en escritorio) y versiones de 4096 px para móvil |
| La música no carga o el formato no es compatible | El botón de sonido desaparece y el recorrido sigue; se reintenta si el tour se recarga |
| Las fotos no traen fecha ni GPS (barra del sol) | La barra usa el día de hoy y la ubicación del inmueble (o Madrid); el agente puede indicar la fecha y la hora en «Estilo y luz → Luz». Sin desfase horario en el EXIF, el del dispositivo del Estudio en esa fecha |
| La estancia de una foto no tiene polígono | El sol no puede «entrar» por las ventanas: al mover la barra solo cambia el tono (cálido o de noche) |
| El móvil va justo al arrastrar la barra en la demo | Mientras se arrastra, el panorama se renderiza con un cubo cuatro veces más pequeño y como mucho una vez por fotograma; al soltar, con toda la calidad. Las animaciones van por reloj: duran lo mismo con pocos fotogramas |
| El navegador bloquea el sonido automático | La música empieza con «Empezar visita» de la portada, o con el primer toque o clic si no hay portada |
| No se puede capturar el ratón (modo juego) | Se mira arrastrando |
| El navegador no tiene `<dialog>` | «Estancias y plano» y «Ayuda» se abren con el atributo `open` |
| Falla la descarga con progreso de la portada | La foto se carga de la forma normal |
| `tour.json` falla con la portada delante | Queda la pantalla de error, sin capas inertes encima |
| El tour no tiene plano | El radar empieza oculto y se puede mostrar con R o con su botón |
| Un toque cuando la interfaz está oculta | Solo la despierta: nunca navega por sorpresa |
| Un icono SVG con scripts en el menú «Más» | Se descarta |
| Recorrido incrustado en una web de otro dominio | El visor no le envía mensajes (ni errores en su consola) |
| Suena la música con la interfaz en reposo | Ondas quietas: nada se anima sin fin sobre el vidrio |
| El navegador no tiene `:has()` | La pista se va sola a los 6 s y el lienzo conserva un marco de foco simple |
| Letra al 200 % o talla L sin sitio arriba | Los modos bajan junto a la tarjeta |
| Se gira el teléfono en la maqueta | Se vuelve a encuadrar mientras el visitante no la haya movido |
| Desaparece la etiqueta 3D que tenía el foco | El foco pasa al lienzo y la estancia se anuncia |
| Aparece un diálogo o el menú «Más» | El vidrio adaptativo vuelve a medir |
| Gráfica integrada con poca memoria | Caché de texturas de 8 en escritorio (antes 14) |
| Un nombre de agencia sin espacios | Se parte en la portada |
| El navegador no admite `inert` (hojas del teléfono) | La hoja sigue siendo modal y con velo; el Tab podría llegar a lo de detrás, sin errores |
| Se cierra la hoja, cambia la disposición o llega otro tour | No queda nada inerte |
| El lector de pantalla no anuncia una región recién creada | La confirmación del contacto recibe el foco y se lee |
| No da tiempo a «Deshacer» | El aviso espera mientras tiene el foco o el puntero encima; la foto también se quita con ✕ |
| La interfaz entra en reposo con un lector de pantalla | Los botones de la tarjeta siguen en el árbol de accesibilidad y vuelven con el foco |
| Un nombre no cabe (idioma, talla L, espaciado aumentado) | Pasa a dos líneas o se parte, también sin diccionario de guiones |
| El visitante desactiva los atajos de una letra (WCAG 2.1.4) | Las letras solo actúan con el foco en el lienzo o en el modo juego; el interruptor está también en táctil |
| El visitante no puede pellizcar (un dedo, puntero de cabeza) | «Acercar» y «Alejar» en «Más» (recorrido y maqueta); la maqueta gira con las flechas y se acerca con + y − |
| El recorrido no tiene WhatsApp, CRM ni email | No se ofrecen «Contactar» ni «Foto de la vista»: nunca una confirmación de algo que no llega a nadie |
| three.js no llega (CDN caído, red de empresa o filtro) | El ZIP publicado lleva three.js dentro. Donde se usa el CDN, la portada dice «No se ha podido cargar el recorrido» con «Reintentar» y el WhatsApp de la agencia; si solo tarda más de 30 s, lo avisa |
| Teclado AZERTY | W A S D y Q E van por posición física; R, M, H y V por la letra. Los textos muestran las letras reales en Chromium; en Firefox y Safari dicen W A S D |
| El vidrio adaptativo no puede medir la foto (lectura fallida, contexto gráfico perdido, foto sin CORS, sin WebGL) | Se quitan `--vidrio-a` y `data-vidrio-aspecto` de cada pieza: queda el vidrio del peor caso, que siempre cumple AA |
| Se arrastra la hoja del teléfono y su alto cambia a cada paso | El ResizeObserver de los paneles no la recoloca hasta soltarla: antes deshacía el arrastre (fallaba según el ritmo de los eventos) |
| Una foto muy cálida o muy saturada detrás del vidrio | El vidrio no la exagera: saturación natural, contraste reducido por el esmerilado y tinte neutro |
| Un navegador esmerilara en otro espacio de color (no sRGB) | `npm run contraste` mide en Chromium el gris que deja el `backdrop-filter` y lo compara con el cálculo (±2): si cambiara, la prueba falla antes de publicar |
| «Reducir transparencia», paseo libre o maqueta | No se mide la luz (vidrio opaco o del peor caso) |
| Un cambio de escena no avisa al pintado bajo demanda (`tocarEscena()`) | Se ve al mover la vista. La grabación, las transiciones, la visita guiada, la medición y el comparador fuerzan el pintado |
| Falla la precompilación de shaders tras la portada | Se compilan al pintar, como antes (un tirón al empezar) |
| No carga `tema.js` | El movimiento sigue a `prefers-reduced-motion` |
| El lienzo del plano no entiende un token de color | Usa un color oscuro de reserva para ese token |
| Paseo libre en el teléfono | Los modos y el aviso suben por encima de la píldora de los paneles |
| No hay almacenamiento local (modo privado) | Se usan los valores por defecto |
| El portapapeles no copia imágenes (Firefox), lo rechaza o no responde en 5 s | «Copiar la foto otra vez» o «Descargar fotos», y se indica adjuntarlas con el clip de WhatsApp |
| Falla el webhook del CRM o lo bloquea CORS | Aviso honesto con «Reintentar»; WhatsApp sigue siendo el canal principal |
| La agencia no tiene WhatsApp | El contacto va por el CRM o por email |
| El recorrido no tiene dirección web | El mensaje va sin enlace y sin líneas vacías; Compartir lo explica y no genera QR |
| No carga el generador de QR | El QR se oculta con un aviso; el enlace sigue funcionando |
| El núcleo no ofrece `visor.mas` o `visor.ajustes` | Los paneles ponen su propio «Más» (accesible con teclado) y guardan los ajustes en local |
| No carga `tema.css` | Los paneles usan sus valores de reserva y se leen bien |
| No carga `tema.js` | Ajustes no ofrece Apariencia, Tamaño ni Transparencia; «Reducir movimiento» va al núcleo (`visor.ajustes`) y los paneles dejan de animarse |
| La apariencia cambia en otra pestaña, por `?tema=` / `?talla=` o por el sistema | Ajustes lo refleja en vivo sin repintarse; la hoja y los diálogos se recolocan con la talla nueva |
| Con la talla L la fila de la tarjeta no cabe | Los botones pasan juntos a una segunda fila; el precio y los datos nunca se cortan |
| Un aviso coincide con un diálogo abierto | Sube encima de la hoja (móvil) o se coloca en la escena libre, a la izquierda del diálogo |
| La tira de estancias cambia de tamaño | La barra de captura se vuelve a colocar encima |
| No hay `:has()` | El QR sale sobre el relleno del panel (el SVG ya trae su fondo blanco) |
| Una animación de icono no llega a correr | El reposo de cada icono es el dibujo entero (`tema.css` y paneles) |
| Movimiento reducido | Nada se anima ni espera su turno |
| Enlaces o HTML maliciosos en un tour | Solo se admiten `http(s)`, `mailto` y `tel`; los textos se muestran como texto |
| Dos navegaciones a la vez | Fichas de petición: gana la última y nunca queda un estado mezclado |

### Estudio

| Si falla… | Entonces… |
|---|---|
| IndexedDB está llena o bloqueada | El estado pasa a «Sin guardar», con aviso para descargar la copia de seguridad; se reintenta en el siguiente guardado |
| La foto no es 2:1 o está recortada | Aviso en lenguaje llano y ajuste sin deformar |
| El PDF o DXF del plano no se puede leer | Mensaje claro; se puede seguir sin plano (las fotos se conectan en orden) |
| La URL no es válida | Se rechaza al escribirla y al exportar; Revisar la señala |
| Falta el visor compilado para el HTML autónomo | Error claro: «ejecuta npm run build» |
| Hay documentos privados | Nunca salen en el ZIP para la web ni en el HTML autónomo, solo en la copia de seguridad |
| Se publica sin WhatsApp ni CRM | El ZIP y el archivo único piden confirmación: el recorrido no tendrá «Contactar» |
| No hay almacenamiento local para «Mi inmobiliaria» | El perfil se aplica solo a este proyecto y se avisa |
| El perfil está incompleto | Nunca pisa los datos propios de un proyecto |
| El enlace de la Guía viene mal formado | Se ignora lo raro sin romper nada |
| La lista de la Guía ya se usó o se descartó | No se vuelve a ofrecer |
| La vista previa no responde en 12 s | Se ofrece «Recargar la vista previa» |
| Llega una recarga mientras la vista previa cambia de estancia | Se espera a que el visor confirme la estancia |
| La inmobiliaria no tiene web ni dirección final | No se escribe `url_publica` ni hay QR de ejemplo; «Descargar QR» queda desactivado |
| La dirección final no es https o no termina en / | Se rechaza con un aviso y no se guarda; el enlace y el QR siguen con la anterior |
| Se vacía la dirección final | Vuelve la de por defecto (web + /tours/<referencia>/) |
| Se importa un tour.json ya publicado | Conserva su `url_publica`: los QR impresos siguen valiendo |
| `exportar.js` no ha cargado al pintar Publicar | El código para incrustar sale de una copia local con los mismos permisos |
| Cajón de la vista previa cerrado (pantalla estrecha) | Oculto para el tabulador y el lector; al grabar vídeo se muestra a pantalla completa |
| Letra al doble o zoom del 200 % | La barra superior se recoge como en una pantalla estrecha; el aviso del móvil solo sale en táctil |
| No hay `color-mix()` (letras del certificado) | Las letras sin elegir quedan sin tinte, con el texto a contraste pleno |
| No carga `exportar.js` | La copia de seguridad sigue disponible |
| No carga `tema.js` | El Estudio queda en el oscuro por defecto de `tema.css`; «Apariencia» lo avisa en vez de abrir el menú |
| Un color del tema no se puede leer en un lienzo | Gris neutro de reserva; al cambiar de tema se vuelve a leer y se repinta |
| Se cierra la pestaña mientras se importan fotos | El navegador pide confirmación (solo entonces) |
| Proyecto o perfil con el antiguo `#c8a24a` | Se lee como «sin color»: champán del tema. Cualquier otro color se respeta |
| Se renombra en español un texto con traducciones automáticas | Se borran solo esas; las escritas a mano se conservan (el visor muestra el español mientras falten) |
| Cambia el pie legal o la privacidad en Mi inmobiliaria | Sus traducciones guardadas se vacían |
| Columna de trabajo estrecha (iPad, 1024 px con talla L, móvil) | Fotos y paradas pasan a dos líneas (`@container`); sin consultas de contenedor, se desplaza el área de trabajo |
| Chromium no repinta entero el lienzo del plano al cambiar de tema | El lienzo tiene capa propia (`will-change`) |

### Exportación

| Si falla… | Entonces… |
|---|---|
| La foto pesa más de 8 MB (límite de idealista) | Se recomprime a 7,5 MB como máximo |
| MediaRecorder no admite MP4 | Se graba en WebM con la duración corregida |
| Se cancela una grabación | Se detiene de verdad y se restaura el visor |
| El tour de la demo contiene texturas 3D | La copia del tour las descarta antes de serializar (antes agotaba la memoria) |
| No se puede traer three.js al crear el ZIP | El `index.html` del ZIP se queda con el CDN y se avisa al descargar |
| El recorrido se sube a otra dirección distinta de la del Estudio | El LEEME.txt del ZIP lo advierte: hay que cambiarla en el Estudio y volver a descargar (el enlace y el QR la llevan dentro) |
| El proyecto no tiene datos del certificado energético | El dossier no dice nada de él (nunca un «en trámite» falso); «Antes de publicar» lo marca como error |
| No carga la fuente Inter al exportar el plano o el vídeo | Se dibuja con la fuente del sistema de la pila `--fuente` |
| No se puede leer `tema.js` al crear el HTML autónomo | Se avisa y el archivo sale con el tema oscuro por defecto de `tema.css` |

### Diseño (`tema.css` / `tema.js`)

| Si falla… | Entonces… |
|---|---|
| No hay `backdrop-filter` | El vidrio pasa a casi opaco y se lee igual |
| No hay máscaras compuestas | Se quita el canto especular |
| No hay `color-mix()` | Tonos fijos pensados para el champán |
| No hay color relativo (`oklch(from …)`) | El texto de acento y el foco salen de `color-mix()`; con un color de marca muy oscuro o muy claro pueden quedar por debajo de AA en navegadores anteriores a 2023–2024 |
| El color de marca del tour es muy oscuro o muy claro | El texto de acento y el foco se aclaran (oscuro) o se oscurecen (claro) lo justo para cumplir AA |
| No hay `linear()` (muelles) | Curvas cúbicas |
| No hay `:has()` | `tema.js` marca la opción elegida del control segmentado |
| No carga la fuente Inter | Fuente del sistema (SF en Apple, Segoe en Windows) |
| El visitante pide reducir el movimiento o la transparencia | Se respeta automáticamente o desde Ajustes |
| El móvil no puede con el desenfoque del vidrio | «Reducir transparencia» (Ajustes) quita el `backdrop-filter` del todo: vidrio opaco, sin coste de GPU |
| El sistema pide más contraste (`prefers-contrast: more`) | En «Automático», la transparencia se reduce, como en macOS |
| Colores forzados (Windows) | El estado pulsado usa `Highlight` y `HighlightText` |
| Un color de marca casi blanco o casi negro | El texto de acento y el foco se ajustan para cumplir AA; el estado pulsado lleva un aro que no depende del relleno |
| No hay almacenamiento | Tema automático y talla M |

## Pendientes de contingencia (por implementar)

- **Sin WebGL:** convertir la galería en un visor 2D (deslizar la foto 360 como panorámica plana) para que se pueda «recorrer» igualmente.
- **Errores en producción:** registro opcional (evento `error` → `dataLayer`) para que la agencia sepa si algo falla en los móviles de los visitantes.
