import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configure, rig } from '../index';
import { $, clean, clipboardMock, tick } from '../test/panel';
import { open } from './index';

const act = (name: string): HTMLButtonElement => $<HTMLButtonElement>(`[data-act="${name}"]`)!;
const active = (): Element | null => document.querySelector('motionrig-panel')!.shadowRoot!.activeElement;

beforeEach(() => {
  clean();
  configure({ enabled: true });
  clipboardMock(async () => {
    throw new Error('insecure context');
  });
});

afterEach(() => {
  delete (document as { execCommand?: unknown }).execCommand;
});

describe('clipboard focus fallback (Safari does not focus a clicked button)', () => {
  it('after the hidden-textarea copy, focus lands on the panel when nothing was focused', async () => {
    (document as { execCommand?: unknown }).execCommand = vi.fn(() => true);
    rig('a', { x: 1 });
    open('a');
    (active() as HTMLElement | null)?.blur();
    expect(active()).toBeNull();
    act('copy').click();
    await tick();
    expect(active()).toBe($('.panel'));
  });

  it('closing the manual dialog puts focus on the panel when nothing was focused', async () => {
    rig('a', { x: 1 });
    open('a');
    (active() as HTMLElement | null)?.blur();
    act('copy').click();
    await tick();
    act('close').click();
    expect($('.modal')).toBeNull();
    expect(active()).toBe($('.panel'));
  });
});
