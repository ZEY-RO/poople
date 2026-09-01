import React from 'react';
import { GameSettings, ThemeId, SoundProfile, KeyboardLayout } from '../types/game';
import { Settings, Volume2, Palette, Keyboard, ShieldAlert, X, Check, Sparkles, RotateCcw } from 'lucide-react';
import { soundFx } from '../services/audio';
import { applyTheme } from '../services/theme';
import { DEFAULT_SETTINGS } from '../services/storage';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose
}) => {
  const themes: Array<{
    id: ThemeId;
    name: string;
    icon: string;
    desc: string;
    swatches: [string, string, string];
    cardClass: string;
  }> = [
    {
      id: 'classic',
      name: 'Porcelain White',
      icon: '🧻',
      desc: 'Clean porcelain & warm gold',
      swatches: ['#fffdf9', '#d97706', '#fcd34d'],
      cardClass: 'bg-[#fffdf9] text-[#451a03] border-[#fde68a]'
    },
    {
      id: 'poop',
      name: 'Poop Delight',
      icon: '💩',
      desc: 'Chocolate fudge & caramel amber',
      swatches: ['#28170e', '#fb923c', '#84cc16'],
      cardClass: 'bg-[#28170e] text-[#fff7ed] border-[#6e432d]'
    },
    {
      id: 'dark',
      name: 'Midnight Flush',
      icon: '🌙',
      desc: 'Deep navy night & bright gold',
      swatches: ['#0b1120', '#f59e0b', '#10b981'],
      cardClass: 'bg-[#0b1120] text-[#f8fafc] border-[#243556]'
    },
    {
      id: 'retro',
      name: 'Retro 8-Bit',
      icon: '🕹️',
      desc: 'Cyber arcade neon & hot pink',
      swatches: ['#0d0b14', '#00ffcc', '#ff007f'],
      cardClass: 'bg-[#0d0b14] text-[#00ffcc] border-[#00ffcc]'
    },
    {
      id: 'gold',
      name: 'Golden Throne',
      icon: '👑',
      desc: 'Royal obsidian & gleaming gold',
      swatches: ['#12100e', '#eab308', '#22c55e'],
      cardClass: 'bg-[#12100e] text-[#fef08a] border-[#ca8a04]'
    },
    {
      id: 'pastel',
      name: 'Pastel Washroom',
      icon: '🌸',
      desc: 'Sakura pink & candy rose',
      swatches: ['#fff1f2', '#f43f5e', '#34d399'],
      cardClass: 'bg-[#fff1f2] text-[#881337] border-[#fecdd3]'
    }
  ];

  const soundProfiles: Array<{ id: SoundProfile; name: string }> = [
    { id: 'cartoon', name: 'Cartoon & Squeaks' },
    { id: 'arcade', name: '8-Bit Arcade Chiptune' },
    { id: 'clean', name: 'Clean Modern Click' }
  ];

  const keyboardLayouts: Array<{ id: KeyboardLayout; name: string }> = [
    { id: 'qwerty', name: 'QWERTY' },
    { id: 'azerty', name: 'AZERTY' },
    { id: 'dvorak', name: 'Dvorak' },
    { id: 'abc', name: 'Alphabetical (A-Z)' }
  ];

  const update = (partial: Partial<GameSettings>) => {
    const updated = { ...settings, ...partial };
    if (partial.theme) {
      applyTheme(partial.theme);
    }
    onUpdateSettings(updated);
    soundFx.setConfig(updated.soundEnabled, updated.soundVolume, updated.soundProfile);
  };

  const currentThemeObj = themes.find(t => t.id === settings.theme) || themes[0];

  const handleResetDefaults = () => {
    soundFx.playKey();
    applyTheme(DEFAULT_SETTINGS.theme);
    onUpdateSettings(DEFAULT_SETTINGS);
    soundFx.setConfig(DEFAULT_SETTINGS.soundEnabled, DEFAULT_SETTINGS.soundVolume, DEFAULT_SETTINGS.soundProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop">
      <div className="w-full max-w-md bg-theme-modal text-theme-text-primary rounded-3xl shadow-2xl border border-theme-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-theme-border/60 flex items-center justify-between bg-theme-modal-subcard">
          <h2 className="text-lg font-display font-black text-theme-text-primary flex items-center gap-2">
            <Settings className="w-5 h-5 text-theme-accent" />
            Game Settings
          </h2>
          <button
            onClick={() => {
              soundFx.playKey();
              onClose();
            }}
            className="p-1.5 rounded-xl text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-bg-secondary btn-press"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-4 overflow-y-auto custom-scrollbar space-y-5 flex-1">
          {/* Theme Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-theme-text-primary flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-theme-accent" />
                Theme & Aesthetic
              </label>
              <span className="text-[11px] font-bold text-theme-accent">
                {currentThemeObj.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {themes.map(t => {
                const isSelected = settings.theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      soundFx.playKey();
                      update({ theme: t.id });
                    }}
                    className={`p-2.5 rounded-2xl border-2 text-left transition-all btn-press relative overflow-hidden ${t.cardClass} ${
                      isSelected
                        ? 'ring-2 ring-theme-accent border-theme-accent shadow-md scale-102 font-black'
                        : 'opacity-75 hover:opacity-100 hover:scale-101 border-transparent'
                    }`}
                  >
                    {/* Active Checkmark Pill */}
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-theme-accent text-theme-accent-text text-[9px] font-black tracking-wider flex items-center gap-0.5 shadow-sm">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}

                    <span className="text-xl block mb-1">{t.icon}</span>
                    <span className="text-xs font-bold block truncate">{t.name}</span>

                    {/* Color Swatch Dots */}
                    <div className="flex items-center gap-1 mt-1.5">
                      {t.swatches.map((color, idx) => (
                        <span
                          key={idx}
                          className="w-3 h-3 rounded-full border border-black/20 shadow-inner"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Aesthetic Interactive Preview Card */}
            <div className="mt-3 p-3 rounded-2xl bg-theme-bg-secondary border border-theme-border shadow-inner">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-theme-text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-theme-accent" />
                  Realtime Aesthetic Preview
                </span>
                <span className="text-[10px] text-theme-text-muted font-mono uppercase bg-theme-bg-card px-1.5 py-0.5 rounded border border-theme-border/50">
                  {currentThemeObj.name}
                </span>
              </div>

              <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-1">
                {/* Start Tile */}
                <div
                  className="w-10 h-11 sm:w-11 sm:h-12 rounded-xl bg-theme-tile-start-bg text-theme-tile-start-text border-2 border-theme-tile-start-border flex items-center justify-center font-display font-black text-base shadow-sm"
                  title="Start Tile"
                >
                  F
                </div>
                {/* Active/Diff Tile */}
                <div
                  className="w-10 h-11 sm:w-11 sm:h-12 rounded-xl bg-theme-tile-diff-bg text-theme-tile-diff-text border-2 border-theme-tile-diff-border flex items-center justify-center font-display font-black text-base shadow-md"
                  title="Diff Move Tile"
                >
                  O
                </div>
                {/* Correct Goal Tile */}
                <div
                  className="w-10 h-11 sm:w-11 sm:h-12 rounded-xl bg-theme-tile-correct-bg text-theme-tile-correct-text border-2 border-theme-tile-correct-border flex items-center justify-center font-display font-black text-base shadow-md glow-theme"
                  title="POOP Goal Tile"
                >
                  P
                </div>
                {/* Virtual Key */}
                <div
                  className="px-3 h-11 sm:h-12 rounded-xl bg-theme-key-special-bg text-theme-key-special-text border-2 border-theme-key-special-border flex items-center justify-center font-display font-black text-xs shadow-sm"
                  title="Submit Enter Key"
                >
                  ENTER ↵
                </div>
              </div>
            </div>
          </div>

          {/* Sound Settings */}
          <div className="space-y-3 p-3 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-theme-text-primary flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-theme-accent" />
                Sound Effects
              </label>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={e => {
                  const enabled = e.target.checked;
                  update({ soundEnabled: enabled });
                  if (enabled) soundFx.playKey();
                }}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {settings.soundEnabled && (
              <>
                {/* Volume Slider */}
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-theme-text-muted mb-1">
                    <span>Volume</span>
                    <span>{Math.round(settings.soundVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.soundVolume}
                    onChange={e => update({ soundVolume: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Sound Profile */}
                <div>
                  <label className="text-[11px] font-semibold text-theme-text-muted block mb-1">
                    Sound Style
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {soundProfiles.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          update({ soundProfile: p.id });
                          setTimeout(() => soundFx.playKey(), 50);
                        }}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all btn-press ${
                          settings.soundProfile === p.id
                            ? 'bg-theme-accent text-theme-accent-text border-theme-accent font-black shadow-sm'
                            : 'bg-theme-bg-card text-theme-text-secondary border-theme-border/60 hover:bg-theme-bg-secondary'
                        }`}
                      >
                        {p.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Keyboard Layout */}
          <div>
            <label className="text-xs font-bold text-theme-text-primary mb-2 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-theme-accent" />
              Keyboard Layout
            </label>
            <div className="grid grid-cols-2 gap-2">
              {keyboardLayouts.map(k => (
                <button
                  key={k.id}
                  onClick={() => {
                    soundFx.playKey();
                    update({ keyboardLayout: k.id });
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all btn-press ${
                    settings.keyboardLayout === k.id
                      ? 'bg-theme-accent text-theme-accent-text border-theme-accent font-black shadow-sm'
                      : 'bg-theme-bg-card text-theme-text-secondary border-theme-border/60 hover:bg-theme-bg-secondary'
                  }`}
                >
                  {k.name}
                </button>
              ))}
            </div>
          </div>

          {/* Gameplay & Assistance Toggles */}
          <div className="space-y-3 p-3 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border text-xs">
            {/* Dead End Radar */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-theme-text-primary">Dead End Radar</div>
                <div className="text-[11px] text-theme-text-muted">Alerts if current word has no path to POOP</div>
              </div>
              <input
                type="checkbox"
                checked={settings.showDeadEndRadar}
                onChange={e => {
                  soundFx.playKey();
                  update({ showDeadEndRadar: e.target.checked });
                }}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {/* Hard Mode */}
            <div className="flex items-center justify-between border-t border-theme-border/60 pt-2">
              <div>
                <div className="font-bold text-rose-500 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Hard Mode (No Undos)
                </div>
                <div className="text-[11px] text-theme-text-muted">Disables undo and step rewinds</div>
              </div>
              <input
                type="checkbox"
                checked={settings.hardMode}
                onChange={e => {
                  soundFx.playKey();
                  update({ hardMode: e.target.checked });
                }}
                className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer with Save & Close */}
        <div className="p-4 bg-theme-modal-subcard border-t border-theme-border/60 flex items-center justify-between gap-3">
          <button
            onClick={handleResetDefaults}
            className="text-xs font-bold text-theme-text-muted hover:text-theme-text-primary px-2 py-2 rounded-xl transition-all flex items-center gap-1 btn-press"
            title="Reset all settings to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={() => {
              soundFx.playKey();
              onClose();
            }}
            className="flex-1 max-w-[200px] py-2.5 px-4 rounded-xl bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-text font-display font-black text-sm shadow-md flex items-center justify-center gap-2 btn-press"
          >
            <Check className="w-4 h-4" />
            <span>Save & Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
