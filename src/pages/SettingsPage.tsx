import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Save,
  ShieldCheck,
  Webhook,
} from 'lucide-react';
import { prApiService } from '../services/prApiService';
import { ApiMode, SystemSettings, ToneOption, VoiceOption } from '../types/pr';

interface SettingsPageProps {
  settings: SystemSettings;
  onSaveSettings: (nextSettings: SystemSettings) => void;
  onResetSessionData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onSaveSettings,
  onResetSessionData,
}) => {
  const [formState, setFormState] = useState<SystemSettings>(settings);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [confirmResetSession, setConfirmResetSession] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...formState,
      organizationName:
        formState.organizationName.trim() || 'องค์การบริหารส่วนตำบลท่าตูม',
      announcerName:
        formState.announcerName.trim() || 'เจ้าหน้าที่ประชาสัมพันธ์ อบต.ท่าตูม',
      n8nBaseUrl: formState.n8nBaseUrl.trim(),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleTestWebhook = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await prApiService.testWebhookConnection(formState.n8nBaseUrl);
      setTestResult(result);
    } finally {
      setIsTesting(false);
    }
  };

  const normalizedUrl =
    formState.n8nBaseUrl.trim().replace(/\/+$/, '') || 'https://your-n8n-domain';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Organization & Announcer Defaults */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-display text-base font-bold text-slate-900">
            ข้อมูลหน่วยงานและค่าตั้งต้นการผลิตเสียง
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            กำหนดค่าเริ่มต้นสำหรับสคริปต์และการสังเคราะห์เสียงในเซสชันปัจจุบัน
          </p>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="setting-org"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              ชื่อหน่วยงาน
            </label>
            <input
              id="setting-org"
              type="text"
              value={formState.organizationName}
              onChange={(e) =>
                setFormState({ ...formState, organizationName: e.target.value })
              }
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="setting-announcer"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              ชื่อผู้ประกาศ / เจ้าหน้าที่ผู้รับผิดชอบ
            </label>
            <input
              id="setting-announcer"
              type="text"
              value={formState.announcerName}
              onChange={(e) =>
                setFormState({ ...formState, announcerName: e.target.value })
              }
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="setting-lang"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              ภาษาเริ่มต้น
            </label>
            <select
              id="setting-lang"
              value={formState.defaultLanguage}
              onChange={(e) =>
                setFormState({ ...formState, defaultLanguage: e.target.value })
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              <option value="th-TH">ภาษาไทย (th-TH)</option>
              <option value="en-US">ภาษาอังกฤษ (en-US)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="setting-voice"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              เสียงเริ่มต้น
            </label>
            <select
              id="setting-voice"
              value={formState.defaultVoice}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  defaultVoice: e.target.value as VoiceOption,
                })
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              <option value="female">เสียงผู้หญิง (Female)</option>
              <option value="male">เสียงผู้ชาย (Male)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="setting-speed"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              ความเร็วเสียงเริ่มต้น
            </label>
            <select
              id="setting-speed"
              value={formState.defaultSpeed}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  defaultSpeed: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              <option value={0.85}>ช้าชัดเจน (0.85x)</option>
              <option value={1.0}>ปกติ (1.0x)</option>
              <option value={1.15}>กระชับ (1.15x)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="setting-tone"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              โทนเสียงเริ่มต้น
            </label>
            <select
              id="setting-tone"
              value={formState.defaultTone}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  defaultTone: e.target.value as ToneOption,
                })
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              <option value="polite">สุภาพ เป็นมืออาชีพและเป็นกันเอง</option>
              <option value="warm">อบอุ่น เข้าถึงประชาชน</option>
              <option value="urgent">กระชับ ทันเหตุการณ์</option>
            </select>
          </div>
        </div>
      </section>

      {/* API Mode & n8n Webhook Configuration */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2.5">
          <Webhook className="w-4 h-4 text-blue-700" />
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              การเชื่อมต่อ n8n Webhook API
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              สลับระหว่างโหมดทดลองระบบ (Mock Mode) และโหมดเชื่อมต่อ n8n จริง (Production Mode)
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Mode Switcher */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              โหมดการทำงานของระบบ
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  {
                    id: 'mock',
                    title: 'Mock Mode (โหมดทดสอบระบบ)',
                    desc: 'จำลองการวิเคราะห์สคริปต์และสร้างไฟล์เสียงตัวอย่างในเบราว์เซอร์โดยไม่ต้องเชื่อมต่อ n8n',
                  },
                  {
                    id: 'production',
                    title: 'Production Mode (เชื่อมต่อ n8n จริง)',
                    desc: 'ส่งคำขอ HTTP POST ไปยัง n8n Webhook Endpoints เพื่อสร้างสคริปต์และไฟล์เสียง MP3 จริง',
                  },
                ] as { id: ApiMode; title: string; desc: string }[]
              ).map((mode) => {
                const selected = formState.apiMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setFormState({ ...formState, apiMode: mode.id })}
                    className={`p-4 rounded-xl border text-left transition-colors ${
                      selected
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {mode.title}
                      </span>
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selected
                            ? 'border-blue-700 bg-blue-700'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {mode.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* n8n Base URL */}
          <div>
            <label
              htmlFor="setting-n8n-url"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              n8n Webhook Base URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                id="setting-n8n-url"
                type="url"
                value={formState.n8nBaseUrl}
                onChange={(e) => {
                  setFormState({ ...formState, n8nBaseUrl: e.target.value });
                  setTestResult(null);
                }}
                placeholder="https://n8n.thatum-sao.go.th"
                className="flex-1 px-3.5 py-2 text-sm font-mono rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={isTesting}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังทดสอบ...</span>
                  </>
                ) : (
                  <span>ทดสอบการเชื่อมต่อ</span>
                )}
              </button>
            </div>

            {testResult && (
              <div
                className={`mt-2.5 rounded-lg px-3.5 py-2.5 text-xs border flex items-start gap-2 ${
                  testResult.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="mt-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-mono text-slate-600">
              <div className="font-sans font-semibold text-slate-700 mb-1">
                Endpoint ที่ระบบเรียกใช้งานเมื่อเปิด Production Mode:
              </div>
              <div className="truncate">
                POST {normalizedUrl}/webhook/pr-news-generate-script
              </div>
              <div className="truncate">
                POST {normalizedUrl}/webhook/pr-news-generate-audio
              </div>
            </div>
          </div>

          {/* Security & Stateless Reminder */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
              <p className="font-semibold text-slate-800">
                นโยบายความปลอดภัยและการทำงานแบบ Stateless
              </p>
              <p>
                ระบบไม่มีการจัดเก็บ API Key, API Secret, Token หรือข้อมูลส่วนตัวลงใน Frontend, Local Storage หรือฐานข้อมูลใด ๆ ข้อมูลข่าวและไฟล์เสียงทั้งหมดจะทำงานในหน่วยความจำระหว่างการใช้งาน (In-Memory Session) และจะถูกล้างเมื่อรีเฟรชหน้าเว็บ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {confirmResetSession ? (
            <div className="inline-flex items-center gap-2 text-xs">
              <span className="text-red-700 font-medium">
                ยืนยันล้างรายการข่าวและเสียงทั้งหมดในเซสชันนี้?
              </span>
              <button
                type="button"
                onClick={() => {
                  onResetSessionData();
                  setConfirmResetSession(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
              >
                ยืนยันล้างข้อมูล
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetSession(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmResetSession(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างข้อมูลเซสชันปัจจุบัน</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {savedNotice && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>บันทึกการตั้งค่าแล้ว</span>
            </span>
          )}
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกการตั้งค่า</span>
          </button>
        </div>
      </div>
    </form>
  );
};
