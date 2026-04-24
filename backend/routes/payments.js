const router = require('express').Router();
const { query } = require('../db');

// GET / - list all
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM payments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List payments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /invoice/:invoiceId - payments by invoice
router.get('/invoice/:invoiceId', async (req, res) => {
  try {
    const result = await query('SELECT * FROM payments WHERE invoice_id = $1 ORDER BY created_at DESC', [req.params.invoiceId]);
    res.json(result.rows);
  } catch (err) {
    console.error('List payments by invoice error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM payments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get payment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { invoice_id, bidder_id, amount, payment_method, transaction_id, status, payment_date, notes } = req.body;
    const result = await query(
      `INSERT INTO payments (invoice_id, bidder_id, amount, payment_method, transaction_id, status, payment_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [invoice_id, bidder_id, amount, payment_method, transaction_id, status || 'pending', payment_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { invoice_id, bidder_id, amount, payment_method, transaction_id, status, payment_date, notes } = req.body;
    const result = await query(
      `UPDATE payments SET invoice_id=$1, bidder_id=$2, amount=$3, payment_method=$4, transaction_id=$5, status=$6, payment_date=$7, notes=$8
       WHERE id=$9 RETURNING *`,
      [invoice_id, bidder_id, amount, payment_method, transaction_id, status, payment_date, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update payment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM payments WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json({ message: 'Payment deleted', payment: result.rows[0] });
  } catch (err) {
    console.error('Delete payment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
