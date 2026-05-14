const router = require('express').Router();
const { query } = require('../db');

// GET /
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : null;

    const params = [];
    let whereClause = '';

    if (search) {
      params.push(`%${search}%`);
      whereClause = `WHERE (title ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM items ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit);
    params.push(offset);

    const result = await query(
      `SELECT * FROM items ${whereClause} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('List items error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM items WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get item error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { title, description, category, consignor_id, lot_number, dimensions, medium, condition, provenance, reserve_price, estimate_low, estimate_high, hammer_price, status, image_url } = req.body;
    const result = await query(
      `INSERT INTO items (title, description, category, consignor_id, lot_number, dimensions, medium, condition, provenance, reserve_price, estimate_low, estimate_high, hammer_price, status, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [title, description, category, consignor_id, lot_number, dimensions, medium, condition, provenance, reserve_price, estimate_low, estimate_high, hammer_price, status || 'cataloged', image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { title, description, category, consignor_id, lot_number, dimensions, medium, condition, provenance, reserve_price, estimate_low, estimate_high, hammer_price, status, image_url } = req.body;
    const result = await query(
      `UPDATE items SET title=$1, description=$2, category=$3, consignor_id=$4, lot_number=$5, dimensions=$6, medium=$7, condition=$8, provenance=$9, reserve_price=$10, estimate_low=$11, estimate_high=$12, hammer_price=$13, status=$14, image_url=$15
       WHERE id=$16 RETURNING *`,
      [title, description, category, consignor_id, lot_number, dimensions, medium, condition, provenance, reserve_price, estimate_low, estimate_high, hammer_price, status, image_url, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM items WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted', item: result.rows[0] });
  } catch (err) {
    console.error('Delete item error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
