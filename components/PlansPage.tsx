import React from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';
import { UserRole } from '../types';
import { useTranslation } from './translations';

interface PlansPageProps {
    currentPlan: UserRole;
    onUpgrade: (plan: string) => void;
    onBack?: () => void;
}

const PlansPage: React.FC<PlansPageProps> = ({ currentPlan, onUpgrade, onBack }) => {
    const { t } = useTranslation();
    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('subscription_plans')}</h2>
                    <p className="text-gray-500 dark:text-slate-400 mt-2">{t('choose_plan')}</p>
                </div>
                {onBack && (
                    <button
                        onClick={onBack}
                        className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white font-medium px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        ← {t('back_to_profile')}
                    </button>
                )}
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Basic Plan */}
                <div className={`p-8 rounded-2xl bg-white dark:bg-slate-900 border ${currentPlan === 'INDIVIDUAL' ? 'border-gray-200 dark:border-slate-700' : 'border-gray-100 dark:border-slate-805'} shadow-sm relative group hover:border-welile-purple dark:hover:border-purple-600 hover:shadow-lg transition-all`}>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Basic</h3>
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Free<span className="text-lg text-gray-500 dark:text-slate-400 font-normal">/forever</span></div>
                    <p className="text-gray-600 dark:text-slate-350 mb-8">Perfect for exploring new topics and getting started.</p>

                    <div className="mb-8">
                        {currentPlan === 'INDIVIDUAL' ? (
                            <div className="w-full py-3 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-bold text-center">
                                {t('current_plan')}
                            </div>
                        ) : (
                            <button className="w-full py-3 rounded-xl border-2 border-gray-200 dark:border-slate-800 font-bold text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-700">
                                Downgrade
                            </button>
                        )}
                    </div>

                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-gray-700 dark:text-slate-300">
                            <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                            <span>Access to <strong>Introduction</strong> modules</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-400 dark:text-slate-500">
                            <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-slate-700 flex-shrink-0"></span>
                            <span>Fundamentals modules</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-400 dark:text-slate-500">
                            <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-slate-700 flex-shrink-0"></span>
                            <span>Advanced Application modules</span>
                        </li>
                    </ul>
                </div>

                {/* Plus Plan - Highlighted */}
                <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border-2 border-welile-purple shadow-xl relative transform md:-translate-y-4 z-10">
                    <div className="absolute top-0 right-0 bg-welile-purple text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">POPULAR</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Plus</h3>
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-6">$19<span className="text-lg text-gray-500 dark:text-slate-400 font-normal">/mo</span></div>
                    <p className="text-gray-600 dark:text-slate-350 mb-8">Deepen your knowledge with core concepts and theory.</p>

                    <div className="mb-8">
                        <button
                            onClick={() => onUpgrade('PLUS')}
                            className="w-full py-3 rounded-xl bg-welile-purple text-white font-bold hover:bg-purple-700 transition-all shadow-md hover:shadow-purple-200"
                        >
                            Upgrade to Plus
                        </button>
                    </div>

                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-gray-700 dark:text-slate-300">
                            <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                            <span>Access to <strong>Introduction</strong> modules</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-700 dark:text-slate-300">
                            <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                            <span>Access to <strong>Fundamentals</strong> modules</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-400 dark:text-slate-500">
                            <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-slate-700 flex-shrink-0"></span>
                            <span>Advanced Application modules</span>
                        </li>
                    </ul>
                </div>

                {/* Pro Plan */}
                <div className="p-8 rounded-2xl bg-gray-900 border border-gray-800 text-white relative overflow-hidden hover:transform hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 blur-3xl opacity-20 -mr-16 -mt-16"></div>
                    <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                    <div className="text-4xl font-bold text-white mb-6">$100<span className="text-lg text-gray-400 font-normal">/mo</span></div>
                    <p className="text-gray-400 mb-8">Master every subject with unlimited access to everything.</p>

                    <div className="mb-8">
                        {currentPlan === 'SPONSORED' ? (
                            <div className="w-full py-3 rounded-xl bg-gray-800 text-gray-400 font-bold text-center border border-gray-700">
                                Current Plan
                            </div>
                        ) : (
                            <button
                                onClick={() => onUpgrade('PRO')}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold hover:shadow-lg transition-all hover:opacity-90"
                            >
                                Upgrade to Pro
                            </button>
                        )}
                    </div>

                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-gray-300">
                            <CheckCircle size={18} className="text-purple-400 flex-shrink-0" />
                            <span>Access to <strong>Introduction</strong> modules</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-300">
                            <CheckCircle size={18} className="text-purple-400 flex-shrink-0" />
                            <span>Access to <strong>Fundamentals</strong> modules</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-300">
                            <CheckCircle size={18} className="text-purple-400 flex-shrink-0" />
                            <span>Access to <strong>All</strong> modules</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-300">
                            <Sparkles size={18} className="text-yellow-400 flex-shrink-0" />
                            <span>Unlimited <strong>AI Tutor</strong> Support</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PlansPage;
