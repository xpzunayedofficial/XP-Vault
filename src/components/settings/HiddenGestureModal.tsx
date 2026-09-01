import React, { useState, useRef } from 'react';
import {
  X,
  Hand,
  Check,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

interface HiddenGestureModalProps {
  onClose: () => void;
}

export const HiddenGestureModal: React.FC<HiddenGestureModalProps> = ({ onClose }) => {
  const { settings, updateSettings, showToast } = useVault();

  const [pattern, setPattern] = useState<number[]>(settings.hiddenRecoveryGesture || [3, 3, 3, 1]);
  const [recordedBlocks, setRecordedBlocks] = useState<number[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const currentTapsRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTestTap = () => {
    if (!isRecording) return;

    currentTapsRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const count = currentTapsRef.current;
      currentTapsRef.current = 0;
      setRecordedBlocks((prev) => [...prev, count]);
    }, 600);
  };

  const handleSavePattern = () => {
    if (recordedBlocks.length < 2) {
      showToast('Record at least 2 tap blocks');
      return;
    }
    updateSettings({ hiddenRecoveryGesture: recordedBlocks });
    setPattern(recordedBlocks);
    setIsRecording(false);
    showToast('Hidden recovery tap pattern saved');
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
            <div className="w-8 h-8 rounded-xl bg-[#F3EEFD] text-[#8B5CF6] flex items-center justify-center">
              <Hand className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#15171A]">Hidden Recovery Gesture</h3>
              <p className="text-[11px] text-[#737982]">Tap pattern to exit Privacy Mode</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#F0F2F5] text-[#737982]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Current Pattern Badge */}
          <div className="vault-card rounded-2xl p-4 bg-[#F6F7F9] border border-[#E7E9ED] text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#737982] block mb-2">
              Active Pattern Sequence
            </span>
            <div className="flex items-center justify-center gap-2">
              {(isRecording ? recordedBlocks : pattern).map((blockCount, idx) => (
                <React.Fragment key={idx}>
                  <div className="w-9 h-9 rounded-xl bg-[#3157D5] text-white flex items-center justify-center text-xs font-bold font-mono shadow-xs">
                    {blockCount}
                  </div>
                  {idx < (isRecording ? recordedBlocks : pattern).length - 1 && (
                    <span className="text-xs text-[#737982] font-mono">pause</span>
                  )}
                </React.Fragment>
              ))}
              {(isRecording ? recordedBlocks : pattern).length === 0 && (
                <span className="text-xs text-[#737982]">Tap in the zone below to record...</span>
              )}
            </div>
          </div>

          {/* Interactive Tap Pad */}
          {isRecording ? (
            <div className="space-y-3">
              <div
                onClick={handleTestTap}
                className="w-full h-36 rounded-2xl bg-[#EBF1FE] border-2 border-dashed border-[#3157D5] flex flex-col items-center justify-center cursor-pointer active:bg-[#DDE8FD] transition-colors"
              >
                <Hand className="w-8 h-8 text-[#3157D5] mb-2 animate-bounce" />
                <span className="text-xs font-bold text-[#3157D5]">
                  Tap here in intervals (e.g. 3 taps, wait, 3 taps...)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRecordedBlocks([])}
                  className="flex-1 py-2.5 rounded-xl bg-[#F0F2F5] text-[#15171A] text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
                <button
                  onClick={handleSavePattern}
                  className="flex-1 py-2.5 rounded-xl bg-[#3157D5] text-white text-xs font-bold shadow-md hover:bg-[#2847B5]"
                >
                  Save Pattern
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => {
                  setRecordedBlocks([]);
                  setIsRecording(true);
                }}
                className="w-full py-3 rounded-xl bg-[#3157D5] text-white font-bold text-xs shadow-md hover:bg-[#2847B5]"
              >
                Record Custom Gesture
              </button>

              <button
                onClick={() => {
                  updateSettings({ hiddenRecoveryGesture: [3, 3, 3, 1] });
                  setPattern([3, 3, 3, 1]);
                  showToast('Reset to default [3, 3, 3, 1]');
                }}
                className="w-full py-2 rounded-xl text-xs font-semibold text-[#737982] hover:text-[#15171A]"
              >
                Reset to Default (3 - 3 - 3 - 1)
              </button>
            </div>
          )}

          {/* Privacy Screen Explanation note */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F0F4FF] text-[11px] text-[#3157D5] leading-relaxed">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              When Emergency Privacy Screen is active, XP Vault will appear as a standby clock.
              Tapping this exact rhythm will reveal the biometric authentication prompt to unlock.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
