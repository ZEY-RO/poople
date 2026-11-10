import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { loadSettings } from './services/storage';
import { applyTheme } from './services/theme';
import { normalizeLegacyGameUrl } from './seo/routes';

// Apply saved theme immediately on initial load
applyTheme(loadSettings().theme);

const canonicalGameUrl = normalizeLegacyGameUrl(window.location);
if (canonicalGameUrl) {
  window.location.replace(canonicalGameUrl);
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
