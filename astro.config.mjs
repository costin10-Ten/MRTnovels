import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwind from '@astrojs/tailwind';
import preact from '@astrojs/preact';
import clerk from '@clerk/astro';
import keystatic from '@keystatic/astro';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? 'https://mrt-novels.vercel.app',
  output: 'server',
  adapter: vercel(),
  integrations: [
    clerk(),
    tailwind({ applyBaseStyles: false }),
    preact({ compat: true }),
    keystatic(),
  ],
  vite: {
    optimizeDeps: {
      exclude: ['@keystatic/core'],
    },
  },
});
