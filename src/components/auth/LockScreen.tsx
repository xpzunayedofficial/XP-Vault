import React, { useState } from 'react';
import { Lock, ShieldAlert, Fingerprint, EyeOff, ShieldCheck } from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { PinPad } from '../common/PinPad';

export const LockScreen: React.FC = () => {
  const { unlockWithPin, unlockWithBiometric, settings } = useVault();
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const handlePinComplete = async (pin: string) => {
    setIsVerifying(true);
    setError(null);
    const res = await unlockWithPin(pin);
    setIsVerifying(false);
    if (!res.success) {
      setError(res.message || 'Incorrect PIN');
    }
  };

  const handleBiometricClick = async () => {
    setIsVerifying(true);
    setError(null);
    const res = await unlockWithBiometric();
    setIsVerifying(false);
    if (!res.success) {
      setError(res.message || 'Biometric authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9] flex flex-col justify-center items-center p-6 text-[#15171A] select-none">
      {/* Center Lock Visual & PIN Pad */}
      <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center">
        <div className="relative mb-4">
          <img
            src="https://i.postimg.cc/m2rHQv1L/a-single-premium-abstract-geometric-monogram-icon.png"
            alt="XP Vault Logo"
            referrerPolicy="no-referrer"
            className="w-18 h-18 rounded-[24px] object-cover shadow-[0_8px_24px_rgba(0,0,0,0.08)] border-2 border-white"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#3157D5] text-white flex items-center justify-center shadow-xs">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        <h1 className="text-xl font-extrabold text-[#15171A] tracking-tight mb-1">
          Vault Protected
        </h1>
        <p className="text-xs text-[#737982] mb-3 font-medium">
          Enter your 6-digit PIN to access private files
        </p>

        {settings.failedAttemptsCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[#D64545] font-semibold bg-[#FEE2E2]/60 px-3 py-1 rounded-full mb-3">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Failed attempts: {settings.failedAttemptsCount} / {settings.maxFailedAttempts}</span>
          </div>
        )}

        <PinPad
          pinLength={6}
          onComplete={handlePinComplete}
          onBiometricClick={settings.fingerprintEnabled || settings.faceUnlockEnabled ? handleBiometricClick : undefined}
          showBiometricButton={settings.fingerprintEnabled || settings.faceUnlockEnabled}
          error={error}
        />
      </div>
    </div>
  );
};
