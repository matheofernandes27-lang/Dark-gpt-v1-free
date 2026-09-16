import React, { useState, useEffect } from 'react';
import { 
  X, 
  Terminal, 
  Download, 
  Check, 
  Copy, 
  Play, 
  ShieldCheck, 
  ShieldAlert, 
  Cpu, 
  RefreshCw,
  Sparkles,
  ExternalLink,
  Laptop
} from 'lucide-react';

interface OllamaInstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export function OllamaInstallerModal({ isOpen, onClose, onConnected }: OllamaInstallerModalProps) {
  const [selectedOs, setSelectedOs] = useState<'macos' | 'linux' | 'windows'>('macos');
  const [isNonAdmin, setIsNonAdmin] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [starting, setStarting] = useState<boolean>(false);
  const [startFeedback, setStartFeedback] = useState<{ success?: boolean; message?: string } | null>(null);
  
  const [ollamaStatus, setOllamaStatus] = useState<{
    online: boolean;
    models?: any[];
    server_url?: string;
    binaryFound?: boolean;
    binaryPath?: string | null;
    error?: string;
  } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);

  const checkStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch('/api/ollama/status');
      const data = await res.json();
      setOllamaStatus(data);
      if (data.online && onConnected) {
        onConnected();
      }
    } catch (e: any) {
      setOllamaStatus({ online: false, error: e.message });
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Generate command based on OS & Admin choice
  const getCommand = () => {
    if (selectedOs === 'macos') {
      if (isNonAdmin) {
        return `mkdir -p ~/.local/bin && curl -L "https://ollama.com/download/Ollama-darwin.zip" -o /tmp/Ollama.zip && unzip -q /tmp/Ollama.zip -d /tmp/ && cp /tmp/Ollama.app/Contents/Resources/ollama ~/.local/bin/ && chmod +x ~/.local/bin/ollama && nohup ~/.local/bin/ollama serve >/dev/null 2>&1 & sleep 2 && ~/.local/bin/ollama pull dolphin3`;
      } else {
        return `curl -fsSL https://ollama.com/install.sh | sh && nohup ollama serve >/dev/null 2>&1 & sleep 2 && ollama pull dolphin3`;
      }
    } else if (selectedOs === 'windows') {
      if (isNonAdmin) {
        return `powershell -Command "Invoke-WebRequest -Uri 'https://ollama.com/download/OllamaSetup.exe' -OutFile '$env:TEMP\\OllamaSetup.exe'; Start-Process '$env:TEMP\\OllamaSetup.exe' -ArgumentList '/silent' -Wait; Start-Process 'ollama' -ArgumentList 'serve'; Start-Sleep -Seconds 3; ollama pull dolphin3"`;
      } else {
        return `winget install Ollama.Ollama && start /b ollama serve && timeout /t 3 && ollama pull dolphin3`;
      }
    } else {
      if (isNonAdmin) {
        return `mkdir -p ~/.local/bin && curl -L https://ollama.com/download/ollama-linux-amd64.tgz -o /tmp/ollama.tgz && tar -xzf /tmp/ollama.tgz -C ~/.local/bin && chmod +x ~/.local/bin/ollama && nohup ~/.local/bin/ollama serve >/dev/null 2>&1 & sleep 2 && ~/.local/bin/ollama pull dolphin3`;
      } else {
        return `curl -fsSL https://ollama.com/install.sh | sh && nohup ollama serve >/dev/null 2>&1 & sleep 2 && ollama pull dolphin3`;
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCommand());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    const isAdminParam = isNonAdmin ? 'false' : 'true';
    window.location.href = `/api/ollama/installer-script?os=${selectedOs}&isAdmin=${isAdminParam}`;
  };

  const handleLaunchBackground = async () => {
    try {
      setStarting(true);
      setStartFeedback(null);
      const res = await fetch('/api/ollama/start', { method: 'POST' });
      const data = await res.json();
      setStartFeedback(data);
      setTimeout(() => checkStatus(), 1500);
    } catch (e: any) {
      setStartFeedback({ success: false, message: e.message });
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in font-mono">
      <div className="w-full max-w-2xl bg-neutral-950 border-2 border-red-600 rounded-none shadow-[0_0_30px_rgba(220,38,38,0.25)] flex flex-col max-h-[90vh] overflow-hidden text-neutral-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-red-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-red-500 animate-pulse" />
            <span className="text-white font-bold text-sm tracking-wider">
              [ASSISTANT DOLPHIN 3 // EXPÉRIENCE LOCALE OPTIMALE]
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {/* Motivation / Explanation Banner */}
          <div className="p-3 bg-red-950/40 border border-red-800 rounded text-neutral-300 space-y-1.5">
            <div className="flex items-center gap-2 text-red-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Pourquoi Dolphin 3 & Ollama changent tout ?</span>
            </div>
            <p className="text-neutral-300 text-xs leading-relaxed">
              Pour profiter de DARK-GPT au sommet de ses capacités (réponses directes, sans refus préformatés, analyse approfondie de code et d’architectures offensives/défensives), 
              le modèle <strong className="text-white">Dolphin 3</strong> s&apos;exécute directement sur votre ordinateur en local.
            </p>
          </div>

          {/* Real-time Status Card */}
          <div className="p-3 bg-black border border-neutral-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full ${ollamaStatus?.online ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></span>
              <div>
                <div className="font-bold text-white text-xs">
                  STATUT OLLAMA : {ollamaStatus?.online ? 'EN LIGNE (CONNECTÉ)' : 'NON DÉTECTÉ / ARRÊTÉ'}
                </div>
                <div className="text-[11px] text-neutral-400">
                  {ollamaStatus?.online 
                    ? `Port 11434 actif | Modèles : ${ollamaStatus.models?.map(m => m.name).join(', ') || 'aucun'}`
                    : 'Le serveur Ollama ne répond pas encore sur http://127.0.0.1:11434'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={checkStatus}
                disabled={loadingStatus}
                className="px-2.5 py-1 text-xs border border-neutral-700 hover:border-neutral-500 bg-neutral-900 text-neutral-300 flex items-center gap-1.5 transition-colors"
                title="Actualiser le statut"
              >
                <RefreshCw className={`w-3 h-3 ${loadingStatus ? 'animate-spin' : ''}`} />
                <span>Tester</span>
              </button>

              <button
                type="button"
                onClick={handleLaunchBackground}
                disabled={starting}
                className="px-3 py-1 text-xs font-bold border border-red-600 bg-red-950 text-white hover:bg-red-900 flex items-center gap-1.5 transition-colors shadow-[0_0_8px_rgba(220,38,38,0.3)]"
              >
                <Play className="w-3 h-3 text-red-400" />
                <span>{starting ? 'Lancement...' : 'Lancer en arrière-plan'}</span>
              </button>
            </div>
          </div>

          {startFeedback && (
            <div className={`p-2.5 border text-xs ${startFeedback.success ? 'border-emerald-700 bg-emerald-950/40 text-emerald-300' : 'border-amber-700 bg-amber-950/40 text-amber-300'}`}>
              {startFeedback.message}
            </div>
          )}

          {/* Installer Configuration Section */}
          <div className="border border-neutral-800 bg-neutral-900/50 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                <Laptop className="w-4 h-4 text-red-500" />
                <span>INSTALLATION DE DOLPHIN 3 ADAPTÉE À VOTRE ENVIRONNEMENT</span>
              </div>
            </div>

            {/* 1. OS Selection */}
            <div className="space-y-1.5">
              <label className="text-neutral-400 text-xs font-bold block">1. SYSTÈME D&apos;EXPLOITATION :</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOs('macos')}
                  className={`py-2 px-3 border text-xs font-bold text-center transition-all ${
                    selectedOs === 'macos'
                      ? 'border-red-500 bg-red-950 text-white shadow-[0_0_10px_rgba(220,38,38,0.3)]'
                      : 'border-neutral-800 bg-black text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  🍎 macOS (Mac)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOs('linux')}
                  className={`py-2 px-3 border text-xs font-bold text-center transition-all ${
                    selectedOs === 'linux'
                      ? 'border-red-500 bg-red-950 text-white shadow-[0_0_10px_rgba(220,38,38,0.3)]'
                      : 'border-neutral-800 bg-black text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  🐧 Linux
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOs('windows')}
                  className={`py-2 px-3 border text-xs font-bold text-center transition-all ${
                    selectedOs === 'windows'
                      ? 'border-red-500 bg-red-950 text-white shadow-[0_0_10px_rgba(220,38,38,0.3)]'
                      : 'border-neutral-800 bg-black text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  🪟 Windows
                </button>
              </div>
            </div>

            {/* 2. Admin vs Non-Admin Checkbox */}
            <div className="p-3 bg-black border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-neutral-300 text-xs font-bold block">
                  2. PRIVILÈGES ADMINISTRATEUR SUR CE POSTE :
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <label className={`flex-1 flex items-start gap-2.5 p-2.5 border cursor-pointer transition-all ${
                  isNonAdmin 
                    ? 'border-red-600 bg-red-950/40 text-white' 
                    : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}>
                  <input
                    type="radio"
                    name="adminMode"
                    checked={isNonAdmin}
                    onChange={() => setIsNonAdmin(true)}
                    className="mt-0.5 accent-red-600"
                  />
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5 text-red-300">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Je ne suis PAS administrateur (SANS SUDO / SANS ROOT)</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      {selectedOs === 'macos' 
                        ? "Installation dans votre répertoire personnel (~/.local/bin) sans toucher au dossier /Applications et sans demander de mot de passe admin."
                        : "Installation en mode espace utilisateur dans votre profil personnel."}
                    </div>
                  </div>
                </label>

                <label className={`flex-1 flex items-start gap-2.5 p-2.5 border cursor-pointer transition-all ${
                  !isNonAdmin 
                    ? 'border-red-600 bg-red-950/40 text-white' 
                    : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}>
                  <input
                    type="radio"
                    name="adminMode"
                    checked={!isNonAdmin}
                    onChange={() => setIsNonAdmin(false)}
                    className="mt-0.5 accent-red-600"
                  />
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5 text-neutral-300">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Je suis administrateur</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      Installation système globale standard.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* 3. Execution Options: Download or Copy */}
            <div className="space-y-2 pt-1">
              <label className="text-neutral-400 text-xs font-bold block">
                3. COMMANDE OU SCRIPT EXÉCUTABLE EN 1 CLIC :
              </label>

              <div className="relative">
                <textarea
                  readOnly
                  rows={3}
                  value={getCommand()}
                  className="w-full bg-black border border-neutral-700 p-2.5 text-xs text-red-300 focus:outline-none select-all font-mono"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="absolute top-2 right-2 px-2.5 py-1 bg-neutral-900 border border-neutral-700 hover:border-red-500 text-neutral-300 hover:text-white text-xs flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="text-[11px] text-neutral-400">
                  {selectedOs === 'macos' && isNonAdmin && (
                    <span>💡 Le script téléchargeable <strong>.command</strong> se lance d&apos;un simple double-clic dans le Finder !</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleDownloadScript}
                  className="px-4 py-2 border border-red-600 bg-red-950 hover:bg-red-900 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-[0_0_12px_rgba(220,38,38,0.3)]"
                >
                  <Download className="w-4 h-4 text-red-400" />
                  <span>
                    Télécharger le lanceur {selectedOs === 'macos' ? '(.command double-cliquable)' : '(.sh / .bat)'}
                  </span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <div className="text-[11px] text-neutral-500">
            Dolphin 3 écoutera sur le port standard <code className="text-white">11434</code>.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white text-xs transition-colors"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => {
                checkStatus();
                onClose();
              }}
              className="px-4 py-1.5 border border-red-600 bg-red-950 text-white hover:bg-red-900 text-xs font-bold transition-colors shadow-[0_0_10px_rgba(220,38,38,0.3)]"
            >
              Terminé
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
