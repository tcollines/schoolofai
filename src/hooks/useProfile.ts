
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../../types';

export const useProfile = (session: any) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!session?.user) {
                setProfile(null);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (error) {
                    console.error('Error fetching profile:', error);
                    // Fallback to metadata if profile doesn't exist yet (though trigger should handle it)
                    setProfile({
                        id: session.user.id,
                        name: session?.user?.user_metadata?.full_name || 'Student',
                        email: session?.user?.email || '',
                        role: UserRole.INDIVIDUAL,
                        avatar: session?.user?.user_metadata?.avatar_url || 'https://via.placeholder.com/150',
                        walletBalance: 0,
                        skills: [],
                        nationality: '',
                        dateOfBirth: '',
                        avatarScale: 1,
                        avatarPositionX: 0,
                        avatarPositionY: 0
                    });
                } else {
                    setProfile({
                        id: data.id,
                        name: data.full_name || 'Student',
                        email: data.email || '',
                        role: (['student', 'individual'].includes(data.role?.toLowerCase()) ? UserRole.INDIVIDUAL : data.role as UserRole) || UserRole.INDIVIDUAL,
                        avatar: data.avatar_url || 'https://via.placeholder.com/150',
                        walletBalance: Number(data.wallet_balance) || 0,
                        skills: [], // We didn't create a skills table yet, so keep empty or add column later
                        bio: data.bio,
                        location: data.location,
                        companyName: data.company_name,
                        careerGoal: data.career_goal,
                        nationality: data.nationality || '',
                        dateOfBirth: data.date_of_birth || '',
                        avatarScale: data.avatar_scale !== undefined ? Number(data.avatar_scale) : 1,
                        avatarPositionX: data.avatar_pos_x !== undefined ? Number(data.avatar_pos_x) : 0,
                        avatarPositionY: data.avatar_pos_y !== undefined ? Number(data.avatar_pos_y) : 0
                    });
                }
            } catch (err) {
                console.error('Unexpected error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
        window.addEventListener('profile-update', fetchProfile);
        return () => {
            window.removeEventListener('profile-update', fetchProfile);
        };
    }, [session]);

    return { profile, loading };
};
