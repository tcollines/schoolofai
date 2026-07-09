
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
                    return {
                        id: course.id,
                        title: course.title,
                        instructor: course.instructor || 'Unknown Instructor',
                        duration: course.duration || '0h',
                        category: course.category || 'General',
                        rating: Number(course.rating) || 0,
                        lessonsTotal: course.lessons_total || 0,
                        lessonsCompleted: enrollmentsMap[course.id]?.progress || 0,
                        status: enrollmentsMap[course.id]?.status as CourseStatus || CourseStatus.NOT_STARTED,
                        image: course.image_url || 'https://picsum.photos/400/300',
                        price: Number(course.price) || 0,
                        platform: 'Welile', // Default for now
                        sections: isNewFormat ? course.modules : undefined,
                        modules: !isNewFormat ? course.modules : undefined,
                        quiz: course.quiz,
                        description: course.description,
                        outcomes: course.outcomes
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

        fetchCourses();
        window.addEventListener('courses-update', fetchCourses);
        return () => {
            window.removeEventListener('courses-update', fetchCourses);
        };
    }, [userId]);

    return { courses, loading, error };
};
