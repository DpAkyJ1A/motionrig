import { llmsTxt } from '@/docs/markdown';

// The docs index for AI assistants (llmstxt.org), built with the site.
export const dynamic = 'force-static';

export function GET() {
  return new Response(llmsTxt(), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
