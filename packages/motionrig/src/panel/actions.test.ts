import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configure, rig } from '../index';
import { changedCount, setValue } from '../core/registry';
import { decodeShare, encodeShare } from '../core/payload';
import { MAX_URL } from './element';
import { $, $$, clean, clipboardMock, key, root, tick } from '../test/panel';
import { open } from './index';

const act = (name: string): HTMLButtonElement => $<HTMLButtonElement>(`[data-act="${name}"]`)!;
const toast = (): string => $('.toast')!.textContent!;

beforeEach(() => {
  clean();
  configure({ enabled: true });
});

afterEach(() => {
  vi.useRealTimers();
  delete (document as { execCommand?: unknown }).execCommand;
});

describe('Copy code', () => {
  it('puts the §9 snippet of the tab on the clipboard', async () => {
    const clip = clipboardMock(vi.fn(async () => {}));
    rig('hero', { duration: 1.2, 'faq-duration': 0.7, enter: { rows: 12 } });
    open('hero');
    setValue('hero', 'duration', 0.8);
    act('copy').click();
    await tick();
    expect(clip.writeText).toHaveBeenCalledWith("// hero\n{\n  duration: 0.8,\n  'faq-duration': 0.7,\n  enter: {\n    rows: 12,\n  },\n}");
    expect(toast()).toBe('Code copied · hero');
  });

  it('names the rig on the button and in the toast, per tab', async () => {
    const clip = clipboardMock(vi.fn(async () => {}));
    rig('scrub', { smooth: 0.8 }, { title: 'Scroll scrub' });
    rig('hero', { x: 1 });
    open('scrub');
    expect([act('copy').textContent, act('copy').getAttribute('aria-label'), act('copy').title])
      .toEqual(['Copy code', 'Copy code · Scroll scrub', 'Copy code · Scroll scrub']);
    act('copy').click();
    await tick();
    expect(clip.writeText).toHaveBeenLastCalledWith('// scrub — Scroll scrub\n{\n  smooth: 0.8,\n}');
    expect(toast()).toBe('Code copied · Scroll scrub');
    $<HTMLButtonElement>('.chip[data-id="hero"]')!.click();
    expect(act('copy').getAttribute('aria-label')).toBe('Copy code · hero');
  });

  it('copies CSS declarations for a css rig', async () => {
    const clip = clipboardMock(vi.fn(async () => {}));
    rig('faq', { fadeDuration: 0.7 }, { css: true, controls: { fadeDuration: { unit: 's' } } });
    open('faq');
    act('copy').click();
    await tick();
    expect(clip.writeText).toHaveBeenCalledWith('/* faq */\n--fade-duration: 0.7s;');
  });
});

describe('Share link', () => {
  it('says so when nothing changed yet', async () => {
    const clip = clipboardMock(vi.fn(async () => {}));
    rig('a', { x: 1 });
    open('a');
    act('share').click();
    await tick();
    expect(clip.writeText).not.toHaveBeenCalled();
    expect(toast()).toBe('Nothing changed yet');
  });

  it('copies a URL whose payload decodes to the overrides and their baselines', async () => {
    const clip = clipboardMock(vi.fn(async () => {}));
    rig('a', { x: 1 });
    open('a');
    setValue('a', 'x', 2);
    act('share').click();
    await tick();
    const url = new URL(vi.mocked(clip.writeText).mock.calls[0]![0]);
    expect(decodeShare(url.searchParams.get('rig')!)).toMatchObject({ o: { a: { x: 2 } }, b: { a: { x: 1 } } });
    expect(toast()).toBe('Link with 1 tweak across 1 rig copied');
  });

  it('is an icon button named for what it shares, and its toast counts tweaks and rigs, other pages included', async () => {
    clipboardMock(vi.fn(async () => {}));
    localStorage.setItem('motionrig', JSON.stringify({ v: 1, overrides: { gone: { z: 5 } }, baseline: { gone: { z: 1 } }, ui: {} }));
    rig('a', { x: 1, y: 1 });
    open('a');
    expect([act('share').textContent, act('share').getAttribute('aria-label'), act('share').title])
      .toEqual(['', 'Share link — all tweaks', 'Share link — all tweaks']);
    expect(act('share').querySelector('.icon-link')).not.toBeNull();
    setValue('a', 'x', 2);
    setValue('a', 'y', 3);
    act('share').click();
    await tick();
    expect(toast()).toBe('Link with 3 tweaks across 2 rigs copied');
  });

  it('counts in Russian with the right plural forms', async () => {
    clipboardMock(vi.fn(async () => {}));
    configure({ locale: 'ru' });
    const values = Object.fromEntries(Array.from({ length: 5 }, (_, i) => [`k${i}`, 1]));
    rig('a', values);
    open('a');
    const say = async (n: number) => {
      for (let i = 0; i < 5; i++) setValue('a', `k${i}`, i < n ? 2 : 1);
      act('share').click();
      await tick();
      return toast();
    };
    expect(await say(1)).toBe('Ссылка скопирована: 1 правка в 1 риге');
    expect(await say(2)).toBe('Ссылка скопирована: 2 правки в 1 риге');
    expect(await say(5)).toBe('Ссылка скопирована: 5 правок в 1 риге');
  });
});

describe('share link length', () => {
  it('over the URL ceiling copies the raw payload with an explaining toast; never a broken link', async () => {
    const clip = clipboardMock(vi.fn(async () => {}));
    const values = Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`duration${i}`, 1]));
    rig('a', values);
    open('a');
    setValue('a', 'duration0', 2);
    act('share').click();
    await tick();
    const small = vi.mocked(clip.writeText).mock.calls.at(-1)![0];
    expect(small.length).toBeLessThan(MAX_URL);
    expect(new URL(small).searchParams.get('rig')).toBeTruthy();
    for (let i = 0; i < 200; i++) setValue('a', `duration${i}`, 2);
    act('share').click();
    await tick();
    const big = vi.mocked(clip.writeText).mock.calls.at(-1)![0];
    expect(location.href.length + big.length).toBeGreaterThan(MAX_URL);
    expect(() => new URL(big)).toThrow();
    expect(Object.keys(decodeShare(big)!.o.a!)).toHaveLength(200);
    expect(toast()).toBe('Too many tweaks for a link — payload copied. Apply it with npx motionrig apply <payload>, or paste it into the panel’s search');
  });

  it('a link or payload pasted into the search is imported, like opening the link; other text searches', async () => {
    const v = rig('a', { x: 1, y: 1 });
    open('a');
    const search = $<HTMLInputElement>('.search input')!;
    const paste = (text: string): boolean => {
      const e = new Event('paste', { bubbles: true, cancelable: true, composed: true });
      Object.defineProperty(e, 'clipboardData', { value: { getData: () => text } });
      search.dispatchEvent(e);
      return e.defaultPrevented;
    };
    const payload = encodeShare({ v: 1, o: { a: { x: 5 }, gone: { z: 2 } }, b: { a: { x: 1 }, gone: { z: 1 } } });
    expect(paste(payload)).toBe(true);
    expect(v.x).toBe(5);
    expect(toast()).toBe('Imported 2 tweaks across 2 rigs');
    await tick();
    expect($('.badge')!.textContent).toBe('2');
    const link = `https://site.example/page?rig=${encodeShare({ v: 1, o: { a: { y: 3 } }, b: { a: { y: 1 } } })}#x`;
    expect(paste(link)).toBe(true);
    expect(v.y).toBe(3);
    expect(paste('hero')).toBe(false);
    expect(paste('https://example.com/?q=1')).toBe(false);
  });
});

describe('Reset', () => {
  it('Reset tab restores that tab only', () => {
    const a = rig('a', { x: 1 });
    const b = rig('b', { y: 1 });
    setValue('a', 'x', 2);
    setValue('b', 'y', 2);
    open('a');
    act('reset-tab').click();
    expect([a.x, b.y]).toEqual([1, 2]);
    expect(toast()).toBe('Tab reset to code defaults');
  });

  it('Reset all needs a second click within 3 s and also clears other pages', async () => {
    vi.useFakeTimers();
    localStorage.setItem('motionrig', JSON.stringify({ v: 1, overrides: { gone: { z: 5 } }, baseline: { gone: { z: 1 } }, ui: {} }));
    const a = rig('a', { x: 1 });
    setValue('a', 'x', 2);
    open('a');
    const btn = act('reset-all');
    btn.click();
    expect(a.x).toBe(2);
    expect(btn.textContent).toBe('Click again to reset all');
    vi.advanceTimersByTime(3100);
    expect(btn.textContent).toBe('Reset all');
    btn.click();
    expect(a.x).toBe(2);
    btn.click();
    expect(a.x).toBe(1);
    expect(changedCount()).toBe(0);
    expect(btn.textContent).toBe('Reset all');
    expect(toast()).toBe('Everything reset to code defaults');
    await Promise.resolve(); // the reset's notifications update badge and marks
    expect($('.badge')!.hidden).toBe(true);
  });

  it('Reset tab / Reset all update chips, badge and rows in one pass of real writes', async () => {
    rig('a', { x: 1, y: 1 });
    rig('b', { z: 1 });
    setValue('a', 'x', 2);
    setValue('b', 'z', 2);
    open('a');
    await tick();
    const log: MutationRecord[] = [];
    const mo = new MutationObserver((r) => log.push(...r));
    mo.observe(root(), { subtree: true, attributes: true, childList: true, characterData: true });
    const changes = async (fn: () => void) => {
      log.length = 0;
      fn();
      await tick();
      return log
        // Not the toast, nor the Reset all button's own confirm label.
        .filter((r) => !(r.target as Element).closest?.('.toast, [data-act]'))
        .map((r) => `${(r.target as Element).className}:${r.attributeName ?? r.type}`);
    };

    // Each write exactly once (the badge's text swap is a remove + an add record).
    expect(await changes(() => act('reset-tab').click())).toEqual([
      'dot:hidden', 'sr:hidden', 'badge:childList', 'badge:childList', 'ring:aria-label',
      'slide:style', 'row:class', 'reset:hidden',
    ]);
    expect($$('.chip .dot').map((d) => d.hidden)).toEqual([true, false]);
    expect(await changes(() => {
      act('reset-all').click();
      act('reset-all').click();
    })).toEqual(['dot:hidden', 'sr:hidden', 'badge:hidden', 'badge:childList', 'badge:childList', 'ring:aria-label']);
    expect($('.badge')!.hidden).toBe(true);
    mo.disconnect();
  });
});

describe('value changes write only what differs', () => {
  it('a second input on a changed value touches nothing outside its row', async () => {
    rig('a', { x: 1 });
    rig('b', { y: 1 });
    open('a');
    setValue('a', 'x', 2);
    await tick();
    const log: MutationRecord[] = [];
    const mo = new MutationObserver((r) => log.push(...r));
    mo.observe(root(), { subtree: true, attributes: true, childList: true, characterData: true });
    setValue('a', 'x', 3);
    await tick();
    mo.disconnect();
    const outside = log.filter((r) => !(r.target instanceof Node && (r.target.parentElement ?? r.target as Element).closest?.('.row')));
    expect(outside.map((r) => `${(r.target as Element).className}:${r.attributeName ?? r.type}`)).toEqual([]);
  });
});

describe('clipboard fallbacks', () => {
  it('uses execCommand when the Clipboard API is refused', async () => {
    clipboardMock(async () => {
      throw new Error('insecure context');
    });
    const exec = vi.fn(() => true);
    (document as { execCommand?: unknown }).execCommand = exec;
    rig('a', { x: 1 });
    open('a');
    act('copy').click();
    await tick();
    expect(exec).toHaveBeenCalledWith('copy');
    expect(toast()).toBe('Code copied · a');
    expect($('.modal')).toBeNull();
    expect($('textarea')).toBeNull();
  });

  it('as a last resort shows the text selected in a dialog; Escape closes only the dialog', async () => {
    clipboardMock(async () => {
      throw new Error('insecure context');
    });
    rig('a', { x: 1 });
    open('a');
    act('copy').click();
    await tick();
    const area = $<HTMLTextAreaElement>('.modal textarea')!;
    expect(area.value).toBe('// a\n{\n  x: 1,\n}');
    expect(toast()).not.toBe('Code copied · a');
    key(area, { key: 'Escape' });
    expect($('.modal')).toBeNull();
    expect(document.querySelector('motionrig-panel')!.hasAttribute('open')).toBe(true);
  });
});

describe('clipboard focus and selection', () => {
  const active = (): Element | null => document.querySelector('motionrig-panel')!.shadowRoot!.activeElement;

  it('selects the whole range (iOS) and gives focus back after the hidden textarea', async () => {
    clipboardMock(async () => {
      throw new Error('insecure context');
    });
    (document as { execCommand?: unknown }).execCommand = vi.fn(() => true);
    const range = vi.spyOn(HTMLTextAreaElement.prototype, 'setSelectionRange');
    rig('a', { x: 1 });
    open('a');
    act('copy').focus();
    act('copy').click();
    await tick();
    expect(range).toHaveBeenCalledWith(0, '// a\n{\n  x: 1,\n}'.length);
    expect(active()).toBe(act('copy'));
  });

  it('the manual dialog keeps Tab inside and gives focus back when closed', async () => {
    clipboardMock(async () => {
      throw new Error('insecure context');
    });
    const range = vi.spyOn(HTMLTextAreaElement.prototype, 'setSelectionRange');
    rig('a', { x: 1 });
    open('a');
    act('copy').focus();
    act('copy').click();
    await tick();
    const area = $<HTMLTextAreaElement>('.modal textarea')!;
    const close = act('close');
    expect(active()).toBe(area);
    expect(range).toHaveBeenCalledWith(0, area.value.length);
    key(area, { key: 'Tab' });
    expect(active()).toBe(close);
    key(close, { key: 'Tab' });
    expect(active()).toBe(area);
    key(area, { key: 'Tab', shiftKey: true });
    expect(active()).toBe(close);
    close.click();
    expect($('.modal')).toBeNull();
    expect(active()).toBe(act('copy'));
  });
});

describe('tab actions', () => {
  it('shows the applies badge, Replay (calls meta.replay) and Reload only without replay', () => {
    const replay = vi.fn();
    rig('a', { x: 1 }, { applies: 'replay', replay });
    rig('b', { x: 1 }, { applies: 'reload' });
    rig('c', { x: 1 }, { applies: 'reload', replay });
    open('a');
    expect($('.applies')!.textContent).toBe('on next play');
    act('replay').click();
    expect(replay).toHaveBeenCalledTimes(1);
    expect($('[data-act="reload"]')).toBeNull();
    open('b');
    expect($('.applies')!.textContent).toBe('after reload');
    expect($('[data-act="reload"]')).not.toBeNull();
    open('c');
    expect($('[data-act="reload"]')).toBeNull();
  });

  it('Locate scrolls to the first target and rings up to 24 matches for 1.6 s', () => {
    vi.useFakeTimers();
    const els = Array.from({ length: 30 }, () => document.body.appendChild(document.createElement('div')));
    els.forEach((el) => el.classList.add('hero-el'));
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
    rig('a', { x: 1 }, { target: '.hero-el' });
    open('a');
    act('locate').click();
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll.mock.contexts[0]).toBe(els[0]);
    expect($$('.locate')).toHaveLength(24);
    vi.advanceTimersByTime(1700);
    expect($$('.locate')).toHaveLength(0);
  });

  it('Locate says so when nothing matches (or the selector is invalid)', () => {
    rig('a', { x: 1 }, { target: '.nothing-here' });
    rig('b', { x: 1 }, { target: '[[bad' });
    open('a');
    act('locate').click();
    expect(toast()).toBe('Nothing on this page matches the rig’s target');
    open('b');
    act('locate').click();
    expect(toast()).toBe('Nothing on this page matches the rig’s target');
  });
});
