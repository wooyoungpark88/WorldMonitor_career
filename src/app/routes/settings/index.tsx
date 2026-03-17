export default function Settings() {
  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-3">
        ⚙️ Settings
      </h1>
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">Connections</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-200">Supabase Connection</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configure your database environment</p>
              </div>
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-[#1a1f1a] dark:hover:bg-[#2a2f2a] text-gray-700 dark:text-gray-300 rounded-md text-sm transition-colors">Configure</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
