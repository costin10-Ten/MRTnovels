import type { APIRoute } from 'astro';
import { getMultipleStoryStats } from '../../lib/supabase';

export const GET: APIRoute = async (ctx) => {
  const raw = ctx.url.searchParams.get('slugs') ?? '';
  const slugs = raw
    .split(',')
    .map(s => s.trim())
    .filter(s => /^[a-z0-9][a-z0-9-]{0,98}$/.test(s))
    .slice(0, 20);

  if (slugs.length === 0) {
    return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
  }

  const stats = await getMultipleStoryStats(slugs).catch(() =>
    slugs.map(() => ({ views: 0, likes: 0 })),
  );

  return new Response(
    JSON.stringify(slugs.map((slug, i) => ({ slug, ...stats[i] }))),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    },
  );
};
