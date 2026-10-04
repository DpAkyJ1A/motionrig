import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configure, rig } from '../index';
import { $, clean, host } from '../test/panel';
import { open } from './index';
import { css } from './styles';

beforeEach(clean);

const theme = (): string | null => host()!.getAttribute('data-theme');

describe('theme', () => {
  it.each([
    [undefined, 'dark'],
    ['dark', 'dark'],
    ['light', 'light'],
    ['auto', 'auto'],
    ['neon', 'dark'],
  ] as const)('theme %s resolves to data-theme="%s"', (value, expected) => {
    configure({ enabled: true, theme: value as 'dark' });
    rig('a', { x: 1 });
    open('a');
    expect(theme()).toBe(expected);
  });

  it('switches at runtime in place: same element, same open tab DOM', () => {
    configure({ enabled: true });
    rig('a', { x: 1 });
    open('a');
    const el = host();
    const tab = $('.tab');
    configure({ theme: 'light' });
    expect(theme()).toBe('light');
    configure({ theme: 'auto' });
    expect(theme()).toBe('auto');
    configure({ theme: undefined });
    expect(theme()).toBe('dark');
    expect(host()).toBe(el);
    expect($('.tab')).toBe(tab);
    expect(el!.hasAttribute('open')).toBe(true);
  });

  it('a theme-only configure() never re-reads the gate', () => {
    history.replaceState(null, '', '/?rig');
    configure({});
    rig('a', { x: 1 });
    open('a');
    const get = vi.spyOn(Storage.prototype, 'getItem');
    const replace = vi.spyOn(history, 'replaceState');
    configure({ theme: 'light' });
    expect(theme()).toBe('light');
    expect(get).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    // Mixed with a gate option it is a full configure as before.
    configure({ theme: 'dark', enabled: false });
    expect(theme()).toBe('dark');
    get.mockRestore();
    replace.mockRestore();
  });

  it('a detached panel stops listening', () => {
    configure({ enabled: true });
    open();
    const el = host()!;
    el.remove();
    configure({ theme: 'light' });
    expect(el.getAttribute('data-theme')).toBe('dark');
  });
});

describe('light palette', () => {
  const block = (sel: string): Record<string, string> => {
    const body = css.slice(css.indexOf(`${sel}{`) + sel.length + 1);
    const tokens: Record<string, string> = {};
    for (const m of body.slice(0, body.indexOf('}')).matchAll(/(--mr-[\w-]+):([^;]+)/g)) tokens[m[1]!] = m[2]!.trim();
    return tokens;
  };
  const lum = (hex: string): number => {
    const full = hex.length === 4 ? hex.replace(/\w/g, (c) => c + c) : hex;
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(full.slice(i, i + 2), 16) / 255).map((c) =>
      c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  };
  const contrast = (a: string, b: string): number => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x! + 0.05) / (y! + 0.05);
  };

  it('applies under data-theme="light", and under "auto" only when the OS prefers light', () => {
    expect(css).toContain(':host([data-theme="light"]){color-scheme:light;');
    expect(css).toContain('@media (prefers-color-scheme:light){:host([data-theme="auto"]){color-scheme:light;');
  });

  it('every text colour, the dark amber for yellow-as-text included, passes WCAG AA on every light surface', () => {
    const t = block(':host([data-theme="light"])');
    expect(t['--mr-hi']).not.toBe('#ffd400');
    for (const fg of ['--mr-text', '--mr-muted', '--mr-hi', '--mr-blue', '--mr-red']) {
      for (const bg of ['--mr-bg', '--mr-surface', '--mr-raise']) {
        expect(contrast(t[fg]!, t[bg]!), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('focus cues hold >= 3:1 on every light surface: solid slider halo, amber bezier knob', () => {
    const t = block(':host([data-theme="light"])');
    expect([t['--mr-halo'], t['--mr-knob-focus']]).toEqual(['var(--mr-hi)', 'var(--mr-hi)']);
    for (const bg of ['--mr-bg', '--mr-surface', '--mr-raise']) {
      expect(contrast(t['--mr-hi']!, t[bg]!), `--mr-hi on ${bg}`).toBeGreaterThanOrEqual(3);
    }
    expect(css).toContain('0 0 0 5px var(--mr-halo)}');
    expect(css).toContain('.handle:focus-visible .knob{fill:var(--mr-knob-focus)}');
  });

  it('thin marks are stronger in light: arms .8, default tick .5, input lines .18', () => {
    const t = block(':host([data-theme="light"])');
    expect([t['--mr-arm'], t['--mr-tick'], t['--mr-line']]).toEqual(['rgb(122 95 0 / .8)', 'rgb(0 0 0 / .5)', 'rgb(0 0 0 / .18)']);
  });

  it('dark stays the default palette', () => {
    const t = block(':host');
    expect([t['--mr-bg'], t['--mr-accent'], t['--mr-hi']]).toEqual(['#111113', '#ffd400', 'var(--mr-accent)']);
  });
});
