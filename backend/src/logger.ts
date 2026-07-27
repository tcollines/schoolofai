import winston from 'winston';
import { Pool } from 'mysql2/promise';

const { combine, timestamp, printf, colorize } = winston.format;

// Standard log format
const logFormat = printf(({ level, message, timestamp }) => {
    return `[${timestamp}] ${level}: ${message}`;
});

// Main logger
export const logger = winston.createLogger({
    level: 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        new winston.transports.Console({
            format: combine(
                colorize(),
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                logFormat
            )
        })
    ]
});

// Audit logger that also saves to the MySQL audit_logs table
export const auditLog = async (
    pool: Pool,
    action: string,
    userEmail: string | null,
    details: string
) => {
    const message = `AUDIT: [Action: ${action}] [User: ${userEmail || 'System'}] - ${details}`;
    logger.info(message);

    try {
        await pool.query(
            'INSERT INTO audit_logs (action, user_email, details) VALUES (?, ?, ?)',
            [action, userEmail, details]
        );
    } catch (err) {
        logger.error(`Failed to write to audit_logs table: ${(err as Error).message}`);
    }
};
