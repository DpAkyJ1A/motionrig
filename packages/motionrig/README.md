# motionrig

**Devs rig it. Designers play it.**

Wrap an animation constant with `rig()`. It's still the same plain object your
code already reads — `gsap.to(el, { duration: HERO.duration })` doesn't
change. But now a designer can open the live site with `?rig`, drag timing,
curves and distances in a panel, and watch it play back for real. When a
value feels right, it goes back to your code as a pasted snippet, a share
link, or a patch applied with `npx motionrig apply` — no retyping, no "can
you make the hero 200ms snappier" round-trip through Slack.

Zero runtime dependencies. Nothing is read, rendered or downloaded for a
visitor unless the panel is open.

```bash
npm install motionrig
# or
pnpm add motionrig
yarn add motionrig
bun add motionrig
deno add npm:motionrig
```

The CLI runs the same way: `npx motionrig`, `pnpm dlx motionrig`,
`yarn dlx motionrig` or `bunx motionrig`.

---

## 30-second quickstart

Pick your stack: Next.js, any other React app, or no framework at all. Each
setup below is complete on its own.

### Next.js (App Router)

A rig module needs no directive. It registers when it runs in the browser, so
import it from client components; on the server `rig()` just returns the
values, so a Server Component can read the defaults too. Values rendered in JSX
should flow through `useRig` so server and client render the same thing on the
first paint:

```ts
// motion/hero.ts — no 'use client': it's a constants module, not a component
import { rig } from 'motionrig';

export const HERO = rig('hero', { duration: 0.6, ease: 'power2.out', distance: 24 });
```

```tsx
// components/Hero.tsx
'use client';
import { useRig } from 'motionrig/react';
import { HERO } from '@/motion/hero';

export function Hero() {
  const { duration, ease, distance } = useRig(HERO);
  // feed these into your GSAP / Motion / raw WAAPI call as usual
  return <h1 data-rig="hero">Ship it.</h1>;
}
```

Mount the panel once, near the root. `RigPanel` is a client component, so a
Server Component layout needs a thin wrapper:

```tsx
// components/PanelMount.tsx
'use client';
import { RigPanel } from 'motionrig/react';

export function PanelMount() {
  // import every rig-bearing module here so all of them show up in the panel,
  // even on pages that haven't rendered yet
  return <RigPanel preload={() => import('@/motion/hero')} />;
}
```

```tsx
// app/layout.tsx (Server Component)
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

A function prop (`preload`) can't cross the server → client boundary, which
is why `PanelMount` defines it locally instead of `layout.tsx` passing one in.

**Configure first, if you need to.** `?rig` works without it; `configure()`
names your curves ([eases](#eases--the-customease-note)), turns the panel on in
development and more. Call it before any rig-bearing module runs — in Next.js
that's `instrumentation-client.ts` at the project root (Next.js 15.3+), which
runs before the app hydrates:

```ts
// instrumentation-client.ts
import { configure } from 'motionrig';

configure({
  // On in development; undefined (not false) keeps ?rig working on staging and production.
  enabled: process.env.NODE_ENV === 'development' || undefined,
});
```

With the config explicit up front, the gate commits its side effects at once,
so a share link's values are already in place before any layout effect reads
them. Without a `configure()` first they land one microtask after the first
`rig()` (rigs and `useRig` are notified when they do).

### React (Vite, Remix, any React app)

React ≥ 18. Wrap the constants in a plain module:

```ts
// motion/hero.ts
import { rig } from 'motionrig';

export const HERO = rig('hero', { duration: 0.6, ease: 'power2.out', distance: 24 });
```

Values you render or use in an effect go through `useRig`, so an edit
re-renders:

```tsx
// Hero.tsx
import gsap from 'gsap';
import { useRig } from 'motionrig/react';
import { useEffect, useRef } from 'react';
import { HERO } from './motion/hero';

export function Hero() {
  const ref = useRef<HTMLHeadingElement>(null);
  // A new snapshot on every edit: the effect re-runs and the entrance replays.
  const { duration, ease, distance } = useRig(HERO);

  useEffect(() => {
    const tween = gsap.from(ref.current, { y: distance, duration, ease });
    return () => void tween.revert();
  }, [duration, ease, distance]);

  return <h1 ref={ref} data-rig="hero">Ship it.</h1>;
}
```

`configure()` is optional here too. If you use it, give it a module of its
own:

```ts
// motion/config.ts
import { configure } from 'motionrig';

// On in development; undefined (not false) keeps ?rig working on staging and production.
configure({ enabled: import.meta.env.DEV || undefined }); // Vite; on webpack: process.env.NODE_ENV === 'development'
```

Mount the panel once, next to the app, with the config imported first. It
renders nothing and loads the panel only behind `?rig`; no `'use client'` is
needed outside Next.js:

```tsx
// main.tsx
import './motion/config'; // configure() first, if you use it
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

### Vanilla (no framework)

TypeScript or JavaScript with a bundler, Vite here. Wrap the constants in a
plain module:

```ts
// hero.ts
import { rig } from 'motionrig';

export const HERO = rig('hero', { duration: 0.6, ease: 'power2.out', distance: 24 });
```

`configure()` is optional. If you use it, give it a module of its own:

```ts
// config.ts
import { configure } from 'motionrig';

// On in development; undefined (not false) keeps ?rig working on staging and production.
configure({ enabled: import.meta.env.DEV || undefined }); // Vite; on webpack: process.env.NODE_ENV === 'development'
```

Mount the panel once, after the config import, and read the values when the
animation plays, so the next play picks up an edit:

```ts
// main.ts
import './config'; // configure() first, if you use it
import gsap from 'gsap';
import { mountPanel } from 'motionrig';
import { HERO } from './hero';

// Downloads and mounts the panel only when the page is opened with ?rig.
mountPanel();

gsap.from('.hero', { y: HERO.distance, duration: HERO.duration, ease: HERO.ease });
```

### Then

Open the page with `?rig`, tune `HERO` in the panel, press
**Copy code** or **Share link** when you're happy. Copy code starts with a
comment naming the rig (`// hero`, or `// hero — <title>` when the rig has a
`title`), so a pasted snippet says which animation it belongs to; it still
pastes straight over the literal.

---

## Concepts

### `rig(id, values, meta?)`

Returns the exact object it was given — same identity, mutated in place
(nested objects too, so `export const ENTER = HERO.enter` stays live).
`id` is how the panel, share links and `npx motionrig apply` all find this
rig again, so keep it stable and unique per page. On the server (no
`window`) it's a no-op identity function: nothing is registered, cloned or
read.

```ts
rig('hero', { duration: 0.6 });                    // no meta
rig('hero', { duration: 0.6 }, { title: 'Hero' });  // with meta
```

Calling `rig()` again with the **same values object** replaces the entry's
metadata in place; its defaults and applied overrides stand. A module
re-evaluating under HMR creates a *new* object instead, which replaces the
entry — see [HMR](#what-happens-on-hmr).

### Meta: `note`, `applies`, `replay`, `target`

```ts
rig('hero', values, {
  title: 'Hero headline',              // tab title; defaults to the id
  note: 'Where to look, how it behaves.',
  applies: 'replay',                   // 'live' (default) | 'replay' | 'reload'
  replay: () => replayHeroAnimation(), // shows a ▶ Replay button
  target: '[data-rig~="hero"]',        // Locate scrolls to it; the panel keeps clear of it
  onChange: (v) => console.log(v),     // runs after a change (batched per microtask)
});
```

`applies` tells the designer *when* an edit takes effect: `'live'` means the
next render already shows it, `'replay'` means press the Replay button (or
your own trigger) to see it, `'reload'` means the page needs a refresh —
the panel shows a Reload button automatically when there's no `replay`.

`target` also steers where the panel sits: opening a tab whose first visible
target the floating panel would cover moves the panel to the other side of the
viewport, so the designer sees what they tune. Once they drag the panel
themselves it stays where they put it; the bottom sheet on phones never moves.

### Inference & controls

Every leaf gets a control automatically:

| value | inferred control |
|---|---|
| `boolean` | toggle |
| `number` | number (slider + numeric field) |
| `string`, with `options` | select |
| `string` that looks like an ease | ease (§ below) |
| `string` matching `#rgb(a)`/`#rrggbb(aa)` or a colour function: `rgb()`/`hsl()`/`hwb()`/`lab()`/`lch()`/`oklab()`/`oklch()`/`color()` | color |
| any other `string` | text |

Number ranges and steps are inferred from the default when you don't set
`min`/`max`/`step` yourself — a `distance: 24` gets roughly `[0, 72]`; a
negative default mirrors around zero. Override anything per-key:

```ts
rig('hero', { duration: 0.6, ease: 'power2.out' }, {
  controls: {
    duration: { unit: 's', min: 0.1, max: 2, step: 0.05 },
    ease: { group: 'Motion' },
  },
});
```

`controls` keys are dotted paths (`'enter.rows'` for a nested value). Set a
key to `false` to hide that control entirely — it never reaches the panel.

**Order.** Controls listed in `controls` show first, in the order you list
them; unlisted values follow in key order. A group sits where its
first-ranked control does. So listing a key to give it a unit also moves it
up — list keys in the order you want designers to see them. Copy code always
keeps your literal's own key order.

### Groups

Nested plain objects become groups in the panel automatically (ordered as
above: by their first-ranked control, which is key order unless you list
paths in `controls`):

```ts
rig('hero', {
  duration: 0.6,
  ring: { draw: 1.8, delay: 0.15 },   // a group: "Root ring" here, "ring" without a label
}, {
  controls: {
    ring: { label: 'Root ring', hint: 'The accent ring on the floor' },
    'ring.draw': { unit: 's', min: 0, max: 4 },
  },
});
```

Arrays, functions, `null` and class instances pass straight through
untouched — they're never shown in the panel and, if they can't be
`JSON.stringify`'d, are skipped in "Copy code" with a `// key: not
serialisable` comment rather than breaking the snippet.

### CSS binding

```ts
rig('faq', { duration: 0.7, ease: 'ease-out' }, {
  css: { prefix: 'faq-' },   // or just `css: true` for no prefix
  controls: { duration: { unit: 's' } },   // written as `0.9s`, not `0.9`
});
```

Every **overridden** leaf is written to a `:root` custom property —
`duration` → `--faq-duration`, camelCase keys become kebab-case. The
stylesheet's own fallback stays the source of truth:

```css
.faq { transition-duration: var(--faq-duration, 0.7s); }
```

A number bound to a CSS length or time needs its `unit`: without it a tuned
`0.9` is written as `--faq-duration: 0.9`, which `transition-duration`
rejects, and Copy code and `npx motionrig apply` would carry the unitless
value into your CSS too.

Defaults are never written, so a page with the panel open but nothing
tuned looks byte-for-byte like production. Resetting a value removes the
property and the stylesheet's fallback shows again. `npx motionrig apply`
patches exactly those fallback values (see [CLI](#cli)).

An ease control inside a `css` rig defaults to the `css` flavour (see next
section) rather than `gsap`.

Stored and shared values are untrusted, so a string that could break out of
the declaration is never written: one containing `;`, `{`, `}`, a newline or
`/*`, with unbalanced parentheses or square brackets, an unterminated quote
or a trailing backslash. The same check (`safeCss`) guards a share link's `css` section and
a css rig's **Copy code**, where such a value is printed as a comment, and
`npx motionrig apply` uses it too.

### Eases & the CustomEase note

A string counts as an ease when it's: a key of `configure({ eases })`; a
GSAP built-in (`power2.out`, `back.inOut(1.7)`, `none`, …); a bare bezier
`"0.25,0.1,0.25,1"`; or CSS syntax (`cubic-bezier(...)`, `ease`, `ease-in`,
`ease-out`, `ease-in-out`, `linear`, `steps(...)`, `linear(...)`). CSS
syntax is flavour `'css'`; everything else is `'gsap'`.

Give the panel your project's named curves so the ease menu matches your
design system, and so **Copy code** prints the identifier instead of a raw
string:

```ts
import { configure } from 'motionrig';
import type { EaseDef } from 'motionrig';

export const EASES = {
  settle: { bezier: [0.16, 1, 0.3, 1], code: 'EASE_SETTLE', label: 'Settle' },
} satisfies Record<string, EaseDef>;

configure({ eases: EASES });
```

**The important part:** for a `gsap`-flavour ease, a custom curve the
designer drags is written as a bare `"x1,y1,x2,y2"` string, not a
`gsap.parseEase(...)` call or anything motionrig-specific. GSAP parses that
string natively, but only once `CustomEase` is registered — **motionrig
never imports gsap itself**, so your project has to:

```ts
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);
for (const [name, def] of Object.entries(EASES)) CustomEase.create(name, def.bezier.join(','));
```

Without that registration GSAP knows neither your palette names nor a bare
`"x1,y1,x2,y2"` curve from the bezier editor: it silently falls back to its
default ease, so the tuning seems to do nothing.

A `css`-flavour custom curve is written as `cubic-bezier(x1, y1, x2, y2)` —
no registration needed, it's just CSS.

The `css` ease menu lists, after your palette and the CSS keywords, the
standard curves as `cubic-bezier()` values named easings.net-style —
`easeInQuad` … `easeInOutBack` (quad, cubic, quart, quint, sine, expo, circ,
back × in / out / inOut). A value like `cubic-bezier(0.22, 1, 0.36, 1)` in
your code therefore reads as **easeOutQuint** instead of a custom curve —
matched by its numbers, so `cubic-bezier(.22,1,.36,1)` does too, and your
spelling stays until a designer picks something else. The `gsap` menu keeps
its own built-ins (`power2.out`, `expo.inOut`, …).

The bezier editor gives y the room `back.*` curves need (−0.6 … 1.6), so
tweaking a back curve never flattens its overshoot.

### Gate & share links

`isEnabled()` (and therefore the whole panel) follows, in order:

1. `configure({ enabled: false })` → always closed, nothing is read at all.
   `configure({ enabled: true })` → always open for every visitor (a staging
   site, say) — a share-link payload in the URL is still imported even then.
2. The URL param (`?rig` by default): `off`/`0`/`false` closes it; a share
   payload opens it, imports the payload, and cleans the URL down to a bare
   `?rig`; anything else (including bare `?rig`) opens it.
3. Otherwise, a sticky flag in `sessionStorage` from earlier in the tab.

So `?rig` once is enough — it stays open through reloads and client-side
navigation for the rest of the session, until `?rig=off`.

After importing, the payload is removed from the address bar (a bare `?rig`
stays; other params and the hash are kept). On Next's App Router, which writes
the URL it was served back once it hydrates, motionrig strips it again, through
Next's own `replaceState` patch, so the router keeps the clean URL and
navigation, back and forward keep working.

A share link is imported **once per tab**: motionrig remembers the imported
payload in `sessionStorage` (`<storageKey>:imported`) and skips it on later
loads. That matters on routers that keep the URL they captured — Next's App
Router re-writes it, payload included, so the cleanup to a bare `?rig` doesn't
stick — and it means a reload never wipes the tweaks a designer made after
opening the link. A different link is imported as usual. The link counts as
imported only once its values are saved to `localStorage`; if that write is
refused (storage full or blocked), the next load imports it again. (With
`sessionStorage` blocked, the link is imported on every load.)

**Share link** (the link icon in the header) copies the current URL with every stored override, baseline
and (for `css` rigs) CSS variable name encoded in the `?rig=` param. Decoding
validates shape and leaf types and drops anything that doesn't fit — see
[is the gate a security boundary?](#is-rig-a-security-boundary). A share
link's `css` section only covers rigs that were actually registered on the
page where the link was made (variable names and units live in their meta,
which only exists once a rig has registered) — pass `preload` to
`mountPanel`/`RigPanel` so every rig on the site registers up front and share
links are always complete.

**Long links.** Each tweak adds roughly 30–100 characters to the link. Past
8,000 characters for the whole URL (servers start refusing at 8 KB), Share link
copies the raw payload instead, and says so: apply it with
`npx motionrig apply <payload>`, or paste it into the panel's search field,
which imports a pasted link or payload just like opening the link. See
[How long can a share link be?](#how-long-can-a-share-link-be).

### Persistence & "code wins"

Tweaks persist in `localStorage` (key `motionrig`, or `config.storageKey`) as
overrides plus the **baseline** each override was tuned against. An override
only re-applies while the live code default still matches its baseline —
the moment a developer ships a new default, any stale tweak for that value
silently drops instead of fighting the new number. All storage access is
wrapped in try/catch, so private browsing or blocked storage just means the
panel works in-memory for that visit instead of throwing.

### `useRig` & hydration

```ts
import { useRig } from 'motionrig/react';

const { duration, ease } = useRig(HERO);
```

`useRig` is `useSyncExternalStore` under the hood: it returns an immutable
snapshot whose **identity** changes only when that rig changes, so it's safe
to drop straight into an effect's dependency array to re-run a setup when a
designer tunes a value. The snapshot used for the server render (and the
very first client render, before hydration) is always the code defaults —
so there's never a hydration mismatch, even if that visitor's browser
already has stored overrides from an earlier session.

Pass the **rig object itself** — the one `rig()` returned — and read nested
values from the snapshot: `useRig(HERO).enter`. A nested object such as
`useRig(HERO.enter)` isn't tracked (it's not a registered rig), so that
component would never re-render.

Reading the raw exported object directly (outside React — inside a GSAP
timeline callback, say) always sees the live, current values too, since
`rig()` mutates in place; `useRig` is specifically for driving a React
re-render safely.

### `preload`

```ts
mountPanel({ preload: () => Promise.all([import('./hero'), import('./faq')]) });
// or, from React:
<RigPanel preload={() => Promise.all([import('./hero'), import('./faq')])} />
```

`mountPanel`/`openPanel`/`RigPanel` only download and mount the panel behind
an open gate. `preload` runs first and lets the app import every
rig-bearing module before the panel builds its tab list, so a designer sees
every rig on every page, not just the ones the current route happens to
render.

### `openPanel`

```ts
import { openPanel } from 'motionrig';

openPanel();        // mounts if needed, opens on the last-used tab
openPanel('hero');  // opens straight to a specific rig
```

If the rig has a `target` the panel would cover, the panel opens on the other
side of the viewport (until the designer drags it somewhere themselves).

Useful for wiring a visible "tune this" button instead of relying on the
hotkey (`alt+r` by default; `configure({ hotkey: false })` disables it, or
pass another combo like `'alt+shift+m'`). A combo is modifiers (`alt`/`option`,
`ctrl`, `shift`, `meta`/`cmd`, matched exactly) plus one key: a letter, a digit
or a `KeyboardEvent.code` name such as `backquote` or `f2`. Keys match by
physical position, so the combo works on any keyboard layout.

---

## CLI

```
Usage:
  motionrig apply <link | payload | file> [--root <dir>] [--dry-run] [--force]
  motionrig --help | --version

Applies a motionrig share link (or payload, or a file holding either) to the
source code: it finds each tuned rig()'s object literal and patches only the
values that changed.

Arguments:
  <link | payload | file>  a URL with a share payload in a query param,
                            a raw share payload, or a path to a file with
                            either (or the payload as JSON)

Options:
  --root <dir>   directory to scan for rig() calls and stylesheets (default: cwd)
  --dry-run      report what would change without writing any file
  --force        apply a value even when the code default no longer matches
                 the baseline it was tuned against
  --help, -h     show this help
  --version, -v  show the installed version
```

```bash
# paste a share link straight from the panel
npx motionrig apply "https://staging.example.com/?rig=eyJ2IjoxLC..."

# see the diff first
npx motionrig apply ./tweaks.json --dry-run

# scan a specific package in a monorepo
npx motionrig apply <payload> --root ./apps/site
```

It finds `rig('id', { … })` calls in `.ts .tsx .js .jsx .mjs .cjs .mts .cts`
under `--root` (skipping `node_modules`, `dist`, `build`, `.next`, `out`,
`coverage`, `.git`, `.turbo`, `.vercel`), and patches `var(--name, fallback)`
in `.css .scss .sass .less` for `css` rigs — only the matched spans, nothing
else in the file moves. A CSS value that could break out of the declaration
(see [CSS binding](#css-binding)), or contains `//` or a `\` escape, is
skipped and reported; the stylesheet is left as it was. Exit code `0` when everything applied cleanly, `1`
when anything was not found, ambiguous, or skipped, `2` on bad input.

**Limitations worth knowing:**

- The call has to literally be named `rig` — a renamed import isn't found.
- A value can only be patched when it's a plain literal or a bare identifier
  (e.g. an exported ease constant) in the source; spreads and computed keys
  are reported as "can't be patched", never silently mis-applied.
- A tuned value only patches if the **current code literal still matches**
  the baseline it was tuned against — otherwise it's skipped with a warning
  (someone shipped a new default in between) unless you pass `--force`.
  Identifier values (like `EASE_REVEAL`) can't be checked this way and are
  always applied.
- A lone backtick or an unterminated `/*` inside JSX text (not inside a
  real string) can confuse the scanner into treating the rest of the file
  as a string or comment, which hides a later `rig()` call — it's reported
  as "not found" rather than silently skipped, but it's worth knowing the
  one class of input that can trip it.

---

## API reference

### `motionrig`

```ts
function rig<T extends object>(id: string, values: T, meta?: RigMeta<T>): T;
function configure(options: RigConfig): void;
function subscribe(values: object, listener: () => void): () => void;
function snapshot<T extends object>(values: T): T;
function defaultsOf<T extends object>(values: T): T;
function isEnabled(): boolean;
function mountPanel(options?: { preload?: () => Promise<unknown> }): Promise<void>;
function openPanel(id?: string): Promise<void>;
```

- **`rig(id, values, meta?)`** — registers and returns `values` unchanged
  (identity). Server-side it's a pure identity function; with the gate
  closed it only registers (past the one-time gate check, no storage read,
  clone or DOM work).
- **`configure(options)`** — merges config; safe to call before or after any
  `rig()` and any number of times. Closing an open gate, or changing
  `storageKey`, restores every registered rig to its code defaults first.
  Calling it before the first `rig()` (recommended) lets a share link's
  values apply synchronously. `order` lists tab ids to show first, in that
  order; the rest follow in registration order, with not-yet-seen ("new")
  tabs first either way. `theme` picks the panel's colours: `'dark'`
  (default), `'light'`, or `'auto'` to follow the OS setting live; changing it
  later restyles the open panel in place.
- **`subscribe(values, listener)`** — `listener` runs once per microtask
  after `values`' rig changes (batched). Returns an unsubscribe function.
  No-op (and a no-op unsubscribe) for an unknown object or a closed gate.
- **`snapshot(values)`** — an immutable deep copy of `values` that keeps a
  stable identity until the next change. The primitive `useRig` is built on.
- **`defaultsOf(values)`** — the original code defaults, regardless of any
  tuning currently applied to `values`.
- **`isEnabled()`** — the gate, computed once per page load (and
  re-evaluated by `configure`).
- **`mountPanel({ preload })`** — resolves immediately on the server or
  behind a closed gate; otherwise awaits `preload`, then lazy-loads and
  mounts the panel. Idempotent — safe to call more than once.
- **`openPanel(id?)`** — `mountPanel()` then opens on tab `id` (or the last
  used tab). No-op behind a closed gate.

#### Types

```ts
type Leaf = number | string | boolean;
interface RigValues { [key: string]: Leaf | RigValues }
type Bezier = [number, number, number, number];
type Applies = 'live' | 'replay' | 'reload';
type ControlType = 'number' | 'toggle' | 'select' | 'ease' | 'color' | 'text';
type Option = string | number | { label: string; value: string | number };
type Flavour = 'gsap' | 'css';
type MessageKey = 'copyCode' | 'share' | 'search' | …;  // every panel string; all keys in the docs

interface ControlMeta {
  type?: ControlType;        // inferred when omitted
  label?: string;             // default: the key
  hint?: string;               // one line under the control
  group?: string;               // heading this control is listed under
  min?: number; max?: number; step?: number;   // number controls
  unit?: string;                 // shown after the value; css binding appends it
  options?: Option[];              // select controls
  flavour?: Flavour;                 // ease controls: which syntax to write
}

interface RigMeta<T> {
  title?: string;                     // tab title; default: the id
  note?: string;                       // designer-facing context
  applies?: Applies;                     // default 'live'
  replay?: () => void;                     // shows a ▶ Replay button
  onChange?: (values: T) => void;            // batched per microtask
  css?: boolean | { prefix?: string };         // mirror overrides to CSS vars
  target?: string;                               // CSS selector: Locate; the panel keeps clear of it
  controls?: Record<string, ControlMeta | false>; // dotted path → override/hide
}

interface EaseDef { bezier: Bezier; code?: string; label?: string }

interface RigConfig {
  param?: string;              // URL gate param; default 'rig'
  enabled?: boolean;           // force on/off for every visitor
  storageKey?: string;         // localStorage key; default 'motionrig'
  locale?: 'en' | 'ru';        // panel language; default 'en'
  messages?: Partial<Record<MessageKey, string>>;  // override individual panel strings
  eases?: Record<string, Bezier | EaseDef>;    // your project's named curves
  hotkey?: string | false;     // toggles the panel; default 'alt+r'
  order?: string[];            // tab ids shown first, in this order
  theme?: 'dark' | 'light' | 'auto';  // panel colours; default 'dark'
}
```

### `motionrig/react`

```ts
function useRig<T extends object>(values: T): T;
function RigPanel(props: { preload?: () => Promise<unknown> }): null;
```

- **`useRig(values)`** — see [useRig & hydration](#userig--hydration) above.
  Pass the rig object `rig()` returned, not a nested object of it.
  Requires React ≥18 (peer dependency, optional unless this entry point is
  imported).
- **`RigPanel`** — calls `mountPanel({ preload })` once in an effect and
  renders nothing. Put it once, near the root. The panel's look is set with
  `configure({ theme })`, not a prop; a theme-only `configure` just restyles
  the panel (no gate re-check).

---

## FAQ

### Does `rig()` cost anything for real visitors?

No. On the server it's an identity function — no registration, no clone, no
DOM. In the browser, with the gate closed: no DOM work, no storage read
beyond the one-time URL/`sessionStorage` check, and the panel is never
downloaded (it's a dynamic `import()` that only runs once the gate is
actually open). The core itself is small enough that shipping `rig` +
`configure` unconditionally is a non-event: about 2.8 kB gzipped, under the
3 kB budget it's held to in CI.

### Is `?rig` a security boundary?

**No** — it's a convenience for designers, not authentication. Anyone who
knows (or guesses) the URL param can open the panel. Stored and shared
values are still type-checked against your code's own defaults before
they're ever applied (a shared override can't turn a number into a string),
CSS values containing `;`, `{` or `}` are dropped before they ever reach
a stylesheet, and ids or paths named like built-in object members
(`constructor`, `__proto__`, …) are dropped on read — but that's hardening against malformed or malicious *input*,
not access control. Don't rig anything a visitor shouldn't be able to see or
nudge, the same way you wouldn't put secrets behind a query param.

### How long can a share link be?

The payload costs about 28–97 characters per tweak (base64url JSON with the
baseline): a number next to other tweaks in the same rig ~28, numbers spread
across rigs ~49, an ease string ~65, a palette ease with its identifier ~97, a
long id and dotted path ~88.

The practical limit isn't the browser: Chrome takes 2 MB, Firefox 64 K and
Safari ~80 K. It's the servers and the messengers in between:

- nginx's default `large_client_header_buffers 4 8k` returns 414 for a request line over 8 KB;
- Vercel's CDN rejects URLs over 14 KB (`URL_TOO_LONG`);
- Telegram caps a message at 4,096 characters;
- Slack messages over a few thousand characters collapse.

motionrig keeps share links at or under **8,000 characters** for the whole URL,
which is roughly 80–280 tweaks. Past that, **Share link** copies the raw payload
and tells you so. `npx motionrig apply <payload>` (or a file holding it) applies
it to the source, and pasting it into the panel's search imports it. For
Telegram, send links over ~4,000 characters as the payload in a file.

### Does this work with SSR?

Yes — `rig()` is a no-op identity function wherever `window` doesn't exist,
and `useRig`'s server snapshot is always the code defaults, so there's no
hydration mismatch, ever, even for a returning visitor whose browser already
has overrides stored.

### What happens on HMR?

Re-evaluating a module that calls `rig('hero', ...)` again registers a new
values object under the same id; motionrig replaces the old entry, re-applies
any stored overrides to the new object, and notifies registry listeners (the
panel rebuilds that tab) — so a dev-server hot reload doesn't lose tuning.
Components using `useRig` pick up the new object because Fast Refresh
re-renders them; the old object's subscribers aren't notified.

---

## Browser support

Evergreen browsers (current Chrome, Edge, Firefox, Safari) — the build
targets ES2020. CSS binding uses constructable stylesheets
(`document.adoptedStyleSheets`) with an automatic `<style>` fallback where
they're unavailable; clipboard actions use the async Clipboard API with a
hidden-textarea fallback and, as a last resort, a manual "copy this"
dialog. `localStorage`/`sessionStorage` access is wrapped in try/catch, so
private browsing or blocked storage degrades to an in-memory, per-session
panel instead of throwing. The CLI requires Node ≥18.

## License

MIT © Alex
