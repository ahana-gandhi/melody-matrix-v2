/**
 * lyria.ts — Google Lyria music generation.
 *
 * Primary model : lyria-realtime-exp  (free, experimental — WebSocket streaming)
 * Fallback model: lyria-3-clip-preview (paid ~$0.04/clip, REST generateContent)
 *
 * The two models use DIFFERENT APIs:
 *   - lyria-realtime-exp   → aiClient.live.music.connect() WebSocket session
 *   - lyria-3-clip-preview → aiClient.models.generateContent() REST call (returns MP3)
 *
 * The fallback fires automatically on any primary-model API error.
 */

import { GoogleGenAI, MusicGenerationMode } from "@google/genai";
import type {
  LiveMusicCallbacks,
  LiveMusicGenerationConfig,
  LiveMusicServerMessage,
  LiveMusicSession,
} from "@google/genai";

export type ProgressCallback = (status: string, progress: number) => void;

export interface ComposeRequest {
  prompt: string;
  instrument?: string;
  tempo?: number;
  /** How many ms of audio to collect via the realtime model. Defaults to DEFAULT_CLIP_MS (28 s). */
  clipDurationMs?: number;
}

const BUILD_TIME_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

const PRIMARY_MODEL  = "models/lyria-realtime-exp";
const FALLBACK_MODEL = "lyria-3-clip-preview"; // REST generateContent, ~$0.04/clip

const SAMPLE_RATE     = 48000;
const CHANNELS        = 2;
const BITS_PER_SAMPLE = 16;

/** Default clip length — 28 s fits within one Lyria realtime session. */
const DEFAULT_CLIP_MS    = 28_000;
/** Hard abort if no audio arrives within this window. */
const CONNECT_TIMEOUT_MS = 45_000;

const WEBSOCKET_OPEN   = 1;
const WEBSOCKET_CLOSED = 3;

// ── Helpers ──────────────────────────────────────────────────────────────────

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

const decodeBase64Chunk = (chunk: string): Uint8Array => {
  const binary = atob(chunk);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const buildWavHeader = (
  dataLength: number,
  sampleRate: number,
  numChannels: number,
  bitsPerSample: number
): ArrayBuffer => {
  const header = new ArrayBuffer(44);
  const v      = new DataView(header);
  const ws     = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(offset + i, s.charCodeAt(i));
  };
  const byteRate   = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  ws(0,  "RIFF");
  v.setUint32(4,  36 + dataLength, true);
  ws(8,  "WAVE");
  ws(12, "fmt ");
  v.setUint32(16, 16,           true);
  v.setUint16(20, 1,            true);
  v.setUint16(22, numChannels,  true);
  v.setUint32(24, sampleRate,   true);
  v.setUint32(28, byteRate,     true);
  v.setUint16(32, blockAlign,   true);
  v.setUint16(34, bitsPerSample,true);
  ws(36, "data");
  v.setUint32(40, dataLength,   true);
  return header;
};

const combineChunks = (chunks: Uint8Array[]): Uint8Array => {
  const total    = chunks.reduce((acc, c) => acc + c.length, 0);
  const combined = new Uint8Array(total);
  let offset     = 0;
  for (const c of chunks) { combined.set(c, offset); offset += c.length; }
  return combined;
};

const isSessionOpen   = (s?: LiveMusicSession) =>
  Boolean(s?.conn && (s.conn as WebSocket).readyState === WEBSOCKET_OPEN);
const isSessionClosed = (s?: LiveMusicSession) => {
  if (!s?.conn) return true;
  return (s.conn as WebSocket).readyState === WEBSOCKET_CLOSED;
};
const safeStop = (s?: LiveMusicSession) => {
  if (!s || isSessionClosed(s)) return;
  try { if (isSessionOpen(s)) s.stop(); } catch {}
  try { s.close(); } catch {}
};

// ── Primary: lyria-realtime-exp (WebSocket live session) ─────────────────────

const attemptRealtimeGeneration = async (
  request: ComposeRequest,
  clipMs: number,
  onProgress?: ProgressCallback,
): Promise<string> => {
  const GEMINI_API_KEY = BUILD_TIME_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured. Add VITE_GEMINI_API_KEY and rebuild.");
  }

  const prompt = request.prompt.trim();
  if (!prompt) throw new Error("Prompt is required.");

  onProgress?.("Connecting…", 5);

  const aiClient = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
    apiVersion: "v1alpha",
  });

  const audioChunks: Uint8Array[]        = [];
  let session: LiveMusicSession | undefined;
  let firstChunkReceived                  = false;
  let stopTimer:   ReturnType<typeof setTimeout> | undefined;
  let hardTimeout: ReturnType<typeof setTimeout> | undefined;

  let resolveCompletion!: () => void;
  let rejectCompletion!:  (e: Error) => void;
  const completionPromise = new Promise<void>((res, rej) => {
    resolveCompletion = res;
    rejectCompletion  = rej;
  });

  const callbacks: LiveMusicCallbacks = {
    onmessage: (message: LiveMusicServerMessage) => {
      const chunks = message.serverContent?.audioChunks;
      if (!chunks?.length) return;

      if (!firstChunkReceived) {
        firstChunkReceived = true;
        onProgress?.("Streaming audio…", 30);

        stopTimer = setTimeout(() => {
          safeStop(session);
        }, clipMs);

        if (hardTimeout) clearTimeout(hardTimeout);
      }

      const elapsed        = audioChunks.reduce((a, c) => a + c.length, 0);
      const estimatedTotal = (SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8) * (clipMs / 1000));
      const streamPct      = Math.min(90, 30 + Math.round((elapsed / estimatedTotal) * 60));
      onProgress?.("Streaming audio…", streamPct);

      for (const chunk of chunks) {
        if (!chunk.data) continue;
        audioChunks.push(decodeBase64Chunk(chunk.data));
      }
    },
    onerror: (event) => {
      const err = event?.error instanceof Error
        ? event.error
        : new Error(event?.message ?? "Lyria streaming error.");
      rejectCompletion(err);
    },
    onclose: () => resolveCompletion(),
  };

  const musicConfig: LiveMusicGenerationConfig = {
    musicGenerationMode: MusicGenerationMode.QUALITY,
  };
  if (request.tempo) {
    musicConfig.bpm = clamp(Math.round(request.tempo), 60, 200);
  }

  session = await aiClient.live.music.connect({ model: PRIMARY_MODEL, callbacks });
  await session.setWeightedPrompts({ weightedPrompts: [{ text: prompt, weight: 1 }] });
  await session.setMusicGenerationConfig({ musicGenerationConfig: musicConfig });
  session.play();

  hardTimeout = setTimeout(() => {
    rejectCompletion(new Error("Lyria timed out — please try again."));
    safeStop(session);
  }, CONNECT_TIMEOUT_MS);

  await completionPromise;

  if (stopTimer)   clearTimeout(stopTimer);
  if (hardTimeout) clearTimeout(hardTimeout);

  if (!audioChunks.length) throw new Error("No audio received from Lyria.");

  const combined = combineChunks(audioChunks);
  const header   = buildWavHeader(combined.length, SAMPLE_RATE, CHANNELS, BITS_PER_SAMPLE);
  const blob     = new Blob([header, combined], { type: "audio/wav" });

  onProgress?.("Track ready", 100);
  return URL.createObjectURL(blob);
};

// ── Fallback: lyria-3-clip-preview (REST generateContent, returns MP3) ────────

const attemptClipGeneration = async (
  request: ComposeRequest,
  onProgress?: ProgressCallback,
): Promise<string> => {
  const GEMINI_API_KEY = BUILD_TIME_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured.");
  }

  const prompt = request.prompt.trim();
  onProgress?.("Composing with fallback model…", 15);

  const aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  // Simulate progress during the blocking REST call
  let pct = 15;
  const progressInterval = setInterval(() => {
    pct = Math.min(85, pct + 5);
    onProgress?.("Composing…", pct);
  }, 2000);

  try {
    const response = await (aiClient as any).models.generateContent({
      model: FALLBACK_MODEL,
      contents: prompt,
    });

    clearInterval(progressInterval);
    onProgress?.("Finalizing…", 90);

    // The response contains inlineData with base64-encoded MP3
    const parts = response?.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType ?? "audio/mp3";
        const bytes    = decodeBase64Chunk(part.inlineData.data);
        const blob     = new Blob([bytes], { type: mimeType });
        onProgress?.("Track ready", 100);
        return URL.createObjectURL(blob);
      }
    }

    throw new Error("No audio in fallback model response.");
  } finally {
    clearInterval(progressInterval);
  }
};

// ── Main export — tries primary (realtime), falls back to clip on failure ─────

export const generateMusic = async (
  request: ComposeRequest,
  onProgress?: ProgressCallback,
): Promise<string> => {
  const clipMs = request.clipDurationMs ?? DEFAULT_CLIP_MS;

  // Check for missing key before even trying
  if (!BUILD_TIME_KEY) {
    throw new Error("Gemini API key not configured. Add VITE_GEMINI_API_KEY and rebuild.");
  }

  try {
    return await attemptRealtimeGeneration(request, clipMs, onProgress);
  } catch (primaryErr: any) {
    const msg = primaryErr?.message ?? "";

    // Don't fall back on a missing key — it'll fail the same way
    if (msg.includes("not configured")) throw primaryErr;

    console.warn(
      `[Lyria] ${PRIMARY_MODEL} failed: "${msg}". Falling back to ${FALLBACK_MODEL}…`
    );
    onProgress?.("Switching to fallback model…", 10);

    try {
      return await attemptClipGeneration(request, onProgress);
    } catch (fallbackErr: any) {
      console.error("[Lyria] Fallback also failed:", fallbackErr?.message);
      throw new Error(
        "Music generation is temporarily unavailable. Please try again in a few minutes."
      );
    }
  }
};
