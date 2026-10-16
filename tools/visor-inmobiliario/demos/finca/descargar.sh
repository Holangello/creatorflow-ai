#!/bin/bash
# Fotos 360 HDR (4096×2048, CC0) de Poly Haven desde el espejo público de Kubric (Google Cloud Storage): cada una en su
# carpeta, descomprimida sin rutas peligrosas (filtro «data»).
#   ./descargar.sh lythwood_lounge lythwood_room lythwood_terrace lythwood_field
cd "$(dirname "$0")"
for id in "$@"; do
  d="descargas/$id"; mkdir -p "$d"
  [ -s "$d/x/environment_4k.hdr" ] && continue
  for i in 1 2 3 4; do
    curl -sS -f -m 600 -o "$d/archivo.tar.gz" "https://storage.googleapis.com/kubric-public/assets/HDRI_haven/$id.tar.gz" && break
    sleep $((2 ** i))
  done
  python3 -I -c "import tarfile, sys; tarfile.open(sys.argv[1]).extractall(sys.argv[2], filter='data')" "$d/archivo.tar.gz" "$d/x"
done
