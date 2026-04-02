import { useState } from 'preact/hooks';

interface Props {
  storySlug: string;
  initialLiked: boolean;
  initialCount: number;
}

export default function LikeButton({ storySlug, initialLiked, initialCount }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storySlug }),
      });
      if (res.status === 401) {
        window.location.href = '/sign-in';
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setCount(c => data.liked ? c + 1 : c - 1);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      class={`like-btn${liked ? ' liked' : ''}`}
      aria-label={liked ? '取消按讚' : '按讚'}
    >
      <span style="font-size: 1.2em;">♥</span>
      <span>{liked ? '已按讚' : '按讚'}</span>
      {count > 0 && <span class="opacity-60 text-sm">{count.toLocaleString('zh-TW')}</span>}
    </button>
  );
}
