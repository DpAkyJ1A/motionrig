import { describe, expect, it } from 'vitest';
import { editable, matches } from './hotkey';

const ev = (init: KeyboardEventInit): KeyboardEvent => new KeyboardEvent('keydown', init);

describe('hotkey matching', () => {
  it('reads letters, digits and named codes, case-insensitively', () => {
    expect(matches(ev({ code: 'KeyR', altKey: true }), 'Alt+R')).toBe(true);
    expect(matches(ev({ code: 'Digit2', ctrlKey: true }), 'ctrl+2')).toBe(true);
    expect(matches(ev({ code: 'F2' }), 'f2')).toBe(true);
    expect(matches(ev({ code: 'KeyK', metaKey: true }), 'cmd+k')).toBe(true);
    expect(matches(ev({ code: 'KeyR', altKey: true }), 'option+r')).toBe(true);
  });

  it('needs exactly the listed modifiers', () => {
    expect(matches(ev({ code: 'KeyR' }), 'alt+r')).toBe(false);
    expect(matches(ev({ code: 'KeyR', altKey: true, metaKey: true }), 'alt+r')).toBe(false);
  });

  it('never matches a hotkey with an unknown modifier (a typo must not bind a bare key)', () => {
    expect(matches(ev({ code: 'KeyR' }), 'altt+r')).toBe(false);
    expect(matches(ev({ code: 'KeyR', altKey: true }), 'altt+r')).toBe(false);
  });

  it('ignores keydown events without a code (autofill) and auto-repeat', () => {
    expect(matches(new Event('keydown') as KeyboardEvent, 'alt+r')).toBe(false);
    expect(matches(ev({ code: 'KeyR', altKey: true, repeat: true }), 'alt+r')).toBe(false);
  });
});

describe('editable targets', () => {
  const from = (el: HTMLElement): Event => {
    document.body.append(el);
    let seen!: Event;
    el.addEventListener('keydown', (e) => (seen = e), { once: true });
    el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, composed: true }));
    el.remove();
    return seen;
  };
  const input = (type: string): HTMLInputElement => Object.assign(document.createElement('input'), { type });

  it('text-like inputs, textarea and contenteditable are editable', () => {
    for (const type of ['text', 'search', 'number', 'email', 'url', 'tel', 'password']) expect(editable(from(input(type)))).toBe(true);
    expect(editable(from(document.createElement('textarea')))).toBe(true);
    const div = document.createElement('div');
    div.contentEditable = 'true';
    expect(editable(from(div))).toBe(true);
  });

  it('range, colour, checkbox and select do not block the hotkey', () => {
    for (const type of ['range', 'color', 'checkbox']) expect(editable(from(input(type)))).toBe(false);
    expect(editable(from(document.createElement('select')))).toBe(false);
  });
});
