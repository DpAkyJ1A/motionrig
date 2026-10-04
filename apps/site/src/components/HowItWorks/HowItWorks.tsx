import { CodeBlock } from '@/components/Code/CodeBlock';
import { PanelButton } from '@/components/PanelButton/PanelButton';
import sec from '@/components/Section/Section.module.css';
import s from './HowItWorks.module.css';
import { PanelAnatomy } from './PanelAnatomy';
import { ShareFlow } from './ShareFlow';

const RIG_CODE = `import { rig } from 'motionrig';

export const HERO = rig('hero', {
  stagger: 0.028,
  duration: 1.1,
  ease: EASE_SETTLE,
  rise: 110,
}, {
  title: 'Hero headline',
  note: 'Letters rise when the page loads. Press Replay to see an edit.',
  applies: 'replay',
  replay: () => play(),
  target: '[data-rig~="hero"]',
  controls: { stagger: { unit: 's', max: 0.2 } },
});

// Your animation keeps reading the same object, at play time.
gsap.fromTo(chars, { yPercent: HERO.rise }, {
  yPercent: 0,
  duration: HERO.duration,
  ease: HERO.ease,
  stagger: HERO.stagger,
});`;

export function HowItWorks() {
  return (
    <section className={sec.section} id="how" aria-labelledby="how-title">
      <header className={sec.head}>
        <h2 id="how-title" className={`${sec.title} ${sec.narrow}`} data-rig="type">
          Rig it in code. Play it on the site. Ship it back.
        </h2>
        <p className={sec.lead}>
          One plain object makes the whole trip. Nothing is generated, nothing is locked to an engine, and the
          developer’s code stays the source of truth.
        </p>
      </header>

      <ol className={s.steps}>
        <li className={s.step}>
          <div className={s.text}>
            <span className={s.num}>1</span>
            <h3>Rig</h3>
            <p>
              Wrap the constant your animation already reads. <code>rig()</code> returns the very same object, so{' '}
              <code>HERO.duration</code> keeps working in GSAP, CSS, a canvas loop, anything.
            </p>
            <p>
              Meta is optional and written for the designer: a title, a note saying where to look, units, ranges and
              groups for the controls.
            </p>
            <p className={s.fine}>
              On the server <code>rig()</code> is an identity function. In the browser it only registers the object
              until the panel is switched on.
            </p>
          </div>
          <CodeBlock code={RIG_CODE} label="The hero on this page, abridged" />
        </li>

        <li className={s.step}>
          <div className={s.text}>
            <span className={s.num}>2</span>
            <h3>Play</h3>
            <p>
              The designer opens the real site with <code>?rig</code> and gets the panel, on the page, in the browser
              they review in. Every rig explains itself in their language.
            </p>
            <PanelButton id="hero" className={s.try}>
              Open the real one on this page
            </PanelButton>
          </div>
          <PanelAnatomy />
        </li>

        <li className={s.step}>
          <div className={s.text}>
            <span className={s.num}>3</span>
            <h3>Ship</h3>
            <p>
              When it feels right, the designer presses <strong className={s.em}>Share link</strong>. That one URL is
              the whole handoff:
            </p>
            <ul className={s.ways}>
              <li>
                It carries <strong>every tweak of every rig</strong>, each with the code default it was tuned
                against.
              </li>
              <li>
                <strong>Anyone can open it</strong> and see the exact tuning, live, in their own browser: the lead,
                the client, the developer.
              </li>
              <li>
                The developer runs <code>npx motionrig apply &lt;link&gt;</code> and the values land in the{' '}
                <code>rig()</code> literals and <code>var(--x, fallback)</code> fallbacks, and nothing else.
              </li>
            </ul>
            <p className={s.fine}>
              For one rig, <strong>Copy code</strong> prints the tuned object, ready to paste over the old one.
            </p>
          </div>
          <div className={s.shipCol}>
            <ShareFlow />
          </div>
        </li>
      </ol>
    </section>
  );
}
