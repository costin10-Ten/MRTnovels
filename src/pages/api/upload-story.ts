import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  const { userId } = (locals as any).auth();
  const adminId = process.env.ADMIN_USER_ID;

  if (!userId || !adminId || userId !== adminId) {
    return new Response(JSON.stringify({ error: '沒有上傳權限' }), { status: 403 });
  }

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: '無效的請求格式' }), { status: 400 });
  }

  const { title, author, publishDate, tags, access, summary, cover, content, iceberg, characters } = body;

  if (!title || !content) {
    return new Response(JSON.stringify({ error: '標題與本文為必填' }), { status: 400 });
  }

  // Generate slug from title
  const slug = title
    .toLowerCase()
    .replace(/[\s\u3000]+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || `story-${Date.now()}`;

  // Build frontmatter
  const lines: string[] = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `publishDate: ${publishDate || new Date().toISOString().slice(0, 10)}`,
    `author: ${JSON.stringify(author || '站長')}`,
    `tags: [${(tags || '').split(',').map((t: string) => JSON.stringify(t.trim())).filter(Boolean).join(', ')}]`,
    `access: ${access || 'public'}`,
    `summary: ${JSON.stringify(summary || '')}`,
  ];
  if (cover)      lines.push(`cover: ${JSON.stringify(cover)}`);
  if (iceberg)    lines.push(`iceberg: ${JSON.stringify(iceberg)}`);
  if (characters) lines.push(`characters: ${JSON.stringify(characters)}`);
  lines.push('---', '', content);
  const frontmatter = lines.join('\n');

  // Commit to GitHub via Contents API
  const owner = process.env.GITHUB_REPO_OWNER ?? 'costin10-ten';
  const repo  = process.env.GITHUB_REPO_NAME  ?? 'MRTnovels';
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return new Response(JSON.stringify({ error: '伺服器未設定 GITHUB_TOKEN' }), { status: 500 });
  }

  const filePath = `src/content/stories/${slug}.md`;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  // Check if file already exists (get SHA if so)
  let sha: string | undefined;
  const checkRes = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });
  if (checkRes.ok) {
    const existing = await checkRes.json();
    sha = existing.sha;
  }

  // GitHub API requires base64 content; encode as UTF-8
  const encoded = btoa(unescape(encodeURIComponent(frontmatter)));

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `新文章：${title}`,
      content: encoded,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    return new Response(JSON.stringify({ error: `GitHub API 錯誤: ${err}` }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, slug, path: filePath }), { status: 200 });
};
