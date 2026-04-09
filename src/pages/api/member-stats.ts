import type { APIRoute } from 'astro';
import { requireAuth } from '../../lib/auth';
import { getUserHistory, getBookmarks, getLikedSlugs } from '../../lib/supabase';

export const GET: APIRoute = async (ctx) => {
  try {
    const userId = requireAuth(ctx);
    const [history, bookmarks, likedSlugs] = await Promise.all([
      getUserHistory(userId),
      getBookmarks(userId),
      getLikedSlugs(userId),
    ]);
    return new Response(JSON.stringify({ history, bookmarks, likedSlugs }), {
      headers: {
        'Content-Type': 'application/json',
        // No caching — personal data
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
