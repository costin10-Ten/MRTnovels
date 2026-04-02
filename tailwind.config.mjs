/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
          '"Noto Sans TC"', '"PingFang TC"', '"Microsoft JhengHei"',
          'Helvetica Neue', 'Arial', 'sans-serif',
        ],
      },
      colors: {
        border: '#e5e5e5',
        sidebar: '#fafafa',
      },
    },
  },
  plugins: [],
};
