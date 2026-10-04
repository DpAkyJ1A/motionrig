'use client';

import { configure, openPanel } from 'motionrig';
import { useState } from 'react';
import { Ring } from '@/components/Ring/Ring';
import '@/motion/motion';
import s from './Docs.module.css';
import './swatch.rig';

const THEMES = ['dark', 'light', 'auto'] as const;
type Theme = (typeof THEMES)[number];

// The pick outlives the component: configure() is page-wide, and a remount after a client-side
// navigation must show the theme the panel still has, not the default.
let picked: Theme = 'dark';

/** Switches the real panel's theme in place and opens it on the swatch tab, so the change is visible at once. */
export function ThemeDemo() {
  const [theme, setTheme] = useState<Theme>(picked);
  const pick = (next: Theme) => {
    picked = next;
    setTheme(next);
    configure({ theme: next });
    void openPanel('swatch');
  };

  return (
    <div className={s.themeDemo}>
      <div className={s.swatchStage} data-rig="swatch">
        <span className={s.swatch}>
          <Ring size={24} />
        </span>
      </div>
      <div className={s.themeControls}>
        <p className={s.themeLabel} id="theme-label">
          Panel theme
        </p>
        <div className={s.segmented} role="group" aria-labelledby="theme-label">
          {THEMES.map((t) => (
            <button key={t} type="button" aria-pressed={theme === t} onClick={() => pick(t)}>
              {t[0]!.toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <code className={s.themeCode}>configure(&#123; theme: &apos;{theme}&apos; &#125;)</code>
      </div>
    </div>
  );
}
