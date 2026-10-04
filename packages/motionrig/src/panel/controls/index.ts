import type { Control, ControlType, Leaf } from '../../core/types';
import { color } from './color';
import { ease } from './ease';
import { number } from './number';
import { select } from './select';
import { text } from './text';
import { toggle } from './toggle';

/** A control's DOM: `head` sits on the label's line, `wide` spans the row below it. */
export interface View {
  head?: Node;
  wide?: Node;
  /** Shows `v`; must be idempotent (rows call it again after their own writes). */
  set(v: Leaf): void;
}

export type Make = (c: Control, write: (v: Leaf) => void, def: Leaf) => View;

export const controls: Record<ControlType, Make> = { number, toggle, select, ease, color, text };
