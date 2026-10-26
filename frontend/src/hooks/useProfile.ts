
import { useEffect, useState } from 'react';
import { supabaseClient } from '../lib/supabaseClient';
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
                const { data, error } = await supabaseClient
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
                        avatar: session?.user?.user_metadata?.avatar_url || '',
                        walletBalance: 0,
                        skills: [],
                        nationality: '',
                        dateOfBirth: '',
                        avatarScale: 1,
                        avatarPositionX: 0,
                        avatarPositionY: 0,
                        onboarding_complete: false
                    });
                } else {
                    setProfile({
                        id: data.id,
                        name: data.fullName || data.full_name || 'Student',
                        role: (() => {
                            const raw = (data.role || session?.user?.user_metadata?.role || '').toUpperCase();
                            if (raw === 'PRO') return UserRole.PRO;
                            if (raw === 'PREMIUM') return UserRole.PREMIUM;
                            if (raw === 'SPONSORED') return UserRole.SPONSORED;
                            if (raw === 'ADMIN') return UserRole.ADMIN;
                            if (raw === 'INSTRUCTOR') return UserRole.INSTRUCTOR;
                            return UserRole.INDIVIDUAL;
                        })(),
                        walletBalance: Number(data.walletBalance) || Number(data.wallet_balance) || 0,
                        skills: [], // We didn't create a skills table yet, so keep empty or add column later
                        bio: data.bio,
                        location: data.location,
                        companyName: data.companyName || data.company_name,
                        nationality: data.nationality || session?.user?.user_metadata?.nationality || '',
                        dateOfBirth: data.dateOfBirth || data.date_of_birth || session?.user?.user_metadata?.date_of_birth || '',
                        avatarScale: data.avatarScale !== undefined ? Number(data.avatarScale) : (data.avatar_scale !== undefined ? Number(data.avatar_scale) : 1),
                        avatarPositionX: data.avatarPositionX !== undefined ? Number(data.avatarPositionX) : (data.avatar_pos_x !== undefined ? Number(data.avatar_pos_x) : 0),
                        avatarPositionY: data.avatarPositionY !== undefined ? Number(data.avatarPositionY) : (data.avatar_pos_y !== undefined ? Number(data.avatar_pos_y) : 0),
                        onboarding_complete: data.onboarding_complete
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
