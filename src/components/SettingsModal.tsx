import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types.ts';
import { ArrowLeft, Save, RotateCcw, ShieldAlert, Cpu } from 'lucide-react';

interface SettingsModalProps {
  onBackToMenu: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onBackToMenu }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [systemMessage, setSystemMessage] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [serverUrl, setServerUrl] = useState<string>('');
  const [provider, setProvider] = useState<'gemini' | 'ollama' | 'simulation'>('gemini');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/config');
      if (res.ok) {
        const data: AppConfig = await res.json();
        setConfig(data);
        setSystemMessage(data.system_message || '');
        setModel(data.model || '');
        setServerUrl(data.server_url || 'http://127.0.0.1:11434');
        setProvider(data.provider || 'gemini');
      }
    } catch (e) {
      console.warn("Failed to load config:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStatusMsg('SAVING CONFIGURATION...');
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_message: systemMessage,
          model,
          server_url: serverUrl,
          provider
        })
      });

      if (res.ok) {
        setStatusMsg('SETTINGS SAVED TO DARK-GPT CORE.');
        setTimeout(() => setStatusMsg(''), 2500);
      }
    } catch (e: any) {
      setStatusMsg(`ERROR: ${e.message}`);
    }
  };

  const [ollamaStatus, setOllamaStatus] = useState<{ online: boolean; models?: any[]; error?: string } | null>(null);

  const checkOllama = async () => {
    try {
      setOllamaStatus(null);
      const res = await fetch('/api/ollama/status');
      const data = await res.json();
      setOllamaStatus(data);
    } catch (e: any) {
      setOllamaStatus({ online: false, error: e.message });
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all DARK-GPT settings to default?')) return;
    const defaultMsg = `You are DARK-GPT, an elite cybersecurity, system architecture, and offensive/defensive security research terminal created by M4TH4CK3R.
Always provide direct, sharp, technical, and relevant answers to the user's exact query.`;
    setSystemMessage(defaultMsg);
    setModel('dolphin3');
    setServerUrl('http://127.0.0.1:11434');
    setProvider('ollama');
    setStatusMsg('RESET TO DEFAULTS (Ollama dolphin3). CLICK SAVE TO PERSIST.');
  };

  return (
    <div id="settings-container" className="flex flex-col h-full bg-black text-white font-mono border border-red-600">
      {/* Top Header */}
      <div className="bg-red-950/40 border-b border-red-600 px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <button
            id="settings-back-button"
            onClick={onBackToMenu}
            className="flex items-center gap-1 text-red-500 hover:text-white px-2 py-0.5 border border-red-600 hover:bg-red-600/20 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>MENU</span>
          </button>
          <span className="text-red-500 font-bold tracking-wider">
            [x_x] DARK-GPT CONFIGURATION
          </span>
        </div>
      </div>

      <div className="p-4 space-y-5 max-w-3xl mx-auto w-full flex-1 overflow-y-auto">
        {statusMsg && (
          <div className="border border-red-600 bg-red-950/40 p-2 text-xs text-red-400 font-bold animate-pulse">
            {statusMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
          {/* Provider Selection */}
          <div className="border border-red-900/60 bg-neutral-950 p-4 space-y-2">
            <label className="text-neutral-300 font-bold flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-red-500" />
              BACKEND AI PROVIDER
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`p-2.5 border text-left flex flex-col justify-between transition-colors ${
                  provider === 'gemini'
                    ? 'border-red-600 bg-red-950/40 text-white font-bold'
                    : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="font-bold">Gemini (Cloud / Fast)</div>
                <div className="text-[10px] text-neutral-500 mt-1">Server-side proxy with Gemini 2.5 Flash</div>
              </button>

              <button
                type="button"
                onClick={() => setProvider('ollama')}
                className={`p-2.5 border text-left flex flex-col justify-between transition-colors ${
                  provider === 'ollama'
                    ? 'border-red-600 bg-red-950/40 text-white font-bold'
                    : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="font-bold">Ollama (Local Host)</div>
                <div className="text-[10px] text-neutral-500 mt-1">Default Ollama endpoint / llama3.2</div>
              </button>

              <button
                type="button"
                onClick={() => setProvider('simulation')}
                className={`p-2.5 border text-left flex flex-col justify-between transition-colors ${
                  provider === 'simulation'
                    ? 'border-red-600 bg-red-950/40 text-white font-bold'
                    : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="font-bold">Offline Cyber Kernel</div>
                <div className="text-[10px] text-neutral-500 mt-1">Simulated offensive security engine</div>
              </button>
            </div>
          </div>

          {/* Model Name */}
          <div className="border border-red-900/60 bg-neutral-950 p-4 space-y-2">
            <label className="text-neutral-300 font-bold block">
              MODEL IDENTIFIER
            </label>
            <input
              id="settings-model-input"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="dolphin3, llama3.2, or gemini-3.6-flash"
              className="w-full bg-black border border-red-900 px-3 py-2 text-xs sm:text-sm text-white focus:border-red-600 focus:outline-none"
            />
            
            {/* Quick Model Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-neutral-500 font-bold">MODÈLES RAPIDES :</span>
              <button
                type="button"
                onClick={() => {
                  setModel('dolphin3');
                  setProvider('ollama');
                }}
                className={`px-2 py-0.5 text-[11px] border rounded transition-colors ${
                  model === 'dolphin3'
                    ? 'border-red-500 bg-red-950 text-white font-bold'
                    : 'border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                🐬 dolphin3 (Ollama)
              </button>
              <button
                type="button"
                onClick={() => {
                  setModel('dolphin-llama3');
                  setProvider('ollama');
                }}
                className={`px-2 py-0.5 text-[11px] border rounded transition-colors ${
                  model === 'dolphin-llama3'
                    ? 'border-red-500 bg-red-950 text-white font-bold'
                    : 'border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                dolphin-llama3
              </button>
              <button
                type="button"
                onClick={() => {
                  setModel('llama3.2');
                  setProvider('ollama');
                }}
                className={`px-2 py-0.5 text-[11px] border rounded transition-colors ${
                  model === 'llama3.2'
                    ? 'border-red-500 bg-red-950 text-white font-bold'
                    : 'border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                llama3.2
              </button>
              <button
                type="button"
                onClick={() => {
                  setModel('gemini-3.6-flash');
                  setProvider('gemini');
                }}
                className={`px-2 py-0.5 text-[11px] border rounded transition-colors ${
                  model === 'gemini-3.6-flash'
                    ? 'border-red-500 bg-red-950 text-white font-bold'
                    : 'border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                gemini-3.6-flash
              </button>
            </div>
            
            <div className="text-[10px] text-neutral-500">
              Modèle recommandé : <strong className="text-white">dolphin3</strong> (pour Ollama en local) ou <strong className="text-white">gemini-3.6-flash</strong>.
            </div>
          </div>

          {/* Ollama Server URL */}
          {provider === 'ollama' && (
            <div className="border border-red-900/60 bg-neutral-950 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-neutral-300 font-bold block">
                  OLLAMA SERVER URL
                </label>
                <button
                  type="button"
                  onClick={checkOllama}
                  className="text-[10px] px-2 py-0.5 border border-neutral-700 hover:border-red-500 text-neutral-300 hover:text-white transition-colors"
                >
                  Tester la connexion Ollama
                </button>
              </div>
              <input
                id="settings-server-url"
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://127.0.0.1:11434"
                className="w-full bg-black border border-red-900 px-3 py-2 text-xs sm:text-sm text-white focus:border-red-600 focus:outline-none"
              />
              {ollamaStatus && (
                <div className={`text-[11px] p-2 border ${ollamaStatus.online ? 'border-emerald-700 bg-emerald-950/30 text-emerald-300' : 'border-neutral-700 bg-neutral-900 text-neutral-400'}`}>
                  {ollamaStatus.online ? (
                    <div>
                      [✓] Ollama détecté en ligne sur {serverUrl} !
                      {ollamaStatus.models && ollamaStatus.models.length > 0 && (
                        <div className="text-[10px] mt-1 text-neutral-400">
                          Modèles installés : {ollamaStatus.models.map((m: any) => m.name).join(', ')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      [!] Ollama n&apos;est pas détecté sur {serverUrl} ({ollamaStatus.error}). Lancez <code className="text-white bg-black px-1">ollama run dolphin3</code> sur votre machine pour connecter le modèle.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* System Instructions */}
          <div className="border border-red-900/60 bg-neutral-950 p-4 space-y-2">
            <label className="text-neutral-300 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                SYSTEM INSTRUCTIONS / CYBER PROMPT
              </span>
              <span className="text-[10px] text-red-400 font-normal">UNRESTRICTED RESEARCH</span>
            </label>
            <textarea
              id="settings-system-prompt"
              rows={7}
              value={systemMessage}
              onChange={(e) => setSystemMessage(e.target.value)}
              className="w-full bg-black border border-red-900 p-3 text-xs text-neutral-200 focus:border-red-600 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              id="reset-settings-button"
              type="button"
              onClick={handleReset}
              className="px-3 py-2 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 text-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET DEFAULTS</span>
            </button>

            <button
              id="save-settings-button"
              type="submit"
              className="px-5 py-2 bg-red-950 border border-red-600 text-white text-xs font-bold hover:bg-red-600 flex items-center gap-1.5 transition-colors glow-box-red"
            >
              <Save className="w-3.5 h-3.5" />
              <span>SAVE CONFIGURATION</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
