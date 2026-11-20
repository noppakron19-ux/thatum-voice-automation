import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  FileAudio,
  FilePlus2,
  FileText,
  Info,
  Newspaper,
} from 'lucide-react';
import { AudioItem, NewsItem, PageId, SystemSettings } from '../types/pr';
import { formatThaiShortDateTime } from '../utils/thaiFormat';

interface DashboardPageProps {
  newsItems: NewsItem[];
  audioItems: AudioItem[];
  settings: SystemSettings;
  onNavigate: (page: PageId) => void;
  onViewDetail: (news: NewsItem) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  newsItems,
  audioItems,
  settings,
  onNavigate,
  onViewDetail,
}) => {
  const totalNews = newsItems.length;
  const generatedScripts = newsItems.filter(
    (n) => n.scriptStatus === 'generated'
  ).length;
  const generatedAudios = audioItems.length;
  const pendingReview = newsItems.filter(
    (n) => n.scriptStatus === 'pending' || n.audioStatus === 'pending'
  ).length;

  const recentNews = [...newsItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const summaryCards = [
    {
      label: 'จำนวนข่าวทั้งหมด',
      value: totalNews,
      unit: 'รายการ',
      subtext: 'ข้อมูลในเซสชันปัจจุบัน',
      icon: Newspaper,
      tone: 'text-blue-700 bg-blue-50',
    },
    {
      label: 'สคริปต์ที่สร้างแล้ว',
      value: generatedScripts,
      unit: 'สคริปต์',
      subtext: 'พร้อมสำหรับอ่านออกเสียง',
      icon: FileText,
      tone: 'text-slate-700 bg-slate-100',
    },
    {
      label: 'ไฟล์เสียงที่สร้างแล้ว',
      value: generatedAudios,
      unit: 'ไฟล์',
      subtext: 'พร้อมออกอากาศและดาวน์โหลด',
      icon: FileAudio,
      tone: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'ข่าวที่รอตรวจสอบ',
      value: pendingReview,
      unit: 'รายการ',
      subtext: 'รอตรวจสอบหรือสร้างไฟล์เสียง',
      icon: Clock,
      tone: 'text-amber-700 bg-amber-50',
    },
  ];

  const renderOverallStatus = (item: NewsItem) => {
    if (item.scriptStatus === 'generated' && item.audioStatus === 'generated') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>ผลิตเสียงเสร็จสมบูรณ์</span>
        </span>
      );
    }
    if (item.scriptStatus === 'generated' && item.audioStatus === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>รอสร้างไฟล์เสียง</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>รอตรวจสอบสคริปต์</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Mode Notice */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{settings.organizationName}</span>
            <span aria-hidden="true">·</span>
            <span>สถานีกระจายเสียงไร้สายประจำตำบล</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
            ศูนย์ผลิตข่าวประชาสัมพันธ์เสียงประจำวัน
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            นำเข้าข้อความข่าวจากเพจ Facebook ของ อบต.ท่าตูม ปรับปรุงเป็นสคริปต์อ่านออกเสียงภาษาไทยที่กระชับ ชัดเจน และแปลงเป็นไฟล์เสียงสำหรับเปิดประกาศผ่านหอกระจายข่าว
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('create-news')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>สร้างข่าวประชาสัมพันธ์ใหม่</span>
          </button>
        </div>
      </div>

      {/* Mock Mode & Stateless Notice */}
      {settings.apiMode === 'mock' && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>โหมดทดลองระบบ (Mock Mode):</strong>{' '}
              สถิติและรายการข่าวแสดงจากข้อมูลตัวอย่างและข้อมูลที่สร้างในเซสชันปัจจุบันเท่านั้น (ไม่มีการบันทึกลงฐานข้อมูล เมื่อรีเฟรชหน้าเว็บข้อมูลจะถูกเริ่มต้นใหม่)
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 whitespace-nowrap shrink-0"
          >
            <span>ตั้งค่าการเชื่อมต่อ n8n</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">{card.label}</p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-display text-3xl font-bold text-slate-900 tabular-nums">
                    {card.value}
                  </span>
                  <span className="text-xs text-slate-500">{card.unit}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">{card.subtext}</p>
              </div>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.tone}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent News Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              รายการข่าวประชาสัมพันธ์ล่าสุด
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ติดตามสถานะการสร้างสคริปต์และไฟล์เสียงในเซสชันปัจจุบัน
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('news-history')}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
          >
            <span>ดูประวัติข่าวทั้งหมด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentNews.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              ยังไม่มีรายการข่าวในเซสชันนี้
            </p>
            <p className="text-xs text-slate-500 mt-1">
              เริ่มต้นนำเข้าโพสต์ Facebook หรือวางข้อความข่าวเพื่อผลิตสคริปต์และไฟล์เสียง
            </p>
            <button
              type="button"
              onClick={() => onNavigate('create-news')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 transition-colors"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>สร้างข่าวประชาสัมพันธ์แรก</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-5">ชื่อข่าว</th>
                  <th className="py-3 px-4 whitespace-nowrap">ประเภทข่าว</th>
                  <th className="py-3 px-4 whitespace-nowrap">วันที่สร้าง</th>
                  <th className="py-3 px-4 whitespace-nowrap">สถานะ</th>
                  <th className="py-3 px-5 text-right whitespace-nowrap">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentNews.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-5 max-w-md">
                      <div className="font-medium text-slate-900 line-clamp-1">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {item.sourceType === 'facebook_url'
                          ? 'นำเข้าจาก Facebook URL'
                          : 'นำเข้าจากข้อความ'}
                        {item.isSample ? ' · ตัวอย่างเริ่มต้น' : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap">
                      {item.category}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      {formatThaiShortDateTime(item.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderOverallStatus(item)}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewDetail(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ดูรายละเอียด</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
