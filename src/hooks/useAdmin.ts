import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Course, UserRole } from '../../types';

export const useAdmin = (isAdmin: boolean) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrollments, setEnrollments] = useState<any[]>([]);
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
                avatar: p.avatar_url || '',
                walletBalance: Number(p.wallet_balance) || 0,
                skills: [],
                pending_role: p.pending_role,
                pending_txid: p.pending_txid,
                pending_screenshot: p.pending_screenshot,
                avatarScale: p.avatar_scale !== undefined ? Number(p.avatar_scale) : 1,
                avatarPositionX: p.avatar_pos_x !== undefined ? Number(p.avatar_pos_x) : 0,
                avatarPositionY: p.avatar_pos_y !== undefined ? Number(p.avatar_pos_y) : 0
            }));
            setUsers(formattedUsers);

            // Fetch Courses
            const { data: coursesData, error: coursesError } = await supabase
                .from('courses')
                .select('*');

            if (coursesError) throw coursesError;

            const formattedCourses: Course[] = (coursesData || []).map((c: any) => {
                const isNewFormat = Array.isArray(c.modules) && c.modules.length > 0 && 'lessons' in c.modules[0];
                return {
                    id: c.id,
                    title: c.title,
                    instructor: c.instructor || 'Unknown',
                    instructorEmail: c.instructor_email || '',
                    instructorAvatar: c.instructor_avatar || '',
                    duration: c.duration || '0h',
                    category: c.category || 'General',
                    rating: Number(c.rating) || 0,
                    lessonsTotal: c.lessons_total || 0,
                    lessonsCompleted: 0,
                    status: c.status,
                    isDraft: c.is_draft || false,
                    image: c.image_url || 'https://picsum.photos/400/300',
                    price: Number(c.price) || 0,
                    platform: 'Welile',
                    accessTier: c.accessTier || 'FREE',
                    sections: isNewFormat ? c.modules : undefined,
                    modules: !isNewFormat ? c.modules : undefined,
                    quiz: c.quiz,
                    description: c.description,
                    outcomes: c.outcomes,
                    imageScale: c.image_scale !== undefined ? Number(c.image_scale) : 1,
                    imagePositionX: c.image_pos_x !== undefined ? Number(c.image_pos_x) : 50,
                    imagePositionY: c.image_pos_y !== undefined ? Number(c.image_pos_y) : 50
                };
            });
            setCourses(formattedCourses);

            // Fetch Enrollments
            const { data: enrollmentsData, error: enrollmentsError } = await supabase
                .from('enrollments')
                .select('*');

            if (enrollmentsError) throw enrollmentsError;
            setEnrollments(enrollmentsData || []);

        } catch (err: any) {
            console.error('Error in useAdmin:', err);
            setError(err.message);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const handleUpdate = () => {
            fetchData(true); // reload silently
        };

        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'welile_local_db' || e.key === 'admin-events') {
                fetchData(true);
            }
        };

        window.addEventListener('courses-update', handleUpdate);
        window.addEventListener('admin-events-update', handleUpdate);
        window.addEventListener('profile-update', handleUpdate);
        window.addEventListener('storage', handleStorage);
        return () => {
            window.removeEventListener('courses-update', handleUpdate);
            window.removeEventListener('admin-events-update', handleUpdate);
            window.removeEventListener('profile-update', handleUpdate);
            window.removeEventListener('storage', handleStorage);
        };
    }, [isAdmin]);

    const addCourse = async (courseData: Partial<Course>) => {
        try {
            const totalLessons = courseData.sections?.reduce((sum, section) => sum + (section.lessons?.length || 0), 0) || 0;
            const { data, error } = await supabase.from('courses').insert([
                {
                    title: courseData.title,
                    instructor: courseData.instructor,
                    instructor_email: courseData.instructorEmail,
                    instructor_avatar: courseData.instructorAvatar,
                    duration: courseData.duration,
                    category: courseData.category,
                    accessTier: courseData.accessTier,
                    image_url: courseData.image,
                    modules: courseData.sections, // Save sections to modules JSONB
                    description: courseData.description,
                    outcomes: courseData.outcomes,
                    lessons_total: totalLessons,
                    image_scale: courseData.imageScale !== undefined ? courseData.imageScale : 1,
                    image_pos_x: courseData.imagePositionX !== undefined ? courseData.imagePositionX : 50,
                    image_pos_y: courseData.imagePositionY !== undefined ? courseData.imagePositionY : 50,
                    is_draft: courseData.isDraft || false
                }
            ]).select().single();

            if (error) throw new Error(error.message || JSON.stringify(error));
            await fetchData(true); // Refresh silently
            window.dispatchEvent(new Event('courses-update'));
            return data;
        } catch (err: any) {
            console.error('Error adding course:', err);
            throw err;
        }
    };

    const updateCourse = async (courseId: string, courseData: Partial<Course>) => {
        try {
            const totalLessons = courseData.sections?.reduce((sum, section) => sum + (section.lessons?.length || 0), 0) || 0;
            const { data, error } = await supabase
                .from('courses')
                .update({
                    title: courseData.title,
                    instructor: courseData.instructor,
                    instructor_email: courseData.instructorEmail,
                    instructor_avatar: courseData.instructorAvatar,
                    duration: courseData.duration,
                    category: courseData.category,
                    accessTier: courseData.accessTier,
                    image_url: courseData.image,
                    modules: courseData.sections,
                    description: courseData.description,
                    outcomes: courseData.outcomes,
                    lessons_total: totalLessons,
                    image_scale: courseData.imageScale !== undefined ? courseData.imageScale : 1,
                    image_pos_x: courseData.imagePositionX !== undefined ? courseData.imagePositionX : 50,
                    image_pos_y: courseData.imagePositionY !== undefined ? courseData.imagePositionY : 50,
                    is_draft: courseData.isDraft || false
                })
                .eq('id', courseId)
                .select().single();

            if (error) throw new Error(error.message || JSON.stringify(error));
            await fetchData(true); // Refresh silently
            window.dispatchEvent(new Event('courses-update'));
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
            window.dispatchEvent(new Event('courses-update'));
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

    const updateUserRole = async (userId: string, role: UserRole) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role })
                .eq('id', userId);

            if (error) throw error;
            await fetchData(true); // Refresh silently
            window.dispatchEvent(new Event('profile-update'));
        } catch (err: any) {
            console.error('Error updating user role:', err);
            throw err;
        }
    };

    const deleteUser = async (userId: string) => {
        try {
            // First delete user's enrollments
            await supabase
                .from('enrollments')
                .delete()
                .eq('user_id', userId);

            // Delete user's profile
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;
            await fetchData(true); // Refresh silently
            window.dispatchEvent(new Event('profile-update'));
        } catch (err: any) {
            console.error('Error deleting user:', err);
            throw err;
        }
    };

    const verifyAndIssueCertificate = async (userId: string, courseId: string, certificateUrl: string) => {
        try {
            const { error } = await supabase
                .from('enrollments')
                .update({ 
                    is_certificate_verified: true,
                    certificate_url: certificateUrl 
                })
                .eq('user_id', userId)
                .eq('course_id', courseId);

            if (error) throw error;
            await fetchData(true); // Refresh silently
            window.dispatchEvent(new Event('profile-update'));
        } catch (err: any) {
            console.error('Error issuing certificate:', err);
            throw err;
        }
    };

    return { users, courses, enrollments, loading, error, addCourse, updateCourse, deleteCourse, updateCourseQuiz, updateUserRole, deleteUser, verifyAndIssueCertificate, refresh: fetchData };
};
