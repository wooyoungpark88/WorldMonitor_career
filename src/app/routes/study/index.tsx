import { useState } from 'react';
import { Link } from 'wouter';
import FinancialAnalysis from '../../../components/study/FinancialAnalysis';
import PricingLab from '../../../components/study/PricingLab';
import SROICalculator from '../../../components/study/SROICalculator';
import PitchDeck from '../../../components/study/PitchDeck';
import StreakCalendar from '../../../components/study/StreakCalendar';
import { useStudyStore } from '../../../stores/studyStore';
import { getTodaySchedule } from '../../../services/dailyBriefSchedule';
import WeeklyReview from '../../../components/study/WeeklyReview';
import { exportSROIToCSV } from '../../../services/exportService';

export default function StudyDashboard() {
  const currentSession = useStudyStore(state => state.currentSession);
  const [activeTab, setActiveTab] = useState<'home' | 'financial' | 'pricing' | 'sroi' | 'pitch' | 'weekly'>('home');

  if (activeTab === 'weekly') {
    return (
      <div className="h-full flex flex-col max-w-5xl mx-auto py-2">
        <button 
          onClick={() => setActiveTab('home')}
          className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4 self-start"
        >
          ← Back to Study Dashboard
        </button>
        <WeeklyReview />
      </div>
    );
  }

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

  const todaySchedule = getTodaySchedule();

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-3">
        📖 Study (5-Step Session)
      </h1>

      {/* Daily Brief - 오늘의 학습 루틴 */}
      <div className="mb-8 bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          오늘의 학습 ({todaySchedule.dayName}요일)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[todaySchedule.morning, todaySchedule.lunch, todaySchedule.evening].map((item) => (
            <Link
              key={item.id}
              href={item.route ?? '/study'}
              className="flex flex-col p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase text-gray-400 mb-1">{item.duration}</span>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">{item.label}</h4>
              <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
      
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
          onClick={async () => {
            try {
              await exportSROIToCSV();
            } catch (e) {
              alert('내보내기 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
            }
          }}
          className="flex flex-col items-center p-6 bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl transition-all shadow-sm group"
        >
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <span className="text-lg">📤</span>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-sm">SROI 내보내기</h3>
          <p className="text-xs text-center text-gray-500">CSV 다운로드</p>
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

        <button 
          onClick={() => setActiveTab('weekly')}
          className="flex flex-col items-center p-8 bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl transition-all shadow-sm group"
        >
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="text-xl">📋</span>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">주간 정리</h3>
          <p className="text-xs text-center text-gray-500">5개 질문으로 주간 마무리</p>
        </button>
      </div>

      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center flex-1">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Weekly Deep Work Tracking</h3>
        <StreakCalendar />
      </div>
    </div>
  );
}
