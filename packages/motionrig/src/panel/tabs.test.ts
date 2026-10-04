import { beforeEach, describe, expect, it } from 'vitest';
import { configure, rig } from '../index';
import { setValue } from '../core/registry';
import { ui } from './ui';
import { flush } from '../core/storage';
import { $, $$, clean, edit, tick } from '../test/panel';
import { open } from './index';

const chips = (): string[] => $$('.chip:not([hidden])').map((c) => c.dataset.id!);
const active = (): string | undefined => $('.chip[aria-pressed="true"]')?.dataset.id;

beforeEach(() => {
  clean();
});

describe('tabs', () => {
  it('first mount marks every registered rig as seen, so nothing shows "new"', () => {
    configure({ enabled: true });
    rig('a', { x: 1 });
    rig('b', { y: 2 }, { title: 'Bee' });
    open();
    expect(chips()).toEqual(['a', 'b']);
    expect($('.chip[data-id="b"]')!.textContent).toContain('Bee');
    expect(ui().seen).toEqual(['a', 'b']);
    expect($$('.chip .new')).toHaveLength(0);
  });

  it('lists unseen rigs first with a "new" badge; opening one marks it seen', () => {
    localStorage.setItem('motionrig', JSON.stringify({ v: 1, overrides: {}, baseline: {}, ui: { seen: ['a'] } }));
    configure({ enabled: true });
    rig('a', { x: 1 });
    rig('b', { y: 2 });
    open('a');
    expect(chips()).toEqual(['b', 'a']);
    expect($('.chip[data-id="b"] .new')).not.toBeNull();
    $('.chip[data-id="b"]')!.click();
    expect(active()).toBe('b');
    expect($('.chip[data-id="b"] .new')).toBeNull();
    expect(ui().seen).toEqual(['a', 'b']);
  });

  it('marks rigs that have overrides and counts them on the ring', async () => {
    configure({ enabled: true });
    rig('a', { x: 1, y: 1 });
    rig('b', { z: 1 });
    open('a');
    expect($('.chip[data-id="b"] .dot')!.hidden).toBe(true);
    setValue('b', 'z', 3);
    setValue('a', 'x', 2);
    await tick();
    expect($('.chip[data-id="b"] .dot')!.hidden).toBe(false);
    expect($('.chip[data-id="a"] .dot')!.hidden).toBe(false);
    expect($('.badge')!.textContent).toBe('2');
  });

  it('adds a chip for a rig registered while the panel is open', async () => {
    configure({ enabled: true });
    rig('a', { x: 1 });
    open('a');
    rig('late', { y: 1 });
    await tick();
    expect(chips()).toEqual(['a', 'late']);
    expect($('.chip[data-id="late"] .new')).not.toBeNull();
  });

  it('search filters by title, id, note and control keys or labels', () => {
    configure({ enabled: true });
    rig('hero', { duration: 1 }, { title: 'Hero reveal' });
    rig('faq', { stagger: 0.1 }, { note: 'Open any question' });
    rig('grid', { cols: 12 }, { controls: { cols: { label: 'Columns' } } });
    open();
    const search = $<HTMLInputElement>('.search input')!;
    edit(search, 'REVEAL');
    expect(chips()).toEqual(['hero']);
    edit(search, 'question');
    expect(chips()).toEqual(['faq']);
    edit(search, 'stagger');
    expect(chips()).toEqual(['faq']);
    edit(search, 'columns');
    expect(chips()).toEqual(['grid']);
    edit(search, 'zzz');
    expect(chips()).toEqual([]);
    expect($('.tabs')!.textContent).toContain('No rigs match');
    edit(search, '');
    expect(chips()).toEqual(['hero', 'faq', 'grid']);
  });

  it('the tab heading shows the title, plus the rig id when the title differs', () => {
    configure({ enabled: true });
    rig('a', { x: 1 });
    rig('b', { y: 2 }, { title: 'Bee' });
    open('a');
    expect($('.tab-title h2')!.textContent).toBe('a');
    expect($('.tab-id')).toBeNull();
    open('b');
    expect($('.tab-title h2')!.textContent).toBe('Bee');
    expect($('.tab-id')!.textContent).toBe('b');
  });

  it('an empty title counts as none: chip, heading and footer show the id', () => {
    configure({ enabled: true });
    rig('hero', { x: 1 }, { title: '' });
    open('hero');
    expect($('.chip[data-id="hero"] .title')!.textContent).toBe('hero');
    expect($('.tab-title h2')!.textContent).toBe('hero');
    expect($('.tab-id')).toBeNull();
    expect($('[data-act="copy"]')!.getAttribute('aria-label')).toBe('Copy code · hero');
  });

  it('shows an empty state with a code hint when nothing is rigged', () => {
    configure({ enabled: true });
    open();
    expect($('.body')!.textContent).toContain('Nothing rigged on this page yet');
    expect($('.body pre')!.textContent).toContain("rig('");
    // No tab: its actions go away; Reset all stays (other pages may hold overrides).
    expect($('[data-act="copy"]')!.hidden).toBe(true);
    expect($('[data-act="reset-tab"]')!.hidden).toBe(true);
    expect($('[data-act="reset-all"]')!.hidden).toBe(false);
  });

  it('"mark seen" shows only with unseen tabs, clears every badge in place, persists, and then goes away', () => {
    localStorage.setItem('motionrig', JSON.stringify({ v: 1, overrides: {}, baseline: {}, ui: { seen: ['a'] } }));
    configure({ enabled: true });
    rig('a', { x: 1 });
    rig('b', { y: 2 });
    rig('c', { z: 3 });
    open('a');
    const btn = $<HTMLButtonElement>('[data-act="seen-all"]')!;
    expect([btn.hidden, btn.textContent, btn.getAttribute('aria-label'), btn.title])
      .toEqual([false, '✓ 2 new', 'Mark 2 new tabs as seen', 'Mark 2 new tabs as seen']);
    const chipEls = $$('.chip');
    btn.click();
    expect($$('.chip .new')).toHaveLength(0);
    expect($$('.chip')).toEqual(chipEls);
    expect(btn.hidden).toBe(true);
    expect(ui().seen).toEqual(['a', 'b', 'c']);
    flush();
    expect(JSON.parse(localStorage.getItem('motionrig')!).ui.seen).toEqual(['a', 'b', 'c']);
  });

  it('"mark seen" is hidden when nothing is new, appears for a rig registered later, and speaks Russian', async () => {
    configure({ enabled: true, locale: 'ru' });
    rig('a', { x: 1 });
    open('a');
    const btn = $<HTMLButtonElement>('[data-act="seen-all"]')!;
    expect(btn.hidden).toBe(true);
    rig('late', { y: 1 });
    await tick();
    expect([btn.hidden, btn.textContent, btn.getAttribute('aria-label')])
      .toEqual([false, '✓ новых: 1', 'Отметить новые вкладки просмотренными (1)']);
  });
});
