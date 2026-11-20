export type PageId =
  | 'dashboard'
  | 'create-news'
  | 'news-history'
  | 'audio-library'
  | 'settings';

export type ApiMode = 'mock' | 'production';

export type NewsSourceType = 'facebook_url' | 'manual_text';

export type NewsCategory =
  | 'ช่วยเหลือประชาชน'
  | 'สาธารณสุข'
  | 'โครงสร้างพื้นฐาน'
  | 'ภาษีและบริการประชาชน'
  | 'กิจกรรมชุมชน'
  | 'แจ้งเตือนภัย'
  | 'ประชาสัมพันธ์ทั่วไป';

export type ScriptStatus = 'generated' | 'pending';
export type AudioStatus = 'generated' | 'pending';

export type VoiceOption = 'female' | 'male';
export type ToneOption = 'polite' | 'urgent' | 'warm';

export interface AudioItem {
  id: string;
  newsId: string;
  newsTitle: string;
  fileName: string;
  audioUrl: string;
  durationSeconds: number;
  voice: VoiceOption;
  speed: number;
  tone: ToneOption;
  language: string;
  createdAt: string; // ISO string
  isMock: boolean;
  mimeType: string;
}

export interface NewsItem {
  id: string;
  title: string;
  category: NewsCategory;
  sourceType: NewsSourceType;
  sourceUrl: string;
  sourceText: string;
  script: string;
  scriptStatus: ScriptStatus;
  audioStatus: AudioStatus;
  audioId?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  isSample?: boolean;
}

export interface SystemSettings {
  organizationName: string;
  announcerName: string;
  defaultLanguage: string;
  defaultVoice: VoiceOption;
  defaultSpeed: number;
  defaultTone: ToneOption;
  apiMode: ApiMode;
  n8nBaseUrl: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

export interface GenerateScriptRequest {
  sourceType: NewsSourceType;
  sourceUrl: string;
  sourceText: string;
}

export interface GenerateScriptResponse {
  success: boolean;
  data?: {
    title: string;
    category: NewsCategory;
    script: string;
  };
  error?: string;
  isMock?: boolean;
}

export interface GenerateAudioRequest {
  script: string;
  voice: VoiceOption;
  speed: number;
  language: string;
  tone?: ToneOption;
  title?: string;
}

export interface GenerateAudioResponse {
  success: boolean;
  data?: {
    audioUrl: string;
    fileName: string;
    durationSeconds: number;
    mimeType: string;
  };
  error?: string;
  isMock?: boolean;
}
