import { site } from "@/content/site";

/*
 * Google reviews for the homepage and contact page.
 *
 * With GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID set, the rating, review
 * count and up to five recent reviews come live from the Places API (New)
 * and refresh once a day. Without them, the site shows the rating recorded
 * in src/content/site.ts and links to the reviews on Google; no review text
 * is shown, because it cannot be checked. See docs/REVIEWS.md.
 */

export interface GoogleReview {
  author: string;
  authorUrl?: string;
  photoUrl?: string;
  rating: number;
  text: string;
  /** Google's own wording, such as "2 months ago". */
  relativeTime: string;
  publishTime?: string;
}

export interface ReviewSummary {
  rating: number;
  count: number;
  /** Where "Read all reviews" goes. */
  url: string;
  reviews: GoogleReview[];
  source: "places-api" | "profile";
  /** ISO date the figures were read, for the profile source. */
  asOf?: string;
}

const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places/";
const FIELD_MASK = "rating,userRatingCount,googleMapsUri,reviews";
export const REVIEWS_REVALIDATE_SECONDS = 86_400;

interface PlacesReview {
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  relativePublishTimeDescription?: string;
  publishTime?: string;
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
}

interface PlacesResponse {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: PlacesReview[];
}

/** Maps a Places API (New) place to what the site shows. Exported for tests. */
export function parsePlacesResponse(data: PlacesResponse, fallbackUrl: string): ReviewSummary | null {
  if (typeof data.rating !== "number" || typeof data.userRatingCount !== "number") return null;
  const reviews = (data.reviews ?? [])
    .map((r): GoogleReview | null => {
      const text = (r.originalText?.text ?? r.text?.text ?? "").trim();
      const author = r.authorAttribution?.displayName?.trim();
      if (!text || !author || typeof r.rating !== "number") return null;
      return {
        author,
        authorUrl: r.authorAttribution?.uri,
        photoUrl: r.authorAttribution?.photoUri,
        rating: r.rating,
        text,
        relativeTime: r.relativePublishTimeDescription ?? "",
        publishTime: r.publishTime,
      };
    })
    .filter((r): r is GoogleReview => r !== null);
  return {
    rating: data.rating,
    count: data.userRatingCount,
    url: data.googleMapsUri ?? fallbackUrl,
    reviews,
    source: "places-api",
  };
}

async function fetchPlaces(apiKey: string, placeId: string, fallbackUrl: string): Promise<ReviewSummary | null> {
  try {
    const res = await fetch(`${PLACES_ENDPOINT}${encodeURIComponent(placeId)}?languageCode=en`, {
      headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": FIELD_MASK },
      next: { revalidate: REVIEWS_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error(`[reviews] Places API returned HTTP ${res.status}`);
      return null;
    }
    return parsePlacesResponse((await res.json()) as PlacesResponse, fallbackUrl);
  } catch (error) {
    console.error("[reviews] Places API request failed", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Live Google reviews when configured, otherwise the recorded profile rating, otherwise null. */
export async function getGoogleReviews(): Promise<ReviewSummary | null> {
  const profile = site.reviews;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (apiKey && placeId) {
    const live = await fetchPlaces(apiKey, placeId, profile?.url ?? "https://www.google.com/maps");
    if (live) return live;
  }
  if (!profile) return null;
  return { rating: profile.rating, count: profile.count, url: profile.url, reviews: [], source: "profile", asOf: profile.asOf };
}
