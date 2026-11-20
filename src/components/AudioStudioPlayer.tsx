import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  Pause,
  Play,
  Square,
  Volume2,
  VolumeX,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { formatDurationSeconds, triggerFileDownload } from '../utils/thaiFormat';

interface AudioStudioPlayerProps {
  audioUrl: string;
  fileName: string;
  estimatedDuration?: number;
  isMock?: boolean;
  scriptText?: string;
  compact?: boolean;
  activeAudioId?: string | null;
  playerId?: string;
  onPlayStart?: (id: string) => void;
}

export const AudioStudioPlayer: React.FC<AudioStudioPlayerProps> = ({
  audioUrl,
  fileName,
  estimatedDuration = 0,
  isMock = false,
  scriptText,
  compact = false,
  activeAudioId,
  playerId = 'default',
  onPlayStart,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSpeakingTTS, setIsSpeakingTTS] = useState(false);

  const supportsSpeechSynthesis =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Pause this player if another player in the Audio Library starts playing
  useEffect(() => {
    if (activeAudioId && activeAudioId !== playerId && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  }, [activeAudioId, playerId, isPlaying]);

  // Reset player state when audioUrl changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioError(null);
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [audioUrl]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (supportsSpeechSynthesis && isSpeakingTTS) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supportsSpeechSynthesis, isSpeakingTTS]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      setAudioError(null);
      if (supportsSpeechSynthesis && isSpeakingTTS) {
        window.speechSynthesis.cancel();
        setIsSpeakingTTS(false);
      }
      onPlayStart?.(playerId);
      await audio.play();
      setIsPlaying(true);
    } catch {
      setAudioError('ไม่สามารถเล่นไฟล์เสียงนี้ได้ กรุณาตรวจสอบไฟล์เสียงหรือลองดาวน์โหลด');
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    audioRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await triggerFileDownload(audioUrl, fileName);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleToggleSpeechPreview = () => {
    if (!supportsSpeechSynthesis || !scriptText) return;

    if (isSpeakingTTS) {
      window.speechSynthesis.cancel();
      setIsSpeakingTTS(false);
      return;
    }

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(scriptText);
    utterance.lang = 'th-TH';
    utterance.rate = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find((v) => v.lang.toLowerCase().includes('th'));
    if (thaiVoice) {
      utterance.voice = thaiVoice;
    }

    utterance.onend = () => setIsSpeakingTTS(false);
    utterance.onerror = () => setIsSpeakingTTS(false);

    setIsSpeakingTTS(true);
    window.speechSynthesis.speak(utterance);
  };

  const effectiveDuration = duration > 0 && Number.isFinite(duration) ? duration : 0;
  const progressPercent =
    effectiveDuration > 0 ? Math.min(100, (currentTime / effectiveDuration) * 100) : 0;

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white ${
        compact ? 'p-3.5' : 'p-5'
      }`}
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          if (Number.isFinite(el.duration)) {
            setDuration(el.duration);
          }
        }}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          setAudioError('ไม่พบไฟล์เสียงหรือไม่สามารถโหลดไฟล์เสียงได้');
          setIsPlaying(false);
        }}
      />

      {/* File header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{fileName}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span className="tabular-nums">
              ระยะเวลาเสียงจริง {formatDurationSeconds(effectiveDuration)}
            </span>
            {estimatedDuration > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  ความยาวสคริปต์ ~{formatDurationSeconds(estimatedDuration)}
                </span>
              </>
            )}
            {isMock && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700 font-medium">
                  เสียงจำลองสำหรับทดสอบระบบ (Mock Audio)
                </span>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isDownloading ? 'กำลังเตรียมไฟล์...' : 'ดาวน์โหลดไฟล์เสียง'}</span>
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 pt-3">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'หยุดเล่นเสียง' : 'เล่นเสียง'}
          className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors shrink-0"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={effectiveDuration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              aria-label="แถบเลื่อนตำแหน่งเสียง"
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
              style={{
                background: `linear-gradient(to right, #1d4ed8 ${progressPercent}%, #e2e8f0 ${progressPercent}%)`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500 mt-1">
            <span>{formatDurationSeconds(currentTime)}</span>
            <span>{formatDurationSeconds(effectiveDuration)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
          className="w-9 h-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Optional Browser TTS Read-Aloud Helper in Mock Mode */}
      {isMock && scriptText && supportsSpeechSynthesis && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              ไฟล์เสียงข้างต้นเป็นสัญญาณเสียงตัวอย่างใน Mock Mode (สามารถลองฟังเสียงอ่านข้อความผ่านเบราว์เซอร์ได้)
            </span>
          </p>
          <button
            type="button"
            onClick={handleToggleSpeechPreview}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
              isSpeakingTTS
                ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isSpeakingTTS ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span>หยุดอ่านออกเสียง</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>ทดลองฟังเสียงอ่าน (Browser TTS)</span>
              </>
            )}
          </button>
        </div>
      )}

      {audioError && (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{audioError}</span>
        </div>
      )}
    </div>
  );
};
