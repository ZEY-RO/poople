import React from 'react';
import { BotPersonality, BotState } from '../types/game';
import { BOT_CONFIGS } from '../engine/bot';
import { soundFx } from '../services/audio';
import { Bot, RotateCcw, Flag } from 'lucide-react';

interface VersusModeViewProps {
  selectedBot: BotPersonality;
  onSelectBot: (bot: BotPersonality) => void;
  botState: BotState;
  playerStepCount: number;
  playerProgress: number;
  botProgress: number;
  onStartNewVersusGame: () => void;
}

export const VersusModeView: React.FC<VersusModeViewProps> = ({
  selectedBot, onSelectBot, botState, playerStepCount, playerProgress, botProgress, onStartNewVersusGame
}) => {
  const bots: BotPersonality[] = ['easy', 'medium', 'hard'];
  const clamp = (progress: number) => Math.min(100, Math.max(0, progress));
  return (
    <section className="w-full max-w-lg mx-auto px-4 pt-1 pb-3" aria-label="Versus bot match">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-xs text-theme-text-secondary"><Bot className="w-4 h-4 text-theme-accent" /><span>Opponent</span></div>
        <div className="flex gap-1 p-1 rounded-lg bg-theme-bg-secondary" role="group" aria-label="Bot difficulty">
          {bots.map(id => <button type="button" key={id} aria-pressed={selectedBot === id} title={BOT_CONFIGS[id].description}
            onClick={() => { if (selectedBot !== id) { soundFx.playKey(); onSelectBot(id); } }}
            className={`px-3 min-h-8 rounded-md text-xs font-medium capitalize btn-press ${selectedBot === id ? 'bg-theme-bg-card text-theme-accent shadow-sm' : 'text-theme-text-muted hover:text-theme-text-primary'}`}>{id}</button>)}
        </div>
      </div>
      <div className="p-3 rounded-xl bg-theme-bg-secondary border border-theme-border">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-xs font-semibold flex items-center gap-1.5"><Flag className="w-3.5 h-3.5 text-theme-accent" />First to POOP wins</p>
          <button type="button" onClick={() => { soundFx.playFlush(); onStartNewVersusGame(); }} className="min-h-8 px-2 rounded-lg text-xs text-theme-text-secondary hover:bg-theme-bg-card flex items-center gap-1.5 btn-press"><RotateCcw className="w-3.5 h-3.5" />Rematch</button>
        </div>
        <div className="mb-3">
          <div className="flex justify-between text-[11px] mb-1.5"><span className="font-semibold text-theme-accent">You</span><span className="text-theme-text-muted">{playerStepCount} steps</span></div>
          <div className="w-full h-2 bg-theme-border rounded-full overflow-hidden" role="progressbar" aria-label="Your progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={clamp(playerProgress)}><div className="h-full bg-theme-accent rounded-full transition-all duration-300" style={{ width: `${clamp(playerProgress)}%` }} /></div>
        </div>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] mb-1.5">
            <span className="font-semibold">{botState.config.name}<span className="ml-1.5 font-mono text-theme-text-muted">{botState.currentWord}</span></span>
            <span className="text-theme-text-muted">{botState.status === 'won' ? 'Finished' : `${botState.stepCount} steps`}</span>
          </div>
          <div className="w-full h-2 bg-theme-border rounded-full overflow-hidden" role="progressbar" aria-label="Bot progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={clamp(botProgress)}><div className="h-full bg-theme-text-muted rounded-full transition-all duration-300" style={{ width: `${clamp(botProgress)}%` }} /></div>
        </div>
        {botState.status === 'won' && <p className="mt-3 text-xs text-theme-text-secondary" role="status">{botState.config.name} reached the goal. Try a rematch!</p>}
      </div>
    </section>
  );
};
