import { clerkMiddleware } from '@clerk/astro/server';
import { defineMiddleware, sequence } from 'astro:middleware';

/**
 * Keystatic builds OAuth redirect_uri from the internal request host,
 * which Vercel routes as localhost inside serverless functions.
 * Intercept the outgoing GitHub OAuth redirect and rewrite redirect_uri
 * to the real public domain.
 * See: https://github.com/Thinkmill/keystatic/issues/1022
 */
const fixKeystatic = defineMiddleware(async (_context, next) => {
  const response = await next();

  const location = response.headers.get('location') ?? '';
  if (
    (response.status === 301 || response.status === 302) &&
    location.includes('github.com/login/oauth/authorize')
  ) {
    try {
      const githubUrl = new URL(location);
      const redirectUri = githubUrl.searchParams.get('redirect_uri');
      if (redirectUri) {
        const callbackUrl = new URL(redirectUri);
        if (callbackUrl.hostname === 'localhost' || callbackUrl.hostname === '127.0.0.1') {
          const siteOrigin = new URL(
            import.meta.env.PUBLIC_SITE_URL ?? 'https://mrt-novels.vercel.app'
          ).origin;
          callbackUrl.protocol = new URL(siteOrigin).protocol;
          callbackUrl.host = new URL(siteOrigin).host;
          githubUrl.searchParams.set('redirect_uri', callbackUrl.toString());
          const headers = new Headers(response.headers);
          headers.set('location', githubUrl.toString());
          return new Response(null, { status: response.status, headers });
        }
      }
    } catch {
      // URL parsing failed — return original response untouched
    }
  }

  return response;
});

export const onRequest = sequence(fixKeystatic, clerkMiddleware());
