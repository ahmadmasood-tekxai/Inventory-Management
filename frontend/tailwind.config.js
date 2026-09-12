/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f6ff',
          100: '#dbe9ff',
          200: '#b9d2ff',
          300: '#8bb4ff',
          400: '#5a8ff5',
          500: '#2f6fce',
          600: '#1c4d8c',
          700: '#173f70',
          800: '#13355e',
          900: '#0b2545',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '20%': { transform: 'rotate(-15deg)' },
          '40%': { transform: 'rotate(15deg)' },
          '60%': { transform: 'rotate(-10deg)' },
          '80%': { transform: 'rotate(10deg)' },
        },
        shrink: {
          '0%': { width: '100%' },
          '100%': { width: '0%' },
        },
      },
      animation: {
        wiggle: 'wiggle 0.6s ease-in-out',
        shrink: 'shrink 3.5s linear forwards',
      },
    },
  },
  plugins: [],
}
