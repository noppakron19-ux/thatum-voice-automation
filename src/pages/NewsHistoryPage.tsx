import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Eye,
  FilePlus2,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { AudioItem, NewsItem, PageId } from '../types/pr';
import {
  NEWS_CATEGORIES,
  formatThaiShortDateTime,
  toLocalDateInputValue,
  triggerFileDownload,
} from '../utils/thaiFormat';

interface NewsHistoryPageProps {
  newsItems: NewsItem[];
  audioItems: AudioItem[];
  onNavigate: (page: PageId) => void;
  onViewDetail: (news: NewsItem) => void;
  onEditInStudio: (news: NewsItem) => void;
  onDeleteNews: (newsId: string) => void;
}

export const NewsHistoryPage: React.FC<NewsHistoryPageProps> = ({
  newsItems,
  audioItems,
  onNavigate,
  onViewDetail,
  onEditInStudio,
  onDeleteNews,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const audioMap = useMemo(() => {
    const map = new Map<string, AudioItem>();
    audioItems.forEach((a) => {
      map.set(a.id, a);
      map.set(a.newsId, a);
    });
    return map;
  }, [audioItems]);

  const filteredItems = useMemo(() => {
    return [...newsItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter((item) => {
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchesText =
            item.title.toLowerCase().includes(q) ||
            item.script.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q);
          if (!matchesText) return false;
        }

        if (dateFilter) {
          if (toLocalDateInputValue(item.createdAt) !== dateFilter) {
            return false;
          }
        }

        if (categoryFilter !== 'all' && item.category !== categoryFilter) {
          return false;
        }

        if (statusFilter === 'completed') {
          if (item.scriptStatus !== 'generated' || item.audioStatus !== 'generated') {
            return false;
          }
        } else if (statusFilter === 'audio_pending') {
          if (item.audioStatus !== 'pending') return false;
        } else if (statusFilter === 'script_pending') {
          if (item.scriptStatus !== 'pending') return false;
        }

        return true;
      });
  }, [newsItems, searchQuery, dateFilter, categoryFilter, statusFilter]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    Boolean(dateFilter) ||
    categoryFilter !== 'all' ||
    statusFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setDateFilter('');
    setCategoryFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="space-y-5">
      {/* Header & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              ประวัติการผลิตข่าวประชาสัมพันธ์ (เซสชันปัจจุบัน)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ทั้งหมด {newsItems.length} รายการ · แสดงผล {filteredItems.length} รายการ (ข้อมูลจัดเก็บชั่วคราวในหน่วยความจำ)
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('create-news')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>สร้างข่าวใหม่</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อข่าว หรือเนื้อหาสคริปต์..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="กรองตามวันที่สร้าง"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="กรองตามประเภทข่าว"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              <option value="all">ประเภทข่าว: ทั้งหมด</option>
              {NEWS_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="กรองตามสถานะ"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              <option value="all">สถานะ: ทั้งหมด</option>
              <option value="completed">สร้างสคริปต์และเสียงแล้ว</option>
              <option value="audio_pending">รอสร้างไฟล์เสียง</option>
              <option value="script_pending">รอตรวจสอบสคริปต์</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                title="ล้างตัวกรอง"
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              {newsItems.length === 0
                ? 'ยังไม่มีประวัติข่าวในเซสชันนี้'
                : 'ไม่พบข่าวที่ตรงกับเงื่อนไขการค้นหา'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {newsItems.length === 0
                ? 'เริ่มสร้างข่าวประชาสัมพันธ์ใหม่เพื่อบันทึกในเซสชันปัจจุบัน'
                : 'ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองเพื่อดูรายการทั้งหมด'}
            </p>
            {hasActiveFilters ? (
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
                <span>สร้างข่าวประชาสัมพันธ์</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 w-14 text-center">ลำดับ</th>
                  <th className="py-3 px-4">ชื่อข่าว</th>
                  <th className="py-3 px-4 whitespace-nowrap">ประเภทข่าว</th>
                  <th className="py-3 px-4 whitespace-nowrap">วันที่สร้าง</th>
                  <th className="py-3 px-4 whitespace-nowrap">สถานะสคริปต์</th>
                  <th className="py-3 px-4 whitespace-nowrap">สถานะเสียง</th>
                  <th className="py-3 px-5 text-right whitespace-nowrap">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredItems.map((item, idx) => {
                  const audio = item.audioId
                    ? audioMap.get(item.audioId)
                    : audioMap.get(item.id);
                  const isConfirmingDelete = confirmDeleteId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-mono tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-900 line-clamp-1">
                          {item.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {item.script || 'ยังไม่มีเนื้อหาสคริปต์'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap">
                        {item.category}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {formatThaiShortDateTime(item.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.scriptStatus === 'generated' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>สร้างแล้ว</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>รอตรวจสอบ</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.audioStatus === 'generated' && audio ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>สร้างเสียงแล้ว</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>ยังไม่สร้างเสียง</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        {isConfirmingDelete ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="text-xs text-red-700 font-medium mr-1">
                              ยืนยันลบ?
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteNews(item.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2.5 py-1 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700"
                            >
                              ลบ
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-100"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onViewDetail(item)}
                              title="ดูรายละเอียด"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditInStudio(item)}
                              title="แก้ไขสคริปต์ / สร้างเสียง"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {audio && (
                              <button
                                type="button"
                                onClick={() =>
                                  triggerFileDownload(audio.audioUrl, audio.fileName)
                                }
                                title="ดาวน์โหลดไฟล์เสียง"
                                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(item.id)}
                              title="ลบรายการข่าว"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
