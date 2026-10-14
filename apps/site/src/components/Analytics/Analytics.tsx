'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import s from './Analytics.module.css';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

// Inlined at build time. With neither set (local dev, a fork) there is no banner and nothing loads.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;
const ENABLED = Boolean(GA_ID || CLARITY_ID);

const KEY = 'motionrig-consent';
const ASK = 'motionrig:consent';

type Choice = 'granted' | 'denied';

const read = (): Choice | null => {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
};

const write = (choice: Choice) => {
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    /* no storage: the choice lasts this visit */
  }
};

// GA's cookies are first-party, `_ga` and `_ga_<stream>`; consent withdrawn, they go too.
const dropGaCookies = () => {
  const host = location.hostname;
  document.cookie
    .split(';')
    .map((cookie) => cookie.trim().split('=')[0] ?? '')
    .filter((name) => name === '_ga' || name.startsWith('_ga_'))
    .forEach((name) => {
      for (const domain of ['', host, `.${host}`]) {
        document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
      }
    });
};

const TOOLS = [GA_ID && 'Google Analytics', CLARITY_ID && 'Microsoft Clarity'].filter(Boolean).join(' and ');
const WHAT = CLARITY_ID ? 'visits, clicks, scrolling and session replays' : 'visits and clicks';

/**
 * Google Analytics and Microsoft Clarity, behind a consent banner. Neither loads, and neither
 * sets a cookie, until the visitor allows it: no answer and "No thanks" look the same to both.
 * A Global Privacy Control signal counts as "No thanks" and the banner isn't shown.
 */
export function Analytics() {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (!ENABLED) return;
    const stored = read();
    const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
    setChoice(stored ?? (gpc ? 'denied' : null));
    setAsking(!stored && !gpc);

    const ask = () => setAsking(true);
    window.addEventListener(ASK, ask);
    return () => window.removeEventListener(ASK, ask);
  }, []);

  if (!ENABLED) return null;

  const decide = (next: Choice) => {
    write(next);
    setAsking(false);
    if (next === 'denied' && choice === 'granted') {
      // Both are running: tell them to stop, clear what they stored, and come back without them.
      window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      window.clarity?.('consent', false);
      dropGaCookies();
      location.reload();
      return;
    }
    setChoice(next);
  };

  return (
    <>
      {choice === 'granted' && GA_ID ? (
        <>
          {/* Consent first, then config: ads storage stays denied, this site runs no ads. */}
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});
gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        </>
      ) : null}

      {choice === 'granted' && CLARITY_ID ? (
        // Clarity's own snippet; the consent call queues until its tag has loaded.
        <Script id="clarity-init" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");
clarity('consentv2',{ad_Storage:'denied',analytics_Storage:'granted'});`}
        </Script>
      ) : null}

      {asking ? (
        <section className={s.banner} aria-label="Analytics consent">
          <p>
            I&apos;d like to see how people use this page with {TOOLS} ({WHAT}). They only load, and set
            cookies, if you allow it.
          </p>
          <div className={s.actions}>
            <button type="button" className={s.allow} onClick={() => decide('granted')}>
              Allow
            </button>
            <button type="button" className={s.deny} onClick={() => decide('denied')}>
              No thanks
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}

/** The footer's way back to the banner, to change the answer. Absent when analytics is off. */
export function ConsentButton({ className }: { className?: string }) {
  if (!ENABLED) return null;
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(ASK))}>
      Cookie settings
    </button>
  );
}
