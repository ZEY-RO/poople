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
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-display font-black text-amber-950 dark:text-amber-300 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Player Statistics
          </h2>
          <button
            onClick={() => {
              soundFx.playKey();
              onClose();
            }}
            className="p-1 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto custom-scrollbar space-y-4 flex-1">
          {/* 4 Big Stat Tiles */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-amber-200/60 dark:border-slate-700">
              <span className="text-2xl font-display font-black text-amber-600 dark:text-amber-400 block">
                {stats.dailyPlayed}
              </span>
              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase">
                Played
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-amber-200/60 dark:border-slate-700">
              <span className="text-2xl font-display font-black text-stone-700 dark:text-stone-300 block">
                {winRate}%
              </span>
              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase">
                Win %
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-amber-200/60 dark:border-slate-700">
              <span className="text-2xl font-display font-black text-amber-500 block">
                {stats.currentStreak}
              </span>
              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase">
                Streak
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-amber-200/60 dark:border-slate-700">
              <span className="text-2xl font-display font-black text-stone-700 dark:text-stone-300 block">
                {stats.maxStreak}
              </span>
              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase">
                Max
              </span>
            </div>
          </div>

          {/* Daily Par Efficiency Distribution Chart */}
          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700">
            <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Par Efficiency Distribution
            </h3>
            <div className="space-y-1.5">
              {Object.entries(diffDistribution).map(([label, count]) => {
                const pct = Math.max(8, (count / maxFreq) * 100);
                return (
                  <div key={label} className="flex items-center text-xs gap-2">
                    <span className="w-24 text-[11px] font-semibold text-stone-600 dark:text-stone-400 truncate">
                      {label}
                    </span>
                    <div className="flex-1 bg-stone-200 dark:bg-slate-700 rounded-full h-5 overflow-hidden flex items-center">
                      <div
                        className={`h-full flex items-center justify-end px-2 text-[10px] font-bold text-white transition-all duration-500 ${
                          label.includes('Flawless') ? 'bg-amber-500' : 'bg-stone-500 dark:bg-stone-600'
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
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-amber-200/60 dark:border-slate-700 text-center">
              <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <div className="text-lg font-display font-black text-amber-600 dark:text-amber-400">
                {stats.rushHighScore}
              </div>
              <span className="text-[10px] font-bold text-stone-500 block">Rush Best</span>
            </div>

            {/* Versus Record */}
            <div className="p-3 rounded-2xl bg-sky-50 dark:bg-slate-800 border border-sky-200/60 dark:border-slate-700 text-center">
              <Swords className="w-4 h-4 text-sky-500 mx-auto mb-1" />
              <div className="text-lg font-display font-black text-sky-600 dark:text-sky-400">
                {stats.versusWins}W - {stats.versusLosses}L
              </div>
              <span className="text-[10px] font-bold text-stone-500 block">Vs Bot</span>
            </div>

            {/* Campaign Stars */}
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-amber-200/60 dark:border-slate-700 text-center">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400 mx-auto mb-1" />
              <div className="text-lg font-display font-black text-amber-600 dark:text-amber-400">
                {totalCampaignStars}
              </div>
              <span className="text-[10px] font-bold text-stone-500 block">Stars Won</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
