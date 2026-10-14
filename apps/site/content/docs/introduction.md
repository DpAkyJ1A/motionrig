---
title: Introduction
description: "A tuning panel for your site's animation constants: what it does, how the loop works, and where to start."
---

Wrap your animation constants in `rig()`, open the site with `?rig`, and tune them in a panel while the animation plays. Then send the values back to code.

```ts motion/hero.ts
import { rig } from 'motionrig';

export const HERO = rig('hero', { duration: 0.6, ease: 'power2.out', y: 24 });

// Your animation code doesn't change: it reads the same object.
gsap.from('.hero', { y: HERO.y, duration: HERO.duration, ease: HERO.ease });
```

Visitors pay {{size.core}} gzipped for `rig()`. The panel ({{size.panel}}) downloads only when someone opens it.

## How it works

1. **Wrap.** `rig(id, values)` registers a plain object; each number, string and boolean gets a control.
2. **Tune.** Open any page with `?rig`. Edits change the object in place, so the next frame or play uses them.
3. **Hand back.** **Copy code** gives you a literal to paste; **Share link** puts every tweak in a URL.
4. **Apply.** `npx motionrig apply "<link>"` writes the values into your source.

Tweaks are saved in the browser, and dropped when their default changes in code: the code always wins.

Works with GSAP, Motion, CSS transitions and keyframes, the Web Animations API, canvas and WebGL. No runtime dependencies.

## Next steps

- [Installation](/docs/installation): Next.js, React or plain JavaScript.
- [Live updates](/docs/live-updates): make every edit show.
- [Examples](/examples): a live recipe per engine.

## Docs for AI assistants

Every page has a **Copy page** button and a Markdown version at its URL plus `.md`, like [/docs/rig.md](/docs/rig.md). [/llms.txt](/llms.txt) indexes the docs; [/llms-full.txt](/llms-full.txt) is all of it in one file.
