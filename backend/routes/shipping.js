const router = require('express').Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM shipping ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List shipping error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM shipping WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Shipping record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get shipping error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { invoice_id, item_id, bidder_id, carrier, tracking_number, shipping_method, shipping_cost, insurance_value, status, pickup_date, delivery_date, destination_address, special_instructions } = req.body;
    const result = await query(
      `INSERT INTO shipping (invoice_id, item_id, bidder_id, carrier, tracking_number, shipping_method, shipping_cost, insurance_value, status, pickup_date, delivery_date, destination_address, special_instructions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [invoice_id, item_id, bidder_id, carrier, tracking_number, shipping_method, shipping_cost, insurance_value, status || 'pending', pickup_date, delivery_date, destination_address, special_instructions]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create shipping error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { invoice_id, item_id, bidder_id, carrier, tracking_number, shipping_method, shipping_cost, insurance_value, status, pickup_date, delivery_date, destination_address, special_instructions } = req.body;
    const result = await query(
      `UPDATE shipping SET invoice_id=$1, item_id=$2, bidder_id=$3, carrier=$4, tracking_number=$5, shipping_method=$6, shipping_cost=$7, insurance_value=$8, status=$9, pickup_date=$10, delivery_date=$11, destination_address=$12, special_instructions=$13
       WHERE id=$14 RETURNING *`,
      [invoice_id, item_id, bidder_id, carrier, tracking_number, shipping_method, shipping_cost, insurance_value, status, pickup_date, delivery_date, destination_address, special_instructions, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Shipping record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update shipping error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM shipping WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Shipping record not found' });
    res.json({ message: 'Shipping record deleted', shipping: result.rows[0] });
  } catch (err) {
    console.error('Delete shipping error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
