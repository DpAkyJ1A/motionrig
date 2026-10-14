---
title: rig()
description: "Registers a constants object with the panel: its parameters, every meta option, and how it behaves on the server and without ?rig."
---

```ts
function rig<T extends object>(id: string, values: T, meta?: RigMeta<T>): T;
```

Registers `values` with the panel and returns **the same object**. Edits change it in place, nested objects included.

```ts motion/hero.ts
import { rig } from 'motionrig';

export const HERO = rig('hero', { duration: 0.6, ease: 'power2.out', y: 24 }, {
  title: 'Hero headline',
  note: 'The headline at the top. Press Replay to see an edit.',
  applies: 'replay',
  replay: () => playHero(),
  target: '[data-rig~="hero"]',
  controls: { duration: { unit: 's', min: 0.1, max: 2 } },
});
```

## Parameters

| Parameter | Type | Description |
|---|---|---|
| `id` | `string` | Unique and stable: share links and the CLI find the rig by it. |
| `values` | `T` | A plain object. Numbers, strings and booleans get [controls](/docs/controls). |
| `meta` | `RigMeta<T>` | Optional, below. |

## Meta

| Option | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | the id | The tab's title. |
| `note` | `string` | | A hint for the designer. |
| `applies` | `'live' \| 'replay' \| 'reload'` | `'live'` | When an edit shows: the tab's badge. [Live updates](/docs/live-updates) |
| `replay` | `() => void` | | Adds a ▶ Replay button. |
| `onChange` | `(values: T) => void` | | Runs once per batch of edits. Rebuild timelines here. |
| `target` | `string` | | Selector of the animated element, for **Locate**; the panel avoids covering it. |
| `css` | `boolean \| { prefix?: string }` | `false` | Writes values to custom properties. [CSS variables](/docs/css-variables) |
| `controls` | `Record<string, ControlMeta \| false>` | | Options per dotted path; `false` hides. [Controls](/docs/controls) |

## Behaviour

- **On the server** it returns `values` untouched, so Server Components can import rig modules.
- **Without `?rig`** it only notes the object: no storage, no DOM, no panel download.
- **Under HMR** the new object takes over the id with its tweaks, so tuning survives a hot reload.
- **Ids are unique**: a second object under the same id replaces the first.
