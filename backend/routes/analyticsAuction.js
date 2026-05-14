const router = require('express').Router();
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/analytics/auction/:id
// Returns comprehensive analytics for a specific auction
router.get('/auction/:id', authenticateToken, async (req, res) => {
  try {
    const auctionId = req.params.id;

    // Verify auction exists
    const auctionCheck = await query('SELECT * FROM auctions WHERE id = $1', [auctionId]);
    if (auctionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Auction not found' });
    }
    const auction = auctionCheck.rows[0];

    // 1. Total lots, sold %, total hammer value, avg lots per bidder
    const summaryResult = await query(
      `SELECT
         COUNT(DISTINCT i.id) as total_lots,
         COUNT(DISTINCT CASE WHEN i.status = 'sold' THEN i.id END) as sold_lots,
         COALESCE(SUM(CASE WHEN i.status = 'sold' THEN i.hammer_price ELSE 0 END), 0) as total_hammer_value,
         COUNT(DISTINCT lb.bidder_id) as unique_bidders,
         COUNT(DISTINCT i.id)::float / NULLIF(COUNT(DISTINCT lb.bidder_id), 0) as avg_lots_per_bidder
       FROM catalog_entries ce
       LEFT JOIN items i ON ce.item_id = i.id
       LEFT JOIN live_bids lb ON lb.auction_id = ce.auction_id
       WHERE ce.auction_id = $1`,
      [auctionId]
    );

    const summary = summaryResult.rows[0];
    const totalLots = parseInt(summary.total_lots) || 0;
    const soldLots = parseInt(summary.sold_lots) || 0;

    // 2. Bid velocity: bids per hour across the auction timeline
    const bidVelocityResult = await query(
      `SELECT
         DATE_TRUNC('hour', created_at) as hour,
         COUNT(*) as bid_count
       FROM live_bids
       WHERE auction_id = $1
       GROUP BY DATE_TRUNC('hour', created_at)
       ORDER BY hour ASC`,
      [auctionId]
    );

    // 3. Top 5 highest-value lots
    const topLotsResult = await query(
      `SELECT i.id, i.title, i.category, i.hammer_price, i.estimate_low, i.estimate_high, i.status
       FROM catalog_entries ce
       JOIN items i ON ce.item_id = i.id
       WHERE ce.auction_id = $1
       ORDER BY i.hammer_price DESC NULLS LAST
       LIMIT 5`,
      [auctionId]
    );

    // 4. Buyer demographic breakdown (by category preferences if available)
    let demographicBreakdown = [];
    try {
      const demoResult = await query(
        `SELECT
           b.preferred_categories,
           COUNT(DISTINCT b.id) as bidder_count,
           COUNT(lb.id) as bid_count,
           COALESCE(SUM(lb.bid_amount), 0) as total_bid_value
         FROM live_bids lb
         JOIN bidders b ON lb.bidder_id = b.id
         WHERE lb.auction_id = $1
         GROUP BY b.preferred_categories
         ORDER BY bidder_count DESC`,
        [auctionId]
      );
      demographicBreakdown = demoResult.rows;
    } catch (demoErr) {
      // preferred_categories column may not exist; skip gracefully
      console.warn('[auction analytics] Could not fetch demographics:', demoErr.message);
    }

    res.json({
      auction_id: auctionId,
      auction_title: auction.title,
      summary: {
        total_lots: totalLots,
        sold_lots: soldLots,
        sold_percentage: totalLots > 0 ? ((soldLots / totalLots) * 100).toFixed(1) : '0',
        total_hammer_value: parseFloat(summary.total_hammer_value) || 0,
        unique_bidders: parseInt(summary.unique_bidders) || 0,
        avg_lots_per_bidder: parseFloat(summary.avg_lots_per_bidder || 0).toFixed(2),
      },
      bid_velocity: bidVelocityResult.rows,
      top_5_highest_value_lots: topLotsResult.rows,
      buyer_demographic_breakdown: demographicBreakdown,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Auction analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
