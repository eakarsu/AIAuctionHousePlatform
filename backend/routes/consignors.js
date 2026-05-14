const router = require('express').Router();
const { query, pool } = require('../db');
const { paginatedList } = require('../paginate');

// GET / - list all (paginated when ?page or ?limit provided)
router.get('/', async (req, res) => {
  try {
    const result = await paginatedList({
      pool,
      table: 'consignors',
      orderBy: 'created_at DESC',
      searchColumns: ['name', 'email', 'phone'],
      req,
    });
    res.json(result);
  } catch (err) {
    console.error('List consignors error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM consignors WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Consignor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get consignor error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, address, commission_rate, contract_status, total_consigned, total_sold, notes } = req.body;
    const result = await query(
      `INSERT INTO consignors (name, email, phone, address, commission_rate, contract_status, total_consigned, total_sold, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, email, phone, address, commission_rate || 15.00, contract_status || 'active', total_consigned || 0, total_sold || 0, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create consignor error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, address, commission_rate, contract_status, total_consigned, total_sold, notes } = req.body;
    const result = await query(
      `UPDATE consignors SET name=$1, email=$2, phone=$3, address=$4, commission_rate=$5, contract_status=$6, total_consigned=$7, total_sold=$8, notes=$9
       WHERE id=$10 RETURNING *`,
      [name, email, phone, address, commission_rate, contract_status, total_consigned, total_sold, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Consignor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update consignor error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM consignors WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Consignor not found' });
    res.json({ message: 'Consignor deleted', consignor: result.rows[0] });
  } catch (err) {
    console.error('Delete consignor error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
