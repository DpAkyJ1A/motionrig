import { CopyButton } from './CopyButton';
import s from './CodeBlock.module.css';
import { FileIcon, type IconKind } from './FileIcon';
import { highlight, type Lang, langOf } from './highlight';

type Props = { code: string; label?: string; lang?: Lang; icon?: IconKind; copy?: boolean; copyName?: string };

/** A highlighted code block. A label that is a file name sets the language and the icon. */
export function CodeBlock({ code, label, lang, icon, copy = false, copyName }: Props) {
  const language = lang ?? langOf(label) ?? 'ts';
  return (
    <figure className={s.block}>
      {(label || copy) && (
        <figcaption className={s.head}>
          <span className={s.label}>
            <FileIcon name={label} lang={language} kind={icon} />
            <span className={s.labelText}>{label}</span>
          </span>
          {copy && <CopyButton text={code} className={s.copy} name={copyName ?? (label ? `Copy ${label}` : undefined)} />}
        </figcaption>
      )}
      <pre className={s.pre} tabIndex={0}>
        <code>{highlight(code, language)}</code>
      </pre>
    </figure>
  );
}
