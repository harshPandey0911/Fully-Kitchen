import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{jsx,js,ts,tsx}",
    "./src/styles/**/*.{jsx,js,ts,tsx,css}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
