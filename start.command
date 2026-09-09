#!/bin/zsh

set -u
cd "$(dirname "$0")"

if [[ -x ".darkgpt_venv/bin/python" ]]; then
  exec ".darkgpt_venv/bin/python" darkgpt.py
fi

exec python3 darkgpt.py
