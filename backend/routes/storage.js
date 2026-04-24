const router = require('express').Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM storage ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List storage error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM storage WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Storage record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get storage error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { item_id, location, zone, shelf, bin_number, storage_type, temperature_controlled, status, intake_date, expected_release_date, special_requirements, daily_rate } = req.body;
    const result = await query(
      `INSERT INTO storage (item_id, location, zone, shelf, bin_number, storage_type, temperature_controlled, status, intake_date, expected_release_date, special_requirements, daily_rate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [item_id, location, zone, shelf, bin_number, storage_type, temperature_controlled || false, status || 'stored', intake_date || new Date(), expected_release_date, special_requirements, daily_rate || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create storage error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { item_id, location, zone, shelf, bin_number, storage_type, temperature_controlled, status, intake_date, expected_release_date, special_requirements, daily_rate } = req.body;
    const result = await query(
      `UPDATE storage SET item_id=$1, location=$2, zone=$3, shelf=$4, bin_number=$5, storage_type=$6, temperature_controlled=$7, status=$8, intake_date=$9, expected_release_date=$10, special_requirements=$11, daily_rate=$12
       WHERE id=$13 RETURNING *`,
      [item_id, location, zone, shelf, bin_number, storage_type, temperature_controlled, status, intake_date, expected_release_date, special_requirements, daily_rate, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Storage record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update storage error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM storage WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Storage record not found' });
    res.json({ message: 'Storage record deleted', storage: result.rows[0] });
  } catch (err) {
    console.error('Delete storage error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
