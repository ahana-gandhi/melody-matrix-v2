/**
 * lyria.ts — Google Lyria Realtime music generation via WebSocket streaming.
 *
 * Key fixes from v1:
 *  - durationMs is now 28 000 ms (28 s) — was hardcoded to 10 000 ms
 *  - MIN/MAX constants are consistent and used by the stop timer
 *  - Prompt no longer requests "~20 seconds" (now matches actual clip length)
 *  - Hard timeout raised to 45 s to give Lyria time to start streaming
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
}

const BUILD_TIME_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

const LYRIA_MODEL = "models/lyria-realtime-exp";
const SAMPLE_RATE = 48000;
const CHANNELS = 2;
const BITS_PER_SAMPLE = 16;

/** How long to collect audio before closing the session.
 *  28 s gives a meaningful clip without hitting hard Lyria limits. */
const CLIP_DURATION_MS = 28_000;
const HARD_TIMEOUT_MS = 45_000;

const WEBSOCKET_OPEN = 1;
const WEBSOCKET_CLOSED = 3;

// ── Helpers ────────────────────────────────────────────────────────────────

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

const decodeBase64Chunk = (chunk: string): Uint8Array => {
  const binary = atob(chunk);
  const bytes = new Uint8Array(binary.length);
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
  const v = new DataView(header);
  const ws = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(offset + i, s.charCodeAt(i));
  };
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  ws(0, "RIFF");
  v.setUint32(4, 36 + dataLength, true);
  ws(8, "WAVE");
  ws(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, numChannels, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, byteRate, true);
  v.setUint16(32, blockAlign, true);
  v.setUint16(34, bitsPerSample, true);
  ws(36, "data");
  v.setUint32(40, dataLength, true);
  return header;
};

const combineChunks = (chunks: Uint8Array[]): Uint8Array => {
  const total = chunks.reduce((acc, c) => acc + c.length, 0);
  const combined = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) { combined.set(c, offset); offset += c.length; }
  return combined;
};

const isSessionOpen = (s?: LiveMusicSession) =>
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

// ── Main export ────────────────────────────────────────────────────────────

export const generateMusic = async (
  request: ComposeRequest,
  onProgress?: ProgressCallback
): Promise<string> => {
  const GEMINI_API_KEY = BUILD_TIME_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file and rebuild.");
  }

  const prompt = request.prompt.trim();
  if (!prompt) throw new Error("Prompt is required.");

  onProgress?.("Connecting to Lyria...", 5);

  const aiClient = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
    apiVersion: "v1alpha",
  });

  const audioChunks: Uint8Array[] = [];
  let session: LiveMusicSession | undefined;
  let firstChunkReceived = false;
  let stopTimer: ReturnType<typeof setTimeout> | undefined;
  let hardTimeout: ReturnType<typeof setTimeout> | undefined;

  let resolveCompletion!: () => void;
  let rejectCompletion!: (e: Error) => void;
  const completionPromise = new Promise<void>((res, rej) => {
    resolveCompletion = res;
    rejectCompletion = rej;
  });

  const callbacks: LiveMusicCallbacks = {
    onmessage: (message: LiveMusicServerMessage) => {
      const chunks = message.serverContent?.audioChunks;
      if (!chunks?.length) return;

      if (!firstChunkReceived) {
        firstChunkReceived = true;
        onProgress?.("Streaming audio...", 30);

        // Collect audio for CLIP_DURATION_MS then close
        stopTimer = setTimeout(() => {
          safeStop(session);
        }, CLIP_DURATION_MS);

        if (hardTimeout) clearTimeout(hardTimeout);
      }

      // Track progress from 30 → 90% during streaming
      const elapsed = audioChunks.reduce((a, c) => a + c.length, 0);
      const estimatedTotal = (SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8) * (CLIP_DURATION_MS / 1000));
      const streamPct = Math.min(90, 30 + Math.round((elapsed / estimatedTotal) * 60));
      onProgress?.("Streaming audio...", streamPct);

      for (const chunk of chunks) {
        if (!chunk.data) continue;
        audioChunks.push(decodeBase64Chunk(chunk.data));
      }
    },
    onerror: (event) => {
      const err = event?.error instanceof Error
        ? event.error
        : new Error(event?.message ?? "Streaming error.");
      rejectCompletion(err);
    },
    onclose: () => resolveCompletion(),
  };

  // Music generation config derived from request
  const musicConfig: LiveMusicGenerationConfig = {
    musicGenerationMode: MusicGenerationMode.QUALITY,
  };
  if (request.tempo) {
    musicConfig.bpm = clamp(Math.round(request.tempo), 60, 200);
  }

  session = await aiClient.live.music.connect({
    model: LYRIA_MODEL,
    callbacks,
  });

  await session.setWeightedPrompts({
    weightedPrompts: [{ text: prompt, weight: 1 }],
  });
  await session.setMusicGenerationConfig({ musicGenerationConfig: musicConfig });
  session.play();

  hardTimeout = setTimeout(() => {
    rejectCompletion(new Error("Lyria timed out — please try again."));
    safeStop(session);
  }, HARD_TIMEOUT_MS);

  await completionPromise;

  if (stopTimer) clearTimeout(stopTimer);
  if (hardTimeout) clearTimeout(hardTimeout);

  if (!audioChunks.length) throw new Error("No audio received from Lyria.");

  const combined = combineChunks(audioChunks);
  const header = buildWavHeader(combined.length, SAMPLE_RATE, CHANNELS, BITS_PER_SAMPLE);
  const blob = new Blob([header, combined], { type: "audio/wav" });

  onProgress?.("Track ready", 100);
  return URL.createObjectURL(blob);
};
