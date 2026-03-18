import { useStudyStore } from '../../stores/studyStore';
import { CheckCircle2, ChevronRight, ChevronLeft, PenTool, BrainCircuit, Search, Lightbulb } from 'lucide-react';

interface SessionStepperProps {
  title: string;
  category: string;
  renderQuestion: () => React.ReactNode;
  renderMyAnswer: () => React.ReactNode;
  renderAiReference: () => React.ReactNode;
  renderGapCheck: () => React.ReactNode;
  renderInsight: () => React.ReactNode;
  onComplete: () => void;
}

export default function SessionStepper({ 
  title, category, 
  renderQuestion, renderMyAnswer, renderAiReference, renderGapCheck, renderInsight,
  onComplete 
}: SessionStepperProps) {
  const currentStep = useStudyStore(state => state.currentSession?.step ?? 0);
  const setStep = useStudyStore(state => state.setSessionStep);

  const steps = [
    { id: 0, label: 'Question', icon: Search },
    { id: 1, label: 'My Answer', icon: PenTool },
    { id: 2, label: 'AI Reference', icon: BrainCircuit },
    { id: 3, label: 'Gap Check', icon: Search },
    { id: 4, label: 'Insight', icon: Lightbulb },
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1f1a]/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">
            {category}
          </span>
          <span className="text-xs text-gray-500 font-medium">Step {currentStep + 1} of 5</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
      </div>

      {/* Stepper Navigation */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 dark:border-gray-800/60 bg-white dark:bg-[#141414]">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => step.id <= currentStep && setStep(step.id)}
                className={`flex flex-col items-center gap-2 ${
                  step.id <= currentStep ? 'cursor-pointer' : 'cursor-default'
                } ${
                  isCurrent ? 'text-blue-600 dark:text-blue-400' : 
                  isCompleted ? 'text-emerald-500' : 'text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCurrent ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-110' : 
                  isCompleted ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-300 dark:border-gray-700'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'opacity-100' : 'opacity-70'}`}>
                  {step.label}
                </span>
              </button>
              
              {index < steps.length - 1 && (
                <div className={`w-12 lg:w-16 h-0.5 mx-1 lg:mx-2 rounded transition-colors ${
                  isCompleted ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-800'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50/30 dark:bg-[#0a0f0a]/30">
        <div className="max-w-3xl mx-auto">
          {currentStep === 0 && renderQuestion()}
          {currentStep === 1 && renderMyAnswer()}
          {currentStep === 2 && renderAiReference()}
          {currentStep === 3 && renderGapCheck()}
          {currentStep === 4 && renderInsight()}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414] flex justify-between">
        <button 
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button 
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          {currentStep === 4 ? '✅ Complete Session' : 'Next Step'}
          {currentStep !== 4 && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
