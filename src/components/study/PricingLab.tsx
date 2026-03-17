import { useEffect } from 'react';
import { useStudyStore } from '../../stores/studyStore';
import SessionStepper from './SessionStepper';

export default function PricingLab() {
  const startSession = useStudyStore(state => state.startSession);
  const currentSession = useStudyStore(state => state.currentSession);
  
  useEffect(() => {
    if (!currentSession) {
      startSession('pricing');
    }
  }, [currentSession, startSession]);

  if (!currentSession) return null;

  return (
    <SessionStepper
      title="Pricing Lab: B2G Autism Care Platform"
      category="Pricing & Bidding"
      renderQuestion={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">1. Determine the optimal bidding price</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm text-gray-700 dark:text-gray-300">
            [Procurement Alert] Ministry of Health & Welfare released a new tender for 'AI-driven developmental tracking platform' with a maximum budget of 8.5M KRW per facility.
            Competitor X historically bids at 80% of max budget with a multi-year lock-in.
          </div>
        </div>
      )}
      renderMyAnswer={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Your Pricing Strategy</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Price (KRW)</label>
              <input type="text" className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1f1a] rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="e.g. 7,200,000" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pricing Model</label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1f1a] rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                <option>One-time Setup + Maintenance</option>
                <option>SaaS Flat Rate</option>
                <option>Per-user Tiered</option>
              </select>
            </div>
          </div>
          <textarea 
            className="w-full h-32 p-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1f1a] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
            placeholder="Explain your rationale..."
          />
        </div>
      )}
      renderAiReference={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">AI Expert Reference</h3>
          <div className="p-5 border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-sm leading-relaxed text-gray-800 dark:text-gray-200">
            Bidding slightly below Competitor X's 80% is a race to the bottom. Instead, an optimal play here is setting the base tier at exactly 8.5M to maximize initial funding absorption, but bundling 'Data Insight Reports' as a free value-add that costs us structurally $0 to generate with AI, while increasing our evaluation score by 15 points.
          </div>
        </div>
      )}
      renderGapCheck={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Gap Check</h3>
          <ul className="space-y-3">
            <li className="flex gap-3 p-3 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm">
              <span className="font-bold">❌ Strategy Shift:</span> 
              You competed purely on price rather than Value-Added bundling. Public procurement heavily weights qualitative features if base requirements are met.
            </li>
          </ul>
        </div>
      )}
      renderInsight={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">CareVia Application</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">How will this change your pricing model for CareVia's upcoming agency tender?</p>
          <textarea 
            className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1f1a] rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none"
            placeholder="Record your final takeaway..."
          />
        </div>
      )}
      onComplete={() => alert('Pricing Lab Session Saved!')}
    />
  );
}
