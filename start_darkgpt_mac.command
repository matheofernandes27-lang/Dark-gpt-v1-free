#!/bin/bash
# ==============================================================================
# DARK-GPT // LANCEUR UNIVERSEL MACOS SANS DROITS ADMINISTRATEUR
# Créé par M4TH4CK3R
# Double-cliquez sur ce fichier pour tout lancer automatiquement
# ==============================================================================

cd "$(dirname "$0")"

echo "============================================================"
echo " [x_x] DARK-GPT // DÉMARRAGE AUTOMATIQUE OLLAMA & DOLPHIN 3 "
echo "============================================================"

USER_BIN="$HOME/.local/bin"
mkdir -p "$USER_BIN"
export PATH="$USER_BIN:$PATH"

# 1. Vérification d'Ollama
OLLAMA_CMD=""
if command -v ollama &> /dev/null; then
  OLLAMA_CMD="ollama"
elif [ -f "$USER_BIN/ollama" ]; then
  OLLAMA_CMD="$USER_BIN/ollama"
elif [ -f "$HOME/bin/ollama" ]; then
  OLLAMA_CMD="$HOME/bin/ollama"
elif [ -f "$HOME/Downloads/Ollama.app/Contents/Resources/ollama" ]; then
  OLLAMA_CMD="$HOME/Downloads/Ollama.app/Contents/Resources/ollama"
fi

if [ -z "$OLLAMA_CMD" ]; then
  echo "[!] Ollama n'a pas été détecté sur votre Mac."
  echo "[+] Téléchargement et installation automatique en mode utilisateur (SANS ADMIN)..."
  TMP_DIR=$(mktemp -d)
  curl -L "https://ollama.com/download/Ollama-darwin.zip" -o "$TMP_DIR/Ollama.zip"
  unzip -q "$TMP_DIR/Ollama.zip" -d "$TMP_DIR"
  if [ -f "$TMP_DIR/Ollama.app/Contents/Resources/ollama" ]; then
    cp "$TMP_DIR/Ollama.app/Contents/Resources/ollama" "$USER_BIN/ollama"
  else
    cp "$TMP_DIR/ollama" "$USER_BIN/ollama" 2>/dev/null || true
  fi
  chmod +x "$USER_BIN/ollama"
  rm -rf "$TMP_DIR"
  OLLAMA_CMD="$USER_BIN/ollama"
  echo "[✓] Ollama installé dans $USER_BIN/ollama sans mot de passe admin !"
fi

# 2. Démarrage du serveur Ollama en arrière-plan
echo "[+] Vérification du serveur Ollama..."
if ! curl -s http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
  echo "[+] Lancement d'Ollama en arrière-plan..."
  nohup "$OLLAMA_CMD" serve > "$HOME/.ollama_darkgpt.log" 2>&1 &
  sleep 3
fi

# 3. Vérification du modèle Dolphin 3
echo "[+] Vérification du modèle Dolphin 3..."
if ! curl -s http://127.0.0.1:11434/api/tags | grep -q "dolphin3"; then
  echo "[+] Téléchargement de Dolphin 3 via Ollama (première fois uniquement)..."
  "$OLLAMA_CMD" pull dolphin3
else
  echo "[✓] Modèle Dolphin 3 déjà prêt !"
fi

# 4. Lancement de Dark-GPT
echo "[+] Lancement de l'application Dark-GPT..."
which npm > /dev/null 2>&1 && npm run dev &
sleep 2

# 5. Ouverture du navigateur
if which open > /dev/null 2>&1; then
  open http://localhost:3000
fi

echo "============================================================"
echo "[✓] DARK-GPT et Dolphin 3 sont opérationnels !"
echo "============================================================"
wait
