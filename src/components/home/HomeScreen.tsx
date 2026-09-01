import React, { useMemo, useRef, useState } from 'react';
import {
  ShieldCheck,
  HardDrive,
  Image,
  Video,
  FileText,
  FileCode,
  Key,
  Mic,
  FolderLock,
  Plus,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Lock,
  Upload,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

export const HomeScreen: React.FC = () => {
  const {
    items,
    notes,
    passwords,
    storageMetrics,
    securityScore,
    setActiveTab,
    setSelectedTypeFilter,
    setActiveModal,
    setSelectedItem,
    importFiles,
    settings,
  } = useVault();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Dynamic greeting based on current time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const handleDirectFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setIsUploading(true);
      try {
        await importFiles(filesArray);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsUploading(false);
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
      setIsUploading(true);
      try {
        await importFiles(filesArray);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const triggerUpload = (accept = '*/*') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  // Category counts
  const activeItems = items.filter((i) => !i.isDeleted);
  const activeNotes = notes.filter((n) => !n.isDeleted);
  const activePasswords = passwords.filter((p) => !p.isDeleted);

  const photoCount = activeItems.filter((i) => i.type === 'photo').length;
  const videoCount = activeItems.filter((i) => i.type === 'video').length;
  const docCount = activeItems.filter((i) => i.type === 'document' || i.type === 'pdf').length;
  const noteCount = activeNotes.length;
  const passwordCount = activePasswords.length;

  // Format bytes to GB or MB
  const formatSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const totalBytes = storageMetrics.totalUsedBytes + storageMetrics.totalAvailableBytes;
  const usedPercent = Math.min(
    100,
    Math.max(8, Math.round((storageMetrics.totalUsedBytes / totalBytes) * 100))
  );

  const handleCategoryClick = (typeFilter: string) => {
    setSelectedTypeFilter(typeFilter);
    setActiveTab('vault');
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`pb-28 px-4 sm:px-8 lg:px-10 pt-6 sm:pt-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200 select-none relative ${
        isDragging ? 'ring-4 ring-[#3157D5] rounded-3xl bg-[#EBF1FE]/30' : ''
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleDirectFileInput}
      />

      {/* Floating Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-40 bg-[#3157D5]/10 backdrop-blur-xs flex items-center justify-center pointer-events-none">
          <div className="bg-white p-6 rounded-3xl shadow-2xl border-2 border-dashed border-[#3157D5] flex items-center gap-3 animate-bounce">
            <Upload className="w-8 h-8 text-[#3157D5]" />
            <div>
              <h3 className="text-base font-bold text-[#15171A]">Drop files to Encrypt</h3>
              <p className="text-xs text-[#737982]">Photos, videos & docs will be securely saved</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Greeting Headline */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#15171A]">
            {greeting}
          </h1>
          <p className="text-[#737982] text-base sm:text-lg font-medium mt-1">
            Your vault is protected
          </p>
        </div>

        {/* Quick Upload Button */}
        <button
          onClick={() => triggerUpload('*/*')}
          className="px-4 py-2.5 rounded-2xl bg-[#3157D5] text-white text-xs font-bold shadow-md hover:bg-[#2847B5] active:scale-95 flex items-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Media</span>
        </button>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Security Status + Vault Storage */}
        <div className="lg:col-span-5 flex flex-col space-y-6 sm:space-y-8">
          {/* Security Status Card */}
          <div
            onClick={() => setActiveModal('securityCenter')}
            className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#E7E9ED] shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer hover:border-[#3157D5] transition-all group"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-[#2E9B62] rounded-full animate-pulse"></div>
                <span className="font-bold uppercase tracking-widest text-xs text-[#15171A]">
                  Secure
                </span>
              </div>
              <span className="text-[#737982] text-xs font-medium">Protected just now</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-[#15171A]">
              Your vault is safe
            </h2>
            <p className="text-[#737982] leading-relaxed text-sm">
              Hardware-backed AES-GCM-256 encryption protocols active. Security audit score is {securityScore}/100 with zero detected threats.
            </p>

            <div className="mt-8 pt-6 border-t border-[#F6F7F9] flex items-center justify-between group-hover:text-[#3157D5] transition-colors">
              <span className="text-sm font-semibold text-[#3157D5]">Run Security Scan</span>
              <ChevronRight className="w-5 h-5 text-[#3157D5] transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Vault Storage Card */}
          <div
            onClick={() => setActiveModal('storageCenter')}
            className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#E7E9ED] shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer hover:border-[#3157D5] transition-all"
          >
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-[#737982] text-sm font-semibold uppercase tracking-wider mb-1">
                  Vault Storage
                </p>
                <h3 className="text-2xl font-bold text-[#15171A]">
                  {formatSize(storageMetrics.totalUsedBytes)}{' '}
                  <span className="text-[#737982] font-normal text-lg">
                    / {formatSize(totalBytes)}
                  </span>
                </h3>
              </div>
              <span className="text-[#3157D5] font-bold text-xl">{usedPercent}%</span>
            </div>

            <div className="w-full bg-[#F6F7F9] h-3 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.max(10, usedPercent * 0.5)}%`, backgroundColor: '#3157D5' }}
                className="h-full"
              />
              <div
                style={{ width: `${Math.max(8, usedPercent * 0.3)}%`, backgroundColor: '#8B5CF6' }}
                className="h-full"
              />
              <div
                style={{ width: `${Math.max(6, usedPercent * 0.2)}%`, backgroundColor: '#0D9488' }}
                className="h-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#3157D5] rounded-full"></div>
                <span className="text-xs text-[#737982]">
                  Media ({formatSize(storageMetrics.photosBytes + storageMetrics.videosBytes)})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#0D9488] rounded-full"></div>
                <span className="text-xs text-[#737982]">
                  Docs ({formatSize(storageMetrics.docsBytes)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Your Private Space */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#15171A]">Your Private Space</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Photos */}
            <div
              onClick={() => handleCategoryClick('Photos')}
              className="bg-white rounded-[24px] p-5 sm:p-6 border border-[#E7E9ED] flex flex-col justify-between hover:border-[#3157D5] transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer group relative"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-[#F6F7F9] rounded-xl flex items-center justify-center text-[#3157D5] group-hover:scale-105 transition-transform">
                  <Image className="w-6 h-6 opacity-70 group-hover:opacity-100" />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerUpload('image/*,video/*');
                  }}
                  className="w-8 h-8 rounded-full bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center hover:bg-[#3157D5] hover:text-white transition-colors"
                  title="Import Photos/Videos"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h4 className="font-bold text-lg text-[#15171A]">Photos</h4>
                <p className="text-[#737982] text-sm">{photoCount} items {videoCount > 0 ? `• ${videoCount} videos` : ''}</p>
              </div>
            </div>

            {/* Documents */}
            <div
              onClick={() => handleCategoryClick('Documents')}
              className="bg-white rounded-[24px] p-5 sm:p-6 border border-[#E7E9ED] flex flex-col justify-between hover:border-[#3157D5] transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer group relative"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-[#F6F7F9] rounded-xl flex items-center justify-center text-[#0D9488] group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6 opacity-70 group-hover:opacity-100" />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerUpload('*/*');
                  }}
                  className="w-8 h-8 rounded-full bg-[#E6F6F4] text-[#0D9488] flex items-center justify-center hover:bg-[#0D9488] hover:text-white transition-colors"
                  title="Import Documents"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h4 className="font-bold text-lg text-[#15171A]">Documents</h4>
                <p className="text-[#737982] text-sm">{docCount} items</p>
              </div>
            </div>

            {/* Passwords */}
            <div
              onClick={() => handleCategoryClick('Passwords')}
              className="bg-white rounded-[24px] p-5 sm:p-6 border border-[#E7E9ED] flex flex-col justify-between hover:border-[#3157D5] transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer group"
            >
              <div className="w-12 h-12 bg-[#F6F7F9] rounded-xl flex items-center justify-center mb-6 text-[#2E9B62] group-hover:scale-105 transition-transform">
                <Key className="w-6 h-6 opacity-70 group-hover:opacity-100" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-[#15171A]">Passwords</h4>
                <p className="text-[#737982] text-sm">{passwordCount} keys</p>
              </div>
            </div>

            {/* Add Files Quick Action */}
            <div
              onClick={() => triggerUpload('*/*')}
              className="bg-gradient-to-br from-white to-[#F6F7F9] rounded-[24px] p-5 sm:p-6 border border-[#E7E9ED] flex flex-col justify-between hover:border-[#3157D5] transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer group"
            >
              <div className="w-12 h-12 bg-[#3157D5]/10 rounded-xl flex items-center justify-center mb-6 text-[#3157D5] group-hover:scale-105 transition-transform">
                <Plus className="w-6 h-6 text-[#3157D5]" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-[#3157D5]">Add Files</h4>
                <p className="text-[#737982] text-sm">Import to Vault</p>
              </div>
            </div>
          </div>

          {/* Recent Encrypted Files */}
          {activeItems.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-[#15171A]">Recent Encrypted Files</h4>
                <button
                  onClick={() => {
                    setSelectedTypeFilter('All');
                    setActiveTab('vault');
                  }}
                  className="text-xs font-bold text-[#3157D5] hover:underline"
                >
                  View all
                </button>
              </div>

              <div className="space-y-2.5">
                {activeItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="bg-white rounded-[20px] p-3.5 flex items-center justify-between border border-[#E7E9ED] hover:border-[#3157D5] cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#F0F2F5] flex items-center justify-center shrink-0 text-[#3157D5] overflow-hidden">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : item.type === 'video' ? (
                          <Video className="w-5 h-5 text-[#8B5CF6]" />
                        ) : item.type === 'pdf' || item.type === 'document' ? (
                          <FileText className="w-5 h-5 text-[#0D9488]" />
                        ) : (
                          <Lock className="w-4 h-4 text-[#737982]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#15171A] truncate">{item.name}</p>
                        <p className="text-[10px] text-[#737982]">
                          {formatSize(item.size)} • {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F6F7F9] text-[#15171A] shrink-0 border border-[#E7E9ED]">
                      {item.securityLevel.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

