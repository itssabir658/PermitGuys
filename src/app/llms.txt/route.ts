import { llmsIndex, markdownResponse } from "@/lib/llms";

export const dynamic = "force-static";

/** /llms.txt: a Markdown index of the site for AI assistants (llmstxt.org). */
export function GET() {
  return markdownResponse(llmsIndex());
}
