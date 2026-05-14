const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { callAI, persistAIResult } = require('../ai');
const { JWT_SECRET } = require('../middleware/auth');

// Soft-auth: attach user when token is valid but never block (used for ai_results.user_id).
const optionalAuth = (req, _res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return next();
  const token = auth.split(' ')[1];
  if (!token) return next();
  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {
    req.user = null;
  }
  next();
};

router.use(optionalAuth);

const userId = (req) => (req.user ? (req.user.id || req.user.userId || null) : null);

// POST /lot-description
router.post('/lot-description', async (req, res) => {
  try {
    const { title, category, medium, dimensions, condition, notes } = req.body;

    const systemPrompt = `You are an expert auction house cataloguer with decades of experience at major international auction houses like Christie's, Sotheby's, and Phillips. You write professional lot descriptions for fine art, antiques, jewelry, and collectibles.

Your descriptions should be authoritative, detailed, and compelling. Use proper art historical terminology. Include provenance narratives where appropriate. Follow standard auction catalog conventions.

Respond in JSON format with these fields:
- "lot_title": refined professional lot title
- "description": full catalog description (2-3 paragraphs)
- "provenance_summary": suggested provenance narrative
- "condition_summary": professional condition statement
- "catalog_notes": additional specialist notes for the catalog
- "keywords": array of relevant search/category keywords`;

    const userPrompt = `Generate a professional auction lot description for the following item:

Title: ${title}
Category: ${category}
Medium: ${medium || 'Not specified'}
Dimensions: ${dimensions || 'Not specified'}
Condition: ${condition || 'Not specified'}
Additional Notes: ${notes || 'None'}`;

    const result = await callAI(systemPrompt, userPrompt);
    const saved = await persistAIResult({
      feature: 'lot-description',
      user_id: userId(req),
      entity_type: 'item',
      entity_id: req.body.item_id || null,
      prompt_summary: `${title} (${category})`,
      result,
    });
    res.json({ success: true, result, saved_id: saved && saved.id });
  } catch (err) {
    console.error('AI lot description error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /valuation
router.post('/valuation', async (req, res) => {
  try {
    const { title, category, description, condition, medium, dimensions } = req.body;

    const systemPrompt = `You are a senior appraiser and valuation specialist at a major international auction house. You have extensive knowledge of art market trends, recent auction results, and fair market values across all collecting categories.

Based on the item description provided, give a thorough valuation assessment. Consider comparable sales, market conditions, rarity, condition, and provenance.

Respond in JSON format with these fields:
- "estimate_low": low estimate in USD (number)
- "estimate_high": high estimate in USD (number)
- "fair_market_value": estimated fair market value in USD (number)
- "confidence": confidence level ("high", "medium", "low")
- "comparable_sales": array of 3-5 comparable auction results with title, sale price, auction house, and date
- "market_analysis": paragraph analyzing current market conditions for this category
- "factors_increasing_value": array of positive value factors
- "factors_decreasing_value": array of risk factors or value detractors
- "recommended_reserve": suggested reserve price in USD (number)`;

    const userPrompt = `Please provide a valuation assessment for:

Title: ${title}
Category: ${category}
Description: ${description || 'Not provided'}
Condition: ${condition || 'Not specified'}
Medium: ${medium || 'Not specified'}
Dimensions: ${dimensions || 'Not specified'}`;

    const result = await callAI(systemPrompt, userPrompt);
    const saved = await persistAIResult({
      feature: 'valuation',
      user_id: userId(req),
      entity_type: 'item',
      entity_id: req.body.item_id || null,
      prompt_summary: `${title} (${category})`,
      result,
    });
    res.json({ success: true, result, saved_id: saved && saved.id });
  } catch (err) {
    console.error('AI valuation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /authenticity
router.post('/authenticity', async (req, res) => {
  try {
    const { title, category, description, provenance, medium } = req.body;

    const systemPrompt = `You are a leading authenticity and provenance research specialist working for a prestigious auction house. You have expertise in art authentication, forgery detection, provenance research, and due diligence procedures.

Provide comprehensive authenticity verification guidance for the described item. Include recommended tests, experts to consult, databases to check, and red flags to watch for.

Respond in JSON format with these fields:
- "authenticity_assessment": initial assessment based on available information
- "confidence_level": ("high", "medium", "low", "insufficient_data")
- "recommended_tests": array of physical/scientific tests to perform
- "experts_to_consult": array of recommended specialists or authentication bodies
- "databases_to_check": array of provenance and stolen art databases to verify
- "provenance_gaps": any identified gaps or concerns in the provenance chain
- "red_flags": array of any concerning indicators
- "documentation_needed": array of documents to obtain or verify
- "estimated_authentication_cost": rough cost range for full authentication
- "timeline": estimated time for complete authentication process`;

    const userPrompt = `Please provide authenticity verification guidance for:

Title: ${title}
Category: ${category}
Description: ${description || 'Not provided'}
Provenance: ${provenance || 'Not provided'}
Medium: ${medium || 'Not specified'}`;

    const result = await callAI(systemPrompt, userPrompt);
    const saved = await persistAIResult({
      feature: 'authenticity',
      user_id: userId(req),
      entity_type: 'item',
      entity_id: req.body.item_id || null,
      prompt_summary: `${title} (${category})`,
      result,
    });
    res.json({ success: true, result, saved_id: saved && saved.id });
  } catch (err) {
    console.error('AI authenticity error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /marketing
router.post('/marketing', async (req, res) => {
  try {
    const { title, category, description, estimate_low, estimate_high } = req.body;

    const systemPrompt = `You are a luxury marketing specialist for a world-renowned auction house. You create compelling marketing content that drives bidder interest and attendance for high-profile auctions.

Generate marketing catalog content that is sophisticated, enticing, and appropriate for high-net-worth collectors. The tone should be authoritative yet accessible.

Respond in JSON format with these fields:
- "headline": attention-grabbing marketing headline (max 100 chars)
- "tagline": short marketing tagline (max 50 chars)
- "catalog_essay": 2-3 paragraph essay for the printed catalog
- "press_release_excerpt": paragraph suitable for press release
- "social_media": object with "instagram" (with hashtags), "twitter" (under 280 chars), and "linkedin" posts
- "email_subject_line": compelling email subject line
- "email_preview_text": email preview/preheader text
- "target_audience": array of collector demographics to target
- "selling_points": array of key selling points to emphasize`;

    const userPrompt = `Create marketing content for the following auction lot:

Title: ${title}
Category: ${category}
Description: ${description || 'Not provided'}
Estimate: $${estimate_low ? estimate_low.toLocaleString() : 'TBD'} - $${estimate_high ? estimate_high.toLocaleString() : 'TBD'}`;

    const result = await callAI(systemPrompt, userPrompt);
    const saved = await persistAIResult({
      feature: 'marketing',
      user_id: userId(req),
      entity_type: 'item',
      entity_id: req.body.item_id || null,
      prompt_summary: `${title} (${category})`,
      result,
    });
    res.json({ success: true, result, saved_id: saved && saved.id });
  } catch (err) {
    console.error('AI marketing error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /buyer-matching
router.post('/buyer-matching', async (req, res) => {
  try {
    const { title, category, estimate_low, estimate_high, bidders } = req.body;

    const systemPrompt = `You are a client relations specialist at a major auction house. Your job is to match auction lots with the most likely buyers from the registered bidder database. You analyze bidder preferences, purchasing history, budgets, and collecting patterns to identify the best matches.

Analyze the provided item and bidder list, then rank the most likely buyers.

Respond in JSON format with these fields:
- "top_matches": array of matched bidders, each with:
  - "bidder_name": name
  - "match_score": 1-100 score
  - "reasoning": why this bidder is a good match
  - "approach_strategy": recommended outreach approach
  - "estimated_bid_range": predicted bidding range
- "marketing_recommendations": suggestions for reaching these buyers
- "additional_outreach": suggestions for finding buyers outside the current database
- "lot_positioning": how to position this lot to attract maximum interest`;

    const bidderSummary = (bidders || []).map(b =>
      `${b.name} - Categories: ${b.preferred_categories || 'General'}, Limit: $${b.bidding_limit || 'Unknown'}, Past Purchases: $${b.total_purchases || 0}`
    ).join('\n');

    const userPrompt = `Match this lot to the best potential buyers:

Lot: ${title}
Category: ${category}
Estimate: $${estimate_low || 'TBD'} - $${estimate_high || 'TBD'}

Registered Bidders:
${bidderSummary || 'No bidder data provided'}`;

    const result = await callAI(systemPrompt, userPrompt);
    const saved = await persistAIResult({
      feature: 'buyer-matching',
      user_id: userId(req),
      entity_type: 'item',
      entity_id: req.body.item_id || null,
      prompt_summary: `${title} (${category})`,
      result,
    });
    res.json({ success: true, result, saved_id: saved && saved.id });
  } catch (err) {
    console.error('AI buyer matching error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /similarity-matcher
// Suggest reserve prices based on similar past auction outcomes.
router.post('/similarity-matcher', async (req, res) => {
  try {
    const { title, category, description, medium, dimensions, past_lots } = req.body;

    const systemPrompt = `You are an auction analytics specialist. You compare incoming items against historical lots to recommend reserve and estimate ranges based on similar past sales.

Respond in JSON format with these fields:
- "similar_lots": array of {lot_title, similarity_score (0-100), hammer_price, reasoning}
- "recommended_reserve": number (USD)
- "recommended_estimate_low": number
- "recommended_estimate_high": number
- "confidence": "high"|"medium"|"low"
- "rationale": short paragraph explaining the recommendation
- "risk_notes": array of strings about market risk or condition adjustments`;

    const lots = (past_lots || []).map(l =>
      `${l.title || 'Untitled'} (${l.category || category}) - hammer $${l.hammer_price || 'n/a'}, est $${l.estimate_low || '?'}-$${l.estimate_high || '?'}`
    ).join('\n');

    const userPrompt = `Find similar past lots and recommend reserve / estimate.
Title: ${title}
Category: ${category}
Description: ${description || 'N/A'}
Medium: ${medium || 'N/A'}
Dimensions: ${dimensions || 'N/A'}

Past lots from database:
${lots || 'No past lots provided. Use general market knowledge.'}`;

    const result = await callAI(systemPrompt, userPrompt);
    const saved = await persistAIResult({
      feature: 'similarity-matcher',
      user_id: userId(req),
      entity_type: 'item',
      entity_id: req.body.item_id || null,
      prompt_summary: `${title} (${category})`,
      result,
    });
    res.json({ success: true, result, saved_id: saved && saved.id });
  } catch (err) {
    console.error('AI similarity matcher error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /bidding-analytics
// Real-time bidding analytics: bid velocity, predicted hammer, buyer concentration.
router.post('/bidding-analytics', async (req, res) => {
  try {
    const { lot_title, category, current_high_bid, estimate_low, estimate_high, bids } = req.body;

    const systemPrompt = `You are a live auction analytics engine. Given the current bidding pattern, you compute bid velocity, project the likely hammer price, and report buyer concentration.

Respond in JSON format with these fields:
- "bid_velocity": "rising"|"steady"|"slowing"|"stalled"
- "bids_per_minute": number
- "predicted_hammer": number (USD)
- "predicted_hammer_range": { "low": number, "high": number }
- "active_bidders": number
- "top_bidder_share": number (percent of bids by top bidder, 0-100)
- "buyer_concentration": "concentrated"|"competitive"|"sparse"
- "auctioneer_advice": string (what to do next)
- "expected_close_seconds": number (estimated time until hammer falls)`;

    const bidLines = (bids || []).map(b =>
      `t=${b.timestamp || '?'} bidder=${b.bidder_id || b.bidder_name || 'anon'} amount=$${b.amount}`
    ).join('\n');

    const userPrompt = `Analyse this live auction lot.
Lot: ${lot_title}
Category: ${category}
Current high bid: $${current_high_bid || 0}
Estimate range: $${estimate_low || '?'} - $${estimate_high || '?'}

Bid log (oldest to newest):
${bidLines || 'No bids logged yet.'}`;

    const result = await callAI(systemPrompt, userPrompt);
    const saved = await persistAIResult({
      feature: 'bidding-analytics',
      user_id: userId(req),
      entity_type: 'lot',
      entity_id: req.body.lot_id || null,
      prompt_summary: `${req.body.lot_title || 'lot'} (${req.body.category || ''})`,
      result,
    });
    res.json({ success: true, result, saved_id: saved && saved.id });
  } catch (err) {
    console.error('AI bidding analytics error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /provenance-verification
// Cross-reference claimed provenance against public records (simulated via LLM knowledge).
router.post('/provenance-verification', async (req, res) => {
  try {
    const { title, artist, category, claimed_provenance, exhibition_history, publications } = req.body;

    const systemPrompt = `You are a provenance verification specialist. You cross-reference claimed provenance against publicly known auction records, museum catalogs, catalogue raisonnés, and the Art Loss Register.

Respond in JSON format with these fields:
- "verification_status": "verified"|"partially_verified"|"unverified"|"red_flag"
- "matched_records": array of {source, record_title, year, confidence}
- "gaps": array of strings describing missing periods or documentation
- "red_flags": array of strings (e.g. WWII gap, no catalogue raisonne entry, suspicious provenance jump)
- "stolen_art_database_check": "clear"|"flagged"|"insufficient_data"
- "recommended_next_steps": array of strings
- "overall_confidence": 0-100 number`;

    const userPrompt = `Verify provenance for:
Title: ${title}
Artist / Maker: ${artist || 'Unknown'}
Category: ${category}

Claimed provenance:
${claimed_provenance || 'Not provided'}

Exhibition history:
${exhibition_history || 'Not provided'}

Publications:
${publications || 'Not provided'}`;

    const result = await callAI(systemPrompt, userPrompt);
    const saved = await persistAIResult({
      feature: 'provenance-verification',
      user_id: userId(req),
      entity_type: 'item',
      entity_id: req.body.item_id || null,
      prompt_summary: `${req.body.title || 'untitled'} (${req.body.category || ''})`,
      result,
    });
    res.json({ success: true, result, saved_id: saved && saved.id });
  } catch (err) {
    console.error('AI provenance verification error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /multi-language-catalog
// Translate lot description to multiple languages with cultural adaptation.
router.post('/multi-language-catalog', async (req, res) => {
  try {
    const { english_description, lot_title, target_languages } = req.body;
    const langs = target_languages && target_languages.length
      ? target_languages
      : ['French', 'German', 'Mandarin Chinese', 'Japanese'];

    const systemPrompt = `You are a multilingual auction house cataloguer. You translate English lot descriptions into target languages while preserving auction-house tone, art-historical terminology, and cultural conventions.

Respond in JSON format. The top-level keys must be the target language names. Each value must be an object:
{ "lot_title": string, "description": string, "key_terms_glossary": [{"english": string, "translation": string}] }
Provide one such object per requested language.`;

    const userPrompt = `Translate the following lot for international catalogues.
Languages requested: ${langs.join(', ')}

Lot Title (English): ${lot_title || 'Untitled'}
Description (English):
${english_description || 'No description provided'}`;

    const result = await callAI(systemPrompt, userPrompt);
    const saved = await persistAIResult({
      feature: 'multi-language-catalog',
      user_id: userId(req),
      entity_type: 'item',
      entity_id: req.body.item_id || null,
      prompt_summary: `${req.body.lot_title || 'untitled'} -> ${(req.body.target_languages || []).join(',') || 'default langs'}`,
      result,
    });
    res.json({ success: true, result, saved_id: saved && saved.id });
  } catch (err) {
    console.error('AI multi-language catalog error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /condition-report-pdf-data
// Generate structured data for a printable condition report PDF.
router.post('/condition-report-pdf-data', async (req, res) => {
  try {
    const { title, category, medium, dimensions, observed_condition, photo_notes } = req.body;

    const systemPrompt = `You are a senior conditions specialist preparing a formal condition report for an auction-house catalogue. Output structured data suitable for rendering as a PDF.

Respond in JSON format with these fields:
- "report_title": string
- "summary": short paragraph
- "overall_grade": "Excellent"|"Very Good"|"Good"|"Fair"|"Poor"
- "section_observations": array of {area, observation, severity ("none"|"minor"|"moderate"|"significant")}
- "restoration_history": array of strings
- "recommended_treatments": array of strings
- "stability_assessment": string
- "photographic_evidence_notes": array of strings (cross references to photo positions)
- "specialist_signature_block": { "name": string, "title": string, "date": string }`;

    const userPrompt = `Produce condition report data.
Title: ${title}
Category: ${category}
Medium: ${medium || 'N/A'}
Dimensions: ${dimensions || 'N/A'}

Observed condition notes:
${observed_condition || 'Not provided'}

Photographic notes:
${photo_notes || 'Not provided'}`;

    const result = await callAI(systemPrompt, userPrompt);
    const saved = await persistAIResult({
      feature: 'condition-report-pdf-data',
      user_id: userId(req),
      entity_type: 'item',
      entity_id: req.body.item_id || null,
      prompt_summary: `${req.body.title || 'untitled'} (${req.body.category || ''})`,
      result,
    });
    res.json({ success: true, result, saved_id: saved && saved.id });
  } catch (err) {
    console.error('AI condition report data error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /buyer-preference-predictor
// Predict bidder preferences across categories from purchase history.
router.post('/buyer-preference-predictor', async (req, res) => {
  try {
    const { bidder_name, purchase_history, categories_of_interest } = req.body;

    const systemPrompt = `You are a CRM analyst for an auction house. Given a bidder's purchase history, you predict which upcoming categories, price tiers, and styles they will respond to. Use only the data provided plus general collector behaviour.

Respond in JSON format with these fields:
- "predicted_categories": array of {category, score (0-100), reasoning}
- "predicted_price_tier": { "min": number, "max": number, "sweet_spot": number }
- "stylistic_preferences": array of strings
- "engagement_channels": array of strings (e.g. private sale, online, in-person preview)
- "next_likely_purchases": array of strings (lot description ideas to pitch)
- "marketing_message_hint": short string suggesting tone for outreach`;

    const history = (purchase_history || []).map(p =>
      `${p.title || 'lot'} (${p.category || '?'}) - $${p.price || 0} on ${p.date || '?'}`
    ).join('\n');

    const userPrompt = `Predict preferences for bidder.
Bidder: ${bidder_name || 'Anonymous'}
Self-declared categories of interest: ${(categories_of_interest || []).join(', ') || 'None'}

Purchase history:
${history || 'No history provided.'}`;

    const result = await callAI(systemPrompt, userPrompt);
    const saved = await persistAIResult({
      feature: 'buyer-preference-predictor',
      user_id: userId(req),
      entity_type: 'bidder',
      entity_id: req.body.bidder_id || null,
      prompt_summary: `bidder=${req.body.bidder_name || 'anon'}`,
      result,
    });
    res.json({ success: true, result, saved_id: saved && saved.id });
  } catch (err) {
    console.error('AI buyer preference predictor error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /insurance-valuation
// Insurable replacement value (separate from auction reserve).
router.post('/insurance-valuation', async (req, res) => {
  try {
    const { title, category, description, condition, auction_estimate_high, owner_use } = req.body;

    const systemPrompt = `You are a fine-art and collectibles insurance valuer. You compute INSURABLE REPLACEMENT VALUE (typically retail replacement, distinct from auction reserve / fair market value).

Respond in JSON format with these fields:
- "insurable_replacement_value": number (USD)
- "scheduled_value_recommendation": number
- "value_basis": "retail_replacement"|"agreed_value"|"market_value"
- "rationale": short paragraph
- "annual_premium_estimate": number (USD, ballpark using 0.3-1.0% of value)
- "appraisal_validity_months": number
- "conditions_for_coverage": array of strings (storage, transport, display)
- "supporting_documentation": array of strings`;

    const userPrompt = `Provide insurance valuation.
Title: ${title}
Category: ${category}
Description: ${description || 'N/A'}
Condition: ${condition || 'N/A'}
Auction estimate (high): $${auction_estimate_high || 'N/A'}
Owner use: ${owner_use || 'private collection display'}`;

    const result = await callAI(systemPrompt, userPrompt);
    const saved = await persistAIResult({
      feature: 'insurance-valuation',
      user_id: userId(req),
      entity_type: 'item',
      entity_id: req.body.item_id || null,
      prompt_summary: `${req.body.title || 'untitled'} (${req.body.category || ''})`,
      result,
    });
    res.json({ success: true, result, saved_id: saved && saved.id });
  } catch (err) {
    console.error('AI insurance valuation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /photo-enhancement-plan
// Suggest photo enhancement plan for a lot's catalog photos.
router.post('/photo-enhancement-plan', async (req, res) => {
  try {
    const { title, category, current_photo_notes, num_photos } = req.body;

    const systemPrompt = `You are an auction-house photography director. Given existing photo notes for a lot, you produce a step-by-step enhancement plan: cropping, color correction, damage documentation, lighting, and final catalog spec.

Respond in JSON format with these fields:
- "primary_shot_plan": { "framing": string, "lighting": string, "background": string, "post_processing": [string] }
- "detail_shots_needed": array of {area, purpose}
- "damage_documentation_shots": array of {area, technique}
- "color_correction_steps": array of strings
- "final_export_specs": { "resolution_dpi": number, "file_format": string, "color_profile": string }
- "estimated_time_minutes": number
- "tools_required": array of strings`;

    const userPrompt = `Plan photography enhancement.
Title: ${title}
Category: ${category}
Current photos: ${num_photos || 0}
Notes: ${current_photo_notes || 'None'}`;

    const result = await callAI(systemPrompt, userPrompt);
    const saved = await persistAIResult({
      feature: 'photo-enhancement-plan',
      user_id: userId(req),
      entity_type: 'item',
      entity_id: req.body.item_id || null,
      prompt_summary: `${req.body.title || 'untitled'} (${req.body.category || ''})`,
      result,
    });
    res.json({ success: true, result, saved_id: saved && saved.id });
  } catch (err) {
    console.error('AI photo enhancement plan error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /market-trends
router.post('/market-trends', async (req, res) => {
  try {
    const { category, recent_sales } = req.body;

    const systemPrompt = `You are a senior market analyst at a leading auction house. You specialize in art market economics, price trend analysis, and collecting pattern forecasting. You provide data-driven insights for auction strategy and consignment decisions.

Analyze the provided sales data and market category to deliver a comprehensive market trends report.

Respond in JSON format with these fields:
- "market_summary": 2-3 paragraph overview of current market conditions for this category
- "price_trend": ("rising", "stable", "declining", "volatile")
- "trend_confidence": ("high", "medium", "low")
- "year_over_year_change": estimated percentage change
- "key_drivers": array of factors driving the market
- "risks": array of market risks and headwinds
- "opportunities": array of market opportunities
- "top_performers": subcategories or artists performing best
- "undervalued_areas": areas the analyst sees as undervalued
- "forecast_6_month": short paragraph on 6-month outlook
- "forecast_12_month": short paragraph on 12-month outlook
- "recommended_actions": array of strategic recommendations for the auction house`;

    const salesSummary = (recent_sales || []).map(s =>
      `${s.title || 'Unknown'} - Sold: $${s.hammer_price || 'N/A'}, Est: $${s.estimate_low || '?'}-$${s.estimate_high || '?'}`
    ).join('\n');

    const userPrompt = `Provide a market trends analysis for:

Category: ${category}

Recent Sales Data:
${salesSummary || 'No recent sales data provided - please provide general market analysis for this category'}`;

    const result = await callAI(systemPrompt, userPrompt);
    const saved = await persistAIResult({
      feature: 'market-trends',
      user_id: userId(req),
      entity_type: 'category',
      entity_id: null,
      prompt_summary: req.body.category || 'general',
      result,
    });
    res.json({ success: true, result, saved_id: saved && saved.id });
  } catch (err) {
    console.error('AI market trends error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /history — paginated ai_results history (any feature, optional filter).
const { pool } = require('../db');
router.get('/history', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const feature = req.query.feature ? String(req.query.feature) : null;

    const params = [];
    let where = '';
    if (feature) {
      params.push(feature);
      where = `WHERE feature = $${params.length}`;
    }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM ai_results ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limit);
    params.push(offset);
    const dataRes = await pool.query(
      `SELECT id, feature, user_id, entity_type, entity_id, prompt_summary, result, model, created_at
       FROM ai_results ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: dataRes.rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('AI history error:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// Apply pass 5 — additive endpoints (backlog: dynamic reserve, predicted
// final price, shill bidding detection, eBay/insurance integration stubs)
// =====================================================================

// Wrap callAI so missing key returns 503 with `missing: <ENV>` (rest of file
// kept unchanged to avoid disturbing existing behavior).
// ENV VARS: OPENROUTER_API_KEY (required), OPENROUTER_MODEL (optional)
async function callAIOr503(systemPrompt, userPrompt, options) {
  const k = process.env.OPENROUTER_API_KEY;
  const isPlaceholder = !k || /^(your_)?openrouter_(api_)?key(_here)?$/i.test(k) || k === 'your_openrouter_api_key_here' || k === 'your_openrouter_key_here';
  if (isPlaceholder) {
    const err = new Error('AI service unavailable. OPENROUTER_API_KEY is not configured on the server.');
    err.statusCode = 503;
    err.missing = 'OPENROUTER_API_KEY';
    throw err;
  }
  try {
    return await callAI(systemPrompt, userPrompt, options);
  } catch (err) {
    // Translate auth errors from OpenRouter into 503 (the user-visible meaning is the same)
    if (err && err.message && /401|Missing Authentication|Unauthorized/.test(err.message)) {
      const e = new Error('AI service unavailable. OPENROUTER_API_KEY is invalid or not configured.');
      e.statusCode = 503;
      e.missing = 'OPENROUTER_API_KEY';
      throw e;
    }
    throw err;
  }
}

function send503OrError(err, res, label) {
  if (err && err.statusCode === 503) {
    return res.status(503).json({ error: err.message, missing: err.missing || 'OPENROUTER_API_KEY' });
  }
  console.error(`AI ${label} error:`, err);
  return res.status(500).json({ success: false, error: err && err.message ? err.message : String(err) });
}

// POST /dynamic-reserve-pricing — AI-driven dynamic reserve recommendation.
// PRODUCT-DECISION: reserve floor = max(70% of estimate_low, consignor minimum
// when supplied). Confidence tiers (low/medium/high) gate auto-apply: only
// "high" confidence is auto-applied; otherwise we recommend for human review.
// Inputs: { item_id?, title, category, estimate_low, estimate_high, condition,
//           consignor_min?, recent_comparables?, market_signals? }
router.post('/dynamic-reserve-pricing', async (req, res) => {
  try {
    const {
      item_id, title, category, estimate_low, estimate_high, condition,
      consignor_min, recent_comparables, market_signals,
    } = req.body || {};
    if (!title || !category) {
      return res.status(400).json({ error: 'title and category are required' });
    }
    const policyFloor = Math.max(
      Number(estimate_low || 0) * 0.7,
      Number(consignor_min || 0)
    );
    const systemPrompt = `You are a senior auction strategist. Recommend a dynamic reserve price for this lot. The reserve must never fall below the policy floor provided. Respond ONLY in JSON with fields:
- recommended_reserve_usd (number)
- recommended_range_low_usd (number)
- recommended_range_high_usd (number)
- confidence ("low"|"medium"|"high")
- rationale (string, 2-4 sentences)
- key_drivers (array of strings)
- comparable_basis (array of strings)
- risk_flags (array of strings)`;
    const userPrompt = `Lot: ${title}
Category: ${category}
Condition: ${condition || 'n/a'}
Estimate range: $${estimate_low || 'n/a'} - $${estimate_high || 'n/a'}
Consignor minimum: $${consignor_min || 'n/a'}
Policy floor (max(70% of low, consignor_min)): $${policyFloor}
Recent comparables: ${JSON.stringify(recent_comparables || [])}
Market signals: ${JSON.stringify(market_signals || [])}`;
    const result = await callAIOr503(systemPrompt, userPrompt);
    // Enforce policy floor on the AI suggestion
    let finalReserve = Number(result?.recommended_reserve_usd) || policyFloor;
    if (finalReserve < policyFloor) finalReserve = policyFloor;
    const auto_apply = (result?.confidence === 'high');
    const saved = await persistAIResult({
      feature: 'dynamic-reserve-pricing',
      user_id: userId(req),
      entity_type: 'item',
      entity_id: item_id || null,
      prompt_summary: `${title} (${category})`,
      result: { ...result, enforced_reserve_usd: finalReserve, policy_floor_usd: policyFloor, auto_apply },
    });
    res.json({ success: true, result: { ...result, enforced_reserve_usd: finalReserve, policy_floor_usd: policyFloor, auto_apply }, saved_id: saved && saved.id });
  } catch (err) {
    return send503OrError(err, res, 'dynamic-reserve-pricing');
  }
});

// POST /predict-final-price — predicted hammer + buyer's premium.
// PRODUCT-DECISION: assume buyer's premium = 25% on first $1M, 20% above.
// Default scenario weighting: 60% base / 25% optimistic / 15% pessimistic.
router.post('/predict-final-price', async (req, res) => {
  try {
    const {
      item_id, title, category, estimate_low, estimate_high, condition,
      provenance_notes, recent_comparables, marketing_reach, prebid_count,
    } = req.body || {};
    if (!title || !category) {
      return res.status(400).json({ error: 'title and category are required' });
    }
    const systemPrompt = `You are a quantitative auction analyst. Predict the final hammer price for this lot, then compute final price including a buyer's premium tier (25% on first $1,000,000, 20% above). Respond ONLY in JSON with fields:
- predicted_hammer_low_usd (number)
- predicted_hammer_mid_usd (number)
- predicted_hammer_high_usd (number)
- predicted_final_with_premium_usd (number)
- probability_meets_estimate_low_pct (0-100)
- probability_exceeds_estimate_high_pct (0-100)
- key_drivers (array of strings)
- downside_risks (array of strings)
- methodology_notes (string)`;
    const userPrompt = `Lot: ${title}
Category: ${category}
Estimate: $${estimate_low || '?'} - $${estimate_high || '?'}
Condition: ${condition || 'n/a'}
Provenance: ${provenance_notes || 'n/a'}
Marketing reach (impressions): ${marketing_reach || 'n/a'}
Pre-bids: ${prebid_count || 0}
Recent comparables: ${JSON.stringify(recent_comparables || [])}
Scenario weighting (base/up/down): 60/25/15`;
    const result = await callAIOr503(systemPrompt, userPrompt);
    const saved = await persistAIResult({
      feature: 'predict-final-price',
      user_id: userId(req),
      entity_type: 'item',
      entity_id: item_id || null,
      prompt_summary: `${title} (${category})`,
      result,
    });
    res.json({ success: true, result, saved_id: saved && saved.id });
  } catch (err) {
    return send503OrError(err, res, 'predict-final-price');
  }
});

// POST /shill-bidding-detection — additive bid-graph analytics. Read-only.
// PRODUCT-DECISION: heuristic indicators are computed without AI; the AI
// produces an analyst write-up over them. We never auto-flag accounts.
// Inputs: { auction_id?, lot_id?, bids: [{bidder_id, amount, timestamp}] }
router.post('/shill-bidding-detection', async (req, res) => {
  try {
    const { auction_id, lot_id, bids } = req.body || {};
    const arr = Array.isArray(bids) ? bids : [];
    if (arr.length < 3) {
      return res.status(400).json({ error: 'bids array with at least 3 entries is required' });
    }
    // Heuristic signals
    const byBidder = {};
    arr.forEach((b) => {
      const k = String(b.bidder_id);
      byBidder[k] = byBidder[k] || { count: 0, total: 0, last_idx: -1, gaps: [] };
      byBidder[k].count += 1;
      byBidder[k].total += Number(b.amount || 0);
    });
    arr.forEach((b, i) => {
      const k = String(b.bidder_id);
      if (byBidder[k].last_idx >= 0) byBidder[k].gaps.push(i - byBidder[k].last_idx);
      byBidder[k].last_idx = i;
    });
    const indicators = Object.entries(byBidder).map(([bidder_id, v]) => {
      const fastFollows = v.gaps.filter((g) => g === 1).length;
      return {
        bidder_id,
        bid_count: v.count,
        avg_amount: v.count ? v.total / v.count : 0,
        consecutive_followups: fastFollows,
        suspicious_pattern: fastFollows >= 3,
      };
    });
    const systemPrompt = `You are a bid-integrity analyst. You receive numeric heuristic indicators for each bidder on a lot. Produce ONLY JSON with fields:
- summary (string)
- flagged_bidders (array of { bidder_id, severity: "low"|"medium"|"high", reasons: [string] })
- recommended_actions (array of strings)
- confidence ("low"|"medium"|"high")
- requires_human_review (boolean)`;
    const userPrompt = `Auction: ${auction_id || 'n/a'} | Lot: ${lot_id || 'n/a'}
Bid count: ${arr.length}
Bidder indicators:
${JSON.stringify(indicators, null, 2)}`;
    const result = await callAIOr503(systemPrompt, userPrompt);
    const saved = await persistAIResult({
      feature: 'shill-bidding-detection',
      user_id: userId(req),
      entity_type: 'lot',
      entity_id: lot_id || null,
      prompt_summary: `lot=${lot_id || '?'} bids=${arr.length}`,
      result: { ...result, indicators, requires_human_review: true },
    });
    res.json({ success: true, result: { ...result, indicators, requires_human_review: true }, saved_id: saved && saved.id });
  } catch (err) {
    return send503OrError(err, res, 'shill-bidding-detection');
  }
});

// POST /external-auction-search — eBay / Sotheby's / Invaluable / Artnet
// integration stub. NEEDS-CREDS — gates on EBAY_API_KEY (and friends).
// ENV VARS: EBAY_API_KEY, SOTHEBYS_API_KEY, INVALUABLE_API_KEY, ARTNET_API_KEY
// PRODUCT-DECISION: any provider key satisfies the gate; if none set, return
// 503 listing all missing env vars.
router.post('/external-auction-search', async (req, res) => {
  const providers = [
    { name: 'ebay',       env: 'EBAY_API_KEY' },
    { name: 'sothebys',   env: 'SOTHEBYS_API_KEY' },
    { name: 'invaluable', env: 'INVALUABLE_API_KEY' },
    { name: 'artnet',     env: 'ARTNET_API_KEY' },
  ];
  const available = providers.filter(p => !!process.env[p.env]);
  if (available.length === 0) {
    return res.status(503).json({
      error: 'External auction search unavailable. No provider credentials configured.',
      missing: providers.map(p => p.env).join(','),
    });
  }
  const { query, category, max_results } = req.body || {};
  if (!query) return res.status(400).json({ error: 'query is required' });
  // Stub: providers are gated, but no live HTTP calls are made here to avoid
  // shipping vendor SDKs. Returns the configured provider list.
  res.json({
    success: true,
    query,
    category: category || null,
    max_results: Number(max_results) || 10,
    configured_providers: available.map(p => p.name),
    results: [],
    note: 'Provider integration stub — credentials present but live SDK calls are not wired in this pass.',
  });
});

// POST /insurance-policy-recommendation — insurance carrier integration stub.
// NEEDS-CREDS — gates on INSURANCE_API_KEY (carrier-agnostic).
// ENV VARS: INSURANCE_API_KEY, INSURANCE_CARRIER (optional, default "axa-art")
// PRODUCT-DECISION: when key is present we still synthesize a policy via AI
// rather than calling a live carrier (no SDK dependency added).
router.post('/insurance-policy-recommendation', async (req, res) => {
  if (!process.env.INSURANCE_API_KEY) {
    return res.status(503).json({
      error: 'Insurance integration unavailable. INSURANCE_API_KEY not configured.',
      missing: 'INSURANCE_API_KEY',
    });
  }
  try {
    const { item_id, title, category, appraised_value, transit_required, storage_location } = req.body || {};
    if (!title || !appraised_value) {
      return res.status(400).json({ error: 'title and appraised_value are required' });
    }
    const carrier = process.env.INSURANCE_CARRIER || 'axa-art';
    const systemPrompt = `You are a fine-art insurance broker. Recommend a policy structure (carrier-agnostic). Respond ONLY in JSON with fields:
- recommended_policy_type (string)
- recommended_coverage_usd (number)
- recommended_deductible_usd (number)
- estimated_annual_premium_usd (number)
- key_exclusions (array of strings)
- transit_rider (boolean)
- storage_rider (boolean)
- carrier_notes (string)`;
    const userPrompt = `Lot: ${title}
Category: ${category || 'n/a'}
Appraised value: $${appraised_value}
Transit required: ${!!transit_required}
Storage location: ${storage_location || 'n/a'}
Carrier (declared): ${carrier}`;
    const result = await callAIOr503(systemPrompt, userPrompt);
    const saved = await persistAIResult({
      feature: 'insurance-policy-recommendation',
      user_id: userId(req),
      entity_type: 'item',
      entity_id: item_id || null,
      prompt_summary: `${title} ($${appraised_value})`,
      result: { ...result, carrier },
    });
    res.json({ success: true, result: { ...result, carrier }, saved_id: saved && saved.id });
  } catch (err) {
    return send503OrError(err, res, 'insurance-policy-recommendation');
  }
});

module.exports = router;
