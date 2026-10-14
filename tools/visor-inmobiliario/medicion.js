// Herramienta de medición.
// · Recorrido 360: sin LiDAR, usando la altura conocida de la cámara (trípode). Un rayo que apunta
//   al suelo corta el plano y = -altura; así se miden distancias en el suelo y alturas de paredes.
// · Modo libre: rayos contra el modelo (GLB, colisionador o splat).
import * as THREE from "three";

export function crearMedicion(ctx) {
  const barra = document.createElement("div");
  barra.id = "medir-barra";
  barra.className = "barra-contextual";
  barra.hidden = true;
  barra.setAttribute("role", "toolbar");
  const mira = document.createElement("div");
  mira.id = "mira";
  mira.hidden = true;
  mira.setAttribute("aria-hidden", "true");
  ctx.contenedor.append(barra, mira);

  const rayo = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const matLinea = new THREE.LineBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true });
  const matPunto = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true });
  const geoPunto = new THREE.SphereGeometry(1, 12, 8);

  const est = { activo: false, tipo: "distancia", a: null, medidas: [], goma: null };

  function render() {
    const tr = ctx.tr;
    barra.innerHTML = "";
    const grupo = document.createElement("div");
    grupo.className = "segmentado";
    for (const t of ["distancia", "altura"]) {
      const b = boton(tr(`medir.${t}`), () => { est.tipo = t; cancelarParcial(); render(); });
      b.setAttribute("aria-pressed", String(est.tipo === t));
      grupo.append(b);
    }
    const pista = document.createElement("span");
    pista.className = "pista";
    pista.setAttribute("aria-live", "polite");
    pista.textContent = est.a ? tr(est.tipo === "altura" ? "medir.ayuda_altura_b" : "medir.ayuda_b") : tr(est.tipo === "altura" ? "medir.ayuda_altura_a" : "medir.ayuda_a");
    barra.append(
      grupo,
      pista,
      boton(tr("medir.marcar"), () => marcarCentro(), "primario"),
      boton(tr("medir.deshacer"), deshacer),
      boton(tr("medir.borrar"), borrar),
      boton(tr("medir.cerrar"), () => ctx.desactivar()),
    );
    const nota = document.createElement("small");
    nota.textContent = tr("medir.precision");
    barra.append(nota);
  }

  function boton(texto, fn, clase = "") {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = texto; b.className = clase;
    b.onclick = fn;
    return b;
  }

  function escena() { return ctx.modo() === "libre" ? ctx.escenaLibre : ctx.escena360; }

  function punto(clientX, clientY, segundo) {
    ndc.set((clientX / innerWidth) * 2 - 1, -(clientY / innerHeight) * 2 + 1);
    rayo.setFromCamera(ndc, ctx.camara);
    if (ctx.modo() === "libre") {
      rayo.far = 200;
      const h = rayo.intersectObjects(ctx.objetivosLibre(), true).find((i) => i.object.visible !== false);
      return h ? h.point.clone() : null;
    }
    const d = rayo.ray.direction;
    const alt = ctx.alturaCamara();
    if (segundo && est.tipo === "altura" && est.a) {
      const rA = Math.hypot(est.a.x, est.a.z);
      const s = Math.hypot(d.x, d.z);
      if (s < 1e-3) return null;
      return d.clone().multiplyScalar(rA / s);
    }
    if (d.y > -0.04) return null;
    return d.clone().multiplyScalar(alt / -d.y);
  }

  function valor(a, b) {
    if (est.tipo === "altura") return Math.abs(b.y - a.y);
    return ctx.modo() === "libre" ? a.distanceTo(b) : Math.hypot(a.x - b.x, a.z - b.z);
  }

  function crearMarca(a, b) {
    const g = new THREE.Group();
    g.renderOrder = 20;
    const linea = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b ?? a]), matLinea);
    linea.renderOrder = 20;
    g.add(linea);
    for (const p of [a, b ?? a]) {
      const s = new THREE.Mesh(geoPunto, matPunto);
      s.position.copy(p);
      s.scale.setScalar(Math.max(0.015, p.length() * 0.008));
      s.renderOrder = 21;
      g.add(s);
    }
    escena().add(g);
    return g;
  }

  function marcar(clientX, clientY) {
    const p = punto(clientX, clientY, !!est.a);
    if (!p) { ctx.aviso(ctx.tr("medir.suelo"), 1800); return; }
    if (!est.a) {
      est.a = p;
      est.goma = crearMarca(p, p);
    } else {
      const v = valor(est.a, p);
      quitar(est.goma);
      const obj = crearMarca(est.a, p);
      const etq = document.createElement("div");
      etq.className = "medida-etq";
      etq.textContent = `${ctx.formato(v)} m`;
      etq.setAttribute("role", "status");
      ctx.contenedor.append(etq);
      est.medidas.push({ tipo: est.tipo, a: est.a, b: p, valor: v, obj, etq, escena: ctx.modo() });
      ctx.emitir("medida", { metros: Math.round(v * 100) / 100, tipo: est.tipo });
      est.a = null; est.goma = null;
    }
    render();
  }

  function marcarCentro() { marcar(innerWidth / 2, innerHeight / 2); }

  function mover(clientX, clientY) {
    if (!est.activo || !est.a || !est.goma) return;
    const p = punto(clientX, clientY, true);
    if (!p) return;
    const linea = est.goma.children[0];
    linea.geometry.setFromPoints([est.a, p]);
    est.goma.children[2].position.copy(p);
  }

  function quitar(obj) {
    if (!obj) return;
    obj.parent?.remove(obj);
    obj.traverse((o) => o.geometry !== geoPunto && o.geometry?.dispose?.());
  }

  function cancelarParcial() { quitar(est.goma); est.goma = null; est.a = null; }

  function deshacer() {
    if (est.a) cancelarParcial();
    else {
      const m = est.medidas.pop();
      if (m) { quitar(m.obj); m.etq.remove(); }
    }
    render();
  }

  function borrar() {
    cancelarParcial();
    for (const m of est.medidas) { quitar(m.obj); m.etq.remove(); }
    est.medidas = [];
    render();
  }

  const v = new THREE.Vector3();
  function cuadro() {
    for (const m of est.medidas) {
      const visible = m.escena === ctx.modo();
      m.obj.visible = visible;
      v.copy(m.a).add(m.b).multiplyScalar(0.5).project(ctx.camara);
      const delante = v.z < 1 && v.z > -1;
      m.etq.style.display = visible && delante ? "" : "none";
      m.etq.style.left = `${(v.x * 0.5 + 0.5) * innerWidth}px`;
      m.etq.style.top = `${(-v.y * 0.5 + 0.5) * innerHeight}px`;
    }
  }

  return {
    get activo() { return est.activo; },
    activar(si) {
      est.activo = si;
      barra.hidden = !si;
      mira.hidden = !si;
      document.body.classList.toggle("midiendo", si);
      if (si) render(); else borrar();
    },
    clic(x, y) { if (!est.activo) return false; marcar(x, y); return true; },
    mover,
    deshacer,
    cambioNodo() { if (ctx.modo() !== "libre") borrar(); },
    cuadro,
    refrescarTextos() { if (est.activo) render(); },
  };
}
