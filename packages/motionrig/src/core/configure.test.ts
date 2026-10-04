import { beforeEach, describe, expect, it } from 'vitest';
import { configure, onRegistryChange, rig } from './registry';
import { isEnabled } from './gate';
import { resetForTests } from '../test/reset';

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  resetForTests();
});

describe('configure() and registry listeners', () => {
  it('notifies registry listeners when the gate flips, even when no value changes', async () => {
    configure({ enabled: true });
    rig('a', { x: 1 });
    await tick();
    let calls = 0;
    onRegistryChange(() => calls++);
    configure({ enabled: false });
    await tick();
    expect(isEnabled()).toBe(false);
    expect(calls).toBe(1);
    configure({ enabled: true });
    await tick();
    expect(calls).toBe(2);
  });

  it('stays quiet when the gate does not flip', async () => {
    configure({ enabled: true });
    await tick();
    let calls = 0;
    onRegistryChange(() => calls++);
    configure({ locale: 'ru' });
    await tick();
    expect(calls).toBe(0);
  });
});
