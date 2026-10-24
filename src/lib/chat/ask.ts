/*
 * Opening the website assistant from anywhere on the page: the homepage's
 * showcase asks with a window event, and the assistant (ChatAssistant.tsx)
 * opens and sends the question.
 */

export const ASK_EVENT = "pg:chat-ask";

export interface AskDetail {
  question?: string;
  /** Where the visitor asked from, for analytics. */
  source: string;
}

export function askAssistant(detail: AskDetail) {
  window.dispatchEvent(new CustomEvent<AskDetail>(ASK_EVENT, { detail }));
}

/** Questions offered before the first message, in the panel and on the homepage. */
export const askSuggestions = [
  "Do I need a permit for a deck?",
  "How do I make a basement apartment legal?",
  "What does PermitGuys do?",
  "I'm planning a second-storey addition",
];

/** Questions the homepage showcase types out, one after another. */
export const askExamples = [
  "Can I add a second storey to my bungalow in Oakville?",
  "What does Toronto say about permits for a deck?",
  "How many units can my house have in Mississauga?",
  "Do I need an architect for a 3-storey addition?",
  "Can I take out a load-bearing wall?",
];
