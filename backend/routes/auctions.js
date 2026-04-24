const router = require('express').Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM auctions ORDER BY start_date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List auctions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM auctions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Auction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get auction error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, auction_type, category, start_date, end_date, location, status, total_lots, total_sold, total_revenue, buyer_premium_rate, description } = req.body;
    const result = await query(
      `INSERT INTO auctions (title, auction_type, category, start_date, end_date, location, status, total_lots, total_sold, total_revenue, buyer_premium_rate, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [title, auction_type, category, start_date, end_date, location, status || 'upcoming', total_lots || 0, total_sold || 0, total_revenue || 0, buyer_premium_rate || 25.00, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create auction error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, auction_type, category, start_date, end_date, location, status, total_lots, total_sold, total_revenue, buyer_premium_rate, description } = req.body;
    const result = await query(
      `UPDATE auctions SET title=$1, auction_type=$2, category=$3, start_date=$4, end_date=$5, location=$6, status=$7, total_lots=$8, total_sold=$9, total_revenue=$10, buyer_premium_rate=$11, description=$12
       WHERE id=$13 RETURNING *`,
      [title, auction_type, category, start_date, end_date, location, status, total_lots, total_sold, total_revenue, buyer_premium_rate, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Auction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update auction error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM auctions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Auction not found' });
    res.json({ message: 'Auction deleted', auction: result.rows[0] });
  } catch (err) {
    console.error('Delete auction error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
