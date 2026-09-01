import React, { useRef, useState } from 'react';
import {
  X,
  Image,
  FileText,
  Camera,
  FileCode,
  Key,
  FolderPlus,
  Upload,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

interface AddActionModalProps {
  onClose: () => void;
}

export const AddActionModal: React.FC<AddActionModalProps> = ({ onClose }) => {
  const {
    importFiles,
    setActiveModal,
    setSelectedNote,
    setSelectedPassword,
  } = useVault();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setIsProcessing(true);
      try {
        await importFiles(filesArray);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsProcessing(false);
        onClose();
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setIsProcessing(true);
      try {
        await importFiles(filesArray);
      } finally {
        setIsProcessing(false);
        onClose();
      }
    }
  };

  const actionItems = [
    {
      title: 'Import Photos & Videos',
      desc: 'Encrypt media from device gallery',
      icon: Image,
      color: '#3157D5',
      bg: '#EBF1FE',
      action: () => {
        if (fileInputRef.current) {
          fileInputRef.current.accept = 'image/*,video/*';
          fileInputRef.current.click();
        }
      },
    },
    {
      title: 'Import Files & Documents',
      desc: 'PDFs, spreadsheets, contracts, archives',
      icon: FileText,
      color: '#0D9488',
      bg: '#E6F6F4',
      action: () => {
        if (fileInputRef.current) {
          fileInputRef.current.accept = '*/*';
          fileInputRef.current.click();
        }
      },
    },
    {
      title: 'Scan Document (Camera)',
      desc: 'Perspective crop & OCR contrast filter',
      icon: Camera,
      color: '#8B5CF6',
      bg: '#F3EEFD',
      action: () => {
        onClose();
        setActiveModal('docScanner');
      },
    },
    {
      title: 'New Secure Note',
      desc: 'AES-GCM encrypted confidential note',
      icon: FileCode,
      color: '#D97706',
      bg: '#FEF3C7',
      action: () => {
        onClose();
        setSelectedNote({
          id: '',
          title: '',
          content: '',
          isFavorite: false,
          securityLevel: 'private',
          tags: ['Note'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      },
    },
    {
      title: 'New Password Entry',
      desc: 'Strong password generator & enclave login',
      icon: Key,
      color: '#2E9B62',
      bg: '#E8F8F0',
      action: () => {
        onClose();
        setSelectedPassword({
          id: '',
          title: '',
          username: '',
          password: '',
          category: 'Logins',
          isFavorite: false,
          securityLevel: 'sensitive',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      },
    },
    {
      title: 'Create Folder',
      desc: 'Organize files into encrypted folders',
      icon: FolderPlus,
      color: '#64748B',
      bg: '#F1F5F9',
      action: () => {
        onClose();
        setActiveModal('folderCreate');
      },
    },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-7 w-full max-w-lg border border-[#E7E9ED] shadow-[0_20px_60px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom-6 duration-200 select-none max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#15171A]">Add to Vault</h3>
              <p className="text-xs text-[#737982] mt-0.5">Encrypt and safeguard assets with AES-GCM-256</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-[#F6F7F9] hover:bg-[#EAECEF] text-[#737982] hover:text-[#15171A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = '*/*';
              fileInputRef.current.click();
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all mb-4 ${
            isDragging
              ? 'border-[#3157D5] bg-[#EBF1FE]/60 scale-[1.01]'
              : 'border-[#D1D5DB] hover:border-[#3157D5] bg-[#F9FAFB] hover:bg-[#F3F4F6]'
          }`}
        >
          <Upload className="w-6 h-6 mx-auto text-[#3157D5] mb-1.5 opacity-80" />
          <p className="text-xs font-bold text-[#15171A]">
            {isProcessing ? 'Encrypting & Storing...' : 'Click or Drag & Drop files here'}
          </p>
          <p className="text-[11px] text-[#737982] mt-0.5">Supports images, videos, documents, PDFs, audio</p>
        </div>

        <div className="space-y-2.5">
          {actionItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={item.action}
                className="bg-white rounded-[20px] p-3.5 flex items-center justify-between cursor-pointer border border-[#E7E9ED] hover:border-[#3157D5] active:scale-99 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] group"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shrink-0"
                    style={{ backgroundColor: item.bg, color: item.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#15171A]">{item.title}</h4>
                    <p className="text-[11px] sm:text-xs text-[#737982] mt-0.5">{item.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
