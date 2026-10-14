---
title: Installation
description: Install motionrig and set it up in Next.js, React or plain JavaScript.
---

```sh install
npm install motionrig
```

Types are included. `motionrig/react` needs React {{react}}; the CLI needs Node {{node}}.

## Setup

Each tab is a complete setup.

<!-- tabs -->

### Next.js

**1. Wrap your constants** in a plain module. No `'use client'`: on the server `rig()` just returns the object.

```ts motion/hero.ts
import { rig } from 'motionrig';

export const HERO = rig('hero', { duration: 0.6, ease: 'power2.out', y: 24 });
```

**2. Read them in a client component** through `useRig`. Every edit is a new snapshot, so the effect re-runs.

```tsx components/Hero.tsx
'use client';
import gsap from 'gsap';
import { useRig } from 'motionrig/react';
import { useEffect, useRef } from 'react';
import { HERO } from '@/motion/hero';

export function Hero() {
  const ref = useRef<HTMLHeadingElement>(null);
  const { duration, ease, y } = useRig(HERO);

  useEffect(() => {
    const tween = gsap.from(ref.current, { y, duration, ease });
    return () => void tween.revert();
  }, [duration, ease, y]);

  return <h1 ref={ref}>Ship it.</h1>;
}
```

**3. Mount the panel** in the root layout, through a client component: a Server Component can't pass the `preload` function. `preload` imports every rig module, so every tab shows on every page.

```tsx components/PanelMount.tsx
'use client';
import { RigPanel } from 'motionrig/react';

export function PanelMount() {
  return <RigPanel preload={() => import('@/motion/hero')} />;
}
```

```tsx app/layout.tsx
import { PanelMount } from '@/components/PanelMount';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PanelMount />
      </body>
    </html>
  );
}
```

### React

Vite, React Router, Remix: any React {{react}} app.

**1. Wrap your constants** in a plain module.

```ts motion/hero.ts
import { rig } from 'motionrig';

export const HERO = rig('hero', { duration: 0.6, ease: 'power2.out', y: 24 });
```

**2. Read them in a component** through `useRig`. Every edit is a new snapshot, so the effect re-runs.

```tsx Hero.tsx
import gsap from 'gsap';
import { useRig } from 'motionrig/react';
import { useEffect, useRef } from 'react';
import { HERO } from './motion/hero';

export function Hero() {
  const ref = useRef<HTMLHeadingElement>(null);
  const { duration, ease, y } = useRig(HERO);

  useEffect(() => {
    const tween = gsap.from(ref.current, { y, duration, ease });
    return () => void tween.revert();
  }, [duration, ease, y]);

  return <h1 ref={ref}>Ship it.</h1>;
}
```

**3. Mount the panel** once, next to the app. It renders nothing.

```tsx main.tsx
import { RigPanel } from 'motionrig/react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <RigPanel />
  </>,
);
```

### Vanilla JS

Any bundler, Vite here.

**1. Wrap your constants**, and read them when the animation plays. `replay` adds a ▶ Replay button to the panel.

```ts hero.ts
import gsap from 'gsap';
import { rig } from 'motionrig';

export const HERO = rig('hero', { duration: 0.6, ease: 'power2.out', y: 24 }, {
  applies: 'replay',
  replay: playHero,
});

export function playHero() {
  gsap.from('.hero', { y: HERO.y, duration: HERO.duration, ease: HERO.ease });
}
```

**2. Mount the panel** once, at startup.

```ts main.ts
import { mountPanel } from 'motionrig';
import { playHero } from './hero';

mountPanel();
playHero();
```

<!-- /tabs -->

## Open the panel

Add `?rig` to the URL of any page, then click the ring in the corner or press `Alt+R`. The panel stays on for the rest of the tab; `?rig=off` turns it off. Visitors without `?rig` never download it.

> [!IMPORTANT]
> **Using GSAP?** Register its `CustomEase` plugin, or custom curves from the panel do nothing. See [Eases](/docs/eases).

## Configure (optional)

Call `configure()` before any rig module runs: in Next.js, in `instrumentation-client.ts` (15.3+); elsewhere, in a module you import first.

```ts instrumentation-client.ts
import { configure } from 'motionrig';

configure({
  // Always on in development. undefined, not false, keeps ?rig working in production.
  enabled: process.env.NODE_ENV === 'development' || undefined,
});
```

On Vite, use `import.meta.env.DEV || undefined`. Every option: [configure()](/docs/configure).
