import type { APIRoute } from 'astro';
import { requireAuth } from '../../lib/auth';
import { getComments, addComment, countRecentComments } from '../../lib/supabase';

const RATE_LIMIT = 5; // max comments per hour per user

function isValidSlug(slug: unknown): slug is string {
  return typeof slug === 'string' && slug.length > 0 && slug.length <= 200 && !/[/\\.]/.test(slug);
}

// Never expose full Clerk user IDs to other visitors — a short prefix is
// enough for the avatar initials the UI renders.
function redactUserId<T extends { user_id: string }>(c: T): T {
  return { ...c, user_id: c.user_id.slice(0, 10) };
}

export const GET: APIRoute = async (ctx) => {
  const slug = ctx.url.searchParams.get('slug');
  if (!isValidSlug(slug)) {
    return new Response(JSON.stringify({ error: 'Invalid slug' }), { status: 400 });
  }
  const comments = await getComments(slug);
  return new Response(JSON.stringify(comments.map(redactUserId)), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async (ctx) => {
  try {
    const userId = requireAuth(ctx);
    const { storySlug, body } = await ctx.request.json();

    if (!isValidSlug(storySlug) || !body || typeof body !== 'string') {
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
    return new Response(JSON.stringify(redactUserId(comment)), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
