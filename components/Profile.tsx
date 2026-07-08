import React, { useState, useEffect } from 'react';
import { User, MapPin, Briefcase, GraduationCap, Save } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileProps {
    user?: UserProfile;
    onUpgradeClick?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpgradeClick }) => {
    const [formData, setFormData] = useState<UserProfile | undefined>(user);

    useEffect(() => {
        setFormData(user);
    }, [user]);

    if (!formData) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h2>
                <button className="flex items-center gap-2 bg-welile-purple text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 shadow-md shadow-purple-200 dark:shadow-none">
                    <Save size={16} /> Save Changes
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">

                {/* Left Col: Avatar & Status */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 text-center shadow-sm">
                        <div className="relative inline-block">
                            <img src={formData.avatar} alt="Profile" className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-gray-50 dark:border-slate-850" />
                            <button className="absolute bottom-0 right-0 bg-welile-lime text-black p-1.5 rounded-full border-2 border-white dark:border-slate-900 hover:bg-lime-400">
                                <User size={14} />
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
        </div>
    );
};

export default Profile;