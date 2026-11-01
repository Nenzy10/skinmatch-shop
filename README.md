# SkinMatch Shop

**One selfie in — a skincare basket matched to your skin out.**

SkinMatch Shop is a one-screen skin-AI shopping assistant built for the
**YouCam API Skin AI & eCommerce VTO Hackathon** (Perfect Corp, on Devpost).
A shopper uploads a front-facing selfie; Perfect Corp's YouCam Skin AI
analyses it; the shop turns the flagged skin concerns into a small product
basket where **every item carries a plain-language reason** ("why this
matches your skin") and a running total.

## Who it's for

**Indie beauty sellers** — the small Shopify/Instagram/Etsy skincare shops
that can't license enterprise beauty-AI tooling. Drop SkinMatch Shop in front
of a demo catalog (or wire the basket to your own checkout) and your customers
get a guided, personalised recommendation instead of a wall of products.

## How it works

1. **Selfie** — the shopper uploads a photo, or picks one of three bundled
   sample faces to try the flow.
2. **Analysis** — the photo goes through the YouCam Skin AI API (see below),
   which returns a 1–100 health score per skin concern (higher = healthier).
   Concerns under 70 are flagged.
3. **Basket** — each flagged concern is mapped to products in the demo
   catalog that answer it, worst concern first. Every basket shows the
   per-product reason and a total price. SPF always closes the basket,
   because it protects every other step.

## How the YouCam API is used

Implemented against Perfect Corp's official documentation
(docs.perfectcorp.com, *AI Skin Analysis* reference, V2 API):

- **Auth:** `Authorization: Bearer <API key>` on every call — the V2 API has
  no separate auth endpoint.
- **Upload:** `POST /s2s/v2.0/file` registers the image and returns a
  `file_id` plus a pre-signed URL; the image bytes are then `PUT` to that URL.
- **Task:** `POST /s2s/v2.0/task/skin-analysis` with `src_file_id` and
  `dst_actions` naming the SD skin concerns to score (wrinkle, pore, texture,
  acne, age spots, dark circles, redness, oiliness, moisture, firmness,
  radiance, eye bags), with mask overlays enabled.
- **Poll:** `GET /s2s/v2.0/task/skin-analysis/<task_id>` until
  `task_status` is `success`, then read `results.output` —
  `{ type, ui_score, raw_score, mask_urls }` per concern. Detection-mask
  URLs, when returned, are shown as overlays in the results.

Base URL: `https://yce-api-01.makeupar.com`

## Demo / sample mode (honest labelling)

The app ships with three bundled sample faces and matching **sample
analysis data**. Sample mode is used when a sample face is picked, or when
no API key is configured. Whenever sample data is on screen, the results
carry a visible **"Sample analysis — demo data"** badge; a real API result
carries a "Live YouCam Skin AI result" badge instead. If a live call fails,
the app shows the error — it never silently swaps in sample data.

## Run / deploy

No build step — it's static files:

```bash
# any static server works
python3 -m http.server 8000
# open http://localhost:8000
```

Deploy by dropping the folder (or `skinmatch.zip`) onto Netlify/Vercel/
GitHub Pages as-is.

**To go live with real analyses:** redeem the Start Kit code at
yce.perfectcorp.com (Account → Redeem Code), copy your API key into the
`YOUCAM_API_KEY` constant at the top of `app.js`, and redeploy. Note for a
production (non-hackathon) deployment: route calls through a small proxy
rather than exposing an unrestricted key in client code.

## Status

Hackathon build, scaffolded 2026-10-31. At scaffold time the YouCam account
balance is **0 units** — the 1,000 free Start Kit units arrive via an emailed
redeem code that has not landed yet, so the live path is fully wired but not
yet exercised against the real API; the sample path is the working demo until
then. See `BUILD_STATUS.md` for the activation checklist. The product catalog
and prices are a demo store — no real shop, sales, or partnerships are claimed.

## Files

- `index.html` — the one-screen shop (markup + styles)
- `app.js` — config, catalog, sample data, YouCam API client, basket logic, UI
- `samples/` — three sample portrait photos (AI-generated demo faces)
