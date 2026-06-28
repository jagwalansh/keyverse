import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/ui/footer";
import { Navbar } from "@/components/ui/navbar";
import type { Article } from "@/lib/articles";

export function ArticlePage({ article }: { article?: Article }) {
  if (!article) {
    return (
      <main className="relative flex min-h-screen flex-col items-center bg-background font-sans text-foreground">
        <Navbar />
        <div className="relative z-20 mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-28">
          <h1 className="text-3xl font-bold tracking-tight">Article not found</h1>
          <Link to="/articles" className="mt-6 text-sm font-medium underline underline-offset-4">
            Back to articles
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center bg-background font-sans text-foreground">
      <Navbar />

      <article className="relative z-20 mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-28">
        <Link
          to="/articles"
          className="mb-8 inline-flex items-center gap-2 self-start rounded-lg border border-border/40 bg-card/45 px-4 py-2 text-xs font-mono font-semibold text-muted-foreground shadow-sm transition-all hover:border-primary/50 hover:bg-muted/60 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Articles
        </Link>

        <div className="mb-2 text-xs font-mono font-semibold uppercase tracking-wider text-primary">
          KeyVerse Article
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{article.title}</h1>
        <p className="mt-5 text-base leading-8 text-muted-foreground">{article.intro}</p>

        <div className="mt-10 space-y-9">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">
                {section.heading}
              </h2>
              <p className="mt-3 text-sm leading-8 text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-12 border-t border-border/20 pt-8">
          <h2 className="text-xl font-semibold tracking-tight">Practice it in KeyVerse</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Pick a familiar song, focus on clean rhythm, and use each round as feedback for your
            next attempt.
          </p>
          <Link
            to="/recommended"
            className="mt-5 inline-flex rounded-lg bg-primary px-5 py-2.5 text-xs font-mono font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Browse songs
          </Link>
        </section>
      </article>

      <Footer />
    </main>
  );
}
