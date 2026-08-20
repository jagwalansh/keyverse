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

const STORAGE_KEY_PREFIX = "keyverse_trending_songs_v1";

export const FALLBACK_TRENDING_SONGS: TrendingSong[] = [
  {
    id: 1743852427,
    trackName: "Love Me Not",
    artistName: "Ravyn Lenae",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/07/8c/6c/078c6c94-d38d-0451-d57b-23e957b569f8/075679660893.jpg/200x200bb.jpg",
    duration: 213,
    genre: "r&b",
    rank: 1,
  },
  {
    id: 1752214923,
    trackName: "Espresso",
    artistName: "Sabrina Carpenter",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a1/1c/ca/a11ccab6-7d4c-e041-d028-998bcebeb709/24UMGIM61704.rgb.jpg/200x200bb.jpg",
    duration: 175,
    genre: "pop",
    rank: 2,
  },
  {
    id: 1739659142,
    trackName: "BIRDS OF A FEATHER",
    artistName: "Billie Eilish",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/92/9f/69/929f69f1-9977-3a44-d674-11f70c852d1b/24UMGIM36186.rgb.jpg/200x200bb.jpg",
    duration: 210,
    genre: "pop",
    rank: 3,
  },
  {
    id: 1762656732,
    trackName: "Die With A Smile",
    artistName: "Lady Gaga & Bruno Mars",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ec/3b/22/ec3b22b6-caec-aa7c-87d3-d2d0016e7da5/24UMGIM89622.rgb.jpg/200x200bb.jpg",
    duration: 251,
    genre: "pop",
    rank: 4,
  },
  {
    id: 1579787410,
    trackName: "STAY",
    artistName: "The Kid LAROI & Justin Bieber",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/3a/22/a83a22f7-af18-7ef6-a7de-74816c532a44/886449475421.jpg/200x200bb.jpg",
    duration: 142,
    genre: "pop",
    rank: 5,
  },
  {
    id: 1615585008,
    trackName: "As It Was",
    artistName: "Harry Styles",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/2a/19/fb/2a19fb85-2f70-9e44-f2a9-82abe679b88e/886449990061.jpg/200x200bb.jpg",
    duration: 167,
    genre: "pop",
    rank: 6,
  },
  {
    id: 1488408568,
    trackName: "Blinding Lights",
    artistName: "The Weeknd",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a6/6e/bf/a66ebf79-5008-8948-b352-a790fc87446b/19UM1IM04638.rgb.jpg/200x200bb.jpg",
    duration: 202,
    genre: "pop",
    rank: 7,
  },
  {
    id: 1538003843,
    trackName: "Levitating",
    artistName: "Dua Lipa",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6c/11/d6/6c11d681-aa3a-d59e-4c2e-f77e181026ab/190295092665.jpg/200x200bb.jpg",
    duration: 203,
    genre: "pop",
    rank: 8,
  },
  {
    id: 1440870375,
    trackName: "Starboy",
    artistName: "The Weeknd feat. Daft Punk",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/200x200bb.jpg",
    duration: 230,
    genre: "hip-hop",
    rank: 9,
  },
  {
    id: 1508562516,
    trackName: "Heat Waves",
    artistName: "Glass Animals",
    artworkUrl100:
      "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/da/8b/77/da8b7731-6f4f-eacf-5e74-8b23389eefa1/20UMGIM03371.rgb.jpg/200x200bb.jpg",
    duration: 239,
    genre: "indie",
    rank: 10,
  },
];

export function getCurrentMonthName(): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date());
}

export function getCurrentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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

export function parseItunesFeed(feedData: { feed?: { entry?: ItunesFeedEntry[] } }): TrendingSong[] {
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

export async function fetchTrendingSongs(limit = 40): Promise<TrendingSong[]> {
  const currentMonthKey = getCurrentMonthKey();
  const storageKey = `${STORAGE_KEY_PREFIX}_${currentMonthKey}`;

  // 1. Try checking local storage first for instant loading
  if (typeof window !== "undefined") {
    try {
      const cached = window.localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.songs) && parsed.songs.length > 0) {
          // If cache is less than 24 hours old, return cached data immediately
          const age = Date.now() - (parsed.timestamp || 0);
          if (age < 24 * 60 * 60 * 1000) {
            return parsed.songs;
          }
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  // 2. Fetch from /api/trending or direct Apple Music Top Songs RSS
  try {
    let rawData: unknown = null;

    // Try our server API endpoint first
    try {
      const apiRes = await fetch(`/api/trending?limit=${limit}`);
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (Array.isArray(json?.songs) && json.songs.length > 0) {
          saveToCache(storageKey, json.songs);
          return json.songs;
        }
      }
    } catch {
      // Fallback to client fetch
    }

    // Direct RSS fallback
    const directRes = await fetch(
      `https://itunes.apple.com/us/rss/topsongs/limit=${limit}/json`,
    );
    if (directRes.ok) {
      rawData = await directRes.json();
    }

    if (rawData) {
      const parsed = parseItunesFeed(rawData as { feed?: { entry?: ItunesFeedEntry[] } });
      if (parsed.length > 0) {
        saveToCache(storageKey, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch fresh trending songs, using fallback list:", err);
  }

  // 3. Fallback to cached or evergreen songs if network fails
  return FALLBACK_TRENDING_SONGS;
}

function saveToCache(key: string, songs: TrendingSong[]) {
  if (typeof window === "undefined") return;
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
