import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#090d1a',
        surface: '#11172a',
        'surface-light': '#18213a',
        border: 'rgba(148, 163, 184, 0.18)',
        primary: {
          DEFAULT: '#7657f6',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#14c8a2',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#1a2339',
          foreground: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1rem',
      },
      boxShadow: {
        glow: '0 20px 48px rgba(118, 87, 246, 0.18)',
        'glow-accent': '0 20px 48px rgba(20, 200, 162, 0.14)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
