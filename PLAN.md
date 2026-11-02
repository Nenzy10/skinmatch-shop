# YouCam API Skin AI & eCommerce VTO Hackathon — entry plan
Prepared 2026-10-29 (Asia/Dubai) from the Oct 29 deep sweep (verified at source) and a same-day re-check of the organizer's release + Devpost page.

## Verified facts
- Event: YouCam API Skin AI & eCommerce VTO Hackathon (Perfect Corp.), online on Devpost.
  Registration: https://youcam-api-skin-ai-ecommerce.devpost.com/
- Deadline: **Monday Nov 2, 2026, 11:45 a.m. ET = 20:45 Dubai.**
- Prizes: $6,000 pool — 1st $2,500 · 2nd $1,000 · 3rd $500 (cash).
  NOT eligible, do not aim at them: Women in Tech $1,000 (needs a woman team member)
  and Rising Star $1,000 (enrolled students only). Addressable pool for this solo entry: $4,000.
- Entry cost $0: free registration; every registered participant receives 1,000 free
  YouCam API units via an emailed redeem code.
- Submission requirements (Devpost page): public/shared code repo, text description
  explaining features + clear consumer/retail value, screenshots, and a 1–3 minute
  demo video publicly visible on YouTube (preferred) / Vimeo / Youku showing the
  project functioning end-to-end and explaining the YouCam API used.
- Judging: Technological Implementation (real YouCam API integration, non-trivial),
  Design (complete product experience, not a proof of concept), Potential Impact,
  Quality of Idea.
- Winners announced on or around Nov 24, 2026 — November payout, not this-week cash.
- Competition scale: ~1,421 participants registered at the Oct 29 check; round one
  drew 238 projects. A top-3 finish is a long shot; the entry is still fully
  operation-controlled (no counterparty gate before submission).

## Concept — "SkinMatch Shop"
A one-screen skin-AI shopping assistant for small beauty e-commerce sellers:
1. Shopper uploads a selfie (or uses a bundled sample photo for the demo).
2. YouCam Skin AI API returns a skin analysis (concerns, scores).
3. The app maps each flagged concern to products in a small demo catalog
   (serum / moisturiser / SPF etc.) with a plain-language "why this matches".
4. Where the API supports it, a virtual try-on / shade preview step closes the loop.
Why this fits the judging rubric: real API depth (implementation), a complete
shopper journey rather than a tech demo (design), a named audience — indie beauty
sellers who can't afford Perfect Corp's enterprise tooling (impact), and the
analysis→basket mapping is the non-obvious idea (quality). It also reuses the
operation's existing assets: Netlify deploy route, the in-house video pipeline
that already ships YouTube videos daily, and the beauty-retail context from the
WordBond pilot outreach (Mirae Beauty Hub) — as background only; the entry
claims no partnership and no traction.

## Schedule (buffer-first; Nov 2 is already crowded: YC + AI Genesis deadlines, NLnet Nov 3, Saifuro call Nov 3)
- Oct 30: Register on Devpost with the existing Nenzy10 account; read the official
  Rules tab (standard Devpost exclusions check) BEFORE building; claim the 1,000
  API units from the emailed redeem code; scaffold the app.
- Oct 30–31: Build + deploy to Netlify; test with sample photos inside the free
  unit budget; push public repo.
- Nov 1: Record the 1–3 min demo with the existing video pipeline; write the
  Devpost description + screenshots; SUBMIT on Nov 1 — a full day ahead of the
  deadline.
- Nov 2 20:45 Dubai: hard deadline (fallback only, not the plan).

## Owner steps
None expected for registration/build/submission. Winner-only steps exist
(exit interview + blog feature) and would be the founder's, only on a win.

## Risks / unknowns
- Rules-tab eligibility exclusions not yet read — 2-minute check at registration,
  before any build time is spent (gate discipline).
- API unit budget: 1,000 free units must cover dev + demo; design the demo path
  to cache analysis results for sample photos so judging traffic doesn't burn units.
- Prize realism: treat as upside, never as expected income.
