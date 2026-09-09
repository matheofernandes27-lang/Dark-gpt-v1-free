#!/bin/bash

echo "🚀 Démarrage de l'installation automatisée de Ollama Server..."

# 1. Installation de Ollama
echo "📦 Installation de Ollama..."
curl -fsSL https://ollama.com/install.sh | sh

# 2. Configuration de l'accès distant (0.0.0.0)
echo "⚙️ Configuration de l'accès réseau..."
sudo mkdir -p /etc/systemd/system/ollama.service.d
echo '[Service]
Environment="OLLAMA_HOST=0.0.0.0"
Environment="OLLAMA_ORIGINS=*"' | sudo tee /etc/systemd/system/ollama.service.d/override.conf

# 3. Redémarrage du service
echo "🔄 Redémarrage d'Ollama..."
sudo systemctl daemon-reload
sudo systemctl restart ollama

# 4. Ouverture du port dans le firewall (UFW)
if command -v ufw > /dev/null; then
    echo "🛡️ Ouverture du port 11434 dans le firewall..."
    sudo ufw allow 11434/tcp
fi

echo "✅ Installation terminée !"
echo "🌐 Ton serveur Ollama est maintenant accessible sur : http://$(curl -s ifconfig.me):11434"
echo "👉 Copie cette URL dans ton fichier config.json de Dark-GPT."
