import Link from 'next/link';
import { Ring } from '@/components/Ring/Ring';
import { NEW_TAB, REPO } from '@/repo';
import s from './Footer.module.css';

export function Footer() {
  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <svg className={s.big} viewBox="0 0 400 400" aria-hidden="true">
          <circle cx="200" cy="215" r="150" />
          <path d="M200 65V20" />
          <circle cx="200" cy="215" r="14" className={s.hub} />
        </svg>
        <p className={s.brand}>
          <Ring size={26} className={s.logo} />
          motionrig
        </p>
        <p className={s.tag}>
          <span>Devs rig it.</span> <span>Designers play it.</span>
        </p>
        <p className={s.meta}>
          <Link href="/docs">Docs</Link>
          <Link href="/examples">Examples</Link>
          <a href={REPO} {...NEW_TAB}>
            GitHub
          </a>
          <a href={`${REPO}/issues`} {...NEW_TAB}>
            Feedback &amp; issues
          </a>
          <span>MIT licensed</span>
          <span>Made by devazx</span>
          <span>v0.1, npm soon</span>
        </p>
      </div>
    </footer>
  );
}
