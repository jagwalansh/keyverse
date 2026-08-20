import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { useQuery } from "@tanstack/react-query";
import { Music } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard | KeyVerse" },
      {
        name: "description",
        content:
          "View KeyVerse global leaderboard rankings for daily, weekly, and all-time rhythm typing scores.",
      },
    ],
    links: [{ rel: "canonical", href: "https://keyverse.me/leaderboard" }],
  }),
  component: LeaderboardPage,
});

type LeaderboardPeriod = "daily" | "weekly" | "alltime";

type LeaderboardRow = {
  user_id: string;
  song_id: string;
  username: string;
  track: string;
  artist: string;
  art_url: string | null;
  best_score: number;
  best_accuracy: number;
};

async function fetchLeaderboard(period: "daily" | "weekly" | "alltime") {
  const response = await fetch(`/api/leaderboard?period=${encodeURIComponent(period)}`);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to fetch leaderboard data.");
  }

  return (payload?.leaderboard || []) as LeaderboardRow[];
}

function formatRank(rank: number) {
  return rank < 10 ? `0${rank}` : `${rank}`;
}

export function LeaderboardPage() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("alltime");

  const {
    data: dbScores = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["leaderboard", period],
    queryFn: () => fetchLeaderboard(period),
    refetchInterval: 10000,
  });

  const scores = useMemo(() => {
    if (isLoading || error) return [];

    const bestScoreByUser = new Map<string, LeaderboardRow>();

    dbScores
      .map((score) => ({
        user_id: score.user_id,
        song_id: score.song_id,
        username: score.username,
        track: score.track,
        artist: score.artist,
        art_url: score.art_url,
        best_score: score.best_score,
        best_accuracy: score.best_accuracy,
      }))
      .sort((a, b) => b.best_score - a.best_score)
      .forEach((score) => {
        if (!bestScoreByUser.has(score.user_id)) {
          bestScoreByUser.set(score.user_id, score);
        }
      });

    return Array.from(bestScoreByUser.values()).slice(0, 50);
  }, [dbScores, isLoading, error]);

  const periodOptions: { id: LeaderboardPeriod; label: string }[] = [
    { id: "daily", label: "daily" },
    { id: "weekly", label: "weekly" },
    { id: "alltime", label: "all-time" },
  ];

  return (
    <main className="flex min-h-screen flex-col justify-start items-center bg-background text-foreground font-sans">
      <Navbar />

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 flex flex-col gap-8 flex-1 justify-start">
        {/* Header section */}
        <header className="flex flex-col gap-4 border-b border-border/30 pb-6 text-left md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              // global rankings
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Leaderboard
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Top typing scores ranked by pure rhythm, accuracy, and line completion.
            </p>
          </div>

          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 self-start rounded-md border border-border/40 bg-transparent px-3 py-1.5 text-xs font-mono text-muted-foreground transition-colors hover:text-foreground md:self-auto"
          >
            <span>&larr; back to home</span>
          </Link>
        </header>

        {/* Period Selector Tabs (Minimalist Monospace Pills) */}
        <div className="flex items-center gap-1.5 self-start font-mono text-xs">
          <span className="text-muted-foreground text-[11px] uppercase mr-1 select-none">
            period:
          </span>
          {periodOptions.map((opt) => {
            const isActive = period === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setPeriod(opt.id)}
                className={`px-3 py-1 rounded transition-colors cursor-pointer text-xs uppercase tracking-wider ${
                  isActive
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Leaderboard Table */}
        <div className="w-full">
          {isLoading ? (
            <div className="flex flex-col gap-2.5">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-border/20 bg-transparent animate-pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-6 h-4 rounded bg-muted/60" />
                    <div className="w-32 h-4 rounded bg-muted/60" />
                  </div>
                  <div className="w-20 h-4 rounded bg-muted/60" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center p-8 rounded-lg border border-red-500/20 bg-transparent text-red-400 font-mono text-xs">
              Error fetching leaderboard: {error.message}
            </div>
          ) : scores.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/30 bg-transparent">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-border/20 text-[10px] text-muted-foreground tracking-wider uppercase">
                    <th className="py-3 px-4 text-center w-12">#</th>
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-4">Song</th>
                    <th className="py-3 px-4 text-center w-20">Acc</th>
                    <th className="py-3 px-5 text-right w-28">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((row, index) => {
                    const rank = index + 1;
                    const isTopThree = rank <= 3;

                    return (
                      <tr
                        key={`${row.user_id}-${row.song_id}-${row.best_score}`}
                        className="border-b border-border/15 last:border-b-0 hover:bg-secondary/20 transition-colors"
                      >
                        {/* Rank */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-mono text-xs font-bold ${
                              rank === 1
                                ? "text-primary"
                                : isTopThree
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {formatRank(rank)}
                          </span>
                        </td>

                        {/* Player Username */}
                        <td className="py-3 px-4 font-semibold text-xs text-foreground font-sans">
                          {row.username}
                        </td>

                        {/* Song Title & Artist */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5 max-w-[240px] sm:max-w-md">
                            <div className="h-7 w-7 rounded overflow-hidden shrink-0 border border-border/30 bg-muted/40 flex items-center justify-center">
                              {row.art_url ? (
                                <img
                                  src={row.art_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <Music className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-foreground leading-tight">
                                {row.track}
                              </p>
                              <p className="truncate text-[10px] text-muted-foreground leading-tight mt-0.5">
                                {row.artist}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Accuracy */}
                        <td className="py-3 px-4 text-center font-mono text-xs text-muted-foreground">
                          {Number(row.best_accuracy).toFixed(1)}%
                        </td>

                        {/* Score */}
                        <td className="py-3 px-5 text-right font-mono text-xs font-bold text-primary tabular-nums">
                          {Number(row.best_score).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-border/30 bg-transparent max-w-md mx-auto">
      <span className="font-mono text-xs text-primary uppercase font-bold">// empty</span>
      <h3 className="text-base font-bold mt-2 text-foreground">No scores yet</h3>
      <p className="text-xs text-muted-foreground mt-1 mb-5">
        Be the first to set a record for this time period.
      </p>
      <Link
        to="/"
        className="font-mono text-xs font-bold text-primary hover:underline"
      >
        [ start typing &rarr; ]
      </Link>
    </div>
  );
}
