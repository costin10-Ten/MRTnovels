import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwind from '@astrojs/tailwind';
import preact from '@astrojs/preact';
import clerk from '@clerk/astro';
import keystatic from '@keystatic/astro';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? 'https://mrt-novels.vercel.app',
  output: 'server',
  adapter: vercel(),
  integrations: [
    clerk(),
    tailwind({ applyBaseStyles: false }),
    preact({ compat: true }),
    keystatic(),
    sitemap({
      filter: (page) =>
        !page.includes('/keystatic') &&
        !page.includes('/sign-in') &&
        !page.includes('/sign-up') &&
        !page.includes('/member') &&
        !page.includes('/api'),
    }),
  ],
  vite: {
    optimizeDeps: {
      exclude: ['@keystatic/core'],
    },
  },
});
