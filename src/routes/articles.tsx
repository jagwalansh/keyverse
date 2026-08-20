import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Footer } from "@/components/ui/footer";
import { Navbar } from "@/components/ui/navbar";
import { articles } from "@/lib/articles";

export const Route = createFileRoute("/articles")({
  head: () => ({
    meta: [
      { title: "Articles & Guides | KeyVerse" },
      {
        name: "description",
        content:
          "Original articles and guides about rhythm typing, song choice, typing accuracy, and practice habits for music-based typing.",
      },
    ],
    links: [{ rel: "canonical", href: "https://keyverse.me/articles" }],
  }),
  component: Articles,
});

export function Articles() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isArticlesIndex = pathname === "/articles" || pathname === "/articles/";

  if (!isArticlesIndex) {
    return <Outlet />;
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center bg-background font-sans text-foreground">
      <Navbar />

      <div className="relative z-20 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-border/30 pb-8 text-left md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              // knowledge base
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Rhythm Typing Articles
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              In-depth essays, touch typing guides, and rhythm mechanics analysis to elevate your speed and accuracy.
            </p>
          </div>
          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 self-start rounded-md border border-border/40 bg-transparent px-3 py-1.5 text-xs font-mono text-muted-foreground transition-colors hover:text-foreground md:self-auto"
          >
            <span>&larr; back to home</span>
          </Link>
        </header>

        {/* Articles Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-left">
          {articles.map((article) => (
            <article key={article.slug}>
              <Link
                to={article.path}
                preload="intent"
                className="group flex h-full flex-col justify-between rounded-lg border border-border/30 bg-transparent p-5 transition-colors hover:bg-secondary/20"
              >
                <div>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground mb-2">
                    <time dateTime={article.publishDate}>
                      {new Date(article.publishDate + "T00:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                    <span>•</span>
                    <span>{article.readingTime} min read</span>
                  </div>
                  <h2 className="font-mono text-xs font-bold uppercase tracking-wide text-foreground group-hover:text-primary transition-colors">
                    {article.title}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {article.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/20">
                  <span className="font-mono text-xs font-bold text-primary group-hover:underline">
                    [ read article &rarr; ]
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>

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
