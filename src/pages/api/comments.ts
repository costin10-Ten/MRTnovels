import type { APIRoute } from 'astro';
import { requireAuth } from '../../lib/auth';
import { getComments, addComment, countRecentComments } from '../../lib/supabase';

const RATE_LIMIT = 5; // max comments per hour per user

export const GET: APIRoute = async (ctx) => {
  const slug = ctx.url.searchParams.get('slug');
  if (!slug) return new Response(JSON.stringify({ error: 'Missing slug' }), { status: 400 });
  const comments = await getComments(slug);
  return new Response(JSON.stringify(comments), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async (ctx) => {
  try {
    const userId = requireAuth(ctx);
    const { storySlug, body } = await ctx.request.json();

    if (!storySlug || !body || typeof body !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }
    const trimmed = body.trim();
    if (trimmed.length === 0 || trimmed.length > 1000) {
      return new Response(JSON.stringify({ error: 'Invalid body length' }), { status: 400 });
    }

    // Rate limit
    const recent = await countRecentComments(userId);
    if (recent >= RATE_LIMIT) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 });
    }

    const comment = await addComment(userId, storySlug, trimmed);
    return new Response(JSON.stringify(comment), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
