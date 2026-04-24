const router = require('express').Router();
const { query } = require('../db');

// GET / - list all
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM appraisals ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List appraisals error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM appraisals WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appraisal not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get appraisal error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { item_id, appraiser_name, appraisal_type, appraised_value, appraisal_date, purpose, status, report_text, notes } = req.body;
    const result = await query(
      `INSERT INTO appraisals (item_id, appraiser_name, appraisal_type, appraised_value, appraisal_date, purpose, status, report_text, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [item_id, appraiser_name, appraisal_type, appraised_value, appraisal_date, purpose, status || 'pending', report_text, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create appraisal error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { item_id, appraiser_name, appraisal_type, appraised_value, appraisal_date, purpose, status, report_text, notes } = req.body;
    const result = await query(
      `UPDATE appraisals SET item_id=$1, appraiser_name=$2, appraisal_type=$3, appraised_value=$4, appraisal_date=$5, purpose=$6, status=$7, report_text=$8, notes=$9
       WHERE id=$10 RETURNING *`,
      [item_id, appraiser_name, appraisal_type, appraised_value, appraisal_date, purpose, status, report_text, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appraisal not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update appraisal error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM appraisals WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appraisal not found' });
    res.json({ message: 'Appraisal deleted', appraisal: result.rows[0] });
  } catch (err) {
    console.error('Delete appraisal error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
