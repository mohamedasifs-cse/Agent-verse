/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 900: '#0a0e1a', 800: '#0d1224', 700: '#111827' },
        cyan: { neon: '#00f5ff' },
        purple: { neon: '#bf00ff' },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};
