import React, { useState, useEffect, useRef } from 'react';
import { AppView, Session } from './types.ts';
import { StartupAnimation } from './components/StartupAnimation.tsx';
import { AsciiBanner } from './components/AsciiBanner.tsx';
import { TerminalChat } from './components/TerminalChat.tsx';
import { ProjectManager } from './components/ProjectManager.tsx';
import { SessionManager } from './components/SessionManager.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { UpdatesView } from './components/UpdatesView.tsx';
import { OllamaInstallerModal } from './components/OllamaInstallerModal.tsx';
import { 
  MessageSquare, 
  FolderPlus, 
  ListOrdered, 
  FileEdit, 
  Trash2, 
  Play, 
  Sliders, 
  FileCode2, 
  Cpu, 
  RotateCcw, 
  RefreshCw, 
  Layers, 
  Terminal,
  Shield,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('startup');
  const [activeSession, setActiveSession] = useState<Session>({
    id: 'default',
    title: 'Session par défaut',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    messages: []
  });
  const [menuInput, setMenuInput] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [viewMode, setViewMode] = useState<'terminal' | 'dashboard'>('terminal');
  const [showOllamaModal, setShowOllamaModal] = useState<boolean>(false);

  const menuInputRef = useRef<HTMLInputElement>(null);

  // Load default session on boot
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/sessions/default');
        if (res.ok) {
          const data = await res.json();
          setActiveSession(data);
        }
      } catch (e) {
        console.warn("Could not load default session:", e);
      }
    };
    fetchSession();
  }, []);

  // Autofocus menu input when back at menu
  useEffect(() => {
    if (currentView === 'menu') {
      setTimeout(() => menuInputRef.current?.focus(), 100);
    }
  }, [currentView]);

  const handleSelectSession = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data);
        setCurrentView('chat');
      }
    } catch (e) {
      console.warn("Error switching session:", e);
    }
  };

  const handleMenuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const choice = menuInput.trim().toLowerCase();
    setMenuInput('');

    switch (choice) {
      case '1':
      case 'chat':
        setCurrentView('chat');
        break;
      case '2':
      case 'create':
      case 'create project':
        setCurrentView('create_project');
        break;
      case '3':
      case 'list':
      case 'list projects':
        setCurrentView('projects');
        break;
      case '4':
      case 'edit':
      case 'edit project':
        setCurrentView('edit_project');
        break;
      case '5':
      case 'delete':
      case 'delete project':
        setCurrentView('projects');
        break;
      case '6':
      case 'run':
      case 'run project':
        setCurrentView('run_project');
        break;
      case '7':
      case 'api':
      case 'provider':
      case 'settings':
        setCurrentView('settings');
        break;
      case '8':
      case 'system':
      case 'instructions':
        setCurrentView('settings');
        break;
      case '9':
      case 'model':
        setCurrentView('settings');
        break;
      case '10':
      case 'reset':
        if (confirm('Reset settings to default?')) {
          fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'llama3.2',
              server_url: 'http://127.0.0.1:11434'
            })
          });
          setFeedback('Settings reset to defaults.');
          setTimeout(() => setFeedback(''), 2500);
        }
        break;
      case '11':
      case 'update':
      case 'updates':
        setCurrentView('updates');
        break;
      case '12':
      case 'session':
      case 'sessions':
        setCurrentView('sessions');
        break;
      case '13':
      case 'dolphin':
      case 'dolphin3':
      case 'ollama':
      case 'installer':
        setShowOllamaModal(true);
        break;
      case '0':
      case 'exit':
      case 'quit':
        setFeedback('DARK-GPT session preserved. Terminal ready.');
        setTimeout(() => setFeedback(''), 3000);
        break;
      case 'replay':
        setCurrentView('startup');
        break;
      default:
        setFeedback(`Invalid command: "${choice}". Choose an option from 1 to 12, or 0.`);
        setTimeout(() => setFeedback(''), 3000);
        break;
    }
  };

  return (
    <div id="dark-gpt-app" className="relative w-screen h-screen bg-black text-white font-mono flex flex-col overflow-hidden selection:bg-red-600 selection:text-white">
      {/* Scanline FX Overlay */}
      <div className="terminal-scanlines absolute inset-0 z-40 pointer-events-none opacity-30" />

      {/* 1. Startup Sequence Animation */}
      {currentView === 'startup' && (
        <StartupAnimation onComplete={() => setCurrentView('menu')} />
      )}

      {/* Top Global Status Header Bar */}
      <header className="border-b border-red-600 bg-black/95 px-4 py-2 flex items-center justify-between z-30 shrink-0 select-none">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 text-red-600 font-black tracking-widest text-sm sm:text-base glow-red">
            <span>[x_x]</span>
            <span>DARK-GPT</span>
          </div>
          <span className="text-[10px] text-neutral-400 border border-red-900 bg-red-950/30 px-1.5 py-0.5 hidden sm:inline">
            BY M4TH4CK3R
          </span>
          <span className="text-[10px] text-red-500 font-semibold border border-red-900/60 px-1.5 py-0.5">
            OLLAMA & GEMINI READY
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Active Session Indicator */}
          <button
            onClick={() => setCurrentView('sessions')}
            className="text-[11px] text-neutral-300 hover:text-white flex items-center gap-1.5 px-2 py-0.5 border border-neutral-800 hover:border-red-600 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            <span className="truncate max-w-[120px] sm:max-w-[180px]">{activeSession.title}</span>
          </button>

          {/* Dolphin 3 Fast Config & Auto-launcher */}
          <button
            onClick={() => setShowOllamaModal(true)}
            className="text-[11px] text-red-400 hover:text-white font-bold border border-red-800 hover:border-red-500 bg-red-950/50 hover:bg-red-900/60 px-2 py-0.5 flex items-center gap-1.5 transition-colors"
            title="Assistant et installateur Dolphin 3 (mode sans droits admin)"
          >
            <Cpu className="w-3 h-3 text-red-400" />
            <span>DOLPHIN 3</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex border border-red-900/80 text-[10px]">
            <button
              onClick={() => setViewMode('terminal')}
              className={`px-2 py-0.5 transition-colors ${viewMode === 'terminal' ? 'bg-red-950 text-white font-bold border-r border-red-600' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              CLI
            </button>
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-2 py-0.5 transition-colors ${viewMode === 'dashboard' ? 'bg-red-950 text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              GUI
            </button>
          </div>

          <button
            onClick={() => setCurrentView('startup')}
            title="Rejouer l'animation de démarrage"
            className="text-[10px] text-neutral-500 hover:text-red-500 px-1.5 py-0.5"
          >
            REPLAY
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative z-10 flex flex-col p-2 sm:p-4">
        {currentView === 'chat' ? (
          <TerminalChat
            session={activeSession}
            onUpdateSession={(updated) => setActiveSession(updated)}
            onBackToMenu={() => setCurrentView('menu')}
          />
        ) : currentView === 'projects' || currentView === 'create_project' || currentView === 'edit_project' || currentView === 'run_project' ? (
          <ProjectManager
            initialView={currentView === 'create_project' ? 'create' : currentView === 'edit_project' ? 'edit' : currentView === 'run_project' ? 'run' : 'list'}
            onBackToMenu={() => setCurrentView('menu')}
          />
        ) : currentView === 'sessions' ? (
          <SessionManager
            currentSessionId={activeSession.id}
            onSelectSession={handleSelectSession}
            onBackToMenu={() => setCurrentView('menu')}
          />
        ) : currentView === 'settings' ? (
          <SettingsModal onBackToMenu={() => setCurrentView('menu')} />
        ) : currentView === 'updates' ? (
          <UpdatesView onBackToMenu={() => setCurrentView('menu')} />
        ) : (
          /* HOME MENU / BANNER VIEW */
          <div id="main-menu-view" className="h-full flex flex-col justify-between overflow-y-auto max-w-4xl mx-auto w-full p-2 sm:p-4 space-y-4">
            {/* Banner Section */}
            <AsciiBanner />

            {/* Feedback ticker message */}
            {feedback && (
              <div className="border border-red-600 bg-red-950/50 text-red-400 p-2 text-xs font-bold text-center animate-pulse glow-box-red">
                {feedback}
              </div>
            )}

            {/* Menu Options Grid / List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Section 1: WORKSPACE */}
              <div className="border border-red-900/80 bg-black/70 p-3 space-y-2">
                <div className="text-red-500 font-bold text-xs tracking-wider border-b border-red-900/60 pb-1 flex items-center justify-between">
                  <span>WORKSPACE</span>
                  <span className="text-[10px] text-neutral-500">01-02</span>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => setCurrentView('chat')}
                    className="w-full text-left px-2 py-1.5 hover:bg-red-950/40 hover:border-red-600 border border-transparent text-xs text-neutral-200 hover:text-white flex items-center gap-2 group transition-all"
                  >
                    <span className="text-red-500 font-bold group-hover:glow-red">1.</span>
                    <MessageSquare className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-500" />
                    <span>Chat with DARK-GPT</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('create_project')}
                    className="w-full text-left px-2 py-1.5 hover:bg-red-950/40 hover:border-red-600 border border-transparent text-xs text-neutral-200 hover:text-white flex items-center gap-2 group transition-all"
                  >
                    <span className="text-red-500 font-bold group-hover:glow-red">2.</span>
                    <FolderPlus className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-500" />
                    <span>Create a project</span>
                  </button>
                </div>
              </div>

              {/* Section 2: PROJECTS */}
              <div className="border border-red-900/80 bg-black/70 p-3 space-y-2">
                <div className="text-red-500 font-bold text-xs tracking-wider border-b border-red-900/60 pb-1 flex items-center justify-between">
                  <span>PROJECTS</span>
                  <span className="text-[10px] text-neutral-500">03-06</span>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => setCurrentView('projects')}
                    className="w-full text-left px-2 py-1.5 hover:bg-red-950/40 hover:border-red-600 border border-transparent text-xs text-neutral-200 hover:text-white flex items-center gap-2 group transition-all"
                  >
                    <span className="text-red-500 font-bold group-hover:glow-red">3.</span>
                    <ListOrdered className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-500" />
                    <span>List projects</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('edit_project')}
                    className="w-full text-left px-2 py-1.5 hover:bg-red-950/40 hover:border-red-600 border border-transparent text-xs text-neutral-200 hover:text-white flex items-center gap-2 group transition-all"
                  >
                    <span className="text-red-500 font-bold group-hover:glow-red">4.</span>
                    <FileEdit className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-500" />
                    <span>Edit a project</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('projects')}
                    className="w-full text-left px-2 py-1.5 hover:bg-red-950/40 hover:border-red-600 border border-transparent text-xs text-neutral-200 hover:text-white flex items-center gap-2 group transition-all"
                  >
                    <span className="text-red-500 font-bold group-hover:glow-red">5.</span>
                    <Trash2 className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-500" />
                    <span>Delete a project</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('run_project')}
                    className="w-full text-left px-2 py-1.5 hover:bg-red-950/40 hover:border-red-600 border border-transparent text-xs text-neutral-200 hover:text-white flex items-center gap-2 group transition-all"
                  >
                    <span className="text-red-500 font-bold group-hover:glow-red">6.</span>
                    <Play className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-500" />
                    <span>Run a project</span>
                  </button>
                </div>
              </div>

              {/* Section 3: CONFIGURATION */}
              <div className="border border-red-900/80 bg-black/70 p-3 space-y-2">
                <div className="text-red-500 font-bold text-xs tracking-wider border-b border-red-900/60 pb-1 flex items-center justify-between">
                  <span>CONFIGURATION</span>
                  <span className="text-[10px] text-neutral-500">07-12</span>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => setCurrentView('settings')}
                    className="w-full text-left px-2 py-1 hover:bg-red-950/40 hover:border-red-600 border border-transparent text-xs text-neutral-200 hover:text-white flex items-center gap-2 group transition-all"
                  >
                    <span className="text-red-500 font-bold group-hover:glow-red">7.</span>
                    <Sliders className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-500" />
                    <span>API / Provider settings</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('settings')}
                    className="w-full text-left px-2 py-1 hover:bg-red-950/40 hover:border-red-600 border border-transparent text-xs text-neutral-200 hover:text-white flex items-center gap-2 group transition-all"
                  >
                    <span className="text-red-500 font-bold group-hover:glow-red">8.</span>
                    <FileCode2 className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-500" />
                    <span>Edit system instructions</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('settings')}
                    className="w-full text-left px-2 py-1 hover:bg-red-950/40 hover:border-red-600 border border-transparent text-xs text-neutral-200 hover:text-white flex items-center gap-2 group transition-all"
                  >
                    <span className="text-red-500 font-bold group-hover:glow-red">9.</span>
                    <Cpu className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-500" />
                    <span>Change model</span>
                  </button>
                  <button
                    onClick={() => handleMenuSubmit({ preventDefault: () => {} } as any)}
                    className="w-full text-left px-2 py-1 hover:bg-red-950/40 hover:border-red-600 border border-transparent text-xs text-neutral-200 hover:text-white flex items-center gap-2 group transition-all"
                  >
                    <span className="text-red-500 font-bold group-hover:glow-red">10.</span>
                    <RotateCcw className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-500" />
                    <span>Reset settings</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('updates')}
                    className="w-full text-left px-2 py-1 hover:bg-red-950/40 hover:border-red-600 border border-transparent text-xs text-neutral-200 hover:text-white flex items-center gap-2 group transition-all"
                  >
                    <span className="text-red-500 font-bold group-hover:glow-red">11.</span>
                    <RefreshCw className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-500" />
                    <span>Check for updates</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('sessions')}
                    className="w-full text-left px-2 py-1 hover:bg-red-950/40 hover:border-red-600 border border-transparent text-xs text-neutral-200 hover:text-white flex items-center gap-2 group transition-all"
                  >
                    <span className="text-red-500 font-bold group-hover:glow-red">12.</span>
                    <Layers className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-500" />
                    <span>Manage sessions</span>
                  </button>
                  <button
                    onClick={() => setShowOllamaModal(true)}
                    className="w-full text-left px-2 py-1 bg-red-950/40 hover:bg-red-950/70 hover:border-red-600 border border-red-900/60 text-xs text-red-300 hover:text-white flex items-center gap-2 group transition-all"
                  >
                    <span className="text-red-400 font-bold group-hover:glow-red">13.</span>
                    <Cpu className="w-3.5 h-3.5 text-red-400 group-hover:text-white" />
                    <span>Installer Dolphin 3 (sans admin)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Terminal Command Input Prompt */}
            <div className="border border-red-600 bg-black p-3 space-y-2 glow-box-red">
              <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                <span>Enter option number (1-13) or command:</span>
                <span className="text-red-500">0. Exit / Clear</span>
              </div>
              <form onSubmit={handleMenuSubmit} className="flex items-center gap-2">
                <span className="text-red-500 font-bold text-sm sm:text-base select-none">&gt;</span>
                <span className="text-white font-bold select-none text-xs sm:text-sm">CHOIX :</span>
                <input
                  ref={menuInputRef}
                  id="menu-command-input"
                  type="text"
                  value={menuInput}
                  onChange={(e) => setMenuInput(e.target.value)}
                  placeholder="Tapez 1, 2, chat, projects, sessions..."
                  autoComplete="off"
                  className="flex-1 bg-transparent text-white placeholder-neutral-700 text-xs sm:text-sm focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-red-950 border border-red-600 text-white text-xs font-bold hover:bg-red-600 transition-colors"
                >
                  VALIDER
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Cyber Footer Bar */}
      <footer className="border-t border-red-900/60 bg-black px-4 py-1.5 text-[10px] text-neutral-500 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="text-red-500 font-bold">DARK-GPT v1.1.0</span>
          <span>CYBERSECURITY RESEARCH & OFFENSIVE AUDIT KERNEL</span>
        </div>
        <div className="flex items-center gap-2">
          <span>CREATOR: <strong className="text-red-500">M4TH4CK3R</strong></span>
        </div>
      </footer>

      {/* Ollama & Dolphin 3 Universal Installer Modal */}
      <OllamaInstallerModal
        isOpen={showOllamaModal}
        onClose={() => setShowOllamaModal(false)}
      />
    </div>
  );
}
