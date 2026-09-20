import React, { useState, useRef, useEffect } from 'react';
import { Send, ImagePlus, Sun, Moon, Terminal as TerminalIcon, Loader2, Copy, Check, Wrench, SquarePen } from 'lucide-react';
import { Artifact } from '../types.ts';
import { ArtifactPanel } from './ArtifactPanel.tsx';
import { CoworkActionsPanel, CoworkAction } from './CoworkActionsPanel.tsx';

interface MinimalChatProps {
  onExit: () => void;
}

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string; // data URL
  pending?: boolean;
}

/**
 * Interface claire type Claude.ai — chat central épuré, peu de boutons.
 * - IA simple via /api/chat (répond directement).
 * - Génération d'images gratuite via /api/images/generate (Pollinations).
 * - Panneau Artifact (aperçu + code) qui se déploie quand du code est produit.
 * - Bascule clair/sombre purement esthétique.
 */
const CHAT_STORAGE_KEY = 'darkgpt_minimal_chat_v1';

export const MinimalChat: React.FC<MinimalChatProps> = ({ onExit }) => {
  const [lum, setLum] = useState<'light' | 'dark'>('light');
  // Conversation persistante (restaurée au rechargement).
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [coworkMode, setCoworkMode] = useState(false);
  const [coworkActions, setCoworkActions] = useState<CoworkAction[]>([]);
  const coworkTaskId = useRef('cw-' + Math.random().toString(36).slice(2, 8));
  const endRef = useRef<HTMLDivElement>(null);

  const isLight = lum === 'light';
  // Palette façon Claude.ai (cf. cahier des charges).
  const c = isLight
    ? { bg: '#FBFBFA', text: '#1F1F1E', sub: '#6B6B68', border: '#E5E5E3', userBg: '#F3F3F2', accent: '#D97706', panelBg: '#FFFFFF' }
    : { bg: '#1E1E1F', text: '#E3E3E2', sub: '#9A9A98', border: '#2E2E30', userBg: '#2A2A2C', accent: '#F59E0B', panelBg: '#141415' };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sauvegarde la conversation (sans le message "en cours") pour la retrouver au rechargement.
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.filter((m) => !m.pending)));
    } catch {
      /* stockage indisponible : on ignore */
    }
  }, [messages]);

  const newConversation = () => {
    setMessages([]);
    setCoworkActions([]);
    setArtifact(null);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const extractCodeBlock = (text: string): { code: string; language: string } | null => {
    const re = /```([a-zA-Z0-9]*)\n([\s\S]*?)```/g;
    let m: RegExpExecArray | null;
    let last: { code: string; language: string } | null = null;
    while ((m = re.exec(text)) !== null) last = { language: (m[1] || 'text').toLowerCase(), code: m[2] };
    return last;
  };

  const openArtifactFrom = (text: string) => {
    const block = extractCodeBlock(text);
    if (block) {
      setArtifact({ id: crypto.randomUUID(), title: `Artifact ${block.language.toUpperCase()}`, code: block.code, language: block.language, isOpen: true });
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages([...history, { id: 'pending', role: 'assistant', content: '', pending: true }]);
    setInput('');
    setBusy(true);
    try {
      if (coworkMode) {
        // Mode Cowork : l'agent planifie des actions sur les fichiers (à valider).
        const res = await fetch('/api/cowork/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
            taskId: coworkTaskId.current,
          }),
        });
        const data = await res.json();
        const reply = data.reply || data.error || '(pas de réponse)';
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== 'pending'),
          { id: crypto.randomUUID(), role: 'assistant', content: reply },
        ]);
        if (Array.isArray(data.actions) && data.actions.length > 0) {
          setCoworkActions(data.actions.map((a: CoworkAction) => ({ ...a, status: a.error ? 'failed' : 'pending' })));
        }
        return;
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.map((m) => ({ role: m.role, content: m.content })), session_id: 'minimal' }),
      });
      const data = await res.json();
      const reply = data.response || data.reply || data.error || '(pas de réponse)';
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== 'pending'),
        { id: crypto.randomUUID(), role: 'assistant', content: reply },
      ]);
      if (reply.includes('```')) openArtifactFrom(reply);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== 'pending'),
        { id: crypto.randomUUID(), role: 'assistant', content: 'Erreur de connexion au serveur.' },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const generateImage = async () => {
    const prompt = input.trim();
    if (!prompt || busy) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', content: `🎨 Image : ${prompt}` };
    setMessages((prev) => [...prev, userMsg, { id: 'pending', role: 'assistant', content: 'Génération de l’image…', pending: true }]);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== 'pending'),
        data.success
          ? { id: crypto.randomUUID(), role: 'assistant', content: `Image générée (${data.provider}) :`, image: data.dataUrl }
          : { id: crypto.randomUUID(), role: 'assistant', content: `Échec image : ${data.error || 'inconnue'}` },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== 'pending'),
        { id: crypto.randomUUID(), role: 'assistant', content: 'Erreur réseau lors de la génération d’image.' },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch { /* ignore */ }
  };

  // Autoriser / refuser une action Cowork.
  const resolveCowork = async (a: CoworkAction, approved: boolean) => {
    if (!a.actionId || !a.nonce) return;
    setCoworkActions((prev) => prev.map((x) => (x.actionId === a.actionId ? { ...x, status: approved ? 'running' : 'rejected' } : x)));
    try {
      const res = await fetch('/api/cowork/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: a.actionId, nonce: a.nonce, approved }),
      });
      const data = await res.json();
      if (!approved) return;
      setCoworkActions((prev) =>
        prev.map((x) =>
          x.actionId === a.actionId
            ? { ...x, status: data.success ? 'done' : 'failed', result: data.output || data.error, image: data.dataUrl }
            : x
        )
      );
    } catch {
      setCoworkActions((prev) => prev.map((x) => (x.actionId === a.actionId ? { ...x, status: 'failed', result: 'Erreur réseau' } : x)));
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="w-screen h-screen flex" style={{ backgroundColor: c.bg, color: c.text, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Colonne chat (50% si un panneau est ouvert, 100% sinon) */}
      <div className={coworkActions.length > 0 || artifact?.isOpen ? 'w-1/2 h-full flex flex-col' : 'w-full h-full flex flex-col'}>
        {/* Header discret */}
        <header className="flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: `1px solid ${c.border}` }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight">dark-gpt</span>
            <button
              onClick={newConversation}
              title="Nouvelle conversation"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: c.sub }}
            >
              <SquarePen className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCoworkMode((v) => !v)}
              title={coworkMode ? 'Cowork activé (l\'agent agit sur tes fichiers, avec validation)' : 'Activer le Cowork (agent sur tes fichiers)'}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              style={coworkMode ? { backgroundColor: '#16a34a', color: '#fff' } : { color: c.sub, border: `1px solid ${c.border}` }}
            >
              <Wrench className="w-3.5 h-3.5" /> Cowork
            </button>
            <button
              onClick={() => setLum(isLight ? 'dark' : 'light')}
              title={isLight ? 'Mode sombre' : 'Mode clair'}
              className="p-2 rounded-lg transition-colors"
              style={{ color: c.sub }}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button
              onClick={onExit}
              title="Passer en mode Hacker (Matrix)"
              className="p-2 rounded-lg transition-colors"
              style={{ color: c.sub }}
            >
              <TerminalIcon className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Fil de discussion */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-[55vh] flex flex-col items-center justify-center text-center select-none">
                <p className="text-2xl font-semibold mb-2">Bonjour 👋</p>
                <p style={{ color: c.sub }}>Posez une question, demandez du code, ou générez une image.</p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words"
                    style={m.role === 'user' ? { backgroundColor: c.userBg } : { backgroundColor: 'transparent' }}
                  >
                    {m.pending ? (
                      <span className="inline-flex items-center gap-2" style={{ color: c.sub }}>
                        <Loader2 className="w-4 h-4 animate-spin" /> {m.content || 'Réflexion…'}
                      </span>
                    ) : (
                      <>
                        {m.content}
                        {m.image && (
                          <img src={m.image} alt="Image générée" className="mt-3 rounded-xl max-w-full border" style={{ borderColor: c.border }} />
                        )}
                        {m.role === 'assistant' && m.content.includes('```') && (
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => openArtifactFrom(m.content)}
                              className="text-xs px-2 py-1 rounded-md"
                              style={{ border: `1px solid ${c.border}`, color: c.accent }}
                            >
                              Ouvrir l’aperçu
                            </button>
                            <button
                              onClick={() => copy(m.content, m.id)}
                              className="text-xs px-2 py-1 rounded-md inline-flex items-center gap-1"
                              style={{ border: `1px solid ${c.border}`, color: c.sub }}
                            >
                              {copiedId === m.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copier
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>
        </div>

        {/* Zone d'entrée (peu de boutons : image + envoyer) */}
        <div className="shrink-0 px-4 pb-5 pt-1">
          <div className="max-w-3xl mx-auto w-full">
            <div className="flex items-end gap-2 rounded-2xl px-3 py-2" style={{ border: `1px solid ${c.border}`, backgroundColor: isLight ? '#FFFFFF' : '#141415' }}>
              <button
                onClick={generateImage}
                disabled={busy || !input.trim()}
                title="Générer une image (gratuit)"
                className="p-2 rounded-lg disabled:opacity-30 transition-colors shrink-0"
                style={{ color: c.sub }}
              >
                <ImagePlus className="w-5 h-5" />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Écrivez un message…"
                className="flex-1 resize-none bg-transparent outline-none py-1.5 text-[15px] max-h-40"
                style={{ color: c.text }}
              />
              <button
                onClick={sendMessage}
                disabled={busy || !input.trim()}
                title="Envoyer"
                className="p-2 rounded-lg disabled:opacity-30 transition-colors shrink-0"
                style={{ color: '#FFFFFF', backgroundColor: c.accent }}
              >
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-center text-[11px] mt-2" style={{ color: c.sub }}>
              Images gratuites via Pollinations · le code s’ouvre dans le panneau
            </p>
          </div>
        </div>
      </div>

      {/* Panneau droit 50/50 : actions Cowork en priorité, sinon aperçu Artifact */}
      {coworkActions.length > 0 ? (
        <div className="w-1/2 h-full">
          <CoworkActionsPanel
            actions={coworkActions}
            isLight={isLight}
            onApprove={(a) => resolveCowork(a, true)}
            onReject={(a) => resolveCowork(a, false)}
            onClose={() => setCoworkActions([])}
          />
        </div>
      ) : artifact?.isOpen ? (
        <div className="w-1/2 h-full">
          <ArtifactPanel artifact={artifact} activeMode="defense" onClose={() => setArtifact(null)} />
        </div>
      ) : null}
    </div>
  );
};
