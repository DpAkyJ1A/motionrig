import { beforeEach, describe, expect, it } from 'vitest';
import { configure, rig } from '../index';
import { $, clean } from '../test/panel';
import { css } from './styles';
import { open } from './index';

beforeEach(() => {
  clean();
  configure({ enabled: true });
});

describe('toast placement', () => {
  it('sits in the footer and is positioned from its top, so a wrapped footer never hides it', () => {
    rig('a', { x: 1 });
    open('a');
    expect($('.toast')!.parentElement).toBe($('.foot'));
    expect(css).toMatch(/\.foot\{[^}]*position:relative/);
    expect(css).toMatch(/\.toast\{[^}]*bottom:calc\(100% \+ 8px\)/);
    expect(css).not.toMatch(/\.toast\{[^}]*bottom:(56px|calc\(56px)/);
  });
});
