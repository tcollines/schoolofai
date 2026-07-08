import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Course, UserRole } from '../../types';

export const useAdmin = (isAdmin: boolean) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async (silent = false) => {
        if (!isAdmin) return;
        if (!silent) setLoading(true);
        setError(null);
        try {
            // Fetch Profiles
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*');
            
            if (profilesError) throw profilesError;

            const formattedUsers: UserProfile[] = (profilesData || []).map((p: any) => ({
                id: p.id,
                name: p.full_name || 'Student',
                email: p.email || '',
                role: (p.role as UserRole) || UserRole.INDIVIDUAL,
                avatar: p.avatar_url || 'https://via.placeholder.com/150',
                walletBalance: Number(p.wallet_balance) || 0,
                skills: []
            }));
            setUsers(formattedUsers);

            // Fetch Courses
            const { data: coursesData, error: coursesError } = await supabase
                .from('courses')
                .select('*');

            if (coursesError) throw coursesError;

            const formattedCourses: Course[] = (coursesData || []).map((c: any) => ({
                id: c.id,
                title: c.title,
                instructor: c.instructor || 'Unknown',
                duration: c.duration || '0h',
                category: c.category || 'General',
                rating: Number(c.rating) || 0,
                lessonsTotal: c.lessons_total || 0,
                lessonsCompleted: 0,
                status: c.status,
                image: c.image_url || 'https://picsum.photos/400/300',
                price: Number(c.price) || 0,
                platform: 'Welile',
                accessTier: c.accessTier || 'FREE',
                modules: c.modules,
                quiz: c.quiz,
                description: c.description,
                outcomes: c.outcomes
            }));
            setCourses(formattedCourses);

        } catch (err: any) {
            console.error('Error in useAdmin:', err);
            setError(err.message);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [isAdmin]);

    const addCourse = async (courseData: Partial<Course>) => {
        try {
            const { data, error } = await supabase.from('courses').insert([
                {
                    title: courseData.title,
                    instructor: courseData.instructor,
                    duration: courseData.duration,
                    category: courseData.category,
                    accessTier: courseData.accessTier,
                    image_url: courseData.image,
                    modules: courseData.sections, // Save sections to modules JSONB
                    description: courseData.description,
                    outcomes: courseData.outcomes
                }
            ]).select().single();

            if (error) throw new Error(error.message || JSON.stringify(error));
            await fetchData(true); // Refresh silently
            return data;
        } catch (err: any) {
            console.error('Error adding course:', err);
            throw err;
        }
    };

    const updateCourse = async (courseId: string, courseData: Partial<Course>) => {
        try {
            const { data, error } = await supabase
                .from('courses')
                .update({
                    title: courseData.title,
                    instructor: courseData.instructor,
                    duration: courseData.duration,
                    category: courseData.category,
                    accessTier: courseData.accessTier,
                    image_url: courseData.image,
                    modules: courseData.sections,
                    description: courseData.description,
                    outcomes: courseData.outcomes
                })
                .eq('id', courseId)
                .select().single();

            if (error) throw new Error(error.message || JSON.stringify(error));
            await fetchData(true); // Refresh silently
            return data;
        } catch (err: any) {
            console.error('Error updating course:', err);
            throw err;
        }
    };

    const deleteCourse = async (courseId: string) => {
        try {
            // Clean up enrollments associated with this course ID
            await supabase
                .from('enrollments')
                .delete()
                .eq('course_id', courseId);

            // Delete the course from courses table
            const { data, error } = await supabase
                .from('courses')
                .delete()
                .eq('id', courseId);

            if (error) throw error;
            await fetchData(true); // Refresh silently
            return data;
        } catch (err: any) {
            console.error('Error deleting course:', err);
            throw err;
        }
    };

    const updateCourseQuiz = async (courseId: string, quizData: any) => {
        try {
            const { data, error } = await supabase
                .from('courses')
                .update({ quiz: quizData })
                .eq('id', courseId)
                .select().single();

            if (error) throw error;
            await fetchData(true); // Refresh silently
            return data;
        } catch (err: any) {
            console.error('Error updating quiz:', err);
            throw err;
        }
    };

    return { users, courses, loading, error, addCourse, updateCourse, deleteCourse, updateCourseQuiz, refresh: fetchData };
};
