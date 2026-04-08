import { useEffect, useRef } from 'preact/hooks';

interface Props {
  storySlug: string;
  isLoggedIn: boolean;
}

const READ_THRESHOLD = 70;
// Save only at these key milestones — max 4 API calls per story per session
const SAVE_MILESTONES = [25, 50, READ_THRESHOLD, 100];

export default function ReadingTracker({ storySlug, isLoggedIn }: Props) {
  const latestPctRef = useRef(0);
  const savedPctRef = useRef(-1);
  const milestonesSaved = useRef(new Set<number>());

  useEffect(() => {
    const bar = document.getElementById('read-progress') as HTMLElement | null;

    function calcPct(): number {
      const el = document.getElementById('story-content');
      if (!el) return latestPctRef.current;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return 100;
      const scrolled = Math.max(0, -rect.top);
      return Math.min(100, Math.round((scrolled / total) * 100));
    }

    function sendSave(pct: number) {
      if (!isLoggedIn || pct === savedPctRef.current) return;
      savedPctRef.current = pct;
      navigator.sendBeacon(
        '/api/progress',
        new Blob([JSON.stringify({ storySlug, pct })], { type: 'application/json' }),
      );
    }

    // RAF throttle: runs at most once per animation frame, not per scroll event
    let rafId: number | null = null;

    function onScroll() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const pct = calcPct();
        latestPctRef.current = pct;
        if (bar) bar.style.width = `${pct}%`;

        if (!isLoggedIn) return;
        // Check each milestone in order; save once per crossing
        for (const m of SAVE_MILESTONES) {
          if (pct >= m && !milestonesSaved.current.has(m)) {
            milestonesSaved.current.add(m);
            sendSave(pct);
            break; // one save per scroll burst is enough
          }
        }
      });
    }

    // Save final position when user leaves or hides the tab — catches mid-scroll exits
    function saveOnExit() {
      sendSave(latestPctRef.current);
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') saveOnExit();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', saveOnExit);
    document.addEventListener('visibilitychange', onVisibilityChange);
    onScroll(); // initialise bar on mount

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', saveOnExit);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [storySlug, isLoggedIn]);

  return <div id="read-progress" aria-hidden="true" />;
}
