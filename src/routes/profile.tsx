import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, LogIn, Music2, Settings2, Sparkles } from "lucide-react";
import { AccountModal } from "@/components/ui/account-modal";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/ui/footer";
import { Navbar } from "@/components/ui/navbar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth-context";
import { useModal } from "@/lib/modal-context";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile | KeyVerse" },
      { name: "description", content: "View your KeyVerse typing stats and personal bests." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

type ScoreRow = {
  id: string;
  song_id: string;
  score: number;
  accuracy: number;
  consistency: number;
  created_at: string;
};

type SongRow = {
  id: string;
  artist: string;
  track: string;
  art_url: string | null;
};

type Performance = ScoreRow & { song?: SongRow };

type LeaderboardRow = {
  user_id: string;
  best_score: number;
};

async function loadProfileStats(userId: string) {
  const { data: scoreData, error } = await supabase
    .from("scores")
    .select("id, song_id, score, accuracy, consistency, created_at")
    .eq("user_id", userId)
    .order("score", { ascending: false });

  if (error) throw error;

  const scores = (scoreData ?? []) as ScoreRow[];
  const songIds = [...new Set(scores.map((score) => score.song_id))];
  let songs: SongRow[] = [];

  if (songIds.length > 0) {
    const { data: songData } = await supabase
      .from("songs")
      .select("id, artist, track, art_url")
      .in("id", songIds);
    songs = (songData ?? []) as SongRow[];
  }

  const songsById = new Map(songs.map((song) => [song.id, song]));
  const performances: Performance[] = scores.map((score) => ({
    ...score,
    song: songsById.get(score.song_id),
  }));

  let globalRank: number | null = null;
  try {
    const response = await fetch("/api/leaderboard?period=alltime");
    if (response.ok) {
      const payload = await response.json();
      const rows = (payload?.leaderboard ?? []) as LeaderboardRow[];
      const bestByUser = new Map<string, number>();
      rows.forEach((row) => {
        bestByUser.set(row.user_id, Math.max(bestByUser.get(row.user_id) ?? 0, row.best_score));
      });
      const rankedUsers = [...bestByUser.entries()].sort((a, b) => b[1] - a[1]);
      const index = rankedUsers.findIndex(([id]) => id === userId);
      globalRank = index >= 0 ? index + 1 : null;
    }
  } catch {
    // The rest of the profile is still useful if the public leaderboard is unavailable.
  }

  return { performances, globalRank };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function formatJoinedDate(date: string | undefined) {
  if (!date) return "New player";
  return `Joined ${new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))}`;
}

function getDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const { setModalOpen } = useModal();
  const [accountOpen, setAccountOpen] = useState(false);

  const statsQuery = useQuery({
    queryKey: ["profile-stats", user?.id],
    queryFn: () => loadProfileStats(user!.id),
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  const performances = useMemo(
    () => statsQuery.data?.performances ?? [],
    [statsQuery.data?.performances],
  );
  const summary = useMemo(() => {
    const count = performances.length;
    const total = performances.reduce(
      (acc, item) => ({
        score: acc.score + item.score,
        accuracy: acc.accuracy + Number(item.accuracy),
        consistency: acc.consistency + Number(item.consistency),
      }),
      { score: 0, accuracy: 0, consistency: 0 },
    );
    return {
      savedRounds: count,
      totalScore: total.score,
      accuracy: count ? total.accuracy / count : 0,
      consistency: count ? total.consistency / count : 0,
      bestScore: performances[0]?.score ?? 0,
    };
  }, [performances]);

  if (loading) return <ProfileSkeleton />;

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col bg-background text-foreground">
        <Navbar />
        <section className="mx-auto flex w-full max-w-xl flex-1 items-center px-6 py-24">
          <div className="w-full rounded-2xl border border-border/40 bg-card/40 p-8 text-center shadow-lg backdrop-blur-sm">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Your stats live here</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Sign in to see your saved rounds, personal bests, accuracy, and playing activity.
            </p>
            <Button className="mt-6" onClick={() => setModalOpen(true)}>
              <LogIn className="h-4 w-4" /> Sign in to continue
            </Button>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  const displayName = profile?.username || user.email?.split("@")[0] || "Player";

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <div className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-14 sm:px-6 sm:pt-20">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/"
            className="flex w-fit items-center gap-2 text-xs font-mono font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to songs
          </Link>
          <Button variant="outline" size="sm" onClick={() => setAccountOpen(true)}>
            <Settings2 className="h-4 w-4" /> Account settings
          </Button>
        </header>

        <section className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/45 p-6 shadow-lg backdrop-blur-sm sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center">
              <div className="min-w-0">
                <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  Username
                </p>
                <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
                  {displayName}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />{" "}
                  {formatJoinedDate(profile?.created_at ?? user.created_at)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-5 border-t border-border/30 pt-6 sm:grid-cols-4 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <HeroStat label="saved rounds" value={formatNumber(summary.savedRounds)} />
              <HeroStat label="songs mastered" value={formatNumber(performances.length)} />
              <HeroStat label="total score" value={formatNumber(summary.totalScore)} />
              <HeroStat
                label="global rank"
                value={statsQuery.data?.globalRank ? `#${statsQuery.data.globalRank}` : "—"}
              />
            </div>
          </div>
        </section>

        {statsQuery.isLoading ? (
          <StatsLoading />
        ) : statsQuery.error ? (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            We couldn&apos;t load your stats. Please refresh and try again.
          </div>
        ) : performances.length === 0 ? (
          <EmptyProfile />
        ) : (
          <>
            <section className="mt-6 text-center grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Personal best"
                value={formatNumber(summary.bestScore)}
                detail="highest saved score"
              />
              <MetricCard
                label="Average accuracy"
                value={`${summary.accuracy.toFixed(1)}%`}
                detail="across saved rounds"
              />
              <MetricCard
                label="Consistency"
                value={`${summary.consistency.toFixed(1)}%`}
                detail="average rhythm control"
              />
              <MetricCard
                label="Songs mastered"
                value={formatNumber(performances.length)}
                detail="unique personal bests"
              />
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
              <ActivityGrid performances={performances} />
              <TopPerformances performances={performances.slice(0, 5)} />
            </section>
          </>
        )}
      </div>
      <Footer />
      <AccountModal open={accountOpen} onOpenChange={setAccountOpen} />
    </main>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-xl border border-border/35 bg-card/35 p-5 text-center shadow-sm transition-colors hover:border-primary/30">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-4 font-mono text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
    </article>
  );
}

function ActivityGrid({ performances }: { performances: Performance[] }) {
  const weeks = 20;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay() - (weeks - 1) * 7);

  const counts = new Map<string, number>();
  performances.forEach((item) => {
    const date = new Date(item.created_at);
    const key = getDayKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const days = Array.from({ length: weeks * 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, count: counts.get(getDayKey(date)) ?? 0 };
  });

  const activeDays = days.filter((day) => day.count > 0).length;

  return (
    <article className="overflow-hidden rounded-xl border border-border/35 bg-card/35 p-5 sm:p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wider">Activity</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {activeDays} active days in the last {weeks} weeks
          </p>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
          Less{" "}
          {[0, 1, 2, 3].map((level) => (
            <span key={level} className={`h-2.5 w-2.5 rounded-[3px] ${activityColor(level)}`} />
          ))}{" "}
          More
        </div>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[680px] gap-3">
          <div
            className="grid w-16 shrink-0 grid-rows-7 gap-1.5 font-mono text-[9px] text-muted-foreground"
            aria-hidden="true"
          >
            {["", "Monday", "", "Wednesday", "", "Friday", ""].map((label, index) => (
              <span key={`${label}-${index}`} className="flex items-center">
                {label}
              </span>
            ))}
          </div>
          <div
            className="grid flex-1 grid-flow-col grid-rows-7 gap-1.5"
            aria-label="Saved round activity over the last 20 weeks"
          >
            <TooltipProvider delayDuration={100}>
              {days.map(({ date, count }) => {
                const dateLabel = date.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                });
                const playsLabel = `${count} saved ${count === 1 ? "play" : "plays"}`;

                if (count === 0) {
                  return (
                    <div
                      key={date.toISOString()}
                      aria-hidden="true"
                      className={`aspect-square min-w-3 rounded-[3px] ${activityColor(count)}`}
                    />
                  );
                }

                return (
                  <Tooltip key={date.toISOString()}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={`${dateLabel}: ${playsLabel}`}
                        className={`aspect-square min-w-3 rounded-[3px] outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${activityColor(count)}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="font-mono text-[10px]">
                      {dateLabel} · {playsLabel}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center font-mono text-[9px] text-muted-foreground">
        Each square represents a day with a saved personal best.
      </p>
    </article>
  );
}

function activityColor(count: number) {
  if (count >= 3) return "bg-primary";
  if (count === 2) return "bg-primary/70";
  if (count === 1) return "bg-primary/40";
  return "bg-muted/55";
}

function TopPerformances({ performances }: { performances: Performance[] }) {
  return (
    <article className="rounded-xl border border-border/35 bg-card/35 p-5 sm:p-6">
      <div className="mb-5">
        <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider">
          Personal bests
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">Your five highest scores</p>
      </div>
      <div className="space-y-2.5">
        {performances.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-border/20 bg-background/25 p-2.5"
          >
            <span className="w-4 text-center font-mono text-[10px] font-bold text-muted-foreground">
              {index + 1}
            </span>
            {item.song?.art_url ? (
              <img src={item.song.art_url} alt="" className="h-9 w-9 rounded-md object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                <Music2 className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{item.song?.track ?? "Unknown song"}</p>
              <p className="truncate text-[10px] text-muted-foreground">
                {item.song?.artist ?? `${Number(item.accuracy).toFixed(1)}% accuracy`}
              </p>
            </div>
            <p className="shrink-0 font-mono text-xs font-bold text-primary">
              {formatNumber(item.score)}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function EmptyProfile() {
  return (
    <section className="mt-6 rounded-2xl border border-dashed border-border/50 bg-card/20 px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Music2 className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-bold">Your first personal best awaits</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Finish a song while signed in and your score, accuracy, and activity will appear here.
      </p>
      <Button asChild className="mt-5">
        <Link to="/">Choose a song</Link>
      </Button>
    </section>
  );
}

function StatsLoading() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/40" />
      ))}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-20">
        <div className="h-48 animate-pulse rounded-2xl bg-muted/40" />
        <StatsLoading />
      </div>
    </main>
  );
}
