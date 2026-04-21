import NodeCache from 'node-cache';

const transcriptCache = new NodeCache({ stdTTL: 86400 }); // 24h

// Reuse a single API key across requests (refreshed when stale)
let cachedApiKey: string | null = null;
let apiKeyFetchedAt = 0;
const API_KEY_TTL = 3600000; // 1 hour

interface TranscriptResult {
  fullText: string;
  condensed: string; // first ~4500 chars for LLM context
  wordCount: number;
}

export function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
  );
  return match?.[1] ?? null;
}

async function getInnertubeApiKey(): Promise<string> {
  if (cachedApiKey && Date.now() - apiKeyFetchedAt < API_KEY_TTL) {
    return cachedApiKey;
  }

  console.log('[YT Transcript] Fetching InnerTube API key from YouTube page...');
  const resp = await fetch('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  console.log(`[YT Transcript] YouTube page status: ${resp.status}`);
  const html = await resp.text();
  console.log(`[YT Transcript] YouTube page HTML length: ${html.length}`);
  const match = html.match(/"INNERTUBE_API_KEY":\s*"([a-zA-Z0-9_-]+)"/);
  if (!match) {
    // Log a snippet to help debug what YouTube returned
    const snippet = html.substring(0, 500);
    console.error(`[YT Transcript] No INNERTUBE_API_KEY found. HTML snippet: ${snippet}`);
    throw new Error('Could not extract INNERTUBE_API_KEY');
  }

  console.log(`[YT Transcript] Got API key: ${match[1].substring(0, 10)}...`);
  cachedApiKey = match[1];
  apiKeyFetchedAt = Date.now();
  return cachedApiKey;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n/g, ' ');
}

function cleanTranscript(raw: string): string {
  return raw
    .replace(/\[Music\]/gi, '')
    .replace(/\[Applause\]/gi, '')
    .replace(/\[Laughter\]/gi, '')
    .replace(/♪[^♪]*♪/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchTranscript(videoId: string): Promise<TranscriptResult | null> {
  // Check cache first
  const cached = transcriptCache.get<TranscriptResult>(videoId);
  if (cached) return cached;

  try {
    console.log(`[YT Transcript] Fetching transcript for video: ${videoId}`);
    const apiKey = await getInnertubeApiKey();

    const resp = await fetch(
      `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)',
        },
        body: JSON.stringify({
          context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } },
          videoId,
        }),
      }
    );

    console.log(`[YT Transcript] Player API status: ${resp.status}`);
    const data: any = await resp.json();
    const playability = data?.playabilityStatus?.status;
    const reason = data?.playabilityStatus?.reason;
    console.log(`[YT Transcript] Playability: ${playability}${reason ? ` — ${reason}` : ''}`);
    const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    console.log(`[YT Transcript] Caption tracks: ${tracks?.length || 0}`);
    if (!tracks?.length) {
      console.warn(`[YT Transcript] No caption tracks for ${videoId}. Playability: ${playability}`);
      return null;
    }

    // Prefer English, fall back to first track
    const enTrack = tracks.find((t: any) => t.languageCode === 'en') || tracks[0];

    const captionResp = await fetch(enTrack.baseUrl, {
      headers: {
        'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)',
      },
    });
    const xml = await captionResp.text();
    if (!xml) return null;

    // Parse caption segments — YouTube uses either <text> or <p>/<s> format
    const segments: string[] = [];

    // Format 1: <text start="..." dur="...">content</text>
    const textRegex = /<text[^>]*>([^<]+)<\/text>/g;
    let m;
    while ((m = textRegex.exec(xml)) !== null) {
      segments.push(decodeEntities(m[1]));
    }

    // Format 2: <p>/<s> format — extract text from <s> tags within <p> paragraphs
    if (segments.length === 0) {
      const sRegex = /<s[^>]*>([^<]+)<\/s>/g;
      while ((m = sRegex.exec(xml)) !== null) {
        segments.push(decodeEntities(m[1]));
      }
    }

    if (segments.length === 0) return null;

    const fullText = cleanTranscript(segments.join(' '));
    const wordCount = fullText.split(/\s+/).length;
    const condensed = fullText.substring(0, 4500);

    console.log(`[YT Transcript] ${videoId}: ${wordCount} words, ${segments.length} segments`);

    const result: TranscriptResult = { fullText, condensed, wordCount };
    transcriptCache.set(videoId, result);
    return result;
  } catch (err: any) {
    console.warn(`[YT Transcript] Failed for ${videoId}: ${err.message}`);
    return null;
  }
}

export function getCachedTranscript(videoId: string): TranscriptResult | null {
  return transcriptCache.get<TranscriptResult>(videoId) ?? null;
}
