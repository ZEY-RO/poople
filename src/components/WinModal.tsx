import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Step } from '../types/game';
import { Share2, Check, RotateCcw, ArrowRight, Play, Sparkles } from 'lucide-react';
import { soundFx } from '../services/audio';

interface WinModalProps {
  startWord: string;
  targetWord: string;
  history: Step[];
  par: number;
  optimalPath: string[];
  dayNumber?: number;
  onPlayAgain: () => void;
  onNextStage?: () => void;
  hasNextStage?: boolean;
}

export const WinModal: React.FC<WinModalProps> = ({
  startWord,
  targetWord,
  history,
  par,
  optimalPath,
  dayNumber,
  onPlayAgain,
  onNextStage,
  hasNextStage = false
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'comparison' | 'replay'>('summary');
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);

  const stepsTaken = history.length;
  const diffFromPar = stepsTaken - par;

  // Trigger confetti and victory fanfare on mount
  useEffect(() => {
    soundFx.playVictory();

    // Launch multi-stage confetti
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f59e0b', '#fbbf24', '#d97706', '#84cc16']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f59e0b', '#fbbf24', '#d97706', '#84cc16']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  // Replay animation effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isReplaying) {
      interval = setInterval(() => {
        setReplayIndex(prev => {
          if (prev >= history.length - 1) {
            setIsReplaying(false);
            return prev;
          }
          soundFx.playValidStep();
          return prev + 1;
        });
      }, 650);
    }
    return () => clearInterval(interval);
  }, [isReplaying, history.length]);

  const getRankBadge = () => {
    if (diffFromPar <= 0) {
      return { title: '👑 GOLDEN FLUSH', color: 'from-amber-400 to-yellow-500 text-stone-950', desc: 'Flawless! Matched Par exactly!' };
    }
    if (diffFromPar === 1) {
      return { title: '🥇 ROYAL FLUSHER', color: 'from-amber-500 to-amber-600 text-white', desc: 'Outstanding! Just 1 step above Par.' };
    }
    if (diffFromPar === 2) {
      return { title: '🥈 CLEAN PIPES', color: 'from-stone-400 to-stone-500 text-white', desc: 'Solid run! 2 steps above Par.' };
    }
    return { title: '🥉 APPRENTICE PLUNGER', color: 'from-amber-700 to-stone-800 text-amber-100', desc: 'Cleared the drain successfully!' };
  };

  const rank = getRankBadge();

  const handleShare = async () => {
    soundFx.playKey();
    let title = `POOPLE`;
    if (dayNumber) title += ` Daily #${dayNumber}`;
    title += ` 🧻\n`;

    const stars = diffFromPar <= 0 ? '⭐️⭐️⭐️' : diffFromPar <= 2 ? '⭐️⭐️' : '⭐️';
    const body = `${startWord} ➔ ${targetWord}\n${stepsTaken} Steps (Par ${par}) ${stars}\n\n`;

    // Emoji ladder visualization
    let emojiLadder = '🟨🟨🟨🟨 (START)\n';
    history.forEach((step, idx) => {
      if (idx === history.length - 1) {
        emojiLadder += '🟩🟩🟩🟩 (POOP!)\n';
      } else {
        const row = [0, 1, 2, 3].map(i => (i === step.changedIndex ? '🟫' : '⬜')).join('');
        emojiLadder += `${row}\n`;
      }
    });

    const shareText = `${title}${body}${emojiLadder}\nPlay: https://poople.io`;

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Clipboard copy error', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop">
      <div className="w-full max-w-md bg-theme-modal text-theme-text-primary rounded-3xl shadow-2xl border border-theme-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className={`p-4 bg-gradient-to-r ${rank.color} text-center relative shadow-md`}>
          <span className="text-4xl inline-block animate-bounceShort mb-1">💩✨</span>
          <h2 className="text-xl sm:text-2xl font-display font-black tracking-wide">
            {rank.title}
          </h2>
          <p className="text-xs font-bold opacity-90 mt-0.5">
            {rank.desc}
          </p>
        </div>

        {/* Navigation Tabs (Summary / Comparison / Replay) */}
        <div className="flex border-b border-theme-border/60 bg-theme-modal-subcard">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'summary'
                ? 'border-theme-accent text-theme-accent bg-theme-modal font-black'
                : 'border-transparent text-theme-text-muted hover:text-theme-text-primary'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'comparison'
                ? 'border-theme-accent text-theme-accent bg-theme-modal font-black'
                : 'border-transparent text-theme-text-muted hover:text-theme-text-primary'
            }`}
          >
            Optimal vs Yours
          </button>
          <button
            onClick={() => {
              setActiveTab('replay');
              setReplayIndex(0);
              setIsReplaying(true);
            }}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'replay'
                ? 'border-theme-accent text-theme-accent bg-theme-modal font-black'
                : 'border-transparent text-theme-text-muted hover:text-theme-text-primary'
            }`}
          >
            Replay 🎬
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 overflow-y-auto custom-scrollbar space-y-4 flex-1">
          {activeTab === 'summary' && (
            <>
              {/* Score Metric Cards */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
                  <span className="text-[10px] font-bold text-theme-text-muted block uppercase">
                    Your Steps
                  </span>
                  <span className="text-2xl font-display font-black text-theme-accent">
                    {stepsTaken}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
                  <span className="text-[10px] font-bold text-theme-text-muted block uppercase">
                    Par Target
                  </span>
                  <span className="text-2xl font-display font-black text-theme-text-secondary">
                    {par}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
                  <span className="text-[10px] font-bold text-theme-text-muted block uppercase">
                    Difference
                  </span>
                  <span className={`text-2xl font-display font-black ${diffFromPar <= 0 ? 'text-emerald-500' : 'text-theme-accent'}`}>
                    {diffFromPar <= 0 ? '±0' : `+${diffFromPar}`}
                  </span>
                </div>
              </div>

              {/* Ladder Journey Pills */}
              <div className="p-3 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
                <span className="text-xs font-bold text-theme-text-primary block mb-2">
                  Your Path:
                </span>
                <div className="flex flex-wrap items-center gap-1 font-mono text-xs font-bold">
                  <span className="px-2 py-1 rounded-lg bg-theme-bg-secondary text-theme-accent border border-theme-border/50">
                    {startWord}
                  </span>
                  {history.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <ArrowRight className="w-3 h-3 text-theme-text-muted" />
                      <span className={`px-2 py-1 rounded-lg ${
                        step.word === targetWord
                          ? 'bg-theme-accent text-theme-accent-text shadow-sm'
                          : 'bg-theme-bg-card text-theme-text-primary border border-theme-border/60'
                      }`}>
                        {step.word}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'comparison' && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Left: Your Path */}
              <div className="p-3 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
                <div className="font-bold text-theme-text-primary mb-2 flex items-center justify-between">
                  <span>Your Steps ({stepsTaken})</span>
                </div>
                <div className="space-y-1.5 font-mono font-bold">
                  <div className="p-1 rounded bg-theme-bg-secondary text-center text-theme-text-secondary border border-theme-border/40">{startWord}</div>
                  {history.map((s, i) => (
                    <div key={i} className={`p-1 rounded text-center ${s.word === targetWord ? 'bg-theme-accent text-theme-accent-text font-black' : 'bg-theme-bg-card text-theme-text-primary border border-theme-border/60'}`}>
                      {s.word}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Optimal BFS Shortest Path */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="font-bold text-emerald-500 mb-2 flex items-center justify-between">
                  <span>Optimal Route ({par})</span>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="space-y-1.5 font-mono font-bold">
                  {optimalPath.map((w, i) => (
                    <div key={i} className={`p-1 rounded text-center ${i === 0 ? 'bg-theme-bg-secondary text-theme-text-secondary' : i === optimalPath.length - 1 ? 'bg-emerald-500 text-white font-black' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'}`}>
                      {w}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'replay' && (
            <div className="text-center p-3 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
              <div className="text-xs font-bold text-theme-text-muted mb-3">
                Step {replayIndex + 1} of {history.length}
              </div>

              <div className="flex justify-center gap-2 mb-4">
                {(replayIndex >= 0 ? history[replayIndex].word : startWord).split('').map((char, idx) => (
                  <div
                    key={idx}
                    className="w-14 h-16 flex items-center justify-center font-display font-black text-3xl rounded-2xl bg-theme-accent text-theme-accent-text shadow-lg animate-pop"
                  >
                    {char}
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setReplayIndex(0);
                  setIsReplaying(true);
                }}
                className="px-4 py-2 rounded-xl bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-text text-xs font-bold flex items-center justify-center gap-1.5 mx-auto btn-press shadow-sm"
              >
                <Play className="w-3.5 h-3.5" />
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-theme-modal-subcard border-t border-theme-border/60 flex flex-col sm:flex-row gap-2">
          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-black text-sm shadow-md flex items-center justify-center gap-2 btn-press"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Share Score 🧻'}</span>
          </button>

          {/* Next Stage (in Campaign) or Play Again */}
          {hasNextStage && onNextStage ? (
            <button
              onClick={() => {
                soundFx.playFlush();
                onNextStage();
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-text font-display font-black text-sm shadow-md flex items-center justify-center gap-2 btn-press"
            >
              <span>Next Stage</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                soundFx.playFlush();
                onPlayAgain();
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-text font-display font-black text-sm shadow-md flex items-center justify-center gap-2 btn-press"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
