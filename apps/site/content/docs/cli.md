---
title: CLI
description: "npx motionrig apply: arguments, flags, exit codes, and what it can and can't patch in your source."
---

```sh
npx motionrig apply <link | payload | file> [--root <dir>] [--dry-run] [--force]
```

Writes a [share link](/docs/handoff#share-link) into your source: only the changed values in each tuned `rig()` call, plus the `var()` fallbacks of [CSS rigs](/docs/css-variables). Formatting and comments stay. Node {{node}}, no dependencies.

| Argument or flag | Description |
|---|---|
| `<link \| payload \| file>` | A share URL, the raw payload, or a file holding either. |
| `--root <dir>` | Where to search. Default: the current directory; `node_modules`, `dist`, `build`, `.next` and other output folders are skipped. |
| `--dry-run` | Report changes, write nothing. |
| `--force` | Apply even when the code default changed since tuning. |
| `--help`, `-h` | Usage. |
| `--version`, `-v` | Installed version. |

Exit codes: `0` all applied, `1` something not found, ambiguous or skipped, `2` bad input.

## What it can patch

- `rig('id', { … })` calls with a string-literal id, in `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.mts` and `.cts`.
- Literal and bare-identifier values. Spreads, computed keys and renamed imports are reported, never guessed.
- An id found in two files is reported as ambiguous and skipped.
- [Named eases](/docs/eases#your-named-eases) become their constant only where the file imports it.
- CSS fallbacks in `.css`, `.scss`, `.sass` and `.less`.
