import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Fingerprint,
  HardDrive,
  Trash2,
  Share2,
  Palette,
  EyeOff,
  AlertTriangle,
  RotateCcw,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  Check,
  DownloadCloud,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    setActiveModal,
    resetVault,
    items,
    notes,
    passwords,
    storageMetrics,
    showToast,
  } = useVault();

  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [resetInput, setResetInput] = useState<string>('');

  const trashCount =
    items.filter((i) => i.isDeleted).length +
    notes.filter((n) => n.isDeleted).length +
    passwords.filter((p) => p.isDeleted).length;

  const accentColors = [
    { label: 'Cobalt Blue', value: '#3157D5' },
    { label: 'Deep Violet', value: '#7C3AED' },
    { label: 'Emerald Green', value: '#059669' },
    { label: 'Graphite Black', value: '#15171A' },
  ];

  const handleReset = async () => {
    if (resetInput !== 'DELETE') {
      showToast('Type DELETE to confirm complete reset');
      return;
    }

    await resetVault();
    setShowResetConfirm(false);
    showToast('Vault wiped completely');
  };

  return (
    <div className="pb-28 px-4 sm:px-8 lg:px-10 pt-6 sm:pt-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200 select-none">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#15171A] tracking-tight">
          Settings & Privacy
        </h2>
        <p className="text-sm text-[#737982] font-medium mt-0.5">
          Vault configuration, cryptographic keys, emergency shields, and appearance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: App Info & Appearance */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          {/* App Header Info */}
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#E7E9ED] shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center">
            <img
              src="https://i.postimg.cc/m2rHQv1L/a-single-premium-abstract-geometric-monogram-icon.png"
              alt="XP Vault Logo"
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-3xl mx-auto object-cover shadow-[0_6px_20px_rgba(0,0,0,0.08)] border-2 border-white mb-4"
            />
            <h2 className="text-lg font-extrabold text-[#15171A]">XP Vault</h2>
            <p className="text-xs text-[#737982] font-mono mt-1">
              v2.4.0 • Zero-Knowledge Enclave • AES-GCM-256
            </p>
            <div className="mt-4 pt-4 border-t border-[#E7E9ED] flex justify-around text-center text-xs">
              <div>
                <span className="font-bold text-[#15171A] block">{items.length}</span>
                <span className="text-[#737982] text-[11px]">Encrypted Files</span>
              </div>
              <div className="border-r border-[#E7E9ED]"></div>
              <div>
                <span className="font-bold text-[#15171A] block">{passwords.length}</span>
                <span className="text-[#737982] text-[11px]">Passwords</span>
              </div>
              <div className="border-r border-[#E7E9ED]"></div>
              <div>
                <span className="font-bold text-[#15171A] block">{notes.length}</span>
                <span className="text-[#737982] text-[11px]">Notes</span>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="bg-white rounded-[28px] p-6 border border-[#E7E9ED] shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#3157D5]" />
              <span className="text-sm font-bold text-[#15171A]">Theme Accent Color</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {accentColors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => updateSettings({ accentColor: c.value })}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                    settings.accentColor === c.value
                      ? 'border-[#15171A] bg-[#F6F7F9] shadow-xs'
                      : 'border-[#E7E9ED] bg-white hover:border-[#CBD2DC]'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: c.value }} />
                  <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Danger Zone: Wipe Vault */}
          <div className="bg-[#FFF5F5] rounded-[28px] p-6 border border-[#FCA5A5]/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 text-[#D64545] font-bold text-sm mb-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </div>
            <p className="text-xs text-[#737982] mb-4 leading-relaxed">
              Completely destroy all encrypted files, hardware keys, notes and passwords from device storage.
            </p>

            {showResetConfirm ? (
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase text-[#D64545]">
                  Type DELETE to confirm wipe:
                </label>
                <input
                  type="text"
                  value={resetInput}
                  onChange={(e) => setResetInput(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#D64545] text-xs font-mono font-bold text-[#D64545] focus:outline-none"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2.5 text-xs font-bold text-[#737982] hover:text-[#15171A] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2.5 rounded-2xl bg-[#D64545] text-white text-xs font-bold hover:bg-[#B91C1C] cursor-pointer shadow-xs"
                  >
                    Confirm Wipe
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-3 rounded-2xl bg-white border border-[#D64545]/40 text-[#D64545] text-xs font-bold hover:bg-[#FEE2E2] active:scale-98 transition-all cursor-pointer shadow-xs"
              >
                Wipe Vault & Reset Keys
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Security, Privacy, Backup & Storage */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          {/* Security & Access Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#737982] uppercase tracking-wider px-1">
              Security & Access
            </h3>

            {/* Lock Center */}
            <div
              onClick={() => setActiveModal('lockCenter')}
              className="bg-white rounded-[24px] p-4 sm:p-5 flex items-center justify-between cursor-pointer border border-[#E7E9ED] hover:border-[#3157D5] active:scale-99 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#15171A]">Lock Center</p>
                  <p className="text-xs text-[#737982] mt-0.5">PIN code, Biometric unlock, and Auto-lock delay</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#737982] group-hover:text-[#3157D5] group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* Emergency Privacy Screen Toggle */}
            <div className="bg-white rounded-[24px] p-4 sm:p-5 flex items-center justify-between border border-[#E7E9ED] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#F3EEFD] text-[#8B5CF6] flex items-center justify-center shrink-0">
                  <EyeOff className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#15171A]">Emergency Privacy Mode</p>
                  <p className="text-xs text-[#737982] mt-0.5">Camouflages vault into minimalist standby screen</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    emergencyPrivacyEnabled: !settings.emergencyPrivacyEnabled,
                  })
                }
                className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  settings.emergencyPrivacyEnabled ? 'bg-[#3157D5]' : 'bg-[#DDE1E6]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform shadow-xs ${
                    settings.emergencyPrivacyEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Hidden Recovery Gesture */}
            <div
              onClick={() => setActiveModal('hiddenGesture')}
              className="bg-white rounded-[24px] p-4 sm:p-5 flex items-center justify-between cursor-pointer border border-[#E7E9ED] hover:border-[#3157D5] active:scale-99 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#F3EEFD] text-[#8B5CF6] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#15171A]">Hidden Recovery Gesture</p>
                  <p className="text-xs text-[#737982] mt-0.5">Configure rhythm taps sequence to unlock</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#737982] group-hover:text-[#3157D5] group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* Data & Storage Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#737982] uppercase tracking-wider px-1">
              Data & Backup
            </h3>

            {/* Encrypted Backup */}
            <div
              onClick={() => setActiveModal('backup')}
              className="bg-white rounded-[24px] p-4 sm:p-5 flex items-center justify-between cursor-pointer border border-[#E7E9ED] hover:border-[#3157D5] active:scale-99 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#E8F8F0] text-[#2E9B62] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <DownloadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#15171A]">Encrypted Backup & Restore</p>
                  <p className="text-xs text-[#737982] mt-0.5">Export or import offline encrypted .enc archive</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#737982] group-hover:text-[#3157D5] group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* Secure Trash */}
            <div
              onClick={() => setActiveModal('trash')}
              className="bg-white rounded-[24px] p-4 sm:p-5 flex items-center justify-between cursor-pointer border border-[#E7E9ED] hover:border-[#3157D5] active:scale-99 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#FEE2E2] text-[#D64545] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#15171A]">Secure Trash</p>
                  <p className="text-xs text-[#737982] mt-0.5">{trashCount} items currently in holding queue</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#737982] group-hover:text-[#3157D5] group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

};
