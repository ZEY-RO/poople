import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Step } from '../types/game';
import { Share2, Check, RotateCcw, ArrowRight, Play, Star, X } from 'lucide-react';
import { soundFx } from '../services/audio';
import { loadSettings } from '../services/storage';
import { copyText } from '../services/clipboard';
import { Modal } from './Modal';

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
  onClose?: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({ startWord, targetWord, history, par, optimalPath, dayNumber, onPlayAgain, onNextStage, hasNextStage = false, onClose }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'comparison' | 'replay'>('summary');
  const [replayIndex, setReplayIndex] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [manualShare, setManualShare] = useState('');
  const words = useMemo(() => [startWord, ...history.map(step => step.word)], [startWord, history]);
  const steps = history.length;
  const difference = steps - par;
  const stars = difference <= 0 ? 3 : difference <= 2 ? 2 : 1;
  const title = difference <= 0 ? 'A perfect flush.' : 'You made it.';

  useEffect(() => {
    if (loadSettings().reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    confetti({ particleCount: 80, spread: 65, origin: { y: 0.55 }, colors: ['#315e42', '#a8c68c', '#d9b45b'], disableForReducedMotion: true });
    return () => { confetti.reset(); };
  }, []);

  useEffect(() => {
    if (!isReplaying || activeTab !== 'replay') return;
    const timer = setInterval(() => setReplayIndex(index => {
      if (index >= words.length - 1) {
        setIsReplaying(false);
        return index;
      }
      soundFx.playValidStep();
      return index + 1;
    }), 650);
    return () => clearInterval(timer);
  }, [isReplaying, activeTab, words.length]);

  const handleShare = async () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('analytics');
    url.searchParams.delete('admin');
    url.hash = '';
    if (!dayNumber) {
      url.search = '';
      url.searchParams.set('start', startWord);
      url.searchParams.set('target', targetWord);
    }
    const ladder = history.map(step => step.word === targetWord ? '🟩🟩🟩🟩' : [0, 1, 2, 3].map(index => index === step.changedIndex ? '🟨' : '⬜').join(''));
    const shareText = `POOPLE${dayNumber ? ` Daily #${dayNumber}` : ''}\n${startWord} → ${targetWord}\n${steps} ${steps === 1 ? 'move' : 'moves'} · Par ${par}\n\n🟫🟫🟫🟫\n${ladder.join('\n')}\n\n${url.toString()}`;
    setCopyStatus('idle');
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    const copied = await copyText(shareText);
    setCopyStatus(copied ? 'copied' : 'failed');
    if (!copied) setManualShare(shareText);
  };

  return (
    <Modal label="Puzzle complete" onClose={onClose}>
      <div className="bg-theme-modal text-theme-text-primary rounded-3xl shadow-2xl border border-theme-border overflow-hidden flex flex-col max-h-[90dvh]">
        <div className="p-6 pb-5 text-center relative bg-theme-modal-subcard border-b border-theme-border">
          {onClose && <button onClick={onClose} aria-label="Close results" className="absolute top-3 right-3 p-2 rounded-xl text-theme-text-muted hover:bg-theme-bg-secondary"><X className="w-5 h-5" /></button>}
          <div className="flex items-center justify-center gap-1 mb-3" aria-label={`${stars} out of 3 stars`}>{[1, 2, 3].map(star => <Star key={star} aria-hidden="true" className={`w-6 h-6 ${star <= stars ? 'fill-theme-accent text-theme-accent' : 'text-theme-border'}`} />)}</div>
          <h2 className="text-3xl font-display font-bold">{title}</h2>
          <p className="text-sm text-theme-text-secondary mt-2">{difference <= 0 ? 'The shortest path. Beautifully done.' : `${startWord} to ${targetWord}, one good move at a time.`}</p>
        </div>
        <div className="grid grid-cols-3 border-b border-theme-border" aria-label="Results views">
          {([{ id: 'summary', label: 'Summary' }, { id: 'comparison', label: 'Compare paths' }, { id: 'replay', label: 'Replay' }] as const).map(tab => <button key={tab.id} aria-pressed={activeTab === tab.id} onClick={() => { setActiveTab(tab.id); setIsReplaying(false); if (tab.id === 'replay') { setReplayIndex(0); setIsReplaying(true); } }} className={`py-3 text-xs font-semibold border-b-2 ${activeTab === tab.id ? 'border-theme-accent text-theme-accent bg-theme-modal-subcard' : 'border-transparent text-theme-text-muted'}`}>{tab.label}</button>)}
        </div>
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'summary' && <>
            <div className="grid grid-cols-3 gap-3 text-center">{[{ label: 'Your moves', value: steps }, { label: 'Par', value: par }, { label: 'Over par', value: difference > 0 ? `+${difference}` : '0' }].map(metric => <div key={metric.label} className="py-4 rounded-xl bg-theme-modal-subcard border border-theme-modal-subcard-border"><div className="text-2xl font-display font-bold text-theme-accent">{metric.value}</div><div className="text-[11px] text-theme-text-secondary mt-1">{metric.label}</div></div>)}</div>
            <div className="rounded-2xl border border-theme-border p-4"><h3 className="text-xs font-semibold text-theme-text-secondary mb-3">Your path</h3><div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">{words.map((word, index) => <React.Fragment key={index}>{index > 0 && <ArrowRight aria-hidden="true" className="w-3 h-3 text-theme-text-muted" />}<span className={`px-2 py-1.5 rounded-lg ${word === targetWord ? 'bg-theme-accent text-theme-accent-text' : 'bg-theme-bg-secondary text-theme-text-primary'}`}>{word}</span></React.Fragment>)}</div></div>
          </>}
          {activeTab === 'comparison' && <div className="grid grid-cols-2 gap-3">{[{ title: `Your path · ${steps}`, path: words }, { title: `Shortest · ${par}`, path: optimalPath }].map(route => <div key={route.title} className="p-3 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border"><h3 className="text-xs font-semibold text-theme-text-secondary mb-3">{route.title}</h3><ol className="space-y-2">{route.path.map((word, index) => <li key={index} className={`py-2 text-center rounded-lg font-mono font-bold text-xs ${word === targetWord ? 'bg-theme-accent text-theme-accent-text' : 'bg-theme-bg-card text-theme-text-primary border border-theme-border'}`}>{word}</li>)}</ol></div>)}</div>}
          {activeTab === 'replay' && <div className="text-center py-3"><p role="status" className="text-xs text-theme-text-muted mb-4">{replayIndex === 0 ? 'Starting word' : `Move ${replayIndex} of ${steps}`}</p><div className="flex justify-center gap-2 mb-5">{(words[replayIndex] || startWord).split('').map((letter, index) => <span key={index} className="w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-mono font-bold bg-theme-accent text-theme-accent-text">{letter}</span>)}</div><button onClick={() => { setReplayIndex(0); setIsReplaying(true); }} className="py-2 px-4 rounded-xl border border-theme-border font-semibold text-sm inline-flex items-center gap-2"><Play className="w-4 h-4" />Replay path</button></div>}
          {copyStatus === 'failed' && <div role="status"><p className="text-xs text-theme-text-secondary mb-2">Copying is unavailable. Select and copy your result below.</p><textarea aria-label="Result to share" readOnly value={manualShare} onFocus={event => event.target.select()} className="w-full h-28 rounded-xl p-3 text-xs bg-theme-bg-secondary text-theme-text-primary border border-theme-border" /></div>}
        </div>
        <p role="status" className="sr-only">{copyStatus === 'copied' ? 'Your result was copied to the clipboard.' : ''}</p>
        <div className="p-5 bg-theme-modal-subcard border-t border-theme-border grid grid-cols-2 gap-3">
          <button onClick={handleShare} className="py-3 px-3 rounded-xl bg-theme-bg-card text-theme-text-primary border border-theme-border font-semibold text-sm flex items-center justify-center gap-2">{copyStatus === 'copied' ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}{copyStatus === 'copied' ? 'Copied!' : 'Share result'}</button>
          <button onClick={() => { soundFx.playFlush(); hasNextStage && onNextStage ? onNextStage() : onPlayAgain(); }} className="py-3 px-3 rounded-xl bg-theme-accent text-theme-accent-text font-bold text-sm flex items-center justify-center gap-2">{hasNextStage && onNextStage ? <><span>Next stage</span><ArrowRight className="w-4 h-4" /></> : <><RotateCcw className="w-4 h-4" /><span>Play again</span></>}</button>
        </div>
      </div>
    </Modal>
  );
};
