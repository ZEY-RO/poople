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
