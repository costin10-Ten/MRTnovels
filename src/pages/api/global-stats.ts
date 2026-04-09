import type { APIRoute } from 'astro';
import { getGlobalStats } from '../../lib/supabase';

export const GET: APIRoute = async () => {
  try {
    const stats = await getGlobalStats();
    return new Response(JSON.stringify(stats), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch {
    return new Response(JSON.stringify({ views: 0, likes: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
