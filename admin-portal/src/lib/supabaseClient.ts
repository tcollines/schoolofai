import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rlwpdknwyeuprqcymhuu.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsd3Bka253eWV1cHJxY3ltaHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5OTcwODEsImV4cCI6MjA5OTU3MzA4MX0.z9zgCd34Yhpk0w7I-DFie2JylEcQJmjXBGb7f99xUCU';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const isBackendConnected = true;

if (!isSupabaseConfigured) {
    console.warn('⚠️ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment variables.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
