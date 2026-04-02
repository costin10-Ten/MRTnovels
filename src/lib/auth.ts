import type { APIContext } from 'astro';

/** Returns userId or null. Use in API routes (context.locals.auth()). */
export function getUserId(context: APIContext): string | null {
  return context.locals.auth().userId ?? null;
}

/** Throws 401 JSON response if not authenticated. */
export function requireAuth(context: APIContext): string {
  const userId = getUserId(context);
  if (!userId) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return userId;
}
