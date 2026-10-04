import { quantize } from '../../core/infer';
import { clamp, h } from '../dom';
import { t } from '../i18n';
import type { Make } from './index';

export const number: Make = (c, write, def) => {
  const min = c.min ?? 0;
  const max = c.max ?? 1;
  const step = c.step ?? 0.01;
  const q = (n: number): number => quantize(n, step);
  const at = (n: number): string => String(clamp((n - min) / (max - min || 1), 0, 1));
  let cur = 0;

  const slider = h('input', {
    type: 'range', min, max, step, 'aria-label': c.label,
    oninput: () => write(q(Number(slider.value))),
  });
  // --d marks the code default on the track, --p the fill up to the current value.
  const slide = h('div', { class: 'slide' }, slider);
  slide.style.setProperty('--d', at(Number(def)));

  const num = h('input', {
    // No inputmode="decimal": the iOS decimal pad has no minus sign, and values past the range may be negative.
    class: 'num', type: 'text', enterkeyhint: 'done', spellcheck: 'false', autocomplete: 'off',
    'aria-label': `${c.label} ${t('value')}`,
    // Not clamped to the slider: a designer may need a value past the range.
    onchange: () => {
      const n = Number(num.value.trim().replace(',', '.'));
      write(num.value.trim() && Number.isFinite(n) ? q(n) : cur);
    },
    onkeydown: (e: KeyboardEvent) => {
      const dir = e.key === 'ArrowUp' ? 1 : e.key === 'ArrowDown' ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      write(q(cur + dir * step * (e.shiftKey ? 10 : 1)));
    },
  });

  return {
    head: h('span', { class: 'numbox' }, num, c.unit && h('span', { class: 'unit' }, c.unit)),
    wide: slide,
    set(v) {
      cur = Number(v);
      slider.value = String(cur);
      slide.style.setProperty('--p', at(cur));
      num.value = String(q(cur));
    },
  };
};
