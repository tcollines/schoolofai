import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { Plus, Edit2, Trash2, Mail, FileText, UserCheck, X, Loader } from 'lucide-react';

interface Instructor {
    id: string;
    name: string;
    email: string;
    bio: string;
    avatar: string;
    courses_count: number;
}

const AdminInstructors: React.FC = () => {
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [isOpen, setIsOpen] = useState(false);
    const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState('');

    const fetchInstructors = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('instructors').select('*');
            if (error) throw error;
            setInstructors(data || []);
        } catch (err) {
            console.error('Error fetching instructors:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstructors();
    }, []);

    const handleOpenAdd = () => {
        setEditingInstructor(null);
        setName('');
        setEmail('');
        setBio('');
        setAvatar('');
        setIsOpen(true);
    };

    const handleOpenEdit = (inst: Instructor) => {
        setEditingInstructor(inst);
        setName(inst.name);
        setEmail(inst.email);
        setBio(inst.bio);
        setAvatar(inst.avatar);
        setIsOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this instructor?')) return;
        try {
            const { error } = await supabase.from('instructors').delete().eq('id', id);
            if (error) throw error;
            fetchInstructors();
        } catch (err) {
            console.error('Error deleting instructor:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email) return;

        setIsSubmitting(true);
        try {
            if (editingInstructor) {
                const { error } = await supabase
                    .from('instructors')
                    .update({
                        name,
                        email,
                        bio,
                        avatar: avatar || name.split(' ').map(n => n[0]).join('').toUpperCase(),
                    })
                    .eq('id', editingInstructor.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('instructors')
                    .insert({
                        id: 'inst-' + Math.random().toString(36).substr(2, 9),
                        name,
                        email,
                        bio,
                        avatar: avatar || name.split(' ').map(n => n[0]).join('').toUpperCase(),
                        courses_count: 0
                    });
                if (error) throw error;
            }
            setIsOpen(false);
            fetchInstructors();
        } catch (err) {
            console.error('Error saving instructor:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <UserCheck className="text-violet-400" /> Instructor Setup
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">
                        Register and manage instructors assigned to Welile School courses.
                    </p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors cursor-pointer"
                >
                    <Plus size={18} /> Add Instructor
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                    <Loader className="animate-spin text-violet-400" size={32} />
                    <span className="text-sm font-medium">Loading instructors...</span>
                </div>
            ) : instructors.length === 0 ? (
                <div className="text-center py-16 text-slate-500 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
                    No instructors found. Click "Add Instructor" to get started.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {instructors.map((inst) => (
                        <div
                            key={inst.id}
                            className="bg-slate-900 border border-slate-800 hover:border-violet-500 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[220px]"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl -mr-12 -mt-12"></div>
                            
                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-violet-600/25 border border-violet-500/30 text-violet-400 font-bold flex items-center justify-center text-lg shrink-0 shadow-sm">
                                        {inst.avatar.length <= 3 ? inst.avatar : (
                                            <img src={inst.avatar} alt={inst.name} className="w-full h-full object-cover rounded-2xl" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white leading-tight">{inst.name}</h3>
                                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                                            <Mail size={12} className="text-slate-500" /> {inst.email}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 mb-6 bg-slate-950/40 p-3 rounded-2xl border border-slate-850">
                                    {inst.bio || 'No bio provided for this instructor.'}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-slate-850 border border-slate-800 text-slate-400 flex items-center gap-1">
                                    <FileText size={10} /> {inst.courses_count || 0} Courses
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenEdit(inst)}
                                        className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                                        title="Edit Details"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(inst.id)}
                                        className="p-2 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-xl transition-colors cursor-pointer"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 text-white max-h-[90vh] overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-bold text-center mb-6 border-b border-slate-800 pb-3">
                            {editingInstructor ? 'Edit Instructor Details' : 'Register New Instructor'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Sarah Jenkins"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="sarah.jenkins@schoolofai.edu"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Avatar Initials / Image URL (Optional)</label>
                                <input
                                    type="text"
                                    value={avatar}
                                    onChange={(e) => setAvatar(e.target.value)}
                                    placeholder="e.g. SJ or https://..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Biography</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Brief professional background description..."
                                    rows={4}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 mt-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-violet-900/20 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Saving...' : editingInstructor ? 'Save Changes' : 'Add Instructor'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInstructors;
