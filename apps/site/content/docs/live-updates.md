---
title: Live updates
description: Make every panel edit show on the page, whether your code reads the value each frame, on each play or once at startup.
---

An edit changes the rig object in place. When it shows depends on **when your code reads the value**:

| Your code reads it | The edit shows | Do this |
|---|---|---|
| Every frame or render: a CSS rig, a canvas loop, `useRig` in JSX | At once | Nothing, it's the default |
| When an animation starts: an entrance, a timeline | On the next play | `applies: 'replay'` and a `replay` function |
| Once at startup: a preloader, smooth scroll | After a reload | `applies: 'reload'`, or rebuild in `onChange` |

`applies` sets the tab's badge (**live**, **on next play**, **after reload**), so a designer knows whether to watch, replay or reload.

## Read at play time

A value copied into a variable at load never sees an edit:

```ts
// ✗ copied once
const { duration } = CARD;
button.onclick = () => gsap.to(card, { x: 100, duration });

// ✓ read on every play
button.onclick = () => gsap.to(card, { x: 100, duration: CARD.duration });
```

## Replay

For one-shot animations, give the rig a `replay` function. The tab gets a **▶ Replay** button that calls it:

```ts motion/hero.ts
export const HERO = rig('hero', { duration: 0.6, ease: 'power2.out', y: 24 }, {
  applies: 'replay',
  replay: () => playHero(),
});
```

## Rebuild on change

Some things read their values once, when created, like a ScrollTrigger's `start`. Rebuild them in `onChange`, which runs after every batch of edits:

```ts motion/parallax.ts
let tween: gsap.core.Tween | undefined;

export const PARALLAX = rig('parallax', { start: 85, depth: 120 }, {
  onChange: () => build(),
});

export function build() {
  tween?.revert(); // also kills the old ScrollTrigger
  tween = gsap.to('.layer', {
    y: -PARALLAX.depth,
    scrollTrigger: { trigger: '.stage', start: `top ${PARALLAX.start}%`, scrub: true },
  });
}
```

## In React

`useRig(HERO)` returns a new snapshot on every edit: render from it, or use its values as effect dependencies. See [React](/docs/react).

Recipes: [GSAP timeline](/examples#gsap-timeline), [ScrollTrigger](/examples#scroll-scrub), [Motion spring](/examples#motion-spring).
