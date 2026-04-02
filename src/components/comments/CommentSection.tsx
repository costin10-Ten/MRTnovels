import { useState } from 'preact/hooks';

interface Comment {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
}

interface Props {
  storySlug: string;
  initialComments: Comment[];
  isLoggedIn: boolean;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '剛剛';
  if (m < 60) return `${m} 分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小時前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return new Date(dateStr).toLocaleDateString('zh-TW');
}

export default function CommentSection({ storySlug, initialComments, isLoggedIn }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);

  async function submit(e: Event) {
    e.preventDefault();
    if (!body.trim() || posting) return;
    setPosting(true);
    setError('');

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storySlug, body: body.trim() }),
    });

    setPosting(false);

    if (res.status === 401) { window.location.href = '/sign-in'; return; }
    if (res.status === 429) { setError('留言太頻繁，請稍後再試。'); return; }
    if (!res.ok) { setError('留言失敗，請稍後再試。'); return; }

    const newComment = await res.json();
    setComments(c => [...c, newComment]);
    setBody('');
  }

  return (
    <section class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
      <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-6">留言</h3>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p class="text-sm text-gray-400 dark:text-gray-500 mb-8">還沒有留言，來第一個吧。</p>
      ) : (
        <ul class="flex flex-col gap-5 mb-8">
          {comments.map(c => (
            <li key={c.id} class="flex gap-3">
              <div class="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 shrink-0 mt-0.5">
                {c.user_id.slice(5, 7).toUpperCase()}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs text-gray-500 dark:text-gray-400">讀者</span>
                  <span class="text-xs text-gray-300 dark:text-gray-600">{timeAgo(c.created_at)}</span>
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Comment form */}
      {isLoggedIn ? (
        <form onSubmit={submit} class="flex flex-col gap-3">
          <textarea
            value={body}
            onInput={(e) => setBody((e.target as HTMLTextAreaElement).value)}
            placeholder="寫下你的想法..."
            maxLength={1000}
            rows={3}
            class="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-gray-100 px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 placeholder-gray-300 dark:placeholder-gray-600"
          />
          {error && <p class="text-xs text-red-500">{error}</p>}
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-300 dark:text-gray-600">{body.length} / 1000</span>
            <button
              type="submit"
              disabled={posting || !body.trim()}
              class="px-5 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm disabled:opacity-40 hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
            >
              {posting ? '送出中…' : '送出'}
            </button>
          </div>
        </form>
      ) : (
        <p class="text-sm text-gray-400 dark:text-gray-500">
          <a href="/sign-in" class="underline text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">登入</a>
          {' '}後才能留言。
        </p>
      )}
    </section>
  );
}
