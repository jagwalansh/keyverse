import { Link } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { Footer } from "@/components/ui/footer";
import { Navbar } from "@/components/ui/navbar";
import type { Article } from "@/lib/articles";
import { getRelatedArticles } from "@/lib/articles";

function formatDate(dateString: string) {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
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

  const relatedArticles = getRelatedArticles(article.slug, 3);

  return (
    <main className="relative flex min-h-screen flex-col items-center bg-background font-sans text-foreground">
      <Navbar />
      <ArticleJsonLd article={article} />

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

        {/* Author, date, reading time */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            {article.author}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <time dateTime={article.publishDate}>{formatDate(article.publishDate)}</time>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {article.readingTime} min read
          </span>
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-border/40 bg-card/45 px-2.5 py-1 text-[10px] font-mono font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <p className="mt-6 text-base leading-8 text-muted-foreground">{article.intro}</p>

        {/* Table of Contents */}
        <nav
          className="mt-8 rounded-xl border border-border/40 bg-card/30 p-5"
          aria-label="Table of contents"
        >
          <div className="mb-3 text-xs font-mono font-bold uppercase tracking-wider text-foreground">
            In this article
          </div>
          <ol className="space-y-2">
            {article.sections.map((section, index) => (
              <li key={section.heading}>
                <a
                  href={`#section-${index}`}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {section.heading}
                </a>
              </li>
            ))}
            {article.faqs.length > 0 && (
              <li>
                <a
                  href="#faq"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Frequently asked questions
                </a>
              </li>
            )}
          </ol>
        </nav>

        {/* Article sections */}
        <div className="mt-10 space-y-9">
          {article.sections.map((section, index) => (
            <section key={section.heading} id={`section-${index}`}>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">
                {section.heading}
              </h2>
              <p className="mt-3 text-sm leading-8 text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>

        {/* FAQ section */}
        {article.faqs.length > 0 && (
          <section id="faq" className="mt-12 border-t border-border/20 pt-8">
            <h2 className="text-xl font-semibold tracking-tight">Frequently Asked Questions</h2>
            <div className="mt-6 space-y-4">
              {article.faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-xl border border-border/40 bg-card/30 transition-colors open:bg-card/50"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-foreground transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                    <span>{faq.question}</span>
                    <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <div className="border-t border-border/30 px-5 py-4">
                    <p className="text-sm leading-7 text-muted-foreground">{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Related articles */}
        {relatedArticles.length > 0 && (
          <section className="mt-12 border-t border-border/20 pt-8">
            <h2 className="text-xl font-semibold tracking-tight">Related Articles</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {relatedArticles.map((related) => (
                <Link
                  key={related.slug}
                  to={related.path}
                  className="group flex flex-col rounded-xl border border-border/30 bg-card/35 p-4 transition-colors hover:border-primary/35 hover:bg-card/55"
                >
                  <h3 className="text-sm font-semibold tracking-tight transition-colors group-hover:text-primary">
                    {related.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {related.description}
                  </p>
                  <span className="mt-3 text-[10px] font-mono text-muted-foreground">
                    {related.readingTime} min read
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
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
