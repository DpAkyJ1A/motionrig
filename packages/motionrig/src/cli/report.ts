/** The result of applying one rig's overrides, independent of how it's printed. */
export interface AppliedChange {
  path: string;
  oldText: string;
  newText: string;
  /** e.g. "may be shadowed by a later spread" — still applied, but worth a second look. */
  note?: string;
}

export interface SkippedChange {
  path: string;
  oldText?: string;
  reason: string;
}

export type RigReport =
  | { id: string; status: 'not-found'; applied: []; skipped: [] }
  | { id: string; status: 'ambiguous'; matches: string[]; applied: []; skipped: [] } // "file:line"
  | { id: string; status: 'ok'; file: string; applied: AppliedChange[]; skipped: SkippedChange[] };

export interface CssApplied {
  name: string;
  file: string;
  oldText: string;
  newText: string;
}

export interface CssSkip {
  name: string;
  reason: string;
}

export interface CssReport {
  applied: CssApplied[];
  /** Safe var names from the payload that matched zero `var(--name, …)` calls anywhere. */
  notFound: string[];
  /** Var names whose new value was rejected as unsafe before any file was even scanned. */
  skipped: CssSkip[];
}

export interface Report {
  rigs: RigReport[];
  css?: CssReport;
  dryRun: boolean;
}

/** True when the run has anything a plain "everything applied" summary would hide. */
export function hasIssues(report: Report): boolean {
  for (const r of report.rigs) {
    if (r.status !== 'ok') return true;
    if (r.skipped.length > 0) return true;
  }
  if (report.css && (report.css.notFound.length > 0 || report.css.skipped.length > 0)) return true;
  return false;
}
