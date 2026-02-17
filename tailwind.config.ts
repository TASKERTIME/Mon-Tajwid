import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}','./features/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['Amiri', 'serif'],
        heading: ['Playfair Display', 'serif'],
      },
      colors: {
        sacred: { 400:'#57a680', 500:'#1B7A4E' },
        night: { 700:'#444e58', 800:'#1A2332', 900:'#111827', 950:'#0B1120' },
      },
    },
  },
  plugins: [],
}
export default config
