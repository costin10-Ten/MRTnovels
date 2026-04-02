import { getAuth } from '@clerk/astro/server';
import type { APIContext, AstroGlobal } from 'astro';

/** Returns userId or null. Use in API routes and SSR pages. */
export function getUserId(context: APIContext | AstroGlobal): string | null {
  const { userId } = getAuth(context.request);
  return userId ?? null;
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
