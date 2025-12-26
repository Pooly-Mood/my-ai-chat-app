import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}', // se usi anche pages router
  ],
  theme: {
    extend: {
      colors: {
        // Colori personalizzati per il tema vino/legno
        brown: {
          500: '#8b1313ff',
          600: '#A0522D',
          700: '#c76969ff',
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.4s ease-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;