import type { APIRoute } from 'astro';
import { getUserId } from '../../lib/auth';
import {
  getStoryStats, getComments, isLiked, isBookmarked,
} from '../../lib/supabase';

export const GET: APIRoute = async (ctx) => {
  const slug = ctx.url.searchParams.get('slug');
  if (!slug || slug.length > 200 || /[/\\.]/.test(slug)) {
    return new Response(JSON.stringify({ error: 'Invalid slug' }), { status: 400 });
  }

  const userId = getUserId(ctx);

  const [stats, comments, liked, bookmarked] = await Promise.all([
    getStoryStats(slug).catch(() => ({ views: 0, likes: 0 })),
    getComments(slug).catch(() => []),
    userId ? isLiked(userId, slug).catch(() => false) : false,
    userId ? isBookmarked(userId, slug).catch(() => false) : false,
  ]);

  return new Response(JSON.stringify({ stats, comments, liked, bookmarked }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
  });
};
