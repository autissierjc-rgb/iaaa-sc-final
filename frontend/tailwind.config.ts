import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '380px',   // small phones (iPhone SE etc.)
      },
      colors: {
        // Base surfaces
        ink: {
          base:     '#07070A',
          surface:  '#0D0D12',
          elevated: '#131318',
          border:   '#1E1E26',
        },
        // Text scale
        parchment: {
          DEFAULT: '#EAE6DE',
          dim:     '#A09B93',
          muted:   '#555250',
        },
        // Accent — warm gold
        gold: {
          DEFAULT: '#C4A882',
          bright:  '#D4BC96',
          dim:     '#7A6848',
        },
        // Accent — steel blue
        steel: '#4A7FA5',
        // Semantic
        tension:       '#C4826A',
        vulnerability: '#C46A6A',
        trajectory:    '#6A9EC4',
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-dm-mono)', 'monospace'],
      },
      letterSpacing: {
        widest: '0.25em',
        wider:  '0.15em',
      },
      maxWidth: {
        content: '72rem',
        prose:   '44rem',
        card:    '38rem',
      },
    },
  },
  plugins: [],
}

export default config
