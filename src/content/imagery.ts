/**
 * The site's imagery, of two kinds (see docs/IMAGES.md).
 *
 * Client renderings ("project"): design renderings from PermitGuys client
 * projects, supplied by PermitGuys in October 2026. They are renderings, not
 * photographs of finished buildings. Since November 2026 no picture is
 * shown in two places on the site (the projects page, the archive of every
 * project, aside): each spot has its own view, and near-identical renders of
 * one angle count as one picture. `tests/imagery.test.ts` checks it.
 * Captions and alt text describe only what the picture shows: never an
 * address, street or town, and nothing about a project's scope or results.
 *
 * Rendered studies ("study"): original renders made for this website, kept
 * only for kinds of project no client rendering shows (additions, basement
 * units, commercial units, decks, and since October 2026 basement entrances,
 * finished basements, wall removals and detached garages). Their captions always say they are
 * studies, so they are never read as PermitGuys work.
 */

export interface Plate {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Short name for the picture. Selected projects on the homepage uses it as the project's title. */
  caption: string;
  /** CSS object-position for crops, so the subject survives narrow frames. */
  focus?: string;
  kind: "project" | "study";
  /** A tall crop of the same picture, for full-screen use on narrow portrait screens. */
  tall?: { src: string; width: number; height: number };
}

export const STUDY_NOTE = "Rendered study for illustration, not a client project.";
export const PROJECT_NOTE = "Rendering of a client project.";

/** The note a caption carries: whether the picture is a client rendering or a study. */
export function plateNote(plate: Plate) {
  return plate.kind === "project" ? PROJECT_NOTE : STUDY_NOTE;
}

export const plates = {
  /* ---- Client renderings ---- */
  terrace: {
    src: "/images/projects/contemporary-house-terrace.jpg",
    width: 3800,
    height: 1994,
    alt: "Rendering of the back of a large contemporary house at dusk: a covered terrace with lounge chairs, lit glazing behind, a glass-railed balcony above, and loungers and an umbrella beside a lit swimming pool.",
    caption: "Rear terrace and pool at dusk",
    focus: "55% 60%",
    kind: "project",
    tall: { src: "/images/projects/contemporary-house-terrace-tall.jpg", width: 1500, height: 1994 },
  },
  dusk: {
    src: "/images/projects/contemporary-house-dusk.jpg",
    width: 3800,
    height: 1995,
    alt: "Rendering of a large contemporary house at dusk, seen from the lawn: white render, dark panels and timber cladding, tall lit windows, a timber front door and two cars on a wide driveway.",
    caption: "Contemporary house at dusk",
    focus: "70% 55%",
    kind: "project",
  },
  stone: {
    src: "/images/projects/stone-house.jpg",
    width: 3000,
    height: 2250,
    alt: "Rendering of a two-storey house clad in grey stone, with three steep gables, two bay windows under small hipped roofs, an arched entrance between slim cypress trees and a two-car garage with timber doors.",
    caption: "Stone house with three gables",
    focus: "56% 62%",
    kind: "project",
  },
  prairieFront: {
    src: "/images/projects/prairie-house-front.jpg",
    width: 3200,
    height: 2243,
    alt: "Rendering of a two-storey house from the street: wide flat eaves lined with timber, white render over black brick, tall black-framed windows, a covered entry with a timber door and a single garage.",
    caption: "Prairie-style two-storey",
    focus: "42% 58%",
    kind: "project",
  },
  prairieCorner: {
    src: "/images/projects/prairie-house-corner.jpg",
    width: 3200,
    height: 2243,
    alt: "Rendering of a two-storey house seen from the corner: deep timber-lined eaves, white render over black brick, a glazed covered entry, a single garage and a dark car on the driveway.",
    caption: "Prairie-style two-storey, corner view",
    focus: "44% 58%",
    kind: "project",
  },
  redBrick: {
    src: "/images/projects/red-brick-house.jpg",
    width: 3000,
    height: 2250,
    alt: "Rendering of a two-storey red-brick house with three steep gables trimmed in white, a white portico over the front steps, black windows, a metal roof over the garage and a black carriage-style garage door.",
    caption: "Red-brick house with three gables",
    focus: "50% 55%",
    kind: "project",
  },
  farmhouse: {
    src: "/images/projects/farmhouse-bungalow.jpg",
    width: 3800,
    height: 1944,
    alt: "Rendering of a wide bungalow in white board and batten under dark roofs, with timber brackets in the gable over the front porch, a white railing and a garage at one end.",
    caption: "Farmhouse bungalow",
    focus: "60% 62%",
    kind: "project",
  },
  greenBatten: {
    src: "/images/projects/green-board-and-batten-house.jpg",
    width: 3200,
    height: 2343,
    alt: "Rendering of a two-storey house in sage-green board and batten with two front gables, large black-framed windows, a pale stone base, a timber garage door and a lawn sloping down to the driveway.",
    caption: "Two-gabled house in board and batten",
    focus: "52% 55%",
    kind: "project",
  },
  narrow: {
    src: "/images/projects/narrow-contemporary-house.jpg",
    width: 2800,
    height: 2479,
    alt: "Rendering of a narrow two-storey contemporary house: a white rendered box and a dark framed box over a covered entry, dark stone cladding and a timber garage door, between tall trees.",
    caption: "Narrow contemporary house",
    focus: "50% 55%",
    kind: "project",
  },
  whiteBatten: {
    src: "/images/projects/white-board-and-batten-house.jpg",
    width: 3000,
    height: 2250,
    alt: "Rendering of a house in white board and batten over a pale stone base, with two gables, a raised front porch behind a glass railing, stone steps and a black carriage-style garage door.",
    caption: "Board and batten over a stone base",
    focus: "52% 55%",
    kind: "project",
  },
  brick: {
    src: "/images/projects/contemporary-brick-house.jpg",
    width: 3000,
    height: 2121,
    alt: "Rendering of a contemporary two-storey house in grey brick and dark cladding under a cloudy sky, with large black-framed windows and a black car on the driveway.",
    caption: "Contemporary house in brick and dark cladding",
    focus: "36% 58%",
    kind: "project",
  },

  side: {
    src: "/images/projects/contemporary-house-side.jpg",
    width: 3800,
    height: 1990,
    alt: "Rendering of a large contemporary house at dusk, seen across the lawn from one corner: white render, dark panel boxes and a timber-clad wing, a glass-railed balcony over the garage, lit windows and a silver car on the drive.",
    caption: "Contemporary house at dusk, corner view",
    focus: "58% 60%",
    kind: "project",
  },
  front: {
    src: "/images/projects/contemporary-house-front.jpg",
    width: 3800,
    height: 1995,
    alt: "Rendering of a large contemporary house straight on from the front lawn in daylight: white render, dark panels and timber cladding, tall timber doors and two cars on a wide driveway.",
    caption: "Contemporary house from the front",
    focus: "55% 55%",
    kind: "project",
  },
  farmhouseWide: {
    src: "/images/projects/farmhouse-bungalow-wide.jpg",
    width: 3800,
    height: 1944,
    alt: "Rendering of a wide farmhouse bungalow seen from far across its lawn: white board and batten, dark roofs, timber brackets in the gables and a garage at the left end.",
    caption: "Farmhouse bungalow across the lawn",
    focus: "55% 58%",
    kind: "project",
  },
  greenBattenFront: {
    src: "/images/projects/green-board-and-batten-front.jpg",
    width: 3200,
    height: 2343,
    alt: "Rendering of a two-storey house in sage-green board and batten seen straight on: two front gables, black-framed windows, a covered entry with a chevron timber door, a pale stone garage wing and steps up a sloping lawn.",
    caption: "Two-gabled house, front view",
    focus: "50% 55%",
    kind: "project",
  },
  classical: {
    src: "/images/projects/classical-house-dusk.jpg",
    width: 3800,
    height: 2138,
    alt: "Rendering of a symmetrical classical two-storey house at dusk, in pale stone with tall lit windows and a central balcony, behind clipped hedges and a still pond that reflects it.",
    caption: "Classical house at dusk",
    focus: "50% 50%",
    kind: "project",
  },

  /* ---- Rendered studies (no client rendering shows these kinds of project) ---- */
  infill: {
    src: "/images/studies/infill-house-dusk.jpg",
    width: 2560,
    height: 1440,
    alt: "A contemporary two-storey house at dusk on a residential street, its dark metal upper storey cantilevered over a pale, glazed ground floor.",
    caption: "Infill house at dusk",
    focus: "68% 60%",
    kind: "study",
  },
  addition: {
    src: "/images/studies/rear-addition-model.jpg",
    width: 1600,
    height: 2000,
    alt: "Architectural model of a house with a new two-storey rear addition clad in dark metal and timber slats, opening onto a timber deck.",
    caption: "Two-storey rear addition",
    focus: "50% 50%",
    kind: "study",
  },
  basement: {
    src: "/images/studies/basement-section-model.jpg",
    width: 2400,
    height: 1600,
    alt: "Sectional model of a two-storey house cut open to show a lit basement apartment with its own stair down to a separate entrance.",
    caption: "Second unit, in section",
    focus: "55% 55%",
    kind: "study",
  },
  commercial: {
    src: "/images/studies/main-street-commercial.jpg",
    width: 1960,
    height: 1600,
    alt: "A brick main-street building at dusk with two glazed ground-floor commercial units lit from within.",
    caption: "Main-street commercial units",
    focus: "45% 70%",
    kind: "study",
  },
  deck: {
    src: "/images/studies/rear-deck.jpg",
    width: 2400,
    height: 1600,
    alt: "A timber deck stepping down to a garden from a rear addition with full-height glazing and a timber screen above.",
    caption: "Rear deck and glazing",
    focus: "40% 60%",
    kind: "study",
  },
  storefront: {
    src: "/images/studies/commercial-storefront.jpg",
    width: 1600,
    height: 2000,
    alt: "Close view of a brick main-street building at dusk, its glazed ground-floor shop lit from within under pendant lights.",
    caption: "Storefront at dusk",
    focus: "55% 60%",
    kind: "study",
  },
  /* Generated with Higgsfield (GPT Image 2) for this website, October 2026, for the service pages added then. */
  belowGrade: {
    src: "/images/studies/below-grade-entrance.jpg",
    width: 2048,
    height: 1360,
    alt: "The side of a pale rendered two-storey house at dusk, a concrete stairwell with a black rail leading down to a lit, glazed basement door.",
    caption: "Below-grade entrance at dusk",
    focus: "36% 62%",
    kind: "study",
  },
  garage: {
    src: "/images/studies/detached-garage.jpg",
    width: 2048,
    height: 1360,
    alt: "A flat-roofed detached garage clad in dark metal, with a timber garage door, at the end of a concrete driveway beside a pale house.",
    caption: "Detached garage",
    focus: "64% 55%",
    kind: "study",
  },
  finishedBasement: {
    src: "/images/studies/finished-basement.jpg",
    width: 2048,
    height: 1360,
    alt: "A finished basement family room: an oak media wall, a charcoal sofa, recessed lights, a wide window onto a window well and an open stair at the back.",
    caption: "Finished basement",
    focus: "52% 60%",
    kind: "study",
  },
  beam: {
    src: "/images/studies/beam-open-plan.jpg",
    width: 2048,
    height: 1360,
    alt: "An open-plan kitchen and living room with a dark steel beam across the ceiling where a wall was removed, carried on a slim black post.",
    caption: "Open plan under a new beam",
    focus: "70% 45%",
    kind: "study",
  },
  /* Generated with Higgsfield (GPT Image 2.6) for this website, November 2026, so no picture is shown in two places: the service pages' own pictures and the index pages' bands. */
  additionGarden: {
    src: "/images/studies/rear-addition-garden.jpg",
    width: 2048,
    height: 1376,
    alt: "A red-brick two-storey house seen from its garden, with a new two-storey rear addition in dark standing-seam metal over cedar boards and wide glass doors onto a stone patio.",
    caption: "Rear addition from the garden",
    focus: "50% 55%",
    kind: "study",
  },
  commercialFitout: {
    src: "/images/studies/commercial-unit-fitout.jpg",
    width: 2048,
    height: 1376,
    alt: "An empty, newly fitted-out commercial unit: polished concrete floor, white walls, an oak reception counter, linear lights under an exposed white ceiling and a black-framed glass storefront.",
    caption: "Fitted-out commercial unit",
    focus: "50% 55%",
    kind: "study",
  },
  renovationOpening: {
    src: "/images/studies/renovation-new-opening.jpg",
    width: 2048,
    height: 1376,
    alt: "A room mid-renovation: fresh drywall partly taped, a wide new opening framed in timber studs under a header, a step ladder and drywall sheets against the wall.",
    caption: "Renovation with a new opening",
    focus: "55% 50%",
    kind: "study",
  },
  basementApartment: {
    src: "/images/studies/basement-apartment-kitchen.jpg",
    width: 2048,
    height: 1376,
    alt: "A bright basement apartment kitchen: white cabinets, a small island with stools, pot lights, an egress window with a window well, and a separate entry door at the end of a hall.",
    caption: "Basement apartment kitchen",
    focus: "50% 55%",
    kind: "study",
  },
  raisedDeck: {
    src: "/images/studies/raised-deck-evening.jpg",
    width: 2048,
    height: 1376,
    alt: "A raised composite deck with black aluminium railings and a wide stair down to a lawn, behind a grey-sided two-storey house, a dining set on it in evening light.",
    caption: "Raised deck in the evening",
    focus: "45% 60%",
    kind: "study",
  },
  architectDesk: {
    src: "/images/studies/architect-desk-drawings.jpg",
    width: 2048,
    height: 1376,
    alt: "An architect's desk: floor plans and elevations spread out, rolled drawings, a scale ruler, a pen, a laptop showing a 3D model of a house and a cup of coffee.",
    caption: "Drawings on the desk",
    focus: "50% 55%",
    kind: "study",
  },
  drawingsMarkup: {
    src: "/images/studies/drawings-markup.jpg",
    width: 2048,
    height: 1376,
    alt: "Printed construction drawings on an oak table, an elevation of a house above a floor plan, with a few red pen markups, coloured tabs and a black pen.",
    caption: "Drawings with markups",
    focus: "50% 55%",
    kind: "study",
  },
  aerial: {
    src: "/images/studies/gta-neighbourhood-aerial.jpg",
    width: 2048,
    height: 1376,
    alt: "An aerial view at sunset over a leafy suburban neighbourhood by a lake: curving tree-lined streets and detached houses, a city skyline faint on the horizon.",
    caption: "Neighbourhood by the lake",
    focus: "50% 60%",
    kind: "study",
  },
  permitBinder: {
    src: "/images/studies/permit-binder.jpg",
    width: 2048,
    height: 1376,
    alt: "An open ring binder of permit documents with coloured tabs beside a site plan sheet, reading glasses and a pencil on a pale oak table.",
    caption: "Permit documents in a binder",
    focus: "45% 55%",
    kind: "study",
  },
} satisfies Record<string, Plate>;

export type PlateKey = keyof typeof plates;

/**
 * The homepage hero's planes, cut from the terrace rendering at its own size
 * and crops (docs/IMAGES.md, "The hero's layers"), each with the hero's veil
 * (darker at the top for the header and at the foot for the statement)
 * drawn in. The far plane is the rendering with the house, the pine and the
 * garden taken out and the sky rebuilt behind them. The near plane is what
 * stands in front of the name (the house, the pine, the trees on the left
 * and the ground), cut out of the rendering: a transparent WebP, served as
 * it is at the picture's width and at three quarters and half of it (the
 * image optimizer's AVIF of a transparent picture is larger, and slow to
 * make). Both have a tall crop, as the rendering does.
 */
export const heroLayers = {
  far: { src: "/images/projects/contemporary-house-terrace-far.jpg", tall: "/images/projects/contemporary-house-terrace-tall-far.jpg" },
  near: {
    src: "/images/projects/contemporary-house-terrace-near.webp",
    threeQuarter: "/images/projects/contemporary-house-terrace-near-three-quarter.webp",
    half: "/images/projects/contemporary-house-terrace-near-half.webp",
    tall: "/images/projects/contemporary-house-terrace-tall-near.webp",
  },
};

/**
 * The client projects, as shown on the projects page: every distinct view
 * of each, and its id is the anchor there: a description of the
 * house, never an address.
 */
export interface ClientProject {
  id: string;
  title: string;
  views: Plate[];
}

export const clientProjects: ClientProject[] = [
  { id: "contemporary-house", title: "Contemporary house with a pool terrace", views: [plates.dusk, plates.side, plates.front, plates.terrace] },
  { id: "classical-house", title: "Classical house at dusk", views: [plates.classical] },
  { id: "stone-house", title: "Stone house with three gables", views: [plates.stone] },
  { id: "prairie-style-house", title: "Prairie-style two-storey", views: [plates.prairieFront, plates.prairieCorner] },
  { id: "red-brick-house", title: "Red-brick house with three gables", views: [plates.redBrick] },
  { id: "farmhouse-bungalow", title: "Farmhouse bungalow", views: [plates.farmhouse, plates.farmhouseWide] },
  { id: "two-gabled-house", title: "Two-gabled house in board and batten", views: [plates.greenBatten, plates.greenBattenFront] },
  { id: "narrow-contemporary-house", title: "Narrow contemporary house", views: [plates.narrow] },
  { id: "board-and-batten-house", title: "Board and batten over a stone base", views: [plates.whiteBatten] },
  { id: "contemporary-brick-house", title: "Contemporary house in brick and dark cladding", views: [plates.brick] },
];

/** The project a client rendering belongs to, for links to its place on the projects page. */
export function projectOf(plate: Plate) {
  return clientProjects.find((p) => p.views.includes(plate));
}

/** The picture shown for each service: a client rendering where one shows that kind of project, otherwise a study. */
export const servicePlates: Record<string, PlateKey> = {
  "residential-additions": "addition",
  "commercial-permits": "commercial",
  "interior-renovation-permits": "storefront",
  "legal-basement-permits": "basement",
  "deck-permits": "deck",
  "custom-home-permits": "stone",
  "finished-basement-permits": "finishedBasement",
  "below-grade-entrance-permits": "belowGrade",
  "load-bearing-wall-removal": "beam",
  "detached-garage-permits": "garage",
};

/**
 * A service page's own picture, where the homepage Services list already
 * shows the service's plate: no picture is shown in two places.
 */
export const servicePagePlates: Record<string, PlateKey> = {
  "custom-home-permits": "classical",
  "residential-additions": "additionGarden",
  "commercial-permits": "commercialFitout",
  "interior-renovation-permits": "renovationOpening",
  "legal-basement-permits": "basementApartment",
  "deck-permits": "raisedDeck",
};

export function plateForService(slug: string): Plate {
  return plates[servicePlates[slug] ?? "infill"];
}

/** The picture at the top of a service's own page. */
export function pagePlateForService(slug: string): Plate {
  const key = servicePagePlates[slug];
  return key ? plates[key] : plateForService(slug);
}

/**
 * A `sizes` length for a plate drawn with object-fit: cover in a frame of
 * the given aspect ratio (width / height) and width. A picture wider than
 * its frame is drawn to the frame's height, so it is fetched that much wider
 * to stay sharp; `scale` allows for a zoom inside the frame.
 */
export function coverWidth(plate: Plate, frameAspect: number, frameWidth: string, scale = 1) {
  const k = Math.max(1, plate.width / plate.height / frameAspect) * scale;
  return k === 1 ? frameWidth : `calc(${frameWidth} * ${+k.toFixed(3)})`;
}

/**
 * A `sizes` length for a plate drawn with object-fit: cover in a frame
 * `frameHeight` tall and narrower than the picture's proportions (a portrait
 * frame), so the picture is drawn to the frame's height: that height times
 * the picture's aspect ratio, times `scale`.
 */
export function coverWidthByHeight(plate: Plate, frameHeight: string, scale = 1) {
  return `calc(${frameHeight} * ${+((plate.width / plate.height) * scale).toFixed(3)})`;
}
