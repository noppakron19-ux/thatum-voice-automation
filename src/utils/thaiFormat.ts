import { NewsCategory, ToneOption, VoiceOption } from '../types/pr';

const THAI_DAYS = [
  'อาทิตย์',
  'จันทร์',
  'อังคาร',
  'พุธ',
  'พฤหัสบดี',
  'ศุกร์',
  'เสาร์',
];

const THAI_MONTHS_FULL = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

export function formatThaiFullDate(date: Date = new Date()): string {
  const dayName = THAI_DAYS[date.getDay()];
  const dayNum = date.getDate();
  const monthName = THAI_MONTHS_FULL[date.getMonth()];
  const yearBE = date.getFullYear() + 543;
  return `วัน${dayName}ที่ ${dayNum} ${monthName} พ.ศ. ${yearBE}`;
}

export function formatThaiShortDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '-';
  const day = date.getDate();
  const month = THAI_MONTHS_SHORT[date.getMonth()];
  const yearBE = date.getFullYear() + 543;
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${yearBE} · ${hh}:${mm} น.`;
}

export function formatThaiDateOnly(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '-';
  const day = date.getDate();
  const month = THAI_MONTHS_SHORT[date.getMonth()];
  const yearBE = date.getFullYear() + 543;
  return `${day} ${month} ${yearBE}`;
}

export function toLocalDateInputValue(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDurationSeconds(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function estimateThaiSpeechDuration(script: string, speed: number = 1.0): number {
  const cleaned = script.replace(/\s+/g, '');
  if (!cleaned.length) return 0;
  // Average Thai broadcast reading rate ~ 11.5 characters per second
  const baseSeconds = cleaned.length / 11.5;
  const adjusted = baseSeconds / (speed || 1);
  return Math.max(8, Math.round(adjusted));
}

export function getVoiceLabel(voice: VoiceOption): string {
  return voice === 'female' ? 'เสียงผู้หญิง (สุภาพ)' : 'เสียงผู้ชาย (นุ่มนวล)';
}

export function getSpeedLabel(speed: number): string {
  if (speed <= 0.9) return 'ช้าชัดเจน (0.85x)';
  if (speed >= 1.1) return 'กระชับ (1.15x)';
  return 'ปกติ (1.0x)';
}

export function getToneLabel(tone: ToneOption): string {
  switch (tone) {
    case 'urgent':
      return 'กระชับ ทันเหตุการณ์';
    case 'warm':
      return 'อบอุ่น เข้าถึงประชาชน';
    case 'polite':
    default:
      return 'สุภาพ เป็นทางการและเป็นกันเอง';
  }
}

export const NEWS_CATEGORIES: NewsCategory[] = [
  'ช่วยเหลือประชาชน',
  'สาธารณสุข',
  'โครงสร้างพื้นฐาน',
  'ภาษีและบริการประชาชน',
  'กิจกรรมชุมชน',
  'แจ้งเตือนภัย',
  'ประชาสัมพันธ์ทั่วไป',
];

export function buildSafeFileName(title: string, ext: string = 'mp3'): string {
  const now = new Date();
  const yyyy = now.getFullYear() + 543;
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const cleanTitle = title
    .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  const slug = cleanTitle || 'pr-news';
  return `tha-tum-${slug}-${yyyy}${mm}${dd}-${hh}${min}.${ext}`;
}

export async function triggerFileDownload(url: string, fileName: string): Promise<void> {
  try {
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
  } catch {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
