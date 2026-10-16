#!/bin/bash
# La demo «finca» de principio a fin: descarga, revelado, máscaras de ventanas, tour, música y la página para publicar
# (sitio/pagina.html junto a sitio/panos y sitio/audio). Necesita Python 3 con OpenCV (venv) y el visor compilado (npm run build).
set -e
cd "$(dirname "$0")"
./descargar.sh lythwood_lounge lythwood_room lythwood_terrace lythwood_field
[ -x venv/bin/python ] || { python3 -m venv --system-site-packages venv && venv/bin/pip install -q opencv-python-headless; }
PY="venv/bin/python -I"
mkdir -p sitio/panos/mini sitio/panos/mascaras sitio/audio
H=descargas/%s/x/environment_4k.hdr
$PY revelar.py "$(printf $H lythwood_lounge)" sitio/panos/salon.jpg 4096 --calido-local 0.45
$PY revelar.py "$(printf $H lythwood_room)" sitio/panos/dormitorio.jpg 4096 --calido-local 0.3
$PY revelar.py "$(printf $H lythwood_terrace)" sitio/panos/terraza.jpg 4096 --wb 0 --comp 0.45 --sat 1.0
$PY revelar.py "$(printf $H lythwood_field)" sitio/panos/jardin.jpg 4096 --wb 0 --comp 0.45 --sat 1.0
for n in salon dormitorio terraza jardin; do
  convert sitio/panos/$n.jpg -resize 512x256 -quality 82 sitio/panos/mini/$n.jpg
  $PY mascara.py ventanas/$n.json sitio/panos/mascaras/$n.png
done
python3 -I tour.py
(cd ../.. && node demos/finca/musica.mjs demos/finca/sitio/audio/musica.wav && node demos/finca/exportar.mjs demos/finca/sitio/autonomo.html)
python3 -I pagina.py sitio/autonomo.html sitio/pagina.html "Recorrido demo cre8eight"
