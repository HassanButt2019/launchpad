import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#f97316',
          hover: '#ea6c0a',
        },
      },
      fontFamily: {
        heading: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      backdropBlur: {
        glass: '12px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
