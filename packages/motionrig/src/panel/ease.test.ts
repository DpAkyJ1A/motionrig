import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configure, rig } from '../index';
import { $, clean, clipboardMock, edit, fire, key, pointer, row, tick } from '../test/panel';
import { parseList } from './controls/bezier';
import { open } from './index';

const select = (path: string): HTMLSelectElement => row(path).querySelector('select')!;
const texts = (sel: HTMLSelectElement): string[] => [...sel.options].map((o) => o.textContent!);
const pick = (path: string, text: string): void => {
  const sel = select(path);
  edit(sel, [...sel.options].find((o) => o.textContent === text)!.value, 'change');
};
const picked = (path: string): string => select(path).selectedOptions[0]!.textContent!;
const editor = (path: string): HTMLElement | null => row(path).querySelector<HTMLElement>('.bezier:not([hidden])');
const fields = (path: string): HTMLInputElement[] => [...row(path).querySelectorAll<HTMLInputElement>('.bezier .fields input')];
const params = (path: string): HTMLInputElement => row(path).querySelector<HTMLInputElement>('.bz-params input')!;

beforeEach(() => {
  clean();
  configure({
    enabled: true,
    eases: { reveal: { bezier: [0.7, 0, 0.2, 1], code: 'EASE_REVEAL', label: 'Reveal' }, snappy: [0.3, 0, 0, 1] },
  });
});

describe('ease (gsap flavour)', () => {
  it('menu: project palette, gsap built-ins, then "Custom curve…"', () => {
    rig('a', { ease: 'power2.out' });
    open('a');
    const sel = select('ease');
    expect([...sel.querySelectorAll('optgroup')].map((g) => g.label)).toEqual(['Project', 'Built-in']);
    expect(texts(sel).slice(0, 3)).toEqual(['Reveal', 'snappy', 'none']);
    expect(texts(sel)).toContain('back.inOut');
    expect(texts(sel).at(-1)).toBe('Custom curve…');
    expect(picked('ease')).toBe('power2.out');
    expect(editor('ease')).toBeNull();
    expect(row('ease').querySelector('.thumb path')!.getAttribute('d')).toMatch(/^M/);
  });

  it('writes names for named eases and a bare bezier for a custom curve', () => {
    const v = rig('a', { ease: 'power2.out' });
    open('a');
    pick('ease', 'Reveal');
    expect(v.ease).toBe('reveal');
    pick('ease', 'Custom curve…');
    expect(v.ease).toBe('0.7,0,0.2,1');
    expect(picked('ease')).toBe('Custom curve…');
    expect(editor('ease')).not.toBeNull();
    expect(fields('ease').map((f) => f.value)).toEqual(['0.7', '0', '0.2', '1']);
    expect(params('ease').value).toBe('0.7, 0, 0.2, 1');
    pick('ease', 'power2.out');
    expect(v.ease).toBe('power2.out');
    expect(editor('ease')).toBeNull();
  });

  it('opens a bezier value in custom mode and lists any other value as it is', () => {
    rig('c', { a: '0.1,0.2,0.3,1', b: 'elastic.out(1, 0.3)' });
    open('c');
    expect(picked('a')).toBe('Custom curve…');
    expect(fields('a').map((f) => f.value)).toEqual(['0.1', '0.2', '0.3', '1']);
    expect(picked('b')).toBe('elastic.out(1, 0.3)');
    expect(editor('b')).toBeNull();
  });
});

describe('ease (css flavour)', () => {
  it('palette curves write cubic-bezier(), keywords stay keywords, custom writes cubic-bezier()', () => {
    const v = rig('b', { ease: 'ease-out' });
    open('b');
    const curves = ['Quad', 'Cubic', 'Quart', 'Quint', 'Sine', 'Expo', 'Circ', 'Back'].flatMap((f) =>
      ['In', 'Out', 'InOut'].map((d) => `ease${d}${f}`),
    );
    expect(texts(select('ease'))).toEqual(['Reveal', 'snappy', 'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', ...curves, 'Custom curve…']);
    pick('ease', 'ease-in');
    expect(v.ease).toBe('ease-in');
    pick('ease', 'Reveal');
    expect(v.ease).toBe('cubic-bezier(0.7, 0, 0.2, 1)');
    pick('ease', 'Custom curve…');
    // Same curve as the palette entry, but the designer asked for the editor: it stays open.
    expect(v.ease).toBe('cubic-bezier(0.7, 0, 0.2, 1)');
    expect(picked('ease')).toBe('Custom curve…');
    expect(editor('ease')).not.toBeNull();
    edit(fields('ease')[1]!, '0.4', 'change');
    expect(v.ease).toBe('cubic-bezier(0.7, 0.4, 0.2, 1)');
    expect(params('ease').value).toBe('0.7, 0.4, 0.2, 1');
  });

  it('a standard curve reads as its name, in its own group, and picking one writes its bezier', () => {
    const v = rig('b', { ease: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    open('b');
    const groups = [...select('ease').querySelectorAll('optgroup')].map((g) => g.label);
    expect(groups).toEqual(['Project', 'Built-in', 'Curves']);
    expect(picked('ease')).toBe('easeOutQuint');
    expect(editor('ease')).toBeNull();
    pick('ease', 'easeInOutCubic');
    expect(v.ease).toBe('cubic-bezier(0.65, 0, 0.35, 1)');
  });

  it('a hand-written cubic-bezier() reads as its curve by numbers; the value stays as written', () => {
    const v = rig('b', { ease: 'cubic-bezier(.22,1,.36,1)' });
    open('b');
    expect(picked('ease')).toBe('easeOutQuint');
    expect(editor('ease')).toBeNull();
    expect(v.ease).toBe('cubic-bezier(.22,1,.36,1)');
    pick('ease', 'easeInOutCubic');
    expect(v.ease).toBe('cubic-bezier(0.65, 0, 0.35, 1)');
  });

  it('a css rig makes its eases css', () => {
    const v = rig('c', { ease: 'snappy' }, { css: true });
    open('c');
    pick('ease', 'Reveal');
    expect(v.ease).toBe('cubic-bezier(0.7, 0, 0.2, 1)');
  });
});

describe('bezier editor', () => {
  it('numeric inputs update the value; x is clamped to 0..1 and y to -0.6..1.6', () => {
    const v = rig('d', { e: '0.25,0.1,0.25,1' });
    open('d');
    const [, y1, x2, y2] = fields('e');
    edit(y1!, '0.5', 'change');
    expect(v.e).toBe('0.25,0.5,0.25,1');
    edit(x2!, '1.7', 'change');
    expect(v.e).toBe('0.25,0.5,1,1');
    edit(y2!, '9', 'change');
    expect(v.e).toBe('0.25,0.5,1,1.6');
    edit(y2!, 'nope', 'change');
    expect(v.e).toBe('0.25,0.5,1,1.6');
    expect(y2!.value).toBe('1.6');
  });

  it('arrow keys move a focused handle (shift = ×10)', () => {
    const v = rig('d', { e: '0.25,0.1,0.25,1' });
    open('d');
    const [h1, h2] = [...row('e').querySelectorAll('.handle')];
    key(h1!, { key: 'ArrowRight' });
    expect(v.e).toBe('0.26,0.1,0.25,1');
    key(h2!, { key: 'ArrowUp', shiftKey: true });
    expect(v.e).toBe('0.26,0.1,0.25,1.1');
  });

  it('dragging a handle writes the curve under the pointer', () => {
    const v = rig('d', { e: '0.25,0.1,0.25,1' });
    open('d');
    const svg = row('e').querySelector('svg.plot')!;
    const [vx, vy, vw, vh] = svg.getAttribute('viewBox')!.split(' ').map(Number) as [number, number, number, number];
    const k = 100;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: vw * k, height: vh * k }) as DOMRect;
    // The plot draws y upwards: svg y = -curve y.
    const at = (x: number, y: number): [number, number] => [(x - vx) * k, (-y - vy) * k];
    const h1 = row('e').querySelector('.handle')!;
    pointer(h1, 'pointerdown', ...at(0.25, 0.1));
    pointer(h1, 'pointermove', ...at(0.5, 1.2));
    pointer(h1, 'pointerup', ...at(0.5, 1.2));
    expect(v.e).toBe('0.5,1.2,0.25,1');
    pointer(h1, 'pointermove', ...at(0.9, 0.9));
    expect(v.e).toBe('0.5,1.2,0.25,1');
  });

  it('touch: overlapping hit areas pick the knob nearest the pointer', () => {
    const v = rig('d', { e: '0.3,0.3,0.36,0.36' });
    open('d');
    const svg = row('e').querySelector('svg.plot')!;
    const [vx, vy, vw, vh] = svg.getAttribute('viewBox')!.split(' ').map(Number) as [number, number, number, number];
    const k = 100;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: vw * k, height: vh * k }) as DOMRect;
    const at = (x: number, y: number): [number, number] => [(x - vx) * k, (-y - vy) * k];
    // Handle 2's enlarged hit circle lies over handle 1 and receives the touch.
    const h2 = row('e').querySelectorAll('.handle')[1]!.querySelector('.hit')!;
    pointer(h2, 'pointerdown', ...at(0.29, 0.29));
    pointer(h2, 'pointermove', ...at(0.5, 0.8));
    pointer(h2, 'pointerup', ...at(0.5, 0.8));
    expect(v.e).toBe('0.5,0.8,0.36,0.36');
  });

  it('a drag follows its own pointer: another finger neither moves nor ends it', () => {
    const v = rig('d', { e: '0.25,0.1,0.25,1' });
    open('d');
    const svg = row('e').querySelector('svg.plot')!;
    const [vx, vy, vw, vh] = svg.getAttribute('viewBox')!.split(' ').map(Number) as [number, number, number, number];
    const k = 100;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: vw * k, height: vh * k }) as DOMRect;
    const at = (x: number, y: number): [number, number] => [(x - vx) * k, (-y - vy) * k];
    const h1 = row('e').querySelector('.handle')!;
    pointer(h1, 'pointerdown', ...at(0.25, 0.1), 1);
    pointer(svg, 'pointermove', ...at(0.9, 0.9), 2);
    expect(v.e).toBe('0.25,0.1,0.25,1');
    pointer(svg, 'pointerup', ...at(0.9, 0.9), 2);
    pointer(svg, 'pointercancel', ...at(0.9, 0.9), 2);
    pointer(svg, 'pointermove', ...at(0.5, 1.2), 1);
    expect(v.e).toBe('0.5,1.2,0.25,1');
  });

  it('back.* overshoot (y −0.6 … 1.6) survives editing; further is clamped there', () => {
    const v = rig('d', { e: '0.68,-0.6,0.32,1.6' });
    open('d');
    const [h1] = [...row('e').querySelectorAll('.handle')];
    key(h1!, { key: 'ArrowRight' });
    expect(v.e).toBe('0.69,-0.6,0.32,1.6');
    edit(fields('e')[3]!, '2', 'change');
    expect(v.e).toBe('0.69,-0.6,0.32,1.6');
    edit(fields('e')[1]!, '-1', 'change');
    expect(v.e).toBe('0.69,-0.6,0.32,1.6');
  });

  it('a press on the plot away from both knobs drags nothing', () => {
    const v = rig('d', { e: '0.25,0.1,0.25,1' });
    open('d');
    const svg = row('e').querySelector('svg.plot')!;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 116, height: 216 }) as DOMRect;
    pointer(svg.querySelector('.box')!, 'pointerdown', 60, 60);
    pointer(svg, 'pointermove', 80, 80);
    expect(v.e).toBe('0.25,0.1,0.25,1');
  });

  it('the preview runs on the current curve', () => {
    rig('d', { e: '0.25,0.1,0.25,1' });
    open('d');
    edit(fields('e')[0]!, '0.6', 'change');
    const preview = row('e').querySelector<HTMLElement>('.preview')!;
    expect(preview.style.getPropertyValue('--curve')).toBe('cubic-bezier(0.6, 0.1, 0.25, 1)');
  });
});

describe('bezier params row', () => {
  const paste = (el: HTMLInputElement, text: string): Event => {
    const e = new Event('paste', { bubbles: true, cancelable: true, composed: true });
    Object.defineProperty(e, 'clipboardData', { value: { getData: () => text } });
    el.dispatchEvent(e);
    return e;
  };

  it('parses comma or space lists, cubic-bezier(…) and […]; anything else is undefined', () => {
    const b = [0.68, -0.6, 0.527, 1.6];
    for (const text of ['0.68, -0.6, 0.527, 1.6', '0.68,-0.6,.527,1.6', ' 0.68 -0.6 0.527 1.6 ', 'cubic-bezier(0.68, -0.6, .527, 1.6)', 'CUBIC-BEZIER( 0.68,-0.6,0.527,1.6 )', '[0.68, -0.6, 0.527, 1.6]']) {
      expect(parseList(text), text).toEqual(b);
    }
    for (const text of ['', '0.1, 0.2, 0.3', '0.1, 0.2, 0.3, 0.4, 0.5', '0.1, x, 0.3, 0.4', 'ease-in', 'cubic-bezier(0.1, 0.2, 0.3)', '1e999, 0, 0, 0']) {
      expect(parseList(text), text).toBeUndefined();
    }
  });

  it('shows the four params on one line above x1…y2, and no separate value line', () => {
    rig('d', { e: '0.68,-0.6,0.527,1.6' });
    open('d');
    const p = row('e').querySelector<HTMLInputElement>('.bz-params input')!;
    expect(p.value).toBe('0.68, -0.6, 0.527, 1.6');
    expect(p.closest('.bz-side')!.firstElementChild).toBe(p.parentElement);
    expect(row('e').querySelector('.bz-value')).toBeNull();
  });

  it('typing a full list fills all four and the curve; x and y are clamped; invalid changes nothing and says so', () => {
    const v = rig('d', { e: '0.25,0.1,0.25,1' });
    open('d');
    const p = row('e').querySelector<HTMLInputElement>('.bz-params input')!;
    edit(p, 'cubic-bezier(.2, -2, 1.5, 1.2)', 'change');
    expect(v.e).toBe('0.2,-0.6,1,1.2');
    expect(p.value).toBe('0.2, -0.6, 1, 1.2');
    expect(row('e').querySelector<HTMLElement>('.preview')!.style.getPropertyValue('--curve')).toBe('cubic-bezier(0.2, -0.6, 1, 1.2)');
    expect(() => edit(p, '0.1, 0.2, nope', 'change')).not.toThrow();
    expect(v.e).toBe('0.2,-0.6,1,1.2');
    expect(p.getAttribute('aria-invalid')).toBe('true');
    edit(p, '0.1, 0.2', 'input');
    expect(p.hasAttribute('aria-invalid')).toBe(false);
  });

  it('pasting a full list into the params field or into x1 fills all four; a single number pastes as usual', () => {
    const v = rig('d', { e: '0.25,0.1,0.25,1' });
    open('d');
    const p = row('e').querySelector<HTMLInputElement>('.bz-params input')!;
    expect(paste(p, '[0.68, -0.6, 0.527, 1.6]').defaultPrevented).toBe(true);
    expect(v.e).toBe('0.68,-0.6,0.527,1.6');
    const x1 = row('e').querySelector<HTMLInputElement>('.fields input')!;
    expect(paste(x1, '0.1 0.2 0.3 0.4').defaultPrevented).toBe(true);
    expect(v.e).toBe('0.1,0.2,0.3,0.4');
    expect(paste(x1, '0.5').defaultPrevented).toBe(false);
    expect(v.e).toBe('0.1,0.2,0.3,0.4');
  });

  it('the copy button copies cubic-bezier(x1, y1, x2, y2) and toasts "Curve copied"', async () => {
    const clip = clipboardMock(vi.fn(async () => {}));
    rig('d', { e: '0.68,-0.6,0.527,1.6' });
    open('d');
    const btn = row('e').querySelector<HTMLButtonElement>('.bz-copy')!;
    expect([btn.getAttribute('aria-label'), btn.title]).toEqual(['Copy as cubic-bezier()', 'Copy as cubic-bezier()']);
    fire(btn, 'click');
    await tick();
    expect(clip.writeText).toHaveBeenCalledWith('cubic-bezier(0.68, -0.6, 0.527, 1.6)');
    expect($('.toast')!.textContent).toBe('Curve copied');
  });
});
