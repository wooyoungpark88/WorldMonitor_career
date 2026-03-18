import { useState } from 'react';
import { useSettingsStore } from '../../../stores/settingsStore';
import { Plus, X, Bell, BookOpen, Tag, Database, Check } from 'lucide-react';

const FOCUS_AREA_OPTIONS = [
  { id: 'financial', label: '재무 분석' },
  { id: 'pricing', label: '가격 설계' },
  { id: 'sroi', label: 'SROI/임팩트' },
  { id: 'pitch', label: '피칭/영업' },
  { id: 'regulation', label: '규제/정책' },
  { id: 'benchmark', label: '경쟁사 분석' },
];

export default function Settings() {
  const {
    customKeywords, alertThreshold, weeklyGoalMinutes, focusAreas, telegramEnabled,
    setCustomKeywords, setAlertThreshold, setWeeklyGoalMinutes, setFocusAreas, setTelegramEnabled,
  } = useSettingsStore();

  const [newKeyword, setNewKeyword] = useState('');
  const [saved, setSaved] = useState<string | null>(null);

  const flash = (section: string) => {
    setSaved(section);
    setTimeout(() => setSaved(null), 1500);
  };

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (!kw || customKeywords.includes(kw)) return;
    setCustomKeywords([...customKeywords, kw]);
    setNewKeyword('');
    flash('keywords');
  };

  const removeKeyword = (kw: string) => {
    setCustomKeywords(customKeywords.filter((k) => k !== kw));
    flash('keywords');
  };

  const toggleFocusArea = (id: string) => {
    const next = focusAreas.includes(id)
      ? focusAreas.filter((a) => a !== id)
      : [...focusAreas, id];
    setFocusAreas(next);
    flash('focus');
  };

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-3">
        ⚙️ Settings
      </h1>
      <div className="space-y-6">
        {/* Custom Keywords */}
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-500" /> 관심 키워드
            </h2>
            {saved === 'keywords' && <span className="text-xs text-emerald-500 flex items-center gap-1"><Check className="w-3 h-3" /> 저장됨</span>}
          </div>
          <p className="text-sm text-gray-500 mb-4">기본 키워드 외에 추가로 트래킹할 키워드를 설정합니다.</p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
              placeholder="새 키워드 입력"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#0a0f0a] focus:ring-1 focus:ring-emerald-500 outline-none"
            />
            <button onClick={addKeyword} className="flex items-center gap-1 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              <Plus className="w-4 h-4" /> 추가
            </button>
          </div>
          {customKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {customKeywords.map((kw) => (
                <span key={kw} className="flex items-center gap-1 text-sm px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full">
                  {kw}
                  <button onClick={() => removeKeyword(kw)} className="hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">추가된 키워드가 없습니다. 기본 키워드만 사용됩니다.</p>
          )}
        </div>

        {/* Alert Settings */}
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-500" /> 알림 설정
            </h2>
            {saved === 'alert' && <span className="text-xs text-emerald-500 flex items-center gap-1"><Check className="w-3 h-3" /> 저장됨</span>}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-200">Telegram 알림</p>
                <p className="text-sm text-gray-500">Opportunity Score 변동 시 텔레그램으로 알림을 보냅니다.</p>
              </div>
              <button
                onClick={() => { setTelegramEnabled(!telegramEnabled); flash('alert'); }}
                className={`relative w-12 h-6 rounded-full transition-colors ${telegramEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${telegramEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">알림 임계값 (Opportunity Score)</p>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{alertThreshold}</span>
              </div>
              <input
                type="range"
                min={30}
                max={95}
                step={5}
                value={alertThreshold}
                onChange={(e) => { setAlertThreshold(Number(e.target.value)); flash('alert'); }}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>30 (빈번)</span>
                <span>95 (매우 드묾)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Goals */}
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-500" /> 학습 목표
            </h2>
            {saved === 'goal' && <span className="text-xs text-emerald-500 flex items-center gap-1"><Check className="w-3 h-3" /> 저장됨</span>}
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">주간 학습 목표 시간</p>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{weeklyGoalMinutes}분 ({(weeklyGoalMinutes / 60).toFixed(1)}시간)</span>
              </div>
              <input
                type="range"
                min={60}
                max={600}
                step={30}
                value={weeklyGoalMinutes}
                onChange={(e) => { setWeeklyGoalMinutes(Number(e.target.value)); flash('goal'); }}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>1시간</span>
                <span>10시간</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">관심 영역 (우선 학습)</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {FOCUS_AREA_OPTIONS.map((opt) => {
                  const isActive = focusAreas.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => { toggleFocusArea(opt.id); flash('goal'); }}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors text-left ${
                        isActive
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-purple-300'
                      }`}
                    >
                      {isActive && <Check className="w-3 h-3 inline mr-1" />}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Connections */}
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-gray-500" /> Connections
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-200">Supabase Connection</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configure your database environment</p>
              </div>
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-[#1a1f1a] dark:hover:bg-[#2a2f2a] text-gray-700 dark:text-gray-300 rounded-md text-sm transition-colors">Configure</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
