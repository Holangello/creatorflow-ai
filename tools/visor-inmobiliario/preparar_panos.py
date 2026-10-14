#!/usr/bin/env python3
"""Prepara las fotos 360 del DJI Osmo 360 para el visor web.

Entrada: carpeta con JPG equirectangulares 2:1 ya cosidos (exportados desde
DJI Mimo / DJI Studio). Salida:

  panos/<id>.jpg         8192 x 4096  (escritorio)
  panos/movil/<id>.jpg   4096 x 2048  (móvil / tablet: límite de textura GPU)
  panos/mini/<id>.jpg     512 x 256   (galería)
  tour.json              esqueleto con un nodo por foto (si no existe)

Al re-guardar se eliminan los metadatos EXIF (incluida la posición GPS).

Uso:
  pip install pillow
  python3 preparar_panos.py ~/Fotos/piso-calle-mayor --salida ./mi-piso
"""
import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Falta Pillow: pip install pillow")

Image.MAX_IMAGE_PIXELS = 300_000_000  # las fotos de 120 MP superan el límite por defecto

TAMANOS = {"": 8192, "movil": 4096, "mini": 512}


def slug(texto):
    t = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-") or "pano"


def procesar(origen, destino, calidad):
    destino.mkdir(parents=True, exist_ok=True)
    fotos = sorted(p for p in origen.iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".tif", ".tiff"))
    if not fotos:
        sys.exit(f"No hay imágenes en {origen}")
    nodos = []
    for i, foto in enumerate(fotos):
        ident = slug(foto.stem)
        with Image.open(foto) as img:
            img = ImageOps.exif_transpose(img).convert("RGB")
            ancho, alto = img.size
            if abs(ancho / alto - 2) > 0.02:
                print(f"  ! {foto.name}: {ancho}x{alto} no es 2:1, ¿es una foto equirectangular?")
            for carpeta, w in TAMANOS.items():
                w = min(w, ancho)
                salida = destino / "panos" / carpeta / f"{ident}.jpg"
                salida.parent.mkdir(parents=True, exist_ok=True)
                img.resize((w, w // 2), Image.LANCZOS).save(salida, "JPEG", quality=calidad, optimize=True, progressive=True)
        print(f"  ✓ {foto.name} → {ident}")
        nodos.append({
            "id": ident,
            "nombre": foto.stem.replace("_", " ").replace("-", " ").strip().capitalize(),
            "imagen": f"panos/{ident}.jpg",
            "imagen_movil": f"panos/movil/{ident}.jpg",
            "miniatura": f"panos/mini/{ident}.jpg",
            # Posición en metros sobre el plano: corrígela midiendo en el plano real.
            "x": round((i % 4) * 3.0, 2),
            "z": round((i // 4) * 3.0, 2),
            "yaw": 0,
        })
    tour = destino / "tour.json"
    if tour.exists():
        print(f"\n{tour} ya existe; no se sobrescribe. Nodos generados:\n")
        print(json.dumps(nodos, ensure_ascii=False, indent=2))
    else:
        tour.write_text(json.dumps({
            "titulo": "Nombre del inmueble",
            "altura_camara": 1.5,
            "radio_enlace_auto": 4.5,
            "inicio": nodos[0]["id"],
            "panoramas": nodos,
        }, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\nCreado {tour}. Ajusta x/z de cada estancia y abre el visor con ?editar para calibrar el yaw.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("origen", type=Path, help="carpeta con las fotos 360 equirectangulares")
    ap.add_argument("--salida", type=Path, default=Path("."), help="carpeta del tour (por defecto, la actual)")
    ap.add_argument("--calidad", type=int, default=85, help="calidad JPEG (por defecto 85)")
    a = ap.parse_args()
    procesar(a.origen, a.salida, a.calidad)
