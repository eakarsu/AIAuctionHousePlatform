const router = require('express').Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM invoices ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List invoices error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get invoice error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { invoice_number, bidder_id, auction_id, subtotal, buyer_premium, tax, total, status, due_date, paid_date, notes } = req.body;
    const result = await query(
      `INSERT INTO invoices (invoice_number, bidder_id, auction_id, subtotal, buyer_premium, tax, total, status, due_date, paid_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [invoice_number, bidder_id, auction_id, subtotal, buyer_premium, tax, total, status || 'pending', due_date, paid_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create invoice error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { invoice_number, bidder_id, auction_id, subtotal, buyer_premium, tax, total, status, due_date, paid_date, notes } = req.body;
    const result = await query(
      `UPDATE invoices SET invoice_number=$1, bidder_id=$2, auction_id=$3, subtotal=$4, buyer_premium=$5, tax=$6, total=$7, status=$8, due_date=$9, paid_date=$10, notes=$11
       WHERE id=$12 RETURNING *`,
      [invoice_number, bidder_id, auction_id, subtotal, buyer_premium, tax, total, status, due_date, paid_date, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update invoice error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM invoices WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ message: 'Invoice deleted', invoice: result.rows[0] });
  } catch (err) {
    console.error('Delete invoice error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
