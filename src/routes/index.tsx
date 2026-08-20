import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/ui/navbar";
import { searchTracks, type TrackSearchResult } from "@/lib/lrc";
import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Footer } from "@/components/ui/footer";
import { Play, Swords, Search, Shuffle, Flame, Disc3 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import {
  type TrendingSong,
  fetchTrendingSongs,
  getCurrentMonthName,
  FALLBACK_TRENDING_SONGS,
} from "@/lib/trending";

type SearchParams = {
  q?: string;
};

let hasVisitedHome = false;

export const Route = createFileRoute("/")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://keyverse.me/" }],
  }),
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q.replace(/\+/g, " ") : undefined,
  }),
  component: Index,
});

function Index() {
  const { q: routeQuery } = Route.useSearch();
  const [searchInput, setSearchInput] = useState(routeQuery || "");
  const [results, setResults] = useState<TrackSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [activeMode, setActiveMode] = useState<"sync" | "featured" | "verses">("sync");
  const [disableAnimation] = useState(hasVisitedHome);
  const [trendingSongs, setTrendingSongs] = useState<TrendingSong[]>(FALLBACK_TRENDING_SONGS);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [monthName, setMonthName] = useState(getCurrentMonthName());
  const navigate = useNavigate();

  useEffect(() => {
    hasVisitedHome = true;
    trackEvent("homepage_viewed");
    setMonthName(getCurrentMonthName());

    fetchTrendingSongs(40)
      .then((songs) => {
        if (songs && songs.length > 0) {
          setTrendingSongs(songs);
        }
      })
      .catch((err) => {
        console.error("Failed to load trending songs:", err);
      })
      .finally(() => {
        setTrendingLoading(false);
      });
  }, []);

  useEffect(() => {
    const query = routeQuery ?? "";
    setSearchInput(query);
    if (query.trim()) {
      setLoading(true);
      setErr(null);
      setCurrentPage(1);
      searchTracks(query)
        .then((r) => {
          setResults(r);
          if (!r.length) setErr("No songs found. Try a different artist or title.");
        })
        .catch(() => {
          setErr("Search failed. Please try again.");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setResults([]);
      setErr(null);
    }
  }, [routeQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate({
        to: "/",
        search: { q: searchInput.trim() },
      });
    } else {
      navigate({ to: "/" });
    }
  };

  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    trendingSongs.forEach((s) => {
      if (s.genre) genres.add(s.genre);
    });
    const standardOrder = ["pop", "hip-hop", "rock", "r&b", "country", "indie", "dance"];
    const ordered = standardOrder.filter((g) => genres.has(g));
    genres.forEach((g) => {
      if (!ordered.includes(g)) ordered.push(g);
    });
    return ["all", ...ordered];
  }, [trendingSongs]);

  const filteredFeaturedSongs = useMemo(() => {
    if (selectedGenre === "all") return trendingSongs;
    return trendingSongs.filter((s) => s.genre === selectedGenre);
  }, [selectedGenre, trendingSongs]);

  const playRandomSong = () => {
    const pool = trendingSongs.length > 0 ? trendingSongs : FALLBACK_TRENDING_SONGS;
    const random = pool[Math.floor(Math.random() * pool.length)];
    navigate({
      to: "/play/$trackId",
      params: { trackId: String(random.id) },
      search: {
        artist: random.artistName,
        track: random.trackName,
        art: random.artworkUrl100,
        from: "/",
      },
    });
  };

  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedResults = results.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <main className="flex flex-col justify-start items-center min-h-screen bg-background text-foreground font-mono relative">
      <Navbar />

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col items-center text-center justify-start flex-1 gap-8 relative z-20">
        
        {/* Monkeytype Style Sub-Header Config Ribbon */}
        <div className="mt-pill-bar flex flex-wrap items-center justify-center gap-1 sm:gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground select-none max-w-2xl w-full">
          <div className="flex items-center gap-1">
            <span className="text-primary font-bold text-[10px] mr-1">@ mode</span>
            <button
              onClick={() => setActiveMode("sync")}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeMode === "sync"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Disc3 className="h-3 w-3" />
              <span>sync lyrics</span>
            </button>
            <button
              onClick={() => navigate({ to: "/verses" })}
              className="px-2.5 py-1 rounded-md hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Swords className="h-3 w-3" />
              <span>verses 1v1</span>
            </button>
          </div>

          <div className="h-3.5 w-px bg-border/60 mx-1 hidden sm:block" />

          {/* Quick random play trigger */}
          <button
            onClick={playRandomSong}
            className="px-2.5 py-1 rounded-md hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Play random trending track"
          >
            <Shuffle className="h-3 w-3 text-primary" />
            <span>random</span>
          </button>
        </div>

        {/* Hero & Quick Search */}
        <div className="w-full max-w-2xl flex flex-col items-center text-center">
          <form
            onSubmit={handleSearchSubmit}
            className="w-full relative group mt-2"
          >
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="type song title or artist name..."
                className="w-full pl-11 pr-24 py-3.5 bg-card/60 border border-border/70 rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary shadow-xs transition-all"
              />
              <div className="absolute right-3 flex items-center gap-1.5">
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      navigate({ to: "/" });
                    }}
                    className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    clear
                  </button>
                )}
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
                >
                  <span>search</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Search Results Display */}
        {routeQuery ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-3xl flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-primary font-bold text-xs">#</span>
                <h2 className="text-xs font-bold tracking-wide text-foreground uppercase">
                  results for "{routeQuery}"
                </h2>
              </div>
              <Link
                to="/"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                clear search
              </Link>
            </div>

            {err && <p className="text-xs text-incorrect text-left py-2">{err}</p>}

            <div>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/40"
                    >
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="min-w-0 flex-1 flex flex-col gap-2">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-2.5 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {paginatedResults.map((t) => (
                      <Link
                        key={t.id}
                        to="/play/$trackId"
                        params={{ trackId: String(t.id) }}
                        search={{
                          artist: t.artistName,
                          track: t.trackName,
                          art: t.artworkUrl100 || "",
                          duration: t.duration,
                          q: routeQuery || undefined,
                          from: "/",
                        }}
                        className="group flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card/50 hover:bg-card transition-all text-left shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {t.artworkUrl100 ? (
                            <img
                              src={t.artworkUrl100}
                              alt=""
                              className="h-11 w-11 rounded-lg shrink-0 object-cover border border-border/40"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="h-11 w-11 rounded-lg bg-secondary flex items-center justify-center text-primary font-bold text-sm shrink-0">♪</div>'; }}
                            />
                          ) : (
                            <div className="h-11 w-11 rounded-lg bg-secondary flex items-center justify-center text-primary font-bold text-sm shrink-0">
                              ♪
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                              {t.trackName}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                              {t.artistName}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] text-muted-foreground group-hover:text-primary font-bold transition-all ml-2 shrink-0 flex items-center gap-1">
                          <Play className="h-3 w-3 fill-current" />
                        </span>
                      </Link>
                    ))}
                  </div>

                  {results.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/40 text-xs text-muted-foreground">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-md border border-border/60 hover:bg-secondary/60 disabled:opacity-40 cursor-pointer"
                      >
                        &larr; prev
                      </button>
                      <span>
                        page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-md border border-border/60 hover:bg-secondary/60 disabled:opacity-40 cursor-pointer"
                      >
                        next &rarr;
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        ) : (
          /* Current Trending English Songs (Dynamic Monthly Chart) */
          <motion.div
            initial={disableAnimation ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-4xl flex flex-col gap-4"
          >
            {/* Header: Trending Monthly Badge */}
            <div className="flex items-center justify-between border-b border-border/40 pb-3 gap-3">
              <div className="flex flex-wrap items-center gap-2 text-left">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-bold select-none">
                  <Flame className="h-3.5 w-3.5 text-primary animate-pulse shrink-0" />
                  <span>trending • {monthName}</span>
                </span>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  current top english tracks • updated monthly
                </span>
              </div>
            </div>

            {/* Filter Tags */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-left">
              <span className="text-[10px] text-muted-foreground font-bold uppercase mr-1 select-none">
                genre:
              </span>
              {availableGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                    selectedGenre === genre
                      ? "bg-primary/20 text-primary border border-primary/40 font-bold"
                      : "text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>

            {/* Track Cards Grid */}
            {trendingLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-transparent"
                  >
                    <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
                    <div className="min-w-0 flex-1 flex flex-col gap-2">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredFeaturedSongs.length === 0 ? (
              <div className="p-8 border border-dashed border-border/60 rounded-xl text-center text-muted-foreground text-xs">
                No songs found for "{selectedGenre}".
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredFeaturedSongs.slice(0, 16).map((song, idx) => {
                  const rankNum = song.rank ?? idx + 1;
                  const isTopThree = rankNum <= 3;

                  return (
                    <Link
                      key={`${song.id}-${idx}`}
                      to="/play/$trackId"
                      params={{ trackId: String(song.id) }}
                      search={{
                        artist: song.artistName,
                        track: song.trackName,
                        art: song.artworkUrl100,
                        from: "/",
                      }}
                      className="group relative flex items-center justify-between p-3 rounded-xl border border-border/40 bg-transparent hover:bg-secondary/30 transition-all text-left shadow-xs overflow-hidden"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Album Art with Rank Overlay ONLY for top 3 */}
                        <div className="relative shrink-0">
                          <img
                            src={song.artworkUrl100}
                            alt=""
                            className="h-12 w-12 rounded-lg object-cover border border-border/30"
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.insertAdjacentHTML('afterbegin', '<div class="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center text-primary font-bold text-sm shrink-0">♪</div>'); }}
                          />
                          {isTopThree && (
                            <div className="absolute -top-1.5 -left-1.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shadow-xs">
                              #{rankNum}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                            {song.trackName}
                          </h3>
                          <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                            {song.artistName}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                            <span className="uppercase text-[9px] px-1.5 py-0.2 rounded bg-secondary/30 text-muted-foreground border border-border/40 font-medium">
                              {song.genre}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] text-muted-foreground group-hover:text-primary font-bold transition-all ml-3 shrink-0 flex items-center gap-1">
                        <Play className="h-3 w-3 fill-current" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Play With Friends Banner */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-border/40 bg-transparent gap-4 text-left">
              <div className="flex items-center gap-3">
                <div className="text-primary p-1">
                  <Swords className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">Play with Friends</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Live 1v1 rhythm typing showdowns in real-time.
                  </p>
                </div>
              </div>
              <Link
                to="/verses"
                className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider rounded-lg hover:opacity-90 transition-opacity shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>play verses</span>
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      <Footer />
    </main>
  );
}
