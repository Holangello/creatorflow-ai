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
| `npm run prueba:e2e` · `npm run prueba:todo` | Extremo a extremo, 321 comprobaciones en unos 6 min: Estudio (92), paneles (150), exportación (45: ZIP, HTML autónomo sin red, GPano, plano, dossier, vídeo) y seguridad (34: tour hostil, escapes, sin `file://`). Se elige con `node pruebas/e2e.mjs estudio seguridad`; el detalle está en `pruebas/LEEME.md`. Lo que depende de una interfaz en obras sale como «pendiente» en vez de fallar |
| `node pruebas/capturas.mjs` | Matriz visual: páginas × claro/oscuro × S/M/L × de 360×640 a 3840×2160 y 3440×1440, con hoja de contactos |
| `npm run medir` | Métricas para compactar, en el teléfono y el portátil: JS propio y de dependencias, CSS y fuentes hasta `visor.listo`; tiempo hasta `listo`; controles visibles y % de pantalla tapada, con la interfaz despierta y en reposo. Falla si en el teléfono la interfaz en reposo tapa más del 15 %. Los tiempos dependen de la máquina: se comparan en la misma. En este contenedor las fuentes dan 0 KB porque Inter ya está instalada en el sistema |
| Auditorías por fase | QA, UX/UI, Maverick, esencialista y organización (`docs/auditorias/`) |

## Planes de contingencia (si falla… → entonces…)

### Visor

| Si falla… | Entonces… |
|---|---|
| El dispositivo no tiene WebGL | Se avisa y se muestra la galería de fotos; la ficha y el contacto siguen funcionando |
| Se pierde el contexto gráfico (GPU) | Aviso con «Reintentar» (recarga) |
| `tour.json` no existe o está mal | Pantalla de error con la marca; nunca se muestra la demo por error |
| Una foto 360 no carga | Aviso con «Reintentar»; si era un estilo o un momento, se vuelve al anterior para que lo que se ve coincida con lo elegido |
| Poca memoria gráfica (móviles) | Caché de texturas limitada (4 en táctil, 14 en escritorio) y versiones de 4096 px para móvil |
| La música no carga o el formato no es compatible | El botón de sonido desaparece y el recorrido sigue; se reintenta si el tour se recarga |
| El navegador bloquea el sonido automático | La música empieza con «Empezar visita» de la portada, o con el primer toque o clic si no hay portada |
| No se puede capturar el ratón (modo juego) | Se mira arrastrando |
| El navegador no tiene `<dialog>` | «Estancias y plano» y «Ayuda» se abren con el atributo `open` |
| Falla la descarga con progreso de la portada | La foto se carga de la forma normal |
| `tour.json` falla con la portada delante | Queda la pantalla de error, sin capas inertes encima |
| El tour no tiene plano | El radar empieza oculto y se puede mostrar con R o con su botón |
| Un toque cuando la interfaz está oculta | Solo la despierta: nunca navega por sorpresa |
| Un icono SVG con scripts en el menú «Más» | Se descarta |
| Teclado AZERTY | W A S D y Q E van por posición física; R, M, H y V por la letra. Los textos muestran las letras reales en Chromium; en Firefox y Safari dicen W A S D |
| No hay almacenamiento local (modo privado) | Se usan los valores por defecto |
| El portapapeles no copia imágenes (Firefox), lo rechaza o no responde en 5 s | «Copiar la foto otra vez» o «Descargar fotos», y se indica adjuntarlas con el clip de WhatsApp |
| Falla el webhook del CRM o lo bloquea CORS | Aviso honesto con «Reintentar»; WhatsApp sigue siendo el canal principal |
| La agencia no tiene WhatsApp | El contacto va por el CRM o por email |
| El recorrido no tiene dirección web | El mensaje va sin enlace y sin líneas vacías; Compartir lo explica y no genera QR |
| No carga el generador de QR | El QR se oculta con un aviso; el enlace sigue funcionando |
| El núcleo no ofrece `visor.mas` o `visor.ajustes` | Los paneles ponen su propio «Más» (accesible con teclado) y guardan los ajustes en local |
| No carga `tema.css` | Los paneles usan sus valores de reserva y se leen bien |
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
| No hay almacenamiento local para «Mi inmobiliaria» | El perfil se aplica solo a este proyecto y se avisa |
| El perfil está incompleto | Nunca pisa los datos propios de un proyecto |
| El enlace de la Guía viene mal formado | Se ignora lo raro sin romper nada |
| La lista de la Guía ya se usó o se descartó | No se vuelve a ofrecer |
| La vista previa no responde en 12 s | Se ofrece «Recargar la vista previa» |
| Llega una recarga mientras la vista previa cambia de estancia | Se espera a que el visor confirme la estancia |
| La inmobiliaria no tiene web | No se escribe `url_publica` ni hay QR de ejemplo; «Descargar QR» queda desactivado |
| No carga `exportar.js` | La copia de seguridad sigue disponible |

### Exportación

| Si falla… | Entonces… |
|---|---|
| La foto pesa más de 8 MB (límite de idealista) | Se recomprime a 7,5 MB como máximo |
| MediaRecorder no admite MP4 | Se graba en WebM con la duración corregida |
| Se cancela una grabación | Se detiene de verdad y se restaura el visor |
| El tour de la demo contiene texturas 3D | La copia del tour las descarta antes de serializar (antes agotaba la memoria) |
| No se puede leer `tema.js` al crear el HTML autónomo | Se avisa y el archivo sale con el tema oscuro por defecto de `tema.css` |

### Diseño (`tema.css` / `tema.js`)

| Si falla… | Entonces… |
|---|---|
| No hay `backdrop-filter` | El vidrio pasa a casi opaco y se lee igual |
| No hay máscaras compuestas | Se quita el canto especular |
| No hay `color-mix()` | Tonos fijos pensados para el champán |
| No hay `linear()` (muelles) | Curvas cúbicas |
| No hay `:has()` | `tema.js` marca la opción elegida del control segmentado |
| No carga la fuente Inter | Fuente del sistema (SF en Apple, Segoe en Windows) |
| El visitante pide reducir el movimiento o la transparencia | Se respeta automáticamente o desde Ajustes |
| No hay almacenamiento | Tema automático y talla M |

## Pendientes de contingencia (por implementar)

- **Sin WebGL:** convertir la galería en un visor 2D (deslizar la foto 360 como panorámica plana) para que se pueda «recorrer» igualmente.
- **Errores en producción:** registro opcional (evento `error` → `dataLayer`) para que la agencia sepa si algo falla en los móviles de los visitantes.
