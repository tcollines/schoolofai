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
import attendanceRouter from './routes/attendance';

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
app.use('/api/attendance', attendanceRouter);
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
        
        // Seed mock students from mockup
        await pool.query(`
            INSERT INTO profiles (id, full_name, email, role, password, date_of_birth, nationality) VALUES
            ('student-dianne', 'Dianne Russell', 'dianne.r@example.com', 'INDIVIDUAL', 'password123', '2004-05-15', 'United States'),
            ('student-theresa', 'Theresa Webb', 'theresa.w@example.com', 'INDIVIDUAL', 'password123', '2004-04-10', 'United Kingdom'),
            ('student-cody', 'Cody Fisher', 'cody.f@example.com', 'INDIVIDUAL', 'password123', '2005-11-22', 'Canada'),
            ('student-jane', 'Jane Cooper', 'jane.c@example.com', 'INDIVIDUAL', 'password123', '2003-02-12', 'Australia')
            ON DUPLICATE KEY UPDATE id=id
        `);

        // Seed enrollments for the mock students
        await pool.query(`
            INSERT IGNORE INTO enrollments (user_id, course_id, status, progress) VALUES
            ('student-dianne', '5', 'IN_PROGRESS', 25),
            ('student-theresa', '5', 'IN_PROGRESS', 50),
            ('student-cody', '5', 'IN_PROGRESS', 75),
            ('student-jane', '5', 'IN_PROGRESS', 10),
            ('student-dianne', '6', 'IN_PROGRESS', 0),
            ('student-theresa', '6', 'IN_PROGRESS', 10),
            ('student-cody', '6', 'IN_PROGRESS', 40),
            ('student-jane', '6', 'IN_PROGRESS', 90)
        `);

        // Seed 7 days of mock attendance
        const [attendanceCheck]: any = await pool.query('SELECT COUNT(*) as count FROM attendance');
        if (attendanceCheck[0].count === 0) {
            const studentIds = ['student-dianne', 'student-theresa', 'student-cody', 'student-jane'];
            const courseIds = ['5', '6'];
            const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'LATE'];
            
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                for (const studentId of studentIds) {
                    for (const courseId of courseIds) {
                        const status = statuses[Math.floor(Math.random() * statuses.length)];
                        await pool.query(
                            'INSERT IGNORE INTO attendance (user_id, course_id, status, date) VALUES (?, ?, ?, ?)',
                            [studentId, courseId, status, dateStr]
                        );
                    }
                }
            }
        }

        logger.info('Database startup updates executed successfully (restored admin role, seeded mock students, enrollments, and attendance logs).');
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
