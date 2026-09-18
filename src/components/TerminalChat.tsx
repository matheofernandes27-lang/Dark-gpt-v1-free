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
  Gauge,
  HardDrive,
  FolderOpen,
  Shield,
  Skull,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { exportToPdf, exportToExcel, exportToDocx, exportSourceCode } from '../utils/docExport.ts';
import { OllamaInstallerModal } from './OllamaInstallerModal.tsx';
import { MacFileAccessModal } from './MacFileAccessModal.tsx';
import { Language, translations } from '../utils/i18n.ts';

interface TerminalChatProps {
  session: Session;
  language?: Language;
  activeMode?: 'defense' | 'hacker';
  defaultShowHistory?: boolean;
  onUpdateSession: (updated: Session) => void;
  onBackToMenu: () => void;
  onToggleCowork?: () => void;
  isCoworkActive?: boolean;
}

export const TerminalChat: React.FC<TerminalChatProps> = ({
  session,
  language = 'fr',
  activeMode = 'hacker',
  defaultShowHistory = false,
  onUpdateSession,
  onBackToMenu,
  onToggleCowork,
  isCoworkActive = false
}) => {
  const isGreen = activeMode === 'defense';
  const t = translations[language];
  const [messages, setMessages] = useState<ChatMessage[]>(session.messages || []);
  const [showHistoryMessages, setShowHistoryMessages] = useState<boolean>(defaultShowHistory);
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
  const [showMacModal, setShowMacModal] = useState<boolean>(false);
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);
  const [dismissBanner, setDismissBanner] = useState<boolean>(false);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [streamedLength, setStreamedLength] = useState<number>(0);
  const streamingTimerRef = useRef<any>(null);
  const fullContentRef = useRef<string>('');

  // Fetch active model from config & check Ollama status with automatic background polling
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

    const pollOllama = async () => {
      // 1. Check local Mac Ollama directly from browser
      try {
        const localPing = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(1500) });
        if (localPing.ok) {
          const lData = await localPing.json();
          const hasDolphin = (lData.models || []).some((m: any) => m.name.toLowerCase().includes('dolphin'));
          setOllamaOnline(true);
          setActiveModel(hasDolphin ? '🐬 dolphin3 (Local Mac)' : '🐬 Ollama (Local Mac)');
          return;
        }
      } catch {
        // Fall back to server status check
      }

      fetch('/api/ollama/status')
        .then(r => r.json())
        .then(data => {
          setOllamaOnline(Boolean(data.online));
        })
        .catch(() => setOllamaOnline(false));
    };

    pollOllama();
    const interval = setInterval(pollOllama, 8000);
    return () => clearInterval(interval);
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

    // Open Mac Files authorization modal command
    if (cleanPrompt.toLowerCase() === '/mac' || cleanPrompt.toLowerCase() === 'mac' || cleanPrompt.toLowerCase() === '/fichiers' || cleanPrompt.toLowerCase() === 'fichiers mac') {
      setShowMacModal(true);
      setInput('');
      return;
    }

    // Open Ollama installer modal command
    if (cleanPrompt.toLowerCase() === '/ollama' || cleanPrompt.toLowerCase() === 'ollama') {
      setShowOllamaModal(true);
      setInput('');
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
    setShowHistoryMessages(true);
    setInput('');
    setCommandHistory(prev => [cleanPrompt, ...prev]);
    setHistoryIndex(-1);
    setLoading(true);

    const activeList = Object.entries(activePlugins)
      .filter(([_, active]) => active)
      .map(([id]) => id);

    try {
      let data: any = null;
      let rawResponse = '';

      // Attempt direct query to local Mac Ollama if available
      if (ollamaOnline) {
        try {
          const localChatRes = await fetch('http://127.0.0.1:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'dolphin3',
              messages: newMessages.slice(-8).map(m => ({ role: m.role, content: m.content })),
              stream: false
            }),
            signal: AbortSignal.timeout(15000)
          });
          if (localChatRes.ok) {
            const localData = await localChatRes.json();
            if (localData?.message?.content) {
              rawResponse = localData.message.content.trim();
              data = {
                response: rawResponse,
                activeModel: '🐬 dolphin3 (Local Mac)',
                reasoningTime: 0.8
              };
            }
          }
        } catch {
          // Gracefully fallback to server
        }
      }

      if (!data) {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages,
            session_id: session.id,
            activeMode: activeMode,
            activePlugins: activeList
          })
        });

        if (!res.ok) throw new Error('API Error');
        data = await res.json();
        rawResponse = data.response || "No response received.";
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        role: 'assistant',
        content: rawResponse,
        timestamp: new Date().toISOString(),
        reasoningTime: data.reasoningTime || elapsedTime || 0.9,
        reasoningSteps: data.reasoningSteps,
        agentLoop: data.agentLoop,
        requiresConfirmation: data.requiresConfirmation,
        riskDetails: data.riskDetails,
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

  const handleConfirmAction = (msg: ChatMessage) => {
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, requiresConfirmation: false } : m));
    setInput("Action confirmée. Poursuivre l'exécution sur le dossier partagé.");
    setTimeout(() => {
      const inputEl = document.getElementById('terminal-chat-input') as HTMLInputElement;
      if (inputEl) {
        inputEl.focus();
      }
    }, 50);
  };

  const handleCancelAction = (msg: ChatMessage) => {
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, requiresConfirmation: false } : m));
    const cancelMsg: ChatMessage = {
      id: `msg-${Date.now()}-a`,
      role: 'assistant',
      content: "Opération sensible annulée par l'utilisateur. Aucun fichier n'a été modifié.",
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, cancelMsg]);
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
    <div id="terminal-chat-container" className={`flex flex-col h-full bg-black text-white font-mono border shadow-2xl relative ${
      activeMode === 'defense' 
        ? 'border-emerald-600 shadow-[0_0_25px_rgba(16,185,129,0.2)]' 
        : 'border-red-600 shadow-[0_0_25px_rgba(239,68,68,0.2)]'
    }`}>
      {/* Dynamic Chat Header */}
      <div className={`px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm border-b ${
        activeMode === 'defense'
          ? 'bg-emerald-950/40 border-emerald-600'
          : 'bg-red-950/40 border-red-600'
      }`}>
        <div className="flex items-center gap-2">
          <button
            id="chat-back-button"
            onClick={onBackToMenu}
            className={`flex items-center gap-1 px-2 py-0.5 border transition-colors ${
              activeMode === 'defense'
                ? 'text-emerald-400 hover:text-white border-emerald-600 hover:bg-emerald-600/20'
                : 'text-red-500 hover:text-white border-red-600 hover:bg-red-600/20'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>MENU</span>
          </button>
          <span className={`font-bold tracking-wider flex items-center gap-1.5 ${
            activeMode === 'defense' ? 'text-emerald-400' : 'text-red-500'
          }`}>
            {activeMode === 'defense' ? <Shield className="w-3.5 h-3.5 text-emerald-400" /> : <Skull className="w-3.5 h-3.5 text-red-500" />}
            <span>{activeMode === 'defense' ? '[🛡️] DARK-GPT // ASSISTANCE GÉNÉRALE' : '[💀] DARK-GPT // APPRENTISSAGE TECHNIQUE AVANCÉ'}</span>
          </span>
          <span className="text-neutral-400 hidden sm:inline text-xs">
            // {session.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* History Toggle Button if session has messages */}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistoryMessages(prev => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-black/80 border border-neutral-700 hover:border-neutral-500 rounded text-[11px] text-neutral-300 transition-colors"
              title={showHistoryMessages ? t.hideHistory : t.showHistory}
            >
              {showHistoryMessages ? <EyeOff className="w-3.5 h-3.5 text-neutral-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="hidden sm:inline">{showHistoryMessages ? t.hideHistory : t.showHistory}</span>
              <span className="text-[10px] text-neutral-400 font-mono">({messages.length})</span>
            </button>
          )}

          {/* Activer dark-gpt cowork Button (Specification Plugin) */}
          {onToggleCowork && (
            <button
              type="button"
              onClick={onToggleCowork}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-bold transition-all cursor-pointer border ${
                isCoworkActive
                  ? isGreen
                    ? 'bg-emerald-600 text-black border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse'
                    : 'bg-red-600 text-white border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
                  : isGreen
                    ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300 hover:border-emerald-500 hover:text-white'
                    : 'bg-red-950/40 border-red-800 text-red-300 hover:border-red-500 hover:text-white'
              }`}
              title={isCoworkActive ? "Fermer le panneau dark-gpt cowork" : "Activer dark-gpt cowork (accès direct et validation humaine)"}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isCoworkActive ? "Désactiver dark-gpt cowork" : "Activer dark-gpt cowork"}</span>
            </button>
          )}

          {/* Active Model Indicator with auto-status */}
          <button
            type="button"
            onClick={() => setShowOllamaModal(true)}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-black/70 border rounded text-[11px] transition-all cursor-pointer ${
              ollamaOnline
                ? 'border-emerald-500/80 text-emerald-400 hover:border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                : isGreen
                  ? 'border-emerald-900/80 text-neutral-300 hover:border-emerald-500'
                  : 'border-red-900/80 text-neutral-300 hover:border-red-500'
            }`}
            title="Cliquez pour configurer ou installer Ollama & Dolphin 3"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${ollamaOnline ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`}></span>
            <span className="text-neutral-500">MOTEUR :</span>
            <span className={ollamaOnline ? 'text-emerald-400 font-bold' : isGreen ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
              {ollamaOnline ? '🐬 DOLPHIN 3 (ONLINE)' : activeModel}
            </span>
            <span className="text-[10px] text-neutral-400 bg-neutral-900 px-1 py-0.2 rounded border border-neutral-700">config</span>
          </button>

          {/* Mac Files Authorization Button */}
          <button
            type="button"
            onClick={() => setShowMacModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 bg-black/70 border rounded text-[11px] text-neutral-300 transition-all cursor-pointer ${
              isGreen 
                ? 'border-neutral-700 hover:border-emerald-500 hover:shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                : 'border-neutral-700 hover:border-red-500 hover:shadow-[0_0_8px_rgba(220,38,38,0.3)]'
            }`}
            title="Autoriser et inspecter des fichiers ou dossiers de votre Mac"
          >
            <HardDrive className={`w-3.5 h-3.5 ${isGreen ? 'text-emerald-400' : 'text-red-400'}`} />
            <span className="hidden md:inline">FICHIERS MAC</span>
            <span className="md:hidden">MAC</span>
          </button>

          {streamingMsgId && (
            <button
              onClick={finishStreaming}
              className={`flex items-center gap-1 px-2 py-0.5 text-[11px] rounded transition-all animate-pulse border ${
                isGreen 
                  ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border-emerald-500' 
                  : 'bg-red-900/60 hover:bg-red-800 text-red-200 border-red-500'
              }`}
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
            className={`p-1.5 text-neutral-300 hover:text-white border border-transparent rounded transition-all ${
              isGreen ? 'hover:bg-emerald-600/20 hover:border-emerald-600' : 'hover:bg-red-600/20 hover:border-red-600'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            id="chat-clear-button"
            onClick={handleClearHistory}
            title="Effacer la mémoire"
            className={`p-1.5 text-neutral-300 border border-transparent rounded transition-all ${
              isGreen 
                ? 'hover:text-emerald-400 hover:bg-emerald-600/20 hover:border-emerald-600' 
                : 'hover:text-red-400 hover:bg-red-600/20 hover:border-red-600'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Autonomous Agent Dynamic Tools Bar */}
      <div className={`bg-neutral-950 border-b px-3 py-1.5 flex items-center gap-2 overflow-x-auto text-[11px] select-none ${
        isGreen ? 'border-emerald-900/60' : 'border-red-900/60'
      }`}>
        <span className="text-emerald-400 flex items-center gap-1 font-bold whitespace-nowrap">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>OUTILS AUTO-DÉCLENCHÉS :</span>
        </span>

        {/* Dynamic Tool Badges */}
        <span className="px-2 py-0.5 border border-neutral-800 bg-black text-neutral-300 rounded-sm flex items-center gap-1 whitespace-nowrap">
          <Globe className="w-2.5 h-2.5 text-blue-400" />
          <span>Recherche Web</span>
        </span>

        <span className="px-2 py-0.5 border border-neutral-800 bg-black text-neutral-300 rounded-sm flex items-center gap-1 whitespace-nowrap">
          <FolderOpen className="w-2.5 h-2.5 text-amber-400" />
          <span>Dossier Partagé</span>
        </span>

        <span className="px-2 py-0.5 border border-neutral-800 bg-black text-neutral-300 rounded-sm flex items-center gap-1 whitespace-nowrap">
          <FileCode className="w-2.5 h-2.5 text-emerald-400" />
          <span>Sandbox Code</span>
        </span>

        <span className="px-2 py-0.5 border border-neutral-800 bg-black text-neutral-300 rounded-sm flex items-center gap-1 whitespace-nowrap">
          <Cpu className="w-2.5 h-2.5 text-purple-400" />
          <span>Raisonnement Pas-à-Pas</span>
        </span>

        {/* Typewriter Speed Selector */}
        <div className="ml-auto flex items-center gap-1.5 pl-2 border-l border-neutral-800 text-[11px] whitespace-nowrap">
          <Gauge className={`w-3 h-3 ${isGreen ? 'text-emerald-400' : 'text-red-400'}`} />
          <span className="text-neutral-400">Vitesse :</span>
          <button
            type="button"
            onClick={() => setTypingSpeed('slow')}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              typingSpeed === 'slow' 
                ? isGreen 
                  ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-600 shadow-[0_0_6px_rgba(16,185,129,0.4)]' 
                  : 'bg-red-950 text-red-300 font-bold border border-red-600 shadow-[0_0_6px_rgba(220,38,38,0.4)]' 
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
                ? isGreen 
                  ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-600 shadow-[0_0_6px_rgba(16,185,129,0.4)]' 
                  : 'bg-red-950 text-red-300 font-bold border border-red-600 shadow-[0_0_6px_rgba(220,38,38,0.4)]' 
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
                ? isGreen 
                  ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-600 shadow-[0_0_6px_rgba(16,185,129,0.4)]' 
                  : 'bg-red-950 text-red-300 font-bold border border-red-600 shadow-[0_0_6px_rgba(220,38,38,0.4)]' 
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
          <div className={`border p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded ${
            isGreen 
              ? 'border-emerald-700/80 bg-emerald-950/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
              : 'border-red-700/80 bg-red-950/40 shadow-[0_0_15px_rgba(220,38,38,0.15)]'
          }`}>
            <div className="space-y-0.5">
              <div className={`flex items-center gap-1.5 font-bold text-xs ${isGreen ? 'text-emerald-400' : 'text-red-400'}`}>
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
                className={`px-3 py-1.5 font-bold rounded text-xs flex items-center gap-1.5 transition-all border ${
                  isGreen 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-black border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                    : 'bg-red-900 hover:bg-red-800 text-white border-red-500 shadow-[0_0_8px_rgba(220,38,38,0.3)]'
                }`}
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

        <div className={`border p-3 text-neutral-300 text-xs leading-relaxed space-y-1 ${
          isGreen ? 'border-emerald-900/60 bg-emerald-950/10' : 'border-red-900/60 bg-red-950/10'
        }`}>
          <div className={`font-bold ${isGreen ? 'text-emerald-400' : 'text-red-500'}`}>
            {isGreen ? '[🛡️] SYSTÈME IA SÉCURISÉ // MODE DÉFENSE ACTIF' : '[!] SYSTÈME IA NON CENSURÉ // DARK-GPT v1.1.0'}
          </div>
          <div>Créé par <span className="text-white font-bold">M4TH4CK3R</span>. Analyse offensive/défensive approfondie, scripts et génération documentaire à la demande.</div>
          <div className="text-neutral-500 text-[11px]">Astuce : Appuyez sur <span className="text-white font-bold">Entrée</span> pour accélérer immédiatement la rédaction machine à écrire.</div>
        </div>

        {/* History consultation prompt if not confirmed yet */}
        {!showHistoryMessages && messages.length > 0 && (
          <div className="border border-red-700/80 bg-red-950/40 p-4 rounded text-center space-y-3 shadow-lg my-3">
            <div className="text-white font-bold text-sm flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-red-500" />
              <span>{t.historyPromptTitle}</span>
              <span className="bg-red-900/60 border border-red-700 text-red-200 text-[11px] px-2 py-0.5 rounded font-mono">
                {messages.length} {t.historyCount}
              </span>
            </div>
            <p className="text-xs text-neutral-300 max-w-md mx-auto">
              {t.historyPromptSub}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowHistoryMessages(true)}
                className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white font-bold rounded text-xs border border-red-500 cursor-pointer transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)] flex items-center gap-2"
              >
                <span>{t.historyPromptYes}</span>
                <span className="text-[10px] opacity-80 font-mono">({messages.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  onUpdateSession({ ...session, messages: [] });
                  setShowHistoryMessages(true);
                }}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold rounded text-xs border border-neutral-700 cursor-pointer transition-all flex items-center gap-2"
              >
                <span>{t.historyPromptNo}</span>
              </button>
            </div>
          </div>
        )}

        {showHistoryMessages && messages.map((msg, idx) => {
          const isStreamingThis = streamingMsgId === msg.id;
          const displayContent = isStreamingThis ? msg.content.slice(0, streamedLength) : msg.content;
          const showDocs = shouldShowExportOptions(idx, msg);
          const messageKey = msg.id ? `${msg.id}-${idx}` : `msg-${idx}`;

          return (
            <div key={messageKey} className="space-y-2">
              {msg.role === 'user' ? (
                <div className="flex items-start gap-2 bg-neutral-950/50 p-2 border-l-2 border-neutral-600">
                  <span className="text-white font-bold select-none whitespace-nowrap">VOUS &gt;</span>
                  <span className="text-white whitespace-pre-wrap flex-1">{msg.content}</span>
                </div>
              ) : msg.role === 'assistant' ? (
                <div className="space-y-2 bg-black border border-neutral-900 p-3 rounded-sm">
                  {/* Assistant Message Header with Thinking Timer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2">
                    <div className={`${isGreen ? 'text-emerald-400' : 'text-red-500'} font-bold flex items-center gap-1.5 select-none`}>
                      <span>{isGreen ? '[🛡️] DARK-GPT >' : '[x_x] DARK-GPT >'}</span>
                      {isStreamingThis && (
                        <span className="text-[11px] text-neutral-400 font-normal animate-pulse">
                          (rédaction en cours... [Entrée pour passer])
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Export button only when content is substantial or has code/tables */}
                      {(msg.content?.includes('```') || msg.content?.includes('|') || (msg.content?.length || 0) > 250) && (
                        <button
                          onClick={() => toggleExportMenu(msg.id)}
                          className={`px-2 py-0.5 border text-[11px] rounded transition-colors flex items-center gap-1 ${
                            showDocs
                              ? 'bg-neutral-800 border-neutral-600 text-white'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                          }`}
                          title="Options d'exportation de documents (PDF/Excel/Word)"
                        >
                          <FileText className={`w-3 h-3 ${isGreen ? 'text-emerald-400' : 'text-red-500'}`} />
                          <span>Exporter</span>
                        </button>
                      )}

                      {/* Reasoning Time Badge */}
                      {msg.reasoningTime && (
                        <button
                          onClick={() => toggleReasoning(msg.id)}
                          className="flex items-center gap-1 px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 rounded text-[11px] transition-colors"
                          title="Cliquez pour voir les étapes de raisonnement"
                        >
                          <Clock className={`w-3 h-3 ${isGreen ? 'text-emerald-400' : 'text-red-400'}`} />
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
                      <span className={`inline-block w-2 h-4 ml-0.5 animate-pulse align-middle ${isGreen ? 'bg-emerald-400' : 'bg-red-500'}`} />
                    )}
                  </div>

                  {/* Agent Loop Execution Plan (Specification D) */}
                  {msg.agentLoop && !isStreamingThis && (
                    <div className="bg-neutral-950 border border-neutral-800 p-2.5 rounded text-[11px] font-mono space-y-1.5 mt-2">
                      <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>BOUCLE AGENTIQUE // PLANIFICATION & EXÉCUTION</span>
                      </div>
                      <div className="text-neutral-300">
                        <span className="text-neutral-500">OBJECTIF : </span>
                        <span className="font-semibold text-neutral-200">{msg.agentLoop.objective}</span>
                      </div>
                      <div className="space-y-0.5 pt-1">
                        <div className="text-neutral-500 font-bold">SOUS-ÉTAPES :</div>
                        {msg.agentLoop.steps.map((st, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-1.5 pl-2 text-neutral-300">
                            <span className="text-emerald-500 font-bold">{sIdx + 1}.</span>
                            <span>{st}</span>
                          </div>
                        ))}
                      </div>
                      {msg.agentLoop.executedTools && msg.agentLoop.executedTools.length > 0 && (
                        <div className="pt-1 flex items-center gap-1 flex-wrap">
                          <span className="text-neutral-500">OUTILS ACTIFS :</span>
                          {msg.agentLoop.executedTools.map((tId, tIdx) => (
                            <span key={tIdx} className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-700 text-emerald-300 rounded text-[10px]">
                              {tId === 'web_search' ? '🌐 Recherche Web' : tId === 'file_io' ? '📂 Fichiers partagés' : '⚡ Bac à sable Code'}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-[10px] text-neutral-400 pt-1 border-t border-neutral-900 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>{msg.agentLoop.verification}</span>
                      </div>
                    </div>
                  )}

                  {/* Risky Action Confirmation Card (Specification D) */}
                  {msg.requiresConfirmation && !isStreamingThis && (
                    <div className="mt-3 p-3 bg-red-950/60 border-2 border-red-600 rounded space-y-2.5 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                      <div className="flex items-center gap-2 text-red-400 font-bold text-xs sm:text-sm">
                        <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" />
                        <span>ACTION SENSIBLE DÉTECTÉE // VALIDATION OBLIGATOIRE</span>
                      </div>
                      <p className="text-xs text-neutral-200 leading-relaxed">
                        {msg.riskDetails || "Cette opération modifie ou supprime définitivement des éléments dans le dossier partagé."}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleConfirmAction(msg)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirmer et exécuter</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelAction(msg)}
                          className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded text-xs border border-neutral-700 transition-colors cursor-pointer"
                        >
                          <span>Annuler l'action</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Web Search Sources if available */}
                  {msg.sources && msg.sources.length > 0 && !isStreamingThis && (
                    <div className="mt-2 pt-2 border-t border-neutral-900 space-y-1">
                      <div className="text-neutral-400 text-[11px] font-bold flex items-center gap-1">
                        <Globe className={`w-3 h-3 ${isGreen ? 'text-emerald-400' : 'text-red-500'}`} />
                        SOURCES & VÉRIFICATIONS WEB :
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {msg.sources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center justify-between p-1.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 rounded transition-colors group ${
                              isGreen ? 'hover:text-emerald-400' : 'hover:text-red-400'
                            }`}
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
                            className={`flex items-center gap-1 px-2 py-0.5 bg-black border border-neutral-800 text-neutral-300 hover:text-white rounded transition-all ${
                              isGreen ? 'hover:bg-emerald-950/60 hover:border-emerald-600' : 'hover:bg-red-950/60 hover:border-red-600'
                            }`}
                            title="Télécharger en document PDF"
                          >
                            <FileText className={`w-3 h-3 ${isGreen ? 'text-emerald-400' : 'text-red-500'}`} />
                            <span>PDF</span>
                          </button>

                          <button
                            onClick={() => exportToExcel(`analyse_${Date.now()}`, 'Export Excel', msg.content)}
                            className={`flex items-center gap-1 px-2 py-0.5 bg-black border border-neutral-800 text-neutral-300 hover:text-white rounded transition-all ${
                              isGreen ? 'hover:bg-emerald-950/60 hover:border-emerald-600' : 'hover:bg-red-950/60 hover:border-red-600'
                            }`}
                            title="Télécharger en tableur Excel (.xlsx)"
                          >
                            <Table className="w-3 h-3 text-emerald-500" />
                            <span>EXCEL</span>
                          </button>

                          <button
                            onClick={() => exportToDocx(`document_${Date.now()}`, 'Document DARK-GPT', msg.content)}
                            className={`flex items-center gap-1 px-2 py-0.5 bg-black border border-neutral-800 text-neutral-300 hover:text-white rounded transition-all ${
                              isGreen ? 'hover:bg-emerald-950/60 hover:border-emerald-600' : 'hover:bg-red-950/60 hover:border-red-600'
                            }`}
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
                          className={`flex items-center gap-1 px-2 py-1 bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white rounded transition-all ${
                            isGreen ? 'hover:bg-emerald-950/60 hover:border-emerald-600' : 'hover:bg-red-950/60 hover:border-red-600'
                          }`}
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
          <div className={`bg-neutral-950/80 border p-3 rounded space-y-1.5 animate-pulse ${
            isGreen ? 'border-emerald-900/60' : 'border-red-900/60'
          }`}>
            <div className={`flex items-center gap-2 font-bold text-xs sm:text-sm ${
              isGreen ? 'text-emerald-400' : 'text-red-500'
            }`}>
              <Clock className={`w-4 h-4 animate-spin ${isGreen ? 'text-emerald-400' : 'text-red-500'}`} />
              <span>{isGreen ? '[🛡️] DARK-GPT analyse' : '[x_x] DARK-GPT réfléchit'} ({elapsedTime.toFixed(1)}s) {spinnerText}</span>
            </div>
            <div className="text-neutral-400 text-[11px] pl-6 font-mono">
              &gt; Évaluation des vecteurs techniques, analyse mémoire et synthèse...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Terminal Command Input */}
      <form
        onSubmit={handleSend}
        className={`border-t bg-black p-3 flex items-center gap-2 ${
          isGreen ? 'border-emerald-600' : 'border-red-600'
        }`}
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
          type="button"
          onClick={() => setShowMacModal(true)}
          className={`p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 rounded transition-all cursor-pointer ${
            isGreen ? 'hover:border-emerald-600' : 'hover:border-red-600'
          }`}
          title="Ouvrir l'accès aux fichiers de votre Mac"
        >
          <FolderOpen className={`w-4 h-4 ${isGreen ? 'text-emerald-400' : 'text-red-500'}`} />
        </button>
        <button
          id="terminal-chat-send-btn"
          type="submit"
          disabled={loading || (!input.trim() && !streamingMsgId)}
          className={`px-3.5 py-1.5 border text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 ${
            isGreen
              ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-black shadow-[0_0_8px_rgba(16,185,129,0.3)]'
              : 'bg-red-950/60 border-red-600 hover:bg-red-600 text-white'
          }`}
        >
          {streamingMsgId ? (
            <>
              <FastForward className="w-3.5 h-3.5 text-current" />
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

      {/* Mac File System Authorization & Explorer Modal */}
      <MacFileAccessModal
        isOpen={showMacModal}
        onClose={() => setShowMacModal(false)}
        onInjectFileToChat={(file) => {
          setInput(`[FICHIER MAC : ${file.name}]\nChemin : ${file.path}\n\n\`\`\`\n${file.content}\n\`\`\`\n\nPeux-tu analyser ce fichier en détail, vérifier sa sécurité et optimiser son code ?`);
          inputRef.current?.focus();
        }}
      />
    </div>
  );
};
