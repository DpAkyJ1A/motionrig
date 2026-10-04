import { getConfig } from '../core/config';
import { attr, h, hide, ringMark, text } from './dom';
import { t } from './i18n';

/** The collapsed state: the rig ring button with a badge counting changed values. */
export function ringButton(): { el: HTMLButtonElement; count(n: number): void } {
  const badge = h('span', { class: 'badge', hidden: true, 'aria-hidden': 'true' });
  const el = h('button', { class: 'ring', type: 'button' }, ringMark(22), badge);
  return {
    el,
    /** Also re-reads its strings, so a later `configure({ locale, hotkey })` shows up. */
    count(n) {
      const { hotkey } = getConfig();
      hide(badge, !n);
      text(badge, n > 99 ? '99+' : String(n));
      attr(el, 'aria-label', n ? `${t('open')} (${n})` : t('open'));
      attr(el, 'title', hotkey ? `${t('open')} (${hotkey})` : t('open'));
    },
  };
}
