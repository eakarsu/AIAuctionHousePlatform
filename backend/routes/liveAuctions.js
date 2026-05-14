const router = require('express').Router();
const { query } = require('../db');

// GET / - list all bids
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM live_bids ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List live bids error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /auction/:auctionId - get bids for a specific auction
router.get('/auction/:auctionId', async (req, res) => {
  try {
    const result = await query(
      'SELECT lb.*, b.name as bidder_name, i.title as item_title FROM live_bids lb LEFT JOIN bidders b ON lb.bidder_id = b.id LEFT JOIN items i ON lb.item_id = i.id WHERE lb.auction_id = $1 ORDER BY lb.created_at DESC',
      [req.params.auctionId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get auction bids error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM live_bids WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bid not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get bid error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { auction_id, item_id, bidder_id, bid_amount, bid_type, is_winning } = req.body;
    const result = await query(
      `INSERT INTO live_bids (auction_id, item_id, bidder_id, bid_amount, bid_type, is_winning)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [auction_id, item_id, bidder_id, bid_amount, bid_type || 'live', is_winning || false]
    );
    const bid = result.rows[0];

    // Emit real-time bid notification to room lot:<item_id>
    if (item_id) {
      const io = req.app.get('io');
      if (io) {
        io.to(`lot:${item_id}`).emit('lot:bid', {
          lot_id: item_id,
          bid_id: bid.id,
          bid_amount: bid.bid_amount,
          bidder_id: bid.bidder_id,
          auction_id: bid.auction_id,
          timestamp: bid.created_at || new Date().toISOString(),
        });
      }
    }

    res.status(201).json(bid);
  } catch (err) {
    console.error('Create bid error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { auction_id, item_id, bidder_id, bid_amount, bid_type, is_winning } = req.body;
    const result = await query(
      `UPDATE live_bids SET auction_id=$1, item_id=$2, bidder_id=$3, bid_amount=$4, bid_type=$5, is_winning=$6
       WHERE id=$7 RETURNING *`,
      [auction_id, item_id, bidder_id, bid_amount, bid_type, is_winning, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bid not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update bid error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM live_bids WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bid not found' });
    res.json({ message: 'Bid deleted', bid: result.rows[0] });
  } catch (err) {
    console.error('Delete bid error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
