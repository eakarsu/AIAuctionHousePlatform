const router = require('express').Router();
const { callAI } = require('../ai');

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
    res.json({ success: true, result });
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
    res.json({ success: true, result });
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
    res.json({ success: true, result });
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
    res.json({ success: true, result });
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
    res.json({ success: true, result });
  } catch (err) {
    console.error('AI buyer matching error:', err);
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
    res.json({ success: true, result });
  } catch (err) {
    console.error('AI market trends error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
