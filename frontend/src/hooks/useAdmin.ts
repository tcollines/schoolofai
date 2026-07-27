import { useState, useEffect } from 'react';
import { mysqlClient } from '../lib/mysqlClient';
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
            const { data: usersData, error: profilesError } = await mysqlClient
                .from('profiles')
                .select('*');
            
            if (profilesError) throw profilesError;

            const formattedUsers: UserProfile[] = (usersData || []).map((p: any) => ({
                id: p.id,
                name: p.fullName || p.full_name || 'Student',
                email: p.email || '',
                role: (p.role as UserRole) || UserRole.INDIVIDUAL,
                avatar: p.avatarUrl || p.avatar_url || '',
                walletBalance: Number(p.walletBalance) || Number(p.wallet_balance) || 0,
                skills: [],
                companyName: p.companyName || p.company_name,
                pending_role: p.pending_role,
                pending_txid: p.pending_txid,
                pending_screenshot: p.pending_screenshot,
                nationality: p.nationality,
                dateOfBirth: p.dateOfBirth || p.date_of_birth,
                avatarScale: p.avatarScale !== undefined ? Number(p.avatarScale) : (p.avatar_scale !== undefined ? Number(p.avatar_scale) : 1),
                avatarPositionX: p.avatarPositionX !== undefined ? Number(p.avatarPositionX) : (p.avatar_pos_x !== undefined ? Number(p.avatar_pos_x) : 0),
                avatarPositionY: p.avatarPositionY !== undefined ? Number(p.avatarPositionY) : (p.avatar_pos_y !== undefined ? Number(p.avatar_pos_y) : 0),
                password: p.password
            }));
            setUsers(formattedUsers);

            // Fetch Courses
            const { data: coursesData, error: coursesError } = await mysqlClient
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
                    isVerified: c.is_verified !== undefined ? !!c.is_verified : true,
                    image: c.image || c.imageUrl || c.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
                    price: Number(c.price) || 0,
                    platform: c.platform || 'Welile',
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
            const { data: enrollmentsData, error: enrollmentsError } = await mysqlClient
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
            const { data, error } = await mysqlClient.from('courses').insert([
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
                    is_draft: courseData.isDraft || false,
                    is_verified: courseData.isVerified !== undefined ? courseData.isVerified : true,
                    price: courseData.price !== undefined ? courseData.price : 0,
                    platform: courseData.platform || 'Welile'
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
            const { data, error } = await mysqlClient
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
                    is_draft: courseData.isDraft || false,
                    is_verified: courseData.isVerified !== undefined ? courseData.isVerified : true,
                    price: courseData.price !== undefined ? courseData.price : 0,
                    platform: courseData.platform || 'Welile'
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
            // Delete the course from courses table (MySQL cascade delete handles enrollments automatically)
            const { data, error } = await mysqlClient
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

    const updateCourseQuiz = async (courseId: string, quizData: any, extraFields: any = {}) => {
        try {
            const { data, error } = await mysqlClient
                .from('courses')
                .update({ quiz: quizData, ...extraFields })
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
            // Get user's email before updating to handle instructors cleanup
            const { data: profile } = await mysqlClient
                .from('profiles')
                .select('email')
                .eq('id', userId)
                .single();

            const { error } = await mysqlClient
                .from('profiles')
                .update({ role })
                .eq('id', userId);

            if (error) throw error;

            if (role !== UserRole.INSTRUCTOR && role !== UserRole.ADMIN && profile?.email) {
                // Delete from instructors table so they disappear from instructors page
                await mysqlClient
                    .from('instructors')
                    .delete()
                    .eq('email', profile.email.trim().toLowerCase());
            }

            await fetchData(true); // Refresh silently
            window.dispatchEvent(new Event('profile-update'));
        } catch (err: any) {
            console.error('Error updating user role:', err);
            throw err;
        }
    };

    const updateUserWallet = async (userId: string, balance: number) => {
        try {
            const { error } = await mysqlClient
                .from('profiles')
                .update({ wallet_balance: balance })
                .eq('id', userId);

            if (error) throw error;
            await fetchData(true); // Refresh silently
            window.dispatchEvent(new Event('profile-update'));
        } catch (err: any) {
            console.error('Error updating user wallet balance:', err);
            throw err;
        }
    };

    const deleteUser = async (userId: string) => {
        try {
            // Get user's email to delete instructor if exists
            const { data: profile } = await mysqlClient
                .from('profiles')
                .select('email')
                .eq('id', userId)
                .single();

            if (profile?.email) {
                // Fetch the instructor list to delete by ID since delete-by-email is unsupported
                const { data: instructors } = await mysqlClient
                    .from('instructors')
                    .select('*');
                
                const instructor = (instructors || []).find(
                    (inst: any) => inst.email?.trim().toLowerCase() === profile.email.trim().toLowerCase()
                );
                
                if (instructor) {
                    await mysqlClient
                        .from('instructors')
                        .delete()
                        .eq('id', instructor.id);
                }
            }

            // Delete user's profile (the database schema ON DELETE CASCADE will handle deleting their enrollments)
            const { error } = await mysqlClient
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            // Clear local storage keys associated with the deleted user
            if (profile?.email) {
                const emailClean = profile.email.trim().toLowerCase();
                localStorage.removeItem(`quiz-grades-${emailClean}`);
                localStorage.removeItem(`profile-education-${emailClean}`);
                localStorage.removeItem(`recent-tapped-course-id-${emailClean}`);
                localStorage.removeItem(`portal-notifications-${emailClean}`);
                
                localStorage.removeItem(`quiz-grades-${profile.email}`);
                localStorage.removeItem(`profile-education-${profile.email}`);
                localStorage.removeItem(`recent-tapped-course-id-${profile.email}`);
                localStorage.removeItem(`portal-notifications-${profile.email}`);
            }
            
            localStorage.removeItem(`student-profile-${userId}`);
            localStorage.removeItem(`student-assignments-status-${userId}`);
            localStorage.removeItem(`student-assignments-submissions-${userId}`);
            localStorage.removeItem(`user-avatar-${userId}`);
            localStorage.removeItem(`user-avatar-scale-${userId}`);
            localStorage.removeItem(`user-avatar-pos-x-${userId}`);
            localStorage.removeItem(`user-avatar-pos-y-${userId}`);
            localStorage.removeItem(`schoolofai-rating-${userId}`);

            await fetchData(true); // Refresh silently
            window.dispatchEvent(new Event('profile-update'));
        } catch (err: any) {
            console.error('Error deleting user:', err);
            throw err;
        }
    };

    const verifyAndIssueCertificate = async (userId: string, courseId: string, certificateUrl: string) => {
        try {
            const { error } = await mysqlClient
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

    const releaseExamMarks = async (userId: string, courseId: string) => {
        try {
            const { error } = await mysqlClient
                .from('enrollments')
                .update({ 
                    exam_marks_released: true
                })
                .eq('user_id', userId)
                .eq('course_id', courseId);

            if (error) throw error;
            await fetchData(true); // Refresh silently
            window.dispatchEvent(new Event('profile-update'));
        } catch (err: any) {
            console.error('Error releasing exam marks:', err);
            throw err;
        }
    };

    return { users, courses, enrollments, loading, error, addCourse, updateCourse, deleteCourse, updateCourseQuiz, updateUserRole, deleteUser, verifyAndIssueCertificate, releaseExamMarks, updateUserWallet, refresh: fetchData };
};
