import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}','./components/**/*.{js,ts,jsx,tsx}','./features/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {
    fontFamily: { sans:['DM Sans','system-ui','sans-serif'], arabic:['Amiri','serif'], heading:['Playfair Display','serif'] },
  }},
  plugins: [],
}
export default config
