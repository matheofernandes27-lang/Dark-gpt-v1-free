#!/bin/bash

# Nom de l'application
APP_NAME="Dark-gpt.app"
CONTENTS_DIR="$APP_NAME/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

echo "🛠️ Création de l'application $APP_NAME..."

# 1. Création de la structure des dossiers
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# 2. Création du lanceur (Launcher)
cat <<EOF > "$MACOS_DIR/launcher"
#!/bin/zsh
cd "\$(dirname "\$0")/../../"
if [[ -x ".darkgpt_venv/bin/python" ]]; then
  ".darkgpt_venv/bin/python" darkgpt.py
else
  python3 darkgpt.py
fi
EOF

# 3. Rendre le lanceur exécutable
chmod +x "$MACOS_DIR/launcher"

# 4. Copie des icônes si elles existent
if [ -f "dark-gpt-logo.jpeg" ]; then
    cp "dark-gpt-logo.jpeg" "$RESOURCES_DIR/AppIcon.png"
fi

echo "✅ Application $APP_NAME créée avec succès !"
echo "👉 Tu peux maintenant double-cliquer sur $APP_NAME pour lancer l'app."
