import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Eraser,
  FileText,
  Link2,
  Loader2,
  Mic,
  RefreshCw,
  Save,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { AudioStudioPlayer } from '../components/AudioStudioPlayer';
import { SAMPLE_FACEBOOK_POSTS } from '../data/mockNewsData';
import { prApiService } from '../services/prApiService';
import {
  AudioItem,
  NewsCategory,
  NewsItem,
  NewsSourceType,
  SystemSettings,
  ToneOption,
  VoiceOption,
} from '../types/pr';
import {
  NEWS_CATEGORIES,
  estimateThaiSpeechDuration,
  formatDurationSeconds,
} from '../utils/thaiFormat';

interface CreateNewsPageProps {
  settings: SystemSettings;
  editingNews: NewsItem | null;
  existingAudioForEditing?: AudioItem;
  onClearEditing: () => void;
  onSaveNewsRecord: (news: NewsItem) => void;
  onSaveAudioRecord: (newsId: string, audio: AudioItem) => void;
}

const SCRIPT_GUIDELINES = [
  'ใช้ภาษาไทยสุภาพและเป็นธรรมชาติ เหมาะกับการฟัง',
  'สรุปเนื้อหาให้กระชับ เหมาะกับการประกาศผ่านเครื่องกระจายเสียง',
  'เน้นการดำเนินงานของ อบต.ท่าตูม และประโยชน์ที่ประชาชนได้รับ',
  'ห้ามแต่งเติมข้อมูลที่ไม่มีอยู่ในต้นฉบับ',
  'รักษาชื่อบุคคล สถานที่ วันที่ และตัวเลขตามต้นฉบับอย่างครบถ้วน',
  'ตัดรายละเอียดหรือแฮชแท็กที่ไม่จำเป็นออก',
  'หลีกเลี่ยงภาษาราชการที่ซับซ้อนเกินไป',
  'ใช้คำลงท้ายว่า "ค่ะ" เพื่อความสุภาพเป็นกันเอง',
  'ความยาวเหมาะสมประมาณ 30 - 60 วินาที',
  'เรียบเรียงประโยคให้อ่านออกเสียงได้ลื่นไหลไม่สะดุด',
];

export const CreateNewsPage: React.FC<CreateNewsPageProps> = ({
  settings,
  editingNews,
  existingAudioForEditing,
  onClearEditing,
  onSaveNewsRecord,
  onSaveAudioRecord,
}) => {
  // Current News Record ID in session
  const [activeNewsId, setActiveNewsId] = useState<string>(
    () => editingNews?.id || `news-${Date.now()}`
  );

  // Section A: Input state
  const [sourceType, setSourceType] = useState<NewsSourceType>(
    editingNews?.sourceType || 'facebook_url'
  );
  const [sourceUrl, setSourceUrl] = useState(editingNews?.sourceUrl || '');
  const [sourceText, setSourceText] = useState(editingNews?.sourceText || '');
  const [isFetchingPost, setIsFetchingPost] = useState(false);
  const [fetchFeedback, setFetchFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // Section B: Script state
  const [title, setTitle] = useState(editingNews?.title || '');
  const [category, setCategory] = useState<NewsCategory>(
    editingNews?.category || 'ประชาสัมพันธ์ทั่วไป'
  );
  const [script, setScript] = useState(editingNews?.script || '');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [scriptSavedFeedback, setScriptSavedFeedback] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [scriptIsMock, setScriptIsMock] = useState(
    settings.apiMode === 'mock'
  );

  // Section C: Audio Studio state
  const [language, setLanguage] = useState(settings.defaultLanguage);
  const [voice, setVoice] = useState<VoiceOption>(settings.defaultVoice);
  const [speed, setSpeed] = useState<number>(settings.defaultSpeed);
  const [tone, setTone] = useState<ToneOption>(settings.defaultTone);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [generatedAudio, setGeneratedAudio] = useState<AudioItem | null>(
    existingAudioForEditing || null
  );

  // Sync if editingNews prop changes
  useEffect(() => {
    if (editingNews) {
      setActiveNewsId(editingNews.id);
      setSourceType(editingNews.sourceType);
      setSourceUrl(editingNews.sourceUrl);
      setSourceText(editingNews.sourceText);
      setTitle(editingNews.title);
      setCategory(editingNews.category);
      setScript(editingNews.script);
      setGeneratedAudio(existingAudioForEditing || null);
      setFetchFeedback(null);
      setScriptError(null);
      setAudioError(null);
    }
  }, [editingNews, existingAudioForEditing]);

  // Sync defaults if settings change and user hasn't started editing audio
  useEffect(() => {
    if (!editingNews) {
      setLanguage(settings.defaultLanguage);
      setVoice(settings.defaultVoice);
      setSpeed(settings.defaultSpeed);
      setTone(settings.defaultTone);
    }
  }, [settings, editingNews]);

  const handleResetWorkspace = () => {
    onClearEditing();
    setActiveNewsId(`news-${Date.now()}`);
    setSourceUrl('');
    setSourceText('');
    setTitle('');
    setCategory('ประชาสัมพันธ์ทั่วไป');
    setScript('');
    setFetchFeedback(null);
    setScriptError(null);
    setAudioError(null);
    setGeneratedAudio(null);
    setScriptSavedFeedback(false);
  };

  const handleFetchFacebookPost = async () => {
    setIsFetchingPost(true);
    setFetchFeedback(null);
    try {
      const result = await prApiService.fetchFacebookPost(sourceUrl, settings);
      if (result.success) {
        if (result.extractedText) {
          setSourceText(result.extractedText);
        }
        if (result.suggestedTitle && !title) {
          setTitle(result.suggestedTitle);
        }
        setFetchFeedback({
          type: 'success',
          message: result.statusMessage,
        });
      } else {
        setFetchFeedback({
          type: result.requiresManualFallback ? 'warning' : 'error',
          message: result.statusMessage,
        });
      }
    } finally {
      setIsFetchingPost(false);
    }
  };

  const handleLoadSample = (sampleIdx: number) => {
    const sample = SAMPLE_FACEBOOK_POSTS[sampleIdx];
    if (!sample) return;
    if (sourceType === 'facebook_url') {
      setSourceUrl(sample.url);
      setSourceText(sample.rawText);
      setFetchFeedback({
        type: 'success',
        message: `นำเข้าโพสต์ตัวอย่าง "${sample.label}" เรียบร้อยแล้ว`,
      });
    } else {
      setSourceText(sample.rawText);
    }
    setScriptError(null);
  };

  const canAnalyze =
    sourceType === 'facebook_url'
      ? Boolean(sourceUrl.trim() || sourceText.trim())
      : Boolean(sourceText.trim());

  const handleGenerateScript = async () => {
    if (!canAnalyze) {
      setScriptError(
        sourceType === 'facebook_url'
          ? 'กรุณาวาง Facebook Post URL หรือดึงข้อมูลโพสต์ก่อนวิเคราะห์'
          : 'กรุณาวางข้อความข่าวก่อนวิเคราะห์และสร้างสคริปต์'
      );
      return;
    }

    setIsGeneratingScript(true);
    setScriptError(null);
    setScriptSavedFeedback(false);

    try {
      const response = await prApiService.generateScript(
        {
          sourceType,
          sourceUrl: sourceUrl.trim(),
          sourceText: sourceText.trim(),
        },
        settings
      );

      if (!response.success || !response.data) {
        setScriptError(response.error || 'ไม่สามารถสร้างสคริปต์ได้ กรุณาลองใหม่อีกครั้ง');
        return;
      }

      const nextTitle = response.data.title;
      const nextCategory = response.data.category;
      const nextScript = response.data.script;

      setTitle(nextTitle);
      setCategory(nextCategory);
      setScript(nextScript);
      setScriptIsMock(Boolean(response.isMock));

      // Auto-save draft/generated script into session state
      const nowIso = new Date().toISOString();
      onSaveNewsRecord({
        id: activeNewsId,
        title: nextTitle,
        category: nextCategory,
        sourceType,
        sourceUrl: sourceUrl.trim(),
        sourceText: sourceText.trim(),
        script: nextScript,
        scriptStatus: 'generated',
        audioStatus: generatedAudio ? 'generated' : 'pending',
        audioId: generatedAudio?.id,
        createdAt: editingNews?.createdAt || nowIso,
        updatedAt: nowIso,
        isSample: false,
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleSaveScript = () => {
    if (!script.trim()) {
      setScriptError('กรุณากรอกเนื้อหาสคริปต์ก่อนบันทึก');
      return;
    }

    const finalTitle =
      title.trim() || 'ข่าวประชาสัมพันธ์ องค์การบริหารส่วนตำบลท่าตูม';
    const nowIso = new Date().toISOString();

    onSaveNewsRecord({
      id: activeNewsId,
      title: finalTitle,
      category,
      sourceType,
      sourceUrl: sourceUrl.trim(),
      sourceText: sourceText.trim(),
      script: script.trim(),
      scriptStatus: 'generated',
      audioStatus: generatedAudio ? 'generated' : 'pending',
      audioId: generatedAudio?.id,
      createdAt: editingNews?.createdAt || nowIso,
      updatedAt: nowIso,
      isSample: false,
    });

    setTitle(finalTitle);
    setScriptError(null);
    setScriptSavedFeedback(true);
    setTimeout(() => setScriptSavedFeedback(false), 2500);
  };

  const handleCopyScript = async () => {
    if (!script.trim()) return;
    try {
      await navigator.clipboard.writeText(script);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 1800);
    } catch {
      setScriptError('เบราว์เซอร์ไม่อนุญาตให้คัดลอกอัตโนมัติ กรุณาเลือกข้อความเพื่อคัดลอก');
    }
  };

  const handleGenerateAudio = async () => {
    if (!script.trim()) {
      setAudioError('กรุณาสร้างหรือกรอกสคริปต์ในขั้นตอนที่ 2 ก่อนสร้างไฟล์เสียง');
      return;
    }

    setIsGeneratingAudio(true);
    setAudioError(null);
    setAudioProgress(15);

    const progressTimer = setInterval(() => {
      setAudioProgress((prev) => (prev < 88 ? prev + 12 : prev));
    }, 220);

    try {
      const finalTitle =
        title.trim() || 'ข่าวประชาสัมพันธ์ องค์การบริหารส่วนตำบลท่าตูม';

      const response = await prApiService.generateAudio(
        {
          script: script.trim(),
          voice,
          speed,
          language,
          tone,
          title: finalTitle,
        },
        settings
      );

      clearInterval(progressTimer);

      if (!response.success || !response.data) {
        setAudioProgress(0);
        setAudioError(response.error || 'สร้างไฟล์เสียงไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        return;
      }

      setAudioProgress(100);

      const nowIso = new Date().toISOString();
      const newAudio: AudioItem = {
        id: `aud-${Date.now()}`,
        newsId: activeNewsId,
        newsTitle: finalTitle,
        fileName: response.data.fileName,
        audioUrl: response.data.audioUrl,
        durationSeconds: response.data.durationSeconds,
        voice,
        speed,
        tone,
        language,
        createdAt: nowIso,
        isMock: Boolean(response.isMock),
        mimeType: response.data.mimeType,
      };

      setGeneratedAudio(newAudio);

      // Ensure news record exists and is marked audioStatus: 'generated'
      onSaveNewsRecord({
        id: activeNewsId,
        title: finalTitle,
        category,
        sourceType,
        sourceUrl: sourceUrl.trim(),
        sourceText: sourceText.trim(),
        script: script.trim(),
        scriptStatus: 'generated',
        audioStatus: 'generated',
        audioId: newAudio.id,
        createdAt: editingNews?.createdAt || nowIso,
        updatedAt: nowIso,
        isSample: false,
      });

      onSaveAudioRecord(activeNewsId, newAudio);
    } finally {
      clearInterval(progressTimer);
      setIsGeneratingAudio(false);
    }
  };

  const estimatedSecs = estimateThaiSpeechDuration(script, speed);
  const currentStep = generatedAudio ? 3 : script.trim() ? 2 : 1;

  return (
    <div className="space-y-6">
      {/* Workflow Stepper & Session Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          {[
            { step: 1, label: '1. นำเข้าข่าว' },
            { step: 2, label: '2. วิเคราะห์และแก้ไขสคริปต์' },
            { step: 3, label: '3. สร้างและดาวน์โหลดเสียง' },
          ].map((item, index) => {
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            return (
              <React.Fragment key={item.step}>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center tabular-nums ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : item.step}
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
                      isCurrent
                        ? 'text-slate-900 font-semibold'
                        : isCompleted
                        ? 'text-emerald-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {index < 2 && (
                  <span
                    className="hidden sm:inline-block w-6 h-px bg-slate-200"
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          {settings.apiMode === 'mock' && (
            <span className="text-xs font-medium text-amber-700">
              โหมดทดลอง (Mock Mode)
            </span>
          )}
          <button
            type="button"
            onClick={handleResetWorkspace}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>เริ่มข่าวใหม่</span>
          </button>
        </div>
      </div>

      {/* SECTION A: นำเข้าข่าว */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              ส่วนที่ 1: นำเข้าข้อมูลข่าวประชาสัมพันธ์
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              วางลิงก์โพสต์ Facebook ของ อบต.ท่าตูม หรือวางข้อความข่าวต้นฉบับด้วยตนเอง
            </p>
          </div>

          {/* Tabs */}
          <div className="inline-flex items-center p-1 rounded-lg bg-slate-100">
            <button
              type="button"
              onClick={() => setSourceType('facebook_url')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                sourceType === 'facebook_url'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Facebook Link</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceType('manual_text')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                sourceType === 'manual_text'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>วางข้อความเอง</span>
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Quick Sample Loaders */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">ตัวอย่างข่าว อบต.ท่าตูม:</span>
            {SAMPLE_FACEBOOK_POSTS.map((sample, idx) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleLoadSample(idx)}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-800 transition-colors whitespace-nowrap"
              >
                {sample.label}
              </button>
            ))}
          </div>

          {sourceType === 'facebook_url' ? (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="facebook-url-input"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  ลิงก์โพสต์ Facebook (Facebook Post URL)
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    id="facebook-url-input"
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => {
                      setSourceUrl(e.target.value);
                      setFetchFeedback(null);
                    }}
                    placeholder="https://www.facebook.com/ThatumSAO/posts/..."
                    className="flex-1 px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleFetchFacebookPost}
                    disabled={isFetchingPost || !sourceUrl.trim()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    {isFetchingPost ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>กำลังดึงข้อมูล...</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        <span>ดึงข้อมูลโพสต์</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {sourceUrl.trim() && (
                <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 break-all">
                  <span className="font-semibold text-slate-700">URL ที่ระบุ: </span>
                  {sourceUrl}
                </div>
              )}

              {fetchFeedback && (
                <div
                  className={`rounded-lg px-3.5 py-2.5 text-xs border flex items-start gap-2 ${
                    fetchFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : fetchFeedback.type === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {fetchFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-1">
                    <p>{fetchFeedback.message}</p>
                    {fetchFeedback.type !== 'success' && (
                      <button
                        type="button"
                        onClick={() => setSourceType('manual_text')}
                        className="font-semibold underline hover:no-underline"
                      >
                        สลับไปยังแท็บ "วางข้อความเอง"
                      </button>
                    )}
                  </div>
                </div>
              )}

              {sourceText.trim() && (
                <div>
                  <label
                    htmlFor="fetched-preview-text"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    ข้อความที่ดึงได้จากโพสต์ (สามารถแก้ไขเพิ่มเติมได้)
                  </label>
                  <textarea
                    id="fetched-preview-text"
                    rows={4}
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              )}

              <p className="text-xs text-slate-500">
                หมายเหตุ: การดึงข้อมูลจาก Facebook URL อาจมีข้อจำกัดด้านความเป็นส่วนตัวในบางโพสต์ หากไม่สามารถดึงข้อความได้ กรุณากดแท็บ{' '}
                <button
                  type="button"
                  onClick={() => setSourceType('manual_text')}
                  className="text-blue-700 font-medium underline hover:no-underline"
                >
                  วางข้อความเอง
                </button>{' '}
                เพื่อวางเนื้อหาสำรอง
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="manual-news-textarea"
                  className="block text-xs font-semibold text-slate-700"
                >
                  ข้อความข่าวประชาสัมพันธ์จาก Facebook
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 tabular-nums">
                    {sourceText.length} ตัวอักษร
                  </span>
                  {sourceText && (
                    <button
                      type="button"
                      onClick={() => setSourceText('')}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-red-700 transition-colors"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span>ล้างข้อความ</span>
                    </button>
                  )}
                </div>
              </div>
              <textarea
                id="manual-news-textarea"
                rows={6}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="วางข้อความข่าวประชาสัมพันธ์จากเพจ Facebook ของ อบต.ท่าตูม ที่นี่ เช่น ข่าวกิจกรรม แจ้งกำหนดการ วัน เวลา สถานที่ และเบอร์ติดต่อ..."
                className="w-full px-3.5 py-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          )}

          {/* Primary Analyze CTA */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              {settings.apiMode === 'mock'
                ? 'ระบบจะวิเคราะห์และเรียบเรียงสคริปต์จำลองตามข้อมูลที่คุณระบุ'
                : 'ระบบจะส่งข้อมูลไปยัง n8n Webhook (/webhook/pr-news-generate-script)'}
            </span>
            <button
              type="button"
              onClick={handleGenerateScript}
              disabled={isGeneratingScript || !canAnalyze}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {isGeneratingScript ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังวิเคราะห์และสร้างสคริปต์...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>วิเคราะห์และสร้างสคริปต์</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION B & C: Two-column Studio Grid on large screens */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* SECTION B: AI Script Generator */}
        <section className="xl:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                ส่วนที่ 2: สคริปต์อ่านออกเสียง (AI Script Generator)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ตรวจสอบความถูกต้องของชื่อ สถานที่ วันที่ ตัวเลข และปรับแก้ข้อความก่อนสร้างเสียง
              </p>
            </div>
            {script && scriptIsMock && (
              <span className="text-xs font-medium text-amber-700">
                สคริปต์จำลอง (Mock Mode)
              </span>
            )}
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {scriptError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{scriptError}</span>
              </div>
            )}

            {isGeneratingScript ? (
              <div className="space-y-3 py-4 animate-pulse">
                <div className="h-9 bg-slate-100 rounded-lg w-3/4" />
                <div className="h-9 bg-slate-100 rounded-lg w-1/3" />
                <div className="h-36 bg-slate-100 rounded-lg w-full" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="script-title-input"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      ชื่อข่าวประชาสัมพันธ์
                    </label>
                    <input
                      id="script-title-input"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="เช่น ประชาสัมพันธ์ฉีดวัคซีนป้องกันโรคพิษสุนัขบ้า"
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="script-category-select"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      ประเภทข่าว
                    </label>
                    <select
                      id="script-category-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as NewsCategory)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    >
                      {NEWS_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="script-content-textarea"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      เนื้อหาสคริปต์สำหรับอ่านออกเสียง
                    </label>
                    <div className="flex items-center gap-3 text-xs text-slate-500 tabular-nums">
                      <span>{script.length} ตัวอักษร</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          estimatedSecs >= 25 && estimatedSecs <= 65
                            ? 'text-emerald-700 font-medium'
                            : 'text-slate-600'
                        }
                      >
                        เวลาอ่านโดยประมาณ {formatDurationSeconds(estimatedSecs)} (เป้า 30–60 วินาที)
                      </span>
                    </div>
                  </div>
                  <textarea
                    id="script-content-textarea"
                    rows={7}
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="สคริปต์ที่วิเคราะห์แล้วจะแสดงที่นี่ หรือสามารถพิมพ์แก้ไขได้โดยตรง..."
                    className="w-full px-3.5 py-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 leading-[1.7] focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateScript}
                      disabled={isGeneratingScript || !canAnalyze}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>สร้างสคริปต์ใหม่</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyScript}
                      disabled={!script.trim()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {copiedScript ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>คัดลอกข้อความ</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveScript}
                    disabled={!script.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {scriptSavedFeedback ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>บันทึกสคริปต์แล้ว</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>บันทึกสคริปต์</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Collapsible Prompt Guidelines */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowGuidelines((prev) => !prev)}
                className="w-full flex items-center justify-between text-xs font-medium text-slate-600 hover:text-slate-900 py-1"
              >
                <span>เกณฑ์การเขียนสคริปต์มาตรฐานนักเขียนข่าว อบต.ท่าตูม (10 ข้อ)</span>
                {showGuidelines ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {showGuidelines && (
                <ol className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600 list-decimal list-inside bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  {SCRIPT_GUIDELINES.map((rule) => (
                    <li key={rule} className="leading-relaxed">
                      {rule}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </section>

        {/* SECTION C: Audio Generator (Audio Studio) */}
        <section className="xl:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 sm:px-6 py-4 bg-[#0F2440] text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold">
                  ส่วนที่ 3: Audio Studio
                </h2>
                <p className="text-[11px] text-slate-300">
                  สังเคราะห์เสียงอ่านสำหรับสถานีกระจายเสียง
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-blue-200">
              {language}
            </span>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* Voice Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="audio-language"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  ภาษา
                </label>
                <select
                  id="audio-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  <option value="th-TH">ภาษาไทย (Thai)</option>
                  <option value="en-US">ภาษาอังกฤษ (English)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="audio-voice"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  เสียงผู้พูด
                </label>
                <select
                  id="audio-voice"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value as VoiceOption)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  <option value="female">ผู้หญิง (Female - ค่าเริ่มต้น)</option>
                  <option value="male">ผู้ชาย (Male)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="audio-speed"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  ความเร็วเสียง
                </label>
                <select
                  id="audio-speed"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  <option value={0.85}>ช้าชัดเจน (0.85x)</option>
                  <option value={1.0}>ปกติ (1.0x - ค่าเริ่มต้น)</option>
                  <option value={1.15}>กระชับ (1.15x)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="audio-tone"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  โทนการพูด
                </label>
                <select
                  id="audio-tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as ToneOption)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  <option value="polite">สุภาพ เป็นมืออาชีพและเป็นกันเอง</option>
                  <option value="warm">อบอุ่น เข้าถึงประชาชน</option>
                  <option value="urgent">กระชับ ทันเหตุการณ์</option>
                </select>
              </div>
            </div>

            {/* Generate Audio Button */}
            <button
              type="button"
              onClick={handleGenerateAudio}
              disabled={isGeneratingAudio || !script.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50"
            >
              {isGeneratingAudio ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังสร้างไฟล์เสียงประกาศ...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Generate Audio (สร้างไฟล์เสียง)</span>
                </>
              )}
            </button>

            {/* Progress Indicator */}
            {isGeneratingAudio && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>กำลังสังเคราะห์เสียงภาษาไทย...</span>
                  <span className="font-mono tabular-nums">{audioProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-700 transition-all duration-200"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Audio Error */}
            {audioError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{audioError}</span>
              </div>
            )}

            {/* Audio Output / Empty State */}
            {generatedAudio ? (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>สร้างไฟล์เสียงสำเร็จ พร้อมรับฟังและดาวน์โหลด</span>
                  </span>
                </div>
                <AudioStudioPlayer
                  audioUrl={generatedAudio.audioUrl}
                  fileName={generatedAudio.fileName}
                  estimatedDuration={generatedAudio.durationSeconds}
                  isMock={generatedAudio.isMock}
                  scriptText={script}
                  playerId={`studio-${generatedAudio.id}`}
                />
              </div>
            ) : (
              !isGeneratingAudio && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center space-y-1.5">
                  <Volume2 className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-medium text-slate-700">
                    ยังไม่ได้สร้างไฟล์เสียงสำหรับข่าวนี้
                  </p>
                  <p className="text-[11px] text-slate-500">
                    ตรวจสอบสคริปต์ในส่วนที่ 2 และกดปุ่ม "Generate Audio" ด้านบนเพื่อฟังและดาวน์โหลดไฟล์เสียง
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
