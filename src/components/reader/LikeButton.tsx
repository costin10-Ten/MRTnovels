import { useState, useEffect } from 'preact/hooks';

interface Props {
  storySlug: string;
  initialLiked: boolean;
  initialCount: number;
}

// Custom event name for syncing multiple like button instances on the same page
const LIKE_SYNC_EVENT = 'like-sync';

export default function LikeButton({ storySlug, initialLiked, initialCount }: Props) {
  const [liked, setLiked]     = useState(initialLiked);
  const [count, setCount]     = useState(initialCount);
  const [loading, setLoading] = useState(false);

  // Sync with the other LikeButton instance on the same page
  useEffect(() => {
    function onSync(e: Event) {
      const detail = (e as CustomEvent<{ slug: string; liked: boolean; count: number }>).detail;
      if (detail.slug === storySlug) {
        setLiked(detail.liked);
        setCount(detail.count);
      }
    }
    window.addEventListener(LIKE_SYNC_EVENT, onSync);
    return () => window.removeEventListener(LIKE_SYNC_EVENT, onSync);
  }, [storySlug]);

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
        const newLiked = data.liked as boolean;
        const newCount = newLiked ? count + 1 : count - 1;
        setLiked(newLiked);
        setCount(newCount);
        // Broadcast to the other button instance
        window.dispatchEvent(
          new CustomEvent(LIKE_SYNC_EVENT, {
            detail: { slug: storySlug, liked: newLiked, count: newCount },
          })
        );
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
      <span style="font-size: 1.1em; line-height: 1;">♥</span>
      <span>{liked ? '已按讚' : '按讚'}</span>
      {count > 0 && (
        <span style="opacity: 0.7; font-size: 0.875em;">
          {count.toLocaleString('zh-TW')}
        </span>
      )}
    </button>
  );
}
