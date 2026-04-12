/**
 * youtube.ts — YouTube Data API v3 search helper.
 *
 * NOTE: The API key is exposed client-side (VITE_ prefix). For production,
 * move this call to a server-side route to prevent key scraping.
 */

export interface YouTubeVideo {
  title: string;
  thumbnail: string;
  link: string;
  channelTitle?: string;
}

const buildSearchQuery = (prompt: string): string => {
  if (!prompt) return "calming instrumental therapy music";

  const lower = prompt.toLowerCase();
  const terms = new Set<string>();

  const keywordMap: Array<[RegExp, string]> = [
    [/guitar|acoustic/, "acoustic guitar instrumental"],
    [/piano/, "piano therapy music"],
    [/violin|strings/, "violin instrumental meditation"],
    [/flute/, "flute meditation music"],
    [/synth|electronic|ambient/, "ambient synthesizer music"],
    [/sleep|insomnia/, "sleep music deep relaxation"],
    [/stress|anxiety/, "anxiety relief music"],
    [/depress|mood|hopeless/, "uplifting mood music therapy"],
    [/relation|interpersonal/, "music for emotional healing"],
    [/focus|concentrat/, "focus instrumental music"],
  ];

  for (const [regex, term] of keywordMap) {
    if (regex.test(lower)) terms.add(term);
  }

  const bpmMatch = lower.match(/(\d{2,3})\s*bpm/);
  if (bpmMatch) terms.add(`${bpmMatch[1]} bpm`);

  if (!terms.size) terms.add("calming instrumental therapy music");

  return Array.from(terms).slice(0, 4).join(" ");
};

export const searchYouTube = async (
  prompt: string,
  maxResults = 4
): Promise<{ searchQuery: string; videos: YouTubeVideo[] }> => {
  const key = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
  if (!key) throw new Error("YouTube API key missing. Set VITE_YOUTUBE_API_KEY.");

  const searchQuery = buildSearchQuery(prompt);

  const params = new URLSearchParams({
    part: "snippet",
    q: searchQuery,
    type: "video",
    maxResults: String(maxResults),
    key,
    videoEmbeddable: "true",
    videoCategoryId: "10", // Music category
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
  );
  if (!response.ok) throw new Error(`YouTube API error: ${response.status}`);

  const data = await response.json();
  const items = (data.items ?? []) as Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      channelTitle?: string;
      thumbnails?: {
        medium?: { url?: string };
        high?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;

  const videos: YouTubeVideo[] = items
    .map((item) => ({
      title: item.snippet?.title ?? "Untitled",
      thumbnail:
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        "",
      link: item.id?.videoId
        ? `https://www.youtube.com/watch?v=${item.id.videoId}`
        : "",
      channelTitle: item.snippet?.channelTitle,
    }))
    .filter((v) => Boolean(v.link));

  return { searchQuery, videos };
};
