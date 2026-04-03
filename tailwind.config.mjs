/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        // Noto Sans TC is Google's official Chinese font; Roboto for Latin
        sans: [
          '"Noto Sans TC"', '"Google Sans"', 'Roboto',
          '"PingFang TC"', '"Microsoft JhengHei"',
          'Helvetica Neue', 'Arial', 'sans-serif',
        ],
      },
      colors: {
        // Google Material / Search palette
        gblue: {
          DEFAULT: '#1a73e8',
          light:   '#e8f0fe',
          dark:    '#8ab4f8',
          'dark-light': '#1e3a5f',
        },
        gsurface: {
          DEFAULT: '#ffffff',
          bg:      '#f8f9fa',
          dark:    '#303134',
          'dark-bg': '#202124',
        },
        gtext: {
          DEFAULT: '#202124',
          '2':     '#5f6368',
          '3':     '#9aa0a6',
          dark:    '#e8eaed',
          'dark-2': '#9aa0a6',
        },
        gborder: {
          DEFAULT: '#dadce0',
          dark:    '#3c4043',
        },
      },
    },
  },
  plugins: [],
};
