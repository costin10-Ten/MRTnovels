import type { APIRoute } from 'astro';
import { requireAuth } from '../../lib/auth';
import { toggleLike, isLiked } from '../../lib/supabase';

export const GET: APIRoute = async (ctx) => {
  try {
    const userId = requireAuth(ctx);
    const slug = ctx.url.searchParams.get('slug');
    if (!slug) return new Response(JSON.stringify({ error: 'Missing slug' }), { status: 400 });
    const liked = await isLiked(userId, slug);
    return new Response(JSON.stringify({ liked }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

export const POST: APIRoute = async (ctx) => {
  try {
    const userId = requireAuth(ctx);
    const { storySlug } = await ctx.request.json();
    if (!storySlug) return new Response(JSON.stringify({ error: 'Missing storySlug' }), { status: 400 });
    const liked = await toggleLike(userId, storySlug);
    return new Response(JSON.stringify({ liked }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
