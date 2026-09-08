#!/usr/bin/env python3
"""Genera el Pack Offline de Angello: linkedin/PACK-OFFLINE.md y dashboard/pack-offline.html.

Fuentes: linkedin/banco-posts.json (textos elegidos), linkedin/cola/*.md (briefs de producción),
linkedin/calendario.md, linkedin/04-guia-diseno.md y, si existe, linkedin/pack-adaptaciones.md
(adaptaciones a otras redes y guías de redacción escritas por el copywriter).

Uso: python3 tools/pack_offline.py
"""
import json, re, html, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
LI = ROOT / "linkedin"
days = json.loads((LI / "banco-posts.json").read_text())
cal = (LI / "calendario.md").read_text()
guia = (LI / "04-guia-diseno.md").read_text()
adapt_path = LI / "pack-adaptaciones.md"
adapt = adapt_path.read_text() if adapt_path.exists() else ""
today = datetime.date(2026, 9, 8)

COLA = {
    "mie": "2026-09-09-actualidad-sora.md",
    "jue": "2026-09-10-carrusel-sistema-makers.md",
    "lun14": "2026-09-14-briefing-40-paginas.md",
    "jue17": "2026-09-17-contenido-lo-hacemos-dentro.md",
}
FECHA = {"d1": "Martes 8 de septiembre", "mie": "Miércoles 9 de septiembre", "jue": "Jueves 10 de septiembre",
         "vie": "Viernes 11 de septiembre", "lun14": "Lunes 14 de septiembre", "caso": "Martes 15 de septiembre",
         "jue17": "Jueves 17 de septiembre"}

def section(path, header):
    """Devuelve el bloque de un archivo de cola desde un encabezado ## hasta el siguiente ##."""
    t = (LI / "cola" / path).read_text()
    m = re.search(r"^## " + re.escape(header) + r".*?(?=^## |\Z)", t, re.S | re.M)
    return m.group(0) if m else ""

out = []
w = out.append
w("# Pack Offline · Angello Benavides × Makers")
w("")
w(f"**Generado el {today.strftime('%d/%m/%Y')} a partir del repositorio.** Todo lo que necesitas para producir y publicar sin el sistema hasta que vuelvan los créditos: textos finales, primeros comentarios, briefs de diseño paso a paso, adaptaciones a otras redes, guías para escribir las piezas pendientes y la lista de tareas que puedes hacer sin conexión.")
w("")
w("Regla de la casa mientras estés solo: **las escenas se pueden reconstruir, las cifras de cliente no.** Todo lo marcado como `[DATO]` se confirma o se quita antes de publicar.")
w("")
w("## 1 · Rutina diaria de publicación (20 minutos)")
w("")
w("| Paso | Cuándo | Qué |")
w("| --- | --- | --- |")
w("| 1 | Hora de la pieza (08:15, 09:00 o 12:30) | Pega el texto tal cual, con sus saltos de línea. Sin enlaces en el cuerpo. Máximo 3 hashtags al final. |")
w("| 2 | Minuto 0 | Publica el primer comentario (está debajo de cada pieza). Los enlaces van ahí. |")
w("| 3 | Minutos 0 a 60 | Responde a todos los comentarios con más de cinco palabras. Esa hora decide la distribución. |")
w("| 4 | Después | Comenta en 5 publicaciones de directores de marketing o fundadores de agencia (tu ICP). Comentarios con criterio, no «gran post». |")
w("| 5 | Nunca | No edites el post en las 2 primeras horas. No borres comentarios críticos: contesta. |")
w("| 6 | A las 48 h y a los 7 días | Apunta las cifras en la tabla del final. Impresiones, comentarios, guardados, clics a perfil, mensajes. |")
w("")
w("**Franjas:** lunes 08:15 autoridad · martes 12:30 prueba · miércoles 08:15 actualidad · jueves 12:30 oferta · viernes 09:00 humano.")
w("")

w("## 2 · Piezas listas para publicar")
w("")
for d in days:
    fecha = FECHA.get(d["id"], d["date"])
    chosen = d.get("chosen")
    w(f"### {fecha} · {d['hora']} · {d['pilar']}")
    w("")
    w(f"**Formato:** {d['formato']}. **Intensidad:** {'confrontación pura' if d['tono']=='pura' else 'método'}. **Métrica que mide:** {d['metrica']}.")
    w("")
    if d.get("data"):
        w(f"> **Antes de publicar:** {d['data']}")
        w("")
    if chosen is None:
        w("**Estado: bloqueada.** Necesita cliente autorizado y cifras reales. Las tres versiones están escritas; elige una cuando tengas el dato y rellena los `[DATO]`.")
        w("")
    for i, a in enumerate(d["alts"]):
        mark = " · **ELEGIDA**" if chosen == i else ""
        w(f"#### Versión {a['tag']} · {a['name']}{mark}")
        w("")
        w(f"_{a['why']}_")
        w("")
        w("**Texto del post:**")
        w("")
        w("```")
        w(a["text"])
        w("```")
        w("")
        w("**Primer comentario:**")
        w("")
        w("```")
        w(a["comment"])
        w("```")
        w("")
        if chosen is not None and chosen != i:
            pass
    # brief de producción
    if d["id"] in COLA:
        path = COLA[d["id"]]
        if d["id"] == "jue":
            t = (LI / "cola" / path).read_text()
            m = re.search(r"^## Estructura.*", t, re.S | re.M)
            w("#### Brief de producción del carrusel (Figma, 115 min)")
            w("")
            w(m.group(0).strip() if m else "")
            w("")
        elif d["id"] == "jue17":
            w("#### Brief de la imagen (Figma, 35 min)")
            w("")
            w(section(path, "Brief de la imagen").split("\n", 1)[1].strip())
            w("")
    if d.get("media") and d["id"] not in ("jue", "jue17"):
        w(f"**Pieza visual:** {d['media']['tag']} · «{d['media']['title']}». {d['media']['note']}")
        w("")

w("## 3 · Adaptaciones a otras redes y guías de las piezas pendientes")
w("")
if adapt:
    w(adapt.strip())
else:
    w("_Pendiente: el copywriter aún no ha entregado esta sección._")
w("")

w("## 4 · Calendario completo de septiembre")
w("")
m = re.search(r"## Semana 1.*?(?=## Temas en reserva)", cal, re.S)
w(m.group(0).strip() if m else "")
w("")
m = re.search(r"## Temas en reserva.*", cal, re.S)
w(m.group(0).strip() if m else "")
w("")

w("## 5 · Guía de diseño resumida")
w("")
w(guia.split("\n", 1)[1].strip())
w("")

w("## 6 · Lo que puedes hacer sin el sistema (por orden de impacto)")
w("")
w("### Datos que solo tú tienes (desbloquean piezas)")
w("")
w("1. **Días de rodaje por mes y piezas por rodaje** de SISTEMA MAKERS. Desbloquea el carrusel del jueves 10 y la pieza del jueves 17.")
w("2. **Un cliente autorizado con cifras** (piezas al mes antes y después, semanas de antelación del calendario, horas perdidas por rodaje). Desbloquea el caso del martes 15 y el antes/después del viernes 18.")
w("3. **Segundo cliente** para el caso del martes 22.")
w("4. **Número de plazas de retainer para Q4** (jueves 24).")
w("5. **Qué datos de tu historia Perú → Madrid quieres contar** (viernes 2 de octubre).")
w("")
w("### Producción visual (Figma, sin conexión)")
w("")
w("- Carrusel SISTEMA MAKERS, 10 slides (brief en la sección 2, jueves 10). Exporta PDF < 10 MB y la portada en PNG.")
w("- Imagen «Contenido \"gratis\": 430 € por pieza publicada» (brief en la sección 2, jueves 17). Dos variantes, negra y clara.")
w("- Foto propia 4:5 para el viernes 11: en set o en reunión, sin posado, luz natural.")
w("- Vídeo vertical 45–90 s para el lunes 28 («Si tu vídeo empieza con un dron…»): gancho en pantalla 0–3 s, subtítulos quemados, 1080×1350.")
w("- Vídeos de 30–45 s para Instagram y TikTok con los guiones de la sección 3.")
w("")
w("### Redes (10 minutos cada una)")
w("")
w("- Reservar el usuario **@makers_agencia** en Instagram: quedó libre al renombrar y las menciones antiguas apuntan ahí.")
w("- Cambiar nombre y bio de **Threads de MAKERS Wedding** al nuevo (no se sincroniza con Instagram).")
w("- Sustituir el **Linktree** del perfil de Instagram de Angello por angellobenavides.com.")
w("- Cambiar el nombre de TikTok de Wedding a «Fotógrafos de Bodas · Madrid» (el bloqueo de 7 días ya venció).")
w("")
w("### Webs y ventas (lo que bloquea al sistema)")
w("")
w("- **Cron de hPanel** (Avanzado → Trabajos cron, cada 15 minutos): sin él la cadencia de seguimiento no avanza sola.")
w("- **Contraseña SMTP de info@moixandco.com** en el `.env` del CRM: sin ella los acuses caen en spam.")
w("- **Renovar makerswedding.com** indefinidamente: las dos citas de IA apuntan a ese dominio.")
w("- creatribe.es: cambiar el **H1** (es idéntico al de agenciamakers) y poner **CTA y formulario en Servicios**.")
w("- moixandco.com/contacto: dejar **una sola promesa de plazo** (hoy hay tres distintas).")
w("- Decidir **cuánto vale tu hora**: fija el umbral de las llamadas con IA (20 leads/mes a 25 €, 10 a 50 €).")
w("")
w("## 7 · Registro de métricas (rellena a mano)")
w("")
w("| Fecha | Pieza | Impresiones 48 h | Impresiones 7 d | Comentarios | Guardados | Clics a perfil | Mensajes | Nota |")
w("| --- | --- | --- | --- | --- | --- | --- | --- | --- |")
for d in days:
    w(f"| {d['date']} | {d['short']} |  |  |  |  |  |  |  |")
w("")
w("Cuando vuelvan los créditos, pega esta tabla y escribe: «Maverick, registra las métricas». El analista actualiza `05-metricas.md` y ajusta la estrategia.")
w("")

md = "\n".join(out)
(LI / "PACK-OFFLINE.md").write_text(md)

# ---------------- HTML ----------------
def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\w*])_(.+?)_(?![\w*])", r"<em>\1</em>", t)
    t = re.sub(r"(?<!\*)\*(?!\*)([^*]+?)\*(?!\*)", r"<em>\1</em>", t)
    return t

def md_to_html(src):
    lines = src.split("\n"); i = 0; h = []; toc = []
    while i < len(lines):
        l = lines[i]
        if l.startswith("```"):
            buf = []; i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                buf.append(lines[i]); i += 1
            code = html.escape("\n".join(buf), quote=False)
            h.append(f'<div class="copyblock"><button class="copy" type="button" data-copy>Copiar</button><pre>{code}</pre></div>')
            i += 1; continue
        m = re.match(r"^(#{1,4}) (.*)", l)
        if m:
            lvl = len(m.group(1)); txt = m.group(2)
            hid = re.sub(r"[^a-z0-9]+", "-", txt.lower().encode("ascii", "ignore").decode()).strip("-")[:60] or f"s{i}"
            if lvl == 2: toc.append((hid, txt))
            h.append(f'<h{lvl} id="{hid}">{inline(txt)}</h{lvl}>'); i += 1; continue
        if l.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                rows.append(lines[i]); i += 1
            cells = [[c.strip() for c in r.strip().strip("|").split("|")] for r in rows]
            cells = [c for c in cells if not all(re.fullmatch(r":?-+:?", x or "-") for x in c)]
            if cells:
                head = "".join(f"<th>{inline(c)}</th>" for c in cells[0])
                body = "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in cells[1:])
                h.append(f'<div class="tw"><table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>')
            continue
        if l.startswith(">"):
            buf = []
            while i < len(lines) and lines[i].startswith(">"):
                buf.append(lines[i][1:].strip()); i += 1
            h.append(f'<blockquote>{inline(" ".join(buf))}</blockquote>'); continue
        if re.match(r"^\s*(-|\d+\.) ", l):
            ordered = bool(re.match(r"^\s*\d+\.", l)); buf = []
            while i < len(lines) and re.match(r"^\s*(-|\d+\.) ", lines[i]):
                item = re.sub(r"^\s*(-|\d+\.) ", "", lines[i]); i += 1
                while i < len(lines) and lines[i].startswith("   ") and not re.match(r"^\s*(-|\d+\.) ", lines[i]):
                    item += " " + lines[i].strip(); i += 1
                buf.append(f"<li>{inline(item)}</li>")
            tag = "ol" if ordered else "ul"
            h.append(f"<{tag}>{''.join(buf)}</{tag}>"); continue
        if l.strip() == "":
            i += 1; continue
        buf = []
        while i < len(lines) and lines[i].strip() and not re.match(r"^(#{1,4} |```|\||>|\s*(-|\d+\.) )", lines[i]):
            buf.append(lines[i].strip()); i += 1
        h.append(f"<p>{inline(' '.join(buf))}</p>")
    return "\n".join(h), toc

body, toc = md_to_html(md)
nav = "".join(f'<a href="#{hid}">{html.escape(t)}</a>' for hid, t in toc)
page = f"""<title>Pack Offline Makers</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=IBM+Plex+Sans:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root{{--paper:#EEF0F3;--surface:#FFFFFF;--sunk:#E3E6EA;--ink:#0F1216;--ink-2:#3B424B;--muted:#6B737D;--line:#D5D9DF;--accent:#6E1B3C;--accent-soft:#F3E3E9;--warn:#8A5A12;--warn-soft:#F5E9D2;
--display:"Bricolage Grotesque","IBM Plex Sans",sans-serif;--sans:"IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;--mono:"IBM Plex Mono",ui-monospace,Menlo,monospace}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--paper:#0F1216;--surface:#171B21;--sunk:#0B0E11;--ink:#EEF0F3;--ink-2:#C5CAD1;--muted:#8E97A1;--line:#2A3038;--accent:#E88AAB;--accent-soft:#3A1A27;--warn:#DCB268;--warn-soft:#2E2515}}}}
:root[data-theme="dark"]{{--paper:#0F1216;--surface:#171B21;--sunk:#0B0E11;--ink:#EEF0F3;--ink-2:#C5CAD1;--muted:#8E97A1;--line:#2A3038;--accent:#E88AAB;--accent-soft:#3A1A27;--warn:#DCB268;--warn-soft:#2E2515}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.6}}
.shell{{display:grid;grid-template-columns:260px minmax(0,1fr);min-height:100vh}}
nav.toc{{position:sticky;top:0;height:100vh;overflow:auto;border-right:1px solid var(--line);padding:22px 14px;display:flex;flex-direction:column;gap:2px;background:var(--surface)}}
nav.toc .k{{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding:6px 10px 10px}}
nav.toc a{{display:block;padding:8px 10px;border-radius:8px;color:var(--ink-2);text-decoration:none;font-size:13px;font-weight:600}}
nav.toc a:hover{{background:var(--sunk);color:var(--ink)}}
nav.toc .act{{margin-top:auto;display:flex;flex-direction:column;gap:6px;padding-top:12px;border-top:1px solid var(--line)}}
.btn{{display:inline-flex;align-items:center;justify-content:center;height:38px;padding:0 14px;border-radius:999px;font-weight:600;font-size:13px;border:1.5px solid transparent;cursor:pointer;font-family:var(--sans);text-decoration:none}}
.btn.primary{{background:var(--accent);color:#fff}}.btn.tool{{background:var(--sunk);color:var(--ink-2)}}.btn.nav{{border-color:var(--accent);color:var(--accent);background:var(--surface)}}
main{{padding:36px clamp(20px,5vw,64px) 96px;max-width:900px}}
h1{{font-family:var(--display);font-size:clamp(30px,4.5vw,44px);font-weight:800;letter-spacing:-.025em;line-height:1.05;margin:0 0 14px}}
h2{{font-family:var(--display);font-size:26px;font-weight:800;letter-spacing:-.02em;margin:56px 0 12px;padding-top:22px;border-top:2px solid var(--ink)}}
h3{{font-family:var(--display);font-size:19px;font-weight:700;margin:34px 0 8px;letter-spacing:-.01em}}
h4{{font-family:var(--mono);font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin:24px 0 8px}}
p{{margin:0 0 12px;max-width:72ch}}strong{{font-weight:600}}
code{{font-family:var(--mono);font-size:.88em;background:var(--sunk);padding:.1em .35em;border-radius:4px}}
blockquote{{margin:0 0 14px;border-left:3px solid var(--warn);background:var(--warn-soft);padding:10px 14px;border-radius:0 8px 8px 0;color:var(--ink-2)}}
.copyblock{{position:relative;margin:0 0 14px}}
pre{{margin:0;font-family:var(--sans);font-size:14.5px;line-height:1.55;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:16px 18px;white-space:pre-wrap;word-wrap:break-word;color:var(--ink)}}
.copy{{position:absolute;top:8px;right:8px;height:28px;padding:0 10px;border-radius:999px;background:var(--sunk);color:var(--ink-2);font:600 11.5px var(--sans);border:0;cursor:pointer}}
.copy:hover{{background:var(--accent);color:#fff}}
.tw{{overflow-x:auto;margin:0 0 16px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}}
table{{border-collapse:collapse;width:100%;font-size:13px;min-width:520px}}
th{{text-align:left;font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);padding:10px 12px;border-bottom:1px solid var(--line);white-space:nowrap}}
td{{padding:9px 12px;border-bottom:1px solid var(--line);vertical-align:top}}tr:last-child td{{border-bottom:0}}
ul,ol{{padding-left:1.2em;margin:0 0 14px}}li{{margin-bottom:5px;max-width:72ch}}
.toast{{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:var(--ink);color:var(--paper);padding:9px 16px;border-radius:999px;font-size:13px;opacity:0;transition:.2s;pointer-events:none}}.toast.on{{opacity:1}}
@media (max-width:860px){{.shell{{grid-template-columns:1fr}}nav.toc{{position:static;height:auto;border-right:0;border-bottom:1px solid var(--line)}}}}
@media print{{nav.toc,.copy{{display:none}}.shell{{display:block}}main{{max-width:none;padding:0}}pre{{border:1px solid #999}}h2{{break-before:page}}}}
</style>
<div class="shell">
<nav class="toc"><span class="k">Pack offline</span>{nav}
<div class="act"><button class="btn primary" type="button" onclick="window.print()">Imprimir o guardar PDF</button><a class="btn nav" href="https://github.com/Holangello/creatorflow-ai/blob/claude/linkedin-angello-strategy-myu9oo/linkedin/PACK-OFFLINE.md" target="_blank" rel="noopener">Ver el .md en GitHub</a><button class="btn tool" type="button" id="theme">Tema claro / oscuro</button></div></nav>
<main>{body}</main>
</div>
<div class="toast" id="toast"></div>
<script>
document.addEventListener('click',e=>{{const b=e.target.closest('[data-copy]');if(!b)return;const t=b.nextElementSibling.textContent;navigator.clipboard&&navigator.clipboard.writeText(t).then(()=>{{const x=document.getElementById('toast');x.textContent='Copiado';x.classList.add('on');setTimeout(()=>x.classList.remove('on'),1400);}});}});
document.getElementById('theme').addEventListener('click',()=>{{const r=document.documentElement;const d=r.getAttribute('data-theme')==='dark';r.setAttribute('data-theme',d?'light':'dark');}});
</script>
"""
(ROOT / "dashboard" / "pack-offline.html").write_text(page)
print("ok", len(md), "chars md;", len(page), "chars html")
