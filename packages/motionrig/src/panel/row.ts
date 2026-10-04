import { defaults, resetValue, setValue } from '../core/registry';
import { getPath } from '../core/path';
import type { Control, Entry, Leaf } from '../core/types';
import { controls } from './controls/index';
import { h, icon } from './dom';
import { t } from './i18n';

export interface Row {
  el: HTMLElement;
  /** Re-reads the live value; touches the DOM only when something differs (or `force`). */
  sync(force?: boolean): void;
}

export function row(e: Entry, c: Control): Row {
  const def = getPath(defaults(e), c.path) as Leaf;
  const read = (): Leaf => getPath(e.values, c.path) as Leaf;
  let last: Leaf | undefined;
  let changed = false;

  const reset = (): void => {
    resetValue(e.id, c.path);
    sync(true);
  };
  const view = controls[c.type](c, (v) => {
    setValue(e.id, c.path, v);
    sync(true);
  }, def);
  const undo = h('button', { class: 'reset', type: 'button', hidden: true, 'aria-label': `${t('reset')}: ${c.label}`, title: t('reset'), onclick: reset }, icon('reset'));
  const el = h('div', { class: 'row', 'data-path': c.path, 'data-type': c.type },
    h('div', { class: 'lab' },
      h('span', { class: 'label', title: c.path, ondblclick: reset },
        c.label !== c.key && h('span', { class: 'name' }, c.label),
        h('span', { class: 'key' }, c.key)),
      undo),
    view.head && h('div', { class: 'val' }, view.head),
    view.wide && h('div', { class: 'wide' }, view.wide),
    c.hint && h('p', { class: 'hint' }, c.hint));

  function sync(force = false): void {
    const v = read();
    if (force || v !== last) {
      last = v;
      view.set(v);
    }
    if ((v !== def) !== changed) {
      changed = !changed;
      el.classList.toggle('changed', changed);
      undo.hidden = !changed;
    }
  }
  sync(true);
  return { el, sync };
}
