import type { ReactNode } from 'react';
import s from './Docs.module.css';

export type Prop = { name: string; type: string; def?: string; children: ReactNode };

/** An option list that reads as a table on wide screens and as stacked entries on a phone. Never scrolls sideways. */
export function Props({ rows, label }: { rows: Prop[]; label: string }) {
  return (
    <dl className={s.props} aria-label={label}>
      {rows.map((r) => (
        <div key={r.name} className={s.prop}>
          <dt>
            <code className={s.name}>{r.name}</code>
            <code className={s.type}>{r.type}</code>
          </dt>
          <dd>
            {r.def !== undefined && (
              <p className={s.def}>
                Default <code>{r.def}</code>
              </p>
            )}
            {r.children}
          </dd>
        </div>
      ))}
    </dl>
  );
}
