export type VaultItemType =
  | 'photo'
  | 'video'
  | 'document'
  | 'pdf'
  | 'audio'
  | 'note'
  | 'password'
  | 'other';

export type SecurityLevel = 'normal' | 'private' | 'sensitive' | 'maximum';

export interface VaultItem {
  id: string;
  name: string;
  type: VaultItemType;
  folderId?: string;
  size: number; // in bytes
  mimeType: string;
  createdAt: number;
  modifiedAt: number;
  isFavorite: boolean;
  tags: string[];
  securityLevel: SecurityLevel;
  encryptedBlobId?: string; // Reference to IndexedDB blob
  dataUrl?: string; // Ephemeral decrypted URL
  thumbnailUrl?: string;
  ocrText?: string;
  checksum?: string;
  isDeleted?: boolean;
  deletedAt?: number;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
    walletCategory?: 'personal' | 'academic' | 'certificate' | 'receipt' | 'card' | 'important';
  };
}

export interface Folder {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  securityPolicy?: SecurityLevel;
  createdAt: number;
  itemCount?: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface SecureNote {
  id: string;
  title: string;
  content: string;
  isRichText?: boolean;
  checklists?: ChecklistItem[];
  tags: string[];
  isFavorite: boolean;
  folderId?: string;
  securityLevel: SecurityLevel;
  createdAt: number;
  updatedAt: number;
  isDeleted?: boolean;
  deletedAt?: number;
}

export type AutoLockDelay = 'immediately' | '15s' | '30s' | '1m' | '5m' | '15m';

export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  email?: string;
  url?: string;
  website?: string;
  notes?: string;
  category: string;
  strengthScore?: number; // 0 - 100
  isFavorite: boolean;
  securityLevel?: SecurityLevel;
  createdAt: number;
  updatedAt: number;
  isDeleted?: boolean;
  deletedAt?: number;
}

export interface TrustedDevice {
  id: string;
  name: string;
  model: string;
  platform?: string;
  ipAddress?: string;
  role?: 'main' | 'recovery';
  pairedAt?: number;
  lastActive?: number;
  lastActiveAt?: number;
  fingerprint?: string;
  status: 'active' | 'paired' | 'revoked';
  isCurrentDevice?: boolean;
}

export interface VaultSettings {
  // Lock Center
  pinEnabled: boolean;
  pinHash?: string;
  pinSalt?: string;
  passwordEnabled: boolean;
  passwordHash?: string;
  fingerprintEnabled: boolean;
  faceUnlockEnabled: boolean;
  patternEnabled: boolean;
  deviceCredentialEnabled: boolean;
  biometricPlusPin: boolean;

  // Auto-Lock
  autoLockDelay: 'immediately' | '15s' | '30s' | '1m' | '5m' | '15m';
  lockOnScreenOff: boolean;
  lockOnBackground: boolean;

  // Failed Attempts & Emergency
  maxFailedAttempts: 3 | 5 | 7 | 10;
  failedAttemptsCount: number;
  emergencyPrivacyEnabled: boolean;
  hiddenRecoveryGesture: number[]; // e.g. [3, 3, 3, 1] taps sequence
  
  // Privacy
  screenshotProtection: boolean;
  recentAppsProtection: boolean;
  notificationPrivacy: boolean;

  // Appearance
  accentColor: string; // e.g. #3157D5
  theme: 'light';
  appIcon: string;

  // Onboarding
  isInitialized: boolean;
  vaultCreatedAt: number;
  lastBackupAt?: number;
  demoDataRemoved?: boolean;
}

export interface StorageMetrics {
  totalUsedBytes: number;
  totalAvailableBytes: number;
  photosBytes: number;
  videosBytes: number;
  documentsBytes: number;
  audioBytes: number;
  notesBytes: number;
  passwordsBytes: number;
  otherBytes: number;
}

export type ActiveTab = 'home' | 'vault' | 'search' | 'security' | 'settings';
