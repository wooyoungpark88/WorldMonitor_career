/**
 * 금요일 주간 정리 — PRD Section 5.4.3
 * 5개 필수 질문 폼 + weekly_reviews 저장
 */

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

const QUESTIONS = [
  { key: 'q1_market_signal', label: '이번 주에 발견한 가장 중요한 시장 시그널은?' },
  { key: 'q2_pricing_insight', label: 'CareVia/호시담 가격/BM에 대한 새로운 관점은?' },
  { key: 'q3_sroi_discovery', label: '이번 주 SROI 환산에서 가장 큰 발견은?' },
  { key: 'q4_next_week_focus', label: '다음 주에 집중해야 할 학습 주제는?' },
  { key: 'q5_applied_in_practice', label: '이번 주 학습을 실무에 적용한 것 1가지는?' },
] as const;

function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export default function WeeklyReview() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { start, end } = getWeekBounds(new Date());
      const { error } = await supabase.from('weekly_reviews').insert({
        week_start: start.toISOString().slice(0, 10),
        week_end: end.toISOString().slice(0, 10),
        q1_market_signal: answers.q1_market_signal || null,
        q2_pricing_insight: answers.q2_pricing_insight || null,
        q3_sroi_discovery: answers.q3_sroi_discovery || null,
        q4_next_week_focus: answers.q4_next_week_focus || null,
        q5_applied_in_practice: answers.q5_applied_in_practice || null,
      });
      if (error) throw error;
      setSaved(true);
    } catch (e) {
      console.error('Weekly review save error:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1f1a]/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">주간 정리</h2>
        <p className="text-sm text-gray-500 mt-1">매주 금요일, 5개 질문에 답하며 주간을 마무리하세요.</p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {QUESTIONS.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {label}
            </label>
            <textarea
              value={answers[key] ?? ''}
              onChange={(e) => handleChange(key, e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0a0f0a] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="답변을 입력하세요..."
            />
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
        >
          {saving ? '저장 중...' : saved ? '저장됨' : '저장'}
        </button>
      </div>
    </div>
  );
}
