/**
 * What others say about PermitGuys, and who it has worked with: the
 * homepage's Praise section (reviews, the Mike Holmes quote, the company
 * logos) and the municipalities' seals in the intro (Intro.tsx).
 *
 * Everything here was published by PermitGuys on permitguys.ca (read on
 * 30 October 2026) and asked for again by the business on the new site:
 * the reviews are its Google reviews as the old homepage quoted them, word
 * for word (no star counts were shown there, so none are given here); the
 * quote is Mike Holmes's, from #HolmesFamilyRescue, shortened only where
 * the ellipsis says. Never write or edit review text by hand.
 *
 * Logos are drawn in one colour (globals.css, ".logo-row"), so each file
 * keeps its owner's own artwork. Sources are in public/images/CREDITS.md.
 */

export interface FeaturedReview {
  author: string;
  text: string;
}

export const featuredReviews: FeaturedReview[] = [
  {
    author: "Paul Deol",
    text: "I worked with Mati, Daniel and Aamou to get my basement designed and permitted, and was very happy with the service!  They were responsive, provided great advice, and ultimately came up with a design that is perfect for my needs.  I look forward to working with them again for future projects.",
  },
  {
    author: "Jas Kaur Kalsi",
    text: "Very professional team. Loved working with Aamou. He was always available to answer any questions or concerns. The whole experience was easy and they took care of dealing with the town. I made changes to the designs but they were very patient and made recommendations.",
  },
  {
    author: "Rie Fukasawa-Rowan",
    text: "I was assigned to our new office renovation project but had no experience - let alone applying for city permits but Mati and his team made it easy for me! Tey are professional and waste no time. Highly recommended!",
  },
  {
    author: "James Gillespie",
    text: "Very excellent accurate and professional treatment of our situation, planning and making successful application for construction of an upper rear balcony! The Construction drawings provided were engineered to code and totally comprehensive with inspection requirements.",
  },
  {
    author: "Pamir Rafiq",
    text: "I have made nothing but good experiences with this company. Exceeding expectations always. Mati and Aamou are the perfect leaders and their team shows it. Always professional, reliable with high quality workmanship.",
  },
];

export const holmesQuote = {
  text: "When a contractor messes with structure and doesn’t pull permits, it can kill someone. … Love working with permitguys on #HolmesFamilyRescue. We go through the proper process to obtain all the permits needed.",
  author: "Mike Holmes",
  note: "On #HolmesFamilyRescue",
  photo: {
    src: "/images/press/mike-holmes-site-visit.jpg",
    width: 710,
    height: 474,
    alt: "Mike Holmes, in a white hard hat, going over a drawing with two members of the PermitGuys team in a framed-out house.",
  },
};

export interface Logo {
  name: string;
  src: string;
  width: number;
  height: number;
}

/** Companies PermitGuys has worked with or been featured by, in the business's order. */
export const partners: Logo[] = [
  { name: "Holmes Family Rescue, with Mike Holmes", src: "/logos/partners/holmes-family-rescue.png", width: 351, height: 116 },
  { name: "HGTV", src: "/logos/partners/hgtv.svg", width: 824, height: 500 },
  { name: "WSIB Ontario", src: "/logos/partners/wsib.svg", width: 206, height: 72 },
  { name: "Aecon", src: "/logos/partners/aecon.png", width: 460, height: 69 },
  { name: "QuadReal", src: "/logos/partners/quadreal.svg", width: 180, height: 40 },
  { name: "FinishedBasement.ca", src: "/logos/partners/finished-basement.png", width: 743, height: 105 },
];

/**
 * Municipalities whose building departments PermitGuys works with: the set
 * the old homepage showed under "Municipalities we work with", with
 * Toronto, Burlington and Hamilton added on the business's word (31 October
 * 2026). Add or remove one only on the business's word.
 */
export interface Municipality extends Logo {
  /** The place as the intro's sentence names it. */
  place: string;
}

export const municipalities: Municipality[] = [
  { name: "City of Toronto", place: "Toronto", src: "/logos/municipalities/toronto.svg", width: 49, height: 15 },
  { name: "City of Mississauga", place: "Mississauga", src: "/logos/municipalities/mississauga.svg", width: 203, height: 34 },
  { name: "Town of Oakville", place: "Oakville", src: "/logos/municipalities/oakville.svg", width: 137, height: 88 },
  { name: "City of Brampton", place: "Brampton", src: "/logos/municipalities/brampton.png", width: 220, height: 44 },
  { name: "City of Markham", place: "Markham", src: "/logos/municipalities/markham.svg", width: 130, height: 40 },
  { name: "Town of Newmarket", place: "Newmarket", src: "/logos/municipalities/newmarket.svg", width: 151, height: 98 },
  { name: "Town of Aurora", place: "Aurora", src: "/logos/municipalities/aurora.svg", width: 187, height: 94 },
  { name: "City of Oshawa", place: "Oshawa", src: "/logos/municipalities/oshawa.svg", width: 162, height: 50 },
  { name: "City of Burlington", place: "Burlington", src: "/logos/municipalities/burlington.svg", width: 600, height: 153 },
  { name: "City of Hamilton", place: "Hamilton", src: "/logos/municipalities/hamilton.svg", width: 278, height: 63 },
];

/**
 * A logo's drawn height, so marks of every shape read at about the same
 * weight: a wide wordmark is drawn lower than a compact badge (height falls
 * with the square root of the aspect ratio), within `min`–`max` rem.
 */
export function logoHeight(logo: Logo, base = 3.1, min = 1.35, max = 3.4) {
  const aspect = logo.width / logo.height;
  return Math.min(max, Math.max(min, base / Math.sqrt(aspect)));
}
