/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E07020',
          dark: '#B85A0A',
          light: '#F5A05A',
        },
        bg: {
          main: '#FFFFFF',
          secondary: '#F8F6F3',
        },
        border: '#E5E1DA',
        success: '#3B6D11',
        warning: '#854F0B',
        danger: '#A32D2D',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
