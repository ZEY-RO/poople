import type { GameMode } from '../types/game';
import { findShortestPath } from '../engine/solver';

const MODE_PATHS: Record<Exclude<GameMode, 'custom'>, string> = {
  daily: '/daily/',
  unlimited: '/unlimited/',
  rush: '/rush/',
  versus: '/versus/',
  campaign: '/campaign/',
};

function isNamedMode(value: string | null): value is Exclude<GameMode, 'custom'> {
  return value !== null && Object.prototype.hasOwnProperty.call(MODE_PATHS, value);
}

function canonicalDocumentPath(pathname: string): string {
  return `${pathname.replace(/\/index\.html$/, '/').replace(/\/+$/, '')}/`;
}

export function getModePath(mode: GameMode): string {
  return mode === 'custom' ? '/' : MODE_PATHS[mode];
}

export function resolveInitialMode(location: Pick<Location, 'pathname' | 'search'>): GameMode {
  const legacyMode = new URLSearchParams(location.search).get('mode');
  if (isNamedMode(legacyMode)) return legacyMode;
  const path = canonicalDocumentPath(location.pathname);
  return (Object.keys(MODE_PATHS) as Exclude<GameMode, 'custom'>[])
    .find(mode => MODE_PATHS[mode] === path) ?? 'daily';
}

// Older shared links remain usable, while a new document supplies the matching
// canonical metadata and visible content for each named game mode.
export function normalizeLegacyGameUrl(location: Pick<Location, 'href'>): string | null {
  const current = new URL(location.href);
  const normalized = new URL(current);
  const path = canonicalDocumentPath(current.pathname);
  if (path !== '/' && !Object.values(MODE_PATHS).includes(path)) return null;

  const start = current.searchParams.get('start')?.trim().toUpperCase();
  const target = current.searchParams.get('target')?.trim().toUpperCase();
  const customPath = start && target && /^[A-Z]{4}$/.test(start) && /^[A-Z]{4}$/.test(target)
    ? findShortestPath(start, target) : null;
  if (customPath && customPath.length > 1) {
    normalized.pathname = '/';
    normalized.searchParams.delete('mode');
    normalized.searchParams.delete('date');
    normalized.searchParams.set('start', start!);
    normalized.searchParams.set('target', target!);
  } else {
    const legacyMode = current.searchParams.get('mode');
    normalized.pathname = isNamedMode(legacyMode) ? getModePath(legacyMode) : path;
    if (isNamedMode(legacyMode)) normalized.searchParams.delete('mode');
  }

  return normalized.href === current.href ? null
    : `${normalized.pathname}${normalized.search}${normalized.hash}`;
}
