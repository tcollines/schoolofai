import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkDBConnection } from './db';
import { logger } from './logger';

// Import Route Handlers
import coursesRouter from './routes/courses';
import authRouter from './routes/auth';
import enrollmentsRouter from './routes/enrollments';
import eventsRouter from './routes/events';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS & JSON Parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logger middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
});

// Register API Routes
app.use('/api/courses', coursesRouter);
app.use('/api/auth', authRouter);
app.use('/api/enrollments', enrollmentsRouter);
app.use('/api', eventsRouter); // maps /api/events, /api/mails, /api/instructors

// Root health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'School of AI backend is running smoothly.' });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(`Unhandle Exception: ${err.message || err}`);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Check database connection, then start server
const startServer = async () => {
    await checkDBConnection();
    
    try {
        const { pool } = require('./db');
        // Restore Abraham Chemayek as ADMIN and clear profile picture
        await pool.query("UPDATE profiles SET role = 'ADMIN', avatar_url = '' WHERE email = 'chemayekabraham289@gmail.com'");
        // Delete all mock profiles (any profile except the master admin)
        await pool.query("DELETE FROM profiles WHERE email != 'chemayekabraham289@gmail.com'");
        logger.info('Database startup updates executed successfully (restored admin role and purged all other profiles).');
    } catch (dbErr: any) {
        logger.error(`Database startup updates error: ${dbErr.message}`);
    }

    app.listen(PORT, () => {
        logger.info(`Backend server is listening at http://localhost:${PORT}`);
    });
};

startServer().catch((err) => {
    logger.error(`Critical error starting server: ${err.message}`);
    process.exit(1);
});
