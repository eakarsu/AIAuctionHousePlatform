const router = require('express').Router();
const { query } = require('../db');

// GET /financial
router.get('/financial', async (req, res) => {
  try {
    // Total revenue from completed auctions
    const revenueResult = await query(
      `SELECT
        COUNT(*) as total_auctions,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_auctions,
        COALESCE(SUM(total_revenue) FILTER (WHERE status = 'completed'), 0) as total_revenue,
        COALESCE(SUM(total_sold) FILTER (WHERE status = 'completed'), 0) as total_lots_sold,
        COALESCE(SUM(total_lots) FILTER (WHERE status = 'completed'), 0) as total_lots_offered
      FROM auctions`
    );

    // Item-level stats
    const itemStats = await query(
      `SELECT
        COUNT(*) as total_items,
        COUNT(*) FILTER (WHERE status = 'sold') as items_sold,
        COUNT(*) FILTER (WHERE status = 'cataloged') as items_cataloged,
        COALESCE(AVG(hammer_price) FILTER (WHERE hammer_price IS NOT NULL), 0) as average_hammer_price,
        COALESCE(MAX(hammer_price), 0) as highest_hammer_price,
        COALESCE(SUM(hammer_price) FILTER (WHERE hammer_price IS NOT NULL), 0) as total_hammer_value
      FROM items`
    );

    // Revenue by category
    const categoryStats = await query(
      `SELECT category, COUNT(*) as items_count,
        COALESCE(SUM(hammer_price), 0) as category_revenue,
        COALESCE(AVG(hammer_price) FILTER (WHERE hammer_price IS NOT NULL), 0) as avg_price
      FROM items
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY category_revenue DESC`
    );

    // Invoice stats
    const invoiceStats = await query(
      `SELECT
        COUNT(*) as total_invoices,
        COUNT(*) FILTER (WHERE status = 'paid') as paid_invoices,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_invoices,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue_invoices,
        COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0) as total_collected,
        COALESCE(SUM(total) FILTER (WHERE status = 'pending' OR status = 'overdue'), 0) as total_outstanding
      FROM invoices`
    );

    const revenue = revenueResult.rows[0];
    const items = itemStats.rows[0];
    const sellThroughRate = revenue.total_lots_offered > 0
      ? ((revenue.total_lots_sold / revenue.total_lots_offered) * 100).toFixed(1)
      : 0;

    res.json({
      overview: {
        total_revenue: parseFloat(revenue.total_revenue),
        total_auctions: parseInt(revenue.total_auctions),
        completed_auctions: parseInt(revenue.completed_auctions),
        sell_through_rate: parseFloat(sellThroughRate),
        total_lots_sold: parseInt(revenue.total_lots_sold),
        total_lots_offered: parseInt(revenue.total_lots_offered),
      },
      items: {
        total_items: parseInt(items.total_items),
        items_sold: parseInt(items.items_sold),
        items_cataloged: parseInt(items.items_cataloged),
        average_hammer_price: parseFloat(items.average_hammer_price),
        highest_hammer_price: parseFloat(items.highest_hammer_price),
        total_hammer_value: parseFloat(items.total_hammer_value),
      },
      categories: categoryStats.rows,
      invoices: invoiceStats.rows[0],
    });
  } catch (err) {
    console.error('Financial report error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /consignor-settlements
router.get('/consignor-settlements', async (req, res) => {
  try {
    const result = await query(
      `SELECT
        c.id,
        c.name,
        c.email,
        c.commission_rate,
        COUNT(i.id) as total_items,
        COUNT(i.id) FILTER (WHERE i.status = 'sold') as items_sold,
        COALESCE(SUM(i.hammer_price) FILTER (WHERE i.status = 'sold'), 0) as total_sales,
        COALESCE(SUM(i.hammer_price * c.commission_rate / 100) FILTER (WHERE i.status = 'sold'), 0) as commission_earned,
        COALESCE(SUM(i.hammer_price) FILTER (WHERE i.status = 'sold'), 0) - COALESCE(SUM(i.hammer_price * c.commission_rate / 100) FILTER (WHERE i.status = 'sold'), 0) as amount_due_to_consignor
      FROM consignors c
      LEFT JOIN items i ON i.consignor_id = c.id
      GROUP BY c.id, c.name, c.email, c.commission_rate
      ORDER BY total_sales DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Consignor settlements error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
