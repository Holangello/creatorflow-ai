# Guía rápida: recorrido 3D con la DJI Osmo 360 en cre8eight

La versión interactiva está en **`tools/visor-inmobiliario/asistente-osmo.html`**. Ábrela en el móvil durante la sesión: tiene
casillas para marcar, control de tomas por estancia y guarda tu progreso. Esta página es el resumen para imprimir o
consultar.

## Datos clave de la cámara

| Dato | Valor | Fuente |
|---|---|---|
| Foto panorámica | JPG 2:1, **15520 × 7760 (120 MP)**, **ya unida en la cámara** | [DJI specs](https://www.dji.com/360/specs), [ProVideo Coalition](https://www.provideocoalition.com/review-dji-osmo-360/) |
| RAW / horquillado a 120 MP | No disponible (solo JPG) | [ProVideo Coalition](https://www.provideocoalition.com/review-dji-osmo-360/) |
| HDR | **30 MP** en la Osmo 360. La Osmo 360 II hace HDR a 120 MP | [Mezha](https://mezha.ua/en/news/dji-osmo-360-303727/), [ProVideo Coalition (II)](https://www.provideocoalition.com/review-dji-osmo-360-ii/) |
| Distancia mínima para una unión limpia | **0,75 m** a objetos (DJI) | [DJI FAQ](https://www.dji.com/360/faq) |
| Vídeo 360 | Archivo **.OSV** → exportar a MP4 equirectangular 8K con DJI Studio / DJI Mimo | [DJI support](https://www.dji.com/support/product/360), [ProVideo Coalition](https://www.provideocoalition.com/review-dji-osmo-360-ii/) |
| Soporte recomendado en interiores | Palo-trípode de 1,6 m (el palo invisible de 1,2 m es solo para usar en mano) | [DJI Store](https://store.dji.com/product/osmo-120cm-invisible-selfie-stick-kit), [Wex](https://www.wexphotovideo.com/dji-osmo-1-6m-tripod-selfie-stick-3258935) |
| Disparo remoto | DJI Mimo (Bluetooth/Wi-Fi, con vista previa) | [Notas de DJI Mimo](https://www.apkmirror.com/?p=10418329) |

## El método en 9 pasos

1. **Material:**
   - Cámara cargada y batería de repuesto.
   - Palo-trípode de 1,6 m.
   - DJI Mimo instalada en el móvil.
   - Paño de microfibra.
   - Plano de la vivienda.
   - Lista de estancias en el orden en que las vas a recorrer.
2. **Preparar la vivienda:**
   - Todas las luces encendidas y las persianas subidas.
   - Sin objetos personales ni personas.
   - Consentimiento del propietario.
3. **Configurar:**
   - Modo según la luz:
     - Foto 360 a 120 MP con luz pareja.
     - HDR con ventanas brillantes.
   - Balance de blancos fijo (4000–4500 K).
   - Compensación de exposición de 0 a +0,3 EV.
   - GPS desactivado.
4. **Planificar los puntos:**
   - Centro de cada estancia, más un punto en cada puerta o paso.
   - Entre 2 y 4 m entre puntos.
   - Al menos 0,75–1 m de distancia a muebles y paredes.
5. **Disparar:**
   - Siempre a **1,50 m** de altura, con la cámara nivelada y la **misma orientación** en todas las tomas.
   - Disparar desde DJI Mimo, escondido en otra estancia.
   - Revisar la vista previa después de cada toma.
6. **(Opcional) Vídeo para el paseo libre:**
   - 8K a 30 fps.
   - Palo por encima de la cabeza.
   - Caminar a 0,5 m/s, dando bucles por cada estancia y pasando varias veces por las puertas.
   - Exportar el `.OSV` a MP4 8K en DJI Studio.
   - Pasarlo por `extraer_fotogramas.py`.
   - Entrenar con Postshot o Brush.
7. **Pasar las fotos** por USB-C o con DJI Mimo, sin renombrarlas.
8. **Estudio (`estudio.html`):**
   - Fotos: se detectan como Osmo 360, se ordenan por hora y se nombran.
   - Plano: PDF, imagen o DXF, calibrado.
   - Colocar cada foto.
   - Orientar.
   - Ficha con el certificado energético.
   - Extras: estilos, versión de noche, colores, renders.
9. **Revisar y publicar:**
   - ZIP para la web, que da un enlace para compartir.
   - Para idealista:
     - Vídeo MP4 (≤ 100 MB).
     - Fotos (≤ 8 MB).
     - Plano.
     - Tour a través de un proveedor compatible.

## Errores típicos

| Síntoma | Causa | Solución |
|---|---|---|
| Línea o costura visible | Cámara a menos de 0,75 m de algo | Alejar la cámara y repetir |
| Ventanas blancas | Contraluz | Usar HDR o encender las luces interiores |
| Cada estancia de un color | Balance de blancos automático | Fijar el balance de blancos |
| Horizonte torcido | Cámara inclinada | Nivelar con DJI Mimo o un trípode con burbuja |
| Apareces en la foto | Disparo desde el punto | Disparar en remoto desde otra estancia |
| Archivo `.OSV` | Es vídeo 360 | Exportarlo a MP4 en DJI Studio |
