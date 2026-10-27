
import { useEffect, useState } from 'react';
import { supabaseClient } from '../lib/supabaseClient';
import { Course, CourseStatus } from '../../types';

export const useCourses = (userId: string | undefined) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);

                // Fetch all courses
                const { data: coursesData, error: coursesError } = await supabaseClient
                    .from('courses')
                    .select('*');

                if (coursesError) throw coursesError;

                // Fetch user enrollments if logged in
                let enrollmentsMap: Record<string, any> = {};
                if (userId) {
                    const { data: enrollmentsData, error: enrollmentsError } = await supabaseClient
                        .from('enrollments')
                        .select('*')
                        .eq('user_id', userId);

                    if (enrollmentsError) throw enrollmentsError;

                    if (enrollmentsData) {
                        enrollmentsData.forEach((e: any) => {
                            enrollmentsMap[e.course_id] = e;
                        });
                    }
                }

                // Merge data
                const formattedCourses: Course[] = (coursesData || []).map((course: any) => {
                    const isNewFormat = Array.isArray(course.modules) && course.modules.length > 0 && 'lessons' in course.modules[0];
                    const scheduleData = (course.sections && typeof course.sections === 'object' && !Array.isArray(course.sections)) ? course.sections : {};
                    const resolvedSections = isNewFormat
                        ? course.modules
                        : (Array.isArray(scheduleData.sections) && scheduleData.sections.length > 0
                            ? scheduleData.sections
                            : (Array.isArray(course.sections) ? course.sections : undefined));
                    const enrollment = enrollmentsMap[course.id];
                    const quizSub = (userId && course.quiz && course.quiz.submissions) ? course.quiz.submissions[userId] : undefined;
                    const lessonsCompleted = enrollment?.progress || 0;
                    const examCompleted = !!(enrollment?.exam_completed ?? quizSub?.examCompleted);
                    const examMarksReleased = !!(enrollment?.exam_marks_released ?? quizSub?.examMarksReleased);
                    const rawExamScore = enrollment?.exam_score !== undefined ? enrollment.exam_score : quizSub?.examScore;
                    const rawQuizScore = enrollment?.quiz_score !== undefined ? enrollment.quiz_score : quizSub?.quizScore;
                    const rawFinalScore = enrollment?.final_score !== undefined ? enrollment.final_score : quizSub?.finalScore;

                    const progressPct = Math.round(
                        (course.lessons_total > 0 ? (lessonsCompleted / course.lessons_total) * 60 : 0) +
                        (examCompleted ? 40 : 0)
                    );
                    let mappedStatus = enrollment?.status as CourseStatus || CourseStatus.NOT_STARTED;
                    if (mappedStatus === CourseStatus.COMPLETED && progressPct < 100 && course.quiz && !course.quiz.isDraft) {
                        mappedStatus = CourseStatus.IN_PROGRESS;
                    }

                    return {
                        id: course.id,
                        title: course.title,
                        instructor: course.instructor || 'Unknown Instructor',
                        instructorEmail: course.instructor_email || '',
                        instructorAvatar: course.instructor_avatar || '',
                        duration: course.duration || '0h',
                        category: course.category || 'General',
                        rating: Number(course.rating) || 0,
                        lessonsTotal: course.lessons_total || 0,
                        lessonsCompleted: lessonsCompleted,
                        status: mappedStatus,
                        examCompleted: examCompleted,
                        examScore: examMarksReleased && rawExamScore !== undefined 
                            ? Number(rawExamScore) 
                            : undefined,
                        quizScore: examMarksReleased && rawQuizScore !== undefined 
                            ? Number(rawQuizScore) 
                            : undefined,
                        finalScore: examMarksReleased && rawFinalScore !== undefined 
                            ? Number(rawFinalScore) 
                            : undefined,
                        certificateUrl: enrollment?.certificate_url || '',
                        isCertificateVerified: !!enrollment?.is_certificate_verified,
                        examMarksReleased: examMarksReleased,
                        isDraft: course.is_draft || false,
                        isVerified: course.is_verified !== undefined ? !!course.is_verified : true,
                        image: course.image || course.imageUrl || course.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
                        price: Number(course.price) || 0,
                        platform: course.platform || 'Welile',
                        accessTier: course.accessTier || course.access_tier || 'FREE',
                        partnerId: scheduleData.partnerId || course.partner_id || '',
                        tutorId: scheduleData.tutorId || course.tutor_id || '',
                        level: scheduleData.level || course.level || 'Beginner',
                        defaultLessonDuration: scheduleData.defaultLessonDuration || '1 hour',
                        sections: resolvedSections,
                        modules: !isNewFormat ? course.modules : undefined,
                        quiz: course.quiz,
                        description: course.description,
                        outcomes: course.outcomes,
                        imageScale: course.image_scale !== undefined ? Number(course.image_scale) : 1,
                        imagePositionX: course.image_pos_x !== undefined ? Number(course.image_pos_x) : 50,
                        imagePositionY: course.image_pos_y !== undefined ? Number(course.image_pos_y) : 50,
                        courseIntroVideoUrl: scheduleData.courseIntroVideoUrl || course.course_intro_video_url || '',
                        startDate: scheduleData.startDate || course.start_date || '',
                        endDate: scheduleData.endDate || course.end_date || '',
                        lessonDays: scheduleData.lessonDays || course.lesson_days || ['Monday', 'Wednesday', 'Friday'],
                        lessonStartTime: scheduleData.lessonStartTime || course.lesson_start_time || '18:00',
                        lessonEndTime: scheduleData.lessonEndTime || course.lesson_end_time || '20:00',
                        timezone: scheduleData.timezone || course.timezone || 'EAT (UTC+3)',
                        meetingLink: scheduleData.meetingLink || course.meeting_link || '',
                        attendanceCode: scheduleData.attendanceCode || course.attendance_code || '',
                        cohortName: scheduleData.cohortName || course.cohort_name || 'Cohort 1',
                        cohorts: scheduleData.cohorts || course.cohorts || [],
                        quizDate: scheduleData.quizDate || course.quiz_date || '',
                        examDate: scheduleData.examDate || course.exam_date || ''
                    };
                });

                setCourses(formattedCourses);
            } catch (err: any) {
                console.error('Error fetching courses:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'welile_local_db') {
                fetchCourses();
            }
        };

        fetchCourses();
        window.addEventListener('courses-update', fetchCourses);
        window.addEventListener('focus', fetchCourses);
        window.addEventListener('storage', handleStorageChange);

        const realtimeChannel = supabaseClient
            .channel(`student-courses-sync-${userId || 'anon'}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
                fetchCourses();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments' }, () => {
                fetchCourses();
            })
            .subscribe();

        return () => {
            window.removeEventListener('courses-update', fetchCourses);
            window.removeEventListener('focus', fetchCourses);
            window.removeEventListener('storage', handleStorageChange);
            supabaseClient.removeChannel(realtimeChannel);
        };
    }, [userId]);

    return { courses, loading, error };
};
