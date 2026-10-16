import type { Metadata, Viewport } from 'next';
import { Anybody, Martian_Mono, Schibsted_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';
import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import { Analytics } from '@/components/Analytics/Analytics';
import { BackForward } from '@/components/BackForward/BackForward';
import { PanelMount } from '@/components/PanelButton/PanelMount';
import { pageMeta } from '@/meta';
import './globals.css';

const display = Anybody({ subsets: ['latin'], axes: ['wdth'], variable: '--font-anybody' });
const text = Schibsted_Grotesk({ subsets: ['latin'], variable: '--font-schibsted' });
const mono = Martian_Mono({ subsets: ['latin'], axes: ['wdth'], variable: '--font-martian', preload: false });

// Vercel names the production origin; elsewhere set SITE_URL. Relative OG and Twitter image URLs resolve against it.
const origin =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:4321');

// The category goes in the title: "motionrig" alone is also the name of an Unreal Engine tool.
const title = 'motionrig — a live tuning panel for web animations';
const description =
  'Wrap animation constants in rig() and designers tune them on your live site (GSAP, CSS, Motion, WebGL), then ship the values back to code.';

// The home page's tags; a page without its own (the 404, which Next marks noindex) inherits them.
export const metadata: Metadata = { metadataBase: new URL(origin), ...pageMeta('/', title, description) };

export const viewport: Viewport = {
  themeColor: '#1f2226',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // data-scroll-behavior: Next 16 only turns smooth scrolling off for route changes when asked,
    // and a smooth scroll to the top of a new page gets cut short.
    <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${text.variable} ${mono.variable}`}>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
        <PanelMount />
        <BackForward />
        <Analytics />
        <VercelAnalytics />
      </body>
    </html>
  );
}
