import { beforeEach, describe, expect, it } from 'vitest';
import { configure, rig } from '../index';
import { $, clean, host, key } from '../test/panel';
import { mount, open } from './index';

const isOpen = (): boolean => host()!.hasAttribute('open');
beforeEach(() => {
  clean();
});

describe('hotkey', () => {
  it('alt+r toggles the panel, matched on event.code', () => {
    configure({ enabled: true });
    rig('a', { x: 1 });
    mount();
    key(window, { code: 'KeyR', key: '®', altKey: true });
    expect(isOpen()).toBe(true);
    key(window, { code: 'KeyR', key: '®', altKey: true });
    expect(isOpen()).toBe(false);
    key(window, { code: 'KeyR', key: 'r' });
    key(window, { code: 'KeyR', key: 'R', altKey: true, shiftKey: true });
    expect(isOpen()).toBe(false);
  });

  it('is ignored while focus is in an editable field', () => {
    configure({ enabled: true });
    mount();
    const input = document.body.appendChild(document.createElement('input'));
    key(input, { code: 'KeyR', altKey: true });
    const editable = document.body.appendChild(document.createElement('div'));
    editable.contentEditable = 'true';
    key(editable, { code: 'KeyR', altKey: true });
    expect(isOpen()).toBe(false);
    open();
    key($('.search input')!, { code: 'KeyR', altKey: true });
    expect(isOpen()).toBe(true);
  });

  it('survives keydown events without a code, and range / checkbox focus does not block it', () => {
    configure({ enabled: true });
    rig('a', { x: 1 });
    mount();
    expect(() => window.dispatchEvent(new Event('keydown'))).not.toThrow();
    const range = Object.assign(document.createElement('input'), { type: 'range' });
    document.body.append(range);
    key(range, { code: 'KeyR', altKey: true });
    expect(isOpen()).toBe(true);
    key($('input[type="range"]')!, { code: 'KeyR', altKey: true });
    expect(isOpen()).toBe(false);
  });

  it('follows config.hotkey; false turns it off', () => {
    configure({ enabled: true, hotkey: 'ctrl+shift+2' });
    mount();
    key(window, { code: 'Digit2', ctrlKey: true, shiftKey: true });
    expect(isOpen()).toBe(true);
    configure({ hotkey: false });
    key(window, { code: 'Digit2', ctrlKey: true, shiftKey: true });
    key(window, { code: 'KeyR', altKey: true });
    expect(isOpen()).toBe(true);
  });

  it('opening moves focus into the panel; a panel restored open on load does not take focus', () => {
    configure({ enabled: true });
    mount();
    $('.ring')!.click();
    expect(host()!.shadowRoot!.activeElement).toBe($('.panel'));
    host()!.remove();
    (document.activeElement as HTMLElement | null)?.blur();
    mount();
    expect(isOpen()).toBe(true);
    expect(host()!.shadowRoot!.activeElement).toBeNull();
  });

  it('Escape inside the panel collapses it and gives focus back to the ring', () => {
    configure({ enabled: true });
    open();
    const search = $<HTMLInputElement>('.search input')!;
    search.focus();
    key(search, { key: 'Escape' });
    expect(isOpen()).toBe(false);
    expect(host()!.shadowRoot!.activeElement).toBe($('.ring'));
  });
});
