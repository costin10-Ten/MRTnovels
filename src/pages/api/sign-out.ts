import type { APIRoute } from 'astro';
import { clerkClient } from '@clerk/astro/server';

export const GET: APIRoute = async (ctx) => {
  const { sessionId } = ctx.locals.auth();
  if (sessionId) {
    try {
      await clerkClient(ctx).sessions.revokeSession(sessionId);
    } catch {
      // Revocation failure is non-fatal — redirect anyway
    }
  }
  return ctx.redirect('/', 302);
};
