// Visita guiada automática: recorre las paradas del guion con giros lentos y subtítulos.
// Avanza con el bucle de render (paso(dt)) para que la grabación de vídeo quede sincronizada.
import { GRAD, angDif } from "./util.js";

/** ctx: { tour(), nodos(), ir(nodo) → Promise, rumbo(), fijarRumbo(r), reducido(), subtitulo(texto|null), emitir(ev), asegurarModoTour() } */
export function crearGuion(ctx) {
  let est = null;

  function paradas() {
    const t = ctx.tour();
    const porId = new Map(ctx.nodos().map((n) => [n.id, n]));
    const lista = (t.guion?.length ? t.guion : ctx.nodos().map((n) => ({ nodo: n.id })))
      .map((p) => ({ ...p, nodo: porId.get(p.nodo) }))
      .filter((p) => p.nodo);
    return lista;
  }

  async function siguiente() {
    if (!est) return;
    est.i++;
    if (est.i >= est.lista.length) return terminar(true);
    const p = est.lista[est.i];
    est.fase = "yendo";
    ctx.subtitulo(p.texto ?? null);
    ctx.emitir("guion:paso", { paso: est.i, nodo: p.nodo.id, texto: p.texto ?? null });
    await ctx.ir(p.nodo);
    if (!est) return;
    const centro = p.rumbo != null ? p.rumbo * GRAD : ctx.rumbo();
    const giro = ctx.reducido() ? 0 : Math.min(24, (p.segundos ?? 5) * 4) * GRAD;
    // Gira hasta el inicio del barrido por el camino corto.
    est.r0 = ctx.rumbo() + angDif(centro - giro / 2, ctx.rumbo());
    est.r1 = est.r0 + giro;
    est.rInicio = ctx.rumbo();
    est.ajuste = ctx.reducido() ? 0.4 : 1.2;
    est.t = 0;
    est.dur = Math.max(1.5, p.segundos ?? 5);
    est.fase = "mirando";
  }

  function terminar(completa) {
    if (!est) return;
    est = null;
    ctx.subtitulo(null);
    ctx.emitir("guion:fin", { completa });
  }

  return {
    get activo() { return !!est; },
    iniciar() {
      if (est) return;
      const lista = paradas();
      if (!lista.length) return;
      ctx.asegurarModoTour();
      est = { lista, i: -1, fase: "yendo", t: 0 };
      ctx.emitir("guion:inicio", { paradas: lista.length });
      siguiente();
    },
    parar() { terminar(false); },
    paso(dt) {
      if (!est || est.fase !== "mirando") return;
      est.t += dt;
      const suave = (k) => k * k * (3 - 2 * k);
      if (est.t < est.ajuste) {
        // Encaje suave desde el rumbo de llegada hasta el inicio del barrido.
        ctx.fijarRumbo(est.rInicio + angDif(est.r0, est.rInicio) * suave(est.t / est.ajuste));
        return;
      }
      const k = Math.min(1, (est.t - est.ajuste) / est.dur);
      ctx.fijarRumbo(est.r0 + (est.r1 - est.r0) * suave(k));
      if (k >= 1) siguiente();
    },
  };
}
