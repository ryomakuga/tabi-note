/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#ECE5D8',
        'bg-alt': '#F5EFE5',
        'bg-deep': '#DDD3C0',
        accent: '#8B7355',
        secondary: '#A8A293',
        olive: '#5C7548',
        gold: '#C49B5C',
        text: '#3A2F1F',
        'text-sub': '#8B7355',
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
        line: 'rgba(58, 47, 31, 0.15)',
        'line-strong': 'rgba(58, 47, 31, 0.3)',
      },
    },
  },
  plugins: [],
}
