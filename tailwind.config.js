/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // D&D Parchment theme
        parchment: {
          50: '#fefdfb',
          100: '#fdf9f3',
          200: '#f9f0e1',
          300: '#f3e4c9',
          400: '#e8d4a8',
          500: '#d9be84',
          600: '#c4a265',
          700: '#a17f4a',
          800: '#7d5f38',
          900: '#5c452a',
        },
        ink: {
          50: '#f7f6f5',
          100: '#e8e4df',
          200: '#d1c9bf',
          300: '#b5a794',
          400: '#968370',
          500: '#7a6655',
          600: '#5e4d40',
          700: '#453931',
          800: '#2e2621',
          900: '#1a1613',
        },
        gold: {
          50: '#fffceb',
          100: '#fff4c6',
          200: '#ffe588',
          300: '#ffd14a',
          400: '#ffba20',
          500: '#f59b07',
          600: '#d97502',
          700: '#b45106',
          800: '#923e0c',
          900: '#78330d',
        },
        blood: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc2626',
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#450a0a',
        },
      },
      fontFamily: {
        // We can add custom fonts later
        display: ['Georgia', 'serif'],
        body: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
