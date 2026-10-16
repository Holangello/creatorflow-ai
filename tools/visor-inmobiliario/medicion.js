// Herramienta de medición.
// · Recorrido 360: sin LiDAR, usando la altura conocida de la cámara (trípode). Un rayo que apunta
//   al suelo corta el plano y = -altura; así se miden distancias en el suelo y alturas de paredes.
// · Modo libre: rayos contra el modelo (GLB, colisionador o splat).
// Barra de vidrio (se construye una vez y se actualiza en su sitio: el foco no se pierde al marcar) y medidas de vidrio.
import * as THREE from "three";

const NS = "http://www.w3.org/2000/svg";

export function crearMedicion(ctx) {
  const barra = document.createElement("div");
  barra.id = "medir-barra";
  barra.className = "barra-contextual c8-vidrio c8-vidrio--texto";
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

  // Barra: pista arriba (con la nota de precisión) y, debajo, Distancia | Altura · Marcar punto · Deshacer · Borrar · Cerrar.
  const pista = document.createElement("p");
  pista.className = "pista";
  pista.setAttribute("aria-live", "polite");
  const pistaTexto = document.createElement("span"), nota = document.createElement("small");
  pista.append(pistaTexto, nota);
  const grupo = document.createElement("div");
  grupo.className = "c8-segmentado";
  grupo.setAttribute("role", "radiogroup");
  const radios = ["distancia", "altura"].map((t) => {
    const l = document.createElement("label"), r = document.createElement("input"), sp = document.createElement("span");
    r.type = "radio"; r.name = "medir-tipo"; r.value = t;
    r.onchange = () => { est.tipo = t; cancelarParcial(); render(); };
    l.append(r, sp);
    grupo.append(l);
    return { r, sp, t };
  });
  const bMarcar = boton(() => marcarCentro(), "c8-boton--primario");
  const bDeshacer = boton(deshacer, "", '<path d="M9 7 4.5 11.5 9 16"/><path d="M5 11.5h9.5a5 5 0 0 1 0 10H12"/>');
  const bBorrar = boton(borrar, "", '<path d="M5 7h14M10 7V5h4v2M7 7l1 12.5h8L17 7"/>');
  const bCerrar = boton(() => ctx.desactivar(), "", '<path d="M7 7l10 10M17 7 7 17"/>');
  const controles = document.createElement("div");
  controles.className = "controles";
  controles.append(grupo, bMarcar, bDeshacer, bBorrar, bCerrar);
  barra.append(pista, controles);

  function render() {
    const tr = ctx.tr;
    barra.setAttribute("aria-label", tr("medir.titulo"));
    grupo.setAttribute("aria-label", tr("medir.titulo"));
    for (const { r, sp, t } of radios) { r.checked = est.tipo === t; sp.textContent = tr(`medir.${t}`); }
    window.cre8Tema?.segmentados?.(grupo);
    pistaTexto.textContent = est.a ? tr(est.tipo === "altura" ? "medir.ayuda_altura_b" : "medir.ayuda_b") : tr(est.tipo === "altura" ? "medir.ayuda_altura_a" : "medir.ayuda_a");
    nota.textContent = ` · ${tr("medir.precision")}`;
    for (const [b, k] of [[bMarcar, "medir.marcar"], [bDeshacer, "medir.deshacer"], [bBorrar, "medir.borrar"], [bCerrar, "medir.cerrar"]]) b.lastChild.textContent = tr(k);
    // aria-disabled (no disabled): el botón conserva el foco aunque ya no haya nada que deshacer
    const nada = String(!est.a && !est.medidas.length);
    bDeshacer.setAttribute("aria-disabled", nada);
    bBorrar.setAttribute("aria-disabled", nada);
  }

  function boton(fn, clase, icono) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `c8-boton c8-boton--s ${clase}`.trim();
    if (icono) {
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("class", "c8-icono");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      svg.innerHTML = icono;
      b.append(svg);
    }
    b.append(document.createElement("span"));
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
      window.cre8Sonidos?.tocar("medir");
    } else {
      const v = valor(est.a, p);
      quitar(est.goma);
      const obj = crearMarca(est.a, p);
      const etq = document.createElement("div");
      etq.className = "medida-etq c8-vidrio c8-vidrio--texto";
      etq.textContent = `${ctx.formato(v)} m`;
      etq.setAttribute("role", "status");
      ctx.contenedor.append(etq);
      est.medidas.push({ tipo: est.tipo, a: est.a, b: p, valor: v, obj, etq, escena: ctx.modo() });
      ctx.emitir("medida", { metros: Math.round(v * 100) / 100, tipo: est.tipo });
      window.cre8Sonidos?.tocar("medida");
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
