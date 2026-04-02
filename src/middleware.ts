import { clerkMiddleware } from '@clerk/astro/server';
import { defineMiddleware, sequence } from 'astro:middleware';

/**
 * Keystatic reads request.url to build the OAuth redirect_uri.
 * On Vercel, the serverless function sees the URL as localhost.
 *
 * Two-layer fix (Keystatic issue #1022):
 *  1. Rewrite incoming requests to Keystatic routes so they carry the real
 *     public origin — Keystatic then builds the correct redirect_uri.
 *  2. As a fallback, intercept any outgoing redirect to GitHub OAuth and
 *     patch the redirect_uri if it still contains localhost.
 */
const fixKeystatic = defineMiddleware(async (context, next) => {
  const isKeystatic =
    context.url.pathname.startsWith('/keystatic') ||
    context.url.pathname.startsWith('/api/keystatic');

  // --- Layer 1: rewrite incoming request URL ---
  if (isKeystatic) {
    // Prefer x-forwarded-host (set by Vercel) over the env var fallback
    const fwdProto = context.request.headers.get('x-forwarded-proto') ?? 'https';
    const fwdHost  = context.request.headers.get('x-forwarded-host');
    const siteUrl  = import.meta.env.PUBLIC_SITE_URL ?? 'https://mrt-novels.vercel.app';
    const siteOrigin = new URL(siteUrl).origin;
    const targetOrigin = fwdHost ? `${fwdProto}://${fwdHost}` : siteOrigin;

    if (context.url.origin !== targetOrigin) {
      const fixed = new URL(context.request.url);
      fixed.protocol = `${fwdProto}:`;
      fixed.host = fwdHost ?? new URL(siteOrigin).host;

      // Rebuild headers without the host header so the rewrite uses the new URL
      const headers = new Headers(context.request.headers);
      headers.set('host', fixed.host);

      return context.rewrite(
        new Request(fixed.toString(), {
          method:  context.request.method,
          headers,
          body:    context.request.body ?? undefined,
        })
      );
    }
  }

  // --- Layer 2: patch outgoing GitHub OAuth redirect ---
  const response = await next();
  const location = response.headers.get('location') ?? '';

  if (
    [301, 302, 303, 307, 308].includes(response.status) &&
    location.includes('github.com/login/oauth/authorize')
  ) {
    try {
      const githubUrl = new URL(location);
      const redirectUri = githubUrl.searchParams.get('redirect_uri');
      if (redirectUri) {
        const cbUrl = new URL(redirectUri);
        if (cbUrl.hostname === 'localhost' || cbUrl.hostname === '127.0.0.1') {
          const siteOrigin = new URL(
            import.meta.env.PUBLIC_SITE_URL ?? 'https://mrt-novels.vercel.app'
          ).origin;
          cbUrl.protocol = new URL(siteOrigin).protocol;
          cbUrl.host     = new URL(siteOrigin).host;
          githubUrl.searchParams.set('redirect_uri', cbUrl.toString());
          const headers = new Headers(response.headers);
          headers.set('location', githubUrl.toString());
          return new Response(null, { status: response.status, headers });
        }
      }
    } catch {
      // URL parse failed — return original response untouched
    }
  }

  return response;
});

export const onRequest = sequence(fixKeystatic, clerkMiddleware());
