---
title: Controls
description: How each value gets its control, and how to set labels, ranges, units, selects, groups and order.
---

Every value gets a control, picked from its default:

| Default value | Control |
|---|---|
| `true` / `false` | Toggle |
| A number | Slider and number field |
| An ease: `'power2.out'`, `'ease-out'`, `'cubic-bezier(…)'` | Curve menu and editor, see [Eases](/docs/eases) |
| A colour: `'#ffd400'`, `'rgb(…)'`, `'oklch(…)'`… | Colour picker |
| Any other string | Text field |
| A string or number with `options` | Select |

A slider's range comes from the default: `0` to 3× (`24` gives `0…72`), mirrored for negatives. Nested objects become groups. Arrays, functions and `null` are left alone and never shown.

## Customize

Set options per value in `meta.controls`, keyed by dotted path:

```ts motion/card.ts
export const CARD = rig('card', {
  lift: 8,
  mode: 'fade',
  enter: { rows: 12, gap: 0.04 },
  debug: false,
}, {
  controls: {
    lift: { unit: 'px', min: -40, max: 40, step: 1, hint: 'How far it rises' },
    mode: { options: ['fade', 'slide', { label: 'scale up', value: 'scale' }] },
    enter: { label: 'Entrance' }, // a group takes a label and a hint
    'enter.gap': { unit: 's' },
    debug: false, // hidden
  },
});
```

| Option | Type | Description |
|---|---|---|
| `label` | `string` | The name in the panel. Default: the key. |
| `hint` | `string` | One line under the control or group heading. |
| `min`, `max` | `number` | The slider's range. The number field accepts values outside it. |
| `step` | `number` | Slider and arrow-key step. Default: about 1/300 of the range. |
| `unit` | `string` | Shown after the value, and appended in [CSS variables](/docs/css-variables). |
| `options` | `Option[]` | Makes a select. An option is a string, a number or `{ label, value }`. |
| `group` | `string` | A sub-heading to list the control under. |
| `type` | `ControlType` | Forces a control: `'number'`, `'toggle'`, `'select'`, `'ease'`, `'color'` or `'text'`. |
| `flavour` | `'gsap' \| 'css'` | For an ease: the syntax the panel writes. See [Eases](/docs/eases). |

`false` instead of an object hides the value.

## Order

Paths listed in `controls` come first, in that order; the rest follow in key order. **Copy code** keeps your object's own order.
