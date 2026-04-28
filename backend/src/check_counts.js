const pool = require('./config/db');
const env = require('./config/env');
require('dotenv').config();

const checkCounts = async () => {
    try {
        const membersRes = await pool.query(`SELECT COUNT(*) FROM ${env.DB_SCHEMA}.members`);
        const usersRes = await pool.query(`SELECT COUNT(*) FROM ${env.DB_SCHEMA}.users`);

        console.log(`Members Count: ${membersRes.rows[0].count}`);
        console.log(`Users Count: ${usersRes.rows[0].count}`);
    } catch (err) {
        console.error("Error checking DB:", err);
    } finally {
        pool.end();
    }
};

checkCounts();
