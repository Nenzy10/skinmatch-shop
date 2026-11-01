# SkinMatch Shop — build status
Updated 2026-10-31 (Asia/Dubai)

## Done
- App scaffolded in this folder: `index.html` + `app.js`, no build step,
  Netlify-drop ready (`skinmatch.zip` built with site files at zip root).
- Full shopper flow implemented: selfie upload or sample pick → analysis →
  flagged-concern results (score bars, optional API mask overlays) →
  concern-matched basket with per-product "why" lines and total.
- Live YouCam path implemented against the official docs
  (docs.perfectcorp.com/reference/ai_skin_analysis, read 2026-10-31):
  `POST /s2s/v2.0/file` → PUT bytes to the pre-signed URL →
  `POST /s2s/v2.0/task/skin-analysis` (SD `dst_actions`, mask overlay on,
  `format: "json"`) → poll `GET /s2s/v2.0/task/skin-analysis/<id>` →
  parse `results.output[]` `{type, ui_score, raw_score, mask_urls}`.
  Auth: `Authorization: Bearer <key>`. Scores: higher `ui_score` = healthier.
- Sample path: 3 AI-generated sample portraits in `samples/` (1600×1600,
  inside the API's SD file specs) + 3 bundled sample analysis profiles with
  varied concern patterns. Sample results always render with the
  "Sample analysis — demo data" badge; live results get a "Live" badge.
  A failed live call shows the error — no silent sample fallback.
- Verified locally: `node --check app.js` passes; basket logic unit-tested
  in node for all 3 sample profiles and for a documented-shape API payload
  (incl. `hd_` prefix normalisation); static files serve 200 via a local
  HTTP server. Demo baskets: $106 / $115 / $117, each 6 items ending in SPF.

## Blocked / pending
- **API units: 0.** YouCam account "NB Default Nenzy Brown (NENZY)" exists;
  the 1,000 free Start Kit units come via an emailed redeem code that had
  NOT arrived as of the decisive Gmail check on 2026-10-31. Until it lands,
  `YOUCAM_API_KEY` stays empty and the app runs in demo mode.

## Activates the moment the redeem code lands
1. Redeem at **yce.perfectcorp.com → Account → Redeem Code**; confirm the
   balance shows ~1,000 units.
2. Copy the API key into `YOUCAM_API_KEY` at the top of `app.js`.
3. Live-test with the 3 bundled sample photos first (cheap, known faces):
   upload each via the app, confirm tasks succeed and units deduct only on
   success.
4. **Confirm response parsing against the real payload** — especially:
   exact `type` strings returned for the SD concerns, whether any overall
   score / `skin_age` field appears in the JSON task output (docs show it
   only in the ZIP flow's `score_info.json`; the UI currently averages the
   concern scores and labels it as an average), and mask URL presence.
5. Check browser CORS against `yce-api-01.makeupar.com`; if blocked, put a
   thin proxy in front before the demo recording.
6. Cache the sample-photo live results so judging traffic doesn't burn units
   (per PLAN.md risk note); rebuild `skinmatch.zip` after any change.

## Nov 1 submission checklist (from PLAN.md)
- [x] Deploy final build to Netlify; verify the live URL end-to-end.
      (Re-verified 2026-11-01 in a real browser session: sample 1 → badge
      "Sample analysis — demo data", overall 67, basket 6 items / $106.)
- [ ] Push the public repo (this folder minus secrets — the key is a
      placeholder, nothing to scrub). Local git repo initialised + committed
      2026-11-01; repo CREATION still needs the signed-in browser (GitHub App
      cannot create repos, gh not logged in). Zip of the committed tree is at
      `submission/skinmatch-shop-repo.zip`.
- [x] Record the 1–3 min demo video: REAL screen recording of the live site
      (selfie → analysis → basket) with narration naming the YouCam API and
      disclosing sample mode out loud — `submission/skinmatch-demo.mp4`
      (1m40s, 1280×720, captioned). YouTube upload still needs the signed-in
      browser.
- [x] Devpost text description + screenshots: full paste-ready pack at
      `submission/DEVPOST_SUBMISSION.md`; screenshots `01-upload.png`,
      `02-results.png`, `03-basket.png` captured from the live site.
- [ ] SUBMIT on Nov 1 — a full day ahead of the Nov 2, 20:45 Dubai deadline.
      Blocked only on the three signed-in-browser steps listed at the bottom
      of `submission/DEVPOST_SUBMISSION.md` (repo create, YouTube upload,
      Devpost submit).
- [x] Do not pitch the Women in Tech or Rising Star awards (not eligible);
      addressable pool is the $2,500 / $1,000 / $500 podium.
