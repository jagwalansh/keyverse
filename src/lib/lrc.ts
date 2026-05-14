export interface LyricLine {
  time: number; // seconds
  text: string;
}

export function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const re = /\[(\d+):(\d+(?:\.\d+)?)\]/g;
  for (const raw of lrc.split(/\r?\n/)) {
    const stamps: number[] = [];
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(raw)) !== null) {
      stamps.push(parseInt(m[1], 10) * 60 + parseFloat(m[2]));
    }
    const text = raw.replace(re, "").trim();
    if (!stamps.length) continue;
    for (const t of stamps) lines.push({ time: t, text });
  }
  lines.sort((a, b) => a.time - b.time);
  return lines.filter((l) => l.text.length > 0);
}

export interface ITunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
}

export async function searchTracks(query: string): Promise<ITunesTrack[]> {
  const url = `https://itunes.apple.com/search?media=music&entity=song&limit=20&term=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Search failed");
  const data = (await res.json()) as { results: ITunesTrack[] };
  return data.results.filter((t) => t.previewUrl);
}

export async function fetchSyncedLyrics(
  artist: string,
  track: string,
): Promise<LyricLine[] | null> {
  const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(track)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { syncedLyrics?: string | null };
  if (!data.syncedLyrics) return null;
  return parseLrc(data.syncedLyrics);
}