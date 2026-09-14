/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    borderRadius: {
      none: '0px',
      DEFAULT: '0px',
      sm: '0px',
      md: '0px',
      lg: '0px',
      xl: '0px',
      '2xl': '0px',
      '3xl': '0px',
      full: '0px',
    },
    extend: {
      colors: {
        lime: {
          DEFAULT: '#BDFF00',
          50: '#F2FFD6',
          100: '#E8FFB3',
          200: '#D9FF66',
          300: '#CBFF33',
          400: '#BDFF00',
          500: '#9AD600',
          600: '#78A800',
          700: '#567A00',
          800: '#344C00',
          900: '#121E00',
        },
        offwhite: '#F5F5F0',
        charcoal: '#1A1A1A',
        owned: '#BDFF00',
        missing: '#8A8A8A',
      },
      fontFamily: {
        sans: ['Lexend', 'system-ui', 'sans-serif'],
        mono: ['Lexend', 'monospace'],
      },
      borderWidth: {
        DEFAULT: '2px',
        0: '0px',
        2: '2px',
        4: '4px',
      },
      boxShadow: {
        'hard': '4px 4px 0px 0px #1A1A1A',
        'hard-sm': '2px 2px 0px 0px #1A1A1A',
        'hard-lg': '6px 6px 0px 0px #1A1A1A',
        'hard-lime': '4px 4px 0px 0px #BDFF00',
        'hard-pressed': '2px 2px 0px 0px #1A1A1A',
        'none': 'none',
      },
    },
  },
  plugins: [],
};
