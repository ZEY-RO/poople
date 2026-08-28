import React from 'react';
import { GameMode } from '../types/game';
import { HelpCircle, BarChart2, Settings, Volume2, VolumeX, Sparkles, Trophy, Zap, Users, Calendar, Infinity, PlusCircle } from 'lucide-react';
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

  return (
    <header className="w-full max-w-2xl mx-auto px-4 py-3 border-b border-amber-200/40 dark:border-slate-700">
      {/* Top bar with title and action buttons */}
      <div className="flex items-center justify-between">
        {/* Left: Help / Tutorial */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => { soundFx.playKey(); onOpenTutorial(); }}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-amber-100/60 dark:hover:bg-slate-800 transition-colors btn-press"
            title="How to Play & Tutorial"
            aria-label="How to play"
          >
            <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={() => { soundFx.playKey(); onOpenCustom(); }}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-amber-100/60 dark:hover:bg-slate-800 transition-colors btn-press hidden sm:flex items-center gap-1 text-xs font-semibold"
            title="Custom Puzzle Builder"
          >
            <PlusCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="hidden md:inline">Custom</span>
          </button>
        </div>

        {/* Center: Logo and Brand */}
        <div 
          onClick={() => { soundFx.playDuckSqueak(); }}
          className="flex items-center space-x-2 cursor-pointer group select-none"
          title="Squeeze the duck!"
        >
          <span className="text-3xl sm:text-4xl animate-bounceShort group-hover:scale-125 transition-transform inline-block">
            💩
          </span>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-wider text-amber-900 dark:text-amber-300 flex items-center justify-center gap-1">
              POOPLE
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '8s' }} />
            </h1>
            <p className="text-[10px] sm:text-xs font-bold tracking-widest text-amber-700/80 dark:text-amber-400 uppercase">
              Word Ladder to POOP
            </p>
          </div>
        </div>

        {/* Right: Sound, Stats, Settings */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => { soundFx.playKey(); onToggleSound(); }}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-amber-100/60 dark:hover:bg-slate-800 transition-colors btn-press"
            title={soundEnabled ? "Mute Sounds" : "Enable Sounds"}
            aria-label="Sound toggle"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" /> : <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-stone-400" />}
          </button>
          <button
            onClick={() => { soundFx.playKey(); onOpenStats(); }}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-amber-100/60 dark:hover:bg-slate-800 transition-colors btn-press"
            title="Statistics & Streaks"
            aria-label="Statistics"
          >
            <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={() => { soundFx.playKey(); onOpenSettings(); }}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-amber-100/60 dark:hover:bg-slate-800 transition-colors btn-press"
            title="Themes & Settings"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Mode navigation tabs */}
      <div className="mt-3 flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
        {modes.map(mode => {
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => {
                if (currentMode !== mode.id) {
                  soundFx.playKey();
                  onSelectMode(mode.id);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap btn-press ${
                isActive
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105'
                  : 'bg-amber-100/80 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-amber-200/80 dark:hover:bg-slate-700'
              }`}
            >
              {mode.icon}
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
