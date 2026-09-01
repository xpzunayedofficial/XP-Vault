import React, { useRef, useState } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Download,
  Trash2,
  Shield,
  Star,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { VaultItem } from '../../types';

interface VideoPlayerProps {
  item: VaultItem;
  onClose: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ item, onClose }) => {
  const { toggleFavoriteItem, deleteItem, showToast } = useVault();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const handleError = () => {
    setError('This media source is unavailable or decryption failed.');
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleExport = () => {
    if (item.dataUrl) {
      const a = document.createElement('a');
      a.href = item.dataUrl;
      a.download = item.name;
      a.click();
      showToast('Exported decrypted video');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between text-white animate-in fade-in duration-200 select-none">
      {/* Top Controls */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center min-w-0 px-2">
          <p className="text-xs font-bold truncate">{item.name}</p>
          <p className="text-[10px] text-white/70">Encrypted Stream • AES-GCM</p>
        </div>

        <button
          onClick={() => toggleFavoriteItem(item.id)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-[#F59E0B]"
        >
          <Star className={`w-5 h-5 ${item.isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Video Surface */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden" onClick={error ? undefined : togglePlay}>
        {error ? (
          <div className="flex flex-col items-center gap-4 text-center p-8 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
              <Shield className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Playback Error</p>
              <p className="text-xs text-white/50 max-w-[240px]">
                Unable to decrypt or load this secure media. The encryption keys may have changed.
              </p>
            </div>
            <button 
              onClick={onClose}
              className="mt-2 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all"
            >
              Close Viewer
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={item.dataUrl || item.thumbnailUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              onError={handleError}
              className="max-h-full max-w-full"
              playsInline
              muted={isMuted}
            />

            {/* Center Play/Pause Overlay Icon */}
            {!isPlaying && (
              <div className="absolute w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center pointer-events-none shadow-xl">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Video Scrubbing Bar & Controls */}
      <div className="p-4 bg-gradient-to-t from-black/90 to-transparent space-y-3 z-10">
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-white/70">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-[#3157D5] cursor-pointer h-1.5 bg-white/20 rounded-lg"
          />
          <span className="text-[11px] font-mono text-white/70">{formatTime(duration)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="p-2 text-white hover:text-white/80">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="p-2 text-white/80 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleExport} className="p-2 text-white/80 hover:text-white cursor-pointer" title="Export">
              <Download className="w-5 h-5" />
            </button>

            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-red-500/40 animate-in fade-in">
                <span className="text-[10px] text-[#FCA5A5] font-semibold">Trash?</span>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await deleteItem(item.id);
                    onClose();
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-[#D64545] hover:bg-[#B91C1C] text-white font-bold cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-[#D64545] hover:text-[#EF4444] cursor-pointer"
                title="Trash"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
