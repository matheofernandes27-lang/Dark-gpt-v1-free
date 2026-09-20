import React from 'react';
import { Shield, ArrowRight, MessageSquare, PlusCircle, Globe, Terminal, Layout, RotateCcw, Info, Cpu, Sparkles } from 'lucide-react';
import { Language, translations } from '../utils/i18n.ts';

interface DualModeSelectorProps {
  currentLang: Language;
  onSelectLang: (lang: Language) => void;
  onSelectMode: (mode: 'defense' | 'hacker') => void;
  hasHistory: boolean;
  historyCount: number;
  onConsultHistory: () => void;
  onNewSession: () => void;
  onShowGlossaryModal?: () => void;
}

export const DualModeSelector: React.FC<DualModeSelectorProps> = ({
  currentLang,
  onSelectLang,
  onSelectMode,
  hasHistory,
  historyCount,
  onConsultHistory,
  onNewSession
}) => {
  const t = translations[currentLang];

  return (
    <div id="dual-mode-welcome-container" className="w-full max-w-5xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-center space-y-6 animate-fade-in select-none">
      
      {/* 1. Header Bar: Language Dropdown Selector + Terminal Mode Glossary Badges */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-neutral-950 border border-neutral-800 p-3.5 rounded shadow-lg">
        {/* Language Selector Dropdown (Specification B) */}
        <div className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-red-500 shrink-0" />
          <label htmlFor="language-dropdown-select" className="text-xs text-neutral-300 font-bold uppercase tracking-wider">
            {t.languageLabel}
          </label>
          <select
            id="language-dropdown-select"
            value={currentLang}
            onChange={(e) => onSelectLang(e.target.value as Language)}
            className="bg-black text-white text-xs border border-neutral-700 hover:border-red-500 rounded px-2.5 py-1.5 font-bold cursor-pointer transition-colors focus:outline-none focus:border-red-500"
          >
            <option value="fr">🇫🇷 Français (FR)</option>
            <option value="en">🇬🇧 English (EN)</option>
            <option value="es">🇪🇸 Español (ES)</option>
          </select>
        </div>

        {/* Quick Terms Explanation Badges */}
        <div className="flex items-center gap-2 text-[11px] text-neutral-400">
          <span className="hidden sm:inline text-neutral-500">Modes :</span>
          <span className="border border-neutral-800 bg-black px-2 py-0.5 rounded text-neutral-300 font-mono" title={t.cliDesc}>CLI = Terminal</span>
          <span className="border border-neutral-800 bg-black px-2 py-0.5 rounded text-neutral-300 font-mono" title={t.guiDesc}>GUI = Graphique</span>
          <span className="border border-neutral-800 bg-black px-2 py-0.5 rounded text-neutral-300 font-mono" title={t.replayDesc}>REPLAY = Boot</span>
        </div>
      </div>

      {/* 2. History Consultation Prompt Card (Specification B: no automatic history, clear button) */}
      <div className="w-full bg-neutral-950 border border-neutral-800 p-4 sm:p-5 rounded-lg shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <MessageSquare className="w-4 h-4 text-red-500" />
            <span>{t.historyPromptTitle}</span>
            {hasHistory && (
              <span className="text-xs bg-red-950/80 border border-red-800 text-red-300 px-2 py-0.5 rounded font-mono">
                {historyCount} {t.historyCount}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400">
            {hasHistory ? t.historyPromptSub : "Aucune session précédente active. Choisissez votre mode pour démarrer immédiatement."}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0">
          {hasHistory && (
            <button
              id="consult-history-btn"
              type="button"
              onClick={onConsultHistory}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold border border-neutral-600 hover:border-white rounded transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <MessageSquare className="w-3.5 h-3.5 text-red-400" />
              <span>{t.viewHistoryBtn}</span>
            </button>
          )}
          <button
            id="start-clean-session-btn"
            type="button"
            onClick={onNewSession}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-red-950/80 hover:bg-red-900 text-red-200 text-xs font-bold border border-red-700 hover:border-red-500 rounded transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <PlusCircle className="w-3.5 h-3.5 text-red-300" />
            <span>{t.historyPromptNo}</span>
          </button>
        </div>
      </div>

      {/* 3. Section Title */}
      <div className="w-full text-center space-y-1 pt-2">
        <h2 className="text-lg sm:text-xl font-black tracking-widest text-white uppercase flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-red-500" />
          <span>{t.dualTitle}</span>
          <Sparkles className="w-4 h-4 text-red-500" />
        </h2>
        <p className="text-xs text-neutral-400">
          {t.dualSubtitle}
        </p>
      </div>

      {/* 4. Dual Mode Split Cards: Left Green Assistance Générale vs Right Red Apprentissage Technique Avancé (Specification C) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT ZONE: VERT / NOIR - ASSISTANCE GÉNÉRALE */}
        <div 
          id="mode-general-assistance-card"
          onClick={() => onSelectMode('defense')}
          className="group relative bg-black border-2 border-emerald-600/80 hover:border-emerald-400 rounded-lg p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_35px_rgba(16,185,129,0.35)] hover:-translate-y-1"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-lg text-emerald-400">
                <Shield className="w-8 h-8 text-emerald-400" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded">
                THÈME VERT / NOIR
              </span>
            </div>

            <div>
              <h3 className="text-emerald-400 font-black text-xl tracking-wide uppercase group-hover:text-emerald-300 transition-colors">
                {t.generalTitle}
              </h3>
              <p className="text-emerald-200 font-bold text-xs mt-1">
                "{t.generalQuestion}"
              </p>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed font-sans">
              {t.generalDesc}
            </p>

            <ul className="space-y-1.5 text-xs text-emerald-400/90 font-mono pt-2">
              <li className="flex items-center gap-2">✓ Réponses claires en langage naturel, sans code superflu</li>
              <li className="flex items-center gap-2">✓ Sécurisation défensive, durcissement et administration système</li>
              <li className="flex items-center gap-2">✓ Outils agentiques automatiques sur dossier partagé</li>
            </ul>
          </div>

          <div className="pt-6 mt-6 border-t border-emerald-900/60">
            <button
              type="button"
              className="w-full py-3 bg-emerald-950 hover:bg-emerald-900 group-hover:bg-emerald-800 text-emerald-200 font-bold border border-emerald-500 rounded flex items-center justify-center gap-2 text-xs tracking-wider uppercase transition-all shadow-md"
            >
              <span>{t.generalBtn}</span>
              <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* RIGHT ZONE: ROUGE / NOIR AVEC IMAGE PNG/SVG HAUTE DÉFINITION - APPRENTISSAGE TECHNIQUE AVANCÉ */}
        <div 
          id="mode-advanced-learning-card"
          onClick={() => onSelectMode('hacker')}
          className="group relative bg-black border-2 border-red-700 hover:border-red-500 rounded-lg p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 cursor-pointer hover:-translate-y-1"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative p-2.5 bg-red-950/60 border border-red-800 rounded-lg flex items-center justify-center">
                <Terminal className="w-9 h-9 text-red-500 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 bg-red-950 border border-red-700 text-red-300 rounded">
                THÈME ROUGE / NOIR
              </span>
            </div>

            <div>
              <h3 className="text-red-500 font-black text-xl tracking-wide uppercase group-hover:text-red-400 transition-colors">
                {t.advancedTitle}
              </h3>
              <p className="text-red-300 font-bold text-xs mt-1">
                "{t.advancedQuestion}"
              </p>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed font-sans">
              {t.advancedDesc}
            </p>

            <ul className="space-y-1.5 text-xs text-red-400 font-mono pt-2">
              <li className="flex items-center gap-2">› Développement, scripts et automatisation avancée</li>
              <li className="flex items-center gap-2">› Cowork : accès à tes fichiers (avec validation)</li>
              <li className="flex items-center gap-2">› Exécution en bac à sable sécurisé</li>
            </ul>
          </div>

          <div className="pt-6 mt-6 border-t border-red-900/60">
            <button
              type="button"
              className="w-full py-3 bg-red-900 hover:bg-red-800 group-hover:bg-red-700 text-white font-bold border border-red-700 rounded flex items-center justify-center gap-2 text-xs tracking-wider uppercase transition-all"
            >
              <span>{t.advancedBtn}</span>
              <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

      </div>

      {/* 5. Glossary Footer Panel */}
      <div className="w-full bg-black border border-neutral-800 p-4 rounded text-xs space-y-2">
        <div className="flex items-center gap-2 text-neutral-300 font-bold uppercase tracking-wider">
          <Info className="w-4 h-4 text-red-500" />
          <span>{t.glossaryTitle}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-neutral-400 text-[11px] leading-relaxed">
          <div className="p-2.5 bg-neutral-950 border border-neutral-900 rounded">
            <div className="flex items-center gap-1.5 text-white font-bold mb-1">
              <Terminal className="w-3.5 h-3.5 text-red-400" />
              <span>CLI (Command-Line Interface)</span>
            </div>
            <p>{t.cliDesc}</p>
          </div>
          <div className="p-2.5 bg-neutral-950 border border-neutral-900 rounded">
            <div className="flex items-center gap-1.5 text-white font-bold mb-1">
              <Layout className="w-3.5 h-3.5 text-red-400" />
              <span>GUI (Graphical User Interface)</span>
            </div>
            <p>{t.guiDesc}</p>
          </div>
          <div className="p-2.5 bg-neutral-950 border border-neutral-900 rounded">
            <div className="flex items-center gap-1.5 text-white font-bold mb-1">
              <RotateCcw className="w-3.5 h-3.5 text-red-400" />
              <span>REPLAY (Amorçage)</span>
            </div>
            <p>{t.replayDesc}</p>
          </div>
        </div>
      </div>

    </div>
  );
};
