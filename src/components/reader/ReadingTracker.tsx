import { useEffect, useRef } from 'preact/hooks';

interface Props {
  storySlug: string;
  isLoggedIn: boolean;
}

const READ_THRESHOLD = 70; // % to count as "read"

export default function ReadingTracker({ storySlug, isLoggedIn }: Props) {
  const savedRef = useRef(0);
  const markedReadRef = useRef(false);

  useEffect(() => {
    const bar = document.getElementById('read-progress') as HTMLElement | null;

    function saveProgress(pct: number) {
      if (!isLoggedIn) return;
      // Use Blob so Content-Type is application/json (sendBeacon default is text/plain)
      navigator.sendBeacon(
        '/api/progress',
        new Blob([JSON.stringify({ storySlug, pct })], { type: 'application/json' }),
      );
    }

    function update() {
      const el = document.getElementById('story-content');
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;

      let pct: number;
      if (total <= 0) {
        // Story shorter than viewport — counts as fully read once it's visible
        pct = 100;
      } else {
        const scrolled = Math.max(0, -rect.top);
        pct = Math.min(100, Math.round((scrolled / total) * 100));
      }

      if (bar) bar.style.width = `${pct}%`;

      // Save every 5% change
      if (isLoggedIn && Math.abs(pct - savedRef.current) >= 5) {
        savedRef.current = pct;
        saveProgress(pct);
      }

      // Ensure we save exactly at the threshold crossing
      if (isLoggedIn && !markedReadRef.current && pct >= READ_THRESHOLD) {
        markedReadRef.current = true;
        saveProgress(pct);
      }
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, [storySlug, isLoggedIn]);

  return <div id="read-progress" aria-hidden="true" />;
}
