import React from 'react';
import { Check, X, FilePlus, FileEdit, ImagePlus, ShieldCheck, Loader2 } from 'lucide-react';

export interface CoworkAction {
  actionId?: string;
  nonce?: string;
  tool: string;
  error?: string;
  preview?: {
    target?: string;
    content?: string;
    search?: string;
    replace?: string;
    imagePrompt?: string;
  };
  status?: 'pending' | 'running' | 'done' | 'rejected' | 'failed';
  result?: string;
  image?: string;
}

interface CoworkActionsPanelProps {
  actions: CoworkAction[];
  isLight: boolean;
  onApprove: (a: CoworkAction) => void;
  onReject: (a: CoworkAction) => void;
  onClose: () => void;
}

const toolMeta: Record<string, { label: string; icon: React.ReactNode }> = {
  write_file: { label: 'Créer / écrire un fichier', icon: <FilePlus className="w-4 h-4" /> },
  file_modify: { label: 'Modifier un fichier', icon: <FileEdit className="w-4 h-4" /> },
  image_generate: { label: 'Générer une image', icon: <ImagePlus className="w-4 h-4" /> },
};

/**
 * Panneau d'actions Cowork (moitié droite, 50/50) — façon Claude Code.
 * Affiche les actions proposées par l'agent ; l'utilisateur autorise ou refuse
 * chacune. Rien ne s'écrit sur le disque sans un clic d'autorisation.
 */
export const CoworkActionsPanel: React.FC<CoworkActionsPanelProps> = ({ actions, isLight, onApprove, onReject, onClose }) => {
  const c = isLight
    ? { bg: '#FFFFFF', text: '#1F1F1E', sub: '#6B6B68', border: '#E5E5E3', card: '#FBFBFA', code: '#F3F3F2' }
    : { bg: '#141415', text: '#E3E3E2', sub: '#9A9A98', border: '#2E2E30', card: '#1E1E1F', code: '#0E0E0F' };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: c.bg, borderLeft: `1px solid ${c.border}` }}>
      <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${c.border}` }}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" style={{ color: '#16a34a' }} />
          <span className="text-sm font-semibold" style={{ color: c.text }}>Cowork — actions à valider</span>
        </div>
        <button onClick={onClose} title="Fermer" className="p-1 rounded" style={{ color: c.sub }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {actions.length === 0 ? (
          <p className="text-sm text-center mt-8" style={{ color: c.sub }}>
            Aucune action en attente. Demande à l'agent de créer ou modifier un fichier.
          </p>
        ) : (
          actions.map((a, i) => {
            const meta = toolMeta[a.tool] || { label: a.tool, icon: <FileEdit className="w-4 h-4" /> };
            const body = a.preview?.content ?? a.preview?.replace ?? a.preview?.imagePrompt ?? '';
            return (
              <div key={a.actionId || i} className="rounded-xl p-3" style={{ backgroundColor: c.card, border: `1px solid ${c.border}` }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: c.text }}>
                  <span style={{ color: '#d97706' }}>{meta.icon}</span>
                  <span className="text-xs font-bold uppercase tracking-wider">{meta.label}</span>
                </div>

                {a.preview?.target && (
                  <div className="text-[12px] font-mono mb-2" style={{ color: c.sub }}>
                    📄 {a.preview.target}
                  </div>
                )}

                {a.tool === 'file_modify' && a.preview?.search && (
                  <div className="text-[11px] font-mono mb-1 px-2 py-1 rounded" style={{ backgroundColor: c.code, color: '#dc2626' }}>
                    − {a.preview.search.slice(0, 300)}
                  </div>
                )}

                {body && (
                  <pre className="text-[11px] font-mono whitespace-pre-wrap break-words max-h-48 overflow-auto px-2 py-1.5 rounded mb-2" style={{ backgroundColor: c.code, color: c.text }}>
                    {body.slice(0, 1200)}{body.length > 1200 ? '\n…' : ''}
                  </pre>
                )}

                {a.error ? (
                  <div className="text-[12px]" style={{ color: '#dc2626' }}>⚠️ {a.error}</div>
                ) : a.status === 'done' ? (
                  <div className="text-[12px] flex items-center gap-1" style={{ color: '#16a34a' }}>
                    <Check className="w-3.5 h-3.5" /> {a.result || 'Fait'}
                    {a.image && <img src={a.image} alt="générée" className="mt-2 rounded-lg max-w-full border" style={{ borderColor: c.border }} />}
                  </div>
                ) : a.status === 'rejected' ? (
                  <div className="text-[12px]" style={{ color: c.sub }}>Refusé.</div>
                ) : a.status === 'running' ? (
                  <div className="text-[12px] flex items-center gap-1" style={{ color: c.sub }}>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Exécution…
                  </div>
                ) : (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => onApprove(a)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: '#16a34a' }}
                    >
                      <Check className="w-3.5 h-3.5" /> Autoriser
                    </button>
                    <button
                      onClick={() => onReject(a)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: '#dc2626' }}
                    >
                      <X className="w-3.5 h-3.5" /> Refuser
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="px-3 py-1.5 shrink-0 text-[9px] uppercase tracking-widest" style={{ borderTop: `1px solid ${c.border}`, color: c.sub }}>
        Cowork confiné à ~/dark-gpt-workspace · validation humaine
      </div>
    </div>
  );
};
