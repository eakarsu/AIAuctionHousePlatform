# Audit Apply Note — AIAuctionHousePlatform

## Audit recommendations (from batch_00.md)

Substantive: 22 routes, 15 AI endpoints. Production-grade auction platform.

### Missing AI counterparts
- AI price optimization (dynamic reserve pricing)
- AI fraud detection (fake bidders, shill bidding)

### Missing non-AI features
- Live auction streaming
- Major auction platform integration (eBay, Sotheby's)
- Insurance policy management

### Custom feature suggestions
- Real-time auction streaming + bid increments
- Predictive final price
- Provenance research automation
- Shill bidding detection
- Invaluable / Artnet / eBay Live integrations

## Implemented in this pass

None. Substantive (15 AI endpoints, 22 routes); remaining items are real-time streaming/large new subsystems or external integrations.

## Backlog (not implemented)

| Item | Category | Reason |
|---|---|---|
| AI dynamic reserve pricing | NEEDS-PRODUCT-DECISION | Pricing policy |
| AI shill bidding detection | TOO-RISKY | Bid-graph analytics |
| Live auction streaming | TOO-RISKY | Streaming infrastructure |
| eBay / Sotheby's integration | NEEDS-CREDS | External APIs |
| Provenance research automation | NEEDS-CREDS | Museum / sales-history APIs |
| Insurance policy management | NEEDS-CREDS | Carrier integration |
| Predictive final price | NEEDS-PRODUCT-DECISION | Model design |

## Apply pass 3 (frontend)

- **Action:** LEFT-AS-IS — FE already wired.
- **Stack:** Express backend + Create-React-App frontend.
- **Coverage:** All 14 AI POST endpoints exposed by `backend/routes/ai.js` already have dedicated pages under `frontend/src/pages/ai/*Page.js`, registered in `frontend/src/App.js` (LotDescription, Valuation, Authenticity, Marketing, BuyerMatching, MarketTrends, SimilarityMatcher, BiddingAnalytics, ProvenanceVerification, MultiLanguageCatalog, ConditionReport, BuyerPreference, InsuranceValuation, PhotoEnhancement). Auth via `localStorage.getItem('token')`.
- **Files modified:** none.

## Apply pass 4 (mechanical backlog)

- **Action:** LEFT-AS-IS — no mechanical items remain.
- **Reason:** Every backlog item is tagged NEEDS-PRODUCT-DECISION, NEEDS-CREDS, or TOO-RISKY (dynamic reserve pricing, shill detection, live streaming, eBay/Sotheby's/Invaluable/Artnet integrations, provenance research, insurance integration, predictive final price).
- **Files modified:** none.

## Apply pass 5 (all backlog)

- **Action:** IMPLEMENTED — 5 backlog items (additive only).
- **Backend:** `backend/routes/ai.js` — added `POST /api/ai/dynamic-reserve-pricing`, `POST /api/ai/predict-final-price`, `POST /api/ai/shill-bidding-detection`, `POST /api/ai/external-auction-search`, `POST /api/ai/insurance-policy-recommendation`. New helpers `callAIOr503` and `send503OrError` translate missing key (or upstream 401) into HTTP 503 with `missing: OPENROUTER_API_KEY`. Existing endpoints untouched.
- **Product decisions documented inline:**
  - Dynamic reserve floor = `max(70% of estimate_low, consignor_min)`; only `confidence === "high"` is auto-applied; otherwise queued for human review.
  - Predicted final price uses 25%/20% buyer's premium tiers and a 60/25/15 base/up/down scenario weighting.
  - Shill detection computes deterministic heuristic indicators (consecutive follow-ups) and feeds them to the AI for a write-up; no auto-flagging — `requires_human_review` is always true.
  - External auction search & insurance integration: any of `EBAY_API_KEY|SOTHEBYS_API_KEY|INVALUABLE_API_KEY|ARTNET_API_KEY` (search) or `INSURANCE_API_KEY` (insurance) gates the endpoint; absent → 503 with `missing: <ENV>`.
- **FE:** added 5 React pages under `frontend/src/pages/ai/` (DynamicReservePricing, PredictFinalPrice, ShillBiddingDetection, ExternalAuctionSearch, InsurancePolicyRecommendation) and wired them in `frontend/src/App.js`. All pages handle 503 with an explicit "AI service unavailable" message.
- **Smoke test:** PASS — backend started on :4000, login as `admin@auction.com` succeeded, all 5 endpoints returned HTTP 503 with the expected `missing` field (placeholder OPENROUTER_API_KEY in `.env`). Backend cleaned up.
- **Backlog still deferred:** live auction streaming (TOO-RISKY — streaming infrastructure), provenance research (NEEDS-CREDS — museum/sales-history APIs require dedicated SDKs).
