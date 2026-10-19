import { sources } from "./sources";
import type { Guide } from "./types";

/*
 * Guides answer one homeowner question each. Every factual claim should be
 * traceable to a listed source. `lastReviewed` and `reviewer` stay null until
 * a qualified person at PermitGuys has reviewed the guide; the template then
 * shows a "review pending" notice instead of a fake byline.
 */
export const guides: Guide[] = [
  {
    slug: "do-i-need-a-building-permit",
    navLabel: "Do I need a permit?",
    title: "Do I need a building permit?",
    summary:
      "What kinds of work usually need a building permit in Ontario, what often does not, and how to confirm for your project.",
    directAnswer:
      "In Ontario you generally need a building permit to construct, renovate, demolish or change the use of a building. Permits are issued by your municipality's building department, which is also the authority on whether your specific project needs one.",
    sections: [
      {
        heading: "Who issues building permits",
        paragraphs: [
          "Building permits in Ontario are issued under the Building Code Act by the body that enforces the Building Code in your area. In the GTA, that is your municipality's building department, such as Toronto Building in the City of Toronto.",
          "Because each municipality administers its own permits and by-laws, the details of what needs a permit, what to submit and what fees apply can differ from one municipality to the next.",
        ],
      },
      {
        heading: "Work that commonly needs a permit",
        paragraphs: [
          "Municipal guidance across Ontario commonly lists work like the following as needing a permit. It is a starting point, not a complete list.",
        ],
        list: [
          "Building a new house, addition or accessory building above the size your municipality exempts.",
          "Moving or removing load-bearing walls and other structural changes.",
          "Finishing a basement or adding a second unit.",
          "Adding or altering plumbing.",
          "Building many decks, porches and garages.",
          "Demolishing a building.",
          "Changing how a building or part of a building is used, even with little construction.",
        ],
      },
      {
        heading: "Work that often does not",
        paragraphs: [
          "Many municipalities exempt minor and cosmetic work. The City of Mississauga, for example, lists re-shingling a roof and replacing a window with one of the same size among work that does not need a permit. Small sheds can be exempt when they meet size and use conditions set out in the Building Code.",
          "Even when a permit is not required, zoning rules such as setbacks and lot coverage still apply. Check with your municipality before you build.",
        ],
      },
      {
        heading: "How to confirm for your project",
        paragraphs: [
          "The reliable way to confirm is to contact your municipality's building department with a description of the work. If you are planning a larger project, we can assess the scope and tell you which approvals it is likely to involve.",
        ],
      },
    ],
    sources: [sources.ontarioBuildingPermits, sources.buildingCodeAct, sources.mississaugaBeforeYouApply],
    lastReviewed: null,
    reviewer: null,
    faqs: [
      {
        question: "What happens if I build without a permit?",
        answer: [
          "Municipalities can issue orders to stop work, and work may need to be opened up for inspection or removed. Unpermitted work can also cause issues when you sell or insure the property. Your municipality can explain the consequences that apply.",
        ],
      },
    ],
    relatedGuides: ["home-addition-permits", "permit-costs-and-timelines"],
    relatedServices: ["residential-additions", "interior-renovation-permits", "deck-permits"],
    seo: {
      title: "Do I Need a Building Permit in Ontario?",
      description:
        "A plain-language guide to when Ontario homeowners need a building permit, what is often exempt and how to confirm with your municipality.",
    },
  },
  {
    slug: "home-addition-permits",
    navLabel: "Home addition permits",
    title: "How do permits work for a home addition?",
    summary:
      "What a home addition permit application usually involves in the GTA, from zoning checks to drawings and municipal review.",
    directAnswer:
      "A home addition generally needs a building permit, and the design must meet both your municipality's zoning by-law and the Ontario Building Code. If the design does not meet zoning, a planning approval such as a minor variance may be needed before the permit can be issued.",
    sections: [
      {
        heading: "Start with zoning",
        paragraphs: [
          "Zoning by-laws control things like how close an addition can be to the property lines, how tall it can be and how much of the lot can be covered. Checking these early tells you how much room the design has.",
          "Where a design does not meet a zoning requirement, owners can usually apply to the municipality's Committee of Adjustment for a minor variance. That is a separate process, and it generally has to be resolved before the building permit is issued.",
        ],
      },
      {
        heading: "What the drawings usually include",
        paragraphs: [
          "Addition applications typically include a site plan, floor plans, elevations, building sections and structural information. Many municipalities also ask for a current survey and energy efficiency information. Your municipality publishes its own list of required documents.",
        ],
      },
      {
        heading: "Who can prepare the drawings",
        paragraphs: [
          "Under Ontario's Building Code, permit drawings for most projects must be prepared by a designer who is qualified and registered with the province, or by a licensed architect or professional engineer. Owners can generally prepare drawings for their own house. Qualified designers are identified by a Building Code Identification Number (BCIN), which can be checked in the province's public registry.",
        ],
      },
      {
        heading: "Review and revisions",
        paragraphs: [
          "Once the application is complete, the municipality reviews it and may issue comments asking for clarification or changes. Responding clearly and completely to those comments is one of the most effective ways to keep an application moving.",
        ],
      },
    ],
    sources: [sources.ontarioBuildingPermits, sources.buildingCodeAct],
    lastReviewed: null,
    reviewer: null,
    faqs: [
      {
        question: "Do I need an engineer for my addition?",
        answer: [
          "Many additions need structural input, and some elements may need to be designed by a professional engineer. Whether yours does depends on the design and what your municipality requires.",
        ],
      },
    ],
    relatedGuides: ["do-i-need-a-building-permit", "permit-costs-and-timelines"],
    relatedServices: ["residential-additions", "custom-home-permits"],
    seo: {
      title: "Home Addition Permits in the GTA: How the Process Works",
      description:
        "How building permits work for home additions in the Greater Toronto Area, including zoning, drawings, minor variances and municipal review.",
    },
  },
  {
    slug: "basement-apartment-permits",
    navLabel: "Legal basement apartments",
    title: "How do I make a basement apartment legal?",
    summary:
      "What is usually involved in creating a legal basement apartment or second unit in the GTA.",
    directAnswer:
      "To create a legal basement apartment in Ontario you need a building permit, and the unit must meet the Building Code, the Fire Code and your municipality's zoning rules. Some GTA municipalities also require second units to be registered.",
    sections: [
      {
        heading: "The approvals involved",
        paragraphs: [
          "The Government of Ontario's guide to adding a second unit recommends speaking with your municipality's planning and building departments first, because they can confirm the zoning, Building Code and permit requirements for your property.",
        ],
        list: [
          "A building permit for the work to create the unit.",
          "Zoning permission for the additional unit, including any parking requirements.",
          "Electrical inspection, which in Ontario is handled by the Electrical Safety Authority.",
          "Registration or licensing of the unit, where your municipality requires it.",
        ],
      },
      {
        heading: "What reviewers commonly look at",
        paragraphs: [
          "Common points of review for basement units include ceiling height, exits and egress windows, fire separations between units, smoke and carbon monoxide alarms, and heating and ventilation. Requirements can differ depending on the age of the house.",
        ],
      },
      {
        heading: "Check feasibility before you design",
        paragraphs: [
          "Some basements need significant work to become a legal unit, for example to achieve the required ceiling height or a compliant exit. A feasibility review of the existing basement before full drawings helps you understand what the project involves.",
        ],
      },
    ],
    sources: [sources.ontarioSecondUnit, sources.esa, sources.buildingCodeAct],
    lastReviewed: null,
    reviewer: null,
    faqs: [
      {
        question: "My basement apartment already exists. Can it be permitted?",
        answer: [
          "Often an existing unit can be brought into compliance through a permit application, though it may need alterations. Your municipality can explain the route for existing units.",
        ],
      },
    ],
    relatedGuides: ["do-i-need-a-building-permit", "permit-costs-and-timelines"],
    relatedServices: ["legal-basement-permits", "landlord-permits"],
    seo: {
      title: "How to Make a Basement Apartment Legal in the GTA",
      description:
        "What Ontario homeowners need to know about permits, the Fire Code, zoning and registration when creating a legal basement apartment.",
    },
  },
  {
    slug: "permit-costs-and-timelines",
    navLabel: "Permit costs and timelines",
    title: "How much does a permit cost and how long does it take?",
    summary:
      "The factors that shape permit fees, drawing costs and timelines, without guesswork.",
    directAnswer:
      "Permit fees are set by each municipality, commonly based on the type and size of the project, so there is no single figure for the GTA. Ontario's Building Code sets time frames for municipalities to decide on complete applications, but the overall timeline also depends on design, other approvals and revisions.",
    sections: [
      {
        heading: "What shapes the cost",
        paragraphs: [
          "A project's permit costs usually come from two places: the municipality's permit fee and the cost of preparing the drawings and documentation.",
        ],
        list: [
          "Municipal permit fees are set by by-law and often depend on the type of building and the floor area of the work. Your municipality publishes its fee schedule.",
          "Drawing and consulting costs depend on the size and complexity of the project and whether engineers or other specialists are involved.",
          "Planning applications, such as a minor variance, have their own fees and process.",
        ],
      },
      {
        heading: "Review time frames for complete applications",
        paragraphs: [
          "Ontario's Building Code sets time frames within which a municipality must decide whether to issue a permit once it has a complete application. The City of Toronto, for example, lists 10 business days for houses, 15 for small buildings, 20 for large buildings and 30 for complex buildings.",
          "These time frames apply to the municipality's review of a complete application. They do not include the time to prepare drawings or obtain other approvals, and they can restart or extend when an application is incomplete or needs revisions.",
        ],
      },
      {
        heading: "What helps an application move",
        paragraphs: [
          "Submitting a complete application, resolving any zoning issues before applying and responding fully to review comments are the factors applicants most directly control.",
        ],
      },
    ],
    sources: [sources.torontoReviewStreams, sources.buildingCodeAct, sources.ontarioBuildingPermits],
    lastReviewed: null,
    reviewer: null,
    faqs: [
      {
        question: "Can you guarantee when my permit will be issued?",
        answer: [
          "No one other than the municipality decides when a permit is issued. We focus on preparing a complete, clear application and responding to review comments promptly.",
        ],
      },
    ],
    relatedGuides: ["do-i-need-a-building-permit", "home-addition-permits"],
    relatedServices: ["residential-additions", "legal-basement-permits", "commercial-permits"],
    seo: {
      title: "Building Permit Costs and Timelines in the GTA",
      description:
        "What shapes building permit fees and timelines in the Greater Toronto Area, including Ontario's review time frames for complete applications.",
    },
  },
];
