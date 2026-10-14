<div align="center">

<a href="https://motionrig.vercel.app"><img src="https://raw.githubusercontent.com/DpAkyJ1A/motionrig/main/.github/assets/demo.gif" alt="The motionrig panel on a live page: dragging a slider condenses the headline's type, a new tilt replays its entrance, Copy code copies the values" width="100%"></a>

# motionrig

**Devs rig it. Designers play it.**<br>
A tuning panel for your site's animation constants.

[![npm](https://img.shields.io/npm/v/motionrig?color=ffd400&labelColor=1f2226)](https://www.npmjs.com/package/motionrig) [![core size](https://img.shields.io/badge/core-~3%20kB%20gzip-ffd400?labelColor=1f2226)](https://motionrig.vercel.app/docs/troubleshooting#does-it-cost-my-visitors-anything) [![dependencies](https://img.shields.io/badge/dependencies-0-ffd400?labelColor=1f2226)](https://www.npmjs.com/package/motionrig?activeTab=dependencies) [![CI](https://github.com/DpAkyJ1A/motionrig/actions/workflows/ci.yml/badge.svg)](https://github.com/DpAkyJ1A/motionrig/actions/workflows/ci.yml) [![license](https://img.shields.io/npm/l/motionrig?color=ffd400&labelColor=1f2226)](https://github.com/DpAkyJ1A/motionrig/blob/main/LICENSE)

[Docs](https://motionrig.vercel.app/docs) · [Examples](https://motionrig.vercel.app/examples) · [Live demo](https://motionrig.vercel.app)

</div>

Wrap your animation constants in `rig()`. Open the site with `?rig`, tune durations, eases and distances while the animation plays, then send the values back to code: as a snippet, a share link, or a patch applied by `npx motionrig apply`.

- **Free for visitors.** About 3 kB gzipped and no dependencies. The panel downloads only behind `?rig`.
- **Any engine.** GSAP, Motion, CSS transitions, the Web Animations API, canvas: anything that reads a number.
- **The code always wins.** A tweak is dropped once its default changes in code, so it never fights a deploy.

## Install

```sh
npm install motionrig
```

## Usage

```ts
import gsap from 'gsap';
import { mountPanel, rig } from 'motionrig';

// rig() returns the same object, so your code reads it as before.
const HERO = rig('hero', { duration: 0.6, ease: 'power2.out', y: 24 }, {
  applies: 'replay',
  replay: playHero, // adds a ▶ Replay button to the panel
});

// Read the values when the animation plays, so a replay uses the tuned ones.
function playHero() {
  gsap.from('.hero', { y: HERO.y, duration: HERO.duration, ease: HERO.ease });
}

playHero();
mountPanel(); // loads the panel only when the page is opened with ?rig
```

Open your page with **`?rig`** and tune. Then press **Copy code** and paste, or press **Share link** and apply the link to your source:

```sh
npx motionrig apply "https://your-site.com/?rig=…"
```

<details>
<summary><b>React</b></summary>

<br>

Mount the panel once with `<RigPanel />`, and read values you render or animate in an effect through `useRig`:

```tsx
import { RigPanel, useRig } from 'motionrig/react';

function Hero() {
  const ref = useRef<HTMLHeadingElement>(null);
  // A new snapshot on every edit: the effect re-runs with the tuned values.
  const { duration, ease, y } = useRig(HERO);

  useEffect(() => {
    const tween = gsap.from(ref.current, { y, duration, ease });
    return () => void tween.revert();
  }, [duration, ease, y]);

  return <h1 ref={ref}>Ship it.</h1>;
}

createRoot(root).render(
  <>
    <App />
    <RigPanel />
  </>,
);
```

</details>

<details>
<summary><b>Next.js (App Router)</b></summary>

<br>

Rig modules need no `'use client'`: on the server, `rig()` returns the object untouched. Read values in client components with `useRig`, as in React, and mount the panel from a small client component in the root layout:

```tsx
// components/PanelMount.tsx
'use client';
import { RigPanel } from 'motionrig/react';

export function PanelMount() {
  // Import every rig module, so every tab shows on every page.
  return <RigPanel preload={() => import('@/motion/rigs')} />;
}
```

```tsx
// app/layout.tsx
<body>
  {children}
  <PanelMount />
</body>
```

</details>

<details>
<summary><b>Using GSAP? Register CustomEase</b></summary>

<br>

Custom curves from the panel's bezier editor are written as `'x1,y1,x2,y2'` strings, which GSAP reads only once `CustomEase` is registered:

```ts
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);
```

</details>

## Documentation

Everything else is at **[motionrig.vercel.app/docs](https://motionrig.vercel.app/docs)**: [controls](https://motionrig.vercel.app/docs/controls), [eases](https://motionrig.vercel.app/docs/eases), [CSS variables](https://motionrig.vercel.app/docs/css-variables), [handoff and the CLI](https://motionrig.vercel.app/docs/handoff), and the [API reference](https://motionrig.vercel.app/docs/rig).

Working with an AI assistant? Give it [llms-full.txt](https://motionrig.vercel.app/llms-full.txt), the whole documentation in one file, or use **Copy page** on any docs page.

## Contributing

Bug reports and ideas are welcome in [issues](https://github.com/DpAkyJ1A/motionrig/issues). To work on the code, see [CONTRIBUTING.md](https://github.com/DpAkyJ1A/motionrig/blob/main/CONTRIBUTING.md).

## License

[MIT](https://github.com/DpAkyJ1A/motionrig/blob/main/LICENSE)
