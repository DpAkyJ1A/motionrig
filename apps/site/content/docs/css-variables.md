---
title: CSS variables
description: Tune CSS transitions and keyframes by binding a rig to custom properties, with your stylesheet's fallbacks as the defaults.
---

For CSS transitions and `@keyframes`, set `css` on the rig. Tuned values are written to `:root` as custom properties; your stylesheet reads them through `var()` with its own fallback:

```ts faq.ts
rig('faq', { duration: 0.7, ease: 'ease-out', lift: 12 }, {
  css: { prefix: 'faq-' }, // or css: true, for no prefix
  controls: { duration: { unit: 's' }, lift: { unit: 'px' } },
});
```

```css faq.css
.faq {
  transition-duration: var(--faq-duration, 0.7s);
  transition-timing-function: var(--faq-ease, ease-out);
  translate: 0 calc(-1 * var(--faq-lift, 12px));
}
```

- **Only changed values are written**, so the CSS fallback stays the source of truth and a reset restores it.
- **Names** are `--` + prefix + kebab-case path: `enter.fadeDuration` → `--faq-enter-fade-duration`.
- **Give lengths and times a `unit`**: a bare `0.9` isn't a duration, and the browser drops it.
- **Eases** are written as CSS: `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Copy code** gives the custom properties; `npx motionrig apply` updates the fallbacks in `.css`, `.scss`, `.sass` and `.less`.

Values containing `;`, `{`, `}` or an unclosed bracket are never written.

Recipes: [CSS transition](/examples#css-transition), [@keyframes loop](/examples#keyframes).
