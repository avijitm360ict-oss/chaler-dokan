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
        // Modern Crisp Emerald & Slate Design System
        primary: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669', // Main Brand Emerald Green
          700: '#047857', // Hover / Pressed Green
          800: '#065F46',
          900: '#064E3B',
        },
        accent: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          400: '#FBBF24',
          500: '#F59E0B', // Honey Amber Gold
          600: '#D97706',
          700: '#B45309',
        },
        ink: {
          primary: '#0F172A',   // Deep Slate 900 - High Contrast
          secondary: '#475569', // Crisp Slate 600 - Highly Legible
          disabled: '#94A3B8',  // Slate 400
        },
        surface: {
          page: '#F8FAFC',    // Crisp Slate 50 Page Background
          card: '#FFFFFF',    // Pure White Surfaces
        },
        stroke: {
          default: '#E2E8F0', // Clean Slate 200 Border
          strong: '#CBD5E1',  // Slate 300 Input Border
        },
        state: {
          success: '#10B981',    // Emerald 500
          warning: '#F59E0B',    // Amber 500
          danger: '#EF4444',     // Crimson Red 500
          dangerBg: '#FEF2F2',   // Red 50
          info: '#2563EB',       // Royal Blue 600 - পাবেন
          owe: '#EA580C',        // Orange 600 - দেবেন
        },
        rice: {
          50: '#FAF8F5',
          100: '#F5EFE6',
          200: '#E8DDC9',
          500: '#A4854D',
          600: '#8A6C3A',
        },
        paddy: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        }
      },
      fontFamily: {
        sans: ['"Anek Bangla"', '"Noto Sans Bengali"', '"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'sheet': '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
        'modal': '0 25px 50px -12px rgba(15, 23, 42, 0.22)',
      }
    },
  },
  plugins: [],
}
