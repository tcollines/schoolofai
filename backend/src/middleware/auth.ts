import { Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import { logger } from '../logger';

// Extend express Request interface to include user
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        fullName: string;
        email: string;
        role: 'ADMIN' | 'INSTRUCTOR' | 'PRO' | 'INDIVIDUAL';
    };
}

// Authentication middleware using email header
export const requireAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const authEmail = req.headers['x-user-email'] as string || req.headers['authorization'] as string;

    if (!authEmail) {
        return res.status(401).json({ error: 'Authentication required. Please provide X-User-Email header.' });
    }

    try {
        const [rows]: any = await pool.query(
            'SELECT id, full_name, email, role FROM profiles WHERE email = ?',
            [authEmail.trim().toLowerCase()]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'User profile not found. Access denied.' });
        }

        const dbUser = rows[0];
        req.user = {
            id: dbUser.id,
            fullName: dbUser.full_name,
            email: dbUser.email,
            role: dbUser.role
        };

        next();
    } catch (err) {
        logger.error(`Auth middleware database error: ${(err as Error).message}`);
        res.status(500).json({ error: 'Internal server error during authentication.' });
    }
};

// RBAC Guard middleware (checks role permissions)
export const requireRole = (allowedRoles: ('ADMIN' | 'INSTRUCTOR' | 'PRO' | 'INDIVIDUAL')[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Strict rule: Only chemayekabraham289@gmail.com is allowed admin access
        if (allowedRoles.includes('ADMIN')) {
            if (req.user.email.trim().toLowerCase() !== 'chemayekabraham289@gmail.com') {
                return res.status(403).json({ 
                    error: 'Access Denied: Only chemayekabraham289@gmail.com is allowed. Please seek permissions from chemayekabraham289@gmail.com.' 
                });
            }
        }

        if (!allowedRoles.includes(req.user.role)) {
            logger.warn(`Access Denied: User ${req.user.email} with role ${req.user.role} tried accessing endpoint needing: ${allowedRoles.join(', ')}`);
            return res.status(403).json({ error: 'Access Denied: Insufficient permissions.' });
        }

        next();
    };
};
