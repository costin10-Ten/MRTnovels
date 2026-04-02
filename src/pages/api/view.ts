import type { APIRoute } from 'astro';
import { incrementViews } from '../../lib/supabase';

export const POST: APIRoute = async (ctx) => {
  try {
    const { storySlug } = await ctx.request.json();
    if (!storySlug) return new Response(JSON.stringify({ error: 'Missing storySlug' }), { status: 400 });
    await incrementViews(storySlug);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
