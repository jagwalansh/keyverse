import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/routes/-article-page";
import { getArticleBySlug } from "@/lib/articles";

const article = getArticleBySlug("why-lyrics-beat-random-text");

export const Route = createFileRoute("/articles/why-lyrics-beat-random-text")({
  head: () => ({
    meta: [
      { title: `${article?.title ?? "Lyrics Practice Article"} | KeyVerse` },
      {
        name: "description",
        content: article?.description ?? "KeyVerse rhythm typing article.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://keyverse.me/articles/why-lyrics-beat-random-text",
      },
    ],
  }),
  component: () => <ArticlePage article={article} />,
});
