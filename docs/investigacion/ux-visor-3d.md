# Guía UX/UI del visor 3D inmobiliario

Resultado del análisis UX (agente especialista). Las cifras de transición y los umbrales de lupa e imán son recomendaciones
de oficio: no hay fuentes publicadas que las respalden y hay que validarlas con usuarios.

## 1. Arquitectura de información

- **La escena manda**: en reposo, la UI ocupa como mucho un 10–15 % de la pantalla.
- **Tres niveles de información**:
  - **N1, siempre visible**: marca, contacto o WhatsApp, cambio de modo y estancia actual.
  - **N2, a un toque**: plano, galería y plantas.
  - **N3, en menú u hoja inferior**: ficha, hipoteca, compartir y QR, idioma, ajustes y exportar.
- **Un solo modo activo** a la vez (recorrido, libre, maqueta, medición o visita guiada), cada uno con su barra contextual.
- **La UI se oculta sola** tras unos 3 s de exploración, salvo el botón de contacto en escritorio.
- **Antes/después y día/noche** son variantes de la estancia: se muestran como control segmentado contextual.

**Layouts**

- **Escritorio (≥1280)**: barra superior translúcida, panel lateral derecho de 360 px plegable con la ficha (arranca cerrado
  con la pestaña "Ficha · precio"), minimapa abajo a la izquierda, dock inferior central y botón de contacto abajo a la
  derecha.
- **Tablet horizontal**: como escritorio; el panel se superpone a la escena.
- **Tablet vertical y móvil**: hoja inferior (bottom sheet) con tres alturas: peek de 64 px con precio y botón, 50 % y
  90 %. El plano se abre en un modal.
- **Móvil horizontal**: iconos en vertical a la derecha y contacto como botón flotante.
- **Safe areas** en todos los overlays. Botones de 44 px como mínimo, separados 8 px. Las flechas del suelo tienen un
  área táctil de 56 px.

## 2. Onboarding

- **Sin modal de bienvenida**: una pista "Arrastra para mirar" que desaparece en la primera interacción.
- **Pistas de una en una**, solo cuando hacen falta. En modo libre: teclas WASD que se iluminan al pulsarlas, "Haz clic
  para explorar" antes de capturar el ratón y joystick flotante en la mitad izquierda.
- **Las pistas se recuerdan en localStorage**. La ayuda se recupera con "?".
- **Alternativa sin aprendizaje**: tocar el suelo para ir allí.

## 3. Mareo y transiciones

- **Salto entre panoramas**: 600–900 ms con ease-in-out, avanzando la cámara un 30–50 % hacia el destino y fundido
  cruzado. Sin girar la cámara durante el salto. Con *reduced motion*, fundido de 200 ms o corte directo.
- **Campo de visión (FOV)**: 70–75° en escritorio y 75–80° en móvil vertical. No usar el efecto de dolly zoom.
- **Modo libre**: andar a 1,2–1,5 m/s y correr a unos 2,5 m/s, con aceleración de 150–250 ms y horizonte siempre
  nivelado.
- **Sensibilidad ajustable** e invertir ejes por separado en ratón y táctil. Giroscopio solo si el usuario lo activa, con
  botón de recentrar.
- **Visita guiada**: paradas de 4–6 s y giros lentos (≤20°/s), con pausa siempre visible.

## 4. Medición en táctil

- **Lupa desplazada** sobre el dedo.
- **Imán** a superficies y restricción a ejes.
- **Botones Deshacer y Borrar**, y Ctrl+Z en escritorio.
- **Aviso de precisión** sin prometer más exactitud de la que tiene la medida.

## 5. Estados

- **Carga**: baja resolución inmediata y luego alta, con barra de progreso real. Precarga de las estancias vecinas.
- **Errores**: reintento automático conservando la estancia anterior a la vista. Sin WebGL, galería, plano y ficha.
  Recuperar la pérdida de contexto WebGL.
- **Rendimiento**: bajar el pixel ratio si los FPS caen por debajo de 30.

## 6. Accesibilidad

- **Toda la UI en HTML nativo** (no dibujada en el canvas), con foco visible.
- **Lectores de pantalla**: flechas expuestas como botones con nombre ("Ir a cocina, 4 m"), `aria-live` con la estancia
  actual y una descripción textual de la vivienda.
- **Contraste** de 4,5:1 en texto y 3:1 en UI. El certificado energético muestra letra y no solo color.
- **`prefers-reduced-motion`** más un interruptor propio. Sin autorrotación al cargar (WCAG 2.2.2). Botones equivalentes
  a los gestos (WCAG 2.5.1 / 2.5.7).

## 7. Efecto "wow" elegante

- **Entrada cinematográfica** que el usuario puede saltar.
- **Maqueta** con estancias que se iluminan mostrando sus m².
- **Antes/después** con cortinilla arrastrable.
- **Fundido día/noche**.
- **Deep link** a la vista exacta con QR.
- **Vídeo vertical 9:16** con logo y precio.
- **Estilo visual**: tipografía serif para precio y titulares, sin rebotes.

## Fuentes

- https://matterport.com/blog/refreshing-the-way-to-explore-your-digital-twins
- https://developer.playcanvas.com/user-manual/gaussian-splatting/editing/supersplat/camera-controls
- https://developers.google.com/vr/elements/tunneling
- https://w3c.github.io/wcag/understanding/animation-from-interactions
- https://tabnav.com/academy/wcag/success-criterion-2.5.8
- https://quorumlanguage.com/tutorials/accessibility/accessibleGraphicsWebGL.html
