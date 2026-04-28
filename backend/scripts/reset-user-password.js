require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Client } = require('pg');

const schema = process.env.DB_SCHEMA || 'library_app';
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('Usage: node scripts/reset-user-password.js <email> <new-password>');
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error('New password must be at least 6 characters.');
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await client.connect();

  try {
    const result = await client.query(
      `UPDATE ${schema}.users
       SET password_hash = crypt($1, gen_salt('bf')),
           updated_at = CURRENT_TIMESTAMP
       WHERE LOWER(email) = LOWER($2)
       RETURNING user_id, email, role, is_demo, is_active`,
      [newPassword, email]
    );

    if (result.rows.length === 0) {
      throw new Error(`User not found for email ${email}`);
    }

    console.log(`Password reset successfully for ${result.rows[0].email}`);
  } finally {
    await client.end();
  }
})().catch((err) => {
  console.error(err.stack || err.message || err);
  process.exit(1);
});
