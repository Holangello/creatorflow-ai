#!/usr/bin/env python3
"""Exporta el inventario publicable a una herramienta de programacion.

Resuelve el unico cuello que no depende de la disciplina diaria de Angello: en vez
de publicar a mano cada dia, carga el inventario una vez y la herramienta publica.

Genera dos ficheros, y son dos porque ninguna herramienta hace las dos cosas:

  salida/programador-posts.csv      el cuerpo de cada pieza con su fecha y hora
  salida/programador-comentarios.md el primer comentario de cada pieza, en el mismo orden

Buffer importa CSV pero NO acepta el primer comentario por CSV: se anade en el
compositor, pieza a pieza. Publer si programa primer comentario y su importacion
CSV esta documentada de forma contradictoria. De Taplio no hay fuente fiable.
Comprobado el 15-10-2026 y sin poder abrir la documentacion de ninguna de las
tres desde esta sesion, asi que el CSV sale con nombres de columna genericos:
al importar hay que mapearlos, es un minuto y evita inventarse un esquema.

Uso:
    python3 tools/exportar_programador.py                      # 2/semana desde el proximo lunes
    python3 tools/exportar_programador.py --cadencia 5         # cinco por semana, lun-vie
    python3 tools/exportar_programador.py --desde 2026-10-19
"""
import argparse, csv, json, datetime as dt, pathlib, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
BANCO = RAIZ / "linkedin" / "banco-posts.json"
SALIDA = RAIZ / "salida"

# Por que cada pieza queda fuera. La razon va escrita: una exclusion sin motivo
# vuelve a entrar sola dentro de dos semanas.
EXCLUIDAS = {
    "mie":   "archivada por caducidad (09-09, la API de Sora)",
    "jue":   "no utilizable: el cuerpo nombra el carrusel y arrastra un [DATO] abierto",
    "caso":  "bloqueada: espera cliente autorizado y cifras reales",
    "mie16": "archivada por caducidad (16-09, Adobe en la linea de tiempo)",
}

# Piezas con fecha de caducidad propia: no se programan mas alla de ese dia.
CADUCA = {"mie07": dt.date(2026, 10, 17)}

# Piezas que ya tienen franja asignada en el calendario. Si su dia es ANTERIOR al
# arranque del export, no se reprograman: o ya salieron, o hay que decidir sobre
# ellas antes, y meterlas nueve semanas despues seria duplicarlas. Una pieza cuya
# franja cae justo el dia de arranque si entra: es la primera de la cola.
CON_FRANJA = {
    "lun12": dt.date(2026, 10, 12),
    "vie18": dt.date(2026, 10, 13),
    "mie07": dt.date(2026, 10, 14),
    "jue15": dt.date(2026, 10, 15),
    "mie30": dt.date(2026, 10, 16),
    "lun14": dt.date(2026, 10, 19),
    "mar06": dt.date(2026, 10, 20),
    "jue24": dt.date(2026, 10, 22),
    "vie":   dt.date(2026, 10, 23),
    "mie23": dt.date(2026, 10, 30),
}

# Piezas que necesitan una palabra de Angello antes de cargarse.
PENDIENTES = {"mie23": "una frase por confirmar: que el habito de lectura del parrafo de "
                       "autocritica es suyo. Si no lo es, se cae ese parrafo y queda en 1.422"}

# Orden recomendado: rota pilares para que no salgan dos del mismo seguidas.
PRIORIDAD = ["Autoridad", "Oferta", "Prueba", "Humano", "Actualidad"]

HORA = {"Autoridad": "09:30", "Actualidad": "09:30", "Humano": "09:30",
        "Prueba": "12:30", "Oferta": "12:30"}


def pilar(entrada):
    return entrada["pilar"].split(" ·")[0].strip()


def ordenar(piezas):
    """Reparte en rondas, una pieza de cada pilar por ronda, para que la
    secuencia no encadene dos del mismo pilar."""
    por_pilar = {p: [] for p in PRIORIDAD}
    for x in piezas:
        por_pilar.setdefault(pilar(x), []).append(x)
    orden = []
    while any(por_pilar.values()):
        for p in PRIORIDAD:
            if por_pilar.get(p):
                orden.append(por_pilar[p].pop(0))
    return orden


def fechas(desde, cadencia, cuantas):
    """2/semana = lunes y jueves. 5/semana = lunes a viernes. Nunca fin de semana."""
    dias = {2: {0, 3}, 3: {0, 2, 4}, 5: {0, 1, 2, 3, 4}}[cadencia]
    salida, d = [], desde
    while len(salida) < cuantas:
        if d.weekday() in dias:
            salida.append(d)
        d += dt.timedelta(days=1)
    return salida


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cadencia", type=int, default=2, choices=[2, 3, 5],
                    help="piezas por semana (por defecto 2: lunes y jueves)")
    ap.add_argument("--desde", default=None, help="AAAA-MM-DD; por defecto el proximo lunes")
    ap.add_argument("--incluir-pendientes", action="store_true", dest="incluir_pendientes",
                    help="incluye tambien las piezas cuya franja ya paso (usalo solo si sabes "
                         "que no se publicaron)")
    args = ap.parse_args()

    if args.desde:
        desde = dt.date.fromisoformat(args.desde)
    else:
        hoy = dt.date.today()
        desde = hoy + dt.timedelta(days=(7 - hoy.weekday()) % 7 or 7)

    banco = json.loads(BANCO.read_text(encoding="utf-8"))
    piezas = [x for x in banco if x["id"] not in EXCLUIDAS]
    if not piezas:
        sys.exit("no hay piezas publicables: revisa EXCLUIDAS")

    # Fuera las que ya tenian franja antes del arranque: o salieron, o hay que
    # decidir sobre ellas primero. Programarlas nueve semanas despues las duplica.
    ya_pasadas = {x["id"]: CON_FRANJA[x["id"]] for x in piezas
                  if x["id"] in CON_FRANJA and CON_FRANJA[x["id"]] < desde}
    if not args.incluir_pendientes:
        piezas = [x for x in piezas if x["id"] not in ya_pasadas]

    orden = ordenar(piezas)
    dias = fechas(desde, args.cadencia, len(orden))

    SALIDA.mkdir(exist_ok=True)
    filas, avisos = [], []
    for pieza, dia in zip(orden, dias):
        alt = pieza["alts"][pieza["chosen"]]
        p = pilar(pieza)
        tope = CADUCA.get(pieza["id"])
        if tope and dia > tope:
            avisos.append(f"{pieza['id']} «{pieza['short']}» caduca el {tope:%d-%m} "
                          f"y le toca el {dia:%d-%m}: NO la cargues, decide antes si sale o se archiva")
        filas.append({
            "fecha": dia.isoformat(),
            "hora": HORA.get(p, "09:30"),
            "texto": alt["text"],
            "primer_comentario": alt["comment"],
            "pilar": p,
            "version": alt.get("name", ""),
            "id": pieza["id"],
            "caracteres": len(alt["text"]),
        })

    csv_path = SALIDA / "programador-posts.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(filas[0].keys()))
        w.writeheader()
        w.writerows(filas)

    md = [f"# Primeros comentarios · {len(filas)} piezas · generado el {dt.date.today():%d-%m-%Y}", "",
          "**Esto existe porque el primer comentario no viaja por CSV en Buffer.** Se pega en el",
          "compositor, pieza a pieza, en el mismo orden que el CSV. Es una sentada de media hora en",
          "lugar de dieciocho dias de disciplina, y es la unica parte manual que queda.", ""]
    for fila in filas:
        md += [f"## {fila['fecha']} {fila['hora']} · {fila['id']} · {fila['pilar']}", "",
               "```", fila["primer_comentario"], "```", ""]
    (SALIDA / "programador-comentarios.md").write_text("\n".join(md), encoding="utf-8")

    print(f"ok · {len(filas)} piezas · {args.cadencia}/semana desde {desde:%d-%m-%Y} "
          f"hasta {dias[-1]:%d-%m-%Y}")
    print("   OJO: este CSV SUSTITUYE las filas del calendario a partir del arranque, no las suma.")
    print("   A 2/semana las fechas no coinciden con las del calendario de 5 franjas: si cargas")
    print("   esto y ademas sigues el calendario, publicas dos veces la misma pieza.")
    print(f"   {csv_path.relative_to(RAIZ)}")
    print(f"   {(SALIDA / 'programador-comentarios.md').relative_to(RAIZ)}")
    for pieza_id, motivo in EXCLUIDAS.items():
        print(f"   fuera · {pieza_id}: {motivo}")
    for pieza_id, dia in sorted(ya_pasadas.items(), key=lambda kv: kv[1]):
        print(f"   fuera · {pieza_id}: su franja fue el {dia:%d-%m}, anterior al arranque. "
              f"Si no se publico, re-ejecuta con --incluir-pendientes")
    for fila in filas:
        if fila["id"] in PENDIENTES:
            print(f"   PENDIENTE · {fila['id']} «{fila['fecha']}»: {PENDIENTES[fila['id']]}")
        if fila["caracteres"] > 1600:
            print(f"   PENDIENTE · {fila['id']}: {fila['caracteres']} caracteres, por encima "
                  f"del techo de 1.600")
    for aviso in avisos:
        print(f"   AVISO · {aviso}")


if __name__ == "__main__":
    main()
