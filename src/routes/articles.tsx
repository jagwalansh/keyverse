import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/ui/footer";
import { Navbar } from "@/components/ui/navbar";
import { articles } from "@/lib/articles";

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

        <div className="grid gap-5 md:grid-cols-3">
          {articles.map((article) => (
            <article key={article.slug} className="border border-border/30 bg-card/35 p-5">
              <h2 className="text-xl font-semibold tracking-tight">{article.title}</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{article.description}</p>
              <Link
                to={`/articles/${article.slug}`}
                className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-xs font-mono font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Read article
              </Link>
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
