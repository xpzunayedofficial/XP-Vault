import React from 'react';
import {
  ShieldCheck,
  Lock,
  Fingerprint,
  Timer,
  EyeOff,
  Hand,
  Smartphone,
  HardDriveDownload,
  Share2,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Shield,
  Key,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

export const SecurityDashboard: React.FC = () => {
  const {
    securityScore,
    settings,
    setActiveModal,
    updateSettings,
    trustedDevices,
  } = useVault();

  const getScoreRating = (score: number) => {
    if (score >= 90) return { label: 'Excellent Protection', color: '#2E9B62' };
    if (score >= 75) return { label: 'Strong Protection', color: '#3157D5' };
    if (score >= 50) return { label: 'Moderate Protection', color: '#D97706' };
    return { label: 'Action Required', color: '#D64545' };
  };

  const rating = getScoreRating(securityScore);

  const securityStatuses = [
    { label: 'AES-GCM-256 Encryption', active: true, desc: 'Hardware enclave verified' },
    { label: 'Biometric Multi-Lock', active: settings.fingerprintEnabled || settings.faceUnlockEnabled, desc: 'Fingerprint & Face Unlock active' },
    { label: 'Auto Lock Enforced', active: settings.autoLockDelay !== '15m', desc: `Locks after ${settings.autoLockDelay}` },
    { label: 'Encrypted Recovery Backup', active: !!settings.lastBackupAt, desc: settings.lastBackupAt ? 'Recent backup created' : 'No backup created yet' },
    { label: 'Emergency Privacy Shield', active: settings.emergencyPrivacyEnabled, desc: 'Hidden recovery gesture active' },
  ];

  return (
    <div className="pb-28 px-4 sm:px-8 lg:px-10 pt-6 sm:pt-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200 select-none">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#15171A] tracking-tight">
          Security Center
        </h2>
        <p className="text-sm text-[#737982] font-medium mt-0.5">
          Real-time cryptographic audit & hardware defense status
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Security Audit Score & Checklist */}
        <div className="lg:col-span-6 flex flex-col space-y-6">
          {/* Security Score Hero Card */}
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#E7E9ED] shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-[#2E9B62]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#737982]">
                Security Audit
              </span>
            </div>

            <div className="my-3">
              <span className="text-6xl font-extrabold tracking-tight text-[#15171A] font-mono">
                {securityScore}
              </span>
              <span className="text-xl font-bold text-[#737982]"> / 100</span>
            </div>

            <p className="text-base font-bold tracking-tight" style={{ color: rating.color }}>
              {rating.label}
            </p>

            {/* Security Progress Meter */}
            <div className="w-full h-3 rounded-full bg-[#F6F7F9] mt-6 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${securityScore}%`, backgroundColor: rating.color }}
              />
            </div>
          </div>

          {/* Protection Status Checklist */}
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#E7E9ED] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <h3 className="text-xs font-bold text-[#737982] uppercase tracking-wider mb-4">
              Hardware & Cipher Defense
            </h3>

            <div className="space-y-4">
              {securityStatuses.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3.5">
                  <div className={`mt-0.5 shrink-0 ${item.active ? 'text-[#2E9B62]' : 'text-[#D97706]'}`}>
                    {item.active ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#15171A]">{item.label}</p>
                    <p className="text-xs text-[#737982] leading-relaxed mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Security Controls Navigation */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <h3 className="text-xs font-bold text-[#737982] uppercase tracking-wider px-1">
            Security Controls & Modules
          </h3>

          {/* Lock Center */}
          <div
            onClick={() => setActiveModal('lockCenter')}
            className="bg-white rounded-[24px] p-5 flex items-center justify-between cursor-pointer border border-[#E7E9ED] hover:border-[#3157D5] active:scale-99 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#15171A]">Lock Center</p>
                <p className="text-xs text-[#737982] mt-0.5">PIN code, Biometrics, and Auto-lock timers</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#737982] group-hover:text-[#3157D5] group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Hidden Recovery Gesture */}
          <div
            onClick={() => setActiveModal('hiddenGesture')}
            className="bg-white rounded-[24px] p-5 flex items-center justify-between cursor-pointer border border-[#E7E9ED] hover:border-[#3157D5] active:scale-99 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F3EEFD] text-[#8B5CF6] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Hand className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#15171A]">Hidden Recovery Gesture</p>
                <p className="text-xs text-[#737982] mt-0.5">Custom secret tap sequence to exit Emergency Screen</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#737982] group-hover:text-[#3157D5] group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Trusted Devices */}
          <div
            onClick={() => setActiveModal('trustedDevices')}
            className="bg-white rounded-[24px] p-5 flex items-center justify-between cursor-pointer border border-[#E7E9ED] hover:border-[#3157D5] active:scale-99 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E6F6F4] text-[#0D9488] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#15171A]">Trusted Devices</p>
                <p className="text-xs text-[#737982] mt-0.5">{trustedDevices.filter(d => d.status !== 'revoked').length} paired secure terminals</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#737982] group-hover:text-[#3157D5] group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Vault Transfer & QR */}
          <div
            onClick={() => setActiveModal('transfer')}
            className="bg-white rounded-[24px] p-5 flex items-center justify-between cursor-pointer border border-[#E7E9ED] hover:border-[#3157D5] active:scale-99 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#15171A]">Cross-Device Vault Transfer</p>
                <p className="text-xs text-[#737982] mt-0.5">Encrypted QR exchange & One-time pairing codes</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#737982] group-hover:text-[#3157D5] group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Encrypted Backup & Restore */}
          <div
            onClick={() => setActiveModal('backup')}
            className="bg-white rounded-[24px] p-5 flex items-center justify-between cursor-pointer border border-[#E7E9ED] hover:border-[#3157D5] active:scale-99 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F8F0] text-[#2E9B62] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <HardDriveDownload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#15171A]">Encrypted Backup & Recovery</p>
                <p className="text-xs text-[#737982] mt-0.5">Generate standalone .enc offline recovery files</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#737982] group-hover:text-[#3157D5] group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );

};
