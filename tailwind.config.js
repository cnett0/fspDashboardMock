/** @type {import('tailwindcss').Config} */
import animate from 'tailwindcss-animate'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        // Existing FSP semantic tokens (preserved for all existing components)
        surface: {
          900: '#0a0c0f',
          800: '#111418',
          700: '#181c22',
          600: '#1e242d',
          500: '#252d38',
          400: '#2d3747',
        },
        accent: {
          green: '#22c55e',
          'green-dim': '#16a34a',
          amber: '#f59e0b',
          'amber-dim': '#d97706',
          red: '#ef4444',
          'red-dim': '#dc2626',
          blue: '#38bdf8',
          'blue-dim': '#0284c7',
          cyan: '#06b6d4',
          purple: '#a855f7',
        },
        'border-subtle': '#1e2733',
        'border-default': '#263040',
        'border-strong': '#374357',
        // shadcn/ui CSS-variable tokens (for CBP design system compat)
        border: 'oklch(var(--border) / <alpha-value>)',
        input: 'oklch(var(--input) / <alpha-value>)',
        ring: 'oklch(var(--ring) / <alpha-value>)',
        background: 'oklch(var(--background) / <alpha-value>)',
        foreground: 'oklch(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
          foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
          foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
          foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
          foreground: 'oklch(var(--muted-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'oklch(var(--card) / <alpha-value>)',
          foreground: 'oklch(var(--card-foreground) / <alpha-value>)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm, calc(var(--radius) - 4px))',
        md: 'var(--radius-md, calc(var(--radius) - 2px))',
        lg: 'var(--radius-lg, var(--radius))',
        xl: 'var(--radius-xl, calc(var(--radius) + 4px))',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', '0.875rem'],
        xs: ['0.75rem', '1rem'],
        sm: ['0.8125rem', '1.125rem'],
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
}
