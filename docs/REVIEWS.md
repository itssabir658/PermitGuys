# Google reviews and map

The homepage and contact page show the business's Google rating, recent Google reviews and a map.

## What shows without any setup

- The rating and review count recorded in `src/content/site.ts` (`reviews`), with the date they were read and a link to the reviews on Google. Update them by hand, or set up the Places API below so they update themselves.
- A visible placeholder where review text will go. Review text is never typed in by hand.
- The map location in `site.map`. The map loads from Google only when a visitor clicks "Show the map".

## Live reviews from the Places API

1. In Google Cloud, create or pick a project, enable **Places API (New)** and create an API key. Restrict it to the Places API. It is used only on the server, so no website restriction is needed.
2. Find the place ID: search for the business in Google's Place ID Finder (developers.google.com/maps/documentation/places/web-service/place-id) and copy the ID.
3. Set `GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACE_ID` in the hosting environment and redeploy.

The site then shows the live rating and count and up to five recent reviews, each with the reviewer's name linked to their Google profile and the time Google gives. The data refreshes once a day (`REVIEWS_REVALIDATE_SECONDS` in `src/lib/reviews.ts`). If Google is unreachable or the key is wrong, the site logs an error and falls back to the recorded rating.

Google's terms require showing the reviewer attribution and not editing review text; the components do both. Reviews are not marked up as structured data, because Google does not allow a business to mark up its own reviews.

## Map

`site.map` sets the search the map shows (`query`), the label under it and an optional note. If the office address should not be published, change `query` to the service area, for example `Greater Toronto Area, ON`, and update the label.

Optionally set `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` (a Maps Embed API key restricted to the site's domain) to use Google's official embed. Without it the standard embed link is used.
