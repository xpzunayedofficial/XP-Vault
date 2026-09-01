import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Folder as FolderIcon,
  Plus,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Star,
  Trash2,
  Share2,
  FolderPlus,
  Shield,
  Image,
  Video,
  FileText,
  FileCode,
  Key,
  Mic,
  Lock,
  CheckSquare,
  Square,
  Upload,
  Play,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { VaultItem, SecureNote, PasswordEntry, VaultItemType, Folder } from '../../types';

export const VaultScreen: React.FC = () => {
  const {
    items,
    notes,
    passwords,
    folders,
    activeFolderId,
    setActiveFolderId,
    selectedTypeFilter,
    setSelectedTypeFilter,
    setActiveModal,
    setSelectedItem,
    setSelectedNote,
    setSelectedPassword,
    deleteItem,
    toggleFavoriteItem,
    toggleFavoriteNote,
    toggleFavoritePassword,
    importFiles,
    settings,
  } = useVault();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'security'>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setIsUploading(true);
      try {
        await importFiles(filesArray, activeFolderId || undefined);
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
        await importFiles(filesArray, activeFolderId || undefined);
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

  const filterTabs = [
    'All',
    'Photos',
    'Videos',
    'Documents',
    'PDFs',
    'Audio',
    'Notes',
    'Passwords',
  ];

  // Active folder object if selected
  const currentFolder = folders.find((f) => f.id === activeFolderId);

  // Active non-deleted items
  const activeItems = useMemo(() => items.filter((i) => !i.isDeleted), [items]);
  const activeNotes = useMemo(() => notes.filter((n) => !n.isDeleted), [notes]);
  const activePasswords = useMemo(() => passwords.filter((p) => !p.isDeleted), [passwords]);

  // Combined and filtered elements
  const displayedItems = useMemo(() => {
    let result: (
      | { type: 'vaultItem'; data: VaultItem }
      | { type: 'note'; data: SecureNote }
      | { type: 'password'; data: PasswordEntry }
    )[] = [];

    // Filter Items
    activeItems.forEach((item) => {
      if (activeFolderId && item.folderId !== activeFolderId) return;
      if (onlyFavorites && !item.isFavorite) return;

      if (selectedTypeFilter === 'All') {
        result.push({ type: 'vaultItem', data: item });
      } else if (selectedTypeFilter === 'Photos' && item.type === 'photo') {
        result.push({ type: 'vaultItem', data: item });
      } else if (selectedTypeFilter === 'Videos' && item.type === 'video') {
        result.push({ type: 'vaultItem', data: item });
      } else if (selectedTypeFilter === 'Documents' && (item.type === 'document' || item.type === 'pdf')) {
        result.push({ type: 'vaultItem', data: item });
      } else if (selectedTypeFilter === 'PDFs' && item.type === 'pdf') {
        result.push({ type: 'vaultItem', data: item });
      } else if (selectedTypeFilter === 'Audio' && item.type === 'audio') {
        result.push({ type: 'vaultItem', data: item });
      }
    });

    // Filter Notes
    if (selectedTypeFilter === 'All' || selectedTypeFilter === 'Notes') {
      activeNotes.forEach((note) => {
        if (activeFolderId && note.folderId !== activeFolderId) return;
        if (onlyFavorites && !note.isFavorite) return;
        result.push({ type: 'note', data: note });
      });
    }

    // Filter Passwords
    if (selectedTypeFilter === 'All' || selectedTypeFilter === 'Passwords') {
      activePasswords.forEach((pw) => {
        if (activeFolderId) return; // Passwords are kept in dedicated secure enclave
        if (onlyFavorites && !pw.isFavorite) return;
        result.push({ type: 'password', data: pw });
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = a.type === 'vaultItem' ? a.data.name : a.type === 'note' ? a.data.title : a.data.title;
        const nameB = b.type === 'vaultItem' ? b.data.name : b.type === 'note' ? b.data.title : b.data.title;
        return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else if (sortBy === 'size') {
        const sizeA = a.type === 'vaultItem' ? a.data.size : 1024;
        const sizeB = b.type === 'vaultItem' ? b.data.size : 1024;
        return sortAsc ? sizeA - sizeB : sizeB - sizeA;
      } else {
        // Date sorting
        const dateA = a.type === 'vaultItem' ? a.data.createdAt : a.data.createdAt;
        const dateB = b.type === 'vaultItem' ? b.data.createdAt : b.data.createdAt;
        return sortAsc ? dateA - dateB : dateB - dateA;
      }
    });

    return result;
  }, [activeItems, activeNotes, activePasswords, activeFolderId, selectedTypeFilter, onlyFavorites, sortBy, sortAsc]);

  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState<boolean>(false);

  const handleSelectToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    for (const id of selectedIds) {
      await deleteItem(id);
    }
    setSelectedIds([]);
    setIsSelectMode(false);
    setShowBatchDeleteConfirm(false);
  };

  const formatSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`pb-28 px-4 sm:px-8 lg:px-10 pt-6 sm:pt-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200 select-none relative ${
        isDragging ? 'ring-4 ring-[#3157D5] rounded-3xl bg-[#EBF1FE]/30' : ''
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Floating Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-40 bg-[#3157D5]/10 backdrop-blur-xs flex items-center justify-center pointer-events-none">
          <div className="bg-white p-6 rounded-3xl shadow-2xl border-2 border-dashed border-[#3157D5] flex items-center gap-3 animate-bounce">
            <Upload className="w-8 h-8 text-[#3157D5]" />
            <div>
              <h3 className="text-base font-bold text-[#15171A]">Drop files to encrypt</h3>
              <p className="text-xs text-[#737982]">Saving to {currentFolder ? currentFolder.name : 'Vault'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Header & Search Trigger */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#15171A] tracking-tight">
            {currentFolder ? currentFolder.name : 'My Vault'}
          </h2>
          <p className="text-sm text-[#737982] font-medium mt-0.5">
            {displayedItems.length} encrypted items
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Direct Upload Button */}
          <button
            onClick={() => triggerUpload('*/*')}
            className="px-3.5 h-10 rounded-2xl bg-[#3157D5] text-white text-xs font-bold shadow-sm hover:bg-[#2847B5] active:scale-95 flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload File</span>
          </button>

          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`w-10 h-10 rounded-2xl border transition-all flex items-center justify-center cursor-pointer shadow-xs ${
              onlyFavorites
                ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#D97706]'
                : 'bg-white border-[#E7E9ED] text-[#737982] hover:text-[#15171A]'
            }`}
            title="Favorites Only"
          >
            <Star className={`w-4 h-4 ${onlyFavorites ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="w-10 h-10 rounded-2xl bg-white border border-[#E7E9ED] text-[#737982] hover:text-[#15171A] flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="Toggle View Mode"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsSelectMode(!isSelectMode)}
            className={`px-3.5 h-10 rounded-2xl border transition-all text-xs font-bold flex items-center justify-center cursor-pointer shadow-xs ${
              isSelectMode
                ? 'bg-[#EBF1FE] border-[#3157D5] text-[#3157D5]'
                : 'bg-white border-[#E7E9ED] text-[#737982] hover:text-[#15171A]'
            }`}
            title="Multi-select items"
          >
            Select
          </button>
        </div>
      </div>

      {/* Custom Folders Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveFolderId(null)}
          className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
            activeFolderId === null
              ? 'bg-[#15171A] text-white shadow-xs'
              : 'bg-white text-[#737982] border border-[#E7E9ED] hover:text-[#15171A]'
          }`}
        >
          All Folders
        </button>

        {folders.map((folder) => {
          const isSelected = activeFolderId === folder.id;
          return (
            <button
              key={folder.id}
              onClick={() => setActiveFolderId(isSelected ? null : folder.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#3157D5] text-white shadow-xs'
                  : 'bg-white text-[#15171A] border border-[#E7E9ED] hover:border-[#CBD2DC]'
              }`}
            >
              <FolderIcon className="w-3.5 h-3.5" />
              <span>{folder.name}</span>
            </button>
          );
        })}

        <button
          onClick={() => setActiveModal('folderCreate')}
          className="px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 bg-white border border-dashed border-[#CBD2DC] text-[#3157D5] flex items-center gap-1 hover:bg-[#F0F4FF] cursor-pointer"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>New Folder</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filterTabs.map((tab) => {
          const isActive = selectedTypeFilter === tab;
          return (
            <button
              key={tab}
              onClick={() => setSelectedTypeFilter(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#EBF1FE] text-[#3157D5] border border-[#3157D5]/40 font-bold'
                  : 'bg-white text-[#737982] border border-[#E7E9ED] hover:text-[#15171A]'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Multi-Select Action Bar */}
      {isSelectMode && selectedIds.length > 0 && (
        <div className="bg-[#EBF1FE] rounded-[24px] p-4 border border-[#3157D5]/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150 shadow-sm">
          <span className="text-xs font-bold text-[#3157D5]">
            {selectedIds.length} items selected
          </span>
          <div className="flex items-center gap-2">
            {showBatchDeleteConfirm ? (
              <div className="flex items-center gap-2 animate-in fade-in">
                <span className="text-[11px] font-bold text-[#D64545]">Move to Trash?</span>
                <button
                  onClick={() => setShowBatchDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E7E9ED] text-[#737982] text-xs font-bold hover:bg-[#F6F7F9]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBatchDelete}
                  className="px-3 py-1.5 rounded-xl bg-[#D64545] text-white text-xs font-bold shadow-xs hover:bg-[#B91C1C]"
                >
                  Confirm
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowBatchDeleteConfirm(true)}
                className="px-4 py-2 rounded-xl bg-[#D64545] text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Move to Trash ({selectedIds.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {displayedItems.length === 0 && (
        <div className="bg-white rounded-[28px] p-8 sm:p-12 text-center flex flex-col items-center justify-center my-6 border border-[#E7E9ED] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="w-16 h-16 rounded-3xl bg-[#F6F7F9] text-[#737982] flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 opacity-50" />
          </div>
          <h3 className="text-lg font-bold text-[#15171A] mb-1">No items in {selectedTypeFilter === 'All' ? 'this vault' : selectedTypeFilter}</h3>
          <p className="text-xs text-[#737982] max-w-xs mb-6 leading-relaxed">
            Upload your photos, videos, or documents directly to protect them with local AES-GCM-256 encryption.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => triggerUpload(selectedTypeFilter === 'Photos' ? 'image/*' : selectedTypeFilter === 'Videos' ? 'video/*' : '*/*')}
              className="py-3 px-6 rounded-2xl bg-[#3157D5] text-white text-xs font-bold shadow-md hover:bg-[#2847B5] active:scale-95 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload {selectedTypeFilter === 'Photos' ? 'Photos' : selectedTypeFilter === 'Videos' ? 'Videos' : 'Media / Files'}</span>
            </button>
            <button
              onClick={() => setActiveModal('add')}
              className="py-3 px-5 rounded-2xl bg-[#F6F7F9] hover:bg-[#EAECEF] text-[#15171A] text-xs font-bold border border-[#E7E9ED] active:scale-95 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 text-[#737982]" />
              <span>More Options</span>
            </button>
          </div>
        </div>
      )}

      {/* Items Container: Grid Mode */}
      {viewMode === 'grid' && displayedItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayedItems.map((itemObj) => {
            if (itemObj.type === 'vaultItem') {
              const item = itemObj.data;
              const isSelected = selectedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isSelectMode) handleSelectToggle(item.id);
                    else setSelectedItem(item);
                  }}
                  className={`bg-white rounded-[24px] p-3.5 sm:p-4 flex flex-col justify-between cursor-pointer border border-[#E7E9ED] hover:border-[#3157D5] active:scale-98 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] group relative overflow-hidden ${
                    isSelected ? 'ring-2 ring-[#3157D5] bg-[#F5F8FF]' : ''
                  }`}
                >
                  {/* Select Checkbox if select mode */}
                  {isSelectMode && (
                    <div className="absolute top-2 left-2 z-10">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-[#3157D5] fill-white" />
                      ) : (
                        <Square className="w-5 h-5 text-[#737982] bg-white rounded-md" />
                      )}
                    </div>
                  )}

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoriteItem(item.id);
                    }}
                    className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/90 backdrop-blur-xs text-[#737982] hover:text-[#D97706] transition-all shadow-xs cursor-pointer"
                  >
                    <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-[#D97706] text-[#D97706]' : ''}`} />
                  </button>

                  {/* Thumbnail / Visual */}
                  <div className="w-full aspect-square rounded-2xl bg-[#F6F7F9] mb-3 overflow-hidden flex items-center justify-center text-[#3157D5] relative">
                    {item.type === 'photo' ? (
                      <img 
                        src={item.thumbnailUrl || ''} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = ''; // Clear source to trigger fallback display
                        }}
                      />
                    ) : item.type === 'video' ? (
                      <div className="w-full h-full bg-[#1E293B] flex items-center justify-center text-white relative">
                        {item.thumbnailUrl ? (
                          <img 
                            src={item.thumbnailUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover opacity-60"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        <div className="absolute w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-md z-10">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                        <span className="absolute bottom-2 right-2 text-[9px] font-mono bg-black/60 text-white px-1.5 py-0.5 rounded-md font-bold">
                          VIDEO
                        </span>
                      </div>
                    ) : item.type === 'pdf' ? (
                      <FileText className="w-8 h-8 text-[#0D9488]" />
                    ) : item.type === 'audio' ? (
                      <Mic className="w-8 h-8 text-[#EC4899]" />
                    ) : (
                      <Lock className="w-7 h-7 text-[#737982]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#15171A] truncate">{item.name}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-[#737982]">
                      <span>{formatSize(item.size)}</span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-md bg-[#F6F7F9] border border-[#E7E9ED] uppercase font-semibold">
                        {item.securityLevel.substring(0, 3)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            if (itemObj.type === 'note') {
              const note = itemObj.data;
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className="bg-white rounded-[24px] p-4 flex flex-col justify-between cursor-pointer border border-[#E7E9ED] hover:border-[#3157D5] active:scale-98 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] group relative"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteNote(note.id);
                      }}
                      className="text-[#737982] hover:text-[#D97706] cursor-pointer"
                    >
                      <Star className={`w-3.5 h-3.5 ${note.isFavorite ? 'fill-[#D97706] text-[#D97706]' : ''}`} />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#15171A] line-clamp-2">{note.title}</h4>
                    <p className="text-[10px] text-[#737982] line-clamp-2 mt-1">{note.content}</p>
                  </div>
                  <span className="text-[9px] font-bold text-[#D97706] mt-3 block uppercase tracking-wider">Encrypted Note</span>
                </div>
              );
            }

            if (itemObj.type === 'password') {
              const pw = itemObj.data;
              return (
                <div
                  key={pw.id}
                  onClick={() => setSelectedPassword(pw)}
                  className="bg-white rounded-[24px] p-4 flex flex-col justify-between cursor-pointer border border-[#E7E9ED] hover:border-[#3157D5] active:scale-98 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] group relative"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-[#E8F8F0] text-[#2E9B62] flex items-center justify-center">
                      <Key className="w-4 h-4" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoritePassword(pw.id);
                      }}
                      className="text-[#737982] hover:text-[#D97706] cursor-pointer"
                    >
                      <Star className={`w-3.5 h-3.5 ${pw.isFavorite ? 'fill-[#D97706] text-[#D97706]' : ''}`} />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#15171A] truncate">{pw.title}</h4>
                    <p className="text-[10px] text-[#737982] truncate font-mono mt-0.5">{pw.username}</p>
                  </div>
                  <span className="text-[9px] font-bold text-[#2E9B62] mt-3 block uppercase tracking-wider">Password</span>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}

      {/* Items Container: List Mode */}
      {viewMode === 'list' && displayedItems.length > 0 && (
        <div className="space-y-3">
          {displayedItems.map((itemObj) => {
            if (itemObj.type === 'vaultItem') {
              const item = itemObj.data;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="bg-white rounded-[20px] p-3.5 flex items-center justify-between cursor-pointer border border-[#E7E9ED] hover:border-[#3157D5] active:scale-99 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#F6F7F9] flex items-center justify-center shrink-0 overflow-hidden text-[#3157D5]">
                      {item.thumbnailUrl ? (
                        <img 
                          src={item.thumbnailUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              const icon = document.createElement('div');
                              icon.className = 'flex items-center justify-center w-full h-full';
                              icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text text-[#737982]"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>';
                              parent.appendChild(icon);
                            }
                          }}
                        />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#15171A] truncate">{item.name}</p>
                      <p className="text-[10px] text-[#737982]">
                        {formatSize(item.size)} • {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteItem(item.id);
                      }}
                      className="p-1.5 text-[#737982] hover:text-[#D97706] cursor-pointer"
                    >
                      <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-[#D97706] text-[#D97706]' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            }

            if (itemObj.type === 'note') {
              const note = itemObj.data;
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className="bg-white rounded-[20px] p-3.5 flex items-center justify-between cursor-pointer border border-[#E7E9ED] hover:border-[#3157D5] active:scale-99 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#15171A] truncate">{note.title}</p>
                      <p className="text-[10px] text-[#737982] truncate">{note.content}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#D97706] px-2.5 py-1 rounded-full bg-[#FEF3C7]">NOTE</span>
                </div>
              );
            }

            if (itemObj.type === 'password') {
              const pw = itemObj.data;
              return (
                <div
                  key={pw.id}
                  onClick={() => setSelectedPassword(pw)}
                  className="bg-white rounded-[20px] p-3.5 flex items-center justify-between cursor-pointer border border-[#E7E9ED] hover:border-[#3157D5] active:scale-99 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#E8F8F0] text-[#2E9B62] flex items-center justify-center shrink-0">
                      <Key className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#15171A] truncate">{pw.title}</p>
                      <p className="text-[10px] text-[#737982] font-mono truncate">{pw.username}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#2E9B62] px-2.5 py-1 rounded-full bg-[#E8F8F0]">KEY</span>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );

};
