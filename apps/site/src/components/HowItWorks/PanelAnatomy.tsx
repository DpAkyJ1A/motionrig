import { Ring } from '@/components/Ring/Ring';
import s from './PanelAnatomy.module.css';

const LEGEND = [
  [
    'Share link',
    'One link opens the site with exactly these values, so anyone can see and test them. The same link is the developer’s patch: npx motionrig apply <link> edits the source.',
  ],
  ['Applies', 'When an edit shows: live, on next play, or after reload.'],
  ['Locate', 'Scrolls to what the rig drives and rings it for a moment. If none of it is on this page, it says so.'],
  ['Changed values', 'Turn yellow. ↺ goes back to the code default.'],
  [
    'Copy code',
    'One rig as a snippet to paste by hand: right for a quick tweak or a review comment. Share link carries every tweak, opens in a browser and applies itself.',
  ],
] as const;

const Mark = ({ n }: { n: number }) => (
  <span className={s.mark} aria-hidden="true">
    {n}
  </span>
);

const Icon = ({ d, fill }: { d: string; fill?: boolean }) => (
  <svg className={s.icon} viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path d={d} fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} />
  </svg>
);

/**
 * A static replica of the real panel on the hero tab: the same tokens, sizes and labels as
 * the panel's own stylesheet, annotated. Rebuilt by hand when the panel's design changes.
 */
export function PanelAnatomy() {
  return (
    <figure className={s.figure}>
      <div className={s.panel} aria-hidden="true">
        <div className={s.head}>
          <span className={s.brand}>
            <Ring size={16} strokeWidth={2.2} className={s.logo} />
            <span className={s.word}>motionrig</span>
          </span>
          <span className={s.search}>
            <Icon d="M7 11.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zM10.5 10.5 14 14" />
            Search rigs
          </span>
          <span className={s.iconBtn}>
            <Icon d="M6.5 9.5 9.5 6.5M7 4.5l1.2-1.2a2.8 2.8 0 0 1 4 4L11 8.5M9 11.5l-1.2 1.2a2.8 2.8 0 0 1-4-4L5 7.5" />
            <Mark n={1} />
          </span>
          <span className={s.iconBtn}>
            <Icon d="M4 8h8" />
          </span>
        </div>

        <div className={s.tabs}>
          <span className={s.chip}>
            Timeline <span className={s.new}>new</span>
          </span>
          <span className={`${s.chip} ${s.active}`}>
            <i className={s.dot} />
            Hero headline
          </span>
          <span className={s.chip}>Display type</span>
          <span className={s.chip}>Scroll scrub</span>
          <span className={s.chip}>Hover card</span>
          <span className={s.more}>
            +3
          </span>
          <span className={s.seenAll}>✓ 1 new</span>
        </div>

        <div className={s.body}>
          <div className={s.tabHead}>
            <span className={s.tabTitle}>
              <b>Hero headline</b>
              <span className={s.tabId}>hero</span>
              <span className={s.applies}>
                live
                <Mark n={2} />
              </span>
            </span>
            <span className={s.acts}>
              <span className={s.ghost}>
                <Icon d="M5 3.5v9l7-4.5z" fill />
                Replay
              </span>
              <span className={s.iconBtn}>
                <Icon d="M8 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM8 1v2.5M8 12.5V15M1 8h2.5M12.5 8H15" />
                <Mark n={3} />
              </span>
            </span>
          </div>
          <p className={s.note}>
            The headline at the top of the page. Its letters rise, tip up off the floor and settle. Every edit replays
            it, and so does Replay.
          </p>

          <div className={s.groupHead}>
            Motion
            <Icon d="M4.5 6.5 8 10l3.5-3.5" />
          </div>

          <div className={`${s.row} ${s.changed}`}>
            <span className={s.lab}>
              <span className={s.key}>stagger</span>
              <span className={s.reset}>
                ↺
                <Mark n={4} />
              </span>
            </span>
            <span className={s.numbox}>
              0.045<span className={s.unit}>s</span>
            </span>
            <span className={s.slide}>
              <i style={{ width: '22%' }} />
              <b style={{ left: '22%' }} />
            </span>
          </div>

          <div className={`${s.row} ${s.changed}`}>
            <span className={s.lab}>
              <span className={s.key}>ease</span>
              <span className={s.reset}>↺</span>
            </span>
            <span className={s.ease}>
              <svg className={s.thumb} viewBox="-0.1 -1.35 1.2 1.7" preserveAspectRatio="none">
                <path d="M0 0C0.16 -1 0.3 -1 1 -1" />
              </svg>
              <span className={s.select}>Custom curve…</span>
            </span>
            <div className={s.bezier}>
              <svg className={s.plot} viewBox="-0.08 -1.68 1.16 2.36">
                <path className={s.rail} d="M0 0.6V-1.6M1 0.6V-1.6M0 0.6H1M0 -1.6H1" />
                <rect className={s.box} x="0" y="-1" width="1" height="1" />
                <path className={s.diag} d="M0 0L1 -1" />
                <line className={s.arm} x1="0" y1="0" x2="0.16" y2="-1" />
                <line className={s.arm} x1="1" y1="-1" x2="0.3" y2="-1" />
                <path className={s.curve} d="M0 0C0.16 -1 0.3 -1 1 -1" />
                <circle className={s.knob} cx="0.16" cy="-1" r="0.05" />
                <circle className={s.knob} cx="0.3" cy="-1" r="0.05" />
              </svg>
              <span className={s.side}>
                <span className={s.params}>
                  0.16, 1, 0.3, 1
                  <Icon d="M5.5 5.5h7v7h-7zM3.5 10.5v-7h7" />
                </span>
                <span className={s.fields}>
                  <span>
                    x1<b>0.16</b>
                  </span>
                  <span>
                    y1<b>1</b>
                  </span>
                  <span>
                    x2<b>0.3</b>
                  </span>
                  <span>
                    y2<b>1</b>
                  </span>
                </span>
                <span className={s.preview}>
                  <i />
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className={s.foot}>
          <span className={s.primary}>
            <Icon d="M5.5 5.5h7v7h-7zM3.5 10.5v-7h7" />
            Copy code
            <Mark n={5} />
          </span>
          <span className={s.ghost}>Reset tab</span>
          <span className={s.ghost}>Reset all</span>
        </div>
      </div>
      <figcaption>
        <ol className={s.legend}>
          {LEGEND.map(([name, text], i) => (
            <li key={name}>
              <span className={s.legendMark}>{i + 1}</span>
              <span>
                <b>{name}.</b> {text}
              </span>
            </li>
          ))}
        </ol>
      </figcaption>
    </figure>
  );
}
