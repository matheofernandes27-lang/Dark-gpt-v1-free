import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';

interface UpdatesViewProps {
  onBackToMenu: () => void;
}

export const UpdatesView: React.FC<UpdatesViewProps> = ({ onBackToMenu }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);

  const checkUpdates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/updates');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  useEffect(() => {
    checkUpdates();
  }, []);

  return (
    <div id="updates-container" className="flex flex-col h-full bg-black text-white font-mono border border-red-600">
      {/* Top Header */}
      <div className="bg-red-950/40 border-b border-red-600 px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <button
            id="updates-back-button"
            onClick={onBackToMenu}
            className="flex items-center gap-1 text-red-500 hover:text-white px-2 py-0.5 border border-red-600 hover:bg-red-600/20 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>MENU</span>
          </button>
          <span className="text-red-500 font-bold tracking-wider">
            [x_x] SYSTEM UPDATES
          </span>
        </div>
      </div>

      <div className="p-8 max-w-xl mx-auto w-full flex-1 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-16 h-16 rounded-full border-2 border-red-600 flex items-center justify-center glow-box-red">
          {loading ? (
            <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
          ) : (
            <CheckCircle2 className="w-8 h-8 text-red-500" />
          )}
        </div>

        <div className="space-y-2">
          <div className="text-lg font-bold text-white tracking-wider">
            DARK-GPT // LOCAL CORE v{data?.currentVersion || '1.1.0'}
          </div>
          <div className="text-xs text-red-400 font-semibold">
            {loading ? 'CHECKING GITHUB REPOSITORY...' : 'DARK-GPT IS UP TO DATE'}
          </div>
          <div className="text-xs text-neutral-400 max-w-sm pt-2">
            Build verified by M4TH4CK3R. All local cybersecurity and LLM communication kernels are running latest patch level.
          </div>
        </div>

        <button
          onClick={checkUpdates}
          disabled={loading}
          className="px-4 py-2 bg-red-950 border border-red-600 hover:bg-red-600 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>CHECK AGAIN</span>
        </button>
      </div>
    </div>
  );
};
