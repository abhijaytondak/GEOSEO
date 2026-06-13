/**
 * Dashboard SaaS — Tailwind token preset
 * Mirrors design/tokens.css. Spread into tailwind.config theme.extend,
 * or use as a `presets: [require('./design/tailwind.tokens.js')]` entry.
 *
 * Colors reference the CSS variables in tokens.css so light/dark + accent
 * re-skinning stays single-source-of-truth. Load tokens.css globally.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        canvas:        'var(--canvas)',
        surface:       'var(--surface)',
        'surface-sunken': 'var(--surface-sunken)',
        border: {
          DEFAULT: 'var(--border-hairline)',
          strong:  'var(--border-strong)',
        },
        text: {
          primary:     'var(--text-primary)',
          body:        'var(--text-body)',
          muted:       'var(--text-muted)',
          placeholder: 'var(--text-placeholder)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover:   'var(--accent-hover)',
          soft:    'var(--accent-soft)',
        },
        cta: {
          DEFAULT: 'var(--cta)',
          hover:   'var(--cta-hover)',
        },
        positive: 'var(--positive)',
        negative: 'var(--negative)',
        warning:  'var(--warning)',
        info:     'var(--info)',
        viz: {
          1: 'var(--viz-1)', 2: 'var(--viz-2)', 3: 'var(--viz-3)',
          4: 'var(--viz-4)', 5: 'var(--viz-5)', 6: 'var(--viz-6)',
        },
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        display: ['36px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        kpi:     ['30px', { lineHeight: '1.15', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h-card':['16px', { lineHeight: '1.3', fontWeight: '600' }],
        body:    ['14px', { lineHeight: '1.5' }],
        label:   ['13px', { lineHeight: '1.4' }],
        micro:   ['11px', { lineHeight: '1.3', letterSpacing: '0.04em' }],
      },
      fontWeight: {
        regular:  '450',
        medium:   '500',
        semibold: '600',
        bold:     '700',
      },
      borderRadius: {
        sm:   '8px',
        md:   '12px',
        card: '16px',
        lg:   '20px',
        pill: '999px',
      },
      spacing: {
        'card-pad': '22px',
        'card-gap': '20px',
        sidebar:    '232px',
      },
      boxShadow: {
        card:  '0 1px 2px rgba(20,22,26,.04), 0 4px 16px rgba(20,22,26,.04)',
        float: '0 12px 32px rgba(20,22,26,.10)',
      },
      backgroundImage: {
        aurora: 'var(--aurora)',
      },
    },
  },
};
