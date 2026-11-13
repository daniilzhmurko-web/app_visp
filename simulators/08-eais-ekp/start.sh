#!/bin/sh
cd "$(dirname "$0")" && python3 server.py "${1:-8080}"
