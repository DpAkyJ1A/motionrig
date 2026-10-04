import type { CSSProperties, ReactNode } from 'react';
import { highlightLines } from '@/components/Code/highlight';
import sec from '@/components/Section/Section.module.css';
import s from './Handoff.module.css';
import { Reveal } from './Reveal';

type Who = 'designer' | 'dev';
type Msg = { who: Who; at: number; time: string; body: ReactNode; bare?: boolean };

/** One beat of a chat: `at` is when it lands, in seconds from the chat's start; the other side types first. */
function Bubble({ who, at, time, body, bare }: Msg) {
  const mine = who === 'dev';
  return (
    <li className={s.slot} data-mine={mine || undefined} style={{ '--at': `${at}s` } as CSSProperties}>
      {!mine && (
        <span className={s.avatar} aria-hidden="true">
          M
        </span>
      )}
      {!mine && (
        <span className={s.typing} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )}
      <div className={bare ? `${s.bubble} ${s.bare}` : s.bubble}>
        {body}
        <span className={s.meta}>
          {time}
          {mine && (
            <svg viewBox="0 0 18 10" width="16" height="9" role="img" aria-label="Read">
              <path d="M1 5.5 4 8.5 10.5 1.5M7.5 8.5 14 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </div>
    </li>
  );
}

function Chat({ label, tone, wait, messages, children }: { label: string; tone: 'before' | 'after'; wait: string; messages: Msg[]; children?: ReactNode }) {
  return (
    <Reveal className={s.chat}>
      <figure className={s.window} data-tone={tone} style={{ '--wait': `var(${wait})` } as CSSProperties}>
        <figcaption className={s.bar}>
          <span className={s.tag}>{label}</span>
          <span className={s.peer}>
            <span className={s.avatar} aria-hidden="true">
              M
            </span>
            <span>
              Mia <small>designer</small>
            </span>
          </span>
        </figcaption>
        <ol className={s.feed}>
          {messages.map((m, i) => (
            <Bubble key={i} {...m} />
          ))}
          {children}
        </ol>
      </figure>
    </Reveal>
  );
}

const PAYLOAD = 'eyJ2IjoxLCJvIjp7ImdyaWRSZXZlYWwiOnsiZmxpZ2h0IjowLjcyLCJlYXNlIjoicG93ZXI0Lm91dCJ9LCJmYXEiOnsiZmFxLWR1cmF0aW9uIjowLjU1fX0sImIiOnsiZ3JpZFJldmVhbCI6eyJmbGlnaHQiOjAuODgsImVhc2UiOiJleHBvLm91dCJ9LCJmYXEiOnsiZmFxLWR1cmF0aW9uIjowLjd9fSwiY3NzIjp7ImZhcSI6eyItLWZhcS1kdXJhdGlvbiI6IjAuNTVzIn19fQ';
const SITE = 'bestwebsite.studio';
const LINK = `${SITE}/?rig=${PAYLOAD.slice(0, 16)}…`;

const BEFORE: Msg[] = [
  { who: 'designer', at: 1, time: '10:42', body: 'Looks great! Could the animation feel a bit less… sticky? Lighter, sort of.' },
  {
    who: 'dev',
    at: 1.9,
    time: '11:20',
    body: (
      <>
        <span className={s.video} role="img" aria-label="Video, 4 seconds">
          <i />
          <b>0:04</b>
        </span>
        Like this?
      </>
    ),
  },
  { who: 'designer', at: 3.2, time: '11:31', body: 'Hmm, not quite. I can’t put it into words… more alive?' },
];

const LATER: Msg[] = [
  { who: 'designer', at: 4.9, time: '16:05', body: 'Can we go back to Tuesday’s version?' },
  { who: 'dev', at: 5.6, time: '16:12', body: 'Which of the five?' },
];

const AFTER: Msg[] = [
  { who: 'dev', at: 0.4, time: '10:42', body: 'Animation’s live — have a look' },
  {
    who: 'designer',
    at: 1.6,
    time: '10:51',
    body: (
      <>
        <span className={s.link}>
          <span className={s.linkSite}>{SITE}</span>
          <span className={s.linkTitle}>Work — tuned with motionrig</span>
          <span className={s.linkUrl}>{LINK}</span>
        </span>
        like this — perfect
      </>
    ),
  },
  { who: 'dev', at: 2.4, time: '10:52', body: <span className={s.emoji}>🤝</span>, bare: true },
];

// The real output of `motionrig apply` on a scratch copy of three files, and the change it made.
const COMMAND = `npx motionrig apply 'https://${LINK}'`;
const OUTPUT = `gridReveal  src/hooks/useGridReveal.ts
  flight  0.88 → 0.72
  ease  'expo.out' → 'power4.out'

faq  src/views/About/faq.rig.ts
  faq-duration  0.7 → 0.55

css
  --faq-duration  0.7s → 0.55s  (src/views/About/FAQ.module.css)

Summary: 4 applied.`;

const DIFF: { file: string; lang: 'ts' | 'css'; lines: [' ' | '-' | '+', string][] }[] = [
  {
    file: 'src/hooks/useGridReveal.ts',
    lang: 'ts',
    lines: [
      [' ', "export const GRID_REVEAL = rig('gridReveal', {"],
      [' ', '  beat: 4.6,'],
      ['-', '  flight: 0.88,'],
      ['+', '  flight: 0.72,'],
      [' ', '  step: 0.032,'],
      ['-', "  ease: 'expo.out',"],
      ['+', "  ease: 'power4.out',"],
      [' ', '});'],
    ],
  },
  {
    file: 'src/views/About/faq.rig.ts',
    lang: 'ts',
    lines: [
      ['-', "rig('faq', { 'faq-duration': 0.7, 'faq-ease': 'cubic-bezier(1, 0, 0, 1)' }, { css: true });"],
      ['+', "rig('faq', { 'faq-duration': 0.55, 'faq-ease': 'cubic-bezier(1, 0, 0, 1)' }, { css: true });"],
    ],
  },
  {
    file: 'src/views/About/FAQ.module.css',
    lang: 'css',
    lines: [
      [' ', '.answer {'],
      ['-', '  transition: grid-template-rows var(--faq-duration, 0.7s) var(--faq-ease, cubic-bezier(1, 0, 0, 1));'],
      ['+', '  transition: grid-template-rows var(--faq-duration, 0.55s) var(--faq-ease, cubic-bezier(1, 0, 0, 1));'],
      [' ', '}'],
    ],
  },
];

function Terminal() {
  return (
    <Reveal className={s.termWrap}>
      <figure className={s.term} aria-label="The developer applies the link">
        <figcaption className={s.termBar}>
          <span aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          zsh — the developer, after the 🤝
        </figcaption>
        <div className={s.termBody}>
          <div className={s.run}>
            <p className={s.cmd}>
              <span className={s.prompt}>$</span> <span className={s.typed}>{COMMAND}</span>
            </p>
            <pre className={s.out}>
              {OUTPUT.split('\n').map((line, i) => (
                <span key={i} style={{ '--i': i } as CSSProperties}>
                  {line}
                  {'\n'}
                </span>
              ))}
            </pre>
          </div>
          <div className={s.diffs}>
            {DIFF.map((f) => {
              const html = highlightLines(f.lines.map((l) => l[1]).join('\n'), f.lang);
              return (
                <div key={f.file} className={s.file}>
                  <p className={s.fileName}>{f.file}</p>
                  <pre className={s.diff} tabIndex={0} aria-label={`Diff of ${f.file}`}>
                    {f.lines.map(([k], i) => (
                      <span key={i} className={k === '-' ? s.del : k === '+' ? s.ins : undefined}>
                        <span className={s.sign}>{k === '-' ? '−' : k}</span> {html[i]}
                        {'\n'}
                      </span>
                    ))}
                  </pre>
                </div>
              );
            })}
          </div>
        </div>
      </figure>
    </Reveal>
  );
}

export function Handoff() {
  return (
    <section className={sec.section} id="handoff" aria-labelledby="handoff-title">
      <header className={sec.head}>
        <h2 id="handoff-title" className={`${sec.title} ${sec.wide}`} data-rig="type">
          Stop describing motion. Send it.
        </h2>
        <p className={sec.lead}>
          Feedback on motion is the slowest loop in a project: adjectives one way, screen recordings the other. With
          motionrig the designer tunes it on the real site and sends back the motion itself.
        </p>
      </header>
      <div className={s.chats}>
        <Chat label="Before" tone="before" wait="--wait-before" messages={BEFORE}>
          <li className={s.gap} style={{ '--at': '4.2s' } as CSSProperties}>
            <span>Thursday · 14 messages later</span>
          </li>
          {LATER.map((m, i) => (
            <Bubble key={i} {...m} />
          ))}
        </Chat>
        <Chat label="After · with motionrig" tone="after" wait="--wait-after" messages={AFTER} />
      </div>
      <Terminal />
    </section>
  );
}
