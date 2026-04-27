export type ProgressCallback = (status: string, progress: number) => void;

export interface ComposeRequest {
  prompt: string;
  instrument?: string;
  tempo?: number;
  clipDurationMs?: number;
}

export const generateMusic = async (
  request: ComposeRequest,
  onProgress?: ProgressCallback,
): Promise<string> => {
  onProgress?.("Composing…", 15);

  let pct = 15;
  const progressInterval = setInterval(() => {
    pct = Math.min(85, pct + 5);
    onProgress?.("Composing…", pct);
  }, 2000);

  try {
    const response = await fetch("/api/music/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: request.prompt, tempo: request.tempo }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error ?? "Music generation failed");
    }

    const { data, mimeType } = await response.json();
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType });

    clearInterval(progressInterval);
    onProgress?.("Track ready", 100);
    return URL.createObjectURL(blob);
  } catch (e: any) {
    clearInterval(progressInterval);
    throw e;
  }
};