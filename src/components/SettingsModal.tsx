import React from 'react';
import { GameSettings, ThemeId, SoundProfile, KeyboardLayout } from '../types/game';
import { Settings, Volume2, Palette, Keyboard, ShieldAlert, X } from 'lucide-react';
import { soundFx } from '../services/audio';

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
  const themes: Array<{ id: ThemeId; name: string; icon: string; previewClass: string }> = [
    { id: 'classic', name: 'Porcelain White', icon: '🧻', previewClass: 'bg-amber-50 border-amber-300' },
    { id: 'poop', name: 'Poop Delight', icon: '💩', previewClass: 'bg-[#3b2416] border-[#784c32] text-amber-100' },
    { id: 'dark', name: 'Midnight Flush', icon: '🌙', previewClass: 'bg-slate-900 border-slate-700 text-white' },
    { id: 'retro', name: 'Retro 8-Bit', icon: '🕹️', previewClass: 'bg-[#121019] border-[#00ffcc] text-[#00ffcc]' },
    { id: 'gold', name: 'Golden Throne', icon: '👑', previewClass: 'bg-stone-900 border-yellow-500 text-yellow-300' },
    { id: 'pastel', name: 'Pastel Washroom', icon: '🌸', previewClass: 'bg-pink-50 border-pink-300 text-pink-900' }
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
    onUpdateSettings(updated);
    soundFx.setConfig(updated.soundEnabled, updated.soundVolume, updated.soundProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-display font-black text-amber-950 dark:text-amber-300 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            Game Settings
          </h2>
          <button
            onClick={() => {
              soundFx.playKey();
              onClose();
            }}
            className="p-1 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-4 overflow-y-auto custom-scrollbar space-y-5 flex-1">
          {/* Theme Selector */}
          <div>
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-2 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-amber-500" />
              Theme & Aesthetic
            </label>
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
                    className={`p-2.5 rounded-2xl border-2 text-left transition-all btn-press ${t.previewClass} ${
                      isSelected ? 'ring-2 ring-amber-500 ring-offset-2 scale-102 font-black' : 'opacity-80'
                    }`}
                  >
                    <span className="text-lg block mb-0.5">{t.icon}</span>
                    <span className="text-xs font-bold block truncate">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound Settings */}
          <div className="space-y-3 p-3 rounded-2xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-amber-500" />
                Sound Effects
              </label>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={e => update({ soundEnabled: e.target.checked })}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {settings.soundEnabled && (
              <>
                {/* Volume Slider */}
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-stone-500 mb-1">
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
                  <label className="text-[11px] font-semibold text-stone-500 block mb-1">
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
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-white dark:bg-slate-700 text-stone-700 dark:text-stone-300 border-stone-200'
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
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-2 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-amber-500" />
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
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-white dark:bg-slate-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-slate-700 hover:bg-stone-50'
                  }`}
                >
                  {k.name}
                </button>
              ))}
            </div>
          </div>

          {/* Gameplay & Assistance Toggles */}
          <div className="space-y-3 p-3 rounded-2xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs">
            {/* Dead End Radar */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-stone-800 dark:text-stone-200">Dead End Radar</div>
                <div className="text-[11px] text-stone-500">Alerts if current word has no path to POOP</div>
              </div>
              <input
                type="checkbox"
                checked={settings.showDeadEndRadar}
                onChange={e => update({ showDeadEndRadar: e.target.checked })}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {/* Hard Mode */}
            <div className="flex items-center justify-between border-t border-stone-200 dark:border-slate-700 pt-2">
              <div>
                <div className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Hard Mode (No Undos)
                </div>
                <div className="text-[11px] text-stone-500">Disables undo and step rewinds</div>
              </div>
              <input
                type="checkbox"
                checked={settings.hardMode}
                onChange={e => update({ hardMode: e.target.checked })}
                className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
