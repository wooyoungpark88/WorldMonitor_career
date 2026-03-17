import { Brain, ArrowRight } from 'lucide-react';

export default function KnowledgeBase() {
  const mockInsights = [
    {
      id: 'i1',
      date: '2026-03-15',
      module: 'Pricing Lab',
      title: 'B2G Pricing Strategy Pivot',
      content: 'Reframing the Data Insight Reports as a free value-add allows us to bid at the maximum threshold (8.5M KRW) while drastically outscoring incumbents on qualitative service evaluation criteria.',
      tags: ['pricing', 'b2g', 'strategy']
    },
    {
      id: 'i2',
      date: '2026-03-12',
      module: 'SROI Calculator',
      title: 'Retention Proxy Modeling',
      content: 'When calculating the SROI for reducing special-ed teacher burnout, always include the 3-month "Ramp-up Time Cost" for junior replacements. This dramatically boosts the financial output proxy.',
      tags: ['sroi', 'burnout', 'sales']
    }
  ];

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-3">
        🧠 Knowledge Base
      </h1>
      
      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-[#1a1f1a]/50">
          <div className="flex gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Timeline</span>
          </div>
          <button className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1 hover:opacity-80">
            Export Report <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-3 space-y-10">
            {mockInsights.map((insight) => (
              <div key={insight.id} className="relative pl-8">
                {/* Timeline Node */}
                <div className="absolute w-6 h-6 bg-blue-50 dark:bg-blue-900/40 rounded-full border-4 border-white dark:border-[#141414] -left-[13px] flex items-center justify-center">
                  <Brain className="w-3 h-3 text-blue-500" />
                </div>
                
                <div className="mb-1 flex items-center gap-3 text-xs text-gray-500">
                  <span className="font-bold text-gray-900 dark:text-gray-300">{insight.date}</span>
                  <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-medium">From {insight.module}</span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{insight.title}</h3>
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-gray-800/60 mb-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{insight.content}</p>
                </div>
                
                <div className="flex gap-2">
                  {insight.tags.map(tag => (
                    <span key={tag} className="text-[10px] uppercase font-bold text-gray-400">#{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
