import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../src/lib/supabaseClient';
import { getFreeCourseIntent, learnHomePath } from '../../src/lib/acquisition';
import { getReturnTo } from '../../src/lib/returnTo';
import CountrySelect from '../CountrySelect';
import { User, Camera, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';

const ProfileSetup: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [bio, setBio] = useState('');
    const [interests, setInterests] = useState('');
    const [nationality, setNationality] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setError(null);
            const file = e.target.files?.[0];
            if (!file) return;
            
            setUploadingAvatar(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/login'); return; }

            // Create a unique file path for the avatar
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}-${Math.random()}.${fileExt}`;

            // Upload the file to the avatars bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get the public URL for the uploaded avatar
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);
        } catch (err: any) {
            setError(err.message || 'Failed to upload avatar.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!bio.trim() || !interests.trim() || !nationality || !dateOfBirth) {
            setError('Please fill out all required fields.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/login'); return; }

            // 1. Always sync profile fields to user metadata in Supabase Auth (reliable, independent of schema cache)
            try {
                await supabase.auth.updateUser({
                    data: {
                        full_name: user.user_metadata?.full_name || '',
                        bio: bio.trim(),
                        interests: interests.trim(),
                        nationality: nationality,
                        date_of_birth: dateOfBirth,
                        ...(avatarUrl ? { avatar_url: avatarUrl } : {})
                    }
                });
            } catch (metaErr) {
                console.warn('Could not update auth user metadata:', metaErr);
            }

            const updates: any = { 
                bio: bio.trim(),
                interests: interests.trim(),
                nationality: nationality,
                date_of_birth: dateOfBirth
            };
            if (avatarUrl) {
                updates.avatar_url = avatarUrl;
            }

            let { error: updateError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || '',
                    ...updates
                });

            // If Postgres schema cache errors because date_of_birth or nationality columns don't exist yet
            if (updateError && (updateError.message?.includes('column') || updateError.code === 'PGRST204')) {
                console.warn('Profiles table missing extra columns, falling back to base columns:', updateError.message);
                const safeUpdates: any = {
                    bio: bio.trim(),
                    interests: interests.trim()
                };
                if (avatarUrl) safeUpdates.avatar_url = avatarUrl;

                const retry = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        email: user.email,
                        full_name: user.user_metadata?.full_name || '',
                        ...safeUpdates
                    });
                updateError = retry.error;
            }

            if (updateError) throw updateError;

            // Came here to study the free course: skip the paid-plan steps and go straight to it
            const freeIntent = getFreeCourseIntent();
            const back = getReturnTo();
            if (back || freeIntent) {
                await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id);
                window.location.href = back || learnHomePath(freeIntent!);
                return;
            }

            navigate('/onboarding/plan');
        } catch (err: any) {
            setError(err.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-slate-800">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Set up your profile</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        Tell us a bit about yourself to personalize your experience.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 p-4 rounded-xl mb-6 text-sm">
                        <AlertTriangle className="inline-block w-4 h-4 mr-1 align-middle" />️ {error}
                    </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-violet-500 transition-colors overflow-hidden">
                                {uploadingAvatar ? (
                                    <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                                ) : avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-gray-400 group-hover:text-violet-500 transition-colors" />
                                )}
                            </div>
                            
                            {!uploadingAvatar && (
                                <div className="absolute bottom-0 right-0 bg-violet-600 rounded-full p-2 text-white shadow-md transform -translate-x-1 -translate-y-1">
                                    <Camera className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        <span className="text-xs text-gray-500 mt-3 font-medium">Click to upload avatar</span>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">Bio <span className="text-red-500">*</span></label>
                        <textarea
                            required
                            rows={3}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="I'm a software engineer looking to learn..."
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm text-gray-900 dark:text-white transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">Interests <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            value={interests}
                            onChange={(e) => setInterests(e.target.value)}
                            placeholder="e.g., Programming, Design, Business"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm text-gray-900 dark:text-white transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300" htmlFor="nationality">Country <span className="text-red-500">*</span></label>
                            <CountrySelect id="nationality" required value={nationality} onChange={setNationality} placeholder="Search your country" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">Date of Birth <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                required
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm text-gray-900 dark:text-white transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={loading || uploadingAvatar || !bio.trim() || !interests.trim() || !nationality || !dateOfBirth}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-full text-sm font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetup;
