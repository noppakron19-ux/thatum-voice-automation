import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Building2,
  CheckCheck,
  FileAudio,
  FilePlus2,
  History,
  LayoutDashboard,
  Menu,
  Radio,
  Settings,
  X,
} from 'lucide-react';
import { AppNotification, PageId, SystemSettings } from '../types/pr';
import { formatThaiFullDate, formatThaiShortDateTime } from '../utils/thaiFormat';

interface LayoutProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  settings: SystemSettings;
  notifications: AppNotification[];
  onMarkAllNotificationsRead: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'create-news', label: 'สร้างข่าวประชาสัมพันธ์', icon: FilePlus2 },
  { id: 'news-history', label: 'ประวัติข่าว', icon: History },
  { id: 'audio-library', label: 'คลังไฟล์เสียง', icon: FileAudio },
  { id: 'settings', label: 'ตั้งค่าระบบ', icon: Settings },
];

const PAGE_TITLES: Record<PageId, { title: string; breadcrumb: string }> = {
  dashboard: {
    title: 'ภาพรวมระบบผลิตข่าวเสียง',
    breadcrumb: 'Dashboard',
  },
  'create-news': {
    title: 'สร้างข่าวประชาสัมพันธ์เสียง',
    breadcrumb: 'สร้างข่าวประชาสัมพันธ์',
  },
  'news-history': {
    title: 'ประวัติข่าวประชาสัมพันธ์',
    breadcrumb: 'ประวัติข่าว',
  },
  'audio-library': {
    title: 'คลังไฟล์เสียงประกาศ',
    breadcrumb: 'คลังไฟล์เสียง',
  },
  settings: {
    title: 'ตั้งค่าระบบและจุดเชื่อมต่อ',
    breadcrumb: 'ตั้งค่าระบบ',
  },
};

const OFFICER_AVATAR_PATH = '/src/assets/images/avatar_pr_officer_1795146189413.jpg';

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  onNavigate,
  settings,
  notifications,
  onMarkAllNotificationsRead,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pageMeta = PAGE_TITLES[currentPage];
  const thaiDateStr = formatThaiFullDate(new Date());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectNav = (page: PageId) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F2440] text-slate-100 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
          <button
            type="button"
            onClick={() => handleSelectNav('dashboard')}
            className="flex items-center gap-3 text-left focus:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-base font-bold tracking-tight text-white whitespace-nowrap">
                PR Studio
              </div>
              <div className="text-[11px] text-slate-300 truncate">
                ระบบผลิตข่าวเสียง อบต.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            aria-label="ปิดเมนู"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="เมนูหลัก">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/8'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Organization Info */}
        <div className="p-4 border-t border-white/10 bg-black/15">
          <div className="flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-blue-300 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white leading-snug">
                {settings.organizationName}
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                สถานีกระจายเสียงไร้สายประจำตำบล
              </p>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {settings.apiMode === 'mock' ? 'โหมดทดลอง (Mock Mode)' : 'เชื่อมต่อ n8n Webhook'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Hamburger + Breadcrumb & Current Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              aria-label="เปิดเมนู"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-blue-700 transition-colors whitespace-nowrap"
                >
                  PR Studio
                </button>
                <span aria-hidden="true">/</span>
                <span className="text-slate-700 font-medium truncate">
                  {pageMeta.breadcrumb}
                </span>
              </div>
              <h1 className="font-display text-base sm:text-lg font-bold text-slate-900 truncate">
                {pageMeta.title}
              </h1>
            </div>
          </div>

          {/* Right: Thai Date, Notifications, User Profile */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <div className="hidden md:block text-right">
              <div className="text-xs font-medium text-slate-700 whitespace-nowrap">
                {thaiDateStr}
              </div>
              <div className="text-[11px] text-slate-500 whitespace-nowrap">
                {settings.apiMode === 'mock'
                  ? 'โหมดทดลองระบบ (In-Memory)'
                  : 'โหมดเชื่อมต่อ n8n จริง'}
              </div>
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition-colors"
                aria-label="การแจ้งเตือนระบบ"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-700 text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-slate-200 shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">
                      การแจ้งเตือนในเซสชัน
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={onMarkAllNotificationsRead}
                        className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-800 font-medium"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>อ่านทั้งหมด</span>
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        ยังไม่มีการแจ้งเตือนในเซสชันนี้
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 text-xs ${
                            notif.read ? 'bg-white' : 'bg-blue-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900">
                              {notif.title}
                            </span>
                            <span className="text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                              {formatThaiShortDateTime(notif.createdAt)}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Officer Profile */}
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors text-left"
              title="ไปยังหน้าตั้งค่าระบบ"
            >
              {!avatarError ? (
                <img
                  src={OFFICER_AVATAR_PATH}
                  alt="เจ้าหน้าที่ประชาสัมพันธ์ อบต.ท่าตูม"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-blue-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                  ทต
                </div>
              )}
              <div className="hidden sm:block min-w-0 max-w-[170px]">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {settings.announcerName.split('(')[0].trim()}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  อบต.ท่าตูม
                </div>
              </div>
            </button>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1360px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
