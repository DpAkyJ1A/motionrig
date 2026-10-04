import { controlsOf } from '../core/infer';
import { getEntry, overridesOf } from '../core/registry';
import { setUi, ui } from './ui';
import type { Entry } from '../core/types';
import { attr, h, hide, text } from './dom';
import { t } from './i18n';

export interface Tabs {
  el: HTMLElement;
  /** Renders chips in `order` (computed by the panel once per open). */
  show(order: string[]): void;
  /** Title, changed dot, "new" badge and search visibility of one chip. */
  mark(id: string): void;
  active(id?: string): void;
  filter(query: string): void;
  /** Stops measuring (panel disconnected). */
  stop(): void;
}

interface Chip {
  el: HTMLButtonElement;
  title: HTMLElement;
  dot: HTMLElement;
  /** Screen-reader twin of the dot, after the title so the chip reads "Hero, has changes". */
  sr: HTMLElement;
  badge: HTMLElement;
  match: boolean;
}

/** Collapsed strip height, in rows. */
const ROWS = 2;
const GAP = 6;

/**
 * `config.order` first, in its order, then registration order; unseen ("new") tabs
 * lead within that (§10.3). The sort is stable, so ties keep registration order.
 */
export function tabOrder(ids: string[], seen: readonly string[], preferred: readonly string[] = []): string[] {
  const rank = (id: string): number => {
    const i = preferred.indexOf(id);
    return i < 0 ? preferred.length : i;
  };
  const ranked = [...ids].sort((a, b) => rank(a) - rank(b));
  return [...ranked.filter((id) => !seen.includes(id)), ...ranked.filter((id) => seen.includes(id))];
}

/** Rows that boxes of `widths` take when wrapped (flex-wrap, `gap`) into `avail` px. */
export function rowsOf(widths: number[], avail: number, gap = GAP): number {
  let rows = 0;
  let line = Infinity;
  for (const w of widths) {
    if (line + gap + w > avail) {
      rows++;
      line = w;
    } else line += gap + w;
  }
  return rows;
}

/**
 * Which of `ids` stay visible in two rows with the "+N" chip (`more` px) last: every pinned id,
 * then the others in order while they fit. Order is kept; only what doesn't fit is left out.
 */
export function collapse(ids: string[], width: (id: string) => number, pinned: (id: string) => boolean, avail: number, more: number, tail: number[] = []): Set<string> {
  if (rowsOf([...ids.map(width), ...tail], avail) <= ROWS) return new Set(ids);
  const keep = new Set(ids.filter(pinned));
  for (const id of ids) {
    if (keep.has(id)) continue;
    keep.add(id);
    const shown = ids.filter((i) => keep.has(i)).map(width);
    if (rowsOf([...shown, more, ...tail], avail) > ROWS) {
      keep.delete(id);
      break;
    }
  }
  return keep;
}

/** Search covers the title, id, note and every control key, path and label. */
function matches(e: Entry, q: string): boolean {
  if (!q) return true;
  const words = [e.id, e.meta.title, e.meta.note];
  for (const g of controlsOf(e)) for (const c of g.controls) words.push(c.path, c.label);
  return words.some((w) => w?.toLowerCase().includes(q));
}

export function tabs(pick: (id: string) => void): Tabs {
  const chips = new Map<string, Chip>();
  const none = h('p', { class: 'tabs-none', hidden: true }, t('noMatch'));
  const toggle = h('button', {
    class: 'more-tabs', type: 'button', 'data-act': 'tabs-more', hidden: true,
    onclick: () => {
      setUi({ allTabs: !ui().allTabs });
      fit();
    },
  });
  // Clears every "new" badge at once; only there while some tab is unseen.
  const seenAll = h('button', {
    class: 'seen-all', type: 'button', 'data-act': 'seen-all', hidden: true,
    onclick: () => {
      setUi({ seen: [...new Set([...(ui().seen ?? []), ...order])] });
      order.forEach(mark);
      fit();
    },
  });
  const el = h('div', { class: 'tabs', role: 'group', 'aria-label': t('tabs') });
  let order: string[] = [];
  let query = '';
  let current: string | undefined;
  // Sizes come from the ResizeObserver only (after layout, so no forced reflow); never read on input.
  const widths = new WeakMap<Element, number>();
  let avail = 0;
  const sizes = new ResizeObserver((list) => {
    for (const { target, borderBoxSize, contentBoxSize } of list) {
      // A chip hidden by the collapse reports 0: keep the width it had.
      if (target === el) avail = contentBoxSize[0]!.inlineSize;
      else if (borderBoxSize[0]!.inlineSize) widths.set(target, borderBoxSize[0]!.inlineSize);
    }
    fit();
  });
  sizes.observe(el);
  sizes.observe(toggle);
  sizes.observe(seenAll);

  const chip = (id: string): Chip => {
    let c = chips.get(id);
    if (!c) {
      const title = h('span', { class: 'title' });
      const dot = h('span', { class: 'dot', hidden: true, 'aria-hidden': 'true' });
      const sr = h('span', { class: 'sr', hidden: true }, `, ${t('changed')}`);
      const badge = h('span', { class: 'new' }, t('new'));
      c = { el: h('button', { class: 'chip', type: 'button', 'data-id': id, 'aria-pressed': 'false', onclick: () => pick(id) }, dot, title, sr), title, dot, sr, badge, match: true };
      chips.set(id, c);
      sizes.observe(c.el);
    }
    return c;
  };

  /** Returns whether the chip's visibility inputs (search match, changed dot) changed. */
  const mark = (id: string): boolean => {
    const e = getEntry(id);
    const c = chips.get(id);
    if (!e || !c) return false;
    // Runs on every value change: each write only when it differs (§10.7).
    text(c.title, e.meta.title || id);
    const same = !Object.keys(overridesOf(id)).length;
    const flipped = c.dot.hidden !== same;
    hide(c.dot, same);
    hide(c.sr, same);
    if ((ui().seen ?? []).includes(id)) c.badge.remove();
    else if (c.badge.parentNode !== c.el) c.el.append(c.badge);
    const match = matches(e, query);
    const changed = flipped || match !== c.match;
    c.match = match;
    return changed;
  };

  /** Pure layout from cached sizes: which chips show, and the "+N" / "Less" toggle (§10.3). */
  function fit(): void {
    const found = order.filter((id) => chips.get(id)?.match);
    const all = !!ui().allTabs;
    const seen = ui().seen ?? [];
    const fresh = order.filter((id) => !seen.includes(id)).length;
    hide(seenAll, !fresh);
    if (fresh) {
      text(seenAll, t('seenAll').replace('{n}', String(fresh)));
      const name = t('seenAllName').replace('{n}', String(fresh));
      attr(seenAll, 'aria-label', name);
      attr(seenAll, 'title', name);
    }
    const tail = fresh ? [widths.get(seenAll) ?? 60] : [];
    const width = (id: string): number => widths.get(chips.get(id)!.el) ?? 0;
    // The current tab and changed ones always show; unmeasured chips (just added) until the observer has their width.
    const pinned = (id: string): boolean => {
      const c = chips.get(id)!;
      return id === current || !c.dot.hidden || !widths.has(c.el);
    };
    // The toggle was measured with its last label, which may be a digit shorter than the next "+N".
    const keep = query || !avail || all ? new Set(found) : collapse(found, width, pinned, avail, (widths.get(toggle) ?? 40) + 8, tail);
    for (const id of order) {
      const c = chips.get(id);
      if (c) hide(c.el, !keep.has(id));
    }
    const left = found.length - keep.size;
    // Showing every tab, "Less" is there while they take more than the collapsed rows.
    const show = !query && !!avail && (all ? rowsOf([...found.map(width), ...tail], avail) > ROWS : left > 0);
    hide(toggle, !show);
    if (show) {
      text(toggle, all ? t('less') : `+${left}`);
      attr(toggle, 'aria-label', all ? t('less') : t('moreTabs').replace('{n}', String(left)));
      attr(toggle, 'aria-expanded', String(all));
    }
    if (el.classList.contains('all') !== (all && show)) el.classList.toggle('all');
    hide(none, !order.length || found.length > 0);
  }

  return {
    el,
    show(ids) {
      order = ids;
      el.replaceChildren(...ids.map((id) => chip(id).el), toggle, seenAll, none);
      ids.forEach(mark);
      fit();
    },
    mark(id) {
      if (mark(id)) fit();
    },
    active(id) {
      current = id;
      for (const [k, c] of chips) attr(c.el, 'aria-pressed', String(k === id));
      fit();
    },
    filter(q) {
      query = q.trim().toLowerCase();
      order.forEach(mark);
      fit();
    },
    stop: () => sizes.disconnect(),
  };
}
