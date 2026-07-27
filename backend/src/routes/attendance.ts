import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/attendance?courseId=...&date=...&userId=...
router.get('/', requireAuth, AttendanceController.getAttendance);

// POST /api/attendance (Upsert attendance status)
// Body: { userId, courseId, status, date }
router.post('/', requireAuth, AttendanceController.upsertAttendance);

// GET /api/attendance/stats?courseId=... (Weekly summary of attendance stats)
router.get('/stats', requireAuth, AttendanceController.getStats);

export default router;
