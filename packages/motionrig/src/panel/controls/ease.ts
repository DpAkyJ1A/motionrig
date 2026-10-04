import { customStart, easeBezier, easeIndex, easeMenu, easeMode, formatBezier, parseBezier } from '../../core/eases';
import type { EaseChoice } from '../../core/eases';
import { h, s } from '../dom';
import { t } from '../i18n';
import { bezierEditor, curve } from './bezier';
import type { Make } from './index';

export const ease: Make = (c, write) => {
  const flavour = c.flavour ?? 'gsap';
  const { palette, builtins, curves } = easeMenu(flavour);
  // Option values index `values`; 'raw' and 'custom' are the two extra entries.
  const values: string[] = [];
  const group = (label: string, list: EaseChoice[]) =>
    list.length > 0 && h('optgroup', { label }, ...list.map((ch) => h('option', { value: values.push(ch.value) - 1 }, ch.label)));
  const raw = h('option', { value: 'raw' });
  let cur = '';
  // Kept while the designer edits a curve, even when it matches a named one (css palette values are beziers).
  let custom = false;

  const sel = h('select', {
    'aria-label': c.label,
    onchange: () => {
      if (sel.value === 'raw') return;
      custom = sel.value === 'custom';
      write(custom ? formatBezier(customStart(cur), flavour) : values[Number(sel.value)]!);
    },
  }, group(t('palette'), palette), group(t('builtins'), builtins), group(t('curves'), curves), h('option', { value: 'custom' }, t('custom')));

  const line = s('path');
  const thumb = s('svg', { class: 'thumb', viewBox: '-0.1 -1.35 1.2 1.7', preserveAspectRatio: 'none', 'aria-hidden': 'true' }, line);
  const editor = bezierEditor((b) => write(formatBezier(b, flavour)));

  return {
    head: h('span', { class: 'ease' }, thumb, sel),
    wide: editor.el,
    set(v) {
      cur = String(v);
      const bezier = parseBezier(cur);
      const mode = custom && bezier ? 'custom' : easeMode(cur, flavour);
      custom = mode === 'custom';
      if (mode === 'raw') {
        raw.textContent = cur;
        sel.prepend(raw);
      } else raw.remove();
      // By number for css, so the value keeps the designer's spelling until another pick.
      sel.value = mode === 'named' ? String(easeIndex(cur, flavour)) : mode;
      const known = easeBezier(cur);
      line.setAttribute('d', known ? curve(known) : '');
      editor.el.hidden = !custom;
      if (custom) editor.set(bezier!);
    },
  };
};
