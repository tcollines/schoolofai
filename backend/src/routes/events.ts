import { Router } from 'express';
import { EventsController, MailsController, InstructorsController } from '../controllers/events';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Events routes
router.get('/events', requireAuth, EventsController.getAll);
router.post('/events', requireAuth, requireRole(['ADMIN']), EventsController.create);
router.delete('/events/:id', requireAuth, requireRole(['ADMIN']), EventsController.delete);

// Mails routes
router.get('/mails', requireAuth, MailsController.getMails);
router.post('/mails', requireAuth, MailsController.sendMail);
router.delete('/mails', requireAuth, requireRole(['ADMIN']), MailsController.clearAllMails);
router.delete('/mails/:id', requireAuth, requireRole(['ADMIN']), MailsController.deleteMail);

// Instructors routes
router.get('/instructors', InstructorsController.getAll);
router.post('/instructors', requireAuth, requireRole(['ADMIN']), InstructorsController.create);
router.put('/instructors', requireAuth, requireRole(['ADMIN']), InstructorsController.update);
router.delete('/instructors', requireAuth, requireRole(['ADMIN']), InstructorsController.delete);
router.delete('/instructors/:id', requireAuth, requireRole(['ADMIN']), InstructorsController.delete);

export default router;
