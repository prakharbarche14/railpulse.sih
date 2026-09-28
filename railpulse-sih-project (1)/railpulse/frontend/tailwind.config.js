/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        rail: {
          950: '#04101c',
          900: '#071b2e',
          800: '#0d2b45',
          700: '#123a5c',
          600: '#1a4d78',
          500: '#2563a0',
          400: '#3b82c4',
          accent: '#ff7a1a',
          teal: '#12b1a6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        soft: '0 8px 30px rgba(4, 16, 28, 0.12)',
        glow: '0 0 0 1px rgba(37,99,160,0.15), 0 8px 24px rgba(4,16,28,0.35)',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        pulseDot: 'pulseDot 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
