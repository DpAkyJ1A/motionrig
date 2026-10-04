import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { configure } from 'motionrig';
import { EASES } from './eases';

gsap.registerPlugin(useGSAP, CustomEase, ScrollTrigger, SplitText);

// Palette names become real GSAP eases. Registering CustomEase also lets GSAP read
// the bare "x1,y1,x2,y2" strings the panel writes for a custom curve.
for (const [name, def] of Object.entries(EASES)) CustomEase.create(name, def.bezier.join(','));

// Forced on so every visitor gets the panel. A product site leaves the gate to `?rig`.
configure({ enabled: true, locale: 'en', eases: EASES });

// Loading a URL with a #hash: ScrollTrigger's first refresh saves and restores the scroll
// position mid-way through the browser's smooth scroll to the target, which stops it short.
// Land on the target once that refresh is done.
if (typeof window !== 'undefined' && location.hash) {
  const land = () => {
    ScrollTrigger.removeEventListener('refresh', land);
    let id = location.hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {} // A malformed hash (`#%zz`) would throw inside ScrollTrigger's refresh.
    document.getElementById(id)?.scrollIntoView({ behavior: 'instant' });
  };
  ScrollTrigger.addEventListener('refresh', land);
}

export { gsap, ScrollTrigger, SplitText, useGSAP };

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
