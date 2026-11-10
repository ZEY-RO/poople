import React, { useState, useRef, useEffect } from 'react';
import { Users, WifiOff, ChevronDown } from 'lucide-react';
import { useLivePlayerCount } from '../services/liveCounter';
import { GameMode } from '../types/game';

interface LivePlayerBadgeProps { currentMode?: GameMode; className?: string }

export const LivePlayerBadge: React.FC<LivePlayerBadgeProps> = ({ currentMode = 'daily', className = '' }) => {
  const { stats, isOnline } = useLivePlayerCount(currentMode);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const dismiss = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsOpen(false); };
    document.addEventListener('mousedown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [isOpen]);
  const isLive = isOnline && stats.isRealtime;
  const label = isLive ? `${stats.total.toLocaleString()} playing live` : isOnline ? 'Live count unavailable' : 'Offline · ready to play';
  const modes = [['Unlimited', stats.byMode.unlimited], ['Daily challenge', stats.byMode.daily], ['Poop Rush', stats.byMode.rush], ['Versus bot', stats.byMode.versus], ['The Gauntlet', stats.byMode.campaign]] as const;
  return <div ref={containerRef} className={`relative inline-block ${className}`}>
    <button type="button" onClick={() => setIsOpen(value => !value)} aria-label={label} aria-expanded={isOpen} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${isLive ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600' : 'bg-theme-bg-secondary border-theme-border text-theme-text-muted'}`}>
      {isLive ? <Users className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
      <span>{label}</span><ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] p-4 rounded-2xl bg-theme-modal text-theme-text-primary shadow-xl border border-theme-border z-40">
      <p className="text-sm font-bold">{isLive ? 'Solvers online now' : 'Keep your ladder going'}</p>
      {isLive ? <div className="mt-3 space-y-2 text-xs">{modes.map(([name, count]) => <div key={name} className="flex justify-between gap-3"><span className="text-theme-text-secondary">{name}</span><span className="font-semibold tabular-nums">{count}</span></div>)}</div>
        : <p className="mt-2 text-xs leading-relaxed text-theme-text-secondary">{isOnline ? 'The worldwide player count is unavailable. All game modes still work.' : 'Your connection is offline. All puzzles and saved progress remain available on this device.'}</p>}
    </div>}
  </div>;
};
