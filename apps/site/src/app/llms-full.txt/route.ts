import { llmsFull } from '@/docs/markdown';

// Every docs page in one file, for pasting the whole manual into an assistant.
export const dynamic = 'force-static';

export function GET() {
  return new Response(llmsFull(), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
