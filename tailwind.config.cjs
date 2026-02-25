/** @type {import('tailwindcss').Config} */
const { heroui } = require("@heroui/react"); // Import from main package

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // Point to the react package for all component styles
    './node_modules/@heroui/react/dist/**/*.{js,ts,jsx,tsx}',
  './node_modules/@heroui/modal/dist/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [heroui()],
}