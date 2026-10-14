---
title: configure()
description: "Page-wide options: turning the panel on, the URL parameter, hotkey, theme, named eases, tab order, storage key, language and panel strings."
---

```ts
function configure(options: RigConfig): void;
```

Page-wide options. Call it **before any rig module runs**: in Next.js, in `instrumentation-client.ts`; elsewhere, in a module you import first. Later calls merge in.

```ts instrumentation-client.ts
import { configure } from 'motionrig';
import { EASES } from './motion/eases';

configure({
  enabled: process.env.NODE_ENV === 'development' || undefined,
  eases: EASES,
  theme: 'auto',
});
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | | `true`: on for everyone. `false`: off, `?rig` ignored. `undefined`: `?rig` decides. |
| `param` | `string` | `'rig'` | The URL parameter for the panel and share links. |
| `hotkey` | `string \| false` | `'alt+r'` | Toggles the panel. `false` disables it. |
| `theme` | `'dark' \| 'light' \| 'auto'` | `'dark'` | `'auto'` follows the system. |
| `eases` | `Record<string, Bezier \| EaseDef>` | | Your named curves. [Eases](/docs/eases) |
| `order` | `string[]` | | Rig ids to list first in the tabs. |
| `storageKey` | `string` | `'motionrig'` | The `localStorage` key. |
| `locale` | `'en' \| 'ru'` | `'en'` | The panel's language. |
| `messages` | `Partial<Record<MessageKey, string>>` | | Overrides panel strings. [Messages](#messages) |

> [!TIP]
> For "on in development", pass `undefined`, not `false`, elsewhere: `false` also switches off `?rig` in production.

## Hotkey

Modifiers and one key, joined by `+`: `alt`/`option`, `ctrl`, `shift`, `meta`/`cmd`, then a letter, digit or key name like `backquote` or `f2`. For example `'ctrl+shift+m'`. Keys match by position, so it works on any layout.

## Theme

Try it: the real panel restyles in place.

<!-- demo:theme -->

## Messages

Override any panel string by key: `{ copyCode: 'Copy' }`. `{n}` and `{m}` are counts; `tweaks` and `rigs` take plural forms split by `|`, like `'tweak|tweaks'` or `'правка|правки|правок'`.

The keys: {{messageKeys}}.
