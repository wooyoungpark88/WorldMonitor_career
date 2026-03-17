import { useState } from 'react';
import FinancialAnalysis from '../../../components/study/FinancialAnalysis';
import PricingLab from '../../../components/study/PricingLab';
import SROICalculator from '../../../components/study/SROICalculator';
import PitchDeck from '../../../components/study/PitchDeck';
import StreakCalendar from '../../../components/study/StreakCalendar';
import { useStudyStore } from '../../../stores/studyStore';

export default function StudyDashboard() {
  const currentSession = useStudyStore(state => state.currentSession);
  const [activeTab, setActiveTab] = useState<'home' | 'financial' | 'pricing' | 'sroi' | 'pitch'>('home');

  if (currentSession && activeTab !== 'home') {
    return (
      <div className="h-full flex flex-col max-w-5xl mx-auto py-2">
        <button 
          onClick={() => {
            useStudyStore.setState({ currentSession: null });
            setActiveTab('home');
          }}
          className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4 self-start"
        >
          ← Back to Study Dashboard
        </button>
        {activeTab === 'financial' && <FinancialAnalysis />}
        {activeTab === 'pricing' && <PricingLab />}
        {activeTab === 'sroi' && <SROICalculator />}
        {activeTab === 'pitch' && <PitchDeck />}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-3">
        📖 Study (5-Step Session)
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <button 
          onClick={() => setActiveTab('financial')}
          className="flex flex-col items-center p-8 bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl transition-all shadow-sm group"
        >
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="text-xl">📊</span>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">Financial Analysis</h3>
          <p className="text-xs text-center text-gray-500">Read DART/SEC reports</p>
        </button>

        <button 
          onClick={() => setActiveTab('pricing')}
          className="flex flex-col items-center p-8 bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl transition-all shadow-sm group"
        >
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="text-xl">🏷️</span>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">Pricing Lab</h3>
          <p className="text-xs text-center text-gray-500">Bidding & B2G strategies</p>
        </button>

        <button 
          onClick={() => setActiveTab('sroi')}
          className="flex flex-col items-center p-8 bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 hover:border-purple-500 dark:hover:border-purple-500 rounded-xl transition-all shadow-sm group"
        >
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="text-xl">🌍</span>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">SROI Calculator</h3>
          <p className="text-xs text-center text-gray-500">Quantify social impact</p>
        </button>

        <button 
          onClick={() => setActiveTab('pitch')}
          className="flex flex-col items-center p-8 bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 hover:border-amber-500 dark:hover:border-amber-500 rounded-xl transition-all shadow-sm group"
        >
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="text-xl">🎤</span>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">Pitch Deck</h3>
          <p className="text-xs text-center text-gray-500">Sales & field stories</p>
        </button>
      </div>

      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center flex-1">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Weekly Deep Work Tracking</h3>
        <StreakCalendar />
      </div>
    </div>
  );
}
