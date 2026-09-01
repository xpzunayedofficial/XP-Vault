import React, { useState } from 'react';
import {
  X,
  FolderPlus,
  Check,
  Folder as FolderIcon,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

interface FolderModalProps {
  onClose: () => void;
}

export const FolderModal: React.FC<FolderModalProps> = ({ onClose }) => {
  const { createFolder, showToast } = useVault();
  const [folderName, setFolderName] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('#3157D5');

  const colorPalette = [
    '#3157D5',
    '#8B5CF6',
    '#0D9488',
    '#2E9B62',
    '#D97706',
    '#EC4899',
    '#15171A',
  ];

  const handleCreate = async () => {
    if (!folderName.trim()) {
      showToast('Folder name is required');
      return;
    }

    await createFolder(folderName.trim(), selectedColor);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="vault-card-elevated rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md bg-white border border-[#E7E9ED] shadow-2xl animate-in slide-in-from-bottom-6 duration-200 select-none"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#15171A]">New Folder</h3>
              <p className="text-[11px] text-[#737982]">Categorize encrypted files</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#F0F2F5] text-[#737982]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-[#737982] uppercase tracking-wider block mb-1">
              Folder Name
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. Identity Documents, Tax 2026"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F7F9] border border-[#E7E9ED] text-xs font-bold text-[#15171A] focus:outline-none focus:border-[#3157D5]"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#737982] uppercase tracking-wider block mb-2">
              Folder Color
            </label>
            <div className="flex items-center gap-2">
              {colorPalette.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    selectedColor === color ? 'scale-115 ring-2 ring-offset-2 ring-[#3157D5]' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            className="w-full py-3 rounded-2xl bg-[#3157D5] text-white font-bold text-xs shadow-md hover:bg-[#2847B5] active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Create Folder</span>
          </button>
        </div>
      </div>
    </div>
  );
};
