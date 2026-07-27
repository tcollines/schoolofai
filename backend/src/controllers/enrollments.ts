import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { pool } from '../db';
import { logger, auditLog } from '../logger';

export class EnrollmentsController {
    // 1. Get raw user enrollments (with snake_case fields for frontend mapping compatibility)
    static async getByUserId(req: AuthenticatedRequest, res: Response) {
        try {
            const { userId } = req.query;
            if (!userId) {
                return res.status(400).json({ error: 'userId query parameter is required' });
            }

            const [rows]: any = await pool.query(
                'SELECT * FROM enrollments WHERE user_id = ?',
                [userId]
            );

            const enrollments = rows.map((e: any) => ({
                id: e.id,
                user_id: e.user_id,
                course_id: e.course_id,
                progress: e.progress,
                status: e.status,
                exam_completed: Boolean(e.exam_completed),
                exam_score: e.exam_score,
                quiz_score: e.quiz_score,
                final_score: e.final_score,
                exam_marks_released: Boolean(e.exam_marks_released),
                certificate_url: e.certificate_url,
                is_certificate_verified: Boolean(e.is_certificate_verified),
                enrolled_at: e.enrolled_at
            }));

            return res.json(enrollments);
        } catch (error) {
            logger.error(`EnrollmentsController.getByUserId error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to retrieve enrollments' });
        }
    }

    // 2. Enroll user in a course
    static async enroll(req: AuthenticatedRequest, res: Response) {
        try {
            const { userId, courseId, progress, status, exam_completed, exam_score, quiz_score, final_score, exam_marks_released, certificate_url, is_certificate_verified } = req.body;
            
            // Allow insert with custom properties or default to basic enrollment
            const uId = userId || req.body.user_id;
            const cId = courseId || req.body.course_id;

            if (!uId || !cId) {
                return res.status(400).json({ error: 'user_id and course_id are required' });
            }

            // Check if enrollment already exists
            const [existing]: any = await pool.query(
                'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?',
                [uId, cId]
            );

            if (existing.length > 0) {
                // If it already exists, perform an update instead (for upsert support)
                req.body.userId = uId;
                req.body.courseId = cId;
                return EnrollmentsController.updateProgress(req, res);
            }

            await pool.query(
                `INSERT INTO enrollments (
                    user_id, course_id, progress, status, exam_completed, 
                    exam_score, quiz_score, final_score, exam_marks_released, 
                    certificate_url, is_certificate_verified
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    uId, 
                    cId, 
                    progress !== undefined ? progress : 0,
                    status || 'NOT_STARTED',
                    exam_completed !== undefined ? exam_completed : false,
                    exam_score !== undefined ? exam_score : null,
                    quiz_score !== undefined ? quiz_score : null,
                    final_score !== undefined ? final_score : null,
                    exam_marks_released !== undefined ? exam_marks_released : false,
                    certificate_url || null,
                    is_certificate_verified !== undefined ? is_certificate_verified : false
                ]
            );

            await auditLog(pool, 'COURSE_ENROLL', req.user?.email || null, `User ${uId} enrolled in course ${cId}`);
            return res.status(201).json({ message: 'Enrolled successfully' });
        } catch (error) {
            logger.error(`EnrollmentsController.enroll error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to enroll in course' });
        }
    }

    // 3. Update enrollment progress & scores dynamically (handles any passed fields)
    static async updateProgress(req: AuthenticatedRequest, res: Response) {
        try {
            const uId = req.body.userId || req.body.user_id;
            const cId = req.body.courseId || req.body.course_id;

            if (!uId || !cId) {
                return res.status(400).json({ error: 'userId and courseId are required' });
            }

            const updatableFields = [
                'progress', 'status', 'exam_completed', 'exam_score', 
                'quiz_score', 'final_score', 'exam_marks_released', 
                'certificate_url', 'is_certificate_verified'
            ];

            let query = 'UPDATE enrollments SET ';
            const updates: string[] = [];
            const params: any[] = [];

            updatableFields.forEach(field => {
                const bodyVal = req.body[field];
                if (bodyVal !== undefined) {
                    updates.push(`${field} = ?`);
                    params.push(bodyVal);
                }
            });

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }

            query += updates.join(', ') + ' WHERE user_id = ? AND course_id = ?';
            params.push(uId, cId);

            const [result]: any = await pool.query(query, params);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Enrollment record not found' });
            }

            return res.json({ message: 'Enrollment updated successfully' });
        } catch (error) {
            logger.error(`EnrollmentsController.updateProgress error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to update enrollment' });
        }
    }
}
