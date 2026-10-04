# motionrig (monorepo)

**Devs rig it. Designers play it.**

The published package is [`packages/motionrig`](./packages/motionrig/README.md)
— read that for the pitch, quickstart and full API. This README is for
working in the repo: layout, dev commands and how a release goes out.

## Layout

```
motionrig/
  packages/motionrig/     the npm package (the only thing that gets published)
    src/
      index.ts              public core API (browser + SSR safe)
      core/                  registry, gate, storage, eases, infer, css, snippet, share, path, config
      panel/                 the lazy web-component panel (dist/panel.js)
      react/index.ts         `motionrig/react` — useRig, RigPanel
      cli/                    `motionrig` bin — apply
    README.md CHANGELOG.md LICENSE package.json tsdown.config.ts vitest.config.ts
  apps/site/               landing page (Next.js, App Router) — uses motionrig as workspace:*
  docs/spec.md             the implementation spec
  .changeset/               pending changesets
  .github/workflows/         ci.yml (test/build/lint/size on every push & PR)
                              release.yml (changesets → Version PR → publish)
```

## Dev commands

Run from the repo root (pnpm workspace):

```bash
pnpm install

pnpm build        # builds the motionrig package (packages/motionrig/dist)
pnpm test         # motionrig's test suite (vitest)
pnpm typecheck     # typecheck every package
pnpm check          # the package's full gate: typecheck, test, build, publint+attw, size-limit
pnpm site            # run the landing page dev server (apps/site, localhost:4321)
pnpm site:build       # build motionrig, then build the landing page against it
```

Or scope to the package directly:

```bash
cd packages/motionrig
pnpm check     # typecheck && test && build && lint:pkg && size
```

`pnpm build` deletes and recreates `packages/motionrig/dist`. If something
else in the workspace (the site's dev server, another agent) rebuilds at the
same moment, a size/pack check can race a half-written `dist` — just re-run
the command.

## Release flow

Releases go through [Changesets](https://github.com/changesets/changesets):

1. **Describe the change.** From the repo root:

   ```bash
   pnpm changeset
   ```

   Pick `motionrig`, a bump type (patch/minor/major), and write the
   user-facing summary — this becomes the `CHANGELOG.md` entry. Commit the
   generated `.changeset/*.md` file with the change.

2. **Push to `main`.** `.github/workflows/release.yml` runs on every push to
   `main`. With pending changesets, it opens (or updates) a **"Version
   Packages" PR** that bumps `packages/motionrig/package.json` and rewrites
   `CHANGELOG.md` from the accumulated changesets.

3. **Merge that PR.** The same workflow then runs `pnpm release`
   (`pnpm --filter motionrig check && changeset publish`) — the package's
   full gate (typecheck, test, build, `publint --strict`, `attw`,
   `size-limit`) has to pass before anything is published. Publishing uses
   `NODE_AUTH_TOKEN`/`NPM_TOKEN` (an npm automation token with publish
   rights, stored as the repo secret `NPM_TOKEN`) and npm provenance
   (`id-token: write` permission + `NPM_CONFIG_PROVENANCE: true`), so the
   published package carries a verifiable build attestation back to this
   repo and workflow run.

**Before the first real publish**, sanity-check what will actually ship:

```bash
cd packages/motionrig
pnpm pack --dry-run   # or: npm pack --dry-run
```

Expect only `dist/`, `README.md`, `LICENSE`, `CHANGELOG.md` and
`package.json` in the listing — `"files": ["dist", "CHANGELOG.md"]` plus npm's own
always-included set (`README*`, `LICENSE*`, `CHANGELOG*`, `package.json`)
account for every entry; nothing from `src/`, tests, or repo tooling should
appear.

**The first publish skips the Version PR.** `changeset publish` publishes
every package version that isn't on the registry yet. `package.json` already
says `0.1.0` and nothing is published, so the first push to `main` with no
pending changesets publishes `0.1.0` straight away. Have the gate green and
the TODO below done before that push. (A pending changeset would make the
workflow open a Version PR instead, but that PR bumps the version past
`0.1.0`.)

### Pre-publish TODO

- **`repository.url` must match the repo.** `packages/motionrig/package.json`
  points at `github.com/DpAkyJ1A/motionrig`. With `NPM_CONFIG_PROVENANCE: true`,
  npm refuses a provenance publish unless `repository.url` matches the repo
  the workflow runs in, so keep them in sync if the repo is renamed or moved.
- `NPM_TOKEN` needs to actually exist as a secret on the GitHub repo once
  one exists — `release.yml` references it but nothing has set it yet.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every PR:
`pnpm check` (the package's full gate) and a production build of
`apps/site` against it.
