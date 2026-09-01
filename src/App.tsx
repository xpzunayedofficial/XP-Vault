import React from 'react';
import { VaultProvider, useVault } from './context/VaultContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { Toast } from './components/common/Toast';
import { FirstLaunchIntro } from './components/auth/FirstLaunchIntro';
import { LockScreen } from './components/auth/LockScreen';
import { EmergencyPrivacyScreen } from './components/auth/EmergencyPrivacyScreen';
import { HomeScreen } from './components/home/HomeScreen';
import { VaultScreen } from './components/vault/VaultScreen';
import { SearchScreen } from './components/search/SearchScreen';
import { SecurityDashboard } from './components/security/SecurityDashboard';
import { SettingsScreen } from './components/settings/SettingsScreen';

// Viewers & Modals
import { PhotoViewer } from './components/viewers/PhotoViewer';
import { VideoPlayer } from './components/viewers/VideoPlayer';
import { PdfViewer } from './components/viewers/PdfViewer';
import { DocScannerModal } from './components/viewers/DocScannerModal';
import { NotesEditor } from './components/notes/NotesEditor';
import { PasswordVault } from './components/passwords/PasswordVault';
import { AddActionModal } from './components/common/AddActionModal';
import { LockCenterModal } from './components/settings/LockCenterModal';
import { BackupModal } from './components/settings/BackupModal';
import { TransferModal } from './components/settings/TransferModal';
import { HiddenGestureModal } from './components/settings/HiddenGestureModal';
import { TrustedDevicesModal } from './components/settings/TrustedDevicesModal';
import { TrashModal } from './components/settings/TrashModal';
import { FolderModal } from './components/settings/FolderModal';

const VaultMainApp: React.FC = () => {
  const {
    isInitialized,
    isLocked,
    isEmergencyPrivacyActive,
    activeTab,
    activeModal,
    setActiveModal,
    selectedItem,
    setSelectedItem,
    selectedNote,
    setSelectedNote,
    selectedPassword,
    setSelectedPassword,
  } = useVault();

  // 1. If First Launch
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#F6F7F9] font-sans antialiased text-[#15171A]">
        <FirstLaunchIntro />
        <Toast />
      </div>
    );
  }

  // 2. If Emergency Privacy Screen is active
  if (isEmergencyPrivacyActive) {
    return (
      <div className="min-h-screen bg-[#F6F7F9] font-sans antialiased text-[#15171A]">
        <EmergencyPrivacyScreen />
        <Toast />
      </div>
    );
  }

  // 3. If Vault is Locked
  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#F6F7F9] font-sans antialiased text-[#15171A]">
        <LockScreen />
        <Toast />
      </div>
    );
  }

  // 4. Main Unlocked Vault App
  return (
    <div className="min-h-screen bg-[#F6F7F9] font-sans antialiased text-[#15171A] flex flex-col justify-between">
      {/* Top Header */}
      <Header />

      {/* Main Tab Screen */}
      <main className="flex-1">
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'vault' && <VaultScreen />}
        {activeTab === 'search' && <SearchScreen />}
        {activeTab === 'security' && <SecurityDashboard />}
        {activeTab === 'settings' && <SettingsScreen />}
      </main>

      {/* Bottom Floating Navigation */}
      <BottomNav />

      {/* Item Viewers & Editors */}
      {selectedItem && console.log('Selected item:', selectedItem.name, 'type:', selectedItem.type)}
      {selectedItem && selectedItem.type === 'photo' && (
        <PhotoViewer item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
      {selectedItem && selectedItem.type === 'video' && (
        <VideoPlayer item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
      {selectedItem && (selectedItem.type === 'document' || selectedItem.type === 'pdf' || selectedItem.type === 'audio' || selectedItem.type === 'other') && (
        <PdfViewer item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {selectedNote !== null && (
        <NotesEditor
          note={selectedNote.id ? selectedNote : null}
          onClose={() => setSelectedNote(null)}
        />
      )}

      {selectedPassword !== null && (
        <PasswordVault
          entry={selectedPassword.id ? selectedPassword : null}
          onClose={() => setSelectedPassword(null)}
        />
      )}

      {/* Modals */}
      {activeModal === 'add' && <AddActionModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'docScanner' && <DocScannerModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'lockCenter' && <LockCenterModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'backup' && <BackupModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'transfer' && <TransferModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'hiddenGesture' && <HiddenGestureModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'trustedDevices' && <TrustedDevicesModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'trash' && <TrashModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'folderCreate' && <FolderModal onClose={() => setActiveModal(null)} />}

      {/* Toast Notification Container */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <VaultProvider>
      <VaultMainApp />
    </VaultProvider>
  );
}
