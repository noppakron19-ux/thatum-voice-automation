import { useState } from 'react';
import { Layout } from './components/Layout';
import { NewsDetailModal } from './components/NewsDetailModal';
import {
  DEFAULT_SYSTEM_SETTINGS,
  createInitialSessionData,
} from './data/mockNewsData';
import { AudioLibraryPage } from './pages/AudioLibraryPage';
import { CreateNewsPage } from './pages/CreateNewsPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewsHistoryPage } from './pages/NewsHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import {
  AppNotification,
  AudioItem,
  NewsItem,
  PageId,
  SystemSettings,
} from './types/pr';

export default function App() {
  const [initialData] = useState(() => createInitialSessionData());

  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [newsItems, setNewsItems] = useState<NewsItem[]>(initialData.newsItems);
  const [audioItems, setAudioItems] = useState<AudioItem[]>(initialData.audioItems);

  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [detailNews, setDetailNews] = useState<NewsItem | null>(null);

  const [notifications, setNotifications] = useState<AppNotification[]>(() => [
    {
      id: 'notif-init-1',
      title: 'พร้อมใช้งาน (โหมดทดลองระบบ)',
      message:
        'ระบบโหลดข้อมูลตัวอย่างของ อบต.ท่าตูม ไว้ในหน่วยความจำชั่วคราวแล้ว สามารถทดสอบสร้างสคริปต์และไฟล์เสียงได้ทันที',
      createdAt: new Date().toISOString(),
      read: false,
      type: 'info',
    },
  ]);

  const pushNotification = (
    title: string,
    message: string,
    type: AppNotification['type'] = 'success'
  ) => {
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title,
        message,
        createdAt: new Date().toISOString(),
        read: false,
        type,
      },
      ...prev.slice(0, 14),
    ]);
  };

  const handleSaveNewsRecord = (record: NewsItem) => {
    setNewsItems((prev) => {
      const exists = prev.some((n) => n.id === record.id);
      if (exists) {
        return prev.map((n) => (n.id === record.id ? record : n));
      }
      return [record, ...prev];
    });
    setEditingNews(record);
    pushNotification(
      'บันทึกสคริปต์แล้ว',
      `บันทึกสคริปต์ "${record.title}" ในเซสชันปัจจุบันเรียบร้อย`,
      'success'
    );
  };

  const handleSaveAudioRecord = (newsId: string, audio: AudioItem) => {
    setAudioItems((prev) => {
      const withoutOldForNews = prev.filter((a) => a.newsId !== newsId);
      return [audio, ...withoutOldForNews];
    });
    setNewsItems((prev) =>
      prev.map((n) =>
        n.id === newsId
          ? {
              ...n,
              audioStatus: 'generated',
              audioId: audio.id,
              updatedAt: audio.createdAt,
            }
          : n
      )
    );
    pushNotification(
      'สร้างไฟล์เสียงสำเร็จ',
      `ไฟล์เสียง "${audio.fileName}" พร้อมรับฟังและดาวน์โหลดแล้ว`,
      'success'
    );
  };

  const handleDeleteNews = (newsId: string) => {
    const target = newsItems.find((n) => n.id === newsId);
    setNewsItems((prev) => prev.filter((n) => n.id !== newsId));
    setAudioItems((prev) => prev.filter((a) => a.newsId !== newsId));
    if (editingNews?.id === newsId) {
      setEditingNews(null);
    }
    if (detailNews?.id === newsId) {
      setDetailNews(null);
    }
    if (target) {
      pushNotification(
        'ลบรายการข่าวแล้ว',
        `ลบ "${target.title}" ออกจากเซสชันปัจจุบันแล้ว`,
        'info'
      );
    }
  };

  const handleOpenInStudio = (news: NewsItem) => {
    setEditingNews(news);
    setCurrentPage('create-news');
  };

  const handleSaveSettings = (nextSettings: SystemSettings) => {
    setSettings(nextSettings);
    pushNotification(
      'อัปเดตการตั้งค่าระบบ',
      nextSettings.apiMode === 'mock'
        ? 'ระบบทำงานในโหมดทดลอง (Mock Mode)'
        : `เปลี่ยนเป็นโหมดเชื่อมต่อ n8n (${nextSettings.n8nBaseUrl})`,
      'info'
    );
  };

  const handleResetSessionData = () => {
    setNewsItems([]);
    setAudioItems([]);
    setEditingNews(null);
    setDetailNews(null);
    pushNotification(
      'ล้างข้อมูลเซสชันแล้ว',
      'ลบรายการข่าวและไฟล์เสียงทั้งหมดออกจากหน่วยความจำเรียบร้อย',
      'info'
    );
  };

  const handleNavigate = (page: PageId) => {
    if (page !== 'create-news') {
      setEditingNews(null);
    }
    setCurrentPage(page);
  };

  const detailAudio = detailNews
    ? audioItems.find(
        (a) => a.id === detailNews.audioId || a.newsId === detailNews.id
      )
    : undefined;

  const editingAudio = editingNews
    ? audioItems.find(
        (a) => a.id === editingNews.audioId || a.newsId === editingNews.id
      )
    : undefined;

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      settings={settings}
      notifications={notifications}
      onMarkAllNotificationsRead={() =>
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      }
    >
      {currentPage === 'dashboard' && (
        <DashboardPage
          newsItems={newsItems}
          audioItems={audioItems}
          settings={settings}
          onNavigate={handleNavigate}
          onViewDetail={(news) => setDetailNews(news)}
        />
      )}

      {currentPage === 'create-news' && (
        <CreateNewsPage
          settings={settings}
          editingNews={editingNews}
          existingAudioForEditing={editingAudio}
          onClearEditing={() => setEditingNews(null)}
          onSaveNewsRecord={handleSaveNewsRecord}
          onSaveAudioRecord={handleSaveAudioRecord}
        />
      )}

      {currentPage === 'news-history' && (
        <NewsHistoryPage
          newsItems={newsItems}
          audioItems={audioItems}
          onNavigate={handleNavigate}
          onViewDetail={(news) => setDetailNews(news)}
          onEditInStudio={handleOpenInStudio}
          onDeleteNews={handleDeleteNews}
        />
      )}

      {currentPage === 'audio-library' && (
        <AudioLibraryPage
          audioItems={audioItems}
          newsItems={newsItems}
          onNavigate={handleNavigate}
        />
      )}

      {currentPage === 'settings' && (
        <SettingsPage
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onResetSessionData={handleResetSessionData}
        />
      )}

      <NewsDetailModal
        news={detailNews}
        audioItem={detailAudio}
        onClose={() => setDetailNews(null)}
        onOpenInEditor={handleOpenInStudio}
      />
    </Layout>
  );
}
