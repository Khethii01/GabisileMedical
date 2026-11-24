"use strict";

// Vercel serverless function: GET /api/reviews
//
// Fetches the clinic's Google rating and reviews from the Places API (New) and
// returns a trimmed JSON object. The API key stays on the server, so it is never
// visible in the browser.
//
// Environment variables (set in Vercel > Project > Settings > Environment Variables):
//   GOOGLE_PLACES_API_KEY    required. Restrict the key to "Places API (New)" only.
//   GOOGLE_PLACE_ID          required. The clinic's Place ID.
//   REVIEWS_CACHE_SECONDS    optional. Default 0 (no caching).
//
// Why no caching by default: Google's Places API policy restricts caching of
// Places content other than the place ID. Raising REVIEWS_CACHE_SECONDS caches
// the response at Vercel's edge and lowers cost, but check the terms first.
//
// Google returns at most five reviews, chosen by Google ("most relevant").
// They are passed through unfiltered and unaltered.

const FIELDS = "rating,userRatingCount,googleMapsUri,reviews";
const TIMEOUT_MS = 5000;

const isGoogleHost = (h) => h === "google.com" || h.endsWith(".google.com");
const isGoogleUserContent = (h) => h.endsWith(".googleusercontent.com");

function safeUrl(value, hostTest) {
  try {
    const u = new URL(String(value || ""));
    return u.protocol === "https:" && hostTest(u.hostname) ? u.href : "";
  } catch {
    return "";
  }
}

const text = (value, max) => String(value == null ? "" : value).slice(0, max);

function send(res, status, body, cacheSeconds) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    cacheSeconds > 0 && status === 200 ? `public, s-maxage=${cacheSeconds}` : "no-store",
  );
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  const ttl = Math.max(0, parseInt(process.env.REVIEWS_CACHE_SECONDS || "0", 10) || 0);

  if (req.method !== "GET") return send(res, 405, { reviews: [] }, 0);
  // Not configured yet: the page simply shows the Google buttons without reviews.
  if (!key || !placeId) return send(res, 503, { reviews: [] }, 0);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`;
    const r = await fetch(url, {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELDS },
      signal: controller.signal,
    });
    if (!r.ok) {
      // Log the status only. Never log or return the key or Google's error body.
      console.error("Places API responded with status", r.status);
      return send(res, 502, { reviews: [] }, 0);
    }
    const place = await r.json();
    const reviews = (Array.isArray(place.reviews) ? place.reviews : [])
      .map((rv) => ({
        author: text(rv.authorAttribution && rv.authorAttribution.displayName, 80),
        authorUri: safeUrl(rv.authorAttribution && rv.authorAttribution.uri, isGoogleHost),
        photo: safeUrl(rv.authorAttribution && rv.authorAttribution.photoUri, isGoogleUserContent),
        rating: Math.min(5, Math.max(0, Math.round(Number(rv.rating) || 0))),
        text: text(rv.text && rv.text.text, 2000),
        when: text(rv.relativePublishTimeDescription, 40),
      }))
      .filter((rv) => rv.text.trim() && rv.rating > 0);

    return send(
      res,
      200,
      {
        rating: typeof place.rating === "number" ? place.rating : null,
        count: Number.isFinite(place.userRatingCount) ? place.userRatingCount : null,
        mapsUri: safeUrl(place.googleMapsUri, isGoogleHost),
        reviews,
      },
      ttl,
    );
  } catch (err) {
    console.error("Reviews request failed:", err && err.name ? err.name : "error");
    return send(res, 502, { reviews: [] }, 0);
  } finally {
    clearTimeout(timer);
  }
};
