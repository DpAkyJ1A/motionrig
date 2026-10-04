import { beforeEach, describe, expect, it } from 'vitest';
import { isEnabled } from './gate';
import { configure, rig, setValue } from './registry';
import { decodeShare, encodeShare } from './payload';
import { buildShare, shareUrl } from './share';
import { resetForTests } from '../test/reset';
import { store } from './storage';

const EASES = { revealEase: { bezier: [0.16, 1, 0.3, 1] as [number, number, number, number], code: 'EASE_REVEAL' } };

beforeEach(() => {
  resetForTests();
  configure({ enabled: true, eases: EASES });
});

describe('buildShare', () => {
  it('includes stored overrides of all ids with their baselines, registered here or not', () => {
    store().overrides.elsewhere = { x: 2 };
    store().baseline.elsewhere = { x: 1 };
    rig('hero', { duration: 1, title: 'Hi' });
    setValue('hero', 'title', 'Привет ✓');
    expect(buildShare()).toEqual({
      v: 1,
      o: { elsewhere: { x: 2 }, hero: { title: 'Привет ✓' } },
      b: { elsewhere: { x: 1 }, hero: { title: 'Hi' } },
    });
  });

  it('fills `c` with source text for palette eases that have code', () => {
    rig('hero', { ease: 'power2.out', label: 'x' }, { controls: { label: { type: 'text' } } });
    setValue('hero', 'ease', 'revealEase');
    setValue('hero', 'label', 'revealEase');
    expect(buildShare().c).toEqual({ hero: { ease: 'EASE_REVEAL' } });
  });

  it('fills `css` for css rigs: variable name → css value text', () => {
    rig('faq', { duration: 0.7, ease: 'ease' }, { css: true, controls: { duration: { unit: 's' } } });
    setValue('faq', 'duration', 0.9);
    setValue('faq', 'ease', 'ease-out');
    expect(buildShare().css).toEqual({ faq: { '--duration': '0.9s', '--ease': 'ease-out' } });
  });

  it('leaves unsafe css text out of `css` (it still travels in `o`)', () => {
    rig('faq', { ease: 'ease', gap: 'normal' }, { css: true });
    setValue('faq', 'ease', 'ease-out');
    setValue('faq', 'gap', 'calc(1px');
    expect(buildShare().css).toEqual({ faq: { '--ease': 'ease-out' } });
    expect(buildShare().o.faq).toEqual({ ease: 'ease-out', gap: 'calc(1px' });
  });

  it('leaves `c` and `css` out when there is nothing to put in them', () => {
    rig('hero', { duration: 1 });
    setValue('hero', 'duration', 2);
    expect(buildShare()).not.toHaveProperty('c');
    expect(buildShare()).not.toHaveProperty('css');
  });
});

describe('shareUrl', () => {
  it('is the current URL with ?<param>=<payload>, other params and hash kept', () => {
    history.replaceState(null, '', '/work?rig&x=1#case');
    rig('hero', { duration: 1 });
    setValue('hero', 'duration', 2);
    const url = new URL(shareUrl());
    expect(url.pathname).toBe('/work');
    expect(url.hash).toBe('#case');
    expect(url.searchParams.get('x')).toBe('1');
    expect(decodeShare(url.searchParams.get('rig')!)).toEqual(buildShare());
  });

  it('round-trips into a fresh page through the gate', async () => {
    configure({ param: 'tune' });
    rig('hero', { duration: 1, title: 'Hi' });
    setValue('hero', 'title', 'Ünïcødé — 你好');
    const url = new URL(shareUrl());

    resetForTests();
    history.replaceState(null, '', url.pathname + url.search + url.hash);
    configure({ param: 'tune' });
    expect(isEnabled()).toBe(true);
    const v = rig('hero', { duration: 1, title: 'Hi' });
    await new Promise<void>((r) => setTimeout(r, 0));
    expect(v.title).toBe('Ünïcødé — 你好');
    expect(location.search).toBe('?tune');
  });

  it('decodeShare rejects what encodeShare did not make', () => {
    expect(decodeShare(encodeShare(buildShare()))).toEqual({ v: 1, o: {}, b: {} });
    expect(decodeShare('not-a-payload')).toBeUndefined();
  });
});
