#!/usr/bin/env node
// Pruebas de extremo a extremo del Estudio (estudio.html) en Chromium sin cabeza.
//   cd tools/visor-inmobiliario && node pruebas/e2e-estudio.mjs
// Interfaz de la fase 3: 4 pasos (Fotos · Plano opcional · Datos · Publicar) y «Más herramientas» (Orientación y notas,
// Estilo y luz, Extras), sin modos Rápido/Completo; «Proyecto ▾» (nuevo, copia, restaurar), «Mi inmobiliaria» y «?».
// 0. Vista previa del Estudio (index.html?embed&estudio): arranca vacía, sin generar la demo, en menos de 2 s.
// 1. Flujo completo: fotos (aviso 2:1) → plano (calibrar, colocar arrastrando, conectar, estancia, muro) → orientación
//    (Alinear, nota) → estilo y luz (estilos, máscara, aviso legal) → datos y Mi inmobiliaria → antes de publicar →
//    tour.json (con zonas automáticas) → recarga.
// 2. Planos del arquitecto en Plano (DXF, PDF de varias páginas), render 360 como estilo «Proyecto», Extras (galería, GLB,
//    documentos, música) y exportadores (ZIP web, fotos 360 GPano, plano, dossier con QR, archivo único, vídeo),
//    deshacer/rehacer e importar el ZIP publicado desde «Proyecto ▾».
// 3. Lista de la Guía («Usar»), orden, «Saltar» el plano, datos con formato español, Mi inmobiliaria (URL javascript:
//    rechazada), vista previa sin datos de la demo, ZIP público sin documentos privados, copia de seguridad y restauración
//    en un navegador limpio.
// 4. iPad (objetivos ≥ 44 px, cajón de vista previa) y «Colocar» sin arrastrar a 1024×768.
// 5. Fallo de guardado (cuota), atajos de una tecla desactivables desde «?» y prueba del CRM en Mi inmobiliaria.
// Las imágenes, PDF, DXF, GLB y WAV se generan al vuelo (e2e-util.mjs). Sale con código 1 si algo falla.
import { servir, lanzar, contexto, abrir } from "./comun.mjs";
import { crearInforme, FaltaPieza, erroresDe, esperar, subir, descargar, leerZip, jsonDe, archivo, mediosEstudio, asegurarBuild } from "./e2e-util.mjs";

// Selectores de la interfaz del Estudio, agrupados para adaptarlos cuando cambie el diseño (fase 3). Dentro de la página
// están en window.__SEL (se inyecta con addInitScript). Lo que se comprueba es el resultado en window.__estudio.tour,
// en los archivos guardados y en lo que se descarga.
const SEL = {
  // estructura: 4 pasos y «Más herramientas»; «modoAntiguo» es el testigo de los modos Rápido/Completo (ya no existen)
  pasos: "#pasos button", pasosPrincipales: "#pasos > button[data-seccion]", masHerramientas: "#pasos .mas-herramientas",
  herramientas: "#lista-herramientas button[data-seccion]", modoAntiguo: "#pasos .modo-compacto, #pasos .modo-actual",
  tituloSeccion: "#trabajo .cab-seccion h1", resumenRevisar: "#antes-de-publicar .cab-antes [role=status]", estadoGuardado: "#estado-guardado",
  botonesFotos: "#trabajo button", ayuda: "#btn-ayuda", interruptorAtajos: "#interruptor-atajos", perfil: "#btn-perfil",
  botonVista: "#btn-vista", vista: "#vista", vistaNodo: "#vista-nodo", iframe: "#iframe-visor", vistaVacia: "#vacio", panelesVista: "#paneles", panelesRaiz: ".pn-raiz",
  // menú «Proyecto ▾» (nombre del proyecto en la barra superior)
  proyecto: "#btn-proyecto", proyectoNuevo: ".menu-proyecto >> text=Proyecto nuevo", restaurar: ".menu-proyecto >> text=Restaurar copia…",
  copiaSeguridad: ".menu-proyecto >> text=Copia de seguridad",
  // diálogos
  dialogo: "dialog[open]", dialogoTitulo: "dialog[open] h2", dialogoCampo: "dialog[open] input", dialogoSelect: "dialog[open] select",
  omitirFotos: "dialog[open] >> text=Omitir esas fotos", entendido: "dialog[open] >> text=Entendido",
  importarPlano: "dialog[open] >> text=Importar plano", paginaPdf: "dialog[open] canvas", paginasPdf: "dialog[open] button:has(canvas)",
  pagina2: "dialog[open] >> text=Página 2", usarPagina: "dialog[open] >> text=Usar esta página",
  // fotos · la lista de la Guía se ofrece con «Usar · No usar» (S-10)
  elegirFotos: "text=Elegir fotos", bajarPrimera: ".foto >> nth=0 >> [data-orden=bajar]",
  ofertaGuia: ".aviso-guia", usarGuia: ".aviso-guia button:text-is('Usar')",
  continuarPlano: "[data-continuar=plano]", saltarPlano: "[data-continuar=datos]:has-text('Saltar')",
  // plano (también los planos del arquitecto: DXF, PDF o imagen)
  subirPlano: "text=Subir plano", anadirPlanta: "button[title='Añadir planta']",
  fichaFoto: ".ficha-arrastre", colocar: ".ficha-arrastre >> nth=0 >> text=Colocar", lienzoPlano: ".lienzo-plano canvas", panelSeleccion: ".panel-sel", herramientasPlano: ".herramientas",
  // orientación y notas
  alinear: "#btn-alinear", alinearActivo: "#btn-alinear:not([disabled])", infoAlinear: "#info-alinear", objetivo: 'select[aria-label="Estancia hacia la que miras"]', nota: ".punto",
  // estilo y luz: estilos (IA o render), zonas de color y aviso legal
  mostrarTodo: "#estilo-todo", subirEstilos: "text=Subir estilos", primeraEstancia: ".selector-nodos button >> nth=0",
  estiloVariante: '.variante select[aria-label="Estilo"]', origenVariante: '.variante select[aria-label="Origen de la imagen"]',
  crearMascara: "[data-campo=zonas-color] button:has-text('Marcar zonas de color')", editorMascara: ".editor-mascara",
  lienzoMascara: ".editor-mascara canvas", zonaMascara: ".editor-mascara .lienzo", guardarMascara: ".editor-mascara >> text=Guardar máscara", cargando: ".cargando-global",
  textoRecomendado: "text=Usar texto recomendado",
  // extras
  subirImagenes: "text=Subir imágenes", subirModelo: "text=Subir modelo", subirDocumentos: "text=Subir documentos", subirMusica: "text=Subir música",
  publico: "label.check:has-text('Público')", licenciaMusica: "label:has-text('Tengo licencia') input", quitarDocumento: "button[aria-label='Quitar documento']",
  filaDocumento: ".fila-doc", casillaPublico: "label.check input",
  // datos
  campo: (etiqueta) => `.campo:has(> label:text-is("${etiqueta}")) :is(input, textarea)`,
  consumoC: '[aria-label="Consumo: letra C"]', emisionesD: '[aria-label="Emisiones: letra D"]', contactoDatos: "[data-campo=contacto] button:has-text('Mi inmobiliaria')",
  // Mi inmobiliaria: marca, contacto, privacidad y CRM (se escriben una vez para todos los recorridos)
  campoPerfil: (etiqueta) => `dialog[open] .c8-campo:has(> label:text-is("${etiqueta}")) :is(input, textarea)`,
  guardarPerfil: "dialog[open] button:text-is('Guardar')", errorPrivacidad: "dialog[open] [data-campo=url_privacidad] .c8-error",
  apartadoCrm: "dialog[open] summary:has-text('Conectar con mi CRM')", probarCrm: "dialog[open] >> text=Enviar una consulta de prueba",
  resultadoCrm: "dialog[open] .resultado-crm", errorCrm: "dialog[open] [data-campo=webhook] .c8-error",
  // publicar («Antes de publicar» es su cabecera)
  comprobacionOk: ".comprobacion.ok b", comprobacionError: ".comprobacion.error b", avanzado: "details.avanzado", webPublicar: "#web-publicar",
  zipWeb: "text=Descargar mi recorrido (ZIP)", fotos360: "text=Descargar fotos 360 (ZIP)", planoPng: "text=Descargar plano", dossier: "text=Abrir dossier",
  htmlAutonomo: "text=Crear el archivo", video: "text=Grabar vídeo", estadoVideo: ".exporte:has(h3:has-text('Vídeo')) [role=status]",
  tourJson: "text=Descargar tour.json",
  hoja: ".hoja", hojaTitulos: ".hoja h2", hojaQr: ".qr svg", hojaPlanos: "img.plano", boton: ":is(.btn, .c8-boton)",
};
const SD = JSON.parse(JSON.stringify(SEL)); // sin las funciones: es lo que se inyecta en la página como __SEL
// Pasos por su #ancla. La fase 3 junta Revisar y Publicar en «#publicar» (con #revisar y #exportar como alias) y convierte
// Dirección, Variantes y Material en herramientas (orientacion, estilo, extras); las anclas antiguas siguen funcionando.
const PASO = { revisar: ["revisar", "publicar"], exportar: ["exportar", "publicar"], orientar: ["orientar", "orientacion"], variantes: ["variantes", "estilo"], material: ["material", "extras"] };
const enPaso = (s) => PASO[s] ?? [s];

const inf = crearInforme("e2e · Estudio");
const { base, cerrar } = await servir();
const navegador = await lanzar();
const M = await mediosEstudio(navegador);
const de = (...nombres) => nombres.map((n) => M[n]);
const T = (p) => p.evaluate(() => window.__estudio.tour);
const tx = (v) => (typeof v === "string" ? v : v?.es ?? "");
const campo = (p, etiqueta) => p.locator(SEL.campo(etiqueta)).first();
const rumboDe = (dx, dz) => (Math.atan2(dx, -dz) * 180) / Math.PI;
const norm180 = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
const IGNORAR = [/Failed to load resource: the server responded with a status of 5\d\d/];

/** Abre el Estudio en un contexto limpio (IndexedDB vacío). */
async function estudio(opciones = {}, hash = "") {
  const ctx = await contexto(navegador, { ancho: 1440, alto: 900, ...opciones });
  inf.cerrarAlFinal.push(ctx); // una página del Estudio abierta de más (con su vista previa WebGL) ralentiza las demás
  await ctx.addInitScript((S) => { window.__SEL = S; }, SD);
  const p = await abrir(ctx, `${base}estudio.html${hash}`);
  p.on("dialog", (d) => d.dismiss()); // ningún alert/confirm nativo debería aparecer
  await esperar(p, () => window.__estudio?.tour && document.querySelector(window.__SEL.pasos));
  return { ctx, p };
}
/** n fotos en el proyecto y la cola de procesado vacía. */
const fotosListas = (p, n) => esperar(p, (n) => window.__estudio.tour.panoramas.length === n &&
  !window.__estudio.cola.some((x) => x.estado === "espera" || x.estado === "procesando"), n, 120000);
async function fotos(p, nombres, n) {
  await subir(p, () => p.locator(SEL.botonesFotos, { hasText: /Elegir fotos|Añadir fotos|Elegir…/ }).first().click(), de(...nombres));
  await fotosListas(p, n);
}
/** Va a un paso por su #ancla (no depende del orden ni de los números de la barra lateral). Si el ancla ya no existe, el
 *  resto del bloque queda «pendiente de la interfaz nueva». */
async function ir(p, seccion) {
  await p.evaluate((s) => { document.activeElement?.blur?.(); location.hash = `#${s}`; }, seccion);
  if (await esperar(p, (ok) => ok.includes(window.__estudio.seccion), enPaso(seccion), 10000).then(() => true, () => false)) return;
  const en = await p.evaluate(() => window.__estudio.seccion);
  throw new FaltaPieza(`paso «#${seccion}» del Estudio: la interfaz ha cambiado (el ancla lleva a «${en}»). Adaptar PASO a la interfaz nueva; el resto del bloque no se ha comprobado`);
}
/** Atajo de una tecla y paso al que debe llevar. */
async function tecla(p, k, seccion) {
  await p.evaluate(() => document.activeElement?.blur?.());
  await p.keyboard.press(k);
  await esperar(p, (ok) => ok.includes(window.__estudio.seccion), enPaso(seccion));
}
/** Abre los apartados «Avanzado…» de la pantalla (p. ej. «Avanzado» de Publicar o «Avanzado: modelo 3D» de Extras). */
const abrirAvanzado = (p) => p.evaluate(() => { for (const d of document.querySelectorAll(__SEL.avanzado)) if (/^Avanzado/.test(d.querySelector("summary")?.textContent ?? "")) d.open = true; });
/** Mi inmobiliaria abierta: guarda y espera a que se cierre el diálogo. */
async function guardarPerfil(p) {
  await p.click(SEL.guardarPerfil);
  await esperar(p, () => !document.querySelector(__SEL.dialogo));
}
/** Arrastra la ficha de una foto hasta un punto del plano (reintenta si la lista lateral se repinta a mitad). */
async function arrastrarFicha(p, nombre, id, destino) {
  for (let intento = 0; intento < 3; intento++) {
    const ficha = p.locator(SEL.fichaFoto).filter({ hasText: nombre }).first();
    await ficha.scrollIntoViewIfNeeded().catch(() => {});
    const bb = await ficha.boundingBox().catch(() => null);
    if (!bb) continue;
    const [x, y] = await destino();
    await p.mouse.move(bb.x + 20, bb.y + bb.height / 2);
    await p.mouse.down();
    await p.mouse.move(x, y, { steps: 6 });
    await p.mouse.up();
    if (await esperar(p, (id) => Number.isFinite(window.__estudio.tour.panoramas.find((q) => q.id === id)?.x), id, 3000).then(() => true, () => false)) return;
  }
  throw new Error(`no se pudo colocar ${nombre} arrastrándola`);
}
/** Bytes del visor en línea (último <script type="module">) de un HTML autónomo. */
function bytesJS(html) {
  const i = html.lastIndexOf('<script type="module">'), j = html.indexOf("</script>", i);
  return i < 0 || j < 0 ? 0 : Buffer.byteLength(html.slice(i, j));
}
const habilitado = (p, sel) => p.waitForSelector(`button:has-text("${sel.replace(/^text=/, "")}"):not([disabled])`, { timeout: 30000 });

try {
  // ================================================================== 0 · vista previa del Estudio
  await inf.bloque("Vista previa del Estudio (index.html?embed&estudio)", async () => {
    const ctx = await contexto(navegador, { ancho: 900, alto: 600 });
    inf.cerrarAlFinal.push(ctx);
    await ctx.addInitScript((S) => { window.__SEL = S; addEventListener("visor:listo", () => { window.__tListo = performance.now(); }); }, SD);
    const p = await abrir(ctx, `${base}index.html?embed&estudio`);
    await esperar(p, () => window.visor?.listo && window.__tListo, null, 20000);
    const r = await p.evaluate(() => ({ t: Math.round(window.__tListo), n: window.visor.tour.panoramas.length, demo: !!window.visor.tour.demo,
      vacio: document.querySelector(__SEL.vistaVacia)?.textContent ?? null, demoCargada: performance.getEntriesByType("resource").some((e) => /\/demo\.js/.test(e.name)) }));
    inf.ok(r.n === 0 && !r.demo && !r.demoCargada && /aparecerá aquí cuando añadas fotos 360/.test(r.vacio ?? ""), "arranca vacía, con el aviso «#vacio» y sin cargar la demo", r);
    inf.ok(r.t < 2000, `está lista para recibir «visor:cargar» en menos de 2 s (${r.t} ms)`);
    const err = erroresDe(p, IGNORAR);
    inf.ok(!err.length, "sin errores de consola", err.slice(0, 3).join(" | "));
  });

  // ================================================================== 1 · flujo completo
  await inf.bloque("Flujo completo de creación (1440×900)", async () => {
    const { ctx, p } = await estudio();
    inf.ok(!(await p.$(SEL.modoAntiguo)) && await p.evaluate(() => !("modo" in window.__estudio.tour._estudio)), "sin modos Rápido/Completo: un proyecto nuevo no guarda ningún modo");
    await esperar(p, () => { const w = document.querySelector(__SEL.iframe)?.contentWindow; return w?.visor?.listo && w.document.querySelector(__SEL.vistaVacia); }, null, 20000);
    inf.ok(true, "sin fotos, la vista previa del Estudio muestra el aviso «#vacio» (no la demo)");
    const barra = await p.evaluate(() => ({ pasos: [...document.querySelectorAll(__SEL.pasosPrincipales)].map((b) => b.dataset.seccion).join(),
      herramientas: [...document.querySelectorAll(__SEL.herramientas)].map((b) => b.dataset.seccion).join(), mas: !!document.querySelector(__SEL.masHerramientas) }));
    inf.ok(barra.pasos === "fotos,plano,datos,publicar" && barra.mas && barra.herramientas === "orientacion,estilo,extras",
      "barra lateral: los 4 pasos y «Más herramientas» (orientación, estilo y luz, extras)", barra);

    // ---- fotos: 5 fotos 2:1 y una foto normal (4:3)
    await subir(p, SEL.elegirFotos, de("salon.jpg", "cocina.jpg", "pasillo.jpg", "DJI_20250314_0001.jpg", "dormitorio-grande.jpg", "normal.jpg"));
    await p.waitForSelector(SEL.dialogoTitulo);
    const aviso = await p.textContent(SEL.dialogo);
    inf.ok(/no parece una 360/.test(aviso) && aviso.includes("normal.jpg: 1600×1200"), "la foto que no es 2:1 se detecta y se nombra en el aviso");
    await p.click(SEL.omitirFotos);
    await fotosListas(p, 5);
    let t = await T(p);
    const nombres = t.panoramas.map((x) => `${x.id}:${tx(x.nombre)}`).join(", ");
    inf.ok(nombres === "cocina:Cocina, estancia-2:Estancia 2, dormitorio-grande:Dormitorio grande, pasillo:Pasillo, salon:Salón",
      "nombres sugeridos con tildes y «Estancia N» para los nombres de cámara, en orden de archivo", nombres);
    const arch = await p.evaluate(() => [...window.__estudio.archivos.keys()]);
    const grande = t.panoramas.find((x) => x.id === "dormitorio-grande");
    inf.ok(grande.imagen_movil === "panos/movil/dormitorio-grande.jpg" && arch.includes(grande.imagen_movil) && t._estudio.meta[grande.imagen]?.w === 4400,
      "una foto de más de 4096 px genera además la versión móvil (4096 px)");
    inf.ok(t.panoramas.filter((x) => x.id !== "dormitorio-grande").every((x) => x.imagen_movil === x.imagen) && t.panoramas.every((x) => arch.includes(x.miniatura)),
      "las fotos pequeñas no duplican la versión móvil y todas tienen miniatura");
    await esperar(p, () => { const w = document.querySelector(__SEL.iframe).contentWindow; return w.visor?.tour?.panoramas?.length === 5 && !w.document.querySelector(__SEL.vistaVacia); }, null, 30000);
    inf.ok(true, "con fotos, la vista previa recibe el tour («visor:cargar») y quita el aviso");

    // ---- plano: subir, calibrar, colocar, conectar, estancia y muro
    await ir(p, "plano");
    await subir(p, SEL.subirPlano, de("plano.png"));
    await esperar(p, () => !!window.__estudio.tour.plantas[0].plano?.imagen && window.__plano.herr === "calibrar" && [...window.__plano.imgs.values()].some((i) => i.complete && i.naturalWidth > 0));
    const aP = (x, z) => p.evaluate(([x, z]) => { const S = window.__plano, r = S.lienzo.getBoundingClientRect(); return [r.left + S.ox + x * S.esc, r.top + S.oy + z * S.esc]; }, [x, z]);
    for (const pt of [await aP(0.5, 0.5), await aP(6.5, 0.5)]) await p.mouse.click(...pt);
    await p.waitForSelector(SEL.dialogoCampo);
    await p.fill(SEL.dialogoCampo, "6,5");
    await p.keyboard.press("Enter");
    await esperar(p, () => window.__estudio.tour._estudio.calibrado?.p0 === true);
    const plano = (await T(p)).plantas[0].plano;
    inf.ok(plano.ancho_m === 13 && Math.abs(plano.alto_m - 9.317) < 0.01, `calibrar 6 m del dibujo como «6,5» reescala el plano a 13 × 9,32 m (${plano.ancho_m} × ${plano.alto_m})`);

    const POS = { cocina: [3.2, 2.6], "estancia-2": [9.6, 2.6], "dormitorio-grande": [5.4, 5.6], pasillo: [2.6, 7.0], salon: [10.4, 7.0] };
    const NOM = { cocina: "Cocina", "estancia-2": "Estancia 2", "dormitorio-grande": "Dormitorio grande", pasillo: "Pasillo", salon: "Salón" };
    for (const [id, [x, z]] of Object.entries(POS)) await arrastrarFicha(p, NOM[id], id, () => aP(x, z));
    t = await T(p);
    const desv = Math.max(...t.panoramas.map((q) => Math.hypot(q.x - POS[q.id][0], q.z - POS[q.id][1])));
    inf.ok(desv < 0.1, `las 5 fotos se colocan arrastrándolas al plano (desviación máxima ${desv.toFixed(3)} m)`);

    await p.keyboard.press("l");
    for (const [a, b] of [["cocina", "estancia-2"], ["dormitorio-grande", "salon"]]) {
      await p.mouse.click(...(await aP(...POS[a])));
      await p.mouse.click(...(await aP(...POS[b])));
    }
    await esperar(p, () => window.__estudio.tour._estudio.manuales.length === 2);
    const manuales = (await T(p))._estudio.manuales.sort().join(", ");
    inf.ok(manuales === "cocina|estancia-2, dormitorio-grande|salon", "«Conectar» une dos parejas de fotos lejanas (enlaces manuales)", manuales);

    await p.keyboard.press("e");
    for (const pt of [[0.54, 0.54], [7.04, 0.54], [7.04, 4.87], [0.54, 4.87]]) await p.mouse.click(...(await aP(...pt)));
    await p.keyboard.press("Enter");
    await esperar(p, () => window.__estudio.tour.estancias.length === 1 && document.activeElement?.closest?.(__SEL.panelSeleccion) && document.activeElement.tagName === "INPUT");
    await p.keyboard.type("Salón comedor");
    await p.keyboard.press("Enter");
    await esperar(p, () => window.__estudio.tour.estancias[0]?.nombre?.es === "Salón comedor");
    const est = (await T(p)).estancias[0];
    const area = Math.abs(est.poligono.reduce((s, [x1, z1], i, a) => { const [x2, z2] = a[(i + 1) % a.length]; return s + x1 * z2 - x2 * z1; }, 0)) / 2;
    inf.ok(est.id === "cocina" && est.poligono.length === 4 && Math.abs(area - 28.15) < 0.4,
      `dibujar una estancia: toma el id de la foto que contiene, se renombra y mide ${area.toFixed(2)} m²`);

    await p.keyboard.press("m");
    await p.mouse.click(...(await aP(7.04, 0.54)));
    await p.mouse.click(...(await aP(12.4, 0.54)));
    await p.keyboard.press("Escape");
    await esperar(p, () => (window.__estudio.tour.plantas[0].muros?.length ?? 0) === 1);
    const muro = (await T(p)).plantas[0].muros[0];
    inf.ok([7.04, 0.54, 12.4, 0.54].every((v, i) => Math.abs(muro[i] - v) < 0.05), `dibujar un muro recto desde una esquina (${muro.join(", ")})`);
    await p.keyboard.press("v");
    // La vista previa recibe el plano editado (recarga diferida tras cada cambio).
    await esperar(p, () => { const t = document.querySelector(__SEL.iframe).contentWindow.visor?.tour;
      return t?.plantas?.[0]?.muros?.length === 1 && JSON.stringify(t.estancias ?? []).includes("Salón comedor"); }, null, 20000);
    inf.ok(true, "la vista previa recibe el plano editado (muro y estancia renombrada)");

    // ---- carrera: elegir estancia en la vista previa mientras esta se recarga (= la recarga diferida que sigue a
    //      editar un dato). Es una carrera: se prueba con la recarga a 300, 600 y 1000 ms de la elección (basta con que una falle).
    {
      const intentos = [];
      for (const ms of [300, 600, 1000]) {
        await esperar(p, () => window.__estudio.vista?.nodo === window.__estudio.nodo, null, 20000);
        const desde = await p.evaluate(() => window.__estudio.nodo);
        const destino = ["pasillo", "cocina", "salon"].find((x) => x !== desde);
        await p.evaluate(([d, ms]) => { const s = document.querySelector(__SEL.vistaNodo); s.value = d; s.dispatchEvent(new Event("change"));
          setTimeout(() => window.__estudio.vistaPrevia.enviar(), ms); }, [destino, ms]);
        await p.waitForTimeout(ms + 1500); // la recarga ya ha llegado; se espera a que todo se asiente y se mira dónde se queda
        await esperar(p, () => window.__estudio.vista?.nodo === window.__estudio.nodo, null, 20000).catch(() => {});
        await p.waitForTimeout(500);
        intentos.push({ ms, destino, ...(await p.evaluate(() => ({ app: window.__estudio.nodo, visor: document.querySelector(__SEL.iframe).contentWindow.visor?.estado?.nodo }))) });
      }
      const deshechas = intentos.filter((x) => x.app !== x.destino || x.visor !== x.destino);
      // Resuelta en la fase 3: al recargar, visor.js conserva el destino en curso (int.navDestino) y no envía «visor:vista» durante el viaje.
      inf.ok(!deshechas.length, "elegir una estancia en la vista previa mientras esta se recarga no deshace la elección (recarga a 300, 600 y 1000 ms)",
        deshechas.map((x) => `a ${x.ms} ms vuelve a «${x.app}» (visor en «${x.visor}») en vez de «${x.destino}»`).join("; "));
    }

    // ---- dirección y notas
    await esperar(p, () => window.__estudio.vista?.nodo === window.__estudio.nodo, null, 20000);
    await p.selectOption(SEL.vistaNodo, "salon");
    await ir(p, "orientar");
    await esperar(p, () => window.__estudio.vista?.nodo === "salon", null, 60000);
    await p.keyboard.press("]");
    await p.keyboard.press("Shift+BracketRight");
    await esperar(p, () => window.__estudio.tour.panoramas.find((q) => q.id === "salon").yaw === 11);
    inf.ok(true, "«]» gira la foto 1° y «Shift+]» 10° (yaw 11°)");
    // La vista previa ya refleja el giro: rumbo de la cámara = yaw + yawLocal.
    await esperar(p, () => { const v = window.__estudio.vista, y = window.__estudio.tour.panoramas.find((q) => q.id === "salon").yaw;
      return v?.nodo === "salon" && Math.abs((((v.rumbo - y - v.yawLocal + 180) % 360) + 360) % 360 - 180) < 0.3; }, null, 20000);
    await p.waitForSelector(SEL.alinearActivo);
    const antesAlinear = await p.evaluate(() => ({ yl: window.__estudio.vista.yawLocal, obj: document.querySelector(__SEL.objetivo).value }));
    await p.click(SEL.alinear);
    await esperar(p, () => /Hecho: la flecha hacia/.test(document.querySelector(__SEL.infoAlinear)?.textContent ?? ""));
    t = await T(p);
    const sal = t.panoramas.find((q) => q.id === "salon"), obj = t.panoramas.find((q) => q.id === antesAlinear.obj);
    const esperado = norm180(rumboDe(obj.x - sal.x, obj.z - sal.z) - antesAlinear.yl);
    inf.ok(Math.abs(norm180(sal.yaw - esperado)) < 0.2, `«Alinear» orienta la foto hacia ${tx(obj.nombre)} según el plano (yaw ${sal.yaw}°, esperado ${esperado.toFixed(1)}°)`);

    await p.keyboard.press("p");
    const ifr = await p.locator(SEL.iframe).boundingBox();
    await p.mouse.click(ifr.x + ifr.width * 0.4, ifr.y + ifr.height * 0.45);
    await esperar(p, () => window.__estudio.tour.panoramas.find((q) => q.id === "salon").puntos?.length === 1 && document.activeElement?.closest?.(__SEL.nota), null, 20000);
    await p.keyboard.type("Ventanal al sur");
    await p.keyboard.press("Enter");
    await esperar(p, () => window.__estudio.tour.panoramas.find((q) => q.id === "salon").puntos[0].titulo?.es === "Ventanal al sur");
    const nota = (await T(p)).panoramas.find((q) => q.id === "salon").puntos[0];
    inf.ok(Number.isFinite(nota.yaw) && Number.isFinite(nota.pitch), `«P» + clic en la vista previa crea una nota en ese punto (yaw ${nota.yaw}°, pitch ${nota.pitch}°)`);

    // ---- estilo y luz: estilos y foto de noche, máscara y aviso legal («Mostrar todo»: la vivienda no está marcada como obra nueva)
    await ir(p, "variantes");
    await p.click(SEL.mostrarTodo);
    await esperar(p, () => window.__estudio.tour._estudio.estiloTodo === true);
    await subir(p, SEL.subirEstilos, de("salon-nordico.jpg", "salon-noche.jpg", "salon-industrial.jpg"));
    await esperar(p, () => (window.__estudio.tour.panoramas.find((q) => q.id === "salon").variantes?.length ?? 0) === 3 && !document.querySelector(__SEL.cargando), null, 60000);
    const vs = (await T(p)).panoramas.find((q) => q.id === "salon").variantes.map((v) => `${v.estilo ?? "-"}/${v.momento}/${v.origen}`).join(", ");
    inf.ok(vs === "nordico/dia/ia, -/noche/foto, industrial/dia/ia", "estilo, momento y origen de cada variante se deducen del nombre del archivo", vs);

    await p.click(SEL.crearMascara);
    await esperar(p, () => { const c = document.querySelector(__SEL.lienzoMascara); return c && c.width > 50; });
    const lz = await p.locator(SEL.zonaMascara).boundingBox();
    const iw = Math.min(lz.width, lz.height * 2) * 0.98, ih = iw / 2, ix = lz.x + (lz.width - iw) / 2, iy = lz.y + (lz.height - ih) / 2;
    await p.mouse.click(ix + iw * 0.6, iy + ih * 0.45); // pared
    await p.keyboard.press("2");
    await p.mouse.click(ix + iw * 0.6, iy + ih * 0.85); // suelo
    await p.click(SEL.guardarMascara);
    await esperar(p, () => !!window.__estudio.tour.panoramas.find((q) => q.id === "salon").mascara && !document.querySelector(__SEL.editorMascara));
    const cob = await p.evaluate(async () => {
      const ruta = window.__estudio.tour.panoramas.find((q) => q.id === "salon").mascara;
      const bmp = await createImageBitmap(window.__estudio.archivos.get(ruta));
      const c = new OffscreenCanvas(bmp.width, bmp.height), g = c.getContext("2d");
      g.drawImage(bmp, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let r = 0, v = 0;
      for (let i = 0; i < d.length; i += 4) { if (d[i] > 127) r++; if (d[i + 1] > 127) v++; }
      return { ruta, w: bmp.width, h: bmp.height, paredes: r / (d.length / 4), suelo: v / (d.length / 4) };
    });
    inf.ok(cob.ruta === "panos/mascaras/salon.png" && cob.w === 2 * cob.h && cob.paredes > 0.3 && cob.suelo > 0.25,
      `máscara con la varita: paredes ${Math.round(cob.paredes * 100)} % y suelo ${Math.round(cob.suelo * 100)} % (PNG ${cob.w}×${cob.h})`);
    await p.click(SEL.textoRecomendado); // aviso legal de las imágenes (hay estilos IA): un solo campo, en Estilo y luz
    await esperar(p, () => /no contractuales/.test(JSON.stringify(window.__estudio.tour.inmueble?.aviso_legal ?? "")));

    // ---- datos del anuncio y contacto (Mi inmobiliaria)
    await ir(p, "datos");
    await campo(p, "Título del anuncio").fill("Piso reformado en Calle Mayor");
    await campo(p, "Referencia").fill("REF-1234");
    await campo(p, "Precio (€)").fill("349.000");
    await p.click(SEL.consumoC);
    await p.click(SEL.emisionesD);
    await p.locator(SEL.contactoDatos).first().click();
    await p.locator(SEL.campoPerfil("WhatsApp de la empresa")).fill("34600111222");
    await p.locator(SEL.campoPerfil("Tu política de privacidad (dirección)")).fill("https://www.ejemplo.com/privacidad");
    await guardarPerfil(p);
    t = await T(p);
    const I = t.inmueble;
    inf.ok(tx(t.titulo) === "Piso reformado en Calle Mayor" && I.referencia === "REF-1234" && I.precio === 349000 && I.certificado_energetico.consumo_letra === "C" && I.certificado_energetico.emisiones_letra === "D",
      "datos del anuncio guardados (el precio «349.000» se lee como 349000)");
    inf.ok(t.contacto.whatsapp === "34600111222" && t.contacto.url_privacidad === "https://www.ejemplo.com/privacidad", "contacto por WhatsApp y política de privacidad guardados (desde Mi inmobiliaria)");

    // ---- antes de publicar (cabecera de Publicar)
    await ir(p, "revisar");
    const resumen = await p.textContent(SEL.resumenRevisar);
    const oks = await p.$$eval(SEL.comprobacionOk, (bs) => bs.map((b) => b.textContent));
    inf.ok(/^Listo para publicar/.test(resumen), `«Antes de publicar» no encuentra nada por corregir («${resumen}»)`);
    inf.ok(oks.includes("Todas las fotos están en el plano") && oks.includes("Todas las fotos están conectadas") && oks.includes("Certificado energético C / D"),
      "«Antes de publicar» confirma fotos en el plano, todas conectadas y certificado energético", oks.join(" | "));

    // ---- publicar: tour.json
    await ir(p, "exportar");
    await abrirAvanzado(p);
    const tj = JSON.parse((await descargar(p, SEL.tourJson)).datos);
    const salon = tj.panoramas.find((x) => x.id === "salon");
    inf.ok(tj.version === 2 && !("_estudio" in tj) && tj.panoramas.length === 5 && tj.panoramas.every((x) => x.enlaces?.length > 0),
      "tour.json: versión 2, sin datos internos del Estudio y todas las fotos con enlaces");
    inf.ok(tx(salon.puntos?.[0]?.titulo) === "Ventanal al sur" && salon.variantes?.length === 3 && salon.mascara === "panos/mascaras/salon.png" && Number.isFinite(salon.yaw),
      "tour.json: la foto del salón lleva su nota, sus 3 variantes, su máscara y su giro");
    inf.ok(tj.estilos?.map((e) => e.id).join() === "original,nordico,industrial" && tx(tj.estancias?.[0]?.nombre) === "Salón comedor" && tj.plantas[0].muros?.length === 1,
      "tour.json: solo los estilos con imágenes, la estancia y el muro dibujados");
    const zonas = (tj.secciones ?? []).map((z) => `${tx(z.nombre)}: ${z.estancias.join("+")}`).join(" · ");
    inf.ok(/no contractuales/.test(tx(tj.inmueble?.aviso_legal)) && (tj.secciones?.length ?? 0) >= 2 && !("secciones" in (await T(p))),
      `aviso legal recomendado y ${tj.secciones?.length ?? 0} zonas de la vivienda automáticas, sin pulsar nada (${zonas})`);

    // ---- recarga: todo sigue guardado
    const antes = await p.evaluate(() => window.__estudio.archivos.size);
    await esperar(p, () => window.__estudio.guardado === "ok", null, 30000);
    await p.reload();
    await esperar(p, () => window.__estudio?.tour?.panoramas?.length > 0);
    const tras = await p.evaluate(() => ({ n: window.__estudio.tour.panoramas.length, a: window.__estudio.archivos.size, tit: window.__estudio.tour.titulo?.es, s: window.__estudio.seccion }));
    inf.ok(tras.n === 5 && tras.a === antes && tras.tit === "Piso reformado en Calle Mayor" && enPaso("exportar").includes(tras.s),
      `tras recargar se recupera el proyecto (5 fotos, ${tras.a}/${antes} archivos, título y paso actual)`);
    const err = erroresDe(p, IGNORAR);
    inf.ok(!err.length, "sin errores de consola", err.slice(0, 3).join(" | "));
  });

  // ================================================================== 2 · material del arquitecto y exportadores
  await inf.bloque("Planos del arquitecto, render 360, extras y exportadores", async () => {
    const { ctx, p } = await estudio();
    const idInicial = await p.evaluate(() => window.__estudio.proyecto.id);
    await p.click(SEL.proyecto);
    await p.click(SEL.proyectoNuevo);
    await esperar(p, (id) => window.__estudio.proyecto.id !== id && window.__estudio.tour.panoramas.length === 0 && !document.querySelector(__SEL.dialogo), idInicial);
    inf.ok(!(await p.$(SEL.dialogo)) && await p.evaluate(() => !("modo" in window.__estudio.tour._estudio)), "«Proyecto ▾ → Proyecto nuevo» crea el proyecto sin preguntar ningún modo");
    inf.ok(await p.evaluate(() => document.querySelectorAll(__SEL.pasosPrincipales).length === 4 && !!document.querySelector(__SEL.masHerramientas)),
      "el proyecto nuevo tiene los 4 pasos y «Más herramientas» (ya no hay modo completo de 8 pasos)");
    await fotos(p, ["salon.jpg", "cocina.jpg"], 2);

    // ---- planos del arquitecto en el paso Plano: DXF a escala y PDF de varias páginas
    await ir(p, "plano");
    await subir(p, SEL.subirPlano, de("planta.dxf"));
    await p.click(SEL.importarPlano);
    await esperar(p, () => (window.__estudio.tour.plantas[0].muros?.length ?? 0) > 0 && !!window.__estudio.tour.plantas[0].plano?.imagen);
    let t = await T(p);
    const pl0 = t.plantas[0];
    inf.ok(pl0.muros.length === 7 && Math.abs(pl0.plano.ancho_m - 11.5) < 0.01 && Math.abs(pl0.plano.alto_m - 8.2) < 0.01 && t._estudio.calibrado?.p0 === true,
      `DXF en milímetros: 7 tramos de muro (sin el mobiliario) y plano de ${pl0.plano.ancho_m} × ${pl0.plano.alto_m} m ya calibrado`);
    inf.ok(t.documentacion?.some((d) => d.archivo === "docs/planta.dxf" && d.tipo === "plano" && !d.publico), "el DXF original se guarda como documentación privada");

    await p.click(SEL.anadirPlanta);
    await p.waitForSelector(SEL.dialogoCampo);
    await p.fill(SEL.dialogoCampo, "Planta primera");
    await p.keyboard.press("Enter");
    await esperar(p, () => window.__estudio.tour.plantas.length === 2);
    await ir(p, "plano");
    await subir(p, SEL.subirPlano, de("planos.pdf"));
    await p.waitForSelector(SEL.paginaPdf, { timeout: 30000 });
    inf.ok(await p.locator(SEL.paginasPdf).count() === 2, "un PDF de 2 páginas ofrece elegir la página con miniaturas");
    await p.click(SEL.pagina2);
    await p.click(SEL.usarPagina);
    await esperar(p, () => !!window.__estudio.tour.plantas[1]?.plano?.imagen, null, 30000);
    t = await T(p);
    inf.ok(tx(t.plantas[1].nombre) === "Planta primera" && t.documentacion.some((d) => tx(d.nombre) === "planos (pág. 2)"), "la página 2 del PDF es el plano de la «Planta primera»");

    // ---- render 360 del arquitecto como estilo «Proyecto» (Estilo y luz); galería, modelo 3D, documentos y música (Extras)
    await ir(p, "variantes");
    await p.click(SEL.mostrarTodo);
    await esperar(p, () => window.__estudio.tour._estudio.estiloTodo === true);
    await p.click(SEL.primeraEstancia);
    await subir(p, SEL.subirEstilos, de("salon-nordico.jpg"));
    await esperar(p, () => (window.__estudio.tour.panoramas[0].variantes?.length ?? 0) === 1 && !document.querySelector(__SEL.cargando), null, 60000);
    await p.selectOption(SEL.estiloVariante, "__proyecto");
    await esperar(p, () => window.__estudio.tour.panoramas[0].variantes[0].estilo === "proyecto");
    await p.selectOption(SEL.origenVariante, "render");
    await esperar(p, () => window.__estudio.tour.panoramas[0].variantes[0].origen === "render");
    t = await T(p);
    const vr = t.panoramas[0].variantes[0];
    inf.ok(vr.estilo === "proyecto" && vr.origen === "render" && t.estilos.some((e) => e.id === "proyecto"), "un render 360 se añade como estilo «Proyecto» con origen render");

    await ir(p, "material");
    await subir(p, SEL.subirImagenes, de("render-salon.jpg"));
    await esperar(p, () => (window.__estudio.tour.galeria?.length ?? 0) === 1);
    await abrirAvanzado(p); // «Avanzado: modelo 3D»
    await subir(p, SEL.subirModelo, de("modelo.glb"));
    await esperar(p, () => !!window.__estudio.tour.libre);
    await subir(p, SEL.subirDocumentos, de("memoria-calidades.pdf"));
    await esperar(p, () => window.__estudio.tour.documentacion?.some((d) => d.tipo === "memoria"));
    await p.locator(SEL.publico).last().click();
    await esperar(p, () => window.__estudio.tour.documentacion.find((d) => d.tipo === "memoria")?.publico === true);
    await subir(p, SEL.subirMusica, de("musica-prueba.wav"));
    await esperar(p, () => !!window.__estudio.tour.audio?.musica?.archivo);
    await p.locator(SEL.licenciaMusica).check();
    await esperar(p, () => window.__estudio.tour._estudio.musicaLicencia === true);
    t = await T(p);
    inf.ok(t.galeria[0].tipo === "render" && t.galeria[0].estancia === "salon", "la imagen de la galería se marca como render y se asocia al salón por su nombre");
    inf.ok(t.libre?.tipo === "glb" && t.libre.url === "modelo/modelo.glb" && t.documentacion.some((d) => d.tipo === "modelo" && !d.publico), "el GLB activa el paseo libre y queda como material privado");
    inf.ok(t.audio.musica.archivo === "audio/musica-prueba.wav" && t._estudio.musicaLicencia === true, "música del proyecto con la licencia confirmada");

    // ---- exportadores (con la web escrita: enlace y QR reales; sin web no se genera ninguno de ejemplo)
    await ir(p, "exportar");
    await p.fill(SEL.webPublicar, "https://www.inmo-prueba.es");
    await p.keyboard.press("Tab");
    await esperar(p, () => window.__estudio.tour.marca?.web === "https://www.inmo-prueba.es");
    await habilitado(p, SEL.zipWeb);
    const web = await descargar(p, SEL.zipWeb);
    const z = leerZip(web.datos), rutas = Object.keys(z), tz = jsonDe(z["tour.json"]);
    inf.ok(["index.html", "visor.js", "visor.css", "paneles.js", "paneles.css", "i18n.js", "util.js", "vendor/qr.js"].every((f) => rutas.includes(f)), "ZIP web: incluye el visor completo");
    const sobran = ["demo.js", "exportar.js", "vendor/fflate.js", "vendor/fix-webm-duration.js"].filter((f) => rutas.includes(f));
    inf.ok(!sobran.length, "ZIP web: sin la demo ni las herramientas de exportación (demo.js, exportar.js, fflate, fix-webm-duration)", sobran.join(", "));
    inf.ok(["modelo/modelo.glb", "audio/musica-prueba.wav", "docs/memoria-calidades.pdf"].every((f) => rutas.includes(f)) && rutas.filter((r) => r.startsWith("plantas/")).length === 2 && rutas.some((r) => r.startsWith("renders/")),
      "ZIP web: modelo 3D, música, documento público, galería y los planos de las dos plantas");
    inf.ok(!rutas.some((r) => r.startsWith("estudio/") || r.endsWith(".dxf") || r === "docs/planos.pdf") && !("_estudio" in tz) && tz.documentacion?.length === 1,
      "ZIP web: sin la carpeta estudio/, sin los planos originales del arquitecto y solo la documentación pública");

    const f360 = leerZip((await descargar(p, SEL.fotos360)).datos);
    const n360 = Object.keys(f360).sort();
    inf.ok(n360.join() === "01-cocina.jpg,02-salon.jpg" && n360.every((n) => Buffer.from(f360[n].subarray(0, 6000)).toString("latin1").includes('GPano:ProjectionType="equirectangular"')),
      `fotos 360 para portales con metadatos GPano (${n360.join(", ")})`);
    const planoPng = await descargar(p, SEL.planoPng);
    inf.ok(planoPng.datos.subarray(1, 4).toString() === "PNG" && planoPng.datos.readUInt32BE(16) === 2400, `plano PNG de 2400 px (${planoPng.nombre})`);

    const [pop] = await Promise.all([ctx.waitForEvent("page"), p.click(SEL.dossier)]);
    await pop.waitForSelector(SEL.hoja, { timeout: 30000 });
    const dos = await pop.evaluate(() => ({ planos: document.querySelectorAll(__SEL.hojaPlanos).length, qr: !!document.querySelector(__SEL.hojaQr), h2: [...document.querySelectorAll(__SEL.hojaTitulos)].map((x) => x.textContent) }));
    inf.ok(dos.planos === 2 && dos.qr && dos.h2.includes("Datos principales") && dos.h2.includes("Certificado energético"), "dossier A4: los 2 planos, QR del enlace, datos y certificado energético", dos);
    await pop.close();

    const build = asegurarBuild();
    inf.ok(build.ok, `visor autónomo compilado al día (dist/)${build.recompilado ? ": recompilado" : ""}`, build.error);
    const html = await descargar(p, SEL.htmlAutonomo); // «Recorrido en un solo archivo» (Para tus clientes)
    const shtml = html.datos.toString("utf8");
    inf.ok(html.nombre.endsWith(".html") && shtml.includes("window.TOUR_EMBEBIDO") && !shtml.includes("docs/planta.dxf") && !shtml.includes('"_estudio"'),
      `HTML autónomo de ${(html.datos.length / 1048576).toFixed(1)} MB con el tour incrustado y sin material privado`);
    const js = bytesJS(shtml);
    inf.ok(js > 0 && js < 2.5 * 1048576, `el HTML autónomo usa el visor ligero (${(js / 1048576).toFixed(2)} MB de JS, < 2,5 MB): el modo libre no se incrusta por defecto`);

    await habilitado(p, SEL.video);
    const video = await descargar(p, SEL.video, 120000);
    const estadoVideo = await p.locator(SEL.estadoVideo).textContent();
    inf.ok(/\.(webm|mp4)$/.test(video.nombre) && video.datos.length > 50000 && /Vídeo (WEBM|MP4) 1920×1080/.test(estadoVideo),
      `vídeo 16:9 de la visita guiada (${video.nombre}, ${(video.datos.length / 1024).toFixed(0)} KB · «${estadoVideo}»)`);

    // ---- deshacer / rehacer
    await ir(p, "material");
    const n0 = (await T(p)).documentacion.length;
    await p.locator(SEL.quitarDocumento).last().click();
    await esperar(p, (n) => window.__estudio.tour.documentacion.length === n - 1, n0);
    await p.keyboard.press("Control+z");
    await esperar(p, (n) => window.__estudio.tour.documentacion.length === n, n0);
    await p.keyboard.press("Control+Shift+z");
    await esperar(p, (n) => window.__estudio.tour.documentacion.length === n - 1, n0);
    await p.keyboard.press("Control+z");
    await esperar(p, (n) => window.__estudio.tour.documentacion.length === n, n0);
    inf.ok(true, "Ctrl+Z / Ctrl+Shift+Z deshacen y rehacen quitar un documento");

    // ---- importar el ZIP publicado como proyecto nuevo
    const idAntes = await p.evaluate(() => window.__estudio.proyecto.id);
    await p.click(SEL.proyecto);
    await subir(p, SEL.restaurar, [archivo("recorrido.zip", web.datos)]);
    await esperar(p, (id) => window.__estudio.proyecto.id !== id && window.__estudio.tour.panoramas.length === 2 && window.__estudio.guardado === "ok", idAntes, 60000);
    const ti = await T(p);
    inf.ok(ti.plantas.length === 2 && ti.plantas[0].muros?.length === 7 && ti.libre?.url && ti.galeria?.length === 1 && ti.audio?.musica?.archivo && !("modo" in ti._estudio),
      "importar el ZIP publicado («Proyecto ▾ → Restaurar copia…») crea un proyecto nuevo con plantas, muros, modelo, galería y música");
    const err = erroresDe(p, IGNORAR);
    inf.ok(!err.length, "sin errores de consola", err.slice(0, 3).join(" | "));
  });

  // ================================================================== 3 · guía, datos esenciales, ZIP público y copia de seguridad
  let copia = null;
  await inf.bloque("Guía, datos esenciales, Mi inmobiliaria, ZIP público sin privados y copia de seguridad", async () => {
    const { ctx, p } = await estudio();
    // La lista que deja la Guía Osmo 360 en este navegador (localStorage), como si se hubiera usado antes de abrir el Estudio:
    // el Estudio la ofrece («Usar · No usar») y, con «Usar», las fotos la toman en orden de disparo (S-10).
    await p.evaluate(() => localStorage.setItem("cre8eight:asistente", JSON.stringify({ estancias: ["Salón", "Cocina"], tomas: { Cocina: 2 } })));
    await p.reload();
    await esperar(p, () => window.__estudio?.tour && document.querySelector(window.__SEL.pasos));
    await p.click(SEL.usarGuia);
    await esperar(p, () => !document.querySelector(__SEL.ofertaGuia));
    await fotos(p, ["salon.jpg", "cocina.jpg", "pasillo.jpg", "DJI_20250314_0001.jpg"], 4);
    let t = await T(p);
    inf.ok(t.panoramas.map((x) => tx(x.nombre)).join() === "Salón,Cocina,Cocina 2,Salón",
      "con «Usar», las fotos toman los nombres de la Guía Osmo 360 en orden de disparo", t.panoramas.map((x) => tx(x.nombre)).join());
    await p.click(SEL.bajarPrimera);
    await esperar(p, () => window.__estudio.tour.panoramas[0].id === "cocina");
    inf.ok((await T(p)).panoramas.map((x) => x.id).join() === "cocina,salon,cocina-2,salon-2", "el botón ↓ cambia el orden de la visita sin arrastrar");

    // vista previa: muestra el proyecto, no la demo
    await esperar(p, () => { const w = document.querySelector(__SEL.iframe).contentWindow; return w.visor?.tour?.panoramas?.length === 4 && w.document.querySelector(__SEL.panelesRaiz); }, null, 60000);
    const vp = await p.evaluate(() => { const w = document.querySelector(__SEL.iframe).contentWindow; return { demo: !!w.visor.tour.demo, ref: w.visor.tour.inmueble?.referencia ?? null, texto: w.document.querySelector(__SEL.panelesVista)?.innerText ?? "" }; });
    inf.ok(!vp.demo && vp.ref !== "DEMO-001" && !/DEMO-001|Inmobiliaria Demo|Demo ·/.test(vp.texto), "la vista previa muestra el proyecto y ningún dato de la demo", vp);

    await p.click(SEL.continuarPlano);
    await esperar(p, () => window.__estudio.seccion === "plano");
    await p.click(SEL.saltarPlano); // el plano es opcional: «Saltar → Datos»
    await esperar(p, () => window.__estudio.seccion === "datos");
    await campo(p, "Precio (€)").fill("349.000");
    await campo(p, "m² construidos").fill("112,5");
    await campo(p, "m² útiles").fill("96");
    await campo(p, "Habitaciones").fill("3");
    await campo(p, "Baños").fill("2");
    await p.click(SEL.consumoC);
    await p.click(SEL.emisionesD);
    await p.locator(SEL.contactoDatos).first().click(); // «Completar Mi inmobiliaria»
    await p.locator(SEL.campoPerfil("WhatsApp de la empresa")).fill("34 600 111 222");
    const priv = p.locator(SEL.campoPerfil("Tu política de privacidad (dirección)"));
    await priv.fill("javascript:alert(1)");
    await priv.press("Tab");
    await p.click(SEL.guardarPerfil); // no se guarda: el diálogo sigue abierto con el error
    const errPriv = await p.locator(SEL.errorPrivacidad).textContent();
    inf.ok((await T(p)).contacto?.url_privacidad == null && /empezando por https:\/\//.test(errPriv) && (await priv.getAttribute("aria-invalid")) === "true" && !!(await p.$(SEL.dialogo)),
      "una dirección javascript: se rechaza con un mensaje claro y no se guarda", errPriv);
    await priv.fill("https://www.ejemplo.com/privacidad");
    await guardarPerfil(p);
    t = await T(p);
    const I = t.inmueble;
    inf.ok(I.precio === 349000 && I.superficie_construida === 112.5 && I.superficie_util === 96 && I.habitaciones === 3 && I.banos === 2 && t.contacto.whatsapp === "34 600 111 222" && t.contacto.url_privacidad === "https://www.ejemplo.com/privacidad",
      "los datos esenciales y Mi inmobiliaria se guardan con formato español («349.000», «112,5»)");
    await esperar(p, () => /349\.000/.test(document.querySelector(__SEL.iframe).contentDocument?.querySelector(__SEL.panelesVista)?.innerText ?? ""), null, 20000);
    inf.ok(true, "la vista previa se actualiza con el precio del Estudio");

    await ir(p, "material");
    await subir(p, SEL.subirDocumentos, de("nota-simple-privada.pdf", "memoria-calidades.pdf"));
    await esperar(p, () => (window.__estudio.tour.documentacion?.length ?? 0) === 2);
    await p.evaluate(() => { // la casilla «Público» de la fila de la memoria de calidades
      const fila = [...document.querySelectorAll(__SEL.filaDocumento)].find((f) => [...f.querySelectorAll("input")].some((i) => i.value === "memoria-calidades"));
      fila.querySelector(__SEL.casillaPublico).click();
    });
    await esperar(p, () => window.__estudio.tour.documentacion.find((d) => d.tipo === "memoria")?.publico === true);
    await subir(p, SEL.subirMusica, de("musica-prueba.wav"));
    await esperar(p, () => !!window.__estudio.tour.audio?.musica?.archivo);
    await ir(p, "revisar");
    const errores = await p.$$eval(SEL.comprobacionError, (bs) => bs.map((b) => b.textContent));
    inf.ok(errores.includes("Falta confirmar la licencia de la música"), "«Antes de publicar» exige confirmar la licencia de la música", errores.join(" | "));
    await ir(p, "material");
    await p.locator(SEL.licenciaMusica).check();
    await ir(p, "revisar");
    const resumen = await p.textContent(SEL.resumenRevisar);
    inf.ok(resumen === "Listo para publicar · 1 sugerencia para pulirlo.",
      `con la licencia confirmada: «${resumen}» (sin plano no hay error de conexiones; título y referencia son automáticos; solo falta completar Mi inmobiliaria)`);

    await habilitado(p, SEL.zipWeb);
    const z = leerZip((await descargar(p, SEL.zipWeb)).datos), rutas = Object.keys(z), tz = jsonDe(z["tour.json"]);
    inf.ok(rutas.includes("docs/memoria-calidades.pdf") && !rutas.some((r) => r.includes("nota-simple") || r.startsWith("estudio/")) && tz.documentacion?.map((d) => d.archivo).join() === "docs/memoria-calidades.pdf",
      "ZIP público: el documento público sí, la nota simple privada y la carpeta estudio/ no");
    const cadena = tz.panoramas.map((x) => `${x.id}@${x.x}→${x.enlaces.join("+")}`).join(" ");
    inf.ok(cadena === "cocina@0→salon salon@2.5→cocina+cocina-2 cocina-2@5→salon+salon-2 salon-2@7.5→cocina-2", "sin plano, las fotos se conectan en fila en el orden de la lista", cadena);
    inf.ok(tz.audio?.musica?.archivo === "audio/musica-prueba.wav" && rutas.includes("audio/musica-prueba.wav"), "la música viaja en el ZIP público");

    copia = await descargar(p, async () => { await p.click(SEL.proyecto); await p.click(SEL.copiaSeguridad); });
    const zc = leerZip(copia.datos), pj = jsonDe(zc["estudio/proyecto.json"]);
    inf.ok(["docs/nota-simple-privada.pdf", "estudio/proyecto.json", "tour.json", "LEEME.txt"].every((r) => r in zc) && !("modo" in pj.tour._estudio) && pj.tour._estudio.musicaLicencia === true && pj.tour.estilos.length === 6,
      "copia de seguridad («Proyecto ▾»): incluye lo privado y el proyecto de trabajo completo (licencia de la música, estilos y ajustes)");
    const err = erroresDe(p, IGNORAR);
    inf.ok(!err.length, "sin errores de consola", err.slice(0, 3).join(" | "));
  });

  await inf.bloque("Restaurar la copia de seguridad en un navegador limpio", async () => {
    if (!copia) { console.log("  (se omite: el bloque anterior no llegó a descargar la copia de seguridad)"); return; }
    const { ctx, p } = await estudio({}, "#revisar");
    inf.ok(enPaso("revisar").includes(await p.evaluate(() => window.__estudio.seccion)), "estudio.html#revisar abre directamente ese paso");
    await p.click(SEL.proyecto);
    await subir(p, SEL.restaurar, [archivo(copia.nombre, copia.datos)]);
    await esperar(p, () => window.__estudio.tour.panoramas.length === 4 && window.__estudio.guardado === "ok", null, 60000);
    const r = await p.evaluate(() => ({ t: window.__estudio.tour, n: window.__estudio.archivos.size }));
    inf.ok(!("modo" in r.t._estudio) && r.t.estilos.length === 6 && r.t.contacto.whatsapp === "34 600 111 222" && r.t.documentacion.length === 2 && r.t._estudio.musicaLicencia === true && r.n === 11,
      `la copia se restaura íntegra: estilos, contacto, 2 documentos, música con licencia y ${r.n} archivos`);
  });

  // ================================================================== 4 · iPad y «Colocar»
  await inf.bloque("iPad vertical (768×1024 táctil) y «Colocar» sin arrastrar (1024×768)", async () => {
    {
      const { ctx, p } = await estudio({ ancho: 768, alto: 1024, movil: true, escala: 2 });
      await fotos(p, ["salon.jpg", "cocina.jpg", "pasillo.jpg"], 3);
      const pequenos = (pagina) => pagina.evaluate(() => [...document.querySelectorAll(__SEL.boton)].filter((b) => b.offsetParent && b.getBoundingClientRect().width > 0 && b.getBoundingClientRect().height < 44)
        .map((b) => ({ txt: `${(b.textContent || b.getAttribute("aria-label") || b.className).trim().slice(0, 24)} ${Math.round(b.getBoundingClientRect().height)}px`, herr: !!b.closest(__SEL.herramientasPlano) })));
      for (const [hash, nombre] of [["fotos", "Fotos"], ["plano", "Plano"], ["datos", "Datos"], ["revisar", "Revisar"], ["exportar", "Publicar"]]) {
        await ir(p, hash);
        const peq = await pequenos(p);
        const otros = peq.filter((b) => !b.herr), herr = peq.filter((b) => b.herr);
        inf.ok(!otros.length, `iPad · ${nombre}: los botones visibles miden al menos 44 px de alto`, otros.map((b) => b.txt).join(", "));
        if (hash === "plano" && (await inf.requiere(p, { "herramientas del plano": SEL.herramientasPlano }, "iPad · tamaño de las herramientas del plano")))
          inf.ok(!herr.length, "iPad · Plano: las herramientas (Seleccionar, Calibrar, Estancia, Conectar) miden al menos 44 px", herr.map((b) => b.txt).join(", "));
      }
      await p.tap(SEL.botonVista);
      await esperar(p, () => { const r = document.querySelector(__SEL.vista).getBoundingClientRect(); return document.body.classList.contains("vista-abierta") && r.left >= -1 && r.right <= innerWidth + 1 && r.width > 200; });
      await p.tap(SEL.botonVista);
      await esperar(p, () => document.querySelector(__SEL.vista).getBoundingClientRect().left >= innerWidth - 1);
      inf.ok(true, "iPad: el botón «Vista previa» abre y cierra el cajón de la vista previa");
      await ctx.close();
    }
    {
      const { ctx, p } = await estudio({ ancho: 1024, alto: 768 });
      await fotos(p, ["salon.jpg", "cocina.jpg"], 2);
      await ir(p, "plano");
      await subir(p, SEL.subirPlano, de("plano.png"));
      await esperar(p, () => !!window.__estudio.tour.plantas[0].plano?.imagen);
      await p.keyboard.press("Escape");
      await p.click(SEL.colocar);
      const c = await p.locator(SEL.lienzoPlano).boundingBox();
      await p.mouse.click(c.x + c.width * 0.4, c.y + c.height * 0.45);
      await esperar(p, () => window.__estudio.tour.panoramas.filter((q) => Number.isFinite(q.x)).length === 1);
      const ps = (await T(p)).panoramas;
      inf.ok(Number.isFinite(ps[0].x) && !Number.isFinite(ps[1].x), "«Colocar» + clic en el plano coloca la foto sin arrastrar (WCAG 2.5.7)");
      await esperar(p, () => !!document.activeElement?.closest?.(__SEL.fichaFoto));
      inf.ok(true, "tras colocarla, el foco pasa a la siguiente foto pendiente");
      const cajon = await p.evaluate(() => ({ boton: !!document.querySelector(__SEL.botonVista).offsetParent, fuera: document.querySelector(__SEL.vista).getBoundingClientRect().left >= innerWidth - 1 }));
      inf.ok(cajon.boton && cajon.fuera, "a 1024 px la vista previa es un cajón plegado con su botón visible", cajon);
      const err = erroresDe(p, IGNORAR);
      inf.ok(!err.length, "sin errores de consola", err.slice(0, 3).join(" | "));
    }
  });

  // ================================================================== 5 · guardado, atajos y CRM
  await inf.bloque("Fallo de guardado, atajos de una tecla y prueba del CRM (1280×800)", async () => {
    const { ctx, p } = await estudio({ ancho: 1280, alto: 800 });
    await p.evaluate(() => {
      const orig = IDBObjectStore.prototype.put;
      window.__restaurarIDB = () => { IDBObjectStore.prototype.put = orig; };
      IDBObjectStore.prototype.put = function (v, k) { if (this.name === "archivos") throw new DOMException("No queda espacio", "QuotaExceededError"); return orig.call(this, v, k); };
    });
    await fotos(p, ["salon.jpg"], 1);
    await esperar(p, () => window.__estudio.guardado === "error" && document.querySelector(__SEL.dialogo));
    const dlg = await p.textContent(SEL.dialogo);
    inf.ok(/no queda espacio en el navegador/.test(dlg) && /copia de seguridad/.test(dlg) && (await p.textContent(SEL.estadoGuardado)).includes("Sin guardar"),
      "sin espacio para guardar: diálogo claro (descargar copia de seguridad) y «Sin guardar» en la barra");
    await p.click(SEL.entendido);
    await p.evaluate(() => window.__restaurarIDB());
    await p.keyboard.press("Control+s");
    await esperar(p, () => window.__estudio.guardado === "ok");
    inf.ok((await p.textContent(SEL.estadoGuardado)).includes("Guardado"), "al liberar espacio, Ctrl+S reintenta y vuelve a «Guardado»");
    await p.reload();
    await esperar(p, () => window.__estudio?.tour?.panoramas?.length === 1);
    inf.ok(await p.evaluate(() => window.__estudio.archivos.size === 2), "tras el reintento, la foto y su miniatura sobreviven a una recarga");

    // Los atajos de una tecla se desactivan en «?» (Ayuda y atajos)
    await p.click(SEL.ayuda);
    await p.click(SEL.interruptorAtajos);
    await p.keyboard.press("Escape");
    await esperar(p, () => !document.querySelector(__SEL.dialogo));
    const antes = await p.evaluate(() => window.__estudio.seccion);
    await p.keyboard.press("3");
    inf.ok(await p.evaluate((s) => window.__estudio.seccion === s && window.__estudio.atajos === false, antes), "con los atajos de una tecla desactivados, «3» no cambia de paso");
    await p.click(SEL.ayuda);
    await p.click(SEL.interruptorAtajos);
    await p.keyboard.press("Escape");
    await esperar(p, () => !document.querySelector(__SEL.dialogo));
    await tecla(p, "3", "datos");
    inf.ok(true, "al reactivarlos, «3» vuelve a llevar al paso 3 (Datos)");

    const recibidos = [];
    let estado = 200;
    await ctx.route("https://crm.prueba.test/**", async (r) => {
      recibidos.push({ tipo: r.request().headers()["content-type"] ?? "", cuerpo: r.request().postDataBuffer()?.toString("latin1") ?? "" });
      await r.fulfill({ status: estado, body: "{}", contentType: "application/json", headers: { "access-control-allow-origin": "*" } });
    });
    await p.click(SEL.perfil); // el CRM se configura una vez, en Mi inmobiliaria
    await p.click(SEL.apartadoCrm);
    const hook = p.locator(SEL.campoPerfil("Dirección de conexión que te da tu CRM"));
    await hook.fill("http://crm.prueba.test/hook");
    await hook.press("Tab");
    inf.ok(await p.locator(SEL.errorCrm).textContent() === "La dirección debe empezar por https://",
      "la conexión con el CRM exige https://");
    await hook.fill("https://crm.prueba.test/hook");
    const resultado = async () => {
      await p.click(SEL.probarCrm);
      await esperar(p, () => /Recibido|rechazado|No se ha podido|Enviado\./.test(document.querySelector(__SEL.resultadoCrm)?.textContent ?? ""), null, 20000);
      return p.textContent(SEL.resultadoCrm);
    };
    const ok200 = await resultado();
    inf.ok(/^Recibido: tu CRM ha aceptado la consulta de prueba \(respuesta 200\)/.test(ok200) && recibidos.length === 1 && /multipart\/form-data/.test(recibidos[0].tipo) && /name="nombre"/.test(recibidos[0].cuerpo) && /name="foto_1"/.test(recibidos[0].cuerpo),
      "«Enviar una consulta de prueba» llega al CRM (multipart con datos y foto) y confirma la respuesta", ok200);
    estado = 500;
    const ko = await resultado();
    inf.ok(/rechazado la consulta \(error 500\)/.test(ko), "si el CRM responde con error, se explica (error 500)", ko);
    const err = erroresDe(p, [...IGNORAR, /Error de almacenamiento/, /QuotaExceededError/]);
    inf.ok(!err.length, "sin errores de consola inesperados", err.slice(0, 3).join(" | "));
  });
} catch (e) {
  inf.ok(false, "excepción no controlada", e.message);
} finally {
  await navegador.close();
  cerrar();
}
process.exit(inf.fin());
