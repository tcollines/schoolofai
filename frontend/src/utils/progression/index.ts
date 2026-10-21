import { supabaseClient } from '../../lib/supabaseClient';

/**
 * Validates the LIVELESSON attendance code against the cohort_sessions table.
 * 
 * @param userId The ID of the student
 * @param moduleId The ID of the current module
 * @param cohortId The ID of the student's cohort
 * @param code The attendance code provided by the student
 * @returns boolean True if validated and progression is unlocked, False otherwise.
 */
export const submitAttendanceCode = async (
    userId: string, 
    moduleId: string, 
    cohortId: string, 
    code: string
): Promise<boolean> => {
    try {
        const { data, error } = await supabaseClient.rpc('validate_livelesson_attendance', {
            p_user_id: userId,
            p_module_id: moduleId,
            p_cohort_id: cohortId,
            p_code: code.trim().toUpperCase()
        });

        if (error) {
            console.error("RPC Error validating attendance:", error);
            return false;
        }

        return !!data;
    } catch (e) {
        console.error("Error calling validate_livelesson_attendance", e);
        return false;
    }
};

/**
 * Checks if the student has completed the required steps (attendance + quiz) for a module.
 * 
 * @param userId The ID of the student
 * @param moduleId The ID of the current module
 * @returns Object indicating completion status
 */
export const checkModuleCompletionStatus = async (
    userId: string,
    moduleId: string
): Promise<{ attendanceSubmitted: boolean, quizPassed: boolean }> => {
    try {
        const { data, error } = await supabaseClient
            .from('module_completions')
            .select('attendance_code_submitted, quiz_passed')
            .eq('user_id', userId)
            .eq('module_id', moduleId)
            .single();

        if (error || !data) {
            return { attendanceSubmitted: false, quizPassed: false };
        }

        return {
            attendanceSubmitted: data.attendance_code_submitted,
            quizPassed: data.quiz_passed
        };
    } catch (e) {
        console.error("Error checking module completion", e);
        return { attendanceSubmitted: false, quizPassed: false };
    }
};
