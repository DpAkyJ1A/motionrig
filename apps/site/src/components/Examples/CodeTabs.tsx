'use client';

import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { CopyButton } from '@/components/Code/CopyButton';
import { FileIcon } from '@/components/Code/FileIcon';
import s from './Examples.module.css';

export type FileMeta = { name: string; added: number; removed: number; isNew: boolean; code: string };

/**
 * File tabs over one code pane. Each pane is rendered on the server as a diff;
 * "Final" hides the removed lines and the gutter, so both views share one DOM.
 * Copy always copies the final file.
 */
export function CodeTabs({ id, files, panes }: { id: string; files: FileMeta[]; panes: ReactNode[] }) {
  const [active, setActive] = useState(0);
  const [view, setView] = useState<'diff' | 'final'>('diff');
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const file = files[active]!;

  // A diff opens at its first change, two lines of context above it, not at the imports.
  useEffect(() => {
    const pane = root.current?.querySelector<HTMLElement>('[role=tabpanel]:not([hidden]) pre');
    const lines = pane ? [...pane.querySelectorAll<HTMLElement>('[data-kind]')] : [];
    const at = lines.findIndex((l) => l.dataset.kind !== 'same');
    if (!pane || at < 0 || pane.scrollHeight <= pane.clientHeight) return;
    // Snapped to a line's own top, so the first visible line is never cut in half.
    pane.scrollTop = view === 'diff' && at > 2 ? lines[at - 2]!.offsetTop : 0;
  }, [active, view]);

  // Arrow keys move between tabs, as in any tablist.
  const onKey = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (active + step + files.length) % files.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <div ref={root} className={s.code} data-view={view}>
      <div className={s.codeHead}>
        <div className={s.tabs} role="tablist" aria-label="Files" onKeyDown={onKey}>
          {files.map((f, i) => (
            <button
              key={f.name}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${i}`}
              aria-selected={i === active}
              aria-controls={`${id}-pane-${i}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
            >
              <FileIcon name={f.name} />
              {f.name}
              <span className={s.stat} data-new={f.isNew || undefined}>
                {f.isNew ? 'new' : `+${f.added} −${f.removed}`}
              </span>
            </button>
          ))}
        </div>
        <div className={s.tools}>
          <div className={s.toggle} role="group" aria-label="Code view">
            <button type="button" aria-pressed={view === 'diff'} onClick={() => setView('diff')}>
              Diff
            </button>
            <button type="button" aria-pressed={view === 'final'} onClick={() => setView('final')}>
              Final
            </button>
          </div>
          <CopyButton text={file.code} className={s.copy} label="Copy file" name={`Copy file ${file.name}`} />
        </div>
      </div>
      {panes.map((pane, i) => (
        <div
          key={files[i]!.name}
          role="tabpanel"
          id={`${id}-pane-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={i !== active}
        >
          {pane}
        </div>
      ))}
    </div>
  );
}
