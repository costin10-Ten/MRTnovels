import type { APIRoute } from 'astro';

// Temporary debug endpoint — DELETE after diagnosing Keystatic OAuth
export const GET: APIRoute = ({ request }) => {
  const clientSecret = import.meta.env.KEYSTATIC_GITHUB_CLIENT_SECRET ?? '';
  const ksSecret     = import.meta.env.KEYSTATIC_SECRET ?? '';

  const info = {
    requestUrl:      request.url,
    requestOrigin:   new URL(request.url).origin,
    host:            request.headers.get('host'),
    xForwardedHost:  request.headers.get('x-forwarded-host'),
    xForwardedProto: request.headers.get('x-forwarded-proto'),
    envVarsPresent: {
      KEYSTATIC_GITHUB_CLIENT_ID:     !!import.meta.env.KEYSTATIC_GITHUB_CLIENT_ID,
      KEYSTATIC_GITHUB_CLIENT_SECRET: !!import.meta.env.KEYSTATIC_GITHUB_CLIENT_SECRET,
      KEYSTATIC_SECRET:               !!import.meta.env.KEYSTATIC_SECRET,
      GITHUB_REPO_OWNER:              !!import.meta.env.GITHUB_REPO_OWNER,
      GITHUB_REPO_NAME:               !!import.meta.env.GITHUB_REPO_NAME,
      PUBLIC_SITE_URL:                !!import.meta.env.PUBLIC_SITE_URL,
    },
    // Partial values for verification (not full secrets)
    clientIdPrefix:     (import.meta.env.KEYSTATIC_GITHUB_CLIENT_ID ?? '').slice(0, 8),
    clientSecretLength: clientSecret.length,
    // GitHub OAuth client secrets are always 40 chars (classic)
    clientSecretLast4:  clientSecret.slice(-4),
    ksSecretLength:     ksSecret.length,
    repoOwner:          import.meta.env.GITHUB_REPO_OWNER ?? '(not set)',
    repoName:           import.meta.env.GITHUB_REPO_NAME ?? '(not set)',
  };

  return new Response(JSON.stringify(info, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};
