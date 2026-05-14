const router = require('express').Router();
const { query, pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Known auction categories for validation
const KNOWN_CATEGORIES = [
  'fine art', 'paintings', 'sculpture', 'prints & multiples', 'photographs',
  'jewelry', 'watches', 'antiques', 'furniture', 'decorative arts',
  'books & manuscripts', 'coins & currency', 'wine & spirits',
  'collectibles', 'asian art', 'african art', 'contemporary art',
  'old masters', 'impressionist', 'modern art', 'pop art',
  'ceramics', 'glass', 'silver', 'textiles', 'maps', 'memorabilia',
  'automobiles', 'other',
];

// Input validation rules (reusable)
const lotValidationRules = [
  body('title')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Lot title must be 200 characters or fewer'),
  body('starting_bid')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('starting_bid must be a positive number'),
  body('category')
    .optional()
    .isString()
    .custom((val) => {
      if (!KNOWN_CATEGORIES.includes(val.toLowerCase())) {
        throw new Error(
          `category must be one of: ${KNOWN_CATEGORIES.join(', ')}`
        );
      }
      return true;
    }),
];

// Middleware to handle validation errors
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
}

// Ensure lot_valuations table exists
async function ensureValuationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS lot_valuations (
      id SERIAL PRIMARY KEY,
      lot_id INTEGER NOT NULL,
      estimated_value NUMERIC,
      confidence VARCHAR(20),
      market_comparables JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}

// Call OpenRouter with vision content
async function callVisionAI(imageBuffer, mediaType) {
  const base64Data = imageBuffer.toString('base64');

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:4000',
      'X-Title': 'AI Auction House Platform',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `You are an expert auction house appraiser. Analyze this item's condition, authenticity indicators, and market value potential.

Respond with a JSON object containing:
- "condition_grade": string (e.g., "Excellent", "Very Good", "Good", "Fair", "Poor")
- "authenticity_indicators": array of strings describing signs of authenticity or concerns
- "value_estimate_range": object with "low" (number in USD) and "high" (number in USD)
- "notable_features": array of strings describing notable characteristics that affect value

Always respond with valid JSON only.`,
            },
          ],
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No response from AI model');

  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1].trim());
    return JSON.parse(content);
  } catch {
    return { raw: content };
  }
}

// POST /api/lots - create a lot with validation
router.post(
  '/',
  authenticateToken,
  lotValidationRules,
  handleValidation,
  async (req, res) => {
    try {
      const {
        title, description, category, starting_bid, estimate_low, estimate_high,
        consignor_id, lot_number, dimensions, medium, condition, provenance,
        reserve_price, hammer_price, status, image_url,
      } = req.body;

      const result = await query(
        `INSERT INTO items
           (title, description, category, consignor_id, lot_number, dimensions, medium, condition,
            provenance, reserve_price, estimate_low, estimate_high, hammer_price, status, image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING *`,
        [
          title, description, category, consignor_id, lot_number, dimensions, medium, condition,
          provenance, reserve_price || starting_bid, estimate_low, estimate_high,
          hammer_price, status || 'cataloged', image_url,
        ]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Create lot error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// PUT /api/lots/:id - update a lot with validation
router.put(
  '/:id',
  authenticateToken,
  lotValidationRules,
  handleValidation,
  async (req, res) => {
    try {
      const {
        title, description, category, consignor_id, lot_number, dimensions, medium, condition,
        provenance, reserve_price, estimate_low, estimate_high, hammer_price, status, image_url,
      } = req.body;

      const result = await query(
        `UPDATE items
         SET title=$1, description=$2, category=$3, consignor_id=$4, lot_number=$5, dimensions=$6,
             medium=$7, condition=$8, provenance=$9, reserve_price=$10, estimate_low=$11,
             estimate_high=$12, hammer_price=$13, status=$14, image_url=$15
         WHERE id=$16 RETURNING *`,
        [
          title, description, category, consignor_id, lot_number, dimensions, medium, condition,
          provenance, reserve_price, estimate_low, estimate_high, hammer_price, status, image_url,
          req.params.id,
        ]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Lot not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Update lot error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/lots/:id/ai-image-analyze
// Reads lot image from disk, sends to Claude vision, saves result
router.post('/:id/ai-image-analyze', authenticateToken, async (req, res) => {
  try {
    const lotId = req.params.id;

    // Fetch the lot record
    const lotResult = await query('SELECT * FROM items WHERE id = $1', [lotId]);
    if (lotResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lot not found' });
    }
    const lot = lotResult.rows[0];

    if (!lot.image_url) {
      return res.status(400).json({ error: 'This lot has no image associated' });
    }

    // Resolve image path — support both absolute paths and relative /uploads/... paths
    let imagePath = lot.image_url;
    if (!path.isAbsolute(imagePath)) {
      // Strip leading slash if present
      const relative = imagePath.replace(/^\//, '');
      imagePath = path.join(__dirname, '..', relative);
    }

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: `Image file not found on disk: ${lot.image_url}` });
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
    const mediaType = mimeMap[ext] || 'image/jpeg';

    const analysis = await callVisionAI(imageBuffer, mediaType);

    // Save ai_image_analysis JSONB back to the lot record
    let updatedLot = lot;
    try {
      const updateResult = await query(
        'UPDATE items SET ai_image_analysis = $1 WHERE id = $2 RETURNING *',
        [JSON.stringify(analysis), lotId]
      );
      updatedLot = updateResult.rows[0];
    } catch (dbErr) {
      // Column may not exist yet; add it and retry
      if (dbErr.message && dbErr.message.includes('ai_image_analysis')) {
        await query('ALTER TABLE items ADD COLUMN IF NOT EXISTS ai_image_analysis JSONB');
        const updateResult = await query(
          'UPDATE items SET ai_image_analysis = $1 WHERE id = $2 RETURNING *',
          [JSON.stringify(analysis), lotId]
        );
        updatedLot = updateResult.rows[0];
      } else {
        console.warn('[ai-image-analyze] Could not save ai_image_analysis:', dbErr.message);
      }
    }

    res.json({
      success: true,
      lot_id: lotId,
      analysis,
    });
  } catch (err) {
    console.error('AI image analyze error:', err);
    res.status(500).json({ error: err.message || 'Image analysis failed' });
  }
});

// GET /api/lots/:id/valuation-history
// Returns all past AI valuations for a lot from the lot_valuations table
router.get('/:id/valuation-history', authenticateToken, async (req, res) => {
  try {
    await ensureValuationsTable();

    const lotId = req.params.id;

    // Verify lot exists
    const lotCheck = await query('SELECT id FROM items WHERE id = $1', [lotId]);
    if (lotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lot not found' });
    }

    const result = await query(
      'SELECT * FROM lot_valuations WHERE lot_id = $1 ORDER BY created_at DESC',
      [lotId]
    );

    res.json({ lot_id: lotId, valuations: result.rows });
  } catch (err) {
    console.error('Valuation history error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/lots/:id/valuations - save a new valuation entry
router.post('/:id/valuations', authenticateToken, async (req, res) => {
  try {
    await ensureValuationsTable();

    const lotId = req.params.id;
    const { estimated_value, confidence, market_comparables } = req.body;

    const lotCheck = await query('SELECT id FROM items WHERE id = $1', [lotId]);
    if (lotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lot not found' });
    }

    const result = await query(
      `INSERT INTO lot_valuations (lot_id, estimated_value, confidence, market_comparables)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [lotId, estimated_value, confidence, JSON.stringify(market_comparables || [])]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Save valuation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
