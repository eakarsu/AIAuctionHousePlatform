const express = require('express');
const PDFDocument = require('pdfkit');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// GET /api/custom-views/bid-timeline
// Live bids over time for a selected lot
// query: ?itemId=ID  (optional; defaults to most-bid-on lot)
// ============================================================
router.get('/bid-timeline', authenticateToken, async (req, res) => {
  try {
    let { itemId } = req.query;

    if (!itemId) {
      const top = await pool.query(
        `SELECT item_id, COUNT(*) AS c
           FROM live_bids
          WHERE item_id IS NOT NULL
          GROUP BY item_id
          ORDER BY c DESC
          LIMIT 1`
      );
      itemId = top.rows[0] ? top.rows[0].item_id : null;
    }

    if (!itemId) {
      return res.json({ itemId: null, item: null, bids: [], lots: [] });
    }

    const itemRes = await pool.query(
      `SELECT id, title, lot_number, estimate_low, estimate_high
         FROM items WHERE id = $1`,
      [itemId]
    );

    const bidsRes = await pool.query(
      `SELECT lb.id,
              lb.bid_amount,
              lb.bid_type,
              lb.is_winning,
              lb.created_at,
              b.name AS bidder_name,
              b.paddle_number
         FROM live_bids lb
         LEFT JOIN bidders b ON b.id = lb.bidder_id
        WHERE lb.item_id = $1
        ORDER BY lb.created_at ASC`,
      [itemId]
    );

    const lotsRes = await pool.query(
      `SELECT i.id, i.title, i.lot_number, COUNT(lb.id) AS bid_count
         FROM items i
         JOIN live_bids lb ON lb.item_id = i.id
        GROUP BY i.id, i.title, i.lot_number
        ORDER BY bid_count DESC
        LIMIT 30`
    );

    const bids = bidsRes.rows.map((r, idx) => ({
      id: r.id,
      sequence: idx + 1,
      timestamp: r.created_at,
      time_ms: r.created_at ? new Date(r.created_at).getTime() : 0,
      amount: parseFloat(r.bid_amount) || 0,
      bid_type: r.bid_type,
      is_winning: r.is_winning,
      bidder: r.bidder_name || 'Unknown',
      paddle: r.paddle_number || '-',
    }));

    res.json({
      itemId: Number(itemId),
      item: itemRes.rows[0] || null,
      bids,
      lots: lotsRes.rows.map((l) => ({
        id: l.id,
        title: l.title,
        lot_number: l.lot_number,
        bid_count: Number(l.bid_count),
      })),
    });
  } catch (err) {
    console.error('bid-timeline error:', err);
    res.status(500).json({ error: 'Failed to load bid timeline' });
  }
});

// ============================================================
// GET /api/custom-views/lot-values
// Top 20 lots by estimated value (uses estimate_high, fallback estimate_low)
// ============================================================
router.get('/lot-values', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id,
              title,
              lot_number,
              category,
              estimate_low,
              estimate_high,
              reserve_price,
              hammer_price,
              status
         FROM items
        WHERE estimate_high IS NOT NULL OR estimate_low IS NOT NULL
        ORDER BY COALESCE(estimate_high, estimate_low, 0) DESC
        LIMIT 20`
    );

    const lots = r.rows.map((it) => ({
      id: it.id,
      title: it.title,
      lot_number: it.lot_number,
      category: it.category,
      estimate_low: parseFloat(it.estimate_low) || 0,
      estimate_high: parseFloat(it.estimate_high) || 0,
      reserve_price: parseFloat(it.reserve_price) || 0,
      hammer_price: parseFloat(it.hammer_price) || 0,
      status: it.status,
      estimate_mid:
        (parseFloat(it.estimate_low) + parseFloat(it.estimate_high)) / 2 || 0,
    }));

    res.json({ lots });
  } catch (err) {
    console.error('lot-values error:', err);
    res.status(500).json({ error: 'Failed to load lot values' });
  }
});

// ============================================================
// GET /api/custom-views/auctions
// Helper: list of auctions for the catalog picker
// ============================================================
router.get('/auctions', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, title, auction_type, category, start_date, status
         FROM auctions ORDER BY start_date DESC NULLS LAST, id DESC`
    );
    res.json({ auctions: r.rows });
  } catch (err) {
    console.error('auctions list error:', err);
    res.status(500).json({ error: 'Failed to load auctions' });
  }
});

// ============================================================
// GET /api/custom-views/catalog-pdf?auctionId=ID
// Streams a PDF of the auction catalog (pdfkit)
// ============================================================
router.get('/catalog-pdf', authenticateToken, async (req, res) => {
  try {
    let { auctionId } = req.query;

    if (!auctionId) {
      const first = await pool.query(
        `SELECT id FROM auctions ORDER BY id LIMIT 1`
      );
      auctionId = first.rows[0] ? first.rows[0].id : null;
    }
    if (!auctionId) {
      return res.status(404).json({ error: 'No auctions available' });
    }

    const auctionRes = await pool.query(
      `SELECT * FROM auctions WHERE id = $1`,
      [auctionId]
    );
    const auction = auctionRes.rows[0];
    if (!auction) return res.status(404).json({ error: 'Auction not found' });

    // Pull items via live_bids linkage (lots that have been bid on in this auction)
    // and as fallback all items if none are linked.
    const linked = await pool.query(
      `SELECT DISTINCT i.id, i.lot_number, i.title, i.description,
              i.estimate_low, i.estimate_high, i.image_url
         FROM items i
         JOIN live_bids lb ON lb.item_id = i.id
        WHERE lb.auction_id = $1
        ORDER BY i.lot_number, i.id
        LIMIT 100`,
      [auctionId]
    );
    let lots = linked.rows;
    if (lots.length === 0) {
      const fallback = await pool.query(
        `SELECT id, lot_number, title, description,
                estimate_low, estimate_high, image_url
           FROM items
          ORDER BY id
          LIMIT 50`
      );
      lots = fallback.rows;
    }

    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="catalog_auction_${auctionId}.pdf"`
    );
    doc.pipe(res);

    // Cover
    doc.fontSize(22).fillColor('#222').text('AUCTION CATALOG', { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(16).fillColor('#444').text(auction.title || `Auction #${auctionId}`, {
      align: 'center',
    });
    doc.moveDown(0.4);
    doc
      .fontSize(11)
      .fillColor('#666')
      .text(
        `Type: ${auction.auction_type || '-'}    Category: ${
          auction.category || '-'
        }    Status: ${auction.status || '-'}`,
        { align: 'center' }
      );
    if (auction.start_date) {
      doc.text(
        `Start: ${new Date(auction.start_date).toISOString().slice(0, 10)}`,
        { align: 'center' }
      );
    }
    doc.moveDown(1);
    doc
      .strokeColor('#888')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(562, doc.y)
      .stroke();
    doc.moveDown(0.6);

    if (lots.length === 0) {
      doc.fontSize(12).fillColor('#900').text('No lots available for this auction.');
    }

    lots.forEach((lot, idx) => {
      if (doc.y > 680) doc.addPage();

      const top = doc.y;
      // Image placeholder
      doc
        .rect(50, top, 80, 80)
        .strokeColor('#ccc')
        .lineWidth(1)
        .stroke();
      doc
        .fontSize(8)
        .fillColor('#999')
        .text('IMAGE', 50, top + 36, { width: 80, align: 'center' });

      // Text block
      const textX = 145;
      const textW = 410;
      doc
        .fontSize(13)
        .fillColor('#111')
        .text(
          `Lot ${lot.lot_number || idx + 1}: ${lot.title || 'Untitled'}`,
          textX,
          top,
          { width: textW }
        );
      const desc =
        (lot.description || '').slice(0, 220) +
        ((lot.description || '').length > 220 ? '...' : '');
      doc
        .fontSize(10)
        .fillColor('#444')
        .text(desc || 'No description provided.', textX, doc.y + 2, {
          width: textW,
        });
      const lo = lot.estimate_low ? `$${Number(lot.estimate_low).toLocaleString()}` : '-';
      const hi = lot.estimate_high ? `$${Number(lot.estimate_high).toLocaleString()}` : '-';
      doc
        .fontSize(10)
        .fillColor('#0a4')
        .text(`Estimate: ${lo} – ${hi}`, textX, doc.y + 4, { width: textW });

      const after = Math.max(doc.y + 8, top + 90);
      doc.y = after;
      doc
        .strokeColor('#eee')
        .lineWidth(0.5)
        .moveTo(50, doc.y)
        .lineTo(562, doc.y)
        .stroke();
      doc.moveDown(0.4);
    });

    doc.end();
  } catch (err) {
    console.error('catalog-pdf error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate catalog PDF' });
    }
  }
});

// ============================================================
// POST /api/custom-views/consignment
// Multi-step consignment wizard submission. Creates a consignor (if new)
// and an item with the supplied lot details + estimate, plus stores
// the terms acceptance in notes.
// body: {
//   consignor: { name, email, phone, address, commission_rate },
//   lot:       { title, description, category, dimensions, medium, condition },
//   estimate:  { estimate_low, estimate_high, reserve_price },
//   terms:     { accepted: boolean, signed_name }
// }
// ============================================================
router.post('/consignment', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { consignor = {}, lot = {}, estimate = {}, terms = {} } = req.body || {};

    if (!consignor.name) {
      return res.status(400).json({ error: 'Consignor name required' });
    }
    if (!lot.title) {
      return res.status(400).json({ error: 'Lot title required' });
    }
    if (!terms.accepted) {
      return res.status(400).json({ error: 'Terms must be accepted' });
    }

    await client.query('BEGIN');

    // Reuse consignor by email if present, else create
    let consignorId = null;
    if (consignor.email) {
      const ex = await client.query(
        `SELECT id FROM consignors WHERE email = $1 LIMIT 1`,
        [consignor.email]
      );
      if (ex.rows[0]) consignorId = ex.rows[0].id;
    }
    if (!consignorId) {
      const ins = await client.query(
        `INSERT INTO consignors (name, email, phone, address, commission_rate, contract_status, notes)
         VALUES ($1, $2, $3, $4, $5, 'active', $6) RETURNING id`,
        [
          consignor.name,
          consignor.email || null,
          consignor.phone || null,
          consignor.address || null,
          consignor.commission_rate || 15.0,
          `Consigned via wizard on ${new Date().toISOString()}`,
        ]
      );
      consignorId = ins.rows[0].id;
    }

    // Generate a lot number
    const lotNumber =
      lot.lot_number ||
      `W-${Date.now().toString().slice(-6)}`;

    const itemIns = await client.query(
      `INSERT INTO items
         (title, description, category, consignor_id, lot_number, dimensions, medium,
          condition, reserve_price, estimate_low, estimate_high, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'cataloged')
       RETURNING id, title, lot_number, estimate_low, estimate_high`,
      [
        lot.title,
        lot.description || null,
        lot.category || null,
        consignorId,
        lotNumber,
        lot.dimensions || null,
        lot.medium || null,
        lot.condition || null,
        estimate.reserve_price || null,
        estimate.estimate_low || null,
        estimate.estimate_high || null,
      ]
    );

    await client.query(
      `UPDATE consignors SET total_consigned = COALESCE(total_consigned, 0) + 1 WHERE id = $1`,
      [consignorId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      consignor_id: consignorId,
      item: itemIns.rows[0],
      terms: {
        accepted: true,
        signed_name: terms.signed_name || consignor.name,
        accepted_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('consignment error:', err);
    res.status(500).json({ error: 'Failed to create consignment' });
  } finally {
    client.release();
  }
});

module.exports = router;
