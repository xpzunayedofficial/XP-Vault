import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useVault } from '../../context/VaultContext';

export const Toast: React.FC = () => {
  const { toastMessage } = useVault();

  if (!toastMessage) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#15171A] text-white shadow-xl text-xs font-semibold tracking-wide border border-white/10">
        <ShieldCheck className="w-4 h-4 text-[#2E9B62]" />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
};
