---
title: The panel
description: How designers open the panel, what is in it, and how tweaks are saved so the code always wins.
---

## Open it

- **Add `?rig` to any URL.** It stays on for the rest of the tab, through reloads and navigation; `?rig=off` turns it off.
- **Press `Alt+R`** or click the ring in the corner; `Esc` collapses it. Change the key with [`hotkey`](/docs/configure#hotkey).
- **Keep it on** in development or on staging with [`configure({ enabled: true })`](/docs/configure).
- **Open it from your own UI** with [`openPanel('hero')`](/docs/runtime#panel).

Visitors without `?rig` never download the panel.

## What's in it

- **Tabs**, one per rig. A dot marks tweaked tabs, **new** marks unopened ones.
- **A badge** says when an edit shows: **live**, **on next play** or **after reload** ([Live updates](/docs/live-updates)).
- **Replay** plays the animation again; **Reload** reloads the page for `applies: 'reload'` rigs.
- **Locate** scrolls to the element the rig animates (`meta.target`) and outlines it.
- **Search** finds rigs and values. Paste a share link into it to import it.
- **Reset** a value (↺, or double-click its label), a tab, or everything.
- **Copy code** and **Share link** hand the values back ([Handoff](/docs/handoff)).

On desktop it floats and drags by its header; on phones it's a bottom sheet. It moves aside when it would cover the element a tab animates. Theme: [`theme`](/docs/configure#theme).

## Saved tweaks: code wins {#persistence}

Tweaks are saved in `localStorage` with the code default they were tuned against. **When the code ships a new default, the old tweak is dropped** instead of fighting it. Share links and `motionrig apply` use the same check.

If storage is blocked, the panel still works and saves nothing.

> [!NOTE]
> `?rig` is not access control: anyone can add it to a URL. Don't rig anything a visitor shouldn't change.
