import { useCallback, useEffect, useSyncExternalStore } from 'react';
// The package's own name, kept external in the build, so the app and these bindings share one registry.
import { defaultsOf, mountPanel, snapshot, subscribe } from 'motionrig';

/**
 * An immutable snapshot of a rigged object whose identity changes whenever that rig
 * changes — use it as an effect dependency. The server snapshot is the code defaults,
 * so hydration never mismatches even when stored overrides were applied earlier.
 */
export function useRig<T extends object>(values: T): T {
  return useSyncExternalStore(
    useCallback((cb: () => void) => subscribe(values, cb), [values]),
    () => snapshot(values),
    () => defaultsOf(values),
  );
}

/** Mounts the panel once (behind the gate) and renders nothing. Its look (`theme`) is `configure()`'s. */
export function RigPanel({ preload }: { preload?: () => Promise<unknown> }): null {
  useEffect(() => {
    void mountPanel({ preload });
    // Once per app: a new `preload` identity on re-render must not remount.
  }, []);
  return null;
}
