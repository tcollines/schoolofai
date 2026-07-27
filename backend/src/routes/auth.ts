import { Router } from 'express';
import { AuthController } from '../controllers/auth';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/signup', AuthController.signUp);
router.post('/signin', AuthController.signIn);
router.get('/profile', requireAuth, AuthController.getProfile);
router.put('/profile', requireAuth, AuthController.updateProfile);

// Dynamic profile queries/updates
router.get('/profiles', AuthController.getAllProfiles);
router.put('/profiles/:id', requireAuth, AuthController.updateProfile);
router.delete('/profiles/:id', requireAuth, AuthController.deleteProfile);

// Google OAuth routes
router.get('/google', AuthController.googleRedirect);
router.get('/google/callback', AuthController.googleCallback);

// Real Google Email OTP verification routes
router.post('/google-otp', AuthController.sendGoogleOtp);
router.post('/google-otp/verify', AuthController.verifyGoogleOtp);
router.post('/send-mfa-otp', AuthController.sendMfaOtp);

// Standard Email/Password Signup OTP verification routes
router.post('/signup-otp', AuthController.sendSignupOtp);
router.post('/signup-otp/verify-code', AuthController.verifySignupOtpCode);
router.post('/signup-complete', AuthController.completeSignup);
router.post('/login-otp', AuthController.sendLoginOtp);
router.post('/admin-login', AuthController.adminLogin);
router.post('/admin/status', AuthController.getAdminStatus);
router.post('/admin/set-password', AuthController.setAdminPassword);
router.post('/instructor-login', AuthController.instructorLogin);
router.post('/instructor/status', AuthController.getInstructorStatus);
router.post('/instructor/set-password', AuthController.setInstructorPassword);

// Debug endpoint
router.get('/debug-db', async (req, res) => {
    try {
        const { pool } = require('../db');
        const [rows] = await pool.query('SELECT id, full_name, email, role FROM profiles');
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
