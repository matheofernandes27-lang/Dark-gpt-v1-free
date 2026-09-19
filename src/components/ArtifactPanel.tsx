import React, { useState, useEffect } from 'react';
import { Eye, FileCode, X, Copy, Check } from 'lucide-react';
import { Artifact } from '../types.ts';

interface ArtifactPanelProps {
  artifact: Artifact | null;
  onClose: () => void;
  activeMode?: 'defense' | 'hacker';
}

/**
 * Panneau Artifact — la moitié droite de la double interface (façon Claude).
 * Affiche le code généré par l'assistant avec deux onglets : Aperçu (rendu HTML
 * dans une iframe sandbox) et Code (source brut). Purement visuel, aucune
 * exécution sur la machine.
 */
export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({ artifact, onClose, activeMode = 'hacker' }) => {
  const isGreen = activeMode === 'defense';
  const activeTabClass = isGreen ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white';
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // À chaque nouvel artifact, on revient sur l'aperçu si c'est du HTML.
    const lang = (artifact?.language || '').toLowerCase();
    setActiveTab(lang.includes('html') || lang === '' ? 'preview' : 'code');
  }, [artifact?.id]);

  if (!artifact || !artifact.isOpen) return null;

  const lang = (artifact.language || '').toLowerCase();
  const isRenderable = lang.includes('html') || artifact.code.trim().startsWith('<');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard indisponible : on ignore proprement */
    }
  };

  return (
    <div
      className={`h-full flex flex-col border-l bg-black/95 transition-all duration-300 ${
        isGreen ? 'border-emerald-900/70' : 'border-red-900/70'
      }`}
    >
      {/* En-tête */}
      <div
        className={`px-3 py-2 border-b flex items-center justify-between shrink-0 ${
          isGreen ? 'border-emerald-900/70' : 'border-red-900/70'
        }`}
      >
        <h2 className="font-bold text-[11px] tracking-widest uppercase text-neutral-300 truncate max-w-[45%]">
          {artifact.title || 'Artifact'}
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('preview')}
            disabled={!isRenderable}
            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 disabled:opacity-30 ${
              activeTab === 'preview'
                ? activeTabClass
                : 'border border-neutral-700 text-neutral-400 hover:text-white'
            }`}
          >
            <Eye className="w-3 h-3" /> Aperçu
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
              activeTab === 'code'
                ? activeTabClass
                : 'border border-neutral-700 text-neutral-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3 h-3" /> Code
          </button>
          <button
            onClick={handleCopy}
            title="Copier le code"
            className="px-1.5 py-1 rounded text-neutral-500 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            title="Fermer le panneau"
            className="px-1.5 py-1 rounded text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-auto p-3">
        {activeTab === 'preview' && isRenderable ? (
          <div className="w-full h-full bg-white rounded-lg overflow-hidden border border-neutral-800">
            <iframe
              title="Aperçu Artifact"
              srcDoc={artifact.code}
              className="w-full h-full border-none"
              sandbox="allow-scripts allow-modals"
            />
          </div>
        ) : (
          <pre className="text-[11px] leading-relaxed font-mono text-neutral-200 whitespace-pre-wrap break-words">
            <code>{artifact.code}</code>
          </pre>
        )}
      </div>

      {/* Pied : rappel that c'est un aperçu, pas une exécution machine */}
      <div
        className={`px-3 py-1.5 border-t text-[9px] uppercase tracking-widest text-neutral-600 shrink-0 ${
          isGreen ? 'border-emerald-900/70' : 'border-red-900/70'
        }`}
      >
        Aperçu local · aucune action sur votre Mac
      </div>
    </div>
  );
};
