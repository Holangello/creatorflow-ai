// Vista "maqueta" (dollhouse): la vivienda vista desde arriba en 3D, con estancias, m² y
// pines de las fotos 360. Usa el modelo real (demo/GLB) si existe o un esquema extruido
// a partir de los muros del plano. Cada estancia con foto 360 lleva su propia foto proyectada desde el punto donde se hizo
// sobre su suelo y sus paredes (como el dollhouse de Matterport, con una sola foto por estancia); sin foto, su color.
// La vivienda flota sobre el fondo del tema (--c-sup-2: claro en claro, oscuro en oscuro); se repinta con "cre8:tema".
// Barra del sol: fijarSol() mueve el sol con su posición exacta (sol.js) y los muros echan sombra sobre las estancias; con
// el modelo de la demo la luz la pone el propio modelo (demo.js).
import * as THREE from "three";
import { areaPoligono, puntoEtiqueta, puntoEnPoligono } from "./util.js";
import { GLSL_LUZ_FOTOS } from "./luz-fotos.js";

const ALTO_MURO = 2.5;
const COLORES = [0xe9dcc6, 0xd6e2d3, 0xd9dbe8, 0xeed9cf, 0xdfe7ea, 0xe8e2c9, 0xe2d4e6];
/** Fondo de la maqueta según el tema. Contingencia: sin tema.css, el gris oscuro de siempre. */
function colorFondo() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--c-sup-2").trim();
  return new THREE.Color(/^#[0-9a-f]{3,6}$/i.test(v) ? v : "#1a1d22");
}

/** Material de una estancia con su foto 360: cada punto del suelo o de la pared toma el color de la foto en la dirección
    en que se ve desde la cámara (centro), con la luz de la barra del sol (sol de ahora entrando por las ventanas y tono del
    momento) igual que en el recorrido. Sin foto todavía (cargando), el color de la estancia. */
function materialFoto(uSol, sim, base) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...uSol, sim, foto: { value: null }, hayFoto: { value: 0 }, base: { value: new THREE.Color(base) }, resalte: { value: 0 }, exterior: { value: 0 },
      centro: { value: new THREE.Vector3() }, yaw: { value: 0 }, nMuros: { value: 0 }, altos: { value: new THREE.Vector2(1.5, 2.6) },
      muros: { value: Array.from({ length: 16 }, () => new THREE.Vector4()) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vPos; varying vec3 vNormal;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vPos = w.xyz; vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D foto; uniform float hayFoto, yaw, nMuros, resalte, exterior; uniform vec3 base, centro; uniform vec2 altos, sim;
      uniform vec4 muros[16];
      varying vec3 vPos; varying vec3 vNormal;
      ${GLSL_LUZ_FOTOS}
      void main() {
        vec3 c;
        if (hayFoto > 0.5) {
          vec3 P = vPos - centro, d = normalize(P);
          vec2 uv = uvDe(d, yaw);
          c = texture2D(foto, uv).rgb;
          if (nMuros > 0.0) c = relucirEn(c, P, normalize(vNormal), muros, nMuros, altos, foto, yaw, foto, 0.0);
          c = simular(c, d.y, sim, sim.y > 0.0 ? focos(foto, uv, foto, 0.0) : vec2(0.0), exterior);
        } else c = base * (1.0 - 0.5 * sim.y);
        gl_FragColor = vec4(mix(c, vec3(1.0), resalte), 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.DoubleSide,
  });
}

export function crearMaqueta(ctx) {
  const camara = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
  // Los controles de órbita se cargan la primera vez que se abre la maqueta (la carga inicial queda más ligera).
  let controles = null;
  async function prepararControles() {
    if (controles) return;
    const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
    if (controles) return;
    controles = new OrbitControls(camara, ctx.lienzo);
    controles.enabled = false;
    controles.enableDamping = true;
    controles.maxPolarAngle = Math.PI * 0.45;
    controles.minDistance = 3;
    controles.maxDistance = 80;
    controles.screenSpacePanning = false;
    controles.addEventListener("start", () => { movida = true; }); // arrastre, rueda o pellizco del visitante
    // Teclado (WCAG 2.1.1), con el foco en el lienzo: ← → giran, ↑ ↓ inclinan, + − acercan y alejan
    ctx.lienzo.addEventListener("keydown", (e) => {
      if (!activa || e.ctrlKey || e.metaKey || e.altKey) return;
      const f = { ArrowLeft: () => controles.rotateLeft(0.15), ArrowRight: () => controles.rotateLeft(-0.15), ArrowUp: () => controles.rotateUp(0.1),
        ArrowDown: () => controles.rotateUp(-0.1), Equal: () => acercar(true), NumpadAdd: () => acercar(true), Minus: () => acercar(false), NumpadSubtract: () => acercar(false) }[e.code];
      if (f) { e.preventDefault(); f(); movida = true; }
    });
  }
  /** Acercar o alejar sin rueda ni pellizco (teclado y «Más» en táctil · WCAG 2.5.1). */
  const acercar = (si) => { if (activa && controles) { controles[si ? "dollyIn" : "dollyOut"](1.25); movida = true; } };

  const capa = document.createElement("div");
  capa.id = "maqueta-capa";
  capa.hidden = true;
  ctx.contenedor.append(capa);

  // movida: el visitante ya ha girado o acercado la maqueta (desde entonces no se vuelve a encuadrar al girar la pantalla)
  let escena = null, usaModelo = false, construida = false, activa = false, movida = false, fondoPrevio;
  let luzSol = null; // { e: estado del sol (sol.js), luz, hemi, sombra, caja } en el esquema
  const fotos = { estancias: 0, cargadas: 0 }; // maqueta con fotos: estancias con foto y fotos ya en la GPU
  const etiquetas = [];
  const superficies = [];
  const rayo = new THREE.Raycaster();
  let hover = null;

  const elev = (plantaId) => {
    const t = ctx.tour();
    const i = Math.max(0, (t.plantas ?? []).findIndex((p) => p.id === plantaId));
    return t.plantas?.[i]?.elevacion ?? i * 3.2;
  };

  function construir() {
    construida = true;
    const t = ctx.tour();
    const modelo = ctx.modeloLibre();
    usaModelo = !!modelo;
    escena = usaModelo ? ctx.escenaLibre : new THREE.Scene();
    if (!usaModelo) {
      escena.background = colorFondo();
      const hemi = new THREE.HemisphereLight(0xffffff, 0x404040, 2.2);
      escena.add(hemi);
      const sol = new THREE.DirectionalLight(0xffffff, 1.4);
      sol.position.set(8, 20, 6);
      escena.add(sol, sol.target);
      const matMuro = new THREE.MeshStandardMaterial({ color: 0xf2efe9, roughness: 0.9 });
      const caja = new THREE.Box3();
      for (const p of t.plantas ?? []) {
        const y0 = elev(p.id);
        for (const [x1, z1, x2, z2] of p.muros ?? []) {
          const largo = Math.hypot(x2 - x1, z2 - z1) + 0.12;
          const m = new THREE.Mesh(new THREE.BoxGeometry(largo, ALTO_MURO, 0.12), matMuro);
          m.position.set((x1 + x2) / 2, y0 + ALTO_MURO / 2, (z1 + z2) / 2);
          m.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
          m.castShadow = m.receiveShadow = true;
          escena.add(m);
          caja.expandByObject(m);
        }
      }
      // Sombras del sol sobre las estancias (que no se iluminan: llevan su color tal cual): un plano que solo pinta sombra
      if (!caja.isEmpty()) {
        const c = caja.getCenter(new THREE.Vector3()), tam = caja.getSize(new THREE.Vector3());
        const sombra = new THREE.Mesh(new THREE.PlaneGeometry(tam.x + 2, tam.z + 2).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.3 }));
        sombra.position.set(c.x, caja.min.y + 0.02, c.z);
        sombra.receiveShadow = true;
        sombra.renderOrder = 1;
        escena.add(sombra);
        luzSol = { luz: sol, hemi, sombra, centro: c, radio: Math.max(tam.x, tam.z) / 2 + 1, e: luzSol?.e ?? null };
      }
    }
    // Superficies de estancias: en el esquema, la foto 360 de la estancia (o su color); en el modelo, capa de resalte
    const m2DeNodo = new Map();
    (t.estancias ?? []).forEach((e, i) => {
      if (!(e.poligono?.length > 2)) return;
      const forma = new THREE.Shape(e.poligono.map(([x, z]) => new THREE.Vector2(x, -z)));
      const geo = new THREE.ShapeGeometry(forma).rotateX(-Math.PI / 2);
      const nodo = !usaModelo && ctx.texturaMaqueta ? nodoDe(e) : null;
      const mat = nodo ? materialFoto(ctx.uniformsSol, ctx.simSol, COLORES[i % COLORES.length]) : new THREE.MeshBasicMaterial({
        color: usaModelo ? 0xffffff : COLORES[i % COLORES.length],
        transparent: true, opacity: usaModelo ? 0 : 0.95, depthWrite: !usaModelo, side: THREE.DoubleSide,
      });
      const s = new THREE.Mesh(geo, mat);
      s.position.y = elev(e.planta) + (usaModelo ? 0.03 : 0);
      s.userData = { estancia: e, opacidadBase: mat.opacity };
      s.visible = true;
      superficies.push(s);
      escena.add(s);
      if (nodo) conFoto(e, nodo, mat);
      // con foto, el pin de la foto lleva el nombre y los m² (un solo rótulo por estancia); sin foto, el rótulo de vidrio
      const conPin = nodo ?? nodoDe(e);
      if (conPin && !m2DeNodo.has(conPin.id)) { m2DeNodo.set(conPin.id, ctx.superficie(areaPoligono(e.poligono))); return; }
      const [cx, cz] = puntoEtiqueta(e.poligono);
      const el = document.createElement("div");
      el.className = "maq-estancia c8-vidrio c8-vidrio--texto";
      el.innerHTML = `<b></b><span></span>`;
      el.querySelector("b").textContent = ctx.texto(e.nombre);
      el.querySelector("span").textContent = ctx.superficie(areaPoligono(e.poligono));
      capa.append(el);
      etiquetas.push({ el, pos: new THREE.Vector3(cx, elev(e.planta) + 0.2, cz) });
    });
    // Pines de fotos 360
    for (const n of ctx.nodos()) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "maq-pin";
      b.textContent = ctx.texto(n.nombre);
      if (m2DeNodo.has(n.id)) { const m = document.createElement("span"); m.className = "m2"; m.textContent = m2DeNodo.get(n.id); b.append(m); }
      b.setAttribute("aria-label", ctx.tr("nav.ir_a", { x: ctx.texto(n.nombre) }));
      b.onclick = () => ctx.alElegirNodo(n);
      capa.append(b);
      etiquetas.push({ el: b, pos: new THREE.Vector3(n.x, elev(n.planta) + (n.altura_camara ?? t.altura_camara ?? 1.5), n.z), pin: true });
    }
    if (!usaModelo) aplicarSol();
    encuadrar();
  }

  /** La foto 360 de una estancia: la de la cámara que cae dentro (la más cercana a su centro si hay varias). */
  function nodoDe(e) {
    const dentro = ctx.nodos().filter((n) => n.planta === e.planta && puntoEnPoligono([n.x, n.z], e.poligono));
    const [cx, cz] = puntoEtiqueta(e.poligono);
    return dentro.sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz))[0] ?? null;
  }
  /** Estancia con foto: la cámara, sus muros (para el sol que entra por las ventanas) y paredes interiores con la foto,
      un poco por dentro de los muros blancos (que dan el grosor y el canto). Las paredes miran hacia dentro: las del lado
      del visitante no se pintan y se ve el interior. */
  function conFoto(e, n, mat) {
    // con fotos, el sol se ve en ellas (entra por las ventanas): la sombra de los muros sin techo confundiría
    if (luzSol?.sombra) luzSol.sombra.visible = false;
    const t = ctx.tour(), y0 = elev(e.planta), h = n.altura_camara ?? t.altura_camara ?? 1.5, techo = e.altura_techo ?? 2.6;
    const u = mat.uniforms;
    u.centro.value.set(n.x, y0 + h, n.z);
    u.yaw.value = ((n.yaw ?? 0) * Math.PI) / 180;
    u.altos.value.set(h, techo);
    u.exterior.value = e.exterior ? 1 : 0;
    const P = e.poligono;
    let k = 0;
    // al aire libre (terraza, jardín) solo el suelo con su foto: sin paredes y sin ventanas por las que entre el sol
    for (let i = 0; !e.exterior && i < P.length && k < 16; i++) { const a = P[i], b = P[(i + 1) % P.length]; u.muros.value[k++].set(a[0] - n.x, a[1] - n.z, b[0] - n.x, b[1] - n.z); }
    u.nMuros.value = k;
    const pos = [], nor = [], alto = ALTO_MURO - 0.02, dentro = 0.065;
    for (let i = 0; !e.exterior && i < P.length; i++) {
      const [ax, az] = P[i], [bx, bz] = P[(i + 1) % P.length], largo = Math.hypot(bx - ax, bz - az);
      if (largo < 0.05) continue;
      let nx = -(bz - az) / largo, nz = (bx - ax) / largo;
      if (!puntoEnPoligono([(ax + bx) / 2 + nx * 0.1, (az + bz) / 2 + nz * 0.1], P)) { nx = -nx; nz = -nz; }
      const A = [ax + nx * dentro, az + nz * dentro], B = [bx + nx * dentro, bz + nz * dentro];
      const v = [[A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], y0 + alto, B[1]], [A[0], y0 + alto, A[1]]];
      // cara hacia dentro: la normal del triángulo (0, 1, 2) es (−Δz, 0, Δx); si no mira hacia dentro, al revés
      const haciaDentro = -(B[1] - A[1]) * nx + (B[0] - A[0]) * nz > 0;
      const tri = haciaDentro ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
      for (const j of tri) { pos.push(...v[j]); nor.push(nx, 0, nz); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    const paredes = new THREE.Mesh(geo, mat.clone());
    paredes.material.uniforms = mat.uniforms; // los mismos valores (foto, cámara, sol) que el suelo
    paredes.material.side = THREE.FrontSide;
    paredes.userData.paredesFoto = true;
    escena.add(paredes);
    fotos.estancias++;
    ctx.texturaMaqueta(n).then((tex) => { if (!tex) return; u.foto.value = tex; u.hayFoto.value = 1; fotos.cargadas++; ctx.tocar?.(); }).catch(() => {});
  }

  /** La casa entera a la vista con cualquier proporción de pantalla (V4): desde arriba y en diagonal, a la distancia a la
      que caben las 8 esquinas de su caja (con los muros) en el campo de visión vertical y en el horizontal. */
  const DIR = new THREE.Vector3(0.35, 1.05, 0.95).normalize();
  /** Hueco libre de la pantalla para la casa: fracción útil (fx, fy) y la casa centrada en él con el desplazamiento de vista. */
  function hueco() {
    const W = innerWidth, H = innerHeight, rot = 56;
    const m = ctx.margenes?.() ?? { arriba: 0, abajo: 0, izq: 0, der: 0 };
    const fx = Math.max(0.45, 1 - (m.izq + m.der + 2 * rot) / W), fy = Math.max(0.45, 1 - (m.arriba + m.abajo + rot) / H);
    camara.setViewOffset(W, H, (m.der - m.izq) / 2, (m.abajo - m.arriba) / 2, W, H);
    camara.updateProjectionMatrix();
    return { fx, fy };
  }
  function encuadrar() {
    const caja = new THREE.Box3();
    for (const s of superficies) caja.expandByObject(s);
    if (caja.isEmpty()) for (const n of ctx.nodos()) caja.expandByPoint(new THREE.Vector3(n.x, 0, n.z));
    if (caja.isEmpty()) caja.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(10, 3, 10));
    caja.max.y += ALTO_MURO;
    const centro = caja.getCenter(new THREE.Vector3());
    camara.position.copy(centro).add(DIR);
    camara.lookAt(centro);
    camara.updateMatrixWorld();
    const x = new THREE.Vector3().setFromMatrixColumn(camara.matrixWorld, 0), y = new THREE.Vector3().setFromMatrixColumn(camara.matrixWorld, 1);
    // El hueco libre: lo que no tapan la columna del título, los modos y la tarjeta (ctx.margenes), con medio rótulo de margen
    const m = hueco();
    const tv = Math.tan((camara.fov * Math.PI) / 360) * m.fy, th = Math.tan((camara.fov * Math.PI) / 360) * camara.aspect * m.fx, p = new THREE.Vector3();
    let d = 0;
    for (let i = 0; i < 8; i++) {
      p.set(i & 1 ? caja.max.x : caja.min.x, i & 2 ? caja.max.y : caja.min.y, i & 4 ? caja.max.z : caja.min.z).sub(centro);
      d = Math.max(d, p.dot(DIR) + Math.abs(p.dot(x)) / th, p.dot(DIR) + Math.abs(p.dot(y)) / tv);
    }
    camara.position.copy(centro).addScaledVector(DIR, d * 1.05);
    // una finca con jardín en un teléfono en vertical pide más distancia que el tope de 80 m: el tope crece con el encuadre
    if (controles) { controles.maxDistance = Math.max(80, d * 1.65); controles.target.copy(centro); controles.update(); }
  }

  /** El sol de la barra en el esquema: posición exacta, color y fuerza; de noche, las estancias se apagan un poco. */
  function aplicarSol() {
    const s = luzSol;
    if (!s?.luz || !s.e) return;
    const L = s.e.luz, [dx, dy, dz] = s.e.direccion, r = s.radio;
    s.luz.castShadow = true;
    s.luz.shadow.mapSize.set(2048, 2048);
    Object.assign(s.luz.shadow.camera, { left: -r * 1.2, right: r * 1.2, top: r * 1.2, bottom: -r * 1.2, near: 0.1, far: r * 8 });
    s.luz.shadow.camera.updateProjectionMatrix();
    s.luz.shadow.bias = -0.0005;
    s.luz.target.position.copy(s.centro);
    s.luz.position.set(s.centro.x + dx * r * 3, s.centro.y + Math.max(dy, 0.004) * r * 3, s.centro.z + dz * r * 3);
    s.luz.color.setRGB(...L.sol, THREE.SRGBColorSpace);
    s.luz.intensity = 1.6 * Math.min(1, L.fuerza / 2.5);
    s.luz.visible = L.fuerza > 0.01 && dy > -0.01;
    s.hemi.color.setRGB(...L.cielo, THREE.SRGBColorSpace);
    s.hemi.intensity = 2.2 * Math.min(1, Math.max(0.4, L.ambiente / 1.4));
    s.sombra.material.opacity = 0.32 * Math.min(1, L.fuerza / 2);
    for (const x of superficies) {
      if (!x.material.color) continue;
      x.userData.colorBase ??= x.material.color.clone();
      x.material.color.copy(x.userData.colorBase).multiplyScalar(1 - 0.5 * L.noche);
    }
  }

  const v = new THREE.Vector3();
  const ndc = new THREE.Vector2();
  function cuadro() {
    controles?.update();
    for (const e of etiquetas) {
      v.copy(e.pos).project(camara);
      const ok = v.z < 1;
      e.el.style.display = ok ? "" : "none";
      e.el.style.left = `${(v.x * 0.5 + 0.5) * innerWidth}px`;
      e.el.style.top = `${(-v.y * 0.5 + 0.5) * innerHeight}px`;
    }
  }

  function alMover(e) {
    if (!escena || e.pointerType === "touch") return;
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    rayo.setFromCamera(ndc, camara);
    const h = rayo.intersectObjects(superficies, false)[0]?.object ?? null;
    if (h === hover) return;
    if (hover) resaltar(hover, false);
    if (h) resaltar(h, true);
    hover = h;
  }

  /** Resalte al pasar el ratón: en la foto, un velo claro; en el color o el modelo, la opacidad. */
  function resaltar(s, si) {
    if (s.material.uniforms?.resalte) s.material.uniforms.resalte.value = si ? 0.14 : 0;
    else s.material.opacity = si ? (usaModelo ? 0.25 : 0.6) : s.userData.opacidadBase;
  }

  document.addEventListener("cre8:tema", () => { if (activa && escena) escena.background = colorFondo(); });

  return {
    camara,
    /** Solo con muros o con modelo 3D: con polígonos sueltos la maqueta serían manchas planas (N4). */
    disponible() {
      const t = ctx.tour();
      return !!ctx.modeloLibre() || (t.plantas ?? []).some((p) => p.muros?.length);
    },
    escena: () => escena,
    /** Maqueta con fotos: { estancias, cargadas } (pruebas y depuración). */
    fotos: () => ({ ...fotos }),
    prepararControles,
    /** Barra del sol: el estado del sol (sol.js → estadoSol) o null. */
    fijarSol(e) { luzSol = { ...(luzSol ?? {}), e }; if (construida && !usaModelo) aplicarSol(); },
    acercar,
    activar(si) {
      if (si && !construida) construir();
      if (!si && hover) { resaltar(hover, false); hover = null; }
      if (controles) controles.enabled = si;
      capa.hidden = !si;
      if (usaModelo) ctx.ocultarTecho(si);
      // Con el modelo del paseo libre, el fondo del tema solo mientras se ve la maqueta (luego vuelve el suyo).
      if (si && !activa) { fondoPrevio = escena.background; escena.background = colorFondo(); }
      else if (!si && activa && usaModelo) escena.background = fondoPrevio ?? null;
      activa = !!si;
      ctx.lienzo[si ? "addEventListener" : "removeEventListener"]("pointermove", alMover);
    },
    /** También al girar la pantalla: mientras el visitante no la haya movido, la maqueta se vuelve a encuadrar. */
    redimensionar(aspecto) { camara.aspect = aspecto; camara.updateProjectionMatrix(); if (construida && !movida) encuadrar(); else if (construida) hueco(); },
    cuadro,
    reiniciar() {
      if (activa && usaModelo && escena) escena.background = fondoPrevio ?? null;
      activa = false;
      hover = null;
      superficies.forEach((s) => { s.parent?.remove(s); s.geometry.dispose(); s.material.uniforms?.foto?.value?.dispose(); s.material.dispose(); });
      if (escena && !usaModelo) escena.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose?.(); } });
      superficies.length = 0;
      fotos.estancias = fotos.cargadas = 0;
      if (luzSol) luzSol = { e: luzSol.e };
      etiquetas.forEach((e) => e.el.remove());
      etiquetas.length = 0;
      construida = false;
      movida = false;
    },
  };
}
