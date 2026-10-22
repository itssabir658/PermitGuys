/**
 * Art-directed imagery for the site.
 *
 * Every image here is an original rendered study made for this website
 * (see docs/IMAGES.md): massing models and dusk visualisations of the
 * kinds of projects PermitGuys prepares drawings for. None of them is a
 * PermitGuys client project, and captions always say so. When genuine
 * project photography is supplied, add it as a case study in projects.ts
 * and swap the matching plate here.
 */

export interface Plate {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Short editorial caption, shown as "Fig." text beside the image. */
  caption: string;
  /** CSS object-position for crops, so the subject survives narrow screens. */
  focus?: string;
}

export const STUDY_NOTE = "Rendered study for illustration, not a client project.";

export const plates = {
  infill: {
    src: "/images/studies/infill-house-dusk.jpg",
    width: 2560,
    height: 1440,
    alt: "A contemporary two-storey house at dusk on a residential street, its dark metal upper storey cantilevered over a pale, glazed ground floor.",
    caption: "Infill house at dusk",
    focus: "68% 60%",
  },
  detail: {
    src: "/images/studies/cantilever-detail.jpg",
    width: 1600,
    height: 2000,
    alt: "Close view of a cantilevered upper storey: dark standing-seam cladding, a deep window reveal and warm soffit lights above full-height glazing.",
    caption: "Cantilever, soffit and reveal",
    focus: "50% 40%",
  },
  addition: {
    src: "/images/studies/rear-addition-model.jpg",
    width: 1600,
    height: 2000,
    alt: "Architectural model of a house with a new two-storey rear addition clad in dark metal and timber slats, opening onto a timber deck.",
    caption: "Two-storey rear addition",
    focus: "50% 50%",
  },
  basement: {
    src: "/images/studies/basement-section-model.jpg",
    width: 2400,
    height: 1600,
    alt: "Sectional model of a two-storey house cut open to show a lit basement apartment with its own stair down to a separate entrance.",
    caption: "Second unit, in section",
    focus: "55% 55%",
  },
  commercial: {
    src: "/images/studies/main-street-commercial.jpg",
    width: 1960,
    height: 1600,
    alt: "A brick main-street building at dusk with two glazed ground-floor commercial units lit from within.",
    caption: "Main-street commercial units",
    focus: "45% 70%",
  },
  deck: {
    src: "/images/studies/rear-deck.jpg",
    width: 2400,
    height: 1600,
    alt: "A timber deck stepping down to a garden from a rear addition with full-height glazing and a timber screen above.",
    caption: "Rear deck and glazing",
    focus: "40% 60%",
  },
  front: {
    src: "/images/studies/infill-house-street.jpg",
    width: 1600,
    height: 2000,
    alt: "Street elevation of a two-storey infill house at dusk: a dark metal upper storey with a long lit window over a glazed ground floor.",
    caption: "Infill house, street elevation",
    focus: "50% 60%",
  },
  aerial: {
    src: "/images/studies/rear-addition-aerial.jpg",
    width: 1600,
    height: 2000,
    alt: "Overhead view of an architectural model: a dark rear addition with a timber screen and deck, between pale neighbouring houses and model trees.",
    caption: "Rear addition, model from above",
    focus: "50% 50%",
  },
  storefront: {
    src: "/images/studies/commercial-storefront.jpg",
    width: 1600,
    height: 2000,
    alt: "Close view of a brick main-street building at dusk, its glazed ground-floor shop lit from within under pendant lights.",
    caption: "Storefront at dusk",
    focus: "55% 60%",
  },
} satisfies Record<string, Plate>;

export type PlateKey = keyof typeof plates;

/** The study shown for each service. */
export const servicePlates: Record<string, PlateKey> = {
  "residential-additions": "addition",
  "commercial-permits": "commercial",
  "landlord-permits": "infill",
  "interior-renovation-permits": "storefront",
  "legal-basement-permits": "basement",
  "deck-permits": "deck",
  "custom-home-permits": "front",
};

export function plateForService(slug: string): Plate {
  return plates[servicePlates[slug] ?? "infill"];
}
