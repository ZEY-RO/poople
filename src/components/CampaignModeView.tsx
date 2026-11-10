import React, { useState } from 'react';
import { CAMPAIGN_STAGES } from '../engine/campaign';
import { CampaignStage } from '../types/game';
import { Trophy, Star, Lock, ArrowRight, Check } from 'lucide-react';
import { soundFx } from '../services/audio';

interface CampaignModeViewProps {
  currentStageId?: number;
  completedStars: Record<number, number>;
  onSelectStage: (stage: CampaignStage) => void;
}

const CHAPTER_TITLES = ['The Porcelain Basics', 'The Plumber’s Apprentice', 'The Porcelain Labyrinth', 'Pipe Dreams & Obstacles', 'Grandmaster Commode'];

export const CampaignModeView: React.FC<CampaignModeViewProps> = ({ currentStageId, completedStars, onSelectStage }) => {
  const isStageUnlocked = (stageId: number) => stageId === 1 || (completedStars[stageId] || 0) > 0 || (completedStars[stageId - 1] || 0) > 0;
  const nextStage = CAMPAIGN_STAGES.find(stage => !completedStars[stage.id] && isStageUnlocked(stage.id));
  const initialStageId = currentStageId && !completedStars[currentStageId] ? currentStageId : nextStage?.id || currentStageId || 1;
  const [selectedChapter, setSelectedChapter] = useState(() => Math.ceil(initialStageId / 10));
  const totalStars = CAMPAIGN_STAGES.reduce((total, stage) => total + (completedStars[stage.id] || 0), 0);
  const completedCount = CAMPAIGN_STAGES.filter(stage => (completedStars[stage.id] || 0) > 0).length;
  const stages = CAMPAIGN_STAGES.slice((selectedChapter - 1) * 10, selectedChapter * 10);
  const selectStage = (stage: CampaignStage) => { soundFx.playKey(); onSelectStage(stage); };

  return (
    <section className="w-full max-w-lg mx-auto px-4 py-3" aria-label="Campaign stage selection">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-display font-bold flex items-center gap-2"><Trophy className="w-5 h-5 text-theme-accent" />The Gauntlet</h2>
          <p className="text-xs text-theme-text-muted mt-1">50 ladders. Five chapters. One way up.</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-theme-bg-secondary text-xs font-semibold shrink-0" aria-label={`${totalStars} of ${CAMPAIGN_STAGES.length * 3} stars earned`}><Star className="w-4 h-4 text-theme-accent fill-theme-accent" />{totalStars}<span className="font-normal text-theme-text-muted">/ {CAMPAIGN_STAGES.length * 3}</span></div>
      </div>
      <div className="h-1.5 rounded-full bg-theme-bg-secondary overflow-hidden" role="progressbar" aria-label="Campaign completion" aria-valuemin={0} aria-valuemax={CAMPAIGN_STAGES.length} aria-valuenow={completedCount}><div className="h-full bg-theme-accent rounded-full" style={{ width: `${completedCount / CAMPAIGN_STAGES.length * 100}%` }} /></div>
      <div className="flex items-center justify-between gap-2 mt-2 mb-4"><span className="text-[11px] text-theme-text-muted">{completedCount} of {CAMPAIGN_STAGES.length} stages complete</span>{nextStage && <button type="button" onClick={() => selectStage(nextStage)} className="text-xs font-semibold text-theme-accent flex items-center gap-1 min-h-8">{completedCount ? 'Continue' : 'Start stage 1'}<ArrowRight className="w-3.5 h-3.5" /></button>}</div>
      <div className="flex gap-1 p-1 mb-4 rounded-xl bg-theme-bg-secondary" role="group" aria-label="Campaign chapters">
        {CHAPTER_TITLES.map((title, index) => <button type="button" key={title} aria-pressed={selectedChapter === index + 1} title={`Chapter ${index + 1}: ${title}`} onClick={() => { soundFx.playKey(); setSelectedChapter(index + 1); }} className={`flex-1 min-h-10 rounded-lg text-xs font-medium btn-press ${selectedChapter === index + 1 ? 'bg-theme-bg-card text-theme-accent shadow-sm' : 'text-theme-text-muted hover:text-theme-text-primary'}`}><span className="hidden sm:inline">Chapter </span>{index + 1}</button>)}
      </div>
      <h3 className="text-sm font-semibold mb-1">{CHAPTER_TITLES[selectedChapter - 1]}</h3>
      <p className="text-[11px] text-theme-text-muted mb-3">Match par for 3 stars. Complete a stage to unlock the next.</p>
      <div className="grid grid-cols-2 gap-2.5">
        {stages.map(stage => {
          const unlocked = isStageUnlocked(stage.id);
          const stars = completedStars[stage.id] || 0;
          const isCurrent = currentStageId === stage.id;
          return (
            <button type="button" key={stage.id} disabled={!unlocked} onClick={() => selectStage(stage)} aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Stage ${stage.id}: ${stage.name}, ${stage.startWord} to ${stage.targetWord}, par ${stage.par}${!unlocked ? ', locked' : stars ? `, ${stars} stars earned` : ''}`}
              className={`p-3 rounded-xl border text-left min-w-0 btn-press transition-colors ${!unlocked ? 'bg-theme-bg-secondary border-theme-border text-theme-text-muted opacity-60 cursor-not-allowed' : isCurrent ? 'bg-theme-accent-light border-theme-accent text-theme-text-primary' : 'bg-theme-bg-card border-theme-border hover:border-theme-accent'}`}>
              <div className="flex items-center justify-between gap-1 mb-2"><span className="text-[10px] text-theme-text-muted font-medium">STAGE {String(stage.id).padStart(2, '0')}</span>{!unlocked ? <Lock className="w-3 h-3" /> : stars > 0 ? <Check className="w-3.5 h-3.5 text-theme-accent" /> : null}</div>
              <p className="text-xs font-semibold truncate" title={stage.name}>{stage.name}</p>
              <p className="font-mono text-[11px] text-theme-text-secondary mt-2">{stage.startWord}<span className="mx-1 text-theme-text-muted">→</span>{stage.targetWord}</p>
              <div className="flex items-center justify-between gap-1 mt-3"><span className="flex gap-0.5" aria-hidden="true">{[1, 2, 3].map(star => <Star key={star} className={`w-3 h-3 ${star <= stars ? 'text-theme-accent fill-theme-accent' : 'text-theme-border'}`} />)}</span><span className="text-[10px] text-theme-text-muted">Par {stage.par}</span></div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
