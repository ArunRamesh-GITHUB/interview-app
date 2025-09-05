// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          on: 'var(--color-primary-on)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          on: 'var(--color-secondary-on)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          alt: 'var(--color-accent-alt)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          alt: 'var(--color-surface-alt)',
        },
        card: {
          DEFAULT: 'var(--color-card)',
          'tinted-orange': 'var(--color-card-tinted-orange)',
          'tinted-lavender': 'var(--color-card-tinted-lavender)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
        border: 'var(--color-border)',
        divider: 'var(--color-divider)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        chart: {
          1: 'var(--color-chart-1)',
          2: 'var(--color-chart-2)',
          3: 'var(--color-chart-3)',
          4: 'var(--color-chart-4)',
        },
        overlay: 'var(--color-overlay)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        xxl: 'var(--radius-xxl)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        'level-0': 'var(--shadow-level-0)',
        'level-1': 'var(--shadow-level-1)',
        'level-2': 'var(--shadow-level-2)',
        'level-3': 'var(--shadow-level-3)',
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        7: 'var(--space-7)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
      },
      fontFamily: {
        primary: ['var(--font-family-primary)'],
        numeric: ['var(--font-family-numeric)'],
      },
      fontSize: {
        'display': ['var(--text-display-size)', { lineHeight: 'var(--text-display-line)', fontWeight: 'var(--text-display-weight)' }],
        'headline': ['var(--text-headline-size)', { lineHeight: 'var(--text-headline-line)', fontWeight: 'var(--text-headline-weight)' }],
        'title': ['var(--text-title-size)', { lineHeight: 'var(--text-title-line)', fontWeight: 'var(--text-title-weight)' }],
        'subtitle': ['var(--text-subtitle-size)', { lineHeight: 'var(--text-subtitle-line)', fontWeight: 'var(--text-subtitle-weight)' }],
        'body': ['var(--text-body-size)', { lineHeight: 'var(--text-body-line)', fontWeight: 'var(--text-body-weight)' }],
        'label': ['var(--text-label-size)', { lineHeight: 'var(--text-label-line)', fontWeight: 'var(--text-label-weight)' }],
        'caption': ['var(--text-caption-size)', { lineHeight: 'var(--text-caption-line)', fontWeight: 'var(--text-caption-weight)' }],
      },
      transitionDuration: {
        'instant': 'var(--duration-instant)',
        'fast': 'var(--duration-fast)',
        'standard': 'var(--duration-standard)',
        'slow': 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        'in-out': 'var(--ease-in-out)',
        'decelerate': 'var(--ease-decelerate)',
        'accelerate': 'var(--ease-accelerate)',
      },
      minHeight: {
        'dvh': '100dvh',
      },
      backgroundColor: {
        'hero-orange': 'var(--hero-orange)',
        'hero-lavender': 'var(--hero-lavender)',
      },
    },
  },
  plugins: [],
}
