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
        'beagle-orange': '#ff7a00',
        'beagle-dark': '#3a2415',
        'beagle-light': '#f8f5f0',
        'accent-orange': '#ff8a26',
        'accent-orange-alt': '#FF9500',
        'orange-light': '#fff3e6',
          'orange-lighter': '#fcf8f6',
        'success': '#10b981',
        'warning': '#f59e0b',
        'error': '#ef4444',
        'info': '#3b82f6',
      },
      fontFamily: {
        sans: ['Bricolage Grotesque', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      transitionDuration: {
        '200': '200ms',
      },
    },
  },
  plugins: [],
}
export default config

