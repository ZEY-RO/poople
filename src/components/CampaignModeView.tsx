import React, { useState } from 'react';
import { CAMPAIGN_STAGES } from '../engine/campaign';
import { CampaignStage } from '../types/game';
import { Trophy, Star, Lock } from 'lucide-react';
import { soundFx } from '../services/audio';

interface CampaignModeViewProps {
  currentStageId?: number;
  completedStars: Record<number, number>; // stageId -> 1..3
  onSelectStage: (stage: CampaignStage) => void;
}

export const CampaignModeView: React.FC<CampaignModeViewProps> = ({
  currentStageId,
  completedStars,
  onSelectStage
}) => {
  const [selectedChapter, setSelectedChapter] = useState<number>(1);

  // Calculate total stars collected
  const totalStars = Object.values(completedStars).reduce((acc, s) => acc + s, 0);
  const maxPossibleStars = CAMPAIGN_STAGES.length * 3;

  // Group stages by 10 per chapter
  const chapters = [
    { num: 1, title: 'Chapter 1: The Porcelain Basics', stages: CAMPAIGN_STAGES.slice(0, 10) },
    { num: 2, title: "Chapter 2: The Plumber's Apprentice", stages: CAMPAIGN_STAGES.slice(10, 20) },
    { num: 3, title: 'Chapter 3: The Porcelain Labyrinth', stages: CAMPAIGN_STAGES.slice(20, 30) },
    { num: 4, title: 'Chapter 4: Pipe Dreams & Obstacles', stages: CAMPAIGN_STAGES.slice(30, 40) },
    { num: 5, title: 'Chapter 5: Grandmaster Commode', stages: CAMPAIGN_STAGES.slice(40, 50) }
  ];

  const currentChapterObj = chapters.find(c => c.num === selectedChapter) || chapters[0];

  const isStageUnlocked = (stageId: number): boolean => {
    if (stageId === 1) return true;
    const prevStars = completedStars[stageId - 1];
    return prevStars !== undefined && prevStars > 0;
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-2">
      {/* Campaign Header Summary */}
      <div className="p-3 rounded-2xl bg-theme-bg-secondary border border-theme-border shadow-sm flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-theme-accent text-theme-accent-text shadow-sm">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-display font-black text-theme-text-primary">
              The Gauntlet (50 Stages)
            </h2>
            <p className="text-[11px] font-semibold text-theme-text-muted">
              Earn 3 stars per stage by matching Par!
            </p>
          </div>
        </div>

        {/* Stars Tally Badge */}
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-theme-accent/15 border border-theme-accent/30">
          <Star className="w-4 h-4 text-theme-accent fill-theme-accent" />
          <span className="font-display font-black text-xs text-theme-text-primary">
            {totalStars} / {maxPossibleStars}
          </span>
        </div>
      </div>

      {/* Chapter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2 no-scrollbar">
        {chapters.map(c => {
          const isSelected = selectedChapter === c.num;
          return (
            <button
              key={c.num}
              onClick={() => {
                soundFx.playKey();
                setSelectedChapter(c.num);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all btn-press ${
                isSelected
                  ? 'bg-theme-accent text-theme-accent-text font-black shadow-sm'
                  : 'bg-theme-bg-card text-theme-text-secondary border border-theme-border/60 hover:bg-theme-bg-muted'
              }`}
            >
              Ch. {c.num}
            </button>
          );
        })}
      </div>

      {/* Chapter Title */}
      <div className="text-xs font-bold text-theme-text-primary mb-2 px-1">
        {currentChapterObj.title}
      </div>

      {/* Stages Grid */}
      <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto custom-scrollbar p-1">
        {currentChapterObj.stages.map(stage => {
          const unlocked = isStageUnlocked(stage.id);
          const stars = completedStars[stage.id] || 0;
          const isCurrent = currentStageId === stage.id;

          return (
            <button
              key={stage.id}
              disabled={!unlocked}
              onClick={() => {
                soundFx.playFlush();
                onSelectStage(stage);
              }}
              className={`p-3 rounded-2xl border text-left transition-all btn-press relative overflow-hidden ${
                !unlocked
                  ? 'bg-theme-bg-secondary/40 border-theme-border/40 opacity-50 cursor-not-allowed'
                  : isCurrent
                  ? 'bg-theme-accent text-theme-accent-text border-theme-accent shadow-md scale-102 font-black'
                  : 'bg-theme-bg-card text-theme-text-primary border border-theme-border/60 hover:border-theme-accent hover:bg-theme-bg-muted'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold opacity-75">
                  Stage {stage.id}
                </span>
                {!unlocked ? (
                  <Lock className="w-3.5 h-3.5 opacity-40" />
                ) : (
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map(sIdx => (
                      <Star
                        key={sIdx}
                        className={`w-3 h-3 ${
                          sIdx <= stars
                            ? 'text-theme-accent fill-theme-accent'
                            : 'opacity-20'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="text-xs font-display font-black truncate mt-1">
                {stage.name}
              </div>

              <div className="flex items-center justify-between mt-2 text-[10px] font-semibold">
                <span className="font-mono bg-theme-bg-secondary text-theme-accent px-1.5 py-0.5 rounded border border-theme-border/50">
                  {stage.startWord} ➔ {stage.targetWord}
                </span>
                <span className="opacity-75">Par: {stage.par}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
