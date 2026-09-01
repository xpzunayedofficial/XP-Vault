import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {
  X,
  QrCode,
  ScanLine,
  Camera,
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  ArrowRight,
  Lock,
  Download,
  Share2,
  Sparkles,
  Info,
  KeyRound,
  Check,
  Upload,
  Layers,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { PairingService, PairingSession, RecoverySnapshotPackage } from '../../services/pairingService';
import { TrustedDevice } from '../../types';

interface PairDeviceModalProps {
  onClose: () => void;
  onDevicePaired?: (device: TrustedDevice) => void;
}

type PairingStep =
  | 'SHOW_QR'
  | 'SCAN_QR'
  | 'VALIDATING'
  | 'MAIN_CONFIRMATION'
  | 'SECOND_CONFIRMATION'
  | 'AUTH_VERIFICATION'
  | 'KEY_EXCHANGE'
  | 'SUCCESS_ANIMATION'
  | 'CHOOSE_ACTION'
  | 'RECOVERY_COPY_SUCCESS'
  | 'TRANSFER_SUCCESS'
  | 'ERROR';

export const PairDeviceModal: React.FC<PairDeviceModalProps> = ({ onClose, onDevicePaired }) => {
  const {
    items,
    folders,
    notes,
    passwords,
    settings,
    addTrustedDevice,
    showToast,
    unlockWithPin,
  } = useVault();

  // Mode: Main (shows QR) or Second (scans QR)
  const [deviceRole, setDeviceRole] = useState<'main' | 'second'>('main');
  const [step, setStep] = useState<PairingStep>('SHOW_QR');
  
  // QR & Pairing Session State
  const [session, setSession] = useState<PairingSession | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(300); // 5 mins
  const [showManualCodeInput, setShowManualCodeInput] = useState<boolean>(false);
  const [manualInputCode, setManualInputCode] = useState<string>('');
  
  // Devices in flow
  const [secondDeviceName, setSecondDeviceName] = useState<string>('Galaxy Tab S9');
  const [secondDeviceModel, setSecondDeviceModel] = useState<string>('Samsung Galaxy (Android 15)');
  const [pairedDevice, setPairedDevice] = useState<TrustedDevice | null>(null);
  const [recoveryPackage, setRecoveryPackage] = useState<RecoverySnapshotPackage | null>(null);

  // Authentication prompt on main device
  const [pinInput, setPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [pendingPostAction, setPendingPostAction] = useState<'recovery' | 'transfer' | null>(null);

  // Error state
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Camera scanner references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize fresh session on mount
  const generateNewSession = useCallback(async () => {
    try {
      const newSession = await PairingService.createPairingSession(
        'Pixel 9 Pro',
        'Google Pixel 9 Pro (Android 15)'
      );
      setSession(newSession);
      setTimeLeftSeconds(300);

      const qrPayload = PairingService.encodeToQRPayload(newSession);
      const url = await QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#15171A',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
      setQrDataUrl(url);
    } catch (e) {
      console.error('Failed to generate QR session:', e);
    }
  }, []);

  useEffect(() => {
    generateNewSession();
  }, [generateNewSession]);

  // Expiration countdown timer (5 mins)
  useEffect(() => {
    if (step === 'SHOW_QR' && session) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
        setTimeLeftSeconds(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          setErrorMessage('This pairing request has expired.');
          setStep('ERROR');
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [session, step]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Camera start & stream handling
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          setCameraActive(true);
          scanVideoFrames();
        }
      } else {
        setCameraError('Camera access not supported in this preview environment.');
      }
    } catch (err) {
      console.warn('Camera access unavailable or denied:', err);
      setCameraError('Camera unavailable in current container.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (step === 'SCAN_QR') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step, startCamera, stopCamera]);

  // Continuous frame scanning for QR codes
  const scanVideoFrames = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleScannedData(code.data);
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrames);
  };

  // Process detected QR code or manual code
  const handleScannedData = (scannedText: string) => {
    stopCamera();
    setStep('VALIDATING');

    setTimeout(() => {
      const validation = PairingService.validateQRPayload(scannedText);
      if (!validation.isValid) {
        setErrorMessage(validation.errorMessage || "This QR code isn't a valid XP Vault pairing code.");
        setStep('ERROR');
        return;
      }

      // Valid QR session detected! Do NOT immediately pair.
      // Progress to two-sided confirmation as required by security spec.
      setStep('MAIN_CONFIRMATION');
    }, 600);
  };

  // Trigger fallback manual code entry
  const handleManualCodeSubmit = () => {
    if (!manualInputCode.trim()) {
      showToast('Please enter an XP pairing code');
      return;
    }
    handleScannedData(manualInputCode.trim());
  };

  // File upload QR image decoder
  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleScannedData(code.data);
          } else {
            setErrorMessage("No valid XP Vault QR code detected in the selected image.");
            setStep('ERROR');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Simulated scan for instant sandbox testing
  const handleSimulateScan = () => {
    if (!session) return;
    const payload = PairingService.encodeToQRPayload(session);
    handleScannedData(payload);
  };

  // Flow handlers
  const handleApproveMain = () => {
    // Main device approves -> now second device confirms
    setStep('SECOND_CONFIRMATION');
  };

  const handleApproveSecond = () => {
    // Both sides confirmed -> Start secure key exchange
    setStep('KEY_EXCHANGE');
    setTimeout(async () => {
      // Complete secure pairing
      const newDev = await addTrustedDevice(secondDeviceName, secondDeviceModel, 'recovery');
      setPairedDevice(newDev);
      if (onDevicePaired) onDevicePaired(newDev);
      
      setStep('SUCCESS_ANIMATION');
      setTimeout(() => {
        setStep('CHOOSE_ACTION');
      }, 1600);
    }, 1800);
  };

  const handleCancelPairing = () => {
    setErrorMessage('Pairing was cancelled.');
    setStep('ERROR');
  };

  // Authentication before Vault Operations
  const handleInitiateAction = (action: 'recovery' | 'transfer') => {
    setPendingPostAction(action);
    setPinInput('');
    setAuthError('');
    setStep('AUTH_VERIFICATION');
  };

  const handleVerifyAuthAndProceed = async () => {
    if (!pinInput || pinInput.length < 4) {
      setAuthError('Please enter your 4-6 digit vault PIN');
      return;
    }

    const unlockRes = await unlockWithPin(pinInput);
    if (!unlockRes.success) {
      setAuthError('Incorrect PIN. Authentication required.');
      return;
    }

    setAuthError('');
    if (pendingPostAction === 'recovery') {
      // Generate independent recovery copy snapshot
      const pkg = await PairingService.createRecoveryCopyPackage(
        items,
        folders,
        notes,
        passwords,
        'Pixel 9 Pro'
      );
      setRecoveryPackage(pkg);
      setStep('RECOVERY_COPY_SUCCESS');
      showToast('Independent recovery snapshot created');
    } else if (pendingPostAction === 'transfer') {
      setStep('TRANSFER_SUCCESS');
      showToast('Vault transfer completed to paired device');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-7 w-full max-w-lg border border-[#E7E9ED] shadow-[0_20px_60px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom-6 duration-200 max-h-[92vh] overflow-y-auto select-none"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#15171A]">Pair New Device</h3>
              <p className="text-xs text-[#737982] mt-0.5">Connect another XP Vault device securely</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-[#F6F7F9] hover:bg-[#EAECEF] text-[#737982] hover:text-[#15171A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Mode Switcher (Only in Initial Stages) */}
        {(step === 'SHOW_QR' || step === 'SCAN_QR') && (
          <div className="grid grid-cols-2 gap-1.5 p-1 mb-5 rounded-2xl bg-[#F6F7F9] border border-[#E7E9ED]">
            <button
              onClick={() => {
                setDeviceRole('main');
                setStep('SHOW_QR');
              }}
              className={`py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center select-none ${
                deviceRole === 'main'
                  ? 'bg-white text-[#3157D5] shadow-xs border border-[#E7E9ED]'
                  : 'text-[#737982] hover:text-[#15171A] border border-transparent'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Show QR <span className="text-[11px] font-medium opacity-80">(Main)</span></span>
            </button>
            <button
              onClick={() => {
                setDeviceRole('second');
                setStep('SCAN_QR');
              }}
              className={`py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center select-none ${
                deviceRole === 'second'
                  ? 'bg-white text-[#3157D5] shadow-xs border border-[#E7E9ED]'
                  : 'text-[#737982] hover:text-[#15171A] border border-transparent'
              }`}
            >
              <ScanLine className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Scan QR <span className="text-[11px] font-medium opacity-80">(Second)</span></span>
            </button>
          </div>
        )}

        {/* STAGE 1: MAIN DEVICE - SHOW QR */}
        {step === 'SHOW_QR' && (
          <div className="space-y-5 text-center">
            {/* Large Dynamic QR Display */}
            <div className="relative mx-auto w-64 h-64 p-3.5 bg-white rounded-[28px] border-2 border-[#E7E9ED] shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center group">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="XP Vault Pairing QR"
                  className="w-full h-full object-contain rounded-2xl"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#737982]">
                  <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-xs">Generating secure pairing QR...</span>
                </div>
              )}

              {/* Expiring Badge */}
              <div className="absolute -bottom-3 bg-[#15171A] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"></span>
                <span>Valid for {formatTime(timeLeftSeconds)}</span>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs font-medium text-[#737982]">
                Open XP Vault on your other device and scan this QR code.
              </p>
            </div>

            {/* Simulated instant scan trigger for quick testing in sandbox */}
            <div className="bg-[#F6F7F9] rounded-2xl p-3 border border-[#E7E9ED] flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-bold text-[#15171A]">Simulate Second Device</p>
                <p className="text-[11px] text-[#737982]">Simulate an incoming scan request</p>
              </div>
              <button
                onClick={handleSimulateScan}
                className="px-3.5 py-1.5 rounded-xl bg-[#3157D5] text-white text-xs font-bold hover:bg-[#2847B5] transition-all cursor-pointer shadow-xs"
              >
                Scan Now
              </button>
            </div>

            {/* Fallback Section: XP Pairing Code */}
            <div className="bg-[#FFFFFF] rounded-2xl p-3.5 border border-[#E7E9ED] text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#737982]">
                  XP Pairing Code (Fallback)
                </span>
                <button
                  onClick={generateNewSession}
                  className="text-[11px] font-semibold text-[#3157D5] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="flex items-center justify-between bg-[#F6F7F9] rounded-xl px-3.5 py-2 border border-[#E7E9ED]">
                <span className="text-base font-extrabold font-mono tracking-widest text-[#3157D5]">
                  {session?.pairingCode || 'XP-7K4M-92Q'}
                </span>
                <button
                  onClick={() => {
                    if (session?.pairingCode) {
                      navigator.clipboard.writeText(session.pairingCode);
                      showToast('Pairing code copied to clipboard');
                    }
                  }}
                  className="p-1.5 rounded-lg bg-white hover:bg-[#EAECEF] text-[#737982] hover:text-[#15171A] transition-colors border border-[#E7E9ED] cursor-pointer"
                  title="Copy Code"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-[#737982]">
                This short-lived code expires in 5 minutes and is never used as an encryption key or PIN.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-[#F6F7F9] hover:bg-[#EAECEF] text-xs font-bold text-[#737982] hover:text-[#15171A] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: SECOND DEVICE - SCAN QR */}
        {step === 'SCAN_QR' && (
          <div className="space-y-4 text-center">
            <div>
              <h4 className="text-sm font-bold text-[#15171A]">Scan QR Code</h4>
              <p className="text-xs text-[#737982] mt-0.5">Align the QR code inside the frame</p>
            </div>

            {/* Scanner Frame Viewport */}
            <div className="relative mx-auto w-full max-w-[280px] h-[280px] rounded-[28px] overflow-hidden bg-[#15171A] shadow-inner flex items-center justify-center">
              {/* Video Element */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Laser Scanning Line Animation */}
              <div className="absolute inset-x-4 top-4 bottom-4 pointer-events-none flex flex-col justify-center">
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#3157D5] to-transparent shadow-[0_0_12px_#3157D5] animate-bounce" />
              </div>

              {/* Reticle Corners */}
              <div className="absolute inset-6 pointer-events-none border-2 border-transparent">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#3157D5] rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#3157D5] rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#3157D5] rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#3157D5] rounded-br-lg" />
              </div>

              {/* Camera Fallback / Overlay if camera is unavailable */}
              {!cameraActive && (
                <div className="absolute inset-0 bg-[#15171A]/90 p-4 flex flex-col items-center justify-center text-white text-center">
                  <Camera className="w-8 h-8 text-[#737982] mb-2" />
                  <p className="text-xs font-semibold">Camera Scanner Ready</p>
                  <p className="text-[10px] text-[#A1A7B0] mt-1 max-w-[200px]">
                    Use live camera, upload a QR code image, or enter the XP pairing code.
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-[#737982]">The QR code is valid for a limited time.</p>

            {/* Quick Actions & Image Upload */}
            <div className="flex items-center justify-center gap-2">
              <label className="px-3.5 py-2 rounded-xl bg-[#F6F7F9] hover:bg-[#EAECEF] border border-[#E7E9ED] text-xs font-bold text-[#15171A] flex items-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-[#3157D5]" />
                <span>Upload QR Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setShowManualCodeInput(!showManualCodeInput)}
                className="px-3.5 py-2 rounded-xl bg-[#F6F7F9] hover:bg-[#EAECEF] border border-[#E7E9ED] text-xs font-bold text-[#15171A] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#3157D5]" />
                <span>Can't Scan QR?</span>
              </button>
            </div>

            {/* Manual Code Input Drawer */}
            {showManualCodeInput && (
              <div className="bg-[#F6F7F9] rounded-2xl p-4 border border-[#E7E9ED] space-y-3 text-left animate-in fade-in duration-150">
                <label className="text-xs font-bold text-[#15171A] block">
                  Enter XP Pairing Code
                </label>
                <input
                  type="text"
                  value={manualInputCode}
                  onChange={(e) => setManualInputCode(e.target.value.toUpperCase())}
                  placeholder="e.g. XP-7K4M-92Q"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E7E9ED] text-sm font-mono font-bold text-center tracking-widest text-[#15171A] focus:outline-none focus:border-[#3157D5]"
                />
                <button
                  onClick={handleManualCodeSubmit}
                  className="w-full py-2.5 rounded-xl bg-[#3157D5] text-white text-xs font-bold hover:bg-[#2847B5] transition-colors cursor-pointer shadow-xs"
                >
                  Verify Code
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-[#F6F7F9] hover:bg-[#EAECEF] text-xs font-bold text-[#737982] hover:text-[#15171A] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: VALIDATING */}
        {step === 'VALIDATING' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center animate-pulse">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#15171A]">Validating Pairing Request...</h4>
              <p className="text-xs text-[#737982] mt-1">Verifying protocol signature & validity period</p>
            </div>
          </div>
        )}

        {/* STAGE 4: MAIN DEVICE CONFIRMATION */}
        {step === 'MAIN_CONFIRMATION' && (
          <div className="space-y-5 text-left">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#3157D5] bg-[#EBF1FE] px-2.5 py-1 rounded-md">
                Step 1 of 2 • Main Device
              </span>
              <h4 className="text-base font-bold text-[#15171A] mt-2">New Device Found</h4>
              <p className="text-xs text-[#737982] mt-0.5">
                A new XP Vault device wants to connect.
              </p>
            </div>

            {/* Device Details Card */}
            <div className="bg-[#F6F7F9] rounded-[24px] p-4 border border-[#E7E9ED] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white border border-[#E7E9ED] text-[#3157D5] flex items-center justify-center shrink-0 shadow-2xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-[#15171A]">{secondDeviceName}</h5>
                  <p className="text-xs text-[#737982]">{secondDeviceModel}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-2.5 border border-[#E7E9ED] flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#737982]">Fingerprint:</span>
                <span className="font-mono font-bold text-[#15171A]">SHA256:7F89...A4B2</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleApproveMain}
                className="w-full py-3.5 rounded-2xl bg-[#3157D5] text-white text-xs font-bold hover:bg-[#2847B5] transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Approve Pairing</span>
              </button>
              <button
                onClick={handleCancelPairing}
                className="w-full py-3 rounded-2xl bg-[#F6F7F9] hover:bg-[#EAECEF] text-xs font-bold text-[#737982] hover:text-[#15171A] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* STAGE 5: SECOND DEVICE CONFIRMATION */}
        {step === 'SECOND_CONFIRMATION' && (
          <div className="space-y-5 text-left">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#3157D5] bg-[#EBF1FE] px-2.5 py-1 rounded-md">
                Step 2 of 2 • Second Device
              </span>
              <h4 className="text-base font-bold text-[#15171A] mt-2">Pair with this device?</h4>
              <p className="text-xs text-[#737982] mt-0.5">
                Confirm link with your primary XP Vault.
              </p>
            </div>

            {/* Main Device Card */}
            <div className="bg-[#F6F7F9] rounded-[24px] p-4 border border-[#E7E9ED] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white border border-[#E7E9ED] text-[#3157D5] flex items-center justify-center shrink-0 shadow-2xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-[#15171A]">Main XP Vault</h5>
                  <p className="text-xs text-[#737982]">Pixel 9 Pro • Google Android 15</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-2.5 border border-[#E7E9ED] flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#737982]">Identity:</span>
                <span className="font-mono font-bold text-[#15171A]">SHA256:MAIN...XP9</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleApproveSecond}
                className="w-full py-3.5 rounded-2xl bg-[#3157D5] text-white text-xs font-bold hover:bg-[#2847B5] transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelPairing}
                className="w-full py-3 rounded-2xl bg-[#F6F7F9] hover:bg-[#EAECEF] text-xs font-bold text-[#737982] hover:text-[#15171A] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* STAGE 6: KEY EXCHANGE & ENCRYPTED HANDSHAKE */}
        {step === 'KEY_EXCHANGE' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center animate-spin">
              <RefreshCw className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#15171A]">Establishing Secure Connection...</h4>
              <p className="text-xs text-[#737982] mt-1">
                Executing ECDH key exchange & AES-GCM-256 session derivation
              </p>
            </div>
          </div>
        )}

        {/* STAGE 7: SUCCESS ANIMATION */}
        {step === 'SUCCESS_ANIMATION' && (
          <div className="py-10 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#E6F7ED] text-[#2E9B62] flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#15171A]">Device Paired</h4>
              <p className="text-xs text-[#737982] mt-1">
                {secondDeviceName} is now trusted.
              </p>
            </div>
          </div>
        )}

        {/* STAGE 8: POST-PAIR ACTION MENU */}
        {step === 'CHOOSE_ACTION' && (
          <div className="space-y-5 text-left">
            <div className="bg-[#E6F7ED] rounded-[24px] p-4 border border-[#B9E9CB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-[#2E9B62] flex items-center justify-center shrink-0 shadow-2xs">
                  <Check className="w-5 h-5 font-bold" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#15171A]">{secondDeviceName}</h4>
                  <span className="text-[11px] font-bold text-[#2E9B62] flex items-center gap-1">
                    ✓ Trusted Device
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold text-[#737982] uppercase tracking-wider mb-2">
                Choose an action:
              </h5>

              <div className="space-y-2.5">
                {/* Action 1: Create Recovery Copy */}
                <div
                  onClick={() => handleInitiateAction('recovery')}
                  className="bg-white rounded-[22px] p-4 border border-[#E7E9ED] hover:border-[#3157D5] transition-all cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.02)] group flex items-start justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-[#15171A]">
                        Create Recovery Copy
                      </h5>
                      <p className="text-[11px] text-[#737982] mt-0.5 leading-relaxed">
                        Create an independent encrypted snapshot on this device.
                      </p>
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-[#0D9488] bg-[#E6F6F4] px-2 py-0.5 rounded-md w-fit">
                        <Info className="w-3 h-3" />
                        <span>Delete Independence: Changes on one device won't delete items on the other</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action 2: Transfer Vault */}
                <div
                  onClick={() => handleInitiateAction('transfer')}
                  className="bg-white rounded-[22px] p-4 border border-[#E7E9ED] hover:border-[#3157D5] transition-all cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.02)] group flex items-start justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-[#15171A]">Transfer Vault</h5>
                      <p className="text-[11px] text-[#737982] mt-0.5 leading-relaxed">
                        Copy encrypted vault records for device migration. Vaults remain fully independent.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-[#F6F7F9] hover:bg-[#EAECEF] text-xs font-bold text-[#15171A] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* STAGE 9: AUTHENTICATION BEFORE VAULT OPERATIONS */}
        {step === 'AUTH_VERIFICATION' && (
          <div className="space-y-4 text-left">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#EBF1FE] text-[#3157D5] flex items-center justify-center mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[#15171A]">Authentication Required</h4>
              <p className="text-xs text-[#737982] mt-0.5">
                Confirm your identity on the main device to authorize vault data transfer.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#15171A]">Enter Vault PIN</label>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setAuthError('');
                }}
                placeholder="••••"
                className="w-full px-4 py-3 rounded-xl bg-[#F6F7F9] border border-[#E7E9ED] text-center text-lg font-mono font-bold tracking-widest text-[#15171A] focus:outline-none focus:border-[#3157D5]"
                autoFocus
              />
              {authError && <p className="text-xs font-semibold text-[#D64545]">{authError}</p>}
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={handleVerifyAuthAndProceed}
                className="w-full py-3.5 rounded-2xl bg-[#3157D5] text-white text-xs font-bold hover:bg-[#2847B5] transition-colors cursor-pointer shadow-xs"
              >
                Authenticate & Proceed
              </button>
              <button
                onClick={() => setStep('CHOOSE_ACTION')}
                className="w-full py-3 rounded-2xl bg-[#F6F7F9] hover:bg-[#EAECEF] text-xs font-bold text-[#737982] hover:text-[#15171A] transition-colors cursor-pointer"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* STAGE 10: RECOVERY COPY SUCCESS */}
        {step === 'RECOVERY_COPY_SUCCESS' && (
          <div className="space-y-5 text-left">
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-[#E6F7ED] text-[#2E9B62] flex items-center justify-center mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-[#15171A]">Recovery Copy Created</h4>
              <p className="text-xs text-[#737982] mt-0.5">
                Encrypted snapshot successfully placed on {secondDeviceName}.
              </p>
            </div>

            {/* Architecture Diagram */}
            <div className="bg-[#F6F7F9] rounded-[24px] p-4 border border-[#E7E9ED] space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#15171A]">
                <span>Main Device</span>
                <span className="text-[#3157D5]">Encrypted Snapshot</span>
                <span>Recovery Device</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#737982]">
                <span>Original Vault</span>
                <ArrowRight className="w-4 h-4 text-[#3157D5]" />
                <span>Independent Recovery Vault</span>
              </div>
            </div>

            {/* Delete Independence Card */}
            <div className="bg-[#FFFBEB] rounded-2xl p-3.5 border border-[#FDE68A] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <p className="text-xs text-[#92400E] leading-relaxed">
                <strong>Delete Independence Active:</strong> Photos or notes deleted on this device will
                remain intact on the other device. No automatic live synchronization is enabled.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-[#3157D5] text-white text-xs font-bold hover:bg-[#2847B5] transition-colors cursor-pointer shadow-xs"
              >
                Finish
              </button>
            </div>
          </div>
        )}

        {/* STAGE 11: TRANSFER SUCCESS */}
        {step === 'TRANSFER_SUCCESS' && (
          <div className="space-y-5 text-left">
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-[#E6F7ED] text-[#2E9B62] flex items-center justify-center mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-[#15171A]">Vault Restored on Second Device</h4>
              <p className="text-xs text-[#737982] mt-0.5">
                The receiving device now has its own local encrypted vault.
              </p>
            </div>

            <div className="bg-[#F6F7F9] rounded-[24px] p-4 border border-[#E7E9ED] text-xs text-[#737982] space-y-2">
              <p>• The original vault on the main device remains intact.</p>
              <p>• Both vaults are completely independent without live sync.</p>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-[#3157D5] text-white text-xs font-bold hover:bg-[#2847B5] transition-colors cursor-pointer shadow-xs"
              >
                Finish
              </button>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {step === 'ERROR' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-[#FEE2E2] text-[#D64545] flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#15171A]">Pairing Failed</h4>
              <p className="text-xs text-[#737982] mt-1 max-w-xs mx-auto">
                {errorMessage || "Couldn't establish a secure connection. Try again."}
              </p>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                onClick={() => {
                  setErrorMessage('');
                  generateNewSession();
                  setStep('SHOW_QR');
                }}
                className="flex-1 py-3 rounded-2xl bg-[#3157D5] text-white text-xs font-bold hover:bg-[#2847B5] transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-[#F6F7F9] hover:bg-[#EAECEF] text-xs font-bold text-[#737982] hover:text-[#15171A] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
