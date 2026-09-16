import React from 'react';

export const AsciiBanner: React.FC = () => {
  return (
    <div id="ascii-main-banner" className="w-full flex flex-col items-center select-none font-mono py-2">
      {/* ASCII Art Title */}
      <pre className="text-red-600 text-[9px] sm:text-[11px] md:text-[13px] lg:text-[15px] leading-none font-bold tracking-tight glow-red overflow-x-auto max-w-full text-center">
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
        <div className="text-red-600 text-xs sm:text-sm font-bold tracking-wider">
          M4TH4CK3R
        </div>
      </div>

      {/* Identity Line with Red Frame */}
      <div className="mt-3 w-full max-w-lg border border-red-600 bg-red-950/20 px-4 py-1.5 flex items-center justify-between text-xs tracking-wider glow-box-red">
        <span className="text-red-500 font-bold flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
          [x_x] DARK-GPT
        </span>
        <span className="text-neutral-300 font-medium">LOCAL AI TERMINAL</span>
        <span className="text-red-500 text-[10px]">v1.1.0</span>
      </div>
    </div>
  );
};
