import { clerkMiddleware } from '@clerk/astro/server';
import { defineMiddleware, sequence } from 'astro:middleware';

/**
 * Keystatic reads request.url to build the OAuth redirect_uri.
 * On Vercel, the serverless function URL has localhost as the host.
 *
 * Fix: for every Keystatic route, replace the request URL with the
 * real public origin (from x-forwarded-host or PUBLIC_SITE_URL)
 * BEFORE passing it to Keystatic's handler, so Keystatic generates
 * the correct redirect_uri from the start.
 *
 * Using next(fixedRequest) instead of context.rewrite() ensures the
 * corrected request reaches Keystatic directly without re-running
 * this middleware (which would loop) or losing cookies.
 *
 * See: https://github.com/Thinkmill/keystatic/issues/1022
 */
const fixKeystatic = defineMiddleware(async (context, next) => {
  const isKeystatic =
    context.url.pathname.startsWith('/keystatic') ||
    context.url.pathname.startsWith('/api/keystatic');

  if (isKeystatic) {
    const fwdHost  = context.request.headers.get('x-forwarded-host');
    const fwdProto = context.request.headers.get('x-forwarded-proto') ?? 'https';
    const siteUrl  = import.meta.env.PUBLIC_SITE_URL ?? 'https://mrt-novels.vercel.app';
    const publicOrigin = fwdHost ? `${fwdProto}://${fwdHost}` : new URL(siteUrl).origin;

    if (context.url.origin !== publicOrigin) {
      // Build a new request URL with the correct public origin,
      // preserving the path, query string, and all request properties.
      const fixedUrl = new URL(context.request.url);
      fixedUrl.protocol = new URL(publicOrigin).protocol;
      fixedUrl.host     = new URL(publicOrigin).host;

      // Pass the fixed request directly to the next handler.
      // Keystatic will now see the correct origin when building redirect_uri.
      return next(new Request(fixedUrl.toString(), context.request));
    }
  }

  return next();
});

export const onRequest = sequence(fixKeystatic, clerkMiddleware());
