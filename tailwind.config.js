/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/ui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Industrial Metro palette
        forge: {
          void: '#0a0a0a',
          dark: '#141414',
          cinder: '#1e1e1e',
          concrete: '#2a2a2a',
        },
        ink: {
          primary: '#e8e8e4',
          secondary: '#9e9e99',
          muted: '#5c5c58',
        },
        rust: {
          DEFAULT: '#c45c1a',
          light: '#e07a3a',
          dim: '#7a3a0f',
        },
        signal: {
          green: '#4a7c59',
          red: '#8b3a3a',
          amber: '#7a6020',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'DIN Next', 'D-DIN', 'system-ui', '-apple-system', 'Arial', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Roboto Mono', 'Courier New', 'monospace'],
      },
      borderRadius: {
        none: '0px',
      },
      letterSpacing: {
        industrial: '0.06em',
        label: '0.08em',
        wide2: '0.04em',
      },
    },
  },
  plugins: [],
};
