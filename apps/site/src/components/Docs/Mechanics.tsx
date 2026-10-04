import s from './Mechanics.module.css';

/** A connector on the spine; the label says on what condition the flow goes on. */
const Down = ({ label }: { label?: string }) => (
  <div className={s.down} aria-hidden="true">
    {label && <span>{label}</span>}
  </div>
);

/**
 * "Under the hood" as a flowchart: one spine down the middle, the gate's dead ends off to the
 * sides, then the object with what writes into it on the left and what reads it on the right.
 * HTML rather than one SVG so it reflows to a single readable column on a phone.
 */
export function Mechanics() {
  return (
    <figure className={s.flow} aria-label="How a rig moves from registration to storage and back">
      <div className={`${s.node} ${s.call}`}>
        <code>rig(id, values, meta)</code>
        <span>registers, returns the same object</span>
      </div>

      <Down />

      <div className={s.gate}>
        <div className={`${s.node} ${s.end}`}>
          <b>On the server</b>
          <span>identity, nothing registered. Stops here.</span>
        </div>
        <i className={`${s.h} ${s.headStart}`} aria-hidden="true" />
        <div className={`${s.node} ${s.decision}`}>
          <b>Gate</b>
          <span>
            <code>?rig</code> in the URL?
          </span>
        </div>
        <i className={`${s.h} ${s.headEnd}`} aria-hidden="true" />
        <div className={`${s.node} ${s.end}`}>
          <b>Gate closed</b>
          <span>kept in memory: O(1), no storage, no DOM. Stops here.</span>
        </div>
      </div>

      <Down label="open, then sticky in sessionStorage" />

      <div className={`${s.node} ${s.step}`}>
        <b>Register</b>
        <span>
          Clone the code defaults. Apply each stored override in place, only if its baseline equals the default and
          the type matches; drop the rest.
        </span>
        <code className={s.store}>localStorage &#123; v, overrides, baseline, ui &#125;</code>
      </div>

      <div className={s.hub}>
        <ul className={`${s.side} ${s.writes}`} aria-label="Writes into the object">
          <li>
            <b>Panel edit</b> mutates in place
          </li>
          <li>
            <b>Share link</b> imported once per tab
          </li>
          <li>
            <b>Reset</b> back to the code defaults
          </li>
        </ul>
        <i className={`${s.h} ${s.headEnd}`} aria-hidden="true" />
        {/* The spine runs on through this column into the object, so it stays centred between the wires. */}
        <div className={s.core}>
          <div className={s.object}>
            <code>values</code>
            <span>the object your code imported, same identity</span>
          </div>
        </div>
        <i className={s.h} aria-hidden="true" />
        <ul className={`${s.side} ${s.reads}`} aria-label="Reads the object">
          <li>
            <b>Your animation</b> reads at play time
          </li>
          <li>
            <b>subscribe / useRig</b> notified once per microtask
          </li>
          <li>
            <b>css rigs</b> written to an adopted stylesheet
          </li>
          <li>
            <b>localStorage</b> saved 250 ms after the last edit, flushed on pagehide or hidden
          </li>
        </ul>
      </div>

      <figcaption className={s.loop}>
        <span aria-hidden="true">↻</span> On reload, Register runs again: the same path, the same values.
      </figcaption>
    </figure>
  );
}
