import { version } from '../../package.json';
import { runApply } from './apply';
import { formatReport, shouldUseColor } from './output';

const USAGE = 'motionrig apply <link | payload | file> [--root <dir>] [--dry-run] [--force]';

const HELP = `Usage:
  ${USAGE}
  motionrig --help | --version

Applies a motionrig share link (or payload, or a file holding either) to the
source code: it finds each tuned rig()'s object literal and patches only the
values that changed.

Arguments:
  <link | payload | file>  a URL with a share payload in a query param,
                            a raw share payload, or a path to a file with
                            either (or the payload as JSON)

Options:
  --root <dir>   directory to scan for rig() calls and stylesheets (default: cwd)
  --dry-run      report what would change without writing any file
  --force        apply a value even when the code default no longer matches
                 the baseline it was tuned against
  --help, -h     show this help
  --version, -v  show the installed version
`;

export interface CliIo {
  env?: NodeJS.ProcessEnv;
  isTTY?: boolean;
}

export interface CliOutcome {
  code: 0 | 1 | 2;
  out: string;
  err: string;
}

function parseArgs(argv: string[]): { positional: string[]; root?: string; dryRun: boolean; force: boolean } | string {
  const positional: string[] = [];
  let root: string | undefined;
  let dryRun = false;
  let force = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '--root' || a.startsWith('--root=')) {
      root = a === '--root' ? argv[++i] : a.slice('--root='.length);
      // `--root --dry-run` must not take the flag for the directory (and drop the dry run).
      if (!root || root.startsWith('-')) return '--root needs a directory.\n';
      continue;
    }
    if (a === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (a === '--force') {
      force = true;
      continue;
    }
    if (a.startsWith('-')) return `Unknown flag: ${a}\n`;
    positional.push(a);
  }
  return { positional, root, dryRun, force };
}

export function runCli(argv: string[], io: CliIo = {}): CliOutcome {
  if (argv.includes('--help') || argv.includes('-h')) return { code: 0, out: HELP, err: '' };
  if (argv.includes('--version') || argv.includes('-v')) return { code: 0, out: `motionrig ${version}\n`, err: '' };

  if (argv[0] !== 'apply') {
    return { code: 2, out: '', err: `${argv.length ? `Unknown command: ${argv[0]}` : 'Missing command'}.\n\n${HELP}` };
  }

  const parsed = parseArgs(argv.slice(1));
  if (typeof parsed === 'string') return { code: 2, out: '', err: parsed };
  if (parsed.positional.length !== 1) {
    return { code: 2, out: '', err: `Usage: ${USAGE}\n` };
  }

  const color = shouldUseColor(io.env ?? process.env, { isTTY: io.isTTY ?? process.stdout.isTTY });

  const result = runApply(parsed.positional[0]!, {
    root: parsed.root ?? process.cwd(),
    dryRun: parsed.dryRun,
    force: parsed.force,
  });

  if (!result.ok) return { code: result.exitCode, out: '', err: `${result.message}\n` };
  return { code: result.exitCode, out: formatReport(result.report, { color }), err: '' };
}
