import { h } from './dom';

/** One polite live region; a new message replaces the current one. */
export function toaster(): { el: HTMLElement; say(text: string): void } {
  const el = h('div', { class: 'toast', role: 'status' });
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    el,
    say(text) {
      el.textContent = text;
      el.classList.add('show');
      clearTimeout(timer);
      // Long enough to read: a longer message stays longer.
      timer = setTimeout(() => el.classList.remove('show'), Math.min(Math.max(1800, text.length * 50), 7000));
    },
  };
}
