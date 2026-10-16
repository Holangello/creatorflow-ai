# Recorrido de la demo «finca» con fotos 360 reales de libre uso (Poly Haven, CC0: Lythwood, KwaZulu-Natal, Greg Zaal).
# Las medidas de cada estancia salen de ajustar su contorno (suelo, techo y esquinas) sobre la foto; el plano une las
# estancias de forma orientativa (la distribución real de la casa no se conoce). Norte arriba: el salón mira al norte
# (hemisferio sur: el lado del sol). Escribe sitio/tour.json.
#   python3 -I tour.py
import json, math, pathlib

RAIZ = pathlib.Path(__file__).resolve().parent
T = lambda es, en: {"es": es, "en": en}
r2 = lambda v: round(v, 2)

def rumbo(a, b):
    """Rumbo (grados, horario desde arriba del plano) de a hacia b, como util.js: atan2(dx, −dz)."""
    return math.degrees(math.atan2(b[0] - a[0], -(b[1] - a[1])))

# ---------------------------------------------------------------- cámaras (x, z en metros; z hacia abajo = sur)
S = (12.0, 20.0)    # salón: eje largo del salón a 62° del centro de la foto → yaw −62
B = (9.47, 30.35)   # dormitorio: la ventana a 38° del centro de la foto y al sur → yaw 142
TE = (13.0, 6.0)    # terraza: frente a la fachada del jardín (en la foto, a unos 20 m; aquí más cerca para la maqueta)
J = (28.0, 4.0)     # jardín: el césped al este de la terraza
YAW = {"salon": -62.0, "dormitorio": 142.0}
# la casa en las fotos de fuera: los ventanales del salón a 40° en la terraza; la fachada central a −101° en el jardín
YAW["terraza"] = (rumbo(TE, S) - 40.0 + 540) % 360 - 180
YAW["jardin"] = rumbo(J, S) + 101.0

def salon_plano(u, t):   # marco del salón (u hacia los ventanales = norte, t a su derecha = este) → plano
    return [r2(S[0] + t), r2(S[1] - u)]

def dorm_plano(x, f):    # marco del dormitorio (f hacia la ventana = sur, x a su derecha = oeste) → plano
    return [r2(B[0] - x), r2(B[1] + f)]

A = -0.45  # línea del arco entre el salón y la sala de estar (u)
salon = [salon_plano(*p) for p in [(5.95, -3.65), (5.95, 2.6), (A, 2.6), (A, 5.6), (-6.9, 5.6), (-6.9, -4.24), (A, -4.24),
                                   (A, -4.9), (2.3, -4.9), (2.3, -3.65)]]
dormitorio = [dorm_plano(*p) for p in [(-2.3, -3.3), (3.0, -3.3), (3.0, 2.75), (-1.75, 2.75), (-1.75, 0.35), (-2.3, 0.35)]]
caja = lambda c, a, b: [[r2(c[0] - a), r2(c[1] - b)], [r2(c[0] + a), r2(c[1] - b)], [r2(c[0] + a), r2(c[1] + b)], [r2(c[0] - a), r2(c[1] + b)]]
terraza = [[6.0, -1.0], [20.0, -1.0], [20.0, 13.6], [6.0, 13.6]]  # hasta la fachada
jardin = [[20.4, -4.0], [36.0, -4.0], [36.0, 12.0], [20.4, 12.0]]

# ---------------------------------------------------------------- muros: contornos con huecos en las puertas
def con_huecos(poligono, huecos):
    """Muros del contorno; `huecos`: [(x, z, ancho)] → el lado que pasa por (x, z) se corta con ese ancho."""
    muros = []
    for i in range(len(poligono)):
        a, b = poligono[i], poligono[(i + 1) % len(poligono)]
        L = math.hypot(b[0] - a[0], b[1] - a[1]); ux, uz = (b[0] - a[0]) / L, (b[1] - a[1]) / L
        cortes = []
        for (x, z, w) in huecos:
            s = (x - a[0]) * ux + (z - a[1]) * uz; d = abs(-(x - a[0]) * uz + (z - a[1]) * ux)
            if d < 0.05 and 0 < s < L: cortes.append((s - w / 2, s + w / 2))
        p = 0.0
        for (c0, c1) in sorted(cortes):
            if c0 > p: muros.append([r2(a[0] + ux * p), r2(a[1] + uz * p), r2(a[0] + ux * c0), r2(a[1] + uz * c0)])
            p = c1
        if p < L: muros.append([r2(a[0] + ux * p), r2(a[1] + uz * p), b[0], b[1]])
    return muros

PUERTA_SALA = salon_plano(-6.9, -1.2)          # puerta de la sala de estar (sur)
PUERTA_DORM = dorm_plano(-1.33, -3.3)          # puerta del dormitorio (norte)
muros = con_huecos(salon, [(S[0] + 0.3, S[1] - 5.95, 2.6), (PUERTA_SALA[0], PUERTA_SALA[1], 0.9)])
muros += [[r2(S[0] - 4.9), r2(S[1] - A), r2(S[0] - 1.4), r2(S[1] - A)], [r2(S[0] + 1.3), r2(S[1] - A), r2(S[0] + 2.6), r2(S[1] - A)]]  # jambas del arco
muros += con_huecos(dormitorio, [(PUERTA_DORM[0], PUERTA_DORM[1], 0.9), (dorm_plano(-2.3, -1.67)[0], dorm_plano(-2.3, -1.67)[1], 0.8)])
# armario empotrado (bloque del dormitorio)
muros += [[r2(dormitorio[3][0]), r2(dormitorio[3][1]), r2(dormitorio[4][0]), r2(dormitorio[4][1])]]

# ---------------------------------------------------------------- textos
punto = lambda yaw, pitch, titulo, texto: {"yaw": yaw, "pitch": pitch, "titulo": titulo, "texto": texto}
panos = [
    {"id": "terraza", "nombre": T("Terraza", "Terrace"), "x": TE[0], "z": TE[1], "yaw": r2(YAW["terraza"]),
     "rumbo_inicial": r2(YAW["terraza"] + 15), "enlaces": ["jardin", "salon"],
     "puntos": [punto(18, -6, T("Fuente", "Fountain"), T("Fuente de piedra frente a la fachada del jardín.", "Stone fountain in front of the garden façade.")),
                punto(142, 12, T("Roble centenario", "Century-old oak"), T("La terraza, de adoquín, queda a la sombra de un gran roble.", "The paved terrace lies in the shade of a great oak."))]},
    {"id": "jardin", "nombre": T("Jardín", "Garden"), "x": J[0], "z": J[1], "yaw": r2(YAW["jardin"]),
     "rumbo_inicial": r2(YAW["jardin"] - 95), "enlaces": ["terraza"],
     "puntos": [punto(-101, 3, T("La casa", "The house"), T("La casa vista desde el césped, con el bosque detrás.", "The house seen from the lawn, with the woods behind."))]},
    {"id": "salon", "nombre": T("Salón", "Living room"), "x": S[0], "z": S[1], "yaw": YAW["salon"],
     "rumbo_inicial": YAW["salon"] + 40, "enlaces": ["terraza", "dormitorio"],
     "puntos": [punto(60, 2, T("Ventanales al jardín", "French doors to the garden"), T("Tres puertas de cristal se abren al césped y a la terraza.", "Three glass doors open onto the lawn and the terrace.")),
                punto(103, -6, T("Estufa de leña", "Wood-burning stove"), T("Estufa de hierro fundido en el salón principal.", "Cast-iron stove in the main living room.")),
                punto(-125, 2, T("Sala de estar", "Sitting room"), T("Tras el arco: parquet de madera noble, chimenea de piedra y piano.", "Beyond the arch: hardwood parquet, stone fireplace and piano.")),
                punto(-25, 0, T("Rincón de lectura", "Reading nook"), T("Muro de piedra vista y ventana en esquina.", "Exposed stone wall and corner window."))]},
    {"id": "dormitorio", "nombre": T("Dormitorio", "Bedroom"), "x": B[0], "z": B[1], "yaw": YAW["dormitorio"],
     "rumbo_inicial": YAW["dormitorio"] + 25, "enlaces": ["salon"],
     "puntos": [punto(121, -8, T("Chimenea", "Fireplace"), T("Chimenea en el propio dormitorio.", "A fireplace in the bedroom itself.")),
                punto(35, 3, T("Vistas al jardín", "Garden views"), T("Ventana al jardín, con cortinas de lino.", "Window onto the garden, with linen curtains.")),
                punto(-81, 0, T("Baño en suite", "En-suite bathroom"), T("Baño completo dentro del dormitorio.", "Full bathroom within the bedroom.")),
                punto(-20, 6, T("Armarios empotrados", "Built-in wardrobes"), T("Armarios a medida del suelo al techo.", "Floor-to-ceiling bespoke wardrobes."))]},
]
for p in panos:
    p.update({"planta": "p0", "origen": "foto", "imagen": f"panos/{p['id']}.jpg", "miniatura": f"panos/mini/{p['id']}.jpg",
              "mascara": f"panos/mascaras/{p['id']}.png"})  # canal B: las ventanas (de noche, cielo o luz encendida)

tour = {
    "version": 2,
    "titulo": T("Finca señorial con jardín", "Country manor with gardens"),
    "portada": True, "idioma": "es", "idiomas": ["es", "en"],
    "marca": {"nombre": "Inmobiliaria Demo", "web": "https://example.com",
              "pie_legal": T("Demo de cre8eight con fotos 360 reales de libre uso. Registro de agentes: AICAT 0000",
                             "cre8eight demo with real free-to-use 360 photos. Agent registry: AICAT 0000")},
    "agente": {"nombre": "Ana Pérez", "telefono": "+34 600 111 222", "email": "ana@example.com"},
    "contacto": {"modo": "whatsapp", "whatsapp": "34600111222", "url_privacidad": "https://example.com/privacidad"},
    "inmueble": {
        "referencia": "DEMO-FINCA", "operacion": "venta", "tipo": "finca", "estado_obra": "construido",
        "precio": 1950000, "moneda": "EUR", "superficie_construida": 480, "superficie_parcela": 12000,
        "habitaciones": 6, "banos": 5, "calefaccion": T("Chimeneas y estufa de leña", "Fireplaces and wood stove"),
        "terraza": True, "jardin": True,
        "caracteristicas": [T("Chimeneas y estufa de leña", "Wood-burning fireplaces and stove"),
                            T("Parquet de madera noble en la sala de estar", "Hardwood parquet in the sitting room"),
                            T("Ventanales al jardín", "French doors to the garden"),
                            T("Terraza bajo un roble centenario", "Terrace under a century-old oak"),
                            T("Fuente y césped", "Fountain and lawns"),
                            T("Dormitorio en suite con chimenea", "En-suite bedroom with fireplace")],
        "descripcion": T("Casa señorial de campo rodeada de césped y arbolado maduro. El salón principal, con estufa de leña y "
                         "ventanales al jardín, se abre por un gran arco a una sala de estar con parquet y chimenea de piedra. "
                         "El dormitorio en suite tiene chimenea y vistas al jardín, y la terraza, a la sombra de un roble "
                         "centenario, mira a la fuente y a la fachada.",
                         "Country manor surrounded by lawns and mature trees. The main living room, with a wood-burning stove "
                         "and French doors to the garden, opens through a wide arch onto a sitting room with parquet and a "
                         "stone fireplace. The en-suite bedroom has a fireplace and garden views, and the terrace, shaded by "
                         "a century-old oak, faces the fountain and the façade."),
        "direccion": T("KwaZulu-Natal (Sudáfrica)", "KwaZulu-Natal (South Africa)"), "mostrar_direccion_exacta": False,
        "ubicacion": {"lat": -29.44, "lng": 30.05},
        "aviso_legal": T("Demostración con fotos 360 reales de libre uso: Lythwood, KwaZulu-Natal (Greg Zaal · Poly Haven, CC0). "
                         "Plano orientativo; precio y datos ficticios. No es un inmueble en venta.",
                         "Demo with real free-to-use 360 photos: Lythwood, KwaZulu-Natal (Greg Zaal · Poly Haven, CC0). "
                         "Approximate floor plan; price and details are fictitious. Not a property for sale."),
    },
    "altura_camara": 1.5, "norte": 0, "inicio": "terraza",
    # fecha, hora y lugar reales de las fotos (Poly Haven: 22 y 23 de marzo de 2018, hacia mediodía; GPS a 2 decimales)
    "sol": {"fecha": "2018-03-22T11:30:00+02:00", "desfase": 120, "lat": -29.44, "lng": 30.05, "cielo": "cubierto"},
    "plantas": [{"id": "p0", "nombre": T("Planta baja", "Ground floor"), "muros": muros}],
    "estancias": [
        {"id": "salon", "nombre": T("Salón", "Living room"), "planta": "p0", "poligono": salon, "altura_techo": 2.85},
        {"id": "dormitorio", "nombre": T("Dormitorio", "Bedroom"), "planta": "p0", "poligono": dormitorio, "altura_techo": 2.9},
        {"id": "terraza", "nombre": T("Terraza", "Terrace"), "planta": "p0", "poligono": terraza, "exterior": True},
        {"id": "jardin", "nombre": T("Jardín", "Garden"), "planta": "p0", "poligono": jardin, "exterior": True},
    ],
    "secciones": [
        {"id": "exterior", "nombre": T("Exterior", "Outdoors"), "estancias": ["terraza", "jardin"]},
        {"id": "dia", "nombre": T("Zona de día", "Living area"), "estancias": ["salon"]},
        {"id": "noche", "nombre": T("Zona de noche", "Sleeping area"), "estancias": ["dormitorio"]},
    ],
    "audio": {"musica": {"archivo": "audio/musica.wav", "volumen": 0.35, "bucle": True, "autoplay": True,
                         "titulo": T("Ambiente (demo)", "Ambient (demo)"), "autor": "cre8eight", "licencia": "Generada por código"}},
    "guion": [
        {"nodo": "terraza", "rumbo": r2(YAW["terraza"] + 15), "segundos": 7, "texto": T("La fachada del jardín, la fuente y la terraza.", "The garden façade, the fountain and the terrace.")},
        {"nodo": "terraza", "rumbo": r2(YAW["terraza"] + 142), "segundos": 5, "texto": T("A la sombra de un roble centenario.", "In the shade of a century-old oak.")},
        {"nodo": "jardin", "rumbo": r2(YAW["jardin"] - 95), "segundos": 6, "texto": T("Césped y arbolado maduro rodean la casa.", "Lawns and mature trees surround the house.")},
        {"nodo": "salon", "rumbo": YAW["salon"] + 40, "segundos": 7, "texto": T("El salón principal se abre al jardín con tres puertas de cristal.", "The main living room opens to the garden through three glass doors.")},
        {"nodo": "salon", "rumbo": YAW["salon"] - 125, "segundos": 6, "texto": T("Tras el arco, la sala de estar con parquet, chimenea y piano.", "Beyond the arch, the sitting room with parquet, fireplace and piano.")},
        {"nodo": "dormitorio", "rumbo": YAW["dormitorio"] + 25, "segundos": 7, "texto": T("Dormitorio en suite con chimenea y vistas al jardín.", "En-suite bedroom with fireplace and garden views.")},
    ],
    "panoramas": panos,
}
(RAIZ / "sitio" / "tour.json").write_text(json.dumps(tour, ensure_ascii=False, indent=1), encoding="utf-8")

# comprobación: dirección (en la foto) de cada flecha
for p in panos:
    for d in p["enlaces"]:
        q = next(x for x in panos if x["id"] == d)
        lam = (rumbo((p["x"], p["z"]), (q["x"], q["z"])) - p["yaw"] + 540) % 360 - 180
        print(f"{p['id']:10s} → {d:10s} en la foto a {lam:7.1f}°  ({math.hypot(q['x'] - p['x'], q['z'] - p['z']):.1f} m)")
print("yaw:", {k: r2(v) for k, v in YAW.items()}, "· muros:", len(muros))
