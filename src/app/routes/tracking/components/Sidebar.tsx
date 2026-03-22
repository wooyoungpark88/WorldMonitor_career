interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const menuItems = [
  { id: 'tracking', label: 'Tracking', icon: 'ri-pulse-line' },
  { id: 'study', label: 'Study', icon: 'ri-book-open-line' },
  { id: 'knowledge', label: 'Knowledge Base', icon: 'ri-database-2-line' },
  { id: 'settings', label: 'Settings', icon: 'ri-settings-3-line' },
];

const Sidebar = ({ activeMenu, onMenuChange, isMobileOpen = false, onMobileClose }: SidebarProps) => {
  return (
    <aside
      className={`w-56 bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 bottom-0 z-30 transition-transform duration-300 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#2ec4a9] font-black text-lg tracking-tight">CareRadar</span>
            <span className="bg-[#e6faf6] text-[#2ec4a9] text-[10px] font-semibold px-1.5 py-0.5 rounded-full">V3.2</span>
          </div>
          <button
            onClick={onMobileClose}
            className="lg:hidden w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-line text-base" />
          </button>
        </div>
      </div>

      {/* Menu */}
      <nav className="px-3 py-4 shrink-0">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { onMenuChange(item.id); onMobileClose?.(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeMenu === item.id
                ? 'bg-[#e6faf6] text-[#2ec4a9]'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <span className="w-5 h-5 flex items-center justify-center">
              <i className={`${item.icon} text-base`} />
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Quote — right below nav items */}
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
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 leading-tight truncate">Leader</p>
            <p className="text-xs text-gray-400 truncate">CareVia Team</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
