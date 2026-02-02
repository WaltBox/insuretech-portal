import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Insur3Tech light cream theme
        'i3-bg': '#f5f3ee',           // Light cream/beige background
        'i3-bg-light': '#faf8f5',     // Lighter variant
        'i3-card': '#ffffff',         // White cards
        'i3-card-hover': '#f9f7f4',   // Slightly darker on hover
        'i3-border': '#e5e2dc',       // Subtle warm border
        'i3-navy': '#1a1a3e',         // Dark navy for text
        'i3-navy-light': '#2d2d5a',   // Lighter navy
        'i3-text': '#1a1a3e',         // Dark navy text
        'i3-text-muted': '#6b6b8a',   // Muted text
        'i3-text-secondary': '#4a4a6a', // Secondary text
        'i3-accent': '#1a1a3e',       // Navy accent (for CTAs)
        'i3-accent-hover': '#2d2d5a',
        // Legacy compatibility
        'beagle-orange': '#1a1a3e',
        'beagle-dark': '#1a1a3e',
        'beagle-light': '#f5f3ee',
        'accent-orange': '#2d2d5a',
        'success': '#10b981',
        'warning': '#f59e0b',
        'error': '#ef4444',
        'info': '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      transitionDuration: {
        '200': '200ms',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
export default config

