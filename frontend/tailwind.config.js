/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        night: {
          950: '#060913',
          900: '#0a0f1d',
          800: '#111827',
          700: '#1e293b',
        },
      },
      backgroundImage: {
        'night-purple': 'linear-gradient(135deg, #060913 0%, #0f172a 45%, #3b0764 100%)',
        'card-glow': 'radial-gradient(ellipse at top, rgba(168, 85, 247, 0.12), transparent 70%)',
      },
    },
  },
  plugins: [],
}