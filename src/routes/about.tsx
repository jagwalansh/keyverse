import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/ui/footer";
import { Navbar } from "@/components/ui/navbar";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About | KeyVerse" },
      {
        name: "description",
        content:
          "Learn about KeyVerse, an independent rhythm typing game built to make typing practice feel musical, focused, and replayable.",
      },
    ],
    links: [{ rel: "canonical", href: "https://keyverse.me/about" }],
  }),
  component: About,
});

const corePillars = [
  {
    num: "01",
    title: "Music-Driven Flow",
    description:
      "Songs are the pacing engine. Rather than typing random sentences, you follow real lyrics in real time with the melody and vocal cadence.",
  },
  {
    num: "02",
    title: "Zero-Clutter Interface",
    description:
      "A distraction-free, minimalist terminal aesthetic designed to keep your focus entirely on reading ahead and typing cleanly.",
  },
  {
    num: "03",
    title: "Purposeful Practice",
    description:
      "Transforms mechanical typing drills into rhythm mastery, rewarding accuracy, cadence consistency, and muscle memory.",
  },
];

export function About() {
  return (
    <main className="relative flex min-h-screen flex-col items-center bg-background font-sans text-foreground">
      <Navbar />

      <div className="relative z-20 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-border/30 pb-8 text-left md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              // project overview
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              About KeyVerse
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              An independent rhythm typing platform built to transform typing practice into an engaging musical flow state.
            </p>
          </div>
          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 self-start rounded-md border border-border/40 bg-transparent px-3 py-1.5 text-xs font-mono text-muted-foreground transition-colors hover:text-foreground md:self-auto"
          >
            <span>&larr; back to home</span>
          </Link>
        </header>

        {/* Section 1: The Origin Story */}
        <section className="flex flex-col gap-5 text-left">
          <div>
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              # why keyverse exists
            </span>
            <h2 className="mt-1 text-lg font-bold text-foreground">Bridging Rhythm and Typing</h2>
          </div>

          <div className="rounded-lg border border-border/30 bg-transparent p-5 sm:p-6 text-xs sm:text-sm leading-relaxed text-muted-foreground space-y-4">
            <p>
              KeyVerse began with a simple question: what if typing practice could feel closer to playing a rhythm game than filling out a spreadsheet? Most traditional typing tests measure words per minute against static paragraphs. KeyVerse introduces cadence, musical timing, and dynamic pressure—forcing typists to read ahead, maintain relaxed hand posture, and strike keys on beat.
            </p>
            <p>
              The loop is intentionally streamlined: search for your favorite track, enter the room, type synced lyrics on cadence, and evaluate your streak. Leaderboards and score tracking provide meaningful milestones for continuous mastery without bloated gamification.
            </p>
          </div>
        </section>

        {/* Section 2: Core Design Pillars */}
        <section className="flex flex-col gap-5 border-t border-border/20 pt-10 text-left">
          <div>
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              # core pillars
            </span>
            <h2 className="mt-1 text-lg font-bold text-foreground">Foundational Principles</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {corePillars.map((pillar) => (
              <div
                key={pillar.num}
                className="flex flex-col justify-between rounded-lg border border-border/30 bg-transparent p-5"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-primary">{pillar.num}</span>
                  <h3 className="mt-2 font-mono text-xs font-bold text-foreground uppercase tracking-wide">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {pillar.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Open Data & Community */}
        <section className="grid gap-5 border-t border-border/20 pt-10 md:grid-cols-2 text-left">
          <div className="rounded-lg border border-border/30 bg-transparent p-5 sm:p-6">
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              # open ecosystem
            </span>
            <h3 className="mt-1 text-base font-bold text-foreground">Powered by Open Data</h3>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              KeyVerse utilizes open synchronized lyric databases and public audio streaming. Player feedback, community sync reports, and timing calibrations continually refine the catalog for everyone.
            </p>
          </div>

          <div className="rounded-lg border border-border/30 bg-transparent p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
                # feedback & support
              </span>
              <h3 className="mt-1 text-base font-bold text-foreground">Get Involved</h3>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Found a desynced track or have feature ideas? The platform evolves directly from typist and musician feedback.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/20">
              <Link
                to="/support"
                className="font-mono text-xs font-bold text-primary hover:underline"
              >
                [ contact support &rarr; ]
              </Link>
            </div>
          </div>
        </section>

        {/* Footer Play CTA */}
        <section className="rounded-lg border border-border/30 bg-transparent p-6 text-center flex flex-col items-center justify-center gap-2.5">
          <p className="font-mono text-xs text-muted-foreground">
            ready to experience rhythm typing?
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
