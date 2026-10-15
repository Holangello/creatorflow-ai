// Vista "maqueta" (dollhouse): la vivienda vista desde arriba en 3D, con estancias, m² y
// pines de las fotos 360. Usa el modelo real (demo/GLB) si existe o un esquema extruido
// a partir de los muros del plano (con las estancias coloreadas encima).
import * as THREE from "three";
import { areaPoligono, puntoEtiqueta } from "./util.js";

const ALTO_MURO = 2.5;
const COLORES = [0xe9dcc6, 0xd6e2d3, 0xd9dbe8, 0xeed9cf, 0xdfe7ea, 0xe8e2c9, 0xe2d4e6];

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
  }

  const capa = document.createElement("div");
  capa.id = "maqueta-capa";
  capa.hidden = true;
  ctx.contenedor.append(capa);

  let escena = null, usaModelo = false, construida = false;
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
      escena.background = new THREE.Color(0x15181d);
      escena.add(new THREE.HemisphereLight(0xffffff, 0x404040, 2.2));
      const sol = new THREE.DirectionalLight(0xffffff, 1.4);
      sol.position.set(8, 20, 6);
      escena.add(sol);
      const matMuro = new THREE.MeshStandardMaterial({ color: 0xf2efe9, roughness: 0.9 });
      for (const p of t.plantas ?? []) {
        const y0 = elev(p.id);
        for (const [x1, z1, x2, z2] of p.muros ?? []) {
          const largo = Math.hypot(x2 - x1, z2 - z1) + 0.12;
          const m = new THREE.Mesh(new THREE.BoxGeometry(largo, ALTO_MURO, 0.12), matMuro);
          m.position.set((x1 + x2) / 2, y0 + ALTO_MURO / 2, (z1 + z2) / 2);
          m.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
          escena.add(m);
        }
      }
    }
    // Superficies de estancias (relleno de color en el esquema; capa de resalte en el modelo)
    (t.estancias ?? []).forEach((e, i) => {
      if (!(e.poligono?.length > 2)) return;
      const forma = new THREE.Shape(e.poligono.map(([x, z]) => new THREE.Vector2(x, -z)));
      const geo = new THREE.ShapeGeometry(forma).rotateX(-Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({
        color: usaModelo ? 0xffffff : COLORES[i % COLORES.length],
        transparent: true, opacity: usaModelo ? 0 : 0.95, depthWrite: !usaModelo, side: THREE.DoubleSide,
      });
      const s = new THREE.Mesh(geo, mat);
      s.position.y = elev(e.planta) + (usaModelo ? 0.03 : 0);
      s.userData = { estancia: e, opacidadBase: mat.opacity };
      s.visible = true;
      superficies.push(s);
      escena.add(s);
      const [cx, cz] = puntoEtiqueta(e.poligono);
      const el = document.createElement("div");
      el.className = "maq-estancia";
      el.innerHTML = `<b></b><span></span>`;
      el.querySelector("b").textContent = ctx.texto(e.nombre);
      el.querySelector("span").textContent = `${ctx.formato(areaPoligono(e.poligono))} m²`;
      capa.append(el);
      etiquetas.push({ el, pos: new THREE.Vector3(cx, elev(e.planta) + 0.2, cz) });
    });
    // Pines de fotos 360
    for (const n of ctx.nodos()) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "maq-pin";
      b.textContent = ctx.texto(n.nombre);
      b.setAttribute("aria-label", ctx.tr("nav.ir_a", { x: ctx.texto(n.nombre) }));
      b.onclick = () => ctx.alElegirNodo(n);
      capa.append(b);
      etiquetas.push({ el: b, pos: new THREE.Vector3(n.x, elev(n.planta) + (n.altura_camara ?? t.altura_camara ?? 1.5), n.z), pin: true });
    }
    encuadrar();
  }

  function encuadrar() {
    const caja = new THREE.Box3();
    for (const s of superficies) caja.expandByObject(s);
    if (caja.isEmpty()) for (const n of ctx.nodos()) caja.expandByPoint(new THREE.Vector3(n.x, 0, n.z));
    if (caja.isEmpty()) caja.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(10, 3, 10));
    const centro = caja.getCenter(new THREE.Vector3());
    const tam = caja.getSize(new THREE.Vector3());
    const r = Math.max(tam.x, tam.z, 6);
    camara.position.set(centro.x + r * 0.35, centro.y + r * 1.05, centro.z + r * 0.95);
    camara.lookAt(centro);
    if (controles) { controles.target.copy(centro); controles.update(); }
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
    if (hover) hover.material.opacity = hover.userData.opacidadBase;
    if (h) h.material.opacity = usaModelo ? 0.25 : 0.6;
    hover = h;
  }

  return {
    camara,
    /** Solo con muros o con modelo 3D: con polígonos sueltos la maqueta serían manchas planas (N4). */
    disponible() {
      const t = ctx.tour();
      return !!ctx.modeloLibre() || (t.plantas ?? []).some((p) => p.muros?.length);
    },
    escena: () => escena,
    prepararControles,
    activar(si) {
      if (si && !construida) construir();
      if (!si && hover) { hover.material.opacity = hover.userData.opacidadBase; hover = null; }
      if (controles) controles.enabled = si;
      capa.hidden = !si;
      if (usaModelo) ctx.ocultarTecho(si);
      ctx.lienzo[si ? "addEventListener" : "removeEventListener"]("pointermove", alMover);
    },
    redimensionar(aspecto) { camara.aspect = aspecto; camara.updateProjectionMatrix(); },
    cuadro,
    reiniciar() {
      hover = null;
      superficies.forEach((s) => { s.parent?.remove(s); s.geometry.dispose(); s.material.dispose(); });
      if (escena && !usaModelo) escena.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose?.(); } });
      superficies.length = 0;
      etiquetas.forEach((e) => e.el.remove());
      etiquetas.length = 0;
      construida = false;
    },
  };
}
