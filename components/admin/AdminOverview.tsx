import React from 'react';
import { useAdmin } from '../../src/hooks/useAdmin';
import { Users, BookOpen, TrendingUp, DollarSign } from 'lucide-react';

const AdminOverview: React.FC = () => {
    const { users, courses, loading } = useAdmin(true);

    if (loading) return <div>Loading statistics...</div>;

    const totalRevenue = users.filter(u => u.role === 'PLUS' || u.role === 'PRO').length * 29; // Mock calculation
    const paidUsers = users.filter(u => u.role !== 'INDIVIDUAL').length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Students</p>
                        <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Active Courses</p>
                        <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Paid Subscriptions</p>
                        <p className="text-2xl font-bold text-gray-900">{paidUsers}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Monthly Rev (Est)</p>
                        <p className="text-2xl font-bold text-gray-900">${totalRevenue}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">System Notifications</h3>
                <div className="text-gray-500 italic text-sm">No new alerts. System operating normally.</div>
            </div>
        </div>
    );
};

export default AdminOverview;
