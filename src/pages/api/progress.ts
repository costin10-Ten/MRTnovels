import type { APIRoute } from 'astro';
import { requireAuth } from '../../lib/auth';
import { upsertProgress, getProgress } from '../../lib/supabase';

export const GET: APIRoute = async (ctx) => {
  try {
    const userId = requireAuth(ctx);
    const slug = ctx.url.searchParams.get('slug');
    if (!slug || slug.length > 200 || /[/\\.]/.test(slug)) {
      return new Response(JSON.stringify({ error: 'Invalid slug' }), { status: 400 });
    }
    const pct = await getProgress(userId, slug);
    return new Response(JSON.stringify({ pct }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

export const POST: APIRoute = async (ctx) => {
  try {
    const userId = requireAuth(ctx);
    const body = await ctx.request.json();
    const { storySlug, pct } = body;
    if (!storySlug || typeof storySlug !== 'string' || storySlug.length > 200 || /[/\\.]/.test(storySlug) ||
        typeof pct !== 'number' || pct < 0 || pct > 100) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }
    await upsertProgress(userId, storySlug, pct);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
