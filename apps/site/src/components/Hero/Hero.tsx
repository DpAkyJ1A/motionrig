import { PanelButton } from '@/components/PanelButton/PanelButton';
import { Ring } from '@/components/Ring/Ring';
import s from './Hero.module.css';
import { HeroHud } from './HeroHud';
import { HeroStage } from './HeroStage';

export function Hero() {
  return (
    <section className={s.hero} id="top" aria-labelledby="hero-title">
      <HeroStage />
      <div className={s.copy}>
        <p className={s.pitch}>
          motionrig puts your site’s animation constants on a panel. Wrap a config object with <code>rig()</code>, and
          a designer opens the real site with <code>?rig</code>, tunes timing, curves and distances in place, then sends
          the values back as code, a share link, or a patch you apply with one command.
        </p>
        <div className={s.ctas}>
          <PanelButton id="hero" className={s.primary}>
            <Ring size={18} strokeWidth={2.4} />
            Open the panel
          </PanelButton>
          <a className={s.secondary} href="#quickstart">
            Quickstart
          </a>
        </div>
        <p className={s.aside}>
          This page is rigged. The panel is on for every visitor: the ring in the corner
          <span className={s.keys}>
            , or <kbd>Alt</kbd>+<kbd>R</kbd>
          </span>
          .
        </p>
      </div>
      <HeroHud />
    </section>
  );
}
