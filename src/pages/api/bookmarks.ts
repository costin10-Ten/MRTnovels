import type { APIRoute } from 'astro';
import { requireAuth } from '../../lib/auth';
import { addBookmark, removeBookmark, getBookmarks } from '../../lib/supabase';

export const GET: APIRoute = async (ctx) => {
  // Simple redirect-based bookmark toggle (for non-JS fallback from story page)
  try {
    const userId = requireAuth(ctx);
    const action = ctx.url.searchParams.get('action');
    const slug = ctx.url.searchParams.get('slug');
    // Validate ref is a relative path to prevent open redirect
    const rawRef = ctx.url.searchParams.get('ref') ?? '/';
    const ref = rawRef.startsWith('/') && !rawRef.startsWith('//') ? rawRef : '/';

    if (action && slug) {
      if (action === 'add') await addBookmark(userId, slug);
      if (action === 'remove') await removeBookmark(userId, slug);
      return ctx.redirect(ref, 302);
    }

    const bookmarks = await getBookmarks(userId);
    return new Response(JSON.stringify(bookmarks), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

export const POST: APIRoute = async (ctx) => {
  try {
    const userId = requireAuth(ctx);
    const { storySlug, action } = await ctx.request.json();
    if (!storySlug || !['add', 'remove'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }
    if (action === 'add') await addBookmark(userId, storySlug);
    else await removeBookmark(userId, storySlug);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
