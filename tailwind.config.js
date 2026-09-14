/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'system-ui', 'sans-serif'],
        serif: ['Amiri', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          50: '#f0f9f4',
          100: '#dcf2e6',
          200: '#bbe4cd',
          300: '#8cd0ab',
          400: '#56b683',
          500: '#329864',
          600: '#237a4f',
          700: '#1e6141',
          800: '#1a4d36',
          900: '#16402d',
          950: '#0b231a',
        },
        sand: {
          50: '#fbf8f4',
          100: '#f5efe4',
          200: '#eadbc4',
          300: '#dec29c',
          400: '#d0a373',
          500: '#c48853',
          600: '#a86c40',
          700: '#855335',
          800: '#6e432f',
          900: '#5a3829',
          950: '#311d16',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 4px 24px rgba(0,0,0,0.06)',
        lift: '0 10px 40px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
}