---
title: Handoff
description: Get tuned values back into code with Copy code, a share link, or npx motionrig apply.
---

## Copy code

**Copy code**, at the bottom of a tab, copies the rig as an object literal to paste over yours. It keeps your key order and prints [named eases](/docs/eases#your-named-eases) as constants:

```ts
// hero — Hero headline
{
  duration: 0.75,
  ease: EASE_SETTLE,
  y: 24,
}
```

A [CSS rig](/docs/css-variables) copies custom properties instead. On plain HTTP, like a phone on your dev server, the panel falls back to an older clipboard method, then to showing the text.

## Share link

**Share link**, the link icon in the header, copies the page URL with **every tweak of every rig**. Opening it merges those values over the viewer's own.

Links stay under 8,000 characters (about 80–280 tweaks). Past that, the panel copies the raw payload and says so: apply it with the CLI, or paste it into the panel's search.

## Apply with the CLI

`motionrig apply` finds each tuned `rig('id', { … })` call and rewrites only the changed values, keeping formatting and comments:

```sh
# see what would change
npx motionrig apply "https://staging.example.com/?rig=eyJ2IjoxLC…" --dry-run

# write it
npx motionrig apply "https://staging.example.com/?rig=eyJ2IjoxLC…"
```

A value whose code default changed since tuning is skipped with a warning, so a newer change is never overwritten. Flags and limits: [CLI](/docs/cli).
