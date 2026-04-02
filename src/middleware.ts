import { clerkMiddleware } from '@clerk/astro/server';
import { sequence } from 'astro:middleware';
import type { MiddlewareHandler } from 'astro';

/**
 * Keystatic constructs OAuth redirect_uri from the internal request host,
 * which Vercel routes as localhost inside serverless functions.
 * This middleware intercepts the GitHub OAuth authorization redirect and
 * rewrites the redirect_uri to use the real public domain.
 * See: https://github.com/Thinkmill/keystatic/issues/1022
 */
const fixKeystatic: MiddlewareHandler = async (_context, next) => {
  const response = await next();

  const location = response.headers.get('location') ?? '';
  if (
    (response.status === 301 || response.status === 302) &&
    location.includes('github.com/login/oauth/authorize') &&
    location.includes('redirect_uri=')
  ) {
    const siteOrigin = new URL(
      import.meta.env.PUBLIC_SITE_URL ?? 'https://mrt-novels.vercel.app'
    ).origin;

    const githubUrl = new URL(location);
    const redirectUri = githubUrl.searchParams.get('redirect_uri') ?? '';

    // Only fix if the callback host is localhost
    const callbackHost = new URL(redirectUri).hostname;
    if (callbackHost === 'localhost' || callbackHost === '127.0.0.1') {
      const fixedUri = redirectUri.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, siteOrigin);
      githubUrl.searchParams.set('redirect_uri', fixedUri);

      const newHeaders = new Headers(response.headers);
      newHeaders.set('location', githubUrl.toString());
      return new Response(null, { status: response.status, headers: newHeaders });
    }
  }

  return response;
};

export const onRequest = sequence(fixKeystatic, clerkMiddleware());
