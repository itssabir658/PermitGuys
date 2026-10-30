import type { Faq, ProcessStep, Service } from "./types";

/*
 * Copy rules for this file:
 * - Requirements are described as typical and always deferred to the
 *   municipality. No permit requirement is stated as universal.
 * - No prices, durations or approval promises. Cost and timeline sections
 *   list the factors only.
 * - Process steps name who owns each step. PermitGuys designs the project,
 *   works out its engineering, prepares the drawings and permit documentation
 *   and supports the application (the firm presents itself as an
 *   architecture and engineering firm, October 2026); it does not issue
 *   permits or perform construction. The firm may be called architects (the
 *   business confirmed it, 23 October 2026); no one is called an engineer,
 *   professional engineer or P.Eng. until the business confirms who is.
 */

const coreProcess = (projectNoun: string): ProcessStep[] => [
  {
    title: "Tell us about the project",
    body: `You share what you want to build, the property address and any existing drawings, surveys or photos of the ${projectNoun}.`,
    owner: "You",
  },
  {
    title: "Assess the requirements",
    body: "We review the scope against the applicable zoning and Building Code considerations we can identify, and flag anything that may need input from other consultants or the municipality.",
    owner: "PermitGuys",
  },
  {
    title: "Design, engineering and drawings",
    body: "We design the project, work out the engineering it needs, prepare the permit drawings and assemble the documentation, coordinating with any other specialists the project requires.",
    owner: "PermitGuys",
  },
  {
    title: "Municipal review",
    body: "The municipality reviews the application, may ask questions or request revisions, and decides whether to issue the permit.",
    owner: "Municipality",
  },
  {
    title: "Respond to review comments",
    body: "Where the municipality comments on the drawings, we help you understand the comments and revise the drawings we prepared.",
    owner: "PermitGuys",
  },
];

const sharedCostFactors = [
  "The size and complexity of the project and how many drawings it needs.",
  "Whether existing-condition measurements, a survey or as-built drawings are needed first.",
  "Whether the project needs input from structural, mechanical or other consultants.",
  "Whether a zoning variance or other planning approval is needed before a permit.",
  "The number of revision rounds the municipal review requires.",
];

const sharedTimelineFactors = [
  "How quickly site information, surveys and decisions are available.",
  "Whether a planning approval, such as a minor variance, is needed first.",
  "Whether the application is complete when submitted.",
  "The municipality's current review workload and any requests for revisions.",
];

const qualifier =
  "Requirements depend on your municipality, your property and the specific scope of work. Your local building department makes the final determination, so we confirm requirements for each project rather than assume them.";

const askAboutPricing: Faq = {
  question: "How much will this cost?",
  answer: [
    "Fees depend on the scope of your project, so we quote after we understand what you want to build. Municipal permit fees are separate and are set by your municipality.",
  ],
};

export const services: Service[] = [
  {
    slug: "residential-additions",
    name: "Residential Addition Permits",
    navLabel: "Residential additions",
    scope: "Rear, side and second-storey additions",
    category: "residential",
    featured: true,
    summary:
      "Permit drawings and permit guidance for rear, side and second-storey additions to houses across the GTA.",
    directAnswer:
      "An addition usually needs a building permit before construction starts. We prepare the permit drawings for your addition and help you through the municipal permit process, from the first assessment to responding to review comments.",
    overview: [
      "An addition changes the footprint, height or structure of your house, so it is reviewed against both zoning rules and the Ontario Building Code. Getting the drawings right at the start helps reduce revision rounds.",
      "We start by understanding what you want the space to do, then check the main zoning and building considerations we can identify for your lot before drawing. If something needs another consultant or a planning approval, we tell you early.",
    ],
    whoItsFor: [
      "Homeowners planning a rear, side or second-storey addition.",
      "Families adding space for a growing household or relatives.",
      "Owners who want drawings and permit support from the same team.",
    ],
    typicalRequirements: {
      intro: "Addition applications commonly include items such as:",
      items: [
        "A site plan showing the addition, property lines and setbacks.",
        "Floor plans, elevations and building sections.",
        "Structural information, which may need a structural engineer.",
        "Energy efficiency and other Building Code compliance information.",
        "A current survey of the property, where the municipality asks for one.",
      ],
      qualifier,
    },
    process: coreProcess("house and lot"),
    costFactors: sharedCostFactors,
    timelineFactors: sharedTimelineFactors,
    faqs: [
      {
        question: "Do I need a permit for a home addition?",
        answer: [
          "In Ontario, building a new structure or adding to an existing one generally requires a building permit from your municipality. Your local building department confirms what your specific project needs.",
        ],
      },
      {
        question: "What if my addition does not meet zoning rules?",
        answer: [
          "If a design does not meet the zoning by-law, it may need a planning approval such as a minor variance before a building permit can be issued. We flag this when we assess your project so you can decide how to proceed.",
        ],
      },
      askAboutPricing,
    ],
    relatedGuides: ["home-addition-permits", "do-i-need-a-building-permit", "permit-costs-and-timelines"],
    relatedServices: ["custom-home-permits", "interior-renovation-permits", "deck-permits"],
    visual: {
      drawing: "addition",
      alt: "Line drawing of a two-storey house elevation with a rear addition outlined in red.",
    },
    seo: {
      title: "Residential Addition Permits in the GTA",
      description:
        "Permit drawings and permit process support for home additions in the Greater Toronto Area. Learn what an addition application usually involves.",
    },
  },
  {
    slug: "commercial-permits",
    name: "Commercial Permits",
    navLabel: "Commercial permits",
    scope: "Commercial interiors, tenant improvements and changes of use",
    category: "commercial",
    featured: true,
    summary:
      "Permit drawings and permit coordination for commercial interiors, tenant improvements and changes of use.",
    directAnswer:
      "Most commercial construction, alteration and change-of-use projects need a building permit. We prepare the permit drawings and documentation for commercial projects and help owners and tenants work through the municipal review.",
    overview: [
      "Commercial projects are reviewed against requirements for occupancy, fire safety, accessibility and exits, and often involve several consultants. A clear permit package helps the review focus on the project rather than missing information.",
      "We work with owners, tenants and property managers to define the scope, identify the requirements we can see at the outset, and coordinate the drawings with any engineers the project needs.",
    ],
    whoItsFor: [
      "Business owners fitting out or altering a commercial space.",
      "Property owners preparing a unit for a new tenant.",
      "Tenants whose lease requires a permitted fit-out.",
    ],
    typicalRequirements: {
      intro: "Commercial applications commonly include items such as:",
      items: [
        "Floor plans showing the existing and proposed layout.",
        "Information on the building's occupancy and any change of use.",
        "Fire separations, exits and life safety information.",
        "Accessibility information where the work triggers it.",
        "Mechanical, electrical or structural drawings from other consultants, where needed.",
      ],
      qualifier,
    },
    process: coreProcess("existing space"),
    costFactors: [
      ...sharedCostFactors,
      "Whether the work involves a change in how the space is used.",
    ],
    timelineFactors: sharedTimelineFactors,
    faqs: [
      {
        question: "Does a change of use need a permit?",
        answer: [
          "Changing how part or all of a building is used may require a permit in Ontario even when little construction is planned. Your municipality confirms whether your proposed use needs one.",
        ],
      },
      {
        question: "Can you coordinate with my landlord or property manager?",
        answer: [
          "Yes. We can work with the people who need to review or approve the drawings, so the permit package reflects the building's requirements as well as yours.",
        ],
      },
      askAboutPricing,
    ],
    relatedGuides: ["do-i-need-a-building-permit", "permit-costs-and-timelines"],
    relatedServices: ["landlord-permits", "interior-renovation-permits"],
    visual: {
      drawing: "commercial",
      alt: "Line drawing of a commercial storefront elevation with a grid of windows.",
    },
    seo: {
      title: "Commercial Building Permits in the GTA",
      description:
        "Permit drawings and permit coordination for commercial interiors, tenant improvements and changes of use in the Greater Toronto Area.",
    },
  },
  {
    slug: "landlord-permits",
    name: "Landlord and Rental Property Permits",
    navLabel: "Landlord permits",
    scope: "New rental units and spaces readied for tenants",
    category: "commercial",
    featured: true,
    summary:
      "Permit drawings for landlords improving rental properties, preparing units for tenants or adding rental units.",
    directAnswer:
      "If you own a rental property, work such as adding a unit, altering a layout or preparing a space for a new tenant often needs a building permit. We prepare the drawings and help landlords move through the permit process.",
    overview: [
      "Rental properties carry extra considerations. Adding or legalizing a unit can involve the Building Code, the Fire Code, zoning and, in some municipalities, unit registration or licensing.",
      "We help landlords understand which approvals their project is likely to touch, then prepare the permit drawings so the property can be improved on a sound footing.",
    ],
    whoItsFor: [
      "Owners adding or legalizing a rental unit in a house.",
      "Landlords altering a rental property between tenancies.",
      "Owners of small commercial or mixed-use buildings preparing space for a tenant.",
    ],
    typicalRequirements: {
      intro: "Depending on the project, landlords commonly need to consider:",
      items: [
        "Building permit drawings for the proposed work.",
        "Fire separations, smoke alarms and exits between units.",
        "Zoning permissions for the number and type of units.",
        "Municipal rental unit registration or licensing, where it applies.",
        "Electrical inspections, which are handled by the Electrical Safety Authority in Ontario.",
      ],
      qualifier,
    },
    process: coreProcess("property and existing units"),
    costFactors: sharedCostFactors,
    timelineFactors: sharedTimelineFactors,
    faqs: [
      {
        question: "Do I need to register a second unit with the city?",
        answer: [
          "Some GTA municipalities require additional units to be registered or licensed, and the rules differ between municipalities. Check with your municipality, and we can help you understand where the permit fits in.",
        ],
      },
      askAboutPricing,
    ],
    relatedGuides: ["basement-apartment-permits", "do-i-need-a-building-permit"],
    relatedServices: ["legal-basement-permits", "commercial-permits"],
    visual: {
      drawing: "landlord",
      alt: "Line drawing of a semi-detached house divided into two stacked units.",
    },
    seo: {
      title: "Landlord and Rental Property Permits in the GTA",
      description:
        "Permit drawings and permit guidance for landlords adding units, altering rental properties or preparing space for tenants in the Greater Toronto Area.",
    },
  },
  {
    slug: "interior-renovation-permits",
    name: "Interior Renovation Permits",
    navLabel: "Interior renovations",
    scope: "Structural and layout changes, in homes and businesses",
    category: "commercial",
    featured: true,
    summary:
      "Permit drawings for interior alterations in homes and commercial spaces, including structural and layout changes.",
    directAnswer:
      "Interior renovations that change structure, layout, plumbing or how a space is used often need a building permit, while some cosmetic work may not. We help you find out which applies and prepare the drawings when a permit is needed.",
    overview: [
      "Removing or moving a load-bearing wall, adding a bathroom, finishing a basement or reconfiguring a commercial interior can all trigger a permit. Cosmetic updates such as painting or replacing finishes typically do not, but your municipality is the authority.",
      "We document the existing conditions, design the proposed layout for permit, and coordinate structural input where walls or beams are affected.",
    ],
    whoItsFor: [
      "Homeowners opening up a floor plan or removing a wall.",
      "Owners adding a bathroom or finishing a basement.",
      "Businesses reconfiguring an office, clinic or retail interior.",
    ],
    typicalRequirements: {
      intro: "Interior renovation applications commonly include items such as:",
      items: [
        "Existing and proposed floor plans.",
        "Structural details for any beams, posts or wall removals.",
        "Plumbing information where fixtures are added or moved.",
        "Fire separation and exit information for commercial or multi-unit spaces.",
      ],
      qualifier,
    },
    process: coreProcess("existing interior"),
    costFactors: sharedCostFactors,
    timelineFactors: sharedTimelineFactors,
    faqs: [
      {
        question: "Do I need a permit to remove a wall?",
        answer: [
          "Moving or removing a load-bearing wall commonly requires a building permit in GTA municipalities. Whether a non-load-bearing wall needs one depends on your municipality and the work involved, so confirm with your building department.",
        ],
      },
      askAboutPricing,
    ],
    relatedGuides: ["do-i-need-a-building-permit", "permit-costs-and-timelines"],
    relatedServices: ["load-bearing-wall-removal", "commercial-permits", "finished-basement-permits"],
    visual: {
      drawing: "interior",
      alt: "Line drawing of an interior floor plan with a wall being removed, marked in red.",
    },
    seo: {
      title: "Interior Renovation Permits in the GTA",
      description:
        "Find out when an interior renovation needs a building permit, and get permit drawings for residential and commercial interiors in the Greater Toronto Area.",
    },
  },
  {
    slug: "legal-basement-permits",
    name: "Legal Basement Apartment Permits",
    navLabel: "Legal basement apartments",
    scope: "A legal second unit in your basement",
    category: "residential",
    featured: true,
    summary:
      "Permit drawings for creating a legal second unit in a basement, from the first feasibility check to municipal review.",
    directAnswer:
      "Adding a new basement apartment to a house in Ontario requires a building permit. We assess whether your basement can accommodate a second unit, prepare the permit drawings and help you through the municipal review.",
    overview: [
      "A legal basement apartment has to meet the Building Code, the Fire Code and your municipality's zoning rules, and some municipalities also require the unit to be registered. Ceiling height, exits, fire separations and natural light are common points of review.",
      "We start with a feasibility check of the existing basement so you know what the design will need to address before you commit to drawings.",
    ],
    whoItsFor: [
      "Homeowners creating a basement unit for rental income or family.",
      "Owners of an existing basement unit who want it permitted.",
      "Buyers assessing whether a house could accommodate a second unit.",
    ],
    typicalRequirements: {
      intro: "Basement apartment applications commonly address items such as:",
      items: [
        "Existing and proposed basement floor plans.",
        "Ceiling heights, exits and egress windows.",
        "Fire separations and smoke alarms between units.",
        "Heating, ventilation and plumbing information.",
        "Zoning permissions, including parking where the by-law requires it.",
      ],
      qualifier:
        "Requirements can also depend on the age of the house. Your local building department makes the final determination for your property.",
    },
    process: coreProcess("basement"),
    costFactors: sharedCostFactors,
    timelineFactors: sharedTimelineFactors,
    faqs: [
      {
        question: "Can every basement become a legal apartment?",
        answer: [
          "Not every basement can, at least not without significant work. Ceiling height, exits, windows and zoning can limit what is possible. A feasibility check before drawings helps you find out early.",
        ],
      },
      {
        question: "Is a permit the only approval I need?",
        answer: [
          "Often it is not. Electrical work typically needs an inspection by the Electrical Safety Authority, and some municipalities require the second unit to be registered. Your municipality can confirm what applies.",
        ],
      },
      askAboutPricing,
    ],
    relatedGuides: ["basement-apartment-permits", "do-i-need-a-building-permit", "permit-costs-and-timelines"],
    relatedServices: ["below-grade-entrance-permits", "finished-basement-permits", "landlord-permits"],
    visual: {
      drawing: "basement",
      alt: "Line drawing of a house section showing a separate basement unit with its own entrance.",
    },
    seo: {
      title: "Legal Basement Apartment Permits in the GTA",
      description:
        "Permit drawings and permit process support for legal basement apartments and second units in the Greater Toronto Area.",
    },
  },
  {
    slug: "finished-basement-permits",
    name: "Finished Basement Permits",
    navLabel: "Finished basements",
    scope: "More living space for your own household",
    category: "residential",
    featured: false,
    homeRow: false,
    summary:
      "Permit drawings for finishing a basement as living space for your own household, with new rooms, a bathroom or a bedroom.",
    directAnswer:
      "Finishing a basement with new walls, a bathroom or a bedroom commonly needs a building permit, while purely cosmetic updates may not. We help you find out which applies, design the space and prepare the permit drawings when one is needed.",
    overview: [
      "A finished basement adds living space for the people who already live in the house: a family room, an office, a guest bedroom or a bathroom. It is not a separate unit. A basement with its own kitchen and entrance for another household is a second unit, which is reviewed differently (see Legal basement apartments).",
      "We document the existing basement, design the new layout and work out what the design has to address, such as ceiling heights, bedroom windows, plumbing for a new bathroom, insulation and any posts or beams the layout affects.",
    ],
    whoItsFor: [
      "Homeowners turning an unfinished basement into living space.",
      "Families adding a bedroom, bathroom or office downstairs.",
      "Owners who want the basement designed so it could become a second unit later.",
    ],
    typicalRequirements: {
      intro: "Finished basement applications commonly address items such as:",
      items: [
        "Existing and proposed basement floor plans.",
        "Bedroom windows, exits and smoke and carbon monoxide alarms.",
        "Plumbing information for a new bathroom or laundry.",
        "Insulation and moisture protection for the foundation walls.",
        "Structural details where posts, beams or walls are moved.",
      ],
      qualifier,
    },
    process: coreProcess("basement"),
    costFactors: sharedCostFactors,
    timelineFactors: sharedTimelineFactors,
    faqs: [
      {
        question: "Do I need a permit to finish my basement?",
        answer: [
          "Finishing a basement often involves work that needs a permit, such as new walls and rooms, a bathroom, changes to the structure or to heating and ventilation. Replacing finishes alone may not. Your building department confirms what your project needs.",
        ],
      },
      {
        question: "What is the difference between a finished basement and a legal basement apartment?",
        answer: [
          "A finished basement is more living space for your own household. A basement apartment is a separate unit for another household, with its own kitchen and entrance, and it has to meet further Building Code, Fire Code and zoning requirements. If you might rent the space later, tell us at the start so the design does not close that door.",
        ],
      },
      askAboutPricing,
    ],
    relatedGuides: ["do-i-need-a-building-permit", "basement-apartment-permits", "permit-costs-and-timelines"],
    relatedServices: ["legal-basement-permits", "below-grade-entrance-permits", "load-bearing-wall-removal"],
    visual: {
      drawing: "basement",
      alt: "Line drawing of a house section with a finished basement.",
    },
    seo: {
      title: "Finished Basement Permits in the GTA",
      description:
        "Find out when finishing a basement needs a building permit, and get permit drawings for basement finishing projects in the Greater Toronto Area.",
    },
  },
  {
    slug: "below-grade-entrance-permits",
    name: "Below-Grade Entrance Permits",
    navLabel: "Below-grade entrances",
    scope: "A separate stair and door down to the basement",
    category: "residential",
    featured: false,
    homeRow: false,
    summary:
      "Permit drawings for a new below-grade entrance: a stairwell dug down beside the house to a new door in the basement wall.",
    directAnswer:
      "A below-grade entrance cuts a new opening in the foundation wall and builds a stairwell down to it, so it generally needs a building permit, and zoning rules can limit where it may go. We design the entrance, work out its structure and prepare the permit drawings.",
    overview: [
      "A separate basement entrance is often the first step toward a basement apartment, and it is also useful on its own, for access to a basement workshop, office or family space. Because it changes the foundation and the yard, it is reviewed for both its structure and its location on the lot.",
      "We check the side and rear yards against the zoning considerations we can identify, design the stair, retaining walls and new opening, and coordinate any structural input the foundation needs.",
    ],
    whoItsFor: [
      "Homeowners adding a separate side or rear entrance to the basement.",
      "Owners preparing a basement for a future second unit.",
      "Owners who want to replace or enlarge an existing basement stairwell.",
    ],
    typicalRequirements: {
      intro: "Below-grade entrance applications commonly include items such as:",
      items: [
        "A site plan showing the entrance, the house, property lines and setbacks.",
        "Plans and a section through the stairwell and the new door.",
        "Structural details for the opening in the foundation wall and the retaining walls.",
        "Guard, handrail and stair details.",
        "Drainage at the bottom of the stairwell.",
      ],
      qualifier,
    },
    process: coreProcess("house and yard"),
    costFactors: sharedCostFactors,
    timelineFactors: sharedTimelineFactors,
    faqs: [
      {
        question: "Do I need a permit for a separate basement entrance?",
        answer: [
          "Cutting a new opening in a foundation wall and building a stairwell to it is structural work, and it commonly needs a building permit in GTA municipalities. Your local building department confirms what your project needs.",
        ],
      },
      {
        question: "Can a below-grade entrance go in a side yard?",
        answer: [
          "It depends on your municipality's zoning by-law and the width of the side yard. Some by-laws limit entrances in side yards or set minimum clearances. If the location does not meet the by-law, a minor variance may be needed first. We flag this when we assess your property.",
        ],
      },
      askAboutPricing,
    ],
    relatedGuides: ["basement-apartment-permits", "do-i-need-a-building-permit", "permit-costs-and-timelines"],
    relatedServices: ["legal-basement-permits", "finished-basement-permits", "residential-additions"],
    visual: {
      drawing: "basement",
      alt: "Line drawing of a house section with a separate stair down to a basement entrance.",
    },
    seo: {
      title: "Below-Grade Entrance Permits in the GTA",
      description:
        "Permit drawings for separate basement entrances and below-grade stairwells in the Greater Toronto Area, from the first site check to municipal review.",
    },
  },
  {
    slug: "load-bearing-wall-removal",
    name: "Load-Bearing Wall Removal Permits",
    navLabel: "Load-bearing wall removal",
    scope: "Opening up a floor plan with a new beam",
    category: "residential",
    featured: false,
    homeRow: false,
    summary:
      "Structural design and permit drawings for removing or moving a load-bearing wall and carrying the load on a new beam.",
    directAnswer:
      "Removing a load-bearing wall means the floors and roof above need a new way down to the foundation, usually a beam and posts, so it commonly needs a building permit. We work out the structure, design the new beam, posts and footings and prepare the permit drawings.",
    overview: [
      "Opening a kitchen to the living room or joining two small rooms is one of the most common renovations, and one of the few where the drawings are mostly about structure. The load the wall carried has to be traced from the roof down to the footings, and every part of that path sized for it.",
      "We confirm which walls are load-bearing, design the beam and its supports so the opening is as clean as the structure allows (including flush beams hidden in the ceiling where they work), and show how the load reaches the foundation.",
    ],
    whoItsFor: [
      "Homeowners opening up a kitchen, living or dining area.",
      "Owners combining rooms or moving walls in a renovation.",
      "Contractors who need structural drawings and a permit for a client's wall removal.",
    ],
    typicalRequirements: {
      intro: "Wall removal applications commonly include items such as:",
      items: [
        "Existing and proposed floor plans showing the wall and the new opening.",
        "The size and material of the new beam, posts and connections.",
        "How the load reaches the foundation, including any new footings.",
        "Notes on temporary support while the wall is taken out.",
      ],
      qualifier,
    },
    process: coreProcess("house"),
    costFactors: sharedCostFactors,
    timelineFactors: sharedTimelineFactors,
    faqs: [
      {
        question: "Do I need a permit to remove a load-bearing wall?",
        answer: [
          "Removing or moving a load-bearing wall changes the structure of the house, and it commonly requires a building permit in GTA municipalities. Your local building department confirms what your project needs.",
        ],
      },
      {
        question: "How do I know if a wall is load-bearing?",
        answer: [
          "Clues include walls that run across the floor joists, walls near the middle of the house and walls with another wall or a beam directly above or below. None of these is certain on its own, so we confirm it from the structure before anything is drawn or removed.",
        ],
      },
      askAboutPricing,
    ],
    relatedGuides: ["do-i-need-a-building-permit", "permit-costs-and-timelines"],
    relatedServices: ["interior-renovation-permits", "finished-basement-permits", "residential-additions"],
    visual: {
      drawing: "interior",
      alt: "Line drawing of an interior floor plan with a wall being removed, marked in red.",
    },
    seo: {
      title: "Load-Bearing Wall Removal Permits in the GTA",
      description:
        "Structural design and permit drawings for removing a load-bearing wall in the Greater Toronto Area: beam, posts and footings, ready for municipal review.",
    },
  },
  {
    slug: "detached-garage-permits",
    name: "Detached Garage Permits",
    navLabel: "Detached garages",
    scope: "New detached garages and accessory buildings",
    category: "residential",
    featured: false,
    homeRow: false,
    summary:
      "Design and permit drawings for new detached garages and larger accessory buildings on residential lots.",
    directAnswer:
      "A new detached garage generally needs a building permit, and zoning rules decide where it can sit on your lot and how big and tall it can be. We design the garage, check it against the zoning considerations we can identify and prepare the permit drawings.",
    overview: [
      "A detached garage is a small building of its own, with its own foundation, structure and roof, so it is reviewed against the Building Code and the zoning by-law. Zoning commonly controls its setbacks from the property lines, its height and how much of the lot it covers.",
      "We design the garage to suit the house and the lot, coordinate structural input for the foundation and framing, and tell you early if the design would need a minor variance.",
    ],
    whoItsFor: [
      "Homeowners building a new detached garage.",
      "Owners replacing an old garage with a larger one.",
      "Owners planning a workshop, studio or storage building.",
    ],
    typicalRequirements: {
      intro: "Detached garage applications commonly include items such as:",
      items: [
        "A site plan showing the garage, the house, property lines and setbacks.",
        "Floor plan, elevations and a building section.",
        "Foundation, framing and roof details.",
        "Grading and drainage information, where the municipality asks for it.",
      ],
      qualifier,
    },
    process: coreProcess("lot"),
    costFactors: sharedCostFactors,
    timelineFactors: sharedTimelineFactors,
    faqs: [
      {
        question: "Does a detached garage need a permit?",
        answer: [
          "A new garage generally does. Some very small accessory buildings may not need a building permit, but zoning rules such as setbacks and lot coverage can still apply. Your building department confirms what your project needs.",
        ],
      },
      {
        question: "Can I add living space above a detached garage?",
        answer: [
          "Living space in or above a garage is treated differently from a garage, and a separate unit there is a garden or laneway suite, which has its own zoning and Building Code requirements. Tell us what you have in mind and we will check what your municipality allows.",
        ],
      },
      askAboutPricing,
    ],
    relatedGuides: ["do-i-need-a-building-permit", "permit-costs-and-timelines"],
    relatedServices: ["custom-home-permits", "deck-permits", "residential-additions"],
    visual: {
      drawing: "plan",
      alt: "Line drawing of a site plan with a detached garage at the back of the lot.",
    },
    seo: {
      title: "Detached Garage Permits in the GTA",
      description:
        "Design and permit drawings for new detached garages and accessory buildings in the Greater Toronto Area, with zoning checked before drawing.",
    },
  },
  {
    slug: "deck-permits",
    name: "Deck Permits",
    navLabel: "Deck permits",
    scope: "New and replacement decks, raised or attached",
    category: "residential",
    featured: false,
    summary:
      "Permit drawings for new and replacement decks, including raised decks and decks attached to the house.",
    directAnswer:
      "Whether a deck needs a permit depends on your municipality and on details such as its height, size and whether it is attached to the house. We help you find out, and prepare deck permit drawings when one is required.",
    overview: [
      "Many GTA municipalities set thresholds, often based on the height of the deck above grade, its area or whether it is attached to the house, that decide whether a deck needs a permit. The thresholds differ, so it is worth checking before you build.",
      "When a permit is needed, we prepare a site plan, a framing plan and the construction details the municipality typically expects for a deck.",
    ],
    whoItsFor: [
      "Homeowners building a new deck or replacing an old one.",
      "Owners planning a raised or multi-level deck.",
      "Contractors who need permit drawings for a client's deck.",
    ],
    typicalRequirements: {
      intro: "Deck applications commonly include items such as:",
      items: [
        "A site plan showing the deck, the house and property lines.",
        "A framing plan with joist, beam and post sizes.",
        "Footing, guard and stair details.",
      ],
      qualifier,
    },
    process: coreProcess("yard and house"),
    costFactors: sharedCostFactors.slice(0, 3),
    timelineFactors: sharedTimelineFactors,
    faqs: [
      {
        question: "Does my deck need a permit?",
        answer: [
          "It depends on your municipality and the deck. Height above grade, area and whether the deck is attached to the house are common factors. Zoning rules, such as setbacks, can apply even when a permit is not required.",
        ],
      },
      askAboutPricing,
    ],
    relatedGuides: ["do-i-need-a-building-permit", "permit-costs-and-timelines"],
    relatedServices: ["residential-additions", "custom-home-permits"],
    visual: {
      drawing: "deck",
      alt: "Line drawing of a raised deck framing plan with posts, beams and stairs.",
    },
    seo: {
      title: "Deck Permits in the GTA",
      description:
        "Find out whether your deck needs a building permit and get deck permit drawings for projects in the Greater Toronto Area.",
    },
  },
  {
    slug: "custom-home-permits",
    name: "Custom Home Permits",
    navLabel: "Custom homes",
    scope: "New and replacement homes on existing lots",
    category: "residential",
    featured: false,
    summary:
      "Permit drawings and permit guidance for new custom homes and replacement homes on existing lots.",
    directAnswer:
      "A new house needs a building permit, and often other approvals first, such as a demolition permit for an existing house. We prepare permit drawings for custom homes and help owners understand and work through the permit process.",
    overview: [
      "A new home brings together zoning, site servicing, grading, tree protection and the Building Code. Some of these are reviewed by other municipal departments or agencies, so understanding the sequence early helps the project move in order.",
      "We work from your design goals and the constraints of your lot, coordinate with the engineers and specialists the project needs, and prepare the permit drawing set.",
    ],
    whoItsFor: [
      "Owners building a new house on a vacant lot.",
      "Owners replacing an existing house on their lot.",
      "Families who want drawings and permit guidance in one place.",
    ],
    typicalRequirements: {
      intro: "New home applications commonly include items such as:",
      items: [
        "A site plan, grading information and a current survey.",
        "Floor plans, elevations, sections and construction details.",
        "Structural, mechanical and energy efficiency information.",
        "Approvals or reviews by other agencies, where the property requires them.",
      ],
      qualifier,
    },
    process: coreProcess("lot"),
    costFactors: sharedCostFactors,
    timelineFactors: [
      ...sharedTimelineFactors,
      "Whether other agencies, such as a conservation authority, need to review the property.",
    ],
    faqs: [
      {
        question: "Do I need a demolition permit to replace my house?",
        answer: [
          "Demolishing a building generally needs a permit in Ontario. Your municipality sets how the demolition and new building applications relate to each other.",
        ],
      },
      askAboutPricing,
    ],
    relatedGuides: ["do-i-need-a-building-permit", "permit-costs-and-timelines", "home-addition-permits"],
    relatedServices: ["residential-additions", "deck-permits"],
    visual: {
      drawing: "custom-home",
      alt: "Line drawing of a modern two-storey custom home elevation.",
    },
    seo: {
      title: "Custom Home Permits in the GTA",
      description:
        "Permit drawings and permit guidance for new custom homes and replacement homes in the Greater Toronto Area.",
    },
  },
];
