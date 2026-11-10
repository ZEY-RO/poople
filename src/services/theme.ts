import { ThemeId } from '../types/game';

export const ALL_THEME_IDS: ThemeId[] = [
  'classic',
  'poop',
  'dark',
  'retro',
  'gold',
  'pastel'
];

export function applyTheme(theme: ThemeId): void {
  const root = document.documentElement;
  const body = document.body;
  const targetTheme = ALL_THEME_IDS.includes(theme) ? theme : 'classic';
  const themeClass = targetTheme === 'classic' ? 'theme-classic' : `theme-${targetTheme}`;

  // Decorative fonts are needed only by optional themes, so keep them off the
  // default page's critical request path.
  if (targetTheme !== 'classic' && !document.getElementById('theme-fonts')) {
    const fonts = document.createElement('link');
    fonts.id = 'theme-fonts';
    fonts.rel = 'stylesheet';
    fonts.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Press+Start+2P&display=swap';
    document.head.appendChild(fonts);
  }

  // Remove existing theme classes from html and body
  ALL_THEME_IDS.forEach(t => {
    const cls = t === 'classic' ? 'theme-classic' : `theme-${t}`;
    root.classList.remove(cls);
    if (body) body.classList.remove(cls);
  });

  // Add new theme class & data attribute
  root.classList.add(themeClass);
  root.setAttribute('data-theme', targetTheme);
  if (body) {
    body.classList.add(themeClass);
    body.setAttribute('data-theme', targetTheme);
  }

  // Dark mode flag for Tailwind class strategy
  if (targetTheme === 'dark' || targetTheme === 'retro' || targetTheme === 'gold' || targetTheme === 'poop') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
