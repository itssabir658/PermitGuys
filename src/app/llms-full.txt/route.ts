import { llmsFull, markdownResponse } from "@/lib/llms";

export const dynamic = "force-static";

/** /llms-full.txt: the full text of services, municipality pages and guides for AI assistants. */
export function GET() {
  return markdownResponse(llmsFull());
}
