import { useEffect } from 'react';
import { useStudyStore } from '../../stores/studyStore';
import SessionStepper from './SessionStepper';

export default function SROICalculator() {
  const startSession = useStudyStore(state => state.startSession);
  const currentSession = useStudyStore(state => state.currentSession);
  
  useEffect(() => {
    if (!currentSession) {
      startSession('sroi');
    }
  }, [currentSession, startSession]);

  if (!currentSession) return null;

  return (
    <SessionStepper
      title="SROI Calculator: Teacher Burnout Reduction"
      category="Social Return on Investment"
      renderQuestion={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">1. Scenario Definition</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm text-gray-700 dark:text-gray-300">
            CareVia prevents 2 special-ed teacher resignations per year per facility by reducing behavioral tracking workload. 
            Calculate the structural SROI ratio assuming a standard facility size.
          </div>
        </div>
      )}
      renderMyAnswer={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Calculate SROI</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Input Amount (KRW)</label>
              <input type="text" className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1f1a] rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="e.g. 10,000,000" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Est. Financial Output</label>
              <input type="text" className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1f1a] rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="e.g. 45,000,000" />
            </div>
          </div>
          <textarea 
            className="w-full h-24 p-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1f1a] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
            placeholder="Explain Output Proxy logic (e.g. Replacement hiring costs avoidance)..."
          />
        </div>
      )}
      renderAiReference={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">AI Validation</h3>
          <div className="p-5 border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-sm leading-relaxed text-gray-800 dark:text-gray-200">
            A solid start on replacement costs (~12M KRW per hire). However, you omitted the 'Lost Productivity during onboarding' proxy, which averages 3 months of a junior teacher's salary. Factoring that in raises the Output to ~58M KRW, yielding an SROI ratio of 5.8:1.
          </div>
        </div>
      )}
      renderGapCheck={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Gap Check</h3>
          <ul className="space-y-3">
            <li className="flex gap-3 p-3 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm">
              <span className="font-bold">💡 Suggestion:</span> 
              Always consider "Ramp-up Time Cost" as a secondary proxy when calculating employee retention SROI.
            </li>
          </ul>
        </div>
      )}
      renderInsight={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">CareVia Application</h3>
          <textarea 
            className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1f1a] rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none"
            placeholder="Record insight for your sales deck..."
          />
        </div>
      )}
      onComplete={() => alert('SROI Session Saved!')}
    />
  );
}
