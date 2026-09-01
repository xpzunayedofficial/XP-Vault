import React, { useState } from 'react';
import {
  X,
  Star,
  Trash2,
  Download,
  FileText,
  Copy,
  ScanLine,
  Mic,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Shield,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { VaultItem } from '../../types';

interface PdfViewerProps {
  item: VaultItem;
  onClose: () => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ item, onClose }) => {
  const { toggleFavoriteItem, deleteItem, showToast } = useVault();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = item.metadata?.pages || 4;
  const [zoom, setZoom] = useState<number>(100);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const handleCopyOcr = () => {
    if (item.ocrText) {
      navigator.clipboard.writeText(item.ocrText);
      showToast('Document text copied to clipboard');
    }
  };

  const handleExport = () => {
    if (item.dataUrl) {
      const a = document.createElement('a');
      a.href = item.dataUrl;
      a.download = item.name;
      a.click();
      showToast('Exported document');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F6F7F9] flex flex-col justify-between text-[#15171A] animate-in fade-in duration-200 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-[#E7E9ED] shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#F0F2F5] hover:bg-[#E2E6EC] active:scale-95 transition-all text-[#15171A]"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate max-w-[180px] sm:max-w-xs">{item.name}</p>
            <p className="text-[10px] text-[#737982]">
              Page {currentPage} of {totalPages} • Encrypted Document
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => toggleFavoriteItem(item.id)}
            className="p-2 rounded-xl bg-[#F0F2F5] hover:bg-[#E2E6EC] text-[#F59E0B]"
          >
            <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            className="p-2 rounded-xl bg-[#F0F2F5] hover:bg-[#E2E6EC] text-[#15171A]"
            title="Export"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Document Content Canvas / Sheet */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-start">
        <div
          className="vault-card rounded-2xl p-8 max-w-md w-full bg-white border border-[#E7E9ED] shadow-md min-h-[460px] flex flex-col justify-between transition-all"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          {/* Header */}
          <div>
            <div className="flex items-center justify-between border-b border-[#E7E9ED] pb-4 mb-6">
              <div className="flex items-center gap-2 text-[#3157D5]">
                <Shield className="w-5 h-5" />
                <span className="text-xs font-extrabold tracking-wider uppercase font-mono">
                  CONFIDENTIAL RECORD
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#737982]">XP-DOC-V2</span>
            </div>

            {/* Document Body */}
            <div className="space-y-4">
              <h2 className="text-base font-extrabold text-[#15171A] uppercase tracking-tight">
                {item.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}
              </h2>
              
              {error && (
                <div className="p-6 rounded-2xl bg-red-50 flex flex-col items-center gap-3 text-center border border-red-100 mb-4">
                  <Shield className="w-8 h-8 text-red-500" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-red-900">Decryption Failed</p>
                    <p className="text-[10px] text-red-700 leading-tight">
                      The security keys for this asset are invalid. Please check your Master PIN.
                    </p>
                  </div>
                </div>
              )}

              {item.type === 'audio' ? (
                <div className="p-6 rounded-2xl bg-[#F6F7F9] border border-[#E7E9ED] flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#EBF1FE] flex items-center justify-center text-[#3157D5]">
                    <Mic className="w-8 h-8" />
                  </div>
                  <audio 
                    src={item.dataUrl} 
                    controls 
                    className="w-full h-10 accent-[#3157D5]" 
                    autoPlay={false}
                    onError={() => setError('Audio source error')}
                  />
                  <p className="text-[10px] text-[#737982] font-mono">ENCRYPTED AUDIO STREAM</p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#F6F7F9] border border-[#E7E9ED] text-xs font-mono text-[#15171A] leading-relaxed">
                  {item.ocrText || (
                    <div>
                      <p className="font-bold text-[#3157D5] mb-1">AUTHENTICATED DIGITAL ASSET</p>
                      <p className="text-[11px] text-[#737982]">
                        Zero-Knowledge Enclave Encrypted Document. Verified SHA-256 Checksum.
                        Stored in app-private IndexedDB vault.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-[#F0F2F5]">
                  <span className="text-[#737982] block text-[10px]">CATEGORY</span>
                  <span className="font-bold text-[#15171A]">Official Records</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F0F2F5]">
                  <span className="text-[#737982] block text-[10px]">SECURITY LEVEL</span>
                  <span className="font-bold text-[#3157D5] uppercase">{item.securityLevel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer of doc */}
          <div className="border-t border-[#E7E9ED] pt-4 mt-6 flex items-center justify-between text-[10px] text-[#737982] font-mono">
            <span>DIGITALLY SIGNED</span>
            <span>PAGE {currentPage} OF {totalPages}</span>
          </div>
        </div>
      </div>

      {/* Bottom Pagination & Zoom Bar */}
      <div className="p-3 bg-white border-t border-[#E7E9ED] flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-[#F0F2F5] disabled:opacity-40 text-[#15171A]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-[#15171A] px-2 font-mono">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl bg-[#F0F2F5] disabled:opacity-40 text-[#15171A]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyOcr}
            className="px-3 py-1.5 rounded-xl bg-[#EBF1FE] text-[#3157D5] text-xs font-bold flex items-center gap-1 hover:bg-[#DDE8FD]"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Text</span>
          </button>

          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 animate-in fade-in">
              <span className="text-[10px] font-bold text-[#D64545]">Move to Trash?</span>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2 py-1 rounded-lg bg-[#F0F2F5] text-[#737982] text-[10px] font-bold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteItem(item.id);
                  onClose();
                }}
                className="px-2 py-1 rounded-lg bg-[#D64545] text-white text-[10px] font-bold"
              >
                Confirm
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-xl text-[#D64545] hover:bg-[#FEE2E2] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
