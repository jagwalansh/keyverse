import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/ui/footer";
import { Navbar } from "@/components/ui/navbar";

export const Route = createFileRoute("/articles")({
  head: () => ({
    meta: [
      { title: "KeyVerse Articles | Rhythm Typing Tips" },
      {
        name: "description",
        content:
          "Read original KeyVerse articles about rhythm typing, song choice, typing accuracy, and practice habits for music-based typing games.",
      },
    ],
    links: [{ rel: "canonical", href: "https://keyverse.me/articles" }],
  }),
  component: Articles,
});

const articles = [
  {
    title: "Best Songs to Improve Your Typing Speed",
    intro:
      "The best practice song is not always the fastest one. A useful track gives you a steady pulse, clear vocals, and enough repeated structure to learn from each attempt.",
    sections: [
      {
        heading: "Start with clean vocal timing",
        body: "Songs with clear phrasing help you connect what you hear to what you type. If every line arrives at a predictable moment, you can focus on accuracy, posture, and rhythm instead of guessing where the words begin.",
      },
      {
        heading: "Move from steady to dense",
        body: "Begin with mid-tempo pop or R&B tracks, then move into faster songs once your accuracy stays consistent. Dense verses are great training, but they are more useful after you already trust your hands on simpler patterns.",
      },
      {
        heading: "Replay one difficult section",
        body: "Typing speed improves when you notice the same mistake more than once. If a chorus or verse keeps breaking your run, repeat that song until the transition feels familiar.",
      },
    ],
  },
  {
    title: "How Rhythm Typing Works",
    intro:
      "Rhythm typing combines ordinary keyboard practice with the timing pressure of music. You are not only copying text; you are matching a lyric line while the track keeps moving.",
    sections: [
      {
        heading: "Timing changes the challenge",
        body: "A normal typing test lets you recover whenever you want. In a rhythm typing round, the song keeps advancing, so a small mistake can affect the next line. This makes calm recovery as important as raw speed.",
      },
      {
        heading: "Reading ahead matters",
        body: "Good players glance at the next line before the active line is finished. That habit creates a small buffer, which is especially helpful when a song has short phrases or quick vocal entrances.",
      },
      {
        heading: "Accuracy carries the run",
        body: "Fast typing only helps when the words stay clean. A slightly slower pass with fewer corrections usually feels better, scores better, and teaches better muscle memory.",
      },
    ],
  },
  {
    title: "Choosing Songs for Better Practice",
    intro:
      "Different songs train different skills. Some help with relaxed accuracy, some build reaction speed, and some test whether you can stay composed during a busy verse.",
    sections: [
      {
        heading: "Use slow songs for control",
        body: "Slower tracks are useful when you want to improve clean typing. They give you enough time to finish each word, notice punctuation, and build confidence before the next line arrives.",
      },
      {
        heading: "Use fast songs for recovery",
        body: "Fast songs teach recovery because mistakes are harder to hide. The goal is not to be perfect immediately; it is to keep moving without letting one missed word ruin the full round.",
      },
      {
        heading: "Check sync before chasing a score",
        body: "If the lyric timing does not match the video, your score will not reflect your real typing ability. Try a different result or send a sync report when a version mismatch gets in the way.",
      },
    ],
  },
];

function Articles() {
  return (
    <main className="relative flex min-h-screen flex-col items-center bg-background font-sans text-foreground">
      <Navbar />

      <div className="relative z-20 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-28">
        <div className="flex flex-col gap-4 border-b border-border/20 pb-6 text-left md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-1 text-xs font-mono font-semibold uppercase tracking-wider text-primary">
              Articles
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Rhythm Typing Articles
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Original guides on typing practice, rhythm, song choice, and getting more from each
              KeyVerse round.
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

        <div className="space-y-10">
          {articles.map((article) => (
            <article key={article.title} className="border-b border-border/20 pb-10 last:border-0">
              <h2 className="text-2xl font-semibold tracking-tight">{article.title}</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                {article.intro}
              </p>

              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {article.sections.map((section) => (
                  <section key={section.heading}>
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                      {section.heading}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{section.body}</p>
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>

        <section className="flex flex-col items-start justify-between gap-5 border-t border-border/20 pt-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Ready to practice?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
              Start with a familiar song, focus on clean lines, and use the score as feedback for
              the next attempt.
            </p>
          </div>
          <Link
            to="/recommended"
            className="shrink-0 rounded-lg bg-primary px-5 py-2.5 text-xs font-mono font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Browse songs
          </Link>
        </section>
      </div>

      <Footer />
    </main>
  );
}
