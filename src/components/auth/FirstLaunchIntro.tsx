import React, { useState } from 'react';
import { Shield, Lock, Fingerprint, Key, CheckCircle2, ArrowRight } from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { PinPad } from '../common/PinPad';

export const FirstLaunchIntro: React.FC = () => {
  const { initializeVault, settings } = useVault();
  const [step, setStep] = useState<'welcome' | 'create_pin' | 'confirm_pin' | 'biometrics' | 'completing'>('welcome');
  const [firstPin, setFirstPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(true);

  const handleCreatePin = (pin: string) => {
    setFirstPin(pin);
    setPinError(null);
    setStep('confirm_pin');
  };

  const handleConfirmPin = async (confirmPin: string) => {
    if (confirmPin !== firstPin) {
      setPinError('PINs do not match. Please try again.');
      return;
    }

    setPinError(null);
    setStep('biometrics');
  };

  const handleFinishSetup = async () => {
    setStep('completing');
    setTimeout(async () => {
      await initializeVault(firstPin, biometricEnabled);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9] flex flex-col items-center justify-center p-6 text-[#15171A]">
      <div className="w-full max-w-sm mx-auto">
        {step === 'welcome' && (
          <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
            {/* Vault Geometric Mark */}
            <img 
              src="https://i.postimg.cc/m2rHQv1L/a-single-premium-abstract-geometric-monogram-icon.png"
              alt="XP Vault Logo"
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-3xl object-cover shadow-[0_10px_30px_rgba(0,0,0,0.1)] border-2 border-white mb-6"
            />

            <h1 className="text-2xl font-extrabold tracking-tight text-[#15171A] mb-2">
              XP VAULT
            </h1>
            <p className="text-sm font-semibold text-[#3157D5] tracking-wide mb-6">
              SILENT SECURITY
            </p>

            <div className="vault-card rounded-2xl p-5 text-left mb-8 w-full space-y-3.5 border border-[#E7E9ED]">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#15171A]">Local-First & Offline</h3>
                  <p className="text-[11px] text-[#737982] leading-relaxed">
                    Zero mandatory cloud. Your private files never leave this device.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#15171A]">AES-GCM-256 Encryption</h3>
                  <p className="text-[11px] text-[#737982] leading-relaxed">
                    Genuine hardware-backed authenticated encryption with PBKDF2.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center shrink-0 mt-0.5">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#15171A]">Multi-Lock Protection</h3>
                  <p className="text-[11px] text-[#737982] leading-relaxed">
                    Biometric authentication, Emergency privacy screen, and Hidden recovery.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('create_pin')}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#3157D5] text-white font-bold text-sm shadow-md hover:bg-[#2847B5] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Create Your Vault</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 'create_pin' && (
          <div className="flex flex-col items-center text-center animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-[#15171A] mb-1">Create Vault PIN</h2>
            <p className="text-xs text-[#737982] max-w-xs mb-2">
              Set a 6-digit cryptographic master PIN to protect your vault keys.
            </p>

            <PinPad
              pinLength={6}
              onComplete={handleCreatePin}
              showBiometricButton={false}
              error={pinError}
            />
          </div>
        )}

        {step === 'confirm_pin' && (
          <div className="flex flex-col items-center text-center animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center mb-4">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-[#15171A] mb-1">Confirm Master PIN</h2>
            <p className="text-xs text-[#737982] max-w-xs mb-2">
              Re-enter your 6-digit PIN to ensure accuracy.
            </p>

            <PinPad
              pinLength={6}
              onComplete={handleConfirmPin}
              showBiometricButton={false}
              error={pinError}
            />

            <button
              onClick={() => {
                setStep('create_pin');
                setFirstPin('');
                setPinError(null);
              }}
              className="mt-4 text-xs font-semibold text-[#737982] hover:text-[#15171A]"
            >
              ← Change chosen PIN
            </button>
          </div>
        )}

        {step === 'biometrics' && (
          <div className="flex flex-col items-center text-center animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center mb-5">
              <Fingerprint className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-[#15171A] mb-1">Enable Biometrics</h2>
            <p className="text-xs text-[#737982] max-w-xs mb-6 leading-relaxed">
              Use your device's secure Fingerprint or Face biometric authentication for instant access.
            </p>

            <div className="vault-card rounded-2xl p-4 w-full flex items-center justify-between mb-8 border border-[#E7E9ED]">
              <div className="text-left">
                <span className="text-sm font-bold text-[#15171A] block">Biometric Authentication</span>
                <span className="text-[11px] text-[#737982]">Fingerprint & Face Unlock</span>
              </div>
              <button
                type="button"
                onClick={() => setBiometricEnabled(!biometricEnabled)}
                className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                  biometricEnabled ? 'bg-[#3157D5]' : 'bg-[#DDE1E6]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform shadow-xs ${
                    biometricEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleFinishSetup}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#3157D5] text-white font-bold text-sm shadow-md hover:bg-[#2847B5] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Initialize Vault</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 'completing' && (
          <div className="flex flex-col items-center text-center animate-in fade-in duration-200 py-12">
            <div className="w-16 h-16 rounded-full border-3 border-[#3157D5] border-t-transparent animate-spin mb-6" />
            <h3 className="text-lg font-bold text-[#15171A] mb-1">Securing Your Space</h3>
            <p className="text-xs text-[#737982]">Deriving PBKDF2 keys & establishing secure enclave...</p>
          </div>
        )}
      </div>
    </div>
  );
};
