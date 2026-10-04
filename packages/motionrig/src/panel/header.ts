import { h, icon, ringMark } from './dom';
import { t } from './i18n';

export function header(o: { query: string; search(q: string): void; share(): void; collapse(): void; paste(text: string): boolean }): HTMLElement {
  const input = h('input', {
    type: 'search', placeholder: t('search'), 'aria-label': t('search'), spellcheck: 'false', autocomplete: 'off',
    oninput: () => o.search(input.value),
    // A share link or raw payload pasted here is imported instead of searched for.
    onpaste: (e: ClipboardEvent) => {
      if (o.paste(e.clipboardData?.getData('text') ?? '')) e.preventDefault();
    },
  });
  input.value = o.query;
  return h('header', { class: 'head' },
    h('span', { class: 'brand' }, ringMark(18), h('span', { class: 'word' }, 'motionrig')),
    h('label', { class: 'search' }, icon('search'), input),
    // Icon-only, so the search gets the width; the name and tooltip say what it shares.
    h('button', { class: 'btn icon-btn', type: 'button', 'data-act': 'share', 'aria-label': t('share'), title: t('share'), onclick: o.share }, icon('link')),
    h('button', { class: 'btn icon-btn', type: 'button', 'data-act': 'collapse', 'aria-label': t('collapse'), title: t('collapse'), onclick: o.collapse }, icon('collapse')));
}
