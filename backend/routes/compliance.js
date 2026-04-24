const router = require('express').Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM compliance_checks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List compliance checks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM compliance_checks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Compliance check not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get compliance check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { item_id, check_type, database_checked, result: checkResult, details, checked_by, check_date, expiry_date, certificate_number, notes } = req.body;
    const dbResult = await query(
      `INSERT INTO compliance_checks (item_id, check_type, database_checked, result, details, checked_by, check_date, expiry_date, certificate_number, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [item_id, check_type, database_checked, checkResult, details, checked_by, check_date || new Date(), expiry_date, certificate_number, notes]
    );
    res.status(201).json(dbResult.rows[0]);
  } catch (err) {
    console.error('Create compliance check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { item_id, check_type, database_checked, result: checkResult, details, checked_by, check_date, expiry_date, certificate_number, notes } = req.body;
    const dbResult = await query(
      `UPDATE compliance_checks SET item_id=$1, check_type=$2, database_checked=$3, result=$4, details=$5, checked_by=$6, check_date=$7, expiry_date=$8, certificate_number=$9, notes=$10
       WHERE id=$11 RETURNING *`,
      [item_id, check_type, database_checked, checkResult, details, checked_by, check_date, expiry_date, certificate_number, notes, req.params.id]
    );
    if (dbResult.rows.length === 0) return res.status(404).json({ error: 'Compliance check not found' });
    res.json(dbResult.rows[0]);
  } catch (err) {
    console.error('Update compliance check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM compliance_checks WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Compliance check not found' });
    res.json({ message: 'Compliance check deleted', check: result.rows[0] });
  } catch (err) {
    console.error('Delete compliance check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
