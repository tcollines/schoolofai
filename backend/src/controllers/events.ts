import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { pool } from '../db';
import { logger, auditLog } from '../logger';

export class EventsController {
    // 1. Get all events
    static async getAll(req: AuthenticatedRequest, res: Response) {
        try {
            const [rows]: any = await pool.query('SELECT * FROM events ORDER BY date ASC');
            const events = rows.map((e: any) => ({
                id: e.id,
                title: e.title,
                description: e.description,
                date: e.date,
                type: e.type
            }));
            return res.json(events);
        } catch (error) {
            logger.error(`EventsController.getAll error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to fetch events' });
        }
    }

    // 2. Create event
    static async create(req: AuthenticatedRequest, res: Response) {
        try {
            const { title, description, date, type } = req.body;
            if (!title || !date || !type) {
                return res.status(400).json({ error: 'Title, date, and type are required' });
            }

            const id = 'event-' + Math.random().toString(36).substring(7);
            await pool.query(
                'INSERT INTO events (id, title, description, date, type) VALUES (?, ?, ?, ?, ?)',
                [id, title, description || '', date, type]
            );

            await auditLog(pool, 'CREATE_EVENT', req.user?.email || null, `Created event: ${title} (${id})`);
            return res.status(201).json({ id, title, description, date, type });
        } catch (error) {
            logger.error(`EventsController.create error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to create event' });
        }
    }

    // 3. Delete event
    static async delete(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const [existing]: any = await pool.query('SELECT title FROM events WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: 'Event not found' });
            }

            await pool.query('DELETE FROM events WHERE id = ?', [id]);
            await auditLog(pool, 'DELETE_EVENT', req.user?.email || null, `Deleted event: ${existing[0].title} (${id})`);

            return res.json({ message: 'Event deleted successfully' });
        } catch (error) {
            logger.error(`EventsController.delete error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to delete event' });
        }
    }
}
export class MailsController {
    // 1. Get user mails
    static async getMails(req: AuthenticatedRequest, res: Response) {
        try {
            const { email } = req.query;
            if (!email) {
                return res.status(400).json({ error: 'email query parameter is required' });
            }

            const [rows]: any = await pool.query(
                'SELECT * FROM mails WHERE recipient_email = ? OR sender_email = ? ORDER BY sent_at DESC',
                [email, email]
            );

            const mails = rows.map((m: any) => {
                let name = 'System';
                let mailEmail = m.sender_email;
                let message = m.body;
                let companyName = '';
                let type = 'INQUIRY';

                // Try to parse body as JSON for frontend corporate inquiries
                try {
                    const parsed = JSON.parse(m.body);
                    if (parsed && typeof parsed === 'object') {
                        name = parsed.name || name;
                        mailEmail = parsed.email || mailEmail;
                        message = parsed.message || message;
                        companyName = parsed.company_name || '';
                        type = parsed.type || type;
                    }
                } catch (e) {
                    // Not JSON - check if it's a raw SMTP email log
                    if (m.subject === 'ENROLLMENT' || m.subject === 'INQUIRY') {
                        type = m.subject;
                    } else if (m.subject && (m.subject.includes('OTP') || m.subject.includes('Verification') || m.subject.includes('Password'))) {
                        type = 'INQUIRY';
                        name = 'System Notification';
                        // strip HTML from body for clean message preview
                        message = m.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                    }
                }

                return {
                    id: m.id,
                    sender: m.sender_email,
                    recipient: m.recipient_email,
                    subject: m.subject,
                    body: m.body,
                    sentAt: m.sent_at,
                    // Frontend compatibility properties
                    type,
                    created_at: m.sent_at,
                    name,
                    email: mailEmail,
                    message,
                    company_name: companyName
                };
            });

            return res.json(mails);
        } catch (error) {
            logger.error(`MailsController.getMails error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to retrieve mails' });
        }
    }

    // 2. Send a mail
    static async sendMail(req: AuthenticatedRequest, res: Response) {
        try {
            // Check if it's a frontend inquiry format
            const { name, email, message, type, company_name } = req.body;
            if (name || message || type) {
                const bodyJson = JSON.stringify({
                    name: name || 'Anonymous',
                    email: email || '',
                    message: message || '',
                    company_name: company_name || '',
                    type: type || 'INQUIRY'
                });
                
                await pool.query(
                    'INSERT INTO mails (sender_email, recipient_email, subject, body) VALUES (?, ?, ?, ?)',
                    [email || 'anonymous@welile.com', 'admin@welile.com', type || 'INQUIRY', bodyJson]
                );
                return res.status(201).json({ message: 'Inquiry submitted successfully' });
            }

            // Fallback to SMTP log format
            const { sender, recipient, subject, body } = req.body;
            if (!sender || !recipient || !subject || !body) {
                return res.status(400).json({ error: 'sender, recipient, subject and body are required' });
            }

            await pool.query(
                'INSERT INTO mails (sender_email, recipient_email, subject, body) VALUES (?, ?, ?, ?)',
                [sender, recipient, subject, body]
            );

            return res.status(201).json({ message: 'Mail sent successfully' });
        } catch (error) {
            logger.error(`MailsController.sendMail error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to send mail' });
        }
    }

    // 3. Delete a mail
    static async deleteMail(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: 'Mail ID is required' });
            }

            const [existing]: any = await pool.query('SELECT id FROM mails WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: 'Message not found' });
            }

            await pool.query('DELETE FROM mails WHERE id = ?', [id]);
            await auditLog(pool, 'DELETE_MAIL', req.user?.email || null, `Deleted message ID: ${id}`);
 
            return res.json({ message: 'Message deleted successfully' });
        } catch (error) {
            logger.error(`MailsController.deleteMail error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to delete message' });
        }
    }

    // 4. Delete all mails
    static async clearAllMails(req: AuthenticatedRequest, res: Response) {
        try {
            await pool.query('DELETE FROM mails');
            await auditLog(pool, 'DELETE_ALL_MAILS', req.user?.email || null, 'Cleared all messages in mails table');
            return res.json({ message: 'All messages deleted successfully' });
        } catch (error) {
            logger.error(`MailsController.clearAllMails error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to delete messages' });
        }
    }
}
export class InstructorsController {
    // 1. Get all instructors
    static async getAll(req: AuthenticatedRequest, res: Response) {
        try {
            const [rows]: any = await pool.query('SELECT * FROM instructors ORDER BY name ASC');
            const instructors = rows.map((i: any) => ({
                id: i.id,
                name: i.name,
                email: i.email,
                bio: i.bio,
                avatar: i.avatar,
                coursesCount: Number(i.courses_count || 0),
                passcode: i.passcode
            }));
            return res.json(instructors);
        } catch (error) {
            logger.error(`InstructorsController.getAll error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to retrieve instructors' });
        }
    }

    // 2. Add an instructor
    static async create(req: AuthenticatedRequest, res: Response) {
        try {
            const { name, email, bio, avatar, passcode, password } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ error: 'Name, email, and password are required' });
            }

            const id = 'inst-' + Math.random().toString(36).substring(7);
            await pool.query(
                'INSERT INTO instructors (id, name, email, bio, avatar, passcode, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id, name, email.trim().toLowerCase(), bio || '', avatar || '', passcode || '', password]
            );

            // Also create a profile for the instructor
            await pool.query(
                'INSERT INTO profiles (id, full_name, email, role, avatar_url, wallet_balance, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ['user-' + Math.random().toString(36).substring(7), name, email.trim().toLowerCase(), 'INSTRUCTOR', avatar || '', 0, password]
            );

            await auditLog(pool, 'CREATE_INSTRUCTOR', req.user?.email || null, `Created instructor: ${name} (${id})`);
            return res.status(201).json({ id, name, email, bio, avatar, passcode });
        } catch (error) {
            logger.error(`InstructorsController.create error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to create instructor' });
        }
    }

    // 3. Update an instructor
    static async update(req: AuthenticatedRequest, res: Response) {
        try {
            const email = req.query.email as string;
            if (!email) {
                return res.status(400).json({ error: 'Email query parameter is required' });
            }
            const { name, bio, passcode, password } = req.body;
            
            await pool.query(
                'UPDATE instructors SET name = ?, bio = ?, passcode = ?, password = ? WHERE email = ?',
                [name, bio || '', passcode || '', password, email.trim().toLowerCase()]
            );

            // Also update the profile password
            await pool.query(
                'UPDATE profiles SET password = ? WHERE email = ?',
                [password, email.trim().toLowerCase()]
            );

            await auditLog(pool, 'UPDATE_INSTRUCTOR', req.user?.email || null, `Updated instructor profile: ${email}`);
            return res.json({ message: 'Instructor updated successfully' });
        } catch (error) {
            logger.error(`InstructorsController.update error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to update instructor' });
        }
    }

    // 4. Delete instructor
    static async delete(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const email = req.query.email as string;
            
            let query = 'SELECT name, email FROM instructors WHERE id = ?';
            let params = [id];
            
            if (!id && email) {
                query = 'SELECT name, email FROM instructors WHERE email = ?';
                params = [email.trim().toLowerCase()];
            }

            const [existing]: any = await pool.query(query, params);
            if (existing.length === 0) {
                return res.json({ message: 'Instructor not found' }); // Return 200 OK to be idempotent
            }

            const instructor = existing[0];
            if (id) {
                await pool.query('DELETE FROM instructors WHERE id = ?', [id]);
            } else {
                await pool.query('DELETE FROM instructors WHERE email = ?', [email.trim().toLowerCase()]);
            }
            
            // Downgrade the profile role to INDIVIDUAL, but ONLY if their current role is INSTRUCTOR (do not revoke ADMIN privileges!)
            const [profileRows]: any = await pool.query('SELECT role FROM profiles WHERE email = ?', [instructor.email]);
            if (profileRows.length > 0 && profileRows[0].role === 'INSTRUCTOR') {
                await pool.query('UPDATE profiles SET role = "INDIVIDUAL" WHERE email = ?', [instructor.email]);
            }

            await auditLog(pool, 'DELETE_INSTRUCTOR', req.user?.email || null, `Deleted instructor: ${instructor.name}`);
            return res.json({ message: 'Instructor deleted successfully' });
        } catch (error) {
            logger.error(`InstructorsController.delete error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to delete instructor' });
        }
    }
}
