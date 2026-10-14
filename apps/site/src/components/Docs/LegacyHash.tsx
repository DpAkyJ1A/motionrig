'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * The docs used to be one page, so links out there point at /docs#<section>. Each old
 * anchor goes on to the page that has it now; a hash this page owns stays put.
 */
const MOVED: Record<string, string> = {
  start: '/docs/installation',
  install: '/docs/installation',
  setup: '/docs/installation#setup',
  'setup-next': '/docs/installation#setup-next',
  'setup-react': '/docs/installation#setup-react',
  'setup-vanilla': '/docs/installation#setup-vanilla',
  loop: '/docs#how-it-works',
  internals: '/docs#how-it-works',
  rig: '/docs/rig',
  meta: '/docs/rig#meta',
  types: '/docs/rig',
  applies: '/docs/live-updates',
  controls: '/docs/controls',
  inference: '/docs/controls',
  eases: '/docs/eases',
  css: '/docs/css-variables',
  configure: '/docs/configure',
  theme: '/docs/configure#theme',
  panel: '/docs/panel',
  anatomy: '/docs/panel#whats-in-it',
  tabs: '/docs/panel#whats-in-it',
  locate: '/docs/panel#whats-in-it',
  gate: '/docs/panel#open-it',
  persistence: '/docs/panel#persistence',
  shipping: '/docs/handoff',
  share: '/docs/handoff',
  cli: '/docs/cli',
  react: '/docs/react',
  'use-rig': '/docs/react#userig',
  'rig-panel': '/docs/react#rigpanel',
  runtime: '/docs/runtime',
  'panel-api': '/docs/runtime#panel',
  store: '/docs/runtime#store',
  faq: '/docs/troubleshooting',
};

export function LegacyHash() {
  const router = useRouter();
  useEffect(() => {
    const to = MOVED[location.hash.slice(1)];
    if (to) router.replace(to);
  }, [router]);
  return null;
}
