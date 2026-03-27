import type { Config } from 'tailwindcss'
import defaultConfig from 'tailwindcss/defaultConfig'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        'on-primary': 'var(--primary-foreground)',
        'primary-accent': 'var(--primary-accent)',
        'primary-container': 'var(--primary-container)',
        'on-primary-container': 'var(--on-primary-container)',
        surface: 'var(--surface)',
        'on-surface': 'var(--on-surface)',
        'surface-variant': 'var(--surface-variant)',
        'on-surface-variant': 'var(--on-surface-variant)',
        outline: 'var(--outline)',
        'outline-variant': 'var(--outline-variant)',
        'surface-container-low': 'var(--surface-container-low)',
        'surface-container': 'var(--surface-container)',
        'surface-container-high': 'var(--surface-container-high)',
        'surface-container-highest': 'var(--surface-container-highest)',
        'surface-container-lowest': 'var(--surface-container-lowest)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        border: 'var(--border)',
        'border-soft': 'var(--border-soft)',
        destructive: 'var(--destructive)',
        success: 'var(--success)',
      },
    },
  },
  plugins: [],
}

export default config
