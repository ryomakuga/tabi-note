/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        fadeInScale: 'fadeInScale 1.8s ease-out forwards',
      },
      keyframes: {
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '15%': { opacity: '1', transform: 'scale(1)' },
          '75%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(1)' },
        },
      },
      colors: {
        bg: '#ECE5D8',
        'bg-alt': '#F5EFE5',
        'bg-deep': '#DDD3C0',
        accent: '#4A3A28',
        secondary: '#A8A293',
        olive: '#5C7548',
        gold: '#8B6420',
        text: '#2A2218',
        'text-sub': '#4A3A28',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Noto Serif JP"', '"游明朝"', 'Yu Mincho', 'serif'],
        'serif-ja': ['"Noto Serif JP"', '"游明朝"', 'Yu Mincho', 'serif'],
        sans: ['Inter', '"游ゴシック"', 'YuGothic', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.45em',
        wider: '0.35em',
        wide: '0.2em',
      },
      borderColor: {
        line: 'rgba(58, 47, 31, 0.35)',
        'line-strong': 'rgba(58, 47, 31, 0.5)',
      },
    },
  },
  plugins: [],
}
