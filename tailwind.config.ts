import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rose: {
          950: '#4c0519',
        },
      },
    },
  },
  plugins: [],
};

export default config;
