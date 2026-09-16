import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChatMessage, Session, PluginId } from '../types.ts';
import { 
  Download, 
  Trash2, 
  ArrowLeft, 
  Send, 
  FileText, 
  Table, 
  FileCode, 
  Globe, 
  Cpu, 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Check, 
  ExternalLink, 
  Clock, 
  Sparkles,
  Layers,
  FastForward,
  Gauge
} from 'lucide-react';
import { exportToPdf, exportToExcel, exportToDocx, exportSourceCode } from '../utils/docExport.ts';
import { OllamaInstallerModal } from './OllamaInstallerModal.tsx';

interface TerminalChatProps {
  session: Session;
  onUpdateSession: (updated: Session) => void;
  onBackToMenu: () => void;
}

export const TerminalChat: React.FC<TerminalChatProps> = ({
  session,
  onUpdateSession,
  onBackToMenu
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(session.messages || []);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [spinnerText, setSpinnerText] = useState<string>('|');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const [expandedExport, setExpandedExport] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Typewriter streaming state & speed setting
  const [typingSpeed, setTypingSpeed] = useState<'slow' | 'normal' | 'instant'>('slow');
  const [activeModel, setActiveModel] = useState<string>('🐬 dolphin3 (Ollama)');
  const [showOllamaModal, setShowOllamaModal] = useState<boolean>(false);
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);
  const [dismissBanner, setDismissBanner] = useState<boolean>(false);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [streamedLength, setStreamedLength] = useState<number>(0);
  const streamingTimerRef = useRef<any>(null);
  const fullContentRef = useRef<string>('');

  // Fetch active model from config & check Ollama status
  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        if (data.model) {
          const isOllama = data.provider === 'ollama' || data.model.includes('dolphin');
          setActiveModel(isOllama ? `🐬 ${data.model} (Ollama)` : data.model);
        }
      })
      .catch(() => {});

    fetch('/api/ollama/status')
      .then(r => r.json())
      .then(data => {
        setOllamaOnline(Boolean(data.online));
      })
      .catch(() => setOllamaOnline(false));
  }, []);

  // Active Plugins
  const [activePlugins, setActivePlugins] = useState<Record<PluginId, boolean>>({
    web_search: false,
    doc_gen: false,
    code_interpreter: true,
    deep_reasoning: true,
    cyber_audit: true
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync session changes
  useEffect(() => {
    setMessages(session.messages || []);
  }, [session.id]);

  // Finish typewriter streaming immediately
  const finishStreaming = () => {
    if (streamingTimerRef.current) {
      clearInterval(streamingTimerRef.current);
      streamingTimerRef.current = null;
    }
    setStreamingMsgId(null);
    setStreamedLength(0);
    fullContentRef.current = '';
  };

  // Global Keydown to skip typewriter when user presses Enter
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (streamingMsgId && e.key === 'Enter') {
        e.preventDefault();
        finishStreaming();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [streamingMsgId]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (streamingTimerRef.current) {
        clearInterval(streamingTimerRef.current);
      }
    };
  }, []);

  // Spinner animation when loading
  useEffect(() => {
    if (!loading) {
      setElapsedTime(0);
      return;
    }
    const frames = ['|', '/', '-', '\\'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % frames.length;
      setSpinnerText(frames[idx]);
    }, 120);

    const start = Date.now();
    const timerInterval = setInterval(() => {
      setElapsedTime(Number(((Date.now() - start) / 1000).toFixed(1)));
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
    };
  }, [loading]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, streamedLength]);

  // Keep focus on input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const togglePlugin = (id: PluginId) => {
    setActivePlugins(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoning(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const toggleExportMenu = (msgId: string) => {
    setExpandedExport(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // If currently streaming, pressing Enter skips the typewriter first
    if (streamingMsgId) {
      finishStreaming();
      return;
    }

    const cleanPrompt = input.trim();
    if (!cleanPrompt || loading) return;

    // Special commands
    if (cleanPrompt.toLowerCase() === 'exit' || cleanPrompt.toLowerCase() === 'quit') {
      onBackToMenu();
      return;
    }

    if (cleanPrompt.toLowerCase() === 'clear' || cleanPrompt.toLowerCase() === 'effacer memoire' || cleanPrompt.toLowerCase() === 'effacer mémoire') {
      const resetMessages: ChatMessage[] = [];
      setMessages(resetMessages);
      setInput('');
      onUpdateSession({
        ...session,
        messages: resetMessages
      });
      return;
    }

    // Direct export command support
    if (cleanPrompt.startsWith('/export')) {
      const parts = cleanPrompt.split(' ');
      const format = parts[1]?.toLowerCase();
      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
      if (lastAssistant) {
        if (format === 'pdf') {
          exportToPdf(`rapport_${Date.now()}`, 'Rapport DARK-GPT', lastAssistant.content);
        } else if (format === 'xls' || format === 'excel' || format === 'xlsx') {
          exportToExcel(`donnees_${Date.now()}`, 'Export Excel', lastAssistant.content);
        } else if (format === 'doc' || format === 'docx' || format === 'word') {
          exportToDocx(`document_${Date.now()}`, 'Document DARK-GPT', lastAssistant.content);
        } else if (format === 'code') {
          exportSourceCode(`script_${Date.now()}`, extractCode(lastAssistant.content), 'py');
        }
      }
      setInput('');
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: cleanPrompt,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setCommandHistory(prev => [cleanPrompt, ...prev]);
    setHistoryIndex(-1);
    setLoading(true);

    const activeList = Object.entries(activePlugins)
      .filter(([_, active]) => active)
      .map(([id]) => id);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          session_id: session.id,
          activePlugins: activeList
        })
      });

      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      const rawResponse = data.response || "No response received.";

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        role: 'assistant',
        content: rawResponse,
        timestamp: new Date().toISOString(),
        reasoningTime: data.reasoningTime || elapsedTime || 1.4,
        reasoningSteps: data.reasoningSteps || [
          "Isolation des paramètres de la requête",
          "Évaluation des modules (Docs / Code / Web)",
          "Validation et rendu final"
        ],
        sources: data.sources
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      onUpdateSession({
        ...session,
        messages: finalMessages,
        updated_at: new Date().toISOString()
      });

      if (data.activeModel) {
        setActiveModel(data.activeModel.includes('dolphin') ? `🐬 ${data.activeModel}` : data.activeModel);
      }

      // Start realistic and readable typewriter effect based on typingSpeed
      if (typingSpeed === 'instant') {
        setStreamingMsgId(null);
        setStreamedLength(0);
      } else {
        setStreamingMsgId(assistantMessage.id);
        fullContentRef.current = rawResponse;
        setStreamedLength(1);

        let currentPos = 1;
        const textLen = rawResponse.length;
        // 'slow': 1 character every 36ms (~27 chars/second, easy to read in real time)
        // 'normal': 2 characters every 24ms (~80 chars/second)
        const stepSize = typingSpeed === 'slow' ? 1 : 2;
        const intervalMs = typingSpeed === 'slow' ? 36 : 24;

        if (streamingTimerRef.current) clearInterval(streamingTimerRef.current);
        streamingTimerRef.current = setInterval(() => {
          currentPos += stepSize;
          if (currentPos >= textLen) {
            clearInterval(streamingTimerRef.current);
            streamingTimerRef.current = null;
            setStreamingMsgId(null);
            setStreamedLength(0);
          } else {
            setStreamedLength(currentPos);
          }
        }, intervalMs);
      }

    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: `[!] Erreur de communication avec le noyau DARK-GPT : ${err.message || 'Hors ligne'}.`,
        timestamp: new Date().toISOString()
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (streamingMsgId && e.key === 'Enter') {
      e.preventDefault();
      finishStreaming();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setInput(commandHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInput(commandHistory[nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const handleExportSession = () => {
    window.open(`/api/sessions/${session.id}/export`, '_blank');
  };

  const handleClearHistory = () => {
    if (confirm('Effacer la mémoire de cette session ?')) {
      setMessages([]);
      onUpdateSession({
        ...session,
        messages: []
      });
    }
  };

  // Helper to extract code from markdown block
  const extractCode = (text: string): string => {
    const match = text.match(/```[a-z]*\n([\s\S]*?)```/i);
    return match ? match[1] : text;
  };

  // Determine if the user or message explicitly asked for a document export
  const shouldShowExportOptions = (msgIndex: number, msg: ChatMessage): boolean => {
    // Check if previous user message asked for docs
    const prevMsg = messages[msgIndex - 1];
    const userPrompt = prevMsg && prevMsg.role === 'user' ? prevMsg.content.toLowerCase() : '';
    const askedForDoc = /pdf|excel|xls|xlsx|word|docx|document|tableau|rapport/i.test(userPrompt);
    const contentHasDocSignature = msg.content.includes('[x_x] GÉNÉRATEUR DE DOCUMENT') || msg.content.includes('GÉNÉRATEUR DE FEUILLE DE CALCUL');
    const isManuallyExpanded = Boolean(expandedExport[msg.id]);
    return askedForDoc || contentHasDocSignature || isManuallyExpanded;
  };

  return (
    <div id="terminal-chat-container" className="flex flex-col h-full bg-black text-white font-mono border border-red-600 shadow-2xl relative">
      {/* Red Chat Header */}
      <div className="bg-red-950/40 border-b border-red-600 px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <button
            id="chat-back-button"
            onClick={onBackToMenu}
            className="flex items-center gap-1 text-red-500 hover:text-white px-2 py-0.5 border border-red-600 hover:bg-red-600/20 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>MENU</span>
          </button>
          <span className="text-red-500 font-bold tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            [x_x] DARK-GPT
          </span>
          <span className="text-neutral-400 hidden sm:inline text-xs">
            // {session.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Model Indicator */}
          <button
            type="button"
            onClick={() => setShowOllamaModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-black/70 border border-red-900/80 hover:border-red-500 rounded text-[11px] text-neutral-300 transition-all cursor-pointer hover:shadow-[0_0_8px_rgba(220,38,38,0.3)]"
            title="Cliquez pour configurer ou installer Ollama & Dolphin 3"
          >
            <span className="text-neutral-500">MOTEUR :</span>
            <span className="text-red-400 font-bold">{activeModel}</span>
            <span className="text-[10px] text-red-500/80 bg-red-950 px-1 py-0.2 rounded border border-red-900/50">config</span>
          </button>

          {streamingMsgId && (
            <button
              onClick={finishStreaming}
              className="flex items-center gap-1 px-2 py-0.5 bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-500 text-[11px] rounded transition-all animate-pulse"
              title="Passer l'effet machine à écrire"
            >
              <FastForward className="w-3 h-3" />
              <span>Passer [Entrée]</span>
            </button>
          )}

          <button
            id="chat-export-button"
            onClick={handleExportSession}
            title="Exporter l'historique complet (.txt)"
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-red-600/20 border border-transparent hover:border-red-600 rounded transition-all"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            id="chat-clear-button"
            onClick={handleClearHistory}
            title="Effacer la mémoire"
            className="p-1.5 text-neutral-300 hover:text-red-400 hover:bg-red-600/20 border border-transparent hover:border-red-600 rounded transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Plugins & Capabilities Bar */}
      <div className="bg-neutral-950 border-b border-red-900/60 px-3 py-1.5 flex items-center gap-2 overflow-x-auto text-[11px] select-none">
        <span className="text-neutral-400 flex items-center gap-1 font-bold whitespace-nowrap">
          <Layers className="w-3 h-3 text-red-500" />
          PLUGINS :
        </span>

        {/* Web Search Plugin */}
        <button
          onClick={() => togglePlugin('web_search')}
          className={`px-2 py-0.5 border flex items-center gap-1 transition-all rounded-sm whitespace-nowrap ${
            activePlugins.web_search 
              ? 'bg-red-600 text-white border-red-500 font-bold shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
              : 'border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
          }`}
          title="Active la recherche sur le web en direct"
        >
          <Globe className="w-2.5 h-2.5" />
          <span>Recherche Web {activePlugins.web_search ? '[ON]' : '[OFF]'}</span>
        </button>

        {/* Code Interpreter Plugin */}
        <button
          onClick={() => togglePlugin('code_interpreter')}
          className={`px-2 py-0.5 border flex items-center gap-1 transition-all rounded-sm whitespace-nowrap ${
            activePlugins.code_interpreter 
              ? 'bg-red-950/80 text-red-400 border-red-600 font-bold' 
              : 'border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
          }`}
          title="Génération et exécution de scripts Python/Bash"
        >
          <FileCode className="w-2.5 h-2.5" />
          <span>Code Interpreter</span>
        </button>

        {/* Deep Reasoning Plugin */}
        <button
          onClick={() => togglePlugin('deep_reasoning')}
          className={`px-2 py-0.5 border flex items-center gap-1 transition-all rounded-sm whitespace-nowrap ${
            activePlugins.deep_reasoning 
              ? 'bg-red-950/80 text-red-400 border-red-600 font-bold' 
              : 'border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
          }`}
          title="Affiche le temps et le détail des étapes de réflexion"
        >
          <Cpu className="w-2.5 h-2.5" />
          <span>Raisonnement Pas-à-Pas</span>
        </button>

        {/* Typewriter Speed Selector */}
        <div className="ml-auto flex items-center gap-1.5 pl-2 border-l border-neutral-800 text-[11px] whitespace-nowrap">
          <Gauge className="w-3 h-3 text-red-400" />
          <span className="text-neutral-400">Vitesse :</span>
          <button
            type="button"
            onClick={() => setTypingSpeed('slow')}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              typingSpeed === 'slow' 
                ? 'bg-red-950 text-red-300 font-bold border border-red-600 shadow-[0_0_6px_rgba(220,38,38,0.4)]' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
            title="Vitesse lente et posée (idéale pour lire confortablement)"
          >
            Lente
          </button>
          <button
            type="button"
            onClick={() => setTypingSpeed('normal')}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              typingSpeed === 'normal' 
                ? 'bg-red-950 text-red-300 font-bold border border-red-600 shadow-[0_0_6px_rgba(220,38,38,0.4)]' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
            title="Vitesse moyenne"
          >
            Normale
          </button>
          <button
            type="button"
            onClick={() => setTypingSpeed('instant')}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              typingSpeed === 'instant' 
                ? 'bg-red-950 text-red-300 font-bold border border-red-600 shadow-[0_0_6px_rgba(220,38,38,0.4)]' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
            title="Affichage instantané"
          >
            Directe
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
        {/* Recommended Dolphin 3 Banner if Ollama is not active */}
        {ollamaOnline === false && !dismissBanner && (
          <div className="border border-red-700/80 bg-red-950/40 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded shadow-[0_0_15px_rgba(220,38,38,0.15)]">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>EXPÉRIENCE OPTIMALE : ACTIVEZ DOLPHIN 3 EN ARRIÈRE-PLAN</span>
              </div>
              <div className="text-[11px] text-neutral-300 leading-relaxed">
                Pour débrider 100% des capacités de DARK-GPT (zéro filtre, analyse offensive et exécution locale), lancez ou installez Dolphin 3. Un mode sans droits administrateur pour Mac/Linux/Windows est disponible en 1 clic.
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setShowOllamaModal(true)}
                className="px-3 py-1.5 bg-red-900 hover:bg-red-800 text-white font-bold border border-red-500 rounded text-xs flex items-center gap-1.5 transition-all shadow-[0_0_8px_rgba(220,38,38,0.3)]"
              >
                <span>Installer / Lancer Dolphin 3</span>
              </button>
              <button
                type="button"
                onClick={() => setDismissBanner(true)}
                className="text-neutral-400 hover:text-white text-xs px-2 py-1 border border-neutral-800 hover:border-neutral-600 rounded transition-colors"
                title="Ignorer pour le moment"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="border border-red-900/60 bg-red-950/10 p-3 text-neutral-400 text-xs leading-relaxed space-y-1">
          <div className="text-red-500 font-bold">[!] SYSTÈME IA NON CENSURÉ // DARK-GPT v1.1.0</div>
          <div>Créé par <span className="text-white font-bold">M4TH4CK3R</span>. Analyse offensive/défensive approfondie, scripts et génération documentaire à la demande.</div>
          <div className="text-neutral-500 text-[11px]">Astuce : Appuyez sur <span className="text-white font-bold">Entrée</span> pour accélérer immédiatement la rédaction machine à écrire.</div>
        </div>

        {messages.map((msg, idx) => {
          const isStreamingThis = streamingMsgId === msg.id;
          const displayContent = isStreamingThis ? msg.content.slice(0, streamedLength) : msg.content;
          const showDocs = shouldShowExportOptions(idx, msg);

          return (
            <div key={msg.id} className="space-y-2">
              {msg.role === 'user' ? (
                <div className="flex items-start gap-2 bg-neutral-950/50 p-2 border-l-2 border-neutral-600">
                  <span className="text-white font-bold select-none whitespace-nowrap">VOUS &gt;</span>
                  <span className="text-white whitespace-pre-wrap flex-1">{msg.content}</span>
                </div>
              ) : msg.role === 'assistant' ? (
                <div className="space-y-2 bg-black border border-neutral-900 p-3 rounded-sm">
                  {/* Assistant Message Header with Thinking Timer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2">
                    <div className="text-red-500 font-bold flex items-center gap-1.5 select-none">
                      <span>[x_x] DARK-GPT &gt;</span>
                      {isStreamingThis && (
                        <span className="text-[11px] text-neutral-400 font-normal animate-pulse">
                          (rédaction en cours... [Entrée pour passer])
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Optional Export trigger button at the end of reasoning bar */}
                      <button
                        onClick={() => toggleExportMenu(msg.id)}
                        className={`px-2 py-0.5 border text-[11px] rounded transition-colors flex items-center gap-1 ${
                          showDocs
                            ? 'bg-neutral-800 border-neutral-600 text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                        }`}
                        title="Options d'exportation de documents (PDF/Excel/Word)"
                      >
                        <FileText className="w-3 h-3 text-red-500" />
                        <span>Options Docs</span>
                      </button>

                      {/* Reasoning Time Badge */}
                      {msg.reasoningTime && (
                        <button
                          onClick={() => toggleReasoning(msg.id)}
                          className="flex items-center gap-1 px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 rounded text-[11px] transition-colors"
                          title="Cliquez pour voir les étapes de raisonnement"
                        >
                          <Clock className="w-3 h-3 text-red-400" />
                          <span>Pensé pendant {msg.reasoningTime}s</span>
                          {expandedReasoning[msg.id] ? (
                            <ChevronDown className="w-3 h-3 text-neutral-400" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-neutral-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Collapsible Reasoning Steps */}
                  {expandedReasoning[msg.id] && msg.reasoningSteps && (
                    <div className="bg-neutral-950 border-l-2 border-red-600 p-2.5 space-y-1 text-neutral-400 text-[11px] font-mono animate-fadeIn">
                      <div className="text-red-400 font-bold text-xs flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        CHEMINEMENT DE RAISONNEMENT :
                      </div>
                      {msg.reasoningSteps.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-1.5 pl-2">
                          <span className="text-red-500">&gt;</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message Body with typewriter animation */}
                  <div className="text-neutral-200 font-medium whitespace-pre-wrap leading-relaxed pl-1">
                    {displayContent}
                    {isStreamingThis && (
                      <span className="inline-block w-2 h-4 ml-0.5 bg-red-500 animate-pulse align-middle" />
                    )}
                  </div>

                  {/* Web Search Sources if available */}
                  {msg.sources && msg.sources.length > 0 && !isStreamingThis && (
                    <div className="mt-2 pt-2 border-t border-neutral-900 space-y-1">
                      <div className="text-neutral-400 text-[11px] font-bold flex items-center gap-1">
                        <Globe className="w-3 h-3 text-red-500" />
                        SOURCES & VÉRIFICATIONS WEB :
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {msg.sources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-1.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 hover:text-red-400 rounded transition-colors group"
                          >
                            <span className="truncate flex-1 font-semibold">{src.title}</span>
                            <ExternalLink className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-100 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action & Export Toolbar: ONLY when asked or code detected */}
                  {!isStreamingThis && (
                    <div className="mt-3 pt-2 border-t border-neutral-900 flex flex-wrap items-center gap-1.5 select-none text-[11px]">
                      {/* Document Options (PDF, Excel, Word): Shown ONLY IF requested or toggled */}
                      {showDocs && (
                        <div className="flex flex-wrap items-center gap-1.5 bg-neutral-950 p-1 rounded border border-neutral-800">
                          <span className="text-neutral-500 text-[10px] font-bold px-1">DOCUMENTS :</span>
                          <button
                            onClick={() => exportToPdf(`rapport_${Date.now()}`, 'Rapport DARK-GPT', msg.content)}
                            className="flex items-center gap-1 px-2 py-0.5 bg-black hover:bg-red-950/60 border border-neutral-800 hover:border-red-600 text-neutral-300 hover:text-white rounded transition-all"
                            title="Télécharger en document PDF"
                          >
                            <FileText className="w-3 h-3 text-red-500" />
                            <span>PDF</span>
                          </button>

                          <button
                            onClick={() => exportToExcel(`analyse_${Date.now()}`, 'Export Excel', msg.content)}
                            className="flex items-center gap-1 px-2 py-0.5 bg-black hover:bg-red-950/60 border border-neutral-800 hover:border-red-600 text-neutral-300 hover:text-white rounded transition-all"
                            title="Télécharger en tableur Excel (.xlsx)"
                          >
                            <Table className="w-3 h-3 text-emerald-500" />
                            <span>EXCEL</span>
                          </button>

                          <button
                            onClick={() => exportToDocx(`document_${Date.now()}`, 'Document DARK-GPT', msg.content)}
                            className="flex items-center gap-1 px-2 py-0.5 bg-black hover:bg-red-950/60 border border-neutral-800 hover:border-red-600 text-neutral-300 hover:text-white rounded transition-all"
                            title="Télécharger en document Word (.docx)"
                          >
                            <FileText className="w-3 h-3 text-blue-500" />
                            <span>WORD</span>
                          </button>
                        </div>
                      )}

                      {/* Export Code Button (available when code blocks exist) */}
                      {msg.content.includes('```') && (
                        <button
                          onClick={() => exportSourceCode(`script_${Date.now()}`, extractCode(msg.content), 'py')}
                          className="flex items-center gap-1 px-2 py-1 bg-neutral-950 hover:bg-red-950/60 border border-neutral-800 hover:border-red-600 text-neutral-300 hover:text-white rounded transition-all"
                          title="Télécharger le script de code (.py)"
                        >
                          <FileCode className="w-3 h-3 text-amber-500" />
                          <span>CODE (.py)</span>
                        </button>
                      )}

                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="flex items-center gap-1 px-2 py-1 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded ml-auto transition-all"
                        title="Copier la réponse dans le presse-papier"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-neutral-500 italic pl-4 text-xs">
                  [SYSTEM: {msg.content}]
                </div>
              )}
            </div>
          );
        })}

        {/* Real-time Thinking & Spinner with Live Elapsed Seconds Counter */}
        {loading && (
          <div className="bg-neutral-950/80 border border-red-900/60 p-3 rounded space-y-1.5 animate-pulse">
            <div className="flex items-center gap-2 text-red-500 font-bold text-xs sm:text-sm">
              <Clock className="w-4 h-4 text-red-500 animate-spin" />
              <span>[x_x] DARK-GPT réfléchit ({elapsedTime.toFixed(1)}s) {spinnerText}</span>
            </div>
            <div className="text-neutral-500 text-[11px] pl-6 font-mono">
              &gt; Évaluation des vecteurs techniques, analyse mémoire et synthèse...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Red Terminal Command Input */}
      <form
        onSubmit={handleSend}
        className="border-t border-red-600 bg-black p-3 flex items-center gap-2"
      >
        <span className="text-white font-bold select-none text-sm sm:text-base">VOUS &gt;</span>
        <input
          ref={inputRef}
          id="terminal-chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            streamingMsgId 
              ? "Appuyez sur ENTRÉE pour afficher instantanément tout le texte..." 
              : loading 
                ? "DARK-GPT est en cours de traitement..." 
                : "Tapez une requête, test d'intrusion, script, ou commande..."
          }
          disabled={loading}
          autoComplete="off"
          className="flex-1 bg-transparent text-white placeholder-neutral-600 text-xs sm:text-sm focus:outline-none"
        />
        <button
          id="terminal-chat-send-btn"
          type="submit"
          disabled={loading || (!input.trim() && !streamingMsgId)}
          className="px-3.5 py-1.5 bg-red-950/60 border border-red-600 hover:bg-red-600 text-white text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
        >
          {streamingMsgId ? (
            <>
              <FastForward className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">PASSER</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ENVOYER</span>
            </>
          )}
        </button>
      </form>

      {/* Ollama & Dolphin 3 Interactive Installer & Background Runner Modal */}
      <OllamaInstallerModal
        isOpen={showOllamaModal}
        onClose={() => setShowOllamaModal(false)}
        onConnected={() => {
          setOllamaOnline(true);
          setActiveModel('🐬 dolphin3 (Ollama)');
        }}
      />
    </div>
  );
};
