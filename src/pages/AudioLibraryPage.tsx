import React, { useMemo, useState } from 'react';
import {
  FileAudio,
  FilePlus2,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  Download,
} from 'lucide-react';
import { AudioStudioPlayer } from '../components/AudioStudioPlayer';
import { AudioItem, NewsItem, PageId } from '../types/pr';
import {
  formatDurationSeconds,
  formatThaiShortDateTime,
  getSpeedLabel,
  getVoiceLabel,
  toLocalDateInputValue,
  triggerFileDownload,
} from '../utils/thaiFormat';

interface AudioLibraryPageProps {
  audioItems: AudioItem[];
  newsItems: NewsItem[];
  onNavigate: (page: PageId) => void;
}

export const AudioLibraryPage: React.FC<AudioLibraryPageProps> = ({
  audioItems,
  newsItems,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [voiceFilter, setVoiceFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);

  const newsScriptMap = useMemo(() => {
    const map = new Map<string, string>();
    newsItems.forEach((n) => map.set(n.id, n.script));
    return map;
  }, [newsItems]);

  const filteredAudios = useMemo(() => {
    return [...audioItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter((item) => {
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const match =
            item.fileName.toLowerCase().includes(q) ||
            item.newsTitle.toLowerCase().includes(q);
          if (!match) return false;
        }
        if (voiceFilter !== 'all' && item.voice !== voiceFilter) {
          return false;
        }
        if (dateFilter && toLocalDateInputValue(item.createdAt) !== dateFilter) {
          return false;
        }
        return true;
      });
  }, [audioItems, searchQuery, voiceFilter, dateFilter]);

  const hasFilters =
    Boolean(searchQuery.trim()) || voiceFilter !== 'all' || Boolean(dateFilter);

  const resetFilters = () => {
    setSearchQuery('');
    setVoiceFilter('all');
    setDateFilter('');
  };

  return (
    <div className="space-y-5">
      {/* Filter & View Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              คลังไฟล์เสียงประกาศ (เซสชันปัจจุบัน)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ทั้งหมด {audioItems.length} ไฟล์ · แสดงผล {filteredAudios.length} ไฟล์ (สามารถทดลองฟังและดาวน์โหลดลงเครื่องได้ทันที)
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center p-1 rounded-lg bg-slate-100">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                aria-label="มุมมองการ์ด"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-label="มุมมองตาราง"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('create-news')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 transition-colors whitespace-nowrap"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>สร้างไฟล์เสียงใหม่</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อไฟล์ หรือชื่อข่าว..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <select
            value={voiceFilter}
            onChange={(e) => setVoiceFilter(e.target.value)}
            aria-label="กรองตามเสียงผู้พูด"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          >
            <option value="all">เสียงผู้พูด: ทั้งหมด</option>
            <option value="female">เสียงผู้หญิง</option>
            <option value="male">เสียงผู้ชาย</option>
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="กรองตามวันที่สร้าง"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                title="ล้างตัวกรอง"
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredAudios.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <FileAudio className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-medium text-slate-700 mt-3">
            {audioItems.length === 0
              ? 'ยังไม่มีไฟล์เสียงในคลังของเซสชันนี้'
              : 'ไม่พบไฟล์เสียงที่ตรงกับเงื่อนไขการค้นหา'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {audioItems.length === 0
              ? 'ไปที่หน้าสร้างข่าวประชาสัมพันธ์เพื่อสร้างไฟล์เสียงประกาศแรก'
              : 'ลองล้างตัวกรองหรือค้นหาด้วยคำอื่น'}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างตัวกรอง</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('create-news')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>สร้างไฟล์เสียงใหม่</span>
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredAudios.map((audio) => (
            <div
              key={audio.id}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3.5"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="tabular-nums">
                    {formatThaiShortDateTime(audio.createdAt)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{getVoiceLabel(audio.voice)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{getSpeedLabel(audio.speed)}</span>
                </div>
                <h3 className="font-display text-base font-bold text-slate-900 mt-1 line-clamp-1">
                  {audio.newsTitle}
                </h3>
              </div>

              <AudioStudioPlayer
                audioUrl={audio.audioUrl}
                fileName={audio.fileName}
                estimatedDuration={audio.durationSeconds}
                isMock={audio.isMock}
                scriptText={newsScriptMap.get(audio.newsId)}
                compact
                playerId={audio.id}
                activeAudioId={activeAudioId}
                onPlayStart={(id) => setActiveAudioId(id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">ชื่อไฟล์</th>
                  <th className="py-3 px-4">ชื่อข่าว</th>
                  <th className="py-3 px-4 whitespace-nowrap">วันที่สร้าง</th>
                  <th className="py-3 px-4 whitespace-nowrap">ระยะเวลา</th>
                  <th className="py-3 px-4">เครื่องเล่นเสียง</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">ดาวน์โหลด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAudios.map((audio) => (
                  <tr key={audio.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono text-slate-900 whitespace-nowrap">
                      <div>{audio.fileName}</div>
                      {audio.isMock && (
                        <div className="text-[11px] font-sans text-amber-700 mt-0.5">
                          เสียงจำลอง (Mock)
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-sm font-medium text-slate-900 max-w-xs">
                      <div className="line-clamp-1">{audio.newsTitle}</div>
                      <div className="text-xs text-slate-500 font-normal mt-0.5">
                        {getVoiceLabel(audio.voice)} · {getSpeedLabel(audio.speed)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 tabular-nums whitespace-nowrap">
                      {formatThaiShortDateTime(audio.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 tabular-nums whitespace-nowrap">
                      {formatDurationSeconds(audio.durationSeconds)}
                    </td>
                    <td className="py-3.5 px-4 min-w-[240px]">
                      <audio
                        controls
                        src={audio.audioUrl}
                        className="h-8 w-full max-w-[260px]"
                        preload="metadata"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          triggerFileDownload(audio.audioUrl, audio.fileName)
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-800 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>ดาวน์โหลด</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
