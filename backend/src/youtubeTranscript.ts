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

/** Extract caption URL directly from the YouTube watch page HTML.
 *  NOTE: URLs from page HTML's captionTracks often return empty responses.
 *  This function is kept as a fallback but player API is preferred. */
async function extractCaptionUrlFromPage(videoId: string): Promise<string | null> {
  try {
    console.log(`[YT Transcript] Trying page scrape for ${videoId}...`);
    const resp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    console.log(`[YT Transcript] Watch page status: ${resp.status}`);
    const html = await resp.text();

    // Look for captionTracks in the initial player response embedded in page
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (!captionMatch) {
      console.log(`[YT Transcript] No captionTracks in page HTML`);
      return null;
    }

    const tracks = JSON.parse(captionMatch[1]);
    console.log(`[YT Transcript] Found ${tracks.length} caption tracks in page`);
    const enTrack = tracks.find((t: any) => t.languageCode === 'en') || tracks[0];
    if (!enTrack?.baseUrl) return null;

    // The URL from page HTML needs decoding
    const url = enTrack.baseUrl.replace(/\\u0026/g, '&');

    // Test if the URL actually returns content (page URLs often return empty)
    const testResp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    const testXml = await testResp.text();
    if (testXml.length < 50) {
      console.log(`[YT Transcript] Page scrape URL returned empty XML (${testXml.length} chars)`);
      return null;
    }

    console.log(`[YT Transcript] Page scrape got working caption URL (lang: ${enTrack.languageCode}, ${testXml.length} chars)`);
    // Return URL — caller will re-fetch, or we could cache testXml
    return url;
  } catch (err: any) {
    console.warn(`[YT Transcript] Page scrape failed: ${err.message}`);
    return null;
  }
}

/** Get caption URL via InnerTube player API */
async function getCaptionUrlFromPlayerApi(videoId: string, clientName: string, clientVersion: string): Promise<string | null> {
  try {
    const apiKey = await getInnertubeApiKey();
    const isAndroid = clientName === 'ANDROID';
    const ua = isAndroid
      ? 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)'
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

    const resp = await fetch(
      `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': ua },
        body: JSON.stringify({
          context: { client: { clientName, clientVersion } },
          videoId,
        }),
      }
    );

    console.log(`[YT Transcript] Player API (${clientName}) status: ${resp.status}`);
    const data: any = await resp.json();
    const playability = data?.playabilityStatus?.status;
    const reason = data?.playabilityStatus?.reason;
    console.log(`[YT Transcript] Playability (${clientName}): ${playability}${reason ? ` — ${reason}` : ''}`);

    const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    console.log(`[YT Transcript] Caption tracks (${clientName}): ${tracks?.length || 0}`);
    if (!tracks?.length) return null;

    const enTrack = tracks.find((t: any) => t.languageCode === 'en') || tracks[0];
    return enTrack?.baseUrl || null;
  } catch (err: any) {
    console.warn(`[YT Transcript] Player API (${clientName}) failed: ${err.message}`);
    return null;
  }
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

    // Strategy 1: InnerTube player API with ANDROID client (most reliable locally)
    let captionUrl = await getCaptionUrlFromPlayerApi(videoId, 'ANDROID', '20.10.38');

    if (!captionUrl) {
      // Strategy 2: InnerTube player API with WEB client
      console.log(`[YT Transcript] ANDROID failed, trying WEB client...`);
      captionUrl = await getCaptionUrlFromPlayerApi(videoId, 'WEB', '2.20240101');
    }

    if (!captionUrl) {
      // Strategy 3: Extract from watch page HTML (often returns empty, but worth trying)
      console.log(`[YT Transcript] Player APIs failed, trying page scrape...`);
      captionUrl = await extractCaptionUrlFromPage(videoId);
    }

    if (!captionUrl) {
      console.warn(`[YT Transcript] All strategies failed for ${videoId}`);
      return null;
    }

    console.log(`[YT Transcript] Fetching caption XML from: ${captionUrl.substring(0, 80)}...`);
    const captionResp = await fetch(captionUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    console.log(`[YT Transcript] Caption XML status: ${captionResp.status}`);
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

    // Format 2: <s> tags within <p> paragraphs
    if (segments.length === 0) {
      const sRegex = /<s[^>]*>([^<]+)<\/s>/g;
      while ((m = sRegex.exec(xml)) !== null) {
        segments.push(decodeEntities(m[1]));
      }
    }

    // Format 3: <p t="..." d="...">content</p> (timedtext format="3")
    if (segments.length === 0) {
      const pRegex = /<p[^>]+>([^<]+)<\/p>/g;
      while ((m = pRegex.exec(xml)) !== null) {
        const text = decodeEntities(m[1]).trim();
        if (text) segments.push(text);
      }
    }

    console.log(`[YT Transcript] XML length: ${xml.length}, segments found: ${segments.length}`);
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
