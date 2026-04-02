import type { APIRoute } from 'astro';

// Test endpoint inside /api/keystatic/ path — our middleware should rewrite this URL
// If middleware next(fixedRequest) works: requestUrl will show mrt-novels.vercel.app
// If middleware does NOT work: requestUrl will still show localhost
// DELETE after diagnosis
export const GET: APIRoute = ({ request }) => {
  return new Response(JSON.stringify({
    middlewareTest: 'inside /api/keystatic/ path',
    requestUrl:     request.url,
    requestOrigin:  new URL(request.url).origin,
    isFixed:        !request.url.includes('localhost'),
  }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};
