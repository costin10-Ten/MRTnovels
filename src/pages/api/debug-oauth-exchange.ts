import type { APIRoute } from 'astro';

// Temporary debug endpoint — tests if GitHub accepts our client credentials
// DELETE after diagnosing Keystatic OAuth
export const GET: APIRoute = async () => {
  const clientId     = import.meta.env.KEYSTATIC_GITHUB_CLIENT_ID ?? '';
  const clientSecret = import.meta.env.KEYSTATIC_GITHUB_CLIENT_SECRET ?? '';

  // Send a token exchange with a dummy code.
  // If credentials are WRONG → GitHub returns "incorrect_client_credentials"
  // If credentials are RIGHT but code is bad → GitHub returns "bad_verification_code"
  // This tells us whether the client_id/secret pair is valid.
  let githubResponse: unknown = null;
  let fetchError: string | null = null;

  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id:     clientId,
        client_secret: clientSecret,
        code:          'debug_test_code_not_real',
        redirect_uri:  'https://mrt-novels.vercel.app/api/keystatic/github/oauth/callback',
      }),
    });
    githubResponse = await res.json();
  } catch (e) {
    fetchError = String(e);
  }

  return new Response(JSON.stringify({
    clientIdPrefix:     clientId.slice(0, 8),
    clientSecretLength: clientSecret.length,
    clientSecretLast4:  clientSecret.slice(-4),
    githubResponse,
    fetchError,
    // Interpretation:
    // "incorrect_client_credentials" → secret in Vercel doesn't match GitHub OAuth App
    // "bad_verification_code"        → credentials OK, just the test code was bad (expected)
  }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};
