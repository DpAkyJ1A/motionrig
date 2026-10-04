# motionrig

## 0.1.0

Initial release.

### Core

- `rig(id, values, meta?)` — wraps a plain object of animation constants,
  returns it unchanged (same identity, mutated in place), and registers it
  with the panel. A no-op identity function on the server.
- `configure(options)` — gate param, forced on/off, `storageKey`, `locale`,
  `messages`, a project's named `eases`, the `alt+r` hotkey (or a custom
  combo, or `false`), tab `order` (these ids first), and the panel `theme`
  (`'dark'` default, `'light'`, or `'auto'` following the OS live).
- `mountPanel({ preload })` and `openPanel(id?)` — load and mount the panel
  behind the gate (after `preload` registers every rig), or open it straight
  on a rig's tab.
- `meta.target` — a CSS selector of what the rig drives: the tab's **Locate**
  button scrolls to and highlights it, and the panel moves to the other side
  when it would cover it.
- `subscribe`, `snapshot`, `defaultsOf` — the low-level primitives
  `motionrig/react` is built on; `isEnabled()` — whether the gate is open.
- Automatic control inference from each value's type (toggle / number /
  select / ease / color / text), with per-key overrides and nested objects
  as panel groups.
- CSS binding (`meta.css`) — tuned values mirror to `:root` custom
  properties; the stylesheet's own `var(--x, fallback)` stays the source of
  truth, and untouched defaults are never written.
- Eases: GSAP built-ins, bare bezier strings, CSS easing syntax and a
  project's own named curves, each with the right flavour (`gsap` writes a
  bare curve string for `CustomEase`; `css` writes `cubic-bezier(...)`).
- After a share link is imported, its payload leaves the address bar (a bare
  `?rig` stays), also on Next's App Router, which writes its served URL back
  once on hydration.
- The gate (`?rig`, a sticky per-session flag, `configure({ enabled })`) is a
  convenience for designers, not a security boundary — stored and shared
  values are type-checked against the code defaults, unsafe CSS text is
  dropped before it reaches a stylesheet, and ids or paths named like
  built-in object members (`constructor`, `__proto__`, …) are dropped.
- Persistence in `localStorage` (debounced; flushed on `pagehide` and when
  the tab is hidden) with a baseline guard: a tuned value only
  re-applies while the code default it was tuned against hasn't changed
  ("code wins").
- Share links encode every stored override, baseline, and (for `css` rigs)
  CSS variable name as a versioned, validated payload in the URL.

### Panel

- A dependency-free, lazy-loaded web component (`<motionrig-panel>`),
  draggable, with a mobile bottom-sheet layout, search, per-rig tabs, six
  control types (including a bezier curve editor for custom eases), a
  live-updating color swatch, copy-code / share-link / reset actions, and
  `en`/`ru` locales.
- A compact header: an icon-only **Share link** whose toast says what was
  shared ("Link with 3 tweaks across 2 rigs copied"), so the search gets the
  width.
- The bezier editor's params line: all four numbers on one editable line
  (paste `0.68,-0.6,.527,1.6`, `cubic-bezier(…)` or `[…]`), with a button that
  copies `cubic-bezier(x1, y1, x2, y2)`.
- **Mark seen** in the tab strip clears every "new" badge at once.
- Over 8,000 characters, Share link copies the raw payload instead of a
  link that would break; pasting a link or payload into the panel's search
  imports it.
- With many rigs the tab strip collapses to two rows and a "+N" chip that
  expands it (remembered); the active tab and tabs with tweaks always stay
  visible, and search shows every match.
- The floating ring stays exactly under the pointer while dragged.
- Dark and light themes (`theme`), switched in place by one host attribute;
  the light palette keeps rig yellow as the fill and draws yellow-as-text in
  a dark amber that passes WCAG AA.
- **Copy code** starts with a comment naming the rig (`// scrub — Scroll
  scrub`), and the button and its toast say which rig was copied. String
  values and the heading escape control, line-separator and bidi characters.

### React — `motionrig/react`

- `useRig(values)` — a `useSyncExternalStore`-based hook; identity changes
  only when that rig changes; server/first-paint snapshot is always the
  code defaults, so there's no hydration mismatch.
- `RigPanel` — mounts the panel once behind the gate and renders nothing
  (the theme is set with `configure({ theme })`).

### CLI — `motionrig apply`

- Applies a share link, a raw payload, or a file holding either, back to the
  source: finds each tuned `rig()`'s object literal and patches only the
  values that changed, plus matching `var(--name, fallback)` CSS text, with
  comments, formatting and every other property left untouched.
- A palette ease is written as its identifier (`EASE_FLOW`) only when the
  file already imports or declares it; otherwise as the quoted name, with a
  note in the report.
- `--root` (a missing or non-directory root is bad input), `--dry-run`,
  `--force`; exit codes `0`/`1`/`2`; zero runtime dependencies (its own
  scanner, no TypeScript compiler API).

### Size (gzip)

`rig` + `configure` ≤ 3 kB, the whole core ≤ 4 kB, `motionrig/react` ≤ 1 kB,
the panel (lazy-loaded) ≤ 28 kB — enforced in CI via `size-limit`.
