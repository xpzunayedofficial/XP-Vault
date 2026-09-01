import React, { useState } from 'react';
import {
  X,
  Lock,
  Fingerprint,
  Timer,
  ShieldAlert,
  Check,
  KeyRound,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { AutoLockDelay } from '../../types';
import { PinPad } from '../common/PinPad';

interface LockCenterModalProps {
  onClose: () => void;
}

export const LockCenterModal: React.FC<LockCenterModalProps> = ({ onClose }) => {
  const { settings, updateSettings, changePin, showToast } = useVault();

  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [oldPin, setOldPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [pinStep, setPinStep] = useState<'verify_old' | 'enter_new' | 'confirm_new'>('verify_old');
  const [pinError, setPinError] = useState<string | null>(null);

  const autoLockOptions: { label: string; value: AutoLockDelay }[] = [
    { label: 'Immediately', value: 'immediately' },
    { label: '30 Seconds', value: '30s' },
    { label: '1 Minute', value: '1m' },
    { label: '5 Minutes', value: '5m' },
    { label: '15 Minutes', value: '15m' },
  ];

  const failedAttemptOptions = [3, 5, 10];

  const handleOldPinSubmit = (pin: string) => {
    setOldPin(pin);
    setPinError(null);
    setPinStep('enter_new');
  };

  const handleNewPinSubmit = (pin: string) => {
    setNewPin(pin);
    setPinError(null);
    setPinStep('confirm_new');
  };

  const handleConfirmPinSubmit = async (confirmPin: string) => {
    if (confirmPin !== newPin) {
      setPinError('PINs do not match');
      return;
    }

    const res = await changePin(oldPin, newPin);
    if (res.success) {
      showToast('Master Vault PIN updated');
      setIsChangingPin(false);
      setPinStep('verify_old');
      setOldPin('');
      setNewPin('');
    } else {
      setPinError(res.message || 'Current PIN was incorrect');
      setPinStep('verify_old');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="vault-card-elevated rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md bg-white border border-[#E7E9ED] shadow-2xl animate-in slide-in-from-bottom-6 duration-200 max-h-[90vh] overflow-y-auto select-none"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#15171A]">Lock Center</h3>
              <p className="text-[11px] text-[#737982]">Authentication & Auto-lock</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#F0F2F5] text-[#737982]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isChangingPin ? (
          <div className="space-y-4 py-2">
            <div className="text-center">
              <h4 className="text-sm font-bold text-[#15171A]">
                {pinStep === 'verify_old'
                  ? 'Enter Current PIN'
                  : pinStep === 'enter_new'
                  ? 'Enter New 6-Digit PIN'
                  : 'Confirm New 6-Digit PIN'}
              </h4>
              <p className="text-xs text-[#737982] mt-0.5">
                {pinStep === 'verify_old'
                  ? 'Verify your identity to change cryptographic keys'
                  : 'Choose a strong numerical passkey'}
              </p>
            </div>

            <PinPad
              pinLength={6}
              onComplete={
                pinStep === 'verify_old'
                  ? handleOldPinSubmit
                  : pinStep === 'enter_new'
                  ? handleNewPinSubmit
                  : handleConfirmPinSubmit
              }
              error={pinError}
              showBiometricButton={false}
            />

            <button
              onClick={() => {
                setIsChangingPin(false);
                setPinStep('verify_old');
                setPinError(null);
              }}
              className="w-full py-2.5 text-xs font-semibold text-[#737982] hover:text-[#15171A]"
            >
              Cancel PIN Change
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Change PIN Button */}
            <div
              onClick={() => setIsChangingPin(true)}
              className="vault-card rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:border-[#CBD2DC] active:scale-99 transition-all shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#15171A]">Change Master PIN</h4>
                  <p className="text-[11px] text-[#737982]">Re-encrypt vault keys with new 6-digit PIN</p>
                </div>
              </div>
            </div>

            {/* Biometric Toggle */}
            <div className="vault-card rounded-2xl p-3.5 flex items-center justify-between border border-[#E7E9ED]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#E8F8F0] text-[#2E9B62] flex items-center justify-center">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#15171A]">Biometric Unlock</h4>
                  <p className="text-[11px] text-[#737982]">Fingerprint & Face biometric access</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    fingerprintEnabled: !settings.fingerprintEnabled,
                    faceUnlockEnabled: !settings.faceUnlockEnabled,
                  })
                }
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  settings.fingerprintEnabled ? 'bg-[#3157D5]' : 'bg-[#DDE1E6]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow-xs ${
                    settings.fingerprintEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Auto Lock Delay */}
            <div className="vault-card rounded-2xl p-4 space-y-2.5 border border-[#E7E9ED]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#15171A]">
                <Timer className="w-4 h-4 text-[#3157D5]" />
                <span>Auto-Lock Delay</span>
              </div>
              <p className="text-[11px] text-[#737982]">
                Automatically locks vault when leaving or minimizing the app.
              </p>

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {autoLockOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateSettings({ autoLockDelay: opt.value })}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all ${
                      settings.autoLockDelay === opt.value
                        ? 'bg-[#3157D5] text-white shadow-xs'
                        : 'bg-[#F6F7F9] text-[#737982] hover:bg-[#EAECEF]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Failed Attempts */}
            <div className="vault-card rounded-2xl p-4 space-y-2.5 border border-[#E7E9ED]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#15171A]">
                <ShieldAlert className="w-4 h-4 text-[#D64545]" />
                <span>Max Failed Attempts Limit</span>
              </div>
              <p className="text-[11px] text-[#737982]">
                Enforces temporary lockout if incorrect PIN entered consecutively.
              </p>

              <div className="flex items-center gap-2 pt-1">
                {failedAttemptOptions.map((limit) => (
                  <button
                    key={limit}
                    onClick={() => updateSettings({ maxFailedAttempts: limit })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      settings.maxFailedAttempts === limit
                        ? 'bg-[#15171A] text-white shadow-xs'
                        : 'bg-[#F6F7F9] text-[#737982] hover:bg-[#EAECEF]'
                    }`}
                  >
                    {limit} Attempts
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
