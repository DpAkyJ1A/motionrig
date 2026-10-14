---
title: React
description: useRig, the hook that re-renders on every edit, and RigPanel, the component that mounts the panel.
---

From `motionrig/react`, React {{react}}. Full setup: [Installation](/docs/installation).

## useRig

```ts
function useRig<T extends object>(values: T): T;
```

Returns an immutable snapshot that changes identity on every edit. Render from it, or use its values as effect dependencies:

```tsx Hero.tsx
const { duration, ease, y } = useRig(HERO);

useEffect(() => {
  const tween = gsap.from(ref.current, { y, duration, ease });
  return () => void tween.revert();
}, [duration, ease, y]);
```

- **Pass the object `rig()` returned:** `useRig(HERO).enter`, not `useRig(HERO.enter)`.
- **No hydration mismatch:** the server and first client render use the code defaults.
- Without `?rig` it returns the object itself and never re-renders.

Outside React, read `HERO` directly: it always holds the current values.

## RigPanel

```tsx
<RigPanel preload={() => import('@/motion/rigs')} />
```

Mounts the panel behind `?rig` and renders nothing. Put it once near the app root.

| Prop | Type | Description |
|---|---|---|
| `preload` | `() => Promise<unknown>` | Runs before the tabs are built. Import every rig module here, so every page shows every rig. Read on first mount. |

In the App Router, wrap it in a `'use client'` component: a Server Component can't pass a function. Theme is set with [`configure`](/docs/configure#theme).
