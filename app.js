"use strict";
/* ============================================================================
   SkinMatch Shop — app.js
   Flow: selfie -> YouCam Skin AI analysis -> concern-matched product basket.

   API INTEGRATION (implemented against Perfect Corp's official docs,
   https://docs.perfectcorp.com/reference/ai_skin_analysis — read 2026-10-31):
     Base URL : https://yce-api-01.makeupar.com
     Auth     : Authorization: Bearer <API key>   (V2 API — no separate
                auth endpoint; key from the YouCam API console)
     1. POST /s2s/v2.0/file
          body { files: [{ content_type, file_name, file_size }] }
          -> data.files[0] = { file_id, requests: [{ method:"PUT", url, headers }] }
     2. PUT the raw image bytes to that pre-signed `url` with those headers.
     3. POST /s2s/v2.0/task/skin-analysis
          body { src_file_id, dst_actions: [SD concern names...],
                 miniserver_args: { enable_mask_overlay: true }, format: "json" }
          -> data.task_id
     4. GET  /s2s/v2.0/task/skin-analysis/<task_id>   (poll)
          -> data.task_status: "running" | "success" | "error"
             on success: data.results.output =
               [ { type, ui_score, raw_score, mask_urls: [...] }, ... ]
     Scores: ui_score is 1–100 and HIGHER = healthier skin (per docs),
     so concern severity = 100 - ui_score. SD and HD concerns must never
     be mixed in one request — this app requests SD concerns only.

   TODO — CONFIRM ONCE API UNITS LAND (see BUILD_STATUS.md):
   - The JSON task flow returns per-concern scores only; no overall/"all"
     score or skin_age field is documented for it (those appear in the ZIP
     flow's score_info.json). The UI therefore shows an average and labels
     it as such. Verify against the first real payload.
   - Browser CORS: confirm yce-api-01.makeupar.com accepts browser-origin
     calls with the Bearer key. If it does not, put a thin proxy in front —
     and never ship an unrestricted production key in client code; this
     static demo uses the key directly only because it is a hackathon build.
   - Re-check the "Inputs & Outputs" list of dst_actions enabled for this
     account (SD set below is the documented one as of 2026-10-31).
   ========================================================================== */

/* ================= CONFIG — set your key here ================= */
const YOUCAM_API_KEY = ""; // <-- paste the API key from the YouCam console
                           //     after redeeming the Start Kit units.
const YOUCAM_API_BASE = "https://yce-api-01.makeupar.com";
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120000;

/* SD skin concerns requested from the API (documented dst_actions). */
const SKIN_CONCERNS_SD = [
  "wrinkle", "pore", "texture", "acne", "age_spot", "dark_circle",
  "redness", "oiliness", "moisture", "firmness", "radiance", "eye_bag"
];

/* A concern counts as "flagged" when its health score drops under this. */
const FLAG_THRESHOLD = 70;

/* Human names + one-line meaning for every concern we request. */
const CONCERN_INFO = {
  wrinkle:    { name: "Fine lines & wrinkles", note: "lines settling in, mostly forehead and around the eyes" },
  pore:       { name: "Visible pores",         note: "enlarged pores, usually across the nose and cheeks" },
  texture:    { name: "Rough texture",         note: "uneven, bumpy skin surface" },
  acne:       { name: "Breakouts",             note: "active spots and blemish-prone areas" },
  age_spot:   { name: "Dark spots",            note: "pigmentation and uneven tone" },
  dark_circle:{ name: "Dark circles",          note: "shadowing under the eyes" },
  redness:    { name: "Redness",               note: "flushed, reactive-looking skin" },
  oiliness:   { name: "Excess oil",            note: "shine and oil build-up through the day" },
  moisture:   { name: "Dryness",               note: "low hydration — skin that drinks up moisturiser" },
  firmness:   { name: "Loss of firmness",      note: "skin that is starting to lose its bounce" },
  radiance:   { name: "Dullness",              note: "low glow — skin looking tired and flat" },
  eye_bag:    { name: "Eye bags",              note: "puffiness under the eyes" }
};

/* ================= Demo catalog (indie-seller demo store) =================
   `concerns` lists which flagged concerns a product answers. `why` is the
   plain-language line shown to the shopper, per product. */
const CATALOG = [
  { id: "vitc-serum",   emoji: "🍊", name: "Vitamin C Brightening Serum",   category: "Serum",       price: 24,
    concerns: ["age_spot", "radiance"],
    why: "Vitamin C is the classic for fading dark spots and switching the glow back on." },
  { id: "niacinamide",  emoji: "💧", name: "Niacinamide 10% Serum",         category: "Serum",       price: 16,
    concerns: ["pore", "oiliness", "texture"],
    why: "Niacinamide visibly tightens the look of pores and helps balance oil without drying you out." },
  { id: "salicylic",    emoji: "🌿", name: "Salicylic Acid 2% Treatment",   category: "Treatment",   price: 13,
    concerns: ["acne"],
    why: "Salicylic acid gets inside the pore to clear the build-up that turns into breakouts." },
  { id: "ha-booster",   emoji: "🫧", name: "Hyaluronic Acid Booster",       category: "Serum",       price: 18,
    concerns: ["moisture"],
    why: "Hyaluronic acid pulls water into the skin — the fastest fix for that tight, dry feeling." },
  { id: "ceramide",     emoji: "🧴", name: "Ceramide Barrier Moisturiser",  category: "Moisturiser", price: 21,
    concerns: ["moisture", "redness"],
    why: "Ceramides rebuild the skin barrier, which calms redness and stops moisture escaping." },
  { id: "retinol",      emoji: "🌙", name: "Retinol 0.3% Night Cream",      category: "Treatment",   price: 27,
    concerns: ["wrinkle", "firmness", "texture"],
    why: "Retinol is the best-studied ingredient for softening lines and supporting firmer skin over time." },
  { id: "peptide-eye",  emoji: "👁️", name: "Peptide Firming Eye Cream",    category: "Eye care",    price: 19,
    concerns: ["eye_bag", "firmness"],
    why: "Peptides support the thin under-eye skin so puffiness looks less pronounced." },
  { id: "caffeine-eye", emoji: "☕", name: "Caffeine Brightening Eye Serum",category: "Eye care",    price: 15,
    concerns: ["dark_circle", "eye_bag"],
    why: "Caffeine helps tired under-eyes look brighter and less shadowed." },
  { id: "cleanser",     emoji: "🫧", name: "Gentle Amino Gel Cleanser",     category: "Cleanser",    price: 11,
    concerns: ["acne", "oiliness", "texture"], basic: true,
    why: "A gentle daily cleanse keeps pores clear without stripping the barrier everything else depends on." },
  { id: "spf",          emoji: "☀️", name: "Mineral SPF 50 Sunscreen",     category: "SPF",         price: 14,
    concerns: [], always: true,
    why: "Daily SPF locks in every other step — and stops new dark spots forming while the serums work." }
];

/* ================= Bundled sample analyses (DEMO DATA) =================
   Plausible, varied profiles in the documented API score semantics
   (ui_score 1–100, higher = healthier). Used when a sample photo is picked,
   or when no API key is configured. Always rendered WITH the
   "Sample analysis — demo data" badge. */
const SAMPLE_ANALYSES = {
  "1": { label: "Sample 1", scores: { age_spot: 52, radiance: 55, moisture: 58, dark_circle: 61,
         eye_bag: 63, texture: 66, firmness: 68, redness: 69, pore: 71, wrinkle: 74, oiliness: 77, acne: 84 } },
  "2": { label: "Sample 2", scores: { oiliness: 44, pore: 52, acne: 57, texture: 63, radiance: 64,
         redness: 66, eye_bag: 70, moisture: 71, dark_circle: 72, firmness: 79, wrinkle: 85, age_spot: 88 } },
  "3": { label: "Sample 3", scores: { wrinkle: 46, moisture: 49, firmness: 51, radiance: 57,
         age_spot: 58, eye_bag: 60, texture: 62, dark_circle: 66, redness: 72, pore: 74, oiliness: 81, acne: 90 } }
};

/* ================= Pure logic (also exercised by the node test) ========== */

/* Normalise one documented API output entry into the app's shape. */
function normalizeApiEntry(entry) {
  const concern = String(entry.type || "").replace(/^hd_/, "");
  return {
    concern,
    uiScore: Math.round(Number(entry.ui_score)),
    rawScore: entry.raw_score != null ? Number(entry.raw_score) : null,
    maskUrl: Array.isArray(entry.mask_urls) && entry.mask_urls.length ? entry.mask_urls[0] : null
  };
}

/* Build the internal result list from a { concern: uiScore } map. */
function scoresToResults(scores) {
  return Object.keys(scores).map(k => ({ concern: k, uiScore: scores[k], rawScore: null, maskUrl: null }));
}

/* Flagged = health score under threshold, worst first. */
function flaggedConcerns(results) {
  return results
    .filter(r => r.uiScore < FLAG_THRESHOLD && CONCERN_INFO[r.concern])
    .sort((a, b) => a.uiScore - b.uiScore);
}

/* Map flagged concerns to a basket: for each flagged concern (worst first)
   pick the first not-yet-chosen product that answers it; routine basics and
   the always-on SPF are added last. Basket capped at 6 items. */
function buildBasket(results) {
  const flagged = flaggedConcerns(results);
  const flaggedSet = new Set(flagged.map(f => f.concern));
  const chosen = new Map(); // productId -> { product, forConcerns: [] }

  for (const f of flagged) {
    const product = CATALOG.find(p => !p.always && !p.basic && p.concerns.includes(f.concern) && !chosen.has(p.id));
    if (product) chosen.set(product.id, { product, forConcerns: [f.concern] });
  }
  // Let chosen products also claim any other flagged concerns they answer.
  for (const item of chosen.values()) {
    item.forConcerns = item.product.concerns.filter(c => flaggedSet.has(c));
  }
  // Routine basics (e.g. cleanser) join if they answer a flagged concern.
  for (const p of CATALOG) {
    if (p.basic && !chosen.has(p.id) && p.concerns.some(c => flaggedSet.has(c))) {
      chosen.set(p.id, { product: p, forConcerns: p.concerns.filter(c => flaggedSet.has(c)) });
    }
  }
  // Cap concern-matched items at 5 so the always-on SPF always fits:
  // SPF closes every basket (6 items max in total).
  const items = [...chosen.values()].slice(0, 5);
  const spf = CATALOG.find(p => p.always);
  if (spf && !items.some(i => i.product.id === spf.id)) {
    items.push({ product: spf, forConcerns: [] });
  }
  const total = items.reduce((sum, i) => sum + i.product.price, 0);
  return { items, total, flagged };
}

/* ================= YouCam live API path ================= */
function apiHeaders(json = true) {
  const h = { Authorization: `Bearer ${YOUCAM_API_KEY}` };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function initFileUpload(file) {
  const res = await fetch(`${YOUCAM_API_BASE}/s2s/v2.0/file`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({
      files: [{
        content_type: file.type || "image/jpeg",
        file_name: file.name || "selfie.jpg",
        file_size: file.size
      }]
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.data || !body.data.files || !body.data.files[0]) {
    throw new Error(`File API failed (${res.status}): ${body.error || "unexpected response"}`);
  }
  return body.data.files[0]; // { file_id, requests: [{ method, url, headers }] }
}

async function uploadToPresigned(fileMeta, file) {
  const req = fileMeta.requests[0];
  const res = await fetch(req.url, {
    method: req.method || "PUT",
    headers: req.headers || { "Content-Type": file.type || "image/jpeg" },
    body: file
  });
  if (!res.ok) throw new Error(`Image upload to pre-signed URL failed (${res.status})`);
}

async function createSkinAnalysisTask(fileId) {
  const res = await fetch(`${YOUCAM_API_BASE}/s2s/v2.0/task/skin-analysis`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({
      src_file_id: fileId,
      dst_actions: SKIN_CONCERNS_SD,
      miniserver_args: { enable_mask_overlay: true },
      format: "json"
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.data || !body.data.task_id) {
    throw new Error(`Task creation failed (${res.status}): ${body.error || "unexpected response"}`);
  }
  return body.data.task_id;
}

async function pollSkinAnalysisTask(taskId, onTick) {
  const started = Date.now();
  while (Date.now() - started < POLL_TIMEOUT_MS) {
    const res = await fetch(`${YOUCAM_API_BASE}/s2s/v2.0/task/skin-analysis/${encodeURIComponent(taskId)}`, {
      method: "GET",
      headers: apiHeaders()
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Task polling failed (${res.status}): ${body.error || "unexpected response"}`);
    const status = body.data && body.data.task_status;
    if (status === "success") {
      const output = (body.data.results && body.data.results.output) || [];
      return output.map(normalizeApiEntry).filter(r => CONCERN_INFO[r.concern]);
    }
    if (status === "error") throw new Error("The analysis engine reported an error for this photo (no units are consumed on failure, per the docs). Try a clearer, front-facing photo.");
    if (onTick) onTick();
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error("Analysis timed out — the task may still finish within its 24-hour result window; please try again.");
}

/* Full live path: File -> PUT -> Task -> Poll -> normalised results. */
async function analyseWithYouCam(file, onTick) {
  const meta = await initFileUpload(file);
  await uploadToPresigned(meta, file);
  const taskId = await createSkinAnalysisTask(meta.file_id);
  return pollSkinAnalysisTask(taskId, onTick);
}

/* ================= UI wiring (browser only) ================= */
if (typeof document !== "undefined") {
  const $ = id => document.getElementById(id);
  const state = { mode: null, sampleId: null, file: null, objectUrl: null };

  const fileInput = $("fileInput"), analyseBtn = $("analyseBtn"), statusLine = $("statusLine");

  function setStatus(msg, isError) {
    statusLine.textContent = msg;
    statusLine.className = "status" + (isError ? " error" : "");
  }
  function refreshButton() { analyseBtn.disabled = !(state.file || state.sampleId); }

  fileInput.addEventListener("change", () => {
    const f = fileInput.files[0];
    if (!f) return;
    state.file = f; state.sampleId = null;
    document.querySelectorAll("#samples figure").forEach(el => el.classList.remove("selected"));
    if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
    state.objectUrl = URL.createObjectURL(f);
    $("uploadPreview").innerHTML = "";
    const img = document.createElement("img");
    img.src = state.objectUrl; img.alt = "Your uploaded selfie";
    $("uploadPreview").appendChild(img);
    setStatus(YOUCAM_API_KEY
      ? "Photo ready — live YouCam Skin AI analysis is configured."
      : "Photo ready. Heads-up: live analysis is not switched on yet (API key pending), so the demo will run with sample data and say so clearly.");
    refreshButton();
  });

  document.querySelectorAll("#samples figure").forEach(fig => {
    fig.addEventListener("click", () => {
      document.querySelectorAll("#samples figure").forEach(el => el.classList.remove("selected"));
      fig.classList.add("selected");
      state.sampleId = fig.dataset.sample; state.file = null; fileInput.value = "";
      $("uploadPreview").innerHTML = "";
      setStatus("Sample face selected — the demo analysis for this face is bundled sample data, labelled as such in the results.");
      refreshButton();
    });
  });

  function renderResults(results, photoSrc, isSample) {
    const badge = $("modeBadge");
    badge.innerHTML = isSample
      ? ' <span class="badge sample">Sample analysis — demo data</span>'
      : ' <span class="badge live">Live YouCam Skin AI result</span>';
    $("resultPhoto").src = photoSrc;

    const avg = Math.round(results.reduce((s, r) => s + r.uiScore, 0) / results.length);
    $("overallScore").textContent = avg;

    const list = $("concernList");
    list.innerHTML = "";
    const flaggedSet = new Set(flaggedConcerns(results).map(f => f.concern));
    [...results].sort((a, b) => a.uiScore - b.uiScore).forEach(r => {
      const info = CONCERN_INFO[r.concern];
      const div = document.createElement("div");
      div.className = "concern" + (flaggedSet.has(r.concern) ? " flagged" : "");
      div.innerHTML = `<div class="row"><span class="name">${info.name}${flaggedSet.has(r.concern) ? '<span class="flagtag">FLAGGED</span>' : ""}</span>` +
        `<span class="score">${r.uiScore}/100 — ${info.note}</span></div>` +
        `<div class="bar"><i style="width:${r.uiScore}%"></i></div>`;
      list.appendChild(div);
    });

    const masks = results.filter(r => r.maskUrl);
    const maskRow = $("maskRow");
    maskRow.innerHTML = "";
    if (masks.length) {
      const cap = document.createElement("p");
      cap.className = "sub"; cap.textContent = "Detection overlays returned by the API:";
      maskRow.appendChild(cap);
      masks.forEach(r => {
        const fig = document.createElement("figure");
        fig.innerHTML = `<img src="${r.maskUrl}" alt="${CONCERN_INFO[r.concern].name} detection overlay"><figcaption>${CONCERN_INFO[r.concern].name}</figcaption>`;
        maskRow.appendChild(fig);
      });
    }
    $("step2").classList.remove("hidden");

    const { items, total } = buildBasket(results);
    const bl = $("basketList");
    bl.innerHTML = "";
    if (!items.length) {
      bl.innerHTML = "<p>No concerns were flagged — your skin is in great shape. The SPF below is still worth it daily.</p>";
    }
    items.forEach(({ product, forConcerns }) => {
      const div = document.createElement("div");
      div.className = "basket-item";
      const forText = product.always
        ? "For: every skin, every day"
        : "For: " + forConcerns.map(c => CONCERN_INFO[c].name.toLowerCase()).join(" · ");
      div.innerHTML = `<div class="emoji">${product.emoji}</div><div><h3>${product.name}</h3>` +
        `<div class="cat">${product.category}</div><p class="why">${product.why}</p>` +
        `<p class="for">${forText}</p></div><div class="price">$${product.price}</div>`;
      bl.appendChild(div);
    });
    $("basketTotal").textContent = "$" + total;
    $("step3").classList.remove("hidden");
    $("step2").scrollIntoView({ behavior: "smooth" });
  }

  analyseBtn.addEventListener("click", async () => {
    analyseBtn.disabled = true;
    try {
      /* Sample photo picked -> bundled sample analysis. */
      if (state.sampleId) {
        setStatus("Loading the bundled sample analysis…");
        const sample = SAMPLE_ANALYSES[state.sampleId];
        renderResults(scoresToResults(sample.scores), `samples/sample-${state.sampleId}.jpg`, true);
        setStatus("Done — sample analysis shown with its demo-data badge.");
        return;
      }
      /* Own photo + key configured -> the real YouCam path. */
      if (state.file && YOUCAM_API_KEY) {
        setStatus("Uploading your photo to the YouCam API…");
        const results = await analyseWithYouCam(state.file, () =>
          setStatus("YouCam Skin AI is analysing… (units are only consumed on success)"));
        renderResults(results, state.objectUrl, false);
        setStatus("Done — this is a live YouCam Skin AI result.");
        return;
      }
      /* Own photo but no key yet -> honest demo fallback, clearly badged. */
      if (state.file) {
        renderResults(scoresToResults(SAMPLE_ANALYSES["1"].scores), state.objectUrl, true);
        setStatus("Demo mode: live analysis activates when the API key is set — this basket was built from bundled sample data, not from your photo.", false);
        return;
      }
    } catch (err) {
      setStatus("Something went wrong: " + err.message + " You can still try a sample face to see the full flow.", true);
    } finally {
      refreshButton();
    }
  });

  $("checkoutBtn").addEventListener("click", () => {
    $("checkoutNote").textContent = "Demo catalog for the hackathon — in a seller's real shop, this button hands the basket to their checkout (e.g. Shopify). No payment is taken here.";
  });

  setStatus(YOUCAM_API_KEY
    ? "Live mode: a YouCam API key is configured — uploads run the real Skin AI analysis. Sample faces always use bundled demo data."
    : "Demo mode: no API key is configured yet (Start Kit units pending) — sample faces use bundled demo data, clearly badged.");
}
