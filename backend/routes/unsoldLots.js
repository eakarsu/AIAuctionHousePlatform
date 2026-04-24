const router = require('express').Router();
const { query } = require('../db');

// GET / - list all
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM unsold_lots ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List unsold lots error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM unsold_lots WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Unsold lot not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get unsold lot error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { item_id, auction_id, reason, action_taken, reoffer_auction_id, buy_now_price, return_to_consignor, notes } = req.body;
    const result = await query(
      `INSERT INTO unsold_lots (item_id, auction_id, reason, action_taken, reoffer_auction_id, buy_now_price, return_to_consignor, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [item_id, auction_id, reason, action_taken || 'pending_review', reoffer_auction_id, buy_now_price, return_to_consignor || false, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create unsold lot error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { item_id, auction_id, reason, action_taken, reoffer_auction_id, buy_now_price, return_to_consignor, notes } = req.body;
    const result = await query(
      `UPDATE unsold_lots SET item_id=$1, auction_id=$2, reason=$3, action_taken=$4, reoffer_auction_id=$5, buy_now_price=$6, return_to_consignor=$7, notes=$8
       WHERE id=$9 RETURNING *`,
      [item_id, auction_id, reason, action_taken, reoffer_auction_id, buy_now_price, return_to_consignor, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Unsold lot not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update unsold lot error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM unsold_lots WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Unsold lot not found' });
    res.json({ message: 'Unsold lot deleted', lot: result.rows[0] });
  } catch (err) {
    console.error('Delete unsold lot error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
