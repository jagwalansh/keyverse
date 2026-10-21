export interface TrendingSong {
  id: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  duration?: number;
  genre: string;
  rank?: number;
  releaseDate?: string;
}

const STORAGE_KEY_PREFIX = "keyverse_trending_songs_v3";

export const FALLBACK_TRENDING_SONGS: TrendingSong[] = [
  {
    id: 6821859599,
    trackName: "May God Bless America",
    artistName: "Jason Bellard, Steve Gruber and the Freedom Project & Real America's Music",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/6a/1b/75/6a1b7593-564d-a442-3ef0-60101f56b9f7/cover_4062851365116.jpg/200x200bb.png",
    genre: "country",
    rank: 1,
    releaseDate: "2026-08-29T05:00:00-07:00",
  },
  {
    id: 6822944296,
    trackName: "Lies (feat. Lana Del Rey)",
    artistName: "Zach Bryan & Lana Del Rey",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ea/98/f2/ea98f2b8-5131-29ae-2064-997234ef13bc/093624812647.jpg/200x200bb.png",
    genre: "country",
    rank: 2,
    releaseDate: "2026-10-15T05:00:00-07:00",
  },
  {
    id: 1844932150,
    trackName: "Choosin' Texas",
    artistName: "Ella Langley",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/e2/91/4d/e2914d0a-7f1d-f04c-fbf4-c50b38548838/196873638690.jpg/200x200bb.png",
    duration: 198,
    genre: "country",
    rank: 3,
    releaseDate: "2025-10-17T05:00:00-07:00",
  },
  {
    id: 6822350087,
    trackName: "What America Is",
    artistName: "Tom MacDonald",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/58/d9/ef/58d9ef66-be21-954f-8881-44e7cef8cdf4/712132232067_cover.jpg/200x200bb.png",
    genre: "hip-hop",
    rank: 4,
    releaseDate: "2026-10-16T05:00:00-07:00",
  },
  {
    id: 6814997425,
    trackName: "Patient Zero",
    artistName: "Taylor Swift",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a0/dd/fd/a0ddfd72-ee9e-f046-6466-a5dbefc696fa/26UM1IM21436.rgb.jpg/200x200bb.png",
    genre: "pop",
    rank: 5,
    releaseDate: "2026-09-24T00:00:00-07:00",
  },
  {
    id: 6822497774,
    trackName: "Housewife",
    artistName: "Tate McRae",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/2b/96/2b/2b962b77-3a04-5650-aefd-37ecfce04b03/196874840146.jpg/200x200bb.png",
    genre: "pop",
    rank: 6,
    releaseDate: "2026-10-15T05:00:00-07:00",
  },
  {
    id: 6822390426,
    trackName: "expectations",
    artistName: "Olivia Rodrigo & Chappell Roan",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/d2/3c/b2/d23cb283-5f3e-7433-bc41-86c7d77c4503/26UM1IM29619.rgb.jpg/200x200bb.png",
    genre: "pop",
    rank: 7,
    releaseDate: "2026-10-16T05:00:00-07:00",
  },
  {
    id: 6820206129,
    trackName: "My Years With You",
    artistName: "RUSTIC DRIFTER",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/cd/92/3f/cd923fbb-21e8-3a9f-fa0f-3c2e47ad4ad1/artwork.jpg/200x200bb.png",
    genre: "country",
    rank: 8,
    releaseDate: "2026-10-06T05:00:00-07:00",
  },
  {
    id: 6813197034,
    trackName: "FIRESTARTER (feat. Sophie Powers, MIYEON & JEON SOYEON)",
    artistName: "K/DA, League of Legends Music, i-dle & Mimi Webb",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/93/14/66/9314660a-8ec2-2e26-652b-62c82b14fb80/823375358930_Cover.jpg/200x200bb.png",
    genre: "pop",
    rank: 9,
    releaseDate: "2026-10-20T05:00:00-07:00",
  },
  {
    id: 6812477290,
    trackName: "Last Thing You Need",
    artistName: "Morgan Wallen",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/5d/d3/1c/5dd31c9c-1e1c-0bbc-104f-4a42e2bb4c59/075679556424.jpg/200x200bb.png",
    genre: "country",
    rank: 10,
    releaseDate: "2026-09-17T00:00:00-07:00",
  },
];

export function getCurrentMonthName(): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date());
}

export function getCurrentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function isFallbackList(songs?: TrendingSong[]): boolean {
  if (!Array.isArray(songs) || songs.length < 15) return true;
  return false;
}

export function normalizeGenre(rawGenre?: string): string {
  if (!rawGenre) return "pop";
  const g = rawGenre.toLowerCase();
  if (g.includes("hip-hop") || g.includes("rap")) return "hip-hop";
  if (g.includes("rock") || g.includes("metal")) return "rock";
  if (g.includes("r&b") || g.includes("soul")) return "r&b";
  if (g.includes("country")) return "country";
  if (g.includes("indie") || g.includes("alternative")) return "indie";
  if (g.includes("dance") || g.includes("electronic") || g.includes("house")) return "dance";
  if (g.includes("latin") || g.includes("reggae")) return "latin";
  return "pop";
}

type ItunesFeedEntry = {
  id?: { attributes?: { "im:id"?: string } };
  "im:name"?: { label?: string };
  "im:artist"?: { label?: string };
  "im:image"?: Array<{ label?: string; attributes?: { height?: string } }>;
  category?: { attributes?: { term?: string; label?: string } };
  "im:releaseDate"?: { label?: string };
  link?: Array<{
    "im:duration"?: { label?: string };
    attributes?: { href?: string; rel?: string };
  }>;
};

export function parseItunesFeed(feedData: {
  feed?: { entry?: ItunesFeedEntry[] };
}): TrendingSong[] {
  const entries = feedData?.feed?.entry || [];
  if (!Array.isArray(entries)) return [];

  const songs: TrendingSong[] = [];
  const seenTitles = new Set<string>();

  entries.forEach((entry, idx) => {
    const rawId = entry.id?.attributes?.["im:id"];
    const id = rawId ? parseInt(rawId, 10) : Date.now() + idx;
    const trackName = entry["im:name"]?.label?.trim() || "";
    const artistName = entry["im:artist"]?.label?.trim() || "";

    if (!trackName || !artistName) return;

    // Deduplicate
    const normKey = `${trackName.toLowerCase()}::${artistName.toLowerCase()}`;
    if (seenTitles.has(normKey)) return;
    seenTitles.add(normKey);

    // Get best quality artwork (convert standard 170x170 or 100x100 to 200x200)
    const images = entry["im:image"] || [];
    const bestImage = images[images.length - 1]?.label || "";
    const artworkUrl100 = bestImage
      ? bestImage.replace(/\/\d+x\d+bb\./, "/200x200bb.")
      : "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop";

    const rawCategory = entry.category?.attributes?.term || entry.category?.attributes?.label;
    const genre = normalizeGenre(rawCategory);

    songs.push({
      id,
      trackName,
      artistName,
      artworkUrl100,
      genre,
      duration: undefined,
      rank: songs.length + 1,
      releaseDate: entry["im:releaseDate"]?.label,
    });
  });

  return songs;
}

export function purgeOldTrendingCaches(): void {
  if (typeof window === "undefined") return;
  try {
    const currentStorageKey = `${STORAGE_KEY_PREFIX}_${getCurrentMonthKey()}`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("keyverse_trending_songs_")) {
        if (key !== currentStorageKey) {
          keysToRemove.push(key);
        } else {
          // If the current key has fallback data, also purge it
          const val = window.localStorage.getItem(key);
          if (val) {
            try {
              const parsed = JSON.parse(val);
              if (isFallbackList(parsed.songs)) {
                keysToRemove.push(key);
              }
            } catch {
              keysToRemove.push(key);
            }
          }
        }
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore localStorage errors
  }
}

export function getCachedTrendingSongs(): TrendingSong[] | null {
  if (typeof window === "undefined") return null;
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}_${getCurrentMonthKey()}`;
    const cached = window.localStorage.getItem(storageKey);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    if (!Array.isArray(parsed.songs) || isFallbackList(parsed.songs)) {
      window.localStorage.removeItem(storageKey);
      return null;
    }

    // Cache valid for up to 6 hours
    const age = Date.now() - (parsed.timestamp || 0);
    if (age > 6 * 60 * 60 * 1000) {
      return null;
    }

    return parsed.songs;
  } catch {
    return null;
  }
}

export async function fetchTrendingSongs(limit = 40): Promise<TrendingSong[]> {
  const currentMonthKey = getCurrentMonthKey();
  const storageKey = `${STORAGE_KEY_PREFIX}_${currentMonthKey}`;

  // Clean up any stale or fallback caches from previous months/versions
  purgeOldTrendingCaches();

  // 1. Check local storage for valid cached songs (< 2 hours old for instant return)
  if (typeof window !== "undefined") {
    try {
      const cached = window.localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.songs) && !isFallbackList(parsed.songs)) {
          const age = Date.now() - (parsed.timestamp || 0);
          if (age < 2 * 60 * 60 * 1000) {
            return parsed.songs;
          }
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  // 2. Fetch fresh live songs:
  // Primary attempt: Direct Apple Music Top Songs RSS (runs in client browser, CORS enabled, Akamai CDN edge cached)
  try {
    const directRes = await fetch(`https://itunes.apple.com/us/rss/topsongs/limit=${limit}/json`);
    if (directRes.ok) {
      const rawData = await directRes.json();
      const parsed = parseItunesFeed(rawData as { feed?: { entry?: ItunesFeedEntry[] } });
      if (parsed.length >= 15) {
        saveToCache(storageKey, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Direct iTunes RSS fetch failed, falling back to /api/trending:", err);
  }

  // Secondary attempt: Server API proxy /api/trending
  try {
    const apiRes = await fetch(`/api/trending?limit=${limit}`);
    if (apiRes.ok) {
      const json = await apiRes.json();
      if (Array.isArray(json?.songs) && !isFallbackList(json.songs)) {
        saveToCache(storageKey, json.songs);
        return json.songs;
      }
    }
  } catch (err) {
    console.warn("Server /api/trending failed:", err);
  }

  // 3. If live network fetches failed, try returning existing cache even if older
  if (typeof window !== "undefined") {
    try {
      const cached = window.localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.songs) && !isFallbackList(parsed.songs)) {
          return parsed.songs;
        }
      }
    } catch {
      // Ignore
    }
  }

  // 4. Absolute offline fallback - DO NOT cache this to localStorage so it never gets stuck!
  return FALLBACK_TRENDING_SONGS;
}

function saveToCache(key: string, songs: TrendingSong[]) {
  if (typeof window === "undefined") return;
  if (isFallbackList(songs)) return; // NEVER cache fallback songs
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        timestamp: Date.now(),
        songs,
      }),
    );
  } catch {
    // Ignore storage quota errors
  }
}
