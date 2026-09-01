import React, { useRef, useState } from 'react';
import {
  X,
  HardDriveDownload,
  UploadCloud,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Download,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

interface BackupModalProps {
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ onClose }) => {
  const { createEncryptedBackup, restoreFromBackup, settings, showToast } = useVault();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restorePin, setRestorePin] = useState<string>('');
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const backupJson = await createEncryptedBackup();
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `XP_Vault_Backup_${new Date().toISOString().slice(0, 10)}.enc`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Encrypted backup exported');
    } catch (e) {
      console.error(e);
      showToast('Failed to create backup');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedBackupFile(e.target.files[0]);
    }
  };

  const handleExecuteRestore = async () => {
    if (!selectedBackupFile) {
      setRestoreError('Please select a .enc backup file');
      return;
    }
    if (!restorePin || restorePin.length < 4) {
      setRestoreError('Enter the master PIN associated with this backup');
      return;
    }

    setIsRestoring(true);
    setRestoreError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const res = await restoreFromBackup(text, restorePin);
        setIsRestoring(false);
        if (res.success) {
          showToast('Vault restored successfully');
          onClose();
        } else {
          setRestoreError(res.message || 'Failed to restore: Invalid PIN or corrupt file');
        }
      };
      reader.readAsText(selectedBackupFile);
    } catch (err: any) {
      setIsRestoring(false);
      setRestoreError(err.message || 'Failed to parse backup archive');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".enc,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="vault-card-elevated rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md bg-white border border-[#E7E9ED] shadow-2xl animate-in slide-in-from-bottom-6 duration-200 max-h-[90vh] overflow-y-auto select-none"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E8F8F0] text-[#2E9B62] flex items-center justify-center">
              <HardDriveDownload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#15171A]">Encrypted Backup</h3>
              <p className="text-[11px] text-[#737982]">Independent offline recovery files</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#F0F2F5] text-[#737982]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Export Section */}
          <div className="vault-card rounded-2xl p-4 space-y-3 border border-[#E7E9ED]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#15171A]">Create Encrypted Backup</h4>
                <p className="text-[11px] text-[#737982]">
                  {settings.lastBackupAt
                    ? `Last backup: ${new Date(settings.lastBackupAt).toLocaleDateString()}`
                    : 'No previous backup recorded'}
                </p>
              </div>
              <ShieldCheck className="w-5 h-5 text-[#2E9B62]" />
            </div>

            <button
              disabled={isExporting}
              onClick={handleExportBackup}
              className="w-full py-3 rounded-xl bg-[#2E9B62] text-white font-bold text-xs shadow-md hover:bg-[#268352] active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Packaging Enclave...' : 'Export Backup (.enc)'}</span>
            </button>
          </div>

          {/* Restore Section */}
          <div className="vault-card rounded-2xl p-4 space-y-3 border border-[#E7E9ED]">
            <h4 className="text-xs font-bold text-[#15171A]">Restore Vault Archive</h4>
            <p className="text-[11px] text-[#737982]">
              Select a previously exported .enc archive and enter your backup PIN.
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-xl bg-[#F6F7F9] border border-dashed border-[#CBD2DC] text-xs font-bold text-[#15171A] hover:bg-[#EAECEF] flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-4 h-4 text-[#3157D5]" />
              <span>
                {selectedBackupFile ? selectedBackupFile.name : 'Select .enc Backup File'}
              </span>
            </button>

            {selectedBackupFile && (
              <div className="space-y-2 pt-2 border-t border-[#E7E9ED]">
                <label className="text-[11px] font-bold text-[#737982] uppercase tracking-wider block">
                  Backup Master PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={restorePin}
                  onChange={(e) => setRestorePin(e.target.value)}
                  placeholder="Enter 6-digit PIN"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F6F7F9] border border-[#E7E9ED] text-xs font-mono font-bold text-[#15171A] focus:outline-none focus:border-[#3157D5]"
                />

                {restoreError && (
                  <p className="text-[11px] text-[#D64545] font-semibold">{restoreError}</p>
                )}

                <button
                  disabled={isRestoring}
                  onClick={handleExecuteRestore}
                  className="w-full py-2.5 rounded-xl bg-[#3157D5] text-white font-bold text-xs shadow-md hover:bg-[#2847B5] active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isRestoring ? 'Restoring...' : 'Verify & Restore Vault'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
