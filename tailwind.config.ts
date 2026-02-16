import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sacred: {
          50: '#f0f7f4',
          100: '#d9ede2',
          200: '#b5dbc7',
          300: '#85c2a5',
          400: '#57a680',
          500: '#1B7A4E',
          600: '#156640',
          700: '#105234',
          800: '#0d4129',
          900: '#0a3622',
        },
        gold: {
          50: '#fdf9ef',
          100: '#f9efd3',
          200: '#f2dca5',
          300: '#e9c36d',
          400: '#D4A843',
          500: '#c49230',
          600: '#a67326',
          700: '#855622',
          800: '#6d4522',
          900: '#5c3a20',
        },
        night: {
          50: '#f4f6f7',
          100: '#e3e7ea',
          200: '#c9d1d7',
          300: '#a4b0ba',
          400: '#778896',
          500: '#5c6d7b',
          600: '#4f5c69',
          700: '#444e58',
          800: '#1A2332',
          900: '#111827',
          950: '#0B1120',
        },
      },
      fontFamily: {
        arabic: ['Scheherazade New', 'Amiri', 'serif'],
        heading: ['Playfair Display', 'serif'],
        body: ['Source Sans 3', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'star-pop': 'starPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(27, 122, 78, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(27, 122, 78, 0.6)' },
        },
        starPop: {
          '0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
