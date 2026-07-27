import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { pool } from '../db';
import { signupSchema, signinSchema } from '../schemas/auth';
import { logger, auditLog } from '../logger';
import { sendOtpEmail } from '../services/email';

export class AuthController {
    // 1. User Sign Up
    static async signUp(req: AuthenticatedRequest, res: Response) {
        try {
            const validated = signupSchema.parse(req.body);
            const { email, password, fullName, role, avatarUrl } = validated;

            const emailClean = email.trim().toLowerCase();

            // Check if user already exists
            const [existing]: any = await pool.query('SELECT id FROM profiles WHERE email = ?', [emailClean]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'User with this email already exists' });
            }

            const id = 'user-' + Math.random().toString(36).substring(2, 11);

            // Check if email has approved instructor application
            const [appRows]: any = await pool.query(
                'SELECT username FROM instructor_applications WHERE email = ? AND status = "APPROVED"',
                [emailClean]
            );
            let finalRole = role;
            if (appRows.length > 0) {
                finalRole = 'INSTRUCTOR';
                // Also ensure they are in the instructors table
                const [existingInst]: any = await pool.query('SELECT id FROM instructors WHERE email = ?', [emailClean]);
                if (existingInst.length === 0) {
                    const instId = 'inst-' + Math.random().toString(36).substring(7);
                    await pool.query(
                        'INSERT INTO instructors (id, name, email, bio, avatar, passcode, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [instId, fullName, emailClean, '', '', '', password]
                    );
                }
            }
            
            await pool.query(
                'INSERT INTO profiles (id, full_name, email, role, avatar_url, wallet_balance, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id, fullName, emailClean, finalRole, avatarUrl || '', 100.00, password]
            );

            await auditLog(pool, 'USER_SIGNUP', emailClean, `Signed up user: ${fullName} (${id}) as ${finalRole}`);
            
            return res.status(201).json({
                user: { id, email: emailClean, fullName, role: finalRole, avatarUrl },
                session: { user: { id, email: emailClean } }
            });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
            }
            logger.error(`AuthController.signUp error: ${error.message}`);
            return res.status(500).json({ error: 'Sign up failed' });
        }
    }

    // 2. User Sign In
    static async signIn(req: AuthenticatedRequest, res: Response) {
        try {
            const validated = signinSchema.parse(req.body);
            const { email, password } = validated;

            const [rows]: any = await pool.query(
                'SELECT * FROM profiles WHERE email = ?',
                [email.trim().toLowerCase()]
            );

            if (rows.length === 0) {
                return res.status(400).json({ error: 'Invalid email or password' });
            }

            const user = rows[0];
            if (user.password !== password) {
                return res.status(400).json({ error: 'Invalid email or password' });
            }

            await auditLog(pool, 'USER_SIGNIN', email, `Logged in successfully`);

            return res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    avatarUrl: user.avatar_url,
                    walletBalance: Number(user.wallet_balance)
                }
            });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
            }
            logger.error(`AuthController.signIn error: ${error.message}`);
            return res.status(500).json({ error: 'Sign in failed' });
        }
    }

    // 3. Get profile
    static async getProfile(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const [rows]: any = await pool.query(
                'SELECT id, full_name, email, role, avatar_url, wallet_balance, nationality, date_of_birth, avatar_scale, avatar_pos_x, avatar_pos_y, created_at FROM profiles WHERE id = ?',
                [req.user.id]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Profile not found' });
            }

            const profile = rows[0];
            return res.json({
                id: profile.id,
                email: profile.email,
                fullName: profile.full_name,
                role: profile.role,
                avatarUrl: profile.avatar_url,
                walletBalance: Number(profile.wallet_balance),
                nationality: profile.nationality || '',
                dateOfBirth: profile.date_of_birth || '',
                avatarScale: profile.avatar_scale !== null && profile.avatar_scale !== undefined ? Number(profile.avatar_scale) : 1,
                avatarPositionX: profile.avatar_pos_x !== null && profile.avatar_pos_x !== undefined ? Number(profile.avatar_pos_x) : 0,
                avatarPositionY: profile.avatar_pos_y !== null && profile.avatar_pos_y !== undefined ? Number(profile.avatar_pos_y) : 0,
                createdAt: profile.created_at
            });
        } catch (error) {
            logger.error(`AuthController.getProfile error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to retrieve profile' });
        }
    }

    // 4. Get all profiles (unauthenticated check for email availability / reset)
    static async getAllProfiles(req: any, res: Response) {
        try {
            const [rows]: any = await pool.query(
                'SELECT id, full_name, email, role, avatar_url, wallet_balance, nationality, date_of_birth, avatar_scale, avatar_pos_x, avatar_pos_y, password FROM profiles'
            );
            const profiles = rows.map((p: any) => ({
                id: p.id,
                fullName: p.full_name,
                email: p.email,
                role: p.role,
                avatarUrl: p.avatar_url,
                walletBalance: Number(p.wallet_balance),
                nationality: p.nationality || '',
                dateOfBirth: p.date_of_birth || '',
                avatarScale: p.avatar_scale !== null && p.avatar_scale !== undefined ? Number(p.avatar_scale) : 1,
                avatarPositionX: p.avatar_pos_x !== null && p.avatar_pos_x !== undefined ? Number(p.avatar_pos_x) : 0,
                avatarPositionY: p.avatar_pos_y !== null && p.avatar_pos_y !== undefined ? Number(p.avatar_pos_y) : 0,
                password: p.password // compatible with password reset code
            }));
            return res.json(profiles);
        } catch (error) {
            logger.error(`AuthController.getAllProfiles error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to retrieve profiles list' });
        }
    }

    // 5. Update profile wallet, password, or attributes
    static async updateProfile(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id } = req.params;
            const targetId = id || req.user.id; // Allow updating by path parameter or defaults to logged-in user

            const { 
                fullName, fullName_snake, 
                avatarUrl, avatar_url, 
                walletBalance, wallet_balance, 
                role, password, 
                nationality, 
                dateOfBirth, date_of_birth, 
                avatarScale, avatar_scale, 
                avatarPositionX, avatar_pos_x, 
                avatarPositionY, avatar_pos_y 
            } = req.body;

            const inputFullName = fullName !== undefined ? fullName : (fullName_snake !== undefined ? fullName_snake : req.body.full_name);
            const inputAvatarUrl = avatarUrl !== undefined ? avatarUrl : (avatar_url !== undefined ? avatar_url : req.body.avatar_url);
            const inputWalletBalance = walletBalance !== undefined ? walletBalance : (wallet_balance !== undefined ? wallet_balance : req.body.wallet_balance);
            const inputNationality = nationality !== undefined ? nationality : req.body.nationality;
            const inputDateOfBirth = dateOfBirth !== undefined ? dateOfBirth : (date_of_birth !== undefined ? date_of_birth : req.body.date_of_birth);
            const inputAvatarScale = avatarScale !== undefined ? avatarScale : (avatar_scale !== undefined ? avatar_scale : req.body.avatar_scale);
            const inputAvatarPositionX = avatarPositionX !== undefined ? avatarPositionX : (avatar_pos_x !== undefined ? avatar_pos_x : req.body.avatar_pos_x);
            const inputAvatarPositionY = avatarPositionY !== undefined ? avatarPositionY : (avatar_pos_y !== undefined ? avatar_pos_y : req.body.avatar_pos_y);

            let query = 'UPDATE profiles SET ';
            const updates: string[] = [];
            const params: any[] = [];

            if (inputFullName !== undefined) {
                updates.push('full_name = ?');
                params.push(inputFullName);
            }
            if (inputAvatarUrl !== undefined) {
                updates.push('avatar_url = ?');
                params.push(inputAvatarUrl);
            }
            if (inputWalletBalance !== undefined) {
                updates.push('wallet_balance = ?');
                params.push(inputWalletBalance);
            }
            if (password !== undefined) {
                updates.push('password = ?');
                params.push(password);
            }
            if (inputNationality !== undefined) {
                updates.push('nationality = ?');
                params.push(inputNationality);
            }
            if (inputDateOfBirth !== undefined) {
                updates.push('date_of_birth = ?');
                params.push(inputDateOfBirth === '' ? null : inputDateOfBirth);
            }
            if (inputAvatarScale !== undefined) {
                updates.push('avatar_scale = ?');
                params.push(inputAvatarScale === '' ? 1.00 : Number(inputAvatarScale));
            }
            if (inputAvatarPositionX !== undefined) {
                updates.push('avatar_pos_x = ?');
                params.push(inputAvatarPositionX === '' ? 0 : Number(inputAvatarPositionX));
            }
            if (inputAvatarPositionY !== undefined) {
                updates.push('avatar_pos_y = ?');
                params.push(inputAvatarPositionY === '' ? 0 : Number(inputAvatarPositionY));
            }
            if (role !== undefined) {
                // Only ADMIN can change roles
                if (req.user.role !== 'ADMIN') {
                    return res.status(403).json({ error: 'Only admins can modify user roles.' });
                }
                updates.push('role = ?');
                params.push(role);
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }

            query += updates.join(', ') + ' WHERE id = ?';
            params.push(targetId);

            await pool.query(query, params);
            await auditLog(pool, 'UPDATE_PROFILE', req.user.email, `Updated profile (${targetId}) fields: ${updates.join(', ')}`);

            return res.json({ message: 'Profile updated successfully' });
        } catch (error) {
            logger.error(`AuthController.updateProfile error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to update profile' });
        }
    }

    // 6. Redirect to Google OAuth Consent screen
    static async googleRedirect(req: any, res: Response) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback';
        
        if (!clientId) {
            logger.error('Google Client ID is missing in configuration. Cannot perform Google OAuth.');
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
            return res.redirect(`${frontendUrl}/?oauth_error=Google%20OAuth%20not%20configured`);
        }

        const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile%20email&access_type=offline&prompt=consent`;
        return res.redirect(googleUrl);
    }

    // 7. Google OAuth Callback
    static async googleCallback(req: any, res: Response) {
        const { code } = req.query;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';

        if (!code) {
            return res.redirect(`${frontendUrl}/?oauth_error=No%20authorization%20code%20provided`);
        }

        try {
            const clientId = process.env.GOOGLE_CLIENT_ID || '';
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
            const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback';

            // Exchange authorization code for access token
            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code'
                })
            });

            const tokenData = await tokenRes.json();
            if (!tokenRes.ok) {
                logger.error(`Google token exchange failed: ${JSON.stringify(tokenData)}`);
                return res.redirect(`${frontendUrl}/?oauth_error=Token%20exchange%20failed`);
            }

            const { access_token } = tokenData;

            // Fetch user info from Google
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { 'Authorization': `Bearer ${access_token}` }
            });

            const userInfo = await userInfoRes.json();
            if (!userInfoRes.ok) {
                logger.error(`Google userinfo fetch failed: ${JSON.stringify(userInfo)}`);
                return res.redirect(`${frontendUrl}/?oauth_error=Failed%20to%20retrieve%20user%20details`);
            }

            const email = userInfo.email?.trim().toLowerCase();
            const fullName = userInfo.name || email.split('@')[0];
            const avatarUrl = userInfo.picture || '';

            if (!email) {
                return res.redirect(`${frontendUrl}/?oauth_error=No%20email%20returned%20from%20Google`);
            }

            // Check if user profile already exists
            const [existing]: any = await pool.query('SELECT id, full_name, avatar_url, role FROM profiles WHERE email = ?', [email]);

            if (existing.length > 0) {
                if (avatarUrl && existing[0].avatar_url !== avatarUrl) {
                    await pool.query('UPDATE profiles SET avatar_url = ? WHERE email = ?', [avatarUrl, email]);
                }
                await auditLog(pool, 'USER_SIGNIN_OAUTH', email, 'Logged in via Google OAuth');
                return res.redirect(`${frontendUrl}/?oauth_success=true&email=${encodeURIComponent(email)}&name=${encodeURIComponent(existing[0].full_name || fullName)}`);
            } else {
                // Account does not exist! Send verification code (OTP)
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                const expires = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
                AuthController.otpStore.set(email, { code, expires, fullName, avatarUrl });
                
                const sent = await sendOtpEmail(email, code);
                if (!sent) {
                    logger.error(`Failed to send verification email to ${email}`);
                    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Failed to send verification email. Please check your SMTP configuration.')}`);
                }
                
                return res.redirect(`${frontendUrl}/login?step=google-verify&email=${encodeURIComponent(email)}&name=${encodeURIComponent(fullName)}`);
            }
        } catch (error: any) {
            logger.error(`Google OAuth Callback error: ${error.message}`);
            return res.redirect(`${frontendUrl}/?oauth_error=Internal%20server%20error`);
        }
    }

    // Delete profile (ADMIN only)
    static async deleteProfile(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden: Admin access required' });
            }

            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: 'Profile ID is required' });
            }

            // Prevent deleting yourself (the logged-in admin)
            if (id === req.user.id) {
                return res.status(400).json({ error: 'You cannot delete your own admin account.' });
            }

            await pool.query('DELETE FROM profiles WHERE id = ?', [id]);
            await auditLog(pool, 'DELETE_PROFILE', req.user.email, `Deleted profile ID: ${id}`);

            return res.json({ message: 'Profile deleted successfully' });
        } catch (error) {
            logger.error(`AuthController.deleteProfile error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Failed to delete profile' });
        }
    }

    private static otpStore = new Map<string, { code: string; expires: number; fullName?: string; password?: string; role?: string; verified?: boolean; avatarUrl?: string }>();

    // Send 2FA/MFA OTP via real SMTP
    static async sendMfaOtp(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email || !email.includes('@')) {
                return res.status(400).json({ error: 'Valid email is required' });
            }

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expires = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

            // Save to store
            AuthController.otpStore.set(email.toLowerCase().trim(), { code, expires });

            // Send email via Sockets-based SMTP
            const sent = await sendOtpEmail(email, code);
            if (!sent) {
                return res.status(500).json({ error: 'Failed to send 2FA email. Please check backend SMTP config.' });
            }

            return res.json({ message: '2FA code sent successfully' });
        } catch (error) {
            logger.error(`AuthController.sendMfaOtp error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Send Password Reset OTP
    static async sendResetOtp(req: Request, res: Response) {
        try {
            const { email, code } = req.body;
            if (!email || !code) {
                return res.status(400).json({ error: 'Email and code are required' });
            }

            const sent = await sendOtpEmail(email, code);
            if (!sent) {
                return res.status(500).json({ error: 'Failed to send reset code email. Please check SMTP config.' });
            }

            return res.json({ success: true, message: 'Reset code email sent successfully' });
        } catch (error: any) {
            logger.error(`AuthController.sendResetOtp error: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Send Google OTP (for Real Email OTP Verification)
    static async sendGoogleOtp(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email || !email.includes('@')) {
                return res.status(400).json({ error: 'Valid email is required' });
            }

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expires = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
            const derivedName = email.split('@')[0].split('.').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

            // Save to store
            AuthController.otpStore.set(email.toLowerCase().trim(), { code, expires, fullName: derivedName });

            // Send email via nodemailer
            const sent = await sendOtpEmail(email, code);
            if (!sent) {
                return res.status(500).json({ error: 'Failed to send verification email. Please check backend SMTP config.' });
            }

            return res.json({ message: 'Verification code sent successfully' });
        } catch (error) {
            logger.error(`AuthController.sendGoogleOtp error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Verify Google OTP
    static async verifyGoogleOtp(req: Request, res: Response) {
        try {
            const { email, code, password } = req.body;
            if (!email || !code) {
                return res.status(400).json({ error: 'Email and code are required' });
            }

            const emailClean = email.trim().toLowerCase();
            const record = AuthController.otpStore.get(emailClean);
            if (!record) {
                return res.status(400).json({ error: 'No verification pending for this email' });
            }

            if (Date.now() > record.expires) {
                AuthController.otpStore.delete(emailClean);
                return res.status(400).json({ error: 'Verification code has expired' });
            }

            if (record.code !== code) {
                return res.status(400).json({ error: 'Invalid verification code' });
            }

            const [existing]: any = await pool.query('SELECT * FROM profiles WHERE email = ?', [emailClean]);
            let userObj: any = null;
            const fullName = record.fullName || emailClean.split('@')[0];

            if (existing.length > 0) {
                // Code matches, clean up the store
                AuthController.otpStore.delete(emailClean);
                userObj = existing[0];
                await auditLog(pool, 'USER_SIGNIN_OAUTH', emailClean, 'Logged in via Google OTP');

                return res.json({ 
                    message: 'OTP verified successfully', 
                    isNewUser: false,
                    user: {
                        id: userObj.id,
                        email: emailClean,
                        fullName: userObj.full_name || userObj.fullName || fullName,
                        role: userObj.role || 'INDIVIDUAL'
                    }
                });
            } else {
                // Mark record as verified in store and keep it there for completeSignup
                record.verified = true;
                AuthController.otpStore.set(emailClean, record);

                return res.json({ 
                    message: 'OTP verified successfully', 
                    isNewUser: true
                });
            }
        } catch (error: any) {
            logger.error(`AuthController.verifyGoogleOtp error: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error during verification' });
        }
    }

    // Send Signup OTP
    static async sendSignupOtp(req: Request, res: Response) {
        try {
            const { email, fullName, role } = req.body;
            if (!email || !email.includes('@') || !fullName) {
                return res.status(400).json({ error: 'All fields (fullName, email) are required.' });
            }

            const emailClean = email.trim().toLowerCase();

            // Check if user already exists
            const [existing]: any = await pool.query('SELECT id FROM profiles WHERE email = ?', [emailClean]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'User with this email already exists' });
            }

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expires = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

            // Save details to store for verification
            AuthController.otpStore.set(emailClean, { 
                code, 
                expires, 
                fullName, 
                role: role || 'INDIVIDUAL',
                verified: false
            });

            // Send email via Sockets-based SMTP
            const sent = await sendOtpEmail(emailClean, code);
            if (!sent) {
                return res.status(500).json({ error: 'Failed to send signup verification email. Please check backend SMTP config.' });
            }

            return res.json({ message: 'Verification code sent successfully' });
        } catch (error) {
            logger.error(`AuthController.sendSignupOtp error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Verify Signup OTP code (without creating profile yet)
    static async verifySignupOtpCode(req: Request, res: Response) {
        try {
            const { email, code } = req.body;
            if (!email || !code) {
                return res.status(400).json({ error: 'Email and code are required' });
            }

            const emailClean = email.trim().toLowerCase();
            const record = AuthController.otpStore.get(emailClean);
            if (!record) {
                return res.status(400).json({ error: 'No verification pending for this email' });
            }

            if (Date.now() > record.expires) {
                AuthController.otpStore.delete(emailClean);
                return res.status(400).json({ error: 'Verification code has expired' });
            }

            if (record.code !== code) {
                return res.status(400).json({ error: 'Invalid verification code' });
            }

            // Code matches, mark as verified
            AuthController.otpStore.set(emailClean, { ...record, verified: true });

            return res.json({ message: 'Code verified successfully. Please set a password.' });
        } catch (error: any) {
            logger.error(`AuthController.verifySignupOtpCode error: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error during verification' });
        }
    }

    // Complete signup by setting password
    static async completeSignup(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || !password || password.length < 6) {
                return res.status(400).json({ error: 'Email and a password of at least 6 characters are required.' });
            }

            const emailClean = email.trim().toLowerCase();
            const record = AuthController.otpStore.get(emailClean);
            if (!record || !record.verified) {
                return res.status(400).json({ error: 'Email verification is required before setting a password.' });
            }

            const id = 'user-' + Math.random().toString(36).substring(2, 11);
            const fullName = record.fullName || emailClean.split('@')[0];
            const role = record.role || (emailClean === 'chemayekabraham289@gmail.com' ? 'ADMIN' : 'INDIVIDUAL');
            const avatarUrl = record.avatarUrl || '';

            // Check if email has approved instructor application
            const [appRows]: any = await pool.query(
                'SELECT username FROM instructor_applications WHERE email = ? AND status = "APPROVED"',
                [emailClean]
            );
            let finalRole = role;
            if (appRows.length > 0) {
                finalRole = 'INSTRUCTOR';
                // Also ensure they are in the instructors table
                const [existingInst]: any = await pool.query('SELECT id FROM instructors WHERE email = ?', [emailClean]);
                if (existingInst.length === 0) {
                    const instId = 'inst-' + Math.random().toString(36).substring(7);
                    await pool.query(
                        'INSERT INTO instructors (id, name, email, bio, avatar, passcode, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [instId, fullName, emailClean, '', '', '', password]
                    );
                }
            }

            // Insert into DB
            await pool.query(
                'INSERT INTO profiles (id, full_name, email, role, avatar_url, wallet_balance, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id, fullName, emailClean, finalRole, avatarUrl, 100.00, password]
            );

            // Clean up OTP store
            AuthController.otpStore.delete(emailClean);

            await auditLog(pool, 'USER_SIGNUP', emailClean, `Signed up user: ${fullName} (${id}) as ${finalRole}`);

            return res.status(201).json({ 
                message: 'Account created successfully', 
                user: { id, email: emailClean, fullName, role: finalRole }
            });
        } catch (error: any) {
            logger.error(`AuthController.completeSignup error: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error during registration' });
        }
    }

    // Send Login OTP (for Passwordless Email OTP Login)
    static async sendLoginOtp(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email || !email.includes('@')) {
                return res.status(400).json({ error: 'Valid email is required' });
            }

            const emailClean = email.trim().toLowerCase();

            // Check if user exists in the database
            const [users]: any = await pool.query('SELECT id, full_name, role FROM profiles WHERE email = ?', [emailClean]);
            if (users.length === 0) {
                return res.status(404).json({ error: 'No account found with this email. Please sign up first.' });
            }

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expires = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

            // Save to store
            AuthController.otpStore.set(emailClean, { code, expires, fullName: users[0].full_name || users[0].fullName });

            // Send email
            const sent = await sendOtpEmail(emailClean, code);
            if (!sent) {
                return res.status(500).json({ error: 'Failed to send login verification email. Please check backend SMTP config.' });
            }

            return res.json({ message: 'Login code sent successfully' });
        } catch (error) {
            logger.error(`AuthController.sendLoginOtp error: ${(error as Error).message}`);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Get Admin Account Status (checks if password setup is needed)
    static async getAdminStatus(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ error: 'Email is required' });
            
            const emailClean = email.trim().toLowerCase();
            if (emailClean !== 'chemayekabraham289@gmail.com') {
                return res.status(403).json({ error: 'Access Denied: Only chemayekabraham289@gmail.com is allowed.' });
            }

            const [rows]: any = await pool.query('SELECT password FROM profiles WHERE email = ?', [emailClean]);
            if (rows.length === 0) {
                return res.json({ exists: false, needsSetup: true });
            }

            const password = rows[0].password;
            const needsSetup = !password || password === 'student123' || password.startsWith('oauth-');
            return res.json({ exists: true, needsSetup });
        } catch (error: any) {
            logger.error(`AuthController.getAdminStatus error: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Set Admin Password (one-time setup after OTP verification)
    static async setAdminPassword(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required.' });
            }

            const emailClean = email.trim().toLowerCase();
            if (emailClean !== 'chemayekabraham289@gmail.com') {
                return res.status(403).json({ error: 'Access Denied' });
            }

            // Update in profiles table
            await pool.query('UPDATE profiles SET password = ?, role = "ADMIN" WHERE email = ?', [password, emailClean]);

            await auditLog(pool, 'ADMIN_PASSWORD_SETUP', emailClean, 'Admin password initialized successfully');

            return res.json({ message: 'Admin password set successfully' });
        } catch (error: any) {
            logger.error(`AuthController.setAdminPassword error: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Real Admin Login Verification
    static async adminLogin(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required.' });
            }

            const emailClean = email.trim().toLowerCase();
            if (emailClean !== 'chemayekabraham289@gmail.com') {
                return res.status(403).json({ 
                    error: 'Access Denied: Only chemayekabraham289@gmail.com is allowed to access the admin console.' 
                });
            }

            // Fetch admin from profiles
            const [rows]: any = await pool.query('SELECT * FROM profiles WHERE email = ?', [emailClean]);
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Admin account not found in database.' });
            }

            const admin = rows[0];
            if (admin.password !== password) {
                return res.status(401).json({ error: 'Incorrect password.' });
            }

            // Guard against default password if they try to bypass OTP setup
            if (password === 'student123') {
                return res.status(400).json({ error: 'Please set a secure password first using the verification code flow.' });
            }

            await auditLog(pool, 'ADMIN_SIGNIN', emailClean, 'Logged in to Admin Console');

            return res.json({ 
                message: 'Admin logged in successfully',
                user: { id: admin.id, email: admin.email, fullName: admin.full_name, role: admin.role }
            });
        } catch (error: any) {
            logger.error(`AuthController.adminLogin error: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error during admin login' });
        }
    }

    // Get Instructor Account Status (checks if password setup is needed)
    static async getInstructorStatus(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ error: 'Email is required' });
            
            const emailClean = email.trim().toLowerCase();
            
            const [rows]: any = await pool.query('SELECT password FROM instructors WHERE email = ?', [emailClean]);
            if (rows.length === 0) {
                return res.status(403).json({ error: 'Access Denied: You are not registered as an instructor. Please contact the administrator.' });
            }

            const password = rows[0].password;
            const needsSetup = !password || password === 'instructor' || password.startsWith('oauth-');
            return res.json({ exists: true, needsSetup });
        } catch (error: any) {
            logger.error(`AuthController.getInstructorStatus error: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Set Instructor Password (one-time setup after OTP verification)
    static async setInstructorPassword(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required.' });
            }

            const emailClean = email.trim().toLowerCase();

            const [rows]: any = await pool.query('SELECT id FROM instructors WHERE email = ?', [emailClean]);
            if (rows.length === 0) {
                return res.status(403).json({ error: 'Access Denied: Not registered as instructor.' });
            }

            // Update in instructors table
            await pool.query('UPDATE instructors SET password = ? WHERE email = ?', [password, emailClean]);

            // Also update the profile password
            await pool.query('UPDATE profiles SET password = ?, role = "INSTRUCTOR" WHERE email = ?', [password, emailClean]);

            await auditLog(pool, 'INSTRUCTOR_PASSWORD_SETUP', emailClean, 'Instructor password initialized successfully');

            return res.json({ message: 'Instructor password set successfully' });
        } catch (error: any) {
            logger.error(`AuthController.setInstructorPassword error: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Real Instructor Login Verification
    static async instructorLogin(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required.' });
            }

            const emailClean = email.trim().toLowerCase();

            const [rows]: any = await pool.query('SELECT * FROM instructors WHERE email = ?', [emailClean]);
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Instructor account not found in database.' });
            }

            const instructor = rows[0];
            if (instructor.password !== password) {
                return res.status(401).json({ error: 'Incorrect password.' });
            }

            // Guard against default password if they try to bypass OTP setup
            if (password === 'instructor') {
                return res.status(400).json({ error: 'Please set a secure password first using the verification code flow.' });
            }

            await auditLog(pool, 'INSTRUCTOR_SIGNIN', emailClean, 'Logged in to Instructor Console');

            return res.json({ 
                message: 'Instructor logged in successfully',
                instructor: { id: instructor.id, name: instructor.name, email: instructor.email }
            });
        } catch (error: any) {
            logger.error(`AuthController.instructorLogin error: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error during instructor login' });
        }
    }
}
