require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/consignors', require('./routes/consignors'));
app.use('/api/items', require('./routes/items'));
app.use('/api/auctions', require('./routes/auctions'));
app.use('/api/bidders', require('./routes/bidders'));
app.use('/api/live-auctions', require('./routes/liveAuctions'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/shipping', require('./routes/shipping'));
app.use('/api/conditions', require('./routes/conditions'));
app.use('/api/storage', require('./routes/storage'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/photography', require('./routes/photography'));
app.use('/api/catalog', require('./routes/catalog'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/unsold-lots', require('./routes/unsoldLots'));
app.use('/api/appraisals', require('./routes/appraisals'));
app.use('/api/estates', require('./routes/estates'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Auction House backend running on port ${PORT}`);
});

module.exports = app;
