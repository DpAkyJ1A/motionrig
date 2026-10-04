import { h } from '../dom';
import type { Make } from './index';

export const text: Make = (c, write) => {
  const el = h('input', { class: 'text', type: 'text', spellcheck: 'false', autocomplete: 'off', 'aria-label': c.label, onchange: () => write(el.value) });
  return {
    wide: el,
    set(v) {
      el.value = String(v);
    },
  };
};
