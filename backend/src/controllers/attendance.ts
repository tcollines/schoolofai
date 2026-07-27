import { Request, Response } from 'express';
import { pool } from '../db';
import { logger } from '../logger';

export class AttendanceController {
    static async getAttendance(req: Request, res: Response) {
        const { courseId, date, userId } = req.query;
        try {
            let query = `
                SELECT a.*, p.full_name as fullName, p.email 
                FROM attendance a
                JOIN profiles p ON a.user_id = p.id
                WHERE 1=1
            `;
            const params: any[] = [];
            if (courseId) {
                query += ' AND a.course_id = ?';
                params.push(courseId);
            }
            if (date) {
                query += ' AND a.date = ?';
                params.push(date);
            }
            if (userId) {
                query += ' AND a.user_id = ?';
                params.push(userId);
            }

            const [rows] = await pool.query(query, params);
            res.json(rows);
        } catch (err: any) {
            logger.error(`Error in getAttendance: ${(err as Error).message}`);
            res.status(500).json({ error: 'Failed to fetch attendance.' });
        }
    }

    static async upsertAttendance(req: Request, res: Response) {
        const { userId, courseId, status, date } = req.body;
        if (!userId || !courseId || !status || !date) {
            return res.status(400).json({ error: 'Missing required fields (userId, courseId, status, date).' });
        }

        try {
            const query = `
                INSERT INTO attendance (user_id, course_id, status, date)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE status = VALUES(status)
            `;
            await pool.query(query, [userId, courseId, status, date]);
            res.json({ success: true, message: 'Attendance status updated successfully.' });
        } catch (err: any) {
            logger.error(`Error in upsertAttendance: ${(err as Error).message}`);
            res.status(500).json({ error: 'Failed to update attendance.' });
        }
    }

    static async getStats(req: Request, res: Response) {
        const { courseId } = req.query;
        try {
            // Get counts for the last 7 days grouped by date
            let query = `
                SELECT date, 
                       SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present,
                       SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent,
                       SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) as late
                FROM attendance
                WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            `;
            const params: any[] = [];
            if (courseId) {
                query += ' AND course_id = ?';
                params.push(courseId);
            }
            query += ' GROUP BY date ORDER BY date ASC';

            const [rows]: any = await pool.query(query, params);
            
            // Format dates to day names (Mon, Tue, etc.) for easier charting
            const formatted = rows.map((r: any) => {
                const d = new Date(r.date);
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                return {
                    name: days[d.getDay()],
                    date: r.date.toString().split('T')[0] || r.date,
                    Present: Number(r.present),
                    Absent: Number(r.absent),
                    Late: Number(r.late)
                };
            });
            
            res.json(formatted);
        } catch (err: any) {
            logger.error(`Error in getStats: ${(err as Error).message}`);
            res.status(500).json({ error: 'Failed to fetch attendance stats.' });
        }
    }
}
