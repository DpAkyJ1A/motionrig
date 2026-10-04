import { h } from '../dom';
import type { Make } from './index';

export const select: Make = (c, write) => {
  const opts = c.options ?? [];
  // Option values can be numbers: the DOM carries indexes and the typed value is looked up.
  const el = h('select', { 'aria-label': c.label, onchange: () => { const o = opts[Number(el.value)]; if (o) write(o.value); } },
    ...opts.map((o, i) => h('option', { value: i }, o.label)));
  const other = h('option', { value: -1, disabled: true });
  return {
    head: el,
    set(v) {
      const i = opts.findIndex((o) => o.value === v);
      if (i < 0) {
        other.textContent = String(v);
        el.prepend(other);
      } else other.remove();
      el.value = String(i);
    },
  };
};
