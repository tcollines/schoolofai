import { z } from 'zod';

// Lesson validation schema
const lessonSchema = z.object({
    id: z.string(),
    title: z.string().trim().min(1, 'Lesson title is required'),
    type: z.enum(['video', 'audio', 'document', 'article', 'quiz']),
    duration: z.string().trim().min(1, 'Duration is required'),
    videoUrl: z.string().optional().nullable(),
    audioUrl: z.string().optional().nullable(),
    content: z.string().optional().nullable(),
    fileUrl: z.string().optional().nullable(),
    quizQuestions: z.array(
        z.object({
            id: z.string(),
            text: z.string().trim().min(1, 'Question text is required'),
            options: z.array(z.string().trim().min(1, 'Options cannot be empty')),
            correctAnswer: z.number().int()
        })
    ).optional().nullable()
});

// Section/Module validation schema
const sectionSchema = z.object({
    id: z.string(),
    title: z.string().trim().min(1, 'Module title is required'),
    lessons: z.array(lessonSchema)
});

// Course validation schema
export const courseSchema = z.object({
    id: z.string().optional(),
    title: z.string().trim().min(1, 'Course title is required'),
    instructor: z.string().trim().min(1, 'Instructor name is required'),
    instructorEmail: z.string().email('Invalid instructor email address'),
    instructorAvatar: z.string().optional().nullable(),
    duration: z.string().trim().min(1, 'Duration is required'),
    category: z.string().trim().min(1, 'Category is required'),
    rating: z.number().optional(),
    image: z.string().optional().nullable(),
    price: z.number().nonnegative().default(0),
    accessTier: z.enum(['FREE', 'PAID']).default('FREE'),
    status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
    isVerified: z.boolean().optional().default(false),
    description: z.string().trim().optional().nullable(),
    outcomes: z.array(z.string()).optional().default([]),
    sections: z.array(sectionSchema).optional().default([]),
    platform: z.string().optional().default('Welile'),
    imageScale: z.number().optional().default(1),
    imagePositionX: z.number().optional().default(50),
    imagePositionY: z.number().optional().default(50)
});
