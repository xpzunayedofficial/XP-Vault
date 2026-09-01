import React, { useState, useEffect, useRef } from 'react';
import { Fingerprint, ShieldCheck, CheckCircle2, Lock, KeyRound } from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { PinPad } from '../common/PinPad';

export const EmergencyPrivacyScreen: React.FC = () => {
  const { exitEmergencyPrivacyWithGesture, unlockWithPin, settings } = useVault();
  const [showBiometricModal, setShowBiometricModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'biometric' | 'pin'>('biometric');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifySuccess, setVerifySuccess] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [timeString, setTimeString] = useState<string>('');
  const [dateString, setDateString] = useState<string>('');

  // Hidden tap gesture state tracker
  // Target pattern: default [3, 3, 3, 1]
  const targetPattern = settings.hiddenRecoveryGesture || [3, 3, 3, 1];
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentBlockCountRef = useRef<number>(0);
  const detectedBlocksRef = useRef<number[]>([]);

  // Update subtle clock display to make screen look like standard minimalist system stand-by
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setDateString(
        now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleScreenTap = () => {
    // Increment taps in current quick burst
    currentBlockCountRef.current += 1;

    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    // After 650ms of pause, finalize block
    tapTimerRef.current = setTimeout(() => {
      const blockTaps = currentBlockCountRef.current;
      currentBlockCountRef.current = 0;

      const updatedBlocks = [...detectedBlocksRef.current, blockTaps];
      detectedBlocksRef.current = updatedBlocks;

      // Check if current prefix matches target pattern
      const isMatching = updatedBlocks.every(
        (val, idx) => idx < targetPattern.length && val === targetPattern[idx]
      );

      if (!isMatching) {
        // Reset if mismatched
        detectedBlocksRef.current = [];
      } else if (updatedBlocks.length === targetPattern.length) {
        // Full sequence matched! Trigger Biometric Recovery Prompt
        detectedBlocksRef.current = [];
        setShowBiometricModal(true);
      }
    }, 650);
  };

  const handleVerifyBiometrics = async () => {
    setIsVerifying(true);
    const success = await exitEmergencyPrivacyWithGesture();
    setIsVerifying(false);
    if (success) {
      setVerifySuccess(true);
      setTimeout(() => {
        setShowBiometricModal(false);
      }, 700);
    }
  };

  const handlePinSubmit = async (pin: string) => {
    setIsVerifying(true);
    setPinError(null);
    const res = await unlockWithPin(pin);
    setIsVerifying(false);
    if (res.success) {
      setVerifySuccess(true);
      await exitEmergencyPrivacyWithGesture();
      setTimeout(() => {
        setShowBiometricModal(false);
      }, 600);
    } else {
      setPinError(res.message || 'Incorrect PIN');
    }
  };

  return (
    <div
      onClick={handleScreenTap}
      className="fixed inset-0 z-50 bg-[#F6F7F9] flex flex-col justify-between p-8 select-none cursor-pointer overflow-hidden transition-all duration-300"
    >
      {/* Subtle Inactive System Appearance */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          setShowBiometricModal(true);
        }}
        className="w-full flex justify-between items-center opacity-40 hover:opacity-80 transition-opacity"
        title="Double-click or tap to open vault authentication"
      >
        <span className="text-[11px] font-mono tracking-widest text-[#737982]">SECURE SYS</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#737982]"></div>
          <span className="text-[10px] font-medium text-[#737982]">STANDBY</span>
        </div>
      </div>

      {/* Center Minimalist Clock & Neutral Display */}
      <div 
        onDoubleClick={(e) => {
          e.stopPropagation();
          setShowBiometricModal(true);
        }}
        className="flex flex-col items-center justify-center my-auto opacity-70 hover:opacity-90 transition-opacity"
      >
        <h1 className="text-5xl sm:text-6xl font-light tracking-tight text-[#15171A] mb-1 font-mono">
          {timeString || '12:00'}
        </h1>
        <p className="text-xs tracking-widest uppercase text-[#737982] font-medium">
          {dateString}
        </p>
      </div>

      {/* Bottom Minimal status */}
      <div className="w-full text-center opacity-30 text-[10px] font-mono text-[#737982]">
        PROTECTED BY HARDWARE ENCLAVE
      </div>

      {/* Biometric / PIN Recovery Modal */}
      {showBiometricModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 animate-in fade-in duration-200"
        >
          <div className="vault-card-elevated rounded-3xl p-6 w-full max-w-sm text-center border border-[#E2E5EB] bg-white">
            {verifySuccess ? (
              <div className="flex flex-col items-center py-4 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-full bg-[#E8F8F0] text-[#2E9B62] flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-[#15171A]">Identity Verified</h3>
                <p className="text-xs text-[#737982] mt-1">Opening Vault...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center mb-3">
                  {authMode === 'biometric' ? (
                    <Fingerprint className="w-8 h-8" />
                  ) : (
                    <KeyRound className="w-7 h-7" />
                  )}
                </div>
                <h3 className="text-base font-bold text-[#15171A] mb-1">
                  Vault Authentication
                </h3>
                <p className="text-xs text-[#737982] mb-4 leading-relaxed">
                  Verify identity to restore full vault access.
                </p>

                {authMode === 'biometric' ? (
                  <div className="flex flex-col gap-2.5 w-full">
                    <button
                      disabled={isVerifying}
                      onClick={handleVerifyBiometrics}
                      className="w-full py-3 rounded-xl bg-[#3157D5] text-white font-bold text-xs shadow-md hover:bg-[#2847B5] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Fingerprint className="w-4 h-4" />
                      <span>{isVerifying ? 'Verifying...' : 'Verify Biometric'}</span>
                    </button>

                    <button
                      onClick={() => setAuthMode('pin')}
                      className="w-full py-2.5 rounded-xl bg-[#F6F7F9] text-xs font-bold text-[#15171A] hover:bg-[#EAECEF]"
                    >
                      Unlock with Master PIN
                    </button>
                  </div>
                ) : (
                  <div className="w-full">
                    <PinPad
                      pinLength={6}
                      onComplete={handlePinSubmit}
                      error={pinError}
                      showBiometricButton={false}
                    />

                    <button
                      onClick={() => setAuthMode('biometric')}
                      className="mt-3 text-xs font-semibold text-[#3157D5] hover:underline"
                    >
                      ← Switch to Biometrics
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setShowBiometricModal(false)}
                  className="w-full py-2.5 mt-2 rounded-xl text-xs font-semibold text-[#737982] hover:text-[#15171A]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
