/**
 * Live Player Counter Service & Hook for Poople
 * 
 * Provides realistic, synchronized live concurrent player presence.
 * Features:
 * - UTC Diurnal traffic cycle (peaks during global high-activity hours)
 * - Natural micro-fluctuations (subtle real-time drift every few seconds)
 * - Cross-tab synchronization via BroadcastChannel and localStorage
 * - Mode breakdown (Unlimited, Daily, Rush, Versus, Campaign)
 * - Network status awareness (online/offline)
 */

import { useState, useEffect } from 'react';

export interface LivePlayerStats {
  total: number;
  delta: number;
  byMode: {
    unlimited: number;
    daily: number;
    rush: number;
    versus: number;
    campaign: number;
  };
}

const STORAGE_KEY = 'poople_live_players_sync';
const BROADCAST_NAME = 'poople_live_counter';

/**
 * Calculates a plausible diurnal base count based on current UTC time.
 * Peak around 18:00 UTC (Europe evening / US afternoon).
 * Trough around 06:00 UTC (Pacific night).
 */
export function calculateTargetBase(date = new Date()): number {
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60;
  // Sine curve with peak at 18:00 UTC and trough at 06:00 UTC
  const cycle = Math.sin(((utcHours - 10) / 24) * 2 * Math.PI);
  
  // Weekend boost (Saturday = 6, Sunday = 0)
  const day = date.getUTCDay();
  const weekendFactor = (day === 0 || day === 6) ? 1.15 : 1.0;
  
  // Base between ~1,150 and ~2,380 players
  return Math.round((1480 + 580 * cycle) * weekendFactor);
}

/**
 * Distributes total player count realistically across game modes
 */
export function distributeByMode(total: number): LivePlayerStats['byMode'] {
  // Typical breakdown:
  // Unlimited: ~42%
  // Daily Challenge: ~30%
  // Rush Mode: ~14%
  // Versus Bot: ~8%
  // Campaign: ~6%
  const unlimited = Math.round(total * 0.42);
  const daily = Math.round(total * 0.30);
  const rush = Math.round(total * 0.14);
  const versus = Math.round(total * 0.08);
  const campaign = Math.max(0, total - (unlimited + daily + rush + versus));

  return {
    unlimited,
    daily,
    rush,
    versus,
    campaign,
  };
}

/**
 * Retrieves the cached live counter if recent (< 15 seconds old),
 * otherwise initializes a new realistic baseline.
 */
function getInitialStats(): LivePlayerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const age = Date.now() - (parsed.timestamp || 0);
      if (age < 15000 && typeof parsed.total === 'number' && parsed.total > 500) {
        return {
          total: parsed.total,
          delta: parsed.delta || 0,
          byMode: distributeByMode(parsed.total)
        };
      }
    }
  } catch {
    // Ignore storage parse errors
  }

  const base = calculateTargetBase();
  // Add small initial random seed +/- 20
  const total = base + Math.floor(Math.random() * 41) - 20;
  return {
    total,
    delta: 0,
    byMode: distributeByMode(total)
  };
}

function saveSyncStats(stats: LivePlayerStats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      total: stats.total,
      delta: stats.delta,
      timestamp: Date.now()
    }));
  } catch {
    // Ignore storage write errors
  }
}

/**
 * React Hook that provides synchronized live player count and breakdown
 */
export function useLivePlayerCount() {
  const [stats, setStats] = useState<LivePlayerStats>(getInitialStats);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Monitor network online/offline state
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let broadcast: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        broadcast = new BroadcastChannel(BROADCAST_NAME);
        broadcast.onmessage = (event) => {
          if (event.data && typeof event.data.total === 'number') {
            setStats({
              total: event.data.total,
              delta: event.data.delta || 0,
              byMode: distributeByMode(event.data.total)
            });
          }
        };
      }
    } catch {
      // Ignore broadcast channel errors
    }

    let timeoutId: any = null;
    let isMounted = true;

    const scheduleNextTick = () => {
      // Fluctuate every 3.5 to 6.5 seconds
      const delay = 3500 + Math.random() * 3000;
      
      timeoutId = setTimeout(() => {
        if (!isMounted) return;

        setStats((prev) => {
          const target = calculateTargetBase();
          const diff = target - prev.total;

          // Mean-reversion pressure: if we drifted far from target, pull back gently
          let meanReversion = 0;
          if (Math.abs(diff) > 40) {
            meanReversion = diff > 0 ? 2 : -2;
          }

          // Random natural step: -5 to +6
          const randomStep = Math.floor(Math.random() * 11) - 5;
          const step = randomStep + meanReversion;

          // Ensure minimum realistic threshold
          const newTotal = Math.max(750, prev.total + step);
          const newDelta = newTotal - prev.total;

          const updated: LivePlayerStats = {
            total: newTotal,
            delta: newDelta,
            byMode: distributeByMode(newTotal)
          };

          saveSyncStats(updated);

          try {
            broadcast?.postMessage({
              total: updated.total,
              delta: updated.delta
            });
          } catch {
            // Ignore broadcast failure
          }

          return updated;
        });

        scheduleNextTick();
      }, delay);
    };

    scheduleNextTick();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      try {
        broadcast?.close();
      } catch {
        // Ignore close failure
      }
    };
  }, []);

  return { stats, isOnline };
}
