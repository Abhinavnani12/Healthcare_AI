/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hospital: {
          50: '#f4f7fa',
          100: '#e2ebf4',
          200: '#c5d7e9',
          500: '#1a56db', // Hospital Blue
          600: '#1e429f',
          700: '#1a3066',
          brand: '#0f4c81', // Core brand blue
          teal: '#0d9488',
        },
      },
    },
  },
  plugins: [],
}
