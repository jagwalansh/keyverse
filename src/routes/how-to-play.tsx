import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/ui/footer";
import { Navbar } from "@/components/ui/navbar";

export const Route = createFileRoute("/how-to-play")({
  head: () => ({
    meta: [
      { title: "How to Play | KeyVerse" },
      {
        name: "description",
        content:
          "Learn how KeyVerse works, how rhythm typing scores are calculated, and how to improve your lyric typing accuracy.",
      },
    ],
    links: [{ rel: "canonical", href: "https://keyverse.me/how-to-play" }],
  }),
  component: HowToPlay,
});

const gameSteps = [
  {
    num: "01",
    title: "Select a Song",
    description: "Search by artist or track title, or pick from this month's trending charts.",
  },
  {
    num: "02",
    title: "Sync & Play",
    description: "KeyVerse pairs synchronized lyrics with real-time audio playback.",
  },
  {
    num: "03",
    title: "Type on Beat",
    description: "Strike keys in time with the vocal cadence while reading upcoming lines ahead.",
  },
  {
    num: "04",
    title: "Review & Rank",
    description: "Analyze accuracy %, streak milestones, and submit to the global leaderboard.",
  },
];

const gameplayTips = [
  "Listen to the vocal cadence first before accelerating your keystrokes.",
  "Clean inputs beat fast corrections—backspaces cost significant scoring momentum.",
  "Repeat single tracks to turn dense verses and pauses into muscle memory.",
  "Report desynced audio so timestamps can be calibrated for the community.",
];

export function HowToPlay() {
  return (
    <main className="relative flex min-h-screen flex-col items-center bg-background font-sans text-foreground">
      <Navbar />

      <div className="relative z-20 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-border/30 pb-8 text-left md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              // player guide
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              How to Play KeyVerse
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Everything you need to know about the gameplay loop, scoring algorithms, and timing tips.
            </p>
          </div>
          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 self-start rounded-md border border-border/40 bg-transparent px-3 py-1.5 text-xs font-mono text-muted-foreground transition-colors hover:text-foreground md:self-auto"
          >
            <span>&larr; back to home</span>
          </Link>
        </header>

        {/* Section 1: 4-Step Core Loop */}
        <section className="flex flex-col gap-5 text-left">
          <div>
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              # gameplay loop
            </span>
            <h2 className="mt-1 text-lg font-bold text-foreground">The Four Step Flow</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {gameSteps.map((step) => (
              <div
                key={step.num}
                className="flex flex-col justify-between rounded-lg border border-border/30 bg-transparent p-5"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-primary">{step.num}</span>
                  <h3 className="mt-2 font-mono text-xs font-bold text-foreground uppercase tracking-wide">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Scoring & Timing Tips */}
        <section className="grid gap-5 border-t border-border/20 pt-10 md:grid-cols-2 text-left">
          <div className="rounded-lg border border-border/30 bg-transparent p-5 sm:p-6">
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              # scoring criteria
            </span>
            <h3 className="mt-1 text-base font-bold text-foreground">What the Score Rewards</h3>
            <div className="mt-3 space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>
                Scores represent a composite calculation of accuracy %, line completion consistency, and streak retention. Typing at a steady, error-free pace outscores frantic bursts with typos.
              </p>
              <p>
                Each lyric line acts as an independent timing gate. When mistakes occur, recover smoothly on the next word rather than rushing ahead out of rhythm.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border/30 bg-transparent p-5 sm:p-6">
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              # pro tips
            </span>
            <h3 className="mt-1 text-base font-bold text-foreground">Practice Strategies</h3>
            <ul className="mt-3 space-y-2.5">
              {gameplayTips.map((tip, i) => (
                <li key={i} className="font-mono text-xs text-muted-foreground flex items-start gap-2 leading-relaxed">
                  <span className="text-primary font-bold select-none">-</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Footer Play CTA */}
        <section className="rounded-lg border border-border/30 bg-transparent p-6 text-center flex flex-col items-center justify-center gap-2.5">
          <p className="font-mono text-xs text-muted-foreground">
            ready to play?
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-primary hover:underline"
          >
            <span>[ start typing &rarr; ]</span>
          </Link>
        </section>
      </div>

      <Footer />
    </main>
  );
}
