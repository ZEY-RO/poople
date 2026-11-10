import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameMode, Difficulty, Step, BotPersonality, BotState, CampaignStage } from './types/game';
import { loadSettings, saveSettings, loadStats, recordDailyCompletion, saveCampaignStars, saveStats, loadDailyGameState, saveDailyGameState } from './services/storage';
import { soundFx } from './services/audio';
import { applyTheme } from './services/theme';
import { isValidStep, findShortestPath, getPar, getRandomPuzzle, isDeadEnd } from './engine/solver';
import { getDailyPuzzle, formatDateToKey } from './engine/daily';
import { BOT_CONFIGS, getNextBotMove, getRandomThinkDelay } from './engine/bot';
import { CAMPAIGN_STAGES } from './engine/campaign';
import { resolveInitialMode } from './seo/routes';

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
import { SiteAnalyticsModal } from './components/SiteAnalyticsModal';
import { analytics } from './services/analytics';
import { ArrowRight, BookOpen, Flame, Lightbulb, Sparkles, CheckCircle2 } from 'lucide-react';

function parseDailyDate(value: string | null): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value > formatDateToKey()) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : undefined;
}

export const App: React.FC = () => {
  // Settings & Stats
  const [settings, setSettings] = useState(loadSettings);
  const [stats, setStats] = useState(loadStats);

  // Active Mode
  const [mode, setMode] = useState<GameMode>(() => resolveInitialMode(window.location));
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

  const [hintsUsed, setHintsUsed] = useState(0);
  const [gameId, setGameId] = useState(0);
  const [isGameReady, setIsGameReady] = useState(false);
  const rushNextRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rushDeadlineRef = useRef(0);
  const rushActiveRef = useRef(false);

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
  const [isSiteAnalyticsOpen, setIsSiteAnalyticsOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.has('analytics') || params.has('admin');
    }
    return false;
  });
  const [selectedDefWord, setSelectedDefWord] = useState<{ word: string; def: string } | null>(null);

  // Initialize theme class and audio config
  useEffect(() => {
    applyTheme(settings.theme);
    document.documentElement.dataset.reduceMotion = String(settings.reduceMotion);
    document.documentElement.dataset.highContrast = String(settings.highContrast);
    soundFx.setConfig(settings.soundEnabled, settings.soundVolume, settings.soundProfile);
  }, [settings]);

  // Initialize Analytics Engine
  useEffect(() => {
    analytics.init();
  }, []);

  // Keyboard shortcut Alt+Shift+A or Ctrl+Shift+A to toggle Site Analytics Dashboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || e.ctrlKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsSiteAnalyticsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);



  // Initialize game when mode or parameters change
  const startNewGame = useCallback((
    targetMode: GameMode = mode,
    options?: { dateKey?: string; stage?: CampaignStage; customStart?: string; customTarget?: string; diff?: Difficulty; bot?: BotPersonality; reset?: boolean }
  ) => {
    if (rushNextRef.current) clearTimeout(rushNextRef.current);
    setIsGameReady(true);
    setGameId(id => id + 1);
    setHintsUsed(0);
    setErrorMessage(null);
    setCurrentInput('');
    setHistory([]);
    setStatus('playing');
    setStartTime(Date.now());
    setIsWinModalOpen(false);

    analytics.trackGameStart(targetMode, {
      dateKey: options?.dateKey,
      diff: options?.diff || difficulty
    });

    if (targetMode === 'daily') {
      const date = options?.dateKey || formatDateToKey();
      const dailyUrl = new URL(window.location.href);
      if (date === formatDateToKey()) dailyUrl.searchParams.delete('date');
      else dailyUrl.searchParams.set('date', date);
      window.history.replaceState({}, '', dailyUrl);
      const puzzle = getDailyPuzzle(date);
      setDailyDateKey(puzzle.date);
      setDailyDayNumber(puzzle.dayNumber);
      setStartWord(puzzle.startWord);
      setTargetWord('POOP');
      setPar(puzzle.par);
      setOptimalPath(puzzle.optimalPath);
      const saved = !options?.reset ? loadDailyGameState<{ history: Step[]; currentInput: string; startTime: number; hintsUsed: number; status: string }>(date) : null;
      if (saved && Array.isArray(saved.history)) {
        let previous = puzzle.startWord;
        const valid = saved.history.every(step => {
          if (!step || typeof step.word !== 'string' || previous === 'POOP' || !isValidStep(previous, step.word).valid) return false;
          previous = step.word;
          return true;
        });
        if (valid) {
          setHistory(saved.history);
          setCurrentInput(typeof saved.currentInput === 'string' && /^[A-Z]{0,4}$/.test(saved.currentInput) ? saved.currentInput : '');
          setStartTime(Number.isFinite(saved.startTime) && saved.startTime > 0 ? saved.startTime : Date.now());
          setHintsUsed(Number.isFinite(saved.hintsUsed) ? saved.hintsUsed : 0);
          setStatus(previous === 'POOP' ? 'won' : 'playing');
        }
      }
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
        config: BOT_CONFIGS[options?.bot || selectedBot],
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

  // Load named mode paths, older shared links, and custom puzzles.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialMode = resolveInitialMode(window.location);
    const s = params.get('start');
    const t = params.get('target');

    if (s && t) {
      const cleanS = s.toUpperCase().trim();
      const cleanT = t.toUpperCase().trim();
      const path = findShortestPath(cleanS, cleanT);
      if (path && path.length > 1) {
        setIsGameReady(true);
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

    setMode(initialMode);
    if (initialMode === 'campaign') {
      setIsViewingCampaignMap(true);
    } else if (initialMode === 'rush') {
      setRushTimeLeft(120);
      setRushScore(0);
      setRushCombo(1);
      setRushSolvedCount(0);
      setIsRushPlaying(false);
      startNewGame('rush');
      setStatus('idle');
    } else {
      const dateParam = params.get('date');
      const dateKey = parseDailyDate(dateParam);
      startNewGame(initialMode, initialMode === 'daily' ? { dateKey } : undefined);
    }
  }, []);

  // Current active word in ladder
  const currentWord = history.length > 0 ? history[history.length - 1].word : startWord;
  const isCurrentDeadEnd = settings.showDeadEndRadar ? isDeadEnd(currentWord, targetWord) : false;

  useEffect(() => {
    if (isGameReady && mode === 'daily' && startWord === getDailyPuzzle(dailyDateKey).startWord) {
      saveDailyGameState(dailyDateKey, { history, currentInput, startTime, hintsUsed, status });
    }
  }, [isGameReady, mode, dailyDateKey, startWord, history, currentInput, startTime, hintsUsed, status]);

  useEffect(() => () => { if (rushNextRef.current) clearTimeout(rushNextRef.current); }, []);

  const isAnyModalOpen = isWinModalOpen || isStatsOpen || isSettingsOpen || isTutorialOpen || isCustomModalOpen || isSiteAnalyticsOpen || selectedDefWord !== null;
  const canPlay = isGameReady && status === 'playing' && !isAnyModalOpen && !(mode === 'campaign' && isViewingCampaignMap) && (mode !== 'rush' || (isRushPlaying && rushTimeLeft > 0));

  // Keyboard Actions
  const handleKeyPress = (letter: string) => {
    if (!canPlay) return;
    if (currentInput.length < 4) {
      setCurrentInput(prev => (prev + letter.toUpperCase().replace(/[^A-Z]/g, '')).slice(0, 4));
      setErrorMessage(null);
    }
  };

  const handleDelete = () => {
    if (!canPlay) return;
    setCurrentInput(prev => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const triggerError = (msg: string) => {
    soundFx.playInvalid();
    setErrorMessage(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 380);
    if (currentInput) {
      analytics.trackWordSubmission(currentInput, false);
    }
  };

  // Submit Step Handler
  const handleSubmit = () => {
    if (!canPlay || (mode === 'rush' && Date.now() >= rushDeadlineRef.current)) return;

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
    analytics.trackWordSubmission(currentInput, true);

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
    analytics.trackGameEnd(mode, true, finalHistory.length, par, timeSec);

    if (mode === 'daily') {
      const updated = recordDailyCompletion({
        date: dailyDateKey,
        startWord,
        steps: finalHistory.length,
        par,
        won: true,
        hintsUsed,
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

      if (newScore > stats.rushHighScore || newCount > stats.rushBestSolved) {
        const updated = {
          ...stats,
          rushHighScore: Math.max(stats.rushHighScore, newScore),
          rushBestSolved: Math.max(stats.rushBestSolved, newCount)
        };
        saveStats(updated);
        setStats(updated);
      }

      // Next puzzle in Rush
      rushNextRef.current = setTimeout(() => {
        if (rushActiveRef.current && Date.now() < rushDeadlineRef.current) startNewGame('rush');
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
    if (mode === 'rush' && !isRushPlaying) return;
    if (mode === 'versus') { startNewGame('versus'); return; }
    setGameId(id => id + 1);
    setHistory([]);
    setCurrentInput('');
    setErrorMessage(null);
    setStatus('playing');
    setHintsUsed(0);
    setStartTime(Date.now());
    setIsWinModalOpen(false);
  };

  // Use wall-clock time so background tabs and a skip penalty cannot extend a run.
  useEffect(() => {
    if (mode !== 'rush' || !isRushPlaying) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((rushDeadlineRef.current - Date.now()) / 1000));
      setRushTimeLeft(remaining);
      if (remaining === 0) {
        rushActiveRef.current = false;
        setIsRushPlaying(false);
        setStatus('lost');
        setCurrentInput('');
        if (rushNextRef.current) clearTimeout(rushNextRef.current);
        soundFx.playFlush();
      }
    };
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [mode, isRushPlaying]);

  // A new game ID invalidates the old bot timer, including same-opponent rematches.
  useEffect(() => {
    if (mode !== 'versus' || status !== 'playing' || botState.status === 'won') return;
    const timer = setTimeout(() => {
      const personality = botState.config.id;
      const move = getNextBotMove(botState.currentWord, targetWord, personality);
      if (!move) return;
      const nextHistory = [...botState.history, move.step];
      const won = move.nextWord === targetWord;
      const distance = getPar(move.nextWord, targetWord);
      setBotState({ ...botState, currentWord: move.nextWord, history: nextHistory, status: won ? 'won' : 'thinking', stepCount: nextHistory.length, progressPercent: won ? 100 : Math.max(0, Math.min(100, Math.round((par - distance) / Math.max(1, par) * 100))) });
      if (won) {
        soundFx.playInvalid();
        setStatus('lost');
        setStats(previous => {
          const updated = { ...previous, versusLosses: previous.versusLosses + 1 };
          saveStats(updated);
          return updated;
        });
      } else soundFx.playBotStep();
    }, getRandomThinkDelay(botState.config.id));
    return () => clearTimeout(timer);
  }, [mode, status, botState, targetWord, par, gameId]);

  // Compute player progress percent for versus mode
  const currentDistToGoal = getPar(currentWord, targetWord);
  const playerProgress = currentDistToGoal >= 0
    ? Math.max(0, Math.min(100, Math.round(((par - Math.max(0, currentDistToGoal)) / Math.max(1, par)) * 100)))
    : 0;

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
    <div className="app-shell text-theme-text-primary">
      {/* Top Navigation Header */}
      <Header
        currentMode={mode}
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

      <section className="page-intro" aria-labelledby="page-title">
        <div><div className="eyebrow">Small steps. Big word energy.</div>
          <h1 id="page-title">{mode === 'daily' && window.location.pathname === '/' ? 'Poople — free word ladder game' : { daily: 'Daily Poople — word ladder puzzle', unlimited: 'Poople Unlimited — word ladder game', rush: 'Poop Rush — timed word ladder game', versus: 'Poople Versus Bot — word ladder race', campaign: 'The Gauntlet — word ladder campaign', custom: 'Poople — custom word ladder puzzle' }[mode]}</h1>
          <p>{mode === 'campaign' && isViewingCampaignMap ? 'Fifty puzzles, five chapters. Pick a stage and find your way up.' : mode === 'rush' && status === 'idle' ? 'Two minutes on the clock. How many ladders can you solve?' : <>Change one letter at a time. Find your way from {startWord} to {targetWord}.</>}</p>
        </div>
        <span className="intro-badge"><Sparkles size={13} /> A little challenge. A fresh perspective.</span>
      </section>
      <div className="workspace">
      <div className="game-card">
      <main id="main-content" className="game-main" aria-label="Word ladder game" tabIndex={-1}>
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
              rushDeadlineRef.current = Date.now() + 120_000;
              rushActiveRef.current = true;
              setIsRushPlaying(true);
              startNewGame('rush');
            }}
            onSkipWord={() => {
              if (!rushActiveRef.current) return;
              setRushCombo(1);
              rushDeadlineRef.current -= 5000;
              if (Date.now() >= rushDeadlineRef.current) {
                rushActiveRef.current = false;
                setRushTimeLeft(0);
                setIsRushPlaying(false);
                setStatus('lost');
              } else {
                setRushTimeLeft(Math.max(0, Math.ceil((rushDeadlineRef.current - Date.now()) / 1000)));
                startNewGame('rush');
              }
            }}
          />
        )}

        {mode === 'versus' && (
          <VersusModeView
            selectedBot={selectedBot}
            onSelectBot={b => {
              setSelectedBot(b);
              startNewGame('versus', { bot: b });
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

        {mode === 'campaign' && !isViewingCampaignMap && <div className="game-notice"><span>Stage {currentCampaignStage?.id}: {currentCampaignStage?.name}</span><button onClick={() => setIsViewingCampaignMap(true)}>All stages</button></div>}
        {status === 'lost' && mode === 'versus' && <div className="game-notice" role="status"><span>The bot reached the goal. Ready for a rematch?</span><button onClick={() => startNewGame('versus')}>Try again</button></div>}
        {status === 'won' && mode !== 'rush' && !(mode === 'campaign' && isViewingCampaignMap) && <div className="game-notice" role="status"><span className="inline-flex items-center gap-2"><CheckCircle2 size={16} /> Ladder complete in {history.length} steps.</span><button onClick={() => setIsWinModalOpen(true)}>View results</button></div>}
        {/* Central Ladder Board (shown when not looking at campaign level select) */}
        {(!isViewingCampaignMap || mode !== 'campaign') && (
          <>
            <LadderBoard
              startWord={startWord}
              targetWord={targetWord}
              history={history}
              currentInput={currentInput}
              isWon={status === 'won'}
              disabled={status !== 'playing' || (mode === 'rush' && !isRushPlaying)}
              onInputChange={value => { if (canPlay) { setCurrentInput(value); setErrorMessage(null); } }}
              onSubmitWord={handleSubmit}
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
              key={gameId}
              canReset={mode !== 'rush' || status === 'playing'}
              onHintUsed={() => setHintsUsed(n => n + 1)}
              currentWord={currentWord}
              targetWord={targetWord}
              historyLength={history.length}
              isWon={status !== 'playing'}
              hardMode={settings.hardMode}
              isUnlimitedMode={mode === 'unlimited'}
              onUndo={handleUndo}
              onRestart={handleRestart}
              onNewRandomWord={() => startNewGame('unlimited')}
              onApplyHintWord={w => {
                if (!canPlay) return;
                setCurrentInput(w);
              }}
            />
          </>
        )}
      </main>

      {/* Virtual On-Screen Keyboard */}
      {(!isViewingCampaignMap || mode !== 'campaign') && (
        <footer className="keyboard-footer">
          <VirtualKeyboard
            layout={settings.keyboardLayout}
            onKeyPress={handleKeyPress}
            onDelete={handleDelete}
            onSubmit={handleSubmit}
            disabled={!canPlay}
            hapticsEnabled={settings.hapticsEnabled}
          />
          <p className="keyboard-caption">Type with your keyboard or tap the letters · <kbd>enter</kbd> to submit</p>
        </footer>
      )}

      </div>
      <aside className="side-panel" aria-label="Tips and progress">
        <section className="guide-card">
          <div className="guide-symbol"><BookOpen size={18} /></div>
          <h2>One letter. One step.</h2>
          <p>A word ladder with a cheeky destination. Every good word gets you closer.</p>
          <div className="guide-steps">
            <div className="guide-step"><span>1</span><p>Start with the word at the top of your ladder.</p></div>
            <div className="guide-step"><span>2</span><p>Type a new four-letter word. Change exactly one letter.</p></div>
            <div className="guide-step"><span>3</span><p>Reach the goal in as few moves as you can. Can you match par?</p></div>
          </div>
          <div className="guide-example" aria-label="LOOP to POOP: change the first letter"><div className="mini-word">{'LOOP'.split('').map((l,i) => <span key={i}>{l}</span>)}</div><ArrowRight size={14} className="text-theme-text-muted" /><div className="mini-word">{'POOP'.split('').map((l,i) => <span className={i === 0 ? 'changed' : ''} key={i}>{l}</span>)}</div></div>
          <button className="text-link" onClick={() => setIsTutorialOpen(true)}>A quick walkthrough <ArrowRight size={13} /></button>
        </section>
        <section className="guide-card streak-card">
          <div className="eyebrow">Your daily ritual</div>
          <div className="streak-summary"><div className="streak-value">{stats.currentStreak}<small>day streak</small></div><Flame size={26} className="text-theme-accent" /></div>
          <p>{stats.currentStreak ? 'Keep it going. A fresh puzzle is waiting every day.' : 'One puzzle is all it takes to start a new streak.'}</p>
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-theme-border"><span className="text-[10px] text-theme-text-muted">Best streak <strong className="text-theme-text-primary ml-1">{stats.maxStreak}</strong></span><button className="text-link" onClick={() => setIsStatsOpen(true)}>Your stats <ArrowRight size={12} /></button></div>
        </section>
        <p className="tip-note"><Lightbulb size={15} className="shrink-0 mt-0.5" />{settings.hardMode ? 'Hard mode is on. Every step counts: undo and rewind are disabled.' : 'Stuck on a word? Try a hint, or undo a move and explore another route.'}</p>
      </aside>
      </div>
      <footer className="app-footer"><span>Made for curious minds & little breaks.</span><span>Four letters. Endless possibilities.</span></footer>
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
            if (mode === 'daily' || mode === 'custom' || mode === 'campaign') handleRestart();
            else startNewGame();
          }}
          onNextStage={handleNextCampaignStage}
          hasNextStage={hasNextCampaignStage}
          onClose={() => setIsWinModalOpen(false)}
        />
      )}

      {isStatsOpen && (
        <StatsModal
          stats={stats}
          onClose={() => setIsStatsOpen(false)}
          onOpenSiteAnalytics={() => setIsSiteAnalyticsOpen(true)}
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
          onOpenSiteAnalytics={() => setIsSiteAnalyticsOpen(true)}
        />
      )}

      {isSiteAnalyticsOpen && (
        <SiteAnalyticsModal
          onClose={() => setIsSiteAnalyticsOpen(false)}
        />
      )}

      {isTutorialOpen && (
        <TutorialModal
          onClose={() => setIsTutorialOpen(false)}
        />
      )}

      {isCustomModalOpen && (
        <CustomPuzzleModal
          initialStartWord={mode === 'custom' ? startWord : undefined}
          initialTargetWord={mode === 'custom' ? targetWord : undefined}
          onStartCustomPuzzle={(s, t) => {
            const url = new URL('/', window.location.origin);
            url.searchParams.set('start', s);
            url.searchParams.set('target', t);
            window.location.assign(url);
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
