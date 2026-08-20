import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/ui/footer";
import { Navbar } from "@/components/ui/navbar";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Guide & Strategy | KeyVerse" },
      {
        name: "description",
        content:
          "KeyVerse player guide: scoring mechanics, difficulty classification, lyric synchronization standards, and practice routines.",
      },
    ],
    links: [{ rel: "canonical", href: "https://keyverse.me/guide" }],
  }),
  component: Guide,
});

const scoringRules = [
  {
    num: "01",
    title: "Accuracy carries the run",
    description:
      "Scores scale heavily with accuracy and unbroken streaks. A steady, deliberate typing pace with zero mistakes will consistently outperform rapid bursts plagued by backspaces.",
  },
  {
    num: "02",
    title: "Vocal timing synchronization",
    description:
      "Lyric lines trigger in sync with song timestamps. Reading the upcoming line ahead of time allows fingers to strike on cadence rather than reacting late.",
  },
  {
    num: "03",
    title: "Repetition builds flow",
    description:
      "Replaying tracks teaches you tempo changes, breath pauses, and dense verses, turning unfamiliar lyrics into reliable muscle memory.",
  },
];

const difficultyLevels = [
  {
    tier: "easy",
    tempo: "slow - moderate",
    description:
      "Clear vocal delivery, generous pauses between lines, simple vocabulary, and repetitive chorus hooks.",
    note: "Recommended for learning lyric rhythm and finger placement.",
  },
  {
    tier: "medium",
    tempo: "moderate - upbeat",
    description:
      "Shorter breath intervals, conversational pacing, quicker line transitions, and varied phrasing.",
    note: "Ideal for building speed while maintaining 95%+ accuracy.",
  },
  {
    tier: "hard",
    tempo: "high bpm / dense",
    description:
      "Rapid multisyllabic verses, continuous lyrics with minimal gaps, complex punctuation, and fast hooks.",
    note: "Pushes typing speed and rhythm endurance to the limit.",
  },
];

const trainingPhases = [
  {
    step: "phase 01",
    title: "Listen & map the rhythm",
    text: "Play through once without worrying about score. Focus on hearing where each line begins and how syllables land on the beat.",
  },
  {
    step: "phase 02",
    title: "Precision pass",
    text: "Type at a controlled pace aiming for 100% accuracy. Let speed develop naturally through familiarity rather than forced speed.",
  },
  {
    step: "phase 03",
    title: "Tempo push",
    text: "Review difficult phrases and line transitions. Replay to climb the song leaderboard or move up to a harder difficulty tier.",
  },
];

const syncPointers = [
  "Prefer studio or official audio tracks over live cuts, remixes, or acoustic variations.",
  "Check whether track intros alter lyric timestamps before restarting an attempt.",
  "Report desynchronized lyrics via support so timestamps can be adjusted.",
  "If lyrics mismatch the audio version, select an alternate track release from search.",
];

export function Guide() {
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
              Rhythm Typing & Strategy
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              A comprehensive reference on KeyVerse scoring mechanics, difficulty tiers, lyric synchronization, and training workflows.
            </p>
          </div>
          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 self-start rounded-md border border-border/40 bg-transparent px-3 py-1.5 text-xs font-mono text-muted-foreground transition-colors hover:text-foreground md:self-auto"
          >
            <span>&larr; back to home</span>
          </Link>
        </header>

        {/* Section 1: Scoring Rules */}
        <section className="flex flex-col gap-5 text-left">
          <div>
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              # scoring mechanics
            </span>
            <h2 className="mt-1 text-lg font-bold text-foreground">How scoring works</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {scoringRules.map((rule) => (
              <div
                key={rule.num}
                className="flex flex-col justify-between rounded-lg border border-border/30 bg-transparent p-5"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-primary">{rule.num}</span>
                  <h3 className="mt-2 font-mono text-xs font-bold text-foreground uppercase tracking-wide">
                    {rule.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {rule.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Difficulty Tiers */}
        <section className="flex flex-col gap-5 border-t border-border/20 pt-10 text-left">
          <div>
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              # song difficulty
            </span>
            <h2 className="mt-1 text-lg font-bold text-foreground">Difficulty classification</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {difficultyLevels.map((lvl) => (
              <div
                key={lvl.tier}
                className="flex flex-col justify-between rounded-lg border border-border/30 bg-transparent p-5"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-border/20 pb-2.5 mb-3">
                    <span className="font-mono text-xs font-bold uppercase text-foreground">
                      [{lvl.tier}]
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {lvl.tempo}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {lvl.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/20">
                  <p className="font-mono text-[11px] text-muted-foreground">
                    <span className="text-foreground font-semibold">tip: </span>
                    {lvl.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Training Workflow */}
        <section className="flex flex-col gap-5 border-t border-border/20 pt-10 text-left">
          <div>
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              # practice loop
            </span>
            <h2 className="mt-1 text-lg font-bold text-foreground">Structured training routine</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {trainingPhases.map((phase) => (
              <div
                key={phase.step}
                className="flex flex-col justify-between rounded-lg border border-border/30 bg-transparent p-5"
              >
                <div>
                  <span className="font-mono text-[11px] font-bold text-primary uppercase">
                    {phase.step}
                  </span>
                  <h3 className="mt-2 font-mono text-xs font-bold text-foreground">
                    {phase.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {phase.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Sync Guidelines & Fair Play */}
        <section className="grid gap-5 border-t border-border/20 pt-10 md:grid-cols-2 text-left">
          {/* Sync Guidelines */}
          <div className="flex flex-col justify-between rounded-lg border border-border/30 bg-transparent p-5 sm:p-6">
            <div>
              <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
                # lyric sync
              </span>
              <h3 className="mt-1 text-base font-bold text-foreground">Synchronization standards</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                KeyVerse parses timestamped LRC lyrics against music audio:
              </p>
              <ul className="mt-4 space-y-2.5">
                {syncPointers.map((pointer, i) => (
                  <li key={i} className="font-mono text-xs text-muted-foreground flex items-start gap-2 leading-relaxed">
                    <span className="text-primary font-bold select-none">-</span>
                    <span>{pointer}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Fair Play Standards */}
          <div className="flex flex-col justify-between rounded-lg border border-border/30 bg-transparent p-5 sm:p-6">
            <div>
              <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
                # fair play
              </span>
              <h3 className="mt-1 text-base font-bold text-foreground">Leaderboard integrity</h3>
              <div className="mt-3 space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Leaderboards reflect live human typing accuracy and rhythm. Automated input scripts, macros, pasted clipboard content, and client tampering are strictly prohibited.
                </p>
                <p>
                  Scores submitted to public leaderboards must be naturally reproducible under standard gameplay conditions. Unverified automated runs are filtered automatically.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/20 font-mono text-[11px] text-muted-foreground">
              // compete fairly • build true speed
            </div>
          </div>
        </section>

        {/* Footer Play CTA */}
        <section className="rounded-lg border border-border/30 bg-transparent p-6 text-center flex flex-col items-center justify-center gap-2.5">
          <p className="font-mono text-xs text-muted-foreground">
            ready to practice your timing?
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
