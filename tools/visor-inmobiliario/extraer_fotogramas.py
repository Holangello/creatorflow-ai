#!/usr/bin/env python3
"""Convierte un vídeo 360 del Osmo 360 en fotos "planas" para Gaussian Splatting.

Postshot, Brush, COLMAP o RealityScan esperan fotos de cámara normal, no
equirectangulares. Este script extrae fotogramas del vídeo 360 (exportado
como equirectangular desde DJI Studio / DJI Mimo) y, de cada uno, genera
varias vistas en perspectiva con el filtro v360 de ffmpeg:

  12 vistas por fotograma: 8 horizontales (cada 45°), 2 hacia el suelo y 2 hacia el techo
  → con 2 fotogramas por segundo y un recorrido de 3 min salen ~4300 fotos.
  Si sales en las vistas hacia el suelo, borra los archivos v08_* y v09_*.

Uso:
  python3 extraer_fotogramas.py recorrido.mp4 --salida fotogramas --fps 2

Requisitos: ffmpeg en el PATH.
"""
import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

VISTAS = [(yaw, 0) for yaw in range(-180, 180, 45)] + [(0, -50), (180, -50), (90, 45), (-90, 45)]


def ejecutar(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"Error ejecutando ffmpeg:\n{r.stderr[-2000:]}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", type=Path)
    ap.add_argument("--salida", type=Path, default=Path("fotogramas"))
    ap.add_argument("--fps", type=float, default=2.0, help="fotogramas por segundo a extraer (por defecto 2)")
    ap.add_argument("--lado", type=int, default=1600, help="tamaño de cada vista cuadrada en px")
    ap.add_argument("--fov", type=int, default=90, help="campo de visión de cada vista en grados")
    a = ap.parse_args()
    if not shutil.which("ffmpeg"):
        sys.exit("No se encontró ffmpeg. Instálalo: https://ffmpeg.org/download.html")
    a.salida.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        print("1/2 Extrayendo fotogramas equirectangulares…")
        ejecutar(["ffmpeg", "-loglevel", "error", "-i", str(a.video), "-vf", f"fps={a.fps}",
                  "-qscale:v", "2", f"{tmp}/f_%05d.jpg"])
        frames = sorted(Path(tmp).glob("f_*.jpg"))
        print(f"   {len(frames)} fotogramas")
        print("2/2 Generando vistas en perspectiva…")
        for n, (yaw, pitch) in enumerate(VISTAS):
            filtro = (f"v360=input=e:output=flat:yaw={yaw}:pitch={pitch}:"
                      f"h_fov={a.fov}:v_fov={a.fov}:w={a.lado}:h={a.lado}")
            ejecutar(["ffmpeg", "-loglevel", "error", "-i", f"{tmp}/f_%05d.jpg", "-vf", filtro,
                      "-qscale:v", "2", str(a.salida / f"v{n:02d}_%05d.jpg")])
            print(f"   vista {n + 1}/{len(VISTAS)} (yaw {yaw}°, pitch {pitch}°)")
    print(f"Listo: {a.salida}. Arrástrala a Postshot / RealityScan o pásala a COLMAP + Brush.")


if __name__ == "__main__":
    main()
