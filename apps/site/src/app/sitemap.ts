import type { MetadataRoute } from 'next';
import { pages, SITE } from '@/docs/content';

// Every page of the site, built with it: the docs list comes from content/docs.
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/examples', ...pages().map((p) => p.href)].map((path) => ({ url: SITE + path }));
}
