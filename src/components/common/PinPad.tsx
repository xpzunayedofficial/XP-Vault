import React, { useState, useEffect } from 'react';
import { Delete, Fingerprint, ScanFace } from 'lucide-react';
import { useVault } from '../../context/VaultContext';

interface PinPadProps {
  pinLength?: number;
  onComplete: (pin: string) => void;
  onBiometricClick?: () => void;
  showBiometricButton?: boolean;
  error?: string | null;
  resetOnComplete?: boolean;
}

export const PinPad: React.FC<PinPadProps> = ({
  pinLength = 6,
  onComplete,
  onBiometricClick,
  showBiometricButton = true,
  error,
  resetOnComplete = true,
}) => {
  const [pin, setPin] = useState<string>('');
  const { settings } = useVault();

  useEffect(() => {
    if (error) {
      // Clear entered digits when error occurs
      setPin('');
    }
  }, [error]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea element
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, pinLength, resetOnComplete]);

  const handleDigit = (digit: string) => {
    if (pin.length < pinLength) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === pinLength) {
        onComplete(nextPin);
        if (resetOnComplete) {
          setTimeout(() => setPin(''), 250);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  return (
    <div className="w-full max-w-[320px] mx-auto flex flex-col items-center">
      {/* PIN Dots Indicator */}
      <div className={`flex items-center justify-center gap-3.5 my-6 ${error ? 'animate-shake' : ''}`}>
        {Array.from({ length: pinLength }).map((_, idx) => {
          const isFilled = idx < pin.length;
          return (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                isFilled
                  ? 'scale-110 shadow-xs'
                  : 'bg-[#E7E9ED] scale-100'
              }`}
              style={{
                backgroundColor: isFilled ? (error ? '#D64545' : settings.accentColor) : undefined,
              }}
            />
          );
        })}
      </div>

      {error && (
        <p className="text-xs font-semibold text-[#D64545] text-center mb-4 tracking-tight">
          {error}
        </p>
      )}

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-3.5 w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleDigit(num.toString())}
            className="w-18 h-18 mx-auto rounded-full bg-white border border-[#E7E9ED] text-2xl font-bold text-[#15171A] hover:bg-[#F0F2F5] active:scale-90 active:bg-[#E2E6EC] transition-all flex flex-col items-center justify-center shadow-2xs cursor-pointer select-none"
          >
            <span>{num}</span>
          </button>
        ))}

        {/* Bottom row: Biometric / Reset, 0, Backspace */}
        <div className="w-18 h-18 mx-auto flex items-center justify-center">
          {showBiometricButton && onBiometricClick ? (
            <button
              type="button"
              onClick={onBiometricClick}
              className="w-14 h-14 rounded-full bg-[#EBF1FE] text-[#3157D5] hover:bg-[#DDE8FD] active:scale-90 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
              title="Authenticate with Biometrics"
            >
              {settings.faceUnlockEnabled ? <ScanFace className="w-6 h-6" /> : <Fingerprint className="w-6 h-6" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-semibold text-[#737982] hover:text-[#15171A] p-2"
            >
              Clear
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="w-18 h-18 mx-auto rounded-full bg-white border border-[#E7E9ED] text-2xl font-bold text-[#15171A] hover:bg-[#F0F2F5] active:scale-90 active:bg-[#E2E6EC] transition-all flex items-center justify-center shadow-2xs cursor-pointer select-none"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className="w-18 h-18 mx-auto rounded-full text-[#737982] hover:text-[#15171A] hover:bg-[#F0F2F5] active:scale-90 transition-all flex items-center justify-center cursor-pointer"
          title="Backspace"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
