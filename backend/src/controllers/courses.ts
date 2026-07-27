import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { pool } from '../db';
import { courseSchema } from '../schemas/course';
import { logger, auditLog } from '../logger';

export class CoursesController {
    // 1. Get all courses
    static async getAll(req: AuthenticatedRequest, res: Response) {
        try {
            const { category, instructorEmail, status } = req.query;
            let query = 'SELECT * FROM courses WHERE 1=1';
            const params: any[] = [];

            if (category) {
                query += ' AND category = ?';
                params.push(category);
            }
            if (instructorEmail) {
                query += ' AND instructor_email = ?';
                params.push(instructorEmail);
            }
            if (status) {
                query += ' AND status = ?';
                params.push(status);
            }

            const [rows]: any = await pool.query(query, params);
            
            // Map table column names (snake_case) to frontend models (camelCase)
            const courses = rows.map((c: any) => ({
                id: c.id,
                title: c.title,
                instructor: c.instructor,
                instructorEmail: c.instructor_email,
                instructorAvatar: c.instructor_avatar,
                duration: c.duration,
                category: c.category,
                rating: Number(c.rating || 0),
                imageUrl: c.image_url,
                image: c.image_url, // For compatibility
                price: Number(c.price || 0),
                accessTier: c.access_tier,
                status: c.status,
                isVerified: Boolean(c.is_verified),
                description: c.description,
                outcomes: typeof c.outcomes === 'string' ? JSON.parse(c.outcomes) : c.outcomes,
                sections: typeof c.sections === 'string' ? JSON.parse(c.sections) : c.sections,
                platform: c.platform || 'Welile',
                imageScale: Number(c.image_scale || 1),
                imagePositionX: Number(c.image_pos_x || 50),
                imagePositionY: Number(c.image_pos_y || 50)
            }));

            return res.json(courses);
        } catch (error) {
            logger.error(`CoursesController.getAll error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to fetch courses' });
        }
    }

    // 2. Get course by ID
    static async getById(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const [rows]: any = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Course not found' });
            }

            const c = rows[0];
            const course = {
                id: c.id,
                title: c.title,
                instructor: c.instructor,
                instructorEmail: c.instructor_email,
                instructorAvatar: c.instructor_avatar,
                duration: c.duration,
                category: c.category,
                rating: Number(c.rating || 0),
                imageUrl: c.image_url,
                image: c.image_url,
                price: Number(c.price || 0),
                accessTier: c.access_tier,
                status: c.status,
                isVerified: Boolean(c.is_verified),
                description: c.description,
                outcomes: typeof c.outcomes === 'string' ? JSON.parse(c.outcomes) : c.outcomes,
                sections: typeof c.sections === 'string' ? JSON.parse(c.sections) : c.sections,
                platform: c.platform || 'Welile',
                imageScale: Number(c.image_scale || 1),
                imagePositionX: Number(c.image_pos_x || 50),
                imagePositionY: Number(c.image_pos_y || 50)
            };

            return res.json(course);
        } catch (error) {
            logger.error(`CoursesController.getById error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to fetch course details' });
        }
    }

    // 3. Create or save course
    static async create(req: AuthenticatedRequest, res: Response) {
        try {
            const validated = courseSchema.parse(req.body);
            const courseId = validated.id || Math.random().toString(36).substring(7);

            const outcomesJSON = JSON.stringify(validated.outcomes);
            const sectionsJSON = JSON.stringify(validated.sections);

            await pool.query(
                `INSERT INTO courses (id, title, instructor, instructor_email, instructor_avatar, duration, category, rating, image_url, price, access_tier, status, is_verified, description, outcomes, sections, image_scale, image_pos_x, image_pos_y) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    courseId,
                    validated.title,
                    validated.instructor,
                    validated.instructorEmail,
                    validated.instructorAvatar || '',
                    validated.duration,
                    validated.category,
                    validated.rating || 5.0,
                    validated.image || '',
                    validated.price,
                    validated.accessTier,
                    validated.status,
                    validated.isVerified || false,
                    validated.description || '',
                    outcomesJSON,
                    sectionsJSON,
                    validated.imageScale,
                    validated.imagePositionX,
                    validated.imagePositionY
                ]
            );

            await auditLog(pool, 'CREATE_COURSE', req.user?.email || null, `Created course: ${validated.title} (${courseId})`);
            return res.status(201).json({ id: courseId, ...validated });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
            }
            logger.error(`CoursesController.create error: ${error.message}`);
            return res.status(500).json({ error: 'Failed to create course' });
        }
    }

    // 4. Update course
    static async update(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const validated = courseSchema.parse(req.body);

            // Check if course exists
            const [existing]: any = await pool.query('SELECT title FROM courses WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: 'Course not found' });
            }

            const outcomesJSON = JSON.stringify(validated.outcomes);
            const sectionsJSON = JSON.stringify(validated.sections);

            await pool.query(
                `UPDATE courses SET 
                    title = ?, instructor = ?, instructor_email = ?, instructor_avatar = ?, 
                    duration = ?, category = ?, image_url = ?, price = ?, access_tier = ?, 
                    status = ?, is_verified = ?, description = ?, outcomes = ?, sections = ?, 
                    image_scale = ?, image_pos_x = ?, image_pos_y = ? 
                 WHERE id = ?`,
                [
                    validated.title,
                    validated.instructor,
                    validated.instructorEmail,
                    validated.instructorAvatar || '',
                    validated.duration,
                    validated.category,
                    validated.image || '',
                    validated.price,
                    validated.accessTier,
                    validated.status,
                    validated.isVerified || false,
                    validated.description || '',
                    outcomesJSON,
                    sectionsJSON,
                    validated.imageScale,
                    validated.imagePositionX,
                    validated.imagePositionY,
                    id
                ]
            );

            await auditLog(pool, 'UPDATE_COURSE', req.user?.email || null, `Updated course: ${validated.title} (${id})`);
            return res.json({ id, ...validated });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
            }
            logger.error(`CoursesController.update error: ${error.message}`);
            return res.status(500).json({ error: 'Failed to update course' });
        }
    }

    // 5. Delete course
    static async delete(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;

            const [existing]: any = await pool.query('SELECT title FROM courses WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: 'Course not found' });
            }

            await pool.query('DELETE FROM courses WHERE id = ?', [id]);

            await auditLog(pool, 'DELETE_COURSE', req.user?.email || null, `Deleted course: ${existing[0].title} (${id})`);
            return res.json({ message: 'Course deleted successfully' });
        } catch (error) {
            logger.error(`CoursesController.delete error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to delete course' });
        }
    }
}
