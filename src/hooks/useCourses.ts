
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
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
                const { data: coursesData, error: coursesError } = await supabase
                    .from('courses')
                    .select('*');

                if (coursesError) throw coursesError;

                // Fetch user enrollments if logged in
                let enrollmentsMap: Record<string, any> = {};
                if (userId) {
                    const { data: enrollmentsData, error: enrollmentsError } = await supabase
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
                    const lessonsCompleted = enrollmentsMap[course.id]?.progress || 0;
                    const examCompleted = !!enrollmentsMap[course.id]?.exam_completed;
                    const progressPct = Math.round(
                        (course.lessons_total > 0 ? (lessonsCompleted / course.lessons_total) * 60 : 0) +
                        (examCompleted ? 40 : 0)
                    );
                    let mappedStatus = enrollmentsMap[course.id]?.status as CourseStatus || CourseStatus.NOT_STARTED;
                    if (mappedStatus === CourseStatus.COMPLETED && progressPct < 100) {
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
                        examScore: enrollmentsMap[course.id]?.exam_marks_released && enrollmentsMap[course.id]?.exam_score !== undefined 
                            ? Number(enrollmentsMap[course.id]?.exam_score) 
                            : undefined,
                        quizScore: enrollmentsMap[course.id]?.exam_marks_released && enrollmentsMap[course.id]?.quiz_score !== undefined 
                            ? Number(enrollmentsMap[course.id]?.quiz_score) 
                            : undefined,
                        finalScore: enrollmentsMap[course.id]?.exam_marks_released && enrollmentsMap[course.id]?.final_score !== undefined 
                            ? Number(enrollmentsMap[course.id]?.final_score) 
                            : undefined,
                        certificateUrl: enrollmentsMap[course.id]?.certificate_url || '',
                        isCertificateVerified: !!enrollmentsMap[course.id]?.is_certificate_verified,
                        examMarksReleased: !!enrollmentsMap[course.id]?.exam_marks_released,
                        isDraft: course.is_draft || false,
                        image: course.image_url || 'https://picsum.photos/400/300',
                        price: Number(course.price) || 0,
                        platform: 'Welile', // Default for now
                        accessTier: course.accessTier || 'FREE',
                        sections: isNewFormat ? course.modules : undefined,
                        modules: !isNewFormat ? course.modules : undefined,
                        quiz: course.quiz,
                        description: course.description,
                        outcomes: course.outcomes,
                        imageScale: course.image_scale !== undefined ? Number(course.image_scale) : 1,
                        imagePositionX: course.image_pos_x !== undefined ? Number(course.image_pos_x) : 50,
                        imagePositionY: course.image_pos_y !== undefined ? Number(course.image_pos_y) : 50
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
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('courses-update', fetchCourses);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [userId]);

    return { courses, loading, error };
};
