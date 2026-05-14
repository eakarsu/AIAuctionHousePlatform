const router = require('express').Router();
const { query, pool } = require('../db');
const { paginatedList } = require('../paginate');

router.get('/', async (req, res) => {
  try {
    const result = await paginatedList({
      pool,
      table: 'bidders',
      orderBy: 'created_at DESC',
      searchColumns: ['name', 'email', 'paddle_number'],
      req,
    });
    res.json(result);
  } catch (err) {
    console.error('List bidders error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM bidders WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bidder not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get bidder error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, address, paddle_number, verification_status, deposit_amount, total_purchases, preferred_categories, bidding_limit, notes } = req.body;
    const result = await query(
      `INSERT INTO bidders (name, email, phone, address, paddle_number, verification_status, deposit_amount, total_purchases, preferred_categories, bidding_limit, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, email, phone, address, paddle_number, verification_status || 'pending', deposit_amount || 0, total_purchases || 0, preferred_categories, bidding_limit, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create bidder error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, address, paddle_number, verification_status, deposit_amount, total_purchases, preferred_categories, bidding_limit, notes } = req.body;
    const result = await query(
      `UPDATE bidders SET name=$1, email=$2, phone=$3, address=$4, paddle_number=$5, verification_status=$6, deposit_amount=$7, total_purchases=$8, preferred_categories=$9, bidding_limit=$10, notes=$11
       WHERE id=$12 RETURNING *`,
      [name, email, phone, address, paddle_number, verification_status, deposit_amount, total_purchases, preferred_categories, bidding_limit, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bidder not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update bidder error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM bidders WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bidder not found' });
    res.json({ message: 'Bidder deleted', bidder: result.rows[0] });
  } catch (err) {
    console.error('Delete bidder error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
