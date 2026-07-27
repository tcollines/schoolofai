import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function run() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'school_of_ai'
    });

    try {
        const [rows]: any = await connection.query('SELECT id, full_name, email, role FROM profiles');
        console.log('ACCOUNTS_IN_DB:');
        console.log(JSON.stringify(rows));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

run();
