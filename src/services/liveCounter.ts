import { useState, useEffect } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { GameMode } from '../types/game';
import { supabase, isRemoteConfigured } from './supabase';

export interface LivePlayerStats {
  total: number;
  delta: number;
  isRealtime: boolean;
  byMode: { unlimited: number; daily: number; rush: number; versus: number; campaign: number };
}

export const isRealtimeConfigured = isRemoteConfigured;
const emptyStats = (): LivePlayerStats => ({
  total: 0, delta: 0, isRealtime: false,
  byMode: { unlimited: 0, daily: 0, rush: 0, versus: 0, campaign: 0 }
});
let stats = emptyStats();
let channel: RealtimeChannel | null = null;
let connectionTimeout: ReturnType<typeof setTimeout> | null = null;
let activeMode: GameMode = 'daily';
let isOnline = typeof navigator === 'undefined' || navigator.onLine;
const listeners = new Set<() => void>();
const clientId = typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID() : `p_${Math.random().toString(36).slice(2)}_${Date.now()}`;

function notify() {
  for (const listener of listeners) listener();
}
function disconnect() {
  if (connectionTimeout) clearTimeout(connectionTimeout);
  connectionTimeout = null;
  const previousChannel = channel;
  channel = null;
  stats = emptyStats();
  if (previousChannel && supabase) void supabase.removeChannel(previousChannel).catch(() => {});
  notify();
}
function connect() {
  if (!supabase || !isOnline || channel || !listeners.size) return;
  const nextChannel = supabase.channel('poople_global_presence', {
    config: { presence: { key: clientId } }
  });
  channel = nextChannel;
  // Stop after a failed attempt instead of retrying a broken optional service forever.
  connectionTimeout = setTimeout(() => {
    if (channel === nextChannel && !stats.isRealtime) disconnect();
  }, 7000);
  nextChannel.on('presence', { event: 'sync' }, () => {
    if (channel !== nextChannel) return;
    if (connectionTimeout) clearTimeout(connectionTimeout);
    connectionTimeout = null;
    const presence = nextChannel.presenceState<{ mode?: GameMode }>();
    const modeCounts = emptyStats().byMode;
    const keys = Object.keys(presence);
    for (const key of keys) {
      const mode = presence[key]?.[0]?.mode || 'daily';
      if (mode === 'custom' || mode === 'unlimited') modeCounts.unlimited++;
      else if (mode in modeCounts) modeCounts[mode]++;
    }
    stats = { total: keys.length, delta: keys.length - stats.total, isRealtime: true, byMode: modeCounts };
    notify();
  }).subscribe(status => {
    if (channel !== nextChannel) return;
    if (status === 'SUBSCRIBED') {
      void nextChannel.track({ mode: activeMode, onlineAt: Date.now() }).then(result => {
        if (result !== 'ok' && channel === nextChannel) disconnect();
      }).catch(() => { if (channel === nextChannel) disconnect(); });
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      disconnect();
    }
  });
}
function handleOnline() {
  isOnline = true;
  notify();
  connect();
}
function handleOffline() {
  isOnline = false;
  disconnect();
}

/** Unknown global presence stays unknown; local play does not require this service. */
export function useLivePlayerCount(currentMode?: GameMode) {
  const [snapshot, setSnapshot] = useState(() => ({ stats, isOnline }));
  useEffect(() => {
    const update = () => setSnapshot({ stats, isOnline });
    listeners.add(update);
    if (listeners.size === 1) {
      isOnline = typeof navigator === 'undefined' || navigator.onLine;
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      connect();
    }
    update();
    return () => {
      listeners.delete(update);
      if (!listeners.size) {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        disconnect();
      }
    };
  }, []);
  useEffect(() => {
    if (!currentMode) return;
    activeMode = currentMode;
    if (channel && stats.isRealtime) {
      void channel.track({ mode: currentMode, onlineAt: Date.now() }).catch(() => disconnect());
    }
  }, [currentMode]);
  return { ...snapshot, isRealtime: snapshot.stats.isRealtime };
}
