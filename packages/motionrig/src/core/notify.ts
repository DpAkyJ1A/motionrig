import { st } from './state';

/** One throwing listener must not starve the rest; its error still surfaces, asynchronously. */
function safely(fn: () => void): void {
  try {
    fn();
  } catch (err) {
    queueMicrotask(() => {
      throw err;
    });
  }
}

/** Queues entry `id` (or, without an id, the registry) for the next microtask flush. */
export function notify(id?: string): void {
  const s = st();
  if (id === undefined) s.registryChanged = true;
  else s.queue.add(id);
  if (s.scheduled) return;
  s.scheduled = true;
  queueMicrotask(() => {
    const ids = [...s.queue];
    const registry = s.registryChanged;
    s.queue.clear();
    s.scheduled = s.registryChanged = false;
    for (const id of ids) {
      s.subs.get(id)?.forEach(safely);
      const e = s.entries.get(id);
      if (e?.meta.onChange) safely(() => e.meta.onChange!(e.values));
    }
    if (registry) s.registrySubs.forEach(safely);
  });
}

export function subscribeEntry(id: string, cb: () => void): () => void {
  const subs = st().subs;
  let set = subs.get(id);
  if (!set) subs.set(id, (set = new Set()));
  set.add(cb);
  return () => {
    set.delete(cb);
  };
}

/** Entry added / replaced / values reset. */
export function onRegistryChange(cb: () => void): () => void {
  const subs = st().registrySubs;
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
}
