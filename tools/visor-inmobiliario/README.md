# Visor inmobiliario 3D

Visor web para inmuebles con dos modos:

- **Recorrido 360**: fotos equirectangulares del DJI Osmo 360 (o renders 360 de Corona, V-Ray o Blender) unidas con
  flechas en el suelo, plano con posición y cono de visión, galería, fichas de información, zoom y giroscopio.
- **Modo libre 3D**: caminar como en un videojuego (`WASD` + ratón, joystick táctil en móvil) por un
  **Gaussian Splat** (`.sog`, `.spz`, `.ply`, `.splat`, `.ksplat`) o un modelo **GLB**, con colisiones.

Es HTML + JavaScript estático, sin compilación. Usa three.js y [Spark](https://github.com/sparkjsdev/spark) desde CDN.
Guía completa: [`docs/recorridos-3d-inmobiliaria.md`](../../docs/recorridos-3d-inmobiliaria.md).

## Probar la demo

```bash
cd tools/visor-inmobiliario
python3 -m http.server 8000
# abre http://localhost:8000/?demo
```

La demo genera un piso por código y "fotografía" cada estancia con una cámara 360 virtual, igual que Corona renderiza
panoramas desde un modelo.

## Crear un tour real

```bash
pip install pillow
python3 preparar_panos.py ~/Fotos/mi-piso --salida ../../web/tours/mi-piso
cp index.html visor.js visor.css demo.js ../../web/tours/mi-piso/
```

Edita `tour.json` (ver [`tour.ejemplo.json`](tour.ejemplo.json)) y abre `index.html?editar` para orientar cada foto con
`[` y `]`.

### `tour.json`

| Campo | Descripción |
|---|---|
| `titulo` | Nombre del inmueble |
| `altura_camara` | Altura del trípode en metros (1.5 por defecto) |
| `plano` | `{ "imagen", "ancho_m", "alto_m", "origen": [x, z] }`: plano a escala para el minimapa |
| `muros` | Opcional, `[[x1, z1, x2, z2], …]` en metros, para dibujar el plano sin imagen |
| `inicio` | `id` del panorama inicial |
| `radio_enlace_auto` | Distancia en metros para enlazar automáticamente los nodos sin `enlaces` |
| `panoramas[]` | `id`, `nombre`, `imagen`, `imagen_movil`, `miniatura`, `x`, `z` (metros), `yaw` (grados: hacia dónde mira el centro de la foto en el plano; 0 = arriba del plano), `rumbo_inicial`, `enlaces[]`, `puntos[]` (`yaw`, `pitch`, `titulo`, `texto`) |
| `libre` | `{ "tipo": "splat" \| "glb", "url", "rotacion": [x, y, z], "posicion", "escala", "colisionador", "inicio": [x, z, rumbo], "limites": [x0, z0, x1, z1] }` |

### Parámetros de URL

- `?demo`: piso de demostración
- `?tour=otro.json`: otro archivo de configuración
- `?modo=libre`: abrir directamente en paseo libre
- `?editar`: editor de orientación
- `#cocina`: abrir en una estancia concreta

## Controles

| | Ordenador | Móvil / tablet |
|---|---|---|
| Mirar | arrastrar; en modo libre, clic para capturar el ratón | arrastrar / giroscopio 🧭 |
| Moverse (360) | `W`/`↑` avanzar, `S`/`↓` volver, `A` `D` girar, clic en flechas o plano | tocar flechas, plano o galería |
| Moverse (libre) | `WASD`, `Shift` correr, `←` `→` girar, `Espacio`/`C` subir o bajar si no hay suelo | joystick izquierdo |
| Otros | rueda = zoom, `M` = plano, `Tab` = cambiar modo, `H` = ayuda | pellizcar = zoom |

## Archivos

- `index.html`, `visor.css`, `visor.js`: el visor
- `demo.js`: piso de demostración
- `preparar_panos.py`: redimensiona las fotos del Osmo 360, borra el GPS y crea `tour.json`
- `extraer_fotogramas.py`: vídeo 360 → vistas planas para entrenar Gaussian Splatting (Postshot, Brush, RealityScan)
