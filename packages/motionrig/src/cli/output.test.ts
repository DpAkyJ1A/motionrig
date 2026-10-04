// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatReport, shouldUseColor } from './output';
import type { Report } from './report';

describe('shouldUseColor', () => {
  it('is false when NO_COLOR is set, even on a TTY', () => {
    expect(shouldUseColor({ NO_COLOR: '1' }, { isTTY: true } as never)).toBe(false);
  });

  it('is false when stdout is not a TTY', () => {
    expect(shouldUseColor({}, { isTTY: false } as never)).toBe(false);
  });

  it('is true on a TTY with no NO_COLOR', () => {
    expect(shouldUseColor({}, { isTTY: true } as never)).toBe(true);
  });
});

describe('formatReport', () => {
  const base: Report = { rigs: [], dryRun: false };

  it('reports an applied change with old and new text, no colour codes when disabled', () => {
    const report: Report = {
      dryRun: false,
      rigs: [
        {
          id: 'hero',
          status: 'ok',
          file: 'src/Hero.tsx',
          applied: [{ path: 'duration', oldText: '1', newText: '1.2' }],
          skipped: [],
        },
      ],
    };
    const text = formatReport(report, { color: false });
    expect(text).toContain('hero');
    expect(text).toContain('src/Hero.tsx');
    expect(text).toContain('duration');
    expect(text).toContain('1');
    expect(text).toContain('1.2');
    expect(text).not.toMatch(/\x1b\[/);
    expect(text).toContain('1 applied');
  });

  it('uses ansi codes when colour is enabled', () => {
    const report: Report = {
      dryRun: false,
      rigs: [{ id: 'hero', status: 'not-found', applied: [], skipped: [] }],
    };
    const text = formatReport(report, { color: true });
    expect(text).toMatch(/\x1b\[/);
  });

  it('reports not-found and ambiguous rigs distinctly, ambiguous matches as file:line', () => {
    const report: Report = {
      dryRun: false,
      rigs: [
        { id: 'missing', status: 'not-found', applied: [], skipped: [] },
        { id: 'dup', status: 'ambiguous', matches: ['a.ts:3', 'b.ts:12'], applied: [], skipped: [] },
      ],
    };
    const text = formatReport(report, { color: false });
    expect(text).toContain('missing');
    expect(text).toContain('not found');
    expect(text).toContain('dup');
    expect(text).toContain('ambiguous');
    expect(text).toContain('a.ts:3');
    expect(text).toContain('b.ts:12');
    expect(text).toContain('1 not found');
    expect(text).toContain('1 ambiguous');
  });

  it('shows a note on an applied change (e.g. shadowed by a later spread)', () => {
    const report: Report = {
      dryRun: false,
      rigs: [
        {
          id: 'x',
          status: 'ok',
          file: 'a.ts',
          applied: [{ path: 'label', oldText: "'a'", newText: "'b'", note: 'may be shadowed by a later spread' }],
          skipped: [],
        },
      ],
    };
    const text = formatReport(report, { color: false });
    expect(text).toContain('may be shadowed by a later spread');
  });

  it('reports a skipped baseline mismatch with its reason', () => {
    const report: Report = {
      dryRun: false,
      rigs: [
        {
          id: 'curtain',
          status: 'ok',
          file: 'src/Curtain.tsx',
          applied: [],
          skipped: [{ path: 'variant', oldText: "'old'", reason: 'changed in code since it was tuned' }],
        },
      ],
    };
    const text = formatReport(report, { color: false });
    expect(text).toContain('changed in code since it was tuned');
    expect(text).toContain('1 skipped');
  });

  it('reports the css section: applied entries show old -> new and the file', () => {
    const text = formatReport(
      {
        ...base,
        css: {
          applied: [{ name: '--faq-ease', file: 'src/faq.scss', oldText: 'cubic-bezier(1, 0, 0, 1)', newText: 'cubic-bezier(0.4, 0, 1, 1)' }],
          notFound: [],
          skipped: [],
        },
      },
      { color: false },
    );
    expect(text).toContain('--faq-ease');
    expect(text).toContain('cubic-bezier(1, 0, 0, 1)');
    expect(text).toContain('cubic-bezier(0.4, 0, 1, 1)');
    expect(text).toContain('src/faq.scss');
  });

  it('shows the hint for a name that matched nothing', () => {
    const text = formatReport({ ...base, css: { applied: [], notFound: ['--faq-ease'], skipped: [] } }, { color: false });
    expect(text).toContain('--faq-ease');
    expect(text.toLowerCase()).toContain('update the stylesheet');
    expect(text).toContain('1 not found');
  });

  it('does NOT show the "update the stylesheet" hint for a name rejected as unsafe', () => {
    const text = formatReport(
      { ...base, css: { applied: [], notFound: [], skipped: [{ name: '--bad', reason: 'unsafe value' }] } },
      { color: false },
    );
    expect(text).toContain('--bad');
    expect(text).toContain('unsafe value');
    expect(text.toLowerCase()).not.toContain('update the stylesheet');
    expect(text).toContain('1 skipped');
  });

  it('folds css applied/notFound/skipped counts into the overall summary', () => {
    const text = formatReport(
      {
        ...base,
        css: {
          applied: [{ name: '--a', file: 'a.css', oldText: '1s', newText: '2s' }],
          notFound: ['--b'],
          skipped: [{ name: '--c', reason: 'unsafe' }],
        },
      },
      { color: false },
    );
    expect(text).toContain('1 applied');
    expect(text).toContain('1 skipped');
    expect(text).toContain('1 not found');
  });

  it('notes a dry run in the summary', () => {
    const text = formatReport({ ...base, dryRun: true }, { color: false });
    expect(text.toLowerCase()).toContain('dry run');
  });

  // Every printed field can come from a shared payload or committed source.
  it('escapes control, line-separator and bidi characters in every printed field', () => {
    const x = '\x1b[2J\x7f\x9b\u2028\u202e\u2066';
    const report: Report = {
      dryRun: false,
      rigs: [
        { id: x, status: 'not-found', applied: [], skipped: [] },
        { id: x, status: 'ambiguous', matches: [x], applied: [], skipped: [] },
        {
          id: x,
          status: 'ok',
          file: x,
          applied: [{ path: x, oldText: x, newText: x, note: x }],
          skipped: [{ path: x, oldText: x, reason: x }],
        },
      ],
      css: { applied: [{ name: x, file: x, oldText: x, newText: x }], notFound: [x], skipped: [{ name: x, reason: x }] },
    };
    const text = formatReport(report, { color: false });
    expect(text).not.toMatch(/[\0-\x09\x0b-\x1f\x7f-\x9f\u2028\u2029\u202a-\u202e\u2066-\u2069]/);
    expect(text.split('\\u001b[2J\\u007f\\u009b\\u2028\\u202e\\u2066').length - 1).toBe(19);
  });

  it('summarises zero issues when everything applied', () => {
    const report: Report = {
      dryRun: false,
      rigs: [
        {
          id: 'hero',
          status: 'ok',
          file: 'src/Hero.tsx',
          applied: [{ path: 'duration', oldText: '1', newText: '1.2' }],
          skipped: [],
        },
      ],
    };
    const text = formatReport(report, { color: false });
    expect(text).toContain('1 applied');
    expect(text).not.toContain('skipped');
    expect(text).not.toContain('not found');
  });
});
