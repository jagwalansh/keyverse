import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Gauge, ListChecks, Music2, RotateCcw, ShieldCheck, Timer } from "lucide-react";
import { Footer } from "@/components/ui/footer";
import { Navbar } from "@/components/ui/navbar";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "KeyVerse Rhythm Typing Guide" },
      {
        name: "description",
        content:
          "A detailed KeyVerse guide covering rhythm typing strategy, scoring, song difficulty, lyric sync quality, and fair leaderboard play.",
      },
    ],
    links: [{ rel: "canonical", href: "https://keyverse.me/guide" }],
  }),
  component: Guide,
});

const scoringNotes = [
  {
    icon: Gauge,
    title: "Accuracy carries the run",
    text: "The best scores come from clean lyric lines. A fast burst followed by repeated corrections usually loses to a steadier pass with fewer misses.",
  },
  {
    icon: Timer,
    title: "Timing matters",
    text: "KeyVerse follows synced lyric timestamps, so the active line changes with the music. Reading one line ahead helps you enter on time without rushing.",
  },
  {
    icon: RotateCcw,
    title: "Replay one track",
    text: "Repeating a single song is useful practice because you learn its pauses, repeated hooks, and dense phrases instead of reacting from scratch each round.",
  },
];

const difficultyRows = [
  ["Easy", "Clear vocals, longer pauses, repeated chorus lines, and moderate tempo."],
  ["Medium", "Shorter gaps, more conversational phrasing, faster hooks, or quick line changes."],
  [
    "Hard",
    "Dense verses, clipped syllables, unusual punctuation, and very little time to recover.",
  ],
];

const syncChecks = [
  "Prefer studio or official audio versions when a track has many live edits or remixes.",
  "Check the first verse and chorus before judging a score attempt; some videos include intros that shift the lyric timing.",
  "Use the support form when the displayed lyric line consistently arrives early or late for a specific song.",
  "Try another search result when the title is correct but the playback version clearly differs from the synced lyrics.",
];

function Guide() {
  return (
    <main className="relative flex min-h-screen flex-col items-center bg-background font-sans text-foreground">
      <Navbar />

      <div className="relative z-20 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-28">
        <div className="flex flex-col gap-4 border-b border-border/20 pb-6 text-left md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-1 text-xs font-mono font-semibold uppercase tracking-wider text-primary">
              Rhythm typing guide
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              How KeyVerse Scores Skill
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              KeyVerse is built around the small overlap between music memory and typing control:
              listen for the vocal, read the next line, and keep your hands quiet enough to stay
              accurate.
            </p>
          </div>
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 self-start rounded-lg border border-border/40 bg-card/45 px-4 py-2 text-xs font-mono font-semibold text-muted-foreground shadow-sm transition-all hover:border-primary/50 hover:bg-muted/60 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {scoringNotes.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="rounded-lg border border-border/40 bg-card/45 p-6 text-left backdrop-blur-sm"
            >
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="font-mono text-sm font-bold tracking-wide">{title}</h2>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{text}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-8 border-t border-border/20 pt-8 md:grid-cols-[0.95fr_1.05fr]">
          <div className="text-left">
            <div className="mb-4 flex items-center gap-3">
              <Music2 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold tracking-tight">
                Choosing a Good Practice Song
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                A strong KeyVerse song is not always the fastest song. The most useful practice
                tracks have audible words, consistent phrasing, and repeated sections that let you
                compare one attempt against the next.
              </p>
              <p>
                Start with a track where you can finish most lines without panic. Once the rhythm
                feels familiar, raise the challenge by choosing songs with tighter verses or less
                space between vocal entries.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border/40 bg-card/35">
            {difficultyRows.map(([level, description]) => (
              <div
                key={level}
                className="grid gap-3 border-b border-border/30 p-5 text-left last:border-b-0 sm:grid-cols-[120px_1fr]"
              >
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                  {level}
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 border-t border-border/20 pt-8 md:grid-cols-[1.05fr_0.95fr]">
          <div className="text-left">
            <div className="mb-4 flex items-center gap-3">
              <ListChecks className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold tracking-tight">Sync Quality Checklist</h2>
            </div>
            <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
              {syncChecks.map((item) => (
                <li key={item} className="border-b border-border/20 pb-3 last:border-0 last:pb-0">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border/40 bg-card/45 p-6 text-left">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold tracking-tight">Fair Leaderboard Play</h2>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              Leaderboard scores are meant to reflect a human typing the lyric line in real time.
              Scripts, macros, pasted text, client-side manipulation, or automated input defeat the
              point of the challenge and may lead to score removal.
            </p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              A fair run should be repeatable by another player on the same song with the same
              timing conditions, even if their speed and accuracy differ.
            </p>
          </div>
        </section>

        <section className="border-t border-border/20 pt-8 text-left">
          <h2 className="text-xl font-semibold tracking-tight">A Simple Training Loop</h2>
          <div className="mt-4 grid gap-4 text-sm leading-7 text-muted-foreground md:grid-cols-3">
            <p>
              First pass: play the song casually and notice where the lyric lines begin. Do not
              chase the leaderboard yet.
            </p>
            <p>
              Second pass: aim for clean spelling and fewer corrections. Let speed rise from
              familiarity instead of force.
            </p>
            <p>
              Third pass: compare score, accuracy, and the moments where you fell behind. Then
              either replay or move up in difficulty.
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
