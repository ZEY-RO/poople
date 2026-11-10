import React from 'react';
import { GameMode } from '../types/game';
import { HelpCircle, BarChart3, Settings, Volume2, VolumeX, Trophy, Zap, Bot, CalendarDays, Infinity, Plus } from 'lucide-react';
import { soundFx } from '../services/audio';
import { analytics } from '../services/analytics';
import { getModePath } from '../seo/routes';

interface HeaderProps {
  currentMode: GameMode;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenTutorial: () => void;
  onOpenCustom: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentMode, onOpenStats, onOpenSettings, onOpenTutorial, onOpenCustom, soundEnabled, onToggleSound }) => {
  const modes = [
    { id: 'daily', label: 'Daily puzzle', short: 'Daily', icon: CalendarDays },
    { id: 'unlimited', label: 'Unlimited', short: 'Unlimited', icon: Infinity },
    { id: 'rush', label: 'Poop Rush', short: 'Rush', icon: Zap },
    { id: 'versus', label: 'Versus bot', short: 'Versus bot', icon: Bot },
    { id: 'campaign', label: 'The Gauntlet', short: 'Gauntlet', icon: Trophy },
    { id: 'custom', label: 'Create a puzzle', short: 'Create', icon: Plus },
  ] as const;
  return (
    <header className="site-header">
      <div className="brand-bar">
        <a className="brand" href="/">
          <img src={`${import.meta.env.BASE_URL}favicon-96x96.png`} alt="" width="42" height="42" loading="eager" />
          <span><span className="brand-name">poople<span className="text-theme-accent">.</span></span><span className="brand-tagline">A daily dose of wordplay</span></span>
        </a>
        <div className="header-tools">
          <button className="help-button" aria-label="How to play" onClick={onOpenTutorial}><HelpCircle size={17} /><span>How to play</span></button>
          <span className="tool-divider" />
          <button className="icon-button" onClick={onToggleSound} aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'} aria-pressed={soundEnabled} title={soundEnabled ? 'Mute sound' : 'Enable sound'}>{soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}</button>
          <button className="icon-button" onClick={onOpenStats} aria-label="Statistics" title="Your statistics"><BarChart3 size={19} /></button>
          <button className="icon-button" onClick={onOpenSettings} aria-label="Settings" title="Settings"><Settings size={19} /></button>
        </div>
      </div>
      <nav className="mode-navigation" aria-label="Game modes">
        {modes.map(({ id, label, short, icon: Icon }) => {
          const content = <><Icon size={17} /><span className="mode-label">{label}</span><span className="mode-label-short">{short}</span>{currentMode === id && <span className="active-dot" />}</>;
          const className = `mode-tab ${currentMode === id ? 'is-active' : ''}`;
          return id === 'custom'
            ? <button key={id} aria-label={label} className={className} aria-haspopup="dialog" onClick={() => { soundFx.playKey(); onOpenCustom(); }}>{content}</button>
            : <a key={id} href={getModePath(id)} aria-label={label} className={className} aria-current={currentMode === id ? 'page' : undefined} onClick={() => { soundFx.playKey(); analytics.trackModeSwitch(id); }}>{content}</a>;
        })}
      </nav>
    </header>
  );
};
