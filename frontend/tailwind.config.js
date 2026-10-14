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
        rice: {
          50: '#FBF9F4',
          100: '#F4EFE6',
          200: '#E8DDC9',
          300: '#D5C3A1',
          400: '#BFA475',
          500: '#A4854D',
          600: '#8A6C3A',
          700: '#6C532C',
          800: '#533F23',
          900: '#3D2F1B',
        },
        paddy: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#16A34A',
          600: '#15803D',
          700: '#166534',
          800: '#14532D',
          900: '#052E16',
        },
        gold: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        }
      },
      fontFamily: {
        sans: ['Hind Siliguri', 'Noto Sans Bengali', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
