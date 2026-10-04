import path from 'node:path';
import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';

export default function config(phase: string): NextConfig {
  // og/twitter image URLs are absolute (layout.tsx). Off Vercel, a build without SITE_URL
  // would bake the localhost fallback into every link preview, so say so loudly.
  const env = process.env;
  // Next evaluates the config more than once per build (in fresh module scopes); the
  // environment is what they share, so it carries the "already warned" mark.
  if (phase === PHASE_PRODUCTION_BUILD && !env.SITE_URL && !env.VERCEL_PROJECT_PRODUCTION_URL && !env.MOTIONRIG_SITE_URL_WARNED) {
    env.MOTIONRIG_SITE_URL_WARNED = '1';
    process.emitWarning('SITE_URL is not set: og:image and twitter:image will point at http://localhost:4321.', {
      code: 'MOTIONRIG_SITE_URL',
    });
  }
  return {
    reactStrictMode: true,
    // No `X-Powered-By: Next.js` on every response: it only tells a scanner what to try.
    poweredByHeader: false,
    // The workspace root holds the lockfile and the linked `motionrig` package.
    turbopack: { root: path.join(__dirname, '../..') },
  };
}
