import React from 'react';
import { BotPersonality, BotState } from '../types/game';
import { BOT_CONFIGS } from '../engine/bot';
import { soundFx } from '../services/audio';
import { Swords, RotateCcw } from 'lucide-react';

interface VersusModeViewProps {
  selectedBot: BotPersonality;
  onSelectBot: (bot: BotPersonality) => void;
  botState: BotState;
  playerStepCount: number;
  playerProgress: number; // 0 to 100%
  botProgress: number;    // 0 to 100%
  onStartNewVersusGame: () => void;
}

export const VersusModeView: React.FC<VersusModeViewProps> = ({
  selectedBot,
  onSelectBot,
  botState,
  playerStepCount,
  playerProgress,
  botProgress,
  onStartNewVersusGame
}) => {
  const bots: BotPersonality[] = ['easy', 'medium', 'hard'];

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-1 pb-2">
      {/* Bot Selector Bar */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        {bots.map(bId => {
          const cfg = BOT_CONFIGS[bId];
          const isSelected = selectedBot === bId;
          return (
            <button
              key={bId}
              onClick={() => {
                if (selectedBot !== bId) {
                  soundFx.playKey();
                  onSelectBot(bId);
                }
              }}
              className={`flex-1 p-2 rounded-xl border text-center transition-all btn-press ${
                isSelected
                  ? 'bg-theme-accent text-theme-accent-text border-theme-accent shadow-md scale-105 font-black'
                  : 'bg-theme-bg-card text-theme-text-secondary border border-theme-border/60 hover:bg-theme-bg-muted'
              }`}
            >
              <div className="text-lg">{cfg.avatar}</div>
              <div className="text-[11px] font-bold truncate">{cfg.name}</div>
            </button>
          );
        })}
      </div>

      {/* Versus Race Track Card */}
      <div className="p-3 rounded-2xl bg-theme-bg-secondary border border-theme-border shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Swords className="w-4 h-4 text-theme-accent" />
            <span className="text-xs font-bold text-theme-text-primary">
              Live Toilet Race to POOP
            </span>
          </div>
          <button
            onClick={() => {
              soundFx.playFlush();
              onStartNewVersusGame();
            }}
            className="p-1 rounded-lg bg-theme-bg-card text-theme-text-secondary border border-theme-border/60 hover:bg-theme-bg-muted text-xs font-bold flex items-center gap-1 btn-press"
            title="Restart match with new word"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rematch</span>
          </button>
        </div>

        {/* Player Race Track */}
        <div className="mb-2">
          <div className="flex justify-between text-[11px] font-bold mb-1">
            <span className="text-theme-accent">You ({playerStepCount} steps)</span>
            <span className="text-theme-text-muted">🏁 POOP</span>
          </div>
          <div className="relative w-full h-4 bg-theme-border/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-theme-accent rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(5, playerProgress))}%` }}
            />
          </div>
        </div>

        {/* Bot Race Track */}
        <div>
          <div className="flex justify-between text-[11px] font-bold mb-1">
            <span className="text-theme-text-primary flex items-center gap-1">
              <span>{botState.config.avatar}</span>
              <span>{botState.config.name}</span>
              {botState.status === 'thinking' && (
                <span className="text-[10px] text-theme-accent animate-pulse">(Thinking...)</span>
              )}
              {botState.currentWord && (
                <span className="text-[10px] font-mono font-bold bg-theme-bg-card text-theme-accent border border-theme-border/60 px-1.5 py-0.2 rounded">
                  {botState.currentWord}
                </span>
              )}
            </span>
            <span className="text-theme-text-muted">🏁 POOP</span>
          </div>
          <div className="relative w-full h-4 bg-theme-border/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(5, botProgress))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
