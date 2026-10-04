'use client';

import { useEffect, useRef, useState } from 'react';

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Plain-HTTP LAN addresses have no Clipboard API; the textarea route still works there.
    // Selecting it takes the focus, which goes back to the button afterwards.
    const back = document.activeElement;
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    if (back instanceof HTMLElement) back.focus({ preventScroll: true });
    return ok;
  }
}

export function CopyButton({ text, className, label = 'Copy', name }: { text: string; className?: string; label?: string; name?: string }) {
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onClick = async () => {
    setState((await copy(text)) ? 'done' : 'failed');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 1800);
  };

  return (
    <button type="button" className={className} onClick={onClick} data-state={state} aria-label={name}>
      <span aria-live="polite">{state === 'done' ? 'Copied' : state === 'failed' ? 'Select and copy' : label}</span>
    </button>
  );
}
