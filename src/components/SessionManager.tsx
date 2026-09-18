import React, { useState, useEffect } from 'react';
import { Session } from '../types.ts';
import { ArrowLeft, Plus, Download, Trash2, Edit2, Search, Check, FolderOpen } from 'lucide-react';

interface SessionManagerProps {
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onBackToMenu: () => void;
  activeMode?: 'defense' | 'hacker';
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  currentSessionId,
  onSelectSession,
  onBackToMenu,
  activeMode = 'hacker'
}) => {
  const isGreen = activeMode === 'defense';
  const [sessions, setSessions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.warn("Failed to fetch sessions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() || undefined })
      });
      if (res.ok) {
        const created = await res.json();
        setNewTitle('');
        await fetchSessions();
        onSelectSession(created.id);
      }
    } catch (e: any) {
      alert(`Error creating session: ${e.message}`);
    }
  };

  const handleRename = async (id: string) => {
    if (!editTitleInput.trim()) return;
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitleInput.trim() })
      });
      if (res.ok) {
        setEditingId(null);
        fetchSessions();
      }
    } catch (e: any) {
      alert(`Failed to rename: ${e.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (id === 'default') {
      alert("Cannot delete default session.");
      return;
    }
    if (!confirm("Are you sure you want to delete this session?")) return;
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (currentSessionId === id) {
          onSelectSession('default');
        }
        fetchSessions();
      }
    } catch (e: any) {
      alert(`Failed to delete: ${e.message}`);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="session-manager-container" className={`flex flex-col h-full bg-black text-white font-mono border ${
      isGreen ? 'border-emerald-600' : 'border-red-600'
    }`}>
      {/* Top Header */}
      <div className={`border-b px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm ${
        isGreen ? 'bg-emerald-950/40 border-emerald-600' : 'bg-red-950/40 border-red-600'
      }`}>
        <div className="flex items-center gap-2">
          <button
            id="session-back-button"
            onClick={onBackToMenu}
            className={`flex items-center gap-1 px-2 py-0.5 border transition-colors ${
              isGreen 
                ? 'text-emerald-400 border-emerald-600 hover:bg-emerald-600/20 hover:text-white' 
                : 'text-red-500 border-red-600 hover:bg-red-600/20 hover:text-white'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>MENU</span>
          </button>
          <span className={`font-bold tracking-wider ${isGreen ? 'text-emerald-400' : 'text-red-500'}`}>
            {isGreen ? '[🛡️] SESSIONS MANAGEMENT (DEFENSE)' : '[x_x] SESSIONS MANAGEMENT'}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-3xl mx-auto w-full flex-1 overflow-y-auto">
        {/* Create Session & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <form onSubmit={handleCreateSession} className="flex gap-2">
            <input
              id="new-session-title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Titre de la nouvelle session..."
              className={`flex-1 bg-black border px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none ${
                isGreen ? 'border-emerald-900 focus:border-emerald-500' : 'border-red-900 focus:border-red-600'
              }`}
            />
            <button
              id="create-session-submit"
              type="submit"
              className={`px-3 py-1.5 border text-white text-xs font-bold transition-colors flex items-center gap-1 ${
                isGreen 
                  ? 'bg-emerald-950 border-emerald-600 hover:bg-emerald-600 hover:text-black' 
                  : 'bg-red-950 border-red-600 hover:bg-red-600'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>CRÉER</span>
            </button>
          </form>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
            <input
              id="search-sessions-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher des sessions..."
              className={`w-full bg-black border border-neutral-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none ${
                isGreen ? 'focus:border-emerald-500' : 'focus:border-red-600'
              }`}
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className={`border divide-y divide-neutral-900 bg-neutral-950 ${
          isGreen ? 'border-emerald-900/60' : 'border-red-900/60'
        }`}>
          {filteredSessions.length === 0 ? (
            <div className="p-6 text-center text-neutral-600 text-xs italic">
              Aucune session trouvée.
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isCurrent = session.id === currentSessionId;
              const isEditing = editingId === session.id;

              return (
                <div
                  key={session.id}
                  className={`p-3 flex items-center justify-between gap-2 text-xs transition-colors ${
                    isCurrent 
                      ? isGreen 
                        ? 'bg-emerald-950/20 border-l-2 border-emerald-500' 
                        : 'bg-red-950/20 border-l-2 border-red-600' 
                      : 'hover:bg-neutral-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className={`font-bold select-none ${isGreen ? 'text-emerald-400' : 'text-red-500'}`}>
                      {isCurrent ? '*' : ' '}
                    </span>
                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="text"
                          value={editTitleInput}
                          onChange={(e) => setEditTitleInput(e.target.value)}
                          className={`bg-black border px-2 py-0.5 text-xs text-white focus:outline-none flex-1 ${
                            isGreen ? 'border-emerald-500' : 'border-red-600'
                          }`}
                          autoFocus
                        />
                        <button
                          onClick={() => handleRename(session.id)}
                          className="p-1 text-green-400 hover:text-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => onSelectSession(session.id)}
                        className="cursor-pointer truncate flex-1"
                      >
                        <div className={`font-semibold truncate ${isCurrent ? 'text-white' : 'text-neutral-300'}`}>
                          {session.title}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          {session.id} • {session.message_count || 0} messages
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onSelectSession(session.id)}
                      title="Ouvrir la session"
                      className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(session.id);
                        setEditTitleInput(session.title);
                      }}
                      title="Renommer"
                      className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={`/api/sessions/${session.id}/export`}
                      target="_blank"
                      rel="noreferrer"
                      title="Exporter en texte"
                      className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    {session.id !== 'default' && (
                      <button
                        onClick={() => handleDelete(session.id)}
                        title="Supprimer"
                        className="p-1.5 text-neutral-600 hover:text-red-500 hover:bg-neutral-800 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
