import { Ring } from '@/components/Ring/Ring';
import s from './HowItWorks.module.css';

/** The share link's trip: one URL, opened in any browser, applied by one command. */
export function ShareFlow() {
  return (
    <ol className={s.flow} aria-label="What one share link does">
      <li className={s.flowNode}>
        <span className={s.flowKind}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M6.5 9.5 9.5 6.5M7 4.5l1.2-1.2a2.8 2.8 0 0 1 4 4L11 8.5M9 11.5l-1.2 1.2a2.8 2.8 0 0 1-4-4L5 7.5" />
          </svg>
          One link
        </span>
        <code className={s.flowUrl}>your-site.com/?rig=eyJ2IjoxLCJv…</code>
        <span className={s.flowNote}>Every tweak of every rig, each with its baseline.</span>
      </li>
      <li className={s.flowNode}>
        <span className={s.flowKind}>
          <Ring size={14} strokeWidth={2.4} />
          Any browser
        </span>
        <span className={s.flowWindow} aria-hidden="true">
          <i />
          <i />
          <i />
          <b>your-site.com/?rig</b>
        </span>
        <span className={s.flowNote}>Anyone opens it and sees the exact tuning, live, on the real page.</span>
      </li>
      <li className={s.flowNode}>
        <span className={s.flowKind}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m3.5 5 3 3-3 3M8.5 11.5h4" />
          </svg>
          One command
        </span>
        <code className={s.flowUrl}>npx motionrig apply &lt;link&gt;</code>
        <span className={s.flowNote}>Only the tuned values change in the source: a diff to review.</span>
      </li>
    </ol>
  );
}
