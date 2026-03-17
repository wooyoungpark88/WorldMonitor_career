import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

interface ProcurementRowProps {
  id: string;
  title: string;
  budget: string;
  agency: string;
  deadlineDisplay: string;
  isUrgent: boolean;
}

export default function ProcurementRow({ id: _id, title, budget, agency, deadlineDisplay, isUrgent }: ProcurementRowProps) {
  return (
    <Link href="/study" className="block group flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800/60 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isUrgent ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
            {deadlineDisplay}
          </span>
          <span className="text-xs text-gray-500 font-medium">{agency}</span>
        </div>
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h4>
      </div>
      
      <div className="flex items-center gap-4 text-right shrink-0">
        <div>
          <span className="block text-[10px] text-gray-400 font-medium uppercase tracking-wide">Est. Budget</span>
          <span className="block text-sm font-bold text-emerald-600 dark:text-emerald-400">{budget}</span>
        </div>
        <button className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1a1f1a] flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-400 transition-colors">
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </Link>
  );
}
