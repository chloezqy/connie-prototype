import type { Config } from 'tailwindcss'

/** Tailwind theme bridged to the CSS variables in src/styles/tokens.css */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--color-brand)',
          muted: 'var(--color-brand-muted)',
          light: 'var(--color-brand-light)',
        },
        fg: {
          primary: 'var(--color-fg-primary)',
          secondary: 'var(--color-fg-secondary)',
          brand: 'var(--color-fg-brand)',
          attention: 'var(--color-fg-attention)',
          inverse: 'var(--color-fg-inverse)',
          disabled: 'var(--color-fg-disabled)',
        },
        bg: {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          tertiary: 'var(--color-bg-tertiary)',
          brand: 'var(--color-bg-brand)',
          'brand-muted': 'var(--color-bg-brand-muted)',
          attention: 'var(--color-bg-attention)',
          'attention-muted': 'var(--color-bg-attention-muted)',
          disabled: 'var(--color-bg-disabled)',
        },
        border: {
          subtle: 'var(--color-border-subtle)',
          strong: 'var(--color-border-strong)',
          brand: 'var(--color-border-brand)',
          black: 'var(--color-border-black)',
          attention: 'var(--color-border-attention)',
        },
        rating: {
          excellent: 'var(--color-rating-excellent)',
          'very-good': 'var(--color-rating-very-good)',
          good: 'var(--color-rating-good)',
          fair: 'var(--color-rating-fair)',
          poor: 'var(--color-rating-poor)',
        },
        accent: { blue: 'var(--color-accent-blue)' },
        'cr-launcher': 'var(--color-cr-launcher)',
      },
      spacing: {
        '50': 'var(--space-50)',
        '75': 'var(--space-75)',
        '100': 'var(--space-100)',
        '200': 'var(--space-200)',
        '250': 'var(--space-250)',
        '300': 'var(--space-300)',
        '400': 'var(--space-400)',
        '600': 'var(--space-600)',
        '800': 'var(--space-800)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        pill: 'var(--radius-pill)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
      },
      fontSize: {
        // CR type styles pulled from Figma
        utility: ['var(--text-utility2)', { lineHeight: 'var(--leading-utility2)' }],
        eyebrow: ['14px', { lineHeight: '24px', letterSpacing: '2px' }], // UTILITY UPPERCASE
        body: ['16px', { lineHeight: '24px', letterSpacing: '0' }], // Type/Body
        title4: ['var(--text-title4)', { lineHeight: 'var(--leading-title4)', letterSpacing: 'var(--tracking-title4)' }],
        title2: ['24px', { lineHeight: '28px', letterSpacing: '-0.8px' }],
        title1: ['32px', { lineHeight: '36px', letterSpacing: '-1.5px' }], // Type/Title 1
        h3: ['24px', { lineHeight: '30px', letterSpacing: '-0.4px' }],
        h2: ['32px', { lineHeight: '38px', letterSpacing: '-0.6px' }],
        h1: ['40px', { lineHeight: '46px', letterSpacing: '-0.8px' }],
      },
      boxShadow: {
        subtle: 'var(--shadow-subtle)',
        panel: 'var(--shadow-panel)',
        sunken: 'var(--shadow-sunken)',
      },
      keyframes: {
        /** Pans a wide gradient across its box — the "Connie is listening" shimmer. */
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'gradient-pan': 'gradient-pan 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
