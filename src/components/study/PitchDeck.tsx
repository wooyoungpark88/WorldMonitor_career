import { useEffect } from 'react';
import { useStudyStore } from '../../stores/studyStore';
import SessionStepper from './SessionStepper';

export default function PitchDeck() {
  const startSession = useStudyStore(state => state.startSession);
  const currentSession = useStudyStore(state => state.currentSession);
  
  useEffect(() => {
    if (!currentSession) {
      startSession('pitch');
    }
  }, [currentSession, startSession]);

  if (!currentSession) return null;

  return (
    <SessionStepper
      title="Pitch Deck: CareVia Impact Story"
      category="Pitch & Field Story"
      renderQuestion={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">1. Formulate your 60-second opening hook</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm text-gray-700 dark:text-gray-300">
            [IR / Field Pitch Scenario] You are meeting with a Tier 2 welfare foundation director who is skeptical about AI tools adding to teacher workloads. Craft an opening hook that disarms this objection immediately using CareVia's core value prop.
          </div>
        </div>
      )}
      renderMyAnswer={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Your Scripting</h3>
          <textarea 
            className="w-full h-40 p-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1f1a] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
            placeholder="Write your 60-second talking points..."
          />
        </div>
      )}
      renderAiReference={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">AI Pitch Coach Response</h3>
          <div className="p-5 border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-sm leading-relaxed text-gray-800 dark:text-gray-200">
            A strong hook here is paradox: "We didn't build CareVia to add another screen for teachers. We built it to eliminate the clipboard." 
            By acknowledging the 'burden of new tools' upfront, you instantly align with the director's protective instinct for their teachers.
          </div>
        </div>
      )}
      renderGapCheck={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Critique & Gap</h3>
          <ul className="space-y-3">
            <li className="flex gap-3 p-3 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm">
              <span className="font-bold">❌ Defensive Tone:</span> 
              Your script started by defending the AI's ease of use. This puts you on the back foot. Always attack the core objection by reframing it as your primary feature.
            </li>
          </ul>
        </div>
      )}
      renderInsight={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Script Finalization</h3>
          <textarea 
            className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1f1a] rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none"
            placeholder="Rewrite your hook securely..."
          />
        </div>
      )}
      onComplete={() => alert('Pitch Deck Session Saved to Knowledge Base!')}
    />
  );
}
