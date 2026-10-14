// Música de fondo del proyecto: tour.audio.musica = { archivo, volumen, bucle, autoplay, titulo, autor, licencia }.
// La casilla de licencia es interna del Estudio (tour._estudio.musicaLicencia) y Revisar avisa si falta.
import { slug } from "./estudio-util.js";
import { app, h, icono, cambiar, toast, confirmar, guardarArchivo, urlDe, rutaLibre, elegirArchivos, fmtMB } from "./estudio-nucleo.js";
import { campo } from "./estudio-campos.js";

const TIPOS = /\.(mp3|m4a|aac|ogg|oga|wav)$/i;
const LIMITE_HTML = 15 * 1048576;

async function subirMusica(alTerminar) {
  const [f] = await elegirArchivos({ aceptar: "audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav,audio/x-wav,.mp3,.m4a,.aac,.ogg,.wav" });
  if (!f) return;
  if (!TIPOS.test(f.name) && !/^audio\//.test(f.type)) return toast("Sube un archivo de audio MP3, M4A, AAC, OGG o WAV.", "aviso", 5000);
  const ext = (f.name.match(TIPOS)?.[1] ?? "mp3").toLowerCase();
  const ruta = rutaLibre(`audio/${slug(f.name.replace(/\.[^.]+$/, "")) || "musica"}`, ext);
  await guardarArchivo(ruta, f);
  const titulo = f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  cambiar((t) => {
    const ant = t.audio?.musica ?? {};
    t.audio = { ...(t.audio ?? {}), musica: { archivo: ruta, volumen: ant.volumen ?? 0.4, bucle: ant.bucle ?? true, autoplay: ant.autoplay ?? true, titulo } };
    t._estudio.musicaLicencia = false; // archivo nuevo: hay que volver a confirmar la licencia
  }, { tipo: "datos" });
  if (f.size > LIMITE_HTML) toast(`La música pesa ${fmtMB(f.size)}: funcionará en la web, pero no se incrustará en el archivo HTML autónomo (límite 15 MB).`, "aviso", 7000);
  else toast("Música añadida. Confirma que tienes licencia para usarla.", "ok", 4000);
  alTerminar?.();
}

/** Bloque «Música de fondo» (Material y Datos → Avanzado). */
export function bloqueMusica() {
  const cont = h("div", { class: "bloque-musica" });
  const M = () => app.tour.audio?.musica;
  const pintar = () => {
    const m = M();
    if (!m?.archivo) {
      cont.replaceChildren(
        h("p", { class: "suave", style: { margin: "0 0 10px" }, text: "Opcional. Suena con el botón de sonido del visor y en los vídeos. Usa música libre de derechos o con licencia comercial." }),
        h("button", { class: "btn", onclick: () => subirMusica(pintar) }, icono("subir", 16), "Subir música (MP3, M4A, AAC, OGG o WAV)"));
      return;
    }
    const blob = app.archivos.get(m.archivo);
    const audio = h("audio", { controls: true, src: urlDe(m.archivo), preload: "metadata", style: { width: "100%" } });
    audio.volume = m.volumen ?? 0.4;
    audio.loop = m.bucle !== false;
    const vol = h("input", { type: "range", min: 0, max: 100, step: 5, value: Math.round((m.volumen ?? 0.4) * 100), "aria-label": "Volumen al empezar" });
    const volTxt = h("b", { text: `${vol.value} %` });
    vol.setAttribute("aria-valuetext", `${vol.value} por ciento`);
    vol.oninput = () => {
      volTxt.textContent = `${vol.value} %`; vol.setAttribute("aria-valuetext", `${vol.value} por ciento`);
      audio.volume = vol.value / 100;
      cambiar(() => { M().volumen = Math.round(vol.value) / 100; }, { clave: "musica-vol", tipo: "datos", render: false });
    };
    const casilla = (clave, texto, defecto) => {
      const i = h("input", { type: "checkbox", checked: (m[clave] ?? defecto) !== false });
      i.onchange = () => { cambiar(() => { M()[clave] = i.checked; }, { tipo: "datos", render: false }); if (clave === "bucle") audio.loop = i.checked; };
      return h("label", { class: "check" }, i, texto);
    };
    const lic = h("input", { type: "checkbox", checked: !!app.tour._estudio.musicaLicencia, required: true, "aria-describedby": "nota-licencia-musica" });
    lic.onchange = () => { cambiar((t) => { t._estudio.musicaLicencia = lic.checked; }, { tipo: "local" }); pintarAviso(); };
    const avisoLic = h("small", { class: "error-campo", role: "status" });
    const pintarAviso = () => { avisoLic.textContent = lic.checked ? "" : "Obligatorio: sin esta confirmación, Revisar marcará la música como pendiente."; };
    pintarAviso();
    cont.replaceChildren(...[
      h("div", { class: "fila", style: { marginBottom: "8px" } },
        h("b", { text: m.titulo || m.archivo.split("/").pop(), style: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }),
        h("span", { class: "tenue", text: blob ? fmtMB(blob.size) : "" }),
        h("button", { class: "btn peq", onclick: () => subirMusica(pintar) }, "Cambiar"),
        h("button", { class: "btn peq fantasma", onclick: async () => {
          if (await confirmar("Quitar música", "El recorrido dejará de tener música de fondo.", "Quitar")) { cambiar((t) => { delete t.audio; t._estudio.musicaLicencia = false; }, { tipo: "datos" }); pintar(); }
        } }, "Quitar")),
      blob && blob.size > LIMITE_HTML ? h("p", { class: "suave", style: { margin: "0 0 8px", fontSize: "13px" }, text: `Pesa más de 15 MB: no se incrustará en el archivo HTML autónomo (sí en la web y en los vídeos).` }) : null,
      audio,
      h("div", { class: "campo", style: { marginTop: "10px" } }, h("span", {}, "Volumen al empezar: ", volTxt), vol),
      h("div", { class: "fila", style: { marginTop: "6px" } }, casilla("bucle", "Repetir en bucle", true), casilla("autoplay", "Empezar a sonar tras el primer toque del visitante", true)),
      h("div", { class: "rejilla", style: { marginTop: "10px" } },
        campo(M, "titulo", { etiqueta: "Título" }),
        campo(M, "autor", { etiqueta: "Autor" }),
        h("div", { class: "ancho-2" }, campo(M, "licencia", { etiqueta: "Licencia", placeholder: "CC BY 4.0 · licencia comercial nº…" }))),
      h("label", { class: "check", style: { marginTop: "12px", alignItems: "flex-start" } }, lic,
        h("span", {}, h("b", { text: "Tengo licencia para usar esta música en la web y en anuncios" }))),
      avisoLic,
      h("p", { class: "tenue", id: "nota-licencia-musica", style: { fontSize: "12.5px", margin: "6px 0 0" } },
        "En España, usar música con derechos en una web comercial o en anuncios requiere licencia. Usa bibliotecas libres de derechos o con licencia comercial: ",
        "Pixabay Music, Free Music Archive (con licencia CC BY, citando al autor) o suscripciones como Epidemic Sound o Artlist."),
    ].filter(Boolean));
  };
  pintar();
  return cont;
}
