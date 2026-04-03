import { useState, useEffect } from 'preact/hooks';

type Font  = 'sans' | 'serif' | 'cursive' | 'system';
type Size  = 'sm' | 'md' | 'lg';
type Theme = 'light' | 'dark' | 'system';

const FONTS:  { v: Font;  l: string }[] = [
  { v: 'serif',   l: '明' },
  { v: 'sans',    l: '黑' },
  { v: 'cursive', l: '楷' },
  { v: 'system',  l: '系' },
];
const SIZES:  { v: Size;  l: string }[] = [
  { v: 'sm', l: '小' },
  { v: 'md', l: '中' },
  { v: 'lg', l: '大' },
];
const THEMES: { v: Theme; l: string }[] = [
  { v: 'light',  l: '淺' },
  { v: 'dark',   l: '深' },
  { v: 'system', l: '系' },
];

function applyAll(font: Font, size: Size, theme: Theme, red: boolean) {
  const h = document.documentElement;
  // Font
  if (font === 'sans' || font === 'system') h.removeAttribute('data-font');
  else h.setAttribute('data-font', font);
  // Size
  if (size === 'md') h.removeAttribute('data-size');
  else h.setAttribute('data-size', size);
  // Theme
  if (theme === 'dark') {
    h.classList.add('dark');
  } else if (theme === 'light') {
    h.classList.remove('dark');
  } else {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) h.classList.add('dark');
    else h.classList.remove('dark');
  }
  // Red highlight
  if (red) h.setAttribute('data-highlight', 'red');
  else h.removeAttribute('data-highlight');
}

export default function SidebarSettings() {
  const [font,  setFont]  = useState<Font>('sans');
  const [size,  setSize]  = useState<Size>('md');
  const [theme, setTheme] = useState<Theme>('system');
  const [red,   setRed]   = useState(false);
  const [open,  setOpen]  = useState(false);

  useEffect(() => {
    const f = (localStorage.getItem('ks-font')  || 'sans')   as Font;
    const s = (localStorage.getItem('ks-size')  || 'md')     as Size;
    const t = (localStorage.getItem('ks-theme') || 'system') as Theme;
    const r = localStorage.getItem('ks-highlight-red') === 'true';
    setFont(f); setSize(s); setTheme(t); setRed(r);
  }, []);

  function save(f: Font, s: Size, t: Theme, r: boolean) {
    localStorage.setItem('ks-font',          f);
    localStorage.setItem('ks-size',          s);
    localStorage.setItem('ks-theme',         t);
    localStorage.setItem('ks-highlight-red', String(r));
    applyAll(f, s, t, r);
    setFont(f); setSize(s); setTheme(t); setRed(r);
  }

  const btnBase = 'flex-1 py-1 text-xs font-medium rounded-full transition-colors border';
  const btnOn   = 'bg-[#1a73e8] text-white border-[#1a73e8]';
  const btnOff  = 'bg-transparent text-[#5f6368] dark:text-[#9aa0a6] border-[#dadce0] dark:border-[#3c4043] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043]';

  return (
    <div class="px-3 pb-4">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        class="w-full flex items-center justify-between py-2 text-xs font-medium text-[#9aa0a6] hover:text-[#5f6368] dark:hover:text-[#bdc1c6] transition-colors"
      >
        <span class="uppercase tracking-widest">外觀設定</span>
        <span style={{ transform: open ? 'rotate(180deg)' : '', transition: 'transform 0.2s', display: 'inline-block' }}>▾</span>
      </button>

      {open && (
        <div class="flex flex-col gap-3 mt-1">
          {/* Font */}
          <div>
            <div class="text-[10px] text-[#9aa0a6] mb-1.5">字體</div>
            <div class="flex gap-1">
              {FONTS.map(({ v, l }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => save(v, size, theme, red)}
                  class={`${btnBase} ${font === v ? btnOn : btnOff}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <div class="text-[10px] text-[#9aa0a6] mb-1.5">字體大小</div>
            <div class="flex gap-1">
              {SIZES.map(({ v, l }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => save(font, v, theme, red)}
                  class={`${btnBase} ${size === v ? btnOn : btnOff}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <div class="text-[10px] text-[#9aa0a6] mb-1.5">主題</div>
            <div class="flex gap-1">
              {THEMES.map(({ v, l }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => save(font, size, v, red)}
                  class={`${btnBase} ${theme === v ? btnOn : btnOff}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Red highlight toggle */}
          <div class="flex items-center justify-between">
            <span class="text-xs text-[#5f6368] dark:text-[#9aa0a6]">重點字紅色</span>
            <button
              type="button"
              role="switch"
              aria-checked={red}
              onClick={() => save(font, size, theme, !red)}
              class={`relative w-9 h-5 rounded-full transition-colors ${red ? 'bg-[#1a73e8]' : 'bg-[#dadce0] dark:bg-[#5f6368]'}`}
            >
              <span
                class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                style={{ transform: red ? 'translateX(16px)' : 'translateX(0)' }}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
