import { afterEach, describe, expect, it, vi } from "vitest";
import { getGoogleReviews, parsePlacesResponse } from "@/lib/reviews";
import { site } from "@/content/site";

describe("parsePlacesResponse", () => {
  it("maps rating, count, link and reviews with their authors", () => {
    const summary = parsePlacesResponse(
      {
        rating: 4.8,
        userRatingCount: 59,
        googleMapsUri: "https://maps.google.com/?cid=1",
        reviews: [
          {
            rating: 5,
            text: { text: "Translated" },
            originalText: { text: "Original words" },
            relativePublishTimeDescription: "a month ago",
            authorAttribution: { displayName: "A. Client", uri: "https://www.google.com/maps/contrib/1", photoUri: "https://lh3.googleusercontent.com/a" },
          },
        ],
      },
      "https://fallback.example",
    );
    expect(summary).toMatchObject({ rating: 4.8, count: 59, url: "https://maps.google.com/?cid=1", source: "places-api" });
    expect(summary?.reviews).toEqual([
      {
        author: "A. Client",
        authorUrl: "https://www.google.com/maps/contrib/1",
        photoUrl: "https://lh3.googleusercontent.com/a",
        rating: 5,
        text: "Original words",
        relativeTime: "a month ago",
        publishTime: undefined,
      },
    ]);
  });

  it("drops reviews without text, author or rating", () => {
    const summary = parsePlacesResponse(
      {
        rating: 4,
        userRatingCount: 3,
        reviews: [{ rating: 5, text: { text: "" }, authorAttribution: { displayName: "X" } }, { text: { text: "Hi" } }, { rating: 4, text: { text: "Good" } }],
      },
      "https://fallback.example",
    );
    expect(summary?.reviews).toEqual([]);
    expect(summary?.url).toBe("https://fallback.example");
  });

  it("returns null without a rating", () => {
    expect(parsePlacesResponse({ userRatingCount: 2 }, "https://fallback.example")).toBeNull();
  });
});

describe("getGoogleReviews", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses the recorded profile rating, with no review text, when the API is not configured", async () => {
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const summary = await getGoogleReviews();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ rating: site.reviews?.rating, count: site.reviews?.count, reviews: [], source: "profile" });
  });

  it("falls back to the profile rating when the API fails", async () => {
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "key");
    vi.stubEnv("GOOGLE_PLACE_ID", "place");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 403 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const summary = await getGoogleReviews();
    expect(summary?.source).toBe("profile");
  });

  it("sends the key and field mask to the Places API", async () => {
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "key");
    vi.stubEnv("GOOGLE_PLACE_ID", "place-id");
    const fetchSpy = vi.fn().mockResolvedValue(Response.json({ rating: 5, userRatingCount: 1, reviews: [] }));
    vi.stubGlobal("fetch", fetchSpy);
    const summary = await getGoogleReviews();
    expect(summary).toMatchObject({ rating: 5, count: 1, source: "places-api" });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://places.googleapis.com/v1/places/place-id?languageCode=en");
    expect(init.headers).toMatchObject({ "X-Goog-Api-Key": "key", "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews" });
  });
});
