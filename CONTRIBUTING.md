# Working on motionrig

How the repo is laid out, the dev commands, and how a release goes out. The
user-facing README is [README.md](./README.md); the docs are on
[motionrig.vercel.app/docs](https://motionrig.vercel.app/docs).

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
  apps/site/               the site (Next.js, App Router) — uses motionrig as workspace:*
    content/docs/            the docs, one Markdown file per page (see below)
  docs/spec.md             the implementation spec
  .changeset/               pending changesets
  .github/workflows/         ci.yml (test/build/lint/size on every push & PR)
                              release.yml (changesets → Version PR → publish)
  .github/assets/           the README's demo GIF
```

## Dev commands

Run from the repo root (pnpm workspace):

```bash
pnpm install

pnpm build        # builds the motionrig package (packages/motionrig/dist)
pnpm test         # motionrig's test suite (vitest)
pnpm typecheck    # typecheck every package
pnpm check        # the package's full gate: typecheck, test, build, publint+attw, size-limit
pnpm site         # the site's dev server (apps/site, localhost:4321)
pnpm site:build   # build motionrig, then the site against it
```

`pnpm build` deletes and recreates `packages/motionrig/dist`. If something
else in the workspace (the site's dev server, another agent) rebuilds at the
same moment, a size/pack check can race a half-written `dist` — re-run the
command.

## Docs

Each docs page is a Markdown file in `apps/site/content/docs/`; the order and
the groups in the menu are `GROUPS` in `apps/site/src/docs/content.ts`. The same
file renders the HTML page and is served as Markdown at the page's URL plus
`.md`, in `/llms.txt` and `/llms-full.txt`, and by the **Copy page** button, so
there is one text to keep right.

- Frontmatter: `title` and `description` (the page's lead and meta description).
- A fenced block's info string can name the file: ` ```ts motion/hero.ts `.
  ` ```sh install ` is the package-manager switch.
- GitHub alerts (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`) become callouts.
- `<!-- tabs -->` … `<!-- /tabs -->` turns the `###` sections between them into tabs.
- `<!-- demo:theme -->` places the live theme demo.
- `## Heading {#id}` sets an anchor; otherwise it is the slugged heading.
- `{{size.core}}`, `{{size.panel}}`, `{{react}}`, `{{node}}` and friends are
  filled in from the package (`VARS` in `content.ts`), so numbers never go stale.

## README

`README.md` at the root is the one GitHub shows; npm shows
`packages/motionrig/README.md`. Edit the root one: the package's `prepack`
script copies it over before every pack and publish. Links and images in it are
absolute URLs, since npm doesn't resolve paths into the repo.

npm shows the README of the **published** version, so a README change reaches
npm with the next release.

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
   (`pnpm --filter motionrig check && changeset publish`): the package's full
   gate (typecheck, test, build, `publint --strict`, `attw`, `size-limit`) has
   to pass before anything is published. Publishing uses npm trusted
   publishing (OIDC, no token), so the package carries a provenance
   attestation back to this repo and workflow run. `repository.url` in
   `packages/motionrig/package.json` has to match this repo, or npm refuses
   the provenance publish.

To see what will ship:

```bash
cd packages/motionrig
pnpm pack --dry-run
```

Expect only `dist/`, `README.md`, `LICENSE`, `CHANGELOG.md` and
`package.json`; nothing from `src/`, tests or repo tooling.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every PR:
`pnpm check` (the package's full gate) and a production build of `apps/site`
against it.
