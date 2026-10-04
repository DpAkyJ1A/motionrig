import { beforeEach, describe, expect, it } from 'vitest';
import { configure, rig } from '../index';
import { $$, clean } from '../test/panel';
import { open } from './index';
import { tabOrder } from './tabs';

const chips = (): string[] => $$('.chip:not([hidden])').map((c) => c.dataset.id!);

beforeEach(clean);

const rows = (): string[] => $$('.row').map((r) => r.dataset.path!);

describe('control order (§5)', () => {
  it('rows follow meta.controls, then the rest in key order; groups by their first row', () => {
    rig('hero', { duration: 1, enter: { rows: 12, stagger: 0.05 }, ease: 'power2.out' }, {
      controls: { ease: {}, 'enter.stagger': {} },
    });
    configure({ enabled: true });
    open('hero');
    expect(rows()).toEqual(['ease', 'duration', 'enter.stagger', 'enter.rows']);
  });
});

describe('tab order (§10.3, config.order)', () => {
  it('listed ids first, in that order; unlisted keep registration order', () => {
    expect(tabOrder(['a', 'b', 'c', 'd'], ['a', 'b', 'c', 'd'], ['c', 'a'])).toEqual(['c', 'a', 'b', 'd']);
  });

  it('"new" tabs still lead, each part keeping the rule above', () => {
    expect(tabOrder(['a', 'b', 'c', 'd'], ['a', 'c'], ['c', 'd', 'a'])).toEqual(['d', 'b', 'c', 'a']);
  });

  it('ignores listed ids that are not registered; no order ⇒ registration order', () => {
    expect(tabOrder(['a', 'b'], ['a', 'b'], ['zz', 'b'])).toEqual(['b', 'a']);
    expect(tabOrder(['a', 'b'], ['a', 'b'])).toEqual(['a', 'b']);
  });

  it('the panel lays out its chips by config.order', () => {
    configure({ enabled: true, order: ['grid', 'hero'] });
    rig('hero', { x: 1 });
    rig('faq', { x: 1 });
    rig('grid', { x: 1 });
    open();
    expect(chips()).toEqual(['grid', 'hero', 'faq']);
  });
});
