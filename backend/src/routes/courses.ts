import { Router } from 'express';
import { CoursesController } from '../controllers/courses';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', CoursesController.getAll);
router.get('/:id', CoursesController.getById);

// Instructor or Admin can create/update courses
router.post('/', requireAuth, requireRole(['ADMIN', 'INSTRUCTOR']), CoursesController.create);
router.put('/:id', requireAuth, requireRole(['ADMIN', 'INSTRUCTOR']), CoursesController.update);

// Only Admin can delete courses
router.delete('/:id', requireAuth, requireRole(['ADMIN']), CoursesController.delete);

export default router;
