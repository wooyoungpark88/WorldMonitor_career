import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Search, Bell, Settings as SettingsIcon, User, Activity, BookOpen, Database } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { label: 'Tracking', path: '/tracking', icon: Activity },
    { label: 'Study', path: '/study', icon: BookOpen },
    { label: 'Knowledge Base', path: '/knowledge', icon: Database },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0a0f0a] text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414] shadow-sm z-10">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
          <Link href="/tracking" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400">
            CareRadar
          </Link>
          <span className="ml-2 px-1.5 py-0.5 text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-500 rounded">v3.1</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.startsWith(item.path);
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}>
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Leader</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 truncate">CareVia Team</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414] shadow-sm z-10">
          <div className="flex-1 max-w-xl flex items-center gap-2">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search news, companies, frameworks..." 
                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-[#0a0f0a] border-transparent focus:bg-white dark:focus:bg-[#1a1f1a] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg text-sm transition-colors dark:text-gray-200 outline-none placeholder:text-gray-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#141414]"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-[#0a0f0a] relative">
          <div className="absolute inset-0 p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
