import { formatBezier } from '../../core/eases';
import type { Bezier } from '../../core/types';
import { copy } from '../clipboard';
import { clamp, h, icon, s } from '../dom';
import { t } from '../i18n';

// y room for overshoot: back.inOut reaches −0.6 and 1.6.
const LO = -0.6;
const HI = 1.6;
const PAD = 0.08;
// Drawn in curve units with y flipped (svg y = -curve y), so pointer math is a plain viewBox mapping.
const VB = [-PAD, -HI - PAD, 1 + 2 * PAD, HI - LO + 2 * PAD] as const;

const fit = (b: number[]): Bezier =>
  b.map((n, i) => Number((i % 2 ? clamp(n, LO, HI) : clamp(n, 0, 1)).toFixed(3))) as Bezier;

export const curve = ([x1, y1, x2, y2]: Bezier): string => `M0 0C${x1} ${-y1} ${x2} ${-y2} 1 -1`;

const parse = (text: string): number => (text.trim() ? Number(text.trim().replace(',', '.')) : NaN);

/** All four numbers from `0.68,-0.6,.527,1.6`, spaced, `cubic-bezier(…)` or `[…]`; `undefined` otherwise. */
export function parseList(text: string): Bezier | undefined {
  const inner = text.trim().replace(/^cubic-bezier\s*\(([^]*)\)$/i, '$1').replace(/^\[([^]*)\]$/, '$1');
  const n = inner.split(/\s*,\s*|\s+/).filter(Boolean).map(Number);
  return n.length === 4 && n.every(Number.isFinite) ? (n as Bezier) : undefined;
}

/** Asks the panel for a toast (it owns them); bubbles out of the shadow tree's controls. */
const say = (from: Element, text: string): boolean =>
  from.dispatchEvent(new CustomEvent('motionrig-toast', { detail: text, bubbles: true, composed: true }));

export function bezierEditor(emit: (b: Bezier) => void): { el: HTMLElement; set(b: Bezier): void } {
  let b: Bezier = [0.25, 0.1, 0.25, 1];
  let drag: { i: number; r: DOMRect; id: number } | undefined;
  const change = (i: number, v: number): void => {
    const next = [...b];
    next[i] = v;
    emit(fit(next));
  };

  const path = s('path', { class: 'curve' });
  const arms = [s('line', { class: 'arm', x1: 0, y1: 0 }), s('line', { class: 'arm', x1: 1, y1: -1 })];
  // A second finger on the plot neither moves nor ends the drag.
  const end = (e: PointerEvent): void => {
    if (drag?.id === e.pointerId) drag = undefined;
  };
  /** Pointer position in curve units (y up). */
  const point = (e: PointerEvent, r: DOMRect): [number, number] => [
    VB[0] + ((e.clientX - r.left) / r.width) * VB[2],
    -(VB[1] + ((e.clientY - r.top) / r.height) * VB[3]),
  ];
  const handles = [0, 1].map((i) =>
    s('g', {
      class: 'handle', tabindex: 0, role: 'slider', 'aria-label': `${t('handle')} ${i + 1}`, 'aria-valuemin': 0, 'aria-valuemax': 1,
      onkeydown: (e: KeyboardEvent) => {
        const d = e.shiftKey ? 0.1 : 0.01;
        const move = ({ ArrowLeft: [0, -d], ArrowRight: [0, d], ArrowUp: [1, d], ArrowDown: [1, -d] } as Record<string, [number, number]>)[e.key];
        if (!move) return;
        e.preventDefault();
        change(i * 2 + move[0], b[i * 2 + move[0]]! + move[1]);
      },
    }, s('circle', { class: 'hit', r: 0.13 }), s('circle', { class: 'knob', r: 0.05 })),
  );

  const plot = s('svg', {
    class: 'plot', viewBox: VB.join(' '),
    // One handler for both knobs: the hit areas (enlarged for touch) overlap when the
    // knobs are close, so the knob nearest the pointer wins, not the one drawn on top.
    onpointerdown: (e: PointerEvent) => {
      if (e.button || !(e.target as Element).closest('.handle')) return;
      e.preventDefault();
      const r = plot.getBoundingClientRect();
      const [x, y] = point(e, r);
      const far = (i: number): number => Math.hypot(b[i * 2]! - x, b[i * 2 + 1]! - y);
      drag = { i: far(0) <= far(1) ? 0 : 1, r, id: e.pointerId };
      try {
        plot.setPointerCapture(e.pointerId);
      } catch {}
    },
    onpointermove: (e: PointerEvent) => {
      if (drag?.id !== e.pointerId) return;
      const next = [...b];
      [next[drag.i * 2], next[drag.i * 2 + 1]] = point(e, drag.r);
      emit(fit(next));
    },
    onpointerup: end,
    onpointercancel: end,
  },
    // Rails over the whole drag range, so the overshoot room reads as part of the graph.
    s('path', { class: 'rail', d: `M0 ${-LO}V${-HI}M1 ${-LO}V${-HI}M0 ${-LO}H1M0 ${-HI}H1` }),
    s('rect', { class: 'box', x: 0, y: -1, width: 1, height: 1 }),
    s('path', { class: 'diag', d: 'M0 0L1 -1' }),
    ...arms,
    path,
    s('circle', { class: 'end', r: 0.025 }),
    s('circle', { class: 'end', cx: 1, cy: -1, r: 0.025 }),
    ...handles);

  const fields = ['x1', 'y1', 'x2', 'y2'].map((name, i) => {
    const f = h('input', {
      // y may be negative, so no iOS decimal pad (it has no minus).
      type: 'text', enterkeyhint: 'done', spellcheck: 'false', autocomplete: 'off',
      onchange: () => {
        const v = parse(f.value);
        if (Number.isFinite(v)) change(i, v);
        else set(b);
      },
      // A whole list pasted into x1 fills all four, like the params field.
      onpaste: i ? undefined : (e: ClipboardEvent) => {
        const list = parseList(e.clipboardData?.getData('text') ?? '');
        if (!list) return;
        e.preventDefault();
        emit(fit(list));
      },
    });
    return h('label', { class: 'field' }, h('span', {}, name), f);
  });

  // All four params on one editable line; it replaces the read-only value text.
  const invalid = (bad: boolean): void => {
    if (bad) params.setAttribute('aria-invalid', 'true');
    else if (params.hasAttribute('aria-invalid')) params.removeAttribute('aria-invalid');
  };
  const take = (text: string): boolean => {
    const list = parseList(text);
    invalid(!list);
    if (list) emit(fit(list));
    return !!list;
  };
  const params = h('input', {
    class: 'text', type: 'text', enterkeyhint: 'done', spellcheck: 'false', autocomplete: 'off', 'aria-label': t('params'),
    oninput: () => invalid(false),
    onchange: () => {
      // Invalid: nothing changes, the field says so until the next edit.
      if (take(params.value)) params.value = b.join(', ');
    },
    onpaste: (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text') ?? '';
      if (parseList(text)) {
        e.preventDefault();
        take(text);
      }
    },
  });
  const copyBtn = h('button', {
    class: 'bz-copy', type: 'button', 'aria-label': t('copyCurve'), title: t('copyCurve'),
    onclick: async () => {
      if (await copy(formatBezier(b, 'css'), copyBtn.closest<HTMLElement>('.panel') ?? copyBtn)) say(copyBtn, t('curveCopied'));
    },
  }, icon('copy'));

  const preview = h('div', { class: 'preview', role: 'img', 'aria-label': t('preview') },
    h('span', { class: 'run linear' }), h('span', { class: 'run eased' }));

  function set(next: Bezier): void {
    b = next;
    params.value = b.join(', ');
    invalid(false);
    const [x1, y1, x2, y2] = b;
    path.setAttribute('d', curve(b));
    arms[0]!.setAttribute('x2', String(x1));
    arms[0]!.setAttribute('y2', String(-y1));
    arms[1]!.setAttribute('x2', String(x2));
    arms[1]!.setAttribute('y2', String(-y2));
    handles.forEach((g, i) => {
      g.setAttribute('transform', `translate(${b[i * 2]} ${-b[i * 2 + 1]!})`);
      // Two axes, one slider: valuenow carries x, valuetext reads both.
      g.setAttribute('aria-valuenow', String(b[i * 2]));
      g.setAttribute('aria-valuetext', `x ${b[i * 2]}, y ${b[i * 2 + 1]}`);
    });
    fields.forEach((f, i) => (f.lastElementChild as HTMLInputElement).value = String(b[i]));
    preview.style.setProperty('--curve', formatBezier(b, 'css'));
  }

  return {
    el: h('div', { class: 'bezier' }, plot,
      h('div', { class: 'bz-side' }, h('div', { class: 'bz-params' }, params, copyBtn), h('div', { class: 'fields' }, ...fields), preview)),
    set,
  };
}
