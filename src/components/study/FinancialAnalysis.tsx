import { useEffect } from 'react';
import { useStudyStore } from '../../stores/studyStore';
import SessionStepper from './SessionStepper';

export default function FinancialAnalysis() {
  const startSession = useStudyStore(state => state.startSession);
  const currentSession = useStudyStore(state => state.currentSession);
  
  useEffect(() => {
    // Start session if none active
    if (!currentSession) {
      startSession('financial');
    }
  }, [currentSession, startSession]);

  if (!currentSession) return null;

  return (
    <SessionStepper
      title="Financial Analysis: CareRobotics Inc (DART)"
      category="Financials"
      renderQuestion={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">1. How did revenue align with R&D expenses in Q3?</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm text-gray-700 dark:text-gray-300">
            [Source Data Snapshot] DART Q3 Report indicates Revenue: 15.2M, R&D: 4.1M...
          </div>
        </div>
      )}
      renderMyAnswer={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Your Analysis</h3>
          <textarea 
            className="w-full h-40 p-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1f1a] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
            placeholder="Write your analysis based on the data..."
          />
        </div>
      )}
      renderAiReference={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">AI Expert Reference</h3>
          <div className="p-5 border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-sm leading-relaxed text-gray-800 dark:text-gray-200">
            The 27% ratio of R&D to revenue indicates a highly aggressive growth strategy, typical of pre-profitability tech hardware firms. Notice specifically that the raw component costs dropped, allowing the redirection to ML logic development...
          </div>
        </div>
      )}
      renderGapCheck={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Gap Check & Blind Spots</h3>
          <ul className="space-y-3">
            <li className="flex gap-3 p-3 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm">
              <span className="font-bold">❌ Missed:</span> 
              You didn't factor in the raw component cost drop which subsidized the R&D bump.
            </li>
            <li className="flex gap-3 p-3 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 text-sm">
              <span className="font-bold">✅ Spotted:</span> 
              You correctly identified the aggressive growth strategy timeline.
            </li>
          </ul>
        </div>
      )}
      renderInsight={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Synthesize Insight</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">How can you apply this to CareVia's strategy?</p>
          <textarea 
            className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1f1a] rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none"
            placeholder="Record your final takeaway to build your Knowledge Base..."
          />
        </div>
      )}
      onComplete={() => alert('Session logged to Knowledge Base!')}
    />
  );
}
