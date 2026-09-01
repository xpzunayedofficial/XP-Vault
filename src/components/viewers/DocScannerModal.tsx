import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Camera,
  RotateCw,
  Check,
  Sparkles,
  Sliders,
  FileText,
  Shield,
  Layers,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { OcrService } from '../../services/ocr';

interface DocScannerModalProps {
  onClose: () => void;
}

export const DocScannerModal: React.FC<DocScannerModalProps> = ({ onClose }) => {
  const { addScannedDocument, showToast } = useVault();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'original' | 'enhanced' | 'bw'>('enhanced');
  const [docName, setDocName] = useState<string>(`Scan_${new Date().toISOString().slice(0, 10)}`);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Start live camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      } catch (err: any) {
        console.warn('Camera access not granted or unavailable, enabling fallback snapshot generator', err);
        setCameraError('Camera access not available in sandbox. You can generate a mock document scan or select a photo.');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
      }
    } else {
      // Fallback synthetic scan generator
      handleFallbackCapture();
    }
  };

  const handleFallbackCapture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#3157D5';
      ctx.fillRect(80, 80, 240, 60);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('XP SECURE', 100, 122);

      ctx.fillStyle = '#15171A';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText('CONFIDENTIAL DOCUMENT', 80, 260);

      ctx.fillStyle = '#737982';
      ctx.font = '24px monospace';
      ctx.fillText(`SERIAL: XP-SCAN-${Date.now().toString().slice(-6)}`, 80, 310);
      ctx.fillText(`DATE: ${new Date().toLocaleDateString()}`, 80, 350);

      ctx.strokeStyle = '#E7E9ED';
      ctx.lineWidth = 4;
      ctx.strokeRect(80, 400, 1040, 900);

      ctx.fillStyle = '#15171A';
      ctx.font = '22px sans-serif';
      ctx.fillText('This document is securely scanned and encrypted with AES-GCM-256.', 120, 480);
      ctx.fillText('Client-side zero-knowledge edge detection and OCR applied.', 120, 530);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
    }
  };

  const handleSaveToVault = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    try {
      const img = new Image();
      img.src = capturedImage;
      await new Promise((res) => (img.onload = res));

      // Apply selected filter
      const processedUrl = await OcrService.processScannedImage(img, filterMode);
      const ocrText = OcrService.extractSampleText(docName, 'application/pdf');

      await addScannedDocument(processedUrl, docName, ocrText);
      showToast('Document encrypted & saved to Vault');
      onClose();
    } catch (e) {
      console.error(e);
      showToast('Failed to process scan');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between text-white animate-in fade-in duration-200 select-none">
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Controls */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h3 className="text-xs font-bold uppercase tracking-wider">Document Scanner</h3>
          <p className="text-[10px] text-white/70">Edge Detection & Perspective Crop</p>
        </div>

        <div className="w-9" />
      </div>

      {/* Camera / Preview Viewport */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black p-4">
        {!capturedImage ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {stream ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover rounded-2xl"
                autoPlay
                playsInline
                muted
              />
            ) : (
              <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/10 max-w-xs">
                <FileText className="w-12 h-12 text-[#3157D5] mx-auto mb-3" />
                <h4 className="text-sm font-bold mb-1">Document Capture Ready</h4>
                <p className="text-xs text-white/70 mb-4">
                  Point camera at document to auto-detect corners and enhance contrast.
                </p>
                <button
                  onClick={handleFallbackCapture}
                  className="px-4 py-2.5 rounded-xl bg-[#3157D5] text-white text-xs font-bold shadow-md hover:bg-[#2847B5]"
                >
                  Generate Test Scan
                </button>
              </div>
            )}

            {/* Edge Detection Overlay Guide */}
            <div className="absolute inset-8 border-2 border-[#3157D5] rounded-xl pointer-events-none flex flex-col justify-between p-3 opacity-80">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-3 border-l-3 border-white"></div>
                <div className="w-4 h-4 border-t-3 border-r-3 border-white"></div>
              </div>
              <div className="text-center">
                <span className="text-[10px] bg-black/60 px-2.5 py-1 rounded-full text-white/90 font-mono">
                  ALIGN DOCUMENT EDGES
                </span>
              </div>
              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-3 border-l-3 border-white"></div>
                <div className="w-4 h-4 border-b-3 border-r-3 border-white"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <img
              src={capturedImage}
              alt="Scan preview"
              className={`max-h-[65vh] max-w-full rounded-xl object-contain shadow-2xl transition-all ${
                filterMode === 'bw' ? 'contrast-150 grayscale' : filterMode === 'enhanced' ? 'contrast-125' : ''
              }`}
            />
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="p-4 bg-gradient-to-t from-black/90 to-transparent space-y-3 z-10">
        {!capturedImage ? (
          <div className="flex items-center justify-center pb-2">
            <button
              onClick={handleCapture}
              className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center bg-white/20 hover:bg-white/40 active:scale-95 transition-all shadow-xl"
              title="Capture Document"
            >
              <div className="w-13 h-13 rounded-full bg-white" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Filter Toggle */}
            <div className="flex items-center justify-center gap-2">
              {(['enhanced', 'bw', 'original'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                    filterMode === mode
                      ? 'bg-[#3157D5] text-white shadow-xs'
                      : 'bg-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  {mode === 'enhanced' ? 'Enhanced' : mode === 'bw' ? 'B&W Doc' : 'Original'}
                </button>
              ))}
            </div>

            {/* Document Name input & Save */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white placeholder-white/50 focus:outline-none focus:border-[#3157D5]"
                placeholder="Document name"
              />
              <button
                onClick={() => setCapturedImage(null)}
                className="p-2.5 rounded-xl bg-white/10 text-white/80 hover:text-white"
                title="Retake"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                disabled={isProcessing}
                onClick={handleSaveToVault}
                className="px-5 py-2.5 rounded-xl bg-[#3157D5] text-white font-bold text-xs shadow-md hover:bg-[#2847B5] active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isProcessing ? 'Encrypting...' : 'Save to Vault'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
