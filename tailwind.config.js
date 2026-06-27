/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        darkbg: '#0F0F11',
        darkcard: '#16161A',
        darkborder: '#24242B',
        brandred: '#E11D48',
        brandblue: '#3B82F6',
        brandviolet: '#8B5CF6',
      }
    },
  },
  plugins: [],
}
