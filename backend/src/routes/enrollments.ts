import { Router } from 'express';
import { EnrollmentsController } from '../controllers/enrollments';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, EnrollmentsController.getByUserId);
router.post('/', requireAuth, EnrollmentsController.enroll);
router.put('/', requireAuth, EnrollmentsController.updateProgress);

export default router;
