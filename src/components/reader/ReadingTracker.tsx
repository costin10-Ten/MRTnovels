import { useEffect, useRef } from 'preact/hooks';

interface Props {
  storySlug: string;
  isLoggedIn: boolean;
}

export default function ReadingTracker({ storySlug, isLoggedIn }: Props) {
  const savedRef = useRef(0);

  useEffect(() => {
    const bar = document.getElementById('read-progress') as HTMLElement | null;

    function update() {
      const el = document.getElementById('story-content');
      if (!el || !bar) return;

      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;

      const scrolled = Math.max(0, -rect.top);
      const pct = Math.min(100, Math.round((scrolled / total) * 100));

      bar.style.width = `${pct}%`;

      // Save to server every 5% change and user is logged in
      if (isLoggedIn && Math.abs(pct - savedRef.current) >= 5) {
        savedRef.current = pct;
        navigator.sendBeacon(
          '/api/progress',
          JSON.stringify({ storySlug, pct }),
        );
      }
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, [storySlug, isLoggedIn]);

  return <div id="read-progress" aria-hidden="true" />;
}
