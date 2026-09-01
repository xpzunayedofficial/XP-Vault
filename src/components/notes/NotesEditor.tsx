import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Trash2,
  Check,
  Plus,
  Tag,
  Shield,
  CheckSquare,
  Square,
  Lock,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { SecureNote, SecurityLevel, ChecklistItem } from '../../types';

interface NotesEditorProps {
  note?: SecureNote | null;
  onClose: () => void;
}

export const NotesEditor: React.FC<NotesEditorProps> = ({ note, onClose }) => {
  const { saveNote, deleteNote, showToast, folders } = useVault();

  const [title, setTitle] = useState<string>(note?.title || '');
  const [content, setContent] = useState<string>(note?.content || '');
  const [isFavorite, setIsFavorite] = useState<boolean>(note?.isFavorite || false);
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>(note?.securityLevel || 'private');
  const [folderId, setFolderId] = useState<string>(note?.folderId || '');
  const [tags, setTags] = useState<string[]>(note?.tags || ['Note']);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [checklists, setChecklists] = useState<ChecklistItem[]>(note?.checklists || []);
  const [newChecklistText, setNewChecklistText] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      showToast('Note cannot be empty');
      return;
    }

    const noteToSave: SecureNote = {
      id: note?.id || 'n-' + Date.now(),
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      checklists,
      tags,
      isFavorite,
      folderId: folderId || undefined,
      securityLevel,
      createdAt: note?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await saveNote(noteToSave);
    onClose();
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddChecklistItem = () => {
    if (newChecklistText.trim()) {
      setChecklists([
        ...checklists,
        { id: 'c-' + Date.now(), text: newChecklistText.trim(), completed: false },
      ]);
      setNewChecklistText('');
    }
  };

  const toggleChecklist = (id: string) => {
    setChecklists(
      checklists.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c))
    );
  };

  const removeChecklistItem = (id: string) => {
    setChecklists(checklists.filter((c) => c.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F6F7F9] flex flex-col justify-between text-[#15171A] animate-in fade-in duration-200 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-[#E7E9ED] shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#F0F2F5] hover:bg-[#E2E6EC] active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-[#15171A]">
            {note ? 'Edit Encrypted Note' : 'New Encrypted Note'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="p-2 rounded-xl bg-[#F0F2F5] hover:bg-[#E2E6EC] text-[#F59E0B]"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {note && (
            showDeleteConfirm ? (
              <div className="flex items-center gap-1.5 animate-in fade-in">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 rounded-lg bg-[#F0F2F5] text-[#737982] text-[10px] font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await deleteNote(note.id);
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
                className="p-2 rounded-xl bg-[#F0F2F5] hover:bg-[#FEE2E2] text-[#D64545]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )
          )}

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-[#3157D5] text-white font-bold text-xs shadow-md hover:bg-[#2847B5] active:scale-95 flex items-center gap-1"
          >
            <Check className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full space-y-4">
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title..."
          className="w-full text-lg font-extrabold text-[#15171A] bg-transparent border-none focus:outline-none placeholder-[#737982]"
        />

        {/* Security & Folder Settings bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#E7E9ED]">
          {/* Security Policy */}
          <div className="flex items-center gap-1 bg-white border border-[#E7E9ED] rounded-xl px-2.5 py-1 text-xs">
            <Lock className="w-3.5 h-3.5 text-[#3157D5]" />
            <select
              value={securityLevel}
              onChange={(e) => setSecurityLevel(e.target.value as SecurityLevel)}
              className="bg-transparent text-[#15171A] font-bold focus:outline-none text-[11px]"
            >
              <option value="normal">Normal</option>
              <option value="private">Private</option>
              <option value="sensitive">Sensitive</option>
              <option value="maximum">Maximum</option>
            </select>
          </div>

          {/* Folder */}
          <div className="flex items-center gap-1 bg-white border border-[#E7E9ED] rounded-xl px-2.5 py-1 text-xs">
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="bg-transparent text-[#15171A] font-bold focus:outline-none text-[11px]"
            >
              <option value="">No Folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Body Textarea */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write confidential note contents here..."
          rows={10}
          className="w-full bg-white p-4 rounded-2xl border border-[#E7E9ED] text-xs font-mono leading-relaxed text-[#15171A] placeholder-[#737982] focus:outline-none focus:border-[#3157D5] focus:ring-2 focus:ring-[#3157D5]/10 shadow-xs resize-none"
        />

        {/* Interactive Checklist Section */}
        <div className="vault-card rounded-2xl p-4 space-y-3 border border-[#E7E9ED]">
          <h4 className="text-xs font-bold text-[#15171A] flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-[#3157D5]" />
            <span>Checklist Items</span>
          </h4>

          <div className="space-y-2">
            {checklists.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 p-1">
                <div
                  onClick={() => toggleChecklist(c.id)}
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  {c.completed ? (
                    <CheckSquare className="w-4 h-4 text-[#2E9B62]" />
                  ) : (
                    <Square className="w-4 h-4 text-[#737982]" />
                  )}
                  <span
                    className={`text-xs ${
                      c.completed ? 'line-through text-[#737982]' : 'text-[#15171A] font-medium'
                    }`}
                  >
                    {c.text}
                  </span>
                </div>
                <button
                  onClick={() => removeChecklistItem(c.id)}
                  className="text-[#737982] hover:text-[#D64545] p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
              placeholder="Add checklist item..."
              className="flex-1 px-3 py-1.5 rounded-xl bg-[#F6F7F9] border border-[#E7E9ED] text-xs font-medium text-[#15171A] focus:outline-none focus:border-[#3157D5]"
            />
            <button
              onClick={handleAddChecklistItem}
              className="px-3 py-1.5 rounded-xl bg-[#EBF1FE] text-[#3157D5] text-xs font-bold"
            >
              Add
            </button>
          </div>
        </div>

        {/* Tags Section */}
        <div className="vault-card rounded-2xl p-4 space-y-3 border border-[#E7E9ED]">
          <h4 className="text-xs font-bold text-[#15171A] flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-[#3157D5]" />
            <span>Tags</span>
          </h4>

          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg bg-[#EBF1FE] text-[#3157D5] text-[11px] font-bold flex items-center gap-1"
              >
                <span>{tag}</span>
                <button onClick={() => handleRemoveTag(tag)} className="hover:text-[#D64545]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="Add tag (e.g. Finance, Keys)..."
              className="flex-1 px-3 py-1.5 rounded-xl bg-[#F6F7F9] border border-[#E7E9ED] text-xs font-medium text-[#15171A] focus:outline-none focus:border-[#3157D5]"
            />
            <button
              onClick={handleAddTag}
              className="px-3 py-1.5 rounded-xl bg-[#EBF1FE] text-[#3157D5] text-xs font-bold"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
