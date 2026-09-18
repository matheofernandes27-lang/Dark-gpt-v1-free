import React from 'react';

interface AsciiBannerProps {
  activeMode?: 'defense' | 'hacker';
}

export const AsciiBanner: React.FC<AsciiBannerProps> = ({ activeMode = 'hacker' }) => {
  const isGreen = activeMode === 'defense';

  return (
    <div id="ascii-main-banner" className="w-full flex flex-col items-center select-none font-mono py-2">
      {/* ASCII Art Title */}
      <pre className={`text-[9px] sm:text-[11px] md:text-[13px] lg:text-[15px] leading-none font-bold tracking-tight overflow-x-auto max-w-full text-center ${
        isGreen ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'text-red-600 glow-red'
      }`}>
{`██████╗   █████╗  ██████╗  ██╗  ██╗     ██████╗  ██████╗  ████████╗
██╔══██╗ ██╔══██╗ ██╔══██╗ ██║ ██╔╝    ██╔════╝  ██╔══██╗ ╚══██╔══╝
██║  ██║ ███████║ ██████╔╝ █████╔╝     ██║  ███╗ ██████╔╝    ██║   
██║  ██║ ██╔══██║ ██╔══██╗ ██╔═██╗     ██║   ██║ ██╔═══╝     ██║   
██████╔╝ ██║  ██║ ██║  ██║ ██║  ██╗    ╚██████╔╝ ██║         ██║   
╚═════╝  ╚═╝  ╚═╝ ╚═╝  ╚═╝ ╚═╝  ╚═╝     ╚═════╝  ╚═╝         ╚═╝   `}
      </pre>

      {/* Subtitles as requested */}
      <div className="mt-2 text-center space-y-0.5">
        <div className="text-neutral-200 text-xs sm:text-sm font-semibold tracking-widest">
          POWERED BY OLLAMA FREE
        </div>
        <div className={`text-xs sm:text-sm font-bold tracking-wider ${
          isGreen ? 'text-emerald-400' : 'text-red-600'
        }`}>
          M4TH4CK3R
        </div>
      </div>

      {/* Identity Line Frame */}
      <div className={`mt-3 w-full max-w-lg border px-4 py-1.5 flex items-center justify-between text-xs tracking-wider ${
        isGreen 
          ? 'border-emerald-600 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
          : 'border-red-600 bg-red-950/20 glow-box-red'
      }`}>
        <span className={`font-bold flex items-center gap-1.5 ${isGreen ? 'text-emerald-400' : 'text-red-500'}`}>
          <span className={`inline-block w-2 h-2 rounded-full animate-pulse ${isGreen ? 'bg-emerald-400' : 'bg-red-600'}`}></span>
          {isGreen ? '[🛡️] DARK-GPT // DÉFENSE' : '[x_x] DARK-GPT // OFFENSIF'}
        </span>
        <span className="text-neutral-300 font-medium">LOCAL AI TERMINAL</span>
        <span className={`text-[10px] ${isGreen ? 'text-emerald-400' : 'text-red-500'}`}>v1.1.0</span>
      </div>
    </div>
  );
};
