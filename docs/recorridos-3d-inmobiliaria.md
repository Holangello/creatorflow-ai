# Recorridos 3D para inmobiliaria: de Chaos Corona a un visor propio

Guía de investigación y de producción. El objetivo es conseguir recorridos virtuales como los de Chaos Corona, pero hechos con
fotos y vídeo de un **DJI Osmo 360**, publicados en **idealista** y en la **web propia** de la inmobiliaria. En la web propia
se podrá caminar como en un videojuego: teclado y ratón en ordenador, joystick táctil en móvil y tablet.

> El visor de este repositorio ya hace todo eso: [`tools/visor-inmobiliario`](../tools/visor-inmobiliario/README.md).
> Para probarlo, abre `index.html?demo` desde un servidor local.

---

## 1. Qué es Chaos Corona y qué hace exactamente (de la A a la Z)

**Corona** es un *motor de render fotorrealista* de Chaos (los mismos de V-Ray) que funciona como plugin de **3ds Max** y
**Cinema 4D**. Lo usa sobre todo la visualización arquitectónica e interiorismo. Punto clave:

> **Corona no hace recorridos a partir de fotos.** Renderiza imágenes a partir de un **modelo 3D** (paredes, muebles,
> materiales, luces). Sus "recorridos virtuales" son panoramas 360 **renderizados** desde ese modelo y enlazados con
> puntos de salto (*hotspots*) en la nube de Chaos.

### Capacidades principales

| Área | Qué hace |
|---|---|
| Render fotorrealista | Trazado de rayos por CPU (con opciones de GPU vía Vantage). Iluminación global, cáusticas, volumétricos, desenfoque de movimiento, profundidad de campo. |
| Interactive Rendering | Vista previa fotorrealista en tiempo real dentro de 3ds Max/C4D mientras se edita la escena. |
| Corona VFB (frame buffer) | Corrección de color, curvas, LUT, bloom y glare, sharpening, denoising, *LightMix*. |
| LightMix | Cambia la intensidad y el color de cada luz **después** de renderizar (día/noche, luces on/off) sin volver a renderizar. |
| Denoising | Corona High Quality, NVIDIA OptiX e Intel Open Image Denoise. |
| Cámaras | Física, tilt-shift, **esférica 360 (equirectangular)**, cubemap y **VR estéreo** para gafas. |
| Sol y cielo | Corona Sun + Sky físico, HDRI, niebla y atmósfera. |
| Materiales | Physical Material, decals, triplanar, redondeo de aristas, distance map, scatter (Chaos Scatter), biblioteca Chaos Cosmos (modelos, materiales, HDRI, *Chaos Scans*). |
| Animación | Recorridos de cámara renderizados como vídeo (*walkthrough* no interactivo). |
| Chaos Cloud Collaboration | Enviar imágenes desde el VFB, revisión con marcas y comentarios del cliente y **Virtual Tours** (desde Corona 12 Update 1). |
| Virtual Tours | Varios panoramas 360 renderizados y unidos por hotspots, **Auto Hotspots** y **plano de planta** (Corona 12 Update 2). Iconos y colores personalizables, enlace para compartir sin cuenta de Chaos. |
| Corona 13 (junio 2025) | Materiales Toon y Outline (render estilizado), animación en GPU vía Chaos Vantage Live Link, **Chaos AI Enhancer**, eliminación de *fireflies*, shader Thin Film, *scatter clusters*, importación de escenas de Enscape. |
| Ecosistema | **Chaos Vantage** (exploración en tiempo real con RTX, solo escritorio), **Chaos Cloud Rendering**, Enscape. |

### Qué significa para nosotros

El "recorrido virtual" de Corona es, técnicamente:

1. Un panorama **equirectangular 2:1** por estancia.
2. Un **grafo de enlaces** entre panoramas (hotspots), que se pueden generar automáticamente según las posiciones.
3. Un **plano** con la posición de cada panorama.
4. Un **visor web** que funde de una imagen a otra.

El Osmo 360 ya produce el punto 1 con **fotos reales**. Los puntos 2, 3 y 4 los resuelve el visor de este repositorio. Para
el **movimiento libre tipo videojuego**, que Corona solo ofrece con Chaos Vantage en un PC con RTX y no en la web, se usa
**Gaussian Splatting** (sección 4).

---

## 2. Las tres vías para recrearlo

| Vía | Material de partida | Resultado | Navegación | Dónde publicar |
|---|---|---|---|---|
| **A. Tour 360** (equivale al Virtual Tour de Corona) | Fotos 360 del Osmo 360 | Saltos entre puntos con fundido | Arrastrar, WASD/flechas, clic en flechas del suelo, plano, giroscopio | Web propia + idealista (vía proveedor aprobado) |
| **B. Gemelo digital con Gaussian Splatting** | Vídeo 360 del Osmo 360 | Escena 3D fotorrealista continua | **Caminar libre**: WASD + ratón, joystick táctil | Web propia |
| **C. Render o IA** (obra nueva, reformas, home staging) | Plano o modelo 3D, o una foto 360 + prompt | Panoramas renderizados, modelo GLB o mundo 3D generado por IA | Ambas | Web propia (y en idealista, como infografía) |

Recomendación: **A siempre** (rápido, ligero, compatible con idealista). **B** en inmuebles premium o con jardín o
terraza. **C** para obra nueva y para enseñar el "después" de una reforma.

---

## 3. Vía A: Tour 360 con el DJI Osmo 360

### 3.1 La cámara

- Foto panorámica de **hasta 120 MP (15520 × 7760, 2:1)**, según fichas de distribuidores. En modo **HDR** la resolución
  baja a unos **30 MP**.
- Vídeo 360 **8K** (30 fps; 50 fps en algunos modos), perfil 10-bit **D-Log M**, sensor de 1".
- Incluye (según el pack) un **palo invisible** de 1,2 m. En la imagen cosida desaparece.

### 3.2 Protocolo de toma (checklist)

1. **Preparar la vivienda**: recoger objetos personales, abrir persianas, encender todas las luces y unificar la
   temperatura de color si se puede.
2. **Trípode o monopie con palo invisible** a **1,50 m** del suelo. Es la `altura_camara` del visor, y debe ser igual en
   todas las tomas.
3. **Una toma por estancia** en el centro óptico, más una en cada **umbral de puerta o pasillo**. Separación de 2 a 3 m
   entre puntos. Cuantos más puntos, más sensación de "caminar".
4. Mantener la cámara **nivelada** y con la **misma orientación** en todas las tomas (por ejemplo, el botón de grabación
   hacia la fachada). Así el `yaw` es casi el mismo en todas.
5. **HDR / bracketing** en interiores con ventanas. Si las ventanas se queman, prioriza el HDR aunque sea a 30 MP: para
   web, 8K de ancho es suficiente.
6. Disparar con **temporizador o desde la app** y salir del encuadre (o esconderse detrás de una pared).
7. Exportar los JPG **equirectangulares ya cosidos** desde DJI Mimo o DJI Studio.

### 3.3 Preparar y montar el tour

```bash
pip install pillow
python3 tools/visor-inmobiliario/preparar_panos.py ~/Fotos/calle-mayor-12 --salida web/tours/calle-mayor-12
cp tools/visor-inmobiliario/{index.html,visor.js,visor.css,demo.js} web/tours/calle-mayor-12/
```

El script genera tres tamaños de cada foto (8192 px para escritorio, 4096 px para móvil y 512 px de miniatura), borra el
EXIF y el GPS, y crea un `tour.json`. Luego:

1. Pon en `x`/`z` la posición de cada foto **en metros** sobre el plano. Basta con medirla en el plano del catastro o de la
   agencia.
2. Añade el plano (`"plano": {"imagen": "plano.png", "ancho_m": 12, "alto_m": 9}`).
3. Abre `index.html?editar` y gira cada foto con `[` y `]` hasta que las flechas apunten a las puertas reales. Después
   pulsa **Copiar tour.json**.
4. Si no declaras `enlaces`, el visor **conecta automáticamente** las estancias a menos de `radio_enlace_auto` metros,
   igual que los *Auto Hotspots* de Chaos. Si una pared separa dos puntos cercanos, declara los `enlaces` a mano.

---

## 4. Vía B: caminar libremente con Gaussian Splatting

El **3D Gaussian Splatting (3DGS)** reconstruye una escena fotorrealista a partir de cientos o miles de fotos. El navegador
la renderiza en tiempo real, también en móviles. Es lo más parecido a "meterse dentro de la foto" y moverse como en un
videojuego.

### 4.1 Captura con el Osmo 360

- Graba en **vídeo 360 8K**, con el palo invisible **por encima de la cabeza**.
- Camina **despacio** (unos 0,5 m/s), sin giros bruscos, y recorre cada estancia en bucle: perímetro y centro.
- Pasa **varias veces por las puertas**. Ahí es donde la reconstrucción suele romperse.
- Mantén la exposición bloqueada y la luz constante. Evita espejos y personas en movimiento.

### 4.2 De vídeo a splat

```bash
# 1) Vídeo equirectangular → vistas en perspectiva (12 por fotograma)
python3 tools/visor-inmobiliario/extraer_fotogramas.py recorrido.mp4 --salida fotogramas --fps 2
# Si sales en las vistas hacia el suelo, borra fotogramas/v08_* y fotogramas/v09_*
```

2. **Alineación y entrenamiento**, a elegir:
   - **Jawset Postshot** (Windows con NVIDIA): arrastras la carpeta y entrena. Es la opción más sencilla.
   - **RealityScan** para alinear y **Postshot** para entrenar. Este flujo se usa con fotos 360 de alta calidad.
   - **COLMAP/GLOMAP + Brush** (código abierto, también en Mac). Brush entrena splats directamente y se usa con miles de
     imágenes *fisheye* de cámaras 360.
3. **Limpieza y compresión** en **SuperSplat** (PlayCanvas, gratis, en el navegador): recorta el "ruido" exterior y los
   flotantes, y exporta a **.sog** o **.spz** comprimido. Objetivo: 1 a 3 millones de splats y 15 a 40 MB para móvil.
4. Opcional: exporta un **colisionador** (malla GLB sencilla de suelo y paredes, desde RealityScan o Blender) para no
   atravesar paredes.

### 4.3 Publicarlo en el visor

```json
"libre": {
  "tipo": "splat",
  "url": "escena.sog",
  "rotacion": [180, 0, 0],
  "colisionador": "colisionador.glb",
  "inicio": [3, 2.5, 90]
}
```

El visor usa **Spark** (renderer de Gaussian Splatting para three.js, de World Labs). Spark lee PLY, SPZ, SPLAT, KSPLAT y
SOG, está pensado para WebGL2 en el 98 % de dispositivos y rinde bien en móviles modestos. Para probar un splat al momento,
**arrástralo** sobre el visor.

---

## 5. Vía C: renders, modelos y prompts de IA

### 5.1 Igual que Corona: renderizar panoramas desde un modelo

Para obra nueva o reformas se modela la vivienda (SketchUp, 3ds Max, Blender) y se renderizan panoramas equirectangulares
2:1:

- **Corona o V-Ray**: cámara esférica 360. Exportas los JPG y **los cargas en este visor** igual que las fotos del Osmo. Te
  ahorras Chaos Cloud y el tour es tuyo.
- **Blender Cycles** (gratis): cámara *Panoramic → Equirectangular*, 8192 × 4096.
- Exporta además el modelo en **GLB** (`"libre": {"tipo": "glb", "url": "piso.glb"}`) para el modo de paseo libre, con
  colisiones automáticas.

### 5.2 Generar con IA a partir de un prompt o una foto 360

- **World Labs Marble** acepta texto, una imagen, **un panorama 360**, varias fotos o un vídeo corto. Genera un mundo 3D
  navegable y lo exporta como **splat (SPZ/PLY)** más una **malla de colisión GLB**. Encaja directamente en `"libre"`.
- Útil para **home staging virtual** ("este salón amueblado en estilo nórdico"), visualizar reformas o completar zonas
  que no se grabaron.
- **Aviso legal y ético**: lo generado por IA inventa detalles. En anuncios hay que rotularlo como **"recreación virtual /
  infografía orientativa"** y no presentarlo como el estado real del inmueble. Mantén siempre el tour fotográfico real
  como referencia.

Los prompts listos para usar están en [`prompts/recorridos-3d.md`](../prompts/recorridos-3d.md).

---

## 6. Publicación

### 6.1 Idealista

Lo que se ha podido verificar (conviene **confirmarlo con el comercial de idealista**, porque las condiciones cambian):

- Idealista tiene un **filtro de "visita virtual"** y muestra los tours en una sección propia del anuncio.
- Los tours externos se admiten **solo de proveedores aprobados** y con un **patrón de enlace concreto**. Por ejemplo,
  **Kuula** se anunció como proveedor oficial y ofrece un conversor de enlaces. Idealista no admite audio, autorrotación ni
  logotipo propio en ese tour.
- En Italia, idealista lanzó un **Virtual Tour Creator propio y gratuito** para clientes con cámara 360. No hay
  confirmación de que exista en España.

**Estrategia recomendada**

1. **Idealista**: sube las fotos 360 del Osmo al creador de tours de idealista si lo tienes disponible, o a un proveedor
   aprobado (por ejemplo, Kuula) y pega su enlace. Sube también 2 o 3 encuadres planos sacados de las 360 como fotos
   normales.
2. **Web propia**: el **visor completo** (tour 360 + paseo libre + plano). Es la experiencia premium y genera tráfico y
   contactos directos sin pasar por el portal.

### 6.2 Web propia

El visor son **archivos estáticos**: sirve cualquier hosting (el tuyo, Netlify, Cloudflare Pages, GitHub Pages…). Para
insertarlo en la ficha del inmueble:

```html
<iframe src="/tours/calle-mayor-12/"
        style="width:100%;aspect-ratio:16/9;border:0;border-radius:12px"
        allow="fullscreen; gyroscope; accelerometer; xr-spatial-tracking"
        allowfullscreen loading="lazy" title="Recorrido virtual"></iframe>
```

- Es obligatorio **HTTPS**: el giroscopio del móvil y la captura del ratón no funcionan sin él.
- Para enlazar directamente a una estancia: `/tours/calle-mayor-12/#cocina`. Para abrir en modo libre: `?modo=libre`.

---

## 7. Controles del visor (ordenador, tablet y móvil)

| Acción | Ordenador | Móvil / tablet |
|---|---|---|
| Mirar | Arrastrar con el ratón (o capturarlo con clic en modo libre) | Arrastrar con el dedo / giroscopio 🧭 |
| Avanzar a otra estancia (360) | `W` / `↑`, clic en la flecha del suelo, clic en el plano | Tocar la flecha, el plano o la galería |
| Caminar (modo libre) | `W A S D`, `Shift` para correr, `←` `→` para girar | Joystick virtual a la izquierda |
| Zoom (360) | Rueda, `+` `-` | Pellizcar |
| Plano grande | `M` | Botón ⤢ |
| Cambiar de modo | `Tab` | Pestañas superiores |

---

## 8. Hoja de ruta sugerida

1. **Semana 1**: 3 inmuebles con la vía A. Medir en la web el tiempo de permanencia y los contactos.
2. **Semana 2 a 4**: probar la vía B en un inmueble grande (Postshot o Brush) y ajustar el colisionador.
3. **Después**: plantilla de ficha de inmueble con el iframe, página índice de tours, analítica de eventos (estancias
   vistas, uso del modo libre) y un formulario de "pedir visita" dentro del visor.

---

## Fuentes

- Chaos: [Corona 12 Update 1](https://www.chaos.com/blog/corona-12-update-1) ·
  [Corona 13](https://www.chaos.com/blog/corona-13) ·
  [Virtual tours con Chaos Cloud (V-Ray 7)](https://www.chaos.com/blog/chaos-cloud-virtual-tours-at-your-fingertips-with-v-ray-7)
- [CGPress: Corona 12, herramientas de virtual tour](https://cgpress.org/archives/chaos-updates-corona-12-with-new-materials-virtual-tour-tools-and-performance-improvements.html) ·
  [CGPress: Corona 13](https://cgpress.org/archives/corona-13-adds-stylized-rendering-gpu-animation-support-via-cantage-and-ai-tools.html) ·
  [Digital Production: Corona 13](https://digitalproduction.com/2025/06/12/chaos-corona-13-ai-gpu-cartoon-vibes/) ·
  [Motion Media: Corona 12 Update 2](https://www.motionmedia.com/mm-blog/chaos-corona-12-update-2-new-features-chaos-scans-in-cosmos-and-performance-upgrades/)
- Osmo 360: [Altitude (ficha)](https://altitude.ph/products/dji-osmo-360-camera) ·
  [Micro Center](https://www.microcenter.com/quickView/698201/dji-osmo-360-action-camera-standard-combo) ·
  [Mezha (HDR 30 MP)](https://mezha.ua/en/news/dji-osmo-360-303727/) ·
  [Fotober: cámaras 360 para inmobiliaria](https://fotober.com/best-360-camera-for-real-estate) ·
  [360 Rumors: consejos de tours](https://360rumors.com/7-tips-creating-real-estate-virtual-tours-360-camera/)
- Idealista: [filtro "visita virtual"](https://www.idealista.com/en/news/node/812849) ·
  [Kuula aprobado en idealista](https://blog.kuula.co/idealista-approves-kuula) ·
  [Virtual Tour Creator (Italia)](https://www.idealista.it/es/news/node/179077)
- Gaussian Splatting: [Spark](https://github.com/sparkjsdev/spark) · [Spark docs](https://sparkjs.dev/docs/overview/) ·
  [Guía 3DGS y visores web (Utsubo)](https://www.utsubo.com/blog/gaussian-splatting-guide) ·
  [SuperSplat](https://themenonlab.blog/blog/supersplat-gaussian-splatting-3d-photos-open-source) ·
  [Brush y COLMAP (HKU)](https://bookstack.hku.nl/books/3d-scan/page/gaussian-splatting-online-and-local/export/pdf)
- IA: [Marble: lo esencial](https://help.scenario.com/articles/4774055514-marble-by-world-labs-the-essentials) ·
  [Formatos de exportación de World Labs](https://skills.cat/skills/cloudai-x/world-labs-skills/world-labs-export)
- Visores 360 alternativos: [Photo Sphere Viewer (VirtualTour, Map, Markers)](https://photo-sphere-viewer.js.org/plugins/map.html)
