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
        background: '#F8FAFC',
        surface: '#FFFFFF',
        'surface-dark': '#0F172A',
        border: 'rgba(15, 23, 42, 0.12)',
        primary: {
          DEFAULT: '#6D28D9',
          foreground: '#FFFFFF',
          subtle: '#EDE9FE',
          emphasis: '#5B21B6',
        },
        secondary: {
          DEFAULT: '#2563EB',
          foreground: '#FFFFFF',
          subtle: '#DBEAFE',
          emphasis: '#1D4ED8',
        },
        accent: {
          DEFAULT: '#0891B2',
          foreground: '#FFFFFF',
          subtle: '#CFFAFE',
          emphasis: '#0E7490',
        },
        success: {
          DEFAULT: '#16A34A',
          foreground: '#FFFFFF',
          subtle: '#DCFCE7',
          emphasis: '#15803D',
        },
        warning: {
          DEFAULT: '#D97706',
          foreground: '#FFFFFF',
          subtle: '#FEF3C7',
          emphasis: '#B45309',
        },
        danger: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
          subtle: '#FEE2E2',
          emphasis: '#B91C1C',
        },
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#475569',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '0.875rem',
        '2xl': '1rem',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(15, 23, 42, 0.06)',
        DEFAULT: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.06)',
        md: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)',
        lg: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.06)',
        glow: '0 20px 48px rgba(109, 40, 217, 0.16)',
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
