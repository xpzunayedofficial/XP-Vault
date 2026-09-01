import React from 'react';
import { Home, FolderLock, Search, ShieldCheck } from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { ActiveTab } from '../../types';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, settings } = useVault();

  const tabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'vault', label: 'Vault', icon: FolderLock },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 h-20 bg-white border-t border-[#E7E9ED] shadow-[0_-4px_20px_rgba(0,0,0,0.02)] safe-area-bottom">
      <div className="max-w-xl mx-auto h-full flex items-center justify-around px-4 sm:px-12">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center space-y-1 py-2 px-4 transition-all cursor-pointer select-none ${
                isActive
                  ? 'text-[#3157D5] opacity-100'
                  : 'text-[#15171A] opacity-40 hover:opacity-100'
              }`}
            >
              <Icon className="w-5 h-5 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

