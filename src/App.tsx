import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameMode, Difficulty, Step, BotPersonality, BotState, CampaignStage } from './types/game';
import { loadSettings, saveSettings, loadStats, recordDailyCompletion, saveCampaignStars, saveStats } from './services/storage';
import { soundFx } from './services/audio';
import { applyTheme } from './services/theme';
import { isValidStep, findShortestPath, getPar, getRandomPuzzle, isDeadEnd } from './engine/solver';
import { getDailyPuzzle, formatDateToKey } from './engine/daily';
import { BOT_CONFIGS, getNextBotMove, getRandomThinkDelay } from './engine/bot';
import { CAMPAIGN_STAGES } from './engine/campaign';

import { Header } from './components/Header';
import { LadderBoard } from './components/LadderBoard';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { ActionBar } from './components/ActionBar';
import { DailyModeView } from './components/DailyModeView';
import { RushModeView } from './components/RushModeView';
import { VersusModeView } from './components/VersusModeView';
import { CampaignModeView } from './components/CampaignModeView';
import { WinModal } from './components/WinModal';
import { StatsModal } from './components/StatsModal';
import { SettingsModal } from './components/SettingsModal';
import { TutorialModal } from './components/TutorialModal';
import { CustomPuzzleModal } from './components/CustomPuzzleModal';
import { DefinitionModal } from './components/DefinitionModal';

export const App: React.FC = () => {
  // Settings & Stats
  const [settings, setSettings] = useState(loadSettings);
  const [stats, setStats] = useState(loadStats);

  // Active Mode
  const [mode, setMode] = useState<GameMode>('daily');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  // Core Game State
  const [startWord, setStartWord] = useState<string>('FART');
  const [targetWord, setTargetWord] = useState<string>('POOP');
  const [currentInput, setCurrentInput] = useState<string>('');
  const [history, setHistory] = useState<Step[]>([]);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost' | 'idle'>('playing');
  const [par, setPar] = useState<number>(4);
  const [optimalPath, setOptimalPath] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Daily Mode specifics
  const [dailyDateKey, setDailyDateKey] = useState<string>(formatDateToKey());
  const [dailyDayNumber, setDailyDayNumber] = useState<number>(1);

  // Rush Mode specifics
  const [rushTimeLeft, setRushTimeLeft] = useState<number>(120);
  const [rushScore, setRushScore] = useState<number>(0);
  const [rushCombo, setRushCombo] = useState<number>(1);
  const [rushSolvedCount, setRushSolvedCount] = useState<number>(0);
  const [isRushPlaying, setIsRushPlaying] = useState<boolean>(false);

  // Versus Mode specifics
  const [selectedBot, setSelectedBot] = useState<BotPersonality>('medium');
  const [botState, setBotState] = useState<BotState>({
    config: BOT_CONFIGS.medium,
    currentWord: 'FART',
    history: [],
    status: 'idle',
    stepCount: 0,
    progressPercent: 0
  });

  // Campaign Mode specifics
  const [currentCampaignStage, setCurrentCampaignStage] = useState<CampaignStage | null>(null);
  const [isViewingCampaignMap, setIsViewingCampaignMap] = useState<boolean>(false);

  // Modals state
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [isWinModalOpen, setIsWinModalOpen] = useState<boolean>(false);
  const [selectedDefWord, setSelectedDefWord] = useState<{ word: string; def: string } | null>(null);

  // Initialize theme class and audio config
  useEffect(() => {
    applyTheme(settings.theme);
    soundFx.setConfig(settings.soundEnabled, settings.soundVolume, settings.soundProfile);
  }, [settings]);



  // Initialize game when mode or parameters change
  const startNewGame = useCallback((
    targetMode: GameMode = mode,
    options?: { dateKey?: string; stage?: CampaignStage; customStart?: string; customTarget?: string; diff?: Difficulty }
  ) => {
    setErrorMessage(null);
    setCurrentInput('');
    setHistory([]);
    setStatus('playing');
    setStartTime(Date.now());
    setIsWinModalOpen(false);

    if (targetMode === 'daily') {
      const date = options?.dateKey || formatDateToKey();
      const puzzle = getDailyPuzzle(date);
      setDailyDateKey(puzzle.date);
      setDailyDayNumber(puzzle.dayNumber);
      setStartWord(puzzle.startWord);
      setTargetWord('POOP');
      setPar(puzzle.par);
      setOptimalPath(puzzle.optimalPath);
    } else if (targetMode === 'unlimited') {
      const diff = options?.diff || difficulty;
      let minSteps = 3;
      let maxSteps = 5;
      if (diff === 'easy') { minSteps = 2; maxSteps = 3; }
      else if (diff === 'medium') { minSteps = 4; maxSteps = 5; }
      else if (diff === 'hard') { minSteps = 6; maxSteps = 7; }
      else if (diff === 'master') { minSteps = 8; maxSteps = 10; }

      const puzzle = getRandomPuzzle(minSteps, maxSteps, 'POOP');
      setStartWord(puzzle.startWord);
      setTargetWord('POOP');
      setPar(puzzle.par);
      setOptimalPath(puzzle.optimalPath);
    } else if (targetMode === 'rush') {
      const puzzle = getRandomPuzzle(3, 5, 'POOP');
      setStartWord(puzzle.startWord);
      setTargetWord('POOP');
      setPar(puzzle.par);
      setOptimalPath(puzzle.optimalPath);
    } else if (targetMode === 'versus') {
      const puzzle = getRandomPuzzle(4, 6, 'POOP');
      setStartWord(puzzle.startWord);
      setTargetWord('POOP');
      setPar(puzzle.par);
      setOptimalPath(puzzle.optimalPath);

      setBotState({
        config: BOT_CONFIGS[selectedBot],
        currentWord: puzzle.startWord,
        history: [],
        status: 'thinking',
        stepCount: 0,
        progressPercent: 0
      });
    } else if (targetMode === 'campaign') {
      const stage = options?.stage || currentCampaignStage || CAMPAIGN_STAGES[0];
      setCurrentCampaignStage(stage);
      setStartWord(stage.startWord);
      setTargetWord(stage.targetWord);
      setPar(stage.par);
      const path = findShortestPath(stage.startWord, stage.targetWord) || [];
      setOptimalPath(path);
      setIsViewingCampaignMap(false);
    } else if (targetMode === 'custom') {
      const s = options?.customStart || startWord;
      const t = options?.customTarget || targetWord;
      const path = findShortestPath(s, t) || [];
      setStartWord(s);
      setTargetWord(t);
      setPar(Math.max(1, path.length - 1));
      setOptimalPath(path);
    }
  }, [mode, difficulty, selectedBot, currentCampaignStage, startWord, targetWord]);

  // Initial load - Support mode=unlimited, custom puzzles, and daily default
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode') as GameMode | null;
    const s = params.get('start');
    const t = params.get('target');

    if (s && t) {
      const cleanS = s.toUpperCase().trim();
      const cleanT = t.toUpperCase().trim();
      const path = findShortestPath(cleanS, cleanT);
      if (path && path.length > 1) {
        setMode('custom');
        setStartWord(cleanS);
        setTargetWord(cleanT);
        setPar(path.length - 1);
        setOptimalPath(path);
        setHistory([]);
        setStatus('playing');
        return;
      }
    }

    if (modeParam && ['daily', 'unlimited', 'rush', 'versus', 'campaign'].includes(modeParam)) {
      setMode(modeParam);
      if (modeParam === 'campaign') {
        setIsViewingCampaignMap(true);
      } else if (modeParam === 'rush') {
        setRushTimeLeft(120);
        setRushScore(0);
        setRushCombo(1);
        setRushSolvedCount(0);
        setIsRushPlaying(true);
        startNewGame('rush');
      } else {
        startNewGame(modeParam);
      }
    } else {
      startNewGame('daily');
    }
  }, []);

  // Handle Mode Change
  const handleSelectMode = (newMode: GameMode) => {
    setMode(newMode);

    // Sync URL without reload so players can share or bookmark their current mode (e.g. ?mode=unlimited)
    try {
      const url = new URL(window.location.href);
      if (newMode === 'daily') {
        url.searchParams.delete('mode');
      } else {
        url.searchParams.set('mode', newMode);
      }
      url.searchParams.delete('start');
      url.searchParams.delete('target');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore in non-browser environments
    }

    if (newMode === 'campaign') {
      setIsViewingCampaignMap(true);
    } else if (newMode === 'rush') {
      setRushTimeLeft(120);
      setRushScore(0);
      setRushCombo(1);
      setRushSolvedCount(0);
      setIsRushPlaying(true);
      startNewGame('rush');
    } else {
      startNewGame(newMode);
    }
  };

  // Current active word in ladder
  const currentWord = history.length > 0 ? history[history.length - 1].word : startWord;
  const isCurrentDeadEnd = settings.showDeadEndRadar ? isDeadEnd(currentWord, targetWord) : false;

  // Keyboard Actions
  const handleKeyPress = (letter: string) => {
    if (status !== 'playing' || isWinModalOpen) return;
    if (currentInput.length < 4) {
      setCurrentInput(prev => prev + letter);
      setErrorMessage(null);
    }
  };

  const handleDelete = () => {
    if (status !== 'playing' || isWinModalOpen) return;
    setCurrentInput(prev => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const triggerError = (msg: string) => {
    soundFx.playInvalid();
    setErrorMessage(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 380);
  };

  // Submit Step Handler
  const handleSubmit = () => {
    if (status !== 'playing' || isWinModalOpen) return;

    if (currentInput.length !== 4) {
      triggerError('Word must be 4 letters long.');
      return;
    }

    const validation = isValidStep(currentWord, currentInput);
    if (!validation.valid) {
      triggerError(validation.reason || 'Invalid word or move.');
      return;
    }

    // Move is valid!
    const newStep: Step = {
      word: currentInput,
      changedIndex: validation.changedIndex ?? null,
      timestamp: Date.now()
    };

    const nextHistory = [...history, newStep];
    setHistory(nextHistory);
    setCurrentInput('');
    setErrorMessage(null);

    // Check if Goal is reached!
    if (currentInput === targetWord) {
      handleWin(nextHistory);
    } else {
      soundFx.playValidStep();
    }
  };

  // Win Logic
  const handleWin = (finalHistory: Step[]) => {
    setStatus('won');
    soundFx.playVictory();
    const timeSec = Math.round((Date.now() - startTime) / 1000);

    if (mode === 'daily') {
      const updated = recordDailyCompletion({
        date: dailyDateKey,
        startWord,
        steps: finalHistory.length,
        par,
        won: true,
        hintsUsed: 0,
        timeSeconds: timeSec
      });
      setStats(updated);
      setIsWinModalOpen(true);
    } else if (mode === 'unlimited') {
      const updated = {
        ...stats,
        unlimitedPlayed: stats.unlimitedPlayed + 1,
        unlimitedWins: stats.unlimitedWins + 1,
        flawlessCount: finalHistory.length <= par ? stats.flawlessCount + 1 : stats.flawlessCount
      };
      saveStats(updated);
      setStats(updated);
      setIsWinModalOpen(true);
    } else if (mode === 'campaign' && currentCampaignStage) {
      const diff = finalHistory.length - par;
      const stars = diff <= 0 ? 3 : diff <= 2 ? 2 : 1;
      const updated = saveCampaignStars(currentCampaignStage.id, stars);
      setStats(updated);
      setIsWinModalOpen(true);
    } else if (mode === 'versus') {
      const updated = {
        ...stats,
        versusWins: stats.versusWins + 1
      };
      saveStats(updated);
      setStats(updated);
      setIsWinModalOpen(true);
    } else if (mode === 'rush') {
      // Rush Mode: Add points, increase combo, and immediately spin up the next puzzle
      const points = (100 * rushCombo) + (finalHistory.length <= par ? 50 : 0);
      const newScore = rushScore + points;
      const newCount = rushSolvedCount + 1;
      const newCombo = rushCombo + 1;

      setRushScore(newScore);
      setRushSolvedCount(newCount);
      setRushCombo(newCombo);

      if (newScore > stats.rushHighScore) {
        const updated = {
          ...stats,
          rushHighScore: newScore,
          rushBestSolved: Math.max(stats.rushBestSolved, newCount)
        };
        saveStats(updated);
        setStats(updated);
      }

      // Next puzzle in Rush
      setTimeout(() => {
        startNewGame('rush');
      }, 400);
    } else {
      setIsWinModalOpen(true);
    }
  };

  // Undo Step Handler
  const handleUndo = () => {
    if (history.length === 0 || status !== 'playing' || settings.hardMode) return;
    setHistory(prev => prev.slice(0, -1));
    setCurrentInput('');
    setErrorMessage(null);
  };

  // Rewind to specific past step
  const handleRewindToStep = (index: number) => {
    if (settings.hardMode || status !== 'playing') return;
    setHistory(prev => prev.slice(0, index + 1));
    setCurrentInput('');
    setErrorMessage(null);
  };

  // Restart ladder
  const handleRestart = () => {
    setHistory([]);
    setCurrentInput('');
    setErrorMessage(null);
  };

  // Rush Mode Timer Loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (mode === 'rush' && isRushPlaying && rushTimeLeft > 0) {
      interval = setInterval(() => {
        setRushTimeLeft(prev => {
          if (prev <= 1) {
            setIsRushPlaying(false);
            soundFx.playFlush();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, isRushPlaying, rushTimeLeft]);

  // Versus Bot Simulation Loop
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (mode !== 'versus' || status !== 'playing') {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      return;
    }

    const scheduleBotStep = () => {
      const delay = getRandomThinkDelay(selectedBot);
      botTimerRef.current = setTimeout(() => {
        setBotState(prev => {
          if (prev.status === 'won' || status !== 'playing') return prev;

          const move = getNextBotMove(prev.currentWord, targetWord, selectedBot);
          if (!move) return prev;

          const newHistory = [...prev.history, move.step];
          const isBotWon = move.nextWord === targetWord;
          const currentDistance = getPar(move.nextWord, targetWord);
          const initialPar = Math.max(1, par);
          const progress = Math.min(100, Math.round(((initialPar - Math.max(0, currentDistance)) / initialPar) * 100));

          if (isBotWon) {
            // Bot won the race!
            soundFx.playInvalid();
            setStatus('lost');
            const updated = {
              ...stats,
              versusLosses: stats.versusLosses + 1
            };
            saveStats(updated);
            setStats(updated);

            return {
              ...prev,
              currentWord: move.nextWord,
              history: newHistory,
              status: 'won',
              stepCount: newHistory.length,
              progressPercent: 100
            };
          }

          soundFx.playBotStep();
          return {
            ...prev,
            currentWord: move.nextWord,
            history: newHistory,
            status: 'thinking',
            stepCount: newHistory.length,
            progressPercent: progress
          };
        });

        // Schedule next step if still playing
        if (status === 'playing') {
          scheduleBotStep();
        }
      }, delay);
    };

    scheduleBotStep();

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [mode, status, selectedBot, targetWord, par]);

  // Compute player progress percent for versus mode
  const currentDistToGoal = getPar(currentWord, targetWord);
  const playerProgress = currentDistToGoal >= 0
    ? Math.min(100, Math.round(((par - Math.max(0, currentDistToGoal)) / Math.max(1, par)) * 100))
    : 10;

  // Next stage navigation in campaign
  const hasNextCampaignStage = mode === 'campaign' && currentCampaignStage !== null && currentCampaignStage.id < CAMPAIGN_STAGES.length;
  const handleNextCampaignStage = () => {
    if (!currentCampaignStage) return;
    const next = CAMPAIGN_STAGES.find(s => s.id === currentCampaignStage.id + 1);
    if (next) {
      startNewGame('campaign', { stage: next });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-lg mx-auto bg-theme-bg-primary text-theme-text-primary border-x border-theme-border/60 shadow-2xl transition-colors">
      {/* Top Navigation Header */}
      <Header
        currentMode={mode}
        onSelectMode={handleSelectMode}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenCustom={() => setIsCustomModalOpen(true)}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => {
          const toggled = !settings.soundEnabled;
          const updated = { ...settings, soundEnabled: toggled };
          setSettings(updated);
          saveSettings(updated);
          soundFx.setConfig(toggled, updated.soundVolume, updated.soundProfile);
        }}
      />

      {/* Main Mode View Area */}
      <main className="flex-1 flex flex-col justify-between py-1">
        {/* Mode Specific Sub-Headers */}
        {mode === 'daily' && (
          <DailyModeView
            dayNumber={dailyDayNumber}
            dateKey={dailyDateKey}
            currentStreak={stats.currentStreak}
            maxStreak={stats.maxStreak}
            onSelectDate={date => startNewGame('daily', { dateKey: date })}
            completedHistory={stats.dailyHistory}
          />
        )}

        {mode === 'unlimited' && (
          <div className="w-full max-w-md mx-auto px-4 pt-1 pb-2">
            <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-theme-bg-secondary border border-theme-border">
              <span className="text-xs font-bold text-theme-text-primary">
                Difficulty:
              </span>
              <div className="flex gap-1">
                {(['easy', 'medium', 'hard', 'master'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => {
                      soundFx.playKey();
                      setDifficulty(d);
                      startNewGame('unlimited', { diff: d });
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold capitalize transition-all btn-press ${
                      difficulty === d
                        ? 'bg-theme-accent text-theme-accent-text shadow-sm scale-105 font-black'
                        : 'bg-theme-bg-card text-theme-text-secondary border border-theme-border/60 hover:bg-theme-bg-muted'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {mode === 'rush' && (
          <RushModeView
            isPlaying={isRushPlaying}
            timeLeft={rushTimeLeft}
            totalTime={120}
            score={rushScore}
            combo={rushCombo}
            wordsSolved={rushSolvedCount}
            highScore={stats.rushHighScore}
            onStartRush={() => {
              setRushTimeLeft(120);
              setRushScore(0);
              setRushCombo(1);
              setRushSolvedCount(0);
              setIsRushPlaying(true);
              startNewGame('rush');
            }}
            onSkipWord={() => {
              setRushCombo(1);
              setRushTimeLeft(prev => Math.max(0, prev - 5));
              startNewGame('rush');
            }}
          />
        )}

        {mode === 'versus' && (
          <VersusModeView
            selectedBot={selectedBot}
            onSelectBot={b => {
              setSelectedBot(b);
              startNewGame('versus');
            }}
            botState={botState}
            playerStepCount={history.length}
            playerProgress={playerProgress}
            botProgress={botState.progressPercent}
            onStartNewVersusGame={() => startNewGame('versus')}
          />
        )}

        {mode === 'custom' && (
          <div className="w-full max-w-md mx-auto px-4 pt-1 pb-2">
            <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-theme-bg-secondary border border-theme-border">
              <span className="text-xs font-bold text-theme-text-primary">
                Custom Puzzle: {startWord} ➔ {targetWord}
              </span>
              <button
                onClick={() => setIsCustomModalOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-text text-[11px] font-bold shadow-sm btn-press"
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {mode === 'campaign' && isViewingCampaignMap && (
          <CampaignModeView
            currentStageId={currentCampaignStage?.id}
            completedStars={stats.campaignStars}
            onSelectStage={stg => startNewGame('campaign', { stage: stg })}
          />
        )}

        {/* Central Ladder Board (shown when not looking at campaign level select) */}
        {(!isViewingCampaignMap || mode !== 'campaign') && (
          <>
            <LadderBoard
              startWord={startWord}
              targetWord={targetWord}
              history={history}
              currentInput={currentInput}
              isWon={status === 'won'}
              par={par}
              errorMessage={errorMessage}
              isShaking={isShaking}
              onSelectWordDefinition={(w, def) => setSelectedDefWord({ word: w, def })}
              onRewindToStep={handleRewindToStep}
              showDeadEndRadar={settings.showDeadEndRadar}
              isDeadEnd={isCurrentDeadEnd}
              hardMode={settings.hardMode}
            />

            {/* Action Bar (Hint, Undo, Reset, Peek, New) */}
            <ActionBar
              currentWord={currentWord}
              targetWord={targetWord}
              historyLength={history.length}
              isWon={status === 'won'}
              hardMode={settings.hardMode}
              isUnlimitedMode={mode === 'unlimited'}
              onUndo={handleUndo}
              onRestart={handleRestart}
              onNewRandomWord={() => startNewGame('unlimited')}
              onApplyHintWord={w => {
                setCurrentInput(w);
              }}
            />
          </>
        )}
      </main>

      {/* Virtual On-Screen Keyboard */}
      {(!isViewingCampaignMap || mode !== 'campaign') && (
        <footer className="pb-2 bg-theme-bg-secondary/40 border-t border-theme-border/50">
          <VirtualKeyboard
            layout={settings.keyboardLayout}
            onKeyPress={handleKeyPress}
            onDelete={handleDelete}
            onSubmit={handleSubmit}
            disabled={status !== 'playing' || isWinModalOpen}
            hapticsEnabled={settings.hapticsEnabled}
          />
        </footer>
      )}

      {/* Modals & Popups */}
      {isWinModalOpen && (
        <WinModal
          startWord={startWord}
          targetWord={targetWord}
          history={history}
          par={par}
          optimalPath={optimalPath}
          dayNumber={mode === 'daily' ? dailyDayNumber : undefined}
          onPlayAgain={() => {
            setIsWinModalOpen(false);
            startNewGame();
          }}
          onNextStage={handleNextCampaignStage}
          hasNextStage={hasNextCampaignStage}
        />
      )}

      {isStatsOpen && (
        <StatsModal
          stats={stats}
          onClose={() => setIsStatsOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={s => {
            setSettings(s);
            saveSettings(s);
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isTutorialOpen && (
        <TutorialModal
          onClose={() => setIsTutorialOpen(false)}
        />
      )}

      {isCustomModalOpen && (
        <CustomPuzzleModal
          onStartCustomPuzzle={(s, t, p, path) => {
            setMode('custom');
            setStartWord(s);
            setTargetWord(t);
            setPar(p);
            setOptimalPath(path);
            setHistory([]);
            setStatus('playing');
          }}
          onClose={() => setIsCustomModalOpen(false)}
        />
      )}

      {selectedDefWord && (
        <DefinitionModal
          word={selectedDefWord.word}
          definition={selectedDefWord.def}
          onClose={() => setSelectedDefWord(null)}
        />
      )}
    </div>
  );
};

export default App;
