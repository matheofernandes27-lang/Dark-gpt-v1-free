import React, { useState, useEffect } from 'react';

interface StartupAnimationProps {
  onComplete: () => void;
}

export const StartupAnimation: React.FC<StartupAnimationProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<number>(1);
  const [typedTitle, setTypedTitle] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  // Digital Rain Background Effect
  useEffect(() => {
    // Phase 1: Type DARK-GPT character by character
    const targetTitle = "DARK-GPT";
    let index = 0;
    const titleInterval = setInterval(() => {
      if (index < targetTitle.length) {
        setTypedTitle(targetTitle.substring(0, index + 1));
        index++;
      } else {
        clearInterval(titleInterval);
        setTimeout(() => setPhase(2), 600);
      }
    }, 90);

    return () => clearInterval(titleInterval);
  }, []);

  // Phase 2 & 3: Frame and Progress Bar
  useEffect(() => {
    if (phase === 2) {
      const timer = setTimeout(() => {
        setPhase(3);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (phase === 3) {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setTimeout(() => setPhase(4), 400);
            return 100;
          }
          return prev + 5;
        });
      }, 45);
      return () => clearInterval(progressInterval);
    }

    if (phase === 4) {
      const finalTimer = setTimeout(() => {
        onComplete();
      }, 1100);
      return () => clearTimeout(finalTimer);
    }
  }, [phase, onComplete]);

  // Generate ASCII progress bar
  const totalBarWidth = 36;
  const filledWidth = Math.floor((progress / 100) * totalBarWidth);
  const emptyWidth = totalBarWidth - filledWidth;
  const progressBarString = "█".repeat(filledWidth) + "░".repeat(emptyWidth);

  return (
    <div 
      id="startup-animation-screen"
      onClick={onComplete}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4 cursor-pointer select-none font-mono"
    >
      <div className="max-w-2xl w-full text-center space-y-6">
        {/* Phase 1: Typed Title */}
        {phase === 1 && (
          <div className="text-4xl md:text-6xl font-black text-red-600 tracking-widest glow-red">
            {typedTitle}
            <span className="animate-pulse">_</span>
          </div>
        )}

        {/* Phase 2, 3, 4: ASCII Frame */}
        {phase >= 2 && (
          <div className="text-red-600 whitespace-pre text-xs sm:text-sm md:text-base leading-snug glow-red">
{`      .----------------------------------------------------------.
      |                                                          |
      |        A R E   Y O U   R E A D Y   F O R                |
      |                                                          |
      |             T H E   B E S T   A I   E X P E R I E N C E |
      |                                                          |
      |              [x_x]  [x_x]  [x_x]  [x_x]                 |
      '----------------------------------------------------------'`}
          </div>
        )}

        {/* Phase 3 & 4: Progress Bar */}
        {phase >= 3 && (
          <div className="space-y-3">
            <div className="text-red-500 text-xs sm:text-sm font-semibold tracking-wider">
              DARK-GPT // INITIALIZING: [{progressBarString}] {progress}%
            </div>
            {phase >= 4 && (
              <div className="text-red-600 font-bold text-lg md:text-xl tracking-widest glow-red animate-pulse">
                DARK-GPT ONLINE
              </div>
            )}
          </div>
        )}

        {/* Skip Prompt */}
        <div className="pt-8 text-neutral-600 text-xs tracking-wider">
          [ CLICK ANYWHERE OR PRESS ANY KEY TO SKIP ]
        </div>
      </div>
    </div>
  );
};
