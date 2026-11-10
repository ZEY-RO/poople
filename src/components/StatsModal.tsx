import React from 'react';
import { PlayerStats } from '../types/game';
import { Trophy, Zap, Swords, Star, Award, X, Infinity as InfinityIcon } from 'lucide-react';
import { Modal } from './Modal';

interface StatsModalProps {
  stats: PlayerStats;
  onClose: () => void;
  onOpenSiteAnalytics?: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ stats, onClose }) => {
  const winRate = stats.dailyPlayed > 0 ? Math.round((stats.dailyWins / stats.dailyPlayed) * 100) : 0;
  const totalCampaignStars = Object.values(stats.campaignStars).reduce((sum, stars) => sum + stars, 0);
  const distribution = [0, 0, 0, 0];
  Object.values(stats.dailyHistory).filter(result => result.won).forEach(result => {
    distribution[Math.min(3, Math.max(0, result.steps - result.par))]++;
  });
  const maxFrequency = Math.max(1, ...distribution);
  const metrics = [
    { label: 'Played', value: stats.dailyPlayed },
    { label: 'Win rate', value: `${winRate}%` },
    { label: 'Streak', value: stats.currentStreak },
    { label: 'Best streak', value: stats.maxStreak }
  ];

  return (
    <Modal label="Your statistics" onClose={onClose}>
      <div className="w-full bg-theme-modal text-theme-text-primary rounded-3xl shadow-2xl border border-theme-border overflow-hidden flex flex-col max-h-[90dvh]">
        <div className="p-5 border-b border-theme-border flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-display font-bold flex items-center gap-2"><Trophy className="w-5 h-5 text-theme-accent" />Your statistics</h2>
            <p className="text-sm text-theme-text-muted mt-1">A little better, one letter at a time.</p>
          </div>
          <button onClick={onClose} aria-label="Close statistics" className="p-2 rounded-xl text-theme-text-muted hover:bg-theme-bg-secondary"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-5">
          <section aria-label="Daily puzzle statistics">
            <h3 className="text-xs uppercase tracking-widest font-bold text-theme-text-muted mb-3">Daily puzzles</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              {metrics.map(metric => <div key={metric.label} className="py-3 px-1 rounded-xl bg-theme-modal-subcard border border-theme-modal-subcard-border"><div className="text-2xl font-display font-bold text-theme-accent">{metric.value}</div><div className="text-[10px] font-semibold text-theme-text-secondary mt-1">{metric.label}</div></div>)}
            </div>
          </section>
          <section className="p-4 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><Award className="w-4 h-4 text-theme-accent" />How close to par?</h3>
            {stats.dailyWins === 0 ? <p className="text-sm text-theme-text-muted leading-relaxed">Finish your first daily puzzle to see your results here.</p> : <div className="space-y-3">{['At par', '+1 move', '+2 moves', '+3 or more'].map((label, index) => <div key={label} className="grid grid-cols-[76px_1fr_20px] items-center gap-2 text-xs"><span className="text-theme-text-secondary">{label}</span><div className="h-3 rounded-full bg-theme-border overflow-hidden"><div className="h-full rounded-full bg-theme-accent" style={{ width: `${distribution[index] / maxFrequency * 100}%` }} /></div><span className="text-right font-semibold">{distribution[index]}</span></div>)}</div>}
          </section>
          <section aria-label="Other game records" className="grid grid-cols-2 gap-3">
            {[
              { label: 'Unlimited wins', value: stats.unlimitedWins.toLocaleString(), Icon: InfinityIcon, detail: `${stats.flawlessCount} total flawless solves` },
              { label: 'Rush best', value: stats.rushHighScore.toLocaleString(), Icon: Zap, detail: `${stats.rushBestSolved} puzzles solved in one run` },
              { label: 'Versus record', value: `${stats.versusWins}W · ${stats.versusLosses}L`, Icon: Swords, detail: 'Races against the bot' },
              { label: 'Campaign stars', value: `${totalCampaignStars} / 150`, Icon: Star, detail: `${Object.keys(stats.campaignStars).length} stages completed` }
            ].map(record => <div key={record.label} className="p-4 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border"><div className="flex gap-2 items-center text-xs font-semibold text-theme-text-secondary"><record.Icon className="w-4 h-4 text-theme-accent" />{record.label}</div><div className="text-xl font-display font-bold mt-2">{record.value}</div><p className="text-[11px] text-theme-text-muted mt-1 leading-relaxed">{record.detail}</p></div>)}
          </section>
          <p className="text-xs text-theme-text-muted text-center">Your progress is saved in this browser.</p>
        </div>
      </div>
    </Modal>
  );
};
