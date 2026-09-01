import React, { useState } from 'react';
import {
  X,
  Trash2,
  RotateCcw,
  Flame,
  FileText,
  KeyRound,
  FileIcon,
  AlertTriangle,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

interface TrashModalProps {
  onClose: () => void;
}

export const TrashModal: React.FC<TrashModalProps> = ({ onClose }) => {
  const {
    items,
    notes,
    passwords,
    restoreItem,
    permanentlyDeleteItem,
    restoreNote,
    permanentlyDeleteNote,
    restorePassword,
    permanentlyDeletePassword,
    emptyTrash,
  } = useVault();

  const [showConfirmShredAll, setShowConfirmShredAll] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'files' | 'notes' | 'passwords'>('all');

  const deletedItems = items.filter((i) => i.isDeleted);
  const deletedNotes = notes.filter((n) => n.isDeleted);
  const deletedPasswords = passwords.filter((p) => p.isDeleted);

  const totalTrashCount = deletedItems.length + deletedNotes.length + deletedPasswords.length;

  const handleEmptyTrash = async () => {
    await emptyTrash();
    setShowConfirmShredAll(false);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="vault-card-elevated rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-lg bg-white border border-[#E7E9ED] shadow-2xl animate-in slide-in-from-bottom-6 duration-200 max-h-[90vh] flex flex-col select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FEE2E2] text-[#D64545] flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#15171A]">Secure Trash & Shredder</h3>
              <p className="text-[11px] text-[#737982]">{totalTrashCount} deleted items in quarantine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#F0F2F5] text-[#737982]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {totalTrashCount === 0 ? (
          <div className="py-16 text-center text-[#737982] my-auto">
            <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold text-[#15171A]">Trash is clean</p>
            <p className="text-xs mt-1 text-[#737982]">No items currently scheduled for shredding.</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-4 overflow-hidden">
            {/* Shred All Action Area */}
            {showConfirmShredAll ? (
              <div className="p-4 rounded-2xl bg-[#FFF5F5] border border-[#FCA5A5] space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-[#D64545] font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Permanently shred all {totalTrashCount} items?</span>
                </div>
                <p className="text-[11px] text-[#737982]">
                  This performs zero-fill cryptographic wipe. This action cannot be recovered.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowConfirmShredAll(false)}
                    className="flex-1 py-2 text-xs font-bold text-[#737982] bg-white rounded-xl border border-[#E7E9ED] hover:bg-[#F6F7F9]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEmptyTrash}
                    className="flex-1 py-2 text-xs font-bold text-white bg-[#D64545] rounded-xl shadow-xs hover:bg-[#B91C1C]"
                  >
                    Yes, Shred All
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmShredAll(true)}
                className="w-full py-2.5 rounded-2xl bg-[#D64545] text-white font-bold text-xs shadow-md hover:bg-[#B91C1C] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                <span>Permanently Shred All ({totalTrashCount})</span>
              </button>
            )}

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-[#F6F7F9] rounded-xl border border-[#E7E9ED] text-xs">
              <button
                onClick={() => setActiveFilter('all')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center ${
                  activeFilter === 'all' ? 'bg-white shadow-2xs text-[#15171A]' : 'text-[#737982]'
                }`}
              >
                All ({totalTrashCount})
              </button>
              <button
                onClick={() => setActiveFilter('files')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center ${
                  activeFilter === 'files' ? 'bg-white shadow-2xs text-[#15171A]' : 'text-[#737982]'
                }`}
              >
                Files ({deletedItems.length})
              </button>
              <button
                onClick={() => setActiveFilter('notes')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center ${
                  activeFilter === 'notes' ? 'bg-white shadow-2xs text-[#15171A]' : 'text-[#737982]'
                }`}
              >
                Notes ({deletedNotes.length})
              </button>
              <button
                onClick={() => setActiveFilter('passwords')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center ${
                  activeFilter === 'passwords' ? 'bg-white shadow-2xs text-[#15171A]' : 'text-[#737982]'
                }`}
              >
                Passwords ({deletedPasswords.length})
              </button>
            </div>

            {/* List of Trash items */}
            <div className="space-y-2 overflow-y-auto max-h-64 pr-1">
              {/* Deleted Files */}
              {(activeFilter === 'all' || activeFilter === 'files') &&
                deletedItems.map((item) => (
                  <div
                    key={item.id}
                    className="vault-card rounded-xl p-3 flex items-center justify-between border border-[#E7E9ED] bg-white"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center shrink-0">
                        <FileIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#15171A] truncate">{item.name}</p>
                        <p className="text-[10px] text-[#737982]">
                          {(item.size / 1024).toFixed(0)} KB • Encrypted File
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => restoreItem(item.id)}
                        className="p-1.5 rounded-lg bg-[#EBF1FE] text-[#3157D5] hover:bg-[#DDE8FD]"
                        title="Restore to Vault"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => permanentlyDeleteItem(item.id)}
                        className="p-1.5 rounded-lg text-[#737982] hover:text-[#D64545] hover:bg-[#FEE2E2]"
                        title="Permanently Shred"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

              {/* Deleted Notes */}
              {(activeFilter === 'all' || activeFilter === 'notes') &&
                deletedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="vault-card rounded-xl p-3 flex items-center justify-between border border-[#E7E9ED] bg-white"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#15171A] truncate">{note.title || 'Untitled Note'}</p>
                        <p className="text-[10px] text-[#737982]">Secure Note</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => restoreNote(note.id)}
                        className="p-1.5 rounded-lg bg-[#EBF1FE] text-[#3157D5] hover:bg-[#DDE8FD]"
                        title="Restore Note"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => permanentlyDeleteNote(note.id)}
                        className="p-1.5 rounded-lg text-[#737982] hover:text-[#D64545] hover:bg-[#FEE2E2]"
                        title="Permanently Shred Note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

              {/* Deleted Passwords */}
              {(activeFilter === 'all' || activeFilter === 'passwords') &&
                deletedPasswords.map((entry) => (
                  <div
                    key={entry.id}
                    className="vault-card rounded-xl p-3 flex items-center justify-between border border-[#E7E9ED] bg-white"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-[#E8F8F0] text-[#2E9B62] flex items-center justify-center shrink-0">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#15171A] truncate">{entry.title}</p>
                        <p className="text-[10px] text-[#737982]">{entry.username || 'Password Credential'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => restorePassword(entry.id)}
                        className="p-1.5 rounded-lg bg-[#EBF1FE] text-[#3157D5] hover:bg-[#DDE8FD]"
                        title="Restore Credential"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => permanentlyDeletePassword(entry.id)}
                        className="p-1.5 rounded-lg text-[#737982] hover:text-[#D64545] hover:bg-[#FEE2E2]"
                        title="Permanently Shred Credential"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
