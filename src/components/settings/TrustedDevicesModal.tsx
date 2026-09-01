import React, { useState } from 'react';
import {
  X,
  Smartphone,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  QrCode,
  AlertTriangle,
  Info,
  Clock,
  Key,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { TrustedDevice } from '../../types';
import { PairDeviceModal } from '../security/PairDeviceModal';

interface TrustedDevicesModalProps {
  onClose: () => void;
}

export const TrustedDevicesModal: React.FC<TrustedDevicesModalProps> = ({ onClose }) => {
  const { trustedDevices, revokeTrustedDevice, showToast } = useVault();
  const [showPairModal, setShowPairModal] = useState<boolean>(false);
  const [revokingDevice, setRevokingDevice] = useState<TrustedDevice | null>(null);

  const handleConfirmRevoke = async () => {
    if (!revokingDevice) return;
    await revokeTrustedDevice(revokingDevice.id);
    showToast(`Trust revoked for ${revokingDevice.name}`);
    setRevokingDevice(null);
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
              <div className="w-10 h-10 rounded-2xl bg-[#E6F6F4] text-[#0D9488] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#15171A]">Trusted Devices</h3>
                <p className="text-xs text-[#737982] mt-0.5">Cryptographically paired hardware</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-[#F6F7F9] hover:bg-[#EAECEF] text-[#737982] hover:text-[#15171A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Primary Action: Pair New Device (QR-First) */}
            <button
              onClick={() => setShowPairModal(true)}
              className="w-full py-3.5 px-4 rounded-[22px] bg-[#3157D5] hover:bg-[#2847B5] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>+ Pair New Device</span>
            </button>

            {/* Trusted Devices List */}
            <div className="space-y-3 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#737982] block px-1">
                Authorized Hardware
              </span>

              {trustedDevices.map((device) => {
                const isMain = device.role === 'main' || device.isCurrentDevice;
                const isRevoked = device.status === 'revoked';

                return (
                  <div
                    key={device.id}
                    className={`rounded-[24px] p-4 border transition-all ${
                      isRevoked
                        ? 'bg-[#FBFBFC] border-[#E7E9ED] opacity-60'
                        : 'bg-white border-[#E7E9ED] shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                            isMain
                              ? 'bg-[#EBF1FE] text-[#3157D5]'
                              : isRevoked
                              ? 'bg-[#F0F2F5] text-[#737982]'
                              : 'bg-[#E6F7ED] text-[#2E9B62]'
                          }`}
                        >
                          <Smartphone className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-[#15171A]">
                              {device.name}
                            </h4>

                            {isMain ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#EBF1FE] text-[#3157D5]">
                                MAIN DEVICE
                              </span>
                            ) : isRevoked ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#D64545]">
                                REVOKED
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#E6F7ED] text-[#2E9B62]">
                                RECOVERY DEVICE
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[#737982] mt-0.5">{device.model}</p>

                          <div className="mt-2 flex items-center gap-3 text-[11px] text-[#737982] flex-wrap">
                            <span className="flex items-center gap-1 font-mono">
                              <Key className="w-3 h-3 text-[#3157D5]" />
                              {device.fingerprint || 'SHA256:7F89...A4B2'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#737982]" />
                              {device.status === 'active' ? 'Active' : 'Paired'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Revoke Action */}
                      {!isMain && !isRevoked && (
                        <button
                          onClick={() => setRevokingDevice(device)}
                          className="p-2 rounded-xl text-[#737982] hover:text-[#D64545] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                          title="Revoke Device"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Information Notice */}
            <div className="bg-[#F6F7F9] rounded-2xl p-3.5 border border-[#E7E9ED] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#3157D5] shrink-0 mt-0.5" />
              <p className="text-xs text-[#737982] leading-relaxed">
                Trusted devices can receive independent encrypted snapshots. Changes or deletions on one
                device will never delete items on another.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* QR-First Pair Device Modal */}
      {showPairModal && (
        <PairDeviceModal
          onClose={() => setShowPairModal(false)}
          onDevicePaired={() => {
            setShowPairModal(false);
          }}
        />
      )}

      {/* Revocation Confirmation Dialog */}
      {revokingDevice && (
        <div
          onClick={() => setRevokingDevice(null)}
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[28px] p-6 max-w-sm w-full border border-[#E7E9ED] shadow-2xl space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FEE2E2] text-[#D64545] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-[#15171A]">
                Revoke {revokingDevice.name}?
              </h4>
              <p className="text-xs text-[#737982] mt-1 leading-relaxed">
                Revoking will prevent future pairing-based transfers. A new QR scan pairing session will
                be required to restore trust.
              </p>
              <p className="text-[11px] text-[#A1A7B0] mt-2 italic">
                Note: Offline recovery snapshots previously saved on that device remain intact.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setRevokingDevice(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#F6F7F9] hover:bg-[#EAECEF] text-xs font-bold text-[#737982] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRevoke}
                className="flex-1 py-2.5 rounded-xl bg-[#D64545] hover:bg-[#B91C1C] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Revoke Trust
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
