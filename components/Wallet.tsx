import React from 'react';
import { CreditCard, Download, Plus, DollarSign, Briefcase } from 'lucide-react';
import { MOCK_TRANSACTIONS, MOCK_USER } from '../constants';

const Wallet: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Wallet Header Card */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-[#1a1a2e] rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between h-64">
           {/* Background Decoration */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-welile-purple rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
           
           <div className="relative z-10 flex justify-between items-start">
             <div>
               <p className="text-gray-400 text-sm font-medium mb-1">Total Balance</p>
               <h2 className="text-4xl font-bold tracking-tight">${MOCK_USER.walletBalance.toFixed(2)}</h2>
             </div>
             <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                <CreditCard className="text-welile-lime" size={24}/>
             </div>
           </div>

           <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                 {MOCK_USER.role === 'SPONSORED' && (
                    <span className="flex items-center gap-1 bg-welile-lime text-black text-[10px] font-bold px-2 py-1 rounded-md">
                        <Briefcase size={10} /> Sponsored by {MOCK_USER.companyName}
                    </span>
                 )}
              </div>
              <div className="flex gap-3">
                 <button className="flex-1 bg-welile-purple hover:bg-purple-600 transition-colors py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2">
                    <Plus size={16} /> Top Up
                 </button>
                 <button className="flex-1 bg-white/10 hover:bg-white/20 transition-colors py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2">
                    <Download size={16} /> Statement
                 </button>
              </div>
           </div>
        </div>

        {/* Quick Actions / Payment Methods */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col justify-center space-y-4">
             <h3 className="font-bold text-gray-800">Payment Methods</h3>
             <div className="p-4 border border-gray-100 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-gray-50">
                <div className="w-10 h-6 bg-blue-600 rounded-md"></div>
                <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">Visa ending in 4242</p>
                    <p className="text-xs text-gray-400">Expires 12/25</p>
                </div>
             </div>
             <div className="p-4 border border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:border-welile-purple hover:text-welile-purple text-gray-400 transition-colors">
                <Plus size={18} />
                <span className="text-sm font-medium">Add New Method</span>
             </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-6">Transaction History</h3>
        <div className="space-y-4">
            {MOCK_TRANSACTIONS.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'CREDIT' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            {t.type === 'CREDIT' ? <Plus size={18}/> : <DollarSign size={18}/>}
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-gray-900">{t.description}</h4>
                            <p className="text-xs text-gray-400">{t.date}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`font-bold text-sm ${t.type === 'CREDIT' ? 'text-green-600' : 'text-gray-900'}`}>
                            {t.type === 'CREDIT' ? '+' : '-'}${t.amount.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium tracking-wide">{t.status}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Wallet;