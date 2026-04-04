import { ReactNode, useState, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { Settings as SettingsIcon, Activity, BookOpen, Database } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const navItemsMeta = [
  { label: 'Tracking', path: '/tracking', icon: Activity, riIcon: 'ri-pulse-line' },
  { label: 'Study', path: '/study', icon: BookOpen, riIcon: 'ri-book-open-line' },
  { label: 'Knowledge Base', path: '/knowledge', icon: Database, riIcon: 'ri-database-2-line' },
  { label: 'Settings', path: '/settings', icon: SettingsIcon, riIcon: 'ri-settings-3-line' },
];

export default function Layout({ children }: LayoutProps) {
  const [location, navigate] = useLocation();
  const [headerSearch, setHeaderSearch] = useState('');

  const handleSearch = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && headerSearch.trim()) {
      if (!location.startsWith('/tracking')) {
        navigate('/tracking');
      }
      window.dispatchEvent(new CustomEvent('careradar:search', { detail: headerSearch }));
    }
  }, [headerSearch, location, navigate]);

  return (
    <div className="flex h-screen bg-[#f7f9f8] text-gray-900 font-sans overflow-hidden" style={{ fontFamily: "'Inter', 'Noto Sans KR', sans-serif" }}>
      {/* Sidebar — teal branding */}
      <aside className="hidden lg:flex w-56 flex-col border-r border-gray-100 bg-white shadow-sm z-10">
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Link href="/tracking">
              <span className="text-[#2ec4a9] font-black text-lg tracking-tight cursor-pointer">CareRadar</span>
            </Link>
            <span className="bg-[#e6faf6] text-[#2ec4a9] text-[10px] font-semibold px-1.5 py-0.5 rounded-full">V3.2</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 shrink-0">
          {navItemsMeta.map((item) => {
            const isActive = location.startsWith(item.path);
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#e6faf6] text-[#2ec4a9]'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  <span className="w-5 h-5 flex items-center justify-center">
                    <i className={`${item.riIcon} text-base`} />
                  </span>
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Inspirational Quote */}
        <div className="px-4 pb-3 shrink-0">
          <div className="relative px-3 pt-3 pb-3 rounded-xl bg-[#f7fdfb] border border-[#d4f3ec]">
            <span className="absolute top-2 left-2.5 text-[28px] leading-none text-[#2ec4a9] font-serif opacity-40 select-none">&ldquo;</span>
            <p className="text-[11px] leading-[1.65] text-gray-500 font-medium pl-3 pt-1 italic">
              Stress primarily comes from not taking action.
            </p>
            <p className="mt-2 pl-3 text-[10px] font-semibold text-[#2ec4a9] tracking-wide uppercase">
              — Jeff Bezos
            </p>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Profile */}
        <div className="px-4 py-4 border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2ec4a9] text-white text-xs font-bold shrink-0">
              L
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 leading-tight truncate">Leader</p>
              <p className="text-xs text-gray-400 truncate">CareVia Team</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-gray-100 bg-white shadow-sm z-10">
          {/* Hamburger menu for mobile */}
          <button
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-gray-100 bg-white hover:bg-gray-50 cursor-pointer mr-2 shrink-0"
            onClick={() => window.dispatchEvent(new CustomEvent('careradar:toggle-sidebar'))}
            aria-label="Toggle sidebar"
          >
            <i className="ri-menu-line text-gray-600 text-lg" />
          </button>
          <div className="flex-1 max-w-xl flex items-center gap-2">
            <div className="relative w-full max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                <i className="ri-search-line text-gray-400 text-sm" />
              </span>
              <input
                type="text"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Search news, companies, frameworks..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 focus:bg-white focus:border-[#2ec4a9] focus:ring-1 focus:ring-[#2ec4a9]/30 rounded-xl text-sm transition-colors outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative w-9 h-9 flex items-center justify-center bg-white border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer">
              <i className="ri-notification-3-line text-gray-500 text-base" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-auto bg-[#f7f9f8] relative">
          <div className="absolute inset-0 p-4 lg:p-5" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
