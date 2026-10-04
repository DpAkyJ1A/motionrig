import { decodeShare, validateShare } from './payload';
import type { SharePayload } from './types';

// Panel paste and CLI input only: kept out of payload.ts, which the core bundle carries.

/** The share payload in `text`: a link (any param holding one), the encoded payload, or the payload as JSON. */
export function findShare(text: string): SharePayload | undefined {
  const raw = text.trim();
  if (!raw) return undefined;
  let url: URL | undefined;
  try {
    url = new URL(raw);
  } catch {}
  if (url) {
    for (const value of url.searchParams.values()) {
      const p = decodeShare(value);
      if (p) return p;
    }
    return undefined;
  }
  try {
    return decodeShare(raw) ?? validateShare(JSON.parse(raw));
  } catch {
    return undefined;
  }
}
