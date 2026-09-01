/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        theme: {
          bg: {
            primary: 'var(--bg-primary)',
            secondary: 'var(--bg-secondary)',
            card: 'var(--bg-card)',
            muted: 'var(--bg-card-muted)',
          },
          text: {
            primary: 'var(--text-primary)',
            secondary: 'var(--text-secondary)',
            muted: 'var(--text-muted)',
          },
          accent: {
            DEFAULT: 'var(--accent)',
            hover: 'var(--accent-hover)',
            light: 'var(--accent-light)',
            text: 'var(--accent-text)',
          },
          border: {
            DEFAULT: 'var(--border-color)',
            subtle: 'var(--border-subtle)',
          },
          tile: {
            start: {
              bg: 'var(--tile-start-bg)',
              text: 'var(--tile-start-text)',
              border: 'var(--tile-start-border)',
            },
            empty: {
              DEFAULT: 'var(--tile-empty)',
              text: 'var(--tile-empty-text)',
              border: 'var(--tile-border)',
            },
            active: {
              bg: 'var(--tile-active-bg)',
              border: 'var(--tile-active-border)',
              text: 'var(--tile-active-text)',
            },
            diff: {
              bg: 'var(--tile-diff-bg)',
              border: 'var(--tile-diff-border)',
              text: 'var(--tile-diff-text)',
            },
            correct: {
              bg: 'var(--tile-correct-bg)',
              border: 'var(--tile-correct-border)',
              text: 'var(--tile-correct-text)',
            },
          },
          key: {
            DEFAULT: 'var(--key-bg)',
            text: 'var(--key-text)',
            border: 'var(--key-border)',
            hover: 'var(--key-hover)',
            special: {
              bg: 'var(--key-special-bg)',
              text: 'var(--key-special-text)',
              border: 'var(--key-special-border)',
            },
            backspace: {
              bg: 'var(--key-backspace-bg)',
              text: 'var(--key-backspace-text)',
              border: 'var(--key-backspace-border)',
            },
          },
          nav: {
            active: {
              bg: 'var(--nav-active-bg)',
              text: 'var(--nav-active-text)',
            },
            inactive: {
              bg: 'var(--nav-inactive-bg)',
              text: 'var(--nav-inactive-text)',
            },
          },
          modal: {
            DEFAULT: 'var(--modal-bg)',
            border: 'var(--modal-border)',
            subcard: 'var(--modal-subcard)',
            'subcard-border': 'var(--modal-subcard-border)',
          }
        },
        poop: {
          50: '#fdf8f4',
          100: '#f9eee4',
          200: '#f2dac7',
          300: '#e7be9e',
          400: '#d79b6f',
          500: '#cb7e47',
          600: '#be683c',
          700: '#9e5233',
          800: '#7f432d',
          900: '#5a3021',
          950: '#351b12',
        },
        gold: {
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Fredoka"', '"Nunito"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        pixel: ['"Press Start 2P"', 'monospace']
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '70%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
        bounceShort: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        flush: {
          '0%': { transform: 'rotate(0deg) scale(1)', opacity: '1' },
          '50%': { transform: 'rotate(180deg) scale(0.6)', opacity: '0.7' },
          '100%': { transform: 'rotate(360deg) scale(0)', opacity: '0' }
        },
        glow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.6))' },
          '50%': { filter: 'drop-shadow(0 0 16px rgba(234, 179, 8, 0.9))' },
        }
      },
      animation: {
        pop: 'pop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        shake: 'shake 0.35s ease-in-out',
        bounceShort: 'bounceShort 0.5s ease-in-out',
        flush: 'flush 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        glow: 'glow 2s infinite ease-in-out',
      }
    },
  },
  plugins: [],
}
