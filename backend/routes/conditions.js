const router = require('express').Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM condition_reports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List condition reports error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM condition_reports WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Condition report not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get condition report error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { item_id, inspector_name, overall_condition, structural_integrity, surface_condition, damage_description, restoration_history, recommendations, report_date, images } = req.body;
    const result = await query(
      `INSERT INTO condition_reports (item_id, inspector_name, overall_condition, structural_integrity, surface_condition, damage_description, restoration_history, recommendations, report_date, images)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [item_id, inspector_name, overall_condition, structural_integrity, surface_condition, damage_description, restoration_history, recommendations, report_date || new Date(), images]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create condition report error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { item_id, inspector_name, overall_condition, structural_integrity, surface_condition, damage_description, restoration_history, recommendations, report_date, images } = req.body;
    const result = await query(
      `UPDATE condition_reports SET item_id=$1, inspector_name=$2, overall_condition=$3, structural_integrity=$4, surface_condition=$5, damage_description=$6, restoration_history=$7, recommendations=$8, report_date=$9, images=$10
       WHERE id=$11 RETURNING *`,
      [item_id, inspector_name, overall_condition, structural_integrity, surface_condition, damage_description, restoration_history, recommendations, report_date, images, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Condition report not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update condition report error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM condition_reports WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Condition report not found' });
    res.json({ message: 'Condition report deleted', report: result.rows[0] });
  } catch (err) {
    console.error('Delete condition report error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
