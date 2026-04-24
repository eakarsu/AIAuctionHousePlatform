const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://auction_user:auction_pass@localhost:5432/auction_house',
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
