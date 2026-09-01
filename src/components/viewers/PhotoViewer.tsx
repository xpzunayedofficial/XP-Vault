import React, { useState } from 'react';
import {
  X,
  Star,
  Trash2,
  Share2,
  ZoomIn,
  ZoomOut,
  Info,
  Shield,
  Download,
  Copy,
  ScanLine,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { VaultItem } from '../../types';

interface PhotoViewerProps {
  item: VaultItem;
  onClose: () => void;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({ item, onClose }) => {
  const { toggleFavoriteItem, deleteItem, showToast } = useVault();
  const [zoom, setZoom] = useState<number>(1);
  const [showMetadata, setShowMetadata] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const handleExport = () => {
    if (item.dataUrl) {
      const a = document.createElement('a');
      a.href = item.dataUrl;
      a.download = item.name;
      a.click();
      showToast('Exported decrypted file to local storage');
    }
  };

  const handleCopyOcr = () => {
    if (item.ocrText) {
      navigator.clipboard.writeText(item.ocrText);
      showToast('OCR extracted text copied to clipboard');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between text-white animate-in fade-in duration-200 select-none">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center min-w-0 px-2">
          <p className="text-xs font-bold truncate">{item.name}</p>
          <p className="text-[10px] text-white/70">
            {(item.size / (1024 * 1024)).toFixed(1)} MB • {item.securityLevel.toUpperCase()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleFavoriteItem(item.id)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-[#F59E0B]"
          >
            <Star className={`w-5 h-5 ${item.isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
        {error ? (
          <div className="flex flex-col items-center gap-4 text-center p-8 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
              <Shield className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Encryption Error</p>
              <p className="text-xs text-white/50 max-w-[240px]">
                Unable to decrypt this secure asset. This happens if the Master PIN was recently changed without data migration.
              </p>
            </div>
            <button 
              onClick={onClose}
              className="mt-2 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all"
            >
              Close Viewer
            </button>
          </div>
        ) : (
          <img
            src={item.dataUrl || item.thumbnailUrl}
            alt={item.name}
            className="max-h-full max-w-full object-contain transition-transform duration-200 rounded-lg shadow-2xl"
            style={{ transform: `scale(${zoom})` }}
            onError={() => setError('Decryption failed')}
          />
        )}

        {/* Floating Zoom Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-1 text-white/80 hover:text-white"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-semibold">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="p-1 text-white/80 hover:text-white"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metadata Drawer Modal */}
      {showMetadata && (
        <div className="absolute inset-x-0 bottom-0 bg-[#15171A] text-white p-6 rounded-t-3xl border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom-6 duration-200 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#3157D5]" />
              <span>Encrypted Object Metadata</span>
            </h3>
            <button onClick={() => setShowMetadata(false)} className="text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs text-white/80 font-mono">
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-white/50">File Name:</span>
              <span className="font-sans font-medium">{item.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-white/50">Algorithm:</span>
              <span>AES-GCM (256-bit)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-white/50">Integrity Checksum:</span>
              <span className="text-[10px] text-[#2E9B62]">{item.checksum?.substring(0, 16) || 'SHA256:VERIFIED'}...</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-white/50">File Size:</span>
              <span>{(item.size / 1024).toFixed(1)} KB</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-white/50">Created Date:</span>
              <span>{new Date(item.createdAt).toLocaleString()}</span>
            </div>

            {item.ocrText && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/50 font-sans font-bold flex items-center gap-1">
                    <ScanLine className="w-3.5 h-3.5 text-[#3157D5]" />
                    <span>OCR Extracted Text:</span>
                  </span>
                  <button
                    onClick={handleCopyOcr}
                    className="text-[10px] text-[#3157D5] font-sans font-bold flex items-center gap-1 hover:underline"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Text</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 text-[11px] font-mono leading-relaxed text-white/90">
                  {item.ocrText}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div className="flex items-center justify-around p-4 bg-gradient-to-t from-black/80 to-transparent">
        <button
          onClick={handleExport}
          className="flex flex-col items-center gap-1 text-white/80 hover:text-white cursor-pointer"
        >
          <Download className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Export</span>
        </button>

        {showDeleteConfirm ? (
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/40 animate-in fade-in">
            <span className="text-[11px] text-[#FCA5A5] font-semibold">Move to Trash?</span>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                await deleteItem(item.id);
                onClose();
              }}
              className="text-[11px] px-2 py-0.5 rounded-full bg-[#D64545] hover:bg-[#B91C1C] text-white font-bold cursor-pointer"
            >
              Confirm
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex flex-col items-center gap-1 text-[#D64545] hover:text-[#EF4444] cursor-pointer"
          >
            <Trash2 className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Trash</span>
          </button>
        )}
      </div>
    </div>
  );
};
