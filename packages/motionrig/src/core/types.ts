import type { Key as MessageKey } from '../panel/i18n';

export type { MessageKey };

export type Leaf = number | string | boolean;
export interface RigValues {
  [key: string]: Leaf | RigValues;
}
export type Bezier = [number, number, number, number];
export type Applies = 'live' | 'replay' | 'reload';
export type ControlType = 'number' | 'toggle' | 'select' | 'ease' | 'color' | 'text';
export type Option = string | number | { label: string; value: string | number };
export type Flavour = 'gsap' | 'css';

export interface ControlMeta {
  type?: ControlType;
  label?: string;
  hint?: string;
  group?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: Option[];
  flavour?: Flavour;
}

export interface RigMeta<T> {
  title?: string;
  note?: string;
  applies?: Applies;
  replay?: () => void;
  onChange?: (values: T) => void;
  css?: boolean | { prefix?: string };
  target?: string;
  /** Key = dotted path; `false` hides it. An object path may carry `{ label, hint }`. */
  controls?: Record<string, ControlMeta | false>;
}

export interface EaseDef {
  bezier: Bezier;
  code?: string;
  label?: string;
}

export interface RigConfig {
  param?: string;
  enabled?: boolean;
  storageKey?: string;
  locale?: 'en' | 'ru';
  /** Single panel strings, by key, over the `locale`'s. */
  messages?: Partial<Record<MessageKey, string>>;
  eases?: Record<string, Bezier | EaseDef>;
  hotkey?: string | false;
  /** Tab order: these ids first, in this order; the rest in registration order. */
  order?: string[];
  /** Panel colours; `'auto'` follows the OS (`prefers-color-scheme`) live. Default `'dark'`. */
  theme?: 'dark' | 'light' | 'auto';
}

export interface Control {
  path: string;
  key: string;
  type: ControlType;
  label: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { label: string; value: string | number }[];
  flavour?: Flavour;
}

export interface Group {
  id: string;
  label?: string;
  hint?: string;
  controls: Control[];
}

export interface Entry {
  id: string;
  values: object;
  meta: RigMeta<any>;
  /** Bumped on every change, so `snapshot()` is fresh synchronously. */
  version: number;
  defaults?: object;
  controls?: Group[];
  controlMap?: Map<string, Control>;
  snap?: object;
  snapVersion?: number;
}

/** id → dotted path → value */
export type Table<V = Leaf> = Record<string, Record<string, V>>;

export interface UiState {
  open?: boolean;
  tab?: string;
  ring?: { x: number; y: number };
  panel?: { x: number; y: number };
  seen?: string[];
  /** The tab strip shows every tab instead of two rows and "+N". */
  allTabs?: boolean;
}

export interface Stored {
  v: 1;
  overrides: Table;
  baseline: Table;
  /** `UiState` once the panel has checked it (`panel/ui.ts`). */
  ui: Record<string, unknown>;
}

export interface SharePayload {
  v: 1;
  o: Table;
  b: Table;
  c?: Table<string>;
  css?: Table<string>;
}
