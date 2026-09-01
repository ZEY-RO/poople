import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameMode } from '../types/game';
import { HelpCircle, BarChart2, Settings, Volume2, VolumeX, Sparkles, Trophy, Zap, Users, Calendar, Infinity, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { soundFx } from '../services/audio';

interface HeaderProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenTutorial: () => void;
  onOpenCustom: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  onOpenStats,
  onOpenSettings,
  onOpenTutorial,
  onOpenCustom,
  soundEnabled,
  onToggleSound
}) => {
  const modes: Array<{ id: GameMode; label: string; icon: React.ReactNode }> = [
    { id: 'daily', label: 'Daily', icon: <Calendar className="w-4 h-4" /> },
    { id: 'unlimited', label: 'Unlimited', icon: <Infinity className="w-4 h-4" /> },
    { id: 'rush', label: 'Rush ⚡', icon: <Zap className="w-4 h-4 text-amber-500" /> },
    { id: 'versus', label: 'Vs Bot 🤖', icon: <Users className="w-4 h-4 text-sky-500" /> },
    { id: 'campaign', label: 'Gauntlet 🏆', icon: <Trophy className="w-4 h-4 text-yellow-500" /> },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Monitor scroll bounds to conditionally show left/right arrow buttons
  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  // Auto-scroll active mode into view if partially hidden
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeEl = el.querySelector<HTMLElement>('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [currentMode]);

  const scrollByAmount = (offset: number) => {
    if (scrollRef.current) {
      soundFx.playKey();
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Allow standard vertical mouse wheel to scroll horizontal modes bar
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <header className="w-full max-w-2xl mx-auto px-4 py-3 border-b border-theme-border/60">
      {/* Top bar with title and action buttons */}
      <div className="flex items-center justify-between">
        {/* Left: Help / Tutorial */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => { soundFx.playKey(); onOpenTutorial(); }}
            className="p-2 rounded-xl text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-secondary transition-colors btn-press"
            title="How to Play & Tutorial"
            aria-label="How to play"
          >
            <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={() => { soundFx.playKey(); onOpenCustom(); }}
            className="p-2 rounded-xl text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-secondary transition-colors btn-press hidden sm:flex items-center gap-1 text-xs font-semibold"
            title="Custom Puzzle Builder"
          >
            <PlusCircle className="w-5 h-5 text-theme-accent" />
            <span className="hidden md:inline">Custom</span>
          </button>
        </div>

        {/* Center: Logo and Brand */}
        <div 
          onClick={() => { soundFx.playDuckSqueak(); }}
          className="flex items-center space-x-2.5 cursor-pointer group select-none shrink-0"
          title="Squeeze for fun!"
        >
          <div className="relative flex items-center justify-center shrink-0">
            <img 
              src="/logo.png" 
              alt="Poople - Play Unlimited Word Ladder Game Logo" 
              className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-2xl shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 object-cover border border-amber-500/20"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const next = e.currentTarget.nextElementSibling as HTMLElement;
                if (next) next.style.display = 'inline-block';
              }}
            />
            <span className="text-3xl sm:text-4xl animate-bounceShort group-hover:scale-125 transition-transform hidden">
              💩
            </span>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl sm:text-3xl font-display font-black tracking-wider text-theme-text-primary flex items-center gap-1">
                POOPLE
                <Sparkles className="w-4 h-4 text-theme-accent animate-spin" style={{ animationDuration: '8s' }} />
              </h1>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-sm">
                Unlimited
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-bold tracking-widest text-theme-text-muted uppercase">
              Play Unlimited Word Ladder
            </p>
          </div>
        </div>

        {/* Right: Sound, Stats, Settings */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => { soundFx.playKey(); onToggleSound(); }}
            className="p-2 rounded-xl text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-secondary transition-colors btn-press"
            title={soundEnabled ? "Mute Sounds" : "Enable Sounds"}
            aria-label="Sound toggle"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-theme-accent" /> : <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 opacity-40" />}
          </button>
          <button
            onClick={() => { soundFx.playKey(); onOpenStats(); }}
            className="p-2 rounded-xl text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-secondary transition-colors btn-press"
            title="Statistics & Streaks"
            aria-label="Statistics"
          >
            <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={() => { soundFx.playKey(); onOpenSettings(); }}
            className="p-2 rounded-xl text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-secondary transition-colors btn-press"
            title="Themes & Settings"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Mode navigation tabs with scroll chevrons and smooth swipe */}
      <div className="mt-3 relative flex items-center w-full">
        {/* Left Scroll Chevron */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByAmount(-140)}
            aria-label="Scroll modes left"
            className="absolute left-0 z-20 p-1.5 rounded-full bg-theme-bg-card/95 hover:bg-theme-bg-secondary border border-theme-border shadow-lg text-theme-text-primary backdrop-blur-md transition-all -translate-x-1 sm:-translate-x-2 btn-press"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Scrollable Modes Track */}
        <div
          ref={scrollRef}
          onWheel={handleWheel}
          className="flex-1 flex items-center overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 sm:px-2 gap-1.5 sm:gap-2 justify-start sm:justify-center touch-pan-x"
        >
          {modes.map(mode => {
            const isActive = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                data-active={isActive ? "true" : "false"}
                onClick={() => {
                  if (currentMode !== mode.id) {
                    soundFx.playKey();
                    onSelectMode(mode.id);
                  }
                }}
                className={`shrink-0 relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap btn-press select-none ${
                  isActive
                    ? 'bg-theme-nav-active text-theme-nav-active shadow-md scale-105 font-black ring-2 ring-amber-500/30'
                    : 'bg-theme-nav-inactive text-theme-nav-inactive hover:opacity-90'
                }`}
              >
                {mode.icon}
                <span>{mode.label}</span>
                {mode.id === 'unlimited' && (
                  <span className={`text-[9px] px-1 py-0.5 rounded font-black tracking-tight uppercase ${
                    isActive ? 'bg-amber-500 text-white' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  }`}>
                    No Limit
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Scroll Chevron */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByAmount(140)}
            aria-label="Scroll modes right"
            className="absolute right-0 z-20 p-1.5 rounded-full bg-theme-bg-card/95 hover:bg-theme-bg-secondary border border-theme-border shadow-lg text-theme-text-primary backdrop-blur-md transition-all translate-x-1 sm:translate-x-2 btn-press"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
