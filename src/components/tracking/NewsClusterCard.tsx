import { Clock, ExternalLink } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  isBookmarked: boolean;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface NewsClusterCardProps {
  title: string;
  summary: string;
  items: NewsItem[];
  track: string;
  importanceScore: number;
}

export default function NewsClusterCard({ title, summary, items, track, importanceScore }: NewsClusterCardProps) {
  const getTrackColor = (t: string) => {
    switch (t) {
      case 'caretech': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'investment': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'competitor': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'policy': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getTrackColor(track)}`}>
          {track}
        </span>
        {importanceScore >= 80 && (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            Hot
          </span>
        )}
      </div>
      
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-snug">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
        {summary}
      </p>

      <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800/80">
        {items.map(item => (
          <div key={item.id} className="flex gap-3 group">
            <div className="w-1 h-auto bg-gray-200 dark:bg-gray-800 rounded-full group-hover:bg-emerald-500 transition-colors"></div>
            <div className="flex-1">
              <a href="#" className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 mb-1">
                {item.title}
              </a>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="font-medium text-gray-600 dark:text-gray-400">{item.source}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.time}</span>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
