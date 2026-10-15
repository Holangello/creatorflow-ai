# Fase 4 · Transparencias sobre la foto (especificación de diseño)

- **Petición del cliente (15/10, 13:53):** «que las flechas y algunos elementos más tengan transparencia para que no tapen mucho la visibilidad; que el agente de diseño elija a qué más debería aplicarle transparencia» (PENDIENTE.md, cierre de la fase 4).
- **Autor:** agente de diseño (el de la auditoría visual, `fase4-visual.md`). **Fecha:** 15/10/2026.
- **Estado:** propuesta prototipada, medida y con prueba de humo en verde, **sin tocar el repositorio**: `visor.js` y `plano.js` se sirvieron modificados con `page.route` y el CSS se inyectó con `addStyleTag`. Base: commit `1b677cf` (los cuatro archivos afectados no cambian desde `6446413`).
- **Dónde se aplica:** `visor.js` (flechas), `visor.css`, `paneles.css` y una línea de `plano.js`.

## Resumen

Las flechas del suelo pasan a ser **más finas, algo menores y translúcidas**: un aro blanco al 75 % (hoy, al 90 %) de 5,5 cm de grosor (hoy, 10 cm) con un **contorno oscuro fino a los dos lados**, y la flecha central lleva por fin su propio contorno (hoy se pierde sobre suelos blancos: 1,0:1). Las cercanas **encogen**, porque la perspectiva ya las agranda, y en un teléfono en vertical todas van al 78 %. Al pasar el ratón o con el foco en su rótulo, la flecha se pone en el **color de la marca**, crece un 12 % y su rótulo se ilumina. Con la interfaz **en reposo** (3,5 s sin tocar), las flechas bajan a la mitad y los rótulos y los puntos «i» se apartan. Además, la pista inicial es más compacta, el radar del teléfono pasa al vidrio de icono y la tarjeta del teléfono se recoge en reposo en una píldora. El texto no se vuelve translúcido en ningún caso: sigue en los tokens de vidrio, con AA.

**Resultado:** las flechas tapan un **71 % menos** de la pantalla del teléfono (2,47 % → 0,71 %) y un **48 % menos** en el escritorio (1,98 % → 1,02 %). Si se descuenta lo que dejan ver, tapan un 77 % y un 57 % menos. En reposo, lo que flota sobre la foto del teléfono pasa del 12,8 % al 6,9 % de la pantalla; con la métrica del proyecto (`npm run medir`), del 9,8 % al 6,4 %. El aro frente a su contorno queda **≥ 3:1 sobre cualquier suelo**: 3,17:1 en el peor caso teórico (blanco puro), entre 4,8 y 9:1 en los suelos de la demo y entre 6,6 y 11:1 medido en las capturas. El resalte queda ≥ 3,26:1 con el champán y ≥ 3,1:1 con cualquier color de marca (hoy, 1,57:1 sobre blanco). Con «Reducir transparencia» todo es opaco (21:1).

### Hojas de comparación (para enseñar al cliente)

- Teléfono 390 × 844, antes y después en tema claro y oscuro, de día, de noche y en reposo: `/tmp/claude-0/-home-user-creatorflow-ai/9aa10f93-9bbe-52c5-91f2-e21dabbb4196/scratchpad/auditoria-f4/visual/transparencias/hoja-movil-390.png`
- Escritorio 1440 × 900, antes y después en tema claro y oscuro, de día y de noche: `/tmp/claude-0/-home-user-creatorflow-ai/9aa10f93-9bbe-52c5-91f2-e21dabbb4196/scratchpad/auditoria-f4/visual/transparencias/hoja-escritorio-1440.png`
- Estados ampliados (suelo claro, fondo oscuro, ratón, foco de teclado, reposo, «Reducir transparencia», pista, tarjeta y radar del teléfono): `/tmp/claude-0/-home-user-creatorflow-ai/9aa10f93-9bbe-52c5-91f2-e21dabbb4196/scratchpad/auditoria-f4/visual/transparencias/hoja-estados.png`

## 1 · Qué se aligera y qué no

| Pieza | Decisión | Por qué |
|---|---|---|
| **T1 · Flechas del suelo** | Más finas, algo menores y translúcidas, con contorno fino. La cercana encoge. Resalte claro. A media opacidad en reposo | Es lo que pide el cliente, y es la pieza que más foto tapa fuera de la interfaz: siempre a la vista, también en reposo, y enorme en el teléfono (el FOV vertical de 80° deja un FOV horizontal de 42°) |
| **T2 · Rótulos de las flechas y puntos «i»** | Se apartan en reposo, como el resto de la interfaz, y vuelven con cualquier gesto. El rótulo de la flecha resaltada se ilumina | Son texto: no pueden ser translúcidos (AA). Lo que sí se puede es quitarlos mientras nadie los usa |
| **T3 · Pista inicial** («Arrastra para mirar…») | Compacta, en su sitio: píldora y letra de interfaz | Es texto. Probé a moverla abajo, pero pisaba justo las flechas que explica. Sale una vez y dura 6 s |
| **T4 · Radar del teléfono** | Pasa al vidrio de icono (`--vidrio`) | Por debajo de 130 px no lleva rótulos, solo trazos y la «N», así que basta 3:1. Además, sigue a la vista en reposo |
| **T5 · Tarjeta del teléfono en reposo** | Se recoge en una píldora a la derecha, la misma que en el paseo libre | En reposo era una barra de lado a lado |

En el apartado 4 está lo que no cambia y por qué.

## 2 · T1 · Flechas del suelo (`visor.js`)

### 2.1 Valores por estado

| Estado | Aro y flecha | Contorno (aro y flecha) | Tamaño | Rótulo |
|---|---|---|---|---|
| **Despierta** | blanco `#ffffff` al **75 %** (hoy 90 %) | negro al **52 %** (hoy 45 %) | escala por cercanía (2.2) | vidrio de texto, como hoy |
| **Ratón encima / foco en el rótulo** | color de marca `--c-acento` (champán `#cfad66` por defecto) al **100 %**, con la salvaguarda de 2.5 | negro al **65 %** | **× 1,12** | relleno de acento y `--c-sobre-acento`, igual que su `:hover` |
| **Interfaz en reposo** (`body.ui-inactiva`) | blanco al **37,5 %** (× 0,5) | negro al **26 %** (× 0,5) | igual | **oculto** (opacidad 0, sin toques), salvo si tiene el foco |
| **«Reducir transparencia»** | blanco **opaco** | negro **opaco** (también en el resalte) | igual | opaco por los tokens, como hoy |
| **«Reducir movimiento»** | igual que arriba | igual | igual | igual |

Los cambios de opacidad (despierta ↔ reposo) se hacen con un **fundido de 380 ms** (`--d-3`, con la curva de salida `x·(2−x)`). Con «Reducir movimiento» el cambio es inmediato. Los rótulos usan la transición CSS `opacity var(--d-3) var(--suave)`.

### 2.2 Geometría y tamaño

| Pieza | Hoy | Propuesta |
|---|---|---|
| Aro (`geoAro`) | `RingGeometry(0.32, 0.42, 48)`: 10 cm de grosor | `RingGeometry(0.3, 0.355, 64)`: **5,5 cm** |
| Contorno (`geoHalo`) | `RingGeometry(0.28, 0.47, 48)`: 4 cm por dentro y 5 cm por fuera | `RingGeometry(0.275, 0.38, 64)`: **2,5 cm a cada lado** |
| Flecha central (`geoFlecha`) | 32 × 40 cm, **sin contorno** (queda en el hueco del contorno, sobre el suelo) | la misma forma al **72 %** (23 × 29 cm) |
| Contorno de la flecha (nuevo `geoFlechaHalo`) | — | la misma forma al **95 %**, con `matHalo` y `renderOrder 1` |
| Diámetro exterior | 94 cm | 76 cm × escala |
| Escala | 1 | `k = clamp(dist3D / 3,4; 0,62; 1) × (camara.aspect < 0,8 ? 0,78 : 1)`, con `dist3D = hypot(r, alturaCámara)`. La resaltada lleva `k × 1,12` |
| Disco de toque (`geoDisco`, 60 cm de radio) | 1 | `max(k; 0,75)`: nunca menor que el 75 % |

**¿Se desvanece más la más cercana?** No. Bajarle la opacidad la dejaría por debajo de 3:1 sobre suelos claros. En su lugar **encoge** (hasta el 62 %), lo que compensa la perspectiva (la cercana se proyectaba 1,8 veces más grande que la lejana; ahora las dos se ven casi del mismo tamaño) y elimina la mayor parte de lo que tapaba. **¿Se adelgazan o se achican?** Las dos cosas: el aro pierde casi la mitad de su grosor y un 15 % de radio. En el teléfono en vertical, todo va además al 78 %.

### 2.3 Contraste

Analítico, con la mezcla en sRGB, como la hace three r185 con `outputColorSpace = SRGBColorSpace`. Se mide el aro (o la flecha) frente a su contorno, y el contorno frente al suelo:

| Suelo | Hoy despierta: aro/contorno · contorno/suelo | Hoy, flecha central/suelo | **Propuesta despierta**: aro/contorno · contorno/suelo · aro/suelo | **Resalte**: aro/contorno (hoy) | **Reposo**: aro/contorno |
|---|---|---|---|---|---|
| Blanco puro `#ffffff` | 3,03 · 3,35 | **1,00** | **3,17** · 4,27 · 1,35 | **3,26** (1,57) | 1,29 |
| Mármol `#f2f0ec` | 3,36 · 3,28 | 1,12 | **3,45** · 4,15 · 1,20 | 3,54 (1,75) | 1,36 |
| Roble claro de la demo `#cfb48c` | 5,09 · 2,93 | 1,87 | **4,84** · 3,57 · 1,36 | 4,83 (2,72) | 1,72 |
| Gris cemento de la demo `#9b9893` | 6,54 · 2,64 | 2,63 | **5,92** · 3,13 · 1,89 | 5,71 (3,56) | 2,02 |
| Nogal de la demo `#6e4a2f` | 11,45 · 1,76 | 6,71 | **8,99** · 1,90 · 4,72 | 7,93 (6,45) | 2,96 |
| Casi negro `#1a1a1a` | 15,57 · 1,11 | 14,22 | **10,99** · 1,12 · 9,81 | 9,31 (9,01) | 3,51 |

- **Despierta:** el aro y la flecha quedan **≥ 3:1 frente a su contorno sobre cualquier suelo**. La pieza entera también se separa del suelo con ≥ 3:1: por su contorno en los suelos claros (de 3,13 a 4,27) y por el aro en los oscuros (de 4,72 a 9,81). Hoy, el contorno no llega a 3:1 sobre el roble ni sobre el cemento, y la flecha central se pierde en los suelos blancos.
- **Resalte:** ≥ 3,26:1 sobre cualquier suelo. Hoy, el champán sobre un suelo claro se queda en 1,57–2,72:1.
- **Reposo:** entre 1,3 y 3,5:1. **Es suficiente por diseño:** es un estado ambiental en el que nadie está usando la interfaz (que entera pasa a opacidad 0), y cualquier gesto devuelve las flechas a ≥ 3:1 en 380 ms. Un toque sobre una flecha en reposo la sigue activando, como hoy. Si se quisiera 3:1 también en reposo, la única opción es no atenuarlas (`OPACIDAD_FLECHAS.reposo = 1`): se mantiene la ganancia de grosor y tamaño (−71 % y −48 % de superficie).
- **«Reducir transparencia»:** 21:1.

Medido en las capturas (mediana de los puntos visibles, aro frente a su contorno exterior; entre paréntesis, el peor punto). Las bandas del contorno miden pocos píxeles, así que la medida es aproximada:

| Captura | Hoy | Propuesta |
|---|---|---|
| 1440, claro, día (baldosa y madera) | 12,6 (7,6) | 9,5 (6,7) |
| 1440, estilo nórdico (suelo claro) | 7,5 (6,8) | 6,6 (6,1) |
| 1440, estilo industrial | 14,2 (12,0) | 10,4 (9,2) |
| 1440, noche | 13,0 (8,3) | 9,7 (7,1) |
| 1440, ratón encima | 10,1 (3,8) | 8,8 (5,8) |
| 1440, en reposo | 12,6 (7,6) | 3,1 (2,2) |
| 1440, noche con «Reducir transparencia» | — | 21,0 |
| 390, claro: día · nórdico · noche · reposo | 11,7 · 8,3 · 12,0 · 11,7 | 10,9 · 7,5 · 11,0 · 3,5 |

El tema oscuro da las mismas cifras (±0,3), porque las flechas no dependen del tema salvo el color del resalte.

### 2.4 Dónde va (`visor.js`, líneas del commit `1b677cf`)

**E1 · l. 441–453** (de `const geoAro` a `const matInvisible`), sustituir por:

```js
// Flecha del suelo (fase 4, transparencias): aro fino y translúcido con un contorno oscuro fino a los dos lados; la flecha
// central lleva su propio contorno. Aro frente a su contorno ≥ 3:1 en cualquier suelo (blanco puro: 3,17:1). Las opacidades
// cambian con el estado de la interfaz (opacidadFlechas) y el tamaño con la distancia y la pantalla (escalarFlecha).
const OPACIDAD_FLECHAS = { aro: 0.75, contorno: 0.52, contornoResalte: 0.65, reposo: 0.5 };
const geoAro = new THREE.RingGeometry(0.3, 0.355, 64).rotateX(-Math.PI / 2);
const geoDisco = new THREE.CircleGeometry(0.6, 32).rotateX(-Math.PI / 2);
const geoHalo = new THREE.RingGeometry(0.275, 0.38, 64).rotateX(-Math.PI / 2);
const formaFlecha = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, -0.2); s.lineTo(0.16, 0.06); s.lineTo(0.06, 0.06); s.lineTo(0.06, 0.2);
  s.lineTo(-0.06, 0.2); s.lineTo(-0.06, 0.06); s.lineTo(-0.16, 0.06); s.closePath();
  return s;
})();
const geoFlecha = new THREE.ShapeGeometry(formaFlecha).scale(0.72, 0.72, 1).rotateX(-Math.PI / 2);
const geoFlechaHalo = new THREE.ShapeGeometry(formaFlecha).scale(0.95, 0.95, 1).rotateX(-Math.PI / 2); // contorno de la flecha
const matHalo = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: OPACIDAD_FLECHAS.contorno, depthTest: false });
const matHaloHover = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: OPACIDAD_FLECHAS.contornoResalte, depthTest: false });
const matAro = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: OPACIDAD_FLECHAS.aro, depthTest: false });
const matAroHover = new THREE.MeshBasicMaterial({ color: 0xcfad66, transparent: true, opacity: 1, depthTest: false }); // color: --c-acento (colorResalte)
const matInvisible = new THREE.MeshBasicMaterial({ visible: false });
```

**E2 · `construirPuntos()`:**
- l. 482–484: el contorno de la flecha, con el del aro:
  ```js
      const halo = new THREE.Mesh(geoHalo, matHalo);
      const flechaHalo = new THREE.Mesh(geoFlechaHalo, matHalo);
      halo.renderOrder = flechaHalo.renderOrder = 1;
      g.add(halo, flechaHalo);
  ```
- l. 490: `g.userData = { destino, partes: [aro, flecha], halos: [halo, flechaHalo], hit, dist: Math.hypot(r, alt) };`
- Detrás de l. 498 (`etq.onclick = …`):
  ```js
      g.userData.etq = etq;
      etq.addEventListener("pointerenter", () => resaltarFlecha(g));
      etq.addEventListener("pointerleave", () => resaltarFlecha(null));
      etq.addEventListener("focus", () => resaltarFlecha(g));
      etq.addEventListener("blur", () => resaltarFlecha(null));
      escalarFlecha(g);
  ```

**E3 · `hover()` (l. 1118–1127):** las cuatro líneas que cambian los materiales, fijan `hoverActual` y llaman a `tocarEscena()` (l. 1122–1125) pasan a ser `resaltarFlecha(g);`. Justo detrás de la función van `escalarFlecha`, `resaltarFlecha`, `opacidadFlechas` y `colorResalte`:

```js
/** Tamaño de la flecha: la perspectiva ya agranda las cercanas, así que encogen (hasta el 62 %); en una pantalla estrecha
    (vertical: campo de visión horizontal corto) todas al 78 %; la resaltada, +12 %. El disco de toque no baja del 75 %. */
function escalarFlecha(g) {
  const k = THREE.MathUtils.clamp(g.userData.dist / 3.4, 0.62, 1) * (camara.aspect < 0.8 ? 0.78 : 1);
  const kv = k * (g === hoverActual ? 1.12 : 1);
  for (const m of [...g.userData.halos, ...g.userData.partes]) m.scale.setScalar(kv);
  g.userData.hit.scale.setScalar(Math.max(k, 0.75));
}
/** Resalte (ratón sobre el aro o su rótulo, o foco de teclado en el rótulo): aro y flecha en el acento, contorno más
    oscuro, +12 % y el rótulo en acento. Una sola flecha resaltada a la vez. */
function resaltarFlecha(g) {
  g ??= null; // apuntar() devuelve undefined fuera de las flechas
  if (g === hoverActual) return;
  const previo = hoverActual;
  hoverActual = g;
  if (previo) {
    previo.userData.partes.forEach((m) => (m.material = matAro));
    previo.userData.halos.forEach((m) => (m.material = matHalo));
    previo.userData.etq.classList.remove("resaltada");
    escalarFlecha(previo);
  }
  if (g) {
    g.userData.partes.forEach((m) => (m.material = matAroHover));
    g.userData.halos.forEach((m) => (m.material = matHaloHover));
    g.userData.etq.classList.add("resaltada");
    escalarFlecha(g);
  }
  tocarEscena();
}
/** Opacidad según el estado: despierta 0,75 / 0,52; con la interfaz en reposo (ui-inactiva), la mitad, con un fundido
    de 380 ms (--d-3); con «Reducir transparencia», opacas y sin atenuar; con «Reducir movimiento», sin fundido. */
let fundidoFlechas = 0;
function opacidadFlechas() {
  const opacas = transparenciaReducida();
  const f = !opacas && document.body.classList.contains("ui-inactiva") ? OPACIDAD_FLECHAS.reposo : 1;
  const fin = { aro: opacas ? 1 : OPACIDAD_FLECHAS.aro * f, halo: opacas ? 1 : OPACIDAD_FLECHAS.contorno * f };
  matHaloHover.opacity = opacas ? 1 : OPACIDAD_FLECHAS.contornoResalte;
  cancelAnimationFrame(fundidoFlechas);
  const ini = { aro: matAro.opacity, halo: matHalo.opacity }, t0 = performance.now(), dur = reducido() ? 0 : 380;
  const paso = (ahora) => {
    const x = dur ? Math.min(1, (ahora - t0) / dur) : 1, e = x * (2 - x);
    matAro.opacity = ini.aro + (fin.aro - ini.aro) * e;
    matHalo.opacity = ini.halo + (fin.halo - ini.halo) * e;
    tocarEscena();
    if (x < 1) fundidoFlechas = requestAnimationFrame(paso);
  };
  fundidoFlechas = requestAnimationFrame(paso);
}
/** Color del resalte: el acento de la marca con su tono y su saturación; solo cambia la luminosidad si hace falta: más
    clara para leerse sobre su contorno (luminancia ≥ 0,42: ≥ 3:1 incluso sobre un suelo blanco), más oscura si es casi
    blanco, para distinguirse del aro en reposo (≤ 0,75). El champán por defecto (0,44) no cambia. */
const hslResalte = { h: 0, s: 0, l: 0 };
function colorResalte(acento) {
  const c = matAroHover.color.set(acento); // canales lineales (three r152+): la luminancia relativa es su media ponderada
  const lum = () => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  c.getHSL(hslResalte, THREE.SRGBColorSpace);
  const paso = (d) => c.setHSL(hslResalte.h, hslResalte.s, (hslResalte.l = THREE.MathUtils.clamp(hslResalte.l + d, 0, 1)), THREE.SRGBColorSpace);
  for (let i = 0; i < 50 && lum() < 0.42; i++) paso(0.02);
  for (let i = 0; i < 50 && lum() > 0.75; i++) paso(-0.02);
}
```

**E4 · `interaccion()` (l. 998):** `if (document.body.classList.contains("ui-inactiva")) { document.body.classList.remove("ui-inactiva"); opacidadFlechas(); }`

**E5 · bucle (l. 2935):** `if (inactiva !== document.body.classList.contains("ui-inactiva")) { document.body.classList.toggle("ui-inactiva", inactiva); opacidadFlechas(); }`

**E6 · `colorearTema()` (l. 1506):** `if (acento) colorResalte(acento);`, en lugar de `matAroHover.color.set(acento)`.

**E7 · oyente de `cre8:tema` (l. 1509–1513):** añadir `opacidadFlechas(); // «Reducir transparencia»: flechas opacas` como última línea del oyente y una llamada `opacidadFlechas();` justo después de él, para el estado inicial (`tema.js` aplica las preferencias antes de que `visor.js` escuche).

**E8 · `redimensionar()` (detrás de l. 2844, `maqueta?.redimensionar(w / h);`):** `grupoFlechas.children.forEach(escalarFlecha); // la escala de las flechas depende de la proporción (escalarFlecha)`

Frente a `1b677cf` son 92 líneas añadidas y 16 quitadas en `visor.js` (3 y 1 en `plano.js`), sin dependencias nuevas. Hay una malla más por flecha (el contorno de la flecha, con material compartido) y el fundido solo corre cuando cambia el estado: 0 fotogramas en reposo, como hoy.

### 2.5 Salvaguarda del color de marca

El resalte usa el color de la marca. Si ese color es muy oscuro, no se leería sobre su contorno; si es casi blanco, no se distinguiría del aro en reposo. `colorResalte` conserva el tono y la saturación y solo mueve la luminosidad hasta dejar la luminancia relativa entre 0,42 y 0,75. Comprobado así: champán `#cfad66` sin cambios; el champán del tema claro `#c9a55a` pasa a `#cca962` (imperceptible); el azul marino `#1a2b5c` pasa a `#9caee3`; el rojo `#b00020`, a `#ff91a5`; el verde `#2e7d32`, a `#61c566`; el azul `#0000ff`, a `#adadff`; y el blanco, a `#e0e0e0`. Con un acento casi blanco, el resalte se apoya además en el tamaño (+12 %), en el contorno más oscuro (65 %) y en el rótulo.

## 3 · El resto de piezas (`visor.css`, `paneles.css`, `plano.js`)

### T2 · Rótulos de las flechas y puntos «i»: se apartan en reposo y el rótulo resaltado se ilumina

`visor.css`:
- l. 283 y l. 290 (`transition` de `.etq` y de `.info`): añadir `opacity var(--d-3) var(--suave), ` al principio de la lista.
- l. 284: `.etq.c8-vidrio:is(:hover, :focus-visible, .resaltada) { … }`, es decir, añadir `.resaltada` a la regla del `:hover`, sin otros cambios.
- Detrás de l. 294 (`.info::after`):
  ```css
  /* En reposo (body.ui-inactiva) los rótulos de las flechas y los puntos «i» se apartan como la interfaz; las flechas quedan a
     media opacidad (visor.js, opacidadFlechas). Con el foco de teclado, el rótulo sigue a la vista. */
  body.ui-inactiva #etiquetas :is(.etq, .info):not(:focus-visible) { opacity: 0; pointer-events: none; }
  ```

Contraste: sin cambios. Los rótulos siguen en `--vidrio-texto` (AA), y el estado resaltado es el mismo par `--c-acento` / `--c-sobre-acento` del `:hover`, que ya cubre la prueba de contraste AA de `npm run prueba:todo`. Mientras están ocultos no reciben toques (`pointer-events: none`), así que un toque en ese sitio cae en el lienzo y, si cae sobre la flecha, que sigue visible, la activa. Por eso **no** hay que añadirlos a `enHudOculto()`.

### T3 · Pista inicial: compacta, en su sitio

`visor.css` l. 199: `#pista { pointer-events: none; animation: pista 2.2s var(--suave) 2; padding: var(--e-2) var(--e-4); border-radius: var(--r-pastilla); font: var(--peso-medio) var(--t-ui) / 1.3 var(--fuente); }`

Pasa de 16 a 14 px, con 8 × 16 px de relleno y forma de píldora. En el teléfono pasa de 367 × 42 a 326 × 33 px (−30 % de superficie); en el escritorio, de 358 × 47 a 310 × 36 px (−34 %). Sigue en `--vidrio-texto` (AA). `#tarjeta-juego`, que comparte la regla de l. 196, no cambia.

### T4 · Radar del teléfono: vidrio de icono

`plano.js` l. 197 (la única línea fuera de los tres archivos previstos; así el umbral de 130 px sigue en un solo sitio):

```js
    const rotulos = T.radar ? Math.min(W, H) >= 130 : grande || T.esc > 22;
    if (T.radar) canvas.parentElement?.toggleAttribute("data-sin-rotulos", !rotulos); // visor.css: sin rótulos, vidrio de icono
    if (rotulos) {
```

`visor.css`, detrás de l. 70:

```css
/* Sin rótulos (radar de menos de 130 px: plano.js pone data-sin-rotulos) solo lleva trazos y la «N»: vidrio de icono (≥ 3:1).
   Sin backdrop-filter, todo el vidrio pasa a --vidrio-denso (tema.css): esta regla no entra. */
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  #radar .disco.c8-vidrio[data-sin-rotulos] { background: var(--vidrio); }
}
```

- Contraste en el peor caso, sobre `--vidrio` con la foto más desfavorable detrás: los muros (`--c-texto` al 90 %) quedan a 3,76:1 en claro y 3,37:1 en oscuro, y la «N» a 4,23:1 y 3,75:1. Todo ≥ 3:1. En claro, el vidrio pasa del 78 % al 50 % de blanco; en oscuro, del 78 % al 56 % (el vidrio adaptativo lo baja más cuando la foto lo permite).
- En el teléfono el radar mide 88 px y no lleva rótulos. En el escritorio (142 px, con rótulos) no cambia nada: sigue en `--vidrio-texto`. Con la letra grande, cuando el radar del teléfono ya cabe con rótulos, vuelve solo a `--vidrio-texto`.

### T5 · Tarjeta del teléfono en reposo: píldora a la derecha

`paneles.css`, detrás de l. 196 (las reglas de reposo). Es la misma píldora del paseo libre (l. 199–202) aplicada a la hoja en reposo:

```css
/* Hoja del móvil en reposo: la misma píldora a la derecha que en el paseo libre («349.000 € · Contactar»), que deja ver la foto a lo ancho */
body.ui-inactiva .pn-raiz.pn-disp-hoja:not(.pn-con-dialogo):not(.pn-con-menu):not(.pn-capturando) .pn-tarjeta:not(.pn-abierto):not(:focus-within) {
  left: auto; right: calc(var(--pn-margen) + var(--pn-der)); bottom: calc(var(--pn-margen) + var(--pn-inf)); width: auto; height: auto;
  max-width: calc(100vw - 2 * var(--pn-margen)); margin: 0; transform: none; transition: none; border-radius: var(--r-5, 1.75rem); border-bottom-width: 1px; }
body.ui-inactiva .pn-raiz.pn-disp-hoja:not(.pn-con-dialogo):not(.pn-con-menu):not(.pn-capturando) .pn-tarjeta:not(.pn-abierto):not(:focus-within) .pn-t-cab {
  padding: var(--e-2, 0.5rem) var(--e-2, 0.5rem) var(--e-2, 0.5rem) var(--e-4, 1rem); }
body.ui-inactiva .pn-raiz.pn-disp-hoja:not(.pn-con-dialogo):not(.pn-con-menu):not(.pn-capturando) .pn-tarjeta:not(.pn-abierto):not(:focus-within) :is(.pn-asa, .pn-panel) { display: none; }
```

- La píldora mide 228 × 60 px y queda a 11 px del borde derecho; antes era una barra de lado a lado (390 px). El texto sigue en el vidrio de la tarjeta (AA).
- El `display: none` no quita nada a los lectores de pantalla: el asa es `aria-hidden` y el panel ya es `inert` mientras la ficha está cerrada. Los botones que se recogen siguen ocultos solo a la vista, como hoy (A11).
- Al despertar, la tarjeta vuelve entera al instante, sin desplazamiento. Lo comprobé con fotogramas a 0, 90, 180, 300 y 600 ms.

## 4 · Lo que no cambia, y por qué

- **Tira de estancias, modos, título del lugar y barra de vista:** llevan texto (AA con `--vidrio-texto`) y ya desaparecen del todo en reposo (`visor.css` l. 45). Hacerlos más translúcidos despiertos rompería el AA a cambio de poco.
- **«Ampliar» del radar y demás botones sueltos solo icono:** ya están en `--vidrio`, el token más ligero que mantiene 3:1.
- **Barra de vista** (la pastilla de iconos de arriba a la derecha, que en el teléfono es una columna): su vidrio es `--vidrio-texto` aunque solo lleva iconos, así que podría bajar a `--vidrio` (iconos ≥ 3:1). Queda para después, por dos motivos. Ya desaparece en reposo. Y otra auditoría de la fase 4 ya señaló que su estado pulsado (relleno de acento) apenas se distingue en tema claro, lo que depende justo de ese fondo. Conviene decidirlo junto con esa corrección y medir el pulsado sobre `--vidrio`.
- **Radar del escritorio:** a partir de 130 px dibuja los nombres de las estancias, que son texto, así que sigue en `--vidrio-texto`.
- **Tarjeta despierta, ficha, diálogos, menús y avisos:** texto que se lee con atención. Se quedan en `--vidrio-texto` o `--vidrio-denso`.
- **El vidrio de los puntos «i»:** no se aligera. Sobre `--vidrio`, su «i» de acento caería a 1,34:1 en claro y a 2,15:1 en oscuro. Pasarla a `--c-texto` la sostendría, pero perdería la seña de acento que los hace descubribles. Bastan 36 px y apartarse en reposo (T2).
- **El vidrio adaptativo** (`data-luz-max` / `data-luz-min`): ya aligera todo el vidrio cuando la foto lo permite. No se toca.
- **Las flechas siguen dibujándose por encima de los muebles** (`depthTest: false`): es a propósito, para que nunca queden escondidas. Ahora, al ser más finas y translúcidas, el efecto es más discreto.

## 5 · «Reducir transparencia», «Reducir movimiento» y contingencias

- **Reducir transparencia** (`data-transparencia="reducida"`): aro, flecha y contornos opacos (incluido el resalte) y sin atenuar en reposo. Los rótulos, la pista, el radar y la tarjeta son opacos por los tokens (`--vidrio` → `--c-sup-2`, `--vidrio-texto` → `--c-sup-1`). Comprobado en reposo y despierta.
- **Reducir movimiento:** el cambio de opacidad de las flechas es inmediato (`reducido()`), y las transiciones CSS duran 1 ms (`--d-3` en `tema.css`).
- **Sin `backdrop-filter`:** T4 no entra y el radar sigue en `--vidrio-denso`, como el resto del vidrio.
- **Teclado:** el foco en un rótulo resalta su flecha y el rótulo enfocado no se oculta en reposo. Hay pruebas de los dos casos.
- **Táctil:** no hay estado de ratón encima (como hoy). Un toque en una flecha la activa también en reposo.
- **Colores de marca extremos:** cubiertos en 2.5.

## 6 · Cómo se ha probado y qué queda para el núcleo

- **Capturas:** 62 de antes y después (390 × 844 y 1440 × 900, tema claro y oscuro; día, noche, estilos nórdico e industrial; reposo, ratón y «Reducir transparencia»), sin errores de consola.
- **Medidas:** la huella de las flechas (diferencia con y sin flechas, con la interfaz oculta), la pantalla tapada, el contraste en puntos proyectados sobre el aro, el contorno y el suelo, y la métrica del proyecto (`npm run medir`): teléfono despierta 22,6 % → 22,6 %, en reposo **9,8 % → 6,4 %**; portátil 16,9 % y 3,3 % sin cambios. Los rótulos ocultos en reposo bajan los controles a la vista de 5 a 4 en el teléfono y de 6 a 4 en el portátil.
- **Prueba de humo de la implementación de referencia** (`espec.mjs`, que aplica exactamente los cambios de este documento sobre las copias de los archivos): 28 comprobaciones en verde, entre ellas las opacidades por estado, la escala, el radar, la píldora, «Reducir transparencia», «Reducir movimiento», el ratón, el foco, el cambio de proporción, la salvaguarda del color y la consola sin errores.
- **Pruebas e2e existentes que tocan esto, sin cambios necesarios:**
  - `e2e-paneles.mjs` 12 f: en 390 × 844, los botones se ocultan solo a la vista. Sigue igual.
  - «Núcleo real: interfaz inactiva»: la tarjeta con el precio y «Contactar» en reposo. Sigue igual, ahora en la píldora.
  - A6/A10: Tab y foco en un rótulo. El Tab despierta la interfaz y `:focus-visible` mantiene el rótulo a la vista.
- **Para el núcleo al aplicarlo:**
  1. Llevar estas comprobaciones a la batería e2e del núcleo: opacidades 0,75 / 0,52 → 0,375 / 0,26 en reposo → 1 / 1 con «Reducir transparencia»; rótulos con opacidad 0 en reposo y el enfocado a la vista; `data-sin-rotulos` en el teléfono y no en el escritorio; la píldora en reposo; el resalte con ratón y con foco.
  2. Volver a pasar `npm run medir` (objetivo: teléfono en reposo ≈ 6,4 %).
  3. Pasar `npm run prueba:todo`.

## 7 · Archivos de esta propuesta (fuera del repositorio)

Carpeta `/tmp/claude-0/-home-user-creatorflow-ai/9aa10f93-9bbe-52c5-91f2-e21dabbb4196/scratchpad/auditoria-f4/visual/transparencias/`:
- `espec.mjs`: la implementación de referencia de este documento (las ediciones E1–E8, `plano.js` y el CSS). Trabaja sobre las copias de `1b677cf` que hay en `base-1b677cf/`, donde también están sus resultados: `visor-espec.js` y `plano-espec.js`.
- `humo.mjs`: su prueba de humo.
- `medir-espec.mjs`: la métrica del proyecto, antes y después.
- `proto.mjs` y `capturar.mjs`: el prototipo y las capturas. Mismos valores visuales; el radar se probó con una consulta de 540 px en lugar del atributo.
- `huella.mjs` / `huella.py`, `medir.py` y `analitico.py` (con su salida en `analitico.txt`): las medidas y el contraste.
- `capturas/`, `huella/`, `extra/` y `humo/`: las imágenes.
- `hojas.py`: genera las tres hojas.
