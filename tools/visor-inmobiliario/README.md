# cre8eight · Recorridos 3D inmobiliarios

cre8eight convierte las fotos 360 de una **DJI Osmo 360** en un recorrido virtual premium para vender o alquilar una
vivienda. Tiene tres piezas:

- **Visor** (`index.html`). Es lo que ve el comprador: recorrido 360, paseo libre en 3D y maqueta. Incluye contacto por
  WhatsApp con fotos de la vista, radar y plano, estilos con IA, día y noche, y modo claro u oscuro.
- **Estudio** (`estudio.html`). Es donde la agencia monta y publica el recorrido en 4 pasos.
- **Guía Osmo 360** (`asistente-osmo.html`). Explica paso a paso cómo hacer las fotos, con consejos.

Todo es HTML y JavaScript estático, sin servidor ni suscripciones. three.js y [Spark](https://github.com/sparkjsdev/spark)
se cargan desde jsDelivr con versiones fijas.

## Probarlo en un minuto

```bash
cd tools/visor-inmobiliario
python3 -m http.server 8765
```

| Abre | Para |
|---|---|
| http://localhost:8765/?demo | Visor con un piso de demostración |
| http://localhost:8765/estudio.html | Estudio: crear un recorrido con tus fotos |
| http://localhost:8765/asistente-osmo.html | Guía para hacer las fotos con la Osmo 360 |

## De la cámara al anuncio

1. **Fotos.** Sigue la Guía (o [docs/guia-osmo360.md](../../docs/guia-osmo360.md)): una foto por estancia, a 1,5 m de
   altura, en el centro.
2. **Estudio.** El primer día, rellena «Mi inmobiliaria»: marca, WhatsApp y política de privacidad. Después, para cada
   vivienda:
   1. **Fotos.** Se optimizan, se les quita la ubicación GPS y se ordenan por hora.
   2. **Plano** (opcional). Imagen, PDF o DXF, con estancias automáticas.
   3. **Datos.** Precio, m², certificado energético…
   4. **Publicar.**

   El proyecto se guarda en el navegador de ese ordenador. Para llevarlo a otro, usa Proyecto ▾ → Copia de seguridad.
3. **Publicar**, por destino:
   - **Tu web.**
     - Descarga el ZIP y súbelo a la dirección final que indica el Estudio (por defecto `https://tu-web/tours/<referencia>/`;
       se puede cambiar si lo alojas en otro sitio). El enlace, el QR y el dossier la llevan dentro.
     - Copia el enlace o el código para incrustarlo (WordPress, Wix…).
     - Usa el código QR para carteles.
   - **Portales y redes.**
     - Fotos 360 de menos de 8 MB, que idealista, Facebook y Google muestran en 360.
     - Vídeo 16:9, 9:16 o 1:1 con tu marca y música.
     - Plano con medidas.
     - idealista y Fotocasa solo aceptan el enlace de un tour de proveedores homologados. Ahí se sube el vídeo, el
       plano y las fotos 360. La tabla «¿Qué subo a cada portal?» del Estudio lo detalla.
   - **Para tus clientes.**
     - Dossier PDF.
     - Recorrido en un solo archivo HTML, que se abre con doble clic y sin internet.
     - Código QR.

## Lo que ve el comprador

- **Tres modos:**
  - **Recorrido** con fotos 360.
  - **Paseo libre**, como en un videojuego, por un Gaussian Splat (`.sog`, `.spz`, `.ply`, `.splat`, `.ksplat`) o un
    modelo GLB.
  - **Maqueta** 3D del plano.
- **Tarjeta del inmueble.** Precio, datos y ficha completa, con hipoteca, documentos y ubicación.
- **Contactar.** Pregunta por WhatsApp con fotos de la vista y la estancia elegida, en 4 toques.
- **Estancias y plano**, más un radar de esquina que se muestra y se oculta.
- **Barra del sol**, bajo el título: un punto que se arrastra del amanecer a la noche (o cuatro iconos: amanecer, día,
  atardecer y noche, y ▶ para ver pasar el día) con la posición exacta del sol el día y en el lugar de las fotos (EXIF de
  la Osmo 360). En la demo y en la maqueta el sol entra por las ventanas con sus sombras; en las fotos, a su hora se ven tal
  cual y al moverla la luz se simula (con sello).
- **Estilo y luz:**
  - 5 estilos con IA, solo en viviendas en proyecto (obra nueva o terreno);
  - color de paredes y suelo en viviendas construidas;
  - día, atardecer y noche;
  - antes y después.
- **Más.** Visita guiada, medir, compartir con QR, música con volumen, idiomas (es, en, fr, de) y Ajustes.
- **Apariencia.** Automático, claro u oscuro; tamaño S, M o L; reducir transparencia; reducir movimiento. Se comparte
  entre el visor, el Estudio y la Guía.

## Controles

| | Ordenador | Móvil y tablet |
|---|---|---|
| Mirar | Arrastrar. 🎮 o `W` `A` `S` `D`: modo juego con el ratón (`Esc` para salir) | Arrastrar. «Mirar moviendo el móvil» está en «Más» |
| Ir a otra estancia | Clic en una flecha o en el suelo; `W` `A` `S` `D` o flechas (mantén `W` para seguir) | Tocar una flecha o el suelo |
| Paseo libre | `W` `A` `S` `D` o flechas; `Shift` para correr | Pulgar izquierdo para caminar, derecha para mirar |
| Acercar | Rueda | Pellizcar |
| Teclas | `R` radar · `M` estancias y plano · `H` ayuda · `V` modo · `Q` `E` girar · `RePág` `AvPág` mirar arriba y abajo · `Esc` cerrar | — |
| Barra del sol | Arrastrar el punto o clic en un icono; con la barra seleccionada, `←` `→` 15 min (`Shift` una hora) y `RePág` `AvPág` de momento en momento | Arrastrar el punto o tocar un icono |

Los atajos de una sola letra se pueden desactivar en Ajustes (WCAG 2.1.4).

## Parámetros de URL

| Parámetro | Efecto |
|---|---|
| `?demo` | Piso de demostración |
| `?tour=otro.json` | Otro archivo de recorrido (por defecto, `tour.json`) |
| `?modo=libre` · `?modo=maqueta` | Abre en ese modo, si el recorrido lo tiene |
| `?lang=en` | Idioma de la interfaz |
| `?tema=claro\|oscuro` · `?talla=s\|m\|l` | Apariencia, solo para esa visita |
| `?embed` | Vista previa del Estudio: sin portada ni modo juego, y avisa a la página que lo contiene (`postMessage`). Para tu web usa el código del paso «Publicar» |
| `?dev` | Permite soltar un modelo 3D para probarlo |
| `#cocina` | Abre en esa estancia (por su `id`) |

El formato de `tour.json`, la API `window.visor` y los eventos están en [ESQUEMA.md](ESQUEMA.md). Hay un ejemplo en
[tour.ejemplo.json](tour.ejemplo.json).

## Desarrollo

```bash
npm install            # solo para las pruebas y la compilación
npm run build          # dist/visor-autonomo.js: lo necesita «Recorrido en un solo archivo»
npm run prueba:todo    # humo + contraste AA + pruebas de extremo a extremo
```

| Comando | Qué hace |
|---|---|
| `npm run prueba` | Prueba de humo: visor, Estudio y Guía cargan sin errores |
| `npm run contraste` | Contraste AA de los pares de colores del tema, en claro y en oscuro |
| `npm run prueba:e2e` | Unas 510 comprobaciones del Estudio, los paneles (con la barra del sol), la exportación y la seguridad |
| `npm run prueba:sol` | El sol de `sol.js` frente a posiciones y horas conocidas, y el EXIF (fecha, desfase y GPS) que lee el Estudio |
| `npm run medir` | Peso de la carga inicial, tiempo hasta que el visor está listo y cuánta pantalla tapa la interfaz (objetivo en el teléfono: ≤ 15 %) |
| `node pruebas/capturas.mjs` | Matriz de capturas: páginas × claro/oscuro × S/M/L × tamaños de pantalla |

Detalles de las pruebas en [pruebas/LEEME.md](pruebas/LEEME.md); planes de contingencia en
[docs/calidad.md](../../docs/calidad.md). `dist/` no se versiona: lo compila el workflow de GitHub Pages
(`.github/workflows/visor-pages.yml`, que publica desde `main`).

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html`, `visor.js`, `visor.css` | Núcleo del visor (three.js): recorrido, paseo libre, maqueta, radar, menú «Más», captura |
| `paneles.js`, `paneles.css`, `i18n.js` | Tarjeta del inmueble, contacto, ficha, compartir, Ajustes e idiomas |
| `plano.js`, `medicion.js`, `maqueta.js`, `guion.js`, `util.js` | Plano y radar, medir, maqueta, visita guiada y utilidades |
| `tema.css`, `tema.js`, `vendor/fonts/inter` | Sistema de diseño «minimal liquid glass» ([docs/diseno/sistema.md](../../docs/diseno/sistema.md)) |
| `estudio.html`, `estudio.css`, `estudio*.js` | Estudio |
| `asistente-osmo.html` | Guía Osmo 360 |
| `exportar.js`, `build.mjs` | Exportaciones (ZIP, HTML autónomo, vídeo, fotos 360, plano, dossier) y compilación |
| `demo.js` | Piso de demostración generado por código |
| `preparar_panos.py`, `extraer_fotogramas.py` | Scripts opcionales: preparar fotos sin el Estudio y vídeo 360 → fotogramas para Gaussian Splatting |
| `vendor/` | fflate, pdf.js, QR (Nayuki) y fuente Inter (OFL) |

## Limitaciones conocidas

- idealista y Fotocasa solo enlazan tours de proveedores homologados (ver «Publicar»).
- El vídeo se graba en WebM en Chromium y en MP4 donde el navegador lo permita.
- El ZIP no admite más de 4 GB.
- El Estudio guarda en el navegador: dos pestañas sobre el mismo proyecto no se sincronizan.
- `file://` no tiene enlace para compartir. Para eso, súbelo a tu web o usa el archivo único.
