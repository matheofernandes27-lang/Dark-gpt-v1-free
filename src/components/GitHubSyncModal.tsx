import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Terminal, 
  Copy, 
  Check, 
  X, 
  ExternalLink, 
  Download, 
  Globe, 
  Laptop, 
  Layers, 
  Server,
  ShieldCheck,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode: 'defense' | 'hacker';
  initialPlatform?: 'auto_save' | 'github' | 'web' | 'mac' | 'windows' | 'linux';
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen,
  onClose,
  activeMode,
  initialPlatform = 'auto_save'
}) => {
  const isGreen = activeMode === 'defense';
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<'auto_save' | 'github' | 'web' | 'mac' | 'windows' | 'linux'>(initialPlatform);
  const [commits, setCommits] = useState<Array<{ id: string; hash: string; message: string; timestamp: string; branch: string; filesCount: number }>>([]);
  const [isLoadingCommits, setIsLoadingCommits] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (initialPlatform) setActivePlatform(initialPlatform);
      fetchCommits();
    }
  }, [isOpen, initialPlatform]);

  const fetchCommits = async () => {
    setIsLoadingCommits(true);
    try {
      const res = await fetch('/api/git/commits');
      if (res.ok) {
        const data = await res.json();
        setCommits(data);
      }
    } catch {
      // Smooth fallback
    } finally {
      setIsLoadingCommits(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const gitHubCommands = `# 1. Initialiser le dépôt local
git init
git add .
git commit -m "feat: initial release of dark-gpt with dark-gpt cowork plugin & multi-platform support"

# 2. Lier à votre dépôt GitHub Open-Source
git branch -M main
git remote add origin https://github.com/VOTRE_PSEUDO/dark-gpt.git

# 3. Synchroniser et pousser en Open-Source
git push -u origin main

# 4. Créer une release officielle v1.1.0
git tag -a v1.1.0 -m "DARK-GPT v1.1.0 - Cowork & Multiplatform Release"
git push origin --tags`;

  const webCommands = `# --- DÉPLOIEMENT WEB (NODE.JS / VITE / DOCKER) ---
# Cloner le dépôt
git clone https://github.com/InfoSecREDD/DarkGPT-Lite.git
cd DarkGPT-Lite

# Installer les dépendances
npm install

# Compiler le frontend & le backend
npm run build

# Démarrer le serveur de production (Port 3000)
npm run start

# --- OPTION DOCKER CLOUD RUN ---
docker build -t dark-gpt:latest .
docker run -p 3000:3000 -e PORT=3000 dark-gpt:latest`;

  const macCommands = `# --- INSTALLATION 100% LOCALE MACOS ---
# 1. Cloner et ouvrir le dossier
git clone https://github.com/InfoSecREDD/DarkGPT-Lite.git
cd DarkGPT-Lite

# 2. Installer Node.js et Ollama avec Homebrew (si non présents)
brew install node ollama

# 3. Télécharger le modèle débridé Dolphin 3
ollama serve &
ollama pull dolphin3

# 4. Lancer dark-gpt avec le script natif macOS
chmod +x start_darkgpt_mac.command
./start_darkgpt_mac.command`;

  const windowsCommands = `# --- INSTALLATION WINDOWS (POWERSHELL / WSL2) ---
# 1. Ouvrir PowerShell en Administrateur ou WSL2 Ubuntu
git clone https://github.com/InfoSecREDD/DarkGPT-Lite.git
cd DarkGPT-Lite

# 2. Installer Ollama pour Windows
winget install Ollama.Ollama
ollama pull dolphin3

# 3. Installer les dépendances et lancer
npm install
npm run dev

# 4. Ouvrir dans le navigateur : http://localhost:3000`;

  const linuxCommands = `# --- INSTALLATION LINUX (DEBIAN / UBUNTU / ARCH) ---
# 1. Dépendances système
sudo apt update && sudo apt install -y git nodejs npm curl

# 2. Installer Ollama Linux
curl -fsSL https://ollama.com/install.sh | sh
ollama pull dolphin3

# 3. Installer et lancer dark-gpt
git clone https://github.com/InfoSecREDD/DarkGPT-Lite.git
cd DarkGPT-Lite
npm install
npm run dev`;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-3xl bg-neutral-950 border-2 rounded-lg font-mono flex flex-col max-h-[90vh] shadow-2xl ${
        isGreen ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-red-600 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
      }`}>
        {/* Header */}
        <div className={`px-4 py-3 flex items-center justify-between border-b ${
          isGreen ? 'bg-emerald-950/40 border-emerald-600' : 'bg-red-950/40 border-red-600'
        }`}>
          <div className="flex items-center gap-2">
            <GitBranch className={`w-5 h-5 ${isGreen ? 'text-emerald-400' : 'text-red-500'}`} />
            <div>
              <div className={`font-black text-sm tracking-wider ${isGreen ? 'text-emerald-400' : 'text-red-500'}`}>
                DARK-GPT // SYNCHRONISATION GITHUB & INSTALLATION MULTI-PLATEFORME
              </div>
              <div className="text-[11px] text-neutral-400">
                Open-Source • Web • macOS • Windows • Linux
              </div>
            </div>
          </div>

          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex border-b border-neutral-800 bg-black text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActivePlatform('auto_save')}
            className={`px-4 py-2.5 flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
              activePlatform === 'auto_save'
                ? isGreen ? 'border-emerald-500 text-emerald-400 bg-neutral-900/60' : 'border-red-500 text-red-400 bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Règle d'or : Sauvegarde Auto ({commits.length})</span>
          </button>
          <button
            onClick={() => setActivePlatform('github')}
            className={`px-4 py-2.5 flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
              activePlatform === 'github'
                ? isGreen ? 'border-emerald-500 text-emerald-400 bg-neutral-900/60' : 'border-red-500 text-red-400 bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>GitHub Sync</span>
          </button>
          <button
            onClick={() => setActivePlatform('web')}
            className={`px-4 py-2.5 flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
              activePlatform === 'web'
                ? isGreen ? 'border-emerald-500 text-emerald-400 bg-neutral-900/60' : 'border-red-500 text-red-400 bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Web (Node/Docker)</span>
          </button>
          <button
            onClick={() => setActivePlatform('mac')}
            className={`px-4 py-2.5 flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
              activePlatform === 'mac'
                ? isGreen ? 'border-emerald-500 text-emerald-400 bg-neutral-900/60' : 'border-red-500 text-red-400 bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>macOS</span>
          </button>
          <button
            onClick={() => setActivePlatform('windows')}
            className={`px-4 py-2.5 flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
              activePlatform === 'windows'
                ? isGreen ? 'border-emerald-500 text-emerald-400 bg-neutral-900/60' : 'border-red-500 text-red-400 bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Windows (PowerShell)</span>
          </button>
          <button
            onClick={() => setActivePlatform('linux')}
            className={`px-4 py-2.5 flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
              activePlatform === 'linux'
                ? isGreen ? 'border-emerald-500 text-emerald-400 bg-neutral-900/60' : 'border-red-500 text-red-400 bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Linux</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
          {activePlatform === 'auto_save' && (
            <div className="space-y-4">
              <div className={`p-3 rounded border flex items-start justify-between ${
                isGreen ? 'border-emerald-700 bg-emerald-950/40 text-emerald-300' : 'border-red-700 bg-red-950/40 text-red-300'
              }`}>
                <div>
                  <div className="font-bold flex items-center gap-1.5 text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>RÈGLE D'OR ACTIVE : Sauvegarde & Push Automatique GitHub</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    À la fin de chaque tâche réussie, génération de code ou modification de fichier, dark-gpt cowork exécute immédiatement un commit et synchronise le dépôt.
                  </p>
                </div>
                <button
                  onClick={fetchCommits}
                  className="px-2.5 py-1 text-[11px] font-bold rounded border border-neutral-700 hover:border-neutral-500 bg-neutral-900 text-neutral-300 flex items-center gap-1 shrink-0"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingCommits ? 'animate-spin' : ''}`} />
                  <span>Actualiser</span>
                </button>
              </div>

              {/* Commits List */}
              <div className="space-y-2">
                <div className="font-bold text-neutral-300 flex items-center justify-between">
                  <span>Historique des Commits Automatiques ({commits.length})</span>
                  <span className="text-[10px] text-neutral-500">Branche active : main</span>
                </div>

                {commits.length === 0 ? (
                  <div className="p-6 border border-dashed border-neutral-800 rounded text-center text-neutral-500">
                    Aucun commit automatique pour l'instant. Exécutez une action dans dark-gpt cowork pour déclencher la sauvegarde automatique.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {commits.map(c => (
                      <div key={c.id} className="p-2.5 bg-black border border-neutral-800 rounded hover:border-neutral-700 flex items-center justify-between">
                        <div className="space-y-0.5 flex-1 mr-2 truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-emerald-400 font-bold">
                              {c.hash}
                            </span>
                            <span className="text-white font-medium text-xs truncate">{c.message}</span>
                          </div>
                          <div className="text-[10px] text-neutral-500 flex items-center gap-2">
                            <span>{new Date(c.timestamp).toLocaleTimeString()}</span>
                            <span>•</span>
                            <span>{c.filesCount} fichier(s) mis à jour</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">✓ Pushed to origin/main</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fast Git Push Command */}
              <div className="space-y-2">
                <div className="font-bold text-neutral-300">
                  <span>Commande manuelle de Push instantané vers votre GitHub :</span>
                </div>
                <div className="relative">
                  <pre className="bg-black border border-neutral-800 rounded p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                    git add . && git commit -m "feat(cowork): Auto-save updated application files" && git push origin main
                  </pre>
                  <button
                    onClick={() => handleCopy('git add . && git commit -m "feat(cowork): Auto-save updated application files" && git push origin main', 'quick_push')}
                    className={`absolute top-2 right-2 px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 border transition-all ${
                      copiedKey === 'quick_push'
                        ? 'bg-emerald-600 text-black border-emerald-400'
                        : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
                    }`}
                  >
                    {copiedKey === 'quick_push' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'quick_push' ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activePlatform === 'github' && (
            <div className="space-y-3">
              <div className="text-neutral-300">
                <span className="font-bold text-white">Synchronisation Open-Source sur GitHub :</span>
                <p className="text-neutral-400 mt-1">
                  Exécutez ces commandes dans la racine de votre projet pour publier votre version de dark-gpt avec le plugin Cowork sur GitHub sous licence open-source MIT.
                </p>
              </div>

              <div className="relative">
                <pre className="bg-black border border-neutral-800 rounded p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                  {gitHubCommands}
                </pre>
                <button
                  onClick={() => handleCopy(gitHubCommands, 'github')}
                  className={`absolute top-2 right-2 px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 border transition-all ${
                    copiedKey === 'github'
                      ? 'bg-emerald-600 text-black border-emerald-400'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
                  }`}
                >
                  {copiedKey === 'github' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'github' ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
            </div>
          )}

          {activePlatform === 'web' && (
            <div className="space-y-3">
              <div className="text-neutral-300">
                <span className="font-bold text-white">Déploiement Web autonome :</span>
                <p className="text-neutral-400 mt-1">
                  Déployez l'application sur n'importe quel hébergeur Node.js (Cloud Run, Render, VPS ou conteneur Docker).
                </p>
              </div>

              <div className="relative">
                <pre className="bg-black border border-neutral-800 rounded p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                  {webCommands}
                </pre>
                <button
                  onClick={() => handleCopy(webCommands, 'web')}
                  className={`absolute top-2 right-2 px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 border transition-all ${
                    copiedKey === 'web'
                      ? 'bg-emerald-600 text-black border-emerald-400'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
                  }`}
                >
                  {copiedKey === 'web' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'web' ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
            </div>
          )}

          {activePlatform === 'mac' && (
            <div className="space-y-3">
              <div className="text-neutral-300">
                <span className="font-bold text-white">Installation macOS avec Ollama Dolphin 3 :</span>
                <p className="text-neutral-400 mt-1">
                  Configuration complète pour faire tourner dark-gpt et le modèle débridé Dolphin 3 à 100% hors-ligne sur votre Mac avec accélération Metal.
                </p>
              </div>

              <div className="relative">
                <pre className="bg-black border border-neutral-800 rounded p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                  {macCommands}
                </pre>
                <button
                  onClick={() => handleCopy(macCommands, 'mac')}
                  className={`absolute top-2 right-2 px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 border transition-all ${
                    copiedKey === 'mac'
                      ? 'bg-emerald-600 text-black border-emerald-400'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
                  }`}
                >
                  {copiedKey === 'mac' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'mac' ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
            </div>
          )}

          {activePlatform === 'windows' && (
            <div className="space-y-3">
              <div className="text-neutral-300">
                <span className="font-bold text-white">Installation Windows (PowerShell / WSL2) :</span>
                <p className="text-neutral-400 mt-1">
                  Déploiement simple sur Windows avec winget pour Ollama et Node.js.
                </p>
              </div>

              <div className="relative">
                <pre className="bg-black border border-neutral-800 rounded p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                  {windowsCommands}
                </pre>
                <button
                  onClick={() => handleCopy(windowsCommands, 'windows')}
                  className={`absolute top-2 right-2 px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 border transition-all ${
                    copiedKey === 'windows'
                      ? 'bg-emerald-600 text-black border-emerald-400'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
                  }`}
                >
                  {copiedKey === 'windows' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'windows' ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
            </div>
          )}

          {activePlatform === 'linux' && (
            <div className="space-y-3">
              <div className="text-neutral-300">
                <span className="font-bold text-white">Installation Linux (Serveur / Bureau) :</span>
                <p className="text-neutral-400 mt-1">
                  Exécution avec Ollama natif sur GPU ou CPU sous Ubuntu, Debian ou Arch.
                </p>
              </div>

              <div className="relative">
                <pre className="bg-black border border-neutral-800 rounded p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                  {linuxCommands}
                </pre>
                <button
                  onClick={() => handleCopy(linuxCommands, 'linux')}
                  className={`absolute top-2 right-2 px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 border transition-all ${
                    copiedKey === 'linux'
                      ? 'bg-emerald-600 text-black border-emerald-400'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
                  }`}
                >
                  {copiedKey === 'linux' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'linux' ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 flex items-center justify-between text-xs bg-black/90">
          <div className="text-neutral-500">
            Open-source sous licence MIT • dark-gpt v1.1.0
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded font-bold transition-all ${
              isGreen 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-black' 
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
