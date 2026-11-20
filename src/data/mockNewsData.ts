import { AudioItem, NewsCategory, NewsItem, SystemSettings } from '../types/pr';
import { synthesizeMockBroadcastAudio } from '../utils/mockAudioSynthesizer';
import { estimateThaiSpeechDuration } from '../utils/thaiFormat';

export interface SampleFacebookPost {
  id: string;
  label: string;
  url: string;
  title: string;
  category: NewsCategory;
  rawText: string;
}

export const SAMPLE_FACEBOOK_POSTS: SampleFacebookPost[] = [
  {
    id: 'sample-rabies',
    label: 'ฉีดวัคซีนโรคพิษสุนัขบ้าฟรี',
    url: 'https://www.facebook.com/ThatumSAO/posts/pfbid02VaccineThaTum2569',
    title: 'บริการฉีดวัคซีนป้องกันโรคพิษสุนัขบ้าฟรี ประจำปี 2569',
    category: 'สาธารณสุข',
    rawText: `📢 ประชาสัมพันธ์จากกองสาธารณสุขและสิ่งแวดล้อม อบต.ท่าตูม
ขอเชิญชวนพี่น้องประชาชนตำบลท่าตูม นำสุนัขและแมวเข้ารับบริการฉีดวัคซีนป้องกันโรคพิษสุนัขบ้า ฟรี! ไม่มีค่าใช้จ่าย
ภายใต้โครงการสัตว์ปลอดโรค คนปลอดภัย จากโรคพิษสุนัขบ้า ประจำปีงบประมาณ 2569
🗓 วันที่ 24 - 28 พฤศจิกายน 2569
⏰ เวลา 09.00 - 15.00 น.
📍 ณ ศาลาประชาคมหมู่บ้าน ทั้ง 10 หมู่บ้าน (ตามตารางออกหน่วยเคลื่อนที่)
📌 หลักฐานที่ต้องนำมา: บัตรประจำตัวประชาชนเจ้าของสัตว์เลี้ยง
สอบถามเพิ่มเติมโทร 044-591-119 ต่อ 104 ในวันและเวลาราชการ`,
  },
  {
    id: 'sample-tax',
    label: 'แจ้งชำระภาษีที่ดินและป้าย',
    url: 'https://www.facebook.com/ThatumSAO/posts/pfbid02TaxService2569',
    title: 'แจ้งสำรวจและชำระภาษีที่ดินและสิ่งปลูกสร้าง ประจำปี 2569',
    category: 'ภาษีและบริการประชาชน',
    rawText: `🏛 กองคลัง องค์การบริหารส่วนตำบลท่าตูม แจ้งประชาสัมพันธ์การยื่นแบบและชำระภาษีที่ดินและสิ่งปลูกสร้าง รวมถึงภาษีป้าย ประจำปี 2569
ขอความร่วมมือเจ้าของทรัพย์สินและผู้ประกอบการในเขตตำบลท่าตูม ตรวจสอบรายการทรัพย์สินและชำระภาษีได้ตั้งแต่บัดนี้เป็นต้นไป จนถึงวันที่ 30 เมษายน 2570 เพื่อหลีกเลี่ยงเบี้ยปรับและเงินเพิ่มตามกฎหมาย
📍 ชำระได้ที่ กองคลัง ที่ทำการ อบต.ท่าตูม วันจันทร์ - ศุกร์ เวลา 08.30 - 16.30 น.
📞 ติดต่อสอบถาม งานพัฒนาและจัดเก็บรายได้ โทร 044-591-119 ต่อ 102`,
  },
  {
    id: 'sample-relief',
    label: 'มอบถุงยังชีพผู้สูงอายุ-ผู้ยากไร้',
    url: 'https://www.facebook.com/ThatumSAO/posts/pfbid02ReliefBagThaTum',
    title: 'อบต.ท่าตูม ลงพื้นที่มอบถุงยังชีพช่วยเหลือผู้สูงอายุและผู้ป่วยติดเตียง',
    category: 'ช่วยเหลือประชาชน',
    rawText: `🤝 วันนี้ นายกองค์การบริหารส่วนตำบลท่าตูม พร้อมด้วยคณะผู้บริหาร สมาชิกสภา อบต. และเจ้าหน้าที่กองสวัสดิการสังคม ลงพื้นที่เยี่ยมให้กำลังใจและมอบถุงยังชีพเครื่องอุปโภคบริโภค จำนวน 45 ชุด ให้แก่ผู้สูงอายุ ผู้พิการ และผู้ป่วยติดเตียงในพื้นที่หมู่ที่ 3 และหมู่ที่ 7 ตำบลท่าตูม เพื่อช่วยบรรเทาภาระค่าครองชีพเบื้องต้นและดูแลคุณภาพชีวิตประชาชนอย่างทั่วถึง
หากพบผู้ประสบความเดือดร้อน สามารถแจ้งข้อมูลได้ที่ศูนย์ช่วยเหลือประชาชน อบต.ท่าตูม โทร 044-591-119`,
  },
  {
    id: 'sample-storm',
    label: 'แจ้งเตือนเฝ้าระวังพายุและน้ำท่วมขัง',
    url: 'https://www.facebook.com/ThatumSAO/posts/pfbid02WeatherAlert2569',
    title: 'แจ้งเตือนประชาชนเฝ้าระวังฝนตกหนักและลมกระโชกแรง',
    category: 'แจ้งเตือนภัย',
    rawText: `⚠️ งานป้องกันและบรรเทาสาธารณภัย อบต.ท่าตูม แจ้งเตือนพี่น้องประชาชนในพื้นที่ เฝ้าระวังฝนตกหนักถึงหนักมากและลมกระโชกแรง ในช่วงวันที่ 20 - 22 พฤศจิกายน 2569
ขอให้ประชาชนตรวจสอบความมั่นคงแข็งแรงของหลังคาบ้านเรือน ป้ายโฆษณา และหลีกเลี่ยงการอยู่ใกล้ต้นไม้ใหญ่หรือเสาไฟฟ้า พร้อมเก็บสิ่งของขึ้นที่สูงในจุดเสี่ยงน้ำท่วมขัง
หากเกิดเหตุฉุกเฉิน ต้นไม้ล้ม หรือต้องการความช่วยเหลือเร่งด่วน แจ้งสายด่วนงานป้องกันฯ อบต.ท่าตูม โทร 044-591-199 ตลอด 24 ชั่วโมง`,
  },
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  organizationName: 'องค์การบริหารส่วนตำบลท่าตูม',
  announcerName: 'นางสาวสุภาพร ใจดี (งานประชาสัมพันธ์)',
  defaultLanguage: 'th-TH',
  defaultVoice: 'female',
  defaultSpeed: 1.0,
  defaultTone: 'polite',
  apiMode: 'mock',
  n8nBaseUrl: 'https://n8n.thatum-sao.go.th',
};

export function createInitialSessionData(): {
  newsItems: NewsItem[];
  audioItems: AudioItem[];
} {
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();

  const script1 =
    'สวัสดีค่ะ พี่น้องประชาชนตำบลท่าตูมทุกท่าน องค์การบริหารส่วนตำบลท่าตูม ขอประชาสัมพันธ์บริการฉีดวัคซีนป้องกันโรคพิษสุนัขบ้าฟรี ไม่มีค่าใช้จ่าย ประจำปีงบประมาณ 2569 เพื่อดูแลความปลอดภัยให้ทั้งสัตว์เลี้ยงและประชาชนในชุมชนค่ะ ขอเชิญนำสุนัขและแมวเข้ารับบริการได้ระหว่างวันที่ 24 ถึง 28 พฤศจิกายน 2569 เวลา 09.00 ถึง 15.00 นาฬิกา ณ ศาลาประชาคมหมู่บ้านทั้ง 10 หมู่บ้าน โดยนำบัตรประจำตัวประชาชนมาแสดงด้วยนะคะ สอบถามเพิ่มเติมโทร 044-591-119 ต่อ 104 ในวันและเวลาราชการค่ะ';

  const script2 =
    'สวัสดีค่ะ พี่น้องประชาชนตำบลท่าตูม กองคลัง องค์การบริหารส่วนตำบลท่าตูม ขอแจ้งประชาสัมพันธ์ให้เจ้าของทรัพย์สินและผู้ประกอบการในพื้นที่ ตรวจสอบรายการและยื่นชำระภาษีที่ดินและสิ่งปลูกสร้าง รวมถึงภาษีป้าย ประจำปี 2569 ได้ตั้งแต่บัดนี้จนถึงวันที่ 30 เมษายน 2570 เพื่อหลีกเลี่ยงเบี้ยปรับตามกฎหมายค่ะ สามารถติดต่อชำระได้ที่กองคลัง ที่ทำการ อบต.ท่าตูม วันจันทร์ถึงศุกร์ เวลา 08.30 ถึง 16.30 นาฬิกา หรือโทรสอบถาม 044-591-119 ต่อ 102 ค่ะ';

  const script3 =
    'สวัสดีค่ะ พี่น้องประชาชนตำบลท่าตูม องค์การบริหารส่วนตำบลท่าตูม นำโดยคณะผู้บริหารและกองสวัสดิการสังคม ได้ลงพื้นที่เยี่ยมให้กำลังใจพร้อมมอบถุงยังชีพเครื่องอุปโภคบริโภค จำนวน 45 ชุด ให้แก่ผู้สูงอายุ ผู้พิการ และผู้ป่วยติดเตียงในหมู่ที่ 3 และหมู่ที่ 7 เพื่อช่วยบรรเทาภาระค่าครองชีพและดูแลคุณภาพชีวิตประชาชนอย่างทั่วถึงค่ะ หากพบผู้ประสบความเดือดร้อน สามารถแจ้งได้ที่ศูนย์ช่วยเหลือประชาชน อบต.ท่าตูม โทร 044-591-119 ค่ะ';

  const script4 =
    'ประกาศแจ้งเตือนภัยจากงานป้องกันและบรรเทาสาธารณภัย องค์การบริหารส่วนตำบลท่าตูม ค่ะ ขอให้พี่น้องประชาชนเฝ้าระวังฝนตกหนักและลมกระโชกแรง ระหว่างวันที่ 20 ถึง 22 พฤศจิกายน 2569 โปรดตรวจสอบความแข็งแรงของหลังคาบ้านเรือน หลีกเลี่ยงการอยู่ใกล้ต้นไม้ใหญ่หรือเสาไฟฟ้า และยกสิ่งของขึ้นที่สูงในจุดเสี่ยงน้ำท่วมขังนะคะ หากพบเหตุฉุกเฉินหรือต้องการความช่วยเหลือเร่งด่วน แจ้งสายด่วน อบต.ท่าตูม โทร 044-591-199 ได้ตลอด 24 ชั่วโมงค่ะ';

  const audio1 = synthesizeMockBroadcastAudio({
    estimatedSeconds: estimateThaiSpeechDuration(script1, 1.0),
    voice: 'female',
    speed: 1.0,
    tone: 'polite',
  });

  const audio2 = synthesizeMockBroadcastAudio({
    estimatedSeconds: estimateThaiSpeechDuration(script2, 1.0),
    voice: 'female',
    speed: 1.0,
    tone: 'polite',
  });

  const audioItem1: AudioItem = {
    id: 'aud-init-1',
    newsId: 'news-init-1',
    newsTitle: 'บริการฉีดวัคซีนป้องกันโรคพิษสุนัขบ้าฟรี ประจำปี 2569',
    fileName: 'tha-tum-vaccine-25691119.wav',
    audioUrl: audio1.audioUrl,
    durationSeconds: estimateThaiSpeechDuration(script1, 1.0),
    voice: 'female',
    speed: 1.0,
    tone: 'polite',
    language: 'th-TH',
    createdAt: hoursAgo(4),
    isMock: true,
    mimeType: audio1.mimeType,
  };

  const audioItem2: AudioItem = {
    id: 'aud-init-2',
    newsId: 'news-init-2',
    newsTitle: 'แจ้งสำรวจและชำระภาษีที่ดินและสิ่งปลูกสร้าง ประจำปี 2569',
    fileName: 'tha-tum-tax-25691119.wav',
    audioUrl: audio2.audioUrl,
    durationSeconds: estimateThaiSpeechDuration(script2, 1.0),
    voice: 'female',
    speed: 1.0,
    tone: 'polite',
    language: 'th-TH',
    createdAt: hoursAgo(2.5),
    isMock: true,
    mimeType: audio2.mimeType,
  };

  const newsItems: NewsItem[] = [
    {
      id: 'news-init-1',
      title: 'บริการฉีดวัคซีนป้องกันโรคพิษสุนัขบ้าฟรี ประจำปี 2569',
      category: 'สาธารณสุข',
      sourceType: 'facebook_url',
      sourceUrl: SAMPLE_FACEBOOK_POSTS[0].url,
      sourceText: SAMPLE_FACEBOOK_POSTS[0].rawText,
      script: script1,
      scriptStatus: 'generated',
      audioStatus: 'generated',
      audioId: audioItem1.id,
      createdAt: hoursAgo(4.2),
      updatedAt: hoursAgo(4),
      isSample: true,
    },
    {
      id: 'news-init-2',
      title: 'แจ้งสำรวจและชำระภาษีที่ดินและสิ่งปลูกสร้าง ประจำปี 2569',
      category: 'ภาษีและบริการประชาชน',
      sourceType: 'manual_text',
      sourceUrl: '',
      sourceText: SAMPLE_FACEBOOK_POSTS[1].rawText,
      script: script2,
      scriptStatus: 'generated',
      audioStatus: 'generated',
      audioId: audioItem2.id,
      createdAt: hoursAgo(2.8),
      updatedAt: hoursAgo(2.5),
      isSample: true,
    },
    {
      id: 'news-init-3',
      title: 'อบต.ท่าตูม ลงพื้นที่มอบถุงยังชีพช่วยเหลือผู้สูงอายุและผู้ป่วยติดเตียง',
      category: 'ช่วยเหลือประชาชน',
      sourceType: 'facebook_url',
      sourceUrl: SAMPLE_FACEBOOK_POSTS[2].url,
      sourceText: SAMPLE_FACEBOOK_POSTS[2].rawText,
      script: script3,
      scriptStatus: 'generated',
      audioStatus: 'pending',
      createdAt: hoursAgo(1.2),
      updatedAt: hoursAgo(1.2),
      isSample: true,
    },
    {
      id: 'news-init-4',
      title: 'แจ้งเตือนประชาชนเฝ้าระวังฝนตกหนักและลมกระโชกแรง',
      category: 'แจ้งเตือนภัย',
      sourceType: 'manual_text',
      sourceUrl: '',
      sourceText: SAMPLE_FACEBOOK_POSTS[3].rawText,
      script: script4,
      scriptStatus: 'pending',
      audioStatus: 'pending',
      createdAt: hoursAgo(0.4),
      updatedAt: hoursAgo(0.4),
      isSample: true,
    },
  ];

  return {
    newsItems,
    audioItems: [audioItem1, audioItem2],
  };
}
