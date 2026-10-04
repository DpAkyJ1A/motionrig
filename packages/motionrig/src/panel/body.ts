import { controlsOf } from '../core/infer';
import type { Entry, Group } from '../core/types';
import { h, icon, ringMark } from './dom';
import { t } from './i18n';
import { locate } from './locate';
import { row } from './row';
import type { Row } from './row';

export interface Body {
  el: HTMLElement;
  entry: Entry;
  /** The resolved controls it was built from; a new identity (meta replaced) means rebuild. */
  groups: Group[];
  sync(): void;
}

interface Ctx {
  /** In-memory collapsed group keys, shared across tabs for the panel's lifetime. */
  collapsed: Set<string>;
  toast(text: string): void;
  layer: HTMLElement;
}

export function empty(): HTMLElement {
  return h('div', { class: 'empty' },
    ringMark(28),
    h('p', { class: 'empty-title' }, t('empty')),
    h('p', { class: 'empty-hint' }, t('emptyHint')),
    h('pre', {}, "import { rig } from 'motionrig';\nexport const HERO = rig('hero',\n  { duration: 1.2, ease: 'expo.out' });"));
}

function note(text: string): HTMLElement {
  const p = h('p', { class: 'note' }, text);
  const more = h('button', {
    class: 'more', type: 'button', hidden: true, 'aria-expanded': 'false',
    onclick: () => {
      const full = p.classList.toggle('full');
      more.textContent = t(full ? 'less' : 'more');
      more.setAttribute('aria-expanded', String(full));
    },
  }, t('more'));
  // Only a note that overflows its 3-line clamp gets the toggle.
  requestAnimationFrame(() => (more.hidden = p.scrollHeight <= p.clientHeight + 1));
  return h('div', { class: 'note-box' }, p, more);
}

export function body(e: Entry, ctx: Ctx): Body {
  const m = e.meta;
  const applies = m.applies ?? 'live';
  const rows: Row[] = [];
  const groups = controlsOf(e);

  const acts = h('div', { class: 'tab-acts' },
    m.replay && h('button', { class: 'btn ghost', type: 'button', 'data-act': 'replay', onclick: () => m.replay!() }, icon('play'), t('replayBtn')),
    applies === 'reload' && !m.replay && h('button', { class: 'btn ghost', type: 'button', 'data-act': 'reload', onclick: () => location.reload() }, icon('reload'), t('reloadBtn')),
    m.target && h('button', {
      class: 'btn icon-btn', type: 'button', 'data-act': 'locate', 'aria-label': t('locate'), title: t('locate'),
      onclick: () => locate(m.target!, ctx.layer) || ctx.toast(t('locateNone')),
    }, icon('locate')));

  const sections = groups.map((g) => {
    const key = `${e.id}\n${g.id}`;
    const list = h('div', { class: 'group-rows', hidden: ctx.collapsed.has(key) },
      g.hint && h('p', { class: 'group-hint' }, g.hint),
      ...g.controls.map((c) => {
        const r = row(e, c);
        rows.push(r);
        return r.el;
      }));
    const head = g.label
      ? h('button', {
          class: 'group-head', type: 'button', 'aria-expanded': String(!list.hidden),
          onclick: () => {
            list.hidden = !list.hidden;
            head!.setAttribute('aria-expanded', String(!list.hidden));
            if (list.hidden) ctx.collapsed.add(key);
            else ctx.collapsed.delete(key);
          },
        }, g.label, icon('chevron'))
      : undefined;
    return h('section', { class: head ? 'group' : 'group plain' }, head, list);
  });

  const el = h('div', { class: 'tab' },
    h('div', { class: 'tab-head' },
      h('div', { class: 'tab-title' },
        h('h2', {}, m.title || e.id),
        !!m.title && m.title.toLowerCase() !== e.id.toLowerCase() && h('span', { class: 'tab-id' }, e.id),
        h('span', { class: 'applies', 'data-applies': applies }, t(applies))),
      acts),
    m.note && note(m.note),
    ...sections);

  return { el, entry: e, groups, sync: () => rows.forEach((r) => r.sync()) };
}
