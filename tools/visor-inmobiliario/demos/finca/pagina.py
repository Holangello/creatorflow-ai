# Del HTML autónomo a la página del Artifact: título propio, sin <!doctype>/<html>/<head>/<body> (los pone el Artifact) y
# un puente para que el tema claro u oscuro del visor de Artifacts sea la propuesta inicial (la elección del visitante,
# si la hay, gana).
#   python3 -I pagina.py <autonomo.html> <pagina.html> <título>
import sys
ent, sal, titulo = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(ent, encoding="utf-8").read()
fin_titulo = s.index("</title>\n") + len("</title>\n")
assert s.startswith("<!doctype html>") and fin_titulo < 600, s[:300]
s = f"<title>{titulo}</title>\n" + s[fin_titulo:]
puente = """<script>
(() => {
  const aplicar = () => { const t = document.documentElement.dataset.theme; if (t && window.cre8Tema) cre8Tema.porDefecto({ tema: t === "dark" ? "oscuro" : "claro" }); };
  aplicar();
  new MutationObserver(aplicar).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
})();
</script>
"""
i = s.index("</script>") + len("</script>\n")  # tras tema.js
s = s[:i] + puente + s[i:]
for t in ["</head>\n", "<body>\n", "</body>\n", "</html>\n"]:
    assert s.count(t) == 1, t
    s = s.replace(t, "")
open(sal, "w", encoding="utf-8").write(s)
print(round(len(s.encode()) / 1048576, 2), "MB")
