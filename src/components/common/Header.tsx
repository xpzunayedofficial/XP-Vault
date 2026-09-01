import React from 'react';
import { Lock, Search } from 'lucide-react';
import { useVault } from '../../context/VaultContext';

export const Header: React.FC = () => {
  const { lockVault, setActiveTab, settings } = useVault();

  return (
    <header className="sticky top-0 z-30 bg-[#F6F7F9]/85 backdrop-blur-xl px-4 sm:px-8 lg:px-10 py-3.5 sm:py-4.5 border-b border-[#E7E9ED] shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all">
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        {/* Brand Identity */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <img
            src="https://i.postimg.cc/m2rHQv1L/a-single-premium-abstract-geometric-monogram-icon.png"
            alt="XP Vault Logo"
            referrerPolicy="no-referrer"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#E7E9ED] transition-all group-hover:scale-105 active:scale-95"
          />
          <div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#15171A] group-hover:text-[#3157D5] transition-colors">
              XP Vault
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Search */}
          <button
            onClick={() => setActiveTab('search')}
            title="Search Vault"
            className="h-10 w-10 sm:h-11 sm:w-11 bg-white rounded-2xl border border-[#E7E9ED] flex items-center justify-center text-[#15171A] hover:border-[#3157D5] hover:text-[#3157D5] hover:shadow-[0_2px_10px_rgba(49,87,213,0.08)] active:scale-95 transition-all cursor-pointer shadow-2xs"
            aria-label="Search Vault"
          >
            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Quick Lock Action */}
          <button
            onClick={lockVault}
            title="Lock Vault Now"
            className="h-10 sm:h-11 px-3 sm:px-4 bg-white rounded-2xl border border-[#E7E9ED] hover:border-[#D64545] hover:bg-[#FDF2F2] text-[#737982] hover:text-[#D64545] active:scale-95 transition-all shadow-2xs flex items-center gap-2 cursor-pointer group"
            aria-label="Lock Vault"
          >
            <Lock className="w-4 h-4 text-[#737982] group-hover:text-[#D64545] transition-colors" />
            <span className="hidden sm:inline text-xs font-bold text-[#15171A] group-hover:text-[#D64545] transition-colors">
              Lock
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

