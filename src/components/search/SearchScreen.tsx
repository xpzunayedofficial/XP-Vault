import React, { useState, useMemo } from 'react';
import { Search, X, FileText, Image, Video, Key, FileCode, Lock, Tag, Sparkles } from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { VaultItem, SecureNote, PasswordEntry } from '../../types';

export const SearchScreen: React.FC = () => {
  const {
    items,
    notes,
    passwords,
    folders,
    searchQuery,
    setSearchQuery,
    setSelectedItem,
    setSelectedNote,
    setSelectedPassword,
  } = useVault();

  const [activeType, setActiveType] = useState<string>('All');

  const activeItems = useMemo(() => items.filter((i) => !i.isDeleted), [items]);
  const activeNotes = useMemo(() => notes.filter((n) => !n.isDeleted), [notes]);
  const activePasswords = useMemo(() => passwords.filter((p) => !p.isDeleted), [passwords]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const q = searchQuery.toLowerCase();
    const results: {
      type: 'item' | 'note' | 'password';
      data: any;
      matchReason: string;
    }[] = [];

    // Search Items
    activeItems.forEach((item) => {
      if (activeType !== 'All' && activeType !== 'Files') return;

      let matchReason = '';
      if (item.name.toLowerCase().includes(q)) matchReason = `Filename: "${item.name}"`;
      else if (item.tags.some((t) => t.toLowerCase().includes(q))) matchReason = `Tag match`;
      else if (item.ocrText && item.ocrText.toLowerCase().includes(q)) matchReason = `OCR text match`;

      if (matchReason) {
        results.push({ type: 'item', data: item, matchReason });
      }
    });

    // Search Notes
    if (activeType === 'All' || activeType === 'Notes') {
      activeNotes.forEach((note) => {
        let matchReason = '';
        if (note.title.toLowerCase().includes(q)) matchReason = `Note title`;
        else if (note.content.toLowerCase().includes(q)) matchReason = `Note text`;
        else if (note.tags.some((t) => t.toLowerCase().includes(q))) matchReason = `Tag match`;

        if (matchReason) {
          results.push({ type: 'note', data: note, matchReason });
        }
      });
    }

    // Search Passwords
    if (activeType === 'All' || activeType === 'Passwords') {
      activePasswords.forEach((pw) => {
        let matchReason = '';
        if (pw.title.toLowerCase().includes(q)) matchReason = `Service name`;
        else if (pw.username.toLowerCase().includes(q)) matchReason = `Username / ID`;
        else if (pw.notes && pw.notes.toLowerCase().includes(q)) matchReason = `Secure note`;

        if (matchReason) {
          results.push({ type: 'password', data: pw, matchReason });
        }
      });
    }

    return results;
  }, [searchQuery, activeType, activeItems, activeNotes, activePasswords]);

  return (
    <div className="pb-28 px-4 sm:px-8 lg:px-10 pt-6 sm:pt-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200 select-none">
      {/* Top Title */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#15171A] tracking-tight">
          Vault Search
        </h2>
        <p className="text-sm text-[#737982] font-medium mt-0.5">
          Local full-text index across filenames, OCR documents, tags, and passwords
        </p>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#737982]">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search files, OCR text, notes, passwords, tags..."
          className="w-full pl-12 pr-12 py-4 rounded-[24px] bg-white border border-[#E7E9ED] text-base font-medium text-[#15171A] placeholder-[#737982] focus:outline-none focus:border-[#3157D5] focus:ring-4 focus:ring-[#3157D5]/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all"
          autoFocus
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#737982] hover:text-[#15171A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {['All', 'Files', 'Notes', 'Passwords'].map((category) => (
          <button
            key={category}
            onClick={() => setActiveType(category)}
            className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              activeType === category
                ? 'bg-[#15171A] text-white shadow-xs'
                : 'bg-white text-[#737982] border border-[#E7E9ED] hover:text-[#15171A]'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Results Header */}
      {searchQuery && (
        <div className="flex items-center justify-between text-xs font-bold text-[#737982] px-1">
          <span>{searchResults.length} encrypted matches found</span>
          <span className="flex items-center gap-1 text-[#3157D5]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>On-device index</span>
          </span>
        </div>
      )}

      {/* Empty Search Prompt */}
      {!searchQuery && (
        <div className="bg-white rounded-[28px] p-10 sm:p-12 text-center flex flex-col items-center justify-center my-6 border border-[#E7E9ED] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="w-16 h-16 rounded-3xl bg-[#F6F7F9] text-[#737982] flex items-center justify-center mb-4">
            <Search className="w-7 h-7 opacity-60 text-[#3157D5]" />
          </div>
          <h3 className="text-base font-bold text-[#15171A] mb-1">Global Vault Search</h3>
          <p className="text-xs text-[#737982] max-w-sm leading-relaxed">
            Search instantaneously through encrypted file titles, tags, notes content, password logins, and on-device OCR scanned documents.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {['Passport', 'Zurich', 'Insurance', 'Certificate', 'Seed', 'Bank'].map((kw) => (
              <button
                key={kw}
                onClick={() => setSearchQuery(kw)}
                className="px-3.5 py-1.5 rounded-full bg-[#F6F7F9] border border-[#E7E9ED] text-xs font-semibold text-[#15171A] hover:border-[#3157D5] hover:text-[#3157D5] transition-colors cursor-pointer"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchQuery && searchResults.length === 0 && (
        <div className="bg-white rounded-[28px] p-10 text-center flex flex-col items-center justify-center my-6 border border-[#E7E9ED] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <p className="text-base font-bold text-[#15171A] mb-1">No matching encrypted records</p>
          <p className="text-xs text-[#737982]">Try searching by tag, folder, or document keywords.</p>
        </div>
      )}

      {/* Results List */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          {searchResults.map((res, index) => {
            if (res.type === 'item') {
              const item: VaultItem = res.data;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="bg-white rounded-[24px] p-4 flex items-center justify-between cursor-pointer border border-[#E7E9ED] hover:border-[#3157D5] active:scale-99 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#F6F7F9] flex items-center justify-center shrink-0 text-[#3157D5]">
                      {item.type === 'photo' ? (
                        <Image className="w-6 h-6" />
                      ) : item.type === 'video' ? (
                        <Video className="w-6 h-6 text-[#8B5CF6]" />
                      ) : (
                        <FileText className="w-6 h-6 text-[#0D9488]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#15171A] truncate">{item.name}</p>
                      <p className="text-xs text-[#3157D5] font-semibold mt-0.5">{res.matchReason}</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#737982] bg-[#F6F7F9] border border-[#E7E9ED] px-2.5 py-1 rounded-full shrink-0">
                    {item.type}
                  </span>
                </div>
              );
            }

            if (res.type === 'note') {
              const note: SecureNote = res.data;
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className="bg-white rounded-[24px] p-4 flex items-center justify-between cursor-pointer border border-[#E7E9ED] hover:border-[#3157D5] active:scale-99 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                      <FileCode className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#15171A] truncate">{note.title}</p>
                      <p className="text-xs text-[#D97706] font-semibold mt-0.5">{res.matchReason}</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#D97706] bg-[#FEF3C7] px-2.5 py-1 rounded-full shrink-0">
                    NOTE
                  </span>
                </div>
              );
            }

            if (res.type === 'password') {
              const pw: PasswordEntry = res.data;
              return (
                <div
                  key={pw.id}
                  onClick={() => setSelectedPassword(pw)}
                  className="bg-white rounded-[24px] p-4 flex items-center justify-between cursor-pointer border border-[#E7E9ED] hover:border-[#3157D5] active:scale-99 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#E8F8F0] text-[#2E9B62] flex items-center justify-center shrink-0">
                      <Key className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#15171A] truncate">{pw.title}</p>
                      <p className="text-xs text-[#2E9B62] font-semibold mt-0.5">{res.matchReason}</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#2E9B62] bg-[#E8F8F0] px-2.5 py-1 rounded-full shrink-0">
                    PASSWORD
                  </span>
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
