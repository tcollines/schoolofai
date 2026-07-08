import React, { useState, useEffect, useRef } from 'react';
import { User, MapPin, Briefcase, GraduationCap, Save, Camera, FileImage, Cloud, X, Loader } from 'lucide-react';
import { UserProfile } from '../types';
import { useTranslation } from './translations';

const DefaultAvatar = () => (
    <svg viewBox="0 0 128 128" className="w-full h-full text-gray-400 dark:text-slate-500 fill-current bg-gray-100 dark:bg-slate-800">
        <path d="M64 8a26 26 0 100 52 26 26 0 000-52zm0 60c-29.07 0-52.61 20.62-55.77 48h111.54C116.61 88.62 93.07 68 64 68z" />
    </svg>
);

interface AvatarUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectImage: (imageUrl: string) => void;
}

const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({ isOpen, onClose, onSelectImage }) => {
    const [source, setSource] = useState<'menu' | 'camera' | 'google' | 'icloud'>('menu');
    const [loading, setLoading] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Mock stock photos for Google & iCloud Photos
    const mockPhotos = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=60"
    ];

    useEffect(() => {
        if (source === 'google' || source === 'icloud') {
            setLoading(true);
            const timer = setTimeout(() => setLoading(false), 1200);
            return () => clearTimeout(timer);
        }
    }, [source]);

    useEffect(() => {
        if (source === 'camera') {
            navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300 } })
                .then(stream => {
                    setCameraStream(stream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(err => {
                    console.error("Camera access error:", err);
                    alert("Unable to access camera. Please check permissions.");
                    setSource('menu');
                });
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [source]);

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
    };

    const handleCapture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 300;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, 300, 300);
                const dataUrl = canvas.toDataURL('image/jpeg');
                onSelectImage(dataUrl);
                onClose();
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    onSelectImage(reader.result);
                    onClose();
                }
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-205">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    <X size={20} />
                </button>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 text-center">
                    {source === 'menu' && 'Choose Photo Source'}
                    {source === 'camera' && 'Take Profile Picture'}
                    {source === 'google' && 'Import from Google Photos'}
                    {source === 'icloud' && 'Import from iCloud'}
                </h3>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                />

                {source === 'menu' && (
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setSource('camera')}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-850 hover:bg-violet-50/50 dark:hover:bg-slate-800/40 hover:border-violet-300 dark:hover:border-slate-700 transition-all text-center gap-3"
                        >
                            <span className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                                <Camera size={24} />
                            </span>
                            <span className="text-sm font-bold text-gray-800 dark:text-slate-200">Use Camera</span>
                        </button>

                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-850 hover:bg-violet-50/50 dark:hover:bg-slate-800/40 hover:border-violet-300 dark:hover:border-slate-700 transition-all text-center gap-3"
                        >
                            <span className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
                                <FileImage size={24} />
                            </span>
                            <span className="text-sm font-bold text-gray-800 dark:text-slate-200">Upload Files</span>
                        </button>

                        <button 
                            onClick={() => setSource('google')}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-850 hover:bg-violet-50/50 dark:hover:bg-slate-800/40 hover:border-violet-300 dark:hover:border-slate-700 transition-all text-center gap-3"
                        >
                            <span className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
                                <Cloud size={24} />
                            </span>
                            <span className="text-sm font-bold text-gray-800 dark:text-slate-200">Google Photos</span>
                        </button>

                        <button 
                            onClick={() => setSource('icloud')}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-850 hover:bg-violet-50/50 dark:hover:bg-slate-800/40 hover:border-violet-300 dark:hover:border-slate-700 transition-all text-center gap-3"
                        >
                            <span className="p-3 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-xl">
                                <Cloud size={24} />
                            </span>
                            <span className="text-sm font-bold text-gray-800 dark:text-slate-200">iCloud Photos</span>
                        </button>
                    </div>
                )}

                {source === 'camera' && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative w-72 h-72 rounded-full overflow-hidden border-4 border-gray-100 dark:border-slate-800 bg-black">
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                className="w-full h-full object-cover scale-x-[-1]" 
                            />
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setSource('menu')}
                                className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-850"
                            >
                                Back
                            </button>
                            <button 
                                onClick={handleCapture}
                                className="px-6 py-2.5 rounded-xl bg-welile-lime text-black font-bold text-sm hover:bg-lime-400"
                            >
                                Capture Photo
                            </button>
                        </div>
                    </div>
                )}

                {(source === 'google' || source === 'icloud') && (
                    <div className="flex flex-col items-center gap-6">
                        {loading ? (
                            <div className="py-12 flex flex-col items-center gap-3">
                                <Loader className="animate-spin text-welile-purple w-8 h-8" />
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Fetching photos stream...</p>
                            </div>
                        ) : (
                            <div className="w-full">
                                <p className="text-xs text-gray-500 dark:text-slate-400 mb-4 text-center">Select a photo from your library to set as profile avatar:</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {mockPhotos.map((url, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => {
                                                onSelectImage(url);
                                                onClose();
                                            }}
                                            className="aspect-square rounded-2xl overflow-hidden cursor-pointer hover:ring-4 hover:ring-welile-purple/50 border border-gray-100 dark:border-slate-800 transition-all"
                                        >
                                            <img src={url} alt="Mock photo" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => setSource('menu')}
                                    className="w-full mt-6 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-850"
                                >
                                    Back
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

interface ProfileProps {
    user?: UserProfile;
    onUpgradeClick?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpgradeClick }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<UserProfile | undefined>(() => {
        if (user) {
            return {
                ...user,
                avatar: localStorage.getItem('user-avatar') || user.avatar
            };
        }
        return user;
    });
    const [avatarError, setAvatarError] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                ...user,
                avatar: localStorage.getItem('user-avatar') || user.avatar
            });
            setAvatarError(false);
        }
    }, [user]);

    const handleSelectImage = (imageUrl: string) => {
        if (formData) {
            const updated = {
                ...formData,
                avatar: imageUrl
            };
            setFormData(updated);
            setAvatarError(false);
            
            localStorage.setItem('user-avatar', imageUrl);
            window.dispatchEvent(new Event('profile-update'));
        }
    };

    if (!formData) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('my_profile')}</h2>
                <button className="flex items-center gap-2 bg-welile-purple text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 shadow-md shadow-purple-200 dark:shadow-none">
                    <Save size={16} /> {t('save_changes')}
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">

                {/* Left Col: Avatar & Status */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 text-center shadow-sm">
                        <div className="relative inline-block">
                            {!formData.avatar || avatarError ? (
                                <div className="w-24 h-24 rounded-full mx-auto overflow-hidden border-4 border-gray-50 dark:border-slate-850 flex items-center justify-center bg-gray-100 dark:bg-slate-800">
                                    <DefaultAvatar />
                                </div>
                            ) : (
                                <img 
                                    src={formData.avatar} 
                                    alt="Profile" 
                                    onError={() => setAvatarError(true)}
                                    className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-gray-50 dark:border-slate-850" 
                                />
                            )}
                            <button 
                                onClick={() => setShowUploadModal(true)}
                                className="absolute bottom-0 right-0 bg-welile-lime text-black p-1.5 rounded-full border-2 border-white dark:border-slate-900 hover:bg-lime-400 cursor-pointer"
                            >
                                <Camera size={14} />
                            </button>
                        </div>
                        <h3 className="mt-4 font-bold text-lg text-gray-900 dark:text-white">{formData.name}</h3>
                        <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">{formData.email}</p>
                        <div className="inline-block bg-purple-50 dark:bg-purple-950/30 text-welile-purple dark:text-purple-400 text-xs font-bold px-3 py-1 rounded-full border border-purple-100 dark:border-purple-900/50">
                            {formData.role === 'SPONSORED' ? 'Enterprise Plan' : formData.role === 'INDIVIDUAL' ? 'Basic Plan' : (formData.role || '').replace('_', ' ')}
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-50 dark:border-slate-800">
                            <button
                                onClick={onUpgradeClick}
                                className="w-full bg-black dark:bg-violet-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 dark:hover:bg-violet-700 transition-colors shadow-lg shadow-gray-200 dark:shadow-none"
                            >
                                Upgrade Plan
                            </button>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">Unlock premium features & courses</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Briefcase size={16} className="text-gray-400 dark:text-slate-500" /> Employment
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Company</label>
                                <p className="font-medium text-gray-800 dark:text-slate-200">{formData.companyName || 'Not Employed'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Career Goal</label>
                                <p className="font-medium text-gray-800 dark:text-slate-200">{formData.careerGoal}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Forms */}
                <div className="md:col-span-2 space-y-6">

                    {/* Personal Details */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 pb-4 border-b border-gray-50 dark:border-slate-800">
                            <User size={18} className="text-welile-purple" /> Personal Information
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-600 dark:text-slate-350">Full Name</label>
                                <input type="text" defaultValue={formData.name} className="w-full p-2 bg-gray-50 dark:bg-slate-805 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-600 dark:text-slate-355">Date of Birth</label>
                                <input type="date" className="w-full p-2 bg-gray-50 dark:bg-slate-805 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-600 dark:text-slate-355">Phone</label>
                                <input type="tel" placeholder="+1 234 567 890" className="w-full p-2 bg-gray-50 dark:bg-slate-805 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-600 dark:text-slate-355">Nationality</label>
                                <select className="w-full p-2 bg-gray-50 dark:bg-slate-805 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20">
                                    <option>South Africa</option>
                                    <option>Nigeria</option>
                                    <option>Kenya</option>
                                    <option>United Kingdom</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Residency */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 pb-4 border-b border-gray-50 dark:border-slate-800">
                            <MapPin size={18} className="text-welile-purple" /> Residency
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-sm font-medium text-gray-600 dark:text-slate-355">Physical Address</label>
                                <input type="text" defaultValue={formData.location} className="w-full p-2 bg-gray-50 dark:bg-slate-805 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-600 dark:text-slate-355">City</label>
                                <input type="text" className="w-full p-2 bg-gray-50 dark:bg-slate-805 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-600 dark:text-slate-355">Zip Code</label>
                                <input type="text" className="w-full p-2 bg-gray-50 dark:bg-slate-805 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20" />
                            </div>
                        </div>
                    </div>

                    {/* Academic */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 pb-4 border-b border-gray-50 dark:border-slate-800">
                            <GraduationCap size={18} className="text-welile-purple" /> Education
                        </h4>
                        <div className="space-y-4">
                            <div className="p-4 border border-gray-100 dark:border-slate-800 rounded-xl flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-850 cursor-pointer">
                                <div>
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">University of Cape Town</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">Bachelor of Science in Computer Science</p>
                                </div>
                                <span className="text-xs bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">Completed</span>
                            </div>
                            <button className="w-full py-2 border border-dashed border-gray-300 dark:border-slate-700 rounded-xl text-gray-500 dark:text-slate-400 text-sm hover:border-welile-purple hover:text-welile-purple transition-colors">
                                + Add Education
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            <AvatarUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSelectImage={handleSelectImage}
            />
        </div>
    );
};

export default Profile;