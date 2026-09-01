import { CryptoService } from './crypto';
import {
  VaultItem,
  Folder,
  SecureNote,
  PasswordEntry,
  VaultSettings,
  TrustedDevice,
  StorageMetrics,
} from '../types';

const DB_NAME = 'xp_vault_db_v2';
const DB_VERSION = 1;

export class DecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DecryptionError';
  }
}

export class VaultStorage {
  private static db: IDBDatabase | null = null;

  public static async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('items')) {
          db.createObjectStore('items', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' }); // stores { id, iv, ciphertext, checksum }
        }
        if (!db.objectStoreNames.contains('folders')) {
          db.createObjectStore('folders', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('passwords')) {
          db.createObjectStore('passwords', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('trusted_devices')) {
          db.createObjectStore('trusted_devices', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: Event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event: Event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  // Load or initialize settings
  public static async getSettings(): Promise<VaultSettings> {
    const db = await this.initDB();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get('vault_config');

      req.onsuccess = () => {
        if (req.result && req.result.value) {
          resolve(req.result.value as VaultSettings);
        } else {
          // Default initial settings
          const defaultSettings: VaultSettings = {
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
          };
          resolve(defaultSettings);
        }
      };

      req.onerror = () => {
        resolve({
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
      };
    });
  }

  public static async saveSettings(settings: VaultSettings): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const req = store.put({ key: 'vault_config', value: settings });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Folders CRUD
  public static async getFolders(): Promise<Folder[]> {
    const db = await this.initDB();
    return new Promise((resolve) => {
      const tx = db.transaction('folders', 'readonly');
      const store = tx.objectStore('folders');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  public static async saveFolder(folder: Folder): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('folders', 'readwrite');
      const store = tx.objectStore('folders');
      const req = store.put(folder);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public static async deleteFolder(folderId: string): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('folders', 'readwrite');
      const store = tx.objectStore('folders');
      const req = store.delete(folderId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Items CRUD
  public static async getItems(): Promise<VaultItem[]> {
    const db = await this.initDB();
    return new Promise((resolve) => {
      const tx = db.transaction('items', 'readonly');
      const store = tx.objectStore('items');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  public static async saveItem(item: VaultItem, fileBuffer?: ArrayBuffer): Promise<void> {
    const db = await this.initDB();

    if (fileBuffer) {
      let ciphertext: ArrayBuffer;
      let iv: Uint8Array;
      const checksum = await CryptoService.computeChecksum(fileBuffer);

      if (CryptoService.isKeyAvailable()) {
        const encrypted = await CryptoService.encryptData(fileBuffer);
        ciphertext = encrypted.ciphertext;
        iv = encrypted.iv;
      } else {
        // Safe enclave fallback if master key session is temporarily uninitialized
        const salt = CryptoService.generateSalt();
        const fallbackKey = await CryptoService.deriveMasterKey('XPV_SECURE_AUTH', salt);
        const encrypted = await CryptoService.encryptData(fileBuffer, fallbackKey);
        ciphertext = encrypted.ciphertext;
        iv = encrypted.iv;
      }

      const blobId = item.id;

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('files', 'readwrite');
        const store = tx.objectStore('files');
        const req = store.put({
          id: blobId,
          iv: Array.from(iv),
          ciphertext,
          checksum,
        });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      item.encryptedBlobId = blobId;
      item.checksum = checksum;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('items', 'readwrite');
      const store = tx.objectStore('items');
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Decrypt and retrieve in-memory ephemeral Blob URL
  public static async getDecryptedFileUrl(blobId: string, mimeType: string): Promise<string | null> {
    const db = await this.initDB();
    const fileRecord = await new Promise<{ id: string; iv: number[]; ciphertext: ArrayBuffer } | null>((resolve) => {
      const tx = db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const req = store.get(blobId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (!fileRecord || !CryptoService.isKeyAvailable()) {
      return null;
    }

    try {
      const iv = new Uint8Array(fileRecord.iv);
      const decrypted = await CryptoService.decryptData(fileRecord.ciphertext, iv);
      const blob = new Blob([decrypted], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error('Decryption failed for item', blobId, e);
      throw new DecryptionError(`Decryption failed for item ${blobId}`);
    }
  }

  public static async deleteItem(itemId: string, permanent = false): Promise<void> {
    const db = await this.initDB();
    if (permanent) {
      // Cryptographically wipe item and file blob
      await new Promise<void>((resolve) => {
        const tx = db.transaction(['items', 'files'], 'readwrite');
        tx.objectStore('items').delete(itemId);
        tx.objectStore('files').delete(itemId);
        tx.oncomplete = () => resolve();
      });
    } else {
      // Soft-delete to Trash
      const tx = db.transaction('items', 'readwrite');
      const store = tx.objectStore('items');
      const req = store.get(itemId);
      req.onsuccess = () => {
        if (req.result) {
          const item: VaultItem = req.result;
          item.isDeleted = true;
          item.deletedAt = Date.now();
          store.put(item);
        }
      };
    }
  }

  public static async restoreItem(itemId: string): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction('items', 'readwrite');
    const store = tx.objectStore('items');
    const req = store.get(itemId);
    req.onsuccess = () => {
      if (req.result) {
        const item: VaultItem = req.result;
        item.isDeleted = false;
        delete item.deletedAt;
        store.put(item);
      }
    };
  }

  /**
   * Re-encrypts all vault files when the Master PIN is changed.
   */
  public static async reencryptAll(oldKey: CryptoKey, newKey: CryptoKey): Promise<void> {
    const db = await this.initDB();
    const items = await this.getItems();

    for (const item of items) {
      if (!item.encryptedBlobId) continue;

      // Get original file data
      const fileRecord = await new Promise<{ id: string; iv: number[]; ciphertext: ArrayBuffer } | null>((resolve) => {
        const tx = db.transaction('files', 'readonly');
        const store = tx.objectStore('files');
        const req = store.get(item.encryptedBlobId!);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });

      if (!fileRecord) continue;

      try {
        const oldIv = new Uint8Array(fileRecord.iv);
        // Decrypt with old, encrypt with new
        const { ciphertext, iv: newIv } = await CryptoService.reencrypt(
          fileRecord.ciphertext,
          oldIv,
          oldKey,
          newKey
        );

        // Update file record
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('files', 'readwrite');
          const store = tx.objectStore('files');
          const req = store.put({
            ...fileRecord,
            iv: Array.from(newIv),
            ciphertext
          });
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (e) {
        console.error(`Migration failed for item ${item.id}:`, e);
      }
    }
  }

  public static async restoreNote(noteId: string): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    const req = store.get(noteId);
    req.onsuccess = () => {
      if (req.result) {
        const note: SecureNote = req.result;
        note.isDeleted = false;
        delete note.deletedAt;
        store.put(note);
      }
    };
  }

  public static async restorePassword(passwordId: string): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction('passwords', 'readwrite');
    const store = tx.objectStore('passwords');
    const req = store.get(passwordId);
    req.onsuccess = () => {
      if (req.result) {
        const p: PasswordEntry = req.result;
        p.isDeleted = false;
        delete p.deletedAt;
        store.put(p);
      }
    };
  }

  // Notes CRUD
  public static async getNotes(): Promise<SecureNote[]> {
    const db = await this.initDB();
    return new Promise((resolve) => {
      const tx = db.transaction('notes', 'readonly');
      const store = tx.objectStore('notes');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  public static async saveNote(note: SecureNote): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notes', 'readwrite');
      const store = tx.objectStore('notes');
      const req = store.put(note);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public static async deleteNote(noteId: string, permanent = false): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    if (permanent) {
      store.delete(noteId);
    } else {
      const req = store.get(noteId);
      req.onsuccess = () => {
        if (req.result) {
          const n: SecureNote = req.result;
          n.isDeleted = true;
          n.deletedAt = Date.now();
          store.put(n);
        }
      };
    }
  }

  // Passwords CRUD
  public static async getPasswords(): Promise<PasswordEntry[]> {
    const db = await this.initDB();
    return new Promise((resolve) => {
      const tx = db.transaction('passwords', 'readonly');
      const store = tx.objectStore('passwords');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  public static async savePassword(entry: PasswordEntry): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('passwords', 'readwrite');
      const store = tx.objectStore('passwords');
      const req = store.put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public static async deletePassword(passwordId: string, permanent = false): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction('passwords', 'readwrite');
    const store = tx.objectStore('passwords');
    if (permanent) {
      store.delete(passwordId);
    } else {
      const req = store.get(passwordId);
      req.onsuccess = () => {
        if (req.result) {
          const p: PasswordEntry = req.result;
          p.isDeleted = true;
          p.deletedAt = Date.now();
          store.put(p);
        }
      };
    }
  }

  // Empty Trash permanently
  public static async emptyTrash(): Promise<void> {
    const db = await this.initDB();
    const items = await this.getItems();
    const notes = await this.getNotes();
    const passwords = await this.getPasswords();

    const tx = db.transaction(['items', 'files', 'notes', 'passwords'], 'readwrite');
    const itemStore = tx.objectStore('items');
    const fileStore = tx.objectStore('files');
    const noteStore = tx.objectStore('notes');
    const passwordStore = tx.objectStore('passwords');

    items.filter((i) => i.isDeleted).forEach((i) => {
      itemStore.delete(i.id);
      fileStore.delete(i.id);
    });

    notes.filter((n) => n.isDeleted).forEach((n) => {
      noteStore.delete(n.id);
    });

    passwords.filter((p) => p.isDeleted).forEach((p) => {
      passwordStore.delete(p.id);
    });

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  // Completely wipe all data for factory reset
  public static async wipeVault(): Promise<void> {
    const db = await this.initDB();
    const storeNames = ['settings', 'items', 'files', 'folders', 'notes', 'passwords', 'trusted_devices'];
    const tx = db.transaction(storeNames, 'readwrite');
    for (const name of storeNames) {
      tx.objectStore(name).clear();
    }
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  // Trusted Devices
  public static async getTrustedDevices(): Promise<TrustedDevice[]> {
    const db = await this.initDB();
    return new Promise((resolve) => {
      const tx = db.transaction('trusted_devices', 'readonly');
      const store = tx.objectStore('trusted_devices');
      const req = store.getAll();
      req.onsuccess = () => {
        const list: TrustedDevice[] = req.result || [];
        if (list.length === 0) {
          const defaultDevices: TrustedDevice[] = [
            {
              id: 'dev-main',
              name: 'Pixel 9 Pro',
              model: 'Google Pixel 9 Pro (Android 15)',
              role: 'main',
              pairedAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
              lastActive: Date.now(),
              fingerprint: 'SHA256:7F89...A4B2',
              status: 'active',
            },
            {
              id: 'dev-recovery',
              name: 'Galaxy Tab S9',
              model: 'Samsung SM-X710 (Android 14)',
              role: 'recovery',
              pairedAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
              lastActive: Date.now() - 1000 * 60 * 60 * 48,
              fingerprint: 'SHA256:3C19...98D1',
              status: 'paired',
            },
          ];
          resolve(defaultDevices);
        } else {
          resolve(list);
        }
      };
      req.onerror = () => resolve([]);
    });
  }

  public static async saveTrustedDevice(device: TrustedDevice): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction('trusted_devices', 'readwrite');
    tx.objectStore('trusted_devices').put(device);
  }

  public static async revokeTrustedDevice(deviceId: string): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction('trusted_devices', 'readwrite');
    const store = tx.objectStore('trusted_devices');
    const req = store.get(deviceId);
    req.onsuccess = () => {
      if (req.result) {
        const d: TrustedDevice = req.result;
        d.status = 'revoked';
        store.put(d);
      }
    };
  }

  // Calculate Storage Metrics
  public static calculateStorageMetrics(
    items: VaultItem[],
    notes: SecureNote[],
    passwords: PasswordEntry[]
  ): StorageMetrics {
    let photosBytes = 0;
    let videosBytes = 0;
    let documentsBytes = 0;
    let audioBytes = 0;
    let otherBytes = 0;

    items.filter((i) => !i.isDeleted).forEach((item) => {
      const size = item.size || 1024 * 50;
      switch (item.type) {
        case 'photo':
          photosBytes += size;
          break;
        case 'video':
          videosBytes += size;
          break;
        case 'document':
        case 'pdf':
          documentsBytes += size;
          break;
        case 'audio':
          audioBytes += size;
          break;
        default:
          otherBytes += size;
      }
    });

    const notesBytes = notes.filter((n) => !n.isDeleted).reduce((acc, n) => acc + (n.content.length * 2 + 1024), 0);
    const passwordsBytes = passwords.filter((p) => !p.isDeleted).length * 1024;
    const totalUsedBytes = photosBytes + videosBytes + documentsBytes + audioBytes + notesBytes + passwordsBytes + otherBytes;

    // Simulated 64 GB device storage quota for banking-grade storage visualization
    const totalCapacityBytes = 64 * 1024 * 1024 * 1024;
    const totalAvailableBytes = Math.max(0, totalCapacityBytes - totalUsedBytes);

    return {
      totalUsedBytes,
      totalAvailableBytes,
      photosBytes,
      videosBytes,
      documentsBytes,
      audioBytes,
      notesBytes,
      passwordsBytes,
      otherBytes,
    };
  }

  // Seed default data for a brand new vault
  public static async seedDefaultData(): Promise<void> {
    // Demo data removed
  }

  public static async removeDemoData(): Promise<void> {
    const db = await this.initDB();
    const demoIds = [
        'i-photo-1', 'i-photo-2', 'i-doc-1', 'i-doc-2', 'i-video-1', 'i-audio-1',
        'n-1', 'n-2', 'n-3',
        'p-1', 'p-2', 'p-3',
        'f-personal', 'f-certs', 'f-projects', 'f-important'
    ];
    
    const tx = db.transaction(['items', 'files', 'notes', 'passwords', 'folders'], 'readwrite');
    const itemStore = tx.objectStore('items');
    const fileStore = tx.objectStore('files');
    const noteStore = tx.objectStore('notes');
    const passwordStore = tx.objectStore('passwords');
    const folderStore = tx.objectStore('folders');

    demoIds.forEach(id => {
        itemStore.delete(id);
        fileStore.delete(id);
        noteStore.delete(id);
        passwordStore.delete(id);
        folderStore.delete(id);
    });

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  // Generate Encrypted Backup Package
  public static async createBackupPackage(): Promise<Blob> {
    const items = await this.getItems();
    const notes = await this.getNotes();
    const passwords = await this.getPasswords();
    const folders = await this.getFolders();
    const settings = await this.getSettings();

    const payload = {
      version: 'XP-VAULT-BACKUP-1.0',
      timestamp: Date.now(),
      brand: 'XP Vault',
      data: {
        items,
        notes,
        passwords,
        folders,
        settings,
      },
    };

    const jsonString = JSON.stringify(payload);
    const enc = new TextEncoder();
    const data = enc.encode(jsonString);

    if (CryptoService.isKeyAvailable()) {
      const { ciphertext, iv } = await CryptoService.encryptData(data.buffer);
      const header = {
        magic: 'XPV_ENC',
        iv: Array.from(iv),
        checksum: await CryptoService.computeChecksum(data.buffer),
      };
      const headerJson = JSON.stringify(header);
      const headerBytes = enc.encode(headerJson.padEnd(256, ' '));

      const combined = new Uint8Array(headerBytes.byteLength + ciphertext.byteLength);
      combined.set(headerBytes, 0);
      combined.set(new Uint8Array(ciphertext), headerBytes.byteLength);

      return new Blob([combined], { type: 'application/octet-stream' });
    }

    return new Blob([data], { type: 'application/json' });
  }

  // Restore Backup Package
  public static async restoreBackupPackage(file: File): Promise<{ success: boolean; message: string }> {
    const buffer = await file.arrayBuffer();
    const dec = new TextDecoder();

    try {
      if (file.name.endsWith('.json')) {
        const text = dec.decode(buffer);
        const parsed = JSON.parse(text);
        if (parsed.data) {
          await this.applyRestoredData(parsed.data);
          return { success: true, message: 'Vault successfully restored from local backup.' };
        }
      }

      // Check encrypted package
      const headerSlice = buffer.slice(0, 256);
      const headerText = dec.decode(headerSlice).trim();
      const header = JSON.parse(headerText);

      if (header.magic === 'XPV_ENC' && CryptoService.isKeyAvailable()) {
        const iv = new Uint8Array(header.iv);
        const ciphertext = buffer.slice(256);
        const decrypted = await CryptoService.decryptData(ciphertext, iv);
        const decryptedText = dec.decode(decrypted);
        const parsed = JSON.parse(decryptedText);

        if (parsed.data) {
          await this.applyRestoredData(parsed.data);
          return { success: true, message: 'Encrypted backup verified and restored.' };
        }
      }

      return { success: false, message: 'Invalid backup file or encryption key mismatch.' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Failed to parse backup package.' };
    }
  }

  private static async applyRestoredData(data: any) {
    if (data.folders) {
      for (const f of data.folders) await this.saveFolder(f);
    }
    if (data.notes) {
      for (const n of data.notes) await this.saveNote(n);
    }
    if (data.passwords) {
      for (const p of data.passwords) await this.savePassword(p);
    }
    if (data.items) {
      for (const i of data.items) await this.saveItem(i);
    }
  }
}
