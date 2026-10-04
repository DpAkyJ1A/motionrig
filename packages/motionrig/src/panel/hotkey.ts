const MODS = { alt: 'altKey', option: 'altKey', ctrl: 'ctrlKey', control: 'ctrlKey', shift: 'shiftKey', meta: 'metaKey', cmd: 'metaKey' } as const;

/** Matched on `event.code`, so layouts and Option-produced characters (alt+r = ®) don't matter. */
export function matches(e: KeyboardEvent, hotkey: string): boolean {
  // Autofill fires keydown as a plain Event (no code); holding the keys must not flicker the panel.
  if (typeof e.code !== 'string' || e.repeat) return false;
  const parts = hotkey.toLowerCase().split('+').map((p) => p.trim());
  const key = parts.pop() ?? '';
  // A misspelt modifier must not leave a bare key bound.
  if (parts.some((p) => !(p in MODS))) return false;
  const code = /^[a-z]$/.test(key) ? `key${key}` : /^\d$/.test(key) ? `digit${key}` : key;
  if (e.code.toLowerCase() !== code) return false;
  const wanted = new Set(parts.map((p) => MODS[p as keyof typeof MODS]));
  return (['altKey', 'ctrlKey', 'shiftKey', 'metaKey'] as const).every((m) => e[m] === wanted.has(m));
}

const TYPING = /^(text|search|number|email|url|tel|password)$/;

/** Typing into a field (on the page or in the panel) never toggles the panel; sliders, pickers and selects don't count. */
export function editable(e: Event): boolean {
  const el = e.composedPath()[0];
  return el instanceof HTMLElement &&
    (el.isContentEditable || el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && TYPING.test(el.type)));
}
