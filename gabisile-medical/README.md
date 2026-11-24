# Gabisile Medical Facility

Website for Gabisile Medical Facility, a nurse-led private clinic in Isipingo, Durban.

Multi-page static site. Plain HTML, CSS and vanilla JS. Every page is real HTML with its own URL, title, description, canonical and structured data.

## Pages

| URL | Page |
| --- | --- |
| `/` | Home |
| `/about/` | Your nurse |
| `/services/` | Services hub |
| `/services/everyday-care/` | Everyday care |
| `/services/mother-and-child/` | Mother and child |
| `/services/tests-and-screening/` | Tests and screening |
| `/iv-drips/` | IV drips |
| `/employers/` | Pre-employment, PDP and wellness days |
| `/book/` | Booking form (opens WhatsApp) |
| `/find-us/` | Address, hours, map |
| `/faq/` | FAQ (FAQPage schema) |
| `/privacy-policy/`, `/terms/` | Legal |
| `404.html` | Not found |

## How it is built

The HTML files are generated. Do not edit them by hand.

- `scripts/site.mjs` holds every fact (phone, address, hours, domain) and every service and FAQ answer.
- `scripts/build.mjs` turns that into all pages, `sitemap.xml`, `robots.txt` and `site.webmanifest`.

After any change in `scripts/`, regenerate:

```bash
node scripts/build.mjs
```

No dependencies. Needs Node 18 or newer.

## Running locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Links are relative, so the site also works under a sub-path.

## Before going live

- Set the real domain in `SITE.url` in `scripts/site.mjs`, then rebuild. Canonicals, sitemap and social previews use it.
- Review `privacy-policy/` and `terms/` (wording is in `scripts/build.mjs`) with someone qualified.
- Add the nurse's name and SANC registration number once confirmed.

## Notes

- Bookings go through WhatsApp (066 352 6383). The form builds a prefilled `wa.me` link, nothing is stored or posted anywhere.
- Fonts: Bodoni Moda and Jost from Google Fonts.
- `js/main.js` only enhances the page (menu, booking link, animations). Content works without it.

## Google reviews

Reviews appear on the home page and `/reviews/`. They are fetched live by `api/reviews.js` (a Vercel serverless function) from the Google Places API (New). The API key stays on the server.

Setup, one time:

1. Find the clinic's Place ID: https://developers.google.com/maps/documentation/places/web-service/place-id
2. Put it in `SITE.google.placeId` in `scripts/site.mjs`, then run `node scripts/build.mjs`. This points the "Review us on Google" and "Read all reviews" buttons at the right place.
3. In Google Cloud, create a project, enable billing and enable "Places API (New)". Create an API key and restrict it to Places API (New). Set a budget alert and a daily quota cap.
4. In Vercel, Project Settings, Environment Variables, add `GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACE_ID`. Redeploy.

Notes:

- Google returns at most five reviews, picked by Google. They are shown unfiltered.
- Reviews are not cached by default, because Google restricts caching of Places data. `REVIEWS_CACHE_SECONDS` (optional env var) turns on edge caching to cut cost. Check Google's terms before using it.
- The "Google Maps" attribution under the reviews is required by Google. Don't remove it.
- Locally (`python3 -m http.server`) there is no `/api`, so only the buttons show. Use `vercel dev` to test the function.
- Do not add `AggregateRating` or `Review` structured data for these reviews. Google ignores self-hosted reviews for LocalBusiness.
