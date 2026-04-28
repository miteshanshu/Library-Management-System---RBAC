const pool = require('../src/config/db');
const env = require('../src/config/env');

async function migrate() {
    try {
        console.log('Connecting to database...');
        // The pool connects automatically on query

        console.log(`Adding created_by column to ${env.DB_SCHEMA}.book_copies...`);

        await pool.query(`
            ALTER TABLE ${env.DB_SCHEMA}.book_copies 
            ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES ${env.DB_SCHEMA}.users(user_id);
        `);

        console.log('Successfully added created_by column.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
