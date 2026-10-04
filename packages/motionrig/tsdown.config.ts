import { defineConfig } from 'tsdown';

export default defineConfig([
  // Browser runtime. `index` and `panel` build together so the lazily imported
  // panel shares the core's module instance (one registry) through a common chunk.
  {
    entry: { index: 'src/index.ts', panel: 'src/panel/index.ts' },
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    dts: true,
    clean: false,
    minify: true,
    sourcemap: false,
  },
  // React bindings: a client module that reaches the core through the package's
  // own name, kept external, so it never bundles a second copy of the registry.
  {
    entry: { react: 'src/react/index.ts' },
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    dts: true,
    clean: false,
    minify: true,
    deps: { neverBundle: ['react', 'motionrig'] },
    banner: { js: "'use client';" },
  },
  // CLI.
  {
    entry: { cli: 'src/cli/index.ts' },
    format: 'esm',
    platform: 'node',
    target: 'node18',
    fixedExtension: false,
    dts: false,
    clean: false,
    banner: { js: '#!/usr/bin/env node' },
  },
]);
