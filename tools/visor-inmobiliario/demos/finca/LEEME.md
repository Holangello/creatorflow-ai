# Demo «finca» con fotos 360 reales

Recorrido de demostración de cre8eight con fotos 360 reales de libre uso: una casa de campo con salón, dormitorio,
terraza y jardín. Sirve para ver cómo queda un trabajo real (recorrido, maqueta con las fotos, barra del sol con
amanecer, día, atardecer y noche) sin fotos del cliente. Aquí solo está la receta: las fotos se descargan y se generan.

## Origen y licencia

- **Fotos:** HDRI de [Poly Haven](https://polyhaven.com/) (CC0, dominio público) de Greg Zaal en Lythwood, KwaZulu-Natal
  (Sudáfrica), 22 y 23 de marzo de 2018: `lythwood_lounge`, `lythwood_room`, `lythwood_terrace` y `lythwood_field`.
  Se descargan en 4096×2048 del espejo público de Kubric (Google Research):
  `https://storage.googleapis.com/kubric-public/assets/HDRI_haven/<id>.tar.gz`, con la misma licencia y los mismos datos
  (autor, fecha, coordenadas).
- **Música:** la de ambiente de la demo (`demo.js`), generada por código.
- **Datos del inmueble:** ficticios (precio, superficies, habitaciones). El aviso legal de la ficha lo dice y nombra el
  origen de las fotos.

## Qué se hace con cada foto

| Paso | Archivo | Qué hace |
|---|---|---|
| Descarga | `descargar.sh` | El HDR de cada foto, cada uno en su carpeta (`descargas/`), sin rutas peligrosas al descomprimir |
| Revelado | `revelar.py` | HDR → JPG 4096 con aspecto de foto inmobiliaria: balance de blancos por el techo (y por zonas donde manda la bombilla), tonemapping local con continuidad en el borde de la equirectangular, curva fílmica y enfoque suave |
| Ventanas | `mascara.py` + `ventanas/*.json` | Canal B de `mascara`: rectángulos de ventana en las paredes medidas (dentro) o cajas en grados (la casa vista desde fuera), recortados por la luz del HDR o de la foto para dejar fuera los muebles de delante y los marcos |
| Recorrido | `tour.py` | `sitio/tour.json`: estancias medidas sobre las fotos (contorno de suelo, techo y esquinas), plano orientativo que las une, enlaces que caen en las puertas, `sol` con la fecha, hora y lugar reales de las fotos y `cielo: "cubierto"`, terraza y jardín como estancias `exterior` |
| Página | `exportar.mjs` + `pagina.py` | El HTML autónomo del visor con el tour apuntando a las fotos como archivos al lado (sin incrustarlas) y, para publicarlo como Artifact, sin la cabecera del documento y con el tema del visor de Artifacts |

## Rehacerla

```sh
cd tools/visor-inmobiliario
npm install && npm run build          # el visor compilado (dist/) que va dentro de la página
demos/finca/preparar.sh               # descarga, revela, máscaras, tour, música y la página
```

Necesita Python 3 (con `opencv-python-headless`, que `preparar.sh` instala en `demos/finca/venv`), ImageMagick
(`convert`) y Chromium de Playwright. La página queda en `demos/finca/sitio/pagina.html`, junto a sus archivos (`panos/`,
`panos/mini/`, `panos/mascaras/` y `audio/`): se publican juntos con las mismas rutas.
