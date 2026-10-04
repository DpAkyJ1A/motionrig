import { PanelButton } from '@/components/PanelButton/PanelButton';
import { Ring } from '@/components/Ring/Ring';
import sec from '@/components/Section/Section.module.css';
import s from './Closing.module.css';

export function Closing() {
  return (
    <section className={sec.section} aria-labelledby="closing-title">
      <div className={s.card}>
        <h2 id="closing-title" className={s.title} data-rig="type">
          Hand the feel to your designer.
        </h2>
        <p className={s.lead}>
          The panel on this page is the real one. Open it, tune anything you have seen above, and copy the result as
          code.
        </p>
        <div className={s.ctas}>
          <PanelButton className={s.primary}>
            <Ring size={18} strokeWidth={2.4} />
            Try the panel on this page
          </PanelButton>
          <a className={s.secondary} href="#quickstart">
            Read the quickstart ↑
          </a>
        </div>
        <p className={s.note}>v0.1 is on its way to npm · MIT licensed</p>
      </div>
    </section>
  );
}
