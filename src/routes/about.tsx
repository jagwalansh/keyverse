import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/ui/footer";
import { Navbar } from "@/components/ui/navbar";
import { motion } from "motion/react";
import { ArrowLeft, Gauge, Music2, Target } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About KeyVerse" },
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

const values = [
  {
    icon: Music2,
    title: "Music first",
    description:
      "Songs are more than a backdrop. Every round is designed around following lyrics in time with the music.",
  },
  {
    icon: Gauge,
    title: "Fast and focused",
    description:
      "The interface stays out of your way so you can concentrate on rhythm, accuracy, and improving your score.",
  },
  {
    icon: Target,
    title: "Practice with purpose",
    description:
      "KeyVerse turns typing practice into a challenge that rewards consistency, timing, and attention.",
  },
];

function About() {
  return (
    <main className="relative flex min-h-screen flex-col items-center bg-background font-sans text-foreground">
      <Navbar />

      <div className="relative z-20 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-28">
        <div className="flex flex-col gap-4 border-b border-border/20 pb-6 text-left md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-1 text-xs font-mono font-semibold uppercase tracking-wider text-primary">
              Our story
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">About KeyVerse</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              An independent rhythm typing project built for people who learn faster when practice
              feels like play.
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

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/45 p-8 shadow-sm backdrop-blur-sm md:p-10"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
          <div className="relative z-10 max-w-3xl">
            <h2 className="font-mono text-xl font-bold tracking-wide">Why KeyVerse exists</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                KeyVerse began as a small experiment by Ansh Jagwal: what if typing practice could
                feel closer to playing a rhythm game than completing a worksheet? Most typing tools
                measure speed with static passages. KeyVerse adds timing, music, and pressure, so
                the player has to read ahead, stay relaxed, and keep the next line moving with the
                track.
              </p>
              <p>
                The site is intentionally simple: search for a song, start a round, type the active
                lyric line, and review the score. That narrow loop makes short practice sessions
                useful without turning the page into a noisy dashboard. Scores reward accuracy and
                completed lines, while leaderboards give returning players a reason to improve
                gradually instead of rushing every word.
              </p>
              <p>
                KeyVerse is also a practical web project. It combines synced lyric data, public
                video playback, account-based score saving, and community sync reports. When a video
                version drifts from the lyric timing, players can flag it so the experience can be
                reviewed and improved over time.
              </p>
            </div>
          </div>
        </motion.section>

        <section className="grid gap-8 border-t border-border/20 pt-8 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">What makes it different</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Traditional typing practice is usually built around fixed paragraphs. KeyVerse uses
              music as the pacing layer. The challenge is not only spelling each word correctly, but
              entering the right line while the song is moving. That creates a different kind of
              focus: one part reading, one part rhythm, and one part recovery when a fast section
              throws you off.
            </p>
          </div>

          <div className="border-l border-border/30 pl-0 md:pl-6">
            <h2 className="text-xl font-semibold tracking-tight">Built in public spirit</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              KeyVerse is maintained as an independent project and is shaped by real play sessions,
              bug reports, and song suggestions. The goal is to keep the game fast, understandable,
              and respectful of the services that provide lyrics, videos, artwork, and metadata.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {values.map(({ icon: Icon, title, description }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * (index + 1), duration: 0.3 }}
              className="rounded-2xl border border-border/40 bg-card/45 p-6 backdrop-blur-sm"
            >
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="font-mono text-sm font-bold tracking-wide">{title}</h2>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{description}</p>
            </motion.div>
          ))}
        </section>

        <section className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-border/40 bg-card/45 p-7 sm:flex-row sm:items-center">
          <div>
            <div className="font-mono text-sm font-bold">Built with the community</div>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              KeyVerse uses services including LRCLIB and YouTube, and grows through player
              feedback, bug reports, song suggestions, and reports when a specific video does not
              match the synced lyrics.
            </p>
          </div>
          <Link
            to="/support"
            className="shrink-0 rounded-lg bg-primary px-5 py-2.5 text-xs font-mono font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get in touch
          </Link>
        </section>
      </div>

      <Footer />
    </main>
  );
}
