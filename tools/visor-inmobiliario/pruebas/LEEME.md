# Pruebas de cre8eight

Pruebas automáticas del visor, el Estudio y la exportación en Chromium sin cabeza (Playwright 1.56.1, WebGL por software).
No necesitan red: `cdn.jsdelivr.net` se redirige a `node_modules` y todo se sirve desde un servidor propio en un puerto libre.

## Cómo ejecutarlas

```bash
cd tools/visor-inmobiliario
npm install                 # una vez (en el contenedor, Chromium ya está en /opt/pw-browsers: no ejecutes «playwright install»)
npm run prueba              # humo (< 1 min)
npm run prueba:e2e          # las 4 pruebas e2e en serie, con un resumen por archivo (≈ 6 min)
npm run prueba:todo         # humo + e2e
node pruebas/e2e.mjs estudio seguridad          # solo algunas
node pruebas/e2e-paneles.mjs                    # una sola
E2E_SOLO="whatsapp" node pruebas/e2e-paneles.mjs # solo los bloques cuyo nombre contiene el texto
E2E_CAPTURAS=/tmp/fallos node pruebas/e2e-estudio.mjs  # captura de pantalla de cada página al fallar un bloque
node pruebas/capturas.mjs   # matriz de capturas (tema × talla × pantalla), para revisar a ojo
```

Cada prueba imprime una línea por comprobación y un resumen, y sale con código 1 si algo falla:

| Marca | Significado |
|---|---|
| `✓` | Correcto. |
| `✗` | Fallo. La prueba termina con código 1. |
| `⚠ PENDIENTE` | Fallo **real y conocido** del producto, con el archivo y el motivo. No hace fallar la prueba. Cuando se arregle, la línea dirá que «ya funciona» y hay que cambiar `inf.pendiente(…)` por `inf.ok(…)`. |
| `⚠ PENDIENTE DE LA INTERFAZ NUEVA` | Falta una pieza de la interfaz de la que depende el bloque (la fase 3 las rehace): el resto del bloque no se comprueba. No hace fallar la prueba; hay que adaptar el objeto `SEL` (o `PASO`, las anclas del Estudio) de esa prueba. |

## Qué cubre cada prueba

| Archivo | Qué comprueba |
|---|---|
| `humo.mjs` | Que el visor (demo), el Estudio, la Guía y el tema cargan sin errores. |
| `e2e-estudio.mjs` | Estudio de principio a fin: vista previa vacía y rápida; fotos (aviso 2:1, nombres, versión móvil); plano (calibrar, arrastrar, «Colocar», conectar, estancia, muro); dirección y notas; variantes y máscara con la varita; datos con formato español; Revisar; material del arquitecto (DXF, PDF de varias páginas, render 360, galería, GLB, documentos, música); exportadores (ZIP, fotos GPano, plano, dossier, HTML, vídeo); deshacer; ZIP público sin privados; copia de seguridad y restauración; iPad; fallo de guardado; atajos; prueba del CRM. |
| `e2e-paneles.mjs` | Paneles del visor con un visor simulado (`fixtures/paneles.html`): disposición en 5 tamaños, contacto y foto, validación, CRM caído, WhatsApp con fotos (portapapeles y compartir archivos), galería, cambio de tour, música, idioma y teclado. Con el núcleo real: interfaz que no parpadea ni se oculta antes de tocar, pantalla completa y barra de captura. |
| `e2e-exportar.mjs` | `exportar.js` por API y por el contenido de los archivos: bundle ligero y completo, ZIP público frente a copia de seguridad, GPano, plano PNG, HTML autónomo abierto desde el disco sin red (enlaces sin `file://`, `url_publica`), dossier en francés, exportar la demo viva y vídeo 16:9 y 9:16 con imagen y duración. |
| `e2e-seguridad.mjs` | Tour hostil (`fixtures/hostil/tour.json`) servido con el código actual: ningún `javascript:` ni `alert`, el HTML de los nombres se ve como texto, documentos sin duplicar ni privados; enlaces peligrosos en los paneles; el Estudio lo marca y publica limpio; HTML autónomo y dossier escapados; arrastrar y soltar solo con `?dev`. |

## Datos de prueba

No hay binarios en el repositorio: las fotos 360 (2:1, pared y suelo de color con rejilla y rótulo), el plano, el PDF, el DXF, el GLB y el WAV se generan al vuelo en `e2e-util.mjs`. El tour hostil solo guarda su `tour.json`; `servir({ fixture, generar })` (en `comun.mjs`) lo sirve junto al código actual del visor y genera sus imágenes y documentos.

El HTML autónomo necesita `dist/` (`npm run build`, ignorado por git). Las pruebas lo recompilan si está desactualizado.

## Cómo añadir una prueba

1. Usa el bloque de la prueba que más se parezca (cada `inf.bloque` es independiente: abre su propio contexto limpio y lo cierra al terminar).
2. Comprueba **comportamiento**: `window.visor`, `window.__estudio.tour`, lo que llega al CRM o a WhatsApp (rutas interceptadas), el contenido de los ZIP y HTML descargados. Evita los tiempos fijos: espera condiciones con `esperar(p, () => …)`.
3. Pon los selectores nuevos en el objeto `SEL` del principio del archivo. Si dependen de una pieza de la interfaz que puede cambiar, empieza el bloque con `if (!(await inf.requiere(p, { nombre: SEL.x }, "qué se prueba"))) return;` o, a mitad del bloque, usa `await p.click(await inf.pieza(p, SEL.x, "qué es"))`: si falta, el bloque queda «pendiente de la interfaz nueva» en vez de fallar.
4. Si encuentras un fallo real del producto, no lo escondas: déjalo como `inf.pendiente(condición, "qué debería pasar", "archivo y causa")`.

```js
await inf.bloque("Lo que pruebo", async () => {
  const ctx = await contexto(navegador, { ancho: 390, alto: 844, movil: true });
  inf.cerrarAlFinal.push(ctx);
  const p = await abrir(ctx, `${base}index.html?demo`);
  await esperar(p, () => window.visor?.listo === true, null, 90000);
  inf.ok(await p.evaluate(() => window.visor.tour.panoramas.length > 0), "la demo tiene estancias");
  inf.ok(!erroresDe(p).length, "sin errores de consola", p.errores.join(" | "));
});
```
