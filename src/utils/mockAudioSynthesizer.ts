import { ToneOption, VoiceOption } from '../types/pr';

export interface SynthesizedMockAudio {
  audioUrl: string;
  durationSeconds: number;
  mimeType: string;
}

/**
 * Generates a real, valid, playable WAV audio Blob in-memory for Mock Mode testing.
 * Starts with a clean 3-note community radio chime, followed by a gentle
 * broadcast cadence tone envelope whose pitch reflects the selected voice & tone.
 */
export function synthesizeMockBroadcastAudio(params: {
  estimatedSeconds: number;
  voice: VoiceOption;
  speed: number;
  tone?: ToneOption;
}): SynthesizedMockAudio {
  const sampleRate = 22050;
  // Cap demo audio preview between 6s and 14s so playback & download remain instant in browser memory
  const previewDuration = Math.min(14, Math.max(6, Math.round(params.estimatedSeconds / 4)));
  const totalSamples = Math.floor(sampleRate * previewDuration);
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // Standard RIFF/WAVE header (16-bit PCM mono)
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, totalSamples * 2, true);

  // Radio broadcast chime notes (C5 - E5 - G5 or F4 - A4 - C5 depending on voice)
  const chimeNotes =
    params.voice === 'female' ? [523.25, 659.25, 783.99] : [349.23, 440.0, 523.25];
  const baseVoiceFreq = params.voice === 'female' ? 235 : 145;
  const cadenceRate = 3.2 * (params.speed || 1);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    if (t < 1.8) {
      // Pleasant 3-note broadcast station chime
      const noteIdx = Math.min(2, Math.floor(t / 0.55));
      const noteT = t - noteIdx * 0.55;
      const freq = chimeNotes[noteIdx];
      const env = Math.sin(Math.min(1, noteT / 0.04) * (Math.PI / 2)) * Math.exp(-noteT * 3.8);
      sample = (Math.sin(2 * Math.PI * freq * t) + 0.25 * Math.sin(4 * Math.PI * freq * t)) * env * 0.28;
    } else if (t >= 2.0 && t <= previewDuration - 0.8) {
      // Gentle speech-cadence harmonic pulse indicating mock broadcast track
      const speechT = t - 2.0;
      const syllableMod = Math.max(0, Math.sin(2 * Math.PI * cadenceRate * speechT));
      const phrasePause = Math.sin(2 * Math.PI * 0.45 * speechT) > -0.65 ? 1 : 0.15;
      const pitchContour = baseVoiceFreq * (1 + 0.08 * Math.sin(2 * Math.PI * 0.8 * speechT));
      const fadeOut =
        t > previewDuration - 1.3 ? Math.max(0, (previewDuration - 0.8 - t) / 0.5) : 1;
      const carrier =
        0.6 * Math.sin(2 * Math.PI * pitchContour * t) +
        0.25 * Math.sin(2 * Math.PI * pitchContour * 2 * t);
      sample = carrier * syllableMod * phrasePause * fadeOut * 0.12;
    } else if (t > previewDuration - 0.8) {
      // Soft closing bell
      const endT = t - (previewDuration - 0.8);
      const env = Math.exp(-endT * 4.5);
      sample = Math.sin(2 * Math.PI * chimeNotes[2] * t) * env * 0.2;
    }

    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + i * 2, clamped * 0x7fff, true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  const audioUrl = URL.createObjectURL(blob);

  return {
    audioUrl,
    durationSeconds: previewDuration,
    mimeType: 'audio/wav',
  };
}
