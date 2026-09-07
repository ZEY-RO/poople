import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Clock, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  RefreshCw, 
  Download, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  BarChart3, 
  Compass, 
  Gamepad2,
  Copy,
  Check
} from 'lucide-react';
import { analytics, AnalyticsSummary, isSupabaseConfigured } from '../services/analytics';
import { useLivePlayerCount } from '../services/liveCounter';
import { soundFx } from '../services/audio';

interface SiteAnalyticsModalProps {
  onClose: () => void;
}

export const SiteAnalyticsModal: React.FC<SiteAnalyticsModalProps> = ({ onClose }) => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tech' | 'sources' | 'sql'>('overview');
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const { stats: liveStats } = useLivePlayerCount();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const summary = await analytics.fetchAnalyticsSummary();
      setData(summary);
    } catch {
      // Handled internally in analytics service
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDuration = (totalSeconds: number): string => {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes < 60) return `${minutes}m ${seconds}s`;
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return `${hours}h ${remMinutes}m`;
  };

  const handleExportJson = () => {
    soundFx.playKey();
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poople-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sqlSchemaSnippet = `-- Run this in Supabase -> SQL Editor -> New Query:
CREATE TABLE IF NOT EXISTS public.analytics_visitors (
    id TEXT PRIMARY KEY,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_visits INT NOT NULL DEFAULT 1,
    total_time_seconds INT NOT NULL DEFAULT 0,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    screen_resolution TEXT,
    language TEXT,
    timezone TEXT,
    initial_referrer TEXT,
    initial_utm_source TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics_sessions (
    id TEXT PRIMARY KEY,
    visitor_id TEXT NOT NULL REFERENCES public.analytics_visitors(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_seconds INT NOT NULL DEFAULT 0,
    page_path TEXT NOT NULL DEFAULT '/',
    referrer TEXT DEFAULT 'direct',
    device_type TEXT,
    browser TEXT,
    os TEXT,
    modes_played TEXT[] DEFAULT '{}',
    games_started INT NOT NULL DEFAULT 0,
    games_won INT NOT NULL DEFAULT 0,
    words_guessed INT NOT NULL DEFAULT 0,
    is_bounce BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT REFERENCES public.analytics_sessions(id) ON DELETE CASCADE,
    visitor_id TEXT REFERENCES public.analytics_visitors(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.analytics_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to analytics_visitors" ON public.analytics_visitors FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update to analytics_visitors" ON public.analytics_visitors FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read to analytics_visitors" ON public.analytics_visitors FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public insert to analytics_sessions" ON public.analytics_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update to analytics_sessions" ON public.analytics_sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read to analytics_sessions" ON public.analytics_sessions FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public insert to analytics_events" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public read to analytics_events" ON public.analytics_events FOR SELECT TO anon, authenticated USING (true);`;

  const copySqlToClipboard = () => {
    soundFx.playKey();
    navigator.clipboard.writeText(sqlSchemaSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const totalDevs = (data?.deviceBreakdown.desktop || 0) + (data?.deviceBreakdown.mobile || 0) + (data?.deviceBreakdown.tablet || 0) || 1;
  const desktopPct = Math.round(((data?.deviceBreakdown.desktop || 0) / totalDevs) * 100);
  const mobilePct = Math.round(((data?.deviceBreakdown.mobile || 0) / totalDevs) * 100);
  const tabletPct = Math.round(((data?.deviceBreakdown.tablet || 0) / totalDevs) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-pop">
      <div className="w-full max-w-2xl bg-theme-modal text-theme-text-primary rounded-3xl shadow-2xl border border-theme-border overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:px-6 border-b border-theme-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-black text-theme-text-primary flex items-center gap-2">
                Site & Visitor Analytics
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-theme-accent/20 text-theme-accent uppercase tracking-wider">
                  Admin
                </span>
              </h2>
              <p className="text-xs text-theme-text-muted">
                Unique visitors, active engagement time & user metrics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => {
                soundFx.playKey();
                loadData();
              }}
              title="Refresh Stats"
              className={`p-2 rounded-xl text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-bg-secondary btn-press ${
                isLoading ? 'animate-spin' : ''
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                soundFx.playKey();
                onClose();
              }}
              className="p-2 rounded-xl text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-bg-secondary btn-press"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Database Status Banner */}
        <div className="px-4 sm:px-6 py-2 bg-theme-bg-secondary/70 border-b border-theme-border/40 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2">
            {data?.tablesExist ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Supabase Connected (Live Database)
              </span>
            ) : isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                Local Analytics Buffer (SQL tables not run in Supabase yet)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-semibold">
                <Database className="w-3.5 h-3.5" />
                Offline Local Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-theme-text-muted">
              Live tabs: <strong className="text-theme-text-primary">{liveStats.total}</strong>
            </span>
            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-theme-accent hover:underline"
            >
              <Download className="w-3 h-3" />
              Export JSON
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-theme-border/60 px-4 sm:px-6 bg-theme-bg-primary/50 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { soundFx.playKey(); setActiveTab('overview'); }}
            className={`py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-theme-text-muted hover:text-theme-text-primary'
            }`}
          >
            Overview & Time
          </button>
          <button
            onClick={() => { soundFx.playKey(); setActiveTab('tech'); }}
            className={`py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'tech'
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-theme-text-muted hover:text-theme-text-primary'
            }`}
          >
            Devices & Browsers
          </button>
          <button
            onClick={() => { soundFx.playKey(); setActiveTab('sources'); }}
            className={`py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'sources'
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-theme-text-muted hover:text-theme-text-primary'
            }`}
          >
            Traffic & Gameplay
          </button>
          {!data?.tablesExist && (
            <button
              onClick={() => { soundFx.playKey(); setActiveTab('sql'); }}
              className={`py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'sql'
                  ? 'border-amber-500 text-amber-500'
                  : 'border-transparent text-amber-600 dark:text-amber-400 hover:opacity-80'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Setup Supabase SQL
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* 4 Core Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Unique Visitors */}
                <div className="p-3.5 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
                  <div className="flex items-center justify-between text-theme-accent mb-1.5">
                    <Users className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-theme-text-muted">
                      Unique
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-display font-black text-theme-accent">
                    {data?.totalUniqueVisitors.toLocaleString() || 0}
                  </div>
                  <div className="text-[11px] font-semibold text-theme-text-muted mt-1">
                    Unique Visitors
                  </div>
                </div>

                {/* Avg Time Spent */}
                <div className="p-3.5 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
                  <div className="flex items-center justify-between text-theme-text-secondary mb-1.5">
                    <Clock className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-theme-text-muted">
                      Active
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-display font-black text-theme-text-primary">
                    {formatDuration(data?.avgDurationSeconds || 0)}
                  </div>
                  <div className="text-[11px] font-semibold text-theme-text-muted mt-1">
                    Avg Time / Session
                  </div>
                </div>

                {/* Total Sessions */}
                <div className="p-3.5 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
                  <div className="flex items-center justify-between text-amber-500 mb-1.5">
                    <Flame className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-theme-text-muted">
                      Visits
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-display font-black text-amber-500">
                    {data?.totalSessions.toLocaleString() || 0}
                  </div>
                  <div className="text-[11px] font-semibold text-theme-text-muted mt-1">
                    Total Sessions
                  </div>
                </div>

                {/* Total Time Spent Across All Users */}
                <div className="p-3.5 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
                  <div className="flex items-center justify-between text-emerald-500 mb-1.5">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-theme-text-muted">
                      Cumulative
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-display font-black text-emerald-500">
                    {formatDuration(data?.totalDurationSeconds || 0)}
                  </div>
                  <div className="text-[11px] font-semibold text-theme-text-muted mt-1">
                    Total App Engagement
                  </div>
                </div>
              </div>

              {/* Visitor Loyalty & Retention */}
              <div className="p-4 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
                <h3 className="text-xs font-bold text-theme-text-primary mb-2.5 flex items-center gap-2">
                  <Users className="w-4 h-4 text-theme-accent" />
                  Visitor Loyalty & Retention
                </h3>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-theme-bg-secondary/60">
                    <span className="text-xl font-display font-black text-theme-accent block">
                      {data?.newVisitorsCount || 0}
                    </span>
                    <span className="text-[10px] font-bold text-theme-text-muted uppercase">
                      New Visitors
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-theme-bg-secondary/60">
                    <span className="text-xl font-display font-black text-emerald-500 block">
                      {data?.returningVisitorsCount || 0}
                    </span>
                    <span className="text-[10px] font-bold text-theme-text-muted uppercase">
                      Returning Players
                    </span>
                  </div>
                </div>
              </div>

              {/* Daily Traffic Breakdown */}
              <div className="p-4 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
                <h3 className="text-xs font-bold text-theme-text-primary mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-theme-accent" />
                    Recent Activity Timeline
                  </span>
                  <span className="text-[10px] text-theme-text-muted">Last active days</span>
                </h3>
                <div className="space-y-2">
                  {data?.dailyVisits && data.dailyVisits.length > 0 ? (
                    data.dailyVisits.map((day) => (
                      <div key={day.date} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-xl bg-theme-bg-secondary/40">
                        <span className="font-semibold text-theme-text-secondary">{day.date}</span>
                        <div className="flex items-center gap-4 text-right">
                          <span className="text-theme-text-muted">
                            <strong className="text-theme-text-primary">{day.visitors}</strong> visitors
                          </span>
                          <span className="text-theme-text-muted">
                            <strong className="text-theme-text-primary">{day.sessions}</strong> sessions
                          </span>
                          <span className="text-theme-accent font-bold">
                            {formatDuration(day.avgDuration)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-theme-text-muted text-center py-4">
                      Activity will appear as users play.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TECH & DEVICES */}
          {activeTab === 'tech' && (
            <div className="space-y-4">
              {/* Device Split */}
              <div className="p-4 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
                <h3 className="text-xs font-bold text-theme-text-primary mb-3 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-theme-accent" />
                  Device Breakdown
                </h3>
                
                {/* Visual Ratio Bar */}
                <div className="h-4 rounded-full overflow-hidden flex w-full bg-theme-bg-secondary mb-3">
                  <div 
                    style={{ width: `${desktopPct}%` }} 
                    className="bg-sky-500 h-full transition-all" 
                    title={`Desktop: ${desktopPct}%`}
                  />
                  <div 
                    style={{ width: `${mobilePct}%` }} 
                    className="bg-amber-500 h-full transition-all" 
                    title={`Mobile: ${mobilePct}%`}
                  />
                  <div 
                    style={{ width: `${tabletPct}%` }} 
                    className="bg-emerald-500 h-full transition-all" 
                    title={`Tablet: ${tabletPct}%`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-theme-bg-secondary/60">
                    <Monitor className="w-4 h-4 mx-auto mb-1 text-sky-500" />
                    <span className="font-bold block text-theme-text-primary">{desktopPct}%</span>
                    <span className="text-[10px] text-theme-text-muted">Desktop ({data?.deviceBreakdown.desktop || 0})</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-theme-bg-secondary/60">
                    <Smartphone className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                    <span className="font-bold block text-theme-text-primary">{mobilePct}%</span>
                    <span className="text-[10px] text-theme-text-muted">Mobile ({data?.deviceBreakdown.mobile || 0})</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-theme-bg-secondary/60">
                    <Tablet className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                    <span className="font-bold block text-theme-text-primary">{tabletPct}%</span>
                    <span className="text-[10px] text-theme-text-muted">Tablet ({data?.deviceBreakdown.tablet || 0})</span>
                  </div>
                </div>
              </div>

              {/* Browsers & OS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Top Browsers */}
                <div className="p-4 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
                  <h3 className="text-xs font-bold text-theme-text-primary mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-theme-accent" />
                    Browsers
                  </h3>
                  <div className="space-y-2">
                    {data?.topBrowsers && data.topBrowsers.length > 0 ? (
                      data.topBrowsers.map((b) => (
                        <div key={b.name} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-theme-text-secondary">{b.name}</span>
                          <span className="text-theme-text-muted font-bold">
                            {b.count} ({b.percentage}%)
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-theme-text-muted">No browser data yet</span>
                    )}
                  </div>
                </div>

                {/* Top OS */}
                <div className="p-4 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
                  <h3 className="text-xs font-bold text-theme-text-primary mb-3 flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-theme-accent" />
                    Operating Systems
                  </h3>
                  <div className="space-y-2">
                    {data?.topOS && data.topOS.length > 0 ? (
                      data.topOS.map((o) => (
                        <div key={o.name} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-theme-text-secondary">{o.name}</span>
                          <span className="text-theme-text-muted font-bold">
                            {o.count} ({o.percentage}%)
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-theme-text-muted">No OS data yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SOURCES & GAMEPLAY */}
          {activeTab === 'sources' && (
            <div className="space-y-4">
              {/* Traffic Sources & Referrers */}
              <div className="p-4 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
                <h3 className="text-xs font-bold text-theme-text-primary mb-3 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-theme-accent" />
                  Traffic Sources & Referrers
                </h3>
                <div className="space-y-2">
                  {data?.topReferrers && data.topReferrers.length > 0 ? (
                    data.topReferrers.map((r) => (
                      <div key={r.source} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-xl bg-theme-bg-secondary/40">
                        <span className="font-semibold text-theme-text-primary capitalize">
                          {r.source === 'direct' ? 'Direct / Bookmarks / App' : r.source}
                        </span>
                        <span className="text-theme-accent font-bold">
                          {r.count} visits ({r.percentage}%)
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-theme-text-muted">No referrer data logged yet</div>
                  )}
                </div>
              </div>

              {/* Game Mode Popularity */}
              <div className="p-4 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
                <h3 className="text-xs font-bold text-theme-text-primary mb-3 flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-theme-accent" />
                  Game Mode Engagement
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  {['daily', 'unlimited', 'rush', 'versus', 'campaign'].map((modeKey) => {
                    const count = data?.modeBreakdown[modeKey] || 0;
                    return (
                      <div key={modeKey} className="p-2.5 rounded-xl bg-theme-bg-secondary/60">
                        <span className="text-base font-display font-black text-theme-accent block">
                          {count}
                        </span>
                        <span className="text-[10px] font-bold text-theme-text-muted uppercase capitalize">
                          {modeKey === 'campaign' ? 'Gauntlet' : modeKey}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SQL SETUP */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs">
                <h4 className="font-bold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                  <Database className="w-4 h-4" />
                  Enable Supabase Analytics Database (1-Click SQL)
                </h4>
                <p className="text-theme-text-secondary leading-relaxed mb-3">
                  Poople is already configured with your Supabase credentials. To store all visitor data in your central Supabase database across devices, copy the SQL below and paste it into the{' '}
                  <strong className="text-theme-text-primary">Supabase Dashboard &rarr; SQL Editor &rarr; Run</strong>.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copySqlToClipboard}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow hover:bg-amber-600 transition-colors btn-press"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Schema'}
                  </button>
                  <span className="text-[11px] text-theme-text-muted">
                    File also saved at <code className="text-theme-accent">supabase/analytics_schema.sql</code>
                  </span>
                </div>
              </div>

              <div className="relative rounded-2xl bg-black/90 p-3 overflow-x-auto text-[11px] font-mono text-emerald-400 max-h-60 custom-scrollbar border border-white/10">
                <pre>{sqlSchemaSnippet}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-6 border-t border-theme-border/60 bg-theme-bg-secondary/40 flex items-center justify-between text-xs text-theme-text-muted">
          <span>Active Session: <code className="text-theme-accent">{formatDuration(analytics.getSessionDuration())}</code></span>
          <button
            onClick={() => { soundFx.playKey(); onClose(); }}
            className="px-4 py-1.5 rounded-xl bg-theme-accent text-theme-accent-text font-bold text-xs shadow hover:opacity-90 transition-opacity btn-press"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
