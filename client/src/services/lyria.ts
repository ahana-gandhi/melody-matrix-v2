/**
 * lyria.ts — Google Lyria Realtime music generation via WebSocket streaming.
 *
 * Primary model : lyria-realtime-exp  (free, experimental — no shutdown date)
 * Fallback model: lyria-3-clip-preview (paid ~$0.04/clip, stable GA)
 *
 * The fallback fires automatically if lyria-realtime-exp returns a connection
 * error, quota error, or any non-audio response. No user action needed.
 * To migrate permanently, swap PRIMARY_MODEL ↔ FALLBACK_MODEL below.
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
  /** How many ms of audio to collect. Defaults to DEFAULT_CLIP_MS (28 s). */
  clipDurationMs?: number;
}

const BUILD_TIME_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// ── Model config ────────────────────────────────────────────────────────────
// To permanently switch to Lyria 3 (paid, stable), swap these two lines:
const PRIMARY_MODEL  = "models/lyria-realtime-exp";
const FALLBACK_MODEL = "models/lyria-3-clip-preview"; // ~$0.04/clip

const SAMPLE_RATE    = 48000;
const CHANNELS       = 2;
const BITS_PER_SAMPLE = 16;

/** Default clip length — 28 s fits within one Lyria session, generates in real-time. */
const DEFAULT_CLIP_MS  = 28_000;
/** Hard abort if no audio arrives within this window. */
const CONNECT_TIMEOUT_MS = 45_000;

const WEBSOCKET_OPEN   = 1;
const WEBSOCKET_CLOSED = 3;

// ── Helpers ─────────────────────────────────────────────────────────────────

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

// ── Core generation (single model attempt) ──────────────────────────────────

const attemptGeneration = async (
  modelName: string,
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

  onProgress?.("Connecting to Lyria…", 5);

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

        // Collect audio for clipMs then close
        stopTimer = setTimeout(() => {
          safeStop(session);
        }, clipMs);

        if (hardTimeout) clearTimeout(hardTimeout);
      }

      // Progress 30 → 90% during streaming
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

  session = await aiClient.live.music.connect({ model: modelName, callbacks });
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

// ── Main export — tries primary, falls back to Lyria 3 on failure ───────────

export const generateMusic = async (
  request: ComposeRequest,
  onProgress?: ProgressCallback,
): Promise<string> => {
  const clipMs = request.clipDurationMs ?? DEFAULT_CLIP_MS;

  try {
    return await attemptGeneration(PRIMARY_MODEL, request, clipMs, onProgress);
  } catch (primaryErr: any) {
    // Only fall back on likely API-level errors (not user-facing ones like missing key)
    const msg = primaryErr?.message ?? "";
    const isApiError =
      msg.includes("timed out") ||
      msg.includes("quota") ||
      msg.includes("429") ||
      msg.includes("403") ||
      msg.includes("unavailable") ||
      msg.includes("WebSocket") ||
      msg.includes("streaming") ||
      msg.includes("No audio received");

    if (!isApiError) throw primaryErr; // e.g. missing API key — don't bother retrying

    console.warn(
      `[Lyria] ${PRIMARY_MODEL} failed (${msg}). Falling back to ${FALLBACK_MODEL}…`
    );
    onProgress?.("Switching to fallback model…", 10);

    try {
      return await attemptGeneration(FALLBACK_MODEL, request, clipMs, onProgress);
    } catch (fallbackErr: any) {
      // Both models failed — surface a clear user-facing message
      throw new Error(
        "Music generation is temporarily unavailable. Please try again in a few minutes."
      );
    }
  }
};
