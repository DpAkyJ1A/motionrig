import { resetForTests } from './reset';

/** Test-only helpers for the panel's shadow DOM. */

export const host = (): HTMLElement | null => document.querySelector('motionrig-panel');

export const root = (): ShadowRoot => host()!.shadowRoot!;

export const $ = <E extends Element = HTMLElement>(sel: string): E | null => root().querySelector<E>(sel);

export const $$ = <E extends Element = HTMLElement>(sel: string): E[] => [...root().querySelectorAll<E>(sel)];

export const row = (path: string): HTMLElement => $(`.row[data-path="${path}"]`)!;

/** Lets notifications (microtasks) and zero-delay timers run. */
export const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

export function fire(el: Element, type: string, init: EventInit = {}): void {
  el.dispatchEvent(new Event(type, { bubbles: true, composed: true, ...init }));
}

/** Sets a form field's value and dispatches `type` (`input` or `change`). */
export function edit(el: HTMLInputElement | HTMLSelectElement, value: string, type = 'input'): void {
  el.value = value;
  fire(el, type);
}

export function key(target: EventTarget, init: KeyboardEventInit): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, composed: true, cancelable: true, ...init }));
}

export function pointer(el: Element, type: string, x: number, y: number, pointerId = 1): void {
  el.dispatchEvent(new PointerEvent(type, { bubbles: true, composed: true, clientX: x, clientY: y, pointerId, button: 0 }));
}

/** Detaches the panel first (its teardown still reaches the old state), then forgets everything. */
export function clean(): void {
  document.body.replaceChildren();
  resetForTests();
}

export function clipboardMock(impl: (text: string) => Promise<void> = async () => {}): { writeText: (text: string) => Promise<void> } {
  const clip = { writeText: impl };
  Object.defineProperty(navigator, 'clipboard', { value: clip, configurable: true });
  return clip;
}
