import { Link } from "@tanstack/react-router";
import { Footer } from "@/components/ui/footer";
import { Navbar } from "@/components/ui/navbar";
import type { Article } from "@/lib/articles";
import { getRelatedArticles } from "@/lib/articles";

function formatDate(dateString: string) {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ArticleJsonLd({ article }: { article: Article }) {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    author: {
      "@type": "Person",
      name: article.author,
    },
    datePublished: article.publishDate,
    publisher: {
      "@type": "Organization",
      name: "KeyVerse",
      url: "https://keyverse.me",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://keyverse.me${article.path}`,
    },
  };

  const faqSchema =
    article.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </>
  );
}

export function ArticlePage({ article }: { article?: Article }) {
  if (!article) {
    return (
      <main className="relative flex min-h-screen flex-col items-center bg-background font-sans text-foreground">
        <Navbar />
        <div className="relative z-20 mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-left">
          <span className="font-mono text-xs text-primary uppercase font-bold">// error</span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Article not found</h1>
          <Link to="/articles" className="mt-4 font-mono text-xs font-bold text-primary hover:underline">
            [ &larr; back to articles ]
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const relatedArticles = getRelatedArticles(article.slug, 3);

  return (
    <main className="relative flex min-h-screen flex-col items-center bg-background font-sans text-foreground">
      <Navbar />
      <ArticleJsonLd article={article} />

      <div className="relative z-20 mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-left">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-border/30 pb-8">
          <div className="flex items-center justify-between gap-4">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              // article
            </span>
            <Link
              to="/articles"
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-border/40 bg-transparent px-3 py-1.5 text-xs font-mono text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>&larr; all articles</span>
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
            <span>by {article.author}</span>
            <span>•</span>
            <time dateTime={article.publishDate}>{formatDate(article.publishDate)}</time>
            <span>•</span>
            <span>{article.readingTime} min read</span>
          </div>

          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-border/30 px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Intro */}
        <p className="text-sm leading-relaxed text-muted-foreground font-sans">
          {article.intro}
        </p>

        {/* Table of Contents */}
        <nav
          className="rounded-lg border border-border/30 bg-transparent p-5 font-mono text-xs"
          aria-label="Table of contents"
        >
          <span className="font-bold text-foreground uppercase tracking-wider block mb-3">
            # in this article
          </span>
          <ol className="space-y-2">
            {article.sections.map((section, index) => (
              <li key={section.heading}>
                <a
                  href={`#section-${index}`}
                  className="text-muted-foreground transition-colors hover:text-primary flex items-center gap-2"
                >
                  <span className="text-primary font-bold">0{index + 1}.</span>
                  <span>{section.heading}</span>
                </a>
              </li>
            ))}
            {article.faqs.length > 0 && (
              <li>
                <a
                  href="#faqs"
                  className="text-muted-foreground transition-colors hover:text-primary flex items-center gap-2"
                >
                  <span className="text-primary font-bold">0{article.sections.length + 1}.</span>
                  <span>Frequently Asked Questions</span>
                </a>
              </li>
            )}
          </ol>
        </nav>

        {/* Content Sections */}
        <div className="space-y-10">
          {article.sections.map((section, index) => (
            <section
              key={section.heading}
              id={`section-${index}`}
              className="scroll-mt-24 border-t border-border/20 pt-8"
            >
              <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
                # 0{index + 1}
              </span>
              <h2 className="mt-1 text-xl font-bold text-foreground tracking-tight">
                {section.heading}
              </h2>
              <div className="mt-4 space-y-4 text-xs sm:text-sm leading-relaxed text-muted-foreground font-sans">
                <p>{section.body}</p>
              </div>
            </section>
          ))}

          {/* FAQs */}
          {article.faqs.length > 0 && (
            <section id="faqs" className="scroll-mt-24 border-t border-border/20 pt-8">
              <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
                # faqs
              </span>
              <h2 className="mt-1 text-xl font-bold text-foreground tracking-tight">
                Frequently Asked Questions
              </h2>
              <div className="mt-5 space-y-4">
                {article.faqs.map((faq, fIndex) => (
                  <div
                    key={fIndex}
                    className="rounded-lg border border-border/30 bg-transparent p-5"
                  >
                    <h3 className="font-mono text-xs font-bold text-foreground uppercase">
                      {faq.question}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-sans">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="border-t border-border/20 pt-10">
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              # related guides
            </span>
            <h2 className="mt-1 text-lg font-bold text-foreground">Continue Reading</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.slug}
                  to={rel.path}
                  className="group flex flex-col justify-between rounded-lg border border-border/30 bg-transparent p-4 transition-colors hover:bg-secondary/20"
                >
                  <div>
                    <span className="font-mono text-[10px] text-muted-foreground">{rel.readingTime} min read</span>
                    <h3 className="mt-1 font-mono text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      {rel.title}
                    </h3>
                  </div>
                  <span className="mt-3 font-mono text-[11px] text-primary group-hover:underline">
                    [ read &rarr; ]
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

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
