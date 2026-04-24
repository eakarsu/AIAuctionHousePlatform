const router = require('express').Router();
const { query } = require('../db');

// GET / - list all
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM catalog_entries ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List catalog entries error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /auction/:auctionId - entries by auction
router.get('/auction/:auctionId', async (req, res) => {
  try {
    const result = await query('SELECT * FROM catalog_entries WHERE auction_id = $1 ORDER BY lot_sequence ASC', [req.params.auctionId]);
    res.json(result.rows);
  } catch (err) {
    console.error('List catalog entries by auction error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM catalog_entries WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Catalog entry not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get catalog entry error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { auction_id, item_id, lot_sequence, page_number, catalog_text, status } = req.body;
    const result = await query(
      `INSERT INTO catalog_entries (auction_id, item_id, lot_sequence, page_number, catalog_text, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [auction_id, item_id, lot_sequence, page_number, catalog_text, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create catalog entry error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { auction_id, item_id, lot_sequence, page_number, catalog_text, status } = req.body;
    const result = await query(
      `UPDATE catalog_entries SET auction_id=$1, item_id=$2, lot_sequence=$3, page_number=$4, catalog_text=$5, status=$6
       WHERE id=$7 RETURNING *`,
      [auction_id, item_id, lot_sequence, page_number, catalog_text, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Catalog entry not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update catalog entry error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM catalog_entries WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Catalog entry not found' });
    res.json({ message: 'Catalog entry deleted', entry: result.rows[0] });
  } catch (err) {
    console.error('Delete catalog entry error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
