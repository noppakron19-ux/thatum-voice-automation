import React, { useState } from 'react';
import {
  Check,
  Copy,
  Edit3,
  ExternalLink,
  FileText,
  X,
} from 'lucide-react';
import { AudioItem, NewsItem } from '../types/pr';
import { formatThaiShortDateTime } from '../utils/thaiFormat';
import { AudioStudioPlayer } from './AudioStudioPlayer';

interface NewsDetailModalProps {
  news: NewsItem | null;
  audioItem?: AudioItem;
  onClose: () => void;
  onOpenInEditor: (news: NewsItem) => void;
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({
  news,
  audioItem,
  onClose,
  onOpenInEditor,
}) => {
  const [copied, setCopied] = useState(false);

  if (!news) return null;

  const handleCopyScript = async () => {
    if (!news.script) return;
    try {
      await navigator.clipboard.writeText(news.script);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored cleanly
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="news-detail-title"
    >
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{news.category}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                สร้างเมื่อ {formatThaiShortDateTime(news.createdAt)}
              </span>
              {news.isSample && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-700 font-medium">ข้อมูลตัวอย่างเริ่มต้น</span>
                </>
              )}
            </div>
            <h2
              id="news-detail-title"
              className="font-display text-lg font-bold text-slate-900 mt-1"
            >
              {news.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Source Info */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>ข้อมูลต้นฉบับ ({news.sourceType === 'facebook_url' ? 'Facebook Link' : 'วางข้อความเอง'})</span>
            </h3>
            {news.sourceUrl && (
              <div className="mb-2 flex items-center gap-2 text-xs text-blue-700 break-all">
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>{news.sourceUrl}</span>
              </div>
            )}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
              {news.sourceText || 'ไม่ได้ระบุข้อความต้นฉบับ'}
            </div>
          </div>

          {/* Script Content */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-semibold text-slate-500">
                สคริปต์อ่านออกเสียง (สถานีกระจายเสียง อบต.ท่าตูม)
              </h3>
              {news.script && (
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกสคริปต์</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="p-4 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {news.script || 'ยังไม่มีสคริปต์สำหรับข่าวนี้'}
            </div>
          </div>

          {/* Audio Player */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 mb-2">
              ไฟล์เสียงประกาศ
            </h3>
            {audioItem ? (
              <AudioStudioPlayer
                audioUrl={audioItem.audioUrl}
                fileName={audioItem.fileName}
                estimatedDuration={audioItem.durationSeconds}
                isMock={audioItem.isMock}
                scriptText={news.script}
                compact
                playerId={`modal-${audioItem.id}`}
              />
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
                <span>ยังไม่ได้สร้างไฟล์เสียงสำหรับข่าวนี้</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenInEditor(news);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-800 transition-colors"
                >
                  ไปสร้างไฟล์เสียง
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenInEditor(news);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>เปิดแก้ไขในหน้าสร้างข่าว</span>
          </button>
        </div>
      </div>
    </div>
  );
};
