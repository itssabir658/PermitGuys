/*
 * The advisor's opening line and starter questions, chosen by what the
 * visitor is looking at: the section crossing the middle of the screen on
 * the homepage, or the page elsewhere. Every line offers only what the
 * assistant can honestly give (what a municipality publishes, the drawings a
 * project needs, a scope and a quote from the team), never a fee, a time or
 * an approval.
 */

export interface ContextPrompt {
  /** Short line in the pill beside the launcher. */
  pill: string;
  /** One-tap questions shown in the pill and at the start of a chat. */
  chips: string[];
}

const byService: Record<string, ContextPrompt> = {
  "residential-additions": {
    pill: "Planning an addition? I can map the drawings it needs and what your city publishes.",
    chips: ["Scope my second-storey addition", "What drawings does an addition need?", "Do I need a minor variance?"],
  },
  "commercial-permits": {
    pill: "Fitting out a commercial space? Ask what a change of use or interior permit involves.",
    chips: ["Scope my commercial interior", "Does a change of use need a permit?", "What drawings does the city expect?"],
  },
  "interior-renovation-permits": {
    pill: "Renovating inside? Ask whether your work needs a permit and what the drawings show.",
    chips: ["Does my renovation need a permit?", "Scope my renovation", "I want to move a wall"],
  },
  "legal-basement-permits": {
    pill: "Planning a legal basement apartment? Ask what your city publishes on second units and egress.",
    chips: ["Can my basement become a legal unit?", "What does my city say about second units?", "Scope my basement apartment"],
  },
  "finished-basement-permits": {
    pill: "Finishing a basement? Ask when it needs a permit, and what the drawings cover.",
    chips: ["Does finishing my basement need a permit?", "Scope my finished basement", "Adding a basement bathroom"],
  },
  "below-grade-entrance-permits": {
    pill: "Adding a basement entrance? Ask what the drawings cover, from the stairwell to the drainage.",
    chips: ["Check my basement entrance plan", "Scope a below-grade entrance", "Do I need a permit for a side entrance?"],
  },
  "load-bearing-wall-removal": {
    pill: "Opening up a load-bearing wall? Ask what the beam and permit drawings involve.",
    chips: ["Check my wall removal", "Scope a load-bearing wall removal", "Do I need a permit to remove a wall?"],
  },
  "detached-garage-permits": {
    pill: "Building a detached garage? Ask what the site plan and your city's rules cover.",
    chips: ["Scope my detached garage", "Do I need a permit for a garage?", "Could a garage hold a suite?"],
  },
  "deck-permits": {
    pill: "Building a deck? Ask whether yours needs a permit in your city.",
    chips: ["Do I need a permit for my deck?", "Scope my deck", "What does a deck drawing show?"],
  },
  "custom-home-permits": {
    pill: "Designing a custom home? Ask how we take it from site to permit set.",
    chips: ["Scope my custom home", "How does a custom home start?", "Do I need an architect?"],
  },
};

const byGuide: Record<string, ContextPrompt> = {
  "do-i-need-a-building-permit": {
    pill: "Not sure you need a permit? Tell me the project and your city.",
    chips: ["Do I need a permit for my project?", "What does my city say?", "Scope my project"],
  },
  "home-addition-permits": byService["residential-additions"],
  "basement-apartment-permits": byService["legal-basement-permits"],
  "permit-costs-and-timelines": {
    pill: "Wondering about cost and timing? I'll explain what drives both, and get you a quote.",
    chips: ["What drives permit costs?", "How long does the city take?", "Get a quote for my project"],
  },
};

const byHomeSection: Record<string, ContextPrompt> = {
  "home-hero": {
    pill: "Have a project in mind? I'll map the drawings and permits it needs.",
    chips: ["Scope my project", "Do I need a permit?", "What does PermitGuys do?"],
  },
  praise: {
    pill: "Like what clients say? Tell me about your project and I'll scope it.",
    chips: ["Scope my project", "How does working with you start?", "Talk to the team"],
  },
  making: {
    pill: "Every house starts like this one. Want your project scoped the same way?",
    chips: ["Scope my custom home", "Scope my addition", "How does the design start?"],
  },
  services: {
    pill: "Not sure which service fits? Describe the project and I'll point you to it.",
    chips: ["Basement apartment", "Second-storey addition", "Commercial interior"],
  },
  contact: {
    pill: "Prefer to skip the form? I can take your project details here.",
    chips: ["Request a call back", "Scope my project first", "What happens after I reach out?"],
  },
};

const fallback: ContextPrompt = {
  pill: "Have a project in mind? I'll map the drawings and permits it needs.",
  chips: ["Scope my project", "Do I need a permit?", "Talk to the team"],
};

export function contextPrompt(path: string, sectionId: string | null | undefined): ContextPrompt {
  const service = path.match(/^\/services\/([^/]+)\/?$/)?.[1];
  if (service && byService[service]) return byService[service];
  const guide = path.match(/^\/permit-guides\/([^/]+)\/?$/)?.[1];
  if (guide && byGuide[guide]) return byGuide[guide];
  if (path === "/" && sectionId && byHomeSection[sectionId]) return byHomeSection[sectionId];
  if (path.startsWith("/contact")) return byHomeSection.contact;
  if (path.startsWith("/projects")) return { pill: "Seen a project like yours? I can scope yours.", chips: ["Scope my project", "Scope my custom home", "Talk to the team"] };
  if (path.startsWith("/how-it-works")) return { pill: "Questions about the process? Ask, or have your project scoped.", chips: ["What happens first?", "What if the city asks for revisions?", "Scope my project"] };
  return fallback;
}
