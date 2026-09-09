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
    },
  },
  plugins: [],
}
