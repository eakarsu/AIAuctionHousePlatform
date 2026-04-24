const router = require('express').Router();
const { query } = require('../db');

// GET / - list all
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM estate_sales ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List estate sales error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM estate_sales WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Estate sale not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get estate sale error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { estate_name, contact_person, contact_email, contact_phone, estate_address, total_items, estimated_value, sale_date, status, assigned_specialist, notes } = req.body;
    const result = await query(
      `INSERT INTO estate_sales (estate_name, contact_person, contact_email, contact_phone, estate_address, total_items, estimated_value, sale_date, status, assigned_specialist, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [estate_name, contact_person, contact_email, contact_phone, estate_address, total_items || 0, estimated_value, sale_date, status || 'consultation', assigned_specialist, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create estate sale error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { estate_name, contact_person, contact_email, contact_phone, estate_address, total_items, estimated_value, sale_date, status, assigned_specialist, notes } = req.body;
    const result = await query(
      `UPDATE estate_sales SET estate_name=$1, contact_person=$2, contact_email=$3, contact_phone=$4, estate_address=$5, total_items=$6, estimated_value=$7, sale_date=$8, status=$9, assigned_specialist=$10, notes=$11
       WHERE id=$12 RETURNING *`,
      [estate_name, contact_person, contact_email, contact_phone, estate_address, total_items, estimated_value, sale_date, status, assigned_specialist, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Estate sale not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update estate sale error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM estate_sales WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Estate sale not found' });
    res.json({ message: 'Estate sale deleted', estate: result.rows[0] });
  } catch (err) {
    console.error('Delete estate sale error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
