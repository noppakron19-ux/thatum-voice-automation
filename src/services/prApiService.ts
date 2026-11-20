import { SAMPLE_FACEBOOK_POSTS } from '../data/mockNewsData';
import {
  GenerateAudioRequest,
  GenerateAudioResponse,
  GenerateScriptRequest,
  GenerateScriptResponse,
  NewsCategory,
  SystemSettings,
} from '../types/pr';
import { synthesizeMockBroadcastAudio } from '../utils/mockAudioSynthesizer';
import { buildSafeFileName, estimateThaiSpeechDuration } from '../utils/thaiFormat';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface FacebookFetchResult {
  success: boolean;
  extractedText?: string;
  suggestedTitle?: string;
  statusMessage: string;
  requiresManualFallback?: boolean;
}

function normalizeWebhookBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

function inferCategoryFromText(text: string): NewsCategory {
  const lower = text.toLowerCase();
  if (/วัคซีน|สาธารณสุข|ไข้เลือดออก|หมอ|อนามัย|โรค|ตรวจสุขภาพ/.test(lower)) {
    return 'สาธารณสุข';
  }
  if (/พายุ|น้ำท่วม|ฉุกเฉิน|เตือน|ไฟไหม้|สาธารณภัย|ฝนตก/.test(lower)) {
    return 'แจ้งเตือนภัย';
  }
  if (/ภาษี|ทะเบียน|บัตรประชาชน|กองคลัง|ชำระเงิน|ค่าธรรมเนียม/.test(lower)) {
    return 'ภาษีและบริการประชาชน';
  }
  if (/ถนน|ไฟฟ้า|ประปา|ซ่อมแซม|ขุดลอก|สะพาน|โครงสร้าง/.test(lower)) {
    return 'โครงสร้างพื้นฐาน';
  }
  if (/ถุงยังชีพ|ช่วยเหลือ|ผู้สูงอายุ|ผู้พิการ|เบี้ยยังชีพ|สงเคราะห์|เยียวยา/.test(lower)) {
    return 'ช่วยเหลือประชาชน';
  }
  if (/อบรม|ประเพณี|กีฬา|วันสำคัญ|กิจกรรม|ประชุม|จิตอาสา/.test(lower)) {
    return 'กิจกรรมชุมชน';
  }
  return 'ประชาสัมพันธ์ทั่วไป';
}

function cleanFacebookArtifacts(raw: string): string {
  return raw
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ')
    .replace(/#\S+/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function buildMockBroadcastScript(
  rawText: string,
  organizationName: string
): { title: string; category: NewsCategory; script: string } {
  const cleaned = cleanFacebookArtifacts(rawText);
  const lines = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const firstLine = lines[0] || 'ข่าวประชาสัมพันธ์จากองค์การบริหารส่วนตำบลท่าตูม';
  const title =
    firstLine.length > 72 ? `${firstLine.slice(0, 69).trim()}...` : firstLine;
  const category = inferCategoryFromText(cleaned);

  // Combine key lines into natural spoken Thai while preserving dates, locations, and phone numbers
  const bodyLines = lines
    .slice(lines.length > 1 ? 1 : 0)
    .map((line) =>
      line
        .replace(/^(วันที่|เวลา|สถานที่|หมายเหตุ|ติดต่อ|สอบถาม)[:\s]*/g, '$1 ')
        .replace(/[!]+/g, '')
        .trim()
    )
    .filter(Boolean);

  let coreNarrative = bodyLines.join(' ');
  if (!coreNarrative) {
    coreNarrative = firstLine;
  }

  // Keep concise for 30-60 second broadcast length (~320-480 chars)
  if (coreNarrative.length > 360) {
    coreNarrative = `${coreNarrative.slice(0, 350).trim()}`;
  }

  // Ensure polite female ending "ค่ะ"
  const endsWithPoliteParticle = /(ค่ะ|นะคะ)$/.test(coreNarrative);
  const ending = endsWithPoliteParticle ? '' : ' ค่ะ';

  const introPrefix =
    category === 'แจ้งเตือนภัย'
      ? `ประกาศแจ้งเตือนจาก${organizationName} ค่ะ ขอให้พี่น้องประชาชนตำบลท่าตูมทราบโดยทั่วกันว่า`
      : `สวัสดีค่ะ พี่น้องประชาชนตำบลท่าตูมทุกท่าน ${organizationName} ขอประชาสัมพันธ์ให้ทราบว่า`;

  const script = `${introPrefix} ${coreNarrative}${ending}`;

  return { title, category, script };
}

export const prApiService = {
  /**
   * Simulates or attempts fetching Facebook post metadata/text.
   * Note: Facebook restricts automated scraping on many posts, so fallback guidance is built-in.
   */
  async fetchFacebookPost(
    url: string,
    settings: SystemSettings
  ): Promise<FacebookFetchResult> {
    const trimmed = url.trim();
    if (!trimmed) {
      return {
        success: false,
        statusMessage: 'กรุณากรอกลิงก์โพสต์ Facebook ก่อนดึงข้อมูล',
      };
    }

    const isFacebookUrl = /^(https?:\/\/)?(www\.|m\.|web\.)?(facebook\.com|fb\.watch|fb\.com)\/.+/i.test(
      trimmed
    );
    if (!isFacebookUrl) {
      return {
        success: false,
        statusMessage: 'รูปแบบลิงก์ไม่ถูกต้อง กรุณาวางลิงก์จาก facebook.com หรือ fb.watch',
      };
    }

    if (settings.apiMode === 'mock') {
      await wait(750);

      // Simulate realistic Facebook access restriction if URL looks private/restricted
      if (/private|restricted|groups\/\d+\/permalink\/error/i.test(trimmed)) {
        return {
          success: false,
          requiresManualFallback: true,
          statusMessage:
            'โพสต์นี้มีการตั้งค่าความเป็นส่วนตัวหรือ Facebook จำกัดการเข้าถึงอัตโนมัติ กรุณาคัดลอกข้อความไปวางในแท็บ "วางข้อความเอง"',
        };
      }

      const matchedSample = SAMPLE_FACEBOOK_POSTS.find(
        (s) => trimmed.toLowerCase().includes(s.id.split('-')[1]) || s.url === trimmed
      );

      if (matchedSample) {
        return {
          success: true,
          suggestedTitle: matchedSample.title,
          extractedText: matchedSample.rawText,
          statusMessage: 'ดึงข้อมูลโพสต์จาก Facebook สำเร็จ (ข้อมูลจำลองสำหรับทดสอบ)',
        };
      }

      return {
        success: true,
        suggestedTitle: 'ประชาสัมพันธ์กิจกรรมพัฒนาชุมชน อบต.ท่าตูม',
        extractedText: `องค์การบริหารส่วนตำบลท่าตูม ขอประชาสัมพันธ์เชิญชวนประชาชนในพื้นที่ตำบลท่าตูม เข้าร่วมกิจกรรม Big Cleaning Day พัฒนาทำความสะอาดถนนสายหลักและพื้นที่สาธารณะประจำตำบล ในวันเสาร์ที่ 28 พฤศจิกายน 2569 เวลา 08.30 - 12.00 น. ณ บริเวณหน้าสำนักงาน อบต.ท่าตูม เพื่อความสะอาดและความเป็นระเบียบเรียบร้อยของชุมชน (ดึงข้อมูลจำลองจากลิงก์: ${trimmed})`,
        statusMessage:
          'ดึงข้อความเบื้องต้นสำเร็จ (โหมดทดลอง) สามารถตรวจสอบและกดวิเคราะห์สคริปต์ได้ทันที',
      };
    }

    // Production Mode: Facebook scraping happens inside n8n during generate-script,
    // or user can proceed directly with the URL to POST /webhook/pr-news-generate-script.
    return {
      success: true,
      statusMessage:
        'พร้อมส่งลิงก์โพสต์ไปยัง n8n Webhook แล้ว กดปุ่ม "วิเคราะห์และสร้างสคริปต์" ด้านล่าง (หากโพสต์ถูกจำกัดสิทธิ์ แนะนำให้วางข้อความสำรองในแท็บวางข้อความเอง)',
    };
  },

  /**
   * POST /webhook/pr-news-generate-script
   */
  async generateScript(
    request: GenerateScriptRequest,
    settings: SystemSettings
  ): Promise<GenerateScriptResponse> {
    if (settings.apiMode === 'mock') {
      await wait(1100);

      const sourceContent =
        request.sourceText.trim() ||
        (request.sourceUrl
          ? `ข่าวประชาสัมพันธ์จากโพสต์ Facebook องค์การบริหารส่วนตำบลท่าตูม (${request.sourceUrl}) เชิญชวนพี่น้องประชาชนติดตามข่าวสารและเข้าร่วมกิจกรรมบริการประชาชน ณ ที่ทำการ อบต.ท่าตูม ในวันและเวลาราชการ โทร 044-591-119`
          : '');

      if (!sourceContent) {
        return {
          success: false,
          error: 'ไม่พบข้อความต้นฉบับหรือลิงก์โพสต์สำหรับสร้างสคริปต์',
          isMock: true,
        };
      }

      const matched = SAMPLE_FACEBOOK_POSTS.find(
        (s) => s.url === request.sourceUrl || s.rawText.trim() === sourceContent.trim()
      );

      if (matched && request.sourceText.trim() === matched.rawText.trim()) {
        const result = buildMockBroadcastScript(
          matched.rawText,
          settings.organizationName
        );
        return {
          success: true,
          isMock: true,
          data: {
            title: matched.title,
            category: matched.category,
            script: result.script,
          },
        };
      }

      const generated = buildMockBroadcastScript(
        sourceContent,
        settings.organizationName
      );

      return {
        success: true,
        isMock: true,
        data: generated,
      };
    }

    // Production Mode -> Real n8n Webhook Call
    const baseUrl = normalizeWebhookBaseUrl(settings.n8nBaseUrl);
    if (!baseUrl) {
      return {
        success: false,
        error: 'ยังไม่ได้ตั้งค่า n8n Webhook URL ในหน้าตั้งค่าระบบ',
      };
    }

    try {
      const response = await fetch(`${baseUrl}/webhook/pr-news-generate-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceType: request.sourceType,
          sourceUrl: request.sourceUrl,
          sourceText: request.sourceText,
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `การเชื่อมต่อ n8n ล้มเหลว (HTTP ${response.status}) กรุณาตรวจสอบ Webhook หรือวางข้อความเอง`,
        };
      }

      const payload = (await response.json()) as GenerateScriptResponse;
      if (!payload.success || !payload.data?.script) {
        return {
          success: false,
          error: payload.error || 'n8n ไม่ได้ส่งข้อมูลสคริปต์กลับมา กรุณาตรวจสอบโครงสร้าง Response',
        };
      }

      return {
        success: true,
        isMock: false,
        data: {
          title: payload.data.title || 'ข่าวประชาสัมพันธ์ อบต.ท่าตูม',
          category: payload.data.category || 'ประชาสัมพันธ์ทั่วไป',
          script: payload.data.script,
        },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ n8n ได้';
      return {
        success: false,
        error: `เกิดข้อผิดพลาดในการเชื่อมต่อ n8n Webhook: ${msg}`,
      };
    }
  },

  /**
   * POST /webhook/pr-news-generate-audio
   * Supports both JSON ({ success, data: { audioUrl, fileName } }) and Binary Audio streams.
   */
  async generateAudio(
    request: GenerateAudioRequest,
    settings: SystemSettings
  ): Promise<GenerateAudioResponse> {
    if (!request.script.trim()) {
      return {
        success: false,
        error: 'กรุณาระบุเนื้อหาสคริปต์ก่อนสร้างไฟล์เสียง',
      };
    }

    if (settings.apiMode === 'mock') {
      await wait(1350);

      const estimatedSeconds = estimateThaiSpeechDuration(
        request.script,
        request.speed
      );
      const synth = synthesizeMockBroadcastAudio({
        estimatedSeconds,
        voice: request.voice,
        speed: request.speed,
        tone: request.tone,
      });

      return {
        success: true,
        isMock: true,
        data: {
          audioUrl: synth.audioUrl,
          fileName: buildSafeFileName(request.title || 'pr-news', 'wav'),
          durationSeconds: estimatedSeconds,
          mimeType: synth.mimeType,
        },
      };
    }

    // Production Mode -> Real n8n Webhook Call
    const baseUrl = normalizeWebhookBaseUrl(settings.n8nBaseUrl);
    if (!baseUrl) {
      return {
        success: false,
        error: 'ยังไม่ได้ตั้งค่า n8n Webhook URL ในหน้าตั้งค่าระบบ',
      };
    }

    try {
      const response = await fetch(`${baseUrl}/webhook/pr-news-generate-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: request.script,
          voice: request.voice,
          speed: request.speed,
          language: request.language,
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `สร้างไฟล์เสียงไม่สำเร็จ (HTTP ${response.status})`,
        };
      }

      const contentType = (response.headers.get('content-type') || '').toLowerCase();

      // Case 1: Backend returns Binary Audio (audio/mpeg, audio/wav, application/octet-stream)
      if (
        contentType.includes('audio/') ||
        contentType.includes('application/octet-stream')
      ) {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const disposition = response.headers.get('content-disposition') || '';
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        const rawFileName = match?.[1]?.replace(/['"]/g, '');
        const ext = contentType.includes('wav') ? 'wav' : 'mp3';

        return {
          success: true,
          isMock: false,
          data: {
            audioUrl: objectUrl,
            fileName: rawFileName || buildSafeFileName(request.title || 'pr-news', ext),
            durationSeconds: estimateThaiSpeechDuration(request.script, request.speed),
            mimeType: blob.type || 'audio/mpeg',
          },
        };
      }

      // Case 2: Backend returns JSON with audioUrl
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { audioUrl?: string; fileName?: string; durationSeconds?: number };
        error?: string;
      };

      if (!payload.success || !payload.data?.audioUrl) {
        return {
          success: false,
          error: payload.error || 'n8n ไม่ได้ส่งไฟล์เสียงหรือ Audio URL กลับมา',
        };
      }

      return {
        success: true,
        isMock: false,
        data: {
          audioUrl: payload.data.audioUrl,
          fileName:
            payload.data.fileName ||
            buildSafeFileName(request.title || 'pr-news', 'mp3'),
          durationSeconds:
            payload.data.durationSeconds ||
            estimateThaiSpeechDuration(request.script, request.speed),
          mimeType: 'audio/mpeg',
        },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อบริการสร้างเสียงได้';
      return {
        success: false,
        error: `เกิดข้อผิดพลาดในการสร้างไฟล์เสียง: ${msg}`,
      };
    }
  },

  async testWebhookConnection(baseUrl: string): Promise<{
    ok: boolean;
    message: string;
  }> {
    const normalized = normalizeWebhookBaseUrl(baseUrl);
    if (!normalized) {
      return { ok: false, message: 'กรุณากรอก URL ของ n8n Webhook ก่อนทดสอบ' };
    }
    try {
      new URL(normalized);
    } catch {
      return { ok: false, message: 'รูปแบบ URL ไม่ถูกต้อง (ต้องขึ้นต้นด้วย https:// หรือ http://)' };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${normalized}/webhook/pr-news-generate-script`, {
        method: 'OPTIONS',
        signal: controller.signal,
      });
      clearTimeout(timer);
      return {
        ok: true,
        message: `สามารถเข้าถึงเซิร์ฟเวอร์ปลายทางได้ (สถานะตอบกลับ ${res.status})`,
      };
    } catch {
      return {
        ok: false,
        message:
          'ไม่สามารถติดต่อปลายทางได้จากเบราว์เซอร์ (อาจติด CORS หรือเซิร์ฟเวอร์ยังไม่เปิดใช้งาน)',
      };
    }
  },
};
