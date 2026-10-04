# motionrig — spec (v0.1 MVP)

> Devs rig it. Designers play it.

motionrig puts the animation constants of a live site on a panel. A developer
wraps a plain config object with `rig()`; a designer opens the site with `?rig`,
tunes timing, curves and distances in place, and the values go back to code as a
snippet, a share link, or a patch applied by `npx motionrig apply`.

It grew out of a tuning panel built for a production portfolio site (25 tabs,
~200 parameters, GSAP + CSS variables + WebGL).

This document describes the intended behaviour of v0.1. Where it and the code
disagree, the code and its tests are authoritative; open an issue so one of
them gets fixed.

---

## 1. Principles

1. **The constant stays a plain object.** `rig()` returns the very object it was
   given; animation code keeps reading `HERO.duration` at play time. No hooks,
   no re-render model, no engine lock-in (GSAP, CSS, canvas/WebGL, anything).
2. **Zero cost for visitors.** When the gate is closed: no DOM work, no storage
   reads beyond the one-time gate check, no panel code downloaded. On the server
   `rig()` is an identity function.
3. **Code wins.** A saved tweak only applies while the code default is still the
   one it was tuned against. Once a developer pastes new values, stale tweaks
   silently drop.
4. **Designer language.** Every rig can say *where to see it* (`note`), *when an
   edit shows* (`applies`), offer *replay* and *locate*. Keys and code snippets
   stay visible so designer and developer share one vocabulary.
5. **Values go back to code without retyping.** Copy as code, share link,
   `npx motionrig apply <link>`.
6. **Small.** Core ≤ 3 kB gz for `rig + configure`; React bindings ≤ 1 kB;
   panel ≤ 28 kB gz, lazy.

---

## 2. Repository layout

```
motionrig/
  package.json  pnpm-workspace.yaml  tsconfig.base.json  LICENSE  README.md
  .github/workflows/{ci,release}.yml  .changeset/
  docs/spec.md
  packages/motionrig/               the npm package
    package.json tsdown.config.ts vitest.config.ts tsconfig.json README.md LICENSE CHANGELOG.md
    src/
      index.ts                      public core API (browser + SSR safe)
      core/                         registry, gate, storage, eases, infer, css, snippet, share, path, config
      panel/                        the lazy web-component panel (internal entry `dist/panel.js`)
      react/index.ts                `motionrig/react` — useRig, RigPanel
      cli/                          `motionrig` bin — apply
  apps/site/                        landing page (Next.js 16, App Router), uses `workspace:*`
```

Build: `tsdown` with three
configs — (a) browser `index` + `panel` together (shared chunk ⇒ one registry
instance), (b) `react` with `external: ['react','motionrig']` and a
`'use client'` banner — it imports the core **only via the package name
`'motionrig'`** (self-reference; tsconfig `paths` + vitest alias map it to
`src/index.ts`), (c) node `cli`. ESM only.

Tests: vitest, default environment `happy-dom`; node-only tests start with
`// @vitest-environment node`. Tests live next to the code: `src/**/x.test.ts`.

Tooling commands (run in `packages/motionrig`): `pnpm test`, `pnpm typecheck`,
`pnpm build`, `pnpm lint:pkg`, `pnpm size`, `pnpm check` (all of them).

---

## 3. Public API — `motionrig`

```ts
export function rig<T extends object>(id: string, values: T, meta?: RigMeta<T>): T;
export function configure(options: RigConfig): void;
export function subscribe(values: object, listener: () => void): () => void;
export function snapshot<T extends object>(values: T): T;
export function defaultsOf<T extends object>(values: T): T;
export function isEnabled(): boolean;
export function mountPanel(options?: { preload?: () => Promise<unknown> }): Promise<void>;
export function openPanel(id?: string): Promise<void>;
export type { RigMeta, ControlMeta, RigConfig, RigValues, Leaf, Bezier, EaseDef, Applies, ControlType, Option, Flavour, MessageKey };
```

### 3.1 Types

```ts
type Leaf = number | string | boolean;
interface RigValues { [key: string]: Leaf | RigValues }      // plain objects, any depth
type Bezier = [number, number, number, number];
type Applies = 'live' | 'replay' | 'reload';
type ControlType = 'number' | 'toggle' | 'select' | 'ease' | 'color' | 'text';
type Option = string | number | { label: string; value: string | number };
type Flavour = 'gsap' | 'css';
type MessageKey = keyof typeof en;                           // the panel's strings (§10.6)

interface ControlMeta {
  type?: ControlType;          // inferred when omitted (§5)
  label?: string;              // display name; default: the key
  hint?: string;               // one line under the control
  group?: string;              // heading the control is listed under
  min?: number; max?: number; step?: number;   // number
  unit?: string;               // number: shown after the value; css binding appends it
  options?: Option[];          // select
  flavour?: Flavour;           // ease: what the value must be usable in
}

interface RigMeta<T> {
  title?: string;              // tab title; default: id
  note?: string;               // designer-facing: where to look, how it behaves
  applies?: Applies;           // how an edit takes effect; default 'live'
  replay?: () => void;         // shows a ▶ Replay button
  onChange?: (values: T) => void;   // runs after changes (batched, §4.4)
  css?: boolean | { prefix?: string };   // mirror overrides to CSS custom props (§8)
  target?: string;             // CSS selector of the elements this rig drives (§10.4 Locate; §10.1 keeps clear)
  controls?: Record<string, ControlMeta | false>;  // key = dotted path; false = hidden;
                               // an object path (nested group) may carry { label, hint }
}

interface EaseDef { bezier: Bezier; code?: string; label?: string }

interface RigConfig {
  param?: string;              // URL gate param; default 'rig'
  enabled?: boolean;           // force on/off; undefined leaves it to the gate (e.g. `isDev || undefined`)
  storageKey?: string;         // localStorage key; default 'motionrig'
  locale?: 'en' | 'ru';        // panel language; default 'en'
  messages?: Partial<Record<MessageKey, string>>;  // override individual panel strings
  eases?: Record<string, Bezier | EaseDef>;    // the project's named curves (§6)
  hotkey?: string | false;     // toggles the panel; default 'alt+r'
  order?: string[];            // tab order: these ids first, in this order; the rest in registration order (§10.3)
  theme?: 'dark' | 'light' | 'auto';  // panel colours (§10.5); default 'dark'; 'auto' follows prefers-color-scheme live
}
```

`T extends object`; supported leaves are number / string / boolean, nested plain
objects become groups. Anything else (arrays, functions, null, class
instances) is left untouched, never shown, and printed by the snippet with
`JSON.stringify` when that works (otherwise the key is omitted from the snippet
with a `// <key>: not serialisable` comment line).

### 3.2 Semantics

- **`rig(id, values, meta)`** — on the server (`typeof window === 'undefined'`)
  returns `values` and does nothing else. In the browser it registers
  `{ id, values, meta }` in the registry (O(1): no clone, no DOM, no storage),
  then, **only if the gate is open**, applies stored overrides (§4.3) and syncs
  CSS (§8). Returns `values` (same identity).
  Registering an id that already exists **replaces** the entry (HMR / module
  re-evaluation): overrides are re-applied to the new object and registry
  listeners are notified.
- **`configure(options)`** — merges into the config. May be called before or
  after any `rig()`; it re-evaluates the gate and, if now open, applies stored
  overrides to every registered entry (idempotent). Order of module evaluation
  must never matter.
- **`subscribe(values, cb)`** — `cb` runs after the rig owning `values` changes
  (batched per microtask). Unknown object or gate closed ⇒ no-op unsubscribe.
- **`snapshot(values)`** — an immutable deep copy that keeps its identity until
  the next change (cached per entry version). Gate closed / unknown ⇒ returns
  `values` itself.
- **`defaultsOf(values)`** — the code defaults (deep clone taken lazily the
  first time it is needed, which is always before any mutation). Gate closed /
  unknown ⇒ `values`.
- **`isEnabled()`** — the gate (§7).
- **`mountPanel({ preload })`** — SSR or gate closed ⇒ resolves immediately.
  Otherwise awaits `preload?.()` (lets an app import all rig-bearing modules so
  every tab shows on every page), dynamically imports the panel chunk, mounts
  one `<motionrig-panel>` in `document.body`. Idempotent.
- **`openPanel(id?)`** — `mountPanel()` then opens the panel on tab `id`
  (or the last tab), moved aside if it would cover the tab's `meta.target`
  (§10.1). Gate closed ⇒ no-op.

---

## 4. Registry, overrides, persistence

### 4.1 Entry

```ts
interface Entry {
  id: string;
  values: object;         // live object returned to the user; mutated in place (nested too)
  meta: RigMeta<any>;
  version: number;        // ++ on every change
  // lazily: defaults (deep clone), resolved controls (§5)
}
```

Paths are dotted (`'enter.rows'`). Mutation writes into the existing nested
objects so references like `export const SHUTTER_ENTER = SHUTTER.enter` stay live.

### 4.2 Internal operations (used by panel; not public)

`entries()` (registration order), `getEntry(id)`,
`setValue(id, path, value)`, `resetValue(id, path)`, `resetEntry(id)`,
`resetAll()`, `overridesOf(id)` (path → value, only paths differing from
default), `changedCount()`, `onRegistryChange(cb)` (entry added / replaced /
values reset), `subscribeEntry(id, cb)`.

`setValue`: writes the live object; if `value` equals the default the override
is deleted, otherwise stored with `baseline[id][path] = default`; bumps
`version`; syncs CSS; schedules notify; schedules persist.

### 4.3 Stored overrides & the baseline guard ("code wins")

Persisted JSON under `config.storageKey` (default `motionrig`) in localStorage:

```json
{ "v": 1,
  "overrides": { "<id>": { "<path>": <leaf> } },
  "baseline":  { "<id>": { "<path>": <leaf> } },
  "ui": { "open": false, "tab": "<id>", "ring": {"x":16,"y":700}, "panel": {"x":24,"y":80}, "seen": ["<id>"] } }
```

When overrides are applied to an entry, each `(path, value)` is applied **only
if** `baseline[id][path] === currentDefault(path)`; otherwise the override and
its baseline are dropped (and persisted). Overrides for ids that are not
registered on this page are kept untouched.

Unparseable or foreign JSON ⇒ start empty (never throw). All storage access is
wrapped in try/catch (private mode, blocked storage) — the panel then works
in-memory for the session.

Writes are debounced (250 ms) and flushed on `pagehide`.

### 4.4 Notifications

A change bumps `entry.version` synchronously (so `snapshot()` is fresh right
away) and queues the entry; one microtask later each queued entry calls its
subscribers once and `meta.onChange(values)` once. Many `setValue` calls in one
tick ⇒ one notification per entry.

---

## 5. Controls: resolution & inference

`controlsOf(entry)` → `Group[]`, computed once per entry (meta is static):

```ts
interface Control {
  path: string; key: string; type: ControlType; label: string; hint?: string;
  min?: number; max?: number; step?: number; unit?: string;
  options?: { label: string; value: string | number }[];   // normalised
  flavour?: 'gsap' | 'css';
}
interface Group { id: string; label?: string; hint?: string; controls: Control[] }
```

Walk leaves depth-first in key order. Skip paths whose meta is `false` (and
everything under a hidden object path). Group identity = nested parent path +
`meta.group`; label = the nested object's meta `label` (or its key) joined with
`meta.group` by `' · '`. Top-level controls without `group` form one unlabeled
group.

Display order: controls listed in `meta.controls` come first, in the order of
`Object.keys(meta.controls)` (leaf paths only; object paths and `false` entries
don't rank); unlisted leaves follow in key order. Within a group, controls are
sorted by that rank; groups are ordered by their lowest-ranked control (with no
listing that is order of first appearance). An object's `hint` goes under the
first heading it produces in display order. Copy code (§9) keeps the literal's
own key order.

Inference when `type` is omitted:

| value | type |
|---|---|
| boolean | `toggle` |
| number | `number` |
| string & (`options` given) | `select` |
| string & looks like an ease (§6) | `ease` (flavour: meta → `css` if the value is CSS syntax → else `gsap`) |
| string `#rgb/#rgba/#rrggbb/#rrggbbaa`, `rgb(`, `hsl(`, `hwb(`, `lab(`, `lch(`, `oklab(`, `oklch(`, `color(` | `color` |
| other string | `text` |
| number with `options` | `select` |

Number range when `min`/`max` are missing: `v > 0 ⇒ [0, v·3]`, `v < 0 ⇒ [v·3, −v·3]`,
`v = 0 ⇒ [0, 1]`. Step when missing: the smallest of {1, 2, 5}·10ᵏ that is
≥ (max − min)/300, then capped to ≤ 10^(−decimals(v)) (so a value with 3
decimals is always reachable). Displayed values are trimmed to the step's
decimals; stored values too (`Number(v.toFixed(decimals(step)))`).

---

## 6. Eases

A string is an ease when it is: a key of `config.eases`; a GSAP built-in
(`none`, `linear`, `power0-4|quad|cubic|quart|quint|strong|expo|sine|circ|back|elastic|bounce` +
`.in|.out|.inOut`, optionally with a `(…)` config); a bare bezier
`"x1,y1,x2,y2"` (regex `^\s*-?[\d.]+(\s*,\s*-?[\d.]+){3}\s*$`); CSS
`cubic-bezier(…)`, `ease`, `ease-in`, `ease-out`, `ease-in-out`, `linear`, `steps(…)`, `linear(…)`.

CSS syntax ⇒ flavour `css`. Everything else ⇒ `gsap`.

**Values written by the panel:**
- gsap flavour — a named ease: its name (`'revealEase'`, `'power2.out'`);
  custom curve: the bare bezier string `'0.25,0.1,0.25,1'` (3-decimal numbers).
  GSAP parses that string natively once `CustomEase` is registered
  (`gsap.registerPlugin(CustomEase)`); the library never imports gsap.
- css flavour — named: `cubic-bezier(x1, y1, x2, y2)` of that ease (CSS keywords stay keywords);
  custom: `cubic-bezier(x1, y1, x2, y2)`.

**Ease menu** for a control: project palette (`config.eases`, in insertion
order, label `def.label ?? name`), then built-ins of the control's flavour,
then — css flavour only — the standard curves as `cubic-bezier()` values
labelled easings.net-style (`easeInQuad` … `easeInOutBack`: quad, cubic, quart,
quint, sine, expo, circ, back × in / out / inOut, from the known-bezier table
below), so a value like `cubic-bezier(0.22, 1, 0.36, 1)` reads as `easeOutQuint`
instead of a custom curve; then "Custom curve…". The gsap menu has no extra
curves (its built-ins already name them). The current value matches a choice
by its text; in the css flavour a `cubic-bezier()` also matches by its numbers
(rounded like `formatBezier`), so `cubic-bezier(.22,1,.36,1)` reads as
`easeOutQuint` while the value keeps its own spelling until another choice is
picked. If the current value is none of those and is parseable
as a bezier ⇒ custom mode; otherwise the raw value is listed as its own option.
Switching to custom starts from the current curve's bezier when known, else
`[0.25, 0.1, 0.25, 1]`.

**Known beziers** (for thumbnails and for starting a custom curve):
palette beziers; CSS keywords `ease (0.25,0.1,0.25,1)`, `ease-in (0.42,0,1,1)`,
`ease-out (0,0,0.58,1)`, `ease-in-out (0.42,0,0.58,1)`, `linear (0,0,1,1)`;
GSAP built-ins approximated (power1=quad, power2=cubic, power3=quart, power4=quint):

```
quad   in .11,0,.5,0     out .5,1,.89,1     inOut .45,0,.55,1
cubic  in .32,0,.67,0    out .33,1,.68,1    inOut .65,0,.35,1
quart  in .5,0,.75,0     out .25,1,.5,1     inOut .76,0,.24,1
quint  in .64,0,.78,0    out .22,1,.36,1    inOut .83,0,.17,1
sine   in .12,0,.39,0    out .61,1,.88,1    inOut .37,0,.63,1
expo   in .7,0,.84,0     out .16,1,.3,1     inOut .87,0,.13,1
circ   in .55,0,1,.45    out 0,.55,.45,1    inOut .85,0,.15,1
back   in .36,0,.66,-.56 out .34,1.56,.64,1 inOut .68,-.6,.32,1.6
none / linear / power0: 0,0,1,1
```

Built-in menu entries (gsap): `none`, `power1-4` × `.in/.out/.inOut`,
`expo.*`, `sine.*`, `circ.*`, `back.*`. (css): `linear`, `ease`, `ease-in`,
`ease-out`, `ease-in-out`.

**Snippet printing of an ease:** a palette name whose def has `code` prints
as that identifier (`EASE_REVEAL`); everything else prints as a quoted string.

---

## 7. Gate

`isEnabled()` is computed lazily once per page (and recomputed by `configure`):

1. `config.enabled === false` ⇒ closed (nothing is read). `config.enabled === true` ⇒ open;
   a share payload in the param is still imported (so links work on sites that
   force the panel on); `off` and the sticky flag are ignored.
2. URL param `config.param` (default `rig`):
   - `off`, `0`, `false` ⇒ closed, clears the sticky flag;
   - a value that decodes as a share payload (§9) ⇒ open, sticky, payload
     imported into storage (its overrides replace stored ones for the listed
     paths, baselines from the payload), then the param value is stripped
     from the URL with `history.replaceState` (leaving a bare `?<param>`;
     other params, the hash and the history state are kept, minus Next's
     `__NA` / `_N` marks, so the App Router's patched `replaceState` adopts the
     new URL). The strip is re-checked every 250 ms for 10 s and redone while
     the URL shows that same payload again: Next's App Router hydrates with
     the URL it was served and writes it back once;
   - any other value or bare `?rig` ⇒ open, sticky.
3. Sticky flag `sessionStorage['<storageKey>:on'] === '1'` ⇒ open (survives
   reloads and client navigation within the tab).
4. Otherwise closed.

Computing the gate is a **pure read**. Its side effects — writing the sticky
flag, importing a payload, stripping the URL — are committed once per page,
using the config current at that moment. If `configure()` has been called
before the gate is first computed, they are committed synchronously at that
first computation (the config is explicit, so a share link's values are in
place before any layout effect — configure first, e.g. in Next's
`instrumentation-client.ts`). Otherwise they are committed one microtask after
the first computation, so a `configure()` evaluated later in the same tick
decides them.

A payload is imported **once per tab and payload**: the commit compares the
param's raw value with `sessionStorage['<storageKey>:imported']`, imports only
when it differs, writes the imported overrides to localStorage at once, and
stores the marker only when that write succeeded (after a refused write, the
next load imports the payload again). Some routers keep re-writing the URL they
captured, payload included (Next's App Router does), so a reload must not
import it over the designer's later tweaks. The strip is still attempted, and
a failed strip leaves the import marked. With
sessionStorage blocked the payload is imported on every load. Registry
listeners are notified after an import and after a `storageKey` swap.
When `configure()` closes a gate that was open, or changes `storageKey`, every
registered rig is restored to its code defaults and the CSS overrides are
cleared before the gate is re-evaluated. Recommended anyway: call `configure()`
in a module imported before the rig-bearing modules.

Stored or shared overrides are untrusted input: an override applies only when
its type equals the default's type, and every CSS write (the binding, a share
link's `css` section, a css rig's Copy code) skips string values that fail
`safeCss` (§8). An id or path with a segment named like an `Object.prototype`
member (`constructor`, `toString`, `__proto__`, …) is dropped when stored or
shared tables are read, and those tables are prototype-less maps.

---

## 8. CSS binding

`safeCss(value)` (exported from `core/css`, shared with the CLI): numbers and
booleans pass; a string fails when it contains `;`, `{`, `}`, a newline (`\n`,
`\r`, `\f`) or `/*`, has unbalanced or crossed parentheses / square brackets
(`(` `)` `[` `]` outside quotes, matched with a stack, so a stray closer fails),
an unterminated `'`/`"` string, or ends in an unescaped backslash.

In a `css` rig an ease control defaults to the `css` flavour.
`meta.css` truthy ⇒ each **overridden** leaf is written as a custom property on
`:root`: `--{prefix}{kebab(path)}` where `.` → `-` and camelCase → kebab-case
(`fadeDuration` → `--fade-duration`; `faq-duration` stays). Value: numbers get
`unit` appended (`0.7s`, `26rem`), strings as-is. Reset ⇒ the property is
removed so the stylesheet's own fallback (`var(--x, 0.7s)`) shows again.
Defaults are never written — "panel open, nothing changed" looks exactly like
production.

Implementation: one constructed `CSSStyleSheet` adopted by `document`
(`document.adoptedStyleSheets`), rebuilt with `replaceSync(':root{…}')`;
fallback `<style data-motionrig>` in `<head>` when constructable stylesheets
are unavailable. Never touch `document.documentElement.style` (hydration safety).

---

## 9. Snippets & share links

**Copy code (tab)** — headed by one comment line naming the rig: `// <id>`,
or `// <id> — <title>` when the title differs from the id (case-insensitive);
`/* … */` for a css rig. The name is escaped like a string value (control,
line-separator and bidi characters as `\uXXXX`) and `*/` is written `*\/`, so
it stays on its line and can't close a comment. The snippet still pastes over
the literal (`rig('id', <snippet>)`). The panel's Copy code button names the rig
in its accessible name and tooltip (`Copy code · <title>`), and so does its toast.
Then, for a non-css rig: the full values object as a TS
literal, 2-space indent, trailing commas, original key order, nested objects
nested; identifier keys bare, others single-quoted; strings single-quoted with
`\` `'` newline escaped (and C0, DEL, C1, U+2028/2029 and the bidi controls
U+202A–202E, U+2066–2069 as `\uXXXX`); numbers `String(Number(n.toFixed(6)))`; eases per §6.
Example:

```ts
// hero
{
  duration: 1.2,
  ease: EASE_REVEAL,
  'faq-duration': 0.7,
  enter: {
    rows: 12,
  },
}
```

For a css rig: the heading, then CSS declarations of **all** leaves, one per line:
`--faq-duration: 0.7s;`. A leaf whose value fails `safeCss` (§8) is printed as
`/* --name: not safe css */`.

**Share payload v1** (base64url of UTF-8 JSON):

```ts
interface SharePayload {
  v: 1;
  o: Record<string, Record<string, Leaf>>;       // overrides: id → path → value
  b: Record<string, Record<string, Leaf>>;       // baseline (code default when tuned)
  c?: Record<string, Record<string, string>>;    // source text when it is not a plain literal (ease `code`)
  css?: Record<string, Record<string, string>>;  // css rigs registered on the page: '--var-name' → css value text (safeCss only)
}
```

`shareUrl()` = current URL with `?<param>=<payload>` (other params and hash
kept). It includes stored overrides of **all** ids, registered on this page or
not. Decoding validates shape and leaf types and drops anything invalid.

**Length.** A tweak costs about 28–97 payload characters (base64url of the
JSON; the baseline about doubles it): a number in a rig with other tweaks ~28,
numbers across rigs ~49, an ease string ~65, a palette ease with its `c`
identifier ~97, a long id with a dotted path ~88. The panel's ceiling is
**8,000 characters for the whole URL** (`MAX_URL`): nginx's default request-line
buffer is 8 KB (`large_client_header_buffers 4 8k`, 414 above it), Vercel's CDN
rejects URLs over 14 KB, browsers allow far more (Chrome 2 MB, Firefox 64 K,
Safari ~80 K). That fits roughly 80–280 tweaks. Over it, **Share link** copies
the raw payload instead of a link that would break, with a toast pointing to
`npx motionrig apply <payload>` and to pasting it into the panel's search, which
imports a pasted link or payload the same way opening the link would. Telegram
caps a message at 4,096 characters, so a link past about 4,000 characters needs
a file or the payload there. Compression (`CompressionStream('deflate-raw')`)
would shrink it further but is async, while the gate imports synchronously: a v2
option.

---

## 10. Panel (`src/panel`, web component)

Internal entry exporting `mount()` and nothing else public. Mounted by
`mountPanel()`. One custom element `<motionrig-panel>` with an **open shadow
root**; all styles live in the shadow root (constructed stylesheet, fallback
`<style>`). Vanilla TypeScript DOM — no framework, no dependencies.

### 10.1 States & layout
- **Collapsed**: a 40 px "rig ring" button (identity §10.5) at the stored
  position (default bottom-left, 16 px inset). Draggable (pointer events,
  3 px threshold, clamped to the viewport, re-clamped on resize); the grab
  point stays under the pointer anywhere on screen. A tap opens the panel. Badge with the number of changed values when > 0.
- **Open**: floating panel `width: min(360px, 100vw − 16px)`,
  `max-height: min(80vh, 760px)`, draggable by its header, position stored
  and clamped. Under 560 px viewport width it becomes a bottom sheet (full
  width, `62vh`, rounded top, not draggable).
- **Keeps clear of the target**: when a tab with `meta.target` is opened
  (`openPanel(id)`, the ring, the hotkey or a chip) and the floating panel
  would cover the first visible match (its drawn box — the text of a
  block-level heading, not the full-width line; the element's box when it has
  no content — non-empty and inside the viewport),
  the panel moves to the opposite horizontal side of the viewport from that
  match (16 px inset, clamped; its vertical position stays). The side is kept
  through resizes and later tabs that it doesn't cover; it is never stored,
  so the stored position stays home. Only until the designer drags the panel
  in this page session — a drag always wins — and never for the bottom sheet.
- Host: `position: fixed`, max z-index, `contain: layout style`; wheel /
  touchmove inside the panel must not reach smooth-scroll libraries: set
  `data-lenis-prevent` and `data-scroll-prevent` on the scroll container and
  stop propagation of `wheel` / `touchmove` at the host.
- Hotkey (`config.hotkey`, default `alt+r`, matched on `event.code`, ignored
  while focus is in an editable field) toggles open/collapsed. `Escape` inside
  the panel collapses it.
- Ring, panel and Locate box are positioned with the CSS `translate` property,
  never `transform`, so their `scale` (press, open/close, Locate intro) acts
  around their own origin instead of scaling the offset.
- Motion: open/close 160 ms `cubic-bezier(.2,.8,.2,1)` scale .96→1 + fade,
  disabled under `prefers-reduced-motion`.

### 10.2 Header
Ring logo + `motionrig` wordmark (mono; ~6 px apart, the pair set 14 px off the
search) · search field (filters tabs by title, id, note and control
keys/labels) · **Share link**, an icon-only link button named and titled
"Share link — all tweaks" (copies `shareUrl()`; toast "Link with N tweaks
across M rigs copied", counted from the shared payload with the locale's
plural forms; "Nothing changed yet" when there are no overrides) · **Collapse**.

### 10.3 Tabs
Chips that wrap, collapsed to **two rows**: the last visible slot is a "+N"
chip (accessible name "N more") that expands the strip to every tab, followed
by a **mark seen** action ("✓ N new", accessible name "Mark N new tabs as
seen") while any tab is unseen: it adds every id to `ui.seen`, removes the
badges in place (no tab rebuild), persists, and hides itself. Expanded, the "+N" chip
reads "Less" (mirrors the note's More/Less). The expanded state is stored in
`ui.allTabs`; expanded, the strip scrolls past `min(40vh, 320px)`. In the
collapsed state the active tab and tabs with overrides are always visible
(pinned into the two rows; the others fill the remaining room in order). While
a search query is active every match shows and there is no toggle; with
everything fitting in two rows there is no toggle either. Sizes come only from
a ResizeObserver on the strip and its chips (no layout reads on input); a
chip not yet measured stays visible. Order computed once per
panel open: ids listed in `config.order` first, in that order, then the rest in
registration order; unseen ("new") tabs still go first within that rule
(stable sort). Chip marks: yellow
dot = has overrides; blue "new" badge = id not in `ui.seen`. On the very first
panel mount (`ui.seen` absent) every registered id is marked seen (no badge
flood). Opening a tab marks it seen. The active tab is remembered (`ui.tab`).
Empty state when nothing is registered: a short "Nothing rigged on this page
yet" + a 3-line code hint.

### 10.4 Tab body
- Title, `applies` badge (live / on next play / after reload), **▶ Replay**
  when `meta.replay`, **Reload** when `applies === 'reload'` and no replay,
  **Locate** (crosshair) when `meta.target`: scrolls the first match into view
  and draws accent rings around up to 24 matches for 1.6 s (positions follow
  scroll via rAF while visible).
- `note`: clamped to 3 lines with a More/Less toggle when longer.
- Groups: heading (clickable to collapse, in-memory), then controls.
- Control row: label (key in mono, or `label`), value, hint below. Changed
  values: label turns accent + a ↺ reset button; double-click on the label
  resets that value.
  - **number**: slider (step/min/max) + a numeric input (accepts values
    outside the slider range; Enter/blur commits) + unit suffix.
  - **toggle**: switch (`role="switch"`, `aria-checked`).
  - **select**: native `<select>`.
  - **ease**: native `<select>` (§6 menu, `<optgroup>`s) + curve thumbnail;
    custom ⇒ bezier editor: SVG with two draggable handles (x clamped 0..1,
    y in −0.6..1.6, room for back.* overshoot), a params line above four
    numeric inputs, and a
    looping preview dot moving with the curve (paused under reduced motion).
    One pointerdown handler on the plot: a press inside a handle's hit area
    (enlarged for touch, so they overlap when the knobs are close) drags the
    knob nearest the pointer; the drag follows that pointer only (another
    finger neither moves nor ends it). The params line shows `x1, y1, x2, y2`
    on one editable line (no separate value text); typing or pasting a full
    list (`0.68,-0.6,.527,1.6`, spaces, `cubic-bezier(…)` or `[…]`) sets all four,
    clamped as above; anything else changes nothing and marks the field
    `aria-invalid`. A full list pasted into x1 does the same. A copy button
    inside its right edge copies `cubic-bezier(x1, y1, x2, y2)` (toast "Curve
    copied").
  - **color**: swatch + `<input type=color>` for hex values + text input.
  - **text**: text input, commits on change.
- Footer (sticky): **Copy code** · **Reset tab** · **Reset all** (second click
  within 3 s confirms). Toasts for results, placed just above the footer's
  real top edge (a footer wrapped onto two lines never covers them).
- Clipboard: `navigator.clipboard.writeText`; fallback hidden-textarea
  `execCommand('copy')`; last resort a small modal with a selected textarea
  (designers test on phones over plain-HTTP LAN IPs where the Clipboard API is
  unavailable). Afterwards focus returns to what had it, or to the panel when
  nothing did (Safari doesn't focus a clicked button).

### 10.5 Identity
- Palette: `--mr-bg #111113`, `--mr-surface #19191c`, `--mr-raise #222226`,
  `--mr-line rgb(255 255 255 / .08)`, `--mr-text #f2f2f3`,
  `--mr-muted #8b8b93`, `--mr-accent #ffd400` (rig yellow),
  `--mr-blue #3d9bff`, `--mr-red #ff4d3d`. Dark is the default theme.
- `theme` (§3.1) sets the host attribute `data-theme` (`dark` | `light` |
  `auto`; anything else reads as `dark`); the palette is CSS custom properties
  switched by that attribute, so `configure({ theme })` at runtime restyles the
  mounted panel in place (no remount, no tab rebuild). `auto` uses the light
  palette under `@media (prefers-color-scheme: light)`, so it follows the OS live.
- Light palette: `--mr-bg #fff`, `--mr-surface #f4f4f6`, `--mr-raise #e9e9ed`,
  `--mr-line rgb(0 0 0 / .1)`, `--mr-text #17171a`, `--mr-muted #5f5f68`,
  `--mr-blue #0a62c7`, `--mr-red #b3261e`. Rig yellow `#ffd400` stays the
  *fill* (collapsed ring, primary button, changed dots, badge text on ink).
  Wherever yellow is text or a thin stroke (changed key, reset icon, slider
  fill and thumb ring, bezier handles, focus rings, header mark) the light
  theme uses `--mr-hi #7a5f00`, a dark amber that passes WCAG AA (>= 5:1) on
  every light surface; in the dark theme `--mr-hi` is the accent itself.
- Type: UI `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif` 12 px/1.4;
  keys and values `ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace` 11 px.
  No web fonts.
- Motif: the **rig controller ring** (from 3D rigging): a 2 px accent circle
  with a small notch at 12 o'clock and a centre dot. It is the collapsed button,
  the logo, the slider thumb (hollow 12 px ring) and the Locate highlight.
- Radius 12 px panel / 7 px controls; shadow `0 24px 64px rgb(0 0 0 / .45)`.
- Every interactive element has a visible `:focus-visible` ring and an
  accessible name.

### 10.6 i18n
Message tables `en` and `ru`, chosen by `config.locale`, individual strings
overridable by `config.messages`. `applies` labels — en: live / on next play /
after reload; ru: сразу / при следующем проигрывании / после перезагрузки.

### 10.7 Performance rules
- Build a tab's DOM once when it becomes active; slider input updates only its
  own row (no whole-panel re-render). Tear down listeners of the previous tab.
- No layout reads inside pointermove beyond the drag element; position with
  `transform: translate3d`.
- Registry changes coming from outside the panel (HMR replace, reset) re-render
  only the affected tab / chip marks.

---

## 11. React — `motionrig/react`

```ts
export function useRig<T extends object>(values: T): T;
export function RigPanel(props: { preload?: () => Promise<unknown> }): null;
```

- `useRig` = `useSyncExternalStore(cb => subscribe(values, cb), () => snapshot(values), () => defaultsOf(values))`.
  Returns an immutable snapshot whose identity changes on every change of that
  rig only — put it in effect deps to re-run setups when the designer tunes.
  The server snapshot is the code defaults ⇒ no hydration mismatch even when
  stored overrides were applied before hydration.
- `RigPanel` calls `mountPanel({ preload })` once in an effect and renders
  nothing. It has no `theme` prop: `configure({ theme })` is the one place
  (§3.1, §10.5). A `configure()` whose only option is `theme` sets it and
  restyles the panel without re-reading the gate (§1.2 one-time check). Put it in the root layout (inside a small client component if
  `preload` is passed from a Server Component).
- The built file starts with `'use client'` (banner) and imports the core only
  via `'motionrig'`.

---

## 12. CLI — `npx motionrig`

```
motionrig apply <link | payload | file> [--root <dir>] [--dry-run] [--force]
motionrig --help | --version
```

- Input: a URL (any query param whose value decodes as a share payload), a raw
  payload, or a path to a file containing either (or the payload JSON).
- Finds `rig(<'id'|"id"|`id`>, { … })` calls in `.ts .tsx .js .jsx .mjs .cjs
  .mts .cts` under `--root` (default cwd), skipping `node_modules dist build
  .next out coverage .git .turbo .vercel`. Occurrences inside comments and
  strings don't count. An id found in 0 files ⇒ "not found"; in >1 ⇒
  "ambiguous", skipped.
- Patches only the overridden paths inside the object literal (nested paths
  into nested literals). Replacement text: `c[id][path]` if present, else the
  printed leaf (§9 rules). If the current expression is `<literal> as T` or
  `<literal> satisfies T`, only the literal part is replaced. Formatting,
  comments and all other properties are untouched.
- Baseline check: if the current expression is a plain literal whose value
  differs from `b[id][path]`, the path is skipped with a warning ("changed in
  code since it was tuned") unless `--force`. Non-literal expressions
  (identifiers such as `EASE_REVEAL`) can't be evaluated ⇒ applied, and the
  report shows the old text.
- Shorthand / spread / computed properties can't be patched ⇒ warning.
- `css` section: in `.css .scss .sass .less` files (same ignores) every
  `var(--name, <fallback>)` fallback is replaced (paren-balanced) with the new
  text. A value that fails `safeCss` (§8), or contains `//` or any `\`
  (the scan doesn't model escapes), is skipped as "unsafe value (could break
  out of the declaration)" and nothing is written for it. Reports each
  replacement; none found ⇒ a hint to update the stylesheet.
- Output: per rig — file path, then `path  old → new` lines; a final summary.
  No colours when `NO_COLOR` is set or stdout is not a TTY. Exit code 0 when
  everything applied, 1 when anything was not found / skipped / ambiguous,
  2 on bad input.
- Zero runtime dependencies (own small scanner; no TypeScript API).

---

## 13. Non-goals for v0.1

Timeline editing, springs as a control type, cloud sessions, comments,
multi-user sync, Vue/Svelte bindings, a Figma plugin, codemods for renamed keys.
