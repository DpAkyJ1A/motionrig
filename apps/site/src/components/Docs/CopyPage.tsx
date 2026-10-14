'use client';

import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { copy } from '@/components/Code/CopyButton';
import s from './CopyPage.module.css';

type Props = {
  /** The page as Markdown, copied as it is. */
  markdown: string;
  /** The page's .md twin: site-relative for View, absolute for the AI links. */
  mdHref: string;
  mdUrl: string;
};

const Icon = {
  copy: (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.6" />
      <path d="M10.5 3.5v-.4A1.6 1.6 0 0 0 8.9 1.5H4.1a1.6 1.6 0 0 0-1.6 1.6v4.8a1.6 1.6 0 0 0 1.6 1.6h.4" />
    </svg>
  ),
  done: (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="m3 8.5 3.2 3L13 4.5" />
    </svg>
  ),
  markdown: (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1" y="3.5" width="14" height="9" rx="1.6" />
      <path d="M3.8 10.2V5.8l1.8 2.2 1.8-2.2v4.4M10.8 5.8v4.4m-1.6-1.6 1.6 1.6 1.6-1.6" />
    </svg>
  ),
  ask: (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 7.6c0-2.9 2.5-5.1 5.5-5.1s5.5 2.2 5.5 5.1-2.5 5.1-5.5 5.1c-.7 0-1.4-.1-2-.3L3 13.5l.8-2.6a4.8 4.8 0 0 1-1.3-3.3Z" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="m4 6 4 4 4-4" />
    </svg>
  ),
  out: (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={s.out}>
      <path d="M6 3.5h6.5V10M12.5 3.5 4 12" />
    </svg>
  ),
};

/** What to ask an assistant: read the page first, then answer about it. */
const prompt = (url: string) => `Read ${url} — it is a page of the motionrig docs. I'll ask you questions about it.`;

/**
 * "Copy page" for AI assistants: the button copies the page as Markdown; its menu also
 * opens the Markdown or hands the page to ChatGPT or Claude.
 */
export function CopyPage({ markdown, mdHref, mdUrl }: Props) {
  const id = useId();
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle');
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  // A click anywhere else closes the menu.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  const items = () => [...(root.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];

  const onCopy = async () => {
    setOpen(false);
    setState((await copy(markdown)) ? 'done' : 'failed');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 2000);
  };

  const openMenu = (focus: 'first' | 'last' | false) => {
    setOpen(true);
    if (focus) requestAnimationFrame(() => items().at(focus === 'first' ? 0 : -1)?.focus());
  };

  const close = () => {
    setOpen(false);
    toggle.current?.focus();
  };

  const onToggleKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      openMenu(e.key === 'ArrowDown' ? 'first' : 'last');
    }
  };

  const onMenuKey = (e: KeyboardEvent) => {
    const list = items();
    const at = list.indexOf(document.activeElement as HTMLElement);
    const move = { ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (move) {
      e.preventDefault();
      list[(at + move + list.length) % list.length]?.focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      list.at(e.key === 'Home' ? 0 : -1)?.focus();
    } else if (e.key === 'Tab') setOpen(false);
  };

  // Escape closes from anywhere inside: an item, or the toggle after a mouse click.
  const onRootKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      close();
    }
  };

  // ChatGPT takes `prompt`, which only fills the box: `q` sends it at once, and a signed-out
  // visitor gets "An error occurred during verification" instead of an answer.
  const ask = (base: string) => `${base}${encodeURIComponent(prompt(mdUrl))}`;

  return (
    <div className={s.root} ref={root} onKeyDown={onRootKey}>
      <div className={s.split}>
        <button type="button" className={s.main} onClick={onCopy} data-state={state}>
          {state === 'done' ? Icon.done : Icon.copy}
          <span aria-live="polite">{state === 'done' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy page'}</span>
        </button>
        <button
          ref={toggle}
          type="button"
          className={s.toggle}
          aria-label="More ways to use this page"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={`${id}-menu`}
          // A keyboard press (no pointer, so detail 0) lands on the first item.
          onClick={(e) => (open ? setOpen(false) : openMenu(e.detail === 0 ? 'first' : false))}
          onKeyDown={onToggleKey}
        >
          {Icon.chevron}
        </button>
      </div>
      <div id={`${id}-menu`} className={s.menu} role="menu" aria-label="Page actions" hidden={!open} onKeyDown={onMenuKey}>
        <button type="button" role="menuitem" tabIndex={-1} className={s.item} onClick={onCopy}>
          {Icon.copy}
          <span>
            <b>Copy page</b>
            <small>Copy this page as Markdown for LLMs</small>
          </span>
        </button>
        <a role="menuitem" tabIndex={-1} className={s.item} href={mdHref} target="_blank" rel="noopener" onClick={() => setOpen(false)}>
          {Icon.markdown}
          <span>
            <b>View as Markdown {Icon.out}</b>
            <small>Open this page as plain text</small>
          </span>
        </a>
        <a role="menuitem" tabIndex={-1} className={s.item} href={ask('https://chatgpt.com/?hints=search&prompt=')} target="_blank" rel="noopener" onClick={() => setOpen(false)}>
          {Icon.ask}
          <span>
            <b>Open in ChatGPT {Icon.out}</b>
            <small>Ask questions about this page</small>
          </span>
        </a>
        <a role="menuitem" tabIndex={-1} className={s.item} href={ask('https://claude.ai/new?q=')} target="_blank" rel="noopener" onClick={() => setOpen(false)}>
          {Icon.ask}
          <span>
            <b>Open in Claude {Icon.out}</b>
            <small>Ask questions about this page</small>
          </span>
        </a>
      </div>
    </div>
  );
}
