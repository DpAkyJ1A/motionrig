import { attr, h, icon } from './dom';
import { t } from './i18n';

export interface Footer {
  el: HTMLElement;
  /** Shows the tab's own actions, naming the tab's rig (`undefined`: the empty state, actions hidden). */
  tab(name?: string): void;
}

/** Copy code · Reset tab · Reset all (armed by the first click, confirmed by a second within 3 s). */
export function footer(o: { copy(): void; resetTab(): void; resetAll(): void }): Footer {
  let armed: ReturnType<typeof setTimeout> | undefined;
  const disarm = (): void => {
    clearTimeout(armed);
    armed = undefined;
    all.textContent = t('resetAll');
    all.classList.remove('armed');
  };
  const all = h('button', {
    class: 'btn ghost', type: 'button', 'data-act': 'reset-all',
    onclick: () => {
      if (armed) {
        disarm();
        o.resetAll();
        return;
      }
      armed = setTimeout(disarm, 3000);
      all.textContent = t('confirm');
      all.classList.add('armed');
    },
  }, t('resetAll'));
  const copy = h('button', { class: 'btn primary', type: 'button', 'data-act': 'copy', onclick: o.copy }, icon('copy'), t('copyCode'));
  const tab = h('button', { class: 'btn ghost', type: 'button', 'data-act': 'reset-tab', onclick: o.resetTab }, t('resetTab'));
  return {
    el: h('footer', { class: 'foot' }, copy, tab, all),
    tab(name) {
      copy.hidden = tab.hidden = name === undefined;
      if (name === undefined) return;
      // The visible label stays short; its accessible name and tooltip say which rig it copies.
      attr(copy, 'title', `${t('copyCode')} · ${name}`);
      attr(copy, 'aria-label', `${t('copyCode')} · ${name}`);
    },
  };
}
