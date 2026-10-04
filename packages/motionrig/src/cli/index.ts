// The bin entry: runs on load, with no "am I the main module" check. Compared against
// `process.argv[1]`, such a check fails behind the symlinks every install goes through
// (`.bin`, a global install, npx), and the bin would exit silently.
import { runCli } from './run';

const { code, out, err } = runCli(process.argv.slice(2));
if (out) process.stdout.write(out);
if (err) process.stderr.write(err);
process.exitCode = code;
