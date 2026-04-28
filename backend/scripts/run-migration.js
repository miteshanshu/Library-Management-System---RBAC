const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

const migrate = async () => {
    try {
        const sqlPath = path.join(__dirname, '../../db/schema/03_modern_features.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration...');
        await pool.query(sql);
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
