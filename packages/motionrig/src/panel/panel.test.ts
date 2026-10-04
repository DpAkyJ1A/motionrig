import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configure, rig } from '../index';
import { setValue } from '../core/registry';
import { flush } from '../core/storage';
import { ui } from './ui';
import { $, clean, fire, host, row, tick } from '../test/panel';
import { mount, open } from './index';

const active = (): string | undefined => $('.chip[aria-pressed="true"]')?.dataset.id;
const isOpen = (): boolean => host()!.hasAttribute('open');

beforeEach(() => {
  clean();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('mount', () => {
  it('does nothing while the gate is closed', () => {
    rig('a', { x: 1 });
    mount();
    open('a');
    expect(host()).toBeNull();
  });

  it('is idempotent and renders into an open shadow root', () => {
    configure({ enabled: true });
    mount();
    mount();
    expect(document.querySelectorAll('motionrig-panel')).toHaveLength(1);
    expect(host()!.shadowRoot).toBeInstanceOf(ShadowRoot);
    expect($('.ring')).not.toBeNull();
    expect(isOpen()).toBe(false);
  });

  it('a tap on the ring opens the panel; Collapse closes it', () => {
    configure({ enabled: true });
    rig('a', { x: 1 });
    mount();
    $('.ring')!.click();
    expect(isOpen()).toBe(true);
    expect(ui().open).toBe(true);
    $('[data-act="collapse"]')!.click();
    expect(isOpen()).toBe(false);
    expect(ui().open).toBe(false);
  });

  it('keeps the scroll container away from smooth-scroll libraries', () => {
    configure({ enabled: true });
    mount();
    const body = $('.body')!;
    expect(body.hasAttribute('data-lenis-prevent')).toBe(true);
    expect(body.hasAttribute('data-scroll-prevent')).toBe(true);
    let reached = false;
    window.addEventListener('wheel', () => (reached = true), { once: true });
    fire(body, 'wheel');
    expect(reached).toBe(false);
  });

  it('hides itself once the gate closes', async () => {
    configure({ enabled: true });
    rig('a', { x: 1 });
    open('a');
    setValue('a', 'x', 2);
    configure({ enabled: false });
    await tick();
    expect(host()!.hidden).toBe(true);
  });
});

describe('gate and teardown', () => {
  it('hides once the gate closes even when no value changes, and shows again when it reopens', async () => {
    configure({ enabled: true });
    rig('a', { x: 1 });
    open('a');
    configure({ enabled: false });
    await tick();
    expect(host()!.hidden).toBe(true);
    configure({ enabled: true });
    await tick();
    expect(host()!.hidden).toBe(false);
  });

  it('drops the tab DOM once collapsed (preview animations stop) and on removal', () => {
    vi.useFakeTimers();
    configure({ enabled: true });
    rig('a', { x: 1 });
    open('a');
    const body = $('.body')!;
    $('[data-act="collapse"]')!.click();
    vi.advanceTimersByTime(200);
    expect(body.childElementCount).toBe(0);
    open('a');
    expect(row('x')).not.toBeNull();
    host()!.remove();
    expect(body.childElementCount).toBe(0);
  });

  it('never writes a style attribute (CSP without unsafe-inline): positions and vars go through CSSOM', () => {
    // happy-dom's CSSOM itself mirrors into the attribute; only writes outside CSSOM count.
    const { setProperty } = CSSStyleDeclaration.prototype;
    const { setAttribute } = Element.prototype;
    let cssom = 0;
    const raw: string[] = [];
    vi.spyOn(CSSStyleDeclaration.prototype, 'setProperty').mockImplementation(function (this: CSSStyleDeclaration, ...args) {
      cssom++;
      try {
        return setProperty.apply(this, args);
      } finally {
        cssom--;
      }
    });
    vi.spyOn(Element.prototype, 'setAttribute').mockImplementation(function (this: Element, name: string, value: string) {
      if (name === 'style' && !cssom) raw.push(value);
      return setAttribute.call(this, name, value);
    });
    configure({ enabled: true });
    rig('a', { x: 1, ease: '0.1,0.2,0.3,1', tint: '#fff' });
    open('a');
    expect(raw).toEqual([]);
    expect(row('x').querySelector<HTMLElement>('.slide')!.style.getPropertyValue('--d')).toBe('0.3333333333333333');
  });
});

describe('open(id)', () => {
  it('mounts and opens on that tab', () => {
    configure({ enabled: true });
    rig('a', { x: 1 });
    rig('b', { y: 2 });
    open('b');
    expect(isOpen()).toBe(true);
    expect(active()).toBe('b');
    expect(row('y')).not.toBeNull();
    expect(ui().tab).toBe('b');
  });

  it('without an id (or an unknown one) reopens the last tab', () => {
    configure({ enabled: true });
    rig('a', { x: 1 });
    rig('b', { y: 2 });
    open('b');
    $('[data-act="collapse"]')!.click();
    open();
    expect(active()).toBe('b');
    open('nope');
    expect(active()).toBe('b');
  });
});

describe('ui state', () => {
  it('persists open and tab, and reopens on the stored tab after a remount', () => {
    configure({ enabled: true });
    rig('a', { x: 1 });
    rig('b', { y: 2 });
    open('b');
    flush();
    const saved = JSON.parse(localStorage.getItem('motionrig')!);
    expect(saved.ui).toMatchObject({ open: true, tab: 'b', seen: ['a', 'b'] });
    host()!.remove();
    mount();
    expect(isOpen()).toBe(true);
    expect(active()).toBe('b');
  });
});
