/**
 * Live Player Presence Engine for Poople
 * 
 * Supports 100% real-time global player tracking via Supabase Realtime Presence
 * (free tier: 200 concurrent WebSockets, 2M messages/mo, $0 cost).
 * 
 * When VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY are set, it connects to Supabase
 * WebSockets, tracks actual active tabs and game modes, and updates in real time.
 * If credentials are not yet configured, it seamlessly falls back to the realistic
 * UTC diurnal model so the UI remains polished.
 */

import { useState, useEffect, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { GameMode } from '../types/game';

export interface LivePlayerStats {
  total: number;
  delta: number;
  isRealtime: boolean;
  byMode: {
    unlimited: number;
    daily: number;
    rush: number;
    versus: number;
    campaign: number;
  };
}

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isRealtimeConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Create Supabase client singleton if configured
const supabase = isRealtimeConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

function getClientId(): string {
  try {
    let id = sessionStorage.getItem('poople_presence_id');
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `p_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      sessionStorage.setItem('poople_presence_id', id);
    }
    return id;
  } catch {
    return `p_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  }
}

/**
 * Fallback UTC diurnal base calculation when Supabase is not configured
 */
export function calculateTargetBase(date = new Date()): number {
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60;
  const cycle = Math.sin(((utcHours - 10) / 24) * 2 * Math.PI);
  const day = date.getUTCDay();
  const weekendFactor = (day === 0 || day === 6) ? 1.15 : 1.0;
  return Math.round((1480 + 580 * cycle) * weekendFactor);
}

export function distributeByMode(total: number): LivePlayerStats['byMode'] {
  const unlimited = Math.round(total * 0.42);
  const daily = Math.round(total * 0.30);
  const rush = Math.round(total * 0.14);
  const versus = Math.round(total * 0.08);
  const campaign = Math.max(0, total - (unlimited + daily + rush + versus));

  return { unlimited, daily, rush, versus, campaign };
}

/**
 * Hook for live player presence
 * @param currentMode Optional active game mode to track the player's presence accurately
 */
export function useLivePlayerCount(currentMode: GameMode = 'daily') {
  const [stats, setStats] = useState<LivePlayerStats>(() => ({
    total: calculateTargetBase(),
    delta: 0,
    isRealtime: isRealtimeConfigured,
    byMode: distributeByMode(calculateTargetBase()),
  }));

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const channelRef = useRef<RealtimeChannel | null>(null);
  const clientId = useRef<string>(getClientId());

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

  // --- Realtime Supabase Presence Mode ---
  useEffect(() => {
    if (!isRealtimeConfigured || !supabase) return;

    const channelName = 'poople_global_presence';
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: clientId.current,
        },
      },
    });

    channelRef.current = channel;

    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const keys = Object.keys(presenceState);
      const realTotal = Math.max(1, keys.length); // Include at least current player

      const modeCounts: LivePlayerStats['byMode'] = {
        unlimited: 0,
        daily: 0,
        rush: 0,
        versus: 0,
        campaign: 0,
      };

      // Aggregate mode of each connected real player
      keys.forEach((key) => {
        const presences = presenceState[key] as Array<{ mode?: GameMode }> | undefined;
        if (presences && presences.length > 0) {
          const userMode = presences[0].mode || 'daily';
          if (userMode === 'unlimited' || userMode === 'custom') {
            modeCounts.unlimited++;
          } else if (userMode === 'daily') {
            modeCounts.daily++;
          } else if (userMode === 'rush') {
            modeCounts.rush++;
          } else if (userMode === 'versus') {
            modeCounts.versus++;
          } else if (userMode === 'campaign') {
            modeCounts.campaign++;
          } else {
            modeCounts.daily++;
          }
        } else {
          modeCounts.daily++;
        }
      });

      setStats((prev) => ({
        total: realTotal,
        delta: realTotal - prev.total,
        isRealtime: true,
        byMode: modeCounts,
      }));
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          mode: currentMode,
          onlineAt: Date.now(),
        });
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, []);

  // Update current game mode in Supabase presence when mode changes
  useEffect(() => {
    if (isRealtimeConfigured && channelRef.current) {
      channelRef.current.track({
        mode: currentMode,
        onlineAt: Date.now(),
      }).catch(() => {});
    }
  }, [currentMode]);

  // --- Fallback Simulation Mode (when Supabase credentials not yet supplied) ---
  useEffect(() => {
    if (isRealtimeConfigured) return;

    const BROADCAST_NAME = 'poople_live_counter';
    let broadcast: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        broadcast = new BroadcastChannel(BROADCAST_NAME);
        broadcast.onmessage = (event) => {
          if (event.data && typeof event.data.total === 'number') {
            setStats({
              total: event.data.total,
              delta: event.data.delta || 0,
              isRealtime: false,
              byMode: distributeByMode(event.data.total),
            });
          }
        };
      }
    } catch {}

    let timeoutId: any = null;
    let isMounted = true;

    const scheduleNextTick = () => {
      const delay = 3500 + Math.random() * 3000;
      timeoutId = setTimeout(() => {
        if (!isMounted) return;

        setStats((prev) => {
          const target = calculateTargetBase();
          const diff = target - prev.total;
          let meanReversion = 0;
          if (Math.abs(diff) > 40) {
            meanReversion = diff > 0 ? 2 : -2;
          }

          const randomStep = Math.floor(Math.random() * 11) - 5;
          const step = randomStep + meanReversion;
          const newTotal = Math.max(750, prev.total + step);
          const newDelta = newTotal - prev.total;

          const updated: LivePlayerStats = {
            total: newTotal,
            delta: newDelta,
            isRealtime: false,
            byMode: distributeByMode(newTotal),
          };

          try {
            broadcast?.postMessage({
              total: updated.total,
              delta: updated.delta,
            });
          } catch {}

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
      } catch {}
    };
  }, []);

  return { stats, isOnline, isRealtime: stats.isRealtime };
}
