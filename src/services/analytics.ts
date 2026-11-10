/**
 * Poople Web & Game Analytics Engine
 * 
 * Tracks:
 * - Unique visitors (anonymous persistent ID in localStorage)
 * - Session duration & active time spent (via Page Visibility API + heartbeats + unload beacons)
 * - Device, Browser, OS, Screen resolution, Viewport, Language, Timezone
 * - Referrers & UTM campaign parameters
 * - Gameplay actions (game start, wins, losses, mode switches)
 * 
 * Storage:
 * - Upserts to Supabase tables (analytics_visitors, analytics_sessions, analytics_events)
 * - Transparent offline / local cache fallback in localStorage so tracking works immediately
 */

import { supabase, isRemoteConfigured, remoteConfig } from './supabase';
import { GameMode } from '../types/game';

// Configuration & Keys
const VISITOR_KEY = 'poople_visitor_id';
const SESSION_KEY = 'poople_session_id';
const SESSION_START_KEY = 'poople_session_start';
const LOCAL_ANALYTICS_KEY = 'poople_analytics_local_store';

export const isSupabaseConfigured = isRemoteConfigured;
const { url: SUPABASE_URL, key: SUPABASE_KEY } = remoteConfig;

export interface ClientMetadata {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  screenResolution: string;
  viewport: string;
  language: string;
  timezone: string;
  referrer: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface AnalyticsSummary {
  totalUniqueVisitors: number;
  totalSessions: number;
  totalDurationSeconds: number;
  avgDurationSeconds: number;
  activeNow: number;
  newVisitorsCount: number;
  returningVisitorsCount: number;
  deviceBreakdown: { mobile: number; desktop: number; tablet: number };
  topBrowsers: Array<{ name: string; count: number; percentage: number }>;
  topOS: Array<{ name: string; count: number; percentage: number }>;
  topReferrers: Array<{ source: string; count: number; percentage: number }>;
  modeBreakdown: Record<string, number>;
  dailyVisits: Array<{ date: string; visitors: number; sessions: number; avgDuration: number }>;
  isUsingSupabase: boolean;
  tablesExist: boolean;
}

// Generate UUID fallback
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Detect client environment metadata
export function getClientMetadata(): ClientMetadata {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'desktop',
      browser: 'Unknown',
      os: 'Unknown',
      screenResolution: '0x0',
      viewport: '0x0',
      language: 'en',
      timezone: 'UTC',
      referrer: 'direct',
    };
  }

  const ua = navigator.userAgent || '';
  const screen = window.screen;

  // Device detection
  const isMobile = /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Tablet|PlayBook/i.test(ua) || (navigator.maxTouchPoints > 1 && window.innerWidth >= 768 && window.innerWidth <= 1024);
  const deviceType: ClientMetadata['deviceType'] = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  // Browser detection
  let browser = 'Other';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua)) browser = 'Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';

  // OS detection
  let os = 'Other';
  if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/CrOS/i.test(ua)) os = 'ChromeOS';

  // Referrer cleaning
  let referrer = 'direct';
  if (document.referrer) {
    try {
      const url = new URL(document.referrer);
      if (url.hostname !== window.location.hostname) {
        referrer = url.hostname.replace(/^www\./, '');
      }
    } catch {
      referrer = document.referrer.slice(0, 50);
    }
  }

  // UTM Parameters
  let utmSource: string | undefined;
  let utmMedium: string | undefined;
  let utmCampaign: string | undefined;

  try {
    const params = new URLSearchParams(window.location.search);
    utmSource = params.get('utm_source') || undefined;
    utmMedium = params.get('utm_medium') || undefined;
    utmCampaign = params.get('utm_campaign') || undefined;
  } catch {}

  return {
    deviceType,
    browser,
    os,
    screenResolution: `${screen.width}x${screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language || 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    referrer,
    utmSource,
    utmMedium,
    utmCampaign,
  };
}

class AnalyticsEngine {
  private visitorId: string = '';
  private sessionId: string = '';
  private isNewVisitor: boolean = false;
  private metadata: ClientMetadata = getClientMetadata();
  private isInitialized: boolean = false;

  // Active time tracking state
  private isTabVisible: boolean = true;
  private isWindowFocused: boolean = true;
  private activeSecondsInSession: number = 0;
  private lastActiveTimestamp: number = Date.now();
  private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
  private listenerController: AbortController | null = null;

  // Session activity
  private modesPlayed: Set<string> = new Set();
  private gamesStartedCount: number = 0;
  private gamesWonCount: number = 0;
  private wordsGuessedCount: number = 0;

  // Supabase table health check
  private tablesVerified: boolean | null = null;

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    this.initVisitor();
    this.initSession();
    this.setupActiveTimeTracking();
    this.recordInitialVisit();
  }

  private initVisitor() {
    try {
      let storedId = localStorage.getItem(VISITOR_KEY);
      if (!storedId) {
        this.visitorId = generateUUID();
        this.isNewVisitor = true;
        localStorage.setItem(VISITOR_KEY, this.visitorId);
        localStorage.setItem('poople_visitor_first_seen', new Date().toISOString());
      } else {
        this.visitorId = storedId;
        this.isNewVisitor = false;
      }
    } catch {
      this.visitorId = generateUUID();
      this.isNewVisitor = true;
    }
  }

  private initSession() {
    try {
      let currentSessionId = sessionStorage.getItem(SESSION_KEY);
      const now = Date.now();

      if (!currentSessionId) {
        this.sessionId = generateUUID();
        sessionStorage.setItem(SESSION_KEY, this.sessionId);
        sessionStorage.setItem(SESSION_START_KEY, now.toString());

        // Increment visit count for visitor
        const visits = parseInt(localStorage.getItem('poople_visitor_visits') || '0', 10) + 1;
        localStorage.setItem('poople_visitor_visits', visits.toString());
      } else {
        this.sessionId = currentSessionId;
        // Estimate already elapsed active seconds in current tab session
        const storedElapsed = parseInt(sessionStorage.getItem('poople_session_active_seconds') || '0', 10);
        this.activeSecondsInSession = Number.isFinite(storedElapsed) ? Math.max(0, storedElapsed) : 0;
      }
    } catch {
      this.sessionId = generateUUID();
    }
  }

  private setupActiveTimeTracking() {
    this.isTabVisible = document.visibilityState === 'visible';
    this.isWindowFocused = document.hasFocus();
    this.lastActiveTimestamp = Date.now();
    this.listenerController = new AbortController();
    const listenerOptions = { signal: this.listenerController.signal };

    const updateActiveDelta = () => {
      const now = Date.now();
      if (this.isTabVisible && this.isWindowFocused) {
        const deltaSeconds = Math.round((now - this.lastActiveTimestamp) / 1000);
        // Protect against sleep/hibernation jumps
        if (deltaSeconds > 0 && deltaSeconds < 120) {
          this.activeSecondsInSession += deltaSeconds;
          try {
            sessionStorage.setItem('poople_session_active_seconds', this.activeSecondsInSession.toString());
          } catch {}
        }
      }
      this.lastActiveTimestamp = now;
    };

    // Tab visibility changes
    document.addEventListener('visibilitychange', () => {
      updateActiveDelta();
      this.isTabVisible = document.visibilityState === 'visible';
      if (this.isTabVisible) {
        this.lastActiveTimestamp = Date.now();
      } else {
        // Tab went to background, trigger sync beacon
        this.flushHeartbeat();
      }
    }, listenerOptions);

    // Window focus / blur
    window.addEventListener('focus', () => {
      updateActiveDelta();
      this.isWindowFocused = true;
      this.lastActiveTimestamp = Date.now();
    }, listenerOptions);

    window.addEventListener('blur', () => {
      updateActiveDelta();
      this.isWindowFocused = false;
    }, listenerOptions);

    // Heartbeat every 25 seconds
    this.heartbeatIntervalId = setInterval(() => {
      updateActiveDelta();
      this.flushHeartbeat();
    }, 25000);

    // Page unload / pagehide beacon
    window.addEventListener('pagehide', () => {
      updateActiveDelta();
      this.sendExitBeacon();
    }, listenerOptions);

    window.addEventListener('beforeunload', () => {
      updateActiveDelta();
      this.sendExitBeacon();
    }, listenerOptions);
  }

  // Periodic heartbeat sync to Supabase and LocalStorage
  private async flushHeartbeat() {
    this.updateLocalCache();

    if (!isSupabaseConfigured || !supabase || this.tablesVerified !== true) return;

    try {
      // Update session duration
      const { error: sessionError } = await supabase
        .from('analytics_sessions')
        .update({
          duration_seconds: this.activeSecondsInSession,
          last_heartbeat_at: new Date().toISOString(),
          is_bounce: this.activeSecondsInSession < 15 && this.gamesStartedCount === 0,
          modes_played: Array.from(this.modesPlayed),
          games_started: this.gamesStartedCount,
          games_won: this.gamesWonCount,
          words_guessed: this.wordsGuessedCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', this.sessionId);
      if (sessionError) { this.tablesVerified = false; return; }

      // Update visitor's last seen and total time
      const { error: visitorError } = await supabase
        .from('analytics_visitors')
        .update({
          last_seen_at: new Date().toISOString(),
          total_time_seconds: this.activeSecondsInSession,
          updated_at: new Date().toISOString(),
        })
        .eq('id', this.visitorId);
      if (visitorError) this.tablesVerified = false;
    } catch {
      this.tablesVerified = false;
    }
  }

  // Final beacon sent during page unload (using keepalive fetch or sendBeacon)
  private sendExitBeacon() {
    this.updateLocalCache();

    if (!isSupabaseConfigured || this.tablesVerified !== true || !SUPABASE_URL || !SUPABASE_KEY) return;

    const sessionEndpoint = `${SUPABASE_URL}/rest/v1/analytics_sessions?id=eq.${encodeURIComponent(this.sessionId)}`;
    const payload = JSON.stringify({
      duration_seconds: this.activeSecondsInSession,
      last_heartbeat_at: new Date().toISOString(),
      is_bounce: this.activeSecondsInSession < 15 && this.gamesStartedCount === 0,
      modes_played: Array.from(this.modesPlayed),
      games_started: this.gamesStartedCount,
      games_won: this.gamesWonCount,
      words_guessed: this.wordsGuessedCount,
      updated_at: new Date().toISOString(),
    });

    try {
      if (typeof fetch !== 'undefined') {
        fetch(sessionEndpoint, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=minimal',
          },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
  }

  // Record initial visit in database & local storage
  private async recordInitialVisit() {
    this.updateLocalCache();

    if (!isSupabaseConfigured || !supabase) return;

    try {
      // 1. Upsert Visitor
      const visitorPayload = {
        id: this.visitorId,
        first_seen_at: localStorage.getItem('poople_visitor_first_seen') || new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        total_visits: parseInt(localStorage.getItem('poople_visitor_visits') || '1', 10),
        total_time_seconds: this.activeSecondsInSession,
        device_type: this.metadata.deviceType,
        browser: this.metadata.browser,
        os: this.metadata.os,
        screen_resolution: this.metadata.screenResolution,
        language: this.metadata.language,
        timezone: this.metadata.timezone,
        initial_referrer: this.metadata.referrer,
        initial_utm_source: this.metadata.utmSource,
        initial_utm_medium: this.metadata.utmMedium,
        initial_utm_campaign: this.metadata.utmCampaign,
        updated_at: new Date().toISOString(),
      };

      const { error: visitorError } = await supabase
        .from('analytics_visitors')
        .upsert(visitorPayload, { onConflict: 'id' });

      if (visitorError) {
        this.tablesVerified = false;
        return;
      }

      // 2. Insert Session
      const sessionPayload = {
        id: this.sessionId,
        visitor_id: this.visitorId,
        started_at: new Date().toISOString(),
        last_heartbeat_at: new Date().toISOString(),
        duration_seconds: this.activeSecondsInSession,
        page_path: window.location.pathname || '/',
        referrer: this.metadata.referrer,
        device_type: this.metadata.deviceType,
        browser: this.metadata.browser,
        os: this.metadata.os,
        modes_played: Array.from(this.modesPlayed),
        games_started: this.gamesStartedCount,
        games_won: this.gamesWonCount,
        words_guessed: this.wordsGuessedCount,
        is_bounce: true,
      };

      const { error: sessionError } = await supabase
        .from('analytics_sessions')
        .upsert(sessionPayload, { onConflict: 'id' });
      if (sessionError) { this.tablesVerified = false; return; }
      this.tablesVerified = true;

      // 3. Insert Initial Pageview Event
      await this.trackEvent('page_view', {
        path: window.location.pathname,
        referrer: this.metadata.referrer,
        isNewVisitor: this.isNewVisitor,
      });
    } catch {
      this.tablesVerified = false;
    }
  }

  // Sync to local storage aggregate cache
  private updateLocalCache() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const raw = localStorage.getItem(LOCAL_ANALYTICS_KEY);
      const local = raw ? JSON.parse(raw) : {
        visitors: {},
        sessions: {},
        days: {},
      };

      // Visitor record
      local.visitors[this.visitorId] = {
        id: this.visitorId,
        firstSeen: localStorage.getItem('poople_visitor_first_seen') || new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        totalVisits: parseInt(localStorage.getItem('poople_visitor_visits') || '1', 10),
        totalSeconds: this.activeSecondsInSession,
        metadata: this.metadata,
      };

      // Session record
      local.sessions[this.sessionId] = {
        id: this.sessionId,
        visitorId: this.visitorId,
        duration: this.activeSecondsInSession,
        date: today,
        modes: Array.from(this.modesPlayed),
        gamesStarted: this.gamesStartedCount,
        gamesWon: this.gamesWonCount,
      };

      const days: Record<string, { visitors: Set<string>; sessions: number; totalDuration: number }> = {};
      for (const session of Object.values(local.sessions) as any[]) {
        if (!session || typeof session.date !== 'string') continue;
        const day = days[session.date] ||= { visitors: new Set(), sessions: 0, totalDuration: 0 };
        day.visitors.add(session.visitorId);
        day.sessions++;
        day.totalDuration += Number.isFinite(session.duration) ? session.duration : 0;
      }
      const serializableDays = Object.fromEntries(Object.entries(days).map(([date, day]) => [date, {
        visitorsCount: day.visitors.size,
        sessions: day.sessions,
        totalDuration: day.totalDuration
      }]));
      localStorage.setItem(LOCAL_ANALYTICS_KEY, JSON.stringify({
        visitors: local.visitors, sessions: local.sessions, days: serializableDays
      }));
    } catch {}
  }

  // --- Public Event Tracking APIs ---

  public async trackEvent(eventName: string, properties: Record<string, any> = {}) {
    this.updateLocalCache();

    if (!isSupabaseConfigured || !supabase || this.tablesVerified !== true) return;

    try {
      const { error } = await supabase.from('analytics_events').insert({
        session_id: this.sessionId,
        visitor_id: this.visitorId,
        event_name: eventName,
        properties,
        created_at: new Date().toISOString(),
      });
      if (error) this.tablesVerified = false;
    } catch { this.tablesVerified = false; }
  }

  public trackModeSwitch(mode: GameMode) {
    this.modesPlayed.add(mode);
    this.trackEvent('mode_switch', { mode });
  }

  public trackGameStart(mode: GameMode, options: Record<string, any> = {}) {
    this.gamesStartedCount++;
    this.modesPlayed.add(mode);
    this.trackEvent('game_start', { mode, ...options });
    this.flushHeartbeat();
  }

  public trackGameEnd(mode: GameMode, won: boolean, steps: number, par: number, durationSeconds?: number) {
    if (won) {
      this.gamesWonCount++;
    }
    this.trackEvent(won ? 'game_won' : 'game_lost', {
      mode,
      won,
      steps,
      par,
      diff: steps - par,
      durationSeconds: durationSeconds || 0,
    });
    this.flushHeartbeat();
  }

  public trackWordSubmission(word: string, isValid: boolean) {
    if (isValid) {
      this.wordsGuessedCount++;
    }
    this.trackEvent('word_guess', { word, isValid });
  }

  public getSessionDuration(): number {
    return this.activeSecondsInSession;
  }

  public getVisitorId(): string {
    return this.visitorId;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public destroy() {
    this.listenerController?.abort();
    this.listenerController = null;
    this.isInitialized = false;
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  // --- Summary & Metrics Fetching for Dashboard ---

  public async fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
    const fallbackSummary = this.computeLocalSummary();

    if (!isSupabaseConfigured || !supabase || this.tablesVerified === false) {
      return { ...fallbackSummary, isUsingSupabase: false, tablesExist: false };
    }

    try {
      // 1. Fetch count of unique visitors
      const { count: visitorCount, error: vErr } = await supabase
        .from('analytics_visitors')
        .select('*', { count: 'exact', head: true });

      if (vErr) {
        this.tablesVerified = false;
        return { ...fallbackSummary, isUsingSupabase: true, tablesExist: false };
      }

      // 2. Fetch recent visitors (up to 500) to compute metadata & device breakdown
      const { data: visitors } = await supabase
        .from('analytics_visitors')
        .select('*')
        .order('last_seen_at', { ascending: false })
        .limit(500);

      // 3. Fetch recent sessions
      const { data: sessions } = await supabase
        .from('analytics_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(1000);

      if (!visitors || !sessions) {
        return { ...fallbackSummary, isUsingSupabase: true, tablesExist: true };
      }

      const totalUniqueVisitors = visitorCount || visitors.length;
      const totalSessions = sessions.length;
      const totalDurationSeconds = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
      const avgDurationSeconds = totalSessions > 0 ? Math.round(totalDurationSeconds / totalSessions) : 0;

      // Device Breakdown
      const deviceBreakdown = { mobile: 0, desktop: 0, tablet: 0 };
      const browserCounts: Record<string, number> = {};
      const osCounts: Record<string, number> = {};
      const referrerCounts: Record<string, number> = {};
      const modeCounts: Record<string, number> = { daily: 0, unlimited: 0, rush: 0, versus: 0, campaign: 0 };

      visitors.forEach((v) => {
        const dev = (v.device_type || 'desktop') as keyof typeof deviceBreakdown;
        if (deviceBreakdown[dev] !== undefined) deviceBreakdown[dev]++;
        else deviceBreakdown.desktop++;

        const br = v.browser || 'Other';
        browserCounts[br] = (browserCounts[br] || 0) + 1;

        const os = v.os || 'Other';
        osCounts[os] = (osCounts[os] || 0) + 1;

        const ref = v.initial_referrer || 'direct';
        referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
      });

      sessions.forEach((s) => {
        if (Array.isArray(s.modes_played)) {
          s.modes_played.forEach((m: string) => {
            modeCounts[m] = (modeCounts[m] || 0) + 1;
          });
        }
      });

      // Daily trend (last 7-14 days)
      const dailyMap: Record<string, { visitors: Set<string>; sessions: number; duration: number }> = {};
      sessions.forEach((s) => {
        const d = (s.started_at || '').slice(0, 10);
        if (!d) return;
        if (!dailyMap[d]) dailyMap[d] = { visitors: new Set(), sessions: 0, duration: 0 };
        dailyMap[d].visitors.add(s.visitor_id);
        dailyMap[d].sessions++;
        dailyMap[d].duration += s.duration_seconds || 0;
      });

      const dailyVisits = Object.keys(dailyMap)
        .sort()
        .slice(-14)
        .map((d) => ({
          date: d,
          visitors: dailyMap[d].visitors.size,
          sessions: dailyMap[d].sessions,
          avgDuration: dailyMap[d].sessions > 0 ? Math.round(dailyMap[d].duration / dailyMap[d].sessions) : 0,
        }));

      const topBrowsers = Object.entries(browserCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / (visitors.length || 1)) * 100),
        }));

      const topOS = Object.entries(osCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / (visitors.length || 1)) * 100),
        }));

      const topReferrers = Object.entries(referrerCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([source, count]) => ({
          source,
          count,
          percentage: Math.round((count / (visitors.length || 1)) * 100),
        }));

      const returningVisitorsCount = visitors.filter((v) => (v.total_visits || 1) > 1).length;
      const newVisitorsCount = totalUniqueVisitors - returningVisitorsCount;

      return {
        totalUniqueVisitors,
        totalSessions,
        totalDurationSeconds,
        avgDurationSeconds,
        activeNow: 0, // Realtime presence is supplied separately by the dashboard.
        newVisitorsCount,
        returningVisitorsCount,
        deviceBreakdown,
        topBrowsers,
        topOS,
        topReferrers,
        modeBreakdown: modeCounts,
        dailyVisits: dailyVisits.length > 0 ? dailyVisits : fallbackSummary.dailyVisits,
        isUsingSupabase: true,
        tablesExist: true,
      };
    } catch {
      return { ...fallbackSummary, isUsingSupabase: true, tablesExist: false };
    }
  }

  // Local fallback aggregator for instant dev/offline stats
  private computeLocalSummary(): AnalyticsSummary {
    try {
      const raw = localStorage.getItem(LOCAL_ANALYTICS_KEY);
      const local = raw ? JSON.parse(raw) : { visitors: {}, sessions: {}, days: {} };

      const visitors = Object.values(local.visitors || {}) as any[];
      const sessions = Object.values(local.sessions || {}) as any[];
      const totalVisitors = Math.max(1, visitors.length);
      const totalSessions = Math.max(1, sessions.length);

      const totalDuration = sessions.reduce((acc, s) => acc + (s.id === this.sessionId ? this.activeSecondsInSession : (s.duration || 0)), 0);
      const avgDuration = Math.round(totalDuration / totalSessions);

      const deviceBreakdown = { mobile: 0, desktop: 0, tablet: 0 };
      const browserCounts: Record<string, number> = {};
      const osCounts: Record<string, number> = {};
      const referrerCounts: Record<string, number> = {};
      const modeCounts: Record<string, number> = { daily: 0, unlimited: 0, rush: 0, versus: 0, campaign: 0 };

      visitors.forEach((v) => {
        const meta = v.metadata || {};
        const dev = (meta.deviceType || 'desktop') as keyof typeof deviceBreakdown;
        if (deviceBreakdown[dev] !== undefined) deviceBreakdown[dev]++;
        else deviceBreakdown.desktop++;

        const br = meta.browser || 'Unknown';
        browserCounts[br] = (browserCounts[br] || 0) + 1;

        const os = meta.os || 'Unknown';
        osCounts[os] = (osCounts[os] || 0) + 1;

        const ref = meta.referrer || 'direct';
        referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
      });

      sessions.forEach((s) => {
        if (Array.isArray(s.modes)) {
          s.modes.forEach((m: string) => {
            modeCounts[m] = (modeCounts[m] || 0) + 1;
          });
        }
      });

      const today = new Date().toISOString().slice(0, 10);
      const days = local.days || {};
      const dailyVisits = Object.keys(days).sort().map((d) => ({
        date: d,
        visitors: days[d].visitorsCount || 1,
        sessions: days[d].sessions || 1,
        avgDuration: days[d].sessions ? Math.round((days[d].totalDuration || 0) / days[d].sessions) : 0,
      }));

      if (dailyVisits.length === 0) {
        dailyVisits.push({
          date: today,
          visitors: 1,
          sessions: 1,
          avgDuration: this.activeSecondsInSession,
        });
      }

      return {
        totalUniqueVisitors: totalVisitors,
        totalSessions,
        totalDurationSeconds: totalDuration,
        avgDurationSeconds: avgDuration,
        activeNow: 1,
        newVisitorsCount: visitors.filter(v => (v.totalVisits || 1) <= 1).length,
        returningVisitorsCount: visitors.filter(v => (v.totalVisits || 1) > 1).length,
        deviceBreakdown,
        topBrowsers: Object.entries(browserCounts).map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / totalVisitors) * 100),
        })),
        topOS: Object.entries(osCounts).map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / totalVisitors) * 100),
        })),
        topReferrers: Object.entries(referrerCounts).map(([source, count]) => ({
          source,
          count,
          percentage: Math.round((count / totalVisitors) * 100),
        })),
        modeBreakdown: modeCounts,
        dailyVisits,
        isUsingSupabase: isSupabaseConfigured,
        tablesExist: false,
      };
    } catch {
      return {
        totalUniqueVisitors: 1,
        totalSessions: 1,
        totalDurationSeconds: this.activeSecondsInSession,
        avgDurationSeconds: this.activeSecondsInSession,
        activeNow: 1,
        newVisitorsCount: 1,
        returningVisitorsCount: 0,
        deviceBreakdown: { mobile: 0, desktop: 1, tablet: 0 },
        topBrowsers: [{ name: this.metadata.browser, count: 1, percentage: 100 }],
        topOS: [{ name: this.metadata.os, count: 1, percentage: 100 }],
        topReferrers: [{ source: 'direct', count: 1, percentage: 100 }],
        modeBreakdown: { daily: 1, unlimited: 0, rush: 0, versus: 0, campaign: 0 },
        dailyVisits: [{ date: new Date().toISOString().slice(0, 10), visitors: 1, sessions: 1, avgDuration: 0 }],
        isUsingSupabase: isSupabaseConfigured,
        tablesExist: false,
      };
    }
  }
}

export const analytics = new AnalyticsEngine();
