import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../src/lib/supabaseClient';
import { ArrowRight, Loader2, Star, BookOpen, Clock } from 'lucide-react';

const RecommendedCourses: React.FC = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                // Fetch a few random or top courses
                const { data, error: fetchError } = await supabase
                    .from('courses')
                    .select('*')
                    .limit(3);

                if (fetchError) throw fetchError;
                setCourses(data || []);
            } catch (err: any) {
                setError(err.message || 'Failed to load courses.');
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const handleFinishOnboarding = async () => {
        setCompleting(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found.");

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ onboarding_complete: true })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Force a full page reload to ensure the root App.tsx fetches the freshly updated profile state
            // before attempting to render the dashboard, avoiding the onboarding redirect loop.
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.message || 'Failed to complete onboarding.');
            setCompleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-sm font-extrabold text-violet-600 dark:text-violet-400 tracking-widest uppercase mb-2">Recommendations</h2>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Courses to get you started</h1>
                    <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
                        Based on your profile, we think you'll love these courses.
                    </p>
                </div>

                {error && (
                    <div className="max-w-2xl mx-auto bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 p-4 rounded-xl mb-8 text-sm text-center">
                        ⚠️ {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center my-20">
                        <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
                        {courses.map((course) => (
                            <div key={course.id} className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-slate-800 flex flex-col group hover:-translate-y-1 transition-transform duration-300">
                                <div className="h-48 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                                    {course.image_url ? (
                                        <img src={course.image_url} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-indigo-50 dark:from-violet-900/40 dark:to-indigo-900/40">
                                            <BookOpen className="w-12 h-12 text-violet-300 dark:text-violet-700" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                        4.9
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{course.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 line-clamp-2">{course.description || 'Learn the essentials in this comprehensive course.'}</p>
                                    <div className="mt-auto flex items-center gap-4 text-xs font-semibold text-gray-400 dark:text-slate-500">
                                        <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> 4h 30m</div>
                                        <div className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {course.level || 'Beginner'}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-center mt-12">
                    <button
                        onClick={handleFinishOnboarding}
                        disabled={completing}
                        className="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-full text-sm font-black uppercase tracking-wider transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {completing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Finish & Go to Dashboard'}
                        {!completing && <ArrowRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecommendedCourses;
