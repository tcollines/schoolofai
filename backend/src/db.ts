import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

dotenv.config();

// Create connection to run CREATE DATABASE if not exists
const getAdminConnection = async () => {
    return mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });
};

// Create main connection pool
export const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_of_ai',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true // Enable running multiple queries from schema.sql in one go
});

// Test connection and auto-initialize schema if empty
export const checkDBConnection = async () => {
    const dbName = process.env.DB_NAME || 'school_of_ai';
    try {
        // 1. Create database if it doesn't exist
        const adminConn = await getAdminConnection();
        await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        await adminConn.end();

        // 2. Verify connection to the pool
        const connection = await pool.getConnection();
        logger.info(`Successfully connected to MySQL database: ${dbName}`);

        // 3. Auto-seed if tables are missing
        const [tables]: any = await connection.query('SHOW TABLES LIKE "profiles"');
        if (tables.length === 0) {
            logger.info('Database tables missing. Initializing schema and seeding default records...');
            const schemaPath = path.resolve(__dirname, '../schema.sql');
            if (fs.existsSync(schemaPath)) {
                const sql = fs.readFileSync(schemaPath, 'utf8');
                await connection.query(sql);
                logger.info('Database schema and seed data initialized successfully.');
            } else {
                logger.warn(`schema.sql not found at path: ${schemaPath}`);
            }
        }

        // 4. Auto-migrate missing columns
        const [columns]: any = await connection.query('SHOW COLUMNS FROM profiles');
        const columnNames = columns.map((c: any) => c.Field);
        
        if (!columnNames.includes('nationality')) {
            logger.info('Migrating: Adding nationality column to profiles table...');
            await connection.query('ALTER TABLE profiles ADD COLUMN nationality VARCHAR(100) NULL');
        }
        if (!columnNames.includes('date_of_birth')) {
            logger.info('Migrating: Adding date_of_birth column to profiles table...');
            await connection.query('ALTER TABLE profiles ADD COLUMN date_of_birth DATE NULL');
        }
        if (!columnNames.includes('avatar_scale')) {
            logger.info('Migrating: Adding avatar_scale column to profiles table...');
            await connection.query('ALTER TABLE profiles ADD COLUMN avatar_scale DECIMAL(5, 2) DEFAULT 1.00');
        }
        if (!columnNames.includes('avatar_pos_x')) {
            logger.info('Migrating: Adding avatar_pos_x column to profiles table...');
            await connection.query('ALTER TABLE profiles ADD COLUMN avatar_pos_x INT DEFAULT 0');
        }
        if (!columnNames.includes('avatar_pos_y')) {
            logger.info('Migrating: Adding avatar_pos_y column to profiles table...');
            await connection.query('ALTER TABLE profiles ADD COLUMN avatar_pos_y INT DEFAULT 0');
        }

        // Upgrade avatar_url to MEDIUMTEXT if it's currently TEXT
        const [avatarUrlColumn]: any = await connection.query(
            "SHOW COLUMNS FROM profiles LIKE 'avatar_url'"
        );
        if (avatarUrlColumn.length > 0 && avatarUrlColumn[0].Type.toLowerCase() === 'text') {
            logger.info('Migrating: Upgrading avatar_url column in profiles table to MEDIUMTEXT...');
            await connection.query('ALTER TABLE profiles MODIFY COLUMN avatar_url MEDIUMTEXT');
        }

        // Upgrade role column to support all enum values: ADMIN, INSTRUCTOR, PRO, INDIVIDUAL, PLUS, SPONSORED
        const [roleColumn]: any = await connection.query("SHOW COLUMNS FROM profiles LIKE 'role'");
        if (roleColumn.length > 0) {
            const typeStr = roleColumn[0].Type;
            if (!typeStr.includes('PLUS') || !typeStr.includes('SPONSORED')) {
                logger.info('Migrating: Modifying role column in profiles table to support all new subscription roles...');
                await connection.query("ALTER TABLE profiles MODIFY COLUMN role ENUM('ADMIN', 'INSTRUCTOR', 'PRO', 'INDIVIDUAL', 'PLUS', 'SPONSORED') DEFAULT 'INDIVIDUAL'");
            }
        }

        // Seeding of default mock accounts has been disabled to prevent them from re-appearing.
        // Seeding of default instructor Abraham Chemayek has been disabled so they only start afresh when initialized by the Admin.
        
        // Ensure master admin has ADMIN role
        await connection.query("UPDATE profiles SET role = 'ADMIN' WHERE email = 'chemayekabraham289@gmail.com'");

        connection.release();
    } catch (error) {
        logger.error('Database connection failed:', error);
        logger.error(`Please verify that XAMPP/MySQL is running on port ${process.env.DB_PORT || '3306'}.`);
        process.exit(1);
    }
};
