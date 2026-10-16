# Máscara de ventanas (canal B de `mascara`, PNG equirectangular 4096×2048) dibujada a partir de la geometría medida:
# rectángulos en las paredes (marco de la estancia: a a la derecha, b adelante; alturas sobre el suelo) y cajas en la
# equirectangular (longitud y latitud en grados, para ventanas lejanas vistas desde fuera).
#   mascara.py <spec.json> <salida.png> [--vista vista.jpg]
import sys, json, math, numpy as np, cv2
a = sys.argv[1:]
vista = None
if "--vista" in a: i = a.index("--vista"); vista = a[i + 1]; del a[i:i + 2]
s = json.load(open(a[0])); W, H = 4096, 2048
g = math.radians(s.get("giro", 0)); h = s.get("h", 1.5)
lon = (np.arange(W) + 0.5) / W * 2 * np.pi - np.pi
lat = np.pi / 2 - (np.arange(H) + 0.5) / H * np.pi
LON, LAT = np.meshgrid(lon, lat)
D = np.stack([np.sin(LON) * np.cos(LAT), np.sin(LAT), np.cos(LON) * np.cos(LAT)], -1)  # x derecha, y arriba, f adelante
cam = lambda A, B: (A * math.cos(g) + B * math.sin(g), -A * math.sin(g) + B * math.cos(g))
m = np.zeros((H, W), np.float32)
# luz de cada píxel: del HDR (interiores: el cristal deja ver lo de fuera, mucho más claro que los muebles de delante) o de
# la foto revelada (exteriores: el cristal de una casa se ve oscuro frente a los marcos blancos)
Lh = None
if s.get("hdr"):
    hd = cv2.imread(s["hdr"], cv2.IMREAD_ANYDEPTH | cv2.IMREAD_COLOR)[:, :, ::-1].astype(np.float32)
    hd = cv2.resize(hd, (W, H), interpolation=cv2.INTER_AREA)
    Lh = 0.2126 * hd[..., 0] + 0.7152 * hd[..., 1] + 0.0722 * hd[..., 2]
Lf = cv2.cvtColor(cv2.resize(cv2.imread(s["img"]), (W, H)), cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
def acotar(zona, q):
    if "claro" in q and Lh is not None:   # solo lo que es más claro que k veces la mediana de la estancia (lo de fuera)
        return zona & (Lh > q["claro"] * np.median(Lh[H // 4: 3 * H // 4]))
    if "oscuro" in q:                     # solo lo más oscuro que el umbral (cristal, no marcos)
        return zona & (Lf < q["oscuro"])
    return zona
for q in s.get("quads", []):
    (a0, b0), (a1, b1) = q["pared"]; y0, y1 = q["y"]
    x0, f0 = cam(a0, b0); x1, f1 = cam(a1, b1)
    O = np.array([x0, y0 - h, f0]); e1 = np.array([x1 - x0, 0, f1 - f0]); e2 = np.array([0, y1 - y0, 0])
    n = np.cross(e1, e2); den = D @ n
    with np.errstate(divide="ignore", invalid="ignore"):
        t = (O @ n) / den
    P = D * t[..., None] - O
    u = (P @ e1) / (e1 @ e1); v = (P @ e2) / (e2 @ e2)
    m[acotar((t > 0) & (u >= 0) & (u <= 1) & (v >= 0) & (v <= 1), q)] = 1
for q in s.get("cajas", []):
    (l0, l1, t0, t1) = q["caja"]
    L, T = np.degrees(LON), np.degrees(LAT)
    m[acotar((L >= l0) & (L <= l1) & (T >= t0) & (T <= t1), q)] = 1
for q in s.get("quitar", []):            # cajas que no son ventana (un objeto delante)
    (l0, l1, t0, t1) = q
    L, T = np.degrees(LON), np.degrees(LAT)
    m[(L >= l0) & (L <= l1) & (T >= t0) & (T <= t1)] = 0
m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
m = cv2.GaussianBlur(m, (0, 0), 1.5)
out = np.zeros((H, W, 3), np.uint8); out[..., 0] = np.clip(m * 255, 0, 255).astype(np.uint8)
cv2.imwrite(a[1], out, [cv2.IMWRITE_PNG_COMPRESSION, 9])
print(a[1], "ventana:", round(float((m > 0.5).mean()), 4))
if vista:
    f = cv2.resize(cv2.imread(s["img"]), (2048, 1024)); mm = cv2.resize(m, (2048, 1024))[..., None]
    cv2.imwrite(vista, (f * (1 - 0.55 * mm) + np.array([255, 60, 0]) * 0.55 * mm).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 85])
