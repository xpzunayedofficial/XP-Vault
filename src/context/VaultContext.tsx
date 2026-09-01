import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  VaultItem,
  Folder,
  SecureNote,
  PasswordEntry,
  VaultSettings,
  TrustedDevice,
  StorageMetrics,
  ActiveTab,
  SecurityLevel,
} from '../types';
import { CryptoService } from '../services/crypto';
import { VaultStorage } from '../services/storage';
import { OcrService } from '../services/ocr';

interface VaultContextType {
  isLocked: boolean;
  isInitialized: boolean;
  isEmergencyPrivacyActive: boolean;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: VaultSettings;
  items: VaultItem[];
  folders: Folder[];
  notes: SecureNote[];
  passwords: PasswordEntry[];
  trustedDevices: TrustedDevice[];
  storageMetrics: StorageMetrics;
  securityScore: number;
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  selectedItem: VaultItem | null;
  setSelectedItem: (item: VaultItem | null) => void;
  selectedNote: SecureNote | null;
  setSelectedNote: (note: SecureNote | null) => void;
  selectedPassword: PasswordEntry | null;
  setSelectedPassword: (password: PasswordEntry | null) => void;
  activeFolderId: string | null;
  setActiveFolderId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTypeFilter: string;
  setSelectedTypeFilter: (type: string) => void;

  // Authentication & Security Actions
  initializeVault: (pin: string, enableBiometrics: boolean) => Promise<boolean>;
  unlockWithPin: (pin: string) => Promise<{ success: boolean; message?: string }>;
  unlockWithBiometric: () => Promise<{ success: boolean; message?: string }>;
  lockVault: () => void;
  triggerEmergencyPrivacy: () => void;
  exitEmergencyPrivacyWithGesture: () => Promise<boolean>;
  changePin: (oldPin: string, newPin: string) => Promise<{ success: boolean; message?: string }>;
  resetVault: () => Promise<void>;
  updateSettings: (newSettings: Partial<VaultSettings>) => Promise<void>;

  // Vault Management Actions
  importFile: (file: File, folderId?: string, securityLevel?: SecurityLevel) => Promise<VaultItem>;
  importFiles: (files: File[], folderId?: string, securityLevel?: SecurityLevel) => Promise<VaultItem[]>;
  addCapturedPhoto: (dataUrl: string, name: string, folderId?: string) => Promise<VaultItem>;
  addScannedDocument: (dataUrl: string, name: string, ocrText?: string, folderId?: string) => Promise<VaultItem>;
  updateItem: (item: VaultItem) => Promise<void>;
  deleteItem: (itemId: string, permanent?: boolean) => Promise<void>;
  permanentlyDeleteItem: (itemId: string) => Promise<void>;
  restoreItem: (itemId: string) => Promise<void>;
  toggleFavoriteItem: (itemId: string) => Promise<void>;
  emptyTrash: () => Promise<void>;

  // Notes
  saveNote: (note: SecureNote) => Promise<void>;
  deleteNote: (noteId: string, permanent?: boolean) => Promise<void>;
  restoreNote: (noteId: string) => Promise<void>;
  permanentlyDeleteNote: (noteId: string) => Promise<void>;
  toggleFavoriteNote: (noteId: string) => Promise<void>;

  // Passwords
  savePassword: (entry: PasswordEntry) => Promise<void>;
  deletePassword: (entryId: string, permanent?: boolean) => Promise<void>;
  restorePassword: (entryId: string) => Promise<void>;
  permanentlyDeletePassword: (entryId: string) => Promise<void>;
  toggleFavoritePassword: (entryId: string) => Promise<void>;

  // Folders
  createFolder: (name: string, icon?: string, color?: string, policy?: SecurityLevel) => Promise<Folder>;
  deleteFolder: (folderId: string) => Promise<void>;

  // Devices & Backups
  revokeTrustedDevice: (deviceId: string) => Promise<void>;
  addTrustedDevice: (name: string, model: string, role: 'main' | 'recovery') => Promise<TrustedDevice>;
  createBackupBlob: () => Promise<Blob>;
  createEncryptedBackup: () => Promise<Blob | string>;
  restoreBackupFile: (file: File) => Promise<{ success: boolean; message: string }>;
  restoreFromBackup: (backupContent: string | File, pin?: string) => Promise<{ success: boolean; message: string }>;
  
  // Feedback
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const VaultContext = createContext<VaultContextType | null>(null);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isEmergencyPrivacyActive, setIsEmergencyPrivacyActive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [settings, setSettings] = useState<VaultSettings>({
    pinEnabled: true,
    passwordEnabled: false,
    fingerprintEnabled: true,
    faceUnlockEnabled: true,
    patternEnabled: false,
    deviceCredentialEnabled: true,
    biometricPlusPin: false,
    autoLockDelay: '1m',
    lockOnScreenOff: true,
    lockOnBackground: true,
    maxFailedAttempts: 5,
    failedAttemptsCount: 0,
    emergencyPrivacyEnabled: true,
    hiddenRecoveryGesture: [3, 3, 3, 1],
    screenshotProtection: true,
    recentAppsProtection: true,
    notificationPrivacy: true,
    accentColor: '#3157D5',
    theme: 'light',
    appIcon: 'default',
    isInitialized: false,
    vaultCreatedAt: Date.now(),
  });

  const [items, setItems] = useState<VaultItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<SecureNote[]>([]);
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedItem, setSelectedItemState] = useState<VaultItem | null>(null);
  const currentObjectUrlRef = useRef<string | null>(null);

  const setSelectedItem = useCallback(async (item: VaultItem | null) => {
    // Revoke previous URL if exists
    if (currentObjectUrlRef.current) {
      URL.revokeObjectURL(currentObjectUrlRef.current);
      currentObjectUrlRef.current = null;
    }

    if (!item) {
      setSelectedItemState(null);
      return;
    }

    try {
      const freshUrl = await VaultStorage.getDecryptedFileUrl(item.id, item.mimeType);
      if (freshUrl) {
        currentObjectUrlRef.current = freshUrl;
        setSelectedItemState({
          ...item,
          dataUrl: freshUrl
        });
      } else {
        setSelectedItemState(item);
        showToast('Decryption failed. Please unlock your vault.');
      }
    } catch (err: any) {
      if (err.name === 'DecryptionError') {
        showToast('This item is corrupted and cannot be decrypted. You may need to delete it.');
      } else {
        console.error('Failed to decrypt item for viewing:', err);
        setSelectedItemState(item);
        showToast('Error opening item. Please try again.');
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current);
      }
    };
  }, []);

  const [selectedNote, setSelectedNote] = useState<SecureNote | null>(null);
  const [selectedPassword, setSelectedPassword] = useState<PasswordEntry | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const autoLockTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Reload all data from local IndexedDB
  const refreshVaultData = useCallback(async () => {
    try {
      const [savedSettings, savedFolders, savedItems, savedNotes, savedPasswords, savedDevices] = await Promise.all([
        VaultStorage.getSettings(),
        VaultStorage.getFolders(),
        VaultStorage.getItems(),
        VaultStorage.getNotes(),
        VaultStorage.getPasswords(),
        VaultStorage.getTrustedDevices(),
      ]);

      setSettings(savedSettings);
      setIsInitialized(savedSettings.isInitialized);
      setFolders(savedFolders);
      setItems(savedItems);
      setNotes(savedNotes);
      setPasswords(savedPasswords);
      setTrustedDevices(savedDevices);

      if (!savedSettings.demoDataRemoved) {
          await VaultStorage.removeDemoData();
          savedSettings.demoDataRemoved = true;
          await VaultStorage.saveSettings(savedSettings);
          setSettings(savedSettings);
          // Refetch to ensure state matches the DB
          await refreshVaultData();
          return;
      }
    } catch (e) {
      console.error('Failed to load vault data:', e);
    }
  }, []);

  // Initialize DB on mount
  useEffect(() => {
    refreshVaultData();
  }, [refreshVaultData]);

  // Background Lock listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && settings.lockOnBackground && !isLocked && isInitialized) {
        setIsLocked(true);
        CryptoService.clearSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [settings.lockOnBackground, isLocked, isInitialized]);

  // Auto-lock timer reset on user interaction
  const resetAutoLockTimer = useCallback(() => {
    if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
    if (isLocked || !isInitialized || settings.autoLockDelay === 'immediately') return;

    let delayMs = 60000;
    switch (settings.autoLockDelay) {
      case '15s':
        delayMs = 15000;
        break;
      case '30s':
        delayMs = 30000;
        break;
      case '1m':
        delayMs = 60000;
        break;
      case '5m':
        delayMs = 300000;
        break;
      case '15m':
        delayMs = 900000;
        break;
    }

    autoLockTimerRef.current = setTimeout(() => {
      setIsLocked(true);
      CryptoService.clearSession();
      showToast('Vault auto-locked due to inactivity');
    }, delayMs);
  }, [isLocked, isInitialized, settings.autoLockDelay, showToast]);

  useEffect(() => {
    const handleUserActivity = () => resetAutoLockTimer();
    window.addEventListener('pointerdown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    resetAutoLockTimer();

    return () => {
      window.removeEventListener('pointerdown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
    };
  }, [resetAutoLockTimer]);

  // Calculate real Storage Metrics
  const storageMetrics = useMemo(() => {
    return VaultStorage.calculateStorageMetrics(items, notes, passwords);
  }, [items, notes, passwords]);

  // Calculate live Security Score (0 - 100)
  const securityScore = useMemo(() => {
    let score = 20; // Base encryption layer
    if (settings.isInitialized) score += 15;
    if (settings.pinEnabled && settings.pinHash) score += 15;
    if (settings.fingerprintEnabled || settings.faceUnlockEnabled) score += 15;
    if (settings.autoLockDelay === 'immediately' || settings.autoLockDelay === '15s' || settings.autoLockDelay === '30s' || settings.autoLockDelay === '1m') score += 10;
    if (settings.emergencyPrivacyEnabled) score += 10;
    if (settings.screenshotProtection && settings.recentAppsProtection) score += 10;
    if (settings.lastBackupAt && Date.now() - settings.lastBackupAt < 86400000 * 30) score += 5;

    return Math.min(100, score);
  }, [settings]);

  // First Launch Initialization
  const initializeVault = useCallback(async (pin: string, enableBiometrics: boolean): Promise<boolean> => {
    try {
      const salt = CryptoService.generateSalt();
      const pinHash = await CryptoService.hashCredential(pin, salt);
      await CryptoService.deriveMasterKey(pin, salt);

      // Seed default curated samples
      // await VaultStorage.seedDefaultData();

      const newSettings: VaultSettings = {
        ...settings,
        pinEnabled: true,
        pinHash,
        pinSalt: CryptoService.toHex(salt),
        fingerprintEnabled: enableBiometrics,
        faceUnlockEnabled: enableBiometrics,
        isInitialized: true,
        vaultCreatedAt: Date.now(),
      };

      await VaultStorage.saveSettings(newSettings);
      setSettings(newSettings);
      setIsInitialized(true);
      setIsLocked(false);
      setIsEmergencyPrivacyActive(false);

      await refreshVaultData();
      showToast('Vault created & protected with AES-GCM-256');
      return true;
    } catch (e) {
      console.error('Vault initialization failed:', e);
      return false;
    }
  }, [settings, refreshVaultData, showToast]);

  // Unlock with PIN
  const unlockWithPin = useCallback(async (pin: string): Promise<{ success: boolean; message?: string }> => {
    if (!settings.pinSalt || !settings.pinHash) {
      return { success: false, message: 'Vault has not been initialized.' };
    }

    try {
      const salt = CryptoService.fromHex(settings.pinSalt);
      const computedHash = await CryptoService.hashCredential(pin, salt);

      if (computedHash === settings.pinHash) {
        await CryptoService.deriveMasterKey(pin, salt);
        setIsLocked(false);
        setIsEmergencyPrivacyActive(false);

        // Reset failed count
        if (settings.failedAttemptsCount > 0) {
          const updated = { ...settings, failedAttemptsCount: 0 };
          setSettings(updated);
          await VaultStorage.saveSettings(updated);
        }

        showToast('Vault unlocked');
        return { success: true };
      } else {
        const nextFailed = settings.failedAttemptsCount + 1;
        const updated = { ...settings, failedAttemptsCount: nextFailed };
        setSettings(updated);
        await VaultStorage.saveSettings(updated);

        if (nextFailed >= settings.maxFailedAttempts && settings.emergencyPrivacyEnabled) {
          setIsEmergencyPrivacyActive(true);
          return { success: false, message: 'Max attempts reached. Entering Emergency Privacy.' };
        }

        return {
          success: false,
          message: `Incorrect PIN (${nextFailed}/${settings.maxFailedAttempts} attempts)`,
        };
      }
    } catch {
      return { success: false, message: 'Authentication error occurred.' };
    }
  }, [settings, showToast]);

  // Unlock with Biometric
  const unlockWithBiometric = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const auth = await CryptoService.authenticateBiometric();
      if (auth && settings.pinSalt) {
        // In local sandbox, derive key using existing salt or default master
        const salt = CryptoService.fromHex(settings.pinSalt);
        // Default standard secret derivation for biometrics
        await CryptoService.deriveMasterKey('XPV_SECURE_AUTH', salt);
        setIsLocked(false);
        setIsEmergencyPrivacyActive(false);
        showToast('Identity verified via Biometrics');
        return { success: true };
      }
      return { success: false, message: 'Biometric verification cancelled' };
    } catch {
      return { success: false, message: 'Biometric hardware unavailable' };
    }
  }, [settings.pinSalt, showToast]);

  // Lock Vault
  const lockVault = useCallback(() => {
    setIsLocked(true);
    CryptoService.clearSession();
    showToast('Vault locked');
  }, [showToast]);

  // Trigger Emergency Privacy Mode
  const triggerEmergencyPrivacy = useCallback(() => {
    setIsEmergencyPrivacyActive(true);
    setIsLocked(true);
    CryptoService.clearSession();
  }, []);

  // Exit Emergency Privacy via hidden gesture
  const exitEmergencyPrivacyWithGesture = useCallback(async (): Promise<boolean> => {
    try {
      const bio = await CryptoService.authenticateBiometric();
      if (bio) {
        setIsEmergencyPrivacyActive(false);
        setIsLocked(false);
        if (settings.pinSalt) {
          const salt = CryptoService.fromHex(settings.pinSalt);
          await CryptoService.deriveMasterKey('XPV_SECURE_AUTH', salt);
        }
        showToast('Identity verified. Vault restored.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [settings.pinSalt, showToast]);

  // Change PIN
  const changePin = useCallback(async (oldPin: string, newPin: string): Promise<{ success: boolean; message?: string }> => {
    if (!settings.pinSalt || !settings.pinHash) {
      return { success: false, message: 'Vault has not been initialized.' };
    }
    try {
      const salt = CryptoService.fromHex(settings.pinSalt);
      const computedHash = await CryptoService.hashCredential(oldPin, salt);
      if (computedHash !== settings.pinHash) {
        return { success: false, message: 'Current PIN is incorrect.' };
      }
      const newSalt = CryptoService.generateSalt();
      const newPinHash = await CryptoService.hashCredential(newPin, newSalt);
      
      const oldKey = await CryptoService.deriveMasterKey(oldPin, salt);
      const newKey = await CryptoService.deriveMasterKey(newPin, newSalt);

      // Perform heavy migration of all encrypted data
      await VaultStorage.reencryptAll(oldKey, newKey);

      const updatedSettings: VaultSettings = {
        ...settings,
        pinHash: newPinHash,
        pinSalt: CryptoService.toHex(newSalt),
        failedAttemptsCount: 0,
      };
      setSettings(updatedSettings);
      await VaultStorage.saveSettings(updatedSettings);
      return { success: true };
    } catch {
      return { success: false, message: 'Failed to update PIN.' };
    }
  }, [settings]);

  // Reset / Wipe Vault
  const resetVault = useCallback(async () => {
    await VaultStorage.wipeVault();
    CryptoService.clearSession();
    setIsInitialized(false);
    setIsLocked(true);
    setIsEmergencyPrivacyActive(false);
    setItems([]);
    setNotes([]);
    setPasswords([]);
    setFolders([]);
    setTrustedDevices([]);
    setSettings({
      pinEnabled: true,
      passwordEnabled: false,
      fingerprintEnabled: true,
      faceUnlockEnabled: false,
      autoLockDelay: '1m',
      emergencyPrivacyEnabled: true,
      failedAttemptsCount: 0,
      maxFailedAttempts: 5,
      offlineOnlyEnforced: true,
      isConfigured: false,
      hardwareKeyEnabled: false,
      clipboardClearDelaySec: 30,
      tapPattern: [3, 3, 3, 1],
      accentColor: '#3157D5',
    });
  }, []);

  // Update Settings
  const updateSettings = useCallback(async (newSettings: Partial<VaultSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    await VaultStorage.saveSettings(merged);
  }, [settings]);

  // Import File
  const importFile = useCallback(async (file: File, folderId?: string, securityLevel: SecurityLevel = 'private'): Promise<VaultItem> => {
    const buffer = await file.arrayBuffer();
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isImage = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif', 'avif'].includes(ext);
    const isVideo = file.type.startsWith('video/') || ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi', '3gp', 'flv', 'wmv'].includes(ext);
    const isPdf = file.type === 'application/pdf' || ext === 'pdf';
    const isAudio = file.type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'wma'].includes(ext);
    const isDoc = file.type.includes('text') || file.type.includes('document') || ['txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'json', 'md'].includes(ext);

    let itemType: VaultItem['type'] = 'other';
    if (isImage) itemType = 'photo';
    else if (isVideo) itemType = 'video';
    else if (isPdf) itemType = 'pdf';
    else if (isAudio) itemType = 'audio';
    else if (isDoc) itemType = 'document';

    let previewUrl: string | undefined = undefined;
    let ocrText: string | undefined = undefined;

    if (isImage) {
      try {
        previewUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve(URL.createObjectURL(new Blob([buffer], { type: file.type || 'image/jpeg' })));
          reader.readAsDataURL(file);
        });
      } catch {
        previewUrl = URL.createObjectURL(new Blob([buffer], { type: file.type || 'image/jpeg' }));
      }
      ocrText = OcrService.extractSampleText(file.name, file.type);
    } else if (isVideo) {
      try {
        const blob = new Blob([buffer], { type: file.type || 'video/mp4' });
        previewUrl = URL.createObjectURL(blob);
      } catch {
        previewUrl = URL.createObjectURL(file);
      }
    } else if (isPdf || isAudio) {
      previewUrl = URL.createObjectURL(new Blob([buffer], { type: file.type || 'application/octet-stream' }));
    }

    const newItem: VaultItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: file.name,
      type: itemType,
      folderId: folderId || activeFolderId || undefined,
      size: file.size,
      mimeType: file.type || (isImage ? 'image/jpeg' : isVideo ? 'video/mp4' : isPdf ? 'application/pdf' : 'application/octet-stream'),
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      isFavorite: false,
      tags: [itemType.toUpperCase()],
      securityLevel,
      thumbnailUrl: previewUrl,
      dataUrl: previewUrl,
      ocrText,
    };

    await VaultStorage.saveItem(newItem, buffer);
    setItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
    return newItem;
  }, [activeFolderId]);

  // Import Multiple Files
  const importFiles = useCallback(async (files: File[], folderId?: string, securityLevel: SecurityLevel = 'private'): Promise<VaultItem[]> => {
    const imported: VaultItem[] = [];
    for (const file of files) {
      try {
        const item = await importFile(file, folderId, securityLevel);
        imported.push(item);
      } catch (err) {
        console.error('Failed to import file:', file.name, err);
      }
    }
    return imported;
  }, [importFile]);

  // Add Captured Photo
  const addCapturedPhoto = useCallback(async (dataUrl: string, name: string, folderId?: string): Promise<VaultItem> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const buffer = await blob.arrayBuffer();

    const newItem: VaultItem = {
      id: 'photo-' + Date.now(),
      name: name.endsWith('.jpg') ? name : `${name}.jpg`,
      type: 'photo',
      folderId: folderId || activeFolderId || undefined,
      size: blob.size,
      mimeType: 'image/jpeg',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      isFavorite: false,
      tags: ['Camera', 'Private'],
      securityLevel: 'sensitive',
      thumbnailUrl: dataUrl,
      dataUrl: dataUrl,
      ocrText: OcrService.extractSampleText(name, 'image/jpeg'),
    };

    await VaultStorage.saveItem(newItem, buffer);
    setItems((prev) => [newItem, ...prev]);
    return newItem;
  }, [activeFolderId]);

  // Add Scanned Document
  const addScannedDocument = useCallback(async (dataUrl: string, name: string, ocrText?: string, folderId?: string): Promise<VaultItem> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const buffer = await blob.arrayBuffer();

    const newItem: VaultItem = {
      id: 'scan-' + Date.now(),
      name: name.endsWith('.pdf') ? name : `${name}.pdf`,
      type: 'pdf',
      folderId: folderId || activeFolderId || undefined,
      size: blob.size,
      mimeType: 'application/pdf',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      isFavorite: false,
      tags: ['Scanned', 'Document'],
      securityLevel: 'sensitive',
      thumbnailUrl: dataUrl,
      dataUrl: dataUrl,
      ocrText: ocrText || OcrService.extractSampleText(name, 'application/pdf'),
      metadata: { pages: 1, walletCategory: 'scanned' as any },
    };

    await VaultStorage.saveItem(newItem, buffer);
    setItems((prev) => [newItem, ...prev]);
    return newItem;
  }, [activeFolderId]);

  // Update Item
  const updateItem = useCallback(async (item: VaultItem) => {
    await VaultStorage.saveItem(item);
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
  }, []);

  // Delete Item
  const deleteItem = useCallback(async (itemId: string, permanent = false) => {
    await VaultStorage.deleteItem(itemId, permanent);
    if (permanent) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      showToast('Permanently wiped from vault');
    } else {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, isDeleted: true, deletedAt: Date.now() } : i))
      );
      showToast('Moved to Trash');
    }
  }, [showToast]);

  // Permanently Delete Item
  const permanentlyDeleteItem = useCallback(async (itemId: string) => {
    await deleteItem(itemId, true);
  }, [deleteItem]);

  // Empty Trash
  const emptyTrash = useCallback(async () => {
    await VaultStorage.emptyTrash();
    await refreshVaultData();
    showToast('Trash emptied permanently');
  }, [refreshVaultData, showToast]);

  // Restore Item
  const restoreItem = useCallback(async (itemId: string) => {
    await VaultStorage.restoreItem(itemId);
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          const clone = { ...i };
          delete clone.isDeleted;
          delete clone.deletedAt;
          return clone;
        }
        return i;
      })
    );
    showToast('Item restored to vault');
  }, [showToast]);

  // Toggle Favorite
  const toggleFavoriteItem = useCallback(async (itemId: string) => {
    const target = items.find((i) => i.id === itemId);
    if (!target) return;
    const updated = { ...target, isFavorite: !target.isFavorite };
    await VaultStorage.saveItem(updated);
    setItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)));
  }, [items]);

  // Notes Actions
  const saveNote = useCallback(async (note: SecureNote) => {
    await VaultStorage.saveNote(note);
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === note.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = note;
        return copy;
      }
      return [note, ...prev];
    });
    showToast('Encrypted note saved');
  }, [showToast]);

  const deleteNote = useCallback(async (noteId: string, permanent = false) => {
    await VaultStorage.deleteNote(noteId, permanent);
    if (permanent) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      showToast('Note wiped permanently');
    } else {
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, isDeleted: true, deletedAt: Date.now() } : n))
      );
      showToast('Note moved to Trash');
    }
  }, [showToast]);

  const permanentlyDeleteNote = useCallback(async (noteId: string) => {
    await deleteNote(noteId, true);
  }, [deleteNote]);

  const restoreNote = useCallback(async (noteId: string) => {
    await VaultStorage.restoreNote(noteId);
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const clone = { ...n };
          delete clone.isDeleted;
          delete clone.deletedAt;
          return clone;
        }
        return n;
      })
    );
    showToast('Note restored to vault');
  }, [showToast]);

  const toggleFavoriteNote = useCallback(async (noteId: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;
    const updated = { ...target, isFavorite: !target.isFavorite };
    await VaultStorage.saveNote(updated);
    setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
  }, [notes]);

  // Passwords Actions
  const savePassword = useCallback(async (entry: PasswordEntry) => {
    await VaultStorage.savePassword(entry);
    setPasswords((prev) => {
      const idx = prev.findIndex((p) => p.id === entry.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = entry;
        return copy;
      }
      return [entry, ...prev];
    });
    showToast('Password credential secured');
  }, [showToast]);

  const deletePassword = useCallback(async (entryId: string, permanent = false) => {
    await VaultStorage.deletePassword(entryId, permanent);
    if (permanent) {
      setPasswords((prev) => prev.filter((p) => p.id !== entryId));
      showToast('Credential wiped permanently');
    } else {
      setPasswords((prev) =>
        prev.map((p) => (p.id === entryId ? { ...p, isDeleted: true, deletedAt: Date.now() } : p))
      );
      showToast('Credential moved to Trash');
    }
  }, [showToast]);

  const permanentlyDeletePassword = useCallback(async (entryId: string) => {
    await deletePassword(entryId, true);
  }, [deletePassword]);

  const restorePassword = useCallback(async (entryId: string) => {
    await VaultStorage.restorePassword(entryId);
    setPasswords((prev) =>
      prev.map((p) => {
        if (p.id === entryId) {
          const clone = { ...p };
          delete clone.isDeleted;
          delete clone.deletedAt;
          return clone;
        }
        return p;
      })
    );
    showToast('Credential restored to vault');
  }, [showToast]);

  const toggleFavoritePassword = useCallback(async (entryId: string) => {
    const target = passwords.find((p) => p.id === entryId);
    if (!target) return;
    const updated = { ...target, isFavorite: !target.isFavorite };
    await VaultStorage.savePassword(updated);
    setPasswords((prev) => prev.map((p) => (p.id === entryId ? updated : p)));
  }, [passwords]);

  // Folder Actions
  const createFolder = useCallback(async (name: string, icon = 'Folder', color = '#3157D5', policy: SecurityLevel = 'normal'): Promise<Folder> => {
    const newFolder: Folder = {
      id: 'f-' + Date.now(),
      name,
      icon,
      color,
      securityPolicy: policy,
      createdAt: Date.now(),
    };
    await VaultStorage.saveFolder(newFolder);
    setFolders((prev) => [...prev, newFolder]);
    showToast(`Folder "${name}" created`);
    return newFolder;
  }, [showToast]);

  const deleteFolder = useCallback(async (folderId: string) => {
    await VaultStorage.deleteFolder(folderId);
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    if (activeFolderId === folderId) setActiveFolderId(null);
    showToast('Folder removed');
  }, [activeFolderId, showToast]);

  // Trusted Devices
  const revokeTrustedDevice = useCallback(async (deviceId: string) => {
    await VaultStorage.revokeTrustedDevice(deviceId);
    setTrustedDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, status: 'revoked' } : d))
    );
    showToast('Device access revoked');
  }, [showToast]);

  const addTrustedDevice = useCallback(async (name: string, model: string, role: 'main' | 'recovery'): Promise<TrustedDevice> => {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newDevice: TrustedDevice = {
      id: 'dev-' + Date.now(),
      name,
      model,
      role,
      pairedAt: Date.now(),
      lastActive: Date.now(),
      fingerprint: `SHA256:${rand}...${rand.split('').reverse().join('')}`,
      status: 'paired',
    };
    await VaultStorage.saveTrustedDevice(newDevice);
    setTrustedDevices((prev) => [...prev, newDevice]);
    showToast(`Device "${name}" paired as trusted`);
    return newDevice;
  }, [showToast]);

  // Backups
  const createBackupBlob = useCallback(async (): Promise<Blob> => {
    const blob = await VaultStorage.createBackupPackage();
    const updated = { ...settings, lastBackupAt: Date.now() };
    setSettings(updated);
    await VaultStorage.saveSettings(updated);
    showToast('Encrypted backup created');
    return blob;
  }, [settings, showToast]);

  const restoreBackupFile = useCallback(async (file: File): Promise<{ success: boolean; message: string }> => {
    const res = await VaultStorage.restoreBackupPackage(file);
    if (res.success) {
      await refreshVaultData();
      showToast('Vault restored successfully');
    }
    return res;
  }, [refreshVaultData, showToast]);

  const createEncryptedBackup = useCallback(async (): Promise<Blob> => {
    return await createBackupBlob();
  }, [createBackupBlob]);

  const restoreFromBackup = useCallback(async (backupContent: string | File, pin?: string): Promise<{ success: boolean; message: string }> => {
    if (typeof backupContent === 'string') {
      const blob = new Blob([backupContent], { type: 'application/json' });
      const file = new File([blob], 'vault_backup.json', { type: 'application/json' });
      return await restoreBackupFile(file);
    }
    return await restoreBackupFile(backupContent);
  }, [restoreBackupFile]);

  return (
    <VaultContext.Provider
      value={{
        isLocked,
        isInitialized,
        isEmergencyPrivacyActive,
        activeTab,
        setActiveTab,
        settings,
        items,
        folders,
        notes,
        passwords,
        trustedDevices,
        storageMetrics,
        securityScore,
        activeModal,
        setActiveModal,
        selectedItem,
        setSelectedItem,
        selectedNote,
        setSelectedNote,
        selectedPassword,
        setSelectedPassword,
        activeFolderId,
        setActiveFolderId,
        searchQuery,
        setSearchQuery,
        selectedTypeFilter,
        setSelectedTypeFilter,

        initializeVault,
        unlockWithPin,
        unlockWithBiometric,
        lockVault,
        triggerEmergencyPrivacy,
        exitEmergencyPrivacyWithGesture,
        changePin,
        resetVault,
        updateSettings,

        importFile,
        importFiles,
        addCapturedPhoto,
        addScannedDocument,
        updateItem,
        deleteItem,
        permanentlyDeleteItem,
        restoreItem,
        toggleFavoriteItem,
        emptyTrash,

        saveNote,
        deleteNote,
        restoreNote,
        permanentlyDeleteNote,
        toggleFavoriteNote,

        savePassword,
        deletePassword,
        restorePassword,
        permanentlyDeletePassword,
        toggleFavoritePassword,

        createFolder,
        deleteFolder,

        revokeTrustedDevice,
        addTrustedDevice,
        createBackupBlob,
        createEncryptedBackup,
        restoreBackupFile,
        restoreFromBackup,

        toastMessage,
        showToast,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
