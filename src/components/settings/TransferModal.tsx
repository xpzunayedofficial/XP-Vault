import React, { useState } from 'react';
import {
  X,
  Share2,
  QrCode,
  ShieldCheck,
  Download,
  Info,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { PairDeviceModal } from '../security/PairDeviceModal';

interface TransferModalProps {
  onClose: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ onClose }) => {
  const { trustedDevices, showToast, items, notes, passwords } = useVault();
  const [showPairModal, setShowPairModal] = useState<boolean>(false);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [transferDone, setTransferDone] = useState<boolean>(false);

  const activeSecondaryDevices = trustedDevices.filter(
    (d) => d.role !== 'main' && !d.isCurrentDevice && d.status !== 'revoked'
  );

  const handleExecuteTransfer = (deviceName: string) => {
    setIsTransferring(true);
    setTimeout(() => {
      setIsTransferring(false);
      setTransferDone(true);
      showToast(`Encrypted vault snapshot transferred to ${deviceName}`);
    }, 1400);
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-7 w-full max-w-lg border border-[#E7E9ED] shadow-[0_20px_60px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom-6 duration-200 max-h-[90vh] overflow-y-auto select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#15171A]">Cross-Device Vault Transfer</h3>
                <p className="text-xs text-[#737982] mt-0.5">Secure QR pairing & independent recovery copy</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-[#F6F7F9] hover:bg-[#EAECEF] text-[#737982] hover:text-[#15171A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 text-left">
            {/* Primary Action: QR Pair New Device */}
            <div className="bg-[#F6F7F9] rounded-[24px] p-4 border border-[#E7E9ED] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#15171A]">Pair Device via QR Scan</h4>
                    <p className="text-[11px] text-[#737982]">Primary device-to-device secure channel</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowPairModal(true)}
                className="w-full py-3 rounded-xl bg-[#3157D5] hover:bg-[#2847B5] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Start QR Device Pairing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Existing Paired Devices Section */}
            {activeSecondaryDevices.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#737982] block px-1">
                  Or Send to Existing Trusted Device
                </span>

                {activeSecondaryDevices.map((dev) => (
                  <div
                    key={dev.id}
                    className="bg-white rounded-[22px] p-3.5 border border-[#E7E9ED] hover:border-[#3157D5] transition-all flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E6F7ED] text-[#2E9B62] flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-xs sm:text-sm font-bold text-[#15171A]">{dev.name}</h5>
                        <p className="text-[11px] text-[#737982]">{dev.model}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleExecuteTransfer(dev.name)}
                      disabled={isTransferring}
                      className="px-3.5 py-2 rounded-xl bg-[#F6F7F9] hover:bg-[#EBF1FE] hover:text-[#3157D5] text-[#15171A] text-xs font-bold transition-colors cursor-pointer border border-[#E7E9ED] flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Send Snapshot</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Transfer In Progress Overlay */}
            {isTransferring && (
              <div className="p-4 rounded-2xl bg-[#EBF1FE] border border-[#CBD2DC] text-center space-y-2">
                <p className="text-xs font-bold text-[#3157D5]">
                  Transferring encrypted zero-knowledge snapshot...
                </p>
              </div>
            )}

            {/* Transfer Done Message */}
            {transferDone && (
              <div className="p-4 rounded-2xl bg-[#E6F7ED] border border-[#B9E9CB] text-left flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E9B62] shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-[#15171A]">Snapshot Transferred Successfully</h5>
                  <p className="text-[11px] text-[#737982] mt-0.5 leading-relaxed">
                    The receiving device holds an independent encrypted copy. Deletions on either device
                    will not delete items from the other.
                  </p>
                </div>
              </div>
            )}

            {/* Delete Independence Notice */}
            <div className="bg-[#FFFBEB] rounded-2xl p-3.5 border border-[#FDE68A] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <p className="text-xs text-[#92400E] leading-relaxed">
                <strong>Snapshot Architecture:</strong> Transfers create independent recovery enclaves.
                XP Vault does not perform live two-way synchronization.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* QR Pairing Modal */}
      {showPairModal && (
        <PairDeviceModal
          onClose={() => setShowPairModal(false)}
          onDevicePaired={() => {
            setShowPairModal(false);
          }}
        />
      )}
    </>
  );
};
