import { z } from 'zod';

export const signupSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters long'),
    role: z.enum(['ADMIN', 'INSTRUCTOR', 'PRO', 'INDIVIDUAL']).default('INDIVIDUAL'),
    avatarUrl: z.string().optional().nullable()
});

export const signinSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
});
