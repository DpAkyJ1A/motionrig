import { HEX } from '../../core/infer';
import { h } from '../dom';
import { t } from '../i18n';
import type { Make } from './index';

/** `<input type=color>` speaks #rrggbb only. */
function rgb(v: string): string | undefined {
  if (!HEX.test(v)) return undefined;
  const x = v.length <= 5 ? [...v.slice(1, 4)].map((ch) => ch + ch).join('') : v.slice(1, 7);
  return '#' + x.toLowerCase();
}

/** A hex value's alpha as two digits (`#f008` ⇒ `88`), or '' without one. */
const alpha = (v: string): string => (!HEX.test(v) ? '' : v.length === 9 ? v.slice(7) : v.length === 5 ? v[4]!.repeat(2) : '');

export const color: Make = (c, write, def) => {
  let cur = '';
  // The picker speaks lowercase: re-picking an uppercase default must not count as a change.
  const put = (v: string): void => write(v.toLowerCase() === String(def).toLowerCase() ? def : v);
  // A value with alpha keeps it when the picker (which has none) writes.
  const picker = h('input', { type: 'color', 'aria-label': `${t('pick')}: ${c.label}`, oninput: () => put(picker.value + alpha(cur)) });
  const swatch = h('label', { class: 'swatch' }, picker);
  const field = h('input', { class: 'text', type: 'text', spellcheck: 'false', autocomplete: 'off', 'aria-label': c.label, onchange: () => put(field.value.trim()) });
  return {
    head: h('span', { class: 'color' }, swatch, field),
    set(v) {
      cur = String(v);
      field.value = cur;
      swatch.style.setProperty('--c', cur);
      const hex = rgb(cur);
      picker.disabled = !hex;
      if (hex) picker.value = hex;
    },
  };
};
