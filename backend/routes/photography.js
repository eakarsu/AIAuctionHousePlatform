const router = require('express').Router();
const { query } = require('../db');

// GET / - list all
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM photography_schedule ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List photography schedule error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM photography_schedule WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Photography schedule not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get photography schedule error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { item_id, photographer, studio_location, scheduled_date, duration_minutes, shoot_type, status, notes } = req.body;
    const result = await query(
      `INSERT INTO photography_schedule (item_id, photographer, studio_location, scheduled_date, duration_minutes, shoot_type, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [item_id, photographer, studio_location, scheduled_date, duration_minutes || 60, shoot_type, status || 'scheduled', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create photography schedule error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { item_id, photographer, studio_location, scheduled_date, duration_minutes, shoot_type, status, notes } = req.body;
    const result = await query(
      `UPDATE photography_schedule SET item_id=$1, photographer=$2, studio_location=$3, scheduled_date=$4, duration_minutes=$5, shoot_type=$6, status=$7, notes=$8
       WHERE id=$9 RETURNING *`,
      [item_id, photographer, studio_location, scheduled_date, duration_minutes, shoot_type, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Photography schedule not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update photography schedule error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM photography_schedule WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Photography schedule not found' });
    res.json({ message: 'Photography schedule deleted', schedule: result.rows[0] });
  } catch (err) {
    console.error('Delete photography schedule error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
