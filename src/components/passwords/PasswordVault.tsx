import React, { useState } from 'react';
import {
  X,
  Star,
  Trash2,
  Check,
  Key,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Globe,
  Plus,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { PasswordEntry, SecurityLevel } from '../../types';
import { CryptoService } from '../../services/crypto';

interface PasswordVaultProps {
  entry?: PasswordEntry | null;
  onClose: () => void;
}

export const PasswordVault: React.FC<PasswordVaultProps> = ({ entry, onClose }) => {
  const { savePassword, deletePassword, showToast } = useVault();

  const [title, setTitle] = useState<string>(entry?.title || '');
  const [username, setUsername] = useState<string>(entry?.username || '');
  const [password, setPassword] = useState<string>(entry?.password || '');
  const [website, setWebsite] = useState<string>(entry?.website || '');
  const [notes, setNotes] = useState<string>(entry?.notes || '');
  const [category, setCategory] = useState<string>(entry?.category || 'Logins');
  const [isFavorite, setIsFavorite] = useState<boolean>(entry?.isFavorite || false);
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>(entry?.securityLevel || 'sensitive');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [generatorLength, setGeneratorLength] = useState<number>(18);
  const [genSpecial, setGenSpecial] = useState<boolean>(true);
  const [genNumbers, setGenNumbers] = useState<boolean>(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Password strength calculation
  const getStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: 'Empty', color: '#D64545' };
    let score = 0;
    if (pwd.length >= 10) score += 25;
    if (pwd.length >= 16) score += 25;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 20;
    if (/[0-9]/.test(pwd)) score += 15;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 15;

    if (score >= 80) return { score, text: 'Very Strong', color: '#2E9B62' };
    if (score >= 60) return { score, text: 'Strong', color: '#3157D5' };
    if (score >= 40) return { score, text: 'Medium', color: '#D97706' };
    return { score, text: 'Weak', color: '#D64545' };
  };

  const strength = getStrength(password);

  const handleGeneratePassword = () => {
    let charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (genNumbers) charset += '0123456789';
    if (genSpecial) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let result = '';
    const randomVals = new Uint32Array(generatorLength);
    window.crypto.getRandomValues(randomVals);
    for (let i = 0; i < generatorLength; i++) {
      result += charset[randomVals[i] % charset.length];
    }
    setPassword(result);
    showToast('Generated cryptographically strong password');
  };

  const handleCopyPassword = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      showToast('Password copied. Clipboard clears in 30s.');
    }
  };

  const handleCopyUsername = () => {
    if (username) {
      navigator.clipboard.writeText(username);
      showToast('Username copied to clipboard');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('Title / Service name is required');
      return;
    }
    if (!password.trim()) {
      showToast('Password cannot be empty');
      return;
    }

    const pwToSave: PasswordEntry = {
      id: entry?.id || 'pw-' + Date.now(),
      title: title.trim(),
      username: username.trim(),
      password: password.trim(),
      website: website.trim() || undefined,
      notes: notes.trim() || undefined,
      category,
      isFavorite,
      securityLevel,
      createdAt: entry?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await savePassword(pwToSave);
    onClose();
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
            {entry ? 'Edit Secure Password' : 'New Password Entry'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="p-2 rounded-xl bg-[#F0F2F5] hover:bg-[#E2E6EC] text-[#F59E0B]"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {entry && (
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
                    await deletePassword(entry.id);
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
        {/* Service / Title */}
        <div className="vault-card rounded-2xl p-4 space-y-3 border border-[#E7E9ED]">
          <div>
            <label className="text-[11px] font-bold text-[#737982] uppercase tracking-wider block mb-1">
              Account / Service Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Google, Swiss Bank, GitHub"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F7F9] border border-[#E7E9ED] text-sm font-bold text-[#15171A] focus:outline-none focus:border-[#3157D5]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#737982] uppercase tracking-wider block mb-1">
              Username / Email
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="user@example.com"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F6F7F9] border border-[#E7E9ED] text-xs font-mono text-[#15171A] focus:outline-none focus:border-[#3157D5]"
              />
              <button
                onClick={handleCopyUsername}
                className="p-2.5 rounded-xl bg-[#EBF1FE] text-[#3157D5] hover:bg-[#DDE8FD]"
                title="Copy Username"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Password & Generator Card */}
        <div className="vault-card rounded-2xl p-4 space-y-3.5 border border-[#E7E9ED]">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-[#737982] uppercase tracking-wider">
              Secret Password
            </label>
            <span className="text-[11px] font-bold" style={{ color: strength.color }}>
              {strength.text} ({strength.score}%)
            </span>
          </div>

          {/* Password field with copy & toggle reveal */}
          <div className="flex items-center gap-2">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F6F7F9] border border-[#E7E9ED] text-xs font-mono text-[#15171A] focus:outline-none focus:border-[#3157D5]"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="p-2.5 rounded-xl bg-[#F0F2F5] text-[#737982] hover:text-[#15171A]"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={handleCopyPassword}
              className="p-2.5 rounded-xl bg-[#EBF1FE] text-[#3157D5] hover:bg-[#DDE8FD]"
              title="Copy password"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {/* Strength meter bar */}
          <div className="w-full h-1.5 rounded-full bg-[#EAECEF] overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
            />
          </div>

          {/* Password Generator controls */}
          <div className="p-3 rounded-xl bg-[#F6F7F9] border border-[#E7E9ED] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#15171A] flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-[#3157D5]" />
                <span>Password Generator</span>
              </span>
              <button
                onClick={handleGeneratePassword}
                className="px-2.5 py-1 rounded-lg bg-[#3157D5] text-white text-[11px] font-bold hover:bg-[#2847B5]"
              >
                Generate
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-[#737982]">
              <span>Length: {generatorLength}</span>
              <input
                type="range"
                min={8}
                max={32}
                value={generatorLength}
                onChange={(e) => setGeneratorLength(parseInt(e.target.value))}
                className="w-32 accent-[#3157D5]"
              />
            </div>
          </div>
        </div>

        {/* Website & Secure Notes */}
        <div className="vault-card rounded-2xl p-4 space-y-3 border border-[#E7E9ED]">
          <div>
            <label className="text-[11px] font-bold text-[#737982] uppercase tracking-wider block mb-1">
              Website URL
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3.5 py-2 rounded-xl bg-[#F6F7F9] border border-[#E7E9ED] text-xs font-medium text-[#15171A] focus:outline-none focus:border-[#3157D5]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#737982] uppercase tracking-wider block mb-1">
              Private Notes / Recovery Seeds
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional confidential notes, 2FA backup codes..."
              rows={3}
              className="w-full px-3.5 py-2 rounded-xl bg-[#F6F7F9] border border-[#E7E9ED] text-xs font-mono text-[#15171A] focus:outline-none focus:border-[#3157D5] resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
