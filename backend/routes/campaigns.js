const router = require('express').Router();
const { query } = require('../db');

// GET / - list all
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM marketing_campaigns ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List campaigns error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM marketing_campaigns WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get campaign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { auction_id, campaign_name, campaign_type, target_audience, start_date, end_date, budget, status, channels, metrics, notes } = req.body;
    const result = await query(
      `INSERT INTO marketing_campaigns (auction_id, campaign_name, campaign_type, target_audience, start_date, end_date, budget, status, channels, metrics, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [auction_id, campaign_name, campaign_type, target_audience, start_date, end_date, budget, status || 'planned', channels, metrics, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create campaign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { auction_id, campaign_name, campaign_type, target_audience, start_date, end_date, budget, status, channels, metrics, notes } = req.body;
    const result = await query(
      `UPDATE marketing_campaigns SET auction_id=$1, campaign_name=$2, campaign_type=$3, target_audience=$4, start_date=$5, end_date=$6, budget=$7, status=$8, channels=$9, metrics=$10, notes=$11
       WHERE id=$12 RETURNING *`,
      [auction_id, campaign_name, campaign_type, target_audience, start_date, end_date, budget, status, channels, metrics, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update campaign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM marketing_campaigns WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ message: 'Campaign deleted', campaign: result.rows[0] });
  } catch (err) {
    console.error('Delete campaign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
