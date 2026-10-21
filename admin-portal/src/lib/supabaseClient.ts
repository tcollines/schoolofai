import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(rawSupabaseUrl && rawSupabaseAnonKey);

const supabaseUrl = rawSupabaseUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = rawSupabaseAnonKey || 'placeholder-anon-key';

if (!isSupabaseConfigured) {
    console.warn('⚠️ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment variables. Please configure them in your deployment dashboard (e.g., Vercel).');
}

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
