#!/bin/sh
cd "$(dirname "$0")" || exit 1
python3 tools/generate_data.py && python3 tools/validate.py && python3 tools/build_docs.py
echo "Готово. Откройте index.html в браузере."
