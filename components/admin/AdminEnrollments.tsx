import React from 'react';
import { useAdmin } from '../../src/hooks/useAdmin';
import { UserRole } from '../../types';

const AdminEnrollments: React.FC = () => {
    const { users, loading } = useAdmin(true);

    if (loading) return <div>Loading enrollments...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Student Directory</h2>
                <div className="text-sm text-gray-500">Total: {users.length} registered</div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                        <tr className="text-gray-500 text-xs uppercase tracking-wider font-semibold">
                            <th className="py-4 px-6 border-b border-gray-200">Name</th>
                            <th className="py-4 px-6 border-b border-gray-200">Email</th>
                            <th className="py-4 px-6 border-b border-gray-200">Subscription Plan</th>
                            <th className="py-4 px-6 border-b border-gray-200 text-right">Wallet Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6 font-medium text-gray-900 flex items-center gap-3">
                                    <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
                                    {u.name}
                                </td>
                                <td className="py-4 px-6 text-gray-500 text-sm">{u.email}</td>
                                <td className="py-4 px-6">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                                        u.role === UserRole.INDIVIDUAL ? 'bg-gray-100 text-gray-600' :
                                        u.role === UserRole.PLUS ? 'bg-blue-100 text-blue-700' :
                                        u.role === UserRole.PRO ? 'bg-violet-100 text-violet-700' :
                                        'bg-emerald-100 text-emerald-700'
                                    }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-right font-medium text-gray-700">
                                    ${u.walletBalance?.toFixed(2) || '0.00'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminEnrollments;
