import { h } from '../dom';
import type { Make } from './index';

export const toggle: Make = (c, write) => {
  let on = false;
  const sw = h('button', { class: 'switch', type: 'button', role: 'switch', 'aria-label': c.label, onclick: () => write(!on) },
    h('span', { class: 'knob' }));
  return {
    head: sw,
    set(v) {
      on = v === true;
      sw.setAttribute('aria-checked', String(on));
    },
  };
};
