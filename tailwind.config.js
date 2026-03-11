/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        fairway: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        forest: {
          950: '#0F2419',
          900: '#122B1E',
          800: '#1A3828',
          700: '#1E4530',
        },
        gold: {
          300: '#F5D97A',
          400: '#E8C547',
          500: '#D4AF37',
          600: '#B8961E',
          700: '#9A7A10',
        },
        cream: '#F5F0E8',
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
