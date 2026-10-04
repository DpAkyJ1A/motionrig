import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { highlightLines, langOf } from '@/components/Code/highlight';
import { CodeTabs, type FileMeta } from '@/components/Examples/CodeTabs';
import { type DiffLine, diffLines } from '@/components/Examples/diff';
import { ExampleDemo } from '@/components/Examples/ExampleDemo';
import { RefreshOnResize } from '@/components/Examples/RefreshOnResize';
import s from '@/components/Examples/Examples.module.css';
import { Footer } from '@/components/Footer/Footer';
import { Nav } from '@/components/Nav/Nav';
import p from '@/components/Page/Page.module.css';
import { PanelButton } from '@/components/PanelButton/PanelButton';
import { Fire } from '@/components/Fire/Fire';
import { Ring } from '@/components/Ring/Ring';
import sec from '@/components/Section/Section.module.css';
import { SideNav } from '@/components/SideNav/SideNav';
import { EXAMPLES, type Example } from '@/examples/registry';
import { pageMeta } from '@/meta';

export const metadata: Metadata = pageMeta(
  '/examples',
  'Examples — motionrig',
  'Rig the animation you already have: CSS transitions and keyframes, GSAP tweens, timelines and ScrollTrigger, Motion springs, WAAPI, canvas loops and React state. Live demos with the diff.',
);

// The page shows the very files its demos run: read at build time from src/examples.
const ROOT = path.join(process.cwd(), 'src/examples');
const read = (file: string) => fs.readFileSync(file, 'utf8').replace(/\n$/, '');

function load(ex: Example) {
  return ex.files.map((name) => {
    const code = read(path.join(ROOT, ex.slug, name));
    const beforePath = path.join(ROOT, ex.slug, 'before', name);
    const isNew = !fs.existsSync(beforePath);
    const before = isNew ? '' : read(beforePath);
    const lines: DiffLine[] = isNew
      ? code.split('\n').map((text, b) => ({ kind: 'add', text, b }))
      : diffLines(before, code);
    const lang = langOf(name) ?? 'ts';
    // Each side is highlighted as a whole file, so comments and templates that span lines stay right.
    const html = { a: highlightLines(before, lang), b: highlightLines(code, lang) };
    const meta: FileMeta = {
      name,
      code,
      isNew,
      added: lines.filter((l) => l.kind === 'add').length,
      removed: lines.filter((l) => l.kind === 'del').length,
    };
    return { meta, lines: lines.map((l) => ({ ...l, html: l.b !== undefined ? html.b[l.b] : html.a[l.a!] })) };
  });
}

/** `when` marks inline code with backticks. */
const inline = (text: string) => text.split('`').map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part));

const SIGN = { same: ' ', add: '+', del: '−' } as const;

function Pane({ lines, label, fresh }: { lines: (DiffLine & { html?: ReactNode })[]; label: string; fresh: boolean }) {
  return (
    <pre className={fresh ? `${s.pre} ${s.fresh}` : s.pre} tabIndex={0} aria-label={label}>
      <code>
        {lines.map((l, i) => (
          <span key={i} className={l.kind === 'same' ? s.line : `${s.line} ${s[l.kind]}`} data-kind={l.kind}>
            <span className={s.sign}>{SIGN[l.kind]}</span>
            {l.html}
            {'\n'}
          </span>
        ))}
      </code>
    </pre>
  );
}

export default function ExamplesPage() {
  return (
    <>
      <Nav page="examples" />
      <main id="main">
        <header className={p.intro}>
          <p className={p.kicker}>
            <Ring size={16} strokeWidth={2.4} /> Examples · {EXAMPLES.length} recipes
          </p>
          <h1 className={`${sec.title} ${sec.widest} ${p.introTitle}`} data-rig="type">
            Rig the animation you already have
          </h1>
          <p className={sec.lead}>
            One recipe per engine. Each demo runs on this page: press <b>Tune</b> and change it while it plays. The
            code is the code running here, shown as the change from before to rigged. Every option is in the{' '}
            <Link href="/docs">docs</Link>.
          </p>
        </header>

        <div className={p.layout}>
          <SideNav
            items={EXAMPLES.map((ex, i) => ({ id: ex.slug, label: ex.nav, meta: String(i + 1).padStart(2, '0'), hot: ex.hot }))}
            title="Examples"
            mobile="chips"
          />
          <div className={`${p.content} ${s.list}`} data-examples>
            {EXAMPLES.map((ex, i) => {
              const files = load(ex);
              return (
                <section key={ex.slug} id={ex.slug} className={s.example} data-hot={ex.hot || undefined} aria-labelledby={`${ex.slug}-title`}>
                  <header className={s.head}>
                    <p className={s.num}>
                      {String(i + 1).padStart(2, '0')}
                      <code>rig(&apos;{ex.rig}&apos;)</code>
                      {ex.hot && (
                        <span className={s.hot}>
                          <Fire size={13} />
                          hellfire
                        </span>
                      )}
                    </p>
                    <div className={s.titleRow}>
                      <h2 id={`${ex.slug}-title`} className={s.title}>
                        {ex.title}
                      </h2>
                      <PanelButton id={ex.rig} className={s.tune} label={`Tune: ${ex.title}`}>
                        <Ring size={14} strokeWidth={2.2} />
                        Tune
                      </PanelButton>
                    </div>
                    <p className={s.when}>{inline(ex.when)}</p>
                    <p className={s.docs}>
                      <span>In the docs:</span>
                      {ex.docs.map(([label, anchor]) => (
                        <Link key={anchor + label} href={`/docs#${anchor}`}>
                          {label}
                        </Link>
                      ))}
                    </p>
                  </header>
                  <ExampleDemo slug={ex.slug} engine={ex.engine} />
                  <CodeTabs
                    id={ex.slug}
                    files={files.map((f) => f.meta)}
                    panes={files.map((f) => (
                      <Pane key={f.meta.name} lines={f.lines} label={f.meta.name} fresh={f.meta.isNew} />
                    ))}
                  />
                </section>
              );
            })}
          </div>
        </div>
        <RefreshOnResize target="[data-examples]" />
      </main>
      <Footer />
    </>
  );
}
