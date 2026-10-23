/**
 * The site's imagery, of two kinds (see docs/IMAGES.md).
 *
 * Client renderings ("project"): design renderings from PermitGuys client
 * projects, supplied by PermitGuys in October 2026, at most two views of any
 * one project. They are renderings, not photographs of finished buildings.
 * Captions and alt text describe only what the picture shows: never an
 * address, street or town, and nothing about a project's scope or results.
 *
 * Rendered studies ("study"): original renders made for this website, kept
 * only for kinds of project no client rendering shows (additions, basement
 * units, commercial units, decks). Their captions always say they are
 * studies, so they are never read as PermitGuys work.
 */

export interface Plate {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Short editorial caption, shown as "Fig." text beside the image. */
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
} satisfies Record<string, Plate>;

export type PlateKey = keyof typeof plates;

/**
 * The client projects, as shown on the projects page. Each has one or two
 * views (never more), and its id is the anchor there: a description of the
 * house, never an address.
 */
export interface ClientProject {
  id: string;
  title: string;
  views: { plate: Plate; view: string }[];
}

export const clientProjects: ClientProject[] = [
  {
    id: "contemporary-house",
    title: "Contemporary house with a pool terrace",
    views: [
      { plate: plates.dusk, view: "From the lawn, at dusk" },
      { plate: plates.terrace, view: "The rear terrace and pool" },
    ],
  },
  { id: "stone-house", title: "Stone house with three gables", views: [{ plate: plates.stone, view: "From the street" }] },
  {
    id: "prairie-style-house",
    title: "Prairie-style two-storey",
    views: [
      { plate: plates.prairieFront, view: "From the street" },
      { plate: plates.prairieCorner, view: "From the corner" },
    ],
  },
  { id: "red-brick-house", title: "Red-brick house with three gables", views: [{ plate: plates.redBrick, view: "From the street" }] },
  { id: "farmhouse-bungalow", title: "Farmhouse bungalow", views: [{ plate: plates.farmhouse, view: "From the street" }] },
  { id: "two-gabled-house", title: "Two-gabled house in board and batten", views: [{ plate: plates.greenBatten, view: "From the street" }] },
  { id: "narrow-contemporary-house", title: "Narrow contemporary house", views: [{ plate: plates.narrow, view: "From the street" }] },
  { id: "board-and-batten-house", title: "Board and batten over a stone base", views: [{ plate: plates.whiteBatten, view: "From the street" }] },
  { id: "contemporary-brick-house", title: "Contemporary house in brick and dark cladding", views: [{ plate: plates.brick, view: "From the street" }] },
];

/** The project a client rendering belongs to, for links to its place on the projects page. */
export function projectOf(plate: Plate) {
  return clientProjects.find((p) => p.views.some((v) => v.plate === plate));
}

/** The picture shown for each service: a client rendering where one shows that kind of project, otherwise a study. */
export const servicePlates: Record<string, PlateKey> = {
  "residential-additions": "addition",
  "commercial-permits": "commercial",
  "landlord-permits": "infill",
  "interior-renovation-permits": "storefront",
  "legal-basement-permits": "basement",
  "deck-permits": "deck",
  "custom-home-permits": "stone",
};

export function plateForService(slug: string): Plate {
  return plates[servicePlates[slug] ?? "infill"];
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
