import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface ActivityLog {
    day: string;
    hours: number;
}

export interface ScheduleItem {
    id: string;
    title: string;
    type: string;
    time: string;
    color: string;
    icon: string;
}

export interface Assignment {
    id: string;
    title: string;
    dueDate: string;
    status: 'In Progress' | 'Completed';
}

export const useDashboard = (userId: string | undefined) => {
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }

            try {
                // Fetch Activity Logs
                const { data: activityData } = await supabase
                    .from('activity_logs')
                    .select('date, hours')
                    .eq('user_id', userId)
                    .order('date', { ascending: true })
                    .limit(7);

                // Format activity for chart (e.g., 'Mon', 'Tue')
                const formattedActivity = (activityData || []).map(log => ({
                    day: new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' }),
                    hours: log.hours
                }));

                // Fill in missing days if needed (simple version: just use what we have or default)
                // For now, let's just set state. A more robust Chart would need 7 days strictly.
                setActivity(formattedActivity);


                // Fetch Schedule
                const { data: scheduleData } = await supabase
                    .from('schedule_items')
                    .select('*')
                    .eq('user_id', userId)
                    .order('time', { ascending: true })
                    .limit(5);

                setSchedule((scheduleData || []).map(item => ({
                    ...item,
                    time: new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                })));


                // Fetch Assignments
                const { data: assignmentsData } = await supabase
                    .from('assignments')
                    .select('*')
                    .eq('user_id', userId)
                    .order('due_date', { ascending: true });

                setAssignments((assignmentsData || []).map(a => ({
                    id: a.id,
                    title: a.title,
                    dueDate: new Date(a.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
                    status: a.status as 'In Progress' | 'Completed'
                })));

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [userId]);

    return { activity, schedule, assignments, loading };
};
