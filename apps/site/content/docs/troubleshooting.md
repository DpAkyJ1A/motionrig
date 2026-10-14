---
title: Troubleshooting
description: Fixes for the common problems, and answers about cost, SSR, security and link length.
---

## Problems

### `?rig` shows no panel

Nothing mounts it: render [`<RigPanel />`](/docs/react#rigpanel) or call [`mountPanel()`](/docs/runtime#panel). Also check for `enabled: false` or a renamed `param`.

### A rig's tab is missing

Its module never ran on this page. Import every rig module in `preload`.

### An edit doesn't show

Your code read the value once. Read it at play time, add a `replay`, rebuild in `onChange`, or use `useRig`. See [Live updates](/docs/live-updates).

### A custom curve does nothing in GSAP

Register GSAP's `CustomEase` plugin. See [Eases](/docs/eases#gsap-needs-customease).

### A CSS rig changes nothing

The stylesheet must read `var(--name, fallback)` with the rig's name, and numbers need a `unit`. See [CSS variables](/docs/css-variables).

### A tweak disappeared after a deploy

Its code default changed, so it was dropped on purpose: [code wins](/docs/panel#persistence).

### `motionrig apply` says "not found" or "ambiguous"

The id has to be a string literal, in exactly one file under `--root`. See [CLI](/docs/cli#what-it-can-patch).

### "Invalid hook call" right after installing, on Vite

Vite pre-bundled `motionrig/react` with a second React while running. Restart with `vite --force`.

## FAQ

### Does it cost my visitors anything?

{{size.core}} gzipped for `rig` and `configure`. Without `?rig` nothing is read from storage or rendered, and the panel ({{size.panel}}) is never downloaded.

### Does it work with SSR and Server Components?

Yes. On the server `rig()` returns the object untouched; `useRig` renders code defaults first, so hydration matches.

### Is `?rig` secure?

It's not access control: anyone can add it to a URL. Saved and shared values are type-checked against your defaults and unsafe CSS is dropped, but don't rig anything a visitor shouldn't change.

### How many tweaks fit in a share link?

About 80–280; links stay under 8,000 characters. Past that, the panel copies the raw payload for `motionrig apply`. See [Share link](/docs/handoff#share-link).

### Which browsers?

Current Chrome, Edge, Firefox and Safari. The CLI runs on Node {{node}}.
