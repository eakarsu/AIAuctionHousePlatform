require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

async function main() {
  const email = String(process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.SEED_ADMIN_PASSWORD || '');
  if (!email || password.length < 12) throw new Error('SEED_ADMIN_EMAIL and a password of at least 12 characters are required');
  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users(email,password,name,role) VALUES($1,$2,$3,'admin')
     ON CONFLICT(email) DO UPDATE SET password=EXCLUDED.password,name=EXCLUDED.name,role='admin'`,
    [email, passwordHash, 'Runtime Administrator'],
  );
  console.log('administrator provisioned');
  await pool.end();
}

main().catch((error) => { console.error(error.message); process.exit(1); });
