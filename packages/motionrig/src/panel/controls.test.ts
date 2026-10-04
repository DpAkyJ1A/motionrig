import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configure, rig } from '../index';
import { getEntry, setValue } from '../core/registry';
import { $, $$, clean, edit, fire, key, row, tick } from '../test/panel';
import { open } from './index';

const q = <E extends Element = HTMLInputElement>(path: string, sel: string): E => row(path).querySelector<E>(sel)!;
const changed = (path: string): boolean => row(path).classList.contains('changed');

beforeEach(() => {
  clean();
  configure({ enabled: true });
});

describe('number', () => {
  const setup = () => {
    const v = rig('a', { x: 1, y: 5 }, { controls: { y: { min: 0, max: 10, step: 1, unit: 'px' } } });
    open('a');
    return v;
  };

  it('the slider writes the quantized live value and shows the reset affordance', () => {
    const v = setup();
    const slider = q('x', 'input[type="range"]');
    expect([slider.min, slider.max, slider.step]).toEqual(['0', '3', '0.01']);
    expect(changed('x')).toBe(false);
    expect(q('x', '.reset').hidden).toBe(true);
    edit(slider, '1.234');
    expect(v.x).toBe(1.23);
    expect(q('x', '.num').value).toBe('1.23');
    expect(changed('x')).toBe(true);
    expect(q('x', '.reset').hidden).toBe(false);
  });

  it('the numeric input accepts values outside the slider range and commits on change', () => {
    const v = setup();
    const num = q('y', '.num');
    expect(q<HTMLElement>('y', '.unit').textContent).toBe('px');
    num.value = '42';
    expect(v.y).toBe(5);
    fire(num, 'change');
    expect(v.y).toBe(42);
    edit(num, 'abc', 'change');
    expect(v.y).toBe(42);
    expect(num.value).toBe('42');
  });

  it('the numeric field keeps a keyboard with a minus sign on phones', () => {
    setup();
    expect(q('x', '.num').getAttribute('inputmode')).toBeNull();
    expect(q('x', '.num').type).toBe('text');
  });

  it('arrow keys in the numeric input step the value (shift = ×10)', () => {
    const v = setup();
    const num = q('y', '.num');
    key(num, { key: 'ArrowUp' });
    expect(v.y).toBe(6);
    key(num, { key: 'ArrowDown', shiftKey: true });
    expect(v.y).toBe(-4);
  });

  it('↺ and a double-click on the label reset to the code default', () => {
    const v = setup();
    setValue('a', 'x', 2);
    setValue('a', 'y', 7);
    open('a');
    q<HTMLButtonElement>('x', '.reset').click();
    expect(v.x).toBe(1);
    fire(q('y', '.label'), 'dblclick');
    expect(v.y).toBe(5);
    expect(changed('y')).toBe(false);
  });
});

describe('toggle, select, text, color', () => {
  it('toggle is a switch that flips the value', () => {
    const v = rig('a', { on: false });
    open('a');
    const sw = q<HTMLButtonElement>('on', '[role="switch"]');
    expect(sw.getAttribute('aria-checked')).toBe('false');
    sw.click();
    expect(v.on).toBe(true);
    expect(sw.getAttribute('aria-checked')).toBe('true');
  });

  it('select writes the option value with its type', () => {
    const v = rig('a', { mode: 'fade', cols: 3 }, {
      controls: { mode: { options: ['fade', 'slide'] }, cols: { options: [{ label: 'Three', value: 3 }, { label: 'Four', value: 4 }] } },
    });
    open('a');
    const mode = q<HTMLSelectElement>('mode', 'select');
    expect([...mode.options].map((o) => o.textContent)).toEqual(['fade', 'slide']);
    edit(mode, String([...mode.options].findIndex((o) => o.textContent === 'slide')), 'change');
    expect(v.mode).toBe('slide');
    const cols = q<HTMLSelectElement>('cols', 'select');
    edit(cols, String([...cols.options].findIndex((o) => o.textContent === 'Four')), 'change');
    expect(v.cols).toBe(4);
  });

  it('text commits on change', () => {
    const v = rig('a', { copy: 'Hello' });
    open('a');
    const input = q('copy', 'input');
    input.value = 'Hi';
    fire(input, 'input');
    expect(v.copy).toBe('Hello');
    fire(input, 'change');
    expect(v.copy).toBe('Hi');
  });

  it('color: the picker writes hex (keeping alpha), the text field writes anything', () => {
    const v = rig('a', { tint: '#ff000080', bg: 'oklch(0.7 0.1 200)' });
    open('a');
    const picker = q('tint', 'input[type="color"]');
    expect(picker.value).toBe('#ff0000');
    edit(picker, '#00ff00');
    expect(v.tint).toBe('#00ff0080');
    edit(q('tint', 'input.text'), '#123', 'change');
    expect(v.tint).toBe('#123');
    expect(picker.value).toBe('#112233');
    expect(q('bg', 'input[type="color"]').disabled).toBe(true);
    expect(q<HTMLElement>('bg', '.swatch').style.getPropertyValue('--c')).toBe('oklch(0.7 0.1 200)');
  });

  it('color: a short #rgba value shows in the picker and keeps its alpha when picked', () => {
    const v = rig('a', { tint: '#f008' });
    open('a');
    const picker = q('tint', 'input[type="color"]');
    expect(picker.disabled).toBe(false);
    expect(picker.value).toBe('#ff0000');
    edit(picker, '#00ff00');
    expect(v.tint).toBe('#00ff0088');
  });
});

describe('color case', () => {
  it('re-picking an uppercase default in lowercase keeps the default (not a change)', () => {
    const v = rig('a', { tint: '#FF0000', bg: '#ABC' });
    open('a');
    edit(q('tint', 'input[type="color"]'), '#ff0000');
    expect(v.tint).toBe('#FF0000');
    expect(changed('tint')).toBe(false);
    edit(q('bg', 'input.text'), '#abc', 'change');
    expect(v.bg).toBe('#ABC');
    expect(changed('bg')).toBe(false);
  });
});

describe('rows and groups', () => {
  it('shows keys in mono, custom labels with their key, hints and group headings', () => {
    rig('a', { x: 1, enter: { rows: 2 }, t: 3 }, {
      note: 'Scroll to the hero',
      controls: { t: { label: 'Time', hint: 'seconds', group: 'Timing' }, enter: { label: 'Enter', hint: 'on load' } },
    });
    open('a');
    expect(q<HTMLElement>('x', '.key').textContent).toBe('x');
    expect(row('t').querySelector('.label')!.textContent).toContain('Time');
    expect(q<HTMLElement>('t', '.key').textContent).toBe('t');
    expect(q<HTMLElement>('t', '.hint').textContent).toBe('seconds');
    // `t` is listed in meta.controls, so its Timing group leads (§5).
    expect($$('.group-head').map((h) => h.textContent)).toEqual(['Timing', 'Enter']);
    expect($('.group-hint')!.textContent).toBe('on load');
    expect($('.note')!.textContent).toBe('Scroll to the hero');
  });

  it('"More" belongs to a long note, not the tab strip, and expands the note in place', async () => {
    // happy-dom has no layout: make the clamped note overflow its 3 lines.
    const sh = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(120);
    const ch = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(54);
    try {
      for (let i = 0; i < 30; i++) rig(`r${i}`, { x: i }, i ? {} : { note: 'A long note. '.repeat(40) });
      open('r0');
      await new Promise((r) => requestAnimationFrame(r));
      // The strip holds chips, its "+N"/"Less" toggle, "mark seen" (§10.3) and its "no match" line only.
      expect($$('.tabs > :not(.chip):not(.tabs-none):not(.more-tabs):not(.seen-all)')).toEqual([]);
      const more = $<HTMLButtonElement>('.note-box .more')!;
      expect(more.hidden).toBe(false);
      expect([more.textContent, more.getAttribute('aria-expanded')]).toEqual(['More', 'false']);
      more.click();
      expect($('.note')!.classList.contains('full')).toBe(true);
      expect([more.textContent, more.getAttribute('aria-expanded')]).toEqual(['Less', 'true']);
      more.click();
      expect($('.note')!.classList.contains('full')).toBe(false);
    } finally {
      sh.mockRestore();
      ch.mockRestore();
    }
  });

  it('a group heading collapses its controls', () => {
    rig('a', { enter: { rows: 2 } });
    open('a');
    const head = $<HTMLButtonElement>('.group-head')!;
    expect(head.getAttribute('aria-expanded')).toBe('true');
    head.click();
    expect(head.getAttribute('aria-expanded')).toBe('false');
    expect(row('enter.rows').closest<HTMLElement>('.group-rows')!.hidden).toBe(true);
  });

  it('an outside change updates only the affected row', async () => {
    rig('a', { x: 1, y: 2, z: 3 });
    open('a');
    const body = $('.body')!;
    const touched = new Set<Element>();
    const mo = new MutationObserver((list) =>
      list.forEach((m) => touched.add((m.target as Element).closest?.('.row') ?? (m.target.parentElement!.closest('.row') as Element))),
    );
    mo.observe(body, { subtree: true, attributes: true, childList: true, characterData: true });
    setValue('a', 'y', 4);
    await tick();
    mo.disconnect();
    expect(q('y', '.num').value).toBe('4');
    expect([...touched]).toEqual([row('y')]);
  });

  it('an HMR replace rebuilds the tab with the new controls', async () => {
    rig('a', { x: 1 });
    open('a');
    const before = row('x');
    rig('a', { x: 1, w: 9 });
    await tick();
    expect(row('x')).not.toBe(before);
    expect(row('w')).not.toBeNull();
    expect(getEntry('a')).toBeDefined();
  });
});
