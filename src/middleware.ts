import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

const isMemberRoute = createRouteMatcher(['/member(.*)']);
const isAdminRoute = createRouteMatcher(['/keystatic(.*)']);

export const onRequest = clerkMiddleware((auth, context) => {
  // Member pages require login
  if (isMemberRoute(context.request)) {
    auth().protect();
  }
  // Keystatic admin requires login (additional role check can be added)
  if (isAdminRoute(context.request)) {
    auth().protect();
  }
});
