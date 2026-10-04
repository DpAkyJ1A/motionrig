import { h } from './dom';
import { t } from './i18n';

/**
 * Clipboard API, then the legacy `execCommand('copy')`, then a dialog with the text
 * selected: designers test on phones over plain-HTTP LAN addresses where both can fail.
 * Resolves whether the text reached the clipboard.
 */
export async function copy(text: string, layer: HTMLElement): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {}
  const root = layer.getRootNode() as Document | ShadowRoot;
  const back = root.activeElement as HTMLElement | null;
  const area = h('textarea', { class: 'offscreen', readonly: true, 'aria-hidden': 'true', tabindex: -1 });
  area.value = text;
  layer.append(area);
  select(area);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {}
  area.remove();
  // Safari doesn't focus a clicked button: with nothing to give focus back to, keep it in the panel.
  (back ?? layer).focus();
  if (!ok) manual(text, layer, root, back);
  return ok;
}

/** `select()` alone leaves iOS with an empty selection. */
function select(area: HTMLTextAreaElement): void {
  area.focus({ preventScroll: true });
  area.select();
  area.setSelectionRange(0, area.value.length);
}

function manual(text: string, layer: HTMLElement, root: Document | ShadowRoot, back: HTMLElement | null): void {
  const area = h('textarea', { class: 'manual-text', readonly: true, 'aria-label': t('manual') });
  area.value = text;
  const close = (): void => {
    box.remove();
    (back ?? layer).focus();
  };
  const done = h('button', { class: 'btn', type: 'button', 'data-act': 'close', onclick: close }, t('close'));
  const box = h('div', {
    class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('manual'),
    onkeydown: (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      } else if (e.key === 'Tab') {
        // aria-modal: focus stays on its two controls either way round.
        e.preventDefault();
        (root.activeElement === area ? done : area).focus();
      }
    },
  }, h('div', { class: 'modal-card' }, h('p', { class: 'modal-title' }, t('manual')), area, done));
  layer.append(box);
  select(area);
}
