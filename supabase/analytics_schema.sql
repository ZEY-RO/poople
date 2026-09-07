-- ==============================================================================
-- Poople Analytics Engine - Supabase Database Schema
-- 
-- Run this SQL in your Supabase project (Dashboard -> SQL Editor -> New Query)
-- Free Tier Compatible: Uses standard Postgres tables, indexes & RLS policies.
-- ==============================================================================

-- 1. Table: analytics_visitors
-- Stores unique visitors, device information, and lifetime activity metrics
CREATE TABLE IF NOT EXISTS public.analytics_visitors (
    id TEXT PRIMARY KEY,                           -- Anonymous visitor UUID (from localStorage)
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_visits INT NOT NULL DEFAULT 1,
    total_time_seconds INT NOT NULL DEFAULT 0,
    device_type TEXT,                              -- 'mobile', 'tablet', 'desktop'
    browser TEXT,                                  -- e.g. 'Chrome', 'Safari', 'Firefox'
    os TEXT,                                       -- e.g. 'iOS', 'Android', 'macOS', 'Windows'
    screen_resolution TEXT,                        -- e.g. '1920x1080'
    language TEXT,                                 -- e.g. 'en-US'
    timezone TEXT,                                 -- e.g. 'America/New_York'
    initial_referrer TEXT,                         -- e.g. 'https://google.com' or 'direct'
    initial_utm_source TEXT,                       -- UTM campaign source if any
    initial_utm_medium TEXT,
    initial_utm_campaign TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table: analytics_sessions
-- Stores individual browsing sessions and active engagement duration
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
    id TEXT PRIMARY KEY,                           -- Session UUID (from sessionStorage)
    visitor_id TEXT NOT NULL REFERENCES public.analytics_visitors(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_seconds INT NOT NULL DEFAULT 0,        -- Active focused time in seconds
    page_path TEXT NOT NULL DEFAULT '/',
    referrer TEXT DEFAULT 'direct',
    device_type TEXT,
    browser TEXT,
    os TEXT,
    modes_played TEXT[] DEFAULT '{}',               -- Array of modes played, e.g. ['daily', 'unlimited']
    games_started INT NOT NULL DEFAULT 0,
    games_won INT NOT NULL DEFAULT 0,
    words_guessed INT NOT NULL DEFAULT 0,
    is_bounce BOOLEAN NOT NULL DEFAULT true,        -- Becomes false once user interacts or stays > 15s
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table: analytics_events
-- Stores fine-grained interaction events (game starts, wins, custom builder, mode changes)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT REFERENCES public.analytics_sessions(id) ON DELETE CASCADE,
    visitor_id TEXT REFERENCES public.analytics_visitors(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,                      -- e.g. 'game_start', 'game_won', 'mode_switch'
    properties JSONB DEFAULT '{}'::jsonb,          -- Event details e.g. { "mode": "daily", "par": 4, "steps": 4 }
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- Indexes for Fast Dashboard Queries
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_visitors_last_seen ON public.analytics_visitors(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_first_seen ON public.analytics_visitors(first_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor_id ON public.analytics_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON public.analytics_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_visitor_id ON public.analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_event_name ON public.analytics_events(event_name);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- Enables public anonymous visitors to log sessions/heartbeats while keeping data secure
-- ==============================================================================
ALTER TABLE public.analytics_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous clients to insert and update their own visitor record
DROP POLICY IF EXISTS "Allow public insert to analytics_visitors" ON public.analytics_visitors;
CREATE POLICY "Allow public insert to analytics_visitors"
    ON public.analytics_visitors
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to analytics_visitors" ON public.analytics_visitors;
CREATE POLICY "Allow public update to analytics_visitors"
    ON public.analytics_visitors
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read to analytics_visitors" ON public.analytics_visitors;
CREATE POLICY "Allow public read to analytics_visitors"
    ON public.analytics_visitors
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow anonymous clients to insert and update their sessions
DROP POLICY IF EXISTS "Allow public insert to analytics_sessions" ON public.analytics_sessions;
CREATE POLICY "Allow public insert to analytics_sessions"
    ON public.analytics_sessions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to analytics_sessions" ON public.analytics_sessions;
CREATE POLICY "Allow public update to analytics_sessions"
    ON public.analytics_sessions
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read to analytics_sessions" ON public.analytics_sessions;
CREATE POLICY "Allow public read to analytics_sessions"
    ON public.analytics_sessions
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow anonymous clients to insert events
DROP POLICY IF EXISTS "Allow public insert to analytics_events" ON public.analytics_events;
CREATE POLICY "Allow public insert to analytics_events"
    ON public.analytics_events
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read to analytics_events" ON public.analytics_events;
CREATE POLICY "Allow public read to analytics_events"
    ON public.analytics_events
    FOR SELECT
    TO anon, authenticated
    USING (true);
