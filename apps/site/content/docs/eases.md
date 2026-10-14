---
title: Eases
description: Which strings become ease controls, what the curve editor writes, why GSAP needs CustomEase, and how to add your own named curves.
---

A string gets an ease control when it is a GSAP ease (`power2.out`, `back.inOut(1.7)`), CSS easing (`ease-out`, `cubic-bezier(…)`, `steps(…)`, `linear(…)`), a bare bezier (`'0.25,0.1,0.25,1'`) or one of [your named eases](#your-named-eases). The control has a curve menu and a bezier editor: drag the handles, or paste four numbers.

A custom curve is written in the value's own syntax, its **flavour**:

| Flavour | Used for | A custom curve is written as |
|---|---|---|
| `gsap` | GSAP names, bare beziers, your named eases | `'0.16,1,0.3,1'` |
| `css` | CSS syntax, and every ease in a [CSS rig](/docs/css-variables) | `'cubic-bezier(0.16, 1, 0.3, 1)'` |

## GSAP needs CustomEase

> [!IMPORTANT]
> GSAP reads `'x1,y1,x2,y2'` strings and named eases only once `CustomEase` is registered. Without it, GSAP silently falls back to its default ease. motionrig doesn't import GSAP, so register the plugin yourself:

```ts
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);
```

## Your named eases

Give the panel your design system's curves. They are listed first in every ease menu, and with `code`, **Copy code** prints your constant instead of a string:

```ts motion/eases.ts
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { configure, type EaseDef } from 'motionrig';

export const EASE_SETTLE = 'settle';

export const EASES = {
  [EASE_SETTLE]: { bezier: [0.16, 1, 0.3, 1], code: 'EASE_SETTLE', label: 'Settle' },
} satisfies Record<string, EaseDef>;

// Teach GSAP the names, then give them to the panel.
gsap.registerPlugin(CustomEase);
for (const [name, def] of Object.entries(EASES)) CustomEase.create(name, def.bezier.join(','));

configure({ eases: EASES });
```

| `EaseDef` | Type | Description |
|---|---|---|
| `bezier` | `[x1, y1, x2, y2]` | The curve. An entry can also be just this tuple. |
| `code` | `string` | The identifier Copy code prints, e.g. `EASE_SETTLE`. |
| `label` | `string` | The name in the menu. Default: the key. |

`motionrig apply` writes the constant only in files that already import it; elsewhere, the quoted name.
