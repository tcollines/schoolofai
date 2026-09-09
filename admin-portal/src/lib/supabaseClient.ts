import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseClient = supabase;

export interface Course {
    id: string;
    title: string;
    instructor: string;
    instructorEmail?: string;
    instructorAvatar?: string;
    duration: string;
    category: string;
    rating: number;
    lessonsTotal: number;
    lessonsCompleted: number;
    status: string;
    isDraft?: boolean;
    isVerified?: boolean;
    image: string;
    price: number;
    platform: 'Welile' | 'Coursera' | 'Partner';
    accessTier?: 'FREE' | 'PAID';
    sections?: any[];
    description?: string;
    outcomes?: string[];
}
