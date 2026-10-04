import { unseen } from '../core/snippet';
import type { Report } from './report';

/** No colour when `NO_COLOR` is set (any value, per no-color.org) or stdout isn't a TTY. */
export function shouldUseColor(env: NodeJS.ProcessEnv = process.env, stream: { isTTY?: boolean } = process.stdout): boolean {
  if (env.NO_COLOR !== undefined) return false;
  return !!stream.isTTY;
}

const paint = (enabled: boolean, code: string) => (s: string): string => (enabled ? `\x1b[${code}m${s}\x1b[0m` : s);

// Ids, paths and values come from a shared payload or committed source: each goes through `unseen`,
// or a control byte (`\x1b[2J`) would drive the terminal and a bidi override reorder what the report says.
export function formatReport(report: Report, opts: { color: boolean }): string {
  const bold = paint(opts.color, '1');
  const green = paint(opts.color, '32');
  const yellow = paint(opts.color, '33');
  const red = paint(opts.color, '31');
  const dim = paint(opts.color, '2');

  const lines: string[] = [];
  let applied = 0;
  let skipped = 0;
  let notFound = 0;
  let ambiguous = 0;

  for (const r of report.rigs) {
    if (r.status === 'not-found') {
      lines.push(`${bold(unseen(r.id))}  ${red('not found')}`, '');
      notFound++;
      continue;
    }
    if (r.status === 'ambiguous') {
      const matches = r.matches.map(unseen);
      lines.push(`${bold(unseen(r.id))}  ${red(`ambiguous (${matches.length} matches: ${matches.join(', ')})`)}`, '');
      ambiguous++;
      continue;
    }
    lines.push(`${bold(unseen(r.id))}  ${dim(unseen(r.file))}`);
    for (const a of r.applied) {
      const note = a.note ? `  ${dim(`(${unseen(a.note)})`)}` : '';
      lines.push(`  ${unseen(a.path)}  ${unseen(a.oldText)} ${dim('→')} ${green(unseen(a.newText))}${note}`);
      applied++;
    }
    for (const s of r.skipped) {
      const old = s.oldText !== undefined ? `${unseen(s.oldText)}  ` : '';
      lines.push(`  ${unseen(s.path)}  ${old}${yellow(`skipped: ${unseen(s.reason)}`)}`);
      skipped++;
    }
    lines.push('');
  }

  if (report.css) {
    const { applied: cssApplied, notFound: cssNotFound, skipped: cssSkipped } = report.css;
    if (cssApplied.length || cssNotFound.length || cssSkipped.length) {
      lines.push(bold('css'));
      for (const a of cssApplied) {
        lines.push(
          `  ${unseen(a.name)}  ${unseen(a.oldText)} ${dim('→')} ${green(unseen(a.newText))}  ${dim(`(${unseen(a.file)})`)}`,
        );
        applied++;
      }
      for (const name of cssNotFound) {
        lines.push(`  ${unseen(name)}  ${yellow('no `var(--name, …)` fallback found — update the stylesheet by hand')}`);
        notFound++;
      }
      for (const s of cssSkipped) {
        lines.push(`  ${unseen(s.name)}  ${yellow(`skipped: ${unseen(s.reason)}`)}`);
        skipped++;
      }
      lines.push('');
    }
  }

  const parts = [`${applied} applied`];
  if (skipped) parts.push(`${skipped} skipped`);
  if (notFound) parts.push(`${notFound} not found`);
  if (ambiguous) parts.push(`${ambiguous} ambiguous`);
  const dryNote = report.dryRun ? ' (dry run — nothing written)' : '';
  lines.push(`${bold('Summary:')} ${parts.join(', ')}.${dryNote}`);

  return lines.join('\n') + '\n';
}
