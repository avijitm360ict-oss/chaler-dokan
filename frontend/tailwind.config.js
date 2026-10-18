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
        // Design Brief Section 6 tokens
        primary: {
          50: '#E8F4EC',
          100: '#D1EAD9',
          500: '#27965F',
          600: '#1F7A4D', // color.primary.600 - Main action button, active tab, links
          700: '#16603B', // color.primary.700 - Hover / pressed state
          800: '#10492C',
          900: '#0B331F',
        },
        accent: {
          50: '#FFF4DC',  // color.accent.50 - Warning banner & chip background
          100: '#FEE8B9',
          400: '#EAB33E',
          500: '#E0A526', // color.accent.500 - Highlight, Rate card styling
          600: '#C78F1B',
          700: '#9E7013',
        },
        ink: {
          primary: '#1A1A17',   // color.text.primary - Main text
          secondary: '#5B574E', // color.text.secondary - Secondary helper text & labels
          disabled: '#8F8A7E',  // color.text.disabled - Inactive text
        },
        surface: {
          page: '#F6F5F1',    // color.bg.page - Warm light gray page background (sunlight-friendly)
          card: '#FFFFFF',    // color.bg.surface - Cards, forms, sheets
        },
        stroke: {
          default: '#DDD9CE', // color.border.default - Borders & dividers
          strong: '#A9A395',  // color.border.strong - Input borders
        },
        state: {
          success: '#1B7F3B',    // color.success.600 - Success, "মিলেছে", Paid
          warning: '#8A5A00',    // color.warning.700 - Warning text
          danger: '#B3261E',     // color.danger.600 - Error, Void, Loss warning
          dangerBg: '#FDECEA',   // color.danger.50 - Error background
          info: '#1D5FA8',       // color.info.600 - "পাবেন" (Receivable) blue badge
          owe: '#9A4A00',        // color.owe.700 - "দেবেন" (Payable) orange badge
        },
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
          600: '#1F7A4D',
          700: '#16603B',
          800: '#14532D',
          900: '#052E16',
        }
      },
      fontFamily: {
        sans: ['Hind Siliguri', 'Noto Sans Bengali', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(26, 26, 23, 0.05), 0 1px 2px -1px rgba(26, 26, 23, 0.05)',
        'sheet': '0 10px 25px -5px rgba(26, 26, 23, 0.15), 0 8px 10px -6px rgba(26, 26, 23, 0.1)',
        'modal': '0 25px 50px -12px rgba(26, 26, 23, 0.25)',
      }
    },
  },
  plugins: [],
}
