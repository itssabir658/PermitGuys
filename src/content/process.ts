import type { ProcessStep } from "./types";

/** The five-step overview used on the homepage and the How it works page. */
export const homeSteps: ProcessStep[] = [
  {
    title: "Tell us about your project",
    body: "Share what you want to build, where the property is and any drawings, surveys or photos you already have.",
    owner: "You",
  },
  {
    title: "We assess the requirements",
    body: "We review the scope against the zoning and Building Code considerations we can identify, and flag anything that needs other consultants or approvals.",
    owner: "PermitGuys",
  },
  {
    title: "We prepare the drawings and documents",
    body: "We prepare the permit drawings and assemble the documentation your application needs, coordinating with engineers where the project requires them.",
    owner: "PermitGuys",
  },
  {
    title: "We support the permit process",
    body: "We help you through the application and respond to review comments on our drawings.",
    owner: "PermitGuys",
  },
  {
    title: "The municipality decides",
    body: "Your municipality reviews the application, may ask for revisions, and decides whether to issue the permit. Inspections follow during construction.",
    owner: "Municipality",
  },
];
