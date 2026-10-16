# Revelado HDR → JPG con aspecto de fotografía inmobiliaria:
#  1. balance de blancos: el techo (blanco) hacia un blanco cálido, con la fuerza indicada (luz mixta: nunca del todo), y
#     opcionalmente por zonas: donde la luz es de bombilla (dominante cálida a gran escala) se acerca a un blanco cálido;
#  2. tonemapping local: capa base (bilateral sobre log2 L, con continuidad entre el borde izquierdo y el derecho de la
#     equirectangular) comprimida y detalle intacto;
#  3. curva fílmica sobre la luminancia (sin virar los tonos) con desaturación suave de las altas luces y un enfoque suave.
#   revelar.py <hdr> <salida.jpg> [ancho] [--exp E] [--comp C] [--sat S] [--wb F] [--calido c] [--calido-local k]
#              [--enfoque e] [--calidad q]
import sys, cv2, numpy as np
args = sys.argv[1:]
def opt(n, d):
    if n in args: i = args.index(n); v = args[i + 1]; del args[i:i + 2]; return v
    return d
EXP, COMP, SAT = float(opt("--exp", "0")), float(opt("--comp", "0.55")), float(opt("--sat", "0.95"))
FWB, CALIDO = float(opt("--wb", "0.8")), float(opt("--calido", "0.06"))
ENF, CAL = float(opt("--enfoque", "0.35")), int(opt("--calidad", "86"))
LOCAL = float(opt("--calido-local", "0"))   # 0-1: cuánto se neutraliza la dominante cálida de las bombillas por zonas
ent, sal = args[0], args[1]; ancho = int(args[2]) if len(args) > 2 else 4096
hdr = cv2.imread(ent, cv2.IMREAD_ANYDEPTH | cv2.IMREAD_COLOR)[:, :, ::-1].astype(np.float32)
if hdr.shape[1] != ancho: hdr = cv2.resize(hdr, (ancho, ancho // 2), interpolation=cv2.INTER_AREA)
H, W = hdr.shape[:2]
lum = lambda x: 0.2126 * x[..., 0] + 0.7152 * x[..., 1] + 0.0722 * x[..., 2]
# 1. balance de blancos por el techo (filas del 8 % al 23 %, percentiles 20-80 de luminancia: sin lámparas ni sombras)
if FWB > 0:
    z = hdr[int(H * .08):int(H * .23)].reshape(-1, 3); l = lum(z)
    lo, hi = np.percentile(l, [20, 80]); m = z[(l > lo) & (l < hi)].mean(0); m = m / m[1]
    objetivo = np.array([1 + CALIDO * 0.6, 1, 1 - CALIDO * 1.4])
    hdr *= np.power(objetivo / m, FWB).astype(np.float32)
# 1b. luz mixta: donde la iluminación (color a gran escala) es cálida, se acerca a un blanco cálido; el césped, el cielo y
#     la luz de día no se tocan (su dominante no es cálida)
if LOCAL > 0:
    g = np.maximum(hdr, 1e-5)
    f8 = 8; peq3 = cv2.resize(g, (W // f8, H // f8), interpolation=cv2.INTER_AREA)
    m8 = peq3.shape[1] // 8
    ext3 = np.concatenate([peq3[:, -m8:], peq3, peq3[:, :m8]], axis=1)
    bl = cv2.GaussianBlur(np.log(ext3), (0, 0), sigmaX=peq3.shape[1] / 60)[:, m8:-m8]
    cr = bl[..., 0] - bl[..., 1]; cb = bl[..., 2] - bl[..., 1]
    w = np.clip((cr - 0.1) / 0.2, 0, 1); w = w * w * (3 - 2 * w)
    dr = -LOCAL * w * (cr - 0.08); db = -LOCAL * w * (cb + 0.2)
    corr = np.stack([np.exp(dr), np.ones_like(dr), np.exp(db)], -1).astype(np.float32)
    corr = cv2.resize(corr, (W, H), interpolation=cv2.INTER_CUBIC)
    hdr = hdr * corr
L = np.maximum(lum(hdr), 1e-6)
logL = np.log2(L)
# 2. capa base a 1/4 de resolución con margen circular de 1/8 del ancho
f = 4; peq = cv2.resize(logL, (W // f, H // f), interpolation=cv2.INTER_AREA)
m = peq.shape[1] // 8
ext = np.concatenate([peq[:, -m:], peq, peq[:, :m]], axis=1).astype(np.float32)
base = cv2.bilateralFilter(ext, d=0, sigmaColor=1.2, sigmaSpace=peq.shape[1] / 64)[:, m:-m]
base = cv2.resize(base, (W, H), interpolation=cv2.INTER_CUBIC)
detalle = logL - base
banda = base[H // 6: 5 * H // 6]
ref = np.percentile(banda, 55)
Lt = np.power(2.0, (base - ref) * (1 - COMP) + detalle * 1.08 + np.log2(0.24) + EXP)
# 3. curva fílmica (ACES ajustada) sobre la luminancia; el color sigue a la luminancia y se blanquea al saturar
aces = lambda x: np.clip((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)
Ld = aces(Lt * 1.25)
rgb = hdr * (Ld / L)[..., None]
l = lum(rgb)[..., None]
rgb = l + (rgb - l) * SAT
mx = rgb.max(-1, keepdims=True)
k = np.clip((mx - 1) / np.maximum(mx - l, 1e-6), 0, 1)      # lo justo para que ningún canal pase de 1
rgb = rgb + (l - rgb) * k
x = np.clip(rgb, 0, 1)
srgb = np.where(x <= 0.0031308, 12.92 * x, 1.055 * np.power(x, 1 / 2.4) - 0.055)
if ENF > 0:
    m = W // 64
    ext = np.concatenate([srgb[:, -m:], srgb, srgb[:, :m]], axis=1).astype(np.float32)
    borroso = cv2.GaussianBlur(ext, (0, 0), sigmaX=1.1 * W / 4096)[:, m:-m]
    srgb = srgb + ENF * (srgb - borroso)
out = (np.clip(srgb, 0, 1) * 255 + 0.5).astype(np.uint8)
cv2.imwrite(sal, out[:, :, ::-1], [cv2.IMWRITE_JPEG_QUALITY, CAL, cv2.IMWRITE_JPEG_PROGRESSIVE, 1])
print(sal, f"media sRGB={out.mean():.0f}")
