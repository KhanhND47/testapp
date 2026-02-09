/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      spacing: {
        'safe-top': 'var(--safe-top)',
        'safe-bottom': 'var(--safe-bottom)',
        'nav': 'var(--bottom-nav-height)',
        'header': 'var(--header-height)',
      },
      minHeight: {
        'screen-d': '100dvh',
      },
      maxWidth: {
        'mobile': '480px',
      },
    },
  },
  plugins: [],
};
