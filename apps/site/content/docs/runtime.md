---
title: Low-level API
description: "mountPanel, openPanel, isEnabled, subscribe, snapshot and defaultsOf: for your own Tune button, or for frameworks other than React."
---

What `RigPanel` and `useRig` are built on. Use them for your own "Tune" button, or to bind rigs to Vue, Svelte or anything else.

## Panel

| Function | Returns | Description |
|---|---|---|
| `mountPanel(options?)` | `Promise<void>` | Runs `options.preload`, then mounts the panel. No-op without `?rig`; only the first call counts. |
| `openPanel(id?)` | `Promise<void>` | Mounts if needed and opens rig `id`, or the last tab. |
| `isEnabled()` | `boolean` | Whether the panel is on for this page. |

```ts tune-button.ts
import { isEnabled, mountPanel, openPanel } from 'motionrig';

mountPanel({ preload: () => import('./rigs') });

button.hidden = !isEnabled();
button.onclick = () => openPanel('hero');
```

`openPanel` mounts without `preload`, so mount first with `mountPanel` or `<RigPanel>`.

## Store

| Function | Returns | Description |
|---|---|---|
| `subscribe(values, listener)` | `() => void` | Calls `listener` once per batch of edits. Returns unsubscribe. |
| `snapshot(values)` | `T` | An immutable copy, stable until the next edit. What `useRig` returns. |
| `defaultsOf(values)` | `T` | The code defaults, ignoring tweaks. |

```ts timeline.ts
import { subscribe } from 'motionrig';

const stop = subscribe(TOAST, () => tl.invalidate().restart());
```

Without `?rig`, `subscribe` does nothing and `snapshot` returns the object itself.
