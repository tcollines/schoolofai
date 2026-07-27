import { Router, Response } from 'express';
import { pool } from '../db';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { sendInstructorApplicationEmail, sendInstructorStatusEmail } from '../services/email';
import { logger, auditLog } from '../logger';

const router = Router();

// 1. Submit application
router.post('/', async (req, res: Response) => {
    try {
        const { email, username, courses, passportPhoto, nationalId } = req.body;
        if (!email || !username || !courses || !passportPhoto || !nationalId) {
            return res.status(400).json({ error: 'All fields (email, username, courses, passportPhoto, nationalId) are required.' });
        }

        // Insert into database
        const [result]: any = await pool.query(
            'INSERT INTO instructor_applications (email, username, courses, passport_photo, national_id) VALUES (?, ?, ?, ?, ?)',
            [email, username, courses, passportPhoto, nationalId]
        );
        const applicationId = result.insertId;

        // Send applicant SMTP mail alerting them that Welile School of AI has received their application
        await sendInstructorApplicationEmail(email, username);

        // Also insert an APPLICATION mail into the database mails table with full payload (documents & status)
        const adminEmail = 'chemayekabraham289@gmail.com';
        const mailBody = JSON.stringify({
            applicationId: applicationId,
            name: username,
            email: email,
            courses: courses,
            passportPhoto: passportPhoto,
            nationalId: nationalId,
            message: `Instructor application submitted.\n\nUsername: ${username}\nEmail: ${email}\nCourses to teach: ${courses}`,
            type: 'APPLICATION',
            status: 'PENDING'
        });
        await pool.query(
            'INSERT INTO mails (sender_email, recipient_email, subject, body) VALUES (?, ?, ?, ?)',
            [email, adminEmail, 'APPLICATION', mailBody]
        );

        await auditLog(pool, 'SUBMIT_INSTRUCTOR_APPLICATION', email, `User ${username} (${email}) applied for instructor rights.`);

        return res.status(201).json({ message: 'Application submitted successfully.' });
    } catch (err: any) {
        logger.error(`Error in submit application: ${err.message}`);
        return res.status(500).json({ error: 'Failed to submit application.' });
    }
});

// 2. Get all applications
router.get('/', async (req, res: Response) => {
    try {
        const [rows]: any = await pool.query('SELECT * FROM instructor_applications ORDER BY created_at DESC');
        return res.json(rows);
    } catch (err: any) {
        logger.error(`Error fetching applications: ${err.message}`);
        return res.status(500).json({ error: 'Failed to fetch applications.' });
    }
});

// 3. Approve application
router.post('/:id/approve', async (req, res: Response) => {
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

        // Update profile role in profiles table to INSTRUCTOR if profile exists
        await pool.query('UPDATE profiles SET role = "INSTRUCTOR" WHERE email = ?', [app.email]);

        // Ensure record exists in instructors table so getInstructorStatus detects them for password setup
        const [existingInst]: any = await pool.query('SELECT id FROM instructors WHERE email = ?', [app.email]);
        if (existingInst.length === 0) {
            const instId = 'inst-' + Math.random().toString(36).substring(7);
            await pool.query(
                'INSERT INTO instructors (id, name, email, bio, avatar, passcode, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [instId, app.username, app.email, '', '', '', 'instructor']
            );
        } else {
            await pool.query('UPDATE instructors SET password = "instructor" WHERE email = ?', [app.email]);
        }

        // Synchronize state in mails table for the matching mail card
        const [mailRows]: any = await pool.query('SELECT id, body FROM mails');
        for (const m of mailRows) {
            try {
                const parsed = JSON.parse(m.body);
                if (parsed.applicationId == id || parsed.email === app.email) {
                    parsed.status = 'APPROVED';
                    await pool.query('UPDATE mails SET body = ? WHERE id = ?', [JSON.stringify(parsed), m.id]);
                }
            } catch (e) {}
        }

        // Trigger email notification with password setup link
        await sendInstructorStatusEmail(app.email, app.username, true);

        await auditLog(pool, 'APPROVE_INSTRUCTOR_APPLICATION', app.email, `Approved instructor application for ${app.username} (${app.email})`);

        return res.json({ message: 'Application approved successfully.' });
    } catch (err: any) {
        logger.error(`Error approving application: ${err.message}`);
        return res.status(500).json({ error: 'Failed to approve application.' });
    }
});

// 4. Reject application
router.post('/:id/reject', async (req, res: Response) => {
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

        // Synchronize state in mails table for the matching mail card
        const [mailRows]: any = await pool.query('SELECT id, body FROM mails');
        for (const m of mailRows) {
            try {
                const parsed = JSON.parse(m.body);
                if (parsed.applicationId == id || parsed.email === app.email) {
                    parsed.status = 'REJECTED';
                    await pool.query('UPDATE mails SET body = ? WHERE id = ?', [JSON.stringify(parsed), m.id]);
                }
            } catch (e) {}
        }

        // Trigger email notification
        await sendInstructorStatusEmail(app.email, app.username, false);

        await auditLog(pool, 'REJECT_INSTRUCTOR_APPLICATION', app.email, `Rejected instructor application for ${app.username} (${app.email})`);

        return res.json({ message: 'Application rejected successfully.' });
    } catch (err: any) {
        logger.error(`Error rejecting application: ${err.message}`);
        return res.status(500).json({ error: 'Failed to reject application.' });
    }
});

export default router;
