'use client';

import { defaultsOf } from 'motionrig';
import { useRig } from 'motionrig/react';
import { PanelButton } from '@/components/PanelButton/PanelButton';
import { Ring } from '@/components/Ring/Ring';
import s from './Hero.module.css';
import { HERO, replayHero } from './hero.rig';

type Row = { key: string; value: string | number; base: string | number; unit?: string };

/** A channel box for rig('hero'): live values from useRig, changed ones marked like the panel marks them. */
export function HeroHud() {
  const hero = useRig(HERO);
  const base = defaultsOf(HERO);
  const rows: Row[] = [
    { key: 'split', value: hero.split, base: base.split },
    { key: 'from', value: hero.from, base: base.from },
    { key: 'stagger', value: hero.stagger, base: base.stagger, unit: 's' },
    { key: 'duration', value: hero.duration, base: base.duration, unit: 's' },
    { key: 'ease', value: hero.ease, base: base.ease },
    { key: 'rise', value: hero.rise, base: base.rise, unit: '%' },
    { key: 'tilt', value: hero.tilt, base: base.tilt, unit: '°' },
    { key: 'spin', value: hero.spin, base: base.spin, unit: '°' },
    { key: 'ring.draw', value: hero.ring.draw, base: base.ring.draw, unit: 's' },
    { key: 'ring.delay', value: hero.ring.delay, base: base.ring.delay, unit: 's' },
    { key: 'ring.turn', value: hero.ring.turn, base: base.ring.turn, unit: '°' },
  ];
  const changed = rows.filter((r) => r.value !== r.base).length;

  return (
    <aside className={s.hud} aria-label="Live values of the hero rig">
      <div className={s.hudHead}>
        <code>rig(&apos;hero&apos;)</code>
        <span className={s.badge}>live</span>
      </div>
      <dl>
        {rows.map((r) => (
          <div key={r.key} className={r.value !== r.base ? `${s.row} ${s.changed}` : s.row}>
            <dt>{r.key}</dt>
            <dd>
              {r.value}
              {r.unit && <span className={s.unit}>{r.unit}</span>}
            </dd>
          </div>
        ))}
      </dl>
      <p className={s.hudNote} aria-live="polite">
        {changed === 0
          ? 'Code defaults. Tune any value in the panel and the headline replays.'
          : `${changed} changed from code. Yellow = your tweak.`}
      </p>
      <div className={s.hudActions}>
        <button type="button" className={s.replay} onClick={replayHero}>
          <span aria-hidden="true">▶</span> Replay
        </button>
        <PanelButton id="hero" className={s.tune} label="Tune the hero in the panel">
          <Ring size={13} strokeWidth={2.2} />
          Tune
        </PanelButton>
      </div>
    </aside>
  );
}
