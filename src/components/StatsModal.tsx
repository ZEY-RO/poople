import React from 'react';
import { PlayerStats } from '../types/game';
import { Trophy, Zap, Swords, Star, Award, X } from 'lucide-react';
import { soundFx } from '../services/audio';

interface StatsModalProps {
  stats: PlayerStats;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ stats, onClose }) => {
  const winRate = stats.dailyPlayed > 0 ? Math.round((stats.dailyWins / stats.dailyPlayed) * 100) : 0;
  const totalCampaignStars = Object.values(stats.campaignStars).reduce((a, b) => a + b, 0);

  // Compute guess diff distribution
  const diffDistribution: Record<string, number> = { 'Par (Flawless)': 0, '+1 Step': 0, '+2 Steps': 0, '+3+ Steps': 0 };
  Object.values(stats.dailyHistory).forEach(res => {
    if (res.won) {
      const diff = res.steps - res.par;
      if (diff <= 0) diffDistribution['Par (Flawless)']++;
      else if (diff === 1) diffDistribution['+1 Step']++;
      else if (diff === 2) diffDistribution['+2 Steps']++;
      else diffDistribution['+3+ Steps']++;
    }
  });

  const maxFreq = Math.max(1, ...Object.values(diffDistribution));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop">
      <div className="w-full max-w-md bg-theme-modal text-theme-text-primary rounded-3xl shadow-2xl border border-theme-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-theme-border/60 flex items-center justify-between">
          <h2 className="text-lg font-display font-black text-theme-text-primary flex items-center gap-2">
            <Trophy className="w-5 h-5 text-theme-accent" />
            Player Statistics
          </h2>
          <button
            onClick={() => {
              soundFx.playKey();
              onClose();
            }}
            className="p-1 rounded-xl text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-bg-secondary btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto custom-scrollbar space-y-4 flex-1">
          {/* 4 Big Stat Tiles */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
              <span className="text-2xl font-display font-black text-theme-accent block">
                {stats.dailyPlayed}
              </span>
              <span className="text-[10px] font-bold text-theme-text-muted uppercase">
                Played
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
              <span className="text-2xl font-display font-black text-theme-text-secondary block">
                {winRate}%
              </span>
              <span className="text-[10px] font-bold text-theme-text-muted uppercase">
                Win %
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
              <span className="text-2xl font-display font-black text-theme-accent block">
                {stats.currentStreak}
              </span>
              <span className="text-[10px] font-bold text-theme-text-muted uppercase">
                Streak
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
              <span className="text-2xl font-display font-black text-theme-text-secondary block">
                {stats.maxStreak}
              </span>
              <span className="text-[10px] font-bold text-theme-text-muted uppercase">
                Max
              </span>
            </div>
          </div>

          {/* Daily Par Efficiency Distribution Chart */}
          <div className="p-3 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
            <h3 className="text-xs font-bold text-theme-text-primary mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-theme-accent" />
              Par Efficiency Distribution
            </h3>
            <div className="space-y-1.5">
              {Object.entries(diffDistribution).map(([label, count]) => {
                const pct = Math.max(8, (count / maxFreq) * 100);
                return (
                  <div key={label} className="flex items-center text-xs gap-2">
                    <span className="w-24 text-[11px] font-semibold text-theme-text-secondary truncate">
                      {label}
                    </span>
                    <div className="flex-1 bg-theme-border/40 rounded-full h-5 overflow-hidden flex items-center">
                      <div
                        className={`h-full flex items-center justify-end px-2 text-[10px] font-bold transition-all duration-500 ${
                          label.includes('Flawless') ? 'bg-theme-accent text-theme-accent-text font-black' : 'bg-theme-text-muted text-theme-bg-primary'
                        }`}
                        style={{ width: `${count > 0 ? pct : 0}%` }}
                      >
                        {count > 0 && count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Other Game Modes Records */}
          <div className="grid grid-cols-3 gap-2">
            {/* Rush Mode */}
            <div className="p-3 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border text-center">
              <Zap className="w-4 h-4 text-theme-accent mx-auto mb-1" />
              <div className="text-lg font-display font-black text-theme-accent">
                {stats.rushHighScore}
              </div>
              <span className="text-[10px] font-bold text-theme-text-muted block">Rush Best</span>
            </div>

            {/* Versus Record */}
            <div className="p-3 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border text-center">
              <Swords className="w-4 h-4 text-theme-accent mx-auto mb-1" />
              <div className="text-lg font-display font-black text-theme-accent">
                {stats.versusWins}W - {stats.versusLosses}L
              </div>
              <span className="text-[10px] font-bold text-theme-text-muted block">Vs Bot</span>
            </div>

            {/* Campaign Stars */}
            <div className="p-3 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border text-center">
              <Star className="w-4 h-4 text-theme-accent fill-theme-accent mx-auto mb-1" />
              <div className="text-lg font-display font-black text-theme-accent">
                {totalCampaignStars}
              </div>
              <span className="text-[10px] font-bold text-theme-text-muted block">Stars Won</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
