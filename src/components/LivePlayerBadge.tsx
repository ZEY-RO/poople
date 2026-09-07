import React, { useState, useRef, useEffect } from 'react';
import { Users, WifiOff, ChevronDown, Flame, Calendar, Zap, Bot, Trophy } from 'lucide-react';
import { useLivePlayerCount } from '../services/liveCounter';

import { GameMode } from '../types/game';

interface LivePlayerBadgeProps {
  currentMode?: GameMode;
  className?: string;
}

export const LivePlayerBadge: React.FC<LivePlayerBadgeProps> = ({ currentMode = 'daily', className = '' }) => {
  const { stats, isOnline } = useLivePlayerCount(currentMode);
  const [isOpen, setIsOpen] = useState(false);
  const [flashDelta, setFlashDelta] = useState<'up' | 'down' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevTotalRef = useRef<number>(stats.total);

  // Flash animation on number change
  useEffect(() => {
    if (prevTotalRef.current !== stats.total) {
      if (stats.total > prevTotalRef.current) {
        setFlashDelta('up');
      } else if (stats.total < prevTotalRef.current) {
        setFlashDelta('down');
      }
      prevTotalRef.current = stats.total;

      const timer = setTimeout(() => {
        setFlashDelta(null);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [stats.total]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Live Status Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-300 select-none btn-press shadow-sm border ${
          isOnline
            ? 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
            : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500'
        }`}
        title="Click to view live mode activity breakdown"
        aria-label="Live players online"
        aria-expanded={isOpen}
      >
        {isOnline ? (
          <>
            {/* Pulsing Live Dot */}
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>

            {/* Number with subtle directional tick */}
            <span
              className={`font-black tabular-nums transition-colors duration-300 ${
                flashDelta === 'up'
                  ? 'text-emerald-500 font-extrabold scale-105'
                  : flashDelta === 'down'
                  ? 'text-amber-500 font-extrabold'
                  : ''
              }`}
            >
              {stats.total.toLocaleString()}
            </span>

            <span className="font-semibold text-theme-text-muted tracking-tight">
              playing live
            </span>

            <ChevronDown
              className={`w-3 h-3 text-theme-text-muted transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-emerald-500' : 'group-hover:translate-y-0.5'
              }`}
            />
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 text-zinc-400" />
            <span className="text-zinc-500 font-semibold">Offline Mode</span>
          </>
        )}
      </button>

      {/* Popover Breakdown */}
      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 p-3.5 rounded-2xl bg-theme-modal text-theme-text-primary shadow-2xl border border-theme-border z-40 backdrop-blur-md animate-pop">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-theme-border/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-theme-text-primary">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span>Worldwide Solvers</span>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-500 px-1.5 py-0.5 rounded-full bg-emerald-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>

          {/* Breakdown by game mode */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-1.5 rounded-xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
              <div className="flex items-center gap-1.5 font-medium text-theme-text-secondary">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Unlimited</span>
              </div>
              <span className="font-bold tabular-nums text-theme-text-primary">
                {stats.byMode.unlimited.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
              <div className="flex items-center gap-1.5 font-medium text-theme-text-secondary">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Daily Challenge</span>
              </div>
              <span className="font-bold tabular-nums text-theme-text-primary">
                {stats.byMode.daily.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
              <div className="flex items-center gap-1.5 font-medium text-theme-text-secondary">
                <Zap className="w-3.5 h-3.5 text-yellow-500" />
                <span>Poop Rush</span>
              </div>
              <span className="font-bold tabular-nums text-theme-text-primary">
                {stats.byMode.rush.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
              <div className="flex items-center gap-1.5 font-medium text-theme-text-secondary">
                <Bot className="w-3.5 h-3.5 text-purple-500" />
                <span>Versus Bot</span>
              </div>
              <span className="font-bold tabular-nums text-theme-text-primary">
                {stats.byMode.versus.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
              <div className="flex items-center gap-1.5 font-medium text-theme-text-secondary">
                <Trophy className="w-3.5 h-3.5 text-emerald-500" />
                <span>The Gauntlet</span>
              </div>
              <span className="font-bold tabular-nums text-theme-text-primary">
                {stats.byMode.campaign.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-theme-border/60 text-center">
            <p className="text-[10px] text-theme-text-muted">
              {stats.isRealtime
                ? '🟢 100% Real-time presence via Supabase WebSockets'
                : 'Synchronized real-time across active browser sessions'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
