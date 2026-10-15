/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#070b14',
          card: '#0f172a',
          border: '#1e293b',
          neon: '#10b981',
          cyan: '#06b6d4',
          purple: '#8b5cf6',
          amber: '#f59e0b',
        }
      },
      animation: {
        'scan': 'scan 2s linear infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)' },
          '50%': { opacity: '.6', boxShadow: '0 0 5px rgba(16, 185, 129, 0.2)' }
        }
      }
    },
  },
  plugins: [],
}

