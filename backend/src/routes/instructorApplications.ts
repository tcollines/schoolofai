import { Router, Response } from 'express';
import { pool } from '../db';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { sendInstructorApplicationEmail, sendInstructorStatusEmail } from '../services/email';
import { logger, auditLog } from '../logger';

const router = Router();

// 1. Submit application
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { email, username, courses, passportPhoto, nationalId } = req.body;
        if (!email || !username || !courses || !passportPhoto || !nationalId) {
            return res.status(400).json({ error: 'All fields (email, username, courses, passportPhoto, nationalId) are required.' });
        }

        // Insert into database
        await pool.query(
            'INSERT INTO instructor_applications (email, username, courses, passport_photo, national_id) VALUES (?, ?, ?, ?, ?)',
            [email, username, courses, passportPhoto, nationalId]
        );

        // Send applicant SMTP mail alerting them that Welile School of AI has received their application
        await sendInstructorApplicationEmail(email, username);

        // Also reflect it on the admin's subdomain/mails.
        // We do this by inserting an Inquiry mail into the database mails table.
        const adminEmail = 'chemayekabraham289@gmail.com';
        const mailBody = JSON.stringify({
            name: `Instructor Request: ${username}`,
            email: email,
            company_name: `Courses: ${courses}`,
            message: `Instructor application submitted.\n\nUsername: ${username}\nEmail: ${email}\nCourses to teach: ${courses}\n\nReview files in the Instructor Requests tab.`,
            type: 'INQUIRY'
        });
        await pool.query(
            'INSERT INTO mails (sender_email, recipient_email, subject, body) VALUES (?, ?, ?, ?)',
            ['applications@schoolofai.com', adminEmail, 'INQUIRY', mailBody]
        );

        await auditLog(pool, 'SUBMIT_INSTRUCTOR_APPLICATION', req.user?.email || null, `User ${username} (${email}) applied for instructor rights.`);

        return res.status(201).json({ message: 'Application submitted successfully.' });
    } catch (err: any) {
        logger.error(`Error in submit application: ${err.message}`);
        return res.status(500).json({ error: 'Failed to submit application.' });
    }
});

// 2. Get all applications (admin only)
router.get('/', requireAuth, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const [rows]: any = await pool.query('SELECT * FROM instructor_applications ORDER BY created_at DESC');
        return res.json(rows);
    } catch (err: any) {
        logger.error(`Error fetching applications: ${err.message}`);
        return res.status(500).json({ error: 'Failed to fetch applications.' });
    }
});

// 3. Approve application (admin only)
router.post('/:id/approve', requireAuth, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const [apps]: any = await pool.query('SELECT * FROM instructor_applications WHERE id = ?', [id]);
        if (apps.length === 0) {
            return res.status(404).json({ error: 'Application not found.' });
        }

        const app = apps[0];
        if (app.status !== 'PENDING') {
            return res.status(400).json({ error: 'Application has already been processed.' });
        }

        // Update application status
        await pool.query('UPDATE instructor_applications SET status = "APPROVED" WHERE id = ?', [id]);

        // Update profile role in profiles table to INSTRUCTOR
        await pool.query('UPDATE profiles SET role = "INSTRUCTOR" WHERE email = ?', [app.email]);

        // Trigger email notification
        await sendInstructorStatusEmail(app.email, app.username, true);

        await auditLog(pool, 'APPROVE_INSTRUCTOR_APPLICATION', req.user?.email || null, `Approved instructor application for ${app.username} (${app.email})`);

        return res.json({ message: 'Application approved successfully.' });
    } catch (err: any) {
        logger.error(`Error approving application: ${err.message}`);
        return res.status(500).json({ error: 'Failed to approve application.' });
    }
});

// 4. Reject application (admin only)
router.post('/:id/reject', requireAuth, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const [apps]: any = await pool.query('SELECT * FROM instructor_applications WHERE id = ?', [id]);
        if (apps.length === 0) {
            return res.status(404).json({ error: 'Application not found.' });
        }

        const app = apps[0];
        if (app.status !== 'PENDING') {
            return res.status(400).json({ error: 'Application has already been processed.' });
        }

        // Update application status
        await pool.query('UPDATE instructor_applications SET status = "REJECTED" WHERE id = ?', [id]);

        // Trigger email notification
        await sendInstructorStatusEmail(app.email, app.username, false);

        await auditLog(pool, 'REJECT_INSTRUCTOR_APPLICATION', req.user?.email || null, `Rejected instructor application for ${app.username} (${app.email})`);

        return res.json({ message: 'Application rejected successfully.' });
    } catch (err: any) {
        logger.error(`Error rejecting application: ${err.message}`);
        return res.status(500).json({ error: 'Failed to reject application.' });
    }
});

export default router;
