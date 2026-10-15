/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B132B',
          950: '#0A0F1D',
          800: '#1C2541',
          700: '#2A3B5C',
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        surface: {
          warm: '#FBFBF9',
          card: '#FFFFFF',
          muted: '#F3F4F6'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(15, 23, 42, 0.04)',
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'elevated': '0 12px 30px -4px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04)',
      }
    },
  },
  plugins: [],
}
