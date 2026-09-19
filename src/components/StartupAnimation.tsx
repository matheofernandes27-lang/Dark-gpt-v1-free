import React, { useState, useEffect } from 'react';

interface StartupAnimationProps {
  onComplete: () => void;
}

export const StartupAnimation: React.FC<StartupAnimationProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<number>(1);
  const [typedTitle, setTypedTitle] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  // Skip au clavier (le texte promet "appuyez sur une touche") ou au clic.
  useEffect(() => {
    const skip = () => onComplete();
    window.addEventListener('keydown', skip);
    return () => window.removeEventListener('keydown', skip);
  }, [onComplete]);

  // Phase 1 : frappe de DARK-GPT lettre par lettre.
  useEffect(() => {
    const targetTitle = 'DARK-GPT';
    let index = 0;
    const titleInterval = setInterval(() => {
      if (index < targetTitle.length) {
        setTypedTitle(targetTitle.substring(0, index + 1));
        index++;
      } else {
        clearInterval(titleInterval);
        setTimeout(() => setPhase(2), 500);
      }
    }, 90);
    return () => clearInterval(titleInterval);
  }, []);

  // Phases 2 / 3 / 4 : cadre, barre de progression, "ONLINE".
  useEffect(() => {
    if (phase === 2) {
      const t = setTimeout(() => setPhase(3), 900);
      return () => clearTimeout(t);
    }
    if (phase === 3) {
      const iv = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(iv);
            setTimeout(() => setPhase(4), 350);
            return 100;
          }
          return prev + 5;
        });
      }, 40);
      return () => clearInterval(iv);
    }
    if (phase === 4) {
      const t = setTimeout(() => onComplete(), 1000);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  const totalBarWidth = 32;
  const filledWidth = Math.floor((progress / 100) * totalBarWidth);
  const progressBarString = '█'.repeat(filledWidth) + '░'.repeat(totalBarWidth - filledWidth);

  return (
    <div
      id="startup-animation-screen"
      onClick={onComplete}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4 cursor-pointer select-none font-mono overflow-hidden"
    >
      {/* léger halo rouge en fond */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: 'radial-gradient(circle at 50% 45%, rgba(220,38,38,0.18), transparent 60%)' }}
      />

      <div className="relative w-full max-w-xl text-center flex flex-col items-center gap-7">
        {/* Titre frappé */}
        <div className="text-5xl md:text-6xl font-black text-red-600 tracking-[0.2em] glow-red">
          {phase === 1 ? typedTitle : 'DARK-GPT'}
          {phase === 1 && <span className="animate-pulse">_</span>}
        </div>

        {/* Cadre propre (remplace l'ASCII mal aligné) */}
        {phase >= 2 && (
          <div className="w-full border border-red-600/70 rounded-md px-6 py-6 glow-box-red">
            <p className="text-red-500 text-sm md:text-base tracking-[0.35em] uppercase">Are you ready for</p>
            <p className="text-red-600 text-lg md:text-2xl font-bold tracking-[0.25em] uppercase mt-2 glow-red">
              The best AI experience
            </p>
            <div className="mt-4 flex items-center justify-center gap-4 text-red-700 text-sm tracking-widest">
              <span>[x_x]</span><span>[x_x]</span><span>[x_x]</span><span>[x_x]</span>
            </div>
          </div>
        )}

        {/* Barre de progression */}
        {phase >= 3 && (
          <div className="w-full space-y-3">
            <div className="text-red-500 text-xs sm:text-sm font-semibold tracking-wider">
              DARK-GPT // INITIALIZING: [{progressBarString}] {progress}%
            </div>
            {phase >= 4 && (
              <div className="text-red-600 font-bold text-lg md:text-xl tracking-[0.3em] glow-red animate-pulse">
                DARK-GPT ONLINE
              </div>
            )}
          </div>
        )}

        {/* Invite à passer */}
        <div className="pt-4 text-neutral-600 text-[11px] tracking-wider">
          [ CLIQUEZ OU APPUYEZ SUR UNE TOUCHE POUR PASSER ]
        </div>
      </div>
    </div>
  );
};
