import s from './CodeBlock.module.css';
import { type Lang, langOf } from './lang';

export type IconKind = Lang | 'module' | 'url' | 'file';

/** What a label means: a file name by its extension (`.module.css` gets its own mark), else the language. */
function kindOf(name: string | undefined, lang: Lang | undefined): IconKind {
  const n = name?.toLowerCase() ?? '';
  if (/\.module\.s?css$/.test(n)) return 'module';
  if (/\.[a-z]+$/.test(n)) return langOf(n) ?? 'file';
  return lang ?? 'file';
}

/** A 16px mark before a file name, one per file type, drawn in the site's code palette. */
export function FileIcon({ name, lang, kind: forced }: { name?: string; lang?: Lang; kind?: IconKind }) {
  const kind = forced ?? kindOf(name, lang);
  return (
    <svg className={s.icon} data-kind={kind} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      {kind === 'ts' || kind === 'js' ? (
        <>
          <rect x="1.5" y="1.5" width="13" height="13" rx="3" className={s.iconFill} />
          <text x="13" y="12.4" textAnchor="end" className={s.iconText}>
            {kind === 'ts' ? 'TS' : 'JS'}
          </text>
        </>
      ) : kind === 'tsx' ? (
        <g fill="none" stroke="currentColor" strokeWidth="1.1">
          <ellipse cx="8" cy="8" rx="6.6" ry="2.5" />
          <ellipse cx="8" cy="8" rx="6.6" ry="2.5" transform="rotate(60 8 8)" />
          <ellipse cx="8" cy="8" rx="6.6" ry="2.5" transform="rotate(-60 8 8)" />
          <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
        </g>
      ) : kind === 'css' || kind === 'module' ? (
        <>
          <path
            d="M6 2.5 4.6 13.5M11 2.5 9.6 13.5M2.8 6h10.6M2.4 10h10.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {kind === 'module' && <circle cx="13.3" cy="12.8" r="2.4" className={s.iconDot} />}
        </>
      ) : kind === 'json' ? (
        <path
          d="M5.5 2.5c-1.6 0-2 .8-2 2v1.6c0 .9-.5 1.6-1.5 1.9 1 .3 1.5 1 1.5 1.9v1.6c0 1.2.4 2 2 2M10.5 2.5c1.6 0 2 .8 2 2v1.6c0 .9.5 1.6 1.5 1.9-1 .3-1.5 1-1.5 1.9v1.6c0 1.2-.4 2-2 2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      ) : kind === 'sh' ? (
        <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1.5" y="2.5" width="13" height="11" rx="2.5" />
          <path d="m4.5 6.2 2 1.8-2 1.8M8.5 10.2h3" />
        </g>
      ) : kind === 'html' ? (
        <path
          d="M5.2 4 1.8 8l3.4 4M10.8 4l3.4 4-3.4 4M9.2 3 6.8 13"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : kind === 'url' ? (
        <g fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="8" cy="8" r="6.2" />
          <path d="M1.8 8h12.4M8 1.8c-3.4 3.6-3.4 8.8 0 12.4M8 1.8c3.4 3.6 3.4 8.8 0 12.4" />
        </g>
      ) : (
        <path
          d="M3.5 1.5h6l3 3v10h-9zM9.5 1.5v3h3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
